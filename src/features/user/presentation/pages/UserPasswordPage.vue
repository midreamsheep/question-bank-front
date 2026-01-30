<script setup lang="ts">
/**
 * @file User password page: change password with old password confirmation.
 */
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthDi } from '../../../auth/di'
import { useUserDi } from '../../di'

const userDi = useUserDi()
const authDi = useAuthDi()
const router = useRouter()

const oldPassword = ref('')
const newPassword = ref('')
const confirmNewPassword = ref('')

const submitting = ref(false)
const errorMessage = ref('')

const canSubmit = computed(() => {
  if (!oldPassword.value || !newPassword.value || !confirmNewPassword.value) return false
  if (newPassword.value.length < 6) return false
  return newPassword.value === confirmNewPassword.value
})

async function handleSubmit(): Promise<void> {
  if (!canSubmit.value) {
    errorMessage.value = '请检查输入项。'
    return
  }

  submitting.value = true
  errorMessage.value = ''
  try {
    await userDi.changePasswordUseCase.execute({
      oldPassword: oldPassword.value,
      newPassword: newPassword.value,
    })
    authDi.sessionStorage.clear()
    await router.replace({
      path: '/login',
      query: { redirect: '/me/profile', reason: 'password-changed' },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : '修改密码失败。'
    errorMessage.value = message
  } finally {
    submitting.value = false
  }
}
</script>

<template>
  <section class="page page--narrow">
    <header class="page__header">
      <h1 class="page__title">修改密码</h1>
      <p class="page__lead">修改成功后将自动退出并要求重新登录。</p>
    </header>
    <div class="card card--stack">
      <p v-if="errorMessage" class="helper helper--error">{{ errorMessage }}</p>
      <label class="field">
        <span>旧密码</span>
        <input v-model="oldPassword" type="password" placeholder="请输入旧密码" />
      </label>
      <label class="field">
        <span>新密码</span>
        <input v-model="newPassword" type="password" placeholder="至少 6 位字符" />
      </label>
      <label class="field">
        <span>确认新密码</span>
        <input v-model="confirmNewPassword" type="password" placeholder="再次输入新密码" />
      </label>
      <div class="actions">
        <button class="button" :class="{ 'button--busy': submitting }" :disabled="submitting || !canSubmit" @click="handleSubmit">
          {{ submitting ? '提交中...' : '确认修改' }}
        </button>
        <router-link class="button button--ghost" to="/me/profile">返回</router-link>
      </div>
    </div>
  </section>
</template>
