/**
 * @file 应用路由创建器：提供 Vue Router 实例创建方法（不关心具体业务路由）。
 */

import { createRouter, createWebHistory } from 'vue-router'
import type { Router, RouteRecordRaw } from 'vue-router'

export type CreateAppRouterOptions = {
  routes: RouteRecordRaw[]
}

/**
 * 创建应用 Router 实例。
 * @param options 路由配置
 * @param options.routes 路由表
 * @returns Router
 */
export function createAppRouter(options: CreateAppRouterOptions): Router {
  return createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes: options.routes,
  })
}

