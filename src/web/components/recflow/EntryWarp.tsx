import { useEffect } from 'react';

/**
 * EntryWarp — lightweight mount hook after the cinematic transition.
 * The heavy warp animation ran in ProjectWorlds before navigation.
 * This just immediately calls onComplete so the page content renders.
 */
export default function EntryWarp({ onComplete }: { onComplete: () => void }) {
  useEffect(() => {
    // Transition already played — just unlock the page instantly
    const id = setTimeout(onComplete, 0);
    return () => clearTimeout(id);
  }, []);

  return null;
}
