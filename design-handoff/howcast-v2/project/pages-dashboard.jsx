/* global React, Icon, BrandMark, Avatar, LivePill, ViewerChip, Verified, Tag, TabRow, Sparkline, PageHeader, DashboardShell, Status, Skel, useStreamerMode */
const { useState: pd_useState } = React;

// =============== Dashboard overview ===============
function DashboardOverview({ go }) {
  return (
    <>
      <PageHeader
        title="Dashboard"
        subtitle="Last 7 days · 8 sessions"
        right={<button className="hc-btn hc-btn-secondary"><Icon.Refresh size={14}/> Refresh</button>}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <Stat label="Avg viewers" value="1,194" delta="+12%" trend={[18,22,17,28,33,30,38,42,40,52]} />
        <Stat label="Peak" value="2,407" delta="Tue · 22:18" trend={[12,14,12,16,28,30,52,40,30,22]} />
        <Stat label="Hours streamed" value="34.2" delta="+4.1 vs prev" trend={[3,4,3,5,5,4,5,4]} />
        <Stat label="Invites used" value="58 / 120" delta="48% redeemed" trend={[2,4,3,5,8,6,10,12,8]} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginTop: 20 }}>
        <div className="hc-card hover">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span className="eyebrow">LAST STREAM</span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>SUN · 3h 12m</span>
          </div>
          <div className="player-surface" style={{ marginBottom: 12 }}>
            <div style={{ position: "absolute", top: 12, left: 12 }}><LivePill>ENDED</LivePill></div>
            <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--fg-4)" }}>
              <Icon.Wolf size={56} stroke={1.2} />
            </div>
          </div>
          <div className="font-display" style={{ fontSize: 18, fontWeight: 600 }}>Veiled Hollow run — pt. 4</div>
          <div style={{ color: "var(--fg-3)", fontSize: 13, marginTop: 4 }}>Peak 2,407 · avg 1,418 · 142 chats / min at peak</div>
        </div>
        <div className="hc-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <span className="eyebrow">RECENT INVITES</span>
            <button className="hc-btn hc-btn-ghost hc-btn-sm" onClick={() => go("/dashboard/invites")}>View all</button>
          </div>
          {[
            ["INVITE-9XK2-44LQ", "vexlrune", "accepted"],
            ["INVITE-7B3M-71PE", "—", "pending"],
            ["INVITE-2VL8-99CC", "owlbearry", "accepted"],
            ["INVITE-5HA1-08AX", "—", "pending"],
            ["INVITE-1NN0-22XF", "—", "expired"],
          ].map(([code, who, st]) => (
            <div key={code} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 0", borderBottom: "1px dashed var(--line)" }}>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{code}</span>
              <span style={{ fontSize: 12, color: "var(--fg-3)", flex: 1, textAlign: "right", marginRight: 12, marginLeft: 12 }}>{who}</span>
              <Status kind={st}>{st.toUpperCase()}</Status>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

function Stat({ label, value, delta, trend }) {
  return (
    <div className="hc-card hover">
      <div className="eyebrow">{label}</div>
      <div className="font-display" style={{ fontSize: 32, fontWeight: 700, marginTop: 8, letterSpacing: "-0.025em", lineHeight: 1.1 }}>{value}</div>
      <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", marginTop: 10 }}>
        <span style={{ fontSize: 11, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>{delta}</span>
        <Sparkline points={trend} width={84} height={28} fill />
      </div>
    </div>
  );
}

// =============== Stream key ===============
function StreamKeyPage() {
  const [reveal, setReveal] = pd_useState(false);
  const sm = useStreamerMode();
  return (
    <>
      <PageHeader title="Stream key" subtitle="Point your encoder at this server. Don't share the key." />
      {sm && <SMBanner />}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 720 }}>
        <Card>
          <div className="eyebrow" style={{ marginBottom: 8 }}>RTMP SERVER</div>
          <KeyRow value="rtmps://ingest.howlcast.dev/live" sensitive />
        </Card>
        <Card>
          <div className="eyebrow" style={{ marginBottom: 8 }}>STREAM KEY</div>
          <KeyRow value={reveal ? "live_92b71f4cea93_4f07a8" : "•••••••••••••••••••••••"} sensitive extra={
            <button className="hc-btn hc-btn-ghost hc-btn-icon" onClick={() => setReveal(r => !r)} disabled={sm} style={{ width: 32, height: 32, opacity: sm ? 0.4 : 1 }} title={sm ? "Turn off Streamer Mode to reveal" : ""}>
              {reveal ? <Icon.EyeOff size={14}/> : <Icon.Eye size={14}/>}
            </button>
          } />
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>Last rotated 14d ago</span>
            <button className="hc-btn hc-btn-destructive-ghost"><Icon.Refresh size={14}/> Rotate key</button>
          </div>
        </Card>
        <div style={{
          background: "color-mix(in oklab, var(--warning) 12%, transparent)",
          border: "1px solid color-mix(in oklab, var(--warning) 40%, transparent)",
          borderRadius: 10, padding: "12px 14px",
          display: "flex", gap: 10, alignItems: "flex-start",
          fontSize: 13, color: "var(--fg-2)",
        }}>
          <span style={{ color: "var(--warning)", marginTop: 2 }}>⚠</span>
          <div>Rotating ends current stream. Active viewers will be disconnected. New key applies immediately.</div>
        </div>
      </div>
    </>
  );
}

function KeyRow({ value, extra, sensitive }) {
  const sm = useStreamerMode();
  const blur = sensitive && sm;
  return (
    <div style={{ display: "flex", gap: 6, position: "relative" }}>
      <div style={{ flex: 1, position: "relative" }}>
        <input
          className="hc-input mono"
          readOnly
          value={value}
          style={{
            width: "100%",
            filter: blur ? "blur(7px)" : "none",
            transition: "filter 200ms ease",
            userSelect: blur ? "none" : "auto",
          }}
        />
        {blur && (
          <div style={{
            position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
            pointerEvents: "none", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em",
            color: "var(--cyan)", textTransform: "uppercase",
          }}>
            <Icon.EyeOff size={11} /> <span style={{ marginLeft: 6 }}>Hidden · streamer mode</span>
          </div>
        )}
      </div>
      <button className="hc-btn hc-btn-ghost hc-btn-icon" disabled={blur} style={{ opacity: blur ? 0.4 : 1 }} title={blur ? "Turn off Streamer Mode to copy" : "Copy"}><Icon.Copy size={14}/></button>
      {extra}
    </div>
  );
}

function SMBanner() {
  return (
    <div style={{
      marginBottom: 14,
      background: "color-mix(in oklab, var(--cyan) 10%, transparent)",
      border: "1px solid color-mix(in oklab, var(--cyan) 40%, transparent)",
      borderRadius: 10, padding: "10px 14px",
      display: "flex", gap: 10, alignItems: "center",
      fontSize: 12.5, color: "var(--fg-2)",
    }}>
      <Icon.EyeOff size={14} style={{ color: "var(--cyan)" }}/>
      <span><strong>Streamer Mode is on.</strong> Sensitive values are hidden. Toggle off in the sidebar to reveal.</span>
    </div>
  );
}

function Card({ children, ...rest }) { return <div className="hc-card" {...rest}>{children}</div>; }

// =============== Status ===============
function StatusPage() {
  return (
    <>
      <PageHeader title="Stream status" subtitle="Live for 02h 14m · ingest healthy" />
      <div className="hc-card" style={{ padding: 22 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: 24 }}>
          <div>
            <LivePill />
            <div className="font-display" style={{ fontSize: 32, fontWeight: 700, marginTop: 14, fontFamily: "var(--font-mono)", letterSpacing: 0 }}>1,247</div>
            <div className="eyebrow" style={{ marginTop: 4 }}>VIEWERS · CHAT 142/MIN</div>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 500 }}>02:14:09</div>
            <div className="eyebrow" style={{ marginTop: 4 }}>UPTIME</div>
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 14, marginTop: 22 }}>
          <Metric label="BITRATE" value="6800" unit="kbps" trend={[6700,6750,6800,6760,6810,6800,6790,6800,6800]} />
          <Metric label="FPS" value="60.0" unit="" trend={[60,60,59.9,60,60,59.8,60,60]} />
          <Metric label="DROPPED FRAMES" value="3" unit="last 5m" trend={[0,0,1,0,2,0,0,0,3]} good={false} />
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
          <button className="hc-btn hc-btn-destructive">Force end stream</button>
        </div>
      </div>
    </>
  );
}

function Metric({ label, value, unit, trend, good = true }) {
  return (
    <div style={{ background: "var(--bg-3)", border: "1px solid var(--line)", borderRadius: 10, padding: 14 }}>
      <div className="eyebrow">{label}</div>
      <div style={{ display: "flex", alignItems: "baseline", gap: 6, marginTop: 6 }}>
        <span style={{ fontFamily: "var(--font-mono)", fontSize: 22, fontWeight: 500 }}>{value}</span>
        <span style={{ fontSize: 11, color: "var(--fg-3)", fontFamily: "var(--font-mono)" }}>{unit}</span>
      </div>
      <div style={{ marginTop: 8 }}>
        <Sparkline points={trend} width={180} height={28} fill />
      </div>
    </div>
  );
}

// =============== Panels editor ===============
function PanelsPage() {
  const [editing, setEditing] = pd_useState(0);
  const panels = ["About", "Schedule", "Discord", "Setup", "Rules", "Music"];
  return (
    <>
      <PageHeader
        title="Panels"
        subtitle="Drag to reorder. Markdown supported."
        right={<>
          <button className="hc-btn hc-btn-ghost">Discard</button>
          <button className="hc-btn hc-btn-primary">Save</button>
        </>}
      />
      <div style={{ display: "grid", gridTemplateColumns: "320px 1fr", gap: 16 }}>
        <div className="hc-card" style={{ padding: 8 }}>
          {panels.map((p, i) => (
            <div
              key={p}
              onClick={() => setEditing(i)}
              style={{
                display: "flex", alignItems: "center", gap: 10,
                padding: "10px 10px 10px 12px", borderRadius: 8, cursor: "pointer",
                background: editing === i ? "var(--bg-3)" : "transparent",
                borderLeft: editing === i ? "2px solid var(--cyan)" : "2px solid transparent",
                position: "relative",
              }}
            >
              <span style={{ color: "var(--fg-4)" }}><Icon.Drag size={14}/></span>
              <span style={{ fontSize: 13, fontWeight: editing === i ? 500 : 400 }}>{p}</span>
              <span style={{ flex: 1 }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-4)" }}>0{i+1}</span>
            </div>
          ))}
          <button className="hc-btn hc-btn-ghost" style={{ width: "100%", justifyContent: "flex-start", marginTop: 6 }}>
            <Icon.Plus size={14}/> New panel
          </button>
        </div>
        <div className="hc-card" style={{ padding: 22 }}>
          <Field label="Title"><input className="hc-input" defaultValue={panels[editing]} /></Field>
          <div style={{ marginTop: 14 }}>
            <Field label="Body (markdown)">
              <textarea className="hc-input" rows={10} defaultValue={`Solo dev streaming long-form RPG runs and game-feel teardowns.\n\n**No clips, no re-uploads** — be here or be elsewhere.\n\n- Streams Tue / Thu / Fri\n- Co-op night Friday`} />
            </Field>
          </div>
          <div style={{ marginTop: 14 }}>
            <Field label="Image">
              <div className="stripe-placeholder" style={{ height: 100 }}>DRAG IMAGE OR CLICK TO UPLOAD</div>
            </Field>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 16 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: "var(--fg-2)" }}>
              <input type="checkbox" /> Preview rendered output
            </label>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>Last edited 3m ago</span>
          </div>
        </div>
      </div>
    </>
  );
}

// =============== Chat moderation ===============
function ChatModPage() {
  const [tab, setTab] = pd_useState("Settings");
  return (
    <>
      <PageHeader title="Chat" subtitle="Moderation lives with the broadcaster — no separate mod role." />
      <div style={{ marginBottom: 18 }}>
        <TabRow tabs={["Settings", "Banned", "Slow mode"]} value={tab} onChange={setTab} />
      </div>
      {tab === "Settings" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 720 }}>
          <Card>
            <div className="eyebrow" style={{ marginBottom: 12 }}>FILTERS</div>
            <Toggle label="Block links" sub="Reject messages with URLs" defaultOn />
            <Toggle label="Profanity filter" sub="Standard wordlist + custom" defaultOn />
            <Toggle label="Emote-only mode" sub="Only registered emotes" />
            <Toggle label="Unique chat" sub="Reject identical-to-previous" />
          </Card>
          <Card>
            <div className="eyebrow" style={{ marginBottom: 12 }}>SLOW MODE</div>
            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <input className="hc-input mono" defaultValue="5" style={{ width: 80 }} />
              <span style={{ color: "var(--fg-3)", fontSize: 13 }}>seconds between messages per user</span>
            </div>
          </Card>
          <Card>
            <div className="eyebrow" style={{ marginBottom: 12 }}>CUSTOM BLOCKED PHRASES</div>
            <textarea className="hc-input" rows={3} placeholder="One per line" />
          </Card>
        </div>
      )}
      {tab === "Banned" && <BannedList />}
      {tab === "Slow mode" && <Card><div className="eyebrow" style={{ marginBottom: 12 }}>SLOW MODE INTERVAL</div><div style={{ display: "flex", gap: 10, alignItems: "center" }}><input className="hc-input mono" defaultValue="5" style={{ width: 80 }} /><span style={{ color: "var(--fg-3)" }}>seconds</span></div></Card>}
    </>
  );
}

function Toggle({ label, sub, defaultOn }) {
  const [on, setOn] = pd_useState(defaultOn || false);
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 0", borderBottom: "1px solid var(--line)" }}>
      <div>
        <div style={{ fontSize: 13, fontWeight: 500 }}>{label}</div>
        {sub && <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 2 }}>{sub}</div>}
      </div>
      <button
        onClick={() => setOn(o => !o)}
        style={{
          width: 36, height: 20, borderRadius: 999,
          background: on ? "var(--cyan)" : "var(--bg-4)",
          border: "1px solid var(--line-2)",
          padding: 2, cursor: "pointer",
          transition: "background 200ms ease",
        }}
        aria-pressed={on}
      >
        <span style={{
          display: "block", width: 14, height: 14, borderRadius: 999,
          background: on ? "var(--cta-fg)" : "var(--fg-3)",
          marginLeft: on ? 16 : 0,
          transition: "margin 200ms ease, background 200ms ease",
        }} />
      </button>
    </div>
  );
}

function BannedList() {
  const banned = [
    { name: "raidbot22", reason: "ban evasion", when: "2d" },
    { name: "spamlinkz", reason: "links / spam", when: "5d" },
    { name: "hateposter", reason: "hateful content", when: "12d" },
    { name: "yappingdog", reason: "harassment", when: "21d" },
  ];
  return (
    <Card>
      <div style={{ position: "relative", marginBottom: 12 }}>
        <Icon.Search size={14} />
        <input className="hc-input" placeholder="Search bans" style={{ paddingLeft: 34 }} />
        <span style={{ position: "absolute", left: 12, top: 11, color: "var(--fg-4)" }}><Icon.Search size={14}/></span>
      </div>
      {banned.map(b => (
        <div key={b.name} style={{ display: "flex", alignItems: "center", gap: 12, padding: "10px 0", borderBottom: "1px dashed var(--line)" }}>
          <Avatar size={32} name={b.name.slice(0,2)} hue={20} />
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 13, fontWeight: 500 }}>{b.name}</div>
            <div style={{ fontSize: 12, color: "var(--fg-3)" }}>{b.reason}</div>
          </div>
          <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>{b.when} ago</span>
          <button className="hc-btn hc-btn-ghost hc-btn-sm">Unban</button>
        </div>
      ))}
    </Card>
  );
}

// =============== Emotes ===============
function EmotesPage() {
  const filled = 7, total = 24;
  return (
    <>
      <PageHeader
        title="Emotes"
        subtitle={<span style={{ fontFamily: "var(--font-mono)", color: "var(--fg-3)" }}>SLOTS USED {filled}/{total}</span>}
        right={<button className="hc-btn hc-btn-primary"><Icon.Plus size={14}/> Upload</button>}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        {["wolfHi","wolfPog","wolfSad","wolfYap","wolfLove","wolfRage","wolfWat"].map((n, i) => (
          <div key={n} className="hc-card hover" style={{ display: "flex", flexDirection: "column", alignItems: "center", padding: 16, gap: 8, position: "relative" }}>
            <div style={{
              width: 96, height: 96, borderRadius: 12,
              background: `linear-gradient(135deg, oklch(0.7 0.12 ${200 + i * 18}), oklch(0.5 0.14 ${250 + i * 12}))`,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Icon.Wolf size={56} stroke={2} />
            </div>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-2)" }}>:{n}:</span>
          </div>
        ))}
        {Array.from({ length: total - filled }).slice(0, 9).map((_, i) => (
          <div key={i} style={{
            border: "1px dashed var(--line-2)", borderRadius: 14, padding: 16,
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 8,
            minHeight: 162,
            color: "var(--fg-4)", cursor: "pointer",
          }}>
            <Icon.Plus size={24} />
            <span style={{ fontSize: 11, fontFamily: "var(--font-mono)" }}>EMPTY</span>
          </div>
        ))}
      </div>
    </>
  );
}

// =============== Invites ===============
function InvitesPage() {
  const list = [
    { code: "INVITE-9XK2-44LQ", who: "vexlrune", st: "accepted", expires: "—" },
    { code: "INVITE-7B3M-71PE", who: "—", st: "pending", expires: "in 4d" },
    { code: "INVITE-2VL8-99CC", who: "owlbearry", st: "accepted", expires: "—" },
    { code: "INVITE-5HA1-08AX", who: "—", st: "pending", expires: "in 7d" },
    { code: "INVITE-4PR6-12DW", who: "northpine", st: "accepted", expires: "—" },
    { code: "INVITE-1NN0-22XF", who: "—", st: "expired", expires: "1d ago" },
    { code: "INVITE-8GG2-66YN", who: "—", st: "pending", expires: "in 2d" },
  ];
  return (
    <>
      <PageHeader
        title="Invites"
        subtitle="58 used / 120 active"
        right={<button className="hc-btn hc-btn-primary"><Icon.Plus size={14}/> Generate invite</button>}
      />
      <Card style={{ padding: 0 }}>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 110px 100px 1fr", padding: "12px 18px", borderBottom: "1px solid var(--line)" }}>
          {["CODE","INVITEE","STATUS","EXPIRES",""].map(h => <span key={h} className="eyebrow">{h}</span>)}
        </div>
        {list.map(r => (
          <div key={r.code} style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr 110px 100px 1fr", padding: "12px 18px", borderBottom: "1px dashed var(--line)", alignItems: "center" }}>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}>{r.code}</span>
            <span style={{ fontSize: 13, color: r.who === "—" ? "var(--fg-4)" : "var(--fg-2)" }}>{r.who}</span>
            <span><Status kind={r.st}>{r.st.toUpperCase()}</Status></span>
            <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>{r.expires}</span>
            <span style={{ display: "flex", gap: 6, justifyContent: "flex-end" }}>
              <button className="hc-btn hc-btn-ghost hc-btn-sm">Copy</button>
              <button className="hc-btn hc-btn-destructive-ghost hc-btn-sm">Revoke</button>
            </span>
          </div>
        ))}
      </Card>
    </>
  );
}

// =============== Notifications (Discord webhooks) ===============
function NotificationsPage() {
  const sm = useStreamerMode();
  return (
    <>
      <PageHeader title="Notifications" subtitle="Two Discord webhooks. No email, RSS, or push." />
      {sm && <SMBanner />}
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 760 }}>
        <WebhookCard label="LIVE ALERTS WEBHOOK" hint="Fires when stream goes live" url="https://discord.com/api/webhooks/1101…/Hf3o" lastFired="2h ago" status="success" />
        <WebhookCard label="MOD ACTIONS WEBHOOK" hint="Bans, slow-mode toggles, key rotations" url="https://discord.com/api/webhooks/1102…/Q9aR" lastFired="never" status={null} />
      </div>
    </>
  );
}
function WebhookCard({ label, hint, url, lastFired, status }) {
  const sm = useStreamerMode();
  return (
    <Card>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <div className="eyebrow">{label}</div>
          <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 4 }}>{hint}</div>
        </div>
        {status && <Status kind={status === "success" ? "accepted" : "error"}>{status === "success" ? "200 OK" : "FAILED"}</Status>}
      </div>
      <div style={{ display: "flex", gap: 6, marginTop: 12, position: "relative" }}>
        <div style={{ flex: 1, position: "relative" }}>
          <input className="hc-input mono" defaultValue={url} style={{ width: "100%", filter: sm ? "blur(7px)" : "none", transition: "filter 200ms ease", userSelect: sm ? "none" : "auto" }} />
          {sm && (
            <div style={{
              position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center",
              pointerEvents: "none", fontFamily: "var(--font-mono)", fontSize: 10, letterSpacing: "0.08em",
              color: "var(--cyan)", textTransform: "uppercase",
            }}>
              <Icon.EyeOff size={11} /> <span style={{ marginLeft: 6 }}>Hidden · streamer mode</span>
            </div>
          )}
        </div>
        <button className="hc-btn hc-btn-secondary" disabled={sm} style={{ opacity: sm ? 0.4 : 1 }}>Test</button>
      </div>
      <div style={{ marginTop: 10, fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--fg-3)" }}>Last fired · {lastFired}</div>
    </Card>
  );
}

// =============== Branding (white-label) ===============
function BrandingPage() {
  const [variant, setVariant] = pd_useState(0);
  const [showVerified, setShowVerified] = pd_useState(true);
  const variants = [
    { name: "Cyan-bright", color: "oklch(0.78 0.135 220)" },
    { name: "Cyan-deep", color: "oklch(0.62 0.13 226)" },
    { name: "Navy-electric", color: "oklch(0.55 0.15 250)" },
    { name: "Navy-soft", color: "oklch(0.62 0.1 235)" },
  ];
  return (
    <>
      <PageHeader title="Branding" subtitle="White-label your deployment. Brand colors are locked to approved variants." />
      <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 720 }}>
        <Card>
          <div className="eyebrow" style={{ marginBottom: 10 }}>BRAND NAME</div>
          <input className="hc-input" defaultValue="HowlCast" />
          <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 8 }}>Shown in nav, browser tab, og:image.</div>
        </Card>
        <Card>
          <div className="eyebrow" style={{ marginBottom: 10 }}>ACCENT COLOR</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 10 }}>
            {variants.map((v, i) => (
              <button key={v.name} onClick={() => setVariant(i)} style={{
                padding: 14, borderRadius: 10,
                background: "var(--bg-3)",
                border: variant === i ? "2px solid var(--cyan)" : "1px solid var(--line-2)",
                cursor: "pointer",
                display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 8,
                color: "var(--fg)",
              }}>
                <span style={{ width: "100%", height: 32, background: v.color, borderRadius: 6 }} />
                <span style={{ fontSize: 12, fontWeight: 500 }}>{v.name}</span>
              </button>
            ))}
          </div>
          <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 10 }}>Free-form picker disabled — accent must clear AA in both modes.</div>
        </Card>
        <Card>
          <div className="eyebrow" style={{ marginBottom: 10 }}>LOGO · 256×256</div>
          <div style={{ display: "flex", gap: 14 }}>
            <div className="stripe-placeholder" style={{ width: 128, height: 128, flexShrink: 0 }}>256×256</div>
            <div style={{ flex: 1 }}>
              <button className="hc-btn hc-btn-secondary"><Icon.Image size={14}/> Upload</button>
              <div style={{ fontSize: 12, color: "var(--fg-3)", marginTop: 8 }}>SVG or PNG. Transparent background recommended.</div>
            </div>
          </div>
        </Card>
        <Card>
          <div className="eyebrow" style={{ marginBottom: 10 }}>FAVICON · 32×32</div>
          <div style={{ display: "flex", gap: 14, alignItems: "center" }}>
            <div className="stripe-placeholder" style={{ width: 48, height: 48, flexShrink: 0 }}>32</div>
            <button className="hc-btn hc-btn-secondary">Upload</button>
          </div>
        </Card>
        <Card>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 14 }}>
            <div style={{ flex: 1 }}>
              <div className="eyebrow" style={{ marginBottom: 6 }}>VERIFIED MARK</div>
              <div style={{ fontSize: 13, color: "var(--fg-2)", lineHeight: 1.6 }}>
                Show a cyan checkmark next to your channel name. Off by default for new deployments.
              </div>
            </div>
            <button
              onClick={() => setShowVerified(v => !v)}
              className="hc-btn"
              style={{
                background: showVerified ? "var(--cyan)" : "var(--bg-3)",
                color: showVerified ? "var(--cta-fg)" : "var(--fg-2)",
                border: showVerified ? "1px solid var(--cyan)" : "1px solid var(--line-2)",
                fontWeight: 600,
              }}
            >
              {showVerified ? "On" : "Off"}
            </button>
          </div>
        </Card>
        <Card>
          <div className="eyebrow" style={{ marginBottom: 10 }}>CUSTOM DOMAIN</div>
          <div style={{ display: "flex", gap: 6 }}>
            <input className="hc-input mono" defaultValue="watch.mrdemonwolf.com" style={{ flex: 1 }} />
            <Status kind="accepted">VERIFIED</Status>
          </div>
        </Card>
      </div>
    </>
  );
}

// =============== Stats ===============
function StatsPage() {
  const lineData = Array.from({ length: 32 }, (_, i) => 800 + Math.sin(i / 3) * 250 + Math.random() * 180 + i * 12);
  return (
    <>
      <PageHeader
        title="Stats"
        subtitle="Per-stream and rolling metrics"
        right={<input className="hc-input mono" defaultValue="LAST 30 DAYS" style={{ width: 180 }} />}
      />
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 14 }}>
        <Stat label="Avg viewers" value="1,194" delta="+12%" trend={[18,22,17,28,33,30,38,42,40,52]} />
        <Stat label="Peak" value="2,407" delta="+340 vs prev" trend={[12,14,12,16,28,30,52,40,30,22]} />
        <Stat label="Chat / min" value="142" delta="@ peak" trend={[20,30,40,52,40,60,80,72,80,90]} />
        <Stat label="Watch hours" value="42.1k" delta="+7%" trend={[8,12,11,16,22,28,34,42,40]} />
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1.6fr 1fr", gap: 16, marginTop: 18 }}>
        <Card>
          <div className="eyebrow" style={{ marginBottom: 10 }}>CONCURRENT VIEWERS</div>
          <Sparkline points={lineData} width={620} height={200} fill />
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 6, fontFamily: "var(--font-mono)", fontSize: 10, color: "var(--fg-4)" }}>
            <span>APR 7</span><span>APR 14</span><span>APR 21</span><span>APR 28</span><span>MAY 5</span>
          </div>
        </Card>
        <Card>
          <div className="eyebrow" style={{ marginBottom: 10 }}>TOP EMOTES</div>
          {[
            ["wolfPog", 4291], ["wolfHi", 2814], ["wolfYap", 2240], ["wolfLove", 1810], ["wolfRage", 1220], ["wolfSad", 880]
          ].map(([n, c], i) => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: 12, padding: "8px 0", borderBottom: "1px dashed var(--line)" }}>
              <div style={{
                width: 28, height: 28, borderRadius: 6,
                background: `linear-gradient(135deg, oklch(0.7 0.12 ${200 + i * 18}), oklch(0.5 0.14 ${250 + i * 12}))`,
              }} />
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, flex: 1 }}>:{n}:</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 12, color: "var(--fg-3)" }}>{c.toLocaleString()}</span>
            </div>
          ))}
        </Card>
      </div>
    </>
  );
}

// =============== Account ===============
function AccountPage() {
  const [tab, setTab] = pd_useState("Profile");
  return (
    <>
      <PageHeader title="Account" subtitle="Your broadcaster identity." />
      <div style={{ marginBottom: 18 }}><TabRow tabs={["Profile", "Sessions", "Danger"]} value={tab} onChange={setTab} /></div>
      {tab === "Profile" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 720 }}>
          <Card>
            <div className="eyebrow" style={{ marginBottom: 12 }}>AVATAR</div>
            <div style={{ display: "flex", gap: 16, alignItems: "center" }}>
              <Avatar size={80} name="MD" hue={252} halo />
              <button className="hc-btn hc-btn-secondary">Replace</button>
              <button className="hc-btn hc-btn-ghost">Remove</button>
            </div>
          </Card>
          <Card>
            <Field label="Display name"><input className="hc-input" defaultValue="mrdemonwolf" /></Field>
            <div style={{ marginTop: 14 }}><Field label="Bio"><textarea className="hc-input" rows={3} defaultValue="Solo dev streaming long-form RPG runs and game-feel teardowns." /></Field></div>
            <div style={{ marginTop: 14 }}><Field label="Email"><input className="hc-input" type="email" defaultValue="md@howlcast.dev" /></Field></div>
            <div style={{ marginTop: 18, display: "flex", justifyContent: "flex-end" }}>
              <button className="hc-btn hc-btn-primary">Save</button>
            </div>
          </Card>
        </div>
      )}
      {tab === "Sessions" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 720 }}>
          <Card>
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
      )}
      {tab === "Danger" && (
        <Card style={{ borderColor: "color-mix(in oklab, var(--destructive) 50%, transparent)", maxWidth: 720 }}>
          <div className="eyebrow" style={{ color: "var(--destructive)", marginBottom: 8 }}>DANGER ZONE</div>
          <div style={{ fontSize: 13, color: "var(--fg-2)", marginBottom: 16 }}>Deleting your account ends every active session, terminates the stream, and revokes all invites. Cannot be undone.</div>
          <button className="hc-btn hc-btn-destructive">Delete account</button>
        </Card>
      )}
    </>
  );
}

Object.assign(window, {
  DashboardOverview, StreamKeyPage, StatusPage, PanelsPage, ChatModPage, EmotesPage,
  InvitesPage, NotificationsPage, BrandingPage, StatsPage, AccountPage, Card, Toggle,
});
