import { Display } from './Display';
import { yellow, cyan } from './colors';

export interface ListItem {
  name: string;
  value: any;
  disabled?: boolean;
}

export interface ScrollableListOptions {
  message?: string;
  pageSize?: number;
  loop?: boolean;
  onSelectionChange?: (item: ListItem) => void;
}

export class ScrollableList {
  private items: ListItem[];
  private options: ScrollableListOptions;
  private selectedIndex: number = 0;
  private scrollOffset: number = 0;
  private originalRawMode: boolean = false;

  constructor(items: ListItem[], options: ScrollableListOptions = {}) {
    this.items = items;
    this.options = {
      message: options.message || 'Select an item:',
      pageSize: options.pageSize || 10,
      loop: options.loop !== false,
      onSelectionChange: options.onSelectionChange,
    };
    this.updateScrollOffset();
  }

  public render(): void {
    Display.clear();

    if (this.options.message) {
      Display.printInfo(this.options.message);
      Display.newLine();
    }

    if (this.items.length === 0) {
      Display.printInfo('No items available');
      Display.newLine();
      return;
    }

    this.renderItems();
    Display.newLine();

    // 選択中アイテムの詳細情報を表示
    if (this.options.onSelectionChange && this.selectedIndex < this.items.length) {
      this.options.onSelectionChange(this.items[this.selectedIndex]);
    }

    Display.printInfo('Use ↑/↓ to navigate, Enter to select, q to cancel');
  }

  private renderItems(): void {
    const maxVisible = this.options.pageSize || 10;
    const startIndex = this.scrollOffset;
    const endIndex = Math.min(startIndex + maxVisible, this.items.length);

    for (let i = startIndex; i < endIndex; i++) {
      const item = this.items[i];
      const isSelected = i === this.selectedIndex;
      const marker = isSelected ? '→' : ' ';

      let displayText = `${marker} ${item.name}`;

      if (item.disabled) {
        displayText = `${displayText} (disabled)`;
      }

      if (isSelected) {
        displayText = yellow(displayText);
      } else if (item.disabled) {
        displayText = cyan(displayText);
      }

      Display.println(displayText);
    }

    // スクロールインジケーター
    if (this.items.length > maxVisible) {
      const totalPages = Math.ceil(this.items.length / maxVisible);
      const currentPage = Math.floor(this.selectedIndex / maxVisible) + 1;
      Display.newLine();
      Display.printInfo(`Page ${currentPage}/${totalPages} (${this.items.length} items total)`);
    }
  }

  public moveUp(): boolean {
    if (this.selectedIndex > 0) {
      this.selectedIndex--;
      this.updateScrollOffset();
      return true;
    } else if (this.options.loop && this.items.length > 0) {
      this.selectedIndex = this.items.length - 1;
      this.updateScrollOffset();
      return true;
    }
    return false;
  }

  public moveDown(): boolean {
    if (this.selectedIndex < this.items.length - 1) {
      this.selectedIndex++;
      this.updateScrollOffset();
      return true;
    } else if (this.options.loop && this.items.length > 0) {
      this.selectedIndex = 0;
      this.updateScrollOffset();
      return true;
    }
    return false;
  }

  public getSelectedItem(): ListItem | null {
    if (this.items.length === 0 || this.selectedIndex >= this.items.length) {
      return null;
    }
    return this.items[this.selectedIndex];
  }

  public getSelectedIndex(): number {
    return this.selectedIndex;
  }

  public isEmpty(): boolean {
    return this.items.length === 0;
  }

  public canSelect(): boolean {
    const selected = this.getSelectedItem();
    return selected !== null && !selected.disabled;
  }

  private updateScrollOffset(): void {
    const maxVisible = this.options.pageSize || 10;
    const currentPage = Math.floor(this.selectedIndex / maxVisible);
    this.scrollOffset = currentPage * maxVisible;
  }

  public async waitForSelection(): Promise<any | null> {
    if (this.items.length === 0) {
      Display.printInfo('No items available');
      return null;
    }

    return new Promise(resolve => {
      this.render();

      const handleKeypress = (data: Buffer) => {
        this.handleKeyInput(data, handleKeypress, resolve);
      };

      // 現在のrawMode状態を保存
      this.originalRawMode = process.stdin.isRaw || false;
      process.stdin.setRawMode(true);
      process.stdin.resume();
      process.stdin.on('data', handleKeypress);
    });
  }

  private handleKeyInput(
    data: Buffer,
    handler: (data: Buffer) => void,
    resolve: (value: any) => void
  ): void {
    const key = data.toString();

    if (this.handleNavigationKeys(key)) {
      return;
    }

    if (this.handleSelectionKeys(key, handler, resolve)) {
      return;
    }

    // 無効なキーは無視
  }

  private handleNavigationKeys(key: string): boolean {
    switch (key) {
      case '\u001b[A': // Arrow up
      case 'k':
        if (this.moveUp()) {
          this.render();
        }
        return true;
      case '\u001b[B': // Arrow down
      case 'j':
        if (this.moveDown()) {
          this.render();
        }
        return true;
      default:
        return false;
    }
  }

  private handleSelectionKeys(
    key: string,
    handler: (data: Buffer) => void,
    resolve: (value: any) => void
  ): boolean {
    switch (key) {
      case '\r':
      case '\n': // Enter
        if (this.canSelect()) {
          this.cleanup(handler, resolve, this.getSelectedItem()?.value);
        }
        return true;
      case 'q':
      case '\u001b': // Escape
        this.cleanup(handler, resolve, null);
        return true;
      default:
        return false;
    }
  }

  private cleanup(
    handler: (data: Buffer) => void,
    resolve: (value: any) => void,
    value: any
  ): void {
    // 元のrawMode状態を復元
    process.stdin.setRawMode(this.originalRawMode);
    process.stdin.removeListener('data', handler);

    // readlineが管理している場合は、pauseしない
    if (!this.originalRawMode) {
      process.stdin.pause();
    }

    resolve(value);
  }

  public static async showList(
    items: ListItem[],
    options: ScrollableListOptions = {}
  ): Promise<any | null> {
    const list = new ScrollableList(items, options);
    return await list.waitForSelection();
  }
}
