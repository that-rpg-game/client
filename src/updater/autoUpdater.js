class AutoUpdater {
  constructor() {
    this.updateAvailable = false;
    this.updateDownloaded = false;
    this.autoUpdater = null;
  }

  init() {
    // Lazy-load autoUpdater only after app is ready
    const { autoUpdater } = require('electron-updater');
    this.autoUpdater = autoUpdater;

    // Configure auto-updater for forced updates
    this.autoUpdater.autoDownload = true; // Automatically download updates
    this.autoUpdater.autoInstallOnAppQuit = false; // We'll force install immediately

    // Set up event listeners
    this.autoUpdater.on('checking-for-update', () => {
      console.warn('Checking for updates...');
    });

    this.autoUpdater.on('update-available', (info) => {
      console.warn('Update available:', info.version, '- Downloading...');
      this.updateAvailable = true;
    });

    this.autoUpdater.on('update-not-available', () => {
      console.warn('No updates available - client is up to date');
      this.updateAvailable = false;
    });

    this.autoUpdater.on('error', (error) => {
      console.error('Update error:', error);
    });

    this.autoUpdater.on('download-progress', (progress) => {
      const percent = Math.round(progress.percent);
      console.warn(`Downloading update: ${percent}%`);
    });

    this.autoUpdater.on('update-downloaded', () => {
      console.warn('Update downloaded - Restarting to install...');
      this.updateDownloaded = true;
      // Force quit and install immediately
      setTimeout(() => {
        this.autoUpdater.quitAndInstall(false, true);
      }, 2000); // Give 2 seconds to see the message
    });

    // Check for updates on startup (in production only)
    if (process.env.NODE_ENV === 'production') {
      this.checkForUpdates();
    }
  }

  checkForUpdates() {
    if (this.autoUpdater) {
      this.autoUpdater.checkForUpdates();
    }
  }

  downloadUpdate() {
    if (this.autoUpdater && this.updateAvailable) {
      this.autoUpdater.downloadUpdate();
    }
  }

  quitAndInstall() {
    if (this.autoUpdater && this.updateDownloaded) {
      this.autoUpdater.quitAndInstall();
    }
  }
}

module.exports = new AutoUpdater();
