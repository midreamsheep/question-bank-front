/**
 * @file Admin repository port.
 */
import type {
  Category,
  CreateCategoryInput,
  CreateProblemTypeInput,
  CreateTagInput,
  DailyProblemItem,
  ProblemType,
  PublishDailyProblemInput,
  Tag,
  UpdateCategoryInput,
  UpdateProblemTypeInput,
} from '../models'

export type AdminRepository = {
  listCategories(): Promise<Category[]>
  listProblemTypes(): Promise<ProblemType[]>
  listTags(): Promise<Tag[]>
  createCategory(input: CreateCategoryInput): Promise<Category>
  updateCategory(id: number, input: UpdateCategoryInput): Promise<Category>
  createProblemType(input: CreateProblemTypeInput): Promise<ProblemType>
  updateProblemType(id: number, input: UpdateProblemTypeInput): Promise<ProblemType>
  createTag(input: CreateTagInput): Promise<Tag>
  publishDailyProblem(input: PublishDailyProblemInput): Promise<DailyProblemItem>
  revokeDailyProblem(day: string): Promise<DailyProblemItem[]>
  revokeDailyProblemItem(id: string): Promise<DailyProblemItem>
  disableProblem(id: string): Promise<void>
}
