# HomeworkTabs.vue
<template>
  <view class="homework-container">
    <!-- Tab Navigation -->
    <view class="tab-header">
      <view
          v-for="tab in tabs"
          :key="tab.key"
          class="tab-item"
          :class="{ active: activeTab === tab.key }"
          @click="handleTabChange(tab.key)"
      >
        {{ tab.label }}
      </view>
    </view>

    <!-- Tab Content -->
    <view class="tab-content">
      <!-- My Homework Tab -->
      <view v-if="activeTab === 'my-homework'" class="my-homework">
        <!-- Search Filters -->
        <view class="search-filters">
          <view class="filter-item">
            <text class="filter-label">课程</text>
            <picker
                :range="subjectList"
                range-key="text"
                @change="handleSubjectChange"
                :value="selectedSubjectIndex"
            >
              <view class="picker-value">
                {{ getSelectedSubject }}
              </view>
            </picker>
          </view>

          <view class="filter-item">
            <text class="filter-label">批改状态</text>
            <picker
                :range="correctStatus"
                range-key="text"
                @change="handleStatusChange"
                :value="selectedStatusIndex"
            >
              <view class="picker-value">
                {{ getSelectedStatus }}
              </view>
            </picker>
          </view>
        </view>

        <!-- Homework List -->
        <view class="homework-list">
          <view class="list-header">
            <text class="header-item">课程</text>
            <text class="header-item">组号</text>
            <text class="header-item">题目</text>
            <text class="header-item">状态</text>
            <text class="header-item">操作</text>
          </view>

          <view
              v-for="item in homeworkList"
              :key="item.id"
              class="list-item"
              @tap="(e) => handleItemClick(e, item)"
              :class="{ 'clickable': item.isCorrect }"
          >
            <text class="item-cell">{{ item.subjectName }}</text>
            <text class="item-cell">{{ item.groupNum }}</text>
            <text class="item-cell">{{ item.title }}</text>
            <text class="item-cell status" :class="getStatusClass(item.isCorrect)">
              {{ item.isCorrect ? '已批改' : '未批改' }}
            </text>
            <view class="item-cell">
              <button
                  v-if="item.isCorrect"
                  class="action-btn view-btn"
                  @tap.stop="handleViewGrade(item)"
              >
                查看批改情况
              </button>
              <button
                  v-else
                  class="action-btn edit-btn"
                  @tap.stop="handleEdit(item.id)"
              >
                修改
              </button>
            </view>
          </view>

          <!-- Empty State -->
          <view v-if="homeworkList.length === 0" class="empty-state">
            暂无数据
          </view>
        </view>

        <!-- Pagination -->
        <view class="pagination">
          <button
              class="page-btn"
              :disabled="current <= 1"
              @click="handlePageChange(current - 1)"
          >
            上一页
          </button>
          <text class="page-info">{{ current }}/{{ totalPages }}</text>
          <button
              class="page-btn"
              :disabled="current >= totalPages"
              @click="handlePageChange(current + 1)"
          >
            下一页
          </button>
        </view>

        <!-- Grade Details Modal -->
        <uni-popup ref="popup" type="center">
          <view class="grade-popup">
            <view class="popup-header">
              <text class="popup-title">批改情况</text>
              <text class="close-btn" @click="closeGradePopup">×</text>
            </view>
            <view class="grade-content">
              <view class="grade-item">
                <text class="grade-label">课程:</text>
                <text class="grade-value">{{ selectedHomework?.subjectName }}</text>
              </view>
              <view class="grade-item">
                <text class="grade-label">题目:</text>
                <text class="grade-value">{{ selectedHomework?.title }}</text>
              </view>
              <view class="grade-item">
                <text class="grade-label">成绩:</text>
                <text class="grade-value">{{ selectedHomework?.score.score }}</text>
              </view>
            </view>
          </view>
        </uni-popup>
      </view>

      <!-- Submit Homework Tab -->
      <view v-else-if="activeTab === 'submit-homework'" class="submit-homework">
        <homework-upload :homework-id="editHomeworkId" @update:homework-id="editHomeworkId = $event"/>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import HomeworkUpload from './HomeworkUpload.vue'
import { homeworkApi } from '@/api/homework'
import { subjectApi } from '@/api/subject'
import type { HomeworkGradeVO, HomeworkGradePageRequest } from '@/types/homework'
import {onReady} from "@dcloudio/uni-app";

const popup = ref<any>(null)

// Tab Configuration
const tabs = [
  { key: 'my-homework', label: '我的作业' },
  { key: 'submit-homework', label: '提交作业' }
]
const activeTab = ref('my-homework')

// Filter States
const subjectList = ref<Array<{ value: string, text: string }>>([])
const selectedSubjectIndex = ref(0)
const correctStatus = [
  { value: '', text: '全部' },
  { value: '1', text: '已批改' },
  { value: '0', text: '未批改' }
]
const selectedStatusIndex = ref(0)

// List States
const homeworkList = ref<HomeworkGradeVO[]>([])
const current = ref(1)
const pageSize = ref(10)
const total = ref(0)
const editHomeworkId = ref('')
const selectedHomework = ref<HomeworkGradeVO | null>(null)

// Computed Properties
const totalPages = computed(() => Math.ceil(total.value / pageSize.value))
const getSelectedSubject = computed(() => {
  if (selectedSubjectIndex.value === 0) return '全部课程'
  return subjectList.value[selectedSubjectIndex.value]?.text || '全部课程'
})
const getSelectedStatus = computed(() =>
    correctStatus[selectedStatusIndex.value]?.text || '全部'
)

// Methods

const handleItemClick = (e: any, homework: HomeworkGradeVO) => {
  // 获取点击的元素
  const target = e?.target
  if (!target) return

  // 检查是否点击了按钮
  if (target.className && (
      target.className.includes('action-btn') ||
      target.className.includes('view-btn') ||
      target.className.includes('edit-btn'))
  ) {
    return
  }

  // 只有已批改的作业才能跳转到详情页
  if (homework.isCorrect) {
    uni.navigateTo({
      url: `/pages/homework-history/detail/index?id=${homework.id}`
    });  }
}

const handleTabChange = (tab: string) => {
  activeTab.value = tab
  if (tab === 'my-homework') {
    editHomeworkId.value = '' // 清空 homeworkId
    fetchHomeworkList()
  }
}

const getStatusClass = (isCorrect: number) => {
  return isCorrect ? 'status-corrected' : 'status-pending'
}

const fetchSubjectList = async () => {
  try {
    const res = await subjectApi.getSubjectListByStu()
    subjectList.value = [
      { value: '', text: '全部课程' },
      ...res.map(item => ({
        value: item.id,
        text: item.title
      }))
    ]
  } catch (error) {
    uni.showToast({
      title: error?.message || '获取课程列表失败',
      icon: 'none'
    })
  }
}

const fetchHomeworkList = async () => {
  try {
    const params: HomeworkGradePageRequest = {
      current: current.value,
      pageSize: pageSize.value,
      subjectId: subjectList.value[selectedSubjectIndex.value]?.value,
      isCorrect: correctStatus[selectedStatusIndex.value]?.value
    }

    const res = await homeworkApi.getHomeworkGradePage(params)
    homeworkList.value = res.records
    total.value = res.total
  } catch (error) {
    uni.showToast({
      title: error?.message || '获取作业列表失败',
      icon: 'none'
    })
  }
}

const handleSubjectChange = (e: any) => {
  selectedSubjectIndex.value = e.detail.value
  current.value = 1
  fetchHomeworkList()
}

const handleStatusChange = (e: any) => {
  selectedStatusIndex.value = e.detail.value
  current.value = 1
  fetchHomeworkList()
}

const handlePageChange = (page: number) => {
  current.value = page
  fetchHomeworkList()
}

const handleEdit = (id: string) => {
  editHomeworkId.value = id
  activeTab.value = 'submit-homework'
}

const handleViewGrade = (homework: HomeworkGradeVO) => {
  selectedHomework.value = homework
  // 直接使用 ref 来调用 open 方法
  popup.value?.open()
}

const closeGradePopup = () => {
  popup.value?.close()
}

// Lifecycle
onMounted(() => {
  fetchSubjectList()
  fetchHomeworkList()
})
</script>

<style lang="scss" scoped>
.homework-container {
  min-height: 100vh;
  background-color: #f5f7fa;
  padding: 20px;
  box-sizing: border-box;

  .tab-header {
    display: flex;
    background: #fff;
    border-radius: 8px;
    padding: 4px;
    margin-bottom: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

    .tab-item {
      flex: 1;
      text-align: center;
      padding: 12px;
      font-size: 16px;
      color: #606266;
      cursor: pointer;
      transition: all 0.3s;
      border-radius: 6px;

      &.active {
        color: #409eff;
        background-color: #ecf5ff;
      }
    }
  }

  .search-filters {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    flex-wrap: wrap;

    .filter-item {
      flex: 1;
      min-width: 200px;

      .filter-label {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        color: #606266;
      }

      .picker-value {
        padding: 8px 12px;
        background: #fff;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        font-size: 14px;
        color: #606266;

        &:active {
          border-color: #409eff;
        }
      }
    }
  }

  .homework-list {
    background: #fff;
    border-radius: 8px;
    overflow: hidden;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);

    .list-header {
      display: grid;
      grid-template-columns: 2fr 1fr 2fr 1fr 1fr;
      padding: 12px;
      background: #f5f7fa;
      border-bottom: 1px solid #ebeef5;

      .header-item {
        font-weight: 500;
        color: #606266;
        font-size: 14px;
        // 添加文本对齐
        padding: 0 12px;
        text-align: center;
      }
    }

    .list-item {
      display: grid;
      // 保持与表头相同的列宽比例
      grid-template-columns: 2fr 1fr 2fr 1fr 1fr;
      padding: 12px;
      border-bottom: 1px solid #ebeef5;
      transition: background-color 0.3s;

      &:hover {
        background-color: #f5f7fa;
      }

      .item-cell {
        font-size: 14px;
        color: #606266;
        display: flex;
        align-items: center;
		@media screen and (min-width: 768px) {
			justify-content: center;
		}

        &.status {
          &.status-corrected {
            color: #67c23a;
          }

          &.status-pending {
            color: #e6a23c;
          }
        }
      }

      .action-btn {
        padding: 6px 12px;
        border-radius: 4px;
        font-size: 12px;
        border: none;

        &.view-btn {
          background-color: #409eff;
          color: #fff;

          &:hover {
            background-color: #66b1ff;
          }
        }

        &.edit-btn {
          background-color: #67c23a;
          color: #fff;

          &:hover {
            background-color: #85ce61;
          }
        }
      }
    }
  }

  .pagination {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-top: 20px;
    gap: 12px;

    .page-btn {
      padding: 6px 12px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;
      background: #fff;
      color: #606266;
      font-size: 14px;

      &:disabled {
        background-color: #f5f7fa;
        color: #c0c4cc;
        cursor: not-allowed;
      }
    }

    .page-info {
      font-size: 14px;
      color: #606266;
    }
  }

  .grade-popup {
    background: #fff;
    border-radius: 8px;
    width: 80%;
    max-width: 500px;
    padding: 20px;

    .popup-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;

      .popup-title {
        font-size: 18px;
        font-weight: 500;
        color: #303133;
      }

      .close-btn {
        font-size: 20px;
        color: #909399;
        cursor: pointer;
      }
    }

    .grade-content {
      .grade-item {
        margin-bottom: 12px;

        .grade-label {
          font-size: 14px;
          color: #606266;
          margin-right: 8px;
        }

        .grade-value {
          font-size: 14px;
          color: #303133;
          font-weight: 500;
        }
      }
    }
  }
}

.empty-state {
  padding: 40px;
  text-align: center;
  color: #909399;
  font-size: 14px;
}


/* 移动端适配 */
@media screen and (max-width: 768px) {
  .homework-container {
    padding: 12px;

    .search-filters {
      .filter-item {
        min-width: 100%;
      }
    }

    .homework-list {
      .list-header {
        display: none; // 在移动端隐藏表头
      }

      .list-item {
        grid-template-columns: 1fr;
        gap: 8px;
        padding: 16px;

        .item-cell {
          &::before {
            content: attr(data-label);
            font-weight: 500;
            margin-right: 8px;
            color: #909399;
          }
        }

        .action-btn {
          width: 100%;
          margin-top: 8px;
        }
      }
    }

    .grade-popup {
      width: 90%;
      padding: 16px;
    }
  }
}

/* 小程序特定样式 */
/* #ifdef MP-WEIXIN */
.action-btn {
  &::after {
    border: none;
  }
}

.page-btn {
  &::after {
    border: none;
  }
}

.picker-value {
  position: relative;

  &::after {
    content: '';
    border: solid #c0c4cc;
    border-width: 0 2px 2px 0;
    display: inline-block;
    padding: 3px;
    position: absolute;
    right: 12px;
    top: 50%;
    transform: translateY(-50%) rotate(45deg);
  }
}
/* #endif */

.list-item {
  &.clickable {
    cursor: pointer;

    &:hover {
      background-color: #f5f7fa;
    }
  }
}

</style>
