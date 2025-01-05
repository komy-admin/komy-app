import { ItemTypes } from "~/types/item-type.enum";
import { Status } from "~/types/status.enum";
import { Table } from "~/types/table.types";

export const mockTables: Table[] = [
  {
    id: '1',
    name: '1',
    xStart: 1,
    yStart: 1,
    width: 6,
    height: 4,
    seats: 6,
    roomId: 'room1',
    orders: [
      {
        id: 'order1',
        tableId: '1',
        itemType: ItemTypes.STARTER,
        orderItems: [
          {
            id: '1',
            price: 10,
            itemType: ItemTypes.STARTER,
            name: 'Soupe aux choux',
            status: Status.SERVED,
            createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 heure avant
            updatedAt: new Date().toISOString()
          },
          {
            id: '2',
            price: 10,
            itemType: ItemTypes.STARTER,
            name: 'Foix gras',
            status: Status.SERVED,
            createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 heure avant
            updatedAt: new Date().toISOString()
          }
        ],
        status: Status.PREPARING,
        account: 'FORKIT',
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 heure avant
        updatedAt: new Date().toISOString()
      },
      {
        id: 'order2',
        tableId: '1',
        itemType: ItemTypes.MAIN,
        orderItems: [
          {
            id: '3',
            price: 10,
            itemType: ItemTypes.MAIN,
            name: 'Pizza Margherita',
            status: Status.PREPARING,
            createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 heure avant
            updatedAt: new Date().toISOString()
          }
        ],
        status: Status.PREPARING,
        account: 'FORKIT',
        createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 heure avant
        updatedAt: new Date().toISOString()
      }
    ],
    status: Status.PREPARING,
    account: 'FORKIT',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z'
  },
  {
    id: '2',
    name: '2',
    xStart: 10,
    yStart: 1,
    width: 2,
    height: 2,
    seats: 2,
    roomId: 'room1',
    orders: [],
    status: Status.FREE,
    account: 'FORKIT',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z'
  },
  {
    id: '3',
    name: '3',
    xStart: 1,
    yStart: 10,
    width: 3,
    height: 2,
    seats: 2,
    roomId: 'room1',
    orders: [],
    status: Status.ERROR,
    account: 'FORKIT',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z'
  },
  {
    id: '4',
    name: '4',
    xStart: 10,
    yStart: 10,
    width: 2,
    height: 4,
    seats: 4,
    roomId: 'room1',
    orders: [],
    status: Status.READY,
    account: 'FORKIT',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z'
  },
  {
    id: '5',
    name: '5',
    xStart: 10,
    yStart: 15,
    width: 2,
    height: 4,
    seats: 4,
    roomId: 'room1',
    orders: [],
    status: Status.SERVED,
    account: 'FORKIT',
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-01T10:00:00Z'
  }
];