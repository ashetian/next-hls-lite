# next-hls-lite

A tiny, Next.js-friendly React component that plays HLS streams with graceful fallbacks, mobile autoplay fixes, and zero layout jank.

![npm](https://img.shields.io/npm/v/@ashetian/next-hls-lite)
![npm downloads](https://img.shields.io/npm/dw/@ashetian/next-hls-lite)
![license](https://img.shields.io/npm/l/@ashetian/next-hls-lite)
![bundle size](https://deno.bundlejs.com/badge?q=@ashetian/next-hls-lite@1.1.1)

---

## Why?

Most `hls.js` wrappers don’t play well with **Next.js SSR** and often break on mobile autoplay.
This package solves those pain points:

- ✅ **SSR-friendly** → No window errors in Next.js.
- ✅ **Mobile-ready** → Autoplay + playsInline fixes included.
- ✅ **Layout-safe** → Controlled entirely by the parent container, no jank.

---

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

You can also pass children to the component to render overlays.
This is perfect for Hero components.

```tsx
import { HlsVideo } from '@ashetian/next-hls-lite';

export default function MyPage() {
  return (
    <div className="flex items-center justify-center w-screen h-screen">
      <HlsVideo
        src="https://example.com/video.m3u8"
        poster="https://example.com/poster.jpg"
        autoPlay
        playsInline
        loop
        overlayPointerEvents="none"
        fit="cover"
      >
        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
          <h1 className="text-white text-3xl">
            This is an overlay
          </h1>
        </div>
      </HlsVideo>
    </div>
  );
}
```

## Advanced usage

Error handling & custom overlay:

```tsx
import { HlsVideo } from '@ashetian/next-hls-lite';

return (
  <HlsVideo
    src="https://example.com/video.m3u8"
    poster="/poster.jpg"
    muted
    autoPlay
    playsInline
    loop
    fit="cover"
    onError={(err) => console.error("Video error:", err)}
  >
    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
      <button className="px-4 py-2 bg-white text-black">Play Again</button>
    </div>
  </HlsVideo>
);
```

## Props

| Prop                   | Type                   | Default | Description                     |
| ---------------------- | ---------------------- | ------- | ------------------------------- |
| `src`                  | `string`               | -       | HLS (.m3u8) source              |
| `poster`               | `string`               | -       | Fallback image                  |
| `muted`                | `boolean`              | `true`  | Mute audio                      |
| `autoPlay`             | `boolean`              | `true`  | Autoplay on mobile              |
| `playsInline`          | `boolean`              | `true`  | Plays inline on mobile          |
| `loop`                 | `boolean`              | `true`  | Loop video                      |
| `fit`                  | `'cover' \| 'contain'` | `cover` | Fit mode for parent             |
| `overlayPointerEvents` | `'auto' \| 'none'`     | `auto`  | Control overlay interactions    |
| `overlayZIndex`        | `number`               | `2`     | Overlay z-index                 |
| `onLoadStart`          | `() => void`           | -       | Fired when video starts loading |
| `onCanPlay`            | `() => void`           | -       | Fired when video can play       |
| `onError`              | `(err: Error) => void` | -       | Fired on video error            |
| ...videoProps          | `HTMLVideoElement`     | -       | Other props inherited from video|

## Contributing

PRs and issues are welcome.
If you want to add features or fix bugs, just fork and open a pull request.

## License

MIT© [ashetian](https://github.com/ashetian)
