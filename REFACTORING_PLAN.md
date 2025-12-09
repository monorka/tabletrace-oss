# ConnectedView リファクタリング計画

## 目次
1. [現状の問題点](#現状の問題点)
2. [リファクタリング目標](#リファクタリング目標)
3. [アーキテクチャ設計](#アーキテクチャ設計)
4. [実装手順](#実装手順)
5. [ファイル構造](#ファイル構造)
6. [型定義の変更](#型定義の変更)
7. [段階的移行計画](#段階的移行計画)

---

## 現状の問題点

### 1.1 Props の過多（21個）
- **問題**: `ConnectedViewProps` に21個の props が定義されている
- **影響**: コンポーネントの責務が不明確、テストが困難
- **未使用 props**: 
  - `watchedTableData` (アンダースコア付きで未使用)
  - `selectedTableColumns` (アンダースコア付きで未使用)
  - `selectedTableRows` (アンダースコア付きで未使用)
  - `selectedTableRowCount` (アンダースコア付きで未使用)

### 1.2 重複した条件分岐ロジック
- **問題**: 右パネル（234-261行目）とボトムパネル（265-294行目）で同じロジックが重複
- **影響**: 変更時に2箇所を修正する必要があり、バグのリスクが高い

```typescript
// 現在の重複パターン
{eventLogPosition === "right" && (
  activeTab === "dryrun" ? <DryRunSqlPanel /> :
  activeTab === "erd" ? <ERDSidePanel /> :
  <EventLog />
)}

{eventLogPosition === "bottom" && (
  activeTab === "dryrun" ? <DryRunSqlPanel isBottom /> :
  activeTab === "erd" ? <ERDSidePanel isBottom /> :
  <EventLog />
)}
```

### 1.3 インラインコンポーネント定義
- **問題**: `EventLogHeader` が関数コンポーネントとしてインライン定義（99-119行目）
- **影響**: 再利用性が低く、テストが困難

### 1.4 状態管理の分散
- **問題**: タブ固有の状態が `ConnectedView` に集約されている
  - Dry Run 状態: `dryRunSql`, `isDryRunning`, `dryRunResult`
  - ERD 状態: `erdHoveredTable`
  - Event Log 状態: `expandedEventIds`
- **影響**: 状態の責任範囲が不明確、再利用が困難

### 1.5 単一責任原則違反
- **問題**: 1つのコンポーネントが以下をすべて担当
  - レイアウト管理
  - タブ管理
  - 状態管理
  - UI レンダリング
- **影響**: 299行の巨大コンポーネント、理解・保守が困難

### 1.6 深いネストと複雑な条件分岐
- **問題**: JSX のネストが深く、条件分岐が複雑
- **影響**: 可読性が低い、フローが追いにくい

---

## リファクタリング目標

### 2.1 主要目標
1. **責務の分離**: 各タブを独立したコンポーネントに分離
2. **状態の局所化**: タブ固有の状態を各タブコンポーネントに移動
3. **コードの重複削減**: 共通ロジックの抽出と再利用
4. **可読性の向上**: コンポーネントサイズの削減、明確な構造
5. **テスタビリティの向上**: 小さな単位でのテストが可能に

### 2.2 成功指標
- 各コンポーネントが100行以下
- Props の数が10個以下
- コードの重複率が5%以下
- 単体テストのカバレッジが80%以上

---

## アーキテクチャ設計

### 3.1 新しいコンポーネント構造

```
ConnectedView (レイアウト管理のみ)
├── TableListPanel (既存、変更なし)
├── TabContentArea
│   ├── TablesTabContent
│   ├── TimelineTabContent (既存のTimelineViewをラップ)
│   ├── ERDTabContent
│   └── DryRunTabContent
└── SidePanel (共通パネルコンポーネント)
    ├── EventLogPanel
    ├── ERDSidePanel (既存、変更なし)
    └── DryRunSqlPanel (既存、変更なし)
```

### 3.2 状態管理の分離

```
ConnectedView
  └── レイアウト状態のみ (tableListOpen, eventLogPosition)

TablesTabContent
  └── 状態なし (純粋な表示コンポーネント)

TimelineTabContent
  └── 内部状態のみ (viewMode, expandedGroups)

ERDTabContent
  └── hoveredTable 状態を内部管理

DryRunTabContent
  └── dryRunSql, isDryRunning, dryRunResult を内部管理
  └── useDryRun カスタムフックでロジック分離

EventLogPanel
  └── expandedEventIds 状態を内部管理
```

### 3.3 カスタムフックの導入

```typescript
// hooks/useDryRun.ts
export function useDryRun() {
  const [sql, setSql] = useState("");
  const [isRunning, setIsRunning] = useState(false);
  const [result, setResult] = useState<DryRunResult | null>(null);
  
  const run = async () => { /* ... */ };
  const getChangesForTable = (schema: string, table: string) => { /* ... */ };
  
  return { sql, setSql, isRunning, result, run, getChangesForTable };
}

// hooks/useEventLog.ts
export function useEventLog() {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const toggleExpanded = (id: string) => { /* ... */ };
  return { expandedIds, toggleExpanded };
}
```

---

## 実装手順

### Phase 1: 準備と共通コンポーネントの抽出

#### Step 1.1: EventLogHeader の分離
- **ファイル**: `src/components/EventLog/EventLogHeader.tsx`
- **内容**: インライン定義されている `EventLogHeader` を独立コンポーネントに
- **Props**: `events: TableChange[]`, `onClearEvents: () => void`

#### Step 1.2: EventLogPanel コンポーネントの作成
- **ファイル**: `src/components/EventLog/EventLogPanel.tsx`
- **内容**: EventLogHeader + EventLogContent を統合
- **Props**: `events`, `onClearEvents`, `isBottom?: boolean`
- **内部状態**: `expandedEventIds` を管理

#### Step 1.3: SidePanel 共通コンポーネントの作成
- **ファイル**: `src/components/SidePanel/SidePanel.tsx`
- **内容**: 右/ボトムパネルの共通ロジックを抽出
- **Props**: 
  ```typescript
  interface SidePanelProps {
    activeTab: TabType;
    eventLogPosition: EventLogPosition;
    // 各パネル用の props
    events?: TableChange[];
    onClearEvents?: () => void;
    erdHoveredTable?: ERDHoveredTable | null;
    dryRunProps?: DryRunPanelProps;
  }
  ```

### Phase 2: カスタムフックの作成

#### Step 2.1: useDryRun フックの作成
- **ファイル**: `src/hooks/useDryRun.ts`
- **内容**: Dry Run 関連の状態とロジックを分離
- **戻り値**: `{ sql, setSql, isRunning, result, run, getChangesForTable }`

#### Step 2.2: useEventLog フックの作成
- **ファイル**: `src/hooks/useEventLog.ts`
- **内容**: Event Log の expanded 状態管理
- **戻り値**: `{ expandedIds, toggleExpanded }`

### Phase 3: タブコンテンツコンポーネントの分離

#### Step 3.1: TablesTabContent の作成
- **ファイル**: `src/components/Views/TablesTabContent.tsx`
- **内容**: Tables タブのコンテンツを分離
- **Props**: 
  ```typescript
  interface TablesTabContentProps {
    watchedTables: string[];
    getWatchedTableData: (fullName: string) => WatchedTableData | undefined;
    onSelectTable: (schema: string, table: string) => void;
  }
  ```

#### Step 3.2: ERDTabContent の作成
- **ファイル**: `src/components/Views/ERDTabContent.tsx`
- **内容**: ERD タブのコンテンツを分離、hoveredTable 状態を内部管理
- **Props**: 
  ```typescript
  interface ERDTabContentProps {
    tables: TableInfo[];
    foreignKeys: ForeignKeyInfo[];
    watchedTables: string[];
    onHoveredTableChange?: (table: ERDHoveredTable | null) => void;
  }
  ```

#### Step 3.3: DryRunTabContent の作成
- **ファイル**: `src/components/Views/DryRunTabContent.tsx`
- **内容**: Dry Run タブのコンテンツを分離、useDryRun フックを使用
- **Props**: 
  ```typescript
  interface DryRunTabContentProps {
    watchedTables: string[];
    getWatchedTableData: (fullName: string) => WatchedTableData | undefined;
  }
  ```

#### Step 3.4: TimelineTabContent の作成
- **ファイル**: `src/components/Views/TimelineTabContent.tsx`
- **内容**: 既存の TimelineView をラップ（変更なし）

### Phase 4: ConnectedView のリファクタリング

#### Step 4.1: Props の整理
- **削除**: 未使用の props (`watchedTableData`, `selectedTableColumns`, etc.)
- **グループ化**: 関連する props をオブジェクトにまとめる可能性を検討

#### Step 4.2: レイアウト管理のみに責務を限定
- **役割**: レイアウト構造（TableListPanel, TabContentArea, SidePanel）の配置のみ
- **状態**: レイアウト関連の状態のみ管理

#### Step 4.3: TabContentArea コンポーネントの作成
- **ファイル**: `src/components/Views/TabContentArea.tsx`
- **内容**: タブコンテンツの切り替えロジックを分離
- **Props**: `activeTab`, 各タブコンテンツ用の props

---

## ファイル構造

### 4.1 新しいディレクトリ構造

```
src/
├── components/
│   ├── Views/
│   │   ├── ConnectedView.tsx (リファクタ後)
│   │   ├── TabContentArea.tsx (新規)
│   │   ├── TablesTabContent.tsx (新規)
│   │   ├── TimelineTabContent.tsx (新規)
│   │   ├── ERDTabContent.tsx (新規)
│   │   ├── DryRunTabContent.tsx (新規)
│   │   └── TimelineView.tsx (既存、変更なし)
│   ├── EventLog/
│   │   ├── EventLogHeader.tsx (新規)
│   │   ├── EventLogPanel.tsx (新規)
│   │   ├── EventLogContent.tsx (既存)
│   │   └── EventLogItem.tsx (既存)
│   ├── SidePanel/
│   │   └── SidePanel.tsx (新規)
│   ├── ERD/ (既存、変更なし)
│   ├── Tables/ (既存、変更なし)
│   └── DryRun/ (既存、変更なし)
├── hooks/
│   ├── useDryRun.ts (新規)
│   └── useEventLog.ts (新規)
└── types/
    └── index.ts (型定義の更新)
```

### 4.2 各ファイルの責務

| ファイル | 責務 | 行数目標 |
|---------|------|---------|
| `ConnectedView.tsx` | レイアウト管理のみ | < 80行 |
| `TabContentArea.tsx` | タブ切り替えロジック | < 60行 |
| `TablesTabContent.tsx` | Tables タブの表示 | < 50行 |
| `TimelineTabContent.tsx` | Timeline タブの表示 | < 30行 |
| `ERDTabContent.tsx` | ERD タブの表示 | < 40行 |
| `DryRunTabContent.tsx` | Dry Run タブの表示 | < 60行 |
| `EventLogPanel.tsx` | Event Log パネル | < 50行 |
| `SidePanel.tsx` | サイドパネルの共通ロジック | < 80行 |
| `useDryRun.ts` | Dry Run ロジック | < 100行 |
| `useEventLog.ts` | Event Log 状態管理 | < 40行 |

---

## 型定義の変更

### 5.1 ConnectedViewProps の簡素化

```typescript
// 変更前 (21個の props)
export interface ConnectedViewProps {
  activeTab: TabType;
  tables: TableInfo[];
  foreignKeys: ForeignKeyInfo[];
  watchedTables: string[];
  watchedTableData: Map<string, WatchedTableData>; // 削除
  events: TableChange[];
  tablesWithChanges: TableChangeInfo[];
  onRefreshTables: () => void;
  onStartWatch: (schema: string, table: string) => Promise<void>;
  onStopWatch: (schema: string, table: string) => Promise<void>;
  onSelectTable: (schema: string, table: string) => void;
  selectedTable?: { schema: string; table: string };
  selectedTableColumns: ColumnInfo[]; // 削除
  selectedTableRows: Record<string, unknown>[]; // 削除
  selectedTableRowCount: number; // 削除
  getChangesForTable: (schema: string, table: string) => TableChange[];
  getWatchedTableData: (fullName: string) => WatchedTableData | undefined;
  onClearEvents: () => void;
  layoutSettings: LayoutSettings;
  onStopAllWatch: () => void;
}

// 変更後 (14個の props)
export interface ConnectedViewProps {
  activeTab: TabType;
  layoutSettings: LayoutSettings;
  // Tables 関連
  tables: TableInfo[];
  watchedTables: string[];
  tablesWithChanges: TableChangeInfo[];
  getChangesForTable: (schema: string, table: string) => TableChange[];
  getWatchedTableData: (fullName: string) => WatchedTableData | undefined;
  onSelectTable: (schema: string, table: string) => void;
  selectedTable?: { schema: string; table: string };
  // Event Log 関連
  events: TableChange[];
  onClearEvents: () => void;
  // ERD 関連
  foreignKeys: ForeignKeyInfo[];
  // アクション
  onRefreshTables: () => void;
  onStartWatch: (schema: string, table: string) => Promise<void>;
  onStopWatch: (schema: string, table: string) => Promise<void>;
  onStopAllWatch: () => void;
}
```

### 5.2 新しい型定義

```typescript
// TabContentArea 用
export interface TabContentAreaProps {
  activeTab: TabType;
  tables: TableInfo[];
  foreignKeys: ForeignKeyInfo[];
  watchedTables: string[];
  events: TableChange[];
  tablesWithChanges: TableChangeInfo[];
  getChangesForTable: (schema: string, table: string) => TableChange[];
  getWatchedTableData: (fullName: string) => WatchedTableData | undefined;
  onSelectTable: (schema: string, table: string) => void;
  selectedTable?: { schema: string; table: string };
  onClearEvents: () => void;
}

// SidePanel 用
export interface SidePanelProps {
  activeTab: TabType;
  eventLogPosition: EventLogPosition;
  events: TableChange[];
  onClearEvents: () => void;
  erdHoveredTable?: ERDHoveredTable | null;
  dryRunSql?: string;
  setDryRunSql?: (sql: string) => void;
  isDryRunning?: boolean;
  dryRunResult?: DryRunResult | null;
  onDryRun?: () => void;
  getDryRunChangesForTable?: (schema: string, table: string) => DryRunChange[];
}

// EventLogPanel 用
export interface EventLogPanelProps {
  events: TableChange[];
  onClearEvents: () => void;
  isBottom?: boolean;
}

// EventLogHeader 用
export interface EventLogHeaderProps {
  eventCount: number;
  onClearEvents: () => void;
}
```

---

## 段階的移行計画

### Week 1: 準備フェーズ

#### Day 1-2: 共通コンポーネントの抽出
- [ ] `EventLogHeader` コンポーネントの作成
- [ ] `EventLogPanel` コンポーネントの作成
- [ ] 既存コードでの使用に置き換え
- [ ] テストの作成

#### Day 3-4: カスタムフックの作成
- [ ] `useDryRun` フックの作成
- [ ] `useEventLog` フックの作成
- [ ] 単体テストの作成

### Week 2: タブコンテンツの分離

#### Day 1-2: TablesTabContent
- [ ] `TablesTabContent` コンポーネントの作成
- [ ] `ConnectedView` からの切り出し
- [ ] テストの作成

#### Day 3-4: ERDTabContent & DryRunTabContent
- [ ] `ERDTabContent` コンポーネントの作成
- [ ] `DryRunTabContent` コンポーネントの作成（useDryRun 使用）
- [ ] テストの作成

### Week 3: 統合とリファクタリング

#### Day 1-2: SidePanel の作成
- [ ] `SidePanel` 共通コンポーネントの作成
- [ ] 右/ボトムパネルの重複ロジックを統合
- [ ] テストの作成

#### Day 3-4: ConnectedView のリファクタリング
- [ ] Props の整理（未使用の削除）
- [ ] `TabContentArea` コンポーネントの作成
- [ ] `ConnectedView` をレイアウト管理のみに限定
- [ ] 統合テストの作成

### Week 4: テストと最適化

#### Day 1-2: テストカバレッジの向上
- [ ] 各コンポーネントの単体テスト
- [ ] 統合テストの追加
- [ ] カバレッジレポートの確認

#### Day 3-4: コードレビューと最適化
- [ ] コードレビュー
- [ ] パフォーマンスの確認
- [ ] ドキュメントの更新

---

## リスクと対策

### リスク 1: 既存機能の破壊
- **対策**: 
  - 段階的な移行
  - 各フェーズでのテスト
  - 既存のテストスイートの維持

### リスク 2: Props の変更による影響範囲
- **対策**: 
  - 型定義の段階的な変更
  - 後方互換性の維持（一時的に）
  - 影響範囲の事前確認

### リスク 3: 状態管理の複雑化
- **対策**: 
  - カスタムフックによる状態管理の統一
  - 明確な責務の分離
  - ドキュメントの整備

---

## 成功基準

### コード品質
- [ ] 各コンポーネントが100行以下
- [ ] Props の数が10個以下
- [ ] コードの重複率が5%以下
- [ ] TypeScript の型エラーなし
- [ ] ESLint エラーなし

### 機能性
- [ ] 既存の機能がすべて動作
- [ ] パフォーマンスの劣化なし
- [ ] UI/UX の変更なし

### テスタビリティ
- [ ] 単体テストのカバレッジが80%以上
- [ ] 各コンポーネントが独立してテスト可能

### 保守性
- [ ] コードレビューが容易
- [ ] 新機能の追加が容易
- [ ] バグの修正が容易

---

## 参考資料

### 関連ファイル
- `src/components/Views/ConnectedView.tsx` (現行)
- `src/types/index.ts` (型定義)
- `src/App.tsx` (使用箇所)

### 設計原則
- Single Responsibility Principle (単一責任原則)
- Separation of Concerns (関心の分離)
- DRY (Don't Repeat Yourself)
- Composition over Inheritance (継承より合成)

---

## 更新履歴

- 2024-XX-XX: 初版作成

