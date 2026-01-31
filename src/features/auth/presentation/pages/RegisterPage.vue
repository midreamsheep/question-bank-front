<script setup lang="ts">
/**
 * @file Register page: create a new account.
 */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthDi } from '../../di'

const authDi = useAuthDi()
const router = useRouter()

const username = ref('')
const nickname = ref('')
const password = ref('')
const confirmPassword = ref('')
const guardInput = ref('')
const submitting = ref(false)
const errorMessage = ref('')

const guardTarget = '\\tkk/'
const canSubmit = computed(() => guardInput.value === guardTarget)

/**
 * Submit register form.
 */
async function handleRegister(): Promise<void> {
  if (!username.value || !password.value || !nickname.value) {
    errorMessage.value = '请输入用户名、昵称和密码。'
    return
  }
  if (password.value.length < 6) {
    errorMessage.value = '密码至少需要 6 位。'
    return
  }
  if (password.value !== confirmPassword.value) {
    errorMessage.value = '两次输入的密码不一致。'
    return
  }
  if (!canSubmit.value) {
    errorMessage.value = `请输入固定校验码 ${guardTarget}。`
    return
  }

  submitting.value = true
  errorMessage.value = ''
  try {
    const result = await authDi.registerUseCase.execute({
      username: username.value,
      nickname: nickname.value,
      password: password.value,
    })
    authDi.sessionStorage.setToken(result.token)
    await router.push('/')
  } catch (error) {
    const message = error instanceof Error ? error.message : '注册失败。'
    errorMessage.value = message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <!-- Page: Register -->
  <section class="login-page">
    <div class="login-panel">
      <header class="page__header">
        <h1 class="page__title">注册</h1>
        <p class="helper">创建账号后即可开始整理题目。</p>
      </header>
      <div class="card card--stack">
        <label class="field">
          <span>用户名</span>
          <input v-model="username" type="text" placeholder="请输入用户名" />
        </label>
        <label class="field">
          <span>昵称</span>
          <input v-model="nickname" type="text" placeholder="用于展示，可后续修改" />
        </label>
        <label class="field">
          <span>密码</span>
          <input v-model="password" type="password" placeholder="至少 6 位字符" />
        </label>
        <label class="field">
          <span>确认密码</span>
          <input v-model="confirmPassword" type="password" placeholder="再次输入密码" />
        </label>
        <label class="field">
          <span>固定校验码</span>
          <input v-model="guardInput" type="text" placeholder="请输入 \tkk/" />
        </label>
        <p v-if="!canSubmit" class="helper">输入固定校验码 \tkk/ 后才能注册。</p>
        <p v-if="errorMessage" class="helper helper--error">{{ errorMessage }}</p>
        <button class="button" :class="{ 'button--busy': submitting }" :disabled="submitting || !canSubmit" @click="handleRegister">
          {{ submitting ? '注册中...' : '注册' }}
        </button>
        <router-link class="link" to="/login">已有账号？去登录</router-link>
      </div>
    </div>
  </section>
</template>
