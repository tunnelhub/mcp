import { BrowserAuthFlow } from './browser-auth.js';
import { CognitoClient } from './cognito-client.js';
import { TokenManager } from './token-manager.js';
import type { AuthContext, LoginParams, Session } from '../types/mcp.js';
import type { TenantPublicDetails } from '../types/api.js';
import { ApiClient } from '../utils/api-client.js';
import { MCPError } from '../utils/error-handler.js';

export class SessionManager {
  private readonly tokenManager: TokenManager;

  private readonly cognitoClient: CognitoClient;

  private readonly apiClient: ApiClient;

  constructor() {
    this.tokenManager = new TokenManager();
    this.cognitoClient = new CognitoClient();
    this.apiClient = new ApiClient();
  }

  async createSession(params: LoginParams = {}): Promise<Session> {
    const apiHost = this.apiClient.getDefaultApiHost();
    const preferredSession = this.getCurrentSession() || this.getAllSessions()[0] || null;
    const resolvedTenant = await this.resolveTenantForLogin(params, preferredSession?.tenantId || undefined);
    const frontendUrl = resolvedTenant ? this.resolveFrontendUrl(resolvedTenant) : preferredSession?.frontendUrl || this.apiClient.getDefaultFrontendUrl();
    const preferredTenantId = resolvedTenant?.id || preferredSession?.tenantId;
    const browserAuth = new BrowserAuthFlow();
    const tokens = await browserAuth.authenticate(frontendUrl, preferredTenantId);
    const currentUser = await this.apiClient.getCurrentUser(tokens.idToken);

    const tenantId = currentUser.tenantId;
    if (!tenantId) {
      throw new MCPError('Authenticated user does not include tenantId.', 'TENANT_NOT_FOUND');
    }

    const publicTenant = await this.apiClient.getTenantPublic(tenantId);
    const resolvedFrontendUrl = this.resolveFrontendUrl(publicTenant);

    const bootstrapSession: Session = {
      id: tenantId,
      tenantId,
      tenantName: publicTenant.accountName,
      environmentId: '',
      environmentName: '',
      apiHost,
      frontendUrl: resolvedFrontendUrl,
      clientId:
        publicTenant.cognito.dedicated?.userPoolClientId ||
        publicTenant.cognito.shared?.userPoolClientId ||
        currentUser.userPoolClientId ||
        '',
      tokens: {
        idToken: tokens.idToken,
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: Date.now() + tokens.expiresIn * 1000,
      },
      user: {
        id: currentUser.uuid,
        email: currentUser.email,
        role: currentUser.role,
        timezone: currentUser.timezone || 'America/Sao_Paulo',
      },
      lastUsed: new Date().toISOString(),
    };

    this.apiClient.setSession(bootstrapSession);
    const environments = await this.apiClient.getEnvironments(bootstrapSession);
    const defaultEnvironment = environments.find((environment) => environment.isProductive) || environments[0];

    if (!defaultEnvironment) {
      throw new MCPError('No environments available for authenticated user.', 'ENVIRONMENT_NOT_FOUND');
    }

    const session: Session = {
      ...bootstrapSession,
      environmentId: defaultEnvironment.uuid,
      environmentName: defaultEnvironment.name,
    };

    this.tokenManager.saveSession(session);
    this.tokenManager.setCurrentSessionId(session.id);
    return session;
  }

  async switchEnvironment(environmentId: string): Promise<Session> {
    const session = await this.getRequiredSession();
    const environments = await this.apiClient.getEnvironments(session);
    const environment = environments.find((item) => item.uuid === environmentId);

    if (!environment) {
      throw new MCPError(`Environment ${environmentId} not found for current tenant.`, 'ENVIRONMENT_NOT_FOUND');
    }

    const updatedSession: Session = {
      ...session,
      environmentId: environment.uuid,
      environmentName: environment.name,
      lastUsed: new Date().toISOString(),
    };

    this.tokenManager.saveSession(updatedSession);
    this.tokenManager.setCurrentSessionId(updatedSession.id);
    return updatedSession;
  }

  private resolveFrontendUrl(publicTenant: { domain?: string }): string {
    if (publicTenant.domain) {
      return `https://${publicTenant.domain}.tunnelhub.io`;
    }

    return this.apiClient.getDefaultFrontendUrl();
  }

  private async resolveTenantForLogin(params: LoginParams, fallbackTenantId?: string): Promise<TenantPublicDetails | null> {
    if (params.tenantId || params.accountName) {
      const tenants = await this.apiClient.searchTenantsPublic(params);
      return this.pickTenantForLogin(tenants, params);
    }

    if (fallbackTenantId) {
      try {
        return await this.apiClient.getTenantPublic(fallbackTenantId);
      } catch {
        return null;
      }
    }

    throw new MCPError(
      'No company provided for first login. Inform accountName first. If not found, retry with tenantId.',
      'COMPANY_REQUIRED',
    );
  }

  private pickTenantForLogin(tenants: TenantPublicDetails[], params: LoginParams): TenantPublicDetails {
    if (tenants.length === 1) {
      return tenants[0];
    }

    if (tenants.length === 0) {
      if (params.accountName && !params.tenantId) {
        throw new MCPError(
          `No company found for accountName "${params.accountName}". Retry with tenantId.`,
          'COMPANY_NOT_FOUND',
        );
      }

      throw new MCPError('No company found for the provided tenantId.', 'COMPANY_NOT_FOUND');
    }

    const options = tenants.slice(0, 10).map((tenant, index) => ({
      option: index + 1,
      tenantId: tenant.id,
      accountName: tenant.accountName,
      domain: tenant.domain,
    }));

    throw new MCPError(
      `Multiple companies found for accountName "${params.accountName}". Choose one and retry with tenantId.`,
      'COMPANY_AMBIGUOUS',
      { options },
    );
  }

  async getCurrentContext(): Promise<AuthContext | null> {
    const session = this.tokenManager.getCurrentSession();
    if (!session) {
      return null;
    }

    if (this.tokenManager.isTokenExpiring(session)) {
      await this.refreshSession(session.id);
    }

    const freshSession = this.tokenManager.getCurrentSession();
    if (!freshSession) {
      return null;
    }

    if (!freshSession.user.timezone) {
      freshSession.user.timezone = 'America/Sao_Paulo';
      this.tokenManager.saveSession(freshSession);
    }

    this.apiClient.setSession(freshSession);
    return {
      session: freshSession,
      isValid: true,
    };
  }

  getAllSessions(): Session[] {
    return this.tokenManager.getSessionsSortedByLastUsed();
  }

  getCurrentSession(): Session | null {
    return this.tokenManager.getCurrentSession();
  }

  logout(sessionId?: string): void {
    if (sessionId) {
      this.tokenManager.deleteSession(sessionId);
      return;
    }

    const currentSession = this.tokenManager.getCurrentSessionId();
    if (currentSession) {
      this.tokenManager.deleteSession(currentSession);
    }
  }

  private async refreshSession(sessionId: string): Promise<void> {
    const session = this.tokenManager.getSession(sessionId);
    if (!session) {
      throw new MCPError('Session not found.', 'SESSION_NOT_FOUND');
    }

    const refreshedTokens = await this.cognitoClient.refreshTokens(session.clientId, session.tokens.refreshToken);
    this.tokenManager.updateSessionTokens(sessionId, {
      idToken: refreshedTokens.idToken,
      accessToken: refreshedTokens.accessToken,
      refreshToken: refreshedTokens.refreshToken,
      expiresAt: Date.now() + refreshedTokens.expiresIn * 1000,
    });
  }

  private async getRequiredSession(): Promise<Session> {
    const authContext = await this.getCurrentContext();
    if (!authContext?.session) {
      throw new MCPError('Not authenticated. Use login_tunnelhub first.', 'AUTH_REQUIRED');
    }

    return authContext.session;
  }
}
