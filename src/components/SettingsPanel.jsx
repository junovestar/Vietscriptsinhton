import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { X, Save, RotateCcw, Eye, Copy, Key } from 'lucide-react'

const SettingsPanel = ({ settings, onSettingsChange, onClose }) => {
  const [showFullPrompt, setShowFullPrompt] = useState(false)
  
  const handleInputChange = (field, value) => {
    onSettingsChange(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const copyPrompt = () => {
    navigator.clipboard.writeText(settings.prompt)
    alert('✅ Đã sao chép prompt vào clipboard!')
  }



  const resetToDefaults = () => {
    console.log('🔍 resetToDefaults called, onSettingsChange:', typeof onSettingsChange)
    
    const defaultSettings = {
      // API Keys được quản lý riêng biệt, không reset
      prompt: `Bạn là Biên kịch viên YouTube chuyên nghiệp, chuyên viết kịch bản tóm tắt video sinh tồn nơi hoang dã.

Nhiệm vụ: Viết lại transcript thành kịch bản 10 phút, độ dài 4500–5000 chữ, giữ nguyên nội dung chính, chỉ thêm mô tả kịch tính và hài hước.

Yêu cầu: 
- Kể chuyện theo ngôi thứ 3.
- Chỉ xuất ra văn bản kịch bản, KHÔNG thêm ký tự đặc biệt, KHÔNG markdown, KHÔNG format ngoài chữ thường và chữ hoa.
- Nội dung phải bám sát transcript, không thêm chi tiết bên ngoài.
- Kết quả phải là chuỗi text thuần (plain text).
- Đầy đủ các hoạt động diễn ra trong transcript đã gửi, chỉ thêm mô tả chứ không thêm gì bên ngoài.
- Nếu bạn lạc đề khỏi transcript, hãy tự sửa trước khi gửi.

Hãy trả về đúng 1 plaintext duy nhất dựa trên transcript được cung cấp.`,
      wordCount: 4500,
      writingStyle: 'Hài hước',
      mainCharacter: 'Thánh Nhọ Rừng Sâu',
      language: 'Tiếng Việt',
      creativity: 7
    }
    
    console.log('🚀 Applying default settings:', defaultSettings)
    onSettingsChange(defaultSettings)
  }

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="glass-panel w-full max-w-2xl max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-glow">⚙️ Cài Đặt Chung</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="space-y-6">
            {/* API Keys Info */}
            <div className="glass-panel p-4 border border-blue-500 border-opacity-30">
              <div className="flex items-center space-x-2 mb-2">
                <Key className="w-5 h-5 text-blue-400" />
                <span className="text-sm font-medium text-blue-400">🔑 API Keys Management</span>
              </div>
              <div className="text-xs text-gray-300 mb-2">
                API Keys được quản lý riêng biệt trong API Key Manager để tối ưu hiệu suất và bảo mật.
              </div>
              <div className="text-xs text-gray-400">
                💡 Sử dụng nút "API Keys" trên header để thêm, xóa và quản lý API keys
              </div>
            </div>

            {/* Prompt Template */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">📝 Prompt Template:</label>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setShowFullPrompt(true)}
                    className="px-2 py-1 bg-blue-600 bg-opacity-20 border border-blue-500 rounded text-xs hover:bg-opacity-30 transition-colors flex items-center space-x-1"
                    title="Xem prompt đầy đủ"
                  >
                    <Eye className="w-3 h-3" />
                    <span>Xem đầy đủ</span>
                  </button>
                  <button
                    onClick={copyPrompt}
                    className="px-2 py-1 bg-green-600 bg-opacity-20 border border-green-500 rounded text-xs hover:bg-opacity-30 transition-colors flex items-center space-x-1"
                    title="Sao chép prompt"
                  >
                    <Copy className="w-3 h-3" />
                    <span>Sao chép</span>
                  </button>
                  <button
                    onClick={resetToDefaults}
                    className="px-2 py-1 bg-orange-600 bg-opacity-20 border border-orange-500 rounded text-xs hover:bg-opacity-30 transition-colors flex items-center space-x-1"
                    title="Reset về prompt mặc định"
                  >
                    <RotateCcw className="w-3 h-3" />
                    <span>Reset</span>
                  </button>

                </div>
              </div>
              <textarea
                value={settings.prompt}
                onChange={(e) => handleInputChange('prompt', e.target.value)}
                className="w-full h-48 px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg focus:outline-none focus:border-glow resize-none overflow-y-auto"
                placeholder="Nhập prompt template..."
                style={{ 
                  fontFamily: 'monospace',
                  fontSize: '11px',
                  lineHeight: '1.3',
                  whiteSpace: 'pre-wrap',
                  wordWrap: 'break-word'
                }}
              />
              <div className="text-xs text-gray-400 mt-1">
                💡 Prompt này sẽ được sử dụng để tạo bình luận cuối cùng từ transcript
              </div>
            </div>

            {/* Word Count */}
            <div>
              <label className="block text-sm font-medium mb-2">
                📊 Số lượng chữ: {settings.wordCount}
              </label>
              <input
                type="range"
                min="1000"
                max="10000"
                step="500"
                value={settings.wordCount}
                onChange={(e) => handleInputChange('wordCount', parseInt(e.target.value))}
                className="w-full h-2 bg-white bg-opacity-20 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>1000</span>
                <span>10000</span>
              </div>
            </div>

            {/* Writing Style */}
            <div>
              <label className="block text-sm font-medium mb-2">🎭 Phong cách viết:</label>
              <select
                value={settings.writingStyle}
                onChange={(e) => handleInputChange('writingStyle', e.target.value)}
                className="w-full px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg focus:outline-none focus:border-glow"
              >
                <option value="Hài hước">Hài hước</option>
                <option value="Nghiêm túc">Nghiêm túc</option>
                <option value="Kịch tính">Kịch tính</option>
                <option value="Cảm động">Cảm động</option>
                <option value="Phiêu lưu">Phiêu lưu</option>
              </select>
            </div>

            {/* Main Character */}
            <div>
              <label className="block text-sm font-medium mb-2">👤 Tên nhân vật chính:</label>
              <input
                type="text"
                value={settings.mainCharacter}
                onChange={(e) => handleInputChange('mainCharacter', e.target.value)}
                className="w-full px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg focus:outline-none focus:border-glow"
                placeholder="VD: Thánh Nhọ Rừng Sâu"
              />
            </div>

            {/* Language */}
            <div>
              <label className="block text-sm font-medium mb-2">🌍 Ngôn ngữ:</label>
              <select
                value={settings.language}
                onChange={(e) => handleInputChange('language', e.target.value)}
                className="w-full px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg focus:outline-none focus:border-glow"
              >
                <option value="Tiếng Việt">Tiếng Việt</option>
                <option value="English">English</option>
                <option value="中文">中文</option>
                <option value="日本語">日本語</option>
              </select>
            </div>

            {/* Creativity Level */}
            <div>
              <label className="block text-sm font-medium mb-2">
                🎨 Độ sáng tạo: {settings.creativity}/10
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={settings.creativity}
                onChange={(e) => handleInputChange('creativity', parseInt(e.target.value))}
                className="w-full h-2 bg-white bg-opacity-20 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-gray-400 mt-1">
                <span>Ít sáng tạo</span>
                <span>Rất sáng tạo</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-4 mt-8">
            <button
              onClick={onClose}
              className="glow-button flex-1 flex items-center justify-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>Lưu Cài Đặt</span>
            </button>
            
            <button
              onClick={resetToDefaults}
              className="glass-panel flex-1 flex items-center justify-center space-x-2 py-3 hover:bg-white hover:bg-opacity-10 transition-colors"
            >
              <RotateCcw className="w-5 h-5" />
              <span>Khôi Phục Mặc Định</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* Full Prompt Modal */}
      {showFullPrompt && (
        <motion.div
          className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-60 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="glass-panel w-full max-w-4xl max-h-[90vh] overflow-y-auto"
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="p-6">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-glow">📝 Prompt Template Đầy Đủ</h2>
                <button
                  onClick={() => setShowFullPrompt(false)}
                  className="p-2 hover:bg-white hover:bg-opacity-10 rounded-lg transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Full Prompt Content */}
              <div className="space-y-4">
                {/* Full Prompt */}
                <div className="bg-black bg-opacity-30 border border-white border-opacity-20 rounded-lg p-4">
                  <h3 className="text-sm font-bold text-purple-400 mb-2">📋 Prompt Hoàn Chỉnh:</h3>
                  <pre className="whitespace-pre-wrap text-xs leading-relaxed text-gray-100 font-mono overflow-x-auto max-h-96 overflow-y-auto">
                    {settings.prompt}
                  </pre>
                </div>
                
                <div className="text-xs text-gray-400">
                  💡 Đây là prompt sẽ được sử dụng để tạo bình luận cuối cùng từ transcript của video
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </motion.div>
  )
}

export default SettingsPanel
