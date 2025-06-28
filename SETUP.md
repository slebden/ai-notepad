# Quick Setup Guide

This guide will get your notepad application running in minutes.

## 🚀 One-Minute Setup

### 1. Install mkcert (HTTPS certificates)
```powershell
winget install FiloSottile.mkcert
```

### 2. Generate certificates
```powershell
mkcert -install
mkcert localhost 127.0.0.1 ::1
```

### 3. Install dependencies
```bash
# Backend
cd backend && poetry install && cd ..

# Transcription service  
cd transcription-service && poetry install && cd ..

# Frontend
cd frontend && npm install && cd ..
```

### 4. Start everything
```bash
start-services-https.bat
```

### 5. Access your app
- **Desktop**: https://localhost:3000
- **Mobile**: https://YOUR_COMPUTER_IP:3000

## 📱 Mobile Setup

1. **Find your computer's IP**:
   ```powershell
   ipconfig | findstr "IPv4"
   ```

2. **On your mobile device**:
   - Open Chrome/Safari
   - Go to `https://YOUR_IP:3000`
   - Accept the certificate warning
   - Tap the microphone button to test

## 🎤 Test Voice Recording

1. **Create a new note**
2. **Tap the microphone button** 🎤
3. **Allow microphone access**
4. **Speak your note**
5. **Tap stop** - your speech will be transcribed!

## 🔧 Troubleshooting

### "Certificate not trusted" on mobile
- This is normal for local network HTTPS
- Tap "Advanced" → "Proceed to [your-ip] (unsafe)"

### "Microphone access denied"
- Ensure you're using HTTPS (not HTTP)
- Check browser permissions
- Try refreshing the page

### "Cannot connect to backend"
- Ensure all services are running
- Check that certificates are in the right places
- Verify your IP address is correct

## 📚 Next Steps

- Read the full [README.md](README.md) for detailed documentation
- Check out the API docs at https://localhost:8000/docs
- Explore the voice transcription features
- Try the AI-powered title generation

## 🆘 Need Help?

- Check the troubleshooting section in the main README
- Review the API documentation
- Open an issue on GitHub 