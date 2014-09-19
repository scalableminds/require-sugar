function unpackIIFE(source) {
  var iffeeMatch;
  var iffeeMatcher = /^(\s*\(function\(\)\s*{)((.|\n)*)(}\)[\s\n]*)$/;

  if (iffeeMatch = iffeeMatcher.exec(source)) {
    return [iffeeMatch[1], iffeeMatch[2], iffeeMatch[4]];
  } else {
    return source;
  }
}

function repack(unpackedParts) {
  return unpackedParts.join("");
}

function requireSugar(source) {
  var commentMatcher = /^\s*(\/\*\s*define([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)/;
  var commentMatch;
  if (commentMatch = commentMatcher.exec(source)) {

    var sources = [];
    var targets = [];

    var matches = commentMatch[0].match(/\s*([^\"\n\s\:]+)\s*:\s*([^\"\n\s\:]+)\s*/gm);

    matches.map(function(match) {
      if (pair = match.match(/\s*([^\"\n\s\:]+)\s*:\s*([^\"\n\s\:]+)\s*/m)) {
        sources.push(pair[1])
        targets.push(pair[2])
      }
    });

    var sourceWithoutComment = source.slice(0, commentMatch.index) + source.slice(commentMatch.index + commentMatch[0].length);

    return "define([" + sources.map(function(s) { return '"' + s + '"'}).join(", ") + "], function(" + targets.join(", ") + ") {\n" + sourceWithoutComment + "\n})";
  } else {
    return source;
  }
}


requireSugar.unpackIIFE = unpackIIFE;
requireSugar.repack = repack;

module.exports = requireSugar;