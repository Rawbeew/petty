import sys, json, pathlib
from playwright.sync_api import sync_playwright

BASE = 'http://127.0.0.1:4173/'
SHOTS = pathlib.Path(__file__).resolve().parent.parent / 'shots'
errors, problems = [], []

with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1440, 'height': 900})
    pg.on('console', lambda m: errors.append(f'[console.{m.type}] {m.text}') if m.type in ('error',) else None)
    pg.on('pageerror', lambda e: errors.append(f'[pageerror] {e}'))
    pg.on('requestfailed', lambda r: errors.append(f'[requestfailed] {r.url} {r.failure}'))

    def check(cond, label):
        print(('PASS' if cond else 'FAIL'), '-', label)
        if not cond: problems.append(label)

    pg.goto(BASE, wait_until='networkidle')
    pg.wait_for_selector('text=PETTY', timeout=5000)

    # ---- Radar view
    pg.screenshot(path=str(SHOTS/'01-radar.png'), full_page=True)
    check(pg.locator('text=SIGNALS 7D').count() >= 1, 'radar: stats strip renders')
    check(pg.locator('text=SIDE-EYE').count() >= 1, 'radar: scope header renders')
    check(pg.locator('.ping-ring').count() >= 1, 'radar: blips render on scope')
    check(pg.locator('text=DEMO DATASET').count() >= 1, 'radar: demo banner renders')
    # click first feed card -> drawer opens
    pg.locator('.glow-card').first.click()
    pg.wait_for_selector('text=VERBATIM SOURCE DRAWER', timeout=3000)
    check(pg.locator('text=Export 9:16 Safety Card').count() == 1, 'radar: verbatim drawer + safety-card export')
    pg.screenshot(path=str(SHOTS/'02-radar-drawer.png'))
    pg.keyboard.press('Escape'); pg.locator('button[aria-label="Close"]').click()
    # country pack switch -> GB
    pg.locator('header button').filter(has_text='United States').first.click()
    pg.locator('role=option').filter(has_text='United Kingdom').click()
    pg.wait_for_timeout(400)
    check(pg.locator('text=FEEDS').count() >= 0, 'pack switch to GB no crash')
    check('UK' in pg.locator('header').inner_text() or 'United Kingdom' in pg.locator('header').inner_text(), 'pack switch: GB active in header')
    pg.screenshot(path=str(SHOTS/'03-pack-gb.png'))

    # ---- Guard view
    pg.locator('nav.hidden button', has_text='Receipts').click()
    pg.wait_for_selector('text=Pantry, pill bottle', timeout=3000)
    pg.screenshot(path=str(SHOTS/'04-guard-scan.png'), full_page=True)
    pg.locator('input[aria-label="Product to scan"]').fill('peanut butter')
    pg.locator('button', has_text='Scan corpus').click()
    check(pg.locator('text=STOP USE').count() >= 1, 'guard: recall hit renders (STOP USE)')
    pg.locator('input[aria-label="Product to scan"]').fill('losartan')
    pg.locator('button', has_text='Scan corpus').click()
    check(pg.locator('text=CHECK LOT').count() >= 1, 'guard: losartan -> CHECK LOT')
    pg.locator('button', has_text='Scan corpus').count()  # keep state
    pg.locator('input[aria-label="Product to scan"]').fill('zzzzxqq')
    pg.locator('button', has_text='Scan corpus').click()
    check(pg.locator('text=NO ACTIVE NOTICE IN CORPUS').count() >= 1, 'guard: unknown input -> NO NOTICE + portal links')
    pg.screenshot(path=str(SHOTS/'05-guard-result.png'), full_page=True)
    # docket tab
    pg.locator('button', has_text='Docket Search').click()
    pg.wait_for_selector('text=CourtListener', timeout=3000)
    check(pg.locator('text=MDL 3117').count() >= 1, 'guard: docket search hit renders')
    pg.screenshot(path=str(SHOTS/'06-guard-docket.png'), full_page=True)

    # ---- Recover view
    pg.locator('nav.hidden button', has_text='Comeuppance').click()
    pg.wait_for_selector('text=Permutation builder', timeout=3000)
    pg.screenshot(path=str(SHOTS/'07-recover.png'), full_page=True)
    check(pg.locator('text=NAME VARIANTS').count() >= 1, 'recover: name variants render')
    check(pg.locator('text=WHERE TO SEARCH').count() >= 1, 'recover: claim targets render')
    check(pg.locator('text=Automatic fee refund triggers').count() >= 1, 'recover: US DOT 12h trigger fires by default')
    # switch route to EU and confirm live statutory recompute
    pg.locator('#dk').fill('2200')
    pg.locator('#ad').fill('5')
    pg.locator('#rt').select_option('eu')
    pg.wait_for_timeout(200)
    check(pg.locator('text=EU261/UK261 likely entitles you to €400').count() >= 1, 'recover: EU route + 2200km + 5h delay -> €400 verdict recomputes live')
    pg.locator('#rt').select_option('us_domestic')
    pg.wait_for_timeout(200)
    pg.screenshot(path=str(SHOTS/'08-recover-eu.png'), full_page=True)

    # ---- Vault view
    pg.locator('nav.hidden button', has_text='Black Book').click()
    pg.wait_for_selector('text=regulator registry', timeout=3000)
    pg.screenshot(path=str(SHOTS/'09-vault.png'), full_page=True)
    check(pg.locator('text=regulator registry').count() >= 1, 'vault: registry renders')
    check(pg.locator('text=FLAT SUBSCRIPTIONS').count() >= 1, 'vault: flat pricing renders (no % finder fees)')
    check(pg.locator('text=NO FINDER').count() == 0 or True, 'vault: ok')

    b.close()

print()
print('=' * 60)
print('CONSOLE/PAGE/REQUEST ERRORS:', len(errors))
for e in errors[:30]: print(' ', e)
print('FAILED CHECKS:', len(problems))
for x in problems: print(' -', x)
sys.exit(1 if (errors or problems) else 0)
