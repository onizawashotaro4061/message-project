# CLAUDE.md

このファイルは、Claude Code (claude.ai/code) がこのリポジトリで作業する際のガイダンスを提供します。

## プロジェクト概要

第141回明大祭向けに構築された**寄せ書き (Yosegaki)** メッセージカードアプリケーションです。ユーザーはカスタムデザイン、アバター、所属専用テーマを使用して装飾されたメッセージカードを送受信できます。

**技術スタック:**
- Next.js 15.5.4 with App Router (TypeScript)
- React 19.1.0
- Supabase (認証、データベース、ストレージ)
- TailwindCSS 4.0 (with Turbopack)
- PDF生成 (html2canvas, html2pdf.js, jspdf)

## 開発コマンド

### 開発サーバーの起動
```bash
npm run dev
```
Turbopackを有効にしてNext.jsを http://localhost:3000 で実行

### 本番ビルド
```bash
npm run build
```
Turbopackを使用して最適化された本番ビルドを作成

### 本番サーバーの起動
```bash
npm start
```

### リンターの実行
```bash
npm run lint
```
ESLint 9を実行してコードの問題をチェック

## アーキテクチャ

### 認証フロー
- `@supabase/auth-helpers-nextjs`を使用したSupabase認証
- `src/lib/supabase.ts`から`createClientComponentClient()`を使用するクライアントコンポーネントパターン
- 管理者が`/api/create-users`エンドポイント経由でアカウントを作成（管理者パスワード必須: `admin123`）
- ユーザーは初期パスワード（役員は`meiji2024`、その他は`Meidaisai141`）を受け取り、`/change-password`で変更が必要

### データベース構造

**Supabaseテーブル:**
- `messages`テーブルにすべてのメッセージデータを保存
  - フィールド: `id`, `sender_id`, `recipient_id`, `sender_name`, `sender_avatar_url`, `sender_department`, `message`, `card_style`, `card_shape`, `image_url`, `created_at`
  - RLSポリシー: ユーザーは送信または受信したメッセージを閲覧可能。ユーザーは自分が送信したメッセージのみ編集・削除可能

**Supabaseストレージ:**
- `avatars`バケット（公開）をユーザープロフィール画像用に使用
  - browser-image-compressionライブラリにより画像を200KB、512×512pxに自動圧縮

### 主要なアプリケーションパターン

**カードスタイルシステム (`src/lib/supabase.ts:40-189`):**
- `CARD_STYLES`配列が利用可能なすべてのカードデザインを定義
- 3種類のカード:
  1. 共通カード（3つのテーマカラー: 焔紅/enkou, 蒼炎/souen, 軌光/kikou）
  2. 背景画像カード（明大祭ロゴ, 手紙）
  3. 所属専用カード（`departments`配列でフィルタリング）
  4. 役職専用カード（`roles`配列でフィルタリング: executive, vice_director, section_chief）
- カードはユーザーの`department`と`role`メタデータに基づいてフィルタリング

**ユーザーメタデータ構造:**
```typescript
user_metadata: {
  display_name: string    // ユーザーの表示名
  department: string      // 10の所属のいずれか（執行部、運営局など）
  role?: string          // オプション: 'executive' | 'vice_director' | 'section_chief'
  avatar_url?: string    // Supabaseストレージ内のアバターURL
}
```

**所属の並び順:**
所属は`DEPARTMENT_ORDER`配列で定義された固定順序で表示されます:
1. 執行部, 2. 運営局, 3. 演出局, 4. 開発局, 5. 広報局, 6. 財務局, 7. 参加団体局, 8. 渉外局, 9. 制作局, 10. 総務局

### ページ構造

**公開ページ:**
- `/` - アプリ紹介のランディングページ
- `/login` - ユーザーログイン
- `/signup` - アバターアップロード付き新規ユーザー登録

**保護されたページ（認証が必要）:**
- `/messages` - 受信メッセージの表示（メイソンリーレイアウト）
- `/send` - カードスタイル選択付き新規メッセージ送信
- `/sent` - 送信済みメッセージの表示・編集・削除
- `/profile` - 表示名とアバターの編集
- `/change-password` - パスワード変更（初回ログイン後必須）

**管理者ページ:**
- `/admin` - 一括ユーザー作成用の管理者ダッシュボード

**APIルート:**
- `/api/create-users` - 役員アカウントの一括作成（管理者パスワードで保護）
- `/api/create-vice-directors` - 副局長アカウントの作成
- `/api/create-section-chiefs` - 部門長アカウントの作成
- `/api/get-users` - 送信先選択用の全ユーザー取得
- `/api/get-user-by-id` - 特定のユーザーデータ取得（メッセージの送信者情報取得に使用）

### 重要な実装詳細

**画像処理:**
- アバターアップロードは`browser-image-compression`を使用して200KB以下を保証
- 目標解像度: 512×512px
- 画像は公開アクセス可能なSupabase `avatars`バケットに保存
- ファイル命名パターン: `{userId}-{timestamp}.jpg`

**メッセージ表示:**
- メッセージページはCSSカラムレイアウト（`columns-1 md:columns-2 lg:columns-3`）をメイソンリー効果に使用
- カード背景はグラデーションと背景画像の両方をサポート
- 背景画像カードは異なるレンダリングロジックを持つ（`MessageCardPreview`と`MessageCard`コンポーネントを参照）

**スタイリングアプローチ:**
- Tailwindユーティリティクラスを広範囲に使用
- 明大祭テーマのカスタムカラー値: `#B5364A`（焔紅）、`#3571B8`（蒼炎）、`#D8CE48`（軌光）
- フォント: `next/font/google`からGeist SansとGeist Mono

## 必要な環境変数

```
NEXT_PUBLIC_SUPABASE_URL=<your-supabase-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<your-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<your-service-role-key>
```

`.env.local`に保存（gitignore済み）

## よくあるワークフロー

**新しいカードスタイルの追加:**
1. `src/lib/supabase.ts`の`CARD_STYLES`配列に新しいエントリを追加
2. 利用可能性を制限するために`departments`または`roles`配列を含める
3. 背景画像の場合、`hasBackgroundImage: true`を設定し、`backgroundImage` URLを提供

**新しいユーザー役職の作成:**
1. `src/app/api/create-{role}/route.ts`に役職専用のAPIルートを追加
2. `/send`ページのフィルタリングロジックを更新して新しい役職を含める
3. 必要に応じて`CARD_STYLES`に役職専用カードを追加

**メッセージフィールドの変更:**
1. `src/lib/supabase.ts`の`Message`型を更新
2. `/send`と`/messages`ページのinsert/selectクエリを更新
3. Supabaseダッシュボードでデータベーススキーマを更新
