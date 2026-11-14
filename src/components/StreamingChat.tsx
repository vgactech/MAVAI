// CERTIFIED_100=false | unique_human_proven=false | DEBUG
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport, type UIMessage, type FileUIPart } from 'ai';
import type { MavaiUIMessage } from '@/lib/chat-steps';
import { ReasoningPanel } from './ReasoningPanel';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useServerFn } from '@tanstack/react-start';
import { supabase } from '@/integrations/supabase/client';
import { saveStoppedAnswer } from '@/lib/chat.functions';
import { createConversation } from '@/lib/conversation.functions';
import { parseCommand, parseTrailingCommand, type AssistantCommand } from '@/lib/assistant-commands';
import { getConversationMode, setConversationMode, logCommandEvent, type AssistantMode } from '@/lib/assistant-mode.functions';
import { speechChunks } from '@/lib/voice-text';
import { VoiceSession, type VoicePhase } from './voice/voice-session';
import { AudioTracks } from './voice/AudioTracks';
import { ChatDiodes } from './ChatDiodes';
import { AnswerAudio, CopyAnswer, SelectionBubble } from './AnswerTools';
import { Button } from './ui/button';
import { Switch } from './ui/switch';
import { Mic, MicOff, Play, Square, Paperclip, X, Volume2, VolumeX } from 'lucide-react';
import { Conversation, ConversationContent, ConversationScrollButton } from './ai-elements/conversation';
import { Message, MessageContent, MessageResponse } from './ai-elements/message';
import { PromptInput, PromptInputTextarea, PromptInputFooter, PromptInputSubmit } from './ai-elements/prompt-input';
import { MavaiMark } from './MavaiMark';
import { toast } from 'sonner';
import { useSelectedProject } from './ProjectWorkspace';
import { useQueryClient } from '@tanstack/react-query';

const textOf = (m: UIMessage) => m.parts.filter(p => p.type === 'text').map(p => p.text).join('\n');
async function authHeaders(): Promise<Record<string,string>> {
  const {data} = await supabase.auth.getSession();
  if (!data.session) throw new Error('Session expirée. Reconnectez-vous.');
  return {Authorization:`Bearer ${data.session.access_token}`};
}
async function voiceRequest(body: BodyInit, signal: AbortSignal, json = false) {
  const response = await fetch('/api/voice',{method:'POST',body,signal,headers:{...await authHeaders(),...(json?{'Content-Type':'application/json'}:{})}});
  if (!response.ok) { const result = await response.json().catch(()=>null); throw new Error(result?.error ?? `Service vocal [${response.status}] indisponible.`); }
  return response;
}
export function StreamingChat({id,initialMessages,onConversation}:{id:string|null;initialMessages:MavaiUIMessage[];onConversation:(id:string)=>void}) {
  const owner = useRef(id);
  const projectId = useSelectedProject();
  const queryClient=useQueryClient();
  const sdkId=useRef(id ?? 'new-mavai');
  const create = useServerFn(createConversation);
  const saveStopped = useServerFn(saveStoppedAnswer);
  const [captions,setCaptions] = useState<MavaiUIMessage[]>([]);
  const [draft,setDraft] = useState('');
  const [files,setFiles] = useState<File[]>([]);
  const [voice,setVoice] = useState(false);
  const [microphone,setMicrophone] = useState(false);
  const [state,setState] = useState<{phase:VoicePhase;pending:number;muted:boolean;error:string|null;transcribing?:number}>({phase:'idle',pending:0,muted:false,error:null});
  const [mode,setMode] = useState<AssistantMode>('audiovisual');
  const [speechOn,setSpeechOn] = useState(true);
  const getMode = useServerFn(getConversationMode); const saveMode = useServerFn(setConversationMode); const logCommand = useServerFn(logCommandEvent);
  useEffect(()=>{ if (id) void getMode({data:{conversationId:id}}).then(r=>setMode(r.mode)).catch(()=>{}); },[id]);
  const modeRef = useRef(mode); modeRef.current = mode;
  async function applyMode(next: AssistantMode) {
    setMode(next);
    if (owner.current) await saveMode({data:{conversationId:owner.current,mode:next}}).catch(e=>toast.error(e instanceof Error?e.message:'Mode non enregistré.'));
  }
  const [nodes,setNodes] = useState<{human:AnalyserNode|null;assistant:AnalyserNode|null}|null>(null);
  const controller = useRef<VoiceSession|null>(null);
  const audio = useRef<HTMLAudioElement|null>(null);
  const fileInput = useRef<HTMLInputElement>(null);
  const thread = useRef<HTMLDivElement>(null);
  const completion = useRef<{resolve:(m:UIMessage)=>void;reject:(e:Error)=>void}|null>(null);
  const transport = useMemo(()=>new DefaultChatTransport({api:'/api/chat',headers:authHeaders,// History is reloaded from the database on the server; only the newest user turn travels.
    prepareSendMessagesRequest:({messages,...rest})=>({body:{...rest,conversationId:owner.current,messages:messages.slice(-1)}})}),[]);
  const chat = useChat<MavaiUIMessage>({id:sdkId.current,messages:initialMessages,transport,
    onError:e=>{completion.current?.reject(e);completion.current=null;},
    onFinish:({message,isAbort,isError})=>{
      if (isAbort && owner.current && textOf(message)) void saveStopped({data:{conversationId:owner.current,id:message.id,content:textOf(message)}}).catch(e=>toast.error(e.message));
      if (isAbort || isError) completion.current?.reject(new Error(isAbort?'Réponse arrêtée.':'La génération a échoué.'));
      else completion.current?.resolve(message);
      completion.current=null;
      void queryClient.invalidateQueries({queryKey:['project-conversations']});
    },
  });
  const current = useRef({chat,create,onConversation}); current.current={chat,create,onConversation};
  const busy = state.pending > 0;
  const stop = () => {
    controller.current?.stop(); controller.current=null;
    audio.current?.remove();audio.current=null;
    current.current.chat.stop();completion.current?.reject(new Error('Session arrêtée.'));completion.current=null;
    setMicrophone(false);setNodes(null);
  };
  useEffect(()=>()=>{
    controller.current?.stop();audio.current?.remove();current.current.chat.stop();completion.current?.reject(new Error('Conversation changée.'));completion.current=null;
  },[]);
  useEffect(()=>{if (!busy) document.querySelector<HTMLTextAreaElement>('textarea[aria-label="Message"]')?.focus();},[busy]);
  function ensureController() {
    if (controller.current) return controller.current;
    const element=document.createElement('audio');element.hidden=true;document.body.append(element);audio.current=element;
    const session=new VoiceSession(element,{
      transcribe:async(blob,signal)=>{const form=new FormData();form.set('audio',blob,'voice');return (await (await voiceRequest(form,signal)).json()).text;},
      answer:async(text,signal,messageId,spoken,attachments)=>{
        if (!owner.current) {
          const row=await current.current.create({data:{projectId}});
          if (signal.aborted) throw new DOMException('Stopped','AbortError');
          owner.current=row.id;
          if (modeRef.current!=='audiovisual') await saveMode({data:{conversationId:row.id,mode:modeRef.current}}).catch(()=>{});
          current.current.onConversation(row.id);
        }
        const result=new Promise<UIMessage>((resolve,reject)=>{completion.current={resolve,reject};});
        // The pending caption becomes exactly one SDK user message; other pending turns never enter the request history.
        setCaptions(p=>p.filter(m=>m.id!==messageId));
        void current.current.chat.sendMessage({id:messageId,role:'user',parts:[{type:'text',text},...(attachments ?? [])]}).catch(e=>{completion.current?.reject(e);completion.current=null;});
        const reply=await result;
        if (signal.aborted) throw new DOMException('Stopped','AbortError');
        const answer=textOf(reply); const urls:string[]=[];
        try {
          if (spoken) for (const chunk of speechChunks(answer)) {
            const response=await voiceRequest(JSON.stringify({text:chunk}),signal,true);
            urls.push(URL.createObjectURL(await response.blob()));
          }
          if (signal.aborted) throw new DOMException('Stopped','AbortError');
          return {text:answer,audioUrls:urls};
        } catch (error) {urls.forEach(url=>URL.revokeObjectURL(url));throw error;}
      },
      onTranscript:(messageId,role,text)=>setCaptions(p=>p.some(m=>m.id===messageId)?p:[...p,{id:messageId,role,parts:[{type:'text',text}]}]),
      onState:setState,onAnalysers:setNodes,
      command:(text,source,messageId,duringSpeech)=>{const cmd=duringSpeech?parseTrailingCommand(text):parseCommand(text); if(!cmd) return false; void runCommand(cmd,source,messageId,text); return true;},
    });
    controller.current=session;return session;
  }
  // Ack ("Oui chef…") is shown BEFORE the effect; it means "order understood", the result follows.
  async function runCommand(cmd: AssistantCommand, source: 'text'|'voice', messageId: string, said: string) {
    const correlationId = crypto.randomUUID(); const conv = owner.current;
    const log=(status:'acknowledged'|'succeeded'|'failed')=>void logCommand({data:{conversationId:conv,command:cmd.id,source,status,correlationId}}).catch(()=>{});
    const ackId = crypto.randomUUID();
    setCaptions(p=>[...p,{id:messageId,role:'user',parts:[{type:'text',text:said}]},{id:ackId,role:'assistant',parts:[{type:'text',text:cmd.ack}]}]);
    log('acknowledged');
    const session = controller.current;
    const urgent = cmd.id==='silence' || cmd.id==='stop' || cmd.id==='mic_off';
    if (!urgent && session?.speechEnabled && (voice || microphone)) void voiceRequest(JSON.stringify({text:cmd.ack}),new AbortController().signal,true).then(r=>r.blob()).then(b=>session.speakNow(URL.createObjectURL(b))).catch(()=>{});
    const result=(text:string)=>setCaptions(p=>[...p,{id:crypto.randomUUID(),role:'assistant',parts:[{type:'text',text}]}]);
    try {
      switch (cmd.id) {
        case 'silence': session?.setSpeech(false); setSpeechOn(false); result(microphone?'Sortie vocale coupée. Le micro reste à l’écoute : dites « réactive la voix » pour reprendre.':'Sortie vocale coupée. Les réponses restent écrites.'); break;
        case 'voice_on': session?.setSpeech(true); setSpeechOn(true); setVoice(true); result('Voix réactivée.'); break;
        case 'mic_off': session?.mute(true); result('Micro coupé. Pour reprendre, cliquez sur l’icône micro (aucun réveil vocal possible micro coupé).'); break;
        case 'mode_dr': await applyMode('dr_manathan'); result('Mode DR MANATHAN actif : assistant généraliste, recherche, données et poste BNB.'); break;
        case 'mode_av': await applyMode('audiovisual'); result('Mode MAVAI audiovisuel actif.'); break;
        case 'stop': current.current.chat.stop(); session?.setSpeech(false); session?.setSpeech(speechOn); result('Réponse en cours arrêtée.'); break;
        case 'repeat': { const last=[...current.current.chat.messages].reverse().find(m=>m.role==='assistant'); if(!last){result('Rien à répéter pour l’instant.');break;} const t=textOf(last); result(t); if(session?.speechEnabled) for (const chunk of speechChunks(t)) { const r=await voiceRequest(JSON.stringify({text:chunk}),new AbortController().signal,true); await session.speakNow(URL.createObjectURL(await r.blob())); } break; }
        case 'new_conversation': window.location.assign('/chat'+(projectId?`?project=${projectId}`:'')); break;
        case 'open_bnb': window.location.assign('/bnb'); break;
      }
      log('succeeded');
    } catch (e) { log('failed'); result(`Échec de l’ordre : ${e instanceof Error?e.message:'erreur inconnue'}`); }
  }
  async function startMicrophone() {
    if (microphone) return;
    try {setMicrophone(true);await ensureController().start();}
    catch {stop();setState(p=>({...p,error:'Micro inaccessible. Autorisez le microphone dans votre navigateur.'}));}
  }
  async function submit() {
    const content=draft.trim() || (files.length?'Analyse ces images.':'');
    if (!content) return;
    try {
      const attachments:FileUIPart[]=await Promise.all(files.map(f=>new Promise<FileUIPart>((resolve,reject)=>{const reader=new FileReader();reader.onerror=reject;reader.onload=()=>resolve({type:'file',mediaType:f.type,url:String(reader.result)});reader.readAsDataURL(f);})));
      const session=ensureController();
      if (voice || microphone) await session.prepareAudio();
      session.enqueueText(content,voice || microphone,attachments);
      setDraft('');setFiles([]);
    } catch(e) {toast.error(e instanceof Error?e.message:'Envoi impossible.');}
  }
  const phases={idle:'Au repos',listening:'Micro actif',generating:'Génération en cours',speaking:'MAVAI parle','playback-blocked':'Lecture à autoriser',error:'En pause'};
  const visible=[...chat.messages,...captions.filter(m=>!chat.messages.some(x=>x.id===m.id))];
  return <>
    <SelectionBubble container={thread}/>
    <div ref={thread} className="flex min-h-0 flex-1 flex-col"><Conversation className="min-h-0 flex-1"><ConversationContent className="mx-auto w-full max-w-3xl">
      {!visible.length && <div className="flex flex-col items-center gap-4 py-12 text-center"><MavaiMark className="size-12"/><h1 className="text-xl font-semibold">{mode==='dr_manathan'?'DR MANATHAN à vos ordres.':'Bonjour, Gabriel. Que préparons-nous ?'}</h1><p className="max-w-md text-xs text-muted-foreground">Ordres texte ou voix : « mode silence », « réactive la voix », « coupe le micro », « passe en mode DR MANATHAN », « retour à MAVAI », « arrête », « répète », « nouvelle conversation », « ouvre le poste BNB ».</p></div>}
      {visible.map((m,index)=>{const live=m.role==='assistant'&&index===visible.length-1&&(chat.status==='streaming'||chat.status==='submitted');const meta=(m.metadata ?? null) as Record<string,unknown>|null;
        return <Message key={m.id} from={m.role}><MessageContent className="group-[.is-assistant]:w-full">
          {m.role==='assistant'&&<ReasoningPanel parts={m.parts} live={live}/>}
          {m.parts.map((p,i)=>p.type==='text'?<MessageResponse key={i}>{p.text}</MessageResponse>:p.type==='file'&&p.mediaType.startsWith('image/')?<img key={i} src={p.url} alt="Image jointe" className="max-h-60 max-w-full rounded-md"/>:p.type==='source-url'?<a key={i} href={p.url} target="_blank" rel="noreferrer" className="text-sm underline">{p.title ?? p.url}</a>:null)}
        {m.role==='assistant'&&!live&&textOf(m)&&<AnswerAudio key={`a-${m.id}`} text={textOf(m)}/>}
        </MessageContent>{m.role==='assistant'&&!live&&textOf(m)&&<div className="-mt-1 flex"><CopyAnswer text={textOf(m)}/></div>}{m.role==='assistant'&&meta&&!live&&<p className="text-xs text-muted-foreground">{String(meta["model"] ?? 'Modèle non communiqué')} · {typeof meta["tokens"]==='number'?`${meta["tokens"]} tokens`:'Tokens non communiqués'} · {typeof meta["memoryCount"]==='number'?`${meta["memoryCount"]} mémoires`:'Mémoires non communiquées'}{meta["stopped"]?' · Arrêtée':''}</p>}</Message>;})}
      {chat.status==='submitted'&&visible.at(-1)?.role!=='assistant'&&<Message from="assistant"><MessageContent className="group-[.is-assistant]:w-full"><ReasoningPanel parts={[]} live/></MessageContent></Message>}
    </ConversationContent><ConversationScrollButton/></Conversation></div>
    <footer className="border-t border-border px-3 py-2"><div className="mx-auto max-w-3xl space-y-2">
      <ChatDiodes running={busy||chat.status==='streaming'||chat.status==='submitted'} failed={chat.status==='error'||state.phase==='error'}/>
      <div className="flex flex-wrap items-center gap-2">
        <div role="group" aria-label="Mode de l’assistant" className="flex rounded-md border border-border p-0.5 text-xs">
          <button type="button" aria-pressed={mode==='audiovisual'} onClick={()=>void applyMode('audiovisual')} className={`rounded px-2 py-0.5 ${mode==='audiovisual'?'bg-primary text-primary-foreground':'text-muted-foreground'}`}>MAVAI</button>
          <button type="button" aria-pressed={mode==='dr_manathan'} onClick={()=>void applyMode('dr_manathan')} className={`rounded px-2 py-0.5 ${mode==='dr_manathan'?'bg-primary text-primary-foreground':'text-muted-foreground'}`}>DR MANATHAN</button>
        </div>
        {(voice||microphone)&&<Button type="button" size="icon-sm" variant="ghost" aria-label={speechOn?'Mode silence':'Réactiver la voix'} onClick={()=>{const next=!speechOn;setSpeechOn(next);controller.current?.setSpeech(next);}}>{speechOn?<Volume2 className="size-4"/>:<VolumeX className="size-4"/>}</Button>}
        {microphone&&<Button type="button" size="icon-sm" variant="ghost" aria-label={state.muted?'Réactiver le micro':'Couper le micro'} onClick={()=>controller.current?.mute(!state.muted)}>{state.muted?<MicOff className="size-4"/>:<Mic className="size-4"/>}</Button>}
        {(microphone||busy)&&<Button type="button" size="icon-sm" variant="destructive" aria-label="Arrêter la session" onClick={stop}><Square className="size-4"/></Button>}
        <span role="status" className="min-w-0 flex-1 text-xs text-muted-foreground">{state.error ?? phases[state.phase]}{state.transcribing?' · Transcription en cours':''}{state.pending>1?` · ${state.pending-1} en attente (maximum 10)`:''}</span>
        {state.phase==='playback-blocked'&&<Button type="button" size="sm" variant="outline" onClick={()=>controller.current?.resumePlayback()}><Play className="size-4"/>Lire la réponse</Button>}
        {state.phase==='error'&&<Button type="button" size="sm" variant="outline" onClick={()=>controller.current?.resumePending()}>Continuer la file</Button>}
      </div>
      {files.length>0&&<div className="flex flex-wrap gap-2">{files.map((f,i)=><div key={i} className="flex items-center text-xs"><span className="max-w-40 truncate">{f.name}</span><Button size="icon-xs" variant="ghost" aria-label={`Retirer ${f.name}`} onClick={()=>setFiles(p=>p.filter((_,j)=>i!==j))}><X className="size-3"/></Button></div>)}</div>}
      <div className={microphone || voice ? 'voice-composer' : ''}>{(microphone || voice)&&<AudioTracks assistant={nodes?.assistant ?? null} human={nodes?.human ?? null}/>}<PromptInput onSubmit={()=>void submit()}><PromptInputTextarea aria-label="Message" placeholder={mode==='dr_manathan'?'Ordre ou question pour DR MANATHAN… (ex. « mode silence »)':'Écrivez à MAVAI…'} value={draft} onChange={e=>setDraft(e.target.value)}/><PromptInputFooter>
        <input ref={fileInput} type="file" accept="image/png,image/jpeg,image/webp" hidden multiple onChange={e=>{const incoming=Array.from(e.target.files ?? []);if(incoming.some(f=>f.size>8*1024*1024))toast.error('Image trop lourde (8 Mo maximum).');else setFiles(p=>[...p,...incoming].slice(0,5));e.target.value='';}}/>
        <Button type="button" size="icon-sm" variant="ghost" aria-label="Joindre une image" onClick={()=>fileInput.current?.click()}><Paperclip className="size-4"/></Button>
        <label className="flex items-center gap-2 text-xs text-muted-foreground"><Switch checked={voice} onCheckedChange={setVoice} aria-label="Réponse vocale"/>Réponse vocale</label><div className="flex-1"/>
        <Button type="button" size="icon-sm" variant={microphone?'secondary':'ghost'} aria-label="Activer le vocal" disabled={microphone} onClick={()=>void startMicrophone()}><Mic className="size-4"/></Button>
        <PromptInputSubmit aria-label="Envoyer" disabled={!draft.trim()&&!files.length} />
      </PromptInputFooter></PromptInput></div>
    </div></footer>
  </>;
}
