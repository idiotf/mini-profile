import { cn } from 'cn'
import { Loader2Icon } from 'lucide-react'

function Spinner({ className, ...props }: React.ComponentProps<'svg'>) {
  return (
    <Loader2Icon
      data-slot='spinner'
      role='status'
      aria-label='Loading'
      // HACK for size-* condition
      className={cn('w-4 h-4 animate-spin', className)}
      {...props}
    />
  )
}

export { Spinner }
