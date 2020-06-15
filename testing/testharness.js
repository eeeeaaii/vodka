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

function delay(timeout) {
	return new Promise((resolve) => {
		setTimeout(resolve, timeout);
	});
}

function runTest(testinput, method) { // legacy
	runTestImpl(testinput, method, true /* legacy */);
}

function runTestNew(testinput, method) {
	runTestImpl(testinput, method, false /* legacy */);
}

function runTestImpl(testinput, method, legacy) {
	(async() => {
		let normal_out = process.argv[2];
		let exploded_out = process.argv[3];
//			const browser = await puppeteer.launch({headless:false, slowMo:250});
		const browser = await puppeteer.launch();
		const page = await browser.newPage();
		page.on('console', msg => {
			for (let i = 0; i < msg.args().length; ++i) {
			    console.log(`${i}: ${msg.args()[i]}`);
			}
			})
		await page.goto('http://localhost:3000', {waitUntil: 'networkidle2'});
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
				switch(t.type) {
					case 'click':
						await page.mouse.click(Number(t.x), Number(t.y));
						break;
					case 'keydown':
						await page.keyboard.down(t.code);
						break;
					case 'keyup':
						await page.keyboard.up(t.code);
						break;
					case 'pause':
						await page.waitFor(t.length);
						break;
				}
				await delay(2);
			}
		} else {
			// legacy mode, where we call the javascript 'doKeyInput' method
			await page.evaluate(testinput);
			// wait for the event queue to finish I guess
			await delay(150);
		}
		await page.screenshot({path: exploded_out});
		await page.evaluate(function() {
			doKeyInput('Escape', 'Escape', false, false, false);
		})
		
		await page.screenshot({path: normal_out});
		await browser.close();
	})().catch((error) => {
		console.log("TEST FAILED");
		console.error(error);
//			await browser.close();
		process.exit(1);
	});
}

module.exports = { runTest, runTestNew }

