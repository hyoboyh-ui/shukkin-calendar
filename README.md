# 出勤カレンダー

毎月16日始まり・翌月15日終わりの出勤表と運収（売上）を記録するスマホ向けPWAアプリ。

- 出勤 / 休日 / 有給休暇 の記録（シングルタップ・ダブルタップ）
- 休日の間隔から「4勤」などの連勤日数を自動表示
- 日ごとの運収入力、期間合計・税引き額の自動計算
- 運収に応じた応援メッセージ（関西弁）
- 過去期間の閲覧、集計グラフ（運収推移・出勤内訳）
- データはブラウザ内（localStorage）に保存、JSONファイルでバックアップ/復元
- ホーム画面に追加できるPWA対応

## 開発

```bash
npm install
npm run dev
```

## ビルド

```bash
npm run build
```

## GitHub Pagesへのデプロイ

このリポジトリには `.github/workflows/deploy.yml` を用意済みです。`main` ブランチにpushすると自動でビルド・公開されます。

1. GitHubでこのリポジトリを作成し、コードをpush
2. リポジトリの Settings → Pages → Source を **GitHub Actions** に設定
3. `main` へのpushで自動デプロイ

**リポジトリ名を `shukkin-calendar` 以外にする場合**は、[`vite.config.ts`](vite.config.ts) の `base` と `manifest.start_url` / `manifest.scope` をリポジトリ名に合わせて書き換えてください（例: `/your-repo-name/`）。

## アイコンの再生成

配色やデザインを変更した場合は、以下でPWAアイコンを再生成できます。

```bash
node scripts/generate-icons.mjs
```
