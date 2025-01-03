import {http} from "@/utils/request";
import {SubjectStudentAddRequest} from "@/types/subjectStudent";

export const subjectStudentApi = {

    addSubjectStudent(params:SubjectStudentAddRequest){
        return http.post<boolean>('/subject-student/add',params)
    },
    delSubjectStudent(params: string){
        return http.delete<boolean>(`/subject-student/delete/${params}`)
    }
}
