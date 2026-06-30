'use client'
import { useCallback, useEffect, useRef, useState } from 'react'
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
  const [paused, setPaused] = useState(false)

  const autoAdvance = useCallback(() => {
    const el = scrollerRef.current
    if (!el) return
    const firstItem = el.firstElementChild as HTMLElement | null
    const step = firstItem
      ? firstItem.getBoundingClientRect().width + 12
      : el.clientWidth * 0.8
    const atEnd = el.scrollLeft + el.clientWidth >= el.scrollWidth - 4
    if (atEnd) {
      el.scrollTo({ left: 0, behavior: 'smooth' })
    } else {
      el.scrollBy({ left: step, behavior: 'smooth' })
    }
  }, [])

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
          <div key={i} className={cn('shrink-0 snap-start', itemClassName)}>
            {child}
          </div>
        ))}
      </div>
    </div>
  )
}
