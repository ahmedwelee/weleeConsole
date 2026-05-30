/**
 * Server-based communication service for cross-device play
 * Uses localStorage + polling for same-browser communication
 * Or HTTP for cross-device communication
 */

interface Message {
  type: string;
  payload: any;
  senderId: string;
  timestamp: number;
  id?: string; // Unique ID to prevent duplicate processing
}

interface RoomState {
  roomCode: string;
  players: any[];
  gameState: any;
  hostId: string;
}

class CrossDeviceService {
  private storageKey = 'gemini_room_data';
  private messagesKey = 'gemini_messages';
  private roomCode: string | null = null;
  private listeners: ((msg: Message) => void)[] = [];
  private pollingInterval: number | null = null;
  private lastMessageTimestamp = 0;
  private processedMessageIds = new Set<string>(); // Track processed messages to avoid duplicates

  /**
   * Initialize for a specific room
   */
  initializeRoom(roomCode: string) {
    this.roomCode = roomCode;
    console.log('[CROSS-DEVICE] Initialized for room:', roomCode);

    // Start polling for messages
    this.startPolling();
  }

  /**
   * Start polling for new messages
   */
  private startPolling() {
    if (this.pollingInterval) clearInterval(this.pollingInterval as any);

    this.pollingInterval = window.setInterval(() => {
      this.checkForNewMessages();
    }, 500) as any; // Poll every 500ms
  }

  /**
   * Check localStorage for new messages
   */
  private checkForNewMessages() {
    try {
      const messagesData = localStorage.getItem(this.messagesKey);
      if (!messagesData) return;

      const messages: Message[] = JSON.parse(messagesData);
      const newMessages = messages.filter(msg => msg.timestamp > this.lastMessageTimestamp);

      newMessages.forEach(msg => {
        // Deduplicate: skip if we've already processed this message
        const messageId = msg.id || `${msg.type}_${msg.senderId}_${msg.timestamp}`;
        if (this.processedMessageIds.has(messageId)) {
          console.log('[CROSS-DEVICE] Message already processed, skipping:', messageId);
          return;
        }

        this.lastMessageTimestamp = Math.max(this.lastMessageTimestamp, msg.timestamp);
        this.processedMessageIds.add(messageId);

        // Keep processed ID set from growing forever - clear old entries after 1000 IDs
        if (this.processedMessageIds.size > 1000) {
          const idsArray = Array.from(this.processedMessageIds);
          this.processedMessageIds = new Set(idsArray.slice(-500));
        }

        this.listeners.forEach(cb => cb(msg));
      });
    } catch (err) {
      console.error('[CROSS-DEVICE] Error checking messages:', err);
    }
  }

  /**
   * Send a message to the room
   */
  send(type: string, payload: any, senderId: string, messageId?: string) {
    const id = messageId || `${type}_${senderId}_${Date.now()}`;
    const message: Message = {
      type,
      payload,
      senderId,
      timestamp: Date.now(),
      id
    };

    try {
      // Get existing messages
      const messagesData = localStorage.getItem(this.messagesKey);
      const messages: Message[] = messagesData ? JSON.parse(messagesData) : [];

      // Add new message
      messages.push(message);

      // Keep only last 100 messages to prevent storage overflow
      const recentMessages = messages.slice(-100);

      // Save back
      localStorage.setItem(this.messagesKey, JSON.stringify(recentMessages));

      console.log('[CROSS-DEVICE] Message sent:', { type, senderId, timestamp: message.timestamp, id });
    } catch (err) {
      console.error('[CROSS-DEVICE] Error sending message:', err);
    }
  }

  /**
   * Subscribe to messages
   */
  subscribe(callback: (msg: Message) => void) {
    this.listeners.push(callback);
    console.log('[CROSS-DEVICE] Listener added, total:', this.listeners.length);

    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Save room state
   */
  saveRoomState(roomCode: string, state: any, hostId: string) {
    try {
      const roomData: RoomState = {
        roomCode,
        players: state.players || [],
        gameState: state,
        hostId
      };
      localStorage.setItem(this.storageKey, JSON.stringify(roomData));
      console.log('[CROSS-DEVICE] Room state saved:', { roomCode, players: roomData.players.length });
    } catch (err) {
      console.error('[CROSS-DEVICE] Error saving room state:', err);
    }
  }

  /**
   * Get room state
   */
  getRoomState(): RoomState | null {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (err) {
      console.error('[CROSS-DEVICE] Error getting room state:', err);
      return null;
    }
  }

  /**
   * Clear all data for a room
   */
  clearRoomData() {
    try {
      localStorage.removeItem(this.storageKey);
      localStorage.removeItem(this.messagesKey);
      this.processedMessageIds.clear();
      this.lastMessageTimestamp = 0;
      console.log('[CROSS-DEVICE] Room data cleared');
    } catch (err) {
      console.error('[CROSS-DEVICE] Error clearing data:', err);
    }
  }

  /**
   * Stop polling
   */
  stopPolling() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval as any);
      this.pollingInterval = null;
    }
  }

  /**
   * Get listener count (for debugging)
   */
  getListenerCount(): number {
    return this.listeners.length;
  }

  /**
   * Log debug info
   */
  logDebugInfo() {
    const roomState = this.getRoomState();
    const messagesData = localStorage.getItem(this.messagesKey);
    const messages = messagesData ? JSON.parse(messagesData) : [];

    console.log('[CROSS-DEVICE DEBUG]', {
      roomCode: this.roomCode,
      listeners: this.listeners.length,
      roomState,
      messageCount: messages.length,
      processedIds: this.processedMessageIds.size,
      pollingActive: this.pollingInterval !== null
    });
  }
}

export const crossDeviceService = new CrossDeviceService();
