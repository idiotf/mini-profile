// TODO: support multiple tracks

import {
  CustomMuxer,
  type EncodedPacket,
  type Output,
  type OutputVideoTrack,
} from '@mini-profile/mediabunny-custom-format'

import {
  IsobmffWriter,
  type Box,
} from '@mini-profile/isobmff-writer-mediabunny'

import {
  ftyp,
  meta,
  hdlr,
  pitm,
  iloc,
  iinf,
  infe,
  iprp,
  ipco,
  ipma,
  mdat,
  ispe,
  pixi,
  av1C,
  colr,
  type Infe,
  type IlocItem,
} from '@mini-profile/isobmff-writer-mediabunny/boxes'

import { getSeqFromOBU, parseSequenceHeader } from './av1-sequence'
import { buildAvifMimeType } from './misc'
import type { AvifOutputFormat } from './output-format'

function sumAllBoxesSize(boxes: Box[], canUseZeroSize?: boolean) {
  return boxes.reduce(
    (acc, box, boxIdx) =>
      acc + box.getSize(boxIdx === boxes.length - 1 && canUseZeroSize),
    0,
  )
}

const avifCompatibleBrands = ['avif', 'mif1', 'miaf', 'MA1B']
const avisCompatibleBrands = [
  'avis',
  'avif',
  'msf1',
  'iso8',
  'mif1',
  'miaf',
  'MA1B',
]

export class AvifMuxer extends CustomMuxer {
  private writer!: IsobmffWriter
  private baseOffset!: number
  private packets: EncodedPacket[] = []
  private metadataList: EncodedVideoChunkMetadata[] = []

  constructor(
    output: Output,
    public format: AvifOutputFormat,
  ) {
    super(output)
  }

  override async start() {
    const release = await this.mutex.acquire()

    const writer = (this.writer = new IsobmffWriter(await this.getWriter(true)))

    const boxes = [
      ftyp(
        this.format._options.useSingleImage ? 'avif' : 'avis',
        0,
        this.format._options.useSingleImage
          ? avifCompatibleBrands
          : avisCompatibleBrands,
      ),
    ]

    const canUseZeroSize = false

    this.baseOffset = sumAllBoxesSize(boxes, canUseZeroSize)

    if (this.format._options.onFtyp) {
      const { data, start } = writer.writeBoxes(boxes, canUseZeroSize, true)
      this.format._options.onFtyp(data, start)
    } else {
      writer.writeBoxes(boxes, canUseZeroSize)
    }

    release()
  }

  override async getMimeType() {
    const videoTracks = this.output.tracks.filter((v) => v.isVideoTrack())
    const codecs = videoTracks
      .map((v) => v.metadata.decoderConfig?.codec)
      .filter((v) => v !== undefined)
    return buildAvifMimeType(codecs)
  }

  override async addEncodedVideoPacket(
    _track: OutputVideoTrack,
    packet: EncodedPacket,
    meta?: EncodedVideoChunkMetadata,
  ) {
    const release = await this.mutex.acquire()

    this.packets.push(packet)
    if (meta) this.metadataList.push(meta)

    release()
  }

  override async addEncodedAudioPacket() {
    throw Error('AVIF does not support audio.')
  }

  override async addSubtitleCue() {
    throw Error('AVIF does not support subtitles.')
  }

  override async finalize() {
    const release = await this.mutex.acquire()

    try {
      const firstPacket = this.packets[0]
      if (!firstPacket) {
        throw TypeError('AVIF requires at least one packet')
      }

      const firstMeta = this.metadataList[0]
      if (!firstMeta) {
        throw TypeError('AVIF requires at least one metadata')
      }
      if (
        !firstMeta.decoderConfig ||
        !firstMeta.decoderConfig.codedWidth ||
        !firstMeta.decoderConfig.codedHeight
      ) {
        console.error(firstMeta.decoderConfig)
        throw TypeError('AVIF internal error: invalid decoderConfig')
      }

      if (this.format._options.useSingleImage && this.packets.length !== 1) {
        throw TypeError(
          'The length of packets of AVIF single image must be 1; received ' +
            this.packets.length,
        )
      }

      const generateMetaBox = () =>
        meta({
          hdlr: hdlr(0, 'pict'),
          pitm: pitm(),
          iloc: iloc(ilocItems),
          iinf: iinf(infeBoxes),
          iprp: iprp({
            ipco: ipco(ipcoBoxes),
            ipma: ipma([
              {
                itemID: 1,
                associations: ipcoBoxes.map((box, i) => ({
                  propertyIndex: i + 1,
                  essential: box.type === 'av1C',
                })),
              },
            ]),
          }),
        })

      const ilocItems: IlocItem[] = [
        {
          id: 1,
          extents: [
            {
              offset: 0, // Will be changed later
              length: this.packets.reduce((acc, v) => acc + v.byteLength, 0),
            },
          ],
        },
      ]

      const infeBoxes: Infe[] = [infe(1, 0, 'av01', 'Color')]

      const seqPayload = getSeqFromOBU(firstPacket.data)
      const sequenceHeader = parseSequenceHeader(seqPayload)
      const ipcoBoxes: Box[] = [
        ispe(
          firstMeta.decoderConfig.codedWidth,
          firstMeta.decoderConfig.codedHeight,
        ),
        pixi([8, 8, 8]),
        av1C(sequenceHeader),
        colr.nclx({
          colourPrimaries: sequenceHeader.colorPrimaries,
          transferCharacteristics: sequenceHeader.transferCharacteristics,
          matrixCoefficients: sequenceHeader.matrixCoefficients,
          fullRangeFlag: sequenceHeader.colorRange,
        }),
      ]

      const canUseZeroSize = false

      let metaBox
      for (;;) {
        if (
          metaBox?.getSize(canUseZeroSize) ===
          (metaBox = generateMetaBox()).getSize(canUseZeroSize)
        ) {
          break
        }

        let dataOffsetFromFile =
          this.baseOffset + metaBox.getSize(canUseZeroSize) + 8 // size and type of mdat box

        for (const { extents } of ilocItems) {
          for (const extent of extents) {
            extent.offset = dataOffsetFromFile
            dataOffsetFromFile += extent.length
          }
        }
      }

      const mdatData = new Uint8Array(
        this.packets.reduce((acc, packet) => acc + packet.byteLength, 0),
      )
      let dataOffsetFromMdat = 0
      for (const packet of this.packets) {
        mdatData.set(packet.data, dataOffsetFromMdat)
        dataOffsetFromMdat += packet.byteLength
      }

      this.writer.writeBoxes([metaBox, mdat(mdatData)])
    } finally {
      release()
    }
  }
}
