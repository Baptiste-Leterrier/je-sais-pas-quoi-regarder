import { getGenres, discover, searchKeyword } from '../api/tmdb.js';
import { getState, setState } from '../state/store.js';
import { track } from '../analytics/umami.js';
import { pickRandom } from '../lib/shuffle.js';
import { topbar } from './_topbar.js';
import { ERAS, ERAS_LOOKUP } from './_eras.js';

const STEPS = ['type', 'genres', 'era', 'keyword', 'result'];

export function renderDiscover(root, navigate) {
  const state = getState();
  if (!state.discover) {
    setState({
      discover: {
        answers: { type: null, genres: [], era: null, keyword: null },
        suggestion: null,
        pool: [],
      },
    });
  }
  const step = currentStep();
  root.innerHTML = '';
  root.appendChild(topbar({ navigate, backHref: previousHref(step) }));

  const shell = document.createElement('main');
  shell.className = 'shell';

  const quiz = document.createElement('section');
  quiz.className = 'quiz';

  quiz.appendChild(renderProgress(step));

  if (step === 'type') {
    quiz.appendChild(renderType(navigate));
  } else if (step === 'genres') {
    renderGenresStep(quiz, navigate);
  } else if (step === 'era') {
    quiz.appendChild(renderEra(navigate));
  } else if (step === 'keyword') {
    quiz.appendChild(renderKeyword(navigate));
  } else if (step === 'result') {
    renderResultStep(quiz, navigate);
  }

  shell.appendChild(quiz);
  root.appendChild(shell);
}

function currentStep() {
  const a = getState().discover.answers;
  if (!a.type) return 'type';
  if (!a.genres.length) return 'genres';
  if (!a.era) return 'era';
  if (a.keyword === null) return 'keyword';
  return 'result';
}

function previousHref(step) {
  if (step === 'type') return '#/';
  return null; /* la barre 'retour' sera désactivée — utilise le brand pour retour accueil */
}

function renderProgress(step) {
  const wrap = document.createElement('div');
  wrap.className = 'quiz__progress';
  const total = 4;
  const currentIndex = STEPS.indexOf(step);
  for (let i = 0; i < total; i++) {
    const s = document.createElement('div');
    s.className = 'quiz__progress-step';
    if (i < currentIndex) s.classList.add('quiz__progress-step--done');
    wrap.appendChild(s);
  }
  return wrap;
}

function renderType(navigate) {
  const wrap = document.createElement('div');
  wrap.style.display = 'flex';
  wrap.style.flexDirection = 'column';
  wrap.style.gap = '24px';

  const q = document.createElement('h2');
  q.className = 'quiz__question';
  q.textContent = 'Film ou série ?';
  wrap.appendChild(q);

  const opts = document.createElement('div');
  opts.className = 'quiz__options';
  ['Film', 'Série'].forEach((label, i) => {
    const value = i === 0 ? 'movie' : 'tv';
    opts.appendChild(option(label, () => {
      const d = getState().discover;
      setState({ discover: { ...d, answers: { ...d.answers, type: value } } });
      track('discover_step', { step: 'type', value });
      navigate('#/discover', { force: true });
    }));
  });
  wrap.appendChild(opts);

  return wrap;
}

function renderGenresStep(parent, navigate) {
  const wrap = document.createElement('div');
  wrap.style.display = 'flex';
  wrap.style.flexDirection = 'column';
  wrap.style.gap = '24px';

  const q = document.createElement('h2');
  q.className = 'quiz__question';
  q.textContent = 'Quelle ambiance ?';
  wrap.appendChild(q);

  const sub = document.createElement('p');
  sub.style.textAlign = 'center';
  sub.style.color = 'var(--text-muted)';
  sub.textContent = 'Choisissez un ou plusieurs genres (cliquez sur Continuer ensuite).';
  wrap.appendChild(sub);

  const opts = document.createElement('div');
  opts.className = 'quiz__options quiz__options--many';
  opts.innerHTML = '<div class="loading-block"><div class="spinner"></div></div>';
  wrap.appendChild(opts);

  const actions = document.createElement('div');
  actions.className = 'quiz__actions';
  const continueBtn = document.createElement('button');
  continueBtn.type = 'button';
  continueBtn.className = 'btn btn--primary';
  continueBtn.textContent = 'Continuer';
  continueBtn.disabled = true;
  continueBtn.style.marginLeft = 'auto';
  continueBtn.addEventListener('click', () => {
    track('discover_step', { step: 'genres', value: getState().discover.answers.genres.join(',') });
    navigate('#/discover', { force: true });
  });
  actions.appendChild(continueBtn);
  wrap.appendChild(actions);

  parent.appendChild(wrap);

  (async () => {
    try {
      const type = getState().discover.answers.type;
      const genres = await getGenres(type);
      opts.innerHTML = '';
      const selected = new Set(getState().discover.answers.genres);
      genres.forEach((g) => {
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'quiz__option';
        btn.textContent = g.name;
        const refresh = () => {
          btn.style.borderColor = selected.has(g.id) ? 'var(--accent)' : '';
          btn.style.background = selected.has(g.id) ? 'var(--accent-soft)' : '';
          continueBtn.disabled = selected.size === 0;
        };
        btn.addEventListener('click', () => {
          if (selected.has(g.id)) selected.delete(g.id);
          else selected.add(g.id);
          const d = getState().discover;
          setState({ discover: { ...d, answers: { ...d.answers, genres: [...selected] } } });
          refresh();
        });
        refresh();
        opts.appendChild(btn);
      });
    } catch (err) {
      opts.innerHTML = `<p style="color:var(--accent);">Erreur : ${err.message}</p>`;
    }
  })();
}

function renderEra(navigate) {
  const wrap = document.createElement('div');
  wrap.style.display = 'flex';
  wrap.style.flexDirection = 'column';
  wrap.style.gap = '24px';

  const q = document.createElement('h2');
  q.className = 'quiz__question';
  q.textContent = 'Plutôt récent ou classique ?';
  wrap.appendChild(q);

  const opts = document.createElement('div');
  opts.className = 'quiz__options';
  ERAS.forEach((era) => {
    opts.appendChild(option(era.label, () => {
      const d = getState().discover;
      setState({ discover: { ...d, answers: { ...d.answers, era: era.value } } });
      track('discover_step', { step: 'era', value: era.value });
      navigate('#/discover', { force: true });
    }));
  });
  wrap.appendChild(opts);

  return wrap;
}

function renderKeyword(navigate) {
  const wrap = document.createElement('div');
  wrap.style.display = 'flex';
  wrap.style.flexDirection = 'column';
  wrap.style.gap = '24px';

  const q = document.createElement('h2');
  q.className = 'quiz__question';
  q.textContent = 'Un thème particulier ?';
  wrap.appendChild(q);

  const sub = document.createElement('p');
  sub.style.textAlign = 'center';
  sub.style.color = 'var(--text-muted)';
  sub.textContent = 'Optionnel. Exemples : vampires, espace, enquête…';
  wrap.appendChild(sub);

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'quiz__keyword-input';
  input.placeholder = 'Laisser vide pour ignorer';
  wrap.appendChild(input);

  const actions = document.createElement('div');
  actions.className = 'quiz__actions';

  const skip = document.createElement('button');
  skip.type = 'button';
  skip.className = 'btn btn--ghost';
  skip.textContent = 'Passer';
  skip.addEventListener('click', () => commit(''));
  actions.appendChild(skip);

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'btn btn--primary';
  next.textContent = 'Trouver une idée';
  next.addEventListener('click', () => commit(input.value));
  actions.appendChild(next);

  wrap.appendChild(actions);

  function commit(value) {
    const v = value.trim();
    const d = getState().discover;
    setState({ discover: { ...d, answers: { ...d.answers, keyword: v || '' } } });
    track('discover_step', { step: 'keyword', value: v ? 'set' : 'skip' });
    navigate('#/discover', { force: true });
  }

  return wrap;
}

function renderResultStep(parent, navigate) {
  const wrap = document.createElement('div');
  wrap.className = 'empty-state';
  wrap.innerHTML = '<div class="spinner"></div><p>On cherche une bonne idée…</p>';
  parent.appendChild(wrap);

  (async () => {
    try {
      const answers = getState().discover.answers;
      const filters = await buildFilters(answers);
      const pool = await discover(answers.type, filters);
      if (!pool.length) {
        wrap.innerHTML = `
          <h2>Aucun résultat</h2>
          <p>Essayez avec moins de filtres.</p>
        `;
        const back = document.createElement('button');
        back.type = 'button';
        back.className = 'btn btn--primary';
        back.textContent = 'Recommencer le quiz';
        back.addEventListener('click', () => {
          resetDiscover();
          navigate('#/discover', { force: true });
        });
        wrap.appendChild(back);
        return;
      }
      const top10 = pool.slice(0, 10);
      const pick = pickRandom(top10);
      setState({
        discover: { ...getState().discover, pool: top10, suggestion: pick },
        finalChoice: pick,
      });
      track('discover_completed', {
        type: answers.type,
        genres: answers.genres.join(','),
        era: answers.era,
        has_keyword: !!answers.keyword,
        suggested_id: pick.id,
      });
      navigate('#/result');
    } catch (err) {
      wrap.innerHTML = `<h2>Erreur</h2><p>${err.message}</p>`;
    }
  })();
}

async function buildFilters(answers) {
  const filters = { genres: answers.genres };
  const era = ERAS_LOOKUP[answers.era];
  if (era?.yearGte) filters.yearGte = era.yearGte;
  if (era?.yearLte) filters.yearLte = era.yearLte;
  if (answers.keyword) {
    try {
      const keywords = await searchKeyword(answers.keyword);
      if (keywords.length) filters.keywordId = keywords[0].id;
    } catch {
      /* keyword search failure is non-blocking */
    }
  }
  return filters;
}

function resetDiscover() {
  setState({
    discover: {
      answers: { type: null, genres: [], era: null, keyword: null },
      suggestion: null,
      pool: [],
    },
  });
}

function option(label, onClick) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'quiz__option';
  btn.textContent = label;
  btn.addEventListener('click', onClick);
  return btn;
}
