# Petty Radar — link audit 2026-11-26

Method: curl -L, browser UA, 25 s timeout, separate CORS preflight probe. `ACAO:*` = embeddable cross-origin.

| Market | Feed | HTTP | Verdict | CORS | URL |
|---|---|---|---|---|---|
| US | openFDA — enforcement reports | 200 | OK | no-cors | https://www.fda.gov/safety/recalls-market-withdrawals-safety-alerts |
| US | CPSC — recalls (page) | 403 | BOT-WALLED | — | https://www.cpsc.gov/Recalls |
| US | CPSC — recalls API (wired) | 200 | OK | ACAO:* | https://www.saferproducts.gov/RestWebServices/Recall?format=json&RecallDateStart=2026-10-01&RecallDateEnd=2026-11-26 |
| US | USDA FSIS — recalls | 403 | BOT-WALLED | — | https://www.fsis.usda.gov/recalls |
| US | NWS — API docs | 200 | OK | ACAO:* | https://www.weather.gov/documentation/services-web-api |
| US | NWS — alerts API (wired) | 200 | OK | ACAO:* | https://api.weather.gov/alerts/active?status=actual&message_type=alert |
| US | NYPD — dataset page (wired) | 200 | OK | no-cors | https://data.cityofnewyork.us/Transportation/Motor-Vehicle-Collisions-Crashes/h9gi-nx95 |
| US | NYPD — SODA API (wired) | 200 | OK | ACAO:* | https://data.cityofnewyork.us/resource/h9gi-nx95.json?$select=count(*)&$where=crash_date%3E=%272026-11-19%27 |
| US | DC stop data — docs | 200 | OK | no-cors | https://dev.socrata.com/foundry/opendata.dc.gov |
| US | CourtListener — API help | 200 | OK | no-cors | https://www.courtlistener.com/help/api |
| US | Broadcastify Calls | 200 | OK | no-cors | https://www.broadcastify.com/calls |
| US | MissingMoney (NAUPA) | 403 | BOT-WALLED | — | https://www.missingmoney.com |
| US | Treasury Hunt | 200 | OK | no-cors | https://www.treasurydirect.gov/savings-bonds/treasury-hunt/ |
| US | DOT airconsumer | 403 | BOT-WALLED | — | https://www.transportation.gov/airconsumer |
| GB | FSA — food alerts API (wired) | 200 | OK | ACAO:* | https://data.food.gov.uk/food-alerts/id.json?_limit=1&_sort=-created |
| GB | FSA — API reference | 200 | OK | ACAO:* | https://data.food.gov.uk/food-alerts/ui/reference |
| GB | MHRA — drug & device alerts | 200 | OK | no-cors | https://www.gov.uk/drug-device-alerts |
| GB | MHRA — atom feed (no CORS) | 200 | OK | no-cors | https://www.gov.uk/drug-device-alerts.atom |
| GB | Met Office | 200 | OK | no-cors | https://www.metoffice.gov.uk |
| GB | police.uk — stops docs | 200 | OK | no-cors | https://data.police.uk/docs/method/stops-street/ |
| GB | police.uk — stops API (wired) | 200 | OK | ACAO:* | https://data.police.uk/api/stops-street?date=2026-09&lat=51.508&lng=-0.128 |
| GB | police.uk — crimes API (wired) | 200 | OK | ACAO:* | https://data.police.uk/api/crimes-street/all-crime?lat=51.508&lng=-0.128&date=2026-09 |
| GB | Find Case Law (wired) | 200 | OK | ACAO:* | https://caselaw.nationalarchives.gov.uk/atom.xml |
| GB | Find Case Law — portal | 200 | OK | ACAO:* | https://caselaw.nationalarchives.gov.uk |
| GB | Bona Vacantia | 200 | OK | no-cors | https://www.gov.uk/government/organisations/bona-vacantia |
| GB | MyLostAccount | 403 | BOT-WALLED | — | https://www.mylostaccount.org.uk |
| GB | CAA — UK261 denied boarding | 200 | OK | no-cors | https://www.caa.co.uk/air-passengers/travel-problems-and-rights/flight-delays-and-cancellations/denied-boarding/ |
| CA | CFIA & Health Canada — recalls | 200 | OK | no-cors | https://recalls-rappels.canada.ca |
| CA | ECCC — GeoMet weather alerts (wired) | 200 | OK | ACAO:* | https://api.weather.gc.ca/collections/weather-alerts/items?limit=1&f=json |
| CA | ECCC — human warnings page | 200 | OK | no-cors | https://weather.gc.ca |
| CA | CanLII | 403 | BOT-WALLED | — | https://www.canlii.org |
| CA | BoC — unclaimed property portal | 200 | OK | no-cors | https://www.unclaimedproperties.bankofcanada.ca/ |
| CA | CTA — APPR | 000 | UNREACHABLE | — | https://otc-cta.gc.ca/en/airlines-and-other-rms |
| AU | TGA — alerts & recalls | 000 | UNREACHABLE | — | https://www.tga.gov.au/safety/alerts-and-recalls |
| AU | FSANZ | 200 | OK | no-cors | https://www.foodstandards.gov.au |
| AU | BOM — national warnings | 200 | OK | no-cors | https://reg.bom.gov.au/australia/warnings/ |
| AU | AustLII | 403 | BOT-WALLED | — | https://www.austlii.edu.au |
| AU | ASIC MoneySmart | 403 | BOT-WALLED | — | https://moneysmart.gov.au/find-unclaimed-money |
| AU | Infrastructure — aviation consumer | 000 | UNREACHABLE | — | https://www.infrastructure.gov.au/infrastructure-transport-vehicles/aviation/aviation-consumer-protections |
| GL | WHO — DON portal | 200 | OK | ACAO:* | https://www.who.int/emergencies/disease-outbreak-news |
| GL | WHO — news English RSS (wired) | 200 | OK | ACAO:* | https://www.who.int/rss-feeds/news-english.xml |
| GL | OECD GlobalRecalls | 200 | OK | no-cors | https://globalrecalls.oecd.org |
| GL | WMO | 200 | OK | no-cors | https://public.wmo.int |
| GL | ICAO — legal | 403 | BOT-WALLED | — | https://www.icao.int/secretariat/legal |
| CLAIM | MissingMoney (NAUPA) | 403 | BOT-WALLED | — | https://www.missingmoney.com |
| CLAIM | Treasury Hunt | 200 | OK | no-cors | https://www.treasurydirect.gov/savings-bonds/treasury-hunt/ |
| CLAIM | US Courts — unclaimed funds | 200 | OK | no-cors | https://www.uscourts.gov/court-programs/bankruptcy/unclaimed-funds-bankruptcy |
| CLAIM | Bona Vacantia | 200 | OK | no-cors | https://www.gov.uk/government/organisations/bona-vacantia |
| CLAIM | MyLostAccount | 403 | BOT-WALLED | — | https://www.mylostaccount.org.uk |
| CLAIM | BoC — unclaimed property | 200 | OK | no-cors | https://www.unclaimedproperties.bankofcanada.ca/ |
| CLAIM | BC Unclaimed Property Society | 200 | OK | no-cors | https://unclaimedproperty.ca |
| CLAIM | ASIC MoneySmart | 403 | BOT-WALLED | — | https://moneysmart.gov.au/find-unclaimed-money |
| WIRE | FDA accessdata recall index (source links) | 200 | OK | no-cors | https://www.accessdata.fda.gov/scripts/ires/index.cfm |
| WIRE | openFDA — food enforcement (wired) | 200 | OK | no-cors | https://api.fda.gov/food/enforcement.json?search=status:ongoing&sort=report_date:desc&limit=1 |
| WIRE | openFDA — drug enforcement (wired) | 200 | OK | ACAO:* | https://api.fda.gov/drug/enforcement.json?search=status:ongoing&sort=report_date:desc&limit=1 |
| WIRE | openFDA — device enforcement (wired) | 200 | OK | ACAO:* | https://api.fda.gov/device/enforcement.json?search=status:ongoing&sort=report_date:desc&limit=1 |

## Tally

- OK: 41
- BOT-WALLED: 12
- UNREACHABLE: 3
