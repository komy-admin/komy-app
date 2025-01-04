import React from "react";
import { DimensionValue, Pressable } from "react-native";
import { Text, Badge, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "~/components/ui";
import { Trash } from "lucide-react-native";
import { Team } from "~/types/team.types";
import { cn } from "~/lib/utils";

interface TeamTableProps {
  data: Team[];
  columnWidths: DimensionValue[];
  onRowPress?: (team: Team) => void;
  deleteItem?: (id: string) => void;
}

export const TeamTable: React.FC<TeamTableProps> = ({ data, columnWidths, onRowPress, deleteItem }) => {
  return (
    <Table aria-labelledby="team-table">
      <TableHeader>
        <TableRow>
          <TableHead className="px-3 flex justify-end pb-1" style={{ width: columnWidths[0] }}>
            <Text style={{ fontSize: 16, color: "#AAABAD", fontWeight: "100" }}>Prénom</Text>
          </TableHead>
          <TableHead className="flex justify-end p-1 pl-3" style={{ width: columnWidths[1] }}>
            <Text style={{ fontSize: 16, color: "#AAABAD", fontWeight: "100" }}>Nom</Text>
          </TableHead>
          <TableHead className="flex justify-end p-1 pl-3" style={{ width: columnWidths[2] }}>
            <Text style={{ fontSize: 16, color: "#AAABAD", fontWeight: "100" }}>Email</Text>
          </TableHead>
          <TableHead className="flex justify-end p-1 pl-3" style={{ width: columnWidths[3] }}>
            <Text style={{ fontSize: 16, color: "#AAABAD", fontWeight: "100" }}>Téléphone</Text>
          </TableHead>
          <TableHead style={{ width: columnWidths[4] }}></TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {data.map((team, index) => (
          <TableRow
            key={team.id}
            className={cn("active:bg-secondary", index % 2 && "bg-muted/40")}
            onPress={() => onRowPress?.(team)}
            style={{ cursor: "pointer" }}
          >
            <TableCell
              style={{
                width: columnWidths[0],
                borderBottomColor: "#F4F5F5",
                borderTopColor: "#D7D7D9",
                borderBottomWidth: 0.5,
                borderTopWidth: index === 0 ? 0.7 : 0,
              }}
            >
              <Text style={{ fontSize: 15, color: "#2A2E33", fontWeight: "100" }}>{team.firstName}</Text>
            </TableCell>
            <TableCell
              style={{
                width: columnWidths[1],
                borderBottomColor: "#F4F5F5",
                borderTopColor: "#D7D7D9",
                borderBottomWidth: 0.5,
                borderTopWidth: index === 0 ? 0.7 : 0,
              }}
            >
              <Text style={{ fontSize: 15, color: "#2A2E33", fontWeight: "100" }}>{team.lastName}</Text>
            </TableCell>
            <TableCell
              style={{
                width: columnWidths[2],
                borderBottomColor: "#F4F5F5",
                borderTopColor: "#D7D7D9",
                borderBottomWidth: 0.5,
                borderTopWidth: index === 0 ? 0.7 : 0,
              }}
            >
              <Text style={{ fontSize: 15, color: "#2A2E33", fontWeight: "100" }}>{team.email}</Text>
            </TableCell>
            <TableCell
              style={{
                width: columnWidths[3],
                borderBottomColor: "#F4F5F5",
                borderTopColor: "#D7D7D9",
                borderBottomWidth: 0.5,
                borderTopWidth: index === 0 ? 0.7 : 0,
              }}
            >
              <Text style={{ fontSize: 15, color: "#2A2E33", fontWeight: "100" }}>{team.phone}</Text>
            </TableCell>
            <TableCell
              style={{
                width: columnWidths[4],
                borderBottomColor: "#F4F5F5",
                borderTopColor: "#D7D7D9",
                borderBottomWidth: 0.5,
                borderTopWidth: index === 0 ? 0.7 : 0,
              }}
            >
              <Pressable 
                onPress={() => {
                  if (team.id) {
                    deleteItem?.(team.id);
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