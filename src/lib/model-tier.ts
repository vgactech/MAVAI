// Cheap model for every turn; advanced model only for an explicit final review/certification or when the cheap one fails.
const FINAL_REVIEW = /(r[ée]vision finale|revue finale|relecture finale|validation finale|certifi)/i;
export function wantsAdvancedModel(text: string): boolean { return FINAL_REVIEW.test(text); }
