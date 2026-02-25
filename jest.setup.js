// Jest setup file - provides environment variables for testing
// IMPORTANT: Forces dummy tokens to prevent tests from accidentally using real credentials
// This ensures tests never make real API calls even if GITHUB_TOKEN is set in the environment

// Save original tokens if they exist (in case we need them for debugging)
const originalGithubToken = process.env.GITHUB_TOKEN
const originalPAT = process.env.PERSONAL_ACCESS_TOKEN

// Force dummy tokens for all tests
process.env.GITHUB_TOKEN = 'ghs_dummyGitHubTokenForTestingOnly1234567890'
process.env.PERSONAL_ACCESS_TOKEN = 'ghp_dummyPersonalAccessTokenForTests1234567890'

// Log warning if we're overriding real tokens (helps catch misconfigurations)
if (originalGithubToken && originalGithubToken !== process.env.GITHUB_TOKEN) {
  console.warn('⚠️  Jest: Overriding real GITHUB_TOKEN with dummy token for tests')
}
if (originalPAT && originalPAT !== process.env.PERSONAL_ACCESS_TOKEN) {
  console.warn('⚠️  Jest: Overriding real PERSONAL_ACCESS_TOKEN with dummy token for tests')
}
