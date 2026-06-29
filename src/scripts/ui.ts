export function initUI() {
  const nav = document.getElementById('nav');
  if (nav) addEventListener('scroll', () => nav.classList.toggle('scrolled', scrollY > 16), { passive: true });

  const root = document.documentElement;
  const toggle = document.getElementById('themeToggle');
  if (toggle) toggle.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('pf-theme', next); } catch (e) {}
  });

  // Follow the system preference until the user makes an explicit choice.
  matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
    let stored = null;
    try { stored = localStorage.getItem('pf-theme'); } catch (err) {}
    if (!stored) root.setAttribute('data-theme', e.matches ? 'dark' : 'light');
  });

  function countUp(el: HTMLElement) {
    const target = parseFloat(el.dataset.count || '0'), suf = el.dataset.suffix || '';
    const dur = 1000, start = performance.now();
    function step(t: number) {
      const p = Math.min((t - start) / dur, 1);
      const e = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * e) + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  const counted = new WeakSet<Element>();
  function reveal() {
    document.querySelectorAll<HTMLElement>('.reveal:not(.in)').forEach(el => {
      if (el.getBoundingClientRect().top < innerHeight * 0.92) {
        el.classList.add('in');
        el.querySelectorAll<HTMLElement>('[data-count]').forEach(n => {
          if (!counted.has(n)) { counted.add(n); countUp(n); }
        });
      }
    });
  }
  reveal();
  addEventListener('scroll', reveal, { passive: true });
  addEventListener('load', reveal);
  setTimeout(reveal, 400);
}
