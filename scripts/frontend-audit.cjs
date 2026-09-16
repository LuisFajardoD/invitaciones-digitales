const { chromium } = require('playwright');
const fs = require('node:fs');
(async () => {
 const browser = await chromium.launch({headless:true});
 const results=[];
 for (const route of ['/index.html','/about.html','/faq.html','/contact.html']) {
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{window.audit={cls:0,lcp:0};new PerformanceObserver(l=>l.getEntries().forEach(e=>{if(!e.hadRecentInput)window.audit.cls+=e.value})).observe({type:'layout-shift',buffered:true});new PerformanceObserver(l=>l.getEntries().forEach(e=>window.audit.lcp=e.startTime)).observe({type:'largest-contentful-paint',buffered:true});});
  await page.goto('http://localhost:3106'+route,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>{const el=document.getElementById('preloader');return !el||getComputedStyle(el).display==='none'},{},{timeout:15000});
  const loaderMs=await page.evaluate(()=>performance.now());
  await page.waitForTimeout(1000);
  results.push({route,loaderMs,errors,...await page.evaluate(()=>({...window.audit,wheelTargets:document.querySelectorAll('.swiper .single').length,backgrounds:document.querySelectorAll('.gloobi-global-bg').length,overflow:document.documentElement.scrollWidth>innerWidth,resources:performance.getEntriesByType('resource').length}))});
  await page.close();
 }
 await browser.close();fs.mkdirSync('.codex-artifacts',{recursive:true});fs.writeFileSync('.codex-artifacts/'+(process.argv[2]||'frontend-audit')+'.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
})().catch(e=>{console.error(e);process.exit(1)});
