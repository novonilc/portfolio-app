# 📊 Portfolio Rebalancer — Setup & Hosting Guide

Your personal TFSA + RRSP rebalancing and DCA planning app. Your data stays private — stored only in your browser.

## 🎯 Three Ways To Run This

Pick the option that matches your comfort level:

| Option | Effort | Access from phone? | Best for |
|--------|--------|-------------------|----------|
| **1. Run locally** | 5 min | No (same computer only) | Just trying it out |
| **2. Vercel (free hosting)** | 10 min | ✅ Yes, from anywhere | **Recommended** — free, fast, always available |
| **3. GitHub Pages** | 15 min | ✅ Yes | If you already use GitHub |

---

## 📁 File Structure

Put these files in a folder on your computer like this:

```
portfolio-app/
├── package.json
├── index.html
├── vite.config.js
└── src/
    ├── main.jsx
    └── App.jsx
```

Important: `main.jsx` and `App.jsx` go **inside a folder called `src`**.

---

## 🖥️ Option 1: Run Locally (Easiest)

### What you need
- A computer with internet
- Node.js installed → download from **https://nodejs.org** (pick the LTS version)

### Steps

1. **Create the folder structure** above and put all files in their places
2. **Open a terminal** (Command Prompt on Windows, Terminal on Mac) and navigate to the folder:
   ```bash
   cd path/to/portfolio-app
   ```
3. **Install dependencies** (one-time, takes ~30 seconds):
   ```bash
   npm install
   ```
4. **Start the app**:
   ```bash
   npm run dev
   ```
5. Open your browser to **http://localhost:5173** — that's it!

To stop the app, press `Ctrl+C` in the terminal. To start it again later, just run `npm run dev` from that folder.

---

## 🌐 Option 2: Host Free on Vercel (Recommended)

This gives you a public URL like `your-portfolio.vercel.app` that you can access from your phone, tablet, or any computer. **Completely free** for personal use.

### Steps

1. **Create a free GitHub account** at https://github.com (if you don't have one)

2. **Create a new repository**:
   - Click the "+" in the top-right → "New repository"
   - Name it `portfolio-rebalancer`
   - Keep it **Private** (your data stays yours)
   - Click "Create repository"

3. **Upload your files** via the GitHub web interface:
   - Click "uploading an existing file"
   - Drag in: `package.json`, `index.html`, `vite.config.js`
   - Create a folder called `src` by naming a file `src/main.jsx`, then upload `main.jsx` and `App.jsx`
   - Click "Commit changes"

4. **Create a free Vercel account** at https://vercel.com
   - Sign up using your GitHub account (one-click)

5. **Deploy**:
   - Click "Add New..." → "Project"
   - Select your `portfolio-rebalancer` repository
   - Vercel auto-detects Vite — just click **"Deploy"**
   - Wait ~30 seconds ⏱️

6. **Done!** Vercel gives you a URL like `portfolio-rebalancer-xyz.vercel.app`. Bookmark it on your phone!

### Making updates later
Any changes you push to GitHub auto-deploy to Vercel. You can edit files directly on GitHub's website.

---

## 🐙 Option 3: GitHub Pages

Good alternative if you prefer staying entirely inside GitHub.

1. Push files to a GitHub repo (same as Vercel step 3 above)
2. Add this to your `vite.config.js`:
   ```js
   export default defineConfig({
     plugins: [react()],
     base: "/portfolio-rebalancer/",  // your repo name
   });
   ```
3. Install the gh-pages tool:
   ```bash
   npm install -D gh-pages
   ```
4. Add to `package.json` scripts:
   ```json
   "deploy": "vite build && gh-pages -d dist"
   ```
5. Run: `npm run deploy`
6. Enable Pages in your repo settings → Pages → Source: `gh-pages` branch
7. Your site will be at `yourusername.github.io/portfolio-rebalancer`

---

## 💾 Your Data

- **Stored in your browser only** (localStorage) — nothing goes to any server
- Use **Export** button to save a backup `.json` file
- Use **Import** button to restore from a backup
- If you clear your browser cache/cookies, your data is gone — **export regularly!**
- Data does NOT sync between devices unless you export/import manually

---

## 📱 Installing on Your Phone

Once hosted on Vercel/GitHub Pages:

**iPhone:** Open URL in Safari → Share button → "Add to Home Screen"
**Android:** Open URL in Chrome → Menu → "Add to Home screen"

You'll get an icon on your phone that opens the app fullscreen like a native app.

---

## 🛠️ Troubleshooting

**"npm: command not found"** → Install Node.js from https://nodejs.org

**Blank page after deploying to Vercel** → Make sure the output directory in Vercel is set to `dist`

**Data disappeared** → Browser cache was cleared. Always Export a backup before clearing cookies!

**App looks broken on mobile** → Refresh the page; the layout is responsive

---

## ⚠️ Disclaimer

This app is for personal financial planning and education. It is **not financial advice**. Always verify allocations with your brokerage and consult a licensed Certified Financial Planner (CFP) before executing trades.
