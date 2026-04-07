import { AccountConfig } from '@/types/account-config.type';
import { BaseApiService } from './base.api';

export class AccountConfigApiService extends BaseApiService<AccountConfig> {
  protected endpoint = '/account-config';

  async getAccountConfig(): Promise<AccountConfig> {
    const { data } = await this.axiosInstance.get<AccountConfig>(this.endpoint);
    return data;
  }
  
  // La méthode update est héritée de BaseApiService et utilise PUT /account-config/:id

  async updateAccountName(name: string): Promise<void> {
    await this.axiosInstance.put('/account/name', { name });
  }
}

export const accountConfigApiService = new AccountConfigApiService();