type CacheEntry = {
  url: string;
  timestamp: number;
  data: string;
};

class ImagePreviewCache {
  private static instance: ImagePreviewCache;
  private cache: Map<string, CacheEntry>;
  private readonly maxSize: number;
  private readonly expirationTime: number;

  private constructor() {
    this.cache = new Map();
    this.maxSize = 50; // Maximum number of cached previews
    this.expirationTime = 30 * 60 * 1000; // 30 minutes
  }

  public static getInstance(): ImagePreviewCache {
    if (!ImagePreviewCache.instance) {
      ImagePreviewCache.instance = new ImagePreviewCache();
    }
    return ImagePreviewCache.instance;
  }

  public set(key: string, imageData: string): void {
    // Clear expired entries before adding new ones
    this.clearExpired();

    // If cache is full, remove oldest entry
    if (this.cache.size >= this.maxSize) {
      const oldestKey = Array.from(this.cache.entries())
        .sort(([, a], [, b]) => a.timestamp - b.timestamp)[0][0];
      this.cache.delete(oldestKey);
    }

    this.cache.set(key, {
      url: imageData,
      timestamp: Date.now(),
      data: imageData
    });
  }

  public get(key: string): string | null {
    const entry = this.cache.get(key);
    
    if (!entry) return null;

    // Check if entry is expired
    if (Date.now() - entry.timestamp > this.expirationTime) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  private clearExpired(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.expirationTime) {
        this.cache.delete(key);
      }
    }
  }

  public generateKey(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }
}

export const imageCache = ImagePreviewCache.getInstance();
