export interface TreasuryData {
  amount: string
  usdAmount: string
}

export interface BurnedData {
  amount: string
  usdAmount: string
}

export interface VolumeData {
  amount: string
  usdAmount: string
  amount24h: string
  usdAmount24h: string
}

export interface UserData {
  balance: number
  balance_usd: number
  updated_at: string
}

export interface Stats {
  treasury: {
    amount: string
    delta: string
  }
  burned: {
    amount: string
    delta: string
  }
  globalVol: {
    amount: string
    delta: string
  }
  dayVol: {
    amount: string
    delta: string
  }
  token: {
    symbol: string
    lastUpdate: string
    balance: string
    delta: string
  }
} 