import React from 'react';
import {
  renderClientOrdersView as renderClientOrdersViewImpl,
  renderClientLedgerView as renderClientLedgerViewImpl,
  renderClientReturnsView as renderClientReturnsViewImpl,
  renderClientComplaintsView as renderClientComplaintsViewImpl,
  renderClientProfileSettingsView as renderClientProfileSettingsViewImpl,
  renderClientAccountPortal as renderClientAccountPortalImpl,
} from '@/sections/Account.jsx';

export default function LazyAccount({ ctx }) {
  const acctCtx = { ...ctx };
  acctCtx.renderClientOrdersView = (...a) => renderClientOrdersViewImpl(acctCtx, ...a);
  acctCtx.renderClientLedgerView = (...a) => renderClientLedgerViewImpl(acctCtx, ...a);
  acctCtx.renderClientReturnsView = (...a) => renderClientReturnsViewImpl(acctCtx, ...a);
  acctCtx.renderClientComplaintsView = (...a) => renderClientComplaintsViewImpl(acctCtx, ...a);
  acctCtx.renderClientProfileSettingsView = (...a) => renderClientProfileSettingsViewImpl(acctCtx, ...a);
  return renderClientAccountPortalImpl(acctCtx);
}
