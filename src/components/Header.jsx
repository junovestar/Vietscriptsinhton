import React from 'react'
import { motion } from 'framer-motion'

const Header = () => {
  return (
    <motion.header 
      className="text-center py-8"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8 }}
    >
      <div className="glass-panel inline-block px-8 py-4 mx-4">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-glow to-accent-cyan bg-clip-text text-transparent">
          Binh Luan Generate By Thành MKT
        </h1>
        <p className="text-gray-300 mt-2">
          AI-powered YouTube Comment Generator
        </p>
      </div>
    </motion.header>
  )
}

export default Header
