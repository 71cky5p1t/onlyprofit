  // ---------- the CEO sticker, and what's left of it after it's peeled off ----------
  const PW = 66, PH = 28, PR = 3;
  const seeded = n => () => { n = (n + 0x6D2B79F5) | 0; let t = Math.imul(n ^ (n >>> 15), 1 | n); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  const pts = a => a.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(' ');
  const ceoText = `<text x="${PW / 2 - 3}" y="${PH / 2 + 4.2}" text-anchor="middle" font-family="Schibsted Grotesk, Helvetica Neue, Arial, sans-serif" font-weight="900" font-size="12" letter-spacing="2" fill="#2A200C">CEO</text>`;
  const gold = id => `<linearGradient id="${id}" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="#F6DE9A"/><stop offset=".55" stop-color="#E5C36F"/><stop offset="1" stop-color="#CFA650"/></linearGradient>`;
  // paper grain, multiplied over a face
  const grain = id => `<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.4" numOctaves="2" seed="3"/><feColorMatrix values="0 0 0 0 .35  0 0 0 0 .27  0 0 0 0 .1  0 0 0 -1.1 .62"/><feComposite in2="SourceGraphic" operator="in"/></filter>`;

  // a fresh sticker, one corner lifting where someone's already picked at it
  function ceoStickerSVG(seed) {
    const id = `cs${seed}`, f = 11, W = PW, H = PH;
    const body = `M${PR} 0H${W - PR}Q${W} 0 ${W} ${PR}V${H - f}L${W - f} ${H}H${PR}Q0 ${H} 0 ${H - PR}V${PR}Q0 0 ${PR} 0Z`;
    const flap = `M${W - f} ${H}L${W} ${H - f}Q${W - f * .55} ${H - f * .9} ${W - f - 2.2} ${H - f - 2.6}Q${W - f - .6} ${H - f * .45} ${W - f} ${H}Z`;
    return `<svg class="ceo-stk" viewBox="-6 -6 ${W + 12} ${H + 12}" aria-hidden="true"><defs>${gold(`${id}g`)}${grain(`${id}n`)}
      <linearGradient id="${id}b" x1="1" y1="1" x2=".55" y2=".55"><stop offset="0" stop-color="#D3CCB8"/><stop offset=".6" stop-color="#F3EEE1"/><stop offset="1" stop-color="#FFFDF7"/></linearGradient>
      <filter id="${id}s" x="-20%" y="-20%" width="140%" height="160%"><feGaussianBlur stdDeviation="1.1"/></filter>
      <clipPath id="${id}c"><path d="${body}"/></clipPath></defs>
      <path d="${body}" fill="#000" opacity=".3" filter="url(#${id}s)" transform="translate(.6 1.4)"/>
      <polygon points="${W - f},${H} ${W},${H - f} ${W},${H}" fill="#B89A50" opacity=".14"/>
      <g clip-path="url(#${id}c)"><path d="${body}" fill="url(#${id}g)"/><rect width="${W}" height="${H}" filter="url(#${id}n)" opacity=".55"/>${ceoText}
        <path d="M2 2.5H${W - 4}" stroke="#FFF6D6" stroke-width="1" opacity=".55"/>
        <path d="M${W - f - 1.2} ${H}L${W} ${H - f - 1.2}" stroke="#8C6E2C" stroke-width="1.4" opacity=".35"/>
        <path d="${flap}" fill="#000" opacity=".32" filter="url(#${id}s)" transform="translate(-1.6 -1.2)"/></g>
      <path d="${flap}" fill="url(#${id}b)"/><path d="M${W - f} ${H}L${W} ${H - f}" stroke="#A8915A" stroke-width=".5" opacity=".7"/></svg>`;
  }

  // a torn edge between two points: mostly forward, a little ragged
  function tear(r, x0, y0, x1, y1, n, amp) {
    const out = [];
    for (let k = 1; k < n; k++) {
      const t = k / n;
      out.push([x0 + (x1 - x0) * t + (r() - .5) * amp * .8, y0 + (y1 - y0) * t + (r() - .5) * 2 * amp]);
    }
    return out;
  }
  // what a peel leaves: a dirty glue ghost with a grime line at its edge, white backing fibres, a sliver of the old face, nail scratches
  function peelSVG(seed, age) {
    const r = seeded(seed * 7919 + 13), id = `pl${seed}`, W = PW, H = PH, a = Math.min(age, 4);
    const right = r() < .5, d = 16 + r() * 12, top = 3 + r() * 6, bot = 4 + r() * 8, ex = right ? W : 0, ix = right ? W - d : d;
    const x0 = right ? ix + top : ix - top, x1 = right ? ix - bot * .4 : ix + bot * .4;
    const patch = [[ex, 0], [x0, 0], ...tear(r, x0, 0, x1, H, 7, 3.2), [x1, H], [ex, H]];
    const fd = d * (.45 + r() * .25), fx = right ? W - fd : fd, f0 = fx + (right ? 2 : -2), f1 = fx + (right ? 3 : -3);
    const face = [[ex, 1.5], [f0, 1.5], ...tear(r, f0, 1.5, f1, H - 4, 5, 2.4), [f1, H - 4], [ex, H - 6]];
    const slivers = [0, 1].map(k => {
      const y = k ? H - 1 - r() * 1.4 : r() * 1.2, x = 6 + r() * (W - 30), len = 6 + r() * 14, th = (1.6 + r() * 1.8) * (k ? -1 : 1);
      return [[x, y], ...tear(r, x, y, x + len, y, 5, .8), [x + len, y + th * .3], ...tear(r, x + len, y + th, x, y + th, 5, .8)];
    });
    const scratches = [0, 1, 2].map(() => { const x = 8 + r() * (W - 16), y = 5 + r() * (H - 10), l = 5 + r() * 7, b = (r() - .5) * 5; return `<path d="M${x.toFixed(1)} ${y.toFixed(1)}q${(l / 2).toFixed(1)} ${b.toFixed(1)} ${l.toFixed(1)} ${(b * .3).toFixed(1)}"/>`; }).join('');
    const lx = 10 + r() * 40, ly = 6 + r() * 14;
    const rect = `x=".6" y=".6" width="${W - 1.2}" height="${H - 1.2}" rx="${PR}"`;
    return `<svg class="ceo-gone" viewBox="-6 -6 ${W + 12} ${H + 12}" aria-hidden="true"><defs>${gold(`${id}g`)}${grain(`${id}n`)}
      <filter id="${id}e" x="-10%" y="-20%" width="120%" height="140%"><feTurbulence type="fractalNoise" baseFrequency=".09" numOctaves="2" seed="${seed % 97}"/><feDisplacementMap in="SourceGraphic" scale="2.2"/></filter>
      <filter id="${id}f" x="-10%" y="-20%" width="120%" height="140%"><feTurbulence type="fractalNoise" baseFrequency="1.1" numOctaves="3" seed="${seed % 89}"/><feDisplacementMap in="SourceGraphic" scale="1.8"/></filter>
      <filter id="${id}d" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="1.9" numOctaves="1" seed="${seed % 83}"/><feColorMatrix values="0 0 0 0 .28  0 0 0 0 .24  0 0 0 0 .18  0 0 0 9 -5.6"/><feComposite in2="SourceGraphic" operator="in"/></filter>
      <linearGradient id="${id}l" x1="0" y1="0" x2="1" y2=".4"><stop offset=".25" stop-color="#fff" stop-opacity="0"/><stop offset=".42" stop-color="#fff" stop-opacity=".6"/><stop offset=".5" stop-color="#fff" stop-opacity="0"/></linearGradient>
      <clipPath id="${id}c"><rect width="${W}" height="${H}" rx="${PR}"/></clipPath><clipPath id="${id}p"><polygon points="${pts(face)}"/></clipPath></defs>
      <g filter="url(#${id}e)" style="mix-blend-mode:multiply">
        <rect ${rect} fill="#A89468" opacity="${(.09 + a * .025).toFixed(3)}"/>
        <rect ${rect} fill="none" stroke="#6F5E3C" stroke-width="1.1" opacity="${(.22 + a * .05).toFixed(2)}"/>
      </g>
      <rect ${rect} fill="url(#${id}l)" filter="url(#${id}e)" opacity=".8"/>
      <g clip-path="url(#${id}c)" style="mix-blend-mode:multiply">
        <rect width="${W}" height="${H}" filter="url(#${id}d)" opacity="${(.35 + a * .1).toFixed(2)}"/>
        <g stroke="#7A6A48" stroke-width=".45" fill="none" opacity=".4" stroke-linecap="round">${scratches}</g>
        <path d="M${lx.toFixed(1)} ${ly.toFixed(1)}c2-1.5 3 1 5-.5s2.5 1.2 4 .2" stroke="#6E6556" stroke-width=".35" fill="none" opacity="${(.25 + a * .08).toFixed(2)}"/>
      </g>
      <g clip-path="url(#${id}c)"><g filter="url(#${id}f)">
        <polygon points="${pts(patch)}" fill="#8C7C5C" opacity=".35" transform="translate(.35 .5)"/>
        <polygon points="${pts(patch)}" fill="#F7F2E4"/>
        <polygon points="${pts(patch)}" fill="#fff" filter="url(#${id}n)" opacity=".7"/>
        ${slivers.map(s => `<polygon points="${pts(s)}" fill="#F4EEDD"/>`).join('')}
        ${age < 2 ? `<g clip-path="url(#${id}p)"><rect width="${W}" height="${H}" fill="url(#${id}g)"/><rect width="${W}" height="${H}" filter="url(#${id}n)" opacity=".5"/>${ceoText}</g>` : ''}
      </g></g></svg>`;
  }
