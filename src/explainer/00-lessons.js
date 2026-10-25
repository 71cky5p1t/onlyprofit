  // [id, tab name, narrator line, seconds]. The line is the caption and the voice script, word for word.
  const LESSONS = [
    ['welcome', 'Welcome', 'Welcome aboard. Please enjoy this mandatory induction. Enjoyment is also mandatory.', 5],
    ['goal', 'The target', 'You have five quarters to hit the profit target. Hit it, and everyone keeps their job. Probably.', 7],
    ['saboteurs', 'Saboteurs', 'Some of your colleagues may be quietly sinking the company. Maybe one. Maybe two. Maybe nobody, and we’re just like this.', 8],
    ['inherit', 'Handover', 'Each quarter you run a department, and you inherit the last manager’s work. Three cards. Congratulations, they’re yours now.', 8],
    ['policy', 'Policy', 'One Action, one Target, one Modifier. That’s a policy. Every card has a value. Question marks are a coin toss.', 8],
    ['overtime', 'Overtime', 'You’ll draw some spares. Overtime hours buy you swaps, or show a card to the whole table. You get three hours. They’re unpaid.', 9],
    ['stamp', 'The stamp', 'Then stamp it. The pencil tick marks the honest answer. Lying is an option. So is a Performance Improvement Plan.', 8],
    ['cover', 'Cover page', 'Dress it up with a cover page. Nobody knows who wrote what. That’s the whole point.', 7],
    ['ceo', 'The CEO', 'Every quarter, someone takes a turn as CEO, and picks one proposal from the pile.', 6],
    ['board', 'The Board', 'Everyone else is the Board. Ratify it, or open it up. If it stinks, a better one goes through instead, and the CEO has some explaining to do.', 10],
    ['approved', 'Approved', 'Only the approved policy gets a name on it. Profit moves. Everyone acts like they saw it coming.', 7],
    ['endgame', 'Year end', 'After quarter five, the table names a saboteur. Right, and their damage is reversed. Wrong, and it’s a wrongful dismissal claim. The best record on the winning side is Employee of the Year.', 12],
    ['signoff', 'Sign-off', 'That concludes your induction. The clock starts now. Please look busy.', 5]
  ];
  // recorded lines drop in as assets/audio/induction/vo-01-welcome.mp3 and so on
  const voiceClip = i => 'vo-' + String(i + 1).padStart(2, '0') + '-' + LESSONS[i][0];
