// Mechanical monolith split: extracts module-level decls into lib modules and
// render functions into section modules that receive the App scope via ctx.
const fs = require('fs');
const path = require('path');
const parser = require('/home/hatch/workspace/elzoghbi_final/node_modules/@babel/parser');
const traverse = require('/home/hatch/workspace/elzoghbi_final/node_modules/@babel/traverse').default;

const SRC = 'src/App.jsx';
const src = fs.readFileSync(SRC, 'utf-8');
const ast = parser.parse(src, { sourceType: 'module', plugins: ['jsx'] });

// ---------- manifest ----------
const MODULE_OF = {}; // top-level name -> module file (relative to src/)
const CONSTANTS = ['INITIAL_CURRENCIES','INITIAL_GROUPS','INITIAL_BRANDS','INITIAL_AUTO_TEMPLATES','INITIAL_MODELS','INITIAL_PROMO_CODES','INITIAL_STORE_ADS','INITIAL_SHOWCASE_BARS','ELZOGHBI_LOGO','PART_IMAGES','DEFAULT_REGISTRATION_TERMS','EMPTY_REG_FORM','DEFAULT_REGISTRATION_TERMS_EN','AD_THEMES','STUDIO_AD_LAYOUT_TEMPLATES','AD_IMAGE_FRAME_OPTIONS','VISIT_SOURCE_LABELS','DEFAULT_SOURCING_BANNER','DEFAULT_SOURCING_DEPOSIT_INFO','DEFAULT_SOURCING_TERMS','DEFAULT_SOURCING_TERMS_EN','SRC_STATUSES','SRC_STATUS_STYLE','SRC_STEPS','SRC_DEPOSIT_LABEL','CREDIT_PAYMENT_ID','INITIAL_PAYMENT_METHODS','DEFAULT_SPIN_PRIZES','SHORTCUT_ICON_PRESETS','INITIAL_SITE_SETTINGS','QUALITY_GRADE_SUGGESTIONS','INITIAL_PARTS','AVATAR_PRESETS','INITIAL_CLIENTS','INITIAL_ACCOUNT_REQUESTS','INITIAL_ORDERS','INITIAL_RETURNS','INITIAL_COMPLAINTS','ORDER_STATUSES'];
CONSTANTS.forEach(n => MODULE_OF[n] = 'data/constants.js');
['EN_DICT','EN_KEYS','AR_TEST','isArLetter','EN_CACHE','translateToEn','TEXT_RECS','ATTR_RECS','I18N_ATTRS','i18nTranslateNode','i18nRestoreNode','LATIN_BIDI_RE','Bidi'].forEach(n => MODULE_OF[n] = 'i18n.js');
['readPersistedDeletedSliceMap','isOrCatalogDisabledInStorage','mergeOrBrandsList','mergeOrModelsList','normalizePartCategory','mergeOrPartsList','isOrPrefixedName'].forEach(n => MODULE_OF[n] = 'lib/catalogUtils.js');
['localDayKey','detectVisitSource','applyVisit','readFileAsDataUrl','waLink','getSourcingBanner','B64_UPLOAD_CACHE','b64Key','getPaymentMethods','normalizeDigits','generateAiProductDetails','escapeHtml','openCleanA4PrintWindow','loadPersisted','getAdTheme','isFullBleedAdLayout','adInSchedule'].forEach(n => MODULE_OF[n] = 'lib/utils.js');
MODULE_OF['makeTechSvgIcon'] = 'data/constants.js'; // called at init time by SHORTCUT_ICON_PRESETS — must live in constants to avoid a constants<->utils cycle
MODULE_OF['DEFAULT_HOME_SHORTCUT_ICONS'] = 'data/constants.js';
MODULE_OF['Edit3'] = 'lib/utils.js';
MODULE_OF['nowStamp'] = 'lib/utils.js';
['PasswordInput','ImageViewer','AdContent','BlurFitImage','ClampedSpecsText'].forEach(n => MODULE_OF[n] = 'components/widgets.jsx');

const SECTION_OF = {}; // render fn name -> section file
const SEC = (file, names) => names.forEach(n => SECTION_OF[n] = file);
SEC('sections/Storefront.jsx', ['renderVvipBrandEmblem','renderRoleSwitcherBar','renderClientAvatar','renderProductCard','renderSocialIconsGroup','renderClientHeader','renderCheckoutFooter','renderAnnouncements','renderRecentlyViewedStrip','renderHomeView','renderStickyCartBar','renderStorefront','renderFreeShippingProgressBar','renderSmartCrossSellBundles','renderCashierImpulseShelf','renderCartDrawer','renderVipRouteView','renderFilterSheet','renderLightbox','renderClientFooter']);
SEC('sections/Checkout.jsx', ['renderCheckoutView']);
SEC('sections/Account.jsx', ['renderClientOrdersView','renderClientLedgerView','renderClientReturnsView','renderClientComplaintsView','renderClientProfileSettingsView','renderClientAccountPortal']);
SEC('sections/AdminMain.jsx', ['renderAdminDashboard','renderAdminSubTabBar','renderAdminOverview','renderVisitorStats','renderAdminOrders']);
SEC('sections/AdminCatalog.jsx', ['renderAdminCatalog','renderAdminQuickStock','renderAdminGroups','renderProfitProtectionShieldCard']);
SEC('sections/AdminMarketing.jsx', ['renderAdminPromoCodes','renderAdSeg','renderAdToggle','renderAdminRestockAlertsView','renderAdminFeatureFlagsDashboard']);
SEC('sections/AdminCms.jsx', ['renderAdminSiteSettings','renderAdminStorefrontCms','renderCmsAccordionHeader','renderPrecisionImageControls']);
SEC('sections/AdminClients.jsx', ['renderAdminClients','renderAdminReturnsAndComplaints','renderAdminApproveRequestModal','renderAdminCreateClientModal','renderAdminSecurityModal']);
SEC('sections/AdminReports.jsx', ['renderGmReportDocumentContent','renderAdminExecutiveReportsView','renderGmReportPrintModal','renderAdminDatabaseSchema']);
SEC('sections/Modals.jsx', ['renderConfirmDialogModal','renderSpinToWinModal','renderFloatingSpinTrigger','renderLiveSocialProofToast','renderExitIntentModal','renderCustomerRestockNotifyModal','renderAdminRestockWhatsappModal','renderWarrantyLookupModal','renderFamilyDevicesModal','renderConfettiOverlay','renderLoginModal','renderReturnRequestModal']);
SEC('sections/Sourcing.jsx', ['renderSrcChat','renderSourcingBanner','renderSourcingFormModal','renderClientSourcingSection','renderAdminSourcing']);
SEC('sections/ProductModals.jsx', ['renderPrintModal','renderProductOrAdDetailModal','renderPartGroupPricesModal','renderBrandManagerModal','renderTemplateManagerModal','renderBrandImageModal','renderAddPartToModelModal','renderEditPartModal','renderEditModelModal']);

// ---------- collect structure ----------
const imports = []; // {source, specifiers:[{imported, local, type}], node}
const topDecls = new Map(); // name -> {node (statement), kind}
let appNode = null, appPath = null;
for (const node of ast.program.body) {
  if (node.type === 'ImportDeclaration') imports.push({ source: node.source.value, specifiers: node.specifiers, node });
  if (node.type === 'VariableDeclaration') for (const d of node.declarations) if (d.id.type === 'Identifier') topDecls.set(d.id.name, { node, declarator: d, stmt: node });
  if (node.type === 'FunctionDeclaration' && node.id) topDecls.set(node.id.name, { node, declarator: node, stmt: node });
  if (node.type === 'ExportNamedDeclaration' && node.declaration) {
    const decl = node.declaration;
    if (decl.type === 'FunctionDeclaration' && decl.id) topDecls.set(decl.id.name, { node: decl, declarator: decl, stmt: node });
    if (decl.type === 'VariableDeclaration') for (const d of decl.declarations) if (d.id.type === 'Identifier') topDecls.set(d.id.name, { node: decl, declarator: d, stmt: node });
  }
  if (node.type === 'ExportDefaultDeclaration' && node.declaration.type === 'FunctionDeclaration') appNode = node.declaration;
}
const importByLocal = new Map();
for (const im of imports) for (const s of im.specifiers) importByLocal.set(s.local.name, { source: im.source, imported: s.imported ? s.imported.name : null, type: s.type });

// find App-scope bindings + render fn paths
const appBindings = new Set();
const renderFnPaths = new Map(); // name -> {path (statement path), fnNode, params}
traverse(ast, {
  FunctionDeclaration(p) {
    if (p.node === appNode) {
      appPath = p;
      p.traverse({
        VariableDeclarator(vp) {
          if (vp.parentPath.parentPath !== p) return; // only direct body decls: parent is VariableDeclaration whose parent is App body
        }
      });
    }
  }
});
// Direct body statements of App:
for (const stmt of appNode.body.body) {
  if (stmt.type === 'VariableDeclaration') {
    for (const d of stmt.declarations) {
      const collect = (id) => { if (!id) return; if (id.type === 'Identifier') appBindings.add(id.name); if (id.type === 'ArrayPattern') id.elements.forEach(collect); if (id.type === 'ObjectPattern') id.properties.forEach(pr => collect(pr.value)); };
      collect(d.id);
    }
  }
  if (stmt.type === 'FunctionDeclaration' && stmt.id) appBindings.add(stmt.id.name);
}
// locate render fn nodes by walking App body statements
const renderFnNodes = new Map(); // name -> {stmt, fnNode}
for (const stmt of appNode.body.body) {
  if (stmt.type === 'VariableDeclaration') for (const d of stmt.declarations) {
    if (d.id.type === 'Identifier' && SECTION_OF[d.id.name] && d.init && (d.init.type === 'ArrowFunctionExpression' || d.init.type === 'FunctionExpression')) renderFnNodes.set(d.id.name, { stmt, fnNode: d.init });
  }
  if (stmt.type === 'FunctionDeclaration' && stmt.id && SECTION_OF[stmt.id.name]) renderFnNodes.set(stmt.id.name, { stmt, fnNode: stmt });
}
const missing = Object.keys(SECTION_OF).filter(n => !renderFnNodes.has(n));
if (missing.length) { console.error('MISSING render fns:', missing); process.exit(1); }

// ---------- reference analysis ----------
// For a given AST subtree root path, find identifiers referencing bindings outside it.
function analyzeRefs(rootPath) {
  const appRefs = new Set(), moduleRefs = new Set(), importRefs = new Set();
  const classify = (ip, name) => {
      if (!name) return;
      let b = null;
      try { b = ip.scope.getBinding(name); } catch (e) { b = null; }
      if (!b) return; // global
      if (b.path === rootPath || (b.path && rootPath.node && b.path.node && isInside(b.path.node, rootPath.node))) return; // local to unit
      // classify by where the binding is declared
      if (b.kind === 'module' || b.kind === 'import') { /* placeholder */ }
      if (importByLocal.has(name) && b.path.node && b.path.node.type === 'ImportSpecifier' || (b.path.parent && b.path.parent.type === 'ImportDeclaration')) { importRefs.add(name); return; }
      if (topDecls.has(name) && !appBindings.has(name)) {
        // declared at module level of original file (and not shadowed by app binding at this site: getBinding resolved upward — if binding's scope is program)
        if (b.scope && b.scope.block && b.scope.block.type === 'Program') { moduleRefs.add(name); return; }
      }
      if (appBindings.has(name)) {
        if (b.scope && b.scope.block === appNode.body) { appRefs.add(name); return; }
        if (b.scope && b.scope.block && b.scope.block.type === 'Program' && topDecls.has(name)) { moduleRefs.add(name); return; }
        appRefs.add(name); return;
      }
      if (importByLocal.has(name)) { importRefs.add(name); return; }
      if (topDecls.has(name)) { moduleRefs.add(name); return; }
  };
  rootPath.traverse({
    Identifier(ip) {
      if (!ip.isReferencedIdentifier()) return;
      classify(ip, ip.node.name);
    },
    JSXIdentifier(ip) {
      const name = ip.node.name;
      if (!/^[A-Z]/.test(name)) return; // lowercase = DOM tag
      if (ip.parent && ip.parent.type === 'JSXAttribute') return;
      classify(ip, name);
    }
  });
  return { appRefs, moduleRefs, importRefs };
}
function isInside(node, ancestor) { return node && ancestor && node.start >= ancestor.start && node.end <= ancestor.end; }

// We need real paths for analysis: re-traverse and capture paths for app body statements and top decls.
const stmtPaths = new Map(); // node -> path
traverse(ast, {
  enter(p) { stmtPaths.set(p.node, p); }
});

function refsForNode(node) {
  const p = stmtPaths.get(node);
  if (!p) return { appRefs: new Set(), moduleRefs: new Set(), importRefs: new Set() };
  return analyzeRefs(p);
}

function importLinesFor(names, fromDir) {
  // names: Set of identifier names that were original imports; returns import statements text
  const bySource = new Map();
  for (const n of names) {
    const im = importByLocal.get(n);
    if (!im) continue;
    if (!bySource.has(im.source)) bySource.set(im.source, []);
    bySource.get(im.source).push({ local: n, imported: im.imported, type: im.type });
  }
  const lines = [];
  for (const [source, specs] of bySource) {
    const def = specs.find(s => s.type === 'ImportDefaultSpecifier');
    const named = specs.filter(s => s.type === 'ImportSpecifier');
    const ns = specs.find(s => s.type === 'ImportNamespaceSpecifier');
    let rel = source;
    if (source.startsWith('./')) {
      // recompute relative to fromDir (e.g. 'sections' -> '../x', 'lib'/'data' -> '../x', 'components' -> './x' adjustments handled by caller mapping)
      rel = adjustRel(source, fromDir);
    }
    let parts = [];
    if (def) parts.push(def.local);
    if (ns) parts.push('* as ' + ns.local);
    if (named.length) parts.push('{ ' + named.map(s => s.imported === s.local ? s.local : `${s.imported} as ${s.local}`).join(', ') + ' }');
    lines.push(`import ${parts.join(', ')} from '${rel}';`);
  }
  return lines;
}
function adjustRel(source, fromDir) {
  // source like './components/X' or './orCatalogData'; fromDir: '' (src root), 'sections', 'lib', 'data', 'components'
  if (!fromDir) return source;
  if (fromDir === 'components' && source.startsWith('./components/')) return './' + source.slice('./components/'.length);
  return '../' + source.slice(2);
}
function moduleImportLines(moduleRefs, selfFile) {
  const byFile = new Map();
  for (const n of moduleRefs) {
    const f = MODULE_OF[n];
    if (!f || f === selfFile) continue;
    if (!byFile.has(f)) byFile.set(f, []);
    byFile.get(f).push(n);
  }
  const lines = [];
  const selfDir = selfFile.includes('/') ? selfFile.split('/')[0] : '';
  for (const [f, names] of byFile) {
    let rel;
    const fDir = f.includes('/') ? f.split('/')[0] : '';
    if (selfDir && fDir === selfDir) rel = './' + f.split('/').slice(1).join('/');
    else if (!selfDir) rel = './' + f;
    else rel = '../' + f;
    lines.push(`import { ${[...new Set(names)].sort().join(', ')} } from '${rel}';`);
  }
  return lines;
}

// ---------- emit lib modules ----------
const filesOut = new Map(); // file -> content
const emittedStmts = new Set(); // statement nodes emitted into modules (to remove from App.jsx)
function emitModule(file, names) {
  const dir = file.includes('/') ? file.split('/')[0] : '';
  const stmts = [];
  const allModuleRefs = new Set(), allImportRefs = new Set();
  const sorted = names.map(n => topDecls.get(n)).sort((a, b) => a.node.start - b.node.start);
  for (const td of sorted) {
    const { moduleRefs, importRefs } = refsForNode(td.stmt);
    // refs for a VariableDeclaration statement: analyze whole statement
    moduleRefs.forEach(x => allModuleRefs.add(x));
    importRefs.forEach(x => allImportRefs.add(x));
  }
  // For multi-declarator statements shared across modules (rare), fall back to whole statement per declarator:
  const pieces = [];
  for (const td of sorted) {
    emittedStmts.add(td.stmt);
    if (td.node.type === 'VariableDeclaration') {
      // emit only this declarator
      const kind = td.node.kind;
      pieces.push(`export ${kind} ${src.slice(td.declarator.start, td.declarator.end)};`);
    } else {
      pieces.push('export ' + src.slice(td.node.start, td.node.end));
    }
  }
  const header = [...importLinesFor(allImportRefs, dir), ...moduleImportLines(allModuleRefs, file)].join('\n');
  filesOut.set(file, (header ? header + '\n\n' : '') + pieces.join('\n\n') + '\n');
}
const moduleGroups = new Map();
for (const [name, f] of Object.entries(MODULE_OF)) { if (!moduleGroups.has(f)) moduleGroups.set(f, []); moduleGroups.get(f).push(name); }
for (const [f, names] of moduleGroups) emitModule(f, names);

// ---------- emit section modules ----------
const sectionGroups = new Map();
for (const [name, f] of Object.entries(SECTION_OF)) { if (!sectionGroups.has(f)) sectionGroups.set(f, []); sectionGroups.get(f).push(name); }
const sectionInfo = new Map(); // name -> {appRefs}
for (const [file, names] of sectionGroups) {
  const dir = 'sections';
  const pieces = [];
  const allModuleRefs = new Set(), allImportRefs = new Set();
  const sorted = names.map(n => ({ n, ...renderFnNodes.get(n) })).sort((a, b) => a.stmt.start - b.stmt.start);
  for (const { n, stmt, fnNode } of sorted) {
    const { appRefs, moduleRefs, importRefs } = refsForNode(stmt);
    sectionInfo.set(n, { appRefs });
    moduleRefs.forEach(x => allModuleRefs.add(x));
    importRefs.forEach(x => allImportRefs.add(x));
    const params = fnNode.params.map(p => src.slice(p.start, p.end)).join(', ');
    const body = fnNode.body;
    const destructure = [...appRefs].filter(x => x !== n).sort();
    const head = `export function ${n}(ctx${params ? ', ' + params : ''}) {\n  const { ${destructure.join(', ')} } = ctx;`;
    if (body.type === 'BlockStatement') {
      pieces.push(head + src.slice(body.start + 1, body.end - 1) + '\n}');
    } else {
      pieces.push(head + `\n  return (${src.slice(body.start, body.end)});\n}`);
    }
    emittedStmts.add(stmt);
  }
  // sibling section functions are called via ctx (they are app bindings), so no cross-imports needed
  const header = [...importLinesFor(allImportRefs, dir), ...moduleImportLines(allModuleRefs, file)].join('\n');
  filesOut.set(file, (header ? header + '\n\n' : '') + pieces.join('\n\n') + '\n');
}

// ---------- rebuild App.jsx ----------
// Remaining top-level statements: original order, minus emitted ones; imports recomputed for remaining body.
const remainingTop = ast.program.body.filter(n => n.type !== 'ImportDeclaration' && !emittedStmts.has(n) && n.type !== 'ExportDefaultDeclaration');
// Remaining App body statements: minus emitted render stmts, plus wrappers.
const appStmts = appNode.body.body.filter(s => !emittedStmts.has(s));
// Compute refs of everything remaining (top remaining + app body minus wrappers) to know needed imports.
let remainingRefs = { appRefs: new Set(), moduleRefs: new Set(), importRefs: new Set() };
{
  const tmp = { moduleRefs: new Set(), importRefs: new Set() };
  for (const n of [...remainingTop, ...appStmts]) {
    const r = refsForNode(n);
    r.moduleRefs.forEach(x => tmp.moduleRefs.add(x));
    r.importRefs.forEach(x => tmp.importRefs.add(x));
  }
  remainingRefs = tmp;
}
// Section module imports needed by App (impl functions)
const sectionImportLines = [];
for (const [file, names] of sectionGroups) {
  sectionImportLines.push(`import { ${names.map(n => `${n} as ${n}Impl`).join(', ')} } from './${file}';`);
}
const appHeader = [
  ...importLinesFor(remainingRefs.importRefs, ''),
  ...moduleImportLines(remainingRefs.moduleRefs, 'App.jsx'),
  ...sectionImportLines
].join('\n');

let out = appHeader + '\n\n';
for (const n of remainingTop) out += src.slice(n.start, n.end) + '\n\n';
// Rebuild App: statements (minus extracted render fns, minus return), then
// wrappers for extracted render fns, then the ctx bag, then the return.
const returnStmt = appStmts.find(s => s.type === 'ReturnStatement');
const bodyStmts = appStmts.filter(s => s !== returnStmt);
out += 'export default function App() {\n';
out += '  let ctxBag = {};\n';
for (const n of Object.keys(SECTION_OF)) out += `  const ${n} = (...args) => ${n}Impl(ctxBag, ...args);\n`;
for (const s of bodyStmts) out += src.slice(s.start, s.end) + '\n';
const bagNames = [...appBindings].sort();
out += `  ctxBag = { ${bagNames.join(', ')} };\n`;
if (returnStmt) out += src.slice(returnStmt.start, returnStmt.end) + '\n';
out += '}\n';
filesOut.set('__APP__', out);
fs.writeFileSync('/tmp/split_app_draft.jsx', out);
const unassigned = [...topDecls.keys()].filter(n => !MODULE_OF[n]);
console.log('unassigned top-level (stay in App.jsx):', unassigned);
const multiDecl = ast.program.body.filter(n => n.type === 'VariableDeclaration' && n.declarations.length > 1 && emittedStmts.has(n));
console.log('multi-declarator emitted statements:', multiDecl.length);
for (const [f, c] of filesOut) { if (f !== '__APP__') { fs.mkdirSync(path.dirname('src/' + f) || '.', { recursive: true }); fs.writeFileSync('src/' + f, c); console.log('wrote', f, c.split('\n').length, 'lines'); } }
console.log('draft app written to /tmp/split_app_draft.jsx');
console.log('appBindings total:', appBindings.size);
fs.writeFileSync('/tmp/bag_names.json', JSON.stringify([...appBindings].sort()));
