var requireSugar = require("../index.js");
var coffee = require("coffee-script");

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
    ];

    sugarRun(source, "javascript.js", function (called, log, module) {
      expect(log).toEqual(["s/1", "s2", "s"]);
    });
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

    expect(requireSugar()(source, "javascript.js")).toEqual(source);
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
    ];

    sugarRun(source, "javascript.js", function (called, log, module) {
      expect(log).toEqual(["s/1"]);
    });
  });

  it("sugars empty define", function() {
    var source = [
      "/* define",
      "*/",
      "logFn.apply(null, arguments);",
    ];

    sugarRun(source, "javascript.js", function(called, log, module) {
      expect(log).toEqual([]);
      expect(called).toBe(true);
    });
  });

  it("sugars coffee code", function() {
    var source = [
      "### define",
      "a : b",
      "c : d",
      "###",
      "logFn(b, d)",
      "class A",
      "  constructor: ->"
    ];

    sugarRun(source, "coffee.coffee", function(called, log, module) {
      expect(log).toEqual(["a", "c"]);
      expect(module).toNotBe(undefined);
      expect(new module()).toNotBe(undefined);
    });
  });

  function sugarRun(sourceArray, fileName, callback) {

    var source = sourceArray.join("\n");

    var log = [];
    var called = false;
    var logFn = function() {
      log.push.apply(log, arguments);
      called = true;
    };

    var module = null;
    var define = function(arr, cb) {
      module = cb.apply(null, arr);
    };

    var sugaredCode = requireSugar()(source, fileName);

    if (fileName.indexOf(".coffee") > -1) {
      sugaredCode = coffee.compile(sugaredCode);
    }

    eval(sugaredCode);

    callback(called, log, module);
  }
});
