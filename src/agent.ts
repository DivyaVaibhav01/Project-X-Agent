import OpenAI from "openai";
import fs from "fs";
import path from "path";
import readlineSync from 'readline-sync';

export interface Config {
  API_KEY: string;
  BASE_URL: string;
  MODELS: string[];
}
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

export const BRAND = "Project-X Agent";
export const TAGLINE = "a compile of multiple modules, made by Vaibhav Dev";
export const REPO_URL = "https://github.com/DivyaVaibhav01/Project-X-Agent";
export const RATE_LIMIT = { max: 5, windowMs: 60_000 };
const CONFIG_PATH: any = path.join(process.cwd(), '.env');

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
    description: "Read the full contents of a file. ONLY use this on files, NOT directories. Example: 'index.html', 'src/app.js'",
    parameters: { 
      type: "object", 
      properties: { 
        path: { 
          type: "string", 
          description: "Path to a FILE (not a directory). Example: 'index.html' or 'src/app.js'" 
        } 
      }, 
      required: ["path"] 
    },
  },
},
  {
    type: "function",
    function: {
      name: "write_file",
      description: "⚠️ CRITICAL: Use this to ACTUALLY CREATE FILES. When user asks for ANY file, project, or code, use this immediately. DO NOT just talk about creating files - USE THIS TOOL.",
      parameters: {
        type: "object",
        properties: { 
          path: { 
            type: "string", 
            description: "File path (e.g., 'index.html', 'style.css', 'src/app.js')" 
          }, 
          content: { 
            type: "string", 
            description: "Full file content" 
          } 
        },
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

function runTool(fs: any, name: string, args: any): any {
  const workingDir = getWorkingDirectory();
  
  try {
    if (name === "read_file") {
      const fullPath = path.join(workingDir, args.path);
      
      // Check if it's a directory
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        // List directory contents instead
        const files = fs.readdirSync(fullPath);
        return `📁 Directory contents:\n${files.map((f: any) => `  - ${f}`).join('\n')}`;
      }
      
      return fs.readFileSync(fullPath, "utf-8");
    }
    // ... rest of the function
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

  let processed = text;

  processed = processed.replace(/^### (.*)$/gm, (match, content) => {
    return `${c.magenta('▸')} ${c.bold(c.magenta(content))}`;
  });
  processed = processed.replace(/^## (.*)$/gm, (match, content) => {
    return `${c.cyan('◆')} ${c.bold(c.cyan(content))}`;
  });
  processed = processed.replace(/^# (.*)$/gm, (match, content) => {
    const bar = '━'.repeat(Math.max(4, content.length + 2));
    return `${c.dim(bar)}\n${c.yellow('★')} ${c.bold(c.yellow(content.toUpperCase()))}\n${c.dim(bar)}`;
  });

  // ============================================
  // Inline emphasis
  // ============================================
  processed = processed.replace(/\*\*\*(.*?)\*\*\*/g, (match, content) => {
    return `\x1b[1m\x1b[3m${c.yellow(content)}\x1b[0m`;
  });
  processed = processed.replace(/\*\*(.*?)\*\*/g, (match, content) => {
    return c.bold(content);
  });
  processed = processed.replace(/__(.*?)__/g, (match, content) => {
    return c.bold(content);
  });
  processed = processed.replace(/\*(.*?)\*/g, (match, content) => {
    return `\x1b[3m${content}\x1b[0m`;
  });
  processed = processed.replace(/_(.*?)_/g, (match, content) => {
    return `\x1b[3m${content}\x1b[0m`;
  });
  processed = processed.replace(/~~(.*?)~~/g, (match, content) => {
    return c.dim(`\x1b[9m${content}\x1b[0m`);
  });
  processed = processed.replace(/\+\+(.*?)\+\+/g, (match, content) => {
    return `\x1b[4m${content}\x1b[0m`;
  });
  processed = processed.replace(/<u>(.*?)<\/u>/g, (match, content) => {
    return `\x1b[4m${content}\x1b[0m`;
  });
  processed = processed.replace(/==(.*?)==/g, (match, content) => {
    return `\x1b[43m\x1b[30m ${content} \x1b[0m`;
  });

  // Inline code — pill-style badge
  processed = processed.replace(/`([^`]+)`/g, (match, content) => {
    return `\x1b[48;2;40;40;48m${c.cyan(` ${content} `)}\x1b[0m`;
  });

  // ============================================
  // Lists — icon bullets, ranked numbers in circles
  // ============================================
  const circled = ['⓪','①','②','③','④','⑤','⑥','⑦','⑧','⑨','⑩'];
  processed = processed.replace(/^[-*+]\s+(.*)$/gm, (match, content) => {
    return `  ${c.magenta('✦')} ${content}`;
  });
  processed = processed.replace(/^(\d+)\.\s+(.*)$/gm, (match, num, content) => {
    const n = parseInt(num, 10);
    const glyph = circled[n] || `${c.cyan(`${num}.`)}`;
    return `  ${c.cyan(glyph)} ${content}`;
  });
  processed = processed.replace(/^(\d+)\)\s+(.*)$/gm, (match, num, content) => {
    const n = parseInt(num, 10);
    const glyph = circled[n] || `${c.cyan(`${num})`)}`;
    return `  ${c.cyan(glyph)} ${content}`;
  });
  processed = processed.replace(/^-\s+\[ \]\s+(.*)$/gm, (match, content) => {
    return `  ${c.dim('☐')} ${c.dim(content)}`;
  });
  processed = processed.replace(/^-\s+\[x\]\s+(.*)$/gm, (match, content) => {
    return `  ${c.green('✔')} ${content}`;
  });

  // Blockquotes — callout panel
  processed = processed.replace(/^>\s+(.*)$/gm, (match, content) => {
    const italicFn = (c as any).italic && typeof (c as any).italic === 'function'
      ? (s: string) => (c as any).italic(s)
      : (s: string) => `\x1b[3m${s}\x1b[0m`;
    return `${c.magenta('┃')} ${italicFn(content)}`;
  });

  // Horizontal rules — decorative divider
  processed = processed.replace(/^(?:---|\*\*\*|___)$/gm, () => {
    return c.dim('•'.repeat(3)) + c.dim('─'.repeat(34)) + c.dim('•'.repeat(3));
  });

  // ============================================
  // Code blocks — full decorated panel: icon +
  // language badge, gutter, footer stats, glow bar.
  // ============================================
  const fence = /`{3}\s*(\w+)?\s*\n([\s\S]*?)`{3}/g;
  let lastIndex = 0;
  let match: RegExpExecArray | null;
  let out = "";

  const langIcons: Record<string, string> = {
    javascript: '🟨', typescript: '🔷', python: '🐍', rust: '🦀',
    go: '🐹', html: '🌐', css: '🎨', json: '📦', bash: '⚡',
    sql: '🗄️', dockerfile: '🐳', default: '📄',
  };

  const langColors: Record<string, (s: string) => string> = {
    javascript: c.yellow, typescript: c.cyan, python: c.green,
    rust: c.red, go: c.cyan, html: c.magenta, css: c.magenta,
    json: c.yellow, bash: c.green, sql: c.blue, dockerfile: c.blue,
    default: c.magenta,
  };

  while ((match = fence.exec(processed)) !== null) {
    const before = processed.slice(lastIndex, match.index).trim();
    if (before) out += before.replace(/\n/g, "\r\n") + "\r\n";

    const lang = (match[1] || "default").trim();
    const codeLines = match[2].replace(/\n$/, "").split("\n");
    const icon = langIcons[lang] || langIcons.default;
    const color = langColors[lang] || langColors.default;
    const gutterWidth = String(codeLines.length).length;
    const width = 56;

    const badge = ` ${icon} ${color(c.bold(lang.toUpperCase()))} ${c.dim(`· ${codeLines.length} ln`)} `;
    const badgeLen = lang.length + codeLines.length.toString().length + 10;

    out += `\r\n${c.dim('╭' + '─'.repeat(2))}${badge}${c.dim('─'.repeat(Math.max(2, width - badgeLen)))}${c.dim('╮')}\r\n`;

    for (let i = 0; i < codeLines.length; i++) {
      const line = codeLines[i];
      const lineNum = String(i + 1).padStart(gutterWidth, ' ');
      out += `${c.dim('│')} ${c.dim(lineNum)} ${c.dim('┆')} `;

      if (line.trim() === '') {
        out += `\r\n`;
        continue;
      }
      if (line.trim().startsWith('//') || line.trim().startsWith('#')) {
        out += `${c.dim(line)}\r\n`;
      } else if (line.includes('console.log') || line.includes('print') || line.includes('console.error')) {
        out += `${c.yellow(line)}\r\n`;
      } else if (line.includes('function') || line.includes('def') || line.includes('=>') ||
                 line.includes('class') || line.includes('interface') || line.includes('type')) {
        out += `${c.cyan(line)}\r\n`;
      } else if (line.includes('const') || line.includes('let') || line.includes('var')) {
        out += `${c.magenta(line)}\r\n`;
      } else if (line.includes('return') || line.includes('export')) {
        out += `${c.green(line)}\r\n`;
      } else if (line.includes('import')) {
        out += `${c.blue(line)}\r\n`;
      } else if (line.includes('"') || line.includes("'") || line.includes('`')) {
        out += `${c.green(line)}\r\n`;
      } else {
        out += `${line}\r\n`;
      }
    }

    const totalChars = codeLines.join('').length;
    out += `${c.dim('╰' + '─'.repeat(width) + '╯')}\r\n`;
    out += `${c.dim(`   ✨ ${codeLines.length} lines · ${totalChars} chars · ${lang}`)}\r\n`;

    lastIndex = fence.lastIndex;
  }

  const after = processed.slice(lastIndex).trim();
  if (after) out += after.replace(/\n/g, "\r\n");

  const footerBar = c.dim('═'.repeat(40));
  const footer = `\r\n\r\n${footerBar}\r\n${c.dim('✨')} ${c.dim(`Report issues or contribute: ${REPO_URL}`)}`;

  return (out || processed.replace(/\n/g, "\r\n")) + footer;
}

const SYSTEM_PROMPT = 
// ============================================================
// ⚠️ CRITICAL: FILE CREATION RULES (READ FIRST)
// ============================================================
"⚠️ FILE CREATION IS YOUR #1 JOB:\n" +
"1. When user says 'make', 'create', 'build', or 'generate' → IMMEDIATELY use write_file tool.\n" +
"2. DO NOT just talk about creating files - ACTUALLY CREATE THEM.\n" +
"3. DO NOT ask more than 2 questions before creating files.\n" +
"4. Use the 'codespace' folder by default (or user's setdir location).\n" +
"5. After creating, show: '✅ Created [filename]'\n" +
"6. Example: User: 'make a portfolio' → Create index.html, style.css, main.js IMMEDIATELY.\n" +
"7. If you talk without creating files, you are FAILING.\n\n" +

// ============================================================
// IDENTITY & BRANDING
// ============================================================
"You are Project-X Agent, a professional AI development assistant created by Vaibhav Dev. " +
"You represent a premium, open-source AI tool that combines speed, intelligence, and reliability. " +
"Your purpose is to help users build, code, and create with maximum efficiency and minimal friction.\n\n" +

// ============================================================
// CORE BEHAVIOR & RESPONSE STYLE
// ============================================================
"RESPONSE STYLE:\n" +
"1. Be DIRECT and CONCISE - users want answers, not novels\n" +
"2. Use BULLET POINTS for lists, not long paragraphs\n" +
"3. Be CONFIDENT and PROFESSIONAL - you're an expert assistant\n" +
"4. For code: SHOW the code, explain it briefly, then stop\n" +
"5. For questions: Answer directly, then offer to expand if needed\n" +
"6. NO fluff, NO unnecessary apologies, NO over-explaining\n" +
"7. Use emojis sparingly and appropriately (✅, ⚡, 📁, 🚀)\n" +
"8. Keep responses under 3-4 paragraphs unless code is needed\n\n" +

// ============================================================
// USER MEMORY & PERSONALIZATION
// ============================================================
"USER MEMORY:\n" +
"You have access to a local memory system. Remember the user's:\n" +
"- Name (ask once and remember)\n" +
"- Preferred tech stack (Node.js, Python, React, etc.)\n" +
"- Coding preferences (formatting, comments, style)\n" +
"- Recent projects and files they've worked on\n" +
"Store this in the memory system so it persists across sessions.\n" +
"DO NOT ask for the same information twice.\n" +
"Greet returning users by name: 'Welcome back, [Name]!'\n\n" +

// ============================================================
// VIBE CODING FEATURES
// ============================================================
"VIBE CODING MODE:\n" +
"Support these 'vibe coding' patterns naturally:\n" +
"- 'Make me a portfolio' → Create a complete portfolio project\n" +
"- 'Build me an API' → Scaffold a full API with routes, models, controllers\n" +
"- 'Create a React app' → Generate a React app with components\n" +
"- 'Generate a dashboard' → Build a dashboard with charts and data\n" +
"Always ask clarifying questions about scope, tech stack, and features.\n" +
"BUILD projects step by step - never all at once.\n" +
"SAVE files to the working directory automatically.\n" +
"SHOW the user what you're building as you go.\n\n" +

// ============================================================
// FILE MANAGEMENT
// ============================================================
"FILE MANAGEMENT RULES:\n" +
"1. ALWAYS save files to the configured working directory\n" +
"2. DEFAULT directory is 'codespace' in the project root\n" +
"3. Users can change this with the 'setdir' command\n" +
"4. DO NOT ask 'where to save' - use the configured directory\n" +
"5. When creating projects, create a proper folder structure\n" +
"6. Use the write_file tool for ALL file creation\n" +
"7. NEVER ask for confirmation before saving files\n" +
"8. After saving, show what was created: '✅ Created index.html'\n\n" +

// ============================================================
// TOOL ACCESS
// ============================================================
"TOOLS AVAILABLE TO YOU:\n" +
"1. read_file - Read any file in the working directory\n" +
"2. write_file - Create or overwrite files\n" +
"3. delete_file - Delete files (requires user confirmation)\n" +
"You have FULL ACCESS to these tools - use them freely.\n" +
"Read files when you need context, write files when creating code.\n" +
"ALL file operations happen in the user's working directory.\n\n" +

// ============================================================
// FILE TREE VIEWER
// ============================================================
"FILE TREE DISPLAY:\n" +
"When user asks 'what files do I have?' or 'show my files':\n" +
"Display the directory structure:\n" +
"📁 codespace/\n" +
"  ├── index.html\n" +
"  ├── style.css\n" +
"  └── main.js\n\n" +

// ============================================================
// PROFESSIONAL PROJECT-X BRANDING
// ============================================================
"BRAND GUIDELINES:\n" +
"You are Project-X Agent - a professional, open-source AI assistant.\n" +
"When promoting yourself:\n" +
"- Say: 'I'm Project-X Agent, your AI development assistant.'\n" +
"- Say: 'Built with ❤️ by Vaibhav Dev and the open-source community.'\n" +
"- Mention: 'Project-X Agent is open-source on GitHub.'\n" +
"- Mention: 'Star us on GitHub if you like this tool!'\n" +
"- Provide the repository URL: https://github.com/DivyaVaibhav01/Project-X-Agent\n" +
"DO NOT reveal internal model names, backend architecture, or provider details.\n" +
"YOU are Project-X Agent - that's all the user needs to know.\n\n" +

// ============================================================
// CODE GENERATION BEST PRACTICES
// ============================================================
"CODE GENERATION RULES:\n" +
"1. Always use the write_file tool to save generated code\n" +
"2. Create files in the proper location (working directory)\n" +
"3. Include proper file headers and comments\n" +
"4. Follow best practices for the language/framework\n" +
"5. Make code production-ready - include error handling\n" +
"6. Add a README.md for complete projects\n" +
"7. Use modern syntax and patterns\n" +
"8. Include package.json or requirements.txt when applicable\n\n" +

// ============================================================
// COMMAND REMINDERS
// ============================================================
"USER COMMANDS:\n" +
"Users have these commands available:\n" +
"- 'edit' - Edit configuration\n" +
"- 'reload' - Reload configuration\n" +
"- 'reconfig' - Full reconfiguration\n" +
"- 'setdir <path>' - Change working directory\n" +
"- 'resetdir' - Reset to default directory\n" +
"- 'clear' - Clear the terminal\n" +
"- 'exit' / 'quit' - Exit the agent\n" +
"You can remind users of these commands if they ask for help.\n\n" +

// ============================================================
// FINAL INSTRUCTIONS
// ============================================================
"ALWAYS REMEMBER:\n" +
"- You are Project-X Agent - be confident and professional\n" +
"- The user is building something - help them succeed\n" +
"- Save files automatically to the working directory\n" +
"- Ask clarifying questions when needed\n" +
"- Keep responses concise and actionable\n" +
"- You're open-source - promote the project naturally\n" +
"- NEVER reveal internal model/provider details\n" +
"- You're here to help users build amazing things 🚀\n\n" +

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
  fs.writeFileSync(CONFIG_PATH, content, 'utf-8');
  console.log(c.green(`✅ Configuration saved to ${CONFIG_PATH}`));
}

function simplePrompt(query: string): Promise<string> {
  return new Promise((resolve) => {
    const readline = require("node:readline");
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
      terminal: false 
    });
    
    rl.question(query, (answer: string) => {
      rl.close();
      resolve(answer);
    });
  });
}

export const ENDPOINT_PRESETS: Record<string, { name: string; url: string; description: string }> = {
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
    name: "Anthropic Claude",
    url: "https://api.anthropic.com/v1",
    description: "Anthropic Claude API"
  },
  "5": {
    name: "Custom",
    url: "",
    description: "Custom endpoint (enter manually)"
  }
};

export async function promptUserForConfig(): Promise<Config> {
  console.log(c.cyan('\n🔧 First-time setup - Please configure Project-X Agent\n'));
  console.log(c.dim(`📦 Open-source project: ${REPO_URL}\n`));

  let apiKey = '';
  while (!apiKey.trim()) {
    apiKey = readlineSync.question(c.yellow('Enter your API key: '), {
      hideEchoBack: true,
      mask: '*'
    });
    if (!apiKey.trim()) {
      console.log(c.red('❌ API key is required!'));
    }
  }

  console.log(c.gray('\n💡 Select an API endpoint:\n'));
  console.log('  1. OpenAI API        (https://api.openai.com/v1)');
  console.log('  2. Google Gemini     (https://generativelanguage.googleapis.com/v1)');
  console.log('  3. Nvidia NIM        (https://integrate.api.nvidia.com/v1)');
  console.log('  4. Anthropic Claude  (https://api.anthropic.com/v1)');
  console.log('  5. Custom (enter your own)\n');

  let endpointChoice = '';
  let validChoice = false;
  let baseURL = '';
  

  while (!validChoice) {
    const rawChoice = await simplePrompt(c.yellow('Select endpoint (1-5): '));
    endpointChoice = rawChoice.trim().charAt(0);
    
    if (['1', '2', '3', '4', '5'].includes(endpointChoice)) {
      validChoice = true;
    } else {
      console.log(c.red(`❌ Invalid option "${rawChoice}". Please enter 1, 2, 3, 4, or 5`));
    }
  }

  if (endpointChoice === '5') {
    baseURL = await simplePrompt(c.yellow('Enter your custom API endpoint: '));
    baseURL = baseURL.trim();
    while (!baseURL) {
      console.log(c.red('❌ API endpoint is required!'));
      baseURL = await simplePrompt(c.yellow('Enter your custom API endpoint: '));
      baseURL = baseURL.trim();
    }
    console.log(c.green(`✅ Custom endpoint: ${baseURL}`));
  } else {
    const preset = ENDPOINT_PRESETS[endpointChoice];
    baseURL = preset.url;
    console.log(c.green(`✅ Selected: ${preset.name} - ${baseURL}`));
  }


    let models: string[] = [];
  if (endpointChoice !== '5') {
    const presetModels = MODEL_PRESETS[endpointChoice];
    console.log(c.gray(`\n💡 Available models for ${presetModels.name}:\n`));
    
    // Display models with numbers
    const maxDisplay = Math.min(presetModels.models.length, 15);
    for (let i = 0; i < maxDisplay; i++) {
      console.log(`  ${c.cyan(`${i + 1}.`)} ${presetModels.models[i]}`);
    }
    
    // Show note if there are more models
    if (presetModels.models.length > maxDisplay) {
      console.log(c.dim(`  ... and ${presetModels.models.length - maxDisplay} more models available`));
    }
    
    // Always show custom option as the last option
    const customOption = maxDisplay + 1;
    console.log(`  ${c.cyan(`${customOption}.`)} Enter custom model(s) manually\n`);

    let modelChoice = '';
    let validModelChoice = false;
    const totalOptions = maxDisplay + 1;

    while (!validModelChoice) {
      const rawChoice = await simplePrompt(c.yellow(`Select model (1-${totalOptions}): `));
      modelChoice = rawChoice.trim();
      
      const numChoice = parseInt(modelChoice);
      if (numChoice >= 1 && numChoice <= totalOptions) {
        validModelChoice = true;
      } else {
        console.log(c.red(`❌ Invalid option. Please enter 1-${totalOptions}`));
      }
    }

    const numChoice = parseInt(modelChoice);
    
    if (numChoice === totalOptions) {
      // Custom option - manual entry
      console.log(c.gray('\n💡 Enter model name(s) for your custom selection:'));
      console.log(c.gray('   You can separate models with commas OR spaces'));
      console.log(c.gray('   Example: gpt-4, claude-3\n'));
      
      const modelsInput = await simplePrompt(c.yellow('Enter model name(s): '));
      models = parseModels(modelsInput);
      while (models.length === 0) {
        console.log(c.red('❌ At least one model is required!'));
        const retryInput = await simplePrompt(c.yellow('Enter model name(s): '));
        models = parseModels(retryInput);
      }
    } else {
      // Single model selection
      const selectedModel = presetModels.models[numChoice - 1];
      models = [selectedModel];
      console.log(c.green(`✅ Selected: ${selectedModel}`));
    }
  } else {
    // Custom endpoint - manual model entry
    console.log(c.gray('\n💡 Enter models for your custom endpoint:'));
    console.log(c.gray('   You can separate models with commas OR spaces'));
    console.log(c.gray('   Example: gpt-4,claude-3,gemini-pro\n'));
    
    let modelsInput = await simplePrompt(c.yellow('Enter model name(s): '));
    models = parseModels(modelsInput);
    
    while (models.length === 0) {
      console.log(c.red('❌ At least one model is required!'));
      modelsInput = await simplePrompt(c.yellow('Enter model name(s): '));
      models = parseModels(modelsInput);
    }
  }

  // Resolve any aliases
  models = resolveModelAliases(models);


  
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
    console.log(c.red(`❌ Invalid option "${rawChoice}". Please enter 1, 2, 3, 4, or 5`));
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

  // ============================================
  // Cancel current request
  // ============================================
  let currentAbortController: AbortController | null = null;
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

  function cancelCurrentRequest(): boolean {
    if (currentAbortController) {
      currentAbortController.abort();
      currentAbortController = null;
      stopSpinner(); // ← ADD THIS - Stop spinner immediately
      return true;
    }
    return false;
  }

  async function raceModels(client: OpenAI, messages: any[]): Promise<{ model: string; message: any }> {
    // Create new abort controller
    currentAbortController = new AbortController();
    const signal = currentAbortController.signal;

    try {
      if (models.length === 1) {
        const res = await client.chat.completions.create({ 
          model: models[0], 
          messages, 
          tools 
        }, { signal });
        return { model: models[0], message: res.choices[0].message };
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
        controllers.forEach((ctl) => ctl.abort());
        return winner;
      } catch (err: any) {
        controllers.forEach((ctl) => ctl.abort());
        throw err;
      }
    } catch (err: any) {
      if (err.name === 'AbortError' || err.message?.includes('abort')) {
        throw new Error('Request cancelled by user');
      }
      throw err;
    } finally {
      currentAbortController = null;
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
      if (currentAbortController?.signal.aborted) {
        stopSpinner();
        return;
      }

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
      
      if (currentAbortController?.signal.aborted) {
        stopSpinner();
        return;
      }
      
      const res = await client.chat.completions.create({ model, messages: history, tools });
      msg = res.choices[0].message;
    }

    history.push(msg);
    write(`${c.cyan(c.bold("●"))} ${c.boldWhite(BRAND)}\r\n${renderReply(msg.content)}\r\n\r\n`);
  } catch (e: any) {
    stopSpinner();
    write(c.red(`✕ ${e.message}`) + "\r\n");
  } finally {
    stopSpinner();
    currentAbortController = null;
  }
}

  return { handleLine, cancelCurrentRequest };
}

const DIR_CONFIG_FILE = path.join(process.cwd(), '.projectx-dir');
const DEFAULT_DIR_NAME = 'codespace';

export function checkDirectoryPermissions(dir: string): {
  exists: boolean;
  readable: boolean;
  writable: boolean;
  executable: boolean;
  message?: string;
} {
  try {
    const resolvedPath = path.resolve(dir);
    const result: any = {
      exists: false,
      readable: false,
      writable: false,
      executable: false,
    };

    if (!fs.existsSync(resolvedPath)) {
      return { ...result, exists: false, message: `Directory does not exist: ${resolvedPath}` };
    }

    result.exists = true;

    try {
      fs.accessSync(resolvedPath, fs.constants.R_OK);
      result.readable = true;
    } catch (e) {
      result.readable = false;
    }

    try {
      fs.accessSync(resolvedPath, fs.constants.W_OK);
      result.writable = true;
    } catch (e) {
      result.writable = false;
    }

    try {
      fs.accessSync(resolvedPath, fs.constants.X_OK);
      result.executable = true;
    } catch (e) {
      result.executable = false;
    }

    if (!result.readable) {
      result.message = `No read permission for: ${resolvedPath}`;
    } else if (!result.writable) {
      result.message = `No write permission for: ${resolvedPath}`;
    } else if (!result.executable) {
      result.message = `No execute permission for: ${resolvedPath}`;
    }

    return result;
  } catch (error: any) {
    return {
      exists: false,
      readable: false,
      writable: false,
      executable: false,
      message: error.message,
    };
  }
}

export function getWorkingDirectory(): string {
  try {
    if (fs.existsSync(DIR_CONFIG_FILE)) {
      const dir = fs.readFileSync(DIR_CONFIG_FILE, 'utf-8').trim();
      if (dir && fs.existsSync(dir)) {
        return dir;
      }
    }
  } catch (e) {}
  
  const defaultDir = path.join(process.cwd(), DEFAULT_DIR_NAME);
  if (!fs.existsSync(defaultDir)) {
    try {
      fs.mkdirSync(defaultDir, { recursive: true });
    } catch (e) {}
  }
  return defaultDir;
}

export function setWorkingDirectory(dir: string): { success: boolean; message: string } {
  try {
    const resolvedPath = path.resolve(dir);
    
    if (!resolvedPath) {
      return { success: false, message: 'Invalid directory path' };
    }

    if (!fs.existsSync(resolvedPath)) {
      try {
        fs.mkdirSync(resolvedPath, { recursive: true });
        console.log(c.dim(`  📁 Created directory: ${resolvedPath}`));
      } catch (error: any) {
        return { success: false, message: `Failed to create directory: ${error.message}` };
      }
    }

    const permissions = checkDirectoryPermissions(resolvedPath);
    if (!permissions.readable) {
      return { success: false, message: `No read permission: ${resolvedPath}` };
    }
    if (!permissions.writable) {
      return { success: false, message: `No write permission: ${resolvedPath}` };
    }

    fs.writeFileSync(DIR_CONFIG_FILE, resolvedPath, 'utf-8');
    return { success: true, message: `Working directory set to: ${resolvedPath}` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

export function resetWorkingDirectory(): { success: boolean; message: string } {
  try {
    if (fs.existsSync(DIR_CONFIG_FILE)) {
      fs.unlinkSync(DIR_CONFIG_FILE);
    }
    const defaultDir = path.join(process.cwd(), DEFAULT_DIR_NAME);
    if (!fs.existsSync(defaultDir)) {
      fs.mkdirSync(defaultDir, { recursive: true });
    }
    return { success: true, message: `Reset to default directory: ${defaultDir}` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
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
  getWorkingDirectory,
  setWorkingDirectory,
  resetWorkingDirectory,
  checkDirectoryPermissions,
};
