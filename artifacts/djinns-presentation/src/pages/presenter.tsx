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
import { ExternalLink, LockKeyhole, RotateCcw, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { ProjectionMedia, useProjectionState } from '@/lib/projection-state';

const mediaDetails: Record<ProjectionMedia, { label: string; image?: string; video?: string }> = {
  workshop: { label: 'Atelier sumérien', image: workshopImage },
  pazuzu: { label: 'Pazuzu', image: pazuzuImage },
  clip: { label: 'Pazuzu · monde souterrain', video: pazuzuVideo },
  babylon: { label: 'Porte de Babylone', image: babylonImage },
  utukku: { label: 'Utukku · porte de Babylone', image: babylonImage },
  palmyre: { label: 'Palmyre', image: palmyreImage },
  ginnaye: { label: 'Ginnayé', video: ginnayeVideo },
  jinn: { label: 'Jinn', video: jinnVideo },
  arabians: { label: 'Arabes et Bédouins', video: arabiansVideo },
  preIslam: { label: 'Avant l’islam', video: preIslamVideo },
  cemeteries: { label: 'Cimetières', video: cemeteriesVideo },
  invisible: { label: 'Créatures invisibles', video: invisibleVideo },
  animal: { label: 'Apparence animale', image: animalImage },
};

const preloadUrls = Array.from(new Set([
  workshopImage,
  pazuzuImage,
  pazuzuVideo,
  babylonImage,
  utukkuImage,
  palmyreImage,
  ginnayeVideo,
  jinnVideo,
  arabiansVideo,
  preIslamVideo,
  cemeteriesVideo,
  invisibleVideo,
  animalImage,
]));

type AssetPreloadState = {
  status: 'loading' | 'ready' | 'failed';
  loaded: number;
  completed: number;
  total: number;
  failures: string[];
};

type HotspotProps = {
  media: ProjectionMedia;
  testId: string;
  children: string;
  overlayText?: string;
  showArrow?: boolean;
  targetText?: string;
  onSelectOverlay?: (overlayText: string | null, showArrow: boolean, targetText: string | null) => void;
  onSelect: (
    media: ProjectionMedia,
    overlayText?: string | null,
    showArrow?: boolean,
    targetText?: string | null,
  ) => void;
};

function Hotspot({
  media,
  testId,
  children,
  overlayText,
  showArrow,
  targetText,
  onSelectOverlay,
  onSelect,
}: HotspotProps) {
  const select = () => {
    if (onSelectOverlay) {
      onSelectOverlay(overlayText ?? null, showArrow ?? false, targetText ?? null);
      return;
    }
    onSelect(media, overlayText ?? null, showArrow ?? false, targetText ?? null);
  };
  return (
    <button
      type="button"
      className="script-hotspot"
      data-testid={testId}
      aria-label={`Afficher ${mediaDetails[media].label} sur la projection`}
      onMouseEnter={select}
      onFocus={select}
      onClick={select}
    >
      {children}
    </button>
  );
}

const isVideoMedia = (media: ProjectionMedia) => Boolean(mediaDetails[media].video);

export default function Presenter() {
  const { state, publish, setMedia, setOverlay, toggleClip } = useProjectionState();
  const projectionWindow = useRef<Window | null>(null);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const [windowOpen, setWindowOpen] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [scriptPage, setScriptPage] = useState<1 | 2>(1);
  const [preloadAttempt, setPreloadAttempt] = useState(0);
  const [assetPreload, setAssetPreload] = useState<AssetPreloadState>({
    status: 'loading',
    loaded: 0,
    completed: 0,
    total: preloadUrls.length,
    failures: [],
  });
  const currentMedia = mediaDetails[state.media];

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (projectionWindow.current?.closed) {
        projectionWindow.current = null;
        setWindowOpen(false);
      }
    }, 900);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    let active = true;
    let loaded = 0;
    let completed = 0;
    const failures: string[] = [];
    setAssetPreload({
      status: 'loading',
      loaded: 0,
      completed: 0,
      total: preloadUrls.length,
      failures: [],
    });

    const requests = preloadUrls.map(async (url) => {
      try {
        const response = await fetch(url, { cache: 'force-cache', credentials: 'same-origin' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.arrayBuffer();
        if (data.byteLength === 0) throw new Error('Empty asset');

        if (/\.(?:png|jpe?g)$/i.test(new URL(url, window.location.href).pathname)) {
          const type = response.headers.get('content-type') || 'image/jpeg';
          const objectUrl = URL.createObjectURL(new Blob([data], { type }));
          try {
            const image = new Image();
            image.src = objectUrl;
            await image.decode();
          } finally {
            URL.revokeObjectURL(objectUrl);
          }
        }
        loaded += 1;
      } catch {
        failures.push(url);
      } finally {
        completed += 1;
        if (active) {
          setAssetPreload({
            status: 'loading',
            loaded,
            completed,
            total: preloadUrls.length,
            failures: [...failures],
          });
        }
      }
    });

    void Promise.all(requests).then(() => {
      if (!active) return;
      setAssetPreload({
        status: failures.length ? 'failed' : 'ready',
        loaded,
        completed,
        total: preloadUrls.length,
        failures: [...failures],
      });
    });

    return () => {
      active = false;
    };
  }, [preloadAttempt]);

  useEffect(() => {
    const video = previewVideoRef.current;
    if (!currentMedia.video || !video) return;
    if (state.clipPlaying) {
      if (video.ended) video.currentTime = 0;
      void video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  }, [currentMedia.video, state.clipPlaying, state.media, state.resetToken]);

  const projectionUrl = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/projection`;
  const openProjection = () => {
    if (assetPreload.status !== 'ready') return;
    publish();
    const opened = window.open(projectionUrl, 'pazuzu-projection', 'popup');
    if (opened) {
      projectionWindow.current = opened;
      setWindowOpen(true);
      setPopupBlocked(false);
      opened.focus();
    } else {
      setPopupBlocked(true);
      setWindowOpen(false);
    }
  };
  const exitProjection = () => {
    if (projectionWindow.current && !projectionWindow.current.closed) projectionWindow.current.close();
    projectionWindow.current = null;
    setWindowOpen(false);
  };

  return (
    <main className="app-shell">
      <div className="console-layout">
        <section className="console-heading">
          {windowOpen ? (
            <button className="launch-button" onClick={exitProjection} data-testid="button-exit-projection">
              <X size={16} strokeWidth={1.8} /> Fermer la projection
            </button>
          ) : (
            <button className="launch-button" onClick={openProjection} disabled={assetPreload.status !== 'ready'} data-testid="button-launch-projection">
              <ExternalLink size={16} strokeWidth={1.8} /> Ouvrir l’écran de projection
            </button>
          )}
          <div
            className={`preload-status is-${assetPreload.status}`}
            role="status"
            aria-live="polite"
            data-testid="status-media-preload"
          >
            {assetPreload.status === 'loading' && (
              <span>Préchargement des visuels · {assetPreload.loaded} / {assetPreload.total}</span>
            )}
            {assetPreload.status === 'ready' && <span>Tous les visuels sont chargés · projection prête</span>}
            {assetPreload.status === 'failed' && (
              <>
                <span>Échec du préchargement ({assetPreload.failures.length} fichier(s)). La projection reste désactivée.</span>
                <button
                  type="button"
                  className="preload-retry"
                  onClick={() => setPreloadAttempt((attempt) => attempt + 1)}
                  data-testid="button-retry-media-preload"
                >
                  Réessayer
                </button>
              </>
            )}
          </div>
        </section>

        {popupBlocked && (
          <div className="popup-warning" role="status" data-testid="status-popup-blocked">
            La fenêtre a été bloquée par le navigateur. Autorisez les fenêtres contextuelles,
            puis réessayez. Aucune note privée n’est envoyée à l’écran public.
          </div>
        )}

        <aside className="single-screen-fallback" data-testid="note-single-screen-fallback">
          <strong>Un seul écran ?</strong> Projetez uniquement la fenêtre publique et gardez
          le texte sur un autre appareil ou sur papier. Ne partagez pas la console privée.
        </aside>

        <section className="console-grid" aria-label="Console de présentation">
          <article className="preview-panel">
            <div className="panel-label">
              <span>Aperçu de la projection</span>
              <span data-testid="text-preview-media">{currentMedia.label}</span>
            </div>
            <div className="slide-preview" data-testid="panel-slide-preview">
              {currentMedia.video ? (
                <video
                  key={`${state.resetToken}-${state.media}`}
                  ref={previewVideoRef}
                  className="presenter-preview-video"
                  src={currentMedia.video}
                  autoPlay={state.clipPlaying}
                  muted
                  loop={state.media === 'invisible'}
                  playsInline
                  aria-label={`Aperçu vidéo : ${currentMedia.label}`}
                  data-testid="video-private-preview"
                />
              ) : (
                <img src={currentMedia.image} alt="" data-testid="image-private-preview" />
              )}
              {state.media === 'utukku' && <img className="preview-utukku-overlay" src={utukkuImage} alt="" />}
              {state.overlayText && (
                <div className={`preview-overlay-label ${state.overlayText === 'UTUKKU' ? 'is-utukku' : ''}`}>
                  <span>{state.overlayText}</span>
                  {state.showArrow && <span className="preview-label-arrow" aria-hidden="true">→</span>}
                  {state.targetText && <span className="preview-label-target">{state.targetText}</span>}
                </div>
              )}
              {state.media === 'workshop' && <div className="preview-title">Aux origines des croyances surnaturelles</div>}
            </div>
            <div className="preview-caption">
              <span>Visuel public · sans notes d’orateur</span>
              <span>Survolez un mot pour changer le visuel</span>
            </div>
          </article>

          <div className="presenter-column">
            <article className="script-panel">
              <div className="panel-label">
                <span>Texte à dire · page {scriptPage} sur 2</span>
                <span className="private-badge"><LockKeyhole size={12} /> Privé</span>
              </div>
              {scriptPage === 1 ? (
                <div className="script-text" data-testid="text-private-script" data-script-page="1">
                  <p>
                    Il y a 3 000 ans de cela, les Sumériens croyaient à une superstition selon laquelle il
                    existait des créatures appelées « <Hotspot media="pazuzu" testId="hotspot-pazuzu" onSelect={setMedia}>Pazuzu</Hotspot> ».
                    Ils pensaient que ces créatures étaient noires, qu’elles avaient un corps humain et une
                    tête de chien, et qu’elles vivaient dans un lieu appelé le <Hotspot media="clip" testId="hotspot-monde" onSelect={setMedia}>monde</Hotspot> souterrain.
                  </p>
                  <p>
                    Le monde souterrain, une autre superstition parmi leurs croyances, que d’autres religions leur ont en quelque sorte piquée…
                  </p>
                  <p>
                    Mais Avant eux, il y avait les <Hotspot media="babylon" testId="hotspot-babyloniens-1" onSelect={setMedia}>Babyloniens</Hotspot>,
                    {' '}qui croyaient en une tout autre superstition : des créatures appelées les « <Hotspot media="utukku" overlayText="UTUKKU" testId="hotspot-utukku" onSelect={setMedia}>Utukku</Hotspot> ».
                    {' '}Les Babyloniens pensaient que ces créatures vivaient dans les cimetières et les endroits insalubres.
                  </p>
                </div>
              ) : (
                <div className="script-text" data-testid="text-private-script" data-script-page="2">
                  <p>
                    À <Hotspot media="palmyre" testId="hotspot-palmyre-1" onSelect={setMedia}>Palmyre</Hotspot>, une ancienne cité, les habitants croyaient en l’existence d’autres créatures, appelées les « <Hotspot media="palmyre" overlayText="GINNAYÉ" testId="hotspot-ginnaye-1" onSelect={setMedia}>Ginnayé</Hotspot> ».
                  </p>
                  <p>
                    Le nom « <Hotspot media="ginnaye" testId="hotspot-ginnaye-2" onSelect={setMedia}>Ginnayé</Hotspot> » serait à l’origine du mot « djinn », qui désignait une créature présente dans la mythologie romaine antique. Les habitants de Palmyre croyaient que ces créatures vivaient dans le désert et qu’elles pouvaient prendre une apparence humaine.
                  </p>
                  <p>
                    Le terme « <Hotspot media="ginnaye" overlayText="GINNAYÉ" testId="hotspot-ginnaye-3" onSelect={setMedia} onSelectOverlay={setOverlay}>Ginnayé</Hotspot> » est <Hotspot media="ginnaye" overlayText="GINNAYÉ" showArrow testId="hotspot-egalement" onSelect={setMedia} onSelectOverlay={setOverlay}>également</Hotspot> rapproché du mot anglais « <Hotspot media="ginnaye" overlayText="GINNAYÉ" showArrow targetText="JINN" testId="hotspot-jinn" onSelect={setMedia} onSelectOverlay={setOverlay}>jinn</Hotspot> », qui désigne des créatures dont les <Hotspot media="arabians" testId="hotspot-arabes" onSelect={setMedia}>Arabes</Hotspot> et les Bédouins de la péninsule Arabique croyaient à l’existence depuis des milliers d’années, <Hotspot media="preIslam" testId="hotspot-bien" onSelect={setMedia}>bien</Hotspot> avant l’apparition de l’islam.
                  </p>
                  <p>
                    À cette époque, les Arabes et les Bédouins croyaient que les djinns vivaient dans les <Hotspot media="cemeteries" testId="hotspot-cimetieres" onSelect={setMedia}>cimetières</Hotspot>, les montagnes et le désert. Ils pensaient également que ces créatures étaient <Hotspot media="invisible" testId="hotspot-invisibles" onSelect={setMedia}>invisibles</Hotspot> et pouvaient prendre une apparence humaine, voire parfois <Hotspot media="animal" testId="hotspot-animale" onSelect={setMedia}>animale</Hotspot>, mais toujours de couleur noire.
                  </p>
                </div>
              )}
              <div className="script-pagination">
                <button className="control-button secondary-control" onClick={() => setScriptPage(1)} disabled={scriptPage === 1} data-testid="button-previous-text">
                  <ArrowLeft size={15} /> Texte précédent
                </button>
                <span data-testid="text-page-number">0{scriptPage} / 02</span>
                <button className="control-button secondary-control" onClick={() => setScriptPage(2)} disabled={scriptPage === 2} data-testid="button-next-text">
                  Texte suivant <ArrowRight size={15} />
                </button>
              </div>
            </article>
          </div>
        </section>

        <section className="controls-panel" aria-label="Commandes de projection">
          <div className="control-position">
            <span className="eyebrow">Visuel actif</span>
            <strong data-testid="text-current-media">{currentMedia.label}</strong>
            <small>Le choix reste affiché jusqu’au prochain mot-repère.</small>
          </div>
          <div className="control-actions">
            {isVideoMedia(state.media) && (
              <button className="control-button secondary-control" onClick={toggleClip} data-testid="button-toggle-clip">
                {state.clipPlaying ? 'Espace · mettre en pause' : 'Espace · reprendre'}
              </button>
            )}
            <button className="control-button secondary-control" onClick={() => { setScriptPage(1); publish(); }} data-testid="button-return-start">
              <RotateCcw size={15} /> Revenir à l’atelier
            </button>
          </div>
          <p className="future-note" data-testid="status-narration">
            La narration reste visible dans cette fenêtre, indépendamment du clip.
          </p>
        </section>

        <footer className="console-footer">
          <span>La fenêtre publique est une surface d’affichage distincte, pas un espace sécurisé.</span>
          <span>Les notes restent uniquement dans cette console.</span>
          <span>Survol, focus ou clic sur un mot-repère : changer le visuel public.</span>
        </footer>
      </div>
    </main>
  );
}
