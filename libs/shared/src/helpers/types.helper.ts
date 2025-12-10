import { get, isArray, isNumber } from 'lodash';

import { TPaginatedData } from '../types';

export type ExtractEnumTypes<T extends Record<string, string>> = T[keyof T];

// type guards for paginated data
export function isPaginatedData<T>(object: any): object is TPaginatedData<T> {
  const data = get(object, 'data') as unknown;
  const meta = get(object, 'meta') as unknown;
  return (
    isArray(data) &&
    isNumber(get(meta, 'page')) &&
    isNumber(get(meta, 'limit')) &&
    isNumber(get(meta, 'total')) &&
    isNumber(get(meta, 'pages'))
  );
}
