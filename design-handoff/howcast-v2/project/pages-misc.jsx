/* global React, Icon, BrandMark, ThemeToggle, Avatar, ChatDock, PageHeader, Card, Field, Status, TabRow */
const { useState: pm_useState } = React;

// =============== /account/security ===============
function SecurityPage({ go }) {
  return (
    <>
      <PageHeader title="Security" subtitle="Password, 2FA, active sessions." />
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 720 }}>
        <Card>
          <div className="eyebrow" style={{ marginBottom: 12 }}>CHANGE PASSWORD</div>
          <Field label="Current password"><input className="hc-input" type="password" placeholder="••••••••" /></Field>
          <div style={{ marginTop: 14 }}><Field label="New password"><input className="hc-input" type="password" placeholder="••••••••" /></Field></div>
          <div style={{ marginTop: 14 }}><Field label="Confirm new password"><input className="hc-input" type="password" placeholder="••••••••" /></Field></div>
          <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
            <button className="hc-btn hc-btn-primary">Update password</button>
          </div>
        </Card>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 14 }}>
            <div>
              <div className="eyebrow">TWO-FACTOR (TOTP)</div>
              <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 4 }}>Scan with any TOTP app and enter the 6-digit code.</div>
            </div>
            <Status kind="pending">NOT ENROLLED</Status>
          </div>
          <div style={{ display: "flex", gap: 22, alignItems: "center" }}>
            <div style={{
              width: 132, height: 132,
              background: "white",
              border: "1px solid var(--line-2)",
              borderRadius: 10,
              padding: 8,
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}>
              <QrPlaceholder />
            </div>
            <div style={{ flex: 1 }}>
              <Field label="6-digit code">
                <div style={{ display: "flex", gap: 6 }}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <input key={i} className="hc-input mono" maxLength={1}
                      style={{ width: 38, height: 44, textAlign: "center", fontSize: 18 }}
                      defaultValue={["4","2","8","9","1","5"][i]}
                    />
                  ))}
                </div>
              </Field>
              <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
                <button className="hc-btn hc-btn-primary">Enable 2FA</button>
                <button className="hc-btn hc-btn-ghost">Show recovery codes</button>
              </div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="eyebrow" style={{ marginBottom: 12 }}>ACTIVE SESSIONS</div>
          {[
            { dev: "MacBook Pro · Safari", loc: "Austin, TX", time: "now", current: true },
            { dev: "iPhone · iOS 18", loc: "Austin, TX", time: "3h ago" },
            { dev: "Studio PC · Firefox", loc: "Austin, TX", time: "yesterday" },
          ].map(s => (
            <div key={s.dev} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px dashed var(--line)" }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 500 }}>{s.dev}{s.current && <span style={{ marginLeft: 8, color: "var(--success)", fontSize: 11, fontFamily: "var(--font-mono)" }}>· CURRENT</span>}</div>
                <div style={{ fontSize: 12, color: "var(--fg-3)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{s.loc} · {s.time}</div>
              </div>
              {!s.current && <button className="hc-btn hc-btn-destructive-ghost hc-btn-sm">Revoke</button>}
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}

function QrPlaceholder() {
  // Faux QR — deterministic 13×13 grid
  const cells = [];
  const seed = (i, j) => ((i * 7 + j * 11 + (i * j) % 5) % 3) === 0;
  for (let i = 0; i < 13; i++) {
    for (let j = 0; j < 13; j++) {
      const corner = (i < 3 && j < 3) || (i < 3 && j > 9) || (i > 9 && j < 3);
      const cornerEdge = (i === 0 || i === 2 || j === 0 || j === 2 || i === 12 || j === 12);
      const filled = corner ? cornerEdge || (i === 1 && j === 1) || (i === 1 && j === 11) || (i === 11 && j === 1) : seed(i, j);
      cells.push(<rect key={i + "," + j} x={j * 9} y={i * 9} width="8" height="8" fill={filled ? "#091533" : "transparent"} />);
    }
  }
  return <svg viewBox="0 0 117 117" width="116" height="116">{cells}</svg>;
}

// =============== /popout/chat ===============
function PopoutChatPage({ theme, onToggleTheme, brandName, go }) {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{
        height: 36, padding: "0 12px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid var(--line)",
        background: "var(--bg-2)",
      }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, letterSpacing: "0.06em", color: "var(--fg-3)" }}>
          STREAM CHAT · MRDEMONWOLF
        </span>
        <div style={{ display: "flex", gap: 4 }}>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button className="hc-btn hc-btn-ghost hc-btn-icon" onClick={() => go("/")}><Icon.X size={14}/></button>
        </div>
      </header>
      <div style={{ flex: 1, minHeight: 0 }}>
        <ChatDock popout />
      </div>
    </div>
  );
}

// =============== /privacy & /terms ===============
function LegalPage({ kind, theme, onToggleTheme, brandName, signedIn, onSignIn, go }) {
  const isPriv = kind === "privacy";
  return (
    <div style={{ minHeight: "100vh" }}>
      <header style={{
        height: 56, padding: "0 24px",
        borderBottom: "1px solid var(--line)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "var(--bg)",
      }}>
        <a onClick={() => go("/")} style={{ cursor: "pointer" }}><BrandMark size={22} brandName={brandName} /></a>
        <div style={{ display: "flex", gap: 6 }}>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          {!signedIn && <button className="hc-btn hc-btn-ghost" onClick={onSignIn}>Sign in</button>}
        </div>
      </header>
      <article style={{ maxWidth: 720, margin: "0 auto", padding: "64px 24px 96px" }}>
        <div style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)", marginBottom: 18 }}>
          LAST UPDATED · MAY 2 2026
        </div>
        <h1 className="font-display" style={{ fontSize: 40, fontWeight: 700, letterSpacing: "-0.025em", margin: "0 0 8px" }}>
          {isPriv ? "Privacy" : "Terms of service"}
        </h1>
        <p style={{ fontSize: 16, color: "var(--fg-2)", lineHeight: 1.7, margin: "0 0 32px" }}>
          {isPriv
            ? "We log only what's needed to keep your stream and chat working. Nothing is sold, syndicated, or fed to ads."
            : "By using HowlCast you agree to these terms. The instance owner sets the rules of their den; we keep the lights on."}
        </p>

        {(isPriv ? PRIVACY_SECTIONS : TERMS_SECTIONS).map(([h, body]) => (
          <section key={h} style={{ marginBottom: 28 }}>
            <h2 className="font-display legal-h2" style={{ fontSize: 22, fontWeight: 600, margin: "32px 0 12px" }}>{h}</h2>
            <p style={{ fontSize: 15, color: "var(--fg-2)", lineHeight: 1.75, margin: 0 }}>{body}</p>
          </section>
        ))}
      </article>
    </div>
  );
}

const PRIVACY_SECTIONS = [
  ["What we collect", "Email and a hashed password for sign-in. Username, optional avatar and bio you provide. Your messages in chat (retained 90 days, then purged). Approximate region and device user-agent for session security."],
  ["What we don't", "We don't run trackers or third-party ad pixels. We don't sell or syndicate your data. The broadcaster cannot read your email."],
  ["Where it lives", "Postgres in us-east, daily encrypted backups for 30 days. Stream content itself is not recorded."],
  ["Your controls", "Export or delete your account from /dashboard/account. Deletion is irreversible and cascades through chat history within 24 hours."],
  ["Contact", "Privacy questions go to privacy@howlcast.dev — replies within 5 working days."],
];
const TERMS_SECTIONS = [
  ["The instance", "HowlCast is sold as a single-broadcaster instance. The broadcaster is responsible for content posted to their channel and for moderating chat."],
  ["Acceptable use", "Don't post unlawful, harassing, or sexually-explicit-of-minors material. Don't ban-evade. Don't reverse-engineer the player to scrape streams."],
  ["Invites", "Invites are one-time codes. Sharing your account is a violation. The broadcaster may revoke invites without notice."],
  ["Service availability", "We aim for 99.9% monthly uptime. Maintenance windows are pre-announced in the broadcaster's Discord."],
  ["Changes", "We'll post the changelog here and in the dashboard 14 days before any material change takes effect."],
];

// =============== 404 / error / loading ===============
function NotFoundPage({ go, theme, onToggleTheme, brandName }) {
  return (
    <Centered theme={theme} onToggleTheme={onToggleTheme} brandName={brandName} go={go}>
      <span className="eyebrow" style={{ fontSize: 11 }}>404</span>
      <h1 className="font-display" style={{ fontSize: 40, fontWeight: 700, margin: "8px 0", letterSpacing: "-0.025em" }}>Path not found</h1>
      <p style={{ color: "var(--fg-3)", maxWidth: 380, textAlign: "center", margin: 0 }}>
        Whatever you were following ran cold here. The link might be old or the page may have moved.
      </p>
      <button className="hc-btn hc-btn-ghost" style={{ marginTop: 16 }} onClick={() => go("/")}>
        <Icon.ArrowLeft size={14}/> Back home
      </button>
    </Centered>
  );
}

function ErrorPage({ go, theme, onToggleTheme, brandName }) {
  return (
    <Centered theme={theme} onToggleTheme={onToggleTheme} brandName={brandName} go={go}>
      <span className="eyebrow" style={{ fontSize: 11, color: "var(--destructive)" }}>500</span>
      <h1 className="font-display" style={{ fontSize: 40, fontWeight: 700, margin: "8px 0", letterSpacing: "-0.025em" }}>Something broke</h1>
      <p style={{ color: "var(--fg-3)", maxWidth: 380, textAlign: "center", margin: 0 }}>
        We've logged the error. Try again — if it keeps happening, ping the broadcaster's Discord.
      </p>
      <div style={{ marginTop: 8, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-4)" }}>err_id · 4f07a8 · 21:18:42</div>
      <div style={{ display: "flex", gap: 8, marginTop: 16 }}>
        <button className="hc-btn hc-btn-primary"><Icon.Refresh size={14}/> Reset</button>
        <button className="hc-btn hc-btn-ghost" onClick={() => go("/")}>Back home</button>
      </div>
    </Centered>
  );
}

function LoadingPage({ theme, onToggleTheme, brandName, go }) {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{
        height: 56, padding: "0 24px",
        borderBottom: "1px solid var(--line)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "var(--bg)",
      }}>
        <BrandMark size={22} brandName={brandName} />
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <Spinner />
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
        </div>
      </header>
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 360px" }}>
        <div style={{ padding: 24 }}>
          <div className="skel" style={{ height: 0, paddingBottom: "56.25%", borderRadius: 14 }} />
          <div style={{ display: "flex", gap: 16, marginTop: 18, alignItems: "center" }}>
            <div className="skel" style={{ width: 56, height: 56, borderRadius: 999 }} />
            <div style={{ flex: 1 }}>
              <div className="skel" style={{ width: 220, height: 18 }} />
              <div className="skel" style={{ width: 360, height: 12, marginTop: 8 }} />
              <div style={{ display: "flex", gap: 6, marginTop: 12 }}>
                <div className="skel" style={{ width: 60, height: 22, borderRadius: 999 }} />
                <div className="skel" style={{ width: 80, height: 22, borderRadius: 999 }} />
                <div className="skel" style={{ width: 60, height: 22, borderRadius: 999 }} />
              </div>
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 28 }}>
            {[0,1,2].map(i => (
              <div key={i} className="hc-card">
                <div className="skel" style={{ width: 72, height: 10 }} />
                <div className="skel" style={{ width: "100%", height: 14, marginTop: 12 }} />
                <div className="skel" style={{ width: "85%", height: 14, marginTop: 8 }} />
                <div className="skel" style={{ width: "60%", height: 14, marginTop: 8 }} />
              </div>
            ))}
          </div>
        </div>
        <aside style={{ borderLeft: "1px solid var(--line)", padding: 14 }}>
          <div className="skel" style={{ width: 100, height: 10, marginBottom: 14 }} />
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              <div className="skel" style={{ width: 38, height: 10 }} />
              <div className="skel" style={{ flex: 1, height: 10 }} />
            </div>
          ))}
        </aside>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <span style={{
      display: "inline-block", width: 16, height: 16,
      border: "2px solid var(--line-2)", borderTopColor: "var(--cyan)",
      borderRadius: 999, animation: "spin 0.9s linear infinite",
    }}>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </span>
  );
}

function Centered({ children, theme, onToggleTheme, brandName, go }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{
        height: 56, padding: "0 24px",
        borderBottom: "1px solid var(--line)",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        background: "var(--bg)",
      }}>
        <a onClick={() => go("/")} style={{ cursor: "pointer" }}><BrandMark size={22} brandName={brandName} /></a>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </header>
      <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 24, gap: 4 }}>
        {children}
      </div>
    </div>
  );
}

// =============== Viewer account (non-broadcaster) ===============
function ViewerAccountPage({ theme, onToggleTheme, brandName, signedIn, onSignIn, go }) {
  const [tab, setTab] = pm_useState("Profile");
  return (
    <div style={{ minHeight: "100vh" }}>
      <header style={{
        height: 56, padding: "0 24px", borderBottom: "1px solid var(--line)",
        display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg)",
        position: "sticky", top: 0, zIndex: 20,
      }}>
        <a onClick={() => go("/")} style={{ cursor: "pointer" }}><BrandMark size={22} brandName={brandName} /></a>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button className="hc-btn hc-btn-ghost" onClick={() => go("/")}><Icon.ArrowLeft size={14}/> Back to den</button>
        </div>
      </header>
      <div style={{ maxWidth: 720, margin: "0 auto", padding: "32px 24px 96px" }}>
        <PageHeader title="My account" subtitle="Your viewer identity in mrdemonwolf's den." />
        <div style={{ marginBottom: 18 }}>
          <TabRow tabs={["Profile", "Notifications", "Security", "Sessions", "Danger"]} value={tab} onChange={setTab} />
        </div>
        {tab === "Profile" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card>
              <div className="eyebrow" style={{ marginBottom: 12 }}>PROFILE PICTURE</div>
              <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                <Avatar size={80} name="HU" hue={210} halo />
                <button className="hc-btn hc-btn-secondary">Upload new</button>
                <button className="hc-btn hc-btn-ghost">Remove</button>
              </div>
              <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 10 }}>PNG or JPG. Square works best.</div>
            </Card>
            <Card>
              <Field label="Username" right={<span style={{ fontSize: 11, color: "var(--fg-3)" }}>How you appear in chat</span>}>
                <input className="hc-input mono" defaultValue="huntress" />
              </Field>
              <div style={{ marginTop: 14 }}><Field label="Display name"><input className="hc-input" defaultValue="Huntress" /></Field></div>
              <div style={{ marginTop: 14 }}><Field label="Email" right={<span style={{ fontSize: 11, color: "var(--fg-3)" }}>Used for sign-in only</span>}><input className="hc-input" type="email" defaultValue="huntress@example.com" /></Field></div>
              <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button className="hc-btn hc-btn-ghost">Discard</button>
                <button className="hc-btn hc-btn-primary">Save changes</button>
              </div>
            </Card>
            <Card>
              <div className="eyebrow" style={{ marginBottom: 12 }}>YOUR NAME COLOR IN CHAT</div>
              <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
                <span style={{ display: "inline-block", width: 36, height: 36, borderRadius: 6, background: "oklch(0.7 0.13 280)", border: "1px solid var(--line-2)" }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>Auto-picked from your username</div>
                  <div style={{ fontSize: 12, color: "var(--fg-3)" }}>You can override it if the default isn't readable.</div>
                </div>
                <button className="hc-btn hc-btn-ghost">Change color</button>
              </div>
            </Card>
          </div>
        )}
        {tab === "Notifications" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card>
              <div className="eyebrow" style={{ marginBottom: 6 }}>CHAT SOUNDS</div>
              <div style={{ fontSize: 12, color: "var(--fg-3)", marginBottom: 12, lineHeight: 1.5 }}>
                Plays in the browser tab while you have chat open.
              </div>
              <Toggle label="Play a sound when someone @mentions me" sub="Soft chime, only when the chat tab is open" defaultOn />
              <Toggle label="Play a sound when mrdemonwolf replies to me" sub="Same chime, only for replies from the host" />
              <Toggle label="Play a sound when a new stream starts" sub="Only fires while you're already on this site" defaultOn />
            </Card>
            <Card style={{ background: "var(--bg-3)" }}>
              <div style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.6 }}>
                <strong>No browser push or email notifications.</strong> If you want a heads-up when mrdemonwolf goes live, the best way is to join the Discord they linked on the channel page.
              </div>
            </Card>
          </div>
        )}
        {tab === "Security" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <Card>
              <div className="eyebrow" style={{ marginBottom: 6 }}>PASSWORD</div>
              <div style={{ fontSize: 12, color: "var(--fg-3)", marginBottom: 14, lineHeight: 1.5 }}>
                Last changed 4 months ago.
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <Field label="Current password"><input className="hc-input" type="password" defaultValue="••••••••••" /></Field>
                <div />
                <Field label="New password"><input className="hc-input" type="password" /></Field>
                <Field label="Confirm new password"><input className="hc-input" type="password" /></Field>
              </div>
              <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button className="hc-btn hc-btn-ghost">Cancel</button>
                <button className="hc-btn hc-btn-primary">Update password</button>
              </div>
            </Card>
            <Card>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 14 }}>
                <div style={{ flex: 1 }}>
                  <div className="eyebrow" style={{ marginBottom: 6 }}>TWO-FACTOR AUTHENTICATION</div>
                  <div style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.6, marginBottom: 4 }}>
                    Add a second step at sign-in using an authenticator app (1Password, Authy, Google Authenticator).
                  </div>
                  <div style={{ fontSize: 12, color: "var(--fg-3)" }}>
                    Status: <span style={{ color: "var(--fg-4)", fontFamily: "var(--font-mono)" }}>NOT ENABLED</span>
                  </div>
                </div>
                <span style={{
                  padding: "4px 8px", borderRadius: 999, fontSize: 10, fontFamily: "var(--font-mono)",
                  letterSpacing: "0.06em", background: "var(--bg-3)", border: "1px solid var(--line-2)", color: "var(--fg-3)",
                }}>OFF</span>
              </div>
              <div style={{
                marginTop: 14, padding: 16, borderRadius: 10, background: "var(--bg-3)",
                border: "1px solid var(--line)", display: "grid", gridTemplateColumns: "120px 1fr", gap: 16, alignItems: "center",
              }}>
                <div style={{
                  width: 120, height: 120, borderRadius: 8, background: "var(--bg)",
                  border: "1px solid var(--line-2)",
                  backgroundImage: "repeating-linear-gradient(45deg, var(--fg) 0 4px, transparent 4px 8px), repeating-linear-gradient(-45deg, var(--fg) 0 4px, transparent 4px 8px)",
                  backgroundSize: "16px 16px", opacity: 0.85,
                }} />
                <div>
                  <div style={{ fontSize: 12, color: "var(--fg-3)", marginBottom: 6, fontFamily: "var(--font-mono)", textTransform: "uppercase", letterSpacing: "0.06em" }}>Step 1 · Scan</div>
                  <div style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.5, marginBottom: 12 }}>
                    Scan this QR code with your authenticator app, or enter the setup key manually.
                  </div>
                  <div className="mono" style={{
                    fontSize: 12, padding: "6px 8px", background: "var(--bg)", border: "1px solid var(--line)",
                    borderRadius: 6, color: "var(--fg-2)", display: "inline-block", letterSpacing: "0.04em",
                  }}>JBSW Y3DP EHPK 3PXP</div>
                </div>
              </div>
              <div style={{ marginTop: 14 }}>
                <Field label="Step 2 · Enter the 6-digit code from your app">
                  <input className="hc-input mono" placeholder="000 000" style={{ letterSpacing: "0.3em", fontSize: 16 }} />
                </Field>
              </div>
              <div style={{ marginTop: 16, display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button className="hc-btn hc-btn-ghost">Cancel</button>
                <button className="hc-btn hc-btn-primary">Enable 2FA</button>
              </div>
            </Card>
            <Card>
              <div className="eyebrow" style={{ marginBottom: 6 }}>RECOVERY CODES</div>
              <div style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.6, marginBottom: 12 }}>
                Generated once you turn on 2FA. Save these somewhere safe — each one lets you sign in without your authenticator.
              </div>
              <button className="hc-btn hc-btn-secondary" disabled style={{ opacity: 0.5, cursor: "not-allowed" }}>
                Generate recovery codes
              </button>
            </Card>
          </div>
        )}
        {tab === "Sessions" && (
          <Card>
            {[
              { dev: "Chrome · macOS", loc: "Austin, TX", time: "now", current: true },
              { dev: "iOS app · iPhone 15", loc: "Austin, TX", time: "1d ago" },
            ].map(s => (
              <div key={s.dev} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 0", borderBottom: "1px dashed var(--line)" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{s.dev}{s.current && <span style={{ marginLeft: 8, color: "var(--success)", fontSize: 11, fontFamily: "var(--font-mono)" }}>· CURRENT</span>}</div>
                  <div style={{ fontSize: 12, color: "var(--fg-3)", fontFamily: "var(--font-mono)", marginTop: 2 }}>{s.loc} · {s.time}</div>
                </div>
                {!s.current && <button className="hc-btn hc-btn-destructive-ghost hc-btn-sm">Revoke</button>}
              </div>
            ))}
          </Card>
        )}
        {tab === "Danger" && (
          <Card style={{ borderColor: "color-mix(in oklab, var(--destructive) 50%, transparent)" }}>
            <div className="eyebrow" style={{ color: "var(--destructive)", marginBottom: 8 }}>LEAVE THE DEN</div>
            <div style={{ fontSize: 13, color: "var(--fg-2)", marginBottom: 16, lineHeight: 1.6 }}>
              Deleting your account purges your chat history and ends every session. The broadcaster will need to send a fresh invite to bring you back.
            </div>
            <button className="hc-btn hc-btn-destructive">Delete viewer account</button>
          </Card>
        )}
      </div>
    </div>
  );
}

Object.assign(window, { SecurityPage, PopoutChatPage, LegalPage, NotFoundPage, ErrorPage, LoadingPage, ViewerAccountPage });
