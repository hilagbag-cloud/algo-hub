export type VariableType = 'NOMBRE' | 'CHAINE' | 'LISTE';

export interface VariableDecl {
  name: string;
  type: VariableType;
}

export type SymbolValue = number | string | (number | string)[];

export interface SymbolTable {
  [key: string]: SymbolValue;
}

export interface AlgoCommandNode {
  id: string;
  line: number;
  rawText: string;
  type:
    | 'ASSIGN'
    | 'READ'
    | 'PRINT'
    | 'PRINT_CALC'
    | 'IF'
    | 'WHILE'
    | 'FOR'
    | 'PAUSE'
    | 'COMMENT'
    | 'UNKNOWN';
  targetVar?: string;
  expression?: string;
  condition?: string;
  forVar?: string;
  forStart?: string;
  forEnd?: string;
  forStep?: string;
  printNewline?: boolean;
  thenBranch?: AlgoCommandNode[];
  elseBranch?: AlgoCommandNode[];
  body?: AlgoCommandNode[];
}

export interface ParsedAlgorithm {
  title?: string;
  description?: string;
  variables: VariableDecl[];
  commands: AlgoCommandNode[];
  rawLines: { line: number; text: string; indent: number }[];
  errors: string[];
}

export type ExecutionStatus =
  | 'idle'
  | 'running'
  | 'paused'
  | 'waiting_input'
  | 'completed'
  | 'error';

export interface TerminalOutput {
  id: string;
  type: 'info' | 'stdout' | 'stdin' | 'error' | 'success' | 'system';
  text: string;
  timestamp: number;
}

export interface AlgorithmDoc {
  id: string;
  title: string;
  description: string;
  rawAlgContent: string;
  tags: string[];
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  createdAt: number;
  likesCount: number;
  likedBy?: string[];
  ratingsCount: number;
  averageRating: number;
  testsCount: number;
  category?: string;
}

export interface RatingDoc {
  id: string;
  algoId: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  score: number; // 1 to 5
  feedback?: string;
  executionPassed?: boolean;
  createdAt: number;
}

export interface CommentDoc {
  id: string;
  algoId: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  content: string;
  createdAt: number;
}

export interface WorkflowStepEvent {
  stepNumber: number;
  line: number;
  commandType: string;
  rawCommand: string;
  explanation: string;
  timestamp: number;
  variableChanged?: { name: string; value: SymbolValue };
  depth: number;
}

export interface ExecutionSummary {
  status: 'completed' | 'error' | 'stopped';
  totalSteps: number;
  durationMs: number;
  finalMemory: SymbolTable;
  outputsCount: number;
  completedAt: number;
}

export interface UserProfile {
  uid: string;
  username: string; // formatted with leading @ (e.g. "@alex_maths")
  displayName: string;
  email?: string;
  avatarSeed: string;
  avatarIcon: string;
  bio?: string;
  createdAt?: number;
  isRegistered?: boolean;
  totalSubmissions?: number;
  totalRatingsGiven?: number;
  totalLikesReceived?: number;
}
