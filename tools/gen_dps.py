#!/usr/bin/env python3
"""Generate 200 WhatsApp DP PNGs (100 boys + 100 girls), 640x640, typographic style."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
import math, os, random

BOLD = "/usr/share/fonts/truetype/freefont/FreeSansBold.ttf"
SIZE = 640
OUT = "/workspace/website/public/assets/dps"
random.seed(42)

BOY_PALS = [
    ((10,10,22),(35,45,90),(80,140,255)), ((18,6,6),(130,25,25),(255,90,60)),
    ((8,8,10),(45,45,50),(220,220,230)), ((4,18,28),(0,110,90),(60,230,190)),
    ((16,4,30),(85,20,120),(200,80,255)), ((0,0,0),(50,35,8),(255,180,40)),
    ((6,20,12),(10,90,45),(120,255,150)), ((22,10,2),(140,70,10),(255,210,120)),
]
GIRL_PALS = [
    ((40,10,30),(150,40,110),(255,150,200)), ((30,15,45),(110,60,160),(220,170,255)),
    ((35,15,15),(160,60,70),(255,190,170)), ((15,35,30),(40,120,100),(170,255,220)),
    ((40,30,5),(160,120,30),(255,220,140)), ((25,20,50),(70,80,170),(170,190,255)),
    ((45,10,25),(180,50,90),(255,160,170)), ((20,30,45),(60,110,160),(160,220,255)),
]

BOY_QUOTES = [
    ("ATTITUDE","KING"), ("LOW","PROFILE"), ("SILENT","BOY"), ("BOSS","MODE"),
    ("NO","FEAR"), ("SELF","MADE"), ("RULE","BREAKER"), ("STAY","STRONG"),
    ("NEVER","GIVE UP"), ("WORK IN","SILENCE"), ("DREAM","BIG"), ("STAY","REAL"),
    ("LONE","WOLF"), ("KING OF","MYSELF"), ("BORN TO","WIN"), ("BEAST","MODE"),
    ("SIMPLE","BOY"), ("PURE","HEART"), ("MY LIFE","MY RULES"), ("HUSTLE","TILL END"),
    ("CONFIDENT","BOY"), ("PAANI KA","BULBULA"), ("ZINDAGI","EK SAFAR"), ("SABAR","O SHUKAR"),
    ("DIL WALI","BAAT"), ("MERA","MANGETER NHI"), ("ATTITUDE","ZAROORI HAI"), ("SEEDHI","BAAT"),
    ("DHOLKI","KA SHAHI"), ("LAJPAL","NABEENA"),
]
GIRL_QUOTES = [
    ("SELF","LOVE"), ("SWEET","QUEEN"), ("SOFT","HEART"), ("ANGEL","EYES"),
    ("QUEEN","VIBES"), ("STAY","BLESSED"), ("CUTE","SMILE"), ("PURE","SOUL"),
    ("BUTTERFLY","GIRL"), ("SIMPLE","LARKI"), ("MASOOM","CHEHRA"), ("MUSKAN","HO TO AISI"),
    ("DIL KI","ACHHI"), ("PYARI","SI"), ("SHARMILI","LARKI"), ("HEROINE","VIBES"),
    ("GLITTER","GIRL"), ("MOON","CHILD"), ("STAR","GIRL"), ("JANNAT","KA PHOOL"),
    ("KHUSH","Raho"), ("PEACE","LOVER"), ("SMILE","MORE"), ("GOOD","VIBES"),
    ("DREAMY","GIRL"), ("LOVELY","DAY"), ("SWEETIE","PIE"), ("RAINBOW","GIRL"),
    ("MOM'S","PRINCESS"), ("STRONG","GIRL"),
]

def vgrad(d, top, mid, bot):
    for y in range(SIZE):
        t = y / (SIZE - 1)
        if t < 0.5:
            k = t / 0.5
            c = tuple(int(top[i] + (mid[i] - top[i]) * k) for i in range(3))
        else:
            k = (t - 0.5) / 0.5
            c = tuple(int(mid[i] + (bot[i] - mid[i]) * k) for i in range(3))
        d.line([(0, y), (SIZE, y)], fill=c)

def fit_font(text, max_w, start=120, min_s=28):
    for s in range(start, min_s, -2):
        f = ImageFont.truetype(BOLD, s)
        w = f.getbbox(text)[2] - f.getbbox(text)[0]
        if w <= max_w:
            return f
    return ImageFont.truetype(BOLD, min_s)

def center_text(d, text, y, fill, max_w=SIZE-100, start=120, shadow=(0,0,0)):
    f = fit_font(text, max_w, start)
    bb = d.textbbox((0, 0), text, font=f)
    w, h = bb[2] - bb[0], bb[3] - bb[1]
    x = (SIZE - w) // 2 - bb[0]
    d.text((x + 4, y + 4), text, font=f, fill=shadow)
    d.text((x, y), text, font=f, fill=fill)
    return f

def deco(d, variant, accent, rnd):
    if variant == 0:
        d.ellipse([-140, -140, 140, 140], outline=accent + (90,), width=10)
        d.ellipse([SIZE-160, SIZE-160, SIZE+160, SIZE+160], outline=accent + (90,), width=10)
    elif variant == 1:
        d.polygon([(0,0),(260,0),(0,260)], fill=accent + (40,))
        d.polygon([(SIZE,SIZE),(SIZE-260,SIZE),(SIZE,SIZE-260)], fill=accent + (40,))
    elif variant == 2:
        d.ellipse([SIZE//2-190, SIZE//2-190, SIZE//2+190, SIZE//2+190], outline=accent + (70,), width=6)
        for k in range(8):
            a = k * math.pi / 4
            x1 = SIZE//2 + int(200 * math.cos(a)); y1 = SIZE//2 + int(200 * math.sin(a))
            x2 = SIZE//2 + int(230 * math.cos(a)); y2 = SIZE//2 + int(230 * math.sin(a))
            d.line([(x1,y1),(x2,y2)], fill=accent + (110,), width=5)
    else:
        for _ in range(14):
            x, y, r = rnd.randint(20, SIZE-20), rnd.randint(20, SIZE-20), rnd.randint(4, 18)
            d.ellipse([x-r, y-r, x+r, y+r], fill=accent + (rnd.randint(30, 70),))

def make(i, quote, pals, tag, variant, idx):
    top, mid, bot = pals[i % len(pals)]
    accent = bot
    img = Image.new("RGB", (SIZE, SIZE), top)
    d = ImageDraw.Draw(img, "RGBA")
    vgrad(d, top, mid, bot)
    rnd = random.Random(idx * 7 + 3)
    deco(d, variant, accent, rnd)
    # subtle vignette
    vg = Image.new("L", (SIZE, SIZE), 0)
    dv = ImageDraw.Draw(vg)
    dv.ellipse([-120, -120, SIZE+120, SIZE+120], fill=255)
    vg = vg.filter(ImageFilter.GaussianBlur(60))
    dark = Image.new("RGB", (SIZE, SIZE), (0, 0, 0))
    img = Image.composite(img, dark, vg)
    d = ImageDraw.Draw(img, "RGBA")
    # tag chip
    f_tag = ImageFont.truetype(BOLD, 26)
    tb = d.textbbox((0,0), tag, font=f_tag)
    tw = tb[2]-tb[0]
    cx = (SIZE - tw - 40) // 2
    d.rounded_rectangle([cx, 46, cx + tw + 40, 46 + 44], 22, fill=accent + (70,))
    d.text((cx + 20, 54), tag, font=f_tag, fill=(255,255,255,230))
    # quotes: two lines centered
    if variant in (1, 3):
        center_text(d, quote[0], 230, (255,255,255), start=96)
        center_text(d, quote[1], 350, accent if sum(accent) > 300 else (255,255,255), start=104)
    else:
        center_text(d, quote[0], 240, (255,255,255), start=104)
        center_text(d, quote[1], 360, (255,255,255), start=104)
    # bottom name strip
    f_b = ImageFont.truetype(BOLD, 24)
    bb = "SAQIB IQBAL \u2022 " + str(idx).zfill(3)
    bbx = d.textbbox((0,0), bb, font=f_b)
    d.text(((SIZE - (bbx[2]-bbx[0]))//2, SIZE - 78), bb, font=f_b, fill=(255,255,255,140))
    d.line([(100, SIZE-40), (SIZE-100, SIZE-40)], fill=accent + (120,), width=3)
    p = f"{OUT}/{tag.lower()}/{tag[0]}{idx:03d}.png"
    img.save(p, "PNG", optimize=True)

os.makedirs(OUT + "/boys", exist_ok=True)
os.makedirs(OUT + "/girls", exist_ok=True)
for n in range(1, 101):
    q = BOY_QUOTES[(n - 1) % len(BOY_QUOTES)]
    make(n - 1, q, BOY_PALS, "Boys", n % 4, n)
for n in range(1, 101):
    q = GIRL_QUOTES[(n - 1) % len(GIRL_QUOTES)]
    make(n - 1, q, GIRL_PALS, "Girls", n % 4, n)
print("done", len(os.listdir(OUT + "/boys")), len(os.listdir(OUT + "/girls")))
