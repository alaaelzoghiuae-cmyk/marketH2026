import React from 'react';
import { AdminThemeGuard } from '@/components/AdminThemeGuard.jsx';
import { AdminCommandPalette } from '@/components/AdminCommandPalette.jsx';
import {
  renderAdminDashboard as renderAdminDashboardImpl,
  renderAdminSubTabBar as renderAdminSubTabBarImpl,
  renderAdminOverview as renderAdminOverviewImpl,
  renderVisitorStats as renderVisitorStatsImpl,
  renderAdminOrders as renderAdminOrdersImpl,
  renderAdminTeam as renderAdminTeamImpl,
} from '@/sections/AdminMain.jsx';
import {
  renderAdminCatalog as renderAdminCatalogImpl,
  renderAdminQuickStock as renderAdminQuickStockImpl,
  renderAdminGroups as renderAdminGroupsImpl,
  renderProfitProtectionShieldCard as renderProfitProtectionShieldCardImpl,
} from '@/sections/AdminCatalog.jsx';
import {
  renderAdminPromoCodes as renderAdminPromoCodesImpl,
  renderAdSeg as renderAdSegImpl,
  renderAdToggle as renderAdToggleImpl,
  renderAdminRestockAlertsView as renderAdminRestockAlertsViewImpl,
  renderAdminFeatureFlagsDashboard as renderAdminFeatureFlagsDashboardImpl,
} from '@/sections/AdminMarketing.jsx';
import {
  renderAdminSiteSettings as renderAdminSiteSettingsImpl,
  renderAdminStorefrontCms as renderAdminStorefrontCmsImpl,
  renderCmsAccordionHeader as renderCmsAccordionHeaderImpl,
  renderPrecisionImageControls as renderPrecisionImageControlsImpl,
} from '@/sections/AdminCms.jsx';
import {
  renderAdminClients as renderAdminClientsImpl,
  renderAdminReturnsAndComplaints as renderAdminReturnsAndComplaintsImpl,
  renderAdminApproveRequestModal as renderAdminApproveRequestModalImpl,
  renderAdminCreateClientModal as renderAdminCreateClientModalImpl,
  renderAdminSecurityModal as renderAdminSecurityModalImpl,
} from '@/sections/AdminClients.jsx';
import {
  renderGmReportDocumentContent as renderGmReportDocumentContentImpl,
  renderAdminExecutiveReportsView as renderAdminExecutiveReportsViewImpl,
  renderGmReportPrintModal as renderGmReportPrintModalImpl,
  renderAdminDatabaseSchema as renderAdminDatabaseSchemaImpl,
} from '@/sections/AdminReports.jsx';

/**
 * Isolated lazy-loaded Admin Portal chunk.
 * Regular storefront visitors NEVER download any Admin dashboard code.
 */
export default function LazyAdminPortal({ ctx }) {
  const adminCtx = { ...ctx };
  adminCtx.renderAdminSubTabBar = (...a) => renderAdminSubTabBarImpl(adminCtx, ...a);
  adminCtx.renderAdminOverview = (...a) => renderAdminOverviewImpl(adminCtx, ...a);
  adminCtx.renderVisitorStats = (...a) => renderVisitorStatsImpl(adminCtx, ...a);
  adminCtx.renderAdminOrders = (...a) => renderAdminOrdersImpl(adminCtx, ...a);
  adminCtx.renderAdminTeam = (...a) => renderAdminTeamImpl(adminCtx, ...a);
  adminCtx.renderAdminCatalog = (...a) => renderAdminCatalogImpl(adminCtx, ...a);
  adminCtx.renderAdminQuickStock = (...a) => renderAdminQuickStockImpl(adminCtx, ...a);
  adminCtx.renderAdminGroups = (...a) => renderAdminGroupsImpl(adminCtx, ...a);
  adminCtx.renderProfitProtectionShieldCard = (...a) => renderProfitProtectionShieldCardImpl(adminCtx, ...a);
  adminCtx.renderAdminPromoCodes = (...a) => renderAdminPromoCodesImpl(adminCtx, ...a);
  adminCtx.renderAdSeg = (...a) => renderAdSegImpl(adminCtx, ...a);
  adminCtx.renderAdToggle = (...a) => renderAdToggleImpl(adminCtx, ...a);
  adminCtx.renderAdminRestockAlertsView = (...a) => renderAdminRestockAlertsViewImpl(adminCtx, ...a);
  adminCtx.renderAdminFeatureFlagsDashboard = (...a) => renderAdminFeatureFlagsDashboardImpl(adminCtx, ...a);
  adminCtx.renderAdminSiteSettings = (...a) => renderAdminSiteSettingsImpl(adminCtx, ...a);
  adminCtx.renderAdminStorefrontCms = (...a) => renderAdminStorefrontCmsImpl(adminCtx, ...a);
  adminCtx.renderCmsAccordionHeader = (...a) => renderCmsAccordionHeaderImpl(adminCtx, ...a);
  adminCtx.renderPrecisionImageControls = (...a) => renderPrecisionImageControlsImpl(adminCtx, ...a);
  adminCtx.renderAdminClients = (...a) => renderAdminClientsImpl(adminCtx, ...a);
  adminCtx.renderAdminReturnsAndComplaints = (...a) => renderAdminReturnsAndComplaintsImpl(adminCtx, ...a);
  adminCtx.renderAdminApproveRequestModal = (...a) => renderAdminApproveRequestModalImpl(adminCtx, ...a);
  adminCtx.renderAdminCreateClientModal = (...a) => renderAdminCreateClientModalImpl(adminCtx, ...a);
  adminCtx.renderAdminSecurityModal = (...a) => renderAdminSecurityModalImpl(adminCtx, ...a);
  adminCtx.renderGmReportDocumentContent = (...a) => renderGmReportDocumentContentImpl(adminCtx, ...a);
  adminCtx.renderAdminExecutiveReportsView = (...a) => renderAdminExecutiveReportsViewImpl(adminCtx, ...a);
  adminCtx.renderGmReportPrintModal = (...a) => renderGmReportPrintModalImpl(adminCtx, ...a);
  adminCtx.renderAdminDatabaseSchema = (...a) => renderAdminDatabaseSchemaImpl(adminCtx, ...a);

  return (
    <>
      <main className="flex-1 flex flex-col">
        <AdminThemeGuard />
        {renderAdminDashboardImpl(adminCtx)}
      </main>
      {adminCtx.renderGmReportPrintModal()}
      {adminCtx.renderAdminApproveRequestModal()}
      {adminCtx.renderAdminCreateClientModal()}
      {adminCtx.renderAdminSecurityModal()}
      {adminCtx.adminAuthenticated && (
        <AdminCommandPalette setAdminTab={adminCtx.setAdminTab} currentTab={adminCtx.adminTab} />
      )}
    </>
  );
}
