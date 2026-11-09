import { useEffect, useRef, useState } from 'react';
import type { ProjectionMedia, ProjectionState } from '@/lib/projection-state';
import { floatingBeliefTerms, presentationMedia, type PresentationMedia } from '@/lib/presentation-media';

type ProjectionSceneProps = {
  state: ProjectionState;
  mode: 'preview' | 'screen';
};

const videoEntries = (Object.entries(presentationMedia) as [ProjectionMedia, PresentationMedia][])
  .filter(([, media]) => Boolean(media.video));

export function ProjectionScene({ state, mode }: ProjectionSceneProps) {
  const isPreview = mode === 'preview';
  const media = presentationMedia[state.media];
  const videoRefs = useRef<Partial<Record<ProjectionMedia, HTMLVideoElement>>>({});
  const previousPlayback = useRef<{ media: ProjectionMedia; resetToken: number } | null>(null);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  const [readyVideos, setReadyVideos] = useState<Partial<Record<ProjectionMedia, boolean>>>({});
  const Stage = isPreview ? 'div' : 'main';

  useEffect(() => {
    const activeMedia = presentationMedia[state.media];
    const activeVideo = activeMedia.video ? videoRefs.current[state.media] : undefined;

    for (const [videoMedia] of videoEntries) {
      if (videoMedia !== state.media) videoRefs.current[videoMedia]?.pause();
    }

    setPlaybackBlocked(false);
    if (!activeVideo) {
      previousPlayback.current = null;
      return;
    }
    if (!state.clipPlaying) {
      activeVideo?.pause();
      return;
    }

    const previous = previousPlayback.current;
    if (
      activeVideo.ended ||
      !previous ||
      previous.media !== state.media ||
      previous.resetToken !== state.resetToken
    ) {
      activeVideo.currentTime = 0;
    }
    previousPlayback.current = { media: state.media, resetToken: state.resetToken };
    activeVideo.muted = isPreview || !activeMedia.audible;
    void activeVideo.play()
      .then(() => setPlaybackBlocked(false))
      .catch(() => setPlaybackBlocked(!isPreview));
  }, [isPreview, state.clipPlaying, state.media, state.resetToken]);

  const retryPlayback = () => {
    const video = videoRefs.current[state.media];
    if (video) {
      void video.play()
        .then(() => setPlaybackBlocked(false))
        .catch(() => setPlaybackBlocked(true));
    }
  };

  return (
    <Stage
      className={`projection-stage ${isPreview ? 'projection-stage-preview' : 'projection-screen'} ${media.titleCard ? 'has-title-card' : ''}`}
      data-testid={isPreview ? 'panel-slide-preview' : 'screen-public-projection'}
      data-media={state.media}
    >
      {!media.titleCard && (
        <div
          key={`${state.resetToken}-${state.media}`}
          className="projection-art"
          data-testid="image-projection-art"
        >
          <img src={media.image} alt={media.alt} data-testid={isPreview ? 'image-private-preview' : 'image-current-projection'} />
        </div>
      )}

      {media.overlayImage && (
        <div className="projection-utukku-layer" data-testid="projection-utukku-overlay">
          <img src={media.overlayImage} alt="" />
        </div>
      )}

      <div
        className={`projection-video-layer ${state.media === 'clip' ? 'is-pazuzu-clip' : ''} ${media.fullScreenVideo ? 'is-fullscreen-clip' : ''} ${media.videoFit === 'cover' ? 'is-cover-video' : ''}`}
        aria-hidden={!media.video}
        data-testid={media.video ? 'projection-video-layer' : undefined}
      >
        {videoEntries.map(([videoMedia, videoConfig]) => {
          const active = state.media === videoMedia;
          return (
            <video
              key={videoMedia}
              ref={(node) => {
                if (node) videoRefs.current[videoMedia] = node;
                else delete videoRefs.current[videoMedia];
              }}
              className={`projection-video ${active && readyVideos[videoMedia] ? 'is-active' : 'is-preloaded'}`}
              src={videoConfig.video}
              autoPlay={active && state.clipPlaying}
              muted={isPreview || !active || !videoConfig.audible}
              loop={videoConfig.loop}
              playsInline
              preload="auto"
              aria-label={active ? `Clip vidéo : ${videoConfig.label}` : undefined}
              aria-hidden={!active || !readyVideos[videoMedia]}
              tabIndex={-1}
              data-testid={active ? (isPreview ? 'video-private-preview' : 'projection-video') : undefined}
              onLoadedData={() => {
                setReadyVideos((ready) => ({ ...ready, [videoMedia]: true }));
              }}
            />
          );
        })}
      </div>

      {state.overlayText && (
        <div
          key={`${state.resetToken}-${state.overlayText}`}
          className={`projection-word ${state.overlayText === 'UTUKKU' ? 'projection-word-utukku' : ''}`}
          data-testid="projection-text-overlay"
        >
          <span>{state.overlayText}</span>
          {state.showArrow && <span className="projection-word-arrow" aria-hidden="true">→</span>}
          {state.targetText && <span className="projection-word-target">{state.targetText}</span>}
        </div>
      )}

      {media.openingTitle && (
        <div className="projection-opening-title" data-testid="projection-opening-title">
          {media.openingTitle}
        </div>
      )}

      {media.titleCard && (
        <div
          key={`card-${state.resetToken}`}
          className="projection-chapter-card"
          data-testid="projection-chapter-title"
        >
          {media.titleCard.eyebrow && <span>{media.titleCard.eyebrow}</span>}
          <strong>{media.titleCard.title}</strong>
        </div>
      )}

      {state.media === 'beliefs' && (
        <div className="projection-floating-terms" data-testid="projection-floating-terms">
          {state.floatingTerms.map((term) => {
            const item = floatingBeliefTerms[term];
            return (
              <span
                key={term}
                className={`projection-floating-term term-${term}`}
                style={{ top: item.top, left: item.left, transform: `rotate(${item.rotation})` }}
              >
                {item.label}
              </span>
            );
          })}
        </div>
      )}

      {playbackBlocked && !isPreview && (
        <div className="projection-playback-status" role="status" data-testid="status-playback-blocked">
          <span>Lecture automatique bloquée par le navigateur.</span>
          <button type="button" onClick={retryPlayback} data-testid="button-retry-playback">
            Lancer le clip
          </button>
        </div>
      )}
    </Stage>
  );
}
