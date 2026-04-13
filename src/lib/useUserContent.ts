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
      if (!w.error) setInWatchlist(!!w.data)
      if (!wd.error) setIsWatched(!!wd.data)
    })
  }, [user, contentId, type])

  const toggleWatchlist = useCallback(async () => {
    if (!user || !contentId) return
    const col = type === 'movie' ? 'movie_id' : 'series_id'
    if (inWatchlist) {
      const { error } = await supabase.from('watchlist').delete().eq('user_id', user.id).eq(col, contentId)
      if (!error) setInWatchlist(false)
    } else {
      const { error } = await supabase.from('watchlist').insert({ user_id: user.id, [col]: contentId })
      if (!error) setInWatchlist(true)
    }
  }, [user, contentId, type, inWatchlist])

  const toggleWatched = useCallback(async () => {
    if (!user || !contentId) return
    const col = type === 'movie' ? 'movie_id' : 'series_id'
    if (isWatched) {
      const { error } = await supabase.from('watched').delete().eq('user_id', user.id).eq(col, contentId)
      if (!error) setIsWatched(false)
    } else {
      const { error } = await supabase.from('watched').insert({ user_id: user.id, [col]: contentId })
      if (!error) setIsWatched(true)
    }
  }, [user, contentId, type, isWatched])

  return { inWatchlist, isWatched, toggleWatchlist, toggleWatched, isLoggedIn: !!user }
}
