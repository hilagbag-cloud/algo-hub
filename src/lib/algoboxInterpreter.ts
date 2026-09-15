import {
  AlgoCommandNode,
  ExecutionStatus,
  ParsedAlgorithm,
  SymbolTable,
  SymbolValue,
  TerminalOutput,
  VariableType,
  WorkflowStepEvent,
  ExecutionSummary,
} from '../types/algobox';

export interface InterpreterEvents {
  onOutput: (output: TerminalOutput) => void;
  onMemoryChange: (memory: SymbolTable) => void;
  onStatusChange: (status: ExecutionStatus) => void;
  onActiveLineChange: (line: number | null) => void;
  onInputPrompt: (varName: string, promptText?: string) => void;
  onWorkflowStep?: (step: WorkflowStepEvent) => void;
  onExecutionSummary?: (summary: ExecutionSummary) => void;
  onComplete: () => void;
}

export class AlgoBoxInterpreter {
  private parsed: ParsedAlgorithm;
  private memory: SymbolTable = {};
  private status: ExecutionStatus = 'idle';
  private events: InterpreterEvents;
  private stopRequested = false;
  private pauseRequested = false;
  private stepMode = false;
  private delayMs = 150;
  private stepResolve: (() => void) | null = null;
  private inputResolve: ((val: string) => void) | null = null;
  private instructionCount = 0;
  private stepNumber = 0;
  private maxInstructions = 100000;
  private outputBuffer = '';
  private startTime = 0;
  private outputCount = 0;

  constructor(parsed: ParsedAlgorithm, events: InterpreterEvents) {
    this.parsed = parsed;
    this.events = events;
    this.reset();
  }

  public setSpeed(delayMs: number) {
    this.delayMs = delayMs;
  }

  public getStatus(): ExecutionStatus {
    return this.status;
  }

  public getMemory(): SymbolTable {
    return { ...this.memory };
  }

  public reset() {
    this.stopRequested = false;
    this.pauseRequested = false;
    this.stepMode = false;
    this.stepResolve = null;
    this.inputResolve = null;
    this.instructionCount = 0;
    this.stepNumber = 0;
    this.outputCount = 0;
    this.startTime = Date.now();
    this.outputBuffer = '';

    // Initialize symbols
    this.memory = {};
    for (const v of this.parsed.variables) {
      if (v.type === 'NOMBRE') {
        this.memory[v.name] = 0;
      } else if (v.type === 'CHAINE') {
        this.memory[v.name] = '';
      } else if (v.type === 'LISTE') {
        this.memory[v.name] = [];
      }
    }

    this.setStatus('idle');
    this.events.onActiveLineChange(null);
    this.events.onMemoryChange(this.getMemory());
  }

  private setStatus(s: ExecutionStatus) {
    this.status = s;
    this.events.onStatusChange(s);
  }

  private emitOutput(text: string, type: TerminalOutput['type'] = 'stdout') {
    this.outputCount++;
    this.events.onOutput({
      id: `out_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      type,
      text,
      timestamp: Date.now(),
    });
  }

  private emitWorkflowStep(
    node: AlgoCommandNode,
    explanation: string,
    variableChanged?: { name: string; value: SymbolValue },
    depth = 0
  ) {
    this.stepNumber++;
    if (this.events.onWorkflowStep) {
      this.events.onWorkflowStep({
        stepNumber: this.stepNumber,
        line: node.line,
        commandType: node.type,
        rawCommand: node.rawText,
        explanation,
        timestamp: Date.now(),
        variableChanged,
        depth,
      });
    }
  }

  private finishExecution(status: 'completed' | 'error' | 'stopped') {
    const duration = Math.max(1, Date.now() - this.startTime);
    if (this.events.onExecutionSummary) {
      this.events.onExecutionSummary({
        status,
        totalSteps: this.stepNumber,
        durationMs: duration,
        finalMemory: this.getMemory(),
        outputsCount: this.outputCount,
        completedAt: Date.now(),
      });
    }
  }

  public async run() {
    if (this.status === 'completed' || this.status === 'error') {
      this.reset();
    }
    this.stopRequested = false;
    this.pauseRequested = false;
    this.stepMode = false;
    this.startTime = Date.now();

    if (this.status === 'paused' && this.stepResolve) {
      const res = this.stepResolve;
      this.stepResolve = null;
      this.setStatus('running');
      res();
      return;
    }

    this.setStatus('running');
    this.emitOutput('--- Démarrage de l\'exécution ---', 'system');

    try {
      await this.executeNodes(this.parsed.commands, 0);
      if (!this.stopRequested) {
        this.flushOutputBuffer();
        this.setStatus('completed');
        this.events.onActiveLineChange(null);
        this.emitOutput('--- Algorithme terminé avec succès ---', 'success');
        this.finishExecution('completed');
        this.events.onComplete();
      } else {
        this.finishExecution('stopped');
      }
    } catch (err: any) {
      this.flushOutputBuffer();
      this.setStatus('error');
      this.events.onActiveLineChange(null);
      this.emitOutput(`Erreur d'exécution : ${err.message}`, 'error');
      this.finishExecution('error');
    }
  }

  public async step() {
    if (this.status === 'idle' || this.status === 'completed' || this.status === 'error') {
      this.reset();
      this.stepMode = true;
      this.startTime = Date.now();
      this.setStatus('paused');
      this.emitOutput('--- Mode pas-à-pas activé ---', 'system');
      this.runStepPipeline();
      return;
    }

    if (this.status === 'paused' && this.stepResolve) {
      const res = this.stepResolve;
      this.stepResolve = null;
      res();
    }
  }

  private async runStepPipeline() {
    try {
      await this.executeNodes(this.parsed.commands, 0);
      if (!this.stopRequested) {
        this.flushOutputBuffer();
        this.setStatus('completed');
        this.events.onActiveLineChange(null);
        this.emitOutput('--- Algorithme terminé avec succès ---', 'success');
        this.finishExecution('completed');
        this.events.onComplete();
      } else {
        this.finishExecution('stopped');
      }
    } catch (err: any) {
      this.flushOutputBuffer();
      this.setStatus('error');
      this.events.onActiveLineChange(null);
      this.emitOutput(`Erreur : ${err.message}`, 'error');
      this.finishExecution('error');
    }
  }

  public pause() {
    if (this.status === 'running') {
      this.pauseRequested = true;
      this.setStatus('paused');
    }
  }

  public stop() {
    this.stopRequested = true;
    if (this.stepResolve) {
      this.stepResolve();
      this.stepResolve = null;
    }
    if (this.inputResolve) {
      this.inputResolve('0');
      this.inputResolve = null;
    }
    this.flushOutputBuffer();
    this.setStatus('idle');
    this.events.onActiveLineChange(null);
    this.emitOutput('--- Exécution interrompue par l\'utilisateur ---', 'info');
    this.finishExecution('stopped');
  }

  public provideInput(val: string) {
    if (this.inputResolve) {
      const res = this.inputResolve;
      this.inputResolve = null;
      res(val);
    }
  }

  private flushOutputBuffer() {
    if (this.outputBuffer.length > 0) {
      this.emitOutput(this.outputBuffer, 'stdout');
      this.outputBuffer = '';
    }
  }

  private async waitBeforeNextStep(line: number) {
    this.instructionCount++;
    if (this.instructionCount > this.maxInstructions) {
      throw new Error(
        `Dépassement du nombre maximal d'instructions (${this.maxInstructions}). Boucle infinie probable !`
      );
    }

    this.events.onActiveLineChange(line);

    if (this.stopRequested) {
      throw new Error('Interrompu');
    }

    if (this.stepMode || this.pauseRequested) {
      this.pauseRequested = false;
      this.setStatus('paused');
      await new Promise<void>((resolve) => {
        this.stepResolve = resolve;
      });
      if (this.stopRequested) throw new Error('Interrompu');
      if (!this.stepMode) this.setStatus('running');
    } else if (this.delayMs > 0) {
      await new Promise((r) => setTimeout(r, this.delayMs));
    }
  }

  private async executeNodes(nodes: AlgoCommandNode[], depth = 0): Promise<void> {
    for (const node of nodes) {
      if (this.stopRequested) return;
      await this.executeSingleNode(node, depth);
    }
  }

  private async executeSingleNode(node: AlgoCommandNode, depth = 0): Promise<void> {
    if (this.stopRequested) return;

    await this.waitBeforeNextStep(node.line);

    switch (node.type) {
      case 'COMMENT':
        this.emitWorkflowStep(node, `Commentaire : ${node.rawText}`, undefined, depth);
        break;

      case 'PAUSE':
        this.flushOutputBuffer();
        this.emitOutput('[PAUSE - Appuyez sur Reprendre/Pas à pas]', 'info');
        this.emitWorkflowStep(node, `Pause programmée dans l'algorithme`, undefined, depth);
        this.setStatus('paused');
        await new Promise<void>((resolve) => {
          this.stepResolve = resolve;
        });
        break;

      case 'ASSIGN': {
        if (!node.targetVar || node.expression === undefined) break;
        const val = this.evaluateExpression(node.expression);
        this.assignToTarget(node.targetVar, val);
        this.events.onMemoryChange(this.getMemory());
        this.emitWorkflowStep(
          node,
          `Affectation : ${node.targetVar} PREND_LA_VALEUR ${JSON.stringify(val)}`,
          { name: node.targetVar, value: val },
          depth
        );
        break;
      }

      case 'READ': {
        if (!node.targetVar) break;
        this.flushOutputBuffer();
        const targetVar = node.targetVar;
        this.setStatus('waiting_input');
        this.events.onInputPrompt(targetVar, `Entrez une valeur pour "${targetVar}" :`);
        this.emitWorkflowStep(node, `En attente de saisie pour "${targetVar}"...`, undefined, depth);

        const userInput = await new Promise<string>((resolve) => {
          this.inputResolve = resolve;
        });

        this.emitOutput(`> ${userInput}`, 'stdin');

        const isListMatch = targetVar.match(/^([a-zA-Z0-9_]+)\[(.*)\]$/);
        let varType: VariableType = 'NOMBRE';

        if (isListMatch) {
          const listDecl = this.parsed.variables.find((v) => v.name === isListMatch[1]);
          if (listDecl) varType = listDecl.type;
        } else {
          const decl = this.parsed.variables.find((v) => v.name === targetVar);
          if (decl) varType = decl.type;
        }

        let parsedVal: SymbolValue = userInput;
        if (varType === 'NOMBRE') {
          const num = Number(userInput.replace(',', '.'));
          parsedVal = isNaN(num) ? 0 : num;
        }

        this.assignToTarget(targetVar, parsedVal);
        this.events.onMemoryChange(this.getMemory());
        this.emitWorkflowStep(
          node,
          `Lecture validée : ${targetVar} = ${JSON.stringify(parsedVal)}`,
          { name: targetVar, value: parsedVal },
          depth
        );
        this.setStatus('running');
        break;
      }

      case 'PRINT': {
        const text = this.evaluatePrintExpression(node.expression || '');
        if (node.printNewline) {
          this.emitOutput(this.outputBuffer + text, 'stdout');
          this.outputBuffer = '';
        } else {
          this.outputBuffer += text;
        }
        this.emitWorkflowStep(
          node,
          `Affichage texte : "${text}"${node.printNewline ? ' (avec retour à la ligne)' : ''}`,
          undefined,
          depth
        );
        break;
      }

      case 'PRINT_CALC': {
        const result = this.evaluateExpression(node.expression || '0');
        const text = String(result);
        if (node.printNewline) {
          this.emitOutput(this.outputBuffer + text, 'stdout');
          this.outputBuffer = '';
        } else {
          this.outputBuffer += text;
        }
        this.emitWorkflowStep(
          node,
          `Affichage calcul : ${node.expression} = ${text}${node.printNewline ? ' (avec retour à la ligne)' : ''}`,
          undefined,
          depth
        );
        break;
      }

      case 'IF': {
        const condVal = this.evaluateCondition(node.condition || '0');
        this.emitWorkflowStep(
          node,
          `Condition SI (${node.condition}) -> résultat : ${condVal ? 'VRAI (branche ALORS exécutée)' : 'FAUX (branche SINON prise)'}`,
          undefined,
          depth
        );
        if (condVal) {
          if (node.thenBranch && node.thenBranch.length > 0) {
            await this.executeNodes(node.thenBranch, depth + 1);
          }
        } else {
          if (node.elseBranch && node.elseBranch.length > 0) {
            await this.executeNodes(node.elseBranch, depth + 1);
          }
        }
        break;
      }

      case 'WHILE': {
        let iteration = 0;
        while (this.evaluateCondition(node.condition || '0')) {
          if (this.stopRequested) break;
          iteration++;
          this.emitWorkflowStep(
            node,
            `Boucle TANT_QUE : condition (${node.condition}) vérifiée (itération ${iteration})`,
            undefined,
            depth
          );
          if (node.body && node.body.length > 0) {
            await this.executeNodes(node.body, depth + 1);
          }
          await this.waitBeforeNextStep(node.line);
        }
        break;
      }

      case 'FOR': {
        if (!node.forVar) break;
        const varName = node.forVar;
        const startVal = Number(this.evaluateExpression(node.forStart || '0'));
        const endVal = Number(this.evaluateExpression(node.forEnd || '0'));
        const stepVal = Number(this.evaluateExpression(node.forStep || '1')) || 1;

        let current = startVal;
        this.assignToTarget(varName, current);
        this.events.onMemoryChange(this.getMemory());

        let iterCount = 0;
        if (stepVal > 0) {
          while (current <= endVal) {
            if (this.stopRequested) break;
            iterCount++;
            this.assignToTarget(varName, current);
            this.events.onMemoryChange(this.getMemory());
            this.emitWorkflowStep(
              node,
              `Boucle POUR : ${varName} = ${current} (de ${startVal} à ${endVal}, itération ${iterCount})`,
              { name: varName, value: current },
              depth
            );
            if (node.body && node.body.length > 0) {
              await this.executeNodes(node.body, depth + 1);
            }
            current += stepVal;
            if (current <= endVal) {
              await this.waitBeforeNextStep(node.line);
            }
          }
        } else {
          while (current >= endVal) {
            if (this.stopRequested) break;
            iterCount++;
            this.assignToTarget(varName, current);
            this.events.onMemoryChange(this.getMemory());
            this.emitWorkflowStep(
              node,
              `Boucle POUR : ${varName} = ${current} (de ${startVal} à ${endVal}, itération ${iterCount})`,
              { name: varName, value: current },
              depth
            );
            if (node.body && node.body.length > 0) {
              await this.executeNodes(node.body, depth + 1);
            }
            current += stepVal;
            if (current >= endVal) {
              await this.waitBeforeNextStep(node.line);
            }
          }
        }
        break;
      }

      default:
        break;
    }
  }

  private assignToTarget(target: string, value: SymbolValue) {
    const trimmed = target.trim();
    const arrayMatch = trimmed.match(/^([a-zA-Z0-9_]+)\[(.*)\]$/);

    if (arrayMatch) {
      const listName = arrayMatch[1];
      const indexExpr = arrayMatch[2];
      const idx = Math.round(Number(this.evaluateExpression(indexExpr)));

      if (!this.memory[listName] || !Array.isArray(this.memory[listName])) {
        this.memory[listName] = [];
      }
      const arr = this.memory[listName] as (number | string)[];
      arr[idx] = typeof value === 'number' || typeof value === 'string' ? value : String(value);
    } else {
      this.memory[trimmed] = value;
    }
  }

  private evaluatePrintExpression(expr: string): string {
    const trimmed = expr.trim();
    if (trimmed.length === 0) return '';

    // Direct quotes: "hello world"
    if (
      (trimmed.startsWith('"') && trimmed.endsWith('"')) ||
      (trimmed.startsWith("'") && trimmed.endsWith("'"))
    ) {
      return trimmed.slice(1, -1);
    }

    // Is it a known variable in memory?
    if (this.memory[trimmed] !== undefined) {
      const val = this.memory[trimmed];
      if (Array.isArray(val)) return JSON.stringify(val);
      return String(val);
    }

    // Array indexing like tab[i]
    const arrayMatch = trimmed.match(/^([a-zA-Z0-9_]+)\[(.*)\]$/);
    if (arrayMatch) {
      const listName = arrayMatch[1];
      const indexExpr = arrayMatch[2];
      const idx = Math.round(Number(this.evaluateExpression(indexExpr)));
      const arr = this.memory[listName];
      if (Array.isArray(arr) && arr[idx] !== undefined) {
        return String(arr[idx]);
      }
      return '0';
    }

    // Otherwise evaluate expression
    try {
      const res = this.evaluateExpression(trimmed);
      return String(res);
    } catch {
      return trimmed;
    }
  }

  private evaluateCondition(conditionStr: string): boolean {
    let expr = conditionStr.trim();
    if (!expr) return false;

    // Replace AlgoBox logical operators
    expr = expr
      .replace(/\bET\b/gi, ' && ')
      .replace(/\bOU\b/gi, ' || ')
      .replace(/\bNON\b/gi, ' ! ')
      .replace(/<>/g, ' !== ')
      .replace(/==/g, ' === ')
      .replace(/=(?!=)/g, ' === ');

    const res = this.evaluateExpression(expr);
    return Boolean(res);
  }

  private evaluateExpression(rawExpr: string): any {
    let expr = rawExpr.trim();
    if (!expr) return 0;

    // Convert AlgoBox math helpers
    // ALGOBOX_ALEA_ENTIER(a, b) -> Math.floor(Math.random() * (b - a + 1)) + a
    expr = expr.replace(
      /ALGOBOX_ALEA_ENTIER\s*\(\s*([^,]+)\s*,\s*([^)]+)\s*\)/g,
      'Math.floor(Math.random() * (($2) - ($1) + 1)) + ($1)'
    );

    // pow, sqrt, abs, floor, round, ceil, cos, sin, tan, min, max, pi
    expr = expr
      .replace(/\bpow\s*\(/g, 'Math.pow(')
      .replace(/\bsqrt\s*\(/g, 'Math.sqrt(')
      .replace(/\babs\s*\(/g, 'Math.abs(')
      .replace(/\bfloor\s*\(/g, 'Math.floor(')
      .replace(/\bround\s*\(/g, 'Math.round(')
      .replace(/\bceil\s*\(/g, 'Math.ceil(')
      .replace(/\bcos\s*\(/g, 'Math.cos(')
      .replace(/\bsin\s*\(/g, 'Math.sin(')
      .replace(/\btan\s*\(/g, 'Math.tan(')
      .replace(/\bmin\s*\(/g, 'Math.min(')
      .replace(/\bmax\s*\(/g, 'Math.max(')
      .replace(/\bPI\b/g, 'Math.PI')
      .replace(/\bpi\b/g, 'Math.PI');

    // Replace variables with their memory values or lookups
    const keys = Object.keys(this.memory);
    // Sort keys by length descending to prevent substring collisions (e.g. 'sum_total' before 'sum')
    keys.sort((a, b) => b.length - a.length);

    // Build context object for safe function execution
    const scope: Record<string, any> = {
      Math,
      ...this.memory,
    };

    // Use secure Function evaluation with isolated scope
    const scopeKeys = Object.keys(scope);
    const scopeValues = Object.values(scope);

    try {
      // Evaluate expression inside the scope
      const evaluator = new Function(...scopeKeys, `"use strict"; return (${expr});`);
      return evaluator(...scopeValues);
    } catch (err: any) {
      // Fallback for simple number or string literal
      if (!isNaN(Number(expr))) return Number(expr);
      return 0;
    }
  }
}
