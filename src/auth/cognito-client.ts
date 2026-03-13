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
}
