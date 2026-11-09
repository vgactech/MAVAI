// CERTIFIED_100=false | unique_human_proven=false | DEBUG
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from 'zod';
export const createConversation = createServerFn({method:"POST"}).middleware([requireSupabaseAuth]).inputValidator((d:unknown)=>z.object({projectId:z.string().uuid().optional()}).parse(d??{})).handler(async({context,data:input})=>{const {data,error}=await context.supabase.from("conversations").insert({title:"Nouvelle conversation",project_id:input.projectId??null,user_id:context.userId}).select("id").single();if(error)throw new Error("Création impossible.");return data;});