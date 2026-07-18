import avatarNate from '../../assets/mention/avatar-nate.jpg'
import avatarVecna from '../../assets/mention/avatar-vecna.png'
import avatarAthina from '../../assets/mention/avatar-athina.png'
import avatarJoan from '../../assets/mention/avatar-joan.jpg'
import avatarOxy from '../../assets/mention/avatar-oxy.jpg'
import postNate from '../../assets/mention/post-nate.jpg'
import postOxy from '../../assets/mention/post-oxy.jpg'
import postOxy2 from '../../assets/mention/post-oxy2.png'
import postUpsideDown from '../../assets/mention/post-upsidedown.webp'

export interface MentionPost {
  id: string
  name: string
  handle: string
  time: string
  avatar: string
  text?: string
  image?: string
}

/** The post deck reused across the floating cards and the phone feed. */
export const MENTION_POSTS: readonly MentionPost[] = [
  { id: 'vecna-1', name: 'Henry Creel', handle: 'vecna', time: '3h', avatar: avatarVecna, text: 'Formerly Henry Creel. Shaper of worlds. Breaker of illusions. Time tells the truth.' },
  { id: 'athina-1', name: 'Athina Isern Castro', handle: 'athina', time: '2h', avatar: avatarAthina, text: '🏷️' },
  { id: 'nate-1', name: 'Nate Isern Alvarez', handle: 'nate', time: '16h', avatar: avatarNate, text: 'Los cambios son inevitables, pero también son una oportunidad de crecimiento.' },
  { id: 'oxy-1', name: 'Oxy', handle: 'oxy', time: '12h', avatar: avatarOxy, text: 'Posts. Communities. Feeds. Photos. Polls. Streams. Questions. Videos. Chat.', image: postOxy2 },
  { id: 'oxy-2', name: 'Oxy', handle: 'oxy', time: '12h', avatar: avatarOxy, text: 'Send love to your loved ones, shout out to your peers, spread positivity all around! 🌟💌' },
  { id: 'vecna-2', name: 'Henry Creel', handle: 'vecna', time: '12h', avatar: avatarVecna, text: 'The real monster doesn’t live in the Upside Down. It lives in your lies. I just pulled back the curtain.', image: postUpsideDown },
  { id: 'joan-1', name: 'Joan Carles Isern Guilera', handle: 'joan', time: '3h', avatar: avatarJoan, text: 'Just got back from a hike and WOW, the view was worth every step! 🏞️ Nature has a unique way of reminding us how small yet connected we are. 🌿✨ #OutdoorAdventures #Grateful' },
  { id: 'nate-2', name: 'Nate Isern Alvarez', handle: 'nate', time: '16h', avatar: avatarNate, text: '"Hi!!! Happy to be using Mention!"', image: postNate },
  { id: 'nate-3', name: 'Nate Isern Alvarez', handle: 'nate', time: '12h', avatar: avatarNate, text: "Proud to share that after months of hard work, our team successfully launched Mention! 🚀 Collaboration, innovation, and resilience made it possible. Here's to reaching new heights together! 🙌 #Teamwork #Innovation #Success", image: postOxy },
]

export interface MentionProfile {
  name: string
  handle: string
  bio: string
  following: string
  followers: string
  avatar: string
}

export const MENTION_PROFILES: readonly MentionProfile[] = [
  {
    name: 'Nate Isern Alvarez',
    handle: 'nate',
    bio: 'Entrepreneur, programmer and unfiltered. CEO and Founder of Oxy | Developer | Artificial Intelligence and Innovation for social impact.',
    following: '1603',
    followers: '723K',
    avatar: avatarNate,
  },
  {
    name: 'Henry Creel',
    handle: 'vecna',
    bio: 'Formerly Henry Creel. Shaper of worlds. Breaker of illusions. Time tells the truth.',
    following: '216',
    followers: '163K',
    avatar: avatarVecna,
  },
]

/** Handles the username slot rolls through in the "your unique link" section. */
export const MENTION_HANDLES: readonly string[] = [
  'aina', 'loak', 'zoe', 'eike', 'nate', 'gabriela', 'clara', 'athina', 'joan', 'enric', 'niko',
]
