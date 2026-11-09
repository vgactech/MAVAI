import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/integrations/supabase/types';
import { AiError, synthesizeSpeech, transcribe } from './mavai-ai.server';

export async function handleVoice(request: Request) {
  const url = process.env['SUPABASE_URL']; const key = process.env['SUPABASE_PUBLISHABLE_KEY'];
  const authorization = request.headers.get('Authorization');
  if (!authorization?.startsWith('Bearer ')) return Response.json({error:'Connexion requise.'},{status:401});
  if (!url || !key) return Response.json({error:'Configuration manquante.'},{status:500});
  const sb = createClient<Database>(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{headers:{Authorization:authorization},fetch:(input,init)=>{const headers=new Headers(init?.headers);headers.set('apikey',key);return fetch(input,{...init,headers});}}});
  const {data,error} = await sb.auth.getClaims(authorization.slice(7));
  if (error || !data?.claims.sub) return Response.json({error:'Session expirée.'},{status:401});
  try {
    if (Number(request.headers.get('content-length') ?? 0) > 14000000) return Response.json({error:'Audio trop volumineux.'},{status:413});
    if (request.headers.get('content-type')?.includes('multipart/form-data')) {
      const form = await request.formData(); const file = form.get('audio');
      if (!(file instanceof File) || !file.type.startsWith('audio/') || file.size > 10000000 || !file.size) return Response.json({error:'Enregistrement invalide.'},{status:400});
      const text = await transcribe(Buffer.from(await file.arrayBuffer()).toString('base64'),file.type,request.signal);
      return Response.json({text},{headers:{'Cache-Control':'no-store'}});
    }
    const body = await request.json() as {text?: unknown};
    if (typeof body.text !== 'string' || !body.text.trim() || body.text.length > 4500) return Response.json({error:'Segment vocal invalide.'},{status:400});
    return new Response(await synthesizeSpeech(body.text,request.signal),{headers:{'Content-Type':'audio/mpeg','Cache-Control':'no-store'}});
  } catch (error) {
    if (request.signal.aborted) return new Response(null,{status:499});
    return Response.json({error:error instanceof AiError ? error.message : 'Service vocal indisponible.'},{status:error instanceof AiError ? error.status : 500});
  }
}