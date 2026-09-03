# install.ps1 - Windows PowerShell Installer for Project-X Agent

Write-Host "🚀 Starting Project-X Agent setup..." -ForegroundColor Cyan

# 1. Check if Bun is installed
$bunInstalled = Get-Command bun -ErrorAction SilentlyContinue
if (-not $bunInstalled) {
    Write-Host "📦 Bun not found. Installing Bun..." -ForegroundColor Yellow
    powershell -c "irm bun.sh/install.ps1 | iex"
    
    # Add Bun to PATH for current session
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","Machine") + ";" + [System.Environment]::GetEnvironmentVariable("Path","User")
}

# 2. Clone or update repository
$installDir = "Project-X-Agent"
if (Test-Path $installDir) {
    Write-Host "⚠️ Directory '$installDir' already exists. Updating..." -ForegroundColor Yellow
    Set-Location $installDir
    git pull
} else {
    Write-Host "📥 Cloning repository..." -ForegroundColor Cyan
    git clone https://github.com/DivyaVaibhav01/Project-X-Agent.git $installDir
    Set-Location $installDir
}

# 3. Install dependencies
Write-Host "🛠️ Installing project dependencies with Bun..." -ForegroundColor Cyan
bun install

# 4. Create src directory structure
Write-Host "📁 Setting up src directory..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "src/types" | Out-Null
New-Item -ItemType Directory -Force -Path "src/utils" | Out-Null

# 5. Move files to src if needed
Get-ChildItem -Filter "*.ts" -File | ForEach-Object {
    if ($_.Name -notin @("run.ts", "index.ts", "server.ts", "agent.ts")) {
        Move-Item $_.FullName -Destination "src/" -Force -ErrorAction SilentlyContinue
    }
}

# 6. Create run.ts if it doesn't exist in src
if (-not (Test-Path "src/run.ts")) {
    Write-Host "📝 Creating src/run.ts..." -ForegroundColor Cyan
    @'
#!/usr/bin/env bun

declare const Bun: any;
declare const process: any;

declare global {
  interface ImportMeta {
    readonly dir: string;
  }
}

import fs from 'fs';
import path from 'path';

const projectRoot = path.join(import.meta.dir, '..');

// Check if .env exists before starting
const envPath = path.join(projectRoot, '.env');
if (!fs.existsSync(envPath)) {
  console.log('\x1b[33m⚠️  No .env file found. The CLI will prompt for configuration.\x1b[0m\n');
}

// Start server in background
const server = Bun.spawn(["bun", "run", "src/server.ts"], {
  stdout: "inherit",
  stderr: "inherit",
  cwd: projectRoot,
});

console.log(`\x1b[90m  (web terminal starting in background — check the URL it prints)\x1b[0m\n`);

// Give the server more time to boot
console.log('\x1b[90m  Waiting for server to start...\x1b[0m');
await new Promise((r) => setTimeout(r, 2000));
console.log('\x1b[90m  Starting CLI...\x1b[0m\n');

// Start CLI
const cli = Bun.spawn(["bun", "run", "src/index.ts"], {
  stdin: "inherit",
  stdout: "inherit",
  stderr: "inherit",
  cwd: projectRoot,
});

// If CLI exits, kill server too
await cli.exited;
server.kill();
process.exit(0);
'@ | Out-File -FilePath "src/run.ts" -Encoding UTF8
}

# 7. Create bin directory and binary
Write-Host "🔧 Creating global command 'projectx'..." -ForegroundColor Cyan
New-Item -ItemType Directory -Force -Path "bin" | Out-Null

@'
#!/usr/bin/env bun

import { join } from 'path';
import { fileURLToPath } from 'url';
import { existsSync, rmSync } from 'fs';
import { execSync } from 'child_process';
import readline from 'readline';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const projectRoot = join(__dirname, '..');

const entryFile = join(projectRoot, 'src', 'run.ts');

if (!existsSync(entryFile)) {
    console.error('\x1b[31m❌ Project-X not found in:', projectRoot);
    console.error('\x1b[33m💡 Please reinstall Project-X or check the installation path.\x1b[0m');
    process.exit(1);
}

const args = process.argv.slice(2);
const command = args[0];

async function main() {
    if (!command || command === 'help') {
        process.chdir(projectRoot);
        console.log('\x1b[36m🚀 Starting Project-X Agent...\x1b[0m\n');
        
        const proc = Bun.spawn(['bun', 'run', 'src/run.ts'], {
            cwd: projectRoot,
            stdin: 'inherit',
            stdout: 'inherit',
            stderr: 'inherit',
        });
        
        await proc.exited;
        process.exit(proc.exitCode || 0);
        return;
    }

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
                console.log('\x1b[36m   powershell -c "irm https://raw.githubusercontent.com/DivyaVaibhav01/Project-X-Agent/main/install.ps1 | iex"\x1b[0m');
                console.log('');
                
                process.exit(0);
                
            } catch (error) {
                console.error('\x1b[31m❌ Error during uninstall:\x1b[0m', error.message);
                process.exit(1);
            }
        });
        
        return;
    }

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

main().catch((error) => {
    console.error('\x1b[31m❌ Error:\x1b[0m', error.message);
    process.exit(1);
});
'@ | Out-File -FilePath "bin/projectx.js" -Encoding UTF8

# 8. Link globally
Write-Host "🔗 Linking global command..." -ForegroundColor Cyan
bun link

# 9. Create a batch file for Windows users
Write-Host "📝 Creating projectx.bat for Windows..." -ForegroundColor Cyan
@'
@echo off
echo 🚀 Project-X Agent
echo.
bun run src/index.ts %*
'@ | Out-File -FilePath "projectx.bat" -Encoding ASCII

# 10. Add to PATH if needed
$bunBinPath = "$env:USERPROFILE\.bun\bin"
if ($env:Path -notlike "*$bunBinPath*") {
    Write-Host "⚠️ Adding Bun to PATH..." -ForegroundColor Yellow
    [Environment]::SetEnvironmentVariable("Path", $env:Path + ";$bunBinPath", "User")
    $env:Path = [System.Environment]::GetEnvironmentVariable("Path","User")
}

Clear-Host

# 11. Show success message
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║                                                             ║" -ForegroundColor Cyan
Write-Host "║         ✅ Project-X Agent Installed Successfully!         ║" -ForegroundColor Green
Write-Host "║                                                             ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "🎯 To start Project-X Agent, simply run:" -ForegroundColor Yellow
Write-Host ""
Write-Host "   projectx" -ForegroundColor Green
Write-Host ""
Write-Host "📌 Commands:" -ForegroundColor Gray
Write-Host "   projectx          Start the agent" -ForegroundColor Gray
Write-Host "   projectx delete   Uninstall Project-X" -ForegroundColor Gray
Write-Host "   projectx help     Show help" -ForegroundColor Gray
Write-Host ""
Write-Host "📦 Repository: https://github.com/DivyaVaibhav01/Project-X-Agent" -ForegroundColor Cyan
Write-Host "⭐ Star us: https://github.com/DivyaVaibhav01/Project-X-Agent" -ForegroundColor Cyan
Write-Host "🐛 Report issues: https://github.com/DivyaVaibhav01/Project-X-Agent/issues" -ForegroundColor Cyan
Write-Host ""
Write-Host "💡 Need to restart terminal? Close and reopen your terminal." -ForegroundColor Gray
Write-Host ""