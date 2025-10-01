#!/bin/bash

# Create genesis block and channel artifacts for NDEP Fabric Network
# This script generates the genesis block and channel configuration

set -e

echo "🏗️  Creating genesis block and channel artifacts for NDEP Fabric Network..."

# Check if configtxgen is available
if ! command -v configtxgen &> /dev/null; then
    echo "❌ configtxgen not found. Please run install-prerequisites.sh first."
    exit 1
fi

# Check if crypto-config exists
if [ ! -d "crypto-config" ]; then
    echo "❌ crypto-config directory not found. Please run generate-certs.sh first."
    exit 1
fi

# Set environment variables
export FABRIC_CFG_PATH=$PWD
export CHANNEL_NAME=evidence-channel

# Create channel artifacts directory
mkdir -p channel-artifacts

echo "📝 Generating genesis block..."
configtxgen -profile Genesis -channelID system-channel -outputBlock ./channel-artifacts/genesis.block

echo "📝 Generating channel configuration transaction..."
configtxgen -profile EvidenceChannel -outputCreateChannelTx ./channel-artifacts/evidence-channel.tx -channelID evidence-channel

echo "📝 Generating anchor peer transactions..."
configtxgen -profile EvidenceChannel -outputAnchorPeersUpdate ./channel-artifacts/PoliceMSPanchors.tx -channelID evidence-channel -asOrg PoliceMSP

configtxgen -profile EvidenceChannel -outputAnchorPeersUpdate ./channel-artifacts/ForensicMSPanchors.tx -channelID evidence-channel -asOrg ForensicMSP

configtxgen -profile EvidenceChannel -outputAnchorPeersUpdate ./channel-artifacts/CourtMSPanchors.tx -channelID evidence-channel -asOrg CourtMSP

# Create additional channels
echo "📝 Creating custody channel..."
configtxgen -profile CustodyChannel -outputCreateChannelTx ./channel-artifacts/custody-channel.tx -channelID custody-channel

echo "📝 Creating audit channel..."
configtxgen -profile AuditChannel -outputCreateChannelTx ./channel-artifacts/audit-channel.tx -channelID audit-channel

# Verify generated artifacts
echo "✅ Verifying generated artifacts..."
if [ -f "channel-artifacts/genesis.block" ]; then
    echo "✅ Genesis block created successfully"
    ls -la channel-artifacts/genesis.block
else
    echo "❌ Failed to create genesis block"
    exit 1
fi

if [ -f "channel-artifacts/evidence-channel.tx" ]; then
    echo "✅ Evidence channel transaction created successfully"
    ls -la channel-artifacts/evidence-channel.tx
else
    echo "❌ Failed to create evidence channel transaction"
    exit 1
fi

# Create channel artifacts summary
echo "📊 Channel artifacts summary:"
echo "   - Genesis block: $(ls -lh channel-artifacts/genesis.block | awk '{print $5}')"
echo "   - Evidence channel: $(ls -lh channel-artifacts/evidence-channel.tx | awk '{print $5}')"
echo "   - Custody channel: $(ls -lh channel-artifacts/custody-channel.tx | awk '{print $5}')"
echo "   - Audit channel: $(ls -lh channel-artifacts/audit-channel.tx | awk '{print $5}')"
echo "   - Police anchors: $(ls -lh channel-artifacts/PoliceMSPanchors.tx | awk '{print $5}')"
echo "   - Forensic anchors: $(ls -lh channel-artifacts/ForensicMSPanchors.tx | awk '{print $5}')"
echo "   - Court anchors: $(ls -lh channel-artifacts/CourtMSPanchors.tx | awk '{print $5}')"

echo ""
echo "✅ Genesis block and channel artifacts creation completed!"
echo ""
echo "📋 Generated artifacts:"
echo "   - Genesis block for system channel"
echo "   - Evidence channel configuration"
echo "   - Custody channel configuration"
echo "   - Audit channel configuration"
echo "   - Anchor peer updates for all organizations"
echo ""
echo "🎯 Next step: Run docker-compose up -d to start the network"
