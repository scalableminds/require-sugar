require-sugar [![build status](https://secure.travis-ci.org/scalableminds/require-sugar.png)](http://travis-ci.org/scalableminds/require-sugar)
=================



## Installation

```bash
$ npm install require-sugar
```


## Example integration with gulp

For JavaScript:
```javascript
var map = require("vinyl-map");
gulp.src(options.src.scripts)
  .pipe(map(requireSugar()))                      // <--
  .pipe(gulp.dest(options.dest.scripts));
```

For CoffeeScript:

```javascript
var map = require("vinyl-map");
gulp.src(options.src.scripts)
  .pipe(map(requireSugar({coffee: true})))        // <--
  .pipe($.coffee())
  .pipe(gulp.dest(options.dest.scripts));
```
