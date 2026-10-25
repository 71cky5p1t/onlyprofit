// Card, subject-line and company words. Data only.
const OP_CONTENT = (() => {
  const SUITS = ['Action', 'Target', 'Modifier'];
  const WORDS = [
    ['Restructure', 'Outsource', 'Rightsize', 'Monetise', 'Gamify', 'Sunset', 'Offshore', 'Rebrand', 'Automate', 'Consolidate', 'Incentivise', 'Liquidate'],
    ['the Pension Fund', 'Employee Wellness', 'the Break Room', 'Customer Trust', 'Middle Management', 'the Interns', 'Legacy Systems', 'Quality Assurance', 'the Regional Office', 'Union Relations', 'Environmental Compliance', 'the Mascot'],
    ['Immediately', 'Without Consultation', 'Retroactively', 'At Scale', 'Going Forward', 'Off the Books', 'Pending Review', 'Indefinitely', 'With Thoughts and Prayers', "Per Legal's Advice", 'Ahead of Q4', 'In Perpetuity'],
  ];
  const VALUES = [2, 2, 2, 1, 1, 1, 1, 1, 0, 0, 0, 0, -1, -1, -1, -1, -1, -1, -2, -2, -2, -2, 'V', 'V'];
  const FX = [['With Thoughts and Prayers', 'null', -1], ['Retroactively', 'x2', -2], ["Per Legal's Advice", 'shield', -1], ['Without Consultation', 'flip', 0]];
  const NAMES = ['Gary', 'Denise', 'Trevor', 'Moira', 'Clive', 'Pam', 'Keith', 'Linda'];
  const DEPTS = ['Finance', 'Marketing', 'Human Resources', 'Legal', 'Operations', 'Compliance', 'R&D', 'Facilities'];
  const COLORS = ['manila', 'salmon', 'carbon', 'mint', 'gold'];
  const TRIMS = ['plain', 'airmail', 'confidential'];
  const SUBJ = [
    ['Re:', 'Fwd:', 'Action Required:', 'Quick Win:', 'Exciting News:', 'Per My Last Memo:', 'Circling Back:', 'Low-Hanging Fruit:', 'Confidential:', 'FYI:', 'Synergy Alert:', 'Town Hall Follow-Up:'],
    ['Wellness Optimisation', 'Pension Agility', 'Break Room Monetisation', 'Synergy Roadmap', 'Headcount Harmony', 'Customer Delight', 'Mandatory Fun Week', 'Coffee Rationalisation', 'The Paperless Paper Drive', 'Cultural Realignment', 'Stakeholder Journey', 'Vision 2000', 'Right-Sizing Our Family', 'Morale Recovery', 'Lean Lunch Hours'],
    ['(Urgent)', '— Phase II', '— Revised', 'Going Forward', 'for Q3', '(Do Not Forward)', 'v2 FINAL', '— A Win-Win', 'Effective Immediately', '(Pilot)', '— Thoughts?', '(Mandatory)'],
  ];
  // ~1 in 4 Targets, 3 Modifiers and some subject lines use the company's words
  const LEX = {
    op: { t: ['the Shareholders', 'the Bonus Pool', 'the Profit Target', 'the Founders\' Portrait', 'the Golden Parachutes', 'the Boardroom Bar'], m: ['For the Shareholders', 'Before the AGM'], subj: ['Profit Maximisation', 'Shareholder Joy', 'Bonus Pool Refresh'] },
    granny: { t: ['the Grannies', 'Bingo Night', 'the Mobility Scooters', 'Speed Dating (90+)', 'the Hip Replacements', 'Next of Kin'], m: ['Before the Will Is Read', 'After Bingo', 'With Mild Sedation'], subj: ['Granny Retention Drive', 'Inheritance Matchmaking', 'Bingo Night Synergies'] },
    clown: { t: ['the Clown Cars', 'the Ball Pit', 'Nap Time', 'the Balloon Animals', 'the Pie Budget', 'Parent Pick-Up'], m: ['Before Nap Time', 'In Full Makeup', 'Without Telling the Parents'], subj: ['Ball Pit Deep Clean', 'Clown Car Capacity Review', 'Big Shoes Policy'] },
    widow: { t: ['the Widows', 'the Life Insurance', 'the Casserole Fund', 'Grief Counselling', 'the Late Husbands', 'the Wake Catering'], m: ['Before the Funeral', 'In Lieu of Flowers', 'While Still Grieving'], subj: ['Widow Pipeline Growth', 'Grief Monetisation', 'Casserole Logistics'] },
    kidney: { t: ['the Kidneys', 'the Organ Donors', 'the Ice Baths', 'the Spare Kidney', 'Donor Consent Forms', 'the Bathtub Fleet'], m: ['Under Local Anaesthetic', 'While the Donor Sleeps', 'On Ice'], subj: ['Kidney Throughput Review', 'Organ Velocity', 'Bathtub Expansion'] },
    stepdad: { t: ['the Stepdads', 'Custody Weekends', 'the Child Support', 'the Dad Jokes', 'the Barbecue', 'the Real Dad'], m: ['Every Second Weekend', 'Without Telling Mum', 'Per the Custody Agreement'], subj: ['Stepdad Onboarding', 'Custody Weekend Synergies', 'Barbecue Compliance'] },
  };
  return { SUITS, WORDS, VALUES, FX, NAMES, DEPTS, COLORS, TRIMS, SUBJ, LEX };
})();
if (typeof module !== 'undefined') module.exports = OP_CONTENT;
