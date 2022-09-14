import { AudioManager } from "@cher-ami/audio-manager"
import applause from "./assets/applause.wav"
import drumHitRim from "./assets/drum_hit_rim.mp3"
import drumSnakeRoll from "./assets/drum_snake_roll.mp3"

export interface IAudioFile {
  name: EGameAudio
  url: string
  options?
  instance?: AudioManager
}

export enum EGameAudio {
  APPLAUSE = "APPLAUSE",
  DRUM_HIT_RIM = "DRUM_HIT_RIM",
  DRUM_SNAKE_ROLL = "DRUM_SNAKE_ROLL",
}

/**
 * AudioService
 */
class AudioService {
  public globalConfig = {
    audioVolume: 0.5,
  }

  public audioFiles: IAudioFile[] = [
    {
      name: EGameAudio.APPLAUSE,
      url: applause,
      options: {
        volume: this.globalConfig.audioVolume,
        onUpdate: (time) => {
//          console.log("on update", time)
        },
      },
    },
    {
      name: EGameAudio.DRUM_HIT_RIM,
      url: drumHitRim,
      options: {
        volume: this.globalConfig.audioVolume,
      },
    },
    {
      name: EGameAudio.DRUM_SNAKE_ROLL,
      url: drumSnakeRoll,
      options: {
        volume: this.globalConfig.audioVolume,
      },
    },
  ]

  constructor() {
    // attach audio instance to each audio file obj
    this.audioFiles.forEach((file) => {
      file["instance"] = new AudioManager(file.url, file.options || {})
    })
  }

  public getSoundObjByName(name: EGameAudio): IAudioFile {
    return this.audioFiles.find((e) => e.name === name)
  }

  public playSound(name: EGameAudio) {
    this.getSoundObjByName(name)?.instance.play()
  }
}

export default new AudioService()
