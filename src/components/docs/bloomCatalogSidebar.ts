import { bloomCategories, bloomIndex } from '../../content/bloom-catalog.generated'
import { pascalPath } from '../../content/bloom-catalog'
import { catalogPreviews } from '../bloom/catalogPreviews'
import type { SidebarSection } from './docsTypes'

const HUB_PATH = '/developers/docs/bloom/components'

export const bloomCatalogSections: SidebarSection[] = [
  {
    category: 'ui-library',
    title: 'Bloom components',
    nodes: [
      {
        kind: 'package',
        label: 'All components',
        href: `${HUB_PATH}/`,
        shortName: 'bloom',
        key: 'bloom',
        leafCount: bloomIndex.length,
        children: bloomCategories.map((category) => {
          const entries = bloomIndex.filter(
            (entry) => entry.category === category.name,
          )
          return {
            kind: 'group',
            label: category.name,
            key: `bloom/${category.name}`,
            leafCount: entries.length,
            children: entries.map((entry) => ({
              kind: 'leaf',
              label:
                catalogPreviews[entry.subpath]?.title ??
                pascalPath(entry.subpath),
              href: `${HUB_PATH}/${entry.subpath}/`,
              slug: entry.subpath,
            })),
          }
        }),
      },
    ],
  },
]

