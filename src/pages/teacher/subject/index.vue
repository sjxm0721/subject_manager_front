<template>
  <view class="container">
    <view class="content-box">
      <!-- 头部操作区 -->
      <view class="header">
        <view class="title">课程管理</view>
        <view class="right">
          <button class="add-btn" @click="showModal()">添加课程</button>
        </view>
      </view>

      <!-- PC端列表视图 -->
      <!-- #ifdef H5 -->
      <view class="pc-list" v-if="!isMobile">
        <view class="list-header">
          <text class="col">课程名称</text>
          <text class="col">年级</text>
          <text class="col">开课时间</text>
          <text class="col">结课时间</text>
          <text class="col">操作</text>
        </view>
        <view class="list-item" v-for="item in subjectList" :key="item.id">
          <text class="col">{{ item.title }}</text>
          <text class="col">{{ item.grade }}</text>
          <text class="col">{{ formatDate(item.startTime) }}</text>
          <text class="col">{{ formatDate(item.endTime) }}</text>
          <view class="col operation">
            <button class="opt-btn edit" @click="handleEdit(item)">编辑</button>
            <button class="opt-btn delete" @click="handleDelete(item.id)">删除</button>
          </view>
        </view>
      </view>
      <!-- #endif -->

      <!-- 移动端和小程序列表视图 -->
      <!-- #ifdef MP-WEIXIN || H5 -->
      <view class="mobile-list" v-if="isMobile">
        <view class="card" v-for="item in subjectList" :key="item.id">
          <view class="card-row">
            <text class="label">课程名称：</text>
            <text class="value">{{ item.title }}</text>
          </view>
          <view class="card-row">
            <text class="label">年级：</text>
            <text class="value">{{ item.grade }}</text>
          </view>
          <view class="card-row">
            <text class="label">开课时间：</text>
            <text class="value">{{ formatDate(item.startTime) }}</text>
          </view>
          <view class="card-row">
            <text class="label">结课时间：</text>
            <text class="value">{{ formatDate(item.endTime) }}</text>
          </view>
          <view class="card-operations">
            <button class="opt-btn edit" @click="handleEdit(item)">编辑</button>
            <button class="opt-btn delete" @click="handleDelete(item.id)">删除</button>
          </view>
        </view>
      </view>
      <!-- #endif -->

      <!-- 分页组件 -->
      <view class="pagination">
        <button
            class="page-btn"
            :disabled="current === 1"
            @click="handlePageChange(current - 1)"
        >上一页</button>
        <text class="page-info">{{ current }}/{{ totalPages }}</text>
        <button
            class="page-btn"
            :disabled="current === totalPages"
            @click="handlePageChange(current + 1)"
        >下一页</button>
      </view>

      <!-- 添加/编辑课程弹窗 -->
      <uni-popup ref="popupRef" type="dialog">
        <uni-popup-dialog
            type="info"
            :title="isEdit ? '编辑课程' : '添加课程'"
            :before-close="true"
            @close="hideModal"
            @confirm="handleSubmit"
            :loading="submitting"
        >
          <view class="modal-body">
            <uni-forms
                ref="formRef"
                :model="formData"
                :rules="rules"
                validateTrigger="submit"
            >
              <uni-forms-item label="课程名称" required name="title">
                <uni-easyinput
                    v-model="formData.title"
                    placeholder="请输入课程名称"
                />
              </uni-forms-item>
              <uni-forms-item label="年级" required name="grade">
                <uni-easyinput
                    v-model="formData.grade"
                    placeholder="请输入年级"
                />
              </uni-forms-item>
              <uni-forms-item label="开课时间" required name="startTime">
                <picker
                    mode="date"
                    :value="formData.startTime"
                    @change="onStartTimeChange"
                >
                  <view class="picker">
                    {{ formData.startTime || '请选择开课时间' }}
                  </view>
                </picker>
              </uni-forms-item>

              <uni-forms-item label="结课时间" required name="endTime">
                <picker
                    mode="date"
                    :value="formData.endTime"
                    @change="onEndTimeChange"
                >
                  <view class="picker">
                    {{ formData.endTime || '请选择结课时间' }}
                  </view>
                </picker>
              </uni-forms-item>
            </uni-forms>
          </view>
        </uni-popup-dialog>
      </uni-popup>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watchEffect } from 'vue'
import { subjectApi } from '@/api/subject'
import type { Subject, SubjectPageRequest } from '@/types/subject'

const popupRef = ref<any>(null)
const formRef = ref<any>(null)
const submitting = ref(false)

// 响应式状态
const subjectList = ref<Subject[]>([])
const current = ref(1)
const pageSize = ref(10)
const total = ref(0)
const isEdit = ref(false)
const formData = ref<Subject>({
  title: '',
  grade: '',
  startTime: '',
  endTime: ''
})

const rules = {
  title: {
    rules: [{ required: true, errorMessage: '请输入课程名称' }]
  },
  grade: {
    rules: [{ required: true, errorMessage: '请输入年级' }]
  },
  startTime: {
    rules: [{ required: true, errorMessage: '请选择开课时间' }]
  },
  endTime: {
    rules: [{ required: true, errorMessage: '请选择结课时间' }]
  }
}


// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '-'
  // 处理带有T和时区的日期字符串
  if (dateStr.includes('T')) {
    return dateStr.split('T')[0]
  }
  return dateStr
}

// 计算属性
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))
const isMobile = ref(false)

// 响应式监听设备宽度变化
const updateDeviceType = () => {
  // #ifdef H5
  isMobile.value = window.innerWidth <= 768
  // #endif
  // #ifdef MP-WEIXIN
  isMobile.value = true
  // #endif
}

// 监听窗口大小变化
watchEffect(() => {
  // #ifdef H5
  window.addEventListener('resize', updateDeviceType)
  updateDeviceType()
  return () => {
    window.removeEventListener('resize', updateDeviceType)
  }
  // #endif
})

// 获取课程列表
const getSubjectList = async () => {
  try {
    const params: SubjectPageRequest = {
      current: current.value,
      pageSize: pageSize.value
    }
    const res = await subjectApi.getSubjectPage(params)
    subjectList.value = res.records
    total.value = res.total
  } catch (error) {
    console.error('获取课程列表失败:', error)
    uni.showToast({
      title: '获取课程列表失败',
      icon: 'none'
    })
  }
}

// 分页处理
const handlePageChange = (page: number) => {
  current.value = page
  getSubjectList()
}

// 时间选择器处理
const onStartTimeChange = (e: any) => {
  formData.value.startTime = formatDate(e.detail.value)
}

const onEndTimeChange = (e: any) => {
  formData.value.endTime = formatDate(e.detail.value)
}
// 显示弹窗
const showModal = () => {
  isEdit.value = false
  formData.value = {
    title: '',
    grade: '',
    startTime: '',
    endTime: ''
  }
  popupRef.value?.open('center')
}

// 编辑课程
const handleEdit = (item: Subject) => {
  isEdit.value = true
  // 确保日期格式正确
  formData.value = {
    ...item,
    startTime: formatDate(item.startTime),
    endTime: formatDate(item.endTime)
  }
  popupRef.value?.open('center')
}

// 删除课程
const handleDelete = async (id: number) => {
  uni.showModal({
    title: '提示',
    content: '确定要删除该课程吗？',
    success: async (res) => {
      if (res.confirm) {
        try {
          // 这里需要调用删除API
          await subjectApi.deleteSubject(id)
          await getSubjectList()
          uni.showToast({
            title: '删除成功',
            icon: 'success'
          })
        } catch (error) {
          uni.showToast({
            title: error.message || '删除分组失败',
            icon: 'error'
          })
        }
      }
    }
  })
}

// 提交表单
const handleSubmit = async () => {
  if (!formRef.value) return

  try {
    await formRef.value.validate()
    submitting.value = true

    // 构建提交数据
    const submitData = {
      ...formData.value,
      startTime: formData.value.startTime,
      endTime: formData.value.endTime
    }

    console.log("submitData",submitData)

    await subjectApi.addOrUpdateSubject(submitData)

    await getSubjectList()
    hideModal()
    uni.showToast({
      title: isEdit.value ? '编辑成功' : '添加成功',
      icon: 'success'
    })
  } catch (error) {
    console.error('提交失败:', error)
    uni.showToast({
      title: error.message || '提交失败',
      icon: 'none'
    })
  } finally {
    submitting.value = false
  }
}

// 隐藏模态框
const hideModal = () => {
  popupRef.value?.close()
  formData.value = {
    title: '',
    grade: '',
    startTime: '',
    endTime: ''
  }
}

// 生命周期钩子
onMounted(() => {
  getSubjectList()
})
</script>

<style lang="scss">
.container {
  padding: 20rpx;
  min-height: 100vh;
  background-color: #f5f5f5;

  .content-box {
    background-color: #fff;
    border-radius: 8rpx;
    padding: 20rpx;
  }
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;

  .title {
    font-size: 32rpx;
    font-weight: bold;
  }

  .right {
    margin-left: auto;
  }

  .add-btn {
    min-width: 80px;
    height: 36px;
    border-radius: 4px;
    font-size: 14px;
    border: none;
    background-color: #409eff;
    color: #fff;
    cursor: pointer;
    padding: 0 20px;
    line-height: 36px;

    &:hover {
      background-color: #66b1ff;
    }

    &:active {
      background-color: #3a8ee6;
    }
  }

}

/* PC端列表样式 */
.pc-list {
  border: 1px solid #eee;
  border-radius: 8rpx;

  .list-header, .list-item {
    display: flex;
    padding: 20rpx;

    .col {
      flex: 1;
      text-align: center;

      &:first-child {
        flex: 2;
      }
    }
  }

  .list-header {
    background-color: #f8f8f8;
    font-weight: bold;
  }

  .list-item {
    border-top: 1px solid #eee;

    &:hover {
      background-color: #f8f8f8;
    }
  }
}

/* 移动端和小程序卡片样式 */
.mobile-list {
  .card {
    background-color: #fff;
    border-radius: 8rpx;
    padding: 20rpx;
    margin-bottom: 20rpx;
    box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);

    .card-row {
      display: flex;
      margin-bottom: 10rpx;

      .label {
        color: #666;
        width: 160rpx;
      }

      .value {
        flex: 1;
      }
    }

    /* 移动端卡片的操作按钮样式 */
    .card-operations {
      display: flex;
      justify-content: flex-end;
      gap: 8px;  // 减小间距
      margin-top: 20rpx;

      .opt-btn {
        margin: 0;  // 移除默认的 margin
      }
    }
  }
}

/* 操作按钮样式 */
.opt-btn {
  min-width: 60px;
  height: 28px;
  line-height: 28px;
  padding: 0 12px;
  border-radius: 4px;
  font-size: 12px;
  border: none;
  cursor: pointer;
  margin-left: 12px;

  &.edit {
    background-color: #409eff;
    color: #fff;

    &:hover {
      background-color: #66b1ff;
    }

    &:active {
      background-color: #3a8ee6;
    }
  }

  &.delete {
    background-color: #f56c6c;
    color: #fff;

    &:hover {
      background-color: #f78989;
    }

    &:active {
      background-color: #dd6161;
    }
  }
}


/* 分页样式 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-top: 20px;
  background-color: #fff;
  border-radius: 8px;
  padding: 16px;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

  .page-btn {
    min-width: 70px;
    height: 32px;
    line-height: 32px;
    border: 1px solid #dcdfe6;
    border-radius: 4px;
    font-size: 14px;
    color: #606266;
    background-color: #fff;
    cursor: pointer;
    margin: 0 8px;

    &:hover:not(:disabled) {
      color: #409eff;
      border-color: #409eff;
    }

    &:active:not(:disabled) {
      border-color: #3a8ee6;
    }

    &:disabled {
      background-color: #f5f7fa;
      border-color: #e4e7ed;
      color: #c0c4cc;
      cursor: not-allowed;
    }
  }

  .page-info {
    font-size: 14px;
    color: #606266;
    margin: 0 12px;
  }
}

/* 表单样式 */
.form-content {
  padding: 20rpx;

  :deep(.uni-forms-item) {
    margin-bottom: 16rpx;

    &:last-child {
      margin-bottom: 0;
    }

    .uni-forms-item__inner {
      padding-bottom: 0;
    }
  }

  .picker-item {
    width: 100%;
    height: 80rpx;
    border: 1px solid #ddd;
    border-radius: 8rpx;
    padding: 0 20rpx;
    box-sizing: border-box;
    display: flex;
    align-items: center;
  }
}

.modal-body {
  padding: 20px;

  :deep(.uni-forms-item) {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }

    // 修改标签宽度和对齐方式
    .uni-forms-item__label {
      width: 80px !important;  // 增加标签宽度
      justify-content: flex-end !important; // 右对齐
      padding-right: 12px;
      white-space: nowrap; // 防止换行
    }

    .uni-forms-item__content {
      flex: 1;
    }

    // 统一输入框样式
    .uni-easyinput, .picker {
      height: 35px;
      line-height: 35px;
      width: 100%;
    }

    // 美化日期选择器样式
    .picker {
      background-color: #fff;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      padding: 0 12px;
      &:active {
        border-color: #007aff;
      }
    }
  }
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .add-btn {
    height: 32px;
    line-height: 32px;
    font-size: 13px;
  }

  .opt-btn {
    min-width: 60px; // 减小最小宽度
    width: 60px;     // 固定宽度
    height: 28px;
    line-height: 28px;
    padding: 0;      // 移除内边距
    border-radius: 4px;
    font-size: 12px;
    border: none;
    cursor: pointer;
    display: inline-block;

    &.edit {
      background-color: #409eff;
      color: #fff;
      margin-right: 12px;  // 添加右侧间距

      &:hover {
        background-color: #66b1ff;
      }

      &:active {
        background-color: #3a8ee6;
      }
    }

    &.delete {
      background-color: #f56c6c;
      color: #fff;

      &:hover {
        background-color: #f78989;
      }

      &:active {
        background-color: #dd6161;
      }
    }
  }

  .pagination {
    padding: 12px;

    .page-btn {
      min-width: 60px;
      height: 30px;
      line-height: 30px;
      font-size: 13px;
    }
  }
}

/* 小程序适配 */
/* #ifdef MP-WEIXIN */
.add-btn, .opt-btn, .page-btn {
  &::after {
    border: none;
  }
}
/* #endif */

.operation {
  display: flex !important;      // 使用 flex 布局
  justify-content: center !important;  // 水平居中
  align-items: center !important;      // 垂直居中
  gap: 8px;                     // 按钮之间的间距
}
</style>
