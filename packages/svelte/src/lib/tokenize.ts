/* Syntax tokenizers for CopyBlock, extracted VERBATIM from React's
 * src/domain/copy-block.tsx by script rather than retyped — ~300 lines of
 * character-level logic where a transcription slip would mis-colour code
 * silently. Edit the React source and re-extract; do not edit here. */

export type CopyBlockLanguage =
  | 'javascript'
  | 'typescript'
  | 'css'
  | 'json'
  | 'bash'
  | 'html'
  | 'python'
  | 'rust'
  | 'go'
  | 'sql'
  | 'xml'
  | 'yaml'
  | 'markdown'
  | 'csv'
  | 'java'
  | 'csharp'
  | 'php'
  | 'swift'
  | 'kotlin'
  | 'text'

export interface Token {
  type: 'keyword' | 'string' | 'comment' | 'number' | 'plain'
  value: string
}

const JS_KEYWORDS = new Set([
  'const', 'let', 'var', 'function', 'return', 'if', 'else', 'for', 'while',
  'do', 'switch', 'case', 'break', 'continue', 'new', 'this', 'class',
  'extends', 'import', 'export', 'from', 'default', 'typeof', 'instanceof',
  'in', 'of', 'try', 'catch', 'finally', 'throw', 'async', 'await', 'yield',
  'true', 'false', 'null', 'undefined', 'void', 'delete', 'type', 'interface',
  'enum', 'implements', 'abstract', 'static', 'readonly', 'as', 'is',
])

function tokenizeJS(line: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < line.length) {
    // Single-line comment
    if (line[i] === '/' && line[i + 1] === '/') {
      tokens.push({ type: 'comment', value: line.slice(i) })
      break
    }

    // Block comment start (simplistic — treat rest of line as comment)
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
        if (line[j] === '\\') j++ // skip escaped char
        j++
      }
      tokens.push({ type: 'string', value: line.slice(i, j + 1) })
      i = j + 1
      continue
    }

    // Numbers
    if (/\d/.test(line[i]) && (i === 0 || !/\w/.test(line[i - 1]))) {
      let j = i
      while (j < line.length && /[\d.]/.test(line[j])) j++
      tokens.push({ type: 'number', value: line.slice(i, j) })
      i = j
      continue
    }

    // Words (potential keywords)
    if (/[a-zA-Z_$]/.test(line[i])) {
      let j = i
      while (j < line.length && /[\w$]/.test(line[j])) j++
      const word = line.slice(i, j)
      tokens.push({
        type: JS_KEYWORDS.has(word) ? 'keyword' : 'plain',
        value: word,
      })
      i = j
      continue
    }

    // Other characters
    let j = i
    while (
      j < line.length &&
      !/[a-zA-Z_$\d"'`/]/.test(line[j])
    ) {
      j++
    }
    if (j === i) j = i + 1
    tokens.push({ type: 'plain', value: line.slice(i, j) })
    i = j
  }

  return tokens
}

function tokenizeJSON(line: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < line.length) {
    // String (could be key or value)
    if (line[i] === '"') {
      let j = i + 1
      while (j < line.length && line[j] !== '"') {
        if (line[j] === '\\') j++
        j++
      }
      const str = line.slice(i, j + 1)
      // Check if this is a key (followed by colon)
      const afterStr = line.slice(j + 1).trimStart()
      if (afterStr.startsWith(':')) {
        tokens.push({ type: 'keyword', value: str })
      } else {
        tokens.push({ type: 'string', value: str })
      }
      i = j + 1
      continue
    }

    // Numbers
    if (/[\d-]/.test(line[i]) && (i === 0 || !/\w/.test(line[i - 1]))) {
      let j = i
      if (line[j] === '-') j++
      while (j < line.length && /[\d.eE+-]/.test(line[j])) j++
      if (j > i && (line[i] !== '-' || j > i + 1)) {
        tokens.push({ type: 'number', value: line.slice(i, j) })
        i = j
        continue
      }
    }

    // Booleans / null
    if (/[a-z]/.test(line[i])) {
      let j = i
      while (j < line.length && /[a-z]/.test(line[j])) j++
      const word = line.slice(i, j)
      if (word === 'true' || word === 'false' || word === 'null') {
        tokens.push({ type: 'keyword', value: word })
      } else {
        tokens.push({ type: 'plain', value: word })
      }
      i = j
      continue
    }

    // Other
    let j = i + 1
    while (j < line.length && !/["a-z\d-]/i.test(line[j])) j++
    tokens.push({ type: 'plain', value: line.slice(i, j) })
    i = j
  }

  return tokens
}

function tokenizeCSS(line: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < line.length) {
    // Comments
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
    if (line[i] === '"' || line[i] === "'") {
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

    // Properties (word followed by colon)
    if (/[a-zA-Z-]/.test(line[i])) {
      let j = i
      while (j < line.length && /[a-zA-Z0-9-]/.test(line[j])) j++
      const word = line.slice(i, j)
      const afterWord = line.slice(j).trimStart()
      if (afterWord.startsWith(':')) {
        tokens.push({ type: 'keyword', value: word })
      } else {
        tokens.push({ type: 'plain', value: word })
      }
      i = j
      continue
    }

    // Numbers
    if (/\d/.test(line[i])) {
      let j = i
      while (j < line.length && /[\d.%a-z]/.test(line[j])) j++
      tokens.push({ type: 'number', value: line.slice(i, j) })
      i = j
      continue
    }

    let j = i + 1
    while (j < line.length && !/[a-zA-Z\d"'/\-]/.test(line[j])) j++
    tokens.push({ type: 'plain', value: line.slice(i, j) })
    i = j
  }

  return tokens
}

function tokenizeBash(line: string): Token[] {
  const tokens: Token[] = []
  let i = 0

  while (i < line.length) {
    // Comments
    if (line[i] === '#') {
      tokens.push({ type: 'comment', value: line.slice(i) })
      break
    }

    // Strings
    if (line[i] === '"' || line[i] === "'") {
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

    // Flags (--flag or -f)
    if (line[i] === '-' && i > 0 && /\s/.test(line[i - 1])) {
      let j = i
      while (j < line.length && /[a-zA-Z0-9-]/.test(line[j])) j++
      tokens.push({ type: 'keyword', value: line.slice(i, j) })
      i = j
      continue
    }

    // Words
    if (/[a-zA-Z_]/.test(line[i])) {
      let j = i
      while (j < line.length && /[\w.-]/.test(line[j])) j++
      tokens.push({ type: 'plain', value: line.slice(i, j) })
      i = j
      continue
    }

    let j = i + 1
    while (j < line.length && !/[a-zA-Z_"'#-]/.test(line[j])) j++
    tokens.push({ type: 'plain', value: line.slice(i, j) })
    i = j
  }

  return tokens
}

export function tokenizeLine(line: string, language: CopyBlockLanguage): Token[] {
  switch (language) {
    case 'javascript':
    case 'typescript':
    case 'html':
      return tokenizeJS(line)
    case 'json':
      return tokenizeJSON(line)
    case 'css':
      return tokenizeCSS(line)
    case 'bash':
      return tokenizeBash(line)
    case 'python':
      return tokenizeGeneric(line, ['def','class','if','elif','else','for','while','return','import','from','as','with','try','except','raise','yield','lambda','pass','break','continue','in','not','and','or','is','True','False','None','self','async','await'], '#')
    case 'rust':
      return tokenizeGeneric(line, ['fn','let','mut','pub','struct','enum','impl','trait','use','mod','match','if','else','for','while','loop','return','self','Self','true','false','type','where','const','static','ref','move','async','await','unsafe','crate','super','dyn'], '//')
    case 'go':
      return tokenizeGeneric(line, ['func','package','import','var','const','type','struct','interface','if','else','for','range','return','go','defer','chan','select','switch','case','default','break','continue','nil','true','false','error','string','int','bool'], '//')
    case 'sql':
      return tokenizeGeneric(line, ['SELECT','FROM','WHERE','JOIN','LEFT','RIGHT','INNER','ON','INSERT','INTO','VALUES','UPDATE','SET','DELETE','CREATE','TABLE','ALTER','DROP','INDEX','AND','OR','NOT','IN','IS','NULL','ORDER','BY','GROUP','HAVING','LIMIT','AS','DISTINCT','COUNT','SUM','AVG','MIN','MAX','UNION','BEGIN','COMMIT','ROLLBACK','PRIMARY','KEY','FOREIGN','REFERENCES'], '--', true)
    case 'xml':
      return tokenizeGeneric(line, [], '<!--', false)
    case 'yaml':
      return tokenizeGeneric(line, ['true','false','null','yes','no'], '#')
    case 'markdown':
      return [{ type: 'plain', value: line }]
    case 'csv':
      return [{ type: 'plain', value: line }]
    case 'java':
      return tokenizeGeneric(line, ['class','public','private','protected','static','void','int','String','boolean','return','if','else','for','while','new','import','package','extends','implements','interface','abstract','final','try','catch','throw','throws','super','this','true','false','null'], '//')
    case 'csharp':
      return tokenizeGeneric(line, ['class','public','private','protected','static','void','int','string','bool','return','if','else','for','while','foreach','new','using','namespace','var','async','await','abstract','interface','override','virtual','true','false','null'], '//')
    case 'php':
      return tokenizeGeneric(line, ['function','class','public','private','protected','static','return','if','else','elseif','for','foreach','while','echo','new','use','namespace','true','false','null','array','isset','empty'], '//')
    case 'swift':
      return tokenizeGeneric(line, ['func','let','var','class','struct','enum','protocol','if','else','for','while','return','import','guard','switch','case','default','true','false','nil','self','Self','throws','async','await'], '//')
    case 'kotlin':
      return tokenizeGeneric(line, ['fun','val','var','class','object','interface','if','else','for','while','when','return','import','package','true','false','null','this','super','override','data','sealed','companion'], '//')
    case 'text':
    default:
      return [{ type: 'plain', value: line }]
  }
}

/** Simple keyword-based tokenizer for many languages */
function tokenizeGeneric(line: string, keywords: string[], commentPrefix: string, caseInsensitive = false): Token[] {
  const tokens: Token[] = []
  // Check for line comment
  const commentIdx = line.indexOf(commentPrefix)
  const codePart = commentIdx >= 0 ? line.slice(0, commentIdx) : line
  const commentPart = commentIdx >= 0 ? line.slice(commentIdx) : ''

  // Tokenize code part
  const parts = codePart.split(/("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|`[^`]*`)/)
  for (const part of parts) {
    if ((part.startsWith('"') || part.startsWith("'") || part.startsWith('`')) && part.length >= 2) {
      tokens.push({ type: 'string', value: part })
    } else {
      // Split by word boundaries and tokenize
      const words = part.split(/\b/)
      for (const word of words) {
        const check = caseInsensitive ? word.toUpperCase() : word
        const kwList = caseInsensitive ? keywords.map(k => k.toUpperCase()) : keywords
        if (kwList.includes(check)) {
          tokens.push({ type: 'keyword', value: word })
        } else if (/^\d+(\.\d+)?$/.test(word)) {
          tokens.push({ type: 'number', value: word })
        } else if (word.length > 0) {
          tokens.push({ type: 'plain', value: word })
        }
      }
    }
  }

  if (commentPart) {
    tokens.push({ type: 'comment', value: commentPart })
  }

  return tokens
}

// ─── Styles ─────────────────────────────────────────────────────────────────
