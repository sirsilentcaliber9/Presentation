import { useEffect, useRef, useState } from 'react';
import workshopImage from '../assets/sumerian-workshop.jpg';
import pazuzuImage from '../assets/pazuzu.png';
import pazuzuVideo from '../assets/pazuzu.mp4';
import babylonImage from '../assets/babylonian-gate.jpg';
import utukkuImage from '../assets/utukku-shadow.jpg';
import palmyreImage from '../assets/palmyre-city.jpg';
import ginnayeVideo from '../assets/ginnaye-clip.mp4';
import jinnVideo from '../assets/jinn-clip.mp4';
import arabiansVideo from '../assets/arabians-clip.mp4';
import preIslamVideo from '../assets/pre-islam-clip.mp4';
import cemeteriesVideo from '../assets/cemeteries-clip.mp4';
import invisibleVideo from '../assets/invisible-loop.mp4';
import animalImage from '../assets/animal-form.jpg';
import { ProjectionMedia, useProjectionState } from '@/lib/projection-state';

const projectionMedia: Record<ProjectionMedia, { image: string; alt: string; video?: string; overlayImage?: string }> = {
  workshop: { image: workshopImage, alt: 'Artisans au travail dans un atelier sumérien' },
  pazuzu: { image: pazuzuImage, alt: 'Illustration de Pazuzu' },
  clip: { image: pazuzuImage, alt: 'Illustration de Pazuzu', video: pazuzuVideo },
  babylon: { image: babylonImage, alt: 'Porte de Babylone' },
  utukku: { image: babylonImage, alt: 'Porte de Babylone', overlayImage: utukkuImage },
  palmyre: { image: palmyreImage, alt: 'Vue ancienne de Palmyre' },
  ginnaye: { image: palmyreImage, alt: 'Vue ancienne de Palmyre', video: ginnayeVideo },
  jinn: { image: palmyreImage, alt: 'Vue ancienne de Palmyre', video: jinnVideo },
  arabians: { image: palmyreImage, alt: 'Vue ancienne de Palmyre', video: arabiansVideo },
  preIslam: { image: palmyreImage, alt: 'Vue ancienne de Palmyre', video: preIslamVideo },
  cemeteries: { image: palmyreImage, alt: 'Vue ancienne de Palmyre', video: cemeteriesVideo },
  invisible: { image: palmyreImage, alt: 'Vue ancienne de Palmyre', video: invisibleVideo },
  animal: { image: animalImage, alt: 'Créature sous une apparence animale' },
};

export default function Projection() {
  const { state } = useProjectionState();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playbackBlocked, setPlaybackBlocked] = useState(false);
  const media = projectionMedia[state.media];
  const isZooming = ['pazuzu', 'babylon', 'utukku', 'palmyre', 'animal'].includes(state.media);

  useEffect(() => {
    const video = videoRef.current;
    if (!media.video || !video) {
      setPlaybackBlocked(false);
      return;
    }
    if (!state.clipPlaying) {
      video.pause();
      return;
    }
    if (video.ended) video.currentTime = 0;
    void video.play()
      .then(() => setPlaybackBlocked(false))
      .catch(() => setPlaybackBlocked(true));
  }, [state.clipPlaying, state.media, state.resetToken, media.video]);

  const retryPlayback = () => {
    const video = videoRef.current;
    if (video) {
      void video.play()
        .then(() => setPlaybackBlocked(false))
        .catch(() => setPlaybackBlocked(true));
    }
  };

  return (
    <main className="projection-screen" data-testid="screen-public-projection" data-media={state.media}>
      <div
        key={`${state.resetToken}-${state.media}`}
        className={`projection-art ${isZooming ? 'is-zooming' : ''} zoom-${state.media}`}
        data-testid="image-projection-art"
      >
        <img src={media.image} alt={media.alt} data-testid="image-current-projection" />
      </div>
      {media.overlayImage && (
        <div className="projection-utukku-layer" data-testid="projection-utukku-overlay">
          <img src={media.overlayImage} alt="" />
        </div>
      )}
      {media.video && (
        <div className={`projection-video-layer ${state.media === 'clip' ? 'is-pazuzu-clip' : ''}`} data-testid="projection-video-layer">
          <video
            key={`${state.resetToken}-${state.media}`}
            ref={videoRef}
            className="projection-video"
            src={media.video}
            autoPlay={state.clipPlaying}
            muted={state.media !== 'clip'}
            loop={state.media === 'invisible'}
            playsInline
            preload="auto"
            aria-label={`Clip vidéo : ${state.media}`}
            data-testid="projection-video"
          />
        </div>
      )}
      {state.overlayText && (
        <div key={`${state.resetToken}-${state.overlayText}`} className={`projection-word ${state.overlayText === 'UTUKKU' ? 'projection-word-utukku' : ''}`} data-testid="projection-text-overlay">
          <span>{state.overlayText}</span>
          {state.showArrow && <span className="projection-word-arrow" aria-hidden="true">→</span>}
          {state.targetText && <span className="projection-word-target">{state.targetText}</span>}
        </div>
      )}
      {playbackBlocked && (
        <div className="projection-playback-status" role="status" data-testid="status-playback-blocked">
          <span>Lecture automatique bloquée par le navigateur.</span>
          <button type="button" onClick={retryPlayback} data-testid="button-retry-playback">
            Lancer le clip
          </button>
        </div>
      )}
    </main>
  );
}
