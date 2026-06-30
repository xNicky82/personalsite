'use client'
import { useEffect, useRef, useState } from 'react'
import { animate, useInView } from 'motion/react'

type SlidingNumberProps = {
  from?: number
  to: number
  duration?: number
  decimals?: number
  className?: string
}

export function SlidingNumber({
  from = 0,
  to,
  duration = 2.4,
  decimals = 0,
  className,
}: SlidingNumberProps) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, margin: '0px 0px -10% 0px' })
  const [display, setDisplay] = useState(from)

  useEffect(() => {
    if (!inView) return
    const controls = animate(from, to, {
      duration,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (value) => setDisplay(value),
    })
    return () => controls.stop()
  }, [inView, from, to, duration])

  const formatted = display.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })

  return (
    <span ref={ref} className={className}>
      {formatted}
    </span>
  )
}
