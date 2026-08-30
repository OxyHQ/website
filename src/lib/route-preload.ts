/** Shared route loaders so React.lazy and intent-based preloading hit one promise. */
export const loadNewsroomPage = () => import('../pages/NewsroomPage')
export const loadNewsroomPostPage = () => import('../pages/NewsroomPostPage')

export function preloadNewsroomPostRoute(): Promise<unknown> {
  return loadNewsroomPostPage()
}
