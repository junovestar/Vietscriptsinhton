/**
 * Gemini API Service - mirrors the HTTP requests from n8n workflow
 */
import { defaultRetryService } from './retryService.js'
import { apiKeyManager } from './apiKeyManager.js'
import { proxyManager } from './proxyManager.js'

export class GeminiService {
  constructor() {
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
    this.retryService = defaultRetryService
    this.keyManager = apiKeyManager
    this.proxyManager = proxyManager
  }

  /**
   * Get API key with load balancing
   */
  getCurrentApiKey() {
    return this.keyManager.getNextApiKey() // Always use managed keys
  }

  /**
   * Get proxy agent for requests
   */
  getProxyAgent() {
    const proxy = this.proxyManager.getNextProxy()
    if (!proxy) return null
    
    return this.proxyManager.createProxyAgent(proxy)
  }

  /**
   * Analyze video using Gemini API - equivalent to "HTTP Request to Google" node
   */
  async analyzeVideo(youtubeUrl, prompt, model = 'gemini-1.5-flash', progressCallback = null) {
    const context = { operation: 'analyze_video', model, url: youtubeUrl }
    
    return await this.retryService.executeWithRetry(async () => {
      const currentApiKey = this.getCurrentApiKey()
      const url = `${this.baseUrl}/models/${model}:generateContent?key=${currentApiKey}`
      
      const requestBody = {
        contents: [{
          parts: [
            { text: prompt },
            { file_data: { file_uri: youtubeUrl } }
          ]
        }]
      }

      console.log('📡 Calling Gemini API for video analysis...')
      
      try {
        const agent = this.getProxyAgent()
        const fetchOptions = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody),
          signal: AbortSignal.timeout(120000) // 2 minutes timeout for video analysis
        }

        // Add proxy agent if available
        if (agent) {
          fetchOptions.agent = agent
        }

        const response = await fetch(url, fetchOptions)

        if (!response.ok) {
          let errorText
          try {
            errorText = await response.text()
          } catch (textError) {
            errorText = `Failed to read error response: ${textError.message}`
          }
          
          const error = new Error(`Gemini API error: ${response.status} - ${errorText}`)
          
          // Add specific error codes for better retry detection
          if (response.status === 429) {
            error.code = 'rate_limit_exceeded'
          } else if (response.status === 503) {
            error.code = 'service_unavailable'
          } else if (errorText?.toLowerCase().includes('overload')) {
            error.code = 'model_overloaded'
          } else if (response.status === 400) {
            error.code = 'bad_request'
          } else if (response.status === 401) {
            error.code = 'unauthorized'
          } else if (response.status === 403) {
            error.code = 'forbidden'
          }
          
          // Mark key as failed for load balancer
          this.keyManager.markKeyFailed(currentApiKey, error)
          
          throw error
        }

        let data
        try {
          const responseText = await response.text()
          console.log('📋 Raw response from Gemini:', responseText.substring(0, 500) + '...')
          
          if (!responseText.trim()) {
            throw new Error('Empty response from Gemini API')
          }
          
          data = JSON.parse(responseText)
        } catch (parseError) {
          console.error('❌ JSON parse error:', parseError)
          console.error('📋 Response text:', await response.text())
          throw new Error(`Failed to parse JSON response: ${parseError.message}`)
        }
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
          console.error('❌ Invalid response structure:', JSON.stringify(data, null, 2))
          throw new Error('Invalid response format from Gemini API')
        }

        // Mark key as successful
        this.keyManager.markKeySuccess(currentApiKey)

        return data.candidates[0].content.parts[0].text
        
      } catch (error) {
        console.error('❌ Gemini API video analysis failed:', error)
        
        // Handle specific error types
        if (error.name === 'AbortError') {
          error.message = 'Request timeout - API took too long to respond'
          error.code = 'timeout'
        } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
          error.message = 'Network error - Unable to connect to Gemini API'
          error.code = 'network_error'
        }
        
        // Mark key as failed for load balancer
        this.keyManager.markKeyFailed(currentApiKey, error)
        throw error
      }
      
    }, context, progressCallback)
  }

  /**
   * Analyze video segment - equivalent to "HTTP Request to Google1" node
   */
  async analyzeVideoSegment(youtubeUrl, prompt, model = 'gemini-2.5-flash', progressCallback = null) {
    return this.analyzeVideo(youtubeUrl, prompt, model, progressCallback)
  }

  /**
   * Generate script using Gemini Pro - equivalent to the final LLM chain
   */
  async generateScript(transcript, prompt, model = 'gemini-2.5-pro') {
    const currentApiKey = this.getCurrentApiKey()
    const url = `${this.baseUrl}/models/${model}:generateContent?key=${currentApiKey}`
    
    // Log transcript details for debugging
    console.log('📋 Transcript length for script generation:', transcript.length)
    console.log('📋 Transcript preview (first 300 chars):', transcript.substring(0, 300))
    console.log('📋 Transcript preview (last 300 chars):', transcript.substring(transcript.length - 300))
    
    const requestBody = {
      contents: [{
        parts: [
          { text: `${prompt}\n\nTranscript của clip cần biên kịch:\n${transcript}` }
        ]
      }]
    }

    try {
      console.log('📡 Calling Gemini API for script generation...')
      const agent = this.getProxyAgent()
      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(60000) // 1 minute timeout for script generation
      }

      // Add proxy agent if available
      if (agent) {
        fetchOptions.agent = agent
      }

      const response = await fetch(url, fetchOptions)

      if (!response.ok) {
        const errorText = await response.text()
        const error = new Error(`Gemini API error: ${response.status} - ${errorText}`)
        
        // Mark key as failed for load balancer
        this.keyManager.markKeyFailed(currentApiKey, error)
        
        throw error
      }

      let data
      try {
        const responseText = await response.text()
        console.log('📋 Raw response from Gemini (script):', responseText.substring(0, 500) + '...')
        
        if (!responseText.trim()) {
          throw new Error('Empty response from Gemini API')
        }
        
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ JSON parse error (script):', parseError)
        console.error('📋 Response text:', await response.text())
        throw new Error(`Failed to parse JSON response: ${parseError.message}`)
      }
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
        console.error('❌ Invalid response structure (script):', JSON.stringify(data, null, 2))
        throw new Error('Invalid response format from Gemini API')
      }

      // Mark key as successful
      this.keyManager.markKeySuccess(currentApiKey)

      return data.candidates[0].content.parts[0].text
      
    } catch (error) {
      console.error('❌ Gemini API script generation failed:', error)
      
      // Handle specific error types
      if (error.name === 'AbortError') {
        error.message = 'Request timeout - API took too long to respond'
        error.code = 'timeout'
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        error.message = 'Network error - Unable to connect to Gemini API'
        error.code = 'network_error'
      }
      
      // Mark key as failed for load balancer
      this.keyManager.markKeyFailed(currentApiKey, error)
      
      // For internal server errors, throw a specific error that can be caught by fallback
      if (error.message.includes('500') || error.code === 'internal_server_error') {
        console.warn('🔄 Internal server error detected, throwing specific error for fallback')
        throw new Error(`Internal server error (500): ${error.message}`)
      }
      
      throw new Error(`Failed to generate script: ${error.message}`)
    }
  }

  /**
   * Generate script with fallback models in order of preference
   */
  async generateScriptWithFallback(transcript, prompt) {
    console.log('🔄 Starting generateScriptWithFallback')
    console.log('📋 Transcript length:', transcript.length)
    console.log('📝 Prompt length:', prompt.length)
    
    const models = [
      'gemini-2.5-pro',
      'gemini-2.5-flash',
      'gemini-2.5-flash-live',
      'gemini-2.0-flash'
    ]

    let lastError = null
    let attemptsPerModel = 2 // Try each model with 2 different API keys

    for (const model of models) {
      for (let attempt = 1; attempt <= attemptsPerModel; attempt++) {
        try {
          console.log(`🔄 Trying model: ${model} (attempt ${attempt}/${attemptsPerModel})`)
          const result = await this.generateScript(transcript, prompt, model)
          console.log(`✅ Success with model: ${model}`)
          return result
        } catch (error) {
          console.warn(`❌ Failed with model ${model} (attempt ${attempt}):`, error.message)
          lastError = error
          
          // For 500 errors, try next model immediately
          if (error.message.includes('500') || error.message.includes('Internal server error')) {
            console.log(`🔄 500 error detected, moving to next model immediately`)
            if (model === models[models.length - 1]) {
              throw new Error(`All models failed. Last error: ${error.message}`)
            }
            console.log(`🔄 Moving to next model: ${model} -> ${models[models.indexOf(model) + 1]}`)
            break // Break out of attempts loop for this model
          }
          
          // If it's the last attempt for this model, try next model
          if (attempt === attemptsPerModel) {
            if (model === models[models.length - 1]) {
              throw new Error(`All models failed. Last error: ${error.message}`)
            }
            console.log(`🔄 Moving to next model: ${model} -> ${models[models.indexOf(model) + 1]}`)
          }
          
          // Wait a bit before trying next attempt (but not for 500 errors)
          if (!error.message.includes('500')) {
            await new Promise(resolve => setTimeout(resolve, 2000))
          }
        }
      }
    }
  }

  /**
   * Generate text using Gemini API (text-only, no video)
   */
  async generateText(prompt, model = 'gemini-1.5-flash') {
    const currentApiKey = this.getCurrentApiKey()
    const url = `${this.baseUrl}/models/${model}:generateContent?key=${currentApiKey}`
    
    const requestBody = {
      contents: [{
        parts: [
          { text: prompt }
        ]
      }]
    }

    try {
      console.log('📡 Calling Gemini API for text generation...')
      const agent = this.getProxyAgent()
      const fetchOptions = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody),
        signal: AbortSignal.timeout(60000) // 1 minute timeout for text generation
      }

      // Add proxy agent if available
      if (agent) {
        fetchOptions.agent = agent
      }

      const response = await fetch(url, fetchOptions)

      if (!response.ok) {
        const errorText = await response.text()
        const error = new Error(`Gemini API error: ${response.status} - ${errorText}`)
        
        // Mark key as failed for load balancer
        this.keyManager.markKeyFailed(currentApiKey, error)
        
        throw error
      }

      let data
      try {
        const responseText = await response.text()
        console.log('📋 Raw response from Gemini (text):', responseText.substring(0, 500) + '...')
        
        if (!responseText.trim()) {
          throw new Error('Empty response from Gemini API')
        }
        
        data = JSON.parse(responseText)
      } catch (parseError) {
        console.error('❌ JSON parse error (text):', parseError)
        console.error('📋 Response text:', await response.text())
        throw new Error(`Failed to parse JSON response: ${parseError.message}`)
      }
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
        console.error('❌ Invalid response structure (text):', JSON.stringify(data, null, 2))
        throw new Error('Invalid response format from Gemini API')
      }

      // Mark key as successful
      this.keyManager.markKeySuccess(currentApiKey)

      return data.candidates[0].content.parts[0].text
      
    } catch (error) {
      console.error('❌ Gemini API text generation failed:', error)
      
      // Handle specific error types
      if (error.name === 'AbortError') {
        error.message = 'Request timeout - API took too long to respond'
        error.code = 'timeout'
      } else if (error.name === 'TypeError' && error.message.includes('fetch')) {
        error.message = 'Network error - Unable to connect to Gemini API'
        error.code = 'network_error'
      }
      
      // Mark key as failed for load balancer
      this.keyManager.markKeyFailed(currentApiKey, error)
      
      throw new Error(`Failed to generate text: ${error.message}`)
    }
  }
}
