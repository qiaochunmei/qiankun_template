## 项目实战

### 项目启动

1. 先启动主应用项目
2. 启动各个子应用项目


> 适合刚接触`qiankun`的新人，介绍了如何从0构建一个`qiankun`项目。项目主要有以下构成：

- **主应用：**
  - 使用umi3.5，未使用 [@umijs/plugin-qiankun](https://github.com/umijs/plugins/tree/master/packages/plugin-qiankun)，而是直接使用的 [qiankun](https://qiankun.umijs.org/zh/guide/getting-started)

- **vue 微应用：**
  - 使用 vue2.x 创建
  - 使用 vue3.x，暂未使用 vite 构建，目测 vite 不兼容
  
- **react 微应用：**
  - 使用 create-react-app 创建

## 主应用环境搭建

> 主应用按照官方的说法，不限技术栈，只需要提供一个容器 DOM，然后注册微应用并 start 即可。这里我们使用 umi 来初始化。

### 初始化 & 安装 qiankun

```bash
  # 项目初始化
  $ yarn create @umijs/umi-app
  # 安装依赖
  $ yarn
  # 启动
  $ yarn start
  # 安装 qiankun
  $ yarn add qiankun
```

> 基本环境搭建完成，在主应用中增加一些菜单和路由，用于主应用页面以及主应用和微应用之间切换操作。页面布局和路由配置这里不做过多介绍，文末会奉上源码。大致页面如下图：

![在这里插入图片描述](https://img-blog.csdnimg.cn/img_convert/b1046fd2e50da81f8dd626c98ffbfc72.png#pic_center)

### 主应用中注册微应用

> 注册微应用的基础配置信息。当浏览器 url 发生变化时，会自动检查每一个微应用注册的 activeRule 规则，符合规则的应用将会被自动激活。本示列分别有一个主应用三个微应用构成，在主应用中增加微应用的配置文件，对注册微应用做单独的管理。

### 注册微应用基本配置

> 主应用 src 文件下增加 `registerMicroAppsConfig.ts`，内容如下：

```javascript
const loader = (loading: boolean) => {
  // 此处可以获取微应用是否加载成功,可以用来触发全局的 loading
  console.log("loading", loading);
};

export const Microconfig = [
  //name: 微应用的名称,
  //entry: 微应用的入口,
  //container: 微应用的容器节点的选择器或者 Element 实例,
  //activeRule: 激活微应用的规则(可以匹配到微应用的路由),
  //loader: 加载微应用的状态 true | false
  {
    name: "vue2",
    entry: "http://localhost:8001", // 具体和服务启动的端口号对应上
    container: "#subContainer",
    activeRule: "/vue2",
    loader,
  },
  {
    name: "vue3",
    entry: "http://localhost:8002",
    container: "#subContainer",
    activeRule: "/vue3",
    loader,
  },
  {
    name: "react",
    entry: "http://localhost:8003",
    container: "#subContainer",
    activeRule: "/react",
    loader,
  },
];
```

> 主应用入口文件引入（主应用使用的 umi,所以直接在 pages/index.tsx 引入）

```javascript
import LayoutPage from "@/layout/index";
import {
  registerMicroApps,
  start,
  addGlobalUncaughtErrorHandler,
} from "qiankun";
import { Microconfig } from "@/registerMicroAppsConfig";

// 注册微应用
registerMicroApps(Microconfig, {
  // qiankun 生命周期钩子 - 微应用加载前
  beforeLoad: (app: any) => {
    console.log("before load", app.name);
    return Promise.resolve();
  },
  // qiankun 生命周期钩子 - 微应用挂载后
  afterMount: (app: any) => {
    console.log("after mount", app.name);
    return Promise.resolve();
  },
});

// 启动 qiankun
start();

export default function IndexPage({ children }: any) {
  return (
    <LayoutPage>
      <div>{children}</div>
      {/* 增加容器，用于显示微应用 */}
      <div id="subContainer"></div>
    </LayoutPage>
  );
}
```

### 添加全局异常捕获

```javascript
// 添加全局异常捕获
addGlobalUncaughtErrorHandler((handler) => {
  console.log("异常捕获", handler);
});
```

### 开启预加载&沙箱模式

- ⚡️prefetch: 开启预加载
  - true | 'all' | string[] | function
- 🧳sandbox：是否开启沙箱
  - strictStyleIsolation 严格模式(`ShadowDOM`)
  - experimentalStyleIsolation 实验性方案，建议使用

```javascript
start({
  prefetch: true, // 开启预加载
  sandbox: {
    experimentalStyleIsolation: true, //   开启沙箱模式,实验性方案
  },
});
```

### 设置主应用启动后默认进入的微应用

```js
import { setDefaultMountApp } from "qiankun"
 setDefaultMountApp('/purehtml');
```

## 创建对应的微应用

> 注意微应用的名称 `package.json` => `name` 需要和主应用中注册时的 `name` 相对应，且必须确保唯一。

### 微应用 vue2.x

#### 初始化

```bash
# 安装 vueCli
$ yarn add @vue/cli
# 创建项目
$ vue create vue2.x_root
# 选择 vue2 版本
# 安装依赖
$ yarn
# 启动
$ yarn serve
```

#### 改造成微应用

1. 在 `src` 目录新增 `public-path.js`：

```js
if (window.__POWERED_BY_QIANKUN__) {
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;
}
```

2. 入口文件 `main.js` 修改

```javascript
   import "./public-path";
   import Vue from "vue";
   import App from "./App.vue";
   import VueRouter from "vue-router";
   import routes from "./router";

   Vue.config.productionTip = false;

   let router = null;
   let instance = null;
   function render(props = {}) {
     const { container } = props;
     router = new VueRouter({
       // 注意这里的name,最好不要写死，直接使用主应用传过来的name
       base: window.__POWERED_BY_QIANKUN__ ? `${props.name}` : "/",
       mode: "history",
       routes,
     });
     Vue.use(VueRouter);
     instance = new Vue({
       router,
       render: (h) => h(App),
     }).$mount(container ? container.querySelector("#app") : "#app");
   }

   // 独立运行时
   if (!window.__POWERED_BY_QIANKUN__) {
     render();
   }

   export async function bootstrap() {
     console.log("[vue2] vue app bootstraped");
   }

   export async function mount(props) {
     render(props);
   }

   export async function unmount() {
     instance.$destroy();
     instance.$el.innerHTML = "";
     instance = null;
     router = null;
   }
```

3. 打包配置修改（`vue.config.js`）：

```javascript
 const path = require("path");
 const { name } = require("./package");

 function resolve(dir) {
   return path.join(__dirname, dir);
 }

 module.exports = {
   filenameHashing: true,
   lintOnSave: process.env.NODE * ENV !== "production",
   runtimeCompiler: true,
   productionSourceMap: false,
   devServer: {
     hot: true,
     disableHostCheck: true,
     // 修改默认端口，和注册时一直
     port: 8001,
     overlay: {
       warnings: false,
       errors: true,
     },
     // 解决主应用加载子应用出现跨域问题
     headers: {
       "Access-Control-Allow-Origin": "*",
     },
   },
   // 自定义 webpack 配置
   configureWebpack: {
     resolve: {
       alias: {
         "@": resolve("src"),
       },
     },
     // 让主应用能正确识别微应用暴露出来的一些信息
     output: {
       library: `${name}-[name]`,
       libraryTarget: "umd", // 把子应用打包成 umd 库格式
       jsonpFunction: `webpackJsonp*${name}`,
     },
   },
 };
```

4. 主应用查看加载效果

![在这里插入图片描述](https://img-blog.csdnimg.cn/img_convert/e75d88373667966964333c18e881154b.png#pic_center)

### 微应用 vue3.x

#### 初始化

```bash
# 安装 vueCli
$ yarn add @vue/cli
# 创建项目
$ vue create vue3.x_root
# 选择 vue3 版本
# 安装依赖
$ yarn
# 启动
$ yarn serve
```

#### 改造成微应用

1. 在 `src` 目录新增 `public-path.js`：

```js
if (window.__POWERED_BY_QIANKUN__) {
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;
}
```

2. 入口文件 `main.ts` 修改

```javascript
  //@ts-nocheck
import './public-path';
import { createApp } from 'vue';
import { createRouter, createWebHistory } from 'vue-router';
import App from './App.vue';
import routes from './router';
import store from './store';

let router = null;
let instance = null;
let history = null;


function render(props = {}) {
  const { container } = props;
  history = createWebHistory(window.__POWERED_BY_QIANKUN__ ? `${props.name}` : '/');
  router = createRouter({
    history,
    routes,
  });

  instance = createApp(App);
  instance.use(router);
  instance.use(store);
  instance.mount(container ? container.querySelector('#app') : '#app');
}

if (!window.__POWERED_BY_QIANKUN__) {
  render();
}

export async function bootstrap() {
  console.log('%c ', 'color: green;', 'vue3.0 app bootstraped');
}

export async function mount(props) {
  render(props);
}

export async function unmount() {
  instance.unmount();
  instance._container.innerHTML = '';
  instance = null;
  router = null;
  history.destroy();
}
```

3. 打包配置修改（`vue.config.js`）：

```javascript
 const path = require('path')
const { name } = require('./package')

function resolve (dir) {
  return path.join(__dirname, dir)
}

module.exports = {
  filenameHashing: true,
  lintOnSave: process.env.NODE_ENV !== 'production',
  runtimeCompiler: true,
  productionSourceMap: false,
  devServer: {
    hot: true,
    disableHostCheck: true,
    // 修改默认端口，和注册时一直
    port: 8002,
    overlay: {
      warnings: false,
      errors: true
    },
    headers: {
      'Access-Control-Allow-Origin': '*'
    }
  },
  // 自定义webpack配置
  configureWebpack: {
    resolve: {
      alias: {
        '@': resolve('src')
      }
    },
    // 让主应用能正确识别微应用暴露出来的一些信息
    output: {
      library: `${name}-[name]`,
      libraryTarget: 'umd', // 把子应用打包成 umd 库格式
      jsonpFunction: `webpackJsonp_${name}`
    }
  }
}
```

4. 主应用查看加载效果

![在这里插入图片描述](https://img-blog.csdnimg.cn/img_convert/aff1901ec73ee46084572dbc22d0dc02.png#pic_center)

### 微应用 react

#### 初始化

```bash
# 创建项目
$ yarn add create-react-app react_root
# 启动
$ yarn start
```

#### 改造成微应用

1. 在 `src` 目录新增 `public-path.js`：

```js
if (window.__POWERED_BY_QIANKUN__) {
  __webpack_public_path__ = window.__INJECTED_PUBLIC_PATH_BY_QIANKUN__;
}
```

2. 设置 history 模式路由的 base：
   > 刚刚创建的项目没有路由，所以先要安装路由

```bash
# 路由安装
$ yarn add react-router react-router-dom
```

> 入口文件 index.js 修改，为了避免根 id #root 与其他的 DOM 冲突，需要限制查找范围。

```javascript
import './public-path';
import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { BrowserRouter, Route, Link } from "react-router-dom"

function render(props) {
  const { container } = props;
  ReactDOM.render(
    <BrowserRouter basename={window.__POWERED_BY_QIANKUN__ ? '/react' : '/'}>
      <App/>
    </BrowserRouter>
    , container ? container.querySelector('#root') : document.querySelector('#root'));
}

if (!window.__POWERED_BY_QIANKUN__) {
  render({});
}

export async function bootstrap() {
  console.log('[react16] react app bootstraped');
}

export async function mount(props) {
  console.log('[react16] props from main framework', props);
  render(props);
}

export async function unmount(props) {
  const { container } = props;
  ReactDOM.unmountComponentAtNode(container ? container.querySelector('#root') : document.querySelector('#root'));
}
```

3. webpack 打包配置修改
   > 安装插件 @rescripts/cli，当然也可以选择其他的插件，例如 react-app-rewired

```bash
# 安装
$ yarn add @rescripts/cli
```

> 根目录增加配置文件 `.rescriptsrc.js`,注意一定是根目录下哦

```javascript
const { name } = require('./package');

module.exports = {
  webpack: (config) => {
    config.output.library = `${name}-[name]`;
    config.output.libraryTarget = 'umd';
    config.output.jsonpFunction = `webpackJsonp_${name}`;
    config.output.globalObject = 'window';

    return config;
  },

  devServer: (_) => {
    const config = _;

    config.headers = {
      'Access-Control-Allow-Origin': '*',
    };
    config.historyApiFallback = true;
    config.hot = false;
    config.watchContentBase = false;
    config.liveReload = false;

    return config;
  },
};
```

4. `package.json`配置修改

```javascript
{
  "name": "react_root",
  "version": "0.1.0",
  "private": true,
  "dependencies": {
    "@rescripts/cli": "^0.0.16",
    "@testing-library/jest-dom": "^5.11.4",
    "@testing-library/react": "^11.1.0",
    "@testing-library/user-event": "^12.1.10",
    "react": "^17.0.2",
    "react-dom": "^17.0.2",
    "react-router-dom": "5.0",
    "react-scripts": "4.0.3",
    "web-vitals": "^1.0.1"
  },
  "scripts": {
    "start": "set PORT=8003&&rescripts  start",
    "build": "rescripts  build",
    "test": "rescripts  test",
    "eject": "rescripts  eject"
  },
  "eslintConfig": {
    "extends": [
      "react-app",
      "react-app/jest"
    ]
  },
  "browserslist": {
    "production": [
      ">0.2%",
      "not dead",
      "not op_mini all"
    ],
    "development": [
      "last 1 chrome version",
      "last 1 firefox version",
      "last 1 safari version"
    ]
  }
}

```

5. 主应用查看加载效果
![在这里插入图片描述](https://img-blog.csdnimg.cn/img_convert/a2c5d1481349f110d5da8725c1460dac.png#pic_center)







