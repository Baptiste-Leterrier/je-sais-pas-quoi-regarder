import posthog from 'posthog-js';

let initialized = false;

export function initPostHog() {
  if (initialized) return;
  initialized = true;

  if (typeof navigator !== 'undefined' && navigator.doNotTrack === '1') return;

  const key = import.meta.env.VITE_PUBLIC_POSTHOG_KEY;
  const host = import.meta.env.VITE_PUBLIC_POSTHOG_HOST;
  if (!key || !host) return;

  posthog.init(key, {
    api_host: host,
    person_profiles: 'identified_only',
  });
}

export function capture(event, properties) {
  if (!initialized) return;
  try {
    posthog.capture(event, properties);
  } catch {
    /* silent */
  }
}
