import { defineStore } from 'pinia'
import { userApi } from '@/api/user'
import type { LoginRequest, UserInfo, LoginResult } from '@/types/user'

// 统一的存储键名
const TOKEN_KEY = 'APP_TOKEN'
const USER_INFO_KEY = 'APP_USER_INFO'

// 跨平台存储方法
const storage = {
  get(key: string) {
    // #ifdef WEB
    return localStorage.getItem(key)
    // #endif

    // #ifdef MP || APP-PLUS
    return uni.getStorageSync(key)
    // #endif
  },

  set(key: string, data: any) {
    // #ifdef WEB
    localStorage.setItem(key, typeof data === 'object' ? JSON.stringify(data) : data)
    // #endif

    // #ifdef MP || APP-PLUS
    uni.setStorageSync(key, data)
    // #endif
  },

  remove(key: string) {
    // #ifdef WEB
    localStorage.removeItem(key)
    // #endif

    // #ifdef MP || APP-PLUS
    uni.removeStorageSync(key)
    // #endif
  },

  clear() {
    // #ifdef WEB
    localStorage.clear()
    // #endif

    // #ifdef MP || APP-PLUS
    uni.clearStorageSync()
    // #endif
  }
}

interface UserState {
  token: string
  userInfo: UserInfo | null
}

export const useUserStore = defineStore('user', {
  state: (): UserState => ({
    token: storage.get(TOKEN_KEY) || '',
    userInfo: (() => {
      const info = storage.get(USER_INFO_KEY)
      return info ? JSON.parse(info) : null
    })()
  }),

  actions: {
    async login(loginForm: LoginRequest) {
      try {
        const res = await userApi.login({
          userAccount: loginForm.userAccount,
          userPassword: loginForm.userPassword,
          captchaToken: loginForm.captchaToken
        })

        this.token = res.token
        this.userInfo = {
          id: res.id,
          phone: res.phone,
          userAccount: res.userAccount,
          userName: res.userName,
          userRole: res.userRole,
          userAvatar: res.userAvatar,
          className: res.className,
          createTime: res.createTime,
          updateTime: res.updateTime
        }

        // 使用统一的存储方法
        storage.set(TOKEN_KEY, res.token)
        storage.set(USER_INFO_KEY, JSON.stringify(this.userInfo))

        // 在登录成功后
        const LAST_PATH_KEY = 'last_visited_path'
        localStorage.removeItem(LAST_PATH_KEY)

        return res
      } catch (error) {
        throw new Error('登录失败：' + error.message)
      }
    },

    async getCurrentUser() {
      try {
        const res = await userApi.getCurrentUser()
        this.userInfo = {
          id: res.id,
          phone: res.phone,
          userAccount: res.userAccount,
          userName: res.userName,
          userRole: res.userRole,
          userAvatar: res.userAvatar,
          className: res.className,
          createTime: res.createTime,
          updateTime: res.updateTime
        }
        storage.set(USER_INFO_KEY, JSON.stringify(this.userInfo))
        return res
      } catch (error) {
        this.logout()
        throw new Error('获取用户信息失败：' + error.message)
      }
    },

    async logout() {
        this.token = ''
        this.userInfo = null
        storage.clear()

        // 根据平台选择跳转方式
        // #ifdef WEB
        window.location.href = '/login'
        // #endif

        // #ifdef MP || APP-PLUS
        uni.reLaunch({
          url: '/pages/login/index'
        })
        // #endif
    },

    async updatePassword(newPassword: string) {
      try {
        await userApi.updatePwd({newPwd:newPassword});
      } catch (error) {
        throw new Error('密码修改失败：' + error.message);
      }
    },

    async updateUserInfo(userInfo: Partial<UserInfo>) {
      try {
        await userApi.updateUserInfo(userInfo)
        if (this.userInfo) {
          this.userInfo = { ...this.userInfo, ...userInfo }
          storage.set(USER_INFO_KEY, JSON.stringify(this.userInfo))
        }
      } catch (error) {
        throw new Error('更新用户信息失败：' + error.message)
      }
    }
  },

  getters: {
    isLogin(): boolean {
      return !!this.token && !!this.userInfo
    },

    isTeacher(): boolean {
      return this.userInfo?.userRole === 2
    },

    isStudent(): boolean {
      return this.userInfo?.userRole === 1
    }
  }
})
