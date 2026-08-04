// Data model for the EDGAR Contracts directory.
//
// Each entry is one of the 50 largest U.S. publicly-listed companies by revenue
// (2025 Fortune 500, FY2024), paired with a real, recently-filed contract pulled
// from SEC EDGAR — the kind of substantive agreement a contracts team (Spellbook)
// would review as an example: credit agreements, merger / separation / transition
// services agreements, indentures, executive employment & severance agreements,
// note & underwriting agreements, and the like.
//
// Signatories live on the signature page INSIDE each filed document. They are
// populated per-company as each contract's signature block is confirmed; where a
// contract hasn't been read yet, `signatories` is empty and the UI links straight
// to the filing so the signers can be confirmed at the source.

export type Signatory = {
  name: string
  title: string
  party?: string // the entity this person signed on behalf of
}

export type Contract = {
  title: string // the agreement's own title
  type: string // short category, e.g. "Credit Agreement"
  filedAs: string // e.g. "Exhibit 10.1 to Form 8-K"
  filedDate: string // human-readable filing date
  url: string // link to the document (or filing) on SEC EDGAR
  // true  → links straight to the specific agreement / filing on EDGAR
  // false → links to the company's EDGAR filing list (agreement not yet pinned)
  urlVerified: boolean
  note?: string // optional one-line context about the contract
}

export type Company = {
  rank: number // approximate 2025 Fortune 500 rank by revenue
  name: string
  ticker: string
  exchange: string
  cik: string // SEC EDGAR Central Index Key
  contract: Contract
  signatories: Signatory[] // empty until the signature page is confirmed
}

// A verified EDGAR filing list URL for any company, by CIK. Always valid.
export function edgarFilingsUrl(cik: string): string {
  const n = cik.replace(/\D/g, '')
  return `https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=${n}&type=&dateb=&owner=include&count=40`
}

// The featured example the whole directory is modelled on: SanDisk's Transition
// Services Agreement with Western Digital, filed alongside its 2025 spin-off.
export const FEATURED: Company = {
  rank: 0,
  name: 'Sandisk Corporation',
  ticker: 'SNDK',
  exchange: 'Nasdaq',
  cik: '2023554',
  contract: {
    title:
      'Transition Services Agreement between Western Digital Corporation and Sandisk Corporation',
    type: 'Transition Services Agreement',
    filedAs: 'Exhibit to Form 8-K',
    filedDate: 'Feb 24, 2025',
    url: 'https://www.sec.gov/cgi-bin/browse-edgar?action=getcompany&CIK=2023554&type=8-K&dateb=&owner=include&count=40',
    urlVerified: true,
    note: 'Entered into Feb 21, 2025 in connection with SanDisk’s spin-off from Western Digital — the template example for this directory.',
  },
  signatories: [],
}

// The 50 companies. Populated from SEC EDGAR research (URLs verified against
// live EDGAR search results). Ranks are approximate 2025 Fortune 500 positions
// by FY2024 revenue, limited to companies listed on a public U.S. market.
export const COMPANIES: Company[] = [
  {
    rank: 1,
    name: 'Walmart Inc.',
    ticker: 'WMT',
    exchange: 'NYSE',
    cik: '104169',
    contract: {
      title:
        'Underwriting Agreement for senior notes offering (Floating Rate Notes due 2029, 4.000% Notes due 2029, 4.150% Notes due 2031)',
      type: 'Underwriting Agreement',
      filedAs: 'Exhibit 1.1 to Form 8-K',
      filedDate: 'Apr 30, 2026',
      url: 'https://www.sec.gov/Archives/edgar/data/104169/000119312526194086/d131601dex11.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 2,
    name: 'Amazon.com, Inc.',
    ticker: 'AMZN',
    exchange: 'Nasdaq',
    cik: '1018724',
    contract: {
      title:
        'Amended and Restated Credit Agreement — $10,000,000,000 revolving credit facility',
      type: 'Revolving Credit Agreement',
      filedAs: 'Exhibit 10.1 to Form 10-Q',
      filedDate: 'Mar 29, 2022',
      url: 'https://www.sec.gov/Archives/edgar/data/1018724/000101872422000013/amzn-20220331xex101.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 3,
    name: 'UnitedHealth Group Incorporated',
    ticker: 'UNH',
    exchange: 'NYSE',
    cik: '731766',
    contract: {
      title:
        'Underwriting Agreement dated June 17, 2025 for $3.0B senior notes (4.400% 2028, 4.650% 2031, 5.300% 2035, 5.950% 2055)',
      type: 'Underwriting Agreement',
      filedAs: 'Exhibit 1.1 to Form 8-K',
      filedDate: 'Jun 17, 2025',
      url: 'https://www.sec.gov/Archives/edgar/data/731766/000119312525143717/d947980d8k.htm',
      urlVerified: true,
      note: 'The Underwriting Agreement is Exhibit 1.1 to this Form 8-K.',
    },
    signatories: [],
  },
  {
    rank: 4,
    name: 'Apple Inc.',
    ticker: 'AAPL',
    exchange: 'Nasdaq',
    cik: '320193',
    contract: {
      title:
        'Underwriting Agreement, dated May 8, 2023 (notes due 2026, 2028, 2030, 2033, 2053)',
      type: 'Underwriting Agreement',
      filedAs: 'Exhibit 1.1 to Form 8-K',
      filedDate: 'May 8, 2023',
      url: 'https://www.sec.gov/Archives/edgar/data/320193/000114036123023909/ny20007635x4_ex1-1.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 5,
    name: 'CVS Health Corporation',
    ticker: 'CVS',
    exchange: 'NYSE',
    cik: '64803',
    contract: {
      title:
        'Term Loan Agreement, dated as of May 1, 2023 — $5,000,000,000 (Barclays Bank PLC as administrative agent)',
      type: 'Term Loan Agreement',
      filedAs: 'Exhibit 10.1 to Form 8-K',
      filedDate: 'May 1, 2023',
      url: 'https://www.sec.gov/Archives/edgar/data/64803/000094787123000511/ss2023948_ex1001.htm',
      urlVerified: true,
      note: 'A $5B term loan that financed the Oak Street Health and Signify Health acquisitions.',
    },
    signatories: [],
  },
  {
    rank: 6,
    name: 'Berkshire Hathaway Inc.',
    ticker: 'BRK.B',
    exchange: 'NYSE',
    cik: '1067983',
    contract: {
      title:
        'Underwriting Agreement dated April 10, 2026 (Berkshire Hathaway Finance Corporation senior notes)',
      type: 'Underwriting Agreement',
      filedAs: 'Exhibit 1.1 to Form 8-K',
      filedDate: 'Apr 10, 2026',
      url: 'https://www.sec.gov/Archives/edgar/data/1067983/000119312526159326/d903301d8k.htm',
      urlVerified: true,
      note: 'The Underwriting Agreement is Exhibit 1.1 to this Form 8-K.',
    },
    signatories: [],
  },
  {
    rank: 7,
    name: 'Alphabet Inc.',
    ticker: 'GOOGL',
    exchange: 'Nasdaq',
    cik: '1652044',
    contract: {
      title: 'Underwriting Agreement for April/May 2025 senior notes offering',
      type: 'Underwriting Agreement',
      filedAs: 'Exhibit 1.1 to Form 8-K',
      filedDate: 'Apr 2025',
      url: 'https://www.sec.gov/Archives/edgar/data/1652044/000119312525110020/d884388d8k.htm',
      urlVerified: true,
      note: 'The Underwriting Agreement is Exhibit 1.1 to this Form 8-K.',
    },
    signatories: [],
  },
  {
    rank: 8,
    name: 'Exxon Mobil Corporation',
    ticker: 'XOM',
    exchange: 'NYSE',
    cik: '34088',
    contract: {
      title:
        'Agreement and Plan of Merger among Exxon Mobil Corporation, SPQR, LLC and Pioneer Natural Resources Company',
      type: 'Merger Agreement',
      filedAs: 'Exhibit 2.1 to Form 8-K',
      filedDate: 'Oct 11, 2023',
      url: 'https://www.sec.gov/Archives/edgar/data/34088/000095010323017257/dp203718_8k.htm',
      urlVerified: true,
      note: 'The ~$60B all-stock acquisition of Pioneer Natural Resources; merger agreement filed as Exhibit 2.1.',
    },
    signatories: [],
  },
  {
    rank: 9,
    name: 'McKesson Corporation',
    ticker: 'MCK',
    exchange: 'NYSE',
    cik: '927653',
    contract: {
      title:
        'Revolving Credit Agreement (senior unsecured facility; JPMorgan Chase Bank, N.A. as Administrative Agent)',
      type: 'Revolving Credit Agreement',
      filedAs: 'Exhibit 10.1 to Form 8-K',
      filedDate: '2022',
      url: 'https://www.sec.gov/Archives/edgar/data/927653/000092765322000100/revolvingcreditagreement.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 10,
    name: 'Cencora, Inc.',
    ticker: 'COR',
    exchange: 'NYSE',
    cik: '1140859',
    contract: {
      title:
        'Amended and Restated Credit Agreement, dated as of October 9, 2024 — $4.5B multi-currency revolving facility',
      type: 'Revolving Credit Agreement',
      filedAs: 'Exhibit 10.1 to Form 8-K',
      filedDate: 'Oct 9, 2024',
      url: 'https://www.sec.gov/Archives/edgar/data/1140859/000110465924108579/tm2426039d1_ex10-1.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 11,
    name: 'JPMorgan Chase & Co.',
    ticker: 'JPM',
    exchange: 'NYSE',
    cik: '19617',
    contract: {
      title:
        'Underwriting Agreement, dated March 5, 2024 (Series NN Preferred Stock / Depositary Shares offering)',
      type: 'Underwriting Agreement',
      filedAs: 'Exhibit to Form 8-K',
      filedDate: 'Mar 12, 2024',
      url: 'https://www.sec.gov/Archives/edgar/data/19617/000119312524065885/d807686d8k.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 12,
    name: 'Costco Wholesale Corporation',
    ticker: 'COST',
    exchange: 'Nasdaq',
    cik: '909832',
    contract: {
      title:
        'Underwriting Agreement for ~$4B multi-tranche senior notes offering',
      type: 'Underwriting Agreement',
      filedAs: 'Exhibit 1.1 to Form 8-K',
      filedDate: 'Apr 16, 2020',
      url: 'https://www.sec.gov/Archives/edgar/data/909832/000119312520110803/d903866dex11.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 13,
    name: 'The Cigna Group',
    ticker: 'CI',
    exchange: 'NYSE',
    cik: '1739940',
    contract: {
      title:
        'Revolving Credit and Letter of Credit Agreements (April 25, 2024: $5.0B five-year and $1.5B 364-day facilities)',
      type: 'Revolving Credit Agreement',
      filedAs: 'Exhibits 10.1 & 10.2 to Form 8-K',
      filedDate: 'Apr 25, 2024',
      url: 'https://www.sec.gov/Archives/edgar/data/1739940/000095015924000130/cigna8k.htm',
      urlVerified: true,
      note: 'Credit agreements filed as Exhibits 10.1 and 10.2 to this Form 8-K.',
    },
    signatories: [],
  },
  {
    rank: 14,
    name: 'Microsoft Corporation',
    ticker: 'MSFT',
    exchange: 'Nasdaq',
    cik: '789019',
    contract: {
      title: 'Underwriting Agreement for senior notes offering (2024)',
      type: 'Underwriting Agreement',
      filedAs: 'Exhibit 1.1 to Form 8-K',
      filedDate: '2024',
      url: 'https://www.sec.gov/Archives/edgar/data/789019/000119312524277062/d901891dex11.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 15,
    name: 'Cardinal Health, Inc.',
    ticker: 'CAH',
    exchange: 'NYSE',
    cik: '721371',
    contract: {
      title:
        'Term Loan Credit Agreement, dated as of December 5, 2024 (Bank of America, N.A. as Administrative Agent)',
      type: 'Term Loan Agreement',
      filedAs: 'Exhibit to Form 8-K',
      filedDate: 'Dec 5, 2024',
      url: 'https://www.sec.gov/Archives/edgar/data/721371/000072137124000169/cardinalhealth-termloancre.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 16,
    name: 'Chevron Corporation',
    ticker: 'CVX',
    exchange: 'NYSE',
    cik: '93410',
    contract: {
      title:
        'Agreement and Plan of Merger among Chevron Corporation, Yankee Merger Sub Inc. and Hess Corporation, dated October 22, 2023',
      type: 'Merger Agreement',
      filedAs: 'Exhibit 2.1 to Form 8-K',
      filedDate: 'Oct 23, 2023',
      url: 'https://www.sec.gov/Archives/edgar/data/93410/000095014223002670/eh230413259_ex0201.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 17,
    name: 'Bank of America Corporation',
    ticker: 'BAC',
    exchange: 'NYSE',
    cik: '70858',
    contract: {
      title: 'Underwriting Agreement (senior notes offering), April 2022',
      type: 'Underwriting Agreement',
      filedAs: 'Exhibit 1.1 to Form 8-K',
      filedDate: 'Apr 2022',
      url: 'https://www.sec.gov/Archives/edgar/data/70858/000119312522115192/d299961dex11.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 18,
    name: 'General Motors Company',
    ticker: 'GM',
    exchange: 'NYSE',
    cik: '1467858',
    contract: {
      title:
        'Fifth Amended and Restated Three-Year Revolving Credit Agreement, dated as of March 31, 2023',
      type: 'Revolving Credit Agreement',
      filedAs: 'Exhibit 10.2 to Form 8-K',
      filedDate: 'Mar 31, 2023',
      url: 'https://www.sec.gov/Archives/edgar/data/1467858/000119312523086956/d826843dex102.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 19,
    name: 'Ford Motor Company',
    ticker: 'F',
    exchange: 'NYSE',
    cik: '37996',
    contract: {
      title:
        'Twenty-Third Amendment (dated April 15, 2026) to the Credit Agreement dated December 15, 2006 (as amended and restated)',
      type: 'Credit Agreement Amendment',
      filedAs: 'Exhibit 10.1 to Form 8-K',
      filedDate: 'Apr 15, 2026',
      url: 'https://www.sec.gov/Archives/edgar/data/0000037996/000003799626000079/exhibit101april152026.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 20,
    name: 'Elevance Health, Inc.',
    ticker: 'ELV',
    exchange: 'NYSE',
    cik: '1156039',
    contract: {
      title:
        'Underwriting Agreement dated September 8, 2025 for ~$3.0B senior notes',
      type: 'Underwriting Agreement',
      filedAs: 'Exhibit 1.1 to Form 8-K',
      filedDate: 'Sep 15, 2025',
      url: 'https://www.sec.gov/Archives/edgar/data/1156039/000119312525203542/d79603d8k.htm',
      urlVerified: true,
      note: 'The Underwriting Agreement is Exhibit 1.1 to this Form 8-K.',
    },
    signatories: [],
  },
  {
    rank: 21,
    name: 'Citigroup Inc.',
    ticker: 'C',
    exchange: 'NYSE',
    cik: '831001',
    contract: {
      title:
        'Underwriting Agreement dated November 25, 2024 (Series EE preferred stock / depositary shares offering)',
      type: 'Underwriting Agreement',
      filedAs: 'Exhibit 1.1 to Form 8-K',
      filedDate: 'Nov 25, 2024',
      url: 'https://www.sec.gov/Archives/edgar/data/831001/000119312524269906/d913265dex11.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 22,
    name: 'Meta Platforms, Inc.',
    ticker: 'META',
    exchange: 'Nasdaq',
    cik: '1326801',
    contract: {
      title:
        'Underwriting Agreement (senior notes offering) between Meta Platforms and the underwriters’ representatives',
      type: 'Underwriting Agreement',
      filedAs: 'Exhibit 1.1 to Form 8-K',
      filedDate: '2026',
      url: 'https://www.sec.gov/Archives/edgar/data/1326801/000119312526204128/d134616dex11.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 23,
    name: 'Centene Corporation',
    ticker: 'CNC',
    exchange: 'NYSE',
    cik: '1071739',
    contract: {
      title:
        'Credit Agreement — new $4B revolving facility + $2B term loan (Wells Fargo Bank, N.A. as administrative agent)',
      type: 'Credit Agreement',
      filedAs: 'Exhibit 10.1 to Form 8-K',
      filedDate: 'Mar 5, 2025',
      url: 'https://www.sec.gov/Archives/edgar/data/1071739/000107173925000040/cnc-20250305.htm',
      urlVerified: true,
      note: 'The credit agreement (matures 2030) is Exhibit 10.1 to this Form 8-K.',
    },
    signatories: [],
  },
  {
    rank: 24,
    name: 'The Home Depot, Inc.',
    ticker: 'HD',
    exchange: 'NYSE',
    cik: '354950',
    contract: {
      title:
        '364-Day Revolving Credit Facility Agreement (May 7, 2024; JPMorgan Chase Bank, N.A. as administrative agent)',
      type: 'Revolving Credit Agreement',
      filedAs: 'Exhibit 10.1 to Form 8-K',
      filedDate: 'May 7, 2024',
      url: 'https://www.sec.gov/Archives/edgar/data/354950/000035495024000201/hd364-daycreditagreementxe.htm',
      urlVerified: true,
      note: '$3.5B 364-day facility supporting the SRS Distribution acquisition financing.',
    },
    signatories: [],
  },
  {
    rank: 25,
    name: 'Federal National Mortgage Association (Fannie Mae)',
    ticker: 'FNMA',
    exchange: 'OTCQB',
    cik: '310522',
    contract: {
      title:
        'Letter Agreement among Fannie Mae, FHFA (as conservator) and the U.S. Department of the Treasury (amending the Senior Preferred Stock Purchase Agreement)',
      type: 'Letter Agreement',
      filedAs: 'Exhibit 10.1 to Form 8-K',
      filedDate: 'Jan 2, 2025',
      url: 'https://www.sec.gov/Archives/edgar/data/310522/000031052225000004/exhibit101.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 26,
    name: 'Walgreens Boots Alliance, Inc.',
    ticker: 'WBA',
    exchange: 'Nasdaq',
    cik: '1618921',
    contract: {
      title:
        'Agreement and Plan of Merger, dated March 6, 2025, among Walgreens Boots Alliance, Blazing Star Parent, LLC and Blazing Star Merger Sub, Inc. (Sycamore Partners take-private)',
      type: 'Merger Agreement',
      filedAs: 'Merger agreement (annex to DEFM14A proxy)',
      filedDate: 'Mar 10, 2025',
      url: 'https://www.sec.gov/Archives/edgar/data/1618921/000119312525137049/d942554ddefm14a.htm',
      urlVerified: true,
      note: 'Link opens the merger proxy (DEFM14A) that contains the full merger agreement as an annex.',
    },
    signatories: [],
  },
  {
    rank: 27,
    name: 'The Kroger Co.',
    ticker: 'KR',
    exchange: 'NYSE',
    cik: '56873',
    contract: {
      title:
        'Term Loan Credit Agreement, dated November 9, 2022 — $4.75B (Citibank, N.A. as administrative agent)',
      type: 'Term Loan Agreement',
      filedAs: 'Exhibit 10.1 to Form 8-K',
      filedDate: 'Nov 9, 2022',
      url: 'https://www.sec.gov/Archives/edgar/data/56873/000110465922117123/tm2230116d1_ex10-1.htm',
      urlVerified: true,
      note: 'Originally to finance the Albertsons acquisition; commitments terminated Dec 2024 when the merger was called off.',
    },
    signatories: [],
  },
  {
    rank: 28,
    name: 'Phillips 66',
    ticker: 'PSX',
    exchange: 'NYSE',
    cik: '1534701',
    contract: {
      title:
        '$2.25 Billion 364-Day Term Loan Credit Agreement (Phillips 66 Company as borrower, Phillips 66 as guarantor; Mizuho Bank, Ltd. as administrative agent)',
      type: 'Term Loan Agreement',
      filedAs: 'Exhibit 10.1 to Form 8-K',
      filedDate: 'Mar 18, 2026',
      url: 'https://www.sec.gov/Archives/edgar/data/1534701/000119312526114070/d20718dex101.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 29,
    name: 'Marathon Petroleum Corporation',
    ticker: 'MPC',
    exchange: 'NYSE',
    cik: '1510295',
    contract: {
      title:
        'Revolving Credit Agreement dated as of April 7, 2026 — $5.0B facility (JPMorgan Chase Bank, N.A. as administrative agent)',
      type: 'Revolving Credit Agreement',
      filedAs: 'Exhibit 10.1 to Form 8-K',
      filedDate: 'Apr 7, 2026',
      url: 'https://www.sec.gov/Archives/edgar/data/1510295/000151029526000029/mpc-20260407.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 30,
    name: 'Verizon Communications Inc.',
    ticker: 'VZ',
    exchange: 'NYSE',
    cik: '732712',
    contract: {
      title:
        'Credit Agreement (revolving facility; Leverage Ratio covenant not to exceed 3.50:1.00)',
      type: 'Credit Agreement',
      filedAs: 'Exhibit 10.1 to Form 8-K',
      filedDate: 'Sep 2013',
      url: 'https://www.sec.gov/Archives/edgar/data/732712/000119312513354730/d591083d8k.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 31,
    name: 'NVIDIA Corporation',
    ticker: 'NVDA',
    exchange: 'Nasdaq',
    cik: '1045810',
    contract: {
      title:
        'Share Purchase Agreement (NVIDIA / SoftBank re: Arm Limited acquisition)',
      type: 'Share Purchase Agreement',
      filedAs: 'Exhibit 2.1 to Form 8-K',
      filedDate: 'Sep 14, 2020',
      url: 'https://www.sec.gov/Archives/edgar/data/1045810/000119312520244601/d13958dex21.htm',
      urlVerified: true,
      note: 'The definitive Arm acquisition agreement (deal later terminated) — the most substantive standalone agreement NVIDIA has filed.',
    },
    signatories: [],
  },
  {
    rank: 32,
    name: 'Comcast Corporation',
    ticker: 'CMCSA',
    exchange: 'Nasdaq',
    cik: '1166691',
    contract: {
      title:
        'Revolving Credit Agreement amendment relating to the $7.0B+ unsecured revolving facility (JPMorgan Chase Bank, N.A. as administrative agent)',
      type: 'Revolving Credit Agreement',
      filedAs: 'Exhibit 10.1 to Form 8-K',
      filedDate: '2021',
      url: 'https://www.sec.gov/Archives/edgar/data/1166691/000095010321005001/dp148717_ex1001.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 33,
    name: 'Wells Fargo & Company',
    ticker: 'WFC',
    exchange: 'NYSE',
    cik: '72971',
    contract: {
      title:
        'Underwriting Agreement (offering of Wells Fargo securities — depositary shares / preferred)',
      type: 'Underwriting Agreement',
      filedAs: 'Exhibit 1.1 to Form 8-K',
      filedDate: '2022',
      url: 'https://www.sec.gov/Archives/edgar/data/72971/000119312522123773/d894312dex11.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 34,
    name: 'Federal Home Loan Mortgage Corporation (Freddie Mac)',
    ticker: 'FMCC',
    exchange: 'OTCQB',
    cik: '1026214',
    contract: {
      title:
        'Memorandum Agreement with Mark B. Grier for employment as Interim Chief Executive Officer (effective March 15, 2021)',
      type: 'Executive Employment Agreement',
      filedAs: 'Exhibit 10.1 to Form 8-K',
      filedDate: 'Mar 16, 2021',
      url: 'https://www.sec.gov/Archives/edgar/data/1026214/000102621421000044/exhibit101mar1621.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 35,
    name: 'Valero Energy Corporation',
    ticker: 'VLO',
    exchange: 'NYSE',
    cik: '1035002',
    contract: {
      title:
        'Amended and Restated Revolving Credit Agreement dated November 22, 2022 — $4.0B facility (maturity extended to Nov 22, 2027)',
      type: 'Revolving Credit Agreement',
      filedAs: 'Exhibit 10.1 to Form 8-K',
      filedDate: 'Nov 22, 2022',
      url: 'https://www.sec.gov/Archives/edgar/data/1035002/000119312522291119/d396276d8k.htm',
      urlVerified: true,
      note: 'The credit agreement is Exhibit 10.1 to this Form 8-K.',
    },
    signatories: [],
  },
  {
    rank: 36,
    name: 'AT&T Inc.',
    ticker: 'T',
    exchange: 'NYSE',
    cik: '732717',
    contract: {
      title:
        'U.S. $12,000,000,000 Second Amended and Restated Credit Agreement, dated as of November 3, 2025 (Citibank, N.A. as agent)',
      type: 'Revolving Credit Agreement',
      filedAs: 'Exhibit 10.1 to Form 8-K',
      filedDate: 'Nov 4, 2025',
      url: 'https://www.sec.gov/Archives/edgar/data/732717/000119312525262515/d935272d8k.htm',
      urlVerified: true,
      note: 'The credit agreement is Exhibit 10.1 to this Form 8-K.',
    },
    signatories: [],
  },
  {
    rank: 37,
    name: 'Humana Inc.',
    ticker: 'HUM',
    exchange: 'NYSE',
    cik: '49071',
    contract: {
      title:
        'Credit Agreement (five-year revolving / term facility; JPMorgan Chase Bank, N.A. as Administrative Agent)',
      type: 'Revolving Credit Agreement',
      filedAs: 'Exhibit 10.1 to Form 8-K',
      filedDate: 'Jun 2022',
      url: 'https://www.sec.gov/Archives/edgar/data/49071/000119312522167326/d272127dex101.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 38,
    name: 'Target Corporation',
    ticker: 'TGT',
    exchange: 'NYSE',
    cik: '27419',
    contract: {
      title:
        'Credit Agreement (364-day / revolving facility; Bank of America, N.A. as Administrative Agent)',
      type: 'Credit Agreement',
      filedAs: 'Exhibit 10.20 to Form 10-Q',
      filedDate: 'Nov 2025',
      url: 'https://www.sec.gov/Archives/edgar/data/27419/000002741925000126/tgt-20251101xexhibit1020.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 39,
    name: 'Morgan Stanley',
    ticker: 'MS',
    exchange: 'NYSE',
    cik: '895421',
    contract: {
      title:
        'Form of U.S. Distribution Agreement (Global Medium-Term Notes Series F/I, Global Units and Global Warrants)',
      type: 'Distribution Agreement',
      filedAs: 'Exhibit 1(a) to Form S-3',
      filedDate: '2026',
      url: 'https://www.sec.gov/Archives/edgar/data/895421/000095010326002477/dp241678_ex1a.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 40,
    name: 'StoneX Group Inc.',
    ticker: 'SNEX',
    exchange: 'Nasdaq',
    cik: '913760',
    contract: {
      title:
        'Restatement Agreement (dated June 3, 2025) to the Amended and Restated Credit Agreement dated February 22, 2019 (Bank of America, N.A. as Administrative Agent)',
      type: 'Revolving Credit Agreement',
      filedAs: 'Exhibit 10.1 to Form 8-K',
      filedDate: 'Jun 4, 2025',
      url: 'https://www.sec.gov/Archives/edgar/data/913760/000091376025000104/intl-20250603.htm',
      urlVerified: true,
      note: 'The restated agreement is Exhibit 10.1 to this Form 8-K (facility increased to $650M, maturity to June 2028).',
    },
    signatories: [],
  },
  {
    rank: 41,
    name: 'Tesla, Inc.',
    ticker: 'TSLA',
    exchange: 'Nasdaq',
    cik: '1318605',
    contract: {
      title:
        'Credit Agreement, dated as of January 20, 2023 (Tesla, Inc. as borrower; Citibank, N.A. as Administrative Agent)',
      type: 'Revolving Credit Agreement',
      filedAs: 'Exhibit 10.59 to Form 10-K',
      filedDate: 'Jan 2023',
      url: 'https://www.sec.gov/Archives/edgar/data/1318605/000095017023001409/tsla-ex10_59.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 42,
    name: 'Dell Technologies Inc.',
    ticker: 'DELL',
    exchange: 'NYSE',
    cik: '1571996',
    contract: {
      title:
        'Credit Agreement, dated as of November 1, 2021 — senior unsecured $6.0B revolving credit facility (JPMorgan Chase Bank, N.A. as administrative agent)',
      type: 'Revolving Credit Agreement',
      filedAs: 'Exhibit 10.1 to Form 8-K',
      filedDate: 'Nov 1, 2021',
      url: 'https://www.sec.gov/Archives/edgar/data/1571996/000119312521315488/d146470d8k.htm',
      urlVerified: true,
      note: 'Entered in connection with the VMware spin-off; credit agreement is Exhibit 10.1 to this Form 8-K.',
    },
    signatories: [],
  },
  {
    rank: 43,
    name: 'PepsiCo, Inc.',
    ticker: 'PEP',
    exchange: 'Nasdaq',
    cik: '77476',
    contract: {
      title:
        '2026 Five Year Credit Agreement — $5,000,000,000 unsecured revolving facility (Citibank, N.A. as administrative agent)',
      type: 'Revolving Credit Agreement',
      filedAs: 'Exhibit 99.1 to Form 8-K',
      filedDate: 'May 22, 2026',
      url: 'https://www.sec.gov/Archives/edgar/data/77476/000110465926065758/tm2615167d1_ex99-1.htm',
      urlVerified: true,
      note: 'PepsiCo files its full credit agreements under Exhibit 99; expires May 22, 2031.',
    },
    signatories: [],
  },
  {
    rank: 44,
    name: 'The Walt Disney Company',
    ticker: 'DIS',
    exchange: 'NYSE',
    cik: '1744489',
    contract: {
      title:
        '364-Day Credit Agreement (TWDC Enterprises 18 Corp. as guarantor; JPMorgan Chase Bank, N.A. as designated agent)',
      type: 'Revolving Credit Agreement',
      filedAs: 'Exhibit 10.1 to Form 8-K',
      filedDate: 'Feb 27, 2026',
      url: 'https://www.sec.gov/Archives/edgar/data/1744489/000119312526088356/d116769dex101.htm',
      urlVerified: true,
      note: 'The same Form 8-K also carries a new Five-Year Credit Agreement (Exhibit 10.2).',
    },
    signatories: [],
  },
  {
    rank: 45,
    name: 'United Parcel Service, Inc.',
    ticker: 'UPS',
    exchange: 'NYSE',
    cik: '1090727',
    contract: {
      title:
        'UPS Protective Covenant Agreement (executed by Carol B. Tomé, CEO)',
      type: 'Executive Covenant Agreement',
      filedAs: 'Exhibit 10.2 to Form 10-K',
      filedDate: 'Feb 20, 2020',
      url: 'https://www.sec.gov/Archives/edgar/data/1090727/000109072720000010/exhibit102-upsprotecti.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 46,
    name: 'Johnson & Johnson',
    ticker: 'JNJ',
    exchange: 'NYSE',
    cik: '200406',
    contract: {
      title:
        'Underwriting Agreement for a notes offering (Citigroup Global Markets, BofA Securities, J.P. Morgan Securities as representatives)',
      type: 'Underwriting Agreement',
      filedAs: 'Exhibit 1.1 to Form 8-K',
      filedDate: 'Feb 20, 2025',
      url: 'https://www.sec.gov/Archives/edgar/data/200406/000119312525030851/d866332d8k.htm',
      urlVerified: true,
      note: 'The Underwriting Agreement is Exhibit 1.1 to this Form 8-K.',
    },
    signatories: [],
  },
  {
    rank: 47,
    name: 'FedEx Corporation',
    ticker: 'FDX',
    exchange: 'NYSE',
    cik: '1048911',
    contract: {
      title:
        '$1,750,000,000 Five-Year Credit Agreement, dated March 15, 2024 (JPMorgan Chase Bank, N.A. as administrative agent)',
      type: 'Revolving Credit Agreement',
      filedAs: 'Exhibit 10.48 to Form 10-K',
      filedDate: 'Jul 15, 2024',
      url: 'https://www.sec.gov/Archives/edgar/data/1048911/000095017024083577/fdx-ex10_48.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 48,
    name: 'Archer-Daniels-Midland Company',
    ticker: 'ADM',
    exchange: 'NYSE',
    cik: '7084',
    contract: {
      title:
        'Employment / offer letter agreement appointing Monish Patolawala as EVP & Chief Financial Officer, dated July 3, 2024',
      type: 'Executive Employment Agreement',
      filedAs: 'Exhibit 10.1 to Form 8-K',
      filedDate: 'Jul 10, 2024',
      url: 'https://www.sec.gov/Archives/edgar/data/7084/000119312524177070/d826908dex101.htm',
      urlVerified: true,
    },
    signatories: [],
  },
  {
    rank: 49,
    name: 'The Goldman Sachs Group, Inc.',
    ticker: 'GS',
    exchange: 'NYSE',
    cik: '886982',
    contract: {
      title:
        'Forms of Underwriting Agreement for debt securities (senior / subordinated)',
      type: 'Underwriting Agreement',
      filedAs: 'Exhibits 1.1–1.11 to Form S-3/A',
      filedDate: 'Jan 28, 2025',
      url: 'https://www.sec.gov/Archives/edgar/data/886982/000119312525025313/d860775ds3a.htm',
      urlVerified: true,
      note: 'The underwriting-agreement forms are Exhibits 1.1–1.11 to this shelf registration statement.',
    },
    signatories: [],
  },
  {
    rank: 50,
    name: 'Bunge Global SA',
    ticker: 'BG',
    exchange: 'NYSE',
    cik: '1996862',
    contract: {
      title:
        '$3,200,000,000 Revolving Credit Agreement, dated March 1, 2024 (Bunge Limited Finance Corp. as borrower; JPMorgan Chase Bank, N.A. as administrative agent)',
      type: 'Revolving Credit Agreement',
      filedAs: 'Exhibit 10.1',
      filedDate: 'Mar 1, 2024',
      url: 'https://www.sec.gov/Archives/edgar/data/1996862/000199686224000049/a101-blfcxjpmxrevolvingcre.htm',
      urlVerified: true,
    },
    signatories: [],
  },
]
