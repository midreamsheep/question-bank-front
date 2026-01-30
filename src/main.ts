/**
 * @file 应用入口：创建并挂载 Vue 应用。
 */
import { createApp } from 'vue'
import type { RouteRecordRaw } from 'vue-router'
import App from './App.vue'
import './style.css'
import { createAppRouter, installAuthGuards } from './infrastructure/router'
import { createHttpClient } from './infrastructure/http'
import { createJsonStorage } from './infrastructure/storage/jsonStorage'
import { runtimeConfig } from './infrastructure/config'
import { PublicLayout, AppLayout, AdminLayout } from './infrastructure/layouts'
import { authDiKey, makeAuthDi } from './features/auth/di'
import { AUTH_SESSION_STORAGE_KEY } from './features/auth/data/authSessionStorage'
import type { AuthSession } from './features/auth/data/authSessionStorage'
import { homeRoutes } from './features/home/di'
import { loginRoute, registerRoute } from './features/auth/di'
import { problemDiKey, makeProblemDi, problemPublicRoutes, problemAccountRoutes } from './features/problem/di'
import { fileDiKey, makeFileDi } from './features/file/di'
import {
  dailyProblemDiKey,
  makeDailyProblemDi,
  dailyRoutes,
} from './features/daily-problem/di'
import {
  collectionDiKey,
  makeCollectionDi,
  collectionPublicRoutes,
  collectionAccountRoutes,
} from './features/collection/di'
import { adminDiKey, makeAdminDi, adminRoutes } from './features/admin/di'
import { taxonomyDiKey, makeTaxonomyDi } from './features/taxonomy/di'
import { systemDiKey, makeSystemDi } from './features/system/di'
import { userDiKey, makeUserDi, userAccountRoutes, userPublicRoutes } from './features/user/di'
import { commentDiKey, makeCommentDi } from './features/comment/di'
import { ensureMathJaxLoaded } from './infrastructure/latex/ensureMathJax'

const app = createApp(App)

// Load MathJax lazily with fallbacks; do not block app bootstrap if CDNs are unreachable.
void ensureMathJaxLoaded()

const storage = createJsonStorage(localStorage)
const apiBaseUrl = runtimeConfig.apiBaseUrl
const httpClient = createHttpClient({
  baseUrl: apiBaseUrl,
  getAuthToken: () => storage.get<AuthSession>(AUTH_SESSION_STORAGE_KEY)?.token ?? null,
})

const authDi = makeAuthDi({ httpClient, storage, useMock: runtimeConfig.useMock })
const problemDi = makeProblemDi({ httpClient, useMock: runtimeConfig.useMock })
const fileDi = makeFileDi({ httpClient, useMock: runtimeConfig.useMock })
const dailyProblemDi = makeDailyProblemDi({ httpClient, useMock: runtimeConfig.useMock })
const collectionDi = makeCollectionDi({ httpClient, useMock: runtimeConfig.useMock })
const adminDi = makeAdminDi({ httpClient, useMock: runtimeConfig.useMock })
const taxonomyDi = makeTaxonomyDi({ httpClient, useMock: runtimeConfig.useMock })
const systemDi = makeSystemDi({ httpClient, useMock: runtimeConfig.useMock })
const userDi = makeUserDi({ httpClient, useMock: runtimeConfig.useMock })
const commentDi = makeCommentDi({ httpClient, useMock: runtimeConfig.useMock })

app.provide(authDiKey, authDi)
app.provide(problemDiKey, problemDi)
app.provide(fileDiKey, fileDi)
app.provide(dailyProblemDiKey, dailyProblemDi)
app.provide(collectionDiKey, collectionDi)
app.provide(adminDiKey, adminDi)
app.provide(taxonomyDiKey, taxonomyDi)
app.provide(systemDiKey, systemDi)
app.provide(userDiKey, userDi)
app.provide(commentDiKey, commentDi)

const publicRoutes: RouteRecordRaw[] = [
  ...homeRoutes,
  ...problemPublicRoutes,
  ...collectionPublicRoutes,
  ...dailyRoutes,
  ...userPublicRoutes,
]

const accountRoutes: RouteRecordRaw[] = [
  ...userAccountRoutes,
  ...problemAccountRoutes,
  ...collectionAccountRoutes,
]

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    component: PublicLayout,
    meta: { requiresAuth: true },
    children: publicRoutes,
  },
  {
    path: '/me',
    component: AppLayout,
    meta: { requiresAuth: true },
    children: accountRoutes,
  },
  {
    path: '/admin',
    component: AdminLayout,
    meta: { requiresAuth: true, requiresAdmin: true },
    children: adminRoutes,
  },
  loginRoute,
  registerRoute,
]

const router = createAppRouter({ routes })
installAuthGuards(router, {
  loginPath: '/login',
  adminFallbackPath: '/',
  isAuthenticated: async () => authDi.sessionStorage.getToken() !== null,
  isAdmin: async () => false,
})

app.use(router)
app.mount('#app')
