import { getBrandMark } from '../../data/brand-assets';

/** Docs packages that belong to a product and carry its mark. */
const PACKAGE_MARKS: Readonly<Record<string, string>> = {
  'bloom-language': 'bloom',
};

/** The mark a docs package shows: its own, or its product's. */
export function getPackageLogo(shortName: string): string | undefined {
  return getBrandMark(PACKAGE_MARKS[shortName] ?? shortName);
}
