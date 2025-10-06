module.exports = {
  transform: {
    '^.+\\.(t|j)sx?$': '@swc/jest',
  },
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/lib/(.*)$': '<rootDir>/lib/$1',
  },
};