declare const require: any;
declare const process: any;
declare const Bun: any;
const fs = require("node:fs");
const path = require("node:path");

import { createSession, renderBanner, c, loadConfig, promptUserForConfig, saveConfig, REPO_URL } from "./agent";

const PORT = Number(process.env?.PORT || 30001);
const PROMPT = `${c.magenta("You")} ${c.gray("›")} `;

// Per-connection input buffer
type Conn = { buffer: string; session: ReturnType<typeof createSession> };
const connections = new WeakMap<any, Conn>();

// Load configuration
let config = loadConfig();

if (!config) {
  console.log(c.yellow('\n⚠️  No configuration found. Using environment variables or defaults...\n'));
  
  const apiKey = process.env?.NARAYA_API_KEY || process.env?.OPENAI_API_KEY || '';
  const baseURL = process.env?.BASE_URL || 'https://router.bynara.id/v1';
  const modelsInput = process.env?.MODELS || 'gpt-4,claude-3-opus';
  const models = modelsInput.split(',').map((m: string) => m.trim()).filter((m: string) => m.length > 0);
  
  if (apiKey && models.length > 0) {
    config = {
      API_KEY: apiKey,
      BASE_URL: baseURL,
      MODELS: models
    };
    saveConfig(config);
    console.log(c.green('✅ Configuration created from environment variables'));
  } else {
    console.log(c.red('❌ No configuration found. Please set environment variables or run the CLI first.'));
    console.log(c.gray('   Required: NARAYA_API_KEY, MODELS'));
    console.log(c.gray('   Optional: BASE_URL (default: https://router.bynara.id/v1)'));
    console.log(c.dim(`   📦 ${REPO_URL}`));
    process.exit(1);
  }
} else {
  console.log(c.green('✅ Configuration loaded from .env file'));
  console.log(`   Endpoint: ${c.cyan(config.BASE_URL)}`);
  console.log(`   Models: ${c.cyan(config.MODELS.join(', '))}`);
}

Bun.serve({
  port: PORT,
  fetch(req: any, server: any) {
    const url = new URL(req.url);

    if (url.pathname === "/ws") {
      if (server.upgrade(req)) return;
      return new Response("Upgrade failed", { status: 400 });
    }

    let filePath = url.pathname === "/" ? "/index.html" : url.pathname;
    const fullPath = path.join((import.meta as any).dir as string, "public", filePath);
    if (fs.existsSync(fullPath) && fs.statSync(fullPath).isFile()) {
      return new Response(Bun.file(fullPath));
    }
    return new Response("Not found", { status: 404 });
  },
  websocket: {
    open(ws: any) {
      const write = (s: string) => ws.send(s);
      const session = createSession({
        write,
        fs,
        config: config,
      });
      connections.set(ws, { buffer: "", session });
      write(renderBanner());
      write(PROMPT);
    },
    async message(ws: any, data: any) {
      const conn = connections.get(ws);
      if (!conn) return;
      const input = data.toString();

      for (const ch of input) {
        if (ch === "\r" || ch === "\n") {
          ws.send("\r\n");
          const line = conn.buffer;
          conn.buffer = "";
          if (["exit", "quit"].includes(line.trim().toLowerCase())) {
            ws.send(c.gray("\n  bye 👋\n\n"));
            ws.send(c.dim(`  📦 ${REPO_URL}\n`));
            ws.close();
            return;
          }
          await conn.session.handleLine(line);
          ws.send(PROMPT);
        } else if (ch === "\u007f" || ch === "\b") {
          if (conn.buffer.length > 0) {
            conn.buffer = conn.buffer.slice(0, -1);
            ws.send("\b \b");
          }
        } else if (ch.charCodeAt(0) >= 32) {
          conn.buffer += ch;
          ws.send(ch);
        }
      }
    },
    close(ws: any) {
      connections.delete(ws);
    },
  },
});

console.log(`\n🚀 Project X web terminal running at http://localhost:${PORT}`);
console.log(c.gray(`   Using ${config.MODELS.length} model${config.MODELS.length > 1 ? 's' : ''}: ${config.MODELS.join(', ')}`));
console.log(c.dim(`   📦 ${REPO_URL}`));
console.log(c.gray(`   Press Ctrl+C to stop the server\n`));