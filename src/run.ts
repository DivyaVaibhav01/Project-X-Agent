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

// 1. Installation folder (Absolute)
const projectRoot = path.resolve(import.meta.dir, '..');
// 2. User's current folder (Absolute)
const userWorkingDir = process.cwd();

// Check if .env exists in installation folder
const envPath = path.join(projectRoot, '.env');
if (!fs.existsSync(envPath)) {
  console.log('\x1b[33m⚠️  No .env file found. The CLI will prompt for configuration.\x1b[0m\n');
}

// Start server in background -> Use Absolute path and projectRoot as cwd
console.log(`\x1b[90m  Starting server from: ${projectRoot}\x1b[0m`);
const server = Bun.spawn(["bun", "run", path.join(projectRoot, "src", "server.ts")], {
  stdout: "inherit",
  stderr: "inherit",
  cwd: userWorkingDir,
  env: {
    ...process.env,
    PROJECT_X_ROOT: projectRoot,
  },
});

console.log(`\x1b[90m  (web terminal starting in background — check the URL it prints)\x1b[0m\n`);

// Give the server enough time to boot
console.log('\x1b[90m  Waiting for server to start...\x1b[0m');
await new Promise((r) => setTimeout(r, 5000));

// Start CLI -> Use Absolute path and userWorkingDir as cwd
console.log(`\x1b[90m  Starting CLI in: ${userWorkingDir}\x1b[0m\n`);
const cli = Bun.spawn(["bun", "run", path.join(projectRoot, "src", "index.ts")], {
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
  cwd: userWorkingDir,
  env: {
    ...process.env,
    PROJECT_X_ROOT: projectRoot,
  },
});

// If CLI exits, kill server too
await cli.exited;
server.kill();
process.exit(0);