const KIT_CSS = `html,body{min-height:0!important;height:auto!important} body{padding:22px 18px 28px} .kit{display:grid;gap:28px} .kit h4{margin:0 0 12px;font:800 11px/1 var(--f-body);letter-spacing:.14em;text-transform:uppercase;color:var(--on-table-2)}
    .row{display:flex;flex-wrap:wrap;gap:22px 16px;align-items:flex-start} .play{margin:0;padding:18px 14px;background:transparent;box-shadow:none;overflow:visible}
    .note{font:600 12px/1.3 var(--f-body);color:var(--on-table-2);max-width:14ch;margin-top:6px;text-align:center}
    .sw{display:grid;grid-template-columns:34px auto;column-gap:10px;align-items:center;min-width:150px} .sw i{grid-row:span 2;width:34px;height:34px;border-radius:50%;box-shadow:0 0 0 2px rgba(0,0,0,.2),0 2px 4px rgba(0,0,0,.4)} .sw b{font:800 13px/1.1 var(--f-body)} .sw span{font:400 11px/1.2 var(--f-seg);color:var(--on-table-2)}
    .type{display:grid;gap:10px;background:var(--stock);color:var(--ink);border-radius:4px;padding:18px 20px;box-shadow:var(--lift)} .type .a{font:900 34px/1 var(--f-body);letter-spacing:-.03em} .type .b{font:400 15px/1.5 var(--f-body);max-width:60ch} .type .c{font:400 30px/1 var(--f-seg);background:var(--lcd);color:var(--lcd-ink);padding:6px 10px;border-radius:4px;width:max-content}
    .piece{display:grid;justify-items:center;gap:6px} .slot{animation:none!important;width:96px;height:134px} .slot::after{display:none} .pages .pg{width:212px} .pages .pg .cp-w{--k:.74} .line{max-width:340px}
    .kback{width:88px;height:124px;border-radius:7px;display:grid;place-items:center;background:var(--mark) center / 40% no-repeat,radial-gradient(circle,transparent 0 22px,var(--brand) 22.5px 26px,transparent 26.5px),repeating-linear-gradient(45deg,rgba(255,255,255,.12) 0 4px,transparent 4px 9px),var(--brand);box-shadow:inset 0 0 0 5px var(--stock),inset 0 0 0 6px rgba(0,0,0,.2),var(--lift)} .kback.r{transform:rotate(6deg)}`;
  function kitHTML(op) {
    const C = (s, v, w, fx) => ({ s, v, w, fx });
    const card = (c, cls, extra) => op.cardHTML(c, cls, extra);
    const hrs = n => `<i class="hrs">${n}h</i>`, purse = left => `<span class="purse">${[0, 1, 2].map(k => `<i class="slotbox${k >= left ? ' punched' : ''}">${k + 1}</i>`).join('')}</span>`;
    const sw = (name, v) => `<div class="sw"><i style="background:var(${v})"></i><b>${name}</b><span>${v}</span></div>`;
    const page = (tpl, subject, stamp, art) => ({ id: '·', subject, stamp, style: { tpl, art }, revealed: [] });
    const SUBJ = { fax: 'Fwd: Pension Agility — Revised', memo: 'Synergy Alert: Customer Delight for Q3', wordart: 'Action Required: Break Room Monetisation', clipart: 'Low-Hanging Fruit: Bingo Night Synergies',
      report: 'Circling Back: Morale Recovery (Pilot)', dossier: 'Confidential: Inheritance Matchmaking', overhead: 'Granny Retention Drive', certificate: 'Speed Dating (90+) Going Forward' };
    const stamps = ['Risky', 'Rec', 'Rec', 'Risky', 'Rec', 'Not', 'Risky', 'Rec'];
    const pages = Object.keys(SUBJ).map((t, k) => `<div class="pg">${op.coverHTML(page(t, SUBJ[t], stamps[k]), { list: [{ id: '·' }] })}</div>`).join('');
    const said = { id: '·', revealed: [], audited: true, cards: [C(0, 2, 'Restructure'), C(1, 1, 'Next of Kin'), C(2, -2, 'Retroactively', 'x2')], resolved: [2, 1, -2] };
    const part = { id: '·', revealed: [0, 2], cards: [C(0, 2, 'Offshore'), C(1, 1, 'the Regional Office'), C(2, 2, 'In Perpetuity')] };
    return `<style>${KIT_CSS}</style><div class="kit">
    <section><h4>Values</h4><div class="play"><div class="row">${card(C(0, 2, 'Liquidate'))}${card(C(1, 1, 'Interns'))}${card(C(2, 0, 'Quietly'))}${card(C(0, -1, 'Rightsize'))}${card(C(1, -2, 'Union Relations'))}${card(C(2, 'V', 'Allegedly'))}</div></div></section>
    <section><h4>Effect Modifiers</h4><div class="play"><div class="row">${card(C(2, -1, 'With Thoughts and Prayers', 'null'))}${card(C(2, -2, 'Retroactively', 'x2'))}${card(C(2, -1, "Per Legal's Advice", 'shield'))}${card(C(2, 0, 'Without Consultation', 'flip'))}</div></div></section>
    <section><h4>Overtime</h4><div class="play"><div class="row" style="align-items:center;gap:26px">
      <div class="piece">${purse(3)}<span class="note">Three hours to give</span></div><div class="piece">${purse(1)}<span class="note">Two punched</span></div>
      <div class="piece"><div class="slot">${card(C(1, 1, 'Interns'), '', `<span class="tag">${hrs(2)}</span>`)}</div><span class="note">Price to swap in</span></div>
      <div class="piece"><div class="slot">${card(C(0, 2, 'Liquidate'), 'shown', `<span class="paid">${hrs(2)}</span>`)}</div><span class="note">Paid, and shown to the table</span></div>
      <div class="piece"><div class="slot">${card(C(2, 2, 'In Perpetuity'), 'broke', `<span class="tag">${hrs(3)}</span>`)}</div><span class="note">Can't afford</span></div></div></div></section>
    <section><h4>Cover pages</h4><div class="pages" style="justify-content:flex-start">${pages}</div></section>
    <section><h4>The policy, read out</h4><div class="row" style="align-items:center">${op.lineHTML(part)}${op.lineHTML(said, { all: true })}</div></section>
    <section><h4>Clip-art (${op.ART.length})</h4><div class="row" style="gap:10px">${op.ART.map(id => `<span style="display:grid;width:40px;height:40px;padding:4px;background:var(--stock);border-radius:2px">${op.artSVG(id)}</span>`).join('')}</div></section>
    <section><h4>Brand objects</h4><div class="row" style="align-items:center;gap:22px"><span class="logo-mark" style="width:56px;height:56px">${op.brandMark()}</span><div class="kback"></div><div class="kback r"></div><div class="placeholder sealed" style="width:146px;height:206px"></div></div></section>
    <section><h4>Colour</h4><div class="row">${sw('Baize', '--baize')}${sw('Card stock', '--stock')}${sw('Ink', '--ink')}${sw('Red tape', '--red')}${sw('Good news', '--good')}${sw('Brass', '--gold')}${sw('Action', '--suit-0')}${sw('Target', '--suit-1')}${sw('Modifier', '--suit-2')}${sw('Company', '--brand')}</div></section>
    <section><h4>Type</h4><div class="type"><div class="a">Restructure the Orphanage</div><div class="b">Schibsted Grotesk carries everything people read. Shareholders are mildly pleased. Bonuses have been deferred.</div><div class="c">+18.0</div></div></section></div>`;
  }
  const kit = document.getElementById('kit');
  kit.addEventListener('load', () => {
    kitBrand();
    const fit = () => { kit.style.height = kit.contentDocument.body.offsetHeight + 'px'; }; fit(); setTimeout(fit, 800); new ResizeObserver(fit).observe(kit.contentDocument.body);
  });
  kit.srcdoc = `<script>window.__opFreeze = true; window.__opBrand = ${JSON.stringify(brandId)}; window.__opCards = ${JSON.stringify(cardSet)}<\/script>` + PROTO;
