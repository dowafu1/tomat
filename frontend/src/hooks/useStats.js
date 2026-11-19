import { useCallback, useEffect, useState } from 'react'
import { api } from '../api/client.js'

export default function useStats(token) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(
    async ({ quiet = false } = {}) => {
      if (!token) return null
      if (!quiet) setLoading(true)
      try {
        const data = await api('/stats', { token })
        setStats(data)
        setError('')
        return data
      } catch (requestError) {
        if (!quiet) setError(requestError.message)
        return null
      } finally {
        setLoading(false)
      }
    },
    [token]
  )

  useEffect(() => {
    load()
  }, [load])

  return {
    stats,
    loading,
    error,
    refresh: () => load({ quiet: true }),
    reload: () => load(),
  }
}
