import {http} from '@/utils/request'
import type {Subject} from "@/types/subject";

export const subjectApi = {
    getSubjectList(){
        return http.get<Subject[]>('/subject/list')
    },
    getSubjectListByStu(){
        return http.get<Subject[]>('/subject/list-by-stu')
    }
}
