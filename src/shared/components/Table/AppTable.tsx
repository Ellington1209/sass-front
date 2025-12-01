import React, { useState } from 'react';
import { Table, Radio, Divider } from 'antd';
import type { TableColumnsType, TableProps } from 'antd';
import './table.scss';

export interface AppTableColumn<T = any> {
  title: string;
  dataIndex?: string | string[];
  key?: string;
  render?: (value: any, record: T, index: number) => React.ReactNode;
  sorter?: boolean | ((a: T, b: T) => number);
  filters?: Array<{ text: string; value: any }>;
  onFilter?: (value: any, record: T) => boolean;
  width?: number | string;
  align?: 'left' | 'right' | 'center';
  fixed?: 'left' | 'right';
  ellipsis?: boolean;
}

export interface AppTableProps<T = any> {
  columns: AppTableColumn<T>[];
  dataSource: T[];
  loading?: boolean;
  rowKey?: string | ((record: T) => string);
  pagination?: TableProps<T>['pagination'] | false;
  selectionType?: 'checkbox' | 'radio' | false;
  onSelectionChange?: (selectedRowKeys: React.Key[], selectedRows: T[]) => void;
  getCheckboxProps?: (record: T) => { disabled?: boolean; name?: string };
  showSelectionTypeToggle?: boolean;
  size?: 'small' | 'middle' | 'large';
  scroll?: { x?: number | string; y?: number | string };
  bordered?: boolean;
  className?: string;
}

/**
 * Componente de tabela reutilizável
 * Baseado no Ant Design Table com funcionalidades extras
 */
export function AppTable<T extends Record<string, any> = any>({
  columns,
  dataSource,
  loading = false,
  rowKey = 'key',
  pagination = { pageSize: 10, showSizeChanger: true, showTotal: (total) => `Total: ${total} itens` },
  selectionType = false,
  onSelectionChange,
  getCheckboxProps,
  showSelectionTypeToggle = false,
  size = 'middle',
  scroll,
  bordered = false,
  className = '',
}: AppTableProps<T>) {
  const [selectionTypeState, setSelectionTypeState] = useState<'checkbox' | 'radio'>('checkbox');

  // Converter colunas para o formato do Ant Design
  const antdColumns: TableColumnsType<T> = columns.map((col, index) => {
    const column: any = {
      title: col.title,
      key: col.key || (col.dataIndex 
        ? (typeof col.dataIndex === 'string' ? col.dataIndex : col.dataIndex.join('.'))
        : `column-${index}`),
      render: col.render,
      sorter: col.sorter,
      filters: col.filters,
      onFilter: col.onFilter,
      width: col.width,
      align: col.align,
      fixed: col.fixed,
      ellipsis: col.ellipsis,
    };

    // Só adiciona dataIndex se existir
    if (col.dataIndex) {
      column.dataIndex = col.dataIndex;
    }

    return column;
  });

  // Configuração de seleção de linhas
  const rowSelection: TableProps<T>['rowSelection'] | undefined = selectionType
    ? {
        type: showSelectionTypeToggle ? selectionTypeState : selectionType,
        onChange: onSelectionChange,
        getCheckboxProps: getCheckboxProps,
      }
    : undefined;

  return (
    <div className={`app-table ${className}`}>
      {showSelectionTypeToggle && selectionType && (
        <>
          <Radio.Group
            onChange={(e) => setSelectionTypeState(e.target.value)}
            value={selectionTypeState}
          >
            <Radio value="checkbox">Checkbox</Radio>
            <Radio value="radio">Radio</Radio>
          </Radio.Group>
          <Divider />
        </>
      )}

      <Table<T>
        rowSelection={rowSelection}
        columns={antdColumns}
        dataSource={dataSource}
        loading={loading}
        rowKey={rowKey}
        pagination={pagination}
        size={size}
        scroll={scroll}
        bordered={bordered}
      />
    </div>
  );
}

