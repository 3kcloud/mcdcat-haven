// 数据层：6 只猫完整档案 + 称号体系 + 全局配置
// 图片路径相对 public/，配合 Vite base './'

export interface CatStage {
  stage: number;
  name: string; // 相遇 / 熟悉 / 信赖 / 新家
  img: string;
  desc: string;
}

export interface Cat {
  id: string;
  name: string;
  mcd: string; // 麦当劳特色关联
  icon: string; // 关联餐点图标（通用 emoji，非商标）
  story: string; // 流浪身世
  traits: string; // 特征锚定词（防跨阶段换脸）
  color: string; // 主题色
  stages: CatStage[];
}

export const STAGE_NAMES = ['相遇', '熟悉', '信赖', '新家'];

export const CONFIG = {
  RATE: 10, // ¥1 = 10g 猫粮
  PER_FEED: 100, // 每 100g = 1 次投喂
  FEEDS_PER_STAGE: 5, // 每阶段投喂 5 次
  STAGES: 4, // 共 4 阶段
};

export const CATS: Cat[] = [
  {
    id: 'xiaoju',
    name: '小橘',
    mcd: '薯条',
    icon: '🍟',
    story: '在后巷一个被雨水泡软的纸箱里被发现，瘦得能看见肋骨，却仍把纸箱让给了一只更小的奶猫。',
    traits: '橘色虎斑，毛蓬松如炸薯条，浅金橙色',
    color: '#E8A23D',
    stages: [
      { stage: 1, name: '相遇', img: 'assets/cats/xiaoju-stage1.png', desc: '它缩在纸箱角落，琥珀色的眼睛警惕地盯着你，尾巴紧紧贴着地面。' },
      { stage: 2, name: '熟悉', img: 'assets/cats/xiaoju-stage2.png', desc: '你靠近时它不再立刻躲开，耳朵微微竖起，开始低头舔毛。' },
      { stage: 3, name: '信赖', img: 'assets/cats/xiaoju-stage3.png', desc: '它会主动蹭你的裤脚，眯起眼睛发出呼噜声，毛色也亮了起来。' },
      { stage: 4, name: '新家', img: 'assets/cats/xiaoju-stage4.png', desc: '系上红领巾的那天，它正式成为这个家的一员。' },
    ],
  },
  {
    id: 'naixi',
    name: '奶昔',
    mcd: '麦旋风',
    icon: '🍦',
    story: '冬天蜷在空调外机旁取暖的小奶猫，被发现时冻得发抖，却把唯一的暖 spot 让给了后来的同伴。',
    traits: '纯白卷毛，蓝眼睛，毛量蓬松软糯',
    color: '#CFE3F2',
    stages: [
      { stage: 1, name: '相遇', img: 'assets/cats/naixi-stage1.png', desc: '一团雪白缩在墙角，蓝眼睛怯生生地望着你，卷毛被风吹得乱糟糟。' },
      { stage: 2, name: '熟悉', img: 'assets/cats/naixi-stage2.png', desc: '它开始在你脚边打转，卷毛蓬松起来，不再那么怕冷。' },
      { stage: 3, name: '信赖', img: 'assets/cats/naixi-stage3.png', desc: '它会翻肚皮撒娇，蓝眼睛弯成月牙，整只猫软成了一团云。' },
      { stage: 4, name: '新家', img: 'assets/cats/naixi-stage4.png', desc: '戴上红领巾，它成了家里最软的那一团白。' },
    ],
  },
  {
    id: 'zhima',
    name: '芝麻',
    mcd: '巨无霸',
    icon: '🍔',
    story: '在快餐店后巷的垃圾桶旁长大，靠翻找被人们遗弃的食物活下来，却从不对人哈气。',
    traits: '狸花斑纹，脸有芝麻状斑点，圆脸健壮',
    color: '#9B8579',
    stages: [
      { stage: 1, name: '相遇', img: 'assets/cats/zhima-stage1.png', desc: '一只小花脸从垃圾桶后探出头，芝麻点般的斑纹让它格外显眼。' },
      { stage: 2, name: '熟悉', img: 'assets/cats/zhima-stage2.png', desc: '它敢在你面前进食了，圆脸渐渐有了肉，斑点也更清晰。' },
      { stage: 3, name: '信赖', img: 'assets/cats/zhima-stage3.png', desc: '它会用脑袋顶你的手讨摸，健壮的身子透着满足。' },
      { stage: 4, name: '新家', img: 'assets/cats/zhima-stage4.png', desc: '红领巾一系，芝麻成了家里最稳重的大哥。' },
    ],
  },
  {
    id: 'tuanzi',
    name: '团子',
    mcd: '麦乐鸡',
    icon: '🍗',
    story: '被前主人弃养时瘦骨嶙峋，蜷起来像一颗冷掉的小饭团。被人捡到时，它第一反应是蹭手心。',
    traits: '棕虎斑短毛，圆胖身形，蜷缩如麦乐鸡',
    color: '#D89B5A',
    stages: [
      { stage: 1, name: '相遇', img: 'assets/cats/tuanzi-stage1.png', desc: '一团瘦小的棕球缩在笼角，虎斑在灯光下显得格外单薄。' },
      { stage: 2, name: '熟悉', img: 'assets/cats/tuanzi-stage2.png', desc: '它开始圆润起来，蜷坐时像个暖乎乎的小饭团。' },
      { stage: 3, name: '信赖', img: 'assets/cats/tuanzi-stage3.png', desc: '它笑得眼睛都没了，圆胖的身子写满安心。' },
      { stage: 4, name: '新家', img: 'assets/cats/tuanzi-stage4.png', desc: '红领巾下，它是家里最圆最软的那颗团子。' },
    ],
  },
  {
    id: 'xuanmi',
    name: '玄米',
    mcd: '可乐',
    icon: '🥤',
    story: '一身乌黑油亮，因曾被伤害而极度怕人，躲在车底整整一周，只敢在深夜溜出来喝水。',
    traits: '纯黑短毛，油亮如可乐，金眼睛，纤细耳大',
    color: '#3A3A3A',
    stages: [
      { stage: 1, name: '相遇', img: 'assets/cats/xuanmi-stage1.png', desc: '一双金眼睛在暗处静静注视，黑毛几乎融进夜色里。' },
      { stage: 2, name: '熟悉', img: 'assets/cats/xuanmi-stage2.png', desc: '它愿意在灯下出现了，油亮的黑毛泛着可乐般的光泽。' },
      { stage: 3, name: '信赖', img: 'assets/cats/xuanmi-stage3.png', desc: '金眼睛弯起，它第一次主动走到你手边。' },
      { stage: 4, name: '新家', img: 'assets/cats/xuanmi-stage4.png', desc: '红领巾映着金眸，玄米终于有了家。' },
    ],
  },
  {
    id: 'yuyuan',
    name: '芋圆',
    mcd: '香芋派',
    icon: '🥧',
    story: '一只流浪猫妈妈留下的孩子，被 rescued 时还睁不开眼，如今是最爱撒娇的那一个。',
    traits: '淡紫灰色（丁香色系），圆亮大眼，干净小巧',
    color: '#C9B6D6',
    stages: [
      { stage: 1, name: '相遇', img: 'assets/cats/yuyuan-stage1.png', desc: '一团丁香色的小毛球，圆眼睛怯生生地打量这个世界。' },
      { stage: 2, name: '熟悉', img: 'assets/cats/yuyuan-stage2.png', desc: '它探索的胆子大了起来，淡紫灰的毛在光下温柔得像芋泥。' },
      { stage: 3, name: '信赖', img: 'assets/cats/yuyuan-stage3.png', desc: '它赖在你怀里撒娇，亮眼睛弯成两弯月牙。' },
      { stage: 4, name: '新家', img: 'assets/cats/yuyuan-stage4.png', desc: '红领巾系好，芋圆是家里最甜的那一口。' },
    ],
  },
];

// 爱心等级与称号（按累计猫粮晋升），规避"拜金主义"合规红线：只展示等级与称号，不展示金额
export const TITLES = [
  { lv: 1, name: '拾粮人', min: 100 },
  { lv: 2, name: '投喂实习生', min: 500 },
  { lv: 3, name: '麦麦饲养员', min: 1500 },
  { lv: 4, name: '暖爪管理员', min: 3000 },
  { lv: 5, name: '爱心站长', min: 6000 },
  { lv: 6, name: '猫屋主理人', min: 9000 },
  { lv: 7, name: '麦门守护者', min: 12000 },
  { lv: 8, name: '流浪猫之友', min: 20000 },
];

// 演示模式：预置模拟订单（未授权玩家完整体验主线）
export const DEMO_ORDERS = [
  { name: '巨无霸套餐', amount: 35.0 },
  { name: '麦辣鸡腿堡套餐', amount: 32.5 },
  { name: '麦麦脆汁鸡', amount: 48.0 },
  { name: '薯条+可乐', amount: 18.0 },
  { name: '麦旋风+派', amount: 26.0 },
];
