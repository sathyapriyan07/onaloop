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
        'min-h-28 w-full resize-none rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25 focus:bg-white/10',
        className,
      )}
    />
  )
}

