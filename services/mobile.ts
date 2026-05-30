/**
 * Mobile Detection and Network Utilities
 * Handles device type detection and network connectivity for phones
 */

export interface NetworkInfo {
  isLocalNetwork: boolean;
  hostIP: string | null;
  hostname: string;
  port: number;
  protocol: 'http' | 'https';
}

export interface DeviceInfo {
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
  userAgent: string;
  platform: string;
}

/**
 * Detect if device is mobile or tablet
 */
export const detectDevice = (): DeviceInfo => {
  const userAgent = navigator.userAgent;

  // Mobile detection
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);

  // More specific mobile vs tablet detection
  const isTablet = /iPad|Android(?!.*Mobile)|Tablet/i.test(userAgent);
  const isActualMobile = isMobile && !isTablet;

  return {
    isMobile: isActualMobile,
    isTablet,
    isDesktop: !isMobile,
    userAgent,
    platform: navigator.platform
  };
};

/**
 * Get the current network information
 */
export const getNetworkInfo = (): NetworkInfo => {
  const hostname = window.location.hostname;
  const port = parseInt(window.location.port || '3000', 10);
  const protocol = (window.location.protocol === 'https:' ? 'https' : 'http') as 'http' | 'https';

  // Check if it's a local IP (not localhost)
  const isLocalNetwork = /^192\.168|^10\.|^172\.(1[6-9]|2[0-9]|3[01])\.|^localhost|^127\./.test(hostname);

  return {
    isLocalNetwork,
    hostIP: isLocalNetwork ? hostname : null,
    hostname,
    port,
    protocol
  };
};

/**
 * Generate the full URL for joining a room
 */
export const generateJoinURL = (roomCode: string): string => {
  const network = getNetworkInfo();
  const host = network.hostIP || network.hostname;
  const urlObj = new URL(`${network.protocol}://${host}:${network.port}`);

  // Add room code as query parameter for auto-join
  urlObj.searchParams.set('room', roomCode);
  urlObj.searchParams.set('mode', 'controller');

  return urlObj.toString();
};

/**
 * Extract room code from URL parameters
 */
export const extractRoomCodeFromURL = (): string | null => {
  const params = new URLSearchParams(window.location.search);
  return params.get('room');
};

/**
 * Extract mode from URL parameters (controller or screen)
 */
export const extractModeFromURL = (): 'controller' | 'screen' | null => {
  const params = new URLSearchParams(window.location.search);
  const mode = params.get('mode');

  if (mode === 'controller' || mode === 'screen') {
    return mode;
  }

  return null;
};

/**
 * Check if app is running on mobile via URL parameter
 */
export const isMobileAppMode = (): boolean => {
  const params = new URLSearchParams(window.location.search);
  return params.get('mobile') === 'true';
};

/**
 * Detect screen orientation (mobile only)
 */
export const getOrientation = (): 'portrait' | 'landscape' => {
  if (window.innerHeight > window.innerWidth) {
    return 'portrait';
  }
  return 'landscape';
};


/**
 * Request fullscreen for better mobile experience
 */
export const requestFullscreen = async (): Promise<void> => {
  const elem = document.documentElement;

  if (elem.requestFullscreen) {
    try {
      await elem.requestFullscreen();
    } catch (e) {
      console.log('Cannot enter fullscreen:', e);
    }
  }
};

/**
 * Check if notification permission is granted
 */
export const canNotify = (): boolean => {
  return 'Notification' in window && Notification.permission === 'granted';
};

/**
 * Request notification permission
 */
export const requestNotificationPermission = async (): Promise<boolean> => {
  if ('Notification' in window) {
    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (e) {
      console.log('Notification permission error:', e);
      return false;
    }
  }
  return false;
};

/**
 * Send a notification to the player
 */
export const sendNotification = (title: string, options?: NotificationOptions): Notification | null => {
  if (canNotify()) {
    return new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options
    });
  }
  return null;
};

/**
 * Get device fingerprint for unique player identification
 */
export const getDeviceFingerprint = (): string => {
  const timestamp = new Date().getTime().toString(36);
  const random = Math.random().toString(36).substring(2, 15);
  const userAgent = navigator.userAgent.split('').reduce((a, b) => {
    return ((a << 5) - a) + b.charCodeAt(0);
  }, 0).toString(36);

  return `${timestamp}-${random}-${userAgent}`;
};

/**
 * Check if device supports vibration
 */
export const supportsVibration = (): boolean => {
  return 'vibrate' in navigator;
};

/**
 * Trigger device vibration
 */
export const vibrate = (pattern: number | number[]): void => {
  if (supportsVibration()) {
    navigator.vibrate(pattern);
  }
};

/**
 * Log device and network info for debugging
 */
export const logDeviceInfo = (): void => {
  const device = detectDevice();
  const network = getNetworkInfo();

  console.log('[MOBILE] Device Info:', device);
  console.log('[MOBILE] Network Info:', network);
  console.log('[MOBILE] Join URL:', generateJoinURL('TEST'));
};
