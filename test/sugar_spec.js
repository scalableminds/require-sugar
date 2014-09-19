var requireSugar = require("../index.js");

describe("require-sugar", function() {

  it("can transform a simple define block", function() {
    var source = [
      "",
      "/* define",
      " s/1 : t1",
      " s2 : t2",
      " s : t3",
      " */",
      "// other comment",
      "logFn(t1, t2, t3);"
    ].join("\n");

    var log = [];
    var logFn = function() {
      log.push.apply(log, arguments);
    };

    var define = function(arr, cb) {
      cb.apply(null, arr);
    };

    var sugaredCode = requireSugar(source);
    eval(sugaredCode);

    expect(log).toEqual(["s/1", "s2", "s"]);
  });

  it("ignores a define block which is not at the top of the file", function() {
    var source = [
      "code",
      "/* define",
      " s/1 : t1",
      " s2 : t2",
      " s : t3",
      " */"
    ].join("\n");

    expect(requireSugar(source)).toEqual(source);
  });

  it("unpacks an IIFE", function() {
    var source = "(function() { var a; }).call(this);";
    var unpacked = requireSugar.unpackIIFE(source);
    expect(unpacked).toEqual(" var a; ");
  });

  it("sugars code in IIFE", function() {
    var source = [
      "/* define",
      " s/1 : t1",
      " */",
      "(function() { logFn(t1); }).call(this);",
    ].join("\n");

    var log = [];
    var logFn = function() {
      log.push.apply(log, arguments);
    };

    var define = function(arr, cb) {
      cb.apply(null, arr);
    };

    var sugaredCode = requireSugar(source);
    eval(sugaredCode);

    expect(log).toEqual(["s/1"]);
  });

  it("sugars empty define", function() {
    var source = [
      "/* define",
      "*/",
      "logFn.apply(null, arguments);",
    ].join("\n");


    var log = [];
    var called = false;
    var logFn = function() {
      log.push.apply(log, arguments);
      called = true;
    };

    var define = function(arr, cb) {
      cb.apply(null, arr);
    };

    var sugaredCode = requireSugar(source);
    eval(sugaredCode);

    expect(log).toEqual([]);
    expect(called).toBe(true);
  });
});
