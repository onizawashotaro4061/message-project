// ユーザーの型を定義します
export type Recipient = {
  id: string; // URLやDBで使うための一意のID (例: 'taro-yamada')
  name: string; // 表示名 (例: '山田 太郎')
  department: string; // 部署名 (例: '営業部')
};

// 送信先ユーザーのリストを定義します
export const RECIPIENTS: Recipient[] = [
  { id: 'taro-yamada', name: '山田 太郎', department: '営業部' },
  { id: 'hanako-tanaka', name: '田中 花子', department: '企画部' },
  { id: 'jiro-sato', name: '佐藤 次郎', department: '開発部' },
  { id: 'misaki-watanabe', name: '渡辺 美咲', department: '開発部' },
  // ここに他のメンバーを追加していきます
];