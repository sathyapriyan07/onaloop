import clsx from 'clsx'
import { forwardRef, type InputHTMLAttributes } from 'react'

const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { className?: string }>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      {...props}
      className={clsx(
        'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/25 focus:bg-white/10',
        className,
      )}
    />
  )
)

Input.displayName = 'Input'
export default Input
