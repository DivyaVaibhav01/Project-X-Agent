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
  REPO_URL
} from "./agent";

const readline = require("node:readline");
const fs = require("node:fs");

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
      "gpt-5.6-sol",        // Flagship model
      "gpt-5.6-terra",      // Balanced everyday work
      "gpt-5.6-luna",       // Fastest, most cost-efficient
      "gpt-5.6-cyber",      // Specialized cybersecurity
      "gpt-5.5",            // Released April 2026
      "gpt-5.5-pro",        // Premium version
      "gpt-5.4-pro",        // Highest capability
      "gpt-5.4-thinking",   // Complex reasoning tasks
      "gpt-5.3-instant",    // Fast everyday work
      "gpt-5.3-chat-latest" // API stable version
    ]
  },
  "2": {
    name: "Google Gemini",
    models: [
      "gemini-3.6-flash",          // Latest Flash (July 2026)
      "gemini-3.5-flash",          // Most intelligent agentic
      "gemini-3.5-flash-lite",     // Fastest, cheapest
      "gemini-3.5-flash-cyber",    // Cybersecurity specialized
      "gemini-3.1-flash-image",    // Native visual model
      "gemini-3.1-flash-lite",     // Speed & cost efficiency
      "gemini-3.1-flash-live",     // Real-time audio-to-audio
      "gemini-3.1-pro-preview",    // Latest Gemini 3 series
      "gemini-omni-flash-preview", // High-speed video generation
      "gemini-2.0-flash"           // Stable legacy model
    ]
  },
  "3": {
    name: "Nvidia NIM",
    models: [
      "z-ai/glm-5.2",                          // Latest GLM
      "nvidia/nemotron-3-ultra-550b-a55b",     // Ultra-large model
      "nvidia/nemotron-3-embed-8b-bf16",       // Best embedding model
      "nvidia/nemotron-3-embed-1b-bf16",       // Efficient embedding
      "minimaxai/minimax-m3",                  // Capable reasoner
      "stepfun-ai/step-3.7-flash",             // Fast Flash model
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
      "claude-fable-5.1",    // Most advanced coding & knowledge work
      "claude-mythos-5.1",   // Restricted for cybersecurity/life sciences
      "claude-opus-5",       // Previous flagship
      "claude-fable-5"       // Previous generation
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
    console.log(c.gray('\n   Type "reload" to reload configuration from .env'));
    console.log(c.gray('   Type "edit" to edit configuration'));
    console.log(c.gray('   Type "reconfig" to reconfigure the agent'));
    console.log(c.gray('   Type "examples" to see model examples'));
    console.log(c.gray('   Type "aliases" to see model shortcuts'));
    console.log(c.gray(`   📦 Report issues or contribute: ${REPO_URL}\n`));
  }

  const session = createSession({
    write: (s: string) => process.stdout.write(s),
    fs,
    config: config,
  });


  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    prompt: `${c.magenta("You")} ${c.gray("›")} `,
  });
  rl.prompt();

  // Flag to track if we're in a command that needs to block AI
  let isProcessingCommand = false;

  rl.on("line", async (line: string) => {
    const input = line.trim();
    
    // If we're processing a command, ignore any additional input
    if (isProcessingCommand) {
      return;
    }
    
    // Check for exit/quit first
    if (["exit", "quit", "q"].includes(input.toLowerCase())) {
      console.log(c.gray("\n  bye 👋\n\n"));
      console.log(c.dim(`  📦 ${REPO_URL}\n`));
      rl.close();
      process.exit(0);
      return;
    }
    
    // Handle special commands
    let handled = false;
    const cmd = input.toLowerCase();
    
    if (cmd === "reload") {
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

    // If the command was handled, skip sending to AI
    if (handled) {
      rl.prompt();
      return;
    }
    
    // Send to AI
    await session.handleLine(line);
    rl.prompt();
  });

  rl.on("close", () => {
    process.stdout.write(c.gray("\n  bye 👋\n\n"));
    console.log(c.dim(`  📦 ${REPO_URL}\n`));
    process.exit(0);
  });
}

// Run the main function
main().catch(console.error);
