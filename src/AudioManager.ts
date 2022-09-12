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

  public canplayPromise: TDeferredPromise<void>
  public endedPromise: TDeferredPromise<void>

  constructor(audioFileUrl: string, options: IAudioManagerOptions = {}) {
    this.url = audioFileUrl

    const defaultOptions = {
      volume: 1,
      autoplay: false,
      loop: false,
      preload: true,
      html5: false,
      delay: 0,
    }

    this.options = {
      ...defaultOptions,
      ...options,
    }

    this.isPlaying = false
    this.isLoading = true
    this.isLoaded = false
    this.isMuted = false
    this.canplayPromise = deferredPromise()
    this.endedPromise = deferredPromise()

    this.load()
    this.initEvents()
  }

  protected load() {
    // load howler sound
    this.sound = new Howl({
      src: [this.url],
      ...this.options,
      onload: () => {
        log(this.id, "canplay handler, audio is ready")
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

  public destroy() {
    log(this.id, "destroy")
    this.sound.unload()
    MUTE_AUDIO_SIGNAL.remove(this.handleMuteAll)
  }

  // ---------------------–---------------------–---------------------–------------------- EVENTS

  protected handleMuteAll = (mute: boolean): void => {
    mute ? this.mute() : this.unmute()
  }

  protected handleEnded = (): void => {
    log(this.id, "ended")
    this.isPlaying = false
    this.endedPromise.resolve()
  }
  // ---------------------–---------------------–---------------------–------------------- API

  public async play(): Promise<void> {
    log(this.id, "waiting for canplayPromise...")
    await this.canplayPromise.promise
    this.endedPromise = deferredPromise()
    log(this.id, "play", this.options)
    await new Promise((r) => setTimeout(r, this.options.delay))

    this.id = this.sound.play()
    this.isPlaying = true
    return this.endedPromise.promise
  }

  public pause() {
    if (!this.isPlaying || !this.isLoaded) return
    this.sound.pause()
  }

  public async stop() {
    log(this.id, "stop")
    this.sound.stop(this.id)
    this.isPlaying = false
  }

  public replay() {
    log(this.id, "replay")
    this.stop()
    this.play()
  }

  public async loop() {
    this.sound.loop(true)
    this.isPlaying = true
  }

  public mute(): void {
    log(this.id, "mute")
    if (this.isMuted) return

    this.sound.mute(true)
    this.isMuted = true
  }

  public unmute(): void {
    log(this.id, "unmute")
    if (!this.isMuted) return
    this.sound.mute(false)
    this.isMuted = false
  }

  public async fade(from: number, to: number, duration = 1000): Promise<void> {
    log(this.id, "fade >", from, to, this.options)
    // play in case is not playing
    if (!this.isPlaying) this.play()

    this.sound.fade(from, to, duration)
    return new Promise((r) => setTimeout(r, duration))
  }

  public async fadeIn(duration: number = 1000): Promise<void> {
    // if (!this.isLoaded) await this.canplayPromise.promise
    this.id = this.sound.play()
    log(this.id, `fadeIn 0 -> ${this.options.volume}`)
    this.isPlaying = true

    this.sound.fade(0, this.options.volume, duration)
    return new Promise((r) =>
      setTimeout(() => {
        log(this.id, "fadeIn ended")
        r()
      }, duration)
    )
  }

  public async fadeOut(duration: number = 1000): Promise<void> {
    // if (!this.isLoaded) await this.canplayPromise.promise
    log(this.id, `fadeOut ${this.options.volume} -> 0`)
    this.sound.fade(this.options.volume, 0, duration)
    return new Promise((resolve) =>
      setTimeout(() => {
        log(this.id, "fadeOut ended")
        this.stop()
        resolve()
      }, duration)
    )
  }
}
