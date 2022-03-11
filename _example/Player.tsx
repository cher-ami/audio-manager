import React, { useEffect, useRef, useState } from "react"
import css from "./Player.module.less"
import { AudioManager } from "../src/AudioManager"
import { useAudio } from "../src/hooks"

const Player = ({ audiFileUrl }) => {
  // const sound = useAudio(applause, { volume: 0.8, loop: true });
  // const heartbeatSound = useAudio(heartbeat, { volume: 0.8 });
  
  const [sound, setSound] = useState<AudioManager>(null)

  useEffect(() => {
    const instance = new AudioManager(audiFileUrl, { loop: true })
    setSound(instance)
    
    return () => {
      instance.destroy()
    }
  }, [])

  return (
    <div className={css.root}>
      <div className={css.container}>
        <div className={css.wrapper}>
          <h2 className={css.name}>{audiFileUrl}</h2>
          <div className={css.buttons}>
            <button className={css.button} onClick={() => sound.play()}>
              Play
            </button>
            <button className={css.button} onClick={() => sound.pause()}>
              Pause
            </button>
            <button className={css.button} onClick={() => sound.stop()}>
              Stop
            </button>
            <button className={css.button} onClick={() => sound.replay()}>
              Replay
            </button>
            <button className={css.button} onClick={() => sound.fadeIn()}>
              FadeIn
            </button>
            <button className={css.button} onClick={() => sound.fadeOut()}>
              FadeOut
            </button>
            <button className={css.button} onClick={() => sound.fade(0.3, 0.9, 1)}>
              Fade 0.3 - 0.9
            </button>
            <button className={css.button} onClick={() => sound.fade(0.9, 0.3, 1)}>
              Fade 0.9 - 0.3
            </button>
            <button className={css.button} onClick={() => sound.mute()}>
              Mute
            </button>
            <button className={css.button} onClick={() => sound.unmute()}>
              UnMute
            </button>
            <button className={css.button} onClick={() => sound.enableLoop()}>
              enable loop
            </button>
            <button className={css.button} onClick={() => sound.disableLoop()}>
              disable loop
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Player
