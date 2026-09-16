const {chromium}=require('playwright');const fs=require('node:fs');
(async()=>{
 const b=await chromium.launch({headless:true});const p=await b.newPage({viewport:{width:1440,height:900}});const errors=[],bad=[];p.on('pageerror',e=>errors.push({url:p.url(),message:e.message}));p.on('response',r=>{if(r.status()>=400)bad.push([r.url(),r.status()])});
 await p.addInitScript(()=>localStorage.setItem('site-theme-mode','dark'));
 await p.goto('http://localhost:3105/invitaciones',{waitUntil:'networkidle'});
 await p.getByRole('group',{name:'Tipo de invitación',exact:true}).getByLabel('Web Premium').check();
 await p.getByRole('group',{name:'Categoría',exact:true}).getByLabel('Infantiles',{exact:true}).check();
 await p.getByLabel('Temático',{exact:true}).check();
 const catalog={url:p.url(),count:await p.getByRole('status').innerText()};
 await p.getByRole('button',{name:/Vista previa de/}).first().click();await p.getByRole('button',{name:'Cerrar',exact:true}).last().click();
 await p.getByRole('button',{name:'Limpiar filtros',exact:true}).first().click();
 const responsive=[];
 for(const width of [1920,1440,1366,768,390,320]){await p.setViewportSize({width,height:900});responsive.push({width,overflow:await p.evaluate(()=>document.documentElement.scrollWidth-innerWidth)})}
 await p.getByRole('button',{name:'Filtros',exact:true}).click();catalog.mobileOrder=await p.locator('dialog legend').allTextContents();await p.keyboard.press('Escape');
 await p.getByRole('button',{name:'Activar modo claro'}).click();catalog.lightFooter=await p.locator('footer h3').first().evaluate(e=>getComputedStyle(e).color);
 const routes=[];for(const path of ['/','/examples','/admin/login','/admin/invitations','/admin/invitations/11111111-1111-4111-8111-111111111111','/i/cumple-7-luis-arturo-astronautas']){const response=await p.goto('http://localhost:3105'+path,{waitUntil:'domcontentloaded'});routes.push({path,status:response.status(),url:p.url()})}
 await p.goto('http://localhost:3105/index.html',{waitUntil:'domcontentloaded'});await p.setViewportSize({width:1440,height:900});await p.locator('#mensaje').scrollIntoViewIfNeeded();await p.waitForTimeout(2500);const video=await p.locator('.gloobi-memory-video').evaluate(v=>({time:v.currentTime,paused:v.paused,quality:v.getVideoPlaybackQuality().toJSON?.()||{total:v.getVideoPlaybackQuality().totalVideoFrames,dropped:v.getVideoPlaybackQuality().droppedVideoFrames}}));
 await p.screenshot({path:'.codex-artifacts/memory-audit.png'});
 await b.close();const data={catalog,responsive,routes,video,errors,bad};fs.writeFileSync('.codex-artifacts/interactions.json',JSON.stringify(data,null,2));console.log(JSON.stringify(data,null,2));
})().catch(e=>{console.error(e);process.exit(1)});
