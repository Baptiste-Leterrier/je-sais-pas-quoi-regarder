import { getState, resetAll, setState } from '../state/store.js';
import { track } from '../analytics/umami.js';
import { discover } from '../api/tmdb.js';
import { createTournament } from '../lib/tournament.js';
import { topbar } from './_topbar.js';
import { ERAS_LOOKUP } from './_eras.js';

const TOURNAMENT_SIZE = 8;

export function renderResult(root, navigate) {
  const state = getState();
  const choice = state.finalChoice;
  if (!choice) {
    navigate('#/');
    return;
  }

  const flow = state.flow || 'tournament';

  root.innerHTML = '';
  root.appendChild(topbar({ navigate, backHref: '#/' }));

  const shell = document.createElement('main');
  shell.className = 'shell';

  const wrap = document.createElement('section');
  wrap.className = 'result';

  const poster = document.createElement('div');
  poster.className = 'result__poster';
  if (choice.posterLarge || choice.poster) {
    poster.style.backgroundImage = `url(${choice.posterLarge || choice.poster})`;
  }
  wrap.appendChild(poster);

  const info = document.createElement('div');

  const intro = document.createElement('div');
  intro.style.color = 'var(--text-muted)';
  intro.style.marginBottom = '8px';
  intro.style.fontSize = '14px';
  intro.style.letterSpacing = '0.05em';
  intro.style.textTransform = 'uppercase';
  intro.textContent = flow === 'discover' ? 'Le gagnant de votre tournoi' : 'Le gagnant du tournoi';
  info.appendChild(intro);

  const title = document.createElement('h1');
  title.className = 'result__title';
  title.textContent = choice.title;
  info.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'result__meta';
  const typeLabel = choice.type === 'tv' ? 'Série' : 'Film';
  meta.textContent = choice.year ? `${typeLabel} · ${choice.year}` : typeLabel;
  info.appendChild(meta);

  if (choice.overview) {
    const overview = document.createElement('p');
    overview.className = 'result__overview';
    overview.textContent = choice.overview;
    info.appendChild(overview);
  }

  const actions = document.createElement('div');
  actions.className = 'result__actions';

  const watch = document.createElement('button');
  watch.type = 'button';
  watch.className = 'btn btn--primary btn--lg';
  watch.textContent = 'On regarde ça !';
  watch.addEventListener('click', () => {
    track('final_choice', { id: choice.id, type: choice.type, year: choice.year, source: flow });
    resetAll();
    navigate('#/');
  });
  actions.appendChild(watch);

  if (flow === 'discover') {
    const newRun = document.createElement('button');
    newRun.type = 'button';
    newRun.className = 'btn';
    newRun.textContent = 'Autres suggestions';
    newRun.addEventListener('click', () => relaunchDiscoverTournament(navigate));
    actions.appendChild(newRun);

    const restartQuiz = document.createElement('button');
    restartQuiz.type = 'button';
    restartQuiz.className = 'btn btn--ghost';
    restartQuiz.textContent = 'Refaire le quiz';
    restartQuiz.addEventListener('click', () => {
      resetAll();
      navigate('#/discover');
    });
    actions.appendChild(restartQuiz);
  } else {
    const restart = document.createElement('button');
    restart.type = 'button';
    restart.className = 'btn';
    restart.textContent = 'Nouveau tournoi';
    restart.addEventListener('click', () => {
      resetAll();
      navigate('#/select');
    });
    actions.appendChild(restart);
  }

  info.appendChild(actions);
  wrap.appendChild(info);
  shell.appendChild(wrap);
  root.appendChild(shell);
}

async function relaunchDiscoverTournament(navigate) {
  const answers = getState().discover.answers;
  if (!answers?.type) {
    navigate('#/discover');
    return;
  }
  const filters = buildFilters(answers);
  try {
    const pool = await discover(answers.type, filters);
    if (!pool.length) {
      navigate('#/discover');
      return;
    }
    const selection = pool.slice(0, TOURNAMENT_SIZE);
    setState({
      tournament: createTournament(selection),
      finalChoice: null,
      flow: 'discover',
    });
    track('discover_relaunch', { pool_size: selection.length });
    navigate('#/tournament');
  } catch {
    navigate('#/discover');
  }
}

function buildFilters(answers) {
  const filters = { genres: answers.genres };
  const era = ERAS_LOOKUP[answers.era];
  if (era?.yearGte) filters.yearGte = era.yearGte;
  if (era?.yearLte) filters.yearLte = era.yearLte;
  if (answers.themes?.length) filters.keywordIds = answers.themes.map((t) => t.id);
  return filters;
}
