import {
  AlgoCommandNode,
  ParsedAlgorithm,
  VariableDecl,
  VariableType,
} from '../types/algobox';

/**
 * Interface representing an XML item node in AlgoBox XML format.
 */
interface XmlItemNode {
  algoitem: string;
  children: XmlItemNode[];
}

/**
 * Simple, robust XML parser for AlgoBox (.alg) files that works in both
 * browser and Node environments without requiring DOMParser.
 */
function parseAlgoXmlNodes(xmlText: string): { description: string; rootItems: XmlItemNode[] } {
  // Extract description texte="..."
  const descMatch = xmlText.match(/<description\s+[^>]*texte="([^"]*)"/i);
  const description = descMatch ? decodeXmlEntities(descMatch[1]) : '';

  // Parse <item algoitem="..."> tags and build element hierarchy
  const rootItems: XmlItemNode[] = [];
  const stack: XmlItemNode[] = [];

  const itemRegex = /<item\s+algoitem="([^"]*)"(\s*\/)?\s*>|<\/item>/gi;
  let match: RegExpExecArray | null;

  while ((match = itemRegex.exec(xmlText)) !== null) {
    const isClosing = match[0].startsWith('</');
    const isSelfClosing = Boolean(match[2]);
    const algoitemRaw = match[1];

    if (isClosing) {
      if (stack.length > 0) {
        stack.pop();
      }
    } else {
      const decodedAlgoItem = decodeXmlEntities(algoitemRaw || '');
      const node: XmlItemNode = {
        algoitem: decodedAlgoItem,
        children: [],
      };

      if (stack.length > 0) {
        stack[stack.length - 1].children.push(node);
      } else {
        rootItems.push(node);
      }

      if (!isSelfClosing) {
        stack.push(node);
      }
    }
  }

  return { description, rootItems };
}

/**
 * Decodes standard XML entities.
 */
function decodeXmlEntities(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

/**
 * Main entry point: Parses AlgoBox (.alg) content in official XML format or plain-text.
 */
export function parseAlgoBox(content: string): ParsedAlgorithm {
  const trimmed = content.trim();
  const errors: string[] = [];

  if (trimmed.includes('<Algo') || trimmed.includes('<item ') || trimmed.startsWith('<?xml')) {
    try {
      return parseXmlAlgoBox(trimmed);
    } catch (e: any) {
      errors.push(`Erreur parsing XML: ${e.message}. Tentative de parsing texte...`);
      return parseTextAlgoBox(trimmed, errors);
    }
  } else {
    return parseTextAlgoBox(trimmed, errors);
  }
}

function parseXmlAlgoBox(xmlText: string): ParsedAlgorithm {
  const { description, rootItems } = parseAlgoXmlNodes(xmlText);
  const variables: VariableDecl[] = [];
  const errors: string[] = [];
  const rawLines: { line: number; text: string; indent: number }[] = [];
  let lineNumber = 1;

  // Flatten all items to collect variables
  const allItems: XmlItemNode[] = [];
  function collectAll(nodes: XmlItemNode[]) {
    for (const node of nodes) {
      allItems.push(node);
      collectAll(node.children);
    }
  }
  collectAll(rootItems);

  // Extract variables
  let inVariables = false;
  for (const item of allItems) {
    const text = item.algoitem.trim();
    if (text === 'VARIABLES') {
      inVariables = true;
      continue;
    }
    if (text === 'DEBUT_ALGORITHME') {
      inVariables = false;
      continue;
    }
    if (inVariables && text.includes('EST_DU_TYPE')) {
      const match = text.match(/([a-zA-Z0-9_]+)\s+EST_DU_TYPE\s+(NOMBRE|CHAINE|LISTE)/i);
      if (match) {
        variables.push({
          name: match[1],
          type: match[2].toUpperCase() as VariableType,
        });
      }
    }
  }

  // Find top-level algorithm nodes.
  let algoNodesToParse: XmlItemNode[] = [];

  const debutNode = allItems.find((it) => it.algoitem.trim() === 'DEBUT_ALGORITHME');

  if (debutNode && debutNode.children.length > 0) {
    algoNodesToParse = debutNode.children;
  } else {
    const debutIdx = rootItems.findIndex((it) => it.algoitem.trim() === 'DEBUT_ALGORITHME');
    if (debutIdx !== -1) {
      const finIdx = rootItems.findIndex((it, idx) => idx > debutIdx && it.algoitem.trim() === 'FIN_ALGORITHME');
      const end = finIdx !== -1 ? finIdx : rootItems.length;
      algoNodesToParse = rootItems.slice(debutIdx + 1, end);
    }
  }

  function recordLine(text: string, indent: number) {
    rawLines.push({ line: lineNumber++, text, indent });
  }

  function parseXmlTreeNodes(nodes: XmlItemNode[], indent = 0): AlgoCommandNode[] {
    const result: AlgoCommandNode[] = [];

    for (const nodeItem of nodes) {
      const text = nodeItem.algoitem.trim();
      if (
        !text ||
        text === 'DEBUT_SI' ||
        text === 'FIN_SI' ||
        text === 'DEBUT_SINON' ||
        text === 'FIN_SINON' ||
        text === 'DEBUT_TANT_QUE' ||
        text === 'FIN_TANT_QUE' ||
        text === 'DEBUT_POUR' ||
        text === 'FIN_POUR' ||
        text === 'DEBUT_ALGORITHME' ||
        text === 'FIN_ALGORITHME' ||
        text === 'FONCTIONS_UTILISEES' ||
        text === 'VARIABLES' ||
        text.includes('EST_DU_TYPE')
      ) {
        continue;
      }

      const node = parseSingleCommand(text, lineNumber);

      if (node.type === 'IF') {
        recordLine(text, indent);
        const children = nodeItem.children;
        const thenXmlNodes: XmlItemNode[] = [];
        const elseXmlNodes: XmlItemNode[] = [];
        let inElseBranch = false;

        for (const child of children) {
          const childText = child.algoitem.trim();
          if (childText === 'SINON') {
            inElseBranch = true;
            if (child.children.length > 0) {
              elseXmlNodes.push(...child.children);
            }
            continue;
          }

          if (inElseBranch) {
            elseXmlNodes.push(child);
          } else {
            thenXmlNodes.push(child);
          }
        }

        node.thenBranch = parseXmlTreeNodes(thenXmlNodes, indent + 1);
        if (elseXmlNodes.length > 0) {
          recordLine('SINON', indent);
          node.elseBranch = parseXmlTreeNodes(elseXmlNodes, indent + 1);
        }
        recordLine('FIN_SI', indent);
        result.push(node);
      } else if (node.type === 'WHILE') {
        recordLine(text, indent);
        node.body = parseXmlTreeNodes(nodeItem.children, indent + 1);
        recordLine('FIN_TANT_QUE', indent);
        result.push(node);
      } else if (node.type === 'FOR') {
        recordLine(text, indent);
        node.body = parseXmlTreeNodes(nodeItem.children, indent + 1);
        recordLine('FIN_POUR', indent);
        result.push(node);
      } else {
        recordLine(text, indent);
        result.push(node);
      }
    }

    return result;
  }

  const commands = parseXmlTreeNodes(algoNodesToParse, 0);

  return {
    description,
    variables,
    commands,
    rawLines,
    errors,
  };
}

function parseSingleCommand(lineText: string, line: number): AlgoCommandNode {
  const id = `node_${line}_${Math.random().toString(36).substring(2, 7)}`;
  const trimmed = lineText.trim();

  // Comments
  if (trimmed.startsWith('//') || trimmed.startsWith('#')) {
    return { id, line, rawText: trimmed, type: 'COMMENT' };
  }

  // PAUSE
  if (trimmed === 'PAUSE') {
    return { id, line, rawText: trimmed, type: 'PAUSE' };
  }

  // AFFICHER* (with newline) or AFFICHER
  if (trimmed.startsWith('AFFICHER*') || trimmed.startsWith('AFFICHER')) {
    const isNewline = trimmed.startsWith('AFFICHER*');
    const expr = trimmed.replace(/^AFFICHER\*/, '').replace(/^AFFICHER/, '').trim();
    return {
      id,
      line,
      rawText: trimmed,
      type: 'PRINT',
      expression: expr,
      printNewline: isNewline,
    };
  }

  // AFFICHERCALCUL* or AFFICHERCALCUL
  if (trimmed.startsWith('AFFICHERCALCUL*') || trimmed.startsWith('AFFICHERCALCUL')) {
    const isNewline = trimmed.startsWith('AFFICHERCALCUL*');
    const expr = trimmed.replace(/^AFFICHERCALCUL\*/, '').replace(/^AFFICHERCALCUL/, '').trim();
    return {
      id,
      line,
      rawText: trimmed,
      type: 'PRINT_CALC',
      expression: expr,
      printNewline: isNewline,
    };
  }

  // LIRE variable
  if (trimmed.startsWith('LIRE ')) {
    const varName = trimmed.replace(/^LIRE\s+/, '').trim();
    return {
      id,
      line,
      rawText: trimmed,
      type: 'READ',
      targetVar: varName,
    };
  }

  // PREND_LA_VALEUR
  if (trimmed.includes(' PREND_LA_VALEUR ')) {
    const parts = trimmed.split(' PREND_LA_VALEUR ');
    return {
      id,
      line,
      rawText: trimmed,
      type: 'ASSIGN',
      targetVar: parts[0].trim(),
      expression: parts[1].trim(),
    };
  }

  // SI (cond) ALORS
  const ifMatch = trimmed.match(/^SI\s*\((.*)\)\s*ALORS$/i) || trimmed.match(/^SI\s+(.*?)\s+ALORS$/i);
  if (ifMatch) {
    return {
      id,
      line,
      rawText: trimmed,
      type: 'IF',
      condition: ifMatch[1].trim(),
      thenBranch: [],
      elseBranch: [],
    };
  }

  // TANT_QUE (cond) FAIRE
  const whileMatch = trimmed.match(/^TANT_QUE\s*\((.*)\)\s*FAIRE$/i) || trimmed.match(/^TANT_QUE\s+(.*?)\s+FAIRE$/i);
  if (whileMatch) {
    return {
      id,
      line,
      rawText: trimmed,
      type: 'WHILE',
      condition: whileMatch[1].trim(),
      body: [],
    };
  }

  // POUR var ALLANT_DE start A end [PAS step] FAIRE
  const forMatch = trimmed.match(
    /^POUR\s+([a-zA-Z0-9_]+)\s+ALLANT_DE\s+(.*?)\s+A\s+(.*?)(?:\s+PAS\s+(.*?))?\s+FAIRE$/i
  );
  if (forMatch) {
    return {
      id,
      line,
      rawText: trimmed,
      type: 'FOR',
      forVar: forMatch[1],
      forStart: forMatch[2].trim(),
      forEnd: forMatch[3].trim(),
      forStep: forMatch[4] ? forMatch[4].trim() : '1',
      body: [],
    };
  }

  return {
    id,
    line,
    rawText: trimmed,
    type: 'UNKNOWN',
  };
}

function parseTextAlgoBox(text: string, errors: string[]): ParsedAlgorithm {
  const lines = text.split('\n');
  const variables: VariableDecl[] = [];
  const rawLines: { line: number; text: string; indent: number }[] = [];

  let inVariables = false;
  let inAlgo = false;
  const algoCodeLines: { text: string; origLine: number }[] = [];

  let lineCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    if (trimmed === 'VARIABLES') {
      inVariables = true;
      inAlgo = false;
      continue;
    }

    if (trimmed === 'DEBUT_ALGORITHME') {
      inVariables = false;
      inAlgo = true;
      continue;
    }

    if (trimmed === 'FIN_ALGORITHME') {
      inAlgo = false;
      continue;
    }

    if (inVariables && trimmed.includes('EST_DU_TYPE')) {
      const match = trimmed.match(/([a-zA-Z0-9_]+)\s+EST_DU_TYPE\s+(NOMBRE|CHAINE|LISTE)/i);
      if (match) {
        variables.push({
          name: match[1],
          type: match[2].toUpperCase() as VariableType,
        });
      }
    } else if (inAlgo && trimmed.length > 0) {
      algoCodeLines.push({ text: trimmed, origLine: i + 1 });
    }
  }

  const BLOCK_KEYWORDS = new Set([
    'DEBUT_SI',
    'FIN_SI',
    'SINON',
    'DEBUT_SINON',
    'FIN_SINON',
    'DEBUT_TANT_QUE',
    'FIN_TANT_QUE',
    'DEBUT_POUR',
    'FIN_POUR',
  ]);

  // Parse structured blocks in plain text
  function parseBlock(
    startIndex: number,
    stopKeywords: string[],
    currentIndent: number
  ): { nodes: AlgoCommandNode[]; nextIndex: number } {
    const nodes: AlgoCommandNode[] = [];
    let idx = startIndex;

    while (idx < algoCodeLines.length) {
      const { text, origLine } = algoCodeLines[idx];

      if (stopKeywords.some((k) => text === k || text.startsWith(k))) {
        break;
      }

      if (BLOCK_KEYWORDS.has(text)) {
        idx++;
        continue;
      }

      const node = parseSingleCommand(text, origLine);

      if (node.type === 'IF') {
        rawLines.push({ line: lineCounter++, text, indent: currentIndent });
        idx++;

        if (idx < algoCodeLines.length && algoCodeLines[idx].text === 'DEBUT_SI') {
          idx++;
        }

        const thenRes = parseBlock(idx, ['SINON', 'FIN_SI', 'DEBUT_SINON'], currentIndent + 1);
        node.thenBranch = thenRes.nodes;
        idx = thenRes.nextIndex;

        // Check if FIN_SI precedes SINON/DEBUT_SINON
        if (
          idx < algoCodeLines.length &&
          algoCodeLines[idx].text === 'FIN_SI' &&
          idx + 1 < algoCodeLines.length &&
          (algoCodeLines[idx + 1].text === 'SINON' || algoCodeLines[idx + 1].text === 'DEBUT_SINON')
        ) {
          idx++;
        }

        if (
          idx < algoCodeLines.length &&
          (algoCodeLines[idx].text === 'SINON' || algoCodeLines[idx].text === 'DEBUT_SINON')
        ) {
          if (algoCodeLines[idx].text === 'SINON') {
            rawLines.push({ line: lineCounter++, text: 'SINON', indent: currentIndent });
            idx++;
          }
          if (idx < algoCodeLines.length && algoCodeLines[idx].text === 'DEBUT_SINON') {
            idx++;
          }
          const elseRes = parseBlock(idx, ['FIN_SI', 'FIN_SINON'], currentIndent + 1);
          node.elseBranch = elseRes.nodes;
          idx = elseRes.nextIndex;
        }

        if (
          idx < algoCodeLines.length &&
          (algoCodeLines[idx].text === 'FIN_SI' || algoCodeLines[idx].text === 'FIN_SINON')
        ) {
          rawLines.push({ line: lineCounter++, text: 'FIN_SI', indent: currentIndent });
          idx++;
        }
        nodes.push(node);
        continue;
      } else if (node.type === 'WHILE') {
        rawLines.push({ line: lineCounter++, text, indent: currentIndent });
        idx++;
        if (idx < algoCodeLines.length && algoCodeLines[idx].text === 'DEBUT_TANT_QUE') {
          idx++;
        }
        const bodyRes = parseBlock(idx, ['FIN_TANT_QUE'], currentIndent + 1);
        node.body = bodyRes.nodes;
        idx = bodyRes.nextIndex;
        if (idx < algoCodeLines.length && algoCodeLines[idx].text === 'FIN_TANT_QUE') {
          rawLines.push({ line: lineCounter++, text: 'FIN_TANT_QUE', indent: currentIndent });
          idx++;
        }
        nodes.push(node);
        continue;
      } else if (node.type === 'FOR') {
        rawLines.push({ line: lineCounter++, text, indent: currentIndent });
        idx++;
        if (idx < algoCodeLines.length && algoCodeLines[idx].text === 'DEBUT_POUR') {
          idx++;
        }
        const bodyRes = parseBlock(idx, ['FIN_POUR'], currentIndent + 1);
        node.body = bodyRes.nodes;
        idx = bodyRes.nextIndex;
        if (idx < algoCodeLines.length && algoCodeLines[idx].text === 'FIN_POUR') {
          rawLines.push({ line: lineCounter++, text: 'FIN_POUR', indent: currentIndent });
          idx++;
        }
        nodes.push(node);
        continue;
      }

      rawLines.push({ line: lineCounter++, text, indent: currentIndent });
      nodes.push(node);
      idx++;
    }

    return { nodes, nextIndex: idx };
  }

  const { nodes: commands } = parseBlock(0, [], 0);

  return {
    description: '',
    variables,
    commands,
    rawLines,
    errors,
  };
}
