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

# 4. Create bin directory and binary
echo -e "\033[34m🔧 Creating global command '${BIN_NAME}'...\033[0m"
mkdir -p bin

cat > bin/projectx.js << 'EOF'
#!/usr/bin/env bun

import { join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, rmSync } from 'fs';
import { execSync } from 'child_process';
import readline from 'readline';

// Get the directory where this script is located
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = join(__dirname, '..');

// Check if project exists
if (!existsSync(join(projectRoot, 'dev.ts'))) {
    console.error('\x1b[31m❌ Project-X not found in:', projectRoot);
    console.error('\x1b[33m💡 Please reinstall Project-X or check the installation path.\x1b[0m');
    process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

// Main function to handle everything
async function main() {
    // If no command or help command, start the agent (default behavior)
    if (!command || command === 'help') {
        // Start the agent
        process.chdir(projectRoot);
        console.log('\x1b[36m🚀 Starting Project-X Agent...\x1b[0m\n');
        
        const proc = Bun.spawn(['bun', 'run', 'dev.ts'], {
            cwd: projectRoot,
            stdin: 'inherit',
            stdout: 'inherit',
            stderr: 'inherit',
        });
        
        await proc.exited;
        process.exit(proc.exitCode || 0);
        return;
    }

    // Handle delete/uninstall
    if (command === 'delete' || command === 'uninstall') {
        console.log('\x1b[31m⚠️  WARNING: You are about to delete Project-X Agent\x1b[0m');
        console.log('\x1b[33mThis will remove the entire Project-X directory and global command.\x1b[0m');
        console.log('');
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        rl.question('\x1b[33mAre you sure you want to continue? (yes/no): \x1b[0m', (answer) => {
            rl.close();
            
            if (answer.toLowerCase() !== 'yes') {
                console.log('\x1b[32m✅ Uninstall cancelled.\x1b[0m');
                process.exit(0);
            }
            
            console.log('\x1b[34m🗑️  Uninstalling Project-X...\x1b[0m');
            
            try {
                console.log('\x1b[90m  Removing global command...\x1b[0m');
                try {
                    execSync('bun unlink', { cwd: projectRoot, stdio: 'pipe' });
                } catch (e) {}
                
                console.log('\x1b[90m  Removing project files...\x1b[0m');
                const projectName = projectRoot.split('/').pop();
                
                if (existsSync(projectRoot) && projectName === 'Project-X-Agent') {
                    rmSync(projectRoot, { recursive: true, force: true });
                    console.log('\x1b[32m  ✅ Project directory removed.\x1b[0m');
                } else {
                    console.log('\x1b[33m  ⚠️ Could not find project directory.\x1b[0m');
                }
                
                console.log('');
                console.log('\x1b[32m✅ Project-X has been successfully uninstalled!\x1b[0m');
                console.log('\x1b[90m   You can reinstall with:\x1b[0m');
                console.log('\x1b[36m   curl -fsSL https://raw.githubusercontent.com/DivyaVaibhav01/Project-X-Agent/main/install.sh | bash\x1b[0m');
                console.log('');
                
                process.exit(0);
                
            } catch (error) {
                console.error('\x1b[31m❌ Error during uninstall:\x1b[0m', error.message);
                process.exit(1);
            }
        });
        
        return;
    }

    // If we get here, it's an unknown command
    console.log('\x1b[36m🚀 Project-X Agent\x1b[0m');
    console.log('');
    console.log('\x1b[90mUsage:\x1b[0m');
    console.log('  \x1b[32mprojectx\x1b[0m              \x1b[90mStart Project-X Agent (default)\x1b[0m');
    console.log('  \x1b[32mprojectx delete\x1b[0m        \x1b[90mDelete/uninstall Project-X\x1b[0m');
    console.log('  \x1b[32mprojectx uninstall\x1b[0m     \x1b[90mSame as delete\x1b[0m');
    console.log('  \x1b[32mprojectx help\x1b[0m          \x1b[90mShow this help message\x1b[0m');
    console.log('');
    process.exit(0);
}

// Run the main function
main().catch((error) => {
    console.error('\x1b[31m❌ Error:\x1b[0m', error.message);
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
echo -e "\033[36m║         \033[1;32m✅ Project-X Agent Installed Successfully!\033[0m\033[36m         ║\033[0m"
echo -e "\033[36m║                                                             ║\033[0m"
echo -e "\033[36m╚══════════════════════════════════════════════════════════════╝\033[0m"
echo ""
echo -e "\033[1;33m🎯 To start Project-X Agent, simply run:\033[0m"
echo ""
echo -e "   \033[1;32m$BIN_NAME\033[0m"
echo ""
echo -e "\033[90m📌 Commands:\033[0m"
echo -e "   \033[90m$ $BIN_NAME\033[0m          \033[90mStart the agent\033[0m"
echo -e "   \033[90m$ $BIN_NAME delete\033[0m    \033[90mUninstall Project-X\033[0m"
echo -e "   \033[90m$ $BIN_NAME help\033[0m      \033[90mShow help\033[0m"
echo ""
echo -e "\033[36m📦 Repository:\033[0m $REPO_URL"
echo -e "\033[36m⭐ Star us:\033[0m https://github.com/DivyaVaibhav01/Project-X-Agent"
echo -e "\033[36m🐛 Report issues:\033[0m https://github.com/DivyaVaibhav01/Project-X-Agent/issues"
echo ""
echo -e "\033[90m💡 Need to restart terminal? Run: source ~/.bashrc (or source ~/.zshrc)\033[0m"
echo ""