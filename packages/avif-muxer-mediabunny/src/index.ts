import { type MediaCodec, IsobmffOutputFormat } from 'mediabunny'

export class AvifOutputFormat extends IsobmffOutputFormat {
  override get fileExtension() {
    return '.avif'
  }

  override get mimeType() {
    return 'image/avif'
  }

  override getSupportedCodecs(): MediaCodec[] {
    return ['av1']
  }
}
