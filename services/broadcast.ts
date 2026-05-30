
import { BroadcastMessage } from '../types';
import { crossDeviceService } from './crossDevice';

const CHANNEL_NAME = 'gemini_air_console';

class BroadcastService {
  private channel: BroadcastChannel;
  private listeners: ((msg: BroadcastMessage) => void)[] = [];

  constructor() {
    try {
      this.channel = new BroadcastChannel(CHANNEL_NAME);
      this.channel.onmessage = (event) => {
        this.listeners.forEach(cb => cb(event.data));
      };
    } catch (err) {
      console.warn('[BROADCAST] BroadcastChannel not available (phone?), using fallback only:', err);
      this.channel = null as any;
    }
  }

  send(type: string, payload: any, senderId: string, messageId?: string) {
    const id = messageId || `${type}_${senderId}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const msg = { type, payload, senderId, id, timestamp: Date.now() };

     // Post to same-browser BroadcastChannel (if available)
     if (this.channel) {
       try {
         this.channel.postMessage(msg);
       } catch (err) {
         console.warn('[BROADCAST] BroadcastChannel.postMessage failed:', err);
       }
     }

     // Immediately invoke local listeners (so same tab gets messages)
     // This is important because BroadcastChannel may not deliver to sender
     this.listeners.forEach(cb => cb(msg));

     // Forward to cross-device service for phones/other devices via localStorage
     // Skip SYNC_STATE since we handle it separately in App.tsx
    if (type !== 'SYNC_STATE') {
      try {
        crossDeviceService.send(type, payload, senderId, id);
      } catch (err) {
        console.warn('[BROADCAST] crossDeviceService.send failed:', err);
      }
     }
   }

  subscribe(callback: (msg: BroadcastMessage) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(cb => cb !== callback);
    };
  }

  /**
   * Dispatch message to local listeners only (no broadcasting or cross-device send)
   * Used internally to avoid loops when rebroadcasting from cross-device messages
   */
  dispatchToListeners(msg: BroadcastMessage) {
    this.listeners.forEach(cb => cb(msg));
  }

  close() {
    this.channel.close();
  }
}

export const broadcast = new BroadcastService();
