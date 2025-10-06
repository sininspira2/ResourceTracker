module.exports = {
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  moduleNameMapper: {
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
  },
};