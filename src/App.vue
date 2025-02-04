<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { useUserStore } from '@/store/user'

const userStore = useUserStore()
const LAST_PATH_KEY = 'last_visited_path'
let isNavigating = false

const debounce = (fn: Function, delay: number) => {
  let timer: NodeJS.Timeout | null = null
  return (...args: any[]) => {
    if (timer) clearTimeout(timer)
    timer = setTimeout(() => {
      fn.apply(null, args)
    }, delay)
  }
}

// 从 URL 获取路径参数
const getPathFromUrl = () => {
  if (process.env.UNI_PLATFORM === 'h5') {
    try {
      const url = new URL(window.location.href)
      const searchParams = new URLSearchParams(url.search)
      const hashParams = new URLSearchParams(url.hash.split('?')[1] || '')

      const path = searchParams.get('path') || hashParams.get('path')

      if (path) {
        return decodeURIComponent(path).replace(/%23%2F$/, '')
      }
    } catch (error) {
    }
  }
  return ''
}

// 获取默认路径
const getDefaultPath = () => {
  if (!userStore.userInfo) return '/pages/login/index'

  switch (userStore.userInfo.userRole) {
    case 1:
      return '/pages/student/PersonalInfo/index'
    case 2:
      return '/pages/teacher/PersonalInfo/index'
    case 3:
      return '/pages/guest/GuestInfo/index'
    default:
      return '/pages/login/index'
  }
}

// 保存最后访问的路径
const saveLastPath = (path: string) => {
  if (path && path !== '/pages/login/index') {
    try {
      localStorage.setItem(LAST_PATH_KEY, path)
    } catch (error) {
    }
  }
}

// 获取最后访问的路径
const getLastPath = () => {
  try {
    return localStorage.getItem(LAST_PATH_KEY) || ''
  } catch (error) {
    return ''
  }
}

// 清除保存的路径
const clearLastPath = () => {
  try {
    localStorage.removeItem(LAST_PATH_KEY)
  } catch (error) {
  }
}

// 安全的页面跳转
const safeNavigate = async (path: string) => {
  if (isNavigating) {
    return
  }

  const cleanPath = path.replace(/%23%2F$/, '').replace(/#\/$/, '')

  try {
    isNavigating = true
    // 使用 replaceState 更新 URL，而不是进行实际导航
    const newUrl = `/pages/main/index?path=${encodeURIComponent(cleanPath)}`
    uni.reLaunch({
      url: newUrl
    })
    // history.replaceState(null, '', newUrl)

    // 保存路径到 localStorage
    saveLastPath(cleanPath)

    // 触发页面更新事件
    uni.$emit('pageChange', cleanPath)

    return Promise.resolve()
  } catch (error) {
    return Promise.reject(error)
  } finally {
    // 设置一个短暂的延迟后才允许下一次导航
    setTimeout(() => {
      isNavigating = false
    }, 0)
  }
}

// 防抖后的导航函数
const debouncedNavigate = debounce(safeNavigate, 0)

// 初始化应用
const initApp = async () => {
  try {
    const token = userStore.token
    if (!token) {
      clearLastPath()
      await uni.redirectTo({ url: '/pages/login/index' })
      return
    }


    const urlPath = getPathFromUrl()
    const lastPath = getLastPath()
    const defaultPath = getDefaultPath()
    const targetPath = lastPath || urlPath || defaultPath

    if (!targetPath.startsWith('/pages/') || targetPath === '/pages/login/index') {
      clearLastPath()
      await debouncedNavigate(defaultPath)
      return
    }

    const currentHash = window.location.hash
    const expectedHash = `#/pages/main/index?path=${encodeURIComponent(targetPath)}`

    if (currentHash !== expectedHash) {
      await debouncedNavigate(targetPath)
    }
  } catch (error) {
  }
}

onLaunch(() => {
  uni.onPageNotFound(() => {
    uni.redirectTo({
      url: '/pages/error/index'
    })
  })

  initApp()
})

onShow(() => {
  const token = userStore.token
  if (token) {
    initApp()
  }
})

onHide(() => {
})
</script>

<style>
page {
  background-color: #f5f5f5;
}
</style>
