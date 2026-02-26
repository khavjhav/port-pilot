# Port Pilot — See, Open & Kill Ports

See every port. Know every process. Kill with one click.

**Zero config.** Just install — sidebar appears with all listening ports.

## Features

- **Sidebar panel** — dedicated activity bar icon with all listening ports
- **Process context** — shows process name + PID, not just port numbers
- **Runtime detection** — color-coded: Node.js (green), Python (blue), Database (yellow), etc.
- **One-click actions** — open in browser, copy URL, kill process
- **Port notifications** — toast when ports go up or down
- **Smart filtering** — hides system ports (<1024) by default
- **Auto-refresh** — updates every 5 seconds (configurable)
- **Status bar** — shows active port count
- **Cross-platform** — Windows, macOS, Linux

## Getting Started

1. Install from VS Code Marketplace
2. Look for the Port Pilot icon in the activity bar (left sidebar)
3. All listening ports appear automatically

## Settings

| Setting | Default | Description |
|---------|---------|-------------|
| `portPilot.enable` | `true` | Master on/off |
| `portPilot.refreshInterval` | `5` | Auto-refresh interval (seconds) |
| `portPilot.showNotifications` | `true` | Notify on port up/down |
| `portPilot.ignorePorts` | `[]` | Ports to hide |
| `portPilot.ignoreSystemPorts` | `true` | Hide ports below 1024 |
| `portPilot.groupBy` | `"runtime"` | Group by runtime type or flat list |
| `portPilot.showInStatusBar` | `true` | Show port count in status bar |

## Commands

| Command | Description |
|---------|-------------|
| Port Pilot: Refresh | Manual refresh |
| Open in Browser | Open localhost:PORT in browser |
| Copy URL | Copy localhost:PORT to clipboard |
| Kill Process | Kill by specific PID (with confirmation) |

## Inline Actions

Each port in the sidebar has inline buttons:
- **Globe icon** — open in browser
- **X icon** — kill process (asks for confirmation)

Right-click for more: Copy URL

## How It Works

1. Scans listening TCP ports using platform-native tools
2. Matches processes to runtime types (Node.js, Python, etc.)
3. Auto-refreshes on interval, notifies on changes
4. Kill targets specific PIDs — never blanket kills

### Platform Details

| Platform | Scan Method |
|----------|------------|
| Windows | `Get-NetTCPConnection` + `Get-Process` (PowerShell) |
| macOS | `lsof -iTCP -sTCP:LISTEN` |
| Linux | `ss -tlnp` (fallback: `netstat -tlnp`) |

## License

MIT
