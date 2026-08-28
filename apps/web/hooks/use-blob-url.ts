import { useCallback, useRef, useSyncExternalStore } from 'react'

export function useBlobUrl(blob: Blob) {
  const urlRef = useRef<string>(null)

  const subscribe = useCallback(() => {
    const url = (urlRef.current ||= URL.createObjectURL(blob))

    return () => {
      URL.revokeObjectURL(url)
      urlRef.current = null
    }
  }, [blob])

  return useSyncExternalStore(
    subscribe,
    () => (urlRef.current ||= URL.createObjectURL(blob)),
    () => (urlRef.current ||= URL.createObjectURL(blob)),
  )
}
