# TypEngQuest Makefile
# Requirement 21: 拡張性 - データファイル埋め込みビルド

.PHONY: build build-release clean test run help

# デフォルトターゲット
all: build

# 開発用ビルド
build:
	@echo "Building TypEngQuest..."
	go build -o TypEngQuest ./cmd/TypEngQuest

# リリース用ビルド（最適化あり）
build-release:
	@echo "Building TypEngQuest (release)..."
	go build -ldflags="-s -w" -o TypEngQuest ./cmd/TypEngQuest

# テスト実行
test:
	@echo "Running tests..."
	go test ./...

# テスト実行（詳細出力）
test-verbose:
	@echo "Running tests (verbose)..."
	go test -v ./...

# アプリケーション実行（埋め込みデータ使用）
run: build
	@echo "Running TypEngQuest..."
	./TypEngQuest

# クリーンアップ
clean:
	@echo "Cleaning up..."
	@rm -f TypEngQuest

# ヘルプ
help:
	@echo "TypEngQuest Makefile"
	@echo ""
	@echo "Available targets:"
	@echo "  build          - Build the application"
	@echo "  build-release  - Build with optimizations"
	@echo "  test           - Run all tests"
	@echo "  test-verbose   - Run tests with verbose output"
	@echo "  run            - Build and run with embedded data"
	@echo "  clean          - Remove build artifacts"
	@echo "  help           - Show this help message"
	@echo ""
	@echo "To use external data:"
	@echo "  ./TypEngQuest -data /path/to/custom_data"
