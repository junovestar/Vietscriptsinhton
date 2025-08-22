import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Copy, FileText, Check } from 'lucide-react'

const ResultPanel = ({ result, onClose }) => {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(result)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  const handleClear = () => {
    if (confirm('Bạn có chắc muốn xóa kết quả này?')) {
      onClose()
    }
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
        <div className="flex items-center justify-between p-6 border-b border-white border-opacity-20">
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6 text-glow" />
            <h2 className="text-2xl font-bold text-glow">📄 Kết Quả Bình Luận</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Stats */}
            <div className="flex items-center space-x-6 mb-4 text-sm text-gray-400">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4" />
                <span>{result.length} ký tự</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>📊</span>
                <span>{result.split(' ').length} từ</span>
              </div>
              <div className="flex items-center space-x-2">
                <span>📝</span>
                <span>Plain Text</span>
              </div>
            </div>

            {/* Result Text Area */}
            <div className="flex-1 bg-black bg-opacity-30 border border-white border-opacity-20 rounded-lg p-4 overflow-y-auto">
              <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-100 font-mono">
                {result}
              </pre>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex space-x-4 p-6 border-t border-white border-opacity-20">
          <button
            onClick={handleCopy}
            className={`glow-button flex-1 flex items-center justify-center space-x-2 transition-all ${
              copied ? 'bg-green-600' : ''
            }`}
          >
            {copied ? (
              <>
                <Check className="w-5 h-5" />
                <span>Đã Sao Chép!</span>
              </>
            ) : (
              <>
                <Copy className="w-5 h-5" />
                <span>Sao Chép</span>
              </>
            )}
          </button>
          
          <button
            onClick={handleClear}
            className="glass-panel px-6 py-3 hover:bg-white hover:bg-opacity-10 transition-colors"
          >
            Xóa
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ResultPanel
