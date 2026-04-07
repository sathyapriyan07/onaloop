import clsx from 'clsx'
import type { InputHTMLAttributes } from 'react'

export default function Input({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { className?: string }) {
  return (
    <input
      {...props}
      className={clsx(
        'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25 focus:bg-white/10',
        className,
      )}
    />
  )
}

