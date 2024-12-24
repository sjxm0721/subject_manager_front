<template>
  <Layout>
    <scroll-view scroll-y class="homework-detail">
      <view class="detail-container" :class="{ 'is-mobile': isMobile }">
        <!-- 返回按钮 -->
        <view class="nav-header">
          <view class="back-button" @click="handleBack">
            <text class="back-icon">←</text>
            <text>返回</text>
          </view>
        </view>

        <!-- 标题区域 -->
        <view class="title-section">
          <text class="title">{{ homework?.title }}</text>
        </view>

        <!-- 视频播放区域 -->
        <view v-if="homework?.attachmentMp4" class="video-section">
          <video
              v-for="(videoUrl, index) in videoList"
              :key="index"
              class="video-player"
              :src="videoUrl"
              controls
          ></video>
        </view>

        <!-- 背景介绍 -->
        <view v-if="homework?.background" class="section">
          <text class="section-title">项目背景</text>
          <!-- #ifdef H5 -->
          <rich-text class="markdown-content" :nodes="renderMarkdown(homework.background)"></rich-text>
          <!-- #endif -->
          <!-- #ifndef H5 -->
          <mp-html :content="renderMarkdown(homework.background)"></mp-html>
          <!-- #endif -->
        </view>

        <!-- 系统设计 -->
        <view v-if="homework?.systemDesign" class="section">
          <text class="section-title">系统设计</text>
          <!-- #ifdef H5 -->
          <rich-text class="markdown-content" :nodes="renderMarkdown(homework.systemDesign)"></rich-text>
          <!-- #endif -->
          <!-- #ifndef H5 -->
          <mp-html :content="renderMarkdown(homework.systemDesign)"></mp-html>
          <!-- #endif -->
        </view>

        <!-- Word文档 -->
        <view v-if="homework?.attachmentWord" class="section">
          <text class="section-title">相关文档</text>
          <view class="document-list">
            <view
                v-for="(wordUrl, index) in wordList"
                :key="index"
                class="document-item"
                @click="previewOfficeFile(wordUrl)"
            >
              <image class="doc-icon" src="/static/images/word-icon.png" />
              <text class="doc-name">文档 {{ index + 1 }}</text>
            </view>
          </view>
        </view>

        <!-- PDF文档 -->
        <view v-if="homework?.attachmentPdf" class="section">
          <text class="section-title">PDF文档</text>
          <view class="document-list">
            <view
                v-for="(pdfUrl, index) in pdfList"
                :key="index"
                class="document-item"
                @click="previewPdf(pdfUrl)"
            >
              <image class="doc-icon" src="/static/images/pdf-icon.png" />
              <text class="doc-name">PDF {{ index + 1 }}</text>
            </view>
          </view>
        </view>

        <!-- 源文件下载 -->
        <view v-if="homework?.attachmentSource" class="section">
          <text class="section-title">源文件下载</text>
          <view class="document-list">
            <view
                v-for="(sourceUrl, index) in sourceList"
                :key="index"
                class="document-item source-item"
                @click="downloadSource(sourceUrl)"
            >
              <image class="doc-icon" src="/static/images/zip-icon.png" />
              <text class="doc-name">源文件 {{ index + 1 }}</text>
              <text class="download-icon">↓</text>
            </view>
          </view>
        </view>
      </view>
    </scroll-view>
  </Layout>
</template>


<script setup lang="ts">
import { ref, onMounted, computed ,onUnmounted} from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { homeworkApi } from '@/api/homework';
import type { Homework } from '@/types/homework';
import Layout from "@/components/layout/Layout.vue";
import { marked } from 'marked';
// #ifndef H5
import MpHtml from 'mp-html';
// #endif

const homework = ref<Homework>();
const loading = ref(false);

// 响应式判断是否为移动端
const windowWidth = ref(uni.getSystemInfoSync().windowWidth);
const isMobile = computed(() => windowWidth.value <= 768);

// 文件列表处理
const videoList = computed(() => homework.value?.attachmentMp4?.split(',').filter(Boolean) || []);
const wordList = computed(() => homework.value?.attachmentWord?.split(',').filter(Boolean) || []);
const pdfList = computed(() => homework.value?.attachmentPdf?.split(',').filter(Boolean) || []);
const sourceList = computed(() => homework.value?.attachmentSource?.split(',').filter(Boolean) || []);

// 获取作品详情
const getDetail = async (homeworkId: string) => {
  loading.value = true;
  try {
    const res = await homeworkApi.getHomeworkDetail(homeworkId);
    homework.value = res;
  } catch (error) {
    console.error('获取作品详情失败:', error);
    uni.showToast({
      title: '获取详情失败',
      icon: 'error'
    });
  } finally {
    loading.value = false;
  }
};

// Markdown渲染
const renderMarkdown = (content: string) => {
  if (!content) return '';
  return marked(content);
};

// 预览Office文件
const previewOfficeFile = (url: string) => {
  // #ifdef H5
  const resource = {
    name: '作业文档',
    type: 'doc',
    path: url
  };

  uni.navigateTo({
    url: `/pages/resource/index?resource=${encodeURIComponent(JSON.stringify(resource))}`
  });
  // #endif

  // #ifndef H5
  // 小程序环境下直接使用原生预览
  uni.downloadFile({
    url: url,
    success: function (res) {
      uni.openDocument({
        filePath: res.tempFilePath,
        showMenu: true,
        success: function () {
          console.log('打开文档成功');
        },
        fail: function(err) {
          console.error('打开文档失败', err);
          uni.showToast({
            title: '打开文档失败',
            icon: 'none'
          });
        }
      });
    },
    fail: function(err) {
      console.error('下载文档失败', err);
      uni.showToast({
        title: '下载文档失败',
        icon: 'none'
      });
    }
  });
  // #endif
};

// 预览PDF
const previewPdf = (url: string) => {
  // #ifdef H5
  const resource = {
    name: 'PDF文档',
    type: 'pdf',
    path: url
  };

  uni.navigateTo({
    url: `/pages/resource/index?resource=${encodeURIComponent(JSON.stringify(resource))}`
  });
  // #endif

  // #ifndef H5
  // 小程序环境下使用原生预览
  uni.downloadFile({
    url: url,
    success: function (res) {
      uni.openDocument({
        filePath: res.tempFilePath,
        showMenu: true,
        success: function () {
          console.log('打开PDF成功');
        },
        fail: function(err) {
          console.error('打开PDF失败', err);
          uni.showToast({
            title: '打开PDF失败',
            icon: 'none'
          });
        }
      });
    },
    fail: function(err) {
      console.error('下载PDF失败', err);
      uni.showToast({
        title: '下载PDF失败',
        icon: 'none'
      });
    }
  });
  // #endif
};

// 下载源文件
const downloadSource = (url: string) => {
  // #ifdef H5
  window.open(url, '_blank');
  // #endif

  // #ifdef MP-WEIXIN
  uni.downloadFile({
    url: url,
    success: function (res) {
      uni.saveFile({
        tempFilePath: res.tempFilePath,
        success: function () {
          uni.showToast({
            title: '下载成功',
            icon: 'success'
          });
        }
      });
    }
  });
  // #endif
};

// 返回上一页
const handleBack = () => {
  uni.navigateBack({
    fail: () => {
      // 如果返回失败（没有上一页），则跳转到历年作品列表页
      uni.redirectTo({
        url: '/pages/homework/list'
      });
    }
  });
};

// 监听设备尺寸变化
const handleResize = () => {
  // #ifdef H5
  windowWidth.value = document.documentElement.clientWidth;
  // #endif
};

onLoad((options) => {
  if (options.id) {
    getDetail(options.id);
  }
});

onMounted(() => {
  // #ifdef H5
  window.addEventListener('resize', handleResize);
  // #endif
});

onUnmounted(() => {
  // #ifdef H5
  window.removeEventListener('resize', handleResize);
  // #endif
});
</script>

<style lang="scss">
.homework-detail {
  height: 100vh;
  background: #f8f9fa;
  box-sizing: border-box;

  .detail-container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 24px;
    background: #fff;

    .nav-header {
      margin-bottom: 24px;

      .back-button {
        display: inline-flex;
        align-items: center;
        padding: 8px 16px;
        background: #f0f2f5;
        border-radius: 20px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover {
          background: #e6e8eb;
        }

        .back-icon {
          margin-right: 8px;
          font-size: 18px;
        }
      }
    }

    .title-section {
      text-align: center;
      margin-bottom: 32px;

      .title {
        font-size: 24px;
        font-weight: 600;
        color: #333;
      }
    }

    .video-section {
      margin-bottom: 32px;

      .video-player {
        width: 100%;
        height: 480px;
        margin-bottom: 16px;
        border-radius: 8px;
        background: #000;

        &:last-child {
          margin-bottom: 0;
        }
      }
    }

    .section {
      margin-bottom: 32px;

      .section-title {
        font-size: 18px;
        font-weight: 600;
        color: #333;
        margin-bottom: 16px;
        display: block;
        position: relative;
        padding-left: 12px;

        &::before {
          content: '';
          position: absolute;
          left: 0;
          top: 50%;
          transform: translateY(-50%);
          width: 4px;
          height: 16px;
          background: #1890ff;
          border-radius: 2px;
        }
      }

      .markdown-content {
        font-size: 14px;
        line-height: 1.8;
        color: #666;

        img {
          max-width: 100% !important;
          height: auto !important;
          display: block;
          margin: 16px auto;
        }

        p {
          margin: 12px 0;
        }
      }

      :deep(.mp-html) {
        img {
          max-width: 100% !important;
          height: auto !important;
          display: block;
          margin: 16px auto;
        }

        p {
          margin: 12px 0;
        }
      }

      .document-list {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
        gap: 16px;

        .document-item {
          display: flex;
          align-items: center;
          padding: 12px;
          background: #f5f7fa;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.3s ease;

          &:hover {
            background: #e6f7ff;
            transform: translateY(-2px);
          }

          .doc-icon {
            width: 24px;
            height: 24px;
            margin-right: 8px;
          }

          .doc-name {
            font-size: 14px;
            color: #666;
          }

          &.source-item {
            .download-icon {
              margin-left: auto;
              color: #1890ff;
              font-size: 18px;
            }
          }
        }
      }
    }

    &.is-mobile {
      padding: 16px;

      .video-section {
        .video-player {
          height: 200px;
        }
      }

      .title-section {
        .title {
          font-size: 20px;
        }
      }

      .section {
        .document-list {
          grid-template-columns: 1fr;
        }
      }
    }
  }
}
</style>

