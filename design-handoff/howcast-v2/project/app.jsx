/* global React, ReactDOM, Icon, BrandMark, ThemeToggle, Avatar,
   TopNav, DashboardShell, PageHeader,
   HomePage, LoginPage, InvitePage, SetupPage, ChannelDen,
   DashboardOverview, StreamKeyPage, StatusPage, PanelsPage, ChatModPage, EmotesPage,
   InvitesPage, NotificationsPage, BrandingPage, StatsPage, AccountPage,
   SecurityPage, PopoutChatPage, LegalPage, NotFoundPage, ErrorPage, LoadingPage,
   TweaksPanel, useTweaks, TweakSection, TweakRadio, TweakToggle, TweakText, TweakSelect, TweakColor */

const { useState, useEffect, useMemo } = React;

const ROUTES = [
  { id: "/", label: "Root · LIVE", group: "Public" },
  { id: "/?offline", label: "Root · OFFLINE", group: "Public" },
  { id: "/login", label: "Login", group: "Public" },
  { id: "/invite/INVITE-3K7F-92AB", label: "Invite landing", group: "Public" },
  { id: "/invite/INVALID", label: "Invite · invalid", group: "Public" },
  { id: "/setup", label: "First-run setup", group: "Public" },
  { id: "/[channel]", label: "DEN · LIVE", group: "Channel" },
  { id: "/[channel]?offline", label: "DEN · OFFLINE", group: "Channel" },
  { id: "/dashboard", label: "Dashboard", group: "Broadcaster" },
  { id: "/dashboard/stream-key", label: "Stream key", group: "Broadcaster" },
  { id: "/dashboard/status", label: "Status", group: "Broadcaster" },
  { id: "/dashboard/panels", label: "Panels", group: "Broadcaster" },
  { id: "/dashboard/chat", label: "Chat moderation", group: "Broadcaster" },
  { id: "/dashboard/emotes", label: "Emotes", group: "Broadcaster" },
  { id: "/dashboard/invites", label: "Invites", group: "Broadcaster" },
  { id: "/dashboard/notifications", label: "Notifications", group: "Broadcaster" },
  { id: "/dashboard/branding", label: "Branding", group: "Broadcaster" },
  { id: "/dashboard/stats", label: "Stats", group: "Broadcaster" },
  { id: "/dashboard/account", label: "Account", group: "Broadcaster" },
  { id: "/account", label: "Viewer · account", group: "Account" },
  { id: "/account/security", label: "Security", group: "Account" },
  { id: "/popout/chat", label: "Popout chat", group: "Account" },
  { id: "/privacy", label: "Privacy", group: "Legal" },
  { id: "/terms", label: "Terms", group: "Legal" },
  { id: "/404", label: "404", group: "Errors" },
  { id: "/error", label: "Error", group: "Errors" },
  { id: "/loading", label: "Loading", group: "Errors" },
];

function App() {
  const [route, setRoute] = useState("/");
  const [showRoutes, setShowRoutes] = useState(false);

  const [t, setTweak] = useTweaks(/*EDITMODE-BEGIN*/{
    "theme": "dark",
    "brandName": "HowlCast",
    "verified": true,
    "live": true,
    "signedIn": true,
    "accent": "cyan-bright"
  }/*EDITMODE-END*/);

  // Apply theme to <html>
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", t.theme);
  }, [t.theme]);

  // Apply accent variant by overriding --cyan
  useEffect(() => {
    const map = {
      "cyan-bright":  { dark: "oklch(0.78 0.135 220)", light: "oklch(0.55 0.14 224)" },
      "cyan-deep":    { dark: "oklch(0.7 0.135 226)",  light: "oklch(0.5 0.14 230)" },
      "navy-electric":{ dark: "oklch(0.7 0.15 250)",   light: "oklch(0.5 0.16 255)" },
      "navy-soft":    { dark: "oklch(0.72 0.1 235)",   light: "oklch(0.55 0.12 238)" },
    };
    const v = map[t.accent] || map["cyan-bright"];
    const root = document.documentElement;
    root.style.setProperty("--cyan", t.theme === "dark" ? v.dark : v.light);
  }, [t.accent, t.theme]);

  const toggleTheme = () => setTweak("theme", t.theme === "dark" ? "light" : "dark");

  const go = (r) => { setRoute(r); window.scrollTo(0, 0); };
  const onSignIn = () => go("/login");

  // Render route
  const props = {
    theme: t.theme, onToggleTheme: toggleTheme,
    brandName: t.brandName, signedIn: !!t.signedIn,
    verified: !!t.verified,
    onSignIn, go,
  };

  let view;
  if (route === "/") view = <HomePage live={!!t.live} locked={!t.signedIn} {...props} />;
  else if (route === "/?offline") view = <HomePage live={false} locked={!t.signedIn} {...props} />;
  else if (route === "/login") view = <LoginPage {...props} />;
  else if (route.startsWith("/invite/")) view = <InvitePage {...props} valid={!route.endsWith("INVALID")} />;
  else if (route === "/setup") view = <SetupPage {...props} />;
  else if (route === "/[channel]") view = <ChannelDen channel="mrdemonwolf" live {...props} />;
  else if (route === "/[channel]?offline") view = <ChannelDen channel="mrdemonwolf" live={false} {...props} />;
  else if (route === "/popout/chat") view = <PopoutChatPage {...props} />;
  else if (route === "/privacy") view = <LegalPage kind="privacy" {...props} />;
  else if (route === "/terms") view = <LegalPage kind="terms" {...props} />;
  else if (route === "/account") view = <ViewerAccountPage {...props} />;
  else if (route === "/account/security") view = (
    <DashboardShell route={route} {...props}><SecurityPage {...props} /></DashboardShell>
  );
  else if (route === "/404") view = <NotFoundPage {...props} />;
  else if (route === "/error") view = <ErrorPage {...props} />;
  else if (route === "/loading") view = <LoadingPage {...props} />;
  else if (route.startsWith("/dashboard")) {
    const inner = (() => {
      switch (route) {
        case "/dashboard": return <DashboardOverview go={go} />;
        case "/dashboard/stream-key": return <StreamKeyPage />;
        case "/dashboard/status": return <StatusPage />;
        case "/dashboard/panels": return <PanelsPage />;
        case "/dashboard/chat": return <ChatModPage />;
        case "/dashboard/emotes": return <EmotesPage />;
        case "/dashboard/invites": return <InvitesPage />;
        case "/dashboard/notifications": return <NotificationsPage />;
        case "/dashboard/branding": return <BrandingPage />;
        case "/dashboard/stats": return <StatsPage />;
        case "/dashboard/account": return <AccountPage />;
        default: return <DashboardOverview go={go} />;
      }
    })();
    view = <DashboardShell route={route} {...props}>{inner}</DashboardShell>;
  } else {
    view = <NotFoundPage {...props} />;
  }

  // Tweaks panel
  const tweaksUI = (
    <TweaksPanel title="Tweaks">
      <TweakSection label="Theme">
        <TweakRadio
          label="Mode"
          value={t.theme}
          onChange={v => setTweak("theme", v)}
          options={["dark", "light"]}
        />
        <TweakSelect
          label="Accent"
          value={t.accent}
          onChange={v => setTweak("accent", v)}
          options={[
            { value: "cyan-bright", label: "Cyan · bright" },
            { value: "cyan-deep", label: "Cyan · deep" },
            { value: "navy-electric", label: "Navy · electric" },
            { value: "navy-soft", label: "Navy · soft" },
          ]}
        />
      </TweakSection>
      <TweakSection label="Stream state">
        <TweakToggle label="Live" value={!!t.live} onChange={v => setTweak("live", v)} />
        <TweakToggle label="Signed in" value={!!t.signedIn} onChange={v => setTweak("signedIn", v)} />
      </TweakSection>
      <TweakSection label="White-label">
        <TweakText label="Brand name" value={t.brandName} onChange={v => setTweak("brandName", v)} />
        <TweakToggle label="Verified mark" value={!!t.verified} onChange={v => setTweak("verified", v)} />
      </TweakSection>
    </TweaksPanel>
  );

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg)", color: "var(--fg)" }}>
      <RouteJumper route={route} setRoute={go} open={showRoutes} setOpen={setShowRoutes} />
      <div data-screen-label={routeLabel(route)}>{view}</div>
      {tweaksUI}
    </div>
  );
}

function routeLabel(r) {
  const found = ROUTES.find(x => x.id === r);
  return found ? `${routeIndex(r) + 1 < 10 ? "0" : ""}${routeIndex(r) + 1} ${found.label}` : r;
}
function routeIndex(r) { return ROUTES.findIndex(x => x.id === r); }

// Floating route jumper — collapsed pill in bottom-left, expands to full list
function RouteJumper({ route, setRoute, open, setOpen }) {
  const grouped = useMemo(() => {
    const map = {};
    ROUTES.forEach(r => { (map[r.group] ||= []).push(r); });
    return map;
  }, []);
  const idx = ROUTES.findIndex(r => r.id === route);
  const cur = ROUTES[idx];

  return (
    <>
      <div style={{
        position: "fixed", bottom: 16, left: 16, zIndex: 100,
        display: "flex", gap: 6,
      }}>
        <button
          className="hc-btn hc-btn-secondary"
          onClick={() => setOpen(o => !o)}
          style={{ paddingLeft: 10, paddingRight: 12, gap: 8, boxShadow: "0 8px 24px rgba(0,0,0,0.25)" }}
        >
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-3)", letterSpacing: "0.06em" }}>
            {String(idx + 1).padStart(2, "0")}/{String(ROUTES.length).padStart(2, "0")}
          </span>
          <span style={{ fontWeight: 600 }}>{cur?.label || "Route"}</span>
          <Icon.ChevronDown size={12} />
        </button>
        <button
          className="hc-btn hc-btn-secondary hc-btn-icon"
          title="Previous"
          onClick={() => setRoute(ROUTES[Math.max(0, idx - 1)].id)}
        >
          <Icon.ArrowLeft size={14} />
        </button>
        <button
          className="hc-btn hc-btn-secondary hc-btn-icon"
          title="Next"
          onClick={() => setRoute(ROUTES[Math.min(ROUTES.length - 1, idx + 1)].id)}
        >
          <span style={{ transform: "rotate(180deg)", display: "inline-flex" }}><Icon.ArrowLeft size={14} /></span>
        </button>
      </div>
      {open && (
        <>
          <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.4)", zIndex: 99 }} onClick={() => setOpen(false)} />
          <div className="hc-card scroll-y" style={{
            position: "fixed", bottom: 64, left: 16, zIndex: 101,
            width: 320, maxHeight: "70vh", padding: 10,
            background: "var(--bg-2)",
            boxShadow: "0 12px 40px rgba(0,0,0,0.4)",
          }}>
            <div className="eyebrow" style={{ padding: "4px 8px 10px" }}>JUMP TO ROUTE · {ROUTES.length}</div>
            {Object.entries(grouped).map(([group, items]) => (
              <div key={group} style={{ marginBottom: 10 }}>
                <div className="eyebrow" style={{ padding: "6px 8px", color: "var(--fg-4)" }}>{group}</div>
                {items.map(r => (
                  <button
                    key={r.id}
                    onClick={() => { setRoute(r.id); setOpen(false); }}
                    style={{
                      display: "flex", alignItems: "center", gap: 10,
                      width: "100%", padding: "7px 10px",
                      background: r.id === route ? "var(--bg-3)" : "transparent",
                      border: "none", borderRadius: 6,
                      color: r.id === route ? "var(--fg)" : "var(--fg-2)",
                      fontSize: 12.5, cursor: "pointer", textAlign: "left",
                      fontFamily: "var(--font-ui)",
                      borderLeft: r.id === route ? "2px solid var(--cyan)" : "2px solid transparent",
                    }}
                    onMouseEnter={(e) => { if (r.id !== route) e.currentTarget.style.background = "var(--bg-3)"; }}
                    onMouseLeave={(e) => { if (r.id !== route) e.currentTarget.style.background = "transparent"; }}
                  >
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-4)", width: 22 }}>{String(ROUTES.indexOf(r) + 1).padStart(2, "0")}</span>
                    <span style={{ flex: 1 }}>{r.label}</span>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-4)", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.id}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
