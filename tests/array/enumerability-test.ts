import '@nullvoxpopuli/legacy-prototype-extensions/array';
import { module, test } from 'qunit';

module('enumerability', function () {
  test('arrays only expose their indices as enumerable keys', function (assert) {
    const arr = [1, 2];
    const keys: string[] = [];

    for (const key in arr) {
      keys.push(key);
    }

    assert.deepEqual(keys, ['0', '1']);
    assert.deepEqual(Object.keys(arr), ['0', '1']);
  });

  test('no prototype property is enumerable', function (assert) {
    const enumerable = Object.entries(
      Object.getOwnPropertyDescriptors(Array.prototype),
    )
      .filter(([, descriptor]) => descriptor.enumerable)
      .map(([key]) => key);

    assert.deepEqual(enumerable, []);
  });

  test('native methods are left untouched', function (assert) {
    const iframe = document.createElement('iframe');
    document.body.appendChild(iframe);

    const pristine = (iframe.contentWindow as unknown as typeof globalThis)
      .Array.prototype;

    for (const key of Object.getOwnPropertyNames(pristine)) {
      const ours = Object.getOwnPropertyDescriptor(Array.prototype, key);
      const theirs = Object.getOwnPropertyDescriptor(pristine, key);

      assert.strictEqual(
        typeof ours?.value,
        typeof theirs?.value,
        `${key} keeps its native shape`,
      );

      if (typeof ours?.value === 'function') {
        assert.true(
          String(ours.value).includes('[native code]'),
          `${key} is native`,
        );
      }
    }

    iframe.remove();
  });
});
