import CommentSection from '../../social/CommentSection'
import DiscussOnMention from '../../social/DiscussOnMention'
import LikeButton from '../../social/LikeButton'
import type { NewsroomPost } from '../../../data/newsroom'

export default function ArticleCommunity({ post, url }: { post: NewsroomPost; url: string }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <LikeButton targetType="newsroom" targetId={post.slug} />
        <DiscussOnMention title={post.title} url={url} hashtags={post.tags} via="oxy" />
      </div>

      <CommentSection targetType="newsroom" targetId={post.slug} />
    </>
  )
}
