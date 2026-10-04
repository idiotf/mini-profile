import { useCallback, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Button } from './button'

export type CopyButtonProps = React.ComponentProps<typeof Button>

type ButtonClickHandler = NonNullable<CopyButtonProps['onClick']>

export function CopyButton({ value, onClick, ...props }: CopyButtonProps) {
  const [copied, setCopied] = useState(false)

  const copyToClipboard = useCallback(() => {
    if (!value) return
    navigator.clipboard.writeText(value + '')

    setCopied(true)
    setTimeout(setCopied, 2000, false)
  }, [value])

  const clickHandler = useCallback<ButtonClickHandler>(
    (event) => {
      copyToClipboard()
      onClick?.(event)
    },
    [copyToClipboard, onClick],
  )

  return (
    <Button {...props} onClick={clickHandler}>
      {copied ? <Check /> : <Copy />}
    </Button>
  )
}
