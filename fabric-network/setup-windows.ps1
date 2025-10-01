# Hyperledger Fabric Network Setup Script for NDEP (Windows)
# This script sets up the complete Fabric network on Windows

param(
    [switch]$SkipPrerequisites,
    [switch]$SkipNetwork,
    [switch]$SkipChaincode
)

Write-Host "🚀 Setting up Hyperledger Fabric Network for NDEP..." -ForegroundColor Green

# Check if running as administrator
if (-NOT ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole] "Administrator")) {
    Write-Host "❌ This script requires administrator privileges. Please run as administrator." -ForegroundColor Red
    exit 1
}

# Function to check if command exists
function Test-Command($cmdname) {
    return [bool](Get-Command -Name $cmdname -ErrorAction SilentlyContinue)
}

# Check prerequisites
if (-not $SkipPrerequisites) {
    Write-Host "🔍 Checking prerequisites..." -ForegroundColor Yellow
    
    # Check Docker
    if (-not (Test-Command "docker")) {
        Write-Host "❌ Docker is not installed. Please install Docker Desktop for Windows." -ForegroundColor Red
        Write-Host "   Download from: https://docs.docker.com/desktop/windows/install/" -ForegroundColor Cyan
        exit 1
    }
    
    # Check Docker Compose
    if (-not (Test-Command "docker-compose")) {
        Write-Host "❌ Docker Compose is not installed. Please install Docker Compose." -ForegroundColor Red
        exit 1
    }
    
    # Check Node.js
    if (-not (Test-Command "node")) {
        Write-Host "❌ Node.js is not installed. Please install Node.js (v16 or higher)." -ForegroundColor Red
        Write-Host "   Download from: https://nodejs.org/" -ForegroundColor Cyan
        exit 1
    }
    
    # Check Node.js version
    $nodeVersion = (node -v).Substring(1).Split('.')[0]
    if ([int]$nodeVersion -lt 16) {
        Write-Host "❌ Node.js version 16 or higher is required. Current version: $(node -v)" -ForegroundColor Red
        exit 1
    }
    
    Write-Host "✅ Docker: $(docker --version)" -ForegroundColor Green
    Write-Host "✅ Docker Compose: $(docker-compose --version)" -ForegroundColor Green
    Write-Host "✅ Node.js: $(node --version)" -ForegroundColor Green
}

# Create directory structure
Write-Host "📁 Creating directory structure..." -ForegroundColor Yellow
$directories = @("crypto-config", "channel-artifacts", "chaincode", "scripts")
foreach ($dir in $directories) {
    if (-not (Test-Path $dir)) {
        New-Item -ItemType Directory -Path $dir -Force | Out-Null
        Write-Host "   Created: $dir" -ForegroundColor Gray
    }
}

# Download Hyperledger Fabric binaries
Write-Host "⬇️  Downloading Hyperledger Fabric binaries..." -ForegroundColor Yellow
$fabricVersion = "2.5.0"
$caVersion = "1.5.0"

# Create download script
$downloadScript = @"
#!/bin/bash
curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/bootstrap.sh | bash -s -- $fabricVersion $caVersion
"@

$downloadScript | Out-File -FilePath "download-fabric.sh" -Encoding UTF8

# Execute download script using Git Bash or WSL
if (Test-Command "bash") {
    Write-Host "   Using Git Bash to download Fabric binaries..." -ForegroundColor Gray
    bash download-fabric.sh
} elseif (Test-Command "wsl") {
    Write-Host "   Using WSL to download Fabric binaries..." -ForegroundColor Gray
    wsl bash download-fabric.sh
} else {
    Write-Host "⚠️  Git Bash or WSL not found. Please download Fabric binaries manually:" -ForegroundColor Yellow
    Write-Host "   1. Install Git for Windows or WSL" -ForegroundColor Cyan
    Write-Host "   2. Run: curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/bootstrap.sh | bash -s -- $fabricVersion $caVersion" -ForegroundColor Cyan
}

# Install Node.js dependencies
Write-Host "📦 Installing Node.js dependencies..." -ForegroundColor Yellow
if (Test-Path "package.json") {
    npm install
} else {
    # Create package.json for chaincode
    $packageJson = @"
{
  "name": "ndep-fabric-chaincode",
  "version": "1.0.0",
  "description": "NDEP Hyperledger Fabric Chaincode",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "dependencies": {
    "fabric-contract-api": "^2.2.0",
    "fabric-shim": "^2.2.0"
  },
  "keywords": ["hyperledger", "fabric", "blockchain", "ndep"],
  "author": "NDEP Team",
  "license": "MIT"
}
"@
    $packageJson | Out-File -FilePath "package.json" -Encoding UTF8
    npm install
}

# Create environment file
Write-Host "⚙️  Creating environment configuration..." -ForegroundColor Yellow
$envContent = @"
# Hyperledger Fabric Network Configuration
FABRIC_VERSION=$fabricVersion
CA_VERSION=$caVersion
NETWORK_NAME=ndep-network
CHANNEL_NAME=evidence-channel
CHAINCODE_VERSION=1.0
CHAINCODE_SEQUENCE=1

# Organization Configuration
ORDERER_ORG=ndep.com
POLICE_ORG=police.ndep.com
FORENSIC_ORG=forensic.ndep.com
COURT_ORG=court.ndep.com

# Port Configuration
ORDERER_PORT=7050
POLICE_PEER0_PORT=7051
POLICE_PEER1_PORT=8051
FORENSIC_PEER0_PORT=9051
COURT_PEER0_PORT=10051

# CA Ports
POLICE_CA_PORT=7054
FORENSIC_CA_PORT=8054
COURT_CA_PORT=9054
"@
$envContent | Out-File -FilePath ".env" -Encoding UTF8

# Generate certificates
Write-Host "🔐 Generating certificates..." -ForegroundColor Yellow
if (Test-Command "bash") {
    bash scripts/generate-certs.sh
} else {
    Write-Host "⚠️  Please run generate-certs.sh manually using Git Bash or WSL" -ForegroundColor Yellow
}

# Create genesis block
Write-Host "🏗️  Creating genesis block..." -ForegroundColor Yellow
if (Test-Command "bash") {
    bash scripts/create-genesis.sh
} else {
    Write-Host "⚠️  Please run create-genesis.sh manually using Git Bash or WSL" -ForegroundColor Yellow
}

# Start network
if (-not $SkipNetwork) {
    Write-Host "🚀 Starting Fabric network..." -ForegroundColor Yellow
    docker-compose up -d
    
    # Wait for network to be ready
    Write-Host "⏳ Waiting for network to be ready..." -ForegroundColor Yellow
    Start-Sleep -Seconds 30
    
    # Check if network is running
    $runningContainers = docker ps --format "table {{.Names}}" | Select-String "ndep"
    if ($runningContainers.Count -gt 0) {
        Write-Host "✅ Network started successfully!" -ForegroundColor Green
        Write-Host "   Running containers:" -ForegroundColor Gray
        $runningContainers | ForEach-Object { Write-Host "   - $_" -ForegroundColor Gray }
    } else {
        Write-Host "❌ Network failed to start. Check logs with: docker-compose logs" -ForegroundColor Red
    }
}

# Deploy chaincode
if (-not $SkipChaincode) {
    Write-Host "📦 Deploying chaincode..." -ForegroundColor Yellow
    if (Test-Command "bash") {
        bash scripts/deploy-chaincode.sh
    } else {
        Write-Host "⚠️  Please run deploy-chaincode.sh manually using Git Bash or WSL" -ForegroundColor Yellow
    }
}

Write-Host ""
Write-Host "✅ Hyperledger Fabric Network setup completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Network Information:" -ForegroundColor Cyan
Write-Host "   - Network Name: ndep-network" -ForegroundColor Gray
Write-Host "   - Orderer: localhost:7050" -ForegroundColor Gray
Write-Host "   - Police Peer: localhost:7051" -ForegroundColor Gray
Write-Host "   - Forensic Peer: localhost:9051" -ForegroundColor Gray
Write-Host "   - Court Peer: localhost:10051" -ForegroundColor Gray
Write-Host ""
Write-Host "🎯 Next Steps:" -ForegroundColor Cyan
Write-Host "   1. Test network: docker-compose logs" -ForegroundColor Gray
Write-Host "   2. Deploy chaincode: bash scripts/deploy-chaincode.sh" -ForegroundColor Gray
Write-Host "   3. Integrate with NDEP backend" -ForegroundColor Gray
Write-Host "   4. Update frontend to use blockchain" -ForegroundColor Gray
Write-Host ""
Write-Host "📚 For more information, see README.md" -ForegroundColor Cyan
