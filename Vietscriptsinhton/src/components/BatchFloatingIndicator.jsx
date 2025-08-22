import React from 'react'
import { motion } from 'framer-motion'
import { Package, Eye, Minimize2 } from 'lucide-react'

const BatchFloatingIndicator = ({ batchProgress, onShow, onMinimize }) => {
  if (!batchProgress || (!batchProgress.isProcessing && batchProgress.videos.every(v => v.status !== 'completed'))) {
    return null
  }

  const completedCount = batchProgress.videos.filter(v => v.status === 'completed').length
  const totalCount = batchProgress.videos.length
  const progress = (completedCount / totalCount) * 100

  return (
    <motion.div
      className="fixed bottom-6 right-6 z-40"
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
    >
      <motion.div
        className="glass-panel p-4 cursor-pointer hover:shadow-glow-strong transition-all duration-300 min-w-64"
        onClick={onShow}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="relative">
              <Package className="w-6 h-6 text-blue-400" />
              {batchProgress.isProcessing && (
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-blue-400 rounded-full"
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 1, repeat: Infinity }}
                />
              )}
            </div>
          </div>
          
          <div className="flex-1">
            <div className="text-sm font-medium text-white">
              Xử lý hàng loạt
            </div>
            <div className="text-xs text-gray-400">
              {completedCount}/{totalCount} hoàn thành
            </div>
            
            {/* Mini progress bar */}
            <div className="w-full bg-white bg-opacity-10 rounded-full h-1 mt-1">
              <motion.div
                className="h-full bg-gradient-to-r from-accent-blue to-glow rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
          
          <div className="flex-shrink-0">
            <button
              onClick={(e) => {
                e.stopPropagation()
                onShow()
              }}
              className="p-1 hover:bg-white hover:bg-opacity-10 rounded transition-colors"
              title="Xem chi tiết"
            >
              <Eye className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Latest completed video preview */}
        {completedCount > 0 && (
          <div className="mt-2 pt-2 border-t border-white border-opacity-10">
            {(() => {
              const latestCompleted = batchProgress.videos
                .filter(v => v.status === 'completed')
                .slice(-1)[0]
              
              if (latestCompleted) {
                return (
                  <div className="text-xs">
                    <div className="text-green-400 mb-1">
                      ✅ Mới nhất: {latestCompleted.title}
                    </div>
                    <div className="text-gray-400 truncate">
                      {latestCompleted.result?.substring(0, 80)}...
                    </div>
                  </div>
                )
              }
              return null
            })()}
          </div>
        )}

        {!batchProgress.isProcessing && (
          <div className="mt-2 text-xs text-center text-green-400">
            🎉 Hoàn thành! Click để xem kết quả
          </div>
        )}
      </motion.div>
    </motion.div>
  )
}

export default BatchFloatingIndicator
