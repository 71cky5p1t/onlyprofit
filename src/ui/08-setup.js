  // ---------- setup ----------
  function seg(key, opts) { return `<div class="seg">${opts.map(([v, l]) => `<button data-a="set" data-k="${key}" data-v="${v}" aria-pressed="${String(setup[key]) === String(v)}">${l}</button>`).join('')}</div>`; }
  function setupHTML() {
    return `<div class="wrap"><div class="setup">
      <div class="setup-hero"><span class="label">One human, the rest bots</span><h1>Only Profit</h1>
        <p>Inherit someone else's mess, hand it in under an anonymous cover page, and find out whose name was on it only once it's approved. Hit the profit target in five quarters, or quietly make sure nobody does.</p></div>
      <div class="setup-body">
        <div class="field"><span class="label">Employees</span>${seg('players', [[4, '4'], [5, '5'], [6, '6'], [7, '7'], [8, '8']])}</div>
        <div class="field"><span class="label">Your seat</span>${seg('spectate', [[false, 'Play'], [true, 'Watch the bots']])}</div>
        <div class="field"><span class="label">Loyal bots</span>${seg('loyalTier', [['smart', 'Smart'], ['basic', 'Basic'], ['naive', 'Gullible']])}</div>
        <div class="field"><span class="label">Saboteur bots</span>${seg('sabTier', [['smart', 'Smart'], ['patient', 'Patient'], ['blatant', 'Blatant']])}</div>
        <div class="field"><span class="label">Company</span>${seg('brand', BRANDS.map(b => [b.id, b.name]))}</div>
        <div class="field"><span class="label">Cards</span>${seg('cards', [['paper', 'Paper'], ['colour', 'Colour']])}</div>
        <div class="field"><span class="label">Target</span>${seg('easy', [[false, 'Standard'], [true, 'Easy mode (−3)']])}</div>
        <div class="field"><label class="label" for="seed">Seed (optional, to replay a deal)</label><input class="input" id="seed" data-in="seed" inputmode="numeric" placeholder="Random" value="${esc(setup.seed)}" style="max-width:200px"></div>
        <details class="rules"><summary>The quarter, in brief</summary><ol>
          <li><b>Work.</b> The 3 cards you inherit are your proposal. Draw 3 more. Spend 3 hours of overtime: swap a card in (1, then 2), re-deal all three (2), or show one card to the table (1). Stamp it, then make a cover page: template, subject line, font, clip-art.</li>
          <li><b>Decide + Reveal.</b> Proposals land shuffled and anonymous, and memos on the bulletin board say who left whom a mess. The CEO nominates one; the Board (everyone else) ratifies it or opens it. If an opened nominee disappoints, the best-looking proposal goes through instead, the nominee is unmasked, and a CEO caught pushing their own sits out their next turn as CEO. Profit moves and the approved author is unmasked. Rejected proposals pass, unopened, to that department's next manager. The table may issue a Written Warning; two means you're stood down.</li>
          <li><b>Effect Modifiers.</b> Four Modifiers rewrite the other two cards: ∅ cancels them, ×2 doubles them, ≥0 stops them losing, ⇅ flips them. Each also has its own value.</li>
          <li><b>After Q5.</b> The table may name a saboteur. Right, and Clawback reverses every losing policy they wrote (at least +3). Wrong costs −3. Audit and Whistleblower ties are drawn at random (a tied Whistleblower names nobody).</li></ol></details>
        <div class="setup-foot"><button class="btn primary" data-a="start">Start the game</button><span class="hint">About 10 minutes against bots.</span></div>
      </div></div></div>`;
  }
