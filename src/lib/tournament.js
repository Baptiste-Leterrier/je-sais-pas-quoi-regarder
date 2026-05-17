import { shuffle } from './shuffle.js';

export function createTournament(candidates) {
  return {
    initial: candidates.slice(),
    queue: shuffle(candidates),
    winners: [],
    round: 1,
    duelIndex: 0,
    totalDuels: estimateDuels(candidates.length),
    eliminated: [],
  };
}

function estimateDuels(n) {
  if (n <= 1) return 0;
  return n - 1;
}

export function nextDuel(t) {
  if (t.queue.length === 0) return null;
  if (t.queue.length === 1) {
    return { type: 'bye', a: t.queue[0] };
  }
  return { type: 'duel', a: t.queue[0], b: t.queue[1] };
}

export function applyChoice(t, choice) {
  const duel = nextDuel(t);
  if (!duel) return t;

  const next = {
    ...t,
    queue: t.queue.slice(),
    winners: t.winners.slice(),
    eliminated: t.eliminated.slice(),
  };

  if (duel.type === 'bye') {
    next.winners.push(duel.a);
    next.queue = next.queue.slice(1);
    return advanceRoundIfNeeded(next);
  }

  next.queue = next.queue.slice(2);
  next.duelIndex += 1;

  if (choice === 'a') {
    next.winners.push(duel.a);
    next.eliminated.push(duel.b);
  } else if (choice === 'b') {
    next.winners.push(duel.b);
    next.eliminated.push(duel.a);
  } else {
    next.eliminated.push(duel.a, duel.b);
  }

  return advanceRoundIfNeeded(next);
}

function advanceRoundIfNeeded(t) {
  if (t.queue.length > 0) return t;

  if (t.winners.length === 0) {
    return { ...t, status: 'all-eliminated' };
  }

  if (t.winners.length === 1) {
    return { ...t, status: 'finished', winner: t.winners[0] };
  }

  return {
    ...t,
    queue: shuffle(t.winners),
    winners: [],
    round: t.round + 1,
    duelIndex: 0,
  };
}

export function restartFromInitial(t) {
  return createTournament(t.initial);
}

export function getRoundLabel(t) {
  const remaining = t.queue.length + t.winners.length;
  if (remaining <= 2) return 'Finale';
  if (remaining <= 4) return 'Demi-finale';
  if (remaining <= 8) return 'Quart de finale';
  return `Tour ${t.round}`;
}
