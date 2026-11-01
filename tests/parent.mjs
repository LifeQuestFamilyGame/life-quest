import { chromium } from 'playwright';
const SHOTS = '/tmp/claude-0/-home-claude/357c8e52-e3b6-511c-994d-d6d58ce1a7e5/scratchpad/shots/';
const browser = await chromium.launch({ executablePath: '/opt/pw-browsers/chromium_headless_shell-1194/chrome-linux/headless_shell' });
const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
const page = await ctx.newPage();
const errs = [];
page.on('pageerror', (e) => errs.push('pageerror: ' + e.message));
page.on('console', (m) => { if (m.type() === 'error' && !m.text().includes('ERR_TUNNEL')) errs.push(m.text()); });
page.on('dialog', (d) => d.accept());
const shot = (n) => page.screenshot({ path: SHOTS + n + '.png', fullPage: true });
const DAYS = 2; const WHO = 'Kaelen';
const has = async (role, name) => (await page.getByRole(role, { name }).count()) > 0;
const click = async (role, name) => { await page.getByRole(role, { name }).first().click(); await page.waitForTimeout(350); };
await page.goto('http://localhost:4173/?practice');
await page.evaluate(() => localStorage.clear());
await page.reload();
await page.waitForTimeout(300);
await page.getByRole('button', { name: new RegExp(WHO) }).click();
await page.waitForTimeout(400);
for (let day = 0; day < DAYS; day++) {
  for (let step = 0; step < 12; step++) {
    const tag = `d${day}-s${step}`;
    if (await has('button', 'Roll for today')) {
      const groups = page.locator('.habit .seg');
      const n = await groups.count();
      for (let i = 0; i < n; i++) await groups.nth(i).locator('button').first().click();
      await shot(tag + '-checkin');
      await click('button', 'Roll for today');
      await shot(tag + '-habitroll');
      continue;
    }
    if (await has('button', /^Next:/)) { await click('button', /^Next:/); continue; }
    if (await has('button', 'Keep in my wallet')) { await shot(tag + '-payday'); await click('button', 'Keep in my wallet'); continue; }
    if (await has('button', 'Roll my check-up')) { await click('button', 'Roll my check-up'); await shot(tag + '-checkup'); continue; }
    if (await has('button', /Finish today|On to today/)) { await click('button', /Finish today|On to today/); continue; }
    if ((await page.locator('button.option').count()) > 0) {
      await shot(tag + '-choice');
      const opts = page.locator('button.option:not([disabled])');
      await opts.last().click();
      await click('button', /Lock it in/);
      await shot(tag + '-liferoll');
      continue;
    }
    if (await has('button', 'Collect and finish today')) { await click('button', 'Collect and finish today'); continue; }
    if (await has('button', /Food Adventure/)) { await shot(tag + '-done'); break; }
    await page.waitForTimeout(400);
  }
  await click('button', 'Next day');
  await page.waitForTimeout(300);
}
await page.getByRole('button', { name: 'Switch player' }).click();
await page.waitForTimeout(300);
await page.getByRole('button', { name: /Jonathan/ }).click();
await page.waitForTimeout(500);
await shot('p0-approvals');
// approve one food? approve all Kaelen's
const all = page.getByRole('button', { name: /Approve all Kaelen/ });
if (await all.count()) { await all.click(); await page.waitForTimeout(500); }
await shot('p1-approved');
await page.getByRole('button', { name: 'The boys' }).click();
await page.waitForTimeout(300);
await shot('p2-boys');
await page.getByRole('button', { name: "Log tonight's jobs" }).first().click();
await page.waitForTimeout(200);
await shot('p3-log-sheet');
await page.locator('.overlay input[type=checkbox]:not([disabled])').first().check();
await page.getByRole('button', { name: 'Save' }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Give a bonus' }).first().click();
await page.locator('.overlay input[type=text]').fill('Helped his brother without being asked');
await page.getByRole('button', { name: 'Save' }).click();
await page.waitForTimeout(400);
await page.getByRole('button', { name: 'Send martial arts card' }).first().click();
await page.waitForTimeout(400);
await shot('p4-boys-after');
await page.getByRole('button', { name: 'Rewards' }).click();
await page.waitForTimeout(300);
await shot('p5-rewards');
await page.getByRole('button', { name: 'My hero' }).click();
await page.waitForTimeout(400);
await shot('p6-myhero');
console.log('errors:', JSON.stringify(errs, null, 1));
await browser.close();
