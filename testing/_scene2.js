const puppeteer = require('puppeteer');
const out = process.argv[2], theme = process.argv[3] || '';
(async () => {
  const b = await puppeteer.launch({args:['--no-sandbox','--disable-setuid-sandbox']});
  const p = await b.newPage();
  await p.setViewport({width:1200, height:820});
  await p.goto('http://localhost:3001/?sessionId=samples&runfile=cc3&NO_SPLASH=1' + theme, {waitUntil:'networkidle2'});
  await p.waitForFunction(()=>!!window.__vodkaReady, {timeout:15000});
  await new Promise(r=>setTimeout(r,1500));
  await p.keyboard.press('Escape');           // toggle exploded
  await new Promise(r=>setTimeout(r,1500));
  await p.screenshot({path: out});
  await b.close();
})();
