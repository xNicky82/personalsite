// Söhne (Klim Type Foundry) — Spellbook's brand body typeface. Reused from the
// /legaljobs route so the font files aren't duplicated. Exposed as
// --font-sohne and applied to the /oura email-capture page.
export { sohne } from '../legaljobs/fonts'

// ABC Arizona Mix (Dinamo) is Spellbook's brand display face for titles. It's a
// licensed font we can't redistribute from this standalone demo, so it's
// referenced by name with a graceful serif fallback: on Spellbook properties
// where Arizona is loaded the title renders in Arizona; everywhere else it
// degrades to a clean serif that still reads as a display heading.
export const ARIZONA_STACK =
  "'ABC Arizona Mix', 'ABC Arizona', 'Arizona', Georgia, 'Times New Roman', serif"
