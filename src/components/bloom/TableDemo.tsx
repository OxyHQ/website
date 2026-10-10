import { useState } from 'react';
import { Avatar } from '@oxy.so/bloom/avatar';
import { Badge } from '@oxy.so/bloom/badge';
import {
  DataTable,
  DataTableFilter,
  DataTableSearch,
  DataTableSelect,
  DataTableRowActions,
} from '@oxy.so/bloom/data-table';
import { RiFileCopyLine } from '@oxy.so/bloom/icons/RiFileCopyLine';
import { useTranslation } from '../../lib/i18n';

const customers = Array.from({ length: 48 }, (_, i) => ({
  id: String(i),
  name: ['Maya Collins', 'Alex Rivera', 'Sam Morgan', 'Jamie Lee', 'Robin Taylor', 'Morgan Chen'][
    i % 6
  ]!,
  price: 145 + ((i * 193) % 3100),
  purchase: ['waiting', 'completed', 'processing'][i % 3]!,
  status: ['failed', 'delivered', 'pending'][i % 3]!,
  product: ['web', 'native'][i % 2]!,
  region: ['eu', 'us'][i % 2]!,
  updated: new Date(2026, 8, 30 - (i % 20)),
}));

/** Bloom's table and its own filters, selects, badges and row actions. */
export default function TableDemo() {
  const { t, locale } = useTranslation();
  const [price, setPrice] = useState('all');
  const [product, setProduct] = useState('all');
  const [region, setRegion] = useState('all');
  const [search, setSearch] = useState('');
  const [purchases, setPurchases] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState(false);
  const text = (key: string) => t(`bloom.table.${key}`);
  const rows = customers.filter(
    (row) =>
      (price === 'all' || row.price < 1000) &&
      (product === 'all' || row.product === product) &&
      (region === 'all' || row.region === region) &&
      row.name.toLocaleLowerCase(locale).includes(search.toLocaleLowerCase(locale)),
  );
  const options = [
    { value: 'waiting', label: text('waiting'), dot: 'warning' as const },
    { value: 'completed', label: text('completed'), dot: 'success' as const },
    { value: 'processing', label: text('processing'), dot: 'info' as const },
  ];
  return (
    <DataTable
      rows={rows}
      getRowId={(row) => row.id}
      accessibilityLabel="Bloom DataTable"
      title={text('results')}
      summary={`${new Intl.NumberFormat(locale).format(rows.length)} ${text('customers')}`}
      pageSize={5}
      selectable
      defaultSelectedRowIds={['1', '2']}
      minWidth={790}
      columns={[
        {
          id: 'name',
          header: t('bloom.name'),
          accessor: (row) => row.name,
          basis: 230,
          cell: ({ row }) => (
            <div className="flex items-center gap-2">
              <Avatar name={row.name} size={24} />
              <span className="truncate">{row.name}</span>
            </div>
          ),
        },
        {
          id: 'purchase',
          header: text('purchase'),
          accessor: (row) => purchases[row.id] ?? row.purchase,
          basis: 170,
          cell: ({ row, size }) => (
            <DataTableSelect
              label={`${text('purchase')}: ${row.name}`}
              options={options}
              value={purchases[row.id] ?? row.purchase}
              onValueChange={(value) =>
                setPurchases((previous) => ({ ...previous, [row.id]: value }))
              }
              width={142}
              size={size}
            />
          ),
        },
        {
          id: 'status',
          header: t('bloom.status'),
          accessor: (row) => row.status,
          basis: 140,
          cell: ({ row }) => (
            <Badge
              size="label-medium"
              tone={
                row.status === 'failed'
                  ? 'danger'
                  : row.status === 'delivered'
                    ? 'success'
                    : 'warning'
              }
              content={text(row.status)}
            />
          ),
        },
        {
          id: 'updated',
          header: text('updated'),
          accessor: (row) => row.updated,
          basis: 130,
          cell: ({ row }) =>
            new Intl.DateTimeFormat(locale, {
              day: 'numeric',
              month: 'short',
            }).format(row.updated),
        },
        {
          id: 'price',
          header: text('price'),
          accessor: (row) => row.price,
          basis: 100,
          cell: ({ row }) =>
            new Intl.NumberFormat(locale, {
              style: 'currency',
              currency: 'EUR',
              maximumFractionDigits: 0,
            }).format(row.price),
        },
        {
          id: 'actions',
          header: '',
          width: 44,
          cell: ({ row }) => (
            <DataTableRowActions
              name={row.name}
              actions={[
                {
                  icon: RiFileCopyLine,
                  label: copied ? t('docs.copied') : t('common.copyCode'),
                  onPress: () => {
                    void navigator.clipboard.writeText(row.name).then(() => setCopied(true));
                  },
                },
              ]}
            />
          ),
        },
      ]}
      toolbar={
        <>
          <DataTableFilter
            label={text('prices')}
            value={price}
            onValueChange={setPrice}
            options={[
              { value: 'all', label: text('prices') },
              { value: 'under', label: '€ < 1,000' },
            ]}
          />
          <DataTableFilter
            label={text('products')}
            value={product}
            onValueChange={setProduct}
            options={[
              { value: 'all', label: text('products') },
              { value: 'web', label: 'Web' },
              { value: 'native', label: 'React Native' },
            ]}
          />
          <DataTableFilter
            label={text('regions')}
            value={region}
            onValueChange={setRegion}
            options={[
              { value: 'all', label: text('regions') },
              { value: 'eu', label: 'EU' },
              { value: 'us', label: 'US' },
            ]}
          />
          <DataTableSearch
            label={text('search')}
            placeholder={text('search')}
            value={search}
            onValueChange={setSearch}
          />
        </>
      }
      style={{ width: '100%' }}
    />
  );
}
