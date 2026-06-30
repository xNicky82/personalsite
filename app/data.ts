type WorkExperience = {
  company: string
  title: string
  start: string
  end: string
  link: string
  id: string
}

type SocialLink = {
  label: string
  link: string
}

export const WORK_EXPERIENCE: WorkExperience[] = [
  {
    company: 'Spellbook',
    title: 'Growth Lead',
    start: '2026',
    end: 'Present',
    link: 'https://www.spellbook.legal',
    id: 'work1',
  },
  {
    company: 'Pine',
    title: 'Growth Lead',
    start: '2024',
    end: '2026',
    link: 'https://www.pine.ca',
    id: 'work2',
  },
  {
    company: 'Nordexa',
    title: 'Founder',
    start: '2022',
    end: '2024',
    link: 'https://www.linkedin.com/in/nicholasjrocha/',
    id: 'work3',
  },
  {
    company: 'Tesla',
    title: 'Operations',
    start: '2024',
    end: '2024',
    link: 'https://www.tesla.com',
    id: 'work4',
  },
  {
    company: 'Vulnerable Media Lab',
    title: 'Associate Researcher',
    start: '2021',
    end: '2023',
    link: 'https://vulnerablemedialab.ca',
    id: 'work5',
  },
]

export const SOCIAL_LINKS: SocialLink[] = [
  {
    label: 'LinkedIn',
    link: 'https://www.linkedin.com/in/nicholasjrocha/',
  },
  {
    label: 'GitHub',
    link: 'https://github.com/xNicky82',
  },
]

export const EMAIL = 'nicholas.rocha@spellbook.legal'
