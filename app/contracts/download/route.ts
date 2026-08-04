import { NextRequest } from 'next/server'
import { COMPANIES, FEATURED, type Company } from '../data'

// Renders the EDGAR filing for a given company to a faithful PDF using headless
// Chromium and streams it back as a download. Runs on the Node.js runtime
// (Chromium can't run on the edge). The company is resolved from our own data by
// ticker, so this endpoint can only ever fetch the URLs we've curated — it is
// not a general-purpose proxy.

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const ALL: Company[] = [FEATURED, ...COMPANIES]

// EDGAR requires a descriptive User-Agent with contact info.
const EDGAR_UA =
  'nicholasrocha.com EDGAR Contracts (contact: nicholas.rocha@spellbook.legal)'

function findByTicker(ticker: string): Company | undefined {
  const t = ticker.trim().toUpperCase()
  return ALL.find((c) => c.ticker.toUpperCase() === t)
}

function isSecHost(url: string): boolean {
  try {
    const h = new URL(url).hostname.toLowerCase()
    return h === 'www.sec.gov' || h === 'sec.gov' || h.endsWith('.sec.gov')
  } catch {
    return false
  }
}

function safeFilename(company: Company): string {
  const base = `${company.ticker}-${company.contract.type}`
  return (
    base
      .normalize('NFKD')
      .replace(/[^a-zA-Z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '')
      .slice(0, 80) || company.ticker
  )
}

async function launchBrowser() {
  const isServerless =
    !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.VERCEL
  const puppeteer = await import('puppeteer-core')

  if (isServerless) {
    const chromium = (await import('@sparticuz/chromium')).default
    return puppeteer.launch({
      args: chromium.args,
      defaultViewport: chromium.defaultViewport,
      executablePath: await chromium.executablePath(),
      headless: true,
    })
  }

  // Local / non-serverless: use a locally installed Chromium.
  const executablePath =
    process.env.CHROME_EXECUTABLE_PATH ||
    process.env.PUPPETEER_EXECUTABLE_PATH ||
    '/opt/pw-browsers/chromium'
  return puppeteer.launch({
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    executablePath,
    headless: true,
  })
}

export async function GET(req: NextRequest) {
  const ticker = req.nextUrl.searchParams.get('ticker') ?? ''
  const company = findByTicker(ticker)
  if (!company) {
    return new Response('Unknown company.', { status: 404 })
  }

  const url = company.contract.url
  if (!isSecHost(url)) {
    return new Response('Refusing to fetch a non-EDGAR URL.', { status: 400 })
  }

  let browser
  try {
    browser = await launchBrowser()
    const page = await browser.newPage()
    await page.setUserAgent(EDGAR_UA)
    await page.setExtraHTTPHeaders({ 'Accept-Language': 'en-US,en;q=0.9' })
    await page.goto(url, { waitUntil: 'networkidle0', timeout: 45000 })

    const pdf = await page.pdf({
      format: 'Letter',
      printBackground: true,
      margin: { top: '0.6in', bottom: '0.6in', left: '0.6in', right: '0.6in' },
    })

    return new Response(Buffer.from(pdf), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFilename(company)}.pdf"`,
        'Cache-Control': 'public, max-age=86400',
      },
    })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return new Response(`Could not render this filing to PDF. ${message}`, {
      status: 502,
    })
  } finally {
    try {
      await browser?.close()
    } catch {
      // ignore teardown errors
    }
  }
}
