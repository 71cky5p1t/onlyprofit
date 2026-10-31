// End of the financial year: the verdict, the rankings, and everybody's receipts.
function renderEnd() {
  const s = ui.s, e = s.end, P = s.P;
  const nm = i => esc(P[i].name);
  const lap = Math.min(s.lap, PC.T.laps);
  const verdict = e.bust
    ? `<span class="label">Lap ${lap} · the tin is empty</span><h1>Royal Commission</h1><p>${nm(e.jailed)} had the most money, so ${P[e.jailed].human ? 'you take' : nm(e.jailed) + ' takes'} the fall. ${nm(e.winner)} ${P[e.winner].human ? 'walk' : 'walks'} away clean.</p>`
    : `<span class="label">End of financial year</span><h1>${P[e.winner].human ? 'Employee of the Year' : nm(e.winner) + ' wins'}</h1><p>The tin survived with ${money(s.tin)} left. ${P[e.winner].human ? 'Nobody suspects a thing.' : 'Richest at the end takes it.'}</p>`;
  const rows = e.ranked.map((i, k) => {
    const p = P[i], tag = i === e.winner ? 'Winner' : i === e.jailed ? 'Jailed' : '';
    return `<li class="${p.human ? 'me' : ''} ${tag.toLowerCase()}"><span class="pl num">${k + 1}</span><span class="nm">${nm(i)}</span>
      <span class="st">${p.pads}/${p.claims} padded${p.caught ? ` · caught ${p.caught}` : ''}${p.halo ? ` · ${p.halo} halo${p.halo > 1 ? 's' : ''}` : ''}</span>
      <b class="num">${money(p.bank)}</b>${tag ? `<i class="badge">${tag}</i>` : ''}</li>`;
  }).join('');
  const out = c => {
    const pad = c.claim - c.real;
    if (c.outcome === 'caught') return '<i class="o caught">Caught</i>';
    if (c.outcome === 'halo') return '<i class="o halo">Cleared</i>';
    if (c.outcome === 'shredded') return `<i class="o shred">Shredded</i>`;
    return pad > 0 ? `<i class="o pad">Got away with ${money(pad)}</i>` : '<i class="o ok">Honest</i>';
  };
  const ledger = s.claims.map((c, k) => `<tr class="${c.claim > c.real ? 'padded' : ''}">
      <td class="num">${k + 1}</td><td>${nm(c.seat)}</td><td class="it">${c.who ? esc(c.who.name) + ' ' : ''}<span class="${c.what.by != null ? 'wi' : ''}">${esc(c.what.name)}</span><small>${esc(c.sur)}</small></td>
      <td class="num">${money(c.claim)}</td><td class="num">${money(c.real)}</td><td>${out(c)}</td></tr>`).join('');
  app.innerHTML = `<main class="end">
    <section class="verdict ${e.bust ? 'bust' : 'ok'}">${verdict}</section>
    <ol class="rank">${rows}</ol>
    <section class="ledger"><h2>Everybody's receipts</h2>
      <div class="scroll"><table><thead><tr><th>#</th><th>Who</th><th>Item</th><th>Claimed</th><th>Real</th><th></th></tr></thead><tbody>${ledger}</tbody></table></div>
    </section>
    <div class="again"><button class="go" id="again">Another year</button><button class="ghost" id="home">Change staff</button></div>
  </main>`;
  app.querySelector('#again').onclick = startGame;
  app.querySelector('#home').onclick = () => { ui.screen = 'title'; ui.s = null; setScene(); render(); };
}
