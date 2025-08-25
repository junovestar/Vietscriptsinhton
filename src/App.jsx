import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import RadarView from './components/RadarView'
import SettingsPanel from './components/SettingsPanel'
import InputPanel from './components/InputPanel'
import ResultPanel from './components/ResultPanel'
import ProcessingModal from './components/ProcessingModal'
import BatchProcessModal from './components/BatchProcessModal'
import BatchProgressModal from './components/BatchProgressModal'
import BatchFloatingIndicator from './components/BatchFloatingIndicator'
import HistoryPanel from './components/HistoryPanel'
import HistoryStats from './components/HistoryStats'
import LiveResultsSidebar from './components/LiveResultsSidebar'

import RetryIndicator from './components/RetryIndicator'
import ApiKeyManager from './components/ApiKeyManager'
import ProxyManager from './components/ProxyManager'
import Header from './components/Header'
import ProcessingIndicator from './components/ProcessingIndicator'
import ErrorRetryModal from './components/ErrorRetryModal'
import { useVideoHistory } from './hooks/useLocalStorage'
import { Settings, Zap, Upload, Package, History, Key, Globe } from 'lucide-react'

function App() {
  const [showSettings, setShowSettings] = useState(false)
  const [showInput, setShowInput] = useState(false)
  const [showResult, setShowResult] = useState(false)
  const [showBatchProcess, setShowBatchProcess] = useState(false)
  const [showBatchProgress, setShowBatchProgress] = useState(false)
  const [showHistory, setShowHistory] = useState(false)
  const [showLiveResults, setShowLiveResults] = useState(false)
  const [showApiKeyManager, setShowApiKeyManager] = useState(false)
  const [showProxyManager, setShowProxyManager] = useState(false)
  const [retryInfo, setRetryInfo] = useState(null)
  const [processing, setProcessing] = useState(false)
  const [showProcessingModal, setShowProcessingModal] = useState(false)
  const [result, setResult] = useState('')
  const [resultType, setResultType] = useState('result') // 'result' or 'transcript'
  const [videos, setVideos] = useState([])
  const [batchProgress, setBatchProgress] = useState(null)
  
  // History management
  const { 
    history, 
    addToHistory, 
    removeFromHistory, 
    clearHistory,
    getHistoryStats 
  } = useVideoHistory()
  const [processingProgress, setProcessingProgress] = useState({
    currentStep: 1,
    currentSegment: 0,
    totalSegments: 0,
    currentSegmentInfo: null,
    estimatedTime: null,
    elapsedTime: null,
    startTime: null
  })
  
  const [partialResults, setPartialResults] = useState({
    duration: null,
    segments: null,
    transcripts: [],
    aggregated: null,
    finalResult: null
  })
  const [settings, setSettings] = useState(() => {
    // Load settings from localStorage
    const savedSettings = localStorage.getItem('binh-luan-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        // Remove apiKeys from settings - they will be managed separately
        const { apiKeys, ...settingsWithoutApiKeys } = parsed
        return settingsWithoutApiKeys
      } catch (e) {
        console.error('Error parsing saved settings:', e)
      }
    }
    
    // Default settings (without apiKeys)
    return {
      prompt: `Bạn là Biên kịch viên YouTube chuyên nghiệp, chuyên viết kịch bản tóm tắt video sinh tồn nơi hoang dã.
Nhiệm vụ: Viết lại transcript thành kịch bản 10 phút, độ dài 4500–5000 chữ, giữ nguyên nội dung chính, chỉ thêm mô tả kịch tính và hài hước.
Yêu cầu: 
- Kể chuyện theo ngôi thứ 3.
- Chỉ xuất ra văn bản kịch bản, KHÔNG thêm ký tự đặc biệt, KHÔNG markdown, KHÔNG format ngoài chữ thường và chữ hoa.
- Nội dung phải bám sát transcript, không thêm chi tiết bên ngoài.
- Kết quả phải là chuỗi text thuần (plain text).`,
      wordCount: 4500,
      writingStyle: 'Hài hước',
      mainCharacter: 'Thánh Nhọ Rừng Sâu',
      language: 'Tiếng Việt',
      creativity: 7
    }
  })

  // API Keys state - managed separately from settings
  const [apiKeys, setApiKeys] = useState([])
  const [apiKeysLoading, setApiKeysLoading] = useState(false)
  
  // Error handling and retry state
  const [processingError, setProcessingError] = useState(null)
  const [canRetry, setCanRetry] = useState(false)
  const [lastInput, setLastInput] = useState(null)

  // Save settings to localStorage whenever settings change
  useEffect(() => {
    localStorage.setItem('binh-luan-settings', JSON.stringify(settings))
    console.log('💾 Settings saved to localStorage:', settings)
  }, [settings])

  // Load API keys from backend on mount
  useEffect(() => {
    loadApiKeys()
  }, [])

  // Function to load API keys from backend
  const loadApiKeys = async () => {
    try {
      setApiKeysLoading(true)
      const response = await fetch('/api/keys/stats')
      console.log('🔍 API keys response status:', response.status)
      
      if (response.ok) {
        const stats = await response.json()
        console.log('🔍 API keys stats:', stats)
        
        // Use totalKeys to determine if we have API keys
        const hasKeys = stats.totalKeys > 0
        setApiKeys(hasKeys ? ['API_KEY_LOADED'] : []) // Use placeholder to indicate keys exist
        console.log('🔑 Loaded API keys from backend:', stats.totalKeys, 'keys available, hasKeys:', hasKeys)
      } else {
        console.error('Failed to load API keys:', response.status)
        setApiKeys([])
      }
    } catch (error) {
      console.error('Error loading API keys:', error)
      setApiKeys([])
    } finally {
      setApiKeysLoading(false)
    }
  }

  // Debug: Log current settings on component mount
  useEffect(() => {
    console.log('🏁 App mounted with settings:', settings)
    console.log('🔑 API keys loaded:', apiKeys.length, 'keys:', apiKeys)
  }, [apiKeys])

  const handleProcess = async (input) => {
    setProcessing(true)
    setShowProcessingModal(true) // Show processing modal
    setShowInput(false)
    setShowLiveResults(true) // Auto-show live results when processing starts
    
    // Reset và bắt đầu tracking progress
    const startTime = Date.now()
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    setProcessingProgress({
      currentStep: 1,
      currentSegment: 0,
      totalSegments: 0,
      currentSegmentInfo: null,
      estimatedTime: 'Đang tính toán...',
      elapsedTime: '0:00',
      startTime: startTime
    })
    
    // Reset partial results
    setPartialResults({
      duration: null,
      segments: null,
      transcripts: [],
      aggregated: null,
      finalResult: null
    })
    
    // Start timer for elapsed time
    const timer = setInterval(() => {
      const elapsed = Date.now() - startTime
      const minutes = Math.floor(elapsed / 60000)
      const seconds = Math.floor((elapsed % 60000) / 1000)
      setProcessingProgress(prev => ({
        ...prev,
        elapsedTime: `${minutes}:${seconds.toString().padStart(2, '0')}`
      }))
    }, 1000)
    
    // Setup SSE connection for progress updates
    const eventSource = new EventSource(`/api/progress/${clientId}`)
    
    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data)
        console.log('📊 Received SSE progress update:', data)
        
        if (data.type === 'progress') {
          console.log('🔄 Updating progress:', {
            currentStep: data.currentStep,
            currentSegment: data.currentSegment,
            totalSegments: data.totalSegments,
            estimatedTime: data.estimatedTime
          })
          
          setProcessingProgress(prev => ({
            ...prev,
            currentStep: data.currentStep || prev.currentStep,
            currentSegment: data.currentSegment || prev.currentSegment,
            totalSegments: data.totalSegments || prev.totalSegments,
            currentSegmentInfo: data.currentSegmentInfo || prev.currentSegmentInfo,
            estimatedTime: data.estimatedTime || prev.estimatedTime
          }))
          
          // Update partial results
          if (data.duration) {
            console.log('📊 Updating duration:', data.duration)
            setPartialResults(prev => ({ ...prev, duration: data.duration }))
          }
          if (data.segments) {
            console.log('📊 Updating segments:', data.segments.length, 'segments')
            setPartialResults(prev => ({ ...prev, segments: data.segments }))
          }
          if (data.transcripts) {
            console.log('📊 Updating transcripts:', data.transcripts.length, 'transcripts')
            setPartialResults(prev => ({ ...prev, transcripts: data.transcripts }))
          }
          if (data.aggregated) {
            console.log('📊 Updating aggregated transcript')
            setPartialResults(prev => ({ ...prev, aggregated: data.aggregated }))
            
            // Lưu transcript vào lịch sử ngay khi bước 4 hoàn thành
            console.log('📝 Lưu transcript vào lịch sử (bước 4 hoàn thành)')
            addToHistory({
              title: '📝 Transcript hoàn chỉnh (bước 4)',
              result: data.aggregated,
              transcript: data.aggregated,
              type: 'single',
              videoCount: 1,
              status: 'transcript_only',
              timestamp: new Date()
            })
          }
          if (data.finalResult) {
            console.log('📊 Updating final result')
            setPartialResults(prev => ({ ...prev, finalResult: data.finalResult }))
          }
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error)
      }
    }
    
    eventSource.onerror = (error) => {
      console.error('SSE connection error:', error)
      eventSource.close()
    }
    
    try {
      // Update progress to show we're starting the API call
      setProcessingProgress(prev => ({
        ...prev,
        currentStep: 1,
        estimatedTime: input.type === 'file' ? 'Đang upload file...' : 'Đang phân tích độ dài video...'
      }))
      
      // Pre-validation: Check if we have API keys
      if (!apiKeys || apiKeys.length === 0) {
        throw new Error('⚠️ Vui lòng thêm ít nhất 1 API key trong API Key Manager (🔑) trước khi xử lý video!')
      }

      // Debug: Log settings being sent
      console.log('🔑 Sending settings to backend:', {
        apiKeysCount: apiKeys.length,
        apiKeys: apiKeys,
        hasApiKeys: apiKeys.length > 0
      })
      
      let processInput = input
      
      // If it's a file upload, upload the file first
      if (input.type === 'file') {
        console.log('📁 Uploading file:', input.value.name)
        
        const formData = new FormData()
        formData.append('video', input.value)
        
        const uploadResponse = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })
        
        const uploadData = await uploadResponse.json()
        
        if (!uploadData.success) {
          throw new Error(uploadData.error || 'Upload failed')
        }
        
        console.log('✅ File uploaded successfully:', uploadData.file)
        
        // Update progress to show file processing
        setProcessingProgress(prev => ({
          ...prev,
          currentStep: 1,
          estimatedTime: 'Đang phân tích file video...'
        }))
        
        // Update input to use uploaded file path
        processInput = {
          type: 'file',
          value: uploadData.file
        }
      }
      
      // Don't send placeholder apiKeys to backend - backend manages its own keys
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: processInput,
          settings, // Don't include apiKeys - backend has its own
          onProgress: true,
          clientId
        })
      })
      
      const data = await response.json()
      console.log('🔍 Backend response:', data)
      
      if (data.success) {
        // Update progress to show completion
        setProcessingProgress(prev => ({
          ...prev,
          currentStep: 5,
          estimatedTime: 'Hoàn thành!'
        }))
        
        // Update partial results for display
        setPartialResults(prev => ({
          ...prev,
          finalResult: data.result
        }))
        
        setResult(data.result)
        
        // Check if this is transcript-only result
        const isTranscriptOnly = data.isTranscriptOnly || data.isPartialTranscript
        const resultTitle = isTranscriptOnly 
          ? (data.isPartialTranscript ? '📝 Transcript một phần' : '📝 Transcript hoàn chỉnh')
          : '🎭 Script hoàn chỉnh'
        
        const videoData = {
          id: Date.now(),
          title: data.title || resultTitle,
          result: data.result,
          timestamp: new Date(),
          isTranscriptOnly: isTranscriptOnly
        }
        setVideos(prev => [...prev, videoData])
        
        // Add to history (chỉ lưu script cuối, không lưu transcript vì đã lưu ở bước 4)
        addToHistory({
          title: videoData.title,
          result: data.result,
          transcript: partialResults.aggregated, // Add transcript
          type: 'single',
          videoCount: 1,
          status: 'completed'
        })
        
        setShowResult(true)
      } else {
        // Check if we have a result even though there was an error
        if (data.result) {
          console.log('⚠️ Processing completed with error but has result:', data.error)
          
          // Show warning but still display the result
          const warningMessage = data.isTranscriptOnly 
            ? `⚠️ Script generation failed: ${data.error}\n\nNhưng transcript đã được tạo thành công và có thể copy!`
            : `⚠️ Có lỗi xảy ra: ${data.error}\n\nNhưng kết quả vẫn được tạo và có thể copy!`
          
          alert(warningMessage)
          
          // Still process the result
          setResult(data.result)
          const videoData = {
            id: Date.now(),
            title: data.isTranscriptOnly ? '📝 Transcript (có lỗi script)' : '🎭 Script (có lỗi)',
            result: data.result,
            timestamp: new Date(),
            isTranscriptOnly: data.isTranscriptOnly
          }
          setVideos(prev => [...prev, videoData])
          
          // Không lưu trùng lặp nếu đã có transcript từ bước 4
          if (!partialResults.aggregated) {
            addToHistory({
              title: videoData.title,
              result: data.result,
              transcript: partialResults.aggregated,
              type: 'single',
              videoCount: 1,
              status: 'partial'
            })
          }
          
          setShowResult(true)
        } else {
          throw new Error(data.error || 'Có lỗi xảy ra')
        }
      }
    } catch (error) {
      console.error('❌ Processing error:', error)
      
      // Lưu thông tin lỗi và cho phép retry
      setProcessingError({
        message: error.message,
        step: processingProgress.currentStep,
        hasTranscript: !!partialResults.aggregated,
        transcript: partialResults.aggregated
      })
      setCanRetry(true)
      setLastInput(input)
      
      // Kiểm tra xem có transcript từ bước 4 không
      if (partialResults.aggregated) {
        console.log('📝 Có transcript từ bước 4, lưu vào lịch sử')
        addToHistory({
          title: '📝 Transcript hoàn chỉnh (có lỗi script)',
          result: partialResults.aggregated,
          transcript: partialResults.aggregated,
          type: 'single',
          videoCount: 1,
          status: 'transcript_only_error',
          timestamp: new Date()
        })
      } else {
        // Add failed processing to history
        addToHistory({
          title: `❌ Lỗi xử lý: ${input.type === 'url' ? 'YouTube URL' : 'File Upload'}`,
          result: `Lỗi: ${error.message}\n\nInput: ${input.value}\nThời gian: ${new Date().toLocaleString()}`,
          type: 'single',
          videoCount: 0,
          status: 'error'
        })
      }
    } finally {
      clearInterval(timer)
      eventSource.close()
      setProcessing(false)
      setShowProcessingModal(false)
      
      // Reset error state if no error occurred
      if (!processingError) {
        setProcessingError(null)
        setCanRetry(false)
        setLastInput(null)
      } else {
        // Show error modal if there's an error
        console.log('🚨 Showing error modal for retry')
      }
    }
  }

  const handleRetry = async () => {
    if (!lastInput) {
      console.error('❌ No last input to retry')
      return
    }
    
    console.log('🔄 Retrying with input:', lastInput)
    
    // Reset error state
    setProcessingError(null)
    setCanRetry(false)
    
    // Retry with the same input
    await handleProcess(lastInput)
  }

  const handleContinueFromTranscript = async () => {
    if (!lastInput || !processingError?.transcript) {
      console.error('❌ No transcript to continue from')
      return
    }
    
    console.log('🔄 Continuing from transcript')
    
    // Reset error state
    setProcessingError(null)
    setCanRetry(false)
    
    // Continue with script generation only
    await handleScriptGenerationOnly(lastInput, processingError.transcript)
  }

  const handleScriptGenerationOnly = async (input, transcript) => {
    setProcessing(true)
    setShowProcessingModal(true)
    setShowInput(false)
    setShowLiveResults(true)
    
    const startTime = Date.now()
    const clientId = `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    setProcessingProgress({
      currentStep: 5,
      currentSegment: 0,
      totalSegments: 0,
      currentSegmentInfo: null,
      estimatedTime: 'Đang tạo script từ transcript...',
      elapsedTime: '0:00',
      startTime: startTime
    })
    
    try {
      // Pre-validation: Check if we have API keys
      if (!apiKeys || apiKeys.length === 0) {
        throw new Error('⚠️ Vui lòng thêm ít nhất 1 API key trong API Key Manager (🔑) trước khi xử lý video!')
      }
      
      const response = await fetch('/api/generate-script-only', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          transcript,
          settings,
          clientId
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        setResult(data.result)
        const videoData = {
          id: Date.now(),
          title: '🎭 Script hoàn chỉnh (từ transcript)',
          result: data.result,
          timestamp: new Date(),
          isTranscriptOnly: false
        }
        setVideos(prev => [...prev, videoData])
        
        addToHistory({
          title: videoData.title,
          result: data.result,
          transcript: transcript,
          type: 'single',
          videoCount: 1,
          status: 'completed'
        })
        
        setShowResult(true)
      } else {
        throw new Error(data.error || 'Có lỗi xảy ra khi tạo script')
      }
    } catch (error) {
      console.error('❌ Script generation error:', error)
      setProcessingError({
        message: error.message,
        step: 5,
        hasTranscript: true,
        transcript: transcript
      })
      setCanRetry(true)
      setLastInput(input)
    } finally {
      setProcessing(false)
      setShowProcessingModal(false)
    }
  }

  const handleBatchProcess = async (videoList) => {
    console.log('🔄 Starting batch processing:', videoList.length, 'videos')
    
    // Pre-validation: Check if we have API keys
    if (!apiKeys || apiKeys.length === 0) {
      alert('⚠️ Vui lòng thêm ít nhất 1 API key trong API Key Manager (🔑) trước khi xử lý video!')
      return
    }
    
    const batchData = {
      videos: videoList.map(v => ({ ...v, status: 'pending', result: null, error: null })),
      currentIndex: 0,
      isProcessing: true
    }
    
    setBatchProgress(batchData)
    setShowBatchProgress(true)
    setShowBatchProcess(false)
    
    // Process videos one by one
    for (let i = 0; i < videoList.length; i++) {
      const video = videoList[i]
      
      // Update current processing video
      setBatchProgress(prev => ({
        ...prev,
        currentIndex: i,
        videos: prev.videos.map((v, idx) => 
          idx === i ? { ...v, status: 'processing' } : v
        )
      }))
      
      try {
        console.log(`📹 Processing video ${i + 1}/${videoList.length}:`, video.title)
        
        const response = await fetch('/api/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            input: { type: video.type, value: video.input },
            settings: { ...settings, apiKeys }, // Include apiKeys in settings for backend
            onProgress: false // Disable individual progress for batch
          })
        })
        
        const data = await response.json()
        
        if (data.success) {
          // Mark as completed
          setBatchProgress(prev => ({
            ...prev,
            videos: prev.videos.map((v, idx) => 
              idx === i ? { 
                ...v, 
                status: 'completed', 
                result: data.result,
                title: data.title || v.title
              } : v
            )
          }))
          
          // Add to main videos list
          setVideos(prevVideos => [...prevVideos, {
            id: Date.now() + i,
            title: data.title || video.title,
            result: data.result,
            timestamp: new Date()
          }])
          
        } else {
          throw new Error(data.error || 'Có lỗi xảy ra')
        }
        
      } catch (error) {
        console.error(`❌ Error processing video ${i + 1}:`, error)
        
        // Mark as error
        setBatchProgress(prev => ({
          ...prev,
          videos: prev.videos.map((v, idx) => 
            idx === i ? { 
              ...v, 
              status: 'error', 
              error: error.message
            } : v
          )
        }))
      }
      
      // Wait between videos to avoid rate limits
      if (i < videoList.length - 1) {
        console.log('⏳ Waiting 30 seconds before next video...')
        await new Promise(resolve => setTimeout(resolve, 30000))
      }
    }
    
    // Mark batch as completed
    setBatchProgress(prev => ({
      ...prev,
      isProcessing: false
    }))
    
    // Add batch to history (including errors)
    const completedVideos = batchProgress.videos.filter(v => v.status === 'completed')
    const errorVideos = batchProgress.videos.filter(v => v.status === 'error')
    
    if (completedVideos.length > 0 || errorVideos.length > 0) {
      let batchResult = ''
      
      // Add successful videos
      if (completedVideos.length > 0) {
        batchResult += '✅ THÀNH CÔNG:\n\n'
        batchResult += completedVideos.map(v => 
          `${v.title}:\n${v.result}\n\n---\n\n`
        ).join('')
      }
      
      // Add failed videos
      if (errorVideos.length > 0) {
        batchResult += '❌ THẤT BẠI:\n\n'
        batchResult += errorVideos.map(v => 
          `${v.title}:\nLỗi: ${v.error}\nInput: ${v.input}\nThời gian: ${new Date().toLocaleString()}\n\n---\n\n`
        ).join('')
      }
      
      addToHistory({
        title: `Batch ${completedVideos.length}/${batchProgress.videos.length} video${errorVideos.length > 0 ? ` (${errorVideos.length} lỗi)` : ''}`,
        result: batchResult,
        type: 'batch',
        videoCount: completedVideos.length,
        errorCount: errorVideos.length,
        status: errorVideos.length > 0 ? 'partial' : 'success'
      })
    }
    
    console.log('🎉 Batch processing completed!')
  }

  return (
    <div className="min-h-screen relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-32 h-32 bg-glow rounded-full blur-3xl animate-pulse-glow"></div>
        <div className="absolute bottom-1/3 right-1/4 w-24 h-24 bg-accent-cyan rounded-full blur-2xl animate-pulse-glow delay-1000"></div>
      </div>

      {/* Header */}
      <Header />
      
      {/* History Stats */}
      {getHistoryStats().total > 0 && (
        <div className="container mx-auto px-4 pt-4">
          <div className="flex justify-center">
            <HistoryStats 
              stats={getHistoryStats()} 
              onClick={() => setShowHistory(true)} 
            />
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 relative z-10">
        <div className="flex flex-col items-center space-y-8">
          
          {/* Control Buttons */}
          <div className="flex space-x-4">
            <button
              onClick={() => setShowSettings(true)}
              className="glass-panel p-3 hover:bg-white hover:bg-opacity-10 transition-all duration-300 relative"
            >
              <Settings className="w-6 h-6" />
            </button>
            
            <button
              onClick={() => setShowInput(true)}
              className="glow-button flex items-center space-x-2"
              disabled={processing}
            >
              <Upload className="w-5 h-5" />
              <span>Thêm Video</span>
            </button>
            
            <button
              onClick={() => setShowBatchProcess(true)}
              className="glass-panel px-4 py-2 hover:bg-white hover:bg-opacity-10 transition-all duration-300 flex items-center space-x-2"
              disabled={processing}
            >
              <Package className="w-5 h-5" />
              <span>Hàng Loạt</span>
            </button>
            
            <button
              onClick={() => setShowHistory(true)}
              className="glass-panel px-4 py-2 hover:bg-white hover:bg-opacity-10 transition-all duration-300 flex items-center space-x-2"
            >
              <History className="w-5 h-5" />
              <span>Lịch Sử</span>
              {history.length > 0 && (
                <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
                  {history.length}
                </span>
              )}
            </button>
            
            <button
              onClick={() => setShowApiKeyManager(true)}
              className="glass-panel px-4 py-2 hover:bg-white hover:bg-opacity-10 transition-all duration-300 flex items-center space-x-2 relative"
              title="Quản lý API Keys"
            >
              <Key className="w-5 h-5" />
              <span>API Keys</span>
              {(!apiKeys || apiKeys.length === 0) && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              )}
            </button>
            

            
            <button
              onClick={() => setShowProxyManager(true)}
              className="glass-panel px-4 py-2 hover:bg-white hover:bg-opacity-10 transition-all duration-300 flex items-center space-x-2"
              title="Quản lý Proxy"
            >
              <Globe className="w-5 h-5" />
              <span>Proxy</span>
            </button>
            
            {processing && !showProcessingModal && (
              <button
                onClick={() => setShowProcessingModal(true)}
                className="glass-panel px-4 py-2 hover:bg-white hover:bg-opacity-10 transition-all duration-300"
              >
                <Zap className="w-5 h-5 inline mr-2" />
                Xem Tiến Trình
              </button>
            )}
            
            {result && (
              <button
                onClick={() => setShowResult(true)}
                className="glass-panel px-4 py-2 hover:bg-white hover:bg-opacity-10 transition-all duration-300"
              >
                <Zap className="w-5 h-5 inline mr-2" />
                Xem Kết Quả
              </button>
            )}
          </div>

          {/* Radar View */}
          <RadarView 
            processing={processing} 
            videos={videos}
            processingProgress={processingProgress}
            onVideoClick={(video) => {
              setResult(video.result)
              setShowResult(true)
            }}
          />

          {/* Status */}
          <div className="glass-panel px-6 py-3 text-center">
            {/* API Keys Warning */}
            {(!apiKeys || apiKeys.length === 0) && (
              <div className="mb-3 p-2 bg-red-600 bg-opacity-20 border border-red-500 rounded text-red-300 text-sm">
                ⚠️ Chưa có API key! Vui lòng thêm API key trong API Key Manager (🔑) để bắt đầu xử lý video.
              </div>
            )}
            

            

            <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                processing || (batchProgress && batchProgress.isProcessing) 
                  ? 'bg-yellow-400 animate-pulse' 
                  : 'bg-green-400'
              }`}></div>
              <span className="text-sm">
                {processing || (batchProgress && batchProgress.isProcessing) 
                  ? (showProcessingModal ? 'Đang xử lý...' : 'Đang xử lý nền...') 
                  : 'Sẵn sàng'}
              </span>
            </div>
            
            <div className="flex items-center space-x-2">
              <Zap className="w-4 h-4 text-glow" />
              <span className="text-sm">
                {videos.length} video • {getHistoryStats().total} lịch sử
              </span>
            </div>
            
            {batchProgress && batchProgress.isProcessing && (
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-blue-400" />
                <span className="text-sm text-blue-400">
                  Hàng loạt: {batchProgress.videos.filter(v => v.status === 'completed').length}/{batchProgress.videos.length}
                </span>
              </div>
            )}
          </div>
          </div>
        </div>
      </main>

      {/* Panels */}
      <AnimatePresence>
        {showSettings && (
          <SettingsPanel
            settings={settings}
            onSettingsChange={setSettings}
            onClose={() => setShowSettings(false)}
          />
        )}
        
        {showInput && (
          <InputPanel
            onProcess={handleProcess}
            onClose={() => setShowInput(false)}
          />
        )}
        
        {showResult && (
          <ResultPanel
            result={result}
            type={resultType}
            onClose={() => setShowResult(false)}
            onResultUpdate={(updatedResult) => {
              setResult(updatedResult)
              // Update the latest video in videos array
              setVideos(prev => prev.map(v => 
                v.id === prev[prev.length - 1]?.id 
                  ? { ...v, result: updatedResult }
                  : v
              ))
            }}
          />
        )}
        
        {processing && showProcessingModal && !processingError && (
          <ProcessingModal
            isOpen={showProcessingModal}
            progress={processingProgress}
            partialResults={partialResults}
            onClose={() => {
              // Ẩn modal nhưng vẫn tiếp tục xử lý nền
              setShowProcessingModal(false)
            }}
            onStop={() => {
              // Dừng xử lý
              if (confirm('Bạn có chắc muốn dừng xử lý video? Kết quả hiện tại sẽ bị mất.')) {
                setProcessing(false)
                setShowProcessingModal(false)
                setProcessingProgress({
                  currentStep: 1,
                  currentSegment: 0,
                  totalSegments: 0,
                  currentSegmentInfo: null,
                  estimatedTime: ''
                })
                setPartialResults({
                  duration: null,
                  segments: null,
                  transcripts: [],
                  aggregated: null,
                  finalResult: null
                })
                
                // Đóng SSE connection nếu có
                if (window.eventSource) {
                  window.eventSource.close()
                  window.eventSource = null
                }
                
                // Thông báo cho user
                alert('Đã dừng xử lý video!')
              }
            }}
          />
        )}
        
        {showBatchProcess && (
          <BatchProcessModal
            isOpen={showBatchProcess}
            onClose={() => setShowBatchProcess(false)}
            onProcess={handleBatchProcess}
          />
        )}
        
        {showBatchProgress && (
          <BatchProgressModal
            isOpen={showBatchProgress}
            batchProgress={batchProgress}
            onClose={() => setShowBatchProgress(false)}
            onViewResult={(result) => {
              setResult(result)
              setShowResult(true)
            }}
            onMinimize={() => setShowBatchProgress(false)}
            onStop={() => {
              // Dừng batch processing
              if (confirm('Bạn có chắc muốn dừng xử lý hàng loạt? Các video chưa xử lý sẽ bị hủy.')) {
                setBatchProgress(prev => ({
                  ...prev,
                  isProcessing: false
                }))
                setShowBatchProgress(false)
                
                // Thông báo cho user
                alert('Đã dừng xử lý hàng loạt!')
              }
            }}
          />
        )}
        
        {processingError && canRetry && (
          <ErrorRetryModal
            isOpen={!!processingError}
            onClose={() => {
              setProcessingError(null)
              setCanRetry(false)
              setLastInput(null)
            }}
            error={processingError}
            onRetry={handleRetry}
            onContinueFromTranscript={handleContinueFromTranscript}
            currentStep={processingProgress.currentStep}
          />
        )}
        
        {showHistory && (
          <HistoryPanel
            isOpen={showHistory}
            onClose={() => setShowHistory(false)}
            history={history}
            onViewResult={(result, type = 'result') => {
              setResult(result)
              setResultType(type)
              setShowResult(true)
            }}
            onDeleteItem={removeFromHistory}
            onClearHistory={() => {
              clearHistory()
              setShowHistory(false)
            }}
          />
        )}
        
        {showApiKeyManager && (
          <ApiKeyManager
            isOpen={showApiKeyManager}
            onClose={() => setShowApiKeyManager(false)}
            onApiKeysChange={loadApiKeys} // Refresh API keys when changed
          />
        )}
        
        {showProxyManager && (
          <ProxyManager
            isOpen={showProxyManager}
            onClose={() => setShowProxyManager(false)}
          />
        )}
      </AnimatePresence>
      
      {/* Floating Batch Indicator */}
      <BatchFloatingIndicator
        batchProgress={batchProgress}
        showModal={showBatchProgress}
        onShow={() => setShowBatchProgress(true)}
        onMinimize={() => {
          setShowBatchProgress(false)
          setBatchProgress(null)
        }}
        onStop={() => {
          // Dừng batch processing
          if (confirm('Bạn có chắc muốn dừng xử lý hàng loạt? Các video chưa xử lý sẽ bị hủy.')) {
            setBatchProgress(prev => ({
              ...prev,
              isProcessing: false
            }))
            setShowBatchProgress(false)
            
            // Thông báo cho user
            alert('Đã dừng xử lý hàng loạt!')
          }
        }}
      />
      
      {/* Live Results Sidebar */}
      {(processing || partialResults.finalResult) && (
        <LiveResultsSidebar
          isOpen={showLiveResults}
          partialResults={partialResults}
          progress={processingProgress}
          onToggle={() => setShowLiveResults(!showLiveResults)}
        />
      )}
      
      {/* Retry Indicator */}
      <RetryIndicator retryInfo={retryInfo} />
      
      {/* Processing Indicator (when modal is hidden) */}
      <ProcessingIndicator
        isVisible={processing && !showProcessingModal}
        progress={processingProgress}
        onShowModal={() => setShowProcessingModal(true)}
        onClose={() => setProcessing(false)}
        onStop={() => {
          // Dừng xử lý
          if (confirm('Bạn có chắc muốn dừng xử lý video? Kết quả hiện tại sẽ bị mất.')) {
            setProcessing(false)
            setProcessingProgress({
              currentStep: 1,
              currentSegment: 0,
              totalSegments: 0,
              currentSegmentInfo: null,
              estimatedTime: ''
            })
            setPartialResults({
              duration: null,
              segments: null,
              transcripts: [],
              aggregated: null,
              finalResult: null
            })
            
            // Đóng SSE connection nếu có
            if (window.eventSource) {
              window.eventSource.close()
              window.eventSource = null
            }
            
            // Thông báo cho user
            alert('Đã dừng xử lý video!')
          }
        }}
      />
      

    </div>
  )
}

export default App
