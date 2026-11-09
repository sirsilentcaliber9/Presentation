import workshopImage from '../assets/sumerian-workshop.jpg';
import pazuzuImage from '../assets/pazuzu.png';
import pazuzuVideo from '../assets/pazuzu.mp4';
import babylonImage from '../assets/babylonian-gate.jpg';
import palmyreImage from '../assets/palmyre-city.jpg';
import ginnayeVideo from '../assets/ginnaye-clip.mp4';
import jinnVideo from '../assets/jinn-clip.mp4';
import arabiansVideo from '../assets/arabians-clip.mp4';
import preIslamVideo from '../assets/pre-islam-clip.mp4';
import cemeteriesVideo from '../assets/cemeteries-clip.mp4';
import invisibleVideo from '../assets/invisible-loop.mp4';
import animalImage from '../assets/animal-form.jpg';
import utukkuPhoto from '../assets/utukku-photo.jpg';
import blackCatsVideo from '../assets/chapter1-black-cats.mp4';
import blackDogsVideo from '../assets/chapter1-black-dogs.mp4';
import blackAndWhiteVideo from '../assets/chapter1-black-and-white.mp4';
import invocationStepsVideo from '../assets/chapter2-invocation-steps.mp4';
import djinnCallVideo from '../assets/chapter2-djinn-call.mp4';
import hairRitualVideo from '../assets/chapter2-hair-ritual.mp4';
import groupVideo from '../assets/chapter3-group.mp4';
import movementsVideo from '../assets/chapter3-movements.mp4';
import voiceVideo from '../assets/chapter3-voice.mp4';
import diagnosisVideo from '../assets/chapter3-diagnosis.mp4';
import possession45Image from '../assets/chapter3-possession-45.jpg';
import possession25Image from '../assets/chapter3-possession-25.jpg';
import possession10Image from '../assets/chapter3-possession-10.jpg';
import dsmVideo from '../assets/chapter3-dsm-reference.mp4';
import explanationVideo from '../assets/chapter3-explanation.mp4';
import crossVideo from '../assets/chapter3-cross-reaction.mp4';
import quranVideo from '../assets/chapter3-quran-reaction.mp4';
import shiaVideo from '../assets/chapter3-shia-reaction.mp4';
import djinnVideo from '../assets/chapter3-djinn-reaction.mp4';
import type { ProjectionMedia } from './projection-state';

export type MediaCard = {
  eyebrow?: string;
  title: string;
};

export type PresentationMedia = {
  label: string;
  alt: string;
  image: string;
  video?: string;
  audible?: boolean;
  loop?: boolean;
  fullScreenVideo?: boolean;
  overlayImage?: string;
  titleCard?: MediaCard;
  openingTitle?: string;
};

const scenery = palmyreImage;

export const presentationMedia: Record<ProjectionMedia, PresentationMedia> = {
  workshop: {
    label: 'Atelier sumérien',
    alt: 'Artisans au travail dans un atelier sumérien',
    image: workshopImage,
    openingTitle: 'Aux origines des croyances surnaturelles',
  },
  pazuzu: { label: 'Pazuzu', alt: 'Illustration de Pazuzu', image: pazuzuImage },
  clip: {
    label: 'Pazuzu · monde souterrain',
    alt: 'Clip vidéo : le monde souterrain',
    image: pazuzuImage,
    video: pazuzuVideo,
    audible: true,
  },
  babylon: { label: 'Porte de Babylone', alt: 'Porte de Babylone', image: babylonImage },
  utukku: {
    label: 'Utukku',
    alt: 'Porte de Babylone',
    image: babylonImage,
    overlayImage: utukkuPhoto,
  },
  palmyre: { label: 'Palmyre', alt: 'Vue ancienne de Palmyre', image: palmyreImage },
  ginnaye: { label: 'Ginnayé', alt: 'Clip sur les Ginnayé', image: scenery, video: ginnayeVideo },
  jinn: { label: 'Jinn', alt: 'Clip sur les djinns', image: scenery, video: jinnVideo },
  arabians: { label: 'Arabes et Bédouins', alt: 'Clip sur les Arabes et les Bédouins', image: scenery, video: arabiansVideo },
  preIslam: { label: 'Avant l’islam', alt: 'Clip sur les croyances avant l’islam', image: scenery, video: preIslamVideo },
  cemeteries: { label: 'Cimetières', alt: 'Clip sur les cimetières', image: scenery, video: cemeteriesVideo },
  invisible: {
    label: 'Créatures invisibles',
    alt: 'Clip sur les créatures invisibles',
    image: scenery,
    video: invisibleVideo,
    loop: true,
  },
  animal: { label: 'Apparence animale', alt: 'Créature sous une apparence animale', image: animalImage },
  toiletChapter: {
    label: 'Chapter 2 · Il vivait dans les toilettes',
    alt: 'Titre du chapitre sur les toilettes',
    image: scenery,
    titleCard: { eyebrow: 'Chapter 2', title: 'Il vivait dans les toilettes' },
  },
  chapter2: {
    label: 'Chapter 2 · Invoquer les djinns',
    alt: 'Titre du chapitre sur l’invocation des djinns',
    image: scenery,
    titleCard: { eyebrow: 'Chapter 2', title: 'Invoquer les djinns' },
  },
  chapter3: {
    label: 'Chapitre 3 · L’explication scientifique derrière la possession',
    alt: 'Titre du chapitre sur l’explication scientifique de la possession',
    image: scenery,
    titleCard: { eyebrow: 'Chapitre 3', title: 'L’explication scientifique derrière la possession' },
  },
  blackCats: { label: 'Chats noirs', alt: 'Clip sur les chats noirs', image: scenery, video: blackCatsVideo, audible: true, fullScreenVideo: true },
  blackDogs: { label: 'Chiens noirs', alt: 'Clip sur les chiens noirs', image: scenery, video: blackDogsVideo, audible: true, fullScreenVideo: true },
  blackAndWhite: { label: 'Noir et blanc', alt: 'Clip sur les croyances autour du noir et du blanc', image: scenery, video: blackAndWhiteVideo, audible: true, fullScreenVideo: true },
  invocationSteps: { label: 'Étapes d’invocation', alt: 'Clip sur les étapes d’invocation', image: scenery, video: invocationStepsVideo, audible: true, fullScreenVideo: true },
  djinnCall: { label: 'Invocation du djinn', alt: 'Clip sur l’invocation d’un djinn', image: scenery, video: djinnCallVideo, audible: true, fullScreenVideo: true },
  hairRitual: { label: 'Cheveux et rituel', alt: 'Clip sur le rituel des cheveux', image: scenery, video: hairRitualVideo, audible: true, fullScreenVideo: true },
  possessionDiagnosis: {
    label: 'Trouble de la possession',
    alt: 'Titre animé : trouble de la possession',
    image: scenery,
    titleCard: { title: 'Trouble de la possession' },
  },
  dissociativeTrance: {
    label: 'Trouble dissociatif de transe',
    alt: 'Titre animé : trouble dissociatif de transe',
    image: scenery,
    titleCard: { title: 'Trouble dissociatif de transe' },
  },
  kweiFu: {
    label: 'Kwei Fu',
    alt: 'Titre animé : Kwei Fu',
    image: scenery,
    titleCard: { title: 'Kwei Fu' },
  },
  study45: {
    label: 'Étude · 45 %',
    alt: 'Extrait de l’étude : 45 % des patients rapportaient une possession par une personne décédée',
    image: possession45Image,
  },
  study25: {
    label: 'Étude · 25 %',
    alt: 'Extrait de l’étude : 25 % des patients rapportaient une possession par une divinité',
    image: possession25Image,
  },
  study10: {
    label: 'Étude · 10 %',
    alt: 'Extrait de l’étude : 10 % des patients rapportaient une possession par des esprits',
    image: possession10Image,
  },
  chapter3Group: { label: 'Étude en Chine · groupe', alt: 'Clip sur les personnes de l’étude menée en Chine', image: scenery, video: groupVideo, audible: true, fullScreenVideo: true },
  chapter3Movements: { label: 'Symptômes · mouvements', alt: 'Clip sur le contrôle des mouvements', image: scenery, video: movementsVideo, audible: true, fullScreenVideo: true },
  chapter3Voice: { label: 'Symptômes · voix', alt: 'Clip sur les changements de voix', image: scenery, video: voiceVideo, audible: true, fullScreenVideo: true },
  chapter3Diagnosis: { label: 'Étude · diagnostic', alt: 'Clip sur le diagnostic de l’étude', image: scenery, video: diagnosisVideo, audible: true, fullScreenVideo: true },
  dsmReference: { label: 'Référence · DSM-5', alt: 'Clip sur le manuel diagnostique DSM-5', image: scenery, video: dsmVideo, audible: true, fullScreenVideo: true },
  chapter3Explanation: { label: 'Étude · explication', alt: 'Clip sur les symptômes liés aux croyances du patient', image: scenery, video: explanationVideo, audible: true, fullScreenVideo: true },
  crossReaction: { label: 'Réaction · croix', alt: 'Clip sur la réaction à une croix', image: scenery, video: crossVideo, audible: true, fullScreenVideo: true },
  quranReaction: { label: 'Réaction · Coran', alt: 'Clip sur la réaction à la récitation du Coran', image: scenery, video: quranVideo, audible: true, fullScreenVideo: true },
  shiaReaction: { label: 'Réaction · chiites', alt: 'Clip sur les réactions des patients chiites', image: scenery, video: shiaVideo, audible: true, fullScreenVideo: true },
  djinnReaction: { label: 'Réaction · djinns', alt: 'Clip sur les symptômes associés aux djinns', image: scenery, video: djinnVideo, audible: true, fullScreenVideo: true },
  beliefs: { label: 'Croyances et superstitions', alt: 'Croyances présentées sous différentes formes', image: scenery },
};

export const projectionAssetUrls = Array.from(new Set(
  Object.values(presentationMedia).flatMap(({ image, video, overlayImage }) => (
    [image, video, overlayImage].filter((url): url is string => Boolean(url))
  )),
));

export const floatingBeliefTerms = {
  jinnPossession: { label: 'la possession par les djinns', top: '22%', left: '12%', rotation: '-8deg' },
  masDjinns: { label: 'le Mas des djinns', top: '68%', left: '17%', rotation: '5deg' },
  lamss: { label: 'les Lamss', top: '27%', left: '60%', rotation: '7deg' },
  blackMagic: { label: 'la magie noire', top: '66%', left: '63%', rotation: '-6deg' },
  occultPractices: { label: 'les pratiques occultes', top: '46%', left: '35%', rotation: '3deg' },
} as const;
