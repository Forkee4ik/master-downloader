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

  const html = `
    <html>
      <body style="margin: 0; background: transparent;">
        <canvas id="c" width="256" height="256"></canvas>
        <script>
          const canvas = document.getElementById('c');
          const ctx = canvas.getContext('2d');
          
          ctx.clearRect(0, 0, 256, 256);
          
          const radius = 64;
          ctx.beginPath();
          ctx.moveTo(radius, 0);
          ctx.lineTo(256 - radius, 0);
          ctx.arcTo(256, 0, 256, radius, radius);
          ctx.lineTo(256, 256 - radius);
          ctx.arcTo(256, 256, 256 - radius, 256, radius);
          ctx.lineTo(radius, 256);
          ctx.arcTo(0, 256, 0, 256 - radius, radius);
          ctx.lineTo(0, radius);
          ctx.arcTo(0, 0, radius, 0, radius);
          ctx.closePath();
          
          ctx.fillStyle = '#65558f';
          ctx.fill();
          
          ctx.strokeStyle = '#ffffff';
          ctx.lineWidth = 20;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          
          ctx.beginPath();
          ctx.moveTo(128, 70);
          ctx.lineTo(128, 150);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(80, 110);
          ctx.lineTo(128, 150);
          ctx.lineTo(176, 110);
          ctx.stroke();
          
          ctx.beginPath();
          ctx.moveTo(76, 192);
          ctx.lineTo(180, 192);
          ctx.stroke();
          
          const dataUrl = canvas.toDataURL('image/png');
          const { ipcRenderer } = require('electron');
          ipcRenderer.send('save-img', dataUrl);
        </script>
      </body>
    </html>
  `;
  win.loadURL('data:text/html,' + encodeURIComponent(html));

  ipcMain.on('save-img', (event, dataUrl) => {
    const base64Data = dataUrl.replace(/^data:image\/png;base64,/, "");
    fs.writeFileSync('C:/code/Master-Downloader/build/icon.png', base64Data, 'base64');
    app.quit();
  });
});
