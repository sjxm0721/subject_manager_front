
import {http} from "@/utils/request";
import {GradeSubmitRequest} from "@/types/grade";

export const gradeApi = {

    submitGrades(data:GradeSubmitRequest){
        return http.post<boolean>('/grade/submit',data)
    },

}
