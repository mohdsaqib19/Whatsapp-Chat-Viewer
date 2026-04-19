/**
 * parser.js  –  WhatsApp _chat.txt parser
 * Handles all regional date/time formats, media references, multi-line messages.
 */
const Parser = (() => {

  // Message line patterns (date, time, sender, text)
  const MSG_RX = [
    // [DD/MM/YYYY, HH:MM:SS] Sender: text
    /^\[(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AaPp][Mm])?)\]\s*([^:]+):\s*([\s\S]*)$/,
    // DD/MM/YYYY, HH:MM - Sender: text
    /^(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AaPp][Mm])?)\s+-\s+([^:]+):\s*([\s\S]*)$/,
  ];

  // System message patterns
  const SYS_RX = [
    /^\[(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}),\s*([^\]]+)\]\s+(.+)$/,
    /^(\d{1,2}[\/\-.]\d{1,2}[\/\-.]\d{2,4}),?\s+(\d{1,2}:\d{2}(?::\d{2})?(?:\s?[AaPp][Mm])?)\s+-\s+(.+)$/,
  ];

  // Extract filename from WhatsApp media reference like "<filename.jpg (file attached)>"
  // or text like "image omitted", etc.
  const MEDIA_REF_RX = /^[<‹]?(.+?\.\w{2,5})\s*(?:\(file attached\)|>|›)?$/i;

  const MEDIA_OMIT = [
    { rx: /image omitted|<Media omitted>/i,            type:'image',    icon:'🖼️',  label:'Image' },
    { rx: /video omitted/i,                            type:'video',    icon:'🎬',  label:'Video' },
    { rx: /audio omitted|voice message omitted/i,      type:'audio',    icon:'🎵',  label:'Audio' },
    { rx: /document omitted/i,                         type:'doc',      icon:'📄',  label:'Document' },
    { rx: /sticker omitted/i,                          type:'sticker',  icon:'🩷',  label:'Sticker' },
    { rx: /GIF omitted/i,                              type:'gif',      icon:'🎞️', label:'GIF' },
    { rx: /Contact card omitted/i,                     type:'contact',  icon:'👤',  label:'Contact' },
    { rx: /location:/i,                                type:'location', icon:'📍',  label:'Location' },
  ];

  const IMAGE_EXT  = /\.(jpe?g|png|gif|webp|heic|heif|bmp|svg)$/i;
  const VIDEO_EXT  = /\.(mp4|mkv|mov|avi|webm|3gp|m4v)$/i;
  const AUDIO_EXT  = /\.(mp3|ogg|oga|opus|m4a|aac|wav|flac|amr)$/i;
  const DOC_EXT    = /\.(pdf|docx?|xlsx?|pptx?|txt|zip|rar|7z|apk|csv)$/i;

  function classifyFile(name) {
    if (IMAGE_EXT.test(name)) return 'image';
    if (VIDEO_EXT.test(name)) return 'video';
    if (AUDIO_EXT.test(name)) return 'audio';
    if (DOC_EXT.test(name))   return 'doc';
    return 'unknown';
  }

  // Detect if text is a WhatsApp media reference
  function detectMedia(text) {
    // Check omit strings first
    for (const m of MEDIA_OMIT) {
      if (m.rx.test(text.trim())) {
        return { type: m.type, icon: m.icon, label: m.label, filename: null };
      }
    }
    // Check for attached filename pattern
    const m = text.trim().match(MEDIA_REF_RX);
    if (m) {
      const fname = m[1].trim();
      const type = classifyFile(fname);
      if (type !== 'unknown') {
        return { type, filename: fname, icon: null, label: null };
      }
    }
    return null;
  }

  function tryMsg(line) {
    for (const rx of MSG_RX) {
      const m = line.match(rx);
      if (m) return { date: m[1].trim(), time: m[2].trim(), sender: m[3].trim(), text: m[4].trim() };
    }
    return null;
  }

  function trySys(line) {
    for (const rx of SYS_RX) {
      const m = line.match(rx);
      if (m) {
        const text = m[3].trim();
        if (!/^[^:]+:\s/.test(text)) return { date: m[1].trim(), time: m[2].trim(), text };
      }
    }
    return null;
  }

  function parse(rawText) {
    const lines = rawText.split(/\r?\n/);
    const msgs  = [];

    for (const line of lines) {
      if (!line.trim()) continue;
      const msg = tryMsg(line);
      if (msg) {
        const media = detectMedia(msg.text);
        msgs.push({ type:'msg', date:msg.date, time:msg.time, sender:msg.sender, text:msg.text, media });
        continue;
      }
      const sys = trySys(line);
      if (sys) { msgs.push({ type:'system', date:sys.date, time:sys.time, text:sys.text }); continue; }
      // continuation
      if (msgs.length && msgs[msgs.length-1].type === 'msg') {
        msgs[msgs.length-1].text += '\n' + line;
      }
    }
    return msgs;
  }

  function getSenders(msgs) {
    const seen = new Set(), list = [];
    for (const m of msgs) if (m.type==='msg' && !seen.has(m.sender)) { seen.add(m.sender); list.push(m.sender); }
    return list;
  }

  function getStats(msgs, senders) {
    const c = {}; senders.forEach(s => c[s]=0);
    for (const m of msgs) if (m.type==='msg' && c[m.sender]!==undefined) c[m.sender]++;
    return c;
  }

  function classifyFileName(name) { return classifyFile(name); }

  return { parse, getSenders, getStats, classifyFileName };
})();
