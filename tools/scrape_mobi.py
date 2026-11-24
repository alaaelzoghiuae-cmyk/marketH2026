#!/usr/bin/env python3
# Scraper: mobi3araby.com phone pages -> ELZOGHBI guide seed (facts only).
# - Names/specs/prices/images extracted as structured facts.
# - Store names are NEVER copied: only price numbers + review dates are read.
# - Pros/cons/verdict are GENERATED from specs in ELZOGHBI voice (not copied text).
import json, re, sys, time, urllib.request
from bs4 import BeautifulSoup

UA = {"User-Agent": "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36"}
BASE = "https://mobi3araby.com"
MONTHS = "يناير|فبراير|مارس|أبريل|مايو|يونيو|يوليو|أغسطس|سبتمبر|أكتوبر|نوفمبر|ديسمبر"
BRANDS = {"apple":"آبل","samsung":"سامسونج","xiaomi":"شاومي","honor":"هونر","oppo":"أوبو","vivo":"فيفو",
"realme":"ريلمي","infinix":"إنفينيكس","huawei":"هواوي","nothing":"نوثينج","google":"جوجل","oneplus":"ون بلس",
"tecno":"تكنو","itel":"آيتل","motorola":"موتورولا","nokia":"نوكيا","sony":"سوني","asus":"أسوس","zte":"زد تي إي"}

def fetch(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=40) as r:
        return r.read().decode("utf-8", "ignore")

def num(s):
    if not s: return None
    m = re.search(r"[\d][\d,]*\.?\d*", str(s).replace("٬", ","))
    if not m: return None
    try: return float(m.group(0).replace(",", ""))
    except Exception: return None

def section_by_h2(soup, hid):
    h = soup.find("h2", id=hid)
    if not h: return None
    out = []
    for el in h.find_next_siblings():
        if el.name == "h2": break
        out.append(el)
    wrap = BeautifulSoup("<div></div>", "html.parser").div
    for el in out: wrap.append(el.__copy__() if hasattr(el, "__copy__") else el)
    return wrap

def parse_phone(url):
    slug = url.rstrip("/").split("/")[-1]
    html = fetch(url)
    soup = BeautifulSoup(html, "html.parser")
    # JSON-LD product
    name, low_price = None, None
    for sc in soup.find_all("script", type="application/ld+json"):
        try: data = json.loads(sc.string or "")
        except Exception: continue
        items = data if isinstance(data, list) else [data]
        for it in items:
            if isinstance(it, dict) and it.get("@type") == "Product":
                name = it.get("name")
                off = it.get("offers") or {}
                if isinstance(off, dict): low_price = off.get("lowPrice") or off.get("price")
    if not name:
        t = soup.title.get_text() if soup.title else slug
        name = re.sub(r"سعر ومواصفات|في مصر والخليج.*|مميزاته وعيوبه.*", "", t).strip(" -،")
    # images (own gallery only) - scan raw HTML: gallery uses srcset/lazy attrs too
    imgs = []
    for v in re.findall(rf"https://mobi3araby\.com/wp-content/uploads/mobi-phones/{re.escape(slug)}/[A-Za-z0-9._-]+\.webp", html):
        if re.search(r"-\d+x\d+\.webp$", v): continue
        if v not in imgs: imgs.append(v)
    imgs.sort(key=lambda u: (int(re.search(r"-(\d+)\.webp$", u).group(1)) if re.search(r"-(\d+)\.webp$", u) else 99))
    # specs
    specs, flat = [], {}
    sec = section_by_h2(soup, "specs")
    if sec:
        for h3 in sec.find_all("h3"):
            tbl = h3.find_next("table")
            if not tbl: continue
            rows = []
            for tr in tbl.find_all("tr"):
                cells = [c.get_text(" ", strip=True) for c in tr.find_all(["td", "th"])]
                if len(cells) >= 2 and cells[0]:
                    rows.append([cells[0], cells[1]])
                    flat[cells[0]] = cells[1]
            if rows: specs.append({"group": h3.get_text(strip=True), "rows": rows})
    # Egypt variant prices (first table in price section) - numbers + date only
    variants, price_date = [], ""
    psec = section_by_h2(soup, "price")
    if psec:
        tbl = psec.find("table")
        if tbl:
            for tr in tbl.find_all("tr")[1:]:
                cells = [c.get_text(" ", strip=True) for c in tr.find_all(["td", "th"])]
                if len(cells) >= 2:
                    p = num(cells[1])
                    dm = re.search(rf"(\d{{1,2}})\s+({MONTHS})", cells[1])
                    if dm and not price_date: price_date = dm.group(0)
                    if p: variants.append({"label": cells[0], "price": int(p)})
    if not variants and low_price:
        variants = [{"label": "—", "price": int(float(low_price))}]
    price = min((v["price"] for v in variants), default=None)
    # key specs
    def g(*keys):
        for k in keys:
            for fk, fv in flat.items():
                if k in fk: return fv
        return ""
    battery = num(g("السعة"))
    cam = num(g("الكاميرا الرئيسية"))
    refresh = num(g("معدل التحديث"))
    weight = num(g("الوزن"))
    screen = num(g("حجم الشاشة"))
    ram_raw = g("الرام"); storage_raw = g("التخزين")
    ram_max = max([num(x) or 0 for x in re.findall(r"\d+", ram_raw)] or [0])
    stor_max = max([num(x) or 0 for x in re.findall(r"\d+", storage_raw)] or [0])
    charge = num(g("الشحن السلكي"))
    sim = g("الشرائح"); ip = g("مقاومة")
    brand_slug = slug.split("-")[0]
    return {"id": "gp_" + slug, "slug": slug, "name": name, "brand": BRANDS.get(brand_slug, brand_slug),
            "brandSlug": brand_slug, "images": imgs[:6], "specs": specs, "variants": variants,
            "price": price, "priceDate": price_date, "battery": battery, "camera": cam,
            "refresh": refresh, "weight": weight, "screen": screen, "ramMax": ram_max,
            "storageMax": stor_max, "chargeW": charge, "sim": sim, "ip": ip, "enabled": True}

def gen_editorial(p):
    pros, cons = [], []
    if p["battery"] and p["battery"] >= 6000: pros.append(f"بطارية ضخمة {int(p['battery']):,} مللي أمبير — من أقوى البطاريات في فئته")
    elif p["battery"] and p["battery"] >= 5000: pros.append(f"بطارية {int(p['battery']):,} مللي أمبير تكمل معاك يوم كامل براحة")
    if p["chargeW"] and p["chargeW"] >= 80: pros.append(f"شحن سريع {int(p['chargeW'])} وات يختصر وقت الشحن جدًا")
    elif p["chargeW"] and p["chargeW"] >= 45: pros.append(f"شحن سريع {int(p['chargeW'])} وات")
    if p["camera"] and p["camera"] >= 200: pros.append(f"كاميرا رئيسية {int(p['camera'])} ميجا بتفاصيل استثنائية")
    elif p["camera"] and p["camera"] >= 108: pros.append(f"كاميرا رئيسية {int(p['camera'])} ميجا بتصوير حاد وواضح")
    elif p["camera"] and p["camera"] >= 50: pros.append(f"كاميرا رئيسية {int(p['camera'])} ميجا محترمة في فئته")
    if p["refresh"] and p["refresh"] >= 120: pros.append(f"شاشة {int(p['refresh'])} هرتز — سلاسة ملحوظة في التصفح والألعاب")
    if p["screen"] and p["screen"] >= 6.7: pros.append(f"شاشة كبيرة {p['screen']} بوصة ممتعة للفيديو واللعب")
    if p["weight"] and p["weight"] <= 185: pros.append(f"خفيف في الإيد ({int(p['weight'])} جرام)")
    if p["storageMax"] and p["storageMax"] >= 1024: pros.append("مساحات تخزين لحد 1 تيرا وأكتر — انسى هم المساحة")
    elif p["storageMax"] and p["storageMax"] >= 512: pros.append(f"تخزين لحد {int(p['storageMax'])} جيجا")
    if "IP68" in (p["ip"] or ""): pros.append("مقاومة مية وتراب IP68")
    if p["weight"] and p["weight"] >= 225: cons.append(f"وزنه تقيل نسبيًا ({int(p['weight'])} جرام) هتحس بيه في الاستخدام الطويل")
    if p["refresh"] and p["refresh"] <= 60: cons.append("الشاشة 60 هرتز بس — أقل سلاسة من المنافسين")
    if p["battery"] and p["battery"] < 4500: cons.append(f"البطارية {int(p['battery']):,} مللي أمبير أقل من متوسط فئته")
    if p["sim"] and "eSIM" in p["sim"] and ("فقط" in p["sim"] or "بس" in p["sim"]): cons.append("بيعتمد على eSIM من غير خانة شريحة عادية — اتأكد إن شركتك بتدعمها")
    if not cons: cons.append("سعره محتاج مقارنة كويسة مع بدائل نفس الفئة قبل ما تقرر")
    pr = p["price"] or 0
    if pr and pr < 12000: verdict = "مناسب لو بتدور على موبايل اقتصادي يعتمد عليه في الاستخدام اليومي والمكالمات والسوشيال."
    elif pr and pr < 30000: verdict = "مناسب لو عايز توازن كويس بين الأداء والكاميرا والسعر في الفئة المتوسطة."
    elif pr: verdict = "مناسب للي عايز تجربة رائدة كاملة ومش بيبص للسعر كأول عامل."
    else: verdict = "راجع المواصفات وقارنه ببدائل فئته قبل القرار."
    return pros[:5], cons[:3], verdict

def main():
    limit = int(sys.argv[1]) if len(sys.argv) > 1 else 30
    sm = fetch(BASE + "/phone-sitemap.xml")
    urls = re.findall(r"<loc>([^<]+)</loc>", sm)
    phones = []
    for u in urls:
        if len(phones) >= limit: break
        try:
            p = parse_phone(u)
            if not p["specs"] or not p["price"]:
                print(f"SKIP {p['slug']}: incomplete on source (specs={len(p['specs'])} price={p['price']})")
                continue
            p["pros"], p["cons"], p["verdict"] = gen_editorial(p)
            p["priceHistory"] = []
            phones.append(p)
            print(f"OK {p['slug']}: price={p['price']} imgs={len(p['images'])} specGroups={len(p['specs'])} variants={len(p['variants'])}")
        except Exception as e:
            print(f"FAIL {u}: {e}")
        time.sleep(0.4)
    prices = sorted([p["price"] for p in phones if p["price"]])
    med = prices[len(prices)//2] if prices else 0
    cheap = prices[0] if prices else 0
    for p in phones:
        cam_n = min((p["camera"] or 0)/200, 1); bat_n = min(max(((p["battery"] or 3000)-3000)/4000, 0), 1)
        ref_n = min(max(((p["refresh"] or 60)-60)/84, 0), 1); ram_n = min((p["ramMax"] or 0)/24, 1)
        s = 0.3*cam_n + 0.25*bat_n + 0.2*ref_n + 0.25*ram_n
        vf = (cheap/p["price"])**0.5 if p["price"] else 0.5
        p["valueScore"] = max(5, min(99, round(s*70 + 30*vf)))
        p["priceHistory"] = [{"date": "2026-11-24", "price": p["price"]}] if p["price"] else []
    out = "// Auto-generated seed: phone facts (specs/prices/images) + ELZOGHBI-voice editorial.\n"
    out += "export const GUIDE_PHONES_SEED = " + json.dumps(phones, ensure_ascii=False, indent=1) + ";\n"
    dest = "/home/hatch/workspace/elzoghbi_split/src/data/guidePhonesSeed.js"
    with open(dest, "w", encoding="utf-8") as f: f.write(out)
    print(f"WROTE {dest} phones={len(phones)} medianPrice={med}")

if __name__ == "__main__":
    main()
