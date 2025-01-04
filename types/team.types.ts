import { TeamTypes } from "./team-types.enum";

export type Team = {
  id?: string;
  accountId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: number;
  profil: TeamTypes;
  password: string;
  loginId: string;
};