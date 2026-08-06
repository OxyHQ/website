import { useAuth } from '@oxyhq/services'
import FeatureCard from './FeatureCard'
import { useToggleFeatureVote, type FeatureRequestData } from '../../api/hooks'

/**
 * A proposal row wired to the vote mutation.
 *
 * One wrapper for every surface that lists proposals: the board, the roadmap
 * and the duplicate check in the proposal form. They share the hook, so they
 * share the optimistic update and the rollback, and a vote cast in any of them
 * moves the count in the others.
 */
export default function FeatureRow({ feature, hideApp }: { feature: FeatureRequestData; hideApp?: boolean }) {
  const { isAuthenticated, signIn } = useAuth()
  const toggleVote = useToggleFeatureVote(feature.owner, feature.repoName, feature.number)

  function handleVote() {
    if (!isAuthenticated) {
      signIn()
      return
    }
    toggleVote.mutate()
  }

  return <FeatureCard feature={feature} onVote={handleVote} hideApp={hideApp} />
}
