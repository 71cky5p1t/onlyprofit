  const start = data => { if (data && data.S) { S = data.S; draft = data.draft; setup = data.setup || setup; } render(); };
  if (window.claude && window.claude.hot && window.claude.hot.ready) window.claude.hot.ready(start); else start((window.claude && window.claude.hot && window.claude.hot.data) || {});
  window.__op = { get S() { return S; }, dispatch, brand: id => { setup.brand = id; render(); }, cards: m => { setup.cards = m; render(); }, BRANDS, markSVG, markURL,
    cardHTML, coverHTML, lineHTML, artSVG, ART, brandMark, look: (b, c) => { setup.brand = b; setup.cards = c; applyBrand(); } };
