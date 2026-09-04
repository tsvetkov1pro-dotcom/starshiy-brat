import compact0 from './sphere-data/compact0';
import compact1 from './sphere-data/compact1';
import compact2 from './sphere-data/compact2';
import compact3 from './sphere-data/compact3';
import compact4 from './sphere-data/compact4';

export const SPHERE_SHEET = `data:image/webp;base64,${compact0}${compact1}${compact2}${compact3}${compact4}`;

export const SPHERE_POSITIONS: Record<string, string> = {
  'IT / AI': '0% 0%',
  'Строительство': '50% 0%',
  'Финансы': '100% 0%',
  'Продажи': '0% 100%',
  'Маркетинг': '50% 100%',
  'Производство': '100% 100%',
};
