/**
 * Time Segment Service - equivalent to AI Agent + Structured Output Parser
 */
export class TimeSegmentService {
  
  /**
   * Create time segments from duration - mirrors the AI Agent functionality
   */
  async createTimeSegments(durationText, systemMessage) {
        try {
      // Extract duration in hh:mm:ss format
      const durationMatch = durationText.match(/(\d{1,2}):(\d{2}):(\d{2})/)
      
      if (!durationMatch) {
        throw new Error('Could not extract duration from response')
      }

      const [, hours, minutes, seconds] = durationMatch
      const totalSeconds = parseInt(hours) * 3600 + parseInt(minutes) * 60 + parseInt(seconds)
      
      console.log(`📊 Total duration: ${hours}:${minutes}:${seconds} (${totalSeconds} seconds)`)
      
      // Create 5-minute segments
      const segments = []
      const segmentDuration = 5 * 60 // 5 minutes in seconds
      
      for (let start = 0; start < totalSeconds; start += segmentDuration) {
        const end = Math.min(start + segmentDuration, totalSeconds)
        
        segments.push({
          start: this.formatTime(start),
          end: this.formatTime(end)
        })
      }
      
            return segments
      
    } catch (error) {
      console.error('❌ Error creating time segments:', error)
      throw new Error(`Failed to create time segments: ${error.message}`)
    }
  }
  
  /**
   * Format seconds to hh:mm:ss
   */
  formatTime(totalSeconds) {
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
  }
  
  /**
   * Parse time string to seconds
   */
  parseTime(timeString) {
    const [hours, minutes, seconds] = timeString.split(':').map(Number)
    return hours * 3600 + minutes * 60 + seconds
  }
}
