import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Plus, Trash2, RefreshCw, Globe, Activity, AlertCircle, Check, Wifi, WifiOff } from 'lucide-react'

const ProxyManager = ({ isOpen, onClose }) => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(false)
  const [newProxy, setNewProxy] = useState({
    url: '',
    type: 'http',
    username: '',
    password: '',
    country: '',
    speed: ''
  })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [testingProxy, setTestingProxy] = useState(null)

  // Load stats when component opens
  useEffect(() => {
    if (isOpen) {
      loadStats()
      
      // Retry loading if failed (server might be starting up)
      const retryTimer = setTimeout(() => {
        if (!stats && !loading) {
          console.log('Retrying proxy stats load...')
          loadStats()
        }
      }, 2000)
      
      return () => clearTimeout(retryTimer)
    }
  }, [isOpen])

  const loadStats = async () => {
    try {
      setLoading(true)
      setError('') // Clear previous errors
      
      const response = await fetch('/api/proxies/stats')
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
      
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Failed to load proxy stats:', error)
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        setError('Không thể kết nối đến server. Vui lòng đảm bảo server đang chạy và thử lại.')
      } else {
        setError(`Failed to load proxy stats: ${error.message}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const addProxy = async () => {
    if (!newProxy.url.trim()) {
      setError('Please enter a proxy URL')
      return
    }

    try {
      setLoading(true)
      const response = await fetch('/api/proxies/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newProxy)
      })

      const data = await response.json()
      
      if (data.success) {
        setSuccess(`Proxy added successfully (${data.proxyId})`)
        setNewProxy({
          url: '',
          type: 'http',
          username: '',
          password: '',
          country: '',
          speed: ''
        })
        loadStats() // Refresh stats
      } else {
        setError(data.error || 'Failed to add proxy')
      }
    } catch (error) {
      setError('Failed to add proxy')
    } finally {
      setLoading(false)
    }
  }

  const removeProxy = async (proxyId) => {
    if (!confirm('Are you sure you want to remove this proxy?')) return

    try {
      setLoading(true)
      const response = await fetch('/api/proxies/remove', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxyId })
      })

      const data = await response.json()
      
      if (data.success) {
        setSuccess('Proxy removed successfully')
        loadStats() // Refresh stats
      } else {
        setError(data.error || 'Failed to remove proxy')
      }
    } catch (error) {
      setError('Failed to remove proxy')
    } finally {
      setLoading(false)
    }
  }

  const testProxy = async (proxyId) => {
    try {
      setTestingProxy(proxyId)
      const response = await fetch('/api/proxies/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proxyId })
      })

      const data = await response.json()
      
      if (data.success) {
        setSuccess(`Proxy test successful! Response time: ${data.responseTime}ms`)
      } else {
        setError(`Proxy test failed: ${data.error}`)
      }
      
      loadStats() // Refresh stats
    } catch (error) {
      setError('Failed to test proxy')
    } finally {
      setTestingProxy(null)
    }
  }

  const testAllProxies = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/proxies/test-all', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        const successCount = data.results.filter(r => r.success).length
        const totalCount = data.results.length
        setSuccess(`Tested ${totalCount} proxies: ${successCount} working, ${totalCount - successCount} failed`)
      } else {
        setError('Failed to test proxies')
      }
      
      loadStats() // Refresh stats
    } catch (error) {
      setError('Failed to test proxies')
    } finally {
      setLoading(false)
    }
  }

  const resetCooldowns = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/proxies/reset', { method: 'POST' })
      const data = await response.json()
      
      if (data.success) {
        setSuccess('All cooldowns reset successfully')
        loadStats() // Refresh stats
      } else {
        setError(data.error || 'Failed to reset cooldowns')
      }
    } catch (error) {
      setError('Failed to reset cooldowns')
    } finally {
      setLoading(false)
    }
  }

  const getStatusColor = (proxy) => {
    if (!proxy.isActive) return 'text-red-400'
    if (proxy.inCooldown) return 'text-yellow-400'
    return 'text-green-400'
  }

  const getStatusIcon = (proxy) => {
    if (!proxy.isActive) return <WifiOff className="w-4 h-4 text-red-400" />
    if (proxy.inCooldown) return <RefreshCw className="w-4 h-4 text-yellow-400 animate-spin" />
    return <Wifi className="w-4 h-4 text-green-400" />
  }

  const getProxyTypeIcon = (type) => {
    switch (type) {
      case 'socks5': return <Globe className="w-4 h-4 text-blue-400" />
      case 'socks4': return <Globe className="w-4 h-4 text-purple-400" />
      case 'https': return <Globe className="w-4 h-4 text-green-400" />
      default: return <Globe className="w-4 h-4 text-gray-400" />
    }
  }

  const maskProxyUrl = (url) => {
    try {
      const urlObj = new URL(url)
      return `${urlObj.protocol}//${urlObj.hostname}:${urlObj.port}`
    } catch {
      return url
    }
  }

  if (!isOpen) return null

  return (
    <motion.div
      className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="glass-panel max-w-5xl w-full max-h-[90vh] overflow-y-auto"
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white border-opacity-20">
          <div className="flex items-center space-x-3">
            <Globe className="w-6 h-6 text-blue-400" />
            <h2 className="text-2xl font-bold text-glow">Proxy Manager</h2>
          </div>
          <button
            onClick={onClose}
            className="glass-panel p-2 hover:bg-white hover:bg-opacity-10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* Error/Success Messages */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="bg-red-600 bg-opacity-20 border border-red-500 rounded-lg p-3 mb-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 text-red-400" />
                  <span className="text-red-300">{error}</span>
                  <button
                    onClick={() => setError('')}
                    className="ml-auto text-red-400 hover:text-red-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                {error.includes('Không thể kết nối') && (
                  <div className="mt-2 text-xs text-red-300">
                    💡 Mẹo: Đảm bảo server đang chạy bằng cách mở terminal và chạy "npm run dev"
                  </div>
                )}
              </motion.div>
            )}
            
            {success && (
              <motion.div
                className="bg-green-600 bg-opacity-20 border border-green-500 rounded-lg p-3 mb-4"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <div className="flex items-center space-x-2">
                  <Check className="w-4 h-4 text-green-400" />
                  <span className="text-green-300">{success}</span>
                  <button
                    onClick={() => setSuccess('')}
                    className="ml-auto text-green-400 hover:text-green-300"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats Overview */}
          {loading && !stats && (
            <div className="text-center py-8">
              <RefreshCw className="w-8 h-8 mx-auto mb-2 animate-spin text-blue-400" />
              <p className="text-gray-400">Đang tải thống kê proxy...</p>
            </div>
          )}
          
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="glass-panel p-4 text-center">
                <div className="text-2xl font-bold text-blue-400">{stats.totalProxies}</div>
                <div className="text-sm text-gray-400">Total Proxies</div>
              </div>
              <div className="glass-panel p-4 text-center">
                <div className="text-2xl font-bold text-green-400">{stats.activeProxies}</div>
                <div className="text-sm text-gray-400">Active Proxies</div>
              </div>
              <div className="glass-panel p-4 text-center">
                <div className="text-2xl font-bold text-yellow-400">{stats.availableProxies}</div>
                <div className="text-sm text-gray-400">Available Proxies</div>
              </div>
              <div className="glass-panel p-4 text-center">
                <div className="text-sm text-gray-400">Current Proxy</div>
                <div className="text-lg font-bold text-cyan-400">{stats.currentProxy || 'None'}</div>
              </div>
            </div>
          )}

          {/* Add New Proxy */}
          <div className="glass-panel p-4 mb-6">
            <h3 className="text-lg font-semibold mb-3 flex items-center space-x-2">
              <Plus className="w-5 h-5 text-blue-400" />
              <span>Add New Proxy</span>
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <input
                type="text"
                value={newProxy.url}
                onChange={(e) => setNewProxy({...newProxy, url: e.target.value})}
                placeholder="Proxy URL (http://host:port)"
                className="px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg focus:outline-none focus:border-blue-400"
                disabled={loading}
              />
              <select
                value={newProxy.type}
                onChange={(e) => setNewProxy({...newProxy, type: e.target.value})}
                className="px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg focus:outline-none focus:border-blue-400"
                disabled={loading}
              >
                <option value="http">HTTP</option>
                <option value="https">HTTPS</option>
                <option value="socks4">SOCKS4</option>
                <option value="socks5">SOCKS5</option>
              </select>
              <input
                type="text"
                value={newProxy.username}
                onChange={(e) => setNewProxy({...newProxy, username: e.target.value})}
                placeholder="Username (optional)"
                className="px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg focus:outline-none focus:border-blue-400"
                disabled={loading}
              />
              <input
                type="password"
                value={newProxy.password}
                onChange={(e) => setNewProxy({...newProxy, password: e.target.value})}
                placeholder="Password (optional)"
                className="px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg focus:outline-none focus:border-blue-400"
                disabled={loading}
              />
              <input
                type="text"
                value={newProxy.country}
                onChange={(e) => setNewProxy({...newProxy, country: e.target.value})}
                placeholder="Country (optional)"
                className="px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg focus:outline-none focus:border-blue-400"
                disabled={loading}
              />
              <input
                type="text"
                value={newProxy.speed}
                onChange={(e) => setNewProxy({...newProxy, speed: e.target.value})}
                placeholder="Speed (optional)"
                className="px-4 py-2 bg-white bg-opacity-10 border border-white border-opacity-20 rounded-lg focus:outline-none focus:border-blue-400"
                disabled={loading}
              />
            </div>
            <div className="mt-4 flex space-x-3">
              <button
                onClick={addProxy}
                disabled={loading || !newProxy.url.trim()}
                className="glow-button flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Plus className="w-4 h-4" />
                <span>Add Proxy</span>
              </button>
              <button
                onClick={testAllProxies}
                disabled={loading}
                className="px-4 py-2 bg-yellow-600 bg-opacity-20 border border-yellow-500 rounded hover:bg-opacity-30 transition-colors flex items-center space-x-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                <span>Test All</span>
              </button>
            </div>
          </div>

          {/* Proxies List */}
          {stats && stats.proxies && (
            <div className="glass-panel p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  <span>Proxy Status</span>
                </h3>
                <button
                  onClick={resetCooldowns}
                  disabled={loading}
                  className="px-3 py-1 bg-yellow-600 bg-opacity-20 border border-yellow-500 rounded hover:bg-opacity-30 transition-colors text-sm flex items-center space-x-1"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  <span>Reset Cooldowns</span>
                </button>
              </div>

              <div className="space-y-3">
                {stats.proxies.map((proxy, index) => (
                  <motion.div
                    key={proxy.id}
                    className="border border-white border-opacity-10 rounded-lg p-4"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        {getStatusIcon(proxy)}
                        <div className="flex items-center space-x-2">
                          {getProxyTypeIcon(proxy.type)}
                          <div>
                            <div className="font-mono text-sm">{proxy.id}</div>
                            <div className="text-xs text-gray-400">{maskProxyUrl(proxy.url)}</div>
                            <div className="text-xs text-gray-500">
                              {proxy.country} • {proxy.speed} • {proxy.type.toUpperCase()}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-4">
                        <div className="text-right">
                          <div className={`text-sm font-medium ${getStatusColor(proxy)}`}>
                            {proxy.isActive ? (proxy.inCooldown ? 'Cooldown' : 'Active') : 'Disabled'}
                          </div>
                          <div className="text-xs text-gray-400">
                            Success: {proxy.successRate}
                          </div>
                          {proxy.responseTime > 0 && (
                            <div className="text-xs text-gray-400">
                              {proxy.responseTime}ms
                            </div>
                          )}
                        </div>
                        
                        <div className="text-right">
                          <div className="text-sm text-white">{proxy.totalRequests}</div>
                          <div className="text-xs text-gray-400">Requests</div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => testProxy(proxy.id)}
                            disabled={loading || testingProxy === proxy.id}
                            className="p-2 hover:bg-blue-600 hover:bg-opacity-20 rounded transition-colors"
                            title="Test proxy"
                          >
                            <RefreshCw className={`w-4 h-4 text-blue-400 ${testingProxy === proxy.id ? 'animate-spin' : ''}`} />
                          </button>
                          
                          <button
                            onClick={() => removeProxy(proxy.id)}
                            disabled={loading}
                            className="p-2 hover:bg-red-600 hover:bg-opacity-20 rounded transition-colors"
                            title="Remove proxy"
                          >
                            <Trash2 className="w-4 h-4 text-red-400" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {proxy.lastUsed && (
                      <div className="mt-2 text-xs text-gray-500">
                        Last used: {new Date(proxy.lastUsed).toLocaleString()}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Refresh Button */}
          <div className="mt-6 text-center">
            <button
              onClick={loadStats}
              disabled={loading}
              className="glass-panel px-4 py-2 hover:bg-white hover:bg-opacity-10 transition-colors flex items-center space-x-2 mx-auto"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh Stats</span>
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default ProxyManager
