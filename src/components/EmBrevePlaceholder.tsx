type Props = {
  title: string;
};

export function EmBrevePlaceholder({ title }: Props) {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <h1 className="mb-3 text-2xl font-semibold text-foreground">{title}</h1>
      <span className="rounded-full bg-secondary px-3 py-1 text-xs font-medium uppercase tracking-wide text-primary">
        Em breve
      </span>
    </div>
  );
}
