// Pure helpers for the separated, versioned production tree.
export const nodeKinds = ["sequence","scene","shot","take","layer","character","decor","prop","style"] as const;
export type NodeKind = typeof nodeKinds[number];
export const kindLabels: Record<NodeKind,string> = { sequence:"Séquence", scene:"Scène", shot:"Plan", take:"Prise", layer:"Couche", character:"Personnage", decor:"Décor", prop:"Accessoire", style:"Ambiance / couleur" };
export const childKinds: Record<NodeKind, NodeKind[]> = { sequence:["scene"], scene:["shot"], shot:["take","layer"], take:["layer"], layer:["layer"], character:[], decor:[], prop:[], style:[] };
export const rootStoryKinds: NodeKind[] = ["sequence"];
export const bibleKinds: NodeKind[] = ["character","decor","prop","style"];
export const layerTypes = ["Image","Personnage","Décor","Accessoire","Caméra","Lumière","Couleur","Effet","Voix (réplique)","Musique","Bruitage","Ambiance sonore","Sous-titre"] as const;
export const durationPresets = [{label:"30 s",seconds:30},{label:"1 min",seconds:60},{label:"3 min",seconds:180},{label:"10 min",seconds:600},{label:"30 min",seconds:1800}] as const;
export function toSeconds(minutes: number, seconds: number) {
  const total = Math.floor(minutes) * 60 + Math.floor(seconds);
  if (!Number.isFinite(total) || total <= 0 || total > 86400 || minutes < 0 || seconds < 0) return null;
  return total;
}
export function formatDuration(total: number | null | undefined) {
  if (!total) return "Non définie";
  const h = Math.floor(total / 3600), m = Math.floor((total % 3600) / 60), s = total % 60;
  return [h ? `${h} h` : "", m ? `${m} min` : "", s ? `${s} s` : ""].filter(Boolean).join(" ");
}
export function canHaveChild(parent: NodeKind | null, child: NodeKind) {
  return parent === null ? rootStoryKinds.includes(child) || bibleKinds.includes(child) : childKinds[parent].includes(child);
}
