<template>
  <Layout>
    <view class="homework-management">
      <!-- 顶部搜索和操作区 -->
      <view class="search-bar">
        <view class="search-inputs">
          <view class="input-item">
            <text class="label">年级</text>
            <input
                v-model="searchParams.grade"
                class="search-input"
                placeholder="请输入年级"
                @input="handleSearchInput"
            />
          </view>
          <view class="input-item">
            <text class="label">课程</text>
            <input
                v-model="searchParams.subjectName"
                class="search-input"
                placeholder="请输入课程"
                @input="handleSearchInput"
            />
          </view>
        </view>
        <view class="action-buttons">
          <button
              class="action-btn primary"
              @tap="handleExportHomework"
              :disabled="!selectedRows.length"
          >
            作业
          </button>
          <button
              class="action-btn info"
              @tap="handleExportInfo"
              :disabled="!selectedRows.length"
          >
            信息
          </button>
        </view>
      </view>

      <!-- PC端表格区域 -->
      <!-- #ifdef H5 -->
      <view class="table-container">
        <view class="table-header">
          <view class="th checkbox">
            <checkbox
                :checked="isAllSelected"
                @tap="toggleSelectAll"
            />
          </view>
          <view class="th">年级</view>
          <view class="th">课程</view>
          <view class="th">组号</view>
          <view class="th">成员</view>
          <view class="th">题目</view>
          <view class="th">推荐</view>
          <view class="th">更多</view>
        </view>

        <scroll-view
            scroll-y
            class="table-body"
            @scrolltolower="handleLoadMore"
        >
          <view
              v-for="(item, index) in homeworkList"
              :key="item.id"
              class="table-row"
          >
            <view class="td checkbox">
              <checkbox
                  :checked="selectedRows.includes(item.id)"
                  @tap="toggleSelectRow(item.id)"
              />
            </view>
            <view class="td">{{ item.grade }}</view>
            <view class="td">{{ item.subjectName }}</view>
            <view class="td">{{ item.groupNum }}</view>
            <view class="td">
              <text v-for="(member, idx) in item.member" :key="member.id">
                {{ member.userName }}{{ idx < item.member.length - 1 ? ',' : '' }}
              </text>
            </view>
            <view class="td">{{ item.title }}</view>
            <view class="td">
              <switch
                  :checked="item.commend"
                  @change="(e) => handleSuggestedChange(e, item.id)"
              />
            </view>
            <view class="td">
              <button
                  class="more-btn"
                  @tap="showDetails(item)"
              >
                详情
              </button>
            </view>
          </view>
        </scroll-view>
      </view>
      <!-- #endif -->

      <!-- 移动端和小程序卡片展示区域 -->
      <!-- #ifdef MP-WEIXIN || H5 -->
      <view class="mobile-container" v-if="isMobile">
        <view
            class="homework-card"
            v-for="item in homeworkList"
            :key="item.id"
        >
          <view class="card-header">
            <checkbox
                :checked="selectedRows.includes(item.id)"
                @tap="toggleSelectRow(item.id)"
            />
            <text class="card-title">{{ item.title }}</text>
          </view>
          <view class="card-content">
            <view class="info-row">
              <text class="label">年级：</text>
              <text class="value">{{ item.grade }}</text>
            </view>
            <view class="info-row">
              <text class="label">课程：</text>
              <text class="value">{{ item.subjectName }}</text>
            </view>
            <view class="info-row">
              <text class="label">组号：</text>
              <text class="value">{{ item.groupNum }}</text>
            </view>
            <view class="info-row">
              <text class="label">成员：</text>
              <text class="value">
                {{ item.member.map(m => m.userName).join(', ') }}
              </text>
            </view>
            <view class="info-row switch-row">
              <text class="label">推荐：</text>
              <switch
                  :checked="item.commend"
                  @change="(e) => handleSuggestedChange(e, item.id)"
              />
            </view>
          </view>
          <view class="card-footer">
            <button
                class="detail-btn"
                @tap="showDetails(item)"
            >
              查看详情
            </button>
          </view>
        </view>
      </view>
      <!-- #endif -->

      <!-- 改进的分页器 -->
      <view class="pagination">
        <view class="page-info">
          共 {{ total }} 条
        </view>
        <view class="page-controls">
          <button
              class="page-btn"
              :disabled="searchParams.current === 1"
              @tap="handlePageChange(searchParams.current - 1)"
          >
            上一页
          </button>
          <view class="page-number-wrapper">
            <input
                v-model="inputPage"
                class="page-number-input"
                type="number"
                @blur="handlePageInputChange"
                @keyup.enter="handlePageInputChange"
            />
            <text class="page-total">/ {{ totalPages }}</text>
          </view>
          <button
              class="page-btn"
              :disabled="searchParams.current === totalPages"
              @tap="handlePageChange(searchParams.current + 1)"
          >
            下一页
          </button>
        </view>
      </view>

      <!-- 详情模态框 -->
      <uni-popup ref="detailPopup" type="center">
        <view class="detail-modal">
          <view class="modal-header">
            <text class="modal-title">作业详情</text>
            <text class="close-btn" @tap="hideDetails">×</text>
          </view>
          <scroll-view scroll-y class="modal-content">
            <view class="detail-section">
              <text class="section-title">简介</text>
              <text class="section-content">{{ currentDetail?.brief }}</text>
            </view>
            <view class="detail-section">
              <text class="section-title">硬件技术</text>
              <text class="section-content">{{ currentDetail?.hardwareTech }}</text>
            </view>
            <view class="detail-section">
              <text class="section-title">软件技术</text>
              <text class="section-content">{{ currentDetail?.softwareTech }}</text>
            </view>
          </scroll-view>
        </view>
      </uni-popup>
    </view>
  </Layout>
</template>

<script setup lang="ts">
import { ref, computed, reactive, onMounted } from 'vue'
import { debounce } from 'lodash'
import * as XLSX from 'xlsx'
import JSZip from 'jszip'
import { homeworkApi } from '@/api/homework'
import { formatDate as format } from '@/utils/format'
import Layout from "@/components/layout/Layout.vue";

const isMobile = ref(false)
const inputPage = ref('')

const formatDate = (date: string) => {
  return format(new Date(date), 'yyyy-MM-dd HH:mm:ss')
}

// 类型定义
interface HomeworkQueryRequest {
  current: number
  size: number
  subjectName?: string
  title?: string
  grade?: string  // 添加年级字段
}

interface UserInfo {
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

interface HomeworkVO {
  id: string
  subjectId: number
  subjectName: string
  groupNum: number
  title: string
  brief: string
  grade: string
  hardwareTech: string
  softwareTech: string
  background: string
  systemDesign: string
  attachmentWord?: string
  attachmentPdf?: string
  attachmentSource?: string
  attachmentMp4?: string
  subjectType: number
  createTime: string
  member: UserInfo[]
}

// 状态定义
const searchParams = reactive<HomeworkQueryRequest>({
  current: 1,
  size: 10,
  subjectName: '',
  title: ''
})

const homeworkList = ref<HomeworkVO[]>([])
const selectedRows = ref<string[]>([])
const total = ref(0)
const loading = ref(false)
const currentDetail = ref<HomeworkVO | null>(null)
const detailPopup = ref<any>(null)

// 计算属性
const totalPages = computed(() => Math.ceil(total.value / searchParams.size))
const isAllSelected = computed(() =>
    homeworkList.value.length > 0 &&
    homeworkList.value.every(item => selectedRows.value.includes(item.id))
)

// 搜索防抖
const debouncedSearch = debounce(async () => {
  searchParams.current = 1  // 使用 searchParams 的 current 替代 currentPage
  await fetchHomeworkList()
}, 300)

// 方法定义
const handleSearchInput = () => {
  debouncedSearch()
}

// 处理页码输入
const handlePageInputChange = () => {
  const page = parseInt(inputPage.value)
  if (page && page > 0 && page <= totalPages.value) {
    handlePageChange(page)
  } else {
    inputPage.value = searchParams.current.toString()
  }
}

const fetchHomeworkList = async () => {
  try {
    loading.value = true
    const res = await homeworkApi.getHomeworkPage(searchParams)
    homeworkList.value = res.records
    total.value = res.total
  } catch (error) {
    console.error('获取作业列表失败：', error)
    uni.showToast({
      title: '获取列表失败',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

const toggleSelectAll = () => {
  if (isAllSelected.value) {
    selectedRows.value = []
  } else {
    selectedRows.value = homeworkList.value.map(item => item.id)
  }
}

const toggleSelectRow = (id: number) => {
  const index = selectedRows.value.indexOf(id)
  if (index > -1) {
    selectedRows.value.splice(index, 1)
  } else {
    selectedRows.value.push(id)
  }
}

const handleSuggestedChange = async (e: any, id: number) => {
  try {
    await homeworkApi.updateHomeworkSuggested({
      id,
      suggested: e.detail.value?1:0
    })
    const index = homeworkList.value.findIndex(item => item.id === id)
    if (index > -1) {
      homeworkList.value[index].commend = e.detail.value
    }
  } catch (error) {
    console.error('更新推荐状态失败：', error)
    uni.showToast({
      title: '更新失败',
      icon: 'none'
    })
  }
}

const showDetails = (item: HomeworkItem) => {
  currentDetail.value = item
  detailPopup.value?.open()
}

const hideDetails = () => {
  detailPopup.value?.close()
  currentDetail.value = null
}

const handlePageChange = async (page: number) => {
  if (page < 1 || page > totalPages.value) return
  searchParams.current = page
  inputPage.value = page.toString()
  await fetchHomeworkList()
}

const handleLoadMore = () => {
  if (currentPage.value < totalPages.value && !loading.value) {
    handlePageChange(currentPage.value + 1)
  }
}

const handleExportHomework = async () => {
  try {
    const zip = new JSZip()
    const selectedHomeworks = homeworkList.value.filter(item =>
        selectedRows.value.includes(item.id)
    )

    for (const homework of selectedHomeworks) {
      // 假设这是获取作业内容的API
      const content = await homeworkApi.getHomeworkContent(homework.id)
      zip.file(`${homework.title}.txt`, content)
    }

    const content = await zip.generateAsync({ type: 'blob' })
    const url = URL.createObjectURL(content)

    // #ifdef H5
    const link = document.createElement('a')
    link.href = url
    link.download = '作业内容.zip'
    link.click()
    URL.revokeObjectURL(url)
    // #endif

    // #ifdef MP-WEIXIN
    uni.downloadFile({
      url: url,
      success: (res) => {
        uni.saveFile({
          tempFilePath: res.tempFilePath,
          success: () => {
            uni.showToast({
              title: '文件已保存',
              icon: 'success'
            })
          }
        })
      }
    })
    // #endif
  } catch (error) {
    console.error('导出作业失败：', error)
    uni.showToast({
      title: '导出失败',
      icon: 'none'
    })
  }
}

const handleExportInfo = async () => {
  try {
    const selectedHomeworks = homeworkList.value.filter(item =>
        selectedRows.value.includes(item.id)
    )

    const worksheet = XLSX.utils.json_to_sheet(selectedHomeworks.map(item => ({
      '年级': item.grade,
      '课程': item.subjectName,
      '组号': item.groupNum,
      '成员': item.member,
      '题目': item.title,
      '推荐': item.commend ? '是' : '否',
      '简介': item.brief,
      '硬件技术': item.hardwareTech,
      '软件技术': item.softwareTech
    })))

    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, '作业信息')

    // #ifdef H5
    XLSX.writeFile(workbook, '作业信息.xlsx')
    // #endif

    // #ifdef MP-WEIXIN
    const wbout = XLSX.write(workbook, {
      bookType: 'xlsx',
      type: 'array'
    })
    const filePath = `${wx.env.USER_DATA_PATH}/作业信息.xlsx`
    const fs = wx.getFileSystemManager()
    fs.writeFileSync(filePath, wbout, 'binary')
    uni.showToast({
      title: '文件已保存',
      icon: 'success'
    })
    // #endif
  } catch (error) {
    console.error('导出信息失败：', error)
    uni.showToast({
      title: '导出失败',
      icon: 'none'
    })
  }
}

const checkDevice = () => {
  // #ifdef H5
  isMobile.value = window.innerWidth <= 768
  window.addEventListener('resize', () => {
    isMobile.value = window.innerWidth <= 768
  })
  // #endif

  // #ifdef MP-WEIXIN
  isMobile.value = true
  // #endif
}

// 生命周期
onMounted(() => {
  checkDevice()
  fetchHomeworkList()
})
</script>

<style lang="scss" scoped>
.homework-management {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;

  .search-bar {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    flex-wrap: wrap;
    gap: 20px;
    background-color: #fff;
    padding: 16px;
    border-radius: 8px;

    .search-inputs {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;

      .input-item {
        display: flex;
        align-items: center;
        gap: 8px;

        .label {
          font-size: 14px;
          color: #606266;
        }

        .search-input {
          width: 200px;
          height: 36px;
          padding: 0 12px;
          border: 1px solid #dcdfe6;
          border-radius: 4px;

          &:focus {
            border-color: #409eff;
          }
        }
      }
    }

    .action-buttons {
      display: flex;
      gap: 12px;

      .action-btn {
        min-width: 80px;
        height: 36px;
        border-radius: 4px;
        font-size: 14px;

        &.primary {
          background-color: #409eff;
          color: #fff;

          &:hover {
            background-color: #66b1ff;
          }
        }

        &.info {
          background-color: #909399;
          color: #fff;

          &:hover {
            background-color: #a6a9ad;
          }
        }

        &:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      }
    }
  }

  // PC端表格样式
  .table-container {
    background-color: #fff;
    border-radius: 8px;
    overflow: hidden;
    margin-bottom: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

    .table-header {
      display: grid;
      grid-template-columns: 60px 100px 120px 80px minmax(120px, 1fr) 100px 120px 100px 100px;
      background-color: #f5f7fa;
      border-bottom: 1px solid #ebeef5;

      .th {
        padding: 12px 8px;
        font-size: 14px;
        font-weight: 500;
        color: #606266;
        text-align: center;

        &.checkbox {
          display: flex;
          align-items: center;
          justify-content: center;
        }
      }
    }

    .table-body {
      max-height: calc(100vh - 280px);

      .table-row {
        display: grid;
        grid-template-columns: 60px 100px 120px 80px minmax(120px, 1fr) 100px 120px 100px 100px;
        border-bottom: 1px solid #ebeef5;
        transition: background-color 0.3s;

        &:hover {
          background-color: #f5f7fa;
        }

        .td {
          padding: 12px 8px;
          font-size: 14px;
          color: #606266;
          text-align: center;
          display: flex;
          align-items: center;
          justify-content: center;
          word-break: break-all;

          &.checkbox {
            justify-content: center;
          }

          .more-btn {
            min-width: 60px;
            height: 28px;
            line-height: 28px;
            padding: 0 12px;
            background-color: #409eff;
            color: #fff;
            border-radius: 4px;
            font-size: 12px;

            &:hover {
              background-color: #66b1ff;
            }
          }
        }
      }
    }
  }

  // 移动端和小程序卡片样式
  .mobile-container {
    .homework-card {
      background: #fff;
      border-radius: 8px;
      margin-bottom: 16px;
      padding: 16px;
      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

      .card-header {
        display: flex;
        align-items: center;
        margin-bottom: 12px;
        padding-bottom: 8px;
        border-bottom: 1px solid #ebeef5;

        .card-title {
          margin-left: 12px;
          font-size: 16px;
          font-weight: 500;
          flex: 1;
          color: #303133;
        }
      }

      .card-content {
        .info-row {
          display: flex;
          margin-bottom: 12px;
          align-items: flex-start;

          .label {
            width: 70px;
            color: #909399;
            font-size: 14px;
          }

          .value {
            flex: 1;
            font-size: 14px;
            color: #606266;
            line-height: 1.4;
          }

          &.switch-row {
            align-items: center;
          }
        }
      }

      .card-footer {
        margin-top: 16px;
        padding-top: 16px;
        border-top: 1px solid #ebeef5;
        display: flex;
        justify-content: flex-end;
        gap: 12px;

        .detail-btn {
          padding: 8px 20px;
          font-size: 14px;
          color: #fff;
          background-color: #409eff;
          border-radius: 4px;
          border: none;

          &:active {
            opacity: 0.8;
          }
        }
      }
    }
  }

  // 改进的分页器样式
  .pagination {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px 0;
    background-color: #fff;
    border-radius: 8px;
    padding: 16px;
    margin-top: 20px;

    .page-info {
      font-size: 14px;
      color: #606266;
    }

    .page-controls {
      display: flex;
      align-items: center;
      gap: 12px;

      .page-number-wrapper {
        display: flex;
        align-items: center;
        gap: 8px;

        .page-number-input {
          width: 50px;
          height: 32px;
          text-align: center;
          border: 1px solid #dcdfe6;
          border-radius: 4px;
          font-size: 14px;
          color: #606266;

          &:focus {
            border-color: #409eff;
            outline: none;
          }
        }

        .page-total {
          color: #606266;
          font-size: 14px;
        }
      }

      .page-btn {
        min-width: 70px;
        height: 32px;
        line-height: 32px;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        font-size: 14px;
        color: #606266;
        background-color: #fff;

        &:hover:not(:disabled) {
          color: #409eff;
          border-color: #409eff;
        }

        &:disabled {
          background-color: #f5f7fa;
          border-color: #e4e7ed;
          color: #c0c4cc;
          cursor: not-allowed;
        }
      }
    }
  }

  // 详情模态框样式
  .detail-modal {
    width: 90%;
    max-width: 600px;
    background-color: #fff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);

    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 20px;
      border-bottom: 1px solid #ebeef5;

      .modal-title {
        font-size: 16px;
        font-weight: 500;
        color: #303133;
      }

      .close-btn {
        font-size: 20px;
        color: #909399;
        cursor: pointer;

        &:hover {
          color: #606266;
        }
      }
    }

    .modal-content {
      max-height: 60vh;
      padding: 20px;

      .detail-section {
        margin-bottom: 20px;

        &:last-child {
          margin-bottom: 0;
        }

        .section-title {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #606266;
          margin-bottom: 8px;
        }

        .section-content {
          font-size: 14px;
          line-height: 1.6;
          color: #606266;
          white-space: pre-wrap;
        }
      }
    }
  }
}

/* 移动端适配 */
@media screen and (max-width: 768px) {
  .homework-management {
    padding: 12px;

    .search-bar {
      padding: 12px;

      .search-inputs {
        width: 100%;

        .input-item {
          width: 100%;

          .search-input {
            width: 100%;
          }
        }
      }

      .action-buttons {
        width: 100%;
        justify-content: flex-end;
      }
    }

    .table-container {
      display: none;
    }

    .pagination {
      padding: 12px;

      .page-controls {
        .page-btn {
          min-width: 60px;
          font-size: 13px;
        }

        .page-number-wrapper {
          .page-number-input {
            width: 40px;
            font-size: 13px;
          }
        }
      }
    }

    .detail-modal {
      width: 95%;
      margin: 10px;

      .modal-content {
        max-height: 70vh;
        padding: 16px;
      }
    }
  }
}

/* 小程序特定样式 */
/* #ifdef MP-WEIXIN */
.homework-management {
  .mobile-container {
    .homework-card {
      .card-footer {
        .detail-btn {
          &::after {
            border: none;
          }
        }
      }
    }
  }

  .pagination {
    .page-controls {
      .page-number-input {
        margin: 0;
      }
    }
  }
}
/* #endif */
</style>
