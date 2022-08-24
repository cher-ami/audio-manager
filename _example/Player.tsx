import React from "react"
import { useAudio } from "../src/hooks"
import css from "./Player.module.less"

const Player = ({ audiFileUrl }) => {
  const sound = useAudio(audiFileUrl, { loop: false, volume: 0.2 });

  return (
    <div className={css.root}>
      <div className={css.container}>
        <div className={css.wrapper}>
          <h2 className={css.name}>{audiFileUrl}</h2>
          <div className={css.buttons}>
            <button className={css.button} onClick={() => sound.play().then(()=> console.log('icicicici'))}>
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
            <button
              className={css.button}
              onClick={() => sound.fade(0.3, 0.9, 1)}
            >
              Fade 0.3 - 0.9
            </button>
            <button
              className={css.button}
              onClick={() => sound.fade(0.9, 0.3, 1)}
            >
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
            <label>PANNER</label>
            <input
              type="range"
              name="panner"
              min="-1"
              max="1"
              defaultValue="0"
              step="0.01"
              onChange={(e) => sound.pan(parseFloat(e.target.value))}
            ></input>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Player;
