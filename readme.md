# ⚡ Project X Agent — Web Terminal & AI Agent

**Project X** is a CLI and Web-based AI terminal agent that supports interactive model execution, tool calling (reading, writing, and deleting local files), and parallel model race modes. Built for high performance using [Bun](https://bun.sh) and [Xterm.js](https://xtermjs.org/).

---

## ✨ Features

- **Dual Terminal Access**: Runs natively in your OS terminal console or directly in the browser via WebSockets.
- **Interactive Setup Wizard**: Prompts for API Endpoint, API Key, and Models on first run and generates `.env` automatically.
- **Adaptive Model Execution**:
  - **1 Model**: Executes standard single-model API completion.
  - **2+ Models**: Triggers **Race Mode**, querying multiple models concurrently and returning whichever responds first.
- **Integrated Tool Calling**: Perform file actions directly through the agent:
  - `read_file` — Reads local files.
  - `write_file` — Creates or edits files.
  - `delete_file` — Safely deletes specified files with explicit confirmation.
- **ANSI & Markdown Code Styling**: Custom terminal code block rendering with language labels and syntax framing.
- **Rate Limiting**: Built-in request throttle control to protect API quotas.

---

## 📸 Overview

![Project X Agent CLI Banner](https://github.com/DivyaVaibhav01/Project-X-Agent/blob/main/content/Screenshot%20From%202026-09-03%2016-09-09.png?raw=true)
*Project X running directly in the CLI terminal with Race Mode enabled.*

![Project X Agents Web Terminal Preview](https://github.com/DivyaVaibhav01/Project-X-Agent/blob/main/content/Screenshot%20From%202026-09-03%2016-08-10.png?raw=true)
*Project X running via WebSockets in the browser web terminal.*

## 📋 Prerequisites

You must have **[Bun](https://bun.sh)** installed on your machine before running this project.

### Installing Bun

**macOS / Linux / WSL:**
```bash
curl -fsSL [https://bun.sh/install](https://bun.sh/install) | bash
```

## Windows (Powershell):
```bash
powershell -c "irm bun.sh/install.ps1 | iex"
```

## Verify installation:
```bash
bun --version`
```

# 🚀 Getting Started

## 1. Download Projext-X-Agent
```bash
git clone [https://github.com/DivyaVaibhav01/project-x.git](https://github.com/DivyaVaibhav01/project-x.git)
cd project-x
```

## 2. Install Dependencies

```bash
bun install
```


## 3. Run the Agent
```bash
bun run agent
```

# 🌐 Web Terminal Usage
Once the server is running, open your browser and navigate to:
```bash
http://localhost:3001
```
You can execute prompts, interact with the agent, manage local files, and type exit or quit to end your session


# 🛠️ Built With
Runtime & Server: Bun
Frontend Terminal: Xterm.js
AI Provider Client: OpenAI Node SDK




