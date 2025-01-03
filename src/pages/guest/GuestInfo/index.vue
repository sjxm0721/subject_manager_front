<template>
    <view class="info-page" :class="{ 'info-page-mobile': isMobile }">
      <view class="page-header">
        <text class="title">信息管理</text>
      </view>

      <view class="info-form">
        <view class="form-section">
          <text class="section-title">个人信息</text>

          <view class="form-item required">
            <text class="label">姓名</text>
            <u-input
                v-model="form.userName"
                placeholder="请输入姓名"
                :border="false"
                class="custom-input"
            />
          </view>

          <view class="form-item required">
            <text class="label">账号</text>
            <u-input
                v-model="form.userAccount"
                placeholder="请输入账号"
                :border="false"
                class="custom-input"
                disabled
            />
          </view>

          <view class="form-item">
            <text class="label">电话</text>
            <u-input
                v-model="form.phone"
                placeholder="请输入电话"
                :border="false"
                class="custom-input"
            />
          </view>
        </view>

        <view class="form-actions">
          <u-button
              @click="handleSave"
              :disabled="saving"
          >保存</u-button>
        </view>
      </view>
    </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, onBeforeUnmount } from 'vue'
import Layout from '@/components/layout/Layout.vue'
import { useUserStore } from '@/store/user'
import type { UserInfo } from '@/types/user'

const userStore = useUserStore()
const isMobile = ref(false)
const saving = ref(false)

// 表单数据
interface FormState extends Partial<UserInfo> {
  userName: string
  userAccount: string
  phone: string
}

const form = reactive<FormState>({
  userName: userStore.userInfo?.userName || '',
  userAccount: userStore.userInfo?.userAccount || '',
  phone: userStore.userInfo?.phone || ''
})

// 检查设备类型
const checkDevice = () => {
  isMobile.value = window.innerWidth <= 768
}

const handleSave = async () => {
  if (!form.userName) {
    uni.showToast({
      title: '请填写姓名',
      icon: 'error'
    })
    return
  }

  try {
    saving.value = true
    // 使用与学生信息管理相同的更新接口
    await userStore.updateUserInfo({
      userName: form.userName,
      phone: form.phone
    })

    uni.showToast({
      title: '保存成功',
      icon: 'success'
    })
    await userStore.getCurrentUser()
  } catch (error: any) {
    uni.showToast({
      title: error.message || '保存失败',
      icon: 'error'
    })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  checkDevice()
  window.addEventListener('resize', checkDevice)

  // 初始化表单数据
  if (userStore.userInfo) {
    form.userName = userStore.userInfo.userName
    form.userAccount = userStore.userInfo.userAccount
    form.phone = userStore.userInfo.phone
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkDevice)
})
</script>

<style lang="scss" scoped>
.info-page {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;

  .page-header {
    margin-bottom: 24px;
    padding: 0 16px;

    .title {
      font-size: 24px;
      font-weight: bold;
      //color: #1a1a1a;
    }
  }

  .info-form {
    background-color: #fff;
    padding: 32px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

    .form-section {
      margin-bottom: 32px;

      .section-title {
        font-size: 18px;
        font-weight: bold;
        //color: #1a1a1a;
        margin-bottom: 24px;
        padding-bottom: 12px;
        border-bottom: 1px solid #eee;
      }
    }

    .form-item {
      margin-bottom: 24px;

      .label {
        display: block;
        margin-bottom: 8px;
        color: #666;
      }

      &.required .label::before {
        content: '*';
        color: #ff4d4f;
        margin-right: 4px;
      }

      .custom-input {
        background-color: #f5f7fa;
        border-radius: 4px;
        padding: 0 12px;
      }
    }

    .form-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid #eee;

      :deep(.u-button) {
        min-width: 120px;
      }
    }
  }
}

// 移动端适配
.info-page-mobile {
  .info-form {
    padding: 16px;
    margin: 0 16px;

    .form-section {
      margin-bottom: 24px;

      .section-title {
        font-size: 16px;
        margin-bottom: 16px;
      }
    }

    .form-actions {
      flex-direction: column;
      gap: 12px;

      :deep(.u-button) {
        width: 100%;
      }
    }
  }
}
</style>
