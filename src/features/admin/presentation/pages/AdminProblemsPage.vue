<script setup lang="ts">
/**
 * @file Admin problems page: review and disable problems.
 */
import { ref } from 'vue'
import { useAdminDi } from '../../di'

const adminDi = useAdminDi()

const problemId = ref('')
const disabling = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

/**
 * Disable a problem by id.
 */
async function handleDisable(): Promise<void> {
  const id = problemId.value.trim()
  if (!id) {
    errorMessage.value = '题目ID为必填。'
    return
  }
  disabling.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await adminDi.disableProblemUseCase.execute(id)
    successMessage.value = '题目已禁用。'
  } catch (error) {
    const message = error instanceof Error ? error.message : '禁用题目失败。'
    errorMessage.value = message
  } finally {
    disabling.value = false
  }
}
</script>

<template>
  <!-- Page: Admin problems -->
  <section class="page">
    <header class="page__header">
      <h1 class="page__title">题目审核</h1>
      <p class="page__lead">通过管理接口审核内容。</p>
    </header>
    <div class="card card--stack">
      <p v-if="errorMessage" class="helper helper--error">{{ errorMessage }}</p>
      <p v-if="successMessage" class="helper">{{ successMessage }}</p>
      <div class="filters">
        <label class="field">
          <span>题目ID</span>
          <input v-model="problemId" type="text" placeholder="1001" />
        </label>
        <button class="button" :class="{ 'button--busy': disabling }" :disabled="disabling" @click="handleDisable">
          {{ disabling ? '处理中...' : '禁用' }}
        </button>
      </div>
    </div>
  </section>
</template>
