// Mock chalk to avoid ESM issues in Jest
const mockChalk = {
  red: (str) => str,
  green: (str) => str,
  blue: (str) => str,
  yellow: (str) => str,
  magenta: (str) => str,
  cyan: (str) => str,
  gray: (str) => str,
  grey: (str) => str,
};

module.exports = mockChalk;