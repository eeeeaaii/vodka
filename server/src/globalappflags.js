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

// TODO: change some of these to preferences and store in a cookie maybe.


// These flags are recorded in the test files.
// Whatever values are set for these flags when you record the test,
// whether it's their default value or the value passed in via 
// the query string, becomes part of the experiment config
// for that test and will be set every time it is run.
//
// These flags are typically used for gradually introducing a feature.
// The process would be:
//
// 1. Create the flag, test the new feature by passing in the flag in
//    the query string. Don't do this for too long (see 4, below)
// 2. When you're feeling more confident, make the flag default to the
//    new behavior, and change getLegacyDefaultFlags in testharness.js
//    to default to the old behavior.
// 3. If you've decided that this new behavior is the way it will be,
//    forever, and want to clean up the code and get rid of all the if
//    statements that branch on the flag, change the value in getLegacyDefaultFlags,
//    run the old tests, and look for problems. Fix them.
// 4. If you recorded any new tests between stage 1 and 2, those will
//    have the old behavior saved in the test config. You'll have to 
//    manually change each of those tests to pass the flag for the new
//    behavior.
// 5. If all the tests pass with the flag value that specifies the new
//    behavior, then you can burn in that behavior permanently.
// 6. There will be tests saved with this flag in the test config. This
//    means it's probably a bad idea to reuse flag key names. To prevent
//    that, keep it here with a comment saying // UNUSED BUT DO NOT REUSE

const experiments = {
	'DISABLE_ALERT_ANIMATIONS': false,

	// This is the max render depth. We want some tests to be saved with a small
	// max render depth, because test screenshots are small (example, see
	// graphics_general_renderdepthexceeded). The value given here
	// used to be a const, now it is always passed in via flags.
	'MAX_RENDER_DEPTH': 100,

	// When true, this stops vodka from displaying the splash screen. That would
	// of course interfere with screenshots.
	'NO_SPLASH': false,

	// stop being lenient
	'V2_INSERTION_LENIENT_DOC_FORMAT': false,

	// runtime in webasm
	'ASM_RUNTIME': false,
	// See note above about changing testharness.js when adding new flags.

	// I think I will make this a user-settable option at some point
	'OLD_ARROW_KEY_TRAVERSAL': false,

	// will also be a user-settable option: if true, when you normal-eval
	// something, and an error is returned, the error replaces the thing
	// you normal-evaled (just like a returned non-error would have)
	// if false, the returned error is pushed into the parent as a previous
	// sibling of the thing you evaluated.
	'ERRORS_REPLACE': true,

	// if true, the pips don't flash - useful for tests
	'STATIC_PIPS': false,
};

// These flags aren't saved as part of the test. You should probably
// never record a test with any of these flags set to any other value
// than the default value given here, because if your test relies on
// this flag being set, it will break when it's run by the test harness.
// These flags are the ones you would use temporarily for debugging
// but they should not represent features that are gradually being
// phased in.
const otherflags = {
	'DEFAULT_TO_PARAMETRIC_FONTS': false,
	'DEBUG_EXPECTATIONS': false,
	'FILE': '',
	'NO_UNDO': true,
}

// If a flag has a certain default value that rarely/never works for
// tests for whatever reasons, we can override it
// here. Whatever value you set for that flag when the test is
// recorded will be ignored (whether that flag is set via
// live defaults or via query string). Instead, the override value is
// saved in the test file/config for all new tests. testHarness
// should probably also set the flag this way in getLegacyDefaultFlags
// for legacy tests (even if these flags are maybe not the
// way those legacy tests were originally recorded)
//
// Note 5/11/2022: if you want flag overrides that only apply to newly
// recorded tests, put them here. However if you want to globally override
// a flag, even for old tests, do it in testharness.js.
const overrides = {
	'DISABLE_ALERT_ANIMATIONS': true,
	'NO_SPLASH': true,
}

// some hard coded things here

function tryToSetFlag(flagset, key, value) {
	if (typeof flagset[key] !== 'undefined') {
		if (typeof flagset[key] == 'boolean') {
			value = parseBooleanValue(value);
		}
		flagset[key] = value;
		return true;
	} else {
		return false;
	}
}

function setAppFlags() {
	let params = new URLSearchParams(window.location.search);
	params.forEach(function(value, key) {
		// don't throw an exception when an unknown flag
		// is passed because old test configs could contain
		// basically anything
		tryToSetFlag(experiments, key, value)
			|| tryToSetFlag(otherflags, key, value);
	})
}

function parseBooleanValue(v) {
	if (v == 1 || v == '1') return true;
	if (v == 'true') return true;
	if (v == 'false' || v == '0' || v == 0) return false;
	return !!v;
}

function getExperimentsAsString() {
	let exps = {};
	for (let key in experiments) {
		exps[key] = experiments[key];
	}
	for (let key in overrides) {
		exps[key] = overrides[key];
	}
	let s = JSON.stringify(exps);
	s = s.replace(/,/g, ',\n');
	s = s.replace(/{/g, '{\n');
	s = s.replace(/}/g, '\n}');
	return `
const experiment_flags = ${s};
	`;
}


export { experiments,
	     otherflags,
		 setAppFlags,
		 getExperimentsAsString }
