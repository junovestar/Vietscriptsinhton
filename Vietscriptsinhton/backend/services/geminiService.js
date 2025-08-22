/**
 * Gemini API Service - mirrors the HTTP requests from n8n workflow
 */
import { defaultRetryService } from './retryService.js'
import { apiKeyManager } from './apiKeyManager.js'
import { proxyManager } from './proxyManager.js'

export class GeminiService {
  constructor(apiKey = null) {
    this.primaryApiKey = apiKey // User-provided key
    this.baseUrl = 'https://generativelanguage.googleapis.com/v1beta'
    this.retryService = defaultRetryService
    this.keyManager = apiKeyManager
    this.proxyManager = proxyManager
  }

  /**
   * Get API key with load balancing
   */
  getCurrentApiKey() {
    if (this.primaryApiKey) {
      return this.primaryApiKey // Use user-provided key if available
    }
    return this.keyManager.getNextApiKey() // Otherwise use managed keys
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
          body: JSON.stringify(requestBody)
        }

        // Add proxy agent if available
        if (agent) {
          fetchOptions.agent = agent
        }

        const response = await fetch(url, fetchOptions)

        if (!response.ok) {
          const errorText = await response.text()
          const error = new Error(`Gemini API error: ${response.status} - ${errorText}`)
          
          // Add specific error codes for better retry detection
          if (response.status === 429) {
            error.code = 'rate_limit_exceeded'
          } else if (response.status === 503) {
            error.code = 'service_unavailable'
          } else if (errorText.toLowerCase().includes('overload')) {
            error.code = 'model_overloaded'
          }
          
          // Mark key as failed for load balancer
          if (!this.primaryApiKey) {
            this.keyManager.markKeyFailed(currentApiKey, error)
          }
          
          throw error
        }

        const data = await response.json()
        
        if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
          throw new Error('Invalid response format from Gemini API')
        }

        // Mark key as successful
        if (!this.primaryApiKey) {
          this.keyManager.markKeySuccess(currentApiKey)
        }

        return data.candidates[0].content.parts[0].text
        
      } catch (error) {
        // Mark key as failed for load balancer
        if (!this.primaryApiKey) {
          this.keyManager.markKeyFailed(currentApiKey, error)
        }
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
          body: JSON.stringify(requestBody)
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
        if (!this.primaryApiKey) {
          this.keyManager.markKeyFailed(currentApiKey, error)
        }
        
        throw error
      }

      const data = await response.json()
      
      if (!data.candidates || !data.candidates[0] || !data.candidates[0].content || !data.candidates[0].content.parts) {
        throw new Error('Invalid response format from Gemini API')
      }

      // Mark key as successful
      if (!this.primaryApiKey) {
        this.keyManager.markKeySuccess(currentApiKey)
      }

      return data.candidates[0].content.parts[0].text
      
    } catch (error) {
      console.error('❌ Gemini API script generation failed:', error)
      
      // Mark key as failed for load balancer
      if (!this.primaryApiKey) {
        this.keyManager.markKeyFailed(currentApiKey, error)
      }
      
      throw new Error(`Failed to generate script: ${error.message}`)
    }
  }
}
