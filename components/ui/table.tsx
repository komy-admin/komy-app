import * as TablePrimitive from '@rn-primitives/table';
import * as React from 'react';
import { cn } from '~/lib/utils';
import { Text } from '~/components/ui/text';
import {
  DimensionValue,
  Pressable,
  View,
  StyleSheet,
  FlatList,
  LayoutAnimation,
  TouchableWithoutFeedback
} from 'react-native';
import { Trash2, CreditCard as Edit2 } from 'lucide-react-native';
import { ActionMenu, ActionItem } from '~/components/ActionMenu';
import { TableLoader } from '~/components/TableLoader';

interface ColumnData {
  label?: string;
  key: string;
  width: string;
  render?: (item: any) => React.ReactNode;
}

interface ForkTableProps {
  data: any[];
  columns: ColumnData[];
  onRowPress?: (id: string) => void;
  onRowDelete?: (id: string) => void;
  useActionMenu?: boolean;
  getActions?: (item: any) => ActionItem[];
  isLoading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
}

const Table = React.forwardRef<
  React.ElementRef<typeof View>,
  React.ComponentPropsWithoutRef<typeof View>
>(({ className, ...props }, ref) => (
  <View ref={ref} className={cn('w-full caption-bottom', className)} {...props} />
));
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  React.ElementRef<typeof View>,
  React.ComponentPropsWithoutRef<typeof View>
>(({ className, ...props }, ref) => (
  <View ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

const TableBody = React.forwardRef<
  React.ElementRef<typeof View>,
  React.ComponentPropsWithoutRef<typeof View>
>(({ className, ...props }, ref) => (
  <View ref={ref} className={cn('[&_tr:last-child]:border-0', className)} {...props} />
));
TableBody.displayName = 'TableBody';

const TableRow = React.forwardRef<
  React.ElementRef<typeof View>,
  React.ComponentPropsWithoutRef<typeof View>
>(({ className, ...props }, ref) => (
  <View
    ref={ref}
    className={cn(
      'flex flex-row transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted',
      className
    )}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<
  React.ElementRef<typeof View>,
  React.ComponentPropsWithoutRef<typeof View>
>(({ className, ...props }, ref) => (
  <View
    ref={ref}
    className={cn(
      'h-12 px-4 text-left align-middle font-medium text-muted-foreground [&:has([role=checkbox])]:pr-0',
      className
    )}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

const TableCell = React.forwardRef<
  React.ElementRef<typeof View>,
  React.ComponentPropsWithoutRef<typeof View>
>(({ className, ...props }, ref) => (
  <View
    ref={ref}
    className={cn('p-4 align-middle [&:has([role=checkbox])]:pr-0', className)}
    {...props}
  />
));
TableCell.displayName = 'TableCell';

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <View style={styles.emptyState}>
    <Text style={styles.emptyMessage}>{message}</Text>
  </View>
);

const ForkTable = ({ 
  data, 
  columns, 
  onRowPress, 
  onRowDelete,
  useActionMenu = false,
  getActions,
  isLoading = false,
  loadingMessage = "Chargement des données...",
  emptyMessage = "Aucune donnée disponible"
}: ForkTableProps) => {
  const renderItem = React.useCallback(({ item, index }: { item: any; index: number }) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    return (
      <TableRow
        style={[
          styles.row,
          index % 2 === 0 ? styles.evenRow : styles.oddRow
        ]}
      >
        <TouchableWithoutFeedback onPress={() => onRowPress?.(item.id)}>
          <View style={styles.rowContent}>
            {columns.map((column, columnIndex) => (
              <View
                key={`${item.id}-${column.key}`}
                style={[
                  styles.cell,
                  { width: column.width as DimensionValue }
                ]}
              >
                <View style={styles.cellInner}>
                  {column.render ? (
                    column.render(item)
                  ) : (
                    <View style={styles.textContainer}>
                      <Text 
                        style={styles.cellText}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {item[column.key]}
                      </Text>
                    </View>
                  )}
                  {columnIndex === columns.length - 1 && (
                    useActionMenu && getActions ? (
                      <ActionMenu actions={getActions(item)} />
                    ) : onRowDelete && (
                      <Pressable
                        onPress={() => {
                          LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                          onRowDelete(item.id);
                        }}
                        style={styles.deleteButton}
                      >
                        <Trash2 size={20} color="#ef4444" />
                      </Pressable>
                    )
                  )}
                </View>
              </View>
            ))}
          </View>
        </TouchableWithoutFeedback>
      </TableRow>
    );
  }, [columns, onRowPress, onRowDelete, useActionMenu, getActions]);

  // Affichage du loader pendant le chargement
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Table style={styles.table}>
          <TableHeader style={styles.header}>
            <TableRow style={styles.headerRow}>
              {columns.map((column) => (
                <TableHead 
                  key={column.key}
                  style={[
                    styles.headerCell,
                    { width: column.width as DimensionValue }
                  ]}
                >
                  {column.label && (
                    <View style={styles.headerTextContainer}>
                      <Text 
                        style={styles.headerText}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {column.label}
                      </Text>
                    </View>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableLoader message={loadingMessage} />
        </Table>
      </View>
    );
  }

  // Affichage de l'état vide si pas de données
  if (!data || data.length === 0) {
    return (
      <View style={styles.container}>
        <Table style={styles.table}>
          <TableHeader style={styles.header}>
            <TableRow style={styles.headerRow}>
              {columns.map((column) => (
                <TableHead 
                  key={column.key}
                  style={[
                    styles.headerCell,
                    { width: column.width as DimensionValue }
                  ]}
                >
                  {column.label && (
                    <View style={styles.headerTextContainer}>
                      <Text 
                        style={styles.headerText}
                        numberOfLines={1}
                        ellipsizeMode="tail"
                      >
                        {column.label}
                      </Text>
                    </View>
                  )}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <EmptyState message={emptyMessage} />
        </Table>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Table style={styles.table}>
        <TableHeader style={styles.header}>
          <TableRow style={styles.headerRow}>
            {columns.map((column) => (
              <TableHead 
                key={column.key}
                style={[
                  styles.headerCell,
                  { width: column.width as DimensionValue }
                ]}
              >
                {column.label && (
                  <View style={styles.headerTextContainer}>
                    <Text 
                      style={styles.headerText}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {column.label}
                    </Text>
                  </View>
                )}
              </TableHead>
            ))}
          </TableRow>
        </TableHeader>
        
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          style={styles.list}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews={true}
          initialNumToRender={20}
          maxToRenderPerBatch={8}
          windowSize={5}
          getItemLayout={(data, index) => ({
            length: 58,
            offset: 58 * index,
            index,
          })}
        />
      </Table>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    overflow: 'hidden',
  },
  table: {
    flex: 1,
  },
  header: {
    borderBottomWidth: 1,
    borderBottomColor: '#F4F5F5',
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#F1F1F1',
    opacity: 0.5,
    minHeight: 52,
    alignItems: 'center',
  },
  headerCell: {
    padding: 16,
    minHeight: 52,
    justifyContent: 'center',
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 16,
    color: '#2A2E33',
    fontWeight: '300',
    textDecorationLine: 'underline',
  },
  list: {
    flex: 1,
    width: '100%',
  },
  listContent: {
    flexGrow: 1,
  },
  row: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: '#F4F5F5',
    height: 58,
    alignItems: 'center',
  },
  rowContent: {
    flex: 1,
    flexDirection: 'row',
    height: '100%',
    alignItems: 'center',
  },
  evenRow: {
    backgroundColor: '#FFFFFF',
  },
  oddRow: {
    backgroundColor: '#F8F9FA',
  },
  cell: {
    padding: 16,
    height: '100%',
    justifyContent: 'center',
  },
  cellInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '100%',
  },
  textContainer: {
    flex: 1,
  },
  cellText: {
    fontSize: 15,
    color: '#2A2E33',
    fontWeight: '400',
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#FAFAFA',
  },
  emptyMessage: {
    fontSize: 16,
    color: '#999999',
    fontWeight: '400',
    textAlign: 'center',
  },
});

export { 
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  ForkTable
};