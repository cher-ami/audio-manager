# Audio manager

A simple web audio manager for the browser.

## Depedencies

- [@wbe/debug](https://www.npmjs.com/package/@wbe/debug)
- [@wbe/deferred-promise](https://www.npmjs.com/package/@wbe/)
- [@solid-js/signal](https://www.npmjs.com/package/@solid-js/signal)
- [gsap](https://greensock.com/gsap/)

## Installation

```shell
npm install @cher-ami/audio-manager
```

## Usage

Create new AudioManager instance:

```js
import { AudioManager } from "@cher-ami/audio-manager"

const sound = new AudioManager("sound.mp3")

sound.play()
sound.pause()
sound.stop()
sound.replay()
sound.mute()
sound.unmute()
sound.enableLoop()
sound.disableLoop()
sound.pan()
sound.fade()
sound.fadeIn()
sound.fadeOut()
sound.destroy()
```

Multiples instances can be created together:

```js
import { AudioManager } from "@cher-ami/audio-manager"

const sound1 = new AudioManager("sound.mp3")
const sound2 = new AudioManager("sound.mp3")

sound1.play()
sound2.play()
// ...
```

## API

### AudioManager

```ts
AudioManager(audioFileUrl: string, options: {
    volume?: number;
    loop?: boolean;
})
```

### play

`play():Promise<void>`

Play the sound.

```js
// await sound is loaded before playing it and continue
await sound.play()
```

### pause

`pause(): void`

Pause the sound.

```js
sound.pause()
```

### stop

`stop(): void`

Stop the sound. It will be reset to the beginning.

```js
sound.stop()
```

### replay

`replay(): void`

Will simply stop and play the sound.

```js
sound.replay()
```

### mute

`mute(): void`

Mute the sound.

```js
sound.mute()
```

### unmute

`unmute(): void`

Unmute the sound if he is muted.

```js
sound.unmute()
```

### enableLoop

`enableLoop(): void`

During the sound is playing, enable looping on it.

```js
sound.enableLoop()
```

### disableLoop

`disableLoop(): void`

During the sound is playing, disable looping on it.

```js
sound.disableLoop()
```

### pan

`pan(vPan: number): void`

Used to place the sound on a device supporting stereo sound.
If using -1 to 1 range. -1 would be far left & 1 far right.

```js
sound.pan(-1) // left
sound.pan(0) // center
sound.pan(1) // right
```

### fade

`fade(from: number, to: number, duration = 1, ease = "none"): Promise<any>`

Process fade between 2 points:

- `from` 1 = 100%, 0 = 0%
- `to` 1 = 100%, 0 = 0%
- `duration`: default is `1`
- `ease`: default is `none`, this is gsap easing string.

```js
// fade from 0% to 60% of the volume
this.fade(0, 0.6)

// also you can wait for the fade to finish
await this.fade(0, 0.6)
// ... do sothing after fade
```

### fadeIn

`fadeIn(duration = 1, ease = "none"): Promise<any>`

FadeIn from the current volum to 100%.

```js
this.fadeIn()
// or
await this.fadeIn()
```

### fadeOut

`fadeOut(duration = 1, ease = "none"): Promise<any>`

FadeOut from the current volum to 0%.

```js
this.fadeOut()
// or
await this.fadeOut()
```

### destroy

`destroy(): void`

Destroy current instance

```js
this.destroy()
```

## Golbal mute

It's possible to mute all the paying sounds with global event emitter.

```js
import { MUTE_AUDIO_SIGNAL } from "@cher-ami/audio-manager"

// mute all sounds
MUTE_AUDIO_SIGNAL.dispatch(true)

// unmute all sounds
MUTE_AUDIO_SIGNAL.dispatch(false)
```

## Credits

cher-ami
