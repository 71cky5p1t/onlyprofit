  // [id, tab name, narrator line, seconds]. The line is the caption and the voice script, word for word.
  const LESSONS = [
    ['welcome', 'Welcome', 'Welcome aboard. Please enjoy this mandatory induction. Enjoyment is also mandatory.', 5],
    ['goal', 'The target', 'The company has five quarters to hit its profit target. Hit it, and everyone keeps their job. Probably.', 6],
    ['saboteurs', 'Disgruntled', 'Some of you are Disgruntled, and want the company to sink. Your role memo will say if it’s you. Maybe it’s nobody, and we’re just bad at our jobs.', 8],
    ['inherit', 'Handover', 'Every quarter, you move to a new department and inherit the last manager’s three cards. Nobody can prove they weren’t yours. Congratulations.', 8],
    ['policy', 'Policy', 'Three cards make a proposal: an Action, a Target and a Modifier. Read as one sentence, the worse it sounds, the more it makes.', 8],
    ['overtime', 'Overtime', 'You also get spares. Spend overtime hours to swap one in, or turn a card face up so people trust you. The hours are unpaid.', 8],
    ['stamp', 'The stamp', 'Then stamp it: Recommended, Risky, or Not. The pencil tick marks the honest one. You can lie, but the CEO can check. Get caught, and you’re on a Performance Improvement Plan.', 9],
    ['cover', 'Cover page', 'Give it a cover page and drop it in the pile. No names. Nobody knows who wrote what.', 6],
    ['ceo', 'The CEO', 'Each quarter, someone takes a turn as CEO. They read the pile and pick one.', 5],
    ['board', 'The Board', 'Everyone else is the Board. Rubber-stamp the pick, or open it up. If there was a better one, that goes through instead, and the dud’s author is named.', 9],
    ['approved', 'Approved', 'Whatever goes through hits the books, and its author is named. Everyone acts like they saw it coming.', 6],
    ['endgame', 'Year end', 'After quarter five, you vote on who was Disgruntled. Right, and their damage is undone. Wrong, and the innocent one sues for unfair dismissal. Then we count the money.', 9],
    ['signoff', 'Sign-off', 'That concludes your induction. The clock starts now. Please look busy.', 5]
  ];
  // recorded lines drop in as assets/audio/induction/welcome.mp3 (or vo-01-welcome.mp3) and so on
  const voiceClip = i => 'vo-' + String(i + 1).padStart(2, '0') + '-' + LESSONS[i][0];
