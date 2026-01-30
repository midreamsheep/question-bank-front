/**
 * @file 路由守卫安装：提供“需要登录”的通用守卫能力。
 */

import type { Router } from 'vue-router'

export type InstallAuthGuardsOptions = {
  /**
   * 判断当前是否已登录。
   * @returns 是否已登录
   */
  isAuthenticated(): boolean | Promise<boolean>

  /**
   * 判断当前是否为管理员。
   * @returns 是否为管理员
   */
  isAdmin?(): boolean | Promise<boolean>

  /**
   * 登录页路径（未登录时跳转）。
   * @default '/login'
   */
  loginPath?: string

  /**
   * 非管理员的兜底跳转路径。
   * @default '/'
   */
  adminFallbackPath?: string
}

/**
 * 安装“需要登录”路由守卫：当路由 meta.requiresAuth 为 true 且未登录时，重定向到登录页。
 * @param router Router 实例
 * @param options 守卫配置
 */
export function installAuthGuards(router: Router, options: InstallAuthGuardsOptions): void {
  const loginPath = options.loginPath ?? '/login'
  const adminFallbackPath = options.adminFallbackPath ?? '/'

  router.beforeEach(async (to) => {
    const allowAnonymous = to.matched.some((record) => Boolean(record.meta?.allowAnonymous))
    if (allowAnonymous) return true

    const requiresAuth = to.matched.some((record) => Boolean(record.meta?.requiresAuth))
    const requiresAdmin = to.matched.some((record) => Boolean(record.meta?.requiresAdmin))
    if (!requiresAuth && !requiresAdmin) return true

    const authed = await options.isAuthenticated()
    if (!authed) {
      return {
        path: loginPath,
        query: { redirect: to.fullPath },
      }
    }

    if (!requiresAdmin) return true

    const isAdmin = await options.isAdmin?.()
    if (isAdmin) return true

    return { path: adminFallbackPath }
  })
}
