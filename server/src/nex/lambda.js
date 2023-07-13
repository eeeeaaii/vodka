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

import * as Utils from "../utils.js";

import { ContextType } from "../contexttype.js";
import { NexContainer, V_DIR } from "./nexcontainer.js";
import { ParamParser } from "../paramparser.js";
import { constructClosure } from "./closure.js";
import { eventQueueDispatcher } from "../eventqueuedispatcher.js";
import {
  RENDER_FLAG_SHALLOW,
  RENDER_FLAG_EXPLODED,
} from "../globalconstants.js";
import { Editor } from "../editors.js";
import { experiments } from "../globalappflags.js";
import { heap, HeapString } from "../heap.js";
import { constructFatalError } from "./eerror.js";

/**
 * Nex that represents a written (uncompiled) function.
 */
class Lambda extends NexContainer {
  constructor(val) {
    super();
    this.cachedParamNames = [];
    this.paramsArray = [];
    this.returnValueParam = null;
    this.isEditing = false;
    this.amptext = new HeapString();
    this.setAmpText(val ? val : "");
  }

  getTypeName() {
    return "-lambda-";
  }

  makeCopy(shallow) {
    let r = constructLambda();
    this.copyChildrenTo(r, shallow);
    this.copyFieldsTo(r);
    return r;
  }

  doAlertAnimation() {
    let rn = this.getRenderNodes();
    for (let i = 0; i < rn.length; i++) {
      eventQueueDispatcher.enqueueAlertAnimation(rn[i]);
    }
  }

  hasDocStringInFirstPosition() {
    return (
      this.numChildren() > 0 &&
      (Utils.isDocContainerType(this.getChildAt(0)) ||
        Utils.isEString(this.getChildAt(0)))
    );
  }

  getDocStringValue() {
    let c = this.getChildAt(0);
    if (Utils.isDocContainerType(c)) {
      let r = c.getValueAsString();
      if (typeof r == "string") {
        return r;
      } else {
        return "-invalid doc string-";
      }
    } else {
      //should be an estring
      return c.getFullTypedValue();
    }
  }

  getDocString() {
    if (this.hasDocStringInFirstPosition()) {
      return this.getDocStringValue();
    } else {
      return "-no doc string-";
    }
  }

  copyFieldsTo(r) {
    super.copyFieldsTo(r);
    r.setAmpText(this.amptext.get());
    // The params array is supposed to be immutable.
    // Can't really enforce that because it's javscript but
    // we will treat it as such for efficiency. Therefore
    // we can just copy the reference to it. The reference
    // changes every time the params are re-parsed.
    r.paramsArray = this.paramsArray;
    r.returnValueParam = this.returnValueParam;
    r.needsEval = this.needsEval;
    r.isEditing = this.isEditing;
    r.cachedParamNames = this.cachedParamNames;
  }

  isInfix() {
    // regular lambda always not infix
    return false;
  }

  getCanonicalName() {
    return null;
  }

  renderChildrenIfNormal() {
    return false;
  }

  toString(version) {
    if (version == "v2") {
      return this.toStringV2();
    }
    // dead code
  }

  // overridden because we shouldn't pretty print the doc string, it's going to look
  // like garbage and most of the time we'll be seeing it anyway, since we'll be looking at
  // a closure in the interface.
  prettyPrintChildren(lvl) {
    let i = this.hasDocStringInFirstPosition() ? 1 : 0;
    let r = "";
    for (; i < this.numChildren(); i++) {
      let c = this.getChildAt(i);
      r += c.prettyPrintInternal(lvl, this.dir != V_DIR); // exp
    }
    return r;
  }

  toStringV2() {
    return `&${this.toStringV2Literal()}${this.toStringV2PrivateDataSection()}${this.listStartV2()}${this.toStringV2TagList()}${super.childrenToString(
      "v2"
    )}${this.listEndV2()}`;
  }

  prettyPrintInternal(lvl, hdir) {
    return this.standardListPrettyPrint(lvl, "&", hdir);
  }

  deserializePrivateData(data) {
    this.setAmpText(data);
  }

  serializePrivateData() {
    return this.amptext.get();
  }

  debugString() {
    return `(&${this.amptext.get()} ${super.childrenDebugString()})`;
  }

  getKeyFunnel() {
    return new LambdaKeyFunnel(this);
  }

  getContextType() {
    return ContextType.COMMAND;
  }

  getSymbolForCodespan() {
    return "&#8907;";
  }

  getArgString(name) {
    let r = "";
    if (this.returnValueParam) {
      r += this.returnValueParam.debugName.substr(1);
    }
    r += name;
    r += " ";
    for (let i = 0; i < this.paramsArray.length; i++) {
      let param = this.paramsArray[i];
      if (i > 0) {
        r += " ";
      }
      r += "|" + param.debugName;
    }
    return r;
  }

  renderInto(renderNode, renderFlags, withEditor) {
    let domNode = renderNode.getDomNode();
    let codespan = null;
    if (!(renderFlags & RENDER_FLAG_SHALLOW)) {
      codespan = document.createElement("span");
      codespan.classList.add("codespan");
      domNode.appendChild(codespan);
    }
    super.renderInto(renderNode, renderFlags, withEditor);
    domNode.classList.add("lambda");
    domNode.classList.add("codelist");
    if (!(renderFlags & RENDER_FLAG_SHALLOW)) {
      if (renderFlags & RENDER_FLAG_EXPLODED) {
        codespan.classList.add("exploded");
      } else {
        codespan.classList.remove("exploded");
      }
      if (this.isEditing) {
        codespan.classList.add("editing");
      } else {
        codespan.classList.remove("editing");
      }
      let innerhtml = "";
      let lambdasignleft =
        '<span class="lambdasign glyphleft">' +
        this.getSymbolForCodespan() +
        "</span>";
      let lambdasignright =
        '<span class="lambdasign glyphright">' +
        this.getSymbolForCodespan() +
        "</span>";
      let faintleftdot = '<span class="tilde glyphleft faint">·</span>';
      if (this.isEditing) {
        innerhtml = lambdasignleft + this.amptext.get().replace(/ /g, "&nbsp;");
      } else {
        innerhtml =
          faintleftdot +
          this.amptext.get().replace(/ /g, "&nbsp;") +
          lambdasignright;
      }
      codespan.innerHTML = innerhtml;
    }
  }

  getTagHolder(domNode) {
    return domNode.firstChild;
  }

  needsEvaluation() {
    return true;
  }

  evaluate(env) {
    let r = constructClosure(this, env);
    this.copyTagsTo(r);
    return r;
  }

  cacheParamNames() {
    let trimmed = this.amptext.get().trim();
    let s = trimmed.split(" ");
    let p = [];
    for (let i = 0; i < s.length; i++) {
      if (s[i] != "") {
        p.push(s[i]);
      }
    }
    this.cachedParamNames = p;
    let paramParser = new ParamParser();
    paramParser.parseString(trimmed);
    this.paramsArray = paramParser.getParams();
    this.returnValueParam = paramParser.getReturnValue();
  }

  getParams() {
    return this.paramsArray;
  }

  getReturnValueParam() {
    return this.returnValueParam;
  }

  getParamNames() {
    return this.cachedParamNames;
  }

  // is this dead code?
  // if this is dead code, then so is this.getParamNames
  // and this.cachedParamNames.
  // TODO: put in "throw Error" and run the test suite
  bind(args, closure) {
    let paramNames = this.getParamNames();
    // omfg please fix this fix binding
    if (args.length != paramNames.length) {
      // also thrown in lambdargevaluator but this is called directly by step eval :(
      throw constructFatalError("lambda: not enough args passed to function.");
    }
    for (let i = 0; i < args.length; i++) {
      closure.bind(paramNames[i], args[i]);
    }
  }

  getAmpText() {
    return this.amptext.get();
  }

  isEmpty() {
    return !this.amptext.get();
  }

  deleteLastAmpLetter() {
    this.amptext.removeFromEnd(1);
    this.cacheParamNames();
    this.setDirtyForRendering(true);
  }

  appendAmpText(txt) {
    this.amptext.append(txt);
    this.cacheParamNames();
    this.setDirtyForRendering(true);
  }

  setAmpText(newval) {
    if (newval == this.amptext.get()) return;
    this.amptext.set(newval);
    this.cacheParamNames();
    this.setDirtyForRendering(true);
  }

  doNotProcess(key) {
    if (!/^.$/.test(key)) {
      return true;
    }
    return false;
  }

  getDefaultHandler() {
    return "standardDefault";
  }

  getEventTable(context) {
    return {};
  }

  static makeLambda(argstring, maybeargs) {
    let lambda = constructLambda(argstring);
    // this little snippet lets you do varargs or array
    let args = [];
    if (Array.isArray(maybeargs)) {
      args = maybeargs;
    } else {
      args = Array.prototype.slice.call(arguments).splice(1);
    }
    for (let i = 0; i < args.length; i++) {
      lambda.appendChild(args[i]);
    }
    return lambda;
  }

  memUsed() {
    return super.memUsed() + heap.sizeLambda() + this.amptext.memUsed();
  }
}

class LambdaEditor extends Editor {
  constructor(nex) {
    super(nex, "LambdaEditor");
  }

  getStateForUndo() {
    return this.nex.getAmpText();
  }

  setStateForUndo(val) {
    this.nex.setAmpText(val);
  }

  doBackspaceEdit() {
    this.nex.deleteLastAmpLetter();
  }

  doAppendEdit(text) {
    this.nex.appendAmpText(text);
  }

  hasContent() {
    return this.nex.getAmpText() != "";
  }

  startEditing() {
    super.startEditing();
    this.oldVal = this.nex.getAmpText();
  }

  abort() {
    this.nex.setAmpText(this.oldVal);
  }

  shouldAppend(text) {
    if (/^[a-zA-Z0-9_-]$/.test(text)) return true;
    if (/^[!@#$%^~&*)(]$/.test(text)) return true;
    if (/^[ ]$/.test(text)) return true;
    if (/^[.]$/.test(text)) return true;
    if (/^[?]$/.test(text)) return true;
    if (/^[,]$/.test(text)) return true; // legacy
    if (/^[\[]$/.test(text)) return true;
    if (/^[\]]$/.test(text)) return true;
    return false;
  }

  shouldTerminateAndReroute(text) {
    if (super.shouldTerminateAndReroute()) return true;
    return !this.shouldAppend(text);
  }
}

function constructLambda(val) {
  if (!heap.requestMem(heap.sizeLambda())) {
    throw new EError(`OUT OF MEMORY: cannot allocate Lambda.
stats: ${heap.stats()}`);
  }
  return heap.register(new Lambda(val));
}

export { Lambda, LambdaEditor, constructLambda };
