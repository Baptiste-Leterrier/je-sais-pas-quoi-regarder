import { getGenres, discover, searchKeyword } from '../api/tmdb.js';
import { getState, setState } from '../state/store.js';
import { track } from '../analytics/umami.js';
import { createTournament } from '../lib/tournament.js';
import { topbar } from './_topbar.js';
import { ERAS, ERAS_LOOKUP } from './_eras.js';

const TOURNAMENT_SIZE = 8;

const THEME_DEFS = [
  { label: 'Espace', query: 'space' },
  { label: 'Voyage temporel', query: 'time travel' },
  { label: 'Super-héros', query: 'superhero' },
  { label: 'Vampires', query: 'vampire' },
  { label: 'Zombies', query: 'zombie' },
  { label: 'Apocalypse', query: 'post-apocalyptic future' },
  { label: 'Magie', query: 'magic' },
  { label: 'Enquête', query: 'detective' },
  { label: 'Casse', query: 'heist' },
  { label: 'Vengeance', query: 'revenge' },
  { label: 'IA', query: 'artificial intelligence' },
  { label: 'Dystopie', query: 'dystopia' },
];

let themesPromise = null;
function resolveThemes() {
  if (themesPromise) return themesPromise;
  themesPromise = Promise.all(
    THEME_DEFS.map(async (t) => {
      try {
        const r = await searchKeyword(t.query);
        if (!r.length) return null;
        return { label: t.label, id: r[0].id };
      } catch {
        return null;
      }
    }),
  ).then((arr) => arr.filter(Boolean));
  return themesPromise;
}

export function renderDiscover(root, navigate) {
  const step = currentStep();
  root.innerHTML = '';
  root.appendChild(topbar({ navigate, backHref: '#/' }));

  const shell = document.createElement('main');
  shell.className = 'shell';

  const quiz = document.createElement('section');
  quiz.className = 'quiz';

  quiz.appendChild(renderProgress(step));

  if (step === 'type') quiz.appendChild(renderType(navigate));
  else if (step === 'genres') renderGenresStep(quiz, navigate);
  else if (step === 'era') quiz.appendChild(renderEra(navigate));
  else if (step === 'themes') renderThemesStep(quiz, navigate);
  else if (step === 'result') renderResultStep(quiz, navigate);

  shell.appendChild(quiz);
  root.appendChild(shell);
}

const STEPS = ['type', 'genres', 'era', 'themes', 'result'];

function currentStep() {
  const a = getState().discover.answers;
  if (!a.type) return 'type';
  if (!a.genres.length) return 'genres';
  if (!a.era) return 'era';
  if (!a.themesAsked) return 'themes';
  return 'result';
}

function renderProgress(step) {
  const wrap = document.createElement('div');
  wrap.className = 'quiz__progress';
  const total = 4;
  const idx = STEPS.indexOf(step);
  for (let i = 0; i < total; i++) {
    const s = document.createElement('div');
    s.className = 'quiz__progress-step';
    if (i < idx) s.classList.add('quiz__progress-step--done');
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
  sub.textContent = 'Sélectionnez un ou plusieurs genres.';
  wrap.appendChild(sub);

  const opts = document.createElement('div');
  opts.className = 'quiz__chips';
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
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'quiz__chip';
        chip.textContent = g.name;
        const refresh = () => {
          chip.classList.toggle('quiz__chip--selected', selected.has(g.id));
          continueBtn.disabled = selected.size === 0;
        };
        chip.addEventListener('click', () => {
          if (selected.has(g.id)) selected.delete(g.id);
          else selected.add(g.id);
          const d = getState().discover;
          setState({ discover: { ...d, answers: { ...d.answers, genres: [...selected] } } });
          refresh();
        });
        refresh();
        opts.appendChild(chip);
      });
    } catch (err) {
      opts.innerHTML = `<p style="color:var(--accent);">Erreur : ${escapeHtml(err.message)}</p>`;
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

function renderThemesStep(parent, navigate) {
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
  sub.textContent = 'Optionnel — sélectionnez aucun, un ou plusieurs thèmes.';
  wrap.appendChild(sub);

  const chips = document.createElement('div');
  chips.className = 'quiz__chips';
  chips.innerHTML = '<div class="loading-block"><div class="spinner"></div></div>';
  wrap.appendChild(chips);

  const actions = document.createElement('div');
  actions.className = 'quiz__actions';

  const skip = document.createElement('button');
  skip.type = 'button';
  skip.className = 'btn btn--ghost';
  skip.textContent = 'Passer';
  skip.addEventListener('click', () => commit([]));
  actions.appendChild(skip);

  const next = document.createElement('button');
  next.type = 'button';
  next.className = 'btn btn--primary';
  next.textContent = 'Trouver des idées';
  next.style.marginLeft = 'auto';
  next.addEventListener('click', () => {
    const selected = getState().discover.answers.themes;
    commit(selected);
  });
  actions.appendChild(next);

  wrap.appendChild(actions);
  parent.appendChild(wrap);

  (async () => {
    try {
      const themes = await resolveThemes();
      chips.innerHTML = '';
      const selected = new Map(
        getState().discover.answers.themes.map((t) => [t.id, t]),
      );
      themes.forEach((t) => {
        const chip = document.createElement('button');
        chip.type = 'button';
        chip.className = 'quiz__chip';
        chip.textContent = t.label;
        const refresh = () => {
          chip.classList.toggle('quiz__chip--selected', selected.has(t.id));
        };
        chip.addEventListener('click', () => {
          if (selected.has(t.id)) selected.delete(t.id);
          else selected.set(t.id, t);
          const d = getState().discover;
          setState({ discover: { ...d, answers: { ...d.answers, themes: [...selected.values()] } } });
          refresh();
        });
        refresh();
        chips.appendChild(chip);
      });
    } catch (err) {
      chips.innerHTML = `<p style="color:var(--accent);">Erreur : ${escapeHtml(err.message)}</p>`;
    }
  })();

  function commit(themes) {
    const d = getState().discover;
    setState({
      discover: {
        ...d,
        answers: { ...d.answers, themes, themesAsked: true },
      },
    });
    track('discover_step', { step: 'themes', value: themes.length ? themes.map((t) => t.label).join(',') : 'skip' });
    navigate('#/discover', { force: true });
  }
}

function renderResultStep(parent, navigate) {
  const wrap = document.createElement('div');
  wrap.className = 'empty-state';
  wrap.innerHTML = '<div class="spinner"></div><p>On prépare un tournoi de suggestions…</p>';
  parent.appendChild(wrap);

  (async () => {
    try {
      const answers = getState().discover.answers;
      const filters = buildFilters(answers);
      const pool = await discover(answers.type, filters);
      if (!pool.length) {
        wrap.innerHTML = '<h2>Aucun résultat</h2><p>Essayez avec moins de filtres.</p>';
        const back = document.createElement('button');
        back.type = 'button';
        back.className = 'btn btn--primary';
        back.textContent = 'Recommencer le quiz';
        back.addEventListener('click', () => {
          resetDiscoverAnswers();
          navigate('#/discover', { force: true });
        });
        wrap.appendChild(back);
        return;
      }
      const selection = pool.slice(0, TOURNAMENT_SIZE);
      const tournament = createTournament(selection);
      setState({
        tournament,
        flow: 'discover',
      });
      track('discover_completed', {
        type: answers.type,
        genres: answers.genres.join(','),
        era: answers.era,
        themes: answers.themes.map((t) => t.label).join(',') || 'none',
        pool_size: selection.length,
      });
      navigate('#/tournament');
    } catch (err) {
      wrap.innerHTML = `<h2>Erreur</h2><p>${escapeHtml(err.message)}</p>`;
    }
  })();
}

function buildFilters(answers) {
  const filters = { genres: answers.genres };
  const era = ERAS_LOOKUP[answers.era];
  if (era?.yearGte) filters.yearGte = era.yearGte;
  if (era?.yearLte) filters.yearLte = era.yearLte;
  if (answers.themes?.length) filters.keywordIds = answers.themes.map((t) => t.id);
  return filters;
}

function resetDiscoverAnswers() {
  setState({
    discover: {
      answers: {
        type: null,
        genres: [],
        era: null,
        themes: [],
        themesAsked: false,
      },
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

function escapeHtml(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
