// 入口：路由 home / cat / cert + 事件绑定
import './style.css';
import * as L from './logic';
import { renderHome, renderCat, renderCert } from './ui';
import { captureCert } from './share';

let state: L.GameState = L.loadState();
let route = 'home';
let curCat = '';

const app = document.getElementById('app') as HTMLElement;

function go(r: string, id = ''): void {
  route = r;
  curCat = id;
  window.scrollTo(0, 0);
  render();
}

function render(): void {
  if (route === 'cat') {
    app.innerHTML = renderCat(state, curCat);
    bindCat();
  } else if (route === 'cert') {
    app.innerHTML = renderCert(state, curCat);
    bindCert();
  } else {
    app.innerHTML = renderHome(state);
    bindHome();
  }
}

function bindHome(): void {
  app.querySelectorAll<HTMLElement>('.cat').forEach((el) => {
    el.addEventListener('click', () => {
      const id = el.dataset.id as string;
      L.adoptCat(state, id);
      L.saveState(state);
      go('cat', id);
    });
  });
}

function bindCat(): void {
  app.querySelector('#back')?.addEventListener('click', () => go('home'));

  app.querySelector<HTMLButtonElement>('#feed')?.addEventListener('click', () => {
    const r = L.feedOnce(state, curCat);
    if (!r.ok) {
      alert('猫粮不足，请先获取猫粮 🌾');
      return;
    }
    if (r.adopted) {
      if (!state.certDone.includes(curCat)) state.certDone.push(curCat);
      L.saveState(state);
      go('cert', curCat);
      return;
    }
    render();
  });

  app.querySelector<HTMLButtonElement>('#signin')?.addEventListener('click', () => {
    L.addKibble(state, 100, 'signin');
    state.signinDay = L.today();
    L.saveState(state);
    render();
  });

  app.querySelector<HTMLButtonElement>('#task')?.addEventListener('click', () => {
    L.addKibble(state, 150, 'task');
    state.taskDay = L.today();
    L.saveState(state);
    render();
  });

  app.querySelector<HTMLButtonElement>('#demo')?.addEventListener('click', () => {
    const yuan = L.demoOrderTotal();
    const g = L.amountToKibble(yuan);
    L.addKibble(state, g, 'order');
    L.saveState(state);
    alert(`演示订单合计 ¥${yuan}，换算爱心猫粮 ${g}g 🌾`);
    render();
  });

  // A 通道：真机订单（需后端代理 /api/mcp-order），失败自动降级演示模式
  app.querySelector<HTMLButtonElement>('#order')?.addEventListener('click', async () => {
    try {
      const r = await fetch('/api/mcp-order');
      if (!r.ok) throw new Error('api-not-ready');
      const j = (await r.json()) as { total?: number };
      if (typeof j.total !== 'number') throw new Error('no-total');
      const g = L.amountToKibble(j.total);
      L.addKibble(state, g, 'order');
      L.saveState(state);
      alert(`你的订单合计 ¥${j.total}，换算爱心猫粮 ${g}g 🌾`);
      render();
    } catch (e) {
      const yuan = L.demoOrderTotal();
      const g = L.amountToKibble(yuan);
      L.addKibble(state, g, 'order');
      L.saveState(state);
      alert(`真机订单暂不可用（需部署后端 + 授权 Token）\n已用演示订单 ¥${yuan} 换算 ${g}g 🌾`);
      render();
    }
  });
}

function bindCert(): void {
  app.querySelector('#home')?.addEventListener('click', () => go('home'));
  app.querySelector('#save')?.addEventListener('click', () => {
    const el = document.getElementById('cert-card');
    if (el) void captureCert(el);
  });
}

render();
