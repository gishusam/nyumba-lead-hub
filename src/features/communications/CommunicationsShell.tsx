import { Link, Outlet } from "@tanstack/react-router";
import { MessageSquareText } from "lucide-react";

import { communicationsNavigation } from "./communications-navigation";

export function CommunicationsShell() {
  return (
    <div className="min-w-0 p-4 sm:p-6 lg:p-8">
      <header className="flex flex-col gap-4 border-b border-border pb-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="min-w-0">
          <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm">
            <MessageSquareText className="h-3.5 w-3.5" />
            Communications workspace
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Communications
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
            Manage outreach, follow-ups, newsletters, and delivery health.
          </p>
        </div>

        <div className="rounded-lg border border-border bg-muted/30 px-3 py-2 text-xs text-muted-foreground">
          Slice 1 · Overview foundation
        </div>
      </header>

      <nav
        aria-label="Communications sections"
        className="-mx-4 overflow-x-auto border-b border-border px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8"
      >
        <div className="inline-flex min-w-max items-center gap-1 py-3">
          {communicationsNavigation.map((item) =>
            item.enabled ? (
              <Link
                key={item.to}
                to="/communications"
                activeOptions={{ exact: true }}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                activeProps={{
                  className:
                    "rounded-lg bg-primary/10 px-3 py-2 text-sm font-semibold text-primary",
                }}
              >
                {item.label}
              </Link>
            ) : (
              <span
                key={item.to}
                aria-disabled="true"
                title="Coming in a later implementation slice"
                className="cursor-not-allowed rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground/55"
              >
                {item.label}
              </span>
            ),
          )}
        </div>
      </nav>

      <section className="min-w-0 pt-6">
        <Outlet />
      </section>
    </div>
  );
}
