export const translations = {
    en: {
        // Shared
        settings: 'Settings', theme: 'Theme', lang: 'Language', light: 'Light', dark: 'Dark',
        cancel: 'Cancel', confirm: 'Confirm', delete: 'Delete', edit: 'Edit', save: 'Save',
        close: 'Close', signOut: 'Sign Out', loading: 'Loading...',

        // Dashboard
        home: 'Home Page', all: 'All Boards', my: 'My Boards', shared: 'Shared with me',
        todo: 'TODO', admin: 'Admin Console', folders: 'FOLDERS',
        newBoard: 'New Board', noBoards: 'No boards found in this view.',
        untitled: 'Untitled Board', sharedBy: 'Shared by', lastActive: 'Last Active',
        rename: 'Rename', move: 'Move to Folder',
        typeHere: 'Type here...',
        deleteTitle: 'Delete Board?', deleteMsg: 'Are you sure you want to delete this board? This action cannot be undone.',
        renameTitle: 'Rename Board', moveTitle: 'Move to Folder',

        // TodoView
        todoTitle: 'Tasks', inbox: 'Inbox', today: 'Today', upcoming: 'Upcoming',
        completed: 'Completed', overdue: 'Overdue',
        addTask: 'Add Task', taskName: 'Task Name', desc: 'Description',
        priority: 'Priority', p1: 'Priority 1', p2: 'Priority 2', p3: 'Priority 3', p4: 'Priority 4',
        noTasks: 'No tasks found.', completedTasks: 'Completed Tasks',

        // BoardPage
        share: 'Share', canvasSize: 'Canvas Size', help: 'Help',
        width: 'Width', height: 'Height', apply: 'Apply',
        invite: 'Invite', inviteDesc: 'Invite collaborators by email (must use Google Login).',
        copyLink: 'Copy Link', copied: 'Copied!',
        import: 'Import', export: 'Export',
        hideMe: 'Hide Me', showMe: 'Show Me',
        accessDenied: 'Access Denied',
        toolbar: {
            select: 'Select', rectangle: 'Rectangle', circle: 'Circle',
            arrow: 'Arrow', text: 'Text', image: 'Image',
            sticky: 'Sticky Note', draw: 'Draw', erase: 'Eraser',
            timer: 'Timer', counter: 'Counter', sticker: 'Sticker',
            progress: 'Progress', rating: 'Rating', shape: 'Shape',
            avatar: 'Avatar', kanban: 'Kanban', clock: 'Clock', code: 'Code',
            calendar: 'Calendar', youtube: 'YouTube', link: 'Link',
            quote: 'Quote', pomodoro: 'Pomodoro',
            invite: 'Invite', inviteDesc: 'Invite collaborators by email (must use Google Login).',
            copyLink: 'Copy Link', copied: 'Copied!',
            import: 'Import', export: 'Export',
            hideMe: 'Hide Me', showMe: 'Show Me',
            accessDenied: 'Access Denied',
            aiConsultant: 'AI Consultant',
            welcomeMessage: 'I am your Whiteboard Assistant. Try saying "Create a marketing plan"!',
            thinking: 'Thinking...',
            askAI: 'Ask AI to create...',
            listening: 'Listening...',
            rateLimit: 'Updates are paused temporarily (Rate Limit). Please try again in 10-20 seconds.',
            aiPending: 'AI Suggestions Pending Review',
            acceptAll: 'Accept All', discardAll: 'Discard All',
            newPage: 'New Page', rename: 'Rename', delete: 'Delete',
            locked: 'Locked', unlocked: 'Unlocked',
            bringFront: 'Bring to Front', sendBack: 'Send to Back',
            copy: 'Copy', duplicate: 'Duplicate',
            width: 'Width', height: 'Height', apply: 'Apply'
        },

        // LandingPage

        features: 'Features', howItWorks: 'How It Works', pricing: 'Pricing',
        dashboard: 'Dashboard', signIn: 'Sign In',
        geminiBanner: '✨ Now with Gemini AI Integration',
        heroTitle: 'Think Bigger.\nCollaborate Smarter.',
        heroDesc: 'The infinite canvas for engineering teams. Brainstorm, plan, and build with the power of Google\'s Gemini AI.',
        ctaStart: 'Start Whiteboarding Free', ctaDemo: 'View Demo',
        whyChoose: 'Why choose IdeaBomb?', whyDesc: 'Bank-grade security meets consumer-grade simplicity.',
        infiniteCanvas: 'Infinite Canvas', infiniteDesc: 'Break free from page limits. Organize thoughts, flowcharts, and plans on an endless whiteboard.',
        aiIntegration: 'Gemini AI Integration', aiDesc: 'Use @ai to summarize discussions, generate content, and organize your board automatically.',
        realTime: 'Real-time Collaboration', realTimeDesc: 'Chat, comment, and co-edit with your team instantly. See cursors and updates live.',
        hiwTitle: 'How It Works', hiwDesc: 'Get started in seconds. Master it in minutes.',
        step1: 'Sign Up & Create', step1Desc: 'Log in with your Google account and create your first unlimited whiteboard.',
        step2: 'Invite Your Team', step2Desc: 'Share the link or invite via email to collaborate in real-time.',
        step3: 'Unleash AI', step3Desc: 'Type @ai in the chat or context menu to brainstorm, summarize, and create content.',
        solutions: 'Tailored Solutions', solutionsDesc: 'Empowering teams across every industry.',
        designers: 'Designers', designersDesc: 'Wireframe, prototype, and gather feedback in one shared space.',
        engineers: 'Engineers', engineersDesc: 'Map out architectures, flowcharts, and system designs collaboratively.',
        managers: 'Managers', managersDesc: 'Track projects, organize sprints, and align team goals seamlessly.',
        pricingTitle: 'Simple, Transparent Pricing',
        starter: 'Starter', free: '$0', month: '/ month', freeFeat: 'All features free during Beta',
        currentPlan: 'Current Plan', getStarted: 'Get Started',
        unlimitedBoards: 'Unlimited Boards', basicAI: 'Basic AI (Flash-Lite)',
        pro: 'Pro', comingSoon: 'COMING SOON', proPrice: '$2', proDesc: 'For power users', waitlist: 'Join Waitlist',
        trustedBy: 'Trusted by', users: 'users',
        faq: 'Frequently Asked Questions',
        q1: 'Is IdeaBomb really free?', a1: 'Yes! The Starter plan is completely free and includes unlimited boards and real-time collaboration.',
        q2: 'How does the AI integration work?', a2: 'Simply type @ai in any text note or chat message. Gemini will analyze your board context and provide intelligent suggestions, summaries, or content.',
        q3: 'Can I invite my entire team?', a3: 'Absolutely. There are no limits on the number of collaborators you can invite to a board, even on the free plan.',
        q4: 'Is my data secure?', a4: 'We use enterprise-grade encryption and secure Google authenticaton to ensure your ideas stay safe.',
        product: 'Product', overview: 'Overview', userGuide: 'User Guide', contact: 'Contact', settings: 'Settings',
        terms: 'Terms of Service', privacy: 'Privacy Policy', rights: 'All rights reserved.', createdBy: 'Created by AWBest Studio'
    },
    'zh-TW': {
        // Shared
        settings: '設定', theme: '主題', lang: '語言', light: '亮色', dark: '深色',
        cancel: '取消', confirm: '確認', delete: '刪除', edit: '編輯', save: '儲存',
        close: '關閉', signOut: '登出', loading: '載入中...',

        // Dashboard
        home: '首頁', all: '所有白板', my: '我的白板', shared: '與我共用',
        todo: '待辦事項', admin: '管理控制台', folders: '資料夾',
        newBoard: '新增白板', noBoards: '此檢視中沒有白板。',
        untitled: '未命名白板', sharedBy: '分享者', lastActive: '最後活動',
        rename: '重新命名', move: '移動到資料夾',
        typeHere: '在此輸入...',
        deleteTitle: '刪除白板？', deleteMsg: '您確定要刪除此白板嗎？此動作無法復原。',
        renameTitle: '重新命名白板', moveTitle: '移動到資料夾',

        // TodoView
        todoTitle: '待辦清單', inbox: '收件匣', today: '今天', upcoming: '即將到來',
        completed: '已完成', overdue: '即將過期',
        addTask: '新增任務', taskName: '任務名稱', desc: '描述',
        priority: '優先級', p1: '優先級 1', p2: '優先級 2', p3: '優先級 3', p4: '優先級 4',
        noTasks: '沒有找到任務。', completedTasks: '已完成的任務',

        // BoardPage
        share: '分享', canvasSize: '畫布尺寸', help: '說明',
        width: '寬度', height: '高度', apply: '套用',
        arrow: '箭頭', text: '文字', image: '圖片',
        sticky: '便利貼', draw: '繪圖', erase: '橡皮擦',
        timer: '計時器', counter: '計數器', sticker: '貼紙',
        progress: '進度條', rating: '評分', shape: '形狀',
        avatar: '頭像', kanban: '看板', clock: '時鐘', code: '程式碼',
        calendar: '日曆', youtube: 'YouTube', link: '連結',
        quote: '名言', pomodoro: '番茄鐘',
    },
    invite: '邀請成員', inviteDesc: '透過電子郵件邀請協作成員（必須使用 Google 登入）。',
    copyLink: '複製連結', copied: '已複製！',
    import: '匯入', export: '匯出',
    hideMe: '隱藏游標', showMe: '顯示游標',
    accessDenied: '存取被拒',
    aiConsultant: 'AI 顧問',
    welcomeMessage: '我是您的白板助理。試著說「建立一個行銷計畫」！',
    thinking: '思考中...',
    askAI: '要求 AI 建立...',
    listening: '聆聽中...',
    rateLimit: '更新暫時暫停（速率限制）。請在 10-20 秒後再試。',
    aiPending: 'AI 建議待審核',
    acceptAll: '接受全部', discardAll: '捨棄全部',
    newPage: '新頁面', rename: '重新命名', delete: '刪除',
    locked: '鎖定', unlocked: '解鎖',
    bringFront: '移到最上層', sendBack: '移到最下層',
    copy: '複製', duplicate: '複製',
    // The following keys already exist above, but are included in the instruction's snippet.
    // They are kept here to match the instruction's intent of adding them in this block.
    width: '寬度', height: '高度', apply: '套用',
    heroTitle: '思考無邊界。\n協作更智慧。',
    heroDesc: '專為工程團隊打造的無限白板。藉助 Google Gemini AI 的力量進行腦力激盪、規劃與構建。',
    ctaStart: '免費開始使用', ctaDemo: '觀看演示',
    whyChoose: '為什麼選擇 IdeaBomb？', whyDesc: '銀行級的安全性，消費級的簡易性。',
    infiniteCanvas: '無限畫布', infiniteDesc: '突破頁面限制。在無盡的白板上組織想法、流程圖和計劃。',
    aiIntegration: 'Gemini AI 整合', aiDesc: '使用 @ai 自動總結討論、生成內容並組織您的白板。',
    realTime: '即時協作', realTimeDesc: '與團隊即時聊天、評論和共同編輯。即時查看游標和更新。',
    hiwTitle: '如何運作', hiwDesc: '幾秒鐘即可上手。幾分鐘內精通。',
    step1: '註冊與建立', step1Desc: '使用您的 Google 帳戶登入並建立您的第一個無限白板。',
    step2: '邀請團隊', step2Desc: '分享連結或透過電子郵件邀請，進行即時協作。',
    step3: '釋放 AI 潛能', step3Desc: '在聊天或右鍵選單中輸入 @ai 來進行腦力激盪、總結和創作內容。',
    solutions: '量身打造的解決方案', solutionsDesc: '賦能各行各業的團隊。',
    designers: '設計師', designersDesc: '在一個共享空間中繪製線框圖、原型製作並收集回饋。',
    engineers: '工程師', engineersDesc: '協作繪製架構圖、流程圖和系統設計。',
    managers: '管理者', managersDesc: '無縫追蹤專案、組織衝刺並對齊團隊目標。',
    pricingTitle: '簡單透明的定價',
    starter: '入門版', free: '$0', month: '/ 月', freeFeat: 'Beta 期間所有功能免費',
    currentPlan: '目前方案', getStarted: '開始使用',
    unlimitedBoards: '無限白板', basicAI: '基礎 AI (Flash-Lite)',
    pro: '專業版', comingSoon: '即將推出', proPrice: '$2', proDesc: '適合進階使用者', waitlist: '加入候補名單',
    trustedBy: '受到', users: '位使用者的信賴',
    faq: '常見問題',
    q1: 'IdeaBomb 真的免費嗎？', a1: '是的！入門計劃完全免費，包括無限白板和即時協作。',
    q2: 'AI 整合如何運作？', a2: '只需在任何文字或聊天訊息中輸入 @ai。Gemini 將分析您的白板內容並提供智慧建議、總結或生成內容。',
    q3: '我可以邀請整個團隊嗎？', a3: '絕對可以。即使在免費計劃中，邀請協作者的數量也沒有限制。',
    q4: '我的資料安全嗎？', a4: '我們使用企業級加密和安全的 Google 驗證來確保您的想法安全無虞。',
    product: '產品', overview: '總覽', userGuide: '使用者指南', contact: '聯絡我們', settings: '設定',
    terms: '服務條款', privacy: '隱私權政策', rights: '版權所有。', createdBy: '由 AWBest Studio 製作'
}


export const themeColors = {
    light: {
        bg: '#f8f9fa', sidebar: '#ffffff', text: '#5f6368', textPrim: '#202124',
        border: '#dadce0', activeBg: '#e8f0fe', activeText: '#1a73e8',
        cardBg: '#ffffff', cardHover: '#ffffff', header: '#ffffff',
        inputBg: '#ffffff', modalBg: '#ffffff',
        shadow: 'rgba(0,0,0,0.1)',
        // Specifics for Board
        canvasBg: '#f8f9fa', toolbarBg: '#ffffff', toolActive: '#e8f0fe'
    },
    dark: {
        bg: '#0f172a',          // Slate 900 - Main Background
        sidebar: '#1e293b',     // Slate 800 - Sidebar/Panels
        text: '#94a3b8',        // Slate 400 - Secondary Text
        textPrim: '#f8fafc',    // Slate 50 - Primary Text
        border: '#334155',      // Slate 700 - Borders
        activeBg: 'rgba(56, 189, 248, 0.15)', // Light Blue Tint for active states
        activeText: '#38bdf8',  // Sky 400 - Vibrant Accent
        cardBg: '#1e293b',      // Slate 800 - Cards
        cardHover: '#334155',   // Slate 700 - Card Hover
        header: '#0f172a',      // Slate 900 - Header
        inputBg: '#020617',     // Slate 950 - Inputs (Darker for depth)
        modalBg: '#1e293b',     // Slate 800 - Modals
        shadow: 'rgba(0, 0, 0, 0.4)', // Richer shadow
        // Specifics for Board
        canvasBg: '#0f172a',
        toolbarBg: '#1e293b',
        toolActive: '#334155'
    }
}
