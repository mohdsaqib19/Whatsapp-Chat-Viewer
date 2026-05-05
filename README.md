# 💬 WhatsApp Chat Viewer

> A beautiful, WhatsApp-style chat viewer that runs entirely in your browser — **no server, no uploads, 100% private.**

![HTML](https://img.shields.io/badge/HTML-5-orange?style=flat-square&logo=html5)
![CSS](https://img.shields.io/badge/CSS-3-blue?style=flat-square&logo=css3)
![JavaScript](https://img.shields.io/badge/JavaScript-ES6-yellow?style=flat-square&logo=javascript)
![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)
![No Server](https://img.shields.io/badge/Server-None%20Required-brightgreen?style=flat-square)

---

## 🖥️ Live Demo

👉 **[Click here for live demo](https://mohdsaqib19.github.io/Whatsapp-Chat-Viewer/)**

---

## ✨ Features

- 📁 **Full folder support** — Load the entire exported WhatsApp folder including all media files
- 🖼️ **Images** — Displayed directly inside chat bubbles; click to view fullscreen
- 🎬 **Videos** — Built-in video player inside the chat
- 🎵 **Audio & Voice messages** — Playable audio player with play/pause controls
- 📄 **Documents** — PDF, DOCX, ZIP and other files shown with a download button
- 🔍 **Search** — Search through all messages with keyword highlighting
- 👤 **Filter by person** — View messages from a specific participant
- 🌙 **Dark theme** — Clean dark UI styled like WhatsApp
- 📱 **Responsive** — Works on both desktop and mobile browsers
- 🔒 **Completely private** — No data ever leaves your device

---

## 🚀 How to Use

### Step 1 — Export your chat from WhatsApp

```
Open WhatsApp → Open any chat
→ Tap the ⋮ menu → More → Export Chat
→ Select "Include Media"
→ You will receive a ZIP file
```

### Step 2 — Extract the ZIP file

After extracting, you will have a folder containing:

```
WhatsApp Chat with XYZ/
├── _chat.txt
├── IMG-20240101-WA0001.jpg
├── VID-20240101-WA0002.mp4
├── PTT-20240101-WA0003.opus
└── DOC-20240101-WA0004.pdf
```

### Step 3 — Load the folder into the viewer

1. Open `index.html` in your browser
2. Drag and drop the entire extracted folder onto the drop zone
3. Or click the **"Choose Folder"** button and select the folder
4. Your chat will load instantly with all media ✅

---

## 📁 Project Structure

```
whatsapp-chat-viewer/
├── index.html          ← Open this in your browser
├── README.md
├── css/
│   └── style.css       ← All styles
└── js/
    ├── parser.js       ← Parses the _chat.txt file
    ├── render.js       ← Renders messages and media
    └── app.js          ← Main logic, search, and filters
```


## 📋 Supported File Formats

| Type | Extensions |
|------|-----------|
| Images | JPG, PNG, GIF, WEBP, HEIC |
| Videos | MP4, MKV, MOV, 3GP, WEBM |
| Audio | MP3, OGG, OPUS, M4A, AAC, WAV, AMR |
| Documents | PDF, DOCX, XLSX, PPTX, ZIP, APK |

---

## 🤝 Contributing

Pull requests are welcome. If you find a bug or have a feature request, please open an Issue.

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

*100% client-side, 100% private.*
