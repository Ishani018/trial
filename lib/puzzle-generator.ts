export interface PlacedWord {
  word: string;
  positions: Array<{ row: number; col: number }>;
  color: string;
}

export interface Puzzle {
  grid: string[][];
  placedWords: PlacedWord[];
}

type Direction = 
  | 'horizontal'
  | 'horizontal-reverse'
  | 'vertical'
  | 'vertical-reverse'
  | 'diagonal-forward'
  | 'diagonal-forward-reverse'
  | 'diagonal-backward'
  | 'diagonal-backward-reverse';

const COLORS = [
  '#3B82F6', // Blue
  '#8B5CF6', // Purple
  '#EC4899', // Pink
  '#F59E0B', // Amber
  '#10B981', // Green
  '#EF4444', // Red
];

export function generatePuzzle(words: string[], size: number): Puzzle {
  // Create empty grid
  const grid: string[][] = Array(size)
    .fill(null)
    .map(() => Array(size).fill(''));

  // Sort words by length (longest first) for better placement
  const sortedWords = [...words].sort((a, b) => b.length - a.length);

  const placedWords: PlacedWord[] = [];
  const directions: Direction[] = [
    'horizontal',
    'horizontal-reverse',
    'vertical',
    'vertical-reverse',
    'diagonal-forward',
    'diagonal-forward-reverse',
    'diagonal-backward',
    'diagonal-backward-reverse',
  ];

  // Place each word
  for (let i = 0; i < sortedWords.length; i++) {
    const word = sortedWords[i].toUpperCase();
    const color = COLORS[i % COLORS.length];
    let placed = false;
    let attempts = 0;
    const maxAttempts = 100;

    while (!placed && attempts < maxAttempts) {
      attempts++;
      const direction = directions[Math.floor(Math.random() * directions.length)];
      
      // Get random starting position based on direction and word length
      let startRow: number, startCol: number;
      
      switch (direction) {
        case 'horizontal':
        case 'horizontal-reverse':
          startRow = Math.floor(Math.random() * size);
          startCol = Math.floor(Math.random() * (size - word.length + 1));
          break;
        case 'vertical':
        case 'vertical-reverse':
          startRow = Math.floor(Math.random() * (size - word.length + 1));
          startCol = Math.floor(Math.random() * size);
          break;
        case 'diagonal-forward':
        case 'diagonal-forward-reverse':
          startRow = Math.floor(Math.random() * (size - word.length + 1));
          startCol = Math.floor(Math.random() * (size - word.length + 1));
          break;
        case 'diagonal-backward':
        case 'diagonal-backward-reverse':
          startRow = Math.floor(Math.random() * (size - word.length + 1));
          startCol = word.length - 1 + Math.floor(Math.random() * (size - word.length + 1));
          break;
      }

      // Check if we can place the word here
      const positions: Array<{ row: number; col: number }> = [];
      let canPlace = true;

      for (let j = 0; j < word.length; j++) {
        let row = startRow;
        let col = startCol;

        switch (direction) {
          case 'horizontal':
            col = startCol + j;
            break;
          case 'horizontal-reverse':
            col = startCol + word.length - 1 - j;
            break;
          case 'vertical':
            row = startRow + j;
            break;
          case 'vertical-reverse':
            row = startRow + word.length - 1 - j;
            break;
          case 'diagonal-forward':
            row = startRow + j;
            col = startCol + j;
            break;
          case 'diagonal-forward-reverse':
            row = startRow + word.length - 1 - j;
            col = startCol + word.length - 1 - j;
            break;
          case 'diagonal-backward':
            row = startRow + j;
            col = startCol - j;
            break;
          case 'diagonal-backward-reverse':
            row = startRow + word.length - 1 - j;
            col = startCol - (word.length - 1 - j);
            break;
        }

        // Check bounds
        if (row < 0 || row >= size || col < 0 || col >= size) {
          canPlace = false;
          break;
        }

        // Check if cell is empty or has the same letter
        const existing = grid[row][col];
        if (existing !== '' && existing !== word[j]) {
          canPlace = false;
          break;
        }

        positions.push({ row, col });
      }

      if (canPlace) {
        // Place the word
        for (let j = 0; j < word.length; j++) {
          grid[positions[j].row][positions[j].col] = word[j];
        }

        placedWords.push({
          word,
          positions,
          color,
        });

        placed = true;
      }
    }
  }

  // Fill remaining empty cells with random letters
  const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (grid[row][col] === '') {
        grid[row][col] = letters[Math.floor(Math.random() * letters.length)];
      }
    }
  }

  return { grid, placedWords };
}

