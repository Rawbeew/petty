from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1440, 'height': 900})
    pg.goto('http://127.0.0.1:4173/', wait_until='networkidle')
    pg.wait_for_selector('text=LIVE WIRE')
    pg.wait_for_timeout(5000)
    pg.screenshot(path='shots/v3-radar.png')
    pg.locator('header nav.hidden button', has_text='Receipts').click()
    pg.locator('button', has_text='Field Wire').click()
    for _ in range(80):
        t = pg.locator('section').nth(0).inner_text()
        if 'CRASHES · 7D' in t or 'UNREACHABLE' in t: break
        pg.wait_for_timeout(500)
    pg.wait_for_timeout(1200)
    pg.screenshot(path='shots/v3-fieldwire.png')
    b.close()
print('ok')
