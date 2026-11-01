// Habit Roll events and Sunday check-up outcomes, copied from the design doc tabs
// "Habit Roll events" and "Sunday check-up".

export const HABIT_EVENTS = {
  teeth: {
    lucky: 'The dentist gives you a gold star and a new toothbrush.',
    good: 'Your smile sparkles in the class photo.',
    setback: 'A toothache twinge at lunch.',
    disaster: 'A cavity. A dentist visit and a 50-coin bill.',
    bill: 50
  },
  devices: {
    lucky: 'Best sleep ever. You win your race at sport.',
    good: 'You wake up before your alarm, full of energy.',
    setback: 'You yawn all the way through class.',
    disaster: "You're so tired you trip at sport and graze both knees."
  },
  tennis: {
    lucky: 'The coach picks you to show everyone your serve.',
    good: 'You win a tie-break at training.',
    setback: 'Your serve is rusty at the next game.',
    disaster: "You've missed so much that you lose your doubles spot."
  },
  martial: {
    lucky: 'Your instructor picks you to show the class a new move.',
    good: 'You get through your whole routine without a mistake.',
    setback: 'You forget the new move.',
    disaster: 'Your grading gets pushed back a month.'
  },
  bike: {
    lucky: 'You ride the whole park loop without stopping.',
    good: 'You find a new bike track at the park.',
    setback: "You're wobbly on the bike path.",
    disaster: 'You lose your balance and scrape your arm.'
  },
  homework: {
    lucky: 'Your teacher pins your work on the classroom wall.',
    good: 'A tick on every question.',
    setback: 'Your teacher asks where your homework is.',
    disaster: 'You finish it at lunch while your friends play.'
  },
  piano: {
    lucky: 'Your teacher gives you a cool new piece to learn.',
    good: 'The tricky bar finally clicks.',
    setback: 'Your fingers feel stiff at your lesson.',
    disaster: 'You stumble through your piece at the concert rehearsal.'
  },
  reading: {
    lucky: 'The librarian lets you borrow the new books first.',
    good: "You can't put your book down.",
    setback: 'You lose track of the story.',
    disaster: 'Your library book is overdue: a 50-coin fine.',
    bill: 50
  },
  table: {
    lucky: 'Mum lets you choose dessert.',
    good: "Dinner's your favourite, and you get first pick.",
    setback: 'Dad sets it himself and looks tired.',
    disaster: "Dinner's late, and everyone's grumpy."
  },
  plates: {
    lucky: 'Mum gives you a high five and a hot chocolate.',
    good: "The kitchen's clean in record time.",
    setback: 'Plates pile up on the bench.',
    disaster: 'Ants march across the kitchen bench.'
  },
  feedBix: {
    lucky: 'Bix does his happy spin and brings you his favourite toy.',
    good: 'Bix licks your face. Best friends.',
    setback: 'Bix whines at the back door.',
    disaster: 'Hungry Bix raids the bin, and you clean up the mess.'
  },
  brushBix: {
    lucky: "Bix's coat is so shiny that a neighbour asks for a photo.",
    good: 'Bix falls asleep while you brush him.',
    setback: 'Dog hair all over the couch.',
    disaster: "Bix's fur is so tangled he needs the groomer: a 50-coin bill.",
    bill: 50
  },
  ownGoal: {
    lucky: 'Someone notices your effort, and you earn a badge.',
    good: 'Another step closer to your goal.',
    setback: 'Your goal slips a little.',
    disaster: 'You lose a week of progress on your goal.'
  }
};

// Habit Roll effects (small stakes).
export const HABIT_ROLL_EFFECTS = {
  lucky: { xp: 20, coins: 20 },
  good: { xp: 10, coins: 10 },
  normal: {},
  setback: { stat: -3 },
  disaster: { stat: -8 }
};

// Used when he did everything and still rolled low: it costs nothing.
export const BAD_LUCK_LINES = [
  'Rain cancels the park. Your habits kept you healthy anyway.',
  'You stub your toe on the couch. Ouch, but nothing serious.',
  'The internet drops out during your show. Time for a book instead.',
  'Your favourite cereal has run out.',
  "A magpie swoops you on the way to school. You're fine.",
  'Your shoelace snaps at sport. You tie a knot and keep going.'
];
export const BAD_LUCK_NOTE = 'Bad luck happens to everyone. Good habits make it smaller.';

export const CHECKUP = {
  health: {
    about: 'Dentist, doctor and sport',
    lucky: ['The dentist says "perfect teeth" and lets you pick from the prize box.', 'Your coach names you Player of the Week.', 'You beat your best in the school fitness test.'],
    good: ['A clean check-up at the dentist. No fillings.', 'You feel strong and full of energy all week.', 'You run the whole cross-country without stopping.'],
    normal: ['A healthy, ordinary week.', 'Nothing to report. Your body is doing its job.'],
    setback: ['The dentist spots a tiny hole starting.', 'You catch a cold and miss training.', 'You feel slow and heavy at sport all week.'],
    disaster: ['Two fillings at the dentist, and a 100-coin bill.', 'A nasty flu keeps you home for three days.', 'You sprain your ankle at sport and sit out for two weeks.'],
    disasterBills: [100, 0, 0]
  },
  brains: {
    about: 'School and piano lessons',
    lucky: ['Your report says "outstanding effort".', 'You win the class spelling bee.', 'Your piano teacher picks you for the school concert.'],
    good: ["A neat row of ticks on this week's test.", 'Your teacher writes "great improvement" in your book.', 'You learn a whole new piano piece.'],
    normal: ['A steady week at school.', 'Nothing special, but you kept up.'],
    setback: ["This week's test comes back covered in red pen.", 'Your teacher says you seem distracted.', 'Your piano teacher sends you home with the same piece again.'],
    disaster: ["A note comes home: you're falling behind in maths.", 'You fail the unit test and have to do it again.', 'You have to go back and repeat a whole piano book.']
  },
  heart: {
    about: 'Family and friends',
    lucky: ["Mum and Dad say you were the family's MVP this week.", "Your friend's family invites you to the beach.", 'You get a kindness award at assembly.'],
    good: ['Bix follows you everywhere. He knows who looks after him.', "Your friend says you're the best mate ever.", "Grandma calls just to say she's proud of you."],
    normal: ['A calm, happy week at home.', 'Nothing big. Just a good week with the family.'],
    setback: ['Your friend is upset that you forgot their birthday.', 'Dad seems tired from doing your jobs.', 'An argument over chores leaves the house grumpy.'],
    disaster: ["You miss your friend's party because your jobs weren't done.", 'Family movie night gets cancelled.', 'Your friend stops sitting with you at lunch.']
  },
  money: {
    about: 'Bank statement and bills',
    lucky: ['Bonus week: the bank doubles your interest.', 'You find $10 in an old jacket pocket.', 'Grandma matches what you saved this week.'],
    good: ['Your savings are fuller than ever.', 'Interest lands, and your balance hits a new high.', 'You find a bargain on something you needed.'],
    normal: ['Your money stayed put. Steady.', 'Interest landed. Nothing else changed.'],
    setback: ['You drop $3 at the park.', 'Your headphones break and need replacing.', "A school fundraiser needs money you hadn't planned for."],
    disaster: ['A flat bike tyre needs a new tube and a repair.', 'You lose your wallet at the shops.', 'Your tablet case cracks and needs replacing.']
  }
};

export const CHECKUP_EFFECTS = {
  lucky: { xp: 40, coins: 40 },
  good: { xp: 20, coins: 20 },
  normal: {},
  setback: { stat: -5, moneyCoins: -30 },
  disaster: { stat: -15, moneyCoins: -100 }
};
