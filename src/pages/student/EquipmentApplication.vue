# DeviceApply.vue
<template>
  <Layout>
    <view class="device-apply-container">
      <!-- 搜索区域 -->
      <view class="search-box">
        <text class="title">器材</text>
        <input
            v-model="searchParams.deviceName"
            type="text"
            placeholder=""
            @input="handleSearch"
            class="search-input"
        />
      </view>

      <!-- PC端器材列表表格 -->
      <view class="device-table pc-only">
        <!-- 表头 -->
        <view class="table-header">
          <view class="th">名称</view>
          <view class="th">总量</view>
          <view class="th">余量</view>
          <view class="th">图片</view>
          <view class="th">描述</view>
          <view class="th">说明书</view>
          <view class="th">操作</view>
        </view>

        <!-- 表格内容 -->
        <view class="table-body">
          <view
              v-for="item in deviceList"
              :key="item.id"
              class="table-row"
          >
            <view class="td">{{ item.deviceName }}</view>
            <view class="td">{{ item.totalNum }}</view>
            <view class="td">{{ item.totalNum - item.outerNum }}</view>
            <view class="td">
              <image
                  v-if="item.pic"
                  :src="item.pic"
                  mode="aspectFit"
                  class="device-img"
              />
              <view v-else class="img-placeholder">暂无图片</view>
            </view>
            <view class="td ellipsis" :title="item.description">{{ item.description || '暂无描述' }}</view>
            <view class="td">
              <view v-if="item.helpB" class="doc-icon" @click="downloadHelp(item)">下载</view>
              <view v-else>-</view>
            </view>
            <view class="td">
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
            <text class="device-name">{{ item.deviceName }}</text>
            <button
                class="apply-btn"
                type="primary"
                size="mini"
                @click="openApplyModal(item)"
            >申请</button>
          </view>

          <view class="card-body">
            <view class="info-row">
              <view class="info-item">
                <text class="label">总量：</text>
                <text class="value">{{ item.totalNum }}</text>
              </view>
              <view class="info-item">
                <text class="label">余量：</text>
                <text class="value">{{ item.totalNum - item.outerNum }}</text>
              </view>
            </view>

            <view class="device-pic" v-if="item.pic">
              <image :src="item.pic" mode="aspectFit" />
            </view>

            <view class="info-row">
              <text class="label">描述：</text>
              <text class="value">{{ item.description || '暂无描述' }}</text>
            </view>

            <view class="info-row" v-if="item.helpB">
              <text class="label">说明书：</text>
              <view class="doc-icon" @click="downloadHelp(item)">下载</view>
            </view>
          </view>
        </view>
      </view>

      <!-- 分页器 -->
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
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { deviceApi } from '@/api/device'
import debounce from 'lodash/debounce'
import Layout from '@/components/layout/Layout.vue'
import { subjectApi } from "@/api/subject"
import type { DeviceBorrowRequest } from '@/api/types'

// 搜索参数
const searchParams = ref({
  deviceName: '',
  current: 1,
  pageSize: 10
})

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
  return num > 0 && num <= availableNum
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
  selectedDevice.value = device
  applyNum.value = 1
  selectedSubjectId.value = ''
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
  if (!isValidForm.value) return

  try {
    const borrowData: DeviceBorrowRequest = {
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
      fetchDeviceList() // 刷新列表
    } else {
      uni.showToast({
        title: '申请失败',
        icon: 'error'
      })
    }
  } catch (error) {
    console.error(error)
    uni.showToast({
      title: '申请失败，请重试',
      icon: 'error'
    })
  }
}

// 初始化
onMounted(() => {
  fetchDeviceList()
  getSubjectList()
})

</script>

<style lang="scss" scoped>
.device-apply-container {
  padding: 20px;
  background-color: #fff;

  .search-box {
    display: flex;
    align-items: center;
    margin-bottom: 20px;

    .title {
      font-size: 16px;
      font-weight: bold;
      margin-right: 10px;
    }

    .search-input {
      flex: 1;
      height: 32px;
      border: 1px solid #ddd;
      border-radius: 4px;
      padding: 0 10px;

      &:focus {
        border-color: #1890ff;
        outline: none;
      }
    }
  }

  // PC端表格样式
  .device-table {
    border: 1px solid #eee;
    border-radius: 4px;
    overflow: hidden;

    .table-header {
      display: flex;
      background-color: #f5f5f5;
      border-bottom: 1px solid #eee;

      .th {
        flex: 1;
        padding: 12px;
        font-weight: bold;
        text-align: center;
        font-size: 14px;

        &:first-child {
          flex: 2;
          text-align: left;
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
          flex: 1;
          padding: 12px;
          text-align: center;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;

          &:first-child {
            flex: 2;
            text-align: left;
            justify-content: flex-start;
          }

          .device-img {
            width: 60px;
            height: 40px;
            object-fit: contain;
            background-color: #f8f9fa;
            border-radius: 2px;
          }

          .img-placeholder {
            color: #999;
            font-size: 12px;
          }

          .doc-icon {
            padding: 2px 8px;
            background-color: #f0f0f0;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            color: #1890ff;
            transition: all 0.3s ease;

            &:hover {
              background-color: #e6f7ff;
            }
          }

          .apply-btn {
            background-color: #1890ff;
            color: #fff;
            border: none;
            padding: 4px 12px;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.3s ease;

            &:hover {
              background-color: #40a9ff;
            }

            &:active {
              background-color: #096dd9;
            }
          }
        }

        .ellipsis {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          max-width: 200px;
        }
      }
    }
  }

  // 移动端卡片样式
  .device-cards {
    .device-card {
      background: #fff;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      margin-bottom: 16px;
      overflow: hidden;

      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 12px;
        background-color: #f8f9fa;
        border-bottom: 1px solid #eee;

        .device-name {
          font-size: 16px;
          font-weight: bold;
          color: #333;
        }

        .apply-btn {
          background-color: #1890ff;
          color: #fff;
          border: none;
          padding: 4px 12px;
          border-radius: 4px;
          font-size: 12px;
          transition: all 0.3s ease;

          &:active {
            background-color: #096dd9;
          }
        }
      }

      .card-body {
        padding: 12px;

        .info-row {
          display: flex;
          align-items: flex-start;
          margin-bottom: 8px;
          font-size: 14px;
          flex-wrap: wrap;

          .info-item {
            display: flex;
            align-items: center;
            margin-right: 24px;
            margin-bottom: 4px;
          }

          .label {
            color: #666;
            margin-right: 4px;
          }

          .value {
            color: #333;
            word-break: break-all;
          }
        }

        .device-pic {
          margin: 12px 0;
          display: flex;
          justify-content: center;
          background-color: #f8f9fa;
          padding: 8px;
          border-radius: 4px;

          image {
            width: 120px;
            height: 80px;
            object-fit: contain;
          }
        }

        .doc-icon {
          padding: 2px 8px;
          background-color: #f0f0f0;
          border-radius: 4px;
          font-size: 12px;
          cursor: pointer;
          color: #1890ff;
          display: inline-block;
          transition: all 0.3s ease;

          &:active {
            background-color: #bae7ff;
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

  // 分页器
  .pagination {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    margin-top: 20px;
    padding: 10px 0;

    .page-btn {
      margin: 0 5px;
      padding: 4px 12px;
      font-size: 14px;
      border: 1px solid #ddd;
      border-radius: 4px;
      background-color: #fff;
      transition: all 0.3s ease;

      &:disabled {
        color: #999;
        cursor: not-allowed;
        background-color: #f5f5f5;

        &:hover {
          color: #999;
          border-color: #ddd;
        }
      }

      &:not(:disabled):hover {
        color: #1890ff;
        border-color: #1890ff;
      }

      &:not(:disabled):active {
        background-color: #e6f7ff;
      }
    }

    .page-info {
      margin: 0 10px;
      font-size: 14px;
      color: #666;
    }

    .page-input {
      width: 60px;
      height: 28px;
      margin: 0 10px;
      text-align: center;
      border: 1px solid #ddd;
      border-radius: 4px;
      transition: all 0.3s ease;

      &:focus {
        border-color: #1890ff;
        outline: none;
        box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
      }
    }
  }

  // Loading状态
  .loading-container {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 200px;

    .loading-text {
      color: #666;
      font-size: 14px;
    }
  }

  // 空状态
  .empty-container {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    min-height: 200px;

    .empty-icon {
      font-size: 48px;
      color: #ccc;
      margin-bottom: 16px;
    }

    .empty-text {
      color: #999;
      font-size: 14px;
    }
  }
}

// 响应式适配
@media screen and (max-width: 768px) {
  .device-apply-container {
    padding: 10px;

    .pc-only {
      display: none;
    }

    .mobile-only {
      display: block;
    }

    .pagination {
      flex-wrap: wrap;
      justify-content: center;
      gap: 8px;

      .page-btn {
        margin: 0;
      }

      .page-input {
        width: 50px;
      }
    }

    .search-box {
      .search-input {
        height: 36px;
      }
    }
  }
}

// 弹窗样式
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
    padding: 16px;
    border-bottom: 1px solid #eee;
    background-color: #fafafa;

    text {
      font-size: 16px;
      font-weight: bold;
      color: #333;
    }

    .close-btn {
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

  .modal-body {
    padding: 20px;

    .form-item {
      display: flex;
      align-items: center;
      margin-bottom: 16px;

      text {
        font-size: 14px;
        color: #333;

        &:first-child {
          width: 80px;
          flex-shrink: 0;
        }
      }

      .apply-input {
        flex: 1;
        height: 32px;
        padding: 0 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        transition: all 0.3s ease;

        &:focus {
          border-color: #1890ff;
          outline: none;
          box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
        }

        &::-webkit-inner-spin-button,
        &::-webkit-outer-spin-button {
          -webkit-appearance: none;
          margin: 0;
        }
      }
    }
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    padding: 16px;
    border-top: 1px solid #eee;
    background-color: #fafafa;

    button {
      margin-left: 12px;
      padding: 6px 16px;
      font-size: 14px;
      border-radius: 4px;
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
        border: 1px solid #ddd;
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

.apply-modal {
  .modal-body {
    .form-item {
      .apply-select {
        flex: 1;
        height: 32px;
        padding: 0 10px;
        border: 1px solid #ddd;
        border-radius: 4px;
        transition: all 0.3s ease;
        background-color: #fff;

        &:focus {
          border-color: #1890ff;
          outline: none;
          box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.2);
        }
      }
    }
  }
}
</style>
