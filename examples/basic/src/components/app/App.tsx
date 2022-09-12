import React from "react"
import css from "./App.module.less"
import Player from "../player/Player"
import { useMuteAllAudio } from "../../../../../src"
import AudioService, { EGameAudio } from "../../AudioService"

const App = () => {
  const [isMuted, setIsMuted] = useMuteAllAudio()

  return (
    <div className={css.root}>
      <Player
        audioFileObj={AudioService.getSoundObjByName(EGameAudio.APPLAUSE)}
      />
      <Player
        audioFileObj={AudioService.getSoundObjByName(EGameAudio.DRUM_HIT_RIM)}
      />
      <Player
        audioFileObj={AudioService.getSoundObjByName(
          EGameAudio.DRUM_SNAKE_ROLL
        )}
      />

      <button onClick={() => setIsMuted(true)}>Mute All</button>
      <button onClick={() => setIsMuted(false)}>Unmute All</button>
    </div>
  )
}

export default App
