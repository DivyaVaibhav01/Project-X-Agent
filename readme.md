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
curl -fsSL https://bun.sh/install | bash
```

## Windows (Powershell):
```bash
powershell -c "irm bun.sh/install.ps1 | iex"
```

## Verify installation:
```bash
bun --version`
```


## ⚡ Quick One-Line Installation

Install Bun (if missing), clone the repository, set up dependencies, and launch Project X instantly with a single command:

```bash
curl -fsSL https://raw.githubusercontent.com/DivyaVaibhav01/Project-X-Agent/main/install.sh | bash

```


# 🌐 Web Terminal Usage
Once the server is running, open your browser and navigate to:
```bash
http://localhost:3001
```
You can execute prompts, interact with the agent, manage local files, and type exit or quit to end your session


# 🛠️ Built With

| Technology | Logo / Badge |
|------------|--------------|
| **Runtime & Server** | ![Bun](https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white) |
| **Frontend Terminal** | ![Xterm.js](https://img.shields.io/badge/xterm.js-20232A?style=for-the-badge&logo=xterm&logoColor=white) |
| **AI Provider Client** | ![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white) |

---

### 📦 Detailed Versions

- **Bun** – JavaScript runtime & package manager  
- **Xterm.js** – Terminal emulator for the browser  
- **OpenAI Node SDK** – Official Node.js client for OpenAI APIs
- 




