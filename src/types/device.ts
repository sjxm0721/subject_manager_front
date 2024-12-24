import {UserInfo} from "@/types/user";

export interface DeviceQueryRequest {
    deviceName?: string
    current: number
    pageSize: number
}

export interface Device{
    id?:string
    deviceName:string
    pic?:string
    description?:string
    helpB?:string
    totalNum:number
    outerNum:number
}

export interface DeviceUpdateRequest{
    id:string
    deviceName:string
    totalNum:number
    description:string
}

export interface DeviceBorrowRequest{
    id:string,//设备id
    subjectStudentId:string,//课程id
    applyNum:number
}


export interface DeviceBorrowPageRequest{
    subjectId: string
    groupNum:number
    deviceName:number
    status:number//0-申请中 1-已同意 2-拒绝 3-已归还
    current: number
    pageSize: number
}

export interface DeviceBorrowPageVO{
    groupNum:number
    id:string
    member:UserInfo[]
    subjectId:string
    deviceName:string
    applyNum:number
    status:number//0-申请中 1-已同意 2-拒绝 3-已归还
}

export interface DeviceStoreRequest{
    deviceName:string
    pic:string
    description:string
    helpB:string
    totalNum:number
}
