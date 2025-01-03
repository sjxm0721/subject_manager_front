import {http, service} from '@/utils/request'
import {
    Homework,
    HomeworkAddRequest, HomeworkGradePageRequest, HomeworkGradeVO,
    HomeworkHistoryPageQueryRequest, HomeworkHistoryVO,
    HomeworkQueryRequest,
    HomeworkStatusUpdateRequest,
    HomeworkVO
} from "@/types/homework";
import type {Subject} from "@/types/subject";
import {useUserStore} from "@/store/user";

export const homeworkApi = {
    addOrUpdateHomework(data: HomeworkAddRequest) {
        return http.post<boolean>('/homework/submit', data)
    },
    getHomeworkPage(params: HomeworkQueryRequest) {
        return http.post<{
            records: HomeworkVO[]
            total: number
            size: number
            current: number
        }>('/homework/page', params)
    },
    updateHomeworkSuggested(params: HomeworkStatusUpdateRequest){
        return http.post<boolean>('/homework/update-status', params)
    },
    getHomeworkYear(){
        return http.get<number[]>('/homework/homework-year')
    },
    getHomeworkYearTeacher(){
        return http.get<number[]>('/homework/homework-year-teacher')
    },
    getHomeworkHistoryPage(params: HomeworkHistoryPageQueryRequest) {
        return http.post<{
            records: HomeworkHistoryVO[]
            total: number
            size: number
            current: number
        }>('/homework/page-homework-history', params)
    },
    getHomeworkDetail(homeworkId:string){
        return http.get<Homework>('/homework/get',{
            homeworkId:homeworkId
        })
    },
    getHomeworkGradePage(params:HomeworkGradePageRequest){
        return http.post<{
            records: HomeworkGradeVO[]
            total: number
            size: number
            current: number
        }>('/homework/page-grade', params)
    },
    getMyHomeworkDetail(homeworkId:string){
        return http.get<Homework>('/homework/get-my',{
            homeworkId:homeworkId
        })
    },
    exportInfo(params: { grade: string; title: string; homeworkTitle:string }) {
        // #ifdef H5
        return service({
            url: '/homework/export-xml',
            method: 'post',
            data: params,
            responseType: 'blob' // 设置响应类型为blob
        }).then(response => {
            // 获取文件名
            const contentDisposition = response.headers['content-disposition']
            let fileName = '作业信息表.xlsx'
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
                url: '/api/homework/export-xml',
                header: {
                    token: useUserStore().token,
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                data: params,
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
    },
    exportZip(params: { grade: string; title: string; homeworkTitle:string }) {
        // #ifdef H5
        return service({
            url: '/homework/export-zip',
            method: 'post',
            data: params,
            responseType: 'blob' // 关键设置：响应类型为blob
        }).then(response => {
            // 获取文件名
            const contentDisposition = response.headers['content-disposition']
            let fileName = '作业信息.zip'
            if (contentDisposition) {
                fileName = decodeURIComponent(contentDisposition.split(';')[1].split('=')[1].replace(/"/g, ''))
            }

            // 创建下载链接
            const blob = new Blob([response.data], {
                type: 'application/zip'  // 设置为zip类型
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
                url: '/api/homework/export-zip',
                header: {
                    token: useUserStore().token,
                    'Content-Type': 'application/json'
                },
                method: 'POST',
                data: params,
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
