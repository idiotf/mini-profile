import { IsobmffOutputFormat, type MediaCodec } from 'mediabunny'
// import { AvifMuxer } from './muxer'
// import type { Output } from './mediabunny-internals'

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

  // /** @internal */
  // _createMuxer(output: Output) {
  //   return new AvifMuxer(output, this)
  // }
}
