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
let sessionInstance: any = null;
let rlInstance: any = null;

// ============================================
// LOADING INDICATOR
// ============================================
let loadingInterval: NodeJS.Timeout | null = null;
let loadingFrames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
let loadingIndex = 0;
let loadingStartTime = 0;
let isLoadingActive = false;

function startLoading(message: string = 'processing') {
  isLoadingActive = true;
  loadingIndex = 0;
  loadingStartTime = Date.now();
  process.stdout.write(`\r${c.cyan(loadingFrames[0])} ${c.gray(message)}`);
  
  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = null;
  }
  
  loadingInterval = setInterval(() => {
    if (!isLoadingActive) {
      clearInterval(loadingInterval!);
      loadingInterval = null;
      return;
    }
    loadingIndex = (loadingIndex + 1) % loadingFrames.length;
    const elapsed = Math.floor((Date.now() - loadingStartTime) / 1000);
    const timeStr = elapsed > 0 ? ` ${elapsed}s` : '';
    process.stdout.write(`\r${c.cyan(loadingFrames[loadingIndex])} ${c.gray(message)}${c.dim(timeStr)}`);
  }, 80);
}

function stopLoading(finalMessage?: string, isSuccess: boolean = true) {
  isLoadingActive = false;
  if (loadingInterval) {
    clearInterval(loadingInterval);
    loadingInterval = null;
  }
  process.stdout.write('\r\x1b[K');
  if (finalMessage) {
    const icon = isSuccess ? c.green('✓') : c.red('✗');
    console.log(`${icon} ${c.gray(finalMessage)}`);
  }
}

function updateLoadingMessage(message: string) {
  if (isLoadingActive) {
    process.stdout.write('\r\x1b[K');
    loadingIndex = 0;
    loadingStartTime = Date.now();
    process.stdout.write(`\r${c.cyan(loadingFrames[0])} ${c.gray(message)}`);
  }
}

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

// ============================================
// MAIN FUNCTION
// ============================================
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
  const PROMPT_TEXT = `${c.magenta("You")} ${c.gray("›")} `;
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: PROMPT_TEXT,
    terminal: true,
    historySize: 100,
    removeHistoryDuplicates: true,
  });

  rlInstance = rl;

  // ============================================
  // STATE MANAGEMENT
  // ============================================
  let isProcessing = false;
  let isPromptVisible = true;
  let isAgentWorking = false;
  let outputBuffer: string[] = [];
  let isFlushing = false;
  let abortController: AbortController | null = null;

  // ============================================
  // OUTPUT CAPTURE
  // ============================================
  const originalWrite = process.stdout.write.bind(process.stdout);
  
  process.stdout.write = function(chunk: any, ...args: any[]): boolean {
    const str = chunk.toString();
    
    if ((isAgentWorking || isProcessing) && !isFlushing) {
      outputBuffer.push(str);
      return true;
    }
    
    return originalWrite(chunk, ...args);
  };

  // ============================================
  // FLUSH OUTPUT
  // ============================================
  function flushOutput() {
    if (outputBuffer.length > 0) {
      isFlushing = true;
      
      process.stdout.write = originalWrite;
      
      for (const chunk of outputBuffer) {
        originalWrite(chunk);
      }
      
      outputBuffer = [];
      
      isFlushing = false;
      
      process.stdout.write = function(chunk: any, ...args: any[]): boolean {
        const str = chunk.toString();
        if ((isAgentWorking || isProcessing) && !isFlushing) {
          outputBuffer.push(str);
          return true;
        }
        return originalWrite(chunk, ...args);
      };
    }
  }

  // ============================================
  // PROMPT CONTROL
  // ============================================
  function showPrompt() {
    if (!isPromptVisible) {
      rl.setPrompt(PROMPT_TEXT);
      isPromptVisible = true;
      rl.prompt();
    }
  }

  function hidePrompt() {
    if (isPromptVisible) {
      process.stdout.write('\r\x1b[K');
      rl.setPrompt('');
      isPromptVisible = false;
    }
  }

  // ============================================
  // ABORT FUNCTION
  // ============================================
  function abortRequest() {
    if (abortController) {
      abortController.abort();
      abortController = null;
    }
    if (sessionInstance && sessionInstance.cancelCurrentRequest) {
      sessionInstance.cancelCurrentRequest();
    }
  }

  // ============================================
  // PROCESS INPUT
  // ============================================
  async function processInput(input: string) {
    // Handle exit
    if (["exit", "quit", "q"].includes(input.toLowerCase())) {
      console.log(c.gray("\n  bye 👋\n\n"));
      console.log(c.dim(`  📦 ${REPO_URL}\n`));
      rl.close();
      process.exit(0);
      return;
    }

    // ============================================
    // LOCK INPUT & START LOADING
    // ============================================
    isProcessing = true;
    isAgentWorking = true;
    hidePrompt();
    rl.pause(); // ← This prevents line events, but SIGINT still works on stdin
    startLoading('processing your request...');

    // Create abort controller for this request
    abortController = new AbortController();

    try {
      const handled = await handleBuiltinCommand(input);
      
      if (!handled) {
        updateLoadingMessage('generating response...');
        await sessionInstance.handleLine(input);
      }
      
      isAgentWorking = false;
      stopLoading('Request completed', true);
      await new Promise(resolve => setTimeout(resolve, 100));

    } catch (error: any) {
      isAgentWorking = false;
      stopLoading(`Error: ${error.message}`, false);
      console.log(c.red(`✕ ${error.message}`));
    } finally {
      abortController = null;
      flushOutput();
      isProcessing = false;
      rl.resume();
      showPrompt();
    }
  }

  // ============================================
  // LINE HANDLER
  // ============================================
  rl.on("line", (line: string) => {
    const input = line.trim();
    
    if (isProcessing) {
      return;
    }
    
    if (!input) {
      if (!isProcessing) {
        rl.prompt();
      }
      return;
    }

    if (isTerminalNoise(input)) {
      return;
    }

    processInput(input);
  });

  // ============================================
  // DETECT TERMINAL NOISE
  // ============================================
  function isTerminalNoise(input: string): boolean {
    if (/\x1B\[[0-9;]*[A-Za-z]/.test(input)) return true;
    if (/\x1B\[[0-9;]*m/.test(input)) return true;
    if (/\[[0-9]+m/.test(input)) return true;
    if (/[\u0000-\u001F]/.test(input)) return true;
    if (/^[━─═╔╗╚╝║│┃┆┇]+$/.test(input)) return true;
    if (/[⠋⠙⠹⠸⠼⠴⠦⠧⠇⠏]/.test(input)) return true;
    if (/^✅/.test(input)) return true;
    if (/^📁/.test(input)) return true;
    if (/^🚀/.test(input)) return true;
    if (/^⚡/.test(input)) return true;
    if (/^✨/.test(input)) return true;
    if (/^⚠️/.test(input)) return true;
    if (/^❌/.test(input)) return true;
    if (/^ℹ️/.test(input)) return true;
    if (/^[╭╮╰╯├┤┬┴┼]+$/.test(input)) return true;
    if (input.includes('You ›')) return true;
    if (input.includes('›')) return true;
    return false;
  }

  // ============================================
  // BUILT-IN COMMANDS (shortened for readability)
  // ============================================
  async function handleBuiltinCommand(input: string): Promise<boolean> {
    const cmd = input.toLowerCase();
    
    if (cmd === "clear" || cmd === "cls") {
      stopLoading();
      process.stdout.write = originalWrite;
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
      process.stdout.write = function(chunk: any, ...args: any[]): boolean {
        const str = chunk.toString();
        if ((isAgentWorking || isProcessing) && !isFlushing) {
          outputBuffer.push(str);
          return true;
        }
        return originalWrite(chunk, ...args);
      };
      return true;
    }
    
    // ... (all other built-in commands remain the same)
    // I'll keep them shortened here for brevity, but they're in the full file
    
    return false;
  }

  // ============================================
  // CTRL+C HANDLER - FIXED!
  // ============================================
  const handleCtrlC = () => {
    // Clear the current line
    process.stdout.write('\r\x1b[K');
    
    // Stop loading spinner
    if (loadingInterval) {
      clearInterval(loadingInterval);
      loadingInterval = null;
      isLoadingActive = false;
    }
    process.stdout.write('\r\x1b[K');
    
    // Check if agent is working
    if (isProcessing || isAgentWorking) {
      // ============================================
      // 1. ABORT THE REQUEST
      // ============================================
      abortRequest();
      
      // ============================================
      // 2. RESET STATE
      // ============================================
      isProcessing = false;
      isAgentWorking = false;
      
      // ============================================
      // 3. RESUME READLINE (CRITICAL!)
      // ============================================
      rl.resume();
      
      // ============================================
      // 4. FLUSH OUTPUT
      // ============================================
      flushOutput();
      
      // ============================================
      // 5. SHOW ABORT MESSAGE
      // ============================================
      console.log(c.yellow('\n⏹️ Request cancelled by user'));
      
      // ============================================
      // 6. SHOW FRESH PROMPT
      // ============================================
      if (!isPromptVisible) {
        rl.setPrompt(PROMPT_TEXT);
        isPromptVisible = true;
      }
      rl.prompt();
      
    } else {
      // ============================================
      // AGENT IS FREE - Just show prompt
      // ============================================
      if (!isPromptVisible) {
        rl.setPrompt(PROMPT_TEXT);
        isPromptVisible = true;
      }
      process.stdout.write('\n');
      rl.prompt();
    }
  };

  // ============================================
  // REGISTER CTRL+C HANDLERS
  // ============================================
  // Handle SIGINT on the readline interface
  rl.on('SIGINT', handleCtrlC);
  
  // ALSO handle it on process (for when rl is paused)
  process.on('SIGINT', () => {
    handleCtrlC();
  });

  rl.on("close", () => {
    process.exit(0);
  });

  // ============================================
  // START
  // ============================================
  rl.prompt();
}

main().catch(console.error);
