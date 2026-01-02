"use client"

import { useState, useEffect, useRef } from "react"
import styled from "styled-components"
import { useSession, signIn, signOut } from "next-auth/react"
import { useRouter } from 'next/navigation'
import RetroBackground from './components/RetroBackground'
import { SessionProvider } from 'next-auth/react'
import { ErrorBoundary } from './components/ErrorBoundary'
import LoadingSpinner from './components/LoadingSpinner'
import ComingSoonTooltip from './components/ComingSoonTooltip'
import WaveBackground from './components/WaveBackground'

// Aggiungi questo styled component all'inizio del file, dopo gli import
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

// Aggiungi tutti gli styled components necessari
const PageContainer = styled.div<{ $isLoading: boolean }>`
  visibility: ${props => props.$isLoading ? 'hidden' : 'visible'};
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
    margin: 20 auto;
    min-height: 410px;
    box-shadow: none;
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
  cursor: pointer;

  &:hover {
    color: #00FFEA;
  }

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

// Aggiungi questa interfaccia per il tipo
interface TableContainerProps {
  $isStylesLoaded: boolean;
}

// Modifica la definizione del componente styled aggiungendo il tipo
const TableContainer = styled(BorderContainer)<TableContainerProps>`
  margin-top: 16px;
  height: 550px;
  visibility: ${props => props.$isStylesLoaded ? 'visible' : 'hidden'};
  
  @media (max-width: 875px) {
    height: calc(100vh - 200px); // Altezza dinamica per mobile
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
`

const TableInner = styled(InnerBorder)`
  padding: 0px;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;

  @media (max-width: 875px) {
    flex: 1;
    width: 100%;
    display: block;
    padding: 0;
  }
`

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: "Courier New", Courier, monospace;
  background: transparent;
  table-layout: fixed;

  @media (max-width: 875px) {
    width: 100%;
    display: table;
    border-spacing: 0;
    border-collapse: collapse;
    
    th:first-child,
    td:first-child {
      width: 15%;
      min-width: 45px;
      padding-right: 0px;
    }
    
    th:nth-child(2),
    td:nth-child(2) {
      padding-left: 0 !important;
      position: relative;
      left: 5px !important;
      width: 59%;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    th:last-child,
    td:last-child {
      width: 47%;
      padding-right: 7px;
      padding-left: 5px;
      white-space: nowrap;
    }
  }
`

const HeaderBand = styled.div`
  position: absolute;
  top: 3px;
  left: 0;
  right: 8px;
  height: 37px;
  background: rgb(5, 0, 98);
  z-index: 1;
  transform: translateX(5px);
`

const StyledThead = styled.thead`
  position: sticky;
  top: 0;
  width: 100%;
  z-index: 2;
  
  @media (max-width: 875px) {
    display: table-header-group;
  }
`

const StyledTh = styled.th`
  font-size: 16px;
  color: #00FFEA;
  text-align: left;
  padding: 8px 16px;

  &:first-child {  // Colonna "Ranking"
    @media (max-width: 875px) {
      transform: translateX(-10px);  // Sposta il titolo a sinistra su mobile
    }
  }

  &:nth-child(2) {  // Colonna "Account"
    transform: translateX(-120px);  // Desktop: sposta a sinistra

    @media (max-width: 875px) {
      visibility: hidden;  // Nascondi il titolo su mobile
    }
  }

  &:last-child {  // Colonna "Balance"
    text-align: right;  // Allinea il titolo a destra
  }
`

const TableRow = styled.tr<{ $isHighlighted?: boolean }>`
  background: ${props => props.$isHighlighted ? 'rgb(43, 255, 0)' : 'transparent'};
  cursor: pointer;
  width: 100%;

  &:hover {
    background: rgb(0, 255, 234);
    td {
      color: rgba(0, 0, 158, 1) !important;
      font-weight: bold;
    }
  }

  ${props => props.$isHighlighted && `
    td {
      color: rgba(0, 0, 158, 1);
    }
    &:hover {
      background: rgb(43, 255, 0);
    }
  `}
`

const TableCell = styled.td`
  padding: 4px 16px;
  color: white;
  text-align: left;

  @media (max-width: 875px) {
    font-weight: bold;  // Grassetto su mobile
    
    &:first-child {  // Colonna Ranking su mobile
      padding-left: 2px;  // Riduci il padding sinistro su mobile
    }
  }

  &:nth-child(2) {  // Colonna Account
    transform: translateX(-120px);  // Desktop: sposta a sinistra

    @media (max-width: 875px) {
      transform: translateX(-4px);  // Mobile: sposta a destra
    }
  }

  &:last-child {  // Colonna Balance
    text-align: right;  // Allinea i dati a destra
  }
`

const UsernameLink = styled.a`
  color: inherit;
  text-decoration: none;
  cursor: pointer;

  &:hover {
    color: #00FFEA;
  }

  ${TableRow}:hover &,
  ${TableRow}[data-searched="true"] & {
    color: rgba(0, 0, 158, 1);
  }
`

const BackButton = styled.button`
  font-family: "Courier New", Courier, monospace;
  font-weight: bold;
  font-size: 16px;
  color: white;
  background: none;
  border: none;
  cursor: pointer;
  position: absolute;
  top: -24px;
  right: -16px;
  transform: translateY(-50%);
  padding: 0 16px;
  z-index: 2;

  &:hover {
    color: #00FFEA;
  }
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
    color: ${props => props.$isActive ? '#fff' : '#00FFEA'};  // Nessun effetto hover se attivo
  }
`

interface UserBalance {
  username: string;
  balance: number;
  globalPosition?: number;
}

const formatNumber = (num: number) => {
  return num.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  });
};

// Aggiungi questo styled component dopo gli altri styled components
const ErrorMessage = styled.div`
  color: #ff4040;
  font-size: 10px;
  font-family: "Courier New", Courier, monospace;
  position: absolute;
  bottom: -20px;
  left: 0;
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
`;

// Modifica il componente styled per il numero di posizione
const RankNumber = styled.td`
  color: #00FFEA;  // Imposta tutti i numeri in azzurro
  font-weight: bold;
  text-align: left;  // Allinea a sinistra
  width: 32px;
  display: flex;
  align-items: center;
  justify-content: space-between;  // Spazio tra numero e stellina
`;

// Aggiungi questa nuova classe CSS
const StarSpan = styled.span`
  font-size: 0.7em;
  
  @media (max-width: 875px) {
    position: relative;
    left: -7px;  // Questo valore può essere modificato per spostare la stellina
  }
`;

// Modifica la funzione getStarIcon per usare il nuovo componente
const getStarIcon = (rank: number) => {
  switch (rank) {
    case 1:
      return <StarSpan style={{ color: 'gold' }}>⭐</StarSpan>;
    case 2:
      return <StarSpan style={{ color: 'silver' }}>⭐</StarSpan>;
    case 3:
      return <StarSpan style={{ color: '#cd7f32' }}>⭐</StarSpan>;
    default:
      return '';
  }
};

// Modifica il componente styled per il nome dell'account
const AccountName = styled.span<{ $isHighlighted?: boolean }>`
  color: ${props => props.$isHighlighted ? 'rgba(0, 0, 158, 1)' : 'white'};
  font-weight: bold;

  ${TableRow}:hover & {
    color: rgba(0, 0, 158, 1) !important;
  }
`;

export default function Top100() {
  const { data: session, status } = useSession()
  const [users, setUsers] = useState<UserBalance[]>([])
  const [searchText, setSearchText] = useState<string>("@")
  const [searchError, setSearchError] = useState<string | null>(null)
  const [hoveredButton, setHoveredButton] = useState<string | null>(null)
  const router = useRouter()
  const inputRef = useRef<HTMLInputElement>(null)
  const [pageState, setPageState] = useState({
    isLoading: true,
    isReady: false
  });
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleSearch = async () => {
    setSearchError(null);
    
    if (searchText === '@' || searchText.length <= 1) {
      setSearchError("Enter a username");
      return;
    }

    // Rimuovi la @ e valida l'username
    const username = searchText.substring(1);
    
    // Validazione lunghezza e caratteri
    if (username.length < 4 || username.length > 15) {
      setSearchText("Username must be between 4 and 15 characters");
      setSearchError("Username must be between 4 and 15 characters");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setSearchText("Username can only contain letters, numbers and underscore");
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
        return;
      }

      fetchUsers(username);
      
    } catch (error) {
      console.error('Error:', error);
      setSearchError("Error searching for user");
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

  const fetchUsers = async (searchUsername?: string) => {
    try {
      setPageState(prev => ({ ...prev, isLoading: true }));
      
      let url = '/api/top100?noLimit=true';
      
      if (searchUsername) {
        url = `/api/top100?search=${searchUsername}&noLimit=true`;
      }
      console.log('🔍 Fetching URL:', url);

      const response = await fetch(url);
      console.log('📡 Response status:', response.status);
      
      console.log('📨 Response headers:', {
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length')
      });

      const text = await response.text();
      console.log('📝 Raw response:', text);
      
      const data = JSON.parse(text);
      console.log('📦 Parsed data:', {
        length: data.length,
        firstItem: data[0],
        lastItem: data[data.length - 1],
        isArray: Array.isArray(data),
        type: typeof data
      });

      setUsers(data);

      if (searchUsername) {
        setTimeout(() => {
          const userRow = document.getElementById(`user-${searchUsername}`);
          if (userRow) {
            const container = document.querySelector('.table-inner');
            if (container) {
              const rowPosition = userRow.offsetTop;
              const containerHeight = container.clientHeight;
              container.scrollTop = Math.max(0, rowPosition - (containerHeight * 0.1));
            }
          }
        }, 100);
      }
    } catch (error) {
      console.error('❌ Error details:', error);
      setUsers([]);
    } finally {
      setPageState(prev => ({ ...prev, isLoading: false }));
    }
  };

  useEffect(() => {
    let isMounted = true;

    const loadData = async () => {
      try {
        console.log('🚀 Initial data load starting...');
        const response = await fetch('/api/top100?noLimit=true');
        console.log('📡 Initial load response status:', response.status);
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('📦 Initial load data length:', data.length);
        console.log('🔍 Initial load first 5 items:', data.slice(0, 5));
        console.log('🔍 Initial load last 5 items:', data.slice(-5));
        console.log('🔍 Initial load response headers:', Object.fromEntries(response.headers.entries()));
        
        if (isMounted) {
          setUsers(data);
          setPageState(prev => ({ ...prev, isReady: true }));
        }
      } catch (error) {
        console.error('❌ Error in loadData:', error);
        if (isMounted) {
          setUsers([]);
          setPageState(prev => ({ ...prev, isReady: true }));
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    console.log('Initial render');
    const thead = document.querySelector('thead');
    console.log('Thead styles:', thead ? getComputedStyle(thead) : 'not found');
  }, []);

  useEffect(() => {
    console.log('Users loaded:', users.length);
  }, [users]);

  useEffect(() => {
    console.log("Rendering StyledThead");
    
    setTimeout(() => {
      const balanceHeader = document.querySelector('th:last-child');
      if (balanceHeader) {
        const styles = window.getComputedStyle(balanceHeader);
        console.log("Balance header computed styles:", {
          textAlign: styles.textAlign,
          width: styles.width
        });
      }
    }, 100);
  }, [users]);

  const handleNavigation = (tab: string) => {
    if (tab.toLowerCase() === 'overview') {
      router.replace('/');
    }
  };

  // Sostituisci la dichiarazione diretta del MutationObserver con una versione sicura per il server
  const observer = typeof window !== 'undefined' 
    ? new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
          if (mutation.type === 'attributes' && mutation.attributeName === 'style') {
            console.log('Style changed:', mutation.target);
          }
        });
      })
    : null;

  useEffect(() => {
    if (!observer) return; // Skip if running on server

    const thead = document.querySelector('thead');
    if (thead) {
      observer.observe(thead, { attributes: true });
    }
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const balanceHeader = document.querySelector('th:last-child');
    if (balanceHeader) {
      console.log('Momento del render:', {
        usersLength: users.length,
        isLoading: pageState.isLoading,
        styles: window.getComputedStyle(balanceHeader),
        stack: new Error().stack
      });
    }
  }, [users, pageState.isLoading]);

  useEffect(() => {
    console.log('Render cycle:', {
      phase: 'start',
      timestamp: Date.now(),
      usersLength: users.length,
      isLoading: pageState.isLoading,
      isReady: pageState.isReady
    });

    return () => {
      console.log('Render cycle:', {
        phase: 'cleanup',
        timestamp: Date.now(),
        usersLength: users.length,
        isLoading: pageState.isLoading,
        isReady: pageState.isReady
      });
    };
  }, [users, pageState.isLoading, pageState.isReady]);

  useEffect(() => {
    // Nascondi il contenuto iniziale dopo che il componente è montato
    const timer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  // Aggiungi questa funzione all'inizio del componente Top100
  const handleTwitterLink = (username: string) => {
    const twitterUrl = `https://x.com/${username}`;
    const twitterAppUrl = `twitter://user?screen_name=${username}`;

    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      // Approccio più semplice e affidabile per dispositivi mobili
      try {
        window.location.href = twitterAppUrl;
      } catch (e) {
        // Fallback al browser se qualcosa va storto
        window.open(twitterUrl, '_blank', 'noopener,noreferrer');
      }
    } else {
      // Su desktop, apri nel browser
      window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <InitialLoadingContainer $isLoading={isInitialLoading} />
      <div>
        <WaveBackground />
        <RetroBackground key={Date.now()} />
        <SessionProvider>
          <ErrorBoundary>
            <PageContainer $isLoading={!pageState.isReady}>
              <Container>
                <BlueRectangle>
                  <BorderContainer>
                    <InnerBorder>
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
                      <Title onClick={() => router.push('/')}>Boring Layer</Title>
                      <XLink 
                        onClick={(e) => {
                          e.preventDefault();
                          handleTwitterLink('boringlayer');
                        }}
                      >
                        X
                      </XLink>
                      <DesktopMenu>
                        <DesktopMenuItem 
                          onClick={() => router.push('/')}
                          $isActive={true}
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
                          $isActive={false}
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

                      <TableContainer $isStylesLoaded={pageState.isReady}>
                        <TableInner className="table-inner">
                          <HeaderBand />
                          <StyledTable>
                            <StyledThead>
                              <tr>
                                <StyledTh>
                                  <span className="desktop-title">Ranking</span>
                                </StyledTh>
                                <StyledTh>
                                  <span className="desktop-title">Account</span>
                                </StyledTh>
                                <StyledTh>Balance</StyledTh>
                              </tr>
                            </StyledThead>
                            <tbody>
                              {users.map((user, index) => {
                                const isSearched = searchText.substring(1).toLowerCase() === user.username.toLowerCase();
                                const position = user.globalPosition || index + 1;
                                
                                return (
                                  <TableRow 
                                    key={user.username}
                                    id={`user-${user.username}`}
                                    $isHighlighted={isSearched}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      handleTwitterLink(user.username);
                                    }}
                                  >
                                    <TableCell>
                                      <RankNumber>
                                        {position} {getStarIcon(position)}
                                      </RankNumber>
                                    </TableCell>
                                    <TableCell>
                                      <AccountName $isHighlighted={isSearched}>
                                        @{user.username}
                                      </AccountName>
                                    </TableCell>
                                    <TableCell>{formatNumber(user.balance)} BP</TableCell>
                                  </TableRow>
                                );
                              })}
                            </tbody>
                          </StyledTable>
                        </TableInner>
                      </TableContainer>
                    </InnerBorder>
                  </BorderContainer>
                </BlueRectangle>
              </Container>
            </PageContainer>
          </ErrorBoundary>
        </SessionProvider>
      </div>
    </>
  )
} 