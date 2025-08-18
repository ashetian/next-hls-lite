# next-hls-lite

A tiny, Next.js-friendly React component that plays HLS streams with graceful fallbacks, mobile autoplay fixes, and zero layout jank.

## Installation

```bash
npm install @ashetian/next-hls-lite
```

## Usage

Component works by covering its parent so make sure you have a parent for video in your layout.
```tsx
import { HlsVideo } from '@ashetian/next-hls-lite';

export default function MyPage() {
  return (
    <div className="w-screen h-screen">
      <HlsVideo
        src="https://example.com/video.m3u8"
        poster="https://example.com/poster.jpg"
        muted
        autoPlay
        playsInline
        loop
        fit="cover"
      />
    </div>
  );
}
```

## Props

| Prop | Type | Default | Description |
| --- | --- | --- | --- |
| `src` | `string` | - | HLS (.m3u8) source |
| `poster` | `string` | - | Fallback image for error state |
| `muted` | `boolean` | `true` | Mute audio |
| `autoPlay` | `boolean` | `true` | Autoplay on mobile |
| `playsInline` | `boolean` | `true` | Plays inline on mobile |
| `loop` | `boolean` | `true` | Loop video |
| `fit` | `'cover' \| 'contain'` | `cover` | Fit mode for parent container |
| `onLoadStart` | `() => void` | - | Called when video starts loading |
| `onCanPlay` | `() => void` | - | Called when video can play |
| `onError` | `(err: Error) => void` | - | Called when video fails to load |

## License

MIT
