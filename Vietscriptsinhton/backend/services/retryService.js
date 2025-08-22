import { setTimeout } from 'timers/promises'

export class RetryService {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3
    this.baseDelay = options.baseDelay || 60000 // 1 minute default
    this.maxDelay = options.maxDelay || 300000 // 5 minutes max
    this.retryableErrors = options.retryableErrors || [
      'model_overloaded',
      'rate_limit_exceeded',
      'service_unavailable',
      'timeout',
      'quota_exceeded'
    ]
  }

  isRetryableError(error) {
    const errorMessage = error.message.toLowerCase()
    const errorCode = error.code?.toLowerCase()
    
    return this.retryableErrors.some(retryableError => 
      errorMessage.includes(retryableError) || 
      errorCode === retryableError ||
      errorMessage.includes('overload') ||
      errorMessage.includes('rate limit') ||
      errorMessage.includes('quota') ||
      errorMessage.includes('busy') ||
      errorMessage.includes('temporarily unavailable')
    )
  }

  calculateDelay(attempt) {
    // Exponential backoff with jitter
    const exponentialDelay = this.baseDelay * Math.pow(2, attempt - 1)
    const jitter = Math.random() * 0.1 * exponentialDelay // 10% jitter
    return Math.min(exponentialDelay + jitter, this.maxDelay)
  }

  async executeWithRetry(operation, context = {}, progressCallback = null) {
    let lastError = null
    
    for (let attempt = 1; attempt <= this.maxRetries + 1; attempt++) {
      try {
        if (progressCallback && attempt > 1) {
          progressCallback({
            type: 'retry_attempt',
            attempt,
            maxAttempts: this.maxRetries + 1,
            context
          })
        }

        const result = await operation()
        
        if (progressCallback && attempt > 1) {
          progressCallback({
            type: 'retry_success',
            attempt,
            context
          })
        }

        return result
      } catch (error) {
        lastError = error
        console.log(`Attempt ${attempt} failed:`, error.message)

        // If it's the last attempt or not a retryable error, throw
        if (attempt > this.maxRetries || !this.isRetryableError(error)) {
          if (progressCallback) {
            progressCallback({
              type: 'retry_failed',
              attempt,
              error: error.message,
              context
            })
          }
          throw error
        }

        // Calculate delay for next attempt
        const delay = this.calculateDelay(attempt)
        
        if (progressCallback) {
          progressCallback({
            type: 'retry_waiting',
            attempt,
            nextAttempt: attempt + 1,
            delay: delay,
            error: error.message,
            context
          })
        }

        console.log(`Waiting ${Math.round(delay / 1000)}s before retry ${attempt + 1}/${this.maxRetries + 1}`)
        await setTimeout(delay)
      }
    }

    throw lastError
  }

  formatRetryMessage(type, data) {
    switch (type) {
      case 'retry_attempt':
        return `🔄 Thử lại lần ${data.attempt}/${data.maxAttempts}...`
      
      case 'retry_waiting':
        const minutes = Math.round(data.delay / 60000)
        const seconds = Math.round((data.delay % 60000) / 1000)
        const timeStr = minutes > 0 ? `${minutes}p${seconds}s` : `${seconds}s`
        return `⏳ Lỗi: "${data.error}". Chờ ${timeStr} rồi thử lại...`
      
      case 'retry_success':
        return `✅ Thành công sau ${data.attempt} lần thử!`
      
      case 'retry_failed':
        return `❌ Thất bại sau tất cả các lần thử: ${data.error}`
      
      default:
        return `🔄 Đang xử lý...`
    }
  }
}

// Create default instance
export const defaultRetryService = new RetryService({
  maxRetries: 3,
  baseDelay: 60000, // 1 minute
  maxDelay: 300000, // 5 minutes
  retryableErrors: [
    'model_overloaded',
    'rate_limit_exceeded', 
    'service_unavailable',
    'timeout',
    'quota_exceeded',
    'overload',
    'busy'
  ]
})
