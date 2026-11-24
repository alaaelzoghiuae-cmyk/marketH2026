const fs = require('fs');
const parser = require('/home/hatch/workspace/elzoghbi_final/node_modules/@babel/parser');
const traverse = require('/home/hatch/workspace/elzoghbi_final/node_modules/@babel/traverse').default;

const src = fs.readFileSync(process.argv[2] || 'src/App.jsx', 'utf-8');
const ast = parser.parse(src, { sourceType: 'module', plugins: ['jsx'] });
const lineOf = (off) => src.slice(0, off).split('\n').length;

const out = { imports: [], topLevel: [], appBindings: [], renderFns: [], appReturnLine: null };

for (const node of ast.program.body) {
  if (node.type === 'ImportDeclaration') {
    out.imports.push({ source: node.source.value, specifiers: node.specifiers.map(s => ({ imported: s.imported ? s.imported.name : 'default', local: s.local.name, type: s.type })), start: lineOf(node.start), end: lineOf(node.end) });
  }
}

let appNode = null;
for (const node of ast.program.body) {
  const names = [];
  if (node.type === 'VariableDeclaration') for (const d of node.declarations) if (d.id.type === 'Identifier') names.push(d.id.name);
  if (node.type === 'FunctionDeclaration' && node.id) names.push(node.id.name);
  for (const n of names) out.topLevel.push({ name: n, kind: node.type, start: lineOf(node.start), end: lineOf(node.end), startOff: node.start, endOff: node.end });
  if (node.type === 'FunctionDeclaration' && node.id && node.id.name === 'App') appNode = node;
  if (node.type === 'ExportDefaultDeclaration' && node.declaration.type === 'FunctionDeclaration') appNode = node.declaration;
}

if (appNode) {
  // component-scope bindings: direct declarations in App body
  for (const stmt of appNode.body.body) {
    if (stmt.type === 'VariableDeclaration') {
      for (const d of stmt.declarations) {
        const collect = (id) => {
          if (!id) return;
          if (id.type === 'Identifier') out.appBindings.push(id.name);
          if (id.type === 'ArrayPattern') id.elements.forEach(collect);
          if (id.type === 'ObjectPattern') id.properties.forEach(p => collect(p.value));
        };
        collect(d.id);
        if (d.id.type === 'Identifier' && d.init && (d.init.type === 'ArrowFunctionExpression' || d.init.type === 'FunctionExpression')) {
          const isRender = /^render/.test(d.id.name);
          out.renderFns.push({ name: d.id.name, params: d.init.params.map(p => src.slice(p.start, p.end)), start: lineOf(stmt.start), end: lineOf(stmt.end), startOff: stmt.start, endOff: stmt.end, isRender });
        }
      }
    }
    if (stmt.type === 'FunctionDeclaration' && stmt.id) {
      out.appBindings.push(stmt.id.name);
      out.renderFns.push({ name: stmt.id.name, params: stmt.params.map(p => src.slice(p.start, p.end)), start: lineOf(stmt.start), end: lineOf(stmt.end), startOff: stmt.start, endOff: stmt.end, isRender: /^render/.test(stmt.id.name) });
    }
    if (stmt.type === 'ReturnStatement') out.appReturnLine = lineOf(stmt.start);
  }
}
out.appBindings = [...new Set(out.appBindings)];
console.log(JSON.stringify(out, null, 1));
