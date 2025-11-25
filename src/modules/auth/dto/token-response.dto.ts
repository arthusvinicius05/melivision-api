import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsOptional } from 'class-validator';

export class TokenResponseDto {
  @ApiProperty({
    description: 'Access token for API authentication',
    example: 'APP_USR-1234567890-123456-abcdef1234567890abcdef1234567890-123456789',
  })
  @IsString()
  access_token: string;

  @ApiProperty({
    description: 'Token type (always Bearer)',
    example: 'bearer',
  })
  @IsString()
  token_type: string;

  @ApiProperty({
    description: 'Token expiration time in seconds',
    example: 21600,
  })
  @IsNumber()
  expires_in: number;

  @ApiProperty({
    description: 'Token scope',
    example: 'offline_access read write',
    required: false,
  })
  @IsString()
  @IsOptional()
  scope?: string;

  @ApiProperty({
    description: 'User ID associated with the token',
    example: 123456789,
    required: false,
  })
  @IsNumber()
  @IsOptional()
  user_id?: number;

  @ApiProperty({
    description: 'Refresh token for obtaining new access tokens',
    example: 'TG-1234567890abcdef1234567890abcdef',
  })
  @IsString()
  refresh_token: string;
}

export class AuthorizationUrlDto {
  @ApiProperty({
    description: 'Authorization URL to redirect the user',
    example: 'https://auth.mercadolibre.com/authorization?response_type=code&client_id=123456&redirect_uri=http://localhost:3000/auth/callback&state=abc123',
  })
  @IsString()
  authorization_url: string;

  @ApiProperty({
    description: 'State parameter for security validation',
    example: 'abc123xyz456',
  })
  @IsString()
  state: string;
}

export class RefreshTokenDto {
  @ApiProperty({
    description: 'Refresh token to exchange for a new access token',
    example: 'TG-1234567890abcdef1234567890abcdef',
  })
  @IsString()
  refresh_token: string;
}
