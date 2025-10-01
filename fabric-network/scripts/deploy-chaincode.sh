#!/bin/bash

# Deploy Evidence Management Chaincode to NDEP Fabric Network
# This script packages, installs, and instantiates the chaincode

set -e

echo "🚀 Deploying Evidence Management Chaincode to NDEP Fabric Network..."

# Set environment variables
export FABRIC_CFG_PATH=$PWD
export CHANNEL_NAME=evidence-channel
export CHAINCODE_NAME=evidence-management
export CHAINCODE_VERSION=1.0
export CHAINCODE_SEQUENCE=1
export PACKAGE_ID=""

# Check if network is running
if ! docker ps | grep -q "orderer.ndep.com"; then
    echo "❌ Fabric network is not running. Please start the network first:"
    echo "   docker-compose up -d"
    exit 1
fi

# Wait for network to be ready
echo "⏳ Waiting for network to be ready..."
sleep 10

# Set environment variables for peer commands
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_LOCALMSPID=PoliceMSP
export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/crypto-config/peerOrganizations/police.ndep.com/peers/peer0.police.ndep.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$PWD/crypto-config/peerOrganizations/police.ndep.com/users/Admin@police.ndep.com/msp
export CORE_PEER_ADDRESS=localhost:7051

# Package chaincode
echo "📦 Packaging chaincode..."
peer lifecycle chaincode package ${CHAINCODE_NAME}.tar.gz --path ./chaincode/evidence-management --lang node --label ${CHAINCODE_NAME}_${CHAINCODE_VERSION}

# Install chaincode on Police peer
echo "📥 Installing chaincode on Police peer..."
peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz

# Get package ID
PACKAGE_ID=$(peer lifecycle chaincode queryinstalled --output json | jq -r '.installed_chaincodes[0].package_id')
echo "📋 Package ID: $PACKAGE_ID"

# Approve chaincode for Police organization
echo "✅ Approving chaincode for Police organization..."
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.ndep.com --tls --cafile $PWD/crypto-config/ordererOrganizations/ndep.com/orderers/orderer.ndep.com/msp/tlscacerts/tlsca.ndep.com-cert.pem --channelID $CHANNEL_NAME --name $CHAINCODE_NAME --version $CHAINCODE_VERSION --package-id $PACKAGE_ID --sequence $CHAINCODE_SEQUENCE

# Switch to Forensic organization
echo "🔄 Switching to Forensic organization..."
export CORE_PEER_LOCALMSPID=ForensicMSP
export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/crypto-config/peerOrganizations/forensic.ndep.com/peers/peer0.forensic.ndep.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$PWD/crypto-config/peerOrganizations/forensic.ndep.com/users/Admin@forensic.ndep.com/msp
export CORE_PEER_ADDRESS=localhost:9051

# Install chaincode on Forensic peer
echo "📥 Installing chaincode on Forensic peer..."
peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz

# Approve chaincode for Forensic organization
echo "✅ Approving chaincode for Forensic organization..."
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.ndep.com --tls --cafile $PWD/crypto-config/ordererOrganizations/ndep.com/orderers/orderer.ndep.com/msp/tlscacerts/tlsca.ndep.com-cert.pem --channelID $CHANNEL_NAME --name $CHAINCODE_NAME --version $CHAINCODE_VERSION --package-id $PACKAGE_ID --sequence $CHAINCODE_SEQUENCE

# Switch to Court organization
echo "🔄 Switching to Court organization..."
export CORE_PEER_LOCALMSPID=CourtMSP
export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/crypto-config/peerOrganizations/court.ndep.com/peers/peer0.court.ndep.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$PWD/crypto-config/peerOrganizations/court.ndep.com/users/Admin@court.ndep.com/msp
export CORE_PEER_ADDRESS=localhost:10051

# Install chaincode on Court peer
echo "📥 Installing chaincode on Court peer..."
peer lifecycle chaincode install ${CHAINCODE_NAME}.tar.gz

# Approve chaincode for Court organization
echo "✅ Approving chaincode for Court organization..."
peer lifecycle chaincode approveformyorg -o localhost:7050 --ordererTLSHostnameOverride orderer.ndep.com --tls --cafile $PWD/crypto-config/ordererOrganizations/ndep.com/orderers/orderer.ndep.com/msp/tlscacerts/tlsca.ndep.com-cert.pem --channelID $CHANNEL_NAME --name $CHAINCODE_NAME --version $CHAINCODE_VERSION --package-id $PACKAGE_ID --sequence $CHAINCODE_SEQUENCE

# Switch back to Police organization for commit
echo "🔄 Switching back to Police organization for commit..."
export CORE_PEER_LOCALMSPID=PoliceMSP
export CORE_PEER_TLS_ROOTCERT_FILE=$PWD/crypto-config/peerOrganizations/police.ndep.com/peers/peer0.police.ndep.com/tls/ca.crt
export CORE_PEER_MSPCONFIGPATH=$PWD/crypto-config/peerOrganizations/police.ndep.com/users/Admin@police.ndep.com/msp
export CORE_PEER_ADDRESS=localhost:7051

# Check commit readiness
echo "🔍 Checking commit readiness..."
peer lifecycle chaincode checkcommitreadiness --channelID $CHANNEL_NAME --name $CHAINCODE_NAME --version $CHAINCODE_VERSION --sequence $CHAINCODE_SEQUENCE --output json

# Commit chaincode
echo "🚀 Committing chaincode to channel..."
peer lifecycle chaincode commit -o localhost:7050 --ordererTLSHostnameOverride orderer.ndep.com --tls --cafile $PWD/crypto-config/ordererOrganizations/ndep.com/orderers/orderer.ndep.com/msp/tlscacerts/tlsca.ndep.com-cert.pem --channelID $CHANNEL_NAME --name $CHAINCODE_NAME --version $CHAINCODE_VERSION --sequence $CHAINCODE_SEQUENCE --peerAddresses localhost:7051 --tlsRootCertFiles $PWD/crypto-config/peerOrganizations/police.ndep.com/peers/peer0.police.ndep.com/tls/ca.crt --peerAddresses localhost:9051 --tlsRootCertFiles $PWD/crypto-config/peerOrganizations/forensic.ndep.com/peers/peer0.forensic.ndep.com/tls/ca.crt --peerAddresses localhost:10051 --tlsRootCertFiles $PWD/crypto-config/peerOrganizations/court.ndep.com/peers/peer0.court.ndep.com/tls/ca.crt

# Query committed chaincode
echo "📋 Querying committed chaincode..."
peer lifecycle chaincode querycommitted --channelID $CHANNEL_NAME --name $CHAINCODE_NAME

# Test chaincode
echo "🧪 Testing chaincode..."
peer chaincode invoke -o localhost:7050 --ordererTLSHostnameOverride orderer.ndep.com --tls --cafile $PWD/crypto-config/ordererOrganizations/ndep.com/orderers/orderer.ndep.com/msp/tlscacerts/tlsca.ndep.com-cert.pem -C $CHANNEL_NAME -n $CHAINCODE_NAME --peerAddresses localhost:7051 --tlsRootCertFiles $PWD/crypto-config/peerOrganizations/police.ndep.com/peers/peer0.police.ndep.com/tls/ca.crt --peerAddresses localhost:9051 --tlsRootCertFiles $PWD/crypto-config/peerOrganizations/forensic.ndep.com/peers/peer0.forensic.ndep.com/tls/ca.crt -c '{"function":"InitLedger","Args":[]}'

echo "✅ Chaincode deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "   - Chaincode Name: $CHAINCODE_NAME"
echo "   - Version: $CHAINCODE_VERSION"
echo "   - Channel: $CHANNEL_NAME"
echo "   - Package ID: $PACKAGE_ID"
echo "   - Organizations: Police, Forensic, Court"
echo ""
echo "🎯 Next steps:"
echo "   1. Test chaincode functions using peer commands"
echo "   2. Integrate with NDEP backend API"
echo "   3. Update frontend to use blockchain data"
