<template>
  <view class="auth-container">
    <view class="auth-content">
      <!-- 左侧区域 -->
      <view class="auth-left">
        <view class="embedded-devices">
          <image class="device-image" src="/static/images/embedded.png" mode="aspectFit"></image>
          <view class="device-list">
            <image class="screen" src="/static/images/screen.png" mode="aspectFit"></image>
          </view>
        </view>
      </view>

      <!-- 右侧表单 -->
      <view class="auth-right">
        <view class="auth-header">
          <image class="logo" src="/static/images/logo.png" mode="aspectFit"></image>
          <text class="title">重置密码</text>
          <text class="subtitle">请联系管理员重置密码</text>
        </view>

        <view class="auth-form">
          <view class="contact-info">
            <u-cell-group>
              <u-cell
                  icon="mail"
                  title="管理员邮箱"
                  value="admin@zjgsu.edu.cn"
                  isLink
              />
              <u-cell
                  icon="phone"
                  title="联系电话"
                  value="0571-88888888"
                  isLink
              />
            </u-cell-group>
          </view>

          <u-button
              type="primary"
              @click="goToLogin"
              class="submit-button"
          >
            返回登录
          </u-button>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted, ref } from 'vue'

const isMobile = ref(false)

onMounted(() => {
  const systemInfo = uni.getSystemInfoSync()
  isMobile.value = systemInfo.windowWidth <= 768
})

const goToLogin = () => {
  uni.redirectTo({
    url: '/pages/login/index'
  })
}
</script>

<style lang="scss">
// 共享样式，可以放在单独的scss文件中
.auth-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;

  .auth-content {
    width: 100%;
    max-width: 1200px;
    display: flex;
    background: #fff;
    border-radius: 16rpx;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    overflow: hidden;

    .auth-left {
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

    .auth-right {
      flex: 1;
      padding: 40px;

      .auth-header {
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
          margin-bottom: 8px;
        }

        .subtitle {
          font-size: 14px;
          color: #666;
        }
      }

      .auth-form {
        max-width: 360px;
        margin: 0 auto;

        .input-item {
          margin-bottom: 20px;
        }

        .submit-button {
          width: 100%;
          height: 44px;
          margin-top: 30px;
        }

        .auth-options {
          text-align: center;
          margin-top: 20px;
          font-size: 14px;
          color: #666;

          text {
            padding: 5px;
            color: #2979ff;
          }
        }

        .contact-info {
          margin: 20px 0;
        }
      }
    }
  }
}

// 移动端适配
@media screen and (max-width: 768px) {
  .auth-container {
    padding: 10px;

    .auth-content {
      flex-direction: column;

      .auth-left {
        display: none;
      }

      .auth-right {
        padding: 20px;

        .auth-header {
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
.auth-container {
  .auth-content {
    .auth-left {
      display: none;
    }

    .auth-right {
      .auth-header {
        .title {
          font-size: 18px;
        }
      }
    }
  }
}
// #endif
</style>
