import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Link, Upload, Send } from 'lucide-react'

const InputPanel = ({ onProcess, onClose }) => {
  const [inputType, setInputType] = useState('url')
  const [youtubeUrl, setYoutubeUrl] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [dragOver, setDragOver] = useState(false)

  const handleSubmit = () => {
    console.log('🔍 handleSubmit called:', { 
      inputType, 
      youtubeUrl, 
      selectedFile, 
      onProcess: typeof onProcess 
    })
    
    if (inputType === 'url' && youtubeUrl) {
      console.log('🚀 Processing URL:', youtubeUrl)
      onProcess({ type: 'url', value: youtubeUrl })
    } else if (inputType === 'file' && selectedFile) {
      console.log('🚀 Processing file:', selectedFile.name)
      onProcess({ type: 'file', value: selectedFile })
    } else {
      console.warn('⚠️ Invalid input - missing URL or file')
      alert('Vui lòng nhập URL hoặc chọn file!')
    }
  }

  const handleFileSelect = (file) => {
    if (file && (file.type.startsWith('video/') || file.name.endsWith('.mp4') || file.name.endsWith('.avi') || file.name.endsWith('.mov'))) {
      setSelectedFile(file)
    } else {
      alert('Vui lòng chọn file video hợp lệ!')
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    handleFileSelect(file)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    setDragOver(false)
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
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
            <h2 className="text-2xl font-bold text-glow">📥 Thêm Video</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Input Type Toggle */}
          <div className="flex space-x-2 mb-6">
            <button
              onClick={() => setInputType('url')}
              className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                inputType === 'url' 
                  ? 'bg-gradient-to-r from-accent-blue to-accent-cyan text-white' 
                  : 'bg-white bg-opacity-10 hover:bg-opacity-20'
              }`}
            >
              <Link className="w-5 h-5 inline mr-2" />
              YouTube URL
            </button>
            <button
              onClick={() => setInputType('file')}
              className={`flex-1 py-2 px-4 rounded-lg transition-all ${
                inputType === 'file' 
                  ? 'bg-gradient-to-r from-accent-blue to-accent-cyan text-white' 
                  : 'bg-white bg-opacity-10 hover:bg-opacity-20'
              }`}
            >
              <Upload className="w-5 h-5 inline mr-2" />
              Upload File
            </button>
          </div>

          {/* URL Input */}
          {inputType === 'url' && (
            <div className="space-y-4">
              <label className="block text-sm font-medium mb-2">
                🔗 YouTube URL:
              </label>
              <input
                type="url"
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg focus:outline-none focus:border-glow"
                placeholder="https://www.youtube.com/watch?v=..."
              />
              <div className="text-xs text-gray-400">
                Hỗ trợ: youtube.com, youtu.be links
              </div>
            </div>
          )}

          {/* File Upload */}
          {inputType === 'file' && (
            <div className="space-y-4">
              <label className="block text-sm font-medium mb-2">
                📁 Chọn file video:
              </label>
              
              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-all cursor-pointer ${
                  dragOver 
                    ? 'border-glow bg-glow bg-opacity-10' 
                    : 'border-white border-opacity-30 hover:border-glow hover:bg-white hover:bg-opacity-5'
                }`}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => document.getElementById('fileInput').click()}
              >
                <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                {selectedFile ? (
                  <div>
                    <div className="text-glow font-medium">{selectedFile.name}</div>
                    <div className="text-sm text-gray-400">
                      {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-gray-300 mb-2">
                      Kéo thả file vào đây hoặc click để chọn
                    </div>
                    <div className="text-xs text-gray-400">
                      Hỗ trợ: MP4, AVI, MOV
                    </div>
                  </div>
                )}
              </div>
              
              <input
                id="fileInput"
                type="file"
                accept="video/*"
                className="hidden"
                onChange={(e) => handleFileSelect(e.target.files[0])}
              />
            </div>
          )}

          {/* Submit Button */}
          <button
            onClick={handleSubmit}
            disabled={
              (inputType === 'url' && !youtubeUrl) || 
              (inputType === 'file' && !selectedFile)
            }
            className="w-full mt-6 glow-button flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Send className="w-5 h-5" />
            <span>Bắt Đầu Xử Lý</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default InputPanel
