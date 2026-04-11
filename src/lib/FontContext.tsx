import { createContext, useContext, useEffect, useState } from 'react'

type Font = 'bricolage' | 'be-vietnam'

const FONTS: Record<Font, string> = {
  'bricolage': "'Bricolage Grotesque', ui-sans-serif, system-ui, sans-serif",
  'be-vietnam': "'Be Vietnam Pro', ui-sans-serif, system-ui, sans-serif",
}

const KEY = 'otl-font'

const FontContext = createContext<{ font: Font; setFont: (f: Font) => void }>({
  font: 'bricolage',
  setFont: () => {},
})

export function FontProvider({ children }: { children: React.ReactNode }) {
  const [font, setFontState] = useState<Font>(() => (localStorage.getItem(KEY) as Font) ?? 'bricolage')

  useEffect(() => {
    document.documentElement.style.setProperty('--app-font', FONTS[font])
    localStorage.setItem(KEY, font)
  }, [font])

  // apply on mount
  useEffect(() => {
    document.documentElement.style.setProperty('--app-font', FONTS[font])
  }, [])

  return (
    <FontContext.Provider value={{ font, setFont: setFontState }}>
      {children}
    </FontContext.Provider>
  )
}

export const useFont = () => useContext(FontContext)
