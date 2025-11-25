import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';
import { AuthService } from '../auth/auth.service';

@Injectable()
export class MercadolibreService {
  private readonly logger = new Logger(MercadolibreService.name);
  private readonly apiBase: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly authService: AuthService,
  ) {
    this.apiBase = this.configService.get<string>('mercadolibre.apiBase');
  }

  /**
   * Make authenticated request to Mercado Libre API
   * Automatically adds access token to requests
   */
  async request<T = any>(endpoint: string, options: AxiosRequestConfig = {}): Promise<T> {
    try {
      const url = `${this.apiBase}${endpoint}`;

      // Try to get access token, but don't fail if not available
      let accessToken: string | null = null;
      try {
        if (this.authService.isAuthenticated()) {
          accessToken = await this.authService.getAccessToken();
        }
      } catch (error) {
        // No token available, will make request without auth
        this.logger.debug('No access token available, making unauthenticated request');
      }

      const config: AxiosRequestConfig = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      };

      // Add authorization header only if token is available
      if (accessToken) {
        config.headers['Authorization'] = `Bearer ${accessToken}`;
      }

      this.logger.debug(`Making request to: ${url}`);

      const response = await firstValueFrom(
        this.httpService.request<T>({
          ...config,
          url,
        }),
      );

      return response.data;
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  /**
   * Make GET request
   */
  async get<T = any>(endpoint: string, params?: Record<string, any>): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      params,
    });
  }

  /**
   * Make POST request
   */
  async post<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      data,
    });
  }

  /**
   * Make PUT request
   */
  async put<T = any>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      data,
    });
  }

  /**
   * Make DELETE request
   */
  async delete<T = any>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }

  /**
   * Handle API errors with proper logging and error transformation
   */
  private handleError(error: any, endpoint: string): never {
    const statusCode = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
    const errorMessage = error.response?.data?.message || error.message;
    const errorDetails = error.response?.data;

    this.logger.error(
      `API Error on ${endpoint}: ${errorMessage}`,
      error.response?.data || error.message,
    );

    // Handle specific ML API errors
    if (statusCode === 401) {
      throw new HttpException(
        {
          statusCode: 401,
          message: 'Authentication failed. Please check your credentials or refresh your token.',
          error: 'Unauthorized',
          details: errorDetails,
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (statusCode === 429) {
      throw new HttpException(
        {
          statusCode: 429,
          message: 'Rate limit exceeded. Please try again later.',
          error: 'Too Many Requests',
          details: errorDetails,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (statusCode === 404) {
      throw new HttpException(
        {
          statusCode: 404,
          message: 'Resource not found',
          error: 'Not Found',
          details: errorDetails,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    // Generic error
    throw new HttpException(
      {
        statusCode,
        message: errorMessage || 'An error occurred while processing your request',
        error: error.response?.statusText || 'Internal Server Error',
        details: errorDetails,
      },
      statusCode,
    );
  }

  /**
   * Build query string from params
   */
  buildQueryString(params: Record<string, any>): string {
    const filteredParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    const searchParams = new URLSearchParams(filteredParams as any);
    return searchParams.toString();
  }
}
