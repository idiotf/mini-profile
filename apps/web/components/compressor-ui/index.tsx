'use client'

import { useCallback, useEffect } from 'react'
import { observer } from 'mobx-react-lite'
import { useBlobUrl } from '@/hooks/use-blob-url'
import { useFileListStore } from '@/app/providers'
import type { FileItem } from '@/stores/file-list-store'

import {
  CheckIcon,
  FileIcon,
  RefreshCwIcon,
  SettingsIcon,
  XIcon,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { CopyButton } from '../ui/copy-button'
import { ImageSelectZone } from '../ui/file-button'
import { PopoverContent, Popover, PopoverTrigger } from '../ui/popover'
import { Field, FieldGroup, FieldTitle } from '../ui/field'
import { NumberInput } from '../ui/number-input'
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
import { formatExt, getExtOf, formatFileSize } from '@/utils/common/file-info'
import { Select, SelectContent, SelectGroup, SelectItem, SelectTrigger, SelectValue } from '../ui/select'

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

interface ErrorInfoProps {
  error: unknown
}

function ErrorInfo({ error }: ErrorInfoProps) {
  return (
    <span className='flex items-center gap-0.5'>
      <CopyButton
        value={error + ''}
        variant='ghost'
        size='icon-xs'
        className='size-[1em]'
      />
      오류가 발생했습니다.
    </span>
  )
}

interface FileOptionsUIProps {
  item: FileItem
}

const qualityItems = [
  { value: 'very-low', label: '매우 낮음' },
  { value: 'low', label: '낮음' },
  { value: 'medium', label: '보통' },
  { value: 'high', label: '높음' },
  { value: 'very-high', label: '매우 높음' },
]

const FileOptionsUI = observer(({ item }: FileOptionsUIProps) => {
  const { options } = item

  return (
    <FieldGroup>
      <Field>
        <FieldTitle>이미지 해상도</FieldTitle>
        <div className='flex items-center gap-2'>
          <NumberInput
            value={options.width}
            min={1}
            onValueChange={(v) => item.setWidth(v === undefined ? undefined : Math.floor(Math.max(1, v)))}
          />
          <span>×</span>
          <NumberInput
            value={options.height}
            min={1}
            onValueChange={(v) => item.setHeight(v === undefined ? undefined : Math.floor(Math.max(1, v)))}
          />
        </div>
      </Field>
      <Field>
        <FieldTitle>프레임률 (FPS)</FieldTitle>
        <NumberInput
          value={options.frameRate}
          min={Number.MIN_VALUE}
          step='any'
          onValueChange={(v) => item.setFrameRate(v === undefined ? undefined : Math.max(Number.MIN_VALUE, v))}
        />
      </Field>
      <Field>
        <FieldTitle>화질</FieldTitle>
        <Select
          value={options.quality}
          onValueChange={(v) => item.setQuality(v ?? undefined)}
          itemToStringLabel={(v) => qualityItems.find(({ value }) => value === v)!.label}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectGroup>
              {qualityItems.map(({ value, label }) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectGroup>
          </SelectContent>
        </Select>
      </Field>
    </FieldGroup>
  )
})

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
              {typeof item.error === 'string' ? (
                item.error
              ) : (
                <ErrorInfo error={item.error} />
              )}
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
                <FileOptionsUI item={item} />
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
