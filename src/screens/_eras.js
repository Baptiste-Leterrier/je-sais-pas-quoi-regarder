export const ERAS = [
  { label: 'Très récent (2020+)', value: 'recent', yearGte: 2020 },
  { label: 'Années 2010', value: '2010s', yearGte: 2010, yearLte: 2019 },
  { label: 'Années 2000', value: '2000s', yearGte: 2000, yearLte: 2009 },
  { label: 'Classique (avant 2000)', value: 'classic', yearLte: 1999 },
  { label: 'Peu importe', value: 'any' },
];

export const ERAS_LOOKUP = Object.fromEntries(ERAS.map((e) => [e.value, e]));
