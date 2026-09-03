declare const Bun: any;
declare const process: any;

declare global {
  interface ImportMeta {
    readonly dir: string;
  }
}

const server = Bun.spawn(["bun", "run", "./server.ts"], {
  stdout: "inherit",
  stderr: "inherit",
  cwd: import.meta.dir,
});

console.log(`\x1b[90m  (web terminal starting in background — check the URL it prints)\x1b[0m\n`);
await new Promise((r) => setTimeout(r, 400));

const cli = Bun.spawn(["bun", "run", "./index.ts"], {
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
  cwd: import.meta.dir,
});

await cli.exited;
server.kill();
process.exit(0);