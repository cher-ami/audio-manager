import React from "react"
import css from "./Player.module.less"

const Player = ({ audioFileObj }) => {
  return (
    <div className={css.root}>
      <div className={css.container}>
        <div className={css.wrapper}>
          <h2 className={css.name}>{audioFileObj.name}</h2>
          <div className={css.buttons}>
            <button
              className={css.button}
              onClick={() =>
                audioFileObj.instance
                  .play()
                  .then(() => console.log("end"))
              }
            >
              Play
            </button>
            <button
              className={css.button}
              onClick={() => audioFileObj.instance.pause()}
            >
              Pause
            </button>
            <button
              className={css.button}
              onClick={() => audioFileObj.instance.stop()}
            >
              Stop
            </button>
            <button
              className={css.button}
              onClick={() => audioFileObj.instance.replay()}
            >
              Replay
            </button>
            <button
              className={css.button}
              onClick={() => audioFileObj.instance.fadeIn()}
            >
              FadeIn
            </button>
            <button
              className={css.button}
              onClick={() => audioFileObj.instance.fadeOut()}
            >
              FadeOut
            </button>
            <button
              className={css.button}
              onClick={() => audioFileObj.instance.fade(0.3, 0.9, 1000)}
            >
              Fade 0.3 - 0.9
            </button>
            <button
              className={css.button}
              onClick={() => audioFileObj.instance.fade(0.9, 0.3, 1000)}
            >
              Fade 0.9 - 0.3
            </button>
            <button
              className={css.button}
              onClick={() => audioFileObj.instance.mute()}
            >
              Mute
            </button>
            <button
              className={css.button}
              onClick={() => audioFileObj.instance.unmute()}
            >
              UnMute
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Player
