import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import fs from 'fs'
import archiver from 'archiver'

import { getFacts, t } from '@main/utils/i18n'

function getSplashHTML () {
  return `<body>
  <div class="container">
    <div>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 209 193" width="150" height="150" style=" animation: pulse 2s ease-in-out infinite, wobble 3s ease-in-out infinite; filter: drop-shadow(0 0 10px #fff) drop-shadow(0 0 20px #ff001e); margin-bottom: 30px; ">
           <path d="M0 15.2c8.6-5 17.1-10 25.9-15.2C41.2 24.5 56.5 48.8 72 73.6c4.3-11.2 8.4-21.7 12.4-32.2 5-12.9 9.9-25.8 14.8-38.7.7-1.9 1.5-2.6 3.8-2.5 6.6.1 13.2.1 20.2.1 11.2 34.3 22.2 68.5 33.5 103.3 10.3-6.1 20.4-12 30.8-18.1 3.4 9.5 6.8 18.7 10.2 27.8.7 1.8-.5 2.4-1.7 3.1-8.9 5.3-17.8 10.7-26.7 15.9-2.1 1.2-2.6 2.3-1.8 4.5 1.5 3.8 2.6 7.7 4 12 10.8-6.4 21.4-12.8 32.3-19.2 1.8 4.5 3.5 8.7 5.3 13.1-4.3 2.1-8.3 4.2-12.5 6.3-6.4 3.2-12.8 6.4-19.2 9.5-1.8.9-2.2 1.7-1.6 3.6 3.2 9.2 6 18.5 9.1 27.8.3 1 .5 1.9.9 3.1h-35.2c-1.8-5.9-3.6-11.9-5.5-18.3-12.4 6.1-24.4 12.1-36.8 18.2-.9-1.4-1.7-2.7-2.8-4.3 1.5-.9 2.9-1.9 4.4-2.7 10-6 20-12 30.2-18 1.9-1.1 2.6-2.1 1.8-4.2-1.4-3.9-2.4-7.9-3.8-12.4-13.5 8.1-26.7 16-40.4 24.1-7-11.4-13.8-22.6-21-34.4-.5 1.2-.8 1.9-1 2.6-4.4 15.4-9 30.8-13.3 46.2-.7 2.5-1.7 3.4-4.7 3.3-10.3-.2-20.6-.1-31.3-.1 1.4-3.8 2.8-7.4 4.1-11 8.8-22.9 17.6-45.7 26.5-68.6.9-2.3.5-4-.7-6.1C38 77.7 20 48 1.9 18.3c-.7-.9-1.2-1.9-1.9-3.1zM128.8 120c-7.7-26.1-15.4-52.1-23.2-78.4-.7.7-.9.8-.9.9C99.3 60.8 94 79.3 88.8 97.7c-.3 1.2.2 2.9.9 4 5.8 9.4 11.7 18.8 17.5 28.1.4.7 1 1.3 1.5 2 6.8-3.9 13.3-7.8 20.1-11.8z" stroke="white" fill="none" stroke-width="2" stroke-dasharray="1800" stroke-dashoffset="1800" style="animation: draw 3s linear forwards;" />
        </svg>
    </div>

    <div id="message"></div>
    <div id="logs-saved"></div>

    <div style="display: flex; flex-direction: row;">
        <button class="action" id="logs">${t('common.saveLogs')}</button>
        <button style="margin-left: 20px" id="close" class="action">${t('common.close')}</button>
        <button style="margin-left: 20px" id="restart" class="action">${t('common.restart')}</button>
    </div>
  </div>

  <script>
    const msg = document.getElementById('message');
    const btn = document.getElementById('logs');
    const btn2 = document.getElementById('close');
    const btn3 = document.getElementById('restart');

    function showMessage({ text, type = 'info', button = false }) {
      msg.textContent = text;
      msg.style.opacity = 1;
      msg.style.transform = 'translateY(0)';
      msg.style.background = type === 'error' ? 'rgba(255,0,30,0.35)' : 'rgba(255,255,255,0.08)';

      btn.style.display = button ? 'block' : 'none';
      btn2.style.display = button ? 'block' : 'none';
      btn3.style.display = button ? 'block' : 'none';
    }

    const { ipcRenderer } = require('electron');

    window.addEventListener('DOMContentLoaded', () => {
      ipcRenderer.on('update', (event, data) => {
        showMessage(data.payload);
      });

      btn2.onclick = async () => {
        btn.disabled = true;
        await ipcRenderer.invoke('exit');
      };

      btn3.onclick = async () => {
        btn.disabled = true;
        await ipcRenderer.invoke('restart');
      };

      btn.onclick = async () => {
        btn.disabled = true;
        btn.textContent = '${t('common.loading')}';

        if (await ipcRenderer.invoke('save-logs') !== true) {
          document.querySelector('#logs-saved').textContent = '';
          btn.textContent = '${t('common.saveLogs')}';
          btn.disabled = false;
          return;
        }

        document.querySelector('#logs-saved').textContent = '${t('common.logsSaved')}';
        btn.textContent = '${t('common.saveLogs')}';
        btn.disabled = false;
      };
    });
  </script>

  <style>
    body {
      overflow: hidden;
      user-select: none;
      margin: 0;
      font-family: sans-serif;
      color: white;
      text-align: center;
    }

    .action {
      display: none;
      padding: 10px;
      border-radius: 10px;
      border: none;
      cursor: pointer;
      background: rgba(255,0,30,0.35);
      color: white;
      font-size: 13px;
    }

    .container {
      display: flex;
      flex-wrap: wrap;
      flex-direction: column;
      justify-content: space-around;
      align-items: center;
      width: 100%;
      height: 100%;
      border-radius: 10%;
      background: linear-gradient(135deg,#1e1e1e,#2c2c2c);
    }

    #message {
      font-size: 1rem;
      max-width: 320px;
      line-height: 1.5;
      background: rgba(255,0,30,0.42);
      backdrop-filter: blur(8px);
      padding: 14px 20px;
      border-radius: 14px;
      opacity: 0;
      transform: translateY(20px) scale(0.95);
      transition: opacity 1s ease, transform 1s ease;
      font-weight: 500;
    }

    @keyframes draw { to { stroke-dashoffset: 0; } }
    @keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }
    @keyframes wobble { 0%,100% { transform: rotate(0deg); } 25% { transform: rotate(3deg) translateX(1px); } 50% { transform: rotate(-3deg) translateX(-1px); } 75% { transform: rotate(2deg) translateX(0); } }
  </style>
</body>`
}

export function createSplash () {
  const splash = new BrowserWindow({
    title: t('main.splashStartTitle'),
    show: false,
    frame: false,
    resizable: false,
    width: 400,
    height: 400,
    maxHeight: 400,
    maxWidth: 400,
    minHeight: 400,
    minWidth: 400,
    transparent: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  })

  splash.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(getSplashHTML())}`)
    .catch(error => {
      console.error('Error loading splash window:', error)
    })

  splash.once('ready-to-show', () => {
    const facts = getFacts()
    const randomFact = facts[Math.floor(Math.random() * facts.length)]

    splash.webContents.send('update', {
      payload: {
        text: randomFact,
        type: 'info'
      }
    })

    splash.center()
    splash.show()
    splash.focus()

    splash.on('closed', () => {
      splash.removeAllListeners()
    })
  })

  splash.setMessage = (text, type = 'info', button = false) => {
    try {
      splash.webContents.postMessage('update', {
        payload: {
          text,
          type,
          button
        }
      })
    } catch (error) {
      console.error('Error updating splash window:', error)
    }
  }

  splash.reloadLocale = () => {
    splash.setTitle(t('main.splashStartTitle'))
    splash.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(getSplashHTML())}`)
      .catch(error => console.error('Error reloading splash window locale:', error))
  }

  return splash
}

ipcMain.handle('save-logs', async () => {
  const { filePath, canceled } = await dialog.showSaveDialog({
    title: t('main.saveLogsDialog'),
    defaultPath: 'anilibrix-logs.zip',
    properties: ['dontAddToRecent', 'showOverwriteConfirmation']
  })

  if (canceled) {
    return false
  }

  const dir = app.getPath('userData')
  const output = fs.createWriteStream(filePath)
  const archive = archiver('zip', { zlib: { level: 9 } })

  return new Promise((resolve, reject) => {
    output.on('close', function () {
      resolve(true)
    })

    archive.on('warning', reject)
    archive.on('error', reject)

    archive.pipe(output)
    archive.glob('anilibrix.log*', { cwd: dir })
    archive.finalize()
  })
})
