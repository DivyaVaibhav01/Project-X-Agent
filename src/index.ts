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
// GLOBAL VARIABLES
// ============================================
let isProcessingCommand = false;
let sessionInstance: any = null;
let rlInstance: any = null;

// ============================================
// CTRL+C HANDLER - Clean and simple
// ============================================
const handleCtrlC = () => {
  process.stdout.write('\r\x1b[K');
  
  if (isProcessingCommand) {
    if (sessionInstance && sessionInstance.cancelCurrentRequest) {
      sessionInstance.cancelCurrentRequest();
    }
    isProcessingCommand = false;
    if (rlInstance) {
      rlInstance.prompt();
    }
  } else {
    if (rlInstance) {
      rlInstance.prompt();
    }
  }
};

process.on('SIGINT', () => {
  handleCtrlC();
});

export const ENDPOINT_PRESETS = {
  "1": {
    name: "OpenAI",
    url: "https://api.openai.com/v1",
    description: "OpenAI official API"
  },
  "2": {
    name: "Google Gemini",
    url: "https://generativelanguage.googleapis.com/v1",
    description: "Google Gemini API"
  },
  "3": {
    name: "Nvidia NIM",
    url: "https://integrate.api.nvidia.com/v1",
    description: "Nvidia NIM API"
  },
  "4": {
    name: "Anthropic",
    url: "https://api.anthropic.com/v1",
    description: "Anthropic Claude API"
  },
  "5": {
    name: "Custom",
    url: "",
    description: "Custom endpoint (enter manually)"
  }
};

export const MODEL_PRESETS: Record<string, { name: string; models: string[] }> = {
  "1": {
    name: "OpenAI",
    models: [
      "gpt-5.6-sol",
      "gpt-5.6-terra",
      "gpt-5.6-luna",
      "gpt-5.6-cyber",
      "gpt-5.5",
      "gpt-5.5-pro",
      "gpt-5.4-pro",
      "gpt-5.4-thinking",
      "gpt-5.3-instant",
      "gpt-5.3-chat-latest"
    ]
  },
  "2": {
    name: "Google Gemini",
    models: [
      "gemini-3.6-flash",
      "gemini-3.5-flash",
      "gemini-3.5-flash-lite",
      "gemini-3.5-flash-cyber",
      "gemini-3.1-flash-image",
      "gemini-3.1-flash-lite",
      "gemini-3.1-flash-live",
      "gemini-3.1-pro-preview",
      "gemini-omni-flash-preview",
      "gemini-2.0-flash"
    ]
  },
  "3": {
    name: "Nvidia NIM",
    models: [
      "z-ai/glm-5.2",
      "nvidia/nemotron-3-ultra-550b-a55b",
      "nvidia/nemotron-3-embed-8b-bf16",
      "nvidia/nemotron-3-embed-1b-bf16",
      "minimaxai/minimax-m3",
      "stepfun-ai/step-3.7-flash",
      "meta/muse-glimmer-30b",
      "poolside/laguna-xs-2.1",
      "deepseek-ai/deepseek-v4-pro-0813",
      "deepseek-ai/deepseek-v4-flash-0731",
      "kimi-k3"
    ]
  },
  "4": {
    name: "Anthropic Claude",
    models: [
      "claude-fable-5.1",
      "claude-mythos-5.1",
      "claude-opus-5",
      "claude-fable-5"
    ]
  }
};

async function main() {
  process.stdout.write(renderBanner());

  let config = loadConfig();
  
  if (!config) {
    console.log(c.yellow('\n📝 No configuration found. Let\'s set up Project-X Agent.\n'));
    config = await promptUserForConfig();
    saveConfig(config);
    console.log(c.green('\n✅ Configuration saved! Starting agent...\n'));
  } else {
    console.log(c.green('\n✅ Configuration loaded from .env file'));
    console.log(`   Endpoint: ${c.cyan(config.BASE_URL)}`);
    console.log(`   Models: ${c.cyan(config.MODELS.join(', '))}`);
    console.log(`   Mode: ${config.MODELS.length === 1 ? c.yellow('Single model') : c.yellow(`Race mode (${config.MODELS.length} models)`)}`);
    
    const workingDir = getWorkingDirectory();
    const perms = checkDirectoryPermissions(workingDir);
    console.log(c.gray(`\n   📁 Working directory: ${c.cyan(workingDir)}`));
    console.log(c.gray(`   Permissions: ${perms.readable ? c.green('✓ read') : c.red('✗ read')} | ${perms.writable ? c.green('✓ write') : c.red('✗ write')} | ${perms.executable ? c.green('✓ exec') : c.red('✗ exec')}`));
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

  // ============================================
  // CREATE SESSION
  // ============================================
  sessionInstance = createSession({
    write: (s: string) => process.stdout.write(s),
    fs,
    config: config,
  });

  // ============================================
  // READLINE INTERFACE
  // ============================================
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${c.magenta("You")} ${c.gray("›")} `,
    terminal: true,
    historySize: 100,
    removeHistoryDuplicates: true,
  });

  rlInstance = rl;

  // ============================================
  // READLINE SIGINT HANDLER
  // ============================================
  rl.on('SIGINT', () => {
    handleCtrlC();
  });

  rl.prompt();

  // ============================================
  // LINE HANDLER
  // ============================================
rl.on("line", async (line: string) => {
  const input = line.trim();
  
  if (isProcessingCommand) {
    return;
  }
    
    if (!input) {
      rl.prompt();
      return;
    }
    
    if (["exit", "quit", "q"].includes(input.toLowerCase())) {
      console.log(c.gray("\n  bye 👋\n\n"));
      console.log(c.dim(`  📦 ${REPO_URL}\n`));
      rl.close();
      process.exit(0);
      return;
    }
    
    let handled = false;
    const cmd = input.toLowerCase();

    if (cmd === "clear" || cmd === "cls") {
      console.clear();
      console.log(renderBanner());
      console.log(c.green('\n✅ Configuration loaded from .env file'));
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
      handled = true;
    }
    else if (cmd === "setdir") {
      const parts = input.split(' ');
      if (parts.length < 2) {
        const currentDir = getWorkingDirectory();
        const perms = checkDirectoryPermissions(currentDir);
        console.log(c.yellow(`\n📁 Current working directory: ${c.cyan(currentDir)}`));
        console.log(c.gray(`   Permissions: ${perms.readable ? c.green('✓ read') : c.red('✗ read')} | ${perms.writable ? c.green('✓ write') : c.red('✗ write')} | ${perms.executable ? c.green('✓ exec') : c.red('✗ exec')}`));
        console.log(c.gray('   To change it: setdir <path>'));
        console.log(c.gray('   Example: setdir ~/projects'));
        console.log(c.gray('   Example: setdir /home/user/Documents/code'));
        console.log(c.gray('   (Leave empty to keep current directory)\n'));
        handled = true;
        rl.prompt();
        return;
      }
      
      isProcessingCommand = true;
      const newDir = parts.slice(1).join(' ');
      const resolvedDir = newDir.replace(/^~/, process.env.HOME || '');
      
      const perms = checkDirectoryPermissions(resolvedDir);
      if (!perms.exists) {
        console.log(c.yellow(`\n📁 Directory doesn't exist: ${resolvedDir}`));
        console.log(c.gray('   Would you like to create it? (y/n): '));
        const answer = await new Promise((resolve) => {
          rl.question('', (ans: any) => resolve(ans));
        });
        if (answer === 'y' || answer === 'Y') {
          try {
            fs.mkdirSync(resolvedDir, { recursive: true });
            console.log(c.green(`✅ Directory created: ${resolvedDir}`));
          } catch (error: any) {
            console.log(c.red(`❌ Failed to create directory: ${error.message}`));
            isProcessingCommand = false;
            handled = true;
            rl.prompt();
            return;
          }
        } else {
          console.log(c.yellow('ℹ️ Directory creation cancelled.\n'));
          isProcessingCommand = false;
          handled = true;
          rl.prompt();
          return;
        }
      }
      
      const result = setWorkingDirectory(resolvedDir);
      if (result.success) {
        console.log(c.green(`\n✅ ${result.message}`));
        const newPerms = checkDirectoryPermissions(resolvedDir);
        console.log(c.gray(`   Permissions: ${newPerms.readable ? c.green('✓ read') : c.red('✗ read')} | ${newPerms.writable ? c.green('✓ write') : c.red('✗ write')} | ${newPerms.executable ? c.green('✓ exec') : c.red('✗ exec')}`));
        console.log(c.gray(`   All files will be saved here.\n`));
      } else {
        console.log(c.red(`\n❌ ${result.message}\n`));
      }
      isProcessingCommand = false;
      handled = true;
    }
    else if (cmd === "resetdir" || cmd === "reset") {
      isProcessingCommand = true;
      const result = resetWorkingDirectory();
      if (result.success) {
        console.log(c.green(`\n✅ ${result.message}`));
        const newPerms = checkDirectoryPermissions(getWorkingDirectory());
        console.log(c.gray(`   Permissions: ${newPerms.readable ? c.green('✓ read') : c.red('✗ read')} | ${newPerms.writable ? c.green('✓ write') : c.red('✗ write')} | ${newPerms.executable ? c.green('✓ exec') : c.red('✗ exec')}`));
        console.log(c.gray(`   All files will be saved here.\n`));
      } else {
        console.log(c.red(`\n❌ ${result.message}\n`));
      }
      isProcessingCommand = false;
      handled = true;
    }
    else if (cmd === "reload") {
      isProcessingCommand = true;
      const newConfig = loadConfig();
      if (newConfig) {
        config = newConfig;
        console.log(c.green('✅ Configuration reloaded from .env'));
        console.log(`   Endpoint: ${c.cyan(config.BASE_URL)}`);
        console.log(`   Models: ${c.cyan(config.MODELS.join(', '))}`);
        console.log(c.gray('   Note: You need to restart the session for changes to take full effect.'));
      } else {
        console.log(c.red('❌ Failed to reload configuration. Please check your .env file.'));
      }
      isProcessingCommand = false;
      handled = true;
    }
    else if (cmd === "edit") {
      isProcessingCommand = true;
      
      if (!config) {
        console.log(c.red('❌ No configuration available to edit. Please reconfigure the agent.'));
        isProcessingCommand = false;
        handled = true;
        rl.prompt();
        return;
      }

      console.log(c.cyan('\n✏️ Editing configuration...\n'));
      const editedConfig = await editConfig(config);
      if (JSON.stringify(editedConfig) !== JSON.stringify(config)) {
        saveConfig(editedConfig);
        config = editedConfig;
        console.log(c.green('✅ Configuration saved!'));
        console.log(c.gray('   Note: You need to restart the session for changes to take full effect.'));
      }
      
      isProcessingCommand = false;
      handled = true;
    }
    else if (cmd === "reconfig") {
      isProcessingCommand = true;
      console.log(c.cyan('\n🔄 Reconfiguring...\n'));
      const newConfig = await promptUserForConfig();
      saveConfig(newConfig);
      config = newConfig;
      console.log(c.green('✅ Configuration updated!'));
      console.log(`   Endpoint: ${c.cyan(config.BASE_URL)}`);
      console.log(`   Models: ${c.cyan(config.MODELS.join(', '))}`);
      console.log(c.gray('   Note: You need to restart the session for changes to take full effect.'));
      isProcessingCommand = false;
      handled = true;
    }
    else if (cmd === "examples") {
      if (!config) {
        console.log(c.red('❌ No configuration available. Please configure the agent first.'));
        handled = true;
        rl.prompt();
        return;
      }

      console.log(c.cyan('\n📋 Model examples by provider:'));
      for (const [provider, models] of Object.entries(MODEL_EXAMPLES)) {
        console.log(`   ${c.bold(provider)}: ${c.gray(models.join(', '))}`);
      }
      console.log(c.gray('\n   You can use any model name your endpoint supports'));
      console.log(c.gray(`   Currently using: ${config.MODELS.join(', ')}`));
      console.log(c.dim(`\n   📦 ${REPO_URL}\n`));
      handled = true;
    }
    else if (cmd === "aliases") {
      console.log(c.cyan('\n🔗 Model shortcuts (aliases):'));
      for (const [alias, model] of Object.entries(MODEL_ALIASES)) {
        console.log(`   ${c.gray(alias)} → ${c.cyan(model)}`);
      }
      console.log(c.gray('\n   Type any alias instead of the full model name'));
      console.log(c.dim(`\n   📦 ${REPO_URL}\n`));
      handled = true;
    }

    if (handled) {
      rl.prompt();
      return;
    }

isProcessingCommand = true;
try {
  await sessionInstance.handleLine(line);
} catch (error: any) {
  // Show the actual error
  console.log(c.red(`✕ ${error.message}`));
} finally {
  isProcessingCommand = false;
  rl.prompt();
}
  });

  rl.on("close", () => {
    process.exit(0);
  });
}

main().catch(console.error);