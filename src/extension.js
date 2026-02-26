// ---------------------------------------------------------------------------
// Port Pilot — VS Code Extension
// See every port. Know every process. Kill with one click.
// ---------------------------------------------------------------------------
const vscode = require("vscode");
const { exec } = require("child_process");
const PortScanner = require("./port-scanner");
const PortTreeProvider = require("./port-tree-provider");

/** @param {vscode.ExtensionContext} context */
function activate(context) {
  const scanner = new PortScanner();
  const treeProvider = new PortTreeProvider(scanner);

  // ------------------------------------------------------------------
  // Helpers
  // ------------------------------------------------------------------
  function cfg(key) {
    return vscode.workspace.getConfiguration("portPilot").get(key);
  }

  // ------------------------------------------------------------------
  // Register TreeView
  // ------------------------------------------------------------------
  const treeView = vscode.window.createTreeView("portPilot.portList", {
    treeDataProvider: treeProvider,
    showCollapseAll: false,
  });
  context.subscriptions.push(treeView);

  // ------------------------------------------------------------------
  // Status bar
  // ------------------------------------------------------------------
  const statusBar = vscode.window.createStatusBarItem(
    vscode.StatusBarAlignment.Right,
    80
  );
  statusBar.command = "portPilot.focus";
  context.subscriptions.push(statusBar);

  function updateStatusBar() {
    if (!cfg("enable") || !cfg("showInStatusBar")) {
      statusBar.hide();
      return;
    }
    const count = treeProvider.portCount;
    statusBar.text = `$(plug) ${count} port${count !== 1 ? "s" : ""}`;
    statusBar.tooltip = `${count} listening port${count !== 1 ? "s" : ""} — click to view`;
    statusBar.show();
  }

  // ------------------------------------------------------------------
  // Auto-refresh
  // ------------------------------------------------------------------
  let refreshTimer = null;

  function startAutoRefresh() {
    stopAutoRefresh();
    if (!cfg("enable")) return;
    const intervalSec = cfg("refreshInterval") || 5;
    refreshTimer = setInterval(() => {
      treeProvider.refresh();
      // Update status bar after tree refreshes (small delay for async)
      setTimeout(updateStatusBar, 1000);
    }, intervalSec * 1000);
  }

  function stopAutoRefresh() {
    if (refreshTimer) {
      clearInterval(refreshTimer);
      refreshTimer = null;
    }
  }

  // ------------------------------------------------------------------
  // Commands
  // ------------------------------------------------------------------
  context.subscriptions.push(
    vscode.commands.registerCommand("portPilot.refresh", () => {
      treeProvider.refresh();
      setTimeout(updateStatusBar, 1000);
    }),

    vscode.commands.registerCommand("portPilot.focus", () => {
      vscode.commands.executeCommand("portPilot.portList.focus");
    }),

    vscode.commands.registerCommand("portPilot.openInBrowser", (item) => {
      if (!item?.portEntry) return;
      const url = `http://localhost:${item.portEntry.port}`;
      vscode.env.openExternal(vscode.Uri.parse(url));
    }),

    vscode.commands.registerCommand("portPilot.copyUrl", (item) => {
      if (!item?.portEntry) return;
      const url = `http://localhost:${item.portEntry.port}`;
      vscode.env.clipboard.writeText(url);
      vscode.window.showInformationMessage(`Copied: ${url}`);
    }),

    vscode.commands.registerCommand("portPilot.killProcess", async (item) => {
      if (!item?.portEntry) return;
      const { port, pid, name } = item.portEntry;

      const confirm = await vscode.window.showWarningMessage(
        `Kill ${name} (PID ${pid}) on port ${port}?`,
        "Kill",
        "Cancel"
      );
      if (confirm !== "Kill") return;

      killByPid(pid);
      vscode.window.showInformationMessage(`Killed PID ${pid} (port ${port})`);

      // Refresh after kill
      setTimeout(() => {
        treeProvider.refresh();
        setTimeout(updateStatusBar, 1000);
      }, 500);
    })
  );

  // ------------------------------------------------------------------
  // Kill helper (specific PID only — never blanket kills)
  // ------------------------------------------------------------------
  function killByPid(pid) {
    if (process.platform === "win32") {
      exec(`taskkill /PID ${pid} /F`, { windowsHide: true });
    } else {
      exec(`kill -9 ${pid}`);
    }
  }

  // ------------------------------------------------------------------
  // Settings change
  // ------------------------------------------------------------------
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("portPilot")) {
        startAutoRefresh();
        treeProvider.refresh();
        setTimeout(updateStatusBar, 1000);
      }
    })
  );

  // ------------------------------------------------------------------
  // Startup
  // ------------------------------------------------------------------
  treeProvider.refresh();
  setTimeout(updateStatusBar, 1500);
  startAutoRefresh();

  // Cleanup on deactivate
  context.subscriptions.push({
    dispose: () => stopAutoRefresh(),
  });

  console.log("[port-pilot] Extension activated");
}

function deactivate() {}

module.exports = { activate, deactivate };
