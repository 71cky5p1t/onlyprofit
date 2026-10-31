// Six laps, one per time of day. tint multiplies every body colour; emit/glow light windows, neon and candles.
OPS.times = [
  { id: 'morning', lap: 1, clock: '7:40 am', sky: ['#8cc2ef', '#ffd9bb'], tint: '#ffcfa6', ta: .16, emit: 0, glow: 0, stars: 0,
    sun: [290, 430, '#fff3cf', 46], haze: ['#ffdcc0', .34], shadow: { dx: 1, len: 1.8, a: .2 } },
  { id: 'midday', lap: 2, clock: '12:15 pm', sky: ['#3e9de9', '#c4e7ff'], tint: '#ffffff', ta: 0, emit: 0, glow: 0, stars: 0,
    sun: [820, 130, '#fffbe6', 40], haze: ['#d2ecff', .3], shadow: { dx: .1, len: .9, a: .26 } },
  { id: 'arvo', lap: 3, clock: '3:30 pm', sky: ['#4e95da', '#ffe0a2'], tint: '#ffc677', ta: .18, emit: 0, glow: 0, stars: 0,
    sun: [1290, 330, '#fff0bd', 44], haze: ['#ffe4b0', .34], shadow: { dx: -1, len: 1.6, a: .22 } },
  { id: 'dusk', lap: 4, clock: '6:50 pm', sky: ['#383a8a', '#ff8d5f'], tint: '#a95e9a', ta: .36, emit: .85, glow: .55, stars: .15,
    sun: [1420, 610, '#ffa266', 58], haze: ['#ff9f7a', .42], shadow: { dx: -1, len: 2.8, a: .16 } },
  { id: 'night', lap: 5, clock: '10:20 pm', sky: ['#0c1136', '#2c3b7d'], tint: '#272f6a', ta: .6, emit: 1, glow: 1, stars: .85,
    moon: [1190, 160, '#f4f0d8', 30], haze: ['#2c3b7d', .45], shadow: { dx: 0, len: 1, a: .12 } },
  { id: 'small', lap: 6, clock: '3:10 am', sky: ['#04050d', '#151b37'], tint: '#141a36', ta: .72, emit: 1, glow: 1, stars: 1, late: true,
    moon: [330, 250, '#d8d6c4', 26], haze: ['#151b37', .5], shadow: { dx: 0, len: 1, a: .08 } }
];
OPS.time = id => OPS.times.find(t => t.id === id || t.lap === id) || OPS.times[1];
