<template>
      <scroll-view
          class="homework-list"
          scroll-y
          refresher-enabled
          :refresher-triggered="isRefreshing"
          :refresher-threshold="45"
          refresher-background="#f8f9fa"
          @refresherrefresh="onRefresh"
          @refresherpulling="onPulling"
          @refresherrestore="onRestore"
          @scrolltolower="onScrollToLower"
      >
        <view class="list-content">
          <!-- 列表项 -->
          <view
              v-for="item in homeworkList"
              :key="item.id"
              class="list-item"
              :class="{ 'is-mobile': isMobile }"
              @click="handleItemClick(item)"
          >
            <!-- PC端显示 -->
            <template v-if="!isMobile">
              <!-- 左侧推荐开关(仅教师可见) -->
              <template v-if="isTeacher" class="switch-column">
                <view @click.stop>
                  <switch
                      :checked="item.commend === 1"
                      @change="(e) => handleRecommendChange(item, e.detail.value)"
                  />
                </view>
              </template>

              <!-- 预览图 -->
              <view class="preview-column">
                <image
                    class="preview-image"
                    :src="item.post || '/static/images/default-cover.png'"
                    mode="aspectFill"
                />
              </view>

              <!-- 右侧内容区 -->
              <view class="content-column">
                <view class="content-header">
                  <text class="content-title">{{ item.title }}</text>
                  <text class="content-course">{{ item.subjectName }}</text>
                </view>
                <view class="content-info">
                  <text class="content-year">{{ item.submitYear }}年</text>
                  <text class="content-divider">|</text>
                  <text class="content-group">{{ item.member.map(user => user.userName).join('、') }}</text>
                </view>
                <text class="content-brief">{{ item.brief }}</text>
              </view>
            </template>

            <!-- 移动端显示 -->
            <template v-else>
              <view class="mobile-container">
                <view class="mobile-header">
                  <view class="mobile-title-group">
                    <text class="mobile-title">{{ item.title }}</text>
                    <text class="mobile-course">{{ item.subjectName }}</text>
                  </view>
                  <view @click.stop v-if="isTeacher" class="mobile-switch">
                    <switch
                        :checked="item.commend === 1"
                        @change="(e) => handleRecommendChange(item, e.detail.value)"
                    />
                  </view>
                </view>

                <view class="mobile-content">
                  <image
                      class="mobile-image"
                      :src="item.post || '/static/images/default-cover.png'"
                      mode="aspectFill"
                  />
                  <view class="mobile-info">
                    <view class="mobile-meta">
                      <text class="mobile-year">{{ item.submitYear }}年</text>
                      <text class="mobile-divider">|</text>
                      <text class="mobile-members">{{ item.member.map(user => user.userName).join('、') }}</text>
                    </view>
                    <text class="mobile-brief">{{ item.brief }}</text>
                  </view>
                </view>
              </view>
            </template>
          </view>

          <!-- 加载状态 -->
          <view class="loading-status">
            <text v-if="loading">加载中...</text>
            <text v-else-if="finished">没有更多了</text>
          </view>
        </view>
      </scroll-view>
</template>

<script setup lang="ts">
import { ref, onMounted, computed, onBeforeUnmount,watch } from 'vue';
import { useUserStore } from '@/store/user';
import { homeworkApi } from '@/api/homework';
import type { HomeworkHistoryVO, HomeworkHistoryPageQueryRequest } from '@/types/homework';
import Layout from "@/components/layout/Layout.vue";
import {onPullDownRefresh} from "@dcloudio/uni-app";

const props = defineProps<{
  year?: number;
}>();

const userStore = useUserStore();
const isTeacher = ref(userStore.userInfo?.userRole === 2);

// 窗口宽度响应式
const windowWidth = ref(uni.getSystemInfoSync().windowWidth);
const isMobile = computed(() => windowWidth.value <= 768);
const isRefreshing = ref(false);

// 列表数据
const homeworkList = ref<HomeworkHistoryVO[]>([]);
const loading = ref(false);
const finished = ref(false);
const current = ref(1);
const pageSize = ref(10);

const pullState = ref('');

// 添加下拉相关的处理方法
const onPulling = (e: any) => {
  if (e.detail.dy > 0) {
    pullState.value = '下拉刷新';
  }
  if (e.detail.dy >= 45) {
    pullState.value = '松开刷新';
  }
};

const onRestore = () => {
  pullState.value = '';
};

// 重置列表状态
const resetListState = async () => {
  return new Promise<void>((resolve) => {
    homeworkList.value = [];
    current.value = 1;
    finished.value = false;
    loading.value = false;
    resolve();
  });
};


// 获取作品列表
const getHomeworkList = async () => {
  if (loading.value || finished.value) return;

  loading.value = true;
  try {
    const params: HomeworkHistoryPageQueryRequest = {
      year: props.year ? Number(props.year) : undefined,
      current: current.value,
      pageSize: pageSize.value
    };

    const res = await homeworkApi.getHomeworkHistoryPage(params);

    if (res.records.length === 0) {
      finished.value = true;
    } else {
      homeworkList.value.push(...res.records);
      current.value++;
    }
  } catch (error) {
    uni.showToast({
      title: error?.message ||'获取列表失败',
      icon: 'error'
    });
  } finally {
    loading.value = false;
  }
};

const onRefresh = async () => {
  if (isRefreshing.value) return;

  isRefreshing.value = true;
  pullState.value = '正在刷新';

  try {
    await resetListState();
    await getHomeworkList();
    uni.showToast({
      title: '刷新成功',
      icon: 'success'
    });
  } catch (error) {
    uni.showToast({
      title: error?.message || '刷新失败',
      icon: 'none'
    });
  } finally {
    isRefreshing.value = false;
    pullState.value = '';
  }
};


watch(() => props.year, (newYear) => {
  resetListState();
  getHomeworkList();
}, { immediate: true });

// 监听滚动加载更多
const onScrollToLower = async () => {
  console.log(111)
  if (!loading.value && !finished.value) {
    await getHomeworkList();
  }
};

//监听窗口变化
const handleResize = () => {
  // #ifdef H5
  windowWidth.value = document.documentElement.clientWidth;
  // #endif

  // #ifndef H5
  const info = uni.getSystemInfoSync();
  windowWidth.value = info.windowWidth;
  // #endif
};

onPullDownRefresh(() => {
  onRefresh().finally(() => {
    uni.stopPullDownRefresh();
  });
});

onMounted(() => {
  // #ifdef H5
  window.addEventListener('resize', handleResize);
  // #endif

  // #ifdef MP-WEIXIN || APP-PLUS
  uni.enablePullDownRefresh();
  // #endif
});

onBeforeUnmount(() => {
  // #ifdef H5
  window.removeEventListener('resize', handleResize);
  // #endif

  // #ifdef MP-WEIXIN || APP-PLUS
  // 只在小程序和 APP 中禁用页面下拉刷新
  uni.disablePullDownRefresh();
  // #endif
});

const handleItemClick = (item: HomeworkHistoryVO) => {
  if (!item.id) return;
  uni.navigateTo({
    url: `/pages/homework-history/detail/index?id=${item.id}`
  });
};

// 推荐状态更新
const handleRecommendChange = async (homework: HomeworkHistoryVO, value: boolean) => {
  try {
    await homeworkApi.updateHomeworkSuggested({
      id: homework.id,
      suggested: value ? 1 : 0
    });
    homework.commend = value ? 1 : 0;
    uni.showToast({
      title: value ? '已推荐' : '已取消推荐',
      icon: 'success'
    });
  } catch (error) {
    uni.showToast({
      title: error?.message || '操作失败',
      icon: 'error'
    });
  }
};
</script>

<style lang="scss">
.homework-list {
  height: 100vh;
  background: #f8f9fa;

  &::-webkit-scrollbar {
    display: none;
  }

  .list-scroll {
    height: 100%;

    ::-webkit-scrollbar {
      display: none;  // 隐藏内部滚动条
    }

    :deep(.uni-scroll-view-refresher) {
      min-height: 45px;
      line-height: 45px;
      background-color: #f8f9fa;

      .uni-scroll-view-refresh__spinner {
        display: none !important;  // 隐藏默认的刷新圆圈
      }

      .uni-scroll-view-refresh {
        width: 100%;
        height: 100%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #999;
        font-size: 14px;
      }

      .refresh-text {
        position: relative;
        z-index: 1;
      }
    }
  }

  @keyframes rotate {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .refresh-loading {
    display: inline-block;
    width: 16px;
    height: 16px;
    margin-right: 8px;
    border: 2px solid #999;
    border-top-color: transparent;
    border-radius: 50%;
    animation: rotate 0.8s linear infinite;
  }

  .list-content {
    padding: 24px;
  }

  .list-item {
    background: #fff;
    border-radius: 12px;
    margin-bottom: 24px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
    }

    // PC端样式
    &:not(.is-mobile) {
      display: flex;
      padding: 24px;
      gap: 24px;

      .switch-column {
        display: flex;
        align-items: center;
        justify-content: center;
        padding-right: 12px;
      }

      .preview-column {
        flex-shrink: 0;
        width: 240px;

        .preview-image {
          width: 100%;
          height: 160px;
          border-radius: 8px;
          object-fit: cover;
        }
      }

      .content-column {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 16px;

        .content-header {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .content-title {
            font-size: 18px;
            font-weight: 600;
            color: #333;
          }

          .content-course {
            padding: 4px 12px;
            background: rgba(24, 144, 255, 0.1);
            color: #1890ff;
            border-radius: 16px;
            font-size: 14px;
          }
        }

        .content-info {
          display: flex;
          align-items: center;
          gap: 12px;
          color: #666;
          font-size: 14px;

          .content-divider {
            color: #ddd;
          }

          .content-group {
            background: #f5f7fa;
            padding: 4px 12px;
            border-radius: 4px;
          }
        }

        .content-brief {
          font-size: 14px;
          color: #666;
          line-height: 1.8;
        }
      }
    }

    // 移动端样式
    &.is-mobile {
      .mobile-container {
        .mobile-header {
          padding: 16px;
          border-bottom: 1px solid #f0f0f0;
          display: flex;
          justify-content: space-between;
          align-items: flex-start;

          .mobile-title-group {
            flex: 1;
            margin-right: 12px;

            .mobile-title {
              display: block;
              font-size: 16px;
              font-weight: 600;
              color: #333;
              margin-bottom: 8px;
            }

            .mobile-course {
              display: inline-block;
              padding: 4px 12px;
              background: rgba(24, 144, 255, 0.1);
              color: #1890ff;
              border-radius: 16px;
              font-size: 13px;
            }
          }
        }

        .mobile-content {
          padding: 16px;

          .mobile-image {
            width: 100%;
            height: 180px;
            border-radius: 8px;
            object-fit: cover;
            margin-bottom: 16px;
          }

          .mobile-info {
            .mobile-meta {
              display: flex;
              align-items: center;
              gap: 8px;
              margin-bottom: 12px;
              font-size: 14px;
              color: #666;

              .mobile-divider {
                color: #ddd;
              }

              .mobile-members {
                background: #f5f7fa;
                padding: 4px 12px;
                border-radius: 4px;
              }
            }

            .mobile-brief {
              font-size: 14px;
              color: #666;
              line-height: 1.8;
            }
          }
        }
      }
    }
  }

  .loading-status {
    text-align: center;
    padding: 20px;
    color: #999;
    font-size: 14px;
  }
}
</style>
