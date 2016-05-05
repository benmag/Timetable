const { app } = require("electron");
const { BrowserWindow } = require("electron");
const { ipcMain } = require("electron");

// Keep a global reference of the window object to prevent garbage collection
let mainWindow, searchWindow;

// Create the main timetable window
function createMainWindow() {
  // Create the main browser window
  mainWindow = new BrowserWindow({ width: 900, height: 600 });
  mainWindow.setMenu(null);
  mainWindow.loadURL("file://" + __dirname + "/timetabler.html");

  // Redirect external links to search window
  mainWindow.webContents.on("new-window", (event, url) => {
    event.preventDefault();
    createSearchWindow(url);
  });

  // When a unit is received from the search window
  ipcMain.on("unit_import", (event, arg) => {
    mainWindow.webContents.send("unit_import", arg);
  });

  // Emitted when the window is closed
  mainWindow.on("closed", () => {
    // Dereference the window object, usually you would store windows
    // in an array if your app supports multi windows, this is the time
    // when you should delete the corresponding element.
    // mainWindow = null;
    // searchWindow = null;
    app.quit();
  });
}

// Create the unit search window
function createSearchWindow(url) {
  // Create the search window
  searchWindow = new BrowserWindow({ width: 600, height: 400, show: false });
  searchWindow.setMenu(null);
  searchWindow.loadURL("file://" + __dirname + "/search.html");

  searchWindow.webContents.on("dom-ready", () => {
    searchWindow.webContents.send("url", url);
  });

  searchWindow.show();
}

// Quit when all windows are closed.
app.on("window-all-closed", function() {
  // On OS X it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== "darwin") {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (mainWindow === null) {
    createMainWindow();
  }
});

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
app.on("ready", createMainWindow);
