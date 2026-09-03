#!/usr/bin/env bash

set -e

REPO_URL="https://github.com/DivyaVaibhav01/Project-X-Agent.git"
INSTALL_DIR="Project-X-Agent"

echo -e "\033[36m🚀 Starting Project-X Agent setup...\033[0m"

# 1. Install Bun if it is not already installed
if ! command -v bun &> /dev/null; then
    echo -e "\033[33m📦 Bun not found. Installing Bun...\033[0m"
    curl -fsSL https://bun.sh/install | bash
    
    # Export Bun environment variables for current session
    export BUN_INSTALL="$HOME/.bun"
    export PATH="$BUN_INSTALL/bin:$PATH"
fi

# 2. Clone or update repository
if [ -d "$INSTALL_DIR" ]; then
    echo -e "\033[33m⚠️ Directory '$INSTALL_DIR' already exists. Updating...\033[0m"
    cd "$INSTALL_DIR"
    git pull
else
    echo -e "\033[34m📥 Cloning repository...\033[0m"
    git clone "$REPO_URL" "$INSTALL_DIR"
    cd "$INSTALL_DIR"
fi

# 3. Install project dependencies
echo -e "\033[34m🛠️ Installing project dependencies with Bun...\033[0m"
bun install

echo -e "\033[32m✔ Installation complete!\033[0m\n"

# 4. Launch agent
bun run agent
