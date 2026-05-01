export interface BirdeyeResponse<T> {
  success: boolean;
  data: T;
}

export interface TrendingToken {
  address: string;
  name: string;
  symbol: string;
  price: number;
  liquidity: number;
  volume24hUSD: number;
  price24hChangePercent: number;
  logoURI?: string;
  // Dashboard için türetilecek skorlar
  riskScore?: number;
  momentumScore?: number;
}

export interface NewListingToken {
  address: string;
  name: string;
  symbol: string;
  price: number;
  liquidity: number;
  volume24hUSD: number;
  price24hChangePercent: number;
  listingTime: string;
  logoURI?: string;
}

export interface TokenSecurity {
  address: string;
  isMintable: boolean;
  isMutable: boolean;
  top10HolderPercent: number;
  lockedLiquidityPercent: number;
  ownerBalance: number;
  creatorBalance: number;
}
