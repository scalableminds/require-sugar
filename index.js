var path = require("path");
var through = require('through2');
var applySourceMap = require('vinyl-sourcemaps-apply');
var sourceMap = require('source-map');

var matcher = {
  jsComment : /^\s*(\/\*\s*define([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)/,
  coffeeComment : /^\s*(###\s*define([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*?###)/,
  iife : /^(.|\n)*?(\s*\(function\(\)\s*{)((.|\n)*)(}\)((\.call\(this\))|(\(\)));[\s\n]*)$/,
  getDependencyLine : function(global) {
    var dependencyPath = "\\s*([^\"\\n\\s\\:]+)\\s*";
    return new RegExp(dependencyPath + ":" + dependencyPath, global ? "gm" : "m");
  },
  getComment : function(isCoffee) {
    if (isCoffee) {
      return this.coffeeComment;
    } else {
      return this.jsComment;
    }
  }
};

function sugar(options) {
  return function(source, filename) {
    source = source.toString();
    options = options || {};
    if (filename === undefined) {
      console.warn("No filename provided. JavaScript is assumed.");
      filename = "";
    }

    var isCoffee = path.extname(filename) == ".coffee";
    var indent = getIndent(options);

    var commentMatcher = matcher.getComment(isCoffee);
    var commentMatch = commentMatcher.exec(source);
    if (!commentMatch) {
      return source;
    }

    var defines = getDefines(commentMatch);

    var cleanedSource = cleanSource(source, commentMatch, indent);
    var parameters = getDefineParameters(defines.sources, defines.targets);

    return wrapInDefine(cleanedSource, parameters, isCoffee);
  };
}

function getIndent(options) {
  return options.indent || "  ";
}

function getDefines(commentMatch) {
  var defines = {
    sources: [],
    targets: []
  };

  var matches = commentMatch[0].match(matcher.getDependencyLine(true)) || [];

  matches.map(function(match) {
    var pair = match.match(matcher.getDependencyLine(false));
    if (pair) {
      defines.sources.push(pair[1]);
      defines.targets.push(pair[2]);
    }
  });

  return defines;
}


function cleanSource(source, commentMatch, indent) {
  // removes the define comment, unpacks potential IIFE and indents the code

  var cleanedSource =
    source.slice(0, commentMatch.index) +
    source.slice(commentMatch.index +
    commentMatch[0].length);

  cleanedSource = unpackIIFE(cleanedSource);
  cleanedSource = cleanedSource
    .split("\n")
    .map(function(line) {
      if (line === "")
        return line;
      return indent + line;
    })
    .join("\n");

  return cleanedSource;
}


function wrapInDefine(source, parameters, isCoffee) {
  var codeAsFunction;
  if (isCoffee) {
    codeAsFunction = "(" + parameters.targets + ") -> \n" + source + "\n";
  } else {
    codeAsFunction = "function(" + parameters.targets + ") {\n" + source + "\n}";
  }

  return "define([" + parameters.sources + "], " + codeAsFunction + ");";
}


function getDefineParameters(sources, targets) {
  return {
    sources :
      sources
        .map(function(s) { return '"' + s + '"';})
        .join(", "),

    targets :
      targets.join(", ")
  };
}


function unpackIIFE(source) {
  var iffeeMatch = matcher.iife.exec(source);

  if (iffeeMatch) {
    return iffeeMatch[3];
  } else {
    return source;
  }
}

function requireSugar(options) {

  return through.obj(transform);

  function getMap(fileName, sourceName, fileContents) {
    var map = new sourceMap.SourceMapGenerator({
      file: fileName
    });

    var lineCount = fileContents.toString().split("\n").length;
    var offsets = {
      original: 4,
      generated: 2
    };

    for (var i = 1; i <= lineCount - offsets.original; i++) {
      map.addMapping({
        original: {
          line: offsets.original + i,
          column: 1
        },
        generated: {
          line: offsets.generated + i,
          column: 1 + getIndent(options).length,
        },
        source: sourceName
      });
    }

    return map.toString();
  }

  function transform(file, encoding, callback) {
    if (!options) {
      options = {};
    }
    console.log("file.sourceMap",  file.sourceMap);
    if (file.sourceMap) {
      options.makeSourceMaps = true;
    }

    var filename = path.basename(file.path);
    var code = sugar(options)(file.contents, filename);

    file.contents = new Buffer(code);

    if (file.sourceMap) {
      var map = getMap(filename, file.path, file.contents)
      applySourceMap(file, map);
    }

    this.push(file);
    callback();
  }

};

requireSugar.unpackIIFE = unpackIIFE;
requireSugar.sugar = sugar;

module.exports = requireSugar;