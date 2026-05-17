let initialized = false;

export function initUmami() {
  if (initialized) return;
  initialized = true;

  if (typeof navigator !== 'undefined' && navigator.doNotTrack === '1') return;

  const src = import.meta.env.VITE_UMAMI_SRC;
  const websiteId = import.meta.env.VITE_UMAMI_WEBSITE_ID;
  if (!src || !websiteId) return;

  const script = document.createElement('script');
  script.defer = true;
  script.src = src;
  script.setAttribute('data-website-id', websiteId);
  document.head.appendChild(script);
}

export function track(event, data) {
  if (typeof window === 'undefined') return;
  if (typeof window.umami?.track !== 'function') return;
  try {
    if (data === undefined) window.umami.track(event);
    else window.umami.track(event, data);
  } catch {
    /* silent */
  }
}
