import { BRAND_MARKS } from '../brand-assets';
import referenceMap from '../horizon/map.json';
import type { WheelData } from '../../components/horizon/Wheel';

export interface EcosystemProject {
  name: string;
  description: string;
  icon?: { src: string; monochrome?: boolean };
  /** A product introduction, not a claim that every service is available. */
  href?: string;
}
export interface EcosystemArea {
  id: string;
  name: string;
  description: string;
  detail: string;
  projects: EcosystemProject[];
}
export interface EcosystemDomain {
  id: string;
  name: string;
  headline: string;
  description: string;
  areas: EcosystemArea[];
}

// Human needs lead the map. Products and initiatives belong to the third level:
// their contribution to a particular need. A missing destination denotes a vision.
export const ecosystemDomains: EcosystemDomain[] = [
  {
    id: 'health',
    name: 'Health',
    headline: 'A healthier life, together.',
    description:
      'Care begins with people, and with the places and relationships that help us thrive.',
    areas: [
      {
        id: 'care',
        name: 'Care for each other',
        description: 'Support when it matters.',
        detail:
          'We imagine care that is easier to find and communities where looking after one another is part of everyday life. Health belongs in the wider picture of how we live.',
        projects: [],
      },
      {
        id: 'wellbeing',
        name: 'Live well',
        description: 'Room for everyday wellbeing.',
        detail:
          'Time to rest, nourishing food, movement and a safe home all shape wellbeing. Connecting these needs is part of our vision for a healthier everyday life.',
        projects: [],
      },
      {
        id: 'healthy-places',
        name: 'Build healthy places',
        description: 'Stronger foundations for everyone.',
        detail:
          'Clean water, local support and resilient communities give people more room to thrive. Community initiatives are one way to contribute to those foundations.',
        projects: [
          {
            name: 'Oxy Initiative',
            icon: { src: '/images/apps/initiative.svg', monochrome: true },
            description: 'Community projects, including healthcare and clean water.',
            href: '/initiative/',
          },
        ],
      },
    ],
  },
  {
    id: 'education',
    name: 'Education',
    headline: 'A lifetime of discovery.',
    description:
      'Knowledge grows when people can learn, practise and pass what they know to someone else.',
    areas: [
      {
        id: 'learn',
        name: 'Learn something new',
        description: 'A starting point at every stage.',
        detail:
          'Learning can begin with a question or a practical skill. Oxy Academy offers a starting point for understanding your identity and working with the Oxy platform.',
        projects: [
          {
            name: 'Oxy Academy',
            icon: { src: '/images/apps/academy.svg', monochrome: true },
            description: 'Courses and practical guides to Oxy.',
            href: '/academy/',
          },
        ],
      },
      {
        id: 'share-knowledge',
        name: 'Share knowledge',
        description: 'Make understanding accessible.',
        detail:
          'Knowledge becomes more useful when others can read it, question it and build on it. Open documentation makes the workings of Oxy easier to understand.',
        projects: [
          {
            name: 'Open documentation',
            icon: { src: '/images/apps/api-reference.svg', monochrome: true },
            description: 'Guides for learning and building with Oxy.',
            href: '/developers/docs/',
          },
        ],
      },
      {
        id: 'learn-together',
        name: 'Learn together',
        description: 'Discover more with other people.',
        detail:
          'We imagine learning that travels beyond classrooms: people exchanging experience, helping each other practise and opening doors throughout life.',
        projects: [],
      },
    ],
  },
  {
    id: 'housing',
    name: 'Housing',
    headline: 'A place to belong.',
    description:
      'A home is the beginning of everyday life: a place to feel secure, put down roots and belong.',
    areas: [
      {
        id: 'find-a-home',
        name: 'Find a home',
        description: 'Find somewhere life can happen.',
        detail:
          'Finding a place to live means finding somewhere that fits your needs and your life. Homiio is one part of Oxy’s work around finding and renting a home.',
        projects: [
          {
            name: 'Homiio',
            icon: { src: BRAND_MARKS.homiio },
            description: 'Explore homes and renting.',
            href: '/homiio/',
          },
        ],
      },
      {
        id: 'share-spaces',
        name: 'Share spaces',
        description: 'Make room for living together.',
        detail:
          'Shared gardens, places to work and spaces to gather can turn a collection of buildings into a neighbourhood. This is part of the world we want to help make possible.',
        projects: [],
      },
      {
        id: 'build-community',
        name: 'Build community',
        description: 'Feel at home beyond your door.',
        detail:
          'Belonging grows through familiar faces, local connections and the things people do together. Our vision connects housing with the wider life of a community.',
        projects: [],
      },
    ],
  },
  {
    id: 'food',
    name: 'Food',
    headline: 'From the soil to the table.',
    description: 'Food connects our health, our communities and the living world that sustains us.',
    areas: [
      {
        id: 'grow-food',
        name: 'Grow food',
        description: 'Care for what sustains us.',
        detail:
          'Growing food starts with soil, water and the people who work with them. Supporting local growers and sustainable agriculture is one contribution to a more resilient food system.',
        projects: [
          {
            name: 'Oxy Initiative',
            icon: { src: '/images/apps/initiative.svg', monochrome: true },
            description: 'Explore support for sustainable agriculture and local livelihoods.',
            href: '/initiative/',
          },
        ],
      },
      {
        id: 'share-harvest',
        name: 'Share the harvest',
        description: 'Connect growers and communities.',
        detail:
          'We imagine closer connections between the people who grow food and the people who eat it: more local exchange, less waste and stronger relationships around the table.',
        projects: [],
      },
      {
        id: 'eat-well',
        name: 'Eat well',
        description: 'Good food in everyday life.',
        detail:
          'Access to nourishing food is connected to health, education and the places we live. It belongs at the heart of our vision for everyday wellbeing.',
        projects: [],
      },
    ],
  },
  {
    id: 'mobility',
    name: 'Mobility',
    headline: 'More ways to get there.',
    description:
      'Moving around connects us to work, learning, care and the people we want to be with.',
    areas: [
      {
        id: 'get-around',
        name: 'Get around',
        description: 'Make everyday journeys simpler.',
        detail:
          'From getting to work to meeting a friend, mobility shapes what is within reach. Moovo is Oxy’s project exploring mobility and urban transport.',
        projects: [
          {
            name: 'Moovo',
            icon: { src: BRAND_MARKS.moovo },
            description: 'Discover the mobility project.',
            href: 'https://moovo.now/',
          },
        ],
      },
      {
        id: 'connect-places',
        name: 'Connect places',
        description: 'Bring everyday destinations closer.',
        detail:
          'Homes, schools, workplaces and shared spaces work better when the journeys between them make sense. We see mobility as part of how places are designed and lived in.',
        projects: [],
      },
      {
        id: 'travel-accessibly',
        name: 'Open up journeys',
        description: 'Make getting around possible for more people.',
        detail:
          'Our vision includes journeys with fewer barriers: considering different bodies, resources and circumstances when thinking about how people move.',
        projects: [],
      },
    ],
  },
  {
    id: 'culture',
    name: 'Culture',
    headline: 'Life is something we share.',
    description:
      'Conversation, creativity and the stories we tell bring people and communities together.',
    areas: [
      {
        id: 'connect-people',
        name: 'Connect with others',
        description: 'Make space for conversation.',
        detail:
          'A conversation can start a friendship, sustain a relationship or bring a group together. Private communication is one of the ways Oxy helps people stay connected.',
        projects: [
          {
            name: 'Allo',
            icon: { src: BRAND_MARKS.allo },
            description: 'Private conversations.',
            href: 'https://allo.you/',
          },
          {
            name: 'Inbox',
            icon: { src: BRAND_MARKS.inbox },
            description: 'A calmer way to handle email.',
            href: '/inbox/',
          },
        ],
      },
      {
        id: 'share-voice',
        name: 'Share your voice',
        description: 'Express what matters to you.',
        detail:
          'Sharing an idea, a story or a piece of work helps others discover a different perspective. Mention offers a place for expression and connection with communities.',
        projects: [
          {
            name: 'Mention',
            icon: { src: BRAND_MARKS.mention },
            description: 'Social expression and community.',
            href: '/mention/',
          },
        ],
      },
      {
        id: 'create-together',
        name: 'Create together',
        description: 'Turn imagination into something shared.',
        detail:
          'Making something together combines different skills and perspectives. Open tools let people build on one another’s work and contribute something of their own.',
        projects: [
          {
            name: 'Bloom',
            icon: { src: BRAND_MARKS.bloom },
            description: 'A shared design system for creating interfaces.',
            href: '/bloom/',
          },
          {
            name: 'Codea',
            icon: { src: '/images/apps/codea.png' },
            description: 'Explore tools for working with code.',
            href: '/codea/',
          },
        ],
      },
    ],
  },
  {
    id: 'economy',
    name: 'Economy',
    headline: 'Value that moves between us.',
    description:
      'Work, exchange and shared resources help people build livelihoods and make things happen.',
    areas: [
      {
        id: 'make-a-living',
        name: 'Make a living',
        description: 'Bring skills and ideas into the world.',
        detail:
          'People create value in many ways: making, teaching, organising and solving problems. Oxy’s tools are one part of supporting that work.',
        projects: [
          {
            name: 'Oxy AI',
            icon: { src: '/images/apps/oxy-ai.svg', monochrome: true },
            description: 'Explore the platform and the products built on it.',
            href: '/ai/',
          },
        ],
      },
      {
        id: 'exchange-goods',
        name: 'Exchange goods',
        description: 'Connect what people make and need.',
        detail:
          'A marketplace brings together people with something to offer and people looking for it. Mercaria is Oxy’s approach to an open marketplace for people and goods.',
        projects: [
          {
            name: 'Mercaria',
            icon: { src: BRAND_MARKS.mercaria },
            description: 'An open marketplace.',
            href: '/mercaria/',
          },
        ],
      },
      {
        id: 'move-value',
        name: 'Move value fairly',
        description: 'Support everyday exchange.',
        detail:
          'Payments and currencies are part of how value moves through a community. Explore the different projects Oxy connects to this part of everyday life.',
        projects: [
          {
            name: 'Peable',
            icon: { src: '/images/apps/peable.png' },
            description: 'Payments across Oxy.',
            href: '/peable/',
          },
          {
            name: 'FairCoin',
            icon: { src: BRAND_MARKS.faircoin },
            description: 'An ethical digital currency.',
            href: '/faircoin/',
          },
        ],
      },
    ],
  },
  {
    id: 'governance',
    name: 'Governance',
    headline: 'A future we shape together.',
    description:
      'How we make decisions, care for shared resources and organise the things we depend on.',
    areas: [
      {
        id: 'decide-together',
        name: 'Decide together',
        description: 'Give people a part in what comes next.',
        detail:
          'Shared decisions begin with participation, understanding and the ability to be heard. Horizon is our vision for organising community life and shared services.',
        projects: [
          {
            name: 'Horizon',
            description: 'A vision for community organisation and shared services.',
          },
        ],
      },
      {
        id: 'share-resources',
        name: 'Care for the commons',
        description: 'Look after what we hold in common.',
        detail:
          'Places, knowledge and infrastructure can serve many people. Open systems give communities a way to understand the tools they rely on and contribute to how they develop.',
        projects: [
          {
            name: 'TNP',
            icon: { src: BRAND_MARKS.tnp },
            description: 'Explore open network infrastructure.',
            href: '/tnp/',
          },
        ],
      },
      {
        id: 'participate',
        name: 'Take part',
        description: 'An identity across a shared world.',
        detail:
          'Participation starts with being able to show up as yourself. Commons brings together your Oxy identity and account across the ecosystem.',
        projects: [
          {
            name: 'Commons',
            icon: { src: '/images/apps/commons-app.png' },
            description: 'Your identity and account across Oxy.',
            href: '/commons/',
          },
        ],
      },
    ],
  },
];

export const ecosystemAreas = ecosystemDomains.flatMap((domain) => domain.areas);
export const ecosystemDomainAliases: Record<string, string> = {
  communication: 'culture',
  technology: 'economy',
  identity: 'governance',
};
// Preserve the reference artwork's colours, as explicitly requested. The two
// additional sectors use swatches from the same captured ramps, not a new palette.
const referenceSwatches = [
  [4, 0],
  [0, 0],
  [2, 0],
  [5, 0],
  [1, 0],
  [3, 0],
  [2, 2],
  [4, 2],
] as const;

export function buildEcosystemMap(domains: EcosystemDomain[]): WheelData {
  const span = 360 / domains.length;
  const categories = domains.map((domain, index) => {
    const [sourceIndex, swatch] = referenceSwatches[index % referenceSwatches.length];
    const source = referenceMap.categories[sourceIndex];
    const palette = source.categoryColorPalette.slice(swatch);
    return {
      categoryId: domain.id,
      categoryName: domain.name,
      description: domain.description,
      categorySpanAngleDegree: span,
      categoryStartAngleDegree: index * span,
      categoryEndAngleDegree: (index + 1) * span,
      categoryArcStartAngleDegree: index * span + 5,
      categoryArcEndAngleDegree: (index + 1) * span - 5,
      categoryArcSpanAngleDegree: span - 10,
      categoryColor: palette[0],
      categoryColorPalette: domain.areas.map((_, areaIndex) => palette[areaIndex % palette.length]),
      categoryValue: null,
      lightText:
        swatch === 0 &&
        ['Buildings', 'Manufacturing', 'Food, Ag & Nature'].includes(source.categoryId),
    };
  });
  const axes = domains.flatMap((domain, index) => {
    const category = categories[index];
    const axisSpan = category.categoryArcSpanAngleDegree / domain.areas.length;
    return domain.areas.map((area, areaIndex) => ({
      ...category,
      axisId: area.id,
      axisName: area.name,
      description: area.description,
      axisValue: null,
      axisAngleDegree: category.categoryArcStartAngleDegree + (areaIndex + 0.5) * axisSpan,
      axisStartAngleDegree: category.categoryArcStartAngleDegree + areaIndex * axisSpan,
      axisEndAngleDegree: category.categoryArcStartAngleDegree + (areaIndex + 1) * axisSpan,
      axisSpanAngleDegree: axisSpan,
      axisIdsOfSameCategory: domain.areas.map((item) => item.id),
      symbols: [],
    }));
  });
  return { categories, axes };
}

export const ecosystemMap = buildEcosystemMap(ecosystemDomains);

export const HORIZON_SEO = {
  title: 'Horizon by Oxy — A shared future',
  description:
    'Explore Horizon’s vision for health, education, housing, food, mobility, culture, economy and governance.',
  canonicalPath: '/horizon/',
};
