// 分享层：把证书 DOM 转成可保存的 PNG
import html2canvas from 'html2canvas';

export async function captureCert(el: HTMLElement): Promise<void> {
  try {
    const canvas = await html2canvas(el, {
      backgroundColor: '#FFF9F0',
      scale: 2,
      useCORS: true,
    });
    const data = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = data;
    a.download = '麦麦猫屋-领养证书.png';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  } catch (e) {
    alert('生成图片失败，可长按证书区域手动保存 🙏');
  }
}
