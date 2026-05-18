import { searchMulti } from '../api/tmdb.js';
import { getState, setState } from '../state/store.js';
import { track } from '../analytics/umami.js';
import { createTournament } from '../lib/tournament.js';
import { searchBar } from '../components/searchBar.js';
import { movieCard } from '../components/movieCard.js';
import { topbar } from './_topbar.js';

const MIN_CANDIDATES = 4;

export function renderSelect(root, navigate) {
  root.innerHTML = '';
  root.appendChild(topbar({ navigate, backHref: '#/' }));

  const shell = document.createElement('main');
  shell.className = 'shell';

  const heading = document.createElement('div');
  heading.innerHTML = `
    <h2 style="margin-bottom:8px;font-size:24px;">Choisissez vos candidats</h2>
    <p style="color:var(--text-muted);font-size:14px;">Cherchez et ajoutez au moins ${MIN_CANDIDATES} films ou séries. Le tournoi mélangera ensuite la liste.</p>
  `;
  shell.appendChild(heading);

  const layout = document.createElement('div');
  layout.className = 'select-layout';

  const leftCol = document.createElement('div');
  leftCol.style.display = 'flex';
  leftCol.style.flexDirection = 'column';
  leftCol.style.gap = '16px';

  const bar = searchBar({ onChange: (q) => runSearch(q) });
  leftCol.appendChild(bar.el);

  const resultsWrap = document.createElement('div');
  resultsWrap.className = 'results';
  leftCol.appendChild(resultsWrap);

  const empty = document.createElement('div');
  empty.className = 'empty-state';
  empty.innerHTML = '<p>Tapez le titre d\'un film ou d\'une série pour commencer.</p>';
  leftCol.appendChild(empty);

  layout.appendChild(leftCol);

  const basketEl = document.createElement('aside');
  basketEl.className = 'basket';
  layout.appendChild(basketEl);

  shell.appendChild(layout);
  root.appendChild(shell);

  let currentResults = [];
  let lastQuery = '';
  let inFlight = 0;

  function renderAll() {
    renderResults(resultsWrap, currentResults, {
      onAdd: addCandidate,
      onRemove: removeCandidate,
    });
    renderBasket(basketEl, { onRemove: removeCandidate, onStart: startTournament });
    empty.style.display = currentResults.length || lastQuery ? 'none' : '';
  }

  function addCandidate(movie) {
    const cands = getState().candidates;
    if (cands.some((c) => candidateKey(c) === candidateKey(movie))) return;
    setState({ candidates: [...cands, movie] });
    track('candidate_added', { id: movie.id, type: movie.type, total: cands.length + 1 });
    renderAll();
  }

  function removeCandidate(movie) {
    const cands = getState().candidates.filter((c) => candidateKey(c) !== candidateKey(movie));
    setState({ candidates: cands });
    renderAll();
  }

  function startTournament() {
    const candidates = getState().candidates;
    if (candidates.length < MIN_CANDIDATES) return;
    const tournament = createTournament(candidates);
    setState({ tournament, flow: 'tournament' });
    track('tournament_started', { count: candidates.length, types: countTypes(candidates) });
    navigate('#/tournament');
  }

  async function runSearch(query) {
    lastQuery = query;
    if (!query.trim()) {
      currentResults = [];
      resultsWrap.innerHTML = '';
      empty.style.display = '';
      return;
    }
    empty.style.display = 'none';
    resultsWrap.innerHTML = '<div class="loading-block"><div class="spinner"></div></div>';
    const reqId = ++inFlight;
    try {
      const results = await searchMulti(query);
      if (reqId !== inFlight || lastQuery !== query) return;
      currentResults = results;
      renderAll();
    } catch (err) {
      if (reqId !== inFlight) return;
      resultsWrap.innerHTML = `<p style="color:var(--accent);">Erreur de recherche : ${err.message}</p>`;
    }
  }

  renderAll();
}

function renderResults(container, results, { onAdd, onRemove }) {
  container.innerHTML = '';
  if (!results.length) return;
  const candidateIds = new Set(getState().candidates.map(candidateKey));
  results.forEach((m) => {
    const card = movieCard(m, {
      inBasket: candidateIds.has(candidateKey(m)),
      onAdd,
      onRemove,
    });
    container.appendChild(card);
  });
}

function renderBasket(container, { onRemove, onStart }) {
  container.innerHTML = '';
  const candidates = getState().candidates;

  const header = document.createElement('div');
  header.className = 'basket__header';
  header.innerHTML = `
    <span class="basket__title">Notre liste</span>
    <span class="basket__count">${candidates.length} ${candidates.length > 1 ? 'titres' : 'titre'}</span>
  `;
  container.appendChild(header);

  const list = document.createElement('div');
  list.className = 'basket__list';
  if (!candidates.length) {
    const empty = document.createElement('div');
    empty.className = 'basket__empty';
    empty.textContent = 'Aucun titre ajouté pour le moment.';
    list.appendChild(empty);
  } else {
    candidates.forEach((c) => list.appendChild(basketItem(c, onRemove)));
  }
  container.appendChild(list);

  const startBtn = document.createElement('button');
  startBtn.type = 'button';
  startBtn.className = 'btn btn--primary';
  startBtn.textContent = candidates.length >= MIN_CANDIDATES
    ? `C'est parti ! (${candidates.length})`
    : `Encore ${MIN_CANDIDATES - candidates.length} à ajouter`;
  startBtn.disabled = candidates.length < MIN_CANDIDATES;
  startBtn.addEventListener('click', onStart);
  container.appendChild(startBtn);
}

function basketItem(movie, onRemove) {
  const item = document.createElement('div');
  item.className = 'basket__item';

  const thumb = document.createElement('div');
  thumb.className = 'basket__thumb';
  if (movie.poster) thumb.style.backgroundImage = `url(${movie.poster})`;
  item.appendChild(thumb);

  const t = document.createElement('div');
  t.className = 'basket__item-title';
  t.textContent = movie.title + (movie.year ? ` (${movie.year})` : '');
  item.appendChild(t);

  const rm = document.createElement('button');
  rm.type = 'button';
  rm.className = 'basket__remove';
  rm.setAttribute('aria-label', `Retirer ${movie.title}`);
  rm.textContent = '×';
  rm.addEventListener('click', () => onRemove(movie));
  item.appendChild(rm);

  return item;
}

function candidateKey(m) {
  return `${m.type}:${m.id}`;
}

function countTypes(list) {
  const counts = { movie: 0, tv: 0 };
  list.forEach((m) => { counts[m.type] = (counts[m.type] || 0) + 1; });
  return counts;
}
