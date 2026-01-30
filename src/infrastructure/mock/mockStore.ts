/**
 * @file Shared mock store for cross-feature consistency.
 */
import type { ProblemDetail } from '../../features/problem/domain/models'
import type { CollectionDetail } from '../../features/collection/domain/models'
import type { DailyProblemSummary } from '../../features/daily-problem/domain/models'
import type { UserProfile } from '../../features/user/domain/models'
import type { ProblemComment } from '../../features/comment/domain/models'

export type MockCollectionRecord = {
  detail: CollectionDetail
  shareKey: string | null
}

const initialProblems: ProblemDetail[] = [
  {
    id: '1',
    title: 'Inequality Warm-up',
    subject: 'MATH',
    difficulty: 2,
    statementFormat: 'MARKDOWN',
    statement: 'Prove the inequality for positive x, y, z.',
    solutionFormat: 'MARKDOWN',
    solution: 'Apply AM-GM and simplify.',
    visibility: 'PUBLIC',
    shareKey: null,
    status: 'PUBLISHED',
    publishedAt: '2026-01-28T10:00:00Z',
    author: { id: '2', nickname: 'Alice' },
    tagIds: [1],
  },
  {
    id: '2',
    title: 'Electric Field Sketch',
    subject: 'PHYSICS',
    difficulty: 3,
    statementFormat: 'MARKDOWN',
    statement: 'Compute the electric field at point P.',
    solutionFormat: 'MARKDOWN',
    solution: 'Use superposition and symmetry.',
    visibility: 'PUBLIC',
    shareKey: null,
    status: 'PUBLISHED',
    publishedAt: '2026-01-28T11:00:00Z',
    author: { id: '3', nickname: 'Bob' },
    tagIds: [2],
  },
  {
    id: '3',
    title: 'Geometry Locus',
    subject: 'MATH',
    difficulty: 4,
    statementFormat: 'MARKDOWN',
    statement: 'Find the locus of points satisfying the given ratio.',
    solutionFormat: 'MARKDOWN',
    solution: 'Transform the condition into a circle equation.',
    visibility: 'UNLISTED',
    shareKey: 'share-3',
    status: 'PUBLISHED',
    publishedAt: '2026-01-27T16:20:00Z',
    author: { id: '4', nickname: 'Carol' },
    tagIds: [3],
  },
  {
    id: '4',
    title: 'Momentum Conservation',
    subject: 'PHYSICS',
    difficulty: 3,
    statementFormat: 'MARKDOWN',
    statement: 'Two carts collide elastically. Find final velocities.',
    solutionFormat: 'MARKDOWN',
    solution: 'Use momentum and energy conservation equations.',
    visibility: 'PUBLIC',
    shareKey: null,
    status: 'PUBLISHED',
    publishedAt: '2026-01-26T12:30:00Z',
    author: { id: '3', nickname: 'Bob' },
    tagIds: [4],
  },
  {
    id: '5',
    title: 'Draft: Sequence Bound',
    subject: 'MATH',
    difficulty: 2,
    statementFormat: 'MARKDOWN',
    statement: 'Draft statement for sequence bounds.',
    solutionFormat: null,
    solution: null,
    visibility: 'PRIVATE',
    shareKey: null,
    status: 'DRAFT',
    publishedAt: null,
    author: { id: '1', nickname: 'Demo' },
    tagIds: [3],
  },
]

const initialCollections: MockCollectionRecord[] = [
  {
    detail: {
      id: '1',
      name: 'Inequality Training',
      description: 'Warm-up set for algebra.',
      visibility: 'PUBLIC',
      status: 'ACTIVE',
      items: [
        { problemId: '1', sortOrder: 10, problem: { id: '1', title: 'Inequality Warm-up' } },
      ],
    },
    shareKey: null,
  },
  {
    detail: {
      id: '2',
      name: 'Physics Core',
      description: 'Momentum and field basics.',
      visibility: 'UNLISTED',
      status: 'ACTIVE',
      items: [
        { problemId: '2', sortOrder: 10, problem: { id: '2', title: 'Electric Field Sketch' } },
        { problemId: '4', sortOrder: 20, problem: { id: '4', title: 'Momentum Conservation' } },
      ],
    },
    shareKey: 'collection-2-share',
  },
]

const initialDailyProblems: DailyProblemSummary[] = [
  {
    id: '1',
    day: '2026-01-28',
    copywriting: 'Focus on constructing auxiliary equations.',
    problem: {
      id: '1',
      title: 'Inequality Warm-up',
      subject: 'MATH',
      difficulty: 2,
    },
  },
  {
    id: '5',
    day: '2026-01-28',
    copywriting: 'Bonus: try to generalize the inequality.',
    problem: {
      id: '3',
      title: 'Geometry Locus',
      subject: 'MATH',
      difficulty: 4,
    },
  },
  {
    id: '2',
    day: '2026-01-27',
    copywriting: 'Use symmetry to simplify.',
    problem: {
      id: '2',
      title: 'Electric Field Sketch',
      subject: 'PHYSICS',
      difficulty: 3,
    },
  },
  {
    id: '3',
    day: '2026-01-26',
    copywriting: 'Watch for conserved quantities.',
    problem: {
      id: '4',
      title: 'Momentum Conservation',
      subject: 'PHYSICS',
      difficulty: 3,
    },
  },
  {
    id: '4',
    day: '2026-01-25',
    copywriting: 'Turn geometry into algebra.',
    problem: {
      id: '3',
      title: 'Geometry Locus',
      subject: 'MATH',
      difficulty: 4,
    },
  },
]

const initialUser: UserProfile = {
  id: '1',
  username: 'demo',
  nickname: 'Demo',
  avatarFileId: null,
  status: 'ACTIVE',
}

const initialComments: ProblemComment[] = [
  {
    id: '1',
    problemId: '1',
    userId: '2',
    parentId: null,
    replyToCommentId: null,
    content: '这道题可以从 AM-GM 入手，先把式子整理一下。',
    likeCount: 2,
    deleted: false,
    createdAt: '2026-01-28T08:00:00Z',
  },
  {
    id: '2',
    problemId: '1',
    userId: '3',
    parentId: null,
    replyToCommentId: null,
    content: '我用的是不等式放缩，结果一致。',
    likeCount: 0,
    deleted: false,
    createdAt: '2026-01-28T09:10:00Z',
  },
]

/**
 * Shared mock state store.
 */
export const mockStore = {
  problems: [...initialProblems],
  collections: [...initialCollections],
  dailyProblems: [...initialDailyProblems],
  comments: [...initialComments],
  user: { ...initialUser },
  nextProblemId: 6,
  nextCollectionId: 3,
  nextCommentId: 3,
  nextDailyProblemItemId: 6,
}
