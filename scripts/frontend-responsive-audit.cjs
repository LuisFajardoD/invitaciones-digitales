const {chromium}=require('playwright');
const fs=require('node:fs');
(async()=>{
 const b=await chromium.launch({headless:true});const rows=[];
 for(const route of ['/index.html','/about.html','/faq.html','/contact.html']){
  const p=await b.newPage();const errors=[];p.on('pageerror',e=>errors.push(e.message));
  await p.goto('http://localhost:3106'+route,{waitUntil:'domcontentloaded'});
  for(const theme of ['dark','light']){
   await p.evaluate(t=>{document.documentElement.dataset.theme=t;document.body.classList.toggle('light-mode',t==='light');document.body.classList.toggle('dark-mode',t==='dark')},theme);
   for(const width of [1920,1440,1366,768,390,320]){
    await p.setViewportSize({width,height:900});await p.waitForTimeout(100);
    rows.push({route,theme,width,...await p.evaluate(()=>({overflow:document.documentElement.scrollWidth-innerWidth,footer:[...document.querySelectorAll('footer .widget_title,footer .about-text,footer .copyright-text')].map(e=>getComputedStyle(e).color)}))});
   }
  }
  console.log(route,errors);await p.close();
 }
 await b.close();fs.writeFileSync('.codex-artifacts/responsive.json',JSON.stringify(rows,null,2));console.log(rows.filter(r=>r.overflow>0));
})().catch(e=>{console.error(e);process.exit(1)});
