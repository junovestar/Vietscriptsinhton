import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Eye, X } from 'lucide-react'

const BatchFloatingIndicator = ({ batchProgress, onShow, onMinimize, onStop, showModal = false }) => {
  if (!batchProgress || !batchProgress.isProcessing || showModal) return null

  const completedCount = batchProgress.videos.filter(v => v.status === 'completed').length
  const totalCount = batchProgress.videos.length
  const progress = (completedCount / totalCount) * 100

  return (
    <AnimatePresence>
      <motion.div
        className="fixed bottom-4 left-4 z-50"
        initial={{ opacity: 0, x: -50 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -50 }}
      >
        <div className="glass-panel p-4 shadow-glow-strong max-w-xs">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <motion.div
                className="w-3 h-3 bg-blue-400 rounded-full"
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <span className="text-sm font-medium">Hàng loạt</span>
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={onStop}
                className="p-1 bg-red-600 bg-opacity-20 border border-red-500 rounded hover:bg-opacity-30 transition-colors"
                title="Dừng xử lý"
              >
                ⏹️
              </button>
              
              <button
                onClick={onShow}
                className="p-1 hover:bg-white hover:bg-opacity-10 rounded transition-colors"
                title="Xem chi tiết"
              >
                <Eye className="w-4 h-4" />
              </button>
              
              <button
                onClick={onMinimize}
                className="p-1 hover:bg-white hover:bg-opacity-10 rounded transition-colors"
                title="Đóng"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          
          <div className="mt-2">
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>Tiến độ</span>
              <span>{completedCount}/{totalCount}</span>
            </div>
            <div className="w-full bg-white bg-opacity-10 rounded-full h-1">
              <motion.div
                className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          
          <div className="mt-2 text-xs text-gray-400">
            {batchProgress.currentIndex < totalCount ? 
              `Đang xử lý: ${batchProgress.currentIndex + 1}/${totalCount}` : 
              'Hoàn thành!'
            }
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}

export default BatchFloatingIndicator
