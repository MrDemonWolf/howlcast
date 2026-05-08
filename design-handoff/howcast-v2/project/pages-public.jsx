/* global React, Icon, BrandMark, ThemeToggle, Avatar, LivePill, ViewerChip, Verified, Tag, TabRow, PinnedMessage, TopNav */
const { useState: pu_useState } = React;

// ============== Player surface (LIVE / OFFLINE) ==============
function PlayerSurface({ live = true, channel, viewers, title, locked, onUnlock }) {
  return (
    <div className="player-surface" style={{ position: "relative" }}>
      {live ? (
        <>
          <div style={{
            position: "absolute", inset: 0,
            display: "flex", alignItems: "center", justifyContent: "center",
            color: "var(--fg-4)", fontFamily: "var(--font-mono)",
            fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase",
          }}>
            <div style={{ textAlign: "center", opacity: 0.7 }}>
              <Icon.Wolf size={64} stroke={1.2} />
              <div style={{ marginTop: 12 }}>{channel || "stream"} — 1080p60</div>
            </div>
          </div>
          <div style={{ position: "absolute", top: 14, left: 14, display: "flex", gap: 8 }}>
            <LivePill />
          </div>
          <div style={{ position: "absolute", top: 14, right: 14, display: "flex", gap: 8 }}>
            <ViewerChip count={viewers || 1247} />
          </div>
          <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: 14,
            background: "linear-gradient(180deg, transparent, rgba(0,0,0,0.55))",
            display: "flex", alignItems: "center", justifyContent: "space-between"
          }}>
            <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
              <PlayerCtl><svg width="14" height="14" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7Z"/></svg></PlayerCtl>
              <PlayerCtl><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M11 5 6 9H2v6h4l5 4Z"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg></PlayerCtl>
              <span style={{ color: "white", fontSize: 11, fontFamily: "var(--font-mono)", marginLeft: 6 }}>02:14:09</span>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <PlayerCtl><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/></svg></PlayerCtl>
            </div>
          </div>
        </>
      ) : (
        <OfflineBanner channel={channel} />
      )}
    </div>
  );
}
function PlayerCtl({ children }) {
  return <button style={{
    width: 30, height: 30, display: "inline-flex", alignItems: "center", justifyContent: "center",
    background: "rgba(0,0,0,0.45)", border: "none", borderRadius: 6, cursor: "pointer",
    backdropFilter: "blur(6px)",
  }}>{children}</button>;
}

function OfflineBanner({ channel }) {
  return (
    <div style={{
      position: "absolute", inset: 0,
      display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
      gap: 14, padding: 24, textAlign: "center",
    }}>
      <div className="eyebrow" style={{ color: "var(--fg-4)" }}>STREAM IS OFFLINE</div>
      <h2 className="font-display" style={{ fontSize: 36, fontWeight: 700, margin: 0, letterSpacing: "-0.025em" }}>See you next time</h2>
      <p style={{ color: "var(--fg-3)", maxWidth: 380, margin: 0, fontSize: 14 }}>
        {channel || "mrdemonwolf"} isn't streaming right now. Turn on alerts and we'll ping your Discord the moment they go live.
      </p>
      <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
        <button className="hc-btn hc-btn-secondary"><Icon.Bell size={14}/> Alert me when live</button>
        <button className="hc-btn hc-btn-ghost">About the channel</button>
      </div>
    </div>
  );
}

// ============== Chat dock ==============
const SAMPLE_CHAT = [
  { user: "huntress", color: 280, msg: "yooo just got here", time: "21:14" },
  { user: "vexlrune", color: 200, msg: "GG that last fight", time: "21:14", emotes: 1 },
  { user: "mrdemonwolf", broadcaster: true, msg: "ty everyone for the patience on the audio fix", time: "21:15" },
  { user: "ferralforge", color: 130, msg: "what build are u running rn", time: "21:15" },
  { user: "owlbearry", color: 30, msg: "POG ", emotes: 2, time: "21:16" },
  { user: "stargrazer", color: 320, msg: "first time catching live, awesome stream", time: "21:16" },
  { user: "northpine", color: 160, msg: "the lighting setup looks insane today", time: "21:17" },
  { user: "kettlewitch", color: 50, msg: "are we doing co-op next session?", time: "21:17" },
  { user: "mrdemonwolf", broadcaster: true, msg: "yeah, friday 8pm CT", time: "21:18" },
  { user: "rumblefoxx", color: 100, msg: "mark the calendar", time: "21:18" },
];

function ChatMessage({ m }) {
  return (
    <div style={{ padding: "5px 12px", fontSize: 13, lineHeight: 1.55, wordBreak: "break-word" }}>
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 10.5, color: "var(--fg-4)", marginRight: 8 }}>{m.time}</span>
      {m.broadcaster && (
        <span style={{
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          background: "var(--live)", color: "white", borderRadius: 3,
          fontSize: 9, fontWeight: 700, letterSpacing: "0.06em",
          padding: "1px 5px", marginRight: 6, verticalAlign: 1,
          fontFamily: "var(--font-mono)",
        }}>HOST</span>
      )}
      <span style={{
        fontWeight: 600,
        color: m.broadcaster ? "var(--cyan)" : `oklch(0.75 0.13 ${m.color || 240})`
      }}>{m.user}</span>
      <span style={{ color: "var(--fg-3)" }}>: </span>
      <span style={{ color: "var(--fg)" }}>{m.msg}</span>
      {m.emotes > 0 && Array.from({ length: m.emotes }).map((_, i) => (
        <span key={i} className="emote-sq" style={{ marginLeft: 4 }} />
      ))}
    </div>
  );
}

function ChatDock({ locked, popout, onPopout, onSignIn }) {
  const [draft, setDraft] = pu_useState("");
  return (
    <div style={{
      borderLeft: popout ? "none" : "1px solid var(--line)",
      display: "flex", flexDirection: "column",
      background: "var(--bg)",
      height: popout ? "100vh" : "100%",
      minHeight: 600,
    }}>
      <div style={{
        height: 44, padding: "0 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        borderBottom: "1px solid var(--line)",
      }}>
        <span className="eyebrow">CHAT</span>
        <div style={{ display: "flex", gap: 4 }}>
          <button className="hc-btn hc-btn-ghost hc-btn-icon" style={{ width: 28, height: 28 }} title="Settings"><Icon.Settings size={14}/></button>
          {!popout && <button className="hc-btn hc-btn-ghost hc-btn-icon" style={{ width: 28, height: 28 }} title="Pop out" onClick={onPopout}><Icon.Share size={14}/></button>}
        </div>
      </div>
      <PinnedMessage>Friday 8pm CT — co-op night. Code drop in #stream.</PinnedMessage>
      <div className="scroll-y" style={{ flex: 1, padding: "8px 0" }}>
        {SAMPLE_CHAT.map((m, i) => <ChatMessage key={i} m={m} />)}
      </div>
      <div style={{ padding: 12, borderTop: "1px solid var(--line)", position: "relative" }}>
        <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
          <input
            className="hc-input"
            placeholder={locked ? "Sign in to join the chat" : "Say something nice"}
            value={draft}
            onChange={e => setDraft(e.target.value)}
            disabled={locked}
            style={{ paddingRight: 36 }}
          />
          <button className="hc-btn hc-btn-primary" style={{ width: 28, height: 28, padding: 0, borderRadius: 6 }} disabled={!draft.length}>
            <Icon.Send size={13} />
          </button>
        </div>
        {locked && (
          <div
            style={{
              position: "absolute", inset: 0,
              backdropFilter: "blur(4px)",
              background: "color-mix(in oklab, var(--bg) 60%, transparent)",
              display: "flex", alignItems: "center", justifyContent: "center",
              gap: 8,
            }}
          >
            <button className="hc-btn hc-btn-primary hc-btn-sm" onClick={onSignIn}>Sign in to chat</button>
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8 }}>
          <button className="hc-btn hc-btn-ghost hc-btn-sm" style={{ paddingLeft: 6, paddingRight: 6 }}><Icon.Smiley size={14} /></button>
          <span style={{ fontSize: 10, color: "var(--fg-4)", fontFamily: "var(--font-mono)" }}>SLOW MODE · 5s BETWEEN MESSAGES</span>
        </div>
      </div>
    </div>
  );
}

// ============== DEN — channel viewer ==============
function ChannelDen({ channel, brandName, live, locked, onSignIn, onPopoutChat, theme, onToggleTheme, signedIn, go, verified = true }) {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <TopNav theme={theme} onToggleTheme={onToggleTheme} brandName={brandName} signedIn={signedIn} onSignIn={onSignIn} go={go} />
      <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 360px", minHeight: 0 }}>
        <div className="scroll-y" style={{ padding: 24 }}>
          <PlayerSurface live={live} channel={channel} viewers={1247} />
          {/* meta row */}
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start", marginTop: 18 }}>
            <Avatar size={56} name={channel?.slice(0, 2) || "MD"} hue={252} halo live={live} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div className="font-display" style={{ fontSize: 22, fontWeight: 700, letterSpacing: "-0.022em" }}>
                  {channel || "mrdemonwolf"}
                </div>
                {verified && <Verified />}
              </div>
              <div style={{ color: "var(--fg-2)", fontSize: 14, marginTop: 4, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                {live ? "Veiled Hollow run — blind first attempt, no glitches" : "Stream returns Tuesday — see Discord for time"}
              </div>
              <div style={{ display: "flex", gap: 6, marginTop: 10, flexWrap: "wrap" }}>
                <Tag>Souls-likes</Tag><Tag>Blind run</Tag><Tag>English</Tag>
              </div>
            </div>
            <div style={{ display: "flex", gap: 4 }}>
              <button className="hc-btn hc-btn-ghost hc-btn-icon" title="Notifications"><Icon.Bell size={16} /></button>
              <button className="hc-btn hc-btn-ghost hc-btn-icon" title="Share"><Icon.Share size={16} /></button>
              <button className="hc-btn hc-btn-ghost hc-btn-icon" title="More"><Icon.More size={16} /></button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16, marginTop: 24 }}>
            <Panel title="About">
              <p style={{ margin: 0, color: "var(--fg-2)", fontSize: 13.5, lineHeight: 1.65 }}>
                Solo dev streaming long-form RPG runs and game-feel teardowns. No clips, no re-uploads — be here or be elsewhere.
              </p>
            </Panel>
            <Panel title="Schedule">
              <div style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.7 }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Tue</span><span style={{ fontFamily: "var(--font-mono)", color: "var(--fg-3)" }}>20:00 CT</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Thu</span><span style={{ fontFamily: "var(--font-mono)", color: "var(--fg-3)" }}>20:00 CT</span></div>
                <div style={{ display: "flex", justifyContent: "space-between" }}><span>Fri</span><span style={{ fontFamily: "var(--font-mono)", color: "var(--fg-3)" }}>Co-op · 20:00 CT</span></div>
              </div>
            </Panel>
            <Panel title="Discord">
              <p style={{ margin: 0, color: "var(--fg-2)", fontSize: 13.5 }}>Hang out in between streams. Invite-only, same list as here.</p>
              <button className="hc-btn hc-btn-secondary hc-btn-sm" style={{ marginTop: 12 }}>Open invite</button>
            </Panel>
            <Panel title="Setup">
              <div style={{ fontSize: 13, color: "var(--fg-2)" }}>
                <Row k="Mic" v="SM7B → GoXLR" />
                <Row k="Cam" v="Sony ZV-E10" />
                <Row k="GPU" v="RTX 4090" />
              </div>
            </Panel>
            <Panel title="Rules">
              <ul style={{ margin: 0, paddingLeft: 16, color: "var(--fg-2)", fontSize: 13, lineHeight: 1.7 }}>
                <li>Be useful or be silent</li>
                <li>No spoilers without /spoiler</li>
                <li>English only in chat</li>
              </ul>
            </Panel>
            <Panel title="Music">
              <div style={{ fontSize: 13, color: "var(--fg-2)" }}>
                <Row k="Now playing" v="Lo-fi loop · S2" />
                <Row k="Playlist" v="den.fm/listen" />
              </div>
            </Panel>
          </div>
        </div>
        <ChatDock locked={locked} onSignIn={onSignIn} onPopout={onPopoutChat} />
      </div>
    </div>
  );
}

function Row({ k, v }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", padding: "5px 0", borderBottom: "1px dashed var(--line)" }}>
      <span style={{ color: "var(--fg-3)" }}>{k}</span>
      <span style={{ fontFamily: "var(--font-mono)", color: "var(--fg-2)", fontSize: 12 }}>{v}</span>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="hc-card hover">
      <div className="eyebrow" style={{ marginBottom: 10 }}>{title}</div>
      {children}
    </div>
  );
}

// ============== Private gate (signed out) ==============
function PrivateGate({ theme, onToggleTheme, brandName, onSignIn, go, live }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <header style={{
        height: 56, padding: "0 24px", borderBottom: "1px solid var(--line)",
        display: "flex", alignItems: "center", justifyContent: "space-between", background: "var(--bg)",
      }}>
        <BrandMark size={22} brandName={brandName} />
        <div style={{ display: "flex", gap: 6 }}>
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button className="hc-btn hc-btn-ghost" onClick={onSignIn}>Sign in</button>
        </div>
      </header>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 460, display: "flex", flexDirection: "column", gap: 18, alignItems: "center", textAlign: "center" }}>
          <Avatar size={88} name="MD" hue={252} halo live={live} />
          <span className="eyebrow" style={{ display: "inline-flex", alignItems: "center", gap: 6, color: "var(--fg-3)" }}>
            <Icon.Lock size={11} stroke={2}/> PRIVATE STREAM · INVITE-ONLY
          </span>
          <h1 className="font-display" style={{ fontSize: 32, fontWeight: 700, margin: 0, letterSpacing: "-0.025em", lineHeight: 1.15 }}>
            This stream is invite-only
          </h1>
          <p style={{ color: "var(--fg-3)", fontSize: 14, margin: 0, maxWidth: 380, lineHeight: 1.6 }}>
            {live
              ? "mrdemonwolf is live right now, but only people on the invite list can watch. Sign in if you already have an account, or paste your invite code below."
              : "Only people invited by mrdemonwolf can watch and chat here. Sign in if you've been here before, or paste the invite code they sent you."}
          </p>
          <div className="hc-card" style={{ width: "100%", padding: 18, marginTop: 6 }}>
            <div style={{ display: "flex", gap: 8 }}>
              <button className="hc-btn hc-btn-primary" style={{ flex: 1 }} onClick={onSignIn}>Sign in</button>
              <button className="hc-btn hc-btn-secondary" style={{ flex: 1 }} onClick={() => go("/invite/INVITE-3K7F-92AB")}>I have an invite code</button>
            </div>
            <div style={{ fontSize: 12, color: "var(--fg-4)", marginTop: 14, lineHeight: 1.5 }}>
              Don't have a code? Only mrdemonwolf can send invites &mdash; reach out to them directly.
            </div>
          </div>
          <a onClick={() => go("/about")} style={{ fontSize: 12, color: "var(--fg-3)", cursor: "pointer", marginTop: 4 }}>
            What is HowlCast? &rarr;
          </a>
        </div>
      </div>
    </div>
  );
}

// ============== Pages ==============
function HomePage({ live, signedIn, locked, ...rest }) {
  if (!signedIn) return <PrivateGate live={live} {...rest} />;
  return <ChannelDen channel="mrdemonwolf" live={live} locked={locked} signedIn={signedIn} {...rest} />;
}

function LoginPage({ theme, onToggleTheme, brandName, go }) {
  const [tab, setTab] = pu_useState("Sign in");
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", top: 16, right: 16 }}>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: 400, display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <BrandMark size={28} brandName={brandName} />
          </div>
          <div className="hc-card" style={{ padding: 0, overflow: "hidden" }}>
            <TabRow tabs={["Sign in", "Use invite code"]} value={tab} onChange={setTab} />
            <div style={{ padding: 22 }}>
              {tab === "Sign in" ? (
                <form onSubmit={e => { e.preventDefault(); go("/"); }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <Field label="Email"><input className="hc-input" type="email" placeholder="you@email.com" /></Field>
                  <Field label="Password" right={<a style={{ fontSize: 11, color: "var(--fg-3)", cursor: "pointer" }}>Forgot password?</a>}>
                    <input className="hc-input" type="password" placeholder="At least 8 characters" />
                  </Field>
                  <button type="submit" className="hc-btn hc-btn-primary" style={{ width: "100%", marginTop: 4 }}>Sign in</button>
                </form>
              ) : (
                <form onSubmit={e => { e.preventDefault(); go("/setup"); }} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                  <Field label="Invite code" right={<span style={{ fontSize: 11, color: "var(--fg-3)" }}>From mrdemonwolf</span>}>
                    <input className="hc-input mono" placeholder="INVITE-XXXX-XXXX" defaultValue="INVITE-3K7F-92AB" />
                  </Field>
                  <button type="submit" className="hc-btn hc-btn-primary" style={{ width: "100%", marginTop: 4 }}>Redeem code &amp; create account</button>
                </form>
              )}
            </div>
          </div>
          <div style={{ textAlign: "center", fontSize: 12, color: "var(--fg-3)", lineHeight: 1.5 }}>
            By continuing you agree to the <a style={{ color: "var(--fg-2)" }}>Terms</a> and <a style={{ color: "var(--fg-2)" }}>Privacy Policy</a>.
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ label, right, children }) {
  return (
    <label style={{ display: "flex", flexDirection: "column", gap: 6 }}>
      <span style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
        <span style={{ fontSize: 12, fontWeight: 500, color: "var(--fg-2)" }}>{label}</span>
        {right}
      </span>
      {children}
    </label>
  );
}

function InvitePage({ theme, onToggleTheme, brandName, go, valid = true }) {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", top: 16, right: 16 }}>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div className="hc-card" style={{ width: 440, padding: 28, textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <BrandMark size={20} brandName={brandName} />
          <Avatar size={88} name="MD" hue={252} halo />
          {valid ? (
            <>
              <h1 className="font-display" style={{ fontSize: 28, fontWeight: 700, margin: 0, letterSpacing: "-0.025em", lineHeight: 1.2 }}>
                mrdemonwolf invited you in
              </h1>
              <div style={{ color: "var(--fg-3)", fontSize: 13, lineHeight: 1.5, maxWidth: 320 }}>You'll be able to watch every stream and join the chat. Takes about a minute to set up.</div>
              <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                <button className="hc-btn hc-btn-primary" onClick={() => go("/setup")}>Accept &amp; create account</button>
                <button className="hc-btn hc-btn-ghost">Maybe later</button>
              </div>
              <span style={{ marginTop: 8, padding: "6px 12px", border: "1px solid var(--line)", borderRadius: 999, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>
                INVITE-3K7F-92AB
              </span>
            </>
          ) : (
            <>
              <h1 className="font-display" style={{ fontSize: 24, fontWeight: 700, margin: 0, color: "var(--destructive)" }}>This invite no longer works</h1>
              <div style={{ color: "var(--fg-3)", fontSize: 13, maxWidth: 320, lineHeight: 1.5 }}>The code is either expired or has already been used. Reach out to mrdemonwolf for a fresh one.</div>
              <button className="hc-btn hc-btn-ghost" onClick={() => go("/")}><Icon.ArrowLeft size={14}/> Back</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function SetupPage({ theme, onToggleTheme, brandName, go }) {
  const [step, setStep] = pu_useState(0);
  const [name, setName] = pu_useState("");
  const [display, setDisplay] = pu_useState("");
  const [bio, setBio] = pu_useState("");
  const available = name.length >= 3;
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column" }}>
      <div style={{ position: "absolute", top: 16, right: 16 }}>
        <ThemeToggle theme={theme} onToggle={onToggleTheme} />
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", padding: 24 }}>
        <div style={{ width: "100%", maxWidth: 480, display: "flex", flexDirection: "column", gap: 22 }}>
          <BrandMark size={22} brandName={brandName} />
          <Stepper count={3} step={step} />
          <div className="hc-card" style={{ padding: 28 }}>
            {step === 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <h2 className="font-display" style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.022em" }}>Pick a username</h2>
                <p style={{ margin: 0, fontSize: 13, color: "var(--fg-3)", lineHeight: 1.5 }}>This is what you'll appear as in chat. Pick something you like &mdash; it can't be changed later.</p>
                <Field label="Username">
                  <input className="hc-input" value={name} onChange={e => setName(e.target.value)} placeholder="huntress" />
                </Field>
                <span style={{ fontSize: 12, color: name ? (available ? "var(--success)" : "var(--destructive)") : "var(--fg-3)" }}>
                  {name ? (available ? "✓ Username is available" : "× Too short—try at least 3 characters") : "3–20 characters. Letters, numbers, and underscores only."}
                </span>
              </div>
            )}
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <h2 className="font-display" style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.022em" }}>Add a profile picture</h2>
                <p style={{ margin: 0, fontSize: 13, color: "var(--fg-3)", lineHeight: 1.5 }}>Optional, but it helps people recognize you in chat.</p>
                <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
                  <Avatar size={80} name={name || "WL"} hue={210} halo />
                  <div className="stripe-placeholder" style={{ flex: 1, height: 80 }}>DROP AN IMAGE OR CLICK TO UPLOAD</div>
                </div>
                <span style={{ fontSize: 12, color: "var(--fg-3)" }}>PNG or JPG, square works best.</span>
              </div>
            )}
            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                <h2 className="font-display" style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: "-0.022em" }}>A little about you</h2>
                <p style={{ margin: 0, fontSize: 13, color: "var(--fg-3)", lineHeight: 1.5 }}>Both fields are optional. You can fill them in later from your account.</p>
                <Field label="Display name" right={<span style={{ fontSize: 11, color: "var(--fg-3)" }}>How your name shows up</span>}><input className="hc-input" value={display} onChange={e => setDisplay(e.target.value)} placeholder="Huntress" /></Field>
                <Field label="Bio" right={<span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>{bio.length} / 200</span>}>
                  <textarea className="hc-input" rows={4} maxLength={200} value={bio} onChange={e => setBio(e.target.value)} placeholder="What brings you here? Favorite games? Anything you want." />
                </Field>
              </div>
            )}
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <button className="hc-btn hc-btn-ghost" disabled={step === 0} onClick={() => setStep(s => s - 1)}>
              <Icon.ArrowLeft size={14}/> Back
            </button>
            <button
              className="hc-btn hc-btn-primary"
              onClick={() => step === 2 ? go("/") : setStep(s => s + 1)}
              disabled={step === 0 && !available}
            >
              {step === 2 ? "Finish &amp; enter chat".replace(/&amp;/g, "&") : "Continue"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stepper({ count, step }) {
  return (
    <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
      {Array.from({ length: count }).map((_, i) => (
        <React.Fragment key={i}>
          <span style={{
            width: 8, height: 8, borderRadius: 999,
            background: i <= step ? "var(--cyan)" : "var(--bg-4)",
          }} />
          {i < count - 1 && <span style={{ width: 24, height: 1, background: i < step ? "var(--cyan)" : "var(--line)" }} />}
        </React.Fragment>
      ))}
      <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)", marginLeft: 10 }}>
        {String(step + 1).padStart(2, "0")} / {String(count).padStart(2, "0")}
      </span>
    </div>
  );
}

Object.assign(window, {
  PlayerSurface, ChatDock, ChannelDen, HomePage, LoginPage, InvitePage, SetupPage, Field, Stepper, OfflineBanner, Panel, PrivateGate,
});
