'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Trophy } from 'lucide-react'
import { getUserPointCounter } from '@/app/(main)/co-builder/actions'

export function PointCounter() {
  const router = useRouter()
  const [points, setPoints] = useState(0)
  const [rank, setRank] = useState(0)
  const [loaded, setLoaded] = useState(false)
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    async function load() {
      const data = await getUserPointCounter()
      if (data) {
        if (loaded && data.points !== points) {
          setAnimating(true)
          setTimeout(() => setAnimating(false), 1000)
        }
        setPoints(data.points)
        setRank(data.rank)
        setLoaded(true)
      }
    }
    load()
    // Poll every 60 seconds
    const interval = setInterval(load, 60000)
    return () => clearInterval(interval)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!loaded) return null

  return (
    <button
      onClick={() => router.push('/co-builder')}
      className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm font-medium transition-all hover:bg-muted ${
        animating ? 'ring-2 ring-orange-400 ring-offset-1 bg-orange-50' : ''
      }`}
      title="Lihat Leaderboard"
    >
      <Trophy className="h-4 w-4 text-orange-500" />
      <span className={`tabular-nums ${animating ? 'text-orange-600' : ''}`}>
        {points} pts
      </span>
      {rank > 0 && (
        <span className="text-muted-foreground text-xs">
          #{rank}
        </span>
      )}
    </button>
  )
}
