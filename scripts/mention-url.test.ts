import { describe, expect, test } from 'bun:test';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { mentionHomeUrl, mentionSignupUrl, resolveMentionUrl } from '../src/lib/mentionUrl';

const CAMPAIGN = 'utm_source=oxy.so&utm_medium=website&utm_campaign=mention_landing';

describe('Mention landing URLs', () => {
  test('defaults to mention.earth and builds signup from that origin', () => {
    const base = resolveMentionUrl(undefined);
    expect(base).toBe('https://mention.earth');
    expect(resolveMentionUrl('')).toBe('https://mention.earth');
    expect(resolveMentionUrl('ftp://mention.org')).toBe('https://mention.earth');
    expect(mentionHomeUrl(base)).toBe('https://mention.earth/');
    expect(mentionSignupUrl(base)).toBe(`https://mention.earth/signup?${CAMPAIGN}`);
  });

  test('builds the same paths when the origin moves to mention.org', () => {
    expect(mentionHomeUrl('https://mention.org/')).toBe('https://mention.org/');
    expect(mentionSignupUrl('https://mention.org')).toBe(`https://mention.org/signup?${CAMPAIGN}`);
  });

  test('the landing calls to action use the signup and home helpers', () => {
    const source = readFileSync(
      path.resolve(import.meta.dir, '../src/components/mention/MentionContent.tsx'),
      'utf8',
    );
    expect(source).not.toContain('"/inbox"');
    expect(source).not.toContain("'/inbox'");
    expect(source).toContain('mentionSignupUrl()');
    expect(source).toContain('mentionHomeUrl()');
  });
});
