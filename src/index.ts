import { 
  createSession, 
  renderBanner, 
  c, 
  loadConfig, 
  promptUserForConfig, 
  saveConfig, 
  MODEL_EXAMPLES, 
  MODEL_ALIASES,
  editConfig,
  REPO_URL,
  getWorkingDirectory,
  setWorkingDirectory,
  resetWorkingDirectory,
  checkDirectoryPermissions
} from "./agent.js";

const readline = require("node:readline");
const fs = require("node:fs");

// ============================================
// STATE
// ============================================
let sessionInstance: any = null;
let rlInstance: any = null;
let isProcessing = false;
let config: any = null;

// ============================================
// LOADING SPINNER
// ============================================
let spinnerInterval: any = null;
const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
let frameIndex = 0;
let startTime = 0;
let isSpinnerActive = false;

function startSpinner(message: string = "processing...") {
  if (spinnerInterval) {
    clearInterval(spinnerInterval);
    spinnerInterval = null;
  }
  
  isSpinnerActive = true;
  frameIndex = 0;
  startTime = Date.now();
  
  process.stdout.write(`\r${c.cyan(frames[0])} ${c.gray(message)}`);
  
  spinnerInterval = setInterval(() => {
    if (!isSpinnerActive) {
      clearInterval(spinnerInterval);
      spinnerInterval = null;
      return;
    }
    frameIndex = (frameIndex + 1) % frames.length;
    const elapsed = Math.floor((Date.now() - startTime) / 1000);
    const timeStr = elapsed > 0 ? ` ${elapsed}s` : "";
    process.stdout.write(`\r${c.cyan(frames[frameIndex])} ${c.gray(message)}${c.dim(timeStr)}`);
  }, 80);
}

function stopSpinner(finalMessage?: string, isSuccess: boolean = true) {
  isSpinnerActive = false;
  if (spinnerInterval) {
    clearInterval(spinnerInterval);
    spinnerInterval = null;
  }
  process.stdout.write("\r\x1b[K");
  if (finalMessage) {
    const icon = isSuccess ? c.green("✓") : c.red("✗");
    console.log(`${icon} ${c.gray(finalMessage)}`);
  }
}

function updateSpinnerMessage(message: string) {
  if (isSpinnerActive) {
    process.stdout.write(`\r${c.cyan(frames[0])} ${c.gray(message)}`);
  }
}

// ============================================
// CTRL+C HANDLER
// ============================================
// Update the handleCtrlC function
const handleCtrlC = () => {
  process.stdout.write("\r\x1b[K");
  
  if (spinnerInterval) {
    clearInterval(spinnerInterval);
    spinnerInterval = null;
    isSpinnerActive = false;
  }
  process.stdout.write("\r\x1b[K");
  
  // ⭐ NEW: Cancel any ongoing prompt (like edit)
  if (sessionInstance && sessionInstance.abortCurrentPrompt) {
    sessionInstance.abortCurrentPrompt();
  }
  
  if (isProcessing) {
    if (sessionInstance && sessionInstance.cancelCurrentRequest) {
      sessionInstance.cancelCurrentRequest();
    }
    isProcessing = false;
    console.log(c.yellow("\n  ⏹️ Cancelled"));
  }
  
  if (rlInstance) {
    rlInstance.prompt();
  }
};

// Process level handler
process.on("SIGINT", handleCtrlC);

// ============================================
// COMMANDS
// ============================================
async function handleBuiltinCommand(input: string): Promise<boolean> {
  const cmd = input.toLowerCase();
  
  // ── CLEAR ──
  if (cmd === "clear" || cmd === "cls") {
    console.clear();
    console.log(renderBanner());
    console.log(c.green("\n✅ Configuration loaded from .env file"));
    console.log(`   Endpoint: ${c.cyan(config.BASE_URL)}`);
    console.log(`   Models: ${c.cyan(config.MODELS.join(", "))}`);
    console.log(`   Mode: ${config.MODELS.length === 1 ? c.yellow("Single model") : c.yellow(`Race mode (${config.MODELS.length} models)`)}`);
    const workingDir = getWorkingDirectory();
    const perms = checkDirectoryPermissions(workingDir);
    console.log(c.gray(`\n   📁 Working directory: ${c.cyan(workingDir)}`));
    console.log(c.gray(`   Permissions: ${perms.readable ? c.green("✓ read") : c.red("✗ read")} | ${perms.writable ? c.green("✓ write") : c.red("✗ write")} | ${perms.executable ? c.green("✓ exec") : c.red("✗ exec")}`));
    console.log(c.gray('\n   Type "setdir" to view current directory'));
    console.log(c.gray('   Type "setdir <path>" to change it (optional)'));
    console.log(c.gray('   Type "resetdir" to reset to default codespace folder'));
    console.log(c.gray('   Type "clear" to clear the screen'));
    console.log(c.gray('   Type "reload" to reload configuration from .env'));
    console.log(c.gray('   Type "edit" to edit configuration'));
    console.log(c.gray('   Type "reconfig" to reconfigure the agent'));
    console.log(c.gray('   Type "examples" to see model examples'));
    console.log(c.gray('   Type "aliases" to see model shortcuts'));
    console.log(c.gray(`   📦 Report issues or contribute: ${REPO_URL}\n`));
    return true;
  }
  
  // ── EDIT ──
if (cmd === "edit") {
    if (!config) {
      console.log(c.red("❌ No configuration available. Please reconfigure the agent."));
      return true;
    }

    // ⭐ Set processing flag
    isProcessing = true;
    
    try {
      console.log(c.cyan("\n✏️ Editing configuration...\n"));
      const editedConfig = await editConfig(config);
      if (JSON.stringify(editedConfig) !== JSON.stringify(config)) {
        saveConfig(editedConfig);
        Object.assign(config, editedConfig);
        console.log(c.green("✅ Configuration saved!"));
        console.log(c.gray("   Note: You need to restart the session for changes to take full effect."));
      }
    } catch (error: any) {
      // ⭐ Handle cancellation - don't show error message
      if (error.message === 'Input cancelled by user') {
        // Already handled in agent.ts, just continue
      } else {
        console.log(c.red(`✕ ${error.message}`));
      }
    } finally {
      // ⭐ ALWAYS reset processing flag
      isProcessing = false;
    }
    return true;
  }
  
  // ── SETDIR ──
  if (cmd === "setdir") {
    const parts = input.split(" ");
    if (parts.length < 2) {
      const currentDir = getWorkingDirectory();
      const perms = checkDirectoryPermissions(currentDir);
      console.log(c.yellow(`\n📁 Current working directory: ${c.cyan(currentDir)}`));
      console.log(c.gray(`   Permissions: ${perms.readable ? c.green("✓ read") : c.red("✗ read")} | ${perms.writable ? c.green("✓ write") : c.red("✗ write")} | ${perms.executable ? c.green("✓ exec") : c.red("✗ exec")}`));
      console.log(c.gray('   To change it: setdir <path>'));
      console.log(c.gray('   Example: setdir ~/projects'));
      console.log(c.gray('   (Leave empty to keep current directory)\n'));
      return true;
    }
    
    isProcessing = true;
    const newDir = parts.slice(1).join(" ");
    const resolvedDir = newDir.replace(/^~/, process.env.HOME || "");
    const result = setWorkingDirectory(resolvedDir);
    if (result.success) {
      console.log(c.green(`\n✅ ${result.message}`));
      const newPerms = checkDirectoryPermissions(resolvedDir);
      console.log(c.gray(`   Permissions: ${newPerms.readable ? c.green("✓ read") : c.red("✗ read")} | ${newPerms.writable ? c.green("✓ write") : c.red("✗ write")} | ${newPerms.executable ? c.green("✓ exec") : c.red("✗ exec")}`));
    } else {
      console.log(c.red(`\n❌ ${result.message}\n`));
    }
    isProcessing = false;
    return true;
  }
  
  // ── RESETDIR ──
  if (cmd === "resetdir" || cmd === "reset") {
    isProcessing = true;
    const result = resetWorkingDirectory();
    if (result.success) {
      console.log(c.green(`\n✅ ${result.message}`));
      const newPerms = checkDirectoryPermissions(getWorkingDirectory());
      console.log(c.gray(`   Permissions: ${newPerms.readable ? c.green("✓ read") : c.red("✗ read")} | ${newPerms.writable ? c.green("✓ write") : c.red("✗ write")} | ${newPerms.executable ? c.green("✓ exec") : c.red("✗ exec")}`));
    } else {
      console.log(c.red(`\n❌ ${result.message}\n`));
    }
    isProcessing = false;
    return true;
  }
  
  // ── RELOAD ──
  if (cmd === "reload") {
    isProcessing = true;
    const newConfig = loadConfig();
    if (newConfig) {
      Object.assign(config, newConfig);
      console.log(c.green("✅ Configuration reloaded from .env"));
      console.log(`   Endpoint: ${c.cyan(config.BASE_URL)}`);
      console.log(`   Models: ${c.cyan(config.MODELS.join(", "))}`);
      console.log(c.gray("   Note: You need to restart the session for changes to take full effect."));
    } else {
      console.log(c.red("❌ Failed to reload configuration. Please check your .env file."));
    }
    isProcessing = false;
    return true;
  }
  
  // ── RECONFIG ──
  if (cmd === "reconfig") {
    isProcessing = true;
    console.log(c.cyan("\n🔄 Reconfiguring...\n"));
    const newConfig = await promptUserForConfig();
    saveConfig(newConfig);
    Object.assign(config, newConfig);
    console.log(c.green("✅ Configuration updated!"));
    console.log(`   Endpoint: ${c.cyan(config.BASE_URL)}`);
    console.log(`   Models: ${c.cyan(config.MODELS.join(", "))}`);
    console.log(c.gray("   Note: You need to restart the session for changes to take full effect."));
    isProcessing = false;
    return true;
  }
  
  // ── EXAMPLES ──
  if (cmd === "examples") {
    console.log(c.cyan("\n📋 Model examples by provider:"));
    for (const [provider, models] of Object.entries(MODEL_EXAMPLES)) {
      console.log(`   ${c.bold(provider)}: ${c.gray(models.join(", "))}`);
    }
    console.log(c.gray("\n   You can use any model name your endpoint supports"));
    console.log(c.gray(`   Currently using: ${config.MODELS.join(", ")}`));
    console.log(c.dim(`\n   📦 ${REPO_URL}\n`));
    return true;
  }
  
  // ── ALIASES ──
  if (cmd === "aliases") {
    console.log(c.cyan("\n🔗 Model shortcuts (aliases):"));
    for (const [alias, model] of Object.entries(MODEL_ALIASES)) {
      console.log(`   ${c.gray(alias)} → ${c.cyan(model)}`);
    }
    console.log(c.gray("\n   Type any alias instead of the full model name"));
    console.log(c.dim(`\n   📦 ${REPO_URL}\n`));
    return true;
  }
  
  return false;
}

// ============================================
// MAIN
// ============================================
async function main() {
  process.stdout.write(renderBanner());

  config = loadConfig();
  
  if (!config) {
    console.log(c.yellow("\n📝 No configuration found. Let's set up Project-X Agent.\n"));
    config = await promptUserForConfig();
    saveConfig(config);
    console.log(c.green("\n✅ Configuration saved! Starting agent...\n"));
  } else {
    console.log(c.green("\n✅ Configuration loaded from .env file"));
    console.log(`   Endpoint: ${c.cyan(config.BASE_URL)}`);
    console.log(`   Models: ${c.cyan(config.MODELS.join(", "))}`);
    console.log(`   Mode: ${config.MODELS.length === 1 ? c.yellow("Single model") : c.yellow(`Race mode (${config.MODELS.length} models)`)}`);
    
    const workingDir = getWorkingDirectory();
    const perms = checkDirectoryPermissions(workingDir);
    console.log(c.gray(`\n   📁 Working directory: ${c.cyan(workingDir)}`));
    console.log(c.gray(`   Permissions: ${perms.readable ? c.green("✓ read") : c.red("✗ read")} | ${perms.writable ? c.green("✓ write") : c.red("✗ write")} | ${perms.executable ? c.green("✓ exec") : c.red("✗ exec")}`));
    console.log(c.gray('\n   Type "setdir" to view current directory'));
    console.log(c.gray('   Type "setdir <path>" to change it (optional)'));
    console.log(c.gray('   Type "resetdir" to reset to default codespace folder'));
    console.log(c.gray('   Type "clear" to clear the screen'));
    console.log(c.gray('   Type "reload" to reload configuration from .env'));
    console.log(c.gray('   Type "edit" to edit configuration'));
    console.log(c.gray('   Type "reconfig" to reconfigure the agent'));
    console.log(c.gray('   Type "examples" to see model examples'));
    console.log(c.gray('   Type "aliases" to see model shortcuts'));
    console.log(c.gray(`   📦 Report issues or contribute: ${REPO_URL}\n`));
  }

  sessionInstance = createSession({
    write: (s: string) => process.stdout.write(s),
    fs,
    config: config,
  });

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${c.magenta("You")} ${c.gray("›")} `,
    terminal: true,
    historySize: 100,
    removeHistoryDuplicates: true,
  });

  rlInstance = rl;

  // ── Ctrl+C handler ──
  rl.on("SIGINT", handleCtrlC);

  rl.prompt();

  // ── Line handler ──
  rl.on("line", async (line: string) => {
    const input = line.trim();
    
    if (isProcessing) {
      return;
    }
    
    if (!input) {
      rl.prompt();
      return;
    }
    
    // ── Exit ──
    if (["exit", "quit", "q"].includes(input.toLowerCase())) {
      console.log(c.gray("\n  bye 👋\n\n"));
      console.log(c.dim(`  📦 ${REPO_URL}\n`));
      rl.close();
      process.exit(0);
      return;
    }
    
    // ── Check built-in commands ──
    const handled = await handleBuiltinCommand(input);
    if (handled) {
      rl.prompt();
      return;
    }
    
    // ── Send to AI ──
    isProcessing = true;
    startSpinner("processing...");
    
    try {
      await sessionInstance.handleLine(input);
      stopSpinner("Request completed", true);
    } catch (error: any) {
      stopSpinner(`Error: ${error.message}`, false);
      console.log(c.red(`✕ ${error.message}`));
    } finally {
      isProcessing = false;
      rl.prompt();
    }
  });

  rl.on("close", () => {
    process.exit(0);
  });
}

main().catch(console.error);
