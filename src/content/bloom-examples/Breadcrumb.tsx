import { Breadcrumb, BreadcrumbItem } from '@oxy.so/bloom/breadcrumb';

export default function BreadcrumbExample() {
  return (
    <div className="w-full max-w-lg space-y-4 text-foreground">
      <Breadcrumb>
        <BreadcrumbItem>Workspace</BreadcrumbItem>
        <BreadcrumbItem>Projects</BreadcrumbItem>
        <BreadcrumbItem>New idea</BreadcrumbItem>
      </Breadcrumb>
    </div>
  );
}
