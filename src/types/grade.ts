export interface Grade {
    id:string
    homeworkId:string
    studentId:string
    score:number
}

export interface GradeStudentInfo{
    studentId:string
    score:number
}

export interface GradeSubmitRequest{
    homeworkId:string
    scores:GradeStudentInfo[]
}
