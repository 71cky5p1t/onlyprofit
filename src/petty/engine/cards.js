// Petty Cash card data. Data only.
const PC_CARDS = (() => {
  // public who/how multipliers and what base prices, per company
  const CO = {
    party: {
      name: 'Jumbo Joy Party Hire', tag: 'Making memories since the incident.', prompt: "What did you buy for little Jayden's 6th birthday party?",
      tiers: { Cheap: 40, Normal: 150, Pricey: 350, Outrageous: 550 },
      who: [['Hungover', 1], ['Unlicensed', 1.2], ['Clown', 1.3], ['Sobbing', 1.1], ['Emergency', 1.5], ['Discreet', 1.5], ['Second-Hand', 0.7], ['Recently Divorced', 1.1], ['Off-Duty', 1.2], ['Uninsured', 1.3]],
      what: [['Party Bags', 40], ['Fairy Bread', 25], ['Piñata', 60], ['Face Painter', 120], ['Clown', 180], ['Magician', 220], ['Bouncy Castle', 250], ['Therapist for the Parents', 300], ['Pony', 350], ['Stripper (wrong postcode)', 400], ['Sugar-Crash Paramedic', 500], ['Pony Removal', 600]],
      bot: [['Bail for Uncle Steve', 'Outrageous'], ['Fourteen litres of cask wine', 'Normal'], ['Emotional support ferret', 'Normal'], ['Apology fruit basket', 'Cheap'], ['Lawyer for the piñata incident', 'Pricey'], ['A whole pig, uncooked', 'Pricey'], ['Hush money for the neighbours', 'Pricey'], ['Trampoline (one spring)', 'Cheap'], ['Valium (for Mum)', 'Normal'], ['A second, better clown', 'Outrageous'], ['Smoke machine', 'Normal'], ['Jet ski', 'Outrageous']],
    },
    funeral: {
      name: 'Eternal Rest Funeral Group', tag: 'Dignity, billed by the hour.', prompt: "What did you buy for Nan's funeral?",
      tiers: { Cheap: 90, Normal: 250, Pricey: 500, Outrageous: 1000 },
      who: [["Cousin's", 0.7], ['Second-Hand', 0.6], ['Biodegradable', 0.8], ['Weeping', 1.2], ['Unlicensed', 1.2], ['Off-Duty', 1.2], ['Closed-Casket', 1.3], ['Last-Minute', 1.4], ['Emergency', 1.5], ['Discreet', 1.5]],
      what: [['Wreath', 90], ['Hired Mourner', 120], ['Eulogy Writer', 150], ['Dove Release', 200], ['Organist', 250], ['Grief Catering', 300], ['Body Pickup', 350], ['Embalming', 400], ['Hearse', 500], ['Casket', 1200]],
      bot: [['Fake tan for the deceased', 'Normal'], ['Fog machine', 'Pricey'], ['Elvis impersonator', 'Pricey'], ['Open bar, closed casket', 'Outrageous'], ['Psychic to ask about the will', 'Pricey'], ['Bulk tissues', 'Cheap'], ['Bouncer for the ex-wife', 'Normal'], ['Drone flyover', 'Outrageous'], ['Replacement ashes (dog)', 'Cheap'], ['Second casket, just in case', 'Outrageous'], ['Karaoke machine', 'Normal'], ['Sympathy lasagne (catered)', 'Cheap']],
    },
    mining: {
      name: 'Deep Pit Resources', tag: 'Putting the hole in wholesome.', prompt: 'What did you buy for the new mine opening?',
      tiers: { Cheap: 100, Normal: 700, Pricey: 2000, Outrageous: 4000 },
      who: [['Second-Hand', 0.6], ['Environmental', 0.8], ['Community', 0.8], ['Ceremonial', 1.1], ['Unlicensed', 1.2], ['Offshore', 1.3], ['Overnight', 1.4], ['Unmarked', 1.4], ['Emergency', 1.5], ['Discreet', 1.5]],
      what: [['Hi-Vis', 40], ['Groundwater Test (results pending)', 400], ['Water Truck', 600], ['Lobbyist Lunch', 700], ['FIFO Flights', 800], ['Dust Suppression', 900], ['Wildlife Relocation', 1200], ['Community Consultation (catered)', 1500], ['Media Training', 2000], ['Helicopter', 3000], ['Whistleblower Settlement', 5000]],
      bot: [['Gold-plated hard hat', 'Pricey'], ["Senator's fishing trip", 'Outrageous'], ['Koala relocation (one way)', 'Normal'], ['Bulk sunscreen', 'Cheap'], ['Fake community barbecue', 'Normal'], ['Dynamite (recreational)', 'Pricey'], ['Second whistleblower settlement', 'Outrageous'], ['Thoughts and prayers (catered)', 'Normal'], ['Hi-vis for the CEO\'s dog', 'Cheap'], ['Climate scientist (to leave)', 'Pricey'], ['Ribbon, very long', 'Cheap'], ['Private jet (one way)', 'Outrageous']],
    },
  };
  // secret surcharges, drawn when you lodge
  const SUR = [['Standard Rate', 1], ['Standard Rate', 1], ['Standard Rate', 1], ['Plus GST', 1.1], ['Cash, No Questions', 1], ['Weekend Rate', 1.5], ['Damages Extra', 1.6], ['Includes Hush Money', 1.8], ['After Hours', 2], ['Mates Rates', 0.5], ['Cancellation Fee Only', 0.4], ['Deposit Only', 0.3]];
  const ACTIONS = {
    free: ['Free Rent', 'Skip your rent this lap.'],
    shred: ['Shred the Records', 'When you get audited: the audit fails, you get the guide price.'],
    nephew: ['Nephew of the CEO', 'Lodge with this and nobody can audit the claim.'],
    peek: ['Payroll Peek', "See a claim's real total before you decide to audit."],
    key: ['Petty Cash Key', 'Your next wrong audit costs no fine.'],
    freeze: ['Rent Freeze', "Rent doesn't go up this lap."],
    letter: ["Landlord's Letter", "Double another player's rent this lap."],
    creative: ['Creative Accounting', 'Slide some petty cash straight into your bank.'],
  };
  // opening quick-fire: answers become what cards; each question hides a price tier
  const PROMPTS = [
    ["What's the weirdest thing you've put in your mouth?", 'Normal'], ['Something that smells wrong?', 'Cheap'],
    ["Something you'd find in a dead uncle's shed?", 'Normal'], ['What would you never lend to a friend?', 'Pricey'],
    ["Something you'd hide from the police?", 'Outrageous'], ["What's at the back of the fridge?", 'Cheap'],
    ['Something a cult would buy in bulk?', 'Pricey'], ['The worst thing to bring on a first date?', 'Normal'],
    ['What would a pirate want for Christmas?', 'Pricey'], ["Something you'd only buy on Marketplace?", 'Normal'],
    ["What's too big to flush?", 'Normal'], ["Something you'd sell a kidney for?", 'Outrageous'],
    ["What's in a celebrity's bin?", 'Pricey'], ['Something that ruined a wedding?', 'Outrageous'],
    ["What would you smuggle down your pants?", 'Pricey'], ['Something under a servo toilet?', 'Cheap'],
    ['A gift that says "we need to talk"?', 'Normal'], ['What do rich people collect?', 'Outrageous'],
    ['Something sticky?', 'Cheap'], ['What did your ex leave behind?', 'Normal'],
  ];
  // bot answers to the quick-fire
  const ANSWERS = ['A jar of teeth', "Nan's dentures", 'An expired kebab', 'A live eel', 'A bucket of prawns', "Someone else's thongs", 'A cursed doll', 'A wheelie bin', 'A used mattress', 'Forty kilos of glitter', 'A ventriloquist dummy', 'A bag of hair', 'A cask of goon', 'A taxidermied possum', 'A sombrero full of soup', 'Half a ute', 'A haunted printer', 'An inflatable church', 'Twelve feral cats', 'A urinal cake', 'A tub of mayonnaise', "My ex-wife's wig", 'A mankini', 'A pallet of Spam', 'A pet rock with a criminal record', 'Expired insulin', 'A signed Bible', "Somebody's retainer"];
  const DIE = [1, 1, 2, 2, 3, 3];
  const NAMES = ['Gary', 'Denise', 'Trevor', 'Moira', 'Clive', 'Pam', 'Keith', 'Linda'];
  return { CO, SUR, ACTIONS, DIE, NAMES, PROMPTS, ANSWERS };
})();
if (typeof module !== 'undefined') module.exports = PC_CARDS;
