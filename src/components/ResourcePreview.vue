# ResourcePreview.vue
<template>
  <view class="resource-preview">
    <view class="header">
      <text class="title">{{ resource.name }}</text>
      <button @tap="goBack" class="back-btn">返回</button>
    </view>

    <view class="main">
      <!-- PDF 预览 -->
      <block v-if="resource.type === 'pdf'">
        <view class="pdf-preview" v-if="isH5Platform">
          <view class="pdf-controls" v-if="canvasReady">
            <button @tap="prevPage" :disabled="currentPage <= 1">上一页</button>
            <text class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</text>
            <button @tap="nextPage" :disabled="currentPage >= totalPages">下一页</button>
            <select v-model="scale" class="scale-select">
              <option value="0.5">50%</option>
              <option value="0.75">75%</option>
              <option value="1.0">100%</option>
              <option value="1.25">125%</option>
              <option value="1.5">150%</option>
              <option value="2.0">200%</option>
              <option value="auto">适应页面</option>
            </select>
          </view>

          <view class="canvas-container" ref="canvasContainer">
            <canvas id="pdfCanvas"  v-show="canvasReady" type="2d"></canvas>
            <view v-if="!canvasReady" class="loading">加载中...</view>
            <view v-if="pdfError" class="error">{{ pdfError }}</view>
          </view>
        </view>
        <view v-else class="mp-preview">
          <button @tap="openInNative">在系统中打开</button>
        </view>
      </block>

      <!-- Word 文档预览 -->
      <block v-if="['doc', 'docx'].includes(resource.type)">
        <view class="doc-preview" v-if="isH5Platform">
          <view v-if="docProgress < 100 && !docError" class="loading-container">
            <text class="loading-text">文档加载中...</text>
          </view>
          <view v-if="docError" class="error">{{ docError }}</view>
          <div ref="containerRef" class="docx-container"></div>
        </view>
        <view v-else class="mp-preview">
          <button @tap="openInNative">在系统中打开</button>
        </view>
      </block>
    </view>

    <view class="footer">
      <text>© {{ new Date().getFullYear() }} 资源预览</text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { debounce } from 'lodash-es';
import {renderAsync} from "docx-preview";

const docError = ref<string | null>(null);
const docProgress = ref(0);
const containerRef = ref<HTMLElement | null>(null);

// 类型定义
interface Resource {
  name: string;
  type: 'pdf' | 'doc' | 'docx';
  path: string;
}

// Props 定义
const props = defineProps<{
  resource: Resource;
}>();

// 平台判断
const systemInfo = uni.getSystemInfoSync();
const isH5Platform = ref(systemInfo.uniPlatform === 'h5' || systemInfo.uniPlatform==='web');

// PDF 相关状态
const canvasReady = ref(false);
const pdfError = ref<string | null>(null);
const currentPage = ref(1);
const totalPages = ref(0);
const scale = ref('1.0');
const isRendering = ref(false);
const canvasContainer = ref<HTMLElement | null>(null);

// Word 相关状态

let pdfDoc: any = null;
let renderTask: any = null;
let pdfCanvas: any = null;
let pdfContext: any = null;

// 生命周期钩子
onMounted(async () => {
  if (isH5Platform.value) {
    await nextTick();
    if (props.resource.type === 'pdf') {
      await initPdfCanvas();
    }
  }
  await initializeResource();

  // Web 端的 resize 处理
  if (isH5Platform.value) {
    window.addEventListener('resize', handleResize);
  } else {
    uni.onWindowResize(handleResize);
  }
});

onUnmounted(() => {
  if (pdfDoc) {
    pdfDoc.destroy();
  }
  if (renderTask) {
    renderTask.cancel();
  }
  if (isH5Platform.value) {
    window.removeEventListener('resize', handleResize);
  } else {
    uni.offWindowResize(handleResize);
  }
});

// 方法定义
const handleResize = debounce(() => {
  if (props.resource.type === 'pdf' && pdfDoc) {
    renderPDFPage(true);
  }
}, 300);

const initPdfCanvas = async () => {
  try {
    await nextTick();
    const query = uni.createSelectorQuery();
    query.select('#pdfCanvas')
        .fields({ node: true, size: true })
        .exec((res) => {
          if (res?.[0]?.node) {
            pdfCanvas = res[0].node;
            pdfContext = pdfCanvas.getContext('2d');
            if (!pdfContext) {
              throw new Error('无法获取canvas上下文');
            }
          }
        });
  } catch (error) {
    console.error('初始化Canvas失败:', error);
    pdfError.value = '初始化Canvas失败';
  }
};

const initializeResource = async () => {
  if (props.resource) {
    await previewResource();
  }
};

const goBack = () => {
  uni.navigateBack();
};

const previewResource = async () => {
  try {
    switch (props.resource.type) {
      case 'pdf':
        await previewPDFFile();
        break;
      case 'doc':
      case 'docx':
        await previewDocFile();
        break;
    }
  } catch (error: any) {
    console.error('预览资源时发生错误:', error);
  }
};

const openInNative = () => {
  uni.openDocument({
    filePath: props.resource.path,
    fileType: props.resource.type,
    success: () => {
      console.log('打开文档成功');
    },
    fail: (err) => {
      console.error('打开文档失败:', err);
      uni.showToast({
        title: '无法打开文档',
        icon: 'none'
      });
    }
  });
};




const previewPDFFile = async () => {
  if (!isH5Platform.value) {
    openInNative();
    return;
  }

  try {
    // 动态导入 PDF.js
    const pdfjsLib = await import("pdfjs-dist/build/pdf");
    pdfjsLib.GlobalWorkerOptions.workerSrc = '/static/pdf/pdf.worker.min.mjs';

    pdfError.value = null;
    canvasReady.value = false;
    isRendering.value = true;

    if (renderTask) {
      await renderTask.cancel();
      renderTask = null;
    }

    // 加载PDF文档
    const loadingTask = pdfjsLib.getDocument({
      url: props.resource.path,
      cMapUrl: new URL('/static/pdf/cmaps/', import.meta.url).href,
      cMapPacked: true
    });

    pdfDoc = await loadingTask.promise;
    totalPages.value = pdfDoc.numPages;
    currentPage.value = 1;

    await renderPDFPage(true);
  } catch (error: any) {
    console.error('PDF 加载失败:', error);
    pdfError.value = '无法加载 PDF 文件';
    canvasReady.value = false;
  } finally {
    isRendering.value = false;
  }
};

const renderPDFPage = async (isInitial = false) => {
  if (!pdfDoc || !pdfCanvas || !pdfContext) {
    console.error('PDF渲染环境未准备好');
    return;
  }

  try {
    isRendering.value = true;

    if (renderTask) {
      await renderTask.cancel();
      renderTask = null;
    }

    const page = await pdfDoc.getPage(currentPage.value);
    const containerQuery = uni.createSelectorQuery();
    const container = await new Promise(resolve => {
      containerQuery
          .select('.canvas-container')
          .boundingClientRect(data => {
            resolve(data);
          })
          .exec();
    });

    const containerWidth = (container as any)?.width - 40 || 800;

    let finalScale = parseFloat(scale.value);
    if (scale.value === 'auto' || isInitial) {
      const pageWidth = page.view[2];
      finalScale = containerWidth / pageWidth;
      finalScale = Math.min(Math.max(finalScale, 0.5), 2.0);
      if (isInitial) {
        scale.value = finalScale.toString();
      }
    }

    const viewport = page.getViewport({ scale: finalScale });

    // 设置canvas物理像素大小
    const pixelRatio = uni.getSystemInfoSync().pixelRatio || 1;
    pdfCanvas.width = viewport.width * pixelRatio;
    pdfCanvas.height = viewport.height * pixelRatio;

    // 设置canvas样式大小
    pdfCanvas.style.width = viewport.width + 'px';
    pdfCanvas.style.height = viewport.height + 'px';

    // 调整context缩放以匹配像素比
    pdfContext.scale(pixelRatio/2, pixelRatio/2);

    // 清空画布
    pdfContext.fillStyle = 'white';
    pdfContext.fillRect(0, 0, viewport.width, viewport.height);


    renderTask = page.render({
      canvasContext: pdfContext,
      viewport: viewport,
      enableWebGL: false,
      renderInteractiveForms: true,
      background: 'white'
    });

    await renderTask.promise;
    canvasReady.value = true;
  } catch (error: any) {
    if (error.name === 'RenderingCancelled') {
      console.log('取消了之前的渲染');
      return;
    }
    console.error('PDF 页面渲染失败:', error);
    pdfError.value = '渲染 PDF 页面时出错';
    canvasReady.value = false;
  } finally {
    isRendering.value = false;
  }
};



const previewDocFile = async () => {
  if (!isH5Platform.value) {
    openInNative();
    return;
  }

  docError.value = null;
  docProgress.value = 0;

  try {
    // 1. 获取文档数据
    const response = await fetch(props.resource.path);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const buffer = await response.arrayBuffer();


    if (!containerRef.value) {
      throw new Error('Container element not found');
    }

    // 2. 创建容器和默认样式
    containerRef.value.innerHTML = '';

    // 添加默认样式表
    const defaultStyles = document.createElement('style');
    defaultStyles.textContent = `
      /* 默认样式 */
	  .docx-viewer-wrapper{
		  display: block !important;
	  }
      .docx-viewer .Footnote-Text {
        font-size: 0.8em;
        color: #666;
        margin: 8px 0;
      }

      .docx-viewer .TableNormal {
        border-collapse: collapse;
        width: 100%;
      }

      .docx-viewer .TableNormal td {
        border: 1px solid #ddd;
        padding: 8px;
      }

      /* 文本填充效果 */
      .docx-viewer .text-fill {
        background-clip: text;
        -webkit-background-clip: text;
        color: currentColor;
      }

      /* 连字效果 */
      .docx-viewer .ligatures {
        font-variant-ligatures: common-ligatures;
      }

      /* 网格对齐 */
      .docx-viewer .snap-to-grid {
        text-align: left;
        display: block;
      }

      /* 默认段落样式 */
      .docx-viewer p {
        margin: 0;
        padding: 0;
        min-height: 1em;
      }
    `;
    document.head.appendChild(defaultStyles);

    // 3. 设置渲染选项
    const defaultOptions = {
      className: 'docx-viewer',
      inWrapper: true,
      ignoreWidth: true,
      ignoreHeight: false,
      pageMargins:{
        top: 20,
        right: 10,
        bottom: 20,
        left: 10
      },
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      useBase64URL: false,
      breakPages: true,
      experimental: false,
      ignoreFonts: false,
      trimXmlDeclaration: true,
      ignoreLastRenderedPageBreak: true,
      debug: false,
      defaultFont: {
        name: 'Arial',
        url: null
      },
      renderElements: {
        // 添加自定义元素渲染
        textFill: (elem) => {
          elem.className += ' text-fill';
          return true;
        },
        ligatures: (elem) => {
          elem.className += ' ligatures';
          return true;
        },
        snapToGrid: (elem) => {
          elem.className += ' snap-to-grid';
          return true;
        }
      },
      // 添加基础样式映射
      styleMap: [
        "style[name='Footnote Text'] => p.Footnote-Text",
        "style[name='Table Normal'] => table.TableNormal",
        "p[style-name='Normal'] => p.Normal",
        "p[style-name='Heading 1'] => h1",
        "p[style-name='Heading 2'] => h2",
        "p[style-name='Heading 3'] => h3"
      ],
      pageMargins: {
        top: 20,
        right: 20,
        bottom: 20,
        left: 20
      },
      pageSize: {
        width: 816,
        height: 1056
      },
      useBase64URL: false
    };

    // 4. 渲染文档
    await renderAsync(buffer, containerRef.value, containerRef.value, defaultOptions);

    // 5. 应用后处理
    const contentNodes = containerRef.value.querySelectorAll('.docx-viewer *');
    contentNodes.forEach(node => {
      // 处理表格
      if (node.tagName === 'TABLE' && !node.classList.contains('TableNormal')) {
        node.classList.add('TableNormal');
      }
      // 处理脚注
      if (node.classList.contains('footnote-ref')) {
        node.classList.add('Footnote-Text');
      }
    });

    docProgress.value = 100;

  } catch (error: any) {
    console.error('转换 Word 文档失败:', error);
    docError.value = error?.message || '无法预览 Word 文档';

    uni.showToast({
      title: '文档加载失败',
      icon: 'none',
      duration: 2000
    });
  }
};


const prevPage = () => {
  if (currentPage.value > 1) {
    currentPage.value--;
  }
};

const nextPage = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
  }
};

// 监听页码变化
watch(currentPage, () => {
  if (props.resource.type === 'pdf' && !isRendering.value) {
    renderPDFPage();
  }
});

// 监听缩放比例变化
watch(scale, () => {
  if (props.resource.type === 'pdf' && !isRendering.value) {
    renderPDFPage();
  }
});
</script>

<style>
.resource-preview {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background-color: #f5f5f5;
}

.title {
  font-size: 32rpx;
  font-weight: bold;
}

.back-btn {
  padding: 10rpx 20rpx;
  font-size: 28rpx;
  background-color: #4a90e2;
  color: white;
  border-radius: 4rpx;
}

.main {
  flex: 1;
  padding: 20rpx;
  width: 100%;
}

.pdf-preview {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.pdf-controls {
  display: flex;
  align-items: center;
  justify-content: space-between; /* 改为 space-between 布局 */
  flex-wrap: nowrap; /* 防止换行 */
  padding: 12rpx 16rpx;
  background-color: #f8f9fa;
  border-radius: 4rpx;
  position: sticky;
  top: 0;
  z-index: 10;
  min-height: 48rpx;
}

.pdf-controls button{
	 white-space: nowrap; /* 防止按钮文字换行 */
	  min-width: 80rpx;
	  padding: 0 16rpx;
	  font-size: 24rpx;
	  height: 48rpx;
	  line-height: 48rpx;
}



.scale-select {
  width: auto;
  padding: 0 8rpx;
  height: 48rpx;
  font-size: 24rpx;
}

.page-info {
  flex: 0 1 auto; /* 允许收缩但不伸展 */
  text-align: center;
  margin: 0 8rpx;
  font-size: 24rpx;
  white-space: nowrap;
}

.canvas-container {
  width: 100%;
  min-height: 800rpx;
  background-color: #f8f9fa;
  position: relative;
  padding: 20rpx;
  overflow: auto;
  border: 1rpx solid #e0e0e0;
  border-radius: 4rpx;
}

.mp-preview {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 40rpx;
}

.loading,
.error {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background-color: rgba(255, 255, 255, 0.9);
  padding: 20rpx;
  border-radius: 8rpx;
}

.error {
  color: #dc3545;
}


.doc-content {
  line-height: 1.6;
  font-size: 14px;
  color: #333;
}

.footer {
  padding: 20rpx;
  background-color: #f5f5f5;
  text-align: center;
  color: #666;
}

#pdfCanvas {
  display: block;
  background-color: white;
  max-width: 100%;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.canvas-container {
  display: flex;
  //justify-content: center;
  align-items: flex-start;
  overflow-x: auto;
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  padding: 20rpx;
}

@media screen and (min-width: 768px) {
  .title {
    font-size: 24px;
  }

  .back-btn {
    padding: 10px 20px;
    font-size: 16px;
  }

  .canvas-container,
  .doc-preview {
    min-height: 800px;
  }
}


.doc-content img {
  max-width: 100%;
  height: auto;
  margin: 10px 0;
}

.doc-content table {
  width: 100%;
  border-collapse: collapse;
  margin: 10px 0;
}

.doc-content table td,
.doc-content table th {
  border: 1px solid #ddd;
  padding: 8px;
}

.doc-content p {
  margin: 10px 0;
}

.doc-content h1,
.doc-content h2,
.doc-content h3,
.doc-content h4,
.doc-content h5,
.doc-content h6 {
  margin: 20px 0 10px;
  font-weight: bold;
}

.doc-content ul,
.doc-content ol {
  padding-left: 20px;
  margin: 10px 0;
}

.doc-content li {
  margin: 5px 0;
}

.doc-content a {
  color: #4a90e2;
  text-decoration: none;
}

.doc-content a:hover {
  text-decoration: underline;
}


.doc-table td,
.doc-table th {
  border: 1px solid #ddd;
  padding: 12rpx;
  font-size: 28rpx;
}


.doc-wrapper img {
  max-width: 100%;
  height: auto;
  margin: 16rpx auto;
  display: block;
}

.docx-viewer-wrapper {
  display: block !important;
  width: 100% !important;
  min-width: 0 !important;
  overflow-x: auto !important;
}


.docx-container {
  width: 100%;
  min-height: 800rpx;
  background: #fff;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  position: relative;
  padding: 0 20rpx;
  box-sizing: border-box;
}

.docx-viewer .page {
  width: auto !important;
  min-width: 100%;
  max-width: none !important;
  margin: 0 auto 20px;
  padding: 20px;
  box-sizing: border-box;
  overflow-x: visible;
}


.docx-viewer table {
  max-width: 100%;
  width: auto !important;
  table-layout: auto;
  overflow-x: auto;
  display: block;
}



.loading-container {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.95);
  padding: 20rpx 30rpx;
  border-radius: 8rpx;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  z-index: 1000;
  width: 80%;
  max-width: 300px;
}

.loading-text {
  display: block;
  text-align: center;
  margin-bottom: 10rpx;
  color: #666;
  font-size: 28rpx;
}

.progress-bar {
  width: 100%;
  height: 6rpx;
  background: #eee;
  border-radius: 3rpx;
  overflow: hidden;
}

.progress-inner {
  height: 100%;
  background: #4a90e2;
  transition: width 0.3s ease;
}

.error {
  padding: 20rpx;
  margin: 20rpx;
  background: #fff1f0;
  border: 1px solid #ffccc7;
  border-radius: 4rpx;
  color: #cf1322;
  font-size: 28rpx;
  text-align: center;
}


.docx-container {
  width: 100%;
  min-height: 800rpx;
  background: #fff;
  overflow: auto;
  position: relative;
  /* 添加内边距确保内容不会贴边 */
  padding: 0 20rpx;
  box-sizing: border-box;
}


.doc-preview {
  width: 100%;
  padding: 0; /* 移除原有的内边距 */
  background-color: #fff;
  border: 1rpx solid #e0e0e0;
  border-radius: 4rpx;
  min-height: 1000rpx;
  overflow-x: auto; /* 添加横向滚动 */
}

/* 页面样式 */
.docx-viewer .page {
  background: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  margin: 0 auto 20px;
  padding: 20px;
  width: 100%;
  min-width: fit-content;
  box-sizing: border-box;
}

/* 表格样式 */
.docx-viewer table,
.docx-viewer .TableNormal {
  width: 100% !important;
  border-collapse: collapse;
  margin: 10px 0;
  table-layout: fixed;
}

.docx-viewer td,
.docx-viewer th {
  border: 1px solid #ddd;
  padding: 8px;
  word-wrap: break-word;
  vertical-align: top;
}

/* 图片样式 */
.docx-viewer img {
  max-width: 100%;
  height: auto !important;
  margin: 10px 0;
}

/* 段落样式 */
.docx-viewer p {
  margin: 0 0 10px 0;
  min-height: 1em;
}

/* 标题样式 */
.docx-viewer h1,
.docx-viewer h2,
.docx-viewer h3,
.docx-viewer h4,
.docx-viewer h5,
.docx-viewer h6 {
  margin: 20px 0 10px 0;
  font-weight: bold;
  line-height: 1.2;
}

/* 列表样式 */
.docx-viewer ul,
.docx-viewer ol {
  margin: 10px 0;
  padding-left: 30px;
}

.docx-viewer li {
  margin: 5px 0;
}

/* 脚注样式 */
.docx-viewer .Footnote-Text {
  font-size: 0.8em;
  color: #666;
  margin-top: 20px;
  padding-top: 10px;
  border-top: 1px solid #eee;
}

/* 特殊文本效果 */
.docx-viewer .text-fill {
  color: currentColor;
}

.docx-viewer .ligatures {
  font-variant-ligatures: common-ligatures;
}

.docx-viewer .snap-to-grid {
  text-align: left;
}

/* 超链接样式 */
.docx-viewer a {
  color: #0066cc;
  text-decoration: none;
}

.docx-viewer a:hover {
  text-decoration: underline;
}


/* 响应式调整 */
@media screen and (max-width: 768px) {
  .docx-viewer {
    padding: 10px;
  }

  .docx-viewer .page {
    padding: 20px;
  }

  .docx-viewer table {
    font-size: 14px;
  }
}

/* 修复常见问题 */
.docx-viewer * {
  box-sizing: border-box;
  max-width: 100%;
}

.docx-viewer pre,
.docx-viewer code {
  white-space: pre-wrap;
  word-wrap: break-word;
}

.docx-viewer ul,
.docx-viewer ol {
  padding-left: 40rpx;
  margin: 12rpx 0;
}

.docx-viewer li {
  margin: 8rpx 0;
  line-height: 1.6;
}

.docx-viewer a {
  color: #4a90e2;
  text-decoration: none;
}

.docx-viewer pre {
  background: #f5f5f5;
  padding: 16rpx;
  border-radius: 4rpx;
  overflow-x: auto;
}

.docx-viewer figure {
  margin: 16rpx 0;
  text-align: center;
}

.docx-viewer figcaption {
  color: #666;
  font-size: 24rpx;
  margin-top: 8rpx;
}

/* 修复表格过宽问题 */
.docx-viewer .table-wrapper {
  max-width: 100%;
  overflow-x: auto;
  margin: 16rpx 0;
}

/* 修复图片过大问题 */
.docx-viewer .image-wrapper {
  max-width: 100%;
  margin: 16rpx 0;
}

/* 修复分页问题 */
.docx-viewer .page-break {
  page-break-after: always;
  break-after: page;
}



/* 加载状态样式 */
.loading {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(255, 255, 255, 0.9);
  padding: 20rpx;
  border-radius: 8rpx;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.error {
  color: #dc3545;
  padding: 20rpx;
  text-align: center;
  background: #fff;
  border-radius: 8rpx;
  margin: 20rpx;
}


@media screen and (max-width: 768px) {
  .docx-viewer {
    padding: 10px;
  }

  .docx-container {
    padding: 0 10rpx;
  }

  /* 确保表格可以横向滚动 */
  .docx-viewer table {
    min-width: fit-content;
  }
}

@media screen and (max-width: 768px) {
  .pdf-controls {
    gap: 8rpx; /* 减小间距 */
  }
}


</style>
