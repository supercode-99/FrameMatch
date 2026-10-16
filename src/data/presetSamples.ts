import { PresetSample } from '../types/comparison';

/**
 * Generates an SVG/Canvas based realistic video frame for testing
 */
function createPresetFrame(options: {
  bgGradient: [string, string, string];
  shapes: Array<{
    type: 'rect' | 'circle' | 'polygon';
    x: number;
    y: number;
    w?: number;
    h?: number;
    r?: number;
    color: string;
    points?: string;
  }>;
  subtitle?: string;
  watermark?: string;
}): string {
  const canvas = document.createElement('canvas');
  canvas.width = 640;
  canvas.height = 360;
  const ctx = canvas.getContext('2d')!;

  // Background gradient
  const grad = ctx.createLinearGradient(0, 0, 640, 360);
  grad.addColorStop(0, options.bgGradient[0]);
  grad.addColorStop(0.5, options.bgGradient[1]);
  grad.addColorStop(1, options.bgGradient[2]);
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 640, 360);

  // Decorative grid / horizon lines
  ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
  ctx.lineWidth = 1;
  for (let y = 40; y < 360; y += 40) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(640, y);
    ctx.stroke();
  }

  // Draw scene shapes
  for (const s of options.shapes) {
    ctx.fillStyle = s.color;
    if (s.type === 'rect' && s.w && s.h) {
      ctx.fillRect(s.x, s.y, s.w, s.h);
    } else if (s.type === 'circle' && s.r) {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  // Watermark if any
  if (options.watermark) {
    ctx.fillStyle = 'rgba(255, 255, 255, 0.4)';
    ctx.font = '12px sans-serif';
    ctx.fillText(options.watermark, 20, 30);
  }

  // Subtitle band if present
  if (options.subtitle) {
    // Subtitle semi-transparent shadow box
    ctx.fillStyle = 'rgba(0, 0, 0, 0.55)';
    ctx.fillRect(80, 298, 480, 42);

    ctx.fillStyle = '#FFFFFF';
    ctx.font = 'bold 18px "Noto Sans SC", "PingFang SC", sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Black text stroke for contrast
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#000000';
    ctx.strokeText(options.subtitle, 320, 319);
    ctx.fillText(options.subtitle, 320, 319);
  }

  return canvas.toDataURL('image/jpeg', 0.92);
}

export function getPresetSamples(): PresetSample[] {
  // Preset 1: Same Shot with DIFFERENT subtitles (Critical test case for subtitle mask elimination)
  const p1A = createPresetFrame({
    bgGradient: ['#1e1b4b', '#312e81', '#0f172a'],
    shapes: [
      { type: 'rect', x: 80, y: 100, w: 200, h: 140, color: '#4338ca' }, // Console
      { type: 'circle', x: 420, y: 160, r: 60, color: '#06b6d4' },       // Hologram orb
      { type: 'rect', x: 410, y: 220, w: 20, h: 50, color: '#0e7490' },  // Pedestal
      { type: 'circle', x: 280, y: 140, r: 35, color: '#f59e0b' },       // Character silhouette
      { type: 'rect', x: 260, y: 175, w: 40, h: 90, color: '#b45309' },  // Body
    ],
    subtitle: '「警告：空间站主反应堆能量读数异常升高！」',
    watermark: 'EP03 00:14:22:18 [HDR]',
  });

  const p1B = createPresetFrame({
    bgGradient: ['#1e1b4b', '#312e81', '#0f172a'],
    shapes: [
      { type: 'rect', x: 80, y: 100, w: 200, h: 140, color: '#4338ca' },
      { type: 'circle', x: 420, y: 160, r: 60, color: '#06b6d4' },
      { type: 'rect', x: 410, y: 220, w: 20, h: 50, color: '#0e7490' },
      { type: 'circle', x: 282, y: 139, r: 35, color: '#f59e0b' },       // Actor slight micro-motion
      { type: 'rect', x: 262, y: 174, w: 40, h: 90, color: '#b45309' },
    ],
    subtitle: '「立即切断备用导流阀，启动磁场约束闭环！」', // Completely different text
    watermark: 'EP03 00:14:24:02 [HDR]',
  });

  // Preset 2: Same Scene, Different Shot (Cut / Shot-Reverse-Shot in a warm cozy coffee shop)
  const p2A = createPresetFrame({
    bgGradient: ['#451a03', '#78350f', '#292524'], // Warm amber/brown tones
    shapes: [
      { type: 'rect', x: 40, y: 60, w: 240, h: 180, color: '#92400e' },  // Wooden bookshelf
      { type: 'circle', x: 160, y: 120, r: 25, color: '#fbbf24' },       // Pendant lamp
      { type: 'rect', x: 360, y: 130, w: 180, h: 120, color: '#b45309' }, // Table
      { type: 'circle', x: 450, y: 110, r: 35, color: '#d97706' },       // Character A seated
    ],
    subtitle: '「这家店的曼特宁咖啡豆是上周刚烘焙的。」',
  });

  const p2B = createPresetFrame({
    bgGradient: ['#451a03', '#78350f', '#292524'], // Same amber/brown environmental atmosphere
    shapes: [
      { type: 'rect', x: 120, y: 180, w: 400, h: 100, color: '#b45309' }, // Table close-up
      { type: 'circle', x: 300, y: 190, r: 40, color: '#fef3c7' },        // Ceramic cup close-up
      { type: 'circle', x: 300, y: 190, r: 32, color: '#78350f' },        // Dark coffee liquid
      { type: 'rect', x: 420, y: 160, w: 140, h: 90, color: '#92400e' },  // Notebook
    ],
    subtitle: '「尝尝看，风味里有很明显的黑巧克力香气。」',
  });

  // Preset 3: Completely Different Scene (Outdoor Sunny Alpine vs Cyberpunk Neon Alley)
  const p3A = createPresetFrame({
    bgGradient: ['#38bdf8', '#7dd3fc', '#0284c7'], // Sky blue
    shapes: [
      { type: 'circle', x: 520, y: 70, r: 40, color: '#fef08a' },         // Sun
      { type: 'rect', x: 0, y: 180, w: 640, h: 180, color: '#f8fafc' },   // White snow
      { type: 'rect', x: 180, y: 120, w: 120, h: 160, color: '#94a3b8' }, // Mountain ridge
      { type: 'rect', x: 340, y: 90, w: 160, h: 200, color: '#64748b' },
    ],
    subtitle: '「高山滑雪场的气温已经降到了零下12度。」',
  });

  const p3B = createPresetFrame({
    bgGradient: ['#09090b', '#18181b', '#27272a'], // Deep dark asphalt
    shapes: [
      { type: 'rect', x: 60, y: 40, w: 90, h: 260, color: '#ec4899' },    // Neon magenta billboard
      { type: 'rect', x: 460, y: 60, w: 110, h: 240, color: '#06b6d4' },  // Neon cyan billboard
      { type: 'rect', x: 0, y: 260, w: 640, h: 100, color: '#18181b' },   // Wet street
      { type: 'circle', x: 320, y: 220, r: 25, color: '#a855f7' },        // Vehicle taillight reflection
    ],
    subtitle: '「雨夜的第七街区从来没有安静过。」',
  });

  // Preset 4: Camera Push / Micro-Zoom (同一镜头慢推)
  const p4A = createPresetFrame({
    bgGradient: ['#f97316', '#ea580c', '#c2410c'], // Sunset gradient
    shapes: [
      { type: 'circle', x: 320, y: 220, r: 70, color: '#fef08a' }, // Setting sun
      { type: 'rect', x: 290, y: 130, w: 60, h: 130, color: '#1c1917' }, // Lighthouse
      { type: 'rect', x: 0, y: 250, w: 640, h: 110, color: '#0369a1' }, // Sea
    ],
    subtitle: '「夕阳已经快要沉入地平线下了。」',
  });

  const p4B = createPresetFrame({
    bgGradient: ['#f97316', '#ea580c', '#c2410c'],
    shapes: [
      { type: 'circle', x: 320, y: 210, r: 90, color: '#fef08a' }, // Zoomed-in sun
      { type: 'rect', x: 280, y: 90, w: 80, h: 170, color: '#1c1917' },  // Zoomed-in lighthouse
      { type: 'rect', x: 0, y: 240, w: 640, h: 120, color: '#0369a1' },  // Sea
    ],
    subtitle: '「灯塔的光芒准时亮了起来。」',
  });

  return [
    {
      id: 'same_shot_diff_sub',
      title: '场景一：同一连续镜头（台词刷新/不同字幕）',
      category: 'same_shot',
      description: '关键验证：同一机位内人物微动、背景相同，但底部字幕文字不同。算法将自动排除字幕干扰。',
      expectedShot: true,
      expectedScene: true,
      frameAUrl: p1A,
      frameBUrl: p1B,
    },
    {
      id: 'same_scene_diff_shot',
      title: '场景二：同场景不同镜头（正反打与分镜切镜）',
      category: 'same_scene_different_shot',
      description: '咖啡馆环境：全景切桌面特写，色调光源一致，但构图与摄像机焦点已换。判定为同场景但非同一镜头。',
      expectedShot: false,
      expectedScene: true,
      frameAUrl: p2A,
      frameBUrl: p2B,
    },
    {
      id: 'different_scene',
      title: '场景三：完全不同场景（雪山日景 vs 赛博夜景）',
      category: 'different_scene',
      description: '自然雪山与夜市街道，色调、环境光、空间结构全维度断裂，判定为不同场景与不同镜头。',
      expectedShot: false,
      expectedScene: false,
      frameAUrl: p3A,
      frameBUrl: p3B,
    },
    {
      id: 'motion_zoom_shot',
      title: '场景四：同一镜头推镜头（Camera Zoom / 连续运镜）',
      category: 'motion_shot',
      description: '夕阳海滨灯塔同一镜头内向前推进特写，结构具有平滑位移，判定为同一连续镜头。',
      expectedShot: true,
      expectedScene: true,
      frameAUrl: p4A,
      frameBUrl: p4B,
    },
  ];
}
