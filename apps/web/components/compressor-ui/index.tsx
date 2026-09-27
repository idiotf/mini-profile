'use client'

import { useCallback, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useBlobUrl } from '@/hooks/use-blob-url'
import { useFileListStore } from '@/app/providers'
import {
  CheckIcon,
  FileIcon,
  RefreshCwIcon,
  SettingsIcon,
  XIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { ImageSelectZone } from '../ui/file-button'
import { PopoverContent, Popover, PopoverTrigger } from '../ui/popover'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentMedia,
  AttachmentTitle,
} from '../ui/attachment'
import { downloadBlob } from '@/utils/common/download'
import { preventDefault } from '@/utils/common/prevent-default'

type ImgVideoIntersectProps = Omit<React.ComponentProps<'img'>, 'src'> &
  Omit<React.ComponentProps<'video'>, 'src'>

interface FilePreviewProps extends ImgVideoIntersectProps {
  type: 'image' | 'video'
  file: File
}

function FilePreview({ type, file, ...props }: FilePreviewProps) {
  const blobUrl = useBlobUrl(file)

  if (type === 'image') {
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt='' {...props} src={blobUrl} />
  } else {
    return <video onContextMenu={preventDefault} {...props} src={blobUrl} />
  }
}

interface ImagePreviewProps {
  file: File
}

function AttachmentFileMedia({ file }: ImagePreviewProps) {
  const type = file.type.split('/')[0]
  const isValid = type === 'image' || type === 'video'

  return isValid ? (
    <AttachmentMedia variant='image'>
      <FilePreview
        type={type}
        file={file}
        className='aspect-square w-full object-cover'
      />
    </AttachmentMedia>
  ) : (
    <AttachmentMedia variant='icon'>
      <FileIcon />
    </AttachmentMedia>
  )
}

function getExtOf(name: string) {
  return name.replace(/^.*\.|^[^.]*$/, '')
}

function formatExt(ext: string) {
  return ext === 'webp' ? 'WebP' : ext === 'webm' ? 'WebM' : ext.toUpperCase()
}

const kib = 1024
const mib = 1024 * kib
const gib = 1024 * mib

function formatFileSize(size: number) {
  if (size >= gib) return `${(size / gib).toFixed(1)}GiB`
  if (size >= mib) return `${(size / mib).toFixed(1)}MiB`
  if (size >= kib) return `${(size / kib).toFixed(1)}KiB`
  return `${size} bytes`
}

interface FileItemUIProps {
  i: number
}

const FileItemUI = observer(({ i }: FileItemUIProps) => {
  const fileListStore = useFileListStore()
  const item = fileListStore.values[i]!

  const startCompression = useCallback(async () => {
    await item.startCompression()

    const output = item.output
    if (!output) return

    downloadBlob(output, item.file.name.replace(/(\.[^.]*)?$/, '.svg'))
  }, [item])

  const onRemove = useCallback(() => {
    item.destroy()
    fileListStore.remove(i)
  }, [item, fileListStore, i])

  const ext = formatExt(getExtOf(item.file.name))
  const size = formatFileSize(item.file.size)

  return (
    <Attachment state={item.state} className='w-full'>
      <AttachmentFileMedia file={item.file} />
      <AttachmentContent>
        <AttachmentTitle>{item.file.name}</AttachmentTitle>
        <AttachmentDescription>
          {item.state === 'idle' ? (
            <>
              {ext}
              {ext && ' · '}
              {size}
            </>
          ) : item.state === 'uploading' ? (
            <>준비 중... ({(item.progress * 100).toFixed(1)}%)</>
          ) : item.state === 'processing' ? (
            <>압축 중... ({(item.progress * 100).toFixed(1)}%)</>
          ) : item.state === 'done' ? (
            <>압축 완료됨</>
          ) : (
            <>
              {typeof item.error === 'string'
                ? item.error
                : '오류가 발생했습니다.'}
            </>
          )}
        </AttachmentDescription>
      </AttachmentContent>
      <AttachmentActions>
        {(item.state === 'idle' || item.state === 'error') && (
          <>
            <Popover>
              <PopoverTrigger
                render={
                  <AttachmentAction aria-label='옵션 열기'>
                    <SettingsIcon />
                  </AttachmentAction>
                }
              />
              <PopoverContent className='max-h-[50vh] overflow-auto'>
                ㅋㅋㄹㅃㅃ
              </PopoverContent>
            </Popover>
            <AttachmentAction
              aria-label='압축 시작하기'
              onClick={startCompression}
            >
              {item.state === 'idle' ? <CheckIcon /> : <RefreshCwIcon />}
            </AttachmentAction>
          </>
        )}
        <AttachmentAction aria-label='목록에서 제거하기' onClick={onRemove}>
          <XIcon />
        </AttachmentAction>
      </AttachmentActions>
    </Attachment>
  )
})

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
