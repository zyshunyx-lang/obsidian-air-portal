import { App, Plugin, PluginSettingTab, Setting, Notice, addIcon, TFile } from 'obsidian';
const { clipboard } = require('electron');
import * as http from 'http';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
import * as QRCode from 'qrcode';

// --- i18n Dictionary ---
const TR = {
    zh: {
        plugin_name: 'AirPortal 无线传送门',
        ribbon_tooltip: '打开 AirPortal 面板',
        server_started: 'AirPortal 已启动 (端口 {0})',
        server_stopped: '服务已停止',
        port_in_use: '❌ 端口 {0} 被占用，请在设置中更改！',
        start_failed: '❌ 服务启动失败',
        saved: '已保存',
        error: '错误',

        status_running: '🟢 AirPortal 运行中',
        status_stopped: '🔴 AirPortal 已停止',
        btn_start: '▶ 启动服务',
        btn_stop: '⏹ 暂停服务',
        btn_processing: '⏳ 处理中...',
        scan_qr: '📱 手机扫码或浏览器访问上方地址',
        guide_title: '📖 AirPortal 使用指南',
        guide_1: '点击上方按钮启动服务，确保状态变绿。',
        guide_2: '确保手机和电脑连接同一个 Wi-Fi。',
        guide_3: '手机扫码或输入地址打开 AirPortal 网页。',
        guide_4: '在网页上进行传输、编辑或下载。',

        risk_title: '⚠️ 风险提示与免责声明',
        risk_warning: '覆盖警告：',
        risk_desc: '上传同名文件将',
        risk_desc_strong: '直接覆盖且无法撤销',
        risk_footer: '免责声明：本插件仅在局域网工作。作者不对因覆盖操作导致的数据丢失负责。请定期备份。',

        setting_port: '服务端口 (Server port)',
        setting_port_desc: '默认为 27123。',
        setting_upload_folder: '从手机上传的文件夹 (Upload Folder)',
        setting_upload_folder_desc: '上传文件的保存位置。默认存放在 AirPortal 文件夹。',
        btn_save_restart: '保存并重启',
        setting_ip: '手动指定 IP (Manual IP)',
        setting_ip_desc: '如果自动识别失败，请手动填入。',
        btn_update_ip: '更新显示',

        author: '插件开发：Obsidian 爱好者',
        github: '访问 GitHub 主页 / 反馈问题',
        zyshunyx: 'zyshunyx',

        web_title: 'AirPortal',
        web_import: '导入文件',
        web_new: '新建笔记',
        web_search: '搜索笔记...',
        // [v2 Feature] Clipboard i18n
        web_clipboard_title: '剪切板历史',
        web_clipboard_placeholder: '发送文字到电脑...',
        web_clipboard_btn: '发送',
        web_clipboard_pull: '从电脑获取',
        web_clipboard_copy_toast: '已复制到手机',
        web_clipboard_archive_toast: '✅ 已归档到 Clipboard.md',
        web_clipboard_expand: '展开更多',
        web_clipboard_collapse: '收起',

        web_empty: '电脑上没有笔记',
        web_download: '下载',
        web_save: '保存',
        web_close: '关闭',
        web_toast_uploading: '正在上传...',
        web_toast_success: '✅ 导入成功',
        web_toast_saved: '✅ 已保存到电脑',
        web_toast_failed: '❌ 失败',
        web_toast_deleted: '🗑️ 已删除',
        web_toast_clipboard: '📋 已发送到电脑',
        web_connecting: '正在连接 AirPortal...',
        web_disconnect: '连接断开',
        rename: '重命名/移动',
        delete: '删除',
        copy: '复制',
        edit: '编辑',
        confirmDelete: '确认删除？',
        parentFolder: '.. (上级文件夹)',
    },
    en: {
        plugin_name: 'AirPortal',
        ribbon_tooltip: 'Open AirPortal Dashboard',
        server_started: 'AirPortal Started (Port {0})',
        server_stopped: 'Server Stopped',
        port_in_use: '❌ Port {0} is in use!',
        start_failed: '❌ Failed to start server',
        saved: 'Saved',
        error: 'Error',

        status_running: '🟢 AirPortal Running',
        status_stopped: '🔴 Service Stopped',
        btn_start: '▶ Start Service',
        btn_stop: '⏹ Stop Service',
        btn_processing: '⏳ Processing...',
        scan_qr: '📱 Scan QR code or visit the URL above',
        guide_title: '📖 AirPortal Guide',
        guide_1: 'Click button above to start service (Green light).',
        guide_2: 'Ensure phone and PC are on the same Wi-Fi.',
        guide_3: 'Scan QR code to open AirPortal web interface.',
        guide_4: 'Upload, edit, or download notes from your phone.',

        risk_title: '⚠️ Warning & Disclaimer',
        risk_warning: 'Overwrite warning:',
        risk_desc: 'Uploading files with same names will ',
        risk_desc_strong: 'OVERWRITE permanently',
        risk_footer: 'Disclaimer: LAN only. Author is not responsible for data loss. Please backup regularly.',

        setting_port: 'Server port',
        setting_port_desc: 'Default 27123.',
        btn_save_restart: 'Save & restart',
        setting_ip: 'Manual IP',
        setting_ip_desc: 'Enter manually if auto-detection fails.',
        setting_upload_folder: 'Upload Folder',
        setting_upload_folder_desc: 'Folder to store uploaded files. Default: Can set to "AirPortal"',
        btn_update_ip: 'Update view',

        author: 'Developed by: Obsidian Fan',
        github: 'GitHub / Issues',
        zyshunyx: 'zyshunyx',

        web_title: 'AirPortal',
        web_import: 'Import',
        web_new: 'New Note',
        web_search: 'Search notes...',
        // [v2 Feature] Clipboard i18n
        web_clipboard_title: 'Clipboard History',
        web_clipboard_placeholder: 'Send text to PC...',
        web_clipboard_btn: 'Send',
        web_clipboard_pull: 'Pull from PC',
        web_clipboard_copy_toast: 'Copied to Phone',
        web_clipboard_archive_toast: '✅ Archived to Clipboard.md',
        web_clipboard_expand: 'Show More',
        web_clipboard_collapse: 'Collapse',

        web_empty: 'No notes found',
        web_download: 'Download',
        web_save: 'Save',
        web_close: 'Close',
        web_toast_uploading: 'Uploading...',
        web_toast_success: '✅ Import Success',
        web_toast_saved: '✅ Saved to PC',
        web_toast_failed: '❌ Failed',
        web_toast_deleted: '🗑️ Deleted',
        web_toast_clipboard: '📋 Sent to PC',
        web_connecting: 'Connecting to AirPortal...',
        web_disconnect: 'Disconnected',
        rename: 'Rename/Move',
        delete: 'Delete',
        copy: 'Duplicate',
        edit: 'Edit',
        confirmDelete: 'Confirm Delete?',
        parentFolder: '.. (Parent Folder)',
    }
};

function t(key: keyof typeof TR.en, ...args: any[]): string {
    const lang = window.moment.locale() === 'zh-cn' ? 'zh' : 'en';
    let text = TR[lang][key] || TR['en'][key] || key;
    if (args.length) {
        args.forEach((arg, i) => {
            text = text.replace(`{${i}}`, arg);
        });
    }
    return text;
}

addIcon('airportal-icon', `<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="2" y1="12" x2="22" y2="12"></line><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path></svg>`);

// [v2] Add clipboardHistory to settings
interface LanEditorSettings {
    port: number;
    manualIP: string;
    clipboardHistory: string[];
    uploadFolder: string;
}
const DEFAULT_SETTINGS: LanEditorSettings = { port: 27123, manualIP: '', clipboardHistory: [], uploadFolder: 'AirPortal' }

export default class LanEditorPlugin extends Plugin {
    settings!: LanEditorSettings;
    server: http.Server | null = null;
    ribbonIconEl!: HTMLElement;
    isServerRunning: boolean = false;

    async onload() {
        await this.loadSettings();
        this.ribbonIconEl = this.addRibbonIcon('airportal-icon', t('ribbon_tooltip'), () => {
            // @ts-ignore
            this.app.setting.open();
            // @ts-ignore
            this.app.setting.openTabById(this.manifest.id);
        });
        void this.startServer();
        this.addSettingTab(new LanEditorSettingTab(this.app, this));
    }

    onunload() {
        this.stopServer();
    }

    getLocalIP() {
        if (this.settings.manualIP) return this.settings.manualIP;
        const interfaces = os.networkInterfaces();
        for (const devName in interfaces) {
            const iface = interfaces[devName];
            if (!iface) continue;
            for (const alias of iface) {
                if (alias.family === 'IPv4' && alias.address !== '127.0.0.1' && !alias.internal) {
                    if (alias.address.startsWith('192.168.')) return alias.address;
                }
            }
        }
        return '127.0.0.1';
    }

    async startServer(): Promise<boolean> {
        if (this.server) return true;
        // @ts-ignore
        const vaultPath = this.app.vault.adapter.basePath;

        return new Promise((resolve) => {
            try {
                this.server = http.createServer((req, res) => {
                    void this.handleRequest(req, res, vaultPath);
                });

                this.server.listen(this.settings.port, () => {
                    this.isServerRunning = true;
                    new Notice(t('server_started', this.settings.port));
                    resolve(true);
                });

                this.server.on('error', (e: NodeJS.ErrnoException) => {
                    if (e.code === 'EADDRINUSE') {
                        new Notice(t('port_in_use', this.settings.port));
                        this.stopServer();
                    }
                    resolve(false);
                });
            } catch (e) {
                new Notice(t('start_failed'));
                this.stopServer();
                resolve(false);
            }
        });
    }

    async handleRequest(req: http.IncomingMessage, res: http.ServerResponse, vaultPath: string) {
        const url = new URL(req.url || '', `http://${req.headers.host}`);
        const pathname = url.pathname;

        if (pathname === '/' && req.method === 'GET') {
            res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
            res.end(this.getWebInterfaceHTML());
            return;
        }

        if (pathname === '/api/list') {
            const files = this.app.vault.getAllLoadedFiles().map(f => ({
                name: f.name,
                path: f.path,
                isDir: f instanceof TFile ? false : true,
                mtime: f instanceof TFile ? f.stat.mtime : 0,
                parent: f.parent ? f.parent.path : ''
            }));
            // Sort: Folders first, then by mtime desc
            files.sort((a, b) => {
                if (a.isDir && !b.isDir) return -1;
                if (!a.isDir && b.isDir) return 1;
                return b.mtime - a.mtime;
            });
            res.writeHead(200, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify(files));
            return;
        }

        if (pathname === '/api/get') {
            const filename = url.searchParams.get('file');
            const file = this.app.vault.getAbstractFileByPath(filename || '');
            if (file instanceof TFile) {
                const ext = file.extension.toLowerCase();
                const mimeMap: Record<string, string> = {
                    'png': 'image/png',
                    'jpg': 'image/jpeg',
                    'jpeg': 'image/jpeg',
                    'gif': 'image/gif',
                    'webp': 'image/webp',
                    'svg': 'image/svg+xml',
                    'pdf': 'application/pdf'
                };
                const mime = mimeMap[ext];
                if (mime) {
                    const content = await this.app.vault.readBinary(file);
                    res.writeHead(200, { 'Content-Type': mime });
                    res.end(Buffer.from(content));
                } else {
                    const content = await this.app.vault.read(file);
                    res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
                    res.end(content);
                }
            } else { res.writeHead(404); res.end(); }
            return;
        }

        // 【v2 Feature】Safe Save (Trash Mechanism)
        if (pathname === '/api/save' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const { filename, content } = JSON.parse(body);
                    const safeName = filename.replace(/\.\./g, '');
                    let file = this.app.vault.getAbstractFileByPath(safeName);

                    if (file instanceof TFile) {
                        // Move old file to Obsidian Trash first
                        await this.app.vault.trash(file, false);
                        await this.app.vault.create(safeName, content);
                    } else {
                        await this.app.vault.create(safeName, content);
                    }

                    res.writeHead(200); res.end('Saved');
                } catch (e) { res.writeHead(500); res.end('Error'); }
            });
            return;
        }

        // 【v2 Feature】Clipboard Sync & History (Bidirectional + Archive + Delete)
        if (pathname === '/api/clipboard') {
            // Mobile -> PC (Push)
            if (req.method === 'POST') {
                let body = '';
                req.on('data', chunk => body += chunk);
                req.on('end', async () => {
                    try {
                        const { text, action } = JSON.parse(body);

                        // Action: DELETE
                        if (action === 'delete') {
                            // Check if current clipboard matches deleted text
                            const currentText = clipboard.readText();
                            if (currentText === text) {
                                clipboard.writeText('');
                            }

                            this.settings.clipboardHistory = this.settings.clipboardHistory.filter(t => t !== text);
                            await this.saveSettings();
                            res.writeHead(200); res.end('Deleted');
                            return;
                        }

                        // Action: SYNC (Default)
                        if (text) {
                            await navigator.clipboard.writeText(text);
                            await this.addToHistory(text); // Save to history
                            new Notice('📋 AirPortal: ' + text.substring(0, 20) + (text.length > 20 ? '...' : ''));
                            res.writeHead(200); res.end('OK');
                        } else {
                            res.writeHead(200); res.end('Empty');
                        }
                    } catch (e) { res.writeHead(400); res.end('Invalid JSON'); }
                });
                return;
            }

            // PC -> Mobile (Pull) + Get History
            if (req.method === 'GET') {
                try {
                    // Try to read PC clipboard using Electron API
                    const text = clipboard.readText();
                    if (text) await this.addToHistory(text);

                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        current: text,
                        history: this.settings.clipboardHistory
                    }));
                } catch (e) {
                    res.writeHead(200, { 'Content-Type': 'application/json' });
                    res.end(JSON.stringify({
                        current: '',
                        history: this.settings.clipboardHistory
                    }));
                }
                return;
            }
        }

        // 【v2 Feature】Archive Clipboard to Markdown
        if (pathname === '/api/clipboard/archive' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const { text } = JSON.parse(body);
                    const targetFile = 'Clipboard.md';
                    const timestamp = window.moment().format('YYYY-MM-DD HH:mm');
                    const appendContent = `- [${timestamp}] ${text}\n`;

                    let file = this.app.vault.getAbstractFileByPath(targetFile);
                    if (!file) {
                        await this.app.vault.create(targetFile, `# 📋 剪切板归档 (Clipboard Archive)\n\n${appendContent}`);
                    } else if (file instanceof TFile) {
                        await this.app.vault.process(file, (data) => data + appendContent);
                    }

                    new Notice(`💾 已归档到 ${targetFile}`);
                    res.writeHead(200); res.end('Archived');
                } catch (e) { res.writeHead(500); res.end('Error'); }
            });
            return;
        }

        if (pathname === '/api/upload' && req.method === 'POST') {
            const rawName = url.searchParams.get('name') || 'uploaded.md';
            const rawFolder = url.searchParams.get('folder');
            const fileName = decodeURIComponent(rawName);
            const folderParam = rawFolder ? decodeURIComponent(rawFolder) : '';
            const safeName = path.basename(fileName);

            // Resolve upload folder path
            const folderName = folderParam || this.settings.uploadFolder || '';
            const relativePath = folderName ? path.join(folderName, safeName) : safeName;
            const fullPath = path.join(vaultPath, relativePath);
            const uploadDir = path.dirname(fullPath);

            // Ensure directory exists
            if (!fs.existsSync(uploadDir)) {
                fs.mkdirSync(uploadDir, { recursive: true });
            }

            const writeStream = fs.createWriteStream(fullPath);
            req.pipe(writeStream);
            req.on('end', () => {
                res.writeHead(200); res.end('OK');
                // @ts-ignore
                setTimeout(() => this.app.vault.adapter.reconcileFileCreation(relativePath.replace(/\\/g, '/')), 500);
            });
            return;
        }

        if (pathname === '/api/rename' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const { oldPath, newName } = JSON.parse(body);
                    const file = this.app.vault.getAbstractFileByPath(oldPath);
                    if (file instanceof TFile && file.parent) {
                        // Use app.fileManager.renameFile(file, newPath)
                        let parent = file.parent.path;
                        if (parent === '/') parent = '';
                        const targetPath = parent ? `${parent}/${newName}` : newName;
                        await this.app.fileManager.renameFile(file, targetPath);
                        res.writeHead(200); res.end('Renamed');
                    } else {
                        res.writeHead(404); res.end('File not found');
                    }
                } catch (e) {
                    res.writeHead(500); res.end('Error: ' + String(e));
                }
            });
            return;
        }

        if (pathname === '/api/copy' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const { oldPath, newName } = JSON.parse(body); // newName is a full relative path here? No, let's say user inputs a path.
                    // Actually, let's stick to rename logic: user inputs new path (relative to parent or absolute relative to vault).
                    // If user moves file, it's rename. If user duplicates, we need `copy`.
                    // app.vault.copy(file, newPath)
                    const file = this.app.vault.getAbstractFileByPath(oldPath);
                    if (file instanceof TFile && file.parent) {
                        let parent = file.parent.path;
                        if (parent === '/') parent = '';
                        // Construct target path properly. User input newName is just filename?
                        // If duplicating, user might want to keep same folder or move.
                        // Impl: prompt user for "New Path" (e.g. Folder/Name-Copy.md).
                        // Let's assume newName IS the new path relative to vault? Or same logic as rename?
                        // Let's use same logic as rename: newName is just name, path is same folder.
                        // Or allow user to type 'Folder/Name.md'.
                        // Rename logic used `path.join(parent, newName)`. If newName contains '/', it joins correctly?
                        // `path.join('A', 'B/C')` -> 'A/B/C'. Yes on POSIX. On Windows `path.join` uses `\`.
                        // Obsidian paths use `/`.
                        // Let's treat input as relative to parent folder. But if user inputs '../B', it might go up.
                        // Obsidian API handles normalization usually.

                        // For copy, let's use the provided `newName` as the full path if it starts with known folder? No.
                        // Let's stick to consistent behavior with Rename: relative to parent.
                        const targetPath = parent ? `${parent}/${newName}` : newName;
                        await this.app.vault.copy(file, targetPath);
                        res.writeHead(200); res.end('Copied');
                    } else {
                        res.writeHead(404); res.end('File not found');
                    }
                } catch (e) {
                    res.writeHead(500); res.end('Error: ' + String(e));
                }
            });
            return;
        }

        if (pathname === '/api/delete' && req.method === 'POST') {
            let body = '';
            req.on('data', chunk => body += chunk);
            req.on('end', async () => {
                try {
                    const { path: filePath } = JSON.parse(body);
                    const file = this.app.vault.getAbstractFileByPath(filePath);
                    if (file instanceof TFile) {
                        await this.app.vault.trash(file, true); // true = system trash, false = .trash
                        res.writeHead(200); res.end('Deleted');
                    } else {
                        res.writeHead(404); res.end('File not found');
                    }
                } catch (e) {
                    res.writeHead(500); res.end('Error');
                }
            });
            return;
        }

        if (pathname === '/api/download' && req.method === 'GET') {
            const filename = url.searchParams.get('file');
            const file = this.app.vault.getAbstractFileByPath(filename || '');
            if (file instanceof TFile) {
                const filePath = path.join(vaultPath, file.path);
                const stat = fs.statSync(filePath);
                const encodedFilename = encodeURIComponent(file.name);
                res.writeHead(200, {
                    'Content-Type': 'application/octet-stream',
                    'Content-Length': stat.size,
                    'Content-Disposition': `attachment; filename="${encodedFilename}"; filename*=UTF-8''${encodedFilename}`
                });
                fs.createReadStream(filePath).pipe(res);
            } else { res.writeHead(404); res.end('File not found'); }
            return;
        }
        res.writeHead(404); res.end();
    }

    // Helper: Add text to clipboard history
    async addToHistory(text: string) {
        if (!text || !text.trim()) return;
        // Deduplicate: remove if exists
        this.settings.clipboardHistory = this.settings.clipboardHistory.filter(t => t !== text);
        // Add to top
        this.settings.clipboardHistory.unshift(text);
        // Limit to 20 items
        if (this.settings.clipboardHistory.length > 20) {
            this.settings.clipboardHistory.pop();
        }
        await this.saveSettings();
    }

    stopServer() {
        if (this.server) { this.server.close(); this.server = null; }
        this.isServerRunning = false;
    }

    async loadSettings() { this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData()); }
    async saveSettings() { await this.saveData(this.settings); }

    getWebInterfaceHTML() {
        const i18nScript = `
			const I18N = {
				title: "${t('web_title')}",
				import: "${t('web_import')}",
				new: "${t('web_new')}",
				search: "${t('web_search')}",
				empty: "${t('web_empty')}",
				download: "${t('web_download')}",
				save: "${t('web_save')}",
				close: "${t('web_close')}",
				uploading: "${t('web_toast_uploading')}",
				success: "${t('web_toast_success')}",
				saved: "${t('web_toast_saved')}",
				failed: "${t('web_toast_failed')}",
                deleted: "${t('web_toast_deleted')}",
				clipboard: "${t('web_toast_clipboard')}",
				copyToast: "${t('web_clipboard_copy_toast')}",
                archiveToast: "${t('web_clipboard_archive_toast')}",
                expand: "${t('web_clipboard_expand')}",
                collapse: "${t('web_clipboard_collapse')}",
                rename: "${t('rename')}",
                delete: "${t('delete')}",
                copy: "${t('copy')}",
                edit: "${t('edit')}",
                confirmDelete: "${t('confirmDelete')}",
                parentFolder: "${t('parentFolder')}",
				connecting: "${t('web_connecting')}",
				disconnect: "${t('web_disconnect')}"
			};
		`;

        return `<!DOCTYPE html><html lang="zh"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no,viewport-fit=cover"><title>${t('web_title')}</title><style>:root{--bg:#f5f5f7;--card:#ffffff;--text:#1d1d1f;--subtext:#86868b;--border:#d2d2d7;--accent:#007aff;--danger:#ff3b30;--header-bg:rgba(255,255,255,0.8)}body.dark-mode{--bg:#000000;--card:#1c1c1e;--text:#f5f5f7;--subtext:#86868b;--border:#38383a;--accent:#0a84ff;--danger:#ff453a;--header-bg:rgba(28,28,30,0.8)}body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:var(--bg);color:var(--text);margin:0;display:flex;flex-direction:column;height:100vh;overflow:hidden;transition:background .3s}header{background:var(--header-bg);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:10px 16px;padding-top:max(10px, env(safe-area-inset-top));display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);z-index:10}h1{margin:0;font-size:16px;font-weight:600}.btn{background:0 0;border:none;color:var(--accent);font-size:15px;font-weight:500;cursor:pointer;padding:6px 10px;border-radius:6px;transition:.2s}.btn:active{background:rgba(0,0,0,.05);transform:scale(.96)}body.dark-mode .btn:active{background:rgba(255,255,255,.1)}.btn-icon{font-size:18px;padding:4px 8px}.search-box{padding:10px 16px;background:var(--bg);position:sticky;top:0;display:flex;flex-direction:column;gap:8px;z-index:5;}input[type=text]{width:100%;padding:8px 12px;border-radius:10px;border:none;background:rgba(118,118,128,.12);color:var(--text);font-size:16px;box-sizing:border-box;outline:none;text-align:center;transition:.2s}input[type=text]:focus{text-align:left;background:var(--card);box-shadow:0 0 0 1px var(--accent)}#file-list{flex:1;overflow-y:auto;padding:0 16px 20px 16px;list-style:none;margin:0}.file-item{background:var(--card);padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;cursor:pointer}.file-item:first-child{border-top-left-radius:12px;border-top-right-radius:12px}.file-item:last-child{border-bottom-left-radius:12px;border-bottom-right-radius:12px;border-bottom:none}.file-name{flex:1;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.file-arrow{color:var(--subtext);font-size:18px;margin-left:10px;opacity:.5}#editor{position:fixed;top:0;left:0;width:100%;height:100%;background:var(--bg);z-index:20;display:flex;flex-direction:column;transform:translateX(100%);transition:transform .3s cubic-bezier(.32,.72,0,1)}#editor.open{transform:translateX(0)}.editor-toolbar{background:var(--header-bg);border-bottom:1px solid var(--border);padding:10px 16px;display:flex;justify-content:space-between;align-items:center}.editor-btn-group{display:flex;gap:10px}.btn-save{background:#34c759;color:#fff;padding:6px 14px;border-radius:16px;font-weight:600}.btn-down{background:#007aff;color:#fff;padding:6px 14px;border-radius:16px;font-weight:600}textarea{flex:1;padding:20px;font-size:17px;line-height:1.6;border:none;background:var(--bg);color:var(--text);resize:none;outline:none;font-family:-apple-system,monospace}#upload-input{display:none}.toast{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(.9);background:rgba(50,50,50,.9);color:#fff;padding:16px 24px;border-radius:14px;font-size:16px;font-weight:600;opacity:0;pointer-events:none;transition:all .2s;z-index:100;backdrop-filter:blur(10px)}.toast.show{opacity:1;transform:translate(-50%,-50%) scale(1)}
		/* New Clipboard Style */
		.clipboard-row { display: flex; gap: 8px; margin-bottom: 5px; }
		.clipboard-row input { flex: 1; text-align: left; }
		.clipboard-btn { background: var(--card); color: var(--accent); font-weight: 600; padding: 0 12px; border-radius: 10px; border:none; cursor: pointer; white-space: nowrap; }
        .history-title { font-size: 13px; color: var(--subtext); margin: 8px 4px 4px 4px; font-weight: 500; display:flex; justify-content:space-between; align-items:center; }
        .history-item { font-size: 14px; color: var(--text); padding: 12px; background: var(--card); border-radius: 10px; margin-bottom: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.05); display: flex; flex-direction: column; gap: 8px; }
        .history-content { word-break: break-all; line-height: 1.4; max-height: 60px; overflow: hidden; text-overflow: ellipsis; display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; }
        .history-actions { display: flex; justify-content: flex-end; gap: 8px; border-top: 1px solid var(--border); padding-top: 8px; opacity: 0.8; }
        .action-btn { background: none; border: none; font-size: 13px; cursor: pointer; padding: 4px 8px; border-radius: 6px; display: flex; align-items: center; gap: 4px; color: var(--subtext); transition: .2s; }
        .action-btn:active { background: rgba(0,0,0,0.05); }
        .action-btn.copy { color: var(--accent); }
        .action-btn.archive { color: #34c759; }
        .action-btn.delete { color: var(--danger); }
        #history-expand-btn { width: 100%; text-align: center; padding: 8px; color: var(--subtext); font-size: 13px; cursor: pointer; display: none; }
		</style></head><body><input type="file" id="upload-input" multiple><header><div style="display:flex;gap:5px;align-items:center"><button class="btn" onclick="triggerUpload()">${t('web_import')}</button><button class="btn btn-icon" onclick="refreshList()" title="Refresh">↻</button></div><h1 id="page-title">${t('web_title')}</h1><div style="display:flex;gap:5px"><button class="btn btn-icon" onclick="toggleTheme()" title="Theme">◑</button><button class="btn" onclick="openEditor('','')">${t('web_new')}</button></div></header>
		<div class="search-box">
			<div class="clipboard-row">
				<input type="text" id="clipboard-input" placeholder="${t('web_clipboard_placeholder')}">
				<button class="clipboard-btn" onclick="sendClipboard()">${t('web_clipboard_btn')}</button>
			</div>
            <div class="history-title">
                <span>${t('web_clipboard_title')}</span>
                <span onclick="fetchClipboard()" style="color:var(--accent);cursor:pointer;font-size:12px;">${t('web_clipboard_pull')}</span>
            </div>
            
            <div id="clipboard-history"></div>
            <div id="history-expand-btn" onclick="toggleHistoryExpand()">⬇ ${t('web_clipboard_expand')}</div>

			<input type="text" id="search" placeholder="${t('web_search')}" oninput="filterFiles()" style="margin-top:10px;">
		</div>
		<ul id="file-list"></ul><div id="editor"><div class="editor-toolbar"><button class="btn" onclick="closeEditor()">${t('web_close')}</button><span style="font-weight:600;font-size:15px;max-width:120px;overflow:hidden;white-space:nowrap" id="current-filename">${t('web_new')}</span><div class="editor-btn-group"><button class="btn btn-down" onclick="downloadFile()">${t('web_download')}</button><button class="btn btn-save" onclick="saveFile()">${t('web_save')}</button></div></div><input type="text" id="filename-input" placeholder="Filename" style="margin:10px 16px;width:calc(100% - 32px);padding:12px;border-radius:10px;border:none;background:rgba(128,128,128,.1);color:var(--text);font-size:16px;display:none;outline:none"><textarea id="file-content"></textarea></div><div class="toast" id="toast"></div><script>${i18nScript} let allFiles=[],currentFile="",historyExpanded=!1,fullHistory=[];"dark"===localStorage.getItem("theme")&&document.body.classList.add("dark-mode"),refreshList();fetchClipboard();function toggleTheme(){document.body.classList.toggle("dark-mode");const e=document.body.classList.contains("dark-mode");localStorage.setItem("theme",e?"dark":"light")}function refreshList(){const e=document.getElementById("file-list");e.innerHTML='<li style="text-align:center; padding:20px; color:var(--subtext);">'+I18N.connecting+'</li>',fetch("/api/list").then(e=>e.json()).then(t=>{allFiles=t,renderFiles(t)}).catch(()=>{e.innerHTML='<li style="text-align:center; padding:20px; color:red;">'+I18N.disconnect+'</li>'})}



        let currentFolder = "/";

        function renderFiles(fileList) {
            const listEl = document.getElementById("file-list");
            listEl.innerHTML = "";
            
            if (fileList.length === 0) {
                listEl.innerHTML = '<li style="text-align:center; padding:40px; color:var(--subtext);">' + I18N.empty + '</li>';
                return;
            }

            // Filter by current folder
            const visibleFiles = fileList.filter(f => {
                // If root, find files with parent === '/' or ''
                const p = f.parent === "/" ? "" : f.parent;
                const c = currentFolder === "/" ? "" : currentFolder;
                return p === c && f.path !== c; // specific check to not show self if self is folder
            });
            
            // Add Parent Folder Item if not root
            if (currentFolder !== "/") {
                const parentItem = document.createElement("div");
                parentItem.className = "file-item";
                parentItem.onclick = () => {
                    // Go up
                    const parts = currentFolder.split('/');
                    parts.pop();
                    currentFolder = parts.length === 0 || (parts.length === 1 && parts[0] === "") ? "/" : parts.join('/');
                    renderFiles(allFiles);
                };
                parentItem.innerHTML = '<span class="file-name" style="font-weight:bold">🔙 ' + I18N.parentFolder + '</span>';
                listEl.appendChild(parentItem);
            }

            const container = document.createElement("div");
            container.style.marginTop = "10px";
            
            visibleFiles.forEach(f => {
                const t = document.createElement("div");
                t.className = "file-item";

                // Icon based on type
                const ext = f.name.split('.').pop().toLowerCase();
                let icon = f.isDir ? "📂" : "📄";
                if (!f.isDir) {
                    if (['png','jpg','jpeg','gif','webp','svg'].includes(ext)) icon = "🖼️";
                    else if (['mp3','wav','ogg'].includes(ext)) icon = "🎵";
                    else if (['mp4','webm'].includes(ext)) icon = "🎬";
                    else if (['pdf'].includes(ext)) icon = "📑";
                    else if (['xls','xlsx','csv'].includes(ext)) icon = "📊";
                    else if (['doc','docx'].includes(ext)) icon = "📝";
                    else if (['zip','rar','7z'].includes(ext)) icon = "📦";
                }

                // Name Area (Clickable)
                const nameSpan = document.createElement("span");
                nameSpan.className = "file-name";
                nameSpan.innerHTML = icon + ' ' + f.name;
                nameSpan.onclick = () => {
                    if (f.isDir) {
                        currentFolder = f.path;
                        renderFiles(allFiles);
                    } else {
                        if (ext === 'md') loadFile(f.path);
                        else showToast(I18N.error + ": Not supported on web");
                    }
                };

                // Actions Area
                const actionsSpan = document.createElement("span");
                actionsSpan.className = "file-actions";
                actionsSpan.style.display = "flex";
                actionsSpan.style.gap = "10px";

                if (!f.isDir) {
                    // Rename Btn
                    const renameBtn = document.createElement("span");
                    renameBtn.innerText = "✏️";
                    renameBtn.style.cursor = "pointer";
                    renameBtn.style.opacity = "0.6";
                    renameBtn.title = I18N.rename;
                    renameBtn.onclick = (evt) => { evt.stopPropagation(); renameFile(f.path); };

                    // Download Btn
                    const downloadBtn = document.createElement("span");
                    downloadBtn.innerText = "⬇️";
                    downloadBtn.style.cursor = "pointer";
                    downloadBtn.style.opacity = "0.6";
                    downloadBtn.title = I18N.download;
                    downloadBtn.onclick = (evt) => { evt.stopPropagation(); downloadFile(f.path); };

                    // Delete Btn
                    const delBtn = document.createElement("span");
                    delBtn.innerText = "🗑️";
                    delBtn.style.cursor = "pointer";
                    delBtn.style.opacity = "0.6";
                    delBtn.className = "delete-btn";
                    delBtn.title = I18N.delete;
                    delBtn.onclick = (evt) => { evt.stopPropagation(); deleteFile(f.path); };

                    actionsSpan.appendChild(renameBtn);
                    actionsSpan.appendChild(downloadBtn);
                    actionsSpan.appendChild(delBtn);
                }

                t.appendChild(nameSpan);
                t.appendChild(actionsSpan);
                container.appendChild(t);
            });
            listEl.appendChild(container);
        }

async function renameFile(oldPath) {
    const newName = prompt(I18N.rename + ':', pathBasename(oldPath));
    if (!newName || newName === pathBasename(oldPath)) return;
    try {
        const res = await fetch("/api/rename", { method: "POST", body: JSON.stringify({ oldPath, newName }) });
        if (res.ok) { showToast(I18N.success); refreshList(); } else showToast(I18N.failed);
    } catch (e) { showToast(I18N.failed); }
}

async function copyFile(oldPath) {
    const base = pathBasename(oldPath);
    // Default name: name_copy.ext
    const parts = base.split('.');
    let ext = '';
    let name = base;
    if (parts.length > 1) {
        ext = '.' + parts.pop();
        name = parts.join('.');
    }
    const defaultName = name + "_copy" + ext;

    const newName = prompt(I18N.copy + ':', defaultName);
    if (!newName) return;

    try {
        const res = await fetch("/api/copy", { method: "POST", body: JSON.stringify({ oldPath, newName }) });
        if (res.ok) { showToast(I18N.success); refreshList(); } else showToast(I18N.failed);
    } catch (e) { showToast(I18N.failed); }
}

async function deleteFile(path) {
    if (!confirm(I18N.confirmDelete + "\\n" + path)) return;
    try {
        const res = await fetch("/api/delete", { method: "POST", body: JSON.stringify({ path }) });
        if (res.ok) { showToast(I18N.deleted); refreshList(); } else showToast(I18N.failed);
    } catch (e) { showToast(I18N.failed); }
}

function pathBasename(path) {
    return path.split('/').pop();
}

// ... existing functions ...
function filterFiles() {
    const searchVal = document.getElementById("search").value.toLowerCase();
    if (!searchVal) {
        renderFiles(allFiles); 
        return;
    }
    // Search mode: Filter allFiles
    const filtered = allFiles.filter(f => f.path.toLowerCase().includes(searchVal));
    // Render these as flat list
    const listEl = document.getElementById("file-list");
    listEl.innerHTML = "";
    const container = document.createElement("div");
    container.style.marginTop = "10px";
    filtered.forEach(f => {
        const t = document.createElement("div");
        t.className = "file-item";
        
        const ext = f.name.split('.').pop().toLowerCase();
        let icon = f.isDir ? "📂" : "📄";
        if (!f.isDir) {
            if (['png','jpg','jpeg','gif','webp','svg'].includes(ext)) icon = "🖼️";
            else if (['mp3','wav','ogg'].includes(ext)) icon = "🎵";
            else if (['mp4','webm'].includes(ext)) icon = "🎬";
            else if (['pdf'].includes(ext)) icon = "📑";
            else if (['xls','xlsx','csv'].includes(ext)) icon = "📊";
            else if (['doc','docx'].includes(ext)) icon = "📝";
            else if (['zip','rar','7z'].includes(ext)) icon = "📦";
        }

        t.onclick = () => { 
            if (f.isDir) { 
                currentFolder = f.path; 
                document.getElementById("search").value = ""; 
                renderFiles(allFiles); 
            } else { 
                if (ext === 'md') loadFile(f.path);
                else showToast(I18N.error + ": Not supported on web");
            } 
        };
        t.innerHTML = '<span class="file-name">' + icon + ' ' + f.path + '</span>'; // Show full path in search
        container.appendChild(t);
    });
    listEl.appendChild(container);
}


        function triggerUpload() { document.getElementById("upload-input").click(); }
        
        async function loadFile(e) { 
            currentFile = e; 
            document.getElementById("current-filename").innerText = e; 
            document.getElementById("filename-input").style.display = "none"; 
            
            // Only support MD
            const textEl = document.getElementById("file-content");
            textEl.style.display = "block";
            
            try {
                textEl.value = I18N.connecting || "Loading...";
                const t = await fetch("/api/get?file=" + encodeURIComponent(e)); 
                if (t.ok) textEl.value = await t.text();
                else textEl.value = "Error loading file";
            } catch(err) { textEl.value = "Error loading file"; }
            
            document.getElementById("editor").classList.add("open"); 
        }

        function openEditor(name, content) { 
            currentFile = ""; 
            document.getElementById("current-filename").innerText = I18N.new; 
            document.getElementById("filename-input").style.display = "block"; 
            document.getElementById("filename-input").value = name || ""; 
            
            const textEl = document.getElementById("file-content");
            textEl.style.display = "block";
            textEl.value = content || ""; 
            
            document.getElementById("editor").classList.add("open"); 
            setTimeout(() => document.getElementById("filename-input").focus(), 300); 
        }
        function closeEditor() { document.getElementById("editor").classList.remove("open"); document.getElementById("filename-input").blur(); document.getElementById("file-content").blur(); }
        async function saveFile() { let e = currentFile; const content = document.getElementById("file-content").value; 
            if (!e) { e = document.getElementById("filename-input").value; if (!e) return alert(I18N.error); }
            if (!e.endsWith(".md")) e += ".md"; 
            try {
                const res = await fetch("/api/save", { method: "POST", body: JSON.stringify({ filename: e, content: content }) }); 
                if (res.ok) { showToast(I18N.saved); if (!currentFile) { currentFile = e; refreshList(); closeEditor(); } } else showToast(I18N.failed); 
            } catch (err) { showToast(I18N.failed); }
        }
        function downloadFile(file) { 
            const target = file || currentFile;
            if (!target) return;
            const e = document.createElement("a"); 
            e.href = "/api/download?file=" + encodeURIComponent(target); 
            e.download = target.split('/').pop(); 
            document.body.appendChild(e); 
            e.click(); 
            document.body.removeChild(e); 
        }
        function showToast(e) { const t = document.getElementById("toast"); t.innerText = e; t.classList.add("show"); setTimeout(() => t.classList.remove("show"), 2000); }
        document.getElementById("upload-input").onchange = async e => { const t = e.target.files; if (!t.length) return; showToast(I18N.uploading); for (const f of t) await fetch("/api/upload?name=" + encodeURIComponent(f.name), { method: "POST", body: f }); showToast(I18N.success); refreshList(); e.target.value = ""; };

// [v2 Feature] Clipboard Function
async function sendClipboard() {
    const input = document.getElementById('clipboard-input');
    const text = input.value;
    if (!text) return;
    try {
        const res = await fetch("/api/clipboard", { method: "POST", body: JSON.stringify({ text }) });
        if (res.ok) { showToast(I18N.clipboard); input.value = ""; fetchClipboard(); }
        else { showToast(I18N.failed); }
    } catch (e) { showToast(I18N.failed); }
}
async function fetchClipboard() {
    try {
        const res = await fetch("/api/clipboard");
        const data = await res.json();
        fullHistory = data.history;
        renderHistory();
    } catch (e) { }
}
function toggleHistoryExpand() {
    historyExpanded = !historyExpanded;
    renderHistory();
}
function renderHistory() {
    const el = document.getElementById('clipboard-history');
    const btn = document.getElementById('history-expand-btn');
    el.innerHTML = '';

    if (fullHistory.length === 0) {
        btn.style.display = 'none';
        return;
    }

    const displayList = historyExpanded ? fullHistory : fullHistory.slice(0, 1);
    btn.style.display = fullHistory.length > 1 ? 'block' : 'none';
    btn.innerText = historyExpanded ? '⬆ ' + I18N.collapse : '⬇ ' + I18N.expand;

    displayList.forEach(txt => {
        const item = document.createElement('div');
        item.className = 'history-item';

        const content = document.createElement('div');
        content.className = 'history-content';
        content.innerText = txt;

        const actions = document.createElement('div');
        actions.className = 'history-actions';

        const btnCopy = document.createElement('button');
        btnCopy.className = 'action-btn copy';
        btnCopy.innerText = '📋 Copy';
        btnCopy.onclick = (e) => {
            e.stopPropagation();
            copyTextToClipboard(txt);
        };

        const btnArchive = document.createElement('button');
        btnArchive.className = 'action-btn archive';
        btnArchive.innerText = '💾 Archive';
        btnArchive.onclick = async (e) => {
            e.stopPropagation();
            try {
                const res = await fetch("/api/clipboard/archive", { method: "POST", body: JSON.stringify({ text: txt }) });
                if (res.ok) showToast(I18N.archiveToast);
                else showToast(I18N.failed);
            } catch (e) { showToast(I18N.failed); }
        };

        const btnDel = document.createElement('button');
        btnDel.className = 'action-btn delete';
        btnDel.innerText = '🗑️';
        btnDel.onclick = async (e) => {
            e.stopPropagation();
            if (!confirm('Delete?')) return;
            try {
                const res = await fetch("/api/clipboard", { method: "POST", body: JSON.stringify({ text: txt, action: 'delete' }) });
                if (res.ok) { showToast(I18N.deleted); fetchClipboard(); }
                else showToast(I18N.failed);
            } catch (e) { showToast(I18N.failed); }
        };

        actions.appendChild(btnCopy);
        actions.appendChild(btnArchive);
        actions.appendChild(btnDel);

        item.appendChild(content);
        item.appendChild(actions);
        el.appendChild(item);
    });
}
function copyTextToClipboard(text) {
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(() => showToast(I18N.copyToast)).catch(() => fallbackCopy(text));
    } else {
        fallbackCopy(text);
    }
}
function fallbackCopy(text) {
    const textArea = document.createElement("textarea");
    textArea.value = text;
    textArea.style.position = "fixed";
    textArea.style.left = "-9999px";
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    try {
        document.execCommand('copy');
        showToast(I18N.copyToast);
    } catch (err) {
        showToast(I18N.failed);
    }
    document.body.removeChild(textArea);
}
</script></body > </html>`;
    }
}

class LanEditorSettingTab extends PluginSettingTab {
    plugin: LanEditorPlugin;
    constructor(app: App, plugin: LanEditorPlugin) { super(app, plugin); this.plugin = plugin; }

    display(): void {
        const { containerEl } = this; containerEl.empty();

        const isRunning = this.plugin.isServerRunning;
        const ip = this.plugin.getLocalIP();
        const port = this.plugin.settings.port;
        const webUrl = `http://${ip}:${port}`;

        const statusCard = containerEl.createDiv({ cls: 'airportal-status-card' });
        const statusDot = statusCard.createSpan({ cls: 'airportal-status-dot ' + (isRunning ? 'running' : 'stopped') });

        new Setting(statusCard)
            .setName(isRunning ? t('status_running') : t('status_stopped'))
            .setHeading();

        if (isRunning) statusCard.createEl('div', { text: `URL: ${webUrl}`, cls: 'airportal-server-url' });

        const toggleBtn = statusCard.createEl('button', { cls: 'airportal-toggle-btn' });
        toggleBtn.innerText = isRunning ? t('btn_stop') : t('btn_start');
        toggleBtn.addClass(isRunning ? 'mod-warning' : 'mod-cta');

        toggleBtn.onclick = async () => {
            toggleBtn.innerText = t('btn_processing'); toggleBtn.disabled = true;
            if (isRunning) {
                this.plugin.stopServer();
            } else {
                const success = await this.plugin.startServer();
                if (!success) toggleBtn.innerText = t('start_failed');
            }
            this.display();
        };

        if (isRunning) {
            const connectSection = containerEl.createDiv({ cls: 'airportal-connect-section' });
            QRCode.toDataURL(webUrl).then((qrDataUrl: string) => {
                const qrImg = connectSection.createEl('img', { cls: 'airportal-qr-img' });
                qrImg.src = qrDataUrl;
                qrImg.width = 150;
            }).catch(() => { });

            connectSection.createEl('p', { text: t('scan_qr'), cls: 'airportal-scan-hint' });
        }

        containerEl.createEl('hr');

        new Setting(containerEl).setName(t('guide_title')).setHeading();

        const guide = containerEl.createDiv({ cls: 'airportal-guide-text' });

        const steps = [
            '▶ ' + t('guide_1'),
            '📶 ' + t('guide_2'),
            '📱 ' + t('guide_3'),
            '📂 ' + t('guide_4')
        ];
        steps.forEach(s => guide.createEl('p', { text: s, cls: 'airportal-guide-step' }));

        const warningBox = containerEl.createDiv({ cls: 'airportal-warning-box' });
        warningBox.createEl('strong', { text: t('risk_warning') });
        warningBox.createEl('span', { text: ' ' + t('risk_desc') });
        warningBox.createEl('strong', { text: t('risk_desc_strong'), cls: 'airportal-risk-strong' });
        warningBox.createEl('span', { text: '。' });

        const disclaimer = containerEl.createDiv({ cls: 'airportal-disclaimer' });
        disclaimer.createEl('p', { text: t('risk_footer') });

        containerEl.createEl('hr');

        new Setting(containerEl).setName('⚙️ Settings').setHeading();

        new Setting(containerEl).setName(t('setting_port')).setDesc(t('setting_port_desc')).addText(text => text.setValue(String(this.plugin.settings.port)).onChange(async v => { this.plugin.settings.port = Number(v); await this.plugin.saveSettings(); }))
            .addButton(btn => btn.setButtonText(t('btn_save_restart')).setCta().onClick(async () => { this.plugin.stopServer(); await this.plugin.startServer(); this.display(); }));

        new Setting(containerEl).setName(t('setting_ip')).setDesc(t('setting_ip_desc')).addText(text => text.setValue(this.plugin.settings.manualIP).onChange(async v => { this.plugin.settings.manualIP = v; await this.plugin.saveSettings(); }))
            .addButton(btn => btn.setButtonText(t('btn_update_ip')).onClick(() => { this.display(); }));

        containerEl.createEl('hr');
        const authorSection = containerEl.createDiv({ cls: 'airportal-author-section' });
        authorSection.createEl('span', { text: t('author') + ' ' });
        const link = authorSection.createEl('a', { text: t('github'), href: 'https://github.com/zyshunyx-lang/obsidian-air-portal', cls: 'airportal-github-link' });
        authorSection.createEl('p', { text: '如果觉得好用，请给个 Star ⭐', cls: 'airportal-star-text' });
    }
}