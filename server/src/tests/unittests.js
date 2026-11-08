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

import { eventQueue } from '../eventqueue.js'
import { eventQueueDispatcher } from '../eventqueuedispatcher.js'
import { parse } from '../nexparser2.js'
import { systemState } from '../systemstate.js'
import { evaluateNexSafely } from '../evaluator.js'
import { BINDINGS } from '../environment.js'
import { SerializationContext, SERIALIZE_FILE } from '../serializationcontext.js'
import { parametricFontManager } from '../pfonts/pfontmanager.js'
import { constructLetter } from '../nex/letter.js'
import * as Utils from '../utils.js'

eventQueue.initialize();

// Looked up in a table rather than assembled into an eval string. A bundler
// can't see a name built at runtime, so with eval the TEST_ functions below
// had no visible callers and esbuild stripped every one of them out -- the
// tests all died with "TEST_<name> is not defined" against a bundle that
// genuinely didn't contain them. Referencing them here keeps them alive.
// (comment by Claude)
function getTests() {
	return {
		'eventqueue_events_alertanimation': TEST_eventqueue_events_alertanimation,
		'eventqueue_events_doclickhandleraction': TEST_eventqueue_events_doclickhandleraction,
		'eventqueue_events_dokeyinput': TEST_eventqueue_events_dokeyinput,
		'eventqueue_events_gc': TEST_eventqueue_events_gc,
		'eventqueue_events_renderonlydirty': TEST_eventqueue_events_renderonlydirty,
		'eventqueue_events_toplevelrender': TEST_eventqueue_events_toplevelrender,
		'eventqueue_events_importanttoplevelrender': TEST_eventqueue_events_importanttoplevelrender,
		'eventqueue_priority_inverseordering': TEST_eventqueue_priority_inverseordering,
		'eventqueue_priority_addedwhiledequeueing': TEST_eventqueue_priority_addedwhiledequeueing,
		'eventqueue_priority_inverseordering2': TEST_eventqueue_priority_inverseordering2,
		'eventqueue_priority_normalandimportantrender': TEST_eventqueue_priority_normalandimportantrender,
		'eventqueue_deduping': TEST_eventqueue_deduping,
		'pfont_render_basic': TEST_pfont_render_basic,
		'pfont_params_zero': TEST_pfont_params_zero,
		'pfont_fontstring_parsing': TEST_pfont_fontstring_parsing,
		'pfont_missing_glyph': TEST_pfont_missing_glyph,
		'pfont_remove': TEST_pfont_remove,
		'pfont_lastwritewins': TEST_pfont_lastwritewins,
		'pfont_saveload_doc': TEST_pfont_saveload_doc,
		'pfont_saveload_word': TEST_pfont_saveload_word,
		'pfont_saveload_letter': TEST_pfont_saveload_letter,
		'pfont_insert_letter': TEST_pfont_insert_letter,
		'pfont_copy': TEST_pfont_copy,
		'pfont_darktheme': TEST_pfont_darktheme,
		'pfont_exploded_vs_normal': TEST_pfont_exploded_vs_normal,
		'pfont_wrap_narrow': TEST_pfont_wrap_narrow,
		'pfont_nested_repaint': TEST_pfont_nested_repaint,
	};
}

export function runTest(testname) {
	let test = getTests()[testname];
	if (!test) {
		throw new Error('no such unit test: ' + testname);
	}
	// returned so an async test can be waited for
	// (comment by Claude)
	return test();
}

function assertEqual(a, b) {
	if (a != b) {
		throw new Error('asserting equal failed: a = ' + a + ' b = ' + b);
	}
}

function assertTruthy(a) {
	if (!a) {
		throw new Error('asserting truthy failed');
	}
}

function assertFalsy(a) {
	if (a) {
		throw new Error('asserting falsy failed');
	}
}

function TEST_eventqueue_events_alertanimation() {
	let fakeRenderNode = new Object();
	eventQueueDispatcher.enqueueAlertAnimation(fakeRenderNode);
	let item = eventQueue.retrieveNextItem();
	let correctItem = {
		action: 'doAlertAnimation',
		shouldDedupe: true,
		renderNode: fakeRenderNode
	}
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
	eventQueueDispatcher.enqueueDoClickHandlerAction(fakeTarget, fakeRenderNode, fakeAtTarget, fakeEvent);
	let item = eventQueue.retrieveNextItem();
	let correctItem = {
		action: 'doClickHandlerAction',
		target: fakeTarget,
		renderNode: fakeRenderNode,
		event: fakeEvent,
		shouldDedupe: false,
	}
	assertTruthy(item);
	assertEqual(item.action, correctItem.action);
	assertEqual(item.shouldDedupe, correctItem.shouldDedupe);
	assertEqual(item.event, correctItem.event);
	assertEqual(item.target, correctItem.target);
	assertEqual(item.renderNode, correctItem.renderNode);
}

function TEST_eventqueue_events_dokeyinput() {
	let keycode = 'a';
	let whichkey = 'b';
	let hasShift = true;
	let hasCtrl = true;
	let hasMeta = true;
	let hasAlt = true;
	eventQueueDispatcher.enqueueDoKeyInput(keycode, whichkey, hasShift, hasCtrl, hasMeta, hasAlt);
	let item = eventQueue.retrieveNextItem();
	let correctItem = {
		action: 'doKeyInput',
		shouldDedupe: false,
		keycode: keycode,
		whichkey: whichkey,
		hasShift: hasShift,
		hasCtrl: hasCtrl,
		hasMeta: hasMeta,
		hasAlt: hasAlt
	}
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
	eventQueueDispatcher.enqueueGC();
	let item = eventQueue.retrieveNextItem();
	let correctItem = {
		action: 'gc',
		shouldDedupe: true,
	}
	assertTruthy(item);
	assertTruthy(item.equals(correctItem));
	assertEqual(item.action, correctItem.action);
	assertEqual(item.shouldDedupe, correctItem.shouldDedupe);
}

function TEST_eventqueue_events_renderonlydirty() {
	eventQueueDispatcher.enqueueRenderOnlyDirty();
	let item = eventQueue.retrieveNextItem();
	let correctItem = {
		action: 'renderOnlyDirty',
		shouldDedupe: true,
	}
	assertTruthy(item);
	assertTruthy(item.equals(correctItem));
	assertEqual(item.action, correctItem.action);
	assertEqual(item.shouldDedupe, correctItem.shouldDedupe);
}

function TEST_eventqueue_events_toplevelrender() {
	eventQueueDispatcher.enqueueTopLevelRender();
	let item = eventQueue.retrieveNextItem();
	let correctItem = {
		action: 'topLevelRender',
		shouldDedupe: true,
	}
	assertTruthy(item);
	assertTruthy(item.equals(correctItem));
	assertEqual(item.action, correctItem.action);
	assertEqual(item.shouldDedupe, correctItem.shouldDedupe);
}

function TEST_eventqueue_events_importanttoplevelrender() {
	eventQueueDispatcher.enqueueImportantTopLevelRender();
	let item = eventQueue.retrieveNextItem();
	let correctItem = {
		action: 'importantTopLevelRender',
		shouldDedupe: true,
	}
	assertTruthy(item);
	assertTruthy(item.equals(correctItem));
	assertEqual(item.action, correctItem.action);
	assertEqual(item.shouldDedupe, correctItem.shouldDedupe);
}


function TEST_eventqueue_priority_inverseordering() {
	let obj = new Object();
	eventQueueDispatcher.enqueueGC();
	eventQueueDispatcher.enqueueAlertAnimation(obj);
	eventQueueDispatcher.enqueueRenderOnlyDirty();
	eventQueueDispatcher.enqueueDeferredFinish(obj, obj)
	eventQueueDispatcher.enqueueDoKeyInput(obj, obj, obj, obj, obj, obj);
	assertEqual(eventQueue.retrieveNextItem().action, 'doKeyInput');
	assertEqual(eventQueue.retrieveNextItem().action, 'deferredFinish');
	assertEqual(eventQueue.retrieveNextItem().action, 'renderOnlyDirty');
	assertEqual(eventQueue.retrieveNextItem().action, 'doAlertAnimation');
	assertEqual(eventQueue.retrieveNextItem().action, 'gc');
}


function TEST_eventqueue_priority_addedwhiledequeueing() {
	let obj = new Object();
	eventQueueDispatcher.enqueueGC();
	eventQueueDispatcher.enqueueAlertAnimation(obj);
	eventQueueDispatcher.enqueueRenderOnlyDirty();
	eventQueueDispatcher.enqueueDeferredFinish(obj, obj)
	eventQueueDispatcher.enqueueDoKeyInput(obj, obj, obj, obj, obj, obj);
	assertEqual(eventQueue.retrieveNextItem().action, 'doKeyInput');
	assertEqual(eventQueue.retrieveNextItem().action, 'deferredFinish');
	eventQueueDispatcher.enqueueDoKeyInput(obj, obj, obj, obj, obj, obj);
	assertEqual(eventQueue.retrieveNextItem().action, 'doKeyInput');
	assertEqual(eventQueue.retrieveNextItem().action, 'renderOnlyDirty');
	assertEqual(eventQueue.retrieveNextItem().action, 'doAlertAnimation');
	assertEqual(eventQueue.retrieveNextItem().action, 'gc');
}

function TEST_eventqueue_priority_inverseordering2() {
	let obj = new Object();
	eventQueueDispatcher.enqueueGC();
	eventQueueDispatcher.enqueueAlertAnimation(obj);
	eventQueueDispatcher.enqueueTopLevelRender();
	eventQueueDispatcher.enqueueDeferredFinish(obj, obj)
	eventQueueDispatcher.enqueueDoClickHandlerAction(obj, obj, obj);
	assertEqual(eventQueue.retrieveNextItem().action, 'doClickHandlerAction');
	assertEqual(eventQueue.retrieveNextItem().action, 'deferredFinish');
	assertEqual(eventQueue.retrieveNextItem().action, 'topLevelRender');
	assertEqual(eventQueue.retrieveNextItem().action, 'doAlertAnimation');
	assertEqual(eventQueue.retrieveNextItem().action, 'gc');
}

function TEST_eventqueue_priority_normalandimportantrender() {
	let obj = new Object();
	eventQueueDispatcher.enqueueTopLevelRender();
	eventQueueDispatcher.enqueueImportantTopLevelRender();
	assertEqual(eventQueue.retrieveNextItem().action, 'importantTopLevelRender');
	assertEqual(eventQueue.retrieveNextItem().action, 'topLevelRender');
}

function TEST_eventqueue_deduping() {
	let obj = new Object();
	eventQueueDispatcher.enqueueGC();
	eventQueueDispatcher.enqueueGC();
	eventQueueDispatcher.enqueueGC();
	eventQueueDispatcher.enqueueGC();
	eventQueueDispatcher.enqueueAlertAnimation(obj);
	eventQueueDispatcher.enqueueAlertAnimation(obj);
	eventQueueDispatcher.enqueueAlertAnimation(obj);
	eventQueueDispatcher.enqueueAlertAnimation(obj);
	eventQueueDispatcher.enqueueRenderOnlyDirty();
	eventQueueDispatcher.enqueueRenderOnlyDirty();
	eventQueueDispatcher.enqueueRenderOnlyDirty();
	eventQueueDispatcher.enqueueRenderOnlyDirty();
	eventQueueDispatcher.enqueueTopLevelRender();
	eventQueueDispatcher.enqueueTopLevelRender();
	eventQueueDispatcher.enqueueTopLevelRender();
	eventQueueDispatcher.enqueueTopLevelRender();
	eventQueueDispatcher.enqueueTopLevelRender();
	eventQueueDispatcher.enqueueRenderOnlyDirty();
	eventQueueDispatcher.enqueueTopLevelRender();
	eventQueueDispatcher.enqueueImportantTopLevelRender();
	eventQueueDispatcher.enqueueImportantTopLevelRender();
	eventQueueDispatcher.enqueueImportantTopLevelRender();
	eventQueueDispatcher.enqueueImportantTopLevelRender();
	assertEqual(eventQueue.retrieveNextItem().action, 'importantTopLevelRender');
	assertEqual(eventQueue.retrieveNextItem().action, 'renderOnlyDirty');
	assertEqual(eventQueue.retrieveNextItem().action, 'topLevelRender');
	assertEqual(eventQueue.retrieveNextItem().action, 'renderOnlyDirty');
	assertEqual(eventQueue.retrieveNextItem().action, 'topLevelRender');
	assertEqual(eventQueue.retrieveNextItem().action, 'doAlertAnimation');
	assertEqual(eventQueue.retrieveNextItem().action, 'gc');
	assertFalsy(eventQueue.retrieveNextItem());
}




/*
Parametric font tests.

(comment by Claude)
*/

const PF_HELLO = 'v2:[doc](|[line](_[word](_[letter]"h" [letter]"e" [letter]"l" [letter]"l" [letter]"o"_) [separator]" " [word](_[letter]"4" [letter]"2"_) [separator]"."_)|)';

function pfParse(s) {
	return parse(s);
}

function pfLetters(n) {
	let r = [];
	let walk = function(x) {
		let t = x.getTypeName();
		if (t == '-letter-' || t == '-separator-') {
			r.push(x);
		} else if (x.isNexContainer()) {
			x.doForEachChild(walk);
		}
	};
	walk(n);
	return r;
}

function pfFirstWord(doc) {
	return doc.getChildAt(0).getChildAt(0);
}

function pfSave(n) {
	return n.toString('v2', new SerializationContext(SERIALIZE_FILE));
}

function pfCount(s, sub) {
	return s.split(sub).length - 1;
}

function pfRender(nex) {
	let node = systemState.getRoot().appendChild(nex);
	eventQueueDispatcher.enqueueTopLevelRender();
	eventQueue.drain();
	return node;
}

function pfFrames() {
	return new Promise(function(resolve) {
		requestAnimationFrame(function() { requestAnimationFrame(resolve); });
	});
}

function pfBlocks() {
	return document.querySelectorAll('canvas.pfontblock');
}

// the colour of the darkest or lightest stroked pixel, as [r, g, b]
function pfInkColor(canvas) {
	let ctx = canvas.getContext('2d');
	let data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
	let best = null;
	let bestAlpha = 0;
	for (let i = 0; i < data.length; i += 4) {
		if (data[i + 3] > bestAlpha) {
			bestAlpha = data[i + 3];
			best = [data[i], data[i + 1], data[i + 2]];
		}
	}
	return best;
}

function pfEvaluate(s) {
	return evaluateNexSafely(parse(s), BINDINGS);
}

async function TEST_pfont_render_basic() {
	let doc = pfParse(PF_HELLO);
	doc.setPfont('basic##');
	doc.setMutable(false);
	pfRender(doc);
	await pfFrames();
	let blocks = pfBlocks();
	assertEqual(blocks.length, 1);
	assertEqual(blocks[0].getAttribute('aria-label'), 'hello 42.');
	assertTruthy(blocks[0].width > 0 && blocks[0].height > 0);
	assertTruthy(pfInkColor(blocks[0]));
	// nothing inside the block gets dom of its own
	assertEqual(document.querySelectorAll('.letter').length, 0);
}

function TEST_pfont_params_zero() {
	let f = parametricFontManager.getFontForString('basic#left_kerning:7,slop:0#curve:0,baseline:0.1');
	assertEqual(f.params.curve, 0);
	assertEqual(f.pxparams.left_kerning, 7);
	assertEqual(f.pxparams.slop, 0);
	assertEqual(f.params.baseline, 0.1);
	// bar still follows corpus, curve does not
	let g = parametricFontManager.getFontForString('basic##corpus:0.5,curve:0');
	assertEqual(g.params.bar, 0.25);
	assertEqual(g.params.curve, 0);
	// unknown names are not params
	let h = parametricFontManager.getFontForString('basic##nosuchparam:3');
	assertFalsy('nosuchparam' in h.params);
	// the builtin says so
	let e = pfEvaluate('v2:~"apply-pfont to"(_$"basic##nosuchparam:3" [word](_[letter]"a"_)_)');
	assertTruthy(Utils.isFatalError(e));
	let e2 = pfEvaluate('v2:~"apply-pfont to"(_$"basic#corpus:0.5#" [word](_[letter]"a"_)_)');
	assertTruthy(Utils.isFatalError(e2));
	let ok = pfEvaluate('v2:~"apply-pfont to"(_$"basic##curve:0" [word](_[letter]"a"_)_)');
	assertFalsy(Utils.isFatalError(ok));
	assertEqual(ok.getChildAt(0).pfont.params.curve, 0);
}

function TEST_pfont_fontstring_parsing() {
	let m = parametricFontManager;
	let p = m.parseFontString('basic');
	assertEqual(p.fontname, 'basic');
	assertEqual(Object.keys(p.pxparams).length, 0);
	assertEqual(Object.keys(p.relparams).length, 0);
	let q = m.parseFontString('basic##');
	assertEqual(Object.keys(q.pxparams).length, 0);
	assertEqual(Object.keys(q.relparams).length, 0);
	let r = m.parseFontString(' basic # fontsize : 20 , # corpus:0.4,, ');
	assertEqual(r.fontname, 'basic');
	assertEqual(r.pxparams.fontsize, 20);
	assertEqual(Object.keys(r.pxparams).length, 1);
	assertEqual(r.relparams.corpus, 0.4);
	assertEqual(m.getFontForString('basic').getFontName(), 'basic');
	assertEqual(m.getFontForString('nosuchfont#fontsize:12#').getFontName(), 'basic');
	assertEqual(m.getFontForString('nosuchfont#fontsize:12#').pxparams.fontsize, 12);
	assertEqual(m.getFontForString(''), null);
	let e = pfEvaluate('v2:~"apply-pfont to"(_$"basic|##" [word](_[letter]"a"_)_)');
	assertTruthy(Utils.isFatalError(e));
	let e2 = pfEvaluate('v2:~"apply-pfont to"(_$"basic##" #3_)');
	assertTruthy(Utils.isFatalError(e2));
}

function TEST_pfont_missing_glyph() {
	let f = parametricFontManager.getFontForString('basic##');
	let fallback = f.getFallbackGlyph();
	assertEqual(f.glyphInfo('€').glyph, fallback);
	assertTruthy(f.glyphInfo('€').glyph != f.getGlyphs()['a']);
	let wanted = '0123456789()[]{}!\'/\\+=*&#@%<>_|~$^.,;:-?"';
	for (let i = 0; i < wanted.length; i++) {
		if (!f.getGlyphs()[wanted[i]]) {
			throw new Error('basic has no glyph for ' + wanted[i]);
		}
		// every glyph draws
		assertTruthy(f.glyphPath(wanted[i]));
	}
	assertTruthy(f.glyphPath('€'));
}

async function TEST_pfont_remove() {
	let doc = pfParse(PF_HELLO);
	doc.setPfont('basic##');
	let e = pfEvaluate('v2:~"apply-pfont to"(_$"" [word](_[letter]"a"_)_)');
	assertEqual(e.getChildAt(0).pfont, null);
	doc.setPfont('');
	let letters = pfLetters(doc);
	for (let i = 0; i < letters.length; i++) {
		assertEqual(letters[i].pfont, null);
		assertEqual(letters[i].pfstring, '');
	}
	doc.setMutable(false);
	pfRender(doc);
	await pfFrames();
	assertEqual(document.querySelectorAll('canvas').length, 0);
	assertTruthy(document.querySelectorAll('.letter').length > 0);
}

function TEST_pfont_lastwritewins() {
	// word then line: the line's font replaces the word's
	let doc = pfParse(PF_HELLO);
	let line = doc.getChildAt(0);
	let word = pfFirstWord(doc);
	word.setPfont('basic#fontsize:20#');
	line.setPfont('basic#fontsize:30#');
	assertEqual(word.getPfstring(), 'basic#fontsize:30#');
	assertEqual(word.getChildAt(0).pfont.pxparams.fontsize, 30);
	// line then word: the word keeps its own
	let doc2 = pfParse(PF_HELLO);
	let line2 = doc2.getChildAt(0);
	let word2 = pfFirstWord(doc2);
	line2.setPfont('basic#fontsize:30#');
	word2.setPfont('basic#fontsize:20#');
	assertEqual(word2.getChildAt(0).pfont.pxparams.fontsize, 20);
	assertEqual(line2.getChildAt(2).pfont.pxparams.fontsize, 30);
	// one parse per string: everything shares the one Font
	assertTruthy(line2.getChildAt(1).pfont === line2.getChildAt(2).getChildAt(0).pfont);
}

function TEST_pfont_saveload_doc() {
	let doc = pfParse(PF_HELLO);
	// no pfont, no change to the format
	assertEqual(pfSave(doc), PF_HELLO.substring(3));
	doc.setPfont('basic#fontsize:40#corpus:0.5');
	let saved = pfSave(doc);
	assertEqual(pfCount(saved, 'basic#'), 1);
	let loaded = pfParse('v2:' + saved);
	assertEqual(loaded.getPfstring(), 'basic#fontsize:40#corpus:0.5');
	let letters = pfLetters(loaded);
	for (let i = 0; i < letters.length; i++) {
		assertEqual(letters[i].pfstring, 'basic#fontsize:40#corpus:0.5');
		assertEqual(letters[i].pfont.params.corpus, 0.5);
	}
	assertEqual(pfSave(loaded), saved);
	// old style private data still loads
	let old = pfParse('v2:[doc]"color: red"(|[line](_[word](_[letter]"a"_)_)|)');
	assertEqual(old.getCurrentStyle(), 'color: red');
	assertEqual(old.getPfstring(), '');
}

function TEST_pfont_saveload_word() {
	let doc = pfParse(PF_HELLO);
	let line = doc.getChildAt(0);
	line.setPfont('basic#fontsize:30#');
	pfFirstWord(doc).setPfont('basic#fontsize:20#');
	// and a word in the line with no pfont at all
	line.getChildAt(2).setPfont('');
	let saved = pfSave(doc);
	assertEqual(pfCount(saved, 'basic#fontsize:30#'), 1);
	assertEqual(pfCount(saved, 'basic#fontsize:20#'), 1);
	let loaded = pfParse('v2:' + saved);
	let lline = loaded.getChildAt(0);
	assertEqual(lline.getPfstring(), 'basic#fontsize:30#');
	assertEqual(pfFirstWord(loaded).getChildAt(0).pfont.pxparams.fontsize, 20);
	assertEqual(lline.getChildAt(1).pfont.pxparams.fontsize, 30);
	assertEqual(lline.getChildAt(2).getChildAt(0).pfont, null);
	assertEqual(lline.getChildAt(3).pfont.pxparams.fontsize, 30);
	assertEqual(pfSave(loaded), saved);
}

function TEST_pfont_saveload_letter() {
	let word = pfParse('v2:[word](_[letter]"a" [letter]"b"_)');
	word.getChildAt(1).setPfont('basic#fontsize:25#');
	let saved = pfSave(word);
	assertEqual(pfCount(saved, 'basic#'), 1);
	let loaded = pfParse('v2:' + saved);
	assertEqual(loaded.getChildAt(0).pfont, null);
	assertEqual(loaded.getChildAt(1).pfstring, 'basic#fontsize:25#');
	assertEqual(loaded.getChildAt(1).pfont.pxparams.fontsize, 25);
	let copy = loaded.getChildAt(1).makeCopy();
	assertEqual(copy.pfstring, 'basic#fontsize:25#');
	assertTruthy(copy.pfont);
	// a letter on its own
	let letter = constructLetter('q');
	letter.setPfont('basic##');
	let l2 = pfParse('v2:' + pfSave(letter));
	assertEqual(l2.pfstring, 'basic##');
}

function TEST_pfont_insert_letter() {
	let doc = pfParse(PF_HELLO);
	doc.setPfont('basic#fontsize:33#');
	let word = pfFirstWord(doc);
	let letter = constructLetter('x');
	word.insertChildAt(letter, 1);
	assertEqual(letter.pfstring, 'basic#fontsize:33#');
	assertEqual(letter.pfont.pxparams.fontsize, 33);
	let letter2 = constructLetter('y');
	word.appendChild(letter2);
	assertEqual(letter2.pfont.pxparams.fontsize, 33);
}

function TEST_pfont_copy() {
	let doc = pfParse(PF_HELLO);
	doc.setPfont('basic#fontsize:30#');
	pfFirstWord(doc).setPfont('basic#fontsize:20#');
	let copy = doc.makeCopy();
	assertEqual(copy.getPfstring(), 'basic#fontsize:30#');
	assertEqual(pfFirstWord(copy).getPfstring(), 'basic#fontsize:20#');
	assertEqual(pfFirstWord(copy).getChildAt(0).pfont.pxparams.fontsize, 20);
	assertEqual(copy.getChildAt(0).getChildAt(1).pfont.pxparams.fontsize, 30);
	assertEqual(pfSave(copy), pfSave(doc));
}

async function TEST_pfont_darktheme() {
	document.documentElement.setAttribute('data-theme', 'dark');
	let doc = pfParse(PF_HELLO);
	doc.setPfont('basic#fontsize:40#linethickness:0.1');
	doc.setMutable(false);
	pfRender(doc);
	await pfFrames();
	let ink = pfInkColor(pfBlocks()[0]);
	// light strokes on the dark ground
	assertTruthy(ink[0] + ink[1] + ink[2] > 450);
	// a word with its own colour is painted in it
	let doc2 = pfParse(PF_HELLO);
	doc2.setPfont('basic#fontsize:40#linethickness:0.1');
	pfFirstWord(doc2).setCurrentStyle('color: rgb(255, 0, 0)');
	doc2.setMutable(false);
	pfRender(doc2);
	await pfFrames();
	assertEqual(pfBlocks().length, 2);
	let ctx = pfBlocks()[1].getContext('2d');
	let data = ctx.getImageData(0, 0, pfBlocks()[1].width, pfBlocks()[1].height).data;
	let red = false;
	for (let i = 0; i < data.length; i += 4) {
		if (data[i + 3] > 200 && data[i] > 200 && data[i + 1] < 80 && data[i + 2] < 80) {
			red = true;
			break;
		}
	}
	assertTruthy(red);
}

async function TEST_pfont_exploded_vs_normal() {
	let doc = pfParse(PF_HELLO);
	doc.setPfont('basic##');
	pfRender(doc);
	await pfFrames();
	// mutable: exploded, plain text
	assertEqual(document.querySelectorAll('canvas').length, 0);
	let letters = document.querySelectorAll('.letter');
	assertTruthy(letters.length > 0);
	assertEqual(letters[0].textContent, 'h');
	// immutable: normal, one canvas
	let doc2 = pfParse(PF_HELLO);
	doc2.setPfont('basic##');
	doc2.setMutable(false);
	pfRender(doc2);
	await pfFrames();
	assertEqual(pfBlocks().length, 1);
	// something that is not plain text inside: drawn a letter at a time
	let doc3 = pfParse('v2:[doc](|[line](_[word](_[letter]"a" #3 [letter]"b"_)_)|)');
	doc3.setPfont('basic##');
	doc3.setMutable(false);
	pfRender(doc3);
	await pfFrames();
	assertEqual(pfBlocks().length, 1);
	assertEqual(document.querySelectorAll('.letter canvas').length, 2);
	// the pfont is still there after being drawn plain
	assertTruthy(pfLetters(doc)[0].pfont);
}

async function TEST_pfont_wrap_narrow() {
	let words = '';
	for (let i = 0; i < 12; i++) {
		words += ' [word](_[letter]"a" [letter]"b" [letter]"c"_) [separator]" "';
	}
	let doc = pfParse(`v2:[doc](|[line](_${words}_)|)`);
	doc.setPfont('basic#fontsize:30#');
	doc.setCurrentStyle('width: 200px');
	doc.setMutable(false);
	pfRender(doc);
	await pfFrames();
	let canvas = pfBlocks()[0];
	let lineHeight = doc.pfont.getLineHeight();
	let pad = parseFloat(canvas.style.margin) * -1;
	let w = parseFloat(canvas.style.width) - 2 * pad;
	let h = parseFloat(canvas.style.height) - 2 * pad;
	assertTruthy(w <= 200);
	// 12 words of three letters do not fit in 200px at 30px
	assertTruthy(h >= 3 * lineHeight - 1);
}

async function TEST_pfont_nested_repaint() {
	let doc = pfParse(PF_HELLO);
	doc.setPfont('basic#fontsize:30#');
	doc.setMutable(false);
	pfRender(doc);
	await pfFrames();
	let canvas = pfBlocks()[0];
	let before = canvas.style.width;
	let word = pfFirstWord(doc);
	let letter = word.getChildAt(0);
	// a shape-only change: repainted, nothing dirty, nothing re-rendered
	letter.setDirtyForRendering(false);
	doc.setDirtyForRendering(false);
	word.setPfont('basic#fontsize:30#corpus:0.5');
	assertFalsy(letter.getDirtyForRendering());
	assertFalsy(doc.getDirtyForRendering());
	await pfFrames();
	assertEqual(pfBlocks()[0], canvas);
	assertEqual(canvas.style.width, before);
	// a width change lays it out again
	word.setPfont('basic#fontsize:60#');
	await pfFrames();
	assertEqual(pfBlocks()[0], canvas);
	assertTruthy(parseFloat(canvas.style.width) > parseFloat(before));
	// text changed from code is noticed without anyone calling setPfont
	let width2 = canvas.style.width;
	word.appendChild(constructLetter('z'));
	await pfFrames();
	assertTruthy(parseFloat(canvas.style.width) > parseFloat(width2));
	assertEqual(canvas.getAttribute('aria-label'), 'helloz 42.');
}
