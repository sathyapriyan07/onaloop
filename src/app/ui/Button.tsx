import clsx from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'

export default function Button({
  className,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { className?: string; variant?: Variant }) {
  const stylesByVariant: Record<Variant, { background?: string; color?: string; borderColor?: string }> = {
    primary: { background: 'var(--accent)', color: 'var(--on-accent)' },
    secondary: { background: 'var(--surface2)', color: 'var(--label)' },
    ghost: { background: 'transparent', color: 'var(--label)' },
    danger: { background: '#ef4444', color: '#0b0c0f' },
  }

  return (
    <button
      {...props}
      className={clsx(
        'inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-sm font-semibold border transition-all',
        'hover:-translate-y-[1px] hover:shadow-[0_14px_44px_rgba(0,0,0,0.28)] active:translate-y-0 active:shadow-none',
        'disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:translate-y-0 disabled:hover:shadow-none',
        variant === 'ghost' ? 'border-transparent hover:bg-[var(--surface2)]' : 'border-transparent',
        className,
      )}
      style={{ ...stylesByVariant[variant], ...(props.style ?? {}) }}
    />
  )
}
