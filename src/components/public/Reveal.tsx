import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react'
import { cn } from '@/lib/utils'

/** True once the element has scrolled into view (and stays true). */
export function useInView<T extends Element>(threshold = 0.15) {
  const ref = useRef<T | null>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const node = ref.current
    if (!node || inView) return
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true)
      return
    }
    const show = () => {
      setInView(true)
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        // Also reveal anything already scrolled past (an anchor jump or a
        // fast flick can skip right over it without it ever intersecting).
        if (entry.isIntersecting || entry.boundingClientRect.top < 0) show()
      },
      { threshold, rootMargin: '0px 0px -40px 0px' },
    )
    const onScroll = () => {
      if (node.getBoundingClientRect().top < window.innerHeight) show()
    }
    observer.observe(node)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      observer.disconnect()
      window.removeEventListener('scroll', onScroll)
    }
  }, [inView, threshold])

  return { ref, inView }
}

/**
 * Fades and slides its children in the first time they scroll into view.
 * `delay` staggers siblings; reduced-motion users see everything at once.
 */
export function Reveal({
  children,
  delay = 0,
  variant = 'up',
  className,
  as: Tag = 'div',
}: {
  children: ReactNode
  delay?: number
  variant?: 'up' | 'scale' | 'left'
  className?: string
  as?: 'div' | 'li' | 'section' | 'article'
}) {
  const { ref, inView } = useInView<HTMLElement>()

  return (
    <Tag
      ref={ref as never}
      data-variant={variant}
      className={cn('reveal', inView && 'reveal-in', className)}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </Tag>
  )
}

/** Counts from 0 up to `value` once visible. */
export function CountUp({ value, duration = 1200 }: { value: number; duration?: number }) {
  const { ref, inView } = useInView<HTMLSpanElement>()
  const [shown, setShown] = useState(0)

  useEffect(() => {
    if (!inView) return
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setShown(value)
      return
    }
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      setShown(Math.round(value * (1 - Math.pow(1 - t, 3))))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [inView, value, duration])

  return <span ref={ref}>{shown.toLocaleString('en-IN')}</span>
}
