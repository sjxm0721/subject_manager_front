// pages/teacher/equipment/borrow.vue
<template>
    <view class="borrow-container">
      <!-- 搜索区域 -->
      <view class="search-section">
        <view class="search-inputs">
          <view class="input-group">
            <uni-data-select
                v-model="searchParams.subjectId"
                :localdata="subjectList"
                placeholder="选择课程"
                class="search-input"
            />
          </view>
          <view class="input-group">
            <uni-easyinput
                v-model="searchParams.groupNum"
                placeholder="请输入组号"
                class="search-input"
            />
          </view>
          <view class="input-group">
            <uni-easyinput
                v-model="searchParams.deviceName"
                placeholder="请输入器材名称"
                class="search-input"
            />
          </view>
          <view class="input-group">
            <uni-data-select
                v-model="searchParams.status"
                :localdata="statusOptions"
                placeholder="选择状态"
                class="status-select"
            />
          </view>
          <button
              class="export-btn"
              @click="handleExport"
          >
            导出
          </button>
        </view>
      </view>

      <!-- 表格内容区域 -->
      <scroll-view
          scroll-y
          class="table-content"
          :class="{ 'is-mobile': isMobile }"
      >
        <view class="table-list">
          <view v-if="loading" class="loading-state">
            <uni-load-more status="loading" />
          </view>

          <template v-else>
            <!-- PC端表格布局 -->
            <template v-if="!isMobile">
              <uni-table
                  ref="table"
                  border
                  stripe
                  emptyText="暂无数据"
              >
                <uni-tr>
                  <uni-th width="80">组号</uni-th>
                  <uni-th width="120">成员</uni-th>
                  <uni-th width="120">课程名称</uni-th>
                  <uni-th width="120">申请器材</uni-th>
                  <uni-th width="80">申请数量</uni-th>
                  <uni-th width="80">状态</uni-th>
                  <uni-th width="80">操作</uni-th>
                </uni-tr>
                <uni-tr v-for="item in borrowList" :key="item.id">
                  <uni-td>{{ item.groupNum }}</uni-td>
                  <uni-td>{{ item.member.map(user => user.userName).join(', ') }}</uni-td>
                  <uni-td>{{ item.subjectName }}</uni-td>
                  <uni-td>{{ item.deviceName }}</uni-td>
                  <uni-td>{{ item.applyNum }}</uni-td>
                  <uni-td>
                    <view :class="['status-tag', getStatusClass(item.status)]">
                      {{ getStatusText(item.status) }}
                    </view>
                  </uni-td>
                  <uni-td>
                    <template v-if="item.status === 0">
                      <button
                          class="action-btn primary"
                          @click="showApprovalDialog(item)"
                      >审批</button>
                    </template>
                    <template v-if="item.status === 3">
                      <button
                          class="action-btn success"
                          @click="handleConfirmReturn(item)"
                      >确认归还</button>
                    </template>
                  </uni-td>
                </uni-tr>
              </uni-table>
            </template>

            <!-- 移动端卡片布局 -->
            <template v-else>
              <view
                  v-for="item in borrowList"
                  :key="item.id"
                  class="borrow-card"
              >
                <view class="card-header">
                  <text class="group-num">组号：{{ item.groupNum }}</text>
                  <view :class="['status-tag', getStatusClass(item.status)]">
                    {{ getStatusText(item.status) }}
                  </view>
                </view>
                <view class="card-content">
                  <view class="info-item">
                    <text class="label">课程名称：</text>
                    <text class="value">{{ item.subjectName }}</text>
                  </view>
                  <view class="info-item">
                    <text class="label">成员：</text>
                    <text class="value">{{ item.member.map(user => user.userName).join(', ') }}</text>
                  </view>
                  <view class="info-item">
                    <text class="label">申请器材：</text>
                    <text class="value">{{ item.deviceName }}</text>
                  </view>
                  <view class="info-item">
                    <text class="label">申请数量：</text>
                    <text class="value">{{ item.applyNum }}</text>
                  </view>

                  <view class="action-row">
                    <template v-if="item.status === 0">
                      <button
                          class="action-btn primary"
                          @click="showApprovalDialog(item)"
                      >审批</button>
                    </template>
                    <template v-if="item.status === 3">
                      <button
                          class="action-btn success"
                          @click="handleConfirmReturn(item)"
                      >确认归还</button>
                    </template>
                  </view>
                </view>
              </view>
            </template>
          </template>

          <!-- 分页器 -->
          <view v-if="!loading && borrowList.length > 0" class="pagination-section">
            <uni-pagination
                show-icon
                show-jumper
                :total="total"
                :pageSize="searchParams.size"
                :current="searchParams.current"
                @change="handlePageChange"
            />
          </view>
        </view>
      </scroll-view>
    </view>
  <!-- 审批弹窗 -->
  <uni-popup ref="approvalPopup" type="dialog">
    <uni-popup-dialog
        title="审批申请"
        :content="'确定要' + (approvalAction === 'approve' ? '同意' : '拒绝') + '此申请吗？'"
        :before-close="true"
        @confirm="handleApprovalConfirm"
        @close="closeApprovalDialog"
    >
      <view class="approval-buttons">
        <button
            class="approval-btn approve"
            :class="{ active: approvalAction === 'approve' }"
            @click="approvalAction = 'approve'"
        >同意</button>
        <button
            class="approval-btn reject"
            :class="{ active: approvalAction === 'reject' }"
            @click="approvalAction = 'reject'"
        >拒绝</button>
      </view>
    </uni-popup-dialog>
  </uni-popup>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch,onBeforeUnmount } from 'vue'
import { debounce } from 'lodash'
import Layout from '@/components/layout/Layout.vue'

// 类型定义
import { DeviceBorrowPageRequest, DeviceBorrowPageVO } from '@/types/device'
import {UserInfo} from "@/types/user";


const approvalPopup = ref<any>(null)
const approvalAction = ref<'approve' | 'reject'>('approve')
const currentItem = ref<any>(null)

interface SearchParams extends Omit<DeviceBorrowPageRequest, 'pageSize'> {
  size: number
}

interface BorrowItem {
  id: string
  subjectId: string
  subjectName: string
  groupNum: string
  member: UserInfo[]
  deviceName: string
  applyNum: number
  status: number
}

// 状态选项
const statusOptions = [
  { value: '', text: '全部' },
  { value: 0, text: '申请中' },
  { value: 1, text: '已同意' },
  { value: 2, text: '拒绝' },
  { value: 3, text: '归还中' },
  { value: 4, text: '已归还' }
]

// 响应式数据
const subjectList = ref<{value: number, text: string}[]>([])


const showApprovalDialog = (item: any) => {
  currentItem.value = item
  approvalAction.value = 'approve'
  approvalPopup.value?.open()
}

// 关闭审批弹窗
const closeApprovalDialog = () => {
  approvalPopup.value?.close()
  currentItem.value = null
}

// 处理审批确认
const handleApprovalConfirm = async () => {
  if (!currentItem.value) return

  try {
    if (approvalAction.value === 'approve') {
      await deviceApi.approveBorrow(currentItem.value.id)
    } else {
      await deviceApi.rejectBorrow(currentItem.value.id)
    }

    uni.showToast({
      title: '操作成功',
      icon: 'success'
    })
    closeApprovalDialog()
    getBorrowList() // 刷新列表
  } catch (error) {
    uni.showToast({
      title: error?.message || '操作失败',
      icon: 'error'
    })
  }
}

// 处理确认归还
const handleConfirmReturn = async (item: any) => {
  try {
    await deviceApi.confirmReturn(item.id)
    uni.showToast({
      title: '确认归还成功',
      icon: 'success'
    })
    getBorrowList() // 刷新列表
  } catch (error) {
    uni.showToast({
      title: error?.message || '确认失败',
      icon: 'error'
    })
  }
}

// 获取课程列表
const getSubjectList = async () => {
  try {
    const res = await subjectApi.getSubjectList()
    subjectList.value = res.map(item => ({
      value: item.id,
      text: item.title + ' - ' + item.grade
    }))
  } catch (error) {
    uni.showToast({
      title: error?.message || '获取课程列表失败',
      icon: 'error'
    })
  }
}

const searchParams = reactive<SearchParams>({
  subjectId: '',
  groupNum: '',
  deviceName: '',
  status: '',
  current: 1,
  size: 10
})

const loading = ref(false)
const borrowList = ref<BorrowItem[]>([])
const total = ref(0)
const isMobile = ref(false)

// 检查设备类型
const checkDevice = () => {
  // #ifdef H5
  const systemInfo = uni.getSystemInfoSync()
  isMobile.value = systemInfo.windowWidth <= 768
  // #endif

  // #ifdef MP-WEIXIN
  isMobile.value = true
  // #endif
}

import { deviceApi } from '@/api/device'
import {subjectApi} from "@/api/subject";

// 获取借用列表
const getBorrowList = async () => {
  loading.value = true
  try {
    const requestParams: DeviceBorrowPageRequest = {
      subjectId: searchParams.subjectId || '',
      groupNum: searchParams.groupNum ? Number(searchParams.groupNum) : '',
      deviceName: searchParams.deviceName ? Number(searchParams.deviceName) : '',
      status: searchParams.status === '' ? '' : Number(searchParams.status), // 修改这里
      current: searchParams.current,
      pageSize: searchParams.size
    }
    const res = await deviceApi.borrowPage(requestParams)
    borrowList.value = res.records
    total.value = res.total
  } catch (error) {
    uni.showToast({
      title: error?.message || '获取数据失败',
      icon: 'error'
    })
  } finally {
    loading.value = false
  }
}

// 使用debounce处理搜索
const debouncedSearch = debounce(() => {
  searchParams.current = 1
  getBorrowList()
}, 300)

// 监听搜索参数变化
watch(
    () => [
      searchParams.groupNum,
      searchParams.deviceName,
      searchParams.status,
      searchParams.subjectId  // 添加对课程 ID 的监听
    ],
    () => {
      debouncedSearch()
    }
)

// 分页变化处理
const handlePageChange = (e: { type: string; current: number }) => {
  searchParams.current = e.current
  getBorrowList()
}

// 导出处理
const handleExport = async () => {
  try {
    // 这里替换为实际的导出API调用
    await deviceApi.exportDevice()
    uni.showToast({
      title: '导出成功',
      icon: 'success'
    })
  } catch (error) {
    uni.showToast({
      title: error?.message || '导出失败',
      icon: 'error'
    })
  }
}

// 获取状态样式类名
const getStatusClass = (status: number) => {
  const classMap: Record<number, string> = {
    0: 'status-pending',    // 黄色
    1: 'status-approved',   // 绿色
    2: 'status-rejected',   // 红色
    3: 'status-returning',  // 橙色
    4: 'status-returned'    // 蓝色
  }
  return classMap[status] || ''
}

// 获取状态显示文本
const getStatusText = (status: number) => {
  const textMap: Record<number, string> = {
    0: '申请中',
    1: '已同意',
    2: '拒绝',
    3: '归还中',
    4: '已归还'
  }
  return textMap[status] || String(status)
}

onMounted(() => {
  checkDevice()
  getSubjectList()
  getBorrowList()

  // #ifdef H5
  window.addEventListener('resize', checkDevice)
  // #endif
})

onBeforeUnmount(() => {
  // #ifdef H5
  window.removeEventListener('resize', checkDevice)
  // #endif
})
</script>

<style lang="scss">
.borrow-container {
  height: 100%;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;

  .search-section {
    padding: 16px;
    background: #fff;
    border-radius: 8px;
    margin-bottom: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .search-inputs {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;

      .input-group {
        flex: 1;
        min-width: 200px;

        @media screen and (max-width: 768px) {
          min-width: 100%;
        }
      }

      .export-btn {
        height: 35px;
        padding: 0 24px;
        background: #2979ff;
        color: #fff;
        border-radius: 4px;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: background 0.3s;

        &:hover {
          background: darken(#2979ff, 5%);
        }

        &:active {
          background: darken(#2979ff, 10%);
        }
      }
    }
  }

  .table-content {
    flex: 1;
    overflow: hidden;

    .status-tag {
      display: inline-block;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
      text-align: center;
      white-space: nowrap;

      &.status-pending {    // 申请中 - 黄色
        background: rgba(250, 173, 20, 0.1);
        color: #faad14;
      }

      &.status-approved {   // 已同意 - 绿色
        background: rgba(82, 196, 26, 0.1);
        color: #52c41a;
      }

      &.status-rejected {   // 拒绝 - 红色
        background: rgba(245, 34, 45, 0.1);
        color: #f5222d;
      }

      &.status-returning {  // 归还中 - 橙色
        background: rgba(250, 140, 22, 0.1);
        color: #fa8c16;
      }

      &.status-returned {   // 已归还 - 蓝色
        background: rgba(24, 144, 255, 0.1);
        color: #1890ff;
      }
    }
    &.is-mobile {
      .borrow-card {
        background: #fff;
        border-radius: 12px;
        padding: 16px;
        margin-bottom: 16px;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);

        .card-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
          padding-bottom: 12px;
          border-bottom: 1px solid #f0f0f0;

          .group-num {
            font-size: 16px;
            font-weight: 500;
            color: #333;
          }
        }

        .card-content {
          .info-item {
            display: flex;
            margin-bottom: 8px;

            &:last-child {
              margin-bottom: 0;
            }

            .label {
              width: 80px;
              color: #666;
              flex-shrink: 0;
            }

            .value {
              flex: 1;
              color: #333;
            }
          }
        }
      }
    }
  }

  .pagination-section {
    padding: 16px;
    display: flex;
    justify-content: flex-end;
    background: #fff;
    margin-top: 16px;
    border-radius: 8px;
  }

  .loading-state {
    padding: 24px;
    display: flex;
    justify-content: center;
  }
}

.action-btn {
  min-width: 64px;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 12px;
  border: none;
  cursor: pointer;
  transition: all 0.3s ease;
  height: 28px;
  line-height: 20px;
  display: inline-flex;
  align-items: center;
  justify-content: center;

  &.primary {
    background-color: #1890ff;
    color: #fff;

    &:hover {
      background-color: #40a9ff;
    }
  }

  &.success {
    background-color: #52c41a;
    color: #fff;

    &:hover {
      background-color: #73d13d;
    }
  }
}

// 移动端卡片中的操作按钮
.action-row {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #f0f0f0;
}

// 审批弹窗样式
.approval-buttons {
  display: flex;
  gap: 16px;
  justify-content: center;
  margin-top: 16px;

  .approval-btn {
    padding: 6px 24px;
    border-radius: 4px;
    font-size: 14px;
    border: 1px solid #ddd;
    background: #fff;
    transition: all 0.3s ease;

    &.approve {
      color: #52c41a;
      border-color: #52c41a;

      &.active {
        background: #52c41a;
        color: #fff;
      }
    }

    &.reject {
      color: #ff4d4f;
      border-color: #ff4d4f;

      &.active {
        background: #ff4d4f;
        color: #fff;
      }
    }
  }
}

.borrow-container .table-content.is-mobile {
  .action-row {
    .action-btn {
      min-width: 80px;
      padding: 4px 12px;
      font-size: 14px;
      height: 32px;
      line-height: 24px;
    }
  }
}

.uni-table-td {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 0; // 确保文本超出时会显示省略号

  &:first-child {
    padding-left: 8px !important;
  }

  &:last-child {
    padding-right: 8px !important;
  }
}

</style>
