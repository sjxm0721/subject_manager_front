import { http } from '@/utils/request'
import {
    Device,
    DeviceBorrowPageRequest, DeviceBorrowPageVO,
    DeviceBorrowRequest,
    DeviceQueryRequest, DeviceStoreRequest,
    DeviceUpdateRequest
} from "@/types/device";

export const deviceApi = {
    getDevicePage(params: DeviceQueryRequest) {
        return http.post<{
            records: Device[]
            total: number
            size: number
            current: number
        }>('/device/page', params)
    },
    updateDevice(data:DeviceUpdateRequest){
        return http.post<boolean>('/device/update',data)
    },
    borrowDevice(data:DeviceBorrowRequest){
        return http.post<boolean>('/device/borrow',data)
    },
    borrowPage(data:DeviceBorrowPageRequest){
        return http.post<{
            records: DeviceBorrowPageVO[]
            total: number
            size: number
            current: number
        }>('/device/borrow-page', data)
    },
    storeDevice(data: DeviceStoreRequest){
        return http.post<boolean>('/device/store',data)
    }
}
