import {
  CognitoIdentityProviderClient,
  InitiateAuthCommand,
  InitiateAuthCommandInput,
} from '@aws-sdk/client-cognito-identity-provider';
import type { BrowserAuthTokens } from './browser-auth.js';

export class CognitoClient {
  private client: CognitoIdentityProviderClient;

  constructor() {
    this.client = new CognitoIdentityProviderClient({
      region: 'us-east-1'
    });
  }

  /**
   * Refresh tokens using refresh token
   */
  async refreshTokens(clientId: string, refreshToken: string): Promise<BrowserAuthTokens> {
    const input: InitiateAuthCommandInput = {
      AuthFlow: 'REFRESH_TOKEN_AUTH',
      ClientId: clientId,
      AuthParameters: {
        REFRESH_TOKEN: refreshToken,
      },
    };

    try {
      const command = new InitiateAuthCommand(input);
      const response = await this.client.send(command);

      if (!response.AuthenticationResult) {
        throw new Error('No authentication result received');
      }

      return {
        idToken: response.AuthenticationResult.IdToken!,
        accessToken: response.AuthenticationResult.AccessToken!,
        refreshToken: refreshToken, // Refresh token doesn't change
        expiresIn: response.AuthenticationResult.ExpiresIn!,
      };
    } catch (error) {
      console.error('Failed to refresh tokens:', error);
      throw error;
    }
  }

  /**
   * Initiate password auth (for future use if needed)
   */
  async authenticateWithPassword(
    clientId: string,
    username: string,
    password: string
  ): Promise<BrowserAuthTokens> {
    const input: InitiateAuthCommandInput = {
      AuthFlow: 'USER_PASSWORD_AUTH',
      ClientId: clientId,
      AuthParameters: {
        USERNAME: username,
        PASSWORD: password,
      },
    };

    try {
      const command = new InitiateAuthCommand(input);
      const response = await this.client.send(command);

      if (!response.AuthenticationResult) {
        throw new Error('No authentication result received');
      }

      return {
        idToken: response.AuthenticationResult.IdToken!,
        accessToken: response.AuthenticationResult.AccessToken!,
        refreshToken: response.AuthenticationResult.RefreshToken!,
        expiresIn: response.AuthenticationResult.ExpiresIn!,
      };
    } catch (error) {
      console.error('Failed to authenticate:', error);
      throw error;
    }
  }
}