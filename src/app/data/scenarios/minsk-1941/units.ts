import { MilitaryUnit } from '../../../core/history/scenario';
import { GERMAN_ARMIES } from './german-armies';
import { GERMAN_MOTORIZED_CORPS } from './german-motorized-corps';
import { SOVIET_ARMIES } from './soviet-armies';

/** Every unit shown in the Białystok–Minsk chapter. */
export const MINSK_UNITS: readonly MilitaryUnit[] = [
  ...GERMAN_MOTORIZED_CORPS,
  ...GERMAN_ARMIES,
  ...SOVIET_ARMIES,
];
