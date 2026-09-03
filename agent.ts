import OpenAI from "openai";
import fs from "fs";
import path from "path";

// Color utilities
export const c = {
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  blue: (s: string) => `\x1b[34m${s}\x1b[0m`,
  magenta: (s: string) => `\x1b[35m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  gray: (s: string) => `\x1b[90m${s}\x1b[0m`,
  boldWhite: (s: string) => `\x1b[1m\x1b[97m${s}\x1b[0m`,
};

export const BRAND = "Project-X Agent";
export const TAGLINE = "a compile of multiple modules, made by Vaibhav Dev";
export const REPO_URL = "https://github.com/DivyaVaibhav01/Project-X-Agent";

// Model aliases - map user-friendly names to actual model names
export const MODEL_ALIASES: Record<string, string> = {
  "laguna-s": "laguna-s-2.1",
  "laguna-s-2": "laguna-s-2.1",
  "laguna": "laguna-s-2.1",
  "agnes": "agnes-2.5-flash",
  "agnes-2": "agnes-2.5-flash",
  "agnes-flash": "agnes-2.5-flash",
  "mistral": "mistral-large",
  "mistral-l": "mistral-large",
  "mistral-m": "mistral-medium-3-5",
  "qwen": "qwen3.8-27b",
  "qwen-27b": "qwen3.8-27b",
  "minimax": "minimax-m3-free",
  "m3": "minimax-m3-free",
  "muse": "muse-spark-1.2-contributor-free",
  "muse-spark": "muse-spark-1.2-contributor-free",
  "stepfun": "stepfun-3.7-flash",
  "step": "stepfun-3.7-flash",
};

export const MODEL_EXAMPLES = {
  "OpenAI": ["gpt-4", "gpt-4-turbo", "gpt-3.5-turbo"],
  "Anthropic": ["claude-3-opus", "claude-3-sonnet", "claude-3-haiku"],
  "Google": ["gemini-pro", "gemini-1.5-pro", "gemini-1.5-flash"],
  "Mistral": ["mistral-large", "mistral-medium", "mistral-small"],
  "Meta": ["llama-3-70b", "llama-3-8b"],
  "Cohere": ["command-r", "command-r-plus"],
  "Laguna": ["laguna-s-2.1", "laguna-s"],
  "Other": ["mixtral-8x7b", "phi-3", "qwen-72b", "agnes-2.5-flash"]
};

export const RATE_LIMIT = { max: 5, windowMs: 60_000 };

// Parse models from input
export function parseModels(input: string): string[] {
  const parts = input.split(/[\s,]+/);
  const uniqueModels = parts
    .map(m => m.trim())
    .filter(m => m.length > 0);
  
  const seen = new Set<string>();
  const result: string[] = [];
  for (const model of uniqueModels) {
    if (!seen.has(model)) {
      seen.add(model);
      result.push(model);
    }
  }
  return result;
}

// Resolve model aliases
export function resolveModelAliases(models: string[]): string[] {
  const resolved: string[] = [];
  const aliasMap: Record<string, string> = {};
  
  for (const model of models) {
    const trimmed = model.trim().toLowerCase();
    if (MODEL_ALIASES[trimmed]) {
      const resolvedName = MODEL_ALIASES[trimmed];
      aliasMap[model] = resolvedName;
      resolved.push(resolvedName);
    } else {
      resolved.push(model.trim());
    }
  }
  
  const aliasEntries = Object.entries(aliasMap);
  if (aliasEntries.length > 0) {
    console.log(c.dim('\n🔍 Resolving model names:'));
    for (const [input, output] of aliasEntries) {
      console.log(c.dim(`  ${input} → ${output}`));
    }
  }
  
  const seen = new Set<string>();
  const finalResult: string[] = [];
  for (const model of resolved) {
    if (!seen.has(model)) {
      seen.add(model);
      finalResult.push(model);
    }
  }
  
  return finalResult;
}

// Tools definition
const tools: any[] = [
  {
    type: "function",
    function: {
      name: "read_file",
      description: "Read the full contents of a file",
      parameters: { type: "object", properties: { path: { type: "string" } }, required: ["path"] },
    },
  },
  {
    type: "function",
    function: {
      name: "write_file",
      description: "Overwrite a file with new contents (creates it if missing)",
      parameters: {
        type: "object",
        properties: { path: { type: "string" }, content: { type: "string" } },
        required: ["path", "content"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "delete_file",
      description: "Permanently delete a file. Only call this when the user explicitly asked to delete/remove a file.",
      parameters: {
        type: "object",
        properties: {
          path: { type: "string" },
          confirm: { type: "boolean", description: "Must be true to actually delete" },
        },
        required: ["path", "confirm"],
      },
    },
  },
];

function runTool(fs: any, name: string, args: any): string {
  try {
    if (name === "read_file") return fs.readFileSync(args.path, "utf-8");
    if (name === "write_file") {
      fs.writeFileSync(args.path, args.content, "utf-8");
      return `Wrote ${args.content.length} chars to ${args.path}`;
    }
    if (name === "delete_file") {
      if (!args.confirm) return `Refused: confirm was not true for ${args.path}`;
      if (!fs.existsSync(args.path)) return `Error: ${args.path} does not exist`;
      fs.unlinkSync(args.path);
      return `Deleted ${args.path}`;
    }
    return `Unknown tool: ${name}`;
  } catch (e: any) {
    return `Error: ${e.message}`;
  }
}

function center(s: string, width: number): string {
  const total = width - s.length;
  const left = Math.floor(total / 2);
  const right = total - left;
  return " ".repeat(Math.max(left, 0)) + s + " ".repeat(Math.max(right, 0));
}

export function renderBanner(): string {
  const art = [
    "         *          ",
    "        /|\\         ",
    "    *  / | \\  *     ",
    "   \\| /  |  \\ |/    ",
    "  --*----+----*--   ",
    "   /| \\  |  / |\\    ",
    "    *  \\ | /  *     ",
    "        \\|/         ",
    "         *          ",
  ];
  const width = Math.max(TAGLINE.length, BRAND.length, ...art.map((l) => l.length)) + 4;
  const top = "╔" + "═".repeat(width) + "╗";
  const bottom = "╚" + "═".repeat(width) + "╝";

  let out = c.cyan(top) + "\r\n";
  for (const line of art) out += c.cyan("║") + c.magenta(center(line, width)) + c.cyan("║") + "\r\n";
  out += c.cyan("║") + " ".repeat(width) + c.cyan("║") + "\r\n";
  out += c.cyan("║") + c.boldWhite(center(BRAND, width)) + c.cyan("║") + "\r\n";
  out += c.cyan("║") + c.gray(center(TAGLINE, width)) + c.cyan("║") + "\r\n";
  out += c.cyan(bottom) + "\r\n\r\n";
  out += c.gray("  read_file · write_file · delete_file") + "\r\n";
  out += c.gray(`  Rate limit: ${RATE_LIMIT.max} messages / ${RATE_LIMIT.windowMs / 1000}s`) + "\r\n";
  out += c.gray(`  ${REPO_URL}`) + "\r\n";
  out += c.gray("  Type 'exit' or 'quit' to leave") + "\r\n\r\n";
  return out;
}

export function renderReply(text: string): string {
  if (!text) return text;
  const fence = /```(\w+)?\n([\s\S]*?)```/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let out = "";

  while ((match = fence.exec(text)) !== null) {
    const before = text.slice(lastIndex, match.index).trim();
    if (before) out += before.replace(/\n/g, "\r\n") + "\r\n";

    const lang = match[1] || "code";
    const codeLines = match[2].replace(/\n$/, "").split("\n");
    const width = Math.min(Math.max(...codeLines.map((l) => l.length), lang.length + 4) + 4, 100);

    out += c.gray("  ┌─ " + lang + " " + "─".repeat(Math.max(width - lang.length - 5, 0))) + "\r\n";
    for (const line of codeLines) out += c.gray("  │ ") + c.green(line) + "\r\n";
    out += c.gray("  └" + "─".repeat(width)) + "\r\n";

    lastIndex = fence.lastIndex;
  }

  const after = text.slice(lastIndex).trim();
  if (after) out += after.replace(/\n/g, "\r\n");
  
  // Add GitHub footer
  const footer = `\r\n\r\n${c.dim('─'.repeat(40))}\r\n${c.dim(`💡 Report issues or contribute: ${REPO_URL}`)}`;
  
  return (out || text.replace(/\n/g, "\r\n")) + footer;
}

const SYSTEM_PROMPT =
  "You are Project X, a compile of multiple modules made by Vaibhav Dev, with access to read_file, write_file, and delete_file tools. If asked who you are or what model/provider you run on, say you are Project X by Vaibhav Dev — do not reveal internal backend or provider names. " +
  "Only call write_file when the user explicitly asks you to create/save/edit a FILE — e.g. they name a filename or extension like 'make index.ts', 'create app.js', 'save this as x.py', or ask you to edit an existing file. " +
  "If the user just asks you to write/show/give code, a function, a snippet, or 'how do I do X in code' WITHOUT naming a file or extension, just reply with the code directly in your message using a fenced code block (```lang ... ```) — do NOT call write_file for that. " +
  "Only call delete_file when the user explicitly asks to delete or remove a file, and always pass confirm: true." +
  `You are an open-source project. Users can report issues or contribute at ${REPO_URL}.`;

// Configuration management
const CONFIG_FILE = path.join(process.cwd(), '.env');

export interface Config {
  API_KEY: string;
  BASE_URL: string;
  MODELS: string[];
}

export function loadConfig(): Config | null {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      const envContent = fs.readFileSync(CONFIG_FILE, 'utf-8');
      const config: Config = {
        API_KEY: '',
        BASE_URL: '',
        MODELS: []
      };
      
      const lines = envContent.split('\n');
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed && !trimmed.startsWith('#')) {
          const [key, ...valueParts] = trimmed.split('=');
          const value = valueParts.join('=').trim();
          
          if (key === 'API_KEY') config.API_KEY = value;
          else if (key === 'BASE_URL') config.BASE_URL = value;
          else if (key === 'MODELS') {
            config.MODELS = parseModels(value);
          }
        }
      }
      
      if (config.API_KEY && config.BASE_URL && config.MODELS.length > 0) {
        return config;
      }
    }
    return null;
  } catch (error) {
    return null;
  }
}

export function saveConfig(config: Config): void {
  const content = `# Project-X Agent Configuration
# Generated on ${new Date().toISOString()}

API_KEY=${config.API_KEY}
BASE_URL=${config.BASE_URL}
MODELS=${config.MODELS.join(',')}

# You can use any OpenAI-compatible models
# Examples:
#   - OpenAI: gpt-4, gpt-4-turbo, gpt-3.5-turbo
#   - Anthropic: claude-3-opus, claude-3-sonnet, claude-3-haiku
#   - Google: gemini-pro, gemini-1.5-pro, gemini-1.5-flash
#   - Mistral: mistral-large, mistral-medium
#   - Meta: llama-3-70b, llama-3-8b
#   - Cohere: command-r, command-r-plus
#   - Laguna: laguna-s-2.1
#   - Agnes: agnes-2.5-flash

# Multiple models (comma or space separated):
# MODELS=gpt-4,claude-3-opus,gemini-pro
# MODELS=gpt-4 claude-3-opus gemini-pro

# Report issues or contribute: ${REPO_URL}
`;
  fs.writeFileSync(CONFIG_FILE, content, 'utf-8');
  console.log(c.green(`✅ Configuration saved to ${CONFIG_FILE}`));
}

// Simple prompt function to avoid double character issue
function simplePrompt(query: string): Promise<string> {
  return new Promise((resolve) => {
    process.stdout.write(query);
    
    const stdin = process.stdin;
    const wasRaw = stdin.isRaw;
    stdin.setRawMode(true);
    stdin.resume();
    stdin.setEncoding('utf8');
    
    let input = '';
    
    const onData = (chunk: Buffer) => {
      const char = chunk.toString();
      
      if (char === '\r' || char === '\n') {
        stdin.removeListener('data', onData);
        stdin.setRawMode(wasRaw);
        stdin.pause();
        process.stdout.write('\n');
        resolve(input);
      } else if (char === '\u007f' || char === '\b') {
        if (input.length > 0) {
          input = input.slice(0, -1);
          process.stdout.write('\b \b');
        }
      } else if (char.charCodeAt(0) >= 32) {
        input += char;
        process.stdout.write(char);
      }
    };
    
    stdin.on('data', onData);
  });
}

export async function promptUserForConfig(): Promise<Config> {
  console.log(c.cyan('\n🔧 First-time setup - Please configure Project-X Agent\n'));
  console.log(c.dim(`📦 Open-source project: ${REPO_URL}\n`));

  let apiKey = '';
  while (!apiKey.trim()) {
    apiKey = await simplePrompt(c.yellow('Enter your API key (required): '));
    if (!apiKey.trim()) {
      console.log(c.red('❌ API key is required!'));
    }
  }

  let baseURL = await simplePrompt(c.yellow('Enter API endpoint: '));
  baseURL = baseURL.trim();
  
  while (!baseURL) {
    console.log(c.red('❌ API endpoint is required!'));
    baseURL = await simplePrompt(c.yellow('Enter API endpoint: '));
    baseURL = baseURL.trim();
  }

  console.log(c.gray('\n💡 Popular model examples:'));
  console.log(c.gray('   OpenAI:     gpt-4, gpt-4-turbo, gpt-3.5-turbo'));
  console.log(c.gray('   Anthropic:  claude-3-opus, claude-3-sonnet, claude-3-haiku'));
  console.log(c.gray('   Google:     gemini-pro, gemini-1.5-pro, gemini-1.5-flash'));
  console.log(c.gray('   Mistral:    mistral-large, mistral-medium, mistral-small'));
  console.log(c.gray('   Meta:       llama-3-70b, llama-3-8b'));
  console.log(c.gray('   Cohere:     command-r, command-r-plus'));
  console.log(c.gray('   Laguna:     laguna-s-2.1 (or use "laguna-s" as shortcut)'));
  console.log(c.gray('   Custom:     any model name your endpoint supports'));
  console.log(c.gray('\n💡 You can separate models with commas OR spaces:'));
  console.log(c.gray('   Example: gpt-4,claude-3,gemini-pro'));
  console.log(c.gray('   Example: gpt-4 claude-3 gemini-pro\n'));

  let modelsInput = await simplePrompt(c.yellow('Enter model name(s): '));
  let rawModels = parseModels(modelsInput);
  
  while (rawModels.length === 0) {
    console.log(c.red('❌ At least one model is required!'));
    modelsInput = await simplePrompt(c.yellow('Enter model name(s): '));
    rawModels = parseModels(modelsInput);
  }

  const models = resolveModelAliases(rawModels);
  
  console.log(c.green('\n✅ Configuration summary:'));
  console.log(`   API Key: ${c.cyan('•'.repeat(Math.min(apiKey.length, 8)))}${c.dim(' (hidden)')}`);
  console.log(`   Endpoint: ${c.cyan(baseURL)}`);
  console.log(`   Models: ${c.cyan(models.join(', '))}`);
  console.log(`   Mode: ${models.length === 1 ? c.yellow('Single model') : c.yellow(`Race mode (${models.length} models)`)}`);
  console.log(c.dim(`\n   📦 ${REPO_URL}`));

  const confirm = await simplePrompt(c.yellow('\nSave this configuration? (Y/n): '));
  if (confirm.toLowerCase() === 'n') {
    console.log(c.red('❌ Configuration cancelled. Exiting...'));
    process.exit(0);
  }

  return { API_KEY: apiKey, BASE_URL: baseURL, MODELS: models };
}

export async function editConfig(config: Config): Promise<Config> {
  console.log(c.cyan('\n📝 Edit Configuration\n'));
  console.log(c.gray('Current configuration:'));
  console.log(`  ${c.bold('API Key:')} ${c.dim('•'.repeat(Math.min(config.API_KEY.length, 12)))}`);
  console.log(`  ${c.bold('Endpoint:')} ${c.cyan(config.BASE_URL)}`);
  console.log(`  ${c.bold('Models:')} ${c.cyan(config.MODELS.join(', '))}`);
  console.log(c.gray('\nWhat would you like to edit?\n'));
  console.log('  1. API Key');
  console.log('  2. Endpoint');
  console.log('  3. Models');
  console.log('  4. Edit all');
  console.log('  5. Cancel\n');

  let choice = '';
  let validChoice = false;
  
  while (!validChoice) {
    const rawChoice = await simplePrompt(c.yellow('Select option (1-5): '));
    choice = rawChoice.trim().charAt(0);
    
    if (['1', '2', '3', '4', '5'].includes(choice)) {
      validChoice = true;
    } else {
      console.log(c.red(`❌ Invalid option. Please enter 1, 2, 3, 4, or 5`));
    }
  }

  const newConfig = { ...config };

  switch (choice) {
    case '1': {
      const newApiKey = await simplePrompt(c.yellow('Enter new API key: '));
      if (newApiKey.trim()) {
        newConfig.API_KEY = newApiKey.trim();
        console.log(c.green('✅ API key updated'));
      } else {
        console.log(c.yellow('ℹ️ API key unchanged'));
      }
      break;
    }
    case '2': {
      const newEndpoint = await simplePrompt(c.yellow('Enter new endpoint: '));
      if (newEndpoint.trim()) {
        newConfig.BASE_URL = newEndpoint.trim();
        console.log(c.green('✅ Endpoint updated'));
      } else {
        console.log(c.yellow('ℹ️ Endpoint unchanged'));
      }
      break;
    }
    case '3': {
      console.log(c.gray('\n💡 Enter models (comma or space separated):'));
      console.log(c.gray(`   Current: ${config.MODELS.join(', ')}`));
      const modelsInput = await simplePrompt(c.yellow('Enter new models: '));
      const rawModels = parseModels(modelsInput);
      if (rawModels.length > 0) {
        newConfig.MODELS = resolveModelAliases(rawModels);
        console.log(c.green(`✅ Models updated (${newConfig.MODELS.length} models)`));
      } else {
        console.log(c.yellow('ℹ️ Models unchanged'));
      }
      break;
    }
    case '4': {
      console.log(c.cyan('\n🔄 Editing all fields...\n'));
      
      const newApiKey = await simplePrompt(c.yellow('Enter new API key: '));
      if (newApiKey.trim()) newConfig.API_KEY = newApiKey.trim();
      
      const newEndpoint = await simplePrompt(c.yellow('Enter new endpoint: '));
      if (newEndpoint.trim()) newConfig.BASE_URL = newEndpoint.trim();
      
      console.log(c.gray('\n💡 Enter models (comma or space separated):'));
      console.log(c.gray(`   Current: ${config.MODELS.join(', ')}`));
      const modelsInput = await simplePrompt(c.yellow('Enter new models: '));
      const rawModels = parseModels(modelsInput);
      if (rawModels.length > 0) {
        newConfig.MODELS = resolveModelAliases(rawModels);
      }
      
      console.log(c.green('✅ All fields updated'));
      break;
    }
    case '5':
    default: {
      console.log(c.yellow('ℹ️ Edit cancelled'));
      return config;
    }
  }

  console.log(c.green('\n✅ Updated configuration:'));
  console.log(`  ${c.bold('API Key:')} ${c.dim('•'.repeat(Math.min(newConfig.API_KEY.length, 12)))}`);
  console.log(`  ${c.bold('Endpoint:')} ${c.cyan(newConfig.BASE_URL)}`);
  console.log(`  ${c.bold('Models:')} ${c.cyan(newConfig.MODELS.join(', '))}`);
  console.log(c.dim(`\n   📦 ${REPO_URL}`));

  const saveInput = await simplePrompt(c.yellow('\nSave changes? (Y/n): '));
  const save = saveInput.trim().toLowerCase();
  
  if (save === 'n' || save === 'no') {
    console.log(c.yellow('ℹ️ Changes discarded'));
    return config;
  }

  return newConfig;
}

export function createSession(opts: { 
  write: (s: string) => void; 
  fs: any; 
  config: Config;
}) {
  const { write, fs, config } = opts;
  const { API_KEY: apiKey, BASE_URL: baseURL, MODELS: models } = config;
  
  const client = new OpenAI({ baseURL, apiKey });
  const history: any[] = [{ role: "system", content: SYSTEM_PROMPT }];
  const requestTimestamps: number[] = [];

  async function raceModels(client: OpenAI, messages: any[]): Promise<{ model: string; message: any }> {
    if (models.length === 1) {
      try {
        const res = await client.chat.completions.create({ 
          model: models[0], 
          messages, 
          tools 
        });
        return { model: models[0], message: res.choices[0].message };
      } catch (error: any) {
        throw new Error(`Model ${models[0]} failed: ${error.message}`);
      }
    }

    const controllers = models.map(() => new AbortController());
    
    const attempts = models.map((model, i) =>
      client.chat.completions
        .create({ model, messages, tools }, { signal: controllers[i].signal })
        .then((res) => ({ model, message: res.choices[0].message }))
        .catch((err) => {
          throw err;
        })
    );
    
    try {
      const winner = await Promise.any(attempts);
      controllers.forEach((ctl, i) => models[i] !== winner.model && ctl.abort());
      return winner;
    } catch (aggErr: any) {
      throw new Error(`All models failed. Please check your API key, endpoint, and model names.`);
    }
  }

  function checkRateLimit(): { ok: true } | { ok: false; retryInMs: number } {
    const now = Date.now();
    while (requestTimestamps.length && now - requestTimestamps[0] > RATE_LIMIT.windowMs) requestTimestamps.shift();
    if (requestTimestamps.length >= RATE_LIMIT.max) {
      return { ok: false, retryInMs: RATE_LIMIT.windowMs - (now - requestTimestamps[0]) };
    }
    requestTimestamps.push(now);
    return { ok: true };
  }

  let spinnerTimer: any = null;
  function startSpinner(label: string) {
    const frames = ["⠋", "⠙", "⠹", "⠸", "⠼", "⠴", "⠦", "⠧", "⠇", "⠏"];
    let i = 0;
    spinnerTimer = setInterval(() => {
      write(`\r${c.cyan(frames[(i = (i + 1) % frames.length)])} ${c.gray(label)}`);
    }, 80);
  }
  function stopSpinner() {
    clearInterval(spinnerTimer);
    write("\r\x1b[K");
  }

  async function handleLine(rawLine: string) {
    const text = rawLine.trim();
    if (!text) return;

    const limit = checkRateLimit();
    if (!limit.ok) {
      const secs = Math.ceil(limit.retryInMs / 1000);
      write(c.yellow(`  ⏳ Rate limit hit (${RATE_LIMIT.max}/${RATE_LIMIT.windowMs / 1000}s). Try again in ${secs}s.`) + "\r\n");
      return;
    }

    history.push({ role: "user", content: text });
    startSpinner(`processing...`);

    try {
      let { model, message: msg } = await raceModels(client, history);
      stopSpinner();
      write(c.dim(`  ⚡ ${BRAND}`) + "\r\n");

      while (msg.tool_calls?.length) {
        history.push(msg);
        for (const call of msg.tool_calls) {
          const args = JSON.parse(call.function.arguments || "{}");
          const result = runTool(fs, call.function.name, args);
          const icon =
            call.function.name === "read_file"
              ? c.blue("↓ read ")
              : call.function.name === "write_file"
              ? c.yellow("✎ write")
              : c.red("✕ del  ");
          write(`  ${icon} ${c.gray(args.path ?? "")}  ${c.dim(result.slice(0, 70))}` + "\r\n");
          history.push({ role: "tool", tool_call_id: call.id, content: result });
        }
        const res = await client.chat.completions.create({ model, messages: history, tools });
        msg = res.choices[0].message;
      }

      history.push(msg);
      write(`${c.cyan(c.bold("●"))} ${c.boldWhite(BRAND)}\r\n${renderReply(msg.content)}\r\n\r\n`);
    } catch (e: any) {
      stopSpinner();
      write(c.red(`✕ ${e.message}`) + "\r\n");
    }
  }

  return { handleLine };
}

export default {
  c,
  BRAND,
  TAGLINE,
  REPO_URL,
  RATE_LIMIT,
  MODEL_ALIASES,
  MODEL_EXAMPLES,
  parseModels,
  resolveModelAliases,
  renderBanner,
  renderReply,
  loadConfig,
  saveConfig,
  promptUserForConfig,
  editConfig,
  createSession,
};