// --- 📦 REALTIME TRANSACTION SERVICE ---
// embracingearth.space - Real-time transaction notification service
// Handles WebSocket connections and broadcasts transaction updates to frontend
// Architecture: Centralized service for real-time transaction updates across all connectors

import { EventEmitter } from 'events';
import { StandardTransaction } from '../types/connector';

/**
 * RealtimeTransactionService
 * 
 * Architecture Notes:
 * - Uses EventEmitter pattern for decoupled event handling
 * - Supports WebSocket (via Socket.io) and Server-Sent Events (SSE)
 * - User-specific rooms for privacy and isolation
 * - Extensible for future connectors
 * - Handles connection management and reconnection
 * 
 * Flow:
 * 1. Transaction webhook received → processTransaction()
 * 2. Transaction normalized and stored
 * 3. Event emitted to user's room
 * 4. Frontend receives update via WebSocket/SSE
 * 5. UI updates instantly
 */
export class RealtimeTransactionService extends EventEmitter {
  private userRooms: Map<string, Set<string>> = new Map(); // userId -> Set of socket IDs
  private socketServer: any = null; // Socket.io server instance
  private maxConnectionsPerUser: number = parseInt(process.env.MAX_WEBSOCKET_CONNECTIONS_PER_USER || '10', 10); // Security: Limit connections per user

  /**
   * Initialize with Socket.io server
   * Architecture: Socket.io server passed from main server
   */
  initialize(socketServer: any): void {
    this.socketServer = socketServer;
    this.setupSocketHandlers();
    console.log('✅ RealtimeTransactionService initialized');
  }

  /**
   * Setup Socket.io connection handlers
   * Architecture: Handles authentication, room joining, and disconnection
   */
  private setupSocketHandlers(): void {
    if (!this.socketServer) return;

    this.socketServer.on('connection', (socket: any) => {
      console.log('🔌 Client connected:', socket.id);

      // Authenticate and join user room
      // Architecture: JWT verification required for security - prevents user impersonation
      socket.on('authenticate', async (data: { userId: string; token: string }) => {
        try {
          if (!data.userId || !data.token) {
            socket.emit('error', { message: 'User ID and token required' });
            return;
          }

          // Verify JWT token
          const jwt = require('jsonwebtoken');
          const jwtSecret = process.env.JWT_SECRET;
          
          if (!jwtSecret) {
            console.error('⚠️ JWT_SECRET not configured - WebSocket authentication disabled');
            socket.emit('error', { message: 'Authentication service error' });
            return;
          }

          let decoded: any;
          try {
            decoded = jwt.verify(data.token, jwtSecret);
          } catch (jwtError: any) {
            console.warn('Invalid JWT token for WebSocket:', jwtError.message);
            socket.emit('error', { message: 'Invalid or expired token' });
            return;
          }

          // Verify userId matches token (prevent impersonation)
          const tokenUserId = decoded.userId || decoded.id || decoded.sub;
          if (tokenUserId !== data.userId) {
            console.warn('⚠️ User ID mismatch in WebSocket authentication', {
              provided: data.userId,
              token: tokenUserId
            });
            socket.emit('error', { message: 'User ID mismatch' });
            return;
          }

          // Security: Verify token is not expired and has valid structure
          if (decoded.exp && decoded.exp < Date.now() / 1000) {
            socket.emit('error', { message: 'Token expired' });
            return;
          }

          // Security: Check connection limit per user (prevent resource exhaustion)
          const currentConnections = this.getUserSocketsCount(data.userId);
          if (currentConnections >= this.maxConnectionsPerUser) {
            console.warn(`⚠️ User ${data.userId} exceeded connection limit (${this.maxConnectionsPerUser})`);
            socket.emit('error', { 
              message: 'Connection limit reached',
              code: 'CONNECTION_LIMIT',
              limit: this.maxConnectionsPerUser
            });
            socket.disconnect();
            return;
          }

          // All checks passed - join user-specific room
          socket.join(`user:${data.userId}`);
          
          // Track socket in user room
          if (!this.userRooms.has(data.userId)) {
            this.userRooms.set(data.userId, new Set());
          }
          this.userRooms.get(data.userId)!.add(socket.id);

          socket.userId = data.userId;
          socket.emit('authenticated', { userId: data.userId });

          console.log(`✅ User ${data.userId} authenticated via JWT, socket ${socket.id} joined room (${currentConnections + 1}/${this.maxConnectionsPerUser})`);
        } catch (error: any) {
          console.error('Authentication error:', error);
          socket.emit('error', { message: 'Authentication failed' });
        }
      });

      // Handle disconnect
      socket.on('disconnect', () => {
        const userId = socket.userId;
        if (userId && this.userRooms.has(userId)) {
          this.userRooms.get(userId)!.delete(socket.id);
          if (this.userRooms.get(userId)!.size === 0) {
            this.userRooms.delete(userId);
          }
        }
        console.log('🔌 Client disconnected:', socket.id);
      });

      // Ping/pong for connection health
      socket.on('ping', () => {
        socket.emit('pong');
      });
    });
  }

  /**
   * Notify frontend of new transaction
   * Architecture: Emits to user's room, all connected clients receive update
   */
  async notifyTransaction(userId: string, transaction: StandardTransaction): Promise<void> {
    if (!this.socketServer) {
      console.warn('⚠️ Socket server not initialized, skipping real-time notification');
      return;
    }

    try {
      // Emit to user's room
      this.socketServer.to(`user:${userId}`).emit('transaction:new', {
        transaction,
        timestamp: new Date().toISOString(),
        source: 'realtime'
      });

      // Also emit via EventEmitter for internal listeners
      this.emit('transaction:new', { userId, transaction });

      console.log(`📨 Notified user ${userId} of new transaction: ${transaction.transactionId}`);
    } catch (error) {
      console.error('Error notifying transaction:', error);
    }
  }

  /**
   * Notify frontend of transaction update
   */
  async notifyTransactionUpdate(userId: string, transaction: StandardTransaction): Promise<void> {
    if (!this.socketServer) return;

    try {
      this.socketServer.to(`user:${userId}`).emit('transaction:updated', {
        transaction,
        timestamp: new Date().toISOString()
      });

      this.emit('transaction:updated', { userId, transaction });
    } catch (error) {
      console.error('Error notifying transaction update:', error);
    }
  }

  /**
   * Notify frontend of sync completion
   */
  async notifySyncComplete(userId: string, connectionId: string, stats: {
    totalTransactions: number;
    newTransactions: number;
  }): Promise<void> {
    if (!this.socketServer) return;

    try {
      this.socketServer.to(`user:${userId}`).emit('sync:complete', {
        connectionId,
        stats,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error notifying sync complete:', error);
    }
  }

  /**
   * Get connected users count
   */
  getConnectedUsersCount(): number {
    return this.userRooms.size;
  }

  /**
   * Get sockets count for a user
   */
  getUserSocketsCount(userId: string): number {
    return this.userRooms.get(userId)?.size || 0;
  }

  /**
   * Check if user is connected
   */
  isUserConnected(userId: string): boolean {
    return this.userRooms.has(userId) && this.userRooms.get(userId)!.size > 0;
  }
}

// Singleton instance
export const realtimeTransactionService = new RealtimeTransactionService();

