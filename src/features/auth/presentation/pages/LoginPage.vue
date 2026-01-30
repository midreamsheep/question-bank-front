<script setup lang="ts">
/**
 * @file Login page: entry for JWT authentication.
 */
import { computed, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthDi } from '../../di'

const authDi = useAuthDi()
const router = useRouter()
const route = useRoute()

const username = ref('')
const password = ref('')
const submitting = ref(false)
const errorMessage = ref('')
const infoMessage = computed(() => {
  const reason = typeof route.query.reason === 'string' ? route.query.reason : ''
  if (reason === 'password-changed') return '密码已修改，请重新登录。'
  if (reason === 'logout') return '你已退出登录。'
  return ''
})

/**
 * Submit login form.
 */
async function handleLogin(): Promise<void> {
  if (!username.value || !password.value) {
    errorMessage.value = '请输入用户名和密码。'
    return
  }

  submitting.value = true
  errorMessage.value = ''
  try {
    const result = await authDi.loginUseCase.execute({
      username: username.value,
      password: password.value,
    })
    authDi.sessionStorage.setToken(result.token)
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/'
    await router.push(redirect)
  } catch (error) {
    const message = error instanceof Error ? error.message : '登录失败。'
    errorMessage.value = message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="login-page">
    <div class="login-panel">
      <header class="page__header">
        <h1 class="page__title">登录</h1>
      </header>
      <div class="card card--stack">
        <label class="field">
          <span>用户名</span>
          <input v-model="username" type="text" placeholder="请输入用户名" />
        </label>
        <label class="field">
          <span>密码</span>
          <input v-model="password" type="password" placeholder="请输入密码" />
        </label>
        <p v-if="infoMessage" class="helper">{{ infoMessage }}</p>
        <p v-if="errorMessage" class="helper helper--error">{{ errorMessage }}</p>
        <button class="button" :class="{ 'button--busy': submitting }" :disabled="submitting" @click="handleLogin">
          {{ submitting ? '登录中...' : '登录' }}
        </button>
        <router-link class="link" to="/register">没有账号？去注册</router-link>
      </div>
    </div>
  </section>
</template>
