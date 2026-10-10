import {
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
} from '@oxy.so/bloom/table';

export default function TableExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <Table>
        <TableHeader>
          <TableColumn>Project</TableColumn>
          <TableColumn>Status</TableColumn>
        </TableHeader>
        <TableBody>
          <TableRow>
            <TableCell>New website</TableCell>
            <TableCell>In progress</TableCell>
          </TableRow>
          <TableRow>
            <TableCell>Design system</TableCell>
            <TableCell>Ready</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    </div>
  );
}
