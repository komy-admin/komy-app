import * as React from 'react';
import { cn } from '~/lib/utils';
import {
  Pressable,
  View,
  StyleSheet,
  FlatList,
  SectionList,
  LayoutAnimation,
  TouchableWithoutFeedback,
  Text as RNText
} from 'react-native';
import { Trash2, ListFilter } from 'lucide-react-native';
import { ActionMenu, ActionItem } from '~/components/ActionMenu';
import { TableLoader } from '~/components/TableLoader';
import { SectionDivider } from './SectionDivider';
import { colors } from '~/theme';

interface ColumnData {
  label?: string;
  key: string;
  width: number | string;
  render?: (item: any) => React.ReactNode;
  headerRender?: () => React.ReactNode;
}

interface SectionData {
  title: string;
  data: any[];
  key?: string;
  type?: string;
}

interface ForkTableProps {
  data: any[];
  columns: ColumnData[];
  sections?: SectionData[];
  onRowPress?: (id: string) => void;
  onRowDelete?: (id: string) => void;
  useActionMenu?: boolean;
  getActions?: (item: any) => ActionItem[];
  showActionColumn?: boolean;
  isLoading?: boolean;
  loadingMessage?: string;
  emptyMessage?: string;
  renderItem?: (info: any) => React.ReactElement;
  renderHeader?: () => React.ReactElement;
  sectionListRef?: React.RefObject<SectionList | null>;
  onScroll?: (event: any) => void;
  scrollEventThrottle?: number;
  getItemLayout?: (data: any, index: number) => { length: number; offset: number; index: number };
}

const Table = React.forwardRef<
  React.ComponentRef<typeof View>,
  React.ComponentPropsWithoutRef<typeof View>
>(({ className, ...props }, ref) => (
  <View ref={ref} className={cn('w-full caption-bottom', className)} {...props} />
));
Table.displayName = 'Table';

const TableHeader = React.forwardRef<
  React.ComponentRef<typeof View>,
  React.ComponentPropsWithoutRef<typeof View>
>(({ className, ...props }, ref) => (
  <View ref={ref} className={cn('[&_tr]:border-b', className)} {...props} />
));
TableHeader.displayName = 'TableHeader';

const TableRow = React.forwardRef<
  React.ComponentRef<typeof View>,
  React.ComponentPropsWithoutRef<typeof View>
>(({ className, ...props }, ref) => (
  <View
    ref={ref}
    className={cn(
      'flex flex-row data-[state=selected]:bg-muted',
      className
    )}
    {...props}
  />
));
TableRow.displayName = 'TableRow';

const TableHead = React.forwardRef<
  React.ComponentRef<typeof View>,
  React.ComponentPropsWithoutRef<typeof View>
>(({ className, ...props }, ref) => (
  <View
    ref={ref}
    className={className}
    {...props}
  />
));
TableHead.displayName = 'TableHead';

const EmptyState: React.FC<{ message: string }> = ({ message }) => (
  <View style={styles.emptyState}>
    <RNText style={styles.emptyMessage}>{message}</RNText>
  </View>
);

const HeaderFilterIcon = () => (
  <View style={styles.filterIcon}>
    <ListFilter size={18} color={colors.brand.dark} strokeWidth={2.5} />
  </View>
);

const ForkTable = React.memo(({
  data,
  columns,
  sections,
  onRowPress,
  onRowDelete,
  useActionMenu = false,
  getActions,
  showActionColumn = false,
  isLoading = false,
  loadingMessage = "Chargement des données...",
  emptyMessage = "Aucune donnée disponible",
  renderItem: customRenderItem,
  renderHeader: customRenderHeader,
  sectionListRef,
  onScroll,
  scrollEventThrottle,
  getItemLayout,
}: ForkTableProps) => {
  const hasActionColumn = showActionColumn || (useActionMenu && !!getActions) || !!onRowDelete;

  const getColumnSizeStyle = React.useCallback((width: number | string) => {
    if (typeof width === 'number') return { width };
    return { flex: parseFloat(width) || 1 };
  }, []);

  const defaultRenderItem = React.useCallback(({ item, index }: { item: any; index: number }) => {
    return (
      <TableRow
        style={[
          styles.row,
          index % 2 === 0 ? styles.evenRow : styles.oddRow
        ]}
      >
        <TouchableWithoutFeedback onPress={() => onRowPress?.(item.id)}>
          <View style={styles.rowContent}>
            {columns.map((column) => (
              <View
                key={`${item.id}-${column.key}`}
                style={[
                  column.label ? styles.cell : styles.cellCompact,
                  getColumnSizeStyle(column.width)
                ]}
              >
                {column.render ? (
                  column.render(item)
                ) : (
                  <View style={styles.textContainer}>
                    <RNText
                      style={styles.cellText}
                      numberOfLines={1}
                      ellipsizeMode="tail"
                    >
                      {item[column.key]}
                    </RNText>
                  </View>
                )}
              </View>
            ))}
          </View>
        </TouchableWithoutFeedback>
        {hasActionColumn && (
          <View style={styles.actionCell}>
            {useActionMenu && getActions ? (
              <ActionMenu actions={getActions(item)} />
            ) : onRowDelete ? (
              <Pressable
                onPress={() => {
                  LayoutAnimation.configureNext(LayoutAnimation.Presets.spring);
                  onRowDelete(item.id);
                }}
                style={styles.deleteButton}
              >
                <Trash2 size={20} color={colors.error.base} />
              </Pressable>
            ) : null}
          </View>
        )}
      </TableRow>
    );
  }, [columns, onRowPress, onRowDelete, useActionMenu, getActions, hasActionColumn]);

  const renderSectionHeader = React.useCallback(({ section }: { section: any }) => (
    <SectionDivider title={section.title} />
  ), []);

  const headerContent = customRenderHeader ? customRenderHeader() : (
    <TableHeader style={styles.header}>
      <TableRow style={styles.headerRow}>
        <View style={styles.headerColumns}>
          {columns.map((column) => (
            <TableHead
              key={column.key}
              style={[
                column.label ? styles.headerCell : styles.headerCellCompact,
                getColumnSizeStyle(column.width)
              ]}
            >
              {column.headerRender ? (
                column.headerRender()
              ) : column.label ? (
                <View style={styles.headerTextContainer}>
                  <RNText
                    style={styles.headerText}
                    numberOfLines={1}
                    ellipsizeMode="tail"
                  >
                    {column.label}
                  </RNText>
                </View>
              ) : (
                <HeaderFilterIcon />
              )}
            </TableHead>
          ))}
        </View>
        {hasActionColumn && (
          <View style={styles.actionHeaderCell}>
            <RNText style={styles.headerText}>Action</RNText>
          </View>
        )}
      </TableRow>
    </TableHeader>
  );

  const hasData = sections
    ? sections.some(s => s.data.length > 0)
    : data && data.length > 0;

  if (isLoading) {
    return (
      <View style={styles.container}>
        <Table style={styles.table}>
          {headerContent}
          <TableLoader message={loadingMessage} />
        </Table>
      </View>
    );
  }

  if (!hasData) {
    return (
      <View style={styles.container}>
        <Table style={styles.table}>
          {headerContent}
          <EmptyState message={emptyMessage} />
        </Table>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Table style={styles.table}>
        {headerContent}

        {sections ? (
          <SectionList
            ref={sectionListRef}
            sections={sections}
            renderItem={customRenderItem || defaultRenderItem}
            renderSectionHeader={renderSectionHeader}
            keyExtractor={(item) => item.id.toString()}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            stickySectionHeadersEnabled={false}
            removeClippedSubviews={true}
            initialNumToRender={30}
            maxToRenderPerBatch={15}
            windowSize={7}
            onScroll={onScroll}
            scrollEventThrottle={scrollEventThrottle}
            getItemLayout={getItemLayout}
          />
        ) : (
          <FlatList
            data={data}
            renderItem={customRenderItem || defaultRenderItem}
            keyExtractor={(item) => item.id.toString()}
            style={styles.list}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            removeClippedSubviews={true}
            initialNumToRender={20}
            maxToRenderPerBatch={8}
            windowSize={5}
            getItemLayout={(_data, index) => ({
              length: 58,
              offset: 58 * index,
              index,
            })}
          />
        )}
      </Table>
    </View>
  );
});

ForkTable.displayName = 'ForkTable';

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
    borderBottomColor: colors.gray[100],
  },
  headerRow: {
    flexDirection: 'row',
    backgroundColor: '#ECEEF0',
    minHeight: 52,
    alignItems: 'center',
  },
  headerColumns: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerCell: {
    padding: 16,
    minHeight: 52,
    justifyContent: 'center',
  },
  headerCellCompact: {
    paddingHorizontal: 0,
    paddingVertical: 8,
    minHeight: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  headerText: {
    fontSize: 13,
    color: colors.brand.dark,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  actionHeaderCell: {
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 52,
  },
  filterIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.white,
    borderWidth: 1.5,
    borderColor: colors.gray[300],
    justifyContent: 'center',
    alignItems: 'center',
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
    borderBottomColor: colors.gray[100],
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
    backgroundColor: colors.white,
  },
  oddRow: {
    backgroundColor: colors.gray[50],
  },
  cell: {
    padding: 16,
    height: '100%',
    justifyContent: 'center',
  },
  cellCompact: {
    paddingVertical: 8,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  cellText: {
    fontSize: 15,
    color: colors.brand.dark,
    fontWeight: '400',
  },
  actionCell: {
    width: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteButton: {
    padding: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: colors.gray[50],
  },
  emptyMessage: {
    fontSize: 16,
    color: colors.gray[400],
    fontWeight: '400',
    textAlign: 'center',
  },
});

export {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  ForkTable,
};
