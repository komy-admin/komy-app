import React from "react";
import { DimensionValue, Pressable } from "react-native";
import { Text, Badge, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "~/components/ui";
import { Item } from "~/types/item.types";
import { cn } from "~/lib/utils";
import { Trash } from "lucide-react-native";

interface ItemTableProps {
  data: Item[];
  columnWidths: DimensionValue[];
  onRowPress?: (item: Item) => void;
  deleteItem?: (id: string) => void;
}

export const ItemTable: React.FC<ItemTableProps> = ({ data, columnWidths, onRowPress, deleteItem }) => {
  return (
    <Table aria-labelledby="invoice-table">
      <TableHeader>
        <TableRow>
          <TableHead className="px-3 flex justify-end pb-1" style={{ width: columnWidths[0] }}>
            <Text style={{ fontSize: 16, color: '#AAABAD', fontWeight: '100' }}>Nom</Text>
          </TableHead>
          <TableHead className="flex justify-end p-1 pl-3" style={{ width: columnWidths[1] }}>
            <Text style={{ fontSize: 16, color: '#AAABAD', fontWeight: '100' }}>Prix</Text>
          </TableHead>
          <TableHead className="flex justify-end p-1 pl-5" style={{ width: columnWidths[2] }}>
            <Text style={{ fontSize: 16, color: '#AAABAD', fontWeight: '100' }}>Statut</Text>
          </TableHead>
          <TableHead style={{ width: columnWidths[3] }}></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((item, index) => (
          <TableRow
            key={item.id}
            className={cn('active:bg-secondary', index % 2 && 'bg-muted/40 ')}
            onPress={() => onRowPress?.(item)}
            style={{ cursor: 'pointer' }}
          >
            <TableCell
              style={{
                width: columnWidths[0],
                borderBottomColor: '#F4F5F5',
                borderTopColor: '#D7D7D9',
                borderBottomWidth: 0.5,
                borderTopWidth: index === 0 ? 0.7 : 0,
              }}
            >
              <Text style={{ fontSize: 15, color: '#2A2E33', fontWeight: '100' }}>{item.name}</Text>
            </TableCell>
            <TableCell
              style={{
                width: columnWidths[1],
                borderBottomColor: '#F4F5F5',
                borderTopColor: '#D7D7D9',
                borderBottomWidth: 0.5,
                borderTopWidth: index === 0 ? 0.7 : 0,
              }}
            >
              <Text style={{ fontSize: 15, color: '#2A2E33', fontWeight: '100' }}>{item.price} €</Text>
            </TableCell>
            <TableCell
              style={{
                width: columnWidths[2],
                borderBottomColor: '#F4F5F5',
                borderTopColor: '#D7D7D9',
                borderBottomWidth: 0.5,
                borderTopWidth: index === 0 ? 0.7 : 0,
              }}
            >
              {index === 2 ? (
                <Badge
                  variant="danger"
                  style={{ width: '60px' as DimensionValue, backgroundColor: '#F4A698' }}
                >
                  <Text style={{ fontWeight: '400' }}>Inactif</Text>
                </Badge>
              ) : (
                <Badge
                  variant="success"
                  style={{ width: '60px' as DimensionValue, backgroundColor: '#74C69D' }}
                >
                  <Text style={{ fontWeight: '400' }}>Actif</Text>
                </Badge>
              )}
            </TableCell>
            <TableCell
              style={{
                width: columnWidths[3],
                borderBottomColor: '#F4F5F5',
                borderTopColor: '#D7D7D9',
                borderBottomWidth: 0.5,
                borderTopWidth: index === 0 ? 0.7 : 0,
              }}
            >
              <Pressable 
                onPress={() => {
                  if (item.id) {
                    deleteItem?.(item.id);
                  }
                }}
              >
                <Trash size={22} color="red" fill="red" />
              </Pressable>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};