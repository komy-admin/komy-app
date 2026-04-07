import { BaseApiService } from '~/api/base.api'
import { Tag } from '~/types/tag.types'

export class TagApiService extends BaseApiService<Tag> {
  protected endpoint = '/tag'
}

export const tagApiService = new TagApiService()
