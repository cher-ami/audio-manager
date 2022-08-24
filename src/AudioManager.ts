import { StateSignal } from "@zouloux/signal"
import { deferredPromise, TDeferredPromise } from "@wbe/deferred-promise"
import debug from "@wbe/debug"
import { Howl } from "howler"
const log = debug(`AudioManager`)

// --------------------------------------------------------------------------- GLOBAL

/**
 * Global Signal state
 */

export const MUTE_AUDIO_SIGNAL = StateSignal<boolean>(false)

// --------------------------------------------------------------------------- TYPES

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

// --------------------------------------------------------------------------- MANAGER

/**
 * AudioManager controls a single instance, a single sound
 *
 * @dep @wbe/debug https://www.npmjs.com/package/@wbe/debug
 * @dep @wbe/deferred-promise https://www.npmjs.com/package/@wbe/deferred-promise
 * @dep @solid-js/signal https://www.npmjs.com/package/@solid-js/signal
 */

export class AudioManager {
  protected url: string
  protected options: IAudioManagerOptions
  protected audioCtx: AudioContext
  protected panner: StereoPannerNode
  protected listener: AudioListener

  public sound: Howl

  public isLoading: boolean
  public isLoaded: boolean
  public isPlaying: boolean
  public isMuted: boolean
  public id: string

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

    this.id = [
      this.options?.id && `${this.options?.id}__`,
      audioFileUrl.split("/")[audioFileUrl.split("/").length - 1],
      " - ",
    ]
      .filter((e) => e)
      .join("")

    log(this.id, "options", this.options)

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
    if (this.options.loop) {
      this.play()
    }
    this.isPlaying = false
  }
  // ---------------------–---------------------–---------------------–------------------- API

  public async play(key?: string): Promise<void> {
    log(this.id, "waiting for canplayPromise...")
    await this.canplayPromise.promise
    this.endedPromise = deferredPromise()
    log(this.id, "play", this.options)
    await new Promise((r) => setTimeout(r, this.options.delay))
    this.id = this.sound.play(key)
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
    if (!this.isLoaded) await this.canplayPromise.promise
    this.sound.loop(true, this.id)
    this.isPlaying = true
  }

  public mute(): void {
    log(this.id, "mute")
    if (this.isMuted) return

    console.log("this.sound", this.sound)
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
    if (!this.isLoaded) await this.canplayPromise.promise
    log(this.id, "fade >", from, to, this.options)
    // play in case is not playing
    if (!this.isPlaying) this.play()

    this.sound.fade(from, to, duration, this.id)
    return new Promise((r) => setTimeout(r, duration))
  }

  public async fadeIn(duration: number = 1000): Promise<void> {
    if (!this.isLoaded) await this.canplayPromise.promise
    log(this.id, "fadeIn")
    this.id = this.sound.play()
    this.isPlaying = true
    this.sound.fade(0, this.options.volume, duration, this.id)
    return new Promise((r) => setTimeout(r, duration))
  }

  public async fadeOut(duration: number = 1000): Promise<void> {
    if (!this.isLoaded) await this.canplayPromise.promise
    log(this.id, "fadeOut")
    this.isPlaying = false
    this.sound.fade(this.options.volume, 0, duration, this.id)
    return new Promise((resolve) =>
      setTimeout(() => {
        this.stop()
        resolve()
      }, duration)
    )
  }

  // TODO remove
  public enableLoop(): void {
    console.warn("deprecated")
    this.sound.loop()
    // log(this.id, "loop")
    // this.options.loop = true
  }

  public disableLoop(): void {
    console.warn("deprecated")
    // log(this.id, "disable loop")
    // this.options.loop = false
  }

  /**
   * pan
   * Used to place the sound on a device supporting stereo sound.
   * If using -1 to 1 range. -1 would be far left & 1 far right.
   *
   * @param vPan Value of pan, idealy from -1 to 1
   */
  public pan(vPan: number): void {
    log(this.id, "pan", vPan)
    console.warn("deprecated")
    //this.panner.pan.value = vPan
  }
}
