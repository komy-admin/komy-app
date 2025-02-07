import { BaseApiService } from "~/api/base.api";
import { User } from "~/types/user.types";
export class UserApiService extends BaseApiService<User> {
  protected endpoint = '/user';
}
export const userApiService = new UserApiService()