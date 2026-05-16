<template>
  <!-- 全局顶部导航栏 -->
  <div class="global-header"
       :class="{ 'header-hidden': !isHeaderVisible }"
       v-if="shouldShowHeader">
    <el-container class="main-container">
      <el-header class="main-header">
        <!-- 修改部分：导航栏左侧添加图标 -->
        <div class="logo-container">
          <el-icon><Document /></el-icon>
          <span class="logo-text">Baiyimeng's Blog</span>
        </div>
        <el-menu mode="horizontal" :default-active="activeIndex">
          <el-menu-item index="1" @click="handleHomeClick">
            <el-icon><HomeFilled /></el-icon>
            主页
          </el-menu-item>
          <el-menu-item index="2" @click="handleBlogClick">
            <el-icon><Menu /></el-icon>
            文章
          </el-menu-item>
          <el-menu-item index="3" @click="handleJobClick">
            <el-icon><Star /></el-icon>
            求职（优化中）
          </el-menu-item>
          <el-menu-item index="4" @click="handleTalkClick">
            <el-icon><ChatLineRound /></el-icon>
            随笔
          </el-menu-item>
          <el-menu-item index="5" @click="handleLinkClick">
            <el-icon><Link /></el-icon>
            友链
          </el-menu-item>
          <el-menu-item index="6" @click="handleMessageClick">
            <el-icon><Message /></el-icon>
            留言
          </el-menu-item>
        </el-menu>
        <div
            v-if="userStore.role === 'admin'"
            class="admin-menu-item"
            @click="handleAdminClick"
        >
          <el-icon><User /></el-icon>
          <span>管理</span>
        </div>
        <div class="tabs">
          <span class="eye-protection-text">护眼👉</span>
          <div class="dark-mode-toggle" @click="toggleDark()">
            <el-icon v-if="isDark">
              <Sunny />
            </el-icon>
            <el-icon v-else>
              <Moon />
            </el-icon>
          </div>
          <div v-if="!userStore.isLoggedIn" class="header-login-btn" @click="handleLogin">
            登录
          </div>
          <div v-if="userStore.isLoggedIn" class="header-logout-btn" @click="handleLogout">
            退出登录
          </div>
        </div>
      </el-header>
    </el-container>
  </div>

  <router-view class="app-content"/>

  <MusicPlayer />
</template>


<script setup lang="ts">
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useDark, useToggle } from "@vueuse/core";
import { useRouter, useRoute } from "vue-router";
import {
  ChatLineRound,
  Document,
  HomeFilled,
  Message,
  Star,
  User,
  Menu,
  Link,
  Sunny, Moon
} from "@element-plus/icons-vue";
import { logout } from "@/net";
import { useUserStore } from '@/stores/user_store';
import { post } from '@/net';
import { ElMessage } from "element-plus";
import MusicPlayer from "@/views/components/music/MusicPlayer.vue";
import { WebSocketConfig } from '@/config/websocket.config';
const router = useRouter();
const userStore = useUserStore();

// 添加WebSocket相关变量
const websocket = ref(null);
const currentOnline = ref(0);

const route = useRoute(); // 添加 route
// 添加计算属性来判断是否应该显示导航栏
const shouldShowHeader = computed(() => {
  // 在登录页面不显示导航栏
  const hideHeaderRoutes = ['/login'];
  return !hideHeaderRoutes.includes(route.path);
});


// 添加响应式数据来跟踪当前激活的菜单索引
const activeIndex = ref('1');

// 监听路由变化来更新激活的菜单项
watch(() => route.name, (newRouteName) => {
  if (newRouteName === 'index') {
    activeIndex.value = '1';
  } else if (newRouteName === 'BlogList' || route.path.startsWith('/blog')) {
    activeIndex.value = '2';
  } else if (newRouteName === 'Talks' || route.path.startsWith('/talks')) {
    activeIndex.value = '4';
  }else if (newRouteName === 'Job' || route.path.startsWith('/job')) {
    activeIndex.value = '3';
  }else if (newRouteName === 'Links' || route.path.startsWith('/links')) {
    activeIndex.value = '5';
  }else if (newRouteName === 'MessageCloud' || route.path.startsWith('/message')) {
    activeIndex.value = '6';
  }
}, { immediate: true });

// 修改 handleHomeClick 方法
const handleHomeClick = () => {
  activeIndex.value = '1';
  router.push({ name: 'index' });
};

// 修改 handleBlogClick 方法
const handleBlogClick = () => {
  activeIndex.value = '2';
  router.push({ name: 'BlogList' }).then(() => {
    // 跳转后显示导航栏
    isHeaderVisible.value = true;
  });
};

// 添加留言页面跳转方法
const handleMessageClick = () => {
  activeIndex.value = '6';
  router.push('/message');
};

// 添加友链页面跳转方法
const handleLinkClick = () => {
  activeIndex.value = '5';
  router.push('/links');
};

// 添加求职页面跳转方法
const handleJobClick = () => {
  activeIndex.value = '3';
  router.push('/job');
};

// 添加说说页面跳转方法
const handleTalkClick = () => {
  activeIndex.value = '4';
  router.push('/talks');
};
// 添加暗黑模式相关逻辑
const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: 'light',
  initialValue: 'dark' // 设置默认值为暗黑模式
})

const toggleDark = useToggle(isDark)

// 添加管理页面跳转方法
const handleAdminClick = () => {
  router.push('/admin');
};

const handleLogin = () => {
  router.push('/login').catch(err => {
    console.error('登录跳转失败:', err.message)
  })
}

function handleLogout() {
  logout(() => router.push("/"))
}

// 检查用户角色权限
const checkUserRole = () => {
  // 只有当用户已登录且用户名存在时才调用接口
  if (userStore.isLoggedIn && userStore.username) {
    // 改为使用 post 方法，并将 username 作为请求体发送
    post(`/api/auth/verify-role`, { username: userStore.username }, (data: string) => {
      // 将获取到的权限信息存储到 userStore 中
      if (data) {
        userStore.setRole(data);
      } else {
        // 如果返回空数据，设置默认角色
        userStore.setRole('user');
      }
    }, (error) => {
      console.error('获取用户权限失败:', error);
      // 出错时设置默认角色
      userStore.setRole('user');
    });
  }
};

// 监听用户登录状态变化
watch(() => userStore.isLoggedIn, (newVal) => {
  if (newVal) {
    // 用户登录后检查角色
    checkUserRole();
  }
}, { immediate: true });

// Blue cursor trail effect
const trailDots: { x: number; y: number; el: HTMLElement }[] = [];
const MAX_TRAIL = 12;
let trailContainer: HTMLElement | null = null;

const setupCursorTrail = () => {
  trailContainer = document.createElement('div');
  trailContainer.id = 'cursor-trail-container';
  trailContainer.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:999999;';
  document.body.appendChild(trailContainer);
};

const onMouseMove = (e: MouseEvent) => {
  if (!trailContainer) return;
  const dot = document.createElement('div');
  dot.className = 'cursor-trail-dot';
  dot.style.cssText = `left:${e.clientX}px;top:${e.clientY}px;position:fixed;width:6px;height:6px;border-radius:50%;background:#4a9eff;pointer-events:none;transform:translate(-50%,-50%);transition:opacity 0.5s ease-out;opacity:0.8;`;
  trailContainer.appendChild(dot);
  trailDots.push({ x: e.clientX, y: e.clientY, el: dot });
  if (trailDots.length > MAX_TRAIL) {
    const old = trailDots.shift();
    if (old) {
      old.el.style.opacity = '0';
      setTimeout(() => old.el.remove(), 500);
    }
  }
};

// 添加响应式数据来控制导航栏的显示状态
const isHeaderVisible = ref(true);
const lastScrollTop = ref(0);
const headerHeight = ref(0);
const scrollThreshold = ref(0);

// 监听窗口滚动事件（用于除首页外的其他页面）
const handleWindowScroll = () => {
  const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

  // 只有滚动距离超过阈值才触发
  if (Math.abs(scrollTop - lastScrollTop.value) <= scrollThreshold.value) {
    lastScrollTop.value = scrollTop;
    return;
  }

  // 向下滚动且滚动距离大于导航栏高度时隐藏
  if (scrollTop > lastScrollTop.value && scrollTop > headerHeight.value) {
    isHeaderVisible.value = false;
  }
  // 向上滚动或滚动到顶部附近时显示
  else if (scrollTop < lastScrollTop.value || scrollTop < headerHeight.value) {
    isHeaderVisible.value = true;
  }

  lastScrollTop.value = scrollTop;
};

// 处理来自 IndexView 的导航栏显示/隐藏事件
const handleHeaderVisibilityChange = (event: CustomEvent) => {
  isHeaderVisible.value = event.detail;
};

// 建立WebSocket连接
const connectWebSocket = () => {
  // 使用配置类获取WebSocket路径
  const wsUrl = WebSocketConfig.getWebSocketUrl();
  console.log(wsUrl)

  try {
    websocket.value = new WebSocket(wsUrl);

    websocket.value.onopen = () => {
      ElMessage.success('WebSocket连接已建立')
      console.log('WebSocket连接已建立');
    };

    websocket.value.onmessage = (event) => {
      const onlineCount = parseInt(event.data);
      if (!isNaN(onlineCount)) {
        currentOnline.value = onlineCount;
        // 发送全局事件，通知其他组件更新在线人数
        window.dispatchEvent(new CustomEvent('onlineCountUpdate', { detail: onlineCount }));
      }
    };

    websocket.value.onclose = () => {
      ElMessage.error('WebSocket连接已关闭，请刷新当前页面。')
      console.log('WebSocket连接已关闭');
      // 使用配置类中的重连间隔
      setTimeout(connectWebSocket, WebSocketConfig.RECONNECT_INTERVAL);
    };

    websocket.value.onerror = (error) => {
      console.error('WebSocket发生错误:', error);
    };
  } catch (error) {
    console.error('WebSocket连接失败:', error);
  }
};

// 组件挂载时绑定事件
onMounted(() => {
  checkUserRole();
  // 监听窗口滚动事件（用于博客列表等页面）
  window.addEventListener('scroll', handleWindowScroll);
  // 监听来自 IndexView 的自定义事件
  window.addEventListener('headerVisibilityChange', handleHeaderVisibilityChange as EventListener);
  setupCursorTrail();
  window.addEventListener('mousemove', onMouseMove);

  // 建立WebSocket连接
  connectWebSocket();
});

// 组件卸载时移除事件
onUnmounted(() => {
  window.removeEventListener('scroll', handleWindowScroll);
  window.removeEventListener('headerVisibilityChange', handleHeaderVisibilityChange as EventListener);
  window.removeEventListener('mousemove', onMouseMove);

  // 关闭WebSocket连接
  if (websocket.value) {
    websocket.value.close();
  }
});

</script>



<style scoped>
.global-header {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  z-index: 1000;
  transition: transform 0.6s ease-in-out, background-color 0.6s ease-in-out;
}

/* 导航栏隐藏时的样式 */
.header-hidden {
  transform: translateY(-100%);
  background-color: #95a194 !important; /* 隐藏时的背景色 */
}

/* 为 app-content 添加滚动条样式 */
.app-content {
  transition: margin-top 0.6s ease-in-out;
  overflow-y: auto;
}

/* 当导航栏隐藏时减少内容区域的顶部边距 */
.header-hidden + .app-content {
  margin-top: 0;
}

.main-header {
  height: 55px;
  background-color: inherit !important; /* 继承 .global-header 的背景色 */
  border-bottom: none; /* 移除底部边框 */
  display: flex;
  align-items: center;
  z-index: 10; /* 确保导航栏在背景图之上 */
  position: relative;
}

.logo-container {
  display: flex;
  align-items: center;
  margin-right: 20px;
  color: white;
  font-size: 20px;
  font-weight: bold;
}

.logo-container .logo-text {
  margin-left: 10px;
}

.el-menu--horizontal {
  background-color: transparent !important; /* 使 el-menu 透明 */
  border-bottom: none !important; /* 移除底部边框（虚线） */
  display: flex;
  flex-grow: 1;
}

.el-menu--horizontal .el-menu-item {
  color: white;
  font-weight: bold;
  background-color: transparent !important; /* 使 el-menu-item 透明 */
}

.el-menu--horizontal .el-menu-item i {
  margin-right: 5px;
}

.tabs {
  height: 55px;
  gap: 10px;
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: right;
}

.tab-item {
  padding: 0 10px;
  cursor: default;
}

.eye-protection-text {
  color: #00851d;
  font-size: 15px;
  font-family: "Microsoft Yahei", sans-serif;
  font-weight: 500;
  letter-spacing: 1px;
  border-radius: 4px;
  padding: 0;
  margin: -10px;
}

/* 管理菜单项样式 */
.admin-menu-item {
  display: flex;
  align-items: center;
  padding: 0 20px;
  color: white;
  font-weight: bold;
  height: 100%;
  cursor: pointer;
  transition: color 0.3s;
  font-size: 15px;
}

.admin-menu-item:hover {
  color: #409eff; /* Element Plus 默认主题的深蓝色 */
}

.admin-menu-item i {
  margin-right: 5px;
}

/* 暗黑模式切换按钮样式 */
.dark-mode-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.1);
  cursor: pointer;
  transition: background-color 0.3s;
  margin-right: 10px;
}

.dark-mode-toggle:hover {
  background-color: rgba(0, 0, 0, 0.5);
}

.dark-mode-toggle .el-icon {
  font-size: 18px;
  color: white;
}

.header-login-btn, .header-logout-btn {
  color: white;
  font-weight: bold;
  font-size: 14px;
  cursor: pointer;
  padding: 6px 16px;
  border-radius: 6px;
  transition: all 0.3s ease;
  margin-right: 10px;
}

.header-login-btn:hover, .header-logout-btn:hover {
  background-color: rgba(255, 255, 255, 0.2);
}
html.dark .global-header {
  background-color: rgba(0, 0, 0, 0.5);
}

html.dark .main-header {
  background-color: rgba(0, 0, 0, 0.5);
}

html.dark .logo-text {
  color: #e0e0e0;
}

html.dark .el-menu--horizontal .el-menu-item {
  color: #e0e0e0;
}

html.dark .eye-protection-text {
  color: #4ade80;
}

html.dark .admin-menu-item {
  color: #e0e0e0;
}

html.dark .admin-menu-item:hover {
  color: #409eff;
}
</style>


<style>
/* Blue cursor with SVG */
body {
  cursor: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='%234a9eff' stroke='white' stroke-width='1' d='M5 3l14 8-6 3 3 7-3 1-3-7-5 3z'/></svg>") 0 0, auto;
}

a, button, input, textarea, select, [tabindex], [role="button"],
.el-button, .el-link, .el-menu--horizontal .el-menu-item,
.clickable-element {
  cursor: url("data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='%234a9eff' stroke='white' stroke-width='1' d='M5 3l14 8-6 3 3 7-3 1-3-7-5 3z'/></svg>") 5 0, pointer;
}

/* Cursor trail dot */
.cursor-trail-dot {
  animation: trailFade 0.5s ease-out forwards;
}

@keyframes trailFade {
  to { opacity: 0; transform: translate(-50%, -50%) scale(0.3); }
}

/* 全局滚动条样式 - 影响所有滚动条 */
::-webkit-scrollbar {
  width: 10px;
}

::-webkit-scrollbar-track {
  background-color: transparent;
  border-radius: 10px;
}

::-webkit-scrollbar-thumb {
  background-color: rgba(140, 174, 166, 0.3);
  border-radius: 10px;
}

::-webkit-scrollbar-thumb:hover {
  background-color: rgba(188, 169, 169, 0.6);
}

::-webkit-scrollbar-corner {
  background-color: transparent;
}
</style>
