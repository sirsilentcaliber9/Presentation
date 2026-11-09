import { useEffect, useRef, useState } from 'react';
import { ExternalLink, LockKeyhole, X, ArrowLeft, ArrowRight } from 'lucide-react';
import { ProjectionScene } from '@/components/projection-scene';
import { projectionAssetUrls, presentationMedia } from '@/lib/presentation-media';
import { ProjectionMedia, type FloatingTermId, useProjectionState } from '@/lib/projection-state';

type ScriptPage = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

type AssetPreloadState = {
  status: 'loading' | 'ready' | 'failed';
  loaded: number;
  completed: number;
  total: number;
  failures: string[];
};

async function preloadAsset(url: string) {
  const response = await fetch(url, { cache: 'force-cache', credentials: 'same-origin' });
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  const data = await response.arrayBuffer();
  if (data.byteLength === 0) throw new Error('Empty asset');

  const pathname = new URL(url, window.location.href).pathname;
  if (/\.(?:png|jpe?g)$/i.test(pathname)) {
    const type = response.headers.get('content-type') || 'image/jpeg';
    const objectUrl = URL.createObjectURL(new Blob([data], { type }));
    try {
      const image = new Image();
      image.src = objectUrl;
      await image.decode();
    } finally {
      URL.revokeObjectURL(objectUrl);
    }
    return;
  }

  if (/\.(?:mp4|webm)$/i.test(pathname)) {
    const objectUrl = URL.createObjectURL(new Blob([data], { type: 'video/mp4' }));
    const video = document.createElement('video');
    video.preload = 'auto';
    video.muted = true;
    video.playsInline = true;
    try {
      await new Promise<void>((resolve, reject) => {
        video.addEventListener('loadeddata', () => resolve(), { once: true });
        video.addEventListener('error', () => reject(new Error(`Unable to decode ${url}`)), { once: true });
        video.src = objectUrl;
        video.load();
      });
    } finally {
      video.pause();
      video.removeAttribute('src');
      video.load();
      URL.revokeObjectURL(objectUrl);
    }
  }
}

type HotspotProps = {
  media: ProjectionMedia;
  testId: string;
  children: string;
  ariaLabel?: string;
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
  ariaLabel,
  overlayText,
  showArrow,
  targetText,
  onSelectOverlay,
  onSelect,
}: HotspotProps) {
  const percentMatch = children.match(/^(.*\s)?(\d+\s*%)(\s*[^\p{L}\p{M}\p{N}%]*)$/u);
  const lastWordMatch = percentMatch ?? children.match(/^(.*\s)?([\p{L}\p{N}][\p{L}\p{M}\p{N}%’'\-]*)(\s*[^\p{L}\p{M}\p{N}%’'\-]*)$/u);
  const prefix = lastWordMatch?.[1] ?? '';
  const triggerWord = lastWordMatch?.[2] ?? children;
  const suffix = lastWordMatch?.[3] ?? '';
  const select = () => {
    if (onSelectOverlay) {
      onSelectOverlay(overlayText ?? null, showArrow ?? false, targetText ?? null);
      return;
    }
    onSelect(media, overlayText ?? null, showArrow ?? false, targetText ?? null);
  };
  return (
    <>
      {prefix}
      <button
        type="button"
        className="script-hotspot"
        data-testid={testId}
        aria-label={ariaLabel ?? `Afficher ${presentationMedia[media].label} sur la projection`}
        onMouseEnter={select}
        onFocus={select}
        onClick={select}
      >
        {triggerWord}
      </button>
      {suffix}
    </>
  );
}

export default function Presenter() {
  const { state, publish, setMedia, setOverlay, addFloatingTerm } = useProjectionState();
  const projectionWindow = useRef<Window | null>(null);
  const [windowOpen, setWindowOpen] = useState(false);
  const [popupBlocked, setPopupBlocked] = useState(false);
  const [scriptPage, setScriptPage] = useState<ScriptPage>(1);
  const [preloadAttempt, setPreloadAttempt] = useState(0);
  const [assetPreload, setAssetPreload] = useState<AssetPreloadState>({
    status: 'loading',
    loaded: 0,
    completed: 0,
    total: projectionAssetUrls.length,
    failures: [],
  });
  const currentMedia = presentationMedia[state.media];

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
      total: projectionAssetUrls.length,
      failures: [],
    });

    const queue = [...projectionAssetUrls];
    const worker = async () => {
      while (queue.length) {
        const url = queue.shift();
        if (!url) continue;
        try {
          await preloadAsset(url);
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
              total: projectionAssetUrls.length,
              failures: [...failures],
            });
          }
        }
      }
    };

    void Promise.all(Array.from({ length: Math.min(4, queue.length) }, () => worker())).then(() => {
      if (!active) return;
      setAssetPreload({
        status: failures.length ? 'failed' : 'ready',
        loaded,
        completed,
        total: projectionAssetUrls.length,
        failures: [...failures],
      });
    });

    return () => {
      active = false;
    };
  }, [preloadAttempt]);

  const changeScriptPage = (page: ScriptPage) => {
    setScriptPage(page);
    if (page === 1) {
      publish();
    } else if (page === 2 || page === 5 || page === 7) {
      setMedia('palmyre');
    } else if (page === 3) {
      setMedia('toiletChapter');
    } else if (page === 4) {
      setMedia('chapter2');
    } else if (page === 6) {
      setMedia('chapter3');
    } else if (page === 8) {
      setMedia('chapter4');
    }
  };
  const goToPreviousPage = () => changeScriptPage(Math.max(1, scriptPage - 1) as ScriptPage);
  const goToNextPage = () => changeScriptPage(Math.min(8, scriptPage + 1) as ScriptPage);

  const projectionUrl = `${import.meta.env.BASE_URL.replace(/\/$/, '')}/projection`;
  const openProjection = () => {
    if (assetPreload.status !== 'ready') return;
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
              <span>Préchargement des images et vidéos · {assetPreload.loaded} / {assetPreload.total}</span>
            )}
            {assetPreload.status === 'ready' && <span>Images et vidéos prêtes · projection immédiate</span>}
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

        <section className="console-grid" aria-label="Console de présentation">
          <article className="preview-panel">
            <div className="panel-label">
              <span>Aperçu de la projection</span>
              <span data-testid="text-preview-media">{currentMedia.label}</span>
            </div>
            <div className="slide-preview">
              <ProjectionScene state={state} mode="preview" />
            </div>
            <div className="preview-caption">
              <span>Visuel public · sans notes d’orateur</span>
              <span>Survolez un mot pour changer le visuel</span>
            </div>
          </article>

          <div className="presenter-column">
            <article className="script-panel">
              <div className="panel-label">
                <span>Texte à dire · page {scriptPage} sur 8</span>
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
              ) : scriptPage === 2 ? (
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
              ) : scriptPage === 3 ? (
                <div className="script-text" data-testid="text-private-script" data-script-page="3">
                  <h2 className="script-chapter-title">Chapter 2</h2>
                  <p>
                    Il vivait dans les toilettes.
                  </p>
                  <p>
                    Réfléchissez-y un instant. Sur quoi se sont-ils basés pour vous affirmer que les djinns vivent dans les toilettes et les endroits sales ? Je veux dire, pourquoi exactement les toilettes, parmi tous les endroits du monde ?
                  </p>
                  <p>
                    Ils avaient une mentalité assez simpliste. Ils se disaient que, puisque ces créatures étaient « mauvaises », alors, logiquement, elles devaient vivre dans des endroits mauvais. C’est exactement comme lorsqu’ils affirment que les <Hotspot media="blackCats" testId="hotspot-black-cats" onSelect={setMedia}>chats noirs</Hotspot> portent malheur. Pourquoi ? Parce qu’ils sont noirs ! Et que les chiens noirs sont des « démons ». Pourquoi ? Parce qu’ils <Hotspot media="blackDogs" testId="hotspot-black-dogs" onSelect={setMedia}>sont noirs !</Hotspot>
                  </p>
                  <p>
                    Et qu’en est-il de l’âne noir ? Si vous en voyez un dans votre sommeil, cela annoncerait une catastrophe imminente ! Et les araignées noires, alors ? Cela signifierait qu’un malheur va bientôt vous arriver ! Et les anges, dans tout ça ? Les anges sont-ils blancs ou noirs ? Puisqu’ils sont blancs, alors c’est forcément quelque chose de bien ! Ces gens expliquaient la vie par la couleur : <Hotspot media="blackAndWhite" testId="hotspot-color" onSelect={setMedia}>noir ou blanc</Hotspot>.
                  </p>
                </div>
              ) : scriptPage === 4 ? (
                <div className="script-text" data-testid="text-private-script" data-script-page="4">
                  <h2 className="script-chapter-title">Chapter 2 : « Invoquer les djinns »</h2>
                  <p>
                    Vous êtes-vous déjà questionné ? Qui a découvert comment invoquer la magie, les djinns, les démons, ou quel que soit le nom donné à cette superstition ?
                  </p>
                  <p>
                    Je veux dire, si vous vouliez apprendre à « invoquer un djinn ou le diable », par exemple… on vous dirait de vous procurer telle chose, de faire ceci, de lire cela, d’écrire tel texte… puis d’utiliser <Hotspot media="invocationSteps" testId="hotspot-invocation-steps" onSelect={setMedia}>les cheveux de telle personne</Hotspot>.
                  </p>
                  <p>
                    Qui est le premier à avoir découvert tout ça ? Et comment a-t-il su que ces étapes, avec ces mots précis et ces lettres exactes, permettraient, si elles étaient correctement exécutées, de faire apparaître un djinn ou un démon ?
                  </p>
                  <p>
                    J’aimerais aussi comprendre quelque chose. Quel djinn, exactement, va vous aider ? Je veux dire, lequel va exaucer vos souhaits ?
                  </p>
                </div>
              ) : scriptPage === 5 ? (
                <div className="script-text" data-testid="text-private-script" data-script-page="5">
                  <p>
                    Imaginons qu’il existe un million de djinns. Est-ce qu’ils font la queue pour aider les gens, chacun leur tour ? Ou est-ce une question de chance pour eux ? Est-ce que le djinn sait à l’avance qu’on va l’invoquer et qu’il devra se mettre au travail ? Ou bien est-il tranquillement occupé à ses affaires quand, soudain, il apprend que quelqu’un l’appelle ? Alors, il se précipite pour savoir ce qu’on lui veut ?
                  </p>
                  <p>
                    Et pourquoi est-ce toujours un « djinn mâle » qu’on invoque ? Pourquoi n’a-t-on jamais entendu parler de quelqu’un qui invoque un djinn et voit apparaître une djinniya ? Ou bien les djinns sont-ils eux aussi une espèce dominée par les hommes, misogyne et conservatrice ? La femelle doit-elle rester enfermée chez elle parce que son mari djinn le lui ordonne et ne pas sortir ? Et le djinn mâle lui dit qu’elle est un « diamant » qui doit rester à la maison pour élever les enfants ?
                  </p>
                  <p>
                    Et puis, pourquoi ce djinn accepterait-il de <Hotspot media="djinnCall" testId="hotspot-djinn-call" onSelect={setMedia}>se manifester pour vous aider</Hotspot> ?
                  </p>
                  <p>
                    D’accord, je comprends que vous récitiez des passages de votre livre sacré et que vous récupériez ensuite les cheveux de la personne à qui vous voulez faire du mal : <Hotspot media="hairRitual" testId="hotspot-hair-ritual" onSelect={setMedia}>les cheveux de la personne</Hotspot>.
                  </p>
                  <p>
                    Sur quelle base cette créature mythique, surnaturelle et invisible se manifesterait-elle pour vous ? Pourquoi serait-elle obligée de venir à votre rencontre ? Qui êtes-vous, au juste ?
                  </p>
                  <p>
                    Imaginons que vous ayez fait tout ça et, en supposant bien sûr que les djinns existent. Et si le djinn ne se manifestait pas, qu’est-ce que vous feriez ? Vous iriez le chercher vous-même ?
                  </p>
                </div>
              ) : scriptPage === 6 ? (
                <div className="script-text long-script-page" data-testid="text-private-script" data-script-page="6">
                  <h2 className="script-chapter-title">Chapitre 3 : « L’explication scientifique derrière la possession »</h2>
                  <p>
                    Il y a eu une étude menée par un <Hotspot media="chapter3Group" testId="hotspot-chapter3-group" onSelect={setMedia}>groupe</Hotspot> de personnes hospitalisées dans un établissement psychiatrique en Chine, qui croyaient être possédées.
                  </p>
                  <p>
                    Et ces personnes présentaient effectivement des symptômes étranges que beaucoup associent aux phénomènes de possession, comme l’incapacité à contrôler leurs propres <Hotspot media="chapter3Movements" testId="hotspot-chapter3-movements" onSelect={setMedia}>mouvements</Hotspot> ou leur corps, des comportements soudains et inhabituels, et parfois même des changements dans leur propre <Hotspot media="chapter3Voice" testId="hotspot-chapter3-voice" onSelect={setMedia}>voix</Hotspot>.
                  </p>
                  <p>
                    Le scientifique ayant mené cette étude, après avoir rencontré les patients, a diagnostiqué leur état et a conclu qu’ils souffraient d’un trouble mental appelé « <Hotspot media="possessionDiagnosis" testId="hotspot-possession-diagnosis" onSelect={setMedia}>trouble de la possession</Hotspot> », qui fait partie d’une catégorie de <Hotspot media="chapter3Diagnosis" testId="hotspot-chapter3-diagnosis" onSelect={setMedia}>troubles</Hotspot> appelée « <Hotspot media="dissociativeTrance" testId="hotspot-dissociative-trance" onSelect={setMedia}>trouble dissociatif de transe</Hotspot> ».
                  </p>
                  <p>
                    <Hotspot media="study45" testId="hotspot-possession-45" onSelect={setMedia}>45 %</Hotspot> des participants à l’étude croyaient être possédés par une personne décédée. En Chine, ils appellent cela « <Hotspot media="kweiFu" testId="hotspot-kwei-fu" onSelect={setMedia}>Kwei Fu</Hotspot> », et c’est la forme de possession la plus répandue dans le pays.
                  </p>
                  <p>
                    Tout comme chez nous, nous avons la <Hotspot media="beliefs" ariaLabel="Afficher les croyances liées aux djinns" testId="hotspot-belief-jinns" onSelect={() => addFloatingTerm('jinnPossession')}>possession par les djinns</Hotspot>, le <Hotspot media="beliefs" ariaLabel="Afficher le Mas des djinns" testId="hotspot-belief-mas" onSelect={() => addFloatingTerm('masDjinns')}>Mas des djinns</Hotspot>, les <Hotspot media="beliefs" ariaLabel="Afficher les Lamss" testId="hotspot-belief-lamss" onSelect={() => addFloatingTerm('lamss')}>Lamss</Hotspot>, la <Hotspot media="beliefs" ariaLabel="Afficher la magie noire" testId="hotspot-belief-magic" onSelect={() => addFloatingTerm('blackMagic')}>magie noire</Hotspot>, les <Hotspot media="beliefs" ariaLabel="Afficher les pratiques occultes" testId="hotspot-belief-occult" onSelect={() => addFloatingTerm('occultPractices')}>pratiques occultes</Hotspot>…
                  </p>
                  <p>
                    Chaque société classe ses propres superstitions à sa manière. D’autres sociétés font de même et possèdent leurs propres catégories de phénomènes de possession.
                  </p>
                  <p>
                    <Hotspot media="study25" testId="hotspot-possession-25" onSelect={setMedia}>25 %</Hotspot> d’entre eux croyaient être possédés par une divinité, 20 % par un animal et <Hotspot media="study10" testId="hotspot-possession-10" onSelect={setMedia}>10 %</Hotspot> par un démon. Cela signifie-t-il que ces entités les possèdent réellement ?
                  </p>
                  <p>
                    Bien sûr que non. Tous ces individus sont des patients, aussi différents que puissent être leurs symptômes.
                  </p>
                  <p>
                    Car, selon le DSM-5, ou le <Hotspot media="dsmReference" testId="hotspot-dsm-reference" onSelect={setMedia}>Manuel diagnostique et statistique des troubles mentaux</Hotspot>, le trouble de la possession peut tirer certains de ses symptômes des propres croyances du patient.
                  </p>
                  <p>
                    Qu’est-ce que cela signifie ? Cela signifie que, pour comprendre les symptômes d’un patient, il faut connaître son environnement, savoir où il vit, ce en quoi il croit et par quelle entité il pense être possédé.
                  </p>
                  <p>
                    En fonction de ces croyances, certains symptômes vont apparaître chez lui : des symptômes qu’il s’attend lui-même à présenter lorsqu’une personne est supposément <Hotspot media="chapter3Explanation" testId="hotspot-chapter3-explanation" onSelect={setMedia}>possédée</Hotspot>.
                  </p>
                  <p>
                    Et c’est pour cette raison que les chrétiens souffrant de ce trouble deviennent extrêmement furieux lorsqu’on place une croix devant <Hotspot media="crossReaction" testId="hotspot-cross-reaction" onSelect={setMedia}>eux</Hotspot>. Parce qu’ils croient être possédés par un démon et sont profondément convaincus que les démons craignent la croix.
                  </p>
                  <p>
                    De même, les musulmans souffrant de ce trouble peuvent entrer dans une grande colère lorsqu’on récite le Coran devant <Hotspot media="quranReaction" testId="hotspot-quran-reaction" onSelect={setMedia}>eux</Hotspot>, car ils associent ces réactions aux symptômes de la possession par les <Hotspot media="djinnReaction" testId="hotspot-djinn-reaction" onSelect={setMedia}>djinns</Hotspot>.
                  </p>
                </div>
              ) : scriptPage === 7 ? (
                <div className="script-text long-script-page" data-testid="text-private-script" data-script-page="7">
                  <p>
                    Et cela s’explique notamment par le fait que les croyances d’une personne, ainsi que les mauvaises expériences qu’elle a vécues au cours de sa vie, peuvent contribuer au développement de ce trouble.
                  </p>
                  <p>
                    Ces expériences peuvent être si traumatisantes qu’elles poussent son esprit à se dissocier de la réalité.
                  </p>
                  <p>
                    C’est pourquoi on ne trouve généralement pas d’enfants de 2, 3 ou 4 ans présentant ce type de possession. Vous êtes-vous déjà demandé <Hotspot media="childDevelopmentQuestion" testId="hotspot-child-development-question" onSelect={setMedia}>pourquoi</Hotspot> ?
                  </p>
                  <p>
                    Parce qu’à cet âge précoce, les enfants ne connaissent pas encore ces superstitions. Leurs représentations mentales ne sont pas encore pleinement développées et ils n’ont pas vécu suffisamment de mauvaises expériences pour que leur esprit se dissocie de la réalité de cette manière.
                  </p>
                  <p>
                    Ils peuvent néanmoins souffrir d’un trouble dissociatif de l’identité, mais les symptômes peuvent encore être à leurs premiers stades de développement, comme des pertes de mémoire temporaires, des problèmes de concentration, voire parfois des <Hotspot media="childConvulsions" testId="hotspot-child-convulsions" onSelect={setMedia}>crises convulsives</Hotspot>.
                  </p>
                  <p>
                    Cependant, il est très peu probable de les voir présenter les symptômes de possession que l’on observe chez les personnes plus âgées. Comme le changement de voix ou le fait de parler comme s’ils étaient quelqu’un d’<Hotspot media="chapter3OtherVoice" testId="hotspot-other-person-voice" onSelect={setMedia}>autre</Hotspot>.
                  </p>
                  <p>
                    Et pour vous faire mieux comprendre qu’il s’agit d’un trouble psychologique, prenons un exemple. Imaginons un bouddhiste qui croit être possédé par une divinité maléfique. Supposons que nous lui jetions de l’<Hotspot media="chapter3HolyWater" testId="hotspot-buddhist-holy-water" onSelect={setMedia}>eau bénite</Hotspot>.
                  </p>
                  <p>
                    Pensez-vous qu’il se passerait quelque chose ? Bien sûr que non.
                  </p>
                  <p>
                    En revanche, si nous jetions cette même eau sur un chrétien qui croit être possédé, il pourrait perdre connaissance. Pourquoi ? Parce que son esprit est convaincu que le démon qui, selon lui, le possède, craint l’eau bénite.
                  </p>
                  <p>
                    Prenons maintenant le cas d’un Chinois qui croit être possédé par un esprit. Si nous lui récitions le Coran… Rien ne se passerait.
                  </p>
                  <p>
                    Et si nous prenions une musulmane qui croit être possédée, puis demandions à un acteur étranger de lui réciter le Coran, sans qu’elle sache qu’il s’agit du Coran ?
                  </p>
                  <p>
                    Par exemple, en lui faisant réciter le texte en anglais, sur un ton ordinaire, comme s’il lisait un simple <Hotspot media="chapter3QuranEnglish" testId="hotspot-quran-english" onSelect={setMedia}>livre</Hotspot>. Rien ne se passerait non plus.
                  </p>
                  <p>
                    Car, même s’il s’agit bien du Coran, ce n’est pas le Coran tel qu’il existe dans son esprit.
                  </p>
                  <p>
                    Celui qui est associé à un cheikh vêtu d’une djellaba blanche, récitant les versets à voix haute, avec une <Hotspot media="chapter3SheikhRecitation" testId="hotspot-sheikh-recitation" onSelect={setMedia}>intonation bien particulière</Hotspot>.
                  </p>
                  <p>
                    Tout cela se passe dans l’esprit du patient, et non dans l’objet ou le phénomène extérieur auquel il <Hotspot media="chapter3PatientReaction" testId="hotspot-patient-reaction" onSelect={setMedia}>réagit</Hotspot>.
                  </p>
                  <p>
                    Et c’est pour cette raison que, lorsqu’un psychologue souhaite aider une personne souffrant d’un trouble de la possession, il intervient de deux manières : premièrement, sur le plan médical, à l’aide de médicaments ; deuxièmement, sur le plan psychologique, en cherchant à comprendre ce que le patient croit être à l’origine de sa possession et en tenant compte de ses croyances.
                  </p>
                  <p>
                    Cela leur permet de mieux comprendre sa vie et les situations qu’il a traversées. Ils commencent ensuite à traiter les conflits psychologiques qui ont conduit à son état. Puis, progressivement, ils l’aident à retrouver son rapport avec la réalité.
                  </p>
                  <p>
                    Mais certainement pas en renforçant sa dissociation en lui disant : « Oui, c’est bien ta tante qui te possède. Tu dois aller voir un moine, car lui seul détient la solution. »
                  </p>
                  <p>
                    Ou encore : « Oui, ma sœur, tu as un djinn amoureux à l’intérieur de toi. Tu dois aller voir un cheikh pour qu’il le fasse sortir, car tu es possédée et ce djinn ne te laissera jamais tranquille si tu ne le fais <Hotspot media="chapter3Therapy" testId="hotspot-chapter3-therapy" onSelect={setMedia}>pas</Hotspot>. »
                  </p>
                </div>
              ) : (
                <div className="script-text long-script-page" data-testid="text-private-script" data-script-page="8">
                  <h2 className="script-chapter-title">Chapitre 4 : « L’ignorance des maladies mentales »</h2>
                  <p>
                    Tous les patients ayant participé à cette étude souffraient d’un trouble dissociatif de l’identité.
                  </p>
                  <p>
                    Mais cela ne signifie pas que toutes les personnes qualifiées de « possédées » souffrent nécessairement de ce seul trouble.
                  </p>
                  <p>
                    En effet, il existe de nombreuses maladies qui, lorsqu’elles sont observées par quelqu’un qui n’y a jamais été confronté auparavant, peuvent être confondues avec des phénomènes de possession.
                  </p>
                  <p>
                    Prenons cette vidéo, par exemple, qui montrerait une jeune fille possédée par un <Hotspot media="chapter4PossessedGirl" testId="hotspot-chapter4-possessed-girl" onSelect={setMedia}>démon</Hotspot>.
                  </p>
                  <p>Horrifiante, sans aucune explication rationnelle apparente.</p>
                  <p>
                    Mais en réalité, il ne s’agit pas d’une vidéo montrant une jeune fille possédée. C’est un extrait d’un documentaire scientifique datant de 1967, réalisé par l’Institut de psychiatrie <Hotspot media="chapter4HysteriaDocumentary" testId="hotspot-chapter4-hysteria-documentary" onSelect={setMedia}>La Rochefoucauld</Hotspot>.
                  </p>
                  <p>
                    Cette séquence présente le cas d’une jeune fille souffrant d’un trouble mental appelé « hystérie ». Le documentaire illustre les symptômes des personnes qui en souffrent, notamment :
                  </p>
                  <p>• Des crises convulsives sévères qui les empêchent de contrôler leur corps.</p>
                  <p>• Des hallucinations : elles voient des choses qui n’existent pas et entendent des sons qui ne sont pas réels.</p>
                  <p>• Une incapacité à parler, voire à entendre les personnes qui les entourent pendant ces crises.</p>
                  <p>
                    À votre avis, combien de personnes parmi votre entourage, si on leur montrait cette vidéo sans leur révéler son origine, jureraient qu’il s’agit d’une personne possédée ?
                  </p>
                  <p>
                    Et l’hystérie n’est pas le seul trouble que certains confondent avec la possession. Prenons par exemple l’<Hotspot media="palmyre" overlayText="ÉPILEPSIE" ariaLabel="Afficher le mot épilepsie sur la projection" testId="hotspot-epilepsy-label" onSelect={setMedia}>épilepsie</Hotspot> du <Hotspot media="palmyre" overlayText="LOBE" ariaLabel="Afficher le mot lobe sur la projection" testId="hotspot-lobe-label" onSelect={setMedia}>lobe</Hotspot> <Hotspot media="palmyre" overlayText="TEMPORAL" ariaLabel="Afficher le mot temporal sur la projection" testId="hotspot-temporal-label" onSelect={setMedia}>temporal</Hotspot>.
                  </p>
                  <p>
                    Il s’agit d’une forme d’épilepsie qui survient lorsque le <Hotspot media="chapter4TemporalLobe" testId="hotspot-chapter4-temporal-lobe" onSelect={setMedia}>lobe</Hotspot> temporal du cerveau est endommagé à la suite d’un accident ou d’une maladie.
                  </p>
                  <p>
                    Les personnes qui en souffrent peuvent être victimes de <Hotspot media="chapter4Seizures" testId="hotspot-chapter4-seizures" onSelect={setMedia}>crises</Hotspot> qui immobilisent leur corps, ainsi que de pertes de mémoire liées à certains événements.
                  </p>
                  <p>
                    Cela signifie qu’une personne peut, par exemple, se retrouver dans une rue sans se souvenir de quand ni de comment elle y est <Hotspot media="chapter4MemoryLoss" testId="hotspot-chapter4-memory-loss" onSelect={setMedia}>arrivée</Hotspot>.
                  </p>
                  <p>
                    Ces personnes peuvent également souffrir d’hallucinations : elles <Hotspot media="chapter4Hallucinations" testId="hotspot-chapter4-hallucinations" onSelect={setMedia}>voient</Hotspot> des choses qui n’existent pas et entendent des sons qui ne sont pas réels.
                  </p>
                  <p>
                    Un autre trouble est l’<Hotspot media="chapter4Hierophobia" testId="hotspot-chapter4-hierophobia" onSelect={setMedia}>hiérophobie</Hotspot>.
                  </p>
                  <p>
                    Les personnes qui en souffrent éprouvent une peur intense face à certains éléments sacrés, comme une <Hotspot media="chapter4Church" testId="hotspot-chapter4-church" onSelect={setMedia}>église</Hotspot>, un <Hotspot media="chapter4Priest" testId="hotspot-chapter4-priest" onSelect={setMedia}>prêtre</Hotspot>, un cheikh ou une <Hotspot media="chapter4Cross" testId="hotspot-chapter4-cross" onSelect={setMedia}>croix</Hotspot>.
                  </p>
                  <p>
                    Cette peur peut être si intense qu’elles risquent de s’évanouir simplement à l’idée de se rendre dans un endroit où elles pourraient voir cet élément ou l’entendre.
                  </p>
                  <p>
                    Mais pourquoi ces choses les terrifient-elles autant ? Pour deux raisons : l’une neurologique et l’autre psychologique. Ces peurs sont généralement liées à des traumatismes qu’elles ont vécus, notamment durant leur enfance.
                  </p>
                  <p>
                    Par exemple, une personne peut être terrifiée à la vue d’un prêtre parce qu’elle a vécu, lorsqu’elle était jeune, une expérience traumatisante impliquant un <Hotspot media="chapter4TraumaticPriest" testId="hotspot-chapter4-traumatic-priest" onSelect={setMedia}>prêtre</Hotspot>.
                  </p>
                  <p>
                    Ou encore, imaginons une femme dont le père, lorsqu’elle avait dix ans, la battait pour la forcer à accomplir ses prières à l’heure. Elle pourrait alors développer un trouble qui la ferait paniquer en entendant l’appel à la prière (Adhan) et lui ferait craindre le son du Coran.
                  </p>
                  <p>
                    Et cela, même si elle ne se souvient plus de tous ces événements ou ne comprend pas pourquoi elle réagit de cette <Hotspot media="chapter4AdhanReaction" testId="hotspot-chapter4-adhan-reaction" onSelect={setMedia}>manière</Hotspot>.
                  </p>
                </div>
              )}
              <div className="script-pagination">
                <button className="control-button secondary-control" onClick={goToPreviousPage} disabled={scriptPage === 1} data-testid="button-previous-text">
                  <ArrowLeft size={15} /> Texte précédent
                </button>
                <span data-testid="text-page-number">0{scriptPage} / 08</span>
                <button className="control-button secondary-control" onClick={goToNextPage} disabled={scriptPage === 8} data-testid="button-next-text">
                  Texte suivant <ArrowRight size={15} />
                </button>
              </div>
            </article>
          </div>
        </section>

      </div>
    </main>
  );
}
