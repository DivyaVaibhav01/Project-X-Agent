#!/usr/bin/env bun
declare const Bun: any;

import fs from 'fs';
import path from 'path';
import os from 'os';
import { createSession, renderBanner, c, loadConfig, saveConfig, REPO_URL } from './agent.js';

const PORT = Number(process.env?.PORT || 3001);
const PROMPT = `${c.magenta("You")} ${c.gray("›")} `;

function getLocalIP(): string {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return '0.0.0.0';
}

// ✅ FIXED: Added isProcessing to the type definition
type Conn = { buffer: string; session: ReturnType<typeof createSession>; isProcessing: boolean };
const connections = new WeakMap<any, Conn>();
const sessionRefs = new WeakMap<any, any>(); 

const configRoot = process.env.PROJECT_X_ROOT || path.resolve(import.meta.dir, '..');
const envPath = path.join(configRoot, '.env');

let config: any = loadConfig();

if (!config) {
  console.log(c.yellow('\n⚠️  No configuration found. Using environment variables or defaults...\n'));
  
  const apiKey = process.env?.NARAYA_API_KEY || process.env?.OPENAI_API_KEY || '';
  const baseURL = process.env?.BASE_URL || '';
  const modelsInput = process.env?.MODELS || '';
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
    console.log(c.gray('   Required: API_KEY, MODELS'));
    console.log(c.gray('   Optional: BASE_URL'));
    console.log(c.dim(`   📦 ${REPO_URL}`));
    process.exit(1);
  }
} else {
  console.log(c.green('✅ Configuration loaded from .env file'));
  console.log(`   Endpoint: ${c.cyan(config.BASE_URL)}`);
  console.log(`   Models: ${c.cyan(config.MODELS.join(', '))}`);
}

if (!config && fs.existsSync(envPath)) {
  console.log(c.yellow('📂 Found .env in installation folder, reading it now...'));
  const envContent = fs.readFileSync(envPath, 'utf-8');
  const envVars = Object.fromEntries(
    envContent.split('\n').filter(line => line.includes('=')).map(line => {
      const [key, ...value] = line.split('=');
      return [key.trim(), value.join('=').trim()];
    })
  );

  const apiKey = envVars.API_KEY || process.env?.NARAYA_API_KEY || '';
  const baseURL = envVars.BASE_URL || '';
  const modelsInput = envVars.MODELS || '';
  const models = modelsInput.split(',').map((m: string) => m.trim()).filter((m: string) => m.length > 0);

  if (apiKey && models.length > 0) {
    config = {
      API_KEY: apiKey,
      BASE_URL: baseURL,
      MODELS: models
    };
    saveConfig(config); 
    console.log(c.green('✅ Configuration loaded from installation .env file'));
  }
}

const localIP = getLocalIP();

Bun.serve({
  port: PORT,
  hostname: '0.0.0.0',
  fetch(req: any, server: any) {
    const url = new URL(req.url);

    if (url.pathname === "/ws") {
      if (server.upgrade(req)) return;
      return new Response("Upgrade failed", { status: 400 });
    }

    let filePath = url.pathname === "/" ? "/index.html" : url.pathname;
    const fullPath = path.join((import.meta as any).dir as string, "..", "public", filePath);
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
      sessionRefs.set(ws, session);
      
      connections.set(ws, { buffer: "", session, isProcessing: false });
      
      write(renderBanner());
      write(PROMPT);
    },
    
    async message(ws: any, data: any) {
      const conn = connections.get(ws);
      if (!conn) {
        ws.send(c.red('Connection not found'));
        return;
      }

      const text = typeof data === 'string' ? data : new TextDecoder().decode(data);

      if (conn.isProcessing) {
        return; 
      }

      if (text === '\x7f' || text === '\b') { 
        if (conn.buffer.length > 0) {
          conn.buffer = conn.buffer.slice(0, -1);
          ws.send('\b \b'); 
        }
        return;
      }

      if (text === '\x03' || text === '^C') {
        ws.send('\r\n'); 
        ws.send(c.yellow('^C')); 
        conn.buffer = ""; 
        ws.send(PROMPT);
        return;
      }

      if (text === '\r' || text === '\n') {
        const fullLine = conn.buffer.trim();
        conn.buffer = "";

        if (!fullLine) {
          ws.send('\r\n'); 
          ws.send(PROMPT);
          return;
        }

        if (fullLine === 'exit' || fullLine === 'quit') {
          ws.send(c.yellow('👋 Goodbye!\n'));
          ws.close(1000, 'User exit');
          return;
        }

        if (fullLine === 'clear') {
          ws.send('\r\n');
          ws.send('\x1b[2J\x1b[0;0H');
          ws.send(renderBanner());
          ws.send(PROMPT);
          return;
        }

        // Handle reload/reconfig
        if (fullLine === 'reload' || fullLine === 'reconfig') {
          const newConfig = loadConfig();
          if (newConfig) {
            config = newConfig;
            const newSession = createSession({
              write: (s: string) => ws.send(s),
              fs,
              config: config,
            });
            conn.session = newSession;
            sessionRefs.set(ws, newSession);
            ws.send('\r\n');
            ws.send(c.green('✅ Configuration reloaded\n'));
            ws.send(`   Endpoint: ${c.cyan(config.BASE_URL)}\n`);
            ws.send(`   Models: ${c.cyan(config.MODELS.join(', '))}\n\n`);
          } else {
            ws.send('\r\n');
            ws.send(c.red('❌ Failed to reload configuration\n'));
          }
          ws.send(PROMPT);
          return;
        }

        conn.isProcessing = true; 
        ws.send('\r\n');

        try {
          await conn.session.handleLine(fullLine);
        } catch (error: any) {
          ws.send(c.red(`❌ Error: ${error.message}\n`));
        }
        
        conn.isProcessing = false;
        ws.send(PROMPT);
        return;
      }
      conn.buffer += text;
      ws.send(text);
    },
    
    close(ws: any) {
      const session = sessionRefs.get(ws);
      if (session && session.cancelCurrentSession) {
        session.cancelCurrentSession();
      }
      connections.delete(ws);
      sessionRefs.delete(ws);
    },
  },
});

console.log(`\n\x1b[32m✅ Project X Agent web terminal running!\x1b[0m`);
console.log(c.gray(`   📍 Local: http://localhost:${PORT}`));
console.log(c.gray(`   📍 Network: http://${localIP}:${PORT}`));
console.log(c.gray(`   Using ${config.MODELS.length} model${config.MODELS.length > 1 ? 's' : ''}: ${config.MODELS.join(', ')}`));
console.log(c.dim(`   📦 ${REPO_URL}`));
console.log(c.gray(`   Press Ctrl+C to stop the server\n`));
