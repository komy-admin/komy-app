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

  constructor() {
    super();
  }

  /**
   * Récupérer la configuration du compte
   * Accessible par tous les rôles (admin, manager, chef, serveur)
   */
  async getConfig(): Promise<AccountConfig> {
    try {
      const response = await this.axiosInstance.get<AccountConfig>(this.endpoint);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la récupération de la configuration:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour la configuration du compte
   * Accessible seulement par admin/superadmin
   */
  async updateConfig(config: AccountConfig): Promise<ConfigUpdateResponse> {
    try {
      const response = await this.axiosInstance.put<ConfigUpdateResponse>(this.endpoint, config);
      return response.data;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de la configuration:', error);
      throw error;
    }
  }

  /**
   * Mettre à jour uniquement la configuration des alertes
   * Helper method pour simplifier les appels
   */
  async updateAlertConfig(alertConfig: ConfigModule): Promise<ConfigUpdateResponse> {
    return this.updateConfig({
      alert_time_minutes: alertConfig
    });
  }

  /**
   * Valider la configuration côté client
   */
  validateAlertConfig(config: ConfigModule): { isValid: boolean; error?: string } {
    if (config.enabled && (config.value < 5 || config.value > 120)) {
      return {
        isValid: false,
        error: 'La valeur doit être entre 5 et 120 minutes'
      };
    }
    
    if (config.enabled && !Number.isInteger(config.value)) {
      return {
        isValid: false,
        error: 'La valeur doit être un nombre entier'
      };
    }

    return { isValid: true };
  }
}

export const configApiService = new ConfigApiService();