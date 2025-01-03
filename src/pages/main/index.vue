// pages/main/index.vue
<template>
  <Layout>
    <component
        :is="currentComponent"
        v-if="currentComponent"
        v-bind="currentProps"
    />
    <error-page
        v-if="loadError"
        :message="errorMessage"
        @retry="handleRetry"
    />
  </Layout>
</template>

<script setup lang="ts">
import { ref, shallowRef,onUnmounted } from 'vue'
import Layout from '@/components/layout/Layout.vue'
import ErrorPage from '@/pages/error/index.vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const currentComponent = shallowRef<any>(null)
const currentProps = ref<Record<string, any>>({})
const loadError = ref(false)
const errorMessage = ref('')
const currentPath = ref('')

// 组件映射表
const componentMap = {
  // 学生相关页面
  '/pages/student/PersonalInfo/index': () => import('../student/PersonalInfo/index.vue'),
  '/pages/student/HomeworkUpload/index': () => import('../student/HomeworkUpload/index.vue'),
  '/pages/student/EquipmentApplication/index': () => import('../student/EquipmentApplication/index.vue'),

  // 教师相关页面
  '/pages/teacher/UserManagement/index': () => import('../teacher/UserManagement/index.vue'),
  '/pages/teacher/HomeworkManagement/index': () => import('../teacher/HomeworkManagement/index.vue'),
  '/pages/teacher/equipment/Store/index': () => import('../teacher/equipment/Store/index.vue'),
  '/pages/teacher/equipment/Borrow/index': () => import('../teacher/equipment/Borrow/index.vue'),
  '/pages/teacher/subject/index': () => import('../teacher/subject/index.vue'),
  '/pages/teacher/equipment/Inventory/index': () => import('../teacher/equipment/Inventory/index.vue'),

  // 访客页面
  '/pages/guest/GuestInfo/index': () => import('../guest/GuestInfo/index.vue'),

  // 其他页面
  '/pages/homework-history/index': () => import('../homework-history/index.vue'),
  '/pages/homework-history/detail/index': () => import('../homework-history/detail/index.vue'),
  '/pages/resource/index': () => import('../resource/index.vue')
}

// 解析URL参数
const parseQuery = (path: string) => {
  const [basePath, queryString] = path.split('?')
  const query: Record<string, string> = {}

  if (queryString) {
    queryString.split('&').forEach(param => {
      const [key, value] = param.split('=')
      if (key && value) {
        query[key] = decodeURIComponent(value)
      }
    })
  }

  return {
    basePath,
    query
  }
}

// 动态导入组件的函数
const loadComponent = async (path: string) => {
  try {
    // 检查登录状态
    if (!userStore.userInfo) {
      uni.reLaunch({ url: '/pages/login/index' })
      return
    }

    // 保存当前路径用于重试
    currentPath.value = path
    loadError.value = false

    // 解析路径和参数
    const { basePath, query } = parseQuery(path)

    // 查找对应的组件加载函数
    const importFunc = componentMap[basePath]
    if (!importFunc) {
      throw new Error(`找不到对应的页面组件: ${basePath}`)
    }

    // 加载组件
    const comp = await importFunc()
    currentComponent.value = comp.default
    // 设置组件属性
    currentProps.value = query
  } catch (error) {
    console.error('加载组件失败:', error)
    loadError.value = true
    errorMessage.value = '页面加载失败，请稍后重试'
  }
}

// 处理重试
const handleRetry = () => {
  if (currentPath.value) {
    loadComponent(currentPath.value)
  }
}

// 监听页面加载
onLoad((options: any) => {
  if (options.path) {
    loadComponent(decodeURIComponent(options.path))
  } else {
    // 根据用户角色加载默认页面
    let defaultPath
    if (userStore.userInfo?.userRole === 1) {
      defaultPath = '/pages/student/PersonalInfo/index'
    } else if (userStore.userInfo?.userRole === 2) {
      defaultPath = '/pages/teacher/UserManagement/index'
    } else {
      defaultPath = '/pages/guest/GuestInfo/index'
    }
    loadComponent(defaultPath)
  }
})

// 页面切换事件处理
const handlePageChange = (path: string) => {
  loadComponent(path)
}

// 监听页面切换事件
uni.$on('pageChange', handlePageChange)

// 组件卸载时清理事件监听
onUnmounted(() => {
  uni.$off('pageChange', handlePageChange)
})
</script>

<style lang="scss">
page {
  height: 100%;
}
</style>
