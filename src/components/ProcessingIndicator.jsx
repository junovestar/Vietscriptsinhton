import React from 'react'
import { motion } from 'framer-motion'
import { Zap, X } from 'lucide-react'

const ProcessingIndicator = ({ isVisible, progress, onShowModal, onClose, onStop }) => {
  if (!isVisible) return null

  return (
    <motion.div
      className="fixed bottom-4 right-4 z-50"
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 50 }}
    >
      <div className="glass-panel p-4 shadow-glow-strong">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            <motion.div
              className="w-3 h-3 bg-yellow-400 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
            <span className="text-sm font-medium">Đang xử lý nền...</span>
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
              onClick={onShowModal}
              className="p-1 hover:bg-white hover:bg-opacity-10 rounded transition-colors"
              title="Xem tiến trình"
            >
              <Zap className="w-4 h-4" />
            </button>
            
            <button
              onClick={onClose}
              className="p-1 hover:bg-white hover:bg-opacity-10 rounded transition-colors"
              title="Đóng"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
        
        {progress && (
          <div className="mt-2 text-xs text-gray-400">
            Bước {progress.currentStep}/5 • {progress.estimatedTime}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default ProcessingIndicator
