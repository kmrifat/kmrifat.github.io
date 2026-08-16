import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { FilterState } from '../../lib/filter';
import { buildUrl, emptyState, filterSignature, parseQuery } from '../../lib/query-state';

/** `useLayoutEffect` warns when React renders on the server; fall back there. */
const useIsomorphicLayoutEffect = typeof window === 'undefined' ? useEffect : useLayoutEffect;

const SEARCH_DEBOUNCE_MS = 180;

interface HistoryState {
  filters?: string;
  scrollY?: number;
}

/**
 * Two-way binding between filter state and the address bar.
 *
 * Deliberate choices, each one fixing something the 2022 implementation got wrong:
 *
 *  - **State starts empty**, matching what Astro rendered on the server, and is
 *    corrected from the URL in a layout effect. Initialising directly from
 *    `location.search` would make React's first client render disagree with the
 *    server HTML and trigger a hydration mismatch. The correction lands before
 *    paint, and the pre-paint anti-flash script hides non-matching cards in the
 *    meantime, so nothing is ever visibly wrong.
 *
 *  - **Typing replaces, everything else pushes.** The old site pushed a history
 *    entry per keystroke, so Back had to be pressed once per character typed.
 *    Here a history entry is only created when the *result set* changes.
 *
 *  - **Scroll position is stored in `history.state`**, not recomputed. With
 *    client-side filtering the browser's own restoration fires before the list
 *    re-renders and lands in the wrong place, so we take it over.
 */
export function useUrlState() {
  const [state, setState] = useState<FilterState>(emptyState);

  // True while we are applying a popstate, so the write-back effect knows not to
  // push another entry for a change the user navigated to.
  const isPopping = useRef(false);
  // Signature of the last state we pushed, used to decide push vs replace.
  const lastPushed = useRef<string>('');
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const hydrated = useRef(false);

  // Adopt whatever the URL says, before the browser paints.
  useIsomorphicLayoutEffect(() => {
    const initial = parseQuery(window.location.search);
    lastPushed.current = filterSignature(initial);
    setState(initial);
    hydrated.current = true;

    // The list is rebuilt client-side, so the browser's automatic restoration
    // would run against the wrong DOM. We restore explicitly on popstate instead.
    if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

    // Release the pre-paint card-hiding style now that React owns the grid.
    delete document.documentElement.dataset.filtering;
  }, []);

  useEffect(() => {
    const onPopState = (event: PopStateEvent) => {
      isPopping.current = true;
      const next = parseQuery(window.location.search);
      lastPushed.current = filterSignature(next);
      setState(next);

      const saved = (event.state as HistoryState | null)?.scrollY;
      if (typeof saved === 'number') {
        // Wait for React to commit the restored list before scrolling.
        requestAnimationFrame(() => window.scrollTo({ top: saved, behavior: 'instant' }));
      }
    };

    window.addEventListener('popstate', onPopState);
    return () => window.removeEventListener('popstate', onPopState);
  }, []);

  // Write state back to the URL.
  useEffect(() => {
    if (!hydrated.current) return;

    if (isPopping.current) {
      isPopping.current = false;
      return;
    }

    const url = buildUrl(state, window.location.pathname);
    const signature = filterSignature(state);
    const isNewResultSet = signature !== lastPushed.current;

    const commit = () => {
      const historyState: HistoryState = { filters: signature, scrollY: window.scrollY };

      if (isNewResultSet) {
        // Record where the user was before this navigation, so Back returns there.
        history.replaceState({ ...(history.state as object), scrollY: window.scrollY }, '', null);
        history.pushState(historyState, '', url);
        lastPushed.current = signature;
      } else {
        // Same result set (a page change, say) — update in place.
        history.replaceState(historyState, '', url);
      }
    };

    // Only typing is debounced, and only to throttle history writes — the
    // results themselves update synchronously on every keystroke.
    if (isNewResultSet) {
      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(commit, SEARCH_DEBOUNCE_MS);
      return () => clearTimeout(debounceTimer.current);
    }

    commit();
    return undefined;
  }, [state]);

  const update = useCallback((updater: (previous: FilterState) => FilterState) => {
    setState(updater);
  }, []);

  return { state, update } as const;
}
