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
      log('play > is already playIn, return')
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

  public async fadeIn(duration = 1): Promise<any> {
    log("fadeIn")
    this.play()
    await this.processVolume("increment", duration)
    log("fadeIn ended!")
  }

  public async fadeOut(duration = 1): Promise<any> {
    log("fadeOut")
    await this.processVolume("decrement", duration)
  }

  public destroy() {
    log("destroy")
    this.pause()
    this.track?.disconnect()
    this.$audio = null
  }

  // ---------------------–---------------------–---------------------–------------------- UTILS

  protected _raf
  protected _currVolume
  protected _count = 0

  protected processVolume(type: "increment" | "decrement", duration = 1) {
    return new Promise((resolve: any) => {
      // clear interval
      const clear = () => {
        log("clear interval")
        cancelAnimationFrame(this._raf)
        resolve()
      }

      // keep current time for normalization
      let time = Date.now()

      const tick = () => {
        // normalize time
        const currentTime = Date.now()
        const deltaTime = currentTime - time
        time = currentTime

        if (type === "increment") {
          // if progress ended
          if (Math.round(this._count) >= this.options.volume * 1000) {
            clear()
            this.$audio.volume = 1
            return
          }

          log("deltaTime", deltaTime)
          // normalize
          this._count += deltaTime / duration
          this.$audio.volume = Math.max(0, Math.min(this._count / 1000, 1))

          log("this._count", this._count)
          log("this.$audio.volume", this.$audio.volume)
        }

        if (type === "decrement") {
          // if progress ended
          if (Math.round(this._count) <= 0) {
            clear()
            this.$audio.volume = 0
            return
          }

          log("deltaTime", deltaTime)
          // normalize
          this._count -= deltaTime / duration
          this.$audio.volume = Math.max(0, Math.min(this._count / 1000, 1))

          log("this._count", this._count)
          log("this.$audio.volume", this.$audio.volume)
        }

        requestAnimationFrame(tick)
      }

      // start interval
      this._raf = requestAnimationFrame(tick)
    })
  }
}
