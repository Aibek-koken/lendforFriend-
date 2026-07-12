export const signupModes = ["real", "demo"] as const;
export const managerCounts = ["1", "2-5", "6-20", "20+"] as const;
export const crmProviders = ["amocrm", "bitrix24", "hubspot", "other", "none"] as const;
export const mainGoals = ["sales", "support", "training", "other"] as const;

export type SignupMode = (typeof signupModes)[number];
export type ManagerCount = (typeof managerCounts)[number];
export type CrmProvider = (typeof crmProviders)[number];
export type MainGoal = (typeof mainGoals)[number];
export type CrmStatus = "pending" | "connected" | "failed" | "unsupported" | "demo";

export type CompanySetupInput = {
  companyName: string;
  managerCount: string;
  crmProvider: string;
  mainGoal: string;
};

export type CompanySetup = {
  companyName: string;
  managerCount: ManagerCount;
  crmProvider: CrmProvider;
  mainGoal: MainGoal;
};

export type SignupState = {
  authenticated: boolean;
  step: "auth" | "mode" | "company" | "complete";
  mode: SignupMode | null;
  companyId: string | null;
  companyName: string | null;
  crmProvider: CrmProvider | null;
  crmStatus: CrmStatus | null;
};

export type ValidationErrors = Partial<Record<keyof CompanySetupInput, string>>;

export function validateCompanySetup(input: CompanySetupInput) {
  const errors: ValidationErrors = {};
  const companyName = input.companyName.trim();

  if (companyName.length < 2) errors.companyName = "company_name_short";
  if (companyName.length > 120) errors.companyName = "company_name_long";
  if (!managerCounts.includes(input.managerCount as ManagerCount)) {
    errors.managerCount = "manager_count_required";
  }
  if (!crmProviders.includes(input.crmProvider as CrmProvider)) {
    errors.crmProvider = "crm_required";
  }
  if (!mainGoals.includes(input.mainGoal as MainGoal)) {
    errors.mainGoal = "goal_required";
  }

  if (Object.keys(errors).length > 0) return { ok: false as const, errors };

  return {
    ok: true as const,
    value: {
      companyName,
      managerCount: input.managerCount as ManagerCount,
      crmProvider: input.crmProvider as CrmProvider,
      mainGoal: input.mainGoal as MainGoal,
    },
  };
}

export function canCaptureCrmConnected(status: CrmStatus) {
  return status === "connected";
}

export function workspaceEventsForResult(mode: SignupMode, created: boolean) {
  if (!created) return [] as const;
  return mode === "demo"
    ? (["signup_completed", "demo_started"] as const)
    : (["signup_completed"] as const);
}

export function nextStepForState(state: Pick<SignupState, "authenticated" | "mode" | "companyId">) {
  if (!state.authenticated) return "auth" as const;
  if (state.companyId) return "complete" as const;
  if (state.mode === "real") return "company" as const;
  return "mode" as const;
}
