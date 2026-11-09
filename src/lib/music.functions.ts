import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
export const composeMusic=createServerFn({method:"POST"}).middleware([requireSupabaseAuth])
 .inputValidator((d:unknown)=>z.object({id:z.string().uuid(),projectId:z.string().uuid(),prompt:z.string().trim().min(3).max(4000)}).parse(d))
 .handler(async({context,data})=>{
  const {data:existing}=await context.supabase.from("production_items").select("data").eq("id",data.id).eq("user_id",context.userId).maybeSingle();
  if(existing)return existing.data as {status:string;audio?:string;error?:string};
  const {error:claim}=await context.supabase.from("production_items").insert({id:data.id,project_id:data.projectId,user_id:context.userId,kind:"audio",title:data.prompt.slice(0,160),content:data.prompt,data:{status:"composing"}});
  if(claim)throw new Error("Cette composition existe déjà ou le projet est inaccessible.");
  const key=process.env["LOVABLE_API_KEY"];
  let result:{status:string;audio?:string;error?:string};
  try{
   if(!key)throw new Error("Configuration IA manquante.");
   const response=await fetch("https://ai.gateway.lovable.dev/v1/music",{method:"POST",headers:{Authorization:`Bearer ${key}`,"Content-Type":"application/json"},body:JSON.stringify({model:"google/lyria-3-clip-preview",input:[{type:"user_input",content:[{type:"text",text:data.prompt}]}]})});
   if(!response.ok){const body=await response.json().catch(()=>({message:"Composition impossible."}));throw new Error(`${response.status} : ${body.message??body.error?.message??"Composition impossible."}`);}
   const bytes=await response.arrayBuffer();result={status:"ready",audio:`data:audio/mpeg;base64,${Buffer.from(bytes).toString("base64")}`};
  }catch(e){result={status:"failed",error:e instanceof Error?e.message:"Composition interrompue."};}
  const {error}=await context.supabase.from("production_items").update({data:result}).eq("id",data.id).eq("user_id",context.userId);
  if(error)throw new Error("Composition non conservée.");return result;
 });