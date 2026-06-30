'use client'
import { useEffect, useRef, useState } from 'react'
import { ChevronLeftIcon, ChevronRightIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

type CarouselProps = {
  children: React.ReactNode
  className?: string
  itemClassName?: string
}

export function Carousel({ children, className, itemClassName }: CarouselProps) {
  const scrollerRef = useRef<HTMLDivElement>(null)
  const [canScrollLeft, setCanScrollLeft] = useState(false)
  const [canScrollRight, setCanScrollRight] = useState(false)

  const updateScrollState = () => {
    const el = scrollerRef.current
    if (!el) return
    setCanScrollLeft(el.scrollLeft > 4)
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4)
  }

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
  }, [])

  const scrollBy = (direction: 1 | -1) => {
    const el = scrollerRef.current
    if (!el) return
    const amount = el.clientWidth * 0.8 * direction
    el.scrollBy({ left: amount, behavior: 'smooth' })
  }

  const items = Array.isArray(children) ? children : [children]

  return (
    <div className={cn('relative', className)}>
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
        onClick={() => scrollBy(-1)}
        disabled={!canScrollLeft}
        className="absolute top-1/2 left-1 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-sm ring-1 ring-zinc-200 transition-opacity hover:bg-white disabled:pointer-events-none disabled:opacity-0 sm:inline-flex dark:bg-zinc-900/90 dark:text-zinc-200 dark:ring-zinc-700"
      >
        <ChevronLeftIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        aria-label="Scroll right"
        onClick={() => scrollBy(1)}
        disabled={!canScrollRight}
        className="absolute top-1/2 right-1 hidden h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-zinc-700 shadow-sm ring-1 ring-zinc-200 transition-opacity hover:bg-white disabled:pointer-events-none disabled:opacity-0 sm:inline-flex dark:bg-zinc-900/90 dark:text-zinc-200 dark:ring-zinc-700"
      >
        <ChevronRightIcon className="h-4 w-4" />
      </button>
    </div>
  )
}
