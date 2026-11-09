// CERTIFIED_100=false | unique_human_proven=false | DEBUG
import { z } from "zod";
export const characterSchema = z.object({ name: z.string().trim().min(1).max(160), appearance: z.string().max(8000), costume: z.string().max(4000), palette: z.string().max(1000), rules: z.string().max(8000), reference: z.string().max(8000000).refine(v => !v || /^data:image\/(png|jpeg|webp);base64,/.test(v), "Référence invalide") });
export type CharacterRecord = z.infer<typeof characterSchema>;
export function characterPrompt(c: CharacterRecord) { return `Fiche de personnage : ${c.name}\nApparence : ${c.appearance}\nCostume : ${c.costume}\nPalette : ${c.palette}\nContraintes de continuité : ${c.rules}`; }