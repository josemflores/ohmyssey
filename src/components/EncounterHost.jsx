/**
 * Listens for ohmyssey:encounter and renders the battle overlay.
 * Jose mounts this once, as a sibling of the screens, inside App.
 *
 * Dev only: if this host is already mounted, ?encounter=1 or ?encounter=2
 * opens a fight on load so the overlay can be tried without Phaser.
 * The query does nothing in a production build, and nothing at all until
 * this component is on the page.
 */

import { useEffect, useRef, useState } from 'react';
import { ENCOUNTER_EVENT, ENCOUNTER_RESULT_EVENT } from '../learn/encounters/bus.js';
import MonsterEncounter from './MonsterEncounter.jsx';

function readPreviewLevel() {
  if (!import.meta.env.DEV || typeof window === 'undefined') return null;
  const flag = new URLSearchParams(window.location.search).get('encounter');
  if (flag === '1' || flag === '2') return Number(flag);
  return null;
}

export default function EncounterHost() {
  const [request, setRequest] = useState(null);
  const open = useRef(false);

  useEffect(() => {
    function onEncounter(event) {
      const detail = event.detail || {};
      const level = Number(detail.level);
      if (level !== 1 && level !== 2) return;
      if (open.current) return;
      open.current = true;
      setRequest({
        level,
        monsterId: detail.monsterId || null,
        preview: false,
        nonce: 1,
      });
    }

    window.addEventListener(ENCOUNTER_EVENT, onEncounter);
    const previewLevel = readPreviewLevel();
    if (previewLevel != null) {
      open.current = true;
      setRequest({ level: previewLevel, monsterId: null, preview: true, nonce: 1 });
    }
    return () => window.removeEventListener(ENCOUNTER_EVENT, onEncounter);
  }, []);

  function finish(win, reason) {
    if (reason !== 'dismiss' && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(ENCOUNTER_RESULT_EVENT, {
        detail: { win: Boolean(win), reason },
      }));
    }
    if (request?.preview && reason !== 'dismiss') {
      setRequest((prev) => ({
        level: prev.level,
        monsterId: null,
        preview: true,
        nonce: (prev.nonce || 1) + 1,
      }));
      return;
    }
    open.current = false;
    setRequest(null);
  }

  if (!request) return null;

  return (
    <MonsterEncounter
      key={request.nonce}
      level={request.level}
      monsterId={request.monsterId}
      preview={request.preview}
      onWin={() => finish(true, 'win')}
      onLose={() => finish(false, 'lose')}
      onFlee={() => finish(false, 'flee')}
      onDismiss={request.preview ? () => finish(false, 'dismiss') : undefined}
    />
  );
}
