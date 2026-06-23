import { cn } from '@/lib/utils'

type BadgeProps = {
  children: React.ReactNode
  variant?: 'default' | 'ethnic' | 'muted'
  className?: string
}

export function Badge({ children, variant = 'default', className }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium',
        variant === 'default' && 'bg-gray-100 text-gray-700',
        variant === 'ethnic' && 'bg-amber-50 text-amber-800',
        variant === 'muted' && 'bg-slate-50 text-slate-500',
        className
      )}
    >
      {children}
    </span>
  )
}
