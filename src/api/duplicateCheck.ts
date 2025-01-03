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
import {DuplicateCheckVO} from "@/types/duplicateCheck";

export const duplicateCheckApi = {
    getHomeworkDuplicateCheckList(params: string) {
        return http.get<DuplicateCheckVO>('/duplicate-check/list', {
            homeworkId: params
        })
    },
}
