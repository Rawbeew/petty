from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page()
    pg.on('console', lambda m: print('[console]', m.type, m.text[:300]))
    pg.on('requestfailed', lambda r: print('[reqfail]', r.url[:120], r.failure))
    pg.goto('http://127.0.0.1:4173/', wait_until='networkidle')
    pg.locator('header nav.hidden button', has_text='Receipts').click()
    pg.locator('button', has_text='Field Wire').click()
    pg.wait_for_timeout(12000)
    secs = pg.locator('section')
    print('sections:', secs.count())
    for i in range(min(3, secs.count())):
        print(f'--- section {i} ---')
        print(secs.nth(i).inner_text()[:500])
    b.close()
