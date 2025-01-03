import {http} from '@/utils/request'
import type {Subject, SubjectAddOrUpdateRequest, SubjectPageRequest} from "@/types/subject";
import type {StudentVO} from "@/types/student";

export const subjectApi = {
    getSubjectList(){
        return http.get<Subject[]>('/subject/list')
    },
    getSubjectListByStu(){
        return http.get<Subject[]>('/subject/list-by-stu')
    },
    getSubjectPage(params:SubjectPageRequest){
        return http.post<{
            records: Subject[]
            total: number
            size: number
            current: number
        }>('/subject/page', params)
    },
    addOrUpdateSubject(params:SubjectAddOrUpdateRequest){
        return http.post<boolean>('/subject/add-or-update',params)
    },
    deleteSubject(params:string){
        return http.delete<boolean>(`/subject/del/${params}`)
    }
}
