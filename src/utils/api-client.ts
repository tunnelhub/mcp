import axios, { type AxiosInstance } from 'axios';
import type {
  Automation,
  AutomationDeploy,
  AutomationExecution,
  AutomationExecutionDetailsResponse,
  AutomationExecutionLogsResponse,
  AutomationTraceResponse,
  CurrentUser,
  DataStore,
  DataStoreItem,
  Environment,
  Package,
  System,
  TenantPublicDetails,
} from '../types/api.js';
import type { LoginParams, Session } from '../types/mcp.js';

type QueryValue = string | number | boolean | undefined | null;

type QueryParams = Record<string, QueryValue | QueryValue[] | Record<string, unknown> | undefined>;

interface ExecutionDateRangeParams {
  startDate: string;
  endDate: string;
  current?: number;
  pageSize?: number;
  automationId?: string;
  status?: string;
  hideEmptySuccess?: boolean;
}

export class ApiClient {
  private readonly axiosInstance: AxiosInstance;

  private session?: Session;

  constructor(session?: Session) {
    this.session = session;
    this.axiosInstance = axios.create({
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  setSession(session: Session): void {
    this.session = session;
  }

  getDefaultFrontendUrl(): string {
    return process.env.TUNNELHUB_FRONTEND_URL || process.env.FRONTEND_URL || 'https://app.tunnelhub.io';
  }

  getDefaultApiHost(): string {
    return process.env.TUNNELHUB_API_HOST || process.env.API_HOST || 'https://api.tunnelhub.io';
  }

  async getTenantPublic(tenantId: string): Promise<TenantPublicDetails> {
    return this.request<TenantPublicDetails>('GET', `/tenant-service/tenants/public/${tenantId}`, undefined, undefined, false);
  }

  async searchTenantsPublic(params: LoginParams): Promise<TenantPublicDetails[]> {
    const query: QueryParams = {};

    if (params.tenantId) {
      query.accountName = params.tenantId;
    } else if (params.accountName) {
      query.accountName = params.accountName;
    }

    return this.request<TenantPublicDetails[]>('GET', '/tenant-service/tenants/public', query, undefined, false);
  }

  async getCurrentUser(idToken: string): Promise<CurrentUser> {
    return this.request<CurrentUser>('GET', '/user-service/currentUser', undefined, {
      Authorization: `Bearer ${idToken}`,
    }, false);
  }

  async getEnvironments(session?: Session): Promise<Environment[]> {
    return this.request<Environment[]>('GET', '/platform-service/environments', undefined, undefined, true, session);
  }

  async listPackages(params?: QueryParams): Promise<unknown> {
    const normalizedParams = this.buildPackageListParams(params);
    return this.request('GET', '/integrations-service/packages', normalizedParams);
  }

  async getPackage(packageId: string): Promise<Package> {
    return this.request<Package>('GET', `/integrations-service/packages/${packageId}`);
  }

  async listSystems(params?: QueryParams): Promise<unknown> {
    const normalizedParams = this.buildSystemListParams(params);
    return this.request('GET', '/integrations-service/systems', normalizedParams);
  }

  async getSystem(systemId: string): Promise<System> {
    return this.request<System>('GET', `/integrations-service/systems/${systemId}`);
  }

  async listDataStores(params?: QueryParams): Promise<unknown> {
    const normalizedParams = this.buildDataStoreListParams(params);
    return this.request('GET', '/platform-service/dataStores', normalizedParams);
  }

  async getDataStore(dataStoreId: string): Promise<DataStore> {
    return this.request<DataStore>('GET', `/platform-service/dataStores/${dataStoreId}`);
  }

  async listDataStoreItems(dataStoreId: string, params?: QueryParams): Promise<unknown> {
    const normalizedParams = this.buildDataStoreItemListParams(params);
    return this.request('GET', `/platform-service/dataStores/${dataStoreId}/items`, normalizedParams);
  }

  async getDataStoreItem(dataStoreId: string, itemId: string): Promise<DataStoreItem> {
    return this.request<DataStoreItem>('GET', `/platform-service/dataStores/${dataStoreId}/items/${itemId}`);
  }

  async listTenants(params?: QueryParams): Promise<unknown> {
    return this.request('GET', '/tenant-service/tenants', params);
  }

  async getTenant(tenantId: string): Promise<unknown> {
    return this.request('GET', `/tenant-service/tenants/${tenantId}`);
  }

  async listAutomations(params?: QueryParams): Promise<unknown> {
    const normalizedParams = this.buildAutomationListParams(params);
    return this.request('GET', '/integrations-service/automations', normalizedParams);
  }

  async getAutomation(automationId: string): Promise<Automation> {
    return this.request<Automation>('GET', `/integrations-service/automations/${automationId}`);
  }

  async listAutomationDeploys(automationId: string, params?: QueryParams): Promise<AutomationDeploy[]> {
    return this.request<AutomationDeploy[]>(
      'GET',
      `/integrations-service/automations/listDeploys/${automationId}`,
      params,
    );
  }

  async getAutomationActionLogs(automationId: string, params?: QueryParams): Promise<unknown> {
    return this.request('GET', `/integrations-service/automations/actionLogs/${automationId}`, params);
  }

  async executeAutomation(automationId: string, payload?: unknown): Promise<unknown> {
    return this.request('POST', `/integrations-service/automations/dispatch/manual/${automationId}`, undefined, undefined, true, undefined, payload);
  }

  async listExecutions(params?: QueryParams): Promise<unknown> {
    const normalizedParams = this.buildExecutionRangeParams(params as unknown as ExecutionDateRangeParams);
    return this.request('GET', '/integrations-service/automations/monitoring', normalizedParams, this.getMonitoringHeaders());
  }

  async getExecutionDetails(params: { executionId: string; automationId: string; executionPeriod: string }): Promise<AutomationExecutionDetailsResponse> {
    return this.request<AutomationExecutionDetailsResponse>(
      'GET',
      `/integrations-service/automations/monitoring/${params.executionId}`,
      {
        automationId: params.automationId,
        period: params.executionPeriod,
      },
      this.getMonitoringHeaders(),
    );
  }

  async getExecutionTraces(params: QueryParams & { executionId: string }): Promise<AutomationTraceResponse> {
    const { executionId, ...query } = params;
    return this.request<AutomationTraceResponse>(
      'GET',
      `/integrations-service/automations/monitoring/${executionId}/traces`,
      query,
      this.getMonitoringHeaders(),
    );
  }

  async getExecutionLogs(params: QueryParams & { executionId: string }): Promise<AutomationExecutionLogsResponse> {
    const { executionId, ...query } = params;
    return this.request<AutomationExecutionLogsResponse>(
      'GET',
      `/integrations-service/automations/monitoring/${executionId}/executionLogs`,
      query,
      this.getMonitoringHeaders(),
    );
  }

  async findExecution(params: QueryParams): Promise<AutomationExecution | null> {
    const pageSize = Number(params.pageSize || 100);
    const maxPages = 10;

    for (let current = 1; current <= maxPages; current += 1) {
      const response = await this.listExecutions({
        ...params,
        current,
        pageSize,
      });
      const items = this.extractListItems(response);
      const match = items.find((item) => {
        const itemExecutionId = item.executionId || item.uuid;
        if (
          params.executionId &&
          itemExecutionId !== params.executionId &&
          !String(itemExecutionId || '').endsWith(String(params.executionId))
        ) {
          return false;
        }
        if (params.automationId && item.automationId !== params.automationId) {
          return false;
        }
        return true;
      });

      if (match) {
        return match;
      }

      if (items.length < pageSize) {
        break;
      }
    }

    return null;
  }

  private async request<T>(
    method: 'GET' | 'POST',
    path: string,
    params?: QueryParams,
    extraHeaders?: Record<string, string>,
    requireSession = true,
    sessionOverride?: Session,
    data?: unknown,
  ): Promise<T> {
    const session = sessionOverride || this.session;
    if (requireSession && !session) {
      throw new Error('No active session. Use login_tunnelhub first.');
    }

    const headers: Record<string, string> = {
      ...(extraHeaders || {}),
    };

    if (session) {
      headers.Authorization ||= `Bearer ${session.tokens.idToken}`;
      headers.EnvironmentId ||= session.environmentId;
    }

    const response = await this.axiosInstance.request<T>({
      method,
      baseURL: session?.apiHost || this.getDefaultApiHost(),
      url: path,
      headers,
      params: this.normalizeParams(params),
      data,
    });

    return response.data;
  }

  private normalizeParams(params?: QueryParams): Record<string, unknown> | undefined {
    if (!params) {
      return undefined;
    }

    const normalized: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }

      if (typeof value === 'object' && !Array.isArray(value)) {
        normalized[key] = JSON.stringify(value);
        continue;
      }

      normalized[key] = value;
    }

    return normalized;
  }

  private getMonitoringHeaders(): Record<string, string> {
    return {
      UserTimeZone: this.session?.user.timezone || 'America/Sao_Paulo',
    };
  }

  private buildAutomationListParams(params?: QueryParams): QueryParams {
    const filter: Record<string, unknown> = {};

    if (params?.status) {
      filter.status = [params.status];
    }

    return {
      current: Number(params?.current || 1),
      pageSize: Number(params?.pageSize || 20),
      sorter: { name: 'ascend' },
      filter,
      name: params?.name,
    };
  }

  private buildPackageListParams(params?: QueryParams): QueryParams {
    const filter: Record<string, unknown> = {};

    if (params?.name) {
      filter.name = [params.name];
    }

    if (params?.description) {
      filter.description = [params.description];
    }

    return {
      current: Number(params?.current || 1),
      pageSize: Number(params?.pageSize || 20),
      sorter: { name: 'ascend' },
      filter,
    };
  }

  private buildSystemListParams(params?: QueryParams): QueryParams {
    const filter: Record<string, unknown> = {};

    if (params?.name) {
      filter.name = [params.name];
    }

    if (params?.internalName) {
      filter.internalName = [params.internalName];
    }

    if (params?.type) {
      filter.type = [params.type];
    }

    if (params?.status) {
      filter.status = [params.status];
    }

    if (params?.environment) {
      filter.environment = [params.environment];
    }

    return {
      current: Number(params?.current || 1),
      pageSize: Number(params?.pageSize || 20),
      sorter: { name: 'ascend' },
      filter,
    };
  }

  private buildExecutionRangeParams(params: ExecutionDateRangeParams): QueryParams {
    const filter: Record<string, unknown> = {};

    if (params.automationId) {
      filter.automationId = [params.automationId];
    }

    if (params.status) {
      filter.status = [params.status];
    }

    return {
      current: params.current || 1,
      pageSize: params.pageSize || 20,
      createdAt: JSON.stringify([
        this.normalizeDateBoundary(params.startDate, 'start'),
        this.normalizeDateBoundary(params.endDate, 'end'),
      ]),
      hideEmptySuccess: params.hideEmptySuccess ?? true,
      sorter: { createdAt: 'descending' },
      filter,
    };
  }

  private buildDataStoreListParams(params?: QueryParams): QueryParams {
    const filter: Record<string, unknown> = {};

    if (params?.externalCode) {
      filter.externalCode = [params.externalCode];
    }

    if (params?.description) {
      filter.description = [params.description];
    }

    if (params?.packageId) {
      filter.packageId = [params.packageId];
    }

    return {
      current: Number(params?.current || 1),
      pageSize: Number(params?.pageSize || 20),
      sorter: { externalCode: 'ascend' },
      filter,
    };
  }

  private buildDataStoreItemListParams(params?: QueryParams): QueryParams {
    const filter: Record<string, unknown> = {};

    if (params?.fromValue) {
      filter.fromValue = [params.fromValue];
    }

    if (params?.toValue) {
      filter.toValue = [params.toValue];
    }

    return {
      current: Number(params?.current || 1),
      pageSize: Number(params?.pageSize || 20),
      sorter: { fromValue: 'ascend' },
      filter,
    };
  }

  private normalizeDateBoundary(value: string, kind: 'start' | 'end'): string {
    if (value.includes(' ')) {
      return value;
    }

    return `${value} ${kind === 'start' ? '00:00:00' : '23:59:59'}`;
  }

  private extractListItems(response: unknown): AutomationExecution[] {
    if (Array.isArray(response)) {
      return response as AutomationExecution[];
    }

    if (response && typeof response === 'object') {
      const maybeData = (response as { data?: unknown }).data;
      if (Array.isArray(maybeData)) {
        return maybeData as AutomationExecution[];
      }
    }

    return [];
  }
}
