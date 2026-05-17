import { load, save } from '../lib/storage.js';

const VERSION = 1;

const defaultState = {
  version: VERSION,
  candidates: [],
  tournament: null,
  discover: {
    answers: {
      type: null,
      genres: [],
      era: null,
      keyword: null,
    },
    suggestion: null,
    pool: [],
  },
  finalChoice: null,
};

let state = init();
const listeners = new Set();

function init() {
  const persisted = load();
  if (!persisted || persisted.version !== VERSION) {
    return structuredClone(defaultState);
  }
  return {
    ...structuredClone(defaultState),
    ...persisted,
    version: VERSION,
  };
}

export function getState() {
  return state;
}

export function setState(partial) {
  state = typeof partial === 'function' ? partial(state) : { ...state, ...partial };
  save(state);
  listeners.forEach((l) => l(state));
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetAll() {
  state = structuredClone(defaultState);
  save(state);
  listeners.forEach((l) => l(state));
}
