import type { Writer } from '@mini-profile/mediabunny-custom-format'
import type { Box } from './box-base'

export interface TrackedWritingData {
  data: Uint8Array<ArrayBufferLike>
  start: number
  end: number
}

export class IsobmffWriter {
  private writedBoxes = new Map<number, Box>()

  constructor(public writer: Writer) {}

  writeBoxes(
    boxes: Box[],
    canUseZeroSize?: boolean,
    doTrack?: boolean,
  ): TrackedWritingData | undefined
  writeBoxes(
    boxes: Box[],
    canUseZeroSize: boolean | undefined,
    doTrack: true,
  ): TrackedWritingData
  writeBoxes(boxes: Box[], canUseZeroSize?: boolean, doTrack?: boolean) {
    if (doTrack) {
      this.writer.startTrackingWrites()
    }

    boxes.forEach((box, i) => {
      this.writedBoxes.set(this.writer.getPos(), box)

      this.writer.write(
        box.getEncodedData(canUseZeroSize && i === boxes.length - 1),
      )
    })

    if (doTrack) {
      return this.writer.stopTrackingWrites()
    }
  }

  finalize() {
    return this.writer.finalize()
  }
}
