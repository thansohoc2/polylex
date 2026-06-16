import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import axios from 'axios';

export interface YouTubeSearchCandidate {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  thumbnailUrl: string;
  durationSeconds?: number;
}

/**
 * Wrapper for YouTube Data API v3.
 * Queries video candidates for AI re-ranking.
 * Fail-safe: returns empty array on error, doesn't block path creation.
 */
@Injectable()
export class YouTubeService {
  private readonly logger = new Logger(YouTubeService.name);
  private readonly apiKey: string | undefined;
  private readonly baseUrl = 'https://www.googleapis.com/youtube/v3';

  constructor() {
    this.apiKey = process.env.YOUTUBE_API_KEY;
  }

  isEnabled(): boolean {
    return !!this.apiKey;
  }

  /**
   * Search for YouTube videos matching a query.
   * Applies strict filters: videoEmbeddable, safeSearch, videoDuration, relevanceLanguage.
   *
   * @param query Search query (e.g. "basic family vocabulary Spanish A1")
   * @param targetLanguageCode Language code (e.g. "es", "fr")
   * @returns Array of video candidates, up to 10
   */
  async search(
    query: string,
    targetLanguageCode: string,
  ): Promise<YouTubeSearchCandidate[]> {
    if (!this.apiKey) {
      this.logger.warn('YOUTUBE_API_KEY not set, returning empty results');
      return [];
    }

    try {
      // Step 1: search.list to find videos
      const searchResponse = await axios.get(`${this.baseUrl}/search`, {
        params: {
          key: this.apiKey,
          q: query,
          part: 'snippet',
          type: 'video',
          videoEmbeddable: true,
          safeSearch: 'strict',
          relevanceLanguage: targetLanguageCode,
          videoDuration: 'medium', // 4-20 minutes
          maxResults: 10,
          regionCode: this.languageToRegion(targetLanguageCode),
        },
      });

      const videoIds = searchResponse.data.items?.map((item: any) => item.id.videoId) || [];

      if (videoIds.length === 0) {
        return [];
      }

      // Step 2: videos.list to get duration + embeddable status confirmation
      const videosResponse = await axios.get(`${this.baseUrl}/videos`, {
        params: {
          key: this.apiKey,
          id: videoIds.join(','),
          part: 'contentDetails,status',
          maxResults: 10,
        },
      });

      const videos = videosResponse.data.items || [];
      const videoDetailsMap = new Map(
        videos.map((v: any) => [v.id, v]),
      );

      // Map search results with duration info
      return searchResponse.data.items
        .filter((item: any) => {
          const videoId = item.id.videoId;
          const details: any = videoDetailsMap.get(videoId);
          // Only include if embeddable status is true/available
          return details?.status?.embeddable !== false;
        })
        .map((item: any) => {
          const videoId = item.id.videoId;
          const details: any = videoDetailsMap.get(videoId);
          const duration = this.parseDuration(details?.contentDetails?.duration);

          return {
            videoId,
            title: item.snippet.title,
            description: item.snippet.description || '',
            channelTitle: item.snippet.channelTitle,
            thumbnailUrl: item.snippet.thumbnails?.high?.url || item.snippet.thumbnails?.default?.url || '',
            durationSeconds: duration,
          };
        });
    } catch (err) {
      this.logger.error(`YouTube search error for query "${query}":`, err);
      return [];
    }
  }

  private languageToRegion(languageCode: string): string {
    // Map language codes to typical region codes for better results
    const map: Record<string, string> = {
      en: 'US',
      es: 'ES',
      fr: 'FR',
      de: 'DE',
      pt: 'BR',
      ja: 'JP',
      zh: 'CN',
      ko: 'KR',
      vi: 'VN',
      it: 'IT',
      ru: 'RU',
      ar: 'SA',
      hi: 'IN',
      th: 'TH',
    };
    return map[languageCode] || 'US';
  }

  /**
   * Parse ISO 8601 duration string to seconds.
   * Example: PT4M30S -> 270 seconds
   */
  private parseDuration(isoDuration?: string): number | undefined {
    if (!isoDuration) return undefined;

    const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
    const match = isoDuration.match(regex);

    if (!match) return undefined;

    const hours = parseInt(match[1], 10) || 0;
    const minutes = parseInt(match[2], 10) || 0;
    const seconds = parseInt(match[3], 10) || 0;

    return hours * 3600 + minutes * 60 + seconds;
  }
}
