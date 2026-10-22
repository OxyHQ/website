import { gsap } from 'gsap';

/** Desktop chapters advance by one viewport per gesture. The final chapter and
 * the website footer return to free scrolling, as in the reference.
 */
export function magneticScroll(root: HTMLElement, sections: HTMLElement[]) {
  let animation: gsap.core.Tween | undefined;
  let touchY: number | undefined;
  let previousY = scrollY;
  const offset = (section: HTMLElement) => section.getBoundingClientRect().top + scrollY;
  const last = sections[sections.length - 1];
  if (!last) return () => undefined;
  const currentIndex = () => {
    let index = 0;
    sections.forEach((section, i) => {
      if (scrollY >= offset(section) - innerHeight * 0.3) index = i;
    });
    return index;
  };
  const go = (index: number, returning = false) => {
    if (animation?.isActive() || !sections[index]) return;
    const y = offset(sections[index]);
    const cursor = { y: scrollY };
    animation = gsap.to(cursor, {
      y,
      duration: Math.max(0.3, Math.min(2.5, Math.abs(y - scrollY) / innerHeight)),
      ease: returning ? 'sine.inOut' : 'quad.inOut',
      // Explicit instant writes prevent the site's native smooth scrolling (and
      // ScrollTrigger refresh restoring it) from adding a second easing curve.
      onUpdate: () => window.scrollTo({ top: cursor.y, behavior: 'instant' }),
      onComplete: () => {
        previousY = scrollY;
      },
    });
  };
  const interactive = (target: EventTarget | null) =>
    target instanceof Element &&
    !!target.closest(
      'input, textarea, select, [contenteditable="true"], [role="dialog"], [data-lenis-prevent]',
    );
  const wheel = (event: WheelEvent) => {
    if (!root.contains(event.target as Node)) return;
    if (
      event.ctrlKey ||
      interactive(event.target) ||
      Math.abs(event.deltaX) > Math.abs(event.deltaY)
    )
      return;
    if (animation?.isActive()) {
      event.preventDefault();
      return;
    }
    if (scrollY >= offset(last) - 5) return;
    event.preventDefault();
    if (Math.abs(event.deltaY) < 5) return;
    go(currentIndex() + (event.deltaY > 0 ? 1 : -1));
  };
  const key = (event: KeyboardEvent) => {
    if (event.target instanceof Element && event.target.closest('header, nav')) return;
    if (event.altKey || event.metaKey || event.ctrlKey || interactive(event.target)) return;
    if (
      scrollY >= offset(last) - 5 ||
      !['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End'].includes(event.key)
    )
      return;
    event.preventDefault();
    if (event.key === 'Home') go(0);
    else if (event.key === 'End') go(sections.length - 1);
    else go(currentIndex() + (event.key === 'ArrowDown' || event.key === 'PageDown' ? 1 : -1));
  };
  const scroll = () => {
    const y = scrollY;
    if (
      !animation?.isActive() &&
      previousY >= offset(last) - 5 &&
      y < offset(last) - 10 &&
      previousY - y < innerHeight
    )
      go(sections.length - 2, true);
    previousY = y;
  };
  const touchStart = (event: TouchEvent) => {
    touchY = event.touches[0]?.clientY;
  };
  const touchMove = (event: TouchEvent) => {
    const y = event.touches[0]?.clientY;
    if (
      y === undefined ||
      touchY === undefined ||
      interactive(event.target) ||
      scrollY >= offset(last) - 5
    )
      return;
    event.preventDefault();
    if (Math.abs(touchY - y) >= 5) {
      go(currentIndex() + (touchY > y ? 1 : -1));
      touchY = y;
    }
  };
  window.addEventListener('wheel', wheel, { passive: false });
  window.addEventListener('keydown', key);
  window.addEventListener('scroll', scroll, { passive: true });
  root.addEventListener('touchstart', touchStart, { passive: true });
  root.addEventListener('touchmove', touchMove, { passive: false });
  return () => {
    animation?.kill();
    window.removeEventListener('wheel', wheel);
    window.removeEventListener('keydown', key);
    window.removeEventListener('scroll', scroll);
    root.removeEventListener('touchstart', touchStart);
    root.removeEventListener('touchmove', touchMove);
  };
}
