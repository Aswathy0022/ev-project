import html

import streamlit as st


BADGE_COLORS = {
    "info": ("rgba(83,230,255,0.18)", "#53e6ff"),
    "success": ("rgba(117,240,138,0.18)", "#75f08a"),
    "warning": ("rgba(255,209,102,0.18)", "#ffd166"),
    "danger": ("rgba(255,107,107,0.18)", "#ff6b6b"),
}


def render_hero(title: str, subtitle: str, eyebrow: str = "VoltIQ") -> None:
    title = html.escape(title)
    subtitle = html.escape(subtitle)
    eyebrow = html.escape(eyebrow)
    st.markdown(
        f'<div class="hero-card"><div class="hero-eyebrow">{eyebrow}</div><div class="hero-title">{title}</div><div class="hero-subtitle">{subtitle}</div></div>',
        unsafe_allow_html=True,
    )


def render_metric_card(label: str, value: str, caption: str, accent: str = "info") -> None:
    label = html.escape(label)
    value = html.escape(value)
    caption = html.escape(caption)
    _, text_color = BADGE_COLORS.get(accent, BADGE_COLORS["info"])
    st.markdown(
        f'<div class="metric-card"><div class="metric-label">{label}</div><div class="metric-value" style="color:{text_color};">{value}</div><div class="metric-caption">{caption}</div></div>',
        unsafe_allow_html=True,
    )


def render_badge(text: str, tone: str = "info") -> str:
    bg, color = BADGE_COLORS.get(tone, BADGE_COLORS["info"])
    return f'<span class="status-badge" style="background:{bg}; color:{color};">{text}</span>'


def render_panel(title: str, body: str, badges: list[str] | None = None) -> None:
    title = html.escape(title)
    body = html.escape(body)
    st.markdown(
        f'<div class="panel-card"><div class="panel-title">{title}</div>{"".join(badges or [])}<div class="panel-copy">{body}</div></div>',
        unsafe_allow_html=True,
    )


def render_progress_card(label: str, value: float, caption: str, tone: str = "info") -> None:
    label = html.escape(label)
    caption = html.escape(caption)
    value = max(0, min(float(value), 100))
    _, color = BADGE_COLORS.get(tone, BADGE_COLORS["info"])
    st.markdown(
        f"""
        <div class="panel-card compact-card">
            <div class="metric-label">{label}</div>
            <div class="progress-row">
                <div class="progress-track"><div class="progress-fill" style="width:{value:.0f}%; background:{color};"></div></div>
                <div class="progress-value">{value:.0f}%</div>
            </div>
            <div class="metric-caption">{caption}</div>
        </div>
        """,
        unsafe_allow_html=True,
    )


def render_input_summary(title: str, items: list[tuple[str, str]], tone: str = "info") -> None:
    title = html.escape(title)
    rows = "".join(
        f"<div class='summary-row'><span>{html.escape(label)}</span><strong>{html.escape(value)}</strong></div>"
        for label, value in items
    )
    st.markdown(
        f"<div class='panel-card compact-card'><div class='panel-title'>{title}</div>{render_badge('Live inputs', tone)}<div class='summary-list'>{rows}</div></div>",
        unsafe_allow_html=True,
    )


def render_station_card(name: str, recommendation: str, meta_lines: list[str], tone: str = "info") -> None:
    name = html.escape(name)
    meta = "<br>".join(html.escape(line) for line in meta_lines)
    st.markdown(
        f'<div class="station-card"><div class="station-name">{name}</div>{render_badge(recommendation, tone)}<div class="station-meta" style="margin-top:0.65rem;">{meta}</div></div>',
        unsafe_allow_html=True,
    )


def render_decision(title: str, body: str) -> None:
    title = html.escape(title)
    body = html.escape(body)
    st.markdown(
        f'<div class="decision-banner"><div class="decision-title">{title}</div><div class="decision-copy">{body}</div></div>',
        unsafe_allow_html=True,
    )
