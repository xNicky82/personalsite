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
  { title: '', artist: '', image: '/artwork/artwork-3.jpg' },
  { title: '', artist: '', image: '/artwork/artwork-5.jpg' },
  { title: '', artist: '', image: '/artwork/artwork-6.jpg' },
  { title: '', artist: '', image: '/artwork/artwork-7.jpg' },
]

export const EMAIL = 'nicholasjamesrocha@gmail.com'
