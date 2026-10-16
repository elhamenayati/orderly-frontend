"use client";

import { useMemo, useState, type ReactNode } from "react";
import { Plus, Search, UserRound, Pencil } from "lucide-react";
import {
  customerById,
  formatCustomerMobile,
  searchCustomers,
} from "@/lib/salon/customers";
import { RegisterCustomerDialog } from "@/components/salon/booking/register-customer-dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { Customer } from "@/types/domain";

type CustomerPickerSectionProps = {
  customerId: string | null;
  onSelect: (customerId: string | null) => void;
  aside?: ReactNode;
};

export function CustomerPickerSection({
  customerId,
  onSelect,
  aside,
}: CustomerPickerSectionProps) {
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [registerOpen, setRegisterOpen] = useState(false);
  const [customerRefresh, setCustomerRefresh] = useState(0);

  const selected = useMemo(
    () => customerById(customerId),
    [customerId, customerRefresh],
  );

  const results = useMemo(() => searchCustomers(query), [query, customerRefresh]);

  function handleRegistered(customer: Customer) {
    setCustomerRefresh((value) => value + 1);
    onSelect(customer.id);
    setQuery("");
    setShowResults(false);
  }

  if (selected) {
    return (
      <>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="flex min-w-0 items-center">
            <div className="flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-3">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <UserRound className="size-5" />
                </span>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{selected.fullName}</p>
                  <p className="text-sm text-muted-foreground" dir="ltr">
                    {formatCustomerMobile(selected.mobile)}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 rounded-xl border-primary text-primary hover:bg-primary/5 hover:text-primary"
                onClick={() => onSelect(null)}
              >
                <Pencil className="size-4" />
                تغییر مشتری
              </Button>
            </div>
          </div>
          {aside ? (
            <div className="flex min-w-0 items-center justify-center">{aside}</div>
          ) : null}
        </div>
        <RegisterCustomerDialog
          open={registerOpen}
          onOpenChange={setRegisterOpen}
          onRegistered={handleRegistered}
        />
      </>
    );
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="flex min-w-0 items-center gap-2">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute top-1/2 start-3 z-10 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              onBlur={() => {
                window.setTimeout(() => setShowResults(false), 150);
              }}
              placeholder="جستجو با نام یا شماره موبایل..."
              className="h-11 w-full rounded-xl border border-input bg-background ps-10 pe-3 text-sm"
            />
            {showResults ? (
              <div className="absolute inset-x-0 top-full z-20 mt-1 overflow-hidden rounded-xl border border-border bg-card shadow-md">
                {results.length === 0 ? (
                  <p className="px-4 py-6 text-center text-sm text-muted-foreground">
                    مشتری یافت نشد. از «مشتری جدید» استفاده کنید.
                  </p>
                ) : (
                  <ul className="max-h-56 overflow-y-auto">
                    {results.map((customer) => (
                      <li key={customer.id}>
                        <button
                          type="button"
                          className={cn(
                            "flex w-full items-center justify-between gap-3 px-4 py-3 text-start text-sm transition hover:bg-muted/60",
                          )}
                          onMouseDown={(event) => event.preventDefault()}
                          onClick={() => {
                            onSelect(customer.id);
                            setQuery("");
                            setShowResults(false);
                          }}
                        >
                          <span className="font-medium">{customer.fullName}</span>
                          <span className="text-muted-foreground" dir="ltr">
                            {formatCustomerMobile(customer.mobile)}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ) : null}
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-11 shrink-0 rounded-xl border-primary text-primary hover:bg-primary/5 hover:text-primary"
            onClick={() => setRegisterOpen(true)}
          >
            <Plus className="size-4" />
            مشتری جدید
          </Button>
        </div>
        {aside ? (
          <div className="flex min-w-0 items-center justify-center">{aside}</div>
        ) : null}
      </div>

      <RegisterCustomerDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onRegistered={handleRegistered}
      />
    </>
  );
}
