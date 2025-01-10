import React from "react";
import { DimensionValue, Pressable } from "react-native";
import { Text, Badge, Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "~/components/ui";
import { Trash } from "lucide-react-native";
import { Team } from "~/types/team.types";
import { cn, getTeamTypeText } from "~/lib/utils";

interface TeamTableProps {
  data: Team[];
  columnWidths: DimensionValue[];
  onRowPress?: (team: Team) => void;
  deleteItem?: (id: string) => void;
}

export const TeamTable: React.FC<TeamTableProps> = ({ data, columnWidths, onRowPress, deleteItem }) => {
  return (
    <Table style={{ flex: 1 }} aria-labelledby="team-table">
      <TableHeader>
        <TableRow>
          <TableHead className="px-3 flex justify-end pb-1" style={{ width: columnWidths[0] }}>
            <Text style={{ fontSize: 16, color: "#AAABAD", fontWeight: "100" }}>Profil</Text>
          </TableHead>
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
              <Text style={{ fontSize: 15, color: "#2A2E33", fontWeight: "100" }}>{getTeamTypeText(team.profil)}</Text>
            </TableCell>
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

// import { FlashList } from '@shopify/flash-list';
// import { Stack } from 'expo-router';
// import * as React from 'react';
// import { Alert, ScrollView, View, useWindowDimensions } from 'react-native';
// import { useSafeAreaInsets } from 'react-native-safe-area-context';
// import { Button } from '~/components/ui/button';
// import {
//   Table,
//   TableBody,
//   TableCell,
//   TableFooter,
//   TableHead,
//   TableHeader,
//   TableRow,
// } from '~/components/ui/table';
// import { Text } from '~/components/ui/text';
// import { ChevronDown } from '~/lib/icons/ChevronDown';
// import { cn } from '~/lib/utils';

// const INVOICES = [
//   {
//     invoice: 'INV001',
//     paymentStatus: 'Paid',
//     totalAmount: '$250.00',
//     paymentMethod: 'Credit Card',
//   },
//   {
//     invoice: 'INV001',
//     paymentStatus: 'Paid',
//     totalAmount: '$250.00',
//     paymentMethod: 'Credit Card',
//   },
//   {
//     invoice: 'INV001',
//     paymentStatus: 'Paid',
//     totalAmount: '$250.00',
//     paymentMethod: 'Credit Card',
//   },
//   {
//     invoice: 'INV001',
//     paymentStatus: 'Paid',
//     totalAmount: '$250.00',
//     paymentMethod: 'Credit Card',
//   },
//   {
//     invoice: 'INV001',
//     paymentStatus: 'Paid',
//     totalAmount: '$250.00',
//     paymentMethod: 'Credit Card',
//   },
// ];

// const MIN_COLUMN_WIDTHS = [120, 120, 100, 120];

// export const TeamTable: React.FC<any> = (props) => {
//   const { width } = useWindowDimensions();
//   const insets = useSafeAreaInsets();

//   const columnWidths = React.useMemo(() => {
//     return MIN_COLUMN_WIDTHS.map((minWidth) => {
//       const evenWidth = width / MIN_COLUMN_WIDTHS.length;
//       return evenWidth > minWidth ? evenWidth : minWidth;
//     });
//   }, [width]);

//   return (
//       <ScrollView horizontal bounces={false} showsHorizontalScrollIndicator={false}>
//         <Table aria-labelledby='invoice-table'>
//           <TableHeader>
//             <TableRow>
//               <TableHead className='px-0.5' style={{ width: columnWidths[0] }}>
//                <Text>Invoice</Text>
//               </TableHead>
//               <TableHead style={{ width: columnWidths[1] }}>
//                 <Text>Status</Text>
//               </TableHead>
//               <TableHead style={{ width: columnWidths[2] }}>
//                 <Text>Method</Text>
//               </TableHead>
//               <TableHead style={{ width: columnWidths[3] }}>
//                 <Text className='text-center md:text-right md:pr-5'>Amount</Text>
//               </TableHead>
//             </TableRow>
//           </TableHeader>
//           <TableBody>
//             <FlashList
//               data={INVOICES}
//               estimatedItemSize={10}
//               contentContainerStyle={{
//                 paddingBottom: insets.bottom,
//               }}
//               showsVerticalScrollIndicator={false}
//               renderItem={({ item: invoice, index }) => {
//                 return (
//                   <TableRow
//                     key={invoice.invoice}
//                     className={cn('active:bg-secondary', index % 2 && 'bg-muted/40 ')}
//                   >
//                     <TableCell style={{ width: columnWidths[0] }}>
//                       <Text>{invoice.invoice}</Text>
//                     </TableCell>
//                     <TableCell style={{ width: columnWidths[1] }}>
//                       <Text>{invoice.paymentStatus}</Text>
//                     </TableCell>
//                     <TableCell style={{ width: columnWidths[2] }}>
//                       <Text>{invoice.paymentMethod}</Text>
//                     </TableCell>
//                     <TableCell style={{ width: columnWidths[3] }} className='items-end '>
//                       <Button
//                         variant='secondary'
//                         size='sm'
//                         className='shadow-sm shadow-foreground/10 mr-3'
//                         onPress={() => {
//                           Alert.alert(
//                             invoice.totalAmount,
//                             `You pressed the price button on invoice ${invoice.invoice}.`
//                           );
//                         }}
//                       >
//                         <Text>{invoice.totalAmount}</Text>
//                       </Button>
//                     </TableCell>
//                   </TableRow>
//                 );
//               }}
//               ListFooterComponent={() => {
//                 return (
//                   <>
//                     <TableFooter>
//                       <TableRow>
//                         <TableCell className='flex-1 justify-center'>
//                           <Text className='text-foreground'>Total</Text>
//                         </TableCell>
//                         <TableCell className='items-end pr-8'>
//                           <Button
//                             size='sm'
//                             variant='ghost'
//                             onPress={() => {
//                               Alert.alert(
//                                 'Total Amount',
//                                 `You pressed the total amount price button.`
//                               );
//                             }}
//                           >
//                             <Text>$2,500.00</Text>
//                           </Button>
//                         </TableCell>
//                       </TableRow>
//                     </TableFooter>
//                   </>
//                 );
//               }}
//             />
//           </TableBody>
//         </Table>
//       </ScrollView>
//   );
// }