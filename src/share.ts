// 分享层：把任意 DOM 节点转成可保存的 PNG
import html2canvas from 'html2canvas';

export async function capture(el: HTMLElement, filename = '麦麦猫屋-分享图.png'): Promise<void> {
  try {
    const canvas = await html2canvas(el, {
      backgroundColor: '#FFF9F0',
      scale: 2,
      useCORS: true,
    });
    const data = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = data;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (e) {
    alert('生成图片失败，可长按图片手动保存 🙏');
  }
}

/** 兼容旧调用：证书分享 */
export async function captureCert(el: HTMLElement): Promise<void> {
  return capture(el, '麦麦猫屋-领养证书.png');
}
