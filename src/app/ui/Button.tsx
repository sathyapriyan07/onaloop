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
        'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40',
        className,
      )}
      style={{ background: 'var(--accent)', ...(props.style ?? {}) }}
    />
  )
}
