export type Direction = 'horizontal' | 'vertical' | 'diagonal-forward' | 'diagonal-backward';

export interface WordPosition {
  word: string;
  startRow: number;
  startCol: number;
  direction: Direction;
  positions: Array<{ row: number; col: number }>;
}

export class WordSearchGame {
  private grid: string[][];
  private size: number;
  private words: string[];
  private wordPositions: WordPosition[] = [];
  private foundWords: Set<string> = new Set();

  constructor(words: string[], size: number = 10) {
    this.size = size;
    this.words = words.map(w => w.toUpperCase());
    this.grid = this.generateGrid();
  }

  getGrid(): string[][] {
    return this.grid;
  }

  getWordPositions(): WordPosition[] {
    return this.wordPositions;
  }

  isWordFound(word: string): boolean {
    return this.foundWords.has(word.toUpperCase());
  }

  markWordAsFound(word: string): void {
    this.foundWords.add(word.toUpperCase());
  }

  getFoundWords(): string[] {
    return Array.from(this.foundWords);
  }

  getAllWords(): string[] {
    return this.words;
  }

  private generateGrid(): string[][] {
    // Initialize empty grid
    const grid: string[][] = Array(this.size)
      .fill(null)
      .map(() => Array(this.size).fill(''));

    // Try to place each word
    for (const word of this.words) {
      this.placeWord(word, grid);
    }

    // Fill remaining cells with random letters
    this.fillRandomLetters(grid);

    return grid;
  }

  private placeWord(word: string, grid: string[][]): boolean {
    const maxAttempts = 100;
    let attempts = 0;

    while (attempts < maxAttempts) {
      const direction = this.getRandomDirection();
      const { row, col } = this.getRandomPosition(direction, word.length);

      if (this.canPlaceWord(word, row, col, direction, grid)) {
        const positions = this.insertWord(word, row, col, direction, grid);
        this.wordPositions.push({
          word,
          startRow: row,
          startCol: col,
          direction,
          positions,
        });
        return true;
      }

      attempts++;
    }

    // If placement failed, try placing backwards
    const reversedWord = word.split('').reverse().join('');
    const direction = this.getRandomDirection();
    const { row, col } = this.getRandomPosition(direction, reversedWord.length);

    if (this.canPlaceWord(reversedWord, row, col, direction, grid)) {
      const positions = this.insertWord(reversedWord, row, col, direction, grid);
      this.wordPositions.push({
        word,
        startRow: row,
        startCol: col,
        direction,
        positions,
      });
      return true;
    }

    return false;
  }

  private getRandomDirection(): Direction {
    const directions: Direction[] = [
      'horizontal',
      'vertical',
      'diagonal-forward',
      'diagonal-backward',
    ];
    return directions[Math.floor(Math.random() * directions.length)];
  }

  private getRandomPosition(
    direction: Direction,
    wordLength: number
  ): { row: number; col: number } {
    let row: number, col: number;

    switch (direction) {
      case 'horizontal':
        row = Math.floor(Math.random() * this.size);
        col = Math.floor(Math.random() * (this.size - wordLength + 1));
        break;
      case 'vertical':
        row = Math.floor(Math.random() * (this.size - wordLength + 1));
        col = Math.floor(Math.random() * this.size);
        break;
      case 'diagonal-forward':
        row = Math.floor(Math.random() * (this.size - wordLength + 1));
        col = Math.floor(Math.random() * (this.size - wordLength + 1));
        break;
      case 'diagonal-backward':
        row = Math.floor(Math.random() * (this.size - wordLength + 1));
        col =
          wordLength -
          1 +
          Math.floor(Math.random() * (this.size - wordLength + 1));
        break;
    }

    return { row, col };
  }

  private canPlaceWord(
    word: string,
    row: number,
    col: number,
    direction: Direction,
    grid: string[][]
  ): boolean {
    for (let i = 0; i < word.length; i++) {
      const { r, c } = this.getNextPosition(row, col, direction, i);
      const existingLetter = grid[r][c];

      // Can place if cell is empty or has the same letter
      if (existingLetter !== '' && existingLetter !== word[i]) {
        return false;
      }
    }
    return true;
  }

  private insertWord(
    word: string,
    row: number,
    col: number,
    direction: Direction,
    grid: string[][]
  ): Array<{ row: number; col: number }> {
    const positions: Array<{ row: number; col: number }> = [];

    for (let i = 0; i < word.length; i++) {
      const { r, c } = this.getNextPosition(row, col, direction, i);
      grid[r][c] = word[i];
      positions.push({ row: r, col: c });
    }

    return positions;
  }

  private getNextPosition(
    startRow: number,
    startCol: number,
    direction: Direction,
    offset: number
  ): { r: number; c: number } {
    switch (direction) {
      case 'horizontal':
        return { r: startRow, c: startCol + offset };
      case 'vertical':
        return { r: startRow + offset, c: startCol };
      case 'diagonal-forward':
        return { r: startRow + offset, c: startCol + offset };
      case 'diagonal-backward':
        return { r: startRow + offset, c: startCol - offset };
    }
  }

  private fillRandomLetters(grid: string[][]): void {
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';

    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (grid[row][col] === '') {
          grid[row][col] = letters[Math.floor(Math.random() * letters.length)];
        }
      }
    }
  }

  // Check if a selection matches a word
  checkSelection(selectedCells: Array<{ row: number; col: number }>): string | null {
    if (selectedCells.length < 2) {
      console.log('checkSelection: Selection too short');
      return null;
    }

    console.log('checkSelection: Checking', selectedCells.length, 'cells');
    console.log('checkSelection: Available words:', this.words);
    console.log('checkSelection: Word positions:', this.wordPositions.map(wp => ({
      word: wp.word,
      positions: wp.positions
    })));

    // Create a set of selected position keys for quick lookup
    const selectedSet = new Set(
      selectedCells.map(cell => `${cell.row}-${cell.col}`)
    );

    console.log('checkSelection: Selected position set:', Array.from(selectedSet));

    // Check against all word positions
    for (const wordPos of this.wordPositions) {
      if (this.isWordFound(wordPos.word)) {
        console.log('checkSelection: Word', wordPos.word, 'already found, skipping');
        continue;
      }

      // Check if all positions in word are selected and count matches
      const wordPosSet = new Set(
        wordPos.positions.map(cell => `${cell.row}-${cell.col}`)
      );

      console.log('checkSelection: Checking word', wordPos.word);
      console.log('checkSelection: Word position set:', Array.from(wordPosSet));
      console.log('checkSelection: Size match?', wordPosSet.size === selectedSet.size);

      // Check if sets match (all word positions are in selected, and sizes match)
      if (wordPosSet.size !== selectedSet.size) continue;

      let allPositionsMatch = true;
      for (const key of wordPosSet) {
        if (!selectedSet.has(key)) {
          allPositionsMatch = false;
          break;
        }
      }

      console.log('checkSelection: Positions match?', allPositionsMatch);

      if (!allPositionsMatch) continue;

      // Positions match! Now check if the letters form the word
      // Get letters in the order they appear in the grid (word's natural order)
      const wordLetters = wordPos.positions
        .map(({ row, col }) => this.grid[row][col])
        .join('');
      const reversedWordLetters = wordLetters.split('').reverse().join('');

      // Get letters from selected cells in the order selected
      const selectedWord = selectedCells
        .map(({ row, col }) => this.grid[row][col])
        .join('');
      const reversedSelectedWord = selectedWord.split('').reverse().join('');

      console.log('checkSelection: Word letters (grid order):', wordLetters);
      console.log('checkSelection: Selected letters:', selectedWord);
      console.log('checkSelection: Reversed selected:', reversedSelectedWord);

      // Check if the word matches in any direction
      if (
        selectedWord === wordLetters ||
        selectedWord === reversedWordLetters ||
        reversedSelectedWord === wordLetters ||
        reversedSelectedWord === reversedWordLetters ||
        selectedWord === wordPos.word ||
        reversedSelectedWord === wordPos.word
      ) {
        console.log('checkSelection: MATCH FOUND!', wordPos.word);
        this.markWordAsFound(wordPos.word);
        return wordPos.word;
      } else {
        console.log('checkSelection: Letters do not match for', wordPos.word);
      }
    }

    console.log('checkSelection: No match found');
    return null;
  }

  private positionsMatch(
    selected: Array<{ row: number; col: number }>,
    wordPositions: Array<{ row: number; col: number }>
  ): boolean {
    if (selected.length !== wordPositions.length) return false;

    // Create sets of position keys for comparison (order independent)
    const selectedSet = new Set(
      selected.map(cell => `${cell.row}-${cell.col}`)
    );
    const wordPosSet = new Set(
      wordPositions.map(cell => `${cell.row}-${cell.col}`)
    );

    // Check if sets are equal
    if (selectedSet.size !== wordPosSet.size) return false;

    for (const key of selectedSet) {
      if (!wordPosSet.has(key)) return false;
    }

    return true;
  }
}

