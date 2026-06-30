'use client'
import { TextEffect } from '@/components/ui/text-effect'
import Image from 'next/image'
import Link from 'next/link'

export function Header() {
  return (
    <header className="mb-8 flex items-center gap-4">
      <Image
        src="/headshot.jpg"
        alt="Nicholas Rocha"
        width={56}
        height={56}
        className="h-14 w-14 rounded-full object-cover"
        priority
      />
      <div>
        <Link href="/" className="font-medium text-black dark:text-white">
          Nicholas Rocha
        </Link>
        <TextEffect
          as="p"
          preset="fade"
          per="char"
          className="text-zinc-600 dark:text-zinc-500"
          delay={0.5}
        >
          Growth at Spellbook
        </TextEffect>
      </div>
    </header>
  )
}
