/**
 * Validation utilities for settings and inputs
 */

export function validateSettings(settings) {
  const errors = []
  
  // API Keys are managed separately by backend, not validated here
  
  // Validate Prompt
  if (!settings.prompt || settings.prompt.trim() === '') {
    errors.push('Prompt template is required')
  } else if (settings.prompt.length < 50) {
    errors.push('Prompt template is too short (minimum 50 characters)')
  }
  
  // Validate Word Count
  if (!settings.wordCount || settings.wordCount < 100 || settings.wordCount > 20000) {
    errors.push('Word count must be between 100 and 20000')
  }
  
  // Validate Writing Style
  const validStyles = ['Hài hước', 'Nghiêm túc', 'Kịch tính', 'Cảm động', 'Phiêu lưu']
  if (!settings.writingStyle || !validStyles.includes(settings.writingStyle)) {
    errors.push('Invalid writing style')
  }
  
  // Validate Main Character
  if (!settings.mainCharacter || settings.mainCharacter.trim() === '') {
    errors.push('Main character name is required')
  }
  
  // Validate Language
  const validLanguages = ['Tiếng Việt', 'English', '中文', '日本語']
  if (!settings.language || !validLanguages.includes(settings.language)) {
    errors.push('Invalid language selection')
  }
  
  // Validate Creativity Level
  if (!settings.creativity || settings.creativity < 1 || settings.creativity > 10) {
    errors.push('Creativity level must be between 1 and 10')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}

export function validateYouTubeUrl(url) {
  const patterns = [
    /^https?:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
    /^https?:\/\/(www\.)?youtube\.com\/v\/[\w-]+/
  ]
  
  return patterns.some(pattern => pattern.test(url))
}

export function validateVideoFile(file) {
  const validTypes = ['video/mp4', 'video/avi', 'video/mov', 'video/wmv', 'video/flv']
  const maxSize = 500 * 1024 * 1024 // 500MB
  
  const errors = []
  
  if (!validTypes.includes(file.type)) {
    errors.push('Invalid video file type. Supported: MP4, AVI, MOV, WMV, FLV')
  }
  
  if (file.size > maxSize) {
    errors.push('File size too large. Maximum 500MB allowed')
  }
  
  return {
    isValid: errors.length === 0,
    errors
  }
}
