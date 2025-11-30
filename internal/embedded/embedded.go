// Package embedded はビルド時にデータファイルを実行ファイルに埋め込みます。
// Requirement 21: 拡張性 - デフォルトデータの埋め込みと外部ファイルによる上書き
package embedded

import "embed"

// Data は data/ ディレクトリ配下の全ファイルを埋め込みます。
// 実際のファイルはビルド前に internal/embedded/data/ にコピーされます。
//
//go:embed data/*
var Data embed.FS
