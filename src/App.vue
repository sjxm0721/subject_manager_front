<script setup lang="ts">
import { onLaunch, onShow, onHide } from "@dcloudio/uni-app";
import { useUserStore } from '@/store/user'

const userStore = useUserStore()

onLaunch(() => {
  // 检查登录状态
  const token = userStore.token
  if (!token) {
    uni.reLaunch({
      url: '/pages/login/index'
    })
  } else {
    // 如果已登录且在登录页，跳转到主页面
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]?.route || ''
    if (currentPage === 'pages/login/index') {
      const defaultPath = '/pages/student/PersonalInfo/index'
      uni.reLaunch({
        url: `/pages/main/index?path=${encodeURIComponent(defaultPath)}`
      })
    }
  }
});

onShow(() => {
  console.log("App Show");
});

onHide(() => {
  console.log("App Hide");
});
</script>

<style>
page {
  background-color: #f5f5f5;
}
</style>
