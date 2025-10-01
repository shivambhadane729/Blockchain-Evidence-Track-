#!/bin/bash

# Generate cryptographic material for NDEP Fabric Network
# This script creates all necessary certificates and keys

set -e

echo "🔐 Generating cryptographic material for NDEP Fabric Network..."

# Check if cryptogen is available
if ! command -v cryptogen &> /dev/null; then
    echo "❌ cryptogen not found. Please run install-prerequisites.sh first."
    exit 1
fi

# Create cryptogen configuration
echo "📝 Creating cryptogen configuration..."
cat > crypto-config.yaml << 'EOF'
OrdererOrgs:
  - Name: Orderer
    Domain: ndep.com
    Specs:
      - Hostname: orderer

PeerOrgs:
  - Name: Police
    Domain: police.ndep.com
    EnableNodeOUs: true
    Template:
      Count: 2
    Users:
      Count: 1

  - Name: Forensic
    Domain: forensic.ndep.com
    EnableNodeOUs: true
    Template:
      Count: 1
    Users:
      Count: 1

  - Name: Court
    Domain: court.ndep.com
    EnableNodeOUs: true
    Template:
      Count: 1
    Users:
      Count: 1
EOF

# Generate certificates
echo "🔑 Generating certificates and keys..."
cryptogen generate --config=crypto-config.yaml --output="crypto-config"

# Verify generated certificates
echo "✅ Verifying generated certificates..."
if [ -d "crypto-config" ]; then
    echo "📁 Certificate structure:"
    find crypto-config -type f -name "*.pem" | head -10
    echo ""
    echo "📊 Certificate summary:"
    echo "   Orderer certificates: $(find crypto-config/ordererOrganizations -name "*.pem" | wc -l)"
    echo "   Police certificates: $(find crypto-config/peerOrganizations/police.ndep.com -name "*.pem" | wc -l)"
    echo "   Forensic certificates: $(find crypto-config/peerOrganizations/forensic.ndep.com -name "*.pem" | wc -l)"
    echo "   Court certificates: $(find crypto-config/peerOrganizations/court.ndep.com -name "*.pem" | wc -l)"
else
    echo "❌ Failed to generate certificates"
    exit 1
fi

# Create MSP configuration
echo "🏗️  Setting up MSP configuration..."
for org in police forensic court; do
    org_domain="${org}.ndep.com"
    msp_dir="crypto-config/peerOrganizations/${org_domain}/msp"
    
    # Create config.yaml for NodeOUs
    cat > "${msp_dir}/config.yaml" << EOF
NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/ca.${org_domain}-cert.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/ca.${org_domain}-cert.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/ca.${org_domain}-cert.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/ca.${org_domain}-cert.pem
    OrganizationalUnitIdentifier: orderer
EOF
done

# Create orderer MSP config
orderer_msp_dir="crypto-config/ordererOrganizations/ndep.com/msp"
cat > "${orderer_msp_dir}/config.yaml" << EOF
NodeOUs:
  Enable: true
  ClientOUIdentifier:
    Certificate: cacerts/ca.ndep.com-cert.pem
    OrganizationalUnitIdentifier: client
  PeerOUIdentifier:
    Certificate: cacerts/ca.ndep.com-cert.pem
    OrganizationalUnitIdentifier: peer
  AdminOUIdentifier:
    Certificate: cacerts/ca.ndep.com-cert.pem
    OrganizationalUnitIdentifier: admin
  OrdererOUIdentifier:
    Certificate: cacerts/ca.ndep.com-cert.pem
    OrganizationalUnitIdentifier: orderer
EOF

echo "✅ Cryptographic material generation completed!"
echo ""
echo "📋 Generated components:"
echo "   - Orderer organization certificates"
echo "   - Police organization certificates (2 peers)"
echo "   - Forensic organization certificates (1 peer)"
echo "   - Court organization certificates (1 peer)"
echo "   - MSP configurations for all organizations"
echo ""
echo "🎯 Next step: Run ./scripts/create-genesis.sh"
