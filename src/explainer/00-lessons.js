  // [id, tab name, narrator line, seconds]. The line is the caption and the voice script, word for word.
  const LESSONS = [
    ['welcome', 'Welcome', 'Welcome aboard. Please enjoy this mandatory induction. Enjoyment is also mandatory.', 5],
    ['goal', 'The target', 'You’ve got five quarters to hit the profit target. Hit it, and everyone keeps their job. Probably.', 7],
    ['saboteurs', 'Saboteurs', 'Some of your colleagues may be quietly sinking the company. Maybe one. Maybe two. Maybe nobody, and we’re just like this.', 8],
    ['inherit', 'Handover', 'Each quarter, you run a department. You inherit the last manager’s work. It’s yours now. Congratulations.', 8],
    ['policy', 'Policy', 'One Action. One Target. One Modifier. Read together, that’s a policy. Add up the marks. A question mark is a coin toss.', 8],
    ['overtime', 'Overtime', 'You’ll draw some spares. Overtime hours buy you swaps, or show a card to the whole table. You get three hours. They’re unpaid.', 9],
    ['stamp', 'The stamp', 'Then stamp it. The pencil tick marks the honest answer. You can lie. You can also be put on a Performance Improvement Plan.', 8],
    ['cover', 'Cover page', 'Dress it up with a cover page. Nobody knows who wrote what. That’s the whole point.', 7],
    ['ceo', 'The CEO', 'Each quarter, someone has a go as CEO, and picks one proposal from the pile.', 6],
    ['board', 'The Board', 'Everyone else is the Board. Ratify it, or open it up. If it’s dodgy, a better one goes through instead. The CEO has some explaining to do.', 10],
    ['approved', 'Approved', 'Only the approved policy gets a name on it. Profit moves. Everyone acts like they saw it coming.', 7],
    ['endgame', 'Year end', 'After quarter five, the table names a saboteur. Get it right, and their damage is reversed. Get it wrong, and that’s an unfair dismissal claim. Best record on the winning side is Employee of the Year.', 12],
    ['signoff', 'Sign-off', 'That concludes your induction. The clock starts now. Please look busy.', 5]
  ];
  // recorded lines drop in as assets/audio/induction/welcome.mp3 (or vo-01-welcome.mp3) and so on
  const voiceClip = i => 'vo-' + String(i + 1).padStart(2, '0') + '-' + LESSONS[i][0];
