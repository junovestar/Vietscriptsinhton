import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Link, Plus, Trash2, Play, Pause, CheckCircle, AlertCircle, Clock } from 'lucide-react'

const BatchProcessModal = ({ isOpen, onClose, onProcess }) => {
  const [videos, setVideos] = useState([])
  const [inputType, setInputType] = useState('url')
  const [currentInput, setCurrentInput] = useState('')

  const addVideo = () => {
    if (!currentInput.trim()) return
    
    const newVideo = {
      id: Date.now() + Math.random(),
      input: currentInput,
      type: inputType,
      status: 'pending', // pending, processing, completed, error
      result: null,
      error: null,
      title: inputType === 'url' ? extractVideoTitle(currentInput) : currentInput
    }
    
    setVideos(prev => [...prev, newVideo])
    setCurrentInput('')
  }

  const removeVideo = (id) => {
    setVideos(prev => prev.filter(v => v.id !== id))
  }

  const extractVideoTitle = (url) => {
    try {
      const urlMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
      if (urlMatch) {
        return `Video ${urlMatch[1].substring(0, 8)}...`
      }
    } catch (e) {
      return 'YouTube Video'
    }
    return 'YouTube Video'
  }

  const handleStartBatch = () => {
    console.log('🔍 handleStartBatch called:', { videosLength: videos.length, onProcess: typeof onProcess })
    if (videos.length === 0) {
      console.warn('⚠️ No videos to process')
      return
    }
    
    if (typeof onProcess !== 'function') {
      console.error('❌ onProcess is not a function:', onProcess)
      return
    }
    
    console.log('🚀 Starting batch process with videos:', videos)
    onProcess(videos)
    onClose()
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-gray-400" />
      case 'processing':
        return <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full" />
        </motion.div>
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-400" />
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400" />
      default:
        return null
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'border-gray-600'
      case 'processing':
        return 'border-blue-500 bg-blue-500 bg-opacity-10'
      case 'completed':
        return 'border-green-500 bg-green-500 bg-opacity-10'
      case 'error':
        return 'border-red-500 bg-red-500 bg-opacity-10'
      default:
        return 'border-gray-600'
    }
  }

  if (!isOpen) return null

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
        <div className="p-6 border-b border-white border-opacity-20">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-glow">📦 Xử Lý Hàng Loạt</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <p className="text-gray-300 mt-2">
            Thêm nhiều video để xử lý cùng lúc. Tiết kiệm thời gian và tối ưu hiệu suất.
          </p>
        </div>

        <div className="flex-1 p-6 overflow-y-auto">
          {/* Input Section */}
          <div className="mb-6">
            <div className="flex space-x-2 mb-4">
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

            <div className="flex space-x-2">
              <input
                type={inputType === 'url' ? 'url' : 'text'}
                value={currentInput}
                onChange={(e) => setCurrentInput(e.target.value)}
                className="flex-1 px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg focus:outline-none focus:border-glow"
                placeholder={inputType === 'url' ? 'https://youtube.com/watch?v=...' : 'Tên file video...'}
                onKeyPress={(e) => e.key === 'Enter' && addVideo()}
              />
              <button
                onClick={addVideo}
                disabled={!currentInput.trim()}
                className="px-6 py-3 bg-gradient-to-r from-accent-blue to-accent-cyan text-white rounded-lg hover:shadow-glow transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Video List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-white">
                Danh sách video ({videos.length})
              </h3>
              {videos.length > 0 && (
                <div className="text-sm text-gray-400">
                  {videos.filter(v => v.status === 'completed').length} hoàn thành • 
                  {videos.filter(v => v.status === 'processing').length} đang xử lý • 
                  {videos.filter(v => v.status === 'pending').length} chờ xử lý
                </div>
              )}
            </div>

            {videos.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <Upload className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Chưa có video nào được thêm</p>
                <p className="text-sm">Thêm video bằng cách nhập URL hoặc tên file ở trên</p>
              </div>
            ) : (
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {videos.map((video, index) => (
                  <motion.div
                    key={video.id}
                    className={`p-4 border rounded-lg transition-all ${getStatusColor(video.status)}`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3 flex-1">
                        <div className="flex-shrink-0">
                          {getStatusIcon(video.status)}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="text-white font-medium truncate">
                            {video.title}
                          </div>
                          <div className="text-xs text-gray-400 truncate">
                            {video.input}
                          </div>
                          {video.status === 'error' && video.error && (
                            <div className="text-xs text-red-400 mt-1">
                              ❌ {video.error}
                            </div>
                          )}
                          {video.status === 'completed' && video.result && (
                            <div className="text-xs text-green-400 mt-1">
                              ✅ {video.result.substring(0, 100)}...
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <button
                        onClick={() => removeVideo(video.id)}
                        disabled={video.status === 'processing'}
                        className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-6 border-t border-white border-opacity-20">
          <div className="flex space-x-4">
            <button
              onClick={handleStartBatch}
              disabled={videos.length === 0 || videos.some(v => v.status === 'processing')}
              className="glow-button flex-1 flex items-center justify-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="w-5 h-5" />
              <span>Bắt Đầu Xử Lý Hàng Loạt ({videos.length} video)</span>
            </button>
            
            <button
              onClick={onClose}
              className="glass-panel px-6 py-3 hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              Đóng
            </button>
          </div>
          
          {videos.length > 0 && (
            <div className="text-xs text-gray-400 mt-3 text-center">
              💡 Mẹo: Video sẽ được xử lý tuần tự để tránh quá tải API
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default BatchProcessModal
