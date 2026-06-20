# VoltIQ — Product Detail (for Figma AI theme restyle)

## What it is
EV bike range/charge assistant. User input battery%, health%, weather, terrain, traffic, ride mode, rider weight/luggage → predict real-world range, charge time, readiness decision. Web app, Next.js 16 + FastAPI backend.

## Pages
- `/` — landing
- `/login`, `/signup` — auth
- `/dashboard` — "Battery Check" — main feature, predict range
- `/trip-planner` — route + range planning
- `/charger-finder` — map-based charger search
- `/history` — predictions + charging sessions tabs (auth only)
- `/admin` — admin panel (admin only)

## Current Theme Tokens (CSS vars, `app/globals.css`)
```
--background: #0a0f14      (near-black navy)
--surface: #111827
--surface-2: #1a2333
--border: rgba(255,255,255,0.08)
--foreground: #e2e8f0      (light gray text)
--muted: #7d8aa0
--accent: #00d4ff           (cyan — primary brand color)
--accent-glow: rgba(0,212,255,0.15)
--success: #22c55e (green)
--warning: #eab308 (yellow)
--danger: #ef4444 (red)
--radius: 12px
```
Style: dark mode only, glassmorphism (`backdrop-filter: blur(12px)`, translucent white overlays `rgba(255,255,255,0.04)`), neon cyan glow shadows on primary actions (`box-shadow: 0 0 20px rgba(0,212,255,0.3)`), sans font (Geist Sans), mono font (Geist Mono) for numeric/data values.

## Component Inventory
- `Button` — 4 variants: primary (solid cyan, black text, glow), secondary (translucent white), ghost, danger (translucent red). 3 sizes sm/md/lg, all rounded-xl/lg.
- `Card` — `.glass` class: translucent bg + blur + 1px border + `rounded-2xl`, optional glow on hover.
- `CardHeader` / `CardTitle` — uppercase, tracked-out, muted-color small label row.
- `MetricCard` — big stat value + icon + colored accent (accent/success/warning/danger) + subtext.
- `ProgressRing` — circular % gauge (battery level).
- `DecisionBanner` — full-width status banner (go/no-go style readiness message).
- `Badge`, `Input`, `Select`, `Slider` (custom thumb, glow on drag), `Skeleton` (loading), `MapView` (charger map).
- `Sidebar` — fixed left nav (desktop, 224px wide, dark `#0d1521` bg) collapsing to top bar + drawer on mobile. Logo: lightning-bolt icon in cyan badge + "VoltIQ" wordmark. Nav items: Dashboard, Trip Planner, Find Charger, History (auth-gated, shows lock icon if guest), Admin (admin-gated, yellow accent instead of cyan).

## Layout Patterns
- Sidebar + content area (no top nav on desktop).
- Cards stacked in `space-y-6` / grid layouts (`sm:grid-cols-2`, `sm:grid-cols-3`).
- Tab switcher inside cards: pill-style segmented control (`bg-white/4` track, active tab `bg-white/10`).
- Input form collapses to one-line summary chip after submit, results shown below.
- Status colors: cyan = primary/info, green = success/good, yellow = warning, red = danger — used consistently across badges, factor deltas, charge-time figures.

## Icons
`lucide-react` — Zap, Route, Battery, BatteryCharging, AlertTriangle, TrendingDown, Map, Bolt, History, ShieldCheck, Lock, User, LogOut, Menu, X, Pencil.

## Brand
Name: **VoltIQ**. Tagline implied: "real-world range prediction" for EV bikes. Tone: technical/data-dense, dashboard-style, automotive-HUD feel (cyan glow = electric/EV association).

## Notes for Figma AI re-theme
- All color values are CSS custom properties in one place (`globals.css` `:root`) — swap there for global re-theme.
- Glow/shadow effects are hardcoded per-component (Button, Sidebar, Card) as raw `rgba(0,212,255,...)` strings, not tied to the CSS var — would need find/replace across `components/ui/*.tsx` and `components/layout/Sidebar.tsx` if accent color changes.
- Border radius, blur amount, font choice are also centralized in `:root` (`--radius`), reusable across new theme.
