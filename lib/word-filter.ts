// lib/word-filter.ts
// 第 21 课：敏感词过滤器（留言/评论提交时过安检）
const BAD_WORDS = [
    "加微信", "加vx", "vx", "微信号", "加QQ", "QQ群", "q群", "Q群",
    "代购", "兼职", "刷单", "返利", "博彩", "赌场", "彩票", "下注",
    "贷款", "信用卡套现", "裸聊", "办证", "代开发票", "发票", "批发",
  ];
  
  // 检查文本：命中返回敏感词，没命中返回 null
  export function checkBadWord(text: string): string | null {
    for (const w of BAD_WORDS) {
      if (text.includes(w)) return w;
    }
    return null;
  }
  