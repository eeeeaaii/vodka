const puppeteer = require('puppeteer');
(async () => {
  const b = await puppeteer.launch({args:['--no-sandbox','--disable-setuid-sandbox']});
  const p = await b.newPage();
  await p.goto('http://localhost:3001/?sessionId=samples&runfile=cc3&NO_SPLASH=1&theme=dark', {waitUntil:'networkidle2'});
  await p.waitForFunction(()=>!!window.__vodkaReady, {timeout:15000});
  await new Promise(r=>setTimeout(r,1200)); await p.keyboard.press('Escape'); await new Promise(r=>setTimeout(r,1500));
  console.log(JSON.stringify(await p.evaluate(() => {
    const ls = [...document.querySelectorAll('.letter')].slice(0,6);
    return ls.map(l => ({ t: l.innerText.slice(0,3), c: getComputedStyle(l).color,
                          f: getComputedStyle(l).fontFamily.slice(0,22),
                          inline: (l.getAttribute('style')||'').slice(0,60) }));
  }), null, 1));
  await b.close();
})();
