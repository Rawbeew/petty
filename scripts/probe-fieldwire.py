from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page()
    pg.on('console', lambda m: print('[console]', m.type, m.text[:200]))
    pg.goto('http://127.0.0.1:4173/', wait_until='networkidle')
    pg.locator('header nav.hidden button', has_text='Guard').click()
    pg.locator('button', has_text='Field Wire').click()
    for wait in [3000, 6000, 6000]:
        pg.wait_for_timeout(wait)
        txt = pg.locator('section').first.inner_text()
        print(f'--- after +{wait}ms ---')
        print(txt[:400])
        if 'LIVE — NYC' in txt or 'UNREACHABLE' in txt: break
    b.close()
