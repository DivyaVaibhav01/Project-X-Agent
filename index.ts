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

// Check for configuration
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

  rl.on("line", async (line: string) => {
    const input = line.trim();
    
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
      handled = true;
    }
    else if (cmd === "edit") {
      console.log(c.cyan('\n✏️ Editing configuration...\n'));
      const editedConfig = await editConfig(config);
      if (JSON.stringify(editedConfig) !== JSON.stringify(config)) {
        saveConfig(editedConfig);
        config = editedConfig;
        console.log(c.green('✅ Configuration saved!'));
        console.log(c.gray('   Note: You need to restart the session for changes to take full effect.'));
      }
      handled = true;
    }
    else if (cmd === "reconfig") {
      console.log(c.cyan('\n🔄 Reconfiguring...\n'));
      const newConfig = await promptUserForConfig();
      saveConfig(newConfig);
      config = newConfig;
      console.log(c.green('✅ Configuration updated!'));
      console.log(`   Endpoint: ${c.cyan(config.BASE_URL)}`);
      console.log(`   Models: ${c.cyan(config.MODELS.join(', '))}`);
      console.log(c.gray('   Note: You need to restart the session for changes to take full effect.'));
      handled = true;
    }
    else if (cmd === "examples") {
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