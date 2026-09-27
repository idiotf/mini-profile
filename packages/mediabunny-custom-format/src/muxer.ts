import type {
  Muxer,
  Output,
  OutputTrack,
  Target,
  Writer,
} from './mediabunny-internals'

export class AsyncMutex {
  currentPromise = Promise.resolve()
  pending = 0

  async acquire() {
    let resolver: () => void
    const nextPromise = new Promise<void>((resolve) => {
      let resolved = false

      resolver = () => {
        if (resolved) {
          return
        }

        resolve()
        this.pending--
        resolved = true
      }
    })

    const currentPromiseAlias = this.currentPromise
    this.currentPromise = nextPromise
    this.pending++

    await currentPromiseAlias

    return resolver!
  }
}

abstract class CustomMuxerTemp {
  mutex = new AsyncMutex()

  constructor(public output: Output) {}

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  onTrackClose(track: OutputTrack) {}

  private trackTimestampInfo = new WeakMap<
    OutputTrack,
    {
      maxTimestamp: number
      maxTimestampBeforeLastKeyPacket: number | null
    }
  >()

  protected validateTimestamp(
    track: OutputTrack,
    timestampInSeconds: number,
    isKeyPacket: boolean,
  ) {
    if (timestampInSeconds < 0) {
      throw new Error(
        `Timestamps must be non-negative (got ${timestampInSeconds}s).`,
      )
    }

    let timestampInfo = this.trackTimestampInfo.get(track)
    if (!timestampInfo) {
      if (!isKeyPacket) {
        throw new Error('First packet must be a key packet.')
      }

      timestampInfo = {
        maxTimestamp: timestampInSeconds,
        maxTimestampBeforeLastKeyPacket: null,
      }
      this.trackTimestampInfo.set(track, timestampInfo)
    } else {
      if (isKeyPacket) {
        timestampInfo.maxTimestampBeforeLastKeyPacket =
          timestampInfo.maxTimestamp
      }

      if (
        timestampInfo.maxTimestampBeforeLastKeyPacket !== null &&
        timestampInSeconds < timestampInfo.maxTimestampBeforeLastKeyPacket
      ) {
        throw new Error(
          `Timestamps cannot be smaller than the largest timestamp of the previous GOP (a GOP begins with a` +
            ` key packet and ends right before the next key packet). Got ${timestampInSeconds}s, but largest` +
            ` timestamp is ${timestampInfo.maxTimestampBeforeLastKeyPacket}s.`,
        )
      }

      timestampInfo.maxTimestamp = Math.max(
        timestampInfo.maxTimestamp,
        timestampInSeconds,
      )
    }
  }
}

const CustomMuxerAsMuxer = CustomMuxerTemp as unknown as abstract new (
  output: Output,
) => Muxer

interface OutputWithWriter extends Output {
  _getRootWriter(
    isMonotonic: boolean | ((target: Target) => boolean),
  ): Promise<Writer>
}

export abstract class CustomMuxer extends CustomMuxerAsMuxer {
  protected getWriter(
    isMonotonic: boolean | ((target: Target) => boolean),
  ): Promise<Writer> {
    return (this.output as OutputWithWriter)._getRootWriter(isMonotonic)
  }
}
