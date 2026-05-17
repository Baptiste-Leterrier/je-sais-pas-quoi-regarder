export function movieCard(movie, { inBasket, onAdd, onRemove }) {
  const el = document.createElement('article');
  el.className = 'movie-card';

  const poster = document.createElement('div');
  poster.className = 'movie-card__poster';
  if (movie.poster) poster.style.backgroundImage = `url(${movie.poster})`;
  el.appendChild(poster);

  const body = document.createElement('div');
  body.className = 'movie-card__body';

  const title = document.createElement('div');
  title.className = 'movie-card__title';
  title.textContent = movie.title;
  body.appendChild(title);

  const meta = document.createElement('div');
  meta.className = 'movie-card__meta';
  const typeLabel = movie.type === 'tv' ? 'Série' : 'Film';
  meta.textContent = movie.year ? `${typeLabel} · ${movie.year}` : typeLabel;
  body.appendChild(meta);

  const action = document.createElement('button');
  action.type = 'button';
  action.className = 'movie-card__add';
  if (inBasket) {
    action.classList.add('movie-card__add--added');
    action.textContent = 'Retirer';
    action.addEventListener('click', () => onRemove?.(movie));
  } else {
    action.textContent = 'Ajouter';
    action.addEventListener('click', () => onAdd?.(movie));
  }
  body.appendChild(action);

  el.appendChild(body);
  return el;
}
