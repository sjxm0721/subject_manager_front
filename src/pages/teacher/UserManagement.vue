<template>
  <Layout>
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
            <text class="label">学号</text>
            <u-input
                v-model="form.userAccount"
                placeholder="请输入学号"
                :border="false"
                class="form-input"
            />
          </view>

          <view class="form-item">
            <text class="label">姓名</text>
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

          <view class="form-item">
            <text class="label">分组设置</text>
            <view class="group-list">
              <view v-for="(group, index) in form.groupDetails" :key="index" class="group-item">
                <view class="group-form">
                  <!-- 修改为 uni-data-select -->
                  <uni-data-select
                      v-model="group.subjectId"
                      :localdata="subjectList"
                      label="text"
                      value="value"
                      placeholder="请选择课程"
                      class="subject-select"
                      @change="handleSubjectChange($event, index)"
                  />
                  <u-input
                      v-model="group.groupNum"
                      placeholder="请输入分组编号"
                      :border="true"
                      class="group-input"
                  />
                  <view class="delete-btn" @click="removeGroup(index)">
                    <uni-icons type="trash" size="20" color="#f56c6c" />
                  </view>
                </view>
              </view>
              <u-button size="small" @click="addGroup()" class="add-group-btn">添加分组</u-button>
            </view>
          </view>

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
  </Layout>
</template>


<script setup lang="ts">
import { ref, reactive, onMounted,onBeforeUnmount } from 'vue'
import Layout from '@/components/layout/Layout.vue'
import {GroupDetail, StudentVO} from '@/types/student'
import { studentApi } from '@/api/student'
import  {debounce}  from 'lodash'
import {subjectApi} from "@/api/subject";

const popupRef = ref<any>(null)
const saving = ref(false)
const isEdit = ref(false)
const current = ref(1)
const pageSize = ref(10)
const total = ref(0)
const groupPopupRef = ref<any>(null)
const selectedStudent = ref<StudentVO | null>(null)
const subjectList = ref<{value: number, text: string}[]>([])


const searchForm = reactive({
  className: '',
  userName: ''
})


const form = reactive({
  id: undefined,
  phone:'',
  className: '',
  userAccount: '',
  userName: '',
  uploadAble: 0,
  checkAble: 0,
  groupDetails:[]
})

const studentList = ref<StudentVO[]>([])

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
    console.error(error)
    uni.showToast({
      title: '获取列表失败',
      icon: 'error'
    })
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
  const templateUrl = 'https://your-aliyun-oss-url/template.xlsx'
  window.open(templateUrl)
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
    checkAble: 0,
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
      text: item.title
    }))
  } catch (error) {
    console.error(error)
    uni.showToast({
      title: '获取课程列表失败',
      icon: 'error'
    })
  }
}


// 表单提交
const handleSubmit = async () => {
  if (!form.userName || !form.userAccount) {
    uni.showToast({
      title: '请填写必填信息',
      icon: 'error'
    })
    return
  }

  try {
    saving.value = true

    // 处理分组信息
    const groupDetailList = form.groupDetails?.map(group => ({
      subjectId: Number(group.subjectId),
      subjectName: group.subjectName,
      subjectStudentId: Number(group.subjectStudentId),
      groupNum: Number(group.groupNum)
    })) || []

    const submitData = {
      ...form,
      groupDetailList
    }

    console.log("现在的表单信息",submitData);

    if (isEdit.value) {
      await studentApi.addOrUpdateStudent(submitData)
      uni.showToast({
        title: '修改成功',
        icon: 'success'
      })
    } else {
      await studentApi.addOrUpdateStudent(submitData)
      uni.showToast({
        title: '添加成功',
        icon: 'success'
      })
    }

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


// 添加分组
const addGroup = () => {
  if (!form.groupDetails) {
    form.groupDetails = []
  }
  form.groupDetails.push({
    subjectId: undefined,
    subjectName: '',
    groupNum: undefined,
    subjectStudentId: undefined
  })
}

// 删除分组
const removeGroup = (index: number) => {
  form.groupDetails?.splice(index, 1)
}

// 修改编辑表单初始化
const handleEdit = (student: StudentVO) => {
  isEdit.value = true
  Object.assign(form, {
    ...student,
    groupDetails: student.groupDetails || []
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
    console.error(error)
    uni.showToast({
      title: error.message || '删除失败',
      icon: 'error'
    })
  }
}

const handleClose = () => {
  popupRef.value?.close()
}

const handlePrevPage = () => {
  if (current.value > 1) {
    current.value--
    getStudentList()
  }
}

const handleSubjectChange = (value: number, index: number) => {
  const subject = subjectList.value.find(item => item.value === value)
  if (subject && form.groupDetails[index]) {
    form.groupDetails[index].subjectId = value
    form.groupDetails[index].subjectName = subject.text
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
    grid-template-columns: 2fr 2fr 2fr 1fr 1fr 2fr;
    padding: 12px 16px;
    align-items: center;
    text-align: center;

    .col {
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
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

          &.edit {
            color: #409eff;

            &:hover {
              background-color: #ecf5ff;
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

  .popup-header {
    position: relative;
    padding: 20px;
    text-align: center;
    border-bottom: 1px solid #eee;

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
    }
  }

  .popup-content {
    padding: 20px;

    .form-item {
      margin-bottom: 20px;

      &:last-child {
        margin-bottom: 0;
      }

      .label {
        display: block;
        margin-bottom: 8px;
        color: #606266;
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
    padding: 20px;
    border-top: 1px solid #eee;
  }
}

// 移动端适配
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
        }

        .action-group {
          justify-content: flex-end;
        }
      }
    }
  }

  .user-popup {
    width: 90%;
    margin: 0 20px;
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

.group-popup {
  width: 90%;
  max-width: 600px; // 增加最大宽度
  background: #fff;
  border-radius: 8px;
  overflow: hidden;

  .popup-header {
    position: relative;
    padding: 24px;
    text-align: center;
    background: #f8f9fa;
    border-bottom: 1px solid #eee;

    .title {
      font-size: 20px;
      font-weight: 500;
      color: #333;
    }
  }

  .popup-content {
    padding: 24px;
    max-height: 60vh;
    overflow-y: auto;

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
}

// 移动端适配补充
@media screen and (max-width: 768px) {
  .user-management {
    .table-header {
      display: none; // 隐藏表头
    }

    .table-row {
      display: block; // 改变布局方式
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
          color: #909399;
          font-size: 14px;
        }

        &:last-child {
          border-bottom: none;
        }
      }

      .permission-col {
        justify-content: flex-start;
        padding-left: 80px; // 对齐其他字段
      }

      .action-col {
        justify-content: flex-end;
        gap: 16px;
        padding-top: 16px;
        margin-top: 8px;
        border-top: 1px solid #eee;

        .action-btn {
          padding: 6px 12px;
          border-radius: 4px;
          font-size: 14px;

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
}

.group-list {
  .group-item {
    margin-bottom: 16px;

    .group-form {
      display: flex;
      gap: 12px;
      align-items: center;

      .subject-select {
        flex: 2;
      }

      .group-input {
        flex: 1;
      }

      .delete-btn {
        padding: 8px;
        cursor: pointer;

        &:hover {
          opacity: 0.8;
        }
      }
    }
  }

  .add-group-btn {
    width: 100%;
    margin-top: 8px;
  }
}

.group-popup {
  .form-item {
    .group-list {
      background: #f8f9fa;
      padding: 16px;
      border-radius: 8px;
    }
  }
}


</style>
