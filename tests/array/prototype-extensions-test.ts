import '@nullvoxpopuli/legacy-prototype-extensions/array';
import { module, test } from 'qunit';

module('array prototype extensions', function () {
  test('uniqBy', function (assert) {
    const arr = [1, 2, 3, 4, 5, 6];
    const result = arr.uniqBy((n) => n % 2);

    assert.deepEqual(result, [1, 2]);
  });
});
