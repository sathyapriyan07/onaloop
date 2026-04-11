import { useRef } from 'react'
import './SpotlightCard.css'

type Props = {
  children: React.ReactNode
  className?: string
  spotlightColor?: string
}

export default function SpotlightCard({ children, className = '', spotlightColor = 'rgba(255,255,255,0.08)' }: Props) {
  const divRef = useRef<HTMLDivElement>(null)

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = divRef.current!.getBoundingClientRect()
    divRef.current!.style.setProperty('--mouse-x', `${e.clientX - rect.left}px`)
    divRef.current!.style.setProperty('--mouse-y', `${e.clientY - rect.top}px`)
    divRef.current!.style.setProperty('--spotlight-color', spotlightColor)
  }

  return (
    <div ref={divRef} onMouseMove={handleMouseMove} className={`card-spotlight ${className}`}>
      {children}
    </div>
  )
}
