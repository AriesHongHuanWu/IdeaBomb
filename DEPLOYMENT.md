# 部署與使用指南 (Deployment & Usage Guide)

這份文件包含 **如何在電腦上執行** 以及 **如何發布到網路 (Netlify)** 的完整教學。

## 第一部分：在電腦上打開測試 (Local Development)

要在您的電腦上執行此專案，您需要下載 **Node.js**。

### 1. 下載必要工具
- 請前往 [Node.js 官網](https://nodejs.org/)。
- 下載並安裝 **LTS 版本** (建議版本 v18 或 v20 以上)。
- 安裝過程中一路點擊 "Next" 直到完成。

### 2. 安裝與執行
1. 在資料夾 `whiteboard1` 的空白處，按住 `Shift` + `右鍵`，選擇 **"在終端機中開啟"** (或 Powershell/CMD)。
2. 輸入以下指令來安裝套件 (只需執行一次)：
   ```bash
   npm install
   ```
3. 輸入以下指令來啟動網站：
   ```bash
   npm run dev
   ```
4. 看到 `Local: http://localhost:5173/` 字樣後，按住 `Ctrl` 並點擊該網址，即可在瀏覽器中看到您的白板！

---

## 第二部分：發布到 Netlify (線上託管)

有兩種方式可以將網站放到網路上：

### 方法 A：使用 GitHub (最推薦，自動化)
*優點：日後更新方便，且不需要在本地端打包。*
1. 將程式碼上傳到 GitHub Repository。
2. 在 Netlify 選擇 "Import from Git"。
3. Netlify 會幫您自動打包與發布。

### 方法 B：直接拖曳上傳 (Manual Deploy to Netlify)
*優點：不需使用 GitHub。缺點：每次更新都要手動重新打包。*
1. 確保您已依照「第一部分」安裝 Node.js 並執行過 `npm install`。
2. 在終端機輸入打包指令：
   ```bash
   npm run build
   ```
3. 完成後，資料夾內會出現一個新的 **`dist`** 資料夾 (這是編譯好的網站)。
4. 登入 [Netlify Drop](https://app.netlify.com/drop) 或 Netlify 後台。
5. 將 **`dist`** 資料夾直接拖曳到網頁上的上傳區塊。
6. 網站即刻上線！

---

## 重要設定 (Environment Variables)
- **API Key**: 
  - 本地測試：請將 `.env.example` 檔案複製一份並改名為 `.env`，在裡面填入您的 `VITE_GEMINI_API_KEY`。
  - Netlify：請在 Site Settings -> Environment Variables 中設定 `VITE_GEMINI_API_KEY`。

祝您開發愉快！
