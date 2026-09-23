import type { TranslateFn } from '../../lib/i18n/types'
import { useTranslation } from '../../lib/i18n'
import type { TrackDef } from './academyModel'
import type { LessonStatus } from './progressStorage'

/* The Academy's translated labels for its model: tracks, statuses, counts. */

export function useTrackLabels(): (track: TrackDef) => { label: string; blurb: string } {
  const { t } = useTranslation()
  return (track) => {
    switch (track.key) {
      case 'foundations':
        return { label: t('academy.trackFoundations'), blurb: t('academy.trackFoundationsBlurb') }
      case 'identity':
        return { label: t('academy.trackIdentity'), blurb: t('academy.trackIdentityBlurb') }
      case 'social':
        return { label: t('academy.trackSocial'), blurb: t('academy.trackSocialBlurb') }
      case 'developer':
        return { label: t('academy.trackDeveloper'), blurb: t('academy.trackDeveloperBlurb') }
    }
  }
}

/** A lesson's (or course's) state in words — what screen readers hear beside every glyph. */
export function useStatusLabel(): (status: LessonStatus) => string {
  const { t } = useTranslation()
  return (status) =>
    status === 'completed'
      ? t('academy.statusCompleted')
      : status === 'in-progress'
        ? t('academy.statusInProgress')
        : t('academy.statusNotStarted')
}

export function lessonCountLabel(t: TranslateFn, count: number) {
  return count === 1 ? t('academy.lessonsOne') : t('academy.lessonsOther', { count })
}

