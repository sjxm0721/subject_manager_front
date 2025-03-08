<!-- pages/teacher/equipment/inventory.vue -->
<template>
    <view class="inventory-container">
      <!-- 搜索区域 -->
      <view class="search-section">
        <uni-easyinput
            v-model="searchParams.deviceName"
            placeholder="搜索器材名称"
            prefixIcon="search"
            class="search-input"
        />
      </view>

      <!-- 表格区域 -->
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
            <!-- 移动端卡片式布局 -->
            <template v-if="isMobile">
              <view
                  v-for="item in deviceList"
                  :key="item.id"
                  class="device-card"
              >
                <view class="card-header">
                  <text class="device-name">{{ item.deviceName }}</text>
                  <text class="device-quantity">总量：{{ item.totalNum }}</text>
                  <text class="device-quantity remain">余量：{{ item.totalNum - (item.outerNum || 0) }}</text>
                </view>
                <view class="card-body">
                  <view class="image-container">
                    <image
                        v-if="item.pic"
                        :src="item.pic"
                        mode="aspectFit"
                        class="device-image"
                        @click="previewImage(item.pic)"
                    />
                    <view v-else class="no-image">暂无图片</view>
                  </view>
                  <view class="device-info">
                    <view class="desc">{{ item.description || '暂无描述' }}</view>
                    <view class="actions">
                      <button
                          v-if="item.helpB"
                          class="action-btn"
                          @click="viewHelp(item)"
                      >
                        说明书
                      </button>
                      <button
                          class="action-btn primary"
                          @click="showDeviceDetail(item)"
                      >
                        详情
                      </button>
                    </view>
                  </view>
                </view>
              </view>
            </template>

            <!-- PC端表格布局 -->
            <template v-else>
              <uni-table
                  ref="table"
                  border
                  stripe
                  emptyText="暂无数据"
              >
                <uni-tr>
                  <uni-th width="200">名称</uni-th>
                  <uni-th width="80">总量</uni-th>
                  <uni-th width="80">余量</uni-th>
                  <uni-th width="100">图片</uni-th>
                  <uni-th>描述</uni-th>
                  <uni-th width="80">说明书</uni-th>
                  <uni-th width="80">操作</uni-th>
                </uni-tr>
                <uni-tr v-for="item in deviceList" :key="item.id">
                  <uni-td>{{ item.deviceName }}</uni-td>
                  <uni-td>{{ item.totalNum }}</uni-td>
                  <uni-td>{{ item.totalNum - (item.outerNum || 0) }}</uni-td>
                  <uni-td>
                    <image
                        v-if="item.pic"
                        :src="item.pic"
                        mode="aspectFit"
                        class="device-image"
                        @click="previewImage(item.pic)"
                    />
                    <view v-else class="no-image">暂无图片</view>
                  </uni-td>
                  <uni-td>{{ item.description || '-' }}</uni-td>
                  <uni-td>
                    <button
                        v-if="item.helpB"
                        class="text-button text-blue-500"
                        @click="viewHelp(item)"
                    >
                      查看
                    </button>
                    <text v-else>-</text>
                  </uni-td>
                  <uni-td>
                    <button
                        class="text-button text-blue-500"
                        @click="showDeviceDetail(item)"
                    >
                      详情
                    </button>
                  </uni-td>
                </uni-tr>
              </uni-table>
            </template>
          </template>

          <!-- 分页器 -->
          <view v-if="!loading && deviceList.length > 0" class="pagination-section">
            <uni-pagination
                show-icon
                :total="total"
                :pageSize="searchParams.size"
                :current="searchParams.current"
                @change="handlePageChange"
            />
          </view>
        </view>
      </scroll-view>

      <!-- 器材详情弹窗 -->
      <uni-popup ref="deviceDetailPopup">
        <uni-popup-dialog
            type="info"
            title="器材详情"
            :before-close="true"
            @close="closeDeviceDetail"
            @confirm="confirmDeviceDetail"
            :loading="updating"
        >
          <view class="device-detail-form">
            <uni-forms
                ref="deviceForm"
                :model="currentDevice"
                :rules="rules"
                validateTrigger="submit"
            >
              <uni-forms-item label="名称" required name="deviceName">
                <uni-easyinput v-model="currentDevice.deviceName"/>
              </uni-forms-item>
              <uni-forms-item label="数量" required name="totalNum">
                <uni-easyinput
                    type="number"
                    v-model="currentDevice.totalNum"
                    placeholder="请输入数量"
                />
              </uni-forms-item>
              <uni-forms-item label="描述" name="description">
                <uni-easyinput
                    type="textarea"
                    v-model="currentDevice.description"
                    placeholder="请输入器材描述"
                />
              </uni-forms-item>
            </uni-forms>
          </view>
        </uni-popup-dialog>
      </uni-popup>
    </view>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, watch,onBeforeUnmount } from 'vue'
import { deviceApi } from '@/api/device'
import {Device, DeviceUpdateRequest} from "@/types/device"
import Layout from '@/components/layout/Layout.vue'
import { debounce } from 'lodash'

// 搜索参数
interface SearchParams {
  deviceName?: string
  current: number
  size: number
}

const searchParams = reactive<SearchParams>({
  deviceName: '',
  current: 1,
  size: 10
})

const loading = ref(false)
const deviceList = ref<Device[]>([])
const total = ref(0)
const deviceDetailPopup = ref<any>(null)
const currentDevice = ref<Device>({} as Device)
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

// 获取器材列表
const getDeviceList = async () => {
  loading.value = true
  try {
    const res = await deviceApi.getDevicePage(searchParams)
    deviceList.value = res.records
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
  getDeviceList()
}, 300)

// 监听搜索关键词变化
watch(() => searchParams.deviceName, () => {
  debouncedSearch()
})

// 分页变化
const handlePageChange = (e: { type: string; current: number }) => {
  searchParams.current = e.current
  getDeviceList()
}

// 预览图片
const previewImage = (url: string) => {
  uni.previewImage({
    urls: [url]
  })
}

// 查看说明书
const viewHelp = (device: Device) => {
  if (!device.helpB) {
    uni.showToast({
      title: '暂无说明书',
      icon: 'none'
    })
    return
  }

  // H5环境直接打开链接
  // #ifdef H5
  window.open(device.helpB)
  return
  // #endif

  // 小程序环境下载并打开
  // #ifdef MP-WEIXIN
  uni.showLoading({
    title: '正在下载...'
  })

  // 下载文件
  uni.downloadFile({
    url: device.helpB,
    success: (res) => {
      if (res.statusCode === 200) {
        // 保存文件到本地
        uni.saveFile({
          tempFilePath: res.tempFilePath,
          success: (saveRes) => {
            // 打开文件
            uni.openDocument({
              filePath: saveRes.savedFilePath,
              success: () => {
                uni.showToast({
                  title: '打开成功',
                  icon: 'success'
                })
              },
              fail: (error) => {
                uni.showToast({
                  title: '打开文件失败',
                  icon: 'error'
                })
              }
            })
          },
          fail: (error) => {
            uni.showToast({
              title: '保存文件失败',
              icon: 'error'
            })
          }
        })
      } else {
        uni.showToast({
          title: '下载失败',
          icon: 'error'
        })
      }
    },
    fail: (error) => {
      uni.showToast({
        title: '下载失败',
        icon: 'error'
      })
    },
    complete: () => {
      uni.hideLoading()
    }
  })
  // #endif
}

// 显示器材详情
const showDeviceDetail = (device: Device) => {
  currentDevice.value = { ...device }
  deviceDetailPopup.value?.open()
}

// 关闭器材详情
const closeDeviceDetail = () => {
  deviceDetailPopup.value?.close()
}


// 在 script setup 中添加
// 表单规则
const rules = {
  deviceName: {
    rules: [{
      required: true,
      errorMessage: '请输入器材名称'
    }]
  },
  totalNum: {
    rules: [{
      required: true,
      errorMessage: '请输入数量'
    }]
  }
}

const deviceForm = ref<any>(null)
const updating = ref(false)

// 确认修改器材信息
const confirmDeviceDetail = async () => {
  // 表单验证
  try {
    await deviceForm.value?.validate()
  } catch (e) {
    return
  }

  // 构建更新请求参数
  const updateData: DeviceUpdateRequest = {
    id: currentDevice.value.id!,
    deviceName: currentDevice.value.deviceName,
    totalNum: Number(currentDevice.value.totalNum),
    description: currentDevice.value.description || ''
  }

  updating.value = true
  try {
    await deviceApi.updateDevice(updateData)
    uni.showToast({
      title: '修改成功',
      icon: 'success'
    })
    closeDeviceDetail()
    getDeviceList() // 刷新列表
  } catch (error) {
    uni.showToast({
      title: error?.message || '修改失败',
      icon: 'error'
    })
  } finally {
    updating.value = false
  }
}

onMounted(() => {
  checkDevice()
  getDeviceList()

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
.inventory-container {
  padding: 16px;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;

  .search-section {
    padding: 16px;
    background: #fff;
    border-radius: 8px;
    margin-bottom: 16px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    .search-input {
      max-width: 300px;
    }
  }

  .table-content {
    flex: 1;
    overflow: hidden;

    // PC端表格样式
    .uni-table {
      :deep(.uni-table-tr) {
        .uni-table-th:last-child,
        .uni-table-td:last-child {
          width: 80px !important;
          min-width: 80px !important;
          max-width: 80px !important;
        }
      }

      .text-button {
        width: 64px;
        padding: 6px 0;
        text-align: center;
        border-radius: 4px;
        transition: background 0.3s;
        margin: 0 auto;
        display: block;
        font-size: 14px;

        &:hover {
          background: rgba(41, 121, 255, 0.1);
        }
      }
    }

    &.is-mobile {
      .device-card {
        .card-header {
          .quantity-info {
            display: flex;
            gap: 8px;

            .device-quantity {
              font-size: 14px;
              color: #666;
              background: #f5f7fa;
              padding: 4px 12px;
              border-radius: 16px;

              &.remain {
                background: #e6f7ff;
                color: #1890ff;
              }
            }
          }
        }
      }
    }

    // 移动端样式
    &.is-mobile {
      //padding: 0 16px;

      .device-card {
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

          .device-name {
            font-size: 16px;
            font-weight: 500;
            color: #333;
          }

          .device-quantity {
            font-size: 14px;
            color: #666;
            background: #f5f7fa;
            padding: 4px 12px;
            border-radius: 16px;
          }
        }

        .card-body {
          display: flex;
          gap: 12px;

          .image-container {
            width: 100px;
            height: 75px;
            flex-shrink: 0;
            border-radius: 6px;
            overflow: hidden;
            background: #f5f7fa;

            .device-image {
              width: 100%;
              height: 100%;
              object-fit: cover;
            }

            .no-image {
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #999;
              font-size: 12px;
            }
          }

          .device-info {
            flex: 1;
            min-width: 0; // 防止文本溢出
            display: flex;
            flex-direction: column;
            justify-content: space-between;

            .desc {
              font-size: 14px;
              color: #666;
              line-height: 1.5;
              margin-bottom: 12px;
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
            }

            .actions {
              display: flex;
              gap: 8px;
              justify-content: flex-end;

              .action-btn {
                min-width: 72px;
                padding: 6px 12px;
                border-radius: 4px;
                font-size: 14px;
                text-align: center;
                border: 1px solid #e0e0e0;
                background: #fff;
                color: #666;
                margin: 0;

                &.primary {
                  background: #2979ff;
                  color: #fff;
                  border-color: #2979ff;
                }

                &:active {
                  opacity: 0.8;
                }
              }
            }
          }
        }
      }
    }
  }

  // 通用图片样式
  .device-image {
    width: 80px;
    height: 60px;
    object-fit: cover;
    border-radius: 4px;
  }

  .no-image {
    width: 80px;
    height: 60px;
    display: flex;
    align-items: center;
    justify-content: center;
    background-color: #f5f5f5;
    color: #999;
    font-size: 12px;
    border-radius: 4px;
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

// 暗色主题适配
@media (prefers-color-scheme: dark) {
  .inventory-container {
    //background-color: #1a1a1a;

    .search-section,
    .table-content .device-card,
    .pagination-section {
      //background-color: #2d2d2d;
      border-color: #3d3d3d;
    }

    .device-card {
      .card-header {
        border-bottom-color: #3d3d3d;

        .device-name {
          color: #fff;
        }

        .device-quantity {
          background: #3d3d3d;
          color: #999;
        }
      }

      .device-info .desc {
        color: #999;
      }

      .actions .action-btn {
        background: #3d3d3d;
        border-color: #3d3d3d;
        color: #fff;

        &.primary {
          background: #2979ff;
          border-color: #2979ff;
        }
      }
    }

    .no-image {
      background-color: #333;
      color: #666;
    }
  }
}

// 弹窗样式调整
:deep(.uni-popup) {
  // 移除 position: fixed 相关样式
  .uni-popup__wrapper {
    max-width: 90%;
    min-width: 300px;
  }
}

.device-detail-form {
  padding: 20px;

  :deep(.uni-forms-item) {
    margin-bottom: 16px;

    &:last-child {
      margin-bottom: 0;
    }

    .uni-forms-item__inner {
      padding-bottom: 0;
    }
  }
}
</style>
