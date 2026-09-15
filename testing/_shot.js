const puppeteer = require('puppeteer');
const KEYS = require('/tmp/claude-1000/-home-eeeeaaii-repos-vodka/3892787a-d5b3-4407-80fa-2c0af5e16604/scratchpad/gainkeys.json');
const out = process.argv[2];
const extra = process.argv[3] || '';
(async () => {
  const b = await puppeteer.launch({args:['--no-sandbox','--disable-setuid-sandbox']});
  const p = await b.newPage();
  await p.setViewport({width:1100, height:760});
  await p.goto('http://localhost:3001/?NO_SPLASH=1' + extra, {waitUntil:'networkidle2'});
  await p.waitForFunction(()=>!!window.__vodkaReady, {timeout:15000});
  for (const k of KEYS) { if (k.t=='keydown') await p.keyboard.down(k.c); else await p.keyboard.up(k.c); await new Promise(r=>setTimeout(r,3)); }
  await new Promise(r=>setTimeout(r,2200));
  await p.screenshot({path: out});
  await b.close();
})();
