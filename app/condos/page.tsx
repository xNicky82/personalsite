'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  LISTINGS,
  NEIGHBORHOODS,
  type Listing,
  availabilityDetail,
  availabilityLabel,
  bedsLabel,
  daysUntilAvailable,
  formatRent,
  monthsUntilAvailable,
} from './data'

type PreOffer = {
  amount: number
  moveIn: string
  name: string
  email: string
  note: string
  createdAt: string
}

type PreOffers = Record<string, PreOffer>

const STORAGE_KEY = 'prelist.preoffers.v1'

type Sort = 'availability' | 'rent-asc' | 'rent-desc'

export default function PrelistPage() {
  const [mounted, setMounted] = useState(false)
  const [offers, setOffers] = useState<PreOffers>({})

  // filters
  const [q, setQ] = useState('')
  const [neighborhood, setNeighborhood] = useState('any')
  const [beds, setBeds] = useState('any')
  const [maxRent, setMaxRent] = useState('any')
  const [windowMonths, setWindowMonths] = useState('any')
  const [sort, setSort] = useState<Sort>('availability')

  // ui
  const [view, setView] = useState<'browse' | 'offers'>('browse')
  const [active, setActive] = useState<Listing | null>(null)

  // hydrate saved pre-offers
  useEffect(() => {
    setMounted(true)
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) setOffers(JSON.parse(raw))
    } catch {
      // ignore corrupt storage
    }
  }, [])

  useEffect(() => {
    if (!mounted) return
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(offers))
    } catch {
      // ignore quota / private-mode errors
    }
  }, [offers, mounted])

  const results = useMemo(() => {
    const query = q.trim().toLowerCase()
    const list = LISTINGS.filter((l) => {
      if (
        query &&
        !`${l.building} ${l.neighborhood} ${l.unit} ${l.view} ${l.blurb}`
          .toLowerCase()
          .includes(query)
      )
        return false
      if (neighborhood !== 'any' && l.neighborhood !== neighborhood)
        return false
      if (beds !== 'any') {
        if (beds === '3' ? l.beds < 3 : String(l.beds) !== beds) return false
      }
      if (maxRent !== 'any' && l.rent > Number(maxRent)) return false
      if (windowMonths !== 'any') {
        const m = monthsUntilAvailable(l)
        if (m > Number(windowMonths)) return false
      }
      return true
    })

    list.sort((a, b) => {
      if (sort === 'rent-asc') return a.rent - b.rent
      if (sort === 'rent-desc') return b.rent - a.rent
      return daysUntilAvailable(a) - daysUntilAvailable(b)
    })
    return list
  }, [q, neighborhood, beds, maxRent, windowMonths, sort])

  const offerCount = Object.keys(offers).length
  const offerListings = LISTINGS.filter((l) => offers[l.id])

  function submitOffer(listing: Listing, offer: PreOffer) {
    setOffers((prev) => ({ ...prev, [listing.id]: offer }))
    setActive(null)
  }

  function withdraw(id: string) {
    setOffers((prev) => {
      const next = { ...prev }
      delete next[id]
      return next
    })
  }

  const resetFilters = () => {
    setQ('')
    setNeighborhood('any')
    setBeds('any')
    setMaxRent('any')
    setWindowMonths('any')
    setSort('availability')
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white font-[family-name:var(--font-geist)] text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
      <div className="mx-auto w-full max-w-5xl px-5 pb-24 pt-6">
        {/* top bar */}
        <header className="flex items-center justify-between border-b border-zinc-200 pb-5 dark:border-zinc-800">
          <button
            onClick={() => setView('browse')}
            className="text-left"
            type="button"
          >
            <div className="text-lg font-semibold tracking-tight">
              Prelist<span className="text-zinc-400">.</span>
            </div>
            <div className="text-xs text-zinc-500">
              Toronto condos, before they list
            </div>
          </button>
          <nav className="flex items-center gap-2 text-sm">
            <button
              type="button"
              onClick={() => setView('browse')}
              className={pill(view === 'browse')}
            >
              Browse
            </button>
            <button
              type="button"
              onClick={() => setView('offers')}
              className={pill(view === 'offers')}
            >
              My pre-offers
              {offerCount > 0 && (
                <span className="ml-1.5 inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-zinc-900 px-1 text-xs font-medium text-white dark:bg-white dark:text-zinc-900">
                  {offerCount}
                </span>
              )}
            </button>
          </nav>
        </header>

        {view === 'browse' ? (
          <>
            {/* intro */}
            <section className="py-8">
              <h1 className="max-w-2xl text-2xl font-semibold leading-snug tracking-tight sm:text-3xl">
                Find a condo now. Claim it before the lease is even up.
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                Regular sites only show you units in the last month of a lease.
                Prelist shows every unit with its{' '}
                <span className="text-zinc-900 dark:text-zinc-100">
                  estimated availability
                </span>{' '}
                so you can register a pre-offer today and be first in line the
                moment it opens up.
              </p>
            </section>

            {/* filters */}
            <section className="grid grid-cols-2 gap-3 border-y border-zinc-200 py-4 dark:border-zinc-800 sm:grid-cols-3 lg:grid-cols-6">
              <label className="col-span-2 sm:col-span-3 lg:col-span-2">
                <span className="sr-only">Search</span>
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  placeholder="Search building, area, view…"
                  className={inputClass}
                />
              </label>

              <Select
                value={neighborhood}
                onChange={setNeighborhood}
                label="Neighborhood"
              >
                <option value="any">All areas</option>
                {NEIGHBORHOODS.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </Select>

              <Select value={beds} onChange={setBeds} label="Beds">
                <option value="any">Any beds</option>
                <option value="0">Studio</option>
                <option value="1">1 bed</option>
                <option value="2">2 bed</option>
                <option value="3">3+ bed</option>
              </Select>

              <Select value={maxRent} onChange={setMaxRent} label="Max rent">
                <option value="any">Any price</option>
                <option value="2500">≤ $2,500</option>
                <option value="3000">≤ $3,000</option>
                <option value="4000">≤ $4,000</option>
                <option value="6000">≤ $6,000</option>
              </Select>

              <Select
                value={windowMonths}
                onChange={setWindowMonths}
                label="Available within"
              >
                <option value="any">Any time</option>
                <option value="3">≤ 3 months</option>
                <option value="6">≤ 6 months</option>
                <option value="12">≤ 12 months</option>
              </Select>
            </section>

            <div className="flex items-center justify-between py-4 text-sm text-zinc-500">
              <span>
                {results.length} unit{results.length === 1 ? '' : 's'}
              </span>
              <div className="flex items-center gap-3">
                <Select
                  value={sort}
                  onChange={(v) => setSort(v as Sort)}
                  label="Sort"
                  compact
                >
                  <option value="availability">Soonest available</option>
                  <option value="rent-asc">Rent: low to high</option>
                  <option value="rent-desc">Rent: high to low</option>
                </Select>
              </div>
            </div>

            {/* results */}
            {results.length === 0 ? (
              <div className="rounded-lg border border-dashed border-zinc-300 py-16 text-center dark:border-zinc-700">
                <p className="text-sm text-zinc-500">
                  No units match those filters.
                </p>
                <button
                  onClick={resetFilters}
                  className="mt-3 text-sm font-medium underline underline-offset-4"
                  type="button"
                >
                  Reset filters
                </button>
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {results.map((l) => (
                  <ListingCard
                    key={l.id}
                    listing={l}
                    hasOffer={Boolean(offers[l.id])}
                    onOffer={() => setActive(l)}
                  />
                ))}
              </div>
            )}
          </>
        ) : (
          <OffersView
            listings={offerListings}
            offers={offers}
            onWithdraw={withdraw}
            onEdit={(l) => setActive(l)}
            onBrowse={() => setView('browse')}
          />
        )}
      </div>

      {active && (
        <OfferDialog
          listing={active}
          existing={offers[active.id]}
          onClose={() => setActive(null)}
          onSubmit={submitOffer}
        />
      )}
    </div>
  )
}

/* -------------------------------------------------------------------------- */

const inputClass =
  'w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-900 focus:outline-none dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:focus:border-zinc-100'

function pill(active: boolean) {
  return [
    'inline-flex items-center rounded-full px-3 py-1.5 transition-colors',
    active
      ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
      : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800',
  ].join(' ')
}

function Select({
  value,
  onChange,
  label,
  children,
  compact,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  children: React.ReactNode
  compact?: boolean
}) {
  return (
    <label className={compact ? '' : 'block'}>
      <span className="sr-only">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`${inputClass} ${compact ? 'w-auto' : ''} cursor-pointer appearance-none pr-8`}
      >
        {children}
      </select>
    </label>
  )
}

function StatusPill({ listing }: { listing: Listing }) {
  const now = daysUntilAvailable(listing) <= 0
  return (
    <span
      className={[
        'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
        now
          ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900'
          : 'border-zinc-300 text-zinc-700 dark:border-zinc-700 dark:text-zinc-300',
      ].join(' ')}
    >
      <span
        className={[
          'h-1.5 w-1.5 rounded-full',
          now ? 'bg-white dark:bg-zinc-900' : 'bg-zinc-400',
        ].join(' ')}
      />
      {availabilityLabel(listing)}
    </span>
  )
}

function ListingCard({
  listing,
  hasOffer,
  onOffer,
}: {
  listing: Listing
  hasOffer: boolean
  onOffer: () => void
}) {
  return (
    <article className="flex flex-col rounded-lg border border-zinc-200 p-4 transition-colors hover:border-zinc-400 dark:border-zinc-800 dark:hover:border-zinc-600">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-medium leading-tight">{listing.building}</h3>
          <p className="text-sm text-zinc-500">
            {listing.neighborhood} · Unit {listing.unit}
          </p>
        </div>
        <StatusPill listing={listing} />
      </div>

      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        {listing.blurb}
      </p>

      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
        <Spec k="Layout" v={`${bedsLabel(listing.beds)} · ${listing.baths} bath`} />
        <Spec k="Size" v={`${listing.sqft} sqft`} />
        <Spec k="Floor" v={`${listing.floor}`} />
        <Spec k="View" v={listing.view} />
      </dl>

      <div className="mt-3 flex flex-wrap gap-1.5 text-xs text-zinc-500">
        {listing.parking && <Tag>Parking</Tag>}
        {listing.pets && <Tag>Pet-friendly</Tag>}
      </div>

      <div className="mt-4 flex items-end justify-between border-t border-zinc-100 pt-4 dark:border-zinc-800/70">
        <div>
          <div className="text-lg font-semibold">
            {formatRent(listing.rent)}
            <span className="text-sm font-normal text-zinc-500">/mo</span>
          </div>
          <div className="text-xs text-zinc-500">
            {availabilityDetail(listing)}
          </div>
        </div>
        <button
          type="button"
          onClick={onOffer}
          className={[
            'rounded-md px-3.5 py-2 text-sm font-medium transition-colors',
            hasOffer
              ? 'border border-zinc-300 text-zinc-700 hover:bg-zinc-100 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-800'
              : 'bg-zinc-900 text-white hover:bg-zinc-700 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200',
          ].join(' ')}
        >
          {hasOffer ? 'Edit pre-offer' : 'Pre-offer'}
        </button>
      </div>
    </article>
  )
}

function Spec({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex justify-between gap-2">
      <dt className="text-zinc-400">{k}</dt>
      <dd className="text-right text-zinc-700 dark:text-zinc-300">{v}</dd>
    </div>
  )
}

function Tag({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded border border-zinc-200 px-1.5 py-0.5 dark:border-zinc-800">
      {children}
    </span>
  )
}

/* --------------------------------- dialog --------------------------------- */

function OfferDialog({
  listing,
  existing,
  onClose,
  onSubmit,
}: {
  listing: Listing
  existing?: PreOffer
  onClose: () => void
  onSubmit: (listing: Listing, offer: PreOffer) => void
}) {
  const [name, setName] = useState(existing?.name ?? '')
  const [email, setEmail] = useState(existing?.email ?? '')
  const [amount, setAmount] = useState(
    existing ? String(existing.amount) : String(listing.rent),
  )
  const [moveIn, setMoveIn] = useState(existing?.moveIn ?? listing.leaseEnd)
  const [note, setNote] = useState(existing?.note ?? '')

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const valid = name.trim() && email.trim() && Number(amount) > 0

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!valid) return
    onSubmit(listing, {
      name: name.trim(),
      email: email.trim(),
      amount: Number(amount),
      moveIn,
      note: note.trim(),
      createdAt: existing?.createdAt ?? new Date().toISOString(),
    })
  }

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end justify-center bg-zinc-900/40 p-0 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md rounded-t-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-800 dark:bg-zinc-950 sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold">Register a pre-offer</h2>
            <p className="text-sm text-zinc-500">
              {listing.building} · Unit {listing.unit} ·{' '}
              {listing.neighborhood}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-md p-1 text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800"
          >
            ✕
          </button>
        </div>

        <div className="mt-3 rounded-md bg-zinc-100 px-3 py-2 text-xs text-zinc-600 dark:bg-zinc-900 dark:text-zinc-400">
          {availabilityDetail(listing)} — asking {formatRent(listing.rent)}/mo.
          You&apos;re registering interest, not signing a lease.
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Your name">
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={inputClass}
                placeholder="Alex Kim"
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="you@email.com"
              />
            </Field>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Your offer ($/mo)">
              <input
                type="number"
                min={0}
                step={25}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field label="Ideal move-in">
              <input
                type="date"
                value={moveIn}
                onChange={(e) => setMoveIn(e.target.value)}
                className={inputClass}
              />
            </Field>
          </div>

          <Field label="Note to owner (optional)">
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className={`${inputClass} resize-none`}
              placeholder="Non-smoker, no pets, flexible on dates…"
            />
          </Field>

          <button
            type="submit"
            disabled={!valid}
            className="w-full rounded-md bg-zinc-900 py-2.5 text-sm font-medium text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40 dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-200"
          >
            {existing ? 'Update pre-offer' : 'Submit pre-offer'}
          </button>
        </form>
      </div>
    </div>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium text-zinc-500">
        {label}
      </span>
      {children}
    </label>
  )
}

/* --------------------------------- offers --------------------------------- */

function OffersView({
  listings,
  offers,
  onWithdraw,
  onEdit,
  onBrowse,
}: {
  listings: Listing[]
  offers: PreOffers
  onWithdraw: (id: string) => void
  onEdit: (l: Listing) => void
  onBrowse: () => void
}) {
  if (listings.length === 0) {
    return (
      <div className="py-16 text-center">
        <h2 className="text-lg font-semibold">No pre-offers yet</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-zinc-500">
          Register interest on a unit and it&apos;ll show up here. We&apos;ll
          notify you the moment the lease is up.
        </p>
        <button
          type="button"
          onClick={onBrowse}
          className="mt-4 rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-white dark:text-zinc-900"
        >
          Browse units
        </button>
      </div>
    )
  }

  return (
    <div className="py-8">
      <h2 className="text-xl font-semibold">Your pre-offers</h2>
      <p className="mt-1 text-sm text-zinc-500">
        {listings.length} unit{listings.length === 1 ? '' : 's'} queued. First
        in line when each lease ends.
      </p>

      <div className="mt-5 space-y-3">
        {listings.map((l) => {
          const o = offers[l.id]
          return (
            <div
              key={l.id}
              className="flex flex-col gap-3 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800 sm:flex-row sm:items-center sm:justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-medium">{l.building}</h3>
                  <StatusPill listing={l} />
                </div>
                <p className="text-sm text-zinc-500">
                  {l.neighborhood} · Unit {l.unit} · {bedsLabel(l.beds)}
                </p>
                <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                  Your offer:{' '}
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {formatRent(o.amount)}/mo
                  </span>{' '}
                  · move-in {o.moveIn}
                  {o.note ? ` · “${o.note}”` : ''}
                </p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => onEdit(l)}
                  className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm font-medium hover:bg-zinc-100 dark:border-zinc-700 dark:hover:bg-zinc-800"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => onWithdraw(l.id)}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-900 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
                >
                  Withdraw
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
