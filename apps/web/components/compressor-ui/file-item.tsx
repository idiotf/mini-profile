'use client'

import { useCallback, useMemo } from 'react'
import { observer } from 'mobx-react-lite'
import { useFileListStore } from '@/app/providers'
import type { ErrorDetails } from '@/utils/common/error-code'

import { CheckIcon, RefreshCwIcon, SettingsIcon, XIcon } from 'lucide-react'
import { AttachmentFileMedia } from './preview'
import { FileOptionsUI } from './file-options'
import { ErrorInfo } from './error-info'
import { Button } from '../ui/button'
import { PopoverContent, Popover, PopoverTrigger } from '../ui/popover'
import {
  Attachment,
  AttachmentAction,
  AttachmentActions,
  AttachmentContent,
  AttachmentDescription,
  AttachmentTitle,
} from '../ui/attachment'

import { downloadBlob } from '@/utils/common/download'
import { formatExt, getExtOf, formatFileSize } from '@/utils/common/file-info'

export interface FileItemUIProps {
  i: number
}

export const FileItemUI = observer(({ i }: FileItemUIProps) => {
  const fileListStore = useFileListStore()
  const item = fileListStore.values[i]!

  const downloadOutput = useCallback(() => {
    const output = item.output
    if (!output) return

    downloadBlob(output, item.file.name.replace(/(\.[^.]*)?$/, '.svg'))
  }, [item])

  const startCompression = useCallback(async () => {
    await item.startCompression()
    downloadOutput()
  }, [item, downloadOutput])

  const onRemove = useCallback(() => {
    item.destroy()
    fileListStore.remove(i)
  }, [item, fileListStore, i])

  const ext = formatExt(getExtOf(item.file.name))
  const size = formatFileSize(item.file.size)

  const errorDetails = useMemo(
    (): ErrorDetails => ({
      fileFormat: item.file.type,
    }),
    [item.file.type],
  )

  return (
    <Attachment
      state={item.state === 'finalizing' ? 'processing' : item.state}
      className='w-full'
    >
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
            <>준비 중...</>
          ) : item.state === 'processing' ? (
            <>압축 중... ({(item.progress * 100).toFixed(1)}%)</>
          ) : item.state === 'finalizing' ? (
            <>마무리 중...</>
          ) : item.state === 'done' ? (
            <>
              압축 완료됨
              <Button
                variant='link'
                size='2xs'
                onClick={downloadOutput}
                className='text-blue-500'
              >
                다시 다운로드
              </Button>
            </>
          ) : (
            <ErrorInfo error={item.error} details={errorDetails} />
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
