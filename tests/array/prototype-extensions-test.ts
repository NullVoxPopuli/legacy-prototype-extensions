import '@nullvoxpopuli/legacy-prototype-extensions/array';
import { module, test } from 'qunit';
import { A } from '@ember/array';

module('A', () => {
  test('works', (assert) => {
    assert.deepEqual(A([1, 1]), [1, 1]);
  });

  test('handles array-like', (assert) => {
    const arrayLike = new Proxy([1, 1], {});

    assert.deepEqual(A(arrayLike), [1, 1]);
  });
});

module('array prototype extensions', function () {
  test('uniqBy', function (assert) {
    const arr = [1, 2, 3, 4, 5, 6];
    const result = arr.uniqBy((n) => n % 2);

    assert.deepEqual(result, [1, 2]);
  });
});
