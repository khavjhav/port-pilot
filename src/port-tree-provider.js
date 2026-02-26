// ---------------------------------------------------------------------------
// Port TreeDataProvider — powers the sidebar port list with grouped view
// ---------------------------------------------------------------------------
const vscode = require("vscode");
const { PortItem, PortGroupItem } = require("./port-item");

// Known desktop/background apps — not dev servers
const APP_NAMES = new Set([
  "discord", "dropbox", "anydesk", "stremio-runtime", "chrome", "firefox",
  "msedge", "brave", "opera", "slack", "spotify", "teams", "zoom",
  "nordvpn-service", "adobe desktop service", "adobecollabsync",
  "asussoftwaremanager", "mousewithoutborders", "onedrive",
  "steamwebhelper", "epic games", "telegram",
]);

// System/IDE process names
const SYSTEM_NAMES = new Set([
  "system", "svchost", "lsass", "wininit", "spoolsv", "services",
  "vmms", "smss", "csrss", "winlogon", "dwm", "dashost",
  "searchhost", "runtimebroker", "applicationframehost",
]);

const IDE_NAMES = new Set(["code", "code - insiders"]);

// Ephemeral port range (Windows dynamic RPC)
const EPHEMERAL_START = 49000;

class PortTreeProvider {
  /** @param {import("./port-scanner")} scanner */
  constructor(scanner) {
    this.scanner = scanner;
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    this._ports = [];
    this._groups = { dev: [], apps: [], system: [] };
    this._previousPorts = new Set();
    this._showNotifications = true;
  }

  refresh() {
    this._onDidChangeTreeData.fire();
  }

  async getChildren(element) {
    // Return children of a group
    if (element instanceof PortGroupItem) {
      const ports = this._groups[element.groupKey] || [];
      return ports.map(
        (p) => new PortItem(p, this.scanner.detectRuntime(p))
      );
    }

    // Root level — scan and build groups
    const cfg = vscode.workspace.getConfiguration("portPilot");
    const ignorePorts = cfg.get("ignorePorts") || [];
    const ignoreSystem = cfg.get("ignoreSystemPorts");

    this._ports = await this.scanner.scan();
    this._showNotifications = cfg.get("showNotifications");

    // Filter < 1024
    this._ports = this._ports.filter((p) => {
      if (ignorePorts.includes(p.port)) return false;
      if (ignoreSystem && p.port < 1024) return false;
      return true;
    });

    this._detectChanges();
    this._categorize();

    // Build group headers — Dev always expanded, others collapsed
    const groups = [];
    if (this._groups.dev.length > 0) {
      groups.push(
        new PortGroupItem("Dev Servers", "dev", this._groups.dev.length, true)
      );
    }
    if (this._groups.apps.length > 0) {
      groups.push(
        new PortGroupItem("Apps", "apps", this._groups.apps.length, false)
      );
    }
    if (this._groups.system.length > 0) {
      groups.push(
        new PortGroupItem(
          "System & IDE",
          "system",
          this._groups.system.length,
          false
        )
      );
    }

    return groups;
  }

  getTreeItem(element) {
    return element;
  }

  getParent(element) {
    if (element instanceof PortItem) {
      // Find which group this port belongs to
      for (const [key, ports] of Object.entries(this._groups)) {
        if (ports.some((p) => p.port === element.portEntry.port)) {
          const names = { dev: "Dev Servers", apps: "Apps", system: "System & IDE" };
          return new PortGroupItem(names[key], key, ports.length, key === "dev");
        }
      }
    }
    return null;
  }

  get portCount() {
    return this._groups.dev.length;
  }

  /** Categorize ports into dev / apps / system */
  _categorize() {
    this._groups = { dev: [], apps: [], system: [] };

    for (const p of this._ports) {
      const n = (p.name || "").toLowerCase();

      // Ephemeral Windows ports → system
      if (p.port >= EPHEMERAL_START) {
        this._groups.system.push(p);
        continue;
      }

      // Known system processes
      if (SYSTEM_NAMES.has(n)) {
        this._groups.system.push(p);
        continue;
      }

      // IDE
      if (IDE_NAMES.has(n)) {
        this._groups.system.push(p);
        continue;
      }

      // Known apps
      if (APP_NAMES.has(n)) {
        this._groups.apps.push(p);
        continue;
      }

      // Dev runtimes: node, python, java, ruby, go, dotnet, databases, webservers
      const runtime = this.scanner.detectRuntime(p);
      if (runtime !== "other") {
        this._groups.dev.push(p);
        continue;
      }

      // Unknown on common dev port ranges (1024-49000) → apps
      this._groups.apps.push(p);
    }

    // Sort each group by port
    for (const key of Object.keys(this._groups)) {
      this._groups[key].sort((a, b) => a.port - b.port);
    }
  }

  _detectChanges() {
    if (!this._showNotifications) return;

    const currentPorts = new Set(this._ports.map((p) => p.port));

    if (this._previousPorts.size > 0) {
      for (const port of currentPorts) {
        if (!this._previousPorts.has(port)) {
          const entry = this._ports.find((p) => p.port === port);
          vscode.window.showInformationMessage(
            `Port ${port} listening (${entry ? entry.name : "unknown"})`
          );
        }
      }
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
