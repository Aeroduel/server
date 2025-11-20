const { app, BrowserWindow } = require("electron");
const path = require("path");
const { spawn } = require("child_process");
const net = require("net");
const fs = require("fs");

let serverProcess;
let win;

function getFreePort(start = 3000) {
  return new Promise((resolve) => {
    const tryPort = (port) => {
      const tester = net.createServer()
        .once("error", () => tryPort(port + 1))
        .once("listening", () => {
          tester.close(() => resolve(port));
        })
        .listen(port);
    };
    tryPort(start);
  });
}

async function createWindow() {
  const port = await getFreePort(3000);
  const isDev = !app.isPackaged;

  const iconPath = isDev
    ? path.join(__dirname, "..", "public", "logo.png")
    : path.join(process.resourcesPath, "standalone", "public", "logo.png");

  win = new BrowserWindow({
    width: 1200,
    height: 900,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true
    }
  });

  // Only open dev tools in development mode
  if (isDev) {
    win.webContents.openDevTools({ mode: "detach" });
  }

  const runtimeNode = isDev ? "node" : process.execPath;

  // Path to server.js
  let serverPath;
  if (isDev) {
    serverPath = path.join(__dirname, "..", ".next", "standalone", "server.js");
  } else {
    // In production, use the extraResources directory
    serverPath = path.join(
      process.resourcesPath,
      "standalone",
      "server.js"
    );
  }

  console.log("Electron starting...");
  console.log("Server path:", serverPath);
  console.log("Port selected:", port);

  if (!fs.existsSync(serverPath)) {
    console.error("ERROR: server.js not found at:", serverPath);
    win.loadURL("data:text/html,<h1>Server not found!</h1>");
    return;
  }

  // Spawn Next.js standalone server
  serverProcess = spawn(runtimeNode, [serverPath], {
    cwd: path.dirname(serverPath),
    env: { 
      ...process.env, 
      PORT: port,
      HOSTNAME: "127.0.0.1",
      // Ensure Electron binary behaves like Node when executing the script in prod
      ...(!isDev && { ELECTRON_RUN_AS_NODE: "1" })
    },
    stdio: "pipe"
  });

  serverProcess.stdout.on("data", (d) => {
    console.log("[server stdout]", d.toString());
  });
  serverProcess.stderr.on("data", (d) => {
    console.error("[server stderr]", d.toString());
  });

  serverProcess.on("exit", (code, signal) => {
    console.log(`[server exited] code: ${code}, signal: ${signal}`);
    serverProcess = null;
    if (win) win.loadURL("data:text/html,<h1>Server exited!</h1>");
  });

  // Wait a bit for server to start, then load URL
  const waitForServer = async () => {
    const maxRetries = 20;
    let retries = 0;
    const delay = (ms) => new Promise(r => setTimeout(r, ms));

    while (retries < maxRetries) {
      try {
        await new Promise((resolve, reject) => {
          // Explicitly check 127.0.0.1
          const client = net.createConnection({ port, host: "127.0.0.1" }, () => {
            client.end();
            resolve();
          });
          client.on("error", reject);
        });
        break;
      } catch {
        await delay(250);
        retries++;
      }
    }

    console.log("Loading app URL: http://127.0.0.1:" + port);
    win.loadURL(`http://127.0.0.1:${port}`);
  };

  waitForServer();
}

app.on("ready", createWindow);

app.on("window-all-closed", () => {
  if (serverProcess) serverProcess.kill();
  app.quit();
});

process.on("uncaughtException", (err) => {
  console.error("Uncaught Exception:", err);
  if (win) win.webContents.openDevTools({ mode: "detach" });
});
