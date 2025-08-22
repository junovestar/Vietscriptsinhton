/**
 * Progress Service - handles real-time progress updates
 */
export class ProgressService {
  constructor() {
    this.clients = new Map() // Store active connections
  }
  
  /**
   * Register a new client for progress updates
   */
  registerClient(clientId, sendUpdate) {
    this.clients.set(clientId, sendUpdate)
    console.log(`📡 Client ${clientId} registered for progress updates`)
  }
  
  /**
   * Unregister a client
   */
  unregisterClient(clientId) {
    this.clients.delete(clientId)
    console.log(`📡 Client ${clientId} unregistered`)
  }
  
  /**
   * Send progress update to a specific client
   */
  sendUpdate(clientId, progress) {
    const sendUpdate = this.clients.get(clientId)
    if (sendUpdate) {
      try {
        sendUpdate(progress)
      } catch (error) {
        console.error(`Failed to send update to client ${clientId}:`, error)
        this.unregisterClient(clientId)
      }
    }
  }
  
  /**
   * Create a progress callback for a specific client
   */
  createProgressCallback(clientId) {
    return (progress) => {
      this.sendUpdate(clientId, progress)
    }
  }
  
  /**
   * Get client count
   */
  getClientCount() {
    return this.clients.size
  }
}

// Global progress service instance
export const progressService = new ProgressService()
