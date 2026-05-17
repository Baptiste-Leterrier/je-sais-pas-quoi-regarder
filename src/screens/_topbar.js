export function topbar({ navigate, backHref = '#/' }) {
  const bar = document.createElement('header');
  bar.className = 'shell';
  bar.style.paddingTop = '16px';
  bar.style.paddingBottom = '0';

  const inner = document.createElement('div');
  inner.className = 'topbar';

  const brand = document.createElement('button');
  brand.type = 'button';
  brand.className = 'topbar__brand';
  brand.innerHTML = `Je c'pas <span class="accent">koi</span> regarder`;
  brand.addEventListener('click', () => navigate('#/'));
  inner.appendChild(brand);

  if (backHref) {
    const back = document.createElement('button');
    back.type = 'button';
    back.className = 'topbar__back';
    back.textContent = '← Retour';
    back.addEventListener('click', () => navigate(backHref));
    inner.appendChild(back);
  }

  bar.appendChild(inner);
  return bar;
}
