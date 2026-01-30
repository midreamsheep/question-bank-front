/**
 * @file Home feature DI: exports public routes.
 */
import type { RouteRecordRaw } from 'vue-router'
import HomePage from '../presentation/pages/HomePage.vue'

/**
 * Public routes for the home feature.
 */
export const homeRoutes: RouteRecordRaw[] = [
  {
    path: '',
    name: 'home',
    component: HomePage,
  },
]
