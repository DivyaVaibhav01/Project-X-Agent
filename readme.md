
## 🌌 The Next Generation AI Terminal Project-X Agent

**Project X Agent** isn't just another AI wrapper — it's a **high-velocity, dual-environment AI agent** that brings the power of parallel model execution to your fingertips. Whether you're in your native CLI or a browser-based terminal, Project X delivers **blazing-fast** AI interactions with built-in tool calling and real-time file system operations.

> **⚡ "Speed meets intelligence — where milliseconds decide the winner."**

---


## ⚡ Quick One-Line Installation

Launch Project X instantly with a single command:

#### 🐧 Linux and 🍎 macOS Installation...
```bash
curl -fsSL https://raw.githubusercontent.com/DivyaVaibhav01/Project-X-Agent/main/install/all/install.sh | bash
```
#### 🪟 Windows Installation...
```powershell
powershell -c "irm https://raw.githubusercontent.com/DivyaVaibhav01/Project-X-Agent/main/install/windows/install.ps1 | iex"
```


## ✨ Quantum Features

| Feature | Description |
|---------|-------------|
| 🖥️ **Dual Terminal Access** | Run natively in your OS terminal or browser via WebSockets |
| 🔄 **Race Mode** | Query 2+ AI models simultaneously — the fastest wins |
| 🎯 **Single Mode** | Standard single-model execution for precision tasks |
| 📂 **Tool Calling** | `read_file`, `write_file`, `delete_file` with safety confirmations |
| 🎨 **ANSI + Markdown** | Beautiful terminal rendering with syntax highlighting |
| 🛡️ **Rate Limiting** | Built-in quota protection to prevent overages |
| ⚡ **Zero-Config Setup** | Interactive wizard generates `.env` automatically |
| 🔐 **Secure** | API keys never exposed — stored locally only |

---

## 🧠 How It Works

### Architecture Flow

```mermaid
flowchart TB
    subgraph UI["🖥️ User Interface Layer"]
        direction LR
        CLI["💻 Native CLI<br><small>Bun Runtime</small>"]
        Web["🌐 Web Browser<br><small>Xterm.js Terminal</small>"]
    end

    subgraph Gateway["🌉 Communication Gateway"]
        WS["🔌 WebSocket Server<br><small>Bun-native • Bi-directional</small>"]
    end

    subgraph Core["⚙️ Core Orchestration Engine"]
        direction TB
        Router["🎯 Smart Model Router<br><small>Load Balancer • Fallback Logic</small>"]
        Cache["💾 Response Cache<br><small>Redis-backed • 5min TTL</small>"]
        Parser["📝 Context Parser<br><small>Token Counter • Truncation</small>"]
    end

    subgraph Models["🤖 AI Model Pool"]
        direction LR
        M1["GPT-4o<br><small>Primary • 128k ctx</small>"]
        M2["Claude 3.5<br><small>Secondary • 200k ctx</small>"]
        M3["Gemini Pro<br><small>Fallback • 1M ctx</small>"]
        M4["Llama 3<br><small>Local • 8k ctx</small>"]
    end

    subgraph Tools["🔧 Tool Execution Engine"]
        direction LR
        Read["📖 read_file<br><small>Async I/O</small>"]
        Write["✏️ write_file<br><small>Atomic Write</small>"]
        Delete["🗑️ delete_file<br><small>Safe Delete</small>"]
        Exec["⚡ execute_command<br><small>Sandboxed</small>"]
        Search["🔍 search_code<br><small>RIPGrep</small>"]
    end

    subgraph Output["📊 Output Management"]
        Terminal["🖥️ Terminal Output<br><small>ANSI Colors • Real-time</small>"]
        Logs["📋 Audit Logs<br><small>JSONL • Rotating</small>"]
        Metrics["📈 Performance Metrics<br><small>Prometheus Export</small>"]
    end

    UI -->|WebSocket Connection| Gateway
    Gateway -->|JSON-RPC| Core
    
    CLI -->|Direct| Gateway
    Web -->|Browser| Gateway
    
    Router -->|Priority-based| Models
    Models -->|Streaming Response| Router
    Router -->|Fastest Wins| Gateway
    
    Router -->|Tool Call| Tools
    Tools -->|Success/Failure| Router
    
    Tools -->|stdout/stderr| Terminal
    Tools -->|Operations| Logs
    Core -->|Latency/Usage| Metrics
    
    Parser -->|Pre-process| Router
    Cache -->|Cache Hit/Miss| Router
    Router -->|Cache Store| Cache

    classDef uiStyle fill:#e1f5fe,stroke:#01579b,stroke-width:2px
    classDef gatewayStyle fill:#f3e5f5,stroke:#4a148c,stroke-width:2px
    classDef coreStyle fill:#e8f5e9,stroke:#1b5e20,stroke-width:2px
    classDef modelStyle fill:#fff3e0,stroke:#e65100,stroke-width:2px
    classDef toolStyle fill:#fce4ec,stroke:#b71c1c,stroke-width:2px
    classDef outputStyle fill:#e0f7fa,stroke:#00695c,stroke-width:2px

    class CLI,Web uiStyle
    class WS gatewayStyle
    class Router,Cache,Parser coreStyle
    class M1,M2,M3,M4 modelStyle
    class Read,Write,Delete,Exec,Search toolStyle
    class Terminal,Logs,Metrics outputStyle
```


## 📸 Overview

![Project X Agent CLI Banner](https://github.com/DivyaVaibhav01/Project-X-Agent/blob/main/content/Screenshot%20From%202026-09-03%2016-09-09.png?raw=true)
*Project X running directly in the CLI terminal with Race Mode enabled.*

![Project X Agents Web Terminal Preview](https://github.com/DivyaVaibhav01/Project-X-Agent/blob/main/content/Screenshot%20From%202026-09-03%2016-08-10.png?raw=true)
*Project X running via WebSockets in the browser web terminal.*

# 🌐 Web Terminal Usage
Once the server is running, open your browser and navigate to:
```bash
http://localhost:3001
```
You can execute prompts, interact with the agent, manage local files, and type exit or quit to end your session


### 🛠️ Built With

| Source | Worker |
|------------|--------------|
| **Runtime & Server** | [<img src="https://img.shields.io/badge/Bun-000000?style=for-the-badge&logo=bun&logoColor=white" alt="Bun" />](https://bun.sh) |
| **Frontend Terminal** | [![Xterm.js](https://img.shields.io/badge/xterm.js-20232A?style=for-the-badge&logo=xterm&logoColor=white)](https://xtermjs.org) |
| **AI Provider Client** | [![OpenAI](https://img.shields.io/badge/OpenAI-412991?style=for-the-badge&logo=openai&logoColor=white)](https://www.npmjs.com/package/openai) |


### Made with ❤️ VaibhavDev


