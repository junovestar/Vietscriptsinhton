/**
 * API Key Load Balancer và Failover Manager
 * Tự động chuyển đổi giữa các API keys khi gặp lỗi overload/quota
 */

export class ApiKeyManager {
  constructor(apiKeys = []) {
    this.apiKeys = this.initializeKeys(apiKeys)
    this.currentIndex = 0
    this.failedKeys = new Map() // Track failed keys with cooldown
    this.usageStats = new Map() // Track usage statistics
  }

  /**
   * Initialize API keys with metadata
   */
  initializeKeys(keys) {
    return keys.map((key, index) => ({
      key: key.trim(),
      id: `key_${index}`,
      isActive: true,
      failCount: 0,
      lastUsed: null,
      lastFailed: null,
      totalRequests: 0,
      successRequests: 0,
      quota: {
        daily: 1000, // Default daily quota
        hourly: 100,  // Default hourly quota
        used: 0
      }
    }))
  }

  /**
   * Get next available API key with load balancing
   */
  getNextApiKey() {
    if (this.apiKeys.length === 0) {
      throw new Error('No API keys configured')
    }

    // Filter out failed keys (with cooldown check)
    const availableKeys = this.apiKeys.filter(keyObj => this.isKeyAvailable(keyObj))
    
    if (availableKeys.length === 0) {
      // All keys failed, reset cooldowns and try again
      console.warn('🔄 All API keys failed, resetting cooldowns...')
      this.resetCooldowns()
      return this.apiKeys[0].key
    }

    // Round-robin selection among available keys
    const selectedKey = availableKeys[this.currentIndex % availableKeys.length]
    this.currentIndex = (this.currentIndex + 1) % availableKeys.length

    // Update usage stats
    selectedKey.lastUsed = Date.now()
    selectedKey.totalRequests++

    console.log(`🔑 Using API Key: ${selectedKey.id} (${selectedKey.successRequests}/${selectedKey.totalRequests} success rate)`)
    
    return selectedKey.key
  }

  /**
   * Check if API key is available (not in cooldown)
   */
  isKeyAvailable(keyObj) {
    if (!keyObj.isActive) return false

    const now = Date.now()
    const cooldownPeriod = this.getCooldownPeriod(keyObj.failCount)
    
    if (keyObj.lastFailed && (now - keyObj.lastFailed) < cooldownPeriod) {
      return false // Still in cooldown
    }

    return true
  }

  /**
   * Mark API key as failed with specific error type
   */
  markKeyFailed(apiKey, error) {
    const keyObj = this.findKeyObject(apiKey)
    if (!keyObj) return

    keyObj.failCount++
    keyObj.lastFailed = Date.now()

    const errorType = this.categorizeError(error)
    console.warn(`❌ API Key ${keyObj.id} failed: ${errorType} (fail count: ${keyObj.failCount})`)

    // Different handling based on error type
    switch (errorType) {
      case 'quota_exceeded':
        keyObj.isActive = false // Disable until reset
        console.warn(`🚫 API Key ${keyObj.id} disabled due to quota exceeded`)
        break
      
      case 'rate_limit':
      case 'model_overload':
        // Temporary cooldown, will retry later
        break
      
      case 'invalid_key':
        keyObj.isActive = false // Permanently disable
        console.error(`🔒 API Key ${keyObj.id} permanently disabled (invalid)`)
        break
    }

    // Auto-switch to next key
    this.switchToNextKey()
  }

  /**
   * Mark API key as successful
   */
  markKeySuccess(apiKey) {
    const keyObj = this.findKeyObject(apiKey)
    if (!keyObj) return

    keyObj.successRequests++
    keyObj.failCount = Math.max(0, keyObj.failCount - 1) // Gradually reduce fail count
    
    if (keyObj.failCount === 0) {
      keyObj.lastFailed = null // Clear failed status
    }
  }

  /**
   * Find key object by API key string
   */
  findKeyObject(apiKey) {
    return this.apiKeys.find(keyObj => keyObj.key === apiKey)
  }

  /**
   * Categorize error type for different handling
   */
  categorizeError(error) {
    const errorMessage = error.message.toLowerCase()
    
    if (errorMessage.includes('quota') || errorMessage.includes('exceeded')) {
      return 'quota_exceeded'
    }
    if (errorMessage.includes('rate limit') || errorMessage.includes('too many requests')) {
      return 'rate_limit'
    }
    if (errorMessage.includes('overload') || errorMessage.includes('busy')) {
      return 'model_overload'
    }
    if (errorMessage.includes('invalid') || errorMessage.includes('unauthorized')) {
      return 'invalid_key'
    }
    
    return 'unknown'
  }

  /**
   * Get cooldown period based on fail count (exponential backoff)
   */
  getCooldownPeriod(failCount) {
    const baseDelay = 60000 // 1 minute
    const maxDelay = 300000 // 5 minutes
    return Math.min(baseDelay * Math.pow(2, failCount), maxDelay)
  }

  /**
   * Switch to next available key
   */
  switchToNextKey() {
    const availableKeys = this.apiKeys.filter(keyObj => this.isKeyAvailable(keyObj))
    if (availableKeys.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % availableKeys.length
      console.log(`🔄 Switched to next API key`)
    }
  }

  /**
   * Reset cooldowns for all keys (emergency fallback)
   */
  resetCooldowns() {
    this.apiKeys.forEach(keyObj => {
      keyObj.lastFailed = null
      keyObj.failCount = 0
    })
    console.log('🔄 All API key cooldowns reset')
  }

  /**
   * Get statistics about API key usage
   */
  getStats() {
    return {
      totalKeys: this.apiKeys.length,
      activeKeys: this.apiKeys.filter(k => k.isActive).length,
      availableKeys: this.apiKeys.filter(k => this.isKeyAvailable(k)).length,
      currentKey: this.apiKeys[this.currentIndex]?.id,
      keys: this.apiKeys.map(key => ({
        id: key.id,
        isActive: key.isActive,
        failCount: key.failCount,
        successRate: key.totalRequests > 0 ? (key.successRequests / key.totalRequests * 100).toFixed(1) + '%' : '0%',
        totalRequests: key.totalRequests,
        lastUsed: key.lastUsed ? new Date(key.lastUsed).toISOString() : null,
        inCooldown: key.lastFailed && (Date.now() - key.lastFailed) < this.getCooldownPeriod(key.failCount)
      }))
    }
  }

  /**
   * Add new API key to the pool
   */
  addApiKey(apiKey) {
    const newKeyObj = {
      key: apiKey.trim(),
      id: `key_${this.apiKeys.length}`,
      isActive: true,
      failCount: 0,
      lastUsed: null,
      lastFailed: null,
      totalRequests: 0,
      successRequests: 0,
      quota: { daily: 1000, hourly: 100, used: 0 }
    }
    
    this.apiKeys.push(newKeyObj)
    console.log(`➕ Added new API key: ${newKeyObj.id}`)
    return newKeyObj.id
  }

  /**
   * Remove API key from pool
   */
  removeApiKey(apiKey) {
    const index = this.apiKeys.findIndex(keyObj => keyObj.key === apiKey)
    if (index > -1) {
      const removed = this.apiKeys.splice(index, 1)[0]
      console.log(`➖ Removed API key: ${removed.id}`)
      return true
    }
    return false
  }
}

// Default API keys từ config
const DEFAULT_API_KEYS = [
  'AIzaSyClZFBCA_uXJLwBYG0rV3j0-flFEH6SyOU', // Primary key
  'AIzaSyDrW9x6hYSJ0sSCKgU2re46MPD3bV4QtkU', // Backup key từ workflow
  // Có thể thêm nhiều keys khác...
]

// Create singleton instance
export const apiKeyManager = new ApiKeyManager(DEFAULT_API_KEYS)
