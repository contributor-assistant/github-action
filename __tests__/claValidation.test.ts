/**
 * Integration Tests for CLA Validation Flow
 *
 * Tests all permutations of:
 * - Signature database state (signed/unsigned/partial)
 * - Allowlist configuration (username/domain/combined/none)
 * - Expected outcomes (pass/fail)
 */

import * as core from '@actions/core'
import { context } from '@actions/github'
import * as input from '../src/shared/getInputs'
import { getFileContent } from '../src/persistence/persistence'
import getCommitters from '../src/graphql'
import { CommittersDetails } from '../src/interfaces'

// Mock all external dependencies FIRST
jest.mock('@actions/core')
jest.mock('@actions/github')
jest.mock('../src/shared/getInputs')
jest.mock('../src/persistence/persistence')
jest.mock('../src/graphql')
jest.mock('../src/pullRerunRunner', () => ({
  reRunLastWorkFlowIfRequired: jest.fn().mockResolvedValue(undefined)
}))

// Set up default mocks for inputs BEFORE importing modules that use them
const mockedGetUsernameAllowList = jest.mocked(input.getUsernameAllowList)
const mockedGetDomainAllowList = jest.mocked(input.getDomainAllowList)
const mockedGetDomainsFile = jest.mocked(input.getDomainsFile)
const mockedGetFileContent = jest.mocked(getFileContent)
const mockedGetCommitters = jest.mocked(getCommitters)
const mockedGetPathToSignatures = jest.mocked(input.getPathToSignatures)
const mockedGetRemoteRepoName = jest.mocked(input.getRemoteRepoName)
const mockedGetRemoteOrgName = jest.mocked(input.getRemoteOrgName)
const mockedSetFailed = jest.mocked(core.setFailed)
const mockedInfo = jest.mocked(core.info)

// Initialize with empty strings to prevent module load errors
mockedGetUsernameAllowList.mockReturnValue('')
mockedGetDomainAllowList.mockReturnValue('')
mockedGetDomainsFile.mockReturnValue('')
mockedGetPathToSignatures.mockReturnValue('signatures.json')
mockedGetRemoteRepoName.mockReturnValue('test-repo')
mockedGetRemoteOrgName.mockReturnValue('test-owner')

// NOW import setupClaCheck after mocks are set up
import { setupClaCheck } from '../src/setupClaCheck'

// Mock octokit for PR comments and signatures file
jest.mock('../src/octokit', () => ({
  octokit: {
    rest: {
      repos: {
        getContent: jest.fn()
      }
    },
    issues: {
      listComments: jest.fn().mockResolvedValue({ data: [] }),
      createComment: jest.fn().mockResolvedValue({}),
      updateComment: jest.fn().mockResolvedValue({})
    },
    pulls: {
      listCommits: jest.fn().mockResolvedValue({ data: [] })
    }
  }
}))

describe('CLA Validation - Full Integration Flow', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Set context directly (avoid defineProperty to prevent redefine errors)
    // @ts-ignore
    context.repo = { owner: 'test-owner', repo: 'test-repo' }
    // @ts-ignore
    context.issue = { owner: 'test-owner', repo: 'test-repo', number: 1 }
    // @ts-ignore
    context.payload = {
      pull_request: { number: 1, head: { sha: 'abc123' } }
    }

    // Default input mocks
    mockedGetUsernameAllowList.mockReturnValue('')
    mockedGetDomainAllowList.mockReturnValue('')
    mockedGetDomainsFile.mockReturnValue('')
    mockedGetPathToSignatures.mockReturnValue('signatures.json')
    mockedGetRemoteRepoName.mockReturnValue('test-repo')
    mockedGetRemoteOrgName.mockReturnValue('test-owner')

    // Mock summary API with all needed methods
    ;(core.summary as any) = {
      addHeading: jest.fn().mockReturnThis(),
      addRaw: jest.fn().mockReturnThis(),
      addTable: jest.fn().mockReturnThis(),
      addBreak: jest.fn().mockReturnThis(),
      addCodeBlock: jest.fn().mockReturnThis(),
      addList: jest.fn().mockReturnThis(),
      write: jest.fn().mockResolvedValue(undefined)
    }
  })

  describe('Scenario 1: No Allowlist - All Contributors Signed', () => {
    it('should PASS when all contributors have signed in database', async () => {
      const committers: CommittersDetails[] = [
        { name: 'user1', id: 101, email: '[email protected]' },
        { name: 'user2', id: 102, email: '[email protected]' },
        { name: 'user3', id: 103, email: '[email protected]' }
      ]

      const signaturesFile = {
        signedContributors: [
          { name: 'user1', id: 101, created_at: '2026-01-01' },
          { name: 'user2', id: 102, created_at: '2026-01-01' },
          { name: 'user3', id: 103, created_at: '2026-01-01' }
        ]
      }

      mockedGetCommitters.mockResolvedValue(committers)
      mockedGetFileContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify(signaturesFile)).toString('base64'),
          sha: 'file-sha-123'
        }
      } as any)

      await setupClaCheck()

      // Should succeed
      expect(mockedInfo).toHaveBeenCalledWith(expect.stringContaining('All contributors have signed'))
      expect(mockedSetFailed).not.toHaveBeenCalled()
    })
  })

  describe('Scenario 2: No Allowlist - No Contributors Signed', () => {
    it('should FAIL when no contributors have signed', async () => {
      const committers: CommittersDetails[] = [
        { name: 'user1', id: 101, email: '[email protected]' },
        { name: 'user2', id: 102, email: '[email protected]' },
        { name: 'user3', id: 103, email: '[email protected]' }
      ]

      const signaturesFile = {
        signedContributors: [] // Empty - no signatures
      }

      mockedGetCommitters.mockResolvedValue(committers)
      mockedGetFileContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify(signaturesFile)).toString('base64'),
          sha: 'file-sha-123'
        }
      } as any)

      await setupClaCheck()

      // Should fail
      expect(mockedSetFailed).toHaveBeenCalled()
      const failMessage = mockedSetFailed.mock.calls[0][0]
      expect(failMessage).toContain('need to sign the CLA')
    })
  })

  describe('Scenario 3: No Allowlist - Partial Contributors Signed', () => {
    it('should FAIL when only some contributors have signed', async () => {
      const committers: CommittersDetails[] = [
        { name: 'user1', id: 101, email: '[email protected]' },
        { name: 'user2', id: 102, email: '[email protected]' },
        { name: 'user3', id: 103, email: '[email protected]' }
      ]

      const signaturesFile = {
        signedContributors: [
          { name: 'user1', id: 101, created_at: '2026-01-01' }
          // user2 and user3 not signed
        ]
      }

      mockedGetCommitters.mockResolvedValue(committers)
      mockedGetFileContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify(signaturesFile)).toString('base64'),
          sha: 'file-sha-123'
        }
      } as any)

      await setupClaCheck()

      // Should fail with 2 unsigned
      expect(mockedSetFailed).toHaveBeenCalled()
      const failMessage = mockedSetFailed.mock.calls[0][0]
      expect(failMessage).toContain('2')
      expect(failMessage).toContain('need to sign the CLA')
    })
  })

  describe('Scenario 4: All Bots in Allowlist', () => {
    it('should PASS when all contributors are bots in allowlist', async () => {
      const committers: CommittersDetails[] = [
        { name: 'dependabot', id: 201, email: '[email protected]' },
        { name: 'copilot', id: 202, email: '[email protected]' },
        { name: 'github-actions[bot]', id: 203, email: '[email protected]' }
      ]

      const signaturesFile = {
        signedContributors: [] // No signatures needed - all allowlisted
      }

      mockedGetUsernameAllowList.mockReturnValue('dependabot*, copilot, *[bot]')
      mockedGetCommitters.mockResolvedValue(committers)
      mockedGetFileContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify(signaturesFile)).toString('base64'),
          sha: 'file-sha-123'
        }
      } as any)

      await setupClaCheck()

      // Should succeed - all filtered by allowlist
      console.log('mockedInfo calls:', mockedInfo.mock.calls)
      console.log('mockedSetFailed calls:', mockedSetFailed.mock.calls)
      if (mockedSetFailed.mock.calls.length > 0) {
        console.log('Failure message:', mockedSetFailed.mock.calls[0][0])
      }
      expect(mockedInfo).toHaveBeenCalledWith(expect.stringContaining('All contributors have signed'))
      expect(mockedSetFailed).not.toHaveBeenCalled()
    })
  })

  describe('Scenario 5: Mixed Bots+Users - Bots Filtered, Users Signed', () => {
    it('should PASS when bots filtered by allowlist and users all signed', async () => {
      const committers: CommittersDetails[] = [
        { name: 'dependabot', id: 201, email: '[email protected]' },
        { name: 'user1', id: 101, email: '[email protected]' },
        { name: 'user2', id: 102, email: '[email protected]' }
      ]

      const signaturesFile = {
        signedContributors: [
          { name: 'user1', id: 101, created_at: '2026-01-01' },
          { name: 'user2', id: 102, created_at: '2026-01-01' }
        ]
      }

      mockedGetUsernameAllowList.mockReturnValue('dependabot*')
      mockedGetCommitters.mockResolvedValue(committers)
      mockedGetFileContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify(signaturesFile)).toString('base64'),
          sha: 'file-sha-123'
        }
      } as any)

      await setupClaCheck()

      // Should succeed
      expect(mockedInfo).toHaveBeenCalledWith(expect.stringContaining('All contributors have signed'))
      expect(mockedSetFailed).not.toHaveBeenCalled()
    })
  })

  describe('Scenario 6: Mixed Bots+Users - Bots Filtered, Users Partial Signed', () => {
    it('should FAIL when bots filtered but some users unsigned', async () => {
      const committers: CommittersDetails[] = [
        { name: 'copilot', id: 202, email: '[email protected]' },
        { name: 'user1', id: 101, email: '[email protected]' },
        { name: 'user2', id: 102, email: '[email protected]' }
      ]

      const signaturesFile = {
        signedContributors: [
          { name: 'user1', id: 101, created_at: '2026-01-01' }
          // user2 not signed
        ]
      }

      mockedGetUsernameAllowList.mockReturnValue('copilot')
      mockedGetCommitters.mockResolvedValue(committers)
      mockedGetFileContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify(signaturesFile)).toString('base64'),
          sha: 'file-sha-123'
        }
      } as any)

      await setupClaCheck()

      // Should fail - user2 unsigned
      expect(mockedSetFailed).toHaveBeenCalled()
      const failMessage = mockedSetFailed.mock.calls[0][0]
      expect(failMessage).toContain('1')
      expect(failMessage).toContain('need to sign the CLA')
    })
  })

  describe('Scenario 7: Mixed Bots+Users - Bots Filtered, Users None Signed', () => {
    it('should FAIL when bots filtered but no users signed', async () => {
      const committers: CommittersDetails[] = [
        { name: 'dependabot[bot]', id: 203, email: '[email protected]' },
        { name: 'user1', id: 101, email: '[email protected]' },
        { name: 'user2', id: 102, email: '[email protected]' }
      ]

      const signaturesFile = {
        signedContributors: []
      }

      mockedGetUsernameAllowList.mockReturnValue('*[bot]')
      mockedGetCommitters.mockResolvedValue(committers)
      mockedGetFileContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify(signaturesFile)).toString('base64'),
          sha: 'file-sha-123'
        }
      } as any)

      await setupClaCheck()

      // Should fail - 2 users unsigned
      expect(mockedSetFailed).toHaveBeenCalled()
      const failMessage = mockedSetFailed.mock.calls[0][0]
      expect(failMessage).toContain('2')
      expect(failMessage).toContain('need to sign the CLA')
    })
  })

  describe('Scenario 8: Username Allowlist - Remaining All Signed', () => {
    it('should PASS when some users in allowlist and remaining all signed', async () => {
      const committers: CommittersDetails[] = [
        { name: 'admin-user', id: 301, email: '[email protected]' },
        { name: 'bot-service', id: 302, email: '[email protected]' },
        { name: 'user1', id: 101, email: '[email protected]' },
        { name: 'user2', id: 102, email: '[email protected]' }
      ]

      const signaturesFile = {
        signedContributors: [
          { name: 'user1', id: 101, created_at: '2026-01-01' },
          { name: 'user2', id: 102, created_at: '2026-01-01' }
        ]
      }

      mockedGetUsernameAllowList.mockReturnValue('admin-*, *bot*')
      mockedGetCommitters.mockResolvedValue(committers)
      mockedGetFileContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify(signaturesFile)).toString('base64'),
          sha: 'file-sha-123'
        }
      } as any)

      await setupClaCheck()

      // Should succeed
      expect(mockedInfo).toHaveBeenCalledWith(expect.stringContaining('All contributors have signed'))
      expect(mockedSetFailed).not.toHaveBeenCalled()
    })
  })

  describe('Scenario 9: Username Allowlist - Remaining Partial Signed', () => {
    it('should FAIL when some users in allowlist but remaining not all signed', async () => {
      const committers: CommittersDetails[] = [
        { name: 'admin-user', id: 301, email: '[email protected]' },
        { name: 'user1', id: 101, email: '[email protected]' },
        { name: 'user2', id: 102, email: '[email protected]' },
        { name: 'user3', id: 103, email: '[email protected]' }
      ]

      const signaturesFile = {
        signedContributors: [
          { name: 'user1', id: 101, created_at: '2026-01-01' }
          // user2 and user3 not signed
        ]
      }

      mockedGetUsernameAllowList.mockReturnValue('admin-*')
      mockedGetCommitters.mockResolvedValue(committers)
      mockedGetFileContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify(signaturesFile)).toString('base64'),
          sha: 'file-sha-123'
        }
      } as any)

      await setupClaCheck()

      // Should fail - user2 and user3 unsigned
      expect(mockedSetFailed).toHaveBeenCalled()
      const failMessage = mockedSetFailed.mock.calls[0][0]
      expect(failMessage).toContain('2')
      expect(failMessage).toContain('need to sign the CLA')
    })
  })

  describe('Scenario 10: Domain Allowlist - Remaining Signed', () => {
    it('should PASS when domain emails filtered and remaining signed', async () => {
      const committers: CommittersDetails[] = [
        { name: 'bot1', id: 401, email: 'bot1@bot.example.com' },
        { name: 'bot2', id: 402, email: 'bot2@automation.io' },
        { name: 'user1', id: 101, email: 'user1@company.com' },
        { name: 'user2', id: 102, email: 'user2@company.com' }
      ]

      const signaturesFile = {
        signedContributors: [
          { name: 'user1', id: 101, created_at: '2026-01-01' },
          { name: 'user2', id: 102, created_at: '2026-01-01' }
        ]
      }

      mockedGetDomainAllowList.mockReturnValue('@bot.example.com, @automation.io')
      mockedGetCommitters.mockResolvedValue(committers)
      mockedGetFileContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify(signaturesFile)).toString('base64'),
          sha: 'file-sha-123'
        }
      } as any)

      await setupClaCheck()

      // Should succeed
      expect(mockedInfo).toHaveBeenCalledWith(expect.stringContaining('All contributors have signed'))
      expect(mockedSetFailed).not.toHaveBeenCalled()
    })
  })

  describe('Scenario 11: Domain Allowlist - Remaining Unsigned', () => {
    it('should FAIL when domain emails filtered but remaining unsigned', async () => {
      const committers: CommittersDetails[] = [
        { name: 'bot1', id: 401, email: '[email protected]' },
        { name: 'user1', id: 101, email: '[email protected]' },
        { name: 'user2', id: 102, email: '[email protected]' }
      ]

      const signaturesFile = {
        signedContributors: []
      }

      mockedGetDomainAllowList.mockReturnValue('@bot.io')
      mockedGetCommitters.mockResolvedValue(committers)
      mockedGetFileContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify(signaturesFile)).toString('base64'),
          sha: 'file-sha-123'
        }
      } as any)

      await setupClaCheck()

      // Should fail - user1 and user2 unsigned
      expect(mockedSetFailed).toHaveBeenCalled()
      const failMessage = mockedSetFailed.mock.calls[0][0]
      expect(failMessage).toContain('2')
      expect(failMessage).toContain('need to sign the CLA')
    })
  })

  describe('Scenario 12: Combined Username + Domain Allowlist', () => {
    it('should handle both username and domain allowlist correctly', async () => {
      const committers: CommittersDetails[] = [
        { name: 'dependabot', id: 201, email: 'dependabot@bot.io' },
        { name: 'bot-service', id: 401, email: 'bot-service@bot.io' },
        { name: 'ci-bot', id: 402, email: 'ci-bot@bot.io' },
        { name: 'user1', id: 101, email: 'user1@company.com' },
        { name: 'user2', id: 102, email: 'user2@company.com' }
      ]

      const signaturesFile = {
        signedContributors: [
          { name: 'user1', id: 101, created_at: '2026-01-01' },
          { name: 'user2', id: 102, created_at: '2026-01-01' }
        ]
      }

      mockedGetUsernameAllowList.mockReturnValue('dependabot*, ci-*')
      mockedGetDomainAllowList.mockReturnValue('@bot.io')
      mockedGetCommitters.mockResolvedValue(committers)
      mockedGetFileContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify(signaturesFile)).toString('base64'),
          sha: 'file-sha-123'
        }
      } as any)

      await setupClaCheck()

      // Should succeed - dependabot and ci-bot filtered by username, bot-service by domain
      expect(mockedInfo).toHaveBeenCalledWith(expect.stringContaining('All contributors have signed'))
      expect(mockedSetFailed).not.toHaveBeenCalled()
    })

    it('should FAIL when combined allowlist still leaves unsigned users', async () => {
      const committers: CommittersDetails[] = [
        { name: 'dependabot', id: 201, email: 'dependabot@bot.io' },
        { name: 'bot-service', id: 401, email: 'bot-service@bot.io' },
        { name: 'user1', id: 101, email: 'user1@company.com' },
        { name: 'user2', id: 102, email: 'user2@company.com' }
      ]

      const signaturesFile = {
        signedContributors: [
          { name: 'user1', id: 101, created_at: '2026-01-01' }
          // user2 not signed
        ]
      }

      mockedGetUsernameAllowList.mockReturnValue('dependabot*')
      mockedGetDomainAllowList.mockReturnValue('@bot.io')
      mockedGetCommitters.mockResolvedValue(committers)
      mockedGetFileContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify(signaturesFile)).toString('base64'),
          sha: 'file-sha-123'
        }
      } as any)

      await setupClaCheck()

      // Should fail - user2 unsigned
      expect(mockedSetFailed).toHaveBeenCalled()
      const failMessage = mockedSetFailed.mock.calls[0][0]
      expect(failMessage).toContain('1')
      expect(failMessage).toContain('need to sign the CLA')
    })
  })

  describe('Edge Cases', () => {
    it('should handle empty committers list', async () => {
      const committers: CommittersDetails[] = []

      const signaturesFile = {
        signedContributors: []
      }

      mockedGetCommitters.mockResolvedValue(committers)
      mockedGetFileContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify(signaturesFile)).toString('base64'),
          sha: 'file-sha-123'
        }
      } as any)

      await setupClaCheck()

      // Should succeed - no one to check
      expect(mockedInfo).toHaveBeenCalledWith(expect.stringContaining('All contributors have signed'))
      expect(mockedSetFailed).not.toHaveBeenCalled()
    })

    it('should PASS when allowlist filters all contributors', async () => {
      const committers: CommittersDetails[] = [
        { name: 'bot1', id: 201, email: '[email protected]' },
        { name: 'bot2', id: 202, email: '[email protected]' },
        { name: 'bot3', id: 203, email: '[email protected]' }
      ]

      const signaturesFile = {
        signedContributors: []
      }

      mockedGetUsernameAllowList.mockReturnValue('*bot*')
      mockedGetCommitters.mockResolvedValue(committers)
      mockedGetFileContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify(signaturesFile)).toString('base64'),
          sha: 'file-sha-123'
        }
      } as any)

      await setupClaCheck()

      // Should succeed - all filtered by allowlist
      expect(mockedInfo).toHaveBeenCalledWith(expect.stringContaining('All contributors have signed'))
      expect(mockedSetFailed).not.toHaveBeenCalled()
    })

    it('should handle contributors with duplicate entries in signatures', async () => {
      const committers: CommittersDetails[] = [
        { name: 'user1', id: 101, email: '[email protected]' }
      ]

      const signaturesFile = {
        signedContributors: [
          { name: 'user1', id: 101, created_at: '2026-01-01' },
          { name: 'user1', id: 101, created_at: '2026-01-02' }, // Duplicate
        ]
      }

      mockedGetCommitters.mockResolvedValue(committers)
      mockedGetFileContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify(signaturesFile)).toString('base64'),
          sha: 'file-sha-123'
        }
      } as any)

      await setupClaCheck()

      // Should still succeed - user is signed (duplicates don't matter)
      expect(mockedInfo).toHaveBeenCalledWith(expect.stringContaining('All contributors have signed'))
      expect(mockedSetFailed).not.toHaveBeenCalled()
    })

    it('should match signatures by GitHub ID when names differ', async () => {
      const committers: CommittersDetails[] = [
        { name: 'user1-renamed', id: 101, email: '[email protected]' }
      ]

      const signaturesFile = {
        signedContributors: [
          { name: 'user1-old-name', id: 101, created_at: '2026-01-01' } // Same ID, different name
        ]
      }

      mockedGetCommitters.mockResolvedValue(committers)
      mockedGetFileContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify(signaturesFile)).toString('base64'),
          sha: 'file-sha-123'
        }
      } as any)

      await setupClaCheck()

      // Should succeed - matched by ID
      expect(mockedInfo).toHaveBeenCalledWith(expect.stringContaining('All contributors have signed'))
      expect(mockedSetFailed).not.toHaveBeenCalled()
    })

    it('should handle signatures file with missing signedContributors array', async () => {
      const committers: CommittersDetails[] = [
        { name: 'user1', id: 101, email: '[email protected]' }
      ]

      const signaturesFile = {} // Missing signedContributors

      mockedGetCommitters.mockResolvedValue(committers)
      mockedGetFileContent.mockResolvedValue({
        data: {
          content: Buffer.from(JSON.stringify(signaturesFile)).toString('base64'),
          sha: 'file-sha-123'
        }
      } as any)

      await setupClaCheck()

      // Should fail - no signatures
      expect(mockedSetFailed).toHaveBeenCalled()
    })
  })
})
