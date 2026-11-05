import { chromium } from 'playwright';
import assert from 'node:assert/strict';
import { readFile, mkdtemp } from 'node:fs/promises';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import {createFrontendServer} from '../scripts/serve.mjs';
(async()=>{
 const artifacts=await mkdtemp(join(tmpdir(),'invent-ui-')); const server=createFrontendServer(); await new Promise(r=>server.listen(4181,'127.0.0.1',r));
 const browser=await chromium.launch({headless:true,...(process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? {executablePath:process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH} : {}),args:JSON.parse(process.env.PLAYWRIGHT_CHROMIUM_ARGS || '["--no-sandbox"]')});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const calls=[];let catalog=Array.from({length:6},(_,i)=>({id:'p'+i,name:i?'A very long product name for layout testing '+i:'Shea butter',price:200000,cost:100000,active:true})),matchAttempts=0,permissions=['*'];
 await page.route('**/api/v1/**',async route=>{
  const req=route.request(),path=new URL(req.url()).pathname,body=req.postDataJSON(); calls.push({path,body});
  let result={},status=200;
  if(path.endsWith('/auth/login')) { if(body.password==='backend-error'){status=500;result={error:{message:'Backend login failed',requestId:'test-request-id',code:'SERVER_ERROR'}};} else if(body.password==='wrong') {status=401;result={message:'Invalid credentials'};} else result={accessToken:'fixture-token',refreshToken:'fixture-refresh',userId:'fixture-user'}; }
  else if(path.endsWith('/auth/register')) result={accessToken:'fixture-token',refreshToken:'fixture-refresh',userId:'fixture-user'};
  else if(path.endsWith('/tenancy/me')) result={organizationId:'fixture-org',userId:'fixture-user',permissions,profile:{name:'Test Owner',email:'test@example.test'},businessName:'Test store',branches:[{id:'branch-1',name:'Main'}]};
  else if(path.endsWith('/payments/managed-account')) result=null;
  else if(path.endsWith('/products/import')) result={created:1,updated:0,skipped:0,errors:[]};
  else if(path.endsWith('/products/p0') && req.method()==='PATCH') {catalog[0]={...catalog[0],...body};result=catalog[0];}
  else if(path.endsWith('/products') && req.method()==='POST') {result={id:'new-product',...body};catalog.push(result);}
  else if(path.endsWith('/products')) result={items:catalog,nextCursor:null};
  else if(path.endsWith('/payments/pay1/match')) {matchAttempts++;if(matchAttempts===1){status=500;result={message:'Temporary allocation error'};}else result={id:'sale1',total:200000};}
  else if(path.endsWith('/payments/manual')) result={id:'cash1',amountMinor:body.amountMinor};
  else if(path.endsWith('/payments')) result={items:[{id:'pay1',method:'cash',providerReference:'CASH-1',amountMinor:'500000'}],nextCursor:null};
  else if(path.endsWith('/reports/sales')) result={items:[],nextCursor:null};
  else if(path.endsWith('/dashboard/summary')) result={revenue:'500000',margin:'100000',salesCount:1};
  else if(path.endsWith('/push/vapid-public-key')) {status=503;result={message:'Push not configured in fixture'};}
  else if(path.endsWith('/auth/change-password')) result={changed:true};
  else if(path.endsWith('/auth/forgot-password')) result={sent:true};
  else if(path.endsWith('/auth/reset-password')) result={reset:true};
  else if(path.endsWith('/auth/verify-email')) result={verified:true};
  await route.fulfill({status,contentType:'application/json',body:JSON.stringify(result)});
 });
 await page.goto('http://127.0.0.1:4181/');
 await page.locator('[data-node-id="694:34"]').waitFor();
 assert.equal(await page.locator('[data-node-id="694:34"]').textContent().then(s=>s.trim()),'Every sale, automatically tracked.');
 assert.equal(calls.length,0,'Landing must not request authenticated data');
 await page.locator('[data-node-id="694:12"]').click();assert(!page.url().includes('#how-it-works'),'Section links must not replace the app route');
 for(const width of [1440,1024,768,390]) {
  await page.setViewportSize({width,height:1000});
  await page.screenshot({path:join(artifacts,`landing-${width}.png`),fullPage:true});
  assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth),false,`Landing overflow at ${width}`);
 }
 await page.setViewportSize({width:1440,height:1000});
 const broken=await page.locator('.landing-design img').evaluateAll(images=>images.filter(i=>!i.complete || !i.naturalWidth).map(i=>i.src));assert.deepEqual(broken,[]);
 await page.locator('[data-node-id="694:15"]').click();await page.waitForURL('**/#/login');
 assert.equal(await page.locator('input[name=email]').inputValue(),'');
 await page.fill('input[name=email]','test@example.test');await page.fill('input[name=password]','wrong');await page.click('#live-auth button[type=submit]');
 await page.getByRole('alert').filter({hasText:'Email or password is incorrect'}).waitFor();
 await page.fill('input[name=password]','backend-error');await page.click('#live-auth button[type=submit]');await page.getByRole('alert').filter({hasText:'test-request-id'}).waitFor();assert.equal(await page.evaluate(()=>sessionStorage.getItem('invent-api-session-v1')),null);assert.equal(await page.locator('input[name=email]').inputValue(),'test@example.test');
 await page.fill('input[name=password]','correct-password');await page.click('#live-auth button[type=submit]');await page.waitForURL('**/#/home');
 await page.getByRole('heading',{name:'Today’s sales'}).waitFor();
 for(const [hash,label] of [['onboarding','Business settings'],['admin','Business settings'],['team','Team'],['weekly-summary','Weekly summary'],['business-settings','Business settings'],['home','Home']]) {await page.goto('http://127.0.0.1:4181/#/'+hash);await page.locator('.side-nav a.active').filter({hasText:label}).waitFor();}
 await page.goto('http://127.0.0.1:4181/#/account');await page.locator('.account-link').waitFor();assert.equal(await page.locator('.side-nav a.active').count(),0,'Account is the footer block; no sidebar item is highlighted');
 await page.goto('http://127.0.0.1:4181/#/home');
 await page.goto('http://127.0.0.1:4181/#/change-password');
 await page.fill('input[name=currentPassword]','correct-password');await page.fill('input[name=newPassword]','next-password');await page.fill('input[name=confirm]','mismatch');await page.click('#live-change-password button[type=submit]');
 assert.equal(calls.filter(c=>c.path.endsWith('/change-password')).length,0);
 await page.fill('input[name=confirm]','next-password');await page.click('#live-change-password button[type=submit]');await page.waitForURL('**/#/login');
 assert.equal(calls.filter(c=>c.path.endsWith('/change-password')).length,1);
 assert.equal(await page.evaluate(()=>sessionStorage.getItem('invent-api-session-v1')),null);
 await page.goto('http://127.0.0.1:4181/#/create');
 await page.fill('input[name=name]','Test Owner');await page.fill('input[name=businessName]','Store');await page.fill('input[name=email]','new@example.test');await page.fill('input[name=password]','new-password');await page.click('#live-auth button[type=submit]');await page.waitForURL('**/#/verify-pending');await page.getByText('new@example.test').first().waitFor();
 assert(!('confirm' in calls.find(c=>c.path.endsWith('/auth/register')).body));
 await page.goto('http://127.0.0.1:4181/reset-password?token=test-reset');await page.waitForURL('**/#/reset?token=test-reset');
 await page.fill('input[name=password]','reset-password');await page.fill('input[name=confirm]','reset-password');await page.click('#live-auth button[type=submit]');await page.waitForURL('**/#/login');
 assert.equal(calls.find(c=>c.path.endsWith('/auth/reset-password')).body.token,'test-reset');
 await page.goto('http://127.0.0.1:4181/#/login');await page.fill('input[name=email]','test@example.test');await page.fill('input[name=password]','correct-password');await page.click('#live-auth button[type=submit]');await page.waitForURL('**/#/home');
 await page.getByText('CASH-1',{exact:false}).first().waitFor();await page.locator('[data-live=begin-match]').first().click();await page.waitForURL('**/#/match-payment');await page.locator('.selection-grid').waitFor();
 for(const width of [1440,1280,1024,768,390]) {
  await page.setViewportSize({width,height:1000});
  const geometry=await page.evaluate(()=>{
   const cards=[...document.querySelectorAll('.pick-card')].map(e=>e.getBoundingClientRect()); const review=document.querySelector('.selection-grid > section:last-child').getBoundingClientRect();
   return {overflow:document.documentElement.scrollWidth>innerWidth,overlap:cards.some(c=>c.left<review.right&&c.right>review.left&&c.top<review.bottom&&c.bottom>review.top)};
  });
  assert.equal(geometry.overflow,false,`overflow at ${width}`);assert.equal(geometry.overlap,false,`sale panel overlap at ${width}`);
 }
 await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:join(artifacts,'payment-picker.png'),fullPage:true});

 await page.getByRole('button',{name:'Add one Shea butter',exact:true}).click();
 await page.getByRole('button',{name:'Confirm sale',exact:true}).click();
 await page.locator('#allocate-error').filter({hasText:'Temporary allocation error'}).waitFor();
 await page.getByRole('button',{name:'Confirm sale',exact:true}).click();await page.waitForURL('**/#/sales');
 const matches=calls.filter(c=>c.path.endsWith('/payments/pay1/match'));
 assert.equal(matches.length,2);assert.equal(matches[0].body.idempotencyKey,matches[1].body.idempotencyKey);
 assert.deepEqual(matches[0].body.items,[{productId:'p0',qty:1}]);
 await page.goto('http://127.0.0.1:4181/#/products');await page.locator('#live-search').fill('Shea');
 await page.locator('#live-catalog .prod-row').waitFor();assert.equal(await page.locator('#live-catalog .prod-row').count(),1);
 await page.locator('#live-search').fill('unmatched');await page.getByRole('heading',{name:'No matching products'}).waitFor();
 await page.goto('http://127.0.0.1:4181/#/catalog-new');
 await page.fill('input[name=name]','<img src=x onerror=alert(1)>');await page.fill('input[name=price]','1500.25');await page.fill('input[name=cost]','900.10');await page.click('#live-product button.primary');await page.waitForURL('**/#/products');
 const productCall=calls.find(c=>c.path.endsWith('/products') && c.body?.name);assert.equal(productCall.body.price,150025);assert.equal(productCall.body.cost,90010);
 await page.locator('#live-search').fill('<img');await page.getByText('<img src=x onerror=alert(1)>',{exact:true}).waitFor();assert.equal(await page.locator('#live-catalog img[src="x"]').count(),0);
 await page.goto('http://127.0.0.1:4181/#/catalog-edit?id=p0');await page.fill('input[name=name]','Edited product');await page.click('#live-product button[type=submit]');await page.waitForURL('**/#/products');assert.equal(calls.find(c=>c.path.endsWith('/products/p0')).body.name,'Edited product');
 await page.goto('http://127.0.0.1:4181/#/import');
 await page.locator('#live-csv').setInputFiles({name:'catalog.csv',mimeType:'text/csv',buffer:Buffer.from('name,sku,price,cost\nImported item,SKU001,1200,500')});
 await page.locator('[data-live=import-submit]').click();await page.getByRole('heading',{name:'Import complete'}).waitFor();assert(calls.find(c=>c.path.endsWith('/products/import')).body.csv.includes('SKU001'));
 await page.goto('http://127.0.0.1:4181/#/record-payment');await page.fill('input[name=amount]','2500');await page.click('#live-cash-payment button[type=submit]');await page.waitForURL('**/#/match-payment');
 const cash=calls.find(c=>c.path.endsWith('/payments/manual'));assert.equal(cash.body.amountMinor,'250000');assert.equal(cash.body.branchId,'branch-1');
 await page.goto('http://127.0.0.1:4181/#/verify-email?token=verify-test');await page.getByRole('heading',{name:'Email verified',exact:true}).waitFor();assert.equal(calls.find(c=>c.path.endsWith('/auth/verify-email')).body.token,'verify-test');
 await page.goto('http://127.0.0.1:4181/#/account');await page.locator('[data-live=logout]').click();await page.waitForURL('**/#/login');assert.equal(await page.evaluate(()=>sessionStorage.getItem('invent-api-session-v1')),null);


 permissions=['catalog.read'];
 await page.fill('input[name=email]','test@example.test');await page.fill('input[name=password]','correct-password');await page.click('#live-auth button[type=submit]');await page.waitForURL('**/#/home');await page.locator('.side-nav').waitFor();
 await page.goto('http://127.0.0.1:4181/#/catalog-new');await page.getByRole('heading',{name:'You don’t have access'}).waitFor();assert.equal(await page.locator('#live-product').count(),0);
 await page.setViewportSize({width:390,height:1000});assert.equal(await page.locator('.live-nav').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length),3);
 assert.deepEqual(errors,[]); console.log('PASS: React landing, API login/signup/password/reset and responsive sale picker; screenshots: '+artifacts); await browser.close();await new Promise(r=>server.close(r));
})().catch(e=>{console.error(e);process.exit(1);});
