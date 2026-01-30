/**
 * @file Shared mock taxonomy store.
 */
import type { Category, ProblemType, Tag } from '../domain/models'

/**
 * Shared mock taxonomy storage for categories, types, and tags.
 */
export const taxonomyStore = {
  categories: [
    { id: 1, name: 'Algebra', parentId: null, subject: 'MATH' },
    { id: 2, name: 'Geometry', parentId: null, subject: 'MATH' },
    { id: 3, name: 'Mechanics', parentId: null, subject: 'PHYSICS' },
    { id: 4, name: 'Inequalities', parentId: 1, subject: 'MATH' },
    { id: 5, name: 'Electromagnetism', parentId: null, subject: 'PHYSICS' },
  ] as Category[],
  problemTypes: [
    { id: 1, name: 'Constructive', subject: 'MATH' },
    { id: 2, name: 'Energy Conservation', subject: 'PHYSICS' },
    { id: 3, name: 'Symmetry', subject: 'PHYSICS' },
    { id: 4, name: 'Coordinate Transform', subject: 'MATH' },
  ] as ProblemType[],
  tags: [
    { id: 1, name: 'AM-GM', subject: 'MATH' },
    { id: 2, name: 'Field', subject: 'PHYSICS' },
    { id: 3, name: 'Bounds', subject: 'MATH' },
    { id: 4, name: 'Momentum', subject: 'PHYSICS' },
  ] as Tag[],
  nextCategoryId: 6,
  nextProblemTypeId: 5,
  nextTagId: 5,
}
