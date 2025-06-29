# Notepad Application

A modern notepad application with AI-powered features, voice transcription, and responsive design for both desktop and mobile devices.

## 🌟 Features

- **📝 Rich Text Editor**: Create and edit notes with AI-generated titles and summaries
- **🎤 Voice Transcription**: Record audio and convert to text using OpenAI Whisper
- **🤖 AI Integration**: Automatic title and summary generation using local AI models
- **📱 Responsive Design**: Works seamlessly on both desktop and mobile devices
- **🔒 HTTPS Support**: Secure local development with trusted certificates
- **🌐 Local Network Access**: Access from any device on your local network
- **Smart Note Creation**: AI automatically generates titles, summaries, and tags from your content
- **Tag Management**: Organize notes with tags - either manually or automatically generated
- **Content-Based Tagging**: Add tags directly in your note content using patterns like "tag: journal. This is my note"
- **Tag Filtering**: Filter notes by one or more tags to quickly find what you need
- **Real-time Updates**: Changes are saved automatically and reflected immediately

## 🏗️ Architecture

- **Frontend**: React + TypeScript + Vite + Material-UI
- **Backend**: FastAPI + Python + Poetry
- **Transcription Service**: FastAPI + OpenAI Whisper
- **AI Models**: Hugging Face Transformers (Mistral-7B or DialoGPT)
- **Storage**: YAML files for simple, portable data storage

## 🚀 Quick Start

### Prerequisites

- **Python 3.10+** with Poetry
- **Node.js 16+** with npm
- **mkcert** for HTTPS certificates (see setup below)

### 1. Install mkcert (Required for HTTPS)

**Windows (Recommended):**
```powershell
winget install FiloSottile.mkcert
```

**Alternative methods:**
- Download from [mkcert releases](https://github.com/FiloSottile/mkcert/releases)
- Install via Chocolatey: `choco install mkcert`

### 2. Generate SSL Certificates

```powershell
# Install the local CA
mkcert -install

# Generate certificates for localhost and local network
mkcert localhost 127.0.0.1 ::1
```

### 3. Install Dependencies

```bash
# Backend dependencies
cd backend
poetry install

# Transcription service dependencies
cd ../transcription-service
poetry install

# Frontend dependencies
cd ../frontend
npm install
```

### 4. Start All Services

```bash
# From the project root
start-services-https.bat
```

This will start:
- **Frontend**: https://localhost:3000
- **Backend**: https://localhost:8000
- **Transcription Service**: https://localhost:8001

## 📱 Mobile Access

### Local Network Access

1. **Find your computer's IP address**:
   ```powershell
   ipconfig | findstr "IPv4"
   ```

2. **Access from mobile device**:
   ```
   https://YOUR_COMPUTER_IP:3000
   ```

3. **Handle certificate warnings**:
   - Tap "Advanced" → "Proceed to [your-ip] (unsafe)"
   - This is normal for local network HTTPS

### Microphone Access on Mobile

The app supports voice recording on mobile devices:
- **Tap the microphone button** 🎤 next to the text area
- **Allow microphone access** when prompted
- **Speak your note** and tap stop
- **Text will be inserted** at the cursor position

## 🔧 HTTPS Certificate Management

### Why HTTPS?

- **Mobile microphone access** requires HTTPS
- **Secure local development** environment
- **No mixed content warnings**
- **Professional development setup**

### Certificate Files

The application uses mkcert-generated certificates:
- `localhost+2.pem` - Certificate file
- `localhost+2-key.pem` - Private key file

These are automatically copied to:
- `backend/localhost.pem` & `backend/localhost-key.pem`
- `transcription-service/localhost.pem` & `transcription-service/localhost-key.pem`
- Referenced by frontend from project root

### Certificate Renewal

Certificates are valid for 1 year. To renew:
```powershell
# Remove old certificates
del localhost+2.pem
del localhost+2-key.pem

# Generate new ones
mkcert localhost 127.0.0.1 ::1

# Copy to service directories
copy "localhost+2.pem" "backend\localhost.pem"
copy "localhost+2-key.pem" "backend\localhost-key.pem"
copy "localhost+2.pem" "transcription-service\localhost.pem"
copy "localhost+2-key.pem" "transcription-service\localhost-key.pem"
```

## 🤖 AI Features

### Model Requirements

- **Mistral-7B**: Requires 8GB+ VRAM (recommended)
- **DialoGPT-medium**: Works with 4GB+ VRAM or CPU
- **Fallback mode**: Simple text processing if no AI model available

### Configuration

Create a `.env` file in the `backend` directory:
```env
HUGGING_FACE_HUB_TOKEN=your_token_here
```

Get your token from [Hugging Face](https://huggingface.co/settings/tokens).

### Model Selection

The backend automatically selects the best model based on your hardware:
- **High-end GPU** (8GB+ VRAM): Mistral-7B-Instruct-v0.2
- **Low-end GPU/CPU**: DialoGPT-medium
- **No token**: Fallback mode with simple text processing

## 📁 Project Structure

```
Notepad/
├── frontend/                 # React frontend
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── api.ts          # API client
│   │   └── types.ts        # TypeScript types
│   └── vite.config.ts      # Vite configuration
├── backend/                 # Main FastAPI backend
│   ├── main.py             # API endpoints
│   ├── models.py           # Data models
│   ├── storage.py          # YAML storage
│   └── notes/              # Note storage directory
├── transcription-service/   # Voice transcription service
│   └── main.py             # Whisper integration
├── start-services-https.bat # Main startup script
├── start-services-mixed.bat # Alternative startup (frontend HTTPS only)
└── README.md               # This file
```

## 🔧 Development

### Available Scripts

- **`start-services-https.bat`**: Full HTTPS setup (recommended)
- **`start-services-mixed.bat`**: Frontend HTTPS, backend HTTP (for testing)

### Manual Service Start

```bash
# Backend
cd backend
poetry run python main.py

# Transcription Service
cd transcription-service
poetry run python main.py

# Frontend
cd frontend
npm run dev
```

### API Documentation

- **Backend API**: https://localhost:8000/docs
- **Transcription API**: https://localhost:8001/docs

## 🐛 Troubleshooting

### Certificate Issues

**"SSL version or cipher mismatch"**:
- Ensure mkcert is installed: `mkcert --version`
- Regenerate certificates: `mkcert localhost 127.0.0.1 ::1`
- Copy certificates to service directories

**"Certificate not trusted" on mobile**:
- This is normal for local network HTTPS
- Tap "Advanced" → "Proceed to [your-ip] (unsafe)"

### Microphone Issues

**"Microphone access denied"**:
- Ensure you're using HTTPS
- Check browser permissions
- Try refreshing the page

**"No audio detected"**:
- Check device microphone settings
- Ensure microphone isn't used by other apps
- Try a different browser

### AI Model Issues

**"Model loading failed"**:
- Check your Hugging Face token
- Ensure sufficient RAM/VRAM
- Try the fallback mode (no token)

### Network Issues

**"Cannot connect to backend"**:
- Ensure all services are running
- Check firewall settings
- Verify IP address is correct

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📞 Support

For issues and questions:
- Check the troubleshooting section above
- Review the API documentation
- Open an issue on GitHub 

## Tag Features

The application supports multiple ways to add tags to your notes:

### 1. Manual Tag Input
Enter tags in the dedicated tags field, separated by commas:
- `meeting, project, important`
- `category: work, tag: urgent`

### 2. Content-Based Tagging
Add tags directly at the beginning of your note content:
- `tag: journal. This was a very hard day again`
- `category: work, tag: meeting. Notes from today's team meeting...`
- `tags: personal, diary. Today I felt...`

The system will automatically:
- Extract the tags from the beginning of your content
- Remove the tag prefix from the saved note content
- Use the extracted tags for organization

### 3. AI-Generated Tags
If no tags are provided manually or in content, the AI will automatically generate relevant tags based on your note content.

### 4. Tag Filtering
Filter your notes by selecting one or more tags:
- **Desktop**: Click on tag chips to select/deselect them
- **Mobile**: Use the dropdown to select multiple tags
- **Clear filters**: Click "Clear all" to show all notes again
- **Combined filtering**: Notes matching any of the selected tags will be shown 