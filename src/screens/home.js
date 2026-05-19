import { track } from '../analytics/umami.js';
import { capture } from '../analytics/posthog.js';
import { resetAll } from '../state/store.js';

export function renderHome(root, navigate) {
  root.innerHTML = '';

  const shell = document.createElement('main');
  shell.className = 'shell shell--center';

  const wrap = document.createElement('div');
  wrap.className = 'home';

  const title = document.createElement('h1');
  title.className = 'home__title';
  title.innerHTML = `Je c'pas <span class="accent">koi</span> regarder`;
  wrap.appendChild(title);

  const sub = document.createElement('p');
  sub.className = 'home__sub';
  sub.textContent = 'Choisissez votre prochain film ou série, sans débat sans fin.';
  wrap.appendChild(sub);

  const grid = document.createElement('div');
  grid.className = 'mode-grid';

  grid.appendChild(modeCard({
    title: 'Le tournoi',
    desc: 'Chacun choisit ses films ou séries préférés et les fait s\'affronter en duels. Il ne peux en rester qu\'un !',
    onClick: () => {
      resetAll();
      track('mode_started', { mode: 'tournament' });
      capture('mode_started', { mode: 'tournament' });
      navigate('#/select');
    },
  }));

  grid.appendChild(modeCard({
    title: 'Je sais pas quoi regarder',
    desc: 'Quelques questions et on vous propose des idée.',
    onClick: () => {
      resetAll();
      track('mode_started', { mode: 'discover' });
      capture('mode_started', { mode: 'discover' });
      navigate('#/discover');
    },
  }));

  wrap.appendChild(grid);
  shell.appendChild(wrap);
  root.appendChild(shell);
}

function modeCard({ title, desc, onClick }) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'mode-card';
  card.addEventListener('click', onClick);

  const h = document.createElement('div');
  h.className = 'mode-card__title';
  h.textContent = title;
  card.appendChild(h);

  const p = document.createElement('div');
  p.className = 'mode-card__desc';
  p.textContent = desc;
  card.appendChild(p);

  return card;
}
