// pages/main/index.vue
<template>
  <Layout>
    <!-- Student Pages -->
    <personal-info
        v-if="currentPath === '/pages/student/PersonalInfo/index'"
        v-bind="currentProps"
    />
    <homework-upload
        v-if="currentPath === '/pages/student/HomeworkUpload/index'"
        v-bind="currentProps"
    />
    <equipment-application
        v-if="currentPath === '/pages/student/EquipmentApplication/index'"
        v-bind="currentProps"
    />

    <!-- Teacher Pages -->
    <teacher-personal-info
        v-if="currentPath === '/pages/teacher/PersonalInfo/index'"
        v-bind="currentProps"
    />
    <user-management
        v-if="currentPath === '/pages/teacher/UserManagement/index'"
        v-bind="currentProps"
    />
    <homework-management
        v-if="currentPath === '/pages/teacher/HomeworkManagement/index'"
        v-bind="currentProps"
    />
    <equipment-store
        v-if="currentPath === '/pages/teacher/equipment/Store/index'"
        v-bind="currentProps"
    />
    <equipment-borrow
        v-if="currentPath === '/pages/teacher/equipment/Borrow/index'"
        v-bind="currentProps"
    />
    <subject-page
        v-if="currentPath === '/pages/teacher/subject/index'"
        v-bind="currentProps"
    />
    <equipment-inventory
        v-if="currentPath === '/pages/teacher/equipment/Inventory/index'"
        v-bind="currentProps"
    />

    <!-- Guest Pages -->
    <guest-info
        v-if="currentPath === '/pages/guest/GuestInfo/index'"
        v-bind="currentProps"
    />

    <!-- Other Pages -->
    <homework-history
        v-if="currentPath === '/pages/homework-history/index'"
        v-bind="currentProps"
    />
    <homework-detail
        v-if="currentPath === '/pages/homework-history/detail/index'"
        v-bind="currentProps"
    />
    <resource-page
        v-if="currentPath === '/pages/resource/index'"
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
import { ref, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { useUserStore } from '@/store/user'

// Layout and Error components
import Layout from '@/components/layout/Layout.vue'
import ErrorPage from '@/pages/error/index.vue'

// Student components
import PersonalInfo from '../student/PersonalInfo/index.vue'
import HomeworkUpload from '../student/HomeworkUpload/index.vue'
import EquipmentApplication from '../student/EquipmentApplication/index.vue'

// Teacher components
import UserManagement from '../teacher/UserManagement/index.vue'
import TeacherPersonalInfo from '../teacher/PersonalInfo/index.vue'
import HomeworkManagement from '../teacher/HomeworkManagement/index.vue'
import EquipmentStore from '../teacher/equipment/Store/index.vue'
import EquipmentBorrow from '../teacher/equipment/Borrow/index.vue'
import SubjectPage from '../teacher/subject/index.vue'
import EquipmentInventory from '../teacher/equipment/Inventory/index.vue'

// Guest components
import GuestInfo from '../guest/GuestInfo/index.vue'

// Other components
import HomeworkHistory from '../homework-history/index.vue'
import HomeworkDetail from '../homework-history/detail/index.vue'
import ResourcePage from '../resource/index.vue'

const userStore = useUserStore()
const currentPath = ref('')
const currentProps = ref<Record<string, any>>({})
const loadError = ref(false)
const errorMessage = ref('')

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

// 加载组件的函数
const loadComponent = async (path: string) => {
  try {
    // 检查登录状态
    if (!userStore.userInfo) {
      uni.reLaunch({ url: '/pages/login/index' })
      return
    }

    currentPath.value = path
    loadError.value = false

    // 解析路径和参数
    const { basePath, query } = parseQuery(path)
    currentPath.value = basePath
    currentProps.value = query
  } catch (error) {
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
      defaultPath = '/pages/teacher/PersonalInfo/index'
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
