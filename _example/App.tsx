import React, { useEffect, useState } from "react"
import css from "./App.module.less"
import { AudioManager } from "../src/AudioManager"
import Player from "./Player"

import drumHitRim from "./assets/drum_hit_rim.mp3"
import drumSnakeRoll from "./assets/drum_snake_roll.mp3"
import harpAscend from "./assets/harp_ascend.mp3"
import heartbeat from "./assets/heartbeat.wav"
import applause from "./assets/applause.wav"

const App = () => {
  return (
    <div className={css.root}>
      <Player audiFileUrl={applause} />
      <Player audiFileUrl={heartbeat} />
      <Player audiFileUrl={drumSnakeRoll} />
    </div>
  )
}

export default App
