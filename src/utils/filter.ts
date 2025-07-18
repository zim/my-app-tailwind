/**
 * Generic filter utility functions for arrays and objects
 */

// Generic filter function for arrays
export function filterArray<T>(
  array: T[],
  predicate: (item: T, index: number, array: T[]) => boolean
): T[] {
  return array.filter(predicate);
}

// Filter by property value
export function filterByProperty<T, K extends keyof T>(
  array: T[],
  property: K,
  value: T[K]
): T[] {
  return array.filter(item => item[property] === value);
}

// Filter by multiple properties
export function filterByProperties<T>(
  array: T[],
  filters: Partial<T>
): T[] {
  return array.filter(item =>
    Object.entries(filters).every(([key, value]) =>
      item[key as keyof T] === value
    )
  );
}

// Filter by text search (case-insensitive)
export function filterByText<T>(
  array: T[],
  searchText: string,
  searchProperties: (keyof T)[]
): T[] {
  const lowerSearchText = searchText.toLowerCase();

  return array.filter(item =>
    searchProperties.some(property => {
      const value = item[property];
      return typeof value === 'string' &&
        value.toLowerCase().includes(lowerSearchText);
    })
  );
}

// Filter by date range
export function filterByDateRange<T>(
  array: T[],
  dateProperty: keyof T,
  startDate?: Date,
  endDate?: Date
): T[] {
  return array.filter(item => {
    const itemDate = item[dateProperty];
    if (!(itemDate instanceof Date)) return false;

    if (startDate && itemDate < startDate) return false;
    if (endDate && itemDate > endDate) return false;

    return true;
  });
}

// Filter by numeric range
export function filterByNumericRange<T>(
  array: T[],
  property: keyof T,
  min?: number,
  max?: number
): T[] {
  return array.filter(item => {
    const value = item[property];
    if (typeof value !== 'number') return false;

    if (min !== undefined && value < min) return false;
    if (max !== undefined && value > max) return false;

    return true;
  });
}

// Filter with custom comparison function
export function filterWithComparison<T>(
  array: T[],
  property: keyof T,
  compareValue: T[keyof T],
  compareFn: (a: T[keyof T], b: T[keyof T]) => boolean
): T[] {
  return array.filter(item => compareFn(item[property], compareValue));
}

// Advanced filter with multiple criteria
export interface FilterCriteria<T> {
  property: keyof T;
  operator: 'equals' | 'not-equals' | 'contains' | 'greater-than' | 'less-than' | 'greater-equal' | 'less-equal';
  value: any;
}

export function advancedFilter<T>(
  array: T[],
  criteria: FilterCriteria<T>[],
  operator: 'AND' | 'OR' = 'AND'
): T[] {
  return array.filter(item => {
    const results = criteria.map(criterion => {
      const itemValue = item[criterion.property];

      switch (criterion.operator) {
        case 'equals':
          return itemValue === criterion.value;
        case 'not-equals':
          return itemValue !== criterion.value;
        case 'contains':
          return typeof itemValue === 'string' &&
            itemValue.toLowerCase().includes(criterion.value.toLowerCase());
        case 'greater-than':
          return typeof itemValue === 'number' && itemValue > criterion.value;
        case 'less-than':
          return typeof itemValue === 'number' && itemValue < criterion.value;
        case 'greater-equal':
          return typeof itemValue === 'number' && itemValue >= criterion.value;
        case 'less-equal':
          return typeof itemValue === 'number' && itemValue <= criterion.value;
        default:
          return false;
      }
    });

    return operator === 'AND'
      ? results.every(result => result)
      : results.some(result => result);
  });
}

// Remove duplicates based on a property
export function filterUnique<T, K extends keyof T>(
  array: T[],
  property: K
): T[] {
  const seen = new Set();
  return array.filter(item => {
    const value = item[property];
    if (seen.has(value)) {
      return false;
    }
    seen.add(value);
    return true;
  });
}

// Remove falsy values
export function filterTruthy<T>(array: (T | null | undefined | false | 0 | '')[]): T[] {
  return array.filter(Boolean) as T[];
}
