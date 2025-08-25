import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Search, Calendar, Clock, Copy, Eye, Trash2, Download, Filter, Check } from 'lucide-react'

const HistoryPanel = ({ isOpen, onClose, history, onViewResult, onDeleteItem, onClearHistory }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date') // date, title, length
  const [filterBy, setFilterBy] = useState('all') // all, single, batch, success, error, partial
  const [selectedItems, setSelectedItems] = useState([])
  const [copiedItems, setCopiedItems] = useState(new Set())

  if (!isOpen) return null

  // Filter and sort history
  const filteredHistory = history
    .filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.result?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filterBy === 'all' || 
                          (filterBy === 'single' && item.type === 'single') ||
                          (filterBy === 'batch' && item.type === 'batch') ||
                          (filterBy === 'success' && item.status === 'completed') ||
                          (filterBy === 'error' && item.status === 'error') ||
                          (filterBy === 'partial' && (item.status === 'partial' || item.status === 'transcript_only_error')) ||
                          (filterBy === 'transcript' && (item.status === 'transcript_only' || item.status === 'transcript_only_error'))
      return matchesSearch && matchesFilter
    })
    .sort((a, b) => {
      switch (sortBy) {
        case 'date':
          return new Date(b.timestamp) - new Date(a.timestamp)
        case 'title':
          return a.title.localeCompare(b.title)
        case 'length':
          return (b.result?.length || 0) - (a.result?.length || 0)
        default:
          return 0
      }
    })

  const handleSelectItem = (id) => {
    setSelectedItems(prev => 
      prev.includes(id) 
        ? prev.filter(item => item !== id)
        : [...prev, id]
    )
  }

  const handleSelectAll = () => {
    if (selectedItems.length === filteredHistory.length) {
      setSelectedItems([])
    } else {
      setSelectedItems(filteredHistory.map(item => item.id))
    }
  }

  const handleDeleteSelected = () => {
    if (window.confirm(`Bạn có chắc muốn xóa ${selectedItems.length} mục đã chọn?`)) {
      selectedItems.forEach(id => onDeleteItem(id))
      setSelectedItems([])
    }
  }

  const exportHistory = () => {
    const dataStr = JSON.stringify(filteredHistory, null, 2)
    const dataBlob = new Blob([dataStr], { type: 'application/json' })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement('a')
    link.href = url
    link.download = `binh-luan-history-${new Date().toISOString().split('T')[0]}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  const copyResult = async (result, itemId) => {
    try {
      await navigator.clipboard.writeText(result)
      // Add visual feedback
      setCopiedItems(prev => new Set([...prev, itemId]))
      setTimeout(() => {
        setCopiedItems(prev => {
          const newSet = new Set(prev)
          newSet.delete(itemId)
          return newSet
        })
      }, 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
      alert('Không thể sao chép. Vui lòng thử lại.')
    }
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp)
    const now = new Date()
    const diffTime = Math.abs(now - date)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))

    if (diffDays === 0) {
      return `Hôm nay ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
    } else if (diffDays === 1) {
      return `Hôm qua ${date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
    } else if (diffDays < 7) {
      return `${diffDays} ngày trước`
    } else {
      return date.toLocaleDateString('vi-VN')
    }
  }

  const getTypeIcon = (type) => {
    return type === 'batch' ? '📦' : '📄'
  }

  const getTypeColor = (type) => {
    return type === 'batch' ? 'text-blue-400' : 'text-green-400'
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'error':
        return '❌'
      case 'partial':
        return '⚠️'
      case 'transcript_only':
        return '📝'
      case 'transcript_only_error':
        return '📝⚠️'
      case 'completed':
        return '✅'
      default:
        return '✅'
    }
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'error':
        return 'text-red-400 bg-red-500'
      case 'partial':
        return 'text-yellow-400 bg-yellow-500'
      case 'transcript_only':
        return 'text-blue-400 bg-blue-500'
      case 'transcript_only_error':
        return 'text-orange-400 bg-orange-500'
      case 'completed':
        return 'text-green-400 bg-green-500'
      default:
        return 'text-green-400 bg-green-500'
    }
  }

  const getStatusText = (status, errorCount) => {
    switch (status) {
      case 'error':
        return 'Lỗi'
      case 'partial':
        return `${errorCount} lỗi`
      case 'transcript_only':
        return 'Transcript'
      case 'transcript_only_error':
        return 'Transcript (lỗi script)'
      case 'completed':
        return 'Hoàn thành'
      default:
        return 'Thành công'
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
        className="glass-panel w-full max-w-6xl max-h-[90vh] flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="p-6 border-b border-white border-opacity-20">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-glow">📚 Lịch Sử Xử Lý</h2>
              <p className="text-gray-300 mt-1">
                {history.length} video đã xử lý • {filteredHistory.length} hiển thị
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Controls */}
          <div className="mt-4 flex flex-wrap gap-4 items-center">
            {/* Search */}
            <div className="flex-1 min-w-64">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg focus:outline-none focus:border-glow"
                  placeholder="Tìm kiếm theo tiêu đề hoặc nội dung..."
                />
              </div>
            </div>

            {/* Sort */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-glow text-white"
              style={{ backgroundColor: '#1f2937', color: 'white' }}
            >
              <option value="date" className="text-gray-800 bg-gray-800">Mới nhất</option>
              <option value="title" className="text-gray-800 bg-gray-800">Tên A-Z</option>
              <option value="length" className="text-gray-800 bg-gray-800">Độ dài</option>
            </select>

            {/* Filter */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg focus:outline-none focus:border-glow text-white"
              style={{ backgroundColor: '#1f2937', color: 'white' }}
            >
              <option value="all" className="text-gray-800 bg-gray-800">Tất cả</option>
              <option value="single" className="text-gray-800 bg-gray-800">Đơn lẻ</option>
              <option value="batch" className="text-gray-800 bg-gray-800">Hàng loạt</option>
              <option value="success" className="text-gray-800 bg-gray-800">Thành công</option>
              <option value="error" className="text-gray-800 bg-gray-800">Lỗi</option>
              <option value="partial" className="text-gray-800 bg-gray-800">Một phần lỗi</option>
              <option value="transcript" className="text-gray-800 bg-gray-800">Transcript</option>
            </select>

            {/* Actions */}
            <div className="flex space-x-2">
              <button
                onClick={exportHistory}
                className="px-3 py-2 bg-blue-600 bg-opacity-20 border border-blue-500 rounded-lg hover:bg-opacity-30 transition-colors flex items-center space-x-1"
                title="Xuất dữ liệu"
              >
                <Download className="w-4 h-4" />
                <span className="hidden sm:inline">Xuất</span>
              </button>
              
              <button
                onClick={() => {
                  if (window.confirm('Bạn có chắc muốn xóa toàn bộ lịch sử?')) {
                    onClearHistory()
                  }
                }}
                className="px-3 py-2 bg-red-600 bg-opacity-20 border border-red-500 rounded-lg hover:bg-opacity-30 transition-colors flex items-center space-x-1"
                title="Xóa tất cả"
              >
                <Trash2 className="w-4 h-4" />
                <span className="hidden sm:inline">Xóa tất cả</span>
              </button>
            </div>
          </div>

          {/* Bulk Actions */}
          {selectedItems.length > 0 && (
            <div className="mt-3 flex items-center space-x-4 p-3 bg-blue-500 bg-opacity-20 rounded-lg">
              <span className="text-sm text-blue-300">
                {selectedItems.length} mục đã chọn
              </span>
              <button
                onClick={handleDeleteSelected}
                className="px-3 py-1 bg-red-600 bg-opacity-20 border border-red-500 rounded hover:bg-opacity-30 transition-colors text-sm"
              >
                Xóa đã chọn
              </button>
              <button
                onClick={() => setSelectedItems([])}
                className="px-3 py-1 bg-gray-600 bg-opacity-20 border border-gray-500 rounded hover:bg-opacity-30 transition-colors text-sm"
              >
                Bỏ chọn
              </button>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          {filteredHistory.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Calendar className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg mb-2">
                {searchTerm ? 'Không tìm thấy kết quả' : 'Chưa có lịch sử xử lý'}
              </p>
              <p className="text-sm">
                {searchTerm ? 'Thử thay đổi từ khóa tìm kiếm' : 'Xử lý video đầu tiên để xem lịch sử'}
              </p>
            </div>
          ) : (
            <div className="p-6">
              {/* Select All */}
              <div className="mb-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedItems.length === filteredHistory.length}
                    onChange={handleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <span className="text-sm text-gray-400">
                    Chọn tất cả ({filteredHistory.length})
                  </span>
                </label>
              </div>

              {/* History Items */}
              <div className="space-y-3">
                {filteredHistory.map((item, index) => (
                  <motion.div
                    key={item.id}
                    className={`p-4 border rounded-lg transition-all cursor-pointer hover:bg-white hover:bg-opacity-5 ${
                      selectedItems.includes(item.id)
                        ? 'border-blue-500 bg-blue-500 bg-opacity-10'
                        : 'border-white border-opacity-20'
                    }`}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    onClick={() => handleSelectItem(item.id)}
                  >
                    <div className="flex items-start space-x-4">
                      {/* Checkbox */}
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.id)}
                        onChange={() => handleSelectItem(item.id)}
                        className="mt-1 w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                        onClick={(e) => e.stopPropagation()}
                      />

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-1">
                              <span className="text-lg">{getTypeIcon(item.type)}</span>
                              <h3 className="text-white font-medium truncate">
                                {item.title}
                              </h3>
                              <span className={`text-xs px-2 py-1 rounded ${getTypeColor(item.type)} bg-opacity-20`}>
                                {item.type === 'batch' ? 'Hàng loạt' : 'Đơn lẻ'}
                              </span>
                              {item.status && (
                                <span className={`text-xs px-2 py-1 rounded ${getStatusColor(item.status)} bg-opacity-20 flex items-center space-x-1`}>
                                  <span>{getStatusIcon(item.status)}</span>
                                  <span>{getStatusText(item.status, item.errorCount)}</span>
                                </span>
                              )}
                            </div>
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-400 mb-2">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatDate(item.timestamp)}</span>
                              </div>
                              <div className="flex items-center space-x-1">
                                <span>🎭</span>
                                <span>{item.result?.length || 0} ký tự</span>
                              </div>
                              {item.transcript && (
                                <div className="flex items-center space-x-1">
                                  <span>📝</span>
                                  <span>{item.transcript.length} ký tự transcript</span>
                                </div>
                              )}
                              {item.videoCount && (
                                <div>
                                  {item.videoCount} video
                                </div>
                              )}
                            </div>

                            {/* Preview */}
                            <div className="bg-black bg-opacity-30 p-3 rounded text-xs text-gray-300 mb-3">
                              <div className="flex items-center space-x-2 mb-2">
                                <span className="text-gray-400">🎭</span>
                                <span className="font-medium">Kết quả cuối:</span>
                                <span className="text-gray-400">{item.result?.length || 0} ký tự</span>
                              </div>
                              <div>
                                {item.result?.substring(0, 150) || 'Không có nội dung'}
                                {item.result?.length > 150 && (
                                  <span className="text-blue-400">... (xem thêm)</span>
                                )}
                              </div>
                            </div>
                            
                            {/* Transcript Preview */}
                            {item.transcript && (
                              <div className="bg-blue-900 bg-opacity-20 p-3 rounded text-xs text-blue-300 mb-3 border border-blue-500 border-opacity-30">
                                <div className="flex items-center justify-between mb-2">
                                  <div className="flex items-center space-x-2">
                                    <span className="text-blue-400">📝</span>
                                    <span className="font-medium">Transcript tổng hợp (bước 4):</span>
                                    <span className="text-blue-400">{item.transcript.length} ký tự</span>
                                  </div>
                                  <div className="flex items-center space-x-1 text-xs">
                                    <span className="text-blue-300">Click</span>
                                    <FileText className="w-3 h-3 text-blue-400" />
                                    <span className="text-blue-300">để xem,</span>
                                    <Copy className="w-3 h-3 text-blue-400" />
                                    <span className="text-blue-300">để copy</span>
                                  </div>
                                </div>
                                <div className="text-blue-200">
                                  {item.transcript.substring(0, 120)}...
                                  <span className="text-blue-400"> (xem transcript đầy đủ)</span>
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Actions */}
                          <div className="flex space-x-2 ml-4">
                            {/* View Both Button - Show if both result and transcript exist */}
                            {item.result && item.transcript && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  const combinedContent = `=== KẾT QUẢ CUỐI ===\n${item.result}\n\n=== TRANSCRIPT TỔNG HỢP (BƯỚC 4) ===\n${item.transcript}`
                                  onViewResult(combinedContent, 'combined')
                                }}
                                className="p-2 hover:bg-white hover:bg-opacity-10 rounded transition-colors group"
                                title="Xem cả kết quả và transcript"
                              >
                                <div className="w-4 h-4 text-purple-400 group-hover:text-purple-300 text-lg">📋</div>
                              </button>
                            )}
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (item.result) {
                                  onViewResult(item.result)
                                  onClose() // Close history panel when viewing result
                                }
                              }}
                              className="p-2 hover:bg-white hover:bg-opacity-10 rounded transition-colors group"
                              title="Xem chi tiết"
                              disabled={!item.result}
                            >
                              <Eye className={`w-4 h-4 ${item.result ? 'text-blue-400 group-hover:text-blue-300' : 'text-gray-500'}`} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (item.result) {
                                  copyResult(item.result, item.id)
                                }
                              }}
                              className="p-2 hover:bg-white hover:bg-opacity-10 rounded transition-colors group relative"
                              title={copiedItems.has(item.id) ? "Đã sao chép!" : "Sao chép"}
                              disabled={!item.result}
                            >
                              {copiedItems.has(item.id) ? (
                                <Check className="w-4 h-4 text-green-400" />
                              ) : (
                                <Copy className={`w-4 h-4 ${item.result ? 'text-green-400 group-hover:text-green-300' : 'text-gray-500'}`} />
                              )}
                              {copiedItems.has(item.id) && (
                                <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                  Đã sao chép!
                                </div>
                              )}
                            </button>
                            
                            {/* View Transcript Button */}
                            {item.transcript && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  onViewResult(item.transcript, 'transcript')
                                }}
                                className="p-2 hover:bg-white hover:bg-opacity-10 rounded transition-colors group"
                                title="Xem transcript tổng hợp"
                              >
                                <FileText className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                              </button>
                            )}
                            
                            {/* Copy Transcript Button */}
                            {item.transcript && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  copyResult(item.transcript, `transcript-${item.id}`)
                                }}
                                className="p-2 hover:bg-white hover:bg-opacity-10 rounded transition-colors group relative"
                                title={copiedItems.has(`transcript-${item.id}`) ? "Đã sao chép transcript!" : "Sao chép transcript"}
                              >
                                {copiedItems.has(`transcript-${item.id}`) ? (
                                  <Check className="w-4 h-4 text-green-400" />
                                ) : (
                                  <Copy className="w-4 h-4 text-blue-400 group-hover:text-blue-300" />
                                )}
                                {copiedItems.has(`transcript-${item.id}`) && (
                                  <div className="absolute -top-8 left-1/2 transform -translate-x-1/2 bg-green-600 text-white text-xs px-2 py-1 rounded whitespace-nowrap">
                                    Đã sao chép transcript!
                                  </div>
                                )}
                              </button>
                            )}

                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (window.confirm('Bạn có chắc muốn xóa mục này?')) {
                                  onDeleteItem(item.id)
                                }
                              }}
                              className="p-2 hover:bg-white hover:bg-opacity-10 rounded transition-colors group"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4 text-red-400 group-hover:text-red-300" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

export default HistoryPanel
