const { app, BrowserWindow } = require("electron");
const path = require("path");

let win;

function createWindow() {
  win = new BrowserWindow({
    width: 800,
    height: 600,
    kiosk: true,
    alwaysOnTop: true,
    frame: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  win.loadFile("index.html");

  // Listen for close events
  //   win.on("close", (event) => {
  //     console.log("⚠️ The window is being closed!");

  //     // Uncomment this if you want to PREVENT closing:
  //     // event.preventDefault();
  //   });

  win.on("close", (event) => {
    console.log("⚠️ The window is being closed! Relaunching...");
    event.preventDefault(); // Stop the close
    win.destroy(); // Actually destroy the window

    // Recreate it after a short delay
    setTimeout(() => {
      createWindow();
    }, 500);
  });

  // OPTIONAL: Further disable keyboard shortcuts at app level
  win.setMenu(null);
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", function () {
  // Do nothing to keep the app alive
});
