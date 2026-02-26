// ---------------------------------------------------------------------------
// Port TreeDataProvider — powers the sidebar port list
// ---------------------------------------------------------------------------
const vscode = require("vscode");
const PortItem = require("./port-item");

class PortTreeProvider {
  /**
   * @param {import("./port-scanner")} scanner
   */
  constructor(scanner) {
    this.scanner = scanner;
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this._ports = [];
    this._previousPorts = new Set();
    this._showNotifications = true;
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  /** @returns {PortItem[]} */
  async getChildren(element) {
    if (element) return [];

    const cfg = vscode.workspace.getConfiguration("portPilot");
    const ignorePorts = cfg.get("ignorePorts") || [];
    const ignoreSystem = cfg.get("ignoreSystemPorts");
    const groupBy = cfg.get("groupBy");

    this._ports = await this.scanner.scan();
    this._showNotifications = cfg.get("showNotifications");

    // Filter
    this._ports = this._ports.filter((p) => {
      if (ignorePorts.includes(p.port)) return false;
      if (ignoreSystem && p.port < 1024) return false;
      return true;
    });

    // Detect changes for notifications
    this._detectChanges();

    // Build items
    const items = this._ports.map(
      (p) => new PortItem(p, this.scanner.detectRuntime(p))
    );

    if (groupBy === "runtime") {
      // Sort by runtime, then port
      items.sort((a, b) => {
        if (a.runtime !== b.runtime) return a.runtime.localeCompare(b.runtime);
        return a.portEntry.port - b.portEntry.port;
      });
    }

    return items;
  }

  getTreeItem(element) {
    return element;
  }

  getParent() {
    return null;
  }

  /** Get current port count */
  get portCount() {
    return this._ports.length;
  }

  _detectChanges() {
    if (!this._showNotifications) return;

    const currentPorts = new Set(this._ports.map((p) => p.port));

    // Only notify after first scan (skip initial load)
    if (this._previousPorts.size > 0) {
      // New ports
      for (const port of currentPorts) {
        if (!this._previousPorts.has(port)) {
          const entry = this._ports.find((p) => p.port === port);
          vscode.window.showInformationMessage(
            `Port ${port} listening (${entry ? entry.name : "unknown"})`
          );
        }
      }

      // Removed ports
      for (const port of this._previousPorts) {
        if (!currentPorts.has(port)) {
          vscode.window.showInformationMessage(`Port ${port} stopped`);
        }
      }
    }

    this._previousPorts = currentPorts;
  }
}

module.exports = PortTreeProvider;
