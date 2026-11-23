type Listener = () => void;

let loadRequested = false;
const loadListeners = new Set<Listener>();

let openRequested = false;
let opener: Listener | null = null;

export function loadConsentManager() {
  loadRequested = true;
  for (const listener of loadListeners) listener();
}

export function onConsentManagerLoad(listener: Listener) {
  loadListeners.add(listener);
  if (loadRequested) listener();
  return () => {
    loadListeners.delete(listener);
  };
}

export function openCookiePreferences() {
  if (opener) return opener();
  openRequested = true;
  loadConsentManager();
}

export function registerPreferencesOpener(open: Listener) {
  opener = open;
  if (openRequested) {
    openRequested = false;
    open();
  }
  return () => {
    if (opener === open) opener = null;
  };
}
