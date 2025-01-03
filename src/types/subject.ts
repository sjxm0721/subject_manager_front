export interface Subject{
    id?: number
    title: string
    grade: string
    startTime?: string
    endTime?: string
}

export interface SubjectPageRequest {
    current: number
    pageSize: number
}

export interface SubjectAddOrUpdateRequest{
    id?:string
    title:string
    grade:string
    startTime:string
    endTime:string
}
