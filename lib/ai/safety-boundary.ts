const blockedPatterns = [
  /自杀|轻生|伤害自己|伤害孩子/,
  /急救|窒息|抽搐|昏迷|高烧不退|严重过敏/,
  /诊断|处方|用药|药量|抗生素/,
  /虐待|殴打|体罚|关禁闭/,
  /法律责任|起诉|离婚协议/
];

export interface SafetyBoundaryResult {
  allowed: boolean;
  reason?: string;
  fallbackResponse?: {
    title: string;
    summary: string;
    actions: string[];
  };
}

export function classifyAISafetyBoundary(message: string): SafetyBoundaryResult {
  const matched = blockedPatterns.find((pattern) => pattern.test(message));

  if (!matched) {
    return { allowed: true };
  }

  return {
    allowed: false,
    reason: "safety_boundary",
    fallbackResponse: {
      title: "这个问题需要真人专业支持",
      summary:
        "我不能替代医生、心理危机干预、法律或线下安全判断。请优先联系当地紧急服务、医生、学校老师或可信赖的真人专家。",
      actions: [
        "如果存在即时危险，先确保孩子和照护者安全，并联系当地紧急服务。",
        "把发生时间、持续多久、孩子当前状态记录下来，便于专业人员判断。",
        "等安全风险解除后，我可以帮你整理一份给医生或老师的情况说明。"
      ]
    }
  };
}
