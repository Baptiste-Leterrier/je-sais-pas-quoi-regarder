import './styles/reset.css';
import './styles/tokens.css';
import './styles/app.css';

import { initUmami } from './analytics/umami.js';
import { initPostHog } from './analytics/posthog.js';
import { renderHome } from './screens/home.js';
import { renderSelect } from './screens/select.js';
import { renderTournament } from './screens/tournament.js';
import { renderDiscover } from './screens/discover.js';
import { renderResult } from './screens/result.js';

const root = document.getElementById('app');

const routes = {
  '#/': renderHome,
  '#/select': renderSelect,
  '#/tournament': renderTournament,
  '#/discover': renderDiscover,
  '#/result': renderResult,
};

function navigate(hash, { force = false } = {}) {
  const current = location.hash || '#/';
  if (current === hash && !force) return;
  if (current === hash && force) {
    render(hash);
    return;
  }
  location.hash = hash;
}

function render(hash) {
  const route = routes[hash] || routes['#/'];
  route(root, navigate);
  window.scrollTo({ top: 0 });
}

window.addEventListener('hashchange', () => {
  render(location.hash || '#/');
});

initUmami();
initPostHog();
render(location.hash || '#/');
