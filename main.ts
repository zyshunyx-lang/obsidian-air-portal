import { App, Plugin, PluginSettingTab, Setting, Notice, addIcon, TFile } from 'obsidian';
import * as http from 'http';
import * as os from 'os';
import * as fs from 'fs';
import * as path from 'path';
// [Fix 1] Forbidden require() -> import
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
        
        // [Fix 9] Sentence case for UI text (Optional adjustment in translation keys)
        setting_port: '服务端口 (Server port)',
        setting_port_desc: '默认为 27123。',
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
        web_empty: '电脑上没有笔记',
        web_download: '下载',
        web_save: '保存',
        web_close: '关闭',
        web_toast_uploading: '正在上传...',
        web_toast_success: '✅ 导入成功',
        web_toast_saved: '✅ 已保存到电脑',
        web_toast_failed: '❌ 失败',
        web_connecting: '正在连接 AirPortal...',
        web_disconnect: '连接断开'
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
        btn_update_ip: 'Update view',
        
        author: 'Developed by: Obsidian Fan',
        github: 'GitHub / Issues',
        zyshunyx: 'zyshunyx',

        web_title: 'AirPortal',
        web_import: 'Import',
        web_new: 'New Note',
        web_search: 'Search notes...',
        web_empty: 'No notes found',
        web_download: 'Download',
        web_save: 'Save',
        web_close: 'Close',
        web_toast_uploading: 'Uploading...',
        web_toast_success: '✅ Import Success',
        web_toast_saved: '✅ Saved to PC',
        web_toast_failed: '❌ Failed',
        web_connecting: 'Connecting to AirPortal...',
        web_disconnect: 'Disconnected'
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

interface LanEditorSettings { port: number; manualIP: string; }
const DEFAULT_SETTINGS: LanEditorSettings = { port: 27123, manualIP: '' }

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
        // [Fix 3] Promise must be awaited or marked as void
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
                    // [Fix 3] Handle async promise
					void this.handleRequest(req, res, vaultPath);
				});

				this.server.listen(this.settings.port, () => {
					this.isServerRunning = true;
					new Notice(t('server_started', this.settings.port));
					resolve(true);
				});

                // [Fix 2] Unexpected any -> Error
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
			const files = this.app.vault.getMarkdownFiles().map(f => f.path);
			files.sort((a, b) => {
				const fa = this.app.vault.getAbstractFileByPath(a);
				const fb = this.app.vault.getAbstractFileByPath(b);
                const ta = fa instanceof TFile ? fa.stat.mtime : 0;
                const tb = fb instanceof TFile ? fb.stat.mtime : 0;
				return tb - ta;
			});
			res.writeHead(200, { 'Content-Type': 'application/json' });
			res.end(JSON.stringify(files));
			return;
		}

		if (pathname === '/api/get') {
			const filename = url.searchParams.get('file');
			const file = this.app.vault.getAbstractFileByPath(filename || '');
			if (file instanceof TFile) {
				const content = await this.app.vault.read(file);
				res.writeHead(200, { 'Content-Type': 'text/plain; charset=utf-8' });
				res.end(content);
			} else { res.writeHead(404); res.end(); }
			return;
		}

		if (pathname === '/api/save' && req.method === 'POST') {
			let body = '';
			req.on('data', chunk => body += chunk);
			req.on('end', async () => {
				try {
					const { filename, content } = JSON.parse(body);
					const safeName = filename.replace(/\.\./g, ''); 
					let file = this.app.vault.getAbstractFileByPath(safeName);
					if (file instanceof TFile) await this.app.vault.modify(file, content);
					else await this.app.vault.create(safeName, content);
					res.writeHead(200); res.end('Saved');
				} catch (e) { res.writeHead(500); res.end('Error'); }
			});
			return;
		}

		if (pathname === '/api/upload' && req.method === 'POST') {
			const rawName = url.searchParams.get('name') || 'uploaded.md';
			const fileName = decodeURIComponent(rawName);
			const safeName = path.basename(fileName);
			const filePath = path.join(vaultPath, safeName);
			const writeStream = fs.createWriteStream(filePath);
			req.pipe(writeStream);
			req.on('end', () => {
				res.writeHead(200); res.end('OK');
				// @ts-ignore
				setTimeout(() => this.app.vault.adapter.reconcileFileCreation(safeName), 500);
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

    // [Fix 4] Async method has no await -> removed async
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
				connecting: "${t('web_connecting')}",
				disconnect: "${t('web_disconnect')}"
			};
		`;

		return `<!DOCTYPE html><html lang="zh"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no"><title>${t('web_title')}</title><style>:root{--bg:#f5f5f7;--card:#ffffff;--text:#1d1d1f;--subtext:#86868b;--border:#d2d2d7;--accent:#007aff;--header-bg:rgba(255,255,255,0.8)}body.dark-mode{--bg:#000000;--card:#1c1c1e;--text:#f5f5f7;--subtext:#86868b;--border:#38383a;--accent:#0a84ff;--header-bg:rgba(28,28,30,0.8)}body{font-family:-apple-system,BlinkMacSystemFont,sans-serif;background:var(--bg);color:var(--text);margin:0;display:flex;flex-direction:column;height:100vh;overflow:hidden;transition:background .3s}header{background:var(--header-bg);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);padding:10px 16px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--border);z-index:10}h1{margin:0;font-size:16px;font-weight:600}.btn{background:0 0;border:none;color:var(--accent);font-size:15px;font-weight:500;cursor:pointer;padding:6px 10px;border-radius:6px;transition:.2s}.btn:active{background:rgba(0,0,0,.05);transform:scale(.96)}body.dark-mode .btn:active{background:rgba(255,255,255,.1)}.btn-icon{font-size:18px;padding:4px 8px}.search-box{padding:10px 16px;background:var(--bg);position:sticky;top:0}input[type=text]{width:100%;padding:8px 12px;border-radius:10px;border:none;background:rgba(118,118,128,.12);color:var(--text);font-size:16px;box-sizing:border-box;outline:none;text-align:center;transition:.2s}input[type=text]:focus{text-align:left;background:var(--card);box-shadow:0 0 0 1px var(--accent)}#file-list{flex:1;overflow-y:auto;padding:0 16px 20px 16px;list-style:none;margin:0}.file-item{background:var(--card);padding:14px 16px;border-bottom:1px solid var(--border);display:flex;align-items:center;cursor:pointer}.file-item:first-child{border-top-left-radius:12px;border-top-right-radius:12px}.file-item:last-child{border-bottom-left-radius:12px;border-bottom-right-radius:12px;border-bottom:none}.file-name{flex:1;font-size:16px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.file-arrow{color:var(--subtext);font-size:18px;margin-left:10px;opacity:.5}#editor{position:fixed;top:0;left:0;width:100%;height:100%;background:var(--bg);z-index:20;display:flex;flex-direction:column;transform:translateX(100%);transition:transform .3s cubic-bezier(.32,.72,0,1)}#editor.open{transform:translateX(0)}.editor-toolbar{background:var(--header-bg);border-bottom:1px solid var(--border);padding:10px 16px;display:flex;justify-content:space-between;align-items:center}.editor-btn-group{display:flex;gap:10px}.btn-save{background:#34c759;color:#fff;padding:6px 14px;border-radius:16px;font-weight:600}.btn-down{background:#007aff;color:#fff;padding:6px 14px;border-radius:16px;font-weight:600}textarea{flex:1;padding:20px;font-size:17px;line-height:1.6;border:none;background:var(--bg);color:var(--text);resize:none;outline:none;font-family:-apple-system,monospace}#upload-input{display:none}.toast{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%) scale(.9);background:rgba(50,50,50,.9);color:#fff;padding:16px 24px;border-radius:14px;font-size:16px;font-weight:600;opacity:0;pointer-events:none;transition:all .2s;z-index:100;backdrop-filter:blur(10px)}.toast.show{opacity:1;transform:translate(-50%,-50%) scale(1)}</style></head><body><input type="file" id="upload-input" multiple><header><div style="display:flex;gap:5px"><button class="btn" onclick="triggerUpload()">${t('web_import')}</button><button class="btn btn-icon" onclick="refreshList()" title="Refresh">↻</button></div><h1 id="page-title">${t('web_title')}</h1><div style="display:flex;gap:5px"><button class="btn btn-icon" onclick="toggleTheme()" title="Theme">◑</button><button class="btn" onclick="openEditor('','')">${t('web_new')}</button></div></header><div class="search-box"><input type="text" id="search" placeholder="${t('web_search')}" oninput="filterFiles()"></div><ul id="file-list"></ul><div id="editor"><div class="editor-toolbar"><button class="btn" onclick="closeEditor()">${t('web_close')}</button><span style="font-weight:600;font-size:15px;max-width:120px;overflow:hidden;white-space:nowrap" id="current-filename">${t('web_new')}</span><div class="editor-btn-group"><button class="btn btn-down" onclick="downloadFile()">${t('web_download')}</button><button class="btn btn-save" onclick="saveFile()">${t('web_save')}</button></div></div><input type="text" id="filename-input" placeholder="Filename" style="margin:10px 16px;padding:12px;border-radius:10px;border:none;background:rgba(128,128,128,.1);color:var(--text);font-size:16px;display:none;outline:none"><textarea id="file-content"></textarea></div><div class="toast" id="toast"></div><script>${i18nScript} let allFiles=[],currentFile="";"dark"===localStorage.getItem("theme")&&document.body.classList.add("dark-mode"),refreshList();function toggleTheme(){document.body.classList.toggle("dark-mode");const e=document.body.classList.contains("dark-mode");localStorage.setItem("theme",e?"dark":"light")}function refreshList(){const e=document.getElementById("file-list");e.innerHTML='<li style="text-align:center; padding:20px; color:var(--subtext);">'+I18N.connecting+'</li>',fetch("/api/list").then(e=>e.json()).then(t=>{allFiles=t,renderFiles(t)}).catch(()=>{e.innerHTML='<li style="text-align:center; padding:20px; color:red;">'+I18N.disconnect+'</li>'})}function renderFiles(e){const t=document.getElementById("file-list");if(t.innerHTML="",0===e.length){t.innerHTML='<li style="text-align:center; padding:40px; color:var(--subtext);">'+I18N.empty+'</li>';return}const n=document.createElement("div");n.style.marginTop="10px";e.slice(0,100).forEach(e=>{const t=document.createElement("div");t.className="file-item",t.onclick=()=>loadFile(e),t.innerHTML=\`<span class="file-name">\${e}</span><span class="file-arrow">›</span>\`,n.appendChild(t)}),t.appendChild(n)}function filterFiles(){const e=document.getElementById("search").value.toLowerCase();renderFiles(allFiles.filter(t=>t.toLowerCase().includes(e)))}function triggerUpload(){document.getElementById("upload-input").click()}async function loadFile(e){currentFile=e,document.getElementById("current-filename").innerText=e,document.getElementById("filename-input").style.display="none";const t=await fetch("/api/get?file="+encodeURIComponent(e));document.getElementById("file-content").value=await t.text(),document.getElementById("editor").classList.add("open")}function openEditor(){currentFile="",document.getElementById("current-filename").innerText=I18N.new,document.getElementById("filename-input").style.display="block",document.getElementById("filename-input").value="",document.getElementById("file-content").value="",document.getElementById("editor").classList.add("open"),setTimeout(()=>document.getElementById("filename-input").focus(),300)}function closeEditor(){document.getElementById("editor").classList.remove("open"),document.getElementById("filename-input").blur(),document.getElementById("file-content").blur()}async function saveFile(){let e=currentFile;const t=document.getElementById("file-content").value;if(!e&&(e=document.getElementById("filename-input").value,!e))return alert(I18N.error);e.endsWith(".md")||(e+=".md");const n=await fetch("/api/save",{method:"POST",body:JSON.stringify({filename:e,content:t})});n.ok?(showToast(I18N.saved),currentFile||(currentFile=e,refreshList(),closeEditor())):showToast(I18N.failed)}function downloadFile(){if(!currentFile)return;const e=document.createElement("a");e.href="/api/download?file="+encodeURIComponent(currentFile),e.download=currentFile,document.body.appendChild(e),e.click(),document.body.removeChild(e)}function showToast(e){const t=document.getElementById("toast");t.innerText=e,t.classList.add("show"),setTimeout(()=>t.classList.remove("show"),2e3)}document.getElementById("upload-input").onchange=async e=>{const t=e.target.files;if(!t.length)return;showToast(I18N.uploading);for(const e of t)await fetch("/api/upload?name="+encodeURIComponent(e.name),{method:"POST",body:e});showToast(I18N.success),refreshList(),e.target.value=""};</script></body></html>`;
	}
}

class LanEditorSettingTab extends PluginSettingTab {
	plugin: LanEditorPlugin;
	constructor(app: App, plugin: LanEditorPlugin) { super(app, plugin); this.plugin = plugin; }
	// [Fix 5] Display should not be async
	display(): void {
		const {containerEl} = this; containerEl.empty();
		
		const isRunning = this.plugin.isServerRunning;
		const ip = this.plugin.getLocalIP();
		const port = this.plugin.settings.port;
		const webUrl = `http://${ip}:${port}`;

        // [Fix 7] Use CSS classes instead of inline styles
		const statusCard = containerEl.createDiv({cls: 'airportal-status-card'});

		const statusDot = statusCard.createSpan({cls: 'airportal-status-dot ' + (isRunning ? 'running' : 'stopped')});

        // [Fix 6] Use Setting().setHeading() instead of createEl('h3')
        new Setting(statusCard)
            .setName(isRunning ? t('status_running') : t('status_stopped'))
            .setHeading();
            
		if (isRunning) statusCard.createEl('div', {text: `URL: ${webUrl}`, cls: 'airportal-server-url'});

		const toggleBtn = statusCard.createEl('button', {cls: 'airportal-toggle-btn'});
		toggleBtn.innerText = isRunning ? t('btn_stop') : t('btn_start');
		toggleBtn.addClass(isRunning ? 'mod-warning' : 'mod-cta');
		
		toggleBtn.onclick = async () => {
			toggleBtn.innerText = t('btn_processing'); toggleBtn.disabled = true;
			if (isRunning) this.plugin.stopServer();
			else {
				const success = await this.plugin.startServer