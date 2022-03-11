import React, { useEffect, useState } from "react"
import css from "./App.module.less"
import Player from "./Player"

import drumHitRim from "./assets/drum_hit_rim.mp3"
import drumSnakeRoll from "./assets/drum_snake_roll.mp3"
import harpAscend from "./assets/harp_ascend.mp3"
import heartbeat from "./assets/heartbeat.wav"
import applause from "./assets/applause.wav"

import { useMuteAllAudio } from "../src/hooks"

const App = () => {

  const [isMuted, setIsMuted] = useMuteAllAudio()

  return (
    <div className={css.root}>
      <Player audiFileUrl={applause} />
      <Player audiFileUrl={heartbeat} />
      <Player audiFileUrl={drumSnakeRoll} />

      <button onClick={() => setIsMuted(true)}>Mute All</button>
      <button onClick={() => setIsMuted(false)}>Unmute All</button>
    </div>
  )
}

export default App
