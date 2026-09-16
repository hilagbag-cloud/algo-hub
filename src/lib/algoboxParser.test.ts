import { describe, expect, test } from 'bun:test';
import { parseAlgoBox } from './algoboxParser';
import { SAMPLE_ALGORITHMS } from './sampleAlgorithms';

describe('AlgoBox Parser (.alg)', () => {
  test('parses XML AlgoBox sample algorithms correctly', () => {
    for (const sample of SAMPLE_ALGORITHMS) {
      const parsed = parseAlgoBox(sample.rawAlgContent);

      expect(parsed.errors.length).toBe(0);
      expect(parsed.variables.length).toBeGreaterThan(0);
      expect(parsed.commands.length).toBeGreaterThan(0);
      expect(parsed.rawLines.length).toBeGreaterThan(0);
    }
  });

  test('parses variables and structures for Le Jeu du Nombre Mystère', () => {
    const mystere = SAMPLE_ALGORITHMS[0];
    const parsed = parseAlgoBox(mystere.rawAlgContent);

    expect(parsed.variables).toEqual([
      { name: 'secret', type: 'NOMBRE' },
      { name: 'essai', type: 'NOMBRE' },
      { name: 'tentatives', type: 'NOMBRE' },
      { name: 'trouve', type: 'NOMBRE' },
    ]);

    // Check that TANT_QUE loop is parsed with inner IF/ELSE commands
    const whileNode = parsed.commands.find((cmd) => cmd.type === 'WHILE');
    expect(whileNode).toBeDefined();
    expect(whileNode?.condition).toBe('trouve == 0');
    expect(whileNode?.body && whileNode.body.length).toBeGreaterThan(0);

    const ifInsideWhile = whileNode?.body?.find((cmd) => cmd.type === 'IF');
    expect(ifInsideWhile).toBeDefined();
    expect(ifInsideWhile?.condition).toBe('essai == secret');
    expect(ifInsideWhile?.thenBranch && ifInsideWhile.thenBranch.length).toBeGreaterThan(0);
    expect(ifInsideWhile?.elseBranch && ifInsideWhile.elseBranch.length).toBeGreaterThan(0);
  });

  test('parses plain text AlgoBox algorithms correctly', () => {
    const textAlgo = `
VARIABLES
  x EST_DU_TYPE NOMBRE
  message EST_DU_TYPE CHAINE
DEBUT_ALGORITHME
  x PREND_LA_VALEUR 10
  SI (x > 5) ALORS
    DEBUT_SI
    AFFICHER* "Superieur"
    FIN_SI
    SINON
    DEBUT_SINON
    AFFICHER* "Inferieur"
    FIN_SINON
FIN_ALGORITHME
    `;

    const parsed = parseAlgoBox(textAlgo);

    expect(parsed.variables).toEqual([
      { name: 'x', type: 'NOMBRE' },
      { name: 'message', type: 'CHAINE' },
    ]);

    expect(parsed.commands.length).toBe(2);
    expect(parsed.commands[0].type).toBe('ASSIGN');
    expect(parsed.commands[0].targetVar).toBe('x');
    expect(parsed.commands[0].expression).toBe('10');

    expect(parsed.commands[1].type).toBe('IF');
    expect(parsed.commands[1].condition).toBe('x > 5');
    expect(parsed.commands[1].thenBranch?.length).toBe(1);
    expect(parsed.commands[1].elseBranch?.length).toBe(1);
  });
});
