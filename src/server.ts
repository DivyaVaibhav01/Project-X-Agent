#!/usr/bin/env bun
declare const Bun: any;

import fs from 'fs';
import path from 'path';
import os from 'os';
import { createSession, renderBanner, c, loadConfig, saveConfig, REPO_URL } from './agent.js';

const PORT = Number(process.env?.PORT || 3001);
const PROMPT = `${c.magenta("You")} ${c.gray("›")} `;

// Get local IP
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

// Per-connection input buffer
type Conn = { buffer: string; session: ReturnType<typeof createSession> };
const connections = new WeakMap<any, Conn>();
const sessionRefs = new WeakMap<any, any>(); // For abort

// The magic line: Get the installation folder where .env actually lives
const configRoot = process.env.PROJECT_X_ROOT || path.resolve(import.meta.dir, '..');
const envPath = path.join(configRoot, '.env');

// Load configuration
let config = loadConfig();

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
    // CRITICAL: It still fails because loadConfig didn't read the .env file!
    // We must make loadConfig aware of the .env file location.
    
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

// ==============================================
// FIX: Force loadConfig to look at the correct file
// ==============================================
// If you are using a custom loadConfig from agent.js, you must modify that function
// to accept a path, OR you can manually read the .env here and override it:
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
    saveConfig(config); // Make sure saveConfig writes to configRoot, not cwd!
    console.log(c.green('✅ Configuration loaded from installation .env file'));
  }
}
// ==============================================

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
      // Store session reference for abort
      sessionRefs.set(ws, session);
      connections.set(ws, { buffer: "", session });
      write(renderBanner());
      write(PROMPT);
    },
    async message(ws: any, data: any) {
      // ... rest of your code remains exactly the same ...
    },
    close(ws: any) {
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