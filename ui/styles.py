import streamlit as st


def load_css():
    st.markdown(
        """
        <style>
        :root {
            --bg-1: #101418;
            --bg-2: #151b20;
            --panel: rgba(27, 33, 38, 0.94);
            --panel-strong: rgba(32, 39, 45, 0.98);
            --text: #f7f5ef;
            --muted: #aeb8b6;
            --cyan: #5dd9c1;
            --green: #8bd36d;
            --yellow: #f2c14e;
            --red: #ef6f6c;
            --blue: #7aa7ff;
            --glow: 0 12px 34px rgba(0, 0, 0, 0.22);
            --border: rgba(255,255,255,0.09);
        }

        .stApp {
            background: linear-gradient(180deg, var(--bg-2) 0%, var(--bg-1) 100%);
            color: var(--text);
            font-family: "Aptos", "Trebuchet MS", "Segoe UI", sans-serif;
        }

        [data-testid="stSidebar"] {
            background: linear-gradient(180deg, #1d252b 0%, #141a1f 100%);
            border-right: 1px solid rgba(255, 255, 255, 0.08);
            min-width: 280px;
            max-width: 280px;
        }

        [data-testid="stSidebar"] * {
            color: var(--text);
        }

        [data-testid="stSidebarNav"] {
            display: none;
        }

        .sidebar-brand {
            font-size: 2.3rem;
            font-weight: 900;
            letter-spacing: 0;
            margin-bottom: 0.2rem;
            line-height: 1;
            background: linear-gradient(90deg, #ffffff 0%, #5dd9c1 58%, #f2c14e 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .sidebar-caption {
            color: var(--muted);
            margin-bottom: 1.2rem;
            font-size: 0.95rem;
            max-width: 16rem;
        }

        .block-container {
            padding-top: 1.1rem;
            padding-bottom: 1.6rem;
            max-width: 1280px;
        }

        .hero-card, .panel-card, .station-card, .decision-banner, .metric-card, div[data-testid="stDataFrame"] {
            box-shadow: var(--glow);
        }

        .hero-card {
            background:
                linear-gradient(135deg, rgba(37,46,52,0.98), rgba(26,32,37,0.96));
            border: 1px solid rgba(255,255,255,0.10);
            border-radius: 8px;
            padding: 1.35rem 1.45rem;
            margin-bottom: 0.95rem;
            position: relative;
            overflow: hidden;
        }

        .hero-eyebrow {
            color: var(--cyan);
            font-size: 0.88rem;
            text-transform: uppercase;
            letter-spacing: 0.08em;
            margin-bottom: 0.5rem;
            font-weight: 700;
        }

        .hero-title {
            font-size: 2.2rem;
            font-weight: 900;
            letter-spacing: 0;
            margin-bottom: 0.45rem;
        }

        .hero-subtitle, .panel-copy, .station-meta {
            color: var(--muted);
            line-height: 1.5;
        }

        .metric-card {
            background:
                linear-gradient(180deg, rgba(16, 30, 49, 0.94), rgba(9, 19, 33, 0.94));
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 1rem 1.15rem;
            min-height: 136px;
            position: relative;
            overflow: hidden;
        }

        .metric-card::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 3px;
            background: linear-gradient(90deg, var(--cyan), rgba(117,240,138,0.95));
        }

        .metric-label {
            color: var(--muted);
            font-size: 0.95rem;
            margin-bottom: 0.45rem;
        }

        .metric-value {
            font-size: 1.8rem;
            font-weight: 900;
            letter-spacing: 0;
            margin-bottom: 0.4rem;
        }

        .metric-caption {
            font-size: 0.9rem;
            color: var(--muted);
            line-height: 1.4;
        }

        .status-badge {
            display: inline-block;
            padding: 0.38rem 0.82rem;
            border-radius: 8px;
            font-size: 0.82rem;
            font-weight: 800;
            margin-top: 0.2rem;
            margin-right: 0.35rem;
            border: 1px solid rgba(255,255,255,0.05);
        }

        .panel-card, .station-card {
            background:
                linear-gradient(180deg, rgba(13,27,45,0.97), rgba(8,20,35,0.95));
            border: 1px solid var(--border);
            border-radius: 8px;
            padding: 1rem 1.05rem;
            margin-bottom: 0.85rem;
        }

        .panel-title {
            font-size: 1.15rem;
            font-weight: 800;
            margin-bottom: 0.75rem;
            letter-spacing: 0;
        }

        .station-name {
            font-size: 1.18rem;
            font-weight: 800;
            margin-bottom: 0.35rem;
            letter-spacing: 0;
        }

        .decision-banner {
            background:
                linear-gradient(90deg, rgba(35,70,68,0.82), rgba(48,62,43,0.76));
            border: 1px solid rgba(255,255,255,0.11);
            border-radius: 8px;
            padding: 0.95rem 1.05rem;
            margin: 0.35rem 0 0.85rem 0;
        }

        .decision-title {
            font-size: 1.22rem;
            font-weight: 900;
            letter-spacing: 0;
            margin-bottom: 0.28rem;
        }

        .decision-copy {
            color: var(--muted);
            line-height: 1.5;
        }

        .auth-shell {
            max-width: 1180px;
            margin: 0 auto;
            padding-top: 1rem;
        }

        .auth-grid {
            display: grid;
            grid-template-columns: 1.15fr 0.85fr;
            gap: 1.2rem;
            align-items: stretch;
        }

        .auth-stage {
            background:
                linear-gradient(180deg, rgba(37,46,52,0.96), rgba(26,32,37,0.95));
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 8px;
            padding: 1.5rem;
            min-height: 520px;
            box-shadow: var(--glow);
        }

        .auth-kicker {
            color: var(--cyan);
            text-transform: uppercase;
            letter-spacing: 0.08em;
            font-size: 0.82rem;
            font-weight: 800;
            margin-bottom: 0.8rem;
        }

        .auth-title {
            font-size: 3rem;
            line-height: 1.02;
            letter-spacing: 0;
            font-weight: 900;
            margin-bottom: 0.8rem;
            max-width: 10ch;
        }

        .auth-subtitle {
            color: var(--muted);
            font-size: 1.05rem;
            line-height: 1.7;
            max-width: 56ch;
            margin-bottom: 1.1rem;
        }

        .auth-pills {
            display: flex;
            flex-wrap: wrap;
            gap: 0.65rem;
            margin-top: 1rem;
        }

        .auth-pill {
            padding: 0.55rem 0.9rem;
            border-radius: 8px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.07);
            color: var(--text);
            font-size: 0.9rem;
            font-weight: 700;
        }

        .auth-card {
            background:
                linear-gradient(180deg, rgba(32,39,45,0.98), rgba(24,30,35,0.96));
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 8px;
            padding: 1.35rem;
            box-shadow: var(--glow);
        }

        .auth-card-title {
            font-size: 1.45rem;
            font-weight: 900;
            letter-spacing: 0;
            margin-bottom: 0.35rem;
        }

        .auth-card-copy {
            color: var(--muted);
            line-height: 1.6;
            margin-bottom: 1rem;
        }

        .auth-feature-list {
            display: grid;
            gap: 0.7rem;
            margin-top: 1rem;
        }

        .auth-feature {
            background: rgba(255,255,255,0.03);
            border: 1px solid rgba(255,255,255,0.05);
            border-radius: 8px;
            padding: 0.8rem 0.9rem;
        }

        .auth-feature strong {
            display: block;
            margin-bottom: 0.18rem;
            font-size: 0.98rem;
        }

        .auth-feature span {
            color: var(--muted);
            font-size: 0.92rem;
            line-height: 1.45;
        }

        .auth-image {
            margin-top: 1rem;
            border-radius: 8px;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.06);
            background: rgba(255,255,255,0.02);
        }

        .auth-form-wrap {
            max-width: 460px;
            margin: 0.4rem auto 0 auto;
        }

        .auth-actions {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 0.8rem;
            margin-top: 0.85rem;
        }

        .auth-note {
            color: var(--muted);
            font-size: 0.92rem;
            line-height: 1.55;
            margin-top: 0.75rem;
        }

        .auth-form-wrap .hero-card {
            padding: 1rem 1.05rem;
            margin-bottom: 0.75rem;
        }

        .auth-form-wrap .hero-title {
            font-size: 1.7rem;
            margin-bottom: 0.2rem;
        }

        .auth-form-wrap .hero-subtitle {
            font-size: 0.9rem;
            line-height: 1.45;
        }

        .auth-form-wrap .auth-card {
            padding: 0.85rem 0.85rem 0.75rem 0.85rem;
            border-radius: 8px;
        }

        .desktop-auth-shell {
            max-width: 1240px;
            margin: 0 auto;
        }

        .desktop-auth-card {
            background:
                linear-gradient(180deg, rgba(37,46,52,0.97), rgba(26,32,37,0.95));
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 8px;
            padding: 1.4rem;
            box-shadow: var(--glow);
        }

        .desktop-auth-title {
            font-size: 2.7rem;
            line-height: 1.02;
            letter-spacing: 0;
            font-weight: 900;
            margin-bottom: 0.65rem;
            max-width: 11ch;
        }

        .desktop-auth-copy {
            color: var(--muted);
            font-size: 1rem;
            line-height: 1.65;
            max-width: 48ch;
            margin-bottom: 1rem;
        }

        .desktop-auth-pills {
            display: flex;
            flex-wrap: wrap;
            gap: 0.55rem;
            margin-bottom: 1rem;
        }

        .desktop-auth-pill {
            padding: 0.5rem 0.78rem;
            border-radius: 8px;
            background: rgba(255,255,255,0.04);
            border: 1px solid rgba(255,255,255,0.06);
            font-size: 0.88rem;
            font-weight: 700;
        }

        .landing-shell {
            max-width: 1280px;
            margin: 0 auto;
        }

        .landing-nav {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 1rem;
            padding: 0.7rem 0 1rem 0;
        }

        .landing-brand {
            font-size: 2rem;
            font-weight: 900;
            letter-spacing: 0;
            background: linear-gradient(90deg, #ffffff 0%, #5dd9c1 58%, #f2c14e 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }

        .landing-links {
            display: flex;
            align-items: center;
            gap: 1.1rem;
            color: var(--muted);
            font-size: 0.95rem;
        }

        .landing-hero {
            background:
                linear-gradient(135deg, rgba(37,46,52,0.98), rgba(26,32,37,0.96));
            border: 1px solid rgba(255,255,255,0.07);
            border-radius: 8px;
            padding: 1.8rem;
            box-shadow: var(--glow);
            margin-bottom: 1rem;
        }

        .landing-grid {
            display: grid;
            grid-template-columns: 1.15fr 0.85fr;
            gap: 1.2rem;
            align-items: center;
        }

        .landing-title {
            font-size: 3.1rem;
            line-height: 1.02;
            letter-spacing: 0;
            font-weight: 900;
            margin-bottom: 0.8rem;
            max-width: 11ch;
        }

        .landing-copy {
            color: var(--muted);
            font-size: 1.02rem;
            line-height: 1.7;
            max-width: 56ch;
            margin-bottom: 1rem;
        }

        .landing-feature-grid {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 0.9rem;
            margin-top: 1rem;
        }

        .landing-feature {
            background: linear-gradient(180deg, rgba(32,39,45,0.97), rgba(24,30,35,0.95));
            border: 1px solid rgba(255,255,255,0.06);
            border-radius: 8px;
            padding: 1rem;
            box-shadow: var(--glow);
        }

        .landing-feature strong {
            display: block;
            margin-bottom: 0.25rem;
            font-size: 1rem;
        }

        .landing-feature span {
            color: var(--muted);
            font-size: 0.92rem;
            line-height: 1.5;
        }

        @media (max-width: 980px) {
            .landing-grid,
            .landing-feature-grid {
                grid-template-columns: 1fr;
            }

            .landing-title {
                font-size: 2.35rem;
                max-width: none;
            }

            .landing-nav {
                flex-direction: column;
                align-items: flex-start;
            }
        }

        .auth-form-wrap .auth-actions {
            gap: 0.65rem;
            margin-top: 0.55rem;
        }

        @media (max-width: 980px) {
            .auth-grid {
                grid-template-columns: 1fr;
            }

            .auth-title {
                font-size: 2.4rem;
                max-width: none;
            }
        }

        .stSlider [data-baseweb="slider"] > div > div {
            background: linear-gradient(90deg, var(--red), var(--yellow)) !important;
        }

        .stSelectbox > div > div,
        .stTextInput > div > div > input,
        .stNumberInput input {
            background: rgba(255,255,255,0.03) !important;
            border: 1px solid rgba(255,255,255,0.08) !important;
            border-radius: 8px !important;
            color: var(--text) !important;
        }

        .stExpander {
            border: 1px solid rgba(255,255,255,0.08) !important;
            border-radius: 8px !important;
            background: rgba(9, 18, 31, 0.82) !important;
        }

        .stAlert {
            border-radius: 8px !important;
            border: 1px solid rgba(255,255,255,0.08) !important;
        }

        h3 {
            letter-spacing: 0;
            font-size: 1.45rem !important;
            font-weight: 850 !important;
            margin-top: 0.55rem !important;
        }

        div[data-testid="stDataFrame"] {
            border-radius: 8px !important;
            overflow: hidden;
            border: 1px solid rgba(255,255,255,0.07);
        }

        @media (min-width: 1100px) {
            .block-container {
                padding-left: 2.2rem;
                padding-right: 2.2rem;
            }
        }

        .compact-card {
            min-height: 0;
        }

        .summary-list {
            margin-top: 0.75rem;
            display: grid;
            gap: 0.55rem;
        }

        .summary-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 0.8rem;
            border-bottom: 1px solid rgba(255,255,255,0.06);
            padding-bottom: 0.45rem;
        }

        .summary-row:last-child {
            border-bottom: 0;
            padding-bottom: 0;
        }

        .summary-row span {
            color: var(--muted);
            font-size: 0.9rem;
        }

        .summary-row strong {
            font-size: 0.95rem;
            text-align: right;
        }

        .progress-row {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 0.75rem;
            align-items: center;
            margin: 0.45rem 0 0.5rem 0;
        }

        .progress-track {
            width: 100%;
            height: 0.65rem;
            background: rgba(255,255,255,0.08);
            border-radius: 8px;
            overflow: hidden;
        }

        .progress-fill {
            height: 100%;
            border-radius: 8px;
        }

        .progress-value {
            font-weight: 850;
            color: var(--text);
        }

        div[data-testid="stTabs"] button {
            border-radius: 8px 8px 0 0;
        }

        .stCheckbox label,
        .stRadio label {
            color: var(--text) !important;
        }
        </style>
        """,
        unsafe_allow_html=True,
    )
