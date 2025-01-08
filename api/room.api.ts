import { Room } from "~/types/room.types";
import { BaseApiService } from "./base.api";

export class RoomApiService extends BaseApiService<Room> {
  protected endpoint = '/room';
}
export const roomApiService = new RoomApiService()