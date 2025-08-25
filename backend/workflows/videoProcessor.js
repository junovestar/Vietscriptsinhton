import { GeminiService } from '../services/geminiService.js'
// import { DeepSeekService } from '../services/deepSeekService.js'
import { TranscriptService } from '../services/transcriptService.js'
import { ScriptGeneratorService } from '../services/scriptGeneratorService.js'

/**
 * Main workflow function that mirrors the n8n workflow
 * Processes YouTube video following exact same steps as n8n
 */
export async function processYouTubeVideo(youtubeUrl, settings, progressCallback = null) {
      const updateProgress = (step, segment = 0, total = 0, segmentInfo = null, estimatedTime = null, partialData = null) => {
    if (progressCallback) {
      const progressData = {
        currentStep: step,
        currentSegment: segment,
        totalSegments: total,
        currentSegmentInfo: segmentInfo,
        estimatedTime: estimatedTime,
        ...partialData
      }
            if (partialData) {
        console.log(`📊 Partial data keys:`, Object.keys(partialData))
      }
      progressCallback(progressData)
    }
  }
  
  try {
                // Step 1: Set Transcript Prompt (equivalent to "Set: Transcript Prompt" node)
    const initialPrompt = `Analyze this specific YouTube video and determine its total duration in [hh:mm:ss] format.

Video URL: ${youtubeUrl}

Please focus ONLY on this specific video and return ONLY the duration in [hh:mm:ss] format.`
    
            updateProgress(1, 0, 0, null, 'Đang phân tích độ dài video...')
    
    // Step 2: HTTP Request to Google (equivalent to "HTTP Request to Google" node)
    const geminiService = new GeminiService()
    const durationResponse = await geminiService.analyzeVideo(youtubeUrl, initialPrompt)
    
        // Update progress with duration
    updateProgress(1, 0, 0, null, 'Đã lấy duration thành công', { duration: durationResponse })
    
    // DELAY 1 PHÚT SAU BƯỚC ĐẦU TIÊN
        updateProgress(1, 0, 0, null, 'Chờ 1 phút trước khi tiếp tục...')
    await new Promise(resolve => setTimeout(resolve, 60000)) // 1 minute
    
    // Step 3: AI Agent + Gemini 2.0 Flash Exp (thay thế DeepSeek)
            updateProgress(2, 0, 0, null, 'Đang dùng Gemini 2.0 chia video thành các đoạn...')
    
    const segmentPrompt = `Bạn là AI chuyên chia video thành các đoạn thời gian.

Nhiệm vụ: Chia video có độ dài ${durationResponse} thành các đoạn 5 phút.

Yêu cầu:
- Mỗi đoạn dài 5 phút (300 giây)
- Format thời gian: HH:MM:SS
- Đoạn cuối có thể ngắn hơn 5 phút nếu video không chia hết
- Chỉ trả về JSON, không thêm text khác
- Đảm bảo các đoạn liên tục và không bỏ sót thời gian
- Luôn tạo ít nhất 2 đoạn nếu video dài hơn 5 phút

Ví dụ cho video 07:04:
{
  "items": [
    {
      "start": "00:00:00",
      "end": "00:05:00"
    },
    {
      "start": "00:05:00", 
      "end": "00:07:04"
    }
  ]
}

Ví dụ cho video 07:44:
{
  "items": [
    {
      "start": "00:00:00",
      "end": "00:05:00"
    },
    {
      "start": "00:05:00", 
      "end": "00:07:44"
    }
  ]
}

Ví dụ cho video 12:30:
{
  "items": [
    {
      "start": "00:00:00",
      "end": "00:05:00"
    },
    {
      "start": "00:05:00",
      "end": "00:10:00"
    },
    {
      "start": "00:10:00",
      "end": "00:12:30"
    }
  ]
}

Trả về JSON cho video ${durationResponse}. Chỉ trả về JSON, không thêm text khác:`
    
            const segmentResponse = await geminiService.generateText(segmentPrompt, 'gemini-2.0-flash-exp')
    
            console.log('📋 Response starts with:', segmentResponse.substring(0, 100))
    
    // Parse JSON response
    let timeSegments = []
    try {
      const parsedResponse = JSON.parse(segmentResponse)
      timeSegments = parsedResponse.items || []
          } catch (parseError) {
      console.error('❌ Failed to parse segment response:', parseError)
            // Fallback: create segments manually based on duration
            // Try multiple duration formats
      let totalSeconds = 0
      let durationFormat = ''
      
      // Format 1: HH:MM:SS
      const durationMatch = durationResponse.match(/(\d{1,2}):(\d{2}):(\d{2})/)
      if (durationMatch) {
        const hours = parseInt(durationMatch[1])
        const minutes = parseInt(durationMatch[2])
        const seconds = parseInt(durationMatch[3])
        totalSeconds = hours * 3600 + minutes * 60 + seconds
        durationFormat = `${hours}:${minutes}:${seconds}`
        console.log(`📊 Parsed duration (HH:MM:SS): ${durationFormat} = ${totalSeconds} seconds`)
      } else {
        // Format 2: MM:SS
        const altMatch = durationResponse.match(/(\d{1,2}):(\d{2})/)
        if (altMatch) {
          const minutes = parseInt(altMatch[1])
          const seconds = parseInt(altMatch[2])
          totalSeconds = minutes * 60 + seconds
          durationFormat = `${minutes}:${seconds}`
          console.log(`📊 Parsed duration (MM:SS): ${durationFormat} = ${totalSeconds} seconds`)
        } else {
          // Format 3: Just seconds
          const secondsMatch = durationResponse.match(/(\d+)/)
          if (secondsMatch) {
            totalSeconds = parseInt(secondsMatch[1])
            durationFormat = `${totalSeconds}s`
            console.log(`📊 Parsed duration (seconds): ${durationFormat} = ${totalSeconds} seconds`)
          } else {
            console.error('❌ Could not parse any duration format:', durationResponse)
            // Emergency fallback
            totalSeconds = 300 // Assume 5 minutes
            durationFormat = '05:00 (fallback)'
                      }
        }
      }
      
      // Calculate segments (5 minutes = 300 seconds)
      const segmentCount = Math.ceil(totalSeconds / 300)
      console.log(`📊 Creating ${segmentCount} segments for ${totalSeconds} seconds total (${durationFormat})`)
            for (let i = 0; i < segmentCount; i++) {
        const startSeconds = i * 300
        const endSeconds = Math.min((i + 1) * 300, totalSeconds)
        
        // Convert to HH:MM:SS format
        const startTime = `${Math.floor(startSeconds / 3600).toString().padStart(2, '0')}:${Math.floor((startSeconds % 3600) / 60).toString().padStart(2, '0')}:${(startSeconds % 60).toString().padStart(2, '0')}`
        const endTime = `${Math.floor(endSeconds / 3600).toString().padStart(2, '0')}:${Math.floor((endSeconds % 3600) / 60).toString().padStart(2, '0')}:${(endSeconds % 60).toString().padStart(2, '0')}`
        
        timeSegments.push({
          start: startTime,
          end: endTime
        })
        
        console.log(`📋 Segment ${i + 1}: ${startTime} - ${endTime} (${endSeconds - startSeconds} seconds)`)
      }
      
          }
    
        // Validate segments
    if (timeSegments.length === 0) {
      console.error('❌ No segments created! Using emergency fallback...')
      timeSegments = [{ start: '00:00:00', end: '00:05:00' }]
    }
    
    // Enhanced validation
        let totalSegmentTime = 0
    timeSegments.forEach((segment, index) => {
      // Calculate segment duration
      const startParts = segment.start.split(':').map(Number)
      const endParts = segment.end.split(':').map(Number)
      const startSeconds = startParts[0] * 3600 + startParts[1] * 60 + startParts[2]
      const endSeconds = endParts[0] * 3600 + endParts[1] * 60 + endParts[2]
      const segmentDuration = endSeconds - startSeconds
      totalSegmentTime += segmentDuration
      
      console.log(`  Segment ${index + 1}: ${segment.start} - ${segment.end} (${segmentDuration}s)`)
    })
    
            // Check if segments cover the full duration
    if (totalSegmentTime < 300) { // Less than 5 minutes
      console.warn('⚠️ Total segment time is very short, may indicate parsing issue')
    }
    
    // Calculate estimated time
    const estimatedMinutes = timeSegments.length * 1.5 + 5 // 1.5 min per segment + 5 min for final processing
    const estimatedTime = `Khoảng ${Math.ceil(estimatedMinutes)} phút`
        updateProgress(2, 0, timeSegments.length, null, estimatedTime, { segments: timeSegments })
    
    // Step 4: Split Out (equivalent to "Split Out" node)
    // Process each time segment
    const transcriptParts = []
    
            updateProgress(3, 0, timeSegments.length, null, estimatedTime)
        for (let i = 0; i < timeSegments.length; i++) {
      const segment = timeSegments[i]
            // Wait 1 minute between segments (equivalent to "Wait1" node)
      if (i > 0) {
                await new Promise(resolve => setTimeout(resolve, 60000)) // 1 minute
      }
      
      // Update progress for current segment
            updateProgress(3, i + 1, timeSegments.length, segment, estimatedTime)
      
      // Step 5: Set Scene Clips (equivalent to "Set: Scene Clips" node)
      const scenePrompt = `Extract shareable clips for social media.  
Only analyze 5 minute from ${segment.start} to ${segment.end}.  
Do not skip any timeframe within this range. Break clips strictly by scene changes.  

Each clip must include:  
* Timestamp: [hh:mm:ss]-[hh:mm:ss]  
* Transcript: Verbatim dialogue/text within the clip.  
* Description: Describe the scene in chronological order. When the scene changes, start a new bullet point. Only describe events within the specified time range.  

How to describe:  
- Setting and environment: background, location, lighting, time of day, and other details.  
- Characters' clothing and expressions: outfits, facial expressions, body language, and emotions.  
- Actions and interactions: exact actions, interactions between characters, and camera movements such as panning, zooming, close-up, or wide shot.  

Start output directly with the response -- do not include any introductory text or explanations.`

      // Step 6: Wait (equivalent to "Wait1" node) - 1 minute delay
            await new Promise(resolve => setTimeout(resolve, 60000)) // 1 minute
      
      // Step 7: HTTP Request to Google1 (equivalent to "HTTP Request to Google1" node)
      // Using gemini-2.5-flash as specified in workflow
      const segmentTranscript = await geminiService.analyzeVideoSegment(youtubeUrl, scenePrompt, 'gemini-2.5-flash')
      
      // Step 8: Edit Fields (equivalent to "Edit Fields" node)
      transcriptParts.push(segmentTranscript)
      
            // Update progress with current transcripts
            updateProgress(3, i + 1, timeSegments.length, segment, estimatedTime, { 
        transcripts: [...transcriptParts] 
      })
    }
    
    // Step 9: Aggregate (equivalent to "Aggregate" node)
            updateProgress(4, 0, 0, null, 'Đang tổng hợp transcript...')
    
            transcriptParts.forEach((part, index) => {
      console.log(`  Part ${index + 1}: ${part.length} chars - ${part.substring(0, 100)}...`)
    })
    
    const fullTranscript = transcriptParts.join('\n\n--- Segment Break ---\n\n')
    
        // Update progress with aggregated transcript
    updateProgress(4, 0, 0, null, 'Đã tổng hợp transcript', { aggregated: fullTranscript })
    
    // Lưu transcript ngay khi bước 4 hoàn thành để đảm bảo có trong lịch sử
    console.log('📝 Bước 4 hoàn thành - Transcript đã sẵn sàng cho lịch sử')
    
    // Step 10: Wait (equivalent to "Wait" node) - 1 minute delay
        updateProgress(4, 0, 0, null, 'Chờ 1 phút trước khi tạo script cuối...')
    await new Promise(resolve => setTimeout(resolve, 60000)) // 1 minute
    
    // Step 11: Basic LLM Chain + Google Gemini Chat Model (equivalent to "Basic LLM Chain" + "Google Gemini Chat Model" nodes)
            updateProgress(5, 0, 0, null, 'Đang tạo bình luận cuối cùng (thử các model Gemini)...')
    
    // Use user settings from Settings Panel to customize the prompt

            console.log('📋 Full transcript preview (first 500 chars):', fullTranscript.substring(0, 500))
    console.log('📋 Full transcript preview (last 500 chars):', fullTranscript.substring(fullTranscript.length - 500))
        // Validate transcript
    if (!fullTranscript || fullTranscript.trim().length === 0) {
      console.error('❌ Empty transcript! Cannot generate script.')
      throw new Error('Transcript is empty - cannot generate final script')
    }
    
    if (fullTranscript.length < 100) {
      console.warn('⚠️ Very short transcript:', fullTranscript.length, 'characters')
    }
    
    // Use ScriptGeneratorService to apply user settings
    const scriptGenerator = new ScriptGeneratorService()
    
    try {
      const finalScript = await scriptGenerator.generateScriptWithFallback(fullTranscript, settings)
      
      console.log('📊 Final script preview (first 500 chars):', finalScript.substring(0, 500))
      
      // Send final completion update
      updateProgress(5, 0, 0, null, 'Hoàn thành!', { finalResult: finalScript })
      
      return finalScript
      
    } catch (scriptError) {
      console.error('❌ Script generation failed:', scriptError)
      
      // Even if script generation fails, return the transcript
      console.log('📝 Returning transcript as fallback result')
      updateProgress(5, 0, 0, null, 'Script generation failed, returning transcript', { 
        finalResult: fullTranscript,
        error: scriptError.message,
        isTranscriptOnly: true
      })
      
      return fullTranscript
    }
    
  } catch (error) {
    console.error('❌ Workflow error:', error)
    
    // Check if we have any transcript data to return
    if (transcriptParts && transcriptParts.length > 0) {
      const partialTranscript = transcriptParts.join('\n\n--- Segment Break ---\n\n')
      console.log('📝 Returning partial transcript due to workflow error')
      
      updateProgress(5, 0, 0, null, 'Workflow failed, returning partial transcript', { 
        finalResult: partialTranscript,
        error: error.message,
        isPartialTranscript: true
      })
      
      return partialTranscript
    }
    
    throw new Error(`Video processing failed: ${error.message}`)
  }
}

/**
 * Process uploaded video file
 */
export async function processVideoFile(filePath, settings, updateProgress) {
  try {
    console.log('📁 Processing uploaded video file:', filePath)
    
    // Step 1: Get video duration using ffprobe or similar
    updateProgress(1, 0, 0, null, 'Đang phân tích file video...')
    
    // For now, we'll use a simple approach with Gemini's file analysis
    // In the future, we can add ffprobe for more accurate duration detection
    
    // Step 2: Use Gemini to analyze the video file directly
    updateProgress(2, 0, 0, null, 'Đang phân tích nội dung video...')
    
    const geminiService = new GeminiService()
    
    // Create a prompt for video analysis
    const analysisPrompt = `Analyze this video file and provide a detailed transcript of all spoken content, actions, and visual elements. 

Please provide:
1. A complete transcript of all dialogue and narration
2. Description of key visual elements and actions
3. Timestamps for major events or scene changes
4. Any text that appears on screen

Format the output as a comprehensive transcript that can be used for content creation.`

    // Convert file path to file:// URL for Gemini
    const fileUrl = `file://${filePath}`
    
    const transcript = await geminiService.analyzeVideo(fileUrl, analysisPrompt, 'gemini-2.0-flash-exp')
    
    updateProgress(3, 0, 0, null, 'Đang xử lý transcript...')
    
    // Step 3: Generate final script using the transcript
    updateProgress(4, 0, 0, null, 'Đang tạo bình luận cuối cùng (thử các model Gemini)...')
    
    const scriptGenerator = new ScriptGeneratorService()
    const finalScript = await scriptGenerator.generateScriptWithFallback(transcript, settings)
    
    updateProgress(5, 0, 0, null, 'Hoàn thành!', { finalResult: finalScript })
    
    return finalScript
    
  } catch (error) {
    console.error('❌ File processing error:', error)
    
    // If file processing fails, provide a helpful error message
    if (error.message.includes('not supported') || error.message.includes('invalid')) {
      throw new Error('File format không được hỗ trợ. Vui lòng sử dụng file video MP4, MOV, hoặc AVI.')
    }
    
    throw new Error(`File processing failed: ${error.message}`)
  }
}
