/* global React, Icon, BrandMark, ThemeToggle, Avatar */
const { useState: cu_useState, useEffect: cu_useEffect } = React;

// ============== Streamer Mode (broadcaster-only) ==============
// Persists to localStorage. When ON, sensitive secrets (RTMPS URL, stream key,
// webhook URLs) are masked across the dashboard so the broadcaster can safely
// share their screen / record OBS without leaking them.
const SM_KEY = "howlcast:streamer-mode";
const smListeners = new Set();
let smValue = (() => { try { return localStorage.getItem(SM_KEY) === "1"; } catch { return false; } })();
function setStreamerMode(v) {
  smValue = !!v;
  try { localStorage.setItem(SM_KEY, smValue ? "1" : "0"); } catch {}
  smListeners.forEach(l => l());
}
function useStreamerMode() {
  const [, force] = cu_useState(0);
  cu_useEffect(() => {
    const fn = () => force(n => n + 1);
    smListeners.add(fn);
    return () => smListeners.delete(fn);
  }, []);
  return smValue;
}

function StreamerModeButton({ inSidebar }) {
  const on = useStreamerMode();
  const [confirming, setConfirming] = cu_useState(false);
  const click = () => {
    if (on) setConfirming(true); // turning OFF needs confirm
    else setStreamerMode(true);
  };
  return (
    <>
      <button
        onClick={click}
        title={on ? "Streamer Mode is ON — secrets are hidden" : "Hide secrets while screen-sharing"}
        className="hc-btn"
        style={{
          width: "100%", justifyContent: "flex-start", gap: 10,
          background: on ? "color-mix(in oklab, var(--cyan) 14%, transparent)" : "transparent",
          border: on ? "1px solid color-mix(in oklab, var(--cyan) 45%, transparent)" : "1px solid var(--line)",
          color: on ? "var(--cyan)" : "var(--fg-2)",
          fontWeight: 500, fontSize: 13, padding: "8px 10px", height: "auto",
        }}
      >
        {on ? <Icon.EyeOff size={14}/> : <Icon.Eye size={14}/>}
        <span style={{ flex: 1, textAlign: "left" }}>Streamer Mode</span>
        <span style={{
          width: 30, height: 16, borderRadius: 999,
          background: on ? "var(--cyan)" : "var(--bg-4)",
          border: "1px solid var(--line-2)", padding: 2, flexShrink: 0,
        }}>
          <span style={{
            display: "block", width: 10, height: 10, borderRadius: 999,
            background: on ? "var(--cta-fg)" : "var(--fg-3)",
            marginLeft: on ? 14 : 0, transition: "margin 200ms ease",
          }} />
        </span>
      </button>
      {confirming && <SMConfirm onCancel={() => setConfirming(false)} onConfirm={() => { setStreamerMode(false); setConfirming(false); }} />}
    </>
  );
}

function SMConfirm({ onCancel, onConfirm }) {
  return (
    <div
      onClick={onCancel}
      style={{
        position: "fixed", inset: 0, zIndex: 100,
        background: "color-mix(in oklab, var(--bg) 70%, black 30%)",
        backdropFilter: "blur(6px)",
        display: "flex", alignItems: "center", justifyContent: "center", padding: 24,
      }}
    >
      <div onClick={e => e.stopPropagation()} className="hc-card" style={{ width: 420, padding: 24, display: "flex", flexDirection: "column", gap: 14 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span style={{
            width: 36, height: 36, borderRadius: 999,
            background: "color-mix(in oklab, var(--warning) 18%, transparent)",
            color: "var(--warning)",
            display: "inline-flex", alignItems: "center", justifyContent: "center",
          }}><Icon.Eye size={18}/></span>
          <h3 className="font-display" style={{ margin: 0, fontSize: 18, fontWeight: 700, letterSpacing: "-0.02em" }}>
            Reveal sensitive info?
          </h3>
        </div>
        <p style={{ margin: 0, color: "var(--fg-2)", fontSize: 13.5, lineHeight: 1.6 }}>
          Turning off Streamer Mode will un-blur your <strong>stream key</strong>, <strong>RTMPS server URL</strong>, and <strong>Discord webhook URLs</strong>. Make sure you're not screen-sharing or recording before continuing.
        </p>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8, marginTop: 4 }}>
          <button className="hc-btn hc-btn-ghost" onClick={onCancel}>Keep hidden</button>
          <button className="hc-btn hc-btn-destructive" onClick={onConfirm}>Yes, reveal</button>
        </div>
      </div>
    </div>
  );
}

// Top public nav
function TopNav({ theme, onToggleTheme, brandName, signedIn, onSignIn, route, go, transparent }) {
  return (
    <header style={{
      height: 56,
      borderBottom: transparent ? "1px solid transparent" : "1px solid var(--line)",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "0 24px",
      background: "var(--bg)",
      position: "sticky", top: 0, zIndex: 20,
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <a onClick={() => go("/")} style={{ cursor: "pointer" }}>
          <BrandMark size={22} brandName={brandName} />
        </a>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        {signedIn ? (
          <UserMenu go={go} />
        ) : (
          <button className="hc-btn hc-btn-ghost" onClick={onSignIn}>Sign in</button>
        )}
      </div>
    </header>
  );
}

function UserMenu({ go }) {
  const [open, setOpen] = cu_useState(false);
  return (
    <div style={{ position: "relative" }}>
      <button
        className="hc-btn hc-btn-ghost"
        style={{ paddingLeft: 6, paddingRight: 10, gap: 8, height: 36 }}
        onClick={() => setOpen(o => !o)}
      >
        <Avatar size={26} name="MD" hue={250} />
        <Icon.ChevronDown size={14} />
      </button>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 30 }} onClick={() => setOpen(false)} />
          <div className="hc-card fade-up" style={{
            position: "absolute", right: 0, top: 44, minWidth: 220, padding: 6, zIndex: 40,
            background: "var(--bg-2)",
          }}>
            <div style={{ padding: "8px 10px 10px", borderBottom: "1px solid var(--line)" }}>
              <div style={{ fontSize: 13, fontWeight: 600 }}>mrdemonwolf</div>
              <div style={{ fontSize: 12, color: "var(--fg-3)" }}>md@howlcast.dev</div>
            </div>
            <MenuItem icon={<Icon.User size={14} />} onClick={() => { setOpen(false); go("/account"); }}>My account</MenuItem>
            <MenuItem icon={<Icon.Settings size={14} />} onClick={() => { setOpen(false); go("/dashboard"); }}>Broadcaster dashboard</MenuItem>
            <MenuItem icon={<Icon.Lock size={14} />} onClick={() => { setOpen(false); go("/account/security"); }}>Security</MenuItem>
            <div style={{ borderTop: "1px solid var(--line)", margin: "4px 0" }} />
            <MenuItem icon={<Icon.Logout size={14} />} onClick={() => { setOpen(false); go("/login"); }}>Sign out</MenuItem>
          </div>
        </>
      )}
    </div>
  );
}

function MenuItem({ icon, children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex", alignItems: "center", gap: 10,
        width: "100%", padding: "8px 10px", background: "transparent",
        border: "none", color: "var(--fg)", fontSize: 13, cursor: "pointer",
        borderRadius: 6, textAlign: "left",
        fontFamily: "var(--font-ui)",
      }}
      onMouseEnter={(e) => e.currentTarget.style.background = "var(--bg-3)"}
      onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}
    >
      <span style={{ color: "var(--fg-3)" }}>{icon}</span>
      {children}
    </button>
  );
}

// Dashboard sidebar
const SIDEBAR_GROUPS = [
  {
    label: "CHANNEL",
    items: [
      { route: "/dashboard", label: "Overview", icon: "Home" },
      { route: "/dashboard/panels", label: "Panels", icon: "Layout" },
      { route: "/dashboard/branding", label: "Branding", icon: "Palette" },
    ],
  },
  {
    label: "STREAM",
    items: [
      { route: "/dashboard/status", label: "Status", icon: "Activity" },
      { route: "/dashboard/stream-key", label: "Stream key", icon: "Key" },
      { route: "/dashboard/chat", label: "Chat", icon: "Chat" },
      { route: "/dashboard/emotes", label: "Emotes", icon: "Smiley" },
      { route: "/dashboard/stats", label: "Stats", icon: "Bar" },
    ],
  },
  {
    label: "SETTINGS",
    items: [
      { route: "/dashboard/invites", label: "Invites", icon: "Mail" },
      { route: "/dashboard/notifications", label: "Notifications", icon: "Bell" },
      { route: "/dashboard/account", label: "Account", icon: "User" },
    ],
  },
];

function DashboardShell({ theme, onToggleTheme, brandName, route, go, children }) {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", minHeight: "100%" }}>
      <aside style={{
        borderRight: "1px solid var(--line)", padding: "16px 12px",
        position: "sticky", top: 0, height: "calc(100vh - 0px)",
        background: "var(--bg)",
        display: "flex", flexDirection: "column", gap: 4,
      }}>
        <div style={{ padding: "6px 8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <a onClick={() => go("/")} style={{ cursor: "pointer" }}><BrandMark size={20} brandName={brandName} /></a>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
        <div className="scroll-y" style={{ flex: 1, paddingBottom: 12 }}>
          {SIDEBAR_GROUPS.map(g => (
            <div key={g.label} style={{ marginBottom: 16 }}>
              <div className="eyebrow" style={{ padding: "0 10px 8px" }}>{g.label}</div>
              {g.items.map(it => {
                const active = route === it.route;
                const Ic = Icon[it.icon];
                return (
                  <a
                    key={it.route}
                    onClick={() => go(it.route)}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      padding: "7px 10px", borderRadius: 6, cursor: "pointer",
                      color: active ? "var(--fg)" : "var(--fg-3)",
                      position: "relative",
                      fontSize: 13, fontWeight: active ? 500 : 400,
                      background: active ? "var(--bg-3)" : "transparent",
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = "var(--bg-2)"; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = "transparent"; }}
                  >
                    {active && <span style={{
                      position: "absolute", left: -12, top: "50%", transform: "translateY(-50%)",
                      width: 4, height: 4, borderRadius: 999, background: "var(--cyan)",
                    }} />}
                    <Ic size={15} />
                    {it.label}
                  </a>
                );
              })}
            </div>
          ))}
        </div>
        <div style={{ padding: "10px 6px", borderTop: "1px solid var(--line)" }}>
          <StreamerModeButton inSidebar />
        </div>
        <div style={{ padding: "10px 10px 4px", display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar size={28} name="MD" hue={250} />
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 12, fontWeight: 500, lineHeight: 1.3 }}>mrdemonwolf</div>
            <div style={{ fontSize: 11, color: "var(--fg-4)" }}>Broadcaster · Owner</div>
          </div>
        </div>
      </aside>
      <main style={{ minWidth: 0, padding: "32px 40px 96px" }}>{children}</main>
    </div>
  );
}

function PageHeader({ title, subtitle, right }) {
  return (
    <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginBottom: 28, gap: 16, flexWrap: "wrap" }}>
      <div>
        <h1 className="font-display" style={{ fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: "-0.025em" }}>{title}</h1>
        {subtitle && <div style={{ color: "var(--fg-3)", fontSize: 14, marginTop: 6 }}>{subtitle}</div>}
      </div>
      {right && <div style={{ display: "flex", gap: 8, alignItems: "center" }}>{right}</div>}
    </div>
  );
}

Object.assign(window, { TopNav, DashboardShell, PageHeader, UserMenu, MenuItem, useStreamerMode, setStreamerMode, StreamerModeButton });
