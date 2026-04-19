/**
 * render.js  –  DOM rendering with real media display
 * mediaMap: Map<filename_lowercase, ObjectURL>  (built by app.js from folder files)
 */
const Renderer = (() => {

  const COLORS = [
    '#25D366','#53bdeb','#fcba03','#fc6b03',
    '#c44dff','#ff6b9d','#00bcd4','#ff5722',
    '#4caf50','#ff9800','#9c27b0','#e91e63',
  ];

  let colorMap = {};

  function assignColors(senders) {
    colorMap = {};
    senders.forEach((s,i) => colorMap[s] = COLORS[i % COLORS.length]);
  }

  function col(s) { return colorMap[s] || '#8696a0'; }

  function initials(name) {
    return name.split(/[\s\-_]+/).map(w=>w[0]||'').join('').slice(0,2).toUpperCase() || '?';
  }

  function esc(t) {
    return String(t)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function hlText(text, q) {
    let s = esc(text);
    if (q) {
      const re = new RegExp('('+q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+')','gi');
      s = s.replace(re,'<mark class="hl">$1</mark>');
    }
    // linkify
    s = s.replace(/(https?:\/\/[^\s<"]+)/g,'<a href="$1" target="_blank" rel="noopener">$1</a>');
    return s;
  }

  // ── Media builders ────────────────────────────────────────────────

  function buildImage(url, fname) {
    const img = document.createElement('img');
    img.className = 'media-img';
    img.src = url;
    img.alt = fname;
    img.loading = 'lazy';
    img.addEventListener('click', () => openLightbox(url, fname, 'image'));
    return img;
  }

  function buildVideo(url, fname) {
    const vid = document.createElement('video');
    vid.className = 'media-video';
    vid.src = url;
    vid.controls = true;
    vid.preload = 'metadata';
    vid.addEventListener('click', e => { e.stopPropagation(); openLightbox(url, fname, 'video'); });
    return vid;
  }

  function buildAudio(url, fname) {
    const wrap = document.createElement('div');
    wrap.className = 'media-audio-wrap';

    const icon = document.createElement('div');
    icon.className = 'audio-icon';
    icon.textContent = '▶';

    const audio = document.createElement('audio');
    audio.className = 'audio-player';
    audio.src = url;
    audio.controls = true;
    audio.preload = 'none';

    icon.addEventListener('click', () => {
      if (audio.paused) { audio.play(); icon.textContent='⏸'; }
      else { audio.pause(); icon.textContent='▶'; }
    });
    audio.addEventListener('ended', () => icon.textContent = '▶');

    wrap.appendChild(icon);
    wrap.appendChild(audio);
    return wrap;
  }

  function buildDoc(url, fname) {
    const ext = (fname.match(/\.(\w+)$/) || ['',''])[1].toUpperCase();
    const DOC_ICONS = { PDF:'📕', DOC:'📝', DOCX:'📝', XLS:'📊', XLSX:'📊', PPT:'📋', PPTX:'📋', ZIP:'🗜️', RAR:'🗜️', APK:'📱', TXT:'📄' };
    const icon = DOC_ICONS[ext] || '📎';
    const a = document.createElement('a');
    a.className = 'media-doc';
    a.href = url;
    a.download = fname;
    a.title = 'Download ' + fname;
    a.innerHTML = `
      <div class="doc-icon" style="background:#2a3942">${icon}</div>
      <div class="doc-info">
        <div class="doc-name">${esc(fname)}</div>
        <div class="doc-size">${ext} file · tap to download</div>
      </div>`;
    return a;
  }

  function buildMissing(media) {
    const d = document.createElement('div');
    d.className = 'media-missing';
    const ico = media.icon || '📎';
    const lbl = media.label || (media.filename ? media.filename : 'Media');
    d.innerHTML = `<span style="font-size:18px">${ico}</span><span>${esc(lbl)} (file not in folder)</span>`;
    return d;
  }

  function buildMediaEl(media, mediaMap) {
    if (media.filename) {
      const url = mediaMap.get(media.filename.toLowerCase());
      if (url) {
        if (media.type === 'image') return buildImage(url, media.filename);
        if (media.type === 'video') return buildVideo(url, media.filename);
        if (media.type === 'audio') return buildAudio(url, media.filename);
        if (media.type === 'doc')   return buildDoc(url, media.filename);
      }
    }
    return buildMissing(media);
  }

  // ── Lightbox ──────────────────────────────────────────────────────
  function openLightbox(url, caption, type) {
    const lb = document.getElementById('lightbox');
    const lbContent = document.getElementById('lb-content');
    const lbCaption = document.getElementById('lb-caption');
    lbContent.innerHTML = '';
    if (type === 'image') {
      const img = document.createElement('img'); img.src = url; lbContent.appendChild(img);
    } else if (type === 'video') {
      const v = document.createElement('video'); v.src = url; v.controls = true; v.autoplay = true; lbContent.appendChild(v);
    }
    lbCaption.textContent = caption || '';
    lb.classList.remove('hidden');
  }

  // ── Date divider / system ─────────────────────────────────────────
  function makeDateDiv(d) {
    const div = document.createElement('div'); div.className = 'date-div';
    div.innerHTML = `<span>${esc(d)}</span>`; return div;
  }

  function makeSys(text) {
    const d = document.createElement('div'); d.className = 'sys-msg';
    d.innerHTML = `<span>${esc(text)}</span>`; return d;
  }

  // ── Main render ───────────────────────────────────────────────────
  function render({ messages, container, selfSender, query, mediaMap }) {
    container.innerHTML = '';
    const senders = Parser.getSenders(messages);
    const isGroup = senders.length > 2;
    assignColors(senders);
    const me = selfSender || senders[0] || '';
    let lastDate = null;
    let count = 0;

    for (const m of messages) {
      if (m.type === 'system') { container.appendChild(makeSys(m.text)); continue; }
      if (m.date !== lastDate) { container.appendChild(makeDateDiv(m.date)); lastDate = m.date; }

      const isSelf = m.sender === me;
      const row = document.createElement('div');
      row.className = 'msg-row ' + (isSelf ? 'right' : 'left');

      // Avatar
      if (!isSelf) {
        const av = document.createElement('div');
        av.className = 'msg-av';
        av.style.background = col(m.sender);
        av.textContent = initials(m.sender);
        row.appendChild(av);
      }

      // Bubble
      const bub = document.createElement('div'); bub.className = 'bubble';

      if (!isSelf && isGroup) {
        const sn = document.createElement('span'); sn.className = 'bub-sender';
        sn.style.color = col(m.sender); sn.textContent = m.sender; bub.appendChild(sn);
      }

      // Media or text
      if (m.media) {
        const mEl = buildMediaEl(m.media, mediaMap);
        bub.appendChild(mEl);
        // If there's extra text after the media reference, show it
        const extra = m.text.replace(/^.*\.(jpe?g|png|gif|webp|heic|mp4|mkv|mov|3gp|mp3|ogg|opus|m4a|aac|wav|amr|pdf|docx?|xlsx?|zip|rar|apk)\s*(\(file attached\))?/i,'').trim();
        if (extra) {
          const t = document.createElement('div'); t.className='bub-text'; t.innerHTML = hlText(extra, query); bub.appendChild(t);
        }
      } else {
        const t = document.createElement('div'); t.className='bub-text'; t.innerHTML = hlText(m.text, query); bub.appendChild(t);
      }

      // Time
      const tm = document.createElement('div'); tm.className = 'bub-time';
      tm.innerHTML = esc(m.time) + (isSelf ? ' <svg width="14" height="9" viewBox="0 0 18 12" fill="none"><path d="M1 6l4 4L17 1" stroke="#53bdeb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M7 10l2 2" stroke="#53bdeb" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>' : '');
      bub.appendChild(tm);

      row.appendChild(bub);
      container.appendChild(row);
      count++;
    }
    return count;
  }

  function buildStatsHTML(senders, counts, total) {
    let h = `<div class="stat-row"><span>Total messages</span><span class="stat-val">${total.toLocaleString()}</span></div>
<div class="stat-row"><span>Participants</span><span class="stat-val">${senders.length}</span></div>
<hr class="stat-hr">`;
    senders.forEach(s => {
      const pct = total>0 ? Math.round(counts[s]/total*100) : 0;
      h += `<div class="stat-sender">
        <div class="stat-dot" style="background:${col(s)}"></div>
        <span class="stat-sender-name">${esc(s)}</span>
        <span class="stat-sender-count">${counts[s].toLocaleString()}</span>
        <span class="stat-pct">${pct}%</span>
      </div>`;
    });
    return h;
  }

  return { render, buildStatsHTML, assignColors };
})();
