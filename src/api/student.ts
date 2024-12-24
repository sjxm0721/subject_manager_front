import { http } from '@/utils/request'
import type {StudentVO, StudentQueryRequest, StudentAddOrUpdateRequest} from '@/types/student'
import {LoginRequest, LoginResult} from "@/types/user";

export const studentApi = {
    /**
     * 分页获取学生列表
     */
    getStudentList(params: StudentQueryRequest) {
        return http.post<{
            records: StudentVO[]
            total: number
            size: number
            current: number
        }>('/student/list/page', params)
    },
    addOrUpdateStudent(data: StudentAddOrUpdateRequest){
        return http.post<boolean>('/student/add-update',data)
    },
    deleteStudent(params: string) {
        return http.delete<boolean>(`/student/delete/${params}`)
    },
}
