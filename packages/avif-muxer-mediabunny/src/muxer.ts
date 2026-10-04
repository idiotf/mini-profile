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
  type Infe,
  type IlocItem,
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
  moov,
  mvhd,
  trak,
  tkhd,
  edts,
  elst,
  mdia,
  mdhd,
  minf,
  vmhd,
  dinf,
  dref,
  url,
  stbl,
  stsd,
  av01,
  stts,
  stsc,
  stsz,
  stco,
} from '@mini-profile/isobmff-writer-mediabunny/boxes'

import { getSeqFromOBU, parseSequenceHeader } from './av1-sequence'
import {
  approximateRational,
  buildAvifMimeType,
  rle,
  sumAndRoundDelta,
} from './misc'
import type { AvifOutputFormat } from './output-format'

const DEFAULT_TIMESCALE = 57600

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

      const useSingleImage = this.format._options.useSingleImage
      if (useSingleImage && this.packets.length !== 1) {
        throw TypeError(
          'The length of packets of AVIF single image must be 1; received ' +
            this.packets.length,
        )
      }

      const now = new Date()

      const width = firstMeta.decoderConfig.codedWidth
      const height = firstMeta.decoderConfig.codedHeight

      const primaryTrackMetadata = (this.output.tracks[0] as OutputVideoTrack)
        .metadata
      const frameRate = primaryTrackMetadata.frameRate
      const timescale =
        frameRate !== undefined
          ? approximateRational(frameRate, 1e6).num
          : DEFAULT_TIMESCALE

      const language = primaryTrackMetadata.languageCode

      const packetDeltaList = this.packets.map(
        (packet) => packet.duration * timescale,
      )
      const packetDeltaRle = rle(sumAndRoundDelta(packetDeltaList))
      const packetDeltaEntries = packetDeltaRle.map((v) => ({
        sampleCount: v.count,
        sampleDelta: v.value,
      }))

      const lastPacket = this.packets[this.packets.length - 1]!
      const totalDuration = lastPacket.timestamp + lastPacket.duration
      const totalDurationInTimescale = Math.round(totalDuration * timescale)

      const generateMetadataBoxes = () => {
        const boxes: Box[] = [
          meta([
            hdlr('pict', 'PictureHandler'),
            pitm(),
            iloc(ilocItems),
            iinf(infeBoxes),
            iprp([
              ipco(ipcoBoxes),
              ipma([
                {
                  itemID: 1,
                  associations: ipcoBoxes.map((box, i) => ({
                    propertyIndex: i + 1,
                    essential: box.type === 'av1C',
                  })),
                },
              ]),
            ]),
          ]),
        ]

        if (!useSingleImage) {
          boxes.push(
            moov([
              mvhd({
                creationTime: now,
                modificationTime: now,
                timescale,
                duration: 0xffff_ffff_ffff_ffffn,
                matrix: [1, 0, 0, 0, 1, 0, 0, 0, 1],
                nextTrackID: 2,
              }),
              trak([
                tkhd({
                  creationTime: now,
                  modificationTime: now,
                  trackID: 1,
                  duration: 0xffff_ffff_ffff_ffffn,
                  matrix: [1, 0, 0, 0, 1, 0, 0, 0, 1],
                  width,
                  height,
                }),
                edts(
                  elst(
                    [
                      {
                        segmentDuration: totalDurationInTimescale,
                        mediaTime: 0,
                        mediaRate: 1,
                      },
                    ],
                    true,
                  ),
                ),
                mdia([
                  mdhd({
                    creationTime: now,
                    modificationTime: now,
                    timescale,
                    duration: totalDurationInTimescale,
                    language,
                  }),
                  hdlr('pict', 'PictureHandler'),
                  minf([
                    vmhd(0, [0, 0, 0]),
                    dinf([dref([url()])]),
                    stbl([
                      stsd([
                        av01(
                          {
                            dataReferenceIndex: 1,
                            width,
                            height,
                            horizResolution: 72 << 16,
                            vertResolution: 72 << 16,
                            frameCount: this.packets.length,
                            compressorName: '',
                            depth:
                              seqHeader.bitDepth *
                              (seqHeader.monochrome ? 1 : 3),
                          },
                          [av1CBox],
                        ),
                      ]),
                      stts(packetDeltaEntries),
                      stsc([
                        {
                          firstChunk: 1,
                          samplesPerChunk: this.packets.length,
                          sampleDescriptionIndex: 1,
                        },
                      ]),
                      stsz(this.packets.map((v) => v.byteLength)),
                      stco(stcoItems), // Will be changed later
                    ]),
                  ]),
                ]),
              ]),
            ]),
          )
        }

        return boxes
      }

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
      const seqHeader = parseSequenceHeader(seqPayload)
      const av1CBox = av1C(seqHeader)

      const ipcoBoxes: Box[] = [
        ispe(width, height),
        pixi(
          seqHeader.monochrome
            ? [seqHeader.bitDepth]
            : [seqHeader.bitDepth, seqHeader.bitDepth, seqHeader.bitDepth],
        ),
        av1CBox,
        colr.nclx({
          colourPrimaries: seqHeader.colorPrimaries,
          transferCharacteristics: seqHeader.transferCharacteristics,
          matrixCoefficients: seqHeader.matrixCoefficients,
          fullRangeFlag: seqHeader.colorRange,
        }),
      ]

      const stcoItems = [0]

      const mdatData = new Uint8Array(
        this.packets.reduce((acc, packet) => acc + packet.byteLength, 0),
      )
      let dataOffsetFromMdat = 0
      for (const packet of this.packets) {
        mdatData.set(packet.data, dataOffsetFromMdat)
        dataOffsetFromMdat += packet.byteLength
      }

      const mdatBox = mdat(mdatData)
      const mdatHeaderSize = mdatBox.getHeaderSize()

      let boxes, boxesSize
      for (;;) {
        if (
          boxesSize ===
          (boxesSize = sumAllBoxesSize((boxes = generateMetadataBoxes())))
        ) {
          break
        }

        let dataOffsetFromFile = this.baseOffset + boxesSize + mdatHeaderSize
        stcoItems[0] = dataOffsetFromFile

        for (const { extents } of ilocItems) {
          for (const extent of extents) {
            extent.offset = dataOffsetFromFile
            dataOffsetFromFile += extent.length
          }
        }
      }

      this.writer.writeBoxes([...boxes, mdatBox])
    } finally {
      release()
    }
  }
}
