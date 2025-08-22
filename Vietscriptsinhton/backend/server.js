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
const port = 3001

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

// Routes
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() })
})

app.post('/api/process', async (req, res) => {
  try {
    const { input, settings, onProgress } = req.body
    
    // Validate settings
    const validation = validateSettings(settings)
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        error: validation.errors.join(', ')
      })
    }

    let result
    let title = 'Video đã xử lý'
    
    // Create unique client ID for progress tracking
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    // Setup progress callback if requested
    let progressCallback = null
    if (onProgress) {
      progressCallback = (progress) => {
        console.log(`📊 Progress update:`, progress)
        // Since we're not using WebSocket, we'll store progress in memory
        // In a real app, you'd use WebSocket or Server-Sent Events
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
        console.log('Could not extract video ID:', e.message)
      }
      
    } else if (input.type === 'file') {
      // Process uploaded file
      result = await processVideoFile(input.value, settings, progressCallback)
      title = input.value.name || 'Uploaded Video'
    } else {
      throw new Error('Invalid input type')
    }

    res.json({
      success: true,
      result,
      title,
      timestamp: new Date().toISOString()
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

    res.json({
      success: true,
      file: {
        filename: req.file.filename,
        originalname: req.file.originalname,
        size: req.file.size,
        path: req.file.path
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

// Test endpoint for Gemini duration API call
app.post('/api/test-duration', async (req, res) => {
  try {
    const { youtubeUrl, prompt } = req.body
    
    if (!youtubeUrl || !prompt) {
      return res.status(400).json({ error: 'Missing youtubeUrl or prompt' })
    }
    
    const apiKey = 'AIzaSyClZFBCA_uXJLwBYG0rV3j0-flFEH6SyOU'
    const geminiService = new GeminiService(apiKey)
    
    console.log('🧪 Testing Gemini duration API...')
    console.log('🔗 URL:', youtubeUrl)
    console.log('💬 Prompt:', prompt)
    
    const duration = await geminiService.analyzeVideo(youtubeUrl, prompt, 'gemini-1.5-flash')
    
    res.json({ 
      duration,
      prompt,
      model: 'gemini-1.5-flash',
      timestamp: new Date().toISOString()
    })
    
  } catch (error) {
    console.error('❌ Gemini test failed:', error)
    res.status(500).json({ 
      error: error.message,
      code: error.code || 'unknown_error'
    })
  }
})

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

app.listen(port, () => {
  console.log(`🚀 Server running on http://localhost:${port}`)
  console.log(`📡 API endpoint: http://localhost:${port}/api/process`)
  console.log(`🎯 Health check: http://localhost:${port}/health`)
  console.log(`🧪 Test Gemini duration: POST http://localhost:${port}/api/test-duration`)
  console.log(`🔑 API Key management: GET http://localhost:${port}/api/keys/stats`)
  console.log(`🌐 Proxy management: GET http://localhost:${port}/api/proxies/stats`)
  
  // Show initial API key stats
  console.log('\n📊 Initial API Key Status:')
  const stats = apiKeyManager.getStats()
  console.log(`   Total Keys: ${stats.totalKeys}`)
  console.log(`   Active Keys: ${stats.activeKeys}`)
  console.log(`   Available Keys: ${stats.availableKeys}`)
  
  // Show initial proxy stats
  console.log('\n🌐 Initial Proxy Status:')
  const proxyStats = proxyManager.getStats()
  console.log(`   Total Proxies: ${proxyStats.totalProxies}`)
  console.log(`   Active Proxies: ${proxyStats.activeProxies}`)
  console.log(`   Available Proxies: ${proxyStats.availableProxies}`)
})
