/* CodeEditor's tokenizer, extracted VERBATIM from React's
 * src/domain/code-editor.tsx by script rather than retyped: character-level
 * logic where a transcription slip would mis-colour code silently. The drift
 * test in code-editor.test.ts fails if the React source changes. Edit the
 * React source and re-extract; do not edit here. */

export type CodeEditorLanguage =
  | 'javascript'
  | 'typescript'
  | 'json'
  | 'html'
  | 'css'
  | 'python'
  | 'bash'
  | 'sql'
  | 'plain'

export interface Token {
  type: 'keyword' | 'string' | 'comment' | 'number' | 'operator' | 'plain'
  value: string
}

const KEYWORDS: Record<string, Set<string>> = {
  javascript: new Set([
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
    'do', 'switch', 'case', 'break', 'continue', 'new', 'this', 'class',
    'extends', 'import', 'export', 'from', 'default', 'typeof', 'instanceof',
    'in', 'of', 'try', 'catch', 'finally', 'throw', 'async', 'await', 'yield',
    'true', 'false', 'null', 'undefined', 'void', 'delete',
  ]),
  typescript: new Set([
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
    'do', 'switch', 'case', 'break', 'continue', 'new', 'this', 'class',
    'extends', 'import', 'export', 'from', 'default', 'typeof', 'instanceof',
    'in', 'of', 'try', 'catch', 'finally', 'throw', 'async', 'await', 'yield',
    'true', 'false', 'null', 'undefined', 'void', 'delete', 'type', 'interface',
    'enum', 'implements', 'abstract', 'static', 'readonly', 'as', 'is', 'keyof',
    'infer', 'extends', 'satisfies', 'declare', 'namespace', 'module',
  ]),
  python: new Set([
    'def', 'class', 'return', 'if', 'elif', 'else', 'for', 'while', 'break',
    'continue', 'import', 'from', 'as', 'try', 'except', 'finally', 'raise',
    'with', 'yield', 'lambda', 'pass', 'True', 'False', 'None', 'and', 'or',
    'not', 'in', 'is', 'del', 'global', 'nonlocal', 'assert', 'async', 'await',
  ]),
  sql: new Set([
    'SELECT', 'FROM', 'WHERE', 'INSERT', 'INTO', 'VALUES', 'UPDATE', 'SET',
    'DELETE', 'CREATE', 'TABLE', 'DROP', 'ALTER', 'INDEX', 'JOIN', 'LEFT',
    'RIGHT', 'INNER', 'OUTER', 'ON', 'AND', 'OR', 'NOT', 'NULL', 'IS',
    'IN', 'BETWEEN', 'LIKE', 'ORDER', 'BY', 'GROUP', 'HAVING', 'LIMIT',
    'OFFSET', 'AS', 'DISTINCT', 'COUNT', 'SUM', 'AVG', 'MAX', 'MIN',
    'select', 'from', 'where', 'insert', 'into', 'values', 'update', 'set',
    'delete', 'create', 'table', 'drop', 'alter', 'join', 'left', 'right',
    'inner', 'outer', 'on', 'and', 'or', 'not', 'null', 'is', 'in',
    'between', 'like', 'order', 'by', 'group', 'having', 'limit', 'offset',
    'as', 'distinct', 'count', 'sum', 'avg', 'max', 'min',
  ]),
  html: new Set([
    'const', 'let', 'var', 'function', 'return', 'if', 'else', 'class',
  ]),
  css: new Set([]),
  bash: new Set([
    'if', 'then', 'else', 'elif', 'fi', 'for', 'while', 'do', 'done',
    'case', 'esac', 'function', 'return', 'exit', 'echo', 'export',
    'source', 'local', 'readonly', 'declare', 'set', 'unset',
  ]),
}

export function tokenizeLine(line: string, language: CodeEditorLanguage): Token[] {
  if (language === 'plain') return [{ type: 'plain', value: line }]

  const tokens: Token[] = []
  const kw = KEYWORDS[language] || new Set()
  let i = 0

  while (i < line.length) {
    // Comments
    if (line[i] === '/' && line[i + 1] === '/') {
      tokens.push({ type: 'comment', value: line.slice(i) })
      break
    }
    if (line[i] === '#' && (language === 'python' || language === 'bash')) {
      tokens.push({ type: 'comment', value: line.slice(i) })
      break
    }
    if (line[i] === '-' && line[i + 1] === '-' && language === 'sql') {
      tokens.push({ type: 'comment', value: line.slice(i) })
      break
    }
    if (line[i] === '/' && line[i + 1] === '*') {
      const end = line.indexOf('*/', i + 2)
      if (end !== -1) {
        tokens.push({ type: 'comment', value: line.slice(i, end + 2) })
        i = end + 2
        continue
      }
      tokens.push({ type: 'comment', value: line.slice(i) })
      break
    }

    // Strings
    if (line[i] === '"' || line[i] === "'" || line[i] === '`') {
      const quote = line[i]
      let j = i + 1
      while (j < line.length && line[j] !== quote) {
        if (line[j] === '\\') j++
        j++
      }
      tokens.push({ type: 'string', value: line.slice(i, j + 1) })
      i = j + 1
      continue
    }

    // Numbers
    if (/\d/.test(line[i]) && (i === 0 || !/\w/.test(line[i - 1]))) {
      let j = i
      while (j < line.length && /[\d.xXa-fA-FeE_]/.test(line[j])) j++
      tokens.push({ type: 'number', value: line.slice(i, j) })
      i = j
      continue
    }

    // Words
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i
      while (j < line.length && /[\w$]/.test(line[j])) j++
      const word = line.slice(i, j)
      tokens.push({
        type: kw.has(word) ? 'keyword' : 'plain',
        value: word,
      })
      i = j
      continue
    }

    // Operators
    if (/[+\-*/%=<>!&|^~?:]/.test(line[i])) {
      let j = i
      while (j < line.length && /[+\-*/%=<>!&|^~?:]/.test(line[j])) j++
      tokens.push({ type: 'operator', value: line.slice(i, j) })
      i = j
      continue
    }

    // Other
    let j = i + 1
    while (
      j < line.length &&
      !/[a-zA-Z_$\d"'`/#+\-*/%=<>!&|^~?:]/.test(line[j])
    ) {
      j++
    }
    tokens.push({ type: 'plain', value: line.slice(i, j) })
    i = j
  }

  return tokens
}
