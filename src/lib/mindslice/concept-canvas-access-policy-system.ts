export type CanvasAccessAction =
  | "view_archive"
  | "view_canvas"
  | "save_memory"
  | "write_journal"
  | "create_slice"
  | "advanced_action";

export type CanvasAccessUserState = {
  role?: "anonymous" | "signed_in";
  signed_in?: boolean;
  profile_complete?: boolean;
  active_subscription?: boolean;
};

export type CanvasAccessResult = {
  can_view_canvas: boolean;
  can_save_memory: boolean;
  can_write_journal: boolean;
  can_create_slice: boolean;
  can_use_advanced_actions: boolean;
  required_actions: string[];
};

function buildResult(
  view: boolean,
  memory: boolean,
  journal: boolean,
  slice: boolean,
  advanced: boolean,
  requiredActions: string[],
): CanvasAccessResult {
  return {
    can_view_canvas: view,
    can_save_memory: memory,
    can_write_journal: journal,
    can_create_slice: slice,
    can_use_advanced_actions: advanced,
    required_actions: [...new Set(requiredActions)],
  };
}

export function runCanvasAccessPolicyV1(
  userState: CanvasAccessUserState,
  requestedAction: CanvasAccessAction,
): CanvasAccessResult {
  let canViewCanvas = false;
  let canSaveMemory = false;
  let canWriteJournal = false;
  let canCreateSlice = false;
  let canUseAdvancedActions = false;
  const requiredActions: string[] = [];

  if (userState.role === "anonymous" || !userState.signed_in) {
    canViewCanvas = requestedAction === "view_archive";
    requiredActions.push("sign_in_to_use_canvas");

    return buildResult(
      canViewCanvas,
      canSaveMemory,
      canWriteJournal,
      canCreateSlice,
      canUseAdvancedActions,
      requiredActions,
    );
  }

  canViewCanvas = true;

  if (userState.profile_complete) {
    canSaveMemory = true;
    canWriteJournal = true;
  } else {
    requiredActions.push("complete_profile_for_memory_and_journal");
  }

  if (userState.active_subscription) {
    canCreateSlice = true;
    canUseAdvancedActions = true;
  } else {
    requiredActions.push("activate_subscription_for_advanced_actions");
  }

  return buildResult(
    canViewCanvas,
    canSaveMemory,
    canWriteJournal,
    canCreateSlice,
    canUseAdvancedActions,
    requiredActions,
  );
}

export const RUN = runCanvasAccessPolicyV1;
