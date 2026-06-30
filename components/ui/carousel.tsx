'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type CarouselProps = {
  children: React.ReactNode
  className?: string
  itemClassName?: string
  autoScrollInterval?: number
}

export function Carousel({
  children,
  className,
  itemClassName,
  autoScrollInterval,
}: CarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)
  const [paused, setPaused] = useState(false)

  const updateScrollState = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }, [])

  useEffect(() => {
    updateScrollState()
    const el = scrollerRef.current
    if (!el) return
    el.addEventListener('scroll', updateScrollState, { passive: true })
    window.addEventListener('resize', updateScrollState)
    return () => {
      el.removeEventListener('scroll', updateScrollState)
      window.removeEventListener('resize', updateScrollState)
    }
  }, [updateScrollState])

  const advance = useCallback((direction: 1 | -1) => {
    const el = scrollerRef.current
    if (!el) return
    const firstItem = el.firstElementChild as HTMLElement | null
    const step = firstItem
      ? firstItem.getBoundingClientRect().width + 12
      : el.clientWidth * 0.8
    el.scrollBy({ left: step * direction, behavior: 'smooth' })
  }, [])

  const autoAdvance = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
    if (atEnd) {
      el.scrollTo({ left: 0, behavior: 'smooth' })
    } else {
      advance(1)
    }
  }, [advance])

  useEffect(() => {
    if (!autoScrollInterval || paused) return
    const id = window.setInterval(autoAdvance, autoScrollInterval)
    return () => window.clearInterval(id)
  }, [autoScrollInterval, paused, autoAdvance])

  const items = Array.isArray(children) ? children : [children]

  return (
    <div
      className={cn('relative', className)}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={() => setPaused(true)}
      onTouchEnd={() => setPaused(false)}
    >
      <div
        ref={scrollerRef}
        className="flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-smooth pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {items.map((child, i) => (
          <div
            key={i}
            className={cn('shrink-0 snap-start', itemClassName)}
          >
            {child}
          </div>
        ))}
      </div>
      <button
        type="button"
        aria-label="Scroll left"
        onClick={() => advance(-1)}
        disabled={!canScrollLeft}
        className="absolute top-1/2 left-1 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-sm ring-1 ring-zinc-200 transition-opacity hover:bg-white disabled:pointer-events-none disabled:opacity-0 sm:inline-flex dark:bg-zinc-900/90 dark:text-zinc-200 dark:ring-zinc-700"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => advance(1)}
        disabled={!canScrollRight}
        className="absolute top-1/2 right-1 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-sm ring-1 ring-zinc-200 transition-opacity hover:bg-white disabled:pointer-events-none disabled:opacity-0 sm:inline-flex dark:bg-zinc-900/90 dark:text-zinc-200 dark:ring-zinc-700"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  )
}
