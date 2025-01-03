import {UserInfo} from "@/types/user";
import {Grade} from "@/types/grade";

export interface Homework {
    id?:string
    subjectId:string
    groupNum?:number
    title:string
    commend:number
    brief:string
    hardwareTech:string
    softwareTech:string
    background:string
    systemDesign:string
    attachmentWord:string
    attachmentPdf:string
    attachmentSource:string
    attachmentMp4:string
    subject_type:number
    post:string
    subjectType:number
    submit_year:number
    subject_name:string
}


export interface HomeworkAddRequest{
    id:number,
    subjectId:number,
    studentId:number,
    title:string,
    brief:string,
    hardwareTech:string
    softwareTech:string
    background:string
    systemDesign:string
    attachmentWord?:string
    attachmentPdf?:string
    attachmentSource?:string
    attachmentMp4?:string
    type:number
}

export interface HomeworkQueryRequest {
    title?: string
    grade?: string
    homeworkTitle?: string
    current: number
    pageSize: number
}


export interface HomeworkVO{
    id:string,
    subjectId:number,
    grade:string,
    subjectName:string,
    groupNum:number,
    title:string,
    brief:string,
    hardwareTech:string
    softwareTech:string
    commend:number
    background:string
    systemDesign:string
    attachmentWord?:string
    attachmentPdf?:string
    attachmentSource?:string
    attachmentMp4?:string
    subjectType:number
    createTime:string
    member:UserInfo[]
    isCorrect:number
    scores?:Grade[]
}

export interface HomeworkStatusUpdateRequest{
    id:string
    suggested:number
}

export interface HomeworkHistoryPageQueryRequest {
    year?: number
    current: number
    pageSize: number
}

export interface HomeworkHistoryVO{
    id:string
    subjectId:string
    subjectName:string//课程名
    groupNum:string
    member:UserInfo[]
    post:string//封面
    submitYear:number
    commend:number
    brief:string
    title:string//标题
}


export interface HomeworkGradePageRequest {
    subjectId?: string
    isCorrect?: string
    current: number
    pageSize: number
}

export interface HomeworkGradeVO{
    id:string;

    subjectId:string;

    subjectName:string;

    groupNum:number;

    title:string;

    isCorrect:number;

    score:Grade;
}
