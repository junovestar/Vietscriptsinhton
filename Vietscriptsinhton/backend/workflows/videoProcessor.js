import { GeminiService } from '../services/geminiService.js'
import { DeepSeekService } from '../services/deepSeekService.js'
import { TranscriptService } from '../services/transcriptService.js'
import { ScriptGeneratorService } from '../services/scriptGeneratorService.js'

/**
 * Main workflow function that mirrors the n8n workflow
 * Processes YouTube video following exact same steps as n8n
 */
export async function processYouTubeVideo(youtubeUrl, settings, progressCallback = null) {
  console.log('🎬 Starting video processing workflow...')
  console.log('📹 URL:', youtubeUrl)
  
  const updateProgress = (step, segment = 0, total = 0, segmentInfo = null, estimatedTime = null) => {
    if (progressCallback) {
      progressCallback({
        currentStep: step,
        currentSegment: segment,
        totalSegments: total,
        currentSegmentInfo: segmentInfo,
        estimatedTime: estimatedTime
      })
    }
  }
  
  try {
    // Step 1: Set Transcript Prompt (equivalent to "Set: Transcript Prompt" node)
    const initialPrompt = "Determine the total duration of the video in [hh:mm:ss] format."
    
    console.log('⏱️ Step 1: Getting video duration...')
    updateProgress(1, 0, 0, null, 'Đang phân tích độ dài video...')
    
    // Step 2: HTTP Request to Google (equivalent to "HTTP Request to Google" node)
    const geminiService = new GeminiService(settings.apiKey)
    const durationResponse = await geminiService.analyzeVideo(youtubeUrl, initialPrompt)
    
    console.log('📊 Duration response:', durationResponse)
    
    // Step 3: AI Agent + DeepSeek Chat Model (equivalent to "AI Agent" + "DeepSeek Chat Model" nodes)
    updateProgress(2, 0, 0, null, 'Đang dùng DeepSeek chia video thành các đoạn...')
    const deepSeekService = new DeepSeekService()
    const systemMessage = "Nhiệm vụ của bạn là chia khoảng thời gian này thành các item với giới hạn là 5 phút, cứ 5 phút 1 item, trả về kết quả là thời gian theo dạng hh:mm:ss."
    
    console.log('🤖 Step 2: Using DeepSeek to segment video into 5-minute chunks...')
    const timeSegments = await deepSeekService.processSegments(durationResponse, systemMessage)
    
    console.log('📋 Time segments:', timeSegments)
    
    // Calculate estimated time
    const estimatedMinutes = timeSegments.length * 1.5 + 5 // 1.5 min per segment + 5 min for final processing
    const estimatedTime = `Khoảng ${Math.ceil(estimatedMinutes)} phút`
    updateProgress(2, 0, timeSegments.length, null, estimatedTime)
    
    // Step 4: Split Out (equivalent to "Split Out" node)
    // Process each time segment
    const transcriptParts = []
    
    console.log('🔄 Step 3: Processing each segment...')
    updateProgress(3, 0, timeSegments.length, null, estimatedTime)
    
    for (let i = 0; i < timeSegments.length; i++) {
      const segment = timeSegments[i]
      console.log(`⏰ Processing segment ${i + 1}/${timeSegments.length}: ${segment.start} - ${segment.end}`)
      
      // Wait 1 minute between segments (equivalent to "Wait1" node)
      if (i > 0) {
        console.log('⏳ Wait1: Waiting 1 minute before next segment...')
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
      console.log('⏳ Waiting 1 minute to avoid rate limits...')
      await new Promise(resolve => setTimeout(resolve, 60000)) // 1 minute
      
      // Step 7: HTTP Request to Google1 (equivalent to "HTTP Request to Google1" node)
      // Using gemini-2.5-flash as specified in workflow
      const segmentTranscript = await geminiService.analyzeVideoSegment(youtubeUrl, scenePrompt, 'gemini-2.5-flash')
      
      // Step 8: Edit Fields (equivalent to "Edit Fields" node)
      transcriptParts.push(segmentTranscript)
      
      console.log(`✅ Segment ${i + 1} processed successfully`)
    }
    
    // Step 9: Aggregate (equivalent to "Aggregate" node)
    console.log('📝 Step 4: Aggregating all transcripts...')
    updateProgress(4, 0, 0, null, 'Đang tổng hợp transcript...')
    const fullTranscript = transcriptParts.join('\n\n')
    
    // Step 10: Wait (equivalent to "Wait" node) - 3 minutes delay
    console.log('⏳ Waiting 3 minutes before final processing...')
    await new Promise(resolve => setTimeout(resolve, 180000)) // 3 minutes
    
    // Step 11: Basic LLM Chain + Google Gemini Chat Model (equivalent to "Basic LLM Chain" + "Google Gemini Chat Model" nodes)
    console.log('🎭 Step 5: Using Gemini 2.5 Pro to generate final script...')
    updateProgress(5, 0, 0, null, 'Đang tạo bình luận cuối cùng...')
    
    // Use the exact prompt from n8n workflow (Basic LLM Chain node)
    const workflowPrompt = `ạn là Biên kịch viên YouTube chuyên nghiệp, chuyên viết kịch bản tóm tắt video sinh tồn nơi hoang dã.
Nhiệm vụ: Viết lại transcript thành kịch bản 10 phút, độ dài 4500–5000 chữ, giữ nguyên nội dung chính, chỉ thêm mô tả kịch tính và hài hước.
Yêu cầu: 
- Kể chuyện theo ngôi thứ 3.
- Chỉ xuất ra văn bản kịch bản, KHÔNG thêm ký tự đặc biệt, KHÔNG markdown, KHÔNG format ngoài chữ thường và chữ hoa.
- Nội dung phải bám sát transcript, không thêm chi tiết bên ngoài.
- Kết quả phải là chuỗi text thuần (plain text).
-Đầy đủ các hoạt động diễn ra trong script đã gửi, chỉ thêm mô tả chứ không thêm gì bên ngoài
- Nếu bạn lạc đề khỏi dàn ý, hãy tự sửa trước khi gửi.



+Yêu cầu nội dung



-Phong cách kể chuyện:




Kịch tính, hấp dẫn: Dẫn dắt người xem qua từng tình huống sinh tồn căng thẳng, nhưng luôn duy trì sự lạc quan và hài hước.



-Nhân vật chính:



Biệt danh hài hước: Tạo biệt danh cho nhân vật chính (ví dụ: "Thánh Nhọ Rừng Sâu", "Chuyên Gia Sinh Tồn Hệ 'tới đầu hay tới đít'").



-Bối cảnh và môi trường:



Mô tả sinh động: Miêu tả cảnh vật xung quanh một cách chi tiết, từ rừng rậm, suối nước, đến động vật hoang dã, nhưng luôn lồng ghép yếu tố hài hước.



-Kết thúc bất ngờ:



Cao trào kịch tính: Đưa người xem đến đỉnh điểm căng thẳng, nhưng kết thúc lại bằng một tình huống ngớ ngẩn hoặc hài hước, khiến người xem bật cười.   


Hãy trả về  đúng 1 plaintext duy nhất`

    // Use Gemini 2.5 Pro model as specified in workflow
    const finalScript = await geminiService.generateScript(fullTranscript, workflowPrompt, 'gemini-2.5-pro')
    
    console.log('🎉 Workflow completed successfully!')
    return finalScript
    
  } catch (error) {
    console.error('❌ Workflow error:', error)
    throw new Error(`Video processing failed: ${error.message}`)
  }
}

/**
 * Process uploaded video file
 */
export async function processVideoFile(filePath, settings) {
  console.log('📁 Processing uploaded video file...')
  
  try {
    // For uploaded files, we'll need to implement video analysis
    // This would require additional setup for local video processing
    throw new Error('File upload processing not yet implemented. Please use YouTube URLs for now.')
    
  } catch (error) {
    console.error('❌ File processing error:', error)
    throw error
  }
}
