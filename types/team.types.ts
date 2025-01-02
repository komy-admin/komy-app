import { TeamTypes } from "./team-types.enum";

export type Team = {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  phone: number;
  teamType: TeamTypes;
  account: string;
  createdAt: string;
  updatedAt: string;
};