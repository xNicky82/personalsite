'use client'
import { motion } from 'motion/react'
import { Spotlight } from '@/components/ui/spotlight'
import { Magnetic } from '@/components/ui/magnetic'
import { Carousel } from '@/components/ui/carousel'
import { SlidingNumber } from '@/components/ui/sliding-number'
import {
  WORK_EXPERIENCE,
  EMAIL,
  SOCIAL_LINKS,
  ALBUMS,
  ARTWORKS,
} from './data'

const VARIANTS_CONTAINER = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.15,
    },
  },
}

const VARIANTS_SECTION = {
  hidden: { opacity: 0, y: 20, filter: 'blur(8px)' },
  visible: { opacity: 1, y: 0, filter: 'blur(0px)' },
}

const TRANSITION_SECTION = {
  duration: 0.3,
}

function MagneticSocialLink({
  children,
  link,
}: {
  children: React.ReactNode
  link: string
}) {
  return (
    <Magnetic springOptions={{ bounce: 0 }} intensity={0.3}>
      <a
        href={link}
        className="group relative inline-flex shrink-0 items-center gap-[1px] rounded-full bg-zinc-100 px-2.5 py-1 text-sm text-black transition-colors duration-200 hover:bg-zinc-950 hover:text-zinc-50 dark:bg-zinc-800 dark:text-zinc-100 dark:hover:bg-zinc-700"
      >
        {children}
        <svg
          width="15"
          height="15"
          viewBox="0 0 15 15"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-3 w-3"
        >
          <path
            d="M3.64645 11.3536C3.45118 11.1583 3.45118 10.8417 3.64645 10.6465L10.2929 4L6 4C5.72386 4 5.5 3.77614 5.5 3.5C5.5 3.22386 5.72386 3 6 3L11.5 3C11.6326 3 11.7598 3.05268 11.8536 3.14645C11.9473 3.24022 12 3.36739 12 3.5L12 9.00001C12 9.27615 11.7761 9.50001 11.5 9.50001C11.2239 9.50001 11 9.27615 11 9.00001V4.70711L4.35355 11.3536C4.15829 11.5488 3.84171 11.5488 3.64645 11.3536Z"
            fill="currentColor"
            fillRule="evenodd"
            clipRule="evenodd"
          ></path>
        </svg>
      </a>
    </Magnetic>
  )
}

export default function Personal() {
  return (
    <motion.main
      className="space-y-24"
      variants={VARIANTS_CONTAINER}
      initial="hidden"
      animate="visible"
    >
      <motion.section
        variants={VARIANTS_SECTION}
        transition={TRANSITION_SECTION}
      >
        <div className="flex-1 space-y-4 text-zinc-600 dark:text-zinc-400">
          <p>
            Growth Hacker at Spellbook. Previously at Pine, where I helped
            scale mortgages under administration from $90,000,000 to{' '}
            <span className="font-medium text-zinc-900 dark:text-zinc-100">
              $<SlidingNumber from={90000000} to={2500000000} duration={3} />
            </span>
            . Before that, I founded a spatial design studio and spent time on
            operations at Tesla.
          </p>
        </div>
      </motion.section>

      <motion.section
        variants={VARIANTS_SECTION}
        transition={TRANSITION_SECTION}
      >
        <h3 className="mb-5 text-lg font-medium">Work Experience</h3>
        <div className="flex flex-col space-y-2">
          {WORK_EXPERIENCE.map((job) => (
            <a
              className="relative overflow-hidden rounded-2xl bg-zinc-300/30 p-[1px] dark:bg-zinc-600/30"
              href={job.link}
              target="_blank"
              rel="noopener noreferrer"
              key={job.id}
            >
              <Spotlight
                className="from-zinc-900 via-zinc-800 to-zinc-700 blur-2xl dark:from-zinc-100 dark:via-zinc-200 dark:to-zinc-50"
                size={64}
              />
              <div className="relative h-full w-full rounded-[15px] bg-white p-4 dark:bg-zinc-950">
                <div className="relative flex w-full flex-row justify-between">
                  <div>
                    <h4 className="font-normal dark:text-zinc-100">
                      {job.title}
                    </h4>
                    <p className="text-zinc-500 dark:text-zinc-400">
                      {job.company}
                    </p>
                  </div>
                  <p className="text-zinc-600 dark:text-zinc-400">
                    {job.start} - {job.end}
                  </p>
                </div>
              </div>
            </a>
          ))}
        </div>
      </motion.section>

      <motion.section
        variants={VARIANTS_SECTION}
        transition={TRANSITION_SECTION}
      >
        <h3 className="mb-5 text-lg font-medium">Albums on rotation</h3>
        <Carousel itemClassName="w-32 sm:w-36">
          {ALBUMS.map((album) => (
            <div key={album.cover} className="space-y-2">
              <div className="aspect-square overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200/60 ring-inset dark:bg-zinc-900 dark:ring-zinc-800/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={album.cover}
                  alt={album.title || 'Album cover'}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              {(album.title || album.artist) && (
                <div className="px-1">
                  {album.title && (
                    <p className="truncate text-sm text-zinc-900 dark:text-zinc-100">
                      {album.title}
                    </p>
                  )}
                  {album.artist && (
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {album.artist}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </Carousel>
      </motion.section>

      <motion.section
        variants={VARIANTS_SECTION}
        transition={TRANSITION_SECTION}
      >
        <h3 className="mb-5 text-lg font-medium">Artwork I like</h3>
        <Carousel itemClassName="w-44 sm:w-52">
          {ARTWORKS.map((art) => (
            <div key={art.image} className="space-y-2">
              <div className="aspect-[3/4] overflow-hidden rounded-xl bg-zinc-100 ring-1 ring-zinc-200/60 ring-inset dark:bg-zinc-900 dark:ring-zinc-800/60">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={art.image}
                  alt={art.title}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </div>
              {(art.title || art.artist) && (
                <div className="px-1">
                  {art.title && (
                    <p className="truncate text-sm text-zinc-900 dark:text-zinc-100">
                      {art.title}
                    </p>
                  )}
                  {art.artist && (
                    <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">
                      {art.artist}
                    </p>
                  )}
                </div>
              )}
            </div>
          ))}
        </Carousel>
      </motion.section>

      <motion.section
        variants={VARIANTS_SECTION}
        transition={TRANSITION_SECTION}
      >
        <h3 className="mb-5 text-lg font-medium">Connect</h3>
        <p className="mb-5 text-zinc-600 dark:text-zinc-400">
          Reach me at{' '}
          <a className="underline dark:text-zinc-300" href={`mailto:${EMAIL}`}>
            {EMAIL}
          </a>
        </p>
        <div className="flex items-center justify-start space-x-3">
          {SOCIAL_LINKS.map((link) => (
            <MagneticSocialLink key={link.label} link={link.link}>
              {link.label}
            </MagneticSocialLink>
          ))}
        </div>
      </motion.section>
    </motion.main>
  )
}
