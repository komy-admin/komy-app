import { BaseApiService } from '~/api/base.api'
import { Tag, TagOption } from '~/types/tag.types'

export class TagApiService extends BaseApiService<Tag> {
  protected endpoint = '/tag'

  // Récupérer les options d'un tag
  async getOptions(tagId: string): Promise<TagOption[]> {
    const response = await this.axiosInstance.get(`${this.endpoint}/${tagId}/options`)
    return response.data
  }

  // Créer une option
  async createOption(tagId: string, data: Partial<TagOption>): Promise<TagOption> {
    const response = await this.axiosInstance.post(`${this.endpoint}/${tagId}/options`, data)
    return response.data
  }

  // Créer plusieurs options en bulk
  async bulkCreateOptions(tagId: string, options: Partial<TagOption>[]): Promise<TagOption[]> {
    const response = await this.axiosInstance.post(`${this.endpoint}/${tagId}/options/bulk`, { options })
    return response.data
  }

  // Mettre à jour une option
  async updateOption(tagId: string, optionId: string, data: Partial<TagOption>): Promise<TagOption> {
    const response = await this.axiosInstance.put(`${this.endpoint}/${tagId}/options/${optionId}`, data)
    return response.data
  }

  // Supprimer une option
  async deleteOption(tagId: string, optionId: string): Promise<void> {
    await this.axiosInstance.delete(`${this.endpoint}/${tagId}/options/${optionId}`)
  }

  // Supprimer plusieurs options en bulk
  async bulkDeleteOptions(tagId: string, optionIds: string[]): Promise<void> {
    await this.axiosInstance.delete(`${this.endpoint}/${tagId}/options/bulk`, {
      data: { optionIds }
    })
  }
}

export const tagApiService = new TagApiService()
