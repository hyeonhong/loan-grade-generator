
// load common module
const { get, post, sleep } = require('../lib/common.js');

const { app, BrowserWindow, Menu, ipcMain, dialog } = require('electron');
const path = require('path');
const url = require('url');

// init win
let win;
let aboutWindow;
let payload = [];


function createWindow() {
  // Create broser window
  win = new BrowserWindow({
    witdh: 800,
    height: 600,
    icon: path.join(__dirname, '..', 'favicon.ico'),
    resizable: false,
    minimizable: false,
    maximizable: false,
  });
  win.setSize(480, 520);
  // win.setSize(800, 400);  // for devTools

  // Load index.html
  win.loadURL(url.format({
    pathname: path.join(__dirname, '..', 'html', 'mainWindow.html'),
    protocol: 'file:',
    slashes: true
  }));

  // // Open the DevTools.
  // win.webContents.openDevTools();

  // Build menu from template
  const menu = Menu.buildFromTemplate(menuTemplate);
  // Insert menu
  Menu.setApplicationMenu(menu);

  win.on('closed', function () {
    win = null;
  });

}

// Catch bizNos
ipcMain.on('bizNos', async function (event, bizNos) {
  if (bizNos === null) {
    win.webContents.send('statusMessage', '지금 처리중입니다...');
    return;
  }

  bizNos = bizNos.trim().split('\n');
  let validBizNos = Array.isArray(bizNos) && checkBizNos(bizNos);
  if (validBizNos) {  // if valid
    let testVpn = await get('http://as.kross.kr:7999');
    if (!testVpn) {
      win.webContents.send('statusMessage', 'VPN 연결을 해주세요');
      win.webContents.send('setPending', false);
      return;
    }

    win.webContents.send('resetGrade', null);
    win.webContents.send('statusMessage', '조회를 시작합니다');

    const start = process.hrtime();
    // code block starts
    for (const bizNo of bizNos) {
      let grade = await getGrade(bizNo);
      if (!grade) {
        win.webContents.send('statusMessage', 'VPN 연결이 끊어졌습니다');
        win.webContents.send('setPending', false);
        return;
      }
      win.webContents.send('appendGrade', grade);
      win.webContents.send('statusMessage', bizNo + ' => ' + grade);
    }
    // code block ends
    const diff = process.hrtime(start);
    const elapsedTime = diff[0];  // in seconds
    let date = new Date(null);
    date.setSeconds(elapsedTime);
    let result = date.toISOString().substr(11, 8);
    let h = parseInt(result.slice(0, 2));
    let m = parseInt(result.slice(3, 5));
    let s = parseInt(result.slice(6, 8));

    let hDisplay = (h && (h + '시간 ')) || '';
    let mDisplay = (m && (m + '분 ')) || '';
    let sDisplay = (s && (s + '초')) || '';
    let timeDisplay = hDisplay + mDisplay + sDisplay;

    win.webContents.send('statusMessage', '산출이 완료되었습니다 -- 총 소요시간: ' + timeDisplay);
  } else {
    win.webContents.send('statusMessage', '잘못된 사업자번호가 입력되었습니다');
  }
  win.webContents.send('setPending', false);
});

// Catch closeAboutWindow
ipcMain.on('closeAboutWindow', function (event, arg) {
  aboutWindow.close();
});

// Catch exit
ipcMain.on('exitWindows', function (event, arg) {
  app.quit();
});

// Catch data
ipcMain.on('catchData', function (event, data) {
  // payload = data;  // wrong! -> this will replace the reference of payload with data
  payload.push(...data);  // to preserve the reference of payload
});

// Create aboutWindow
function createAboutWindow() {
  // Create new window
  aboutWindow = new BrowserWindow({
    title: 'About',
    icon: path.join(__dirname, '..', 'favicon.ico'),
  });
  aboutWindow.setSize(500, 200);
  aboutWindow.setMenu(null);

  // Load html to window
  aboutWindow.loadURL(url.format({
    pathname: path.join(__dirname, '..', 'html', 'aboutWindow.html'),
    protocol: 'file:',
    slashes: true
  }));

  // Handle garbage collection
  aboutWindow.on('close', function () {
    aboutWindow = null;
  });
}


// Create menu template
const menuTemplate = [
  {
    label: 'File',
    submenu: [
      {
        label: '파일로 저장',
        click() {
          saveToFile();
        }
      },
      {
        label: 'Quit',
        accelerator: process.platform === 'darwin' ? 'Command+Q' : 'Ctrl+Q',
        click() {
          app.quit();
        }
      }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { label: "Undo", accelerator: "CmdOrCtrl+Z", selector: "undo:" },
      { label: "Redo", accelerator: "Shift+CmdOrCtrl+Z", selector: "redo:" },
      { type: "separator" },
      { label: "Cut", accelerator: "CmdOrCtrl+X", selector: "cut:" },
      { label: "Copy", accelerator: "CmdOrCtrl+C", selector: "copy:" },
      { label: "Paste", accelerator: "CmdOrCtrl+V", selector: "paste:" },
      { label: "Select All", accelerator: "CmdOrCtrl+A", selector: "selectAll:" }
    ]
  },
  {
    label: 'Help',
    submenu: [
      {
        label: 'About',
        click() {
          createAboutWindow();
        }
      }
    ]
  }
];

// Run create window function
app.on('ready', createWindow);

// Quit when all windows are closed
app.on('window-all-closed', function () {
  // // On macOS it is common for applications and their menu bar
  // // to stay active until the user quits explicitly with Cmd + Q
  // if (process.platform !== 'darwin') {
  app.quit();
  // }
})

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (win === null) {
    createWindow()
  }
})

function checkBizNos(bizNos) {
  for (const bizNo of bizNos) {
    let str = bizNo.replace(/-/g, '').trim();
    if (str.length !== 10) {
      return false;
    }
    let num = parseFloat(str);
    if (!Number.isInteger(num)) {
      return false;
    }
  }
  return true;
}

async function getGrade(bizNo) {
  let url = 'http://as.kross.kr:7999/ai/ent/recalc_css/' + bizNo;
  let resultString = await get(url);
  if (!resultString) {
    let testVpn = await get('http://as.kross.kr:7999');
    if (!testVpn) {
      return null;
    }
    console.log(resultString);
    return '산출 실패';
  }
  let result = JSON.parse(resultString);
  if (!result.e1 || !result.e1.grade) {  // deal with this later
    console.log(result);
    return '산출 실패';
  }
  let grade = result.e1.grade;
  return grade;
}

async function saveToFile() {
  // read data
  win.webContents.send('readData', null);

  // get filePath from user
  let filePath = dialog.showSaveDialog({
    title: 'Save File As..',
    message: 'Save File As..',
    defaultPath: 'result.xlsx',
    filters: [
      { name: 'Excel files', extensions: ['xlsx'] },
    ]
  });
  if (!filePath) {
    return;
  }

  // check if payload has been filled
  while (payload.length === 0) {  // this works, since the reference of payload was preserved
    await sleep(500);  // wait 0.5 sec
  }

  // write to file
  const XLSX = require('xlsx');
  let wb = XLSX.utils.book_new();
  let ws = XLSX.utils.aoa_to_sheet(payload);
  let sheetName = "result";
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filePath);
}
