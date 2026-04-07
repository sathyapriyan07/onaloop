import clsx from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

export default function Button({
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { className?: string }) {
  return (
    <button
      {...props}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-neutral-950 hover:bg-white/90 disabled:cursor-not-allowed disabled:opacity-60',
        className,
      )}
    />
  )
}

