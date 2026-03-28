import { useState, useEffect, useRef } from 'react'
import { get, set } from 'idb-keyval'

/**
 * Cache-first content loader hook.
 * Strategy: read IndexedDB cache first, render, then fetch fresh data in background.
 * If fresh data differs, update state and cache.
 */
export function useContentLoader<T>(
  key: string,
  fetcher: () => Promise<T>,
): { data: T | null; loading: boolean; error: Error | null } {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)
  const fetcherRef = useRef(fetcher)
  fetcherRef.current = fetcher

  useEffect(() => {
    let cancelled = false
    const cacheKey = `eurekacub:loader:${key}`

    async function load() {
      try {
        // Step 1: try cache
        const cached = await get<T>(cacheKey)
        if (cached !== undefined && !cancelled) {
          setData(cached)
          setLoading(false)
        }

        // Step 2: fetch fresh in background
        const fresh = await fetcherRef.current()
        if (!cancelled) {
          setData(fresh)
          setLoading(false)
          await set(cacheKey, fresh)
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err : new Error(String(err)))
          setLoading(false)
        }
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [key])

  return { data, loading, error }
}
