import { useEffect, useState } from 'react'

type Theme = 'dark' | 'light'

const KEY = 'otl-theme'

function getInitial(): Theme {
  if (typeof window === 'undefined') return 'dark'
  return (localStorage.getItem(KEY) as Theme) ?? 'dark'
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitial)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(KEY, theme)
  }, [theme])

  function toggle() {
    setTheme((t) => (t === 'dark' ? 'light' : 'dark'))
  }

  return { theme, toggle }
}
