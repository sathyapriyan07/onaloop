import clsx from 'clsx'
import type { TextareaHTMLAttributes } from 'react'

export default function TextArea({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { className?: string }) {
  return (
    <textarea
      {...props}
      className={clsx(
        'min-h-28 w-full resize-none rounded-xl border px-4 py-3 text-sm outline-none transition-colors focus:border-[var(--accent)]',
        className,
      )}
      style={{ 
        background: 'var(--surface)', 
        borderColor: 'var(--separator)',
        color: 'var(--label)'
      }}
    />
  )
}
