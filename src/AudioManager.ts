import debug from "@wbe/debug"
import { deferredPromise, TDeferredPromise } from "@wbe/deferred-promise"
import { resolve } from "path"
const log = debug(`AudioManager`)

export class AudioManager {
  protected audioFileUrl: string
  protected options: any
  protected audioCtx: AudioContext
  protected $audio: HTMLAudioElement
  protected track: MediaElementAudioSourceNode

  public isLoading: boolean
  public isLoaded: boolean
  public isPlaying: boolean
  public isMuted: boolean

  public canplayPromise: TDeferredPromise<void>

  constructor(audioFileUrl: string, options: { volume?: number; loop?: boolean }) {
    this.audioFileUrl = audioFileUrl

    const defaultOptions = {
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
    // for cross browser
    const AudioContext = window.AudioContext || window["webkitAudioContext"]
    this.audioCtx = new AudioContext()

    // load audio
    this.$audio = new Audio(this.audioFileUrl)
    const track = this.audioCtx.createMediaElementSource(this.$audio)

    track.connect(this.audioCtx.destination)
  }

  // ---------------------–---------------------–---------------------–------------------- EVENTS
  protected initEvent() {
    if (!this.$audio) return
    // if track ends
    this.$audio.addEventListener("canplay", this.handleCanplay)
    this.$audio.addEventListener("ended", this.handleEnded)
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

  // ---------------------–---------------------–---------------------–------------------- API

  public async play(): Promise<void> {
    log("play", this.options)
    await this.canplayPromise.promise

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
   * fade
   * Process fade between 2 points
   * @param from 1 = 100%, 0 = 0%
   * @param to 1 = 100%, 0 = 0%
   * @param duration In second
   */
  protected _processVolumeArray = []

  public async fade(from: number, to: number, duration = 1): Promise<any> {
    log("fade >", from, to, this.options)

    // play in case is not playing
    this.play()

    await this.processVolume(from, to, duration)
    log("fade ended!", this.$audio.volume)
  }

  public async fadeIn(duration = 1): Promise<any> {
    log("fadeIn")
    this.play()
    
    await this.processVolume(0, this.options.volume, duration)
    log("fadeIn ended!")
  }

  public async fadeOut(duration = 1): Promise<any> {
    log("fadeOut")
    await this.processVolume(this.options.volume, 0, duration)
    log("fadeOut ended!")
  }

  public destroy() {
    log("destroy")
    this.pause()
    this.track?.disconnect()
    this.$audio = null
  }

  // ---------------------–---------------------–---------------------–------------------- UTILS

  protected _raf
  protected _count = 0
  protected _isInProcess: boolean

  /**
   *
   * @param from
   * @param to
   * @param duration
   * @returns
   */

  protected processVolume(from: number, to: number, duration = 1) {
    // if (this._isInProcess) {
    //   log("is in process, reject")
    // }

    const limitFrom = Math.max(0, Math.min(from, 1))
    const limitTo = Math.max(0, Math.min(to, 1))


    return new Promise((resolve: any) => {
        const clear = () => {
        cancelAnimationFrame(this._raf)
        log("CLEAR > this.$audio.volume", this.$audio.volume)
        resolve()
        this._isInProcess = false
      }

      // chose volume direction
      const isIncrement = limitFrom <= limitTo
      this.$audio.volume = this._count = this._isInProcess
        ? this.$audio.volume
        : limitFrom

      // keep current time for normalization
      let time = Date.now()

      this._isInProcess = true
      const tick = () => {
        // normalize time
        const currentTime = Date.now()
        const deltaTime = currentTime - time
        time = currentTime

        // increment
        if (isIncrement) {
          if (this.$audio.volume >= limitTo) {
            clear()
            return
          }
          this._count = this._count + deltaTime / duration / 1000
          this.$audio.volume = Math.max(limitFrom, Math.min(this._count, limitTo))
          log("increment > this.$audio.volume", this.$audio.volume)
        }

        // decrement
        else {
          if (this.$audio.volume <= limitTo) {
            clear()
            return
          }

          this._count -= deltaTime / duration / 1000
          this.$audio.volume = Math.max(limitTo, Math.min(this._count, limitFrom))
          log("decrement > this.$audio.volume", this.$audio.volume)
        }

        requestAnimationFrame(tick)
      }

      // start interval
      this._raf = requestAnimationFrame(tick)
    })

  }
}
