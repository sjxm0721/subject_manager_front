import { UserInfo } from './user'

export interface StudentVO extends UserInfo {
    groupDetails: GroupDetail[]
}

export interface GroupDetail {
    subjectId: number
    subjectName: string
    groupNum: number
    grade: string
    subjectStudentId: number
}

export interface StudentQueryRequest {
    userName?: string
    className?: string
    current: number
    pageSize: number
}

export interface StudentAddOrUpdateRequest{
    id?:string
    className?:string
   phone?:string
    checkAble:number
   uploadAble:number
    userAccount:string
     userName:string
}

export interface StudentGroupNumQueryRequest{
    studentId:string
    subjectId:string
}
