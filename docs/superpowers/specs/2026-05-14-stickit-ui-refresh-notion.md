# Stickit UI Refresh — Notion ハイブリッド方向

- 作成日: 2026-05-14
- 旧設計: `2026-05-13-stickit-design.md`（テック系・廃止）
- リファレンス: `docs/design/notion-reference.md`（getdesign.md/notion 由来の Notion 公式風 design tokens）

## 1. 目的・背景

Plan 1 / 2 は Linear/Vercel 系のテックスタイルで実装した。本番運用感がしっくりこない（冷たい・無機質、`//` や `P0` 等の表記がスタッフフレンドリーでない、ゴルフ場業務とのトーン不一致）ため、**Notion の Design System を全面採用したハイブリッド方向**へ刷新する。

機能要件は既存スペックを維持。視覚層と一部の表現のみ刷新。

## 2. 方向性: Notion ハイブリッド

カレンダーは Notion Calendar 風、付箋ボードは Notion のギャラリービュー風、リストは Notion のテーブルビュー風。**全ビューが Notion の確立された表現で統一**される。

主軸はカレンダー（NKが最も長く見る画面）。

## 3. デザイントークン

### 配色

| 用途 | 値 |
|---|---|
| Canvas（メイン背景） | `#FFFFFF` |
| Surface（サイドバー・サブ面） | `#F6F5F4` |
| Surface soft（カード背景） | `#FAFAF9` |
| Hairline（区切り線） | `#E5E3DF` |
| Hairline soft | `#EDE9E4` |
| Hairline strong | `#C8C4BE` |
| Charcoal（テキスト主色） | `#37352F` |
| Slate（セカンダリテキスト） | `#5D5B54` |
| Steel（ターシャリ） | `#787671` |
| Stone（ミュート） | `#A4A097` |
| Muted（極ミュート） | `#BBB8B1` |
| Primary（アクセント紫） | `#5645D4` |
| Primary pressed | `#4534B3` |
| Link blue | `#0075DE` |
| Semantic success | `#1AAE39` |
| Semantic warning | `#DD5B00` |
| Semantic error | `#E03131` |

### カードティント（プロジェクト色・付箋背景）

`#FFE8D4` peach / `#FDE0EC` rose / `#D9F3E1` mint / `#E6E0F5` lavender / `#DCECFA` sky / `#FEF7D6` yellow / `#F8F5E8` cream / `#F0EEEC` gray

### 書体

- **Latin**: Inter（Notion Sans 相当）— 16px ベース、ウェイト 400/500/600
- **日本語**: Noto Sans JP — Inter と並列で破綻なし
- 装飾用 mono は廃止（旧テック演出 `//` `P0` `CC-001` などの装飾ラベル全て廃止）

### サイズ階層

| 名前 | サイズ | ウェイト | line-height |
|---|---|---|---|
| Hero display | 80px | 600 | 1.05 |
| Display lg | 56px | 600 | 1.10 |
| Heading 1 | 48px | 600 | 1.15 |
| Heading 2 | 36px | 600 | 1.20 |
| Heading 3 | 28px | 600 | 1.25 |
| Heading 4 | 22px | 600 | 1.30 |
| Heading 5 | 18px | 600 | 1.40 |
| Subtitle | 18px | 400 | 1.50 |
| Body | 16px | 400 | 1.55 |
| Body sm | 14px | 400 | 1.50 |
| Caption | 13px | 400 | 1.40 |
| Micro | 12px | 500 | 1.40 |
| Button | 14px | 500 | 1.30 |

### 余白スケール

`4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 96 / 120` (px)

### 角丸

`xs:4 / sm:6 / md:8 / lg:12 / xl:16 / xxl:20 / xxxl:24 / full:9999`（px）

### コンポーネント基本

- **影は基本使わない**（カードはヘアラインで分節）
- **ボーダー**: 1px solid Hairline
- **カードpadding**: spacing.xl (24px) または xxl (32px)
- **ボタン主**: Primary 紫背景 + 角丸 md(8px) + padding 10px 18px
- **ボタン副**: Canvas 背景 + Hairline strong border + 角丸 md
- **ボタン dark**: ink-deep 背景 + 白文字
- **入力**: Canvas 背景 + Hairline border + 角丸 md + padding 8-10px

## 4. 主要画面の方向性

### 4.1 カレンダー（メイン）

Notion Calendar の質感を踏襲:
- 純白キャンバス、極細ヘアライン
- 月ビュー: 6週固定（既存維持）、当月セルは Charcoal、他月セルは Stone でミュート、今日は紫丸
- 週ビュー: 07:00-22:00、**Now-line は紫(#5645D4)の細線**（旧緑から変更）
- 日ビュー: シンプルなタイムライン
- イベント表示: プロジェクト色のパステルpill（カードティント8色のいずれか）、文字は Charcoal
- ツールバー: 左 ‹ today › + 期間ラベル + 右に view セグメント

### 4.2 今日 / 明日 / 7日間 / すべて

Notion テーブルビュー風:
- 行ごとにヘアライン区切り（背景は Canvas）
- 左にチェックボックス（角丸 sm、未完了は Hairline strong border）
- タイトル: Body 16px Charcoal
- メタ: 右寄せに小さいタグpill（プロジェクト色 + 期限時刻 + タグ）
- グルーピング `朝/午後/夜` は廃止、時刻順フラット

### 4.3 付箋ボード

Notion ギャラリービュー風:
- カード幅可変 grid（minmax 260px）
- カード: Surface soft 背景、Hairline border、角丸 lg、padding xl
- カード上部に **薄いプロジェクト色帯（高さ 48px）** を Notion カバーアートのように敷く
- タイトル: Heading 5 (18px) Charcoal
- 本文抜粋: Body sm Slate
- 完了済はカード全体に opacity .5

### 4.4 設定

Notion 設定画面風:
- 縦タブまたは横タブ
- 各セクション: 行レイアウト（左ラベル / 右コントロール）
- プロジェクト色選択: Notion のカードティント8色から

### 4.5 ログイン

- 純白 Canvas + 中央カード
- カード: Hairline border、Heading 2 で「Stickit にサインイン」
- Google ボタンは既存維持、サイズを Notion 流に整える
- 「稼働中」パルスは紫(#5645D4)に変更

### 4.6 サイドバー

- 幅 240px、Surface(#F6F5F4) 背景
- 上部: ロゴ + 検索（mono装飾廃止、シンプルな「Search...」）
- ナビ: 行高 36px、Body sm、Stone アイコン
  - アクティブ: 薄い紫背景（#5645D4 14% alpha）+ Charcoal テキスト（Notion 流に背景塗りのみで左バーなし）
- セクションラベル: 大文字 Caption、Steel
- プロジェクト一覧: 各行に色ドット + 名称
- アバター: 下部、円形、Slate

## 5. 廃止する旧テック演出

- ❌ `//` セクションマーカー → 大文字 Caption ラベルへ置換
- ❌ `P0` `P1` `P2` バッジ → Notion風の小さい色pill「高/中/低」へ置換
- ❌ `CC-001` 風 ID 表記 → 削除
- ❌ `⌘K` キーボードバッジ → 検索バー右側に控えめに残す（廃止しない）
- ❌ 緑のパルスドット → 紫アクセントへ
- ❌ Geist + Geist Mono + IBM Plex Sans JP → Inter + Noto Sans JP

## 6. 実装スコープ

- `tailwind.config.ts` 全面置換（新カラー・新書体・新間隔）
- `src/styles/globals.css` 更新（フォント import、body 設定）
- `index.html` Google Fonts import 差替（Inter + Noto Sans JP）
- 全 UI コンポーネント（Sidebar/TaskItem/TaskList/TaskForm/Modal/Calendar 3 view/Sticky 2 file/Settings/Login/AuthCallback/Popout）の className リライト
- モック5画面の作り直し（Login / Today / Calendar Week / Calendar Month / Sticky Board）

## 7. 検証

- 旧テック関連の文字（`//`, `P0`, mono装飾）が全て消えていること
- Inter + Noto Sans JP が読み込まれていること
- 配色が Notion トークンと一致していること
- カレンダー週ビューがゴルフ場の業務情報を読みやすく表示すること

## 8. 出さないもの（旧仕様維持）

- DB スキーマ
- ルーティング構造
- データフロー / API
- 認証方式（Google OAuth）
- PWA / GitHub Pages デプロイ構成

## 9. やらかし回避

- フォント import URL の typo
- Tailwind config の旧トークン残骸
- ハードコード hex 値の置き忘れ
- 旧モック (`mocks/preview-tech-*.html`) は参照しない（混乱防止）— 削除はせず、新モック作成後に古いものは別ディレクトリへ退避
