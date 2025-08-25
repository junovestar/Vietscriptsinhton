import React from 'react'
import { motion } from 'framer-motion'
import { X, RefreshCw, Play, AlertTriangle, FileText } from 'lucide-react'

const ErrorRetryModal = ({ 
  isOpen, 
  onClose, 
  error, 
  onRetry, 
  onContinueFromTranscript,
  currentStep 
}) => {
  if (!isOpen || !error) return null

  const getStepName = (step) => {
    switch (step) {
      case 1: return 'Phân tích độ dài video'
      case 2: return 'Chia video thành các đoạn'
      case 3: return 'Xử lý từng đoạn'
      case 4: return 'Tổng hợp transcript'
      case 5: return 'Tạo script cuối'
      default: return 'Không xác định'
    }
  }

  const getErrorIcon = () => {
    if (error.hasTranscript) {
      return <FileText className="w-8 h-8 text-orange-400" />
    }
    return <AlertTriangle className="w-8 h-8 text-red-400" />
  }

  const getErrorTitle = () => {
    if (error.hasTranscript) {
      return '📝 Có transcript nhưng script bị lỗi'
    }
    return '❌ Lỗi xử lý video'
  }

  const getErrorDescription = () => {
    if (error.hasTranscript) {
      return 'Video đã được xử lý thành công đến bước 4 (có transcript), nhưng bước 5 (tạo script) bị lỗi. Bạn có thể:'
    }
    return `Lỗi xảy ra ở bước ${currentStep} (${getStepName(currentStep)}). Bạn có thể:`
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="glass-panel w-full max-w-lg"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              {getErrorIcon()}
              <h2 className="text-xl font-bold text-glow">{getErrorTitle()}</h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Error Details */}
          <div className="mb-6">
            <p className="text-gray-300 mb-4">
              {getErrorDescription()}
            </p>
            
            <div className="bg-red-500 bg-opacity-10 border border-red-500 border-opacity-30 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-2">
                <AlertTriangle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-400 font-medium mb-1">Chi tiết lỗi:</p>
                  <p className="text-gray-300 text-sm">{error.message}</p>
                </div>
              </div>
            </div>

            {error.hasTranscript && (
              <div className="bg-blue-500 bg-opacity-10 border border-blue-500 border-opacity-30 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-2">
                  <FileText className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-blue-400 font-medium mb-1">Transcript có sẵn:</p>
                    <p className="text-gray-300 text-sm">
                      Transcript đã được tạo thành công và có thể copy từ lịch sử.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            {error.hasTranscript && (
              <button
                onClick={onContinueFromTranscript}
                className="w-full glow-button bg-gradient-to-r from-blue-600 to-cyan-600 flex items-center justify-center space-x-2"
              >
                <Play className="w-5 h-5" />
                <span>Tiếp tục tạo script từ transcript</span>
              </button>
            )}
            
            <button
              onClick={onRetry}
              className="w-full glow-button bg-gradient-to-r from-orange-600 to-red-600 flex items-center justify-center space-x-2"
            >
              <RefreshCw className="w-5 h-5" />
              <span>Thử lại từ đầu</span>
            </button>
            
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg hover:bg-opacity-20 transition-colors"
            >
              Đóng
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ErrorRetryModal
