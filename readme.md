# ⚡ Project X — Web Terminal & AI Agent

**Project X** is a CLI and Web-based AI terminal agent that supports interactive model execution, tool calling (reading, writing, and deleting local files), and parallel model race modes. Built for high performance using [Bun](https://bun.sh) and [Xterm.js](https://xtermjs.org/).

> *"a compile of multiple work in one, made by Vaibhav Dev"*

---

## ✨ Features

- **Dual Terminal Access**: Runs natively in your OS terminal console or directly in the browser via WebSockets.
- **Interactive Setup Wizard**: Prompts for API Endpoint, API Key, and Models on first run.
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

## 📋 Prerequisites

You must have **[Bun](https://bun.sh)** installed on your machine before running this project.

### Installing Bun

**macOS / Linux / WSL:**
```bash
curl -fsSL [https://bun.sh/install](https://bun.sh/install) | bash``
