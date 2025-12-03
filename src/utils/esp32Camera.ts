// src/utils/esp32Camera.ts

/**
 * ESP32-CAM Integration Module
 * Handles communication between web app and ESP32-CAM device
 */

export interface ESP32Config {
  ipAddress: string;
  port: number;
  streamEndpoint: string;
  captureEndpoint: string;
}

export interface ESP32Status {
  connected: boolean;
  streaming: boolean;
  lastPing: Date | null;
  deviceInfo?: {
    model: string;
    firmware: string;
    resolution: string;
  };
}

class ESP32CameraManager {
  private config: ESP32Config | null = null;
  private status: ESP32Status = {
    connected: false,
    streaming: false,
    lastPing: null,
  };
  private pingInterval: NodeJS.Timeout | null = null;
  private streamImage: HTMLImageElement | null = null;

  /**
   * Initialize connection to ESP32-CAM
   */
  async connect(config: ESP32Config): Promise<boolean> {
    this.config = config;
    
    try {
      // Test connection with ping
      const response = await fetch(
        `http://${config.ipAddress}:${config.port}/status`,
        {
          method: 'GET',
          mode: 'cors',
          signal: AbortSignal.timeout(5000),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to connect to ESP32-CAM');
      }

      const deviceInfo = await response.json();
      
      this.status = {
        connected: true,
        streaming: false,
        lastPing: new Date(),
        deviceInfo,
      };

      // Start periodic health check
      this.startHealthCheck();
      
      console.log('✅ ESP32-CAM connected:', deviceInfo);
      return true;
      
    } catch (error) {
      console.error('❌ ESP32-CAM connection failed:', error);
      this.status.connected = false;
      return false;
    }
  }

  /**
   * Disconnect from ESP32-CAM
   */
  disconnect(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    this.stopStream();
    this.status.connected = false;
    this.config = null;
    
    console.log('ESP32-CAM disconnected');
  }

  /**
   * Start video stream from ESP32-CAM
   */
  async startStream(imgElement: HTMLImageElement): Promise<boolean> {
    if (!this.config || !this.status.connected) {
      throw new Error('ESP32-CAM not connected');
    }

    try {
      this.streamImage = imgElement;
      const streamUrl = `http://${this.config.ipAddress}:${this.config.port}${this.config.streamEndpoint}`;
      
      // ESP32-CAM typically streams MJPEG
      imgElement.src = streamUrl;
      
      // Wait for image to load
      await new Promise<void>((resolve, reject) => {
        imgElement.onload = () => {
          this.status.streaming = true;
          console.log('✅ ESP32-CAM stream started');
          resolve();
        };
        imgElement.onerror = () => {
          reject(new Error('Failed to load stream'));
        };
      });

      return true;
      
    } catch (error) {
      console.error('❌ Failed to start stream:', error);
      this.status.streaming = false;
      return false;
    }
  }

  /**
   * Stop video stream
   */
  stopStream(): void {
    if (this.streamImage) {
      this.streamImage.src = '';
      this.streamImage = null;
    }
    this.status.streaming = false;
  }

  /**
   * Capture single frame from ESP32-CAM
   */
  async captureFrame(): Promise<Blob | null> {
    if (!this.config || !this.status.connected) {
      throw new Error('ESP32-CAM not connected');
    }

    try {
      const captureUrl = `http://${this.config.ipAddress}:${this.config.port}${this.config.captureEndpoint}`;
      
      const response = await fetch(captureUrl, {
        method: 'GET',
        signal: AbortSignal.timeout(10000),
      });

      if (!response.ok) {
        throw new Error('Failed to capture frame');
      }

      const blob = await response.blob();
      console.log('📸 Frame captured from ESP32-CAM');
      
      return blob;
      
    } catch (error) {
      console.error('❌ Frame capture failed:', error);
      return null;
    }
  }

  /**
   * Capture frame and convert to canvas for face detection
   */
  async captureToCanvas(canvas: HTMLCanvasElement): Promise<boolean> {
    const blob = await this.captureFrame();
    if (!blob) return false;

    try {
      const img = new Image();
      const url = URL.createObjectURL(blob);

      await new Promise<void>((resolve, reject) => {
        img.onload = () => {
          canvas.width = img.width;
          canvas.height = img.height;
          
          const ctx = canvas.getContext('2d');
          if (ctx) {
            ctx.drawImage(img, 0, 0);
            URL.revokeObjectURL(url);
            resolve();
          } else {
            reject(new Error('Failed to get canvas context'));
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = url;
      });

      return true;
      
    } catch (error) {
      console.error('❌ Canvas conversion failed:', error);
      return false;
    }
  }

  /**
   * Get current status
   */
  getStatus(): ESP32Status {
    return { ...this.status };
  }

  /**
   * Test if device is reachable
   */
  async testConnection(ipAddress: string, port: number): Promise<boolean> {
    try {
      const response = await fetch(
        `http://${ipAddress}:${port}/status`,
        {
          method: 'GET',
          mode: 'cors',
          signal: AbortSignal.timeout(5000),
        }
      );
      
      return response.ok;
    } catch {
      return false;
    }
  }

  /**
   * Scan network for ESP32-CAM devices
   */
  async scanNetwork(baseIP: string): Promise<string[]> {
    const devices: string[] = [];
    const subnet = baseIP.split('.').slice(0, 3).join('.');
    const scanPromises: Promise<void>[] = [];

    // Scan last octet from 1-254
    for (let i = 1; i <= 254; i++) {
      const ip = `${subnet}.${i}`;
      
      scanPromises.push(
        this.testConnection(ip, this.config?.port || 80)
          .then((reachable) => {
            if (reachable) {
              devices.push(ip);
              console.log(`📡 Found device at ${ip}`);
            }
          })
          .catch(() => {}) // Ignore errors
      );
    }

    await Promise.allSettled(scanPromises);
    return devices;
  }

  /**
   * Configure camera settings
   */
  async configureCamera(settings: {
    brightness?: number;
    contrast?: number;
    quality?: number;
  }): Promise<boolean> {
    if (!this.config || !this.status.connected) {
      throw new Error('ESP32-CAM not connected');
    }

    try {
      const response = await fetch(
        `http://${this.config.ipAddress}:${this.config.port}/control`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(settings),
          signal: AbortSignal.timeout(5000),
        }
      );

      return response.ok;
    } catch (error) {
      console.error('Failed to configure camera:', error);
      return false;
    }
  }

  /**
   * Periodic health check
   */
  private startHealthCheck(): void {
    this.pingInterval = setInterval(async () => {
      if (!this.config) return;

      try {
        const response = await fetch(
          `http://${this.config.ipAddress}:${this.config.port}/ping`,
          { signal: AbortSignal.timeout(3000) }
        );

        if (response.ok) {
          this.status.lastPing = new Date();
        } else {
          throw new Error('Ping failed');
        }
      } catch {
        console.warn('ESP32-CAM health check failed');
        this.status.connected = false;
        if (this.pingInterval) {
          clearInterval(this.pingInterval);
          this.pingInterval = null;
        }
      }
    }, 10000); // Check every 10 seconds
  }
}

// Export singleton instance
export const esp32Camera = new ESP32CameraManager();

/**
 * React Hook for ESP32-CAM
 */
import { useState, useEffect } from 'react';

export const useESP32Camera = () => {
  const [status, setStatus] = useState<ESP32Status>(esp32Camera.getStatus());

  useEffect(() => {
    const interval = setInterval(() => {
      setStatus(esp32Camera.getStatus());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return {
    status,
    connect: esp32Camera.connect.bind(esp32Camera),
    disconnect: esp32Camera.disconnect.bind(esp32Camera),
    startStream: esp32Camera.startStream.bind(esp32Camera),
    stopStream: esp32Camera.stopStream.bind(esp32Camera),
    captureFrame: esp32Camera.captureFrame.bind(esp32Camera),
    captureToCanvas: esp32Camera.captureToCanvas.bind(esp32Camera),
    testConnection: esp32Camera.testConnection.bind(esp32Camera),
    scanNetwork: esp32Camera.scanNetwork.bind(esp32Camera),
    configureCamera: esp32Camera.configureCamera.bind(esp32Camera),
  };
};