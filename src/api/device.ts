import {http, service} from '@/utils/request'
import {
    ApplyDeviceVO,
    Device,
    DeviceBorrowPageRequest, DeviceBorrowPageVO,
    DeviceBorrowRequest,
    DeviceQueryRequest, DeviceStoreRequest,
    DeviceUpdateRequest, MyDeviceApplyPageRequest
} from "@/types/device";
import {useUserStore} from "@/store/user";

export const deviceApi = {
    getDevicePage(params: DeviceQueryRequest) {
        return http.post<{
            records: Device[]
            total: number
            size: number
            current: number
        }>('/device/page', params)
    },
    updateDevice(data: DeviceUpdateRequest) {
        return http.post<boolean>('/device/update', data)
    },
    borrowDevice(data: DeviceBorrowRequest) {
        return http.post<boolean>('/device/borrow', data)
    },
    borrowPage(data: DeviceBorrowPageRequest) {
        return http.post<{
            records: DeviceBorrowPageVO[]
            total: number
            size: number
            current: number
        }>('/device/borrow-page', data)
    },
    storeDevice(data: DeviceStoreRequest) {
        return http.post<boolean>('/device/store', data)
    },
    getMyApplyRecords(data: MyDeviceApplyPageRequest) {
        return http.post<{
            records: ApplyDeviceVO[]
            total: number
            size: number
            current: number
        }>('/device/my-apply', data)
    },
    cancelApply(params: string) {
        return http.get<boolean>('/device/cancel-apply', {
            id: params
        })
    },
    returnDevice(params: string) {
        return http.get<boolean>('/device/return', {
            id: params
        })
    },
    approveBorrow(params: string) {
        return http.get<boolean>('/device/approve-borrow', {
            id: params
        })
    },
    rejectBorrow(params: string) {
        return http.get<boolean>('/device/reject-borrow', {
            id: params
        })
    },
    confirmReturn(params: string) {
        return http.get<boolean>('/device/confirm-return', {
            id: params
        })
    },
    exportDevice() {
        // #ifdef H5
        return service({
            url: '/device/export',
            method: 'get',
            responseType: 'blob', // 关键设置：响应类型为blob
        }).then(response => {
            // 获取文件名
            const contentDisposition = response.headers['content-disposition']
            let fileName = '器材外借信息表.xlsx'
            if (contentDisposition) {
                fileName = decodeURIComponent(contentDisposition.split(';')[1].split('=')[1].replace(/"/g, ''))
            }

            // 创建下载链接
            const blob = new Blob([response.data], {
                type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
            })
            const url = window.URL.createObjectURL(blob)

            // 创建临时链接并触发下载
            const link = document.createElement('a')
            link.href = url
            link.setAttribute('download', fileName)
            document.body.appendChild(link)
            link.click()

            // 清理
            window.URL.revokeObjectURL(url)
            document.body.removeChild(link)

            return Promise.resolve()
        })
        // #endif

        // #ifdef MP-WEIXIN
        return new Promise((resolve, reject) => {
            uni.downloadFile({
                url: '/api/device/export',
                header: {
                    token: useUserStore().token
                },
                success: (res) => {
                    if (res.statusCode === 200) {
                        uni.saveFile({
                            tempFilePath: res.tempFilePath,
                            success: function (saveRes) {
                                uni.showToast({
                                    title: '文件已保存',
                                    icon: 'success'
                                })
                                resolve(saveRes)
                            },
                            fail: function(error) {
                                reject(error)
                            }
                        })
                    } else {
                        reject(new Error('下载失败'))
                    }
                },
                fail: (error) => {
                    reject(error)
                }
            })
        })
        // #endif
    }
}
