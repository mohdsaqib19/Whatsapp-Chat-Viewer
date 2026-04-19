/**
 * app.js  –  Main application
 * Key idea: when user picks a folder, we build a mediaMap<filename→ObjectURL>
 * from all media files, then parse _chat.txt and render with live media.
 */
(function () {

  // ── State ─────────────────────────────────────────────────────────
  let allMessages = [];
  let senders     = [];
  let selfSender  = '';
  let chatName    = '';
  let mediaMap    = new Map(); // lowercase filename → object URL
  let prevURLs    = [];        // to revoke old object URLs on reload

  // ── DOM refs ──────────────────────────────────────────────────────
  const uploadScreen = document.getElementById('upload-screen');
  const chatScreen   = document.getElementById('chat-screen');
  const dropZone     = document.getElementById('drop-zone');
  const folderInput  = document.getElementById('folder-input');
  const messages     = document.getElementById('messages');
  const searchInput  = document.getElementById('search-input');
  const senderFilter = document.getElementById('sender-filter');
  const meSelect     = document.getElementById('me-select');
  const sbName       = document.getElementById('sb-name');
  const sbCount      = document.getElementById('sb-count');
  const sbStats      = document.getElementById('sb-stats');
  const hName        = document.getElementById('h-name');
  const hSub         = document.getElementById('h-sub');
  const hAvatar      = document.getElementById('h-avatar');
  const sbAvatar     = document.getElementById('sb-avatar');
  const filterBar    = document.getElementById('filter-bar');
  const filterCount  = document.getElementById('filter-count');
  const backBtn      = document.getElementById('back-btn');
  const menuToggle   = document.getElementById('menu-toggle');
  const sidebar      = document.getElementById('sidebar');
  const lightbox     = document.getElementById('lightbox');
  const lbClose      = document.getElementById('lb-close');
  const lbBackdrop   = document.getElementById('lb-backdrop');

  // ── Folder / file loading ─────────────────────────────────────────
  dropZone.addEventListener('dragover', e => { e.preventDefault(); dropZone.classList.add('drag-over'); });
  dropZone.addEventListener('dragleave', () => dropZone.classList.remove('drag-over'));
  dropZone.addEventListener('drop', e => {
    e.preventDefault(); dropZone.classList.remove('drag-over');
    handleFiles(e.dataTransfer.files);
  });
  folderInput.addEventListener('change', e => handleFiles(e.target.files));

  function handleFiles(fileList) {
    if (!fileList || fileList.length === 0) return;

    // Revoke previous object URLs
    prevURLs.forEach(u => URL.revokeObjectURL(u));
    prevURLs = [];
    mediaMap = new Map();

    let txtFile = null;
    const mediaFiles = [];

    for (const file of fileList) {
      const name = file.name;
      const nameLower = name.toLowerCase();

      // Find the chat txt
      if (nameLower === '_chat.txt' || nameLower.endsWith('.txt')) {
        if (!txtFile || name === '_chat.txt') txtFile = file;
      } else {
        mediaFiles.push(file);
      }
    }

    if (!txtFile) {
      alert('Folder mein _chat.txt file nahi mili.\nPlease WhatsApp se export ki hui poori folder chunein.');
      return;
    }

    // Build mediaMap from all media files
    for (const mf of mediaFiles) {
      const url = URL.createObjectURL(mf);
      prevURLs.push(url);
      mediaMap.set(mf.name.toLowerCase(), url);
      // Also store without extension for fuzzy matching
    }

    // Detect chat name from folder path or first file's path
    chatName = '';
    if (fileList[0].webkitRelativePath) {
      chatName = fileList[0].webkitRelativePath.split('/')[0];
    }
    if (!chatName && txtFile.name !== '_chat.txt') {
      chatName = txtFile.name.replace(/(_chat)?\.txt$/i,'').replace(/[_-]+/g,' ').trim();
    }
    chatName = chatName || 'WhatsApp Chat';

    // Read txt file
    const reader = new FileReader();
    reader.onload = e => processChat(e.target.result);
    reader.onerror = () => alert('Chat file padhi nahi ja rahi. Dobara try karein.');
    reader.readAsText(txtFile, 'UTF-8');
  }

  function processChat(raw) {
    allMessages = Parser.parse(raw);
    if (!allMessages.length) {
      alert('Koi message parse nahi hua. Yeh sahi WhatsApp export file nahi lagti.');
      return;
    }

    senders    = Parser.getSenders(allMessages);
    selfSender = senders[0] || '';

    // Populate selects
    senderFilter.innerHTML = '<option value="">Sabke messages</option>';
    meSelect.innerHTML     = '<option value="">Auto (pehla sender)</option>';
    senders.forEach(s => {
      [senderFilter, meSelect].forEach(sel => {
        const o = document.createElement('option');
        o.value = s; o.textContent = s; sel.appendChild(o);
      });
    });

    const total = allMessages.filter(m=>m.type==='msg').length;
    const mediaCount = [...mediaMap.keys()].length;

    // Update UI labels
    sbName.textContent   = chatName;
    sbCount.textContent  = total.toLocaleString() + ' messages' + (mediaCount ? ` · ${mediaCount} media` : '');
    hName.textContent    = chatName;
    hSub.textContent     = senders.length > 1 ? senders.length + ' participants' : '';
    hAvatar.textContent  = chatName[0].toUpperCase();
    sbAvatar.textContent = chatName[0].toUpperCase();

    // Stats
    const counts = Parser.getStats(allMessages, senders);
    sbStats.innerHTML = Renderer.buildStatsHTML(senders, counts, total);

    // Switch screens
    uploadScreen.classList.add('hidden');
    chatScreen.classList.remove('hidden');

    applyFilters();
    setTimeout(() => { messages.scrollTop = messages.scrollHeight; }, 100);
  }

  // ── Filter / search ───────────────────────────────────────────────
  searchInput.addEventListener('input', debounce(applyFilters, 180));
  senderFilter.addEventListener('change', applyFilters);
  meSelect.addEventListener('change', () => {
    selfSender = meSelect.value || senders[0] || '';
    applyFilters();
  });

  function applyFilters() {
    const q   = searchInput.value.trim().toLowerCase();
    const who = senderFilter.value;
    selfSender = meSelect.value || senders[0] || '';

    let list = allMessages;
    if (who) list = list.filter(m => m.type==='system' || m.sender===who);
    if (q)   list = list.filter(m => {
      if (m.type==='system') return m.text.toLowerCase().includes(q);
      return m.sender.toLowerCase().includes(q) || m.text.toLowerCase().includes(q);
    });

    const cnt = Renderer.render({ messages:list, container:messages, selfSender, query:q, mediaMap });

    if (q || who) {
      filterCount.textContent = cnt.toLocaleString();
      filterBar.classList.remove('hidden');
    } else {
      filterBar.classList.add('hidden');
    }

    if (q) {
      setTimeout(() => {
        const mark = messages.querySelector('mark.hl');
        if (mark) mark.scrollIntoView({ behavior:'smooth', block:'center' });
      }, 50);
    } else {
      setTimeout(() => { messages.scrollTop = messages.scrollHeight; }, 50);
    }
  }

  // ── Navigation ────────────────────────────────────────────────────
  backBtn.addEventListener('click', () => {
    chatScreen.classList.add('hidden');
    uploadScreen.classList.remove('hidden');
    folderInput.value = '';
    searchInput.value = '';
    allMessages = []; senders = [];
    prevURLs.forEach(u => URL.revokeObjectURL(u));
    prevURLs = []; mediaMap = new Map();
    sidebar.classList.remove('open');
  });

  menuToggle.addEventListener('click', () => sidebar.classList.toggle('open'));

  document.addEventListener('click', e => {
    if (sidebar.classList.contains('open') && !sidebar.contains(e.target) && e.target !== menuToggle) {
      sidebar.classList.remove('open');
    }
  });

  // ── Lightbox close ────────────────────────────────────────────────
  lbClose.addEventListener('click', closeLightbox);
  lbBackdrop.addEventListener('click', closeLightbox);
  document.addEventListener('keydown', e => { if (e.key==='Escape') closeLightbox(); });

  function closeLightbox() {
    lightbox.classList.add('hidden');
    document.getElementById('lb-content').innerHTML = '';
  }

  // ── Utility ───────────────────────────────────────────────────────
  function debounce(fn, d) {
    let t;
    return (...a) => { clearTimeout(t); t = setTimeout(()=>fn(...a), d); };
  }

})();
