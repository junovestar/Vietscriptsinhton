import React from 'react'
import { motion } from 'framer-motion'
import { X, Save, RotateCcw } from 'lucide-react'

const SettingsPanel = ({ settings, onSettingsChange, onClose }) => {
  const handleInputChange = (field, value) => {
    onSettingsChange(prev => ({
      ...prev,
      [field]: value
    }))
  }

  const resetToDefaults = () => {
    console.log('🔍 resetToDefaults called, onSettingsChange:', typeof onSettingsChange)
    
    const defaultSettings = {
      apiKey: 'AIzaSyClZFBCA_uXJLwBYG0rV3j0-flFEH6SyOU',
      prompt: `Bạn là Biên kịch viên YouTube chuyên nghiệp, chuyên viết kịch bản tóm tắt video sinh tồn nơi hoang dã.
Nhiệm vụ: Viết lại transcript thành kịch bản 10 phút, độ dài 4500–5000 chữ, giữ nguyên nội dung chính, chỉ thêm mô tả kịch tính và hài hước.
Yêu cầu: 
- Kể chuyện theo ngôi thứ 3.
- Chỉ xuất ra văn bản kịch bản, KHÔNG thêm ký tự đặc biệt, KHÔNG markdown, KHÔNG format ngoài chữ thường và chữ hoa.
- Nội dung phải bám sát transcript, không thêm chi tiết bên ngoài.
- Kết quả phải là chuỗi text thuần (plain text).`,
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
            {/* API Key */}
            <div>
              <label className="block text-sm font-medium mb-2">🔑 Gemini API Key:</label>
              <input
                type="password"
                value={settings.apiKey}
                onChange={(e) => handleInputChange('apiKey', e.target.value)}
                className="w-full px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg focus:outline-none focus:border-glow"
                placeholder="API Key đã được thiết lập mặc định..."
              />
              <div className="text-xs text-green-400 mt-1">
                ✅ API Key đã được cấu hình sẵn
              </div>
            </div>

            {/* Prompt Template */}
            <div>
              <label className="block text-sm font-medium mb-2">📝 Prompt Template:</label>
              <textarea
                value={settings.prompt}
                onChange={(e) => handleInputChange('prompt', e.target.value)}
                className="w-full h-32 px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg focus:outline-none focus:border-glow resize-none"
                placeholder="Nhập prompt template..."
              />
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
    </motion.div>
  )
}

export default SettingsPanel
