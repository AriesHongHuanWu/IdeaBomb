# Self-Hosting Guide for IdeaBomb

Since your Netlify credits are exhausted, you have two excellent free alternatives:
1.  **Cloudflare Pages** (Best Free Cloud Alternative)
2.  **Self-Hosting on your Linux Machine** (Total Control)

---

## Option 1: Cloudflare Pages (Recommended)
**Why?** Completely free, unlimited bandwidth, very similar to Netlify.
1.  Go to [Cloudflare Dashboard](https://dash.cloudflare.com/).
2.  Navigate to **Workers & Pages** > **Create Application** > **Pages** > **Connect to Git**.
3.  Select your GitHub Info (`IdeaBomb` repo).
4.  **Build Settings**:
    *   **Framework**: Vite (or select None)
    *   **Build Command**: `npm run build`
    *   **Output Directory**: `dist`
5.  **Environment Variables**:
    *   Copy all your `.env` variables (API Keys) into the Cloudflare Dashboard settings.
6.  **Deploy**. It's free and fast.

---

## Option 2: Hosting on Your Own Linux Machine

If you have a Linux machine (e.g., Ubuntu, Debian) with UI, you can host it easily.

### Prerequisites
*   Open **Terminal** on your Linux machine.
*   Ideally, your machine has a static IP or you are okay using it only on your local network (Wi-Fi). To access from outside, we'll use **Cloudflare Tunnel** (safest/easiest).

### Step 1: Install Node.js
Run these commands to install Node.js (v18+):
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

### Step 2: Clone & Setup
1.  Clone your repository:
    ```bash
    git clone https://github.com/AriesHongHuanWu/IdeaBomb.git
    cd IdeaBomb/whiteboard1
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  Create your `.env` file:
    ```bash
    nano .env
    ```
    (Paste your API Keys from your local Windows machine's `.env` file here. Save with Ctrl+O, Exit with Ctrl+X).

### Step 3: Serve Locally (The Simple Way)
To run it like you do on Windows:
```bash
npm run dev -- --host
```
*   Your site will be at `http://localhost:5173` (or your machine's local IP `http://192.168.x.x:5173`).
*   **Pro**: Easy.
*   **Con**: Not optimized for performance, stops if you close terminal.

### Step 4: Production Build (The Better Way)
1.  Build the static site:
    ```bash
    npm run build
    ```
    This creates a `dist` folder.
2.  Serve it using a simple web server (e.g., `serve`):
    ```bash
    sudo npm install -g serve
    serve -s dist -l 80
    ```
    Now your site is running on port 80. You can visit `http://localhost` or your machine's IP.

### Step 5: Exposing to the Internet (Cloudflare Tunnel)
If you want to access your home server from anywhere *without* messing with router port forwarding:
1.  **Install `cloudflared`** on Linux:
    ```bash
    curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
    sudo dpkg -i cloudflared.deb
    ```
2.  **Login**:
    ```bash
    cloudflared tunnel login
    ```
3.  **Run Tunnel**:
    ```bash
    cloudflared tunnel --url http://localhost:80
    ```
    It will give you a temporary random URL (trycloudflare.com) to access your site globally!
