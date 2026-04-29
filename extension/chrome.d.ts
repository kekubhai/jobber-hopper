declare namespace chrome {
  namespace runtime {
    const onInstalled: {
      addListener(callback: () => void): void;
    };
  }

  namespace storage {
    const local: {
      set(items: Record<string, unknown>): Promise<void>;
    };
  }

  namespace tabs {
    function create(createProperties: { url: string }): Promise<unknown>;
  }
}
