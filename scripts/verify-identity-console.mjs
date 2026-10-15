/** Browser checks for the four-question views, the simulator, the credential pipeline and its focused views. */
import assert from 'node:assert/strict';
import {homedir} from 'node:os';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {chromium}=require(process.env.PLAYWRIGHT_PACKAGE??`${homedir()}/.cache/ms-playwright-go/1.57.0/package`);
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH??`${homedir()}/.cache/ms-playwright/chromium-1223/chrome-linux64/chrome`,headless:true});
const url=`${process.env.IDENTITY_BASE_URL??'http://localhost:4321'}/aws-identity-credential-flows`;
const page=await browser.newPage({viewport:{width:1536,height:950}});const errors=[];page.on('pageerror',error=>errors.push(error.message));
try{
 await page.goto(url);await page.waitForSelector('.ip-enhanced');
 assert.equal(await page.locator('[data-lsn-view].is-active').getAttribute('id'),'four-questions','The four questions open the page');
 await page.goto(`${url}#four-pillars`);
 const verdict=()=>page.locator('[data-iq-verdict]').innerText();
 const expected={basic:/^ALLOWED/,where:/^DENIED[\s\S]*Implicit deny/,deny:/^DENIED[\s\S]*Explicit deny/,cross:/^DENIED[\s\S]*bucket policy must allow/};
 for(const [id,pattern] of Object.entries(expected)){await page.locator(`[data-iq-preset="${id}"]`).click();assert.match(await verdict(),pattern,`${id} preset`)}
 await page.locator('input[name=bucket]').check();assert.match(await verdict(),/^ALLOWED[\s\S]*Both accounts/);
 await page.locator('input[name=identity]').uncheck();assert.match(await verdict(),/^DENIED[\s\S]*identity policy must allow/);
 await page.locator('input[value=same]').check();assert.match(await verdict(),/^ALLOWED/,'In one account the bucket policy alone allows it');
 await page.locator('input[name=boundary]').uncheck();assert.match(await verdict(),/^DENIED[\s\S]*boundary/,'A boundary caps a bucket-policy grant to a role');
 await page.locator('input[name=boundary]').check();await page.selectOption('select[name=require]','office-ip');await page.locator('input[value=endpoint]').check();
 assert.match(await page.locator('[data-iq-rows]').innerText(),/no aws:SourceIp/);assert.match(await verdict(),/^DENIED/);
 await page.locator('input[value=anonymous]').check();assert.ok(await page.locator('input[name=scp]').isDisabled());
 assert.equal(await page.locator('[data-iq-presets] [aria-pressed=true]').count(),0,'Editing a control leaves the presets');
 await page.goto(`${url}#identity-map`);await page.waitForSelector('.ip-enhanced');
 assert.equal(await page.locator('[data-ip-stage]').count(),6);
 assert.equal(await page.locator('[data-ip-box]').count(),29);
 assert.equal(await page.locator('[data-ip-flow]').count(),9);
 assert.equal(await page.locator('.ip-more-flows').getAttribute('open'),null,'Additional routes start collapsed');
 assert.equal(await page.locator('[data-lsn-view]').count(),18);
 assert.ok((await page.locator('.lsn-index').boundingBox()).height<90,'Grouped top index is compact');
 await page.locator('[data-ip-flow="iam-user"]').click();
 const boxKeys=await page.locator('[data-ip-box]').evaluateAll(nodes=>nodes.map(node=>node.dataset.ipBox));
 for(const key of boxKeys){
  const box=page.locator(`[data-ip-box="${key}"]`);await box.click();
  assert.equal(await box.getAttribute('aria-pressed'),'true',`${key} must be selected`);
  assert.equal(await page.locator('.ip-box-inspector:visible').count(),1,`${key} must open its explanation`);
  assert.equal(await page.locator('.ip-example:visible').count(),0,`${key} should replace the code example`);
  assert.ok((await page.locator('[data-ip-box-summary]').textContent()).length>45,`${key} needs useful context`);
  assert.match(await page.locator('[data-ip-box-source]').getAttribute('href'),/^https:\/\/docs\.aws\.amazon\.com\//);
 }
 await page.locator('[data-ip-box="3:assume"]').focus();await page.keyboard.press('Enter');
 assert.equal(await page.locator('[data-ip-flow="iam-user"]').getAttribute('aria-pressed'),'true','Inspecting a box must not silently change routes');
 await page.locator('[data-ip-box-route]').click();
 assert.equal(await page.locator('[data-ip-flow="cross-account"]').getAttribute('aria-pressed'),'true');
 assert.equal(await page.locator('.ip-example:visible').count(),1);
 await page.locator('[data-ip-flow="iam-user"]').click();assert.equal(await page.locator('.ip-box-inspector:visible').count(),0);
 const flowIds=await page.locator('[data-ip-flow]').evaluateAll(nodes=>nodes.map(node=>node.dataset.ipFlow));
 for(const id of flowIds){const button=page.locator(`[data-ip-flow="${id}"]`);if(await button.evaluate(node=>!!node.closest('.ip-more-flows'))&&!(await page.locator('.ip-more-flows').evaluate(node=>node.open)))await page.locator('.ip-more-flows summary').click();await button.click();assert.equal(await button.getAttribute('aria-pressed'),'true');assert.equal(await page.locator('.ip-flow-state:visible').count(),1);assert.equal(await page.locator('.ip-sample:visible').count(),1)}
 await page.locator('[data-ip-flow="denied"]').click();assert.match(await page.locator('.ip-flow-state:visible').textContent(),/S3 denies ListBucket/);assert.equal(await page.locator('[data-ip-stage="5"]').getAttribute('class').then(s=>s.includes('is-denied')),true);
 for(const key of ['direct','cli','sdk','web','saml']){await page.locator(`[data-ip-sample="${key}"]`).click();assert.equal(await page.locator(`[data-ip-sample="${key}"]`).getAttribute('aria-pressed'),'true');assert.equal(await page.locator('.ip-sample:visible').count(),1)}
 const ids=await page.locator('[data-lsn-view]').evaluateAll(nodes=>nodes.map(node=>node.id));
 for(const id of ids){await page.evaluate(id=>location.hash=id,id);await page.waitForTimeout(25);assert.equal(await page.locator('[data-lsn-view].is-active').getAttribute('id'),id);assert.ok(await page.locator(`[data-lsn-link][href="#${id}"]`).getAttribute('aria-current'))}
 const aliases=await page.locator('.ic-alias').evaluateAll(nodes=>nodes.map(node=>({id:node.id,view:node.closest('[data-lsn-view]').id})));
 for(const alias of aliases){await page.evaluate(id=>location.hash=id,alias.id);await page.waitForTimeout(8);assert.equal(await page.locator('[data-lsn-view].is-active').getAttribute('id'),alias.view)}
 await page.goto(`${url}#cross-account`);await page.waitForSelector('.ip-enhanced');await page.locator('#cross-account [data-ic-select="3"]').click();assert.match(await page.locator('#cross-account [data-ic-state]:visible').textContent(),/Denied · valid credentials/);
 await page.goto(`${url}#identity-map--user`);await page.waitForSelector('.ip-enhanced');assert.equal(await page.locator('[data-ip-flow="iam-user"]').getAttribute('aria-pressed'),'true');
 await page.goto(`${url}#identity-map--role`);await page.waitForSelector('.ip-enhanced');assert.equal(await page.locator('[data-lsn-view].is-active').getAttribute('id'),'identity-map');
 await page.goto(`${url}#identity-map`);await page.waitForSelector('.ip-enhanced');await page.locator('.ip-more-flows summary').click();await page.locator('[data-ip-flow="eks-irsa"]').focus();await page.keyboard.press('Enter');assert.equal(await page.locator('[data-ip-flow="eks-irsa"]').getAttribute('aria-pressed'),'true');
 await page.locator('.ip-index-group').nth(5).locator('summary').click();await page.locator('[data-lsn-link][href="#cross-account"]').click();assert.equal(await page.locator('[data-lsn-view].is-active').getAttribute('id'),'cross-account');await page.goBack();await page.waitForTimeout(50);assert.equal(await page.locator('[data-lsn-view].is-active').getAttribute('id'),'identity-map');
 await page.emulateMedia({reducedMotion:'reduce'});
 for(const width of [1536,1100,760,390,320]){await page.setViewportSize({width,height:950});for(const id of ['four-questions','from-where','two-accounts','four-pillars','identity-map','workforce-login','cross-account','credential-diagnosis']){await page.evaluate(id=>location.hash=id,id);await page.waitForTimeout(20);const [scroll,window]=await page.evaluate(()=>[document.documentElement.scrollWidth,innerWidth]);assert.ok(scroll<=window+1,`Page overflow at ${width}px in ${id}: ${scroll}`)}}
 await page.evaluate(()=>location.hash='identity-map');await page.waitForTimeout(40);await page.screenshot({path:'/tmp/identity-pipeline-mobile.png',fullPage:true});
 await page.setViewportSize({width:1440,height:900});await page.evaluate(()=>document.documentElement.style.zoom='2');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'200% CSS zoom overflow');
 const duplicates=await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(el=>el.id);return ids.filter((id,index)=>ids.indexOf(id)!==index)});assert.deepEqual(duplicates,[]);
 const no=await browser.newPage({javaScriptEnabled:false,viewport:{width:320,height:800}});await no.goto(url);assert.equal(await no.locator('[data-lsn-view]:visible').count(),18);assert.equal(await no.locator('.ip-flow-state:visible').count(),9);assert.equal(await no.locator('[data-ip-box]:disabled').count(),29);assert.ok(await no.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
 assert.deepEqual(errors,[]);console.log(JSON.stringify({stages:6,boxes:boxKeys.length,flows:9,views:18,simulatorPresets:4,samples:5,oldAliases:aliases.length,widths:[1536,1100,760,390,320],noJavaScript:true,errors}));
}finally{await browser.close()}
