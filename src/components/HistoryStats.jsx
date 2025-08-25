import React from 'react'
import { motion } from 'framer-motion'
import { History, FileText, Package, BarChart3, CheckCircle, XCircle, AlertTriangle } from 'lucide-react'

const HistoryStats = ({ stats, onClick }) => {
  if (stats.total === 0) return null

  const formatNumber = (num) => {
    if (num > 1000000) return `${(num / 1000000).toFixed(1)}M`
    if (num > 1000) return `${(num / 1000).toFixed(1)}K`
    return num.toString()
  }

  return (
    <motion.div
      className="glass-panel px-4 py-2 cursor-pointer hover:bg-white hover:bg-opacity-10 transition-all duration-300"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center space-x-3">
        <History className="w-5 h-5 text-blue-400" />
        
        <div className="flex items-center space-x-4 text-sm">
          <div className="flex items-center space-x-1">
            <span className="text-white font-medium">{stats.total}</span>
            <span className="text-gray-400">tổng</span>
          </div>
          
          {stats.single > 0 && (
            <div className="flex items-center space-x-1">
              <FileText className="w-3 h-3 text-green-400" />
              <span className="text-green-400">{stats.single}</span>
            </div>
          )}
          
          {stats.batch > 0 && (
            <div className="flex items-center space-x-1">
              <Package className="w-3 h-3 text-blue-400" />
              <span className="text-blue-400">{stats.batch}</span>
            </div>
          )}
          
          {stats.success > 0 && (
            <div className="flex items-center space-x-1">
              <CheckCircle className="w-3 h-3 text-green-400" />
              <span className="text-green-400">{stats.success}</span>
            </div>
          )}
          
          {stats.error > 0 && (
            <div className="flex items-center space-x-1">
              <XCircle className="w-3 h-3 text-red-400" />
              <span className="text-red-400">{stats.error}</span>
            </div>
          )}
          
          {stats.partial > 0 && (
            <div className="flex items-center space-x-1">
              <AlertTriangle className="w-3 h-3 text-yellow-400" />
              <span className="text-yellow-400">{stats.partial}</span>
            </div>
          )}
          
          <div className="flex items-center space-x-1">
            <BarChart3 className="w-3 h-3 text-cyan-400" />
            <span className="text-cyan-400">{formatNumber(stats.totalCharacters)}</span>
            <span className="text-gray-400 text-xs">ký tự</span>
          </div>
        </div>
        
        {stats.total > 0 && (
          <div className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
            {stats.total}
          </div>
        )}
      </div>
    </motion.div>
  )
}

export default HistoryStats
