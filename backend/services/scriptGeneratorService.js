import { GeminiService } from './geminiService.js'

/**
 * Script Generator Service - equivalent to Basic LLM Chain
 */
export class ScriptGeneratorService {
  
  /**
   * Generate final script from transcript - mirrors Basic LLM Chain functionality
   */
  async generateScript(transcript, settings) {
    console.log('🎭 Generating script with settings:', {
      wordCount: settings.wordCount,
      writingStyle: settings.writingStyle,
      mainCharacter: settings.mainCharacter,
      language: settings.language,
      creativity: settings.creativity
    })
    
    try {
      // Build the prompt with user settings
      const customizedPrompt = this.buildPrompt(settings)
      
      // Use Gemini service to generate script with fallback models
      const geminiService = new GeminiService()
      const script = await geminiService.generateScriptWithFallback(transcript, customizedPrompt)
      
      console.log('✅ Script generated successfully')
      return script
      
    } catch (error) {
      console.error('❌ Error generating script:', error)
      throw new Error(`Failed to generate script: ${error.message}`)
    }
  }
  
  /**
   * Generate script with fallback models - direct wrapper for GeminiService
   */
  async generateScriptWithFallback(transcript, settings) {
    console.log('🎭 Generating script with fallback models')
    console.log('📋 Transcript length:', transcript.length)
    console.log('⚙️ Settings:', {
      wordCount: settings.wordCount,
      writingStyle: settings.writingStyle,
      mainCharacter: settings.mainCharacter,
      language: settings.language,
      creativity: settings.creativity
    })
    
    try {
      // Build the prompt with user settings
      const customizedPrompt = this.buildPrompt(settings)
      console.log('📝 Customized prompt length:', customizedPrompt.length)
      
      // Use Gemini service to generate script with fallback models
      const geminiService = new GeminiService()
      console.log('🔄 Calling generateScriptWithFallback...')
      const script = await geminiService.generateScriptWithFallback(transcript, customizedPrompt)
      
      console.log('✅ Script generated successfully with fallback')
      console.log('📊 Generated script length:', script.length)
      return script
      
    } catch (error) {
      console.error('❌ Error generating script with fallback:', error)
      console.error('❌ Error stack:', error.stack)
      throw new Error(`Failed to generate script: ${error.message}`)
    }
  }
  
  /**
   * Build customized prompt based on user settings
   */
  buildPrompt(settings) {
    let prompt = settings.prompt
    
    // Replace placeholders with actual settings
    prompt = prompt.replace(/4500–5000 chữ/g, `${settings.wordCount} chữ`)
    
    // Add character customization
    if (settings.mainCharacter && settings.mainCharacter !== 'Thánh Nhọ Rừng Sâu') {
      prompt += `\n\nTên nhân vật chính: ${settings.mainCharacter}`
    }
    
    // Add writing style
    if (settings.writingStyle !== 'Hài hước') {
      prompt += `\n\nPhong cách viết: ${settings.writingStyle}`
    }
    
    // Add language preference
    if (settings.language !== 'Tiếng Việt') {
      prompt += `\n\nNgôn ngữ: ${settings.language}`
    }
    
    // Add creativity level instruction
    const creativityInstructions = this.getCreativityInstruction(settings.creativity)
    if (creativityInstructions) {
      prompt += `\n\n${creativityInstructions}`
    }
    
    return prompt
  }
  
  /**
   * Get creativity level instructions
   */
  getCreativityInstruction(level) {
    if (level <= 3) {
      return "Viết theo cách bảo thủ, bám sát nội dung gốc, ít sáng tạo."
    } else if (level <= 6) {
      return "Viết cân bằng giữa bám sát nội dung và sáng tạo."
    } else if (level <= 8) {
      return "Viết sáng tạo, thêm nhiều yếu tố hài hước và kịch tính."
    } else {
      return "Viết rất sáng tạo, tối đa hóa yếu tố giải trí và bất ngờ."
    }
  }
}
