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

module.exports = {
	runTest: function(testinput, method) {
		(async() => {
			let normal_out = process.argv[2];
			let exploded_out = process.argv[3];
//			const browser = await puppeteer.launch({headless:false, slowMo:250});
			const browser = await puppeteer.launch();
			const page = await browser.newPage();
			await page.goto('http://localhost:3000', {waitUntil: 'networkidle2'});
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
					}
				}
			} else {
				// legacy mode, where we call the javascript 'doKeyInput' method
				await page.evaluate(testinput);
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
}

