import '@nullvoxpopuli/legacy-prototype-extensions/array';
import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, settled } from '@ember/test-helpers';

module('rendering', function (hooks) {
  setupRenderingTest(hooks);

  test('templates update after mutations', async function (assert) {
    const list = ['a', 'b'];

    await render(
      <template>
        <output id="length">{{list.length}}</output>
        <output id="first">{{list.firstObject}}</output>
        <output id="last">{{list.lastObject}}</output>
        <ul>{{#each list as |item|}}<li>{{item}}</li>{{/each}}</ul>
      </template>,
    );

    assert.dom('#length').hasText('2');
    assert.dom('#first').hasText('a');
    assert.dom('#last').hasText('b');
    assert.dom('li').exists({ count: 2 });

    list.pushObject('c');
    await settled();

    assert.dom('#length').hasText('3');
    assert.dom('#last').hasText('c');
    assert.dom('li').exists({ count: 3 });

    list.unshiftObject('z');
    await settled();

    assert.dom('#first').hasText('z');
    assert.dom('li').exists({ count: 4 });

    list.removeObjects(['z', 'c']);
    await settled();

    assert.dom('#length').hasText('2');
    assert.dom('#first').hasText('a');
    assert.dom('#last').hasText('b');

    list.clear();
    await settled();

    assert.dom('#length').hasText('0');
    assert.dom('#first').hasText('');
    assert.dom('li').doesNotExist();
  });
});
