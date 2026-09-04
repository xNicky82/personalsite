// Name rendering for the alert headline.
//
// The promo form writes a full name into HubSpot's firstname field, so records
// exist as { firstname: "Zane Jones", lastname: "Jones" } and naive
// concatenation prints "Zane Jones Jones". The real fix is upstream in the
// form; until then every consumer of a name goes through here.

function tokens(value: string): string[] {
  return value.trim().split(/\s+/).filter(Boolean)
}

// First name then last name, each exactly once.
export function displayName(firstname: string, lastname: string): string {
  const first = tokens(firstname ?? '')
  const last = tokens(lastname ?? '')
  if (!first.length) return last.join(' ')
  if (!last.length) return first.join(' ')

  // Drop the trailing repetition when firstname already ends with the surname
  // ("Zane Jones" + "Jones"), and the whole surname when firstname already
  // carries it in full ("Thomas Farbacher" + "Farbacher").
  const firstLower = first.map((t) => t.toLowerCase())
  const lastLower = last.map((t) => t.toLowerCase())
  const overlap = firstLower.slice(-lastLower.length).join(' ')
  if (overlap === lastLower.join(' ')) return first.join(' ')

  return [...first, ...last].join(' ')
}

// The parts used to decide whether a calendar title belongs to this lead. The
// surname can only live in firstname on the polluted records, so fall back to
// the last token of firstname when lastname is blank.
export function nameParts(
  firstname: string,
  lastname: string,
): { first: string; last: string } {
  const first = tokens(firstname ?? '')
  const last = tokens(lastname ?? '')
  return {
    first: first[0] ?? '',
    last:
      last[last.length - 1] ??
      (first.length > 1 ? first[first.length - 1] : ''),
  }
}
