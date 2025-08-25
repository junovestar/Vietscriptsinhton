import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ChevronLeft, ChevronRight, Copy, Eye, Clock, FileText } from 'lucide-react'

const LiveResultsSidebar = ({ isOpen, partialResults, progress, onToggle }) => {
  const [copied, setCopied] = useState({})

  const copyToClipboard = async (text, section) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied(prev => ({ ...prev, [section]: true }))
      setTimeout(() => {
        setCopied(prev => ({ ...prev, [section]: false }))
      }, 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      // Fallback for older browsers
      const textArea = document.createElement('textarea')
      textArea.value = text
      document.body.appendChild(textArea)
      textArea.select()
      document.execCommand('copy')
      document.body.removeChild(textArea)
      
      setCopied(prev => ({ ...prev, [section]: true }))
      setTimeout(() => {
        setCopied(prev => ({ ...prev, [section]: false }))
      }, 2000)
    }
  }

  const formatResult = (result, maxLength = 300) => {
    if (!result) return 'Chưa có dữ liệu...'
    return result.length > maxLength ? result.substring(0, maxLength) + '...' : result
  }

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        onClick={onToggle}
        className="fixed right-4 top-1/2 transform -translate-y-1/2 z-50 glass-panel p-3 hover:bg-white hover:bg-opacity-10 transition-all"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        {isOpen ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
      </motion.button>

      {/* Sidebar */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="fixed right-0 top-0 h-full w-80 bg-black bg-opacity-80 backdrop-blur-md border-l border-white border-opacity-20 z-40 overflow-y-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            <div className="p-6">
              <div className="mb-6">
                <h3 className="text-xl font-bold text-glow mb-2">🔴 Live Results</h3>
                <p className="text-sm text-gray-400">Kết quả thời gian thực</p>
              </div>

              <div className="space-y-4">
                {/* Duration via Gemini 1.5 Flash */}
                <motion.div
                  className="glass-panel p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className="flex items-center space-x-2 mb-2">
                    <Clock className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-medium text-green-400">Gemini 1.5 Flash</span>
                  </div>
                  <div className="text-white text-xs">
                    {partialResults?.duration || (progress?.currentStep >= 1 ? 'Đang lấy duration...' : 'Chờ xử lý...')}
                  </div>
                  {partialResults?.duration && (
                    <div className="text-xs text-green-400 mt-1">
                      ⚡ gemini-1.5-flash success
                    </div>
                  )}
                </motion.div>

                {/* Segments via Gemini */}
                <motion.div
                  className="glass-panel p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-blue-400 rounded-full" />
                      <span className="text-sm font-medium text-blue-400">Gemini 1.5 Flash</span>
                    </div>
                    {partialResults?.segments && partialResults.segments.length > 0 && (
                      <button
                        onClick={() => copyToClipboard(partialResults.segments.map(s => `${s.start} - ${s.end}`).join('\n'), 'segments')}
                        className="p-1 hover:bg-white hover:bg-opacity-10 rounded transition-colors"
                        title="Copy segments"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {partialResults?.segments ? (
                    <div>
                      <div className="text-white mb-2">
                        {partialResults.segments.length} đoạn được tạo
                      </div>
                      <div className="max-h-20 overflow-y-auto text-xs space-y-1">
                        {partialResults.segments.slice(0, 3).map((segment, i) => (
                          <div key={i} className="text-gray-300">
                            {segment.start} - {segment.end}
                          </div>
                        ))}
                        {partialResults.segments.length > 3 && (
                          <div className="text-gray-400">
                            +{partialResults.segments.length - 3} đoạn khác
                          </div>
                        )}
                      </div>
                      <div className="text-xs text-green-400 mt-1">
                        ⚡ gemini-1.5-flash success
                      </div>
                      {copied.segments && (
                        <motion.div
                          className="text-xs text-green-300 mt-1"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          ✅ Đã sao chép segments!
                        </motion.div>
                      )}
                    </div>
                  ) : progress?.currentStep >= 2 ? (
                    <div className="text-gray-400">Đang chia đoạn...</div>
                  ) : (
                    <div className="text-gray-400">Chờ xử lý...</div>
                  )}
                </motion.div>

                {/* Transcripts */}
                <motion.div
                  className="glass-panel p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4 text-purple-400" />
                      <span className="text-sm font-medium text-purple-400">Transcripts</span>
                    </div>
                    {partialResults?.transcripts && partialResults.transcripts.length > 0 && (
                      <button
                        onClick={() => copyToClipboard(partialResults.transcripts.join('\n\n---\n\n'), 'transcripts')}
                        className="p-1 hover:bg-white hover:bg-opacity-10 rounded transition-colors"
                        title="Copy all transcripts"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {partialResults?.transcripts && partialResults.transcripts.length > 0 ? (
                    <div>
                      <div className="text-white mb-2">
                        {partialResults.transcripts.length} đoạn hoàn thành
                      </div>
                      <div className="bg-black bg-opacity-30 p-2 rounded text-xs text-gray-300 max-h-24 overflow-y-auto">
                        {formatResult(partialResults.transcripts[partialResults.transcripts.length - 1], 150)}
                      </div>
                      {progress?.currentSegment && progress?.totalSegments && (
                        <div className="text-xs text-purple-300 mt-1">
                          📊 {progress.currentSegment}/{progress.totalSegments} segments
                        </div>
                      )}
                      {copied.transcripts && (
                        <motion.div
                          className="text-xs text-green-300 mt-1"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          ✅ Đã sao chép transcripts!
                        </motion.div>
                      )}
                    </div>
                  ) : progress?.currentStep >= 3 ? (
                    <div className="text-gray-400">Đang xử lý segments...</div>
                  ) : (
                    <div className="text-gray-400">Chờ xử lý...</div>
                  )}
                </motion.div>

                {/* Aggregated */}
                <motion.div
                  className="glass-panel p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-yellow-400 rounded-full" />
                      <span className="text-sm font-medium text-yellow-400">Tổng hợp</span>
                    </div>
                    {partialResults?.aggregated && (
                      <button
                        onClick={() => copyToClipboard(partialResults.aggregated, 'aggregated')}
                        className="p-1 hover:bg-white hover:bg-opacity-10 rounded transition-colors"
                        title="Copy aggregated transcript"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  {partialResults?.aggregated ? (
                    <div>
                      <div className="text-white mb-2">
                        {partialResults.aggregated.length} ký tự
                      </div>
                      <div className="bg-black bg-opacity-30 p-2 rounded text-xs text-gray-300 max-h-20 overflow-y-auto">
                        {formatResult(partialResults.aggregated, 100)}
                      </div>
                      <div className="text-xs text-green-400 mt-1">
                        ✅ Đã tổng hợp
                      </div>
                      {copied.aggregated && (
                        <motion.div
                          className="text-xs text-green-300 mt-1"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          ✅ Đã sao chép transcript!
                        </motion.div>
                      )}
                    </div>
                  ) : progress?.currentStep >= 4 ? (
                    <div className="text-gray-400">Đang tổng hợp...</div>
                  ) : (
                    <div className="text-gray-400">Chờ tổng hợp...</div>
                  )}
                </motion.div>

                {/* Final Result */}
                <motion.div
                  className="glass-panel p-4"
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="w-4 h-4 bg-green-400 rounded-full animate-pulse" />
                      <span className="text-sm font-medium text-green-400">Kết quả cuối</span>
                    </div>
                    {partialResults?.finalResult && (
                      <div className="flex space-x-1">
                        <button
                          onClick={() => copyToClipboard(partialResults.finalResult, 'finalResult')}
                          className="p-1 hover:bg-white hover:bg-opacity-10 rounded transition-colors"
                          title="Copy final result"
                        >
                          <Copy className="w-3 h-3" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  {partialResults?.finalResult ? (
                    <div>
                      <div className="text-white mb-2">
                        🎉 {partialResults.finalResult.length} ký tự
                      </div>
                      <div className="bg-black bg-opacity-30 p-2 rounded text-xs text-gray-300 max-h-32 overflow-y-auto">
                        {formatResult(partialResults.finalResult, 200)}
                      </div>
                      <div className="text-xs text-green-400 mt-1">
                        ✨ Hoàn thành! Click Copy để sao chép
                      </div>
                      
                      {copied.finalResult && (
                        <motion.div
                          className="text-xs text-green-300 mt-1"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          ✅ Đã sao chép!
                        </motion.div>
                      )}
                    </div>
                  ) : progress?.currentStep === 5 ? (
                    <div className="text-gray-400">Đang tạo bình luận...</div>
                  ) : (
                    <div className="text-gray-400">Chờ xử lý...</div>
                  )}
                </motion.div>
              </div>

              {/* Progress Summary */}
              <div className="mt-6 glass-panel p-4">
                <h4 className="text-sm font-medium text-white mb-2">Tóm tắt tiến độ</h4>
                <div className="text-xs space-y-1">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Thời gian:</span>
                    <span className="text-white">{progress?.elapsedTime || '0:00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Bước hiện tại:</span>
                    <span className="text-white">{progress?.currentStep || 1}/5</span>
                  </div>
                  {progress?.totalSegments > 0 && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Segments:</span>
                      <span className="text-white">{progress?.currentSegment || 0}/{progress?.totalSegments}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}

export default LiveResultsSidebar
