import type { FormState, FileList } from '../types/file'

// 缓存键定义
const CACHE_KEY = 'homework_draft'
const CACHE_TIMESTAMP_KEY = 'homework_draft_timestamp'
const CACHE_EXPIRY_TIME = 24 * 60 * 60 * 1000 // 24小时过期

interface CachedData {
    formData: FormState
    fileList: FileList
    timestamp: number
}

export const cacheService = {
    // 保存表单数据到本地缓存
    saveFormToCache(formData: FormState, fileList: FileList): void {
        try {
            const cacheData: CachedData = {
                formData,
                fileList,
                timestamp: Date.now()
            }
            localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData))
            localStorage.setItem(CACHE_TIMESTAMP_KEY, Date.now().toString())
        } catch (error) {
            console.error('保存缓存失败:', error)
        }
    },

    // 从缓存中恢复表单数据
    loadFormFromCache(): CachedData | null {
        try {
            const cachedData = localStorage.getItem(CACHE_KEY)
            const timestamp = Number(localStorage.getItem(CACHE_TIMESTAMP_KEY))

            if (!cachedData || !timestamp) {
                return null
            }

            // 检查缓存是否过期
            if (Date.now() - timestamp > CACHE_EXPIRY_TIME) {
                this.clearCache()
                return null
            }

            return JSON.parse(cachedData)
        } catch (error) {
            console.error('读取缓存失败:', error)
            return null
        }
    },

    // 清除缓存
    clearCache(): void {
        try {
            localStorage.removeItem(CACHE_KEY)
            localStorage.removeItem(CACHE_TIMESTAMP_KEY)
        } catch (error) {
            console.error('清除缓存失败:', error)
        }
    },

    // 检查是否存在未提交的草稿
    hasDraft(): boolean {
        try {
            const timestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY)
            if (!timestamp) return false

            const lastSaveTime = Number(timestamp)
            return Date.now() - lastSaveTime <= CACHE_EXPIRY_TIME
        } catch {
            return false
        }
    }
}
