// The grading call.
//
// Web search is what lets the model establish an unfamiliar employer from a
// domain, which is most of the value here: geodesicllp.com is a geospatial
// analytics company and autoglassadvocates.com processes insurance claims, and
// no amount of prompt wording substitutes for looking them up.

import Anthropic from '@anthropic-ai/sdk'
import { env } from './config'
import { buildGradingPrompt, type LeadData } from './prompt'

// The brief pins Sonnet 5 for this job; a smaller model produces visibly worse
// judgement and drops formatting rules. Overridable so the model and the search
// tool variant can be rolled back from the Vercel dashboard without a deploy.
const MODEL = process.env.ANTHROPIC_MODEL || 'claude-sonnet-5'
const WEB_SEARCH_TOOL_TYPE =
  process.env.ANTHROPIC_WEB_SEARCH_TOOL || 'web_search_20260209'

// Sonnet 5 runs adaptive thinking whenever thinking is not explicitly disabled,
// and thinking tokens count against max_tokens, so a ceiling sized only for the
// finished Slack message truncates the alert. The message itself is a few
// hundred tokens; the headroom is for the reasoning and the search results.
const MAX_TOKENS = 4096

export type GradeResult = { text: string; model: string }

export async function gradeLead(lead: LeadData): Promise<GradeResult> {
  const apiKey = env().anthropicApiKey
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set')

  const client = new Anthropic({ apiKey })

  const response = await client.messages.create({
    model: MODEL,
    max_tokens: MAX_TOKENS,
    // Grading one short lead does not need the top of the effort range, and
    // lower effort keeps the alert fast enough to be useful to an AE.
    output_config: { effort: 'medium' },
    tools: [
      {
        type: WEB_SEARCH_TOOL_TYPE,
        name: 'web_search',
        max_uses: 3,
      } as Anthropic.ToolUnion,
    ],
    messages: [{ role: 'user', content: buildGradingPrompt(lead) }],
  })

  if (response.stop_reason === 'refusal') {
    throw new Error(
      `grading refused: ${response.stop_details?.explanation ?? 'no explanation'}`,
    )
  }

  // With web search on, the content array also carries server tool use and
  // search result blocks, so take the last text block rather than the first.
  const text = [...response.content]
    .reverse()
    .find((block): block is Anthropic.TextBlock => block.type === 'text')?.text

  if (!text || !text.trim()) {
    throw new Error(
      `grading returned no text (stop_reason ${response.stop_reason})`,
    )
  }

  return { text: text.trim(), model: response.model }
}
