// ---------------------------------------------------------------------------
// Cross-platform port scanner — finds listening TCP ports with process info
// ---------------------------------------------------------------------------
const { exec } = require("child_process");

class PortScanner {
  constructor() {
    this.platform = process.platform;
  }

  /**
   * Scan for listening TCP ports.
   * @returns {Promise<Array<{port: number, pid: number, name: string, command: string}>>}
   */
  scan() {
    if (this.platform === "win32") return this._scanWindows();
    if (this.platform === "darwin") return this._scanMac();
    return this._scanLinux();
  }

  _scanWindows() {
    return new Promise((resolve) => {
      // Use $(if(){}) subexpression — plain if() as hashtable value needs PS7+
      const cmd = `powershell -NoProfile -Command "Get-NetTCPConnection -State Listen -ErrorAction SilentlyContinue | ForEach-Object { $proc = Get-Process -Id $_.OwningProcess -ErrorAction SilentlyContinue; [PSCustomObject]@{Port=$_.LocalPort; PID=$_.OwningProcess; Name=$(if($proc){$proc.ProcessName}else{'unknown'}); Path=$(if($proc){$proc.Path}else{''})} } | ConvertTo-Json -Compress"`;

      exec(cmd, { windowsHide: true, timeout: 15000 }, (err, stdout) => {
        if (err) return resolve([]);
        try {
          const raw = JSON.parse(stdout || "[]");
          const entries = Array.isArray(raw) ? raw : [raw];
          // Deduplicate by port
          const seen = new Set();
          const result = [];
          for (const e of entries) {
            if (!e || !e.Port || seen.has(e.Port)) continue;
            seen.add(e.Port);
            result.push({
              port: e.Port,
              pid: e.PID || 0,
              name: e.Name || "unknown",
              command: e.Path || "",
            });
          }
          resolve(result.sort((a, b) => a.port - b.port));
        } catch {
          resolve([]);
        }
      });
    });
  }

  _scanMac() {
    return new Promise((resolve) => {
      exec(
        "lsof -iTCP -sTCP:LISTEN -nP -Fn -Fp 2>/dev/null",
        { timeout: 10000 },
        (err, stdout) => {
          if (err) return resolve([]);
          resolve(this._parseLsof(stdout));
        }
      );
    });
  }

  _scanLinux() {
    return new Promise((resolve) => {
      exec(
        "ss -tlnp 2>/dev/null || netstat -tlnp 2>/dev/null",
        { timeout: 10000 },
        (err, stdout) => {
          if (err) return resolve([]);
          resolve(this._parseSsNetstat(stdout));
        }
      );
    });
  }

  _parseLsof(output) {
    const entries = [];
    const seen = new Set();
    let currentName = "";
    let currentPid = 0;

    for (const line of output.split("\n")) {
      if (line.startsWith("n")) {
        const match = line.match(/:(\d+)$/);
        if (match) {
          const port = parseInt(match[1], 10);
          if (!seen.has(port)) {
            seen.add(port);
            entries.push({
              port,
              pid: currentPid,
              name: currentName,
              command: "",
            });
          }
        }
      } else if (line.startsWith("p")) {
        currentPid = parseInt(line.slice(1), 10) || 0;
      } else if (line.startsWith("n") === false && line.length > 1) {
        // Could be process name line
      }
    }
    return entries.sort((a, b) => a.port - b.port);
  }

  _parseSsNetstat(output) {
    const entries = [];
    const seen = new Set();

    for (const line of output.split("\n")) {
      // ss format: LISTEN  0  128  0.0.0.0:3000  0.0.0.0:*  users:(("node",pid=1234,fd=17))
      const ssMatch = line.match(
        /LISTEN\s+\d+\s+\d+\s+\S+:(\d+)\s+.*users:\(\("([^"]+)",pid=(\d+)/
      );
      if (ssMatch) {
        const port = parseInt(ssMatch[1], 10);
        if (!seen.has(port)) {
          seen.add(port);
          entries.push({
            port,
            pid: parseInt(ssMatch[3], 10),
            name: ssMatch[2],
            command: "",
          });
        }
        continue;
      }

      // netstat format: tcp  0  0  0.0.0.0:3000  0.0.0.0:*  LISTEN  1234/node
      const netMatch = line.match(
        /LISTEN\s+(\d+)\/(\S+)\s*$/
      );
      const portMatch = line.match(/:(\d+)\s/);
      if (netMatch && portMatch) {
        const port = parseInt(portMatch[1], 10);
        if (!seen.has(port)) {
          seen.add(port);
          entries.push({
            port,
            pid: parseInt(netMatch[1], 10),
            name: netMatch[2],
            command: "",
          });
        }
      }
    }
    return entries.sort((a, b) => a.port - b.port);
  }

  /**
   * Detect runtime type from process name/path.
   * @param {{name: string, command: string}} entry
   * @returns {string}
   */
  detectRuntime(entry) {
    const n = (entry.name || "").toLowerCase();
    const c = (entry.command || "").toLowerCase();
    if (n === "node" || n === "node.exe" || c.includes("node")) return "node";
    if (n.startsWith("python") || c.includes("python")) return "python";
    if (n === "java" || n === "java.exe" || c.includes("java")) return "java";
    if (n === "ruby" || c.includes("ruby")) return "ruby";
    if (n === "go" || c.includes("go")) return "go";
    if (n === "dotnet" || c.includes("dotnet")) return "dotnet";
    if (n === "postgres" || n === "mysqld" || n === "mongod" || n === "redis-server") return "database";
    if (n === "nginx" || n === "apache" || n === "httpd") return "webserver";
    return "other";
  }
}

module.exports = PortScanner;
