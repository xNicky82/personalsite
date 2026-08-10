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
//
// `domain` is the company's web domain, used to fetch its logo on the client.

export type Ats = 'greenhouse' | 'ashby' | 'lever'

export type CompanyBoard = {
  name: string // display name shown on the card
  ats: Ats
  token: string
  domain: string // e.g. "stripe.com" — used for the logo
}

export const COMPANY_BOARDS: CompanyBoard[] = [
  // --- Greenhouse ----------------------------------------------------------
  { name: 'Anthropic', ats: 'greenhouse', token: 'anthropic', domain: 'anthropic.com' },
  { name: 'Databricks', ats: 'greenhouse', token: 'databricks', domain: 'databricks.com' },
  { name: 'Stripe', ats: 'greenhouse', token: 'stripe', domain: 'stripe.com' },
  { name: 'Airbnb', ats: 'greenhouse', token: 'airbnb', domain: 'airbnb.com' },
  { name: 'Figma', ats: 'greenhouse', token: 'figma', domain: 'figma.com' },
  { name: 'Cloudflare', ats: 'greenhouse', token: 'cloudflare', domain: 'cloudflare.com' },
  { name: 'Reddit', ats: 'greenhouse', token: 'reddit', domain: 'reddit.com' },
  { name: 'Discord', ats: 'greenhouse', token: 'discord', domain: 'discord.com' },
  { name: 'MongoDB', ats: 'greenhouse', token: 'mongodb', domain: 'mongodb.com' },
  { name: 'Datadog', ats: 'greenhouse', token: 'datadog', domain: 'datadoghq.com' },
  { name: 'Pinterest', ats: 'greenhouse', token: 'pinterest', domain: 'pinterest.com' },
  { name: 'Lyft', ats: 'greenhouse', token: 'lyft', domain: 'lyft.com' },
  { name: 'Robinhood', ats: 'greenhouse', token: 'robinhood', domain: 'robinhood.com' },
  { name: 'Instacart', ats: 'greenhouse', token: 'instacart', domain: 'instacart.com' },
  { name: 'Coinbase', ats: 'greenhouse', token: 'coinbase', domain: 'coinbase.com' },
  { name: 'DoorDash', ats: 'greenhouse', token: 'doordash', domain: 'doordash.com' },
  { name: 'Dropbox', ats: 'greenhouse', token: 'dropbox', domain: 'dropbox.com' },
  { name: 'Twilio', ats: 'greenhouse', token: 'twilio', domain: 'twilio.com' },
  { name: 'Asana', ats: 'greenhouse', token: 'asana', domain: 'asana.com' },
  { name: 'Samsara', ats: 'greenhouse', token: 'samsara', domain: 'samsara.com' },
  { name: 'Brex', ats: 'greenhouse', token: 'brex', domain: 'brex.com' },
  { name: 'Plaid', ats: 'greenhouse', token: 'plaid', domain: 'plaid.com' },
  { name: 'Gusto', ats: 'greenhouse', token: 'gusto', domain: 'gusto.com' },
  { name: 'Benchling', ats: 'greenhouse', token: 'benchling', domain: 'benchling.com' },
  { name: 'Roblox', ats: 'greenhouse', token: 'roblox', domain: 'roblox.com' },
  { name: 'Squarespace', ats: 'greenhouse', token: 'squarespace', domain: 'squarespace.com' },
  { name: 'Affirm', ats: 'greenhouse', token: 'affirm', domain: 'affirm.com' },
  { name: 'Scale AI', ats: 'greenhouse', token: 'scaleai', domain: 'scale.com' },

  // --- Ashby ---------------------------------------------------------------
  { name: 'OpenAI', ats: 'ashby', token: 'openai', domain: 'openai.com' },
  { name: 'Ramp', ats: 'ashby', token: 'ramp', domain: 'ramp.com' },
  { name: 'Notion', ats: 'ashby', token: 'notion', domain: 'notion.so' },
  { name: 'Linear', ats: 'ashby', token: 'linear', domain: 'linear.app' },
  { name: 'Perplexity AI', ats: 'ashby', token: 'perplexity', domain: 'perplexity.ai' },
  { name: 'Cursor', ats: 'ashby', token: 'cursor', domain: 'cursor.com' },
  { name: 'Vanta', ats: 'ashby', token: 'vanta', domain: 'vanta.com' },
  { name: 'Watershed', ats: 'ashby', token: 'watershed', domain: 'watershed.com' },
  { name: 'Replit', ats: 'ashby', token: 'replit', domain: 'replit.com' },
  { name: 'Cohere', ats: 'ashby', token: 'cohere', domain: 'cohere.com' },
  { name: 'Sierra', ats: 'ashby', token: 'sierra', domain: 'sierra.ai' },

  // --- Lever ---------------------------------------------------------------
  { name: 'Netflix', ats: 'lever', token: 'netflix', domain: 'netflix.com' },
  { name: 'Spotify', ats: 'lever', token: 'spotify', domain: 'spotify.com' },
  { name: 'Ro', ats: 'lever', token: 'ro', domain: 'ro.co' },
  { name: 'Gopuff', ats: 'lever', token: 'gopuff', domain: 'gopuff.com' },
]
