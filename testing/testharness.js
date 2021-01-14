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




const puppeteer = require('puppeteer');

const readline = require('readline');


const rl = readline.createInterface({
	input: process.stdin,
	output: process.stdout
})

rl.on('line', (input) => {
	if (!paused) {
		paused = true;
	} else {
		if ('' + input == '') {
			step = true;
		} else {
			switch(input) {
				case '1': speed = 1; break;
				case '2': speed = 2; break;
				case '3': speed = 3; break;
			}
			paused = false;
		}
	}
})

var speed = 1;
var step = false;
var paused = false;

function delay(timeout) {
	return new Promise((resolve) => {
		setTimeout(resolve, timeout);
	});
}

function runTest(testinput, method) { // legacy
	runTestImpl(testinput, method, true /* legacy */, null);
}

function runTestNew(testinput, method) {
	runTestImpl(testinput, method, false /* legacy */, null);
}

function runTestWithFlags(testinput, method, flags) {
	runTestImpl(testinput, method, false /* legacy */, flags);
}

function runUnitTest(testinput) {
	runTest(testinput, 'indirect', false);
}

function spaces(n) {
	n += 30; // number of lines in the file before the test stuff starts.
			// doesn't work for the old tests.
	if (n < 10) return '    ' + n;
	if (n < 100) return '   ' + n;
	if (n < 1000) return '  ' + n;
	if (n < 10000) return ' ' + n;
	return n;
}

function pausableAction(t) {
	if (t.type == 'keyup' || t.type == 'pause') return false;
	if (t.code) {
		switch(t.code) {
			case 'ShiftLeft': return false;
			case 'ShiftRight': return false;
			case 'MetaLeft': return false;
			case 'MetaRight': return false;
			case 'AltLeft': return false;
			case 'AltRight': return false;
			case 'ControlLeft': return false;
			case 'ControlRight': return false;
		}
	}
	return true;
}

function toQueryString(flags) {
	let str = '';
	let doSep = ((s) => (s == '' ? '?' : '&'));
	for (let flag in flags) {
		let value = flags[flag];
		if (typeof value == 'boolean') {
			value = (value ? '1' : '0');
		} else {
			value = '' + value;
		}
		str += doSep(str) + flag + '=' + value;
	}
	return str;
}

function getLegacyDefaultFlags() {
	return {
		'DISABLE_ALERT_ANIMATIONS': true, // override, see globalappflags.js
		'V2_INSERTION_LENIENT_DOC_FORMAT': true,
		'NO_COPY_CSS': false,
		'BETTER_KEYBINDINGS': false,

		// splash screen was added later, we never want it in tests.
		'NO_SPLASH': true,

		'REMAINING_EDITORS': false,
		'CAN_HAVE_EMPTY_ROOT': false,

		'NEW_CLOSURE_DISPLAY' : false,

		// ugh why did I use both ctrl and option?
		'THE_GREAT_MAC_WINDOWS_OPTION_CTRL_SWITCHAROO': false,

		// save evaluates contents
		'SAVE_EVALUATES_CONTENTS': false,

		// org overhaul
		'ORG_OVERHAUL': false

	};
}

function runTestImpl(testinput, method, legacy, flags) {
	(async() => {
		let normal_out = process.argv[2];
		let exploded_out = process.argv[3];
		let headful = (process.argv[4] == "yes");
		let params = '';
		if (process.argv.length >= 6) {
			params = process.argv[5];
			if (params && params.indexOf('?') != 0) {
				params = '?' + params;
			}			
		} else {
			if (!flags) {
				params = toQueryString(getLegacyDefaultFlags())
			} else {
				params = toQueryString(flags);
			}
		}
		let dolog = headful;
		let browser = null;
		if (headful) {
			browser = await puppeteer.launch({headless:false});
		} else {
			browser = await puppeteer.launch();
		}
		const page = await browser.newPage();
		page.on('console', msg => {
			for (let i = 0; i < msg.args().length; ++i) {
			    console.log(`${i}: ${msg.args()[i]}`);
			}
			})
		if (headful) console.log("enter to pause, enter to step, anything+enter to resume")
		await page.goto('http://localhost:3000' + params, {waitUntil: 'networkidle2'});
		// I recorded a bunch of tests that used shift-enter to mean "execute and replace"
		// before I changed the meaning of shift-enter to "execute and leave"
		if (legacy) {
			await page.evaluate(function() {
				window.legacyEnterBehaviorForTests = true;
			})
		}
		if (method == 'direct') {
			await page.evaluate(function() {
				doKeyInput('Escape', 'Escape', false, false, false);
			})
			// we have logged all browser interactions directly, the new way.
			for (let i = 0; i < testinput.length; i++) {
				let t = testinput[i];
				if (pausableAction(t) && paused && !step) {
					i--;
					await delay(2);
					continue;
				}
				step = false;
				switch(t.type) {
					case 'click':
						if (dolog) console.log(`${spaces(i)}. click:   ${t.x}, ${t.y}`)
						await page.mouse.click(Number(t.x), Number(t.y));
						break;
					case 'keydown':
						if (dolog) console.log(`${spaces(i)}. keydown: ${t.code}`);
						await page.keyboard.down(t.code);
						break;
					case 'keyup':
						if (dolog) console.log(`${spaces(i)}. keyup:         (${t.code})`);
						await page.keyboard.up(t.code);
						break;
					case 'pause':
						if (dolog) console.log(`${spaces(i)}. pause`);
						await page.waitFor(t.length);
						break;
				}
				if (headful) {
					switch(speed) {
						case 1: await delay(250); break;
						case 2: await delay(150); break;
						case 3: await delay(50); break;

					}					
				} else {
					await delay(2);
				}
			}
		} else {
			// legacy mode, where we call the javascript 'doKeyInput' method
			await page.evaluate(testinput);
			// wait for the event queue to finish I guess
			await delay(150);
		}
		await page.screenshot({path: exploded_out});
		// if (headful) {
		// 	await delay(10000);
		// }
		await page.evaluate(function() {
			doKeyInput('Escape', 'Escape', false, false, false);
		})
		await rl.close();
		await page.screenshot({path: normal_out});
		await browser.close();
	})().catch((error) => {
		console.log("TEST FAILED");
		console.error(error);
		//await browser.close();
		process.exit(1);
	});
}

module.exports = { runTest, runTestNew, runUnitTest, runTestWithFlags }

