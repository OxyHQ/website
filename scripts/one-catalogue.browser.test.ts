/** Synthetic catalogue fixtures only; blocks every external network request. */
import {chromium} from 'playwright'
import {join} from 'node:path'
const root=join(import.meta.dir,'..')
const reserved=Bun.serve({port:0,fetch:()=>new Response('reserved')});const port=reserved.port;reserved.stop(true)
const preview=Bun.spawn(['bun','x','vite','preview','--host','127.0.0.1','--port',String(port),'--strictPort'],{cwd:root,stdout:'ignore',stderr:'ignore'})
const origin=`http://127.0.0.1:${port}`
let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined
function assert(value:unknown,message:string):asserts value {if(!value)throw new Error(message)}
try {
 for(let i=0;i<50;i++){try{if((await fetch(origin)).ok)break}catch{}await Bun.sleep(100)}
 browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_EXECUTABLE||undefined,args:['--no-sandbox']})
 const page=await browser.newPage({viewport:{width:1440,height:1000}})
 await page.emulateMedia({reducedMotion:'reduce'})
 let configured=false
 await page.route('**/*',route=>{
  const url=new URL(route.request().url())
  if(url.pathname.endsWith('/billing/personal-plans'))return route.fulfill({json:configured?
   {schemaVersion:1,state:'configured',purchase:'unavailable',plans:[{offerId:'synthetic-qa-only',offerVersion:1,displayName:'Synthetic QA · Oxy One Personal',audience:'personal',kind:'oxy_one',benefits:[
    {displayName:'Alia · monthly credits; existing daily refill remains',benefit:{kind:'quota',productId:'synthetic-alia',key:'monthly_credits',unit:'alia_credit',included:10000,combination:'maximum'}},
    {displayName:'Shared storage · including Noted attachments',benefit:{kind:'quota',productId:'synthetic-storage',key:'storage_bytes',unit:'byte',included:100000000000,combination:'maximum'}},
    {displayName:'Mention · mono personalization',benefit:{kind:'capability',productId:'synthetic-mention',key:'mono_theme'}}]}]}:
   {schemaVersion:1,state:'unconfigured',purchase:'unavailable',plans:[]}})
  return url.origin===origin?route.continue():route.abort()
 })
 await page.goto(`${origin}/one/`,{waitUntil:'networkidle'})
 await page.getByText('Oxy One is not available to purchase yet.',{exact:false}).waitFor()
 assert(await page.locator('a[href="https://accounts.oxy.so/payments"]').count()===1,'Accounts handoff missing')
 configured=true;await page.reload({waitUntil:'networkidle'})
 await page.getByText('Synthetic QA · Oxy One Personal',{exact:true}).waitFor()
 await page.getByText('100 GB',{exact:true}).waitFor()
 await page.getByText('Mention · mono personalization',{exact:true}).waitFor()
 await page.getByText('Shared storage · including Noted attachments',{exact:true}).waitFor()
 await page.getByText('Purchasing is unavailable',{exact:true}).waitFor()
 assert(await page.locator('a[href*="checkout"],button:has-text("Buy")').count()===0,'Checkout must remain unavailable')
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Desktop overflow')
 await page.evaluate(()=>document.fonts.ready)
 await page.waitForTimeout(600)
 if(process.env.ONE_QA_SCREENSHOT_DIR)await page.screenshot({path:join(process.env.ONE_QA_SCREENSHOT_DIR,'oxy-one-configured-qa-desktop.png'),fullPage:true,animations:'disabled'})
 await page.setViewportSize({width:390,height:844})
 assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile overflow')
 if(process.env.ONE_QA_SCREENSHOT_DIR)await page.screenshot({path:join(process.env.ONE_QA_SCREENSHOT_DIR,'oxy-one-configured-qa-mobile.png'),fullPage:true,animations:'disabled'})
 console.log('[one-catalogue] passed: production route, SDK fixtures, disabled checkout, desktop/mobile limits')
}finally {await browser?.close();preview.kill();await preview.exited}
