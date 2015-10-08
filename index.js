var path = require("path");
var through = require('through2');
var applySourceMap = require('vinyl-sourcemaps-apply');
var sourceMap = require('source-map');
var charProps = require('char-props');

var lineEnding;
var matcher = {
  jsComment : /^\s*(\/\*\s*define([^*]|(\r?\n)|(\*+([^*\/]|(\r?\n))))*\*+\/\r?\n)/,
  coffeeComment : /^\s*(###\s*define([^*]|(\r?\n)|(\*+([^*\/]|(\r?\n))))*?###\r?\n)/,
  iife : /^(.|(\r?\n))*?(\s*\(function\(\)\s*{)((.|(\r?\n))*)(}\)((\.call\(this\))|(\(\)));(\s|(\r?\n))*)$/,
  getDependencyLine : function(global) {
    var dependencyPath = "\\s*([^\"\\r\\n\\s\\:]+)\\s*";
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

    checkLineEndings(source);

    var isCoffee = isFileCoffee(filename);
    var indent = getIndent(options);

    var commentMatcher = matcher.getComment(isCoffee);
    var commentMatch = commentMatcher.exec(source);
    if (!commentMatch) {
      return source;
    }

    var defines = getDefines(commentMatch);

    var cleanedSource = cleanSource(source, commentMatch, indent);

    var importLines = [];
    for(var i = 0; i < defines.sources.length; i++) {
      if (isCoffee) {
        importLines.push(defines.targets[i] + " = require(\"" + defines.sources[i] + "\")");
      } else {
        importLines.push("var " + defines.targets[i] + " = require(\"" + defines.sources[i] + "\");");
      }
    }

    return importLines.join("\n") + "\n" + cleanedSource;
  };
}

function checkLineEndings(source) {
  var nCount = source.split("\n").length;
  var rCount = source.split("\r").length;
  if (nCount > 0 && nCount == rCount) {
    lineEnding = "\r\n";
  } else {
    lineEnding = "\n";
  }
}

function getIndent(options) {
  if (options && typeof options.indent == "string") {
    return options.indent;
  } else {
    return "  ";
  }
}

function isFileCoffee(filename) {
  return path.extname(filename) == ".coffee";
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
  // removes the define comment and indents the code

  var cleanedSource =
    source.slice(0, commentMatch.index) +
    source.slice(commentMatch.index + commentMatch[0].length);

  cleanedSource = cleanedSource
    .split(/\r?\n/)
    .map(function(line) {
      if (line === "")
        return line;
      return indent + line;
    })
    .join(lineEnding);

  return cleanedSource;
}


function wrapInDefine(source, parameters, isCoffee) {
  var codeAsFunction;
  if (isCoffee) {
    codeAsFunction = "(" + parameters.targets + ") -> " + lineEnding + source + lineEnding;
  } else {
    codeAsFunction = "function(" + parameters.targets + ") {" + lineEnding + source + lineEnding + "}";
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
    return iffeeMatch[4];
  } else {
    return source;
  }
}

function getCoordinates(haystack, needle) {
  var needleIndex;
  if ((typeof needle) === "number") {
    // needle is already the index
    needleIndex = needle;
  } else {
    needleIndex = haystack.indexOf(needle);
  }

  var props = charProps(haystack);
  return {
    line: props.lineAt(needleIndex) + 1,
    column: props.columnAt(needleIndex) + 1
  };
}

function getMap(fileName, sourceName, originalSource, generatedSource, options) {
  var map = new sourceMap.SourceMapGenerator({
    file: fileName
  });

  var defineToken = "define([";

  var commentMatcher = matcher.getComment(isFileCoffee(fileName));
  var commentMatch = commentMatcher.exec(originalSource);
  var commentEndIndex = commentMatch.index + commentMatch[0].length;

  var orgCoords = getCoordinates(originalSource, commentEndIndex);
  var genCoords = getCoordinates(generatedSource, defineToken);

  var offset = orgCoords.line - (genCoords.line + 1);

  var lineCount = generatedSource.split(/\r?\n/).length;
  for (var i = genCoords.line + 1; i < lineCount; i++) {
    map.addMapping({
      original: {
        line: i + offset,
        column: 1
      },
      generated: {
        line: i,
        column: 1 + getIndent(options).length,
      },
      source: sourceName
    });
  }

  return map.toString();
}

function requireSugar(options) {

  return through.obj(transform);


  function transform(file, encoding, callback) {
    if (!options) {
      options = {};
    }

    if (file.sourceMap) {
      options.makeSourceMaps = true;
    }

    var filename = path.basename(file.path);
    var originalSource = file.contents.toString();
    var generatedSource = sugar(options)(file.contents, filename);

    file.contents = new Buffer(generatedSource);

    if (file.sourceMap && originalSource != generatedSource) {
      var map = getMap(filename, file.path, originalSource, generatedSource, options);
      applySourceMap(file, map);
    }

    this.push(file);
    callback();
  }

};

requireSugar.sugar = sugar;
requireSugar._getMap = getMap;
requireSugar._unpackIIFE = unpackIIFE;
requireSugar._getCoordinates = getCoordinates;

module.exports = requireSugar;