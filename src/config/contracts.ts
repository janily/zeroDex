import type { Address } from "../types/domain";

export const CONTRACTS = {
  poolManager: "0xddC12b3F9F7C91C79DA7433D8d212FB78d609f7B",
  positionManager: "0xbe766Bf20eFfe431829C5d5a2744865974A0B610",
  swapRouter: "0xD2c220143F5784b3bD84ae12747d97C8A36CeCB2",
} as const satisfies Record<string, Address>;
