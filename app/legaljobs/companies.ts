// Registry of top tech / AI companies whose careers pages run on a public ATS
// (Greenhouse, Lever, or Ashby). Each of those systems exposes a key-less JSON
// endpoint listing every open role with a direct link to the posting, so the
// aggregator can pull each board, keep only the legal roles, and link straight
// to the company's own apply page.
//
// `token` is the board slug — the last path segment of the company's board URL:
//   Greenhouse → job-boards.greenhouse.io/<token>
//   Ashby      → jobs.ashbyhq.com/<token>
//   Lever      → jobs.lever.co/<token>
// If a company changes ATS or slug the fetch simply returns nothing (it's
// guarded), so a stale entry is harmless — just correct the token here.

export type Ats = 'greenhouse' | 'ashby' | 'lever'

export type CompanyBoard = {
  name: string // display name shown on the card
  ats: Ats
  token: string
}

export const COMPANY_BOARDS: CompanyBoard[] = [
  // --- Greenhouse ----------------------------------------------------------
  { name: 'Anthropic', ats: 'greenhouse', token: 'anthropic' },
  { name: 'Databricks', ats: 'greenhouse', token: 'databricks' },
  { name: 'Stripe', ats: 'greenhouse', token: 'stripe' },
  { name: 'Airbnb', ats: 'greenhouse', token: 'airbnb' },
  { name: 'Figma', ats: 'greenhouse', token: 'figma' },
  { name: 'Cloudflare', ats: 'greenhouse', token: 'cloudflare' },
  { name: 'Reddit', ats: 'greenhouse', token: 'reddit' },
  { name: 'Discord', ats: 'greenhouse', token: 'discord' },
  { name: 'MongoDB', ats: 'greenhouse', token: 'mongodb' },
  { name: 'Datadog', ats: 'greenhouse', token: 'datadog' },
  { name: 'Pinterest', ats: 'greenhouse', token: 'pinterest' },
  { name: 'Lyft', ats: 'greenhouse', token: 'lyft' },
  { name: 'Robinhood', ats: 'greenhouse', token: 'robinhood' },
  { name: 'Instacart', ats: 'greenhouse', token: 'instacart' },
  { name: 'Coinbase', ats: 'greenhouse', token: 'coinbase' },
  { name: 'DoorDash', ats: 'greenhouse', token: 'doordash' },
  { name: 'Dropbox', ats: 'greenhouse', token: 'dropbox' },
  { name: 'Twilio', ats: 'greenhouse', token: 'twilio' },
  { name: 'Asana', ats: 'greenhouse', token: 'asana' },
  { name: 'Samsara', ats: 'greenhouse', token: 'samsara' },
  { name: 'Brex', ats: 'greenhouse', token: 'brex' },
  { name: 'Plaid', ats: 'greenhouse', token: 'plaid' },
  { name: 'Gusto', ats: 'greenhouse', token: 'gusto' },
  { name: 'Benchling', ats: 'greenhouse', token: 'benchling' },
  { name: 'Roblox', ats: 'greenhouse', token: 'roblox' },
  { name: 'Squarespace', ats: 'greenhouse', token: 'squarespace' },
  { name: 'Affirm', ats: 'greenhouse', token: 'affirm' },
  { name: 'Scale AI', ats: 'greenhouse', token: 'scaleai' },

  // --- Ashby ---------------------------------------------------------------
  { name: 'OpenAI', ats: 'ashby', token: 'openai' },
  { name: 'Ramp', ats: 'ashby', token: 'ramp' },
  { name: 'Notion', ats: 'ashby', token: 'notion' },
  { name: 'Linear', ats: 'ashby', token: 'linear' },
  { name: 'Perplexity AI', ats: 'ashby', token: 'perplexity' },
  { name: 'Cursor', ats: 'ashby', token: 'cursor' },
  { name: 'Vanta', ats: 'ashby', token: 'vanta' },
  { name: 'Watershed', ats: 'ashby', token: 'watershed' },
  { name: 'Replit', ats: 'ashby', token: 'replit' },
  { name: 'Cohere', ats: 'ashby', token: 'cohere' },
  { name: 'Sierra', ats: 'ashby', token: 'sierra' },

  // --- Lever ---------------------------------------------------------------
  { name: 'Netflix', ats: 'lever', token: 'netflix' },
  { name: 'Spotify', ats: 'lever', token: 'spotify' },
  { name: 'Ro', ats: 'lever', token: 'ro' },
  { name: 'Gopuff', ats: 'lever', token: 'gopuff' },
]
