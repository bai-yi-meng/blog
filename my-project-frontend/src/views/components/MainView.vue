<template>
  <div class="main-view">
    <el-row :gutter="20">
      <!-- 左侧内容 -->
      <el-col :xs="24" :sm="24" :md="16" :lg="16" :xl="16">
        <div class="left-content">
          <div
              v-for="(section, index) in leftSections"
              :key="index"
              class="section-container"
              :class="`${section.type}-section`"
              @click="openCardDialog(section)"
              style="cursor: pointer; height: 200px;"
          >
            <!-- 索引为 0, 2, 4 的卡片图片在左侧 -->
            <div v-if="index % 2 === 0 && section.image" class="card-content">
              <div class="content-wrapper left-image">
                <div class="image-container">
                  <img :src="section.image" :alt="section.title" class="card-image" />
                </div>
                <div class="text-container">
                  <h2>{{ section.title }}</h2>
                  <p>{{ section.description }}</p>
                  <!-- 添加博客标签 -->
                  <div v-if="section.type === 'blog' && section.tags" class="blog-tags">
                    <span
                        v-for="(tag, tagIndex) in section.tags"
                        :key="tagIndex"
                        class="feature-tag"
                        :style="{ backgroundColor: getTagColor(tag) }"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <!-- 索引为 1, 3, 5 的卡片图片在右侧 -->
            <div v-else-if="index % 2 !== 0 && section.image" class="card-content">
              <div class="content-wrapper right-image">
                <div class="text-container">
                  <h2>{{ section.title }}</h2>
                  <p>{{ section.description }}</p>
                  <!-- 添加博客标签 -->
                  <div v-if="section.type === 'blog' && section.tags" class="blog-tags">
                    <span
                        v-for="(tag, tagIndex) in section.tags"
                        :key="tagIndex"
                        class="feature-tag"
                        :style="{ backgroundColor: getTagColor(tag) }"
                    >
                      {{ tag }}
                    </span>
                  </div>
                </div>
                <div class="image-container">
                  <img :src="section.image" :alt="section.title" class="card-image" />
                </div>
              </div>
            </div>
            <!-- 不显示图片 -->
            <div v-else class="card-content no-image">
              <div class="text-container">
                <h2>{{ section.title }}</h2>
                <p>{{ section.description }}</p>
                <!-- 添加网站统计数据展示 -->
                <div v-if="section.type === 'data-stats' && section.stats" class="stats-container">
                  <div
                      v-for="(stat, statIndex) in section.stats"
                      :key="statIndex"
                      class="stat-item"
                      :class="{ 'runtime': statIndex === 0 }"
                  >
                    <div class="stat-value">{{ stat.value }}<span class="stat-unit">{{ stat.unit }}</span></div>
                    <div class="stat-label">{{ stat.label }}</div>
                  </div>
                </div>
                <!-- 添加博客标签 -->
                <div v-if="section.type === 'blog' && section.tags" class="blog-tags">
                  <span
                      v-for="(tag, tagIndex) in section.tags"
                      :key="tagIndex"
                      class="feature-tag"
                      :style="{ backgroundColor: getTagColor(tag) }"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </el-col>

      <!-- 右侧内容 -->
      <el-col :xs="24" :sm="24" :md="8" :lg="8" :xl="8">
        <div class="right-content">
          <div
              v-for="(section, index) in rightSections"
              :key="index"
              class="section-container"
              :class="`${section.type}-section`"
              @click="openCardDialog(section)"
              style="cursor: pointer;"
          >
            <!-- 特殊处理 Notification 卡片 -->
            <div v-if="section.type === 'notification' && section.title === 'Notification'" class="card-content no-image">
              <div class="notification-container">
                <h2 class="notification-title">{{ section.title }}</h2>
                <div class="notification-content">
                  <p class="notification-main">{{ section.description }}</p>
                  <div class="notification-details">
                    <p class="notification-sub">持续更新中，敬请期待更多功能</p>
                    <div class="notification-features">
                      <span class="feature-tag">Vue3</span>
                      <span class="feature-tag">Element Plus</span>
                      <span class="feature-tag">响应式</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 特殊处理 blog-stats 卡片 -->
            <div v-else-if="section.type === 'blog-stats'" class="card-content no-image">
              <div class="text-container">
                <h2>{{ section.title }}</h2>
                <p>{{ section.description }}</p>
                <div class="icons-container">
                  <div v-for="icon in section.icons" :key="icon.name" class="icon-item">
                    <div
                        class="icon-wrapper"
                        :class="{ 'disabled': icon.name !== 'github' }"
                        @click="handleIconClick(icon)"
                    >
                      <img :src="icon.url" :alt="icon.name" class="icon-image" />
                      <div v-if="icon.name !== 'github'" class="tooltip">暂无</div>
                      <div v-if="icon.name === 'github'" class="tooltip">开源地址</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- 特殊处理 zanshang 卡片 -->
            <div v-else-if="section.type === 'zanshang'" class="card-content no-image">
              <div class="text-container">
                <h2>{{ section.title }}</h2>
                <p>{{ section.description }}</p>
                <!-- 在 description 下方添加图片容器 -->
                <div class="charge-image-container">
                  <div class="charge-image-wrapper" @mouseover="handleChargeImageHover" @mouseout="handleChargeImageLeave">
                    <!-- 左侧装饰图标 -->
                    <span class="charge-text-left">support</span>
                    <img :src="currentChargeImage" alt="充电" class="charge-image">
                    <!-- 右侧装饰图标 -->
                    <span class="charge-text-right">thanks</span>
                  </div>
                </div>
              </div>
            </div>

            <!-- 其他帮助卡片 -->
            <div v-else class="card-content no-image">
              <div class="text-container">
                <h2>{{ section.title }}</h2>
                <p>{{ section.description }}</p>
              </div>
            </div>
          </div>
        </div>
      </el-col>
    </el-row>

    <!-- 弹窗组件 -->
    <el-dialog v-model="dialogVisible" width="800px">
      <component :is="currentComponent" />
    </el-dialog>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, markRaw } from 'vue';
import { useRouter } from 'vue-router'
import WebsiteTaskCard from "@/views/components/card/WebsiteTaskCard.vue";
import Notification from "@/views/components/card/Notification.vue";
import BlogListView from "@/views/components/card/BlogListView.vue";
import Acknowledgements from "@/views/components/card/Acknowledgements.vue";
import { get,post } from '@/net/index.js'
import {ElMessage} from "element-plus";
const router = useRouter()


const handleIconClick = (icon) => {
  if (icon.name === 'github') {
    window.open('https://github.com/Godplace-g7/', '_blank');
  }
}

// 获取标签颜色的方法
const getTagColor = (tag) => {
  const colors = [
    'rgb(255, 99, 132)',   // 红色
    'rgb(54, 162, 235)',   // 蓝色
    'rgb(255, 205, 86)',   // 黄色
    'rgb(75, 192, 192)',   // 青色
    'rgb(153, 102, 255)',  // 紫色
    'rgb(255, 159, 64)',   // 橙色
    'rgb(199, 199, 199)',  // 灰色
    'rgb(83, 109, 254)',   // 靛蓝
    'rgb(0, 188, 212)',    // 深青色
    'rgb(255, 193, 7)',    // 琥珀色
    'rgb(76, 175, 80)'     // 绿色
  ];

  // 根据标签名称生成哈希值，确保相同标签总是有相同颜色
  let hash = 0;
  for (let i = 0; i < tag.length; i++) {
    hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  }

  // 使用哈希值选择颜色
  const index = Math.abs(hash) % colors.length;
  return colors[index];
};

// 网站运行时间相关数据
const siteStats = ref({
  runtime: {
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  },
  totalVisits: 0,
  currentOnline: 0,
  totalArticles: 0,
  totalComments: 0,
  uptimePercent: 0
})

// 定时更新运行时间
let startTime = null;
let timer = null;
let dataUpdateTimer = null;
// 移除了websocket变量

// 计算运行时间
const calculateRuntime = (startTime) => {
  const now = new Date();
  const diff = now - startTime;

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((diff % (1000 * 60)) / 1000);

  siteStats.value.runtime = { days, hours, minutes, seconds };
}

// 开始计时器
const startTimer = (startTimeStr) => {
  startTime = new Date(startTimeStr);
  calculateRuntime(startTime);

  if (timer) clearInterval(timer);
  timer = setInterval(() => {
    calculateRuntime(startTime);
    // 实时更新运行时间显示
    leftSections.value[0].stats[0].value =
        `${siteStats.value.runtime.days}天${siteStats.value.runtime.hours}小时${siteStats.value.runtime.minutes}分钟${siteStats.value.runtime.seconds}秒`;
  }, 1000);
}

// 监听全局在线人数更新事件
const handleOnlineCountUpdate = (event) => {
  const onlineCount = event.detail;
  siteStats.value.currentOnline = onlineCount;
  leftSections.value[0].stats[2].value = onlineCount;
};

// 获取基础数据
const fetchBaseInfo = () => {
  // 调用后端API获取真实数据
  get('/base-info/get-info', (data) => {
    // 更新统计数据
    siteStats.value.totalVisits = data.totalVisits;
    siteStats.value.currentOnline = data.currentOnline;
    siteStats.value.totalArticles = data.totalArticles;

    // 计算运行时间（通过update_runtime减去start_runtime）
    if (data.startRuntime && data.updateRuntime) {
      startTimer(data.startRuntime);
    }

    // 更新显示数据
    leftSections.value[0].stats[1].value = data.totalVisits;
    leftSections.value[0].stats[2].value = data.currentOnline;
    leftSections.value[0].stats[3].value = data.totalArticles;
  });
}

// 定义左侧布局配置
const leftSections = ref([
  {
    type: 'data-stats',
    stats: [
      { label: '本站已运行时间', value: '0天0小时0分钟0秒', unit: '', realTime: true },
      { label: '总访问量', value: 0, unit: '次' },
      { label: '当前在线', value: 0, unit: '人' },
      { label: '文章总数', value: 0, unit: '篇' },
    ]
  },
  {
    title: '开发list',
    description: '网站开发任务详情，来提两句儿？',
    image: 'mainview/1.png', // 可以在这里添加图片路径
    type: 'task',
    component: markRaw(WebsiteTaskCard),
  },
  {
    title: '碎语闲言',
    description: '一点小分享',
    image: 'mainview/2.png',
    type: 'blog',
    tags: ['博客', '技术交流', '渗透', 'ctf'],
    component: markRaw(BlogListView), // 添加详情组件
  },
]);

// 定义右侧布局配置
const rightSections = ref([
  {
    title: '想要我联系方式不',
    description: 'nuo拿去吧 ',
    type: 'blog-stats',
    icons: [
      { name: '抖音', url: 'mainview/gitee.png' },
      { name: 'github', url: 'mainview/github.png' },
      { name: 'qq', url: 'mainview/qq.png' },
      { name: 'wechat', url: 'mainview/wechat.png' }
    ]
  },
  {
    title: 'Notification',
    description: '版本开发介绍',
    type: 'notification',
    component: markRaw(Notification),
  }
]);

// 弹窗相关
const dialogVisible = ref(false)
const currentComponent = ref(null)

// 点击卡片时打开弹窗

// 修改 openCardDialog 方法
const openCardDialog = (section) => {
  if (section.type === 'blog') {
    // 跳转到博客列表页，不再传递ID
    router.push('/blogs')
  } else if (section.component) {
    currentComponent.value = section.component
    dialogVisible.value = true
  }
}

onMounted(() => {
  // 页面加载时增加访问量
  post('/base-info/increment-visits', () => {
    // 增加访问量成功后再获取基础数据
    fetchBaseInfo();
  }, () => {
    // 即使增加访问量失败也要获取基础数据
    fetchBaseInfo();
  });

  // 监听全局在线人数更新事件
  window.addEventListener('onlineCountUpdate', handleOnlineCountUpdate);

  // 每分钟从服务器更新一次数据
  dataUpdateTimer = setInterval(() => {
    fetchBaseInfo();
  }, 60000);
})

onUnmounted(() => {
  if (timer) clearInterval(timer);
  if (dataUpdateTimer) clearInterval(dataUpdateTimer);
  // 移除了websocket的关闭代码
  // 移除全局事件监听
  window.removeEventListener('onlineCountUpdate', handleOnlineCountUpdate);
})
</script>

<style>/* 全局覆盖 el-dialog 的样式 */
.el-dialog {
  padding: 0; /* 清除默认内边距 */
  border-radius: 20px;
}

.el-dialog__body {
  padding: 0; /* 清除内容区域的内边距 */
  border-radius: 20px;
}
.el-dialog__header {
  padding: 0; /* 清除头部内边距 */
  border-radius: 20px;
}

</style>

<style scoped>
.charge-image-container {
  margin-top: 25px;
  text-align: center;
}

.charge-image-wrapper {
  display: inline-block;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.charge-image-wrapper:hover {
  transform: scale(1.05);
}

.charge-image {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}


.charge-text-left {
  font-size: 28px;
  color: #ffffff;
  position: absolute;
  left: -110px;
  top: 40%;
  transform: translateY(-50%);
  opacity: 0.8;
  transition: all 0.3s ease;
  font-family: 'KaiTi', '楷体', serif;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  letter-spacing: 2px;
  font-weight: bold;
  background: linear-gradient(45deg, #ffffff, #ffd700);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.charge-text-right {
  font-size: 28px;
  color: #ffffff;
  position: absolute;
  right: -95px;
  top: 43%;
  transform: translateY(-50%);
  opacity: 0.8;
  transition: all 0.3s ease;
  font-family: 'KaiTi', '楷体', serif;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
  letter-spacing: 2px;
  font-weight: bold;
  background: linear-gradient(45deg, #ffffff, #1abc9c);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.charge-image-wrapper:hover .charge-text-left,
.charge-image-wrapper:hover .charge-text-right {
  opacity: 1;
  transform: translateY(-50%) scale(1);
  text-shadow: 3px 3px 6px rgba(0, 0, 0, 0.7);
}
/* 暗黑模式下的装饰图标样式 */
html.dark .charge-icon-left,
html.dark .charge-icon-right {
  color: #e0e0e0;
}
.charge-image-container {
  margin-top: 25px;
  text-align: center;
}

.charge-image-wrapper {
  display: inline-block;
  position: relative;
  cursor: pointer;
  transition: transform 0.2s ease;
}

.charge-image-wrapper:hover {
  transform: scale(1.05);
}

.charge-image {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.global-tooltip-container {
  position: fixed; /* 使用fixed定位，脱离文档流 */
  background-color: rgba(255, 255, 255, 0.9);
  border: 1px solid #ddd;
  border-radius: 4px;
  z-index: 9999;
  display: flex;
  justify-content: center;
  align-items: center;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  pointer-events: none; /* 防止tooltip干扰鼠标事件 */
}

.tooltip-image {
  max-width: 200px;
  max-height: 200px;
}

.icon-wrapper {
  position: relative;
  display: inline-block;
  cursor: pointer; /* 添加鼠标指针 */
  transition: transform 0.2s ease; /* 添加过渡效果 */
}

.icon-wrapper:not(.disabled):hover {
  transform: scale(1.1); /* 非禁用状态悬停时放大 */
}

.icon-wrapper.disabled {
  opacity: 0.6;
  cursor: not-allowed; /* 禁用状态显示禁止符号 */
}

.icon-wrapper.disabled:hover {
  transform: none; /* 禁用状态不放大 */
}

.icon-wrapper {
  position: relative;
  display: inline-block;
}

.icon-wrapper.disabled {
  opacity: 0.6;
}

.tooltip {
  visibility: hidden;
  width: 60px;
  background-color: rgba(0, 0, 0, 0.8);
  color: #fff;
  text-align: center;
  border-radius: 4px;
  padding: 5px;
  position: absolute;
  z-index: 1;
  bottom: 125%;
  left: 50%;
  transform: translateX(-50%);
  font-size: 12px;
  white-space: nowrap;
}

.tooltip::after {
  content: "";
  position: absolute;
  top: 100%;
  left: 50%;
  margin-left: -5px;
  border-width: 5px;
  border-style: solid;
  border-color: rgba(0, 0, 0, 0.8) transparent transparent transparent;
}

.icon-wrapper:hover .tooltip {
  visibility: visible;
}
.icons-container {
  display: flex;
  justify-content: center; /* 居中显示 */
  gap: 20px;
  margin-top: 15px;
}

.icon-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.icon-image {
  width: 40px;
  height: 40px;
  border-radius: 50%; /* 圆形 */
  object-fit: cover; /* 保持比例填充 */
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2); /* 可选：添加阴影效果 */
}

.main-view {
  padding: 40px 250px 200px;
  display: flex;
  flex-direction: column;
}

.left-content, .right-content {
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.section-container {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 10px;
  padding: 0;
  margin-bottom: 20px;
  transition: transform 0.3s ease;
  height: 200px;
}

.section-container:hover {
  transform: translateY(-5px);
}

/* 调整右侧卡片高度 */
.right-content .section-container {
  height: auto;
  min-height: 180px;
}

/* Notification 特殊样式 */
.notification-container {
  width: 100%;
  padding: 20px;
}

.notification-title {
  font-size: 24px;
  margin: 0 0 15px 0;
  text-align: center;
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  padding-bottom: 10px;
}

.notification-main {
  font-size: 16px;
  margin: 10px 0;
  color: #f0f0f0;
  text-align: center;
  line-height: 1.5;
}

.notification-details {
  margin-top: 15px;
}

.notification-sub {
  font-size: 14px;
  color: #e0e0e0;
  margin: 8px 0;
  text-align: center;
}

.notification-features {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 15px;
  flex-wrap: wrap;
}

.feature-tag {
  background: rgb(57, 111, 234, 0.4);
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 12px;
  color: white;
}

/* 博客标签样式 */
.blog-tags {
  display: flex;
  justify-content: flex-start;
  gap: 10px;
  margin-top: 15px;
  flex-wrap: wrap;
}

.blog-tags .feature-tag {
  background: rgb(54, 162, 235); /* 默认颜色，将被动态颜色覆盖 */
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 12px;
  color: white;
  opacity: 0.9;
}

/* 右侧其他卡片样式 */
.right-content .text-container {
  display: flex;
  flex-direction: column;
  justify-content: center;
  text-align: center;
}

.right-content .text-container h2 {
  font-size: 22px;
  margin-bottom: 10px;
}

.right-content .text-container p {
  font-size: 16px;
}

/* 其他卡片样式保持不变 */
.blog-section h2,
.help-section h2 {
  font-size: 22px;
  font-weight: bold;
  margin-bottom: 10px;
}

.blog-section p,
.help-section p {
  font-size: 16px;
}

.card-content {
  display: flex;
  align-items: flex-start;
  height: 100%;
  width: 100%;
}

.content-wrapper {
  display: flex;
  width: 100%;
  gap: 15px;
  height: 100%;
}

.left-image, .right-image {
  width: 100%;
  height: 100%;
}

.image-container {
  flex-shrink: 0;
  height: 100%;
  overflow: hidden;
  border-radius: 8px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.card-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain;
}

.text-container {
  margin: 20px;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}

.text-container h2 {
  margin-top: 0;
  margin-bottom: 10px;
}

.text-container p {
  margin: 0;
}

/* 网站统计数据样式 */
.stats-container {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 15px;
  margin-top: -23px;
  position: relative;
}

.stats-container::before {
  content: "";
  position: absolute;
  top: -10px;
  left: 0;
  right: 0;
  height: 2px;
  background: linear-gradient(90deg, transparent, #409eff, transparent);
  animation: shine 3s infinite;
}

.stat-item {
  text-align: center;
  padding: 15px 10px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.stat-item::before {
  content: "";
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
  transition: 0.5s;
}

.stat-item:hover {
  transform: translateY(-5px);
  box-shadow: 0 8px 15px rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.15);
}

.stat-item:hover::before {
  left: 100%;
}

.stat-value {
  font-size: 20px;
  font-weight: bold;
  color: #409eff;
  min-height: 28px;
  text-shadow: 0 0 8px rgba(64, 158, 255, 0.4);
  animation: pulse 2s infinite;
}

.stat-unit {
  font-size: 14px;
  margin-left: 2px;
}

.stat-label {
  font-size: 12px;
  margin-top: 5px;
  opacity: 0.8;
}

/* 运行时间特殊样式 */
.stat-item.runtime {
  grid-column: span 3;
  background: rgba(64, 158, 255, 0.15);
  border: 1px solid rgba(64, 158, 255, 0.3);
}

.stat-item.runtime .stat-value {
  font-size: 24px;
}

.stat-item.runtime:hover {
  background: rgba(64, 158, 255, 0.25);
}

/* 卡片装饰性样式 */
.section-container {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 15px;
  padding: 0;
  margin-bottom: 20px;
  transition: all 0.4s ease;
  height: 200px;
  position: relative;
  overflow: hidden;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
}

.section-container::before {
  content: "";
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, rgba(255,255,255,0) 70%);
  transform: rotate(30deg);
  transition: all 0.6s ease;
}

.section-container:hover {
  transform: translateY(-8px) scale(1.02);
  box-shadow: 0 12px 30px rgba(0, 0, 0, 0.2);
}

.section-container:hover::before {
  transform: rotate(30deg) translate(20%, 20%);
}

/* 右侧卡片特殊样式 */
.right-content .section-container {
  height: auto;
  min-height: 180px;
  backdrop-filter: blur(10px);
}

/* Notification 特殊样式 */
.notification-container {
  width: 100%;
  padding: 20px;
}

.notification-title {
  font-size: 24px;
  margin: 0 0 15px 0;
  text-align: center;
  color: white;
  border-bottom: 1px solid rgba(255, 255, 255, 0.3);
  padding-bottom: 10px;
  position: relative;
}

.notification-title::after {
  content: "";
  position: absolute;
  bottom: -2px;
  left: 50%;
  transform: translateX(-50%);
  width: 50px;
  height: 3px;
  background: linear-gradient(90deg, transparent, #409eff, transparent);
  border-radius: 3px;
  animation: titleGlow 2s infinite alternate;
}

/* 博客标签动画样式 */
.blog-tags .feature-tag {
  background: rgb(54, 162, 235); /* 默认颜色，将被动态颜色覆盖 */
  padding: 4px 10px;
  border-radius: 15px;
  font-size: 12px;
  color: white;
  opacity: 0.9;
  transition: all 0.3s ease;
  transform: scale(1);
  display: inline-block;
}

.blog-tags .feature-tag:hover {
  transform: scale(1.1);
  opacity: 1;
  box-shadow: 0 0 8px rgba(255, 255, 255, 0.4);
}

/* 添加动画关键帧 */
@keyframes shine {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}

@keyframes pulse {
  0% {
    opacity: 1;
  }
  50% {
    opacity: 0.8;
  }
  100% {
    opacity: 1;
  }
}

@keyframes titleGlow {
  0% {
    box-shadow: 0 0 5px #409eff;
  }
  100% {
    box-shadow: 0 0 15px #409eff, 0 0 25px #409eff;
  }
}

/* 暗黑模式样式 */
html.dark .section-container {
  background-color: rgba(40, 40, 40, 0.5);
  color: #e0e0e0;
}

html.dark .notification-title {
  color: #e0e0e0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

html.dark .notification-main {
  color: #b0bec5;
}

html.dark .notification-sub {
  color: #90a4ae;
}

html.dark .feature-tag {
  background: rgba(57, 111, 234, 0.6);
}

html.dark .blog-tags .feature-tag {
  opacity: 1;
}

/* 图标容器暗黑模式支持 */
html.dark .icon-wrapper:not(.disabled):hover {
  filter: brightness(1.2);
}

html.dark .tooltip {
  background-color: rgba(255, 255, 255, 0.9);
  color: #000;
}

html.dark .tooltip::after {
  border-color: rgba(255, 255, 255, 0.9) transparent transparent transparent;
}

/* 暗黑模式下的统计数据样式 */
html.dark .stat-item {
  background: rgba(255, 255, 255, 0.05);
}

html.dark .stat-value {
  color: #64b5f6;
  text-shadow: 0 0 8px rgba(100, 181, 246, 0.4);
}

html.dark .stat-item.runtime {
  background: rgba(100, 181, 246, 0.15);
  border: 1px solid rgba(100, 181, 246, 0.3);
}

html.dark .stat-item.runtime:hover {
  background: rgba(100, 181, 246, 0.25);
}
</style>

