# @nullvoxpopuli/legacy-prototype-extensions

Want to upgrade ember to v6? [but your app has _intense_ usage of array prototype extensions](https://deprecations.emberjs.com/v5.x#toc_deprecate-array-prototype-extensions)?

Now you can keep them alive with this addon.

(You should still consider getting rid of the prototype extensions tho).


This addon is not meant for new projects!!!!


## Usage

```js
// somewhere -- perhaps app/app.js
import '@nullvoxpopuli/legacy-prototype-extensions/array';

```

and that's it.

This library adds the `NativeArray` methods to `Array.prototype` again.
It does not use `NativeArray`, `Mixin`, or other deprecated Ember APIs to do this.
The methods come from [ember-undeprecate-ember-a](https://github.com/NullVoxPopuli/ember-undeprecate-ember-a).
Only `addObserver`, `removeObserver`, and `cacheFor` are implemented here, with `@ember/object/observers` and `@ember/object/internals`, because ember-undeprecate-ember-a does not support observers.

The [deprecation guide](https://deprecations.emberjs.com/v5.x#toc_deprecate-array-prototype-extensions) tells you to set `EXTEND_PROTOTYPES: false`. You can do that, and you do not need to change other code.

If you use `A()`, you can import it from this library:

```js
import { A } from '@nullvoxpopuli/legacy-prototype-extensions/array';
```

### Differences from Ember's `NativeArray`

- The methods do not send array observer events (`@array:before` / `@array:change`). Ember can only send these with deprecated APIs. Thus, an `ArrayProxy` (deprecated in Ember 7.4) that wraps a native array does not see changes made with these methods. Tracked templates, `computed('arr.[]')`, `computed('arr.@each.prop')`, and observers on `length`, `[]`, `firstObject`, and `lastObject` continue to update.
- `EmberArray.detect([])` and `MutableArray.detect([])` return `false`. Before, they returned `true`, because the mixin was applied to `Array.prototype`. Use `Array.isArray` or `isArray` from `@ember/array` instead.
- `addObjects` and `removeObjects` do not batch their changes. Synchronous observers run one time for each item.
- The private `beginPropertyChanges`, `endPropertyChanges`, and `hasObserverFor` methods are not added.
- `setEach` returns `undefined`, as Ember's `setEach` does. Versions 0.1.0 and earlier of this library returned the array.
