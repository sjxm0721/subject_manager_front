import { UserInfo } from './user'

export interface StudentVO extends UserInfo {
    groupDetails: GroupDetail[]
}

export interface GroupDetail {
    subjectId: number
    subjectName: string
    groupNum: number
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
    groupDetailList:GroupDetail[]
}
