/* global React */
const { useState, useEffect, useRef, useMemo } = React;

// =============== Icons (inline, line-only, lucide-equivalent) ===============
const ico = (d, opts = {}) => ({ size, stroke, ...rest }) => (
  <svg
    width={size || 16} height={size || 16}
    viewBox="0 0 24 24" fill="none"
    stroke="currentColor" strokeWidth={stroke || 1.75}
    strokeLinecap="round" strokeLinejoin="round"
    {...opts} {...rest}
  >{d}</svg>
);
const Icon = {
  Sun: ico(<>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </>),
  Moon: ico(<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" />),
  Eye: ico(<><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></>),
  Bell: ico(<><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></>),
  Share: ico(<><circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><path d="m8.59 13.51 6.83 3.98M15.41 6.51 8.59 10.49"/></>),
  More: ico(<><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/></>),
  Send: ico(<path d="m22 2-7 20-4-9-9-4 20-7Z"/>),
  Smile: ico(<><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></>),
  Pin: ico(<><path d="M12 17v5"/><path d="M9 10.76V6h6v4.76l3 3V17H6v-3.24l3-3Z"/></>),
  Check: ico(<path d="m20 6-11 11-5-5"/>),
  X: ico(<path d="M18 6 6 18M6 6l12 12"/>),
  Copy: ico(<><rect x="9" y="9" width="13" height="13" rx="2" ry="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/></>),
  EyeOff: ico(<><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><path d="m2 2 20 20"/></>),
  Settings: ico(<><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1Z"/></>),
  Home: ico(<><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z"/><path d="M9 22V12h6v10"/></>),
  Key: ico(<><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6M15.5 7.5l3 3L22 7l-3-3"/></>),
  Activity: ico(<path d="M22 12h-4l-3 9L9 3l-3 9H2"/>),
  Layout: ico(<><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18M9 21V9"/></>),
  Chat: ico(<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2Z"/>),
  Smiley: ico(<><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2M9 9h.01M15 9h.01"/></>),
  Mail: ico(<><rect x="2" y="4" width="20" height="16" rx="2"/><path d="m22 7-10 6L2 7"/></>),
  Palette: ico(<><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.83 0 1.5-.67 1.5-1.5 0-.39-.15-.74-.39-1.01a1.5 1.5 0 0 1 1.13-2.49H16a4 4 0 0 0 4-4c0-4.42-3.58-8-8-8Z"/></>),
  Bar: ico(<><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></>),
  User: ico(<><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></>),
  Lock: ico(<><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></>),
  ArrowLeft: ico(<><path d="m12 19-7-7 7-7"/><path d="M19 12H5"/></>),
  ChevronDown: ico(<path d="m6 9 6 6 6-6"/>),
  Plus: ico(<><path d="M12 5v14M5 12h14"/></>),
  Trash: ico(<><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></>),
  Drag: ico(<><circle cx="9" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="15" cy="18" r="1"/></>),
  Image: ico(<><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></>),
  Refresh: ico(<><path d="M3 12a9 9 0 0 1 15-6.7L21 8"/><path d="M21 3v5h-5"/><path d="M21 12a9 9 0 0 1-15 6.7L3 16"/><path d="M3 21v-5h5"/></>),
  Search: ico(<><circle cx="11" cy="11" r="7"/><path d="m21 21-4.3-4.3"/></>),
  Logout: ico(<><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></>),
  Wolf: ico(<><path d="M 18 64 A 32 32 0 0 1 82 64" /><path d="M 30 64 A 20 20 0 0 1 70 64" /><path d="M 42 64 A 8 8 0 0 1 58 64" /><path d="M 42 64 L 50 80 L 58 64 Z" fill="currentColor" stroke="none"/></>, { viewBox: "0 0 100 100" }),
};

// =============== Brand mark ===============
function BrandMark({ size = 24, brandName, color }) {
  const c = color || "var(--cyan)";
  return (
    <span style={{ display: "inline-flex", alignItems: "center", gap: 10 }}>
      <svg width={size} height={size} viewBox="0 0 100 100" fill="none" stroke={c} strokeWidth="6" strokeLinecap="round">
        <path d="M 18 64 A 32 32 0 0 1 82 64" />
        <path d="M 30 64 A 20 20 0 0 1 70 64" />
        <path d="M 42 64 A 8 8 0 0 1 58 64" />
        <path d="M 42 64 L 50 80 L 58 64 Z" fill={c} stroke="none" />
      </svg>
      {brandName !== false && (
        <span className="font-display" style={{ fontWeight: 700, fontSize: 16, letterSpacing: "-0.02em" }}>
          {brandName || "HowlCast"}
        </span>
      )}
    </span>
  );
}

// =============== Theme toggle ===============
function ThemeToggle({ theme, onToggle }) {
  return (
    <button
      className="hc-btn hc-btn-ghost hc-btn-icon"
      onClick={onToggle}
      aria-label="Toggle theme"
      title={theme === "dark" ? "Switch to light" : "Switch to light"}
    >
      {theme === "dark" ? <Icon.Sun /> : <Icon.Moon />}
    </button>
  );
}

// =============== Avatar ===============
function Avatar({ size = 32, name = "WL", halo = false, live = false, hue = 240 }) {
  const initials = name.slice(0, 2).toUpperCase();
  const bg = `linear-gradient(135deg, oklch(0.65 0.16 ${hue}), oklch(0.45 0.18 ${hue + 28}))`;
  return (
    <span
      className={"avatar" + (halo ? " halo" : "")}
      style={{ width: size, height: size, fontSize: size * 0.36, background: bg }}
    >
      {initials}
      {live && <span className="live-dot-corner" />}
    </span>
  );
}

// =============== Live pill ===============
function LivePill({ children = "LIVE" }) {
  return (
    <span className="live-pill"><span className="live-dot" />{children}</span>
  );
}
function ViewerChip({ count }) {
  return (
    <span className="viewer-chip"><Icon.Eye size={12} stroke={2} />{count.toLocaleString()}</span>
  );
}

// =============== Verified ===============
function Verified({ size = 16 }) {
  return (
    <span className="verified" style={{ width: size, height: size }}>
      <Icon.Check size={size * 0.7} stroke={3} />
    </span>
  );
}

// =============== Tag pill ===============
function Tag({ children }) { return <span className="tag-pill">{children}</span>; }

// =============== Tabs (visual only, controlled) ===============
function TabRow({ tabs, value, onChange, sticky = false }) {
  return (
    <div
      style={{
        display: "flex", alignItems: "center", gap: 4,
        borderBottom: "1px solid var(--line)",
        position: sticky ? "sticky" : "static", top: 0, zIndex: 5,
        background: "var(--bg)",
      }}
    >
      {tabs.map(t => (
        <div key={t} className={"hc-tab" + (t === value ? " active" : "")} onClick={() => onChange?.(t)}>
          {t}
        </div>
      ))}
    </div>
  );
}

// =============== Sparkline ===============
function Sparkline({ points, height = 36, width = 160, fill = false }) {
  const max = Math.max(...points), min = Math.min(...points);
  const range = max - min || 1;
  const step = width / (points.length - 1);
  const path = points.map((p, i) => `${i === 0 ? "M" : "L"} ${i * step} ${height - ((p - min) / range) * (height - 4) - 2}`).join(" ");
  return (
    <svg width={width} height={height} className="spark" style={{ display: "block", overflow: "visible" }}>
      {fill && <path d={path + ` L ${width} ${height} L 0 ${height} Z`} fill="currentColor" opacity="0.12" />}
      <path d={path} stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// =============== Skeleton ===============
function Skel({ w = "100%", h = 12, r = 6 }) {
  return <span className="skel" style={{ display: "block", width: w, height: h, borderRadius: r }} />;
}

// =============== Pinned strip ===============
function PinnedMessage({ children }) {
  return (
    <div style={{
      borderLeft: "2px solid var(--cyan)",
      background: "linear-gradient(90deg, color-mix(in oklab, var(--cyan-soft) 40%, transparent), transparent)",
      padding: "10px 12px",
      fontSize: 12,
      color: "var(--fg-2)",
      display: "flex", gap: 8, alignItems: "flex-start"
    }}>
      <Icon.Pin size={12} />
      <div><span className="eyebrow" style={{ marginRight: 8 }}>PINNED</span>{children}</div>
    </div>
  );
}

// =============== Status pills ===============
function Status({ kind, children }) {
  return <span className={`status-pill status-${kind}`}>{children}</span>;
}

// Export to window (Babel scopes per script tag)
Object.assign(window, {
  Icon, BrandMark, ThemeToggle, Avatar, LivePill, ViewerChip, Verified, Tag, TabRow,
  Sparkline, Skel, PinnedMessage, Status,
});
