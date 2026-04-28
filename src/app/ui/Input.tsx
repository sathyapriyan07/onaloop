import clsx from 'clsx'
import { forwardRef, type InputHTMLAttributes } from 'react'

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { className?: string }>(
  ({ className, style, ...props }, ref) => (
    <input
      ref={ref}
      {...props}
      className={clsx(
        'w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors',
        'focus:border-[var(--accent)] focus:shadow-[0_0_0_4px_var(--accent-glow)]',
        className,
      )}
      style={{ 
        background: 'var(--surface)', 
        borderColor: 'var(--separator)',
        color: 'var(--label)',
        ...style
      }}
    />
  )
)

Input.displayName = 'Input'
export default Input
