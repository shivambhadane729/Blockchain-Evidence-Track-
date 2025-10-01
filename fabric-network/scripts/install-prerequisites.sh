#!/bin/bash

# Hyperledger Fabric Network Setup Script for NDEP
# This script installs all prerequisites for running the Fabric network

set -e

echo "🚀 Installing Hyperledger Fabric Prerequisites for NDEP..."

# Check if running on Windows
if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" || "$OSTYPE" == "win32" ]]; then
    echo "⚠️  Windows detected. Please install prerequisites manually:"
    echo "   1. Docker Desktop for Windows"
    echo "   2. Docker Compose"
    echo "   3. Git for Windows"
    echo "   4. Node.js (v16 or higher)"
    echo "   5. Hyperledger Fabric binaries"
    exit 0
fi

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    echo "   Visit: https://docs.docker.com/get-docker/"
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    echo "   Visit: https://docs.docker.com/compose/install/"
    exit 1
fi

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    echo "   Visit: https://nodejs.org/"
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 16 ]; then
    echo "❌ Node.js version 16 or higher is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Docker: $(docker --version)"
echo "✅ Docker Compose: $(docker-compose --version)"
echo "✅ Node.js: $(node --version)"

# Create directories
echo "📁 Creating directory structure..."
mkdir -p crypto-config
mkdir -p channel-artifacts
mkdir -p chaincode
mkdir -p scripts

# Download Hyperledger Fabric binaries
echo "⬇️  Downloading Hyperledger Fabric binaries..."
FABRIC_VERSION=2.5.0
CA_VERSION=1.5.0

# Create download script
cat > download-fabric.sh << 'EOF'
#!/bin/bash
curl -sSL https://raw.githubusercontent.com/hyperledger/fabric/main/scripts/bootstrap.sh | bash -s -- 2.5.0 1.5.0
EOF

chmod +x download-fabric.sh
./download-fabric.sh

# Move binaries to PATH
echo "🔧 Setting up Fabric binaries..."
if [ -d "fabric-samples/bin" ]; then
    export PATH=$PWD/fabric-samples/bin:$PATH
    echo 'export PATH=$PWD/fabric-samples/bin:$PATH' >> ~/.bashrc
    echo "✅ Fabric binaries added to PATH"
else
    echo "⚠️  Fabric binaries not found. Please download manually."
fi

# Install Node.js dependencies for chaincode
echo "📦 Installing Node.js dependencies..."
if [ -f "package.json" ]; then
    npm install
else
    # Create package.json for chaincode
    cat > package.json << 'EOF'
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
EOF
    npm install
fi

# Create environment file
echo "⚙️  Creating environment configuration..."
cat > .env << 'EOF'
# Hyperledger Fabric Network Configuration
FABRIC_VERSION=2.5.0
CA_VERSION=1.5.0
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
EOF

echo "✅ Prerequisites installation completed!"
echo ""
echo "🎯 Next steps:"
echo "   1. Run: ./scripts/generate-certs.sh"
echo "   2. Run: ./scripts/create-genesis.sh"
echo "   3. Run: ./scripts/create-channels.sh"
echo "   4. Run: docker-compose up -d"
echo ""
echo "📚 For more information, see README.md"
