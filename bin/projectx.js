#!/usr/bin/env bun

import { join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, rmSync } from 'fs';
import { execSync } from 'child_process';
import readline from 'readline';

// Get the directory where this script is located
const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = join(__dirname, '..');

// Check if project exists - look in src/ for run.ts
const entryFile = join(projectRoot, 'src', 'run.ts');

if (!existsSync(entryFile)) {
    console.error('\x1b[31m❌ Project-X not found in:', projectRoot);
    console.error('\x1b[33m💡 Please reinstall Project-X or check the installation path.\x1b[0m');
    console.error('\x1b[33m💡 Looking for: src/run.ts\x1b[0m');
    process.exit(1);
}

// Parse command line arguments
const args = process.argv.slice(2);
const command = args[0];

// Main function to handle everything
async function main() {
    // If no command or help command, start the agent (default behavior)
    if (!command || command === 'help') {
        console.log('\x1b[36m🚀 Starting Project-X Agent...\x1b[0m\n');
        
        // IMPORTANT: Use the absolute path to the entry file, 
        // but let the process inherit the terminal's current working directory.
        const proc = Bun.spawn(['bun', 'run', entryFile], {
            cwd: process.cwd(), // Keeps the terminal's directory
            stdin: 'inherit',
            stdout: 'inherit',
            stderr: 'inherit',
        });
        
        await proc.exited;
        process.exit(proc.exitCode || 0);
        return;
    }

    // Handle update
    if (command === 'update') {
        console.log('\x1b[34m🔄 Checking for updates for Project-X...\x1b[0m');
        
        try {
            // 1. Pull the latest code from GitHub
            console.log('\x1b[90m  Fetching latest code...\x1b[0m');
            execSync('git pull', { cwd: projectRoot, stdio: 'inherit' });
            
            // 2. Re-install dependencies (in case new ones were added)
            console.log('\x1b[90m  Installing latest dependencies...\x1b[0m');
            execSync('bun install', { cwd: projectRoot, stdio: 'inherit' });
            
            // 3. Re-link the global command (in case package name/path changed)
            console.log('\x1b[90m  Updating global command link...\x1b[0m');
            try {
                execSync('bun link', { cwd: projectRoot, stdio: 'inherit' });
            } catch (e) {
                // If linking fails, just warn the user
                console.log('\x1b[33m  ⚠️ Could not auto-relink global command. Please run `bun link` manually.\x1b[0m');
            }

            console.log('\x1b[32m✅ Project-X has been updated successfully!\x1b[0m');
            process.exit(0);
            
        } catch (error) {
            console.error('\x1b[31m❌ Error during update:\x1b[0m', error.message);
            console.error('\x1b[33m💡 Make sure Git is installed and Project-X was cloned via git.\x1b[0m');
            process.exit(1);
        }
    }

    // Handle delete/uninstall
    if (command === 'delete' || command === 'uninstall' || command === 'remove' || command === 'del') {
        console.log('\x1b[31m⚠️  WARNING: You are about to delete Project-X Agent\x1b[0m');
        console.log('\x1b[33mThis will remove the entire Project-X directory and global command.\x1b[0m');
        console.log('');
        
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        
        rl.question('\x1b[33mAre you sure you want to continue? (yes/no): \x1b[0m', (answer) => {
            rl.close();
            
            // FIXED: Changed `|| "y"` (which was always true) to `&& answer.toLowerCase() !== 'y'`
            if (answer.toLowerCase() !== 'yes' && answer.toLowerCase() !== 'y') {
                console.log('\x1b[32m✅ Uninstall cancelled.\x1b[0m');
                process.exit(0);
            }
            
            console.log('\x1b[34m🗑️  Uninstalling Project-X...\x1b[0m');
            
            try {
                console.log('\x1b[90m  Removing global command...\x1b[0m');
                try {
                    execSync('bun unlink', { cwd: projectRoot, stdio: 'pipe' });
                } catch (e) {} // Ignore if bun unlink fails
                
                console.log('\x1b[90m  Removing project files...\x1b[0m');
                const projectName = projectRoot.split('/').pop();
                
                // Safety check to ensure we only delete if it matches
                if (existsSync(projectRoot) && projectName === 'Project-X-Agent') {
                    rmSync(projectRoot, { recursive: true, force: true });
                    console.log('\x1b[32m  ✅ Project directory removed.\x1b[0m');
                } else {
                    console.log('\x1b[33m  ⚠️ Could not find project directory.\x1b[0m');
                }
                
                console.log('');
                console.log('\x1b[32m✅ Project-X has been successfully uninstalled!\x1b[0m');
                console.log('\x1b[90m   You can reinstall with:\x1b[0m');
                console.log('\x1b[36m 🐧 Linux and 🍎 macOS: curl -fsSL https://projectx.vaibhavrun.space/install.sh | bash\x1b[0m');
                console.log('\x1b[36m 🪟 Windows:powershell -c "irm https://projectx.vaibhavrun.space/install.ps1 | iex"\x1b[0m');
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
    console.log('  \x1b[32mprojectx update\x1b[0m        \x1b[90mUpdate Project-X to the latest version\x1b[0m');
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
