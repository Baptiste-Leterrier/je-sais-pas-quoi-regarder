export function searchBar({ placeholder = 'Rechercher un film ou une série…', onChange, initialValue = '' }) {
  const wrap = document.createElement('div');
  wrap.className = 'search-bar';

  const input = document.createElement('input');
  input.type = 'search';
  input.className = 'search-bar__input';
  input.placeholder = placeholder;
  input.autocomplete = 'off';
  input.spellcheck = false;
  input.value = initialValue;
  wrap.appendChild(input);

  let timer = null;
  input.addEventListener('input', () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => onChange(input.value), 300);
  });

  return { el: wrap, input };
}
