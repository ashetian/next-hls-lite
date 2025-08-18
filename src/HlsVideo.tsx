'use client';
import React from 'react';
import type { ErrorData } from 'hls.js';
import { useEffect, useRef, useState, type ComponentPropsWithoutRef } from 'react';

type BaseVideoProps = Omit<ComponentPropsWithoutRef<'video'>, 'src'>;

type HlsVideoProps = BaseVideoProps & {
  src: string;                         // .m3u8
  fit?: 'cover' | 'contain';           // ebeveyn içinde yerleşim
  onLoadStart?: () => void;
  onCanPlay?: () => void;
  onError?: (err: unknown) => void;
  overlayPointerEvents?: 'auto' | 'none';
  overlayZIndex?: number;
  children?: React.ReactNode;
};

function supportsNativeHls(video: HTMLVideoElement) {
  const t = video.canPlayType('application/vnd.apple.mpegurl');
  return t === 'probably' || t === 'maybe';
}

export function HlsVideo({
  children,
  src,
  fit = 'cover',
  onLoadStart,
  onCanPlay,
  onError,
  poster,
  muted,
  autoPlay,
  playsInline,
  overlayPointerEvents = 'none', // default: tıklamayı engelleme
  overlayZIndex = 2,             // video 0, loader 1, overlay 2
  loop,
  ...videoProps
}: HlsVideoProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const hlsRef = useRef<any>(null);
  const [err, setErr] = useState<Error | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // tek noktadan emit
  const emitError = (e: unknown) => {
    const errObj = e instanceof Error ? e : new Error(String(e));
    setErr(errObj);
    onError?.(errObj);
  };
  const emitCanPlay = () => {
    setIsLoaded(true);
    onCanPlay?.();
  };
  const emitLoadStart = () => {
    setIsLoaded(false);
    setErr(null);
    onLoadStart?.();
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let destroyed = false;

    const cleanup = () => {
      try { hlsRef.current?.destroy?.(); } catch {}
      hlsRef.current = null;
    };

    const bindNativeEvents = () => {
      const handleCanPlay = () => { if (!destroyed) emitCanPlay(); };
      const handleError = () => { if (!destroyed) emitError(new Error('Native video error')); };
      video.addEventListener('canplay', handleCanPlay);
      video.addEventListener('error', handleError);
      return () => {
        video.removeEventListener('canplay', handleCanPlay);
        video.removeEventListener('error', handleError);
      };
    };

    const setupNative = () => {
      emitLoadStart();
      video.src = src;
      const unbind = bindNativeEvents();
      video.load();
      return unbind;
    };

    const run = async () => {
      // önce her şeyi resetle
      cleanup();
      emitLoadStart();

      if (supportsNativeHls(video)) {
        return setupNative();
      }

      try {
        const Hls = (await import('hls.js')).default;
        if (!Hls.isSupported()) {
          emitError(new Error('HLS.js not supported'));
          return () => {};
        }

        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hlsRef.current = hls;

        const unbind = bindNativeEvents();
        hls.attachMedia(video);
        hls.on(Hls.Events.MEDIA_ATTACHED, () => hls.loadSource(src));
        hls.on(Hls.Events.ERROR, (_evt, data: ErrorData) => {
          if (destroyed) return;
          if (data?.fatal) {
            emitError(new Error(`HLS fatal: ${data?.details ?? 'unknown'}`));
            try { hls.destroy(); } catch {}
            hlsRef.current = null;
          } else {
            onError?.(data);
          }
        });

        return () => {
          unbind();
          try { hls.destroy(); } catch {}
          hlsRef.current = null;
        };
      } catch (e) {
        emitError(e);
        return () => {};
      }
    };

    let dispose: (() => void) | undefined;
    run().then((d) => { dispose = d; });

    return () => { destroyed = true; dispose?.(); cleanup(); };
  }, [src]); // callback’leri her render’da yeniden oluşturur

  // ÖNEMLİ: Parent bir boyut vermeli (width/height veya aspect-ratio).
  // Bu komponent o alanı %100 doldurur ve fit'e göre davranır.
  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      {/* loader: yalnızca yüklenirken */}
      {!isLoaded && !err && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'rgba(0,0,0,0.15)',
            zIndex: 1,
            pointerEvents: 'none',
          }}
          aria-hidden
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: '50%',
              border: '2px solid rgba(255,255,255,0.7)',
              borderTopColor: 'transparent',
              animation: 'spin 0.8s linear infinite',
            }}
          />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {/* error: poster varsa onu göster, yoksa video bırak (kontroller görünür kalsın) */}
      {err && poster ? (
        <img
          src={poster}
          alt="Video fallback"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            pointerEvents: 'none',
          }}
        />
      ) : null}
      <div className='relative flex items-center justify-center'>
        <video
          ref={videoRef}
          poster={poster}
          muted={muted}
          autoPlay={autoPlay}
          playsInline={playsInline}
          loop={loop}
          // Parent’ı doldur + fit davranışı
          style={{
            inset: 0,
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto',
            objectFit: fit, // 'cover' veya 'contain'
          }}
          {...videoProps}
        />
        {/* overlay: children */}
        {children && (
          <div
            style={{
              position: 'absolute',
              inset: 0,
              maxWidth: '100%',
              maxHeight: '100%',
              zIndex: overlayZIndex,
              pointerEvents: overlayPointerEvents, // 'none' -> alttaki controls tıklanır
            }}
          >
            {children}
          </div>
        )}
      </div>
    </div>
  );
}
