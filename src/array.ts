import { assert } from '@ember/debug';
import { addObserver, removeObserver } from '@ember/object/observers';
import { cacheFor } from '@ember/object/internals';
import { createNativeArray } from 'ember-undeprecate-ember-a/native-array';

const shared = createNativeArray((array) => array);
const accessors = shared.accessors;
const methods: Record<string, unknown> = {
  ...shared.methods,
  addObserver(
    this: unknown[],
    key: string,
    target: object | null,
    method: string | ((...args: unknown[]) => void),
    sync?: boolean,
  ) {
    addObserver(this, key, target, method as never, sync);

    return this;
  },
  removeObserver(
    this: unknown[],
    key: string,
    target: object | null,
    method: string | ((...args: unknown[]) => void),
    sync?: boolean,
  ) {
    removeObserver(this, key, target, method as never, sync);

    return this;
  },
  cacheFor(this: unknown[], key: string) {
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

for (const [key, descriptor] of Object.entries(accessors)) {
  define(key, descriptor);
}

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
    setEach<K extends Key<T>>(key: K, value: T[K]): void;
    setEach(key: string, value: unknown): void;
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
