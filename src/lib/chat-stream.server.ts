// CERTIFIED_100=false | unique_human_proven=false | DEBUG
import { createClient } from "@supabase/supabase-js";
import { streamText, convertToModelMessages, type UIMessage } from "ai";
import { withLovableAiGatewayRunIdHeader } from "./gateway/provider.server";
import { createLovableAiGatewayRunIdFetch } from "./gateway/run-id.server";
import type { Database, Json } from "@/integrations/supabase/types";
import { z } from "zod";
export async function handleChatStream(request: Request) {
  const url = process.env["SUPABASE_URL"]; const key = process.env["SUPABASE_PUBLISHABLE_KEY"]; const aiKey = process.env["LOVABLE_API_KEY"];
  const authorization = request.headers.get("Authorization");
  if(!url || !key || !aiKey) return Response.json({ error: "Configuration manquante." }, {status: 500});
  if(!authorization?.startsWith("Bearer ")) return Response.json({ error: "Connexion requise." }, {status: 401});
  const sb = createClient<Database>(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:authorization},fetch:(input,init)=>{const h=new Headers(init?.headers);h.set("apikey",key);return fetch(input,{...init,headers:h});}}});
  const {data:claims,error:authError} = await sb.auth.getClaims(authorization.slice(7)); const userId = claims?.claims.sub;
  if(authError || !userId) return Response.json({error:"Session expirée."},{status:401});
  const parsed = z.object({ conversationId:z.string().uuid(), messages:z.array(z.object({id:z.string().min(1).max(200),role:z.enum(["user","assistant"]),parts:z.array(z.union([z.object({type:z.literal("text"),text:z.string().max(100000)}),z.object({type:z.literal('file'),mediaType:z.enum(['image/png','image/jpeg','image/webp']),url:z.string().max(14000000).regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/)})])).min(1)})).min(1) }).safeParse(await request.json().catch(()=>null));
  if(!parsed.success) return Response.json({error:"Message invalide."},{status:400});
  const {conversationId} = parsed.data; const messages = parsed.data.messages as UIMessage[];
  const {data:conversation} = await sb.from("conversations").select("id,project_id").eq("id",conversationId).eq("user_id",userId).single();
  if(!conversation) return Response.json({error:"Conversation introuvable."},{status:404});
  const latest = messages.at(-1); if(!latest || latest.role !== "user") return Response.json({error:"Message utilisateur requis."},{status:400});
  const text = latest.parts.filter(p=>p.type==="text").map(p=>p.text).join("\n");
  const {data:existing} = await sb.from("messages").select("id").eq("conversation_id",conversationId).eq("client_message_id",latest.id).maybeSingle();
  const {error:saveUser} = existing ? {error:null} : await sb.from("messages").insert({conversation_id:conversationId,user_id:userId,role:"user",content:text,client_message_id:latest.id,metadata:{parts:latest.parts as unknown as Json}});
  if(saveUser) return Response.json({error:"Message non enregistré."},{status:500});
  // Only authorized, persisted turns are context. Pending human captions never leak into the active request.
  const {data:past,error:historyError}=await sb.from('messages').select('id,role,content,metadata,client_message_id').eq('conversation_id',conversationId).eq('user_id',userId).order('created_at');
  if(historyError) return Response.json({error:'Historique indisponible.'},{status:500});
  const contextMessages: UIMessage[]=(past??[]).map(m=>({id:m.client_message_id??m.id,role:m.role as 'user'|'assistant',parts:typeof m.metadata==='object'&&m.metadata!==null&&!Array.isArray(m.metadata)&&Array.isArray(m.metadata['parts'])?m.metadata['parts'] as unknown as UIMessage['parts']:[{type:'text',text:m.content}]}));
  const {data:memory} = await sb.from("memories").select("content").eq("user_id",userId).filter("project_id",conversation.project_id?"eq":"is",conversation.project_id??null).limit(50);
  const {callARTcB}=await import("./artcb.server");
  const artcb=await callARTcB(text,userId,conversationId,request.signal);
  if(request.signal.aborted) return new Response(null,{status:499});
  const provider = createLovableAiGatewayRunIdFetch();
  // Inject built-in search after SDK serialization; preserve run correlation and cancellation.
  const searchProvider = (await import("@ai-sdk/openai-compatible")).createOpenAICompatible({name:"lovable",baseURL:"https://ai.gateway.lovable.dev/v1",headers:{"Lovable-API-Key":aiKey,"X-Lovable-AIG-SDK":"vercel-ai-sdk"},fetch:async(input,init)=>{const body=JSON.parse(String(init?.body));body.tools=[{type:"google_search"}];return provider.fetch(input,{...init,body:JSON.stringify(body)});}});
  const started = Date.now();
  const result = streamText({ model:searchProvider.chatModel("google/gemini-3-flash-preview"), maxRetries:2, abortSignal:request.signal,
    system:`Tu es MAVAI, assistant de production audiovisuelle. Date UTC: ${new Date().toISOString()}. Recherche sur Google toute actualité et cite des liens sans prétendre qu’ils sont vérifiés. Mémoire utilisateur: ${(memory??[]).map(m=>m.content).join("\n")}. Préserve le contrôle artistique humain. Tu ne peux pas inspecter ni modifier ton code source, déployer, gérer les secrets ou contacter des services sans outil explicite. Tu peux analyser les images jointes, répondre, rechercher et préparer des propositions. Ne prétends jamais avoir exécuté une action sans résultat d’outil. Les modèles, tokens et mémoires doivent être ceux réellement communiqués, jamais inventés.`,
    messages:await convertToModelMessages(contextMessages),
  });
  const response = result.toUIMessageStreamResponse({originalMessages:messages,generateMessageId:()=>crypto.randomUUID(),sendReasoning:false,
    messageMetadata:({part})=>part.type==="start"?{provider:"Lovable AI",artcbStored:artcb?.stored??false,memoryCount:memory?.length??0,startedAt:new Date(started).toISOString(),stage:"generation"}:part.type==="finish-step"?{model:part.response.modelId}:part.type==="finish"?{provider:"Lovable AI",durationMs:Date.now()-started,tokens:part.totalUsage.totalTokens??null,stage:"completed"}:undefined,
    onFinish:async({responseMessage,isAborted})=>{if(isAborted)return;try{const answer=responseMessage.parts.filter(p=>p.type==="text").map(p=>p.text).join("");if(!answer)throw new Error("Aucune réponse générée.");const usage=await result.totalUsage;const metadata={provider:"Lovable AI",model:(await result.response).modelId??null,tokens:usage.totalTokens??null,memoryCount:memory?.length??0,durationMs:Date.now()-started,parts:responseMessage.parts as unknown as Json};const {error}=await sb.from("messages").insert({conversation_id:conversationId,user_id:userId,role:"assistant",content:answer,client_message_id:responseMessage.id,metadata});if(error){console.error('[chat] persistence failure',error.code);throw new Error("Réponse non enregistrée.");}const {error:update}=await sb.from("conversations").update({updated_at:new Date().toISOString()}).eq("id",conversationId).eq("user_id",userId);if(update)throw new Error("Historique non actualisé.");console.debug("[chat] stream persisted");}catch(error){console.error('[chat] finish failure',error instanceof Error?error.message:'unknown');throw error;}},
    onError:(error)=>error instanceof Error?error.message:"Le service IA a interrompu la réponse.",
  });
  return withLovableAiGatewayRunIdHeader(response,provider,{"Cache-Control":"no-store"},{waitForUpstreamHeaders:false});
}