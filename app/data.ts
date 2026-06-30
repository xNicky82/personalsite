type WorkExperience = {
  company: string
  title: string
  start: string
  end: string
  link: string
  id: string
}

type Education = {
  school: string
  credential: string
  description: string
  start: string
  end: string
  link: string
  id: string
}

type SocialLink = {
  label: string
  link: string
}

type FeaturedProject = {
  title: string
  description: string
  link: string
  image: string
  id: string
}

type PressItem = {
  outlet: string
  title: string
  link: string
  id: string
}

type Album = {
  title: string
  artist: string
  cover: string
}

type Artwork = {
  title: string
  artist: string
  image: string
}

export const FEATURED_PROJECTS: FeaturedProject[] = [
  {
    title: "Canada's Largest Giveaway",
    description:
      'Wealthsimple × Pine gave away a fully furnished million-dollar home in Prince Edward County to celebrate $1B in mortgages funded. I led the campaign.',
    link: 'https://www.wealthsimple.com/en-ca/house-giveaway-2025',
    image: '/projects/canadas-largest-giveaway.jpg',
    id: 'project1',
  },
]

export const PRESS: PressItem[] = [
  {
    outlet: 'iPhone in Canada',
    title:
      'Wealthsimple Is Giving Away a Million-Dollar House (Plus $100K Cash)',
    link: 'https://www.iphoneincanada.ca/2025/10/04/wealthsimple-is-giving-away-a-million-dollar-house-plus-100k-cash/',
    id: 'press1',
  },
  {
    outlet: 'Narcity',
    title:
      'You could win this million dollar home in Prince Edward County and here’s how to enter',
    link: 'https://www.narcity.com/win-home-prince-edward-county',
    id: 'press2',
  },
  {
    outlet: 'Startup Ecosystem Canada',
    title: 'Wealthsimple Launches Major Giveaway for Canadian Homeownership',
    link: 'https://www.startupecosystem.ca/news/wealthsimple-launches-major-giveaway-for-canadian-homeownership/',
    id: 'press3',
  },
  {
    outlet: 'Wealthsimple on X',
    title: 'And the winner is in! — Christian, from Quebec',
    link: 'https://x.com/Wealthsimple/status/2022749314749968653',
    id: 'press4',
  },
]

export const WORK_EXPERIENCE: WorkExperience[] = [
  {
    company: 'Spellbook',
    title: 'Growth Hacker',
    start: '2026',
    end: 'Present',
    link: 'https://www.spellbook.legal',
    id: 'work1',
  },
  {
    company: 'Pine',
    title: 'Growth Hacker',
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

export const EDUCATION: Education[] = [
  {
    school: 'Queen’s University',
    credential: 'Bachelor of Arts, Honours — Media Studies, Business',
    description:
      'Study of media and technology through historical and theoretical lenses, with emphasis on design rhetoric and the relationship between human communication and interface. Focused on Human-Artificial Intelligence Interaction (HAII), exploring how people engage with AI at the intersection of computer science, behavioural science, and design.',
    start: '',
    end: '',
    link: 'https://www.queensu.ca',
    id: 'edu1',
  },
  {
    school: 'Queen’s University',
    credential: 'Certificate, Innovation & Creativity',
    description:
      'Focused study on the role of creativity in business problem solving, specializing in how creative methods are applied to strategy, product, and marketing to drive innovation.',
    start: '',
    end: '',
    link: 'https://www.queensu.ca',
    id: 'edu2',
  },
]

export const SOCIAL_LINKS: SocialLink[] = [
  {
    label: 'LinkedIn',
    link: 'https://www.linkedin.com/in/nicholasjrocha/',
  },
  {
    label: 'X',
    link: 'https://x.com/NicholasJRocha',
  },
]

export const ALBUMS: Album[] = [
  { title: '', artist: '', cover: '/albums/album-1.jpg' },
  { title: '', artist: '', cover: '/albums/album-2.jpg' },
  { title: '', artist: '', cover: '/albums/album-3.jpg' },
  { title: '', artist: '', cover: '/albums/album-4.jpg' },
  { title: '', artist: '', cover: '/albums/album-5.jpg' },
  { title: '', artist: '', cover: '/albums/album-6.jpg' },
  { title: '', artist: '', cover: '/albums/album-7.jpg' },
  { title: '', artist: '', cover: '/albums/album-8.jpg' },
  { title: '', artist: '', cover: '/albums/album-9.jpg' },
  { title: '', artist: '', cover: '/albums/album-10.jpg' },
  { title: '', artist: '', cover: '/albums/album-11.jpg' },
]

export const ARTWORKS: Artwork[] = [
  {
    title: 'The Wood Engraver',
    artist: 'Charles Frederic Ulrich',
    image: '/artwork/artwork-3.jpg',
  },
  {
    title: 'In the Forge',
    artist: 'Stanisław Lentz',
    image: '/artwork/artwork-5.jpg',
  },
  {
    title: 'The Port of New York by Moonlight',
    artist: 'Edward Moran',
    image: '/artwork/artwork-6.jpg',
  },
  {
    title: 'A Venetian Onion Seller',
    artist: 'John Singer Sargent',
    image: '/artwork/artwork-7.jpg',
  },
]

export const EMAIL = 'nicholasjamesrocha@gmail.com'
