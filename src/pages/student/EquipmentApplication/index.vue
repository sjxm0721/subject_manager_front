# DeviceApply.vue
# DeviceApply.vue

<template>
  <view class="device-apply-container">
    <!-- Tab切换 -->
    <view class="tab-container">
      <view
          class="tab-item"
          :class="{ active: activeTab === 'apply' }"
          @click="activeTab = 'apply'"
      >
        器材申请
      </view>
      <view
          class="tab-item"
          :class="{ active: activeTab === 'records' }"
          @click="activeTab = 'records'"
      >
        我的申请
      </view>
    </view>

    <view class="content-wrapper">
      <!-- 器材申请页面 -->
      <view v-show="activeTab === 'apply'">
        <view class="search-box">
          <text class="title">器材</text>
          <input
              v-model="searchParams.deviceName"
              type="text"
              placeholder="请输入器材名称"
              @input="handleSearch"
              class="search-input"
          />
        </view>

        <!-- PC端器材列表表格 -->
        <view class="device-table pc-only">
          <!-- 表头 -->
          <view class="table-header">
            <view class="th th-name">名称</view>
            <view class="th th-count">总量</view>
            <view class="th th-count">余量</view>
            <view class="th th-image">图片</view>
            <view class="th th-desc">描述</view>
            <view class="th th-doc">说明书</view>
            <view class="th th-action">操作</view>
          </view>

          <!-- 表格内容 -->
          <view class="table-body">
            <view
                v-for="item in deviceList"
                :key="item.id"
                class="table-row"
            >
              <view class="td td-name">{{ item.deviceName }}</view>
              <view class="td td-count">{{ item.totalNum }}</view>
              <view class="td td-count">{{ item.totalNum - item.outerNum }}</view>
              <view class="td td-image">
                <image
                    v-if="item.pic"
                    :src="item.pic"
                    mode="aspectFit"
                    class="device-img"
                />
                <view v-else class="img-placeholder">暂无图片</view>
              </view>
              <view class="td td-desc ellipsis" :title="item.description">{{ item.description || '暂无描述' }}</view>
              <view class="td td-doc">
                <view v-if="item.helpB" class="doc-icon" @click="downloadHelp(item)">下载</view>
                <view v-else>-</view>
              </view>
              <view class="td td-action">
                <button
                    class="apply-btn"
                    type="primary"
                    size="mini"
                    @click="openApplyModal(item)"
                >申请</button>
              </view>
            </view>
          </view>
        </view>

        <!-- 移动端器材列表卡片 -->
        <view class="device-cards mobile-only">
          <view
              v-for="item in deviceList"
              :key="item.id"
              class="device-card"
          >
            <view class="card-header">
              <view class="left-section">
                <text class="device-name">{{ item.deviceName }}</text>
              </view>
              <view class="right-section">
                <button
                    class="apply-btn"
                    type="primary"
                    size="mini"
                    @click="openApplyModal(item)"
                >申请</button>
              </view>
            </view>

            <view class="card-body">
              <view class="info-grid">
                <view class="info-item">
                  <text class="label">总量</text>
                  <text class="value">{{ item.totalNum }}</text>
                </view>
                <view class="info-item">
                  <text class="label">余量</text>
                  <text class="value">{{ item.totalNum - item.outerNum }}</text>
                </view>
              </view>

              <view class="device-pic">
                <image
                    v-if="item.pic"
                    :src="item.pic"
                    mode="aspectFit"
                    class="device-img"
                />
                <view v-else class="img-placeholder">暂无图片</view>
              </view>

              <view class="info-section">
                <text class="label">设备描述</text>
                <text class="value">{{ item.description || '暂无描述' }}</text>
              </view>

              <view v-if="item.helpB" class="doc-section">
                <text class="label">说明书</text>
                <view class="doc-icon" @click="downloadHelp(item)">下载</view>
              </view>
            </view>
          </view>
        </view>

        <!-- 器材申请页面的分页器 -->
        <view class="pagination">
          <button
              class="page-btn"
              :disabled="searchParams.current <= 1"
              @click="handlePageChange(searchParams.current - 1)"
          >上一页</button>
          <button
              class="page-btn"
              :disabled="searchParams.current >= totalPages"
              @click="handlePageChange(searchParams.current + 1)"
          >下一页</button>
          <text class="page-info">跳转至</text>
          <input
              type="number"
              v-model="currentPage"
              class="page-input"
              @blur="handlePageJump"
          />
          <button class="page-btn" @click="handlePageJump">确定</button>
        </view>
      </view>

      <!-- 我的申请页面 -->
      <view v-show="activeTab === 'records'">
        <!-- PC端申请记录表格 -->
        <view class="records-table pc-only">
          <view class="table-header">
            <view class="th th-name">设备名称</view>
            <view class="th th-count">申请数量</view>
            <view class="th th-image">图片</view>
            <view class="th th-desc">描述</view>
            <view class="th th-doc">说明书</view>
            <view class="th th-status">申请状态</view>
            <view class="th th-action">操作</view>
          </view>

          <view class="table-body">
            <view
                v-for="record in applyRecords"
                :key="record.id"
                class="table-row"
            >
              <view class="td td-name">{{ record.deviceName }}</view>
              <view class="td td-count">{{ record.applyNum }}</view>
              <view class="td td-image">
                <image
                    v-if="record.pic"
                    :src="record.pic"
                    mode="aspectFit"
                    class="device-img"
                />
                <view v-else class="img-placeholder">暂无图片</view>
              </view>
              <view class="td td-desc ellipsis" :title="record.description">
                {{ record.description || '暂无描述' }}
              </view>
              <view class="td td-doc">
                <view v-if="record.helpB" class="doc-icon" @click="downloadHelp(record)">下载</view>
                <view v-else>-</view>
              </view>
              <view class="td td-status">
                <view :class="['status-tag', getStatusClass(record.status)]">
                  {{ getStatusText(record.status) }}
                </view>
              </view>
              <view class="td td-action">
                <button
                    v-if="record.status === 0"
                    class="action-btn cancel"
                    @click="handleCancelApply(record)"
                >取消申请</button>
                <button
                    v-if="record.status === 1"
                    class="action-btn return"
                    @click="handleReturnDevice(record)"
                >归还</button>
              </view>
            </view>
          </view>
        </view>

        <!-- 移动端申请记录卡片 -->
        <view class="records-cards mobile-only">
          <view
              v-for="record in applyRecords"
              :key="record.id"
              class="record-card"
          >
            <view class="card-header">
              <view class="left-section">
                <text class="device-name">{{ record.deviceName }}</text>
              </view>
              <view class="right-section">
                <view :class="['status-tag', getStatusClass(record.status)]">
                  {{ getStatusText(record.status) }}
                </view>
              </view>
            </view>

            <view class="card-body">
              <view class="info-section">
                <text class="label">申请数量</text>
                <text class="value">{{ record.applyNum }}</text>
              </view>
              <view class="device-pic">
                <image
                    v-if="record.pic"
                    :src="record.pic"
                    mode="aspectFit"
                    class="device-img"
                />
                <view v-else class="img-placeholder">暂无图片</view>
              </view>

              <view class="info-section">
                <text class="label">设备描述</text>
                <text class="value">{{ record.description || '暂无描述' }}</text>
              </view>

              <view v-if="record.helpB" class="doc-section">
                <text class="label">说明书</text>
                <view class="doc-icon" @click="downloadHelp(record)">下载</view>
              </view>

              <view class="action-row">
                <button
                    v-if="record.status === 0"
                    class="action-btn cancel"
                    @click="handleCancelApply(record)"
                >取消申请</button>
                <button
                    v-if="record.status === 1"
                    class="action-btn return"
                    @click="handleReturnDevice(record)"
                >归还</button>
              </view>
            </view>
          </view>
        </view>

        <!-- 申请记录页面的分页器 -->
        <view class="pagination">
          <button
              class="page-btn"
              :disabled="recordsSearchParams.current <= 1"
              @click="handleRecordPageChange(recordsSearchParams.current - 1)"
          >上一页</button>
          <button
              class="page-btn"
              :disabled="recordsSearchParams.current >= recordsTotalPages"
              @click="handleRecordPageChange(recordsSearchParams.current + 1)"
          >下一页</button>
          <text class="page-info">跳转至</text>
          <input
              type="number"
              v-model="recordsCurrentPage"
              class="page-input"
              @blur="handleRecordPageJump"
          />
          <button class="page-btn" @click="handleRecordPageJump">确定</button>
        </view>
      </view>
    </view>

    <!-- 申请弹窗 -->
    <uni-popup ref="applyPopup" type="center">
      <view class="apply-modal">
        <view class="modal-header">
          <text>申请表单</text>
          <text class="close-btn" @click="closeApplyModal">×</text>
        </view>
        <view class="modal-body">
          <view class="form-item">
            <text>申请器材：</text>
            <text>{{ selectedDevice?.deviceName }}</text>
          </view>
          <view class="form-item">
            <text>申请数量：</text>
            <input
                type="number"
                v-model="applyNum"
                :max="selectedDevice?.totalNum - selectedDevice?.outerNum"
                class="apply-input"
                @input="validateApplyNum"
            />
          </view>
          <view class="form-item">
            <text>选择课程：</text>
            <select
                v-model="selectedSubjectId"
                class="apply-select"
            >
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
        </view>
        <view class="modal-footer">
          <button
              @click="handleApply"
              type="primary"
              :disabled="!isValidForm"
          >申请</button>
          <button @click="closeApplyModal">取消</button>
        </view>
      </view>
    </uni-popup>

  </view>
</template>


<script setup lang="ts">
import { ref, computed, onMounted,watch } from 'vue'
import { deviceApi } from '@/api/device'
import debounce from 'lodash/debounce'
import { subjectApi } from "@/api/subject"

//Tab 状态切换
const activeTab = ref('apply')

// 搜索参数
const searchParams = ref({
  deviceName: '',
  current: 1,
  pageSize: 10
})

// 申请记录相关
const applyRecords = ref([])
const recordsTotal = ref(0) // 新增：记录总数
const recordsSearchParams = ref({
  current: 1,
  pageSize: 10
})

// 计算申请记录总页数
const recordsTotalPages = computed(() =>
    Math.ceil(recordsTotal.value / recordsSearchParams.value.pageSize)
)
const recordsCurrentPage = ref(1)

const showConfirmDialog = (title: string, content: string): Promise<boolean> => {
  return new Promise((resolve) => {
    uni.showModal({
      title,
      content,
      success: (res) => {
        resolve(res.confirm)
      }
    })
  })
}

// 获取申请记录
const fetchApplyRecords = async () => {
  try {
    const res = await deviceApi.getMyApplyRecords(recordsSearchParams.value)
    applyRecords.value = res.records
    recordsTotal.value = res.total // 新增：保存总数
    recordsCurrentPage.value = recordsSearchParams.value.current
  } catch (error) {
    uni.showToast({
      title: '获取申请记录失败',
      icon: 'none'
    })
  }
}

// 记录页面翻页
const handleRecordPageChange = (page) => {
  if (page < 1 || page > recordsTotalPages.value) return
  recordsSearchParams.value.current = page
  fetchApplyRecords()
}

// 记录页面跳转
const handleRecordPageJump = () => {
  const page = Number(recordsCurrentPage.value)
  if (isNaN(page) || page < 1 || page > recordsTotalPages.value) {
    recordsCurrentPage.value = recordsSearchParams.value.current
    return
  }
  handleRecordPageChange(page)
}

// 状态相关方法
const getStatusText = (status: number) => {
  const statusMap = {
    0: '申请中',
    1: '已同意',
    2: '拒绝',
    3: '归还中',
    4: '已归还'
  }
  return statusMap[status] || '未知状态'
}

const getStatusClass = (status: number) => {
  const classMap = {
    0: 'status-pending',
    1: 'status-approved',
    2: 'status-rejected',
    3: 'status-returning',
    4: 'status-returned'
  }
  return classMap[status] || ''
}

// 操作相关方法
const handleCancelApply = async (record) => {
  try {
    const confirmed = await showConfirmDialog(
        '确认取消',
        '确定要取消此申请吗？'
    )
    if (!confirmed) return

    const res = await deviceApi.cancelApply(record.id)
    if (res) {
      uni.showToast({
        title: '取消申请成功',
        icon: 'success'
      })
      fetchApplyRecords()
    }
  } catch (error) {
    console.error('取消申请失败:', error)
    uni.showToast({
      title: error?.message || '取消申请失败',
      icon: 'none'
    })
  }
}

const handleReturnDevice = async (record) => {
  try {
    const confirmed = await showConfirmDialog(
        '确认归还',
        '确定要归还此器材吗？'
    )
    if (!confirmed) return

    const res = await deviceApi.returnDevice(record.id)
    if (res) {
      uni.showToast({
        title: '申请归还成功',
        icon: 'success'
      })
      fetchApplyRecords()
    }
  } catch (error) {
    console.error('申请归还失败:', error)
    uni.showToast({
      title: error?.message || '申请归还失败',
      icon: 'none'
    })
  }
}

// 数据列表
const deviceList = ref([])
const total = ref(0)
const totalPages = computed(() => Math.ceil(total.value / searchParams.value.pageSize))
const currentPage = ref(1)

// 课程列表
const subjectList = ref<{value: string, text: string}[]>([])
const selectedSubjectId = ref<string>('')

// 申请相关
const applyPopup = ref(null)
const selectedDevice = ref(null)
const applyNum = ref(1)
const isValidApplyNum = computed(() => {
  const num = Number(applyNum.value)
  const availableNum = selectedDevice.value ?
      selectedDevice.value.totalNum - selectedDevice.value.outerNum : 0
  return !isNaN(num) && num > 0 && num <= availableNum
})

// 表单验证
const isValidForm = computed(() => {
  return isValidApplyNum.value && selectedSubjectId.value
})

// 下载说明书
const downloadHelp = (device) => {
  if (!device.helpB) return
  // TODO: 调用下载接口
  uni.showToast({
    title: '开始下载说明书',
    icon: 'success'
  })
}


// 搜索防抖
const handleSearch = debounce(() => {
  searchParams.value.current = 1
  fetchDeviceList()
}, 300)

// 翻页
const handlePageChange = (page) => {
  if (page < 1 || page > totalPages.value) return
  searchParams.value.current = page
  fetchDeviceList()
}

// 页码跳转
const handlePageJump = () => {
  const page = Number(currentPage.value)
  if (isNaN(page) || page < 1 || page > totalPages.value) {
    currentPage.value = searchParams.value.current
    return
  }
  handlePageChange(page)
}

// 获取器材列表
const fetchDeviceList = async () => {
  try {
    const res = await deviceApi.getDevicePage(searchParams.value)
    deviceList.value = res.records
    total.value = res.total
    currentPage.value = searchParams.value.current
  } catch (error) {
    uni.showToast({
      title: '获取数据失败',
      icon: 'none'
    })
  }
}

// 获取课程列表
const getSubjectList = async () => {
  try {
    const res = await subjectApi.getSubjectListByStu()
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

// 打开申请弹窗
const openApplyModal = (device) => {
  // 保存选中的设备信息
  selectedDevice.value = {
    ...device,
    // 如果是从申请记录点击再次申请，需要保留设备ID
    id: device.deviceId || device.id
  }
  // 设置默认申请数量为1
  applyNum.value = 1
  // 清空已选课程
  selectedSubjectId.value = ''
  // 打开弹窗
  applyPopup.value.open()
}

// 关闭申请弹窗
const closeApplyModal = () => {
  applyPopup.value.close()
  selectedDevice.value = null
  applyNum.value = 1
  selectedSubjectId.value = ''
}

// 提交申请
const handleApply = async () => {
  // 表单验证
  if (!selectedDevice.value || !isValidApplyNum.value || !selectedSubjectId.value) {
    uni.showToast({
      title: '请填写完整的申请信息',
      icon: 'none'
    })
    return
  }

  try {
    const confirmed = await showConfirmDialog(
        '确认申请',
        `确定要申请 ${selectedDevice.value.deviceName} ${applyNum.value} 个吗？`
    )
    if (!confirmed) return

    const borrowData = {
      id: selectedDevice.value.id,
      subjectStudentId: selectedSubjectId.value,
      applyNum: applyNum.value
    }

    const res = await deviceApi.borrowDevice(borrowData)

    if (res) {
      uni.showToast({
        title: '申请成功',
        icon: 'success'
      })
      closeApplyModal()
      // 刷新数据
      if (activeTab.value === 'apply') {
        fetchDeviceList()
      } else {
        fetchApplyRecords()
      }
    }
  } catch (error) {
    console.error('申请失败:', error)
    uni.showToast({
      title: error?.message || '申请失败，请重试',
      icon: 'none'
    })
  }
}

// 初始化
onMounted(() => {
  fetchDeviceList()
  getSubjectList()
  fetchApplyRecords()
})

watch(activeTab, (newTab) => {
  if (newTab === 'apply') {
    searchParams.value.current = 1;
    fetchDeviceList();
  } else {
    recordsSearchParams.value.current = 1;
    fetchApplyRecords();
  }
});

</script>

<style lang="scss" scoped>
.device-apply-container {
  padding: 20px;
  background-color: #fff;
  min-height: calc(100vh - 100px);

  // 内容包装器
  .content-wrapper {
    max-width: 1200px;
    margin: 0 auto;
    padding: 0 16px;
  }

  // Tab样式
  .tab-container {
    display: flex;
    margin: 0 0 24px;
    border-bottom: 1px solid #eee;
    background-color: #fff;
    position: sticky;
    top: 0;
    z-index: 10;

    .tab-item {
      padding: 12px 24px;
      font-size: 16px;
      color: #666;
      cursor: pointer;
      position: relative;
      transition: all 0.3s ease;

      &.active {
        color: #1890ff;
        font-weight: 500;

        &::after {
          content: '';
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 2px;
          background-color: #1890ff;
        }
      }

      &:hover {
        color: #40a9ff;
      }
    }
  }

  // 搜索框
  .search-box {
    display: flex;
    align-items: center;
    margin-bottom: 20px;
    padding: 0 4px;

    .title {
      font-size: 16px;
      font-weight: 500;
      margin-right: 12px;
      color: #333;
    }

    .search-input {
      flex: 1;
      max-width: 300px;
      height: 36px;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 0 12px;
      font-size: 14px;
      transition: all 0.3s ease;

      &:focus {
        border-color: #1890ff;
        outline: none;
        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
      }

      &::placeholder {
        color: #bbb;
      }
    }
  }

  // PC端表格通用样式
  .device-table,
  .records-table {
    width: 100%;
    border: 1px solid #eee;
    border-radius: 4px;
    overflow: hidden;
    background-color: #fff;
    margin-bottom: 20px;

    .table-header {
      display: flex;
      background-color: #fafafa;
      border-bottom: 1px solid #eee;

      .th {
        padding: 14px 12px;
        font-weight: 500;
        text-align: center;
        font-size: 14px;
        color: #333;

        &.th-name {
          flex: 1.5;
          text-align: left;
        }

        &.th-count {
          flex: 0.6;
        }

        &.th-image {
          flex: 1;
        }

        &.th-desc {
          flex: 2;
          text-align: left;
        }

        &.th-doc {
          flex: 0.8;
        }

        &.th-status {
          flex: 0.8;
        }

        &.th-action {
          flex: 1;
        }
      }
    }

    .table-body {
      .table-row {
        display: flex;
        border-bottom: 1px solid #eee;

        &:last-child {
          border-bottom: none;
        }

        &:hover {
          background-color: #fafafa;
        }

        .td {
          padding: 12px;
          text-align: center;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 60px;
          color: #333;

          &.td-name {
            flex: 1.5;
            text-align: left;
            justify-content: flex-start;
          }

          &.td-count {
            flex: 0.6;
          }

          &.td-image {
            flex: 1;
          }

          &.td-desc {
            flex: 2;
            text-align: left;
            justify-content: flex-start;
          }

          &.td-doc {
            flex: 0.8;
          }

          &.td-status {
            flex: 0.8;
          }

          &.td-action {
            flex: 1;
          }

          .device-img {
            width: 60px;
            height: 40px;
            object-fit: contain;
            background-color: #f8f9fa;
            border-radius: 2px;
          }

          .img-placeholder {
            width: 60px;
            height: 40px;
            display: flex;
            align-items: center;
            justify-content: center;
            background-color: #f5f5f5;
            color: #999;
            font-size: 12px;
            border-radius: 2px;
          }

          .doc-icon {
            padding: 4px 12px;
            background-color: #f0f0f0;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            color: #1890ff;
            transition: all 0.3s ease;

            &:hover {
              background-color: #e6f7ff;
            }

            &:active {
              background-color: #bae7ff;
            }
          }

          .status-tag {
            display: inline-block;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            line-height: 1.5;

            &.status-pending {
              background-color: #e6f7ff;
              color: #1890ff;
            }

            &.status-approved {
              background-color: #f6ffed;
              color: #52c41a;
            }

            &.status-rejected {
              background-color: #fff1f0;
              color: #f5222d;
            }

            &.status-returning {
              background-color: #fff7e6;
              color: #fa8c16;
            }

            &.status-returned {
              background-color: #f5f5f5;
              color: #666;
            }
          }

          .apply-btn,
          .action-btn {
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            border: none;
            cursor: pointer;
            transition: all 0.3s ease;
            min-width: 64px;

            &.primary,
            &.reapply {
              background-color: #1890ff;
              color: #fff;

              &:hover {
                background-color: #40a9ff;
              }

              &:active {
                background-color: #096dd9;
              }
            }

            &.cancel {
              background-color: #ff4d4f;
              color: #fff;

              &:hover {
                background-color: #ff7875;
              }

              &:active {
                background-color: #d9363e;
              }
            }

            &.return {
              background-color: #faad14;
              color: #fff;

              &:hover {
                background-color: #ffc53d;
              }

              &:active {
                background-color: #d48806;
              }
            }
          }
        }

        .ellipsis {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 100%;
          padding-right: 16px;
        }
      }
    }
  }

  // 移动端卡片样式
  .device-cards,
  .records-cards {
    .device-card,
    .record-card {
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
      margin-bottom: 16px;
      overflow: hidden;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px 16px;
        background-color: #fafafa;
        border-bottom: 1px solid #f0f0f0;

        .left-section {
          display: flex;
          align-items: center;
          gap: 12px;
          flex: 1;
          min-width: 0;

          .device-name {
            font-size: 16px;
            font-weight: 500;
            color: #333;
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
          }
        }

        .right-section {
          margin-left: 12px;
          flex-shrink: 0;

          .status-tag {
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            line-height: 1.5;

            &.status-pending {
              background-color: #e6f7ff;
              color: #1890ff;
            }

            &.status-approved {
              background-color: #f6ffed;
              color: #52c41a;
            }

            &.status-rejected {
              background-color: #fff1f0;
              color: #f5222d;
            }

            &.status-returning {
              background-color: #fff7e6;
              color: #fa8c16;
            }

            &.status-returned {
              background-color: #f5f5f5;
              color: #666;
            }
          }
        }
      }

      .card-body {
        padding: 16px;

        // 申请数量显示区域
        .info-section {
          margin-bottom: 12px;
          padding: 8px 0;

          .label {
            color: #666;
            font-size: 13px;
            margin-bottom: 4px;
            display: block;
          }

          .value {
            color: #333;
            font-size: 14px;
            font-weight: 500;
          }

          // 申请数量特殊样式
          &:first-of-type {
            border-bottom: 1px solid #f0f0f0;
            margin-bottom: 16px;
            padding-bottom: 12px;
          }
        }

        .info-grid {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 12px;
          margin-bottom: 16px;

          .info-item {
            display: flex;
            flex-direction: column;
            gap: 4px;

            .label {
              color: #666;
              font-size: 13px;
            }

            .value {
              color: #333;
              font-size: 14px;
              word-break: break-all;
            }
          }
        }

        .device-pic {
          margin: 12px 0;
          background-color: #f8f9fa;
          padding: 12px;
          border-radius: 4px;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 120px;

          image {
            display: block;
            width: 160px !important;
            height: 120px !important;
            object-fit: contain;
            background-color: #f8f9fa;
          }
        }

        .img-placeholder {
          width: 160px;
          height: 120px;
          display: flex;
          align-items: center;
          justify-content: center;
          background-color: #f5f5f5;
          color: #999;
          font-size: 12px;
          border-radius: 4px;
        }

        .doc-section {
          display: flex;
          align-items: center;
          gap: 8px;
          margin-top: 8px;

          .label {
            color: #666;
            font-size: 13px;
          }

          .doc-icon {
            padding: 4px 12px;
            background-color: #f0f0f0;
            border-radius: 4px;
            font-size: 12px;
            color: #1890ff;
            cursor: pointer;
            transition: all 0.3s ease;

            &:hover {
              background-color: #e6f7ff;
            }
          }
        }

        .action-row {
          display: flex;
          justify-content: flex-end;
          gap: 8px;
          margin-top: 16px;
          flex-wrap: wrap;

          .action-btn {
            min-width: 80px;
            height: 32px;
            padding: 0 16px;
            font-size: 14px;
            border-radius: 4px;
            cursor: pointer;
            transition: all 0.3s ease;

            &.primary,
            &.reapply {
              background-color: #1890ff;
              color: #fff;
              border: none;

              &:active {
                background-color: #096dd9;
              }
            }

            &.cancel {
              background-color: #ff4d4f;
              color: #fff;
              border: none;

              &:active {
                background-color: #d9363e;
              }
            }

            &.return {
              background-color: #faad14;
              color: #fff;
              border: none;

              &:active {
                background-color: #d48806;
              }
            }
          }
        }
      }
    }
  }

  // 分页器样式
  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 20px;
    padding: 10px 4px;
    gap: 8px;

    .page-btn {
      padding: 6px 16px;
      font-size: 14px;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      background-color: #fff;
      color: #333;
      transition: all 0.3s ease;
      height: 32px;
      display: flex;
      align-items: center;
      min-width: 80px;
      justify-content: center;

      &:disabled {
        color: #d9d9d9;
        cursor: not-allowed;
        background-color: #f5f5f5;
        border-color: #d9d9d9;
      }

      &:not(:disabled) {
        cursor: pointer;

        &:hover {
          color: #40a9ff;
          border-color: #40a9ff;
        }

        &:active {
          color: #096dd9;
          border-color: #096dd9;
        }
      }
    }

    .page-info {
      font-size: 14px;
      color: #666;
    }

    .page-input {
      width: 60px;
      height: 32px;
      text-align: center;
      border: 1px solid #d9d9d9;
      border-radius: 4px;
      transition: all 0.3s ease;

      &:focus {
        border-color: #40a9ff;
        outline: none;
        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
      }
    }
  }

  // 申请弹窗样式
  .apply-modal {
    width: 400px;
    max-width: 90vw;
    background-color: #fff;
    border-radius: 8px;
    overflow: hidden;

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #f0f0f0;
      background-color: #fafafa;

      text {
        font-size: 16px;
        font-weight: 500;
        color: #333;

        &.close-btn {
          font-size: 20px;
          color: #999;
          cursor: pointer;
          padding: 4px;
          line-height: 1;
          transition: all 0.3s ease;

          &:hover {
            color: #666;
          }
        }
      }
    }

    .modal-body {
      padding: 20px;

      .form-item {
        display: flex;
        align-items: center;
        margin-bottom: 16px;

        &:last-child {
          margin-bottom: 0;
        }

        text {
          font-size: 14px;
          color: #333;

          &:first-child {
            width: 84px;
            flex-shrink: 0;
          }
        }

        .apply-input,
        .apply-select {
          flex: 1;
          height: 32px;
          padding: 0 12px;
          border: 1px solid #d9d9d9;
          border-radius: 4px;
          transition: all 0.3s ease;
          font-size: 14px;

          &:focus {
            border-color: #40a9ff;
            outline: none;
            box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
          }
        }

        .apply-select {
          cursor: pointer;
          background-color: #fff;

          option {
            padding: 8px 12px;
          }
        }
      }
    }

    .modal-footer {
      display: flex;
      justify-content: flex-end;
      padding: 16px 20px;
      border-top: 1px solid #f0f0f0;
      background-color: #fafafa;
      gap: 12px;

      button {
        min-width: 80px;
        height: 32px;
        padding: 0 16px;
        font-size: 14px;
        border-radius: 4px;
        cursor: pointer;
        transition: all 0.3s ease;

        &[type="primary"] {
          background-color: #1890ff;
          color: #fff;
          border: none;

          &:hover {
            background-color: #40a9ff;
          }

          &:active {
            background-color: #096dd9;
          }

          &:disabled {
            background-color: #bae7ff;
            cursor: not-allowed;
          }
        }

        &:not([type="primary"]) {
          background-color: #fff;
          border: 1px solid #d9d9d9;
          color: #666;

          &:hover {
            color: #40a9ff;
            border-color: #40a9ff;
          }

          &:active {
            color: #096dd9;
            border-color: #096dd9;
          }
        }
      }
    }
  }

  // 响应式显示控制
  .pc-only {
    display: block;
  }

  .mobile-only {
    display: none;
  }

  // 响应式适配
  @media screen and (max-width: 768px) {
    padding: 12px;

    .content-wrapper {
      padding: 0;
    }

    .pc-only {
      display: none;
    }

    .mobile-only {
      display: block;
    }

    .tab-container {
      margin: -12px -12px 16px;
      padding: 0 12px;

      .tab-item {
        flex: 1;
        text-align: center;
        padding: 12px 0;
        font-size: 15px;
      }
    }

    .search-box {
      margin-bottom: 16px;

      .title {
        font-size: 15px;
      }

      .search-input {
        height: 36px;
        font-size: 14px;
      }
    }

    .pagination {
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;
      margin-top: 16px;
      padding: 8px 0;

      .page-btn {
        margin: 0;
        min-width: 70px;
      }

      .page-input {
        width: 50px;
      }

      .page-info {
        font-size: 13px;
      }
    }

    .apply-modal {
      width: calc(100vw - 32px);
      margin: 0 16px;

      .modal-header {
        padding: 14px 16px;

        text {
          font-size: 15px;

          &.close-btn {
            font-size: 18px;
            padding: 3px;
          }
        }
      }

      .modal-body {
        padding: 16px;

        .form-item {
          margin-bottom: 12px;

          text {
            font-size: 13px;

            &:first-child {
              width: 70px;
            }
          }

          .apply-input,
          .apply-select {
            height: 34px;
            font-size: 13px;
          }
        }
      }

      .modal-footer {
        padding: 12px 16px;
        gap: 8px;

        button {
          min-width: 72px;
          padding: 0 12px;
          font-size: 13px;
        }
      }
    }
  }
}
</style>
