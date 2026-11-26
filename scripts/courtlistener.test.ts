/* Petty — CourtListener sweep: deterministic deep links + docket parser. No network. */
import { docketDeepLink, parseDocketResults, clToken } from '../src/lib/courtlistener';

let failures = 0;
const ok = (cond: boolean, label: string) => { console.log((cond ? 'PASS' : 'FAIL'), '-', label); if (!cond) failures++; };

ok(docketDeepLink('  losartan ') === 'https://www.courtlistener.com/?q=losartan&type=d', 'deep link trims + encodes, type=d');
ok(docketDeepLink('Zantac 150') === 'https://www.courtlistener.com/?q=Zantac%20150&type=d', 'deep link encodes spaces');
ok(typeof clToken() === 'string', 'token reader returns empty string when absent');

const good = parseDocketResults({ results: [
  { caseName: 'In re Zantac (Ranitidine) Prods.', court: 'S.D. Fla.', dateFiled: '2019-09-13', docketNumber: '3:19-md-02934', absolute_url: '/docket/1/zantac/' },
  { case_name: 'Roundup Prods. (Glyphosate)', court: 'N.D. Cal.', date_filed: '2016-03-28', docket_number: '3:16-md-02741' },
  'junk',
] });
ok(good.length === 2, 'parser: two valid rows, junk dropped');
const [first, second] = good;
if (!first || !second) throw new Error('parser fixture broken');
ok(first.caseName === 'In re Zantac (Ranitidine) Prods.' && first.court === 'S.D. Fla.', 'parser: camelCase fields');
ok(first.pageUrl === 'https://www.courtlistener.com/docket/1/zantac/', 'parser: absolute_url → absolute link');
ok(second.caseName === 'Roundup Prods. (Glyphosate)' && second.dateFiled === '2016-03-28', 'parser: snake_case fallbacks');
ok(second.pageUrl.startsWith('https://www.courtlistener.com/?q='), 'parser: missing url → search deep link, never invented');
ok(parseDocketResults({}).length === 0 && parseDocketResults(null).length === 0 && parseDocketResults('x').length === 0, 'parser: malformed payload → [], never invents');

console.log(failures === 0 ? '\ncourtlistener: all assertions passed' : `\n${failures} FAILURES`);
process.exit(failures === 0 ? 0 : 1);
