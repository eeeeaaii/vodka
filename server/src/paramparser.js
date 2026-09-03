/*
This file is part of Vodka.

Vodka is free software: you can redistribute it and/or modify
it under the terms of the GNU General Public License as published by
the Free Software Foundation, either version 3 of the License, or
(at your option) any later version.

Vodka is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with Vodka.  If not, see <https://www.gnu.org/licenses/>.
*/

// add validation here?

/*

ways you can do args:
1. A A A V
a set of required args then a variadic (could be zero A's)
1. A A A O O
a set of required args then some optional ones (could be zero A's)

variadics are packaged up inside a list of some type (maybe a word)
*/

import { BUILTIN_ARG_PREFIX } from "./environment.js";
import { lexParam, typeUnionOf } from "./paramlexer.js";
import { experiments } from "./globalappflags.js";

class ParamParser {
  constructor(isBuiltin) {
    this.isBuiltin = isBuiltin;
    this.parsedParams = null;
    this.returnValue = null;
  }

  getParams() {
    return this.parsedParams;
  }

  getReturnValue() {
    return this.returnValue;
  }

  parseString(str) {
    let hasReturnVal = /^[~!@#$%^&*?(),.\u03ba\u03bc]+/.test(str);
    let a = str.split(" ");
    if (hasReturnVal) {
      a[0] = "\\" + a[0];
    }
    // in case someone double spaces I guess
    let b = [];
    let j = 0;
    for (let i = 0; i < a.length; i++) {
      if (a[i] != "") {
        b[j++] = a[i];
      }
    }
    this.parse(b);
  }

  parse(paramList) {
    this.parsedParams = [];
    for (let i = 0; i < paramList.length; i++) {
      let p = paramList[i];
      if (p.indexOf("\\") >= 0) {
        this.returnValue = this.parseParam(p);
      } else {
        this.parsedParams.push(this.parseParam(p));
      }
    }
  }

  /*
  The spec is lexed rather than picked apart by hand. A builtin's spec is a
  constant written here in the source, so one that does not lex is a mistake to
  be shouted about at startup; a lambda's is being typed by someone and is
  half-finished most of the time, so that one just says no for now.
  */
  parseParam(s) {
    let lexed = lexParam(s);
    if (lexed.error) {
      if (this.isBuiltin) {
        throw new Error("bad builtin argument spec: " + lexed.error);
      }
      return null;
    }
    let name = lexed.isReturnValue ? "\\" : lexed.name;
    if (this.isBuiltin) {
      name = BUILTIN_ARG_PREFIX + name;
    }
    return {
      name: name,
      debugName: s,
      typeString: lexed.typeString,
      type: typeUnionOf(lexed.types),
      skipeval: lexed.skipeval,
      skipactivate: lexed.skipactivate,
      variadic: lexed.variadic,
      optional: lexed.optional,
      convert: lexed.convert,
    };
  }

  //   getTypeCode(s) {
  // 	let groups = s.match(/([a-zA-Z0-9_-]*[a-zA-Z0-9-])(.*)/);
  // 	let

  // 	s.match(/[a-zA-Z0-9_-]*[a-zA-Z0-9-].*/)
  //     let end = s.charAt(s.length - 1);
  //     let other = s.charAt(s.length - 2);
  //     if (other == "(" || other == "%" || other == "#") {
  //       return other + end;
  //     } else {
  //       return end;
  //     }
  //   }

}

export { ParamParser };
