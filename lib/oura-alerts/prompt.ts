// The grading prompt.
//
// Two of the lead data lines are pre-resolved rather than left to the model:
// the display name (because the form writes full names into firstname and the
// naive join prints a surname twice) and the Demo line (because host
// resolution is string matching plus a timezone conversion, and it is the line
// an AE acts on). Everything that is actually judgement, the grade, the
// decision maker read and the claim check, stays with the model.

import { dealUrl } from './config'

export type LeadData = {
  displayName: string
  firstname: string
  lastname: string
  jobTitle: string
  email: string
  country: string
  legalProfessionalAnswer: string
  companyName: string
  employees: string
  annualRevenue: string
  industry: string
  companyDescription: string
  dealOwner: string
  eventTitle: string
  meetingStartMs: string
  dealAmount: string
  dealId: string
  resolvedDemoLine: string
}

const INSTRUCTIONS = `You grade an inbound demo booking from the Oura Ring Promo campaign and write one Slack alert. Return ONLY the finished message text, no preamble, no explanation, no code fence.

RESEARCH
Establish whether the employer is a legal organisation from the HubSpot industry (LEGAL_SERVICES or LAW_PRACTICE) and from the description wording: law firm, legal services, attorneys, solicitors, barristers, chambers. The company name, industry and description ARE employer evidence; only say there is no employer evidence when all three are blank AND a web search turned up nothing.
Never infer legal status from the domain name. geodesicllp.com is a geospatial analytics company, autoglassadvocates.com processes insurance claims, mcguirewoods.com is a 1,000 lawyer firm.
If the employer is unclear, or the job title is blank, run a web search on the company name or email domain before grading, and say what you found or that you found nothing.

SIZE BAR, used for grading only and never mentioned in the message
$50M+ annual revenue OR more than 25 employees.

DECISION MAKER MARKERS
general counsel, chief legal officer, chief anything, VP or vice president, SVP, EVP, president, managing director, managing partner, partner, owner, founder, head of, director of legal operations.
Word boundary matching only: "Director" contains the letters cto, "Coordinator" contains coo, and an "HR business partner" is not a partner.

INFLUENCER MARKERS
counsel, associate, solicitor, attorney, paralegal, manager, lead, analyst.

GRADE
GREAT — the employer clears the size bar AND the person is a legal buyer with authority: a legal title plus a decision maker marker, or a decision maker at a researched law firm.
GOOD — one of: a legal role without clear authority at any size; a senior non legal buyer at VP and above at a size eligible employer; a legal decision maker at a company below the size bar.
POOR — any of: the claim is contradicted; an education domain (.edu, .ac.uk, .sch.uk) with no legal title; no title and no legal employer evidence; a support function at a law firm (assistant, marketing, business development, recruiting, IT, engineering, finance, HR).

CLAIM CHECK
Compare the form answer against the job title and the researched employer type.
Consistent — the title or the employer backs the claim.
Unsupported — they claimed legal but there is no title and no employer evidence either way. Unverified, not a red flag.
Contradicted — they claimed legal but the title is plainly another function and the employer is researched as non legal. Name both halves.
No claim made — the answer was "No, I work with legal tech" or "No, but I'd love to try Spellbook".

THE DEMO AND WHO IS ATTENDING
The person to notify is whoever is running the call, which is not always the deal owner. That resolution has already been done for you: the lead data carries a "Resolved demo line" that is correct for this deal, including any warning about an ambiguous host, a meeting linked from another lead, or a demo that is not on a calendar yet. Print that line verbatim as the Demo line and never rewrite, reorder or re-time it. The raw calendar title and meeting start time are given only as context for your grading.

SLACK IDS
Vasu Patel U087XCSSZ6C, Emily Aitken U08DH1UFK38, Scott Crowther U0B7MMLENJ0, Riley Giese U0774L01QA1, Ryan Salvador U0B09C8E1J4, Jordan Seward U06T6FUV3FD, Jordan Williams U0B1GURS01G, Hailey Doerr U064ACGDWLE.
Anyone not on that list gets a plain name and no mention. Never mention someone you are not sure of.

SEGMENT, derived from the deal amount
3588 is SMB Law. 7988 is Commercial In-House. 30000 is Enterprise. Anything else is Custom amount. Never print the amount itself.

OUTPUT
Slack mrkdwn. Bold is *single asterisks*. Links are <url|label>. Mentions are <@UID>. Use exactly this shape and spacing, bolding the headline and the person's name and nothing else.

*Oura Ring Promo | Demo Scheduled!*

GREAT match — Senior in-house legal buyer with signing authority at a large employer

*Lauren Leonard* — Vice President, Corporate Counsel & Corporate Secretary @ Blue Diamond Growers (1,085 employees)
United States, Enterprise

Demo: Fri Sep 4, 10:00am ET with <@U064ACGDWLE>

Decision maker: ✅ VP-level and the corporate secretary

Claim check: Consistent — form said "Yes, in-house legal" and the title is in-house counsel

<https://app.hubspot.com/contacts/20853254/record/0-3/DEALID|Open the deal in HubSpot>

HARD RULES FOR THE COPY
- Line 1 is always exactly "*Oura Ring Promo | Demo Scheduled!*".
- Line 2 is the grade plus the reason joined with an em dash, and must contain the word match: "GREAT match — ...". The reason is one short clause, not a paragraph. Never a separate "Why GREAT" line.
- Line 3 is name, title, "@", company, then headcount in parentheses. Print the name exactly as given in "Display name", unchanged.
- Line 4 is country then segment, comma separated. If country is unknown, print the segment alone.
- The Demo line is the "Resolved demo line" from the lead data, printed verbatim. It already carries the time and the AE, so there is never a separate "Would notify" line.
- Decision maker begins with exactly one icon and no comma after it, just a space: ✅ for a decision maker, ❌ for no authority signal, 🟡 for an influencer. Then a real reason of at least four words.
- Claim check value is capitalised: Consistent, Unsupported, Contradicted, No claim made. Then an em dash and the evidence.
- The last line is the HubSpot link, using the "Deal link" given in the lead data, labelled "Open the deal in HubSpot".
- Never mention the size bar, the thresholds, or any data source by name. No "per HubSpot", no "per ZoomInfo".
- Use the researched company name, not the email domain.
- Never repeat a surname, and never add a name part that is not in "Display name".
- If headcount is unknown, omit the parenthetical rather than writing "unknown". If the title is unknown, write "*Name* — @ Company" with no title.
- Never invent a title, a headcount, a country, a demo time or a Slack ID. Absent data is left out or stated as absent.`

function line(label: string, value: string): string {
  const v = (value ?? '').toString().trim()
  return `${label}: ${v || '(blank)'}`
}

export function buildGradingPrompt(lead: LeadData): string {
  const data = [
    line('Display name', lead.displayName),
    line('First name', lead.firstname),
    line('Last name', lead.lastname),
    line('Job title', lead.jobTitle),
    line('Email', lead.email),
    line('Country', lead.country),
    line(
      'Form answer to are you a legal professional',
      lead.legalProfessionalAnswer,
    ),
    line('Company', lead.companyName),
    line('Employees', lead.employees),
    line('Annual revenue', lead.annualRevenue),
    line('Industry', lead.industry),
    line('Company description', lead.companyDescription),
    line('Deal owner', lead.dealOwner || 'unassigned'),
    line('Calendar event title', lead.eventTitle),
    line('Meeting start epoch ms', lead.meetingStartMs),
    line('Deal amount', lead.dealAmount),
    line('Deal id', lead.dealId),
    line('Deal link', dealUrl(lead.dealId)),
    line('Resolved demo line', lead.resolvedDemoLine),
  ].join('\n')

  return `${INSTRUCTIONS}

LEAD DATA
${data}`
}
