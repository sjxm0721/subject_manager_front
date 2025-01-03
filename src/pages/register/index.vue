// pages/register/index.vue
<template>
  <view class="register-container">
    <view class="register-content">
      <!-- 左侧区域 -->
      <view class="register-left">
        <view class="embedded-devices">
          <image class="device-image" src="/static/images/embedded.png" mode="aspectFit"></image>
          <view class="device-list">
            <image class="chip" src="/static/images/chip.png" mode="aspectFit"></image>
            <image class="board" src="/static/images/board.png" mode="aspectFit"></image>
            <image class="screen" src="/static/images/screen.png" mode="aspectFit"></image>
          </view>
        </view>
      </view>

      <!-- 右侧注册表单 -->
      <view class="register-right">
        <view class="register-header">
          <image class="logo" src="/static/images/logo.png" mode="aspectFit"></image>
          <text class="title">浙江工商大学嵌入式/物联网作业系统</text>
        </view>

        <view class="register-form">
          <u-form
              :model="registerForm"
              ref="registerFormRef"
              :rules="rules"
              labelWidth="0"
          >
            <u-form-item prop="userAccount">
              <u-input
                  v-model="registerForm.userAccount"
                  placeholder="请输入学号/工号"
                  :border="isMobile ? 'bottom' : 'surround'"
                  class="input-item"
              >
                <template #prefix>
                  <u-icon name="account" size="20"></u-icon>
                </template>
              </u-input>
            </u-form-item>

            <u-form-item prop="userPassword">
              <u-input
                  v-model="registerForm.userPassword"
                  type="password"
                  placeholder="请输入密码"
                  :border="isMobile ? 'bottom' : 'surround'"
                  class="input-item"
              >
                <template #prefix>
                  <u-icon name="lock" size="20"></u-icon>
                </template>
              </u-input>
            </u-form-item>

            <u-form-item prop="checkPassword">
              <u-input
                  v-model="registerForm.checkPassword"
                  type="password"
                  placeholder="请再次输入密码"
                  :border="isMobile ? 'bottom' : 'surround'"
                  class="input-item"
              >
                <template #prefix>
                  <u-icon name="lock-fill" size="20"></u-icon>
                </template>
              </u-input>
            </u-form-item>
          </u-form>

          <u-button
              type="primary"
              @click="handleRegister"
              class="register-button"
              :loading="loading"
          >
            注册
          </u-button>

          <view class="register-options">
            <text @tap="handleBackToLogin">返回登录</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { userApi } from '@/api/user'
import type { RegisterRequest } from '@/types/user'

const registerForm = ref<RegisterRequest>({
  userAccount: '',
  userPassword: '',
  checkPassword: ''
})

const loading = ref(false)
const isMobile = ref(false)
const registerFormRef = ref()

const rules = {
  userAccount: [
    { required: true, message: '请输入学号/工号', trigger: ['blur', 'change'] },
    { min: 5, message: '账号不能少于5个字符', trigger: ['blur', 'change'] }
  ],
  userPassword: [
    { required: true, message: '请输入密码', trigger: ['blur', 'change'] },
    { min: 6, message: '密码不能少于6个字符', trigger: ['blur', 'change'] }
  ],
  checkPassword: [
    { required: true, message: '请再次输入密码', trigger: ['blur', 'change'] },
    {
      validator: (rule: any, value: string, callback: Function) => {
        if (value !== registerForm.value.userPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: ['blur', 'change']
    }
  ]
}

onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  isMobile.value = systemInfo.windowWidth <= 768
})

const handleRegister = async () => {
  if (!registerFormRef.value) return

  try {
    loading.value = true
    // 首先进行表单验证
    const valid = await registerFormRef.value.validate()

    if (valid) {
      await userApi.register(registerForm.value)

      uni.showToast({
        title: '注册成功',
        icon: 'success'
      })

      // 延迟跳转到登录页
      setTimeout(() => {
        uni.redirectTo({ url: '/pages/login/index' })
      }, 1500)
    }
  } catch (error: any) {
    uni.showToast({
      title: error?.message || '注册失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

const handleBackToLogin = () => {
  uni.navigateBack()
}
</script>

<style lang="scss">
.register-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;

  .register-content {
    width: 100%;
    max-width: 1200px;
    display: flex;
    background: #fff;
    border-radius: 16rpx;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    overflow: hidden;

    .register-left {
      flex: 1;
      padding: 40px;
      background: #f8f9fa;
      display: flex;
      align-items: center;
      justify-content: center;

      .embedded-devices {
        max-width: 400px;

        .device-image {
          width: 100%;
          height: 200px;
          margin-bottom: 20px;
        }

        .device-list {
          display: flex;
          justify-content: space-around;

          image {
            width: 80px;
            height: 80px;
          }
        }
      }
    }

    .register-right {
      flex: 1;
      padding: 40px;

      .register-header {
        text-align: center;
        margin-bottom: 40px;

        .logo {
          width: 80px;
          height: 80px;
          margin-bottom: 16px;
        }

        .title {
          font-size: 24px;
          font-weight: bold;
          color: #333;
        }
      }

      .register-form {
        max-width: 360px;
        margin: 0 auto;

        .input-item {
          margin-bottom: 20px;
        }

        .register-button {
          width: 100%;
          height: 44px;
          margin-top: 30px;
        }

        .register-options {
          display: flex;
          justify-content: center;
          margin-top: 20px;
          font-size: 14px;
          color: #666;

          text {
            padding: 5px;
            cursor: pointer;

            &:hover {
              color: #1890ff;
            }
          }
        }
      }
    }
  }
}

// 移动端适配
@media screen and (max-width: 768px) {
  .register-container {
    padding: 10px;

    .register-content {
      flex-direction: column;

      .register-left {
        display: none;
      }

      .register-right {
        padding: 20px;

        .register-header {
          margin-bottom: 30px;

          .title {
            font-size: 20px;
          }
        }
      }
    }
  }
}

// 小程序适配
// #ifdef MP-WEIXIN
.register-container {
  .register-content {
    .register-left {
      display: none;
    }

    .register-right {
      .register-header {
        .title {
          font-size: 18px;
        }
      }
    }
  }
}
// #endif
</style>
