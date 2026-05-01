-- Migration 0007 — expense amount snapshot validation
-- Constitution principle IV: amount_ars / amount_usd must be coherent with amount + currency + fx_rate_used

create or replace function public.validate_expense_amounts()
returns trigger
language plpgsql
as $$
declare
  expected_ars numeric(14, 2);
  expected_usd numeric(14, 2);
begin
  if new.currency = 'ARS' then
    expected_ars := new.amount;
    expected_usd := round(new.amount / new.fx_rate_used, 2);
  else
    expected_usd := new.amount;
    expected_ars := round(new.amount * new.fx_rate_used, 2);
  end if;

  -- Tolerate ±0.02 rounding drift
  if abs(new.amount_ars - expected_ars) > 0.02 then
    raise exception 'amount_ars (%) inconsistent with amount * fx_rate_used (%)',
      new.amount_ars, expected_ars;
  end if;
  if abs(new.amount_usd - expected_usd) > 0.02 then
    raise exception 'amount_usd (%) inconsistent with amount / fx_rate_used (%)',
      new.amount_usd, expected_usd;
  end if;

  return new;
end;
$$;

create trigger expenses_validate_amounts
before insert or update on public.expenses
for each row execute function public.validate_expense_amounts();
