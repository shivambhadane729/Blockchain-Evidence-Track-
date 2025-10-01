# 🔑 Web3.Storage Token Setup Guide

## 📍 **Current Status: You're on Web3.Storage Dashboard!**

I can see you're already on the Web3.Storage dashboard. Here's how to get your API token:

## 🎯 **Step-by-Step Token Setup:**

### **Step 1: Create API Token**
1. **Look for "Settings" or "API Keys" section** in the left sidebar
2. **Click on "API Keys" or "Create Token"**
3. **Give your token a name**: `NDEP-Evidence-Portal`
4. **Set permissions**: Full access (for development)
5. **Click "Create Token"**

### **Step 2: Copy the Token**
- The token will look like: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
- **Copy the entire token** (it's long, make sure you get it all)

### **Step 3: Update Your Configuration**
```bash
# Open backend/config.env in your editor
# Find this line:
WEB3_STORAGE_TOKEN=your_web3_storage_token_here

# Replace with your actual token:
WEB3_STORAGE_TOKEN=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## 🔍 **If You Can't Find API Keys Section:**

### **Alternative Method:**
1. **Look for "Account" or "Profile" settings**
2. **Navigate to "API Keys" or "Developer Settings"**
3. **Create a new API key/token**

### **Or Check These Locations:**
- Top navigation bar → Settings
- Left sidebar → API Keys
- User menu (top right) → API Settings
- Dashboard → Developer Tools

## ✅ **After Getting Token:**

### **1. Update Configuration:**
```bash
# Edit backend/config.env
WEB3_STORAGE_TOKEN=your_actual_token_here
```

### **2. Test the Setup:**
```bash
# Run readiness test
cd backend
node test-readiness.js

# Should show 100% success rate!
```

### **3. Start Testing:**
```bash
# Start backend
npm run dev

# Run IPFS tests
cd ../fabric-network
node IPFS_TEST_SUITE.js
```

## 🚨 **Important Notes:**

### **Token Security:**
- ⚠️ **Never share your token publicly**
- ⚠️ **Don't commit it to version control**
- ⚠️ **Keep it in config.env only**

### **Token Format:**
- Should start with `eyJ`
- Very long string (100+ characters)
- Contains dots (.) separating sections

## 🎉 **Once You Have the Token:**

You'll be **100% ready for testing**! The system will be able to:
- ✅ Upload files to IPFS
- ✅ Store metadata on blockchain
- ✅ Verify file integrity
- ✅ Track custody chains
- ✅ Provide decentralized storage

## 📞 **Need Help?**

If you can't find the API keys section:
1. **Look for "Settings" in the navigation**
2. **Check the user menu (top right corner)**
3. **Look for "Developer" or "API" sections**
4. **Try refreshing the page**

---

**🎯 You're almost there! Just need that API token and you can start testing your IPFS-integrated NDEP system!**
