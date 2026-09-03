#!/usr/bin/env bun

declare const Bun: any;
declare const process: any;

declare global {
  interface ImportMeta {
    readonly dir: string;
  }
}

import fs from 'fs';
import path from 'path';

const projectRoot = path.join(import.meta.dir, '..');

// Check if .env exists before starting
const envPath = path.join(projectRoot, '.env');
if (!fs.existsSync(envPath)) {
  console.log('\x1b[33m⚠️  No .env file found. The CLI will prompt for configuration.\x1b[0m\n');
}

// Start server in background
const server = Bun.spawn(["bun", "run", "src/server.ts"], {
  stdout: "inherit",
  stderr: "inherit",
  cwd: projectRoot,
});

console.log(`\x1b[90m  (web terminal starting in background — check the URL it prints)\x1b[0m\n`);

// Give the server enough time to boot
console.log('\x1b[90m  Waiting for server to start...\x1b[0m');
await new Promise((r) => setTimeout(r, 1500));

// Start CLI
console.log('\x1b[90m  Starting CLI...\x1b[0m\n');
const cli = Bun.spawn(["bun", "run", "src/index.ts"], {
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
  cwd: projectRoot,
});

// If CLI exits, kill server too
await cli.exited;
server.kill();
process.exit(0);
