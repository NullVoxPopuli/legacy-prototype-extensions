import { NativeArray } from '@ember/array';
import { module, test } from 'qunit';

module('apply', function () {
  test('should not create non-symbol, enumerable properties that refer to itself', function (assert) {
    // Don't want to pollute Array.prototype so we make a fake / simple prototype
    function ThrowAwayArray() {}

    // Extend our throw-away prototype (like EXTEND_PROTOTYPES.Array would)
    NativeArray.apply(ThrowAwayArray.prototype);

    // Create an instance to test
    const obj = new ThrowAwayArray();

    // Make sure that no enumerable properties refer back to the object (creating a cyclic structure)
    for (const p in obj) {
      assert.notStrictEqual(
        obj[p],
        obj,
        `Property "${p}" is an enumerable part of the prototype
        so must not refer back to the original array.
        Otherwise code that explores all properties,
        such as jQuery.extend and other "deep cloning" functions,
        will get stuck in an infinite loop.
        `.replace(/\s+/g, ' '),
      );
    }
  });
});
