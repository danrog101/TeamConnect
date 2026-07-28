export const defaultSports = [
  { id: 1, name: 'Nogomet', icon: '⚽', popular: true },
  { id: 2, name: 'Košarka', icon: '🏀', popular: true },
  { id: 3, name: 'Odbojka', icon: '🏐', popular: true },
  { id: 4, name: 'Tenis', icon: '🎾', popular: true },
  { id: 5, name: 'Rukomet', icon: '🤾', popular: true },
  { id: 6, name: 'Baseball', icon: '⚾', popular: false },
  { id: 7, name: 'Badminton', icon: '🏸', popular: false },
  { id: 8, name: 'Stolni tenis', icon: '🏓', popular: false },
  { id: 9, name: 'Bilijar', icon: '🎱', popular: false },
  { id: 10, name: 'Hokej', icon: '🏒', popular: false },
  { id: 11, name: 'Frisbee', icon: '🥏', popular: false },
  { id: 12, name: 'Ragbi', icon: '🏉', popular: false },
  { id: 13, name: 'Boks', icon: '🥊', popular: false },
  { id: 14, name: 'Mačevanje', icon: '🤺', popular: false },
  { id: 15, name: 'Jahanje', icon: '🏇', popular: false },
  { id: 16, name: 'Golf', icon: '⛳', popular: false },
  { id: 17, name: 'Skijanje', icon: '🎿', popular: false },
  { id: 18, name: 'Snowboarding', icon: '🏂', popular: false },
  { id: 19, name: 'Surfanje', icon: '🏄', popular: false },
  { id: 20, name: 'Biciklizam', icon: '🚴', popular: false },
  { id: 21, name: 'Trčanje', icon: '🏃', popular: false },
  { id: 22, name: 'Penjanje', icon: '🧗', popular: false },
  { id: 23, name: 'Gimnastika', icon: '🤸', popular: false },
  { id: 24, name: 'Borilačke vještine', icon: '🥋', popular: false },
  { id: 25, name: 'Plivanje', icon: '🏊', popular: false },
  { id: 26, name: 'Vaterpolo', icon: '🤽', popular: false },
  { id: 27, name: 'Mini golf', icon: '⛳', popular: false },
  { id: 28, name: 'Kuglanje', icon: '🎳', popular: false },
  { id: 29, name: 'Pikado', icon: '🎯', popular: false },
  { id: 30, name: 'Strijeljaštvo', icon: '🏹', popular: false },
  { id: 31, name: 'Yoga', icon: '🧘', popular: false },
  { id: 32, name: 'Fitness', icon: '💪', popular: false },
  { id: 33, name: 'Dizanje utega', icon: '🏋️', popular: false },
  { id: 34, name: 'Padobranstvo', icon: '🪂', popular: false },
  { id: 35, name: 'Skateboarding', icon: '🛹', popular: false },
  { id: 36, name: 'Rolanje', icon: '🛼', popular: false },
  { id: 37, name: 'Beach Volleyball', icon: '🏖️', popular: false },
  { id: 38, name: 'Padel', icon: '🎾', popular: true },
  { id: 39, name: 'Kriket', icon: '🏏', popular: false },
  { id: 40, name: 'Lacrosse', icon: '🥍', popular: false }
];

export const getAllSports = () => {
  const customSports = JSON.parse(localStorage.getItem('customSports') || '[]');
  return [...defaultSports, ...customSports];
};

export const addCustomSport = (sportName) => {
  const customSports = JSON.parse(localStorage.getItem('customSports') || '[]');
  const newSport = {
    id: Date.now(),
    name: sportName,
    icon: '🏅',
    popular: false,
    custom: true
  };
  customSports.push(newSport);
  localStorage.setItem('customSports', JSON.stringify(customSports));
  return newSport;
};