import {
  AlgoCommandNode,
  ParsedAlgorithm,
  VariableDecl,
  VariableType,
} from '../types/algobox';

/**
 * Parses AlgoBox (.alg) files either in official XML format or plain-text representation.
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

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&');
}

function parseXmlAlgoBox(xmlText: string): ParsedAlgorithm {
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(xmlText, 'text/xml');
  const parseError = xmlDoc.querySelector('parsererror');
  if (parseError) {
    throw new Error(parseError.textContent || 'XML invalide');
  }

  const descNode = xmlDoc.querySelector('description');
  const description = descNode?.getAttribute('texte') || '';

  const variables: VariableDecl[] = [];
  const errors: string[] = [];
  const rawLines: { line: number; text: string; indent: number }[] = [];
  let lineNumber = 1;

  // Find VARIABLES section
  const items = Array.from(xmlDoc.querySelectorAll('item'));
  let inVariables = false;
  let inAlgorithm = false;

  // Let's gather variable declarations and algo items
  const algoRootItems: Element[] = [];

  for (const item of items) {
    const algoItem = item.getAttribute('algoitem') || '';
    const decoded = decodeXmlEntities(algoItem).trim();

    if (decoded === 'VARIABLES') {
      inVariables = true;
      inAlgorithm = false;
      continue;
    } else if (decoded === 'DEBUT_ALGORITHME') {
      inVariables = false;
      inAlgorithm = true;
      continue;
    } else if (decoded === 'FIN_ALGORITHME') {
      inAlgorithm = false;
      continue;
    }

    if (inVariables && decoded.includes('EST_DU_TYPE')) {
      const match = decoded.match(/([a-zA-Z0-9_]+)\s+EST_DU_TYPE\s+(NOMBRE|CHAINE|LISTE)/i);
      if (match) {
        variables.push({
          name: match[1],
          type: match[2].toUpperCase() as VariableType,
        });
      }
    }
  }

  // Now extract the tree under DEBUT_ALGORITHME
  // In AlgoBox XML, DEBUT_ALGORITHME can contain child <item> or be sibling items until FIN_ALGORITHME.
  const debutAlgoItem = items.find((it) => (it.getAttribute('algoitem') || '').trim() === 'DEBUT_ALGORITHME');

  let directChildNodes: Element[] = [];
  if (debutAlgoItem && debutAlgoItem.children.length > 0) {
    directChildNodes = Array.from(debutAlgoItem.children).filter((el) => el.tagName.toLowerCase() === 'item');
  } else {
    // Collect siblings between DEBUT_ALGORITHME and FIN_ALGORITHME
    let started = false;
    for (const it of items) {
      const val = (it.getAttribute('algoitem') || '').trim();
      if (val === 'DEBUT_ALGORITHME') {
        started = true;
        continue;
      }
      if (val === 'FIN_ALGORITHME') {
        break;
      }
      if (started) {
        // Only top-level items in algorithm
        if (it.parentElement?.getAttribute('algoitem') === 'DEBUT_ALGORITHME' || it.parentElement?.tagName.toLowerCase() === 'algo') {
          directChildNodes.push(it);
        }
      }
    }
  }

  // If directChildNodes is empty, grab all items after DEBUT_ALGORITHME that are commands
  if (directChildNodes.length === 0) {
    let collect = false;
    for (const it of items) {
      const val = (it.getAttribute('algoitem') || '').trim();
      if (val === 'DEBUT_ALGORITHME') {
        collect = true;
        continue;
      }
      if (val === 'FIN_ALGORITHME') {
        collect = false;
        break;
      }
      if (collect && it.parentElement?.getAttribute('algoitem') !== 'VARIABLES') {
        directChildNodes.push(it);
      }
    }
  }

  const commands = parseXmlItems(directChildNodes, 0, (text, indent) => {
    rawLines.push({ line: lineNumber++, text, indent });
  });

  return {
    description,
    variables,
    commands,
    rawLines,
    errors,
  };
}

function parseXmlItems(
  items: Element[],
  currentLine: number,
  recordLine: (text: string, indent: number) => void
): AlgoCommandNode[] {
  const nodes: AlgoCommandNode[] = [];
  let i = 0;

  while (i < items.length) {
    const item = items[i];
    const rawVal = item.getAttribute('algoitem') || '';
    const text = decodeXmlEntities(rawVal).trim();

    if (!text || text === 'DEBUT_SI' || text === 'FIN_SI' || text === 'DEBUT_SINON' || text === 'FIN_SINON' || text === 'DEBUT_TANT_QUE' || text === 'FIN_TANT_QUE' || text === 'DEBUT_POUR' || text === 'FIN_POUR') {
      i++;
      continue;
    }

    const node = parseSingleCommand(text, i + 1);

    if (node.type === 'IF') {
      // Check if item has child items or if they are following items
      const childItems = Array.from(item.children).filter((c) => c.tagName.toLowerCase() === 'item');
      if (childItems.length > 0) {
        // XML nested hierarchy
        recordLine(text, 0);
        const thenItems: Element[] = [];
        const elseItems: Element[] = [];
        let inElse = false;

        for (const child of childItems) {
          const childText = decodeXmlEntities(child.getAttribute('algoitem') || '').trim();
          if (childText === 'SINON') {
            inElse = true;
            continue;
          }
          if (inElse) {
            elseItems.push(child);
          } else {
            thenItems.push(child);
          }
        }

        node.thenBranch = parseXmlItems(thenItems, currentLine + 1, (t, ind) => recordLine(t, ind + 1));
        if (elseItems.length > 0) {
          recordLine('SINON', 0);
          node.elseBranch = parseXmlItems(elseItems, currentLine + 1, (t, ind) => recordLine(t, ind + 1));
        }
        recordLine('FIN_SI', 0);
      } else {
        // Flat sibling structure
        recordLine(text, 0);
        const thenItems: Element[] = [];
        const elseItems: Element[] = [];
        let inElse = false;
        let depth = 1;

        i++;
        while (i < items.length) {
          const nextText = decodeXmlEntities(items[i].getAttribute('algoitem') || '').trim();
          if (nextText.startsWith('SI ') && nextText.endsWith('ALORS')) {
            depth++;
          }
          if (nextText === 'FIN_SI') {
            depth--;
            if (depth === 0) {
              i++;
              break;
            }
          }
          if (depth === 1 && nextText === 'SINON') {
            inElse = true;
            i++;
            continue;
          }

          if (inElse) {
            elseItems.push(items[i]);
          } else {
            thenItems.push(items[i]);
          }
          i++;
        }

        node.thenBranch = parseXmlItems(thenItems, currentLine + 1, (t, ind) => recordLine(t, ind + 1));
        if (elseItems.length > 0) {
          recordLine('SINON', 0);
          node.elseBranch = parseXmlItems(elseItems, currentLine + 1, (t, ind) => recordLine(t, ind + 1));
        }
        recordLine('FIN_SI', 0);
        nodes.push(node);
        continue;
      }
    } else if (node.type === 'WHILE') {
      const childItems = Array.from(item.children).filter((c) => c.tagName.toLowerCase() === 'item');
      if (childItems.length > 0) {
        recordLine(text, 0);
        node.body = parseXmlItems(childItems, currentLine + 1, (t, ind) => recordLine(t, ind + 1));
        recordLine('FIN_TANT_QUE', 0);
      } else {
        recordLine(text, 0);
        const bodyItems: Element[] = [];
        let depth = 1;
        i++;
        while (i < items.length) {
          const nextText = decodeXmlEntities(items[i].getAttribute('algoitem') || '').trim();
          if (nextText.startsWith('TANT_QUE ') && nextText.endsWith('FAIRE')) {
            depth++;
          }
          if (nextText === 'FIN_TANT_QUE') {
            depth--;
            if (depth === 0) {
              i++;
              break;
            }
          }
          bodyItems.push(items[i]);
          i++;
        }
        node.body = parseXmlItems(bodyItems, currentLine + 1, (t, ind) => recordLine(t, ind + 1));
        recordLine('FIN_TANT_QUE', 0);
        nodes.push(node);
        continue;
      }
    } else if (node.type === 'FOR') {
      const childItems = Array.from(item.children).filter((c) => c.tagName.toLowerCase() === 'item');
      if (childItems.length > 0) {
        recordLine(text, 0);
        node.body = parseXmlItems(childItems, currentLine + 1, (t, ind) => recordLine(t, ind + 1));
        recordLine('FIN_POUR', 0);
      } else {
        recordLine(text, 0);
        const bodyItems: Element[] = [];
        let depth = 1;
        i++;
        while (i < items.length) {
          const nextText = decodeXmlEntities(items[i].getAttribute('algoitem') || '').trim();
          if (nextText.startsWith('POUR ') && nextText.endsWith('FAIRE')) {
            depth++;
          }
          if (nextText === 'FIN_POUR') {
            depth--;
            if (depth === 0) {
              i++;
              break;
            }
          }
          bodyItems.push(items[i]);
          i++;
        }
        node.body = parseXmlItems(bodyItems, currentLine + 1, (t, ind) => recordLine(t, ind + 1));
        recordLine('FIN_POUR', 0);
        nodes.push(node);
        continue;
      }
    } else {
      recordLine(text, 0);
    }

    nodes.push(node);
    i++;
  }

  return nodes;
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

  // Parse structured blocks in plain text
  function parseBlock(startIndex: number, stopKeywords: string[]): { nodes: AlgoCommandNode[]; nextIndex: number } {
    const nodes: AlgoCommandNode[] = [];
    let idx = startIndex;

    while (idx < algoCodeLines.length) {
      const { text, origLine } = algoCodeLines[idx];

      if (stopKeywords.some((k) => text === k || text.startsWith(k))) {
        break;
      }

      if (text === 'DEBUT_SI' || text === 'DEBUT_SINON' || text === 'DEBUT_TANT_QUE' || text === 'DEBUT_POUR') {
        idx++;
        continue;
      }

      const node = parseSingleCommand(text, origLine);

      if (node.type === 'IF') {
        rawLines.push({ line: lineCounter++, text, indent: 0 });
        idx++;
        const thenRes = parseBlock(idx, ['SINON', 'FIN_SI']);
        node.thenBranch = thenRes.nodes;
        idx = thenRes.nextIndex;

        if (idx < algoCodeLines.length && algoCodeLines[idx].text.startsWith('SINON')) {
          rawLines.push({ line: lineCounter++, text: 'SINON', indent: 0 });
          idx++;
          const elseRes = parseBlock(idx, ['FIN_SI']);
          node.elseBranch = elseRes.nodes;
          idx = elseRes.nextIndex;
        }

        if (idx < algoCodeLines.length && algoCodeLines[idx].text === 'FIN_SI') {
          rawLines.push({ line: lineCounter++, text: 'FIN_SI', indent: 0 });
          idx++;
        }
        nodes.push(node);
        continue;
      } else if (node.type === 'WHILE') {
        rawLines.push({ line: lineCounter++, text, indent: 0 });
        idx++;
        const bodyRes = parseBlock(idx, ['FIN_TANT_QUE']);
        node.body = bodyRes.nodes;
        idx = bodyRes.nextIndex;
        if (idx < algoCodeLines.length && algoCodeLines[idx].text === 'FIN_TANT_QUE') {
          rawLines.push({ line: lineCounter++, text: 'FIN_TANT_QUE', indent: 0 });
          idx++;
        }
        nodes.push(node);
        continue;
      } else if (node.type === 'FOR') {
        rawLines.push({ line: lineCounter++, text, indent: 0 });
        idx++;
        const bodyRes = parseBlock(idx, ['FIN_POUR']);
        node.body = bodyRes.nodes;
        idx = bodyRes.nextIndex;
        if (idx < algoCodeLines.length && algoCodeLines[idx].text === 'FIN_POUR') {
          rawLines.push({ line: lineCounter++, text: 'FIN_POUR', indent: 0 });
          idx++;
        }
        nodes.push(node);
        continue;
      }

      rawLines.push({ line: lineCounter++, text, indent: 0 });
      nodes.push(node);
      idx++;
    }

    return { nodes, nextIndex: idx };
  }

  const { nodes: commands } = parseBlock(0, []);

  return {
    description: '',
    variables,
    commands,
    rawLines,
    errors,
  };
}
