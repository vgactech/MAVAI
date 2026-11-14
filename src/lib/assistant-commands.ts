// Deterministic order router shared by text and voice input. The LLM never decides state toggles.
export type AssistantCommandId =
  | "silence" | "voice_on" | "mic_off" | "mode_dr" | "mode_av" | "stop" | "repeat" | "new_conversation" | "open_bnb";
export type AssistantCommand = { id: AssistantCommandId; ack: string };

const normalize = (text: string) =>
  text.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’']/g, " ").replace(/[^a-z0-9 ]+/g, " ").replace(/\s+/g, " ").trim();

const RULES: Array<{ id: AssistantCommandId; ack: string; patterns: RegExp[] }> = [
  { id: "silence", ack: "Oui chef, je passe en mode silence.", patterns: [/^(passe |active |mets? )?(en )?mode silence$/, /^silence$/, /^tais toi$/, /^coupe (la )?voix$/] },
  { id: "voice_on", ack: "Oui chef, la voix est réactivée.", patterns: [/^reactive (la )?voix$/, /^(re)?active la reponse vocale$/, /^parle( a nouveau)?$/] },
  { id: "mic_off", ack: "Oui chef, je coupe le micro. Pour reprendre, cliquez sur le micro.", patterns: [/^coupe (le )?micro$/, /^desactive (le )?micro$/] },
  { id: "mode_dr", ack: "Oui chef, je passe en mode DR MANATHAN.", patterns: [/^(passe |bascule )?(en )?mode (docteur |dr |doctor )?manathan$/, /^(passe |bascule )?(en )?mode dr manathan$/] },
  { id: "mode_av", ack: "Oui chef, retour à MAVAI audiovisuel.", patterns: [/^retour (a )?mavai$/, /^(passe |bascule )?(en )?mode (mavai|audiovisuel)$/] },
  { id: "stop", ack: "Oui chef, j’arrête.", patterns: [/^(arrete|stop|stoppe)( tout)?$/] },
  { id: "repeat", ack: "Oui chef, je répète.", patterns: [/^repete( ca)?$/, /^tu peux repeter$/] },
  { id: "new_conversation", ack: "Oui chef, nouvelle conversation.", patterns: [/^nouvelle conversation$/, /^(ouvre|cree) une nouvelle conversation$/] },
  { id: "open_bnb", ack: "Oui chef, j’ouvre le poste BNB.", patterns: [/^ouvre (le )?(poste |desk |trading )?bnb$/, /^(mode |passe en )?trading bnb$/] },
];

/** Returns a command only when the WHOLE utterance is an order (optional "mavai,"/"dr manathan," prefix and "s'il te plaît"). Quoted words never trigger. */
export function parseCommand(raw: string): AssistantCommand | null {
  if (/["«»“”]/.test(raw)) return null;
  let text = normalize(raw);
  text = text.replace(/^(mavai|dr manathan|docteur manathan|chef)\s+/, "").replace(/\s+(s il te plait|s il vous plait|stp|svp)$/, "").trim();
  if (!text || text.split(" ").length > 7) return null;
  for (const rule of RULES) if (rule.patterns.some(p => p.test(text))) return { id: rule.id, ack: rule.ack };
  return null;
}
