var matcher = {
  jsComment : /^\s*(\/\*\s*define([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)/,
  coffeeComment : /^\s*(###\s*define([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*?###)/,
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


function requireSugar(options) {
  return function(source) {
    source = source.toString();
    options = options || {};
    var isCoffee = options.coffee;
    var indent = options.indent || "  ";

    var commentMatcher = matcher.getComment(isCoffee);
    var commentMatch = commentMatcher.exec(source);
    if (!commentMatch) {
      return source;
    }

    var defines = getDefines(commentMatch);

    var cleanedSource = cleanSource(source, commentMatch, indent);
    var parameters = getDefineParameters(defines.sources, defines.targets);

    return wrapInDefine(cleanedSource, parameters, isCoffee);
  }
}


function getDefines(commentMatch) {
  var defines = {
    sources: [],
    targets: []
  }

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
    source.slice(0, commentMatch.index)
    + source.slice(commentMatch.index
    + commentMatch[0].length);

  cleanedSource = unpackIIFE(cleanedSource);
  cleanedSource = cleanedSource
    .split("\n")
    .map(function(line) { return indent + line;})
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

    targets :targets.join(", ")
  };
}


function unpackIIFE(source) {
  var iffeeMatcher = /^(.|\n)*?(\s*\(function\(\)\s*{)((.|\n)*)(}\)((\.call\(this\))|(\(\)));[\s\n]*)$/;
  var iffeeMatch = iffeeMatcher.exec(source);

  if (iffeeMatch) {
    return iffeeMatch[3];
  } else {
    return source;
  }
}

requireSugar.unpackIIFE = unpackIIFE;
module.exports = requireSugar;