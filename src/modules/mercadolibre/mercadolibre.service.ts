import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';
import { AuthService } from '../auth/auth.service';

// Strip undefined/null/''/NaN so Nest's ValidationPipe coercion doesn't leak
// sentinel values into ML query strings. With `enableImplicitConversion: true`,
// a missing `@Query('offset') offset?: number` arrives as NaN — which axios
// would serialize as `?offset=NaN`, and ML rejects it with a 400.
function cleanParams(
  params: Record<string, any> | undefined,
): Record<string, any> | undefined {
  if (!params) return undefined;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    if (typeof v === 'number' && Number.isNaN(v)) continue;
    out[k] = v;
  }
  return out;
}

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
    const url = `${this.apiBase}${endpoint}`;
    try {
      // ML now requires a Bearer header on virtually every endpoint (April 2025
      // policy). Use the per-request user token if forwarded; otherwise fall
      // back to a cached client_credentials app token.
      const accessToken = await this.authService.getBearerToken();

      const config: AxiosRequestConfig = {
        ...options,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...options.headers,
        },
      };

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
      params: cleanParams(params),
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
