import { chromium } from 'playwright';
const SHOTS = '/tmp/claude-0/-home-claude/357c8e52-e3b6-511c-994d-d6d58ce1a7e5/scratchpad/shots/';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('ERR_TUNNEL')) errs.push(m.text()); });
page.on('dialog', (d) => d.accept());
const shot = (n) => page.screenshot({ path: SHOTS + n + '.png', fullPage: true });
const has = async (role, name) => (await page.getByRole(role, { name }).count()) > 0;
const click = async (role, name) => { await page.getByRole(role, { name }).first().click(); await page.waitForTimeout(300); };
const pick = async (name) => { if (await has('button', 'Switch player')) await click('button', 'Switch player'); await click('button', new RegExp(name)); await page.waitForTimeout(300); };

async function kidDay(tag, { missOne = false, tempting = false } = {}) {
  for (let step = 0; step < 14; step++) {
    if (await has('button', 'Roll for today')) {
      const groups = page.locator('.habit .seg');
      const n = await groups.count();
      for (let i = 0; i < n; i++) await groups.nth(i).locator('button').nth(missOne && i === 0 ? 1 : 0).click();
      await click('button', 'Roll for today'); continue;
    }
    if (await has('button', /^Next:/)) { await click('button', /^Next:/); continue; }
    if (await has('button', /Bank a quarter/)) { await shot(tag + '-payday'); const b = page.getByRole('button', { name: /Bank a quarter/ }); if (await b.isEnabled()) { await b.click(); await page.waitForTimeout(300); await click('button', 'Roll your check-up'); } else await click('button', 'Keep in my wallet'); continue; }
    if (await has('button', 'Keep in my wallet')) { await click('button', 'Keep in my wallet'); continue; }
    if (await has('button', 'Roll my check-up')) { await click('button', 'Roll my check-up'); await shot(tag + '-checkup'); continue; }
    if (await has('button', /Finish today|On to today/)) { await click('button', /Finish today|On to today/); continue; }
    if ((await page.locator('button.option').count()) > 0) {
      const opts = page.locator('button.option:not([disabled])');
      if (tempting) await opts.first().click(); else await opts.last().click();
      await click('button', /Lock it in/); continue;
    }
    if (await has('button', 'Collect and finish today')) { await click('button', 'Collect and finish today'); continue; }
    if (await has('button', /Food Adventure/)) return;
    await page.waitForTimeout(300);
  }
  throw new Error('kid day stuck at ' + tag);
}
async function parentApproveAll() {
  await pick('Jonathan');
  for (const id of ['Kaelen', 'Xavier']) { const b = page.getByRole('button', { name: new RegExp(`Approve all ${id}`) }); if (await b.count()) { await b.click(); await page.waitForTimeout(500); } }
  // approve any remaining (food)
  while (await page.locator('.iconbtn.good').count()) { await page.locator('.iconbtn.good').first().click(); await page.waitForTimeout(300); }
}

await page.goto('http://localhost:4173/?practice');
await page.evaluate(() => localStorage.clear());
await page.reload(); await page.waitForTimeout(300);
await pick('Kaelen');
await kidDay('w0');   // Sunday start
await click('button', 'Next day');
for (let d = 1; d <= 7; d++) {
  await pick('Kaelen');
  await kidDay(`w${d}`, { missOne: d === 3, tempting: d === 4 });
  if (d === 2) { await click('button', /Food Adventure/); await page.locator('input[type=text]').fill('Salmon'); await click('button', 'Yum'); await click('button', 'Send to Mum or Dad'); }
  if (d === 5) { await click('button', /^Shop$/); await shot('w5-shop'); await click('button', 'Back'); }
  await parentApproveAll();
  if (d === 7) await shot('w7-parent');
  await click('button', 'Next day');
}
await pick('Kaelen');
await shot('w8-start');
console.log('errors:', JSON.stringify(errs, null, 1));
const state = await page.evaluate(() => { const d = JSON.parse(localStorage.getItem('lq-practice')); const p = d['players/kaelen']; return { xp: p.xp, wallet: p.wallet, bank: p.bank, stats: p.stats, risk: p.risk, streak: p.streak, lastWeek: p.lastWeek && { earned: p.lastWeek.earned, overCap: p.lastWeek.overCap, rolls: p.lastWeek.rolls.map(r => r.band), right: p.lastWeek.right, tempt: p.lastWeek.tempt }, food: p.food, badges: p.badges }; });
console.log(JSON.stringify(state, null, 1));
await browser.close();
