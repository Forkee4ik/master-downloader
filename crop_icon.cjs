const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

app.whenReady().then(() => {
  const win = new BrowserWindow({
    show: false,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  win.loadURL(`data:text/html,
    <html>
      <body>
        <canvas id="c" width="256" height="256"></canvas>
        <script>
          const img = new Image();
          img.onload = () => {
            const canvas = document.getElementById('c');
            const ctx = canvas.getContext('2d');
            
            // Draw rounded mask
            const radius = 64;
            ctx.beginPath();
            ctx.moveTo(radius, 0);
            ctx.lineTo(256 - radius, 0);
            ctx.quadraticCurveTo(256, 0, 256, radius);
            ctx.lineTo(256, 256 - radius);
            ctx.quadraticCurveTo(256, 256, 256 - radius, 256);
            ctx.lineTo(radius, 256);
            ctx.quadraticCurveTo(0, 256, 0, 256 - radius);
            ctx.lineTo(0, radius);
            ctx.quadraticCurveTo(0, 0, radius, 0);
            ctx.closePath();
            ctx.clip();
            
            ctx.drawImage(img, 0, 0, 256, 256);
            
            const dataUrl = canvas.toDataURL('image/png');
            const { ipcRenderer } = require('electron');
            ipcRenderer.send('save-img', dataUrl);
          };
          // The image path will be replaced in main script
          img.src = 'file:///C:/Users/09ana/.gemini/antigravity-ide/brain/9f7a9849-f1b8-40da-a440-71af6d2bb1a7/app_icon_transparent_1785007119780.png';
        </script>
      </body>
    </html>
  `);

  ipcMain.on('save-img', (event, dataUrl) => {
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
    fs.writeFileSync('C:/code/Master-Downloader/build/icon.png', base64Data, 'base64');
    app.quit();
  });
});
