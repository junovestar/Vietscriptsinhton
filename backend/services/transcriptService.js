/**
 * Transcript Service - handles transcript extraction and processing
 */
export class TranscriptService {
  
  /**
   * Extract transcript from YouTube video
   * This is a placeholder for potential future transcript extraction
   */
  async getYouTubeTranscript(videoUrl) {
        try {
      // Extract video ID from URL
      const videoId = this.extractVideoId(videoUrl)
      
      if (!videoId) {
        throw new Error('Invalid YouTube URL')
      }
      
      // For now, we rely on Gemini to analyze the video directly
      // In the future, this could be enhanced with youtube-transcript package
            return null // Will use Gemini direct analysis
      
    } catch (error) {
      console.error('❌ Error extracting transcript:', error)
      throw new Error(`Failed to extract transcript: ${error.message}`)
    }
  }
  
  /**
   * Extract video ID from YouTube URL
   */
  extractVideoId(url) {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/,
      /youtube\.com\/embed\/([^&\n?#]+)/,
      /youtube\.com\/v\/([^&\n?#]+)/
    ]
    
    for (const pattern of patterns) {
      const match = url.match(pattern)
      if (match) {
        return match[1]
      }
    }
    
    return null
  }
  
  /**
   * Clean and format transcript text
   */
  cleanTranscript(transcript) {
    if (!transcript) return ''
    
    return transcript
      .replace(/\[.*?\]/g, '') // Remove timestamp markers
      .replace(/\n\s*\n/g, '\n') // Remove empty lines
      .trim()
  }
  
  /**
   * Split transcript into chunks for processing
   */
  chunkTranscript(transcript, maxChunkSize = 4000) {
    if (!transcript) return []
    
    const words = transcript.split(' ')
    const chunks = []
    let currentChunk = []
    let currentLength = 0
    
    for (const word of words) {
      if (currentLength + word.length + 1 > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk.join(' '))
        currentChunk = [word]
        currentLength = word.length
      } else {
        currentChunk.push(word)
        currentLength += word.length + 1
      }
    }
    
    if (currentChunk.length > 0) {
      chunks.push(currentChunk.join(' '))
    }
    
    return chunks
  }
}
