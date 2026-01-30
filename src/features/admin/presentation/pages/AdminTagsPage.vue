<script setup lang="ts">
/**
 * @file Admin tags page: manage tags.
 */
import { onMounted, ref } from 'vue'
import { useAdminDi } from '../../di'
import type { Tag } from '../../domain/models'

const adminDi = useAdminDi()

const loading = ref(false)
const errorMessage = ref('')
const tags = ref<Tag[]>([])

const name = ref('')
const subject = ref('')
const saving = ref(false)

function formatSubject(value?: string | null): string {
  if (!value) return '全部'
  if (value === 'MATH') return '数学'
  if (value === 'PHYSICS') return '物理'
  return value
}

/**
 * Load tags list.
 */
async function loadTags(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    tags.value = await adminDi.listTagsUseCase.execute()
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载标签失败。'
    errorMessage.value = message
  } finally {
    loading.value = false
  }
}

/**
 * Create a new tag.
 */
async function handleCreate(): Promise<void> {
  if (!name.value.trim()) {
    errorMessage.value = '名称为必填。'
    return
  }
  saving.value = true
  errorMessage.value = ''
  try {
    await adminDi.createTagUseCase.execute({
      name: name.value.trim(),
      subject: subject.value || null,
    })
    name.value = ''
    subject.value = ''
    await loadTags()
  } catch (error) {
    const message = error instanceof Error ? error.message : '创建标签失败。'
    errorMessage.value = message
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void loadTags()
})
</script>

<template>
  <section class="page">
    <header class="page__header">
      <h1 class="page__title">标签管理</h1>
    </header>
    <div class="card card--stack">
      <div class="filters">
        <label class="field">
          <span>名称</span>
          <input v-model="name" type="text" placeholder="标签名称" />
        </label>
        <label class="field">
          <span>学科</span>
          <select v-model="subject">
            <option value="">全部</option>
            <option value="MATH">数学</option>
            <option value="PHYSICS">物理</option>
          </select>
        </label>
        <button class="button" :class="{ 'button--busy': saving }" :disabled="saving" @click="handleCreate">
          {{ saving ? '新增中...' : '新增' }}
        </button>
      </div>
      <p v-if="errorMessage" class="helper helper--error">{{ errorMessage }}</p>
      <p v-else-if="loading" class="helper">加载中...</p>
      <template v-else>
        <ul v-if="tags.length" class="list">
          <li v-for="item in tags" :key="item.id" class="list__item">
            <div>
              <strong>{{ item.name }}</strong>
              <p class="helper">ID {{ item.id }} · {{ formatSubject(item.subject) }}</p>
            </div>
          </li>
        </ul>
        <p v-else class="helper">暂无标签。</p>
      </template>
    </div>
  </section>
</template>
