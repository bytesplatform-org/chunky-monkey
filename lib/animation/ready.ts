/**
 * The page's "go" signal: the preloader calls markReady() as its curtain
 * lifts, and intros (the hero) wait on onReady() so they play in view.
 */

let ready = false;
const listeners = new Set<() => void>();

export function markReady() {
  if (ready) return;
  ready = true;
  listeners.forEach((listener) => listener());
  listeners.clear();
}

/** Runs cb once the page is ready (at once if it already is). Returns an unsubscribe. */
export function onReady(cb: () => void): () => void {
  if (ready) {
    cb();
    return () => {};
  }
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}
