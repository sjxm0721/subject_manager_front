import { http } from '@/utils/request'
import {
    Homework,
    HomeworkAddRequest,
    HomeworkHistoryPageQueryRequest, HomeworkHistoryVO,
    HomeworkQueryRequest,
    HomeworkStatusUpdateRequest,
    HomeworkVO
} from "@/types/homework";
import type {Subject} from "@/types/subject";

export const homeworkApi = {
    addHomework(data: HomeworkAddRequest) {
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
    }
}
