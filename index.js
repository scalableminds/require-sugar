function unpackIIFE(source) {
  var iffeeMatcher = /^(.|\n)*?(\s*\(function\(\)\s*{)((.|\n)*)(}\)((\.call\(this\))|(\(\)));[\s\n]*)$/;
  var iffeeMatch = iffeeMatcher.exec(source);

  if (iffeeMatch) {
    return iffeeMatch[3];
  } else {
    return source;
  }
}

function repack(unpackedParts) {
  return unpackedParts.join("");
}

function requireSugar(source) {
  source = source.toString();

  var commentMatcher = /^\s*(\/\*\s*define([^*]|[\r\n]|(\*+([^*\/]|[\r\n])))*\*+\/)/;
  var commentMatch = commentMatcher.exec(source);
  if (commentMatch) {

    var sources = [];
    var targets = [];

    var matches = commentMatch[0].match(/\s*([^\"\n\s\:]+)\s*:\s*([^\"\n\s\:]+)\s*/gm);

    if (matches) {
      matches.map(function(match) {
        var pair = match.match(/\s*([^\"\n\s\:]+)\s*:\s*([^\"\n\s\:]+)\s*/m);
        if (pair) {
          sources.push(pair[1]);
          targets.push(pair[2]);
        }
      });
    }

    var sourceWithoutComment = source.slice(0, commentMatch.index) + source.slice(commentMatch.index + commentMatch[0].length);
    var unpackedSource = unpackIIFE(sourceWithoutComment);

    var sourceParameters = sources.map(function(s) { return '"' + s + '"';}).join(", ");
    var targetParameters = targets.join(", ");

    return "define([" + sourceParameters + "], function(" + targetParameters + ") {\n" + unpackedSource + "\n});";
  } else {
    return source;
  }
}


requireSugar.unpackIIFE = unpackIIFE;
requireSugar.repack = repack;

module.exports = requireSugar;