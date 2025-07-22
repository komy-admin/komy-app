import { BaseApiService } from './base.api';

export interface ConfigModule {
  enabled: boolean;
  value: number;
}

export interface AccountConfig {
  alert_time_minutes: ConfigModule;
}

export interface ConfigUpdateResponse {
  message: string;
  config: AccountConfig;
}

export class ConfigApiService extends BaseApiService<AccountConfig> {
  protected endpoint = '/account-config';

  /**
   * Récupération simple - pas de try/catch redondant (BaseApiService gère déjà)
   */
  async getConfig(): Promise<AccountConfig> {
    const response = await this.axiosInstance.get<AccountConfig>(this.endpoint);
    return response.data;
  }

  /**
   * Mise à jour générique de la configuration
   * Permet de mettre à jour n'importe quelle partie de la config
   */
  async updateConfig(config: Partial<AccountConfig>): Promise<ConfigUpdateResponse> {
    const response = await this.axiosInstance.put<ConfigUpdateResponse>(this.endpoint, config);
    return response.data;
  }
}

export const configApiService = new ConfigApiService();