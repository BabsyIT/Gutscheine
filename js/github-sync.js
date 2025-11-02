/**
 * GitHub Synchronization Module
 * Automatically syncs vouchers.json to GitHub repository
 */

class GitHubSync {
    constructor() {
        this.config = this.loadConfig();
        this.syncInProgress = false;
    }

    // Load configuration from localStorage
    loadConfig() {
        const stored = localStorage.getItem('github_sync_config');
        if (stored) {
            return JSON.parse(stored);
        }
        return {
            enabled: false,
            token: '',
            owner: '',
            repo: '',
            branch: 'main',
            filePath: 'data/vouchers.json'
        };
    }

    // Save configuration to localStorage
    saveConfig(config) {
        this.config = { ...this.config, ...config };
        localStorage.setItem('github_sync_config', JSON.stringify(this.config));
    }

    // Check if sync is configured and enabled
    isConfigured() {
        return this.config.enabled &&
               this.config.token &&
               this.config.owner &&
               this.config.repo;
    }

    // Auto-sync pending vouchers to GitHub
    async autoSync() {
        if (!this.isConfigured()) {
            console.log('GitHub sync not configured');
            return false;
        }

        if (this.syncInProgress) {
            console.log('Sync already in progress');
            return false;
        }

        const pendingExportStr = localStorage.getItem('pending_vouchers_export') || '[]';
        const allPendingVouchers = JSON.parse(pendingExportStr);

        if (allPendingVouchers.length === 0) {
            console.log('No pending changes to sync');
            return false;
        }

        this.syncInProgress = true;

        try {
            // Fetch current vouchers.json from GitHub
            const currentData = await this.fetchFileFromGitHub();

            // Merge with pending vouchers
            const voucherMap = new Map();
            if (currentData && currentData.vouchers) {
                currentData.vouchers.forEach(v => voucherMap.set(v.id, v));
            }
            allPendingVouchers.forEach(v => voucherMap.set(v.id, v));

            const mergedVouchers = Array.from(voucherMap.values());

            const newData = {
                vouchers: mergedVouchers,
                lastUpdated: new Date().toISOString(),
                stats: {
                    total: mergedVouchers.length,
                    active: mergedVouchers.filter(v => !v.isRedeemed).length,
                    redeemed: mergedVouchers.filter(v => v.isRedeemed).length
                }
            };

            // Push to GitHub
            await this.updateFileOnGitHub(newData);

            // Clear pending queue after successful sync
            localStorage.removeItem('pending_vouchers_export');

            console.log('✅ GitHub sync successful');
            this.syncInProgress = false;
            return true;

        } catch (error) {
            console.error('❌ GitHub sync failed:', error);
            this.syncInProgress = false;
            throw error;
        }
    }

    // Fetch file content from GitHub
    async fetchFileFromGitHub() {
        const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}?ref=${this.config.branch}`;

        const response = await fetch(url, {
            headers: {
                'Authorization': `token ${this.config.token}`,
                'Accept': 'application/vnd.github.v3+json'
            }
        });

        if (!response.ok) {
            if (response.status === 404) {
                // File doesn't exist yet
                return null;
            }
            throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
        }

        const data = await response.json();
        const content = atob(data.content);

        return {
            data: JSON.parse(content),
            sha: data.sha // Needed for updating
        };
    }

    // Update file on GitHub
    async updateFileOnGitHub(newData) {
        // First get the current SHA
        const current = await this.fetchFileFromGitHub();

        const content = JSON.stringify(newData, null, 2);
        const contentBase64 = btoa(unescape(encodeURIComponent(content)));

        const url = `https://api.github.com/repos/${this.config.owner}/${this.config.repo}/contents/${this.config.filePath}`;

        const body = {
            message: `Auto-update vouchers.json - ${new Date().toISOString()}`,
            content: contentBase64,
            branch: this.config.branch
        };

        if (current && current.sha) {
            body.sha = current.sha;
        }

        const response = await fetch(url, {
            method: 'PUT',
            headers: {
                'Authorization': `token ${this.config.token}`,
                'Accept': 'application/vnd.github.v3+json',
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`GitHub API error: ${response.status} - ${errorData.message}`);
        }

        return await response.json();
    }

    // Show configuration dialog
    showConfigDialog() {
        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0,0,0,0.5);
            display: flex;
            align-items: center;
            justify-content: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div style="background: white; padding: 30px; border-radius: 10px; max-width: 500px; width: 90%;">
                <h2 style="margin-top: 0;">GitHub Auto-Sync Konfiguration</h2>
                <p style="color: #666;">Richten Sie die automatische Synchronisation mit GitHub ein.</p>

                <div style="margin: 20px 0;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">
                        <input type="checkbox" id="sync-enabled" ${this.config.enabled ? 'checked' : ''}> Aktivieren
                    </label>
                </div>

                <div style="margin: 15px 0;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">GitHub Personal Access Token:</label>
                    <input type="password" id="sync-token" value="${this.config.token}"
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
                           placeholder="ghp_xxxxxxxxxxxx">
                    <small style="color: #666;">Benötigt: repo Berechtigung</small>
                </div>

                <div style="margin: 15px 0;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Repository Owner:</label>
                    <input type="text" id="sync-owner" value="${this.config.owner}"
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
                           placeholder="username oder organization">
                </div>

                <div style="margin: 15px 0;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Repository Name:</label>
                    <input type="text" id="sync-repo" value="${this.config.repo}"
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
                           placeholder="repo-name">
                </div>

                <div style="margin: 15px 0;">
                    <label style="display: block; margin-bottom: 5px; font-weight: bold;">Branch:</label>
                    <input type="text" id="sync-branch" value="${this.config.branch}"
                           style="width: 100%; padding: 8px; border: 1px solid #ddd; border-radius: 4px;"
                           placeholder="main">
                </div>

                <div style="display: flex; gap: 10px; margin-top: 20px;">
                    <button id="sync-save" style="flex: 1; padding: 10px; background: #10b981; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                        Speichern
                    </button>
                    <button id="sync-test" style="flex: 1; padding: 10px; background: #3b82f6; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                        Test
                    </button>
                    <button id="sync-cancel" style="flex: 1; padding: 10px; background: #6b7280; color: white; border: none; border-radius: 5px; cursor: pointer; font-weight: bold;">
                        Abbrechen
                    </button>
                </div>

                <div id="sync-status" style="margin-top: 15px; padding: 10px; border-radius: 5px; display: none;"></div>
            </div>
        `;

        document.body.appendChild(modal);

        // Event handlers
        document.getElementById('sync-save').onclick = () => {
            this.saveConfig({
                enabled: document.getElementById('sync-enabled').checked,
                token: document.getElementById('sync-token').value,
                owner: document.getElementById('sync-owner').value,
                repo: document.getElementById('sync-repo').value,
                branch: document.getElementById('sync-branch').value
            });
            document.body.removeChild(modal);
            alert('Konfiguration gespeichert!');
        };

        document.getElementById('sync-test').onclick = async () => {
            const status = document.getElementById('sync-status');
            status.style.display = 'block';
            status.style.background = '#fef3c7';
            status.style.color = '#92400e';
            status.textContent = 'Test läuft...';

            try {
                // Save temp config
                const tempConfig = {
                    enabled: true,
                    token: document.getElementById('sync-token').value,
                    owner: document.getElementById('sync-owner').value,
                    repo: document.getElementById('sync-repo').value,
                    branch: document.getElementById('sync-branch').value
                };
                this.config = tempConfig;

                // Try to fetch file
                await this.fetchFileFromGitHub();

                status.style.background = '#d1fae5';
                status.style.color = '#065f46';
                status.textContent = '✅ Verbindung erfolgreich!';
            } catch (error) {
                status.style.background = '#fee2e2';
                status.style.color = '#991b1b';
                status.textContent = `❌ Fehler: ${error.message}`;
            }
        };

        document.getElementById('sync-cancel').onclick = () => {
            document.body.removeChild(modal);
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                document.body.removeChild(modal);
            }
        };
    }
}

// Global instance
window.gitHubSync = new GitHubSync();
