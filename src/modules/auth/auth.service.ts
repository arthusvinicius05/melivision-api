import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { TokenResponseDto } from './dto/token-response.dto';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private tokenExpiry: Date | null = null;

  // App-level token from client_credentials grant. Used as a fallback when no
  // user-level token has been forwarded for the current request. ML now requires
  // a Bearer header on virtually every endpoint, so the fallback keeps public
  // tools (catalog search, trends, item lookups) working before the user signs in.
  private appAccessToken: string | null = null;
  private appTokenExpiry: Date | null = null;
  private appTokenInflight: Promise<string> | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  /**
   * Generates the authorization URL for OAuth 2.0 flow
   * Following ML best practices: using state parameter for security
   */
  getAuthorizationUrl(state?: string): string {
    const clientId = this.configService.get<string>('mercadolibre.clientId');
    const redirectUri = this.configService.get<string>('mercadolibre.redirectUri');
    const authUrl = this.configService.get<string>('mercadolibre.authUrl');

    // Generate secure random state if not provided
    const secureState = state || this.generateSecureState();

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state: secureState,
    });

    return `${authUrl}?${params.toString()}`;
  }

  /**
   * Exchanges authorization code for access token
   * Following ML OAuth 2.0 best practices
   */
  async exchangeCodeForToken(code: string): Promise<TokenResponseDto> {
    try {
      const tokenUrl = this.configService.get<string>('mercadolibre.tokenUrl');
      const clientId = this.configService.get<string>('mercadolibre.clientId');
      const clientSecret = this.configService.get<string>('mercadolibre.clientSecret');
      const redirectUri = this.configService.get<string>('mercadolibre.redirectUri');

      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      });

      const response = await firstValueFrom(
        this.httpService.post(tokenUrl, params.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
        }),
      );

      const tokenData = response.data;

      // Store tokens in memory (in production, use a proper token store)
      this.accessToken = tokenData.access_token;
      this.refreshToken = tokenData.refresh_token;
      this.tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);

      this.logger.log('Successfully exchanged authorization code for access token');

      return {
        access_token: tokenData.access_token,
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        scope: tokenData.scope,
        user_id: tokenData.user_id,
        refresh_token: tokenData.refresh_token,
      };
    } catch (error) {
      this.logger.error('Failed to exchange code for token', error.response?.data || error.message);
      throw new UnauthorizedException('Failed to obtain access token');
    }
  }

  /**
   * Refreshes the access token using refresh token
   * Important: ML recommends extending token expiration to keep integrations alive
   */
  async refreshAccessToken(refreshToken?: string): Promise<TokenResponseDto> {
    try {
      const tokenUrl = this.configService.get<string>('mercadolibre.tokenUrl');
      const clientId = this.configService.get<string>('mercadolibre.clientId');
      const clientSecret = this.configService.get<string>('mercadolibre.clientSecret');

      const tokenToRefresh = refreshToken || this.refreshToken;

      if (!tokenToRefresh) {
        throw new UnauthorizedException('No refresh token available');
      }

      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokenToRefresh,
      });

      const response = await firstValueFrom(
        this.httpService.post(tokenUrl, params.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Accept': 'application/json',
          },
        }),
      );

      const tokenData = response.data;

      // Update stored tokens
      this.accessToken = tokenData.access_token;
      this.refreshToken = tokenData.refresh_token;
      this.tokenExpiry = new Date(Date.now() + tokenData.expires_in * 1000);

      this.logger.log('Successfully refreshed access token');

      return {
        access_token: tokenData.access_token,
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        scope: tokenData.scope,
        user_id: tokenData.user_id,
        refresh_token: tokenData.refresh_token,
      };
    } catch (error) {
      this.logger.error('Failed to refresh token', error.response?.data || error.message);
      throw new UnauthorizedException('Failed to refresh access token');
    }
  }

  /**
   * Gets the current access token
   * Automatically refreshes if expired
   */
  async getAccessToken(): Promise<string> {
    if (!this.accessToken) {
      throw new UnauthorizedException('No access token available. Please authenticate first.');
    }

    // Check if token is expired and refresh if needed
    if (this.tokenExpiry && new Date() >= this.tokenExpiry && this.refreshToken) {
      this.logger.log('Access token expired, refreshing...');
      const newToken = await this.refreshAccessToken();
      return newToken.access_token;
    }

    return this.accessToken;
  }

  /**
   * Manually set access token (useful for testing or external token management)
   */
  setAccessToken(token: string, expiresIn?: number): void {
    this.accessToken = token;
    if (expiresIn) {
      this.tokenExpiry = new Date(Date.now() + expiresIn * 1000);
    }
  }

  /**
   * Check if currently authenticated
   */
  isAuthenticated(): boolean {
    return !!this.accessToken;
  }

  /**
   * Returns a Bearer token usable for requests that don't need a specific user
   * identity. Prefers the per-request user token (set by MlTokenMiddleware);
   * falls back to a cached client_credentials app token.
   */
  async getBearerToken(): Promise<string> {
    if (this.accessToken) {
      if (!this.tokenExpiry || new Date() < this.tokenExpiry) {
        return this.accessToken;
      }
      if (this.refreshToken) {
        const refreshed = await this.refreshAccessToken();
        return refreshed.access_token;
      }
    }
    return this.getAppAccessToken();
  }

  /**
   * Fetches and caches a client_credentials grant token. ML tokens are valid
   * for 6h; refresh a minute early to avoid races.
   */
  private async getAppAccessToken(): Promise<string> {
    if (
      this.appAccessToken &&
      this.appTokenExpiry &&
      new Date() < new Date(this.appTokenExpiry.getTime() - 60_000)
    ) {
      return this.appAccessToken;
    }
    if (this.appTokenInflight) return this.appTokenInflight;

    this.appTokenInflight = (async () => {
      const tokenUrl = this.configService.get<string>('mercadolibre.tokenUrl');
      const clientId = this.configService.get<string>('mercadolibre.clientId');
      const clientSecret = this.configService.get<string>('mercadolibre.clientSecret');

      if (!clientId || !clientSecret) {
        throw new UnauthorizedException(
          'ML_CLIENT_ID / ML_CLIENT_SECRET not configured — cannot fetch app token',
        );
      }

      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      });

      try {
        const response = await firstValueFrom(
          this.httpService.post(tokenUrl, params.toString(), {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Accept: 'application/json',
            },
          }),
        );
        this.appAccessToken = response.data.access_token;
        this.appTokenExpiry = new Date(Date.now() + response.data.expires_in * 1000);
        this.logger.log('Fetched client_credentials app token');
        return this.appAccessToken;
      } catch (error) {
        this.logger.error(
          'Failed to fetch client_credentials token',
          error.response?.data || error.message,
        );
        throw new UnauthorizedException('Failed to obtain app access token');
      } finally {
        this.appTokenInflight = null;
      }
    })();

    return this.appTokenInflight;
  }

  /**
   * Clear all tokens (logout)
   */
  clearTokens(): void {
    this.accessToken = null;
    this.refreshToken = null;
    this.tokenExpiry = null;
    this.logger.log('Tokens cleared');
  }

  /**
   * Generate secure random state for OAuth
   * Following ML security best practices
   */
  private generateSecureState(): string {
    return Math.random().toString(36).substring(2, 15) + 
           Math.random().toString(36).substring(2, 15);
  }
}
