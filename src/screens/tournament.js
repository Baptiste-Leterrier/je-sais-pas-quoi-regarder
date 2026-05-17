import { getState, setState } from '../state/store.js';
import { applyChoice, nextDuel, getRoundLabel, restartFromInitial } from '../lib/tournament.js';
import { track } from '../analytics/umami.js';
import { duelCard } from '../components/duelCard.js';
import { topbar } from './_topbar.js';

export function renderTournament(root, navigate) {
  const t = getState().tournament;
  if (!t) {
    navigate('#/select');
    return;
  }

  root.innerHTML = '';
  root.appendChild(topbar({ navigate, backHref: '#/select' }));

  const shell = document.createElement('main');
  shell.className = 'shell';

  if (t.status === 'finished') {
    setState({ finalChoice: t.winner });
    track('tournament_completed', {
      winner_id: t.winner.id,
      winner_type: t.winner.type,
      winner_year: t.winner.year,
      total_candidates: t.initial.length,
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

  const progress = document.createElement('div');
  progress.className = 'tournament__progress';
  const remaining = t.queue.length + t.winners.length;
  progress.innerHTML = `
    <span>${getRoundLabel(t)}</span>
    <span>${remaining} en lice</span>
  `;
  tournamentEl.appendChild(progress);

  if (duel.type === 'bye') {
    const byeBlock = document.createElement('div');
    byeBlock.className = 'empty-state';
    byeBlock.innerHTML = `
      <h2>${duel.a.title} passe au tour suivant</h2>
      <p>Pas de duel disponible (nombre impair).</p>
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
    const duelEl = document.createElement('div');
    duelEl.className = 'duel';
    duelEl.appendChild(duelCard(duel.a, () => choose('a')));
    duelEl.appendChild(duelCard(duel.b, () => choose('b')));
    tournamentEl.appendChild(duelEl);

    const noneWrap = document.createElement('div');
    noneWrap.className = 'duel__none';
    const noneBtn = document.createElement('button');
    noneBtn.type = 'button';
    noneBtn.className = 'btn btn--ghost';
    noneBtn.textContent = 'Aucun des deux';
    noneBtn.addEventListener('click', () => choose('none'));
    noneWrap.appendChild(noneBtn);
    tournamentEl.appendChild(noneWrap);
  }

  shell.appendChild(tournamentEl);
  root.appendChild(shell);

  function choose(c) {
    const before = getState().tournament;
    track('duel_choice', { round: before.round, choice: c });
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
    <p>Personne n'a survécu à ce tour. Que faire ?</p>
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
