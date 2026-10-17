import { bindSignal } from '@mini-profile/bind-signal'
import {
  Conversion,
  Input,
  Output,
  BlobSource,
  BufferTarget,
  MATROSKA,
  MP4,
  MPEG_TS,
  QTFF,
  WEBM,
  Quality,
  UnsupportedInputFormatError,
  VideoSampleSource,
  VideoSample,
  type ConversionOptions,
} from 'mediabunny'
import { AvifOutputFormat } from '@mini-profile/avif-muxer-mediabunny'
import { readImageMimeType } from './image-mime'
import { CompressionException, CompressionError } from './error'

export * from './error'

export interface CompressionOptions {
  width?: number
  height?: number
  frameRate?: number
  fit?: 'fill' | 'contain' | 'cover'
  quality?: 'very-low' | 'low' | 'medium' | 'high' | 'very-high'
  signal?: AbortSignal
  onInitialized?: () => void
  onProgress?: (progress: number, processedTime: number) => void
  onFinalizing?: () => void
}

async function compressVideoOrImageToAvif(
  blob: Blob,
  options: CompressionOptions = {},
) {
  using __ = bindSignal(options.signal, true)

  const source = new BlobSource(blob)
  const imgMimeType = await __(
    readImageMimeType(source).catch((e) => {
      throw new CompressionError('cannotReadFile', e)
    }),
  )

  return new Uint8Array(
    await __(
      imgMimeType === null ? compressVideo() : compressImage(imgMimeType),
    ),
  )

  async function compressVideo() {
    const output = __(
      new Output({
        format: new AvifOutputFormat({ useSingleImage: false }),
        target: new BufferTarget(),
      }),
      (output) => {
        if (output.state === 'finalized') return
        output.cancel()
      },
    )

    const input = __(
      new Input({
        source,
        formats: [MP4, QTFF, MATROSKA, WEBM, MPEG_TS],
      }),
    )

    const conversionOptions: ConversionOptions = {
      input,
      output,
      video: {
        ...options,
        codec: 'av1',
        quality: options.quality && new Quality(options.quality),
      },
      audio: {
        discard: true,
      },
      composable: true,
    }

    const conversion = await __(
      Conversion.init(conversionOptions).catch((reason) => {
        if (reason instanceof UnsupportedInputFormatError) {
          throw new CompressionException('unsupportedFormat')
        }
        throw new CompressionError('cannotInitVideoConversion', reason)
      }),
      (conversion) => conversion.cancel(),
    )

    if (!conversion.isValid || conversion.utilizedTracks.length === 0) {
      throw new CompressionError(
        'invalidVideoConversion',
        conversion.discardedTracks.map((track) => ({
          reason: track.reason,
          type: track.track.type,
          number: track.track.number,
          codec: track.trackOptions.codec,
          quality: (
            track.trackOptions.quality as { _quality: number } | undefined
          )?.['_quality'],
        })),
      )
    }

    conversion.onProgress = options.onProgress

    await __(output.start())
    options.onInitialized?.()
    await __(conversion.execute())
    options.onFinalizing?.()
    await __(output.finalize())

    return output.target.buffer!
  }

  async function compressImage(type: string) {
    async function getImageDecoder() {
      // 1. Try to init the decoder with desiredWidth/desiredHeight
      // 2. If throws:
      //    1. If AVIF, retry without preferAnimation
      //    2. Otherwise, retry without desiredWidth/desiredHeight for JPEG
      //       (See https://issues.chromium.org/issues/562384494)

      let decoder: ImageDecoder | undefined
      try {
        decoder = new ImageDecoder({
          type,
          data: blob.stream(),
          desiredWidth: options.width,
          desiredHeight: options.height,
          preferAnimation: true,
        })
        await __(decoder.tracks.ready)
        return __(decoder, (decoder) => decoder.close())
      } catch (e) {
        console.warn(e)
        decoder?.close()

        const init: ImageDecoderInit =
          type === 'image/avif'
            ? {
                type,
                data: blob.stream(),
                desiredWidth: options.width,
                desiredHeight: options.height,
              }
            : {
                type,
                data: blob.stream(),
                preferAnimation: true,
              }
        decoder = __(new ImageDecoder(init), (decoder) => decoder.close())
        await __(decoder.tracks.ready)
        return decoder
      }
    }

    const decoder = await getImageDecoder().catch((e) => {
      throw new CompressionError('cannotInitImageDecoder', e)
    })

    const track = decoder.tracks.selectedTrack
    if (!track) throw new CompressionException('noImageTracks')

    const output = __(
      new Output({
        format: new AvifOutputFormat({
          useSingleImage: !track.animated,
        }),
        target: new BufferTarget(),
      }),
      (output) => {
        if (output.state === 'finalized') return
        output.cancel()
      },
    )

    const source = new VideoSampleSource({
      codec: 'av1',
      quality: options.quality && new Quality(options.quality),
      transform: options,
    })

    output.addVideoTrack(source, {
      frameRate: options.frameRate,
    })

    await __(output.start())
    await __(decoder.completed)
    options.onInitialized?.()

    for (let frameIndex = 0; frameIndex < track.frameCount; ++frameIndex) {
      using __sub = __.sub(true)

      const sample = await __sub(
        decoder
          .decode({
            frameIndex,
            completeFramesOnly: true,
          })
          .then(({ image }) => new VideoSample(image)),
        (sample) => sample.close(),
      )

      await __sub(source.add(sample))

      const progress = (frameIndex + 1) / track.frameCount
      options.onProgress?.(progress, sample.timestamp)
    }

    options.onFinalizing?.()
    await __(output.finalize())

    return output.target.buffer!
  }
}

function convertArrayToDataUrl(arr: ArrayLike<number>, mimeType: string) {
  const base64 = Buffer.from(arr).toString('base64')
  return `data:${mimeType};base64,${base64}`
}

function getSvgTextWithAvif(
  avifUrl: string,
  { width: w, height: h }: CompressionOptions,
) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}"><image width="${w}" height="${h}" href="${avifUrl}"/></svg>`
}

export async function compressAndExportSvg(
  blob: Blob,
  options: CompressionOptions = {},
) {
  const compressedAvif = await compressVideoOrImageToAvif(blob, options)
  const avifDataUrl = convertArrayToDataUrl(compressedAvif, 'image/avif')
  const svgText = getSvgTextWithAvif(avifDataUrl, options)
  return new Blob([svgText], { type: 'image/svg+xml' })
}
