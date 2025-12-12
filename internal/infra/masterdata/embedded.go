package masterdata

import "embed"

// EmbeddedData は data/ ディレクトリ配下の全ファイルを埋め込みます。
// Requirement 21: 拡張性 - デフォルトデータの埋め込みと外部ファイルによる上書き
//
//go:embed data/*
var EmbeddedData embed.FS
