<template>
  <view class="layout-container" :class="{ 'layout-mobile': isMobile }">
    <!-- 移动端顶部导航栏 -->
    <view v-if="isMobile" class="mobile-header">
      <uni-icons
          @click="toggleMobileMenu"
          :type="mobileMenuOpen ? 'close' : 'bars'"
          size="24"
          color="#fff"
      />
      <text class="header-title">浙江工商大学作业管理系统</text>
    </view>

    <!-- 侧边栏导航 -->
    <view
        class="sidebar"
        :class="{
        'sidebar-mobile': isMobile,
        'sidebar-mobile-open': mobileMenuOpen
      }"
    >
      <view class="logo-container">
        <image src="/static/images/logo.png" mode="aspectFit" class="logo" />
      </view>

      <view class="user-info">
        <uni-card :is-shadow="false">
          <template #title>
            <view class="user-info-header">
              <uni-icons type="person" size="20" color="#fff"/>
              <text class="welcome">{{ userStore.userInfo?.userName || '未登录' }}</text>
            </view>
          </template>
          <view class="user-info-content">
            <text class="role-tag">{{ getRoleLabel() }}</text>
            <view class="logout-btn" @click="handleLogout">
              <uni-icons type="logout" size="16" color="#fff" />
              <text>退出登录</text>
            </view>
          </view>
        </uni-card>
      </view>

      <scroll-view scroll-y class="menu-list">
        <template v-for="item in getCurrentMenuConfig()" :key="item.title">
          <!-- 父级菜单项 -->
          <view
              class="menu-item"
              :class="{
        'active': !item.children && currentPath === item.path,
        'parent-item': item.children
      }"
              @click="item.children ? toggleSubmenu(item.title) : handleMenuClick(item)"
          >
            <view class="menu-item-content">
              <uni-icons :type="item.icon" size="18" color="#fff" />
              <text class="menu-text">{{ item.title }}</text>
            </view>
            <uni-icons
                v-if="item.children"
                :type="expandedMenus.includes(item.title) ? 'arrow-up' : 'arrow-down'"
                size="14"
                color="#fff"
            />
          </view>

          <!-- 子菜单项 -->
          <view
              v-if="item.children"
              class="submenu"
              :class="{ 'submenu-expanded': expandedMenus.includes(item.title) }"
          >
            <view
                v-for="child in item.children"
                :key="child.path"
                class="submenu-item"
                :class="{ 'active': currentPath === child.path }"
                @click="handleMenuClick(child)"
            >
              <uni-icons :type="child.icon" size="16" color="#fff" />
              <text class="menu-text">{{ child.title }}</text>
            </view>
          </view>
        </template>
      </scroll-view>
    </view>

    <!-- 主内容区域 -->
    <view
        class="main-content"
        :class="{ 'main-content-mobile': isMobile }"
    >
      <slot></slot>
    </view>

    <!-- 移动端遮罩层 -->
    <uni-transition
        v-if="isMobile"
        :show="mobileMenuOpen"
        :mode-class="['fade']"
    >
      <view class="mobile-mask" @click="toggleMobileMenu"></view>
    </uni-transition>
  </view>
</template>

<script setup lang="ts">
import { homeworkApi } from '@/api/homework'
import { ref, onMounted, onBeforeUnmount } from 'vue'
import { useUserStore } from '@/store/user'

// 类型定义
interface MenuItem {
  title: string
  path: string
  icon: string
}

// store
const userStore = useUserStore()

// 响应式状态
const isMobile = ref(false)
const mobileMenuOpen = ref(false)
const currentPath = ref('')

// 添加年份状态管理
const yearList = ref<number[]>([])


// 菜单配置
// 角色菜单配置
const menuConfigs = {
  student: [
    {
      title: '信息管理',
      path: '/pages/student/PersonalInfo/index',
      icon: 'info'
    },
    {
      title: '作业上传',
      path: '/pages/student/HomeworkUpload/index',
      icon: 'upload'
    },
    {
      title: '器材申请',
      path: '/pages/student/EquipmentApplication/index',
      icon: 'gear'
    },
    {
      title: '历年作品',
      icon: 'folder',
      children: [] as {
        title: string
        path: string
        icon: string
      }[]
    }
  ],
  teacher: [
    {
      title: '信息管理',
      path: '/pages/teacher/PersonalInfo/index',
      icon: 'info'
    },
    {
      title: '用户管理',
      path: '/pages/teacher/UserManagement/index',
      icon: 'staff'
    },
    {
      title: '课程管理',
      path: '/pages/teacher/subject/index',
      icon: 'map'
    },
    {
      title: '器材管理',
      icon: 'settings',
      children: [
        {
          title: '器材入库',
          path: '/pages/teacher/equipment/Store/index',
          icon: 'plus'
        },
        {
          title: '器材外借',
          path: '/pages/teacher/equipment/Borrow/index',
          icon: 'upload'
        },
        {
          title: '器材清单',
          path: '/pages/teacher/equipment/Inventory/index',
          icon: 'list'
        }
      ]
    },
    {
      title: '作业管理',
      path: '/pages/teacher/HomeworkManagement/index',
      icon: 'calendar'
    },
    {
      title: '历年作品',
      icon: 'folder',
      children: [] as {
        title: string
        path: string
        icon: string
      }[]
    }
  ],
  guest: [
    {
      title: '信息管理',
      path: '/pages/guest/GuestInfo/index',
      icon: 'info'
    },
    {
      title: '历年作品',
      icon: 'folder',
      children: [] as {
        title: string
        path: string
        icon: string
      }[]
    }
  ]
} as const

const LAST_PATH_KEY = 'last_visited_path'
let isNavigating = false

// 防抖函数
const debounce = (fn: Function, delay: number) => {
  let timer: NodeJS.Timeout | null = null
  return (...args: any[]) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(null, args)
    }, delay)
  }
}



// 添加展开状态管理
const expandedMenus = ref<string[]>([])

// 切换展开/折叠状态
const toggleSubmenu = (title: string) => {
  const index = expandedMenus.value.indexOf(title)
  if (index === -1) {
    expandedMenus.value.push(title)
  } else {
    expandedMenus.value.splice(index, 1)
  }
}

// 获取当前用户菜单配置
const getCurrentMenuConfig = () => {
  if (!userStore.userInfo) {
    userStore.logout()
    return
  }

  let config
  if (userStore.userInfo.userRole === 1) {
    config = menuConfigs.student
  } else if (userStore.userInfo.userRole === 2) {
    config = menuConfigs.teacher
  } else if (userStore.userInfo.userRole === 3) {
    config = menuConfigs.guest
  } else {
    userStore.logout()
    return
  }
  // 找到历年作品菜单
  const worksMenu = config.find(item => item.title === '历年作品')
  if (worksMenu && yearList.value.length > 0) {
    // 动态生成年份子菜单
    worksMenu.children = yearList.value.map(year => ({
      title: `${year}年`,
      path: `/pages/homework-history/index?year=${year}`,
      icon: 'calendar'
    }))
  }

  return config
}



// 获取年份数据的方法
const getYearList = async () => {
  try {
    if (!userStore.userInfo) return

    // 根据角色调用不同的接口
    const response = userStore.userInfo.userRole === 2
        ? await homeworkApi.getHomeworkYearTeacher()
        : await homeworkApi.getHomeworkYear()

    yearList.value = response
  } catch (error) {
    console.error('获取年份数据失败:', error)
    uni.showToast({
      title: '获取年份数据失败',
      icon: 'error'
    })
  }
}


// 获取角色标签
const getRoleLabel = () => {
  if (!userStore.userInfo) {
    userStore.logout()
  }
  else{
    if(userStore.userInfo.userRole===1){
      return '学生'
    }
    else if(userStore.userInfo.userRole===2){
      return '教师'
    }
    else if(userStore.userInfo.userRole===3){
      return '访客'
    }
    else{
      userStore.logout()
    }
  }
}

// 检查设备类型
const checkDevice = () => {
  try {
    const systemInfo = uni.getSystemInfoSync()
    isMobile.value = systemInfo.windowWidth <= 768
  } catch (error) {
    console.error('获取设备信息失败:', error)
    isMobile.value = false
  }
}

// 菜单点击处理方法
const handleMenuClick = async (item: MenuItem) => {
  if (isNavigating) {
    console.log('导航正在进行中，跳过此次点击')
    return
  }

  if (item.path === '/pages/login/index') {
    await uni.reLaunch({ url: item.path })
    return
  }

  try {
    isNavigating = true

    // 更新 URL
    const newUrl = `/pages/main/index?path=${encodeURIComponent(item.path)}`
    history.replaceState(null, '', newUrl)

    // 保存路径
    localStorage.setItem(LAST_PATH_KEY, item.path)

    // 更新当前路径
    currentPath.value = item.path

    // 触发页面更新事件
    uni.$emit('pageChange', item.path)

    if (isMobile.value) {
      mobileMenuOpen.value = false
    }
  } catch (error) {
    console.error('导航失败:', error)
  } finally {
    // 设置延迟后才允许下一次导航
    setTimeout(() => {
      isNavigating = false
    }, 100)
  }
}



// 修改退出登录处理
const handleLogout = async () => {
  if (isNavigating) return

  try {
    isNavigating = true
    localStorage.removeItem(LAST_PATH_KEY)
    await userStore.logout()

    uni.showToast({
      title: '退出成功',
      icon: 'success'
    })

    // 使用 redirectTo 替代 reLaunch
    await uni.redirectTo({
      url: '/pages/login/index'
    })
  } catch (error) {
    uni.showToast({
      title: '退出失败',
      icon: 'error'
    })
  } finally {
    isNavigating = false
  }
}


// 切换移动端菜单
const toggleMobileMenu = () => {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

// 生命周期钩子
onMounted(() => {
  checkDevice()
  uni.onWindowResize(() => {
    checkDevice()
  })
  // 获取年份数据
  getYearList()
})

onBeforeUnmount(() => {
  uni.offWindowResize(() => {})
})
</script>

<style lang="scss" scoped>

.user-info {
  .user-info-content {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 8px;
  }

  .logout-btn {
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 4px 8px;
    border-radius: 4px;
    background-color: rgba(255, 255, 255, 0.1);
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background-color: rgba(255, 255, 255, 0.2);
    }

    text {
      font-size: 12px;
      color: #fff;
    }
  }
}

.layout-container {
  display: flex;
  min-height: 100vh;
  width: 100%;
  background-color: #f5f7fa;

  .sidebar {
    width: 240px;
    background: linear-gradient(180deg, #001529 0%, #003366 100%);
    color: #fff;
    transition: all 0.3s ease;
    z-index: 1000;
    display: flex;
    flex-direction: column;
    box-shadow: 2px 0 8px rgba(0,0,0,0.15);

    .logo-container {
      padding: 20px;
      text-align: center;
      background-color: rgba(255,255,255,0.05);

      .logo {
        width: 160px;
        height: 50px;
        object-fit: contain;
      }
    }

    .user-info {
      padding: 16px;
      border-bottom: 1px solid rgba(255,255,255,0.1);

      :deep(.uni-card) {
        background-color: transparent;
        border: none;
        margin: 0;
        padding: 0;

        .uni-card__header {
          border-bottom: none;
          padding: 0;
        }
      }

      .user-info-header {
        display: flex;
        align-items: center;
        gap: 8px;
      }

      .welcome {
        font-size: 16px;
        color: #fff;
        margin-left: 8px;
      }

      .role-tag {
        display: inline-block;
        font-size: 12px;
        color: #fff;
        background-color: rgba(255,255,255,0.1);
        padding: 2px 8px;
        border-radius: 10px;
        margin-top: 8px;
      }
    }

    .menu-list {
      flex: 1;
      overflow-y: auto;

      .menu-item {
        display: flex;
        align-items: center;
        padding: 16px 24px;
        cursor: pointer;
        transition: all 0.3s ease;
        border-left: 3px solid transparent;

        &:hover {
          background: rgba(255,255,255,0.1);
        }

        &.active {
          background: rgba(24,144,255,0.2);
          border-left-color: #1890ff;
        }

        .menu-text {
          margin-left: 12px;
          font-size: 14px;
        }
      }

      &::-webkit-scrollbar {
        width: 4px;
      }

      &::-webkit-scrollbar-thumb {
        background-color: rgba(255,255,255,0.2);
        border-radius: 2px;
      }
    }
  }

  .main-content {
    flex: 1;
    padding: 0;
    background: #f0f2f5;
    transition: all 0.3s ease;
    overflow-y: auto;
    min-height: 100vh;
  }

  // 移动端样式
  &.layout-mobile {
    .mobile-header {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      height: 50px;
      background: linear-gradient(90deg, #001529 0%, #003366 100%);
      color: #fff;
      display: flex;
      align-items: center;
      padding: 0 16px;
      z-index: 1001;
      box-shadow: 0 2px 8px rgba(0,0,0,0.15);

      .header-title {
        margin-left: 16px;
        font-size: 16px;
        font-weight: 500;
      }
    }

    .sidebar-mobile {
      position: fixed;
      left: -240px;
      top: 50px;
      bottom: 0;
      transition: left 0.3s ease-in-out;

      &.sidebar-mobile-open {
        left: 0;
      }
    }

    .main-content-mobile {
      margin-top: 50px;
      padding: 16px;
    }

    .mobile-mask {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0,0,0,0.5);
      z-index: 999;
    }
  }
}

.menu-item {
  &.parent-item {
    justify-content: space-between;
    padding-right: 16px;
  }

  .menu-item-content {
    display: flex;
    align-items: center;
    gap: 12px;
  }
}

.submenu {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease-out;
  background: rgba(0, 0, 0, 0.2);

  &.submenu-expanded {
    max-height: 500px; // 足够大的高度以容纳子菜单
  }

  .submenu-item {
    display: flex;
    align-items: center;
    padding: 12px 24px 12px 48px;
    gap: 12px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
    }

    &.active {
      background: rgba(24, 144, 255, 0.2);
    }

    .menu-text {
      font-size: 14px;
      color: #fff;
    }
  }
}

// 暗色主题适配
@media (prefers-color-scheme: dark) {
  .layout-container {
    //background-color: #1a1a1a;

    .main-content {
      //background-color: #1a1a1a;
    }
  }
}
</style>
