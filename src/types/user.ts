export interface LoginRequest {
  userAccount: string
  userPassword: string
}

export interface RegisterRequest {
  userAccount: string
  userPassword: string
  checkPassword: string
}

export interface UserInfo {
  id: number
  userAccount: string
  userName: string
  userRole: number
  userAvatar?: string
  phone: string
  className: string
  createTime: Date
  updateTime: Date
  checkAble: number
  uploadAble: number
}

export interface LoginResult {
  id: number
  userAccount: string
  userName: string
  userRole: string
  userAvatar?: string
  token: string
}

export interface UserPassword{
  newPwd: string
}
