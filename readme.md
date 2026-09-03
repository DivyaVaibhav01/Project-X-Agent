
## 🌌 The Next Generation AI Terminal Project-X Agent

**Project X Agent** isn't just another AI wrapper — it's a **high-velocity, dual-environment AI agent** that brings the power of parallel model execution to your fingertips. Whether you're in your native CLI or a browser-based terminal, Project X delivers **blazing-fast** AI interactions with built-in tool calling and real-time file system operations.

> **⚡ "Speed meets intelligence — where milliseconds decide the winner."**

---


## ⚡ Quick One-Line Installation

Launch Project X instantly with a single command:

#### 🐧 Linux and 🍎 macOS:
```bash
curl -fsSL https://raw.githubusercontent.com/DivyaVaibhav01/Project-X-Agent/main/install/all/install.sh | bash
```
#### 🪟 Windows Installation:
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

# 📸 Overview

<table>
  <tr>
    <td width="50%" align="center">
      <img src="https://github.com/DivyaVaibhav01/Project-X-Agent/blob/main/content/Screenshot%20From%202026-09-03%2016-09-09.png?raw=true" alt="Project X CLI Terminal" width="90%">
      <br>
      <sub><b>💻 CLI Mode</b> · Race Mode Enabled</sub>
    </td>
    <td width="50%" align="center">
      <img src="https://github.com/DivyaVaibhav01/Project-X-Agent/blob/main/content/Screenshot%20From%202026-09-03%2016-08-10.png?raw=true" alt="Project X Web Terminal" width="90%">
      <br>
      <sub><b>🌐 Web Mode</b> · WebSocket Terminal</sub>
    </td>
  </tr>
</table>

<p align="center">
  <i>⚡ Project X running in CLI (left) and Browser Web Terminal (right) with Race Mode enabled</i>
</p>

# 🌐 Web Terminal Usage
Once the server is running, open your browser and navigate to:
```bash
http://localhost:3001
```

# ⚡ Race Mode Competition Flow
```mermaid
flowchart TD
    Start([👤 User Sends Message]) --> Receive[📥 Receive User Query]
    Receive --> Parse[🔍 Parse & Analyze Query]
    Parse --> RaceStart[🏁 START RACE MODE]
    
    RaceStart --> Spawn1[🤖 Spawn Module 1: GPT-4o]
    RaceStart --> Spawn2[🧠 Spawn Module 2: Claude 3.5]
    RaceStart --> Spawn3[💡 Spawn Module 3: Gemini]
    RaceStart --> Spawn4[🔄 Spawn Module 4: Llama 3]
    
    Spawn1 --> Process1[Processing...]
    Spawn2 --> Process2[Processing...]
    Spawn3 --> Process3[Processing...]
    Spawn4 --> Process4[Processing...]
    
    Process1 --> Check1{Reply Ready?}
    Process2 --> Check2{Reply Ready?}
    Process3 --> Check3{Reply Ready?}
    Process4 --> Check4{Reply Ready?}
    
    Check1 -->|No| Process1
    Check2 -->|No| Process2
    Check3 -->|No| Process3
    Check4 -->|No| Process4
    
    Check1 -->|Yes 🥇| Winner[🏆 Module 1 Wins!]
    Check2 -->|Yes 🥇| Winner
    Check3 -->|Yes 🥇| Winner
    Check4 -->|Yes 🥇| Winner
    
    Winner --> GetResponse[📨 Get Response from Winner]
    GetResponse --> CancelOthers[⛔ Cancel Other Modules]
    CancelOthers --> Validate[✅ Validate Response]
    Validate --> Format[📝 Format Response]
    Format --> Send[📤 Send Reply to User]
    Send --> End([✅ User Receives Reply])
    
    style Start fill:#6BCF7F,color:#fff
    style End fill:#4FC3F7,color:#fff
    style RaceStart fill:#FF6B6B,color:#fff
    style Winner fill:#FFD93D,color:#000
    style Send fill:#6BCF7F,color:#fff
    style CancelOthers fill:#FF8A80,color:#fff
```

# 🔄 Module Interaction Flow
```mermaid
flowchart LR
    subgraph Modules["📦 Project-X Modules"]
        direction TB


        
        subgraph Backend["🖥️ Backend"]
            Bun["⚡ Bun Server"]
        end
        
        subgraph Frontend["🖥️ Frontend"]
            Xterm["🎨 Xterm.js"]
        end
        
        subgraph AI["🧠 AI Layer"]
            OpenAI["🤖 OpenAI Client"]
        end
    end
    
    User["👤 User"] -->|Uses| Xterm
    Xterm -->|WebSocket| Bun
    Bun -->|API Calls| OpenAI
    OpenAI -->|Models| GPT["GPT-4o<br>Claude<br>Gemini"]
    GPT -->|Responses| Bun
    Bun -->|Real-time| Xterm
    Xterm -->|Display| User
    
    style Modules fill:#0a0e17,stroke:#00d4ff,color:#e6f1ff
    style Backend fill:#1a2a3f,stroke:#4fc3f7
    style Frontend fill:#1a2a3f,stroke:#ffd93d
    style AI fill:#1a2a3f,stroke:#6bcf7f
    style User fill:#FFD93D,color:#000
```

### Made with ❤️ VaibhavDev


