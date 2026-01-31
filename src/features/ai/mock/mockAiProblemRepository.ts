/**
 * @file Mock AI problem repository.
 */

import type { AiProblemRepository } from '../domain/ports/aiProblemRepository'
import type { AiProblemAnalysis, AiProblemMetadataRecommendations, AiProblemMetadataRecommendationsRequest } from '../domain/models'

export class MockAiProblemRepository implements AiProblemRepository {
  /**
   * Get AI analysis for a published problem (mock).
   * @param problemId - Problem id.
   * @returns AI analysis object.
   */
  async getAnalysis(problemId: string): Promise<AiProblemAnalysis> {
    const id = Number(problemId)
    return {
      requestId: 'mock-request-id',
      problemId: Number.isFinite(id) ? id : 0,
      status: 'SUCCESS',
      promptVersion: 'ai.problem.analysis.v6',
      model: null,
      analysisMarkdown:
        '# AI 解析\n\n这里是示例解析内容。\n\n- 支持 **Markdown**\n- 支持 `$a+b$` 与 `$$a=b$$`（依赖 MathJax）\n',
      stepByStep: ['识别题型与关键信息', '选择合适方法并推进', '整理结论与边界情况'],
      highlights: {
        methodHints: ['从定义出发，构造等价变形'],
        keyObservations: ['注意条件的取值范围'],
        pitfalls: ['不要漏掉特殊情况'],
      },
      errorMessage: null,
      updatedAt: new Date().toISOString(),
    }
  }

  /**
   * Get AI metadata recommendations (mock).
   * @param input - Current editor content.
   * @returns Recommendations.
   */
  async getMetadataRecommendations(
    input: AiProblemMetadataRecommendationsRequest,
  ): Promise<AiProblemMetadataRecommendations> {
    const subject = input.subjectInput.trim() || 'MATH'
    return {
      requestId: 'mock-request-id',
      promptVersion: 'ai.problem.metadata.v1',
      model: null,
      titleSuggestions: input.title?.trim() ? [input.title.trim(), `${input.title.trim()}（优化）`].slice(0, 3) : ['题目标题建议'],
      subjectNormalization: {
        original: input.subjectInput,
        normalized: subject,
        operations: ['trim'],
      },
      subjectRecommendation: {
        value: subject,
        source: 'mock',
        inferredFromContent: true,
        bestMatch: subject,
        alternatives: subject === 'MATH' ? ['PHYSICS'] : ['MATH'],
        reasons: ['根据题干关键词推断（mock）'],
      },
      difficultyRecommendation: {
        value: Math.min(Math.max(input.difficultyRange.min, 3), input.difficultyRange.max),
        reasons: ['题目长度与步骤数量（mock）'],
      },
      tagRecommendations: {
        add: ['积分', '换元法'].slice(0, input.maxTagAddCount ?? 5),
        remove: [],
        keep: input.existingTags ?? [],
      },
      keywords: ['积分', '极限', 'Riemann'].slice(0, 6),
    }
  }
}
