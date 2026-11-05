import { A } from '@nullvoxpopuli/legacy-prototype-extensions/array';
import { module, test } from 'qunit';
import { A as EmberA } from '@ember/array';
import { addObserver } from '@ember/object/observers';
import { computed } from '@ember/object';
import { settled } from '@ember/test-helpers';
import { assert as emberAssert } from '@ember/debug';

const assertsEnabled = (() => {
  try {
    emberAssert('probe', false);

    return false;
  } catch {
    return true;
  }
})();

const debugTest = assertsEnabled ? test : test.skip;

interface Person {
  name: string;
  age: number;
  active?: boolean;
  greet?: (greeting: string) => string;
}

function people(): Person[] {
  return [
    { name: 'b', age: 2, active: true },
    { name: 'a', age: 2, active: false },
    { name: 'c', age: 1, active: true },
  ];
}

module('A', () => {
  test('works', (assert) => {
    assert.deepEqual(A([1, 1]), [1, 1]);
    assert.deepEqual(A(), []);
  });

  test('returns the same array', (assert) => {
    const arr = [1];

    assert.strictEqual(A(arr), arr);
  });

  debugTest('throws with new', (assert) => {
    assert.throws(() => {
      Reflect.construct(A, []);
    }, /You cannot create an Ember Array with `new A\(\)`/);
  });

  test('Ember A still works', (assert) => {
    assert.deepEqual(EmberA([1, 1]), [1, 1]);
  });

  test('handles array-like', (assert) => {
    const arrayLike = new Proxy([1, 1], {});

    assert.deepEqual(A(arrayLike), [1, 1]);
    assert.deepEqual(EmberA(arrayLike), [1, 1]);
  });
});

module('EmberArray methods', function () {
  test('objectAt / objectsAt', function (assert) {
    const arr = ['a', 'b', 'c'];

    assert.strictEqual(arr.objectAt(1), 'b');
    assert.strictEqual(arr.objectAt(5), undefined);
    assert.deepEqual(arr.objectsAt([0, 2, 5]), ['a', 'c', undefined]);
  });

  test('[]', function (assert) {
    const arr = [1, 2];

    assert.strictEqual(arr['[]'], arr);

    arr['[]'] = [3, 4, 5];

    assert.deepEqual(arr, [3, 4, 5]);
  });

  test('firstObject / lastObject', function (assert) {
    assert.strictEqual([1, 2, 3].firstObject, 1);
    assert.strictEqual([1, 2, 3].lastObject, 3);
    assert.strictEqual([].firstObject, undefined);
    assert.strictEqual([].lastObject, undefined);
  });

  test('getEach / mapBy', function (assert) {
    assert.deepEqual(people().getEach('name'), ['b', 'a', 'c']);
    assert.deepEqual(people().mapBy('age'), [2, 2, 1]);
  });

  test('setEach', function (assert) {
    const list = people();
    const result = list.setEach('age', 9);

    assert.strictEqual(result, list);
    assert.deepEqual(list.mapBy('age'), [9, 9, 9]);
  });

  test('reject', function (assert) {
    const target = { limit: 2 };

    assert.deepEqual(
      [1, 2, 3, 4].reject(function (this: typeof target, n) {
        return n > this.limit;
      }, target),
      [1, 2],
    );
  });

  test('filterBy / rejectBy', function (assert) {
    assert.deepEqual(people().filterBy('active').mapBy('name'), ['b', 'c']);
    assert.deepEqual(people().filterBy('age', 2).mapBy('name'), ['b', 'a']);
    assert.deepEqual(people().rejectBy('active').mapBy('name'), ['a']);
    assert.deepEqual(people().rejectBy('age', 2).mapBy('name'), ['c']);
    assert.deepEqual([{ a: undefined }, { a: 1 }].filterBy('a', undefined), [
      { a: undefined },
    ]);
  });

  test('findBy', function (assert) {
    assert.strictEqual(people().findBy('age', 2)?.name, 'b');
    assert.strictEqual(people().findBy('active', false)?.name, 'a');
    assert.strictEqual(people().findBy('age', 7), undefined);
  });

  test('isEvery / isAny / any', function (assert) {
    assert.true(people().isEvery('name'));
    assert.false(people().isEvery('active'));
    assert.true(people().isEvery('age', 2) === false);
    assert.true(people().isAny('active', false));
    assert.false(people().isAny('age', 7));
    assert.true([1, 2, 3].any((n) => n > 2));
    assert.false([1, 2, 3].any((n) => n > 3));
    assert.false([].isAny('anything'));
    assert.true([].isEvery('anything'));
  });

  test('invoke', function (assert) {
    const list: Person[] = [
      { name: 'a', age: 1, greet: (g) => `${g} a` },
      { name: 'b', age: 1 },
    ];

    assert.deepEqual(list.invoke('greet', 'hi'), ['hi a', undefined]);
  });

  test('invoke calls methods with the item as this', function (assert) {
    class Model {
      constructor(public id: number) {}

      save(suffix: string) {
        return `${this.id}${suffix}`;
      }
    }

    assert.deepEqual([new Model(1), new Model(2)].invoke('save', '!'), [
      '1!',
      '2!',
    ]);
  });

  test('toArray', function (assert) {
    const arr = [1, 2];
    const copy = arr.toArray();

    assert.deepEqual(copy, [1, 2]);
    assert.notStrictEqual(copy, arr);
  });

  test('compact', function (assert) {
    assert.deepEqual([1, null, 0, undefined, false, ''].compact(), [
      1,
      0,
      false,
      '',
    ]);
  });

  test('sortBy', function (assert) {
    const list = people();
    const sorted = list.sortBy('age', 'name');

    assert.deepEqual(sorted.mapBy('name'), ['c', 'a', 'b']);
    assert.deepEqual(list.mapBy('name'), ['b', 'a', 'c']);
  });

  test('uniq / uniqBy', function (assert) {
    assert.deepEqual([1, 2, 1, NaN, NaN].uniq(), [1, 2, NaN]);
    assert.deepEqual(people().uniqBy('age').mapBy('name'), ['b', 'c']);
    assert.deepEqual(
      [1, 2, 3, 4, 5, 6].uniqBy((n) => n % 2),
      [1, 2],
    );
  });

  test('without', function (assert) {
    const arr = [1, 2, 1, 3];

    assert.deepEqual(arr.without(1), [2, 3]);
    assert.strictEqual(arr.without(7), arr);
    assert.deepEqual([NaN, 1].without(NaN), [1]);
  });
});

module('MutableArray methods', function () {
  test('replace', function (assert) {
    const arr = [1, 2, 3, 4];

    assert.strictEqual(arr.replace(1, 2, [8, 9, 10]), arr);
    assert.deepEqual(arr, [1, 8, 9, 10, 4]);

    arr.replace(0, 1);
    assert.deepEqual(arr, [8, 9, 10, 4]);
  });

  debugTest('replace asserts on non-array items', function (assert) {
    assert.throws(
      // @ts-expect-error not an array
      () => [].replace(0, 0, 'nope'),
      /The third argument to replace needs to be an array/,
    );
  });

  test('replace handles very large inputs', function (assert) {
    const arr: number[] = [];
    const items = Array.from({ length: 200_000 }, (_, i) => i);

    arr.replace(0, 0, items);

    assert.strictEqual(arr.length, 200_000);
    assert.strictEqual(arr.lastObject, 199_999);
  });

  test('clear', function (assert) {
    const arr = [1, 2];

    assert.strictEqual(arr.clear(), arr);
    assert.deepEqual(arr, []);
    assert.deepEqual([].clear(), []);
  });

  test('insertAt / removeAt', function (assert) {
    const arr = ['a', 'c'];

    assert.strictEqual(arr.insertAt(1, 'b'), arr);
    assert.deepEqual(arr, ['a', 'b', 'c']);

    assert.strictEqual(arr.removeAt(0), arr);
    assert.deepEqual(arr, ['b', 'c']);

    arr.push('d', 'e');
    arr.removeAt(1, 2);
    assert.deepEqual(arr, ['b', 'e']);
  });

  debugTest('insertAt / removeAt assert on range', function (assert) {
    assert.throws(() => ['a'].insertAt(5, 'x'), /out of range/);
    assert.throws(() => ['a'].removeAt(5), /out of range/);
  });

  test('pushObject / pushObjects', function (assert) {
    const arr = [1];

    assert.strictEqual(arr.pushObject(2), 2);
    assert.strictEqual(arr.pushObjects([3, 4]), arr);
    assert.deepEqual(arr, [1, 2, 3, 4]);
  });

  test('popObject / shiftObject', function (assert) {
    const arr = [1, 2, 3];

    assert.strictEqual(arr.popObject(), 3);
    assert.strictEqual(arr.shiftObject(), 1);
    assert.deepEqual(arr, [2]);
    assert.strictEqual([].popObject(), null);
    assert.strictEqual([].shiftObject(), null);
  });

  test('unshiftObject / unshiftObjects', function (assert) {
    const arr = [3];

    assert.strictEqual(arr.unshiftObject(2), 2);
    assert.strictEqual(arr.unshiftObjects([0, 1]), arr);
    assert.deepEqual(arr, [0, 1, 2, 3]);
  });

  test('reverseObjects', function (assert) {
    const arr = [1, 2, 3];

    assert.strictEqual(arr.reverseObjects(), arr);
    assert.deepEqual(arr, [3, 2, 1]);
  });

  test('setObjects', function (assert) {
    const arr = [1, 2, 3];

    assert.strictEqual(arr.setObjects([4, 5]), arr);
    assert.deepEqual(arr, [4, 5]);

    arr.setObjects([]);
    assert.deepEqual(arr, []);
  });

  test('removeObject / removeObjects', function (assert) {
    const arr = [1, 2, 1, 3, 4, 3];

    assert.strictEqual(arr.removeObject(1), arr);
    assert.deepEqual(arr, [2, 3, 4, 3]);

    assert.strictEqual(arr.removeObjects([3, 4]), arr);
    assert.deepEqual(arr, [2]);
  });

  test('addObject / addObjects', function (assert) {
    const arr = [1];

    assert.strictEqual(arr.addObject(1), arr);
    assert.strictEqual(arr.addObject(2), arr);
    assert.strictEqual(arr.addObjects([2, 3, 3]), arr);
    assert.deepEqual(arr, [1, 2, 3]);
  });
});

module('Observable methods', function () {
  test('get / set / getProperties / setProperties', function (assert) {
    const arr = [1, 2, 3] as number[] & { foo?: string; bar?: string };

    assert.strictEqual(arr.get('length'), 3);
    assert.strictEqual(arr.get('firstObject'), 1);
    assert.strictEqual(arr.set('foo', 'x'), 'x');
    assert.strictEqual(arr.foo, 'x');
    assert.deepEqual(arr.setProperties({ bar: 'y' }), { bar: 'y' });
    assert.deepEqual(arr.getProperties('foo', 'bar'), { foo: 'x', bar: 'y' });
    assert.deepEqual(arr.getProperties(['foo', 'bar']), {
      foo: 'x',
      bar: 'y',
    });
  });

  test('incrementProperty / decrementProperty / toggleProperty', function (assert) {
    const arr = [] as number[] & { count?: number; flag?: boolean };

    assert.strictEqual(arr.incrementProperty('count'), 1);
    assert.strictEqual(arr.incrementProperty('count', 5), 6);
    assert.strictEqual(arr.decrementProperty('count', 2), 4);
    assert.true(arr.toggleProperty('flag'));
    assert.false(arr.toggleProperty('flag'));
  });

  test('addObserver / removeObserver / notifyPropertyChange', async function (assert) {
    const arr = [1];
    const calls: string[] = [];
    const observer = (_obj: unknown, key: string) => {
      calls.push(key);
    };

    assert.strictEqual(arr.addObserver('[]', null, observer), arr);

    arr.pushObject(2);
    await settled();
    assert.deepEqual(calls, ['[]']);

    assert.strictEqual(arr.notifyPropertyChange('[]'), arr);
    await settled();
    assert.deepEqual(calls, ['[]', '[]']);

    assert.strictEqual(arr.removeObserver('[]', null, observer), arr);

    arr.pushObject(3);
    await settled();
    assert.deepEqual(calls, ['[]', '[]']);
  });

  test('mutations notify observers on length, firstObject, lastObject', async function (assert) {
    const arr = [1, 2];
    const calls: string[] = [];
    const observer = (_obj: unknown, key: string) => {
      calls.push(key);
    };

    addObserver(arr, 'length', null, observer, true);
    addObserver(arr, 'firstObject', null, observer, true);
    addObserver(arr, 'lastObject', null, observer, true);

    arr.pushObject(3);
    assert.deepEqual(calls.sort(), ['lastObject', 'length']);

    calls.length = 0;
    arr.unshiftObject(0);
    assert.deepEqual(calls.sort(), ['firstObject', 'length']);

    calls.length = 0;
    arr.replace(1, 1, [9]);
    assert.deepEqual(calls, []);

    await settled();
  });

  test('cacheFor', function (assert) {
    assert.strictEqual([].cacheFor('anything'), undefined);
  });

  test('computed properties depending on [] recompute', function (assert) {
    class Thing {
      list = [1, 2, 3];

      @computed('list.[]')
      get total() {
        return this.list.reduce((a, b) => a + b, 0);
      }
    }

    const thing = new Thing();

    assert.strictEqual(thing.total, 6);

    thing.list.pushObject(4);
    assert.strictEqual(thing.total, 10);

    thing.list.removeObject(1);
    assert.strictEqual(thing.total, 9);
  });

  test('computed properties depending on @each recompute', function (assert) {
    class Thing {
      list = people();

      @computed('list.@each.age')
      get ages() {
        return this.list.mapBy('age');
      }
    }

    const thing = new Thing();

    assert.deepEqual(thing.ages, [2, 2, 1]);

    thing.list.setEach('age', 5);
    assert.deepEqual(thing.ages, [5, 5, 5]);

    thing.list.pushObject({ name: 'd', age: 0 });
    assert.deepEqual(thing.ages, [5, 5, 5, 0]);
  });
});
