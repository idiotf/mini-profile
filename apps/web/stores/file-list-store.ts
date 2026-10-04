import { makeAutoObservable, runInAction } from 'mobx'
import { ListStore } from './list-store'
import {
  compressAndExportSvg,
  type CompressionOptions,
} from '@mini-profile/core'

const abortError = new Error('FileItem was destroyed')

export type { FileItem }
class FileItem {
  readonly options: CompressionOptions = {
    width: 180,
    height: 180,
    frameRate: 18,
    fit: 'cover',
    quality: 'very-low',
  }

  state: 'idle' | 'uploading' | 'processing' | 'error' | 'done' = 'idle'
  progress = 0
  processedTime = 0
  output?: Blob
  error?: unknown

  private destroyController = new AbortController()

  constructor(public file: File) {
    makeAutoObservable(this)
  }

  private get compressionOptions() {
    return {
      ...this.options,
      signal: this.destroyController.signal,
      onProgress: (progress: number, processedTime: number) => {
        runInAction(() => {
          this.progress = progress
          this.processedTime = processedTime
        })
      },
    }
  }

  private async compress() {
    const options = this.compressionOptions
    return compressAndExportSvg(this.file, options)
  }

  async startCompression() {
    if (this.state !== 'idle' && this.state !== 'error') return
    this.progress = 0
    this.processedTime = 0

    try {
      this.state = 'processing'
      const output = await this.compress()
      runInAction(() => {
        this.state = 'done'
        this.output = output
      })
    } catch (e) {
      if (e === abortError) return
      if (typeof e != 'string') console.error(e)

      runInAction(() => {
        this.state = 'error'
        this.error = e
      })
    }
  }

  destroy() {
    this.destroyController.abort(abortError)
  }
}

export class FileListStore {
  private listStore = new ListStore<FileItem>()

  constructor() {
    makeAutoObservable(this)
  }

  get items() {
    return this.listStore.items
  }

  get keys() {
    return this.listStore.keys
  }

  get values() {
    return this.listStore.values
  }

  add(...value: File[]) {
    return this.listStore.add(...value.map((file) => new FileItem(file)))
  }

  remove(i: number) {
    return this.listStore.remove(i)
  }
}
