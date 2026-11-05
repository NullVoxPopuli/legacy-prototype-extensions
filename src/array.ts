import { assert } from '@ember/debug';
import {
  get,
  set,
  getProperties,
  setProperties,
  notifyPropertyChange,
} from '@ember/object';
import { addObserver, removeObserver } from '@ember/object/observers';
import { cacheFor } from '@ember/object/internals';
import { compare } from '@ember/utils';

type AnyArray = unknown[];
type Obj = Record<string, unknown>;
type Predicate = (item: unknown, index: number, array: AnyArray) => unknown;

const EMPTY_ARRAY: readonly unknown[] = Object.freeze([]);
const CHUNK_SIZE = 60000;

function iter(...args: [string] | [string, unknown]): Predicate {
  const [key, value] = args;

  return args.length === 2
    ? (item) => value === get(item as object, key)
    : (item) => Boolean(get(item as object, key));
}

function findIndex(array: AnyArray, predicate: Predicate, startAt: number) {
  for (let index = startAt; index < array.length; index++) {
    if (predicate(array[index], index, array)) {
      return index;
    }
  }

  return -1;
}

function uniqBy(
  array: AnyArray,
  keyOrFunc: string | ((item: unknown) => unknown),
) {
  const ret: AnyArray = [];
  const seen = new Set();
  const getter =
    typeof keyOrFunc === 'function'
      ? keyOrFunc
      : (item: unknown) => get(item as object, keyOrFunc);

  for (const item of array) {
    const val = getter(item);

    if (!seen.has(val)) {
      seen.add(val);
      ret.push(item);
    }
  }

  return ret;
}

function replace(
  array: AnyArray,
  start: number,
  deleteCount: number,
  items: readonly unknown[] = EMPTY_ARRAY,
) {
  assert(
    'The third argument to replace needs to be an array.',
    Array.isArray(items as unknown),
  );

  const previousLength = array.length;
  const normalStart = start < 0 ? previousLength + start : start;
  const previousLastIndex = previousLength - 1;

  if (items.length <= CHUNK_SIZE) {
    array.splice(start, deleteCount, ...items);
  } else {
    array.splice(start, deleteCount);

    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      array.splice(start + i, 0, ...items.slice(i, i + CHUNK_SIZE));
    }
  }

  if (array.length !== previousLength) {
    notifyPropertyChange(array, 'length');
  }

  notifyPropertyChange(array, '[]');

  if (normalStart === 0) {
    notifyPropertyChange(array, 'firstObject');
  }

  if (previousLastIndex < normalStart + deleteCount) {
    notifyPropertyChange(array, 'lastObject');
  }

  return array;
}

function removeAt(array: AnyArray, index: number, len?: number) {
  assert(
    '`removeAt` index provided is out of range',
    index > -1 && index < array.length,
  );

  return replace(array, index, len ?? 1);
}

function insertAt(array: AnyArray, index: number, item: unknown) {
  assert(
    '`insertAt` index provided is out of range',
    index > -1 && index <= array.length,
  );

  replace(array, index, 0, [item]);

  return item;
}

function mapBy(this: AnyArray, key: string) {
  return this.map((item) => get(item as object, key));
}

function clear(array: AnyArray) {
  if (array.length === 0) {
    return array;
  }

  return replace(array, 0, array.length);
}

function removeObject(array: AnyArray, item: unknown) {
  for (let index = array.length - 1; index >= 0; index--) {
    if (array[index] === item) {
      removeAt(array, index);
    }
  }

  return array;
}

function addObject(array: AnyArray, item: unknown) {
  if (!array.includes(item)) {
    insertAt(array, array.length, item);
  }

  return array;
}

const methods: Record<string, unknown> & ThisType<AnyArray> = {
  objectAt(index: number) {
    return this[index];
  },
  objectsAt(indexes: number[]) {
    return indexes.map((index) => this[index]);
  },
  getEach: mapBy,
  mapBy,
  setEach(key: string, value: unknown) {
    this.forEach((item) => set(item as Obj, key, value));

    return this;
  },
  reject(callback: Predicate, target: unknown = null) {
    assert(
      '`reject` expects a function as first argument.',
      typeof callback === 'function',
    );

    return this.filter((...args) => !callback.apply(target, args));
  },
  filterBy(...args: [string] | [string, unknown]) {
    return this.filter(iter(...args));
  },
  rejectBy(...args: [string] | [string, unknown]) {
    const predicate = iter(...args);

    return this.filter((...rest) => !predicate(...rest));
  },
  findBy(...args: [string] | [string, unknown]) {
    return this.find(iter(...args));
  },
  isEvery(...args: [string] | [string, unknown]) {
    const predicate = iter(...args);

    return findIndex(this, (...rest) => !predicate(...rest), 0) === -1;
  },
  any(callback: Predicate, target: unknown = null) {
    assert(
      '`any` expects a function as first argument.',
      typeof callback === 'function',
    );

    return findIndex(this, callback.bind(target), 0) !== -1;
  },
  isAny(...args: [string] | [string, unknown]) {
    return findIndex(this, iter(...args), 0) !== -1;
  },
  invoke(methodName: string, ...args: unknown[]) {
    return this.map((item) =>
      (
        (item as Obj)[methodName] as ((...a: unknown[]) => unknown) | undefined
      )?.(...args),
    );
  },
  toArray() {
    return this.slice();
  },
  compact() {
    return this.filter((value) => value != null);
  },
  sortBy(...sortKeys: string[]) {
    return this.slice().sort((a, b) => {
      for (const key of sortKeys) {
        const result = compare(get(a as object, key), get(b as object, key));

        if (result) {
          return result;
        }
      }

      return 0;
    });
  },
  uniq() {
    return uniqBy(this, (item) => item);
  },
  uniqBy(key: string | ((item: unknown) => unknown) = (item) => item) {
    return uniqBy(this, key);
  },
  without(value: unknown) {
    if (!this.includes(value)) {
      return this;
    }

    return value === value
      ? this.filter((item) => item !== value)
      : this.filter((item) => item === item);
  },

  replace(start: number, deleteCount: number, items?: unknown[]) {
    return replace(this, start, deleteCount, items);
  },
  clear() {
    return clear(this);
  },
  insertAt(index: number, item: unknown) {
    insertAt(this, index, item);

    return this;
  },
  removeAt(start: number, len?: number) {
    return removeAt(this, start, len);
  },
  pushObject(item: unknown) {
    return insertAt(this, this.length, item);
  },
  pushObjects(items: unknown[]) {
    return replace(this, this.length, 0, items);
  },
  popObject() {
    if (this.length === 0) {
      return null;
    }

    const ret = this[this.length - 1];

    removeAt(this, this.length - 1, 1);

    return ret;
  },
  shiftObject() {
    if (this.length === 0) {
      return null;
    }

    const ret = this[0];

    removeAt(this, 0);

    return ret;
  },
  unshiftObject(item: unknown) {
    return insertAt(this, 0, item);
  },
  unshiftObjects(items: unknown[]) {
    return replace(this, 0, 0, items);
  },
  reverseObjects() {
    if (this.length === 0) {
      return this;
    }

    return replace(this, 0, this.length, this.slice().reverse());
  },
  setObjects(items: unknown[]) {
    if (items.length === 0) {
      return clear(this);
    }

    return replace(this, 0, this.length, items);
  },
  removeObject(item: unknown) {
    return removeObject(this, item);
  },
  removeObjects(items: unknown[]) {
    for (let i = items.length - 1; i >= 0; i--) {
      removeObject(this, items[i]);
    }

    return this;
  },
  addObject(item: unknown) {
    return addObject(this, item);
  },
  addObjects(items: unknown[]) {
    items.forEach((item) => addObject(this, item));

    return this;
  },

  get(key: string) {
    return get(this, key);
  },
  getProperties(...keys: string[] | [string[]]) {
    return getProperties(this, ...(keys as string[]));
  },
  set(key: string, value: unknown) {
    return set(this as unknown as Obj, key, value);
  },
  setProperties(hash: Record<string, unknown>) {
    return setProperties(this, hash);
  },
  notifyPropertyChange(key: string) {
    notifyPropertyChange(this, key);

    return this;
  },
  addObserver(
    key: string,
    target: object | null,
    method: string | ((...args: unknown[]) => void),
    sync?: boolean,
  ) {
    addObserver(this, key, target, method as never, sync);

    return this;
  },
  removeObserver(
    key: string,
    target: object | null,
    method: string | ((...args: unknown[]) => void),
    sync?: boolean,
  ) {
    removeObserver(this, key, target, method as never, sync);

    return this;
  },
  incrementProperty(key: string, increment = 1) {
    assert(
      'Must pass a numeric value to incrementProperty',
      !isNaN(parseFloat(String(increment))) && isFinite(increment),
    );

    return set(
      this as unknown as Obj,
      key,
      ((parseFloat(get(this, key) as string) || 0) + increment) as never,
    );
  },
  decrementProperty(key: string, decrement = 1) {
    assert(
      'Must pass a numeric value to decrementProperty',
      (typeof decrement === 'number' || !isNaN(parseFloat(decrement))) &&
        isFinite(decrement),
    );

    return set(
      this as unknown as Obj,
      key,
      (((get(this, key) as number) || 0) - decrement) as never,
    );
  },
  toggleProperty(key: string) {
    return set(this as unknown as Obj, key, !get(this, key));
  },
  cacheFor(key: string) {
    return cacheFor(this, key);
  },
};

function define(key: string, descriptor: PropertyDescriptor) {
  if (key in Array.prototype) {
    return;
  }

  Object.defineProperty(Array.prototype, key, {
    configurable: true,
    enumerable: false,
    ...descriptor,
  });
}

for (const [key, value] of Object.entries(methods)) {
  define(key, { value, writable: true });
}

define('[]', {
  get(this: AnyArray) {
    return this;
  },
  set(this: AnyArray, value: unknown[]) {
    replace(this, 0, this.length, value);
  },
});

define('firstObject', {
  get(this: AnyArray) {
    get(this, '[]');

    return this[0];
  },
});

define('lastObject', {
  get(this: AnyArray) {
    get(this, '[]');

    return this[this.length - 1];
  },
});

export const A = function <T>(this: unknown, arr?: Array<T>) {
  assert(
    'You cannot create an Ember Array with `new A()`, please update to calling A as a function: `A()`',
    !(this instanceof A),
  );

  return arr ?? [];
};

type Key<T> = keyof T & string;
type Callback<T, R> = (item: T, index: number, array: T[]) => R;

declare global {
  interface Array<T> {
    '[]': this;
    readonly firstObject: T | undefined;
    readonly lastObject: T | undefined;

    objectAt(index: number): T | undefined;
    objectsAt(indexes: number[]): Array<T | undefined>;
    getEach<K extends Key<T>>(key: K): Array<T[K]>;
    getEach(key: string): unknown[];
    mapBy<K extends Key<T>>(key: K): Array<T[K]>;
    mapBy(key: string): unknown[];
    setEach<K extends Key<T>>(key: K, value: T[K]): this;
    setEach(key: string, value: unknown): this;
    reject<Target>(
      callback: (this: Target, item: T, index: number, array: T[]) => unknown,
      target?: Target,
    ): T[];
    filterBy(key: string, value?: unknown): T[];
    rejectBy(key: string, value?: unknown): T[];
    findBy(key: string, value?: unknown): T | undefined;
    isEvery(key: string, value?: unknown): boolean;
    any<Target>(
      callback: (this: Target, item: T, index: number, array: T[]) => unknown,
      target?: Target,
    ): boolean;
    isAny(key: string, value?: unknown): boolean;
    invoke(methodName: string, ...args: unknown[]): unknown[];
    toArray(): T[];
    compact(): NonNullable<T>[];
    sortBy(...keys: string[]): T[];
    uniq(): T[];
    uniqBy(key: string | Callback<T, unknown>): T[];
    without(value: T): T[];

    replace(start: number, deleteCount: number, items?: readonly T[]): this;
    clear(): this;
    insertAt(index: number, item: T): this;
    removeAt(start: number, len?: number): this;
    pushObject(item: T): T;
    pushObjects(items: readonly T[]): this;
    popObject(): T | null;
    shiftObject(): T | null;
    unshiftObject(item: T): T;
    unshiftObjects(items: readonly T[]): this;
    reverseObjects(): this;
    setObjects(items: readonly T[]): this;
    removeObject(item: T): this;
    removeObjects(items: readonly T[]): this;
    addObject(item: T): this;
    addObjects(items: readonly T[]): this;

    get(key: string): unknown;
    getProperties(...keys: string[]): Record<string, unknown>;
    getProperties(keys: string[]): Record<string, unknown>;
    set<V>(key: string, value: V): V;
    setProperties<H extends Record<string, unknown>>(hash: H): H;
    notifyPropertyChange(key: string): this;
    addObserver(
      key: string,
      target: object | null,
      method: string | ((sender: this, key: string) => void),
      sync?: boolean,
    ): this;
    removeObserver(
      key: string,
      target: object | null,
      method: string | ((sender: this, key: string) => void),
      sync?: boolean,
    ): this;
    incrementProperty(key: string, increment?: number): number;
    decrementProperty(key: string, decrement?: number): number;
    toggleProperty(key: string): boolean;
    cacheFor(key: string): unknown;
  }
}
