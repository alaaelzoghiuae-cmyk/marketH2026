-- =====================================================================
-- ELZOGHBI — Security Fix #7, Stage B Part 2 v2: THE COLUMN LOCK
-- Why v2: the first attempt (revoke select (col) ...) reported Success
-- but changed nothing — the anon role holds a TABLE-level select grant
-- on these tables, which overrides column-level revokes. This version
-- replaces the table-level grant with a column-level grant covering
-- every column EXCEPT the two secret ones. Verified column lists were
-- read from the live tables on 2026-11-22.
-- Writes are unaffected (insert/update grants stay table-level, and
-- the app writes with return=minimal). The security-definer login
-- functions run as the table owner and keep working.
-- NOTE: any FUTURE column added to these two tables will not be
-- readable by the public key until granted here.
-- =====================================================================
revoke select on public.site_settings from anon, authenticated;
grant select (id, settings, currencies, notifications, updated_at)
  on public.site_settings to anon, authenticated;

revoke select on public.clients from anon, authenticated;
grant select (id, name, owner, phone, email, address, secondary_address,
              group_id, wallet_balance, credit_limit, avatar, avatar_bg,
              avatar_image, status, created_at, ledger, balance, type,
              account_type, updated_at, data, cashback_earned, order_count,
              is_vip, loyalty_tier, last_order_at, birth_date, referral_code,
              referred_by_code, referrer_client_id, saved_family_devices,
              birth_date_locked, total_paid_spent, has_used_referral)
  on public.clients to anon, authenticated;

-- ROLLBACK (only if something breaks):
-- grant select on public.site_settings to anon, authenticated;
-- grant select on public.clients       to anon, authenticated;
