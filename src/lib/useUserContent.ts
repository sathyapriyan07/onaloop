import { useCallback, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useSession } from './useSession'

type ContentType = 'movie' | 'series'

export function useUserContent(contentId: string | undefined, type: ContentType) {
  const { user } = useSession()
  const [inWatchlist, setInWatchlist] = useState(false)
  const [isWatched, setIsWatched] = useState(false)

  useEffect(() => {
    if (!user || !contentId) return
    const col = type === 'movie' ? 'movie_id' : 'series_id'
    Promise.all([
      supabase.from('watchlist').select('id').eq('user_id', user.id).eq(col, contentId).maybeSingle(),
      supabase.from('watched').select('id').eq('user_id', user.id).eq(col, contentId).maybeSingle(),
    ]).then(([w, wd]) => {
      setInWatchlist(!!w.data)
      setIsWatched(!!wd.data)
    })
  }, [user, contentId, type])

  const toggleWatchlist = useCallback(async () => {
    if (!user || !contentId) return
    const col = type === 'movie' ? 'movie_id' : 'series_id'
    if (inWatchlist) {
      await supabase.from('watchlist').delete().eq('user_id', user.id).eq(col, contentId)
      setInWatchlist(false)
    } else {
      await supabase.from('watchlist').insert({ user_id: user.id, [col]: contentId })
      setInWatchlist(true)
    }
  }, [user, contentId, type, inWatchlist])

  const toggleWatched = useCallback(async () => {
    if (!user || !contentId) return
    const col = type === 'movie' ? 'movie_id' : 'series_id'
    if (isWatched) {
      await supabase.from('watched').delete().eq('user_id', user.id).eq(col, contentId)
      setIsWatched(false)
    } else {
      await supabase.from('watched').insert({ user_id: user.id, [col]: contentId })
      setIsWatched(true)
    }
  }, [user, contentId, type, isWatched])

  return { inWatchlist, isWatched, toggleWatchlist, toggleWatched, isLoggedIn: !!user }
}
