import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import { useSession } from './useSession'

export function useAdminGuard() {
  const { user, isLoading: isAuthLoading } = useSession()
  const [isAdmin, setIsAdmin] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let isMounted = true
    async function run() {
      if (isAuthLoading) return
      if (!user) {
        if (!isMounted) return
        setIsAdmin(false)
        setIsLoading(false)
        return
      }

      const { data, error } = await supabase.from('admins').select('user_id').eq('user_id', user.id)
      if (!isMounted) return

      if (error) {
        setIsAdmin(false)
        setIsLoading(false)
        return
      }

      setIsAdmin((data?.length ?? 0) > 0)
      setIsLoading(false)
    }

    setIsLoading(true)
    run()

    return () => {
      isMounted = false
    }
  }, [user, isAuthLoading])

  return { isAdmin, isLoading }
}

