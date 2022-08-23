import { AudioManager, MUTE_AUDIO_SIGNAL, IAudioManagerOptions } from "./AudioManager"
import { useEffect, useMemo, useState } from "react"
import debug from "@wbe/debug"
const log = debug(`AudioManager:hooks`)

/**
 * Return audio API instance for one audio file
 */

const CACHE = {}
export const useAudio = (
  audiFileUrl: string,
  options?: IAudioManagerOptions,
  dep: any[] = []
): AudioManager => {
  const keyName = useMemo(() => {
    return [
      options?.id ? `__${options.id}__` : null,
      audiFileUrl.split("/")[audiFileUrl.split("/").length - 1].replaceAll(" ", "/"),
    ]
      .filter((e) => e)
      .join("")
  }, [audiFileUrl, options])

  const [instance] = useState<AudioManager>(
    () => CACHE?.[keyName] ?? new AudioManager(audiFileUrl, options)
  )

  useEffect(() => {
    if (!CACHE[keyName]) {
      CACHE[keyName] = instance
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
    return MUTE_AUDIO_SIGNAL.add(handler) as any
  }, [])

  const setIsMutedState = (state: boolean) => {
    MUTE_AUDIO_SIGNAL.dispatch(state)
  }

  return [isMuted, setIsMutedState]
}
