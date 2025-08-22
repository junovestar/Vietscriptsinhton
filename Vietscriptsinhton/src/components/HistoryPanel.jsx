import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Search, Calendar, Clock, Copy, Eye, Trash2, Download, Filter } from 'lucide-react'

const HistoryPanel = ({ isOpen, onClose, history, onViewResult, onDeleteItem, onClearHistory }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState('date') // date, title, length
  const [filterBy, setFilterBy] = useState('all') // all, single, batch
  const [selectedItems, setSelectedItems] = useState([])

  if (!isOpen) return null

  // Filter and sort history
  const filteredHistory = history
    .filter(item => {
      const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          item.result?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesFilter = filterBy === 'all' || 
                          (filterBy === 'single' && item.type === 'single') ||
                          (filterBy === 'batch' && item.type === 'batch')
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

  const copyResult = async (result) => {
    try {
      await navigator.clipboard.writeText(result)
      // Could add toast notification
    } catch (err) {
      console.error('Failed to copy:', err)
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
              className="px-3 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg focus:outline-none focus:border-glow"
            >
              <option value="date">Mới nhất</option>
              <option value="title">Tên A-Z</option>
              <option value="length">Độ dài</option>
            </select>

            {/* Filter */}
            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value)}
              className="px-3 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg focus:outline-none focus:border-glow"
            >
              <option value="all">Tất cả</option>
              <option value="single">Đơn lẻ</option>
              <option value="batch">Hàng loạt</option>
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
                            </div>
                            
                            <div className="flex items-center space-x-4 text-xs text-gray-400 mb-2">
                              <div className="flex items-center space-x-1">
                                <Clock className="w-3 h-3" />
                                <span>{formatDate(item.timestamp)}</span>
                              </div>
                              <div>
                                {item.result?.length || 0} ký tự
                              </div>
                              {item.videoCount && (
                                <div>
                                  {item.videoCount} video
                                </div>
                              )}
                            </div>

                            {/* Preview */}
                            <div className="bg-black bg-opacity-30 p-3 rounded text-xs text-gray-300 mb-3">
                              {item.result?.substring(0, 150) || 'Không có nội dung'}
                              {item.result?.length > 150 && (
                                <span className="text-blue-400">... (xem thêm)</span>
                              )}
                            </div>
                          </div>

                          {/* Actions */}
                          <div className="flex space-x-2 ml-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onViewResult(item.result)
                              }}
                              className="p-2 hover:bg-white hover:bg-opacity-10 rounded transition-colors"
                              title="Xem chi tiết"
                            >
                              <Eye className="w-4 h-4 text-blue-400" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                copyResult(item.result)
                              }}
                              className="p-2 hover:bg-white hover:bg-opacity-10 rounded transition-colors"
                              title="Sao chép"
                            >
                              <Copy className="w-4 h-4 text-green-400" />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                if (window.confirm('Bạn có chắc muốn xóa mục này?')) {
                                  onDeleteItem(item.id)
                                }
                              }}
                              className="p-2 hover:bg-white hover:bg-opacity-10 rounded transition-colors"
                              title="Xóa"
                            >
                              <Trash2 className="w-4 h-4 text-red-400" />
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
