import { useCallback } from 'react'
import { FileIcon, FilePlusCorner } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from './button'
import { selectFile, type SelectFileOptions } from '@/utils/common/select-file'

export interface FileButtonProps
  extends React.ComponentProps<typeof Button>, SelectFileOptions {
  onFileSelect(files: FileList): void
}

type ClickHandler = NonNullable<React.ComponentProps<typeof Button>['onClick']>

export function FileButton({
  children,
  multiple,
  accept,
  capture,
  onClick,
  onFileSelect,
  ...props
}: FileButtonProps) {
  const handleClick = useCallback<ClickHandler>(
    (event) => {
      selectFile({
        multiple,
        accept,
        capture,
      }).then(onFileSelect)
      onClick?.(event)
    },
    [accept, capture, multiple, onClick, onFileSelect],
  )

  return (
    <Button {...props} onClick={handleClick}>
      {children}
    </Button>
  )
}

export type FileButtonWithLabelProps = Omit<FileButtonProps, 'children'>

export function FileButtonWithLabel(props: FileButtonWithLabelProps) {
  return (
    <FileButton {...props}>
      <FileIcon />
      파일 선택
    </FileButton>
  )
}

export type FileSelectZoneProps = FileButtonProps

export function FileSelectZone({
  children,
  className,
  ...props
}: FileSelectZoneProps) {
  return (
    <FileButton
      variant='ghost'
      {...props}
      className={cn(
        'flex h-auto flex-col items-center justify-center gap-2 rounded-sm border border-dashed border-border py-6 transition-colors [&>svg]:size-12!',
        className,
      )}
    >
      {children}
    </FileButton>
  )
}

type BaseSelectZoneProps = Omit<FileSelectZoneProps, 'children'>

export type ImageSelectZoneProps = BaseSelectZoneProps

export function ImageSelectZone({ ...props }: ImageSelectZoneProps) {
  return (
    <FileSelectZone accept={props.accept ?? ['image/*', 'video/*']} {...props}>
      <FilePlusCorner />
      <span>
        이미지, 동영상을 드롭하거나 선택
        <br />
        <span className='mt-0.5 inline-block font-normal text-muted-foreground'>
          GIF, WebP, AVIF, MP4 등
        </span>
      </span>
    </FileSelectZone>
  )
}
