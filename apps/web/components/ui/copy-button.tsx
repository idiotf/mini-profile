import { createContext, useCallback, useContext, useState } from 'react'
import { Copy, Check } from 'lucide-react'
import { Spinner } from './spinner'
import { Button } from './button'

// #region Copying Utils

let textarea: HTMLTextAreaElement

async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text)
  } catch (e) {
    console.warn(e)

    textarea ||= document.createElement('textarea')
    document.body.appendChild(textarea)

    textarea.value = text
    textarea.select()
    document.execCommand('copy')

    textarea.remove()
  }
}

// #endregion

type IconType = 'copy' | 'spinner' | 'check'
const CopyButtonIconContext = createContext<IconType>('copy')

export interface CopyButtonProps extends Omit<
  React.ComponentProps<typeof Button>,
  'value'
> {
  value: string | (() => string | PromiseLike<string>)
}

export function CopyButton({
  value,
  children,
  onClick,
  ...props
}: CopyButtonProps) {
  const [copying, setCopying] = useState(false)
  const [copied, setCopied] = useState(false)

  const copyToClipboard = useCallback(async () => {
    if (!value) return

    try {
      setCopying(true)
      await copyText(typeof value == 'function' ? await value() : value)
    } finally {
      setCopying(false)
    }

    setCopied(true)
    setTimeout(setCopied, 2000, false)
  }, [value])

  const clickHandler = useCallback<NonNullable<CopyButtonProps['onClick']>>(
    (event) => {
      copyToClipboard()
      onClick?.(event)
    },
    [copyToClipboard, onClick],
  )

  return (
    <Button {...props} onClick={clickHandler}>
      <CopyButtonIconContext.Provider
        value={copying ? 'spinner' : copied ? 'check' : 'copy'}
      >
        {children}
      </CopyButtonIconContext.Provider>
    </Button>
  )
}

export function CopyButtonIcon() {
  const icon = useContext(CopyButtonIconContext)

  const Comp = {
    check: Check,
    spinner: Spinner,
    copy: Copy,
  }[icon]

  return <Comp />
}
