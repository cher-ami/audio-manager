import { StateSignal } from "@zouloux/signal"
import { deferredPromise, TDeferredPromise } from "@wbe/deferred-promise"
import { Howl } from "howler"
import debug from "@wbe/debug"
const log = debug(`AudioManager`)

/**
 * Global Signal state
 */

export const MUTE_AUDIO_SIGNAL = StateSignal<boolean>(false)

/**
 * Declare types for audio options
 */

export interface IAudioManagerOptions {
  id?: string
  volume?: number
  autoplay?: boolean
  loop?: boolean
  preload?: boolean
  html5?: boolean
  delay?: number
  onUpdate?: (time: number) => void
}

/**
 * AudioManager controls a single audio instance, a single sound
 *
 * @dep @wbe/debug https://www.npmjs.com/package/@wbe/debug
 * @dep @wbe/deferred-promise https://www.npmjs.com/package/@wbe/deferred-promise
 * @dep @solid-js/signal https://www.npmjs.com/package/@solid-js/signal
 */

export class AudioManager {
  protected url: string
  protected options: IAudioManagerOptions

  public sound: Howl

  public isLoading: boolean
  public isLoaded: boolean
  public isPlaying: boolean
  public isMuted: boolean
  public id: string = null
  protected nameSpace: string

  public canplayPromise: TDeferredPromise<void>
  public endedPromise: TDeferredPromise<void>
  protected raf: number

  constructor(audioFileUrl: string, options: IAudioManagerOptions = {}) {
    this.url = audioFileUrl

    const defaultOptions = {
      volume: 1,
      autoplay: false,
      loop: false,
      preload: true,
      html5: false,
      delay: 0,
      onUpdate: null,
    }

    this.options = {
      ...defaultOptions,
      ...options,
    }

    this.nameSpace = this.getNameSpace(this.id, this.url)
    this.isPlaying = false
    this.isLoading = true
    this.isLoaded = false
    this.isMuted = false
    this.canplayPromise = deferredPromise()
    this.endedPromise = deferredPromise()
    this.load()
    this.initEvents()
  }

  protected getNameSpace(id, url): string {
    return `${id} - ${url.replace(/^.*[\\\/]/, "")} -`
  }

  protected load() {
    // load howler sound
    this.sound = new Howl({
      src: [this.url],
      ...this.options,
      onload: () => {
        log(this.nameSpace, "canplay handler, audio is ready")
        this.isLoaded = true
        this.canplayPromise.resolve()
        this.isLoading = false
        this.isLoaded = true
        if (this.isMuted) this.mute()
      },
    })
  }

  protected initEvents(): void {
    MUTE_AUDIO_SIGNAL.add(this.handleMuteAll)
    this.sound.on("end", this.handleEnded)
  }

  // ---------------------–---------------------–---------------------–------------------- EVENTS

  protected handleMuteAll = (mute: boolean): void => {
    mute ? this.mute() : this.unmute()
  }

  protected handleEnded = (): void => {
    log(this.nameSpace, "ended")
    this.isPlaying = false
    this.endedPromise.resolve()

    if (this.raf) {
      this.cancelRaf()
    }
  }
  // ---------------------–---------------------–---------------------–------------------- API

  public async play(): Promise<void> {
    log(this.nameSpace, "waiting for canplayPromise...")
    await this.canplayPromise.promise
    this.endedPromise = deferredPromise()
    log(this.nameSpace, "play", this.options)
    await new Promise((r) => setTimeout(r, this.options.delay))

    this.id = this.sound.play()
    this.nameSpace = this.getNameSpace(this.id, this.url)
    this.isPlaying = true

    if (this.options.onUpdate) {
      this.raf = this.rafRender()
    }

    return this.endedPromise.promise
  }

  public pause() {
    if (!this.isPlaying || !this.isLoaded) return
    this.sound.pause()
    if (this.raf) {
      this.cancelRaf()
    }
  }

  public async stop() {
    log(this.nameSpace, "stop")
    this.sound.stop(this.id)
    this.isPlaying = false
    if (this.raf) {
      this.cancelRaf()
    }
  }

  public replay() {
    log(this.nameSpace, "replay")
    this.stop()
    this.play()
  }

  public async loop() {
    this.sound.loop(true)
    this.isPlaying = true
  }

  public mute(): void {
    log(this.nameSpace, "mute")
    if (this.isMuted) return

    this.sound.mute(true)
    this.isMuted = true
  }

  public unmute(): void {
    log(this.nameSpace, "unmute")
    if (!this.isMuted) return
    this.sound.mute(false)
    this.isMuted = false
  }

  public async fade(from: number, to: number, duration = 1000): Promise<void> {
    log(this.nameSpace, "fade >", from, to, this.options)
    // play in case is not playing
    if (!this.isPlaying) this.play()

    this.sound.fade(from, to, duration)
    return new Promise((r) => setTimeout(r, duration))
  }

  public async fadeIn(duration: number = 1000): Promise<void> {
    // if (!this.isLoaded) await this.canplayPromise.promise
    this.id = this.sound.play()
    log(this.nameSpace, `fadeIn 0 -> ${this.options.volume}`)
    this.isPlaying = true

    this.sound.fade(0, this.options.volume, duration)
    return new Promise((r) =>
      setTimeout(() => {
        log(this.nameSpace, "fadeIn ended")
        r()
      }, duration)
    )
  }

  public async fadeOut(duration: number = 1000): Promise<void> {
    // if (!this.isLoaded) await this.canplayPromise.promise
    log(this.nameSpace, `fadeOut ${this.options.volume} -> 0`)
    this.sound.fade(this.options.volume, 0, duration)
    return new Promise((resolve) =>
      setTimeout(() => {
        log(this.nameSpace, "fadeOut ended")
        this.stop()
        resolve()
      }, duration)
    )
  }

  public destroy() {
    log(this.nameSpace, "destroy")
    this.sound.unload()
    MUTE_AUDIO_SIGNAL.remove(this.handleMuteAll)
  }

  protected rafRender() {
    return requestAnimationFrame((time) => {
      this.options.onUpdate?.(time)
      this.raf = this.rafRender()
    })
  }

  protected cancelRaf() {
    cancelAnimationFrame(this.raf)
    this.raf = null
  }
}
