import { StateSignal } from "@zouloux/signal"
import { deferredPromise, TDeferredPromise } from "@wbe/deferred-promise"
import debug from "@wbe/debug"
import { gsap } from "gsap"
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

export type TAudioManagerOptions = {
  volume?: number
  loop?: boolean
  // TODO: Figure out which options we would like to implement next
  // autoplay?: boolean
  // preload?: boolean
  // html5?: boolean
  // delay?: number // ms
}

// --------------------------------------------------------------------------- MANAGER

/**
 * AudioManager controls a single instance, a single sound
 *
 * @dep @wbe/debug https://www.npmjs.com/package/@wbe/debug
 * @dep @wbe/deferred-promise https://www.npmjs.com/package/@wbe/deferred-promise
 * @dep @solid-js/signal https://www.npmjs.com/package/@solid-js/signal
 * @dep @gsap https://greensock.com/gsap/
 */

export class AudioManager {
  protected audioFileUrl: string
  protected options: TAudioManagerOptions
  protected audioCtx: AudioContext
  protected panner: StereoPannerNode
  protected listener: AudioListener
  protected $audio: HTMLAudioElement
  protected track: MediaElementAudioSourceNode

  public isLoading: boolean
  public isLoaded: boolean
  public isPlaying: boolean
  public isMuted: boolean

  public canplayPromise: TDeferredPromise<void>

  constructor(
    audioFileUrl: string,
    options: { volume?: number; loop?: boolean } = {}
  ) {
    this.audioFileUrl = audioFileUrl

    const defaultOptions: TAudioManagerOptions = {
      volume: 1,
      loop: false,
    }

    this.options = {
      ...defaultOptions,
      ...options,
    }

    log("options", this.options)

    this.isPlaying = false
    this.isLoading = true
    this.isLoaded = false
    this.isMuted = false

    this.canplayPromise = deferredPromise()

    this.load()
    this.initEvent()
  }

  protected load() {
    // Audio context for cross browser
    const AudioContext = window.AudioContext || window["webkitAudioContext"]
    this.audioCtx = new AudioContext()

    // Panner
    const pannerOptions = { pan: 0 }
    this.panner = new StereoPannerNode(this.audioCtx, pannerOptions)

    // Load audio
    this.$audio = new Audio(this.audioFileUrl)
    this.$audio.crossOrigin = "anonymous"
    this.track = this.audioCtx.createMediaElementSource(this.$audio)

    // Order is important when connecting
    this.track.connect(this.panner).connect(this.audioCtx.destination)
  }

  // ---------------------–---------------------–---------------------–------------------- EVENTS

  protected initEvent(): void {
    if (!this.$audio) return
    // if track ends
    this.$audio.addEventListener("canplay", this.handleCanplay)
    this.$audio.addEventListener("ended", this.handleEnded)
    MUTE_AUDIO_SIGNAL.add(this.handleMuteAll)

    // because canplay doesn't fire on safari, need to call load() too
    this.$audio.load()
  }

  protected handleCanplay = () => {
    log("canplay")
    this.canplayPromise.resolve()
    this.isLoading = false
    this.isLoaded = true
  }

  protected handleEnded = () => {
    log("ended")
    this.isPlaying = false

    if (this.options.loop) {
      this.play()
    }
  }

  protected handleMuteAll = (mute: boolean): void => {
    mute ? this.mute() : this.unmute()
  }

  // ---------------------–---------------------–---------------------–------------------- API

  public async play(): Promise<void> {
    log("play", this.options)
    await this.canplayPromise.promise
    log("ici")

    // check if context is in suspended state (autoplay policy)
    if (this.audioCtx.state === "suspended") {
      this.audioCtx.resume()
    }

    if (this.isPlaying) {
      log("play > is already playIn, return")
      return
    }
    this.$audio.play()
    this.isPlaying = true
  }

  public pause() {
    if (!this.isPlaying) return
    this.$audio.pause()
    this.isPlaying = false
  }

  public stop() {
    log("stop")
    this.$audio.pause()
    this.$audio.currentTime = 0
    this.isPlaying = false
  }

  public replay() {
    log("replay")
    this.stop()
    this.play()
  }

  public mute(): void {
    log("mute", this.$audio.volume)
    if (this.isMuted) return

    this.$audio.volume = 0
    this.isMuted = true
  }

  public unmute(): void {
    log("unmute", this.$audio.volume)
    if (!this.isMuted) return
    this.$audio.volume = this.options.volume
    this.isMuted = false
  }

  public enableLoop(): void {
    log("loop")
    this.options.loop = true
  }

  public disableLoop(): void {
    log("disable loop")
    this.options.loop = false
  }

  /**
   * pan
   * Used to place the sound on a device supporting stereo sound.
   * If using -1 to 1 range. -1 would be far left & 1 far right.
   *
   * @param vPan Value of pan, idealy from -1 to 1
   */
  public pan(vPan: number): void {
    log("pan", vPan)
    this.panner.pan.value = vPan
  }

  /**
   * fade
   * Process fade between 2 points
   * @param from 1 = 100%, 0 = 0%
   * @param to 1 = 100%, 0 = 0%
   * @param duration In second
   */
  public async fade(
    from: number,
    to: number,
    duration = 1,
    ease = "none"
  ): Promise<any> {
    log("fade >", from, to, this.options)

    // play in case is not playing
    if (!this.isPlaying) {
      this.play()
    }

    await this.processVolume(from, to, duration, ease)
    log("fade ended!", this.$audio.volume)
  }

  public async fadeIn(duration = 1, ease = "none"): Promise<any> {
    log("fadeIn")

    // play in case is not playing
    this.play()

    await this.processVolume(0, this.options.volume, duration, ease)
    log("fadeIn ended!")
  }

  public async fadeOut(duration = 1, ease = "none"): Promise<any> {
    log("fadeOut")
    await this.processVolume(this.options.volume, 0, duration, ease)
    log("fadeOut ended!")
  }

  public destroy() {
    log("destroy")
    this.pause()
    this.track?.disconnect()
    this.$audio = null
    MUTE_AUDIO_SIGNAL.remove(this.handleMuteAll)
  }

  // ---------------------–---------------------–---------------------–------------------- UTILS

  protected _volumeIsInProcess: boolean

  /**
   * process volume mutation
   * @param from
   * @param to
   * @param duration
   * @param ease
   * @returns
   */

  protected processVolume(
    from: number,
    to: number,
    duration = 1,
    ease: string = "none"
  ) {
    // limit
    const limitFrom = Math.max(0, Math.min(from, 1))
    const limitTo = Math.max(0, Math.min(to, 1))

    return new Promise((resolve: any) => {
      gsap.fromTo(
        this.$audio,
        {
          volume: this._volumeIsInProcess ? this.$audio.volume : limitFrom,
        },
        {
          volume: limitTo,
          overwrite: true,
          ease,
          duration,
          onUpdate: () => {
            this._volumeIsInProcess = true
            log("this.$audio.volume", this.$audio.volume)
          },
          onComplete: () => {
            this._volumeIsInProcess = false
            resolve()
          },
        }
      )
    })
  }
}
