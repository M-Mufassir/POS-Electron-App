import {app, BrowserWindow} from 'electron';
import path from 'path';
import process from 'process';


app.on('ready', () => {
  const mainWindow = new BrowserWindow({
    // width: 800,
    // height: 600,
    // webPreferences: {
    //   preload: path.join(__dirname, 'preload.js'),
    // },
  });
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:5123');
    return;
  } else {
  mainWindow.loadURL(path.join(app.getAppPath(), 'dist-react', 'index.html'));
  }
});