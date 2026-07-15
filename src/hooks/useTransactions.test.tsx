import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useTransactions } from "./useTransactions";

describe("useTransactions", () => {
  it("tracks submitted and confirmed writes", async () => {
    const wait = vi.fn(async () => ({ status: 1 }));
    const { result } = renderHook(() => useTransactions());

    await act(async () => {
      await result.current.runWrite(async () => ({ hash: "0xhash", wait }));
    });

    expect(wait).toHaveBeenCalled();
    expect(result.current.stage).toBe("success");
    expect(result.current.hash).toBe("0xhash");
  });

  it("tracks rejected signatures", async () => {
    const { result } = renderHook(() => useTransactions());

    await act(async () => {
      await result.current.runWrite(async () => {
        throw Object.assign(new Error("rejected"), { code: 4001 });
      });
    });

    expect(result.current.stage).toBe("rejected");
    expect(result.current.error).toContain("rejected");
  });

  it("keeps a confirmed transaction successful when the follow-up refresh fails", async () => {
    const { result } = renderHook(() => useTransactions());

    await act(async () => {
      await result.current.runWrite(
        async () => ({ hash: "0xconfirmed", wait: async () => ({ status: 1 }) }),
        async () => {
          throw new Error("RPC refresh unavailable");
        },
      );
    });

    expect(result.current.stage).toBe("success");
    expect(result.current.hash).toBe("0xconfirmed");
    expect(result.current.error).toBeUndefined();
    expect(result.current.syncError).toBe("RPC refresh unavailable");
  });

  it("rejects a second write while the first wallet flow is pending", async () => {
    let release!: () => void;
    const waiting = new Promise<void>((resolve) => {
      release = resolve;
    });
    const firstWrite = vi.fn(async () => {
      await waiting;
      return { hash: "0xfirst", wait: async () => ({ status: 1 }) };
    });
    const secondWrite = vi.fn(async () => ({ hash: "0xsecond", wait: async () => ({ status: 1 }) }));
    const { result } = renderHook(() => useTransactions());

    let firstResult!: Promise<boolean>;
    await act(async () => {
      firstResult = result.current.runWrite(firstWrite);
      expect(await result.current.runWrite(secondWrite)).toBe(false);
      release();
      await firstResult;
    });

    expect(firstWrite).toHaveBeenCalledTimes(1);
    expect(secondWrite).not.toHaveBeenCalled();
    expect(result.current.hash).toBe("0xfirst");
  });
});
