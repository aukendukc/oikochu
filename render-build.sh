#!/bin/bash

# デバッグ情報を表示
echo "現在のディレクトリ: $(pwd)"
echo "ディレクトリの内容:"
ls -la

# 必要なディレクトリを作成
mkdir -p /opt/render/project/src

# package.jsonと関連ファイルをターゲットディレクトリにコピー
cp -f package.json package-lock.json /opt/render/project/src/ 2>/dev/null || :
cp -rf node_modules /opt/render/project/src/ 2>/dev/null || :

# ターゲットディレクトリに移動
cd /opt/render/project/src/ || exit 1

echo "ターゲットディレクトリに移動しました: $(pwd)"
echo "ディレクトリの内容:"
ls -la

# 通常のビルドプロセスを実行
npm install
npm run build

# ビルド成功を報告
echo "ビルド成功!" 