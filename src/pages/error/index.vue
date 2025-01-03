<template>
  <view class="error-container">
    <view class="error-content">
      <image
          src="/static/images/error.png"
          mode="aspectFit"
          class="error-image"
      />
      <text class="error-title">页面加载失败</text>
      <text class="error-message">{{ message }}</text>
      <view class="button-group">
        <button
            class="retry-button"
            @click="handleRetry"
            hover-class="button-hover"
        >
          重试
        </button>
        <button
            class="home-button"
            @click="handleBackHome"
            hover-class="button-hover"
        >
          返回首页
        </button>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const message = ref('很抱歉，页面暂时无法访问')

const handleRetry = () => {
  // 获取当前页面路由
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  if (currentPage?.options?.path) {
    const path = decodeURIComponent(currentPage.options.path)
    // 通知父组件重新加载
    uni.$emit('pageChange', path)
  }
}

const handleBackHome = () => {
  // 根据用户角色返回对应的首页
  let homePath
  if (userStore.userInfo?.userRole === 1) {
    homePath = '/pages/student/PersonalInfo/index'
  } else if (userStore.userInfo?.userRole === 2) {
    homePath = '/pages/teacher/UserManagement/index'
  } else {
    homePath = '/pages/guest/GuestInfo/index'
  }
  uni.$emit('pageChange', homePath)
}
</script>

<style lang="scss">
.error-container {
  min-height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 20px;
  box-sizing: border-box;
  background-color: #f8f9fa;

  .error-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    max-width: 600px;
    width: 100%;
    padding: 32px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

    .error-image {
      width: 200px;
      height: 200px;
      margin-bottom: 24px;
    }

    .error-title {
      font-size: 24px;
      color: #333;
      margin-bottom: 16px;
      font-weight: bold;
    }

    .error-message {
      font-size: 16px;
      color: #666;
      margin-bottom: 32px;
      line-height: 1.5;
    }

    .button-group {
      display: flex;
      gap: 16px;

      button {
        min-width: 120px;
        height: 40px;
        border-radius: 20px;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        border: none;
      }

      .retry-button {
        background: #1890ff;
        color: #fff;

        &.button-hover {
          background: darken(#1890ff, 10%);
        }
      }

      .home-button {
        background: #f0f0f0;
        color: #333;

        &.button-hover {
          background: darken(#f0f0f0, 10%);
        }
      }
    }
  }
}

// 移动端适配
@media screen and (max-width: 768px) {
  .error-container {
    padding: 16px;

    .error-content {
      padding: 24px;

      .error-image {
        width: 160px;
        height: 160px;
      }

      .error-title {
        font-size: 20px;
      }

      .error-message {
        font-size: 14px;
      }

      .button-group {
        width: 100%;
        flex-direction: column;

        button {
          width: 100%;
          margin: 0;
        }
      }
    }
  }
}

// 小程序适配
// #ifdef MP-WEIXIN
.error-container {
  .error-content {
    .button-group {
      button {
        // 重置小程序按钮的默认样式
        &::after {
          border: none;
        }
        margin: 0;
        padding: 0;
        line-height: 40px;
      }
    }
  }
}
// #endif
</style>
