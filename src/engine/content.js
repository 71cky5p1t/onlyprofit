// Card, subject-line and company words. Data only.
const OP_CONTENT = (() => {
  const SUITS = ['Action', 'Target', 'Modifier'];
  // words carry their value: the more monstrous, the more profitable. Pools are bigger than a deck.
  // Action = harm, Target = how defenceless (watchdogs lowest), Modifier = manner. 'V' gambles ±2.
  const WORDS = [
    {
      2: ['Destroy', 'Harvest', 'Euthanise', 'Liquidate', 'Dissolve', 'Stuff and Mount'],
      1: ['Cease and Desist', 'Monetise', 'Outsource', 'Rightsize', 'Offshore', 'Repossess', 'Sedate', 'Rent Out', 'Sunset'],
      0: ['Restructure', 'Rebrand', 'Consolidate', 'Circle Back On', 'Laminate', 'Synergise', 'Onboard'],
      '-1': ['Back-Pay', 'Pay Super to', 'Protect', 'Unionise', 'Upskill', 'Mentor', 'Check On', 'Listen to', 'Insure', 'Recall'],
      '-2': ['Consult', 'Seek Consent from', 'Fact-Check', 'Apologise to', 'Audit', 'Self-Report to'],
      V: ['Gamify', 'Tokenise', 'Pivot', 'Disrupt'],
    },
    {
      2: ['the Orphans', 'the Babies', 'the Pension Fund', 'the Work Experience Kid', 'the Office Hamster', 'the Recently Bereaved'],
      1: ['the Interns', 'the Casuals', 'the Night Shift', 'Employee Wellness', 'Sick Leave', 'Customer Trust', 'Long Service Leave', 'the Office Dog'],
      0: ['the Break Room', 'the Mascot', 'the Photocopier', 'the Christmas Party', 'Casual Friday', 'Legacy Systems', 'the Fax Machine', 'the Regional Office'],
      '-1': ['the Board', 'the Billionaires', 'the Lawyers', 'the Bank', 'Head Office', 'the Landlord', 'the Consultants', 'the Lobbyists', "the CEO's Nephew", 'Middle Management', 'the Real Estate Agents', 'the Golf Club'],
      '-2': ['the Regulator', 'the Ombudsman', 'Fair Work', 'the Auditors', 'the Ethics Committee', 'the Tax Office'],
      V: ['the Share Price', 'the Crypto Wallet', "the Founder's Ashes", 'the Christmas Raffle'],
    },
    {
      2: ['With Expedience', 'Without Anaesthetic', 'Before Anyone Notices', 'In Front of Their Families', 'For Sport'],
      1: ['Immediately', 'Off the Books', 'At Scale', 'Indefinitely', 'In Perpetuity', 'Over Christmas', 'By Text Message', 'Via Group Email'],
      '-1': ['Pending Review', 'With Proper Notice', 'Under Supervision', 'In Triplicate', 'Gently', 'At Award Rates', 'After a Risk Assessment', 'With a Support Person'],
      '-2': ['Ethically', 'With Full Disclosure', 'With Informed Consent', 'Transparently', 'Through Proper Channels', 'At a Loss'],
      V: ['Allegedly', 'Live on Breakfast TV', 'On Margin', 'At the Casino'],
    },
  ];
  const VALUES = [2, 2, 2, 1, 1, 1, 1, 1, 0, 0, 0, 0, -1, -1, -1, -1, -1, -1, -2, -2, -2, -2, 'V', 'V'];
  const FX = [['With Thoughts and Prayers', 'null', -1], ['Retroactively', 'x2', -2], ["Per Legal's Advice", 'shield', -1], ['Without Consultation', 'flip', 0]];
  const NAMES = ['Gary', 'Denise', 'Trevor', 'Moira', 'Clive', 'Pam', 'Keith', 'Linda'];
  const DEPTS = ['Finance', 'Marketing', 'Human Resources', 'Legal', 'Operations', 'Compliance', 'R&D', 'Facilities'];
  // cover pages: template + typeface is the look people learn to recognise
  const TEMPLATES = ['fax', 'memo', 'wordart', 'clipart', 'report', 'dossier', 'overhead', 'certificate'];
  const FONTS = ['grotesk', 'typewriter', 'comic', 'serif', 'poster'];
  const SUBJ = [
    ['Re:', 'Fwd:', 'Action Required:', 'Quick Win:', 'Exciting News:', 'Per My Last Memo:', 'Circling Back:', 'Low-Hanging Fruit:', 'Confidential:', 'FYI:', 'Synergy Alert:', 'Town Hall Follow-Up:'],
    ['Wellness Optimisation', 'Pension Agility', 'Break Room Monetisation', 'Synergy Roadmap', 'Headcount Harmony', 'Customer Delight', 'Mandatory Fun Week', 'Coffee Rationalisation', 'The Paperless Paper Drive', 'Cultural Realignment', 'Stakeholder Journey', 'Vision 2000', 'Right-Sizing Our Family', 'Morale Recovery', 'Lean Lunch Hours'],
    ['(Urgent)', '— Phase II', '— Revised', 'Going Forward', 'for Q3', '(Do Not Forward)', 'v2 FINAL', '— A Win-Win', 'Effective Immediately', '(Pilot)', '— Thoughts?', '(Mandatory)'],
  ];
  const LEX = typeof OP_LEX !== 'undefined' ? OP_LEX : require('./lex.js');
  // a bot answering a memo about them; {n} is the accuser
  const DISPUTE = ["That is not what I sent.", "That proposal left my desk in perfect health.", "I'd like it minuted that {n} is lying.", "Interesting that it's {n} saying this.", "Check {n}'s desk, not mine.", "I have receipts. Not on me."];
  return { DISPUTE, SUITS, WORDS, VALUES, FX, NAMES, DEPTS, TEMPLATES, FONTS, SUBJ, LEX };
})();
if (typeof module !== 'undefined') module.exports = OP_CONTENT;
