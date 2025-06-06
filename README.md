# @nullvoxpopuli/legacy-prototype-extensions

Want to upgrade ember to v6? [but your app have _intense_ usage of array prototype extensions](https://deprecations.emberjs.com/v5.x#toc_deprecate-array-prototype-extensions)?

Now you can keep them alive with this addon.

(You should still consider getting rid of the prototype extensions tho).


This addon is not meant for new projects!!!!


## Usage

```js
// somewhere -- perhaps app/app.js
import '@nullvoxpopuli/legacy-prototype-extensions';

```

and that's it.
This library re-patches the Array.prototype, but allows you to set 

You can set `EXTEND_PROTOTYPES: false`, just as the [deprecation guide](https://deprecations.emberjs.com/v5.x#toc_deprecate-array-prototype-extensions) says, but you don't need to change any code.
