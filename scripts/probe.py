from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    b = p.chromium.launch()
    pg = b.new_page(viewport={'width': 1440, 'height': 900})
    pg.goto('http://127.0.0.1:4173/', wait_until='networkidle')
    pg.wait_for_selector('text=PETTY')

    def dump(tag):
        info = pg.locator('header nav.hidden button').evaluate_all(
            "els => els.map(e => ({text: e.textContent.trim(), bg: getComputedStyle(e).backgroundColor}))")
        main = pg.locator('main').inner_text()[:60].replace('\n', ' | ')
        print(tag)
        for i in info: print('   ', i)
        print('    main:', main)

    dump('initial (expect Radar gold)')
    pg.locator('header nav.hidden button', has_text='Black Book').click(); pg.wait_for_timeout(400)
    dump('after Vault click (expect Vault gold + vault content)')
    pg.locator('header nav.hidden button', has_text='Comeuppance').click(); pg.wait_for_timeout(400)
    dump('after Recover click (expect Recover gold + recover content)')
    pg.locator('header nav.hidden button', has_text='Side-Eye').click(); pg.wait_for_timeout(400)
    dump('after Radar click (expect Radar gold + radar content)')
    b.close()
