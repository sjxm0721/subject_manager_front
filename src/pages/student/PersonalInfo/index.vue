<template>
    <view class="info-page" :class="{ 'info-page-mobile': isMobile }">
      <view class="page-header">
        <text class="title">信息管理</text>
      </view>

      <view class="info-form">
        <text class="section-title">个人信息</text>
        <view class="form-group">
          <text class="label">课程选择</text>
          <select v-model="selectedSubject" class="course-select">
            <option value="">请选择课程</option>
            <option
                v-for="subject in subjectList"
                :key="subject.value"
                :value="subject.value"
            >
              {{ subject.text }}
            </option>
          </select>
        </view>

        <view class="form-group">
          <text class="label">小组编号</text>
          <view class="group-info">
            <text>第</text>
            <input
                v-model="form.groupNum"
                type="text"
                class="group-input"
                maxlength="2"
                disabled
                @input="validategroupNum"
            />
            <text>组</text>
          </view>
        </view>


        <view class="form-section">
          <view class="form-item required">
            <text class="label">姓名</text>
            <u-input
                v-model="form.userName"
                placeholder="请输入姓名"
                :border="false"
                class="custom-input"
            />
          </view>

          <view class="form-item required">
            <text class="label">账号</text>
            <u-input
                v-model="form.userAccount"
                placeholder="请输入账号"
                :border="false"
                class="custom-input"
                disabled
            />
          </view>

          <view class="form-item required">
            <text class="label">班级</text>
            <u-input
                v-model="form.className"
                placeholder="请输入班级"
                :border="false"
                class="custom-input"
                disabled
            />
          </view>

          <view class="form-item">
            <text class="label">电话</text>
            <u-input
                v-model="form.phone"
                placeholder="请输入电话"
                :border="false"
                class="custom-input"
            />
          </view>
        </view>

        <view class="form-actions">
          <u-button
              @click="handleSave"
              :disabled="saving"
          >保存</u-button>
          <u-button
              type="primary"
              @click="changePassword"
              :loading="saving"
          >密码修改</u-button>
        </view>
      </view>
      <!-- 在页面底部添加以下代码 -->
    </view>
    <uni-popup ref="popupRef" type="center">
      <view class="password-popup">
        <view class="popup-header">
          <text class="popup-title">修改密码</text>
          <view class="close-icon" @click="handleClose">
            <uni-icons type="close" size="20" color="#999" />
          </view>
        </view>

        <view class="popup-content">
          <view class="form-item">
            <text class="label">新密码</text>
            <input
                type="password"
                v-model="passwordForm.newPassword"
                class="password-input"
                placeholder="请输入新密码"
                placeholder-class="input-placeholder"
            />
          </view>

          <view class="form-item">
            <text class="label">确认密码</text>
            <input
                type="password"
                v-model="passwordForm.confirmPassword"
                class="password-input"
                placeholder="请再次输入新密码"
                placeholder-class="input-placeholder"
            />
          </view>
        </view>
        <view class="popup-footer">
          <button
              class="btn cancel-btn"
              @click="handleClose"
          >取消</button>
          <button
              class="btn confirm-btn"
              @click="handlePasswordChange"
              :disabled="saving"
          >修改</button>
        </view>
      </view>
    </uni-popup>

</template>

<script setup lang="ts">
import { studentApi } from "@/api/student"
import type { StudentGroupNumQueryRequest } from '@/types/student'
import { ref, reactive, onMounted, onBeforeUnmount,nextTick,watch } from 'vue'
import { useUserStore } from '@/store/user'
import type { UserInfo } from '@/types/user'
import {subjectApi} from "@/api/subject";

const userStore = useUserStore()
const isMobile = ref(false)
const saving = ref(false)
const popupRef = ref<any>(null)

// 课程列表
const subjectList = ref<{value: string, text: string}[]>([])
const selectedSubject = ref<string>('')

// 表单数据
interface FormState extends Partial<UserInfo> {
  groupNum?: string
}

const form = reactive<FormState>({
  userName: userStore.userInfo?.userName || '',
  userAccount: userStore.userInfo?.userAccount || '',
  phone: userStore.userInfo?.phone || '',
  groupNum: '',
  className: userStore.userInfo?.className || '',
})

// 检查设备类型
const checkDevice = () => {
  isMobile.value = window.innerWidth <= 768
}

// 获取课程列表
// 获取课程列表
const getSubjectList = async () => {
  try {
    const res = await subjectApi.getSubjectListByStu()
    subjectList.value = res.map(item => ({
      value: item.id,
      text: item.title
    }))

    // 如果有默认选中的课程或者列表有值，获取组号
    if (userStore.userInfo?.subjectId) {
      selectedSubject.value = userStore.userInfo.subjectId
      await getGroupNum(userStore.userInfo.subjectId)
    } else if (subjectList.value.length > 0) {
      selectedSubject.value = subjectList.value[0].value
      await getGroupNum(subjectList.value[0].value)
    }
  } catch (error) {
    uni.showToast({
      title: error?.message || '获取课程列表失败',
      icon: 'error'
    })
  }
}

// 监听课程选择变化
watch(() => selectedSubject.value, async (newValue) => {
  if (newValue) {
    await getGroupNum(newValue)
  } else {
    form.groupNum = ''
  }
})

const getGroupNum = async (subjectId: string) => {
  try {
    if (!userStore.userInfo?.id || !subjectId) return

    const params: StudentGroupNumQueryRequest = {
      studentId: userStore.userInfo.id,
      subjectId: subjectId
    }
    const groupNum = await studentApi.getStudentGroupNum(params)
    form.groupNum = String(groupNum).padStart(2, '0') // 保证两位数显示
  } catch (error) {
    uni.showToast({
      title: error?.message || '获取组号失败',
      icon: 'error'
    })
  }
}

// 验证组号输入
const validategroupNum = (e: any) => {
  const value = e.target.value
  if (!/^\d{0,2}$/.test(value)) {
    form.groupNum = value.replace(/[^\d]/g, '').slice(0, 2)
  }
}

const handleSave = async () => {
  if (!form.userName) {
    uni.showToast({
      title: '请填写姓名',
      icon: 'error'
    })
    return
  }

  try {
    saving.value = true
    // 更新用户信息，包括选中的课程ID
    await userStore.updateUserInfo({
      userName: form.userName,
      phone: form.phone,
      subjectId: selectedSubject.value, // 添加课程ID
    })

    uni.showToast({
      title: '保存成功',
      icon: 'success'
    })
    await userStore.getCurrentUser()
  } catch (error: any) {
    uni.showToast({
      title: error.message || '保存失败',
      icon: 'error'
    })
  } finally {
    saving.value = false
  }
}

onMounted(() => {
  checkDevice()
  window.addEventListener('resize', checkDevice)
  getSubjectList() // 加载课程列表并获取组号

  // 初始化其他表单数据
  if (userStore.userInfo) {
    form.userName = userStore.userInfo.userName
    form.userAccount = userStore.userInfo.userAccount
    form.phone = userStore.userInfo.phone
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', checkDevice)
})


// 密码表单数据
const passwordForm = reactive({
  newPassword: '',
  confirmPassword: ''
});


// 密码修改方法
const changePassword = () => {
  passwordForm.newPassword = '';
  passwordForm.confirmPassword = '';
  // 直接调用 open 方法
  nextTick(() => {
    popupRef.value?.open('center')
  })
};

// 修改关闭方法
const handleClose = () => {
  popupRef.value?.close()
};

// 修改确认方法
const handlePasswordChange = async () => {
  // 表单验证
  if (!passwordForm.newPassword || !passwordForm.confirmPassword) {
    uni.showToast({
      title: '请填写完整密码信息',
      icon: 'none'
    });
    return;
  }

  if (passwordForm.newPassword !== passwordForm.confirmPassword) {
    uni.showToast({
      title: '两次密码输入不一致',
      icon: 'none'
    });
    return;
  }
  try {
    saving.value = true;
    await userStore.updatePassword(passwordForm.newPassword);
    uni.showToast({
      title: '密码修改成功',
      icon: 'success'
    });
    // 使用 ref 关闭弹窗
    popupRef.value?.close()
  } catch (error: any) {
    uni.showToast({
      title: error.message || '密码修改失败',
      icon: 'error'
    });
  } finally {
    saving.value = false;
  }
};

</script>

<style lang="scss" scoped>
.info-page {
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  padding: 24px 0;

  .page-header {
    margin-bottom: 24px;
    padding: 0 16px;

    .title {
      font-size: 24px;
      font-weight: bold;
      //color: #1a1a1a;
    }
  }

  .info-form {
    background-color: #fff;
    padding: 32px;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

    .form-group {
      display: flex;
      align-items: center;
      margin-bottom: 32px;

      .label {
        min-width: 80px;
        margin-right: 16px;
        color: #666;
      }

      .group-info {
        display: flex;
        align-items: center;
        gap: 8px;

        .group-input {
          width: 60px;
          height: 32px;
          text-align: center;
          border: 1px solid #dcdfe6;
          border-radius: 4px;
          transition: all 0.3s;

          &:focus {
            border-color: #409eff;
            outline: none;
          }
        }
      }
    }

    .form-section {
      margin-bottom: 32px;

    }

    .form-item {
      margin-bottom: 24px;

      .label {
        display: block;
        margin-bottom: 8px;
        color: #666;
      }

      &.required .label::before {
        content: '*';
        color: #ff4d4f;
        margin-right: 4px;
      }

      .custom-input {
        background-color: #f5f7fa;
        border-radius: 4px;
        padding: 0 12px;
      }
    }

    .form-actions {
      display: flex;
      gap: 16px;
      justify-content: center;
      margin-top: 40px;
      padding-top: 24px;
      border-top: 1px solid #eee;

      :deep(.u-button) {
        min-width: 120px;
      }
    }
  }
}

// 移动端适配
.info-page-mobile {
  .info-form {
    padding: 16px;
    margin: 0 16px;

    .form-group {
      margin-bottom: 24px;
    }

    .form-section {
      margin-bottom: 24px;

      .section-title {
        font-size: 16px;
        margin-bottom: 16px;
      }
    }

    .form-actions {
      flex-direction: column;
      gap: 12px;

      :deep(.u-button) {
        width: 100%;
      }
    }
  }
}

// 在 style 中添加以下样式
.password-popup {
  width: 400px;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;

  .popup-header {
    position: relative;
    padding: 20px;
    text-align: center;
    border-bottom: 1px solid #eee;

    .popup-title {
      font-size: 18px;
      font-weight: 500;
      color: #333;
    }

    .close-icon {
      position: absolute;
      right: 16px;
      top: 50%;
      transform: translateY(-50%);
      cursor: pointer;
      padding: 4px;
    }
  }

  .popup-content {
    padding: 20px;

    .form-item {
      margin-bottom: 16px;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        color: #666;
      }

      .password-input {
        width: 85%;
        height: 36px;
        padding: 0 12px;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        font-size: 14px;
        transition: all 0.3s;

        &:focus {
          border-color: #409eff;
          outline: none;
        }
      }

      .input-placeholder {
        color: #999;
      }
    }
  }

  .popup-footer {
    display: flex;
    padding: 12px 16px;
    border-top: 1px solid #eee;
	gap: 12px;

    .btn {
    flex: 1;
    height: 40px;
    line-height: 40px;
    border-radius: 4px;
    font-size: 15px;
    min-width: 100px; // 确保按钮足够宽
    text-align: center;
    padding: 0; // 移除内边距
    margin: 0; // 移除外边距
    border: none;


    &.cancel-btn,
    &.confirm-btn {
      width: auto;
      min-width: 80px;
    }

      &.cancel-btn {
        background: #f5f7fa;
        color: #666;

        &:hover {
          background: #e4e7ed;
        }
      }

      &.confirm-btn {
        background: #409eff;
        color: #fff;

        &:hover {
          background: #66b1ff;
        }

        &:disabled {
          background: #a0cfff;
          cursor: not-allowed;
        }
      }
    }
  }
}

// 移动端适配
@media screen and (max-width: 768px) {
  .password-popup {
    max-width: 320px;

    .popup-content {
      padding: 16px;
    }

    .popup-footer {
      padding: 12px;

      .btn {
		  min-width: 80px;
        padding: 0 20px; // 增加移动端按钮内边距
        font-size: 16px; // 增大字号
      }
    }
  }
}

.form-group {
  .course-select {
    flex: 1;
    height: 36px;
    padding: 0 10px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    transition: all 0.3s;
    background-color: #fff;

    &:focus {
      border-color: #409eff;
      outline: none;
    }
  }
}

.section-title {
  font-size: 18px;
  font-weight: bold;
  //color: #1a1a1a;
  margin-bottom: 24px;
  padding-bottom: 12px;
  border-bottom: 1px solid #eee;
}
</style>
