/* eslint-disable */
export default {
  displayName: 'api',
  preset: '../jest.preset.js',
  testEnvironment: 'node',
  transform: {
    '^.+\\.[tj]s$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleFileExtensions: ['ts', 'js', 'html'],
  coverageDirectory: '../coverage/api',
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(t|j)s?(x)',
    '<rootDir>/src/**/*.(test|spec).(t|j)s?(x)',
  ],
};