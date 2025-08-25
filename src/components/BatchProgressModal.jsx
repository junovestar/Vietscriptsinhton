import React from 'react'
import { motion } from 'framer-motion'
import { CheckCircle, AlertCircle, Clock, Minimize2, Copy, Eye } from 'lucide-react'

const BatchProgressModal = ({ isOpen, batchProgress, onClose, onViewResult, onMinimize, onStop }) => {
  if (!isOpen || !batchProgress) return null

  const { videos, currentIndex, isProcessing } = batchProgress

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-gray-400" />
      case 'processing':
        return <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <div className="w-5 h-5 border-2 border-blue-400 border-t-transparent rounded-full" />
        </motion.div>
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-400" />
      default:
        return <Clock className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-600 bg-opacity-20 border-gray-600'
      case 'processing':
        return 'bg-blue-500 bg-opacity-20 border-blue-500 shadow-glow'
      case 'completed':
        return 'bg-green-500 bg-opacity-20 border-green-500'
      case 'error':
        return 'bg-red-500 bg-opacity-20 border-red-500'
      default:
        return 'bg-gray-600 bg-opacity-20 border-gray-600'
    }
  }

  const completedCount = videos.filter(v => v.status === 'completed').length
  const errorCount = videos.filter(v => v.status === 'error').length
  const totalProgress = ((currentIndex) / videos.length) * 100

  const copyResult = async (result) => {
    try {
      await navigator.clipboard.writeText(result)
      // Could add a toast notification here
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-70 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="glass-panel w-full max-w-4xl max-h-[90vh] flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="p-6 border-b border-white border-opacity-20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-glow">🔄 Xử Lý Hàng Loạt</h2>
              <p className="text-gray-300 mt-1">
                {isProcessing ? 'Đang xử lý...' : 'Hoàn thành'} • {completedCount}/{videos.length} thành công
              </p>
            </div>
            <div className="flex space-x-2">
              {isProcessing && (
                <button
                  onClick={onStop}
                  className="p-2 bg-red-600 bg-opacity-20 border border-red-500 rounded-lg hover:bg-opacity-30 transition-colors"
                  title="Dừng xử lý"
                >
                  ⏹️
                </button>
              )}
              <button
                onClick={onMinimize}
                className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
                title="Thu nhỏ"
              >
                <Minimize2 className="w-5 h-5" />
              </button>
              <button
                onClick={onClose}
                disabled={isProcessing}
                className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors disabled:opacity-50"
                title="Đóng"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-gray-400 mb-2">
              <span>Tổng tiến độ</span>
              <span>{Math.round(totalProgress)}%</span>
            </div>
            <div className="w-full bg-white bg-opacity-10 rounded-full h-2">
              <motion.div
                className="h-full bg-gradient-to-r from-accent-blue to-glow rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${totalProgress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        </div>

        {/* Videos List */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-3">
            {videos.map((video, index) => (
              <motion.div
                key={video.id}
                className={`p-4 border rounded-lg transition-all ${getStatusColor(video.status)} ${
                  index === currentIndex && isProcessing ? 'ring-2 ring-blue-400' : ''
                }`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <div className="flex items-start space-x-4">
                  {/* Status Icon */}
                  <div className="flex-shrink-0 mt-1">
                    {getStatusIcon(video.status)}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="text-white font-medium truncate">
                        {index + 1}. {video.title}
                      </h3>
                      <div className="flex space-x-2 ml-4">
                        {video.status === 'completed' && video.result && (
                          <>
                            <button
                              onClick={() => onViewResult(video.result)}
                              className="p-1 hover:bg-white hover:bg-opacity-10 rounded transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4 text-blue-400" />
                            </button>
                            <button
                              onClick={() => copyResult(video.result)}
                              className="p-1 hover:bg-white hover:bg-opacity-10 rounded transition-colors"
                              title="Sao chép"
                            >
                              <Copy className="w-4 h-4 text-green-400" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-gray-400 mb-2 truncate">
                      {video.input}
                    </div>

                    {/* Status Messages */}
                    {video.status === 'pending' && (
                      <div className="text-sm text-gray-400">
                        ⏳ Chờ xử lý...
                      </div>
                    )}

                    {video.status === 'processing' && (
                      <div className="text-sm text-blue-400">
                        🔄 Đang xử lý... {video.progress ? `(${video.progress}%)` : ''}
                      </div>
                    )}

                    {video.status === 'completed' && video.result && (
                      <div className="mt-2">
                        <div className="text-sm text-green-400 mb-2">
                          ✅ Hoàn thành • {video.result.length} ký tự
                        </div>
                        <div className="bg-black bg-opacity-30 p-3 rounded text-xs text-gray-300 max-h-20 overflow-hidden">
                          {video.result.substring(0, 200)}
                          {video.result.length > 200 && (
                            <span className="text-blue-400">... (xem thêm)</span>
                          )}
                        </div>
                      </div>
                    )}

                    {video.status === 'error' && video.error && (
                      <div className="text-sm text-red-400 bg-red-500 bg-opacity-10 p-2 rounded">
                        ❌ Lỗi: {video.error}
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Footer Stats */}
        <div className="p-6 border-t border-white border-opacity-20">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="glass-panel p-3">
              <div className="text-2xl font-bold text-green-400">{completedCount}</div>
              <div className="text-xs text-gray-400">Thành công</div>
            </div>
            <div className="glass-panel p-3">
              <div className="text-2xl font-bold text-red-400">{errorCount}</div>
              <div className="text-xs text-gray-400">Lỗi</div>
            </div>
            <div className="glass-panel p-3">
              <div className="text-2xl font-bold text-blue-400">{videos.length - completedCount - errorCount}</div>
              <div className="text-xs text-gray-400">Còn lại</div>
            </div>
          </div>

          {!isProcessing && (
            <div className="text-center mt-4">
              <div className="text-sm text-gray-400">
                🎉 Hoàn thành xử lý hàng loạt! {completedCount} video thành công.
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default BatchProgressModal
