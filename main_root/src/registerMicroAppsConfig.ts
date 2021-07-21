
const loader = (loading: boolean) => {
  // 此处可以获取子应用是否加载成功,可以用来触发全局的loading
  console.log('loading', loading);
};

export const Microconfig = [
  {
    name: 'vue2',
    entry: 'http://localhost:8001',
    container: '#subContainer',
    activeRule: '/vue2',
    loader,
  },
  {
    name: 'vue3',
    entry: 'http://localhost:8002',
    container: '#subContainer',
    activeRule: '/vue3',
    loader,
  },
  {
    name: 'react',
    entry: 'http://localhost:3000',
    container: '#subContainer',
    activeRule: '/react',
    loader,
  },
];
