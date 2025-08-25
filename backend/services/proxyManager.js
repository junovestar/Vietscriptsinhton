/**
 * Proxy Manager - Quản lý và load balance proxy servers
 * Hỗ trợ HTTP, HTTPS, SOCKS5 proxies với failover
 */

import { HttpsProxyAgent } from 'https-proxy-agent'
import { SocksProxyAgent } from 'socks-proxy-agent'

export class ProxyManager {
  constructor(proxies = []) {
    this.proxies = this.initializeProxies(proxies)
    this.currentIndex = 0
    this.failedProxies = new Map()
    this.usageStats = new Map()
  }

  /**
   * Initialize proxy configurations
   */
  initializeProxies(proxyList) {
    return proxyList.map((proxy, index) => ({
      id: `proxy_${index}`,
      url: proxy.url,
      type: proxy.type || this.detectProxyType(proxy.url),
      username: proxy.username || null,
      password: proxy.password || null,
      isActive: true,
      failCount: 0,
      lastUsed: null,
      lastFailed: null,
      totalRequests: 0,
      successRequests: 0,
      responseTime: 0,
      country: proxy.country || 'Unknown',
      speed: proxy.speed || 'Unknown'
    }))
  }

  /**
   * Detect proxy type from URL
   */
  detectProxyType(url) {
    if (url.startsWith('socks5://')) return 'socks5'
    if (url.startsWith('socks4://')) return 'socks4'
    if (url.startsWith('http://')) return 'http'
    if (url.startsWith('https://')) return 'https'
    return 'http' // Default
  }

  /**
   * Get next available proxy with load balancing
   */
  getNextProxy() {
    if (this.proxies.length === 0) {
      return null // No proxy configured
    }

    const availableProxies = this.proxies.filter(proxy => this.isProxyAvailable(proxy))
    
    if (availableProxies.length === 0) {
      console.warn('🔄 All proxies failed, resetting cooldowns...')
      this.resetCooldowns()
      return this.proxies[0]
    }

    // Round-robin selection
    const selectedProxy = availableProxies[this.currentIndex % availableProxies.length]
    this.currentIndex = (this.currentIndex + 1) % availableProxies.length

    // Update usage stats
    selectedProxy.lastUsed = Date.now()
    selectedProxy.totalRequests++

    console.log(`🌐 Using Proxy: ${selectedProxy.id} (${selectedProxy.type})`)
    
    return selectedProxy
  }

  /**
   * Check if proxy is available (not in cooldown)
   */
  isProxyAvailable(proxy) {
    if (!proxy.isActive) return false

    const now = Date.now()
    const cooldownPeriod = this.getCooldownPeriod(proxy.failCount)
    
    if (proxy.lastFailed && (now - proxy.lastFailed) < cooldownPeriod) {
      return false // Still in cooldown
    }

    return true
  }

  /**
   * Mark proxy as failed
   */
  markProxyFailed(proxy, error) {
    proxy.failCount++
    proxy.lastFailed = Date.now()

    const errorType = this.categorizeError(error)
    console.warn(`❌ Proxy ${proxy.id} failed: ${errorType} (fail count: ${proxy.failCount})`)

    switch (errorType) {
      case 'timeout':
      case 'connection_refused':
        // Temporary cooldown
        break
      
      case 'authentication_failed':
        proxy.isActive = false // Disable permanently
        console.error(`🔒 Proxy ${proxy.id} disabled (auth failed)`)
        break
      
      case 'proxy_unavailable':
        proxy.isActive = false // Disable until reset
        console.warn(`🚫 Proxy ${proxy.id} disabled (unavailable)`)
        break
    }

    this.switchToNextProxy()
  }

  /**
   * Mark proxy as successful
   */
  markProxySuccess(proxy, responseTime = 0) {
    proxy.successRequests++
    proxy.failCount = Math.max(0, proxy.failCount - 1)
    proxy.responseTime = responseTime
    
    if (proxy.failCount === 0) {
      proxy.lastFailed = null
    }
  }

  /**
   * Categorize proxy error
   */
  categorizeError(error) {
    const errorMessage = error.message?.toLowerCase() || ''
    
    if (errorMessage.includes('timeout') || errorMessage.includes('etimedout')) {
      return 'timeout'
    }
    if (errorMessage.includes('connection refused') || errorMessage.includes('econnrefused')) {
      return 'connection_refused'
    }
    if (errorMessage.includes('authentication') || errorMessage.includes('unauthorized')) {
      return 'authentication_failed'
    }
    if (errorMessage.includes('proxy') && errorMessage.includes('unavailable')) {
      return 'proxy_unavailable'
    }
    
    return 'unknown'
  }

  /**
   * Get cooldown period based on fail count
   */
  getCooldownPeriod(failCount) {
    const baseDelay = 30000 // 30 seconds
    const maxDelay = 300000 // 5 minutes
    return Math.min(baseDelay * Math.pow(2, failCount), maxDelay)
  }

  /**
   * Switch to next available proxy
   */
  switchToNextProxy() {
    const availableProxies = this.proxies.filter(proxy => this.isProxyAvailable(proxy))
    if (availableProxies.length > 0) {
      this.currentIndex = (this.currentIndex + 1) % availableProxies.length
          }
  }

  /**
   * Reset cooldowns for all proxies
   */
  resetCooldowns() {
    this.proxies.forEach(proxy => {
      proxy.lastFailed = null
      proxy.failCount = 0
    })
      }

  /**
   * Create fetch agent for proxy
   */
  createProxyAgent(proxy) {
    if (!proxy) return null

    const options = {
      host: new URL(proxy.url).hostname,
      port: new URL(proxy.url).port,
      protocol: new URL(proxy.url).protocol
    }

    if (proxy.username && proxy.password) {
      options.auth = `${proxy.username}:${proxy.password}`
    }

    switch (proxy.type) {
      case 'socks5':
        return new SocksProxyAgent(proxy.url)
      case 'socks4':
        return new SocksProxyAgent(proxy.url)
      case 'http':
      case 'https':
      default:
        return new HttpsProxyAgent(proxy.url)
    }
  }

  /**
   * Test proxy connectivity
   */
  async testProxy(proxy, testUrl = 'https://httpbin.org/ip') {
    const startTime = Date.now()
    
    try {
      const agent = this.createProxyAgent(proxy)
      const response = await fetch(testUrl, {
        agent,
        timeout: 10000 // 10 seconds timeout
      })

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`)
      }

      const responseTime = Date.now() - startTime
      this.markProxySuccess(proxy, responseTime)
      
      return {
        success: true,
        responseTime,
        ip: await response.text()
      }
    } catch (error) {
      this.markProxyFailed(proxy, error)
      return {
        success: false,
        error: error.message
      }
    }
  }

  /**
   * Get statistics about proxy usage
   */
  getStats() {
    return {
      totalProxies: this.proxies.length,
      activeProxies: this.proxies.filter(p => p.isActive).length,
      availableProxies: this.proxies.filter(p => this.isProxyAvailable(p)).length,
      currentProxy: this.proxies[this.currentIndex]?.id,
      proxies: this.proxies.map(proxy => ({
        id: proxy.id,
        url: proxy.url,
        type: proxy.type,
        isActive: proxy.isActive,
        failCount: proxy.failCount,
        successRate: proxy.totalRequests > 0 ? (proxy.successRequests / proxy.totalRequests * 100).toFixed(1) + '%' : '0%',
        totalRequests: proxy.totalRequests,
        responseTime: proxy.responseTime,
        lastUsed: proxy.lastUsed ? new Date(proxy.lastUsed).toISOString() : null,
        inCooldown: proxy.lastFailed && (Date.now() - proxy.lastFailed) < this.getCooldownPeriod(proxy.failCount),
        country: proxy.country,
        speed: proxy.speed
      }))
    }
  }

  /**
   * Add new proxy to the pool
   */
  addProxy(proxyConfig) {
    const newProxy = {
      id: `proxy_${this.proxies.length}`,
      url: proxyConfig.url,
      type: proxyConfig.type || this.detectProxyType(proxyConfig.url),
      username: proxyConfig.username || null,
      password: proxyConfig.password || null,
      isActive: true,
      failCount: 0,
      lastUsed: null,
      lastFailed: null,
      totalRequests: 0,
      successRequests: 0,
      responseTime: 0,
      country: proxyConfig.country || 'Unknown',
      speed: proxyConfig.speed || 'Unknown'
    }
    
    this.proxies.push(newProxy)
    console.log(`➕ Added new proxy: ${newProxy.id} (${newProxy.type})`)
    return newProxy.id
  }

  /**
   * Remove proxy from pool
   */
  removeProxy(proxyId) {
    const index = this.proxies.findIndex(proxy => proxy.id === proxyId)
    if (index > -1) {
      const removed = this.proxies.splice(index, 1)[0]
            return true
    }
    return false
  }

  /**
   * Test all proxies
   */
  async testAllProxies() {
        const results = []
    
    for (const proxy of this.proxies) {
      const result = await this.testProxy(proxy)
      results.push({
        proxyId: proxy.id,
        ...result
      })
    }
    
    return results
  }
}

// Default proxy configurations (example)
const DEFAULT_PROXIES = [
  // Free proxy examples (replace with your own)
  // {
  //   url: 'http://proxy1.example.com:8080',
  //   type: 'http',
  //   country: 'US',
  //   speed: 'Fast'
  // },
  // {
  //   url: 'socks5://proxy2.example.com:1080',
  //   type: 'socks5',
  //   country: 'EU',
  //   speed: 'Medium'
  // }
]

// Create singleton instance
export const proxyManager = new ProxyManager(DEFAULT_PROXIES)
