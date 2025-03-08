<template>
	<view class="homework-management">
		<!-- 顶部搜索和操作区 -->
		<view class="search-bar">
			<view class="search-inputs">
				<view class="input-item">
					<text class="label">年级</text>
					<input v-model="searchParams.grade" class="search-input" placeholder="请输入年级"
						@input="handleSearchInput" />
				</view>
				<view class="input-item">
					<text class="label">课程</text>
					<input v-model="searchParams.subjectName" class="search-input" placeholder="请输入课程"
						@input="handleSearchInput" />
				</view>
				<view class="input-item">
					<text class="label">题目</text>
					<input v-model="searchParams.title" class="search-input" placeholder="请输入题目"
						@input="handleSearchInput" />
				</view>
			</view>
			<view class="action-buttons">
				<button class="action-btn primary" @tap="handleExportHomework" :disabled="isExporting">
					{{ isExporting ? '导出中...' : '作业' }}
				</button>
				<button class="action-btn info" @tap="handleExportInfo">
					信息
				</button>
			</view>
		</view>

		<!-- PC端表格区域 -->
		<!-- #ifdef H5 -->
		<view class="table-container" v-if="!isMobile">
			<view class="table-header">
				<view class="th">年级</view>
				<view class="th">课程</view>
				<view class="th">组号</view>
				<view class="th">成员</view>
				<view class="th">题目</view>
				<view class="th">推荐</view>
				<view class="th">查重</view>
				<view class="th">更多</view>
				<view class="th">批改情况</view>
			</view>

			<view class="table-body">
				<view v-for="item in homeworkList" :key="item.id" class="table-row">
					<view class="td">{{ item.grade }}</view>
					<view class="td">{{ item.subjectName }}</view>
					<view class="td">{{ item.groupNum }}</view>
					<!-- PC端表格中的成员单元格 -->
					<view class="td member-td" :data-members="item.member.map(user => user.userName).join(', ')">
						{{ item.member.map(user => user.userName).join(', ') }}
					</view>
					<view class="td">{{ item.title }}</view>
					<view class="td">
						<switch :checked="item.commend === 1" @change="(e) => handleSuggestedChange(e, item.id)" />
					</view>
					<view class="td">
						<button class="check-btn" @tap="showDuplicateCheck(item)">
							查看
						</button>
					</view>
					<view class="td">
						<button class="more-btn" @tap="showDetails(item)">
							详情
						</button>
					</view>
					<view class="td correction-status">
						<template v-if="item.isCorrect === 0">
							<button class="correction-btn" @tap="showGradingModal(item)">
								批改
							</button>
						</template>
						<template v-else>
							<div class="score-info" @click="showGradingModal(item)"
								@mouseenter="showScoreTooltip($event, item)" @mouseleave="hideScoreTooltip">
								已批改
							</div>
						</template>
					</view>
				</view>
			</view>
		</view>
		<!-- #endif -->


		<!-- 移动端和小程序卡片展示区域 -->
		<!-- #ifdef MP-WEIXIN || H5 -->
		<view class="mobile-container" v-if="isMobile">
			<view class="homework-card" v-for="item in homeworkList" :key="item.id">
				<view class="card-header">
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
					<!-- 移动端卡片中的成员显示 -->
					<view class="info-row">
						<text class="label">成员：</text>
						<!-- #ifdef H5 -->
						<text class="value member-value" :data-members="item.member.map(m => m.userName).join(', ')">
							{{ item.member.map(m => m.userName).join(', ') }}
						</text>
						<!-- #endif -->

						<!-- #ifdef MP-WEIXIN -->
						<text class="value member-value" @tap="showMemberDetails(item)">
							{{ item.member.map(m => m.userName).join(', ') }}
						</text>
						<!-- #endif -->
					</view>
					<view class="info-row switch-row">
						<text class="label">推荐：</text>
						<switch :checked="item.commend === 1" @change="(e) => handleSuggestedChange(e, item.id)" />
					</view>
					<view class="info-row">
						<text class="label">批改情况：</text>
						<view class="value">
							<template v-if="item.isCorrect === 0">
								<button class="correction-btn" @tap="showGradingModal(item)">
									批改
								</button>
							</template>
							<template v-else>
								<text class="score-text" @tap="showGradingModal(item)">
									已批改(点击查看/修改)
								</text>
							</template>
						</view>
					</view>
					<view class="info-row">
						<text class="label">查重情况：</text>
						<button class="check-btn mobile" @tap="showDuplicateCheck(item)">
							查看
						</button>
					</view>
				</view>
				<view class="card-footer">
					<button class="detail-btn" @tap="showDetails(item)">
						查看详情
					</button>
				</view>
			</view>
		</view>
		<!-- #endif -->

		<!-- 分页器 -->
		<view class="pagination">
			<view class="page-info">
				共 {{ total }} 条
			</view>
			<view class="page-controls">
				<button class="page-btn" :disabled="searchParams.current === 1"
					@tap="handlePageChange(searchParams.current - 1)">
					上一页
				</button>
				<view class="page-number-wrapper">
					<input v-model="inputPage" class="page-number-input" type="number" @blur="handlePageInputChange"
						@keyup.enter="handlePageInputChange" />
					<text class="page-total">/ {{ totalPages }}</text>
				</view>
				<button class="page-btn" :disabled="searchParams.current === totalPages"
					@tap="handlePageChange(searchParams.current + 1)">
					下一页
				</button>
			</view>
		</view>

		<!-- 批改弹窗 -->
		<uni-popup ref="gradingPopup" type="center">
			<view class="grading-modal">
				<view class="modal-header">
					<text class="modal-title">作业批改</text>
					<text class="close-btn" @tap="hideGradingModal">×</text>
				</view>

				<view class="modal-content">
					<view class="homework-info">
						<text class="info-item">题目：{{currentGradingHomework?.title}}</text>
						<text class="info-item">组号：{{currentGradingHomework?.groupNum}}</text>
					</view>

					<view class="grading-form">
						<view v-for="student in currentGradingHomework?.member" :key="student.id"
							class="student-score-item">
							<text class="student-name">{{student.userName}}</text>
							<input type="number" class="score-input" v-model="gradingForm[student.id]"
								placeholder="请输入分数" @input="validateScore($event, student.id)" />
						</view>
					</view>
				</view>

				<view class="modal-footer">
					<button class="submit-btn" @tap="submitScores" :disabled="!isGradingFormValid">
						提交成绩
					</button>
				</view>
			</view>
		</uni-popup>

		<!-- 成绩悬浮提示 -->
		<view v-if="isScoreTooltipVisible" class="score-tooltip" :style="tooltipStyle">
			<view v-for="score in currentScores" :key="score.studentId" class="tooltip-item">
				<text class="student-name">{{getStudentName(score.studentId)}}</text>
				<text class="score-value">{{score.score}}分</text>
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

		<!-- 查重情况弹窗 -->
		<!-- 查重情况弹窗 -->
		<uni-popup ref="duplicatePopup" type="center" :mask-click="true">
		  <view class="duplicate-modal">
		    <view class="modal-header">
		      <text class="modal-title">查重情况</text>
		      <text class="close-btn" @tap="hideDuplicateCheck">×</text>
		    </view>
		    <scroll-view scroll-y class="duplicate-scroll">
		      <view class="duplicate-list">
		        <!-- 添加空状态显示 -->
		        <view v-if="duplicateList.length === 0" class="empty-state">
		          <text class="empty-text">查重记录为空</text>
		        </view>
		        <!-- 原有的查重列表 -->
		        <view v-else v-for="item in duplicateList" :key="item.id" class="duplicate-item">
		          <view class="similarity-header">
		            <text class="source-title">{{ item.targetName }}</text>
		            <text class="similarity-value">相似度: {{ (item.similarity*100).toFixed(2) }}%</text>
		          </view>
		          <view class="similarity-details">
		            <view class="detail-item">
		              <text class="label">简介相似度：</text>
		              <text class="value">{{ (item.briefValue*100).toFixed(2) }}%</text>
		            </view>
		            <view class="detail-item">
		              <text class="label">背景相似度：</text>
		              <text class="value">{{ (item.backgroundValue*100).toFixed(2) }}%</text>
		            </view>
		            <view class="detail-item">
		              <text class="label">系统设计相似度：</text>
		              <text class="value">{{ (item.systemDesignValue*100).toFixed(2) }}%</text>
		            </view>
		            <view class="detail-item">
		              <text class="label">文档相似度：</text>
		              <text class="value">{{ (item.wordValue*100).toFixed(2) }}%</text>
		            </view>
		            <view class="detail-item">
		              <text class="label">PDF相似度：</text>
		              <text class="value">{{ (item.pdfValue*100).toFixed(2) }}%</text>
		            </view>
		            <view class="detail-item">
		              <text class="label">源码相似度：</text>
		              <text class="value">{{ (item.sourceValue*100).toFixed(2) }}%</text>
		            </view>
		          </view>
		        </view>
		      </view>
		    </scroll-view>
		  </view>
		</uni-popup>
			</view>
</template>

<script setup lang="ts">
	import { ref, computed, reactive, onMounted } from 'vue'
	import { debounce } from 'lodash'
	import { homeworkApi } from '@/api/homework'
	import { gradeApi } from "@/api/grade";
	import { duplicateCheckApi } from "@/api/duplicateCheck";

	const isExporting = ref(false)

	// 类型定义
	interface DuplicateCheckVO {
		id : string
		sourceId : string
		targetId : string
		sourceName : string
		targetName : string
		similarity : number
		briefValue : number
		backgroundValue : number
		systemDesignValue : number
		wordValue : number
		pdfValue : number
		sourceValue : number
	}

	interface Grade {
		id : string
		homeworkId : string
		studentId : string
		score : number
	}

	interface UserInfo {
		id : number
		userAccount : string
		userName : string
		userRole : number
		userAvatar ?: string
		phone : string
		className : string
		createTime : Date
		updateTime : Date
		checkAble : number
		uploadAble : number
	}

	interface HomeworkVO {
		id : string
		subjectId : number
		grade : string
		subjectName : string
		groupNum : number
		title : string
		brief : string
		hardwareTech : string
		softwareTech : string
		commend : number
		background : string
		systemDesign : string
		attachmentWord ?: string
		attachmentPdf ?: string
		attachmentSource ?: string
		attachmentMp4 ?: string
		subjectType : number
		createTime : string
		member : UserInfo[]
		isCorrect : number
		scores ?: Grade[]
	}

	interface HomeworkQueryRequest {
		current : number
		size : number
		subjectName ?: string
		title ?: string
		grade ?: string
	}

	interface GradeSubmission {
		homeworkId : string
		grades : {
			studentId : string
			score : number
		}[]
	}

	// 响应式状态
	const duplicatePopup = ref<any>(null)
	const duplicateList = ref<DuplicateCheckVO[]>([])
	const isMobile = ref(false)
	const inputPage = ref('')
	const gradingPopup = ref<any>(null)
	const currentGradingHomework = ref<HomeworkVO | null>(null)
	const gradingForm = ref<Record<number, number>>({})
	const isScoreTooltipVisible = ref(false)
	const tooltipStyle = ref({
		top: '0px',
		left: '0px'
	})
	const currentScores = ref<Array<{ studentId : string, score : number, userName ?: string }>>([])

	const homeworkList = ref<HomeworkVO[]>([])
	const selectedRows = ref<string[]>([])
	const total = ref(0)
	const loading = ref(false)
	const currentDetail = ref<HomeworkVO | null>(null)
	const detailPopup = ref<any>(null)

	// 检查设备类型
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

	// 搜索参数
	const searchParams = reactive<HomeworkQueryRequest>({
		current: 1,
		size: 10,
		subjectName: '',
		title: ''
	})

	// 计算属性
	const totalPages = computed(() => Math.ceil(total.value / searchParams.size))
	const isAllSelected = computed(() =>
		homeworkList.value.length > 0 &&
		homeworkList.value.every(item => selectedRows.value.includes(item.id))
	)

	const isGradingFormValid = computed(() => {
		if (!currentGradingHomework.value) return false

		return currentGradingHomework.value.member.every(student =>
			typeof gradingForm.value[student.id] === 'number' &&
			gradingForm.value[student.id] >= 0 &&
			gradingForm.value[student.id] <= 100
		)
	})

	// 搜索相关方法
	const debouncedSearch = debounce(async () => {
		searchParams.current = 1
		await fetchHomeworkList()
	}, 300)

	const showDuplicateCheck = async (homework : HomeworkVO) => {
		try {
			const res = await duplicateCheckApi.getHomeworkDuplicateCheckList(homework.id)
			duplicateList.value = res
			duplicatePopup.value?.open()
		} catch (error) {
			uni.showToast({
				title: error?.message || '获取查重情况失败',
				icon: 'none'
			})
		}
	}

	const hideDuplicateCheck = () => {
		duplicatePopup.value?.close()
		duplicateList.value = []
	}

	const handleSearchInput = () => {
		debouncedSearch()
	}

	// 数据加载方法
	const fetchHomeworkList = async () => {
		try {
			loading.value = true
			const res = await homeworkApi.getHomeworkPage(searchParams)
			homeworkList.value = res.records
			total.value = res.total
		} catch (error) {
			uni.showToast({
				title: error?.message || '获取列表失败',
				icon: 'none'
			})
		} finally {
			loading.value = false
		}
	}


	// 推荐状态更新
	const handleSuggestedChange = async (e : any, id : string) => {
		try {
			await homeworkApi.updateHomeworkSuggested({
				id,
				suggested: e.detail.value ? 1 : 0
			})
			const index = homeworkList.value.findIndex(item => item.id === id)
			if (index > -1) {
				homeworkList.value[index].commend = e.detail.value ? 1 : 0
			}
		} catch (error) {
			uni.showToast({
				title: error?.message || '更新失败',
				icon: 'none'
			})
		}
	}

	// 批改相关方法
	const showGradingModal = (homework : HomeworkVO) => {
		currentGradingHomework.value = homework
		gradingForm.value = {}

		if (homework.scores && homework.scores.length > 0) {
			homework.scores.forEach(score => {
				gradingForm.value[score.studentId] = score.score
			})
		}

		gradingPopup.value?.open()
	}

	const hideGradingModal = () => {
		gradingPopup.value?.close()
		currentGradingHomework.value = null
		gradingForm.value = {}
	}

	const validateScore = (e : any, studentId : number) => {
		const value = Number(e.detail.value)
		if (value < 0) {
			gradingForm.value[studentId] = 0
		} else if (value > 100) {
			gradingForm.value[studentId] = 100
		} else {
			gradingForm.value[studentId] = value
		}
	}

	const submitScores = async () => {
		if (!currentGradingHomework.value || !isGradingFormValid.value) return

		try {
			const grades = Object.entries(gradingForm.value).map(([studentId, score]) => ({
				studentId: studentId.toString(),
				score
			}))

			await gradeApi.submitGrades({
				homeworkId: currentGradingHomework.value.id,
				scores: grades
			})

			// 更新本地数据
			const index = homeworkList.value.findIndex(h => h.id === currentGradingHomework.value?.id)
			if (index > -1) {
				homeworkList.value[index].isCorrect = 1
				homeworkList.value[index].scores = grades.map(grade => ({
					id: `${currentGradingHomework.value!.id}_${grade.studentId}`,
					homeworkId: currentGradingHomework.value!.id,
					...grade
				}))
			}

			uni.showToast({
				title: '提交成功',
				icon: 'success'
			})

			hideGradingModal()
		} catch (error) {
			uni.showToast({
				title: error?.message || '提交失败',
				icon: 'none'
			})
		}
	}

	// 成绩提示相关方法
	const showScoreTooltip = (e : any, homework : HomeworkVO) => {
		if (!homework.scores) return

		currentScores.value = homework.scores.map(score => ({
			...score,
			userName: homework.member.find(m => m.id.toString() === score.studentId)?.userName
		}))

		// 计算提示框位置
		const rect = e.target.getBoundingClientRect()
		tooltipStyle.value = {
			top: `${rect.bottom + 5}px`,
			left: `${rect.left}px`
		}

		isScoreTooltipVisible.value = true
	}

	const hideScoreTooltip = () => {
		isScoreTooltipVisible.value = false
	}

	const getStudentName = (studentId : string) => {
		const student = currentGradingHomework.value?.member.find(m => m.id.toString() === studentId)
		return student?.userName || ''
	}

	// 分页相关方法
	const handlePageInputChange = () => {
		const page = parseInt(inputPage.value)
		if (page && page > 0 && page <= totalPages.value) {
			handlePageChange(page)
		} else {
			inputPage.value = searchParams.current.toString()
		}
	}

  const handlePageChange = async (page: number) => {
    if (page < 1 || page > totalPages.value || loading.value) return
    if (page === searchParams.current) return  // 添加此行，避免重复加载相同页码
    loading.value = true
    try {
      searchParams.current = page
      inputPage.value = page.toString()
      await fetchHomeworkList()
    } finally {
      loading.value = false
    }
  }


	// 详情相关方法
	const showDetails = (item : HomeworkVO) => {
		currentDetail.value = item
		detailPopup.value?.open()
	}

	const hideDetails = () => {
		detailPopup.value?.close()
		currentDetail.value = null
	}

	// 导出相关方法
	const handleExportHomework = async () => {
		try {
			isExporting.value = true // 开始导出，显示 loading
			uni.showLoading({
				title: '正在导出作业...',
				mask: true // 添加遮罩，防止重复点击
			})

			const params = {
				grade: searchParams.grade || '',
				title: searchParams.subjectName || '',  // 使用课程名作为title
				homeworkTitle: searchParams.title || ''
			}

			await homeworkApi.exportZip(params)
			// 导出成功提示
			uni.showToast({
				title: '导出成功',
				icon: 'success',
				duration: 2000
			})

		} catch (error) {
			uni.showToast({
				title: error?.message || '导出失败',
				icon: 'none',
				duration: 2000
			})
		} finally {
			isExporting.value = false // 结束导出，隐藏 loading
			uni.hideLoading()
		}
	}

	// 添加显示成员详情的方法
	const showMemberDetails = (item : HomeworkVO) => {
		// 小程序弹窗显示完整成员列表
		uni.showModal({
			title: '成员列表',
			content: item.member.map(m => m.userName).join(', '),
			showCancel: false
		})
	}

	const handleExportInfo = async () => {
		try {
			const params = {
				grade: searchParams.grade || '',
				title: searchParams.subjectName || '',
				homeworkTitle: searchParams.title || ''
			}
			await homeworkApi.exportInfo(params)
		} catch (error) {
			uni.showToast({
				title: error?.message || '导出失败',
				icon: 'none'
			})
		}
	}

	// 生命周期钩子
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

		// 搜索栏样式
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
			box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

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
						white-space: nowrap;
					}

					.search-input {
						width: 200px;
						height: 36px;
						padding: 0 12px;
						border: 1px solid #dcdfe6;
						border-radius: 4px;
						font-size: 14px;

						&:focus {
							border-color: #409eff;
							outline: none;
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
					border: none;
					cursor: pointer;

					&.primary {
						background-color: #409eff;
						color: #fff;

						&:hover {
							background-color: #66b1ff;
						}

						&:active {
							background-color: #3a8ee6;
						}
					}

					&.info {
						background-color: #909399;
						color: #fff;

						&:hover {
							background-color: #a6a9ad;
						}

						&:active {
							background-color: #82848a;
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
				grid-template-columns: 60px 120px 80px 200px minmax(100px, 1fr) 80px 80px 80px 80px;
				background-color: #f5f7fa;
				border-bottom: 1px solid #ebeef5;

				.th {
					padding: 12px 8px;
					font-size: 14px;
					font-weight: 500;
					color: #606266;
					text-align: center;
				}
			}

			.table-body {
				max-height: calc(100vh - 280px);
        overflow-y: auto;

        &::-webkit-scrollbar {
          width: 6px;
        }

        &::-webkit-scrollbar-thumb {
          background-color: #dcdfe6;
          border-radius: 3px;
        }

        &::-webkit-scrollbar-track {
          background-color: #f5f7fa;
        }

				.table-row {
					display: grid;
					grid-template-columns: 60px 120px 80px 200px minmax(100px, 1fr) 80px 80px 80px 80px;
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

						&.member-td {
							overflow: hidden;
							text-overflow: ellipsis;
							white-space: nowrap;
							position: relative;

							&:hover::after {
								content: attr(data-members);
								position: absolute;
								bottom: 100%;
								left: 0;
								background: #fff;
								padding: 8px;
								border-radius: 4px;
								box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
								z-index: 1;
								white-space: normal;
								min-width: 200px;
								max-width: 300px;
								word-break: break-all;
							}
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
							border: none;
							cursor: pointer;

							&:hover {
								background-color: #66b1ff;
							}

							&:active {
								background-color: #3a8ee6;
							}
						}

						.check-btn {
							min-width: 60px;
							height: 28px;
							line-height: 28px;
							padding: 0 12px;
							background-color: #67c23a;
							color: #fff;
							border-radius: 4px;
							font-size: 12px;
							border: none;
							cursor: pointer;

							&:hover {
								background-color: #85ce61;
							}

							&:active {
								background-color: #5daf34;
							}
						}
					}
				}
			}
		}

		// 移动端卡片样式
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
						align-items: center !important;

						.label {
							min-width: 70px;
							color: #909399;
							font-size: 14px;
							flex-shrink: 0;
						}

						.value {
							display: flex;
							justify-content: flex-end;
							flex: 1;
							font-size: 14px;
							color: #606266;
							line-height: 1.4;

							&.member-value {
								overflow: hidden;
								text-overflow: ellipsis;
								white-space: nowrap;
								position: relative;

								// #ifdef H5
								&:hover::after {
									content: attr(data-members);
									position: absolute;
									top: 100%;
									left: 0;
									background: #fff;
									padding: 8px;
									border-radius: 4px;
									box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
									z-index: 1;
									white-space: normal;
									width: calc(100vw - 48px);
									max-width: 300px;
									word-break: break-all;
								}

								// #endif
							}
						}

						&.switch-row {
							align-items: center;
							justify-content: space-between;
						}

						.correction-btn,
						.check-btn.mobile {
							width: auto;
							min-width: 64px;
							height: 32px;
							padding: 0 16px;
							background-color: #67c23a;
							color: #fff;
							border-radius: 4px;
							font-size: 14px;
							border: none;
							margin-right: 0;
							line-height: 32px;

							&:active {
								opacity: 0.8;
							}
						}

						.score-text {
							color: #409eff;
							text-decoration: underline;
							margin-left: auto;
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

		// 分页器样式
		.pagination {
			display: flex;
			justify-content: space-between;
			align-items: center;
			background-color: #fff;
			border-radius: 8px;
			padding: 16px;
			margin-top: 20px;
			box-shadow: 0 2px 12px rgba(0, 0, 0, 0.04);

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
					cursor: pointer;

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

		// 弹窗基础样式
		.modal-header {
			display: flex;
			justify-content: space-between;
			align-items: center;
			padding: 16px 20px;
			border-bottom: 1px solid #ebeef5;
			background-color: #fff;

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
			background-color: #fff;
		}

		// 详情模态框样式
		.detail-modal {
			width: 80%;
			max-width: 600px;
			background-color: #fff;
			border-radius: 8px;
			overflow: hidden;
			box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
			display: flex;
			flex-direction: column;
			max-height: 80vh;

			.modal-content {
				flex: 1;
				overflow-y: auto;
				padding: 20px;
				box-sizing: border-box;
			}

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
					word-wrap: break-word;
					word-break: break-all;
					overflow-wrap: break-word;
				}
			}
		}

		// 查重情况弹窗样式
		.duplicate-modal {
			width: 90%;
			max-width: 600px;
			background-color: #fff;
			border-radius: 8px;
			box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
			position: relative;
			height: 80vh;
			display: flex;
			flex-direction: column;

			.modal-header {
				position: sticky;
				top: 0;
				z-index: 1;
				display: flex;
				justify-content: space-between;
				align-items: center;
				padding: 16px 20px;
				border-bottom: 1px solid #ebeef5;
				background-color: #fff;
				border-radius: 8px 8px 0 0;
				flex-shrink: 0;

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

			.duplicate-scroll {
				flex: 1;
				height: calc(100% - 53px); // header高度
				overflow-y: auto;
				padding: 0;
			}

			.duplicate-list {
				box-sizing: border-box;
				padding: 20px;

				      .empty-state {
				        display: flex;
				        justify-content: center;
				        align-items: center;
				        min-height: 200px;
				        background-color: #f8f9fa;
				        border-radius: 8px;

				        .empty-text {
				          font-size: 16px;
				          color: #909399;
				          text-align: center;
				        }
				      }

				.duplicate-item {
					background-color: #f8f9fa;
					border-radius: 8px;
					padding: 16px;
					margin-bottom: 16px;

					&:last-child {
						margin-bottom: 0;
					}

					.similarity-header {
						display: flex;
						justify-content: space-between;
						align-items: center;
						margin-bottom: 12px;
						padding-bottom: 8px;
						border-bottom: 1px solid #e4e7ed;

						.source-title {
							font-size: 16px;
							font-weight: 500;
							color: #303133;
							word-break: break-all;
							padding-right: 12px;
							flex: 1;
						}

						.similarity-value {
							font-size: 16px;
							font-weight: 500;
							color: #f56c6c;
							white-space: nowrap;
						}
					}

					.similarity-details {
						display: grid;
						grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
						gap: 12px;

						.detail-item {
							display: flex;
							align-items: center;
							justify-content: space-between;

							.label {
								font-size: 14px;
								color: #606266;
								margin-right: 8px;
							}

							.value {
								font-size: 14px;
								color: #f56c6c;
								white-space: nowrap;
							}
						}
					}
				}
			}
		}

		// 批改弹窗样式
		.grading-modal {
			width: 90%;
			max-width: 500px;
			background-color: #fff;
			border-radius: 8px;
			overflow: hidden;
			box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
			display: flex;
			flex-direction: column;
			max-height: 80vh; // 设置最大高度

			.modal-header {
				flex-shrink: 0; // 防止头部被压缩
			}

			.modal-content {
				flex: 1;
				overflow: hidden;
				display: flex;
				flex-direction: column;
				padding: 20px;
			}


			.homework-info {
				margin-bottom: 20px;
				padding-bottom: 16px;
				border-bottom: 1px solid #ebeef5;
				flex-shrink: 0; // 防止信息部分被压缩

				.info-item {
					display: block;
					font-size: 14px;
					color: #606266;
					margin-bottom: 8px;
				}
			}

			.grading-form {

				flex: 1;
				overflow-y: auto; // 添加垂直滚动
				padding-right: 8px; // 为滚动条预留空间

				// 自定义滚动条样式
				&::-webkit-scrollbar {
					width: 6px;
				}

				&::-webkit-scrollbar-thumb {
					background-color: #dcdfe6;
					border-radius: 3px;
				}

				&::-webkit-scrollbar-track {
					background-color: #f5f7fa;
				}

				.student-score-item {
					display: flex;
					align-items: center;
					margin-bottom: 16px;
					padding: 12px;
					background-color: #f7f8fa;
					border-radius: 4px;

					&:last-child {
						margin-bottom: 0;
					}

					.student-name {
						width: 80px;
						font-size: 14px;
						color: #606266;
						font-weight: 500;
						flex-shrink: 0; // 防止名字被压缩
					}

					.score-input {
						flex: 1;
						max-width: 120px; // 限制输入框最大宽度
						height: 36px;
						padding: 0 12px;
						border: 1px solid #dcdfe6;
						border-radius: 4px;
						font-size: 14px;
						background-color: #fff;
						margin-left: 12px; // 增加与名字的间距

						&:focus {
							border-color: #409eff;
							outline: none;
						}
					}
				}
			}

			.modal-footer {
				flex-shrink: 0; // 防止底部被压缩
				background-color: #fff;
				padding: 16px 20px;
				text-align: right;
				border-top: 1px solid #ebeef5;

				.submit-btn {
					min-width: 80px;
					height: 36px;
					line-height: 36px;
					padding: 0 20px;
					background-color: #409eff;
					color: #fff;
					border-radius: 4px;
					font-size: 14px;
					border: none;
					cursor: pointer;

					&:hover:not(:disabled) {
						background-color: #66b1ff;
					}

					&:active:not(:disabled) {
						background-color: #3a8ee6;
					}

					&:disabled {
						opacity: 0.7;
						cursor: not-allowed;
					}
				}
			}
		}

		// 成绩悬浮提示样式
		.score-tooltip {
			position: fixed;
			background: #fff;
			border-radius: 4px;
			padding: 12px;
			box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
			z-index: 9999;

			.tooltip-item {
				display: flex;
				justify-content: space-between;
				gap: 16px;
				margin-bottom: 8px;

				&:last-child {
					margin-bottom: 0;
				}

				.student-name {
					font-size: 14px;
					color: #606266;
				}

				.score-value {
					font-size: 14px;
					color: #409eff;
					font-weight: 500;
				}
			}
		}
	}


	@media screen and (max-width: 768px) {
		.grading-modal {
			width: 95%;
			margin: 10px;
			max-height: 85vh;

			.modal-content {
				padding: 16px;
			}

			.grading-form {
				.student-score-item {
					padding: 10px;

					.student-name {
						width: auto;
						min-width: 70px;
					}

					.score-input {
						max-width: 100px; // 移动端下减小输入框宽度
						margin-left: 8px; // 减小间距
					}
				}
			}

			.modal-footer {
				padding: 12px 16px;
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

			.pagination {
				flex-direction: column;
				gap: 12px;

				.page-controls {
					width: 100%;
					justify-content: center;
				}
			}

			.duplicate-modal {
				width: 95%;
				margin: 10px;
				height: 70vh;

				.duplicate-list {
					padding: 16px;
				}

				.duplicate-item {
					padding: 12px;

					.similarity-header {
						.source-title {
							font-size: 14px;
						}

						.similarity-value {
							font-size: 14px;
						}
					}

					.similarity-details {
						grid-template-columns: 1fr !important;
					}
				}
			}

			.detail-modal,
			.grading-modal {
				width: 95%;
				margin: 10px;

				.modal-content {
					padding: 16px;
				}

				.student-score-item {
					flex-direction: column;
					align-items: stretch;
					gap: 8px;

					.student-name {
						width: 100%;
					}

					.score-input {
						width: 100%;
					}
				}
			}
		}
	}

	/* 小程序特定样式 */
	/* #ifdef MP-WEIXIN */
	.homework-management {
		.action-buttons {
			.action-btn {
				&::after {
					border: none;
				}
			}
		}

		.check-btn {
			&::after {
				border: none;
			}
		}

		.detail-modal,
		.grading-modal {

			.submit-btn,
			.detail-btn {
				&::after {
					border: none;
				}
			}
		}
	}

	/* #endif */

	.action-btn {
		&.primary {
			&:disabled {
				background-color: #a0cfff;
				cursor: not-allowed;

				&:hover {
					background-color: #a0cfff;
				}
			}
		}
	}
</style>
