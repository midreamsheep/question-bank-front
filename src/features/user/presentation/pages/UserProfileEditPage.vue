<script setup lang="ts">
/**
 * @file User profile edit page: update nickname/avatarFileId.
 */
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useUserDi } from '../../di'
import { useFileDi } from '../../../file/di'
import { runtimeConfig } from '../../../../infrastructure/config/runtimeConfig'
import type { UserProfile } from '../../domain/models'

const userDi = useUserDi()
const fileDi = useFileDi()
const router = useRouter()

const loading = ref(false)
const saving = ref(false)
const errorMessage = ref('')
const successMessage = ref('')

const me = ref<UserProfile | null>(null)
const nickname = ref('')
const avatarFileId = ref('')
const avatarUploading = ref(false)
const avatarPreviewUrl = ref('')
const avatarInputRef = ref<HTMLInputElement | null>(null)

const nicknameTrimmed = computed(() => nickname.value.trim())

const avatarFallbackText = computed(() => {
  const base = nicknameTrimmed.value || me.value?.username || 'U'
  return base.trim().slice(0, 1).toUpperCase()
})

function resolveContentUrl(rawUrl: string): string {
  const trimmed = String(rawUrl).trim()
  if (!trimmed) return ''
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  if (trimmed.startsWith('/')) {
    const base =
      runtimeConfig.apiBaseUrl.startsWith('http') ? runtimeConfig.apiBaseUrl : window.location.origin
    return new URL(trimmed, base).toString()
  }
  return trimmed
}

async function loadMe(): Promise<void> {
  loading.value = true
  errorMessage.value = ''
  try {
    const profile = await userDi.getMeUseCase.execute()
    me.value = profile
    nickname.value = profile.nickname ?? ''
    avatarFileId.value = profile.avatarFileId ? String(profile.avatarFileId) : ''
    // We don't have a stable public url for an existing fileId (only fileId is stored).
    // Preview will be available after a new upload in this session.
    avatarPreviewUrl.value = ''
  } catch (error) {
    const message = error instanceof Error ? error.message : '加载资料失败。'
    errorMessage.value = message
  } finally {
    loading.value = false
  }
}

function validate(): string | null {
  const nextNickname = nicknameTrimmed.value
  if (!nextNickname) return '昵称为必填。'
  if (nextNickname.length > 20) return '昵称长度不能超过 20。'
  const nextAvatar = avatarFileId.value.trim()
  if (nextAvatar && !/^\d+$/.test(nextAvatar)) return '头像文件ID必须为数字字符串。'
  return null
}

function openAvatarPicker(): void {
  if (avatarUploading.value) return
  avatarInputRef.value?.click()
}

async function handleAvatarPick(event: Event): Promise<void> {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  avatarUploading.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const uploaded = await fileDi.uploadUseCase.execute(file)
    avatarFileId.value = uploaded.id
    avatarPreviewUrl.value = resolveContentUrl(uploaded.shareUrl)
    if (!avatarPreviewUrl.value) {
      errorMessage.value = '头像上传成功，但服务端未返回 shareUrl，无法预览（请检查 files upload 响应字段）。'
    }
    successMessage.value = '头像已上传，记得点击“保存”。'
  } catch (error) {
    const message = error instanceof Error ? error.message : '头像上传失败。'
    errorMessage.value = message
  } finally {
    avatarUploading.value = false
    input.value = ''
  }
}

function handleClearAvatar(): void {
  avatarFileId.value = ''
  avatarPreviewUrl.value = ''
}

async function handleSave(): Promise<void> {
  const message = validate()
  if (message) {
    errorMessage.value = message
    return
  }

  saving.value = true
  errorMessage.value = ''
  successMessage.value = ''
  try {
    const updated = await userDi.updateProfileUseCase.execute({
      nickname: nicknameTrimmed.value,
      avatarFileId: avatarFileId.value.trim() ? avatarFileId.value.trim() : null,
    })
    successMessage.value = '保存成功。'
    // Notify layout user panel to refresh without a full reload.
    window.dispatchEvent(new CustomEvent('vf:me-updated', { detail: updated }))
    await router.push('/me/profile')
  } catch (error) {
    const msg = error instanceof Error ? error.message : '保存失败。'
    errorMessage.value = msg
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  void loadMe()
})
</script>

<template>
  <section class="page page--narrow">
    <header class="page__header">
      <h1 class="page__title">编辑资料</h1>
      <p class="page__lead" v-if="me">用户名：{{ me.username }}</p>
    </header>
    <div class="card card--stack">
      <p v-if="errorMessage" class="helper helper--error">{{ errorMessage }}</p>
      <p v-if="successMessage" class="helper">{{ successMessage }}</p>
      <p v-if="loading" class="helper">加载中...</p>
      <template v-else>
        <label class="field">
          <span>昵称</span>
          <input v-model="nickname" type="text" placeholder="1-20 字符" />
        </label>
        <div class="card card--stack">
          <h2 class="card__title">头像</h2>
          <div class="profile-avatar">
            <button
              class="profile-avatar__preview"
              type="button"
              :disabled="avatarUploading"
              @click="openAvatarPicker"
              title="选择图片并上传"
            >
              <img v-if="avatarPreviewUrl" :src="avatarPreviewUrl" alt="avatar preview" />
              <span v-else class="profile-avatar__fallback">{{ avatarFallbackText }}</span>
              <span v-if="avatarUploading" class="profile-avatar__overlay">上传中...</span>
            </button>
            <div class="profile-avatar__meta">
              <p class="helper">点击左侧头像选择图片后会自动上传；最后点击“保存”生效。</p>
              <div class="actions">
                <button
                  class="button button--ghost"
                  type="button"
                  :class="{ 'button--busy': avatarUploading }"
                  :disabled="avatarUploading"
                  @click="openAvatarPicker"
                >
                  选择图片
                </button>
                <button
                  class="button button--ghost"
                  type="button"
                  :disabled="avatarUploading || (!avatarFileId && !avatarPreviewUrl)"
                  @click="handleClearAvatar"
                >
                  清除
                </button>
              </div>
              <input
                ref="avatarInputRef"
                class="profile-avatar__input"
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                :disabled="avatarUploading"
                @change="handleAvatarPick"
              />
            </div>
          </div>
        </div>

        <div class="actions">
          <button class="button" :class="{ 'button--busy': saving }" :disabled="saving" @click="handleSave">
            {{ saving ? '保存中...' : '保存' }}
          </button>
          <router-link class="button button--ghost" to="/me/profile">取消</router-link>
        </div>
      </template>
    </div>
  </section>
</template>
