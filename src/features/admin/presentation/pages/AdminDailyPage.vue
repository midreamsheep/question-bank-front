<script setup lang="ts">
/**
 * @file Admin daily problem page: publish or revoke daily items.
 */
import { ref } from 'vue'
import { useAdminDi } from '../../di'

const adminDi = useAdminDi()

const day = ref('')
const problemId = ref('')
const copywriting = ref('')
const revokeDay = ref('')

const saving = ref(false)
const revoking = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

/**
 * Publish daily problem.
 */
async function handlePublish(): Promise<void> {
  const id = problemId.value.trim()
  if (!day.value || !id) {
    errorMessage.value = '日期和题目ID为必填。'
    return
  }
  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await adminDi.publishDailyProblemUseCase.execute({
      day: day.value,
      problemId: id,
      copywriting: copywriting.value.trim() || null,
    })
    successMessage.value = '每日一题已发布。'
  } catch (error) {
    const message = error instanceof Error ? error.message : '发布每日一题失败。'
    errorMessage.value = message
  } finally {
    saving.value = false
  }
}

/**
 * Revoke daily problem.
 */
async function handleRevoke(): Promise<void> {
  if (!revokeDay.value) {
    errorMessage.value = '撤销需要填写日期。'
    return
  }
  revoking.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    await adminDi.revokeDailyProblemUseCase.execute(revokeDay.value)
    successMessage.value = '每日一题已撤销。'
  } catch (error) {
    const message = error instanceof Error ? error.message : '撤销每日一题失败。'
    errorMessage.value = message
  } finally {
    revoking.value = false
  }
}
</script>

<template>
  <section class="page">
    <header class="page__header">
      <h1 class="page__title">每日一题管理</h1>
    </header>
    <div class="card card--stack">
      <p v-if="errorMessage" class="helper helper--error">{{ errorMessage }}</p>
      <p v-if="successMessage" class="helper">{{ successMessage }}</p>
      <div class="filters">
        <label class="field">
          <span>日期（YYYY-MM-DD）</span>
          <input v-model="day" type="text" placeholder="2026-01-28" />
        </label>
        <label class="field">
          <span>题目ID</span>
          <input v-model="problemId" type="text" placeholder="1001" />
        </label>
        <label class="field">
          <span>文案</span>
          <input v-model="copywriting" type="text" placeholder="可选说明" />
        </label>
        <button class="button" :class="{ 'button--busy': saving }" :disabled="saving" @click="handlePublish">
          {{ saving ? '发布中...' : '发布' }}
        </button>
      </div>
      <div class="filters">
        <label class="field">
          <span>撤销日期</span>
          <input v-model="revokeDay" type="text" placeholder="2026-01-28" />
        </label>
        <button class="button button--ghost" :class="{ 'button--busy': revoking }" :disabled="revoking" @click="handleRevoke">
          {{ revoking ? '撤销中...' : '撤销' }}
        </button>
      </div>
    </div>
  </section>
</template>
