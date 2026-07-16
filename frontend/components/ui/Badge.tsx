import { cn } from "@/lib/utils";

type BadgeProps = {
  children: React.ReactNode;
  className?: string;
};

export function Badge({ children, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-sm bg-accent-soft px-2 py-1 text-xs font-medium text-accent",
        className,
      )}
    >
      {children}
    </span>
  );
}
