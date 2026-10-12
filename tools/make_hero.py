"""生成 README 头图：6 只猫「相遇 → 新家」前后对比横幅。"""
import os
from PIL import Image, ImageDraw

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "assets", "cats")
OUT_DIR = os.path.join(ROOT, "docs")
OUT = os.path.join(OUT_DIR, "hero.png")

CATS = ["xiaoju", "naixi", "zhima", "tuanzi", "xuanmi", "yuyuan"]

W, H = 1800, 1000
BG_TOP = (255, 248, 236)
BG_BOTTOM = (255, 235, 214)

CELL_W = W // 6
ROW_H = 380
TOP_Y = 150
BOT_Y = 560
CAT_SIZE = 300


def paste_row(draw_base, stage, y):
    for i, c in enumerate(CATS):
        p = os.path.join(SRC, f"{c}-stage{stage}.png")
        im = Image.open(p).convert("RGBA")
        im = im.resize((CAT_SIZE, CAT_SIZE), Image.Resampling.LANCZOS)
        cx = i * CELL_W + (CELL_W - CAT_SIZE) // 2
        draw_base.alpha_composite(im, (cx, y))


def main():
    os.makedirs(OUT_DIR, exist_ok=True)
    base = Image.new("RGB", (W, H), BG_TOP)
    d = ImageDraw.Draw(base)
    # 竖向渐变背景
    for y in range(H):
        t = y / (H - 1)
        r = int(BG_TOP[0] + (BG_BOTTOM[0] - BG_TOP[0]) * t)
        g = int(BG_TOP[1] + (BG_BOTTOM[1] - BG_TOP[1]) * t)
        b = int(BG_TOP[2] + (BG_BOTTOM[2] - BG_TOP[2]) * t)
        d.line([(0, y), (W, y)], fill=(r, g, b))

    rgba = base.convert("RGBA")
    paste_row(rgba, 1, TOP_Y)
    paste_row(rgba, 4, BOT_Y)

    rgba.save(OUT, optimize=True)
    print("saved:", OUT, rgba.size)
    print("size_kb:", round(os.path.getsize(OUT) / 1024, 1))


if __name__ == "__main__":
    main()
