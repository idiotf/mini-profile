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

export interface CompressionOptions {
  width?: number
  height?: number
  frameRate?: number
  fit?: 'fill' | 'contain' | 'cover'
  quality?: 'very-low' | 'low' | 'medium' | 'high' | 'very-high'
  signal?: AbortSignal
  onProgress?: (progress: number, processedTime: number) => void
}

async function compressVideoOrImageToAvif(
  blob: Blob,
  options: CompressionOptions = {},
) {
  using __ = bindSignal(options.signal, true)

  const source = new BlobSource(blob)
  const imgMimeType = await __(readImageMimeType(source))

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
          throw '지원되지 않는 파일 형식입니다.'
        }
        throw reason
      }),
      (conversion) => conversion.cancel(),
    )

    if (!conversion.isValid) {
      const reasons = new Set(conversion.discardedTracks.map((v) => v.reason))
      throw reasons
    }

    conversion.onProgress = options.onProgress

    await __(output.start())
    await __(conversion.execute())
    await __(output.finalize())

    return output.target.buffer!
  }

  async function compressImage(type: string) {
    const decoder = __(
      new ImageDecoder({
        type,
        data: blob.stream(),
        desiredWidth: options.width,
        desiredHeight: options.height,
        preferAnimation: true,
      }),
      (decoder) => decoder.close(),
    )
    await __(decoder.tracks.ready)

    const track = decoder.tracks.selectedTrack
    if (!track) throw TypeError('Cannot find primary animated image track')

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
