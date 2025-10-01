# 🎯 Pinata IPFS Setup Guide for NDEP

## 🚀 **Why Pinata?**

- ✅ **Free Tier**: 1GB storage + 1GB bandwidth/month
- ✅ **Reliable**: Enterprise-grade IPFS service
- ✅ **Easy API**: Simple REST API with great documentation
- ✅ **Fast**: Global CDN with multiple gateways
- ✅ **Secure**: API key authentication

## 🔑 **Step 1: Get Pinata API Keys**

### **1. Sign Up for Pinata**
1. Visit [Pinata.cloud](https://pinata.cloud/)
2. Click "Sign Up" (it's free!)
3. Verify your email

### **2. Get API Keys**
1. **Login to Pinata Dashboard**
2. **Go to "API Keys"** in the left sidebar
3. **Click "New Key"**
4. **Configure the key:**
   - **Name**: `NDEP-Evidence-Portal`
   - **Permissions**: Select all permissions (for development)
   - **Rate Limits**: Leave default
5. **Click "Create Key"**
6. **Copy both keys:**
   - **API Key** (starts with something like `a1b2c3d4...`)
   - **Secret Key** (starts with something like `e5f6g7h8...`)

## ⚙️ **Step 2: Update Configuration**

### **Update backend/config.env:**
```env
# IPFS Configuration (Pinata)
PINATA_API_KEY=your_actual_api_key_here
PINATA_SECRET_KEY=your_actual_secret_key_here
PINATA_GATEWAY=https://gateway.pinata.cloud
```

## 🧪 **Step 3: Test the Setup**

### **Install Dependencies:**
```bash
cd backend
npm install
```

### **Run Readiness Test:**
```bash
node test-readiness.js
```

### **Expected Output:**
```
✅ Pinata API keys are configured
✅ IPFS service initialized successfully with Pinata
🎯 Success Rate: 100%
```

## 🎉 **Step 4: Start Testing!**

### **Run IPFS Test Suite:**
```bash
cd ../fabric-network
node IPFS_TEST_SUITE.js
```

### **Start Backend:**
```bash
cd backend
npm run dev
```

## 📊 **Pinata Dashboard Features**

Once you're set up, you can:
- **View uploaded files** in the Pinata dashboard
- **Monitor usage** (storage and bandwidth)
- **Manage pins** (files stored on IPFS)
- **View metadata** for each file
- **Access files** via multiple gateways

## 🔗 **File Access URLs**

Your uploaded files will be accessible via:
- **Pinata Gateway**: `https://gateway.pinata.cloud/ipfs/{hash}`
- **IPFS Gateway**: `https://ipfs.io/ipfs/{hash}`
- **Cloudflare Gateway**: `https://cloudflare-ipfs.com/ipfs/{hash}`

## 🚨 **Important Notes**

### **Security:**
- ⚠️ **Never share your API keys publicly**
- ⚠️ **Don't commit keys to version control**
- ⚠️ **Keep them in config.env only**

### **Free Tier Limits:**
- **Storage**: 1GB total
- **Bandwidth**: 1GB/month
- **Files**: Unlimited (within storage limit)
- **API Calls**: 1000/day

### **Upgrading:**
- If you need more storage/bandwidth, Pinata has affordable paid plans
- Free tier is perfect for development and testing

## 🎯 **Next Steps After Setup**

1. **✅ Get Pinata API keys** (5 minutes)
2. **✅ Update config.env** (1 minute)
3. **✅ Run readiness test** (30 seconds)
4. **✅ Start testing your IPFS integration!** 🚀

---

**🎉 You're now ready to use Pinata for decentralized file storage in your NDEP system!**
