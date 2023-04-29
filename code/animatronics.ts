export type Animatronic = {
  name: string;
  possibleLocations: string[];
  startingPosition: string;
};

export const animatronics: Animatronic[] = [
  {
    name: 'Chica',
    possibleLocations: ['1A', '1B', '7', '6', '4A', '4B'],
    startingPosition: '1A',
  },
];
