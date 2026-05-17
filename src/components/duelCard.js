export function duelCard(movie, onChoose) {
  const el = document.createElement('button');
  el.type = 'button';
  el.className = 'duel-card';
  el.setAttribute('aria-label', `Choisir ${movie.title}`);

  const poster = document.createElement('div');
  poster.className = 'duel-card__poster';
  if (movie.posterLarge || movie.poster) {
    poster.style.backgroundImage = `url(${movie.posterLarge || movie.poster})`;
  }
  el.appendChild(poster);

  const body = document.createElement('div');
  body.className = 'duel-card__body';

  const title = document.createElement('div');
  title.className = 'duel-card__title';
  title.textContent = movie.title;
  body.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'duel-card__meta';
  const typeLabel = movie.type === 'tv' ? 'Série' : 'Film';
  meta.textContent = movie.year ? `${typeLabel} · ${movie.year}` : typeLabel;
  body.appendChild(meta);

  el.appendChild(body);
  el.addEventListener('click', () => onChoose(movie));
  return el;
}
