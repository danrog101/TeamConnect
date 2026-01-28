// Sport-specific rating categories
export const sportRatingCategories = {
  'Nogomet': {
    icon: '⚽',
    categories: [
      { id: 'shooting', name: 'Udarac', icon: '🎯', description: 'Preciznost i snaga udarca' },
      { id: 'passing', name: 'Dodavanje', icon: '📍', description: 'Preciznost i vizija dodavanja' },
      { id: 'dribbling', name: 'Dribling', icon: '🏃', description: 'Kontrola lopte i tehnika' },
      { id: 'defending', name: 'Obrana', icon: '🛡️', description: 'Oduzimanje lopte i pozicioniranje' },
      { id: 'speed', name: 'Brzina', icon: '⚡', description: 'Brzina trčanja i reakcije' },
      { id: 'stamina', name: 'Kondicija', icon: '💪', description: 'Izdržljivost tijekom utakmice' }
    ]
  },
  'Košarka': {
    icon: '🏀',
    categories: [
      { id: 'shooting', name: 'Šut', icon: '🎯', description: 'Preciznost šuta sa svih pozicija' },
      { id: 'dribbling', name: 'Dribling', icon: '🏃', description: 'Kontrola lopte i prodori' },
      { id: 'passing', name: 'Asistencije', icon: '📍', description: 'Vizija igre i dodavanje' },
      { id: 'rebounding', name: 'Skok', icon: '📈', description: 'Ofenzivni i defenzivni skok' },
      { id: 'defense', name: 'Obrana', icon: '🛡️', description: 'Individualna i timska obrana' },
      { id: 'athleticism', name: 'Atleticizam', icon: '⚡', description: 'Brzina, skok i eksplozivnost' }
    ]
  },
  'Odbojka': {
    icon: '🏐',
    categories: [
      { id: 'serving', name: 'Servis', icon: '🎯', description: 'Snaga i preciznost servisa' },
      { id: 'spiking', name: 'Smeč', icon: '💥', description: 'Snaga i tehnika smeča' },
      { id: 'blocking', name: 'Blok', icon: '🛡️', description: 'Timing i visina bloka' },
      { id: 'receiving', name: 'Prijem', icon: '🤲', description: 'Kontrola prijema servisa' },
      { id: 'setting', name: 'Dizanje', icon: '📍', description: 'Preciznost i konzistentnost dizanja' },
      { id: 'defense', name: 'Obrana', icon: '🏊', description: 'Pokretljivost i refleksi' }
    ]
  },
  'Tenis': {
    icon: '🎾',
    categories: [
      { id: 'forehand', name: 'Forhend', icon: '💪', description: 'Snaga i preciznost forhenda' },
      { id: 'backhand', name: 'Bekhend', icon: '🔙', description: 'Tehnika i kontrola bekhenda' },
      { id: 'serve', name: 'Servis', icon: '🎯', description: 'Brzina i preciznost servisa' },
      { id: 'volley', name: 'Volej', icon: '🎾', description: 'Igra na mreži' },
      { id: 'movement', name: 'Kretanje', icon: '🏃', description: 'Brzina i footwork' },
      { id: 'mental', name: 'Mentalitet', icon: '🧠', description: 'Koncentracija i prilagodba' }
    ]
  },
  'Rukomet': {
    icon: '🤾',
    categories: [
      { id: 'shooting', name: 'Šut', icon: '🎯', description: 'Preciznost i snaga šuta' },
      { id: 'passing', name: 'Dodavanje', icon: '📍', description: 'Brzo i precizno dodavanje' },
      { id: 'dribbling', name: 'Dribling', icon: '🏃', description: 'Probijanja i finte' },
      { id: 'defense', name: 'Obrana', icon: '🛡️', description: 'Pozicioniranje i blokiranje' },
      { id: 'speed', name: 'Brzina', icon: '⚡', description: 'Brzina trčanja i kontranapada' },
      { id: 'physicality', name: 'Fizikalnost', icon: '💪', description: 'Snaga i kontakt igra' }
    ]
  },
  'Stolni tenis': {
    icon: '🏓',
    categories: [
      { id: 'forehand', name: 'Forhend', icon: '💪', description: 'Tehnika i snaga forhenda' },
      { id: 'backhand', name: 'Bekhend', icon: '🔙', description: 'Tehnika bekhenda' },
      { id: 'serve', name: 'Servis', icon: '🎯', description: 'Varijacije i spin servisa' },
      { id: 'footwork', name: 'Footwork', icon: '🦶', description: 'Kretanje i pozicioniranje' },
      { id: 'spin', name: 'Spin', icon: '🔄', description: 'Kontrola spina' },
      { id: 'reactions', name: 'Reakcije', icon: '⚡', description: 'Brzina reakcije' }
    ]
  },
  'Badminton': {
    icon: '🏸',
    categories: [
      { id: 'smash', name: 'Smeč', icon: '💥', description: 'Snaga i preciznost smeča' },
      { id: 'drop', name: 'Drop shot', icon: '🪶', description: 'Finese kratkih lopti' },
      { id: 'clear', name: 'Clear', icon: '📈', description: 'Duboki udarci' },
      { id: 'footwork', name: 'Footwork', icon: '🦶', description: 'Kretanje po terenu' },
      { id: 'serve', name: 'Servis', icon: '🎯', description: 'Varijacije servisa' },
      { id: 'defense', name: 'Obrana', icon: '🛡️', description: 'Vraćanje teških lopti' }
    ]
  },
  'Plivanje': {
    icon: '🏊',
    categories: [
      { id: 'freestyle', name: 'Kraul', icon: '🏊', description: 'Tehnika slobodnog stila' },
      { id: 'breaststroke', name: 'Prsno', icon: '🐸', description: 'Tehnika prsnog stila' },
      { id: 'backstroke', name: 'Leđno', icon: '🔙', description: 'Tehnika leđnog stila' },
      { id: 'butterfly', name: 'Leptir', icon: '🦋', description: 'Tehnika leptir stila' },
      { id: 'endurance', name: 'Izdržljivost', icon: '💪', description: 'Dugotrajna izdržljivost' },
      { id: 'speed', name: 'Brzina', icon: '⚡', description: 'Sprint brzina' }
    ]
  },
  'Trčanje': {
    icon: '🏃',
    categories: [
      { id: 'sprint', name: 'Sprint', icon: '⚡', description: 'Kratke dionice' },
      { id: 'endurance', name: 'Izdržljivost', icon: '💪', description: 'Duge dionice' },
      { id: 'pace', name: 'Tempo', icon: '⏱️', description: 'Održavanje tempa' },
      { id: 'technique', name: 'Tehnika', icon: '🦶', description: 'Efikasnost koraka' },
      { id: 'hill', name: 'Uzbrdo', icon: '⛰️', description: 'Trčanje uzbrdo' },
      { id: 'recovery', name: 'Oporavak', icon: '💚', description: 'Brzina oporavka' }
    ]
  },
  'Biciklizam': {
    icon: '🚴',
    categories: [
      { id: 'endurance', name: 'Izdržljivost', icon: '💪', description: 'Dugotrajna vožnja' },
      { id: 'climbing', name: 'Usponi', icon: '⛰️', description: 'Vožnja uzbrdo' },
      { id: 'sprinting', name: 'Sprint', icon: '⚡', description: 'Kratke eksplozije' },
      { id: 'technique', name: 'Tehnika', icon: '🔧', description: 'Efikasnost pedaliranja' },
      { id: 'descending', name: 'Spustevi', icon: '📉', description: 'Kontrola nizbrdo' },
      { id: 'tactics', name: 'Taktika', icon: '🧠', description: 'Grupna vožnja i taktika' }
    ]
  }
};

// Default categories for sports not in the list
export const defaultRatingCategories = {
  icon: '🏅',
  categories: [
    { id: 'technique', name: 'Tehnika', icon: '🎯', description: 'Osnovna tehnika sporta' },
    { id: 'fitness', name: 'Kondicija', icon: '💪', description: 'Fizička spremnost' },
    { id: 'speed', name: 'Brzina', icon: '⚡', description: 'Brzina i agilnost' },
    { id: 'strength', name: 'Snaga', icon: '🏋️', description: 'Fizička snaga' },
    { id: 'teamwork', name: 'Timski rad', icon: '🤝', description: 'Suradnja s drugima' },
    { id: 'mental', name: 'Mentalitet', icon: '🧠', description: 'Fokus i upornost' }
  ]
};

// Get rating categories for a specific sport
export const getRatingCategories = (sport) => {
  return sportRatingCategories[sport] || defaultRatingCategories;
};

// Calculate overall rating from sport-specific ratings
export const calculateOverallRating = (ratings) => {
  if (!ratings || Object.keys(ratings).length === 0) return null;

  const values = Object.values(ratings).filter(v => typeof v === 'number');
  if (values.length === 0) return null;

  const sum = values.reduce((a, b) => a + b, 0);
  return Math.round(sum / values.length);
};

// Get skill level from rating (1-5 scale)
export const getSkillLevel = (rating) => {
  if (rating === null || rating === undefined) return null;
  if (rating <= 20) return 1; // Beginner
  if (rating <= 40) return 2; // Intermediate
  if (rating <= 60) return 3; // Advanced
  if (rating <= 80) return 4; // Expert
  return 5; // Pro
};

// Get skill level name
export const getSkillLevelName = (level) => {
  const names = {
    1: 'Početnik',
    2: 'Srednji',
    3: 'Napredni',
    4: 'Expert',
    5: 'Pro'
  };
  return names[level] || 'Nepoznato';
};

export default sportRatingCategories;
