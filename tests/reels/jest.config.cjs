module.exports = {
  rootDir: '../..',
  testMatch: [
    '<rootDir>/tests/reels/**/*.test.ts',
    '<rootDir>/tests/reels/**/*.test.tsx',
  ],
  testEnvironment: 'node',
  setupFilesAfterEnv: ['<rootDir>/tests/reels/dom.cjs'],
  transform: {
    '^.+\\.tsx?$': [
      'ts-jest',
      {
        tsconfig: {
          jsx: 'react-jsx',
          esModuleInterop: true,
          target: 'ES2020',
          isolatedModules: true,
        },
        diagnostics: false,
      },
    ],
  },
  moduleNameMapper: {
    '^canvas$': '<rootDir>/tests/reels/canvas-mock.cjs',
    '^@gitroom/helpers/(.*)$': '<rootDir>/libraries/helpers/src/$1',
    '^@gitroom/nestjs-libraries/(.*)$':
      '<rootDir>/libraries/nestjs-libraries/src/$1',
    '^@gitroom/react/(.*)$':
      '<rootDir>/libraries/react-shared-libraries/src/$1',
    '\\.(scss|css)$': '<rootDir>/tests/reels/style-mock.cjs',
  },
};
