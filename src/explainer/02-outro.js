  const flap = (a, b) => a === b ? `<b>${a}</b>` : `<b class="flap" data-a="${a}" data-b="${b}"></b>`;
  function outroHTML(stamped) {
    return `<div class="i-outro" aria-hidden="true">${stamped ? '' : '<span class="rubber big">Read &amp; Understood</span>'}
      <div class="tclock"><i class="chain"></i><div class="tc-body"><span class="tc-plate">Time &amp; Attendance</span>
      <div class="tc-face">${flap('0', '0')}${flap('8', '9')}<i>:</i>${flap('5', '0')}${flap('9', '0')}</div></div></div></div>`;
  }
