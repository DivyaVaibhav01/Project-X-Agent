#!/usr/bin/env bash

set -e

REPO_URL="https://github.com/DivyaVaibhav01/Project-X-Agent.git"
INSTALL_DIR="Project-X-Agent"
BIN_NAME="projectx"

echo -e "\033[36m🚀 Starting Project-X Agent setup...\033[0m"

# 1. Install Bun if it is not already installed
if ! command -v bun &> /dev/null; then
    echo -e "\033[33m📦 Bun not found. Installing Bun...\033[0m"
    curl -fsSL https://bun.sh/install | bash
    
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

# 4. Create global binary
echo -e "\033[34m🔧 Creating global command '${BIN_NAME}'...\033[0m"
mkdir -p bin

cat > bin/projectx.js << 'EOF'
#!/usr/bin/env bun

import { join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync } from 'fs';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = join(__dirname, '..');

if (!existsSync(join(projectRoot, 'index.ts'))) {
    console.error('\x1b[31m❌ Project-X not found in:', projectRoot);
    console.error('\x1b[33m💡 Please reinstall Project-X or check the installation path.\x1b[0m');
    process.exit(1);
}

process.chdir(projectRoot);
import('./index.ts').then(({ main }) => {
    main().catch(console.error);
}).catch((err) => {
    console.error('\x1b[31m❌ Failed to start Project-X:\x1b[0m', err.message);
    process.exit(1);
});
EOF

chmod +x bin/projectx.js

# 5. Link globally
echo -e "\033[34m🔗 Linking global command...\033[0m"
bun link

# 6. Add to PATH if needed
BUN_GLOBAL_BIN="$HOME/.bun/bin"
if [[ ":$PATH:" != *":$BUN_GLOBAL_BIN:"* ]]; then
    echo -e "\033[33m⚠️ Adding Bun global bin to PATH...\033[0m"
    echo "export PATH=\"\$HOME/.bun/bin:\$PATH\"" >> "$HOME/.bashrc"
    echo "export PATH=\"\$HOME/.bun/bin:\$PATH\"" >> "$HOME/.zshrc" 2>/dev/null || true
    export PATH="$HOME/.bun/bin:$PATH"
fi

clear

# 7. Show success message
echo -e "\033[36m╔══════════════════════════════════════════════════════════════╗\033[0m"
echo -e "\033[36m║                                                             ║\033[0m"
echo -e "\033[36m║         \033[1;32m✅ Installation Complete!\033[0m\033[36m                           ║\033[0m"
echo -e "\033[36m║                                                             ║\033[0m"
echo -e "\033[36m╚══════════════════════════════════════════════════════════════╝\033[0m"
echo ""
echo -e "\033[1;33m🎯 To start Project-X Agent, simply run:\033[0m"
echo -e ""
echo -e "   \033[1;32m$BIN_NAME\033[0m"
echo -e ""
echo -e "\033[90m📌 Example:\033[0m"
echo -e "   \033[90m$ projectx\033[0m"
echo -e "   \033[90m$ projectx edit\033[0m"
echo -e "   \033[90m$ projectx reload\033[0m"
echo -e ""
echo -e "\033[36m📦 Repository:\033[0m $REPO_URL"
echo -e "\033[36m⭐ Star us:\033[0m https://github.com/DivyaVaibhav01/Project-X-Agent"
echo -e "\033[36m🐛 Report issues:\033[0m https://github.com/DivyaVaibhav01/Project-X-Agent/issues"
echo ""
echo -e "\033[90m💡 Need to restart terminal? Run: source ~/.bashrc (or source ~/.zshrc)\033[0m"
echo ""
