<template>
    <view class="user-management">
      <!-- 用户列表区域 -->
      <view class="list-header">
        <view class="header-row">
          <view class="search-group">
            <view class="search-item">
              <text>班级</text>
              <u-input
                  v-model="searchForm.className"
                  placeholder="请输入班级"
                  :border="true"
                  class="search-input"
                  @change="handleSearch"
              />
            </view>
            <view class="search-item">
              <text>姓名</text>
              <u-input
                  v-model="searchForm.userName"
                  placeholder="请输入姓名"
                  :border="true"
                  class="search-input"
                  @change="handleSearch"
              />
            </view>
          </view>
          <view class="action-group">
            <u-button @click="downloadTemplate">下载模板</u-button>
            <u-button @click="handleAdd">导入</u-button>
          </view>
        </view>

        <view class="table-header">
          <text class="col">班级</text>
          <text class="col">学号</text>
          <text class="col">姓名</text>
          <text class="col">联系电话</text>
          <text class="col">权限</text>
          <text class="col">操作</text>
        </view>
      </view>

      <scroll-view class="table-content" scroll-y>
        <view
            v-for="(item, index) in studentList"
            :key="index"
            class="table-row"
        >
          <text class="col" data-label="班级">{{item.className}}</text>
          <text class="col" data-label="学号">{{item.userAccount}}</text>
          <text class="col" data-label="姓名">{{item.userName}}</text>
          <text class="col" data-label="联系电话">{{item.phone || '-'}}</text>
          <view class="col permission-col" data-label="权限">
            <view class="permission-tag" :class="{ active: item.checkAble === 1 }">查看</view>
            <view class="permission-tag" :class="{ active: item.uploadAble === 1 }">上传</view>
          </view>
          <view class="col action-col">
            <text class="action-btn info" @click="showGroupInfo(item)">分组</text>
            <text class="action-btn edit" @click="handleEdit(item)">编辑</text>
            <text class="action-btn reset" @click="handleResetPwd(item)">重置密码</text>
            <text class="action-btn delete" @click="handleDelete(item)">删除</text>
          </view>
        </view>
      </scroll-view>

      <view class="pagination">
        <text>第 {{(current - 1) * pageSize + 1}}-{{current * pageSize}} 条</text>
        <view class="page-btns">
          <text
              class="page-btn"
              :class="{ disabled: current === 1 }"
              @click="handlePrevPage"
          >上一页</text>
          <text class="total">共{{total}}条</text>
          <text
              class="page-btn"
              :class="{ disabled: current * pageSize >= total }"
              @click="handleNextPage"
          >下一页</text>
        </view>
      </view>
    </view>

    <!-- 用户信息弹窗 -->
    <uni-popup ref="popupRef" type="center">
      <view class="user-popup">
        <view class="popup-header">
          <text class="title">{{isEdit ? '修改用户信息' : '添加用户'}}</text>
          <view class="close-icon" @click="handleClose">
            <uni-icons type="close" size="20" color="#999" />
          </view>
        </view>

        <view class="popup-content">
          <view class="form-item">
            <text class="label">班级</text>
            <u-input
                v-model="form.className"
                placeholder="请输入班级"
                :border="false"
                class="form-input"
            />
          </view>

          <view class="form-item">
            <text class="label">学号 <text class="required">*</text></text>
            <u-input
                v-model="form.userAccount"
                placeholder="请输入学号"
                :border="false"
                class="form-input"
            />
          </view>

          <view class="form-item">
            <text class="label">姓名 <text class="required">*</text></text>
            <u-input
                v-model="form.userName"
                placeholder="请输入姓名"
                :border="false"
                class="form-input"
            />
          </view>

          <view class="form-item">
            <text class="label">联系电话</text>
            <u-input
                v-model="form.phone"
                placeholder="请输入联系电话"
                :border="false"
                class="form-input"
            />
          </view>

          <view class="form-item">
            <text class="label">权限</text>
            <view class="checkbox-group">
              <checkbox
                  :checked="form.checkAble === 1"
                  @click="form.checkAble = form.checkAble === 1 ? 0 : 1"
              >查看权限</checkbox>
              <checkbox
                  :checked="form.uploadAble === 1"
                  @click="form.uploadAble = form.uploadAble === 1 ? 0 : 1"
              >上传权限</checkbox>
            </view>
          </view>

          <view class="form-item" v-if="isEdit">
            <text class="label">分组设置</text>
            <view class="group-list">
              <!-- 显示现有分组 -->
              <view
                  v-if="isEdit && form.groupDetails?.length"
                  class="existing-groups"
              >
                <view
                    v-for="(group, index) in form.groupDetails"
                    :key="index"
                    class="group-item"
                >
                  <view class="group-info">
                    <text class="group-name">{{group.subjectName}} - {{group.grade}} - 第{{group.groupNum}}组</text>
                    <view
                        class="delete-btn"
                        @click="handleDeleteGroup(group.subjectStudentId!.toString())"
                    >
                      <uni-icons type="trash" size="20" color="#f56c6c" />
                    </view>
                  </view>
                </view>
              </view>

              <!-- 添加新分组表单 -->
              <view class="add-group-form">
                <view class="form-row">
                  <text class="form-label">选择课程</text>
                  <uni-data-select
                      v-model="newGroup.subjectId"
                      :localdata="filterSubjectList(form)"
                      label="text"
                      value="value"
                      placeholder="请选择课程"
                  />
                </view>
                <view class="form-row">
                  <text class="form-label">分组编号</text>
                  <u-input
                      v-model="newGroup.groupNum"
                      placeholder="请输入分组编号"
                      type="number"
                      :border="true"
                      class="group-input"
                  />
                </view>
                <view class="form-row">
                  <u-button
                      size="small"
                      @click="handleAddGroup(newGroup.subjectId, Number(newGroup.groupNum))"
                      :disabled="!newGroup.subjectId || !newGroup.groupNum"
                      class="add-btn"
                  >
                    添加分组
                  </u-button>
                </view>
              </view>
            </view>
          </view>

          <template v-if="!isEdit">
            <view class="form-item file-upload">
              <text class="label">批量导入</text>
              <!-- H5环境 -->
              <!-- #ifdef H5 -->
              <view class="upload-area">
                <view
                    class="upload-content"
                    :class="{ 'has-file': selectedFile }"
                    @click="handleSelectFile"
                >
                  <uni-icons type="upload" size="24" color="#909399" />
                  <text class="upload-text">{{ selectedFile ? selectedFile.name : '点击上传Excel文件' }}</text>
                  <text class="upload-tip">支持 .xlsx、.xls 格式</text>
                </view>
              </view>
              <!-- #endif -->

              <!-- 小程序环境 -->
              <!-- #ifdef MP-WEIXIN -->
              <view class="upload-area" @click="chooseFile">
                <view class="upload-content" :class="{ 'has-file': selectedFile }">
                  <uni-icons type="upload" size="24" color="#909399" />
                  <text class="upload-text">{{ selectedFile ? selectedFile.name : '点击上传Excel文件' }}</text>
                  <text class="upload-tip">支持 .xlsx、.xls 格式</text>
                </view>
              </view>
              <!-- #endif -->

              <view v-if="selectedFile" class="file-actions">
                <button class="action-btn primary" @click="handleImport" :loading="importing">
                  {{ importing ? '导入中...' : '开始导入' }}
                </button>
                <button class="action-btn" @click="clearFile">取消</button>
              </view>
            </view>
            <view class="divider"></view>
          </template>


        </view>

        <view class="popup-footer">
          <u-button @click="handleClose">取消</u-button>
          <u-button type="primary" @click="handleSubmit" :loading="saving">确认</u-button>
        </view>
      </view>
    </uni-popup>

    <!-- 分组信息弹窗 -->
    <uni-popup ref="groupPopupRef" type="center">
      <view class="group-popup">
        <view class="popup-header">
          <text class="title">分组信息</text>
          <view class="close-icon" @click="groupPopupRef?.close()">
            <uni-icons type="close" size="20" color="#999" />
          </view>
        </view>

        <view class="popup-content">
          <view v-if="selectedStudent?.groupDetails?.length" class="group-list">
            <view v-for="(group, index) in selectedStudent.groupDetails" :key="index" class="group-item">
              <view class="group-name">{{group.subjectName}} - 第{{group.groupNum}}组</view>
            </view>
          </view>
          <view v-else class="no-group">
            暂无分组信息
          </view>
        </view>
      </view>
    </uni-popup>
</template>


<script setup lang="ts">
import { ref, reactive, onMounted,onBeforeUnmount } from 'vue'
import {GroupDetail, StudentVO} from '@/types/student'
import { studentApi } from '@/api/student'
import  {debounce}  from 'lodash'
import {subjectApi} from "@/api/subject";
import {subjectStudentApi} from "@/api/subjectStudent";
import {Subject} from "@/types/subject";

const popupRef = ref<any>(null)
const saving = ref(false)
const isEdit = ref(false)
const current = ref(1)
const pageSize = ref(10)
const total = ref(0)
const groupPopupRef = ref<any>(null)
const selectedStudent = ref<StudentVO | null>(null)
const subjectList = ref<{value: number, text: string}[]>([])
const fileInput = ref()
const selectedFile = ref<File | null>(null)
const importing = ref(false)

const searchForm = reactive({
  className: '',
  userName: ''
})


const newGroup = reactive({
  subjectId: '',
  groupNum: '',
  subjectName: ''
})

const form = reactive({
  id: undefined,
  phone:'',
  className: '',
  userAccount: '',
  userName: '',
  uploadAble: 0,
  checkAble: 1,
  groupDetails: []
})

const currentStudentId = ref<number>()

const studentList = ref<StudentVO[]>([])

// 新增分组相关方法
const handleAddGroup = async (subjectId: number, groupNum: number) => {
  try {
    if (!currentStudentId.value) {
      uni.showToast({
        title: '学生信息错误',
        icon: 'error'
      })
      return
    }

    await subjectStudentApi.addSubjectStudent({
      subjectId,
      groupNum,
      studentId: currentStudentId.value  // 添加studentId参数
    })

    uni.showToast({
      title: '添加分组成功',
      icon: 'success'
    })

    newGroup.subjectId = ''
    newGroup.groupNum = ''
    newGroup.subjectName = ''



    // 刷新分组信息
    await getStudentList()

    // 如果正在编辑状态，重新获取学生信息
    if (isEdit.value && currentStudentId.value) {
      const studentDetail = await studentApi.getStudentDetail(currentStudentId.value)
      handleEdit(studentDetail)
    }
  } catch (error: any) {
    uni.showToast({
      title: error.message || '添加分组失败',
      icon: 'error'
    })
  }
}

// 重置密码
const handleResetPwd = async (student: StudentVO) => {
  try {
    const result = await new Promise((resolve, reject) => {
      uni.showModal({
        title: '提示',
        content: '确认重置该用户的密码吗？',
        success: (res) => {
          resolve(res.confirm)
        },
        fail: reject
      })
    })

    // 如果用户点击取消，直接返回
    if (!result) {
      return
    }

    // 调用重置密码 API
    await studentApi.resetStudentPwd(student.id!.toString())

    uni.showToast({
      title: '重置密码成功',
      icon: 'success'
    })
  } catch (error: any) {
    uni.showToast({
      title: error.message || '重置密码失败',
      icon: 'error'
    })
  }
}

const filterSubjectList = (form: any) => {
  const filteredSubjects = subjectList.value.filter(subject => {
    return form.groupDetails.every(group => group.subjectId != subject.value);
  });
  return filteredSubjects;
}

const handleDeleteGroup = async (subjectStudentId: string) => {
  try {
    // 使用 Promise 和 uni.showModal 的正确方式
    const confirmResult = await new Promise((resolve, reject) => {
      uni.showModal({
        title: '确认删除',
        content: '确定要删除这个分组吗？',
        confirmText: '确认',
        cancelText: '取消',
        success: function (res) {
          if (res.confirm) {
            resolve(true)
          } else if (res.cancel) {
            resolve(false)
          }
        },
        fail: reject
      })
    })

    // 如果点击取消，直接返回
    if (!confirmResult) {
      return
    }

    // 用户点击确认，继续删除操作
    await subjectStudentApi.delSubjectStudent(subjectStudentId)

    uni.showToast({
      title: '删除分组成功',
      icon: 'success'
    })

    // 刷新列表和当前编辑的学生信息
    await getStudentList()
    if (isEdit.value && currentStudentId.value) {
      const studentDetail = await studentApi.getStudentDetail(currentStudentId.value)
      handleEdit(studentDetail)
    }

    // 重置新分组表单
    Object.assign(newGroup, {
      subjectId: '',
      groupNum: '',
      subjectName: ''
    })
  } catch (error: any) {
    uni.showToast({
      title: error.message || '删除分组失败',
      icon: 'error'
    })
  }
}


// 获取用户列表
const getStudentList = async () => {
  try {
    const res = await studentApi.getStudentList({
      current: current.value,
      pageSize: pageSize.value,
      className: searchForm.className,
      userName: searchForm.userName
    })
    studentList.value = res.records
    total.value = res.total
  } catch (error) {
    uni.showToast({
      title: error?.message || '获取列表失败',
      icon: 'error'
    })
  }
}



// 处理文件选择
const handleSelectFile = () => {
  // #ifdef H5
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.xlsx,.xls'
  input.style.display = 'none'

  input.onchange = (e: Event) => {
    const target = e.target as HTMLInputElement
    if (target.files?.length) {
      selectedFile.value = target.files[0]
    }
    document.body.removeChild(input)
  }

  document.body.appendChild(input)
  input.click()
  // #endif
}

// 小程序环境下的文件选择
const chooseFile = () => {
  // #ifdef MP-WEIXIN
  uni.chooseMessageFile({
    count: 1,
    type: 'file',
    extension: ['.xlsx', '.xls'],
    success: (res) => {
      selectedFile.value = res.tempFiles[0]
    }
  })
  // #endif
}

// 清除文件
const clearFile = () => {
  selectedFile.value = null
}

// 文件导入处理
const handleImport = async () => {
  if (!selectedFile.value) {
    uni.showToast({
      title: '请先选择文件',
      icon: 'none'
    })
    return
  }

  importing.value = true
  try {
    const formData = new FormData()
    formData.append('file', selectedFile.value)

    await studentApi.studentExcelImport(formData)

    uni.showToast({
      title: '导入成功',
      icon: 'success'
    })

    clearFile()
    handleClose()
    getStudentList()
  } catch (error: any) {
    uni.showToast({
      title: error.message || '导入失败',
      icon: 'error'
    })
  } finally {
    importing.value = false
  }
}



// 显示分组信息
const showGroupInfo = (student: StudentVO) => {
  selectedStudent.value = student
  groupPopupRef.value?.open('center')
}

// 搜索防抖
const handleSearch = debounce(() => {
  current.value = 1
  getStudentList()
}, 300)


// 下载模板
const downloadTemplate = () => {
  // 替换为实际的模板下载地址
  const templateUrl = 'https://bilibilipropost.oss-cn-beijing.aliyuncs.com/studentImport.xlsx'
  window.open(templateUrl)
}


const validateForm = () => {
  if (!form.userAccount.trim()) {
    uni.showToast({
      title: '请输入学号',
      icon: 'error'
    })
    return false
  }

  if (!form.userName.trim()) {
    uni.showToast({
      title: '请输入姓名',
      icon: 'error'
    })
    return false
  }

  return true
}

// 添加用户
const handleAdd = () => {
  isEdit.value = false
  Object.assign(form, {
    id: undefined,
    className: '',
    userAccount: '',
    userName: '',
    uploadAble: 0,
    checkAble: 1,
    groupDetails: [],
    phone: '',
  })
  popupRef.value?.open('center')
}

// 获取课程列表
// 获取课程列表时转换格式
const getSubjectList = async () => {
  try {
    const res = await subjectApi.getSubjectList()
    subjectList.value = res.map(item => ({
      value: item.id,
      text: item.title + " - " + item.grade
    }))
  } catch (error) {
    uni.showToast({
      title: error?.message || '获取课程列表失败',
      icon: 'error'
    })
  }
}


// 表单提交
const handleSubmit = async () => {
  if (!validateForm()) {
    return
  }
  try {
    saving.value = true

    const submitData = {
      ...form,
      checkAble: form.checkAble || 1,  // 如果未设置，默认为1
      uploadAble: form.uploadAble || 0  // 如果未设置，默认为0
    }

    await studentApi.addOrUpdateStudent(submitData)

    uni.showToast({
      title: isEdit.value ? '修改成功' : '添加成功',
      icon: 'success'
    })

    handleClose()
    getStudentList()
  } catch (error: any) {
    uni.showToast({
      title: error.message || '操作失败',
      icon: 'error'
    })
  } finally {
    saving.value = false
  }
}

// 修改编辑表单初始化
const handleEdit = (student: StudentVO) => {
  isEdit.value = true
  currentStudentId.value = student.id
  Object.assign(form, {
    ...student,
  })
  popupRef.value?.open('center')
}

// 删除用户
const handleDelete = async (student: StudentVO) => {
  try {
    const result = await new Promise((resolve, reject) => {
      uni.showModal({
        title: '提示',
        content: '确认删除该用户吗？',
        success: (res) => {
          resolve(res.confirm)
        },
        fail: reject
      })
    })

    // 如果用户点击取消，直接返回
    if (!result) {
      return
    }

    // 调用删除API
    await studentApi.deleteStudent(student.id!.toString())

    uni.showToast({
      title: '删除成功',
      icon: 'success'
    })

    // 刷新列表
    getStudentList()
  } catch (error: any) {
    uni.showToast({
      title: error.message || '删除失败',
      icon: 'error'
    })
  }
}

const handleClose = () => {
  popupRef.value?.close()
  newGroup.subjectId = ''
  newGroup.groupNum = ''
  newGroup.subjectName = ''
}

const handlePrevPage = () => {
  if (current.value > 1) {
    current.value--
    getStudentList()
  }
}


const handleNextPage = () => {
  if (current.value * pageSize.value < total.value) {
    current.value++
    getStudentList()
  }
}


// 根据平台判断是否为移动端
const isMobile = ref(false)
const checkDevice = () => {
  // #ifdef H5
  isMobile.value = window.innerWidth <= 768
  // #endif

  // #ifdef MP-WEIXIN
  isMobile.value = true
  // #endif
}

onMounted(() => {
  checkDevice()
  // #ifdef H5
  window.addEventListener('resize', checkDevice)
  // #endif
  getStudentList()
  getSubjectList()
})

// #ifdef H5
onBeforeUnmount(() => {
  window.removeEventListener('resize', checkDevice)
})
// #endif


</script>

<style lang="scss" scoped>
.user-management {
  padding: 20px;
  background: #fff;
  border-radius: 8px;
  min-height: calc(100vh - 40px);
  display: flex;
  flex-direction: column;

  .list-header {
    margin-bottom: 20px;

    .header-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      .search-group {
        display: flex;
        gap: 16px;

        .search-item {
          display: flex;
          align-items: center;
          gap: 8px;

          .search-input {
            width: 160px;
          }
        }
      }

      .action-group {
        display: flex;
        gap: 12px;
      }
    }
  }

  .table-header,
  .table-row {
    display: grid;
    grid-template-columns: 2fr 2fr 2fr 1fr 1fr minmax(300px, 4fr);
    padding: 12px 16px;
    align-items: center;
    text-align: center;

    .col {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      min-width: 0;
    }
  }

  .table-header {
    background-color: #f5f7fa;
    font-weight: 500;
    border-top: 1px solid #ebeef5;
    border-bottom: 1px solid #ebeef5;
  }

  .table-content {
    flex: 1;
    overflow-y: auto;

    .table-row {
      border-bottom: 1px solid #ebeef5;
      transition: background-color 0.3s;

      &:hover {
        background-color: #f5f7fa;
      }

      .action-col {
        display: flex;
        justify-content: center;
        gap: 12px;

        .action-btn {
          cursor: pointer;
          padding: 4px 8px;
          border-radius: 4px;
          font-size: 14px;

          &.info {
            color: #409eff;

            &:hover {
              background-color: #ecf5ff;
            }
          }

          &.edit {  // 编辑按钮改为绿色
            color: #67C23A;
            &:hover {
              background-color: #f0f9eb;
            }
          }

          &.delete {
            color: #f56c6c;

            &:hover {
              background-color: #fef0f0;
            }
          }
        }
      }
    }
  }

  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 16px 0;
    border-top: 1px solid #ebeef5;

    .page-btns {
      display: flex;
      align-items: center;
      gap: 16px;

      .page-btn {
        cursor: pointer;
        color: #409eff;

        &.disabled {
          color: #c0c4cc;
          cursor: not-allowed;
        }
      }

      .total {
        color: #606266;
      }
    }
  }
}

.user-popup {
  width: 460px;
  background: #fff;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;

  .popup-header {
    position: relative;
    padding: 20px;
    text-align: center;
    border-bottom: 1px solid #eee;
    background-color: #f8f9fa;
    flex-shrink: 0;

    .title {
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

      &:hover {
        opacity: 0.8;
      }
    }
  }

  .popup-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
    max-height: calc(80vh - 120px);

    .form-item {
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        color: #606266;
        font-weight: 500;
      }

      .form-input {
        background-color: #f5f7fa;
        border-radius: 4px;
      }

      .checkbox-group {
        display: flex;
        gap: 24px;
      }
    }
  }

  .popup-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid #eee;
    background-color: #f8f9fa;
    flex-shrink: 0;
  }
}

.permission-col {
  display: flex;
  justify-content: center;
  gap: 8px;

  .permission-tag {
    padding: 2px 8px;
    border-radius: 4px;
    font-size: 12px;
    background: #f5f7fa;
    color: #909399;

    &.active {
      background: #409eff;
      color: #fff;
    }
  }
}

.file-upload {
  margin-bottom: 24px;

  .upload-area {
    border: 2px dashed #dcdfe6;
    border-radius: 8px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      border-color: #409eff;
    }

    .upload-content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;

      &.has-file {
        .upload-text {
          color: #409eff;
        }
      }

      .upload-text {
        font-size: 14px;
        color: #606266;
        word-break: break-all;
        text-align: center;
      }

      .upload-tip {
        font-size: 12px;
        color: #909399;
      }
    }
  }

  .file-input {
    display: none;
  }

  .file-actions {
    display: flex;
    justify-content: center;
    gap: 12px;
    margin-top: 16px;

    .action-btn {
      min-width: 90px;
      height: 32px;
      line-height: 32px;
      padding: 0 16px;
      border-radius: 4px;
      font-size: 14px;
      border: none;
      cursor: pointer;

      &.primary {
        background-color: #409eff;
        color: #fff;

        &:hover {
          background-color: #66b1ff;
        }

        &:active {
          background-color: #3a8ee6;
        }
      }

      &:not(.primary) {
        background-color: #f5f7fa;
        color: #606266;

        &:hover {
          background-color: #e4e7ed;
        }
      }
    }
  }
}

.divider {
  text-align: center;
  color: #909399;
  font-size: 14px;
  margin: 24px 0;
  position: relative;

  &::before,
  &::after {
    content: '';
    position: absolute;
    top: 50%;
    width: calc(50% - 20px);
    height: 1px;
    background-color: #dcdfe6;
  }

  &::before {
    left: 0;
  }

  &::after {
    right: 0;
  }
}

.group-list {
  background: #f8f9fa;
  padding: 16px;
  border-radius: 8px;
  margin-bottom: 0;

  .existing-groups {
    margin-bottom: 16px;

    .group-item {
      background: #fff;
      padding: 12px 16px;
      border-radius: 6px;
      margin-bottom: 8px;
      border: 1px solid #ebeef5;
      transition: all 0.3s;

      &:last-child {
        margin-bottom: 0;
      }

      &:hover {
        box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);
      }

      .group-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 8px;

        .group-name {
          font-size: 14px;
          color: #333;
          display: flex;
          align-items: center;
          flex: 1;
          min-width: 0;
          word-break: break-all;

          &::before {
            content: '';
            width: 3px;
            height: 14px;
            background: #409eff;
            border-radius: 2px;
            margin-right: 8px;
            flex-shrink: 0;
          }
        }

        .delete-btn {
          padding: 6px;
          cursor: pointer;
          border-radius: 4px;
          transition: all 0.3s;
          flex-shrink: 0;

          &:hover {
            background-color: #fef0f0;

            :deep(.uni-icons) {
              color: #f56c6c !important;
            }
          }
        }
      }
    }
  }

  .add-group-form {
    background: #fff;
    padding: 16px;
    border-radius: 6px;
    border: 1px solid #ebeef5;

    .form-row {
      margin-bottom: 12px;

      &:last-child {
        margin-bottom: 0;
        margin-top: 16px;
        text-align: right;
      }

      .form-label {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        color: #606266;
      }
    }

    .group-input {
      width: 100%;
      max-width: 200px;

      :deep(input) {
        height: 32px;
        line-height: 32px;
        border: 1px solid #DCDFE6;
        border-radius: 4px;
        padding: 0 12px;
        background: #fff;
        width: 100%;
        font-size: 14px;
        color: #606266;

        &:focus {
          border-color: #409eff;
        }

        &::placeholder {
          color: #C0C4CC;
        }
      }
    }

    .add-btn {
      min-width: 80px;
      height: 32px;
      line-height: 32px;
      padding: 0 16px;
      background: #409eff;
      color: #fff;
      border-radius: 4px;
      border: none;
      cursor: pointer;
      font-size: 14px;
      transition: all 0.3s;

      &:hover {
        background: #66b1ff;
      }

      &:active {
        background: #3a8ee6;
      }

      &[disabled] {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }
}

.group-popup {
  width: 90%;
  max-width: 600px;
  background: #fff;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  overflow: hidden;

  .popup-header {
    position: relative;
    padding: 24px;
    text-align: center;
    background: #f8f9fa;
    border-bottom: 1px solid #eee;
    flex-shrink: 0;

    .title {
      font-size: 20px;
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

      &:hover {
        opacity: 0.8;
      }
    }
  }

  .popup-content {
    padding: 24px;
    max-height: 60vh;
    overflow-y: auto;
    flex: 1;

    .group-list {
      display: grid;
      gap: 16px;

      .group-item {
        background: #f8f9fa;
        padding: 16px;
        border-radius: 8px;
        border: 1px solid #eee;

        .group-name {
          font-size: 16px;
          color: #333;
          display: flex;
          align-items: center;
          gap: 8px;

          &::before {
            content: '';
            width: 4px;
            height: 16px;
            background: #409eff;
            border-radius: 2px;
          }
        }
      }
    }
  }

  .no-group {
    text-align: center;
    color: #909399;
    padding: 32px 0;
    font-size: 14px;
  }
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .user-management {
    padding: 12px;

    .list-header {
      .header-row {
        flex-direction: column;
        gap: 12px;
        align-items: stretch;

        .search-group {
          flex-direction: column;

          .search-item {
            width: 100%;

            .search-input {
              flex: 1;
              width: auto;
            }
          }
        }

        .action-group {
          justify-content: flex-end;
        }
      }
    }

    .table-header {
      display: none;
    }

    .table-row {
      display: block !important;
      padding: 16px;
      margin-bottom: 16px;
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

      .col {
        display: flex;
        padding: 8px 0;
        text-align: left;
        border-bottom: 1px solid #eee;

        &::before {
          content: attr(data-label);
          width: 80px;
          flex-shrink: 0;
          color: #909399;
          font-size: 14px;
        }

        &:last-child {
          border-bottom: none;
        }
      }

      .permission-col {
        justify-content: flex-start;
        //padding-left: 80px;

        .permission-tag {
          padding: 2px 8px;
          font-size: 12px;
        }
      }

      .action-col {
        justify-content: flex-end;
        gap: 16px;
        padding-top: 16px;
        margin-top: 8px;
        border-top: 1px solid #eee;
        border-bottom: none;

        &::before {
          display: none;
        }

        .action-btn {
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 14px;
          flex: 1;
          text-align: center;

          &.info {
            background: #ecf5ff;
            color: #409eff;
          }

          &.edit {
            background: #f0f9eb;
            color: #67c23a;
          }

          &.delete {
            background: #fef0f0;
            color: #f56c6c;
          }
        }
      }
    }
  }

  .user-popup {
    width: 90%;
    margin: 0 20px;
    max-height: 90vh;
    position: relative;

    .popup-content {
      padding: 16px;
      max-height: calc(90vh - 120px);
      -webkit-overflow-scrolling: touch;

      .form-item {
        .group-list {
          padding: 12px;

          .add-group-form {
            padding: 12px;

            .form-row {
              .group-input {
                max-width: 90%;
              }
            }
          }
        }
      }
    }

    .popup-footer {
      position: relative;
      bottom: 0;
      left: 0;
      right: 0;
      z-index: 1;
      background: #f8f9fa;
      padding: 12px 16px;
    }
  }

  .file-upload {
    .upload-area {
      padding: 16px;
    }

    .file-actions {
      flex-direction: column;

      .action-btn {
        width: 100%;
      }
    }
  }

  .group-popup {
    width: 92%;
    margin: 0 4%;
    max-height: 80vh;

    .popup-header {
      padding: 16px;
    }

    .popup-content {
      padding: 16px;
      max-height: calc(80vh - 120px);
    }
  }
}

/* 小程序特别适配 */
/* #ifdef MP-WEIXIN */
.user-management {
  .table-row {
    margin: 12px;

    .action-col {
      .action-btn {
        &::after {
          border: none;
        }
      }
    }
  }
}

.user-popup {
  .popup-content {
    max-height: calc(80vh - 100px);
  }

  .popup-footer {
    padding: 12px;

    :deep(.u-button) {
      margin: 0;
      &::after {
        border: none;
      }
    }
  }

  .form-item {
    .group-list {
      .add-group-form {
        .add-btn {
          &::after {
            border: none;
          }
        }
      }
    }
  }
}

.group-popup {
  .popup-content {
    padding: 12px;
  }
}

.file-upload {
  .upload-area {
    margin: 0 12px;
  }

  .file-actions {
    margin: 16px 12px;

    .action-btn {
      &::after {
        border: none;
      }
    }
  }
}
/* #endif */
.form-item {
  .label {
    .required {
      color: #f56c6c;
      margin-left: 4px;
    }
  }
}

// 修改 PC 端样式
.action-col {
  display: flex;
  justify-content: center;
  flex-wrap: wrap; // 允许按钮换行
  gap: 8px; // 减小按钮间距
  padding: 0 4px; // 增加一些内边距

  .action-btn {
    min-width: 56px; // 设置最小宽度
    padding: 4px 8px;
    white-space: nowrap; // 防止文字换行
    font-size: 13px; // 稍微缩小字体
    flex-shrink: 0;
    cursor: pointer;
    border-radius: 4px;
    transition: all 0.3s;
    text-align: center;

    &.info {
      color: #409eff;
      &:hover { background-color: #ecf5ff; }
    }

    &.edit {
      color: #409eff;
      &:hover { background-color: #ecf5ff; }
    }

    &.reset {
      color: #E6A23C;
      &:hover { background-color: #fdf6ec; }
    }

    &.delete {
      color: #f56c6c;
      &:hover { background-color: #fef0f0; }
    }
  }
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .table-row {
    .action-col {
      flex-wrap: wrap; // 允许按钮换行
      gap: 8px;
      justify-content: flex-end;
      padding-top: 12px;

      .action-btn {
        min-width: calc(50% - 4px); // 每行两个按钮
        text-align: center;
        padding: 8px;
        font-size: 14px;
        white-space: nowrap;

        &.info {
          background: #ecf5ff;
          color: #409eff;
        }

        &.edit {
          background: #f0f9eb;
          color: #67c23a;
        }

        &.reset {
          background: #fdf6ec;
          color: #E6A23C;
        }

        &.delete {
          background: #fef0f0;
          color: #f56c6c;
        }
      }
    }
  }
}
</style>
