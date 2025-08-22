import React from 'react'
import { motion } from 'framer-motion'
import { Clock, Zap, CheckCircle, Circle, Loader2 } from 'lucide-react'

const ProcessingModal = ({ isOpen, progress, onClose, partialResults }) => {
  if (!isOpen) return null

  const steps = [
    { id: 1, name: 'Gemini 1.5 Flash: Lấy duration', icon: Clock, result: partialResults?.duration },
    { id: 2, name: 'DeepSeek: AI Agent chia đoạn', icon: Circle, result: partialResults?.segments },
    { id: 3, name: 'Gemini 2.5 Flash: Xử lý segments', icon: Zap, result: partialResults?.transcripts },
    { id: 4, name: 'Aggregate: Tổng hợp transcript', icon: Circle, result: partialResults?.aggregated },
    { id: 5, name: 'Gemini 2.5 Pro: Script cuối', icon: CheckCircle, result: partialResults?.finalResult }
  ]

  const getStepStatus = (stepId) => {
    if (progress.currentStep > stepId) return 'completed'
    if (progress.currentStep === stepId) return 'processing'
    return 'pending'
  }

  const getProgressPercentage = () => {
    if (progress.currentStep === 3 && progress.segments) {
      // Đang xử lý từng đoạn
      const segmentProgress = (progress.currentSegment / progress.totalSegments) * 100
      const baseProgress = ((progress.currentStep - 1) / steps.length) * 100
      const stepProgress = (segmentProgress / 100) * (100 / steps.length)
      return Math.min(baseProgress + stepProgress, 95)
    }
    
    return Math.min((progress.currentStep / steps.length) * 100, 95)
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="glass-panel w-full max-w-2xl"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 relative">
              <motion.div
                className="w-16 h-16 border-4 border-glow rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-glow animate-spin" />
              </div>
            </div>
            
            <h2 className="text-2xl font-bold text-glow mb-2">
              Đang Xử Lý Video...
            </h2>
            
            <p className="text-gray-300">
              Vui lòng đợi trong khi AI phân tích và tạo bình luận
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Tiến độ</span>
              <span>{Math.round(getProgressPercentage())}%</span>
            </div>
            
            <div className="w-full bg-white bg-opacity-10 rounded-full h-3 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-accent-blue to-glow rounded-full shadow-glow"
                initial={{ width: 0 }}
                animate={{ width: `${getProgressPercentage()}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4">
            {steps.map((step, index) => {
              const status = getStepStatus(step.id)
              const Icon = step.icon
              
              return (
                <motion.div
                  key={step.id}
                  className={`flex items-center space-x-4 p-4 rounded-lg transition-all ${
                    status === 'completed' 
                      ? 'bg-green-500 bg-opacity-20 border border-green-500 border-opacity-30' 
                      : status === 'processing' 
                      ? 'bg-blue-500 bg-opacity-20 border border-blue-500 border-opacity-30' 
                      : 'bg-white bg-opacity-5 border border-white border-opacity-10'
                  }`}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                    status === 'completed' 
                      ? 'bg-green-500 text-white' 
                      : status === 'processing' 
                      ? 'bg-blue-500 text-white' 
                      : 'bg-gray-600 text-gray-400'
                  }`}>
                    {status === 'completed' ? (
                      <CheckCircle className="w-5 h-5" />
                    ) : status === 'processing' ? (
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Icon className="w-5 h-5" />
                      </motion.div>
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  
                  <div className="flex-1">
                    <div className={`font-medium ${
                      status === 'completed' 
                        ? 'text-green-400' 
                        : status === 'processing' 
                        ? 'text-blue-400' 
                        : 'text-gray-400'
                    }`}>
                      {step.name}
                    </div>
                    
                    {/* Segment progress for step 3 */}
                    {step.id === 3 && status === 'processing' && progress.segments && (
                      <div className="mt-2">
                        <div className="text-xs text-gray-400 mb-1">
                          Đoạn {progress.currentSegment} / {progress.totalSegments}
                        </div>
                        <div className="w-full bg-white bg-opacity-10 rounded-full h-1">
                          <div 
                            className="h-full bg-blue-400 rounded-full transition-all duration-500"
                            style={{ width: `${(progress.currentSegment / progress.totalSegments) * 100}%` }}
                          />
                        </div>
                        {progress.currentSegmentInfo && (
                          <div className="text-xs text-blue-300 mt-1">
                            {progress.currentSegmentInfo.start} - {progress.currentSegmentInfo.end}
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Status messages */}
                    {status === 'completed' && (
                      <div className="text-xs text-green-300 mt-1">
                        ✓ Hoàn thành
                      </div>
                    )}
                    
                    {status === 'processing' && step.id !== 3 && (
                      <div className="text-xs text-blue-300 mt-1">
                        🔄 Đang xử lý...
                      </div>
                    )}
                    
                    {/* Show results for completed steps */}
                    {status === 'completed' && step.result && (
                      <div className="mt-2 p-2 bg-black bg-opacity-30 rounded text-xs">
                        {step.id === 1 && (
                          <div className="text-green-400">
                            🤖 Gemini response: "{step.result}"
                          </div>
                        )}
                        
                        {step.id === 2 && Array.isArray(step.result) && (
                          <div className="text-blue-400">
                            📋 {step.result.length} đoạn được tạo:
                            <div className="mt-1 max-h-16 overflow-y-auto">
                              {step.result.slice(0, 3).map((segment, i) => (
                                <div key={i} className="text-gray-300">
                                  • {segment.start} - {segment.end}
                                </div>
                              ))}
                              {step.result.length > 3 && (
                                <div className="text-gray-400">
                                  ... và {step.result.length - 3} đoạn khác
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                        
                        {step.id === 3 && Array.isArray(step.result) && (
                          <div className="text-purple-400">
                            📝 {step.result.length} transcript hoàn thành:
                            <div className="mt-1 max-h-20 overflow-y-auto">
                              {step.result.slice(-1).map((transcript, i) => (
                                <div key={i} className="text-gray-300">
                                  {transcript.substring(0, 100)}...
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {step.id === 4 && step.result && (
                          <div className="text-yellow-400">
                            📄 Transcript tổng hợp: {step.result.length} ký tự
                            <div className="mt-1 text-gray-300 max-h-16 overflow-y-auto">
                              {step.result.substring(0, 150)}...
                            </div>
                          </div>
                        )}
                        
                        {step.id === 5 && step.result && (
                          <div className="text-green-400">
                            ✨ Bình luận hoàn thành: {step.result.length} ký tự
                            <div className="mt-1 text-gray-300 max-h-20 overflow-y-auto">
                              {step.result.substring(0, 200)}...
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              )
            })}
          </div>

          {/* Time estimate */}
          <div className="mt-6 text-center">
            <div className="text-sm text-gray-400">
              ⏱️ Thời gian ước tính: {progress.estimatedTime || 'Đang tính toán...'}
            </div>
            {progress.elapsedTime && (
              <div className="text-xs text-gray-500 mt-1">
                Đã trôi qua: {progress.elapsedTime}
              </div>
            )}
          </div>

          {/* Action buttons */}
          <div className="mt-6 flex justify-center space-x-4">
            {partialResults?.finalResult && (
              <button
                onClick={() => {
                  // Create a temporary result panel
                  const newWindow = window.open('', '_blank', 'width=800,height=600')
                  newWindow.document.write(`
                    <html>
                      <head>
                        <title>Kết quả bình luận</title>
                        <style>
                          body { 
                            font-family: Arial, sans-serif; 
                            padding: 20px; 
                            background: #1a1a1a; 
                            color: #fff; 
                            line-height: 1.6; 
                          }
                          .container { max-width: 800px; margin: 0 auto; }
                          .header { 
                            text-align: center; 
                            padding: 20px; 
                            border-bottom: 2px solid #333; 
                            margin-bottom: 20px; 
                          }
                          .content { 
                            background: #2a2a2a; 
                            padding: 20px; 
                            border-radius: 8px; 
                            white-space: pre-wrap; 
                          }
                        </style>
                      </head>
                      <body>
                        <div class="container">
                          <div class="header">
                            <h1>🎬 Kết Quả Bình Luận</h1>
                            <p>Generated by Binh Luan Generate By Thành MKT</p>
                          </div>
                          <div class="content">${partialResults.finalResult}</div>
                        </div>
                      </body>
                    </html>
                  `)
                  newWindow.document.close()
                }}
                className="px-4 py-2 bg-blue-600 bg-opacity-20 border border-blue-500 rounded-lg hover:bg-opacity-30 transition-colors text-sm"
              >
                👁️ Xem Preview
              </button>
            )}
            
            <button
              onClick={onClose}
              className="text-sm text-gray-400 hover:text-white transition-colors px-4 py-2"
            >
              Ẩn cửa sổ này (tiếp tục xử lý nền)
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ProcessingModal
