import { GeminiService } from '../services/geminiService.js'

// Test script to verify Gemini API duration call works correctly
async function testGeminiDuration() {
  console.log('🧪 Testing Gemini API duration call...')
  
  const apiKey = 'AIzaSyClZFBCA_uXJLwBYG0rV3j0-flFEH6SyOU'
  const youtubeUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' // Rick Roll for testing
  const prompt = 'Determine the total duration of the video in [hh:mm:ss] format.'
  
  try {
    const geminiService = new GeminiService(apiKey)
    
    console.log('📡 Making API call to Gemini...')
    console.log('🔗 URL:', youtubeUrl)
    console.log('💬 Prompt:', prompt)
    
    const result = await geminiService.analyzeVideo(youtubeUrl, prompt, 'gemini-1.5-flash')
    
    console.log('✅ Success! Gemini response:')
    console.log('📊 Duration result:', result)
    
    // Parse the duration from the response
    const durationMatch = result.match(/(\d{2}:\d{2}:\d{2})/);
    if (durationMatch) {
      console.log('⏱️ Extracted duration:', durationMatch[1])
    } else {
      console.log('⚠️ Could not extract duration format from response')
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
    
    if (error.message.includes('overload')) {
      console.log('💡 This is likely due to model overload - retry logic will handle this')
    }
    
    if (error.message.includes('quota')) {
      console.log('💡 API quota exceeded - check your API limits')
    }
  }
}

// Run the test
if (import.meta.url === `file://${process.argv[1]}`) {
  testGeminiDuration()
}
