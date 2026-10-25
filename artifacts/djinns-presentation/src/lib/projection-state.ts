import { useCallback, useEffect, useRef, useState } from 'react';

export const PROJECTION_CHANNEL = 'mesopotamie-projection-v1';
export const PROJECTION_STORAGE_KEY = 'mesopotamie-projection-state-v1';

export type ProjectionMedia =
  | 'workshop' | 'pazuzu' | 'clip' | 'babylon' | 'utukku'
  | 'palmyre' | 'ginnaye' | 'jinn' | 'arabians' | 'preIslam'
  | 'cemeteries' | 'invisible' | 'animal' | 'chapter2'
  | 'blackCats' | 'blackDogs' | 'blackAndWhite'
  | 'invocationSteps' | 'djinnCall' | 'hairRitual';
export type ProjectionState = {
  media: ProjectionMedia;
  clipPlaying: boolean;
  resetToken: number;
  overlayText: string | null;
  showArrow: boolean;
  targetText: string | null;
};

const initialProjectionState: ProjectionState = {
  media: 'workshop',
  clipPlaying: false,
  resetToken: 0,
  overlayText: null,
  showArrow: false,
  targetText: null,
};

const videoMedia: ProjectionMedia[] = [
  'clip', 'ginnaye', 'jinn', 'arabians', 'preIslam', 'cemeteries', 'invisible',
  'blackCats', 'blackDogs', 'blackAndWhite', 'invocationSteps', 'djinnCall', 'hairRitual',
];

function isProjectionMedia(value: unknown): value is ProjectionMedia {
  return typeof value === 'string' && [
    'workshop', 'pazuzu', 'clip', 'babylon', 'utukku', 'palmyre',
    'ginnaye', 'jinn', 'arabians', 'preIslam', 'cemeteries', 'invisible', 'animal',
    'chapter2', 'blackCats', 'blackDogs', 'blackAndWhite',
    'invocationSteps', 'djinnCall', 'hairRitual',
  ].includes(value);
}

function parseProjectionState(value: unknown): ProjectionState | null {
  if (typeof value !== 'object' || value === null) return null;

  const record = value as Record<string, unknown>;
  if (typeof record.resetToken !== 'number' || !Number.isSafeInteger(record.resetToken)) {
    return null;
  }

  const media = record.media;
  if (isProjectionMedia(media) && typeof record.clipPlaying === 'boolean') {
    return {
      media,
      clipPlaying: videoMedia.includes(media) && record.clipPlaying,
      resetToken: record.resetToken,
      overlayText: typeof record.overlayText === 'string' ? record.overlayText : null,
      showArrow: record.showArrow === true,
      targetText: typeof record.targetText === 'string' ? record.targetText : null,
    };
  }

  // Read state written by the previous presentation version.
  if (
    (record.scene === 'opening' || record.scene === 'clip' || record.scene === 'next') &&
    typeof record.clipPlaying === 'boolean'
  ) {
    return {
      ...initialProjectionState,
      media: record.scene === 'clip' ? 'clip' : 'workshop',
      clipPlaying: record.scene === 'clip' && record.clipPlaying,
      resetToken: record.resetToken,
      overlayText: null,
      showArrow: false,
      targetText: null,
    };
  }
  if (record.slideIndex === 0) return { ...initialProjectionState, resetToken: record.resetToken };
  return null;
}

function readSavedState(): ProjectionState {
  try {
    const value = localStorage.getItem(PROJECTION_STORAGE_KEY);
    if (value) {
      const parsed = parseProjectionState(JSON.parse(value) as unknown);
      if (parsed) return parsed;
    }
  } catch {
    // Storage can be unavailable in private browsing; the channel still works.
  }
  return initialProjectionState;
}

export function useProjectionState() {
  const [state, setState] = useState<ProjectionState>(readSavedState);
  const channelRef = useRef<BroadcastChannel | null>(null);

  useEffect(() => {
    let channel: BroadcastChannel | null = null;
    try {
      channel = new BroadcastChannel(PROJECTION_CHANNEL);
      channelRef.current = channel;
      channel.onmessage = (event: MessageEvent<unknown>) => {
        const next = parseProjectionState(event.data);
        if (next) setState(next);
      };
    } catch {
      channel = null;
    }

    const onStorage = (event: StorageEvent) => {
      if (event.key === PROJECTION_STORAGE_KEY && event.newValue) setState(readSavedState());
    };
    window.addEventListener('storage', onStorage);

    return () => {
      window.removeEventListener('storage', onStorage);
      channel?.close();
      channelRef.current = null;
    };
  }, []);

  const commit = useCallback((next: ProjectionState) => {
    setState(next);
    try {
      localStorage.setItem(PROJECTION_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // Continue with BroadcastChannel if persistent storage is unavailable.
    }
    channelRef.current?.postMessage(next);
  }, []);

  const publish = useCallback(() => {
    commit({ ...initialProjectionState, resetToken: state.resetToken + 1 });
  }, [commit, state.resetToken]);

  const setMedia = useCallback((
    media: ProjectionMedia,
    overlayText: string | null = null,
    showArrow = false,
    targetText: string | null = null,
  ) => {
    commit({
      ...state,
      media,
      clipPlaying: videoMedia.includes(media),
      resetToken: state.resetToken + 1,
      overlayText,
      showArrow,
      targetText,
    });
  }, [commit, state]);

  const setOverlay = useCallback((
    overlayText: string | null,
    showArrow = false,
    targetText: string | null = null,
  ) => {
    commit({ ...state, overlayText, showArrow, targetText });
  }, [commit, state]);

  const toggleClip = useCallback(() => {
    if (videoMedia.includes(state.media)) commit({ ...state, clipPlaying: !state.clipPlaying });
  }, [commit, state]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      if (
        target?.isContentEditable ||
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(target?.tagName ?? '') ||
        (target?.tagName === 'BUTTON' && event.key === ' ')
      ) return;

      if ((event.code === 'Space' || event.key === ' ') && videoMedia.includes(state.media) && !event.repeat) {
        event.preventDefault();
        toggleClip();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [state.media, toggleClip]);

  return { state, publish, setMedia, setOverlay, toggleClip };
}
