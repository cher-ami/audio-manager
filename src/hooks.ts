import { AudioManager } from "./AudioManager"
import { useEffect, useState } from "react"

export const useAudio = (
  audiFileUrl: string,
  options?,
  dep: any[] = []
): AudioManager => {
  const [instance, setInstance] = useState<AudioManager>(null)
  useEffect(() => {
    const i = new AudioManager(audiFileUrl, options)
    setInstance(i)
    return () => {
      i.destroy()
    }
  }, dep)

  return instance
}

// TODO add mute All
