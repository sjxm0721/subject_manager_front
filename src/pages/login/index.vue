<template>
  <view class="login-container">
    <view class="login-content">
      <!-- 左侧区域 -->
      <view class="login-left">
        <view class="embedded-devices">
          <image class="device-image" src="/static/images/embedded.png" mode="aspectFit"></image>
          <view class="device-list">
            <image class="chip" src="/static/images/chip.png" mode="aspectFit"></image>
            <image class="board" src="/static/images/board.png" mode="aspectFit"></image>
            <image class="screen" src="/static/images/screen.png" mode="aspectFit"></image>
          </view>
        </view>
      </view>

      <!-- 右侧登录表单 -->
      <view class="login-right">
        <view class="login-header">
          <image class="logo" src="/static/images/logo.png" mode="aspectFit"></image>
          <text class="title">浙江工商大学嵌入式/物联网作业系统</text>
        </view>

        <view class="login-form">
          <u-form
              :model="loginForm"
              ref="loginFormRef"
              :rules="rules"
              labelWidth="0"
          >
            <u-form-item prop="userAccount">
              <u-input
                  v-model="loginForm.userAccount"
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
                  v-model="loginForm.userPassword"
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
          </u-form>

          <u-button
              type="primary"
              @click="handleLogin"
              class="login-button"
              :loading="loading"
          >
            登录
          </u-button>
          <view class="captcha-container" v-show="captchaVisible">
            <view id="captcha-div" class="captcha-content"></view>
          </view>
          <view class="login-options">
            <text @tap="handleForgotPassword">忘记密码</text>
            <text @tap="handleRegister">注册账号</text>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const loginForm = reactive({
  userAccount: '',
  userPassword: '',
  captchaToken: ''  // 添加验证码token存储
})


const loading = ref(false)
const isMobile = ref(false)
const loginFormRef = ref()
const captchaVisible = ref(false)  // 控制验证码显示


const rules = {
  userAccount: [
    { required: true, message: '请输入学号/工号', trigger: ['blur', 'change'] }
  ],
  userPassword: [
    { required: true, message: '请输入密码', trigger: ['blur', 'change'] }
  ]
}

onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  isMobile.value = systemInfo.windowWidth <= 768
})

// 验证码初始化和处理
const initCaptcha = () => {
  const captchaConfig = {
    requestCaptchaDataUrl: "/api/user/gen?type=RANDOM",
    validCaptchaUrl: "/api/user/check",
    bindEl: "#captcha-div",

    validSuccess: async (res: any, c: any, t: any) => {
      loginForm.captchaToken = res.data.token
      t.destroyWindow()
      captchaVisible.value = false
      // 验证成功后直接进行登录
      await performLogin()
    },
    btnCloseFun: (el:any, tac:any) => {
      tac.destroyWindow();
      captchaVisible.value = false
      loading.value = false
    }
  }
  let style = {
    logoUrl: null// 去除logo
  }
  // 确保在web环境下运行并且资源已加载
  // #ifdef H5
  if (window.initTAC) {
    // 使用完整的资源路径
    window.initTAC("/static/captcha/tac", captchaConfig,style)
        .then(tac => {
          if (tac) {
            tac.init()
          } else {
            loading.value = false
          }
        })
        .catch(error => {
          loading.value = false
          uni.showToast({
            title: '验证码加载失败',
            icon: 'none'
          })
        })
  }
  // #endif
}

// 显示验证码
const showCaptcha = () => {
  captchaVisible.value = true
  // 增加延迟确保DOM已更新
  setTimeout(() => {
    const captchaDiv = document.querySelector('#captcha-div')
    if (captchaDiv) {
      initCaptcha()
    } else {
      loading.value = false
    }
  }, 300) // 增加延迟时间
}

// 执行登录操作
const performLogin = async () => {
  try {
    const res = await userStore.login({
      userAccount: loginForm.userAccount,
      userPassword: loginForm.userPassword,
      captchaToken: loginForm.captchaToken
    })

    uni.showToast({
      title: '登录成功',
      icon: 'success'
    })

    // 根据角色跳转
    let initialPath
    if (userStore.userInfo?.userRole === 1) {
      initialPath = '/pages/student/PersonalInfo/index'
    } else if(userStore.userInfo?.userRole === 2) {
      initialPath = '/pages/teacher/PersonalInfo/index'
    } else {
      initialPath = '/pages/guest/GuestInfo/index'
    }

    uni.reLaunch({
      url: `/pages/main/index?path=${encodeURIComponent(initialPath)}`
    })
  } catch (error: any) {
    uni.showToast({
      title: error?.message || '登录失败',
      icon: 'none'
    })
    loading.value = false
    loginForm.userAccount = ''
    loginForm.userPassword = ''
  }
}

const handleLogin = async () => {
  if (!loginFormRef.value) return

  try {
    loading.value = true
    const valid = await loginFormRef.value.validate()

    if (valid) {
      // 在web端显示验证码
      // #ifdef H5
      if (!loginForm.captchaToken) {
        showCaptcha()
        return // 重要：等待验证码验证成功后再继续
      }
      // #endif

      // 在非web端直接登录
      // #ifndef H5
      await performLogin()
      // #endif
    }
  } catch (error: any) {
    uni.showToast({
      title: error?.message || '验证失败',
      icon: 'none'
    })
    loading.value = false
  }
}


const handleForgotPassword = () => {
  uni.navigateTo({
    url: '/pages/forgot-password/index'
  })
}

const handleRegister = () => {
  uni.navigateTo({
    url: '/pages/register/index'
  })
}
</script>

<style lang="scss">
.login-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;

  .login-content {
    width: 100%;
    max-width: 1200px;
    display: flex;
    background: #fff;
    border-radius: 16rpx;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    overflow: hidden;

    .login-left {
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

    .login-right {
      flex: 1;
      padding: 40px;

      .login-header {
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

      .login-form {
        max-width: 360px;
        margin: 0 auto;

        .input-item {
          margin-bottom: 20px;
        }

        .login-button {
          width: 100%;
          height: 44px;
          margin-top: 30px;
        }

        .login-options {
          display: flex;
          justify-content: space-between;
          margin-top: 20px;
          font-size: 14px;
          color: #666;

          text {
            padding: 5px;
          }
        }
      }
    }
  }
}

// 移动端适配
@media screen and (max-width: 768px) {
  .login-container {
    padding: 10px;

    .login-content {
      flex-direction: column;

      .login-left {
        display: none;
      }

      .login-right {
        padding: 20px;

        .login-header {
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
.login-container {
  .login-content {
    .login-left {
      display: none;
    }

    .login-right {
      .login-header {
        .title {
          font-size: 18px;
        }
      }
    }
  }
}

// #endif

.captcha-container {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 999;

  .captcha-content {
    background: #fff;
    padding: 20px;
    border-radius: 8px;
    max-width: 90%;
    max-height: 90%;
  }
}
</style>
