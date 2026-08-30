import type {
  EncodedPacket,
  OutputVideoTrack,
  OutputAudioTrack,
  OutputSubtitleTrack,
} from 'mediabunny'
import { buildAvifMimeType } from './misc'
import {
  Muxer,
  type Output,
  type SubtitleCue,
  type SubtitleMetadata,
} from './mediabunny-internals'
import type { AvifOutputFormat } from './output-format'

export class AvifMuxer extends Muxer {
  constructor(
    output: Output,
    public format: AvifOutputFormat,
  ) {
    super(output)
  }

  override async start() {
    throw new Error('Method not implemented.')
  }

  override async getMimeType() {
    throw new Error('Method not implemented.')

    return buildAvifMimeType([])
  }

  async addEncodedVideoPacket(
    track: OutputVideoTrack,
    packet: EncodedPacket,
    meta?: EncodedVideoChunkMetadata,
  ) {
    throw new Error('Method not implemented.')
  }

  async addEncodedAudioPacket(
    track: OutputAudioTrack,
    packet: EncodedPacket,
    meta?: EncodedAudioChunkMetadata,
  ) {
    throw new Error('Method not implemented.')
  }

  async addSubtitleCue(
    track: OutputSubtitleTrack,
    cue: SubtitleCue,
    meta?: SubtitleMetadata,
  ) {
    throw new Error('Method not implemented.')
  }

  override async finalize() {
    throw new Error('Method not implemented.')
  }
}
