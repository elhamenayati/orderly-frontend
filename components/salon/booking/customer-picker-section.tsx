"use client";

import { useMemo, useState } from "react";
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
};

export function CustomerPickerSection({
  customerId,
  onSelect,
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
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card px-4 py-4">
          <div className="flex items-center gap-3">
            <span className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
              <UserRound className="size-6" />
            </span>
            <div>
              <p className="font-semibold">{selected.fullName}</p>
              <p className="text-sm text-muted-foreground" dir="ltr">
                {formatCustomerMobile(selected.mobile)}
              </p>
            </div>
          </div>
          <Button
            type="button"
            variant="outline"
            className="rounded-xl"
            onClick={() => onSelect(null)}
          >
            <Pencil className="size-4" />
            تغییر مشتری
          </Button>
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
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[240px] flex-1">
            <Search className="pointer-events-none absolute top-1/2 start-3 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setShowResults(true);
              }}
              onFocus={() => setShowResults(true)}
              placeholder="جستجو با نام یا شماره موبایل..."
              className="h-11 w-full rounded-xl border border-input bg-background ps-10 pe-3 text-sm"
            />
          </div>
          <Button
            type="button"
            variant="outline"
            className="h-11 rounded-xl"
            onClick={() => setRegisterOpen(true)}
          >
            <Plus className="size-4" />
            مشتری جدید
          </Button>
        </div>

        {showResults ? (
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
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

      <RegisterCustomerDialog
        open={registerOpen}
        onOpenChange={setRegisterOpen}
        onRegistered={handleRegistered}
      />
    </>
  );
}
