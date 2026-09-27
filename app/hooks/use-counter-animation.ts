import { useState, useEffect, useRef } from 'react'

export function useCounterAnimation(end: number, duration = 1000) {
  const [count, setCount] = useState(0)
  const startTime = useRef<number | null>(null)
  const animationFrame = useRef<number>(0)

  useEffect(() => {
    if (end === 0) {
      requestAnimationFrame(() => setCount(0))
      return
    }

    const animate = (timestamp: number) => {
      if (!startTime.current) startTime.current = timestamp
      const elapsed = timestamp - startTime.current
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setCount(Math.floor(eased * end))

      if (progress < 1) {
        animationFrame.current = requestAnimationFrame(animate)
      }
    }

    startTime.current = null
    animationFrame.current = requestAnimationFrame(animate)

    return () => cancelAnimationFrame(animationFrame.current)
  }, [end, duration])

  return count
}
