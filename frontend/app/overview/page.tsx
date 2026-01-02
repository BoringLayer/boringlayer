"use client"

import { useState, useEffect, useRef } from "react"
import styled, { createGlobalStyle } from "styled-components"
import { useSession, signIn, signOut } from "next-auth/react"
import { useUserData } from '@/lib/hooks/useSession'
import { ErrorBoundary } from '../components/ErrorBoundary'
import LoadingSpinner from '../components/LoadingSpinner'
import { SessionProvider } from 'next-auth/react'
import WaveBackground from '../components/WaveBackground'
import ComingSoonTooltip from '../components/ComingSoonTooltip'
import { TreasuryData, BurnedData, VolumeData, UserData, Stats } from '@/types/api'
import RetroBackground from '../components/RetroBackground'
import { useRouter, usePathname } from 'next/navigation'

const StyledPageWrapper = styled.div`
  * {
    cursor: default !important;
  }

  button,
  a,
  [role="button"],
  [onclick],
  .clickable,
  tr[onclick],
  input[type="button"],
  input[type="submit"],
  div[onClick],
  span[onClick],
  td[onClick] {
    cursor: pointer !important;
  }
`

const PageContainer = styled.div<{ $isLoading: boolean }>`
  visibility: ${props => props.$isLoading ? 'hidden' : 'visible'};
  
  @media (max-width: 875px) {
    position: relative !important;
    height: auto !important;
    overflow: visible !important;
    
    & ~ body {
      position: relative !important;
      overflow: auto !important;
      height: auto !important;
    }
  }
`

const Container = styled.div`
  width: 100%;
  max-width: 1114px;
  margin: 0 auto;
  padding: 16px;
  position: relative;
  z-index: 1;
  display: flex;
  justify-content: center;
  align-items: center;

  @media (max-width: 875px) {
    padding: 8px;
    margin-top: -15px;
    min-height: 100%;
    align-items: flex-start;
  }
`

const BlueRectangle = styled.div`
  box-sizing: border-box;
  background: rgba(0, 0, 158, 0);
  width: 100%;
  max-width: 1114px;
  position: relative;
  box-shadow: 7px 7px 0px 0px rgba(1, 1, 1, 0);
  padding: 2px;
  margin-top: 24px;

  @media (max-width: 875px) {
    padding: 8px 10px 16px;
    width: 100%;
    margin: 20px auto;
    min-height: auto;
    box-shadow: none;
    overflow-y: visible;
  }
`

const BorderContainer = styled.div`
  border: 1px solid white;
  padding: 2px;
  position: relative;
  margin-top: 24px;
  width: 100%;
  max-width: 1114px;
  background: rgb(5, 0, 98);
  background-image: radial-gradient(circle, rgba(0, 0, 0, 0.5) 1px, transparent 1px);
  background-size: 4px 4px;
`

const InnerBorder = styled.div`
  border: 1px solid white;
  padding: 16px;
`

const Title = styled.h1`
  font-family: "Courier New", Courier, monospace;
  font-weight: bold;
  font-size: 16px;
  color: white;
  position: absolute;
  top: -24px;
  left: -16px;
  transform: translateY(-50%);
  padding: 0 16px;
  margin: 0;
  z-index: 2;
  animation: rgbText 2s steps(9) 0s infinite alternate;

  @media (max-width: 875px) {
    position: absolute;
    top: -35px;
    left: -14px;
    transform: none;
    text-align: left;
    margin-bottom: 16px;
    z-index: 3;
  }
`

const LoginButton = styled.button`
  font-family: "Courier New", Courier, monospace;
  font-weight: bold;
  font-size: 16px;
  color: #00FFEA;
  background: none;
  border: none;
  cursor: pointer;
  position: absolute;
  top: -24px;
  left: -16px;
  transform: translateY(-50%);
  padding: 0 16px;
  z-index: 2;

  &:hover {
    text-decoration: none;
  }
`

const NavContainer = styled(BorderContainer)`
  margin-top: 0px;
`

const NavInner = styled(InnerBorder)`
  display: flex;
  flex-direction: row;
  justify-content: center;
  align-items: center;
  padding: 3px 0;
  position: relative;
  min-height: 50px;
  gap: 120px;

  @media (max-width: 875px) {
    flex-direction: row;
    gap: 20px;
    justify-content: center;
  }
`

const NavButtonContainer = styled.div`
  position: relative;
  
  @media (max-width: 875px) {
    &:first-child,
    &:last-child {
      position: static;
      margin: 8px 0;
      text-align: center;
      display: flex;
      justify-content: center;
      width: 100%;
    }
  }
`

const NavButton = styled.button<{ $active: boolean; $current: boolean }>`
  font-family: "Courier New", Courier, monospace;
  font-weight: bold;
  font-size: 16px;
  color: ${props => props.$current ? 'white' : 'rgba(255, 255, 255, 0.5)'};
  background: transparent;
  border: none;
  padding: 0px 5px;
  position: relative;
  cursor: pointer;
  opacity: ${props => props.$active ? '1' : '0.7'};
  transition: color 0.2s ease-in-out;

  &:hover {
    color: ${props => props.$active && !props.$current ? '#00FFEA' : 'white'};
  }
`

const StatsContainer = styled(BorderContainer)`
  margin-top: 16px;
`

const StatsInner = styled(InnerBorder)`
  display: flex;
  justify-content: space-between;
  padding: 16px 128px;

  @media (max-width: 875px) {
    padding: 8px;
    flex-direction: column;
    gap: 8px;
    align-items: center;
  }
`

const StatBox = styled.div`
  text-align: center;

  @media (max-width: 875px) {
    margin: 4px 0;
  }
`

const StatTitle = styled.div`
  font-family: "Courier New", Courier, monospace;
  font-weight: bold;
  font-size: 16px;
  color: #eaff00;
`

const StatValue = styled.div`
  font-family: "Courier New", Courier, monospace;
  font-weight: bold;
  font-size: 16px;
  color: white;
`

const StatDelta = styled.div`
  font-family: "Courier New", Courier, monospace;
  font-size: 16px;
  color: #40ff00;
`

const TokenContainer = styled(BorderContainer)`
  margin-top: 16px;
`

const TokenInner = styled(InnerBorder)`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;

  @media (max-width: 875px) {
    grid-template-columns: 1fr;
    gap: 8px;
    text-align: center;
  }
`

const TokenBox = styled.div.withConfig({
  shouldForwardProp: (prop) => prop !== '$align',
})<{ $align?: string }>`
  text-align: ${(props) => props.$align || "left"};
  ${props => {
    if (props.$align === 'right') return `
      padding-right: 50px;
    `;
    if (!props.$align) return `
      padding-left: 50px;
    `;
    return '';
  }}

  @media (max-width: 875px) {
    text-align: center;
    padding: 0 !important;
    margin: 4px 0;
  }
`

const ErrorMessage = styled.div`
  color: #ff4040;
  background: rgba(255, 64, 64, 0.1);
  padding: 8px 16px;
  border-radius: 4px;
  margin-top: 16px;
  font-family: "Courier New", Courier, monospace;
  text-align: center;
`

const InitialLoadingContainer = styled.div<{ $isLoading: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #000084;
  z-index: 9999;
  display: ${props => props.$isLoading ? 'block' : 'none'};
`

const Clock = styled.div`
  display: none;
`

const XLink = styled.a`
  font-family: "Courier New", Courier, monospace;
  font-weight: bold;
  font-size: 16px;
  color: rgba(255, 255, 255, 0.7);
  position: absolute;
  top: -24px;
  right: -16px;
  transform: translateY(-50%);
  padding: 0 16px;
  z-index: 2;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    color: #00FFEA;
  }

  @media (max-width: 875px) {
    display: none;
  }
`

const SearchedUserLink = styled.a`
  font-family: "Courier New", Courier, monospace;
  font-weight: bold;
  font-size: 16px;
  color: white;
  position: absolute;
  top: -24px;
  left: 120px;
  transform: translateY(-50%);
  padding: 0 16px;
  z-index: 2;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    color: #00FFEA;
  }

  @media (max-width: 875px) {
    top: -35px;
    left: 120px;
  }
`

const GlobalStyle = createGlobalStyle`
  @import url("https://fonts.googleapis.com/css?family=Press+Start+2P");

  body {
    overflow-y: auto;
    -webkit-overflow-scrolling: touch; // Per un migliore scrolling su iOS
    height: auto;
    min-height: 100vh;
  }

  @keyframes noise {
    0%, 100% { background-position: 0 0; }
    10% { background-position: -5% -10%; }
    20% { background-position: -15% 5%; }
    30% { background-position: 7% -25%; }
    40% { background-position: 20% 25%; }
    50% { background-position: -25% 10%; }
    60% { background-position: 15% 5%; }
    70% { background-position: 0 15%; }
    80% { background-position: 25% 35%; }
    90% { background-position: -10% 10%; }
  }

  @keyframes opacity {
    0% { opacity: 0.6; }
    20% { opacity: 0.3; }
    35% { opacity: 0.5; }
    50% { opacity: 0.8; }
    60% { opacity: 0.4; }
    80% { opacity: 0.7; }
    100% { opacity: 0.6; }
  }

  @keyframes scanlines {
    from {
      background: linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, 0.5) 51%);
      background-size: 100% 4px;
    }
    to {
      background: linear-gradient(to bottom, rgba(0, 0, 0, 0.5) 50%, transparent 51%);
      background-size: 100% 4px;
    }
  }

  @keyframes rgbText {
    0% {
      text-shadow: -1px 1px 8px rgba(255, 255, 255, 0.6), 1px -1px 8px rgba(255, 255, 235, 0.7), 0px 0 1px rgba(251, 0, 231, 0.8), 0 0px 3px rgba(0, 233, 235, 0.8), 0px 0 3px rgba(0, 242, 14, 0.8), 0 0px 3px rgba(244, 45, 0, 0.8), 0px 0 3px rgba(59, 0, 226, 0.8);
    }
    50% {
      text-shadow: -1px 1px 8px rgba(255, 255, 255, 0.6), 1px -1px 8px rgba(255, 255, 235, 0.7), -5px 0 1px rgba(251, 0, 231, 0.8), 0 -5px 1px rgba(0, 233, 235, 0.8), 5px 0 1px rgba(0, 242, 14, 0.8), 0 5px 1px rgba(244, 45, 0, 0.8), -5px 0 1px rgba(59, 0, 226, 0.8);
    }
    100% {
      text-shadow: -1px 1px 8px rgba(255, 255, 255, 0.6), 1px -1px 8px rgba(255, 255, 235, 0.7), 5px 0 1px rgba(251, 0, 231, 0.8), 0 -5px 1px rgba(0, 233, 235, 0.8), -5px 0 1px rgba(0, 242, 14, 0.8), 0 5px 1px rgba(244, 45, 0, 0.8), -5px 0 1px rgba(59, 0, 226, 0.8);
    }
  }
`

const PlayText = styled.div`
  position: absolute;
  left: 2rem;
  top: 2rem;
  font-family: "Press Start 2P", cursive;
  color: #fff;
  font-size: 2rem;
  animation: rgbText 2s steps(9) 0s infinite alternate;
  z-index: 2;
`

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  margin-bottom: 16px;
  position: relative;

  @media (max-width: 875px) {
    position: static;
    width: 100%;
  }
`

const SearchInput = styled.input<{ $hasError?: boolean }>`
  background: white;
  border: ${props => props.$hasError ? '2px solid #ff4040' : 'none'};
  border-radius: 4px;
  padding: 4px 8px;
  margin-right: 16px;
  font-family: Arial, sans-serif;
  font-size: 16px;
  letter-spacing: 1.5px;
  flex: 1;
  outline: none;
  color: ${props => props.$hasError ? '#ff4040' : 'inherit'};

  @media (max-width: 875px) {
    width: auto;
    font-size: ${props => props.$hasError ? '12px' : '16px'};
  }
`

const GoButton = styled.button`
  background: rgb(43, 255, 0);
  border: none;
  border-radius: 4px;
  padding: 4px 16px;
  font-family: "Courier New", Courier, monospace;
  font-weight: bold;
  font-size: 16px;
  color: blue;
  cursor: pointer;
`

const GreenStatTitle = styled.div`
  font-family: "Courier New", Courier, monospace;
  font-weight: bold;
  font-size: 16px;
  color:rgb(72, 255, 0);
`

const LoginContainer = styled.div`
  width: 100%;
  text-align: center;
  margin-top: 20px;
  color: white;
  font-family: 'Courier New, Courier, monospace';
  position: relative;
  z-index: 1;
  font-weight: bold;
  opacity: 0.7;
  cursor: pointer;

  @media (min-width: 769px) {
    position: fixed;
    top: 16px;
    left: 16px;
    width: auto;
    text-align: left;
    margin-top: 0;
  }
`

const FlickeringText = styled.span<{ $isFlickering: boolean }>`
  @keyframes flicker {
    0% { opacity: 1; }
    5% { opacity: 0; }
    10% { opacity: 1; }
    15% { opacity: 0; }
    20% { opacity: 1; }
    25% { opacity: 0; }
    30% { opacity: 1; }
    35% { opacity: 0; }
    40% { opacity: 1; }
    45% { opacity: 0; }
    50% { opacity: 1; }
    55% { opacity: 0; }
    60% { opacity: 1; }
    65% { opacity: 0; }
    70% { opacity: 1; }
    75% { opacity: 0; }
    80% { opacity: 1; }
    85% { opacity: 0; }
    90% { opacity: 1; }
    95% { opacity: 0; }
    100% { opacity: 1; }
  }
  
  animation: ${props => props.$isFlickering ? 'flicker 1s linear' : 'none'};
`

const HamburgerButton = styled.button`
  display: none;
  background: none;
  border: none;
  padding: 10px;
  cursor: pointer;
  position: absolute;
  top: -24px;
  right: 32px;
  transform: translateY(-50%);
  z-index: 999;

  @media (max-width: 875px) {
    display: block;
    top: -24px;
    right: -10px;
  }

  div {
    width: 20px;
    height: 2px;
    background-color: white;
    margin: 4px 0;
    transition: all 0.3s ease;
  }

  &.open {
    div:nth-child(1) {
      transform: rotate(-45deg) translate(-5px, 6px);
    }
    div:nth-child(2) {
      opacity: 0;
    }
    div:nth-child(3) {
      transform: rotate(45deg) translate(-5px, -6px);
    }
  }
`

const MobileMenu = styled.div<{ $isOpen: boolean }>`
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgb(5, 0, 98);
  background-image: radial-gradient(circle, rgba(0, 0, 0, 0.5) 1px, transparent 1px);
  background-size: 4px 4px;
  z-index: 998;
  transform: translateX(${props => props.$isOpen ? '0' : '100%'});
  transition: transform 0.15s ease-in-out;
  
  @media (max-width: 875px) {
    display: flex;
    flex-direction: column;
    justify-content: flex-end;
    align-items: flex-end;
    padding: 0 20px 40px 0;
  }
`

const MobileMenuItem = styled.button`
  font-family: "Courier New", Courier, monospace;
  font-weight: bold;
  font-size: 24px;
  color: white;
  background: none;
  border: none;
  padding: 8px;
  margin: 2px 0;
  cursor: pointer;
  transition: color 0.2s ease;
  text-align: right;
  width: 100%;

  &:hover {
    color: #00FFEA;
  }
`

const DesktopMenu = styled.div`
  display: flex;
  align-items: center;
  position: absolute;
  top: -24px;
  right: 20px;
  transform: translateY(-50%);
  z-index: 2;

  @media (max-width: 875px) {
    display: none;
  }
`

const DesktopMenuItem = styled.button<{ $isActive?: boolean }>`
  font-family: "Courier New", Courier, monospace;
  font-weight: bold;
  font-size: 16px;
  color: ${props => props.$isActive ? '#fff' : 'rgba(255, 255, 255, 0.7)'};
  background: none;
  border: none;
  padding: 0 10px;
  cursor: pointer;
  transition: color 0.2s ease;

  &:hover {
    color: ${props => props.$isActive ? '#fff' : '#00FFEA'};
  }
`

const SectionTitle = styled.div<{ $hasUsername?: boolean }>`
  font-family: "Courier New", Courier, monospace;
  font-weight: bold;
  font-size: 16px;
  color: white;
  text-align: center;
  margin: 16px 0 8px;

  span {
    color: ${props => props.$hasUsername ? '#00FFEA' : 'white'};
    cursor: ${props => props.$hasUsername ? 'pointer' : 'default'};
  }
`

const OverviewWrapper = styled.div`
  overflow-y: auto;
  height: auto;
  min-height: 100vh;

  @media (max-width: 875px) {
    overflow-y: auto;
    height: auto;
    min-height: 100vh;
  }
`

const OverviewGlobalStyle = createGlobalStyle`
  html, body {
    position: relative !important;
    overflow: auto !important;
    height: auto !important;
    width: 100% !important;
    margin: 0 !important;
    padding: 0 !important;
    -webkit-overflow-scrolling: touch !important;
  }
  
  body > div, 
  #__next {
    height: auto !important;
    min-height: 100vh !important;
    overflow: visible !important;
  }
`

const useTime = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const formatDate = (date: Date) => {
    // Otteniamo solo l'ora in UTC
    const utcHours = date.getUTCHours().toString().padStart(2, '0');
    const utcMinutes = date.getUTCMinutes().toString().padStart(2, '0');
    const utcSeconds = date.getUTCSeconds().toString().padStart(2, '0');
    
    return `${utcHours}:${utcMinutes}:${utcSeconds} UTC`;
  };

  return formatDate(time);
};

const formatTimestamp = (timestamp: string) => {
  // Esempio del timestamp da Supabase: "2024-02-25T16:37:52.693623"
  const [date, time] = timestamp.split('T');
  const [year, month, day] = date.split('-');
  const [hours, minutes, seconds] = time.split(':');
  
  // Array dei mesi abbreviati in minuscolo
  const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  
  // Prendiamo solo i primi due caratteri dei secondi (ignoriamo i millisecondi)
  const formattedSeconds = seconds.split('.')[0];
  
  // Formattiamo la stringa nel formato desiderato
  return `${parseInt(day)} ${months[parseInt(month) - 1]} ${hours}:${minutes}:${formattedSeconds} UTC`;
};

const formatNumber = (num: string | number) => {
  // Converti in numero se è una stringa
  const value = typeof num === 'string' ? parseFloat(num) : num;
  // Formatta il numero con virgole per le migliaia e 2 decimali
  return value.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

const handleTwitterLink = (username: string) => {
  const twitterUrl = `https://x.com/${username}`;
  const twitterAppUrl = `twitter://user?screen_name=${username}`;

  const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

  if (isMobile) {
    // Previeni il comportamento predefinito
    const preventBrowserOpen = (e: Event) => {
      e.preventDefault();
      e.stopPropagation();
      window.removeEventListener('visibilitychange', preventBrowserOpen);
    };
    window.addEventListener('visibilitychange', preventBrowserOpen);

    // Usa location.href invece di iframe
    try {
      window.location.href = twitterAppUrl;
      
      // Fallback al browser solo se l'app non si apre dopo un timeout
      setTimeout(() => {
        if (!document.hidden) {
          window.removeEventListener('visibilitychange', preventBrowserOpen);
          window.location.href = twitterUrl;
        }
      }, 1000);
    } catch (e) {
      window.location.href = twitterUrl;
    }
  } else {
    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
  }
};

export default function Home() {
  const { data: session, status } = useSession()
  const { userData, isLoading, error: userDataError } = useUserData()
  const [activeTab, setActiveTab] = useState("balance")
  const [userBalance, setUserBalance] = useState<number | null>(null)
  const [userBalanceUsd, setUserBalanceUsd] = useState<string | null>(null)
  const [lastUpdate, setLastUpdate] = useState<string | null>(null)
  const [treasuryData, setTreasuryData] = useState<TreasuryData>({ amount: "0.0000", usdAmount: "0.00" })
  const [burnedData, setBurnedData] = useState<BurnedData>({ amount: "0.0000", usdAmount: "0.00" })
  const [isPageLoading, setIsPageLoading] = useState(true)
  const [volumeData, setVolumeData] = useState<VolumeData>({ 
    amount: "0.0000", 
    usdAmount: "0.00",
    amount24h: "0.0000",
    usdAmount24h: "0.00"
  })
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)
  const [searchText, setSearchText] = useState<string>("@")
  const [searchError, setSearchError] = useState<string | null>(null)
  const [searchedUsername, setSearchedUsername] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const time = useTime();
  const [isBalanceFlickering, setIsBalanceFlickering] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    setIsPageLoading(false)
  }, [])

  useEffect(() => {
    async function fetchUserBalance() {
      if (status === 'authenticated' && session?.user?.name) {
        try {
          const response = await fetch('/api/user', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              username: session.user.name.toLowerCase()
            })
          });

          const data = await response.json();
          
          if (data) {
            setUserBalance(data.balance);
            setUserBalanceUsd(data.balanceUsd);
            
            // Formatta il timestamp
            const date = new Date(data.updated_at);
            const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
            const day = date.getUTCDate();
            const month = months[date.getUTCMonth()];
            const hours = date.getUTCHours().toString().padStart(2, '0');
            const minutes = date.getUTCMinutes().toString().padStart(2, '0');
            const seconds = date.getUTCSeconds().toString().padStart(2, '0');
            
            const formattedDate = data.updated_at.replace('T', ' ').slice(0, 19) + ' UTC';
            setLastUpdate(formattedDate);
          }
        } catch (error) {
          console.error('Error:', error);
        }
      }
    }

    fetchUserBalance();
  }, [status, session]);

  useEffect(() => {
    async function fetchTreasuryData() {
      try {
        const response = await fetch('/api/treasury')
        if (!response.ok) throw new Error('Network response was not ok')
        const data = await response.json()
        setTreasuryData(data)
      } catch (error) {
        console.error('Error fetching treasury data:', error)
      }
    }

    fetchTreasuryData()
  }, [])

  useEffect(() => {
    async function fetchBurnedData() {
      try {
        const response = await fetch('/api/burned')
        if (!response.ok) throw new Error('Network response was not ok')
        const data = await response.json()
        setBurnedData(data)
      } catch (error) {
        console.error('Error fetching burned data:', error)
      }
    }

    fetchBurnedData()
  }, [])

  useEffect(() => {
    async function fetchVolumeData() {
      try {
        const response = await fetch('/api/volume')
        if (!response.ok) throw new Error('Network response was not ok')
        const data = await response.json()
        setVolumeData(data)
      } catch (error) {
        console.error('Error fetching volume data:', error)
      }
    }

    fetchVolumeData()
  }, [])

  useEffect(() => {
    // Nascondi il contenuto iniziale dopo che il componente è montato
    const timer = setTimeout(() => {
      setIsInitialLoading(false)
    }, 100)

    return () => clearTimeout(timer)
  }, [])

  useEffect(() => {
    // Metti il focus sul campo di input quando il componente viene montato
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);

  const stats: Stats = {
    treasury: { 
      amount: treasuryData.amount, 
      delta: `$${treasuryData.usdAmount}` 
    },
    burned: { 
      amount: burnedData.amount, 
      delta: `$${burnedData.usdAmount}` 
    },
    globalVol: { 
      amount: volumeData.amount, 
      delta: `$${volumeData.usdAmount}` 
    },
    dayVol: { 
      amount: volumeData.amount24h, 
      delta: `$${volumeData.usdAmount24h}` 
    },
    token: {
      symbol: "BORX",
      lastUpdate: lastUpdate || "00 00:00:00 UTC",
      balance: Number(userBalance).toFixed(2),
      delta: `$${userBalanceUsd}`,
    },
  }

  const handleLogin = async () => {
    console.log("=== LOGIN FLOW START ===")
    try {
      await signIn("twitter", {
        callbackUrl: '/',
        redirect: true,
        prompt: 'consent',
        force_login: false
      })
    } catch (error) {
      console.error("Login error:", error)
    }
  }

  const handleLogout = () => {
    signOut({ callbackUrl: '/' })
  }

  const handleSearch = async () => {
    setSearchError(null);
    
    if (searchText === '@' || searchText.length <= 1) {
      setSearchError("Enter a username");
      return;
    }

    // Rimuovi la @ e valida l'username
    const username = searchText.substring(1);
    
    // Validazione lunghezza e caratteri
    if (username.length < 4 || username.length > 14) {
      setSearchText("Oops! Invalid username.");
      setSearchError("Username must be between 4 and 15 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setSearchText("Oops! Invalid username.");
      setSearchError("Username can only contain letters, numbers and underscore");
      return;
    }

    try {
      const username = searchText.substring(1).toLowerCase();
      
      const response = await fetch('/api/user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: username
        })
      });

      const data = await response.json();
      
      if (data.error) {
        setSearchError(data.error);
        setSearchedUsername(null);
        return;
      }

      setUserBalance(data.balance);
      setLastUpdate(formatTimestamp(data.updated_at) || "00 00:00:00 UTC");
      setSearchedUsername(username);
      
    } catch (error) {
      console.error('Error:', error);
      setSearchError("Error searching for user");
      setSearchedUsername(null);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchError(null); // Resetta l'errore quando l'utente digita
    
    if (value.startsWith('@')) {
      setSearchText(value);
    } else {
      setSearchText('@' + value.replace('@', ''));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  if (isInitialLoading) {
    return <InitialLoadingContainer $isLoading={isInitialLoading} />
  }

  return (
    <OverviewWrapper>
      <OverviewGlobalStyle />
      <RetroBackground key={Date.now()} />
      <GlobalStyle />
      <SessionProvider>
        <ErrorBoundary>
          <PageContainer $isLoading={isPageLoading}>
            <Container>
              <BlueRectangle>
                <BorderContainer>
                  <InnerBorder>
                    {isLoading ? (
                      <LoadingSpinner />
                    ) : (
                      <>
                        <SearchContainer>
                          <SearchInput 
                            ref={inputRef}
                            type="text" 
                            value={searchError ? "Oops! Invalid username." : searchText}
                            onChange={handleInputChange}
                            onKeyPress={handleKeyPress}
                            $hasError={!!searchError}
                            onFocus={() => {
                              if (searchError) {
                                setSearchError(null);
                                setSearchText('@');
                              }
                            }}
                          />
                          <GoButton onClick={handleSearch}>Search</GoButton>
                        </SearchContainer>
                        <Title>Boring Layer</Title>
                        <Clock>{time}</Clock>
                        <XLink 
                          onClick={(e) => {
                            e.preventDefault();
                            handleTwitterLink('boringlayer');
                          }}
                          style={{ cursor: 'pointer' }}
                        >
                          X
                        </XLink>

                        <DesktopMenu>
                          <DesktopMenuItem 
                            onClick={() => router.push('/')}
                            $isActive={false}
                          >
                            Ranking
                          </DesktopMenuItem>
                          <DesktopMenuItem 
                            onClick={() => router.push('/transactions')}
                            $isActive={false}
                          >
                            Transactions
                          </DesktopMenuItem>
                          <DesktopMenuItem 
                            onClick={() => router.push('/overview')}
                            $isActive={true}
                          >
                            Overview
                          </DesktopMenuItem>
                        </DesktopMenu>
                        <HamburgerButton 
                          onClick={() => setIsMenuOpen(!isMenuOpen)} 
                          className={isMenuOpen ? 'open' : ''}
                        >
                          <div></div>
                          <div></div>
                          <div></div>
                        </HamburgerButton>

                        <MobileMenu $isOpen={isMenuOpen}>
                          <MobileMenuItem onClick={() => {
                            router.push('/');
                            setIsMenuOpen(false);
                          }}>
                            Ranking
                          </MobileMenuItem>
                          <MobileMenuItem onClick={() => {
                            router.push('/transactions');
                            setIsMenuOpen(false);
                          }}>
                            Transactions
                          </MobileMenuItem>
                          <MobileMenuItem onClick={() => {
                            router.push('/overview');
                            setIsMenuOpen(false);
                          }}>
                            Overview
                          </MobileMenuItem>
                          <MobileMenuItem 
                            onClick={(e) => {
                              e.preventDefault();
                              handleTwitterLink('boringlayer');
                              setIsMenuOpen(false);
                            }}
                          >
                            Boring X
                          </MobileMenuItem>
                        </MobileMenu>

                        <SectionTitle $hasUsername={!!searchedUsername}>
                          Account Stats
                          {searchedUsername && (
                            <span 
                              onClick={(e) => {
                                e.preventDefault();
                                handleTwitterLink(searchedUsername);
                              }}
                              style={{ cursor: 'pointer' }}
                            >
                              {" "}@{searchedUsername}
                            </span>
                          )}
                        </SectionTitle>
                        <TokenContainer>
                          <TokenInner>
                            <TokenBox>
                              <GreenStatTitle>Label</GreenStatTitle>
                              <StatValue>Boring Points</StatValue>
                            </TokenBox>
                            <TokenBox $align="center">
                              <StatTitle style={{ color: '#00FFEA' }}>
                                <FlickeringText $isFlickering={isBalanceFlickering}>
                                  *** BALANCE ***
                                </FlickeringText>
                              </StatTitle>
                              <StatValue>{formatNumber(stats.token.balance)} BP</StatValue>
                            </TokenBox>
                            <TokenBox $align="right">
                              <GreenStatTitle>Last Update</GreenStatTitle>
                              <StatValue>
                                {lastUpdate || "00 00:00:00 UTC"}
                              </StatValue>
                            </TokenBox>
                          </TokenInner>
                        </TokenContainer>

                        <SectionTitle>Boring Layer Stats</SectionTitle>
                        <StatsContainer>
                          <StatsInner>
                            <StatBox>
                              <StatTitle>AllTimeVol</StatTitle>
                              <StatValue>{formatNumber(stats.globalVol.amount)} BP</StatValue>
                            </StatBox>
                            <StatBox>
                              <StatTitle>24hVol</StatTitle>
                              <StatValue>{formatNumber(stats.dayVol.amount)} BP</StatValue>
                            </StatBox>
                            <StatBox>
                              <StatTitle>Reserve</StatTitle>
                              <StatValue>{formatNumber(stats.treasury.amount)} BP</StatValue>
                            </StatBox>
                            <StatBox>
                              <StatTitle>Burned</StatTitle>
                              <StatValue>{formatNumber(stats.burned.amount)} BP</StatValue>
                            </StatBox>
                          </StatsInner>
                        </StatsContainer>
                      </>
                    )}
                  </InnerBorder>
                </BorderContainer>
              </BlueRectangle>
            </Container>
          </PageContainer>
        </ErrorBoundary>
      </SessionProvider>

      <div style={{ 
        width: '100%', 
        textAlign: 'center', 
        marginTop: '20px',
        color: 'white',
        fontFamily: 'Courier New, Courier, monospace',
        position: 'relative',
        zIndex: 1,
        fontWeight: 'bold',
        opacity: '0.7',
        cursor: 'pointer'
      }}>
        {session ? (
          <span onClick={handleLogout}>@{session.user?.name}</span>
        ) : (
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <ComingSoonTooltip isVisible={hoveredButton === 'login'} text="COMING SOON" />
            <span 
              onMouseEnter={() => setHoveredButton('login')}
              onMouseLeave={() => setHoveredButton(null)}
            >
              Login
            </span>
          </div>
        )}
      </div>
    </OverviewWrapper>
  )
}

