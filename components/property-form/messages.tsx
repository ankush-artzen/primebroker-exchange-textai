import { fieldErrorText, formErrorBanner } from "@/lib/form-errors";
import { cn } from "@/lib/utils";

export function SectionMessage({
  title,
  hint,
  className,
}: {
  title: string;
  hint?: string;
  className?: string;
}) {
  return (
    <div className={className}>
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {hint ? <p className="mt-0.5 text-[12px] leading-relaxed text-muted">{hint}</p> : null}
    </div>
  );
}

export function FieldMessage({ children }: { children: string }) {
  return <p className={fieldErrorText}>{children}</p>;
}

export function FormMessage({ children, className }: { children: string; className?: string }) {
  return <p className={cn(formErrorBanner, className)}>{children}</p>;
}
