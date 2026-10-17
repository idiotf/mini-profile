import { useCallback, useState } from 'react'
import { useBlobUrl } from '@/hooks/use-blob-url'
import { ImageIcon, FilmIcon, FileIcon } from 'lucide-react'
import { AttachmentMedia } from '../ui/attachment'
import { preventDefault } from '@/utils/common/prevent-default'

type ImagePreviewProps = React.ComponentProps<'img'>
function ImagePreview(props: ImagePreviewProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt=''
      loading='lazy'
      decoding='async'
      fetchPriority='low'
      {...props}
    />
  )
}

type VideoPreviewProps = React.ComponentProps<'video'>
function VideoPreview(props: VideoPreviewProps) {
  return (
    <video
      // @ts-expect-error <video> can have loading prop
      loading='lazy'
      preload='none'
      onContextMenu={preventDefault}
      {...props}
    />
  )
}

export interface AttachmentFileMediaProps {
  file: File
}

export function AttachmentFileMedia({ file }: AttachmentFileMediaProps) {
  const type = file.type.split('/')[0]
  const blobUrl = useBlobUrl(file)

  const [previewHasError, setPreviewHasError] = useState(false)

  const markAsError = useCallback(() => {
    setPreviewHasError(true)
  }, [])

  if (!previewHasError) {
    if (type === 'image') {
      return (
        <AttachmentMedia variant='image'>
          <ImagePreview src={blobUrl} onError={markAsError} />
        </AttachmentMedia>
      )
    }

    if (type === 'video') {
      return (
        <AttachmentMedia variant='image'>
          <VideoPreview
            src={blobUrl}
            onError={markAsError}
            className='aspect-square w-full object-cover'
          />
        </AttachmentMedia>
      )
    }
  }

  const Icon = (type !== undefined && {
    image: ImageIcon,
    video: FilmIcon,
  }[type]) || FileIcon

  return (
    <AttachmentMedia variant='icon'>
      <Icon />
    </AttachmentMedia>
  )
}
