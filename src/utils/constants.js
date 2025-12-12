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
        toolbar: {
            select: 'Select', rectangle: 'Rectangle', circle: 'Circle',
            arrow: 'Arrow', text: 'Text', image: 'Image',
            sticky: 'Sticky Note', draw: 'Draw', erase: 'Eraser'
        }
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
        toolbar: {
            select: '選擇', rectangle: '矩形', circle: '圓形',
            arrow: '箭頭', text: '文字', image: '圖片',
            sticky: '便利貼', draw: '繪圖', erase: '橡皮擦'
        }
    }
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
        bg: '#121212', sidebar: '#1e1e1e', text: '#aaaaaa', textPrim: '#e0e0e0',
        border: '#333333', activeBg: '#2c3e50', activeText: '#4facfe',
        cardBg: '#1e1e1e', cardHover: '#252525', header: '#1e1e1e',
        inputBg: '#2d2d2d', modalBg: '#1e1e1e',
        shadow: 'rgba(0,0,0,0.5)',
        // Specifics for Board
        canvasBg: '#121212', toolbarBg: '#1e1e1e', toolActive: '#333333'
    }
}
