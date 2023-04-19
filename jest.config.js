module.exports = {
  moduleFileExtensions: ['tsx', 'ts', 'jsx', 'js', 'json', 'node'],
  clearMocks: true,
  testPathIgnorePatterns: ['/node_modules/', '^.*\\.test\\.tsx$', '^.*\\.cy\\.test\\.tsx$'],
  testEnvironment: 'jsdom',
  collectCoverageFrom: ['packages/**/*.{ts,tsx}'],
  setupFiles: ['./test-setup.js'],
  coverageDirectory: 'coverage/jest'
};
