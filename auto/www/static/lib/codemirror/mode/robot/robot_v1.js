// CodeMirror, copyright (c) by Marijn Haverbeke and others
// Distributed under an MIT license: http://codemirror.net/LICENSE

(function(mod) {
  if (typeof exports == "object" && typeof module == "object") // CommonJS
    mod(require("../../lib/codemirror"));
  else if (typeof define == "function" && define.amd) // AMD
    define(["../../lib/codemirror"], mod);
  else // Plain browser env
    mod(CodeMirror);
})(function(CodeMirror) {
"use strict";

CodeMirror.defineMode("robot", function() {

  var cons = ['true', 'false', 'on', 'off', 'yes', 'no'];
  var keywordRegex = new RegExp("\\b(("+cons.join(")|(")+"))$", 'i');

  function RobotKeywordRegexp(words) {
    return new RegExp("^((\\s{4}" + words.join(")|(") + "))\\b");
  }

  // 高亮关键字
  var robot_keywords_reg = RobotKeywordRegexp(high_light);

  // 智能提示
  CodeMirror.registerHelper("hintWords", "robot", auto_complete);

  return {
    token: function(stream, state) {
      var ch = stream.peek();
      var esc = state.escaped;
      state.escaped = false;

      /*robot framework start*/
      if (stream.match(/(Library|Resource|Variables|Documentation|Metadata|Suite Setup|Suite Teardown|Force Tags|Default Tags|Test Setup|Test Teardown|Test Template|Test Timeout|Task Setup|Task Teardown|Task Template|Task Timeout| FOR | IN RANGE |IN ENUMERATE| IN ZIP | IN |END)/))
        return "string-2";

      if (stream.match(/\[.+?\]/))
        return "variable-3";

      if (stream.match(/[\$|&|@]\{[A-Za-z0-9_ ]+\}/))
        return "variable";

      if (stream.match(robot_keywords_reg))
        return "keyword";

      if (stream.match("*** Settings ***") ||
        stream.match("*** Variables ***")  ||
        stream.match("*** Test Cases ***") ||
        stream.match("*** Tasks ***") ||           //charis added for RF3.1.2
        stream.match("*** Keywords ***"))
        return "property";

      /*robot framework end*/

      /* comments */
      if (ch == "#" && (stream.pos == 0 || /\s/.test(stream.string.charAt(stream.pos - 1)))) {
        stream.skipToEnd();
        return "comment";
      }

      if (stream.match(/^('([^']|\\.)*'?|"([^"]|\\.)*"?)/))
        return "string";

      if (state.literal && stream.indentation() > state.keyCol) {
        stream.skipToEnd(); return "string";
      } else if (state.literal) { state.literal = false; }
      if (stream.sol()) {
        state.keyCol = 0;
        state.pair = false;
        state.pairStart = false;
        /* document start */
        if(stream.match(/---/)) { return "def"; }
        /* document end */
        if (stream.match(/\.\.\./)) { return "def"; }
        /* array list item */
        if (stream.match(/\s*-\s+/)) { return 'meta'; }
      }
      /* inline pairs/lists */
      if (stream.match(/^(\{|\}|\[|\])/)) {
        if (ch == '{')
          state.inlinePairs++;
        else if (ch == '}')
          state.inlinePairs--;
        else if (ch == '[')
          state.inlineList++;
        else
          state.inlineList--;
        return 'meta';
      }

      /* list seperator */
      if (state.inlineList > 0 && !esc && ch ==',') {
        stream.next();
        return 'meta';
      }
      /* pairs seperator */
      if (state.inlinePairs > 0 && !esc && ch ==',') {
        state.keyCol = 0;
        state.pair = false;
        state.pairStart = false;
        stream.next();
        return 'meta';
      }

      /* start of value of a pair */
      if (state.pairStart) {
        /* block literals */
        if (stream.match(/^\s*(\||\>)\s*/)) { state.literal = true; return 'meta'; };
        /* references */
        if (stream.match(/^\s*(\&|\*)[a-z0-9\._-]+\b/i)) { return 'variable-2'; }
        /* numbers */
        if (state.inlinePairs == 0 && stream.match(/^\s*-?[0-9\.\,]+\s?$/)) { return 'number'; }
        if (state.inlinePairs > 0 && stream.match(/^\s*-?[0-9\.\,]+\s?(?=(,|}))/)) { return 'number'; }
        /* keywords */
        if (stream.match(keywordRegex)) { return 'keyword'; }
      }

      /* pairs (associative arrays) -> key */
      if (!state.pair && stream.match(/^\s*(?:[,\[\]{}&*!|>'"%@`][^\s'":]|[^,\[\]{}#&*!|>'"%@`])[^#]*?(?=\s*:($|\s))/)) {
        state.pair = true;
        state.keyCol = stream.indentation();
        return "atom";
      }
      if (state.pair && stream.match(/^:\s*/)) { state.pairStart = true; return 'meta'; }

      /* nothing found, continue */
      state.pairStart = false;
      state.escaped = (ch == '\\');
      stream.next();
      return null;
    },
    startState: function() {
      return {
        pair: false,
        pairStart: false,
        keyCol: 0,
        inlinePairs: 0,
        inlineList: 0,
        literal: false,
        escaped: false
      };
    },
    lineComment: "#"
  };
});

CodeMirror.defineMIME("text/x-robot", "robot");
CodeMirror.defineMIME("text/robot", "robot");

});
