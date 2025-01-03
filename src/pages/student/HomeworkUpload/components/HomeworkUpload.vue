<template>
  <view class="homework-upload">
    <!-- 基本信息部分 -->
    <view class="form-section">
      <view class="section-header">
        <text class="section-title">基本信息</text>
      </view>

      <view class="form-item">
        <text class="label">设计题目</text>
        <uni-easyinput
            v-model="formData.title"
            placeholder="请输入设计题目"
        />
      </view>

      <view class="form-item">
        <text class="label">选择课程</text>
        <picker
            :range="subjectList"
            range-key="text"
            @change="handleSubjectChange"
        >
          <view class="uni-input">{{ getSelectedSubject }}</view>
        </picker>
      </view>

      <view class="form-item">
        <text class="label">类型</text>
        <radio-group @change="handleTypeChange">
          <label class="radio-label" v-for="item in typeOptions" :key="item.value">
            <radio :value="item.value" :checked="formData.subjectType === item.value" />
            <text>{{ item.label }}</text>
          </label>
        </radio-group>
      </view>
    </view>

    <!-- 富文本编辑器部分 -->
    <view class="form-section">
      <view class="form-item">
        <text class="label">背景</text>
        <!-- #ifdef H5 -->
        <Editor
            id="background-editor"
            v-model="formData.background"
            :init="editorInit"
            :disabled="false"
            @onClick="handleEditorClick"
        />
        <!-- #endif -->

        <!-- #ifdef MP-WEIXIN -->
        <Editor
            id="background-editor"
            class="weixin-editor"
            :placeholder="'请输入背景描述'"
            @ready="onEditorReady('background')"
            @input="onEditorInput($event, 'background')"
        ></Editor>
        <!-- #endif -->
      </view>

      <view class="form-item">
        <text class="label">系统设计</text>
        <!-- #ifdef H5 -->
        <Editor
            id="system-editor"
            v-model="formData.systemDesign"
            :init="editorInit"
            :disabled="false"
            @onClick="handleEditorClick"
        />
        <!-- #endif -->

        <!-- #ifdef MP-WEIXIN -->
        <Editor
            id="system-editor"
            class="weixin-editor"
            :placeholder="'请输入系统设计描述'"
            @ready="onEditorReady('systemDesign')"
            @input="onEditorInput($event, 'systemDesign')"
        ></Editor>
        <!-- #endif -->
      </view>
    </view>

    <!-- 在系统设计后面添加新的表单项 -->
    <view class="form-section">
      <view class="form-item">
        <text class="label">内容简介</text>
        <textarea
            v-model="formData.brief"
            class="content-textarea"
            placeholder="请输入内容简介(不超过300字)"
            maxlength="300"
        />
        <text class="word-count">{{formData.brief.length}}/300</text>
      </view>

      <view class="form-item">
        <text class="label">硬件技术</text>
        <textarea
            v-model="formData.hardwareTech"
            class="content-textarea"
            placeholder="请输入硬件技术说明"
        />
      </view>

      <view class="form-item">
        <text class="label">软件技术</text>
        <textarea
            v-model="formData.softwareTech"
            class="content-textarea"
            placeholder="请输入软件技术说明"
        />
      </view>
    </view>


    <!-- 文件上传部分 -->
    <view class="form-section">
      <view class="section-header">
        <text class="section-title">附件上传</text>
      </view>

      <view class="upload-grid">
        <view v-for="(config, type) in uploadConfig" :key="type" class="upload-item">
          <text class="upload-label">{{ config.label }}</text>

          <view class="file-list">
            <view v-for="(file, index) in fileList[type]" :key="index" class="file-item">
              <text class="file-name truncate-filename"
                    :data-filename="file.name"
                    :title="file.name">
                {{ file.name }}
              </text>
              <text class="delete-btn" @tap="handleDeleteFile(type, index)">×</text>
            </view>
          </view>

          <!-- #ifdef H5 || APP-PLUS -->
          <button
              class="upload-btn"
              :disabled="uploading"
              @tap="handleSelectFile(type)"
          >
            选择文件
          </button>
          <!-- #endif -->

          <!-- #ifdef MP-WEIXIN -->
          <button
              class="upload-btn"
              :disabled="uploading"
              @tap="handleSelectFileMP(type)"
          >
            选择文件
          </button>
          <!-- #endif -->
        </view>
      </view>
    </view>

    <!-- 提交按钮 -->
    <view class="submit-section">
      <button class="submit-btn" :disabled="uploading" @tap="handleSubmit">
        {{ uploading ? '上传中...' : '提交' }}
      </button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, reactive ,onMounted,onUnmounted,watch,watchEffect} from 'vue'
import  Editor  from '@tinymce/tinymce-vue';
import {subjectApi} from "@/api/subject";
import 'tinymce/tinymce.min.js'

// Tinymce 插件导入
import 'tinymce/models/dom/model';
import 'tinymce/themes/silver';
import 'tinymce/icons/default';

// 导入必要的插件
import 'tinymce/plugins/advlist';
import 'tinymce/plugins/autolink';
import 'tinymce/plugins/lists';
import 'tinymce/plugins/link';
import 'tinymce/plugins/image';
import 'tinymce/plugins/charmap';
import 'tinymce/plugins/preview';
import 'tinymce/plugins/anchor';
import 'tinymce/plugins/searchreplace';
import 'tinymce/plugins/visualblocks';
import 'tinymce/plugins/code';
import 'tinymce/plugins/fullscreen';
import 'tinymce/plugins/insertdatetime';
import 'tinymce/plugins/media';
import 'tinymce/plugins/table';
import 'tinymce/plugins/help';
import 'tinymce/plugins/wordcount';
import 'tinymce/plugins/emoticons';
import Layout from "@/components/layout/Layout.vue";
import {useUserStore} from "@/store/user";
import {homeworkApi} from "@/api/homework";

// 类型定义

interface Subject {
  value: string | number
  text: string
}

interface FileItem {
  name: string
  url: string
}

interface FormState {
  id:string
  title: string
  subjectId: string | number
  subjectType: number
  brief: string
  hardwareTech: string
  softwareTech: string
  background: string
  systemDesign: string
  attachmentWord: string
  attachmentPdf: string
  attachmentSource: string
  attachmentMp4: string
}

interface FileList {
  word: FileItem[]
  pdf: FileItem[]
  source: FileItem[]
  mp4: FileItem[]
}

// 上传配置
const uploadConfig = {
  word: { label: 'WORD文档', accept: '.doc,.docx' },
  pdf: { label: 'PDF文档', accept: '.pdf' },
  source: { label: '源文件', accept: '.zip,.rar,.7z' },
  mp4: { label: 'MP4演示视频', accept: '.mp4' }
}


// 状态定义
const subjectList = ref<Subject[]>([])
const uploading = ref(false)

const props = defineProps({
  homeworkId: {
    type: String,
    default: ''
  }
})

const loadHomeworkData = async () => {
  try {
    console.log("加载作业信息", props.homeworkId)
    if (!props.homeworkId) return

    const res = await homeworkApi.getMyHomeworkDetail(props.homeworkId)
    if (res) {
      // 填充表单数据
      Object.assign(formData, {
        id:res.id,
        title: res.title,
        subjectId: res.subjectId,
        subjectType: res.subjectType,
        brief: res.brief || '',
        hardwareTech: res.hardwareTech || '',
        softwareTech: res.softwareTech || '',
        background: res.background || '',
        systemDesign: res.systemDesign || '',
      })

      // 填充文件列表
      if (res.attachmentWord) {
        fileList.word = res.attachmentWord.split(',').map(url => ({
          name: url.split('/').pop() || '',
          url
        }))
      }
      if (res.attachmentPdf) {
        fileList.pdf = res.attachmentPdf.split(',').map(url => ({
          name: url.split('/').pop() || '',
          url
        }))
      }
      if (res.attachmentSource) {
        fileList.source = res.attachmentSource.split(',').map(url => ({
          name: url.split('/').pop() || '',
          url
        }))
      }
      if (res.attachmentMp4) {
        fileList.mp4 = res.attachmentMp4.split(',').map(url => ({
          name: url.split('/').pop() || '',
          url
        }))
      }
    }
  } catch (error) {
    console.error('加载作业数据失败：', error)
    uni.showToast({
      title: '加载作业数据失败',
      icon: 'none'
    })
  }
}

// 最后才使用 watch 或 watchEffect
watchEffect(async () => {
  if (props.homeworkId) {
    await loadHomeworkData()
  }
})

const formData = reactive<FormState>({
  id: '',
  title: '',
  subjectId: '',
  subjectType: 0,
  brief: '',
  hardwareTech: '',
  softwareTech: '',
  background: '',
  systemDesign: '',
  attachmentWord: '',
  attachmentPdf: '',
  attachmentSource: '',
  attachmentMp4: ''
})

const fileList = reactive<FileList>({
  word: [],
  pdf: [],
  source: [],
  mp4: []
})

const typeOptions = [
  { label: '嵌入式', value: 0 },
  { label: '物联网', value: 1 }
]

const emit = defineEmits(['update:homeworkId'])

// 计算属性
const getSelectedSubject = computed(() => {
  const selected = subjectList.value.find(item => item.value === formData.subjectId)
  return selected ? selected.text : '请选择课程'
})

const userStore = useUserStore()



// TinyMCE 编辑器配置
const editorInit = {
  base_url: '/static/tinymce',
  promotion: false,  // 禁用推广
  branding: false,   // 禁用品牌
  menubar: false,
  plugins: [
    'advlist', 'autolink', 'lists', 'link', 'image','imagetools',
    'charmap', 'preview', 'anchor', 'searchreplace',
    'visualblocks', 'code', 'fullscreen', 'media',
    'table','emoticons', 'help', 'wordcount'
  ],
  toolbar: 'undo redo | formatselect | ' +
      'bold italic backcolor | alignleft aligncenter ' +
      'alignright alignjustify | bullist numlist outdent indent | ' +
      '|image|removeformat | emoticons | help',
  content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px }',
  language: 'zh_CN',
  mobile: {
    menubar: false,
    // toolbar: 'undo redo | bold italic | link',
    toolbar_mode: 'scrolling',
    content_style: 'body { font-size: 14px; }'
  },
  // 自定义工具栏布局
  toolbar_mode: 'wrap', // 允许工具栏换行
  toolbar_sticky: true, // 工具栏固定
  toolbar_location: 'top',


  // 图片上传配置
  images_upload_handler: async (blobInfo: any, progress: any) => {
    return new Promise(async (resolve, reject) => {
      try {
        // #ifdef H5
        const formData = new FormData();
        const file = blobInfo.blob();
        formData.append('file', file);

        const xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/common/upload');
        xhr.setRequestHeader('token', userStore.token);

        xhr.onload = () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText);
            if (response.code === 0) {
              resolve(response.data);
            } else {
              reject(response.message || '上传失败');
            }
          } else {
            reject('上传失败');
          }
        };

        xhr.onerror = () => reject('网络错误');
        xhr.upload.onprogress = (e) => {
          progress(e.loaded / e.total * 100);
        };

        xhr.send(formData);
        // #endif

        // #ifdef MP-WEIXIN
        const res = await uni.uploadFile({
          url: '/api/common/upload',
          name: 'file',
          header: {
            'token': userStore.token
          },
          filePath: blobInfo.blob(),
          success: (uploadRes) => {
            if(uploadRes.statusCode === 200) {
              const data = JSON.parse(uploadRes.data);
              if(data.code === 0) {
                resolve(data.data);
              } else {
                reject(data.message || '上传失败');
              }
            } else {
              reject('上传失败');
            }
          },
          fail: (error) => {
            console.error('图片上传失败:', error);
            reject('上传失败');
          }
        });
        // #endif
      } catch (error) {
        console.error('图片上传错误:', error);
        reject('上传失败');
      }
    });
  },

  // 图片相关配置
  image_advtab: true, // 开启高级选项卡
  image_uploadtab: true, // 开启上传选项卡
  automatic_uploads: true, // 自动上传
  images_reuse_filename: true, // 重用文件名

  // 设置自动高度
  min_height: 200,
  max_height: 800,
  autoresize_bottom_margin: 50
};
// 微信小程序编辑器相关
const editorCtx = reactive<{
  background?: any;
  systemDesign?: any;
}>({});

const onEditorReady = async (type: 'background' | 'systemDesign') => {
  // #ifdef MP-WEIXIN
  try {
    const query = uni.createSelectorQuery();
    query.select(`#${type}-editor`).context((res: any) => {
      editorCtx[type] = res.context;
      // 设置初始内容
      if (formData[type]) {
        editorCtx[type].setContents({ html: formData[type] });
      }
    }).exec();
  } catch (error) {
    console.error('编辑器初始化失败：', error);
  }
  // #endif
};

const onEditorInput = (e: any, type: 'background' | 'systemDesign') => {
  formData[type] = e.detail.html;
};

const handleEditorClick = (e: Event) => {
  // 处理编辑器点击事件
  console.log('Editor clicked:', e);
};


// 方法定义
const getSubjectList = async () => {
  try {
    const res = await subjectApi.getSubjectListByStu()
    subjectList.value = res.map(item => ({
      value: item.id,
      text: item.title
    }))
  } catch (error) {
    console.error('获取课程列表失败：', error)
    uni.showToast({
      title: '获取课程列表失败',
      icon: 'error'
    })
  }
}



const handleSubjectChange = (e: any) => {
  const index = e.detail.value
  formData.subjectId = subjectList.value[index].value
}

const handleTypeChange = (e: any) => {
  formData.subjectType = Number(e.detail.value)
}


// 更新 handleSelectFile 方法
const handleSelectFile = (type: keyof FileList) => {
  // #ifdef H5 || APP-PLUS
  const inputElement = document.createElement('input');
  inputElement.type = 'file';
  inputElement.accept = uploadConfig[type].accept;
  inputElement.style.display = 'none';

  inputElement.onchange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (target.files?.length) {
      handleFileUpload(type, target.files[0]);
    }
  };

  document.body.appendChild(inputElement);
  inputElement.click();
  document.body.removeChild(inputElement);
  // #endif
};


const handleSelectFileMP = async (type: keyof FileList) => {
  // #ifdef MP-WEIXIN
  try {
    const res = await uni.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: uploadConfig[type].accept.split(',')
    })
    if (res.tempFiles?.length) {
      handleFileUpload(type, res.tempFiles[0])
    }
  } catch (error) {
    console.error('选择文件失败：', error)
  }
  // #endif
}

const handleFileChange = async (type: keyof FileList, e: Event) => {
  const target = e.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    uploading.value = true
    try {
      const formData = new FormData()
      formData.append('file', file)

      const res = await uni.uploadFile({
        url: '/api/common/upload',
        name: 'file',
        // @ts-ignore
        file: file, // H5环境下直接传file对象
        filePath: file // 兼容APP环境
      })

      if (res.statusCode === 200) {
        const data = JSON.parse(res.data)
        if (data.code === 0) { // 假设后端返回code为0表示成功
          fileList[type].push({
            name: file.name,
            url: data.data
          })
        } else {
          throw new Error(data.message || '上传失败')
        }
      } else {
        throw new Error('上传失败')
      }
    } catch (error: any) {
      console.error('文件上传失败：', error)
      uni.showToast({
        title: error.message || '上传失败',
        icon: 'none'
      })
    } finally {
      uploading.value = false
      // 清空input的value，否则相同文件无法重复选择
      const input = document.getElementById(`file-input-${type}`) as HTMLInputElement
      if (input) {
        input.value = ''
      }
    }
  }
}
const handleFileUpload = async (type: keyof FileList, file: UniApp.ChooseFile | File) => {
  uploading.value = true;
  try {
    const formData = new FormData();

    // #ifdef H5
    if(file instanceof File) {
      formData.append('file', file);
    }
    // #endif

    // #ifdef MP-WEIXIN
    if('path' in file) {
      formData.append('file', file);
    }
    // #endif

    const res = await uni.uploadFile({
      url: '/api/common/upload',
      name: 'file',
      header: {
        'token': userStore.token
      },
      // @ts-ignore
      file: file instanceof File ? file : undefined,
      filePath: 'path' in file ? file.path : undefined,
      success: (uploadRes) => {
        if(uploadRes.statusCode === 200) {
          const data = JSON.parse(uploadRes.data);
          if(data.code === 0) {
            fileList[type].push({
              name: file instanceof File ? file.name : file.name,
              url: data.data
            });
          } else {
            throw new Error(data.message || '上传失败');
          }
        } else {
          throw new Error('上传失败');
        }
      },
      fail: (error) => {
        console.error('文件上传失败:', error);
        throw new Error('上传失败');
      }
    });

  } catch (error: any) {
    console.error('文件上传失败：', error);
    uni.showToast({
      title: error.message || '上传失败',
      icon: 'none'
    });
  } finally {
    uploading.value = false;
  }
};

const handleDeleteFile = (type: keyof FileList, index: number) => {
  fileList[type].splice(index, 1)
}

const handleSubmit = async () => {
  if (!formData.title || !formData.subjectId) {
    uni.showToast({
      title: '请填写必要信息',
      icon: 'none'
    })
    return
  }

  // 添加内容简介字数验证
  if (formData.brief.length > 300) {
    uni.showToast({
      title: '内容简介不能超过300字',
      icon: 'none'
    })
    return
  }

  // 验证其他必填字段
  if (!formData.background || !formData.systemDesign) {
    uni.showToast({
      title: '请填写背景和系统设计',
      icon: 'none'
    })
    return
  }

  try {
    // 构建提交数据
    const submitData = {
      ...formData,
      studentId:userStore.userInfo?.id,
      attachmentWord: fileList.word.map(f => f.url).join(','),
      attachmentPdf: fileList.pdf.map(f => f.url).join(','),
      attachmentSource: fileList.source.map(f => f.url).join(','),
      attachmentMp4: fileList.mp4.map(f => f.url).join(',')
    }

    console.log(submitData)
    const res = await homeworkApi.addOrUpdateHomework(submitData)
    if (res) {
      uni.showToast({
        title: '提交成功',
        icon: 'success'
      })
      // 可以添加提交成功后的跳转逻辑
      uni.navigateBack()
    } else {
      throw new Error('提交失败')
    }
  } catch (error: any) {
    console.error('提交失败：', error)
    uni.showToast({
      title: error.message || '提交失败',
      icon: 'none'
    })
  }
}

// 重置表单方法（可选，用于重置或取消时使用）
const resetForm = () => {
  Object.assign(formData, {
    title: '',
    subjectId: '',
    type: 0,
    brief: '',
    hardwareTech: '',
    softwareTech: '',
    background: '',
    systemDesign: '',
    attachmentWord: '',
    attachmentPdf: '',
    attachmentSource: '',
    attachmentMp4: ''
  })

  // 清空文件列表
  Object.keys(fileList).forEach(key => {
    fileList[key as keyof FileList] = []
  })
}

// 监听输入限制
const handleInput = (field: keyof FormState, event: any) => {
  if (field === 'brief' && event.detail.value.length > 300) {
    formData[field] = event.detail.value.slice(0, 300)
    uni.showToast({
      title: '内容已达到300字限制',
      icon: 'none'
    })
  }
}

watch(() => formData.brief, (newVal) => {
  if (newVal.length > 300) {
    uni.showToast({
      title: '内容已超过300字限制',
      icon: 'none'
    })
  }
})

onMounted(() => {
  getSubjectList()
})


// 组件卸载时清理编辑器实例
onUnmounted(() => {
  // 在小程序环境下可能需要清理编辑器实例
  // #ifdef MP-WEIXIN
  editorCtx.background = null;
  editorCtx.systemDesign = null;
  // #endif
  emit('update:homeworkId', '') // 清空 homeworkId
});

</script>

<style lang="scss" scoped>
.homework-upload {
  padding: 20px;
  background-color: #f5f7fa;
  min-height: 100vh;

  .form-section {
    background-color: #ffffff;
    border-radius: 12px;
    padding: 20px;
    margin-bottom: 20px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
  }

  .section-header {
    margin-bottom: 20px;

    .section-title {
      font-size: 18px;
      font-weight: 600;
      color: #1a1a1a;
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
        background-color: #409eff;
        border-radius: 2px;
      }
    }
  }

  .form-item {
    margin-bottom: 20px;

    .label {
      display: block;
      margin-bottom: 8px;
      font-size: 14px;
      font-weight: 500;
      color: #1a1a1a;
    }
  }

  .editor-container {
    border: 1px solid #dcdfe6;
    border-radius: 8px;
    overflow: hidden;

    .editor-toolbar {
      display: flex;
      padding: 8px;
      border-bottom: 1px solid #dcdfe6;
      background-color: #f5f7fa;

      .tool-item {
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 8px;
        border-radius: 4px;
        cursor: pointer;

        &:hover {
          background-color: #e4e7ed;
        }

        .tool-icon {
          font-size: 14px;
          color: #606266;
        }
      }
    }

    .editor-content {
      width: 100%;
      min-height: 200px;
      padding: 12px;
      border: none;
      resize: vertical;
      font-size: 14px;
      line-height: 1.6;
      color: #303133;

      &:focus {
        outline: none;
      }
    }
  }

  .upload-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
    gap: 20px;
    width: 100%;
    box-sizing: border-box;

    @media screen and (max-width: 768px) {
      grid-template-columns: 1fr;
      gap: 12px;
      padding: 0;
      overflow: hidden;
    }

    .upload-item {
      width: 100%;
      box-sizing: border-box;
      background-color: #f8f9fa;
      border-radius: 8px;
      padding: 16px;
      border: 1px solid #e4e7ed;

      @media screen and (max-width: 768px) {
        padding: 12px 8px;
        margin: 0;
        width: 100%;

        .file-list {
          max-height: 100px;
          margin-bottom: 8px;
          width: 100%;
          box-sizing: border-box;

          .file-item {
            padding: 6px 8px;
            margin-bottom: 4px;
            width: 100%;
            box-sizing: border-box;
            display: flex;
            align-items: center;

            .file-name {
              flex: 1;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
              font-size: 13px;
              color: #606266;
              padding-right: 8px;
              box-sizing: border-box;

              @media screen and (max-width: 768px) {
                max-width: 150px; // 移动端限制最大宽度
                font-size: 12px;

                // 如果文件名太长，显示前10个字符和后6个字符
                &.truncate-filename {
                  display: inline-block;
                  max-width: 150px;
                  position: relative;

                  &::before {
                    content: attr(data-filename);
                    position: absolute;
                    left: 0;
                    width: 100%;
                    white-space: nowrap;
                    overflow: hidden;
                    text-overflow: ellipsis;
                  }
                }
              }
            }

            .delete-btn {
              min-width: 20px; // 确保删除按钮有固定宽度
              width: 20px;
              height: 20px;
              line-height: 20px;
              text-align: center;
              flex-shrink: 0; // 防止压缩

              @media screen and (max-width: 768px) {
                min-width: 16px;
                width: 16px;
                height: 16px;
                line-height: 16px;
              }
            }
          }
        }

        .upload-label {
          margin-bottom: 8px;
          font-size: 13px;
          padding: 0 4px;
        }

        .upload-btn {
          height: 32px;
          font-size: 13px;
          margin: 0;
          width: 100%;
        }
      }

      .upload-label {
        display: block;
        margin-bottom: 12px;
        font-size: 14px;
        font-weight: 500;
        color: #1a1a1a;
      }

      .file-list {
        margin-bottom: 12px;
        max-height: 150px;
        overflow-y: auto;
        width: 100%;
        box-sizing: border-box;

        .file-item {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 8px 12px;
          background-color: #ffffff;
          border: 1px solid #ebeef5;
          border-radius: 6px;
          margin-bottom: 8px;
          width: 100%;
          box-sizing: border-box;

          &:last-child {
            margin-bottom: 0;
          }

          .file-name {
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
            font-size: 13px;
            color: #606266;
            padding-right: 12px;
            box-sizing: border-box;
            max-width: calc(100% - 32px);
          }

          .delete-btn {
            width: 20px;
            height: 20px;
            line-height: 20px;
            text-align: center;
            border-radius: 50%;
            color: #f56c6c;
            cursor: pointer;
            flex-shrink: 0;

            &:hover {
              background-color: #fef0f0;
            }

            &:active {
              background-color: #f56c6c;
              color: #ffffff;
            }
          }
        }
      }

      .upload-btn {
        width: 100%;
        height: 36px;
        background-color: #ffffff;
        border: 1px dashed #dcdfe6;
        border-radius: 6px;
        color: #606266;
        font-size: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-sizing: border-box;

        &:hover {
          border-color: #409eff;
          color: #409eff;
        }

        &:active {
          background-color: #f5f7fa;
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

  .submit-section {
    margin-top: 40px;
    text-align: center;
    padding-bottom: 60px;

    .submit-btn {
      min-width: 180px;
      height: 44px;
      background-color: #409eff;
      color: #ffffff;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 500;
      cursor: pointer;
      transition: all 0.3s;

      &:hover {
        background-color: #66b1ff;
      }

      &:active {
        background-color: #3a8ee6;
      }

      &:disabled {
        background-color: #a0cfff;
        cursor: not-allowed;
      }
    }
  }

  /* 适配移动端 */
  @media screen and (max-width: 768px) {
    .homework-upload {
      padding: 15px;
    }

    .form-section {
      padding: 15px;
    }

    .submit-section {
      .submit-btn {
        width: 100%;
        min-width: unset;
      }
    }
  }


  /* 小程序特定样式 */
  /* #ifdef MP-WEIXIN */
  .upload-btn {
    &::after {
      border: none;
    }
  }

  .file-list {
    &::-webkit-scrollbar {
      display: none;
    }
  }

  .editor-content {
    &::-webkit-scrollbar {
      display: none;
    }
  }
  /* #endif */
}

.tox-tinymce {
  border-radius: 8px !important;
  border-color: #dcdfe6 !important;
}

.tox .tox-toolbar__group {
  padding: 0 5px !important;
}

.tox .tox-toolbar__primary {
  background-color: #f5f7fa !important;
  border-bottom: 1px solid #dcdfe6 !important;
}

/* 微信小程序编辑器样式 */
.weixin-editor {
  min-height: 300px;
  background-color: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 12px;
}


/* 编辑器相关样式修改 */
:deep(.tox-tinymce) {
  border-radius: 8px !important;
  border-color: #dcdfe6 !important;
  width: 100% !important; // 确保宽度100%

  @media screen and (max-width: 768px) {
    min-height: 200px !important; // 移动端适当减小高度
  }
}

:deep(.tox-editor-header) {
  @media screen and (max-width: 768px) {
    flex-wrap: wrap; // 工具栏自动换行

    .tox-toolbar__primary {
      padding: 4px !important;
    }

    .tox-toolbar__group {
      padding: 2px !important;

      button {
        padding: 4px !important; // 调整按钮间距
      }
    }
  }
}

/* 微信小程序编辑器样式优化 */
.weixin-editor {
  min-height: 200px;
  background-color: #ffffff;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  padding: 12px;
  width: 100%;
  box-sizing: border-box;

  @media screen and (max-width: 768px) {
    padding: 8px;
    font-size: 14px;
  }
}

/* 编辑器工具栏响应式处理 */
:deep(.tox-toolbar-overlord) {
  @media screen and (max-width: 768px) {
    position: sticky;
    top: 0;
    z-index: 1;
    background: #fff;
  }
}

.content-textarea {
  width: 100%;
  min-height: 120px;
  padding: 12px;
  box-sizing: border-box;
  border: 1px solid #dcdfe6;
  border-radius: 8px;
  font-size: 14px;
  line-height: 1.6;
  color: #606266;
  resize: vertical;
  background-color: #ffffff;

  &:hover {
    border-color: #c0c4cc;
  }

  &:focus {
    border-color: #409eff;
    outline: none;
  }

  @media screen and (max-width: 768px) {
    min-height: 100px;
  }
}

.word-count {
  display: block;
  text-align: right;
  margin-top: 4px;
  color: #909399;
  font-size: 12px;
}


@media screen and (max-width: 768px) {
  .form-section {
    padding: 12px !important;
  }

  .section-header {
    margin-bottom: 12px;

    .section-title {
      font-size: 16px;
    }
  }
}
</style>
