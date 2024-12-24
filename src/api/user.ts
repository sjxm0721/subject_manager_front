// src/api/user.ts
import { http } from '@/utils/request'
import {LoginRequest, LoginResult, RegisterRequest, UserInfo, UserPassword} from "@/types/user";

export const userApi = {
  login(data: LoginRequest) {
    return http.post<LoginResult>('/user/login', data)
  },

  register(data: RegisterRequest) {
    return http.post<number>('/user/register', data)
  },

  logout() {
    return http.post<boolean>('/user/logout')
  },

  getCurrentUser() {
    return http.get<LoginResult>('/user/current-user')
  },

  updateUserInfo(data: Partial<UserInfo>) {
    return http.post('/user/update/my', data)
  },

  updatePwd(data: UserPassword){
    return http.post('/user/update/pwd',data)
  }
}
