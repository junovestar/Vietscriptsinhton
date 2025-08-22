import React, { useState } from 'react'
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
import TestButtons from './components/TestButtons'
import RetryIndicator from './components/RetryIndicator'
import ApiKeyManager from './components/ApiKeyManager'
import ProxyManager from './components/ProxyManager'
import Header from './components/Header'
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
  const [result, setResult] = useState('')
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
  const [settings, setSettings] = useState({
    apiKey: 'AIzaSyClZFBCA_uXJLwBYG0rV3j0-flFEH6SyOU',
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
  })

  const handleProcess = async (input) => {
    setProcessing(true)
    setShowInput(false)
    setShowLiveResults(true) // Auto-show live results when processing starts
    
    // Reset và bắt đầu tracking progress
    const startTime = Date.now()
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
    
    try {
      // Update progress to show we're starting the API call
      setProcessingProgress(prev => ({
        ...prev,
        currentStep: 1,
        estimatedTime: 'Đang phân tích video...'
      }))
      
      const response = await fetch('/api/process', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input,
          settings,
          onProgress: true
        })
      })
      
      const data = await response.json()
      
      if (data.success) {
        // Update progress to show completion
        setProcessingProgress(prev => ({
          ...prev,
          currentStep: 5,
          estimatedTime: 'Hoàn thành!'
        }))
        
        setResult(data.result)
        const videoData = {
          id: Date.now(),
          title: data.title || 'Video đã xử lý',
          result: data.result,
          timestamp: new Date()
        }
        setVideos(prev => [...prev, videoData])
        
        // Add to history
        addToHistory({
          title: videoData.title,
          result: data.result,
          type: 'single',
          videoCount: 1
        })
        
        setShowResult(true)
      } else {
        throw new Error(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      alert('Lỗi: ' + error.message)
    } finally {
      clearInterval(timer)
      setProcessing(false)
    }
  }

  const handleBatchProcess = async (videoList) => {
    console.log('🔄 Starting batch processing:', videoList.length, 'videos')
    
    const batchData = {
      videos: videoList.map(v => ({ ...v, status: 'pending', result: null, error: null })),
      currentIndex: 0,
      isProcessing: true
    }
    
    setBatchProgress(batchData)
    setShowBatchProgress(true)
    
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
            settings,
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
    
    // Add batch to history
    const completedVideos = batchData.videos.filter(v => v.status === 'completed')
    if (completedVideos.length > 0) {
      const batchResult = completedVideos.map(v => 
        `${v.title}:\n${v.result}\n\n---\n\n`
      ).join('')
      
      addToHistory({
        title: `Batch ${completedVideos.length} video`,
        result: batchResult,
        type: 'batch',
        videoCount: completedVideos.length
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
              className="glass-panel p-3 hover:bg-white hover:bg-opacity-10 transition-all duration-300"
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
              className="glass-panel px-4 py-2 hover:bg-white hover:bg-opacity-10 transition-all duration-300 flex items-center space-x-2"
              title="Quản lý API Keys"
            >
              <Key className="w-5 h-5" />
              <span>API Keys</span>
            </button>
            
            <button
              onClick={() => setShowProxyManager(true)}
              className="glass-panel px-4 py-2 hover:bg-white hover:bg-opacity-10 transition-all duration-300 flex items-center space-x-2"
              title="Quản lý Proxy"
            >
              <Globe className="w-5 h-5" />
              <span>Proxy</span>
            </button>
            
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
                      <div className="flex items-center justify-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className={`w-2 h-2 rounded-full ${
                processing || (batchProgress && batchProgress.isProcessing) 
                  ? 'bg-yellow-400 animate-pulse' 
                  : 'bg-green-400'
              }`}></div>
              <span className="text-sm">
                {processing || (batchProgress && batchProgress.isProcessing) 
                  ? 'Đang xử lý...' 
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
            onClose={() => setShowResult(false)}
          />
        )}
        
        {processing && (
          <ProcessingModal
            isOpen={processing}
            progress={processingProgress}
            partialResults={partialResults}
            onClose={() => {}} // Không cho phép đóng, chỉ ẩn
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
          />
        )}
        
        {showHistory && (
          <HistoryPanel
            isOpen={showHistory}
            onClose={() => setShowHistory(false)}
            history={history}
            onViewResult={(result) => {
              setResult(result)
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
        onShow={() => setShowBatchProgress(true)}
        onMinimize={() => setShowBatchProgress(false)}
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
      
      {/* Test Buttons Panel (for debugging) */}
      {process.env.NODE_ENV === 'development' && <TestButtons />}
    </div>
  )
}

export default App
