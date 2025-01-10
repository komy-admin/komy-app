import { BaseApiService } from "./base.api";
import { Team } from "~/types/team.types";

export class TeamApiService extends BaseApiService<Team> {
  protected endpoint = '/user';
}
export const teamApiService = new TeamApiService()