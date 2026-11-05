import { assert } from '@ember/debug';
import { removeObserver, addObserver } from '@ember/object/observers';
import { cacheFor } from '@ember/object/internals';
import { createNativeArray } from 'ember-undeprecate-ember-a/native-array';

const shared = createNativeArray(array => array);
const accessors = shared.accessors;
const methods = {
  ...shared.methods,
  addObserver(key, target, method, sync) {
    addObserver(this, key, target, method, sync);
    return this;
  },
  removeObserver(key, target, method, sync) {
    removeObserver(this, key, target, method, sync);
    return this;
  },
  cacheFor(key) {
    return cacheFor(this, key);
  }
};
function define(key, descriptor) {
  if (key in Array.prototype) {
    return;
  }
  Object.defineProperty(Array.prototype, key, {
    configurable: true,
    enumerable: false,
    ...descriptor
  });
}
for (const [key, value] of Object.entries(methods)) {
  define(key, {
    value,
    writable: true
  });
}
for (const [key, descriptor] of Object.entries(accessors)) {
  define(key, descriptor);
}
const A = function (arr) {
  assert('You cannot create an Ember Array with `new A()`, please update to calling A as a function: `A()`', !(this instanceof A));
  return arr ?? [];
};

export { A };
//# sourceMappingURL=array.js.map
