export type ProfitShareRates = {
  ppnRate: number;
  bhpUsoRate: number;
  saganetShare: number;
  ispShare: number;
};

export type ProfitShareBreakdown = {
  gross: number;
  ppn: number;
  setelahPpn: number;
  bhpuso: number;
  net: number;
  saganet: number;
  isp: number;
  rates: ProfitShareRates;
};

export const DEFAULT_RATES: ProfitShareRates = {
  ppnRate: 0.11,
  bhpUsoRate: 0.0175,
  saganetShare: 0.65,
  ispShare: 0.35,
};

/** Hitung bagi hasil: gross → PPN → BHPUSO → split SaGa-Net / ISP */
export function calculateProfitShare(
  gross: number,
  rates: ProfitShareRates = DEFAULT_RATES,
): ProfitShareBreakdown {
  const safeGross = Math.max(0, Math.round(gross));
  const ppn = Math.round(safeGross * rates.ppnRate);
  const setelahPpn = safeGross - ppn;
  const bhpuso = Math.round(setelahPpn * rates.bhpUsoRate);
  const net = setelahPpn - bhpuso;
  const saganet = Math.round(net * rates.saganetShare);
  const isp = net - saganet;

  return {
    gross: safeGross,
    ppn,
    setelahPpn,
    bhpuso,
    net,
    saganet,
    isp,
    rates,
  };
}

export function formatRp(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatPercent(rate: number): string {
  return `${(rate * 100).toLocaleString("id-ID", {
    maximumFractionDigits: 2,
  })}%`;
}
