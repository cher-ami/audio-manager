import { AudioManager, MUTE_AUDIO_SIGNAL } from "./AudioManager"
import { useEffect, useState } from "react"

/**
 * Return audio API instance for one audio file
 */

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

/**
 * Dispatch an event to mute / unmute all existing instances
 */

export const useMuteAllAudio = (): [boolean, (isMuted: boolean) => void] => {
  const [isMuted, setIsMuted] = useState<boolean>(MUTE_AUDIO_SIGNAL.state)

  useEffect(() => {
    const handler = (state: boolean) => {
      setIsMuted(state)
    }
    return MUTE_AUDIO_SIGNAL.add(handler)
  }, [])

  const setIsMutedState = (state: boolean) => {
    MUTE_AUDIO_SIGNAL.dispatch(state)
  }

  return [isMuted, setIsMutedState]
}
