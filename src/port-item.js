// ---------------------------------------------------------------------------
// Port TreeItem — represents a single port entry in the sidebar
// ---------------------------------------------------------------------------
const vscode = require("vscode");

const RUNTIME_ICONS = {
  node: new vscode.ThemeIcon("symbol-event", new vscode.ThemeColor("charts.green")),
  python: new vscode.ThemeIcon("symbol-event", new vscode.ThemeColor("charts.blue")),
  java: new vscode.ThemeIcon("symbol-event", new vscode.ThemeColor("charts.orange")),
  ruby: new vscode.ThemeIcon("symbol-event", new vscode.ThemeColor("charts.red")),
  go: new vscode.ThemeIcon("symbol-event", new vscode.ThemeColor("charts.purple")),
  dotnet: new vscode.ThemeIcon("symbol-event", new vscode.ThemeColor("charts.purple")),
  database: new vscode.ThemeIcon("database", new vscode.ThemeColor("charts.yellow")),
  webserver: new vscode.ThemeIcon("globe", new vscode.ThemeColor("charts.green")),
  other: new vscode.ThemeIcon("plug", new vscode.ThemeColor("foreground")),
};

class PortItem extends vscode.TreeItem {
  /**
   * @param {{port: number, pid: number, name: string, command: string}} entry
   * @param {string} runtime
   */
  constructor(entry, runtime) {
    super(`:${entry.port}`, vscode.TreeItemCollapsibleState.None);
    this.description = `${entry.name} (PID ${entry.pid})`;
    this.tooltip = entry.command || entry.name || `Port ${entry.port}`;
    this.iconPath = RUNTIME_ICONS[runtime] || RUNTIME_ICONS.other;
    this.contextValue = "portEntry";
    this.portEntry = entry;
    this.runtime = runtime;
  }
}

module.exports = PortItem;
