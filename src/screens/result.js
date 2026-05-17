import { getState, resetAll } from '../state/store.js';
import { track } from '../analytics/umami.js';
import { discover } from '../api/tmdb.js';
import { pickRandom } from '../lib/shuffle.js';
import { setState } from '../state/store.js';
import { topbar } from './_topbar.js';
import { ERAS_LOOKUP } from './_eras.js';

export function renderResult(root, navigate) {
  const state = getState();
  const choice = state.finalChoice;
  if (!choice) {
    navigate('#/');
    return;
  }

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
  intro.textContent = state.tournament?.status === 'finished' ? 'Le gagnant du tournoi' : 'Notre suggestion';
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
    track('final_choice', {
      id: choice.id,
      type: choice.type,
      year: choice.year,
      source: state.tournament?.status === 'finished' ? 'tournament' : 'discover',
    });
    resetAll();
    navigate('#/');
  });
  actions.appendChild(watch);

  if (state.discover?.suggestion?.id === choice.id) {
    const another = document.createElement('button');
    another.type = 'button';
    another.className = 'btn';
    another.textContent = 'Une autre idée';
    another.addEventListener('click', () => suggestAnother(navigate));
    actions.appendChild(another);

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

async function suggestAnother(navigate) {
  const d = getState().discover;
  let pool = d.pool;
  if (!pool || pool.length <= 1) {
    try {
      const refreshed = await discover(d.answers.type, rebuildFilters(d.answers));
      pool = refreshed.slice(0, 10);
    } catch {
      return;
    }
  }
  const others = pool.filter((m) => m.id !== d.suggestion?.id);
  const pick = pickRandom(others.length ? others : pool);
  if (!pick) return;
  setState({
    discover: { ...d, suggestion: pick, pool },
    finalChoice: pick,
  });
  track('discover_another', { id: pick.id });
  navigate('#/result', { force: true });
}

function rebuildFilters(answers) {
  const filters = { genres: answers.genres };
  const era = ERAS_LOOKUP[answers.era];
  if (era?.yearGte) filters.yearGte = era.yearGte;
  if (era?.yearLte) filters.yearLte = era.yearLte;
  return filters;
}
