import axios from 'axios'
import { useUserStore } from '@/store/user'

// 免登录白名单
const whiteList = ['/user/login', '/user/register']

const service = axios.create({
    baseURL: '/api',
    timeout: 50000
})

// 请求拦截器
service.interceptors.request.use(
    (config) => {
        // 判断是否在白名单中
        const isWhiteList = whiteList.some(url => config.url?.includes(url))
        if (!isWhiteList) {
            const userStore = useUserStore()
            if (userStore.token) {
                config.headers.token = userStore.token
            } else {
                // token 不存在时跳转登录
                userStore.logout()
                return Promise.reject(new Error('请先登录'))
            }
        }
        return config
    },
    (error) => {
        uni.showToast({
            title: error.message || '请求异常',
            icon: 'error',
            duration: 2000
        })
        return Promise.reject(error)
    }
)

// 响应拦截器
service.interceptors.response.use(
    (response) => {
        // 如果是文件下载，直接返回response
        if (response.config.responseType === 'blob') {
            return response
        }

        const res = response.data
        if (res.code !== 200&&res.code!==0) {
            // 统一错误提示
            uni.showToast({
                title: res.message || '请求失败',
                icon: 'error',
                duration: 2000
            })

            // token 过期
            if (res.code === 401) {
                const userStore = useUserStore()
                uni.showModal({
                    title: '提示',
                    content: '登录已过期，请重新登录',
                    showCancel: false,
                    success: () => {
                        userStore.logout()
                    }
                })
            }

            return Promise.reject(new Error(res.message || '请求失败'))
        }
        return res.data
    },
    (error) => {
        // 处理blob类型的错误响应
        if (error.response?.config?.responseType === 'blob') {
            return new Promise((resolve, reject) => {
                const reader = new FileReader()
                reader.onload = () => {
                    try {
                        const errorData = JSON.parse(reader.result as string)
                        uni.showToast({
                            title: errorData.message || '导出失败',
                            icon: 'error',
                            duration: 2000
                        })
                    } catch (e) {
                        uni.showToast({
                            title: '导出失败',
                            icon: 'error',
                            duration: 2000
                        })
                    }
                    reject(error)
                }
                reader.readAsText(error.response.data)
            })
        }
        uni.showToast({
            title: error.message || '网络异常',
            icon: 'error',
            duration: 2000
        })
        return Promise.reject(error)
    }
)


const http = {
    get<T = any>(url: string, params?: any) {
        return service.get<T>(url, { params })
    },

    post<T = any>(url: string, data?: any) {
        return service.post<T>(url, data)
    },

    put<T = any>(url: string, data?: any) {
        return service.put<T>(url, data)
    },

    delete<T = any>(url: string, params?: any) {
        return service.delete<T>(url, { params })
    }
}

export {service,http}
