'use client';

import { useEffect, useRef, type ComponentPropsWithoutRef } from 'react';

type BaseVideoProps = Omit<ComponentPropsWithoutRef<'video'>, 'src'>;

type HlsVideoProps = BaseVideoProps & {
  src: string;                         // .m3u8
  fit?: 'cover' | 'contain';           // ebeveyn içinde yerleşim
  onLoadStart?: () => void;
  onCanPlay?: () => void;
  onError?: (err: unknown) => void;
};

function supportsNativeHls(video: HTMLVideoElement) {
  const t = video.canPlayType('application/vnd.apple.mpegurl');
  return t === 'probably' || t === 'maybe';
}

export function HlsVideo({
  src,
  fit = 'cover',
  onLoadStart,
  onCanPlay,
  onError,
  poster,
  muted = true,
  autoPlay = true,
  playsInline = true,
  loop,
  ...videoProps
}: HlsVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let destroyed = false;

    const cleanup = () => {
      try { hlsRef.current?.destroy?.(); } catch {}
      hlsRef.current = null;
    };

    const setupNative = () => {
      onLoadStart?.();
      video.src = src;
      const canplay = () => { if (!destroyed) onCanPlay?.(); };
      const error = () => { if (!destroyed) onError?.(new Error('Native video error')); };
      video.addEventListener('canplay', canplay);
      video.addEventListener('error', error);
      video.load();
      return () => {
        video.removeEventListener('canplay', canplay);
        video.removeEventListener('error', error);
      };
    };

    const run = async () => {
      const removeNative = supportsNativeHls(video) ? setupNative() : undefined;
      if (removeNative) return () => { removeNative(); cleanup(); };

      try {
        const Hls = (await import('hls.js')).default;
        if (!Hls.isSupported()) {
          onError?.(new Error('HLS.js not supported'));
          return cleanup;
        }
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hlsRef.current = hls;
        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(src));
        hls.on(Hls.Events.MANIFEST_PARSED, () => { if (!destroyed) onCanPlay?.(); });
        hls.on(Hls.Events.ERROR, (_e: any, data: any) => {
          if (!destroyed) {
            if (data?.fatal) {
              onError?.(new Error(`HLS fatal: ${data?.details ?? 'unknown'}`));
              try { hls.destroy(); } catch {}
              hlsRef.current = null;
            } else {
              onError?.(data);
            }
          }
        });
      } catch (err) {
        onError?.(err);
      }
      return cleanup;
    };

    let disposer: (() => void) | undefined;
    run().then((d) => { disposer = d; });

    return () => { destroyed = true; disposer?.(); cleanup(); };
  }, [src, onLoadStart, onCanPlay, onError]);

  // Not: ebeveyn elementin bir boyutu olmalı (width/height); bu component o alanı %100 doldurur.
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <video
        ref={videoRef}
        // Video ebeveyni tamamen doldurur:
        style={{
          position: 'absolute',
          inset: 0,
          width: 'auto',
          height: 'auto',
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: fit, // 'cover' veya 'contain'
        }}
        poster={poster}
        muted={muted}
        autoPlay={autoPlay}
        playsInline={playsInline}
        loop={loop}
        {...videoProps}
      />
    </div>
  );
}
