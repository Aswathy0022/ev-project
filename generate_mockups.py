from pathlib import Path
from PIL import Image, ImageDraw, ImageFont


OUT_DIR = Path(r"C:\Users\LENOVO\OneDrive\Desktop\project\EV-charging\design_mockups")
OUT_DIR.mkdir(parents=True, exist_ok=True)

W, H = 1600, 1000
BG = "#07111f"
PANEL = "#0d1b2d"
PANEL_2 = "#10233b"
TEXT = "#f4f7fb"
MUTED = "#9cb2c8"
CYAN = "#53e6ff"
GREEN = "#75f08a"
YELLOW = "#ffd166"
RED = "#ff6b6b"
BLUE = "#2e7df6"
OUTLINE = "#1e3955"


def font(size, bold=False):
    candidates = [
        r"C:\Windows\Fonts\segoeuib.ttf" if bold else r"C:\Windows\Fonts\segoeui.ttf",
        r"C:\Windows\Fonts\arialbd.ttf" if bold else r"C:\Windows\Fonts\arial.ttf",
    ]
    for candidate in candidates:
        try:
            return ImageFont.truetype(candidate, size)
        except OSError:
            continue
    return ImageFont.load_default()


TITLE = font(38, bold=True)
SUBTITLE = font(18)
CARD_TITLE = font(20, bold=True)
BIG = font(42, bold=True)
MED = font(24, bold=True)
BODY = font(18)
SMALL = font(15)


def rounded(draw, box, radius=26, fill=PANEL, outline=OUTLINE, width=2):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def badge(draw, xy, text, fill, text_fill="#07111f"):
    x, y = xy
    w = 18 + int(len(text) * 9.5)
    h = 34
    draw.rounded_rectangle((x, y, x + w, y + h), radius=17, fill=fill)
    draw.text((x + 12, y + 8), text, font=SMALL, fill=text_fill)
    return w


def card(draw, x, y, w, h, title, value, subtitle=None, accent=CYAN):
    rounded(draw, (x, y, x + w, y + h), fill=PANEL)
    draw.text((x + 24, y + 20), title, font=BODY, fill=MUTED)
    draw.text((x + 24, y + 58), value, font=BIG, fill=TEXT)
    if subtitle:
        draw.text((x + 24, y + h - 36), subtitle, font=SMALL, fill=accent)


def topbar(draw, page_title, section):
    rounded(draw, (28, 24, 1572, 92), fill="#091728", outline="#15314d")
    draw.text((56, 42), "VoltIQ", font=MED, fill=CYAN)
    draw.text((170, 42), section, font=BODY, fill=MUTED)
    draw.text((56, 120), page_title, font=TITLE, fill=TEXT)
    draw.text((56, 168), "Smart EV copilot for charging, planning, and battery decisions", font=SUBTITLE, fill=MUTED)


def sidebar(draw, active_index):
    items = ["Overview", "Smart Range", "Stations Near Me", "Trip Check", "Charging History", "Insights"]
    rounded(draw, (28, 220, 280, 964), fill="#081523", outline="#14304b")
    draw.text((56, 248), "Navigation", font=CARD_TITLE, fill=TEXT)
    for idx, item in enumerate(items):
        y = 300 + idx * 90
        fill = PANEL_2 if idx == active_index else "#0a1726"
        outline = CYAN if idx == active_index else "#10263d"
        rounded(draw, (46, y, 262, y + 64), radius=20, fill=fill, outline=outline)
        draw.text((68, y + 20), item, font=BODY, fill=TEXT if idx == active_index else MUTED)


def battery_ring(draw, center, pct):
    x, y = center
    draw.ellipse((x - 110, y - 110, x + 110, y + 110), outline="#16304a", width=22)
    draw.arc((x - 110, y - 110, x + 110, y + 110), start=135, end=135 + int(270 * pct / 100), fill=GREEN, width=22)
    draw.text((x - 50, y - 24), f"{pct}%", font=BIG, fill=TEXT)
    draw.text((x - 38, y + 28), "Battery", font=BODY, fill=MUTED)


def line_chart(draw, box, points, color=CYAN):
    x1, y1, x2, y2 = box
    rounded(draw, box, fill=PANEL)
    for i in range(5):
        y = y1 + 40 + i * ((y2 - y1 - 80) / 4)
        draw.line((x1 + 28, y, x2 - 28, y), fill="#17314a", width=1)
    scaled = []
    for px, py in points:
        sx = x1 + 40 + px * (x2 - x1 - 80)
        sy = y2 - 40 - py * (y2 - y1 - 80)
        scaled.append((sx, sy))
    draw.line(scaled, fill=color, width=5)
    for sx, sy in scaled:
        draw.ellipse((sx - 5, sy - 5, sx + 5, sy + 5), fill=color)


def draw_overview():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    topbar(draw, "Overview", "Drive-ready dashboard")
    sidebar(draw, 0)
    card(draw, 330, 230, 270, 150, "Predicted Range", "286 km", "Up 8% in clear weather", GREEN)
    card(draw, 620, 230, 270, 150, "Nearest Station", "1.8 km", "4 free slots", CYAN)
    card(draw, 910, 230, 270, 150, "Wait Time", "08 min", "Low crowd right now", GREEN)
    card(draw, 1200, 230, 270, 150, "Battery Health", "91%", "Healthy performance", GREEN)
    rounded(draw, (330, 410, 720, 840), fill=PANEL_2)
    battery_ring(draw, (525, 595), 78)
    draw.text((405, 750), "Ready for today's commute", font=MED, fill=TEXT)
    badge(draw, (445, 790), "Safe to Travel", GREEN)
    rounded(draw, (750, 410, 1470, 590), fill=PANEL)
    draw.text((780, 438), "Recommended Action", font=CARD_TITLE, fill=TEXT)
    draw.text((780, 485), "You can drive directly to your destination.", font=MED, fill=TEXT)
    draw.text((780, 530), "Weather impact is low and nearby stations are available if needed.", font=BODY, fill=MUTED)
    rounded(draw, (750, 620, 1090, 840), fill=PANEL)
    draw.text((780, 648), "Nearest Station", font=CARD_TITLE, fill=TEXT)
    draw.text((780, 698), "Station EV-02", font=MED, fill=TEXT)
    badge(draw, (780, 742), "Recommended", CYAN)
    draw.text((780, 794), "1.8 km  |  4 slots free  |  50 kW", font=BODY, fill=MUTED)
    line_chart(draw, (1120, 620, 1470, 840), [(0.0, 0.35), (0.18, 0.44), (0.42, 0.40), (0.62, 0.63), (0.8, 0.58), (1.0, 0.78)], GREEN)
    draw.text((1148, 648), "Battery Trend", font=CARD_TITLE, fill=TEXT)
    path = OUT_DIR / "01-overview.png"
    img.save(path)
    return path


def draw_prediction():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    topbar(draw, "Smart Range", "Prediction workspace")
    sidebar(draw, 1)
    rounded(draw, (330, 230, 760, 860), fill=PANEL_2)
    draw.text((360, 260), "Input Panel", font=CARD_TITLE, fill=TEXT)
    fields = [
        ("Battery Level", "78%"),
        ("Temperature", "31 C"),
        ("Station Crowd", "12 vehicles"),
        ("Charging Load", "65%"),
        ("Battery Health", "91%"),
        ("Weather", "Clear"),
    ]
    for i, (label, value) in enumerate(fields):
        y = 320 + i * 86
        rounded(draw, (360, y, 730, y + 62), radius=18, fill="#0b1827", outline="#17314a")
        draw.text((384, y + 11), label, font=SMALL, fill=MUTED)
        draw.text((384, y + 32), value, font=BODY, fill=TEXT)
    rounded(draw, (800, 230, 1470, 430), fill=PANEL)
    draw.text((830, 260), "Prediction Summary", font=CARD_TITLE, fill=TEXT)
    draw.text((830, 316), "286 km", font=BIG, fill=CYAN)
    draw.text((1050, 326), "estimated range", font=BODY, fill=MUTED)
    badge(draw, (830, 370), "Battery Performing Well", GREEN)
    card(draw, 800, 460, 210, 150, "Charging Time", "46 min", "to 90%", CYAN)
    card(draw, 1028, 460, 210, 150, "Wait Time", "12 min", "moderate queue", YELLOW)
    card(draw, 1256, 460, 214, 150, "Load Suitability", "Good", "charger can handle load", GREEN)
    rounded(draw, (800, 640, 1470, 860), fill=PANEL_2)
    draw.text((830, 668), "Decision", font=CARD_TITLE, fill=TEXT)
    draw.text((830, 725), "This station is suitable and your current battery can cover medium trips safely.", font=MED, fill=TEXT)
    draw.text((830, 790), "Recommendation: if your trip is above 220 km, charge first for 20 to 30 minutes.", font=BODY, fill=MUTED)
    path = OUT_DIR / "02-smart-range.png"
    img.save(path)
    return path


def draw_stations():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    topbar(draw, "Stations Near Me", "Nearby charging decisions")
    sidebar(draw, 2)
    rounded(draw, (330, 230, 1470, 380), fill=PANEL_2)
    draw.text((360, 260), "Top Recommended Stations", font=CARD_TITLE, fill=TEXT)
    stations = [
        ("EV-02", "1.8 km", "4 slots free", "08 min", "50 kW", CYAN, "Best Match"),
        ("EV-11", "2.4 km", "2 slots free", "05 min", "60 kW", GREEN, "Fastest"),
        ("EV-07", "3.1 km", "5 slots free", "03 min", "40 kW", YELLOW, "Least Busy"),
    ]
    for i, station in enumerate(stations):
        x = 360 + i * 360
        name, dist, slots, wait, rate, color, tag = station
        rounded(draw, (x, 300, x + 320, 620), fill=PANEL)
        badge(draw, (x + 24, 326), tag, color)
        draw.text((x + 24, 388), name, font=MED, fill=TEXT)
        draw.text((x + 24, 444), dist, font=BIG, fill=CYAN)
        draw.text((x + 24, 500), f"{slots}  |  wait {wait}", font=BODY, fill=MUTED)
        draw.text((x + 24, 548), f"Charging speed {rate}", font=BODY, fill=TEXT)
    rounded(draw, (330, 660, 860, 860), fill=PANEL)
    draw.text((360, 688), "Map Preview", font=CARD_TITLE, fill=TEXT)
    draw.rounded_rectangle((380, 730, 830, 830), radius=26, fill="#0a1726", outline="#17314a")
    for px, py in [(470, 780), (560, 760), (650, 800), (730, 750)]:
        draw.ellipse((px - 10, py - 10, px + 10, py + 10), fill=CYAN)
    draw.ellipse((420 - 12, 790 - 12, 420 + 12, 790 + 12), fill=GREEN)
    rounded(draw, (890, 660, 1470, 860), fill=PANEL_2)
    draw.text((920, 688), "Selection Logic", font=CARD_TITLE, fill=TEXT)
    draw.text((920, 740), "EV-02 is recommended because it balances distance, free slots, wait time, and charger speed.", font=BODY, fill=TEXT)
    draw.text((920, 796), "Users can switch priority to nearest, fastest, or least crowded.", font=BODY, fill=MUTED)
    path = OUT_DIR / "03-stations-near-me.png"
    img.save(path)
    return path


def draw_trip():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    topbar(draw, "Trip Check", "Destination readiness")
    sidebar(draw, 3)
    rounded(draw, (330, 230, 1470, 410), fill=PANEL_2)
    draw.text((360, 260), "Where do you want to go?", font=CARD_TITLE, fill=TEXT)
    rounded(draw, (360, 312, 730, 372), radius=18, fill="#0b1827", outline="#17314a")
    rounded(draw, (760, 312, 1130, 372), radius=18, fill="#0b1827", outline="#17314a")
    draw.text((384, 330), "Current location", font=BODY, fill=MUTED)
    draw.text((784, 330), "Destination", font=BODY, fill=MUTED)
    badge(draw, (1160, 320), "Check Trip", CYAN)
    card(draw, 330, 450, 260, 150, "Trip Distance", "84 km", "route estimate", CYAN)
    card(draw, 610, 450, 260, 150, "Battery Needed", "31%", "including buffer", YELLOW)
    card(draw, 890, 450, 260, 150, "Arrival Battery", "47%", "projected remaining", GREEN)
    card(draw, 1170, 450, 300, 150, "Weather Impact", "Low", "clear weather, normal drain", GREEN)
    rounded(draw, (330, 640, 860, 860), fill=PANEL)
    draw.text((360, 670), "Trip Decision", font=CARD_TITLE, fill=TEXT)
    draw.text((360, 725), "Trip is safe with current battery.", font=BIG, fill=GREEN)
    draw.text((360, 790), "No charging stop is needed for this route.", font=BODY, fill=MUTED)
    rounded(draw, (890, 640, 1470, 860), fill=PANEL_2)
    draw.text((920, 670), "Backup Charging Option", font=CARD_TITLE, fill=TEXT)
    draw.text((920, 725), "EV-11 on route", font=MED, fill=TEXT)
    draw.text((920, 778), "2.4 km away  |  5 min wait  |  60 kW fast charger", font=BODY, fill=MUTED)
    badge(draw, (920, 810), "Use only if plans change", YELLOW)
    path = OUT_DIR / "04-trip-check.png"
    img.save(path)
    return path


def draw_history():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    topbar(draw, "Charging History", "Session memory")
    sidebar(draw, 4)
    card(draw, 330, 230, 260, 150, "Sessions", "126", "last 90 days", CYAN)
    card(draw, 610, 230, 260, 150, "Energy Charged", "948 kWh", "total charged", GREEN)
    card(draw, 890, 230, 260, 150, "Avg Wait", "09 min", "queue is manageable", YELLOW)
    card(draw, 1170, 230, 300, 150, "Favorite Station", "EV-02", "most used charger", CYAN)
    rounded(draw, (330, 420, 1470, 860), fill=PANEL_2)
    draw.text((360, 448), "Recent Sessions", font=CARD_TITLE, fill=TEXT)
    headers = ["Date", "Station", "Battery Before", "Battery After", "Wait", "Charge Time", "Energy"]
    xs = [360, 520, 690, 890, 1080, 1185, 1340]
    for x, label in zip(xs, headers):
        draw.text((x, 500), label, font=SMALL, fill=MUTED)
    rows = [
        ("05 Apr", "EV-02", "24%", "88%", "08 min", "42 min", "28 kWh"),
        ("03 Apr", "EV-11", "31%", "80%", "05 min", "36 min", "22 kWh"),
        ("01 Apr", "EV-07", "18%", "92%", "12 min", "55 min", "34 kWh"),
        ("29 Mar", "EV-02", "40%", "79%", "07 min", "31 min", "18 kWh"),
    ]
    for i, row in enumerate(rows):
        y = 548 + i * 76
        rounded(draw, (350, y - 14, 1450, y + 42), radius=18, fill="#0b1827", outline="#17314a")
        for x, value in zip(xs, row):
            draw.text((x, y), value, font=BODY, fill=TEXT)
    path = OUT_DIR / "05-charging-history.png"
    img.save(path)
    return path


def draw_insights():
    img = Image.new("RGB", (W, H), BG)
    draw = ImageDraw.Draw(img)
    topbar(draw, "Insights", "Behavior and trends")
    sidebar(draw, 5)
    line_chart(draw, (330, 230, 870, 520), [(0.0, 0.30), (0.2, 0.36), (0.42, 0.46), (0.65, 0.60), (0.84, 0.75), (1.0, 0.68)], CYAN)
    draw.text((360, 258), "Temperature vs Battery Performance", font=CARD_TITLE, fill=TEXT)
    line_chart(draw, (900, 230, 1470, 520), [(0.0, 0.18), (0.18, 0.22), (0.35, 0.34), (0.57, 0.56), (0.8, 0.74), (1.0, 0.90)], YELLOW)
    draw.text((930, 258), "Crowd vs Waiting Time", font=CARD_TITLE, fill=TEXT)
    rounded(draw, (330, 560, 870, 860), fill=PANEL_2)
    draw.text((360, 588), "Busiest Hours", font=CARD_TITLE, fill=TEXT)
    bars = [0.30, 0.45, 0.62, 0.82, 0.74, 0.51, 0.38]
    for i, level in enumerate(bars):
        x = 390 + i * 64
        draw.rounded_rectangle((x, 800 - level * 160, x + 36, 800), radius=12, fill=CYAN if i < 4 else BLUE)
        draw.text((x - 6, 812), f"{6 + i*2}", font=SMALL, fill=MUTED)
    rounded(draw, (900, 560, 1470, 860), fill=PANEL)
    draw.text((930, 588), "Key Takeaways", font=CARD_TITLE, fill=TEXT)
    bullets = [
        "Battery performance improves in moderate temperatures.",
        "Queue time rises sharply after crowd crosses 18 vehicles.",
        "EV-02 and EV-11 have the best speed-to-wait balance.",
        "Morning hours are the best window for charging.",
    ]
    y = 650
    for bullet in bullets:
        draw.ellipse((932, y + 8, 944, y + 20), fill=GREEN)
        draw.text((960, y), bullet, font=BODY, fill=TEXT)
        y += 54
    path = OUT_DIR / "06-insights.png"
    img.save(path)
    return path


if __name__ == "__main__":
    files = [
        draw_overview(),
        draw_prediction(),
        draw_stations(),
        draw_trip(),
        draw_history(),
        draw_insights(),
    ]
    for file in files:
        print(file)
