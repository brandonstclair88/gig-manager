/**
 * Static check for the source tree.
 *
 * `vite build` needs platform-native rollup/esbuild binaries, so this runs the
 * parts we can do in pure JS:
 *   1. parse every file (syntax errors)
 *   2. walk scopes for identifiers that resolve to nothing (the `passfee` class
 *      of bug — valid syntax, guaranteed ReferenceError at runtime)
 *   3. flag React hooks called conditionally or after an early return
 *
 * Usage: node scripts/check.mjs
 */
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join, relative } from 'node:path'
import { parse } from '@babel/parser'
import _traverse from '@babel/traverse'

const traverse = _traverse.default || _traverse
const ROOT = new URL('..', import.meta.url).pathname
const SRC = join(ROOT, 'src')

const BROWSER_GLOBALS = new Set([
  'window', 'document', 'console', 'fetch', 'navigator', 'localStorage',
  'sessionStorage', 'alert', 'confirm', 'prompt', 'setTimeout', 'clearTimeout',
  'setInterval', 'clearInterval', 'Blob', 'URL', 'FormData', 'Image', 'Event',
  'CustomEvent', 'AbortController', 'requestAnimationFrame', 'crypto',
  'Intl', 'process', 'globalThis', 'structuredClone', 'queueMicrotask',
  'IntersectionObserver', 'ResizeObserver', 'MutationObserver', 'DOMParser',
  'atob', 'btoa', 'performance', 'history', 'location', 'screen', 'matchMedia',
  'HTMLElement', 'Node', 'File', 'FileReader', 'TextEncoder', 'TextDecoder',
  // `typeof globalThis.undefined` is itself 'undefined', so the generic
  // global check below can't see it. Same for NaN/Infinity.
  'undefined', 'NaN', 'Infinity',
])

function walk(dir, out = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry)
    if (statSync(full).isDirectory()) walk(full, out)
    else if (/\.(jsx?|mjs)$/.test(entry)) out.push(full)
  }
  return out
}

const problems = []
const files = walk(SRC)

for (const file of files) {
  const rel = relative(ROOT, file)
  const code = readFileSync(file, 'utf8')

  let ast
  try {
    ast = parse(code, {
      sourceType: 'module',
      plugins: ['jsx', 'optionalChaining', 'nullishCoalescingOperator', 'classProperties'],
    })
  } catch (err) {
    problems.push(`${rel}:${err.loc?.line ?? '?'}  SYNTAX  ${err.message}`)
    continue
  }

  traverse(ast, {
    // Unresolved identifiers: referenced but bound nowhere and not a global.
    ReferencedIdentifier(path) {
      const { name } = path.node
      if (path.scope.hasBinding(name, true)) return
      if (BROWSER_GLOBALS.has(name)) return
      if (typeof globalThis[name] !== 'undefined') return
      if (/^[A-Z0-9_]+$/.test(name)) return // shouty consts are usually globals
      problems.push(`${rel}:${path.node.loc?.start.line}  UNDEFINED  '${name}' is not defined in any enclosing scope`)
    },

    // Hooks must run unconditionally, in the same order, every render.
    Function(fnPath) {
      const fnName = fnPath.node.id?.name
        || (fnPath.parent.type === 'VariableDeclarator' && fnPath.parent.id.name)
        || ''
      const isComponentOrHook = /^[A-Z]/.test(fnName) || /^use[A-Z]/.test(fnName)
      if (!isComponentOrHook) return

      let sawReturn = false
      fnPath.traverse({
        Function(inner) { inner.skip() },
        ReturnStatement(p) {
          // Any return reachable from the function body without passing
          // through a nested function is an early return — including the
          // common `if (cond) return <Something />` guard, where the return
          // is nested in an IfStatement rather than the body directly.
          for (let cur = p.parentPath; cur && cur !== fnPath; cur = cur.parentPath) {
            if (/Function|ArrowFunctionExpression/.test(cur.node.type)) return
          }
          sawReturn = true
        },
        CallExpression(p) {
          const callee = p.node.callee
          const name = callee.type === 'Identifier' ? callee.name : null
          if (!name || !/^use[A-Z]/.test(name)) return

          if (sawReturn) {
            problems.push(`${rel}:${p.node.loc?.start.line}  HOOK-ORDER  ${name}() runs after an early return in ${fnName || 'component'}`)
            return
          }
          for (let cur = p.parentPath; cur && cur !== fnPath; cur = cur.parentPath) {
            if (/IfStatement|ConditionalExpression|LogicalExpression|ForStatement|WhileStatement|SwitchStatement|TryStatement/.test(cur.node.type)) {
              problems.push(`${rel}:${p.node.loc?.start.line}  HOOK-COND  ${name}() is called conditionally in ${fnName || 'component'}`)
              break
            }
          }
        },
      })
    },
  })
}

console.log(`Checked ${files.length} files.`)
if (problems.length === 0) {
  console.log('✅ No syntax errors, unresolved identifiers, or hook-order problems.')
  process.exit(0)
}
console.log(`\n❌ ${problems.length} problem(s):\n`)
for (const p of problems) console.log('  ' + p)
process.exit(1)
