import * as TablePrimitive from '@rn-primitives/table';
import * as React from 'react';
import { cn } from '~/lib/utils';
import { Text, TextClassContext } from '~/components/ui/text';
import { DimensionValue, Pressable, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { Trash2 } from 'lucide-react-native';

const Table = React.forwardRef<TablePrimitive.RootRef, TablePrimitive.RootProps>(
  ({ className, ...props }, ref) => (
    <TablePrimitive.Root
      ref={ref}
      className={cn('w-full caption-bottom text-sm', className)}
      {...props}
    />
  )
);
Table.displayName = 'Table';

const TableHeader = React.forwardRef<TablePrimitive.HeaderRef, TablePrimitive.HeaderProps>(
  ({ className, ...props }, ref) => (
    <TablePrimitive.Header
      ref={ref}
      className={cn('border-border [&_tr]:border-b', className)}
      {...props}
    />
  )
);
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<TablePrimitive.BodyRef, TablePrimitive.BodyProps>(
  ({ className, style, ...props }, ref) => (
    <TablePrimitive.Body
      ref={ref}
      className={cn('flex-1 border-border [&_tr:last-child]:border-0', className)}
      style={[{ minHeight: 2 }, style]}
      {...props}
    />
  )
);
TableBody.displayName = 'TableBody';

const TableFooter = React.forwardRef<TablePrimitive.FooterRef, TablePrimitive.FooterProps>(
  ({ className, ...props }, ref) => (
    <TablePrimitive.Footer
      ref={ref}
      className={cn('bg-muted/50 font-medium [&>tr]:last:border-b-0', className)}
      {...props}
    />
  )
);
TableFooter.displayName = 'TableFooter';

const TableRow = React.forwardRef<TablePrimitive.RowRef, TablePrimitive.RowProps>(
  ({ className, ...props }, ref) => (
    <TablePrimitive.Row
      ref={ref}
      className={cn(
        'flex-row web:hover:bg-muted/50 web:data-[state=selected]:bg-muted',
        className
      )}
      {...props}
    />
  )
);
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<TablePrimitive.HeadRef, TablePrimitive.HeadProps>(
  ({ className, ...props }, ref) => (
    <TextClassContext.Provider value='text-muted-foreground'>
      <TablePrimitive.Head
        ref={ref}
        className={cn(
          'h-12 px-4 text-left justify-center font-medium [&:has([role=checkbox])]:pr-0',
          className
        )}
        {...props}
      />
    </TextClassContext.Provider>
  )
);
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<TablePrimitive.CellRef, TablePrimitive.CellProps>(
  ({ className, ...props }, ref) => (
    <TablePrimitive.Cell
      ref={ref}
      className={cn('p-3.5 align-middle [&:has([role=checkbox])]:pr-0', className)}
      {...props}
    />
  )
);
TableCell.displayName = 'TableCell';

interface ColumnData {
  label: string;
  key: string;
  width: string;
}
interface ForkTableProps {
  data: any[];
  columns: ColumnData[];
  onRowPress?: (id : string) => void
  onRowDelete?: (id: string) => void
}
const ForkTable = ({ data, columns, onRowPress, onRowDelete }: ForkTableProps) => {
  const DELETE_COLUMN_WIDTH = 10;
  
  const adjustedColumns = columns.map(col => {
    if (!onRowDelete) return col;
    
    const currentWidth = parseFloat(col.width);
    const adjustedWidth = (currentWidth / 100) * (100 - DELETE_COLUMN_WIDTH);
    
    return {
      ...col,
      width: `${adjustedWidth}%`
    };
  });
  return (
    <Table style={{ flex: 1 }}>
      <TableHeader style={{ borderBottomWidth: 0.5, borderBottomColor: '#F1F1F1' }}>
        <TableRow>
          {adjustedColumns.map((column, columnIndex) => (
            <TableHead 
              key={`header-${column.key}-${columnIndex}`}
              style={{ width: column.width as DimensionValue }}
              className="px-3 flex justify-end pb-1"
            >
              <Text style={{ fontSize: 16, color: '#AAABAD', fontWeight: '100' }}>{ column.label }</Text>
            </TableHead>
          ))}
          {onRowDelete && (
            <TableHead 
              key="header-delete"
              style={{ width: `${DELETE_COLUMN_WIDTH}%` }}
            />
          )}
        </TableRow>
      </TableHeader>
      <TableBody>
        <FlashList
          data={data}
          estimatedItemSize={10}
          showsVerticalScrollIndicator={false}
          keyExtractor={(item) => item.id.toString()}
          renderItem={({ item, index }) => {
            return (
              <TableRow
                key={`row-${item.id}`}
                className={cn('active:bg-secondary', index % 2 && 'bg-muted/40 ')}
                style={{ flex: 1, cursor: 'pointer' }}
              >
                <Pressable 
                  onPress={() => onRowPress && onRowPress(item.id)}
                  style={{ flex: 1}}
                  className="flex-row items-center justify-center">
                  {adjustedColumns.map((column, cellIndex) => (
                    <TableCell
                      key={`cell-${item.id}-${column.key}-${cellIndex}`}
                      style={{ width: column.width as DimensionValue, borderBottomColor: '#F4F5F5', borderBottomWidth: 0.5,}}
                    >
                      <Text style={{ fontSize: 15, color: '#2A2E33', fontWeight: '100' }}>{item[column.key]}</Text>
                    </TableCell>
                  ))}
                  {onRowDelete && (
                    <TableCell 
                      key={`cell-delete-${item.id}`}
                      style={{ width: `${DELETE_COLUMN_WIDTH}%` }}
                    >
                      <Pressable
                        onPress={() => onRowDelete(item.id)}
                        className="items-center justify-center w-full"
                      >
                        <Trash2
                          size={20} 
                          color="red"
                        />
                      </Pressable>
                    </TableCell>
                  )}
                </Pressable>
              </TableRow>
            );
          }}
        />
      </TableBody>
    </Table>
  )
}

export { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow, ForkTable };
