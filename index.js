function unpackIIFE(source) {
  var iffeeMatcher = /^(\s*\(function\(\)\s*{)((.|\n)*)(}\)[\s\n]*)$/;
  var iffeeMatch = iffeeMatcher.exec(source);

  if (iffeeMatch) {
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
  var commentMatch = commentMatcher.exec(source);
  if (commentMatch) {

    var sources = [];
    var targets = [];

    var matches = commentMatch[0].match(/\s*([^\"\n\s\:]+)\s*:\s*([^\"\n\s\:]+)\s*/gm);

    matches.map(function(match) {
      var pair = match.match(/\s*([^\"\n\s\:]+)\s*:\s*([^\"\n\s\:]+)\s*/m);
      if (pair) {
        sources.push(pair[1]);
        targets.push(pair[2]);
      }
    });

    var sourceWithoutComment = source.slice(0, commentMatch.index) + source.slice(commentMatch.index + commentMatch[0].length);

    var sourceParameters = sources.map(function(s) { return '"' + s + '"';}).join(", ");
    var targetParameters = targets.join(", ");

    return "define([" + sourceParameters + "], function(" + targetParameters + ") {\n" + sourceWithoutComment + "\n})";
  } else {
    return source;
  }
}


requireSugar.unpackIIFE = unpackIIFE;
requireSugar.repack = repack;

module.exports = requireSugar;