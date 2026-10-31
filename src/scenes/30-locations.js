// Ten companies. accent is the brand colour and only appears on things the company owns.
// Placement: [prop, variant, x, y, opts]; y is the ground contact line, size scales with y unless opts.s says otherwise.
// opts: s (scale ×), flip, a ('drive' | 'wander' | 'hover'), t (drive seconds), txt/sub/len/price (prop text).
(() => {
  const L = OPS.locs;

  L.party = { name: 'Jumbo Joy Party Hire', short: 'JUMBO JOY', slogan: 'Fun for the whole family*', palette: { accent: '#ff4f8b', accent2: '#3f7fd0' },
    back: 'suburb', ground: ['grass', '#7cbc5c'], sky: { clouds: 4, birds: 1 },
    props: [
      ['tree', 'gum', 150, 660, { s: 1.2 }], ['fence', 'picket', 520, 650, { len: 640 }], ['bouncycastle', 'castle', 760, 700, { s: 1.2 }],
      ['balloon', 'bunch', 300, 652], ['balloon', 'escaped', 980, 640], ['tree', 'round', 1450, 662],
      ['van', 'party', 1240, 730, { s: 1.1 }], ['bbq', 'snags', 470, 760], ['person', 'suit', 410, 790],
      ['campchair', 'dad', 1010, 800, { s: 1.1 }], ['esky', 'open', 1100, 812], ['balloon', 'sad', 640, 840],
      ['bin', 'overflow', 1460, 820], ['bird', 'ibis', 1530, 850], ['sign', 'aframe', 230, 850, { txt: 'CLOWN $49', sub: 'NO REFUNDS' }]
    ] };

  L.funeral = { name: 'Eternal Rest Funeral Group', short: 'ETERNAL REST', slogan: 'You go, we tidy', palette: { accent: '#6b4f8a', accent2: '#c9a24a' },
    back: 'hills', ground: ['grass', '#6c9a5a'], sky: { clouds: 3, kind: 'rain', rain: true },
    props: [
      ['tree', 'dead', 230, 668, { s: 1.3 }], ['chapel', 'chapel', 800, 700, { s: 1.15 }], ['tree', 'gum', 1400, 668],
      ['bird', 'crow', 262, 560, { s: .8 }], ['headstone', 'cross', 1210, 700], ['headstone', 'round', 1290, 712, { txt: 'GARY' }],
      ['headstone', 'cheap', 1370, 724, { txt: 'TBC' }], ['lamp', 'street', 470, 730], ['van', 'hearse', 330, 790],
      ['coffin', 'display', 1060, 800, { price: '$4,999' }], ['coffin', 'budget', 1240, 826], ['candle', 'tall', 640, 800], ['candle', 'short', 676, 806],
      ['wreath', 'sorry', 960, 812], ['person', 'mourner', 560, 838], ['person', 'suit', 1120, 860], ['headstone', 'pet', 1480, 850, { txt: 'REX' }]
    ] };

  L.mine = { name: 'Deep Pit Resources', short: 'DEEP PIT', slogan: 'Digging deeper for you', palette: { accent: '#ff7a1a', accent2: '#3d3b4c' },
    back: 'pit', ground: ['dirt', '#c9845a'], sky: { clouds: 2, birds: 2 },
    props: [
      ['excavator', 'dig', 1150, 680], ['dumptruck', 'loaded', 600, 700, { a: 'drive', t: 26 }], ['dust', 'brown', 1260, 690],
      ['donga', 'office', 230, 720], ['flag', 'brand', 380, 724], ['lamp', 'flicker', 120, 760], ['fence', 'site', 900, 770, { len: 400 }],
      ['person', 'hivis', 470, 800], ['person', 'hivis', 530, 812], ['cone', 'up', 700, 830], ['cone', 'down', 760, 840],
      ['van', 'ute', 1360, 840], ['rock', 'boulder', 1530, 850], ['tree', 'dead', 1520, 770, { s: .7 }], ['bird', 'crow', 610, 860]
    ] };

  L.retire = { name: 'Sunny Acres Retirement Living', short: 'SUNNY ACRES', slogan: 'Waitlist moving quickly', palette: { accent: '#2f9e8a', accent2: '#ffd45a' },
    back: 'suburb', ground: ['grass', '#82be62'], sky: { clouds: 3 },
    props: [
      ['units', 'units', 700, 690], ['tree', 'gum', 1170, 680], ['sign', 'bingo', 260, 710, { txt: 'TONIGHT 7PM', sub: 'BYO OXYGEN' }],
      ['bush', 'flower', 420, 730], ['bush', 'flower', 990, 724], ['lamp', 'street', 1300, 744], ['van', 'ambulance', 1350, 800],
      ['fence', 'picket', 640, 760, { len: 520 }], ['scooter', 'red', 300, 830, { a: 'drive', t: 70 }], ['person', 'nurse', 1010, 830],
      ['person', 'retiree', 1080, 850], ['bird', 'ibis', 160, 860], ['headstone', 'cheap', 1550, 860, { txt: 'ROOM 4' }]
    ] };

  L.pets = { name: 'Rainbow Bridge Pet Cremation', short: 'RAINBOW BRIDGE', slogan: 'Same-day ashes', palette: { accent: '#e2617a', accent2: '#ffd45a' },
    back: 'hills', ground: ['grass', '#78b25a'], sky: { clouds: 3 },
    props: [
      ['shed', 'crematorium', 820, 700, { txt: 'FAREWELL' }], ['tree', 'round', 380, 676], ['sign', 'pylon', 240, 720, { sub: 'Same-day ashes' }],
      ['headstone', 'pet', 1120, 720, { txt: 'REX' }], ['headstone', 'pet', 1190, 726, { txt: 'MOGGY' }], ['headstone', 'pet', 1260, 732, { txt: 'FISH?' }],
      ['bush', 'round', 1420, 726], ['van', 'ute', 520, 800], ['bin', 'overflow', 1080, 820], ['dog', 'kelpie', 760, 850],
      ['dog', 'sausage', 1300, 850], ['person', 'suit', 940, 846], ['bird', 'crow', 1110, 812]
    ] };

  L.office = { name: 'Apex Synergy Holdings', short: 'APEX', slogan: 'Leveraging tomorrow, today', palette: { accent: '#2f6bff', accent2: '#ffd45a' },
    back: 'city', ground: ['carpark', '#7c8294'], sky: { clouds: 3, birds: 1 },
    props: [
      ['tower', 'wide', 420, 650], ['tower', 'tall', 960, 660], ['helicopter', 'hover', 1300, 380, { s: .8 }], ['flag', 'brand', 700, 690],
      ['flag', 'halfmast', 1220, 690], ['lamp', 'street', 230, 760], ['lamp', 'street', 1440, 760], ['vending', 'snacks', 1180, 790],
      ['person', 'suit', 600, 820], ['person', 'suit', 660, 830], ['person', 'suit', 1290, 840], ['bin', 'wheelie', 1100, 840], ['bird', 'ibis', 1050, 870]
    ] };

  L.motel = { name: 'Sunset Motor Inn', short: 'SUNSET', slogan: 'Hourly rates available', palette: { accent: '#ff8a3a', accent2: '#3f8f8a' },
    back: 'range', ground: ['carpark', '#8a8a96'], sky: { clouds: 2 },
    props: [
      ['motel', 'motel', 820, 700, { s: 1.15 }], ['tree', 'palm', 260, 700], ['sign', 'neon', 340, 730, { txt: 'SUNSET' }], ['tree', 'palm', 1420, 704],
      ['vending', 'ice', 1220, 740], ['pool', 'green', 800, 800], ['lamp', 'flicker', 1340, 770], ['van', 'ute', 220, 850],
      ['person', 'dad', 1160, 856], ['bin', 'overflow', 1490, 846], ['bird', 'gull', 520, 860]
    ] };

  L.chook = { name: 'Happy Hen Poultry', short: 'HAPPY HEN', slogan: 'Free range-ish', palette: { accent: '#e8a21c', accent2: '#e2463c' },
    back: 'hills', ground: ['dirt', '#b9a06a'], sky: { clouds: 3 },
    props: [
      ['shed', 'factory', 760, 700, { txt: 'HAPPY HEN' }], ['fence', 'chain', 1230, 710, { len: 480 }], ['sign', 'billboard', 260, 720, { txt: 'Happy Hen', sub: 'Free range-ish' }],
      ['flag', 'brand', 1040, 720], ['crate', 'chooks', 1000, 790], ['crate', 'chooks', 1090, 800], ['van', 'reefer', 500, 830, { a: 'drive', t: 34 }],
      ['person', 'chef', 1180, 830], ['chicken', 'white', 1360, 850, { a: 'wander' }], ['chicken', 'brown', 300, 870, { a: 'wander' }], ['cone', 'up', 1500, 860]
    ] };

  L.dental = { name: 'Budget Smiles Dental', short: 'BUDGET SMILES', slogan: 'Gentle-ish since 2019', palette: { accent: '#2fb5d6', accent2: '#ff5d8f' },
    back: 'suburb', ground: ['carpark', '#858a98'], sky: { clouds: 3, birds: 1 },
    props: [
      ['shopfront', 'dental', 650, 700, { txt: 'BUDGET SMILES' }], ['shopfront', 'pawn', 960, 700], ['sign', 'tooth', 300, 720], ['pole', 'power', 1240, 710],
      ['tree', 'round', 1420, 712], ['sign', 'aframe', 470, 790, { txt: 'WHITENING', sub: '$19 OR BEST' }], ['person', 'dentist', 560, 810],
      ['person', 'suit', 1110, 820], ['lamp', 'street', 160, 800], ['bin', 'wheelie', 840, 812], ['bird', 'gull', 1280, 860], ['van', 'ute', 1450, 870]
    ] };

  L.wharf = { name: "Neptune's Catch Seafood", short: "NEPTUNE'S", slogan: 'Fresh-ish from the ocean', palette: { accent: '#e2463c', accent2: '#2f6fae' },
    back: 'sea', ground: ['wharf', '#b79a76'], groundY: 760, sky: { clouds: 3, birds: 3 },
    props: [
      ['boat', 'trawler', 520, 700], ['boat', 'tinnie', 1180, 680, { s: .8 }], ['sign', 'pylon', 1400, 790], ['van', 'reefer', 1160, 820],
      ['crate', 'fish', 300, 800], ['crate', 'fish', 380, 808], ['bird', 'gull', 330, 760, { s: .9 }], ['lamp', 'street', 120, 820],
      ['person', 'chef', 640, 840], ['bin', 'overflow', 860, 846], ['bird', 'gull', 900, 870], ['bird', 'gull', 760, 880]
    ] };
})();
