import { assert } from '@ember/debug';
import { NativeArray } from '@ember/array';

/**
 * NOTE: this is a temporary hack as I bet that this export
 *       will be on the chopping block as soon as someone remembers at the
 *       same time that they have the motivation to do it.
 *
 * But for now, because NativeArray has a bunch of tests, we don't need as many tests ourselves.
 */
NativeArray.apply(Array.prototype, true);

export const A = function <T>(this: unknown, arr?: Array<T>) {
  assert(
    'You cannot create an Ember Array with `new A()`, please update to calling A as a function: `A()`',
    !(this instanceof A),
  );

  // SAFTEY: Since we are extending prototypes all true native arrays are Ember NativeArrays
  return (arr || []) as NativeArray<T>;
};

import type MutableArray from '@ember/array/mutable';
/**
 * DANGER! this is a side-effect
 */
declare global {
  // eslint-disable-next-line @typescript-eslint/no-empty-object-type
  interface Array<T> extends Omit<MutableArray<T>, '[]'> {}
}
