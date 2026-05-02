/* Editable panels grid for the channel page.
   Renders into #panels-mount. Owner toggles edit mode via #edit-toggle. */

const PANEL_TEMPLATES = [
  {
    id: 'text',
    name: 'Text',
    desc: 'Heading + paragraph',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M4 12h16M4 17h10"/></svg>
    ),
    make: () => ({ kind: 'text', meta: 'about', title: 'Howling since May 2026', body: 'Web dev streamer, blue wolf, owner of MrDemonWolf, Inc.', pills: ['he/him', 'CT timezone'] }),
  },
  {
    id: 'link',
    name: 'Link',
    desc: 'Card with CTA →',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>
    ),
    make: () => ({ kind: 'link', meta: 'discord', title: 'The Howl', body: 'Invite-only den for regulars.', cta: 'Request invite', href: '#' }),
  },
  {
    id: 'image',
    name: 'Image',
    desc: 'Image + caption',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-5-5L5 21"/></svg>
    ),
    make: () => ({ kind: 'image', meta: 'recent project', title: 'Wolf Run', body: 'Endless-runner about a blue wolf.', cta: 'Watch progress', href: '#' }),
  },
  {
    id: 'list',
    name: 'List',
    desc: 'Lines of items',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M8 6h13M8 12h13M8 18h13"/><circle cx="4" cy="6" r="1.2"/><circle cx="4" cy="12" r="1.2"/><circle cx="4" cy="18" r="1.2"/></svg>
    ),
    make: () => ({ kind: 'list', meta: 'setup', title: 'Gear & rig', items: ['5950X · 4080 · 64GB', 'Shure SM7B → GoXLR', 'Sony A6400 cam', 'NixOS · OBS → Owncast'] }),
  },
  {
    id: 'embed',
    name: 'Embed',
    desc: 'YouTube / clip',
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="6" width="20" height="13" rx="2"/><path d="m10 10 5 3-5 3z"/></svg>
    ),
    make: () => ({ kind: 'embed', meta: 'clip', title: 'Latest clip', body: 'Wolf Run jump physics, before/after', href: '#' }),
  },
];

const DEFAULT_PANELS = [
  { id: 'p1', kind: 'text', meta: 'about', title: 'Howling since May 2026', body: 'Web dev streamer, blue wolf, owner of MrDemonWolf, Inc. Building tools and games at the intersection of furry creativity and clean code.', pills: ['he/him', 'CT timezone'] },
  { id: 'p2', kind: 'link', meta: 'discord', title: 'The Howl', body: 'An invite-only den for regulars. Notes, clip drops, and the occasional 3am voice channel. New here? DM in chat first.', cta: 'Request invite', href: '#' },
  { id: 'p3', kind: 'link', meta: 'support · ko-fi', title: 'Buy a coffee', body: 'Tips help cover server bills for the den and keep streams ad-free. One-time or monthly. No tier theatrics.', cta: 'Open Ko-fi', href: '#' },
  { id: 'p4', kind: 'list', meta: 'setup', title: 'Gear & rig', items: ['5950X · 4080 · 64GB · Shure SM7B', 'GoXLR · Sony A6400 cam', 'NixOS host · OBS → self-hosted Owncast'] },
  { id: 'p5', kind: 'image', meta: 'recent project', title: 'Wolf Run', body: 'A small endless-runner about a blue wolf and increasingly silly hats. Built live on stream in TypeScript + WebGL.', cta: 'Watch progress', href: '#' },
];

function uid() { return 'p_' + Math.random().toString(36).slice(2, 8); }

function PanelView({ panel, editing, onEdit, onDelete, onMove, isFirst, isLast }) {
  return (
    <div className={`panel ${editing ? 'is-edit' : ''}`} data-id={panel.id}>
      {editing && (
        <div className="panel-tools">
          <button className="ptool" onClick={() => onMove(-1)} disabled={isFirst} aria-label="Move up">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m18 15-6-6-6 6"/></svg>
          </button>
          <button className="ptool" onClick={() => onMove(1)} disabled={isLast} aria-label="Move down">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </button>
          <button className="ptool" onClick={onEdit} aria-label="Edit">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4v16h16v-7"/><path d="m18 2 4 4-10 10H8v-4z"/></svg>
          </button>
          <button className="ptool danger" onClick={onDelete} aria-label="Delete">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
          </button>
        </div>
      )}
      <div className="meta">{panel.meta}</div>
      {panel.kind === 'image' && <div className="panel-img" aria-hidden="true"></div>}
      {panel.kind === 'embed' && <div className="panel-embed" aria-hidden="true"><span>▶ {panel.title}</span></div>}
      <h4>{panel.title}</h4>
      {panel.kind === 'list' ? (
        <ul className="panel-list">
          {(panel.items || []).map((it, i) => <li key={i}>{it}</li>)}
        </ul>
      ) : panel.body ? (
        <p>{panel.body}</p>
      ) : null}
      {panel.kind === 'text' && panel.pills && panel.pills.length > 0 && (
        <div className="row" style={{ marginTop: 6, flexWrap: 'wrap' }}>
          {panel.pills.map((p, i) => <span className="pill" key={i}>{p}</span>)}
        </div>
      )}
      {panel.cta && <a className="lnk" href={panel.href || '#'}>{panel.cta} →</a>}
    </div>
  );
}

function AddTile({ onPick }) {
  const [open, setOpen] = React.useState(false);
  return (
    <div className={`panel-add ${open ? 'is-open' : ''}`}>
      {!open ? (
        <button className="add-bare" onClick={() => setOpen(true)}>
          <span className="plus">+</span>
          <span>Add a panel</span>
          <span className="hint">Pick a template below</span>
        </button>
      ) : (
        <div className="add-tray">
          <div className="add-h">
            <span>Add panel</span>
            <button className="ptool" onClick={() => setOpen(false)} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="add-grid">
            {PANEL_TEMPLATES.map(t => (
              <button key={t.id} className="tpl" onClick={() => { onPick(t); setOpen(false); }}>
                <span className="tpl-ico">{t.icon}</span>
                <b>{t.name}</b>
                <span className="tpl-desc">{t.desc}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function EditDrawer({ panel, onSave, onClose }) {
  const [draft, setDraft] = React.useState(panel);
  React.useEffect(() => setDraft(panel), [panel]);
  if (!panel) return null;
  const set = (k, v) => setDraft(d => ({ ...d, [k]: v }));
  return (
    <div className="drawer-backdrop" onClick={onClose}>
      <div className="drawer" onClick={e => e.stopPropagation()}>
        <div className="drawer-h">
          <div>
            <span className="kind-pill">{draft.kind}</span>
            <h3>Edit panel</h3>
          </div>
          <button className="ptool" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18M6 6l12 12"/></svg>
          </button>
        </div>
        <div className="drawer-body">
          <label>Eyebrow / category
            <input className="input" value={draft.meta || ''} onChange={e => set('meta', e.target.value)} />
          </label>
          <label>Title
            <input className="input" value={draft.title || ''} onChange={e => set('title', e.target.value)} />
          </label>
          {draft.kind === 'list' ? (
            <label>Items (one per line)
              <textarea className="input" rows="5" value={(draft.items || []).join('\n')} onChange={e => set('items', e.target.value.split('\n').filter(Boolean))} />
            </label>
          ) : (
            <label>Body
              <textarea className="input" rows="4" value={draft.body || ''} onChange={e => set('body', e.target.value)} />
            </label>
          )}
          {draft.kind === 'text' && (
            <label>Pills (comma-separated)
              <input className="input" value={(draft.pills || []).join(', ')} onChange={e => set('pills', e.target.value.split(',').map(s => s.trim()).filter(Boolean))} />
            </label>
          )}
          {(draft.kind === 'link' || draft.kind === 'image' || draft.kind === 'embed') && (
            <>
              <label>Call-to-action label
                <input className="input" value={draft.cta || ''} onChange={e => set('cta', e.target.value)} />
              </label>
              <label>URL
                <input className="input" value={draft.href || ''} onChange={e => set('href', e.target.value)} />
              </label>
            </>
          )}
          {draft.kind === 'image' && (
            <label>Image
              <button className="btn btn-secondary" type="button" style={{ alignSelf: 'flex-start' }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m17 8-5-5-5 5"/><path d="M12 3v12"/></svg>
                Upload image
              </button>
            </label>
          )}
        </div>
        <div className="drawer-foot">
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn btn-primary" onClick={() => { onSave(draft); onClose(); }}>Save panel</button>
        </div>
      </div>
    </div>
  );
}

function PanelsApp() {
  const [panels, setPanels] = React.useState(DEFAULT_PANELS);
  const [editing, setEditing] = React.useState(false);
  const [editPanel, setEditPanel] = React.useState(null);

  React.useEffect(() => {
    const btn = document.getElementById('edit-toggle');
    if (!btn) return;
    const onClick = () => setEditing(e => !e);
    btn.addEventListener('click', onClick);
    return () => btn.removeEventListener('click', onClick);
  }, []);

  React.useEffect(() => {
    const btn = document.getElementById('edit-toggle');
    if (!btn) return;
    if (editing) {
      btn.classList.add('is-on');
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg> Done editing`;
    } else {
      btn.classList.remove('is-on');
      btn.innerHTML = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4v16h16v-7"/><path d="m18 2 4 4-10 10H8v-4z"/></svg> Edit panels`;
    }
    document.body.classList.toggle('panels-editing', editing);
  }, [editing]);

  const move = (id, delta) => setPanels(ps => {
    const i = ps.findIndex(p => p.id === id);
    const j = i + delta;
    if (i < 0 || j < 0 || j >= ps.length) return ps;
    const next = ps.slice();
    [next[i], next[j]] = [next[j], next[i]];
    return next;
  });
  const remove = id => setPanels(ps => ps.filter(p => p.id !== id));
  const update = panel => setPanels(ps => ps.map(p => p.id === panel.id ? panel : p));
  const add = tpl => setPanels(ps => [...ps, { id: uid(), ...tpl.make() }]);

  return (
    <>
      <div className={`va-panels ${editing ? 'is-editing' : ''}`}>
        {panels.map((p, i) => (
          <PanelView
            key={p.id}
            panel={p}
            editing={editing}
            onEdit={() => setEditPanel(p)}
            onDelete={() => remove(p.id)}
            onMove={(d) => move(p.id, d)}
            isFirst={i === 0}
            isLast={i === panels.length - 1}
          />
        ))}
        {editing && <AddTile onPick={add} />}
      </div>
      {editPanel && (
        <EditDrawer panel={editPanel} onSave={update} onClose={() => setEditPanel(null)} />
      )}
    </>
  );
}

window.PanelsApp = PanelsApp;
