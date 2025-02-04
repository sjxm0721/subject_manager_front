<template>
    <view class="device-add">
      <view class="form-container">
        <!-- 表单标题 -->
        <view class="form-header">
          <text class="title">器材入库</text>
          <text class="desc">请填写器材相关信息</text>
        </view>

        <!-- 表单内容 -->
        <view class="form-content">
          <!-- 设备名称 -->
          <view class="form-item">
            <text class="label required">设备名称</text>
            <uni-easyinput
                v-model="formData.deviceName"
                placeholder="请输入设备名称"
                :clearable="true"
            />
          </view>

          <!-- 设备总数 -->
          <view class="form-item">
            <text class="label required">设备总数</text>
            <uni-easyinput
                v-model="formData.totalNum"
                type="number"
                placeholder="请输入设备总数"
            />
          </view>

          <!-- 设备描述 -->
          <view class="form-item">
            <text class="label">设备描述</text>
            <textarea
                v-model="formData.description"
                class="description-textarea"
                placeholder="请输入设备描述信息"
                maxlength="500"
            />
            <text class="word-count">{{ formData.description.length }}/500</text>
          </view>

          <!-- 设备图片 -->
          <view class="form-item">
            <text class="label">设备图片</text>
            <view class="image-upload">
              <view v-if="formData.pic" class="image-preview">
                <image :src="formData.pic" mode="aspectFit" @click="previewImage" />
                <text class="delete-icon" @click="handleDeleteImage">×</text>
              </view>
              <view v-else class="upload-button" @click="handleSelectImage">
                <uni-icons type="camera-filled" size="24" />
                <text>上传图片</text>
              </view>
            </view>
          </view>

          <!-- 说明文档 -->
          <view class="form-item">
            <text class="label">说明文档</text>
            <view class="file-upload">
              <view v-if="formData.helpB" class="file-preview">
                <text class="file-name">{{ getFileName(formData.helpB) }}</text>
                <text class="delete-icon" @click="handleDeleteFile">×</text>
              </view>
              <!-- H5环境 -->
              <!-- #ifdef H5 -->
              <button
                  v-else
                  class="upload-btn"
                  :disabled="uploading"
                  @click="handleSelectFile"
              >
                <uni-icons type="upload" size="16" />
                <text>上传说明文档</text>
              </button>
              <!-- #endif -->

              <!-- 小程序环境 -->
              <!-- #ifdef MP-WEIXIN -->
              <button
                  v-else
                  class="upload-btn"
                  :disabled="uploading"
                  @click="handleSelectFileMP"
              >
                <uni-icons type="upload" size="16" />
                <text>上传说明文档</text>
              </button>
              <!-- #endif -->
            </view>
            <text class="upload-tip">支持 PDF、Word 格式文件</text>
          </view>
        </view>

        <!-- 提交按钮 -->
        <view class="form-footer">
          <button
              class="submit-btn"
              :disabled="uploading || submitting"
              @click="handleSubmit"
          >
            {{ submitting ? '提交中...' : '提交' }}
          </button>
        </view>
      </view>
    </view>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { deviceApi } from '@/api/device'
import Layout from '@/components/layout/Layout.vue'
import { useUserStore } from '@/store/user'

// 类型定义
interface FormState {
  deviceName: string
  totalNum: string | number
  description: string
  pic: string
  helpB: string
}

// 状态定义
const userStore = useUserStore()
const uploading = ref(false)
const submitting = ref(false)

// 表单数据
const formData = reactive<FormState>({
  deviceName: '',
  totalNum: '',
  description: '',
  pic: '',
  helpB: ''
})

// 选择图片
const handleSelectImage = async () => {
  try {
    const res = await uni.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera']
    })

    if (res.tempFilePaths?.length) {
      await uploadFile('image', res.tempFilePaths[0])
    }
  } catch (error) {
    uni.showToast({
      title: error?.message || '选择图片失败',
      icon: 'none'
    })
  }
}

// 选择文件
// 选择文件和上传处理
// 选择文件和上传处理
const handleSelectFile = async () => {
  // #ifdef H5
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = '.pdf,.doc,.docx'
  input.style.display = 'none'

  input.onchange = async (e: Event) => {
    const target = e.target as HTMLInputElement
    if (target.files?.length) {
      const file = target.files[0]
      uploading.value = true
      try {
        // 使用 uni.uploadFile 而不是 uni.request
        const res = await uni.uploadFile({
          url: '/api/common/upload',
          name: 'file',
          header: {
            'token': userStore.token
          },
          // H5环境下直接传入 File 对象
          file: file
        })

        if (res.statusCode === 200) {
          const data = JSON.parse(res.data)
          if (data.code === 0) {
            formData.helpB = data.data
            uni.showToast({
              title: '上传成功',
              icon: 'success'
            })
          } else {
            throw new Error(data.message || '上传失败')
          }
        } else {
          throw new Error('上传失败')
        }
      } catch (error: any) {
        uni.showToast({
          title: error.message || '上传失败',
          icon: 'none'
        })
      } finally {
        uploading.value = false
      }
    }
    document.body.removeChild(input)
  }

  document.body.appendChild(input)
  input.click()
  // #endif

  // #ifdef MP-WEIXIN
  try {
    const res = await uni.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['.pdf', '.doc', '.docx']
    })

    if (res.tempFiles?.length) {
      await uploadFile('file', res.tempFiles[0].path)
    }
  } catch (error) {
    uni.showToast({
      title: error?.message || '选择文件失败',
      icon: 'none'
    })
  }
  // #endif
}


// 小程序选择文件
const handleSelectFileMP = async () => {
  // #ifdef MP-WEIXIN
  try {
    const res = await uni.chooseMessageFile({
      count: 1,
      type: 'file',
      extension: ['.pdf', '.doc', '.docx']
    })

    if (res.tempFiles?.length) {
      await uploadFile('file', res.tempFiles[0])
    }
  } catch (error) {
    uni.showToast({
      title: error?.message || '选择文件失败',
      icon: 'none'
    })
  }
  // #endif
}

// 上传文件
const uploadFile = async (type: 'image' | 'file', file: any) => {
  uploading.value = true
  try {
    const res = await uni.uploadFile({
      url: '/api/common/upload',
      name: 'file',
      header: {
        'token': userStore.token
      },
      // #ifdef H5
      file: type === 'file' ? file : undefined,
      // #endif
      filePath: type === 'image' || type === 'file' ? file : undefined,
    })

    if (res.statusCode === 200) {
      const data = JSON.parse(res.data)
      if (data.code === 0) {
        if (type === 'image') {
          formData.pic = data.data
        } else {
          formData.helpB = data.data
        }
        uni.showToast({
          title: '上传成功',
          icon: 'success'
        })
      } else {
        throw new Error(data.message || '上传失败')
      }
    } else {
      throw new Error('上传失败')
    }
  } catch (error: any) {
    uni.showToast({
      title: error.message || '上传失败',
      icon: 'none'
    })
  } finally {
    uploading.value = false
  }
}

// 删除图片
const handleDeleteImage = () => {
  formData.pic = ''
}

// 删除文件
const handleDeleteFile = () => {
  formData.helpB = ''
}

// 预览图片
const previewImage = () => {
  if (formData.pic) {
    uni.previewImage({
      urls: [formData.pic]
    })
  }
}

// 获取文件名
const getFileName = (url: string) => {
  const parts = url.split('/')
  return parts[parts.length - 1]
}

// 提交表单
const handleSubmit = async () => {
  if (!formData.deviceName || !formData.totalNum) {
    uni.showToast({
      title: '请填写必要信息',
      icon: 'none'
    })
    return
  }

  try {
    submitting.value = true
    const submitData = {
      ...formData,
      totalNum: Number(formData.totalNum)
    }


    await deviceApi.storeDevice(submitData)
    uni.showToast({
      title: '添加成功',
      icon: 'success'
    })

    // 返回上一页
    uni.redirectTo({
      url: `/pages/main/index?path=${encodeURIComponent('/pages/teacher/equipment/Inventory/index')}`
    })
  } catch (error: any) {
    uni.showToast({
      title: error.message || '提交失败',
      icon: 'none'
    })
  } finally {
    submitting.value = false
  }
}
</script>

<style lang="scss">
.device-add {
  min-height: 100vh;
  padding: 20px;
  background-color: #f5f7fa;

  .form-container {
    max-width: 800px;
    margin: 0 auto;
    background-color: #fff;
    border-radius: 12px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
    padding: 32px;

    @media screen and (max-width: 768px) {
      padding: 20px;
    }
  }

  .form-header {
    margin-bottom: 32px;
    padding-bottom: 16px;
    border-bottom: 1px solid #ebeef5;

    .title {
      font-size: 24px;
      font-weight: 600;
      color: #1a1a1a;
      display: block;
      margin-bottom: 8px;
    }

    .desc {
      font-size: 14px;
      color: #909399;
    }
  }

  .form-content {
    .form-item {
      margin-bottom: 24px;

      .label {
        display: block;
        margin-bottom: 8px;
        font-size: 14px;
        color: #606266;

        &.required::before {
          content: '*';
          color: #f56c6c;
          margin-right: 4px;
        }
      }

      .description-textarea {
        width: 90%;
        height: 120px;
        padding: 12px;
        border: 1px solid #dcdfe6;
        border-radius: 4px;
        font-size: 14px;
        line-height: 1.5;
        color: #606266;
        transition: border-color 0.2s;
        resize: vertical;

        &:focus {
          outline: none;
          border-color: #409eff;
        }
      }

      .word-count {
        display: block;
        text-align: right;
        margin-top: 4px;
        font-size: 12px;
        color: #909399;
      }

      .image-upload {
        .image-preview {
          position: relative;
          width: 200px;
          height: 150px;
          border-radius: 8px;
          overflow: hidden;

          image {
            width: 100%;
            height: 100%;
            object-fit: cover;
          }

          .delete-icon {
            position: absolute;
            top: 8px;
            right: 8px;
            width: 24px;
            height: 24px;
            background: rgba(0, 0, 0, 0.5);
            color: #fff;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            cursor: pointer;
            font-size: 18px;

            &:hover {
              background: rgba(0, 0, 0, 0.7);
            }
          }
        }

        .upload-button {
          width: 200px;
          height: 150px;
          border: 2px dashed #dcdfe6;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: all 0.3s;

          &:hover {
            border-color: #409eff;
            color: #409eff;
          }

          text {
            margin-top: 8px;
            font-size: 14px;
            color: #909399;
          }
        }
      }

      .file-upload {
        .file-preview {
          display: flex;
          align-items: center;
          padding: 12px;
          background: #f5f7fa;
          border-radius: 4px;

          .file-name {
            flex: 1;
            font-size: 14px;
            color: #606266;
            margin-right: 12px;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .delete-icon {
            color: #f56c6c;
            cursor: pointer;
            padding: 4px 8px;
            border-radius: 4px;
            transition: all 0.3s;

            &:hover {
              background: #fef0f0;
            }
          }
        }

        .upload-btn {
          width: 100%;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #fff;
          border: 1px dashed #dcdfe6;
          border-radius: 4px;
          color: #606266;
          transition: all 0.3s;

          &:hover {
            border-color: #409eff;
            color: #409eff;
          }

          &:disabled {
            background: #f5f7fa;
            border-color: #e4e7ed;
            color: #c0c4cc;
            cursor: not-allowed;
          }

          &::after {
            border: none;
          }
        }

        .upload-tip {
          margin-top: 4px;
          font-size: 12px;
          color: #909399;
        }
      }
    }
  }

  .form-footer {
    margin-top: 40px;
    text-align: center;

    .submit-btn {
      min-width: 120px;
      height: 40px;
      padding: 0 30px;
      font-size: 16px;
      background: #409eff;
      border-radius: 4px;
      color: #fff;
      border: none;
      transition: all 0.3s;

      &:hover {
        background: #66b1ff;
      }

      &:active {
        background: #3a8ee6;
      }

      &:disabled {
        background: #a0cfff;
        cursor: not-allowed;
      }

      &::after {
        border: none;
      }
    }
  }
}

// 暗黑模式适配
//@media (prefers-color-scheme: dark) {
//  .device-add {
//    background-color: #1a1a1a;
//
//    .form-container {
//      background-color: #262626;
//      box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
//    }
//
//    .form-header {
//      border-bottom-color: #363636;
//
//      .title {
//        color: #fff;
//      }
//
//      .desc {
//        color: #909399;
//      }
//    }
//
//    .form-content {
//      .form-item {
//        .label {
//          color: #e5eaf3;
//        }
//
//        .description-textarea {
//          background-color: #2b2b2b;
//          border-color: #4c4c4c;
//          color: #e5eaf3;
//
//          &:focus {
//            border-color: #409eff;
//          }
//        }
//
//        .image-upload {
//          .upload-button {
//            border-color: #4c4c4c;
//            background-color: #2b2b2b;
//
//            &:hover {
//              border-color: #409eff;
//            }
//          }
//        }
//
//        .file-upload {
//          .file-preview {
//            background: #2b2b2b;
//
//            .file-name {
//              color: #e5eaf3;
//            }
//          }
//
//          .upload-btn {
//            background: #2b2b2b;
//            border-color: #4c4c4c;
//            color: #e5eaf3;
//
//            &:hover {
//              border-color: #409eff;
//              color: #409eff;
//            }
//
//            &:disabled {
//              background: #363636;
//              border-color: #4c4c4c;
//              color: #686868;
//            }
//          }
//        }
//      }
//    }
//  }
//}

// 移动端适配补充
@media screen and (max-width: 768px) {
  .device-add {
    padding: 12px;

    .form-container {
      padding: 16px;
    }

    .form-header {
      margin-bottom: 24px;

      .title {
        font-size: 20px;
      }
    }

    .form-footer {
      .submit-btn {
        width: 100%;
        max-width: none;
      }
    }
  }
}
</style>
