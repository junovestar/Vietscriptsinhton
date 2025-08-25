import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Copy, FileText, Check, MessageSquare, Send, Loader2, Edit3, Save, RotateCcw } from 'lucide-react'

const ResultPanel = ({ result, onClose, onResultUpdate, type = 'result' }) => {
  const [copied, setCopied] = useState(false)
  const [showChat, setShowChat] = useState(false)
  const [showEditor, setShowEditor] = useState(false)
  const [chatMessage, setChatMessage] = useState('')
  const [isChatting, setIsChatting] = useState(false)
  const [chatHistory, setChatHistory] = useState([])
  const [editedResult, setEditedResult] = useState(result)
  const [isEditing, setIsEditing] = useState(false)

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

  const handleEdit = () => {
    setShowEditor(true)
    setEditedResult(result)
    
    // If chat is active, turn it off when switching to edit mode
    if (showChat) {
      setShowChat(false)
    }
  }

  const handleSaveEdit = () => {
    if (editedResult.trim() !== result) {
      if (onResultUpdate) {
        onResultUpdate(editedResult)
      }
      setResult(editedResult)
    }
    setShowEditor(false)
    setIsEditing(false)
  }

  const handleCancelEdit = () => {
    setEditedResult(result)
    setShowEditor(false)
    setIsEditing(false)
  }

  const handleTextChange = (e) => {
    setEditedResult(e.target.value)
    setIsEditing(true)
  }

  const handleFormatText = () => {
    // Auto format text - remove extra spaces, fix line breaks
    const formatted = editedResult
      .replace(/\n\s*\n\s*\n/g, '\n\n') // Remove multiple empty lines
      .replace(/\s+/g, ' ') // Remove extra spaces
      .replace(/\n\s+/g, '\n') // Remove leading spaces after line breaks
      .trim()
    
    setEditedResult(formatted)
    setIsEditing(true)
  }

  const handleUndo = () => {
    setEditedResult(result)
    setIsEditing(false)
  }

  const handleFindReplace = () => {
    const findText = prompt('Nhập từ cần tìm:')
    if (findText) {
      const replaceText = prompt('Nhập từ thay thế:')
      if (replaceText !== null) {
        const newText = editedResult.replace(new RegExp(findText, 'g'), replaceText)
        setEditedResult(newText)
        setIsEditing(true)
      }
    }
  }

  const handleWordCount = () => {
    const words = editedResult.trim().split(/\s+/).length
    const chars = editedResult.length
    const lines = editedResult.split('\n').length
    alert(`📊 Thống kê:\n• Từ: ${words}\n• Ký tự: ${chars}\n• Dòng: ${lines}`)
  }

  const handleChat = async () => {
    if (!chatMessage.trim() || isChatting) return

    const userMessage = chatMessage.trim()
    setChatMessage('')
    setIsChatting(true)

    // Auto-save if there are unsaved changes in editor
    if (showEditor && isEditing) {
      handleSaveEdit()
    }

    // Add user message to chat history
    const newChatHistory = [...chatHistory, { role: 'user', content: userMessage }]
    setChatHistory(newChatHistory)

    try {
      // Use current edited result if in editor mode, otherwise use original result
      const currentResult = showEditor ? editedResult : result
      
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage,
          originalResult: currentResult,
          chatHistory: newChatHistory
        })
      })

      const data = await response.json()

      if (data.success) {
        // Add AI response to chat history
        setChatHistory(prev => [...prev, { role: 'assistant', content: data.response }])
        
        // Update the result if AI provided a new version
        if (data.updatedResult && onResultUpdate) {
          onResultUpdate(data.updatedResult)
          // Also update the edited result for continuous editing
          setEditedResult(data.updatedResult)
          setIsEditing(false) // Reset editing state since it's a new version
          
          // Show success message
          console.log('✅ Kết quả đã được cập nhật bởi AI')
          
          // Add a success indicator to the chat message
          setChatHistory(prev => {
            const newHistory = [...prev]
            if (newHistory.length > 0) {
              newHistory[newHistory.length - 1] = {
                ...newHistory[newHistory.length - 1],
                content: newHistory[newHistory.length - 1].content + '\n\n✨ **Kết quả đã được cập nhật!**'
              }
            }
            return newHistory
          })
        }
      } else {
        throw new Error(data.error || 'Có lỗi xảy ra')
      }
    } catch (error) {
      console.error('Chat error:', error)
      setChatHistory(prev => [...prev, { 
        role: 'assistant', 
        content: `❌ Lỗi: ${error.message}` 
      }])
    } finally {
      setIsChatting(false)
    }
  }

  const quickActions = [
    { text: "Làm cho bình luận hài hước hơn", emoji: "😄", color: "blue" },
    { text: "Rút ngắn xuống 2000 từ", emoji: "📝", color: "green" },
    { text: "Thay đổi phong cách viết", emoji: "✨", color: "purple" },
    { text: "Thêm chi tiết mô tả cảnh vật", emoji: "🌲", color: "emerald" },
    { text: "Làm cho câu chuyện kịch tính hơn", emoji: "🔥", color: "red" },
    { text: "Thêm yếu tố hài hước", emoji: "🤣", color: "yellow" },
    { text: "Viết lại theo phong cách khác", emoji: "🔄", color: "indigo" },
    { text: "Tăng độ dài lên 6000 từ", emoji: "📈", color: "pink" },
    { text: "Thêm cảm xúc và suy nghĩ", emoji: "💭", color: "cyan" },
    { text: "Làm cho nhân vật nổi bật hơn", emoji: "👤", color: "orange" }
  ]

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="glass-panel w-full max-w-6xl max-h-[90vh] flex flex-col"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        style={{ minHeight: '600px' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white border-opacity-20">
          <div className="flex items-center space-x-2">
            <FileText className="w-6 h-6 text-glow" />
            <h2 className="text-2xl font-bold text-glow">
              {type === 'transcript' ? '📝 Transcript Tổng Hợp' : '📄 Kết Quả Bình Luận'}
            </h2>
          </div>
          <div className="flex items-center space-x-2">
            {type !== 'transcript' && (
              <button
                onClick={handleEdit}
                className={`p-2 rounded-lg transition-colors flex items-center space-x-2 ${
                  showEditor ? 'bg-blue-600 bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
                }`}
                title="Chỉnh sửa trực tiếp"
              >
                <Edit3 className="w-5 h-5" />
                <span className="text-sm">Chỉnh Sửa</span>
              </button>
            )}
            {type !== 'transcript' && (
              <button
                onClick={() => {
                  const newShowChat = !showChat
                  setShowChat(newShowChat)
                  
                  // When turning off chat, ask if user wants to keep editor mode
                  if (!newShowChat && showEditor && isEditing) {
                    const keepEditor = confirm('Bạn có muốn giữ chế độ chỉnh sửa không?')
                    if (!keepEditor) {
                      setShowEditor(false)
                      setIsEditing(false)
                    }
                  }
                }}
                className={`p-2 rounded-lg transition-colors flex items-center space-x-2 ${
                  showChat ? 'bg-blue-600 bg-opacity-20' : 'hover:bg-white hover:bg-opacity-10'
                }`}
              >
                <MessageSquare className="w-5 h-5" />
                <span className="text-sm">Chat AI</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-hidden">
          <div className="h-full flex gap-6" style={{ minHeight: '400px' }}>
            {/* Result Panel */}
            <div className={`flex flex-col ${showChat ? 'w-1/2' : 'w-full'} transition-all duration-300 min-h-0`}>
              {/* Stats Bar - Always show */}
              <div className="flex items-center justify-between mb-4 text-sm text-gray-400 flex-shrink-0">
                                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <FileText className="w-4 h-4" />
                      <span>{(showEditor ? editedResult : result).length} ký tự</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>📊</span>
                      <span>{(showEditor ? editedResult : result).split(' ').length} từ</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span>📝</span>
                      <span>
                        {showEditor ? 'Edit Mode' : 'Plain Text'}
                        {showChat && ' + Chat AI'}
                      </span>
                    </div>
                  </div>
                {chatHistory.length > 0 && (
                  <div className="flex items-center space-x-2 text-blue-400">
                    <span>💬</span>
                    <span>{chatHistory.length} chỉnh sửa</span>
                    {showEditor && isEditing && (
                      <span className="text-yellow-400">⚠️ Có thay đổi chưa lưu</span>
                    )}
                  </div>
                )}
              </div>


              {/* Result Text Area */}
              <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
                <div className="text-xs text-gray-400 mb-2 flex items-center justify-between flex-shrink-0">
                  <span>📄 Nội dung bình luận</span>
                  {showEditor ? (
                    <div className="flex items-center space-x-2">
                      {isEditing && (
                        <span className="text-yellow-400">⚠️ Có thay đổi chưa lưu</span>
                      )}
                      <span className="text-blue-400">✏️ Chế độ chỉnh sửa</span>
                    </div>
                  ) : (
                    <span className="text-blue-400">↓ Kéo xuống để xem thêm</span>
                  )}
                </div>
                
                {showEditor ? (
                  <div className="flex-1 flex flex-col" style={{ minHeight: 0 }}>
                    <div 
                      className="flex-1 bg-black bg-opacity-30 border border-white border-opacity-20 rounded-lg p-4 overflow-y-auto custom-scrollbar"
                      style={{
                        scrollbarWidth: 'thin',
                        scrollbarColor: '#4B5563 #1F2937',
                        minHeight: 0
                      }}
                    >
                      <textarea
                        value={editedResult}
                        onChange={handleTextChange}
                        onKeyDown={(e) => {
                          // Ctrl+S to save
                          if (e.ctrlKey && e.key === 's') {
                            e.preventDefault()
                            handleSaveEdit()
                          }
                          // Ctrl+Z to undo
                          if (e.ctrlKey && e.key === 'z') {
                            e.preventDefault()
                            handleUndo()
                          }
                          // Ctrl+F to format
                          if (e.ctrlKey && e.key === 'f') {
                            e.preventDefault()
                            handleFormatText()
                          }
                          // Escape to cancel
                          if (e.key === 'Escape') {
                            handleCancelEdit()
                          }
                        }}
                        className="w-full h-full bg-transparent border-none outline-none resize-none text-sm leading-relaxed text-gray-100 font-mono"
                        placeholder="Nhập nội dung bình luận... (Ctrl+S: Lưu, Ctrl+Z: Hoàn tác, Ctrl+F: Format, Esc: Hủy)"
                        style={{ minHeight: '100%' }}
                      />
                    </div>
                    
                    {/* Editor Actions */}
                    <div className="flex items-center justify-between mt-3">
                      <div className="text-xs text-gray-400">
                        {editedResult.length} ký tự • {editedResult.split(' ').length} từ
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={handleUndo}
                          className="px-3 py-1 bg-gray-600 bg-opacity-20 border border-gray-500 rounded text-xs hover:bg-opacity-30 transition-colors flex items-center space-x-1"
                          title="Hoàn tác về phiên bản gốc"
                        >
                          <RotateCcw className="w-3 h-3" />
                          <span>Hoàn tác</span>
                        </button>
                        <button
                          onClick={handleFormatText}
                          className="px-3 py-1 bg-blue-600 bg-opacity-20 border border-blue-500 rounded text-xs hover:bg-opacity-30 transition-colors flex items-center space-x-1"
                          title="Tự động format văn bản"
                        >
                          <span>✨</span>
                          <span>Format</span>
                        </button>
                        <button
                          onClick={handleFindReplace}
                          className="px-3 py-1 bg-purple-600 bg-opacity-20 border border-purple-500 rounded text-xs hover:bg-opacity-30 transition-colors flex items-center space-x-1"
                          title="Tìm và thay thế"
                        >
                          <span>🔍</span>
                          <span>Tìm/Thay</span>
                        </button>
                        <button
                          onClick={handleWordCount}
                          className="px-3 py-1 bg-cyan-600 bg-opacity-20 border border-cyan-500 rounded text-xs hover:bg-opacity-30 transition-colors flex items-center space-x-1"
                          title="Thống kê chi tiết"
                        >
                          <span>📊</span>
                          <span>Thống kê</span>
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="px-3 py-1 bg-red-600 bg-opacity-20 border border-red-500 rounded text-xs hover:bg-opacity-30 transition-colors flex items-center space-x-1"
                        >
                          <X className="w-3 h-3" />
                          <span>Hủy</span>
                        </button>
                        <button
                          onClick={handleSaveEdit}
                          disabled={!isEditing}
                          className="px-3 py-1 bg-green-600 bg-opacity-20 border border-green-500 rounded text-xs hover:bg-opacity-30 transition-colors disabled:opacity-50 flex items-center space-x-1"
                        >
                          <Save className="w-3 h-3" />
                          <span>Lưu</span>
                        </button>
                        {isEditing && (
                          <button
                            onClick={() => {
                              handleSaveEdit()
                              // Auto-switch to chat mode after saving
                              if (!showChat) {
                                setShowChat(true)
                              }
                            }}
                            className="px-3 py-1 bg-blue-600 bg-opacity-20 border border-blue-500 rounded text-xs hover:bg-opacity-30 transition-colors flex items-center space-x-1"
                            title="Lưu và chuyển sang chat"
                          >
                            <span>💬</span>
                            <span>Lưu & Chat</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div 
                    className="flex-1 bg-black bg-opacity-30 border border-white border-opacity-20 rounded-lg p-4 overflow-y-auto custom-scrollbar"
                    style={{
                      scrollbarWidth: 'thin',
                      scrollbarColor: '#4B5563 #1F2937',
                      minHeight: 0
                    }}
                  >
                    <pre className="whitespace-pre-wrap text-sm leading-relaxed text-gray-100 font-mono">
                      {result}
                    </pre>
                  </div>
                )}
              </div>
            </div>

            {/* Chat Panel */}
            {showChat && (
              <motion.div 
                className="w-1/2 flex flex-col border-l border-white border-opacity-20 pl-6"
                style={{ minHeight: 0 }}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="mb-4 flex-shrink-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-semibold text-glow">💬 Chat với AI</h3>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-400">
                        {chatHistory.length > 0 ? `${chatHistory.length} tin nhắn` : 'Chưa có tin nhắn'}
                      </span>
                      {chatHistory.length > 0 && (
                        <button
                          onClick={() => setChatHistory([])}
                          className="text-xs text-red-400 hover:text-red-300 transition-colors"
                          title="Xóa lịch sử chat"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-sm text-gray-400 mb-3">
                    Yêu cầu AI chỉnh sửa bình luận theo ý muốn của bạn. Kết quả sẽ được cập nhật tự động!
                    {showEditor && isEditing && (
                      <span className="text-yellow-400 block mt-1">
                        ⚠️ Lưu ý: Có thay đổi chưa lưu trong editor. Hãy lưu trước khi chat để sử dụng phiên bản mới nhất.
                      </span>
                    )}
                  </p>
                  <div className="space-y-2">
                    <div className="text-xs text-gray-400 mb-2">💡 Quick Actions:</div>
                    <div className="grid grid-cols-1 gap-2 max-h-32 overflow-y-auto">
                      {quickActions.map((action, index) => (
                        <button
                          key={index}
                          onClick={() => setChatMessage(action.text)}
                          className={`px-3 py-2 bg-${action.color}-600 bg-opacity-20 border border-${action.color}-500 rounded-lg text-xs hover:bg-opacity-30 transition-colors text-left flex items-center space-x-2`}
                          title={action.text}
                        >
                          <span className="text-sm">{action.emoji}</span>
                          <span className="truncate">{action.text}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Chat History */}
                <div className="flex-1 bg-black bg-opacity-30 border border-white border-opacity-20 rounded-lg p-4 overflow-y-auto mb-4 custom-scrollbar" style={{ minHeight: 0 }}>
                  {chatHistory.length === 0 ? (
                    <div className="text-center text-gray-400 py-8">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="mb-4">Bắt đầu chat với AI để chỉnh sửa bình luận</p>
                      <div className="text-xs text-gray-500">
                        💡 Gợi ý: "Làm cho bình luận hài hước hơn", "Rút ngắn xuống 2000 từ", "Thay đổi phong cách viết"
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {chatHistory.map((msg, index) => (
                        <div
                          key={index}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[80%] p-3 rounded-lg ${
                              msg.role === 'user'
                                ? 'bg-blue-600 bg-opacity-20 text-white border border-blue-500 border-opacity-30'
                                : 'bg-white bg-opacity-10 text-gray-100 border border-white border-opacity-20'
                            }`}
                          >
                            <div className="text-xs opacity-70 mb-1 flex items-center justify-between">
                              <span>{msg.role === 'user' ? '👤 Bạn' : '🤖 AI'}</span>
                              {msg.role === 'assistant' && msg.content.includes('updatedResult') && (
                                <span className="text-green-400">✨ Đã cập nhật kết quả</span>
                              )}
                            </div>
                            <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                      ))}
                      {isChatting && (
                        <div className="flex justify-start">
                          <div className="bg-white bg-opacity-10 p-3 rounded-lg">
                            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Chat Input */}
                <div className="flex space-x-2 flex-shrink-0">
                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={chatMessage}
                      onChange={(e) => setChatMessage(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleChat()}
                      placeholder="Nhập yêu cầu chỉnh sửa... (Enter để gửi, Shift+Enter để xuống dòng)"
                      className="w-full px-4 py-3 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg focus:outline-none focus:border-glow text-white placeholder-gray-400 pr-12"
                      disabled={isChatting}
                      autoFocus
                    />
                    {chatMessage.length > 0 && (
                      <button
                        onClick={() => setChatMessage('')}
                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                        title="Xóa tin nhắn"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  <button
                    onClick={handleChat}
                    disabled={!chatMessage.trim() || isChatting}
                    className="px-4 py-3 bg-blue-600 bg-opacity-20 border border-blue-500 rounded-lg hover:bg-opacity-30 transition-colors disabled:opacity-50 flex items-center justify-center min-w-[44px]"
                    title={isChatting ? "Đang xử lý..." : "Gửi tin nhắn"}
                  >
                    {isChatting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </motion.div>
            )}
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
