interface Window {
  jobberHopperScanFormFields?: () => DetectedFormField[];
  jobberHopperAutofillProfile?: () => Promise<AutofillRunResult>;
  jobberHopperPlatform?: () => string;
}

type MasterProfilePayload = {
  personal: Record<string, string>;
  address: Record<string, string>;
  education: unknown[];
  workHistory: unknown[];
  customQaPairs: unknown[];
};

type AutofillRunResult = {
  filled: number;
  skipped: number;
  matches: Array<{
    fieldId: string;
    labelGuess: string;
    type: string;
    profileFieldPath: string | null;
    value: string | null;
  }>;
};

type DetectedFormField = {
  fieldId: string;
  labelGuess: string;
  type: string;
};

type PopupReviewField = {
  fieldId: string;
  labelGuess: string;
  type: string;
  profileFieldPath: string | null;
  value: string;
  confidence: number;
  isSafeToFill: boolean;
  manualReason: string | null;
};

type PopupReviewResponse = {
  pageTitle: string;
  pageUrl: string;
  ready: boolean;
  fields: PopupReviewField[];
  error?: string;
};

type PopupFillRequest = {
  fields: Array<{
    fieldId: string;
    value: string;
  }>;
};

declare namespace chrome {
  namespace runtime {
    const onInstalled: {
      addListener(callback: () => void): void;
    };
    const onMessage: {
      addListener(
        callback: (
          message: unknown,
          sender: unknown,
          sendResponse: (response?: unknown) => void
        ) => boolean | void
      ): void;
    };
    function sendMessage(message: unknown): Promise<unknown>;
  }

  namespace storage {
    const local: {
      get(keys?: string | string[] | Record<string, unknown> | null): Promise<Record<string, unknown>>;
      set(items: Record<string, unknown>): Promise<void>;
      remove(keys: string | string[]): Promise<void>;
    };
  }

  namespace cookies {
    function get(details: { url: string; name: string }): Promise<{ value?: string } | null>;
  }

  namespace tabs {
    function create(createProperties: { url: string }): Promise<unknown>;
    function query(queryInfo: {
      active?: boolean;
      currentWindow?: boolean;
    }): Promise<Array<{ id?: number; title?: string; url?: string }>>;
    function sendMessage(tabId: number, message: unknown): Promise<unknown>;
  }
}
