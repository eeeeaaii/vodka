// modules are defined as an array
// [ module function, map of requires ]
//
// map of requires is short require name -> numeric require
//
// anything defined in a previous bundle is accessed via the
// orig method which is the require for previous bundles

(function (modules, entry, mainEntry, parcelRequireName, globalName) {
  /* eslint-disable no-undef */
  var globalObject =
    typeof globalThis !== 'undefined'
      ? globalThis
      : typeof self !== 'undefined'
      ? self
      : typeof window !== 'undefined'
      ? window
      : typeof global !== 'undefined'
      ? global
      : {};
  /* eslint-enable no-undef */

  // Save the require from previous bundle to this closure if any
  var previousRequire =
    typeof globalObject[parcelRequireName] === 'function' &&
    globalObject[parcelRequireName];

  var cache = previousRequire.cache || {};
  // Do not use `require` to prevent Webpack from trying to bundle this call
  var nodeRequire =
    typeof module !== 'undefined' &&
    typeof module.require === 'function' &&
    module.require.bind(module);

  function newRequire(name, jumped) {
    if (!cache[name]) {
      if (!modules[name]) {
        // if we cannot find the module within our internal map or
        // cache jump to the current global require ie. the last bundle
        // that was added to the page.
        var currentRequire =
          typeof globalObject[parcelRequireName] === 'function' &&
          globalObject[parcelRequireName];
        if (!jumped && currentRequire) {
          return currentRequire(name, true);
        }

        // If there are other bundles on this page the require from the
        // previous one is saved to 'previousRequire'. Repeat this as
        // many times as there are bundles until the module is found or
        // we exhaust the require chain.
        if (previousRequire) {
          return previousRequire(name, true);
        }

        // Try the node require function if it exists.
        if (nodeRequire && typeof name === 'string') {
          return nodeRequire(name);
        }

        var err = new Error("Cannot find module '" + name + "'");
        err.code = 'MODULE_NOT_FOUND';
        throw err;
      }

      localRequire.resolve = resolve;
      localRequire.cache = {};

      var module = (cache[name] = new newRequire.Module(name));

      modules[name][0].call(
        module.exports,
        localRequire,
        module,
        module.exports,
        this
      );
    }

    return cache[name].exports;

    function localRequire(x) {
      var res = localRequire.resolve(x);
      return res === false ? {} : newRequire(res);
    }

    function resolve(x) {
      var id = modules[name][1][x];
      return id != null ? id : x;
    }
  }

  function Module(moduleName) {
    this.id = moduleName;
    this.bundle = newRequire;
    this.exports = {};
  }

  newRequire.isParcelRequire = true;
  newRequire.Module = Module;
  newRequire.modules = modules;
  newRequire.cache = cache;
  newRequire.parent = previousRequire;
  newRequire.register = function (id, exports) {
    modules[id] = [
      function (require, module) {
        module.exports = exports;
      },
      {},
    ];
  };

  Object.defineProperty(newRequire, 'root', {
    get: function () {
      return globalObject[parcelRequireName];
    },
  });

  globalObject[parcelRequireName] = newRequire;

  for (var i = 0; i < entry.length; i++) {
    newRequire(entry[i]);
  }

  if (mainEntry) {
    // Expose entry point to Node, AMD or browser globals
    // Based on https://github.com/ForbesLindesay/umd/blob/master/template.js
    var mainExports = newRequire(mainEntry);

    // CommonJS
    if (typeof exports === 'object' && typeof module !== 'undefined') {
      module.exports = mainExports;

      // RequireJS
    } else if (typeof define === 'function' && define.amd) {
      define(function () {
        return mainExports;
      });

      // <script>
    } else if (globalName) {
      this[globalName] = mainExports;
    }
  }
})({"lOQ3D":[function(require,module,exports) {
var global = arguments[3];
var HMR_HOST = null;
var HMR_PORT = null;
var HMR_SECURE = false;
var HMR_ENV_HASH = "d6ea1d42532a7575";
var HMR_USE_SSE = false;
module.bundle.HMR_BUNDLE_ID = "f03ab1989876d776";
"use strict";
/* global HMR_HOST, HMR_PORT, HMR_ENV_HASH, HMR_SECURE, HMR_USE_SSE, chrome, browser, __parcel__import__, __parcel__importScripts__, ServiceWorkerGlobalScope */ /*::
import type {
  HMRAsset,
  HMRMessage,
} from '@parcel/reporter-dev-server/src/HMRServer.js';
interface ParcelRequire {
  (string): mixed;
  cache: {|[string]: ParcelModule|};
  hotData: {|[string]: mixed|};
  Module: any;
  parent: ?ParcelRequire;
  isParcelRequire: true;
  modules: {|[string]: [Function, {|[string]: string|}]|};
  HMR_BUNDLE_ID: string;
  root: ParcelRequire;
}
interface ParcelModule {
  hot: {|
    data: mixed,
    accept(cb: (Function) => void): void,
    dispose(cb: (mixed) => void): void,
    // accept(deps: Array<string> | string, cb: (Function) => void): void,
    // decline(): void,
    _acceptCallbacks: Array<(Function) => void>,
    _disposeCallbacks: Array<(mixed) => void>,
  |};
}
interface ExtensionContext {
  runtime: {|
    reload(): void,
    getURL(url: string): string;
    getManifest(): {manifest_version: number, ...};
  |};
}
declare var module: {bundle: ParcelRequire, ...};
declare var HMR_HOST: string;
declare var HMR_PORT: string;
declare var HMR_ENV_HASH: string;
declare var HMR_SECURE: boolean;
declare var HMR_USE_SSE: boolean;
declare var chrome: ExtensionContext;
declare var browser: ExtensionContext;
declare var __parcel__import__: (string) => Promise<void>;
declare var __parcel__importScripts__: (string) => Promise<void>;
declare var globalThis: typeof self;
declare var ServiceWorkerGlobalScope: Object;
*/ var OVERLAY_ID = "__parcel__error__overlay__";
var OldModule = module.bundle.Module;
function Module(moduleName) {
    OldModule.call(this, moduleName);
    this.hot = {
        data: module.bundle.hotData[moduleName],
        _acceptCallbacks: [],
        _disposeCallbacks: [],
        accept: function(fn) {
            this._acceptCallbacks.push(fn || function() {});
        },
        dispose: function(fn) {
            this._disposeCallbacks.push(fn);
        }
    };
    module.bundle.hotData[moduleName] = undefined;
}
module.bundle.Module = Module;
module.bundle.hotData = {};
var checkedAssets /*: {|[string]: boolean|} */ , assetsToDispose /*: Array<[ParcelRequire, string]> */ , assetsToAccept /*: Array<[ParcelRequire, string]> */ ;
function getHostname() {
    return HMR_HOST || (location.protocol.indexOf("http") === 0 ? location.hostname : "localhost");
}
function getPort() {
    return HMR_PORT || location.port;
}
// eslint-disable-next-line no-redeclare
var parent = module.bundle.parent;
if ((!parent || !parent.isParcelRequire) && typeof WebSocket !== "undefined") {
    var hostname = getHostname();
    var port = getPort();
    var protocol = HMR_SECURE || location.protocol == "https:" && ![
        "localhost",
        "127.0.0.1",
        "0.0.0.0"
    ].includes(hostname) ? "wss" : "ws";
    var ws;
    if (HMR_USE_SSE) ws = new EventSource("/__parcel_hmr");
    else try {
        ws = new WebSocket(protocol + "://" + hostname + (port ? ":" + port : "") + "/");
    } catch (err) {
        if (err.message) console.error(err.message);
        ws = {};
    }
    // Web extension context
    var extCtx = typeof browser === "undefined" ? typeof chrome === "undefined" ? null : chrome : browser;
    // Safari doesn't support sourceURL in error stacks.
    // eval may also be disabled via CSP, so do a quick check.
    var supportsSourceURL = false;
    try {
        (0, eval)('throw new Error("test"); //# sourceURL=test.js');
    } catch (err) {
        supportsSourceURL = err.stack.includes("test.js");
    }
    // $FlowFixMe
    ws.onmessage = async function(event /*: {data: string, ...} */ ) {
        checkedAssets = {} /*: {|[string]: boolean|} */ ;
        assetsToAccept = [];
        assetsToDispose = [];
        var data /*: HMRMessage */  = JSON.parse(event.data);
        if (data.type === "update") {
            // Remove error overlay if there is one
            if (typeof document !== "undefined") removeErrorOverlay();
            let assets = data.assets.filter((asset)=>asset.envHash === HMR_ENV_HASH);
            // Handle HMR Update
            let handled = assets.every((asset)=>{
                return asset.type === "css" || asset.type === "js" && hmrAcceptCheck(module.bundle.root, asset.id, asset.depsByBundle);
            });
            if (handled) {
                console.clear();
                // Dispatch custom event so other runtimes (e.g React Refresh) are aware.
                if (typeof window !== "undefined" && typeof CustomEvent !== "undefined") window.dispatchEvent(new CustomEvent("parcelhmraccept"));
                await hmrApplyUpdates(assets);
                // Dispose all old assets.
                let processedAssets = {} /*: {|[string]: boolean|} */ ;
                for(let i = 0; i < assetsToDispose.length; i++){
                    let id = assetsToDispose[i][1];
                    if (!processedAssets[id]) {
                        hmrDispose(assetsToDispose[i][0], id);
                        processedAssets[id] = true;
                    }
                }
                // Run accept callbacks. This will also re-execute other disposed assets in topological order.
                processedAssets = {};
                for(let i = 0; i < assetsToAccept.length; i++){
                    let id = assetsToAccept[i][1];
                    if (!processedAssets[id]) {
                        hmrAccept(assetsToAccept[i][0], id);
                        processedAssets[id] = true;
                    }
                }
            } else fullReload();
        }
        if (data.type === "error") {
            // Log parcel errors to console
            for (let ansiDiagnostic of data.diagnostics.ansi){
                let stack = ansiDiagnostic.codeframe ? ansiDiagnostic.codeframe : ansiDiagnostic.stack;
                console.error("\uD83D\uDEA8 [parcel]: " + ansiDiagnostic.message + "\n" + stack + "\n\n" + ansiDiagnostic.hints.join("\n"));
            }
            if (typeof document !== "undefined") {
                // Render the fancy html overlay
                removeErrorOverlay();
                var overlay = createErrorOverlay(data.diagnostics.html);
                // $FlowFixMe
                document.body.appendChild(overlay);
            }
        }
    };
    if (ws instanceof WebSocket) {
        ws.onerror = function(e) {
            if (e.message) console.error(e.message);
        };
        ws.onclose = function() {
            console.warn("[parcel] \uD83D\uDEA8 Connection to the HMR server was lost");
        };
    }
}
function removeErrorOverlay() {
    var overlay = document.getElementById(OVERLAY_ID);
    if (overlay) {
        overlay.remove();
        console.log("[parcel] \u2728 Error resolved");
    }
}
function createErrorOverlay(diagnostics) {
    var overlay = document.createElement("div");
    overlay.id = OVERLAY_ID;
    let errorHTML = '<div style="background: black; opacity: 0.85; font-size: 16px; color: white; position: fixed; height: 100%; width: 100%; top: 0px; left: 0px; padding: 30px; font-family: Menlo, Consolas, monospace; z-index: 9999;">';
    for (let diagnostic of diagnostics){
        let stack = diagnostic.frames.length ? diagnostic.frames.reduce((p, frame)=>{
            return `${p}
<a href="/__parcel_launch_editor?file=${encodeURIComponent(frame.location)}" style="text-decoration: underline; color: #888" onclick="fetch(this.href); return false">${frame.location}</a>
${frame.code}`;
        }, "") : diagnostic.stack;
        errorHTML += `
      <div>
        <div style="font-size: 18px; font-weight: bold; margin-top: 20px;">
          \u{1F6A8} ${diagnostic.message}
        </div>
        <pre>${stack}</pre>
        <div>
          ${diagnostic.hints.map((hint)=>"<div>\uD83D\uDCA1 " + hint + "</div>").join("")}
        </div>
        ${diagnostic.documentation ? `<div>\u{1F4DD} <a style="color: violet" href="${diagnostic.documentation}" target="_blank">Learn more</a></div>` : ""}
      </div>
    `;
    }
    errorHTML += "</div>";
    overlay.innerHTML = errorHTML;
    return overlay;
}
function fullReload() {
    if ("reload" in location) location.reload();
    else if (extCtx && extCtx.runtime && extCtx.runtime.reload) extCtx.runtime.reload();
}
function getParents(bundle, id) /*: Array<[ParcelRequire, string]> */ {
    var modules = bundle.modules;
    if (!modules) return [];
    var parents = [];
    var k, d, dep;
    for(k in modules)for(d in modules[k][1]){
        dep = modules[k][1][d];
        if (dep === id || Array.isArray(dep) && dep[dep.length - 1] === id) parents.push([
            bundle,
            k
        ]);
    }
    if (bundle.parent) parents = parents.concat(getParents(bundle.parent, id));
    return parents;
}
function updateLink(link) {
    var href = link.getAttribute("href");
    if (!href) return;
    var newLink = link.cloneNode();
    newLink.onload = function() {
        if (link.parentNode !== null) // $FlowFixMe
        link.parentNode.removeChild(link);
    };
    newLink.setAttribute("href", // $FlowFixMe
    href.split("?")[0] + "?" + Date.now());
    // $FlowFixMe
    link.parentNode.insertBefore(newLink, link.nextSibling);
}
var cssTimeout = null;
function reloadCSS() {
    if (cssTimeout) return;
    cssTimeout = setTimeout(function() {
        var links = document.querySelectorAll('link[rel="stylesheet"]');
        for(var i = 0; i < links.length; i++){
            // $FlowFixMe[incompatible-type]
            var href /*: string */  = links[i].getAttribute("href");
            var hostname = getHostname();
            var servedFromHMRServer = hostname === "localhost" ? new RegExp("^(https?:\\/\\/(0.0.0.0|127.0.0.1)|localhost):" + getPort()).test(href) : href.indexOf(hostname + ":" + getPort());
            var absolute = /^https?:\/\//i.test(href) && href.indexOf(location.origin) !== 0 && !servedFromHMRServer;
            if (!absolute) updateLink(links[i]);
        }
        cssTimeout = null;
    }, 50);
}
function hmrDownload(asset) {
    if (asset.type === "js") {
        if (typeof document !== "undefined") {
            let script = document.createElement("script");
            script.src = asset.url + "?t=" + Date.now();
            if (asset.outputFormat === "esmodule") script.type = "module";
            return new Promise((resolve, reject)=>{
                var _document$head;
                script.onload = ()=>resolve(script);
                script.onerror = reject;
                (_document$head = document.head) === null || _document$head === void 0 || _document$head.appendChild(script);
            });
        } else if (typeof importScripts === "function") {
            // Worker scripts
            if (asset.outputFormat === "esmodule") return import(asset.url + "?t=" + Date.now());
            else return new Promise((resolve, reject)=>{
                try {
                    importScripts(asset.url + "?t=" + Date.now());
                    resolve();
                } catch (err) {
                    reject(err);
                }
            });
        }
    }
}
async function hmrApplyUpdates(assets) {
    global.parcelHotUpdate = Object.create(null);
    let scriptsToRemove;
    try {
        // If sourceURL comments aren't supported in eval, we need to load
        // the update from the dev server over HTTP so that stack traces
        // are correct in errors/logs. This is much slower than eval, so
        // we only do it if needed (currently just Safari).
        // https://bugs.webkit.org/show_bug.cgi?id=137297
        // This path is also taken if a CSP disallows eval.
        if (!supportsSourceURL) {
            let promises = assets.map((asset)=>{
                var _hmrDownload;
                return (_hmrDownload = hmrDownload(asset)) === null || _hmrDownload === void 0 ? void 0 : _hmrDownload.catch((err)=>{
                    // Web extension fix
                    if (extCtx && extCtx.runtime && extCtx.runtime.getManifest().manifest_version == 3 && typeof ServiceWorkerGlobalScope != "undefined" && global instanceof ServiceWorkerGlobalScope) {
                        extCtx.runtime.reload();
                        return;
                    }
                    throw err;
                });
            });
            scriptsToRemove = await Promise.all(promises);
        }
        assets.forEach(function(asset) {
            hmrApply(module.bundle.root, asset);
        });
    } finally{
        delete global.parcelHotUpdate;
        if (scriptsToRemove) scriptsToRemove.forEach((script)=>{
            if (script) {
                var _document$head2;
                (_document$head2 = document.head) === null || _document$head2 === void 0 || _document$head2.removeChild(script);
            }
        });
    }
}
function hmrApply(bundle /*: ParcelRequire */ , asset /*:  HMRAsset */ ) {
    var modules = bundle.modules;
    if (!modules) return;
    if (asset.type === "css") reloadCSS();
    else if (asset.type === "js") {
        let deps = asset.depsByBundle[bundle.HMR_BUNDLE_ID];
        if (deps) {
            if (modules[asset.id]) {
                // Remove dependencies that are removed and will become orphaned.
                // This is necessary so that if the asset is added back again, the cache is gone, and we prevent a full page reload.
                let oldDeps = modules[asset.id][1];
                for(let dep in oldDeps)if (!deps[dep] || deps[dep] !== oldDeps[dep]) {
                    let id = oldDeps[dep];
                    let parents = getParents(module.bundle.root, id);
                    if (parents.length === 1) hmrDelete(module.bundle.root, id);
                }
            }
            if (supportsSourceURL) // Global eval. We would use `new Function` here but browser
            // support for source maps is better with eval.
            (0, eval)(asset.output);
            // $FlowFixMe
            let fn = global.parcelHotUpdate[asset.id];
            modules[asset.id] = [
                fn,
                deps
            ];
        } else if (bundle.parent) hmrApply(bundle.parent, asset);
    }
}
function hmrDelete(bundle, id) {
    let modules = bundle.modules;
    if (!modules) return;
    if (modules[id]) {
        // Collect dependencies that will become orphaned when this module is deleted.
        let deps = modules[id][1];
        let orphans = [];
        for(let dep in deps){
            let parents = getParents(module.bundle.root, deps[dep]);
            if (parents.length === 1) orphans.push(deps[dep]);
        }
        // Delete the module. This must be done before deleting dependencies in case of circular dependencies.
        delete modules[id];
        delete bundle.cache[id];
        // Now delete the orphans.
        orphans.forEach((id)=>{
            hmrDelete(module.bundle.root, id);
        });
    } else if (bundle.parent) hmrDelete(bundle.parent, id);
}
function hmrAcceptCheck(bundle /*: ParcelRequire */ , id /*: string */ , depsByBundle /*: ?{ [string]: { [string]: string } }*/ ) {
    if (hmrAcceptCheckOne(bundle, id, depsByBundle)) return true;
    // Traverse parents breadth first. All possible ancestries must accept the HMR update, or we'll reload.
    let parents = getParents(module.bundle.root, id);
    let accepted = false;
    while(parents.length > 0){
        let v = parents.shift();
        let a = hmrAcceptCheckOne(v[0], v[1], null);
        if (a) // If this parent accepts, stop traversing upward, but still consider siblings.
        accepted = true;
        else {
            // Otherwise, queue the parents in the next level upward.
            let p = getParents(module.bundle.root, v[1]);
            if (p.length === 0) {
                // If there are no parents, then we've reached an entry without accepting. Reload.
                accepted = false;
                break;
            }
            parents.push(...p);
        }
    }
    return accepted;
}
function hmrAcceptCheckOne(bundle /*: ParcelRequire */ , id /*: string */ , depsByBundle /*: ?{ [string]: { [string]: string } }*/ ) {
    var modules = bundle.modules;
    if (!modules) return;
    if (depsByBundle && !depsByBundle[bundle.HMR_BUNDLE_ID]) {
        // If we reached the root bundle without finding where the asset should go,
        // there's nothing to do. Mark as "accepted" so we don't reload the page.
        if (!bundle.parent) return true;
        return hmrAcceptCheck(bundle.parent, id, depsByBundle);
    }
    if (checkedAssets[id]) return true;
    checkedAssets[id] = true;
    var cached = bundle.cache[id];
    assetsToDispose.push([
        bundle,
        id
    ]);
    if (!cached || cached.hot && cached.hot._acceptCallbacks.length) {
        assetsToAccept.push([
            bundle,
            id
        ]);
        return true;
    }
}
function hmrDispose(bundle /*: ParcelRequire */ , id /*: string */ ) {
    var cached = bundle.cache[id];
    bundle.hotData[id] = {};
    if (cached && cached.hot) cached.hot.data = bundle.hotData[id];
    if (cached && cached.hot && cached.hot._disposeCallbacks.length) cached.hot._disposeCallbacks.forEach(function(cb) {
        cb(bundle.hotData[id]);
    });
    delete bundle.cache[id];
}
function hmrAccept(bundle /*: ParcelRequire */ , id /*: string */ ) {
    // Execute the module.
    bundle(id);
    // Run the accept callbacks in the new version of the module.
    var cached = bundle.cache[id];
    if (cached && cached.hot && cached.hot._acceptCallbacks.length) cached.hot._acceptCallbacks.forEach(function(cb) {
        var assetsToAlsoAccept = cb(function() {
            return getParents(module.bundle.root, id);
        });
        if (assetsToAlsoAccept && assetsToAccept.length) {
            assetsToAlsoAccept.forEach(function(a) {
                hmrDispose(a[0], a[1]);
            });
            // $FlowFixMe[method-unbinding]
            assetsToAccept.push.apply(assetsToAccept, assetsToAlsoAccept);
        }
    });
}

},{}],"lEk1q":[function(require,module,exports) {
var _vodkaJs = require("./vodka.js");
(0, _vodkaJs.setup)();

},{"./vodka.js":"3FCY4"}],"3FCY4":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "setup", ()=>setup);
parcelHelpers.export(exports, "dumpPerf", ()=>dumpPerf);
parcelHelpers.export(exports, "startPerf", ()=>startPerf);
parcelHelpers.export(exports, "topLevelRender", ()=>topLevelRender);
parcelHelpers.export(exports, "nodeLevelRender", ()=>nodeLevelRender);
parcelHelpers.export(exports, "doRealKeyInput", ()=>doRealKeyInput);
parcelHelpers.export(exports, "doKeyInput", ()=>doKeyInput);
parcelHelpers.export(exports, "renderOnlyDirty", ()=>renderOnlyDirty);
parcelHelpers.export(exports, "replSetup", ()=>replSetup);
var _utilsJs = require("./utils.js");
var _globalappflagsJs = require("./globalappflags.js");
var _perfmonJs = require("./perfmon.js");
var _eventqueueJs = require("./eventqueue.js");
var _eventqueuedispatcherJs = require("./eventqueuedispatcher.js");
var _keydispatcherJs = require("./keydispatcher.js");
var _systemstateJs = require("./systemstate.js");
var _asyncbuiltinsJs = require("./builtins/asyncbuiltins.js");
var _surfacebuiltinsJs = require("./builtins/surfacebuiltins.js");
var _basicbuiltinsJs = require("./builtins/basicbuiltins.js");
var _contractbuiltinsJs = require("./builtins/contractbuiltins.js");
var _environmentbuiltinsJs = require("./builtins/environmentbuiltins.js");
var _filebuiltinsJs = require("./builtins/filebuiltins.js");
var _iterationbuiltinsJs = require("./builtins/iterationbuiltins.js");
var _logicbuiltinsJs = require("./builtins/logicbuiltins.js");
var _makebuiltinsJs = require("./builtins/makebuiltins.js");
var _mathbuiltinsJs = require("./builtins/mathbuiltins.js");
var _stringbuiltinsJs = require("./builtins/stringbuiltins.js");
var _syscallsJs = require("./builtins/syscalls.js");
var _tagbuiltinsJs = require("./builtins/tagbuiltins.js");
var _testbuiltinsJs = require("./builtins/testbuiltins.js");
var _typeconversionsJs = require("./builtins/typeconversions.js");
var _wavetablebuiltinsJs = require("./builtins/wavetablebuiltins.js");
var _midibuiltinsJs = require("./builtins/midibuiltins.js");
var _servercommunicationJs = require("./servercommunication.js");
var _rendernodeJs = require("./rendernode.js");
var _rootJs = require("./nex/root.js");
var _commandJs = require("./nex/command.js");
var _deferredcommandJs = require("./nex/deferredcommand.js");
var _estringJs = require("./nex/estring.js");
var _nexJs = require("./nex/nex.js");
var _unittestsJs = require("./tests/unittests.js");
var _testrecorderJs = require("./testrecorder.js");
var _globalconstantsJs = require("./globalconstants.js");
var _evaluatorJs = require("./evaluator.js");
var _environmentJs = require("./environment.js");
var _rootmanagerJs = require("./rootmanager.js");
var _documentationJs = require("./documentation.js");
var _webaudioJs = require("./webaudio.js");
var _mobileJs = require("./mobile.js");
var _helpJs = require("./help.js");
var _featurevectorJs = require("./featurevector.js");
// EXPERIMENTS
// all these should go into SystemState
// possibly some of them would be moved into Render-specific
// SystemState objects (for example, screen rendering vs. audio rendering)
let root = null;
// used by emscripten
var Module = {};
function dumpPerf() {
    (0, _perfmonJs.perfmon).dump();
}
function startPerf() {
    (0, _perfmonJs.perfmon).activate();
}
function doRealKeyInput(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt) {
    let r = (0, _keydispatcherJs.keyDispatcher).dispatch(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt);
    // if it returns false, it means we handled the keystroke and we are
    // canceling the browser event - this also means something 'happened' so we render.
    if (!r) (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueRenderOnlyDirty();
    return r;
}
// omgg
function doKeyInputNotForTests(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt) {
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueDoKeyInput(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt);
    // will return true if we want the browser event to propagate
    return (0, _keydispatcherJs.keyDispatcher).shouldBubble(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt);
}
var testEventQueue = [];
// the tests that use this legacy method are updated to use the new way,
// but this is still used in two places in testharness.js
function doKeyInput(keycode, whichkey, hasShift, hasCtrl, hasMeta) {
    //if you have to debug an old test you can alert the keycode
    // and run with -s
    //alert(keycode);
    // in order to make this simulate user activity better I'd need
    // to go modify all the tests so they don't call this method
    // synchronously. Instead I will force a full-screen render
    // in between key events -- there are certain things that
    // require render node caching to happen in between user
    // events (which usually happens because people can't
    // type keys fast enough to beat the js scheduler)
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueDoKeyInput(keycode, whichkey, hasShift, hasCtrl, hasMeta, false);
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueImportantTopLevelRender();
    return false; // we no longer know if we can honor the browser event?
}
function createBuiltins() {
    // in the order we want them in the docs
    (0, _documentationJs.setAPIDocCategory)("Basic Builtins");
    (0, _basicbuiltinsJs.createBasicBuiltins)();
    (0, _documentationJs.setAPIDocCategory)("Environment Builtins");
    (0, _environmentbuiltinsJs.createEnvironmentBuiltins)();
    (0, _documentationJs.setAPIDocCategory)("Iteration Builtins");
    (0, _iterationbuiltinsJs.createIterationBuiltins)();
    (0, _documentationJs.setAPIDocCategory)("Logic Builtins");
    (0, _logicbuiltinsJs.createLogicBuiltins)();
    (0, _documentationJs.setAPIDocCategory)("Math Builtins");
    (0, _mathbuiltinsJs.createMathBuiltins)();
    (0, _documentationJs.setAPIDocCategory)("Syscalls");
    (0, _syscallsJs.createSyscalls)();
    (0, _documentationJs.setAPIDocCategory)("Tag Builtins");
    (0, _tagbuiltinsJs.createTagBuiltins)();
    (0, _documentationJs.setAPIDocCategory)("Contract Builtins");
    (0, _contractbuiltinsJs.createContractBuiltins)();
    (0, _documentationJs.setAPIDocCategory)("Async Builtins");
    (0, _asyncbuiltinsJs.createAsyncBuiltins)();
    (0, _documentationJs.setAPIDocCategory)("File Builtins");
    (0, _filebuiltinsJs.createFileBuiltins)();
    (0, _documentationJs.setAPIDocCategory)("String Builtins");
    (0, _stringbuiltinsJs.createStringBuiltins)();
    (0, _documentationJs.setAPIDocCategory)("Wavetable Builtins");
    (0, _wavetablebuiltinsJs.createWavetableBuiltins)();
    (0, _documentationJs.setAPIDocCategory)("Midi Builtins");
    (0, _midibuiltinsJs.createMidiBuiltins)();
    (0, _documentationJs.setAPIDocCategory)("Surface Builtins");
    (0, _surfacebuiltinsJs.createSurfaceBuiltins)();
    (0, _documentationJs.setAPIDocCategory)("Make Builtins");
    (0, _makebuiltinsJs.createMakeBuiltins)();
    (0, _documentationJs.setAPIDocCategory)("Type Conversion Builtins");
    (0, _typeconversionsJs.createTypeConversionBuiltins)();
    (0, _documentationJs.setAPIDocCategory)("Test Builtins");
    (0, _testbuiltinsJs.createTestBuiltins)();
}
function nodeLevelRender(node) {
    (0, _systemstateJs.systemState).setGlobalRenderPassNumber((0, _systemstateJs.systemState).getGlobalRenderPassNumber() + 1);
    let flags = (0, _systemstateJs.systemState).getGlobalCurrentDefaultRenderFlags();
    node.render(flags);
}
function topLevelRender() {
    (0, _systemstateJs.systemState).setGlobalRenderPassNumber((0, _systemstateJs.systemState).getGlobalRenderPassNumber() + 1);
    let flags = (0, _systemstateJs.systemState).getGlobalCurrentDefaultRenderFlags();
    (0, _systemstateJs.systemState).getRoot().setRenderDepth(0);
    (0, _systemstateJs.systemState).getRoot().render(flags);
}
function renderOnlyDirty() {
    (0, _systemstateJs.systemState).setGlobalRenderPassNumber((0, _systemstateJs.systemState).getGlobalRenderPassNumber() + 1);
    let flags = (0, _systemstateJs.systemState).getGlobalCurrentDefaultRenderFlags();
    (0, _systemstateJs.systemState).getRoot().setRenderDepth(0);
    (0, _systemstateJs.systemState).getRoot().render(flags | (0, _globalconstantsJs.RENDER_FLAG_RENDER_IF_DIRTY));
    (0, _systemstateJs.systemState).getRoot().setAllNotDirty();
}
function setDocRootFromFile(filename) {
    let cmd = (0, _deferredcommandJs.DeferredCommand).makeDeferredCommandWithArgs("eval", (0, _systemstateJs.systemState).getSCF().makeCommandWithArgs("load", (0, _estringJs.constructEString)(filename)));
    let exp = (0, _evaluatorJs.evaluateNexSafely)(cmd, (0, _environmentJs.BINDINGS));
    let expNode = root.appendChild(exp);
    expNode.setSelected(true);
    (0, _systemstateJs.systemState).setGlobalCurrentDefaultRenderFlags(0);
}
function setDocRootFromStart() {
    (0, _servercommunicationJs.loadAndRun)("start-doc", function(result) {
        let expNode = root.appendChild(result);
        expNode.setSelected(false);
        root.setRenderMode((0, _globalconstantsJs.RENDER_MODE_NORM));
        (0, _systemstateJs.systemState).setGlobalCurrentDefaultRenderFlags(0);
    });
}
function setEmptyDocRoot() {
    root.setRenderMode((0, _globalconstantsJs.RENDER_MODE_EXPLO));
    root.setSelected(false);
}
function setOrCreateSessionId() {
    let params = new URLSearchParams(window.location.search);
    let sessionId = null;
    if (params.has("sessionId")) {
        sessionId = params.get("sessionId");
        _utilsJs.setCookie("sessionId", sessionId);
    } else sessionId = _utilsJs.getCookie("sessionId");
    (0, _systemstateJs.systemState).setSessionId(sessionId);
}
function getFilenameFromQueryString() {
    let params = new URLSearchParams(window.location.search);
    if (params.has("runfile")) return params.get("runfile");
    return null;
}
function replSetup() {
    (0, _eventqueueJs.eventQueue).initialize();
    createBuiltins();
    // because of https://github.com/eeeeaaii/vodka/issues/29
    if ((0, _nexJs.NEXT_NEX_ID) > 1000) throw new Error("too many builtins, increase starting nex ID");
    (0, _nexJs.setNextNexId)(1000);
}
function macSubst() {
    if (!_utilsJs.isMac()) {
        let opts = document.getElementsByClassName("optionkey");
        for(let i = 0; i < opts.length; i++)opts[i].textContent = "ctrl";
        let metas = document.getElementsByClassName("metakey");
        for(let i = 0; i < metas.length; i++)metas[i].textContent = "ctrl";
    }
}
function doKeydownEvent(e) {
    (0, _testrecorderJs.possiblyRecordAction)(e, "down");
    if ((0, _systemstateJs.systemState).isKeyFunnelActive()) return doKeyInputNotForTests(e.key, e.code, e.shiftKey, e.ctrlKey, e.metaKey, e.altKey);
    else return true;
}
// app main entry point
function setup() {
    (0, _globalappflagsJs.setAppFlags)();
    // do session id before doing help
    setOrCreateSessionId();
    macSubst();
    // this replaced by react
    //	setupHelp();
    (0, _eventqueueJs.eventQueue).initialize();
    if (_utilsJs.getQSVal("mobile")) (0, _mobileJs.setupMobile)();
    (0, _keydispatcherJs.keyDispatcher).setUiCallbackObject({
        "setExplodedState": function(exploded) {
            document.getElementById("mobile_esc").innerText = exploded ? "explode" : "contract";
        }
    });
    // testharness.js needs this
    window.doKeyInput = doKeyInput;
    window.runTest = (0, _unittestsJs.runTest);
    createBuiltins();
    // this also replaced by react
    //	writeDocs();
    // because of https://github.com/eeeeaaii/vodka/issues/29
    if ((0, _nexJs.NEXT_NEX_ID) > 1000) throw new Error("too many builtins, increase starting nex ID");
    (0, _nexJs.setNextNexId)(1000);
    // this code for attaching a render node to a root will expand
    // when there are different render node types.
    // note this is duplicated in undo.js
    root = (0, _rootmanagerJs.rootManager).createNewRoot();
    if (_utilsJs.getQSVal("createtest")) {
        (0, _testrecorderJs.startRecordingTest)();
        document.title = "- recording test -";
    }
    document.onclick = function(e) {
        (0, _testrecorderJs.possiblyRecordAction)(e, "mouse");
        return true;
    };
    document.onkeyup = function(e) {
        (0, _testrecorderJs.possiblyRecordAction)(e, "up");
        (0, _webaudioJs.maybeKillSound)();
        return true;
    };
    document.onkeydown = function(e) {
        (0, _mobileJs.doMobileKeyDown)(e);
        return doKeydownEvent(e);
    };
    let filenameFromQS = getFilenameFromQueryString();
    if (!!(0, _globalappflagsJs.otherflags).FILE) setDocRootFromFile((0, _globalappflagsJs.otherflags).FILE);
    else if (filenameFromQS) setDocRootFromFile(filenameFromQS);
    else if ((0, _featurevectorJs.getFeatureVector)().hasstart) // feature vector is initialized by the webserver.
    // if hasstart is true, it means the user has added a ":start"
    // file, meaning that it should be loaded.
    setDocRootFromStart();
    else setEmptyDocRoot();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueRenderOnlyDirty();
}

},{"./utils.js":"bIDtH","./globalappflags.js":"1FpbG","./perfmon.js":"dHrYS","./eventqueue.js":"9IKLf","./eventqueuedispatcher.js":"2z8jO","./keydispatcher.js":"8ndp7","./systemstate.js":"19Hkn","./builtins/asyncbuiltins.js":"TbEnW","./builtins/surfacebuiltins.js":"1ixFo","./builtins/basicbuiltins.js":"7tIfs","./builtins/contractbuiltins.js":"9CLkf","./builtins/environmentbuiltins.js":"5FIGP","./builtins/filebuiltins.js":"fN6Td","./builtins/iterationbuiltins.js":"6yZi6","./builtins/logicbuiltins.js":"9o1NM","./builtins/makebuiltins.js":"gh2RN","./builtins/mathbuiltins.js":"gvWEw","./builtins/stringbuiltins.js":"aKLAp","./builtins/syscalls.js":"axJ7n","./builtins/tagbuiltins.js":"138Fk","./builtins/testbuiltins.js":"29QXG","./builtins/typeconversions.js":"2cArE","./builtins/wavetablebuiltins.js":"i3gVA","./builtins/midibuiltins.js":"kc7nN","./servercommunication.js":"42rrM","./rendernode.js":"4dhWw","./nex/root.js":"8BOcG","./nex/command.js":"6AUMZ","./nex/deferredcommand.js":"inpbA","./nex/estring.js":"bL0nm","./nex/nex.js":"gNpCL","./tests/unittests.js":"5yjRk","./testrecorder.js":"eXYfk","./globalconstants.js":"3d62t","./evaluator.js":"1TNlN","./environment.js":"4mXDy","./rootmanager.js":"cdnQQ","./documentation.js":"4PeX2","./webaudio.js":"df96Q","./mobile.js":"31W1t","./help.js":"g6Yqo","./featurevector.js":"4PLCD","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"9IKLf":[function(require,module,exports) {
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
*/ // javascript timeouts and events are already queued,
// but it's first-come-first-serve. This converts
// them into a priority queue by making every action
// just push an event onto a javascript array queue
// marked w/ the appropriate priority, then we
// pop and execute anything that's been queued.
// we have:
// - user events, which preempt everything because responsiveness
// - deferred finish, which should preempt rendering because they affect how things get rendered
// - rendering
// - true low priority things, like alert animation
// additionally, in certain contexts we need to enqueue render events at an equal priority
// to user events, like for example for older tests that directly call into doKeyInput
// rather than mimicking browser events.
// do not do the thing where you have multiple names for a queue
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "eventQueue", ()=>eventQueue);
var _vodkaJs = require("./vodka.js");
var _gcJs = require("./gc.js");
var _browsereventresponsefunctionsJs = require("./browsereventresponsefunctions.js");
var _systemstateJs = require("./systemstate.js");
var _eventqueuedispatcherJs = require("./eventqueuedispatcher.js");
var _globalappflagsJs = require("./globalappflags.js");
const USER_EVENT_PRIORITY = 0;
const DEFERRED_PRIORITY = 1;
const RENDER_PRIORITY = 2;
const ALERT_ANIMATION_PRORITY = 3;
const GC_PRIORITY = 4;
const EVENT_DEBUG = false;
class EventQueue {
    constructor(){
        this.queueSet = [];
        this.queueSet[USER_EVENT_PRIORITY] = [];
        this.queueSet[DEFERRED_PRIORITY] = [];
        this.queueSet[RENDER_PRIORITY] = [];
        this.queueSet[ALERT_ANIMATION_PRORITY] = [];
        this.queueSet[GC_PRIORITY] = [];
    }
    initialize() {
        (0, _eventqueuedispatcherJs.eventQueueDispatcher).createDelegate("enqueueAlertAnimation", this);
        (0, _eventqueuedispatcherJs.eventQueueDispatcher).createDelegate("enqueueRenderOnlyDirty", this);
        (0, _eventqueuedispatcherJs.eventQueueDispatcher).createDelegate("enqueueDoKeyInput", this);
        (0, _eventqueuedispatcherJs.eventQueueDispatcher).createDelegate("enqueueDoClickHandlerAction", this);
        (0, _eventqueuedispatcherJs.eventQueueDispatcher).createDelegate("enqueueImportantTopLevelRender", this);
        (0, _eventqueuedispatcherJs.eventQueueDispatcher).createDelegate("enqueueDeferredFinish", this);
        (0, _eventqueuedispatcherJs.eventQueueDispatcher).createDelegate("enqueueDeferredSettle", this);
        (0, _eventqueuedispatcherJs.eventQueueDispatcher).createDelegate("enqueueRenotifyDeferredListeners", this);
        (0, _eventqueuedispatcherJs.eventQueueDispatcher).createDelegate("enqueueTopLevelRender", this);
        (0, _eventqueuedispatcherJs.eventQueueDispatcher).createDelegate("enqueueGC", this);
    }
    /**
	 * @param {RenderNode} renderNode
	 */ enqueueAlertAnimation(renderNode) {
        EVENT_DEBUG && console.log("enqueueing: AlertAnimation");
        let item = {
            action: "doAlertAnimation",
            shouldDedupe: true,
            renderNode: renderNode,
            equals: function(other) {
                // ref equals is okay?
                return other.action == this.action && other.renderNode == this.renderNode;
            },
            do: function doAlertAnimation() {
                if (!(0, _globalappflagsJs.experiments).DISABLE_ALERT_ANIMATIONS) this.renderNode.doAlertAnimation();
            }
        };
        this.queueSet[ALERT_ANIMATION_PRORITY].push(item);
        this.setTimeoutForProcessingNextItem(item);
    }
    /**
	 * @param {string} keycode
	 * @param {string} whichkey
	 * @param {boolean} hasShift
	 * @param {boolean} hasCtrl
	 * @param {boolean} hasMeta
	 * @param {boolean} hasAlt
	 */ enqueueDoKeyInput(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt) {
        EVENT_DEBUG && console.log("enqueueing: DoKeyInput");
        let item = {
            action: "doKeyInput",
            keycode: keycode,
            whichkey: whichkey,
            hasShift: hasShift,
            hasCtrl: hasCtrl,
            hasMeta: hasMeta,
            hasAlt: hasAlt,
            shouldDedupe: false,
            equals: null,
            do: function doDoKeyInput() {
                _vodkaJs.doRealKeyInput(this.keycode, this.whichkey, this.hasShift, this.hasCtrl, this.hasMeta, this.hasAlt);
            }
        };
        this.queueSet[USER_EVENT_PRIORITY].push(item);
        this.setTimeoutForProcessingNextItem(item);
    }
    /**
	 * Enqueues an event that renders only nexes that are marked as dirty.
	 */ enqueueRenderOnlyDirty() {
        EVENT_DEBUG && console.log("enqueueing: RenderOnlyDirty");
        let item = {
            action: "renderOnlyDirty",
            shouldDedupe: true,
            equals: function(other) {
                // ref equals is okay?
                return other.action == this.action;
            },
            do: function doRenderNodeRender() {
                _vodkaJs.renderOnlyDirty();
            }
        };
        this.queueSet[RENDER_PRIORITY].push(item);
        this.setTimeoutForProcessingNextItem(item);
    }
    enqueueImportantTopLevelRender() {
        EVENT_DEBUG && console.log("enqueueing: ImportantTopLevelRender");
        let item = {
            action: "importantTopLevelRender",
            shouldDedupe: true,
            equals: function(other) {
                return other.action == this.action;
            },
            do: function doImportantTopLevelRender() {
                _vodkaJs.topLevelRender();
            }
        };
        // push to the user event queue because higher priority
        this.queueSet[USER_EVENT_PRIORITY].push(item);
        this.setTimeoutForProcessingNextItem(item);
    }
    enqueueDoClickHandlerAction(target, renderNode, atTarget, event) {
        EVENT_DEBUG && console.log("enqueueing: DoClickHandlerAction");
        let item = {
            action: "doClickHandlerAction",
            target: target,
            shouldDedupe: false,
            renderNode: renderNode,
            event: event,
            atTarget: atTarget,
            equals: null,
            do: function doDoClickHandlerAction() {
                (0, _browsereventresponsefunctionsJs.respondToClickEvent)(this.target, this.renderNode, this.atTarget, this.event);
            }
        };
        // TODO: test this and see if it works at render priority
        this.queueSet[USER_EVENT_PRIORITY].push(item);
        this.setTimeoutForProcessingNextItem(item);
    }
    enqueueDeferredFinish(deferred, result) {
        EVENT_DEBUG && console.log("enqueueing: DeferredFinish");
        let item = {
            action: "deferredFinish",
            deferred: deferred,
            result: result,
            shouldDedupe: false,
            equals: null,
            do: function doDeferredFinish() {
                this.deferred.finish(this.result);
            }
        };
        this.queueSet[DEFERRED_PRIORITY].push(item);
        this.setTimeoutForProcessingNextItem(item);
    }
    enqueueDeferredSettle(deferred, result) {
        EVENT_DEBUG && console.log("enqueueing: DeferredSettle");
        let item = {
            action: "deferredSettle",
            deferred: deferred,
            result: result,
            shouldDedupe: false,
            equals: null,
            do: function doDeferredSettle() {
                this.deferred.settle(this.result);
            }
        };
        this.queueSet[DEFERRED_PRIORITY].push(item);
        this.setTimeoutForProcessingNextItem(item);
    }
    enqueueRenotifyDeferredListeners(deferred) {
        EVENT_DEBUG && console.log("enqueueing: RenotifyDeferredListeners");
        let item = {
            action: "renotifyDeferredListeners",
            deferred: deferred,
            shouldDedupe: false,
            equals: null,
            do: function doRenotifyDeferredListeners() {
                this.deferred.notifyAllListeners();
            }
        };
        this.queueSet[DEFERRED_PRIORITY].push(item);
        this.setTimeoutForProcessingNextItem(item);
    }
    enqueueTopLevelRender() {
        EVENT_DEBUG && console.log("enqueueing: TopLevelRender");
        let item = {
            action: "topLevelRender",
            shouldDedupe: true,
            equals: function(other) {
                return other.action == this.action;
            },
            do: function doTopLevelRender() {
                _vodkaJs.topLevelRender();
            }
        };
        this.queueSet[RENDER_PRIORITY].push(item);
        this.setTimeoutForProcessingNextItem(item);
    }
    enqueueGC() {
        EVENT_DEBUG && console.log("enqueueing: GC");
        let item = {
            action: "gc",
            shouldDedupe: true,
            equals: function(other) {
                return other.action == this.action;
            },
            do: function doEnqueueGC() {
                (0, _gcJs.gc).markAndSweep();
            }
        };
        this.queueSet[GC_PRIORITY].push(item);
        this.setTimeoutForProcessingNextItem(item);
    }
    setTimeoutForProcessingNextItem(item) {
        setTimeout(this.processNextItem.bind(this), 0);
    // setTimeout((function() {
    // 	this.processNextItem();
    // }).bind(this), 0);
    }
    selectQueue() {
        // queues with lower indices in the queueSet array have higher priority
        for(let i = 0; i < this.queueSet.length; i++){
            if (this.queueSet[i].length > 0) return this.queueSet[i];
        }
        return null;
    }
    retrieveNextItem() {
        let queueToUse = this.selectQueue();
        if (!queueToUse) return null;
        let item = queueToUse.shift();
        EVENT_DEBUG && console.log(`processing: ${item.action}`);
        // if a bunch of equivalent actions were enqueued, pop them all and just do one
        while(queueToUse.length > 0 && queueToUse[0].shouldDedupe && queueToUse[0].equals(item))queueToUse.shift();
        return item;
    }
    processNextItem() {
        let item = this.retrieveNextItem();
        if (!item) return;
        item.do();
        this.setTimeoutForProcessingNextItem();
    }
}
const eventQueue = new EventQueue();

},{"./vodka.js":"3FCY4","./gc.js":"idaMG","./browsereventresponsefunctions.js":"aXydW","./systemstate.js":"19Hkn","./eventqueuedispatcher.js":"2z8jO","./globalappflags.js":"1FpbG","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"idaMG":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "gc", ()=>gc);
parcelHelpers.export(exports, "incFFGen", ()=>incFFGen);
parcelHelpers.export(exports, "getFFGen", ()=>getFFGen);
var _systemstateJs = require("./systemstate.js");
/*
FF_GEN is a cheap way to cancel all pending deferred computations. It's a "generation"
number, so basically if the current generation is zero, then any newly created deferred
computation is given that generation number when it's kicked off. If the generation is
incremented at any point (so that we are now on generation 1), then when that deferred
computation attempts to complete, it will see that it's from an old generation, and it
won't complete.
*/ let FF_GEN = 0;
function getFFGen() {
    return FF_GEN;
}
function incFFGen() {
    FF_GEN++;
}
// UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE 
// UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE 
// UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE UPDATE 
// This "garbage collector" is deprecated and unused. It's also misnamed, what it really is
// is something that looks for orphan deferreds. However I don't think even this is needed
// anymore because I can do deferred cancelling in the call to cleanupOnMemoryFree that
// heap makes when freeing memory. Need to look at the mark and sweep algo below and see
// if applies to now
/**
 * Cancels any deferreds that are not visible on the screen. This is of questionable usefulness.
 */ class GarbageCollector {
    // right now I only do deferred, and I kill any deferreds
    // that are not currently visible/rendering on the screen
    // (meaning that if you stored an deferred in an environment
    // somewhere it will get killed by this)
    // also this is only run manually.
    constructor(){
        this.deferreds = {};
    }
    register(def) {
        this.deferreds[def.getID()] = {
            def: def,
            isReachable: false
        };
    }
    markAndSweep() {
        for(let key in this.deferreds){
            let rec = this.deferreds[key];
            rec.isReachable = false;
        }
        let nodesToProcess = [];
        nodesToProcess.push((0, _systemstateJs.systemState).getRoot());
        while(nodesToProcess.length > 0){
            let node = nodesToProcess.pop();
            let nex = node.getNex();
            if (nex.getTypeName() == "-deferredvalue-" || nex.getTypeName() == "-deferredcommand-") this.deferreds[nex.getID()].isReachable = true;
            if (nex.isNexContainer()) for(let i = 0; i < node.numChildren(); i++){
                let c = node.getChildAt(i);
                nodesToProcess.push(c);
            }
        }
        for(let key in this.deferreds){
            let rec = this.deferreds[key];
            if (!rec.isReachable) rec.def.cancel();
        }
    }
}
const gc = new GarbageCollector();

},{"./systemstate.js":"19Hkn","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"aXydW":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "respondToClickEvent", ()=>respondToClickEvent);
var _eventqueuedispatcherJs = require("./eventqueuedispatcher.js");
var _systemstateJs = require("./systemstate.js");
var _manipulatorJs = require("./manipulator.js");
// can return null if user clicks on some other thing
function getParentNexOfDomElement(elt) {
    while(elt && !elt.classList.contains("nex"))elt = elt.parentNode;
    return elt;
}
function respondToClickEvent(nex, renderNode, atTarget, browserEvent) {
    if (nex.extraClickHandler) {
        nex.extraClickHandler(browserEvent.clientX, browserEvent.clientY);
        return;
    }
    if ((0, _systemstateJs.systemState).isMouseFunnelActive() && atTarget) {
        let parentNexDomElt = getParentNexOfDomElement(browserEvent.target);
        if ((0, _systemstateJs.systemState).getGlobalSelectedNode().getDomNode() == parentNexDomElt) return;
        let insertAfterRemove = false;
        let oldSelectedNode = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        if (((0, _systemstateJs.systemState).getGlobalSelectedNode().getNex().getTypeName() == "-estring-" || (0, _systemstateJs.systemState).getGlobalSelectedNode().getNex().getTypeName() == "-eerror-") && (0, _systemstateJs.systemState).getGlobalSelectedNode().getNex().getMode() == MODE_EXPANDED) (0, _systemstateJs.systemState).getGlobalSelectedNode().getNex().finishInput();
        else if ((0, _systemstateJs.systemState).getGlobalSelectedNode().getNex().getTypeName() == "-insertionpoint-") insertAfterRemove = true;
        browserEvent.stopPropagation();
        renderNode.setSelected();
        if (insertAfterRemove && (0, _systemstateJs.systemState).getGlobalSelectedNode() != oldSelectedNode) (0, _manipulatorJs.manipulator).removeNex(oldSelectedNode);
        (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueImportantTopLevelRender();
    }
}

},{"./eventqueuedispatcher.js":"2z8jO","./systemstate.js":"19Hkn","./manipulator.js":"9qI89","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"9qI89":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "manipulator", ()=>manipulator);
var _utilsJs = require("./utils.js");
var _systemstateJs = require("./systemstate.js");
var _rendernodeJs = require("./rendernode.js");
var _nexJs = require("./nex/nex.js");
var _rootJs = require("./nex/root.js");
var _contexttypeJs = require("./contexttype.js");
var _eerrorJs = require("./nex/eerror.js");
var _lambdaJs = require("./nex/lambda.js");
var _esymbolJs = require("./nex/esymbol.js");
var _commandJs = require("./nex/command.js");
var _boolJs = require("./nex/bool.js");
var _docJs = require("./nex/doc.js");
var _estringJs = require("./nex/estring.js");
var _wordJs = require("./nex/word.js");
var _wavetableJs = require("./nex/wavetable.js");
var _lineJs = require("./nex/line.js");
var _orgJs = require("./nex/org.js");
var _floatJs = require("./nex/float.js");
var _integerJs = require("./nex/integer.js");
var _deferredcommandJs = require("./nex/deferredcommand.js");
var _letterJs = require("./nex/letter.js");
var _separatorJs = require("./nex/separator.js");
var _nilJs = require("./nex/nil.js");
var _instantiatorJs = require("./nex/instantiator.js");
var _globalappflagsJs = require("./globalappflags.js");
var _testrecorderJs = require("./testrecorder.js");
var _helpJs = require("./help.js");
var CLIPBOARD = null;
var CLIPBOARD_INSERTION_MODE = null;
class Manipulator {
    // Private methods start with underscore. This needs a big refactoring.
    // deprecated
    _conformData(data) {
        if (data instanceof (0, _nexJs.Nex)) return new (0, _rendernodeJs.RenderNode)(data);
        else return data;
    }
    //////// *********************** --------------------------------------------------
    //////// *********************** --------------------------------------------------
    //////// *********************** --------------------------------------------------
    // TESTS
    _inSameLine(s1, s2) {
        let l1 = this.getEnclosingLineInSameDoc(s1);
        let l2 = this.getEnclosingLineInSameDoc(s2);
        return l1 == l2;
    }
    isInsertBefore(node) {
        return node.getInsertionMode() == (0, _rendernodeJs.INSERT_BEFORE);
    }
    isInsertAfter(node) {
        return node.getInsertionMode() == (0, _rendernodeJs.INSERT_AFTER);
    }
    isInsertAround(node) {
        return node.getInsertionMode() == (0, _rendernodeJs.INSERT_AROUND);
    }
    isInsertInside(node) {
        return node.getInsertionMode() == (0, _rendernodeJs.INSERT_INSIDE);
    }
    _isEmpty(node) {
        return node.numChildren() == 0;
    }
    _isLetterInDocFormatUpToLine(node) {
        if (!_utilsJs.isLetter(node)) return false;
        let word = node.getParent();
        if (!word) return false;
        if (!_utilsJs.isWord(word)) return false;
        let line = word.getParent();
        if (!line) return false;
        if (!_utilsJs.isLine(line)) return false;
        return true;
    }
    _isLetterInDocFormat(node) {
        if (!_utilsJs.isLetter(node)) return false;
        let word = node.getParent();
        if (!word) return false;
        if (!_utilsJs.isWord(word)) return false;
        if ((0, _globalappflagsJs.experiments).V2_INSERTION_LENIENT_DOC_FORMAT) return true;
        let line = word.getParent();
        if (!line) return false;
        if (!_utilsJs.isLine(line)) return false;
        let doc = line.getParent();
        if (!doc) return false;
        if (!_utilsJs.isDoc(doc)) return false;
        return true;
    }
    _isSeparatorInDocFormat(node) {
        if (!_utilsJs.isSeparator(node)) return false;
        let line = node.getParent();
        if (!line) return false;
        if (!_utilsJs.isLine(line)) return false;
        if ((0, _globalappflagsJs.experiments).V2_INSERTION_LENIENT_DOC_FORMAT) return true;
        let doc = line.getParent();
        if (!doc) return false;
        if (!_utilsJs.isDoc(doc)) return false;
        return true;
    }
    _isLetterInSeparatorPosition(node) {
        if (!_utilsJs.isLetter(node)) return false;
        let line = node.getParent();
        if (!line) return false;
        if (!_utilsJs.isLine(line)) return false;
        if ((0, _globalappflagsJs.experiments).V2_INSERTION_LENIENT_DOC_FORMAT) return true;
        let doc = line.getParent();
        if (!doc) return false;
        if (!_utilsJs.isDoc(doc)) return false;
        return true;
    }
    _isSeparatorInLetterPosition(node) {
        if (!_utilsJs.isSeparator(node)) return false;
        let word = node.getParent();
        if (!word) return false;
        if (!_utilsJs.isWord(word)) return false;
        if ((0, _globalappflagsJs.experiments).V2_INSERTION_LENIENT_DOC_FORMAT) return true;
        let line = word.getParent();
        if (!line) return false;
        if (!_utilsJs.isLine(line)) return false;
        let doc = line.getParent();
        if (!doc) return false;
        if (!_utilsJs.isDoc(doc)) return false;
        return true;
    }
    _isInDocFormat(node) {
        return this._isLetterInDocFormat(node) || this._isSeparatorInDocFormat(node) || this._isLetterInSeparatorPosition(node);
    }
    _isOnlyLeafInLine(node) {
        let line = this.getEnclosingLineInSameDoc(node);
        return node == this._getFirstLeafInside(line) && node == this._getLastLeafInside(line);
    }
    _isFirstLeafInLine(node) {
        if (this._isLetterInDocFormat(node)) {
            let word = node.getParent();
            let line = word.getParent();
            return word.getChildAt(0) == node && line.getChildAt(0) == word;
        } else if (this._isSeparatorInDocFormat(node)) {
            let line = node.getParent();
            return line.getChildAt(0) == node;
        } else return false;
    }
    _isEmptyLineInDoc(node) {
        let p = node.getParent();
        if (!p) return false;
        return _utilsJs.isLine(node) && _utilsJs.isDoc(p) && this._isEmpty(node);
    }
    _isLastChildOf(c, of) {
        if (of.numChildren() == 0) return false;
        return of.getLastChild() == c;
    }
    _isFirstChildOf(c, of) {
        if (of.numChildren() == 0) return false;
        return of.getFirstChild() == c;
    }
    _forceInsertionMode(mode, node) {
        return node.setInsertionMode(mode);
    }
    //////// *********************** --------------------------------------------------
    //////// *********************** --------------------------------------------------
    //////// *********************** --------------------------------------------------
    // SPLITTING
    // given a list
    // ( ( a b c d S e f g ) )
    // where S is the element to split after
    // we are passing in some list type
    // and this does this:
    // ( ( a b c d S ) ( e f g ) )
    _splitParentAfterAndPutIn(toSplitAfter, toPutIn) {
        let p = toSplitAfter.getParent();
        if (!p) return false;
        if (p.getLastChild() == toSplitAfter) return false; // nothing to do
        let c;
        while(c = p.getChildAfter(toSplitAfter)){
            p.removeChild(c);
            toPutIn.appendChild(c);
        }
        let p2 = p.getParent();
        p2.insertChildAfter(toPutIn, p);
        return true;
    }
    // given a list
    // ( ( a b c d S e f g ) )
    // where S is the element to split before
    // we are passing in some list type
    // and this does this:
    // ( ( a b c d ) ( S e f g ) )
    _splitParentBeforeAndPutIn(toSplitBefore, toPutIn) {
        let p = toSplitBefore.getParent();
        if (!p) return false;
        if (p.getFirstChild() == toSplitBefore) return false; // nothing to do
        let c;
        while(c = p.getChildAfter(toSplitBefore)){
            p.removeChild(c);
            toPutIn.appendChild(c);
        }
        p.removeChild(toSplitBefore);
        toPutIn.prependChild(toSplitBefore);
        let p2 = p.getParent();
        p2.insertChildAfter(toPutIn, p);
        return true;
    }
    // given a list like this:
    // ( ( ( a b c S d e f ) ) )
    // splits parent AND grandparent
    // ( ( ( a b c S ) ) ( ( d e f ) ) )
    _splitParentAndGrandparentAfterAndPutIn(toSplitAfter, toPutInParentLevel, toPutInGrandparentLevel) {
        let t = this._splitParentAfterAndPutIn(toSplitAfter, toPutInParentLevel);
        if (!t) return false;
        let p = toSplitAfter.getParent();
        return this._splitParentAfterAndPutIn(p, toPutInGrandparentLevel);
    }
    // given a list like this:
    // ( ( ( a b c S d e f ) ) )
    // splits parent AND grandparent
    // ( ( ( a b c ) ) ( ( S d e f ) ) )
    _splitParentAndGrandparentBeforeAndPutIn(toSplitBefore, toPutInParentLevel, toPutInGrandparentLevel) {
        let t = this._splitParentBeforeAndPutIn(toSplitBefore, toPutInParentLevel);
        if (!t) return false;
        let p = toSplitBefore.getParent();
        return this._splitParentBeforeAndPutIn(p, toPutInGrandparentLevel);
    }
    // given a list like this:
    // ( ( a b c ( ...S... ) d e ) )
    // splits just grandparent, ignoring what's in the parent of S
    // ( ( a b c ) ( (...S...) d e ) )
    _splitGrandparentBeforeAndPutIn(toSplitBefore, toPutIn) {
        let p = toSplitBefore.getParent();
        if (!p) return false;
        return this._splitParentBeforeAndPutIn(p, toPutIn);
    }
    // given a list like this:
    // ( ( a b c ( ...S... ) d e ) )
    // splits just grandparent, ignoring what's in the parent of S
    // ( ( a b c (...S...) ) ( d e ) )
    _splitGrandparentAfterAndPutIn(toSplitAfter, toPutIn) {
        let p = toSplitAfter.getParent();
        if (!p) return false;
        return this._splitParentAfterAndPutIn(p, toPutIn);
    }
    //////// *********************** --------------------------------------------------
    //////// *********************** --------------------------------------------------
    //////// *********************** --------------------------------------------------
    // APPENDING
    _appendAfterAndSelect(toAppend, after) {
        if (this._appendAfter(toAppend, after)) {
            toAppend.setSelected();
            return true;
        }
        return false;
    }
    _appendAfter(toAppend, after) {
        let p = after.getParent();
        if (!p) return false;
        p.insertChildAfter(toAppend, after);
        return true;
    }
    _appendAsLastChildOf(toAppend, inside) {
        inside.appendChild(toAppend);
        return true;
    }
    //////// *********************** --------------------------------------------------
    //////// *********************** --------------------------------------------------
    //////// *********************** --------------------------------------------------
    // PREPENDING
    _prependBeforeAndSelect(toPrepend, before) {
        if (this._prependBefore(toPrepend, before)) {
            toPrepend.setSelected();
            return true;
        }
        return false;
    }
    _prependBefore(toPrepend, before) {
        let p = before.getParent();
        if (!p) return false;
        p.insertChildBefore(toPrepend, before);
        return true;
    }
    _prependAsFirstChildOf(toPrepend, inside) {
        inside.prependChild(toPrepend);
        return true;
    }
    //////// *********************** --------------------------------------------------
    //////// *********************** --------------------------------------------------
    //////// *********************** --------------------------------------------------
    // JOINING
    // takes all the contents of c2 and puts them in c1,
    // then deletes c2
    _joinContainers(c1, c2) {
        let p = c1.getParent();
        if (p.getNextSibling(c1) != c2) return false;
        while(c2.hasChildren())c1.appendChild(c2.removeChildAt(0));
        this._deleteNode(c2);
    }
    //////// *********************** --------------------------------------------------
    //////// *********************** --------------------------------------------------
    //////// *********************** --------------------------------------------------
    // DELETING
    // cleaned up version of removeNex
    _deleteNode(node) {
        let p = node.getParent();
        if (!p) return false;
        if (node.isSelected()) p.setSelected();
        p.removeChild(node);
        return true;
    }
    _deleteLetterAndPossiblyWord(s) {
        let word = s.getParent();
        if (!word) return;
        if (word.numChildren() == 1) this._deleteNode(word);
        else this._deleteNode(s);
    }
    _deleteUpToLine(s) {
        // could be line > thing
        // or line > word > thing
        let p = s.getParent();
        if (!p) return false;
        this._deleteNode(s);
        if (_utilsJs.isWord(p)) {
            let line = p.getParent();
            this._deleteNode(p);
        }
        return true;
    }
    _deleteSeparatorAndPossiblyJoinWords(s) {
        let prev = this._getSiblingBefore(s);
        let next = this._getSiblingAfter(s);
        this._deleteNode(s);
        if (prev && next && _utilsJs.isWord(prev) && _utilsJs.isWord(next)) this._joinContainers(prev, next);
    }
    _deleteCorrectlyAccordingToLeafType(toDelete) {
        if (this._isLetterInDocFormat(toDelete)) this._deleteLetterAndPossiblyWord(toDelete);
        else if (this._isSeparatorInDocFormat(toDelete) || this._isLetterInSeparatorPosition(toDelete)) this._deleteSeparatorAndPossiblyJoinWords(toDelete);
    }
    _deleteEmptyLine(s) {
        let previousSibLine = this._getSiblingBefore(s);
        if (previousSibLine) {
            previousSibLine.setSelected();
            if (!this._isEmpty(previousSibLine)) {
                let tosel = this._getLastLeafInside(previousSibLine);
                tosel.setSelected();
                this._forceInsertionMode((0, _rendernodeJs.INSERT_AFTER), tosel);
            }
            this._deleteNode(s);
        } else {
            let p = s.getParent();
            p.setSelected();
            this._deleteNode(s);
        }
    }
    _deleteLineBreak(s) {
        let enclosingLine = this.getEnclosingLineInSameDoc(s);
        let previousSibLine = this._getSiblingBefore(enclosingLine);
        if (enclosingLine && previousSibLine && _utilsJs.isLine(previousSibLine)) {
            this._joinContainers(previousSibLine, enclosingLine);
            // now maybe join words.
            let enclosingWord = this.getEnclosingWordInSameDoc(s);
            let previousSibWord = this._getSiblingBefore(enclosingWord); // if enclosingWord null, returns null
            if (enclosingWord && previousSibWord && _utilsJs.isWord(previousSibWord)) this._joinContainers(previousSibWord, enclosingWord);
            let prev = this._getLeafBefore(s);
            if (prev && this._inSameLine(prev, s)) {
                prev.setSelected();
                this._forceInsertionMode((0, _rendernodeJs.INSERT_AFTER), prev);
            }
            return true;
        }
    }
    //////// *********************** --------------------------------------------------
    //////// *********************** --------------------------------------------------
    //////// *********************** --------------------------------------------------
    // GETTING OTHER NODES
    // gets the selected node
    selected() {
        return (0, _systemstateJs.systemState).getGlobalSelectedNode();
    }
    _getSiblingAfter(of) {
        let p = of.getParent();
        if (!p) return false;
        let sib = p.getNextSibling(of);
        if (!sib) return false; // meh not strictly necessary but clearer?
        return sib;
    }
    _getSiblingBefore(of) {
        if (!of) return null;
        let p = of.getParent();
        if (!p) return false;
        let sib = p.getPreviousSibling(of);
        if (!sib) return false; // meh not strictly necessary but clearer?
        return sib;
    }
    _getLeafBefore(before) {
        let s = before;
        let c = null;
        while(!(c = this._getSiblingBefore(s))){
            s = s.getParent();
            if (!s || _utilsJs.isCodeContainer(s)) return null;
        }
        s = c;
        while(!_utilsJs.isCodeContainer(s)){
            let c = this._getLastChildOf(s);
            if (!c) break;
            else s = c;
        }
        return s;
    }
    _getLeafAfter(after) {
        let s = after;
        let c = null;
        while(!(c = this._getSiblingAfter(s))){
            s = s.getParent();
            if (!s || _utilsJs.isCodeContainer(s)) return null;
        }
        s = c;
        while(!_utilsJs.isCodeContainer(s)){
            let c = this._getFirstChildOf(s);
            if (!c) break;
            else s = c;
        }
        return s;
    }
    _getLeafAfterFromSameLine(after) {
        let c = this._getLeafAfter(after);
        if (!c) return null;
        if (!this._inSameLine(after, c)) return null;
        return c;
    }
    _getLeafBeforeFromSameLine(before) {
        let c = this._getLeafBefore(before);
        if (!c) return null;
        if (!this._inSameLine(before, c)) return null;
        return c;
    }
    _getFirstChildOf(s) {
        if (!_utilsJs.isNexContainer(s)) return false;
        let c = s.getFirstChild();
        if (!c) return false;
        return c;
    }
    _getFirstLeafInside(s) {
        while(_utilsJs.isNexContainer(s) && (s = s.getFirstChild()) != null);
        return s;
    }
    _getLastLeafInside(s) {
        while(_utilsJs.isNexContainer(s) && (s = s.getLastChild()) != null);
        return s;
    }
    _getLastChildOf(s) {
        if (!_utilsJs.isNexContainer(s)) return false;
        let c = s.getLastChild();
        if (!c) return false;
        return c;
    }
    //////// *********************** --------------------------------------------------
    //////// *********************** --------------------------------------------------
    //////// *********************** --------------------------------------------------
    //////// OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
    //////// OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
    //////// OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
    // OKAY NOW THIS OTHER ASCII GARBAGE IS FOR PRIVATE HELPER METHODS
    // THEY ARE NOT UTILITIES BECAUSE THEY AREN'T GENERAL PURPOSE
    // THEY ARE SPECIFIC IN PURPOSE BUT NOT PUBLIC
    // THESE SHOULD ALL BE SEPARATE CLASSES THEN I WOULDN'T HAVE TO SCREAM IN ALL CAPS
    _doLineBreakBeforeSeparator(s, context) {
        if (this._isSeparatorInDocFormat(s) || this._isLetterInSeparatorPosition(s)) {
            if (this._splitParentBeforeAndPutIn(s, this.possiblyMakeImmutable(this.newLine(), context))) {
                // split was performed, select next leaf and put insertion point before
                this._selectPreviousLeafImpl();
                this._forceInsertionMode((0, _rendernodeJs.INSERT_AFTER), this.selected());
            } else this._prependBefore(this.possiblyMakeImmutable(this.newLine(), context), this.getEnclosingLineInSameDoc(s));
        } else if (this._isSeparatorInLetterPosition(s)) this._doLineBreakBeforeLetter(s);
    }
    _doLineBreakAfterSeparator(s, context) {
        if (this._isSeparatorInDocFormat(s) || this._isLetterInSeparatorPosition(s)) {
            if (this._splitParentAfterAndPutIn(s, this.possiblyMakeImmutable(this.newLine(), context))) {
                // split was performed, select next leaf and put insertion point before
                this._selectNextLeafImpl();
                this._forceInsertionMode((0, _rendernodeJs.INSERT_BEFORE), this.selected());
            } else // split not performed, insert new empty line
            this._appendAfterAndSelect(this.possiblyMakeImmutable(this.newLine(), context), this.getEnclosingLineInSameDoc(s));
        } else if (this._isSeparatorInLetterPosition(s)) this._doLineBreakAfterLetter(s, context);
    }
    _doLineBreakBeforeLetter(s, context) {
        let needToChangeSelectedLetter = s.getInsertionMode() == (0, _rendernodeJs.INSERT_AFTER);
        if (this._isLetterInDocFormat(s) || this._isSeparatorInLetterPosition(s)) {
            // for situations where we have ( ( a S b c) )
            if (this._splitParentAndGrandparentBeforeAndPutIn(s, this.possiblyMakeImmutable(this.newWord(), context), this.possiblyMakeImmutable(this.newLine(), context))) // split was performed
            {
                if (needToChangeSelectedLetter) {
                    this._selectPreviousLeafImpl();
                    this._forceInsertionMode((0, _rendernodeJs.INSERT_AFTER), this.selected());
                }
            } else if (this._splitGrandparentBeforeAndPutIn(s, this.possiblyMakeImmutable(this.newLine(), context))) {
                if (needToChangeSelectedLetter) {
                    this._selectPreviousLeafImpl();
                    this._forceInsertionMode((0, _rendernodeJs.INSERT_AFTER), this.selected());
                }
            } else this._prependBefore(this.possiblyMakeImmutable(this.newLine(), context), this.getEnclosingLineInSameDoc(s));
        } else if (this._isLetterInSeparatorPosition(s)) this._doLineBreakBeforeSeparator(s, context);
    }
    _doLineBreakAfterLetter(s, context) {
        if (this._isLetterInDocFormat(s) || this._isSeparatorInLetterPosition(s)) {
            // for situations where we have ( ( a b S c ) )
            if (this._splitParentAndGrandparentAfterAndPutIn(s, this.possiblyMakeImmutable(this.newWord(), context), this.possiblyMakeImmutable(this.newLine(), context))) {
                // split was performed, need to move selected node
                this._selectNextLeafImpl();
                this._forceInsertionMode((0, _rendernodeJs.INSERT_BEFORE), this.selected());
            // for situations where we have ( ( a b S ) c )
            } else if (this._splitGrandparentAfterAndPutIn(s, this.possiblyMakeImmutable(this.newLine(), context))) {
                this._selectNextLeafImpl();
                this._forceInsertionMode((0, _rendernodeJs.INSERT_BEFORE), this.selected());
            } else this._appendAfterAndSelect(this.possiblyMakeImmutable(this.newLine(), context), this.getEnclosingLineInSameDoc(s));
        } else if (this._isLetterInSeparatorPosition(s)) this._doLineBreakAfterSeparator(s, context);
    }
    //////// OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
    //////// OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
    //////// OOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOOO
    // OKAY BELOW THIS WE HAVE ENTRY POINT METHODS
    // THAT ARE CALLED DIRECTLY FROM KEYRESPONSEFUNCTIONS.JS
    // TO PERFORM WHATEVER ACTIONS IT WANTS TO PERFORM
    // THESE NEED A BETTER NAMING CONVENTION THAT TELLS YOU
    // WHAT NEX FIRES THEM IN RESPONSE TO WHAT KEYSTROKES
    deleteLeaf(s) {
        if (this._isOnlyLeafInLine(s)) {
            if (this.isInsertAfter(s)) {
                let line = this.getEnclosingLineInSameDoc(s);
                this._deleteUpToLine(s);
                line.setSelected();
                this._forceInsertionMode((0, _rendernodeJs.INSERT_INSIDE), line);
            } else this._deleteLineBreak(s);
        } else if (this._isFirstLeafInLine(s)) {
            if (this.isInsertAfter(s)) {
                let nextLeaf = this._getLeafAfter(s);
                nextLeaf.setSelected();
                this._forceInsertionMode((0, _rendernodeJs.INSERT_BEFORE), nextLeaf);
                this._deleteNode(s);
                return true;
            } else // treat around the same as before
            this._deleteLineBreak(s);
        } else if (this._isInDocFormat(s)) {
            if (this.isInsertAfter(s)) {
                let toSelectNext = this._getLeafBefore(s);
                toSelectNext.setSelected();
                this._deleteCorrectlyAccordingToLeafType(s);
            } else {
                let toDelete = this._getLeafBefore(s);
                this._deleteCorrectlyAccordingToLeafType(toDelete);
                // so we want to try to keep the insertion point on the right
                // whenever possible, so if possible we grab previous leaf and select it,
                // putting insertion on right. But if they are in different lines, don't.
                let prev = this._getLeafBefore(s);
                if (prev && this.getEnclosingLineInSameDoc(prev) == this.getEnclosingLineInSameDoc(s)) prev.setSelected();
            }
        } else // simpler delete for "naked" letters
        this.removeAndSelectPreviousSibling(s);
    }
    maybeDeleteEmptyLine(s) {
        if (this._isEmptyLineInDoc(s)) this._deleteEmptyLine(s);
    }
    // used by undo
    deleteAnyLineBreak() {
        let sel = this.selected();
        if (_utilsJs.isLetter(sel) || _utilsJs.isSeparator(sel)) this._deleteLineBreak(sel);
        else this.maybeDeleteEmptyLine(sel);
    }
    removeAndSelectPreviousSibling(s) {
        (0, _helpJs.doTutorial)("delete");
        let b = this._getSiblingBefore(s);
        let a = this._getSiblingAfter(s);
        let p = s.getParent();
        this._deleteNode(s);
        if (b) b.setSelected();
        else if (a) {
            a.setSelected();
            this._forceInsertionMode((0, _rendernodeJs.INSERT_BEFORE), a);
        } else {
            p.setSelected();
            this._forceInsertionMode((0, _rendernodeJs.INSERT_INSIDE), p);
        }
    }
    removeAndSelectPreviousSiblingIfEmpty(s) {
        if (!s.hasChildren()) this.removeAndSelectPreviousSibling(s);
    }
    selectPreviousLeaf(s) {
        if (this._isFirstLeafInLine(s)) {
            if (s.getInsertionMode() == (0, _rendernodeJs.INSERT_BEFORE)) {
                this._selectPreviousLeafImpl();
                let changedWhatIsSelected = s != this.selected();
                if (changedWhatIsSelected) {
                    if (_utilsJs.isLine(this.selected())) this._forceInsertionMode((0, _rendernodeJs.INSERT_INSIDE), this.selected());
                    else this._forceInsertionMode((0, _rendernodeJs.INSERT_AFTER), this.selected());
                } else // because attempting to go to the previous leaf temporarily changes
                // which node is selected, doing so will revert selection mode
                // to the default (insert_after), so we need to restore it to before.
                this._forceInsertionMode((0, _rendernodeJs.INSERT_BEFORE), this.selected());
            } else this._forceInsertionMode((0, _rendernodeJs.INSERT_BEFORE), this.selected());
        } else if (this._isEmptyLineInDoc(s)) {
            let sib = this._getSiblingBefore(s);
            if (sib) {
                if (this._isEmptyLineInDoc(sib)) {
                    sib.setSelected();
                    this._forceInsertionMode((0, _rendernodeJs.INSERT_INSIDE), sib);
                } else {
                    let c = this._getLastLeafInside(sib);
                    c.setSelected();
                    this._forceInsertionMode((0, _rendernodeJs.INSERT_AFTER), c);
                }
            } else return false;
        } else this._selectPreviousLeafImpl();
    }
    selectNextLeaf(s) {
        if (s.getInsertionMode() == (0, _rendernodeJs.INSERT_BEFORE)) {
            this._forceInsertionMode((0, _rendernodeJs.INSERT_AFTER), this.selected());
            return;
        }
        this._selectNextLeafImpl();
        if (this._isFirstLeafInLine(this.selected())) this._forceInsertionMode((0, _rendernodeJs.INSERT_BEFORE), this.selected());
        else if (_utilsJs.isLine(this.selected())) this._forceInsertionMode((0, _rendernodeJs.INSERT_INSIDE), this.selected());
        else this._forceInsertionMode((0, _rendernodeJs.INSERT_AFTER), this.selected());
    }
    doLineBreakForLetter(s, context) {
        if (s.getInsertionMode() == (0, _rendernodeJs.INSERT_AFTER)) this._doLineBreakAfterLetter(s, context);
        else this._doLineBreakBeforeLetter(s, context);
    }
    doLineBreakForSeparator(s, context) {
        if (s.getInsertionMode() == (0, _rendernodeJs.INSERT_AFTER)) this._doLineBreakAfterSeparator(s, context);
        else this._doLineBreakBeforeSeparator(s, context);
    }
    doLineBreakForLine(s, context) {
        let ln = this.possiblyMakeImmutable(this.newLine(), context);
        let mode = s.getInsertionMode();
        if (mode == (0, _rendernodeJs.INSERT_BEFORE) || mode == (0, _rendernodeJs.INSERT_AROUND)) this._prependBeforeAndSelect(ln, s);
        else this._appendAfterAndSelect(ln, s);
    }
    moveLeftUp(s) {
        if ((0, _globalappflagsJs.experiments).OLD_ARROW_KEY_TRAVERSAL) {
            this.selectPreviousSibling() || this._forceInsertionMode((0, _rendernodeJs.INSERT_BEFORE), this.selected());
            return;
        }
        let r = false;
        if (s.getInsertionMode() == (0, _rendernodeJs.INSERT_AFTER)) {
            if (_utilsJs.isNexContainer(s) && s.nex.canDoInsertInside()) r = this._forceInsertionMode((0, _rendernodeJs.INSERT_INSIDE), s);
            else r = this._forceInsertionMode((0, _rendernodeJs.INSERT_BEFORE), s);
        } else if (s.getInsertionMode() == (0, _rendernodeJs.INSERT_INSIDE)) r = this._forceInsertionMode((0, _rendernodeJs.INSERT_BEFORE), s);
        else if (r = this.selectPreviousSibling()) this._forceInsertionMode((0, _rendernodeJs.INSERT_BEFORE), this.selected());
        if (r) (0, _helpJs.doTutorial)("movement");
        return r;
    }
    moveLeftForLine(s) {
        // if s is not in doc context, don't do anything special.
        let context = this.getContextForNode(s);
        if (context != (0, _contexttypeJs.ContextType).DOC && context != (0, _contexttypeJs.ContextType).IMMUTABLE_DOC) return this.moveLeftUp();
        return this.selectPreviousLeaf(s);
    }
    moveUpForLine(s) {
        // if s is not in doc context, don't do anything special.
        let context = this.getContextForNode(s);
        if (context != (0, _contexttypeJs.ContextType).DOC && context != (0, _contexttypeJs.ContextType).IMMUTABLE_DOC) return this.moveLeftUp();
        return this.selectCorrespondingLetterInPreviousLine(s);
    }
    moveRightDown(s) {
        if ((0, _globalappflagsJs.experiments).OLD_ARROW_KEY_TRAVERSAL) {
            if (s.getInsertionMode() == (0, _rendernodeJs.INSERT_BEFORE)) this._forceInsertionMode((0, _rendernodeJs.INSERT_AFTER), s);
            else this.selectNextSibling() || this._forceInsertionMode((0, _rendernodeJs.INSERT_AFTER), this.selected());
            return;
        }
        let r = false;
        if (s.getInsertionMode() == (0, _rendernodeJs.INSERT_BEFORE)) {
            if (_utilsJs.isNexContainer(s) && s.nex.canDoInsertInside()) r = this._forceInsertionMode((0, _rendernodeJs.INSERT_INSIDE), s);
            else r = this._forceInsertionMode((0, _rendernodeJs.INSERT_AFTER), s);
        } else if (s.getInsertionMode() == (0, _rendernodeJs.INSERT_INSIDE)) r = this._forceInsertionMode((0, _rendernodeJs.INSERT_AFTER), s);
        else if (r = this.selectNextSibling()) this._forceInsertionMode((0, _rendernodeJs.INSERT_AFTER), this.selected());
        if (r) (0, _helpJs.doTutorial)("movement");
        return r;
    }
    moveRightForLine(s) {
        // if s is not in doc context, don't do anything special.
        let context = this.getContextForNode(s);
        if (context != (0, _contexttypeJs.ContextType).DOC && context != (0, _contexttypeJs.ContextType).IMMUTABLE_DOC) return this.moveRightDown(s);
        return this.selectNextLeaf(s);
    }
    moveDownForLine(s) {
        // if s is not in doc context, don't do anything special.
        let context = this.getContextForNode(s);
        if (context != (0, _contexttypeJs.ContextType).DOC && context != (0, _contexttypeJs.ContextType).IMMUTABLE_DOC) return this.moveRightDown(s);
        return this.selectCorrespondingLetterInNextLine(s);
    }
    // in use
    selectFirstChildOrMoveInsertionPoint(s) {
        if (!s.nex.canDoInsertInside()) return;
        (0, _helpJs.doTutorial)("movement");
        if (!this.selectFirstChild()) this._forceInsertionMode((0, _rendernodeJs.INSERT_INSIDE), this.selected());
        else {
            // when selecting first child, put insertion point before it
            // WILL BREAK ALL THE TESTS
            // so I need some kind of flag for old tests
            manipulator._forceInsertionMode((0, _rendernodeJs.INSERT_BEFORE), this.selected());
            return true;
        }
    }
    // heavily used
    defaultInsertFor(insertInto, toInsert) {
        // ahem this only works if insertInto is selected
        switch(insertInto.getInsertionMode()){
            case 0, _rendernodeJs.INSERT_AFTER:
                return this.insertAfterSelectedAndSelect(toInsert);
            case 0, _rendernodeJs.INSERT_BEFORE:
                return this.insertBeforeSelectedAndSelect(toInsert);
            case 0, _rendernodeJs.INSERT_INSIDE:
                return this.insertAsFirstChild(toInsert);
            case 0, _rendernodeJs.INSERT_AROUND:
                if (_utilsJs.isNexContainer(toInsert)) return this.wrapSelectedInAndSelect(toInsert);
                else return this.insertBeforeSelectedAndSelect(toInsert);
        }
    }
    // These are used by the exact keystrokes you think
    forceInsertBefore() {
        this._forceInsertionMode((0, _rendernodeJs.INSERT_BEFORE), this.selected());
    }
    // These are used by the exact keystrokes you think
    forceInsertAfter() {
        this._forceInsertionMode((0, _rendernodeJs.INSERT_AFTER), this.selected());
    }
    // These are used by the exact keystrokes you think
    forceInsertAround() {
        this._forceInsertionMode((0, _rendernodeJs.INSERT_AROUND), this.selected());
    }
    // These are used by the exact keystrokes you think
    forceInsertInside() {
        this._forceInsertionMode((0, _rendernodeJs.INSERT_INSIDE), this.selected());
    }
    // JUST DOC THINGS
    insertSeparatorBeforeOrAfterSelectedLetter(newSeparator) {
        let s = this.selected();
        let inDocFormat = this._isLetterInDocFormatUpToLine(s);
        if (!inDocFormat) {
            this.defaultInsertFor(s, newSeparator);
            return;
        }
        if (s.getInsertionMode() == (0, _rendernodeJs.INSERT_AFTER)) {
            let w = s.getParent();
            // we always put the separator after the word
            // we are currently in, but sometimes we split that
            // word.
            if (!this._isLastChildOf(s, w)) {
                let nw = this.newWord();
                this._splitParentAfterAndPutIn(s, nw);
            }
            this._appendAfterAndSelect(newSeparator, w);
        } else {
            let w = s.getParent();
            if (!this._isFirstChildOf(s, w)) {
                let nw = this.newWord();
                this._splitParentBeforeAndPutIn(s, nw);
                this._prependBeforeAndSelect(newSeparator, nw);
            } else this._prependBeforeAndSelect(newSeparator, w);
        }
    }
    // doc elements get special insert methods I guess
    // I'm going to hold the line on keeping regexes out of this file
    insertLetterFromLine(newLetter, line) {
        if (line.getInsertionMode() == (0, _rendernodeJs.INSERT_INSIDE)) {
            if (this._isEmpty(line) || !_utilsJs.isWord(this._getFirstChildOf(line))) {
                let word = this.newWord();
                this._prependAsFirstChildOf(newLetter, word);
                this._prependAsFirstChildOf(word, line);
                newLetter.setSelected();
                return true;
            } else {
                let word = this._getFirstChildOf(line);
                this._prependAsFirstChildOf(newLetter, word);
                newLetter.setSelected();
                return true;
            }
        } else return this.defaultInsertFor(line, newLetter);
    }
    insertSeparatorFromLine(newSeparator, line) {
        return this.defaultInsertFor(line, newSeparator);
    }
    insertAsFirstChild(data) {
        data = this._conformData(data);
        let s = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        let newNode = s.prependChild(data);
        newNode.setSelected();
        return true;
    }
    selectCorrespondingLetterInPreviousLine(s) {
        let thisLine = _utilsJs.isLine(s) ? s : this.getEnclosingLineInSameDoc(s);
        // Okay in the weird/wrong event that we have a word inside a doc that's not
        // inside a line, we just... do our best.
        if (!thisLine) thisLine = _utilsJs.isWord(s) ? s : this.getEnclosingWordInSameDoc(s);
        if (!thisLine) // ok shit we just have a letter by itself inside a doc. Cool we can keep going.
        thisLine = s;
        let sib = this._getSiblingBefore(thisLine);
        if (!sib) return;
        if (!_utilsJs.isLine(sib)) {
            sib.setSelected();
            return;
        }
        if (this._isEmptyLineInDoc(sib)) {
            sib.setSelected();
            this._forceInsertionMode((0, _rendernodeJs.INSERT_INSIDE), sib);
            return;
        }
        if (this._isEmptyLineInDoc(s)) {
            let lf = this._getFirstLeafInside(sib);
            // we already know it has at least one child
            // or above would 
            lf.setSelected();
            this._forceInsertionMode((0, _rendernodeJs.INSERT_AFTER), lf);
            return;
        }
        let putBefore = this.isInsertBefore(s);
        let targetX = s.getLeftX();
        // I think the dot is 5 px
        if (putBefore) targetX -= 5;
        let c = this._getFirstLeafInside(sib);
        while(c && c.getLeftX() < targetX){
            let d = this._getLeafAfterFromSameLine(c);
            if (c == d) throw new Error("not supposed to happen");
            if (!d) break;
            else c = d;
        }
        if (!c) throw new Error("not supposed to happen");
        c.setSelected();
        if (putBefore) this._forceInsertionMode((0, _rendernodeJs.INSERT_BEFORE), c);
        return true;
    }
    selectCorrespondingLetterInNextLine(s) {
        let thisLine = _utilsJs.isLine(s) ? s : this.getEnclosingLineInSameDoc(s);
        // Okay in the weird/wrong event that we have a word inside a doc that's not
        // inside a line, we just... do our best.
        if (!thisLine) thisLine = _utilsJs.isWord(s) ? s : this.getEnclosingWordInSameDoc(s);
        if (!thisLine) // ok shit we just have a letter by itself inside a doc. Cool we can keep going.
        thisLine = s;
        let sib = this._getSiblingAfter(thisLine);
        if (!sib) return;
        if (!_utilsJs.isLine(sib)) {
            sib.setSelected();
            return;
        }
        if (this._isEmptyLineInDoc(sib)) {
            sib.setSelected();
            this._forceInsertionMode((0, _rendernodeJs.INSERT_INSIDE), sib);
            return;
        }
        if (this._isEmptyLineInDoc(s)) {
            let lf = this._getFirstLeafInside(sib);
            // we already know it has at least one child
            // or above would 
            lf.setSelected();
            this._forceInsertionMode((0, _rendernodeJs.INSERT_AFTER), lf);
            return;
        }
        let putBefore = this.isInsertBefore(s);
        let targetX = s.getLeftX();
        // I think the dot is 5 px
        if (putBefore) targetX -= 5;
        let c = this._getFirstLeafInside(sib);
        while(c && c.getLeftX() < targetX){
            let d = this._getLeafAfterFromSameLine(c);
            if (c == d) throw new Error("not supposed to happen");
            if (!d) break;
            else c = d;
        }
        if (!c) throw new Error("not supposed to happen");
        c.setSelected();
        if (putBefore) this._forceInsertionMode((0, _rendernodeJs.INSERT_BEFORE), c);
        return true;
    }
    findNextSiblingThatSatisfies(f) {
        while(this.selectNextSibling()){
            if (f((0, _systemstateJs.systemState).getGlobalSelectedNode())) return true;
        }
        return false;
    }
    getEnclosingLineInSameDoc(s) {
        while(s = s.getParent()){
            if (_utilsJs.isDoc(s)) // we don't want to stray out of the immediate doc.
            return null;
            if (_utilsJs.isLine(s)) return s;
        }
        return null;
    }
    getEnclosingWordInSameDoc(s) {
        while(s = s.getParent()){
            if (_utilsJs.isDoc(s)) // we don't want to stray out of the immediate doc.
            return null;
            if (_utilsJs.isWord(s)) return s;
        }
        return null;
    }
    _getEnclosingNexThatSatisfies(s, test) {
        while(s = s.getParent()){
            if (!s) return null;
            if (test(s)) return s;
        }
        return null;
    }
    // traversal
    _closeOff(s, test) {
        let obj = this._getEnclosingNexThatSatisfies(s, test);
        if (obj) {
            obj.setSelected();
            this._forceInsertionMode((0, _rendernodeJs.INSERT_AFTER), obj);
        }
    }
    closeOffWord(s) {
        this._closeOff(s, function(nex) {
            return _utilsJs.isWord(nex);
        });
    }
    closeOffDoc(s) {
        this._closeOff(s, function(nex) {
            return _utilsJs.isDoc(nex);
        });
    }
    closeOffOrg(s) {
        this._closeOff(s, function(nex) {
            return _utilsJs.isOrg(nex);
        });
    }
    closeOffLine(s) {
        this._closeOff(s, function(nex) {
            return _utilsJs.isLine(nex);
        });
    }
    _selectPreviousLeafImpl() {
        let first = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        while(!this.selectPreviousSibling()){
            let p = this.selectParent();
            if (!p || _utilsJs.isCodeContainer((0, _systemstateJs.systemState).getGlobalSelectedNode())) {
                first.setSelected();
                return false;
            }
        }
        while(!_utilsJs.isCodeContainer((0, _systemstateJs.systemState).getGlobalSelectedNode()) && this.selectLastChild());
        return true;
    }
    _selectNextLeafImpl() {
        let first = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        while(!this.selectNextSibling()){
            let p = this.selectParent();
            if (!p || _utilsJs.isCodeContainer((0, _systemstateJs.systemState).getGlobalSelectedNode())) {
                first.setSelected();
                return false;
            }
        }
        while(!_utilsJs.isCodeContainer((0, _systemstateJs.systemState).getGlobalSelectedNode()) && this.selectFirstChild());
        return true;
    }
    selectFirstLeaf() {
        let c = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        while(_utilsJs.isNexContainer(c) && c.hasChildren())c = c.getFirstChild();
        c.setSelected();
        return true;
    }
    // generic selection stuff
    selectLastChild() {
        let s = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        if (!_utilsJs.isNexContainer(s)) return false;
        let c = s.getLastChild();
        if (c) {
            c.setSelected();
            return true;
        }
        return false;
    }
    selectFirstChild() {
        let s = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        if (!_utilsJs.isNexContainer(s)) return false;
        let c = s.getFirstChild();
        if (c) {
            c.setSelected();
            return true;
        }
        return false;
    }
    selectNthChild(n) {
        let s = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        if (n >= s.numChildren()) return false;
        if (n < 0) return false;
        let c = s.getChildAt(n);
        if (!c) return false;
        c.setSelected();
        return true;
    }
    selectNextSibling() {
        let s = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        let p = s.getParent();
        if (!p) return false;
        let nextSib = p.getNextSibling(s);
        if (nextSib) {
            nextSib.setSelected();
            return true;
        }
        return false;
    }
    selectPreviousSibling() {
        let s = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        let p = s.getParent();
        if (!p) return false;
        let sib = p.getPreviousSibling(s);
        if (sib) {
            sib.setSelected();
            return true;
        }
        return false;
    }
    selectParent() {
        (0, _helpJs.doTutorial)("movement");
        let s = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        let p = s.getParent();
        if (!p) return false;
        p.setSelected();
        return true;
    }
    // CRUD operations
    // ALL THE INSERTS SHOULD BE REPLACED BY THIS
    insertAtSelectedObjInsertionPoint(node) {
        let s = this.selected();
        switch(s.getInsertionMode()){
            case 0, _rendernodeJs.INSERT_AFTER:
                return manipulator.insertAfterSelectedAndSelect(node);
            case 0, _rendernodeJs.INSERT_BEFORE:
                return manipulator.insertBeforeSelectedAndSelect(node);
            case 0, _rendernodeJs.INSERT_INSIDE:
                return manipulator.insertAsFirstChild(node);
            case 0, _rendernodeJs.INSERT_AROUND:
                if (node.getNex().isNexContainer()) return manipulator.wrapSelectedInAndSelect(node);
                else return manipulator.insertBeforeSelectedAndSelect(node);
        }
    }
    unroll(s) {
        let p = s.getParent();
        let c = null;
        let toselect = null;
        while(s.hasChildren()){
            c = s.getFirstChild();
            if (!toselect) toselect = c;
            p.insertChildBefore(c, s);
        }
        if (c) {
            p.removeChild(s);
            toselect.setSelected();
        }
    }
    wrapSelectedInAndSelect(wrapperNode) {
        let s = this.selected();
        let p = s.getParent();
        p.replaceChildWith(s, wrapperNode);
        wrapperNode.appendChild(s);
        wrapperNode.setSelected();
        return s;
    }
    appendAndSelect(data) {
        data = this._conformData(data);
        let s = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        let newNode = s.appendChild(data);
        newNode.setSelected();
        return true;
    }
    insertAfterSelected(data) {
        data = this._conformData(data);
        let s = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        let p = s.getParent();
        if (!p) return false;
        p.insertChildAfter(data, s);
        return true;
    }
    insertAfterSelectedAndSelect(data) {
        data = this._conformData(data);
        let r = this.insertAfterSelected(data) && this.selectNextSibling();
        return r;
    }
    insertBeforeSelected(data) {
        data = this._conformData(data);
        let s = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        let p = s.getParent();
        if (!p) return false;
        p.insertChildBefore(data, s);
        return true;
    }
    // used in evaluator.js
    insertBeforeSelectedAndSelect(data) {
        let r = this.insertBeforeSelected(data) && this.selectPreviousSibling();
        return r;
    }
    attemptToRemoveLastItemInCommand() {
        let p = (0, _systemstateJs.systemState).getGlobalSelectedNode().getParent();
        if (!p) return false;
        if (p.numChildren() == 1 && _utilsJs.isCodeContainer(p)) {
            if (!this.removeNex((0, _systemstateJs.systemState).getGlobalSelectedNode())) return false;
            p.setSelected();
            this._forceInsertionMode((0, _rendernodeJs.INSERT_INSIDE), p);
            return true;
        }
        return false;
    }
    // this is used by an old function that is only used by deferredcommand (maybe)
    removeSelectedAndSelectPreviousSibling() {
        let toDel = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        return this.attemptToRemoveLastItemInCommand() || (this.selectPreviousSibling() || this.selectParent()) && this.removeNex(toDel);
    }
    // used in browsereventresponsefunctions.js
    removeNex(toDel) {
        // toDel must not be a nex, has to be a RenderNode.
        if (!(toDel instanceof (0, _rendernodeJs.RenderNode))) throw new Error("need to delete the rendernode not the nex");
        let p = toDel.getParent();
        if (!p) return false;
        if (toDel.isSelected()) p.setSelected();
        p.removeChild(toDel);
        return true;
    }
    // used in evaluator.js
    replaceSelectedWith(nex) {
        nex = this._conformData(nex);
        let s = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        if (s === nex) return true; // trivially true
        let p = s.getParent(true);
        if (!p) return false;
        p.replaceChildWith(s, nex);
        nex.setSelected();
        return true;
    }
    replaceSelectedWithFirstChildOfSelected() {
        let s = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        let p = s.getParent(true);
        if (!p) return false;
        if (!(s.numChildren() == 1)) return false;
        let nex = s.getChildAt(0);
        p.replaceChildWith(s, nex);
        nex.setSelected();
        return true;
    }
    // split/join
    selectTopmostEnclosingLine() {
        let p = (0, _systemstateJs.systemState).getGlobalSelectedNode().getParent();
        if (!p) return false;
        while(!_utilsJs.isLine(p)){
            p = p.getParent();
            if (!p) return false;
        }
        while(_utilsJs.isLine(p)){
            let p2 = p.getParent();
            if (p2 && _utilsJs.isLine(p2)) p = p2;
            else break;
        }
        p.setSelected();
        return true;
    }
    moveRemainingSiblingsInto(nex) {
        nex = this._conformData(nex);
        let s = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        let p = s.getParent();
        if (!p) return false;
        if (p.getLastChild() == s) return true; // nothing to do
        let c;
        while(c = p.getChildAfter(s)){
            p.removeChild(c);
            nex.appendChild(c);
        }
    }
    // this takes all the selected node's right-hand
    // siblings and puts them inside nex, then
    // puts nex inside the selected node's grandparent
    // after the selected node's parent
    // i.e.
    // start:
    // ( ( a b c SEL d e f ) )
    // pass in nex
    // end
    // ( ( a b c SEL ) ( d e f ) )
    split(nex) {
        nex = this._conformData(nex);
        let s = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        let p = s.getParent();
        if (!p) return false;
        if (p.getLastChild() == s) return true; // nothing to do
        let c;
        while(c = p.getChildAfter(s)){
            p.removeChild(c);
            nex.appendChild(c);
        }
        let p2 = p.getParent();
        p2.insertChildAfter(nex, p);
        return true;
    }
    joinSelectedWithNextSibling() {
        // note that after joining, the thing
        // to select is the last thing in
        // the first of the two
        // things being joined.
        let s = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        let toSelect = s.getLastChild();
        if (!toSelect) return false;
        let p = s.getParent();
        if (!p) return false;
        let c = p.getChildAfter(s);
        if (!c) return false;
        let c2;
        while(c2 = c.removeFirstChild())s.appendChild(c2);
        // now that c is empty, delete it.
        p.removeChild(c);
        toSelect.setSelected();
        return true;
    }
    join(p, a, b) {
        p = this._conformData(p);
        a = this._conformData(a);
        b = this._conformData(b);
        let c;
        while(c = b.removeFirstChild())a.appendChild(c);
        // now that c is empty, delete it.
        p.removeChild(b);
        return true;
    }
    joinSelectedToNextSiblingIfSameType() {
        let s = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        let p = s.getParent();
        if (!p) return false;
        let c = p.getChildAfter(s);
        if (_utilsJs.isLine(s) && _utilsJs.isLine(c) || _utilsJs.isWord(s) && _utilsJs.isWord(c) || _utilsJs.isDoc(s) && _utilsJs.isDoc(c)) return this.joinSelectedWithNextSibling();
    }
    joinParentOfSelectedToNextSiblingIfSameType() {
        let s = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        let p = s.getParent();
        if (!p) return false;
        p.setSelected();
        this.joinSelectedToNextSiblingIfSameType();
    }
    joinToSiblingIfSame(s) {
        s = this._conformData(s);
        let p = s.getParent();
        if (!p) return false;
        let c = p.getChildAfter(s);
        if (_utilsJs.isLine(s) && _utilsJs.isLine(c) || _utilsJs.isWord(s) && _utilsJs.isWord(c) || _utilsJs.isDoc(s) && _utilsJs.isDoc(c)) return this.join(p, s, c);
        else return false;
    }
    /////////// KEYDISPATCHER STUFF BELOW THIS
    copyTextToSystemClipboard(txt) {
        navigator.permissions.query({
            name: "clipboard-write"
        }).then((result)=>{
            if (result.state == "granted" || result.state == "prompt") navigator.clipboard.writeText(txt);
        });
    }
    // used in keydispatcher.js
    doCut() {
        CLIPBOARD = (0, _systemstateJs.systemState).getGlobalSelectedNode().getNex();
        CLIPBOARD_INSERTION_MODE = (0, _systemstateJs.systemState).getGlobalSelectedNode().getInsertionMode();
        if (!(0, _testrecorderJs.isRecordingTest)()) this.copyTextToSystemClipboard(CLIPBOARD.prettyPrint());
        let x = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        this.selectPreviousSibling() || this.selectParent();
        this.removeNex(x);
    }
    // used in keydispatcher.js
    doSave() {
        let p = this.selected();
        while(!_utilsJs.isRoot(p)){
            if (_utilsJs.isCommand(p) && p.nex.getCommandText() == "save") return p;
            p = p.getParent();
        }
        // oops we need to insert one
        let cmd = this.newCommandWithText("save", true);
        cmd.nex.setVertical();
        let sym = this.newESymbolWithText((0, _systemstateJs.systemState).getDefaultFileName());
        sym.setSelected();
        cmd.appendChild(sym);
        if (p.numChildren() == 1) {
            cmd.appendChild(p.getChildAt(0));
            p.removeChildAt(0);
            p.appendChild(cmd);
        } else {
            let org = this.newOrg();
            while(p.hasChildren()){
                let c = p.getChildAt(0);
                org.appendChild(c);
            // these are render nodes not nexes.
            // This means that each one can only have one parent...
            // so we just have to append, we don't have to remove
            // it from the previous parent.
            }
            cmd.appendChild(org);
            p.appendChild(cmd);
        }
        return null;
    }
    // used in keydispatcher.js
    doCopy() {
        try {
            CLIPBOARD = (0, _systemstateJs.systemState).getGlobalSelectedNode().getNex().makeCopy();
            CLIPBOARD_INSERTION_MODE = (0, _systemstateJs.systemState).getGlobalSelectedNode().getInsertionMode();
            if (!(0, _testrecorderJs.isRecordingTest)()) this.copyTextToSystemClipboard(CLIPBOARD.prettyPrint());
        } catch (e) {
            if (_utilsJs.isFatalError(e)) {
                _utilsJs.beep();
                this.insertBeforeSelectedAndSelect(e);
            } else {
                if (e.message && e.message.indexOf("CONVERT TO EERROR:") == 0) {
                    let ee = (0, _eerrorJs.constructFatalError)(e.message.substr(18));
                    _utilsJs.beep();
                    this.insertBeforeSelectedAndSelect(ee);
                } else throw e;
            }
        }
    }
    // used in keydispatcher.js
    doPaste() {
        let s = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        try {
            let newNex = CLIPBOARD.makeCopy();
            newNex.setMutableRecursive(true);
            switch(s.getInsertionMode()){
                case 0, _rendernodeJs.INSERT_AFTER:
                    this.insertAfterSelectedAndSelect(newNex);
                    this.selected().setInsertionMode(CLIPBOARD_INSERTION_MODE);
                    break;
                case 0, _rendernodeJs.INSERT_BEFORE:
                case 0, _rendernodeJs.INSERT_AROUND:
                    this.insertBeforeSelectedAndSelect(newNex);
                    this.selected().setInsertionMode(CLIPBOARD_INSERTION_MODE);
                    break;
                case 0, _rendernodeJs.INSERT_INSIDE:
                    this.insertAsFirstChild(newNex);
                    this.selected().setInsertionMode(CLIPBOARD_INSERTION_MODE);
                    break;
            }
        } catch (e) {
            if (_utilsJs.isFatalError(e)) {
                _utilsJs.beep();
                this.insertBeforeSelectedAndSelect(e);
            } else {
                if (e.message && e.message.indexOf("CONVERT TO EERROR:") == 0) {
                    let ee = (0, _eerrorJs.constructFatalError)(e.message.substr(18));
                    _utilsJs.beep();
                    this.insertBeforeSelectedAndSelect(ee);
                } else throw e;
            }
        }
    }
    // CONTEXT
    getContextForNode(node) {
        let context = (0, _contexttypeJs.ContextType).COMMAND;
        let p = node.getParent();
        if (p) while((context = p.getNex().getContextType()) == (0, _contexttypeJs.ContextType).PASSTHROUGH)p = p.getParent();
        return context;
    }
    // CREATING STUFF DOWN HERE
    getMostRecentInsertedRenderNode() {
        return this.mostRecentInsertedRenderNode;
    }
    possiblyMakeImmutable(nex, context) {
        if (_utilsJs.isImmutableContext(context)) {
            let n = nex;
            if (n instanceof (0, _rendernodeJs.RenderNode)) n = n.getNex();
            n.setMutable(false);
        }
        return nex;
    }
    newDoc() {
        let d = null;
        try {
            d = (0, _docJs.constructDoc)();
        } catch (e) {
            if (_utilsJs.isFatalError(e)) return new (0, _rendernodeJs.RenderNode)(e);
            else throw e;
        }
        d.setMutable(true);
        let r = new (0, _rendernodeJs.RenderNode)(d);
        this.mostRecentInsertedRenderNode = r;
        (0, _helpJs.doTutorial)("doc");
        return r;
    }
    newWord() {
        let w = null;
        try {
            w = (0, _wordJs.constructWord)();
        } catch (e) {
            if (_utilsJs.isFatalError(e)) return new (0, _rendernodeJs.RenderNode)(e);
            else throw e;
        }
        w.setMutable(true);
        let r = new (0, _rendernodeJs.RenderNode)(w);
        this.mostRecentInsertedRenderNode = r;
        return r;
    }
    newLine() {
        let line = null;
        try {
            line = (0, _lineJs.constructLine)();
        } catch (e) {
            if (_utilsJs.isFatalError(e)) return new (0, _rendernodeJs.RenderNode)(e);
            else throw e;
        }
        line.setMutable(true);
        let r = new (0, _rendernodeJs.RenderNode)(line);
        this.mostRecentInsertedRenderNode = r;
        return r;
    }
    // public
    newLambda() {
        let l = null;
        try {
            l = (0, _lambdaJs.constructLambda)();
        } catch (e) {
            if (_utilsJs.isFatalError(e)) return new (0, _rendernodeJs.RenderNode)(e);
            else throw e;
        }
        l.setMutable(true);
        let r = new (0, _rendernodeJs.RenderNode)(l);
        this.mostRecentInsertedRenderNode = r;
        r.possiblyStartMainEditor();
        (0, _helpJs.doTutorial)("make-lambda");
        return r;
    }
    newESymbolWithText(txt) {
        let e = null;
        try {
            e = (0, _esymbolJs.constructESymbol)(txt);
        } catch (err) {
            if (_utilsJs.isFatalError(err)) return new (0, _rendernodeJs.RenderNode)(err);
            else throw err;
        }
        e.setMutable(true);
        let r = new (0, _rendernodeJs.RenderNode)(e);
        this.mostRecentInsertedRenderNode = r;
        r.possiblyStartMainEditor();
        (0, _helpJs.doTutorial)("make-symbol");
        return r;
    }
    newESymbol() {
        let e = null;
        try {
            e = (0, _esymbolJs.constructESymbol)();
        } catch (err) {
            if (_utilsJs.isFatalError(err)) return new (0, _rendernodeJs.RenderNode)(err);
            else throw err;
        }
        e.setMutable(true);
        let r = new (0, _rendernodeJs.RenderNode)(e);
        this.mostRecentInsertedRenderNode = r;
        r.possiblyStartMainEditor();
        (0, _helpJs.doTutorial)("make-symbol");
        return r;
    }
    newCommandWithText(txt, skipEditor) {
        let c = null;
        try {
            c = (0, _commandJs.constructCommand)(txt);
        } catch (e) {
            if (_utilsJs.isFatalError(e)) return new (0, _rendernodeJs.RenderNode)(e);
            else throw e;
        }
        c.setMutable(true);
        let r = new (0, _rendernodeJs.RenderNode)(c);
        this.mostRecentInsertedRenderNode = r;
        if (!skipEditor) r.possiblyStartMainEditor();
        (0, _helpJs.doTutorial)("make-command");
        return r;
    }
    // public
    newCommand() {
        let c = null;
        try {
            c = (0, _commandJs.constructCommand)();
        } catch (e) {
            if (_utilsJs.isFatalError(e)) return new (0, _rendernodeJs.RenderNode)(e);
            else throw e;
        }
        c.setMutable(true);
        let r = new (0, _rendernodeJs.RenderNode)(c);
        this.mostRecentInsertedRenderNode = r;
        r.possiblyStartMainEditor();
        (0, _helpJs.doTutorial)("make-command");
        return r;
    }
    newBool() {
        let b = null;
        try {
            b = (0, _boolJs.constructBool)();
        } catch (e) {
            if (_utilsJs.isFatalError(e)) return e;
            else throw e;
        }
        b.setMutable(true);
        let r = new (0, _rendernodeJs.RenderNode)(b);
        this.mostRecentInsertedRenderNode = r;
        r.possiblyStartMainEditor();
        (0, _helpJs.doTutorial)("make-boolean");
        return r;
    }
    newIntegerWithValue(v) {
        let i = null;
        try {
            i = (0, _integerJs.constructInteger)(Number(v));
        } catch (err) {
            if (_utilsJs.isFatalError(err)) return new (0, _rendernodeJs.RenderNode)(err);
            else throw err;
        }
        i.setMutable(true);
        let r = new (0, _rendernodeJs.RenderNode)(i);
        this.mostRecentInsertedRenderNode = r;
        r.possiblyStartMainEditor();
        (0, _helpJs.doTutorial)("make-integer");
        return r;
    }
    newInteger() {
        let i = null;
        try {
            i = (0, _integerJs.constructInteger)();
        } catch (err) {
            if (_utilsJs.isFatalError(err)) return new (0, _rendernodeJs.RenderNode)(err);
            else throw err;
        }
        i.setMutable(true);
        let r = new (0, _rendernodeJs.RenderNode)(i);
        this.mostRecentInsertedRenderNode = r;
        r.possiblyStartMainEditor();
        (0, _helpJs.doTutorial)("make-integer");
        return r;
    }
    newEString() {
        let e = null;
        try {
            e = (0, _estringJs.constructEString)();
        } catch (err) {
            if (_utilsJs.isFatalError(err)) return new (0, _rendernodeJs.RenderNode)(err);
            else throw err;
        }
        e.setMutable(true);
        let r = new (0, _rendernodeJs.RenderNode)(e);
        this.mostRecentInsertedRenderNode = r;
        r.possiblyStartMainEditor();
        (0, _helpJs.doTutorial)("make-string");
        return r;
    }
    newFloat() {
        let f = null;
        try {
            f = (0, _floatJs.constructFloat)();
        } catch (err) {
            if (_utilsJs.isFatalError(err)) return new (0, _rendernodeJs.RenderNode)(err);
            else throw err;
        }
        f.setMutable(true);
        let r = new (0, _rendernodeJs.RenderNode)(f);
        this.mostRecentInsertedRenderNode = r;
        r.possiblyStartMainEditor();
        (0, _helpJs.doTutorial)("make-float");
        return r;
    }
    newInstantiator() {
        let i = null;
        try {
            i = (0, _instantiatorJs.constructInstantiator)();
        } catch (err) {
            if (_utilsJs.isFatalError(err)) return new (0, _rendernodeJs.RenderNode)(err);
            else throw err;
        }
        i.setMutable(true);
        let r = new (0, _rendernodeJs.RenderNode)(i);
        this.mostRecentInsertedRenderNode = r;
        r.possiblyStartMainEditor();
        (0, _helpJs.doTutorial)("make-instantiator");
        return r;
    }
    newNil() {
        let n = null;
        try {
            n = (0, _nilJs.constructNil)();
        } catch (err) {
            if (_utilsJs.isFatalError(err)) return new (0, _rendernodeJs.RenderNode)(err);
            else throw err;
        }
        n.setMutable(true);
        let r = new (0, _rendernodeJs.RenderNode)(n);
        this.mostRecentInsertedRenderNode = r;
        return r;
    }
    newDeferredCommand() {
        let e = null;
        try {
            e = (0, _deferredcommandJs.constructDeferredCommand)();
        } catch (err) {
            if (_utilsJs.isFatalError(err)) return new (0, _rendernodeJs.RenderNode)(err);
            else throw err;
        }
        e.setMutable(true);
        let r = new (0, _rendernodeJs.RenderNode)(e);
        this.mostRecentInsertedRenderNode = r;
        r.possiblyStartMainEditor();
        (0, _helpJs.doTutorial)("make-deferred-command");
        return r;
    }
    newOrg() {
        let o = null;
        try {
            o = (0, _orgJs.constructOrg)();
        } catch (err) {
            if (_utilsJs.isFatalError(err)) return new (0, _rendernodeJs.RenderNode)(err);
            else throw err;
        }
        o.setMutable(true);
        let r = new (0, _rendernodeJs.RenderNode)(o);
        this.mostRecentInsertedRenderNode = r;
        (0, _helpJs.doTutorial)("make-org");
        return r;
    }
    newSeparator(txt) {
        let s = null;
        try {
            s = (0, _separatorJs.constructSeparator)(txt);
        } catch (err) {
            if (_utilsJs.isFatalError(err)) return new (0, _rendernodeJs.RenderNode)(err);
            else throw err;
        }
        s.setMutable(true);
        let r = new (0, _rendernodeJs.RenderNode)(s);
        this.mostRecentInsertedRenderNode = r;
        return r;
    }
    newLetter(txt) {
        let l = null;
        try {
            l = (0, _letterJs.constructLetter)(txt);
        } catch (err) {
            if (_utilsJs.isFatalError(err)) return new (0, _rendernodeJs.RenderNode)(err);
            else throw err;
        }
        l.setMutable(true);
        let r = new (0, _rendernodeJs.RenderNode)(l);
        this.mostRecentInsertedRenderNode = r;
        return r;
    }
    newWavetable() {
        let l = null;
        try {
            l = (0, _wavetableJs.constructWavetable)();
        } catch (err) {
            if (_utilsJs.isFatalError(err)) return new (0, _rendernodeJs.RenderNode)(err);
            else throw err;
        }
        l.setMutable(true);
        let r = new (0, _rendernodeJs.RenderNode)(l);
        this.mostRecentInsertedRenderNode = r;
        return r;
    }
    // this is garbage crap
    newNexForKey(key) {
        switch(key){
            case "~":
                return this.newCommand();
            case "!":
                return this.newBool();
            case "@":
                return this.newESymbol();
            case "#":
                return this.newInteger();
            case "$":
                return this.newEString();
            case "%":
                return this.newFloat();
            case "^":
                return this.newNil();
            case "&":
                return this.newLambda();
            case "*":
                return this.newDeferredCommand();
            case "(":
                return this.newOrg();
            case "{":
                return this.newDoc();
            case "[":
                return this.newLine();
            case "<":
                return this.newWord();
            case "_":
                return this.newWavetable();
        }
        // either letter or separator
        let letterRegex = /^[a-zA-Z0-9']$/;
        let isSeparator = !letterRegex.test(key);
        if (isSeparator) return this.newSeparator(key);
        else return this.newLetter(key);
    }
}
const manipulator = new Manipulator();

},{"./utils.js":"bIDtH","./systemstate.js":"19Hkn","./rendernode.js":"4dhWw","./nex/nex.js":"gNpCL","./nex/root.js":"8BOcG","./contexttype.js":"7dDRe","./nex/eerror.js":"4Xsbj","./nex/lambda.js":"1mCM0","./nex/esymbol.js":"cO7Ty","./nex/command.js":"6AUMZ","./nex/bool.js":"3MKly","./nex/doc.js":"fb3ea","./nex/estring.js":"bL0nm","./nex/word.js":"a7zjn","./nex/wavetable.js":"6Cspq","./nex/line.js":"bwNVL","./nex/org.js":"28wYz","./nex/float.js":"f95Ws","./nex/integer.js":"cjEX0","./nex/deferredcommand.js":"inpbA","./nex/letter.js":"keNY2","./nex/separator.js":"egKmR","./nex/nil.js":"amOKC","./nex/instantiator.js":"LvfQo","./globalappflags.js":"1FpbG","./testrecorder.js":"eXYfk","./help.js":"g6Yqo","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"fb3ea":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Doc", ()=>Doc);
parcelHelpers.export(exports, "constructDoc", ()=>constructDoc);
var _utilsJs = require("../utils.js");
var _nexcontainerJs = require("./nexcontainer.js");
var _eerrorJs = require("./eerror.js");
var _contexttypeJs = require("../contexttype.js");
var _globalappflagsJs = require("../globalappflags.js");
var _evaluatorJs = require("../evaluator.js");
var _globalconstantsJs = require("../globalconstants.js");
var _heapJs = require("../heap.js");
/**
 * Represents a document with text in it.
 */ class Doc extends (0, _nexcontainerJs.NexContainer) {
    constructor(){
        super();
        this.pfstring = new (0, _heapJs.HeapString)();
        this.setVertical();
    }
    toString(version) {
        if (version == "v2") return this.toStringV2();
        return "{" + super.childrenToString() + "}";
    }
    rootLevelPostEvaluationStep() {
        this.setMutable(false);
    }
    toStringV2() {
        return `[${this.toStringV2Literal()}doc]${this.toStringV2PrivateDataSection()}${this.listStartV2()}${this.toStringV2TagList()}${super.childrenToString("v2")}${this.listEndV2()}`;
    }
    toggleDir() {}
    setHorizontal() {}
    prettyPrintInternal(lvl, hdir) {
        return this.standardListPrettyPrint(lvl, "[doc]", hdir);
    }
    setPfont(pfstring) {
        this.pfstring.set(pfstring);
        this.doForEachChild(function(c) {
            c.setPfont(pfstring);
        });
    }
    serializePrivateData(data) {
        return `${this.getCurrentStyle()}`;
    }
    deserializePrivateData(data) {
        this.setCurrentStyle(data);
    }
    insertChildAt(c, i) {
        if (this.pfstring.get()) c.setPfont(this.pfstring.get());
        super.insertChildAt(c, i);
    }
    getTypeName() {
        return "-doc-";
    }
    makeCopy(shallow) {
        let r = constructDoc();
        this.copyChildrenTo(r, shallow);
        this.copyFieldsTo(r);
        return r;
    }
    getValueAsString() {
        let s = "";
        let index = 0;
        this.doForEachChild((c)=>{
            if (c.getTypeName() == "-line-") {
                if (index > 0) s += "\n";
                s += c.getValueAsString();
            } else throw (0, _eerrorJs.constructFatalError)(`Cannot convert doc to string, incorrect doc format (at line ${index}, has ${c.debugString()}). Sorry!`);
            index++;
        });
        return s;
    }
    getContextType() {
        if (this.isMutable()) return (0, _contexttypeJs.ContextType).DOC;
        else return (0, _contexttypeJs.ContextType).IMMUTABLE_DOC;
    }
    renderInto(renderNode, renderFlags, withEditor) {
        let domNode = renderNode.getDomNode();
        super.renderInto(renderNode, renderFlags, withEditor);
        domNode.classList.add("doc");
        domNode.classList.add("data");
        domNode.classList.add("newdoc");
    }
    /*
	should be in the superclass (nexcontainer) but it creates a circular dependency graph somehow
	*/ evaluate(env) {
        if (this.mutable) {
            // shallow copy, then evaluate children.
            let listcopy = this.makeCopy(true);
            let iterator = null;
            this.doForEachChild(function(child) {
                let newchild = (0, _evaluatorJs.evaluateNexSafely)(child, env);
                // we don't throw exceptions, we just embed them - this isn't a function.
                iterator = listcopy.fastAppendChildAfter(newchild, iterator);
            });
            listcopy.setMutable(false);
            return listcopy;
        } else return this;
    }
    setMutable(val) {
        super.setMutable(val);
        // make doc-type children also have the same mutability
        this.doForEachChild((c)=>{
            if (_utilsJs.isDocElement(c)) c.setMutable(val);
        });
    }
    getDefaultHandler() {
        return "docDefault";
    }
    getEventTable(context) {
        return {
            "ShiftSpace": "do-nothing",
            "Backspace": "remove-selected-and-select-previous-sibling-if-empty",
            "!": "JUST_USE_DEFAULT",
            "@": "JUST_USE_DEFAULT",
            "#": "JUST_USE_DEFAULT",
            "$": "JUST_USE_DEFAULT",
            "%": "JUST_USE_DEFAULT",
            "^": "JUST_USE_DEFAULT",
            "&": "JUST_USE_DEFAULT",
            "*": "JUST_USE_DEFAULT",
            "(": "JUST_USE_DEFAULT",
            "[": "JUST_USE_DEFAULT",
            "{": "JUST_USE_DEFAULT",
            "<": "JUST_USE_DEFAULT",
            "_": "JUST_USE_DEFAULT"
        };
    }
    memUsed() {
        return super.memUsed() + (0, _heapJs.heap).sizeDoc() + this.pfstring.memUsed();
    }
}
function constructDoc() {
    if (!(0, _heapJs.heap).requestMem((0, _heapJs.heap).sizeDoc())) throw (0, _eerrorJs.constructFatalError)(`OUT OF MEMORY: cannot allocate Doc.
stats: ${(0, _heapJs.heap).stats()}`);
    return (0, _heapJs.heap).register(new Doc());
}

},{"../utils.js":"bIDtH","./nexcontainer.js":"e7Ky3","./eerror.js":"4Xsbj","../contexttype.js":"7dDRe","../globalappflags.js":"1FpbG","../evaluator.js":"1TNlN","../globalconstants.js":"3d62t","../heap.js":"67mlv","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"a7zjn":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Word", ()=>Word);
parcelHelpers.export(exports, "constructWord", ()=>constructWord);
var _utilsJs = require("../utils.js");
var _nexcontainerJs = require("./nexcontainer.js");
var _contexttypeJs = require("../contexttype.js");
var _globalappflagsJs = require("../globalappflags.js");
var _evaluatorJs = require("../evaluator.js");
var _heapJs = require("../heap.js");
var _globalconstantsJs = require("../globalconstants.js");
var _eerrorJs = require("./eerror.js");
class Word extends (0, _nexcontainerJs.NexContainer) {
    constructor(){
        super();
        this.pfstring = new (0, _heapJs.HeapString)();
        this.setHorizontal();
    }
    getTypeName() {
        return "-word-";
    }
    rootLevelPostEvaluationStep() {
        this.setMutable(false);
    }
    makeCopy(shallow) {
        let r = constructWord();
        this.copyChildrenTo(r, shallow);
        this.copyFieldsTo(r);
        return r;
    }
    toString(version) {
        if (version == "v2") return this.toStringV2();
        return "(" + super.childrenToString() + ")";
    }
    toStringV2() {
        return `[${this.toStringV2Literal()}word]${this.toStringV2PrivateDataSection()}${this.listStartV2()}${this.toStringV2TagList()}${super.childrenToString("v2")}${this.listEndV2()}`;
    }
    prettyPrintInternal(lvl, hdir) {
        return this.standardListPrettyPrint(lvl, "[word]", hdir);
    }
    setMutable(val) {
        super.setMutable(val);
        // make doc-type children also have the same mutability
        this.doForEachChild((c)=>{
            if (_utilsJs.isDocElement(c)) c.setMutable(val);
        });
    }
    toggleDir() {}
    setVertical() {}
    getContextType() {
        if (this.isMutable()) return (0, _contexttypeJs.ContextType).WORD;
        else return (0, _contexttypeJs.ContextType).IMMUTABLE_WORD;
    }
    getValueAsString() {
        let s = "";
        this.doForEachChild(function(c) {
            if (!(c.getTypeName() == "-letter-")) throw (0, _eerrorJs.constructFatalError)("cannot convert word to string, invalid format");
            s += c.getText();
        });
        return s;
    }
    getKeyFunnel() {
        return new WordKeyFunnel(this);
    }
    serializePrivateData(data) {
        return `${this.getCurrentStyle()}`;
    }
    deserializePrivateData(data) {
        this.setCurrentStyle(data);
    }
    renderInto(renderNode, renderFlags, withEditor) {
        let domNode = renderNode.getDomNode();
        let wordspan = null;
        super.renderInto(renderNode, renderFlags, withEditor);
        domNode.classList.add("word");
        domNode.classList.add("data");
        if (renderFlags & (0, _globalconstantsJs.RENDER_FLAG_INSERT_AFTER)) domNode.classList.add("rightinsert");
        else if (renderFlags & (0, _globalconstantsJs.RENDER_FLAG_INSERT_BEFORE)) domNode.classList.add("leftinsert");
        else if (renderFlags & (0, _globalconstantsJs.RENDER_FLAG_INSERT_AROUND)) domNode.classList.add("topinsert");
        else if (renderFlags & (0, _globalconstantsJs.RENDER_FLAG_INSERT_INSIDE)) domNode.classList.add("bottominsert");
        domNode.classList.add("newword");
    }
    setPfont(pfstring) {
        this.pfstring.set(pfstring);
        this.doForEachChild(function(c) {
            c.setPfont(pfstring);
        });
    }
    insertChildAt(c, i) {
        if (this.pfstring.get()) c.setPfont(this.pfstring.get());
        super.insertChildAt(c, i);
    }
    /*
	should be in the superclass (nexcontainer) but it creates a circular dependency graph somehow
	*/ evaluate(env) {
        if (this.mutable) {
            // shallow copy, then evaluate children.
            let listcopy = this.makeCopy(true);
            let iterator = null;
            this.doForEachChild(function(child) {
                let newchild = (0, _evaluatorJs.evaluateNexSafely)(child, env);
                // we don't throw exceptions, we just embed them - this isn't a function.
                iterator = listcopy.fastAppendChildAfter(newchild, iterator);
            });
            listcopy.setMutable(false);
            return listcopy;
        } else return this;
    }
    getDefaultHandler() {
        return "wordDefault";
    }
    getEventTable(context) {
        return {
            "!": "JUST_USE_DEFAULT",
            "@": "JUST_USE_DEFAULT",
            "#": "JUST_USE_DEFAULT",
            "$": "JUST_USE_DEFAULT",
            "%": "JUST_USE_DEFAULT",
            "^": "JUST_USE_DEFAULT",
            "&": "JUST_USE_DEFAULT",
            "*": "JUST_USE_DEFAULT",
            "(": "JUST_USE_DEFAULT",
            "[": "JUST_USE_DEFAULT",
            "{": "JUST_USE_DEFAULT",
            "<": "JUST_USE_DEFAULT",
            "_": "JUST_USE_DEFAULT"
        };
    }
    memUsed() {
        return super.memUsed() + (0, _heapJs.heap).sizeWord();
    }
}
function constructWord() {
    if (!(0, _heapJs.heap).requestMem((0, _heapJs.heap).sizeWord())) throw new (0, _eerrorJs.constructFatalError)(`OUT OF MEMORY: cannot allocate Word.
stats: ${(0, _heapJs.heap).stats()}`);
    return (0, _heapJs.heap).register(new Word());
}

},{"../utils.js":"bIDtH","./nexcontainer.js":"e7Ky3","../contexttype.js":"7dDRe","../globalappflags.js":"1FpbG","../evaluator.js":"1TNlN","../heap.js":"67mlv","../globalconstants.js":"3d62t","./eerror.js":"4Xsbj","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"bwNVL":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Line", ()=>Line);
parcelHelpers.export(exports, "constructLine", ()=>constructLine);
var _utilsJs = require("../utils.js");
var _contexttypeJs = require("../contexttype.js");
var _nexcontainerJs = require("./nexcontainer.js");
var _eerrorJs = require("./eerror.js");
var _globalappflagsJs = require("../globalappflags.js");
var _globalconstantsJs = require("../globalconstants.js");
var _evaluatorJs = require("../evaluator.js");
var _heapJs = require("../heap.js");
/**
 * Represents a line in a document.
 * @extends NexContainer
 */ class Line extends (0, _nexcontainerJs.NexContainer) {
    /**
	 * Creates a line.
	 */ constructor(){
        super();
        this.pfstring = new (0, _heapJs.HeapString)();
        this.setHorizontal();
    }
    rootLevelPostEvaluationStep() {
        this.setMutable(false);
    }
    /** @override */ getTypeName() {
        return "-line-";
    }
    makeCopy(shallow) {
        let r = constructLine();
        this.copyChildrenTo(r, shallow);
        this.copyFieldsTo(r);
        return r;
    }
    toString(version) {
        if (version == "v2") return this.toStringV2();
        return "[" + super.childrenToString() + "]";
    }
    toStringV2() {
        return `[${this.toStringV2Literal()}line]${this.toStringV2PrivateDataSection()}${this.listStartV2()}${this.toStringV2TagList()}${super.childrenToString("v2")}${this.listEndV2()}`;
    }
    prettyPrintInternal(lvl, hdir) {
        return this.standardListPrettyPrint(lvl, "[line]", hdir);
    }
    serializePrivateData(data) {
        return `${this.getCurrentStyle()}`;
    }
    deserializePrivateData(data) {
        this.setCurrentStyle(data);
    }
    setMutable(val) {
        super.setMutable(val);
        // make doc-type children also have the same mutability
        this.doForEachChild((c)=>{
            if (_utilsJs.isDocElement(c)) c.setMutable(val);
        });
    }
    toggleDir() {}
    setVertical() {}
    getValueAsString() {
        let s = "";
        this.doForEachChild((c)=>{
            if (c.getTypeName() == "-letter-") s += c.getText();
            else if (c.getTypeName() == "-separator-") s += c.getText();
            else if (c.getTypeName() == "-newline-") s += "\n";
            else if (c.getTypeName() == "-word-") s += c.getValueAsString();
            else throw new (0, _eerrorJs.EError)("cannot convert line to string, invalid format");
        });
        return s;
    }
    getKeyFunnelForContext(context) {
        if (context == KeyContext.DOC) return new LineKeyFunnel(this);
        return null;
    }
    setPfont(pfstring) {
        this.pfstring.set(pfstring);
        this.doForEachChild(function(c) {
            c.setPfont(pfstring);
        });
    }
    insertChildAt(c, i) {
        if (this.pfstring.get()) c.setPfont(this.pfstring.get());
        super.insertChildAt(c, i);
    }
    getContextType() {
        if (this.isMutable()) return (0, _contexttypeJs.ContextType).LINE;
        else return (0, _contexttypeJs.ContextType).IMMUTABLE_LINE;
    }
    // deprecated
    getKeyFunnel() {
        return new LineKeyFunnel(this);
    }
    renderInto(renderNode, renderFlags, withEditor) {
        let domNode = renderNode.getDomNode();
        super.renderInto(renderNode, renderFlags, withEditor);
        domNode.classList.add("line");
        domNode.classList.add("data");
        if (renderFlags & (0, _globalconstantsJs.RENDER_FLAG_INSERT_AFTER)) domNode.classList.add("rightinsert");
        else if (renderFlags & (0, _globalconstantsJs.RENDER_FLAG_INSERT_BEFORE)) domNode.classList.add("leftinsert");
        else if (renderFlags & (0, _globalconstantsJs.RENDER_FLAG_INSERT_AROUND)) domNode.classList.add("topinsert");
        else if (renderFlags & (0, _globalconstantsJs.RENDER_FLAG_INSERT_INSIDE)) domNode.classList.add("bottominsert");
        // weird
        let hasDocChild = false;
        for(let i = 0; i < this.numChildren(); i++){
            let c = this.getChildAt(i);
            if (_utilsJs.isDocElement(c)) {
                hasDocChild = true;
                break;
            }
        }
        if (!(renderFlags & (0, _globalconstantsJs.RENDER_FLAG_EXPLODED)) && !hasDocChild) domNode.classList.add("emptyline");
        else domNode.classList.remove("emptyline");
        domNode.classList.add("newversionofline");
    }
    /*
	should be in the superclass (nexcontainer) but it creates a circular dependency graph somehow
	*/ evaluate(env) {
        if (this.mutable) {
            // shallow copy, then evaluate children.
            let listcopy = this.makeCopy(true);
            let iterator = null;
            this.doForEachChild(function(child) {
                let newchild = (0, _evaluatorJs.evaluateNexSafely)(child, env);
                // we don't throw exceptions, we just embed them - this isn't a function.
                iterator = listcopy.fastAppendChildAfter(newchild, iterator);
            });
            listcopy.setMutable(false);
            return listcopy;
        } else return this;
    }
    getDefaultHandler() {
        return "lineDefault";
    }
    getEventTable(context) {
        return {
            // In a doc context, lines act differently -- remember
            // that an empty line has no letter or separator in it
            // to select so we can't isolate all the weirdness
            // to the letter and separator nexes.
            "ArrowUp": "move-up-for-line",
            "ArrowLeft": "move-left-for-line",
            "ArrowDown": "move-down-for-line",
            "ArrowRight": "move-right-for-line",
            "Enter": "do-line-break-or-eval",
            "Backspace": "delete-line",
            "!": "JUST_USE_DEFAULT",
            "@": "JUST_USE_DEFAULT",
            "#": "JUST_USE_DEFAULT",
            "$": "JUST_USE_DEFAULT",
            "%": "JUST_USE_DEFAULT",
            "^": "JUST_USE_DEFAULT",
            "&": "JUST_USE_DEFAULT",
            "*": "JUST_USE_DEFAULT",
            "(": "JUST_USE_DEFAULT",
            "[": "JUST_USE_DEFAULT",
            "{": "JUST_USE_DEFAULT",
            "<": "JUST_USE_DEFAULT",
            "_": "JUST_USE_DEFAULT"
        };
    }
    memUsed() {
        return (0, _heapJs.heap).sizeLine();
    }
}
function constructLine() {
    if (!(0, _heapJs.heap).requestMem((0, _heapJs.heap).sizeLine())) throw new (0, _eerrorJs.EError)(`OUT OF MEMORY: cannot allocate Line.
stats: ${(0, _heapJs.heap).stats()}`);
    return (0, _heapJs.heap).register(new Line());
}

},{"../utils.js":"bIDtH","../contexttype.js":"7dDRe","./nexcontainer.js":"e7Ky3","./eerror.js":"4Xsbj","../globalappflags.js":"1FpbG","../globalconstants.js":"3d62t","../evaluator.js":"1TNlN","../heap.js":"67mlv","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"inpbA":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "DeferredCommand", ()=>DeferredCommand);
parcelHelpers.export(exports, "constructDeferredCommand", ()=>constructDeferredCommand);
var _utilsJs = require("../utils.js");
var _deferredvalueJs = require("./deferredvalue.js");
var _commandJs = require("./command.js");
var _gcJs = require("../gc.js");
var _editorsJs = require("../editors.js");
var _globalconstantsJs = require("../globalconstants.js");
var _asyncfunctionsJs = require("../asyncfunctions.js");
var _commandfunctionsJs = require("../commandfunctions.js");
var _eventqueuedispatcherJs = require("../eventqueuedispatcher.js");
var _argevaluatorJs = require("../argevaluator.js");
var _heapJs = require("../heap.js");
var _eerrorJs = require("./eerror.js");
class DeferredCommand extends (0, _commandJs.Command) {
    constructor(val){
        super(val);
        // note, you could have code that infinitely queues up unfinished
        // deferred commands, meaning that you could run out of memory
        // with things like the runInfo -- so this needs to be looked at.
        this._activated = false;
        this._finished = false;
        this._cancelled = false;
        this._activationEnv = null;
        this._returnedValue = null;
        this._runInfo = null;
        (0, _gcJs.gc).register(this);
    }
    isActivated() {
        return this._activated;
    }
    isFinished() {
        return this._finished;
    }
    isSet() {
        return true;
    }
    toString(version) {
        if (version == "v2") return this.toStringV2();
        return `*(${super.childrenToString()}*)`;
    }
    toStringV2() {
        return `*${this.toStringV2Literal()}${this.toStringV2PrivateDataSection()}${this.listStartV2()}${this.toStringV2TagList()}${super.childrenToString("v2")}${this.listEndV2()}`;
    }
    deserializePrivateData(data) {
        if (data) this.setCommandText(data);
    }
    serializePrivateData() {
        let r = this.getCommandText();
        if (!r) return "";
        return r;
    }
    prettyPrintInternal(lvl, hdir) {
        return this.standardListPrettyPrint(lvl, "*", hdir);
    }
    getTypeName() {
        return "-deferredcommand-";
    }
    makeCopy(shallow) {
        let r = constructDeferredCommand();
        this.copyChildrenTo(r, shallow);
        this.copyFieldsTo(r);
        return r;
    }
    copyFieldsTo(nex) {
        super.copyFieldsTo(nex);
    }
    evaluate(executionEnv) {
        // we have to make a copy, we can't store state with code in a lambda etc.
        // to copy, we follow the same algorithm as argContainer --
        // we do a shallow copy but then children are not copied.
        let copyOfSelf = this.makeCopy(true);
        for(let i = 0; i < this.numChildren(); i++)copyOfSelf.appendChild(this.getChildAt(i));
        // it's a bit messy that runinfo is initialized when we evaluate.
        // should this happen when activated?
        let dv = (0, _deferredvalueJs.constructDeferredValue)();
        copyOfSelf._runInfo = copyOfSelf.createRunInfo(executionEnv);
        // make it so the arg container in the runinfo updates the actual
        // children of the command copy so they can be rendered to the screen.
        // this would change if I created a separate/different object whose
        // purpose is to display to the user the in-process computation of the
        // deferred command
        copyOfSelf._runInfo.argContainer.makeUpdating(copyOfSelf);
        copyOfSelf._returnedValue = dv;
        dv.appendChild(copyOfSelf);
        let afg = new (0, _asyncfunctionsJs.DeferredCommandActivationFunctionGenerator)(copyOfSelf, executionEnv);
        dv.set(afg);
        dv.activate();
        // I'm returning dv/_returnedValue so I don't need to (and shouldn't) ref count it
        return dv;
    }
    activate(executionEnv) {
        (0, _heapJs.heap).addEnvReference(executionEnv);
        this._activationEnv = executionEnv;
        this._activated = true;
        this.tryToFinish();
    }
    tryToFinish() {
        if (this._cancelled) return;
        if (this._returnedValue.wasFreed) return;
        let evaluationResult = null;
        try {
            evaluationResult = this._runInfo.argEvaluator.evaluatePotentiallyDeferredArgs(this);
        /*
			What should happen is the arg evaluator will try to evaluate the args, and return an enum instead of a boolean
			possible values:
			1. finished -- evaluate the function and finish the returned dv with whatever it returns
			2. settling -- one of the args settled but didn't finish, evaluate the function and settle the returned dv with whatever it returns
			3. waiting -- don't do anything

			note also that evaluating a settled (but not finished) dv returns the same dv,
			but when evaluating the function, we do want to pass in the contents of the settled dv.

			also: open question, if an arg settles, do we evaluate the args after it? The current logic stops evaluating args
			when it gets the first dv -- this is so that things like "begin" work intuitively if you put deferred functions
			in them. But if one of the deferred functions settles, do we progress?
			*/ } catch (e) {
            if (_utilsJs.isFatalError(e)) this.finish(e);
            else throw e;
        }
        if (evaluationResult == (0, _argevaluatorJs.ARGRESULT_SETTLED) || evaluationResult == (0, _argevaluatorJs.ARGRESULT_FINISHED)) {
            let executionResult = (0, _commandfunctionsJs.executeRunInfo)(this._runInfo, this._activationEnv);
            if (_utilsJs.isFatalError(executionResult)) this.finish(executionResult);
            else if (evaluationResult == (0, _argevaluatorJs.ARGRESULT_SETTLED)) this.settle(executionResult);
            else this.finish(executionResult);
        }
        this.setDirtyForRendering(true);
        (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueRenderOnlyDirty();
    }
    finish(result) {
        (0, _heapJs.heap).removeEnvReference(this._activationEnv);
        this._runInfo.finalize();
        this._runInfo = null;
        this._finished = true;
        // this._finished needs to be set to true before calling finish on
        // the returned value. When we call finish on the returned value,
        // this deferred command will be removed as the child of that deferred value
        // and replaced with the result of the computation. When that happens,
        // memory cleanup happens. When memory cleanup happens on a deferred command,
        // it will check this._finished and try to cancel the deferred value if it's
        // not finished. So we have to make sure this is marked as finished first
        // so we don't try to cancel something that was already finished.
        this._returnedValue.finish(result);
    }
    settle(result) {
        // don't remove ref
        this._returnedValue.settle(result);
    }
    cancel() {
        (0, _heapJs.heap).removeEnvReference(this._activationEnv);
        this._runInfo.finalize();
        this._runInfo = null;
        this._cancelled = true;
    }
    notify() {
        this.tryToFinish();
    }
    renderInto(renderNode, renderFlags, withEditor) {
        let domNode = renderNode.getDomNode();
        let dotspan = null;
        if (!(renderFlags & (0, _globalconstantsJs.RENDER_FLAG_SHALLOW))) {
            dotspan = document.createElement("span");
            dotspan.classList.add("dotspan");
            domNode.appendChild(dotspan);
        }
        super.skipRenderInto(renderNode, renderFlags, withEditor);
        domNode.classList.add("deferredcommand");
        if (!(renderFlags & (0, _globalconstantsJs.RENDER_FLAG_SHALLOW))) {
            if (renderFlags & (0, _globalconstantsJs.RENDER_FLAG_EXPLODED)) dotspan.classList.add("exploded");
            else dotspan.classList.remove("exploded");
            if (this.isEditing) dotspan.classList.add("editing");
            else dotspan.classList.remove("editing");
            dotspan.innerText = this.getCommandText(); // superclass method
        }
    }
    renderAfterChild() {}
    callDeleteHandler() {
    // no op but use this if you need for cleanup
    }
    getEventTable(context) {
        // most of these have no tests?
        return {
            "ShiftBackspace": "call-delete-handler-then-remove-selected-and-select-previous-sibling"
        };
    }
    static makeDeferredCommandWithArgs(cmdname, maybeargs) {
        let cmd = constructDeferredCommand(cmdname);
        // this little snippet lets you do varargs or array
        let args = [];
        if (Array.isArray(maybeargs)) args = maybeargs;
        else args = Array.prototype.slice.call(arguments).splice(1);
        let appendIterator = null;
        for(let i = 0; i < args.length; i++)appendIterator = cmd.fastAppendChildAfter(args[i], appendIterator);
        return cmd;
    }
    memUsed() {
        let r = (0, _heapJs.heap).sizeDeferredCommand();
        if (this._runInfo) r += this._runInfo.memUsed();
        return r + super.memUsed();
    }
    cleanupOnMemoryFree() {
        if (this._activated && !this._finished) this.cancel();
        // because we initialize runinfo at evaluation time not activation time,
        // there is the possibility that even after canceling there will still be runinfo
        if (this._runInfo) this._runInfo.finalize();
    }
}
function constructDeferredCommand(val) {
    if (!(0, _heapJs.heap).requestMem((0, _heapJs.heap).sizeDeferredCommand())) throw (0, _eerrorJs.constructFatalError)(`OUT OF MEMORY: cannot allocate DeferredCommand.
stats: ${(0, _heapJs.heap).stats()}`);
    return (0, _heapJs.heap).register(new DeferredCommand(val));
}

},{"../utils.js":"bIDtH","./deferredvalue.js":"l7y1l","./command.js":"6AUMZ","../gc.js":"idaMG","../editors.js":"2UrvM","../globalconstants.js":"3d62t","../asyncfunctions.js":"6KukQ","../commandfunctions.js":"c95Jp","../eventqueuedispatcher.js":"2z8jO","../argevaluator.js":"k16bq","../heap.js":"67mlv","./eerror.js":"4Xsbj","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"l7y1l":[function(require,module,exports) {
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
*/ // DeferredValue acts like an atomic value but it's actually a container.
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "DeferredValue", ()=>DeferredValue);
parcelHelpers.export(exports, "constructDeferredValue", ()=>constructDeferredValue);
var _utilsJs = require("../utils.js");
var _eventqueuedispatcherJs = require("../eventqueuedispatcher.js");
var _nexcontainerJs = require("./nexcontainer.js");
var _nilJs = require("./nil.js");
var _globalconstantsJs = require("../globalconstants.js");
var _gcJs = require("../gc.js");
var _globalappflagsJs = require("../globalappflags.js");
var _heapJs = require("../heap.js");
var _eerrorJs = require("./eerror.js");
const DVSTATE_CANCELLED = 0;
const DVSTATE_NEW = 1;
const DVSTATE_ACTIVATED = 2;
const DVSTATE_SETTLED = 3;
const DVSTATE_FINISHED = 4;
class DeferredValue extends (0, _nexcontainerJs.NexContainer) {
    constructor(){
        super();
        this.privateData = "";
        this.mutable = false;
        this.activationFunctionGenerator = null;
        this.listeners = [];
        this.state = DVSTATE_NEW;
    }
    addListener(obj) {
        if (this.hasListener(obj)) return;
        this.listeners.push(obj);
        if (this._finished) (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueRenotifyDeferredListeners(this);
    }
    hasListener(obj) {
        for(let i = 0; i < this.listeners.length; i++){
            if (this.listeners[i] == obj) return true;
        }
        return false;
    }
    notifyAllListeners() {
        this.listeners.forEach((function(listener) {
            listener.notify();
        }).bind(this));
    }
    cancel() {
        this.ffgen--;
        this.state = DVSTATE_CANCELLED;
    }
    isActivated() {
        return this.state >= DVSTATE_ACTIVATED;
    }
    isSettled() {
        return this.state >= DVSTATE_SETTLED;
    }
    isFinished() {
        return this.state >= DVSTATE_FINISHED;
    }
    isCancelled() {
        return this.state == DVSTATE_CANCELLED;
    }
    toString(version) {
        if (version == "v2") return this.toStringV2();
    }
    toStringV2() {
        // I think deferred values should just save as not a container but rather save as the string of its
        // contained value, whatever that is. We can't, for example, save the state of a file read operation that is in progress.
        return this.getChildAt(0).toStringV2();
    }
    // deferred values are containers but we don't let you insert things in the editor
    canDoInsertInside() {
        return false;
    }
    // rename this
    set(activationFunctionGenerator) {
        this.activationFunctionGenerator = activationFunctionGenerator;
        this.ffgen = (0, _gcJs.getFFGen)();
    }
    finish(value) {
        this.finishOrSettle(value, false);
    }
    settle(value) {
        this.finishOrSettle(value, true);
    }
    finishOrSettle(value, justSettling) {
        if (this.isFinished()) // can't finish twice, can't settle after finishing.
        return;
        if (this.ffgen < (0, _gcJs.getFFGen)()) {
            // either this was cancelled or all pending deferreds were cancelled.
            this._cancelled = true;
            return;
        }
        this.setDirtyForRendering(true);
        (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueRenderOnlyDirty();
        if (value) {
            if (this.numChildren() == 0) this.appendChild(value);
            else this.replaceChildAt(value, 0);
        }
        this.state = justSettling ? DVSTATE_SETTLED : DVSTATE_FINISHED;
        if (!(0, _globalappflagsJs.experiments).DISABLE_ALERT_ANIMATIONS) this.doAlertAnimation();
        this.notifyAllListeners();
    }
    finishWithRepeat(value) {
        this.finish(value, true);
    }
    startSettle(value) {
        (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueDeferredSettle(this, value);
    }
    startFinish(value) {
        (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueDeferredFinish(this, value);
    }
    activate() {
        let finishCallback = (value)=>this.startFinish(value);
        let settleCallback = (value)=>this.startSettle(value);
        this.activationFunctionGenerator.getFunction(finishCallback, settleCallback, this)();
        this.state = DVSTATE_ACTIVATED;
    }
    prettyPrintInternal(lvl, hdir) {
        return this.standardListPrettyPrint(lvl, ",", hdir);
    }
    deserializePrivateData(data) {
        this.privateData = data;
    }
    serializePrivateData() {
        return this.privateData;
    }
    getTypeName() {
        return "-deferredvalue-";
    }
    makeCopy(shallow) {
        // A copy of a deferred value should ACTUALLY just be a copy of the contents,
        // since you can't really copy a waiting file handle or something.
        // Since this defaults to immutable and can't be made mutable, the only time
        // makeCopy should be called is for a copy and paste operation.
        return this.getChildAt(0).makeCopy();
    }
    doAlertAnimation() {
        let rn = this.getRenderNodes();
        for(let i = 0; i < rn.length; i++)(0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueAlertAnimation(rn[i]);
    }
    copyFieldsTo(nex) {
        super.copyFieldsTo(nex);
    }
    getSettledValue() {
        if (this.numChildren() > 0) return this.getChildAt(0);
        else return new (0, _nilJs.Nil)();
    }
    evaluate(env) {
        if (!this.isActivated()) {
            this.activate();
            return this;
        }
        if (this.isFinished()) {
            if (this.numChildren() > 0) {
                let c = this.getChildAt(0);
                if (_utilsJs.isDeferredValue(c) && c.isFinished()) return c.evaluate(env);
                else return c;
            } else return new (0, _nilJs.Nil)();
        }
        // if just settled, but not finished, return this.
        return this;
    }
    setMutable(v) {
        if (v) throw (0, _eerrorJs.constructFatalError)("cannot make deferred values mutable.");
    }
    getDefaultHandler() {
        return "standardDefault";
    }
    renderInto(renderNode, renderFlags, withEditor) {
        let domNode = renderNode.getDomNode();
        let dotspan = null;
        if (!(renderFlags & (0, _globalconstantsJs.RENDER_FLAG_SHALLOW))) {
            dotspan = document.createElement("span");
            dotspan.classList.add("dotspan");
            domNode.appendChild(dotspan);
        }
        super.renderInto(renderNode, renderFlags, withEditor);
        dotspan.classList.add("dotspan");
        domNode.appendChild(dotspan);
        domNode.classList.add("deferredvalue");
        if (!(renderFlags & (0, _globalconstantsJs.RENDER_FLAG_SHALLOW))) {
            if (renderFlags & (0, _globalconstantsJs.RENDER_FLAG_EXPLODED)) dotspan.classList.add("exploded");
            else dotspan.classList.remove("exploded");
            if (this.isEditing) dotspan.classList.add("editing");
            else dotspan.classList.remove("editing");
            switch(this.state){
                case DVSTATE_CANCELLED:
                    dotspan.innerHTML = '<span class="dvglyph cancelledglyph">\u292C</span>';
                    break;
                case DVSTATE_ACTIVATED:
                    if ((0, _globalappflagsJs.experiments).STATIC_PIPS) dotspan.innerHTML = '<span class="dvglyph waitingglyph">\u21BB</span>';
                    else dotspan.innerHTML = '<span class="dvglyph waitingglyph dvspin">\u21BB</span>';
                    break;
                case DVSTATE_SETTLED:
                    dotspan.innerHTML = '<span class="dvglyph settledglyph">\u2B3F</span>';
                    break;
                case DVSTATE_FINISHED:
                    dotspan.innerHTML = '<span class="dvglyph finishedglyph">\u2913</span>';
                    break;
                case DVSTATE_NEW:
                default:
                    // shouldn't happen
                    dotspan.innerHTML = '<span class="dvglyph newglyph">?</span>';
                    break;
            }
        }
    }
    memUsed() {
        return super.memUsed() + (0, _heapJs.heap).sizeDeferredValue();
    }
}
function constructDeferredValue() {
    if (!(0, _heapJs.heap).requestMem((0, _heapJs.heap).sizeDeferredValue())) throw (0, _eerrorJs.constructFatalError)(`OUT OF MEMORY: cannot allocate DeferredValue.
stats: ${(0, _heapJs.heap).stats()}`);
    return (0, _heapJs.heap).register(new DeferredValue());
}

},{"../utils.js":"bIDtH","../eventqueuedispatcher.js":"2z8jO","./nexcontainer.js":"e7Ky3","./nil.js":"amOKC","../globalconstants.js":"3d62t","../gc.js":"idaMG","../globalappflags.js":"1FpbG","../heap.js":"67mlv","./eerror.js":"4Xsbj","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"amOKC":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Nil", ()=>Nil);
parcelHelpers.export(exports, "constructNil", ()=>constructNil);
var _valuenexJs = require("./valuenex.js");
var _globalappflagsJs = require("../globalappflags.js");
var _heapJs = require("../heap.js");
var _eerrorJs = require("./eerror.js");
class Nil extends (0, _valuenexJs.ValueNex) {
    constructor(){
        super("", "&#8709;", "nil");
    }
    getTypeName() {
        return "-nil-";
    }
    makeCopy() {
        let r = constructNil();
        this.copyFieldsTo(r);
        return r;
    }
    toString(version) {
        if (version == "v2") return this.toStringV2();
        return super.toString(version);
    }
    toStringV2() {
        return "[nil]" + this.toStringV2TagList();
    }
    isEmpty() {
        return true;
    }
    deleteLastLetter() {
        return;
    }
    appendText(txt) {
        return;
    }
    getDefaultHandler() {
        return "standardDefault";
    }
    renderInto(renderNode, renderFlags, withEditor) {
        super.renderInto(renderNode, renderFlags, withEditor);
        let domNode = renderNode.getDomNode();
        domNode.classList.add("nil");
    }
    getEventTable(context) {
        return {};
    }
    memUsed() {
        return super.memUsed() + (0, _heapJs.heap).sizeNil();
    }
}
function constructNil() {
    if (!(0, _heapJs.heap).requestMem((0, _heapJs.heap).sizeNil())) throw (0, _eerrorJs.constructFatalError)(`OUT OF MEMORY: cannot allocate Nil.
stats: ${(0, _heapJs.heap).stats()}`);
    return (0, _heapJs.heap).register(new Nil());
}

},{"./valuenex.js":"8G1WY","../globalappflags.js":"1FpbG","../heap.js":"67mlv","./eerror.js":"4Xsbj","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"6KukQ":[function(require,module,exports) {
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
*/ // change "set" to "prime"
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "ImmediateActivationFunctionGenerator", ()=>ImmediateActivationFunctionGenerator);
parcelHelpers.export(exports, "DelayActivationFunctionGenerator", ()=>DelayActivationFunctionGenerator);
parcelHelpers.export(exports, "ClickActivationFunctionGenerator", ()=>ClickActivationFunctionGenerator);
parcelHelpers.export(exports, "GenericActivationFunctionGenerator", ()=>GenericActivationFunctionGenerator);
parcelHelpers.export(exports, "MidiActivationFunctionGenerator", ()=>MidiActivationFunctionGenerator);
parcelHelpers.export(exports, "DeferredCommandActivationFunctionGenerator", ()=>DeferredCommandActivationFunctionGenerator);
parcelHelpers.export(exports, "OnContentsChangedActivationFunctionGenerator", ()=>OnContentsChangedActivationFunctionGenerator);
parcelHelpers.export(exports, "CallbackActivationFunctionGenerator", ()=>CallbackActivationFunctionGenerator);
parcelHelpers.export(exports, "OnNextRenderActivationFunctionGenerator", ()=>OnNextRenderActivationFunctionGenerator);
var _midifunctionsJs = require("./midifunctions.js");
var _orgJs = require("./nex/org.js");
class ActivationFunctionGenerator {
    constructor(){}
    getFunction(cb, exp) {}
    getAFGName() {}
}
class DeferredCommandActivationFunctionGenerator extends ActivationFunctionGenerator {
    constructor(deferredCommand, env){
        super();
        this.deferredCommand = deferredCommand;
        this.env = env;
    }
    getFunction(finishCallback, settleCallback, exp) {
        return (function() {
            this.deferredCommand.activate(this.env);
        }).bind(this);
    }
    getAFGName() {
        return "deferredcommand";
    }
}
class GenericActivationFunctionGenerator extends ActivationFunctionGenerator {
    constructor(name, asyncFunction){
        super();
        this.name = name;
        this.asyncFunction = asyncFunction;
    }
    getFunction(finishCallback, settleCallback, exp) {
        return (function() {
            this.asyncFunction(finishCallback, exp);
        }).bind(this);
    }
    getAFGName() {
        return this.name;
    }
}
class ImmediateActivationFunctionGenerator extends ActivationFunctionGenerator {
    getFunction(finishCallback, settleCallback, exp) {
        return function() {
            finishCallback(null);
        };
    }
    getAFGName() {
        return "nothing";
    }
}
class DelayActivationFunctionGenerator extends ActivationFunctionGenerator {
    constructor(timeout){
        super();
        this.timeout = timeout;
    }
    getFunction(finishCallback, settleCallback, exp) {
        return (function() {
            setTimeout(function() {
                finishCallback(null);
            }, this.timeout);
        }).bind(this);
    }
    getAFGName() {
        return "delay";
    }
}
class OnNextRenderActivationFunctionGenerator extends ActivationFunctionGenerator {
    constructor(nex){
        super();
        this.nex = nex;
    }
    getFunction(finishCallback, settleCallback, exp) {
        return (function() {
            this.nex.setOnNextRenderCallback((function() {
                finishCallback(this.nex);
            }).bind(this));
        }).bind(this);
    }
    getAFGName() {
        return "delay";
    }
}
class CallbackActivationFunctionGenerator extends ActivationFunctionGenerator {
    constructor(closure){
        super();
        this.closure = closure;
    }
    getFunction(finishCallback, settleCallback, exp) {
        return (function() {
        // no op, the dv has to be manually resolved.
        }).bind(this);
    }
    getAFGName() {
        return "callback";
    }
}
class ClickActivationFunctionGenerator extends ActivationFunctionGenerator {
    constructor(nex){
        super();
        this.nex = nex;
    }
    getFunction(finishCallback, settleCallback, exp) {
        return (function() {
            this.nex.extraClickHandler = function(x, y) {
                let org = (0, _orgJs.convertJSMapToOrg)({
                    "x": x,
                    "y": y
                });
                settleCallback(org);
            };
        }).bind(this);
    }
    getAFGName() {
        return "click";
    }
}
class MidiActivationFunctionGenerator extends ActivationFunctionGenerator {
    constructor(id){
        super();
        this.id = id;
        this.listening = false;
        this.expListeners = [];
    }
    getFunction(finishCallback, settleCallback, exp) {
        this.expListeners.push(settleCallback);
        return (function() {
            if (!this.listening) {
                this.listening = true;
                (0, _midifunctionsJs.addMidiListener)(this.id, (function(midinote) {
                    for(let i = 0; i < this.expListeners.length; i++)this.expListeners[i](midinote);
                }).bind(this));
            }
        }).bind(this);
    }
    getAFGName() {
        return "midi";
    }
}
class OnContentsChangedActivationFunctionGenerator extends ActivationFunctionGenerator {
    constructor(nex){
        super();
        this.nex = nex;
    }
    getFunction(finishCallback, settleCallback, exp) {
        return (function() {
            this.nex.onContentsChangedCallback = function() {
                settleCallback();
            };
        }).bind(this);
    }
    getAFGName() {
        return "on-contents-changed";
    }
}

},{"./midifunctions.js":"hecb9","./nex/org.js":"28wYz","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"hecb9":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "getMidiDevices", ()=>getMidiDevices);
parcelHelpers.export(exports, "addMidiListener", ()=>addMidiListener);
var _tagJs = require("./tag.js");
var _orgJs = require("./nex/org.js");
var midi = null;
var setupcb = null;
const inputListeners = {};
const inputsBeingListenedTo = {};
// need to start using async function around here!
function playWavetableOnMidiInput(wt, midiInput) {}
function onMIDISuccess(midiAccess) {
    console.log("MIDI ready");
    console.log(midiAccess);
    midi = midiAccess;
    if (setupcb) setupcb();
}
function onMIDIFailure(msg) {
    console.log("failed to do midi " + msg);
    midi = "i failed";
}
function maybeSetupMidi(cb) {
    if (!midi) {
        setupcb = cb;
        navigator.requestMIDIAccess().then(onMIDISuccess, onMIDIFailure);
    } else cb();
}
function addToMap(m, from, name) {
    m[name] = from[name];
}
function addMidiListener(id, f) {
    if (inputListeners[id]) inputListeners[id].push(f);
    else setupFirstInputListener(id, f);
}
function setupFirstInputListener(id, f) {
    inputListeners[id] = [
        f
    ];
    for (let entry of midi.inputs){
        let input = entry[1];
        if (id == input.id) {
            inputsBeingListenedTo[id] = input;
            input.onmidimessage = (msg)=>{
                respondToMidiMessage(id, msg);
            };
        }
    }
}
function doNote(msg, type) {
    let channel = msg.data[0] & 0x0F;
    let nn = msg.data[1] & 0x7F;
    let vel = msg.data[2] & 0x7F;
    return (0, _orgJs.convertJSMapToOrg)({
        "note": nn,
        "vel": vel,
        "type": type
    });
}
function parseMidiMessage(msg) {
    let status = msg.data[0];
    // channel voice messages
    status = status & 0xF0;
    switch(status){
        case 0x80:
            return doNote(msg, "note off");
        case 0x90:
            return doNote(msg, "note on");
    }
    return (0, _orgJs.constructOrg)();
}
function respondToMidiMessage(id, msg) {
    console.log("sending message to midi listeners");
    console.log(msg);
    for(let i = 0; i < inputListeners[id].length; i++)inputListeners[id][i](parseMidiMessage(msg));
}
function getMidiDevices(incb) {
    let cb = function() {
        let r = [];
        for (let entry of midi.inputs){
            var input = entry[1];
            let m = {};
            addToMap(m, input, "id");
            addToMap(m, input, "manufacturer");
            addToMap(m, input, "name");
            addToMap(m, input, "type");
            addToMap(m, input, "version");
            addToMap(m, input, "state");
            addToMap(m, input, "connection");
            r.push(m);
        }
        incb(r);
    };
    maybeSetupMidi(cb);
}

},{"./tag.js":"975jg","./nex/org.js":"28wYz","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"keNY2":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Letter", ()=>Letter);
parcelHelpers.export(exports, "constructLetter", ()=>constructLetter);
var _contexttypeJs = require("../contexttype.js");
var _nexJs = require("./nex.js");
var _globalappflagsJs = require("../globalappflags.js");
var _globalconstantsJs = require("../globalconstants.js");
var _pfontmanagerJs = require("../pfonts/pfontmanager.js");
var _heapJs = require("../heap.js");
var _eerrorJs = require("./eerror.js");
class Letter extends (0, _nexJs.Nex) {
    constructor(letter){
        super();
        this.letterValue = letter;
        if ((0, _globalappflagsJs.otherflags).DEFAULT_TO_PARAMETRIC_FONTS) {
            this.pfont = (0, _pfontmanagerJs.parametricFontManager).getFont("Basic", {}, {});
            this.pfont.setLetter(this.letterValue);
        } else this.pfont = null;
        if (letter == "") throw new Error("cannot have an empty letter");
    }
    getTypeName() {
        return "-letter-";
    }
    makeCopy() {
        let r = constructLetter(this.letterValue);
        this.copyFieldsTo(r);
        return r;
    }
    copyFieldsTo(nex) {
        super.copyFieldsTo(nex);
        if (this.pfont) nex.pfont = this.pfont.copy();
    }
    setPfont(pfstring) {
        if (this.pfont && (0, _pfontmanagerJs.parametricFontManager).isSameFont(this.pfont, pfstring)) (0, _pfontmanagerJs.parametricFontManager).redrawFontStringInFont(this.pfont, pfstring);
        else {
            this.pfont = (0, _pfontmanagerJs.parametricFontManager).getFontForString(pfstring);
            this.pfont.setLetter(this.letterValue);
        }
        this.setDirtyForRendering(true);
    }
    toString(version) {
        if (version == "v2") return this.toStringV2();
        return "|(" + this.letterValue + ")|";
    }
    toStringV2() {
        return `[${this.toStringV2Literal()}letter]${this.toStringV2PrivateDataSection()}${this.toStringV2TagList()}`;
    }
    serializePrivateData(data) {
        let style = this.getCurrentStyle();
        if (style) return `${this.letterValue}|${this.getCurrentStyle()}`;
        else return `${this.letterValue}`;
    }
    deserializePrivateData(data) {
        let a = data.split("|");
        this.letterValue = a[0];
        if (a.length > 1) this.setCurrentStyle(a[1]);
    }
    renderInto(renderNode, renderFlags, withEditor) {
        let domNode = renderNode.getDomNode();
        super.renderInto(renderNode, renderFlags, withEditor);
        domNode.classList.add("letter");
        domNode.classList.add("data");
        if (renderFlags & (0, _globalconstantsJs.RENDER_FLAG_INSERT_AFTER)) domNode.classList.add("rightinsert");
        else domNode.classList.add("leftinsert");
        if (this.pfont) domNode.appendChild(this.pfont.drawIntoDomNode(this.letterValue));
        else {
            let contents = this.letterValue == " " || this.letterValue == "&nbsp;" ? "\xa0" : this.letterValue;
            domNode.appendChild(document.createTextNode(contents));
        }
    }
    getText() {
        return this.letterValue;
    }
    getDefaultHandler() {
        return "letterDefault";
    }
    getEventTable(context) {
        return {
            "Tab": "move-to-next-leaf",
            "ArrowUp": "move-to-corresponding-letter-in-previous-line",
            "ArrowDown": "move-to-corresponding-letter-in-next-line",
            "ArrowLeft": "move-to-previous-leaf",
            "ArrowRight": "move-to-next-leaf",
            "Backspace": "delete-letter",
            "ShiftBackspace": "delete-letter",
            "Enter": "do-line-break-for-letter",
            "!": "insert-actual-!-at-insertion-point-from-letter",
            "@": "insert-actual-@-at-insertion-point-from-letter",
            "#": "insert-actual-#-at-insertion-point-from-letter",
            "$": "insert-actual-$-at-insertion-point-from-letter",
            "%": "insert-actual-%-at-insertion-point-from-letter",
            "^": "insert-actual-^-at-insertion-point-from-letter",
            "&": "insert-actual-&-at-insertion-point-from-letter",
            "*": "insert-actual-*-at-insertion-point-from-letter",
            "(": "insert-actual-(-at-insertion-point-from-letter",
            ")": "insert-actual-)-at-insertion-point-from-letter",
            "[": "insert-actual-[-at-insertion-point-from-letter",
            "{": "insert-actual-{-at-insertion-point-from-letter",
            "<": "insert-actual-<-at-insertion-point-from-letter"
        };
    }
    memUsed() {
        return super.memUsed() + (0, _heapJs.heap).sizeLetter();
    }
}
function constructLetter(letter) {
    if (!(0, _heapJs.heap).requestMem((0, _heapJs.heap).sizeLetter())) throw (0, _eerrorJs.constructFatalError)(`OUT OF MEMORY: cannot allocate Letter.
stats: ${(0, _heapJs.heap).stats()}`);
    return (0, _heapJs.heap).register(new Letter(letter));
}

},{"../contexttype.js":"7dDRe","./nex.js":"gNpCL","../globalappflags.js":"1FpbG","../globalconstants.js":"3d62t","../pfonts/pfontmanager.js":"3AnVN","../heap.js":"67mlv","./eerror.js":"4Xsbj","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"3AnVN":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "parametricFontManager", ()=>parametricFontManager);
var _basicJs = require("./basic.js");
var _weirdhelveticaJs = require("./weirdhelvetica.js");
class ParametricFontManager {
    constructor(){
        this.fonts = {
            "basic": new (0, _basicJs.Basic)({}, {}),
            "weirdhelvetica": new (0, _weirdhelveticaJs.WeirdHelvetica)({}, {})
        };
    }
    getFont(fontname, pxparams, params) {
        if (this.fonts[fontname]) return this.fonts[fontname].createWithParams(pxparams, params);
        return this.fonts["basic"].createWithParams(pxparams, params);
    }
    // font string should be something like this
    // first the pxparams, then the relative params
    /*

	basic##
	basic#fontsize:20#
	basic#fontsize:20,tracking:8#curve:.23

	*/ parseFontString(fontstring) {
        let params = {};
        let sections = fontstring.split("#");
        params.fontname = sections[0];
        let pxparams1 = sections[1];
        let relparams1 = sections[2];
        params.pxparams = {};
        let pxparams2 = pxparams1.split(",");
        for(let i = 0; i < pxparams2.length; i++){
            let pxparams3 = pxparams2[i].split(":");
            params.pxparams[pxparams3[0]] = Number(pxparams3[1]);
        }
        params.relparams = {};
        let relparams2 = relparams1.split(",");
        for(let i = 0; i < relparams2.length; i++){
            let relparams3 = relparams2[i].split(":");
            params.relparams[relparams3[0]] = Number(relparams3[1]);
        }
        return params;
    }
    getFontForString(fontstring) {
        let params = this.parseFontString(fontstring);
        return this.getFont(params.fontname, params.pxparams, params.relparams);
    }
    isSameFont(font, fontstring) {
        let params = this.parseFontString(fontstring);
        return font.getFontName() == params.fontname;
    }
    redrawFontStringInFont(font, fontstring) {
        let params = this.parseFontString(fontstring);
        font.setParams(params.pxparams, params.relparams);
    }
}
const parametricFontManager = new ParametricFontManager();

},{"./basic.js":"jRuwz","./weirdhelvetica.js":"eYIvj","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"jRuwz":[function(require,module,exports) {
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
*/ // useful tool: https://www.metaflop.com/modulator
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Basic", ()=>Basic);
var _drawingopsJs = require("./drawingops.js");
var _glyphJs = require("./glyph.js");
var _fontJs = require("./font.js");
const GLYPHS = {
    " ": new (0, _glyphJs.Glyph)(.4, []),
    "a": new (0, _glyphJs.Glyph)(.7, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus * .75
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus * .75 + p.curve * .75
                },
                {
                    x: (p)=>p.mid - p.curve * .75,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid + p.curve * .75,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus * .75 + p.curve * .75
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus * .75
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus * .75 - p.curve * .75
                },
                {
                    x: (p)=>p.mid + p.curve * .75,
                    y: (p)=>p.corpus / 2
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid - p.curve * .75,
                    y: (p)=>p.corpus / 2
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus * .25 + p.curve * .75
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus * .25
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus * .25 - p.curve * .75
                },
                {
                    x: (p)=>p.mid - p.curve * .75,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid + p.curve * .75,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus * .25 - p.curve * .75
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus * .25
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus * .75
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.baseline - .02
                }
            ]
        }
    ]),
    "b": new (0, _glyphJs.Glyph)(1.0, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.asc
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2 + p.curve
                },
                {
                    x: (p)=>p.mid - p.curve,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2 + p.curve
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2 - p.curve
                },
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid - p.curve,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2 - p.curve
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2
                }
            ]
        }
    ]),
    "c": new (0, _glyphJs.Glyph)(1.0, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid - p.curve,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2 + p.curve
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2 - p.curve
                },
                {
                    x: (p)=>p.mid - p.curve,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIERPLOT),
            d: [
                {
                    val: (p)=>p.aperture
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2 + p.curve
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIERPLOT),
            d: [
                {
                    val: (p)=>p.aperture
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2 - p.curve
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2
                }
            ]
        }
    ]),
    "d": new (0, _glyphJs.Glyph)(1.0, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2 + p.curve
                },
                {
                    x: (p)=>p.mid - p.curve,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2 + p.curve
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2 - p.curve
                },
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid - p.curve,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2 - p.curve
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.asc
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.baseline
                }
            ]
        }
    ]),
    "e": new (0, _glyphJs.Glyph)(1.0, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2 + p.curve
                },
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid - p.curve,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2 + p.curve
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2 - p.curve
                },
                {
                    x: (p)=>p.mid - p.curve,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIERPLOT),
            d: [
                {
                    val: (p)=>p.aperture
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2 - p.curve
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2
                }
            ]
        }
    ]),
    "f": new (0, _glyphJs.Glyph)(.6, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.asc
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.right - .1,
                    y: (p)=>p.asc
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.asc * .8 + .1
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.asc * .8
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus
                }
            ]
        }
    ]),
    "g": new (0, _glyphJs.Glyph)(1.0, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2 + p.curve
                },
                {
                    x: (p)=>p.mid - p.curve,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2 + p.curve
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2 - p.curve
                },
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid - p.curve,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2 - p.curve
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.desc * .4
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.desc * .4 - p.curve
                },
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.desc
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.desc
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid - p.curve,
                    y: (p)=>p.desc
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.desc * .4 - p.curve
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.desc * .4
                }
            ]
        }
    ]),
    "h": new (0, _glyphJs.Glyph)(.8, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.asc
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2 + p.curve
                },
                {
                    x: (p)=>p.mid - p.curve,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2 + p.curve
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.baseline
                }
            ]
        }
    ]),
    "i": new (0, _glyphJs.Glyph)(.15, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus + .1
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus + .2
                }
            ]
        }
    ]),
    "j": new (0, _glyphJs.Glyph)(.15, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.desc + .1
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.desc + .1 - .1
                },
                {
                    x: (p)=>p.left - .2 + .1,
                    y: (p)=>p.desc
                },
                {
                    x: (p)=>p.left - .2,
                    y: (p)=>p.desc
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus + .1
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus + .2
                }
            ]
        }
    ]),
    "k": new (0, _glyphJs.Glyph)(.7, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.asc
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus * .4
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left + p.width * .4,
                    y: (p)=>p.corpus * .6
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.baseline
                }
            ]
        }
    ]),
    "l": new (0, _glyphJs.Glyph)(.1, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.asc
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        }
    ]),
    "m": new (0, _glyphJs.Glyph)(1.4, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2 + p.curve
                },
                {
                    x: (p)=>p.mid * .5 - p.curve,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.mid * .5,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid * .5 + p.curve,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus / 2 + p.curve
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus / 2 + p.curve
                },
                {
                    x: (p)=>p.mid * 1.5 - p.curve,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.mid * 1.5,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid * 1.5 + p.curve,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2 + p.curve
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.baseline
                }
            ]
        }
    ]),
    "n": new (0, _glyphJs.Glyph)(0.7, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2 + p.curve
                },
                {
                    x: (p)=>p.mid - p.curve,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2 + p.curve
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.baseline
                }
            ]
        }
    ]),
    "o": new (0, _glyphJs.Glyph)(1.0, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2 + p.curve
                },
                {
                    x: (p)=>p.mid - p.curve,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2 + p.curve
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2 - p.curve
                },
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid - p.curve,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2 - p.curve
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2
                }
            ]
        }
    ]),
    "p": new (0, _glyphJs.Glyph)(1.0, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.desc
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2 + p.curve
                },
                {
                    x: (p)=>p.mid - p.curve,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2 + p.curve
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2 - p.curve
                },
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid - p.curve,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2 - p.curve
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2
                }
            ]
        }
    ]),
    "q": new (0, _glyphJs.Glyph)(1.0, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2 + p.curve
                },
                {
                    x: (p)=>p.mid - p.curve,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2 + p.curve
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2 - p.curve
                },
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid - p.curve,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2 - p.curve
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.desc
                }
            ]
        }
    ]),
    "r": new (0, _glyphJs.Glyph)(.4, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2 + p.curve
                },
                {
                    x: (p)=>p.right - p.curve,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus
                }
            ]
        }
    ]),
    "s": new (0, _glyphJs.Glyph)(.65, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus * .8
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.right - p.curve * .3,
                    y: (p)=>p.corpus * .8 + p.curve * .7
                },
                {
                    x: (p)=>p.mid + p.curve * .2,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid - p.curve * .7,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus * .8 + p.curve * .4
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus * .8
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus * .8 - p.curve * .7
                },
                {
                    x: (p)=>p.mid - p.curve * .7,
                    y: (p)=>p.corpus * .55
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus * .5
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid + p.curve * .7,
                    y: (p)=>p.corpus * .45
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus * .2 + p.curve * .7
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus * .2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus * .2 - p.curve * .4
                },
                {
                    x: (p)=>p.mid + p.curve * .7,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid - p.curve * .2,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.left + p.curve * .3,
                    y: (p)=>p.corpus * .2 - p.curve * .7
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus * .2
                }
            ]
        }
    ]),
    "t": new (0, _glyphJs.Glyph)(.65, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.width * .4,
                    y: (p)=>p.asc * .8
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.width * .4,
                    y: (p)=>p.corpus * .2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.width * .4,
                    y: (p)=>p.corpus * .2 - p.curve * .3
                },
                {
                    x: (p)=>p.width * .7 - p.curve * .3,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.width * .7,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.width * .7 + p.curve * .3,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus * .2 - p.curve * .3
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus * .2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus
                }
            ]
        }
    ]),
    "u": new (0, _glyphJs.Glyph)(.8, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus * .5
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus * .5 - p.curve
                },
                {
                    x: (p)=>p.mid - p.curve,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus * .5 - p.curve
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus * .5
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.baseline
                }
            ]
        }
    ]),
    "v": new (0, _glyphJs.Glyph)(.8, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid - p.curve * .1,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid + p.curve * .1,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus
                }
            ]
        }
    ]),
    "w": new (0, _glyphJs.Glyph)(1.6, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.width * .25 - p.curve * .1,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.width * .25 + p.curve * .1,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.width * .5 - p.curve * .1,
                    y: (p)=>p.corpus * .95
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.width * .5 + p.curve * .1,
                    y: (p)=>p.corpus * .95
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.width * .75 - p.curve * .1,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.width * .75 + p.curve * .1,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.width,
                    y: (p)=>p.corpus
                }
            ]
        }
    ]),
    "x": new (0, _glyphJs.Glyph)(.8, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.baseline
                }
            ]
        }
    ]),
    "y": new (0, _glyphJs.Glyph)(.8, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.desc
                }
            ]
        }
    ]),
    "z": new (0, _glyphJs.Glyph)(.8, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.baseline
                }
            ]
        }
    ]),
    "A": new (0, _glyphJs.Glyph)(1.2, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid - p.curve * .1,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid + p.curve * .1,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.width * .2,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.width * .8,
                    y: (p)=>p.corpus / 2
                }
            ]
        }
    ]),
    "B": new (0, _glyphJs.Glyph)(.8, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.cap
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap * .75 + p.curve
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap * .75
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap * .75 - p.curve
                },
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.cap * .5
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.cap * .5
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap * .5
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.cap * .5
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.cap * .5
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap * .25 + p.curve
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap * .25
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap * .25 - p.curve
                },
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.baseline
                }
            ]
        }
    ]),
    "C": new (0, _glyphJs.Glyph)(1.2, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid - p.curve * 1.3,
                    y: (p)=>p.cap
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap / 2 + p.curve * 1.3
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap / 2 - p.curve * 1.3
                },
                {
                    x: (p)=>p.mid - p.curve * 1.3,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIERPLOT),
            d: [
                {
                    val: (p)=>p.aperture
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.cap
                },
                {
                    x: (p)=>p.mid + p.curve * 1.3,
                    y: (p)=>p.cap
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap / 2 + p.curve * 1.3
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIERPLOT),
            d: [
                {
                    val: (p)=>p.aperture
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.mid + p.curve * 1.3,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap / 2 - p.curve * 1.3
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap / 2
                }
            ]
        }
    ]),
    "D": new (0, _glyphJs.Glyph)(1.0, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid + p.curve * 1.2,
                    y: (p)=>p.cap
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap / 2 + p.curve * 1.2
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap / 2 - p.curve * 1.2
                },
                {
                    x: (p)=>p.mid + p.curve * 1.2,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.baseline
                }
            ]
        }
    ]),
    "E": new (0, _glyphJs.Glyph)(1.0, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right - p.curve * 1.1,
                    y: (p)=>p.cap / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.baseline
                }
            ]
        }
    ]),
    "F": new (0, _glyphJs.Glyph)(1.0, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right - p.curve * 1.1,
                    y: (p)=>p.cap / 2
                }
            ]
        }
    ]),
    "G": new (0, _glyphJs.Glyph)(1.2, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid - p.curve * 1.3,
                    y: (p)=>p.cap
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap / 2 + p.curve * 1.3
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap / 2 - p.curve * 1.3
                },
                {
                    x: (p)=>p.mid - p.curve * 1.3,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIERPLOT),
            d: [
                {
                    val: (p)=>p.aperture
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.cap
                },
                {
                    x: (p)=>p.mid + p.curve * 1.3,
                    y: (p)=>p.cap
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap / 2 + p.curve * 1.3
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIERPLOT),
            d: [
                {
                    val: (p)=>p.aperture
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.mid + p.curve * 1.3,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap / 2 - p.curve * 1.3
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.right - .02,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right - .02,
                    y: (p)=>p.corpus * .75
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.corpus * .75
                }
            ]
        }
    ]),
    "H": new (0, _glyphJs.Glyph)(.9, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.baseline
                }
            ]
        }
    ]),
    "I": new (0, _glyphJs.Glyph)(.3, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        }
    ]),
    "J": new (0, _glyphJs.Glyph)(.8, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2 - p.curve
                },
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid - p.curve,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2 - p.curve
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2
                }
            ]
        }
    ]),
    "K": new (0, _glyphJs.Glyph)(1.0, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap / 2 - p.curve
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left + .1,
                    y: (p)=>p.cap / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.baseline
                }
            ]
        }
    ]),
    "L": new (0, _glyphJs.Glyph)(.8, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.baseline
                }
            ]
        }
    ]),
    "M": new (0, _glyphJs.Glyph)(1.2, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.baseline
                }
            ]
        }
    ]),
    "N": new (0, _glyphJs.Glyph)(1.0, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.baseline
                }
            ]
        }
    ]),
    "O": new (0, _glyphJs.Glyph)(1.0, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid - p.curve * 1.2,
                    y: (p)=>p.cap
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap / 2 + p.curve * 1.2
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap / 2 - p.curve * 1.2
                },
                {
                    x: (p)=>p.mid - p.curve * 1.2,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid + p.curve * 1.2,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap / 2 - p.curve * 1.2
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap / 2 + p.curve * 1.2
                },
                {
                    x: (p)=>p.mid + p.curve * 1.2,
                    y: (p)=>p.cap
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.cap
                }
            ]
        }
    ]),
    "P": new (0, _glyphJs.Glyph)(.8, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.cap
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap * .75 + p.curve
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap * .75
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap * .75 - p.curve
                },
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.cap * .5
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.cap * .5
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap * .5
                }
            ]
        }
    ]),
    "Q": new (0, _glyphJs.Glyph)(1.0, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid - p.curve * 1.2,
                    y: (p)=>p.cap
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap / 2 + p.curve * 1.2
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap / 2 - p.curve * 1.2
                },
                {
                    x: (p)=>p.mid - p.curve * 1.2,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid + p.curve * 1.2,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap / 2 - p.curve * 1.2
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap / 2 + p.curve * 1.2
                },
                {
                    x: (p)=>p.mid + p.curve * 1.2,
                    y: (p)=>p.cap
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.mid + p.curve / 2,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.baseline - p.curve
                }
            ]
        }
    ]),
    "R": new (0, _glyphJs.Glyph)(.8, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.cap
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap * .75 + p.curve
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap * .75
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap * .75 - p.curve
                },
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.cap * .5
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.cap * .5
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap * .5
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.cap * .5
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.baseline
                }
            ]
        }
    ]),
    "S": new (0, _glyphJs.Glyph)(.8, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap * .8
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.right - p.curve * .3,
                    y: (p)=>p.cap * .8 + p.curve * .7
                },
                {
                    x: (p)=>p.mid + p.curve * .2,
                    y: (p)=>p.cap
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid - p.curve * .7,
                    y: (p)=>p.cap
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap * .8 + p.curve * .4
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap * .8
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap * .8 - p.curve * .7
                },
                {
                    x: (p)=>p.mid - p.curve * .7,
                    y: (p)=>p.cap * .55
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.cap * .5
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid + p.curve * .7,
                    y: (p)=>p.cap * .45
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap * .2 + p.curve * .7
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap * .2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap * .2 - p.curve * .4
                },
                {
                    x: (p)=>p.mid + p.curve * .7,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid - p.curve * .2,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.left + p.curve * .3,
                    y: (p)=>p.cap * .2 - p.curve * .7
                },
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap * .2
                }
            ]
        }
    ]),
    "T": new (0, _glyphJs.Glyph)(1.0, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap
                }
            ]
        }
    ]),
    "U": new (0, _glyphJs.Glyph)(1.0, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2 - p.curve
                },
                {
                    x: (p)=>p.mid - p.curve,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.baseline
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2 - p.curve
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap
                }
            ]
        }
    ]),
    "V": new (0, _glyphJs.Glyph)(1.0, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap
                }
            ]
        }
    ]),
    "W": new (0, _glyphJs.Glyph)(1.4, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.width * .25,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.width * .25,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.width * .75,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.width * .75,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap
                }
            ]
        }
    ]),
    "X": new (0, _glyphJs.Glyph)(1.0, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.baseline
                }
            ]
        }
    ]),
    "Y": new (0, _glyphJs.Glyph)(1.0, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.cap / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.cap / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        }
    ]),
    "Z": new (0, _glyphJs.Glyph)(1.0, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.cap
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.baseline
                }
            ]
        }
    ]),
    ".": new (0, _glyphJs.Glyph)(0.1, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline + .1
                }
            ]
        }
    ]),
    ",": new (0, _glyphJs.Glyph)(0.1, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline + .1
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline - p.curve * .5
                },
                {
                    x: (p)=>p.left - .03 + p.curve * .5,
                    y: (p)=>p.baseline - .05
                },
                {
                    x: (p)=>p.left - .03,
                    y: (p)=>p.baseline - .1
                }
            ]
        }
    ]),
    ";": new (0, _glyphJs.Glyph)(0.1, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus - .1
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline + .1
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline - p.curve * .5
                },
                {
                    x: (p)=>p.left - .03 + p.curve * .5,
                    y: (p)=>p.baseline - .05
                },
                {
                    x: (p)=>p.left - .03,
                    y: (p)=>p.baseline - .1
                }
            ]
        }
    ]),
    ":": new (0, _glyphJs.Glyph)(0.1, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus - .1
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline + .1
                }
            ]
        }
    ]),
    "-": new (0, _glyphJs.Glyph)(0.4, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus / 2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus / 2
                }
            ]
        }
    ]),
    "?": new (0, _glyphJs.Glyph)(.8, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus + .1
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus + .1 + p.curve
                },
                {
                    x: (p)=>p.mid - p.curve,
                    y: (p)=>p.asc
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.asc
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid + p.curve,
                    y: (p)=>p.asc
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus + .1 + p.curve
                },
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus + .1
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus + .1 - p.curve * .4
                },
                {
                    x: (p)=>p.mid * 1.5 + p.curve * .4,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.mid * 1.5,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_BEZIER),
            d: [
                {
                    x: (p)=>p.mid * 1.5 - p.curve * .5,
                    y: (p)=>p.corpus
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus * .75 + p.curve * .5
                },
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus * .75
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline + .2
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline + .1
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.baseline
                }
            ]
        }
    ]),
    "'": new (0, _glyphJs.Glyph)(.3, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.asc * .9
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.mid,
                    y: (p)=>p.corpus
                }
            ]
        }
    ]),
    '"': new (0, _glyphJs.Glyph)(.3, [
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.asc * .9
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.left,
                    y: (p)=>p.corpus
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_MOVE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.asc * .9
                }
            ]
        },
        {
            op: (0, _drawingopsJs.OP_LINE),
            d: [
                {
                    x: (p)=>p.right,
                    y: (p)=>p.corpus
                }
            ]
        }
    ])
};
const DEFAULT_PARAMS = {
    "baseline_from_top": 0.7,
    "cap": 0.6,
    "asc": 0.7,
    "desc": -0.3,
    "corpus": 0.3,
    "bar": 0.1,
    "linethickness": .05,
    "curve": 0.10,
    "aperture": 0.7,
    "leading": .1,
    "tracking": .1,
    "nominalwidth": .4,
    // maybe don't let people override these two?
    // they are here for convenience
    "baseline": 0,
    "left": 0
};
const DEFAULT_PXPARAMS = {
    "fontsize": 90,
    "left_kerning": 0,
    "right_kerning": 0,
    "slop": 0
};
let defaultParamsHaveBeenSet = false;
let defaultParams = {};
class Basic extends (0, _fontJs.Font) {
    constructor(pxparams, inparams){
        super(pxparams, inparams);
        if (!defaultParamsHaveBeenSet) {
            defaultParams = this.setDerivedParams(DEFAULT_PARAMS, {});
            defaultParamsHaveBeenSet = true;
        }
    }
    getDefaultParams() {
        return defaultParams;
    }
    getDefaultPxparams() {
        return DEFAULT_PXPARAMS;
    }
    createWithParams(pxparams, inparams) {
        return new Basic(pxparams, inparams);
    }
    copy() {
        let r = new Basic(this.copyParams(this.pxparams), this.copyParams(this.params));
        r.setLetter(this.letter);
        return r;
    }
    getFontName() {
        return "basic";
    }
    setDerivedParams(params, inparams) {
        if (!inparams.bar) params.bar = params.corpus / 2;
        if (!inparams.curve) params.curve = params.corpus * 0.28;
        return params; // no additional params or changes to defaults
    }
    getGlyphs() {
        return GLYPHS;
    }
}

},{"./drawingops.js":"2cdWk","./glyph.js":"7rI3r","./font.js":"7HiYd","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"2cdWk":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "MoveOp", ()=>MoveOp);
parcelHelpers.export(exports, "OP_MOVE", ()=>OP_MOVE);
parcelHelpers.export(exports, "BezierOp", ()=>BezierOp);
parcelHelpers.export(exports, "OP_BEZIER", ()=>OP_BEZIER);
parcelHelpers.export(exports, "LineOp", ()=>LineOp);
parcelHelpers.export(exports, "OP_LINE", ()=>OP_LINE);
parcelHelpers.export(exports, "BezierPlotOp", ()=>BezierPlotOp);
parcelHelpers.export(exports, "OP_BEZIERPLOT", ()=>OP_BEZIERPLOT);
var _bezierJs = require("./bezier.js");
const OP_MOVE = 0;
const OP_BEZIER = 1;
const OP_LINE = 2;
const OP_BEZIERPLOT = 3;
class MoveOp {
    constructor(x, y){
        this.type = OP_MOVE;
        this.x = x;
        this.y = y;
    }
    setParams(params) {
        // should just be one
        this.x = params[0].x;
        this.y = params[0].y;
    }
    draw(ctx) {
        ctx.moveTo(this.x, this.y);
    }
}
class BezierOp {
    constructor(cp1x, cp1y, cp2x, cp2y, endx, endy){
        this.type = OP_BEZIER;
        this.cp1x = cp1x;
        this.cp1y = cp1y;
        this.cp2x = cp2x;
        this.cp2y = cp2y;
        this.endx = endx;
        this.endy = endy;
    }
    setParams(params) {
        // should just be one
        this.cp1x = params[0].x;
        this.cp1y = params[0].y;
        this.cp2x = params[1].x;
        this.cp2y = params[1].y;
        this.endx = params[2].x;
        this.endy = params[2].y;
    }
    draw(ctx) {
        ctx.bezierCurveTo(this.cp1x, this.cp1y, this.cp2x, this.cp2y, this.endx, this.endy);
    }
}
class LineOp {
    constructor(x, y){
        this.type = OP_LINE;
        this.x = x;
        this.y = y;
    }
    setParams(params) {
        // should just be one
        this.x = params[0].x;
        this.y = params[0].y;
    }
    draw(ctx) {
        ctx.lineTo(this.x, this.y);
    }
}
class BezierPlotOp {
    constructor(p1x, p1y, cp1x, cp1y, cp2x, cp2y, p2x, p2y, stopat){
        this.type = OP_BEZIERPLOT;
        this.p1x = p1x;
        this.p1y = p1y;
        this.cp1x = cp1x;
        this.cp1y = cp1y;
        this.cp2x = cp2x;
        this.cp2y = cp2y;
        this.p2x = p2x;
        this.p2y = p2y;
    }
    setParams(params) {
        // should just be one
        this.aperture = params[0].val;
        this.p1x = params[1].x;
        this.p1y = params[1].y;
        this.cp1x = params[2].x;
        this.cp1y = params[2].y;
        this.cp2x = params[3].x;
        this.cp2y = params[3].y;
        this.p2x = params[4].x;
        this.p2y = params[4].y;
    }
    draw(ctx) {
        new (0, _bezierJs.Bezier)(this.p1x, this.p1y, this.cp1x, this.cp1y, this.cp2x, this.cp2y, this.p2x, this.p2y).plot(ctx, this.aperture);
    }
}

},{"./bezier.js":"jmBFB","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"jmBFB":[function(require,module,exports) {
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
*/ // defaults to cubic
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Bezier", ()=>Bezier);
class Bezier {
    constructor(p1x, p1y, cp1x, cp1y, cp2x, cp2y, p2x, p2y){
        this.p1x = p1x;
        this.p1y = p1y;
        this.cp1x = cp1x;
        this.cp1y = cp1y;
        this.cp2x = cp2x;
        this.cp2y = cp2y;
        this.p2x = p2x;
        this.p2y = p2y;
    }
    // general form of the cubic bezier: the exponents for 1-t decrease while the
    // exponent for 1 increases, we use binomial coefficients 1/3/3/1
    //
    // B(t) =     1 * (1 - t)^3 * t^0 *  p1
    // 			+ 3 * (1 - t)^2 * t^1 * cp1
    //			+ 3 * (1 - t)^1 * t^2 * cp2
    //			+ 1 * (1 - t)^0 * t^3 *  p2
    plot(ctx, stopat) {
        if (!stopat) stopat = 1.0;
        // how many iterations? Let's plan on one per pixel.
        // But we could be rendering at different font sizes.
        // So we use the pythagorean theorem to get the pixel
        // distance between the start and end pixel.
        // The actual glyph will cover a longer distance, since
        // it's a curve, but it shouldn't be THAT much longer.
        let dist = Math.sqrt(Math.pow(this.p1x - this.p2x, 2) + Math.pow(this.p1y - this.p2y, 2));
        let inc = 1.0 / dist;
        ctx.moveTo(this.p1x, this.p1y);
        for(let t = 0.0; t < stopat; t += inc){
            // suck it indentation nerds, this is a work of art
            let x = Math.pow(1 - t, 3) * this.p1x + 3 * Math.pow(1 - t, 2) * t * this.cp1x + 3 * (1 - t) * Math.pow(t, 2) * this.cp2x + Math.pow(t, 3) * this.p2x;
            let y = Math.pow(1 - t, 3) * this.p1y + 3 * Math.pow(1 - t, 2) * t * this.cp1y + 3 * (1 - t) * Math.pow(t, 2) * this.cp2y + Math.pow(t, 3) * this.p2y;
            ctx.lineTo(x, y);
        }
    }
}

},{"@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"7rI3r":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Glyph", ()=>Glyph);
class Glyph {
    constructor(unitwidth, drawinstructions){
        // a unitwidth of 1.0 would mean that the
        // glyph was perfectly square, assuming its height
        // is the same as the nominal font height.
        this.unitwidth = unitwidth;
        this.drawinstructions = drawinstructions;
    }
    getWidth() {
        return this.unitwidth;
    }
    getInstructions() {
        return this.drawinstructions;
    }
}

},{"@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"7HiYd":[function(require,module,exports) {
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
*/ // useful tool: https://www.metaflop.com/modulator
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Font", ()=>Font);
var _penJs = require("./pen.js");
var _drawingopsJs = require("./drawingops.js");
// Here's how these params work.
// 1.0 = the font height
//
// "baseline" is a vector from the top of the nominal glyph
// (the flow element) to the baseline.
//
// All other values are vectors from the baseline, with
// positive values pointing up.
//
// For example, if a glyph exactly matches the nominal font
// size, i.e. zero leading, then if baseline
// is 0.7, then ascender is also 0.7, and
// descender is -0.3.
//
// for some metrics, this is "distance along the bezier"
// so in some cases rather than drawing the entire curve,
// we draw some of it, and the parameter governs how much of
// it we draw (how far along the bezier we go). Example:
// bottom of lowercase e, bottom and top of lowercase c, etc.
const FONT_DEBUG = false;
class Font {
    constructor(pxparams, inparams){
        this.setParams(pxparams, inparams);
        this.flowElement = null;
        this.previousSlop = -1;
        this.previousFontSize = -1;
        this.letter = null;
        this.glyph = null;
        this.needsRedraw = false;
    }
    setParams(inpxparams, inparams) {
        // A user might want to override something like corpus,
        // and this particular font might have logic such that
        // curve is dependent on corpus.
        // Also, the user might want to separately override curve.
        // That's why we override twice. The first time we override,
        // all the values the user specified get put in. Then
        // the font has a chance to set values based on its own
        // internal logic, and anything the user set previously
        // would be factored in. Finally, the user has a final
        // chance to override those values again.
        let pxparams = this.copyParams(this.getDefaultPxparams());
        this.overrideParams(pxparams, inpxparams);
        this.pxparams = pxparams;
        let params = this.copyParams(this.getDefaultParams());
        this.overrideParams(params, inparams);
        this.setDerivedParams(params, inparams);
        this.params = params;
        if (this.glyph) this.setParamsDerivedFromGlyph();
        this.needsRedraw = true;
    }
    getDefaultPxparams() {
        return {};
    }
    getDefaultParams() {
        return {};
    }
    copyParams(copyFrom) {
        let r = {};
        for(let p in copyFrom)r[p] = copyFrom[p];
        return r;
    }
    overrideParams(params, inparams) {
        for(let p in inparams)if (params[p]) params[p] = inparams[p];
    }
    /**
	 * Some params might be related to others. For example, "bar" might be some
	 * multiple of corpus height. If someone tweaking the font overrides/sets
	 * corpus height but doesn't set bar, we want bar to adjust. Each font should
	 * override this method to perform these tweaks.
	 */ setDerivedParams(params, inparams) {
    // no op, should override
    }
    setupCanvas(flowelement, lineheight_px, fontsize_px, baselineFromTop_px, glyphwidth_px, kerningleft_px, kerningright_px, tracking_px, slop_px) {
        // see http://www.vodka.church/fonts/ for more info on
        // how I derived these formulas.
        // height
        let canvasheight_px = fontsize_px + slop_px;
        let leading_px = lineheight_px - fontsize_px;
        let flowelementheight_px = fontsize_px + leading_px;
        let canvastop_px = leading_px / 2 - slop_px / 2;
        // width
        let canvaswidth_px = glyphwidth_px + slop_px;
        let leftSpacing_px = (tracking_px + kerningleft_px) / 2;
        let canvasleft_px = leftSpacing_px - slop_px / 2;
        let rightSpacing_px = (tracking_px + kerningright_px) / 2;
        let flowElementWidth_px = glyphwidth_px + leftSpacing_px + rightSpacing_px;
        let canvas = document.createElement("canvas");
        canvas.setAttribute("height", `${canvasheight_px}px;`);
        canvas.setAttribute("width", `${canvaswidth_px}px;`);
        let canvasStyle = "position:absolute;";
        canvasStyle += `top:${canvastop_px}px;`;
        canvasStyle += `left:${canvasleft_px}px;`;
        flowelement.appendChild(canvas);
        let flowElementStyle = "position:relative;";
        flowElementStyle += `width:${flowElementWidth_px}px;`;
        flowElementStyle += `height:${fontsize_px}px;`;
        if (FONT_DEBUG) {
            let r1 = Math.round(Math.random() * 7);
            let r2 = Math.round(Math.random() * 7);
            let r3 = Math.round(Math.random() * 7);
            flowElementStyle += `background-color:#${r1}0b${r2}${r3}0;`;
        }
        canvas.setAttribute("style", canvasStyle);
        flowelement.setAttribute("style", flowElementStyle);
        return canvas;
    }
    getFontName() {
        return "";
    }
    calculateSlop(asc, desc, pt_px) {
        let requestedSlop = this.pxparams.slop;
        // hard-coded slop, ignore required slop and previous slop.
        if (requestedSlop != 0) return requestedSlop;
        // ok we will calculate slop.
        let requiredSlop = 0;
        let totalheight = asc + -desc;
        let extraheight = totalheight - 1.0;
        if (extraheight > 0) requiredSlop = pt_px * extraheight * 1.1;
        else requiredSlop = pt_px * .2; // idk
        // now that we have required slop, we look to see
        // whether we've already exceeded that slop.
        if (this.previousSlop >= requiredSlop) return this.previousSlop;
        else // don't change previous slop yet.
        return requiredSlop + 20; // change in increments of 20
    }
    rebuildCanvas(pt_px, baseline_from_top, slop_px, lineheight_px, left_kerning_px, right_kerning_px, tracking_px) {
        this.pen = new (0, _penJs.Pen)(pt_px, baseline_from_top, slop_px);
        this.flowElement = document.createElement("div");
        this.canvas = this.setupCanvas(this.flowElement, lineheight_px, pt_px, /* fontsize_px */ baseline_from_top * pt_px, /* baselineFromTop_px */ this.params.width * pt_px, /* glyphwidth_px */ left_kerning_px, right_kerning_px, tracking_px, slop_px);
    }
    maybeEval(x) {
        let cap = this.params.cap; // capital letter (like M)
        let asc = this.params.asc; // ascender (lowercase l)
        let desc = this.params.desc; // desc (bottom of y)
        let corpus = this.params.corpus; // aka x-height
        let bar = this.params.bar; // middle bar in lowercase e
        let curve = this.params.curve; // used for control points
        let aperture = this.params.aperture; // opening in c, e
        let left = this.params.left;
        let right = this.params.right;
        let baseline = this.params.baseline;
        let mid = this.params.mid;
        let width = this.params.width;
        if (typeof x == "string") return eval(x);
        else return x(this.params);
    }
    // this will at some point be expanded to also set the context,
    // i.e. letter before or after
    setLetter(letter) {
        if (this.letter == letter) return;
        this.needsRedraw = true;
        this.letter = letter;
        this.glyph = this.getGlyphs()[letter];
        if (!this.glyph) this.glyph = this.getGlyphs()["a"];
        this.setParamsDerivedFromGlyph();
    }
    setParamsDerivedFromGlyph() {
        this.params.width = this.glyph.getWidth() * this.params.nominalwidth;
        this.params.right = this.params.width;
        this.params.mid = this.params.width / 2;
    }
    drawIntoDomNode() {
        let pt_px = this.pxparams.fontsize; // font height in pixels
        let left_kerning_px = this.pxparams.left_kerning;
        let right_kerning_px = this.pxparams.right_kerning;
        let lineheight_px = pt_px + pt_px * this.params.leading;
        let tracking_px = pt_px * this.params.tracking;
        let linethickness = this.params.linethickness;
        let baseline_from_top = this.params.baseline_from_top;
        let cap = this.params.cap;
        let asc = this.params.asc;
        let desc = this.params.desc;
        let corpus = this.params.corpus;
        let bar = this.params.bar;
        let curve = this.params.curve;
        let aperture = this.params.aperture;
        let slop_px = this.calculateSlop(asc, desc, pt_px);
        let shouldRebuildCanvas = false;
        if (this.flowElement == null) shouldRebuildCanvas = true;
        if (slop_px != this.previousSlop) {
            shouldRebuildCanvas = true;
            this.previousSlop = slop_px;
        }
        if (pt_px != this.previousFontSize) {
            shouldRebuildCanvas = true;
            this.previousFontSize = pt_px;
        }
        if (shouldRebuildCanvas) {
            this.needsRedraw = true;
            this.rebuildCanvas(pt_px, baseline_from_top, slop_px, lineheight_px, left_kerning_px, right_kerning_px, tracking_px);
        }
        if (this.needsRedraw) {
            let ctx = this.canvas.getContext("2d");
            ctx.lineWidth = linethickness * pt_px;
            ctx.beginPath();
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            let instructions = this.glyph.getInstructions();
            for(let i = 0; i < instructions.length; i++){
                let oprecord = instructions[i];
                let opobj = this.createOp(oprecord.op);
                let params = [];
                for(let i = 0; i < oprecord.d.length; i++){
                    let p = oprecord.d[i];
                    params[i] = {};
                    if (p.x) params[i].x = this.pen.xToPx(this.maybeEval(p.x));
                    if (p.y) params[i].y = this.pen.yToPx(this.maybeEval(p.y));
                    if (p.val) params[i].val = this.maybeEval(p.val);
                }
                opobj.setParams(params);
                opobj.draw(ctx);
            }
            ctx.stroke();
            this.needsRedraw = false;
        }
        return this.flowElement;
    }
    createOp(opstr) {
        switch(opstr){
            case 0, _drawingopsJs.OP_MOVE:
                return new (0, _drawingopsJs.MoveOp)();
            case 0, _drawingopsJs.OP_BEZIER:
                return new (0, _drawingopsJs.BezierOp)();
            case 0, _drawingopsJs.OP_BEZIERPLOT:
                return new (0, _drawingopsJs.BezierPlotOp)();
            case 0, _drawingopsJs.OP_LINE:
                return new (0, _drawingopsJs.LineOp)();
        }
    }
}

},{"./pen.js":"koGn9","./drawingops.js":"2cdWk","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"koGn9":[function(require,module,exports) {
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
*/ /**
 * This class converts relative values (floats) to actual pixel values.
 */ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Pen", ()=>Pen);
class Pen {
    constructor(fontSizeInPixels, defaultBaselineFloat, slopInPixels){
        this.fontSizeInPixels = fontSizeInPixels;
        this.defaultBaselineFloat = defaultBaselineFloat;
        this.slopInPixels = slopInPixels;
    }
    xToPx(val) {
        return this.fontSizeInPixels * val + this.slopInPixels / 2;
    }
    yToPx(val) {
        return this.fontSizeInPixels * (-val + this.defaultBaselineFloat) + this.slopInPixels / 2;
    }
}

},{"@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"eYIvj":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "WeirdHelvetica", ()=>WeirdHelvetica);
var _drawingopsJs = require("./drawingops.js");
var _glyphJs = require("./glyph.js");
var _fontJs = require("./font.js");
const GLYPHS = {
    " ": new (0, _glyphJs.Glyph)(1.0, []),
    "a": new (0, _glyphJs.Glyph)(0.8, [
        new (0, _drawingopsJs.MoveOp)("left", "p.corpmidtop"),
        new (0, _drawingopsJs.BezierOp)("left", "p.corpmidtop + curve", "mid - curve", "corpus", "mid", "corpus"),
        new (0, _drawingopsJs.BezierOp)("mid + curve", "corpus", "right", "p.corpmidtop + curve", "right", "p.corpmidtop"),
        new (0, _drawingopsJs.BezierOp)("right", "p.corpmidtop - curve", "mid + curve", "p.corpmid", "mid", "p.corpmid"),
        new (0, _drawingopsJs.BezierOp)("mid - curve", "p.corpmid", "left", "p.corpmidbottom + curve", "left", "p.corpmidbottom"),
        new (0, _drawingopsJs.BezierOp)("left", "p.corpmidbottom - curve", "mid - curve", "baseline", "mid", "baseline"),
        new (0, _drawingopsJs.BezierOp)("mid + curve", "baseline", "right", "p.corpmidbottom - curve", "right", "p.corpmidbottom"),
        new (0, _drawingopsJs.MoveOp)("right", "p.corpmidtop"),
        new (0, _drawingopsJs.LineOp)("right", "p.corpmidbottom"),
        new (0, _drawingopsJs.BezierOp)("right", "p.corpmidbottom - curve", "right * 1.2 - curve", "baseline", "right * 1.2", "baseline")
    ])
};
const DEFAULT_PARAMS = {
    "baseline": 0.7,
    "cap": 0.6,
    "asc": 0.7,
    "desc": -0.3,
    "corpus": 0.3,
    "bar": 0.1,
    "linethickness": .05,
    "curve": 0.08,
    "aperture": 0.7,
    "leading": .1,
    "tracking": .1,
    "corpmidtop": 0.3 * .75,
    "corpmid": 0.15,
    "corpmidbottom": 0.075
};
const DEFAULT_PXPARAMS = {
    "fontsize": 90,
    "left_kerning": 0,
    "right_kerning": 0,
    "slop": 0
};
let defaultParamsHaveBeenSet = false;
let defaultParams = {};
class WeirdHelvetica extends (0, _fontJs.Font) {
    constructor(pxparams, inparams){
        super(pxparams, inparams);
        if (!defaultParamsHaveBeenSet) {
            defaultParams = this.setDerivedParams(DEFAULT_PARAMS, {});
            defaultParamsHaveBeenSet = true;
        }
    }
    getDefaultParams() {
        return defaultParams;
    }
    getDefaultPxparams() {
        return DEFAULT_PXPARAMS;
    }
    createWithParams(pxparams, inparams) {
        return new WeirdHelvetica(pxparams, inparams);
    }
    getFontName() {
        return "weirdhelvetica";
    }
    setDerivedParams(params, inparams) {
        if (!inparams.corpmidtop) params.corpmidtop = params.corpus * .75;
        if (!inparams.corpmid) params.corpmid = params.corpus * .5;
        if (!inparams.corpmidbottom) params.corpmidbottom = params.corpus * .25;
        return params; // no additional params or changes to defaults
    }
    getGlyphs() {
        return GLYPHS;
    }
}

},{"./drawingops.js":"2cdWk","./glyph.js":"7rI3r","./font.js":"7HiYd","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"egKmR":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Separator", ()=>Separator);
parcelHelpers.export(exports, "constructSeparator", ()=>constructSeparator);
var _letterJs = require("./letter.js");
var _globalappflagsJs = require("../globalappflags.js");
var _globalconstantsJs = require("../globalconstants.js");
var _heapJs = require("../heap.js");
var _eerrorJs = require("./eerror.js");
class Separator extends (0, _letterJs.Letter) {
    constructor(letter){
        super(letter);
    }
    makeCopy() {
        let r = constructSeparator(this.getText());
        this.copyFieldsTo(r);
        return r;
    }
    getTypeName() {
        return "-separator-";
    }
    // makeCopy is same as superclass
    toString(version) {
        if (version == "v2") return this.toStringV2();
        return "|[" + this.getText() + "]|";
    }
    toStringV2() {
        return `[${this.toStringV2Literal()}separator]${this.toStringV2PrivateDataSection(this.getText())}${this.toStringV2TagList()}`;
    }
    getKeyFunnel() {
        return new SeparatorKeyFunnel(this);
    }
    renderInto(renderNode, renderFlags, withEditor) {
        let domNode = renderNode.getDomNode();
        super.renderInto(renderNode, renderFlags, withEditor);
        domNode.classList.add("separator");
        domNode.classList.add("data");
        if (renderFlags & (0, _globalconstantsJs.RENDER_FLAG_INSERT_AFTER)) domNode.classList.add("rightinsert");
        else domNode.classList.add("leftinsert");
    }
    getEventTable(context) {
        return null;
    }
    getDefaultHandler() {
        return "separatorDefault";
    }
    getEventTable() {
        return {
            "Tab": "move-to-next-leaf",
            "ArrowUp": "move-to-corresponding-letter-in-previous-line",
            "ArrowDown": "move-to-corresponding-letter-in-next-line",
            "ArrowLeft": "move-to-previous-leaf",
            "ArrowRight": "move-to-next-leaf",
            "ShiftBackspace": "delete-separator",
            "Backspace": "delete-separator",
            "Enter": "do-line-break-for-separator",
            "!": "insert-actual-!-at-insertion-point-from-separator",
            "@": "insert-actual-@-at-insertion-point-from-separator",
            "#": "insert-actual-#-at-insertion-point-from-separator",
            "$": "insert-actual-$-at-insertion-point-from-separator",
            "%": "insert-actual-%-at-insertion-point-from-separator",
            "^": "insert-actual-^-at-insertion-point-from-separator",
            "&": "insert-actual-&-at-insertion-point-from-separator",
            "*": "insert-actual-*-at-insertion-point-from-separator",
            "(": "insert-actual-(-at-insertion-point-from-separator",
            ")": "insert-actual-)-at-insertion-point-from-separator",
            "[": "insert-actual-[-at-insertion-point-from-separator",
            "{": "insert-actual-{-at-insertion-point-from-separator",
            "<": "insert-actual-<-at-insertion-point-from-separator"
        };
    }
    memUsed() {
        return super.memUsed() + (0, _heapJs.heap).sizeSeparator();
    }
}
function constructSeparator(letter) {
    if (!(0, _heapJs.heap).requestMem((0, _heapJs.heap).sizeSeparator())) throw (0, _eerrorJs.constructFatalError)(`OUT OF MEMORY: cannot allocate Separator.
stats: ${(0, _heapJs.heap).stats()}`);
    return (0, _heapJs.heap).register(new Separator(letter));
}

},{"./letter.js":"keNY2","../globalappflags.js":"1FpbG","../globalconstants.js":"3d62t","../heap.js":"67mlv","./eerror.js":"4Xsbj","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"8ndp7":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "keyDispatcher", ()=>keyDispatcher);
var _utilsJs = require("./utils.js");
var _globalconstantsJs = require("./globalconstants.js");
var _systemstateJs = require("./systemstate.js");
var _environmentJs = require("./environment.js");
var _manipulatorJs = require("./manipulator.js");
var _actionsJs = require("./actions.js");
var _evaluatorinterfaceJs = require("./evaluatorinterface.js");
var _globalappflagsJs = require("./globalappflags.js");
class KeyDispatcher {
    constructor(){
        this.nqmarks = 0;
        this.uiCallbackObject = null;
    }
    setUiCallbackObject(obj) {
        this.uiCallbackObject = obj;
    }
    shouldBubble(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt) {
        let eventName = this.getEventName(keycode, hasShift, hasCtrl, hasMeta, hasAlt, whichkey);
        if (eventName == "Meta-+" || eventName == "Meta--") return true;
        if (hasMeta && keycode == "2") return true;
        return false;
    }
    dispatch(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt) {
        // don't need to do anything with modifier key presses directly, and having them go through the pipline
        // makes it hard to debug key presses.
        //
        // returning true means "don't cancel browser event" - this weirdly only affects the tests
        if (keycode == "CapsLock") return;
        if (keycode == "Shift") return;
        if (keycode == "Alt") return;
        if (keycode == "Meta") return;
        if (keycode == "Control") return;
        if (hasMeta && keycode == "2") return;
        let eventName = this.getEventName(keycode, hasShift, hasCtrl, hasMeta, hasAlt, whichkey);
        if ((0, _systemstateJs.systemState).getGlobalSelectedNode().usingEditor()) {
            // Will either return a keycode, or null.
            // if a keycode, we reroute that keycode (handle it below), else we exit.
            // if it returns null it means that the editor handled the key
            // usually it won't change the keycode, but it can.
            eventName = this.doEditorEvent(eventName);
            if (eventName === null) return;
        }
        // there are a few special cases
        if (eventName == "|") ;
        else if (eventName == "Meta-z") (0, _actionsJs.undo)();
        else if (eventName == "Meta-y") (0, _actionsJs.redo)();
        else if (eventName == "Meta-s") {
            let rn = (0, _manipulatorJs.manipulator).doSave();
            if (rn) (0, _evaluatorinterfaceJs.evaluateAndKeep)(rn);
        } else if (eventName == "Meta-x") (0, _manipulatorJs.manipulator).doCut();
        else if (eventName == "Meta-c") (0, _manipulatorJs.manipulator).doCopy();
        else if (eventName == "Meta-v") (0, _manipulatorJs.manipulator).doPaste();
        else if (eventName == "Escape" && !(0, _systemstateJs.systemState).getGlobalSelectedNode().usingEditor()) this.toggleGlobalExplodedMode();
        else {
            // 1. look in override table
            // 2. look in regular table
            // 3. call defaultHandle
            // otherwise try the table first, then the keyfunnel
            if (window.legacyEnterBehaviorForTests && eventName == "ShiftEnter" && ((0, _systemstateJs.systemState).getGlobalSelectedNode().getNex().getTypeName() == "-command-" || (0, _systemstateJs.systemState).getGlobalSelectedNode().getNex().getTypeName() == "-symbol-")) eventName = "Enter";
            try {
                let sourceNode = (0, _systemstateJs.systemState).getGlobalSelectedNode();
                let actionName = this.getActionNameFromRegularTable(sourceNode, eventName);
                if (!actionName) actionName = this.getActionNameFromGenericTable(sourceNode, eventName);
                if (!actionName || actionName == "JUST_USE_DEFAULT") actionName = this.getDefaultHandleActionName(sourceNode, eventName);
                if (actionName) {
                    // we don't save the source node because it becomes irrelevant
                    // if we undo and then redo
                    let action = (0, _actionsJs.actionFactory)(actionName, eventName);
                    (0, _actionsJs.enqueueAndPerformAction)(action);
                }
            } catch (e) {
                if (e == (0, _globalconstantsJs.UNHANDLED_KEY)) console.log("UNHANDLED KEY :keycode=" + keycode + "," + "whichkey=" + whichkey + "," + "hasShift=" + hasShift + "," + "hasCtrl=" + hasCtrl + "," + "hasMeta=" + hasMeta);
                else throw e;
            }
        }
    }
    getActionNameFromRegularTable(sourceNode, eventName) {
        let table = sourceNode.nex.getEventTable();
        if (!table) return "";
        let f = table[eventName];
        if (f) return f;
        return "";
    }
    getActionNameFromGenericTable(sourceNode, eventName) {
        let table = null;
        if (sourceNode.nex.isNexContainer()) table = this.getNexContainerGenericTable();
        else table = this.getNexGenericTable();
        let f = table[eventName];
        if (f) return f;
        return "";
    }
    getDefaultHandleActionName(sourceNode, eventName) {
        let fname = "standardDefault";
        if (sourceNode.nex.getDefaultHandler) {
            let f = sourceNode.nex.getDefaultHandler();
            if (f) return f;
        }
        return "";
    }
    doEditorEvent(eventName) {
        // events are handled differently when an editor is being used
        // all events are routed to the editor instead of the nex, until the editor
        // is finished.
        // right now we just have an editor for tags but we will need editors for
        // strings, symbols, commands/lambdas.
        return (0, _systemstateJs.systemState).getGlobalSelectedNode().routeKeyToCurrentEditor(eventName);
    }
    getEventName(keycode, hasShift, hasCtrl, hasMeta, hasAlt, whichKey) {
        let eventName = this.getEventNameImpl(keycode, hasShift, hasCtrl, hasMeta, hasAlt, whichKey);
        eventName = eventName.replace(/^Ctrl/, "Alt");
        return eventName;
    }
    getEventNameImpl(keycode, hasShift, hasCtrl, hasMeta, hasAlt, whichKey) {
        // maybe I should rewrite this to do something like this:
        // return `${shiftPrefix}${MetaPrefix}${keycode}`
        // the only thing is I don't want it to return 'Shift!' or 'Shift$'
        if (keycode == "Enter" && hasMeta && hasShift) return "ShiftMetaEnter";
        else if (keycode == "Enter" && hasMeta) return "MetaEnter";
        else if (keycode == "Enter" && hasCtrl) return "CtrlEnter";
        else if (keycode == "Enter" && hasShift) return "ShiftEnter";
        else if (keycode == "ArrowDown" && hasAlt) return "AltArrowDown";
        else if (keycode == "ArrowUp" && hasAlt) return "AltArrowUp";
        else if (keycode == "ArrowRight" && hasAlt) return "AltArrowRight";
        else if (keycode == "ArrowLeft" && hasAlt) return "AltArrowLeft";
        else if (keycode == "ArrowDown" && hasCtrl) return "CtrlArrowDown";
        else if (keycode == "ArrowUp" && hasCtrl) return "CtrlArrowUp";
        else if (keycode == "ArrowRight" && hasCtrl) return "CtrlArrowRight";
        else if (keycode == "ArrowLeft" && hasCtrl) return "CtrlArrowLeft";
        else if (keycode == "ArrowDown" && hasShift) return "ShiftArrowDown";
        else if (keycode == "ArrowUp" && hasShift) return "ShiftArrowUp";
        else if (keycode == "ArrowRight" && hasShift) return "ShiftArrowRight";
        else if (keycode == "ArrowLeft" && hasShift) return "ShiftArrowLeft";
        else if (keycode == "Escape" && hasAlt && hasShift) return "ShiftAltEscape";
        else if (keycode == "Escape" && hasAlt) return "AltEscape";
        else if (keycode == "Escape" && hasShift) return "ShiftEscape";
        else if (keycode == "Tab" && hasShift && hasAlt) return "ShiftAltTab";
        else if (keycode == "Tab" && hasShift && hasCtrl) return "ShiftCtrlTab";
        else if (keycode == "Tab" && hasAlt) return "AltTab";
        else if (keycode == "Tab" && hasCtrl) return "CtrlTab";
        else if (keycode == "Tab" && hasShift) return "ShiftTab";
        else if (keycode == " " && hasShift) return "ShiftSpace";
        else if (keycode == " " && hasCtrl) return "CtrlSpace";
        else if ((keycode == " " || whichKey == "Space") && hasAlt) return "AltSpace";
        else if (keycode == " " && hasMeta) return "MetaSpace";
        else if (keycode == "`" && hasAlt && hasShift) return "Alt~";
        else if (keycode == "Dead" && whichKey == "Backquote" && hasAlt && !hasShift) return "Alt`";
        else if (whichKey == "Digit6" && hasAlt && hasShift) return "Alt^";
        else if (whichKey == "Digit7" && hasAlt && hasShift) return "Alt&";
        else if (whichKey == "Digit8" && hasAlt && hasShift) return "Alt*";
        else if (whichKey == "Digit9" && hasAlt && hasShift) return "Alt(";
        else if (whichKey == "Comma" && hasAlt && hasShift) return "Alt<";
        else if (whichKey == "BracketLeft" && hasAlt && !hasShift) return "Alt[";
        else if (whichKey == "BracketLeft" && hasAlt && hasShift) return "Alt{";
        else if (keycode == "`" && hasCtrl && hasShift) return "Ctrl~";
        else if (keycode == "Dead" && whichKey == "Backquote" && hasCtrl && !hasShift) return "Ctrl`";
        else if (whichKey == "Digit7" && hasCtrl && hasShift) return "Ctrl&";
        else if (whichKey == "Digit8" && hasCtrl && hasShift) return "Ctrl*";
        else if (whichKey == "Digit9" && hasCtrl && hasShift) return "Ctrl(";
        else if (whichKey == "Digit0" && hasCtrl && hasShift) return "Ctrl)";
        else if (whichKey == "BracketLeft" && hasCtrl && !hasShift) return "Ctrl[";
        else if (whichKey == "BracketLeft" && hasCtrl && hasShift) return "Ctrl{";
        else if (keycode == "Backspace" && hasShift && hasAlt) return "AltShiftBackspace";
        else if (keycode == "Backspace" && hasShift && hasCtrl) return "CtrlShiftBackspace";
        else if (keycode == "Backspace" && hasShift) return "ShiftBackspace";
        else if (keycode == "Backspace" && hasCtrl) return "CtrlBackspace";
        else if (keycode == "Backspace" && hasAlt) return "AltBackspace";
        else if (keycode == "z" && hasCtrl) return "Meta-z";
        else if (keycode == "x" && hasCtrl) return "Meta-x";
        else if (keycode == "c" && hasCtrl) return "Meta-c";
        else if (keycode == "v" && hasCtrl) return "Meta-v";
        else if (keycode == "s" && hasCtrl) return "Meta-s";
        else if (keycode == "z" && hasMeta) return "Meta-z";
        else if (keycode == "x" && hasMeta) return "Meta-x";
        else if (keycode == "c" && hasMeta) return "Meta-c";
        else if (keycode == "v" && hasMeta) return "Meta-v";
        else if (keycode == "y" && hasMeta) return "Meta-y";
        else if (keycode == "s" && hasMeta) return "Meta-s";
        else if (keycode == "=" && hasMeta) return "Meta-+";
        else if (keycode == "-" && hasMeta) return "Meta--";
        else return keycode;
    }
    toggleGlobalExplodedMode() {
        let root = (0, _systemstateJs.systemState).getRoot();
        this.uiCallbackObject.setExplodedState(root.isExploded());
        root.toggleRenderMode();
    }
    getNexContainerGenericTable() {
        return {
            "ShiftTab": "select-parent",
            "Tab": "select-first-child-or-force-insert-inside-insertion-mode",
            "ArrowUp": "move-left-up",
            "ArrowLeft": "move-left-up",
            "ArrowDown": "move-right-down",
            "ArrowRight": "move-right-down",
            "AltArrowUp": "force-insert-before",
            "AltArrowDown": "force-insert-after",
            "AltArrowLeft": "force-insert-before",
            "AltArrowRight": "force-insert-after",
            "AltTab": "force-insert-inside",
            "ShiftAltTab": "force-insert-around",
            "ShiftEnter": "evaluate-nex-and-keep",
            "Enter": "evaluate-nex",
            "ShiftSpace": "toggle-dir",
            "ShiftBackspace": "remove-selected-and-select-previous-sibling",
            "AltShiftBackspace": "unroll",
            "LastBackspace": "remove-selected-and-select-previous-sibling-if-empty",
            "Backspace": "start-main-editor",
            "AltBackspace": "start-main-editor",
            "ShiftEscape": "toggle-exploded",
            "AltEnter": "start-main-editor",
            "~": "insert-command-at-insertion-point",
            "!": "insert-bool-at-insertion-point",
            "@": "insert-symbol-at-insertion-point",
            "#": "insert-integer-at-insertion-point",
            "$": "insert-string-at-insertion-point",
            "%": "insert-float-at-insertion-point",
            "^": "insert-instantiator-at-insertion-point",
            "&": "insert-lambda-at-insertion-point",
            "*": "insert-deferredcommand-at-insertion-point",
            "(": "insert-org-at-insertion-point",
            "[": "insert-line-at-insertion-point",
            "{": "insert-doc-at-insertion-point",
            "<": "insert-word-at-insertion-point",
            "_": "insert-wavetable-at-insertion-point",
            ")": "close-off-org",
            "]": "close-off-line",
            "}": "close-off-doc",
            ">": "close-off-word",
            "`": "add-tag",
            "\\": "toggle-collapsed",
            "Alt~": "wrap-in-command",
            "Alt&": "wrap-in-lambda",
            "Alt*": "wrap-in-deferredcommand",
            "Alt<": "wrap-in-word",
            "Alt(": "wrap-in-org",
            "Alt[": "wrap-in-line",
            "Alt{": "wrap-in-doc",
            "Alt^": "wrap-in-instantiator"
        };
    }
    getNexGenericTable() {
        return {
            "ShiftTab": "select-parent",
            "Tab": "move-right-down",
            "ArrowUp": "move-left-up",
            "ArrowDown": "move-right-down",
            "ArrowLeft": "move-left-up",
            "ArrowRight": "move-right-down",
            "AltArrowUp": "force-insert-before",
            "AltArrowDown": "force-insert-after",
            "AltArrowLeft": "force-insert-before",
            "AltArrowRight": "force-insert-after",
            "ShiftAltTab": "force-insert-around",
            "ShiftBackspace": "remove-selected-and-select-previous-sibling",
            "LastBackspace": "remove-selected-and-select-previous-sibling",
            "Backspace": "start-main-editor",
            "AltBackspace": "start-main-editor",
            "ShiftEscape": "toggle-exploded",
            "AltEnter": "start-main-editor",
            "ShiftEscape": "toggle-exploded",
            "Enter": "evaluate-nex",
            "~": "insert-command-at-insertion-point",
            "!": "insert-bool-at-insertion-point",
            "@": "insert-symbol-at-insertion-point",
            "#": "insert-integer-at-insertion-point",
            "$": "insert-string-at-insertion-point",
            "%": "insert-float-at-insertion-point",
            "^": "insert-instantiator-at-insertion-point",
            "&": "insert-lambda-at-insertion-point",
            "*": "insert-deferredcommand-at-insertion-point",
            "(": "insert-org-at-insertion-point",
            ")": "close-off-org",
            "[": "insert-line-at-insertion-point",
            "]": "close-off-line",
            "{": "insert-doc-at-insertion-point",
            "}": "close-off-doc",
            "<": "insert-word-at-insertion-point",
            ">": "close-off-word",
            "_": "insert-wavetable-at-insertion-point",
            "`": "add-tag",
            "Alt~": "wrap-in-command",
            "Alt&": "wrap-in-lambda",
            "Alt*": "wrap-in-deferredcommand",
            "Alt<": "wrap-in-word",
            "Alt(": "wrap-in-org",
            "Alt[": "wrap-in-line",
            "Alt{": "wrap-in-doc",
            "Alt^": "wrap-in-instantiator"
        };
    }
}
const keyDispatcher = new KeyDispatcher();

},{"./utils.js":"bIDtH","./globalconstants.js":"3d62t","./systemstate.js":"19Hkn","./environment.js":"4mXDy","./manipulator.js":"9qI89","./actions.js":"PABNc","./evaluatorinterface.js":"bVJbL","./globalappflags.js":"1FpbG","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"PABNc":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "actionFactory", ()=>actionFactory);
parcelHelpers.export(exports, "enqueueAndPerformAction", ()=>enqueueAndPerformAction);
parcelHelpers.export(exports, "undo", ()=>undo);
parcelHelpers.export(exports, "redo", ()=>redo);
var _systemstateJs = require("./systemstate.js");
var _keyresponsefunctionsJs = require("./keyresponsefunctions.js");
var _manipulatorJs = require("./manipulator.js");
var _eerrorJs = require("./nex/eerror.js");
const levelsOfUndo = 100;
const actionStack = [];
let nextPosition = 0;
let queueBottom = 0;
let queueTop = 0;
let numItemsInQueue = 0;
function advance(queuePos) {
    return (queuePos + 1) % levelsOfUndo;
}
function retreat(queuePos) {
    let p = queuePos - 1;
    if (p < 0) return p + levelsOfUndo;
    else return p;
}
function enqueueAndPerformAction(action) {
    actionStack[nextPosition] = action;
    if (nextPosition == queueTop) {
        queueTop = advance(queueTop);
        nextPosition = advance(nextPosition);
        if (numItemsInQueue == levelsOfUndo) queueBottom = advance(queueBottom);
        else numItemsInQueue++;
    } else nextPosition = advance(nextPosition);
    action.doAction();
}
function redo() {
    if (nextPosition != queueTop) {
        actionStack[nextPosition].doAction();
        nextPosition = advance(nextPosition);
    } else console.log("cannot redo");
}
function undo() {
    let pos = retreat(nextPosition);
    if (actionStack[pos].canUndo()) {
        nextPosition = pos;
        actionStack[nextPosition].undoAction();
    } else console.log("cannot undo");
}
class Action {
    constructor(actionName){
        this.actionName = actionName;
    }
    canUndo() {}
    doAction() {}
    undoAction() {}
}
// it doesn't matter what node was selected when the action was created,
// what matters is what is the currently selected node.
// If you want to undo and then redo, by the time you are redoing something,
// the selected node will be different - so we don't save the source node
// that generated the action.
class NoOpAction extends Action {
    constructor(actionName){
        super(actionName);
    }
    canUndo() {
        return true;
    }
    doAction() {}
    undoAction() {}
}
class TagEditorContentChangeAction extends Action {
    constructor(actionName){
        super(actionName);
    }
    canUndo() {
        return true;
    }
    doAction() {
        let selectedNode = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        let fakeEditor = selectedNode.getTagEditorForType(selectedNode.nex);
        this.savedEditorData = fakeEditor.getStateForUndo();
        (0, _keyresponsefunctionsJs.KeyResponseFunctions)[this.actionName](selectedNode);
    }
    undoAction() {
        let selectedNode = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        let fakeEditor = selectedNode.getTagEditorForType(selectedNode.nex);
        fakeEditor.setStateForUndo(this.savedEditorData);
    }
}
class EditorContentChangeAction extends Action {
    constructor(actionName){
        super(actionName);
    }
    canUndo() {
        return true;
    }
    doAction() {
        let selectedNode = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        let fakeEditor = selectedNode.getEditorForType(selectedNode.nex);
        this.savedEditorData = fakeEditor.getStateForUndo();
        (0, _keyresponsefunctionsJs.KeyResponseFunctions)[this.actionName](selectedNode);
    }
    undoAction() {
        // if you don't save the node, here's how this can break:
        // exiting the editor changes what node is selected
        // then you try to undo, and the correct thing isn't selected.
        let selectedNode = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        let fakeEditor = selectedNode.getEditorForType(selectedNode.nex);
        fakeEditor.setStateForUndo(this.savedEditorData);
    }
}
class UnrollAction extends Action {
    constructor(actionName){
        super(actionName);
    }
    canUndo() {
        return true;
    }
    doAction() {
        this.savedContainer = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        this.allSavedChildren = [];
        for(let i = 0; i < this.savedContainer.numChildren(); i++)this.allSavedChildren.push(this.savedContainer.getChildAt(i));
        this.parentOfContainer = this.savedContainer.getParent();
        this.index = this.parentOfContainer.getIndexOfChild(this.savedContainer);
        (0, _keyresponsefunctionsJs.KeyResponseFunctions)[this.actionName]((0, _systemstateJs.systemState).getGlobalSelectedNode());
    }
    undoAction() {
        this.parentOfContainer.removeChildAt(this.index);
        for(let i = 0; i < this.allSavedChildren.length; i++)this.savedContainer.appendChild(this.allSavedChildren[i]);
        this.parentOfContainer.insertChildAt(this.savedContainer, this.index);
        this.savedContainer.setSelected();
    }
}
class WrapInNewParentNodeAction extends Action {
    constructor(actionName){
        super(actionName);
    }
    canUndo() {
        return true;
    }
    doAction() {
        this.savedChildNode = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        this.savedInsertionMode = this.savedChildNode.getInsertionMode();
        (0, _keyresponsefunctionsJs.KeyResponseFunctions)[this.actionName]((0, _systemstateJs.systemState).getGlobalSelectedNode());
        this.newNode = (0, _manipulatorJs.manipulator).getMostRecentInsertedRenderNode();
        if (this.editorDataSavedForRedo) {
            let fakeEditor = this.newNode.getEditorForType(this.newNode.nex);
            fakeEditor.setStateForUndo(this.editorDataSavedForRedo);
        }
    }
    undoAction() {
        let fakeEditor = this.newNode.getEditorForType(this.newNode.nex);
        if (fakeEditor) this.editorDataSavedForRedo = fakeEditor.getStateForUndo();
        else this.editorDataSavedForRedo = null;
        let p = this.newNode.getParent();
        let index = p.getIndexOfChild(this.newNode);
        (0, _manipulatorJs.manipulator).removeNex(this.newNode);
        p.insertChildAt(this.savedChildNode, index);
        this.savedChildNode.setInsertionMode(this.savedInsertionMode);
        this.savedChildNode.setSelected();
    }
}
class InsertNewChildNodeAction extends Action {
    constructor(actionName){
        super(actionName);
    }
    canUndo() {
        return true;
    }
    doAction() {
        this.savedSelectedNode = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        this.savedInsertionMode = (0, _systemstateJs.systemState).getGlobalSelectedNode().getInsertionMode();
        (0, _keyresponsefunctionsJs.KeyResponseFunctions)[this.actionName]((0, _systemstateJs.systemState).getGlobalSelectedNode());
        this.newNode = (0, _manipulatorJs.manipulator).getMostRecentInsertedRenderNode();
        if (this.editorDataSavedForRedo) {
            let fakeEditor = this.newNode.getEditorForType(this.newNode.nex);
            fakeEditor.setStateForUndo(this.editorDataSavedForRedo);
        }
    }
    undoAction() {
        // okay so someone inserted a node and could have also edited it in the same step.
        // so when we undo we need to potentially save the state
        // so if we redo, we can restore it
        let fakeEditor = this.newNode.getEditorForType(this.newNode.nex);
        if (fakeEditor) this.editorDataSavedForRedo = fakeEditor.getStateForUndo();
        else this.editorDataSavedForRedo = null;
        (0, _manipulatorJs.manipulator).removeNex(this.newNode);
        this.savedSelectedNode.setSelected();
        this.savedSelectedNode.setInsertionMode(this.savedInsertionMode);
    }
}
class ChangeDirectionAction extends Action {
    constructor(actionName){
        super(actionName);
    }
    canUndo() {
        return true;
    }
    doAction() {
        this.savedSelectedNode = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        this.savedDir = this.savedSelectedNode.nex.getDir();
        (0, _keyresponsefunctionsJs.KeyResponseFunctions)[this.actionName]((0, _systemstateJs.systemState).getGlobalSelectedNode());
    }
    undoAction() {
        this.savedSelectedNode.nex.setDir(this.savedDir);
    }
}
class ChangeSelectedNodeAction extends Action {
    constructor(actionName){
        super(actionName);
    }
    canUndo() {
        return true;
    }
    doAction() {
        this.savedSelectedNode = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        this.savedInsertionMode = (0, _systemstateJs.systemState).getGlobalSelectedNode().getInsertionMode();
        (0, _keyresponsefunctionsJs.KeyResponseFunctions)[this.actionName]((0, _systemstateJs.systemState).getGlobalSelectedNode());
    }
    undoAction() {
        this.savedSelectedNode.setSelected();
        this.savedSelectedNode.setInsertionMode(this.savedInsertionMode);
    }
}
class LegacyKeyResponseFunctionAction extends Action {
    constructor(actionName){
        super(actionName);
    }
    canUndo() {
        console.log("attempting to undo " + this.actionName);
        return false;
    }
    doAction() {
        (0, _keyresponsefunctionsJs.KeyResponseFunctions)[this.actionName]((0, _systemstateJs.systemState).getGlobalSelectedNode());
    }
    undoAction() {
        console.log("cannot undo this action");
    }
}
// For things that can be performed but not undone or redone
// example: auditioning a wavetable
class TriviallyUndoableKeyResponseFunctionAction extends Action {
    constructor(actionName){
        super(actionName);
        this.hasBeenDone = false;
    }
    canUndo() {
        return true;
    }
    doAction() {
        if (!this.hasBeenDone) {
            this.hasBeenDone = true;
            (0, _keyresponsefunctionsJs.KeyResponseFunctions)[this.actionName]((0, _systemstateJs.systemState).getGlobalSelectedNode());
        }
    }
    undoAction() {
    // no op
    }
}
class DeleteNexAction extends Action {
    constructor(actionName){
        super(actionName);
    }
    canUndo() {
        return true;
    }
    doAction() {
        this.savedNodeToRestore = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        this.parentOfNodeWeAreDeleting = this.savedNodeToRestore.getParent();
        this.index = this.parentOfNodeWeAreDeleting.getIndexOfChild(this.savedNodeToRestore);
        this.savedInsertionMode = this.savedNodeToRestore.getInsertionMode();
        (0, _keyresponsefunctionsJs.KeyResponseFunctions)[this.actionName]((0, _systemstateJs.systemState).getGlobalSelectedNode());
    }
    undoAction() {
        this.parentOfNodeWeAreDeleting.insertChildAt(this.savedNodeToRestore, this.index);
        this.savedNodeToRestore.setSelected();
        this.savedNodeToRestore.setInsertionMode(this.savedInsertionMode);
    }
}
class EvaluateAndReplaceAction extends Action {
    constructor(actionName){
        super(actionName);
    }
    canUndo() {
        return true;
    }
    doAction() {
        this.nodeBeingEvaluated = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        this.parentOfNodeBeingEvaluated = this.nodeBeingEvaluated.getParent();
        this.index = this.parentOfNodeBeingEvaluated.getIndexOfChild(this.nodeBeingEvaluated);
        this.savedInsertionMode = this.nodeBeingEvaluated.getInsertionMode();
        (0, _keyresponsefunctionsJs.KeyResponseFunctions)[this.actionName]((0, _systemstateJs.systemState).getGlobalSelectedNode());
    }
    undoAction() {
        let evaluationResult = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        (0, _manipulatorJs.manipulator).removeAndSelectPreviousSibling(evaluationResult);
        this.parentOfNodeBeingEvaluated.insertChildAt(this.nodeBeingEvaluated, this.index);
        this.nodeBeingEvaluated.setSelected();
        this.nodeBeingEvaluated.setInsertionMode(this.savedInsertionMode);
        let ee = (0, _eerrorJs.constructWarning)("Warning: undoing code evaluation does not undo side effects.");
        this.parentOfNodeBeingEvaluated.insertChildBefore(ee, this.nodeBeingEvaluated);
    }
}
class EvaluateInPlaceAction extends Action {
    constructor(actionName){
        super(actionName);
    }
    canUndo() {
        return true;
    }
    doAction() {
        this.nodeBeingEvaluated = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        this.parentOfNodeBeingEvaluated = this.nodeBeingEvaluated.getParent();
        (0, _keyresponsefunctionsJs.KeyResponseFunctions)[this.actionName]((0, _systemstateJs.systemState).getGlobalSelectedNode());
    }
    undoAction() {
        let ee = (0, _eerrorJs.constructWarning)("Warning: undoing code evaluation does not undo side effects.");
        this.parentOfNodeBeingEvaluated.insertChildBefore(ee, this.nodeBeingEvaluated);
    }
}
class ChangeRenderModeAction extends Action {
    constructor(actionName){
        super(actionName);
    }
    canUndo() {
        return true;
    }
    doAction() {
        this.savedRenderMode = (0, _systemstateJs.systemState).getGlobalSelectedNode().getRenderMode();
        (0, _keyresponsefunctionsJs.KeyResponseFunctions)[this.actionName]((0, _systemstateJs.systemState).getGlobalSelectedNode());
    }
    undoAction() {
        (0, _systemstateJs.systemState).getGlobalSelectedNode().setRenderMode(this.savedRenderMode);
    }
}
class LineBreakAction extends Action {
    // basically to delete a line break.
    // If the line break was "do-line-break-for-letter"
    // then we do one of these three to undo:
    //   delete-letter, delete-separator, or delete-line
    // if it was "do-line-break-for-separator"
    //   delete-separator or delete-line
    // otherwise if it was do-line-break-for-line
    //.  delete-line
    // and you can just look at what is selected now basically
    constructor(actionName){
        super(actionName);
    }
    canUndo() {
        return true;
    }
    doAction() {
        (0, _keyresponsefunctionsJs.KeyResponseFunctions)[this.actionName]((0, _systemstateJs.systemState).getGlobalSelectedNode());
    }
    undoAction() {
        (0, _manipulatorJs.manipulator).deleteAnyLineBreak();
    }
}
class DefaultHandlerAction extends Action {
    constructor(actionName, eventName){
        super(actionName);
        this.eventName = eventName;
    }
    canUndo() {
        return true;
    }
    doAction() {
        this.savedSelectedNode = (0, _systemstateJs.systemState).getGlobalSelectedNode();
        this.savedInsertionMode = (0, _systemstateJs.systemState).getGlobalSelectedNode().getInsertionMode();
        let handler = (0, _keyresponsefunctionsJs.DefaultHandlers)[this.actionName];
        let result = handler((0, _systemstateJs.systemState).getGlobalSelectedNode(), this.eventName);
        if (result.inserted) {
            this.newNode = result.inserted;
            if (this.editorDataSavedForRedo) {
                let fakeEditor = this.newNode.getEditorForType(this.newNode.nex);
                fakeEditor.setStateForUndo(this.editorDataSavedForRedo);
            }
        }
    }
    undoAction() {
        // okay so someone inserted a node and could have also edited it in the same step.
        // so when we undo we need to potentially save the state
        // so if we redo, we can restore it
        if (this.newNode) {
            // then it was successful
            let fakeEditor = this.newNode.getEditorForType(this.newNode.nex);
            if (fakeEditor) this.editorDataSavedForRedo = fakeEditor.getStateForUndo();
            else this.editorDataSavedForRedo = null;
            (0, _manipulatorJs.manipulator).removeNex(this.newNode);
            this.savedSelectedNode.setSelected();
            this.savedSelectedNode.setInsertionMode(this.savedInsertionMode);
        }
    }
}
class LegacyDefaultHandlerAction extends Action {
    constructor(actionName, eventName){
        super(actionName);
        this.eventName = eventName;
    }
    canUndo() {
        console.log("attempting to undo " + this.actionName);
        console.log("eventName " + this.eventName);
        return false;
    }
    doAction() {
        let handler = (0, _keyresponsefunctionsJs.DefaultHandlers)[this.actionName];
        return handler((0, _systemstateJs.systemState).getGlobalSelectedNode(), this.eventName);
    }
    undoAction() {
        console.log("cannot undo this action");
    }
}
function actionFactory(actionName, eventName) {
    switch(actionName){
        case "do-nothing":
            return new NoOpAction(actionName);
        case "audition-wave":
            return new TriviallyUndoableKeyResponseFunctionAction(actionName);
        case "move-left-up":
        case "move-right-down":
        case "select-parent":
        case "select-first-child-or-force-insert-inside-insertion-mode":
        case "close-off-doc":
        case "close-off-line":
        case "close-off-org":
        case "close-off-word":
        case "force-insert-after":
        case "force-insert-around":
        case "force-insert-before":
        case "force-insert-inside":
        case "move-to-corresponding-letter-in-next-line":
        case "move-to-corresponding-letter-in-previous-line":
        case "move-to-next-leaf":
        case "move-to-previous-leaf":
        case "move-right-for-line":
        case "move-left-for-line":
        case "move-up-for-line":
        case "move-down-for-line":
            return new ChangeSelectedNodeAction(actionName);
        case "toggle-dir":
            return new ChangeDirectionAction(actionName);
        case "insert-command-at-insertion-point":
        case "insert-bool-at-insertion-point":
        case "insert-symbol-at-insertion-point":
        case "insert-integer-at-insertion-point":
        case "insert-string-at-insertion-point":
        case "insert-float-at-insertion-point":
        case "insert-instantiator-at-insertion-point":
        case "insert-lambda-at-insertion-point":
        case "insert-deferredcommand-at-insertion-point":
        case "insert-org-at-insertion-point":
        case "insert-line-at-insertion-point":
        case "insert-doc-at-insertion-point":
        case "insert-word-at-insertion-point":
        case "insert-wavetable-at-insertion-point":
            return new InsertNewChildNodeAction(actionName);
        case "remove-selected-and-select-previous-sibling":
        case "delete-letter":
        case "delete-line":
        case "delete-separator":
        case "remove-selected-and-select-previous-sibling-if-empty":
        case "call-delete-handler-then-remove-selected-and-select-previous-sibling":
            return new DeleteNexAction(actionName);
        case "evaluate-nex":
            return new EvaluateAndReplaceAction(actionName);
        case "start-main-editor":
        case "autocomplete":
            return new EditorContentChangeAction(actionName);
        case "add-tag":
            return new TagEditorContentChangeAction(actionName);
        case "evaluate-nex-and-keep":
            return new EvaluateInPlaceAction(actionName);
        case "wrap-in-command":
        case "wrap-in-doc":
        case "wrap-in-deferredcommand":
        case "wrap-in-instantiator":
        case "wrap-in-lambda":
        case "wrap-in-line":
        case "wrap-in-org":
        case "wrap-in-word":
            return new WrapInNewParentNodeAction(actionName);
        case "standardDefault":
        case "letterDefault":
        case "separatorDefault":
        case "wordDefault":
        case "lineDefault":
        case "docDefault":
            return new DefaultHandlerAction(actionName, eventName);
        case "toggle-exploded":
            return new ChangeRenderModeAction(actionName);
        case "do-line-break-for-letter":
        case "do-line-break-for-separator":
        case "do-line-break-or-eval":
            return new LineBreakAction(actionName);
        // Legacy ones below, these can't be undone
        case "unroll":
            return new UnrollAction(actionName);
        // in case I missed any?
        default:
            return new LegacyKeyResponseFunctionAction(actionName);
    }
}

},{"./systemstate.js":"19Hkn","./keyresponsefunctions.js":"3oxA3","./manipulator.js":"9qI89","./nex/eerror.js":"4Xsbj","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"3oxA3":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "KeyResponseFunctions", ()=>KeyResponseFunctions);
parcelHelpers.export(exports, "DefaultHandlers", ()=>DefaultHandlers);
var _utilsJs = require("./utils.js");
var _systemstateJs = require("./systemstate.js");
var _nexJs = require("./nex/nex.js");
var _nexcontainerJs = require("./nex/nexcontainer.js");
var _valuenexJs = require("./nex/valuenex.js");
var _boolJs = require("./nex/bool.js");
var _builtinJs = require("./nex/builtin.js");
var _closureJs = require("./nex/closure.js");
var _wavetableJs = require("./nex/wavetable.js");
var _commandJs = require("./nex/command.js");
var _docJs = require("./nex/doc.js");
var _eerrorJs = require("./nex/eerror.js");
var _estringJs = require("./nex/estring.js");
var _esymbolJs = require("./nex/esymbol.js");
var _floatJs = require("./nex/float.js");
var _integerJs = require("./nex/integer.js");
var _lambdaJs = require("./nex/lambda.js");
var _letterJs = require("./nex/letter.js");
var _lineJs = require("./nex/line.js");
var _nilJs = require("./nex/nil.js");
var _orgJs = require("./nex/org.js");
var _rootJs = require("./nex/root.js");
var _separatorJs = require("./nex/separator.js");
var _wordJs = require("./nex/word.js");
var _contexttypeJs = require("./contexttype.js");
var _manipulatorJs = require("./manipulator.js");
var _rendernodeJs = require("./rendernode.js");
var _evaluatorinterfaceJs = require("./evaluatorinterface.js");
var _globalconstantsJs = require("./globalconstants.js");
var _globalappflagsJs = require("./globalappflags.js");
// All of these are to some extent deprecated:
// to be replaced with editors or more generic handlers.
// Return the string of the function you want from getDefaultHandler.
// Part of my motive for collecting this here is so I can see
// the similarities and differences and try to refactor this better:
// there is too much similarity across all the different nexes
// w/r/t how these work.
// 8/8/2020 another good reason to have these here is to get rid of
// circular dependencies arising from Nex modules depending directly
// on Manipulator
const DefaultHandlers = {
    "standardDefault": function(node, txt) {
        let nex = node.nex;
        let canBe = _utilsJs.figureOutWhatItCanBe(txt);
        if (canBe.integer) {
            let newNode = (0, _manipulatorJs.manipulator).newIntegerWithValue(txt);
            (0, _manipulatorJs.manipulator).insertAtSelectedObjInsertionPoint(newNode);
            return {
                inserted: newNode
            };
        } else if (canBe.command) {
            let newNode = (0, _manipulatorJs.manipulator).newCommandWithText(txt);
            (0, _manipulatorJs.manipulator).insertAtSelectedObjInsertionPoint(newNode);
            return {
                inserted: newNode
            };
        } else return {};
    },
    "letterDefault": function(node, txt) {
        let nex = node.nex;
        let context = (0, _manipulatorJs.manipulator).getContextForNode(node);
        let inWord = context == (0, _contexttypeJs.ContextType).WORD || context == (0, _contexttypeJs.ContextType).IMMUTABLE_WORD;
        if (!/^.$/.test(txt)) throw 0, _globalconstantsJs.UNHANDLED_KEY;
        let letterRegex = /^[a-zA-Z0-9']$/;
        let isSeparator = !letterRegex.test(txt);
        let newNode = null;
        if (isSeparator) {
            newNode = (0, _manipulatorJs.manipulator).newSeparator(txt);
            if (inWord) (0, _manipulatorJs.manipulator).insertSeparatorBeforeOrAfterSelectedLetter(newNode);
            else (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), newNode);
        } else {
            newNode = (0, _manipulatorJs.manipulator).newLetter(txt);
            (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), newNode);
        }
        return {
            inserted: newNode
        };
    },
    "separatorDefault": function(node, txt) {
        let nex = node.nex;
        let context = (0, _manipulatorJs.manipulator).getContextForNode(node);
        let isLine = context == (0, _contexttypeJs.ContextType).LINE || context == (0, _contexttypeJs.ContextType).IMMUTABLE_LINE;
        if (!/^.$/.test(txt)) throw 0, _globalconstantsJs.UNHANDLED_KEY;
        let letterRegex = /^[a-zA-Z0-9']$/;
        let isSeparator = !letterRegex.test(txt);
        let newNode = null;
        if (isSeparator) {
            newNode = (0, _manipulatorJs.manipulator).newSeparator(txt);
            (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), newNode);
        } else if (isLine) {
            // special case - when user is typing into a doc, we want to preserve the general
            // mutability of the surroundings even if we are inserting new things.
            let newword = (0, _manipulatorJs.manipulator).newWord();
            if (context == (0, _contexttypeJs.ContextType).IMMUTABLE_LINE) newword.getNex().setMutable(false);
            let newletter = (0, _manipulatorJs.manipulator).newLetter(txt);
            newword.appendChild(newletter);
            (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), newword);
            let didJoin = (0, _manipulatorJs.manipulator).joinToSiblingIfSame(newword);
            // if we performed a join, then when undoing this action, we want to
            // delete the letter that was joined in, not the whole word.
            // otherwise, we do want to delete the whole word
            if (didJoin) newNode = newletter;
            else newNode = newword;
            newletter.setSelected();
        } else {
            newNode = (0, _manipulatorJs.manipulator).newLetter(txt);
            (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), newNode);
        }
        return {
            inserted: newNode
        };
    },
    "wordDefault": function(node, txt) {
        let nex = node.nex;
        let context = (0, _manipulatorJs.manipulator).getContextForNode(node);
        if (!/^.$/.test(txt)) throw 0, _globalconstantsJs.UNHANDLED_KEY;
        let letterRegex = /^[a-zA-Z0-9']$/;
        let isSeparator = !letterRegex.test(txt);
        let newNode = null;
        if (!(0, _manipulatorJs.manipulator).isInsertInside((0, _manipulatorJs.manipulator).selected())) {
            let isInDoc = _utilsJs.isInDocContext((0, _manipulatorJs.manipulator).selected());
            if (isInDoc) newNode = isSeparator ? (0, _manipulatorJs.manipulator).newSeparator(txt) : (0, _manipulatorJs.manipulator).newLetter(txt);
            else {
                let canBe = _utilsJs.figureOutWhatItCanBe(txt);
                if (canBe.integer) newNode = (0, _manipulatorJs.manipulator).newIntegerWithValue(txt);
                else if (canBe.command) newNode = (0, _manipulatorJs.manipulator).newCommandWithText(txt);
                else newNode = (0, _manipulatorJs.manipulator).newNexForKey(txt);
            }
            (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), newNode);
        } else if (isSeparator) {
            newNode = (0, _manipulatorJs.manipulator).newSeparator(txt);
            (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), newNode);
        } else {
            newNode = (0, _manipulatorJs.manipulator).newLetter(txt);
            if ((0, _manipulatorJs.manipulator).selectLastChild()) (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), newNode);
            else (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), newNode);
        }
        return {
            inserted: newNode
        };
    },
    "lineDefault": function(node, txt) {
        let nex = node.nex;
        let context = (0, _manipulatorJs.manipulator).getContextForNode(node);
        if (!/^.$/.test(txt)) throw 0, _globalconstantsJs.UNHANDLED_KEY;
        let letterRegex = /^[a-zA-Z0-9']$/;
        let isSeparator = !letterRegex.test(txt);
        let newNode = null;
        if (!(0, _manipulatorJs.manipulator).isInsertInside((0, _manipulatorJs.manipulator).selected())) {
            let isInDoc = _utilsJs.isInDocContext((0, _manipulatorJs.manipulator).selected());
            if (isInDoc) newNode = isSeparator ? (0, _manipulatorJs.manipulator).newSeparator(txt) : (0, _manipulatorJs.manipulator).newLetter(txt);
            else {
                let canBe = _utilsJs.figureOutWhatItCanBe(txt);
                if (canBe.integer) newNode = (0, _manipulatorJs.manipulator).newIntegerWithValue(txt);
                else if (canBe.command) newNode = (0, _manipulatorJs.manipulator).newCommandWithText(txt);
                else newNode = (0, _manipulatorJs.manipulator).newNexForKey(txt);
            }
            (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), newNode);
        } else if (isSeparator) {
            newNode = (0, _manipulatorJs.manipulator).newSeparator(txt);
            if ((0, _manipulatorJs.manipulator).selectLastChild()) (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), newNode);
            else (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), newNode);
        } else {
            let newLetter = (0, _manipulatorJs.manipulator).newLetter(txt);
            let newWord = (0, _manipulatorJs.manipulator).newWord();
            // pathological cases like empty word at end of line aren't handled
            if ((0, _manipulatorJs.manipulator).selectLastChild()) {
                // there were children, the last child is either a separator or a word
                if ((0, _manipulatorJs.manipulator).selectLastChild()) {
                    // it's a word, just append the letter to the last word in the line
                    (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), newLetter);
                    newNode = newLetter;
                } else {
                    // last child was a separator, add a new word
                    (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), (0, _manipulatorJs.manipulator).possiblyMakeImmutable(newWord, context));
                    (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), newLetter);
                    newNode = newWord;
                }
            } else {
                // this is the case where there is an empty line, add a word
                (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), (0, _manipulatorJs.manipulator).possiblyMakeImmutable(newWord, context));
                (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), newLetter);
                newNode = newWord;
            }
        }
        return {
            inserted: newNode
        };
    },
    "docDefault": function(node, txt) {
        let nex = node.nex;
        let context = (0, _manipulatorJs.manipulator).getContextForNode(node);
        if (!/^.$/.test(txt)) throw 0, _globalconstantsJs.UNHANDLED_KEY;
        let letterRegex = /^[a-zA-Z0-9']$/;
        let isSeparator = !letterRegex.test(txt);
        // if we are inserting a letter inside an empty doc, we decide whether to make the line and word
        // immutable based on the mutability of the doc itself, not its context.
        let fakeContext = nex.isMutable() ? (0, _contexttypeJs.ContextType).DOC : (0, _contexttypeJs.ContextType).IMMUTABLE_DOC;
        let newNode = null;
        if (!(0, _manipulatorJs.manipulator).isInsertInside((0, _manipulatorJs.manipulator).selected())) {
            let isInDoc = _utilsJs.isInDocContext((0, _manipulatorJs.manipulator).selected());
            if (isInDoc) newNode = isSeparator ? (0, _manipulatorJs.manipulator).newSeparator(txt) : (0, _manipulatorJs.manipulator).newLetter(txt);
            else {
                let canBe = _utilsJs.figureOutWhatItCanBe(txt);
                if (canBe.integer) newNode = (0, _manipulatorJs.manipulator).newIntegerWithValue(txt);
                else if (canBe.command) newNode = (0, _manipulatorJs.manipulator).newCommandWithText(txt);
                else newNode = (0, _manipulatorJs.manipulator).newNexForKey(txt);
            }
            (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), newNode);
        } else if (isSeparator) {
            let newLine = (0, _manipulatorJs.manipulator).newLine();
            let newSeparator = (0, _manipulatorJs.manipulator).newSeparator(txt);
            newNode = newSeparator;
            if (!(0, _manipulatorJs.manipulator).selectLastChild()) {
                (0, _manipulatorJs.manipulator).appendAndSelect((0, _manipulatorJs.manipulator).possiblyMakeImmutable(newLine, fakeContext));
                newNode = newLine;
            }
            (0, _manipulatorJs.manipulator).appendAndSelect(newSeparator);
        } else {
            let newLine = (0, _manipulatorJs.manipulator).newLine();
            let newWord = (0, _manipulatorJs.manipulator).newWord();
            let newLetter = (0, _manipulatorJs.manipulator).newLetter(txt);
            newNode = null;
            if (!(0, _manipulatorJs.manipulator).selectLastChild()) {
                (0, _manipulatorJs.manipulator).appendAndSelect((0, _manipulatorJs.manipulator).possiblyMakeImmutable(newLine, fakeContext));
                newNode = newLine;
            }
            if (!(0, _manipulatorJs.manipulator).selectLastChild()) {
                (0, _manipulatorJs.manipulator).appendAndSelect((0, _manipulatorJs.manipulator).possiblyMakeImmutable(newWord, fakeContext));
                if (!newNode) newNode = newWord;
            }
            if (!newNode) newNode = newLetter;
            if ((0, _manipulatorJs.manipulator).selectLastChild()) (0, _manipulatorJs.manipulator).insertAfterSelectedAndSelect(newLetter);
            else (0, _manipulatorJs.manipulator).appendAndSelect(newLetter);
        }
        return {
            inserted: newNode
        };
    }
};
const KeyResponseFunctions = {
    // if we make generator functions, like insert-or-append(thing) instead of
    // insert-or-append-command, we have to make it so that we don't accidentally
    // end up constructing the object once and trying to reinsert it.
    // Currently the nexes recreate their key funnel vector every time a key is pressed,
    // but that's obviously inefficient and user created nexes might not do that.
    "do-nothing": function(s) {},
    "evaluate-nex": function(s) {
        (0, _evaluatorinterfaceJs.evaluateAndReplace)(s);
    },
    "evaluate-nex-and-keep": function(s) {
        (0, _evaluatorinterfaceJs.evaluateAndKeep)(s);
    },
    "toggle-dir": function(s) {
        s.getNex().toggleDir();
    },
    "toggle-exploded": function(s) {
        s.toggleRenderMode();
    },
    "select-parent": function(s) {
        (0, _manipulatorJs.manipulator).selectParent();
    },
    "activate-or-return-exp-child": function(s) {
        let exp = s.getNex();
        if (!exp.isActivated()) (0, _evaluatorinterfaceJs.evaluateAndReplace)(s); // this will activate plus do all the other junk I want
        else if (exp.isFinished()) (0, _manipulatorJs.manipulator).replaceSelectedWithFirstChildOfSelected();
    // else no-op, it's still thinking.
    },
    "autocomplete": function(s) {
        s.getNex().autocomplete();
    },
    "start-main-editor": function(s) {
        s.possiblyStartMainEditor();
    },
    "delete-letter": function(s) {
        (0, _manipulatorJs.manipulator).deleteLeaf(s);
    },
    "delete-separator": function(s) {
        (0, _manipulatorJs.manipulator).deleteLeaf(s);
    },
    "delete-line": function(s) {
        (0, _manipulatorJs.manipulator).maybeDeleteEmptyLine(s);
    },
    "remove-selected-and-select-previous-sibling": function(s) {
        (0, _manipulatorJs.manipulator).removeAndSelectPreviousSibling(s);
    },
    "remove-selected-and-select-previous-sibling-if-empty": function(s) {
        (0, _manipulatorJs.manipulator).removeAndSelectPreviousSiblingIfEmpty(s);
    },
    "move-left-up": function(s) {
        (0, _manipulatorJs.manipulator).moveLeftUp(s);
    },
    "move-right-down": function(s) {
        (0, _manipulatorJs.manipulator).moveRightDown(s);
    },
    "move-left-for-line": function(s) {
        (0, _manipulatorJs.manipulator).moveLeftForLine(s);
    },
    "move-up-for-line": function(s) {
        (0, _manipulatorJs.manipulator).moveUpForLine(s);
    },
    "move-right-for-line": function(s) {
        (0, _manipulatorJs.manipulator).moveRightForLine(s);
    },
    "move-down-for-line": function(s) {
        (0, _manipulatorJs.manipulator).moveDownForLine(s);
    },
    "move-to-previous-leaf": function(s) {
        (0, _manipulatorJs.manipulator).selectPreviousLeaf(s);
    },
    "move-to-next-leaf": function(s) {
        (0, _manipulatorJs.manipulator).selectNextLeaf(s);
    },
    "select-first-child-or-force-insert-inside-insertion-mode": function(s) {
        (0, _manipulatorJs.manipulator).selectFirstChildOrMoveInsertionPoint(s);
    },
    "do-line-break-or-eval": function(s) {
        let context = (0, _manipulatorJs.manipulator).getContextForNode(s);
        if (context == (0, _contexttypeJs.ContextType).DOC || context == (0, _contexttypeJs.ContextType).IMMUTABLE_DOC) (0, _manipulatorJs.manipulator).doLineBreakForLine(s, context);
        else (0, _evaluatorinterfaceJs.evaluateAndReplace)(s);
    },
    "do-line-break-for-letter": function(s) {
        let context = (0, _manipulatorJs.manipulator).getContextForNode(s);
        (0, _manipulatorJs.manipulator).doLineBreakForLetter(s, context);
    },
    "do-line-break-for-separator": function(s) {
        let context = (0, _manipulatorJs.manipulator).getContextForNode(s);
        (0, _manipulatorJs.manipulator).doLineBreakForSeparator(s, context);
    },
    "move-to-corresponding-letter-in-previous-line": function(s) {
        (0, _manipulatorJs.manipulator).selectCorrespondingLetterInPreviousLine(s);
    },
    "move-to-corresponding-letter-in-next-line": function(s) {
        (0, _manipulatorJs.manipulator).selectCorrespondingLetterInNextLine(s);
    },
    "insert-actual-!-at-insertion-point-from-separator": function(s) {
        (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), (0, _manipulatorJs.manipulator).newSeparator("!"));
    },
    "insert-actual-@-at-insertion-point-from-separator": function(s) {
        (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), (0, _manipulatorJs.manipulator).newSeparator("@"));
    },
    "insert-actual-#-at-insertion-point-from-separator": function(s) {
        (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), (0, _manipulatorJs.manipulator).newSeparator("#"));
    },
    "insert-actual-$-at-insertion-point-from-separator": function(s) {
        (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), (0, _manipulatorJs.manipulator).newSeparator("$"));
    },
    "insert-actual-%-at-insertion-point-from-separator": function(s) {
        (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), (0, _manipulatorJs.manipulator).newSeparator("%"));
    },
    "insert-actual-^-at-insertion-point-from-separator": function(s) {
        (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), (0, _manipulatorJs.manipulator).newSeparator("^"));
    },
    "insert-actual-&-at-insertion-point-from-separator": function(s) {
        (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), (0, _manipulatorJs.manipulator).newSeparator("&"));
    },
    "insert-actual-*-at-insertion-point-from-separator": function(s) {
        (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), (0, _manipulatorJs.manipulator).newSeparator("*"));
    },
    "insert-actual-(-at-insertion-point-from-separator": function(s) {
        (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), (0, _manipulatorJs.manipulator).newSeparator("("));
    },
    "insert-actual-)-at-insertion-point-from-separator": function(s) {
        (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), (0, _manipulatorJs.manipulator).newSeparator(")"));
    },
    "insert-actual-[-at-insertion-point-from-separator": function(s) {
        (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), (0, _manipulatorJs.manipulator).newSeparator("["));
    },
    "insert-actual-{-at-insertion-point-from-separator": function(s) {
        (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), (0, _manipulatorJs.manipulator).newSeparator("{"));
    },
    "insert-actual-<-at-insertion-point-from-separator": function(s) {
        (0, _manipulatorJs.manipulator).defaultInsertFor((0, _manipulatorJs.manipulator).selected(), (0, _manipulatorJs.manipulator).newSeparator("<"));
    },
    "insert-actual-!-at-insertion-point-from-letter": function(s) {
        (0, _manipulatorJs.manipulator).insertSeparatorBeforeOrAfterSelectedLetter((0, _manipulatorJs.manipulator).newSeparator("!"));
    },
    "insert-actual-@-at-insertion-point-from-letter": function(s) {
        (0, _manipulatorJs.manipulator).insertSeparatorBeforeOrAfterSelectedLetter((0, _manipulatorJs.manipulator).newSeparator("@"));
    },
    "insert-actual-#-at-insertion-point-from-letter": function(s) {
        (0, _manipulatorJs.manipulator).insertSeparatorBeforeOrAfterSelectedLetter((0, _manipulatorJs.manipulator).newSeparator("#"));
    },
    "insert-actual-$-at-insertion-point-from-letter": function(s) {
        (0, _manipulatorJs.manipulator).insertSeparatorBeforeOrAfterSelectedLetter((0, _manipulatorJs.manipulator).newSeparator("$"));
    },
    "insert-actual-%-at-insertion-point-from-letter": function(s) {
        (0, _manipulatorJs.manipulator).insertSeparatorBeforeOrAfterSelectedLetter((0, _manipulatorJs.manipulator).newSeparator("%"));
    },
    "insert-actual-^-at-insertion-point-from-letter": function(s) {
        (0, _manipulatorJs.manipulator).insertSeparatorBeforeOrAfterSelectedLetter((0, _manipulatorJs.manipulator).newSeparator("^"));
    },
    "insert-actual-&-at-insertion-point-from-letter": function(s) {
        (0, _manipulatorJs.manipulator).insertSeparatorBeforeOrAfterSelectedLetter((0, _manipulatorJs.manipulator).newSeparator("&"));
    },
    "insert-actual-*-at-insertion-point-from-letter": function(s) {
        (0, _manipulatorJs.manipulator).insertSeparatorBeforeOrAfterSelectedLetter((0, _manipulatorJs.manipulator).newSeparator("*"));
    },
    "insert-actual-(-at-insertion-point-from-letter": function(s) {
        (0, _manipulatorJs.manipulator).insertSeparatorBeforeOrAfterSelectedLetter((0, _manipulatorJs.manipulator).newSeparator("("));
    },
    "insert-actual-)-at-insertion-point-from-letter": function(s) {
        (0, _manipulatorJs.manipulator).insertSeparatorBeforeOrAfterSelectedLetter((0, _manipulatorJs.manipulator).newSeparator(")"));
    },
    "insert-actual-[-at-insertion-point-from-letter": function(s) {
        (0, _manipulatorJs.manipulator).insertSeparatorBeforeOrAfterSelectedLetter((0, _manipulatorJs.manipulator).newSeparator("["));
    },
    "insert-actual-{-at-insertion-point-from-letter": function(s) {
        (0, _manipulatorJs.manipulator).insertSeparatorBeforeOrAfterSelectedLetter((0, _manipulatorJs.manipulator).newSeparator("{"));
    },
    "insert-actual-<-at-insertion-point-from-letter": function(s) {
        (0, _manipulatorJs.manipulator).insertSeparatorBeforeOrAfterSelectedLetter((0, _manipulatorJs.manipulator).newSeparator("<"));
    },
    "insert-actual-_-at-insertion-point-from-letter": function(s) {
        (0, _manipulatorJs.manipulator).insertSeparatorBeforeOrAfterSelectedLetter((0, _manipulatorJs.manipulator).newSeparator("_"));
    },
    "insert-command-at-insertion-point": function(s) {
        (0, _manipulatorJs.manipulator).defaultInsertFor(s, (0, _manipulatorJs.manipulator).newCommand());
    },
    "insert-bool-at-insertion-point": function(s) {
        (0, _manipulatorJs.manipulator).defaultInsertFor(s, (0, _manipulatorJs.manipulator).newBool());
    },
    "insert-symbol-at-insertion-point": function(s) {
        (0, _manipulatorJs.manipulator).defaultInsertFor(s, (0, _manipulatorJs.manipulator).newESymbol());
    },
    "insert-integer-at-insertion-point": function(s) {
        (0, _manipulatorJs.manipulator).defaultInsertFor(s, (0, _manipulatorJs.manipulator).newInteger());
    },
    "insert-string-at-insertion-point": function(s) {
        (0, _manipulatorJs.manipulator).defaultInsertFor(s, (0, _manipulatorJs.manipulator).newEString());
    },
    "insert-float-at-insertion-point": function(s) {
        (0, _manipulatorJs.manipulator).defaultInsertFor(s, (0, _manipulatorJs.manipulator).newFloat());
    },
    "insert-nil-at-insertion-point": function(s) {
        (0, _manipulatorJs.manipulator).defaultInsertFor(s, (0, _manipulatorJs.manipulator).newNil());
    },
    "insert-instantiator-at-insertion-point": function(s) {
        (0, _manipulatorJs.manipulator).defaultInsertFor(s, (0, _manipulatorJs.manipulator).newInstantiator());
    },
    "insert-lambda-at-insertion-point": function(s) {
        (0, _manipulatorJs.manipulator).defaultInsertFor(s, (0, _manipulatorJs.manipulator).newLambda());
    },
    "insert-deferredcommand-at-insertion-point": function(s) {
        (0, _manipulatorJs.manipulator).defaultInsertFor(s, (0, _manipulatorJs.manipulator).newDeferredCommand());
    },
    "insert-word-at-insertion-point": function(s) {
        (0, _manipulatorJs.manipulator).defaultInsertFor(s, (0, _manipulatorJs.manipulator).newWord());
    },
    "insert-line-at-insertion-point": function(s) {
        (0, _manipulatorJs.manipulator).defaultInsertFor(s, (0, _manipulatorJs.manipulator).newLine());
    },
    "insert-doc-at-insertion-point": function(s) {
        (0, _manipulatorJs.manipulator).defaultInsertFor(s, (0, _manipulatorJs.manipulator).newDoc());
    },
    "insert-org-at-insertion-point": function(s) {
        (0, _manipulatorJs.manipulator).defaultInsertFor(s, (0, _manipulatorJs.manipulator).newOrg());
    },
    "insert-wavetable-at-insertion-point": function(s) {
        (0, _manipulatorJs.manipulator).defaultInsertFor(s, (0, _manipulatorJs.manipulator).newWavetable());
    },
    "close-off-org": function(s) {
        (0, _manipulatorJs.manipulator).closeOffOrg(s);
    },
    "close-off-line": function(s) {
        (0, _manipulatorJs.manipulator).closeOffLine(s);
    },
    "close-off-word": function(s) {
        (0, _manipulatorJs.manipulator).closeOffWord(s);
    },
    "close-off-doc": function(s) {
        (0, _manipulatorJs.manipulator).closeOffDoc(s);
    },
    "add-tag": function(s) {
        s.startTagEditor();
    },
    "unroll": function(s) {
        (0, _manipulatorJs.manipulator).unroll(s);
    },
    "wrap-in-command": function(s) {
        (0, _manipulatorJs.manipulator).wrapSelectedInAndSelect((0, _manipulatorJs.manipulator).newCommand());
    },
    "wrap-in-lambda": function(s) {
        (0, _manipulatorJs.manipulator).wrapSelectedInAndSelect((0, _manipulatorJs.manipulator).newLambda());
    },
    "wrap-in-deferredcommand": function(s) {
        (0, _manipulatorJs.manipulator).wrapSelectedInAndSelect((0, _manipulatorJs.manipulator).newDeferredCommand());
    },
    "wrap-in-word": function(s) {
        (0, _manipulatorJs.manipulator).wrapSelectedInAndSelect((0, _manipulatorJs.manipulator).newWord());
    },
    "wrap-in-line": function(s) {
        (0, _manipulatorJs.manipulator).wrapSelectedInAndSelect((0, _manipulatorJs.manipulator).newLine());
    },
    "wrap-in-doc": function(s) {
        (0, _manipulatorJs.manipulator).wrapSelectedInAndSelect((0, _manipulatorJs.manipulator).newDoc());
    },
    "wrap-in-instantiator": function(s) {
        (0, _manipulatorJs.manipulator).wrapSelectedInAndSelect((0, _manipulatorJs.manipulator).newInstantiator());
    },
    "wrap-in-org": function(s) {
        (0, _manipulatorJs.manipulator).wrapSelectedInAndSelect((0, _manipulatorJs.manipulator).newOrg());
    },
    "force-insert-inside": function(s) {
        (0, _manipulatorJs.manipulator).forceInsertInside();
    },
    "force-insert-around": function(s) {
        (0, _manipulatorJs.manipulator).forceInsertAround();
    },
    "force-insert-after": function(s) {
        (0, _manipulatorJs.manipulator).forceInsertAfter();
    },
    "force-insert-before": function(s) {
        (0, _manipulatorJs.manipulator).forceInsertBefore();
    },
    "call-delete-handler-then-remove-selected-and-select-previous-sibling": function(s) {
        s.getNex().callDeleteHandler();
        (0, _manipulatorJs.manipulator).removeSelectedAndSelectPreviousSibling();
    },
    "audition-wave": function(s) {
        s.getNex().auditionWave();
    },
    "toggle-collapsed": function(s) {
        s.toggleCollapsed();
    },
    // I hate commas
    "": ""
};

},{"./utils.js":"bIDtH","./systemstate.js":"19Hkn","./nex/nex.js":"gNpCL","./nex/nexcontainer.js":"e7Ky3","./nex/valuenex.js":"8G1WY","./nex/bool.js":"3MKly","./nex/builtin.js":"cOoeb","./nex/closure.js":"ajZXN","./nex/wavetable.js":"6Cspq","./nex/command.js":"6AUMZ","./nex/doc.js":"fb3ea","./nex/eerror.js":"4Xsbj","./nex/estring.js":"bL0nm","./nex/esymbol.js":"cO7Ty","./nex/float.js":"f95Ws","./nex/integer.js":"cjEX0","./nex/lambda.js":"1mCM0","./nex/letter.js":"keNY2","./nex/line.js":"bwNVL","./nex/nil.js":"amOKC","./nex/org.js":"28wYz","./nex/root.js":"8BOcG","./nex/separator.js":"egKmR","./nex/word.js":"a7zjn","./contexttype.js":"7dDRe","./manipulator.js":"9qI89","./rendernode.js":"4dhWw","./evaluatorinterface.js":"bVJbL","./globalconstants.js":"3d62t","./globalappflags.js":"1FpbG","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"cOoeb":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Builtin", ()=>Builtin);
parcelHelpers.export(exports, "constructBuiltin", ()=>constructBuiltin);
var _lambdaJs = require("./lambda.js");
var _paramparserJs = require("../paramparser.js");
var _environmentJs = require("../environment.js");
var _perfmonJs = require("../perfmon.js");
var _globalappflagsJs = require("../globalappflags.js");
var _documentationJs = require("../documentation.js");
var _heapJs = require("../heap.js");
var _eerrorJs = require("./eerror.js");
/**
 * Nex that represents an *uncompiled* builtin function. Compiled builtins
 * are represented by {@link Closure} objects, same as compiled {@link Lambda}s.
 */ class Builtin extends (0, _lambdaJs.Lambda) {
    constructor(name, params, retval, docstring){
        // memory ok
        super();
        // TODO: accurate memory tracking for builtins
        // since users can't create builtins this is lower priority
        this.name = new (0, _heapJs.HeapString)();
        this.name.set(name);
        this.paramsArray = params;
        this.returnValueParam = retval;
        this.internaljs = null;
        this.docstring = new (0, _heapJs.HeapString)();
        this.docstring.set(docstring ? docstring : " - no docs - ");
        this.infix = false;
        let amp = "";
        for(let i = 0; i < params.length; i++){
            if (amp != "") amp += " ";
            amp += params[i].name;
        }
        this.amptext = new (0, _heapJs.HeapString)();
        this.amptext.set(amp);
        this.f = null;
        this.closure = (0, _environmentJs.BUILTINS);
    }
    toString(version) {
        if (version == "v2") return `[BUILTIN:${this.name.get()}]`;
        return `[BUILTIN:${this.name.get()}]`;
    }
    getCanonicalName() {
        return this.name.get();
    }
    getTypeName() {
        return "-builtin-";
    }
    setInternalJs(js) {
        this.internaljs = js;
    }
    makeCopy(shallow) {
        let r = constructBuiltin(this.name.get(), this.paramsArray);
        this.copyChildrenTo(r, shallow);
        this.copyFieldsTo(r);
        return r;
    }
    getSymbolForCodespan() {
        return "&szlig;";
    }
    getDocString() {
        return this.docstring.get();
    }
    renderInto(renderNode, renderFlags, withEditor) {
        let domNode = renderNode.getDomNode();
        super.renderInto(renderNode, renderFlags, withEditor);
        domNode.classList.add("builtin");
    }
    setF(f) {
        this.f = f.bind(this);
    }
    isInfix() {
        return this.infix;
    }
    setInfix(v) {
        this.infix = v;
    }
    prettyPrintInternal(lvl, hdir) {
        return ` [&]${this.toStringV2PrivateDataSection()}${this.toStringV2TagList()}`; // exp \n`;
    }
    evaluate(executionEnvironment) {
        let r = super.evaluate(executionEnvironment);
        r.setSymbolBinding(this.name.get());
        return r;
    }
    static createBuiltin(name, paramsArray, f, docstring, infix) {
        let parser = new (0, _paramparserJs.ParamParser)(true);
        parser.parse(paramsArray);
        let params = parser.getParams();
        let retval = parser.getReturnValue();
        // technically this could throw an exception but if you getting OOM
        // before you've even created the builtins you're not using Vodka today
        let builtin = constructBuiltin(name, params, retval, docstring);
        if (0, _perfmonJs.PERFORMANCE_MONITOR) (0, _perfmonJs.perfmon).registerMethod(name);
        builtin.setF(f);
        builtin.setInfix(!!infix);
        let closure = builtin.evaluate((0, _environmentJs.BUILTINS));
        // rip out the copied closure and replace with global env because
        // builtins (though they typically do not evaluate each other)
        // still should be mutally able to see each other, much like
        // stuff in a package.
        closure.setLexicalEnvironment((0, _environmentJs.BUILTINS));
        Builtin.bindBuiltinObject(name, closure);
        (0, _documentationJs.documentBuiltin)(name, paramsArray, docstring);
    }
    static aliasBuiltin(aliasName, boundName) {
        // temporarily a no-op because this messes up autocomplete
        let bound = (0, _environmentJs.BUILTINS).lookupBinding(boundName);
        Builtin.bindBuiltinObject(aliasName, bound);
    }
    static bindBuiltinObject(name, nex) {
        (0, _environmentJs.BUILTINS).bind(name, nex);
    }
    getEventTable(context) {
        return null;
    }
    memUsed() {
        return super.memUsed() + (0, _heapJs.heap).sizeBuiltin();
    }
}
function constructBuiltin(name, params, retval, docstring) {
    (0, _heapJs.heap).requestMem((0, _heapJs.heap).sizeBuiltin()) || (0, _eerrorJs.throwOOM)("Builtin");
    return (0, _heapJs.heap).register(new Builtin(name, params, retval, docstring));
}

},{"./lambda.js":"1mCM0","../paramparser.js":"cair0","../environment.js":"4mXDy","../perfmon.js":"dHrYS","../globalappflags.js":"1FpbG","../documentation.js":"4PeX2","../heap.js":"67mlv","./eerror.js":"4Xsbj","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"4PeX2":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "setAPIDocCategory", ()=>setAPIDocCategory);
parcelHelpers.export(exports, "documentBuiltin", ()=>documentBuiltin);
parcelHelpers.export(exports, "writeDocs", ()=>writeDocs);
let apiDocCategory = "";
let docs = {};
let docorder = [];
function setAPIDocCategory(str) {
    apiDocCategory = str;
    docs[apiDocCategory] = [];
    docorder.push(str);
}
function documentBuiltin(name, params, info) {
    docs[apiDocCategory].push({
        name: name,
        info: info,
        params: params
    });
}
function makespacer(p) {
    let line = document.createElement("p");
    line.classList.add("infospacer");
    p.appendChild(line);
    return line;
}
function makeline(p, contents) {
    let line = document.createElement("p");
    line.classList.add("infoline");
    line.innerText = contents;
    p.appendChild(line);
    return line;
}
function makeindentedline(p, contents, ishtml) {
    let line = document.createElement("p");
    line.classList.add("infoline");
    line.classList.add("infoindent");
    if (ishtml) line.innerHTML = contents;
    else line.innerText = contents;
    p.appendChild(line);
    return line;
}
function makebigline(p, contents) {
    let line = document.createElement("p");
    line.classList.add("infotitle");
    line.innerText = contents;
    p.appendChild(line);
    return line;
}
function makehotkey(contents) {
    let line = document.createElement("span");
    line.classList.add("infohotkey");
    line.innerText = contents;
    return line;
}
function makebighotkey(contents) {
    let line = document.createElement("span");
    line.classList.add("infohotkey");
    line.classList.add("infohotkeylarge");
    line.innerText = contents;
    return line;
}
function printTitle(p, text) {
    makebigline(p, text);
    makespacer(p);
}
function printItem(p, item) {
    let line = makeline(p, "");
    line.prepend(makebighotkey(item.name));
    if (item.params.length > 0) {
        let l2 = makeindentedline(p, "args: ");
        for(let i = 0; i < item.params.length; i++)l2.appendChild(makehotkey(item.params[i]));
    }
    let info = "" + item.info;
    info = info.replace(/\|([a-zA-Z_]+) /g, '<span class="infohotkey">$1</span>');
    info = info.replace(/\|([a-zA-Z_]+)/g, '<span class="infohotkey">$1</span>');
    makeindentedline(p, info, true);
    makespacer(p);
    makespacer(p);
}
function writeDocs() {
    let div = document.getElementById("fullapireference");
    for(let j = 0; j < docorder.length; j++){
        let key = docorder[j];
        printTitle(div, key);
        let list = docs[key];
        for(let i = 0; i < list.length; i++)printItem(div, list[i]);
    }
}

},{"@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"bVJbL":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "evaluateAndReplace", ()=>evaluateAndReplace);
parcelHelpers.export(exports, "evaluateAndCopy", ()=>evaluateAndCopy);
parcelHelpers.export(exports, "evaluateAndKeep", ()=>evaluateAndKeep);
parcelHelpers.export(exports, "evaluateAndReturn", ()=>evaluateAndReturn);
var _utilsJs = require("./utils.js");
var _eventqueuedispatcherJs = require("./eventqueuedispatcher.js");
var _rendernodeJs = require("./rendernode.js");
var _environmentJs = require("./environment.js");
var _globalappflagsJs = require("./globalappflags.js");
var _manipulatorJs = require("./manipulator.js");
var _evaluatorJs = require("./evaluator.js");
/**
 * This method is used for when you want to evaluate the Nex inside a RenderNode
 * and replace the RenderNode with the result of the computation.
 *
 * @param {RenderNode} s - the RenderNode to evaluate and replace (probably the selected node)
 */ function evaluateAndReplace(s) {
    let n = (0, _evaluatorJs.evaluateNexSafely)(s.getNex(), (0, _environmentJs.BINDINGS));
    if (_utilsJs.isFatalError(n)) {
        _utilsJs.beep();
        if (!(0, _globalappflagsJs.experiments).ERRORS_REPLACE) {
            (0, _manipulatorJs.manipulator).insertBeforeSelectedAndSelect(new (0, _rendernodeJs.RenderNode)(n));
            return;
        }
    }
    if (n) (0, _manipulatorJs.manipulator).replaceSelectedWith(new (0, _rendernodeJs.RenderNode)(n));
}
/**
 * This method is used to evaluate a Nex and throw away the result. Obviously only
 * useful if evaluating the Nex has side effects. If it returns an error, the error
 * will be prepended to the parent of the selected node before the selected node.
 *
 * @param {RenderNode} s = the RenderNode to evaluate
 */ function evaluateAndKeep(s) {
    let n = (0, _evaluatorJs.evaluateNexSafely)(s.getNex(), (0, _environmentJs.BINDINGS));
    if (_utilsJs.isFatalError(n)) {
        _utilsJs.beep();
        (0, _manipulatorJs.manipulator).insertBeforeSelectedAndSelect(new (0, _rendernodeJs.RenderNode)(n));
    }
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueAlertAnimation(s);
}
function evaluateAndCopy(s) {
    let n = (0, _evaluatorJs.evaluateNexSafely)(s.getNex(), (0, _environmentJs.BINDINGS));
    if (n) (0, _manipulatorJs.manipulator).replaceSelectedWith(new (0, _rendernodeJs.RenderNode)(n));
}
// used by the repl
function evaluateAndReturn(nex) {
    let n = (0, _evaluatorJs.evaluateNexSafely)(nex, (0, _environmentJs.BINDINGS));
    return n;
}

},{"./utils.js":"bIDtH","./eventqueuedispatcher.js":"2z8jO","./rendernode.js":"4dhWw","./environment.js":"4mXDy","./globalappflags.js":"1FpbG","./manipulator.js":"9qI89","./evaluator.js":"1TNlN","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"TbEnW":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "createAsyncBuiltins", ()=>createAsyncBuiltins);
var _utilsJs = require("../utils.js");
var _eventqueuedispatcherJs = require("../eventqueuedispatcher.js");
var _builtinJs = require("../nex/builtin.js");
var _nilJs = require("../nex/nil.js");
var _eerrorJs = require("../nex/eerror.js");
var _orgJs = require("../nex/org.js");
var _environmentJs = require("../environment.js");
var _lambdaJs = require("../nex/lambda.js");
var _globalappflagsJs = require("../globalappflags.js");
var _tagJs = require("../tag.js");
var _deferredvalueJs = require("../nex/deferredvalue.js");
var _gcJs = require("../gc.js");
var _boolJs = require("../nex/bool.js");
var _systemstateJs = require("../systemstate.js");
var _evaluatorJs = require("../evaluator.js");
var _asyncfunctionsJs = require("../asyncfunctions.js");
function createAsyncBuiltins() {
    (0, _builtinJs.Builtin).createBuiltin("cancel-deferred", [
        "def*?"
    ], function $cancelDeferred(env, executionEnvironment) {
        let def = env.lb("def");
        if (def == (0, _environmentJs.UNBOUND)) {
            (0, _gcJs.incFFGen)();
            return (0, _nilJs.constructNil)();
        } else {
            def.cancel();
            return def;
        }
    }, "Cancels the optional deferred argument |def (it will never complete), or, if no arguments are provided, cancels all unfinished deferreds known by the system.");
    (0, _builtinJs.Builtin).createBuiltin("settle", [
        "dv*",
        "result?"
    ], function settle(env, executionEnvironment) {
        let dv = env.lb("dv");
        let result = env.lb("result");
        if (result == (0, _environmentJs.UNBOUND)) // if we finish with a Nil, Nil replaces the contents
        // but if we pass null, then the dv will keep the contents.
        result = null;
        dv.startSettle(result);
        return dv;
    }, "Settles the deferred value.");
    (0, _builtinJs.Builtin).createBuiltin("finish", [
        "dv*",
        "result?"
    ], function $settle(env, executionEnvironment) {
        let dv = env.lb("dv");
        let result = env.lb("result");
        if (result == (0, _environmentJs.UNBOUND)) // if we finish with a Nil, Nil replaces the contents
        // but if we pass null, then the dv will keep the contents.
        result = null;
        dv.startFinish(result);
        return dv;
    }, "Finishes the deferred value.");
    (0, _builtinJs.Builtin).createBuiltin("is-finished", [
        "dv*"
    ], function $isFinished(env, executionEnvironment) {
        let dv = env.lb("dv");
        let isF = dv.isFinished();
        let r = (0, _boolJs.constructBool)(isF);
        return r;
    }, "Returns true if the deferred value is finished.");
    (0, _builtinJs.Builtin).createBuiltin("report-async-error", [
        "_dv"
    ], function $reportError(env, executionEnvironment) {
        let dv = env.lb("dv");
        let thing = (0, _evaluatorJs.evaluateNexSafely)(dv, executionEnvironment);
        if (_utilsJs.isDeferredValue(thing)) thing.addListener({
            notify: ()=>{
                let z = thing.getChildAt(0);
                if (_utilsJs.isFatalError(z)) {
                    let r = (0, _systemstateJs.systemState).getRoot();
                    r.prependChild((0, _evaluatorJs.wrapError)("&szlig;", "report-async-error: error found", z));
                }
            }
        });
        return thing;
    }, "If the argument evaluates to a fatal error, this function reports that error in an obvious place at the root level so the user can see it. Useful for situations where a process is computing asynchronously and may or may not return an error.");
    (0, _builtinJs.Builtin).createBuiltin("wait-for-nothing", [], function $waitForNothing(env, executionEnvironment) {
        let dv = (0, _deferredvalueJs.constructDeferredValue)();
        let afg = new (0, _asyncfunctionsJs.ImmediateActivationFunctionGenerator)();
        dv.set(afg);
        dv.activate();
        return dv;
    }, "Returns a deferred value that finishes immediately.");
    (0, _builtinJs.Builtin).createBuiltin("wait", [
        "nex?"
    ], function $wait(env, executionEnvironment) {
        let nex = env.lb("nex");
        let dv = (0, _deferredvalueJs.constructDeferredValue)();
        let afg = new (0, _asyncfunctionsJs.CallbackActivationFunctionGenerator)(nex);
        dv.set(afg);
        dv.activate();
        if (nex != (0, _environmentJs.UNBOUND)) dv.appendChild(nex);
        return dv;
    }, "Returns a deferred value that waits forever until manually settled or finished. If passed in, |nex will be the initial contents of the deferred value.");
    (0, _builtinJs.Builtin).aliasBuiltin("wait-forever", "wait");
    (0, _builtinJs.Builtin).createBuiltin("wait-for-click", [
        "nex"
    ], function $setClick(env, executionEnvironment) {
        let nex = env.lb("nex");
        let dv = (0, _deferredvalueJs.constructDeferredValue)();
        let afg = new (0, _asyncfunctionsJs.ClickActivationFunctionGenerator)(nex);
        dv.appendChild(nex);
        dv.set(afg);
        dv.activate();
        return dv;
    }, "Returns a deferred value that settles every time |nex is clicked on.");
    (0, _builtinJs.Builtin).createBuiltin("wait-for-delay", [
        "time#"
    ], function $waitForDelay(env, executionEnvironment) {
        let timenex = env.lb("time");
        let time = timenex.getTypedValue();
        let dv = (0, _deferredvalueJs.constructDeferredValue)();
        dv.appendChild(timenex);
        let afg = new (0, _asyncfunctionsJs.DelayActivationFunctionGenerator)(time);
        dv.set(afg);
        dv.activate();
        return dv;
    }, "Returns a deferred value that waits for |time milliseconds, then finishes.");
    (0, _builtinJs.Builtin).createBuiltin("wait-for-contents-changed", [
        "nex()"
    ], function $waitForContentsChanged(env, executionEnvironment) {
        let nex = env.lb("nex");
        let dv = (0, _deferredvalueJs.constructDeferredValue)();
        dv.appendChild(nex);
        let afg = new (0, _asyncfunctionsJs.OnContentsChangedActivationFunctionGenerator)(nex);
        dv.set(afg);
        dv.activate();
        return dv;
    }, "Returns a deferred value that settles when contents of |nex are changed.");
    (0, _builtinJs.Builtin).createBuiltin("wait-for-next-render", [
        "nex"
    ], function $waitForNextRender(env, executionEnvironment) {
        let nex = env.lb("nex");
        let dv = (0, _deferredvalueJs.constructDeferredValue)();
        dv.appendChild(nex);
        let afg = new (0, _asyncfunctionsJs.OnNextRenderActivationFunctionGenerator)(nex);
        dv.set(afg);
        dv.activate();
        return dv;
    }, "Returns a deferred value that finishes the next time |nex is rendered to the screen.");
}

},{"../utils.js":"bIDtH","../eventqueuedispatcher.js":"2z8jO","../nex/builtin.js":"cOoeb","../nex/nil.js":"amOKC","../nex/eerror.js":"4Xsbj","../nex/org.js":"28wYz","../environment.js":"4mXDy","../nex/lambda.js":"1mCM0","../globalappflags.js":"1FpbG","../tag.js":"975jg","../nex/deferredvalue.js":"l7y1l","../gc.js":"idaMG","../nex/bool.js":"3MKly","../systemstate.js":"19Hkn","../evaluator.js":"1TNlN","../asyncfunctions.js":"6KukQ","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"1ixFo":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "createSurfaceBuiltins", ()=>createSurfaceBuiltins);
var _utilsJs = require("../utils.js");
var _builtinJs = require("../nex/builtin.js");
var _orgJs = require("../nex/org.js");
var _integerJs = require("../nex/integer.js");
var _surfaceJs = require("../nex/surface.js");
var _environmentJs = require("../environment.js");
var _eerrorJs = require("../nex/eerror.js");
/**
 * Creates all surface builtins.
 */ function createSurfaceBuiltins() {
    (0, _builtinJs.Builtin).createBuiltin("make-surface", [
        "w#%?",
        "h#%?"
    ], function $makeSurface(env, executionEnvironment) {
        let wnex = env.lb("w");
        let hnex = env.lb("h");
        let w = wnex == (0, _environmentJs.UNBOUND) ? 100 : wnex.getTypedValue();
        let h = hnex == (0, _environmentJs.UNBOUND) ? 100 : hnex.getTypedValue();
        let r = constructSurface(w, h);
        return r;
    }, "Creates a 2d drawing surface with the given width and height.");
    (0, _builtinJs.Builtin).createBuiltin("fill-background", [
        "surf",
        "color()"
    ], function $fillBackground(env, executionEnvironment) {
        let surf = env.lb("surf");
        let color = env.lb("color");
        if (!surf.isValidColorList(color)) return (0, _eerrorJs.constructFatalError)(`fill-background: color list must have exactly three integer members.`);
        // most of them can have an alpha component, but background fill can't.
        if (color.numChildren() != 3) return (0, _eerrorJs.constructFatalError)(`fill-background: color list must have exactly three integer members.`);
        let colorarray = surf.convertColorList(color);
        surf.fillBackground(colorarray);
        return surf;
    }, "Fills the surface background with a color.");
    (0, _builtinJs.Builtin).createBuiltin("draw-line", [
        "surf",
        "color()",
        "x1#%",
        "y1#%",
        "x2#%",
        "y2#%"
    ], function $drawLine(env, executionEnvironment) {
        let surf = env.lb("surf");
        let color = env.lb("color");
        if (!surf.isValidColorList(color)) return (0, _eerrorJs.constructFatalError)(`draw-line: color list must have exactly three or four integer members.`);
        let colorarray = surf.convertColorList(color);
        let x1 = env.lb("x1").getTypedValue();
        let y1 = env.lb("y1").getTypedValue();
        let x2 = env.lb("x2").getTypedValue();
        let y2 = env.lb("y2").getTypedValue();
        surf.drawLine(colorarray, x1, y1, x2, y2);
        return surf;
    }, "Draws a line on the surface.");
    (0, _builtinJs.Builtin).createBuiltin("draw-rectangle", [
        "surf",
        "color()",
        "x#%",
        "y#%",
        "w#%",
        "h#%"
    ], function $drawRectangle(env, executionEnvironment) {
        let surf = env.lb("surf");
        let color = env.lb("color");
        if (!surf.isValidColorList(color)) return (0, _eerrorJs.constructFatalError)(`draw-rectangle: color list must have exactly three or four integer members.`);
        let colorarray = surf.convertColorList(color);
        let x = env.lb("x").getTypedValue();
        let y = env.lb("y").getTypedValue();
        let w = env.lb("w").getTypedValue();
        let h = env.lb("h").getTypedValue();
        surf.drawRect(colorarray, x, y, w, h);
        return surf;
    }, "Draws a rectangle on the surface.");
    (0, _builtinJs.Builtin).createBuiltin("draw-dot", [
        "surf",
        "color()",
        "x#%",
        "y#%"
    ], function $drawRectangle(env, executionEnvironment) {
        let surf = env.lb("surf");
        let color = env.lb("color");
        if (!surf.isValidColorList(color)) return (0, _eerrorJs.constructFatalError)(`draw-dot: color list must have exactly three or four integer members.`);
        let colorarray = surf.convertColorList(color);
        let x = env.lb("x").getTypedValue();
        let y = env.lb("y").getTypedValue();
        surf.drawDot(colorarray, x, y);
        return surf;
    }, "Draws a dot on the surface.");
    (0, _builtinJs.Builtin).createBuiltin("color-at", [
        "surf",
        "x#%",
        "y#%"
    ], function $drawRectangle(env, executionEnvironment) {
        let surf = env.lb("surf");
        let x = env.lb("x").getTypedValue();
        let y = env.lb("y").getTypedValue();
        let colorarray = surf.colorAt(x, y);
        let r = (0, _orgJs.constructOrg)();
        r.appendChild((0, _integerJs.constructInteger)(colorarray[0]));
        r.appendChild((0, _integerJs.constructInteger)(colorarray[1]));
        r.appendChild((0, _integerJs.constructInteger)(colorarray[2]));
        r.appendChild((0, _integerJs.constructInteger)(colorarray[3]));
        return r;
    }, "Draws a dot on the surface.");
    (0, _builtinJs.Builtin).createBuiltin("copy-from-clipboard", [
        "surf"
    ], function $drawRectangle(env, executionEnvironment) {
        let surf = env.lb("surf");
        surf.copyFromClipboard();
        return surf;
    }, "Copys the contents of the image clipboard into the surface.");
}

},{"../utils.js":"bIDtH","../nex/builtin.js":"cOoeb","../nex/org.js":"28wYz","../nex/integer.js":"cjEX0","../nex/surface.js":"iMboo","../environment.js":"4mXDy","../nex/eerror.js":"4Xsbj","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"iMboo":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Surface", ()=>Surface);
parcelHelpers.export(exports, "constructSurface", ()=>constructSurface);
var _utilsJs = require("../utils.js");
var _nexJs = require("./nex.js");
var _heapJs = require("../heap.js");
var _eerrorJs = require("./eerror.js");
/**
 * Represents a drawing surface (canvas).
 */ class Surface extends (0, _nexJs.Nex) {
    constructor(w, h){
        super();
        if (!w) w = 100;
        if (!h) h = 100;
        this.width = w;
        this.height = h;
        this.canvas = document.createElement("canvas");
        this.canvas.setAttribute("width", "" + this.width);
        this.canvas.setAttribute("height", "" + this.height);
    }
    getTypeName() {
        return "-surface-";
    }
    makeCopy() {
        let r = constructSurface(this.width, this.height);
        this.copyFieldsTo(r);
        return r;
    }
    copyFieldsTo(nex) {
        super.copyFieldsTo(nex);
        nex.canvas.getContext("2d").drawImage(this.canvas, 0, 0);
    }
    toString(version) {
        if (version == "v2") return this.toStringV2();
        return super.toString(version);
    }
    renderInto(renderNode, renderFlags, withEditor) {
        super.renderInto(renderNode, renderFlags, withEditor);
        let domNode = renderNode.getDomNode();
        domNode.classList.add("surface");
        domNode.appendChild(this.canvas);
    }
    // erm changes a number to a hex string I think
    toHex(n) {
        let z = n.toString(16);
        if (z.length == 1) z = "0" + z;
        return z;
    }
    isValidColorList(n) {
        let nc = n.numChildren();
        if (nc != 3 && nc != 4) return false;
        for(let i = 0; i < n.numChildren(); i++){
            let c = n.getChildAt(i);
            if (!_utilsJs.isInteger(c)) return false;
        }
        return true;
    }
    convertColorList(n) {
        let carray = [];
        for(let i = 0; i < n.numChildren(); i++){
            let c = n.getChildAt(i);
            carray.push(c.getTypedValue());
        }
        return carray;
    }
    setFillFromColor(color) {
        let t, r, g, b;
        if (color.length == 4) {
            t = color[0] / 256.0;
            r = color[1];
            g = color[2];
            b = color[3];
        } else {
            t = 1.0;
            r = color[0];
            g = color[1];
            b = color[2];
        }
        let ctx = this.canvas.getContext("2d");
        ctx.globalAlpha = t;
        ctx.fillStyle = "#" + this.toHex(r) + this.toHex(g) + this.toHex(b);
    }
    setStrokeFromColor(color) {
        let t, r, g, b;
        if (color.length == 4) {
            t = color[0] / 256.0;
            r = color[1];
            g = color[2];
            b = color[3];
        } else {
            t = 1.0;
            r = color[0];
            g = color[1];
            b = color[2];
        }
        let ctx = this.canvas.getContext("2d");
        ctx.globalAlpha = t;
        ctx.strokeStyle = "#" + this.toHex(r) + this.toHex(g) + this.toHex(b);
    }
    fillBackground(color) {
        let r = color[0];
        let g = color[1];
        let b = color[2];
        let ctx = this.canvas.getContext("2d");
        ctx.fillStyle = "#" + this.toHex(r) + this.toHex(g) + this.toHex(b);
        ctx.fillRect(0, 0, this.width, this.height);
    }
    drawLine(color, x1, y1, x2, y2) {
        let ctx = this.canvas.getContext("2d");
        this.setStrokeFromColor(color);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
    }
    drawRect(color, x, y, w, h) {
        this.setFillFromColor(color);
        let ctx = this.canvas.getContext("2d");
        ctx.fillRect(x, y, w, h);
    }
    drawDot(color, x, y) {
        this.setFillFromColor(color);
        let ctx = this.canvas.getContext("2d");
        ctx.fillRect(x, y, 1, 1);
    }
    colorAt(x, y) {
        let ctx = this.canvas.getContext("2d");
        let imgdata = ctx.getImageData(x, y, 1, 1);
        let r = imgdata.data[0];
        let g = imgdata.data[1];
        let b = imgdata.data[2];
        let a = imgdata.data[3];
        return [
            r,
            g,
            b,
            a
        ];
    }
    copyFromClipboard() {
        navigator.clipboard.read().then((data)=>{
            if (data.length != 1) return;
            let item = data[0];
            if (item.types[0] != "image/png") return;
            item.getType("image/png").then((blob)=>{
                let image = document.createElement("img");
                image.src = URL.createObjectURL(blob);
                let body = document.getElementsByTagName("body")[0];
                body.appendChild(image);
                let t = this;
                setTimeout((function() {
                    let ctx = this.canvas.getContext("2d");
                    ctx.drawImage(image, 0, 0);
                    body.removeChild(image);
                }).bind(this), 10);
            });
        });
    }
    toStringV2() {
        return `[${this.toStringV2Literal()}surface]${this.toStringV2PrivateDataSection()}${this.toStringV2TagList()}`;
    }
    deserializePrivateData(data) {}
    serializePrivateData() {
        return "";
    }
    getDefaultHandler() {
        return "standardDefault";
    }
    getEventTable(context) {
        return {};
    }
    memUsed() {
        return super.memUsed() + (0, _heapJs.heap).sizeSurface();
    }
}
function constructSurface(w, h) {
    let sizeRequired = (0, _heapJs.heap).sizeSurface() + w * h * (0, _heapJs.heap).incrementalSizeSurface();
    if (!(0, _heapJs.heap).requestMem(sizeRequired)) throw (0, _eerrorJs.constructFatalError)(`OUT OF MEMORY: cannot allocate Surface.
stats: ${(0, _heapJs.heap).stats()}`);
    return (0, _heapJs.heap).register(new Surface(w, h));
}

},{"../utils.js":"bIDtH","./nex.js":"gNpCL","../heap.js":"67mlv","./eerror.js":"4Xsbj","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"7tIfs":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "createBasicBuiltins", ()=>createBasicBuiltins);
var _utilsJs = require("../utils.js");
var _nexJs = require("../nex/nex.js");
var _nexcontainerJs = require("../nex/nexcontainer.js");
var _valuenexJs = require("../nex/valuenex.js");
var _builtinJs = require("../nex/builtin.js");
var _boolJs = require("../nex/bool.js");
var _eerrorJs = require("../nex/eerror.js");
var _integerJs = require("../nex/integer.js");
var _nilJs = require("../nex/nil.js");
var _evaluatorJs = require("../evaluator.js");
function createBasicBuiltins() {
    (0, _builtinJs.Builtin).createBuiltin("begin", [
        "nex..."
    ], function $begin(env, executionEnvironment) {
        let lst = env.lb("nex");
        if (lst.numChildren() == 0) return (0, _nilJs.constructNil)();
        else return lst.getChildAt(lst.numChildren() - 1);
    }, "Evaluates all arguments in order from first to last, returning only the result of the last evaluation.");
    (0, _builtinJs.Builtin).createBuiltin("car", [
        "list()"
    ], function $head(env, executionEnvironment) {
        let lst = env.lb("list");
        if (lst.numChildren() == 0) return (0, _eerrorJs.constructFatalError)("car: cannot get first element of empty list. Sorry!");
        return lst.getFirstChild();
    }, "Returns the first element of |list without altering |list. Aliases: head, first.");
    (0, _builtinJs.Builtin).aliasBuiltin("head", "car");
    (0, _builtinJs.Builtin).aliasBuiltin("first", "car");
    (0, _builtinJs.Builtin).createBuiltin("cdr", [
        "list()"
    ], function $tail(env, executionEnvironment) {
        let c = env.lb("list");
        if (c.numChildren() == 0) return (0, _eerrorJs.constructFatalError)("cdr: given an empty list, cannot make a new list with first element removed. Sorry!");
        let newOne = c.makeCopy(true);
        c.getChildrenForCdr(newOne);
        return newOne;
    }, "Returns a copy of |list containing all elements of |list except the first one. Aliases: tail, rest.");
    (0, _builtinJs.Builtin).aliasBuiltin("tail", "cdr");
    (0, _builtinJs.Builtin).aliasBuiltin("rest", "cdr");
    (0, _builtinJs.Builtin).createBuiltin("cons", [
        "nex",
        "list()"
    ], function $pushInto(env, executionEnvironment) {
        let nex = env.lb("nex");
        let lst = env.lb("list");
        let newOne = lst.makeCopy(true);
        lst.setChildrenForCons(nex, newOne);
        return newOne;
    }, "Returns a new list created by prepending |nex to a copy of |list. Aliases: push, push-into.");
    (0, _builtinJs.Builtin).aliasBuiltin("push", "cons");
    (0, _builtinJs.Builtin).aliasBuiltin("push into", "cons");
    (0, _builtinJs.Builtin).createBuiltin("chop", [
        "list()"
    ], function $hardHead(env, executionEnvironment) {
        let c = env.lb("list");
        if (c.numChildren() == 0) return (0, _eerrorJs.constructFatalError)("chop: cannot get first element of empty list. Sorry!");
        let r = c.getChildAt(0);
        c.removeChild(c.getChildAt(0));
        return r;
    }, "Removes the first element of |list, destructively altering list, and returns the removed element. Aliases: hard-car, hard-first, hard-head.");
    (0, _builtinJs.Builtin).aliasBuiltin("hard-car", "chop");
    (0, _builtinJs.Builtin).aliasBuiltin("hard-first", "chop");
    (0, _builtinJs.Builtin).aliasBuiltin("hard-head", "chop");
    (0, _builtinJs.Builtin).createBuiltin("chomp", [
        "list()"
    ], function $hardTail(env, executionEnvironment) {
        let c = env.lb("list");
        if (c.numChildren() == 0) return (0, _eerrorJs.constructFatalError)("chomp: cannot remove first element of empty list. Sorry!");
        c.removeChild(c.getChildAt(0));
        return c;
    }, "Destructively removes the first element of |list, and returns the altered |list. Aliases: hard-cdr, hard-tail, hard-rest.");
    (0, _builtinJs.Builtin).aliasBuiltin("hard-cdr", "chomp");
    (0, _builtinJs.Builtin).aliasBuiltin("hard-rest", "chomp");
    (0, _builtinJs.Builtin).aliasBuiltin("hard-tail", "chomp");
    (0, _builtinJs.Builtin).createBuiltin("cram", [
        "nex",
        "list()"
    ], function $hardPushInto(env, executionEnvironment) {
        let lst = env.lb("list");
        lst.prependChild(env.lb("nex"));
        return lst;
    }, "Destructively alters |list by prepending |nex to it. Aliases: hard-cons, hard-push, hard-push into.");
    (0, _builtinJs.Builtin).aliasBuiltin("hard-cons", "cram");
    (0, _builtinJs.Builtin).aliasBuiltin("hard-push", "cram");
    (0, _builtinJs.Builtin).aliasBuiltin("hard-push into", "cram");
    (0, _builtinJs.Builtin).createBuiltin("copy", [
        "nex"
    ], function $copy(env, executionEnvironment) {
        return env.lb("nex").makeCopy();
    }, "Returns a deep copy of |nex (if |nex is a list, list elements are also copied).");
    (0, _builtinJs.Builtin).createBuiltin("eq", [
        "lhs",
        "rhs"
    ], function $eq(env, executionEnvironment) {
        let lhs = env.lb("lhs");
        let rhs = env.lb("rhs");
        return (0, _boolJs.constructBool)(rhs.getID() == lhs.getID());
    }, "returns true if |lhs and |rhs refer to the same in-memory object (pointer equality).");
    (0, _builtinJs.Builtin).createBuiltin("list-length", [
        "lst()"
    ], function $eq(env, executionEnvironment) {
        let lst = env.lb("lst");
        return (0, _integerJs.constructInteger)(lst.numChildren());
    }, "returns the length of |lst.");
    (0, _builtinJs.Builtin).createBuiltin("list-get", [
        "lst()",
        "i#"
    ], function $eq(env, executionEnvironment) {
        let lst = env.lb("lst");
        let ind = env.lb("i");
        let i = ind.getTypedValue();
        if (i < 0 || i >= lst.numChildren()) return (0, _eerrorJs.constructFatalError)(`invalid list index, must be between 0 and ${lst.numChildren()}`);
        return lst.getChildAt(i);
    }, "returns the element of the list at position |i.");
    (0, _builtinJs.Builtin).createBuiltin("equal", [
        "lhs",
        "rhs"
    ], function $equal(env, executionEnvironment) {
        let lhs = env.lb("lhs");
        let rhs = env.lb("rhs");
        let compareLists = function(list1, list2) {
            if (list1.numChildren() != list2.numChildren()) return false;
            for(let i = 0; i < list1.numChildren(); i++){
                let c1 = list1.getChildAt(i);
                let c2 = list2.getChildAt(i);
                if (!compareNexes(c1, c2)) return false;
            }
            return true;
        };
        let compareNexes = function(a, b) {
            if (_utilsJs.isBool(a) && _utilsJs.isBool(b)) return a.getTypedValue() == b.getTypedValue();
            else if (_utilsJs.isBuiltin(a) && _utilsJs.isBuiltin(b)) return a.getID() == b.getID();
            else if (_utilsJs.isEString(a) && _utilsJs.isEString(b)) return a.getFullTypedValue() == b.getFullTypedValue();
            else if (_utilsJs.isESymbol(a) && _utilsJs.isESymbol(b)) return a.getTypedValue() == b.getTypedValue();
            else if (_utilsJs.isFloat(a) && _utilsJs.isFloat(b)) return a.getTypedValue() == b.getTypedValue();
            else if (_utilsJs.isInteger(a) && _utilsJs.isInteger(b)) return a.getTypedValue() == b.getTypedValue();
            else if (_utilsJs.isFloat(a) && _utilsJs.isInteger(b)) return a.getTypedValue() == b.getTypedValue();
            else if (_utilsJs.isInteger(a) && _utilsJs.isFloat(b)) return a.getTypedValue() == b.getTypedValue();
            else if (_utilsJs.isLetter(a) && _utilsJs.isLetter(b)) return a.getText() == b.getText();
            else if (_utilsJs.isSeparator(a) && _utilsJs.isSeparator(b)) return a.getText() == b.getText();
            else if (_utilsJs.isNil(a) && _utilsJs.isNil(b)) return true;
            else if (_utilsJs.isOrg(a) && _utilsJs.isOrg(b)) return compareLists(a, b);
            else if (_utilsJs.isCommand(a) && _utilsJs.isCommand(b)) return compareLists(a, b);
            else if (_utilsJs.isLambda(a) && _utilsJs.isLambda(b)) return compareLists(a, b);
            else if (_utilsJs.isDoc(a) && _utilsJs.isDoc(b)) return compareLists(a, b);
            else if (_utilsJs.isLine(a) && _utilsJs.isLine(b)) return compareLists(a, b);
            else if (_utilsJs.isWord(a) && _utilsJs.isWord(b)) return compareLists(a, b);
            else if (_utilsJs.isDeferredCommand(a) && _utilsJs.isDeferredCommand(b)) return compareLists(a, b);
            else return false;
        };
        let result = compareNexes(lhs, rhs);
        return (0, _boolJs.constructBool)(result);
    }, "Attempts to test |rhs and |lhs for semantic equality (for example, different integers will test as equal if they represent the same numeric value). Will deep compare lists.");
    // Note the args to the eval function are evaluated.
    (0, _builtinJs.Builtin).createBuiltin("eval", [
        "nex"
    ], function $eval(env, executionEnvironment) {
        let expr = env.lb("nex");
        let newresult = (0, _evaluatorJs.evaluateNexSafely)(expr, executionEnvironment);
        // we do not wrap errors for eval - we let
        // the caller deal with it
        return newresult;
    }, "Returns the result of evaluating |nex. Since the argument to this function is already evaluated anyway, this will actually result in a double evaluation.");
    (0, _builtinJs.Builtin).createBuiltin("quote", [
        "_nex"
    ], function $quote(env, executionEnvironment) {
        return env.lb("nex");
    }, "Returns |nex without evaluating it. Can be used to stop a function argument from being evaluated.");
    (0, _builtinJs.Builtin).createBuiltin("horizontal", [
        "list()"
    ], function $horizontal(env, executionEnvironment) {
        let n = env.lb("list");
        n.setHorizontal();
        return n;
    }, "Sets the direction of |list to horizontal.");
    (0, _builtinJs.Builtin).createBuiltin("vertical", [
        "list()"
    ], function $vertical(env, executionEnvironment) {
        let n = env.lb("list");
        n.setHorizontal();
        return n;
    }, "Sets the direction of |list to vertical.");
    (0, _builtinJs.Builtin).createBuiltin("zdirectional", [
        "list()"
    ], function $zdirectional(env, executionEnvironment) {
        let n = env.lb("list");
        n.setHorizontal();
        return n;
    }, 'Sets the direction of |list to "zdirectional" (elements appear overlapping each other, coming "out" of the screen)');
    (0, _builtinJs.Builtin).createBuiltin("mutable", [
        "nex"
    ], function $mutable(env, executionEnvironment) {
        let n = env.lb("nex");
        n.setMutable(true);
        return n;
    }, "Makes |nex mutable.");
    (0, _builtinJs.Builtin).createBuiltin("immutable", [
        "nex"
    ], function $immutable(env, executionEnvironment) {
        let n = env.lb("nex");
        n.setMutable(false);
        return n;
    }, "Makes |nex immutable.");
}

},{"../utils.js":"bIDtH","../nex/nex.js":"gNpCL","../nex/nexcontainer.js":"e7Ky3","../nex/valuenex.js":"8G1WY","../nex/builtin.js":"cOoeb","../nex/bool.js":"3MKly","../nex/eerror.js":"4Xsbj","../nex/integer.js":"cjEX0","../nex/nil.js":"amOKC","../evaluator.js":"1TNlN","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"9CLkf":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "createContractBuiltins", ()=>createContractBuiltins);
var _builtinJs = require("../nex/builtin.js");
var _eerrorJs = require("../nex/eerror.js");
var _contractJs = require("../nex/contract.js");
var _contractfunctionsJs = require("../contractfunctions.js");
var _tagJs = require("../tag.js");
function createContractBuiltins() {
    // tagged as -- satisfies --
    // - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  
    (0, _builtinJs.Builtin).createBuiltin("certify satisfies", [
        "tag$",
        "contract\u043A"
    ], function $mustBe(env, executionEnvironment) {
        // TODO: type check
        let tagname = env.lb("tag");
        let c = env.lb("contract");
        let tag = (0, _eerrorJs.newTagOrThrowOOM)(tagname.getFullTypedValue(), "certify satisfies builtin");
        (0, _contractfunctionsJs.contractEnforcer).createContract(tag, c.getImpl());
        c.addContractTag(tag);
        return c;
    }, "Declares that any object tagged with |tag must satisfy the passed-in |contract.");
    (0, _builtinJs.Builtin).createBuiltin("has-tag-contract", [
        "tag$"
    ], function $hasTagContract(env, executionEnvironment) {
        let tag = env.lb("tag");
        let contractImpl = new (0, _contractfunctionsJs.HasTagContract)((0, _eerrorJs.newTagOrThrowOOM)(tag.getFullTypedValue(), "has tag contract builtin"));
        let cnex = (0, _contractJs.constructContract)(contractImpl);
        return cnex;
    }, "Returns a contract that is satisfied if something is tagged with |tag.");
    (0, _builtinJs.Builtin).createBuiltin("identity-contract", [
        "nex"
    ], function $mustBe(env, executionEnvironment) {
        let nex = env.lb("nex");
        let contractImpl = new (0, _contractfunctionsJs.IdentityContract)(nex.getID());
        let cnex = (0, _contractJs.constructContract)(contractImpl);
        return cnex;
    }, "Returns a contract that is only satisfied for the specific passed-in object |nex.");
    (0, _builtinJs.Builtin).createBuiltin("type-contract", [
        "nex"
    ], function $mustHaveTypeOf(env, executionEnvironment) {
        let nex = env.lb("nex");
        let contractImpl = new (0, _contractfunctionsJs.TypeContract)(nex.getTypeName());
        return (0, _contractJs.constructContract)(contractImpl);
    }, "Returns a contract that is only satisified if an object has the same type as |nex.");
// Builtin.createBuiltin(
// 	'all-of-contract',
// 	[ 'c...' ],
// 	function $allOfContract(env, executionEnvironment) {
// 		let c = env.lb('c');
// 		let constituentContracts = [];
// 		for (let i = 0; i < c.numChildren(); i++) {
// 			constituentContracts[i] = c.getChildAt(i).getImpl();
// 		}
// 		let contractImpl = new AllOfContract(constituentContracts);
// 		return constructContract(contractImpl);
// 	},
// 	'Returns a contract that is only satisfied if all the constituent contracts |c are satisfied.'
// );
// What we actually want are:
/*

	## simple contracts ##

	all-children-contract -- satisfied if all children satisfy the contract
	no-child-contract -- satisfied if no child has that contract
	some-child-contract -- satisfied if it has some child with the given contract
	all-child-pairs-contract -- satisfied if all pairs of children satisfy the contract
	some-child-pair-contract -- satisified if some pair of children satisfy the contract
	no-child-pair-contract -- satisfied if no pair of children satisfy the contract

	## composite contracts ##

	any-of-contract -- satisfied if any of the contracts that are children of the contract nex are satisfied
	none-of-contract -- satisifed if none of the contracts that are children of the contract nex are satisfied
	all-of-contract -- satisfied if all of the contracts that are children of the contract nex are satisfied

	*/ // Builtin.createBuiltin(
// 	'contains-exactly-contract',
// 	[ 'c...' ],
// 	function $containsExactly(env, executionEnvironment) {
// 		let c = env.lb('c');
// 		let contractImpl = new ContainsExactlyContract();
// 		let r = constructContract(contractImpl);
// 		for (let i = 0; i < c.numChildren(); i++) {
// 			r.appendChild(c.getChildAt(i));
// 		}
// 		return r;
// 	},
// 	'Returns a contract that is only satisfied if the object has children that exactly match the child contracts.'
// );
}

},{"../nex/builtin.js":"cOoeb","../nex/eerror.js":"4Xsbj","../nex/contract.js":"5H5dj","../contractfunctions.js":"f9THN","../tag.js":"975jg","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"5H5dj":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "Contract", ()=>Contract);
parcelHelpers.export(exports, "constructContract", ()=>constructContract);
var _utilsJs = require("../utils.js");
var _nexcontainerJs = require("./nexcontainer.js");
var _eerrorJs = require("./eerror.js");
var _heapJs = require("../heap.js");
class Contract extends (0, _nexcontainerJs.NexContainer) {
    constructor(contractImpl){
        // memory ok
        super();
        this.impl = contractImpl;
        this.privateData = null; // unused
        this.contractTags = [];
    }
    addContractTag(t) {
        this.contractTags.push((0, _eerrorJs.newTagOrThrowOOM)(t.getTagString(), "adding contract tag member to contract"));
    }
    getImpl() {
        return this.impl;
    }
    toString(version) {
        if (version == "v2") return `[CONTRACT]`;
        return super.toString(version);
    }
    prettyPrintInternal(lvl, hdir) {
        return this.standardListPrettyPrint(lvl, "[contract]", hdir);
    }
    toStringV2() {
        return `${this.toStringV2Literal()}${this.toStringV2PrivateDataSection()}${this.listStartV2()}${this.toStringV2TagList()}${super.childrenToString("v2")}${this.listEndV2()}`;
    }
    deserializePrivateData(data) {
        this.privateData = data;
    }
    serializePrivateData(data) {
        return this.privateData;
    }
    evaluate(env) {
        return this;
    }
    makeCopy(shallow) {
        let r = constructContract();
        this.copyChildrenTo(r, shallow);
        this.copyFieldsTo(r);
        return r;
    }
    copyFieldsTo(nex) {
        super.copyFieldsTo(nex);
        nex.impl = this.impl;
    }
    insertChildAt(c, i) {
        if (c.getTypeName() != "-contract-") throw (0, _eerrorJs.constructFatalError)("contracts can only hold other contracts.");
        this.impl.addChildAt(c.getImpl(), i);
        super.insertChildAt(c, i);
    }
    removeChildAt(i) {
        this.impl.removeChildAt(i);
        super.removeChildAt(i);
    }
    fastAppendChildAfter(c, after) {
        if (c.getTypeName() != "-contract-") throw (0, _eerrorJs.constructFatalError)("contracts can only hold other contracts.");
        let n = this.numChildren() - 1;
        for(let i = 0; i < this.numChildren(); i++)if (this.getChildAt(i) == after) n = i;
        super.fastAppendChildAfter(c, after);
        n = n + 1;
        this.impl.addChildAt(c.getImpl(), n);
    }
    renderInto(renderNode, renderFlags, withEditor) {
        let domNode = renderNode.getDomNode();
        super.renderInto(renderNode, renderFlags, withEditor);
        domNode.classList.add("contract");
        let frame = document.createElement("div");
        frame.classList.add("contractframe");
        let glyph = document.createElement("div");
        glyph.classList.add("cglyph");
        if (this.numChildren() > 0) glyph.innerHTML = "&#8225;"; // double dagger
        else glyph.innerHTML = "&#8224;"; // regular dagger
        let innerspans = document.createElement("div");
        innerspans.classList.add("cinnerspans");
        let innerspan = document.createElement("div");
        innerspan.classList.add("innerspan");
        innerspan.innerHTML = "" + this.impl.getContractName();
        innerspans.appendChild(innerspan);
        let innerspan2 = document.createElement("div");
        innerspan2.classList.add("innerspan");
        innerspan2.innerHTML = "" + this.impl.getDescription();
        innerspans.appendChild(innerspan2);
        if (this.contractTags.length > 0) {
            let tagspan = document.createElement("div");
            tagspan.classList.add("tagspan");
            for(let i = 0; i < this.contractTags.length; i++){
                let t = this.contractTags[i];
                t.setIsGhost(true);
                t.draw(tagspan, true);
            }
            innerspans.appendChild(tagspan);
        }
        frame.appendChild(glyph);
        frame.appendChild(innerspans);
        domNode.appendChild(frame);
    }
    getTypeName() {
        return "-contract-";
    }
    memUsed() {
        let tagMem = 0;
        this.contractTags.forEach((tag)=>{
            tagMem += tag.memUsed();
        });
        return tagMem + super.memUsed() + (0, _heapJs.heap).sizeContract();
    }
}
function constructContract(contractImpl) {
    if (!(0, _heapJs.heap).requestMem((0, _heapJs.heap).sizeContract())) throw constuctFatalError(`OUT OF MEMORY: cannot allocate Contract.
stats: ${(0, _heapJs.heap).stats()}`);
    return (0, _heapJs.heap).register(new Contract(contractImpl));
}

},{"../utils.js":"bIDtH","./nexcontainer.js":"e7Ky3","./eerror.js":"4Xsbj","../heap.js":"67mlv","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"5FIGP":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "createEnvironmentBuiltins", ()=>createEnvironmentBuiltins);
var _utilsJs = require("../utils.js");
var _autocompleteJs = require("../autocomplete.js");
var _builtinJs = require("../nex/builtin.js");
var _eerrorJs = require("../nex/eerror.js");
var _estringJs = require("../nex/estring.js");
var _boolJs = require("../nex/bool.js");
var _esymbolJs = require("../nex/esymbol.js");
var _nilJs = require("../nex/nil.js");
var _orgJs = require("../nex/org.js");
var _environmentJs = require("../environment.js");
var _perfmonJs = require("../perfmon.js");
var _evaluatorJs = require("../evaluator.js");
var _globalappflagsJs = require("../globalappflags.js");
var _syntheticrootJs = require("../syntheticroot.js");
function createEnvironmentBuiltins() {
    (0, _builtinJs.Builtin).createBuiltin("bind", [
        "_name@",
        "nex"
    ], function $bind(env, executionEnvironment) {
        let val = env.lb("nex");
        let name = env.lb("name");
        let namestr = name.getTypedValue();
        if (namestr.indexOf(":") >= 0) return (0, _eerrorJs.constructFatalError)("bind: cannot bind a symbol with a colon (:) except via the package mechanism. Sorry!");
        let packageName = executionEnvironment.getPackageForBinding();
        if (packageName) (0, _environmentJs.BINDINGS).bindInPackage(namestr, val, packageName);
        else (0, _environmentJs.BINDINGS).normalBind(namestr, val);
        return name;
    }, "Binds a new global variable named |name to |nex. Aliases: bind to");
    (0, _builtinJs.Builtin).aliasBuiltin("bind to", "bind");
    (0, _builtinJs.Builtin).createBuiltin("bindings", [
        "_search@?"
    ], function $bindings(env, executionEnvironment) {
        let ssnex = env.lb("search");
        let ss = "";
        if (ssnex != (0, _environmentJs.UNBOUND)) ss = ssnex.getTypedValue();
        let matches = (0, _autocompleteJs.autocomplete).findAllBindingsMatching(ss);
        let r = (0, _orgJs.constructOrg)();
        for(let j = 0; j < matches.length; j++)r.appendChild((0, _esymbolJs.constructESymbol)(matches[j].name));
        return r;
    }, "Returns a list of all globally bound variables that match the search string |search, or all if |search is omitted.");
    (0, _builtinJs.Builtin).createBuiltin("builtins", [
        "_search@?"
    ], function $builtins(env, executionEnvironment) {
        let ssnex = env.lb("search");
        let ss = "";
        if (ssnex != (0, _environmentJs.UNBOUND)) ss = ssnex.getTypedValue();
        let matches = (0, _autocompleteJs.autocomplete).findAllBuiltinsMatching(ss);
        let r = (0, _orgJs.constructOrg)();
        for(let j = 0; j < matches.length; j++)r.appendChild((0, _esymbolJs.constructESymbol)(matches[j].name));
        return r;
    }, "Returns a list of standard Vodka builtin function names that match |search, or all of them if |search arg is not provided.");
    (0, _builtinJs.Builtin).createBuiltin("is-bound", [
        "_name@"
    ], function $isBound(env, executionEnvironment) {
        let name = env.lb("name");
        try {
            let binding = executionEnvironment.lookupBinding(name.getTypedValue());
            return (0, _boolJs.constructBool)(true);
        } catch (e) {
            // don't swallow real errors
            if (e.getTypeName && e.getTypeName() == "-error-" && e.getFullTypedValue().substr(0, 16) == "undefined symbol") return (0, _boolJs.constructBool)(false);
            else throw e;
        }
    }, "Returns true if the symbol |name is bound in the global environment.");
    (0, _builtinJs.Builtin).createBuiltin("let", [
        "_name@",
        "nex"
    ], function $let(env, executionEnvironment) {
        let rhs = env.lb("nex");
        let symname = env.lb("name").getTypedValue();
        executionEnvironment.bind(symname, rhs);
        if (rhs.getTypeName() == "-closure-") // basically let is always "letrec"
        rhs.getLexicalEnvironment().bind(symname, rhs);
        return rhs;
    }, "Binds the variable |name to |nex in the current closure's local scope. Aliases: let be");
    (0, _builtinJs.Builtin).aliasBuiltin("let be", "let");
    (0, _builtinJs.Builtin).createBuiltin("set", [
        "_name@",
        "nex"
    ], function $set(env, executionEnvironment) {
        let namenex = env.lb("name");
        let rhs = env.lb("nex");
        let name = namenex.getTypedValue();
        let tag = null;
        if (namenex.numTags() == 1) tag = namenex.getTag(0);
        executionEnvironment.set(name, rhs, tag);
        return rhs;
    }, `Changes the binding for |name so that it becomes bound to |nex, regardless of the scope of |name (it can be a local variable, in an enclosing scope, or a globally bound symbol). This function doesn't change the scope of |name.`);
    (0, _builtinJs.Builtin).createBuiltin("unclose", [
        "closure&"
    ], function $unclose(env, executionEnvironment) {
        // replaces the closure with the dynamic scope of the function we are in
        let rhs = env.lb("closure");
        rhs.setLexicalEnvironment(executionEnvironment);
        return rhs;
    }, "Replaces the lexical environment of |closure with the lexical environment that exists at the call site of this call to unclose.");
    (0, _builtinJs.Builtin).createBuiltin("use", [
        "_name@"
    ], function $use(env, executionEnvironment) {
        let packageName = env.lb("name").getTypedValue();
        if (!(0, _environmentJs.BINDINGS).isKnownPackageName(packageName)) return (0, _eerrorJs.constructFatalError)(`use: invalid package name ${packageName}. Sorry!`);
        executionEnvironment.usePackage(packageName);
        return (0, _nilJs.constructNil)();
    }, "Makes it so bindings in the package |name can be dereferenced without the package identifier. Stays in effect for the remainder of the current scope.");
    (0, _builtinJs.Builtin).createBuiltin("using", [
        "_namelist()",
        "_nex..."
    ], function $using(env, executionEnvironment) {
        let packageList = env.lb("namelist");
        for(let i = 0; i < packageList.numChildren(); i++){
            let c = packageList.getChildAt(i);
            if (!(c.getTypeName() == "-symbol-")) return (0, _eerrorJs.constructFatalError)(`using: first arg must be a list of symbols that denote package names, but ${c.prettyPrint()} is not a symbol. Sorry!`);
            let packageName = c.getTypedValue();
            if (!(0, _environmentJs.BINDINGS).isKnownPackageName(packageName)) return (0, _eerrorJs.constructFatalError)(`using: invalid package name ${packageName}. Sorry!`);
            executionEnvironment.usePackage(packageName);
        }
        let lst = env.lb("nex");
        let result = (0, _nilJs.constructNil)();
        for(let j = 0; j < lst.numChildren(); j++){
            let c = lst.getChildAt(j);
            result = (0, _syntheticrootJs.sAttach)((0, _evaluatorJs.evaluateNexSafely)(c, executionEnvironment));
            if (_utilsJs.isFatalError(result)) {
                result = (0, _evaluatorJs.wrapError)("&szlig;", `using: error in expression ${j + 1}, cannot continue. Sorry!`, result);
                return result;
            }
        }
        return result;
    }, "makes it so bindings in the packages in |namelist can be dereferenced without the package identifier when evaluating the rest of the arguments.");
    (0, _builtinJs.Builtin).createBuiltin("dump-memory", [
        "closure&"
    ], function $dumpMemory(env, executionEnvironment) {
        let closure = env.lb("closure");
        let lexenv = closure.getLexicalEnvironment();
        let doLevel = function(envAtLevel) {
            let r = (0, _orgJs.constructOrg)();
            envAtLevel.doForEachBinding(function(binding) {
                let rec = (0, _orgJs.constructOrg)();
                rec.appendChild((0, _esymbolJs.constructESymbol)(binding.name));
                rec.appendChild(binding.val);
                r.appendChild(rec);
            });
            if (envAtLevel.getParent()) r.appendChild(doLevel(envAtLevel.getParent()));
            return r;
        };
        return doLevel(lexenv);
    }, "Returns the memory environment of |closure, in the form of a list containing all bound symbols along with their values.");
    (0, _builtinJs.Builtin).createBuiltin("see-id", [
        "nex"
    ], function $seeId(env, executionEnvironment) {
        let nex = env.lb("nex");
        return (0, _estringJs.constructEString)("" + nex.getID());
    }, "Returns the in-memory ID of |nex as a string.");
}

},{"../utils.js":"bIDtH","../autocomplete.js":"gZomr","../nex/builtin.js":"cOoeb","../nex/eerror.js":"4Xsbj","../nex/estring.js":"bL0nm","../nex/bool.js":"3MKly","../nex/esymbol.js":"cO7Ty","../nex/nil.js":"amOKC","../nex/org.js":"28wYz","../environment.js":"4mXDy","../perfmon.js":"dHrYS","../evaluator.js":"1TNlN","../globalappflags.js":"1FpbG","../syntheticroot.js":"rk2cG","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"fN6Td":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "createFileBuiltins", ()=>createFileBuiltins);
var _utilsJs = require("../utils.js");
var _builtinJs = require("../nex/builtin.js");
var _commandJs = require("../nex/command.js");
var _lambdaJs = require("../nex/lambda.js");
var _eerrorJs = require("../nex/eerror.js");
var _estringJs = require("../nex/estring.js");
var _nilJs = require("../nex/nil.js");
var _evaluatorJs = require("../evaluator.js");
var _deferredvalueJs = require("../nex/deferredvalue.js");
var _orgJs = require("../nex/org.js");
var _esymbolJs = require("../nex/esymbol.js");
var _environmentJs = require("../environment.js");
var _globalappflagsJs = require("../globalappflags.js");
var _asyncfunctionsJs = require("../asyncfunctions.js");
var _globalconstantsJs = require("../globalconstants.js");
var _syntheticrootJs = require("../syntheticroot.js");
var _servercommunicationJs = require("../servercommunication.js");
function createFileBuiltins() {
    (0, _builtinJs.Builtin).createBuiltin("list-files", [], function $listFiles(env, executionEnvironment) {
        let deferredValue = (0, _deferredvalueJs.constructDeferredValue)();
        deferredValue.set(new (0, _asyncfunctionsJs.GenericActivationFunctionGenerator)("list-files", function(callback, deferredValue) {
            (0, _servercommunicationJs.listFiles)(function(files) {
                // turn files into an org or whatever
                callback(files);
            });
        }));
        let loadingMessage = (0, _eerrorJs.constructEError)(`listing files`);
        loadingMessage.setErrorType((0, _eerrorJs.ERROR_TYPE_INFO));
        deferredValue.appendChild(loadingMessage);
        deferredValue.activate();
        return deferredValue;
    }, "Lists all user files available in current session.");
    (0, _builtinJs.Builtin).createBuiltin("list-audio", [], function $listAudio(env, executionEnvironment) {
        let deferredValue = (0, _deferredvalueJs.constructDeferredValue)();
        deferredValue.set(new (0, _asyncfunctionsJs.GenericActivationFunctionGenerator)("list-audio", function(callback, deferredValue) {
            (0, _servercommunicationJs.listAudio)(function(files) {
                // turn files into an org or whatever
                callback(files);
            });
        }));
        let loadingMessage = (0, _eerrorJs.constructEError)(`listing audio`);
        loadingMessage.setErrorType((0, _eerrorJs.ERROR_TYPE_INFO));
        deferredValue.appendChild(loadingMessage);
        deferredValue.activate();
        return deferredValue;
    }, "Lists available audio (wav) files.");
    (0, _builtinJs.Builtin).createBuiltin("list-standard-function-files", [], function $listStandardFunctionFiles(env, executionEnvironment) {
        let def = (0, _deferredvalueJs.constructDeferredValue)();
        def.set(new (0, _asyncfunctionsJs.GenericActivationFunctionGenerator)("list-standard-function-files", function(callback, def) {
            (0, _servercommunicationJs.listStandardFunctionFiles)(function(files) {
                // turn files into an org or whatever
                callback(files);
            });
        }));
        let loadingMessage = (0, _eerrorJs.constructEError)(`listing standard function files`);
        loadingMessage.setErrorType((0, _eerrorJs.ERROR_TYPE_INFO));
        def.appendChild(loadingMessage);
        def.activate();
        return def;
    }, "Lists the standard library function files available to all users.");
    // - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  	
    (0, _builtinJs.Builtin).createBuiltin("load", [
        "_name"
    ], function $load(env, executionEnvironment) {
        let name = env.lb("name");
        let nametype = name.getTypeName();
        // need to look for illegal filename characters if it's a string?
        let nm = nametype == "-symbol-" ? name.getTypedValue() : name.getFullTypedValue();
        let def = (0, _deferredvalueJs.constructDeferredValue)();
        def.set(new (0, _asyncfunctionsJs.GenericActivationFunctionGenerator)("load", function(callback, def) {
            (0, _servercommunicationJs.loadNex)(nm, function(loadResult) {
                callback(loadResult);
            });
        }));
        let loadingMessage = (0, _eerrorJs.constructEError)(`load file ${nm}`);
        loadingMessage.setErrorType((0, _eerrorJs.ERROR_TYPE_INFO));
        def.appendChild(loadingMessage);
        def.activate();
        return def;
    }, "loads the file |name as a nex/object (parsing it)");
    (0, _builtinJs.Builtin).createBuiltin("load-raw", [
        "_name"
    ], function $loadRaw(env, executionEnvironment) {
        let name = env.lb("name");
        let nametype = name.getTypeName();
        // need to look for illegal filename characters if it's a string?
        let nm = nametype == "-symbol-" ? name.getTypedValue() : name.getFullTypedValue();
        let def = (0, _deferredvalueJs.constructDeferredValue)();
        def.set(new (0, _asyncfunctionsJs.GenericActivationFunctionGenerator)("load-raw", function(callback, def) {
            (0, _servercommunicationJs.loadRaw)(nm, function(loadResult) {
                callback((0, _estringJs.constructEString)(loadResult));
            });
        }));
        let loadingMessage = (0, _eerrorJs.constructEError)(`load file ${nm}`);
        loadingMessage.setErrorType((0, _eerrorJs.ERROR_TYPE_INFO));
        def.appendChild(loadingMessage);
        def.activate();
        return def;
    }, "Loads raw bytes from the file |name into a string, and returns it.");
    (0, _builtinJs.Builtin).createBuiltin("eval-and-save", [
        "_name",
        "val"
    ], function $evalAndSave(env, executionEnvironment) {
        let val = env.lb("val");
        let name = env.lb("name");
        let nametype = name.getTypeName();
        // need to look for illegal filename characters if it's a string?
        let nm = nametype == "-symbol-" ? name.getTypedValue() : name.getFullTypedValue();
        let def = (0, _deferredvalueJs.constructDeferredValue)();
        def.set(new (0, _asyncfunctionsJs.GenericActivationFunctionGenerator)("save", function(callback, def) {
            (0, _servercommunicationJs.saveNex)(nm, val, function(saveResult) {
                callback(saveResult);
            });
        }));
        let savingMessage = (0, _eerrorJs.constructEError)(`save in file ${nm} this data: ${val.prettyPrint()}`);
        savingMessage.setErrorType((0, _eerrorJs.ERROR_TYPE_INFO));
        def.appendChild(savingMessage);
        def.activate();
        return def;
    }, "saves |val in the file |name (|val is evaluated).");
    (0, _builtinJs.Builtin).createBuiltin("save", [
        "_name",
        "_val"
    ], function $save(env, executionEnvironment) {
        let val = env.lb("val");
        let name = env.lb("name");
        let nametype = name.getTypeName();
        // need to look for illegal filename characters if it's a string?
        let nm = nametype == "-symbol-" ? name.getTypedValue() : name.getFullTypedValue();
        let def = (0, _deferredvalueJs.constructDeferredValue)();
        def.set(new (0, _asyncfunctionsJs.GenericActivationFunctionGenerator)("save", function(callback, def) {
            (0, _servercommunicationJs.saveNex)(nm, val, function(saveResult) {
                callback(saveResult);
            });
        }));
        let savingMessage = (0, _eerrorJs.constructEError)(`save in file ${nm} this data: ${val.prettyPrint()}`);
        savingMessage.setErrorType((0, _eerrorJs.ERROR_TYPE_INFO));
        def.appendChild(savingMessage);
        def.activate();
        return def;
    }, "Saves |val in the file |name (without evaluating |val).");
    (0, _builtinJs.Builtin).createBuiltin("save-raw", [
        "_name",
        "val$"
    ], function $saveFile(env, executionEnvironment) {
        let name = env.lb("name");
        let nametype = name.getTypeName();
        // need to look for illegal filename characters if it's a string?
        let nm = nametype == "-symbol-" ? name.getTypedValue() : name.getFullTypedValue();
        let val = env.lb("val");
        let saveval = val.getFullTypedValue();
        let def = (0, _deferredvalueJs.constructDeferredValue)();
        def.set(new (0, _asyncfunctionsJs.GenericActivationFunctionGenerator)("save-string-as", function(callback, def) {
            (0, _servercommunicationJs.saveRaw)(nm, saveval, function(saveResult) {
                callback(saveResult);
            });
        }));
        let savingMessage = (0, _eerrorJs.constructEError)(`save in file ${nm} this data: ${val}`);
        savingMessage.setErrorType((0, _eerrorJs.ERROR_TYPE_INFO));
        def.appendChild(savingMessage);
        def.activate();
        return def;
    }, "Saves the raw bytes of string |val in the file |name.");
    (0, _builtinJs.Builtin).createBuiltin("import", [
        "_name"
    ], function $import(env, executionEnvironment) {
        let name = env.lb("name");
        let nametype = name.getTypeName();
        // need to look for illegal filename characters if it's a string?
        let nm = nametype == "-symbol-" ? name.getTypedValue() : name.getFullTypedValue();
        let def = (0, _deferredvalueJs.constructDeferredValue)();
        def.set(new (0, _asyncfunctionsJs.GenericActivationFunctionGenerator)("import", function(callback, def) {
            (0, _servercommunicationJs.importNex)(nm, function(importResult) {
                callback(importResult);
            });
        }));
        let importMessage = (0, _eerrorJs.constructEError)(`import package ${nm}`);
        importMessage.setErrorType((0, _eerrorJs.ERROR_TYPE_INFO));
        def.appendChild(importMessage);
        def.activate();
        return def;
    }, "Imports the package in file |name, loading the file and binding the package contents into memory.");
    // Before you go renaming the "package" builtin to something else!
    // the name of this builtin is hardcoded into servercommunication.js
    // idk if there is a better way, but be aware.
    (0, _builtinJs.Builtin).createBuiltin("package", [
        "_name@",
        "_block..."
    ], function $package(env, executionEnvironment) {
        /*
			okay so the package thing is a special form basically.
			this means that the rules here are different. We always
			treat this as if it was a deferred command, so we look at
			the return value for each expression. If it's deferred,
			we wait for it to resolve before moving on to the next one.

			Additionally: we should create a new scope,
			not for the purposes of using "let" but so that we could
			associate with that scope a package name.
			that way imported packages don't interfere with the package here,
			we get a stack of package names by default.

			Finally, what do we return? Let's just always return a deferred
			value. It resolves when all the different imports happen and
			the package is finished being created. Since a package
			statement will frequently import things, it is more or less
			by definition the same type of builtin as a file loading builtin.

			this means that if you do crazy shit like trying to use package
			or import statements inside lambdas, you get what you get.
			The system is designed to be used in this sensible way,
			results are undefined if you go outside of that.

			*/ let packageName = env.lb("name").getTypedValue();
        let lst = env.lb("block");
        let packageScope = executionEnvironment.pushEnv(); // popped
        packageScope.setPackageForBinding(packageName);
        packageScope.usePackage(packageName);
        let nextArgToEval = 0;
        let deferredCallback = null;
        let packageStatements = [];
        for(let i = 0; i < lst.numChildren(); i++)packageStatements.push(lst.getChildAt(i));
        let notifyCallback = function() {
            evalNextArg();
        };
        let evalNextArg = function() {
            for(; nextArgToEval < packageStatements.length; nextArgToEval++){
                let c = packageStatements[nextArgToEval];
                let result = (0, _syntheticrootJs.sAttach)((0, _evaluatorJs.evaluateNexSafely)(c, packageScope));
                if (_utilsJs.isDeferredValue(result)) {
                    packageStatements[nextArgToEval] = result;
                    result.addListener({
                        notify: notifyCallback
                    });
                    return;
                }
                if (_utilsJs.isFatalError(result)) {
                    let err = (0, _evaluatorJs.wrapError)("&szlig;", `package: error returned from expression ${nextArgToEval + 2}`, result);
                    packageScope.finalize();
                    deferredCallback(err);
                    return;
                }
            }
            if (nextArgToEval == packageStatements.length) {
                let message = (0, _eerrorJs.constructEError)(`successfully created package.`);
                message.setErrorType((0, _eerrorJs.ERROR_TYPE_INFO));
                packageScope.finalize();
                deferredCallback(message);
            }
        };
        let r = (0, _deferredvalueJs.constructDeferredValue)();
        r.set(new (0, _asyncfunctionsJs.GenericActivationFunctionGenerator)("package", function(callback, def) {
            deferredCallback = callback;
            evalNextArg();
        }));
        let message = (0, _eerrorJs.constructEError)(`creating package`);
        message.setErrorType((0, _eerrorJs.ERROR_TYPE_INFO));
        r.appendChild(message);
        r.activate();
        return r;
    }, "Defines a package. All args in |block are evaluated, and any bindings are bound with |name as their package scope identifier.");
    (0, _builtinJs.Builtin).createBuiltin("normal-mode", [
        "nex"
    ], function $normalMode(env, executionEnvironment) {
        let nex = env.lb("nex");
        nex.setModeHint((0, _globalconstantsJs.RENDER_MODE_NORM));
        let nodes = nex.getRenderNodes();
        nodes.forEach((node)=>setRenderMode((0, _globalconstantsJs.RENDER_MODE_NORM)));
        return nex;
    }, "Sets the mode hint for nex so that it will render as normal by default.");
    (0, _builtinJs.Builtin).createBuiltin("exploded-mode", [
        "nex"
    ], function $explodedMode(env, executionEnvironment) {
        let nex = env.lb("nex");
        nex.setModeHint((0, _globalconstantsJs.RENDER_MODE_EXPLO));
        let nodes = nex.getRenderNodes();
        nodes.forEach((node)=>setRenderMode((0, _globalconstantsJs.RENDER_MODE_EXPLO)));
        return nex;
    }, "Sets the mode hint for nex so that it will render as exploded by default.");
}

},{"../utils.js":"bIDtH","../nex/builtin.js":"cOoeb","../nex/command.js":"6AUMZ","../nex/lambda.js":"1mCM0","../nex/eerror.js":"4Xsbj","../nex/estring.js":"bL0nm","../nex/nil.js":"amOKC","../evaluator.js":"1TNlN","../nex/deferredvalue.js":"l7y1l","../nex/org.js":"28wYz","../nex/esymbol.js":"cO7Ty","../environment.js":"4mXDy","../globalappflags.js":"1FpbG","../asyncfunctions.js":"6KukQ","../globalconstants.js":"3d62t","../syntheticroot.js":"rk2cG","../servercommunication.js":"42rrM","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"42rrM":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "saveNex", ()=>saveNex);
parcelHelpers.export(exports, "importNex", ()=>importNex);
parcelHelpers.export(exports, "loadNex", ()=>loadNex);
parcelHelpers.export(exports, "listFiles", ()=>listFiles);
parcelHelpers.export(exports, "listStandardFunctionFiles", ()=>listStandardFunctionFiles);
parcelHelpers.export(exports, "loadRaw", ()=>loadRaw);
parcelHelpers.export(exports, "saveRaw", ()=>saveRaw);
parcelHelpers.export(exports, "loadAndRun", ()=>loadAndRun);
parcelHelpers.export(exports, "saveShortcut", ()=>saveShortcut);
parcelHelpers.export(exports, "listAudio", ()=>listAudio);
var _utilsJs = require("./utils.js");
var _environmentJs = require("./environment.js");
var _eerrorJs = require("./nex/eerror.js");
var _evaluatorJs = require("./evaluator.js");
var _nexparser2Js = require("./nexparser2.js");
var _systemstateJs = require("./systemstate.js");
function sendToServer(payload, cb, errcb) {
    let xhr = new XMLHttpRequest();
    xhr.onreadystatechange = function() {};
    xhr.open("POST", "api");
    xhr.send(payload);
    xhr.onload = function() {
        if (xhr.readyState === xhr.DONE && xhr.status === 200) cb(xhr.response);
        else errcb();
    };
    xhr.onerror = function() {
        errcb();
    };
}
function listFiles(callback) {
    let payload = `listfiles`;
    sendToServer(payload, function(data) {
        parseReturnPayload(data, callback);
    }, function() {
        callback(serverError());
    });
}
function listAudio(callback) {
    let payload = `listaudio`;
    sendToServer(payload, function(data) {
        parseReturnPayload(data, callback);
    }, function() {
        callback(serverError());
    });
}
function listStandardFunctionFiles(callback) {
    let payload = `liststandardfunctionfiles`;
    sendToServer(payload, function(data) {
        parseReturnPayload(data, callback);
    }, function() {
        callback(serverError());
    });
}
function loadNex(name, callback) {
    let payload = `load\t${name}`;
    sendToServer(payload, function(data) {
        document.title = name;
        (0, _systemstateJs.systemState).setDefaultFileName(name);
        parseReturnPayload(data, callback);
    }, function() {
        callback(serverError());
    });
}
function loadRaw(name, callback) {
    let payload = `loadraw\t${name}`;
    sendToServer(payload, function(data) {
        callback(data);
    }, function() {
        callback(serverError());
    });
}
function saveNex(name, nex, callback) {
    let payload = `save\t${name}\t${"v2:" + nex.toString("v2")}`;
    sendToServer(payload, function(data) {
        parseReturnPayload(data, callback);
    }, function() {
        callback(serverError());
    });
}
function saveRaw(name, data, callback) {
    let payload = `saveraw\t${name}\t${data}`;
    sendToServer(payload, function(data) {
        parseReturnPayload(data, callback);
    }, function() {
        callback(serverError());
    });
}
function importNex(name, callback) {
    let payload = `load\t${name}`;
    sendToServer(payload, function(data) {
        parseReturnPayload(data, function(nex) {
            callback(evaluatePackage(nex));
        });
    }, function() {
        callback(serverError());
    });
}
function loadAndRun(name, callback) {
    let payload = `load\t${name}`;
    sendToServer(payload, function(data) {
        parseReturnPayload(data, function(parsed) {
            let result = (0, _evaluatorJs.evaluateNexSafely)(parsed, (0, _environmentJs.BINDINGS));
            callback(result);
        });
    }, function() {
        callback(serverError());
    });
}
function serverError() {
    let r = (0, _eerrorJs.constructFatalError)("Server error.");
    return r;
}
function parseReturnPayload(data, callback) {
    let result = null;
    try {
        result = (0, _nexparser2Js.parse)(data);
    } catch (e) {
        if (!_utilsJs.isError(e)) result = (0, _eerrorJs.constructFatalError)(`PEG PARSER PERROR
full error message follows:
${e.name}
${e.message}
line: ${e.location.start.line}
col: ${e.location.start.column}
found: "${e.found}"
expected: ${e.expected[0].type}
` + e);
    }
    callback(result);
}
function evaluatePackage(nex) {
    if (!(nex.getTypeName() == "-command-" && (nex.getCommandName() == "package" || nex.getCommandName() == "template"))) {
        let r = (0, _eerrorJs.constructFatalError)("Can only import packages or templates, see file contents");
        return r;
    }
    let result = (0, _evaluatorJs.evaluateNexSafely)(nex, (0, _environmentJs.BINDINGS));
    return result;
}
// This util is meant to be used from functions like
// save-template and save-package.
// These aren't meant to be called from "code" because it doesn't
// give you access to success/failure, or the returned deferred value.
// It's more of an ide shortcut kind of thing.
function saveShortcut(namesym, val, callback) {
    let nametype = namesym.getTypeName();
    let nm = "";
    saveNex(nm, val, function(result) {
        if (_utilsJs.isInfo(result)) callback(null);
        else callback(result);
    });
}

},{"./utils.js":"bIDtH","./environment.js":"4mXDy","./nex/eerror.js":"4Xsbj","./evaluator.js":"1TNlN","./nexparser2.js":"9rt6P","./systemstate.js":"19Hkn","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"9rt6P":[function(require,module,exports) {
// This file is part of Vodka.
// Vodka is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// Vodka is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
// You should have received a copy of the GNU General Public License
// along with Vodka.  If not, see <https://www.gnu.org/licenses/>.
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "SyntaxError", ()=>peg$SyntaxError);
parcelHelpers.export(exports, "parse", ()=>peg$parse);
var _parserfunctionsJs = require("./parserfunctions.js");
// Generated by PEG.js v0.11.0-master.b7b87ea, https://pegjs.org/
function peg$subclass(child, parent) {
    function C() {
        this.constructor = child;
    }
    C.prototype = parent.prototype;
    child.prototype = new C();
}
function peg$SyntaxError(message, expected, found, location) {
    this.message = message;
    this.expected = expected;
    this.found = found;
    this.location = location;
    this.name = "SyntaxError";
    // istanbul ignore next
    if (typeof Error.captureStackTrace === "function") Error.captureStackTrace(this, peg$SyntaxError);
}
peg$subclass(peg$SyntaxError, Error);
peg$SyntaxError.buildMessage = function(expected, found, location) {
    var DESCRIBE_EXPECTATION_FNS = {
        literal: function(expectation) {
            return '"' + literalEscape(expectation.text) + '"';
        },
        class: function(expectation) {
            var escapedParts = expectation.parts.map(function(part) {
                return Array.isArray(part) ? classEscape(part[0]) + "-" + classEscape(part[1]) : classEscape(part);
            });
            return "[" + (expectation.inverted ? "^" : "") + escapedParts + "]";
        },
        any: function() {
            return "any character";
        },
        end: function() {
            return "end of input";
        },
        other: function(expectation) {
            return expectation.description;
        },
        not: function(expectation) {
            return "not " + describeExpectation(expectation.expected);
        }
    };
    function hex(ch) {
        return ch.charCodeAt(0).toString(16).toUpperCase();
    }
    function literalEscape(s) {
        return s.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function(ch) {
            return "\\x0" + hex(ch);
        }).replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) {
            return "\\x" + hex(ch);
        });
    }
    function classEscape(s) {
        return s.replace(/\\/g, "\\\\").replace(/\]/g, "\\]").replace(/\^/g, "\\^").replace(/-/g, "\\-").replace(/\0/g, "\\0").replace(/\t/g, "\\t").replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/[\x00-\x0F]/g, function(ch) {
            return "\\x0" + hex(ch);
        }).replace(/[\x10-\x1F\x7F-\x9F]/g, function(ch) {
            return "\\x" + hex(ch);
        });
    }
    function describeExpectation(expectation) {
        return DESCRIBE_EXPECTATION_FNS[expectation.type](expectation);
    }
    function describeExpected(expected) {
        var descriptions = expected.map(describeExpectation);
        var i, j;
        descriptions.sort();
        if (descriptions.length > 0) {
            for(i = 1, j = 1; i < descriptions.length; i++)if (descriptions[i - 1] !== descriptions[i]) {
                descriptions[j] = descriptions[i];
                j++;
            }
            descriptions.length = j;
        }
        switch(descriptions.length){
            case 1:
                return descriptions[0];
            case 2:
                return descriptions[0] + " or " + descriptions[1];
            default:
                return descriptions.slice(0, -1).join(", ") + ", or " + descriptions[descriptions.length - 1];
        }
    }
    function describeFound(found) {
        return found ? '"' + literalEscape(found) + '"' : "end of input";
    }
    return "Expected " + describeExpected(expected) + " but " + describeFound(found) + " found.";
};
function peg$parse(input, options) {
    options = options !== undefined ? options : {};
    var peg$FAILED = {};
    var peg$startRuleFunctions = {
        start: peg$parsestart
    };
    var peg$startRuleFunction = peg$parsestart;
    var peg$c0 = "v2:";
    var peg$c1 = "(";
    var peg$c2 = ")";
    var peg$c3 = "(_";
    var peg$c4 = "_)";
    var peg$c5 = "(|";
    var peg$c6 = "|)";
    var peg$c7 = "(,";
    var peg$c8 = ",)";
    var peg$c9 = ";";
    var peg$c10 = "*;";
    var peg$c11 = "*";
    var peg$c12 = "&;";
    var peg$c13 = "&";
    var peg$c14 = "~;";
    var peg$c15 = "~";
    var peg$c16 = "^;";
    var peg$c17 = "^";
    var peg$c18 = ":";
    var peg$c19 = "[";
    var peg$c20 = "]";
    var peg$c21 = "[;";
    var peg$c22 = "!;";
    var peg$c23 = "yes";
    var peg$c24 = "no";
    var peg$c25 = "!";
    var peg$c26 = "@;";
    var peg$c27 = "@";
    var peg$c28 = "_";
    var peg$c29 = "#;";
    var peg$c30 = "-";
    var peg$c31 = "#";
    var peg$c32 = "$;";
    var peg$c33 = "$";
    var peg$c34 = "?";
    var peg$c35 = "%;";
    var peg$c36 = "%";
    var peg$c37 = ".";
    var peg$c38 = "<";
    var peg$c39 = ">";
    var peg$c40 = "`";
    var peg$c41 = '"';
    var peg$c42 = "{";
    var peg$c43 = "}";
    var peg$c44 = "|}";
    var peg$c45 = "||";
    var peg$r0 = /^[+=*\/<>]/;
    var peg$r1 = /^[a-zA-Z0-9:.\-]/;
    var peg$r2 = /^[a-zA-Z0-9\-]/;
    var peg$r3 = /^[a-zA-Z0-9]/;
    var peg$r4 = /^[0-9]/;
    var peg$r5 = /^[^`]/;
    var peg$r6 = /^[^"]/;
    var peg$r7 = /^[^|}]/;
    var peg$r8 = /^[ \r\n\t]/;
    var peg$e0 = peg$literalExpectation("v2:", false);
    var peg$e1 = peg$literalExpectation("(", false);
    var peg$e2 = peg$literalExpectation(")", false);
    var peg$e3 = peg$literalExpectation("(_", false);
    var peg$e4 = peg$literalExpectation("_)", false);
    var peg$e5 = peg$literalExpectation("(|", false);
    var peg$e6 = peg$literalExpectation("|)", false);
    var peg$e7 = peg$literalExpectation("(,", false);
    var peg$e8 = peg$literalExpectation(",)", false);
    var peg$e9 = peg$literalExpectation(";", false);
    var peg$e10 = peg$literalExpectation("*;", false);
    var peg$e11 = peg$literalExpectation("*", false);
    var peg$e12 = peg$literalExpectation("&;", false);
    var peg$e13 = peg$literalExpectation("&", false);
    var peg$e14 = peg$literalExpectation("~;", false);
    var peg$e15 = peg$literalExpectation("~", false);
    var peg$e16 = peg$literalExpectation("^;", false);
    var peg$e17 = peg$literalExpectation("^", false);
    var peg$e18 = peg$literalExpectation(":", false);
    var peg$e19 = peg$classExpectation([
        "+",
        "=",
        "*",
        "/",
        "<",
        ">"
    ], false, false);
    var peg$e20 = peg$classExpectation([
        [
            "a",
            "z"
        ],
        [
            "A",
            "Z"
        ],
        [
            "0",
            "9"
        ],
        ":",
        ".",
        "-"
    ], false, false);
    var peg$e21 = peg$literalExpectation("[", false);
    var peg$e22 = peg$literalExpectation("]", false);
    var peg$e23 = peg$literalExpectation("[;", false);
    var peg$e24 = peg$classExpectation([
        [
            "a",
            "z"
        ],
        [
            "A",
            "Z"
        ],
        [
            "0",
            "9"
        ]
    ], false, false);
    var peg$e25 = peg$literalExpectation("!;", false);
    var peg$e26 = peg$literalExpectation("yes", false);
    var peg$e27 = peg$literalExpectation("no", false);
    var peg$e28 = peg$literalExpectation("!", false);
    var peg$e29 = peg$literalExpectation("@;", false);
    var peg$e30 = peg$literalExpectation("@", false);
    var peg$e31 = peg$literalExpectation("_", false);
    var peg$e32 = peg$literalExpectation("#;", false);
    var peg$e33 = peg$literalExpectation("-", false);
    var peg$e34 = peg$classExpectation([
        [
            "0",
            "9"
        ]
    ], false, false);
    var peg$e35 = peg$literalExpectation("#", false);
    var peg$e36 = peg$literalExpectation("$;", false);
    var peg$e37 = peg$literalExpectation("$", false);
    var peg$e38 = peg$literalExpectation("?", false);
    var peg$e39 = peg$literalExpectation("%;", false);
    var peg$e40 = peg$literalExpectation("%", false);
    var peg$e41 = peg$literalExpectation(".", false);
    var peg$e42 = peg$literalExpectation("<", false);
    var peg$e43 = peg$literalExpectation(">", false);
    var peg$e44 = peg$literalExpectation("`", false);
    var peg$e45 = peg$classExpectation([
        "`"
    ], true, false);
    var peg$e46 = peg$literalExpectation('"', false);
    var peg$e47 = peg$classExpectation([
        '"'
    ], true, false);
    var peg$e48 = peg$literalExpectation("{", false);
    var peg$e49 = peg$literalExpectation("}", false);
    var peg$e50 = peg$classExpectation([
        "|",
        "}"
    ], true, false);
    var peg$e51 = peg$literalExpectation("|}", false);
    var peg$e52 = peg$literalExpectation("||", false);
    var peg$e53 = peg$classExpectation([
        " ",
        "\r",
        "\n",
        "	"
    ], false, false);
    var peg$f0 = function(NEX) {
        return NEX;
    };
    var peg$f1 = function(INST_NAME, PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeInstanceList(INST_NAME, CHILDREN, PRIVATE, TAGLIST, "h", true);
    };
    var peg$f2 = function(INST_NAME, PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeInstanceList(INST_NAME, CHILDREN, PRIVATE, TAGLIST, "v", true);
    };
    var peg$f3 = function(INST_NAME, PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeInstanceList(INST_NAME, CHILDREN, PRIVATE, TAGLIST, "z", true);
    };
    var peg$f4 = function(INST_NAME, PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeInstanceList(INST_NAME, CHILDREN, PRIVATE, TAGLIST, "h");
    };
    var peg$f5 = function(INST_NAME, PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeInstanceList(INST_NAME, CHILDREN, PRIVATE, TAGLIST, "v");
    };
    var peg$f6 = function(INST_NAME, PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeInstanceList(INST_NAME, CHILDREN, PRIVATE, TAGLIST, "z");
    };
    var peg$f7 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeOrgList(CHILDREN, PRIVATE, TAGLIST, "h", true);
    };
    var peg$f8 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeOrgList(CHILDREN, PRIVATE, TAGLIST, "v", true);
    };
    var peg$f9 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeOrgList(CHILDREN, PRIVATE, TAGLIST, "z", true);
    };
    var peg$f10 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeOrgList(CHILDREN, PRIVATE, TAGLIST, "h");
    };
    var peg$f11 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeOrgList(CHILDREN, PRIVATE, TAGLIST, "v");
    };
    var peg$f12 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeOrgList(CHILDREN, PRIVATE, TAGLIST, "z");
    };
    var peg$f13 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeDeferredCommandList(CHILDREN, PRIVATE, TAGLIST, "h", true);
    };
    var peg$f14 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeDeferredCommandList(CHILDREN, PRIVATE, TAGLIST, "v", true);
    };
    var peg$f15 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeDeferredCommandList(CHILDREN, PRIVATE, TAGLIST, "z", true);
    };
    var peg$f16 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeDeferredCommandList(CHILDREN, PRIVATE, TAGLIST, "h");
    };
    var peg$f17 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeDeferredCommandList(CHILDREN, PRIVATE, TAGLIST, "v");
    };
    var peg$f18 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeDeferredCommandList(CHILDREN, PRIVATE, TAGLIST, "z");
    };
    var peg$f19 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeLambdaList(CHILDREN, PRIVATE, TAGLIST, "h", true);
    };
    var peg$f20 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeLambdaList(CHILDREN, PRIVATE, TAGLIST, "v", true);
    };
    var peg$f21 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeLambdaList(CHILDREN, PRIVATE, TAGLIST, "z", true);
    };
    var peg$f22 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeLambdaList(CHILDREN, PRIVATE, TAGLIST, "h");
    };
    var peg$f23 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeLambdaList(CHILDREN, PRIVATE, TAGLIST, "v");
    };
    var peg$f24 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeLambdaList(CHILDREN, PRIVATE, TAGLIST, "z");
    };
    var peg$f25 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeCommandList(null, CHILDREN, PRIVATE, TAGLIST, "h", true);
    };
    var peg$f26 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeCommandList(null, CHILDREN, PRIVATE, TAGLIST, "v", true);
    };
    var peg$f27 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeCommandList(null, CHILDREN, PRIVATE, TAGLIST, "z", true);
    };
    var peg$f28 = function(PRIVATE, TAGLIST, NAME, CHILDREN) {
        return _parserfunctionsJs.makeCommandList(NAME, CHILDREN, PRIVATE, TAGLIST, "h", true);
    };
    var peg$f29 = function(PRIVATE, TAGLIST, NAME, CHILDREN) {
        return _parserfunctionsJs.makeCommandList(NAME, CHILDREN, PRIVATE, TAGLIST, "v", true);
    };
    var peg$f30 = function(PRIVATE, TAGLIST, NAME, CHILDREN) {
        return _parserfunctionsJs.makeCommandList(NAME, CHILDREN, PRIVATE, TAGLIST, "z", true);
    };
    var peg$f31 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeCommandList(null, CHILDREN, PRIVATE, TAGLIST, "h");
    };
    var peg$f32 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeCommandList(null, CHILDREN, PRIVATE, TAGLIST, "v");
    };
    var peg$f33 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeCommandList(null, CHILDREN, PRIVATE, TAGLIST, "z");
    };
    var peg$f34 = function(PRIVATE, TAGLIST, NAME, CHILDREN) {
        return _parserfunctionsJs.makeCommandList(NAME, CHILDREN, PRIVATE, TAGLIST, "h");
    };
    var peg$f35 = function(PRIVATE, TAGLIST, NAME, CHILDREN) {
        return _parserfunctionsJs.makeCommandList(NAME, CHILDREN, PRIVATE, TAGLIST, "v");
    };
    var peg$f36 = function(PRIVATE, TAGLIST, NAME, CHILDREN) {
        return _parserfunctionsJs.makeCommandList(NAME, CHILDREN, PRIVATE, TAGLIST, "z");
    };
    var peg$f37 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeInstantiatorList(CHILDREN, PRIVATE, TAGLIST, "h", true);
    };
    var peg$f38 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeInstantiatorList(CHILDREN, PRIVATE, TAGLIST, "v", true);
    };
    var peg$f39 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeInstantiatorList(CHILDREN, PRIVATE, TAGLIST, "z", true);
    };
    var peg$f40 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeInstantiatorList(CHILDREN, PRIVATE, TAGLIST, "h");
    };
    var peg$f41 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeInstantiatorList(CHILDREN, PRIVATE, TAGLIST, "v");
    };
    var peg$f42 = function(PRIVATE, TAGLIST, CHILDREN) {
        return _parserfunctionsJs.makeInstantiatorList(CHILDREN, PRIVATE, TAGLIST, "z");
    };
    var peg$f43 = function(SYM) {
        return SYM;
    };
    var peg$f44 = function(NAME) {
        return NAME;
    };
    var peg$f45 = function(CHILDREN) {
        return CHILDREN;
    };
    var peg$f46 = function(INST_NAME, PRIVATE, TAGLIST) {
        return _parserfunctionsJs.makeInstanceAtom(INST_NAME, PRIVATE, TAGLIST, true);
    };
    var peg$f47 = function(INST_NAME, PRIVATE, TAGLIST) {
        return _parserfunctionsJs.makeInstanceAtom(INST_NAME, PRIVATE, TAGLIST);
    };
    var peg$f48 = function(INST_NAME_DATA) {
        return INST_NAME_DATA;
    };
    var peg$f49 = function(TAGLIST) {
        return _parserfunctionsJs.makeBool(true, TAGLIST, true);
    };
    var peg$f50 = function(TAGLIST) {
        return _parserfunctionsJs.makeBool(false, TAGLIST, true);
    };
    var peg$f51 = function(TAGLIST) {
        return _parserfunctionsJs.makeBool(true, TAGLIST);
    };
    var peg$f52 = function(TAGLIST) {
        return _parserfunctionsJs.makeBool(false, TAGLIST);
    };
    var peg$f53 = function(TAGLIST, SYMBOL) {
        return _parserfunctionsJs.makeSymbol(SYMBOL, TAGLIST, true);
    };
    var peg$f54 = function(TAGLIST, SYMBOL) {
        return _parserfunctionsJs.makeSymbol(SYMBOL, TAGLIST);
    };
    var peg$f55 = function(SYMBOL_CHAR) {
        return SYMBOL_CHAR;
    };
    var peg$f56 = function() {
        return "_";
    };
    var peg$f57 = function(TAGLIST, NEGATION, DIGITS) {
        return _parserfunctionsJs.makeInteger(NEGATION, DIGITS, TAGLIST, true);
    };
    var peg$f58 = function(TAGLIST, NEGATION, DIGITS) {
        return _parserfunctionsJs.makeInteger(NEGATION, DIGITS, TAGLIST);
    };
    var peg$f59 = function(TAGLIST, DATA) {
        return _parserfunctionsJs.makeString(DATA, TAGLIST, true);
    };
    var peg$f60 = function(TAGLIST, DATA) {
        return _parserfunctionsJs.makeString(DATA, TAGLIST);
    };
    var peg$f61 = function(TAGLIST, DATA) {
        return _parserfunctionsJs.makeError(DATA, TAGLIST, true);
    };
    var peg$f62 = function(TAGLIST, FLOAT) {
        return _parserfunctionsJs.makeFloat(FLOAT, TAGLIST, true);
    };
    var peg$f63 = function(TAGLIST, FLOAT) {
        return _parserfunctionsJs.makeFloat(FLOAT, TAGLIST);
    };
    var peg$f64 = function(INT_PART, DEC_DIGITS) {
        return DEC_DIGITS;
    };
    var peg$f65 = function(INT_PART, DEC_PART) {
        return DEC_PART ? INT_PART + "." + DEC_PART : INT_PART;
    };
    var peg$f66 = function(DEC_DIGITS) {
        return "0." + DEC_DIGITS;
    };
    var peg$f67 = function(DIGITS) {
        return DIGITS.join("");
    };
    var peg$f68 = function(DIGITS) {
        return "-" + DIGITS.join("");
    };
    var peg$f69 = function(TAGS) {
        return TAGS;
    };
    var peg$f70 = function(TAG) {
        return TAG;
    };
    var peg$f71 = function(TAG_DATA) {
        return TAG_DATA;
    };
    var peg$f72 = function(DATA) {
        return DATA;
    };
    var peg$f73 = function() {
        return null;
    };
    var peg$f74 = function(CHAR) {
        return CHAR;
    };
    var peg$f75 = function() {
        return RIGHT_BRACE;
    };
    var peg$f76 = function() {
        return "|";
    };
    var peg$currPos = 0;
    var peg$savedPos = 0;
    var peg$posDetailsCache = [
        {
            line: 1,
            column: 1
        }
    ];
    var peg$expected = [];
    var peg$silentFails = 0;
    var peg$result;
    if ("startRule" in options) {
        if (!(options.startRule in peg$startRuleFunctions)) throw new Error("Can't start parsing from rule \"" + options.startRule + '".');
        peg$startRuleFunction = peg$startRuleFunctions[options.startRule];
    }
    function text() {
        return input.substring(peg$savedPos, peg$currPos);
    }
    function offset() {
        return peg$savedPos;
    }
    function range() {
        return [
            peg$savedPos,
            peg$currPos
        ];
    }
    function location() {
        return peg$computeLocation(peg$savedPos, peg$currPos);
    }
    function expected(description, location) {
        location = location !== undefined ? location : peg$computeLocation(peg$savedPos, peg$currPos);
        throw peg$buildStructuredError([
            peg$otherExpectation(description)
        ], input.substring(peg$savedPos, peg$currPos), location);
    }
    function error(message, location) {
        location = location !== undefined ? location : peg$computeLocation(peg$savedPos, peg$currPos);
        throw peg$buildSimpleError(message, location);
    }
    function peg$literalExpectation(text, ignoreCase) {
        return {
            type: "literal",
            text: text,
            ignoreCase: ignoreCase
        };
    }
    function peg$classExpectation(parts, inverted, ignoreCase) {
        return {
            type: "class",
            parts: parts,
            inverted: inverted,
            ignoreCase: ignoreCase
        };
    }
    function peg$anyExpectation() {
        return {
            type: "any"
        };
    }
    function peg$endExpectation() {
        return {
            type: "end"
        };
    }
    function peg$otherExpectation(description) {
        return {
            type: "other",
            description: description
        };
    }
    function peg$computePosDetails(pos) {
        var details = peg$posDetailsCache[pos];
        var p;
        if (details) return details;
        else {
            p = pos - 1;
            while(!peg$posDetailsCache[p])p--;
            details = peg$posDetailsCache[p];
            details = {
                line: details.line,
                column: details.column
            };
            while(p < pos){
                if (input.charCodeAt(p) === 10) {
                    details.line++;
                    details.column = 1;
                } else details.column++;
                p++;
            }
            peg$posDetailsCache[pos] = details;
            return details;
        }
    }
    var peg$VALIDFILENAME = typeof options.filename === "string" && options.filename.length > 0;
    function peg$computeLocation(startPos, endPos) {
        var loc = {};
        if (peg$VALIDFILENAME) loc.filename = options.filename;
        var startPosDetails = peg$computePosDetails(startPos);
        loc.start = {
            offset: startPos,
            line: startPosDetails.line,
            column: startPosDetails.column
        };
        var endPosDetails = peg$computePosDetails(endPos);
        loc.end = {
            offset: endPos,
            line: endPosDetails.line,
            column: endPosDetails.column
        };
        return loc;
    }
    function peg$begin() {
        peg$expected.push({
            pos: peg$currPos,
            variants: []
        });
    }
    function peg$expect(expected) {
        var top = peg$expected[peg$expected.length - 1];
        if (peg$currPos < top.pos) return;
        if (peg$currPos > top.pos) {
            top.pos = peg$currPos;
            top.variants = [];
        }
        top.variants.push(expected);
    }
    function peg$end(invert) {
        var expected = peg$expected.pop();
        var top = peg$expected[peg$expected.length - 1];
        var variants = expected.variants;
        if (top.pos !== expected.pos) return;
        if (invert) variants = variants.map(function(e) {
            return e.type === "not" ? e.expected : {
                type: "not",
                expected: e
            };
        });
        Array.prototype.push.apply(top.variants, variants);
    }
    function peg$buildSimpleError(message, location) {
        return new peg$SyntaxError(message, null, null, location);
    }
    function peg$buildStructuredError(expected, found, location) {
        return new peg$SyntaxError(peg$SyntaxError.buildMessage(expected, found, location), expected, found, location);
    }
    function peg$buildError() {
        var expected = peg$expected[0];
        var failPos = expected.pos;
        return peg$buildStructuredError(expected.variants, failPos < input.length ? input.charAt(failPos) : null, failPos < input.length ? peg$computeLocation(failPos, failPos + 1) : peg$computeLocation(failPos, failPos));
    }
    function peg$parsestart() {
        var s0, s1, s2, s3, s4;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        s1 = peg$parseparser_version_identifier();
        if (s1 !== peg$FAILED) {
            s2 = peg$parse_();
            s3 = peg$parsenex();
            if (s3 !== peg$FAILED) {
                s4 = peg$parse_();
                peg$savedPos = s0;
                s0 = peg$f0(s3);
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parseparser_version_identifier() {
        var s0;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        rule$expects(peg$e0);
        if (input.substr(peg$currPos, 3) === peg$c0) {
            s0 = peg$c0;
            peg$currPos += 3;
        } else s0 = peg$FAILED;
        return s0;
    }
    function peg$parsenex() {
        var s0;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$parseatom();
        if (s0 === peg$FAILED) s0 = peg$parselist();
        return s0;
    }
    function peg$parselist() {
        var s0;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$parseorg_list();
        if (s0 === peg$FAILED) {
            s0 = peg$parseexp_list();
            if (s0 === peg$FAILED) {
                s0 = peg$parselambda_list();
                if (s0 === peg$FAILED) {
                    s0 = peg$parsecmd_list();
                    if (s0 === peg$FAILED) {
                        s0 = peg$parseinstance_list();
                        if (s0 === peg$FAILED) s0 = peg$parseinstantiator_list();
                    }
                }
            }
        }
        return s0;
    }
    function peg$parseinstance_list() {
        var s0, s1, s2, s3, s4, s5, s6, s7;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        s1 = peg$parsenonmutable_instance_name();
        if (s1 !== peg$FAILED) {
            s2 = peg$parseprivate_data_section();
            if (s2 !== peg$FAILED) {
                rule$expects(peg$e1);
                if (input.charCodeAt(peg$currPos) === 40) {
                    s3 = peg$c1;
                    peg$currPos++;
                } else s3 = peg$FAILED;
                if (s3 !== peg$FAILED) {
                    s4 = peg$parsetaglist();
                    if (s4 === peg$FAILED) s4 = null;
                    s5 = [];
                    s6 = peg$parsenex_with_space();
                    while(s6 !== peg$FAILED){
                        s5.push(s6);
                        s6 = peg$parsenex_with_space();
                    }
                    s6 = peg$parse_();
                    rule$expects(peg$e2);
                    if (input.charCodeAt(peg$currPos) === 41) {
                        s7 = peg$c2;
                        peg$currPos++;
                    } else s7 = peg$FAILED;
                    if (s7 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s0 = peg$f1(s1, s2, s4, s5);
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parsenonmutable_instance_name();
            if (s1 !== peg$FAILED) {
                s2 = peg$parseprivate_data_section();
                if (s2 !== peg$FAILED) {
                    rule$expects(peg$e3);
                    if (input.substr(peg$currPos, 2) === peg$c3) {
                        s3 = peg$c3;
                        peg$currPos += 2;
                    } else s3 = peg$FAILED;
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parsetaglist();
                        if (s4 === peg$FAILED) s4 = null;
                        s5 = [];
                        s6 = peg$parsenex_with_space();
                        while(s6 !== peg$FAILED){
                            s5.push(s6);
                            s6 = peg$parsenex_with_space();
                        }
                        s6 = peg$parse_();
                        rule$expects(peg$e4);
                        if (input.substr(peg$currPos, 2) === peg$c4) {
                            s7 = peg$c4;
                            peg$currPos += 2;
                        } else s7 = peg$FAILED;
                        if (s7 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s0 = peg$f1(s1, s2, s4, s5);
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = peg$parsenonmutable_instance_name();
                if (s1 !== peg$FAILED) {
                    s2 = peg$parseprivate_data_section();
                    if (s2 !== peg$FAILED) {
                        rule$expects(peg$e5);
                        if (input.substr(peg$currPos, 2) === peg$c5) {
                            s3 = peg$c5;
                            peg$currPos += 2;
                        } else s3 = peg$FAILED;
                        if (s3 !== peg$FAILED) {
                            s4 = peg$parsetaglist();
                            if (s4 === peg$FAILED) s4 = null;
                            s5 = [];
                            s6 = peg$parsenex_with_space();
                            while(s6 !== peg$FAILED){
                                s5.push(s6);
                                s6 = peg$parsenex_with_space();
                            }
                            s6 = peg$parse_();
                            rule$expects(peg$e6);
                            if (input.substr(peg$currPos, 2) === peg$c6) {
                                s7 = peg$c6;
                                peg$currPos += 2;
                            } else s7 = peg$FAILED;
                            if (s7 !== peg$FAILED) {
                                peg$savedPos = s0;
                                s0 = peg$f2(s1, s2, s4, s5);
                            } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
                if (s0 === peg$FAILED) {
                    s0 = peg$currPos;
                    s1 = peg$parsenonmutable_instance_name();
                    if (s1 !== peg$FAILED) {
                        s2 = peg$parseprivate_data_section();
                        if (s2 !== peg$FAILED) {
                            rule$expects(peg$e7);
                            if (input.substr(peg$currPos, 2) === peg$c7) {
                                s3 = peg$c7;
                                peg$currPos += 2;
                            } else s3 = peg$FAILED;
                            if (s3 !== peg$FAILED) {
                                s4 = peg$parsetaglist();
                                if (s4 === peg$FAILED) s4 = null;
                                s5 = [];
                                s6 = peg$parsenex_with_space();
                                while(s6 !== peg$FAILED){
                                    s5.push(s6);
                                    s6 = peg$parsenex_with_space();
                                }
                                s6 = peg$parse_();
                                rule$expects(peg$e8);
                                if (input.substr(peg$currPos, 2) === peg$c8) {
                                    s7 = peg$c8;
                                    peg$currPos += 2;
                                } else s7 = peg$FAILED;
                                if (s7 !== peg$FAILED) {
                                    peg$savedPos = s0;
                                    s0 = peg$f3(s1, s2, s4, s5);
                                } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                    if (s0 === peg$FAILED) {
                        s0 = peg$currPos;
                        s1 = peg$parseinstance_name();
                        if (s1 !== peg$FAILED) {
                            s2 = peg$parseprivate_data_section();
                            if (s2 !== peg$FAILED) {
                                rule$expects(peg$e1);
                                if (input.charCodeAt(peg$currPos) === 40) {
                                    s3 = peg$c1;
                                    peg$currPos++;
                                } else s3 = peg$FAILED;
                                if (s3 !== peg$FAILED) {
                                    s4 = peg$parsetaglist();
                                    if (s4 === peg$FAILED) s4 = null;
                                    s5 = [];
                                    s6 = peg$parsenex_with_space();
                                    while(s6 !== peg$FAILED){
                                        s5.push(s6);
                                        s6 = peg$parsenex_with_space();
                                    }
                                    s6 = peg$parse_();
                                    rule$expects(peg$e2);
                                    if (input.charCodeAt(peg$currPos) === 41) {
                                        s7 = peg$c2;
                                        peg$currPos++;
                                    } else s7 = peg$FAILED;
                                    if (s7 !== peg$FAILED) {
                                        peg$savedPos = s0;
                                        s0 = peg$f4(s1, s2, s4, s5);
                                    } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                        if (s0 === peg$FAILED) {
                            s0 = peg$currPos;
                            s1 = peg$parseinstance_name();
                            if (s1 !== peg$FAILED) {
                                s2 = peg$parseprivate_data_section();
                                if (s2 !== peg$FAILED) {
                                    rule$expects(peg$e3);
                                    if (input.substr(peg$currPos, 2) === peg$c3) {
                                        s3 = peg$c3;
                                        peg$currPos += 2;
                                    } else s3 = peg$FAILED;
                                    if (s3 !== peg$FAILED) {
                                        s4 = peg$parsetaglist();
                                        if (s4 === peg$FAILED) s4 = null;
                                        s5 = [];
                                        s6 = peg$parsenex_with_space();
                                        while(s6 !== peg$FAILED){
                                            s5.push(s6);
                                            s6 = peg$parsenex_with_space();
                                        }
                                        s6 = peg$parse_();
                                        rule$expects(peg$e4);
                                        if (input.substr(peg$currPos, 2) === peg$c4) {
                                            s7 = peg$c4;
                                            peg$currPos += 2;
                                        } else s7 = peg$FAILED;
                                        if (s7 !== peg$FAILED) {
                                            peg$savedPos = s0;
                                            s0 = peg$f4(s1, s2, s4, s5);
                                        } else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                            if (s0 === peg$FAILED) {
                                s0 = peg$currPos;
                                s1 = peg$parseinstance_name();
                                if (s1 !== peg$FAILED) {
                                    s2 = peg$parseprivate_data_section();
                                    if (s2 !== peg$FAILED) {
                                        rule$expects(peg$e5);
                                        if (input.substr(peg$currPos, 2) === peg$c5) {
                                            s3 = peg$c5;
                                            peg$currPos += 2;
                                        } else s3 = peg$FAILED;
                                        if (s3 !== peg$FAILED) {
                                            s4 = peg$parsetaglist();
                                            if (s4 === peg$FAILED) s4 = null;
                                            s5 = [];
                                            s6 = peg$parsenex_with_space();
                                            while(s6 !== peg$FAILED){
                                                s5.push(s6);
                                                s6 = peg$parsenex_with_space();
                                            }
                                            s6 = peg$parse_();
                                            rule$expects(peg$e6);
                                            if (input.substr(peg$currPos, 2) === peg$c6) {
                                                s7 = peg$c6;
                                                peg$currPos += 2;
                                            } else s7 = peg$FAILED;
                                            if (s7 !== peg$FAILED) {
                                                peg$savedPos = s0;
                                                s0 = peg$f5(s1, s2, s4, s5);
                                            } else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        } else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                                if (s0 === peg$FAILED) {
                                    s0 = peg$currPos;
                                    s1 = peg$parseinstance_name();
                                    if (s1 !== peg$FAILED) {
                                        s2 = peg$parseprivate_data_section();
                                        if (s2 !== peg$FAILED) {
                                            rule$expects(peg$e7);
                                            if (input.substr(peg$currPos, 2) === peg$c7) {
                                                s3 = peg$c7;
                                                peg$currPos += 2;
                                            } else s3 = peg$FAILED;
                                            if (s3 !== peg$FAILED) {
                                                s4 = peg$parsetaglist();
                                                if (s4 === peg$FAILED) s4 = null;
                                                s5 = [];
                                                s6 = peg$parsenex_with_space();
                                                while(s6 !== peg$FAILED){
                                                    s5.push(s6);
                                                    s6 = peg$parsenex_with_space();
                                                }
                                                s6 = peg$parse_();
                                                rule$expects(peg$e8);
                                                if (input.substr(peg$currPos, 2) === peg$c8) {
                                                    s7 = peg$c8;
                                                    peg$currPos += 2;
                                                } else s7 = peg$FAILED;
                                                if (s7 !== peg$FAILED) {
                                                    peg$savedPos = s0;
                                                    s0 = peg$f6(s1, s2, s4, s5);
                                                } else {
                                                    peg$currPos = s0;
                                                    s0 = peg$FAILED;
                                                }
                                            } else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        } else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return s0;
    }
    function peg$parseorg_list() {
        var s0, s1, s2, s3, s4, s5, s6, s7;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        rule$expects(peg$e9);
        if (input.charCodeAt(peg$currPos) === 59) {
            s1 = peg$c9;
            peg$currPos++;
        } else s1 = peg$FAILED;
        if (s1 !== peg$FAILED) {
            s2 = peg$parseprivate_data_section();
            if (s2 !== peg$FAILED) {
                rule$expects(peg$e1);
                if (input.charCodeAt(peg$currPos) === 40) {
                    s3 = peg$c1;
                    peg$currPos++;
                } else s3 = peg$FAILED;
                if (s3 !== peg$FAILED) {
                    s4 = peg$parsetaglist();
                    if (s4 === peg$FAILED) s4 = null;
                    s5 = [];
                    s6 = peg$parsenex_with_space();
                    while(s6 !== peg$FAILED){
                        s5.push(s6);
                        s6 = peg$parsenex_with_space();
                    }
                    s6 = peg$parse_();
                    rule$expects(peg$e2);
                    if (input.charCodeAt(peg$currPos) === 41) {
                        s7 = peg$c2;
                        peg$currPos++;
                    } else s7 = peg$FAILED;
                    if (s7 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s0 = peg$f7(s2, s4, s5);
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            rule$expects(peg$e9);
            if (input.charCodeAt(peg$currPos) === 59) {
                s1 = peg$c9;
                peg$currPos++;
            } else s1 = peg$FAILED;
            if (s1 !== peg$FAILED) {
                s2 = peg$parseprivate_data_section();
                if (s2 !== peg$FAILED) {
                    rule$expects(peg$e3);
                    if (input.substr(peg$currPos, 2) === peg$c3) {
                        s3 = peg$c3;
                        peg$currPos += 2;
                    } else s3 = peg$FAILED;
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parsetaglist();
                        if (s4 === peg$FAILED) s4 = null;
                        s5 = [];
                        s6 = peg$parsenex_with_space();
                        while(s6 !== peg$FAILED){
                            s5.push(s6);
                            s6 = peg$parsenex_with_space();
                        }
                        s6 = peg$parse_();
                        rule$expects(peg$e4);
                        if (input.substr(peg$currPos, 2) === peg$c4) {
                            s7 = peg$c4;
                            peg$currPos += 2;
                        } else s7 = peg$FAILED;
                        if (s7 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s0 = peg$f7(s2, s4, s5);
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                rule$expects(peg$e9);
                if (input.charCodeAt(peg$currPos) === 59) {
                    s1 = peg$c9;
                    peg$currPos++;
                } else s1 = peg$FAILED;
                if (s1 !== peg$FAILED) {
                    s2 = peg$parseprivate_data_section();
                    if (s2 !== peg$FAILED) {
                        rule$expects(peg$e5);
                        if (input.substr(peg$currPos, 2) === peg$c5) {
                            s3 = peg$c5;
                            peg$currPos += 2;
                        } else s3 = peg$FAILED;
                        if (s3 !== peg$FAILED) {
                            s4 = peg$parsetaglist();
                            if (s4 === peg$FAILED) s4 = null;
                            s5 = [];
                            s6 = peg$parsenex_with_space();
                            while(s6 !== peg$FAILED){
                                s5.push(s6);
                                s6 = peg$parsenex_with_space();
                            }
                            s6 = peg$parse_();
                            rule$expects(peg$e6);
                            if (input.substr(peg$currPos, 2) === peg$c6) {
                                s7 = peg$c6;
                                peg$currPos += 2;
                            } else s7 = peg$FAILED;
                            if (s7 !== peg$FAILED) {
                                peg$savedPos = s0;
                                s0 = peg$f8(s2, s4, s5);
                            } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
                if (s0 === peg$FAILED) {
                    s0 = peg$currPos;
                    rule$expects(peg$e9);
                    if (input.charCodeAt(peg$currPos) === 59) {
                        s1 = peg$c9;
                        peg$currPos++;
                    } else s1 = peg$FAILED;
                    if (s1 !== peg$FAILED) {
                        s2 = peg$parseprivate_data_section();
                        if (s2 !== peg$FAILED) {
                            rule$expects(peg$e7);
                            if (input.substr(peg$currPos, 2) === peg$c7) {
                                s3 = peg$c7;
                                peg$currPos += 2;
                            } else s3 = peg$FAILED;
                            if (s3 !== peg$FAILED) {
                                s4 = peg$parsetaglist();
                                if (s4 === peg$FAILED) s4 = null;
                                s5 = [];
                                s6 = peg$parsenex_with_space();
                                while(s6 !== peg$FAILED){
                                    s5.push(s6);
                                    s6 = peg$parsenex_with_space();
                                }
                                s6 = peg$parse_();
                                rule$expects(peg$e8);
                                if (input.substr(peg$currPos, 2) === peg$c8) {
                                    s7 = peg$c8;
                                    peg$currPos += 2;
                                } else s7 = peg$FAILED;
                                if (s7 !== peg$FAILED) {
                                    peg$savedPos = s0;
                                    s0 = peg$f9(s2, s4, s5);
                                } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                    if (s0 === peg$FAILED) {
                        s0 = peg$currPos;
                        s1 = peg$parseprivate_data_section();
                        if (s1 !== peg$FAILED) {
                            rule$expects(peg$e1);
                            if (input.charCodeAt(peg$currPos) === 40) {
                                s2 = peg$c1;
                                peg$currPos++;
                            } else s2 = peg$FAILED;
                            if (s2 !== peg$FAILED) {
                                s3 = peg$parsetaglist();
                                if (s3 === peg$FAILED) s3 = null;
                                s4 = [];
                                s5 = peg$parsenex_with_space();
                                while(s5 !== peg$FAILED){
                                    s4.push(s5);
                                    s5 = peg$parsenex_with_space();
                                }
                                s5 = peg$parse_();
                                rule$expects(peg$e2);
                                if (input.charCodeAt(peg$currPos) === 41) {
                                    s6 = peg$c2;
                                    peg$currPos++;
                                } else s6 = peg$FAILED;
                                if (s6 !== peg$FAILED) {
                                    peg$savedPos = s0;
                                    s0 = peg$f10(s1, s3, s4);
                                } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                        if (s0 === peg$FAILED) {
                            s0 = peg$currPos;
                            s1 = peg$parseprivate_data_section();
                            if (s1 !== peg$FAILED) {
                                rule$expects(peg$e3);
                                if (input.substr(peg$currPos, 2) === peg$c3) {
                                    s2 = peg$c3;
                                    peg$currPos += 2;
                                } else s2 = peg$FAILED;
                                if (s2 !== peg$FAILED) {
                                    s3 = peg$parsetaglist();
                                    if (s3 === peg$FAILED) s3 = null;
                                    s4 = [];
                                    s5 = peg$parsenex_with_space();
                                    while(s5 !== peg$FAILED){
                                        s4.push(s5);
                                        s5 = peg$parsenex_with_space();
                                    }
                                    s5 = peg$parse_();
                                    rule$expects(peg$e4);
                                    if (input.substr(peg$currPos, 2) === peg$c4) {
                                        s6 = peg$c4;
                                        peg$currPos += 2;
                                    } else s6 = peg$FAILED;
                                    if (s6 !== peg$FAILED) {
                                        peg$savedPos = s0;
                                        s0 = peg$f10(s1, s3, s4);
                                    } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                            if (s0 === peg$FAILED) {
                                s0 = peg$currPos;
                                s1 = peg$parseprivate_data_section();
                                if (s1 !== peg$FAILED) {
                                    rule$expects(peg$e5);
                                    if (input.substr(peg$currPos, 2) === peg$c5) {
                                        s2 = peg$c5;
                                        peg$currPos += 2;
                                    } else s2 = peg$FAILED;
                                    if (s2 !== peg$FAILED) {
                                        s3 = peg$parsetaglist();
                                        if (s3 === peg$FAILED) s3 = null;
                                        s4 = [];
                                        s5 = peg$parsenex_with_space();
                                        while(s5 !== peg$FAILED){
                                            s4.push(s5);
                                            s5 = peg$parsenex_with_space();
                                        }
                                        s5 = peg$parse_();
                                        rule$expects(peg$e6);
                                        if (input.substr(peg$currPos, 2) === peg$c6) {
                                            s6 = peg$c6;
                                            peg$currPos += 2;
                                        } else s6 = peg$FAILED;
                                        if (s6 !== peg$FAILED) {
                                            peg$savedPos = s0;
                                            s0 = peg$f11(s1, s3, s4);
                                        } else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                                if (s0 === peg$FAILED) {
                                    s0 = peg$currPos;
                                    s1 = peg$parseprivate_data_section();
                                    if (s1 !== peg$FAILED) {
                                        rule$expects(peg$e7);
                                        if (input.substr(peg$currPos, 2) === peg$c7) {
                                            s2 = peg$c7;
                                            peg$currPos += 2;
                                        } else s2 = peg$FAILED;
                                        if (s2 !== peg$FAILED) {
                                            s3 = peg$parsetaglist();
                                            if (s3 === peg$FAILED) s3 = null;
                                            s4 = [];
                                            s5 = peg$parsenex_with_space();
                                            while(s5 !== peg$FAILED){
                                                s4.push(s5);
                                                s5 = peg$parsenex_with_space();
                                            }
                                            s5 = peg$parse_();
                                            rule$expects(peg$e8);
                                            if (input.substr(peg$currPos, 2) === peg$c8) {
                                                s6 = peg$c8;
                                                peg$currPos += 2;
                                            } else s6 = peg$FAILED;
                                            if (s6 !== peg$FAILED) {
                                                peg$savedPos = s0;
                                                s0 = peg$f12(s1, s3, s4);
                                            } else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        } else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return s0;
    }
    function peg$parseexp_list() {
        var s0, s1, s2, s3, s4, s5, s6, s7;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        rule$expects(peg$e10);
        if (input.substr(peg$currPos, 2) === peg$c10) {
            s1 = peg$c10;
            peg$currPos += 2;
        } else s1 = peg$FAILED;
        if (s1 !== peg$FAILED) {
            s2 = peg$parseprivate_data_section();
            if (s2 !== peg$FAILED) {
                rule$expects(peg$e1);
                if (input.charCodeAt(peg$currPos) === 40) {
                    s3 = peg$c1;
                    peg$currPos++;
                } else s3 = peg$FAILED;
                if (s3 !== peg$FAILED) {
                    s4 = peg$parsetaglist();
                    if (s4 === peg$FAILED) s4 = null;
                    s5 = [];
                    s6 = peg$parsenex_with_space();
                    while(s6 !== peg$FAILED){
                        s5.push(s6);
                        s6 = peg$parsenex_with_space();
                    }
                    s6 = peg$parse_();
                    rule$expects(peg$e2);
                    if (input.charCodeAt(peg$currPos) === 41) {
                        s7 = peg$c2;
                        peg$currPos++;
                    } else s7 = peg$FAILED;
                    if (s7 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s0 = peg$f13(s2, s4, s5);
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            rule$expects(peg$e10);
            if (input.substr(peg$currPos, 2) === peg$c10) {
                s1 = peg$c10;
                peg$currPos += 2;
            } else s1 = peg$FAILED;
            if (s1 !== peg$FAILED) {
                s2 = peg$parseprivate_data_section();
                if (s2 !== peg$FAILED) {
                    rule$expects(peg$e3);
                    if (input.substr(peg$currPos, 2) === peg$c3) {
                        s3 = peg$c3;
                        peg$currPos += 2;
                    } else s3 = peg$FAILED;
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parsetaglist();
                        if (s4 === peg$FAILED) s4 = null;
                        s5 = [];
                        s6 = peg$parsenex_with_space();
                        while(s6 !== peg$FAILED){
                            s5.push(s6);
                            s6 = peg$parsenex_with_space();
                        }
                        s6 = peg$parse_();
                        rule$expects(peg$e4);
                        if (input.substr(peg$currPos, 2) === peg$c4) {
                            s7 = peg$c4;
                            peg$currPos += 2;
                        } else s7 = peg$FAILED;
                        if (s7 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s0 = peg$f13(s2, s4, s5);
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                rule$expects(peg$e10);
                if (input.substr(peg$currPos, 2) === peg$c10) {
                    s1 = peg$c10;
                    peg$currPos += 2;
                } else s1 = peg$FAILED;
                if (s1 !== peg$FAILED) {
                    s2 = peg$parseprivate_data_section();
                    if (s2 !== peg$FAILED) {
                        rule$expects(peg$e5);
                        if (input.substr(peg$currPos, 2) === peg$c5) {
                            s3 = peg$c5;
                            peg$currPos += 2;
                        } else s3 = peg$FAILED;
                        if (s3 !== peg$FAILED) {
                            s4 = peg$parsetaglist();
                            if (s4 === peg$FAILED) s4 = null;
                            s5 = [];
                            s6 = peg$parsenex_with_space();
                            while(s6 !== peg$FAILED){
                                s5.push(s6);
                                s6 = peg$parsenex_with_space();
                            }
                            s6 = peg$parse_();
                            rule$expects(peg$e6);
                            if (input.substr(peg$currPos, 2) === peg$c6) {
                                s7 = peg$c6;
                                peg$currPos += 2;
                            } else s7 = peg$FAILED;
                            if (s7 !== peg$FAILED) {
                                peg$savedPos = s0;
                                s0 = peg$f14(s2, s4, s5);
                            } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
                if (s0 === peg$FAILED) {
                    s0 = peg$currPos;
                    rule$expects(peg$e10);
                    if (input.substr(peg$currPos, 2) === peg$c10) {
                        s1 = peg$c10;
                        peg$currPos += 2;
                    } else s1 = peg$FAILED;
                    if (s1 !== peg$FAILED) {
                        s2 = peg$parseprivate_data_section();
                        if (s2 !== peg$FAILED) {
                            rule$expects(peg$e7);
                            if (input.substr(peg$currPos, 2) === peg$c7) {
                                s3 = peg$c7;
                                peg$currPos += 2;
                            } else s3 = peg$FAILED;
                            if (s3 !== peg$FAILED) {
                                s4 = peg$parsetaglist();
                                if (s4 === peg$FAILED) s4 = null;
                                s5 = [];
                                s6 = peg$parsenex_with_space();
                                while(s6 !== peg$FAILED){
                                    s5.push(s6);
                                    s6 = peg$parsenex_with_space();
                                }
                                s6 = peg$parse_();
                                rule$expects(peg$e8);
                                if (input.substr(peg$currPos, 2) === peg$c8) {
                                    s7 = peg$c8;
                                    peg$currPos += 2;
                                } else s7 = peg$FAILED;
                                if (s7 !== peg$FAILED) {
                                    peg$savedPos = s0;
                                    s0 = peg$f15(s2, s4, s5);
                                } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                    if (s0 === peg$FAILED) {
                        s0 = peg$currPos;
                        rule$expects(peg$e11);
                        if (input.charCodeAt(peg$currPos) === 42) {
                            s1 = peg$c11;
                            peg$currPos++;
                        } else s1 = peg$FAILED;
                        if (s1 !== peg$FAILED) {
                            s2 = peg$parseprivate_data_section();
                            if (s2 !== peg$FAILED) {
                                rule$expects(peg$e1);
                                if (input.charCodeAt(peg$currPos) === 40) {
                                    s3 = peg$c1;
                                    peg$currPos++;
                                } else s3 = peg$FAILED;
                                if (s3 !== peg$FAILED) {
                                    s4 = peg$parsetaglist();
                                    if (s4 === peg$FAILED) s4 = null;
                                    s5 = [];
                                    s6 = peg$parsenex_with_space();
                                    while(s6 !== peg$FAILED){
                                        s5.push(s6);
                                        s6 = peg$parsenex_with_space();
                                    }
                                    s6 = peg$parse_();
                                    rule$expects(peg$e2);
                                    if (input.charCodeAt(peg$currPos) === 41) {
                                        s7 = peg$c2;
                                        peg$currPos++;
                                    } else s7 = peg$FAILED;
                                    if (s7 !== peg$FAILED) {
                                        peg$savedPos = s0;
                                        s0 = peg$f16(s2, s4, s5);
                                    } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                        if (s0 === peg$FAILED) {
                            s0 = peg$currPos;
                            rule$expects(peg$e11);
                            if (input.charCodeAt(peg$currPos) === 42) {
                                s1 = peg$c11;
                                peg$currPos++;
                            } else s1 = peg$FAILED;
                            if (s1 !== peg$FAILED) {
                                s2 = peg$parseprivate_data_section();
                                if (s2 !== peg$FAILED) {
                                    rule$expects(peg$e3);
                                    if (input.substr(peg$currPos, 2) === peg$c3) {
                                        s3 = peg$c3;
                                        peg$currPos += 2;
                                    } else s3 = peg$FAILED;
                                    if (s3 !== peg$FAILED) {
                                        s4 = peg$parsetaglist();
                                        if (s4 === peg$FAILED) s4 = null;
                                        s5 = [];
                                        s6 = peg$parsenex_with_space();
                                        while(s6 !== peg$FAILED){
                                            s5.push(s6);
                                            s6 = peg$parsenex_with_space();
                                        }
                                        s6 = peg$parse_();
                                        rule$expects(peg$e4);
                                        if (input.substr(peg$currPos, 2) === peg$c4) {
                                            s7 = peg$c4;
                                            peg$currPos += 2;
                                        } else s7 = peg$FAILED;
                                        if (s7 !== peg$FAILED) {
                                            peg$savedPos = s0;
                                            s0 = peg$f16(s2, s4, s5);
                                        } else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                            if (s0 === peg$FAILED) {
                                s0 = peg$currPos;
                                rule$expects(peg$e11);
                                if (input.charCodeAt(peg$currPos) === 42) {
                                    s1 = peg$c11;
                                    peg$currPos++;
                                } else s1 = peg$FAILED;
                                if (s1 !== peg$FAILED) {
                                    s2 = peg$parseprivate_data_section();
                                    if (s2 !== peg$FAILED) {
                                        rule$expects(peg$e5);
                                        if (input.substr(peg$currPos, 2) === peg$c5) {
                                            s3 = peg$c5;
                                            peg$currPos += 2;
                                        } else s3 = peg$FAILED;
                                        if (s3 !== peg$FAILED) {
                                            s4 = peg$parsetaglist();
                                            if (s4 === peg$FAILED) s4 = null;
                                            s5 = [];
                                            s6 = peg$parsenex_with_space();
                                            while(s6 !== peg$FAILED){
                                                s5.push(s6);
                                                s6 = peg$parsenex_with_space();
                                            }
                                            s6 = peg$parse_();
                                            rule$expects(peg$e6);
                                            if (input.substr(peg$currPos, 2) === peg$c6) {
                                                s7 = peg$c6;
                                                peg$currPos += 2;
                                            } else s7 = peg$FAILED;
                                            if (s7 !== peg$FAILED) {
                                                peg$savedPos = s0;
                                                s0 = peg$f17(s2, s4, s5);
                                            } else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        } else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                                if (s0 === peg$FAILED) {
                                    s0 = peg$currPos;
                                    rule$expects(peg$e11);
                                    if (input.charCodeAt(peg$currPos) === 42) {
                                        s1 = peg$c11;
                                        peg$currPos++;
                                    } else s1 = peg$FAILED;
                                    if (s1 !== peg$FAILED) {
                                        s2 = peg$parseprivate_data_section();
                                        if (s2 !== peg$FAILED) {
                                            rule$expects(peg$e7);
                                            if (input.substr(peg$currPos, 2) === peg$c7) {
                                                s3 = peg$c7;
                                                peg$currPos += 2;
                                            } else s3 = peg$FAILED;
                                            if (s3 !== peg$FAILED) {
                                                s4 = peg$parsetaglist();
                                                if (s4 === peg$FAILED) s4 = null;
                                                s5 = [];
                                                s6 = peg$parsenex_with_space();
                                                while(s6 !== peg$FAILED){
                                                    s5.push(s6);
                                                    s6 = peg$parsenex_with_space();
                                                }
                                                s6 = peg$parse_();
                                                rule$expects(peg$e8);
                                                if (input.substr(peg$currPos, 2) === peg$c8) {
                                                    s7 = peg$c8;
                                                    peg$currPos += 2;
                                                } else s7 = peg$FAILED;
                                                if (s7 !== peg$FAILED) {
                                                    peg$savedPos = s0;
                                                    s0 = peg$f18(s2, s4, s5);
                                                } else {
                                                    peg$currPos = s0;
                                                    s0 = peg$FAILED;
                                                }
                                            } else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        } else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return s0;
    }
    function peg$parselambda_list() {
        var s0, s1, s2, s3, s4, s5, s6, s7;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        rule$expects(peg$e12);
        if (input.substr(peg$currPos, 2) === peg$c12) {
            s1 = peg$c12;
            peg$currPos += 2;
        } else s1 = peg$FAILED;
        if (s1 !== peg$FAILED) {
            s2 = peg$parseprivate_data_section();
            if (s2 !== peg$FAILED) {
                rule$expects(peg$e1);
                if (input.charCodeAt(peg$currPos) === 40) {
                    s3 = peg$c1;
                    peg$currPos++;
                } else s3 = peg$FAILED;
                if (s3 !== peg$FAILED) {
                    s4 = peg$parsetaglist();
                    if (s4 === peg$FAILED) s4 = null;
                    s5 = [];
                    s6 = peg$parsenex_with_space();
                    while(s6 !== peg$FAILED){
                        s5.push(s6);
                        s6 = peg$parsenex_with_space();
                    }
                    s6 = peg$parse_();
                    rule$expects(peg$e2);
                    if (input.charCodeAt(peg$currPos) === 41) {
                        s7 = peg$c2;
                        peg$currPos++;
                    } else s7 = peg$FAILED;
                    if (s7 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s0 = peg$f19(s2, s4, s5);
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            rule$expects(peg$e12);
            if (input.substr(peg$currPos, 2) === peg$c12) {
                s1 = peg$c12;
                peg$currPos += 2;
            } else s1 = peg$FAILED;
            if (s1 !== peg$FAILED) {
                s2 = peg$parseprivate_data_section();
                if (s2 !== peg$FAILED) {
                    rule$expects(peg$e3);
                    if (input.substr(peg$currPos, 2) === peg$c3) {
                        s3 = peg$c3;
                        peg$currPos += 2;
                    } else s3 = peg$FAILED;
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parsetaglist();
                        if (s4 === peg$FAILED) s4 = null;
                        s5 = [];
                        s6 = peg$parsenex_with_space();
                        while(s6 !== peg$FAILED){
                            s5.push(s6);
                            s6 = peg$parsenex_with_space();
                        }
                        s6 = peg$parse_();
                        rule$expects(peg$e4);
                        if (input.substr(peg$currPos, 2) === peg$c4) {
                            s7 = peg$c4;
                            peg$currPos += 2;
                        } else s7 = peg$FAILED;
                        if (s7 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s0 = peg$f19(s2, s4, s5);
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                rule$expects(peg$e12);
                if (input.substr(peg$currPos, 2) === peg$c12) {
                    s1 = peg$c12;
                    peg$currPos += 2;
                } else s1 = peg$FAILED;
                if (s1 !== peg$FAILED) {
                    s2 = peg$parseprivate_data_section();
                    if (s2 !== peg$FAILED) {
                        rule$expects(peg$e5);
                        if (input.substr(peg$currPos, 2) === peg$c5) {
                            s3 = peg$c5;
                            peg$currPos += 2;
                        } else s3 = peg$FAILED;
                        if (s3 !== peg$FAILED) {
                            s4 = peg$parsetaglist();
                            if (s4 === peg$FAILED) s4 = null;
                            s5 = [];
                            s6 = peg$parsenex_with_space();
                            while(s6 !== peg$FAILED){
                                s5.push(s6);
                                s6 = peg$parsenex_with_space();
                            }
                            s6 = peg$parse_();
                            rule$expects(peg$e6);
                            if (input.substr(peg$currPos, 2) === peg$c6) {
                                s7 = peg$c6;
                                peg$currPos += 2;
                            } else s7 = peg$FAILED;
                            if (s7 !== peg$FAILED) {
                                peg$savedPos = s0;
                                s0 = peg$f20(s2, s4, s5);
                            } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
                if (s0 === peg$FAILED) {
                    s0 = peg$currPos;
                    rule$expects(peg$e12);
                    if (input.substr(peg$currPos, 2) === peg$c12) {
                        s1 = peg$c12;
                        peg$currPos += 2;
                    } else s1 = peg$FAILED;
                    if (s1 !== peg$FAILED) {
                        s2 = peg$parseprivate_data_section();
                        if (s2 !== peg$FAILED) {
                            rule$expects(peg$e7);
                            if (input.substr(peg$currPos, 2) === peg$c7) {
                                s3 = peg$c7;
                                peg$currPos += 2;
                            } else s3 = peg$FAILED;
                            if (s3 !== peg$FAILED) {
                                s4 = peg$parsetaglist();
                                if (s4 === peg$FAILED) s4 = null;
                                s5 = [];
                                s6 = peg$parsenex_with_space();
                                while(s6 !== peg$FAILED){
                                    s5.push(s6);
                                    s6 = peg$parsenex_with_space();
                                }
                                s6 = peg$parse_();
                                rule$expects(peg$e8);
                                if (input.substr(peg$currPos, 2) === peg$c8) {
                                    s7 = peg$c8;
                                    peg$currPos += 2;
                                } else s7 = peg$FAILED;
                                if (s7 !== peg$FAILED) {
                                    peg$savedPos = s0;
                                    s0 = peg$f21(s2, s4, s5);
                                } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                    if (s0 === peg$FAILED) {
                        s0 = peg$currPos;
                        rule$expects(peg$e13);
                        if (input.charCodeAt(peg$currPos) === 38) {
                            s1 = peg$c13;
                            peg$currPos++;
                        } else s1 = peg$FAILED;
                        if (s1 !== peg$FAILED) {
                            s2 = peg$parseprivate_data_section();
                            if (s2 !== peg$FAILED) {
                                rule$expects(peg$e1);
                                if (input.charCodeAt(peg$currPos) === 40) {
                                    s3 = peg$c1;
                                    peg$currPos++;
                                } else s3 = peg$FAILED;
                                if (s3 !== peg$FAILED) {
                                    s4 = peg$parsetaglist();
                                    if (s4 === peg$FAILED) s4 = null;
                                    s5 = [];
                                    s6 = peg$parsenex_with_space();
                                    while(s6 !== peg$FAILED){
                                        s5.push(s6);
                                        s6 = peg$parsenex_with_space();
                                    }
                                    s6 = peg$parse_();
                                    rule$expects(peg$e2);
                                    if (input.charCodeAt(peg$currPos) === 41) {
                                        s7 = peg$c2;
                                        peg$currPos++;
                                    } else s7 = peg$FAILED;
                                    if (s7 !== peg$FAILED) {
                                        peg$savedPos = s0;
                                        s0 = peg$f22(s2, s4, s5);
                                    } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                        if (s0 === peg$FAILED) {
                            s0 = peg$currPos;
                            rule$expects(peg$e13);
                            if (input.charCodeAt(peg$currPos) === 38) {
                                s1 = peg$c13;
                                peg$currPos++;
                            } else s1 = peg$FAILED;
                            if (s1 !== peg$FAILED) {
                                s2 = peg$parseprivate_data_section();
                                if (s2 !== peg$FAILED) {
                                    rule$expects(peg$e3);
                                    if (input.substr(peg$currPos, 2) === peg$c3) {
                                        s3 = peg$c3;
                                        peg$currPos += 2;
                                    } else s3 = peg$FAILED;
                                    if (s3 !== peg$FAILED) {
                                        s4 = peg$parsetaglist();
                                        if (s4 === peg$FAILED) s4 = null;
                                        s5 = [];
                                        s6 = peg$parsenex_with_space();
                                        while(s6 !== peg$FAILED){
                                            s5.push(s6);
                                            s6 = peg$parsenex_with_space();
                                        }
                                        s6 = peg$parse_();
                                        rule$expects(peg$e4);
                                        if (input.substr(peg$currPos, 2) === peg$c4) {
                                            s7 = peg$c4;
                                            peg$currPos += 2;
                                        } else s7 = peg$FAILED;
                                        if (s7 !== peg$FAILED) {
                                            peg$savedPos = s0;
                                            s0 = peg$f22(s2, s4, s5);
                                        } else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                            if (s0 === peg$FAILED) {
                                s0 = peg$currPos;
                                rule$expects(peg$e13);
                                if (input.charCodeAt(peg$currPos) === 38) {
                                    s1 = peg$c13;
                                    peg$currPos++;
                                } else s1 = peg$FAILED;
                                if (s1 !== peg$FAILED) {
                                    s2 = peg$parseprivate_data_section();
                                    if (s2 !== peg$FAILED) {
                                        rule$expects(peg$e5);
                                        if (input.substr(peg$currPos, 2) === peg$c5) {
                                            s3 = peg$c5;
                                            peg$currPos += 2;
                                        } else s3 = peg$FAILED;
                                        if (s3 !== peg$FAILED) {
                                            s4 = peg$parsetaglist();
                                            if (s4 === peg$FAILED) s4 = null;
                                            s5 = [];
                                            s6 = peg$parsenex_with_space();
                                            while(s6 !== peg$FAILED){
                                                s5.push(s6);
                                                s6 = peg$parsenex_with_space();
                                            }
                                            s6 = peg$parse_();
                                            rule$expects(peg$e6);
                                            if (input.substr(peg$currPos, 2) === peg$c6) {
                                                s7 = peg$c6;
                                                peg$currPos += 2;
                                            } else s7 = peg$FAILED;
                                            if (s7 !== peg$FAILED) {
                                                peg$savedPos = s0;
                                                s0 = peg$f23(s2, s4, s5);
                                            } else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        } else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                                if (s0 === peg$FAILED) {
                                    s0 = peg$currPos;
                                    rule$expects(peg$e13);
                                    if (input.charCodeAt(peg$currPos) === 38) {
                                        s1 = peg$c13;
                                        peg$currPos++;
                                    } else s1 = peg$FAILED;
                                    if (s1 !== peg$FAILED) {
                                        s2 = peg$parseprivate_data_section();
                                        if (s2 !== peg$FAILED) {
                                            rule$expects(peg$e7);
                                            if (input.substr(peg$currPos, 2) === peg$c7) {
                                                s3 = peg$c7;
                                                peg$currPos += 2;
                                            } else s3 = peg$FAILED;
                                            if (s3 !== peg$FAILED) {
                                                s4 = peg$parsetaglist();
                                                if (s4 === peg$FAILED) s4 = null;
                                                s5 = [];
                                                s6 = peg$parsenex_with_space();
                                                while(s6 !== peg$FAILED){
                                                    s5.push(s6);
                                                    s6 = peg$parsenex_with_space();
                                                }
                                                s6 = peg$parse_();
                                                rule$expects(peg$e8);
                                                if (input.substr(peg$currPos, 2) === peg$c8) {
                                                    s7 = peg$c8;
                                                    peg$currPos += 2;
                                                } else s7 = peg$FAILED;
                                                if (s7 !== peg$FAILED) {
                                                    peg$savedPos = s0;
                                                    s0 = peg$f24(s2, s4, s5);
                                                } else {
                                                    peg$currPos = s0;
                                                    s0 = peg$FAILED;
                                                }
                                            } else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        } else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return s0;
    }
    function peg$parsecmd_list() {
        var s0, s1, s2, s3, s4, s5, s6, s7, s8, s9;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        rule$expects(peg$e14);
        if (input.substr(peg$currPos, 2) === peg$c14) {
            s1 = peg$c14;
            peg$currPos += 2;
        } else s1 = peg$FAILED;
        if (s1 !== peg$FAILED) {
            s2 = peg$parseprivate_data_section();
            if (s2 !== peg$FAILED) {
                rule$expects(peg$e1);
                if (input.charCodeAt(peg$currPos) === 40) {
                    s3 = peg$c1;
                    peg$currPos++;
                } else s3 = peg$FAILED;
                if (s3 !== peg$FAILED) {
                    s4 = peg$parsetaglist();
                    if (s4 === peg$FAILED) s4 = null;
                    s5 = [];
                    s6 = peg$parsenex_with_space();
                    while(s6 !== peg$FAILED){
                        s5.push(s6);
                        s6 = peg$parsenex_with_space();
                    }
                    s6 = peg$parse_();
                    rule$expects(peg$e2);
                    if (input.charCodeAt(peg$currPos) === 41) {
                        s7 = peg$c2;
                        peg$currPos++;
                    } else s7 = peg$FAILED;
                    if (s7 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s0 = peg$f25(s2, s4, s5);
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            rule$expects(peg$e14);
            if (input.substr(peg$currPos, 2) === peg$c14) {
                s1 = peg$c14;
                peg$currPos += 2;
            } else s1 = peg$FAILED;
            if (s1 !== peg$FAILED) {
                s2 = peg$parseprivate_data_section();
                if (s2 !== peg$FAILED) {
                    rule$expects(peg$e3);
                    if (input.substr(peg$currPos, 2) === peg$c3) {
                        s3 = peg$c3;
                        peg$currPos += 2;
                    } else s3 = peg$FAILED;
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parsetaglist();
                        if (s4 === peg$FAILED) s4 = null;
                        s5 = [];
                        s6 = peg$parsenex_with_space();
                        while(s6 !== peg$FAILED){
                            s5.push(s6);
                            s6 = peg$parsenex_with_space();
                        }
                        s6 = peg$parse_();
                        rule$expects(peg$e4);
                        if (input.substr(peg$currPos, 2) === peg$c4) {
                            s7 = peg$c4;
                            peg$currPos += 2;
                        } else s7 = peg$FAILED;
                        if (s7 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s0 = peg$f25(s2, s4, s5);
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                rule$expects(peg$e14);
                if (input.substr(peg$currPos, 2) === peg$c14) {
                    s1 = peg$c14;
                    peg$currPos += 2;
                } else s1 = peg$FAILED;
                if (s1 !== peg$FAILED) {
                    s2 = peg$parseprivate_data_section();
                    if (s2 !== peg$FAILED) {
                        rule$expects(peg$e5);
                        if (input.substr(peg$currPos, 2) === peg$c5) {
                            s3 = peg$c5;
                            peg$currPos += 2;
                        } else s3 = peg$FAILED;
                        if (s3 !== peg$FAILED) {
                            s4 = peg$parsetaglist();
                            if (s4 === peg$FAILED) s4 = null;
                            s5 = [];
                            s6 = peg$parsenex_with_space();
                            while(s6 !== peg$FAILED){
                                s5.push(s6);
                                s6 = peg$parsenex_with_space();
                            }
                            s6 = peg$parse_();
                            rule$expects(peg$e6);
                            if (input.substr(peg$currPos, 2) === peg$c6) {
                                s7 = peg$c6;
                                peg$currPos += 2;
                            } else s7 = peg$FAILED;
                            if (s7 !== peg$FAILED) {
                                peg$savedPos = s0;
                                s0 = peg$f26(s2, s4, s5);
                            } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
                if (s0 === peg$FAILED) {
                    s0 = peg$currPos;
                    rule$expects(peg$e14);
                    if (input.substr(peg$currPos, 2) === peg$c14) {
                        s1 = peg$c14;
                        peg$currPos += 2;
                    } else s1 = peg$FAILED;
                    if (s1 !== peg$FAILED) {
                        s2 = peg$parseprivate_data_section();
                        if (s2 !== peg$FAILED) {
                            rule$expects(peg$e7);
                            if (input.substr(peg$currPos, 2) === peg$c7) {
                                s3 = peg$c7;
                                peg$currPos += 2;
                            } else s3 = peg$FAILED;
                            if (s3 !== peg$FAILED) {
                                s4 = peg$parsetaglist();
                                if (s4 === peg$FAILED) s4 = null;
                                s5 = [];
                                s6 = peg$parsenex_with_space();
                                while(s6 !== peg$FAILED){
                                    s5.push(s6);
                                    s6 = peg$parsenex_with_space();
                                }
                                s6 = peg$parse_();
                                rule$expects(peg$e8);
                                if (input.substr(peg$currPos, 2) === peg$c8) {
                                    s7 = peg$c8;
                                    peg$currPos += 2;
                                } else s7 = peg$FAILED;
                                if (s7 !== peg$FAILED) {
                                    peg$savedPos = s0;
                                    s0 = peg$f27(s2, s4, s5);
                                } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                    if (s0 === peg$FAILED) {
                        s0 = peg$currPos;
                        rule$expects(peg$e14);
                        if (input.substr(peg$currPos, 2) === peg$c14) {
                            s1 = peg$c14;
                            peg$currPos += 2;
                        } else s1 = peg$FAILED;
                        if (s1 !== peg$FAILED) {
                            s2 = peg$parseprivate_data_section();
                            if (s2 !== peg$FAILED) {
                                rule$expects(peg$e1);
                                if (input.charCodeAt(peg$currPos) === 40) {
                                    s3 = peg$c1;
                                    peg$currPos++;
                                } else s3 = peg$FAILED;
                                if (s3 !== peg$FAILED) {
                                    s4 = peg$parsetaglist();
                                    if (s4 === peg$FAILED) s4 = null;
                                    s5 = peg$parsecmd_name();
                                    if (s5 !== peg$FAILED) {
                                        s6 = [];
                                        s7 = peg$parsews();
                                        if (s7 !== peg$FAILED) while(s7 !== peg$FAILED){
                                            s6.push(s7);
                                            s7 = peg$parsews();
                                        }
                                        else s6 = peg$FAILED;
                                        if (s6 !== peg$FAILED) {
                                            s7 = [];
                                            s8 = peg$parsenex_with_space();
                                            while(s8 !== peg$FAILED){
                                                s7.push(s8);
                                                s8 = peg$parsenex_with_space();
                                            }
                                            s8 = peg$parse_();
                                            rule$expects(peg$e2);
                                            if (input.charCodeAt(peg$currPos) === 41) {
                                                s9 = peg$c2;
                                                peg$currPos++;
                                            } else s9 = peg$FAILED;
                                            if (s9 !== peg$FAILED) {
                                                peg$savedPos = s0;
                                                s0 = peg$f28(s2, s4, s5, s7);
                                            } else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        } else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                        if (s0 === peg$FAILED) {
                            s0 = peg$currPos;
                            rule$expects(peg$e14);
                            if (input.substr(peg$currPos, 2) === peg$c14) {
                                s1 = peg$c14;
                                peg$currPos += 2;
                            } else s1 = peg$FAILED;
                            if (s1 !== peg$FAILED) {
                                s2 = peg$parseprivate_data_section();
                                if (s2 !== peg$FAILED) {
                                    rule$expects(peg$e3);
                                    if (input.substr(peg$currPos, 2) === peg$c3) {
                                        s3 = peg$c3;
                                        peg$currPos += 2;
                                    } else s3 = peg$FAILED;
                                    if (s3 !== peg$FAILED) {
                                        s4 = peg$parsetaglist();
                                        if (s4 === peg$FAILED) s4 = null;
                                        s5 = peg$parsecmd_name();
                                        if (s5 !== peg$FAILED) {
                                            s6 = [];
                                            s7 = peg$parsews();
                                            if (s7 !== peg$FAILED) while(s7 !== peg$FAILED){
                                                s6.push(s7);
                                                s7 = peg$parsews();
                                            }
                                            else s6 = peg$FAILED;
                                            if (s6 !== peg$FAILED) {
                                                s7 = [];
                                                s8 = peg$parsenex_with_space();
                                                while(s8 !== peg$FAILED){
                                                    s7.push(s8);
                                                    s8 = peg$parsenex_with_space();
                                                }
                                                s8 = peg$parse_();
                                                rule$expects(peg$e4);
                                                if (input.substr(peg$currPos, 2) === peg$c4) {
                                                    s9 = peg$c4;
                                                    peg$currPos += 2;
                                                } else s9 = peg$FAILED;
                                                if (s9 !== peg$FAILED) {
                                                    peg$savedPos = s0;
                                                    s0 = peg$f28(s2, s4, s5, s7);
                                                } else {
                                                    peg$currPos = s0;
                                                    s0 = peg$FAILED;
                                                }
                                            } else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        } else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                            if (s0 === peg$FAILED) {
                                s0 = peg$currPos;
                                rule$expects(peg$e14);
                                if (input.substr(peg$currPos, 2) === peg$c14) {
                                    s1 = peg$c14;
                                    peg$currPos += 2;
                                } else s1 = peg$FAILED;
                                if (s1 !== peg$FAILED) {
                                    s2 = peg$parseprivate_data_section();
                                    if (s2 !== peg$FAILED) {
                                        rule$expects(peg$e5);
                                        if (input.substr(peg$currPos, 2) === peg$c5) {
                                            s3 = peg$c5;
                                            peg$currPos += 2;
                                        } else s3 = peg$FAILED;
                                        if (s3 !== peg$FAILED) {
                                            s4 = peg$parsetaglist();
                                            if (s4 === peg$FAILED) s4 = null;
                                            s5 = peg$parsecmd_name();
                                            if (s5 !== peg$FAILED) {
                                                s6 = [];
                                                s7 = peg$parsews();
                                                if (s7 !== peg$FAILED) while(s7 !== peg$FAILED){
                                                    s6.push(s7);
                                                    s7 = peg$parsews();
                                                }
                                                else s6 = peg$FAILED;
                                                if (s6 !== peg$FAILED) {
                                                    s7 = [];
                                                    s8 = peg$parsenex_with_space();
                                                    while(s8 !== peg$FAILED){
                                                        s7.push(s8);
                                                        s8 = peg$parsenex_with_space();
                                                    }
                                                    s8 = peg$parse_();
                                                    rule$expects(peg$e6);
                                                    if (input.substr(peg$currPos, 2) === peg$c6) {
                                                        s9 = peg$c6;
                                                        peg$currPos += 2;
                                                    } else s9 = peg$FAILED;
                                                    if (s9 !== peg$FAILED) {
                                                        peg$savedPos = s0;
                                                        s0 = peg$f29(s2, s4, s5, s7);
                                                    } else {
                                                        peg$currPos = s0;
                                                        s0 = peg$FAILED;
                                                    }
                                                } else {
                                                    peg$currPos = s0;
                                                    s0 = peg$FAILED;
                                                }
                                            } else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        } else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                                if (s0 === peg$FAILED) {
                                    s0 = peg$currPos;
                                    rule$expects(peg$e14);
                                    if (input.substr(peg$currPos, 2) === peg$c14) {
                                        s1 = peg$c14;
                                        peg$currPos += 2;
                                    } else s1 = peg$FAILED;
                                    if (s1 !== peg$FAILED) {
                                        s2 = peg$parseprivate_data_section();
                                        if (s2 !== peg$FAILED) {
                                            rule$expects(peg$e7);
                                            if (input.substr(peg$currPos, 2) === peg$c7) {
                                                s3 = peg$c7;
                                                peg$currPos += 2;
                                            } else s3 = peg$FAILED;
                                            if (s3 !== peg$FAILED) {
                                                s4 = peg$parsetaglist();
                                                if (s4 === peg$FAILED) s4 = null;
                                                s5 = peg$parsecmd_name();
                                                if (s5 !== peg$FAILED) {
                                                    s6 = [];
                                                    s7 = peg$parsews();
                                                    if (s7 !== peg$FAILED) while(s7 !== peg$FAILED){
                                                        s6.push(s7);
                                                        s7 = peg$parsews();
                                                    }
                                                    else s6 = peg$FAILED;
                                                    if (s6 !== peg$FAILED) {
                                                        s7 = [];
                                                        s8 = peg$parsenex_with_space();
                                                        while(s8 !== peg$FAILED){
                                                            s7.push(s8);
                                                            s8 = peg$parsenex_with_space();
                                                        }
                                                        s8 = peg$parse_();
                                                        rule$expects(peg$e8);
                                                        if (input.substr(peg$currPos, 2) === peg$c8) {
                                                            s9 = peg$c8;
                                                            peg$currPos += 2;
                                                        } else s9 = peg$FAILED;
                                                        if (s9 !== peg$FAILED) {
                                                            peg$savedPos = s0;
                                                            s0 = peg$f30(s2, s4, s5, s7);
                                                        } else {
                                                            peg$currPos = s0;
                                                            s0 = peg$FAILED;
                                                        }
                                                    } else {
                                                        peg$currPos = s0;
                                                        s0 = peg$FAILED;
                                                    }
                                                } else {
                                                    peg$currPos = s0;
                                                    s0 = peg$FAILED;
                                                }
                                            } else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        } else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                    if (s0 === peg$FAILED) {
                                        s0 = peg$currPos;
                                        rule$expects(peg$e15);
                                        if (input.charCodeAt(peg$currPos) === 126) {
                                            s1 = peg$c15;
                                            peg$currPos++;
                                        } else s1 = peg$FAILED;
                                        if (s1 !== peg$FAILED) {
                                            s2 = peg$parseprivate_data_section();
                                            if (s2 !== peg$FAILED) {
                                                rule$expects(peg$e1);
                                                if (input.charCodeAt(peg$currPos) === 40) {
                                                    s3 = peg$c1;
                                                    peg$currPos++;
                                                } else s3 = peg$FAILED;
                                                if (s3 !== peg$FAILED) {
                                                    s4 = peg$parsetaglist();
                                                    if (s4 === peg$FAILED) s4 = null;
                                                    s5 = [];
                                                    s6 = peg$parsenex_with_space();
                                                    while(s6 !== peg$FAILED){
                                                        s5.push(s6);
                                                        s6 = peg$parsenex_with_space();
                                                    }
                                                    s6 = peg$parse_();
                                                    rule$expects(peg$e2);
                                                    if (input.charCodeAt(peg$currPos) === 41) {
                                                        s7 = peg$c2;
                                                        peg$currPos++;
                                                    } else s7 = peg$FAILED;
                                                    if (s7 !== peg$FAILED) {
                                                        peg$savedPos = s0;
                                                        s0 = peg$f31(s2, s4, s5);
                                                    } else {
                                                        peg$currPos = s0;
                                                        s0 = peg$FAILED;
                                                    }
                                                } else {
                                                    peg$currPos = s0;
                                                    s0 = peg$FAILED;
                                                }
                                            } else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        } else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                        if (s0 === peg$FAILED) {
                                            s0 = peg$currPos;
                                            rule$expects(peg$e15);
                                            if (input.charCodeAt(peg$currPos) === 126) {
                                                s1 = peg$c15;
                                                peg$currPos++;
                                            } else s1 = peg$FAILED;
                                            if (s1 !== peg$FAILED) {
                                                s2 = peg$parseprivate_data_section();
                                                if (s2 !== peg$FAILED) {
                                                    rule$expects(peg$e3);
                                                    if (input.substr(peg$currPos, 2) === peg$c3) {
                                                        s3 = peg$c3;
                                                        peg$currPos += 2;
                                                    } else s3 = peg$FAILED;
                                                    if (s3 !== peg$FAILED) {
                                                        s4 = peg$parsetaglist();
                                                        if (s4 === peg$FAILED) s4 = null;
                                                        s5 = [];
                                                        s6 = peg$parsenex_with_space();
                                                        while(s6 !== peg$FAILED){
                                                            s5.push(s6);
                                                            s6 = peg$parsenex_with_space();
                                                        }
                                                        s6 = peg$parse_();
                                                        rule$expects(peg$e4);
                                                        if (input.substr(peg$currPos, 2) === peg$c4) {
                                                            s7 = peg$c4;
                                                            peg$currPos += 2;
                                                        } else s7 = peg$FAILED;
                                                        if (s7 !== peg$FAILED) {
                                                            peg$savedPos = s0;
                                                            s0 = peg$f31(s2, s4, s5);
                                                        } else {
                                                            peg$currPos = s0;
                                                            s0 = peg$FAILED;
                                                        }
                                                    } else {
                                                        peg$currPos = s0;
                                                        s0 = peg$FAILED;
                                                    }
                                                } else {
                                                    peg$currPos = s0;
                                                    s0 = peg$FAILED;
                                                }
                                            } else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                            if (s0 === peg$FAILED) {
                                                s0 = peg$currPos;
                                                rule$expects(peg$e15);
                                                if (input.charCodeAt(peg$currPos) === 126) {
                                                    s1 = peg$c15;
                                                    peg$currPos++;
                                                } else s1 = peg$FAILED;
                                                if (s1 !== peg$FAILED) {
                                                    s2 = peg$parseprivate_data_section();
                                                    if (s2 !== peg$FAILED) {
                                                        rule$expects(peg$e5);
                                                        if (input.substr(peg$currPos, 2) === peg$c5) {
                                                            s3 = peg$c5;
                                                            peg$currPos += 2;
                                                        } else s3 = peg$FAILED;
                                                        if (s3 !== peg$FAILED) {
                                                            s4 = peg$parsetaglist();
                                                            if (s4 === peg$FAILED) s4 = null;
                                                            s5 = [];
                                                            s6 = peg$parsenex_with_space();
                                                            while(s6 !== peg$FAILED){
                                                                s5.push(s6);
                                                                s6 = peg$parsenex_with_space();
                                                            }
                                                            s6 = peg$parse_();
                                                            rule$expects(peg$e6);
                                                            if (input.substr(peg$currPos, 2) === peg$c6) {
                                                                s7 = peg$c6;
                                                                peg$currPos += 2;
                                                            } else s7 = peg$FAILED;
                                                            if (s7 !== peg$FAILED) {
                                                                peg$savedPos = s0;
                                                                s0 = peg$f32(s2, s4, s5);
                                                            } else {
                                                                peg$currPos = s0;
                                                                s0 = peg$FAILED;
                                                            }
                                                        } else {
                                                            peg$currPos = s0;
                                                            s0 = peg$FAILED;
                                                        }
                                                    } else {
                                                        peg$currPos = s0;
                                                        s0 = peg$FAILED;
                                                    }
                                                } else {
                                                    peg$currPos = s0;
                                                    s0 = peg$FAILED;
                                                }
                                                if (s0 === peg$FAILED) {
                                                    s0 = peg$currPos;
                                                    rule$expects(peg$e15);
                                                    if (input.charCodeAt(peg$currPos) === 126) {
                                                        s1 = peg$c15;
                                                        peg$currPos++;
                                                    } else s1 = peg$FAILED;
                                                    if (s1 !== peg$FAILED) {
                                                        s2 = peg$parseprivate_data_section();
                                                        if (s2 !== peg$FAILED) {
                                                            rule$expects(peg$e7);
                                                            if (input.substr(peg$currPos, 2) === peg$c7) {
                                                                s3 = peg$c7;
                                                                peg$currPos += 2;
                                                            } else s3 = peg$FAILED;
                                                            if (s3 !== peg$FAILED) {
                                                                s4 = peg$parsetaglist();
                                                                if (s4 === peg$FAILED) s4 = null;
                                                                s5 = [];
                                                                s6 = peg$parsenex_with_space();
                                                                while(s6 !== peg$FAILED){
                                                                    s5.push(s6);
                                                                    s6 = peg$parsenex_with_space();
                                                                }
                                                                s6 = peg$parse_();
                                                                rule$expects(peg$e8);
                                                                if (input.substr(peg$currPos, 2) === peg$c8) {
                                                                    s7 = peg$c8;
                                                                    peg$currPos += 2;
                                                                } else s7 = peg$FAILED;
                                                                if (s7 !== peg$FAILED) {
                                                                    peg$savedPos = s0;
                                                                    s0 = peg$f33(s2, s4, s5);
                                                                } else {
                                                                    peg$currPos = s0;
                                                                    s0 = peg$FAILED;
                                                                }
                                                            } else {
                                                                peg$currPos = s0;
                                                                s0 = peg$FAILED;
                                                            }
                                                        } else {
                                                            peg$currPos = s0;
                                                            s0 = peg$FAILED;
                                                        }
                                                    } else {
                                                        peg$currPos = s0;
                                                        s0 = peg$FAILED;
                                                    }
                                                    if (s0 === peg$FAILED) {
                                                        s0 = peg$currPos;
                                                        rule$expects(peg$e15);
                                                        if (input.charCodeAt(peg$currPos) === 126) {
                                                            s1 = peg$c15;
                                                            peg$currPos++;
                                                        } else s1 = peg$FAILED;
                                                        if (s1 !== peg$FAILED) {
                                                            s2 = peg$parseprivate_data_section();
                                                            if (s2 !== peg$FAILED) {
                                                                rule$expects(peg$e1);
                                                                if (input.charCodeAt(peg$currPos) === 40) {
                                                                    s3 = peg$c1;
                                                                    peg$currPos++;
                                                                } else s3 = peg$FAILED;
                                                                if (s3 !== peg$FAILED) {
                                                                    s4 = peg$parsetaglist();
                                                                    if (s4 === peg$FAILED) s4 = null;
                                                                    s5 = peg$parsecmd_name();
                                                                    if (s5 !== peg$FAILED) {
                                                                        s6 = [];
                                                                        s7 = peg$parsews();
                                                                        if (s7 !== peg$FAILED) while(s7 !== peg$FAILED){
                                                                            s6.push(s7);
                                                                            s7 = peg$parsews();
                                                                        }
                                                                        else s6 = peg$FAILED;
                                                                        if (s6 !== peg$FAILED) {
                                                                            s7 = [];
                                                                            s8 = peg$parsenex_with_space();
                                                                            while(s8 !== peg$FAILED){
                                                                                s7.push(s8);
                                                                                s8 = peg$parsenex_with_space();
                                                                            }
                                                                            s8 = peg$parse_();
                                                                            rule$expects(peg$e2);
                                                                            if (input.charCodeAt(peg$currPos) === 41) {
                                                                                s9 = peg$c2;
                                                                                peg$currPos++;
                                                                            } else s9 = peg$FAILED;
                                                                            if (s9 !== peg$FAILED) {
                                                                                peg$savedPos = s0;
                                                                                s0 = peg$f34(s2, s4, s5, s7);
                                                                            } else {
                                                                                peg$currPos = s0;
                                                                                s0 = peg$FAILED;
                                                                            }
                                                                        } else {
                                                                            peg$currPos = s0;
                                                                            s0 = peg$FAILED;
                                                                        }
                                                                    } else {
                                                                        peg$currPos = s0;
                                                                        s0 = peg$FAILED;
                                                                    }
                                                                } else {
                                                                    peg$currPos = s0;
                                                                    s0 = peg$FAILED;
                                                                }
                                                            } else {
                                                                peg$currPos = s0;
                                                                s0 = peg$FAILED;
                                                            }
                                                        } else {
                                                            peg$currPos = s0;
                                                            s0 = peg$FAILED;
                                                        }
                                                        if (s0 === peg$FAILED) {
                                                            s0 = peg$currPos;
                                                            rule$expects(peg$e15);
                                                            if (input.charCodeAt(peg$currPos) === 126) {
                                                                s1 = peg$c15;
                                                                peg$currPos++;
                                                            } else s1 = peg$FAILED;
                                                            if (s1 !== peg$FAILED) {
                                                                s2 = peg$parseprivate_data_section();
                                                                if (s2 !== peg$FAILED) {
                                                                    rule$expects(peg$e3);
                                                                    if (input.substr(peg$currPos, 2) === peg$c3) {
                                                                        s3 = peg$c3;
                                                                        peg$currPos += 2;
                                                                    } else s3 = peg$FAILED;
                                                                    if (s3 !== peg$FAILED) {
                                                                        s4 = peg$parsetaglist();
                                                                        if (s4 === peg$FAILED) s4 = null;
                                                                        s5 = peg$parsecmd_name();
                                                                        if (s5 !== peg$FAILED) {
                                                                            s6 = [];
                                                                            s7 = peg$parsews();
                                                                            if (s7 !== peg$FAILED) while(s7 !== peg$FAILED){
                                                                                s6.push(s7);
                                                                                s7 = peg$parsews();
                                                                            }
                                                                            else s6 = peg$FAILED;
                                                                            if (s6 !== peg$FAILED) {
                                                                                s7 = [];
                                                                                s8 = peg$parsenex_with_space();
                                                                                while(s8 !== peg$FAILED){
                                                                                    s7.push(s8);
                                                                                    s8 = peg$parsenex_with_space();
                                                                                }
                                                                                s8 = peg$parse_();
                                                                                rule$expects(peg$e4);
                                                                                if (input.substr(peg$currPos, 2) === peg$c4) {
                                                                                    s9 = peg$c4;
                                                                                    peg$currPos += 2;
                                                                                } else s9 = peg$FAILED;
                                                                                if (s9 !== peg$FAILED) {
                                                                                    peg$savedPos = s0;
                                                                                    s0 = peg$f34(s2, s4, s5, s7);
                                                                                } else {
                                                                                    peg$currPos = s0;
                                                                                    s0 = peg$FAILED;
                                                                                }
                                                                            } else {
                                                                                peg$currPos = s0;
                                                                                s0 = peg$FAILED;
                                                                            }
                                                                        } else {
                                                                            peg$currPos = s0;
                                                                            s0 = peg$FAILED;
                                                                        }
                                                                    } else {
                                                                        peg$currPos = s0;
                                                                        s0 = peg$FAILED;
                                                                    }
                                                                } else {
                                                                    peg$currPos = s0;
                                                                    s0 = peg$FAILED;
                                                                }
                                                            } else {
                                                                peg$currPos = s0;
                                                                s0 = peg$FAILED;
                                                            }
                                                            if (s0 === peg$FAILED) {
                                                                s0 = peg$currPos;
                                                                rule$expects(peg$e15);
                                                                if (input.charCodeAt(peg$currPos) === 126) {
                                                                    s1 = peg$c15;
                                                                    peg$currPos++;
                                                                } else s1 = peg$FAILED;
                                                                if (s1 !== peg$FAILED) {
                                                                    s2 = peg$parseprivate_data_section();
                                                                    if (s2 !== peg$FAILED) {
                                                                        rule$expects(peg$e5);
                                                                        if (input.substr(peg$currPos, 2) === peg$c5) {
                                                                            s3 = peg$c5;
                                                                            peg$currPos += 2;
                                                                        } else s3 = peg$FAILED;
                                                                        if (s3 !== peg$FAILED) {
                                                                            s4 = peg$parsetaglist();
                                                                            if (s4 === peg$FAILED) s4 = null;
                                                                            s5 = peg$parsecmd_name();
                                                                            if (s5 !== peg$FAILED) {
                                                                                s6 = [];
                                                                                s7 = peg$parsews();
                                                                                if (s7 !== peg$FAILED) while(s7 !== peg$FAILED){
                                                                                    s6.push(s7);
                                                                                    s7 = peg$parsews();
                                                                                }
                                                                                else s6 = peg$FAILED;
                                                                                if (s6 !== peg$FAILED) {
                                                                                    s7 = [];
                                                                                    s8 = peg$parsenex_with_space();
                                                                                    while(s8 !== peg$FAILED){
                                                                                        s7.push(s8);
                                                                                        s8 = peg$parsenex_with_space();
                                                                                    }
                                                                                    s8 = peg$parse_();
                                                                                    rule$expects(peg$e6);
                                                                                    if (input.substr(peg$currPos, 2) === peg$c6) {
                                                                                        s9 = peg$c6;
                                                                                        peg$currPos += 2;
                                                                                    } else s9 = peg$FAILED;
                                                                                    if (s9 !== peg$FAILED) {
                                                                                        peg$savedPos = s0;
                                                                                        s0 = peg$f35(s2, s4, s5, s7);
                                                                                    } else {
                                                                                        peg$currPos = s0;
                                                                                        s0 = peg$FAILED;
                                                                                    }
                                                                                } else {
                                                                                    peg$currPos = s0;
                                                                                    s0 = peg$FAILED;
                                                                                }
                                                                            } else {
                                                                                peg$currPos = s0;
                                                                                s0 = peg$FAILED;
                                                                            }
                                                                        } else {
                                                                            peg$currPos = s0;
                                                                            s0 = peg$FAILED;
                                                                        }
                                                                    } else {
                                                                        peg$currPos = s0;
                                                                        s0 = peg$FAILED;
                                                                    }
                                                                } else {
                                                                    peg$currPos = s0;
                                                                    s0 = peg$FAILED;
                                                                }
                                                                if (s0 === peg$FAILED) {
                                                                    s0 = peg$currPos;
                                                                    rule$expects(peg$e15);
                                                                    if (input.charCodeAt(peg$currPos) === 126) {
                                                                        s1 = peg$c15;
                                                                        peg$currPos++;
                                                                    } else s1 = peg$FAILED;
                                                                    if (s1 !== peg$FAILED) {
                                                                        s2 = peg$parseprivate_data_section();
                                                                        if (s2 !== peg$FAILED) {
                                                                            rule$expects(peg$e7);
                                                                            if (input.substr(peg$currPos, 2) === peg$c7) {
                                                                                s3 = peg$c7;
                                                                                peg$currPos += 2;
                                                                            } else s3 = peg$FAILED;
                                                                            if (s3 !== peg$FAILED) {
                                                                                s4 = peg$parsetaglist();
                                                                                if (s4 === peg$FAILED) s4 = null;
                                                                                s5 = peg$parsecmd_name();
                                                                                if (s5 !== peg$FAILED) {
                                                                                    s6 = [];
                                                                                    s7 = peg$parsews();
                                                                                    if (s7 !== peg$FAILED) while(s7 !== peg$FAILED){
                                                                                        s6.push(s7);
                                                                                        s7 = peg$parsews();
                                                                                    }
                                                                                    else s6 = peg$FAILED;
                                                                                    if (s6 !== peg$FAILED) {
                                                                                        s7 = [];
                                                                                        s8 = peg$parsenex_with_space();
                                                                                        while(s8 !== peg$FAILED){
                                                                                            s7.push(s8);
                                                                                            s8 = peg$parsenex_with_space();
                                                                                        }
                                                                                        s8 = peg$parse_();
                                                                                        rule$expects(peg$e8);
                                                                                        if (input.substr(peg$currPos, 2) === peg$c8) {
                                                                                            s9 = peg$c8;
                                                                                            peg$currPos += 2;
                                                                                        } else s9 = peg$FAILED;
                                                                                        if (s9 !== peg$FAILED) {
                                                                                            peg$savedPos = s0;
                                                                                            s0 = peg$f36(s2, s4, s5, s7);
                                                                                        } else {
                                                                                            peg$currPos = s0;
                                                                                            s0 = peg$FAILED;
                                                                                        }
                                                                                    } else {
                                                                                        peg$currPos = s0;
                                                                                        s0 = peg$FAILED;
                                                                                    }
                                                                                } else {
                                                                                    peg$currPos = s0;
                                                                                    s0 = peg$FAILED;
                                                                                }
                                                                            } else {
                                                                                peg$currPos = s0;
                                                                                s0 = peg$FAILED;
                                                                            }
                                                                        } else {
                                                                            peg$currPos = s0;
                                                                            s0 = peg$FAILED;
                                                                        }
                                                                    } else {
                                                                        peg$currPos = s0;
                                                                        s0 = peg$FAILED;
                                                                    }
                                                                }
                                                            }
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return s0;
    }
    function peg$parseinstantiator_list() {
        var s0, s1, s2, s3, s4, s5, s6, s7;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        rule$expects(peg$e16);
        if (input.substr(peg$currPos, 2) === peg$c16) {
            s1 = peg$c16;
            peg$currPos += 2;
        } else s1 = peg$FAILED;
        if (s1 !== peg$FAILED) {
            s2 = peg$parseprivate_data_section();
            if (s2 !== peg$FAILED) {
                rule$expects(peg$e1);
                if (input.charCodeAt(peg$currPos) === 40) {
                    s3 = peg$c1;
                    peg$currPos++;
                } else s3 = peg$FAILED;
                if (s3 !== peg$FAILED) {
                    s4 = peg$parsetaglist();
                    if (s4 === peg$FAILED) s4 = null;
                    s5 = [];
                    s6 = peg$parsenex_with_space();
                    while(s6 !== peg$FAILED){
                        s5.push(s6);
                        s6 = peg$parsenex_with_space();
                    }
                    s6 = peg$parse_();
                    rule$expects(peg$e2);
                    if (input.charCodeAt(peg$currPos) === 41) {
                        s7 = peg$c2;
                        peg$currPos++;
                    } else s7 = peg$FAILED;
                    if (s7 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s0 = peg$f37(s2, s4, s5);
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            rule$expects(peg$e16);
            if (input.substr(peg$currPos, 2) === peg$c16) {
                s1 = peg$c16;
                peg$currPos += 2;
            } else s1 = peg$FAILED;
            if (s1 !== peg$FAILED) {
                s2 = peg$parseprivate_data_section();
                if (s2 !== peg$FAILED) {
                    rule$expects(peg$e3);
                    if (input.substr(peg$currPos, 2) === peg$c3) {
                        s3 = peg$c3;
                        peg$currPos += 2;
                    } else s3 = peg$FAILED;
                    if (s3 !== peg$FAILED) {
                        s4 = peg$parsetaglist();
                        if (s4 === peg$FAILED) s4 = null;
                        s5 = [];
                        s6 = peg$parsenex_with_space();
                        while(s6 !== peg$FAILED){
                            s5.push(s6);
                            s6 = peg$parsenex_with_space();
                        }
                        s6 = peg$parse_();
                        rule$expects(peg$e4);
                        if (input.substr(peg$currPos, 2) === peg$c4) {
                            s7 = peg$c4;
                            peg$currPos += 2;
                        } else s7 = peg$FAILED;
                        if (s7 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s0 = peg$f37(s2, s4, s5);
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                rule$expects(peg$e16);
                if (input.substr(peg$currPos, 2) === peg$c16) {
                    s1 = peg$c16;
                    peg$currPos += 2;
                } else s1 = peg$FAILED;
                if (s1 !== peg$FAILED) {
                    s2 = peg$parseprivate_data_section();
                    if (s2 !== peg$FAILED) {
                        rule$expects(peg$e5);
                        if (input.substr(peg$currPos, 2) === peg$c5) {
                            s3 = peg$c5;
                            peg$currPos += 2;
                        } else s3 = peg$FAILED;
                        if (s3 !== peg$FAILED) {
                            s4 = peg$parsetaglist();
                            if (s4 === peg$FAILED) s4 = null;
                            s5 = [];
                            s6 = peg$parsenex_with_space();
                            while(s6 !== peg$FAILED){
                                s5.push(s6);
                                s6 = peg$parsenex_with_space();
                            }
                            s6 = peg$parse_();
                            rule$expects(peg$e6);
                            if (input.substr(peg$currPos, 2) === peg$c6) {
                                s7 = peg$c6;
                                peg$currPos += 2;
                            } else s7 = peg$FAILED;
                            if (s7 !== peg$FAILED) {
                                peg$savedPos = s0;
                                s0 = peg$f38(s2, s4, s5);
                            } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
                if (s0 === peg$FAILED) {
                    s0 = peg$currPos;
                    rule$expects(peg$e16);
                    if (input.substr(peg$currPos, 2) === peg$c16) {
                        s1 = peg$c16;
                        peg$currPos += 2;
                    } else s1 = peg$FAILED;
                    if (s1 !== peg$FAILED) {
                        s2 = peg$parseprivate_data_section();
                        if (s2 !== peg$FAILED) {
                            rule$expects(peg$e7);
                            if (input.substr(peg$currPos, 2) === peg$c7) {
                                s3 = peg$c7;
                                peg$currPos += 2;
                            } else s3 = peg$FAILED;
                            if (s3 !== peg$FAILED) {
                                s4 = peg$parsetaglist();
                                if (s4 === peg$FAILED) s4 = null;
                                s5 = [];
                                s6 = peg$parsenex_with_space();
                                while(s6 !== peg$FAILED){
                                    s5.push(s6);
                                    s6 = peg$parsenex_with_space();
                                }
                                s6 = peg$parse_();
                                rule$expects(peg$e8);
                                if (input.substr(peg$currPos, 2) === peg$c8) {
                                    s7 = peg$c8;
                                    peg$currPos += 2;
                                } else s7 = peg$FAILED;
                                if (s7 !== peg$FAILED) {
                                    peg$savedPos = s0;
                                    s0 = peg$f39(s2, s4, s5);
                                } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                    if (s0 === peg$FAILED) {
                        s0 = peg$currPos;
                        rule$expects(peg$e17);
                        if (input.charCodeAt(peg$currPos) === 94) {
                            s1 = peg$c17;
                            peg$currPos++;
                        } else s1 = peg$FAILED;
                        if (s1 !== peg$FAILED) {
                            s2 = peg$parseprivate_data_section();
                            if (s2 !== peg$FAILED) {
                                rule$expects(peg$e1);
                                if (input.charCodeAt(peg$currPos) === 40) {
                                    s3 = peg$c1;
                                    peg$currPos++;
                                } else s3 = peg$FAILED;
                                if (s3 !== peg$FAILED) {
                                    s4 = peg$parsetaglist();
                                    if (s4 === peg$FAILED) s4 = null;
                                    s5 = [];
                                    s6 = peg$parsenex_with_space();
                                    while(s6 !== peg$FAILED){
                                        s5.push(s6);
                                        s6 = peg$parsenex_with_space();
                                    }
                                    s6 = peg$parse_();
                                    rule$expects(peg$e2);
                                    if (input.charCodeAt(peg$currPos) === 41) {
                                        s7 = peg$c2;
                                        peg$currPos++;
                                    } else s7 = peg$FAILED;
                                    if (s7 !== peg$FAILED) {
                                        peg$savedPos = s0;
                                        s0 = peg$f40(s2, s4, s5);
                                    } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                        if (s0 === peg$FAILED) {
                            s0 = peg$currPos;
                            rule$expects(peg$e17);
                            if (input.charCodeAt(peg$currPos) === 94) {
                                s1 = peg$c17;
                                peg$currPos++;
                            } else s1 = peg$FAILED;
                            if (s1 !== peg$FAILED) {
                                s2 = peg$parseprivate_data_section();
                                if (s2 !== peg$FAILED) {
                                    rule$expects(peg$e3);
                                    if (input.substr(peg$currPos, 2) === peg$c3) {
                                        s3 = peg$c3;
                                        peg$currPos += 2;
                                    } else s3 = peg$FAILED;
                                    if (s3 !== peg$FAILED) {
                                        s4 = peg$parsetaglist();
                                        if (s4 === peg$FAILED) s4 = null;
                                        s5 = [];
                                        s6 = peg$parsenex_with_space();
                                        while(s6 !== peg$FAILED){
                                            s5.push(s6);
                                            s6 = peg$parsenex_with_space();
                                        }
                                        s6 = peg$parse_();
                                        rule$expects(peg$e4);
                                        if (input.substr(peg$currPos, 2) === peg$c4) {
                                            s7 = peg$c4;
                                            peg$currPos += 2;
                                        } else s7 = peg$FAILED;
                                        if (s7 !== peg$FAILED) {
                                            peg$savedPos = s0;
                                            s0 = peg$f40(s2, s4, s5);
                                        } else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                            } else {
                                peg$currPos = s0;
                                s0 = peg$FAILED;
                            }
                            if (s0 === peg$FAILED) {
                                s0 = peg$currPos;
                                rule$expects(peg$e17);
                                if (input.charCodeAt(peg$currPos) === 94) {
                                    s1 = peg$c17;
                                    peg$currPos++;
                                } else s1 = peg$FAILED;
                                if (s1 !== peg$FAILED) {
                                    s2 = peg$parseprivate_data_section();
                                    if (s2 !== peg$FAILED) {
                                        rule$expects(peg$e5);
                                        if (input.substr(peg$currPos, 2) === peg$c5) {
                                            s3 = peg$c5;
                                            peg$currPos += 2;
                                        } else s3 = peg$FAILED;
                                        if (s3 !== peg$FAILED) {
                                            s4 = peg$parsetaglist();
                                            if (s4 === peg$FAILED) s4 = null;
                                            s5 = [];
                                            s6 = peg$parsenex_with_space();
                                            while(s6 !== peg$FAILED){
                                                s5.push(s6);
                                                s6 = peg$parsenex_with_space();
                                            }
                                            s6 = peg$parse_();
                                            rule$expects(peg$e6);
                                            if (input.substr(peg$currPos, 2) === peg$c6) {
                                                s7 = peg$c6;
                                                peg$currPos += 2;
                                            } else s7 = peg$FAILED;
                                            if (s7 !== peg$FAILED) {
                                                peg$savedPos = s0;
                                                s0 = peg$f41(s2, s4, s5);
                                            } else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        } else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                } else {
                                    peg$currPos = s0;
                                    s0 = peg$FAILED;
                                }
                                if (s0 === peg$FAILED) {
                                    s0 = peg$currPos;
                                    rule$expects(peg$e17);
                                    if (input.charCodeAt(peg$currPos) === 94) {
                                        s1 = peg$c17;
                                        peg$currPos++;
                                    } else s1 = peg$FAILED;
                                    if (s1 !== peg$FAILED) {
                                        s2 = peg$parseprivate_data_section();
                                        if (s2 !== peg$FAILED) {
                                            rule$expects(peg$e7);
                                            if (input.substr(peg$currPos, 2) === peg$c7) {
                                                s3 = peg$c7;
                                                peg$currPos += 2;
                                            } else s3 = peg$FAILED;
                                            if (s3 !== peg$FAILED) {
                                                s4 = peg$parsetaglist();
                                                if (s4 === peg$FAILED) s4 = null;
                                                s5 = [];
                                                s6 = peg$parsenex_with_space();
                                                while(s6 !== peg$FAILED){
                                                    s5.push(s6);
                                                    s6 = peg$parsenex_with_space();
                                                }
                                                s6 = peg$parse_();
                                                rule$expects(peg$e8);
                                                if (input.substr(peg$currPos, 2) === peg$c8) {
                                                    s7 = peg$c8;
                                                    peg$currPos += 2;
                                                } else s7 = peg$FAILED;
                                                if (s7 !== peg$FAILED) {
                                                    peg$savedPos = s0;
                                                    s0 = peg$f42(s2, s4, s5);
                                                } else {
                                                    peg$currPos = s0;
                                                    s0 = peg$FAILED;
                                                }
                                            } else {
                                                peg$currPos = s0;
                                                s0 = peg$FAILED;
                                            }
                                        } else {
                                            peg$currPos = s0;
                                            s0 = peg$FAILED;
                                        }
                                    } else {
                                        peg$currPos = s0;
                                        s0 = peg$FAILED;
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        return s0;
    }
    function peg$parsecmd_name() {
        var s0, s1, s2, s3, s4;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        s1 = peg$currPos;
        rule$expects(peg$e18);
        if (input.charCodeAt(peg$currPos) === 58) {
            s2 = peg$c18;
            peg$currPos++;
        } else s2 = peg$FAILED;
        if (s2 !== peg$FAILED) {
            rule$expects(peg$e19);
            if (peg$r0.test(input.charAt(peg$currPos))) {
                s3 = input.charAt(peg$currPos);
                peg$currPos++;
            } else s3 = peg$FAILED;
            if (s3 !== peg$FAILED) {
                rule$expects(peg$e19);
                if (peg$r0.test(input.charAt(peg$currPos))) {
                    s4 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else s4 = peg$FAILED;
                if (s4 !== peg$FAILED) {
                    s2 = [
                        s2,
                        s3,
                        s4
                    ];
                    s1 = s2;
                } else {
                    peg$currPos = s1;
                    s1 = peg$FAILED;
                }
            } else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
        } else {
            peg$currPos = s1;
            s1 = peg$FAILED;
        }
        if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$f43(s1);
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$currPos;
            rule$expects(peg$e18);
            if (input.charCodeAt(peg$currPos) === 58) {
                s2 = peg$c18;
                peg$currPos++;
            } else s2 = peg$FAILED;
            if (s2 !== peg$FAILED) {
                rule$expects(peg$e19);
                if (peg$r0.test(input.charAt(peg$currPos))) {
                    s3 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else s3 = peg$FAILED;
                if (s3 !== peg$FAILED) {
                    s2 = [
                        s2,
                        s3
                    ];
                    s1 = s2;
                } else {
                    peg$currPos = s1;
                    s1 = peg$FAILED;
                }
            } else {
                peg$currPos = s1;
                s1 = peg$FAILED;
            }
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$f43(s1);
            }
            s0 = s1;
            if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = [];
                rule$expects(peg$e20);
                if (peg$r1.test(input.charAt(peg$currPos))) {
                    s2 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else s2 = peg$FAILED;
                while(s2 !== peg$FAILED){
                    s1.push(s2);
                    rule$expects(peg$e20);
                    if (peg$r1.test(input.charAt(peg$currPos))) {
                        s2 = input.charAt(peg$currPos);
                        peg$currPos++;
                    } else s2 = peg$FAILED;
                }
                peg$savedPos = s0;
                s1 = peg$f44(s1);
                s0 = s1;
            }
        }
        return s0;
    }
    function peg$parseinstantiator_org_name() {
        var s0, s1, s2;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        s1 = [];
        if (peg$r2.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
        } else s2 = peg$FAILED;
        while(s2 !== peg$FAILED){
            s1.push(s2);
            if (peg$r2.test(input.charAt(peg$currPos))) {
                s2 = input.charAt(peg$currPos);
                peg$currPos++;
            } else s2 = peg$FAILED;
        }
        peg$savedPos = s0;
        s1 = peg$f44(s1);
        s0 = s1;
        return s0;
    }
    function peg$parsechildren_in_parens() {
        var s0, s1, s2, s3, s4;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        if (input.charCodeAt(peg$currPos) === 40) {
            s1 = peg$c1;
            peg$currPos++;
        } else s1 = peg$FAILED;
        if (s1 !== peg$FAILED) {
            s2 = [];
            s3 = peg$parsenex_with_space();
            while(s3 !== peg$FAILED){
                s2.push(s3);
                s3 = peg$parsenex_with_space();
            }
            s3 = peg$parse_();
            if (input.charCodeAt(peg$currPos) === 41) {
                s4 = peg$c2;
                peg$currPos++;
            } else s4 = peg$FAILED;
            if (s4 !== peg$FAILED) {
                peg$savedPos = s0;
                s0 = peg$f45(s2);
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parsenex_with_space() {
        var s0, s1, s2;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        s1 = peg$parse_();
        s2 = peg$parsenex();
        if (s2 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f0(s2);
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parseatom() {
        var s0;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$parseboolean_expression();
        if (s0 === peg$FAILED) {
            s0 = peg$parsesymbol_expression();
            if (s0 === peg$FAILED) {
                s0 = peg$parseinteger_expression();
                if (s0 === peg$FAILED) {
                    s0 = peg$parsestring_expression();
                    if (s0 === peg$FAILED) {
                        s0 = peg$parseerror_expression();
                        if (s0 === peg$FAILED) {
                            s0 = peg$parsefloat_expression();
                            if (s0 === peg$FAILED) s0 = peg$parseinstance_atom();
                        }
                    }
                }
            }
        }
        return s0;
    }
    function peg$parseinstance_atom() {
        var s0, s1, s2, s3, s4, s5;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        s1 = peg$parsenonmutable_instance_name();
        if (s1 !== peg$FAILED) {
            s2 = peg$parseprivate_data_section();
            if (s2 !== peg$FAILED) {
                s3 = peg$parsetaglist();
                if (s3 === peg$FAILED) s3 = null;
                s4 = peg$currPos;
                peg$begin();
                rule$expects(peg$e1);
                if (input.charCodeAt(peg$currPos) === 40) {
                    s5 = peg$c1;
                    peg$currPos++;
                } else s5 = peg$FAILED;
                peg$end(true);
                if (s5 === peg$FAILED) s4 = undefined;
                else {
                    peg$currPos = s4;
                    s4 = peg$FAILED;
                }
                if (s4 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s0 = peg$f46(s1, s2, s3);
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            s1 = peg$parseinstance_name();
            if (s1 !== peg$FAILED) {
                s2 = peg$parseprivate_data_section();
                if (s2 !== peg$FAILED) {
                    s3 = peg$parsetaglist();
                    if (s3 === peg$FAILED) s3 = null;
                    s4 = peg$currPos;
                    peg$begin();
                    rule$expects(peg$e1);
                    if (input.charCodeAt(peg$currPos) === 40) {
                        s5 = peg$c1;
                        peg$currPos++;
                    } else s5 = peg$FAILED;
                    peg$end(true);
                    if (s5 === peg$FAILED) s4 = undefined;
                    else {
                        peg$currPos = s4;
                        s4 = peg$FAILED;
                    }
                    if (s4 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s0 = peg$f47(s1, s2, s3);
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        return s0;
    }
    function peg$parseinstance_name() {
        var s0, s1, s2, s3;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        rule$expects(peg$e21);
        if (input.charCodeAt(peg$currPos) === 91) {
            s1 = peg$c19;
            peg$currPos++;
        } else s1 = peg$FAILED;
        if (s1 !== peg$FAILED) {
            s2 = peg$parseinstance_name_data();
            rule$expects(peg$e22);
            if (input.charCodeAt(peg$currPos) === 93) {
                s3 = peg$c20;
                peg$currPos++;
            } else s3 = peg$FAILED;
            if (s3 !== peg$FAILED) {
                peg$savedPos = s0;
                s0 = peg$f48(s2);
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parsenonmutable_instance_name() {
        var s0, s1, s2, s3;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        rule$expects(peg$e23);
        if (input.substr(peg$currPos, 2) === peg$c21) {
            s1 = peg$c21;
            peg$currPos += 2;
        } else s1 = peg$FAILED;
        if (s1 !== peg$FAILED) {
            s2 = peg$parseinstance_name_data();
            rule$expects(peg$e22);
            if (input.charCodeAt(peg$currPos) === 93) {
                s3 = peg$c20;
                peg$currPos++;
            } else s3 = peg$FAILED;
            if (s3 !== peg$FAILED) {
                peg$savedPos = s0;
                s0 = peg$f48(s2);
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parseinstance_name_data() {
        var s0, s1;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = [];
        rule$expects(peg$e24);
        if (peg$r3.test(input.charAt(peg$currPos))) {
            s1 = input.charAt(peg$currPos);
            peg$currPos++;
        } else s1 = peg$FAILED;
        while(s1 !== peg$FAILED){
            s0.push(s1);
            rule$expects(peg$e24);
            if (peg$r3.test(input.charAt(peg$currPos))) {
                s1 = input.charAt(peg$currPos);
                peg$currPos++;
            } else s1 = peg$FAILED;
        }
        return s0;
    }
    function peg$parseboolean_expression() {
        var s0, s1, s2, s3;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        rule$expects(peg$e25);
        if (input.substr(peg$currPos, 2) === peg$c22) {
            s1 = peg$c22;
            peg$currPos += 2;
        } else s1 = peg$FAILED;
        if (s1 !== peg$FAILED) {
            s2 = peg$parsetaglist();
            if (s2 === peg$FAILED) s2 = null;
            rule$expects(peg$e26);
            if (input.substr(peg$currPos, 3) === peg$c23) {
                s3 = peg$c23;
                peg$currPos += 3;
            } else s3 = peg$FAILED;
            if (s3 !== peg$FAILED) {
                peg$savedPos = s0;
                s0 = peg$f49(s2);
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            rule$expects(peg$e25);
            if (input.substr(peg$currPos, 2) === peg$c22) {
                s1 = peg$c22;
                peg$currPos += 2;
            } else s1 = peg$FAILED;
            if (s1 !== peg$FAILED) {
                s2 = peg$parsetaglist();
                if (s2 === peg$FAILED) s2 = null;
                rule$expects(peg$e27);
                if (input.substr(peg$currPos, 2) === peg$c24) {
                    s3 = peg$c24;
                    peg$currPos += 2;
                } else s3 = peg$FAILED;
                if (s3 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s0 = peg$f50(s2);
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                rule$expects(peg$e28);
                if (input.charCodeAt(peg$currPos) === 33) {
                    s1 = peg$c25;
                    peg$currPos++;
                } else s1 = peg$FAILED;
                if (s1 !== peg$FAILED) {
                    s2 = peg$parsetaglist();
                    if (s2 === peg$FAILED) s2 = null;
                    rule$expects(peg$e26);
                    if (input.substr(peg$currPos, 3) === peg$c23) {
                        s3 = peg$c23;
                        peg$currPos += 3;
                    } else s3 = peg$FAILED;
                    if (s3 !== peg$FAILED) {
                        peg$savedPos = s0;
                        s0 = peg$f51(s2);
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
                if (s0 === peg$FAILED) {
                    s0 = peg$currPos;
                    rule$expects(peg$e28);
                    if (input.charCodeAt(peg$currPos) === 33) {
                        s1 = peg$c25;
                        peg$currPos++;
                    } else s1 = peg$FAILED;
                    if (s1 !== peg$FAILED) {
                        s2 = peg$parsetaglist();
                        if (s2 === peg$FAILED) s2 = null;
                        rule$expects(peg$e27);
                        if (input.substr(peg$currPos, 2) === peg$c24) {
                            s3 = peg$c24;
                            peg$currPos += 2;
                        } else s3 = peg$FAILED;
                        if (s3 !== peg$FAILED) {
                            peg$savedPos = s0;
                            s0 = peg$f52(s2);
                        } else {
                            peg$currPos = s0;
                            s0 = peg$FAILED;
                        }
                    } else {
                        peg$currPos = s0;
                        s0 = peg$FAILED;
                    }
                }
            }
        }
        return s0;
    }
    function peg$parsesymbol_expression() {
        var s0, s1, s2, s3, s4;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        rule$expects(peg$e29);
        if (input.substr(peg$currPos, 2) === peg$c26) {
            s1 = peg$c26;
            peg$currPos += 2;
        } else s1 = peg$FAILED;
        if (s1 !== peg$FAILED) {
            s2 = peg$parsetaglist();
            if (s2 === peg$FAILED) s2 = null;
            s3 = [];
            s4 = peg$parsesymbol_char();
            if (s4 !== peg$FAILED) while(s4 !== peg$FAILED){
                s3.push(s4);
                s4 = peg$parsesymbol_char();
            }
            else s3 = peg$FAILED;
            if (s3 !== peg$FAILED) {
                peg$savedPos = s0;
                s0 = peg$f53(s2, s3);
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            rule$expects(peg$e30);
            if (input.charCodeAt(peg$currPos) === 64) {
                s1 = peg$c27;
                peg$currPos++;
            } else s1 = peg$FAILED;
            if (s1 !== peg$FAILED) {
                s2 = peg$parsetaglist();
                if (s2 === peg$FAILED) s2 = null;
                s3 = [];
                s4 = peg$parsesymbol_char();
                if (s4 !== peg$FAILED) while(s4 !== peg$FAILED){
                    s3.push(s4);
                    s4 = peg$parsesymbol_char();
                }
                else s3 = peg$FAILED;
                if (s3 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s0 = peg$f54(s2, s3);
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        return s0;
    }
    function peg$parsesymbol_char() {
        var s0, s1, s2, s3;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        rule$expects(peg$e20);
        if (peg$r1.test(input.charAt(peg$currPos))) {
            s1 = input.charAt(peg$currPos);
            peg$currPos++;
        } else s1 = peg$FAILED;
        if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$f55(s1);
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            rule$expects(peg$e31);
            if (input.charCodeAt(peg$currPos) === 95) {
                s1 = peg$c28;
                peg$currPos++;
            } else s1 = peg$FAILED;
            if (s1 !== peg$FAILED) {
                s2 = peg$currPos;
                peg$begin();
                rule$expects(peg$e2);
                if (input.charCodeAt(peg$currPos) === 41) {
                    s3 = peg$c2;
                    peg$currPos++;
                } else s3 = peg$FAILED;
                peg$end(true);
                if (s3 === peg$FAILED) s2 = undefined;
                else {
                    peg$currPos = s2;
                    s2 = peg$FAILED;
                }
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s0 = peg$f56();
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        return s0;
    }
    function peg$parseinteger_expression() {
        var s0, s1, s2, s3, s4, s5;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        rule$expects(peg$e32);
        if (input.substr(peg$currPos, 2) === peg$c29) {
            s1 = peg$c29;
            peg$currPos += 2;
        } else s1 = peg$FAILED;
        if (s1 !== peg$FAILED) {
            s2 = peg$parsetaglist();
            if (s2 === peg$FAILED) s2 = null;
            rule$expects(peg$e33);
            if (input.charCodeAt(peg$currPos) === 45) {
                s3 = peg$c30;
                peg$currPos++;
            } else s3 = peg$FAILED;
            if (s3 === peg$FAILED) s3 = null;
            s4 = [];
            rule$expects(peg$e34);
            if (peg$r4.test(input.charAt(peg$currPos))) {
                s5 = input.charAt(peg$currPos);
                peg$currPos++;
            } else s5 = peg$FAILED;
            if (s5 !== peg$FAILED) while(s5 !== peg$FAILED){
                s4.push(s5);
                rule$expects(peg$e34);
                if (peg$r4.test(input.charAt(peg$currPos))) {
                    s5 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else s5 = peg$FAILED;
            }
            else s4 = peg$FAILED;
            if (s4 !== peg$FAILED) {
                peg$savedPos = s0;
                s0 = peg$f57(s2, s3, s4);
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            rule$expects(peg$e35);
            if (input.charCodeAt(peg$currPos) === 35) {
                s1 = peg$c31;
                peg$currPos++;
            } else s1 = peg$FAILED;
            if (s1 !== peg$FAILED) {
                s2 = peg$parsetaglist();
                if (s2 === peg$FAILED) s2 = null;
                rule$expects(peg$e33);
                if (input.charCodeAt(peg$currPos) === 45) {
                    s3 = peg$c30;
                    peg$currPos++;
                } else s3 = peg$FAILED;
                if (s3 === peg$FAILED) s3 = null;
                s4 = [];
                rule$expects(peg$e34);
                if (peg$r4.test(input.charAt(peg$currPos))) {
                    s5 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else s5 = peg$FAILED;
                if (s5 !== peg$FAILED) while(s5 !== peg$FAILED){
                    s4.push(s5);
                    rule$expects(peg$e34);
                    if (peg$r4.test(input.charAt(peg$currPos))) {
                        s5 = input.charAt(peg$currPos);
                        peg$currPos++;
                    } else s5 = peg$FAILED;
                }
                else s4 = peg$FAILED;
                if (s4 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s0 = peg$f58(s2, s3, s4);
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        return s0;
    }
    function peg$parsestring_expression() {
        var s0, s1, s2, s3;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        rule$expects(peg$e36);
        if (input.substr(peg$currPos, 2) === peg$c32) {
            s1 = peg$c32;
            peg$currPos += 2;
        } else s1 = peg$FAILED;
        if (s1 !== peg$FAILED) {
            s2 = peg$parsetaglist();
            if (s2 === peg$FAILED) s2 = null;
            s3 = peg$parseprivate_data_section();
            if (s3 !== peg$FAILED) {
                peg$savedPos = s0;
                s0 = peg$f59(s2, s3);
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            rule$expects(peg$e37);
            if (input.charCodeAt(peg$currPos) === 36) {
                s1 = peg$c33;
                peg$currPos++;
            } else s1 = peg$FAILED;
            if (s1 !== peg$FAILED) {
                s2 = peg$parsetaglist();
                if (s2 === peg$FAILED) s2 = null;
                s3 = peg$parseprivate_data_section();
                if (s3 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s0 = peg$f60(s2, s3);
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        return s0;
    }
    function peg$parseerror_expression() {
        var s0, s1, s2, s3;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        rule$expects(peg$e38);
        if (input.charCodeAt(peg$currPos) === 63) {
            s1 = peg$c34;
            peg$currPos++;
        } else s1 = peg$FAILED;
        if (s1 !== peg$FAILED) {
            s2 = peg$parsetaglist();
            if (s2 === peg$FAILED) s2 = null;
            s3 = peg$parseprivate_data_section();
            if (s3 !== peg$FAILED) {
                peg$savedPos = s0;
                s0 = peg$f61(s2, s3);
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parsefloat_expression() {
        var s0, s1, s2, s3;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        rule$expects(peg$e39);
        if (input.substr(peg$currPos, 2) === peg$c35) {
            s1 = peg$c35;
            peg$currPos += 2;
        } else s1 = peg$FAILED;
        if (s1 !== peg$FAILED) {
            s2 = peg$parsetaglist();
            if (s2 === peg$FAILED) s2 = null;
            s3 = peg$parsefloat_digits();
            if (s3 !== peg$FAILED) {
                peg$savedPos = s0;
                s0 = peg$f62(s2, s3);
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            rule$expects(peg$e40);
            if (input.charCodeAt(peg$currPos) === 37) {
                s1 = peg$c36;
                peg$currPos++;
            } else s1 = peg$FAILED;
            if (s1 !== peg$FAILED) {
                s2 = peg$parsetaglist();
                if (s2 === peg$FAILED) s2 = null;
                s3 = peg$parsefloat_digits();
                if (s3 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s0 = peg$f63(s2, s3);
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        return s0;
    }
    function peg$parsefloat_digits() {
        var s0, s1, s2, s3, s4;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        s1 = peg$parseinteger_part();
        if (s1 !== peg$FAILED) {
            s2 = peg$currPos;
            rule$expects(peg$e41);
            if (input.charCodeAt(peg$currPos) === 46) {
                s3 = peg$c37;
                peg$currPos++;
            } else s3 = peg$FAILED;
            if (s3 !== peg$FAILED) {
                s4 = peg$parsedecimal_part();
                if (s4 !== peg$FAILED) {
                    peg$savedPos = s2;
                    s2 = peg$f64(s1, s4);
                } else {
                    peg$currPos = s2;
                    s2 = peg$FAILED;
                }
            } else {
                peg$currPos = s2;
                s2 = peg$FAILED;
            }
            if (s2 === peg$FAILED) s2 = null;
            peg$savedPos = s0;
            s0 = peg$f65(s1, s2);
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            rule$expects(peg$e41);
            if (input.charCodeAt(peg$currPos) === 46) {
                s1 = peg$c37;
                peg$currPos++;
            } else s1 = peg$FAILED;
            if (s1 !== peg$FAILED) {
                s2 = peg$parsedecimal_part();
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s0 = peg$f66(s2);
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        return s0;
    }
    function peg$parseinteger_part() {
        var s0, s1, s2, s3;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        s1 = [];
        rule$expects(peg$e34);
        if (peg$r4.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
        } else s2 = peg$FAILED;
        if (s2 !== peg$FAILED) while(s2 !== peg$FAILED){
            s1.push(s2);
            rule$expects(peg$e34);
            if (peg$r4.test(input.charAt(peg$currPos))) {
                s2 = input.charAt(peg$currPos);
                peg$currPos++;
            } else s2 = peg$FAILED;
        }
        else s1 = peg$FAILED;
        if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$f67(s1);
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            rule$expects(peg$e33);
            if (input.charCodeAt(peg$currPos) === 45) {
                s1 = peg$c30;
                peg$currPos++;
            } else s1 = peg$FAILED;
            if (s1 !== peg$FAILED) {
                s2 = [];
                rule$expects(peg$e34);
                if (peg$r4.test(input.charAt(peg$currPos))) {
                    s3 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else s3 = peg$FAILED;
                if (s3 !== peg$FAILED) while(s3 !== peg$FAILED){
                    s2.push(s3);
                    rule$expects(peg$e34);
                    if (peg$r4.test(input.charAt(peg$currPos))) {
                        s3 = input.charAt(peg$currPos);
                        peg$currPos++;
                    } else s3 = peg$FAILED;
                }
                else s2 = peg$FAILED;
                if (s2 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s0 = peg$f68(s2);
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        }
        return s0;
    }
    function peg$parsedecimal_part() {
        var s0, s1, s2;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        s1 = [];
        rule$expects(peg$e34);
        if (peg$r4.test(input.charAt(peg$currPos))) {
            s2 = input.charAt(peg$currPos);
            peg$currPos++;
        } else s2 = peg$FAILED;
        if (s2 !== peg$FAILED) while(s2 !== peg$FAILED){
            s1.push(s2);
            rule$expects(peg$e34);
            if (peg$r4.test(input.charAt(peg$currPos))) {
                s2 = input.charAt(peg$currPos);
                peg$currPos++;
            } else s2 = peg$FAILED;
        }
        else s1 = peg$FAILED;
        if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$f67(s1);
        }
        s0 = s1;
        return s0;
    }
    function peg$parsetaglist() {
        var s0, s1, s2, s3, s4;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        rule$expects(peg$e42);
        if (input.charCodeAt(peg$currPos) === 60) {
            s1 = peg$c38;
            peg$currPos++;
        } else s1 = peg$FAILED;
        if (s1 !== peg$FAILED) {
            s2 = [];
            s3 = peg$parsetagwithspace();
            while(s3 !== peg$FAILED){
                s2.push(s3);
                s3 = peg$parsetagwithspace();
            }
            s3 = peg$parse_();
            rule$expects(peg$e43);
            if (input.charCodeAt(peg$currPos) === 62) {
                s4 = peg$c39;
                peg$currPos++;
            } else s4 = peg$FAILED;
            if (s4 !== peg$FAILED) {
                peg$savedPos = s0;
                s0 = peg$f69(s2);
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parsetagwithspace() {
        var s0, s1, s2;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        s1 = peg$parse_();
        s2 = peg$parsetag();
        if (s2 !== peg$FAILED) {
            peg$savedPos = s0;
            s0 = peg$f70(s2);
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parsetag() {
        var s0, s1, s2, s3;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        rule$expects(peg$e44);
        if (input.charCodeAt(peg$currPos) === 96) {
            s1 = peg$c40;
            peg$currPos++;
        } else s1 = peg$FAILED;
        if (s1 !== peg$FAILED) {
            s2 = [];
            rule$expects(peg$e45);
            if (peg$r5.test(input.charAt(peg$currPos))) {
                s3 = input.charAt(peg$currPos);
                peg$currPos++;
            } else s3 = peg$FAILED;
            while(s3 !== peg$FAILED){
                s2.push(s3);
                rule$expects(peg$e45);
                if (peg$r5.test(input.charAt(peg$currPos))) {
                    s3 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else s3 = peg$FAILED;
            }
            rule$expects(peg$e44);
            if (input.charCodeAt(peg$currPos) === 96) {
                s3 = peg$c40;
                peg$currPos++;
            } else s3 = peg$FAILED;
            if (s3 !== peg$FAILED) {
                peg$savedPos = s0;
                s0 = peg$f71(s2);
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        return s0;
    }
    function peg$parseprivate_data_section() {
        var s0, s1, s2, s3;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        rule$expects(peg$e46);
        if (input.charCodeAt(peg$currPos) === 34) {
            s1 = peg$c41;
            peg$currPos++;
        } else s1 = peg$FAILED;
        if (s1 !== peg$FAILED) {
            s2 = [];
            rule$expects(peg$e47);
            if (peg$r6.test(input.charAt(peg$currPos))) {
                s3 = input.charAt(peg$currPos);
                peg$currPos++;
            } else s3 = peg$FAILED;
            while(s3 !== peg$FAILED){
                s2.push(s3);
                rule$expects(peg$e47);
                if (peg$r6.test(input.charAt(peg$currPos))) {
                    s3 = input.charAt(peg$currPos);
                    peg$currPos++;
                } else s3 = peg$FAILED;
            }
            rule$expects(peg$e46);
            if (input.charCodeAt(peg$currPos) === 34) {
                s3 = peg$c41;
                peg$currPos++;
            } else s3 = peg$FAILED;
            if (s3 !== peg$FAILED) {
                peg$savedPos = s0;
                s0 = peg$f72(s2);
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
        } else {
            peg$currPos = s0;
            s0 = peg$FAILED;
        }
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            rule$expects(peg$e48);
            if (input.charCodeAt(peg$currPos) === 123) {
                s1 = peg$c42;
                peg$currPos++;
            } else s1 = peg$FAILED;
            if (s1 !== peg$FAILED) {
                s2 = peg$parseescaped_private_data();
                rule$expects(peg$e49);
                if (input.charCodeAt(peg$currPos) === 125) {
                    s3 = peg$c43;
                    peg$currPos++;
                } else s3 = peg$FAILED;
                if (s3 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s0 = peg$f72(s2);
                } else {
                    peg$currPos = s0;
                    s0 = peg$FAILED;
                }
            } else {
                peg$currPos = s0;
                s0 = peg$FAILED;
            }
            if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                s1 = "";
                peg$savedPos = s0;
                s1 = peg$f73();
                s0 = s1;
            }
        }
        return s0;
    }
    function peg$parseescaped_private_data() {
        var s0, s1;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = [];
        s1 = peg$parseprivate_data_item();
        while(s1 !== peg$FAILED){
            s0.push(s1);
            s1 = peg$parseprivate_data_item();
        }
        return s0;
    }
    function peg$parseprivate_data_item() {
        var s0, s1;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = peg$currPos;
        rule$expects(peg$e50);
        if (peg$r7.test(input.charAt(peg$currPos))) {
            s1 = input.charAt(peg$currPos);
            peg$currPos++;
        } else s1 = peg$FAILED;
        if (s1 !== peg$FAILED) {
            peg$savedPos = s0;
            s1 = peg$f74(s1);
        }
        s0 = s1;
        if (s0 === peg$FAILED) {
            s0 = peg$currPos;
            rule$expects(peg$e51);
            if (input.substr(peg$currPos, 2) === peg$c44) {
                s1 = peg$c44;
                peg$currPos += 2;
            } else s1 = peg$FAILED;
            if (s1 !== peg$FAILED) {
                peg$savedPos = s0;
                s1 = peg$f75();
            }
            s0 = s1;
            if (s0 === peg$FAILED) {
                s0 = peg$currPos;
                rule$expects(peg$e52);
                if (input.substr(peg$currPos, 2) === peg$c45) {
                    s1 = peg$c45;
                    peg$currPos += 2;
                } else s1 = peg$FAILED;
                if (s1 !== peg$FAILED) {
                    peg$savedPos = s0;
                    s1 = peg$f76();
                }
                s0 = s1;
            }
        }
        return s0;
    }
    function peg$parse_() {
        var s0, s1;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        s0 = [];
        s1 = peg$parsews();
        while(s1 !== peg$FAILED){
            s0.push(s1);
            s1 = peg$parsews();
        }
        return s0;
    }
    function peg$parsews() {
        var s0;
        var rule$expects = function(expected) {
            if (peg$silentFails === 0) peg$expect(expected);
        };
        rule$expects(peg$e53);
        if (peg$r8.test(input.charAt(peg$currPos))) {
            s0 = input.charAt(peg$currPos);
            peg$currPos++;
        } else s0 = peg$FAILED;
        return s0;
    }
    const RIGHT_BRACE = String.fromCharCode(125);
    const BACKTICK = String.fromCharCode(96);
    peg$begin();
    peg$result = peg$startRuleFunction();
    if (peg$result !== peg$FAILED && peg$currPos === input.length) return peg$result;
    else {
        if (peg$result !== peg$FAILED && peg$currPos < input.length) peg$expect(peg$endExpectation());
        throw peg$buildError();
    }
}
exports.default = {
    SyntaxError: peg$SyntaxError,
    parse: peg$parse
};

},{"./parserfunctions.js":"12ANQ","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"12ANQ":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "makeBool", ()=>makeBool);
parcelHelpers.export(exports, "makeNil", ()=>makeNil);
parcelHelpers.export(exports, "makeFloat", ()=>makeFloat);
parcelHelpers.export(exports, "makeString", ()=>makeString);
parcelHelpers.export(exports, "makeInteger", ()=>makeInteger);
parcelHelpers.export(exports, "makeSymbol", ()=>makeSymbol);
parcelHelpers.export(exports, "makeCommandList", ()=>makeCommandList);
parcelHelpers.export(exports, "makeLambdaList", ()=>makeLambdaList);
parcelHelpers.export(exports, "makeOrgList", ()=>makeOrgList);
parcelHelpers.export(exports, "makeDeferredCommandList", ()=>makeDeferredCommandList);
parcelHelpers.export(exports, "makeInstanceList", ()=>makeInstanceList);
parcelHelpers.export(exports, "makeInstanceAtom", ()=>makeInstanceAtom);
parcelHelpers.export(exports, "makeInstantiatorList", ()=>makeInstantiatorList);
parcelHelpers.export(exports, "makeError", ()=>makeError);
var _utilsJs = require("./utils.js");
var _nexJs = require("./nex/nex.js");
var _boolJs = require("./nex/bool.js");
var _integerJs = require("./nex/integer.js");
var _esymbolJs = require("./nex/esymbol.js");
var _estringJs = require("./nex/estring.js");
var _floatJs = require("./nex/float.js");
var _nilJs = require("./nex/nil.js");
var _orgJs = require("./nex/org.js");
var _instantiatorJs = require("./nex/instantiator.js");
var _deferredcommandJs = require("./nex/deferredcommand.js");
var _lambdaJs = require("./nex/lambda.js");
var _commandJs = require("./nex/command.js");
var _wordJs = require("./nex/word.js");
var _wavetableJs = require("./nex/wavetable.js");
var _surfaceJs = require("./nex/surface.js");
var _lineJs = require("./nex/line.js");
var _docJs = require("./nex/doc.js");
var _eerrorJs = require("./nex/eerror.js");
var _letterJs = require("./nex/letter.js");
var _separatorJs = require("./nex/separator.js");
var _tagJs = require("./tag.js");
function concatParserString(arr) {
    if (arr == null) return "";
    return arr.join("");
}
function decorateNex(nex, tags, nonmutable) {
    if (!nonmutable) nex.setMutable(true);
    if (!tags) return nex;
    for(let i = 0; i < tags.length; i++){
        let fixedTag = concatParserString(tags[i]);
        nex.addTag((0, _eerrorJs.newTagOrThrowOOM)(fixedTag, "parsing saved data"));
    }
    return nex;
}
function appendChildrenToListType(listtype, children) {
    for(let i = 0; i < children.length; i++)listtype.appendChild(children[i]);
    return listtype;
}
function setPrivateData(obj, parserStr) {
    let str = concatParserString(parserStr);
    obj.deserializePrivateData(str);
    return obj;
}
function setVertHoriz(obj, vh) {
    if (vh == "v") obj.setVertical();
    else if (vh == "h") obj.setHorizontal();
    else if (vh == "z") obj.setZdirectional();
    else throw new Error("unknown verthoriz code");
}
function makeInteger(negation, digits, taglist, nonmutable) {
    let n = Number(concatParserString(digits));
    if (negation) n = -n;
    return decorateNex((0, _integerJs.constructInteger)(n), taglist, nonmutable);
}
function makeSymbol(letters, taglist, nonmutable) {
    return decorateNex((0, _esymbolJs.constructESymbol)(concatParserString(letters)), taglist, nonmutable);
}
function makeString(privateData, taglist, nonmutable) {
    let str = (0, _estringJs.constructEString)();
    setPrivateData(str, privateData);
    return decorateNex(str, taglist, nonmutable);
}
function makeError(privateData, taglist, nonmutable) {
    let err = (0, _eerrorJs.constructEError)();
    setPrivateData(err, privateData);
    return decorateNex(err, taglist, nonmutable);
}
function makeFloat(contents, taglist, nonmutable) {
    return decorateNex((0, _floatJs.constructFloat)(contents), taglist, nonmutable);
}
function makeBool(val, taglist, nonmutable) {
    return decorateNex((0, _boolJs.constructBool)(val), taglist, nonmutable);
}
function makeNil(taglist, nonmutable) {
    return decorateNex((0, _nilJs.constructNil)(), taglist, nonmutable);
}
function makeOrgList(children, privateData, taglist, verthoriz, nonmutable) {
    let t = (0, _orgJs.constructOrg)();
    appendChildrenToListType(t, children);
    setPrivateData(t, privateData);
    decorateNex(t, taglist, nonmutable);
    setVertHoriz(t, verthoriz);
    return t;
}
function makeDeferredCommandList(children, privateData, taglist, verthoriz, nonmutable) {
    let t = (0, _deferredcommandJs.constructDeferredCommand)();
    appendChildrenToListType(t, children);
    setPrivateData(t, privateData);
    decorateNex(t, taglist, nonmutable);
    setVertHoriz(t, verthoriz);
    return t;
}
function makeLambdaList(children, privateData, taglist, verthoriz, nonmutable) {
    let t = (0, _lambdaJs.constructLambda)();
    appendChildrenToListType(t, children);
    setPrivateData(t, privateData);
    decorateNex(t, taglist, nonmutable);
    setVertHoriz(t, verthoriz);
    return t;
}
function makeCommandList(name, children, privateData, taglist, verthoriz, nonmutable) {
    let cmdname = _utilsJs.convertV2StringToMath(concatParserString(name));
    let t = (0, _commandJs.constructCommand)(cmdname);
    appendChildrenToListType(t, children);
    setPrivateData(t, privateData);
    decorateNex(t, taglist, nonmutable);
    setVertHoriz(t, verthoriz);
    return t;
}
function makeInstantiatorList(children, privateData, taglist, verthoriz, nonmutable) {
    let t = (0, _instantiatorJs.constructInstantiator)("");
    appendChildrenToListType(t, children);
    setPrivateData(t, privateData);
    decorateNex(t, taglist, nonmutable);
    setVertHoriz(t, verthoriz);
    return t;
}
function makeInstanceAtom(instname, privatedata, taglist, nonmutable) {
    // currently only letter, separator, and newline supported
    let name = concatParserString(instname);
    let t = null;
    let isList = false;
    switch(name){
        case "newline":
            t = (0, _nilJs.constructNil)();
            break;
        case "nil":
            t = (0, _nilJs.constructNil)();
            break;
        case "wavetable":
            t = (0, _wavetableJs.constructWavetable)(0);
            break;
        case "surface":
            t = (0, _surfaceJs.constructSurface)(concatParserString(privatedata));
            break;
        case "letter":
            t = (0, _letterJs.constructLetter)(concatParserString(privatedata));
            break;
        case "separator":
            t = (0, _separatorJs.constructSeparator)(concatParserString(privatedata));
            break;
        default:
            throw new Error("unrecognized instance type: " + instname);
    }
    setPrivateData(t, privatedata);
    decorateNex(t, taglist, nonmutable);
    return t;
}
function makeInstanceList(instname, children, privatedata, taglist, verthoriz, nonmutable) {
    // currently only word, doc, and line supported
    let name = concatParserString(instname);
    let t = null;
    let isList = false;
    switch(name){
        case "word":
            t = (0, _wordJs.constructWord)();
            isList = true;
            break;
        case "line":
            t = (0, _lineJs.constructLine)();
            isList = true;
            break;
        case "doc":
            t = (0, _docJs.constructDoc)();
            isList = true;
            break;
        default:
            throw new Error("unrecognized list instance type: " + instname);
    }
    appendChildrenToListType(t, children);
    setPrivateData(t, privatedata);
    decorateNex(t, taglist, nonmutable);
    setVertHoriz(t, verthoriz);
    return t;
}

},{"./utils.js":"bIDtH","./nex/nex.js":"gNpCL","./nex/bool.js":"3MKly","./nex/integer.js":"cjEX0","./nex/esymbol.js":"cO7Ty","./nex/estring.js":"bL0nm","./nex/float.js":"f95Ws","./nex/nil.js":"amOKC","./nex/org.js":"28wYz","./nex/instantiator.js":"LvfQo","./nex/deferredcommand.js":"inpbA","./nex/lambda.js":"1mCM0","./nex/command.js":"6AUMZ","./nex/word.js":"a7zjn","./nex/wavetable.js":"6Cspq","./nex/surface.js":"iMboo","./nex/line.js":"bwNVL","./nex/doc.js":"fb3ea","./nex/eerror.js":"4Xsbj","./nex/letter.js":"keNY2","./nex/separator.js":"egKmR","./tag.js":"975jg","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"6yZi6":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "createIterationBuiltins", ()=>createIterationBuiltins);
var _utilsJs = require("../utils.js");
var _builtinJs = require("../nex/builtin.js");
var _eerrorJs = require("../nex/eerror.js");
var _commandJs = require("../nex/command.js");
var _nilJs = require("../nex/nil.js");
var _orgJs = require("../nex/org.js");
var _integerJs = require("../nex/integer.js");
var _environmentJs = require("../environment.js");
var _globalappflagsJs = require("../globalappflags.js");
var _syntheticrootJs = require("../syntheticroot.js");
var _systemstateJs = require("../systemstate.js");
function createIterationBuiltins() {
    // - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  
    (0, _builtinJs.Builtin).createBuiltin("filter", [
        "list()",
        "func&"
    ], function $filterWith(env, executionEnvironment) {
        let list = env.lb("list");
        let closure = env.lb("func");
        let resultList = list.makeCopy(true);
        let appendIterator = null;
        let i = 0;
        try {
            list.doForEachChild(function(item) {
                let result = (0, _syntheticrootJs.sEval)((0, _systemstateJs.systemState).getSCF().makeCommandWithClosureOneArg(closure, (0, _systemstateJs.systemState).getSCF().makeQuote(item)), executionEnvironment, `filter: error returned from item ${i + 1}`, true);
                if (!_utilsJs.isBool(result)) throw (0, _eerrorJs.constructFatalError)("filter-with: filter function must return boolean.");
                if (result.getTypedValue()) appendIterator = resultList.fastAppendChildAfter(list.getChildAt(i), appendIterator);
                i++;
            });
        } catch (e) {
            if (_utilsJs.isFatalError(e)) return e;
            else throw e;
        }
        return resultList;
    }, "Returns a new list containing only the elements of |list for which |func calls true when it is called on that element. Aliases: filter with");
    (0, _builtinJs.Builtin).aliasBuiltin("filter with", "filter");
    // - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -
    (0, _builtinJs.Builtin).createBuiltin("map", [
        "list()",
        "func&"
    ], function $mapWith(env, executionEnvironment) {
        let closure = env.lb("func");
        let list = env.lb("list");
        // until we congeal things down to a single list type
        // I'll try to honor the list type of the starting list
        let resultList = list.makeCopy(true);
        let appendIterator = null;
        let i = 0;
        try {
            list.doForEachChild(function(item) {
                let result = (0, _syntheticrootJs.sEval)((0, _systemstateJs.systemState).getSCF().makeCommandWithClosureOneArg(closure, (0, _systemstateJs.systemState).getSCF().makeQuote(item)), executionEnvironment, `map: error returned from item ${i + 1}`, true);
                appendIterator = resultList.fastAppendChildAfter(result, appendIterator);
                i++;
            });
        } catch (e) {
            if (_utilsJs.isFatalError(e)) return e;
            else throw e;
        }
        return resultList;
    }, "Goes through all the elements in |list and replaces each one with the result of calling |func on that element. Aliases: map with");
    (0, _builtinJs.Builtin).aliasBuiltin("map with", "map");
    // - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -
    (0, _builtinJs.Builtin).createBuiltin("reduce", [
        "list()",
        "func&",
        "startvalue"
    ], function $reduceWithGiven(env, executionEnvironment) {
        let list = env.lb("list");
        let closure = env.lb("func");
        let sn = env.lb("startvalue");
        let p = sn;
        let i = 0;
        try {
            list.doForEachChild(function(item) {
                p = (0, _syntheticrootJs.sEval)((0, _systemstateJs.systemState).getSCF().makeCommandWithClosureTwoArgs(closure, (0, _systemstateJs.systemState).getSCF().makeQuote(item), (0, _systemstateJs.systemState).getSCF().makeQuote(p)), executionEnvironment, `reduce: error returned from item ${i + 1}`, true);
                i++;
            });
        } catch (e) {
            if (_utilsJs.isFatalError(e)) return e;
            else throw e;
        }
        return p;
    }, "Progressively updates a value, starting with |startvalue, by calling |func on each element in |list, passing in 1. the list element and 2. the progressively updated value, returning the final updated value. Aliases: reduce with, reduce with starting");
    (0, _builtinJs.Builtin).aliasBuiltin("reduce with", "reduce");
    (0, _builtinJs.Builtin).aliasBuiltin("reduce with starting", "reduce");
    // - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  
    (0, _builtinJs.Builtin).createBuiltin("loop over", [
        "func&",
        "list()"
    ], function $loopOver(env, executionEnvironment) {
        let closure = env.lb("func");
        let list = env.lb("list");
        let result = null;
        let i = 0;
        try {
            list.doForEachChild(function(item) {
                result = (0, _syntheticrootJs.sEval)((0, _systemstateJs.systemState).getSCF().makeCommandWithClosureOneArg(closure, (0, _systemstateJs.systemState).getSCF().makeQuote(item)), executionEnvironment, `loop-over: error returned when processing input ${i + 1}`, true);
                i++;
            });
        } catch (e) {
            if (_utilsJs.isFatalError(e)) return e;
            else throw e;
        }
        return result ? result : (0, _nilJs.constructNil)();
    }, "Loops over a list, evaluating a function on each member, and returning the last result.");
    (0, _builtinJs.Builtin).createBuiltin("range", [
        "startorstop#",
        "stop#?",
        "inc#?"
    ], function $range(env, executionEnvironment) {
        let startorstop_n = env.lb("startorstop");
        let stop_n = env.lb("stop");
        let inc_n = env.lb("inc");
        let start = 0;
        let stop = 0;
        let inc = 1;
        if (stop_n == (0, _environmentJs.UNBOUND)) stop = startorstop_n.getTypedValue();
        else {
            start = startorstop_n.getTypedValue();
            stop = stop_n.getTypedValue();
            if (inc_n != (0, _environmentJs.UNBOUND)) inc = inc_n.getTypedValue();
        }
        if (inc == 0 || start < stop && inc < 0 || stop < start && inc > 0) return (0, _eerrorJs.constructFatalError)("range statement will not terminate.");
        let result = (0, _orgJs.constructOrg)();
        let appendIterator = null;
        for(let i = start; i != stop; i += inc){
            let thisnum = (0, _integerJs.constructInteger)(i);
            appendIterator = result.fastAppendChildAfter(thisnum, appendIterator);
        }
        return result;
    }, `Returns a list containing all the integers from 0 to n`);
    (0, _builtinJs.Builtin).createBuiltin("for-loop", [
        "start&",
        "test&",
        "body&",
        "inc&"
    ], function $forLoop(env, executionEnvironment) {
        let start = env.lb("start");
        let test = env.lb("test");
        let inc = env.lb("inc");
        let body = env.lb("body");
        // starting condition
        let iterationvalue = (0, _syntheticrootJs.sEval)((0, _systemstateJs.systemState).getSCF().makeCommandWithClosureZeroArgs(start), executionEnvironment, `for: error returned from initializer`);
        if (_utilsJs.isFatalError(iterationvalue)) return iterationvalue;
        let bodyresult = null;
        while(true){
            // check for continuation condition
            let testval = (0, _syntheticrootJs.sEval)((0, _systemstateJs.systemState).getSCF().makeCommandWithClosureOneArg(test, (0, _systemstateJs.systemState).getSCF().makeQuote(iterationvalue)), executionEnvironment, `for: error returned from test`);
            if (_utilsJs.isFatalError(testval)) return testval;
            if (!_utilsJs.isBool(testval)) return (0, _eerrorJs.constructFatalError)("for: test lambda must return a boolean");
            if (!testval.getTypedValue()) break;
            // execute body
            let bodycmd = (0, _syntheticrootJs.sEval)((0, _systemstateJs.systemState).getSCF().makeCommandWithClosureOneArg(body, (0, _systemstateJs.systemState).getSCF().makeQuote(iterationvalue)), executionEnvironment, `for: error returned from body`);
            if (_utilsJs.isFatalError(bodycmd)) return bodycmd;
            // increment
            let inccmd = (0, _syntheticrootJs.sEval)((0, _systemstateJs.systemState).getSCF().makeCommandWithClosureOneArg(inc, (0, _systemstateJs.systemState).getSCF().makeQuote(iterationvalue)), executionEnvironment, `for: error returned from incrementer`);
            if (_utilsJs.isFatalError(inccmd)) return inccmd;
            iterationvalue = inccmd;
        }
        return bodyresult ? bodyresult : (0, _nilJs.constructNil)();
    }, `Classic "for loop". First |start is evaluated, then |test. If |test returns true, |body and |inc are evaluated, and then we go back to |test. Alias: starting-with while do then-with.`);
    (0, _builtinJs.Builtin).aliasBuiltin("starting-with while do then-with", "for-loop");
}

},{"../utils.js":"bIDtH","../nex/builtin.js":"cOoeb","../nex/eerror.js":"4Xsbj","../nex/command.js":"6AUMZ","../nex/nil.js":"amOKC","../nex/org.js":"28wYz","../nex/integer.js":"cjEX0","../environment.js":"4mXDy","../globalappflags.js":"1FpbG","../syntheticroot.js":"rk2cG","../systemstate.js":"19Hkn","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"9o1NM":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "createLogicBuiltins", ()=>createLogicBuiltins);
var _utilsJs = require("../utils.js");
var _builtinJs = require("../nex/builtin.js");
var _nilJs = require("../nex/nil.js");
var _eerrorJs = require("../nex/eerror.js");
var _boolJs = require("../nex/bool.js");
var _evaluatorJs = require("../evaluator.js");
var _environmentJs = require("../environment.js");
var _syntheticrootJs = require("../syntheticroot.js");
function createLogicBuiltins() {
    // - - -  - - -  - - -  - - -  - - -  - - -  - - -  - - -  - - - 
    (0, _builtinJs.Builtin).createBuiltin("and", [
        "val1!",
        "val2!"
    ], function $and(env, executionEnvironment) {
        return (0, _boolJs.constructBool)(env.lb("val1").getTypedValue() && env.lb("val2").getTypedValue());
    }, "Returns true if both |val1 and |val2 evaluate to boolean true.", true);
    // - - -  - - -  - - -  - - -  - - -  - - -  - - -  - - -  - - - 
    (0, _builtinJs.Builtin).createBuiltin("first-non-nil", [
        "_nex..."
    ], function $firstNonNil(env, executionEnvironment) {
        let nex = env.lb("nex");
        for(let i = 0; i < nex.numChildren(); i++){
            let c = nex.getChildAt(i);
            let result = (0, _syntheticrootJs.sAttach)((0, _evaluatorJs.evaluateNexSafely)(c, executionEnvironment));
            if (result.getTypeName() != "-nil-") return result;
        }
        return (0, _nilJs.constructNil)();
    }, "Returns the first argument that does not evaluate to nil, ignoring the rest. Alias: case.");
    (0, _builtinJs.Builtin).aliasBuiltin("case", "first-non-nil");
    // - - -  - - -  - - -  - - -  - - -  - - -  - - -  - - -  - - - 
    (0, _builtinJs.Builtin).createBuiltin("if then else", [
        "cond!",
        "_iftrue",
        "_iffalse?"
    ], function $if(env, executionEnvironment) {
        let b = env.lb("cond").getTypedValue();
        let iftrue = env.lb("iftrue");
        let iffalse = env.lb("iffalse");
        if (iffalse == (0, _environmentJs.UNBOUND)) iffalse = (0, _nilJs.constructNil)();
        if (b) {
            let iftrueresult = (0, _evaluatorJs.evaluateNexSafely)(iftrue, executionEnvironment);
            if (_utilsJs.isFatalError(iftrueresult)) return (0, _evaluatorJs.wrapError)("&szlig;", "if then else: error in argument 2", iftrueresult);
            return iftrueresult;
        } else {
            let iffalseresult = (0, _evaluatorJs.evaluateNexSafely)(iffalse, executionEnvironment);
            if (_utilsJs.isFatalError(iffalseresult)) return (0, _evaluatorJs.wrapError)("&szlig;", "if then else: error in argument 3", iffalseresult);
            return iffalseresult;
        }
    }, "Evalutes |cond, and if it is true, return |iftrue, otherwise return |iffalse. If |iffalse is not provided, a Nil is returned if |cond is false. Alias: if.");
    (0, _builtinJs.Builtin).aliasBuiltin("if", "if then else");
    (0, _builtinJs.Builtin).createBuiltin("not", [
        "val!"
    ], function $not(env, executionEnvironment) {
        return (0, _boolJs.constructBool)(!env.lb("val").getTypedValue());
    }, "Evalutes to true if |val evaluates to false, or false if |val evaluates to true.");
    (0, _builtinJs.Builtin).createBuiltin("or", [
        "val1!",
        "val2!"
    ], function $or(env, executionEnvironment) {
        return (0, _boolJs.constructBool)(env.lb("val1").getTypedValue() || env.lb("val2").getTypedValue());
    }, "Evaluates to true if either or both of |val1 or |val2 evaluate to true.", true);
}

},{"../utils.js":"bIDtH","../nex/builtin.js":"cOoeb","../nex/nil.js":"amOKC","../nex/eerror.js":"4Xsbj","../nex/bool.js":"3MKly","../evaluator.js":"1TNlN","../environment.js":"4mXDy","../syntheticroot.js":"rk2cG","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"gh2RN":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "createMakeBuiltins", ()=>createMakeBuiltins);
var _builtinJs = require("../nex/builtin.js");
var _wordJs = require("../nex/word.js");
var _nilJs = require("../nex/nil.js");
var _eerrorJs = require("../nex/eerror.js");
var _docJs = require("../nex/doc.js");
var _lineJs = require("../nex/line.js");
var _commandJs = require("../nex/command.js");
var _deferredcommandJs = require("../nex/deferredcommand.js");
var _lambdaJs = require("../nex/lambda.js");
var _orgJs = require("../nex/org.js");
function createMakeBuiltins() {
    (0, _builtinJs.Builtin).createBuiltin("make-wavetable", [], function $makeWavetable(env, executionEnvironment) {
        let args = env.lb("nex");
        let r = constructWavetable();
        return r;
    }, "Creates a new wavetable.");
    (0, _builtinJs.Builtin).createBuiltin("make-nil", [], function $makeNil(env, executionEnvironment) {
        return (0, _nilJs.constructNil)();
    }, "Creates a nil object.");
    (0, _builtinJs.Builtin).createBuiltin("make-command", [
        "nex..."
    ], function $makeCommand(env, executionEnvironment) {
        let args = env.lb("nex");
        let cmd = null;
        for(let i = 0; i < args.numChildren(); i++){
            let arg = args.getChildAt(i);
            // first one could be name of command
            if (i == 0 && arg.getTypeName() == "-symbol-") cmd = (0, _commandJs.constructCommand)(arg.getTypedValue());
            else {
                if (!cmd) cmd = (0, _commandJs.constructCommand)();
                cmd.appendChild(arg);
            }
        }
        if (!cmd) cmd = (0, _commandJs.constructCommand)();
        return cmd;
    }, "Creates a new command containing the args as children.");
    (0, _builtinJs.Builtin).createBuiltin("make-doc", [
        "nex..."
    ], function $makeDoc(env, executionEnvironment) {
        let args = env.lb("nex");
        let r = (0, _docJs.constructDoc)();
        for(let i = 0; i < args.numChildren(); i++)r.appendChild(args.getChildAt(i));
        return r;
    }, "Creates a new doc containing the args as children.");
    (0, _builtinJs.Builtin).createBuiltin("make-deferred-command", [
        "args..."
    ], function $makeDeferredCommand(env, executionEnvironment) {
        let args = env.lb("args");
        let r = (0, _deferredcommandJs.constructDeferredCommand)();
        for(let i = 0; i < args.numChildren(); i++){
            let c = children.getChildAt(i);
            r.appendChild(c);
        }
        return r;
    }, "Creates a new deferred command containing |args as children.");
    (0, _builtinJs.Builtin).createBuiltin("make-lambda", [
        "nex..."
    ], function $makeLambda(env, executionEnvironment) {
        let exps = env.lb("nex");
        let r = (0, _lambdaJs.constructLambda)();
        for(let i = 0; i < exps.numChildren(); i++){
            let c = exps.getChildAt(i);
            r.appendChild(c);
        }
        return r;
    }, "Creates a new lambda containing the args as children.");
    (0, _builtinJs.Builtin).createBuiltin("make-line", [
        "nex..."
    ], function $makeLine(env, executionEnvironment) {
        let args = env.lb("nex");
        let r = (0, _lineJs.constructLine)();
        for(let i = 0; i < args.numChildren(); i++)r.appendChild(args.getChildAt(i));
        return r;
    }, "Creates a new line containing the args as children.");
    (0, _builtinJs.Builtin).createBuiltin("make-word", [
        "nex..."
    ], function $makeWord(env, executionEnvironment) {
        let args = env.lb("nex");
        let r = (0, _wordJs.constructWord)();
        for(let i = 0; i < args.numChildren(); i++)r.appendChild(args.getChildAt(i));
        return r;
    }, "Creates a new word containing the args as children.");
    (0, _builtinJs.Builtin).createBuiltin("make-org", [
        "nex..."
    ], function $makeOrg(env, executionEnvironment) {
        let args = env.lb("nex");
        let r = (0, _orgJs.constructOrg)();
        for(let i = 0; i < args.numChildren(); i++)r.appendChild(args.getChildAt(i));
        return r;
    }, "Creates a new org containing the args as children.");
    (0, _builtinJs.Builtin).createBuiltin("make-error", [
        "str$"
    ], function $makeError(env, executionEnvironment) {
        let str = env.lb("str");
        let r = (0, _eerrorJs.constructEError)(str.getFullTypedValue());
        r.setErrorType((0, _eerrorJs.ERROR_TYPE_FATAL));
        r.suppressNextCatch();
        return r;
    }, "Creates a new (fatal) error with |str as the description.");
    (0, _builtinJs.Builtin).createBuiltin("make-warning", [
        "str$"
    ], function $makeWarning(env, executionEnvironment) {
        let str = env.lb("str");
        let r = (0, _eerrorJs.constructEError)(str.getFullTypedValue());
        r.setErrorType((0, _eerrorJs.ERROR_TYPE_WARN));
        return r;
    }, "Creates a new warning (an error with type WARN) with |str as the description.");
    (0, _builtinJs.Builtin).createBuiltin("make-info", [
        "str$"
    ], function $makeInfo(env, executionEnvironment) {
        let str = env.lb("str");
        let r = (0, _eerrorJs.constructEError)(str.getFullTypedValue());
        r.setErrorType((0, _eerrorJs.ERROR_TYPE_INFO));
        return r;
    }, "Creates a new info (an error with type INFO) with |str as the description.");
}

},{"../nex/builtin.js":"cOoeb","../nex/word.js":"a7zjn","../nex/nil.js":"amOKC","../nex/eerror.js":"4Xsbj","../nex/doc.js":"fb3ea","../nex/line.js":"bwNVL","../nex/command.js":"6AUMZ","../nex/deferredcommand.js":"inpbA","../nex/lambda.js":"1mCM0","../nex/org.js":"28wYz","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"gvWEw":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "createMathBuiltins", ()=>createMathBuiltins);
var _utilsJs = require("../utils.js");
var _builtinJs = require("../nex/builtin.js");
var _eerrorJs = require("../nex/eerror.js");
var _floatJs = require("../nex/float.js");
var _integerJs = require("../nex/integer.js");
var _boolJs = require("../nex/bool.js");
var _environmentJs = require("../environment.js");
function createMathBuiltins() {
    // minuend - subtrahend
    (0, _builtinJs.Builtin).createBuiltin(/* minus */ "-", [
        "min#%",
        "sub#%?"
    ], function $minus(env, executionEnvironment) {
        let a = env.lb("min");
        let b = env.lb("sub");
        if (b == (0, _environmentJs.UNBOUND)) {
            let n = -a.getTypedValue();
            if (_utilsJs.isFloat(a)) return (0, _floatJs.constructFloat)(n);
            else return (0, _integerJs.constructInteger)(n);
        } else {
            let result = a.getTypedValue() - b.getTypedValue();
            if (_utilsJs.isFloat(a) || _utilsJs.isFloat(b)) return (0, _floatJs.constructFloat)(result);
            else return (0, _integerJs.constructInteger)(result);
        }
    }, "Subtracts |sub from |min and returns the result.", true);
    (0, _builtinJs.Builtin).createBuiltin(/* not-equal */ "<>", [
        "lhs#%",
        "rhs#%"
    ], function $notEqual(env, executionEnvironment) {
        let a = env.lb("lhs").getTypedValue();
        let b = env.lb("rhs").getTypedValue();
        let r = a != b;
        return (0, _boolJs.constructBool)(r);
    }, "Returns true if |lhs evaluates to a number that is not equal to |rhs.", true);
    // - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  
    function $plus(env, executionEnvironment) {
        let total = 0;
        let foundFloat = false;
        let ar = env.lb("add");
        for(let i = 0; i < ar.numChildren(); i++){
            let arg = ar.getChildAt(i);
            if (_utilsJs.isFloat(arg)) foundFloat = true;
            total += arg.getTypedValue();
        }
        let r = foundFloat ? (0, _floatJs.constructFloat)(total) : (0, _integerJs.constructInteger)(total);
        return r;
    }
    (0, _builtinJs.Builtin).createBuiltin(/* plus */ "+", [
        "add#%..."
    ], $plus, "Adds the arguments and returns the result.", true);
    // - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  
    function $greaterThan(env, executionEnvironment) {
        let a = env.lb("lhs").getTypedValue();
        let b = env.lb("rhs").getTypedValue();
        let r = a > b;
        return (0, _boolJs.constructBool)(r);
    }
    (0, _builtinJs.Builtin).createBuiltin(/* greater-than */ ">", [
        "lhs#%",
        "rhs#%"
    ], $greaterThan, "Returns true if |lhs evaluates to a number that is strictly greater than |rhs.", true);
    // - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  
    function $greaterThanOrEqualTo(env, executionEnvironment) {
        let a = env.lb("lhs").getTypedValue();
        let b = env.lb("rhs").getTypedValue();
        let r = a >= b;
        return (0, _boolJs.constructBool)(r);
    }
    (0, _builtinJs.Builtin).createBuiltin(/* greater-than-or-equal-to */ ">=", [
        "lhs#%",
        "rhs#%"
    ], $greaterThanOrEqualTo, "Returns true if |lhs evaluates to a number that is greater than or equal to |rhs.", true);
    // - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  
    function $lessThan(env, executionEnvironment) {
        let a = env.lb("lhs").getTypedValue();
        let b = env.lb("rhs").getTypedValue();
        let r = a < b;
        return (0, _boolJs.constructBool)(r);
    }
    (0, _builtinJs.Builtin).createBuiltin(/* less-than */ "<", [
        "lhs#%",
        "rhs#%"
    ], $lessThan, "Returns true if |lhs evaluates to a number that is strictly less than |rhs.", true);
    // - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  
    function $lessThanOrEqualTo(env, executionEnvironment) {
        let a = env.lb("lhs").getTypedValue();
        let b = env.lb("rhs").getTypedValue();
        let r = a <= b;
        return (0, _boolJs.constructBool)(r);
    }
    (0, _builtinJs.Builtin).createBuiltin(/* less-than-or-equal-to */ "<=", [
        "lhs#%",
        "rhs#%"
    ], $lessThanOrEqualTo, "Returns true if |lhs evaluates to a number that is less than or equal to |rhs.", true);
    // - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  
    function $dividedBy(env, executionEnvironment) {
        let a = env.lb("divid");
        let b = env.lb("divis");
        if (b.getTypedValue() == 0) return (0, _eerrorJs.constructFatalError)("divide: cannot divide by zero, Sorry!");
        let result = a.getTypedValue() / b.getTypedValue();
        if (_utilsJs.isFloat(a) || _utilsJs.isFloat(b)) return (0, _floatJs.constructFloat)(result);
        else return (0, _integerJs.constructInteger)(result);
    }
    (0, _builtinJs.Builtin).createBuiltin(/* divided-by */ "/", [
        "divid#%",
        "divis#%"
    ], $dividedBy, "Divides |divid by |divis and returns the result.", true);
    // - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  
    function $equals(env, executionEnvironment) {
        let a = env.lb("lhs").getTypedValue();
        let b = env.lb("rhs").getTypedValue();
        let r = a == b;
        return (0, _boolJs.constructBool)(r);
    }
    (0, _builtinJs.Builtin).createBuiltin(/* equals */ "=", [
        "lhs#%",
        "rhs#%"
    ], $equals, "Returns true if |lhs and |rhs evaluates to numbers that are equal.", true);
    // - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  
    function $times(env, executionEnvironment) {
        let result = 1;
        let foundFloat = false;
        let ar = env.lb("fact");
        for(let i = 0; i < ar.numChildren(); i++){
            let arg = ar.getChildAt(i);
            if (_utilsJs.isFloat(arg)) foundFloat = true;
            result *= arg.getTypedValue();
        }
        let r = foundFloat ? (0, _floatJs.constructFloat)(result) : (0, _integerJs.constructInteger)(result);
        return r;
    }
    (0, _builtinJs.Builtin).createBuiltin(/* times */ "*", [
        "fact#%..."
    ], $times, "Multiplies the args and returns the result.", true);
    // - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  
    function $getPi(env, executionEnvironment) {
        return (0, _floatJs.constructFloat)(Math.PI);
    }
    (0, _builtinJs.Builtin).createBuiltin("get-pi", [], $getPi, "Returns pi.");
    // - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  
    function $getE(env, executionEnvironment) {
        return (0, _floatJs.constructFloat)(Math.E);
    }
    (0, _builtinJs.Builtin).createBuiltin("get-e", [], $getE, "Returns e.");
    // - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  
    function $acos(env, executionEnvironment) {
        let a = env.lb("arg").getTypedValue();
        let b = Math.acos(a);
        return (0, _floatJs.constructFloat)(b);
    }
    (0, _builtinJs.Builtin).createBuiltin("acos", [
        "arg%"
    ], $acos, "Computes the inverse cosine of |arg (the angle whose cosine is |arg)");
    // - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  
    function $asin(env, executionEnvironment) {
        let a = env.lb("arg").getTypedValue();
        let b = Math.asin(a);
        return (0, _floatJs.constructFloat)(b);
    }
    (0, _builtinJs.Builtin).createBuiltin("asin", [
        "arg%"
    ], $asin, "Computes the inverse sine of |arg (the angle whose sine is |arg)");
    // - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  
    function $atan(env, executionEnvironment) {
        let a = env.lb("arg").getTypedValue();
        let b = Math.atan(a);
        return (0, _floatJs.constructFloat)(b);
    }
    (0, _builtinJs.Builtin).createBuiltin("atan", [
        "arg%"
    ], $atan, "Computes the inverse tangent of |arg (the angle whose tangent is |arg)");
    // - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  
    function $atan2(env, executionEnvironment) {
        let y = env.lb("y").getTypedValue();
        let x = env.lb("x").getTypedValue();
        return (0, _floatJs.constructFloat)(Math.atan2(y, x));
    }
    (0, _builtinJs.Builtin).createBuiltin("atan2", [
        "y%",
        "x%"
    ], $atan2, "Computes the angle between the x axis and the line to (x, y), in the range from +pi and -pi.");
    // - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  
    function $ceiling(env, executionEnvironment) {
        let a = env.lb("arg").getTypedValue();
        a = Math.ceil(a);
        return (0, _floatJs.constructFloat)(a);
    }
    (0, _builtinJs.Builtin).createBuiltin("ceiling", [
        "arg%"
    ], $ceiling, "Returns the integer ceiling of |arg.");
    // - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  
    function $cos(env, executionEnvironment) {
        let a = env.lb("arg").getTypedValue();
        let b = Math.cos(a);
        return (0, _floatJs.constructFloat)(b);
    }
    (0, _builtinJs.Builtin).createBuiltin("cos", [
        "arg%"
    ], $cos, "Returns the cosine of |arg (adjacent/hypotenuse)");
    // - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  - -  
    function $exp(env, executionEnvironment) {
        let a = env.lb("a").getTypedValue();
        return (0, _floatJs.constructFloat)(Math.exp(a));
    }
    (0, _builtinJs.Builtin).createBuiltin("exp", [
        "a%"
    ], $exp, "Computes the exponential function of |a (e to the |a).");
    (0, _builtinJs.Builtin).createBuiltin("floor", [
        "arg%"
    ], function $floor(env, executionEnvironment) {
        let a = env.lb("arg").getTypedValue();
        a = Math.floor(a);
        return (0, _floatJs.constructFloat)(a);
    }, "Computes the integer floor of |arg.");
    // log base e, helps to differentiate
    // from methods that log things
    (0, _builtinJs.Builtin).createBuiltin("log-e", [
        "a%"
    ], function $logE(env, executionEnvironment) {
        let a = env.lb("a").getTypedValue();
        return (0, _floatJs.constructFloat)(Math.log(a));
    }, "Computes the log base e of |a.");
    (0, _builtinJs.Builtin).createBuiltin("log-10", [
        "a%"
    ], function $logTen(env, executionEnvironment) {
        let a = env.lb("a").getTypedValue();
        return (0, _floatJs.constructFloat)(Math.log10(a));
    }, "Computes the log base 10 of |a.");
    (0, _builtinJs.Builtin).createBuiltin("log-2", [
        "a%"
    ], function $logTwo(env, executionEnvironment) {
        let a = env.lb("a").getTypedValue();
        return (0, _floatJs.constructFloat)(Math.log2(a));
    }, "Computes the log base 2 of |a.");
    (0, _builtinJs.Builtin).createBuiltin("modulo", [
        "divid#",
        "modulus#"
    ], function $modulo(env, executionEnvironment) {
        let a = env.lb("divid");
        let b = env.lb("modulus");
        let result = a.getTypedValue() % b.getTypedValue();
        return (0, _integerJs.constructInteger)(result);
    }, "Computes |divid modulo |modulus and returns the result.", true);
    (0, _builtinJs.Builtin).createBuiltin("nth-root", [
        "a%",
        "b%"
    ], function $nthRoot(env, executionEnvironment) {
        let a = env.lb("a").getTypedValue();
        let b = env.lb("b").getTypedValue();
        return (0, _floatJs.constructFloat)(Math.pow(a, 1.0 / b));
    }, "Computes the |bth root of |a.");
    (0, _builtinJs.Builtin).createBuiltin("power", [
        "a%",
        "b%"
    ], function $power(env, executionEnvironment) {
        let a = env.lb("a").getTypedValue();
        let b = env.lb("b").getTypedValue();
        return (0, _floatJs.constructFloat)(Math.pow(a, b));
    }, "Computes |a to the |b power and returns the result.", true);
    (0, _builtinJs.Builtin).createBuiltin("random", [], function $random(env, executionEnvironment) {
        let n = Math.random();
        return (0, _floatJs.constructFloat)(n);
    }, "Returns a random number between 0 and 1.");
    (0, _builtinJs.Builtin).createBuiltin("round", [
        "arg%"
    ], function $round(env, executionEnvironment) {
        let a = env.lb("arg").getTypedValue();
        a = Math.round(a);
        return (0, _floatJs.constructFloat)(a);
    }, "Return |arg rounded to the nearest integer.");
    (0, _builtinJs.Builtin).createBuiltin("sin", [
        "arg%"
    ], function $sin(env, executionEnvironment) {
        let a = env.lb("arg").getTypedValue();
        let b = Math.sin(a);
        return (0, _floatJs.constructFloat)(b);
    }, "Computes the sin (opposite/hypotenuse) of |arg.");
    (0, _builtinJs.Builtin).createBuiltin("square-root", [
        "a%"
    ], function $squareRoot(env, executionEnvironment) {
        let a = env.lb("a").getTypedValue();
        return (0, _floatJs.constructFloat)(Math.sqrt(a));
    }, "Computes the square root of |a.");
    (0, _builtinJs.Builtin).createBuiltin("tan", [
        "arg%"
    ], function $tan(env, executionEnvironment) {
        let a = env.lb("arg").getTypedValue();
        let b = Math.tan(a);
        return (0, _floatJs.constructFloat)(b);
    }, "Computes the tangent (opposite/adjacent) of |arg.");
}

},{"../utils.js":"bIDtH","../nex/builtin.js":"cOoeb","../nex/eerror.js":"4Xsbj","../nex/float.js":"f95Ws","../nex/integer.js":"cjEX0","../nex/bool.js":"3MKly","../environment.js":"4mXDy","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"aKLAp":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "createStringBuiltins", ()=>createStringBuiltins);
var _builtinJs = require("../nex/builtin.js");
var _eerrorJs = require("../nex/eerror.js");
var _wordJs = require("../nex/word.js");
var _boolJs = require("../nex/bool.js");
var _estringJs = require("../nex/estring.js");
var _integerJs = require("../nex/integer.js");
function createStringBuiltins() {
    (0, _builtinJs.Builtin).createBuiltin("string-concatenate", [
        "str$..."
    ], function $stringCat(env, executionEnvironment) {
        let r = "";
        let ar = env.lb("str");
        for(let i = 0; i < ar.numChildren(); i++){
            let s = ar.getChildAt(i).getFullTypedValue();
            r += s;
        }
        return (0, _estringJs.constructEString)(r);
    }, "Concatenates the passed-in strings and returns the result.");
    // this alias makes tests pass
    (0, _builtinJs.Builtin).aliasBuiltin("string-cat", "string-concatenate");
    (0, _builtinJs.Builtin).createBuiltin("string-char at", [
        "str$",
        "pos#"
    ], function $stringCharAt(env, executionEnvironment) {
        let s = env.lb("str").getFullTypedValue();
        let n = env.lb("pos").getTypedValue();
        if (n < 0 || n >= s.length) return (0, _eerrorJs.constructFatalError)(`string-char-at: index ${n} is out of bounds of string "${s}" (must be between 0 and ${s.length - 1} inclusive). Sorry!`);
        let c = s.charAt(n);
        return (0, _estringJs.constructEString)(c);
    }, "Returns the character in |str at index position |pos.");
    (0, _builtinJs.Builtin).createBuiltin("string-index of", [
        "str$",
        "tofind$"
    ], function $stringIndexOf(env, executionEnvironment) {
        let s = env.lb("str").getFullTypedValue();
        let tofind = env.lb("tofind").getFullTypedValue();
        let i = s.indexOf(tofind);
        return (0, _integerJs.constructInteger)(i);
    }, "Returns the index position of |tofind in |str.");
    (0, _builtinJs.Builtin).createBuiltin("string-join on", [
        "strs()",
        "on$"
    ], function $stringJoinOn(env, executionEnvironment) {
        let lst = env.lb("strs");
        let on = env.lb("on").getFullTypedValue();
        let r = "";
        for(let i = 0; i < lst.numChildren(); i++)r = `${r}${i > 0 ? on : ""}${lst.getChildAt(i).getFullTypedValue()}`;
        return (0, _estringJs.constructEString)(r);
    }, "Joins the string elements of |strs into a single string on the separator |on.");
    (0, _builtinJs.Builtin).createBuiltin("string-length", [
        "str$"
    ], function $stringLength(env, executionEnvironment) {
        let s = env.lb("str").getFullTypedValue();
        let len = s.length;
        return (0, _integerJs.constructInteger)(len);
    }, "Returns the length of (number of characters in) |str");
    (0, _builtinJs.Builtin).createBuiltin("string-listify", [
        "str$"
    ], function $stringListify(env, executionEnvironment) {
        let r = (0, _wordJs.constructWord)();
        let s = env.lb("str").getFullTypedValue();
        for(let i = 0; i < s.length; i++){
            let c = s.charAt(i);
            let cc = (0, _estringJs.constructEString)(c);
            r.appendChild(cc);
        }
        return r;
    }, "Turns a string into a list of strings of one-letter each, one for each letter in |str.");
    (0, _builtinJs.Builtin).createBuiltin("string-split on", [
        "str$",
        "on$"
    ], function $stringSplitOn(env, executionEnvironment) {
        let str = env.lb("str").getFullTypedValue();
        let on = env.lb("on").getFullTypedValue();
        let lst = (0, _wordJs.constructWord)();
        let a = str.split(on);
        for(let i = 0; i < a.length; i++){
            let strnex = (0, _estringJs.constructEString)(a[i]);
            lst.appendChild(strnex);
        }
        return lst;
    }, "Splits |str into separate strings on the separator |on.");
    (0, _builtinJs.Builtin).createBuiltin("string-substring", [
        "str$",
        "start#",
        "len#"
    ], function $stringSubstring(env, executionEnvironment) {
        let str = env.lb("str").getFullTypedValue();
        let start = env.lb("start").getTypedValue();
        let len = env.lb("len").getTypedValue();
        let s = str.substr(start, len);
        return (0, _estringJs.constructEString)(s);
    }, "Retrieves a substring of |str starting at |start that is |len characters long");
    (0, _builtinJs.Builtin).createBuiltin("string-is-empty", [
        "str$"
    ], function $isEmptyString(env, executionEnvironment) {
        let str = env.lb("str").getFullTypedValue();
        return (0, _boolJs.constructBool)(str == "");
    }, "Returns true if |str is the empty string.");
}

},{"../nex/builtin.js":"cOoeb","../nex/eerror.js":"4Xsbj","../nex/word.js":"a7zjn","../nex/bool.js":"3MKly","../nex/estring.js":"bL0nm","../nex/integer.js":"cjEX0","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"axJ7n":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "createSyscalls", ()=>createSyscalls);
var _utilsJs = require("../utils.js");
var _builtinJs = require("../nex/builtin.js");
var _estringJs = require("../nex/estring.js");
var _eerrorJs = require("../nex/eerror.js");
var _floatJs = require("../nex/float.js");
var _integerJs = require("../nex/integer.js");
var _nilJs = require("../nex/nil.js");
var _orgJs = require("../nex/org.js");
var _rendernodeJs = require("../rendernode.js");
var _systemstateJs = require("../systemstate.js");
var _rootmanagerJs = require("../rootmanager.js");
var _globalappflagsJs = require("../globalappflags.js");
var _environmentJs = require("../environment.js");
var _webfontsJs = require("../webfonts.js");
var _globalconstantsJs = require("../globalconstants.js");
/**
 * Creates all syscall builtins.
 */ function createSyscalls() {
    (0, _builtinJs.Builtin).createBuiltin("get-settings", [], function $getSettings(env, executionEnvironment) {
        let settings = (0, _globalappflagsJs.getSettings)();
        let org = (0, _orgJs.convertJSMapToOrg)(settings);
        return org;
    }, "Gets an org containing all Vodka global settings.");
    (0, _builtinJs.Builtin).createBuiltin("set-settings-value", [
        "val"
    ], function $setSettingsValue(env, executionEnvironment) {
        let val = env.lb("val");
        if (val.numTags() != 1) return (0, _eerrorJs.constructFatalError)("set-settings-value: setting value must have a single tag indicating the setting to change.");
        let tagval = val.getTag(0).getTagString();
        if (!(0, _globalappflagsJs.hasSettingName)(tagval)) return (0, _eerrorJs.constructFatalError)(`set-settings-value: unknown setting ${tagval}.`);
        if (_utilsJs.isFloat(val) || _utilsJs.isInteger(val)) {
            let n = Number(val.getTypedValue());
            (0, _globalappflagsJs.setSettingValue)(tagval, n);
        } else (0, _globalappflagsJs.setSettingValue)(tagval, "" + val.getTypedValue());
        let settings = (0, _globalappflagsJs.getSettings)();
        let org = (0, _orgJs.convertJSMapToOrg)(settings);
        return org;
    }, "Changes the value of a setting.");
    (0, _builtinJs.Builtin).createBuiltin("get-active-experiment-flags", [], function $getActiveExperimentFlags(env, executionEnvironment) {
        let s = (0, _globalappflagsJs.getExperimentsAsString)();
        return (0, _estringJs.constructEString)(s);
    }, "Gets a snippet of code that represents the active experiment flags that should be saved with new tests (for internal use).");
    (0, _builtinJs.Builtin).createBuiltin("load-web-font", [
        "fontname$"
    ], function $loadWebFont(env, executionEnvironment) {
        let n = env.lb("fontname");
        let name = n.getFullTypedValue();
        (0, _webfontsJs.webFontManager).loadFont(name);
        return (0, _nilJs.constructNil)();
    }, "Loads a Google web font with the passed-in name (see fonts.google.com for options)");
    (0, _builtinJs.Builtin).createBuiltin("disconnect-funnel", [], function $disconnectFunnel(env, executionEnvironment) {
        (0, _systemstateJs.systemState).setKeyFunnelActive(false);
        (0, _systemstateJs.systemState).setMouseFunnelActive(false);
        return (0, _nilJs.constructNil)();
    }, "Disconnects the event funnel (used to disable IDE features).");
    (0, _builtinJs.Builtin).createBuiltin("get-time", [], function $getTime(env, executionEnvironment) {
        let t = window.performance.now();
        return (0, _floatJs.constructFloat)(t);
    }, "Get the date and time.");
    (0, _builtinJs.Builtin).createBuiltin("force-draw", [
        "nex"
    ], function $forceDraw(env, executionEnvironment) {
        let n = env.lb("nex");
        n.renderOnlyThisNex();
        return n;
    }, "Force |nex to be rerendered (redrawn on the screen).");
    (0, _builtinJs.Builtin).createBuiltin("apply-css-style to", [
        "style$",
        "nex"
    ], function $applyCssStyleTo(env, executionEnvironment) {
        let s = env.lb("style").getFullTypedValue();
        let n = env.lb("nex");
        n.setCurrentStyle(s);
        return n;
    }, "Apply the css style |style to |nex, overwriting whatever styling it already has.");
    (0, _builtinJs.Builtin).createBuiltin("apply-pfont to", [
        "pfont$",
        "nex"
    ], function $applyPfontTo(env, executionEnvironment) {
        let pf = env.lb("pfont").getFullTypedValue();
        let n = env.lb("nex");
        n.setPfont(pf);
        return n;
    }, "Applies a parametric font style called |pfont to |nex.");
    // this is basically just for testing foreign function interface
    (0, _builtinJs.Builtin).createBuiltin("get-css-style-from", [
        "nex"
    ], function $getStyleFrom(env, executionEnvironment) {
        let n = env.lb("nex");
        let s = n.getCurrentStyle();
        return (0, _estringJs.constructEString)(s);
    }, "Return whatever css style overrides |nex currently has.");
    (0, _builtinJs.Builtin).aliasBuiltin("get-style-from", "get-css-style-from");
    (0, _builtinJs.Builtin).createBuiltin("get-pixel-height", [
        "nex"
    ], function $getPixelHeight(env, executionEnvironment) {
        let n = env.lb("nex");
        let rna = n.getRenderNodes();
        if (rna.length == 0) return (0, _floatJs.constructFloat)(0);
        let rn = rna[0];
        let h = rn.getDomNode().getBoundingClientRect().height;
        return (0, _floatJs.constructFloat)(h);
    }, "Returns the pixel height for the nex. If the nex is not visible on the screen this returns zero. If the nex appears in multiple places on the screen, and the sizes are different for some reason (e.g. one is in normal mode, the other is exploded) it will return the size of the first one.");
    (0, _builtinJs.Builtin).createBuiltin("get-pixel-width", [
        "nex"
    ], function $getPixelWidth(env, executionEnvironment) {
        let n = env.lb("nex");
        let rna = n.getRenderNodes();
        if (rna.length == 0) return (0, _floatJs.constructFloat)(0);
        let rn = rna[0];
        let h = rn.getDomNode().getBoundingClientRect().width;
        return (0, _floatJs.constructFloat)(h);
    }, "Returns the pixel width for the nex. If the nex is not visible on the screen this returns zero. If the nex appears in multiple places on the screen, and the sizes are different for some reason (e.g. one is in normal mode, the other is exploded) it will return the size of the first one.");
    (0, _builtinJs.Builtin).createBuiltin("jslog", [
        "nex"
    ], function $jslog(env, executionEnvironment) {
        let nex = env.lb("nex");
        console.log(nex.debugString());
        return nex;
    }, "Logs the |nex to the browser Javascript console.");
    (0, _builtinJs.Builtin).createBuiltin("run-js", [
        "expr$",
        "nex..."
    ], function $runJs(env, executionEnvironment) {
        let strn = env.lb("expr");
        let lst = env.lb("nex");
        let str = strn.getFullTypedValue();
        // the reason I'm creating these dollar sign variables
        // is so that the javascript code we eval can refer
        // to them.
        var $dom = [];
        var $nex = [];
        var $node = [];
        for(let i = 0; i < lst.numChildren(); i++){
            let child = lst.getChildAt(i);
            $nex[i] = child;
            if (child.getRenderNodes()) {
                let nodes = child.getRenderNodes();
                $node[i] = nodes[0];
                if ($node[i]) $dom[i] = $node[i].getDomNode();
            } else $dom[i] = child.renderedDomNode;
        }
        let result = eval(str);
        if (typeof result == "number") {
            if (Math.round(result) == result) return (0, _integerJs.constructInteger)(result);
            else return (0, _floatJs.constructFloat)(result);
        } else return (0, _estringJs.constructEString)("" + result);
    }, "Runs arbitrary Javascript code |expr.");
}

},{"../utils.js":"bIDtH","../nex/builtin.js":"cOoeb","../nex/estring.js":"bL0nm","../nex/eerror.js":"4Xsbj","../nex/float.js":"f95Ws","../nex/integer.js":"cjEX0","../nex/nil.js":"amOKC","../nex/org.js":"28wYz","../rendernode.js":"4dhWw","../systemstate.js":"19Hkn","../rootmanager.js":"cdnQQ","../globalappflags.js":"1FpbG","../environment.js":"4mXDy","../webfonts.js":"d7V8u","../globalconstants.js":"3d62t","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"cdnQQ":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "rootManager", ()=>rootManager);
var _rendernodeJs = require("./rendernode.js");
var _rootJs = require("./nex/root.js");
var _systemstateJs = require("./systemstate.js");
var _globalconstantsJs = require("./globalconstants.js");
/**
 * The hidden root controller is used for the awkward situation where we want to be
 * able to get information about a nex that pertains to the way it will be rendered
 * (for example, its width and height). Nexes are technically in a lower-level-layer
 * than the rendering code, so in some cases you might ask for rendering info about
 * a nex that *has never been rendered*. So, to get that information, it has to be
 * rendered in "secret" (invisibly).
 */ class RootManager {
    constructor(){}
    // This is currently unused, instead get-pixel-height and get-pixel-width just return
    // zero if something's never been rendered -- fine for now but we might bring
    // back this class at some point?
    createNewRoot(args) {
        if (!args) args = {};
        if (!args.mode) args.mode = (0, _globalconstantsJs.RENDER_MODE_NORM);
        if (!args.id) args.id = "vodkaroot";
        let rootnex = new (0, _rootJs.Root)(true);
        let root = new (0, _rendernodeJs.RenderNode)(rootnex);
        root.setRenderMode(args.mode);
        root.setRenderDepth(0);
        document.vodkaroot = root; // for debugging in chrome dev tools
        let rootDomNode = document.getElementById(args.id);
        root.setDomNode(rootDomNode);
        rootnex.setDirtyForRendering(true);
        (0, _systemstateJs.systemState).setRoot(root);
        return root;
    }
    renderInHiddenRoot(nex, rendermode) {
        let wasDirty = nex.getDirtyForRendering();
        let hiddenRoot = this.createNewRoot({
            mode: rendermode,
            id: "hiddenroot"
        });
        // render pass has to monotonically increase but it can skip, so when this is
        // called, the main (visible) render pass number will skip numbers.
        (0, _systemstateJs.systemState).setGlobalRenderPassNumber((0, _systemstateJs.systemState).getGlobalRenderPassNumber() + 1);
        // has to be synchronous so we can measure
        hiddenRoot.render();
        // if it was dirty before, re-dirty it
        nex.setDirtyForRendering(wasDirty);
        return nex.getRenderNodes()[0];
    }
}
const rootManager = new RootManager();

},{"./rendernode.js":"4dhWw","./nex/root.js":"8BOcG","./systemstate.js":"19Hkn","./globalconstants.js":"3d62t","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"d7V8u":[function(require,module,exports) {
var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "webFontManager", ()=>webFontManager);
class WebFontManager {
    loadFont(name) {
        WebFont.load({
            google: {
                families: [
                    name
                ]
            }
        });
    }
}
const webFontManager = new WebFontManager();

},{"@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"138Fk":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "createTagBuiltins", ()=>createTagBuiltins);
var _builtinJs = require("../nex/builtin.js");
var _eerrorJs = require("../nex/eerror.js");
var _boolJs = require("../nex/bool.js");
var _tagJs = require("../tag.js");
var _contractfunctionsJs = require("../contractfunctions.js");
function createTagBuiltins() {
    // IT IS AN INTENTIONAL CHOICE THAT THERE ARE NO FUNCTIONS TO REMOVE TAGS
    // Tags enforce types via contracts. If you can remove tags, you can
    // subvert any type protections that someone wants to add to something.
    // you can remove them using the editor of course, but not with code.
    (0, _builtinJs.Builtin).createBuiltin("add-tag to", [
        "tag$",
        "nex"
    ], function $addTag(env, executionEnvironment) {
        let nex = env.lb("nex");
        let tagname = env.lb("tag").getFullTypedValue();
        let tag = (0, _eerrorJs.newTagOrThrowOOM)(tagname, "add-tag builtin");
        let errorMessage = (0, _contractfunctionsJs.contractEnforcer).enforce(tag, nex);
        if (errorMessage) {
            let e = (0, _eerrorJs.constructFatalError)(errorMessage);
            return e;
        }
        nex.addTag((0, _eerrorJs.newTagOrThrowOOM)(tagname, "add-tag builtin"));
        return nex;
    }, "Adds the tag |tag to |nex.");
    (0, _builtinJs.Builtin).createBuiltin(" has-tag", [
        "nex",
        "tag$"
    ], function $hasTag(env, executionEnvironment) {
        let n = env.lb("nex");
        let tagname = env.lb("tag").getFullTypedValue();
        let tag = (0, _eerrorJs.newTagOrThrowOOM)(tagname, "has-tag builtin");
        if (n.hasTag(tag)) return (0, _boolJs.constructBool)(true);
        else return (0, _boolJs.constructBool)(false);
    }, "Returns true if |nex has a tag equal to |tag.");
}

},{"../nex/builtin.js":"cOoeb","../nex/eerror.js":"4Xsbj","../nex/bool.js":"3MKly","../tag.js":"975jg","../contractfunctions.js":"f9THN","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"29QXG":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "createTestBuiltins", ()=>createTestBuiltins);
var _utilsJs = require("../utils.js");
var _builtinJs = require("../nex/builtin.js");
var _boolJs = require("../nex/bool.js");
function createTestBuiltins() {
    (0, _builtinJs.Builtin).createBuiltin("is-boolean", [
        "nex"
    ], function $isBoolean(env, executionEnvironment) {
        return (0, _boolJs.constructBool)(_utilsJs.isBool(env.lb("nex")));
    }, `Returns true if |nex is a boolean.`);
    (0, _builtinJs.Builtin).createBuiltin("is-command", [
        "nex"
    ], function $isCommand(env, executionEnvironment) {
        return (0, _boolJs.constructBool)(_utilsJs.isCommand(env.lb("nex")));
    }, `Returns true if |nex is a command.`);
    (0, _builtinJs.Builtin).createBuiltin("is-instantiator", [
        "nex"
    ], function $isInstantiator(env, executionEnvironment) {
        return (0, _boolJs.constructBool)(_utilsJs.isInstantiator(env.lb("nex")));
    }, `Returns true if |nex is a command.`);
    (0, _builtinJs.Builtin).createBuiltin("is-doc", [
        "nex"
    ], function $isDoc(env, executionEnvironment) {
        return (0, _boolJs.constructBool)(_utilsJs.isDoc(env.lb("nex")));
    }, `Returns true if |nex is a doc.`);
    (0, _builtinJs.Builtin).createBuiltin("is-empty", [
        "list()"
    ], function $isEmpty(env, executionEnvironment) {
        let lst = env.lb("list");
        let rb = !lst.hasChildren();
        return (0, _boolJs.constructBool)(rb);
    }, `Returns true if |list is empty.`);
    (0, _builtinJs.Builtin).createBuiltin("is-deferred-command", [
        "nex"
    ], function $isDeferredCommand(env, executionEnvironment) {
        return (0, _boolJs.constructBool)(_utilsJs.isDeferredCommand(env.lb("nex")));
    }, `Returns true if |nex is a deferred command.`);
    (0, _builtinJs.Builtin).createBuiltin("is-deferred-value", [
        "nex"
    ], function $isDeferredValue(env, executionEnvironment) {
        return (0, _boolJs.constructBool)(_utilsJs.isDeferredValue(env.lb("nex")));
    }, `Returns true if |nex is a deferred value.`);
    (0, _builtinJs.Builtin).createBuiltin("is-error", [
        "nex"
    ], function $isError(env, executionEnvironment) {
        return (0, _boolJs.constructBool)(_utilsJs.isError(env.lb("nex")));
    }, `Returns true if |nex is an error.`);
    (0, _builtinJs.Builtin).createBuiltin("is-float", [
        "nex"
    ], function $isFloat(env, executionEnvironment) {
        return (0, _boolJs.constructBool)(_utilsJs.isFloat(env.lb("nex")));
    }, `Returns true if |nex is a float.`);
    (0, _builtinJs.Builtin).createBuiltin("is-integer", [
        "nex"
    ], function $isInteger(env, executionEnvironment) {
        return (0, _boolJs.constructBool)(_utilsJs.isInteger(env.lb("nex")));
    }, `Returns true if |nex is an integer.`);
    (0, _builtinJs.Builtin).createBuiltin("is-lambda", [
        "nex"
    ], function $isLambda(env, executionEnvironment) {
        return (0, _boolJs.constructBool)(_utilsJs.isLambda(env.lb("nex")));
    }, `Returns true if |nex is a lambda.`);
    (0, _builtinJs.Builtin).createBuiltin("is-letter", [
        "nex"
    ], function $isLetter(env, executionEnvironment) {
        return (0, _boolJs.constructBool)(_utilsJs.isLetter(env.lb("nex")));
    }, `Returns true if |nex is a letter.`);
    (0, _builtinJs.Builtin).createBuiltin("is-line", [
        "nex"
    ], function $isLine(env, executionEnvironment) {
        return (0, _boolJs.constructBool)(_utilsJs.isLine(env.lb("nex")));
    }, `Returns true if |nex is a line.`);
    (0, _builtinJs.Builtin).createBuiltin("is-list", [
        "nex"
    ], function $isList(env, executionEnvironment) {
        return (0, _boolJs.constructBool)(_utilsJs.isNexContainer(env.lb("nex")));
    }, `Returns true if |nex is a list.`);
    (0, _builtinJs.Builtin).createBuiltin("is-nil", [
        "nex"
    ], function $isNil(env, executionEnvironment) {
        return (0, _boolJs.constructBool)(_utilsJs.isNil(env.lb("nex")));
    }, `Returns true if |nex is nil.`);
    (0, _builtinJs.Builtin).createBuiltin("is-separator", [
        "nex"
    ], function $isSeparator(env, executionEnvironment) {
        return (0, _boolJs.constructBool)(_utilsJs.isSeparator(env.lb("nex")));
    }, `Returns true if |nex is a separator.`);
    (0, _builtinJs.Builtin).createBuiltin("is-string", [
        "nex"
    ], function $isString(env, executionEnvironment) {
        return (0, _boolJs.constructBool)(_utilsJs.isEString(env.lb("nex")));
    }, `Returns true if |nex is a string.`);
    (0, _builtinJs.Builtin).createBuiltin("is-symbol", [
        "nex"
    ], function $isSymbol(env, executionEnvironment) {
        return (0, _boolJs.constructBool)(_utilsJs.isESymbol(env.lb("nex")));
    }, `Returns true if |nex is a symbol.`);
    (0, _builtinJs.Builtin).createBuiltin("is-word", [
        "nex"
    ], function $isWord(env, executionEnvironment) {
        return (0, _boolJs.constructBool)(_utilsJs.isWord(env.lb("nex")));
    }, `Returns true if |nex is a word.`);
}

},{"../utils.js":"bIDtH","../nex/builtin.js":"cOoeb","../nex/bool.js":"3MKly","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"2cArE":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "createTypeConversionBuiltins", ()=>createTypeConversionBuiltins);
var _utilsJs = require("../utils.js");
var _nexJs = require("../nex/nex.js");
var _nexcontainerJs = require("../nex/nexcontainer.js");
var _valuenexJs = require("../nex/valuenex.js");
var _builtinJs = require("../nex/builtin.js");
var _eerrorJs = require("../nex/eerror.js");
var _estringJs = require("../nex/estring.js");
var _floatJs = require("../nex/float.js");
var _integerJs = require("../nex/integer.js");
var _letterJs = require("../nex/letter.js");
var _wordJs = require("../nex/word.js");
var _evaluatorJs = require("../evaluator.js");
function createTypeConversionBuiltins() {
    (0, _builtinJs.Builtin).createBuiltin("get-lambda", [
        "nex&"
    ], function $getLambda(env, executionEnvironment) {
        let n = env.lb("nex");
        return n.getLambda();
    }, "Returns the lambda expression that is used by the passed-in closure to execute code. Warning: modifying this lambda will change the code of the closure.");
    (0, _builtinJs.Builtin).createBuiltin("no-fail", [
        "_nex"
    ], function nofail(env, executionEnvironment) {
        let expr = env.lb("nex");
        let newresult = (0, _evaluatorJs.evaluateNexSafely)(expr, executionEnvironment);
        if (_utilsJs.isFatalError(newresult)) newresult.setErrorType((0, _eerrorJs.ERROR_TYPE_PREVIOUSLY_FATAL));
        return newresult;
    }, 'If evaluating |nex results in a fatal error, this converts the fatal error into the "previously fatal" error type, which doesn\'t trigger error cascading.');
    (0, _builtinJs.Builtin).createBuiltin("to-float", [
        "nex"
    ], function $toFloat(env, executionEnvironment) {
        let v = env.lb("nex");
        if (_utilsJs.isFloat(v)) return v;
        else if (_utilsJs.isInteger(v)) return (0, _floatJs.constructFloat)(v.getTypedValue());
        else if (_utilsJs.isBool(v)) return v.getTypedValue() ? (0, _floatJs.constructFloat)(1) : (0, _floatJs.constructFloat)(0);
        else if (_utilsJs.isEString(v)) {
            let s = v.getFullTypedValue();
            let mayben = parseFloat(s);
            if (Number.isNaN(mayben)) return (0, _eerrorJs.constructFatalError)(`to-float: could not convert "${s}". Sorry!`);
            else return (0, _floatJs.constructFloat)(mayben);
        } else if (_utilsJs.isLetter(v)) {
            // could be a number.
            let s = v.getText();
            let mayben = parseFloat(s);
            if (Number.isNaN(mayben)) return (0, _eerrorJs.constructFatalError)(`to-float: could not convert "${s}". Sorry!`);
            else return (0, _floatJs.constructFloat)(mayben);
        } else if (_utilsJs.isWord(v) || _utilsJs.isLine(v) || _utilsJs.isDoc(v)) {
            // could be a number.
            let s = v.getValueAsString();
            let mayben = parseFloat(s);
            if (Number.isNaN(mayben)) // rofl
            return (0, _eerrorJs.constructFatalError)(`to-float: could not convert "${s}" (object of type ${v.getTypeName()}). Sorry!`);
            else return (0, _floatJs.constructFloat)(mayben);
        } else return (0, _eerrorJs.constructFatalError)(`to-float: conversion of type ${v.getTypeName()} is unimplemented. Sorry!`);
    }, "Converts |nex to a float, or returns an error if this is impossible.");
    (0, _builtinJs.Builtin).createBuiltin("to-integer", [
        "nex"
    ], function $toInteger(env, executionEnvironment) {
        let v = env.lb("nex");
        if (_utilsJs.isInteger(v)) return v;
        else if (_utilsJs.isFloat(v)) return (0, _integerJs.constructInteger)(Math.floor(v.getTypedValue()));
        else if (_utilsJs.isBool(v)) return v.getTypedValue() ? (0, _integerJs.constructInteger)(1) : (0, _integerJs.constructInteger)(0);
        else if (_utilsJs.isEString(v)) {
            let s = v.getFullTypedValue();
            let mayben = parseInt(s);
            if (Number.isNaN(mayben)) return (0, _eerrorJs.constructFatalError)(`to-integer: could not convert "${s}". Sorry!`);
            else return (0, _integerJs.constructInteger)(mayben);
        } else if (_utilsJs.isLetter(v)) {
            // could be a number.
            let s = v.getText();
            let mayben = parseInt(s);
            if (Number.isNaN(mayben)) return (0, _eerrorJs.constructFatalError)(`to-integer: could not convert "${s}". Sorry!`);
            else return (0, _integerJs.constructInteger)(mayben);
        } else if (_utilsJs.isWord(v) || _utilsJs.isLine(v) || _utilsJs.isDoc(v)) {
            // could be a number.
            let s = v.getValueAsString();
            let mayben = parseInt(s);
            if (Number.isNaN(mayben)) // rofl
            return (0, _eerrorJs.constructFatalError)(`to-integer: could not convert "${s}" (object of type ${v.getTypeName()}). Sorry!`);
            else return (0, _integerJs.constructInteger)(mayben);
        } else return (0, _eerrorJs.constructFatalError)(`to-integer: conversion of type ${v.getTypeName()} is unimplemented. Sorry!`);
    }, "Converts |nex to an integer, or returns an error if this is impossible.");
    (0, _builtinJs.Builtin).createBuiltin("to-string", [
        "nex"
    ], function $toString(env, executionEnvironment) {
        let v = env.lb("nex");
        if (_utilsJs.isEString(v)) return (0, _estringJs.constructEString)(v.getFullTypedValue());
        else if (_utilsJs.isBool(v)) return (0, _estringJs.constructEString)(v.getTypedValue() ? "yes" : "no");
        else if (_utilsJs.isFloat(v)) return (0, _estringJs.constructEString)("" + v.getTypedValue());
        else if (_utilsJs.isInteger(v)) return (0, _estringJs.constructEString)("" + v.getTypedValue());
        else if (_utilsJs.isLetter(v)) return (0, _estringJs.constructEString)("" + v.getText());
        else if (_utilsJs.isSeparator(v)) return (0, _estringJs.constructEString)("" + v.getText());
        else if (_utilsJs.isWord(v) || _utilsJs.isLine(v) || _utilsJs.isDoc(v)) {
            let ss = v.getValueAsString();
            if (typeof ss == "string") return (0, _estringJs.constructEString)(ss);
            else return (0, _eerrorJs.constructFatalError)(`to-string: could not convert "${ss}" (object of type ${v.getTypeName()}). Sorry!`);
        } else if (_utilsJs.isOrg(v)) return (0, _estringJs.constructEString)("" + v.getValueAsString());
        else return (0, _eerrorJs.constructFatalError)(`to-string: conversion of type ${v.getTypeName()} is unimplemented. Sorry!`);
    }, "Converts |nex to a string, or returns an error if this is impossible.");
    (0, _builtinJs.Builtin).createBuiltin("to-word", [
        "nex"
    ], function $toWord(env, executionEnvironment) {
        let v = env.lb("nex");
        if (_utilsJs.isWord(v)) return v;
        let jsStringToDoc = function(str) {
            var w = (0, _wordJs.constructWord)();
            for(let i = 0; i < str.length; i++){
                let lt = (0, _letterJs.constructLetter)(str.charAt(i));
                w.appendChild(lt);
            }
            return w;
        };
        if (_utilsJs.isInteger(v) || _utilsJs.isFloat(v) || _utilsJs.isBool(v)) return jsStringToDoc("" + v.getTypedValue());
        else if (_utilsJs.isEString(v)) return jsStringToDoc("" + v.getFullTypedValue());
        else if (_utilsJs.isLetter(v)) {
            let w = (0, _wordJs.constructWord)();
            w.appendChild(v.makeCopy());
            return w;
        } else // should at least be able to do lines and docs.
        // I feel like maybe to-word should just be in util-functions tho.
        return (0, _eerrorJs.constructFatalError)(`to-word: conversion of type ${v.getTypeName()} is unimplemented. Sorry!`);
    }, "Converts |nex to a word, or returns an error if this is impossible.");
}

},{"../utils.js":"bIDtH","../nex/nex.js":"gNpCL","../nex/nexcontainer.js":"e7Ky3","../nex/valuenex.js":"8G1WY","../nex/builtin.js":"cOoeb","../nex/eerror.js":"4Xsbj","../nex/estring.js":"bL0nm","../nex/float.js":"f95Ws","../nex/integer.js":"cjEX0","../nex/letter.js":"keNY2","../nex/word.js":"a7zjn","../evaluator.js":"1TNlN","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"i3gVA":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "createWavetableBuiltins", ()=>createWavetableBuiltins);
var _utilsJs = require("../utils.js");
var _builtinJs = require("../nex/builtin.js");
var _eerrorJs = require("../nex/eerror.js");
var _wavetableJs = require("../nex/wavetable.js");
var _nilJs = require("../nex/nil.js");
var _integerJs = require("../nex/integer.js");
var _orgJs = require("../nex/org.js");
var _floatJs = require("../nex/float.js");
var _estringJs = require("../nex/estring.js");
var _deferredvalueJs = require("../nex/deferredvalue.js");
var _asyncfunctionsJs = require("../asyncfunctions.js");
var _environmentJs = require("../environment.js");
var _webaudioJs = require("../webaudio.js");
var _wavetablefunctionsJs = require("../wavetablefunctions.js");
var _tagJs = require("../tag.js");
var _commandJs = require("../nex/command.js");
var _syntheticrootJs = require("../syntheticroot.js");
var _heapJs = require("../heap.js");
var _systemstateJs = require("../systemstate.js");
function createWavetableBuiltins() {
    (0, _builtinJs.Builtin).createBuiltin("set-default-timebase", [
        "a"
    ], function $setDefaultTimebase(env, executionEnvironment) {
        let a = env.lb("a");
        (0, _wavetablefunctionsJs.setDefaultTimebase)(a);
        return (0, _nilJs.constructNil)();
    }, "Looks at the tags on |a and sets the default timebase based on their values.");
    (0, _builtinJs.Builtin).createBuiltin("get-default-timebase", [], function $getDefaultTimebase(env, executionEnvironment) {
        let tb = (0, _wavetablefunctionsJs.getDefaultTimebase)();
        return (0, _estringJs.constructEString)(tb);
    }, "Returns the default timebase.");
    (0, _builtinJs.Builtin).createBuiltin("oneshot-play", [
        "wt_",
        "channels#()?"
    ], function $oneshotPlay(env, executionEnvironment) {
        let wt = env.lb("wt");
        let channels = env.lb("channels");
        let buffers = [];
        if (_utilsJs.isNexContainer(wt)) for(let i = 0; i < wt.numChildren(); i++)buffers.push(wt.getChildAt(i).getCachedBuffer());
        else buffers.push(wt.getCachedBuffer());
        let channelnumbers = [
            0,
            1
        ];
        if (channels != (0, _environmentJs.UNBOUND)) {
            channelnumbers = [];
            if (_utilsJs.isNexContainer(channels)) for(let i = 0; i < channels.numChildren(); i++)channelnumbers.push(channels.getChildAt(i).getTypedValue());
            else channelnumbers.push(channels.getTypedValue());
        }
        (0, _webaudioJs.oneshotPlay)(buffers, channelnumbers);
        return wt;
    }, "Plays |wt immediately on the given channel. If |channel is not provided, the sound is played on the first 2 channels. If |channel and/or |wt are lists, Vodka will do its best to match up sounds with channels.");
    (0, _builtinJs.Builtin).createBuiltin("loop-play", [
        "wt_",
        "channels#()?"
    ], function $loopPlay(env, executionEnvironment) {
        let wt = env.lb("wt");
        let channels = env.lb("channels");
        let buffers = [];
        if (_utilsJs.isNexContainer(wt)) for(let i = 0; i < wt.numChildren(); i++)buffers.push(wt.getChildAt(i).getCachedBuffer());
        else buffers.push(wt.getCachedBuffer());
        let channelnumbers = [
            0,
            1
        ];
        if (channels != (0, _environmentJs.UNBOUND)) {
            channelnumbers = [];
            if (_utilsJs.isNexContainer(channels)) for(let i = 0; i < channels.numChildren(); i++)channelnumbers.push(channels.getChildAt(i).getTypedValue());
            else channelnumbers.push(channels.getTypedValue());
        }
        (0, _webaudioJs.loopPlay)(buffers, channelnumbers);
        return wt;
    }, "Starts playing wt| at the next measure start on |channel.  If |channel is not provided, the sound is played on the first 2 channels. If |channel and/or |wt are lists, Vodka will do its best to match up sounds with channels.");
    (0, _builtinJs.Builtin).createBuiltin("start-recording", [
        "_wt_"
    ], function $startRecording(env, executionEnvironment) {
        let wt = env.lb("wt");
        (0, _webaudioJs.startRecordingAudio)(wt);
        return wt;
    }, "Tells |wt to start recording.");
    (0, _builtinJs.Builtin).createBuiltin("stopRecording", [
        "_wt_"
    ], function $startRecording(env, executionEnvironment) {
        let wt = env.lb("wt");
        (0, _webaudioJs.stopRecordingAudio)(wt);
        return wt;
    }, "Tells |wt to stop recording.");
    (0, _builtinJs.Builtin).createBuiltin("abort-playback", [
        "channel#?"
    ], function $abortPlayback(env, executionEnvironment) {
        let channel = env.lb("channel");
        let channelnumber = -1;
        if (channel != (0, _environmentJs.UNBOUND)) channelnumber = channel.getTypedValue();
        (0, _webaudioJs.abortPlayback)(channelnumber);
        return (0, _nilJs.constructNil)();
    }, "Starts playing the sound at the next measure start");
    (0, _builtinJs.Builtin).createBuiltin("split", [
        "wt_"
    ], function $play(env, executionEnvironment) {
        let wt = env.lb("wt");
        let r = (0, _orgJs.constructOrg)();
        for(let i = 0; i < wt.numSections(); i++){
            let sd = wt.getSectionData(i);
            let w = (0, _wavetableJs.constructWavetable)(sd.data.length);
            let wdata = w.getData();
            for(let i = 0; i < sd.data.length; i++)wdata[i] = sd.data[i];
            w.init();
            r.appendChild(w);
        }
        return r;
    }, "Splits a wavetable into smaller sections based on markers added in wavetable editor");
    (0, _builtinJs.Builtin).createBuiltin("wavefold", [
        "wt_"
    ], function $reverse(env, executionEnvironment) {
        let wt = env.lb("wt");
        let dur = wt.getDuration();
        let r = (0, _wavetableJs.constructWavetable)(dur);
        let data = r.getData();
        for(let i = 0; i < dur; i++){
            let val = wt.valueAtSample(i);
            while(val > 1 || val < -1){
                if (val > 1) val = 1 - (val - 1);
                if (val < -1) val = -1 + -(val + 1); // this math makes sense to me
            }
            data[i] = val;
        }
        r.init();
        return r;
    }, "Reverses wavetable |wt");
    (0, _builtinJs.Builtin).createBuiltin("reverse", [
        "wt_"
    ], function $reverse(env, executionEnvironment) {
        let wt = env.lb("wt");
        let dur = wt.getDuration();
        let r = (0, _wavetableJs.constructWavetable)(dur);
        let data = r.getData();
        for(let i = 0; i < dur; i++)data[i] = wt.valueAtSample(dur - i);
        r.init();
        return r;
    }, "Reverses wavetable |wt");
    (0, _builtinJs.Builtin).createBuiltin("constant", [
        "val#%?",
        "len#%?"
    ], function $const(env, executionEnvironment) {
        let len = env.lb("len");
        let val = env.lb("val");
        let dur = 256;
        if (len != (0, _environmentJs.UNBOUND)) dur = (0, _wavetablefunctionsJs.convertTimeToSamples)(len);
        let valfloat = 1.0;
        if (val != (0, _environmentJs.UNBOUND)) valfloat = (0, _wavetablefunctionsJs.convertValueFromTag)(val);
        return (0, _wavetablefunctionsJs.getConstantSignalFromValue)(valfloat, dur);
    }, "Returns |dur samples of a constant value |val");
    (0, _builtinJs.Builtin).createBuiltin("singlepole", [
        "wt1_",
        "wt2#%_"
    ], function $singlepole(env, executionEnvironment) {
        let wt1 = env.lb("wt1");
        let wt2 = env.lb("wt2");
        if (!(wt2.getTypeName() == "-wavetable-")) {
            wt2 = (0, _wavetablefunctionsJs.getConstantSignalFromValue)(wt2.getTypedValue(), wt1.getDuration());
            (0, _syntheticrootJs.sAttach)(wt2);
        }
        let dur = Math.max(wt1.getDuration(), wt2.getDuration());
        let r = (0, _wavetableJs.constructWavetable)(dur);
        let data = r.getData();
        let yk = wt1.valueAtSample(0);
        let cutoffAtOne = 20000;
        let timeconstant = 1 / (0, _wavetablefunctionsJs.getSampleRate)();
        for(let i = 0; i < dur; i++){
            let wt1val = wt1.valueAtSample(i);
            let wt2val = wt2.valueAtSample(i);
            let cutoff = wt2val * cutoffAtOne;
            let tau = 1 / cutoff;
            let alpha = timeconstant / tau;
            yk += alpha * (wt1val - yk);
            data[i] = yk;
        }
        r.init();
        return r;
    }, "Runs |wt1 through a single pole filter with a cutoff determined by |wt2. If an integer or float is passed in for wt2, it is converted to a constant signal. A value of 1 corresponds to a filter cutoff frequency of 20kHz.");
    (0, _builtinJs.Builtin).createBuiltin("convolve", [
        "wt_",
        "ir_"
    ], function $convolve(env, executionEnvironment) {
        let wt = env.lb("wt");
        let ir = env.lb("ir");
        let wtLen = wt.getDuration();
        let irLen = ir.getDuration();
        let outLen = wtLen + irLen;
        let r = (0, _wavetableJs.constructWavetable)(outLen); // -1
        let rdata = r.getData();
        for(let outIndex = 0; outIndex < outLen; outIndex++){
            let sum = 0;
            for(let offset = 0; offset < irLen; offset++){
                let irIndex = offset;
                let wtIndex = outIndex - offset;
                if (irIndex < irLen && wtIndex >= 0) {
                    let irValue = ir.valueAtSample(irIndex);
                    // Note: wt will loop to the beginning of the sample if we ask for an index beyond the end of it.
                    // However for a realistic reverb what we really want is zeros once we get to the end of the sound.
                    // We will be indexing past the end of the sound when outIndex gets greater than wtLen and
                    // offset is 0 or a small value.
                    let wtValue = wtIndex >= wtLen ? 0.0 : wt.valueAtSample(wtIndex);
                    sum += irValue * wtValue;
                }
            }
            rdata[outIndex] = sum;
        }
        r.init();
        return r;
    }, "Convolves |wt with |ir. If |ir is an impulse response, this should give a reverb effect. Otherwise this will create a hybrid sound that shares some characteristics of both sounds. Warning: this function is very slow, you may have to wait a while.");
    (0, _builtinJs.Builtin).createBuiltin("slew", [
        "wt1_",
        "wt2#%_"
    ], function $slew(env, executionEnvironment) {
        let wt1 = env.lb("wt1");
        let wt2 = env.lb("wt2");
        if (!(wt2.getTypeName() == "-wavetable-")) {
            wt2 = (0, _wavetablefunctionsJs.getConstantSignalFromValue)(wt2.getTypedValue(), wt1.getDuration());
            (0, _syntheticrootJs.sAttach)(wt2);
        }
        let dur = Math.max(wt1.getDuration(), wt2.getDuration());
        let r = (0, _wavetableJs.constructWavetable)(dur);
        let data = r.getData();
        let previousValue = wt1.valueAtSample(0);
        data[0] = previousValue;
        for(let i = 1; i < dur; i++){
            let thisval = wt1.valueAtSample(i);
            let maxchange = Math.max(0, wt2.valueAtSample(i));
            let diff = thisval - previousValue;
            if (diff > maxchange) data[i] = previousValue + maxchange;
            else if (diff < -maxchange) data[i] = previousValue - maxchange;
            else data[i] = thisval;
            previousValue = data[i];
        }
        r.init();
        return r;
    }, "Slows down rate of change of |wt1 to a maximum value per sample given by |wt2. If wt1 is a signal residing between -1 and 1, values of wt2 that are between 0 and 1 will yield best results.");
    // fix this, example situation where it breaks:
    // take a normal ramp (2 beats) and pass it through a function that takes the value to the 5th power
    // the function will return, but some async bullshit will continue and some numbers will keep incrementing in the js console, not sure what is happening
    (0, _builtinJs.Builtin).createBuiltin("wavecalc", [
        "wt_",
        "f&"
    ], function $const(env, executionEnvironment) {
        let wt = env.lb("wt");
        let f = env.lb("f");
        let dur = wt.getDuration();
        let r = (0, _wavetableJs.constructWavetable)(dur);
        let data = r.getData();
        for(let i = 0; i < dur; i++){
            let v = (0, _floatJs.constructFloat)(wt.valueAtSample(i));
            let result = (0, _syntheticrootJs.sEval)((0, _systemstateJs.systemState).getSCF().makeCommandWithClosureOneArg(f, (0, _systemstateJs.systemState).getSCF().makeQuote(v)), executionEnvironment, "wavecalc: error returned from function");
            if (result.getTypeName() != "-float-") return (0, _eerrorJs.constructFatalError)("wavecalc: function must return a float");
            data[i] = result.getTypedValue();
        }
        r.init();
        return r;
    }, "Calls function |f on every sample in |wt (this may take a while for long samples)");
    (0, _builtinJs.Builtin).createBuiltin("noise", [
        "len#%?"
    ], function $noise(env, executionEnvironment) {
        let len = env.lb("len");
        if (len == (0, _environmentJs.UNBOUND)) {
            len = (0, _integerJs.constructInteger)((0, _wavetablefunctionsJs.getReferenceFrequency)());
            len.addTag((0, _eerrorJs.newTagOrThrowOOM)("hz", "noise wavetable builtin, timebase"));
            (0, _syntheticrootJs.sAttach)(len);
        }
        let dur = (0, _wavetablefunctionsJs.convertTimeToSamples)(len);
        let r = (0, _wavetableJs.constructWavetable)(dur);
        let data = r.getData();
        for(let i = 0; i < dur; i++){
            let n = Math.random() * 2.0 - 1.0;
            data[i] = n;
        }
        r.init();
        return r;
    }, "Returns dur samples (or seconds, etc) of white noise");
    (0, _builtinJs.Builtin).createBuiltin("sinewave", [
        "nn#%?"
    ], function $sinewave(env, executionEnvironment) {
        let nn = env.lb("nn");
        if (nn == (0, _environmentJs.UNBOUND)) {
            nn = (0, _integerJs.constructInteger)((0, _wavetablefunctionsJs.getReferenceFrequency)());
            nn.addTag((0, _eerrorJs.newTagOrThrowOOM)("hz", "sinewave wavetable builtin, timebase"));
            (0, _syntheticrootJs.sAttach)(nn);
        }
        let dur = (0, _wavetablefunctionsJs.convertTimeToSamples)(nn);
        let r = (0, _wavetableJs.constructWavetable)(dur);
        let data = r.getData();
        for(let i = 0; i < dur; i++){
            let d = Math.sin(i / dur * 2 * Math.PI);
            data[i] = d;
        }
        r.init();
        return r;
    }, "Returns a wavetable of a sine wave");
    (0, _builtinJs.Builtin).createBuiltin("gate", [
        "nn#%?"
    ], function $squarewave(env, executionEnvironment) {
        let nn = env.lb("nn");
        if (nn == (0, _environmentJs.UNBOUND)) {
            nn = (0, _integerJs.constructInteger)(1);
            nn.addTag((0, _eerrorJs.newTagOrThrowOOM)("b", "gate wavetable builtin, timebase"));
            (0, _syntheticrootJs.sAttach)(nn);
        }
        let dur = (0, _wavetablefunctionsJs.convertTimeToSamples)(nn);
        let r = (0, _wavetableJs.constructWavetable)(dur);
        let data = r.getData();
        for(let i = 0; i < dur; i++)if (i < dur / 2) data[i] = 0;
        else data[i] = 1;
        r.init();
        return r;
    }, "Returns a wavetable of a gate signal");
    (0, _builtinJs.Builtin).createBuiltin("squarewave", [
        "nn#%?"
    ], function $squarewave(env, executionEnvironment) {
        let nn = env.lb("nn");
        if (nn == (0, _environmentJs.UNBOUND)) {
            nn = (0, _integerJs.constructInteger)((0, _wavetablefunctionsJs.getReferenceFrequency)());
            nn.addTag((0, _eerrorJs.newTagOrThrowOOM)("hz", "squarewave wavetable builtin, timebase"));
            (0, _syntheticrootJs.sAttach)(nn);
        }
        let dur = (0, _wavetablefunctionsJs.convertTimeToSamples)(nn);
        let r = (0, _wavetableJs.constructWavetable)(dur);
        let data = r.getData();
        let numHarmonics = 16;
        let freq = 1 / dur * (0, _wavetablefunctionsJs.getSampleRate)();
        for(let i = 0; i < dur; i++){
            let omega = 2 * Math.PI * freq;
            // time in seconds of how far we are in the wave
            let time = 1 / (0, _wavetablefunctionsJs.getSampleRate)() * i;
            let s = 0;
            for(let k = 1; k <= numHarmonics; k++){
                let oddnum = k * 2 - 1;
                let v = 1 / oddnum * Math.sin(oddnum * omega * time);
                s += v;
            }
            data[i] = s * (4 / Math.PI);
        }
        r.init();
        return r;
    }, "Returns a wavetable of a square wave");
    (0, _builtinJs.Builtin).createBuiltin("sawwave", [
        "nn#%?"
    ], function $sawwave(env, executionEnvironment) {
        let nn = env.lb("nn");
        if (nn == (0, _environmentJs.UNBOUND)) {
            nn = (0, _integerJs.constructInteger)((0, _wavetablefunctionsJs.getReferenceFrequency)());
            nn.addTag((0, _eerrorJs.newTagOrThrowOOM)("hz", "sawwave wavetable builtin, timebase"));
            (0, _syntheticrootJs.sAttach)(nn);
        }
        let dur = (0, _wavetablefunctionsJs.convertTimeToSamples)(nn);
        let r = (0, _wavetableJs.constructWavetable)(dur);
        let data = r.getData();
        for(let i = 0; i < dur; i++){
            let d = i / dur;
            data[i] = d;
        }
        r.init();
        return r;
    }, "Returns a wavetable of a saw wave");
    (0, _builtinJs.Builtin).createBuiltin("ramp", [
        "len#%?"
    ], function $ramp(env, executionEnvironment) {
        let len = env.lb("len");
        if (len == (0, _environmentJs.UNBOUND)) {
            len = (0, _integerJs.constructInteger)(1);
            len.addTag((0, _eerrorJs.newTagOrThrowOOM)("seconds", "ramp wavetable builtin, timebase"));
            (0, _syntheticrootJs.sAttach)(len);
        }
        let dur = (0, _wavetablefunctionsJs.convertTimeToSamples)(len);
        let r = (0, _wavetableJs.constructWavetable)(dur);
        let data = r.getData();
        for(let i = 0; i < dur; i++){
            let d = 1.0 - i / dur;
            data[i] = d;
        }
        r.init();
        return r;
    }, "Returns a sample that ramps from one to zero in |len.");
    (0, _builtinJs.Builtin).createBuiltin("resample-to", [
        "wt_",
        "freq#%_?"
    ], function $resampleTo(env, executionEnvironment) {
        let wt = env.lb("wt");
        let freq = env.lb("freq");
        if (freq == (0, _environmentJs.UNBOUND)) {
            freq = (0, _integerJs.constructInteger)(1);
            freq.addTag((0, _eerrorJs.newTagOrThrowOOM)("seconds", "resample wavetable builtin, timebase"));
            (0, _syntheticrootJs.sAttach)(freq);
        }
        if (!(freq.getTypeName() == "-wavetable-")) {
            let tag = freq.hasTags() ? freq.getTag(0) : null;
            freq = (0, _wavetablefunctionsJs.getConstantSignalFromValue)(freq.getTypedValue());
            if (tag) freq.addTag(tag);
        }
        let timebase = (0, _wavetablefunctionsJs.nexToTimebase)(freq);
        let oldDuration = wt.getDuration();
        let freqDuration = freq.getDuration();
        // IDK if there's a smarter way to do this than doing two loops,
        // but I want to calculate the size of the destination first.
        // for reasons I don't understand the below loop crashes chrome if it
        // goes on too long. I don't know why it's getting an OOM condition.
        // Experimentally on my machine I can get to about 120,000,000
        // but I'll restrict the user to 10,000,000
        let maxdur = 10000000;
        let dur = 0;
        let oldPosition = 0;
        for(let i = 0; oldPosition < oldDuration; i = (i + 1) % freqDuration){
            let shiftValue = freq.valueAtSample(i);
            // at every time step we have a different idea of what the new duration
            // will be, this is the current value
            let instantaneousNewDuration = (0, _wavetablefunctionsJs.convertTimeToSamples)(shiftValue, timebase);
            if (dur > maxdur) return (0, _eerrorJs.constructFatalError)(`resample-to: result wavetable too long! Must be less than ${maxdur} samples.`);
            // for example, if the old duration is 1 second, and the new duration is 0.5 seconds,
            // then as we are building the new waveform sample by sample, we effectively skip
            // every other sample. The amount of time we need to advance in each step is given by
            // the old duration divided by the new duration (in this example, 1 / 0.5 = 2.0 samples)
            // Of course, we recalculate every step because the resample amount can be a waveform.
            let amountToAdvance = oldDuration / instantaneousNewDuration;
            oldPosition += amountToAdvance;
            dur++;
        }
        if (dur == 0) return (0, _eerrorJs.constructFatalError)(`resample-to: result wavetable too short (would be zero-length).`);
        let r = (0, _wavetableJs.constructWavetable)(dur);
        let data = r.getData();
        let j = 0;
        oldPosition = 0;
        for(let i = 0; oldPosition < oldDuration; j++, i = (i + 1) % freqDuration){
            let v = wt.interpolatedValueAtSample(oldPosition);
            let shiftValue = freq.valueAtSample(i);
            // convert that to samples
            let instantaneousNewDuration = (0, _wavetablefunctionsJs.convertTimeToSamples)(shiftValue, timebase);
            // that number is the total number of samples it would be
            // if you resampled this entire wave at that rate.
            // But we are doing one timestep at a time, so
            // divide by original sample length.
            let amountToAdvance = oldDuration / instantaneousNewDuration;
            oldPosition += amountToAdvance;
            data[j] = v;
        }
        r.init();
        return r;
    }, "Resamples the audio to a given duration or frequency (for example, changing a sample from 2 seconds to 4 seconds).");
    (0, _builtinJs.Builtin).createBuiltin("resample-by", [
        "wt_",
        "amount#%_"
    ], function $resampleBy(env, executionEnvironment) {
        let wt = env.lb("wt");
        let amt = env.lb("amount");
        if (amt == (0, _environmentJs.UNBOUND)) {
            amt = (0, _integerJs.constructInteger)(1);
            (0, _syntheticrootJs.sAttach)(amt);
        }
        let resultDuration = 0;
        let oldDuration = wt.getDuration();
        if (!(amt.getTypeName() == "-wavetable-")) {
            let scaleFactor = amt.getTypedValue();
            if (scaleFactor == 0) return (0, _eerrorJs.constructFatalError)("resample-by: cannot scale to a constant value that is zero.");
            amt = (0, _wavetablefunctionsJs.getConstantSignalFromValue)(scaleFactor);
            resultDuration = oldDuration * (1 / Math.abs(scaleFactor));
        } else // match the duration of the second arg.
        resultDuration = amt.getDuration();
        let amtDuration = amt.getDuration();
        let maxdur = 1000000;
        if (resultDuration > maxdur) return (0, _eerrorJs.constructFatalError)(`resample-by: result wavetable too long! Must be less than ${maxdur} samples.`);
        if (resultDuration <= 0) // is it possible to get here?
        return (0, _eerrorJs.constructFatalError)(`resample-by: result wavetable too short (would be zero-length).`);
        let r = (0, _wavetableJs.constructWavetable)(resultDuration);
        let data = r.getData();
        let oldPosition = 0;
        for(let i = 0; i < resultDuration; i++){
            let v = wt.interpolatedValueAtSample(oldPosition);
            let amountToAdvance = amt.valueAtSample(i % amtDuration);
            oldPosition += amountToAdvance;
            data[i] = v;
        }
        r.init();
        return r;
    }, 'Resamples the audio by a percentage given by the second arg. Positive 1 means no change. Negative values cause the "play head" to reverse direction. If the second argument is a constant, the duration of the result is determined by the first argument, otherwise the duration of the second argument determines the result duration.');
    (0, _builtinJs.Builtin).createBuiltin("resample-scale", [
        "wt_",
        "degree#"
    ], function $resampleScale(env, executionEnvironment) {
        let wt = env.lb("wt");
        let deg = env.lb("degree");
        let scaleDegree = deg.getTypedValue();
        // 24 -> 4
        // 12 -> 2
        // 0 -> 1
        // -12 -> 0.5
        // scale factor is 2 ** (degree / 12)
        let scaleFactor = 2 ** (scaleDegree / 12);
        let oldDuration = wt.getDuration();
        let resultDuration = oldDuration * (1 / Math.abs(scaleFactor));
        let maxdur = 1000000;
        if (resultDuration > maxdur) return (0, _eerrorJs.constructFatalError)(`resample-scale: result wavetable too long! Must be less than ${maxdur} samples.`);
        if (resultDuration <= 0) // is it possible to get here?
        return (0, _eerrorJs.constructFatalError)(`resample-scale: result wavetable too short (would be zero-length).`);
        let r = (0, _wavetableJs.constructWavetable)(resultDuration);
        let data = r.getData();
        let oldPosition = 0;
        for(let i = 0; i < resultDuration; i++){
            let v = wt.interpolatedValueAtSample(oldPosition);
            let amountToAdvance = scaleFactor;
            oldPosition += amountToAdvance;
            data[i] = v;
        }
        r.init();
        return r;
    }, "Assumes the given sample is the fundamental in a diatonic scale and resamples to a scale degree determined by the second integer argument (e.e. 3 is a minor third up, -1 is a half step down). Note that this uses equal temperament.");
    (0, _builtinJs.Builtin).createBuiltin("normalize", [
        "wt_"
    ], function $normalize(env, executionEnvironment) {
        let wt = env.lb("wt");
        let amp = wt.getAmp();
        let gain = 1 / amp;
        let dur = wt.getDuration();
        let r = (0, _wavetableJs.constructWavetable)(dur);
        let data = r.getData();
        for(let i = 0; i < wt.getDuration(); i++){
            let val = wt.valueAtSample(i);
            data[i] = val * gain;
        }
        r.init();
        return r;
    }, "Normalizes a wavetable (attenuates it such that the highest peak is exactly at full scale, or 1)");
    (0, _builtinJs.Builtin).createBuiltin("half-rectify", [
        "wt_"
    ], function $halfrectify(env, executionEnvironment) {
        let wt = env.lb("wt");
        let dur = wt.getDuration();
        let r = (0, _wavetableJs.constructWavetable)(dur);
        let data = r.getData();
        for(let i = 0; i < wt.getDuration(); i++){
            let val = wt.valueAtSample(i);
            if (val >= 0) data[i] = val;
            else data[i] = 0;
        }
        r.init();
        return r;
    }, "Changes all negative signal values in |wt to zero, but leaves positive values alone.");
    (0, _builtinJs.Builtin).createBuiltin("full-rectify", [
        "wt_"
    ], function $fullrectify(env, executionEnvironment) {
        let wt = env.lb("wt");
        let dur = wt.getDuration();
        let r = (0, _wavetableJs.constructWavetable)(dur);
        let data = r.getData();
        for(let i = 0; i < wt.getDuration(); i++){
            let val = wt.valueAtSample(i);
            if (val >= 0) data[i] = val;
            else data[i] = -val;
        }
        r.init();
        return r;
    }, "Inverts just the negative signal values in |wt, leaving positive values alone.");
    (0, _builtinJs.Builtin).createBuiltin("invert", [
        "wt_"
    ], function $invert(env, executionEnvironment) {
        let wt = env.lb("wt");
        let dur = wt.getDuration();
        let r = (0, _wavetableJs.constructWavetable)(dur);
        let data = r.getData();
        for(let i = 0; i < wt.getDuration(); i++){
            let val = wt.valueAtSample(i);
            data[i] = -val;
        }
        r.init();
        return r;
    }, "Inverts the sign of all values in |wt, making positive negative and negative positive.");
    (0, _builtinJs.Builtin).createBuiltin("offset", [
        "wt_",
        "amt#%_"
    ], function $offset(env, executionEnvironment) {
        let wt = env.lb("wt");
        let amt = env.lb("amt");
        if (!(amt.getTypeName() == "-wavetable-")) {
            amt = (0, _wavetablefunctionsJs.getConstantSignalFromValue)(amt.getTypedValue(), wt.getDuration());
            (0, _syntheticrootJs.sAttach)(amt);
        }
        let dur = Math.max(wt.getDuration(), amt.getDuration());
        let r = (0, _wavetableJs.constructWavetable)(dur);
        let data = r.getData();
        for(let i = 1; i < dur; i++){
            let val = wt.valueAtSample(i);
            let offset = amt.valueAtSample(i);
            data[i] = val + offset;
        }
        r.init();
        return r;
    }, "Offsets the signal value of |wt by |amt (note that |amt can be another wavetable).");
    (0, _builtinJs.Builtin).createBuiltin("phase-shift", [
        "wt_",
        "amt#%_"
    ], function $offset(env, executionEnvironment) {
        let wt = env.lb("wt");
        let amt = env.lb("amt");
        if (!(amt.getTypeName() == "-wavetable-")) {
            amt = (0, _wavetablefunctionsJs.getConstantSignalFromValue)(amt.getTypedValue(), wt.getDuration());
            (0, _syntheticrootJs.sAttach)(amt);
        }
        let originalDur = wt.getDuration();
        let dur = Math.max(originalDur, amt.getDuration());
        let r = (0, _wavetableJs.constructWavetable)(dur);
        let data = r.getData();
        for(let i = 1; i < dur; i++){
            let shift = amt.valueAtSample(i);
            let samplesToShift = shift * originalDur;
            let val = wt.interpolatedValueAtSample(i + samplesToShift);
            data[i] = val;
        }
        r.init();
        return r;
    }, 'phase shifts the signal by |amt. The length of |wt is considered to be one "cycle" (even if it is a complex waveform). The values for |amt should range from 1.0 (full cycle shift forward) to -1.0 (full cycle shift backward). A wavetable can be passed in for |amt.');
    (0, _builtinJs.Builtin).createBuiltin("gain", [
        "wtlst#%_..."
    ], function $gain(env, executionEnvironment) {
        let wtlst = env.lb("wtlst");
        // if the first arg to wtlst is a list instead of a wt, use it
        if (wtlst.numChildren() == 1 && wtlst.getChildAt(0).isNexContainer()) wtlst = wtlst.getChildAt(0);
        let waves = [];
        let dur = 0;
        for(let i = 0; i < wtlst.numChildren(); i++){
            let c = wtlst.getChildAt(i);
            if (!(c.getTypeName() == "-wavetable-")) c = (0, _wavetablefunctionsJs.getConstantSignalFromValue)(c.getTypedValue());
            let d = c.getDuration();
            if (d > dur) dur = d;
            waves.push(c);
        }
        let r = (0, _wavetableJs.constructWavetable)(dur);
        let data = r.getData();
        for(let i = 0; i < dur; i++){
            let v = 1;
            for(let j = 0; j < waves.length; j++)v *= waves[j].valueAtSample(i);
            data[i] = v;
        }
        r.init();
        return r;
    }, "Multiplies together all the passed in numbers or waves");
    (0, _builtinJs.Builtin).createBuiltin("clipad", [
        "wt_",
        "len#%"
    ], function $sizeto(env, executionEnvironment) {
        let len = env.lb("len");
        let wt = env.lb("wt");
        let dur = (0, _wavetablefunctionsJs.convertTimeToSamples)(len);
        let r = (0, _wavetableJs.constructWavetable)(dur);
        let data = r.getData();
        let index = 0;
        let wtdur = wt.getDuration();
        for(let i = 0; i < dur; i++)if (i < wtdur) data[index++] = wt.valueAtSample(i);
        else data[index++] = 0;
        r.init();
        return r;
    }, "Clips the length of the wavetable, or pads the end of it with silence, depending on whether the passed-in length is greater or less than the length of the wavetable.");
    (0, _builtinJs.Builtin).createBuiltin("remove-from-start", [
        "wt_",
        "len#%"
    ], function $removeStart(env, executionEnvironment) {
        let len = env.lb("len");
        let wt = env.lb("wt");
        let amountToRemove = (0, _wavetablefunctionsJs.convertTimeToSamples)(len);
        let originalDuration = wt.getDuration();
        if (amountToRemove > originalDuration) amountToRemove = originalDuration;
        if (amountToRemove < 0) amountToRemove = 0;
        let startPosition = amountToRemove;
        let resultDur = originalDuration - amountToRemove;
        let r = (0, _wavetableJs.constructWavetable)(resultDur);
        let data = r.getData();
        for(let i = startPosition; i < originalDuration; i++)data[i - startPosition] = wt.valueAtSample(i);
        r.init();
        return r;
    }, "Removes |len amount of sound from the start of |wt.");
    (0, _builtinJs.Builtin).createBuiltin("remove-from-end", [
        "wt_",
        "len#%"
    ], function $removeEnd(env, executionEnvironment) {
        let len = env.lb("len");
        let wt = env.lb("wt");
        let amountToRemove = (0, _wavetablefunctionsJs.convertTimeToSamples)(len);
        let originalDuration = wt.getDuration();
        if (amountToRemove > originalDuration) amountToRemove = originalDuration;
        if (amountToRemove < 0) amountToRemove = 0;
        let placeToStop = originalDuration - amountToRemove;
        let resultDur = placeToStop;
        let r = (0, _wavetableJs.constructWavetable)(resultDur);
        let data = r.getData();
        for(let i = 0; i < placeToStop; i++)data[i] = wt.valueAtSample(i);
        r.init();
        return r;
    }, "Removes |len amount of sound from the end of |wt.");
    (0, _builtinJs.Builtin).createBuiltin("delay", [
        "wt_",
        "time#%"
    ], function $delay(env, executionEnvironment) {
        let time = env.lb("time");
        let wt = env.lb("wt");
        time = (0, _wavetablefunctionsJs.convertTimeToSamples)(time);
        let originalDuration = wt.getDuration();
        let outputDuration = originalDuration + time;
        let r = (0, _wavetableJs.constructWavetable)(outputDuration);
        let data = r.getData();
        for(let i = time; i < outputDuration; i++)data[i] = wt.valueAtSample(i - time);
        r.init();
        return r;
    }, "Outputs a delayed copy of |wt (the beginning is padded with silence). Combine with the feedback builtin to get a classic delay sound.");
    (0, _builtinJs.Builtin).createBuiltin("feedback", [
        "wt_",
        "f&",
        "attenuation%",
        "n#"
    ], function $delay(env, executionEnvironment) {
        let wt = env.lb("wt");
        let f = env.lb("f");
        let attenuation = env.lb("attenuation").getTypedValue();
        let n = env.lb("n").getTypedValue();
        let dur = wt.getDuration();
        let wtData = wt.getData();
        let output = (0, _wavetableJs.constructWavetable)(dur);
        let outData = output.getData();
        for(let i = 0; i < dur; i++)outData[i] = wtData[i];
        let fedBackSignal = wt;
        for(let i = 0; i < n; i++){
            fedBackSignal = (0, _syntheticrootJs.sEval)((0, _systemstateJs.systemState).getSCF().makeCommandWithClosureOneArg(f, fedBackSignal));
            let fedBackData = fedBackSignal.getData();
            for(let j = 0; j < fedBackSignal.getDuration(); j++)fedBackData[j] = fedBackData[j] * attenuation;
            for(let j = 0; j < dur; j++)if (j < fedBackSignal.getDuration()) outData[j] += fedBackData[j];
        }
        output.init();
        return output;
    }, "Calls the function |f on |wt to produce an output, then calls |f on that output, then calls |f on the output of that, and so on, |n times, attenuating the output by |attenuation each time before passing it back into |f. The output of this function is the sum of all the outputs. This mimics analog feedback, but note that the |n parameter is a hard limit on the number of times the function is fed back into itself.");
    (0, _builtinJs.Builtin).createBuiltin("amplitude", [
        "wt_"
    ], function $amplitude(env, executionEnvironment) {
        let wt = env.lb("wt");
        let val = wt.getAmp();
        return (0, _floatJs.constructFloat)(val);
    }, "Gets the amplitude of a signal (max of absolute value, not RMS)");
    (0, _builtinJs.Builtin).createBuiltin("duration", [
        "wt_"
    ], function $duration(env, executionEnvironment) {
        let wt = env.lb("wt");
        let val = wt.getDuration();
        return (0, _integerJs.constructInteger)(val);
    }, "Gets the duration of a signal in samples");
    (0, _builtinJs.Builtin).createBuiltin("silence", [
        "len%#?"
    ], function $lenation(env, executionEnvironment) {
        let len = env.lb("len");
        if (len == (0, _environmentJs.UNBOUND)) {
            len = (0, _integerJs.constructInteger)(4);
            len.addTag((0, _eerrorJs.newTagOrThrowOOM)("beats", "silence wavetable builtin, timebase"));
            (0, _syntheticrootJs.sAttach)(len);
        }
        let dur = (0, _wavetablefunctionsJs.convertTimeToSamples)(len);
        return (0, _wavetableJs.constructWavetable)(dur);
    }, "Creates an empty wavetable (silence) with a duration of the requested number of samples");
    (0, _builtinJs.Builtin).createBuiltin("mix", [
        "wtlst#%_..."
    ], function $mix(env, executionEnvironment) {
        let wtlst = env.lb("wtlst");
        // if the first arg to wtlst is a list instead of a wt, use it
        if (wtlst.numChildren() == 1 && wtlst.getChildAt(0).isNexContainer()) wtlst = wtlst.getChildAt(0);
        let waves = [];
        let dur = 0;
        for(let i = 0; i < wtlst.numChildren(); i++){
            let c = wtlst.getChildAt(i);
            if (!(c.getTypeName() == "-wavetable-")) c = (0, _wavetablefunctionsJs.getConstantSignalFromValue)(c.getTypedValue());
            let d = c.getDuration();
            if (d > dur) dur = d;
            waves.push(c);
        }
        let r = (0, _wavetableJs.constructWavetable)(dur);
        let data = r.getData();
        for(let i = 0; i < dur; i++){
            let v = 0;
            for(let j = 0; j < waves.length; j++)v += waves[j].valueAtSample(i);
            data[i] = v;
        }
        r.init();
        return r;
    }, "Mixes together all the wavetables passed in");
    (0, _builtinJs.Builtin).createBuiltin("loop-for", [
        "wt#%_",
        "len%#?"
    ], function $loopFor(env, executionEnvironment) {
        let wt = env.lb("wt");
        if (!(wt.getTypeName() == "-wavetable-")) wt = (0, _wavetablefunctionsJs.getConstantSignalFromValue)(wt.getTypedValue());
        let len = env.lb("len");
        if (len == (0, _environmentJs.UNBOUND)) {
            len = (0, _integerJs.constructInteger)(4);
            len.addTag((0, _eerrorJs.newTagOrThrowOOM)("beats", "loop-for wavetable builtin, timebase"));
            (0, _syntheticrootJs.sAttach)(len);
        }
        let dur = (0, _wavetablefunctionsJs.convertTimeToSamples)(len);
        let r = (0, _wavetableJs.constructWavetable)(dur);
        let data = r.getData();
        for(let i = 0; i < dur; i++)data[i] = wt.valueAtSample(i);
        r.init();
        return r;
    }, "Loops a sample for |len time.");
    (0, _builtinJs.Builtin).createBuiltin("repeat", [
        "wt_",
        "reps#?"
    ], function $repeat(env, executionEnvironment) {
        let wt = env.lb("wt");
        let times = 1;
        if (times != (0, _environmentJs.UNBOUND)) times = env.lb("reps").getTypedValue();
        let wtdur = wt.getDuration();
        let dur = wtdur * times;
        let r = (0, _wavetableJs.constructWavetable)(dur);
        let data = r.getData();
        for(let i = 0; i < dur; i++)data[i] = wt.valueAtSample(i % wtdur);
        r.init();
        return r;
    }, "Repeats (loops) a sample a number of times exactly equal to |reps.");
    (0, _builtinJs.Builtin).createBuiltin("seq", [
        "wtlst()#%_..."
    ], function $chain(env, executionEnvironment) {
        let wtlst = env.lb("wtlst");
        let waves = [];
        for(let i = 0; i < wtlst.numChildren(); i++){
            let c = wtlst.getChildAt(i);
            if (c.getTypeName() == "-wavetable-") waves.push(c);
            else if (c.isNexContainer()) for(let j = 0; j < c.numChildren(); j++){
                let c2 = c.getChildAt(j);
                if (c2.getTypeName() == "-wavetable-") waves.push(c2);
                else waves.push((0, _wavetablefunctionsJs.getConstantSignalFromValue)(c2.getTypedValue()));
            }
            else if (_utilsJs.isInteger(c) || _utilsJs.isFloat(c)) waves.push((0, _wavetablefunctionsJs.getConstantSignalFromValue)(c.getTypedValue()));
            else return (0, _eerrorJs.constructFatalError)(`seq: invalid type - must be wavetable, integer, or float. Got ${c.getTypeName()}`);
        }
        let dur = 0;
        for(let i = 0; i < waves.length; i++){
            let c = waves[i];
            dur += c.getDuration();
        }
        let r = (0, _wavetableJs.constructWavetable)(dur);
        let data = r.getData();
        let k = 0;
        for(let i = 0; i < waves.length; i++){
            let c = waves[i];
            for(let j = 0; j < c.getDuration(); j++, k++)data[k] = c.valueAtSample(j);
        }
        r.init();
        return r;
    }, "Sequences a list of wavetables into a single wavetable by concatenating them. If a list is passed in, the list must contain integers, floats, or wavetables only.");
    (0, _builtinJs.Builtin).createBuiltin("load-sample", [
        "fname$"
    ], function $loadSample(env, executionEnvironment) {
        let fname = env.lb("fname").getFullTypedValue();
        let deferredValue = (0, _deferredvalueJs.constructDeferredValue)();
        deferredValue.set(new (0, _asyncfunctionsJs.GenericActivationFunctionGenerator)("load-sample", function(callback, deferredValue) {
            (0, _webaudioJs.loadSample)(fname, function(sampledata) {
                let r = (0, _wavetableJs.constructWavetable)(sampledata.length);
                r.initWith(sampledata);
                callback(r);
            });
        }));
        let loadingMessage = (0, _eerrorJs.constructEError)(`loading sample`);
        loadingMessage.setErrorType((0, _eerrorJs.ERROR_TYPE_INFO));
        deferredValue.appendChild(loadingMessage);
        deferredValue.activate();
        return deferredValue;
    // let r = constructWavetable();
    // r.loadFromFile(fname);
    // return r;
    }, "Loads a sample file from disk.");
    (0, _builtinJs.Builtin).createBuiltin("set-bpm", [
        "bpm#%"
    ], function $setBpm(env, executionEnvironment) {
        let bpm = env.lb("bpm");
        let v = bpm.getTypedValue();
        (0, _wavetablefunctionsJs.setBpm)(v);
        return (0, _nilJs.constructNil)();
    }, "Sets the global BPM used in time calculations.");
}

},{"../utils.js":"bIDtH","../nex/builtin.js":"cOoeb","../nex/eerror.js":"4Xsbj","../nex/wavetable.js":"6Cspq","../nex/nil.js":"amOKC","../nex/integer.js":"cjEX0","../nex/org.js":"28wYz","../nex/float.js":"f95Ws","../nex/estring.js":"bL0nm","../nex/deferredvalue.js":"l7y1l","../asyncfunctions.js":"6KukQ","../environment.js":"4mXDy","../webaudio.js":"df96Q","../wavetablefunctions.js":"i2XWR","../tag.js":"975jg","../nex/command.js":"6AUMZ","../syntheticroot.js":"rk2cG","../heap.js":"67mlv","../systemstate.js":"19Hkn","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"kc7nN":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "createMidiBuiltins", ()=>createMidiBuiltins);
var _builtinJs = require("../nex/builtin.js");
var _midifunctionsJs = require("../midifunctions.js");
var _orgJs = require("../nex/org.js");
var _deferredvalueJs = require("../nex/deferredvalue.js");
var _eerrorJs = require("../nex/eerror.js");
var _tagJs = require("../tag.js");
var _asyncfunctionsJs = require("../asyncfunctions.js");
function createMidiBuiltins() {
    (0, _builtinJs.Builtin).createBuiltin("list-midi-inputs", [], function $listMidiInputs(env, executionEnvironment) {
        let dv = (0, _deferredvalueJs.constructDeferredValue)();
        dv.set(new (0, _asyncfunctionsJs.GenericActivationFunctionGenerator)("list-midi-inputs", function(callback, exp) {
            (0, _midifunctionsJs.getMidiDevices)(function(devs) {
                // devices will just be a string
                // convert to nice estrings
                let r = (0, _orgJs.constructOrg)();
                for(let i = 0; i < devs.length; i++){
                    let org = (0, _orgJs.convertJSMapToOrg)(devs[i]);
                    org.setHorizontal();
                    org.addTag((0, _eerrorJs.newTagOrThrowOOM)("midiport", "list midi imputs builtin"));
                    r.appendChild(org);
                }
                callback(r);
            });
        }));
        let waitmessage = (0, _eerrorJs.constructInfo)(`listing midi inputs`);
        dv.appendChild(waitmessage);
        return dv;
    }, "Lists midi inputs.");
    (0, _builtinJs.Builtin).createBuiltin("wait-for-midi", [
        "midiport()"
    ], function $setMidi(env, executionEnvironment) {
        let midiport = env.lb("midiport");
        let ismidiport = midiport.hasTag((0, _eerrorJs.newTagOrThrowOOM)("midiport", "wait for midi builtin, is midi port"));
        let id = midiport.getChildTagged((0, _eerrorJs.newTagOrThrowOOM)("id", "wait for midi builtin, id"));
        if (!ismidiport || !id) return (0, _eerrorJs.constructFatalError)("wait-for-midi: must pass in a midiport object with a valid ID");
        let dv = (0, _deferredvalueJs.constructDeferredValue)();
        dv.setAutoreset(true);
        let afg = new (0, _asyncfunctionsJs.MidiActivationFunctionGenerator)(id.getTypedValue());
        dv.set(afg);
        dv.activate();
        return dv;
    }, "Returns a deferred value that updates any time a midi event is received on |midiport.");
}

},{"../nex/builtin.js":"cOoeb","../midifunctions.js":"hecb9","../nex/org.js":"28wYz","../nex/deferredvalue.js":"l7y1l","../nex/eerror.js":"4Xsbj","../tag.js":"975jg","../asyncfunctions.js":"6KukQ","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"5yjRk":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "runTest", ()=>runTest);
var _eventqueueJs = require("../eventqueue.js");
var _eventqueuedispatcherJs = require("../eventqueuedispatcher.js");
(0, _eventqueueJs.eventQueue).initialize();
function runTest(testname) {
    eval("TEST_" + testname + "();");
}
function assertEqual(a, b) {
    if (a != b) throw new Error("asserting equal failed: a = " + a + " b = " + b);
}
function assertTruthy(a) {
    if (!a) throw new Error("asserting truthy failed");
}
function assertFalsy(a) {
    if (a) throw new Error("asserting falsy failed");
}
function TEST_eventqueue_events_alertanimation() {
    let fakeRenderNode = new Object();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueAlertAnimation(fakeRenderNode);
    let item = (0, _eventqueueJs.eventQueue).retrieveNextItem();
    let correctItem = {
        action: "doAlertAnimation",
        shouldDedupe: true,
        renderNode: fakeRenderNode
    };
    assertTruthy(item);
    assertTruthy(item.equals(correctItem));
    assertEqual(item.action, correctItem.action);
    assertEqual(item.shouldDedupe, correctItem.shouldDedupe);
    assertEqual(item.renderNode, correctItem.renderNode);
}
function TEST_eventqueue_events_doclickhandleraction() {
    let fakeTarget = new Object();
    let fakeRenderNode = new Object();
    let fakeEvent = new Object();
    let fakeAtTarget = true;
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueDoClickHandlerAction(fakeTarget, fakeRenderNode, fakeAtTarget, fakeEvent);
    let item = (0, _eventqueueJs.eventQueue).retrieveNextItem();
    let correctItem = {
        action: "doClickHandlerAction",
        target: fakeTarget,
        renderNode: fakeRenderNode,
        event: fakeEvent,
        shouldDedupe: false
    };
    assertTruthy(item);
    assertEqual(item.action, correctItem.action);
    assertEqual(item.shouldDedupe, correctItem.shouldDedupe);
    assertEqual(item.event, correctItem.event);
    assertEqual(item.target, correctItem.target);
    assertEqual(item.renderNode, correctItem.renderNode);
}
function TEST_eventqueue_events_dokeyinput() {
    let keycode = "a";
    let whichkey = "b";
    let hasShift = true;
    let hasCtrl = true;
    let hasMeta = true;
    let hasAlt = true;
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueDoKeyInput(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt);
    let item = (0, _eventqueueJs.eventQueue).retrieveNextItem();
    let correctItem = {
        action: "doKeyInput",
        shouldDedupe: false,
        keycode: keycode,
        whichkey: whichkey,
        hasShift: hasShift,
        hasCtrl: hasCtrl,
        hasMeta: hasMeta,
        hasAlt: hasAlt
    };
    assertTruthy(item);
    assertEqual(item.action, correctItem.action);
    assertEqual(item.shouldDedupe, correctItem.shouldDedupe);
    assertEqual(item.keycode, correctItem.keycode);
    assertEqual(item.whichkey, correctItem.whichkey);
    assertEqual(item.hasShift, correctItem.hasShift);
    assertEqual(item.hasCtrl, correctItem.hasCtrl);
    assertEqual(item.hasMeta, correctItem.hasMeta);
    assertEqual(item.hasAlt, correctItem.hasAlt);
}
function TEST_eventqueue_events_gc() {
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueGC();
    let item = (0, _eventqueueJs.eventQueue).retrieveNextItem();
    let correctItem = {
        action: "gc",
        shouldDedupe: true
    };
    assertTruthy(item);
    assertTruthy(item.equals(correctItem));
    assertEqual(item.action, correctItem.action);
    assertEqual(item.shouldDedupe, correctItem.shouldDedupe);
}
function TEST_eventqueue_events_renderonlydirty() {
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueRenderOnlyDirty();
    let item = (0, _eventqueueJs.eventQueue).retrieveNextItem();
    let correctItem = {
        action: "renderOnlyDirty",
        shouldDedupe: true
    };
    assertTruthy(item);
    assertTruthy(item.equals(correctItem));
    assertEqual(item.action, correctItem.action);
    assertEqual(item.shouldDedupe, correctItem.shouldDedupe);
}
function TEST_eventqueue_events_toplevelrender() {
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueTopLevelRender();
    let item = (0, _eventqueueJs.eventQueue).retrieveNextItem();
    let correctItem = {
        action: "topLevelRender",
        shouldDedupe: true
    };
    assertTruthy(item);
    assertTruthy(item.equals(correctItem));
    assertEqual(item.action, correctItem.action);
    assertEqual(item.shouldDedupe, correctItem.shouldDedupe);
}
function TEST_eventqueue_events_importanttoplevelrender() {
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueImportantTopLevelRender();
    let item = (0, _eventqueueJs.eventQueue).retrieveNextItem();
    let correctItem = {
        action: "importantTopLevelRender",
        shouldDedupe: true
    };
    assertTruthy(item);
    assertTruthy(item.equals(correctItem));
    assertEqual(item.action, correctItem.action);
    assertEqual(item.shouldDedupe, correctItem.shouldDedupe);
}
function TEST_eventqueue_priority_inverseordering() {
    let obj = new Object();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueGC();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueAlertAnimation(obj);
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueRenderOnlyDirty();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueDeferredFinish(obj, obj);
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueDoKeyInput(obj, obj, obj, obj, obj, obj);
    assertEqual((0, _eventqueueJs.eventQueue).retrieveNextItem().action, "doKeyInput");
    assertEqual((0, _eventqueueJs.eventQueue).retrieveNextItem().action, "deferredFinish");
    assertEqual((0, _eventqueueJs.eventQueue).retrieveNextItem().action, "renderOnlyDirty");
    assertEqual((0, _eventqueueJs.eventQueue).retrieveNextItem().action, "doAlertAnimation");
    assertEqual((0, _eventqueueJs.eventQueue).retrieveNextItem().action, "gc");
}
function TEST_eventqueue_priority_addedwhiledequeueing() {
    let obj = new Object();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueGC();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueAlertAnimation(obj);
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueRenderOnlyDirty();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueDeferredFinish(obj, obj);
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueDoKeyInput(obj, obj, obj, obj, obj, obj);
    assertEqual((0, _eventqueueJs.eventQueue).retrieveNextItem().action, "doKeyInput");
    assertEqual((0, _eventqueueJs.eventQueue).retrieveNextItem().action, "deferredFinish");
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueDoKeyInput(obj, obj, obj, obj, obj, obj);
    assertEqual((0, _eventqueueJs.eventQueue).retrieveNextItem().action, "doKeyInput");
    assertEqual((0, _eventqueueJs.eventQueue).retrieveNextItem().action, "renderOnlyDirty");
    assertEqual((0, _eventqueueJs.eventQueue).retrieveNextItem().action, "doAlertAnimation");
    assertEqual((0, _eventqueueJs.eventQueue).retrieveNextItem().action, "gc");
}
function TEST_eventqueue_priority_inverseordering2() {
    let obj = new Object();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueGC();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueAlertAnimation(obj);
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueTopLevelRender();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueDeferredFinish(obj, obj);
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueDoClickHandlerAction(obj, obj, obj);
    assertEqual((0, _eventqueueJs.eventQueue).retrieveNextItem().action, "doClickHandlerAction");
    assertEqual((0, _eventqueueJs.eventQueue).retrieveNextItem().action, "deferredFinish");
    assertEqual((0, _eventqueueJs.eventQueue).retrieveNextItem().action, "topLevelRender");
    assertEqual((0, _eventqueueJs.eventQueue).retrieveNextItem().action, "doAlertAnimation");
    assertEqual((0, _eventqueueJs.eventQueue).retrieveNextItem().action, "gc");
}
function TEST_eventqueue_priority_normalandimportantrender() {
    let obj = new Object();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueTopLevelRender();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueImportantTopLevelRender();
    assertEqual((0, _eventqueueJs.eventQueue).retrieveNextItem().action, "importantTopLevelRender");
    assertEqual((0, _eventqueueJs.eventQueue).retrieveNextItem().action, "topLevelRender");
}
function TEST_eventqueue_deduping() {
    let obj = new Object();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueGC();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueGC();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueGC();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueGC();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueAlertAnimation(obj);
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueAlertAnimation(obj);
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueAlertAnimation(obj);
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueAlertAnimation(obj);
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueRenderOnlyDirty();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueRenderOnlyDirty();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueRenderOnlyDirty();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueRenderOnlyDirty();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueTopLevelRender();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueTopLevelRender();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueTopLevelRender();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueTopLevelRender();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueTopLevelRender();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueRenderOnlyDirty();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueTopLevelRender();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueImportantTopLevelRender();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueImportantTopLevelRender();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueImportantTopLevelRender();
    (0, _eventqueuedispatcherJs.eventQueueDispatcher).enqueueImportantTopLevelRender();
    assertEqual((0, _eventqueueJs.eventQueue).retrieveNextItem().action, "importantTopLevelRender");
    assertEqual((0, _eventqueueJs.eventQueue).retrieveNextItem().action, "renderOnlyDirty");
    assertEqual((0, _eventqueueJs.eventQueue).retrieveNextItem().action, "topLevelRender");
    assertEqual((0, _eventqueueJs.eventQueue).retrieveNextItem().action, "renderOnlyDirty");
    assertEqual((0, _eventqueueJs.eventQueue).retrieveNextItem().action, "topLevelRender");
    assertEqual((0, _eventqueueJs.eventQueue).retrieveNextItem().action, "doAlertAnimation");
    assertEqual((0, _eventqueueJs.eventQueue).retrieveNextItem().action, "gc");
    assertFalsy((0, _eventqueueJs.eventQueue).retrieveNextItem());
}

},{"../eventqueue.js":"9IKLf","../eventqueuedispatcher.js":"2z8jO","@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}],"31W1t":[function(require,module,exports) {
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
*/ var parcelHelpers = require("@parcel/transformer-js/src/esmodule-helpers.js");
parcelHelpers.defineInteropFlag(exports);
parcelHelpers.export(exports, "setupMobile", ()=>setupMobile);
parcelHelpers.export(exports, "doMobileKeyDown", ()=>doMobileKeyDown);
var prev = null;
function doFakeEvent(key, shift, ctrl, alt, cmd, meta) {
    mobileClearInput();
    let e = {};
    e.key = key;
    e.altKey = alt;
    e.ctrlKey = ctrl;
    e.shiftKey = shift;
    e.metaKey = meta;
    doKeydownEvent(e);
}
var mobileControlPanelVisible = false;
var hideTimeout = null;
function setHideTimeout() {
    if (hideTimeout) clearTimeout(hideTimeout);
    hideTimeout = setTimeout(function() {
        document.getElementById("mobilecontrolpanel").style.opacity = 0.0;
        mobileControlPanelVisible = false;
    }, 30000);
}
function showOrDoFakeEvent(key, shift, ctrl, alt, cmd, meta) {
    if (!mobileControlPanelVisible) {
        mobileControlPanelVisible = true;
        document.getElementById("mobilecontrolpanel").style.opacity = 1;
        setHideTimeout();
        return;
    }
    setHideTimeout();
    doFakeEvent(key, shift, ctrl, alt, cmd, meta);
}
function mobileClearInput() {
    document.getElementById("mobile_input").value = "";
}
function doMobileKeyDown(e) {
    if (e.key == "Enter") mobileClearInput();
}
function setupMobile() {
    var mobileInput = document.getElementById("mobile_input");
    mobileInput.onchange = function(e) {
        // lol this is basically when enter
        prev = "";
        doFakeEvent("Enter", false, false, false, false, false);
        setTimeout(function() {
            mobileInput.value = prev;
        }, 1);
    };
    mobileInput.oninput = function(e) {
        if (prev === null) {
            // well I guess we added stuff
            prev = mobileInput.value;
            doFakeEvent(prev, false, false, false, false, false);
        } else {
            // either it's shorter or longer!
            let newone = mobileInput.value;
            if (newone.length > prev.length) {
                let k = newone.charAt(newone.length - 1);
                prev = newone;
                doFakeEvent(k, false, false, false, false, false);
            } else {
                prev = newone;
                // gotta be shorter?
                doFakeEvent("Backspace", false, false, false, false, false);
            }
        }
        setTimeout(function() {
            mobileInput.value = prev;
        }, 1);
        return true;
    };
    systemState.setIsMobile(true);
    document.getElementById("mobilecontrolpanel").style.display = "flex";
    document.getElementById("codepane").classList.add("mobile");
    document.getElementById("mobile_out").onclick = function() {
        showOrDoFakeEvent("Tab", true, false, false, false, false);
    };
    document.getElementById("mobile_in").onclick = function() {
        showOrDoFakeEvent("Tab", false, false, false, false, false);
    };
    document.getElementById("mobile_prev").onclick = function() {
        showOrDoFakeEvent("ArrowLeft", false, false, false, false, false);
    };
    document.getElementById("mobile_next").onclick = function() {
        showOrDoFakeEvent("ArrowRight", false, false, false, false, false);
    };
    document.getElementById("mobile_del").onclick = function() {
        showOrDoFakeEvent("Backspace", false, false, false, false, false);
    };
    document.getElementById("mobile_sde").onclick = function() {
        showOrDoFakeEvent("Backspace", true, false, false, false, false);
    };
    document.getElementById("mobile_esc").onclick = function() {
        showOrDoFakeEvent("Escape", false, false, false, false, false);
    };
    document.getElementById("mobile_til").onclick = function() {
        showOrDoFakeEvent("~", true, false, false, false, false);
    };
    document.getElementById("mobile_exc").onclick = function() {
        showOrDoFakeEvent("!", true, false, false, false, false);
    };
    document.getElementById("mobile_ats").onclick = function() {
        showOrDoFakeEvent("@", true, false, false, false, false);
    };
    document.getElementById("mobile_num").onclick = function() {
        showOrDoFakeEvent("#", true, false, false, false, false);
    };
    document.getElementById("mobile_dol").onclick = function() {
        showOrDoFakeEvent("$", true, false, false, false, false);
    };
    document.getElementById("mobile_per").onclick = function() {
        showOrDoFakeEvent("%", true, false, false, false, false);
    };
    document.getElementById("mobile_car").onclick = function() {
        showOrDoFakeEvent("^", true, false, false, false, false);
    };
    document.getElementById("mobile_amp").onclick = function() {
        showOrDoFakeEvent("&", true, false, false, false, false);
    };
    document.getElementById("mobile_ast").onclick = function() {
        showOrDoFakeEvent("*", true, false, false, false, false);
    };
    document.getElementById("mobile_par").onclick = function() {
        showOrDoFakeEvent("(", true, false, false, false, false);
    };
    document.getElementById("mobile_bce").onclick = function() {
        showOrDoFakeEvent("{", true, false, false, false, false);
    };
    document.getElementById("mobile_brk").onclick = function() {
        showOrDoFakeEvent("[", true, false, false, false, false);
    };
    document.getElementById("mobile_flp").onclick = function() {
        showOrDoFakeEvent(" ", true, false, false, false, false);
    };
    document.getElementById("mobile_edit").onclick = function() {
        showOrDoFakeEvent("Enter", false, true, false, false, false);
    };
    document.getElementById("mobile_sted").onclick = function() {
        showOrDoFakeEvent("Enter", false, false, false, false, false);
    };
    document.getElementById("mobile_cut").onclick = function() {
        showOrDoFakeEvent("x", false, false, false, false, true);
    };
    document.getElementById("mobile_copy").onclick = function() {
        showOrDoFakeEvent("c", false, false, false, false, true);
    };
    document.getElementById("mobile_paste").onclick = function() {
        showOrDoFakeEvent("v", false, false, false, false, true);
    };
    document.getElementById("mobile_eval").onclick = function() {
        showOrDoFakeEvent("Enter", false, false, false, false, false);
    };
    document.getElementById("mobile_quiet").onclick = function() {
        showOrDoFakeEvent("Enter", true, false, false, false, false);
    };
}

},{"@parcel/transformer-js/src/esmodule-helpers.js":"sE46K"}]},["lOQ3D","lEk1q"], "lEk1q", "parcelRequire4c92")

//# sourceMappingURL=host.9876d776.js.map
