import { TeamTypes } from "./team.enum";
import { FilterConfig } from '~/types/filter.types';

export type Team = {
  id?: string;
  accountId?: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  profil: TeamTypes;
  password: string;
  loginId: string;
};