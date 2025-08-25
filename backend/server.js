import express from 'express'
import cors from 'cors'
import multer from 'multer'
import { processYouTubeVideo } from './workflows/videoProcessor.js'
import { validateSettings } from './utils/validation.js'
import { progressService } from './services/progressService.js'
import { GeminiService } from './services/geminiService.js'
import { apiKeyManager } from './services/apiKeyManager.js'
import { proxyManager } from './services/proxyManager.js'

const app = express()
const port = 3004

// Store active connections for progress updates
const activeConnections = new Map()

// Middleware
app.use(cors())
app.use(express.json())

// File upload configuration
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname)
  }
})
const upload = multer({ storage })

// Progress tracking endpoint
app.get('/api/progress/:clientId', (req, res) => {
  const { clientId } = req.params
  
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'Access-Control-Allow-Origin': '*'
  })
  
  // Store connection
  activeConnections.set(clientId, res)
  
  // Send initial connection message
  res.write(`data: ${JSON.stringify({ type: 'connected', clientId })}\n\n`)
  
  // Handle client disconnect
  req.on('close', () => {
    activeConnections.delete(clientId)
  })
})

// Send progress update to specific client
const sendProgressUpdate = (clientId, progress) => {
  const connection = activeConnections.get(clientId)
  if (connection) {
    connection.write(`data: ${JSON.stringify({ type: 'progress', ...progress })}\n\n`)
  }
}

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

app.post('/api/process', async (req, res) => {
  try {
    const { input, settings, onProgress, clientId } = req.body
    
            // Update ApiKeyManager with user's API keys
    // Check if backend has API keys
    const backendStats = apiKeyManager.getStats()
    if (backendStats.totalKeys === 0) {
            return res.status(400).json({
        success: false,
        error: 'Vui lòng thêm ít nhất 1 API key trong API Key Manager (🔑)'
      })
    }
        // Validate settings (excluding apiKeys since backend manages them)
    const settingsWithoutApiKeys = { ...settings }
    delete settingsWithoutApiKeys.apiKeys // Remove apiKeys from validation
    
    const validation = validateSettings(settingsWithoutApiKeys)
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join(', ')
      })
    }

    let result
    let title = 'Video đã xử lý'
    
    // Create unique client ID for progress tracking
    const uniqueClientId = clientId || `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Setup progress callback if requested
    let progressCallback = null
    if (onProgress) {
      progressCallback = (progress) => {
                sendProgressUpdate(uniqueClientId, progress)
      }
    }

    if (input.type === 'url') {
      // Process YouTube URL with progress tracking
      result = await processYouTubeVideo(input.value, settings, progressCallback)
      
      // Extract title from URL if possible
      try {
        const urlMatch = input.value.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
        if (urlMatch) {
          title = `Video ${urlMatch[1].substring(0, 8)}...`
        }
      } catch (e) {
              }
      
    } else if (input.type === 'file') {
      // Process uploaded file
      result = await processVideoFile(input.value, settings, progressCallback)
      title = input.value.originalname || 'Uploaded Video'
    } else {
      throw new Error('Invalid input type')
    }

    // Send final completion
    if (onProgress) {
      sendProgressUpdate(uniqueClientId, {
        currentStep: 5,
        estimatedTime: 'Hoàn thành!',
        finalResult: result
      })
    }

    // Check if result is transcript-only (from error handling)
    const isTranscriptOnly = typeof result === 'string' && result.includes('--- Segment Break ---')
    
    res.json({
      success: true,
      result,
      title: isTranscriptOnly ? '📝 Transcript hoàn chỉnh' : title,
      timestamp: new Date().toISOString(),
      clientId: uniqueClientId,
      isTranscriptOnly: isTranscriptOnly
    })

  } catch (error) {
    console.error('Processing error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Đã có lỗi xảy ra trong quá trình xử lý'
    })
  }
})

app.post('/api/upload', upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'Không có file được upload'
      })
    }

    // Validate file type
    const allowedTypes = ['video/mp4', 'video/mov', 'video/avi', 'video/mkv', 'video/webm']
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        error: 'File format không được hỗ trợ. Vui lòng sử dụng file video MP4, MOV, AVI, MKV, hoặc WEBM.'
      })
    }

    // Validate file size (max 100MB)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        error: 'File quá lớn. Kích thước tối đa là 100MB.'
      })
    }

    console.log('📁 File uploaded:', {
      filename: req.file.filename,
      originalname: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype
    })

    res.json({
      success: true,
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        path: req.file.path,
        mimetype: req.file.mimetype
      }
    })
  } catch (error) {
    console.error('Upload error:', error)
    res.status(500).json({
      success: false,
      error: 'Lỗi upload file'
    })
  }
})

// Chat with AI endpoint
app.post('/api/generate-script-only', async (req, res) => {
  try {
    const { transcript, settings, clientId } = req.body
    
    if (!transcript || !settings) {
      return res.status(400).json({
        success: false,
        error: 'Missing transcript or settings'
      })
    }

    // Check if backend has API keys
    const backendStats = apiKeyManager.getStats()
    if (backendStats.totalKeys === 0) {
      return res.status(400).json({
        success: false,
        error: 'Vui lòng thêm ít nhất 1 API key trong API Key Manager (🔑)'
      })
    }

    console.log('🎭 Generating script from transcript only')
    
    const scriptGenerator = new ScriptGeneratorService()
    const finalScript = await scriptGenerator.generateScriptWithFallback(transcript, settings)
    
    res.json({
      success: true,
      result: finalScript,
      title: '🎭 Script hoàn chỉnh (từ transcript)',
      timestamp: new Date().toISOString(),
      clientId: clientId
    })

  } catch (error) {
    console.error('Script generation error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Đã có lỗi xảy ra khi tạo script'
    })
  }
})

app.post('/api/chat', async (req, res) => {
  try {
    const { message, originalResult, chatHistory } = req.body
    
    if (!message || !originalResult) {
      return res.status(400).json({
        success: false,
        error: 'Missing message or originalResult'
      })
    }

    const geminiService = new GeminiService()
    
    // Create context-aware prompt
    const systemPrompt = `Bạn là trợ lý AI chuyên chỉnh sửa bình luận YouTube. Nhiệm vụ của bạn là:

1. Hiểu yêu cầu chỉnh sửa từ người dùng
2. Chỉnh sửa bình luận gốc theo yêu cầu
3. Trả về bình luận đã chỉnh sửa
4. Giải thích ngắn gọn những thay đổi đã thực hiện

Bình luận gốc:
${originalResult}

Lịch sử chat:
${chatHistory.map(msg => `${msg.role === 'user' ? 'Người dùng' : 'AI'}: ${msg.content}`).join('\n')}

Yêu cầu mới: ${message}

Hãy trả về theo format JSON:
{
  "response": "Giải thích ngắn gọn về những thay đổi",
  "updatedResult": "Bình luận đã chỉnh sửa"
}`

    const response = await geminiService.generateText(systemPrompt, 'gemini-2.0-flash-exp')
    
    try {
      const parsedResponse = JSON.parse(response)
      
      res.json({
        success: true,
        response: parsedResponse.response || response,
        updatedResult: parsedResponse.updatedResult || originalResult
      })
    } catch (parseError) {
      // If JSON parsing fails, return the raw response
      res.json({
        success: true,
        response: response,
        updatedResult: originalResult
      })
    }
    
  } catch (error) {
    console.error('Chat error:', error)
    res.status(500).json({
      success: false,
      error: error.message || 'Có lỗi xảy ra khi chat với AI'
    })
  }
})

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error)
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  })
})

// Create uploads directory if it doesn't exist
import fs from 'fs'
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads')
}



// API Key Management endpoints
app.get('/api/keys/stats', (req, res) => {
  try {
    const stats = apiKeyManager.getStats()
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/keys/add', (req, res) => {
  try {
    const { apiKey } = req.body
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' })
    }
    
    const keyId = apiKeyManager.addApiKey(apiKey)
    res.json({ 
      success: true, 
      keyId,
      message: 'API key added successfully' 
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/keys/remove', (req, res) => {
  try {
    const { apiKey, keyId } = req.body
    if (!apiKey && !keyId) {
      return res.status(400).json({ error: 'API key or key ID is required' })
    }
    
    let removed = false
    if (keyId) {
      // Remove by key ID
      const keyObj = apiKeyManager.apiKeys.find(k => k.id === keyId)
      if (keyObj) {
        removed = apiKeyManager.removeApiKey(keyObj.key)
      }
    } else {
      // Remove by API key
      removed = apiKeyManager.removeApiKey(apiKey)
    }
    
    if (removed) {
      res.json({ 
        success: true, 
        message: 'API key removed successfully' 
      })
    } else {
      res.status(404).json({ error: 'API key not found' })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/keys/reset', (req, res) => {
  try {
    apiKeyManager.resetCooldowns()
    res.json({ 
      success: true, 
      message: 'All API key cooldowns reset' 
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// Proxy Management endpoints
app.get('/api/proxies/stats', (req, res) => {
  try {
    const stats = proxyManager.getStats()
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/proxies/add', (req, res) => {
  try {
    const { url, type, username, password, country, speed } = req.body
    if (!url) {
      return res.status(400).json({ error: 'Proxy URL is required' })
    }
    
    const proxyId = proxyManager.addProxy({
      url,
      type,
      username,
      password,
      country,
      speed
    })
    
    res.json({ 
      success: true, 
      proxyId,
      message: 'Proxy added successfully' 
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/proxies/remove', (req, res) => {
  try {
    const { proxyId } = req.body
    if (!proxyId) {
      return res.status(400).json({ error: 'Proxy ID is required' })
    }
    
    const removed = proxyManager.removeProxy(proxyId)
    if (removed) {
      res.json({ 
        success: true, 
        message: 'Proxy removed successfully' 
      })
    } else {
      res.status(404).json({ error: 'Proxy not found' })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/proxies/reset', (req, res) => {
  try {
    proxyManager.resetCooldowns()
    res.json({ 
      success: true, 
      message: 'All proxy cooldowns reset' 
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/proxies/test', async (req, res) => {
  try {
    const { proxyId } = req.body
    if (!proxyId) {
      return res.status(400).json({ error: 'Proxy ID is required' })
    }
    
    const proxy = proxyManager.proxies.find(p => p.id === proxyId)
    if (!proxy) {
      return res.status(404).json({ error: 'Proxy not found' })
    }
    
    const result = await proxyManager.testProxy(proxy)
    res.json(result)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/proxies/test-all', async (req, res) => {
  try {
    const results = await proxyManager.testAllProxies()
    res.json({ 
      success: true, 
      results 
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

// API Key Management Endpoints
app.get('/api/keys/stats', (req, res) => {
  try {
    const stats = apiKeyManager.getStats()
    res.json(stats)
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/keys/add', (req, res) => {
  try {
    const { apiKey } = req.body
    if (!apiKey || !apiKey.trim()) {
      return res.status(400).json({ error: 'API key is required' })
    }
    
    if (!apiKey.startsWith('AIza')) {
      return res.status(400).json({ error: 'Invalid Gemini API key format' })
    }
    
    const keyId = apiKeyManager.addApiKey(apiKey.trim())
    res.json({ 
      success: true, 
      keyId,
      message: 'API key added successfully' 
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.delete('/api/keys/remove', (req, res) => {
  try {
    const { apiKey } = req.body
    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' })
    }
    
    const removed = apiKeyManager.removeApiKey(apiKey)
    if (removed) {
      res.json({ 
        success: true, 
        message: 'API key removed successfully' 
      })
    } else {
      res.status(404).json({ error: 'API key not found' })
    }
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.post('/api/keys/reset', (req, res) => {
  try {
    apiKeyManager.resetCooldowns()
    res.json({ 
      success: true, 
      message: 'All API key cooldowns reset' 
    })
  } catch (error) {
    res.status(500).json({ error: error.message })
  }
})

app.listen(port, () => {
            // Show initial API key stats
    const stats = apiKeyManager.getStats()
        // Show initial proxy stats
    const proxyStats = proxyManager.getStats()
      })
