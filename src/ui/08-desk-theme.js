  const DESK_THEMES = [
    { id: 'oak', name: 'Warm oak', detail: 'The corner office' },
    { id: 'graphite', name: 'Graphite', detail: 'The night shift' },
    { id: 'mint', name: 'Mint laminate', detail: 'Accounts payable' }
  ];
  let deskTheme = 'oak';
  try {
    const saved = localStorage.getItem('op-desk-theme');
    if (DESK_THEMES.some(t => t.id === saved)) deskTheme = saved;
  } catch (e) {}

  function applyDeskTheme() {
    document.documentElement.dataset.deskTheme = deskTheme;
  }

  function deskThemePicker() {
    return `<fieldset class="desk-theme-picker"><legend>Your desk</legend><div class="desk-theme-options">${DESK_THEMES.map(t => `<button type="button" class="desk-theme-option" data-desk-theme="${t.id}" aria-pressed="${deskTheme === t.id}" aria-label="${t.name}: ${t.detail}"><span class="desk-swatch desk-swatch-${t.id}" aria-hidden="true"><i></i><b></b></span><span class="desk-theme-name">${t.name}</span><small>${t.detail}</small></button>`).join('')}</div></fieldset>`;
  }

  $app.addEventListener('click', e => {
    const button = e.target.closest('[data-desk-theme]');
    if (!button || !DESK_THEMES.some(t => t.id === button.dataset.deskTheme)) return;
    deskTheme = button.dataset.deskTheme;
    try { localStorage.setItem('op-desk-theme', deskTheme); } catch (e) {}
    applyDeskTheme();
    $app.querySelectorAll('.desk-theme-option').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.deskTheme === deskTheme)));
  });
