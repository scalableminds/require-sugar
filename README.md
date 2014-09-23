require-sugar [![build status](https://secure.travis-ci.org/scalableminds/require-sugar.png)](http://travis-ci.org/scalableminds/require-sugar)
=================



## Installation

```bash
$ npm install require-sugar
```


## Example integration with gulp

For JavaScript:
```javascript
gulp.src(options.src.scripts)
  .pipe(requireSugar())                      // <--
  .pipe(gulp.dest(options.dest.scripts));
```

CoffeeScript files should be processed as coffee-files and not as js-files.
This leverages CoffeeScript's feature that the last statement is always returned.

```javascript
gulp.src(options.src.scripts)
  .pipe(requireSugar())                      // <--
  .pipe($.coffee())
  .pipe(gulp.dest(options.dest.scripts));
```

## License
MIT &copy; scalable minds 2014
