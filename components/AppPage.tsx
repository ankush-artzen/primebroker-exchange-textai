import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  title?: string;
  subtitle?: string;
  action?: ReactNode;
  header?: ReactNode;
}

export function AppPage({ children, title, subtitle, action, header }: Props) {
  return (
    <div className="px-5 pb-6 pt-5 md:px-8 md:pb-8 md:pt-8 lg:px-10">
      {header ??
        (title ? (
          <header className="mb-4 flex items-center justify-between gap-3">
            <div className="min-w-0">
              <h1 className="font-serif text-[23px] font-medium text-primary">
                {title}
              </h1>
              {subtitle ? (
                <p className="text-[12.5px] text-muted">{subtitle}</p>
              ) : null}
            </div>
            {action ? <div className="shrink-0">{action}</div> : null}
          </header>
        ) : null)}
      {children}
    </div>
  );
}

export function AddButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
    >
      + Add
    </button>
  );
}
