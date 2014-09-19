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
      "logFn(t1, t2, t3)"
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

  it("unpacks an IFFE", function() {
    var source = "(function() { var a; })";
    var unpacked = requireSugar.unpackIIFE(source);
    expect(unpacked[1]).toEqual(" var a; ");

    expect(requireSugar.repack(unpacked)).toEqual(source);
  });
});
