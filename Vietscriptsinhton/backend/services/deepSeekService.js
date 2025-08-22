/**
 * DeepSeek API Service - mirrors the DeepSeek Chat Model from n8n workflow
 */
export class DeepSeekService {
  constructor(apiKey) {
    this.apiKey = apiKey || process.env.DEEPSEEK_API_KEY
    this.baseUrl = 'https://api.deepseek.com/v1'
  }

  /**
   * Chat completion using DeepSeek API
   * Equivalent to @n8n/n8n-nodes-langchain.lmChatDeepSeek
   */
  async chatCompletion(prompt, systemMessage) {
    const url = `${this.baseUrl}/chat/completions`
    
    const requestBody = {
      model: 'deepseek-chat',
      messages: [
        {
          role: 'system',
          content: systemMessage
        },
        {
          role: 'user', 
          content: prompt
        }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.7
    }

    try {
      console.log('🤖 Calling DeepSeek API...')
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.apiKey}`
        },
        body: JSON.stringify(requestBody)
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`)
      }

      const data = await response.json()
      
      if (!data.choices || !data.choices[0] || !data.choices[0].message) {
        throw new Error('Invalid response format from DeepSeek API')
      }

      return data.choices[0].message.content
      
    } catch (error) {
      console.error('❌ DeepSeek API call failed:', error)
      throw new Error(`Failed to process with DeepSeek: ${error.message}`)
    }
  }

  /**
   * Process duration text and return structured segments
   * Mirrors AI Agent + DeepSeek Chat Model + Structured Output Parser workflow
   */
  async processSegments(durationText, systemMessage) {
    const prompt = `Đây là độ dài của clip\n${durationText}`
    
    try {
      const responseText = await this.chatCompletion(prompt, systemMessage)
      
      // Parse JSON response (equivalent to Structured Output Parser)
      const parsedResponse = JSON.parse(responseText)
      
      if (!parsedResponse.items || !Array.isArray(parsedResponse.items)) {
        throw new Error('Invalid segment format from DeepSeek')
      }
      
      return parsedResponse.items
      
    } catch (error) {
      console.error('❌ DeepSeek segment processing failed:', error)
      throw error
    }
  }
}

// Create default instance (will need API key)
export const defaultDeepSeekService = new DeepSeekService()
