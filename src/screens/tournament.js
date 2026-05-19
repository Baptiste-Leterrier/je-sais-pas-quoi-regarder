import { getState, setState } from '../state/store.js';
import { applyChoice, nextDuel, restartFromInitial } from '../lib/tournament.js';
import { track } from '../analytics/umami.js';
import { capture } from '../analytics/posthog.js';
import { duelCard } from '../components/duelCard.js';
import { topbar } from './_topbar.js';

const DUEL_TIMEOUT_MS = 25000;

let activeTimer = null;

function clearDuelTimer() {
  if (activeTimer) {
    clearTimeout(activeTimer);
    activeTimer = null;
  }
}

if (typeof window !== 'undefined') {
  window.addEventListener('hashchange', clearDuelTimer);
}

export function renderTournament(root, navigate) {
  clearDuelTimer();

  const t = getState().tournament;
  if (!t) {
    navigate('#/');
    return;
  }

  root.innerHTML = '';
  root.appendChild(topbar({ navigate, backHref: '#/' }));

  const shell = document.createElement('main');
  shell.className = 'shell';

  if (t.status === 'finished') {
    setState({ finalChoice: t.winner });
    track('tournament_completed', {
      winner_id: t.winner.id,
      winner_type: t.winner.type,
      winner_year: t.winner.year,
      winner_decade: t.winner.year ? `${Math.floor(t.winner.year / 10) * 10}s` : 'unknown',
      total_candidates: t.initial.length,
      flow: getState().flow || 'tournament',
    });
    capture('tournament_completed', {
      winner_id: t.winner.id,
      winner_type: t.winner.type,
      winner_year: t.winner.year,
      winner_decade: t.winner.year ? `${Math.floor(t.winner.year / 10) * 10}s` : 'unknown',
      total_candidates: t.initial.length,
      flow: getState().flow || 'tournament',
    });
    navigate('#/result');
    return;
  }

  if (t.status === 'all-eliminated') {
    shell.appendChild(renderAllEliminated(navigate));
    root.appendChild(shell);
    return;
  }

  const duel = nextDuel(t);
  if (!duel) {
    shell.appendChild(renderAllEliminated(navigate));
    root.appendChild(shell);
    return;
  }

  const tournamentEl = document.createElement('section');
  tournamentEl.className = 'tournament';

  if (duel.type === 'bye') {
    const byeBlock = document.createElement('div');
    byeBlock.className = 'empty-state';
    byeBlock.innerHTML = `
      <h2>${escape(duel.a.title)} passe directement</h2>
      <p>Pas de duel disponible.</p>
    `;
    const cont = document.createElement('button');
    cont.type = 'button';
    cont.className = 'btn btn--primary';
    cont.textContent = 'Continuer';
    cont.addEventListener('click', () => {
      const next = applyChoice(t, null);
      setState({ tournament: next });
      navigate('#/tournament', { force: true });
    });
    byeBlock.appendChild(cont);
    tournamentEl.appendChild(byeBlock);
  } else {
    const timer = document.createElement('div');
    timer.className = 'duel-timer';
    const fill = document.createElement('div');
    fill.className = 'duel-timer__fill';
    fill.style.setProperty('--duel-timer-duration', `${DUEL_TIMEOUT_MS}ms`);
    timer.appendChild(fill);
    tournamentEl.appendChild(timer);

    const duelEl = document.createElement('div');
    duelEl.className = 'duel';
    duelEl.appendChild(duelCard(duel.a, () => choose('a')));
    duelEl.appendChild(duelCard(duel.b, () => choose('b')));
    tournamentEl.appendChild(duelEl);

    const actions = document.createElement('div');
    actions.className = 'duel__actions';

    const noMatter = document.createElement('button');
    noMatter.type = 'button';
    noMatter.className = 'btn';
    noMatter.textContent = 'Peu importe';
    noMatter.addEventListener('click', () => {
      const pick = Math.random() < 0.5 ? 'a' : 'b';
      choose(pick, 'indifferent');
    });
    actions.appendChild(noMatter);

    const none = document.createElement('button');
    none.type = 'button';
    none.className = 'btn btn--ghost';
    none.textContent = 'Aucun des deux';
    none.addEventListener('click', () => choose('none'));
    actions.appendChild(none);

    tournamentEl.appendChild(actions);

    activeTimer = setTimeout(() => {
      activeTimer = null;
      const pick = Math.random() < 0.5 ? 'a' : 'b';
      choose(pick, 'timeout');
    }, DUEL_TIMEOUT_MS);
  }

  shell.appendChild(tournamentEl);
  root.appendChild(shell);

  function choose(c, via) {
    clearDuelTimer();
    const before = getState().tournament;
    track('duel_choice', { choice: c, via: via || 'click' });
    capture('duel_choice', { choice: c, via: via || 'click' });
    const next = applyChoice(before, c);
    setState({ tournament: next });
    navigate('#/tournament', { force: true });
  }
}

function renderAllEliminated(navigate) {
  const wrap = document.createElement('div');
  wrap.className = 'empty-state';
  wrap.innerHTML = `
    <h2>Tous éliminés !</h2>
    <p>Personne n'a survécu. Que faire ?</p>
  `;
  const actions = document.createElement('div');
  actions.style.display = 'flex';
  actions.style.gap = '12px';
  actions.style.flexWrap = 'wrap';
  actions.style.justifyContent = 'center';

  const restart = document.createElement('button');
  restart.type = 'button';
  restart.className = 'btn btn--primary';
  restart.textContent = 'Rejouer un tournoi';
  restart.addEventListener('click', () => {
    const t = getState().tournament;
    setState({ tournament: restartFromInitial(t) });
    track('tournament_restart', { reason: 'all_eliminated' });
    capture('tournament_restart', { reason: 'all_eliminated' });
    navigate('#/tournament', { force: true });
  });

  const discoverBtn = document.createElement('button');
  discoverBtn.type = 'button';
  discoverBtn.className = 'btn';
  discoverBtn.textContent = 'Je sais pas quoi regarder';
  discoverBtn.addEventListener('click', () => {
    track('tournament_to_discover', { reason: 'all_eliminated' });
    navigate('#/discover');
  });

  actions.appendChild(restart);
  actions.appendChild(discoverBtn);
  wrap.appendChild(actions);
  return wrap;
}

function escape(s) {
  const d = document.createElement('div');
  d.textContent = s;
  return d.innerHTML;
}
