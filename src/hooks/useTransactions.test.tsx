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
});
