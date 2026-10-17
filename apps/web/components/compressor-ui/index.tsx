'use client'

import { useCallback, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useFileListStore } from '@/app/providers'
import { cn } from '@/lib/utils'
import { FileItemUI } from './file-item'
import { ImageSelectZone } from '../ui/file-button'
import { preventDefault } from '@/utils/common/prevent-default'

const supportingFormats = [
  'image/png',
  'image/jpeg',
  'image/gif',
  'image/webp',
  'image/avif',

  'video/mp4',
  'video/quicktime',
  'video/x-matroska',
  'video/webm',
  'video/mp2t',
]

export type CompressorUIProps = React.ComponentProps<'div'>

export const CompressorUI = observer(
  ({ className, ...props }: CompressorUIProps) => {
    const fileListStore = useFileListStore()

    const handleFileSelect = useCallback(
      (list: Iterable<File>) => {
        fileListStore.add(...list)
      },
      [fileListStore],
    )

    useEffect(() => {
      function onDrop(event: DragEvent) {
        event.preventDefault()

        const files = event.dataTransfer?.files
        if (files) handleFileSelect(files)
      }

      addEventListener('dragover', preventDefault)
      addEventListener('drop', onDrop)

      return () => {
        removeEventListener('dragover', preventDefault)
        removeEventListener('drop', onDrop)
      }
    }, [handleFileSelect])

    return (
      <div {...props} className={cn('space-y-2', className)}>
        <ImageSelectZone
          multiple
          accept={supportingFormats}
          onFileSelect={handleFileSelect}
          className='w-full!'
        />
        <div className='space-y-2'>
          {fileListStore.keys.map((key, i) => (
            <FileItemUI key={key} i={i} />
          ))}
        </div>
      </div>
    )
  },
)
