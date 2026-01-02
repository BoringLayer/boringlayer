"use client"

import { useState, useEffect, useRef } from "react"
import styled from "styled-components"
import { useRouter } from 'next/navigation'
import { createClient } from '@supabase/supabase-js'
import RetroBackground from '../components/RetroBackground'
import WaveBackground from '../components/WaveBackground'

// Inizializza il client Supabase
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Interfaccia per le transazioni
interface Transaction {
  'Twitt ID': string
  Sender: string
  Recipient: string
  Amount: number
  Net_sent: number
  Fees: number
  Burned: number
  Date: string
  isHighlighted?: boolean // Per evidenziare le righe che corrispondono all'ID cercato
}

// Aggiungi i componenti styled necessari
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
  padding-right: 16px;
`

// Componenti styled specifici per Transactions
const LastTxButton = styled.button`
  background: rgb(43, 255, 0);
  border: none;
  border-radius: 4px;
  padding: 4px 16px;
  font-family: "Courier New", Courier, monospace;
  font-weight: bold;
  font-size: 16px;
  color: blue;
  cursor: pointer;
  margin-left: 8px;

  @media (max-width: 875px) {
    display: none;
  }
`

// Modifica l'interfaccia TableContainerProps
interface TableContainerProps {
  $isStylesLoaded: boolean;
}

const TableContainer = styled(BorderContainer)<TableContainerProps>`
  margin-top: 16px;
  height: 550px;
  visibility: ${props => props.$isStylesLoaded ? 'visible' : 'hidden'};
  
  @media (max-width: 875px) {
    height: calc(100vh - 200px);
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }
`

const SearchContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  margin-bottom: 16px;
  position: relative;
  padding-right: 0;

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
  margin-right: 0;
  font-family: Arial, sans-serif;
  font-size: 16px;
  letter-spacing: 1.5px;
  flex: 1;
  outline: none;
  color: ${props => props.$hasError ? '#ff4040' : 'inherit'};
  width: 100%;

  @media (max-width: 875px) {
    width: 100%;
  }
`

const GoButton = styled.button`
  display: none;
`

const LastTnxButton = styled.button`
  display: none;
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

const TableInner = styled(InnerBorder)`
  padding: 0px;
  height: 100%;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
  padding-bottom: 16px;

  @media (max-width: 875px) {
    flex: 1;
    width: 100%;
    display: block;
    padding: 0;
    padding-bottom: 16px;
    overflow-x: auto;
  }
`

const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  font-family: "Courier New", Courier, monospace;
  background: transparent;
  table-layout: fixed;
  padding: 0 16px;

  @media (max-width: 875px) {
    min-width: 1000px;  // Aumenta la larghezza minima per la tabella su mobile
  }
`

const HeaderBand = styled.div`
  position: absolute;
  top: 3px;
  left: 0;
  right: 8px;
  height: 20px;
  background: rgb(5, 0, 98);
  z-index: 1;
  transform: translateX(5px);
`

const StyledThead = styled.thead`
  position: sticky;
  top: 3px;
  width: 100%;
  z-index: 2;
  
  @media (max-width: 875px) {
    display: table-header-group;
    top: 2px;
  }
`

const StyledTh = styled.th`
  text-align: left;
  font-size: 14px;
  color: #00FFEA;
  white-space: nowrap;

  &:first-child {  // ID column
    width: 100px;
    padding-left: 8px;
  }

  &:nth-child(2) {  // Sender column
    width: 15%;
    text-align: right;
    transform: translateX(75px);
  }

  &:nth-child(3) {  // Recipient column
    width: 15%;
    text-align: right;
    transform: translateX(85px);
  }

  &:nth-child(4) {  // Sent column
    width: 12%;
    text-align: right;
    transform: translateX(75px);
  }

  &:nth-child(5) {  // Net Sent column
    width: 12%;
    text-align: right;
    transform: translateX(55px);
  }

  &:nth-child(6) {  // Reserve column
    width: 12%;
    text-align: right;
    transform: translateX(10px);  // Puoi modificare questo valore per spostare la colonna
  }

  &:nth-child(7) {  // Burned column
    width: 12%;
    text-align: right;
    transform: translateX(-40px);  // Puoi modificare questo valore per spostare la colonna
  }

  &:last-child {  // Timestamp column
    width: 200px;  // Mantieni la larghezza
    text-align: right;
    padding-right: 16px;
    transform: translateX(10px);  // Sposta più a sinistra
  }

  @media (max-width: 875px) {
    &:first-child {  // ID column
      width: 10%;
      padding-left: 18px;  // Aumenta questo valore per spostare il titolo ID più a destra
    }

    &:nth-child(2) {  // Sender column
      width: 15%;  // Imposta la larghezza
    }

    &:nth-child(3) {  // Recipient column
      width: 13%;  // Imposta la larghezza
    }

    &:nth-child(4) {  // Sent column
      width: 11%;  // Imposta la larghezza
    }

    &:nth-child(5) {  // Net Sent column
      width: 12%;  // Imposta la larghezza
    }

    &:nth-child(6) {  // Reserve column
      width: 11%;  // Imposta la larghezza
    }

    &:nth-child(7) {  // Burned column
      width: 11%;  // Imposta la larghezza
    }

    &:last-child {  // Timestamp column
      width: 20%;  // Imposta la larghezza
      text-align: right;
      padding-left: 105px;  // Aggiungi padding per spostare a destra
    }
  }
`

const TableRow = styled.tr<{ $isHighlighted?: boolean }>`
  position: relative;
  cursor: pointer;
  width: 100%;
  background: ${props => props.$isHighlighted ? 'rgb(43, 255, 0)' : 'transparent'};
  
  &:hover {
    background: rgb(0, 255, 234);
    td {
      color: rgba(0, 0, 158, 1) !important;
      font-weight: bold;
    }
  }

  ${props => props.$isHighlighted && `
    td {
      color: rgb(5, 0, 98);
    }
    &:hover {
      background: rgb(43, 255, 0);
    }
  `}
`

const TableCell = styled.td`
  font-size: 14px;
  color: #fff;
  white-space: nowrap;
  position: relative;

  @media (max-width: 875px) {
    font-weight: bold;
    transform: translateX(10px);  // Sposta a destra
  }

  &:first-child {  // ID column
    width: 100px;
    padding-left: 8px;
    position: relative;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 1px;
      height: 100%;
      background-color: white;
      transform: translateX(73px);  // Questo valore sposta la linea
    }
  }

  @media (max-width: 875px) {
    &:first-child {  // ID column
      width: 15%;
      &::after {
        transform: translateX(75px);  // Riduci questo valore per avvicinare la linea verticale
      }
    }

    &:nth-child(2) {  // Sender column
      transform: translateX(10px);  // Sposta la colonna Sender più vicino all'ID
    }
  }

  &:nth-child(2) {  // Sender column
    width: 15%;
    text-align: right;
    transform: translateX(75px);
    position: relative;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 1px;
      height: 100%;
      background-color: white;
      transform: translateX(5px);
    }
  }

  &:nth-child(3) {  // Recipient column
    width: 15%;
    text-align: right;
    transform: translateX(85px);
    position: relative;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 1px;
      height: 100%;
      background-color: white;
      transform: translateX(5px);
    }
  }

  &:nth-child(4) {  // Sent column
    width: 12%;
    text-align: right;
    transform: translateX(75px);
    position: relative;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 1px;
      height: 100%;
      background-color: white;
      transform: translateX(5px);
    }
  }

  &:nth-child(5) {  // Net Sent column
    width: 12%;
    text-align: right;
    transform: translateX(55px);
    position: relative;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 1px;
      height: 100%;
      background-color: white;
      transform: translateX(5px);
    }
  }

  &:nth-child(6) {  // Reserve column
    width: 12%;
    text-align: right;
    transform: translateX(10px);
    position: relative;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 1px;
      height: 100%;
      background-color: white;
      transform: translateX(5px);
    }
  }

  &:nth-child(7) {  // Burned column
    width: 12%;
    text-align: right;
    transform: translateX(-40px);
    position: relative;

    &::after {
      content: '';
      position: absolute;
      top: 0;
      right: 0;
      width: 1px;
      height: 100%;
      background-color: white;
      transform: translateX(5px);
    }
  }

  &:last-child {  // Timestamp column
    width: 200px;
    text-align: right;
    padding-right: 6px;
    transform: translateX(-27px);
  }

  @media (max-width: 875px) {
    &:first-child {  // ID column
      width: 15%;  // Imposta la larghezza
    }

    &:nth-child(2) {  // Sender column
      width: 15%;  // Imposta la larghezza
    }

    &:nth-child(3) {  // Recipient column
      width: 15%;  // Imposta la larghezza
    }

    &:nth-child(4) {  // Sent column
      width: 15%;  // Imposta la larghezza
    }

    &:nth-child(5) {  // Net Sent column
      width: 10%;  // Imposta la larghezza
    }

    &:nth-child(6) {  // Reserve column
      width: 10%;  // Imposta la larghezza
    }

    &:nth-child(7) {  // Burned column
      width: 10%;  // Imposta la larghezza
    }

    &:last-child {  // Timestamp column
      width: 10%;
      padding-right: 6px;
    }
  }
`

// Componenti styled specifici per Transactions
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

// Componenti styled specifici per Transactions
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

// Componenti styled specifici per Transactions
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

const NoResultsMessage = styled.div`
  color: #fff;
  text-align: center;
  padding: 20px;
  font-size: 14px;
`

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [searchText, setSearchText] = useState("")
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([])
  const [searchError, setSearchError] = useState<string | null>(null)
  const router = useRouter()
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const fetchTransactions = async () => {
    try {
      console.log('🔄 Iniziando il fetch delle transazioni...', new Date().toISOString())
      setIsLoading(true)
      
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/transactions?_=${timestamp}`, { 
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
          'Expires': '0',
        }
      })
      
      console.log('📥 Risposta ricevuta:', {
        status: response.status,
        statusText: response.statusText,
        headers: Object.fromEntries(response.headers.entries())
      })

      if (!response.ok) {
        throw new Error(`Errore di rete: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()
      console.log('📊 Dati ricevuti:', {
        numeroTransazioni: data.length,
        primaTransazione: data[0],
        ultimaTransazione: data[data.length - 1],
        timestamp: new Date().toISOString()
      })

      setTransactions(data)
      setFilteredTransactions(data)
      console.log('💾 Stato aggiornato con nuovi dati')

    } catch (error) {
      console.error('❌ Errore durante il fetch:', error)
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace')
    } finally {
      setIsLoading(false)
      console.log('✅ Fetch completato')
    }
  }

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Se inizia a digitare lettere e non inizia con @, aggiungi @
    if (value && !value.startsWith('@') && /^[a-zA-Z]/.test(value)) {
      value = '@' + value;
    }
    
    setSearchText(value);
    if (value) {
      performSearch(value);
    } else {
      setFilteredTransactions(transactions);
      setSearchError(null);
    }
  };

  const performSearch = (searchValue: string) => {
    let results: Transaction[] = [];
    
    if (searchValue.startsWith('@')) {
      // Ricerca per nome utente (sia Sender che Recipient)
      const username = searchValue.substring(1).toLowerCase();
      // Match esatto del nome utente
      results = transactions.filter(tx => 
        tx.Sender.toLowerCase() === username ||
        tx.Recipient.toLowerCase() === username
      );
    } else {
      // Ricerca per ID
      results = transactions.map(tx => ({
        ...tx,
        isHighlighted: tx['Twitt ID'] === searchValue
      })).filter(tx => tx['Twitt ID'].includes(searchValue));
    }

    if (results.length === 0) {
      setSearchError('No results found for your search');
    } else {
      setSearchError(null);
    }

    setFilteredTransactions(results);
  };

  useEffect(() => {
    console.log('🔵 Component mounted', new Date().toISOString())
    fetchTransactions()

    // Aggiunge un polling ogni 30 secondi per verificare se ci sono nuovi dati
    const interval = setInterval(() => {
      console.log('⏰ Polling timer triggered', new Date().toISOString())
      fetchTransactions()
    }, 30000)

    return () => {
      console.log('🔴 Component unmounted', new Date().toISOString())
      clearInterval(interval)
    }
  }, [])

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(', ', ' ') + ' UTC';  // Rimuove lo spazio dopo la virgola
  }

  const formatNumber = (num: number) => {
    return num.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    })
  }

  const handleTwitterLink = (tweetId: string) => {
    const tweetUrl = `https://x.com/TheSticazzis/status/${tweetId}`;
    const tweetAppUrl = `twitter://status?id=${tweetId}`;
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    if (isMobile) {
      window.location.href = tweetAppUrl;
    } else {
      window.open(tweetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <>
      <WaveBackground />
      <RetroBackground key={Date.now()} />
      <PageContainer $isLoading={isLoading}>
        <Container>
          <BlueRectangle>
            <BorderContainer>
              <InnerBorder>
                <Title onClick={() => router.push('/')} style={{ cursor: 'pointer' }}>Boring Layer</Title>
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
                    $isActive={false}
                  >
                    Ranking
                  </DesktopMenuItem>
                  <DesktopMenuItem 
                    onClick={() => router.push('/transactions')}
                    $isActive={true}
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

                <SearchContainer>
                  <SearchInput 
                    type="text" 
                    value={searchText}
                    onChange={handleSearchInput}
                    placeholder="Search by ID, Sender or Recipient"
                    $hasError={!!searchError}
                  />
                  <GoButton onClick={() => performSearch(searchText)}>Search</GoButton>
                  <LastTnxButton onClick={fetchTransactions}>Last Tnx</LastTnxButton>
                </SearchContainer>

                <TableContainer $isStylesLoaded={!isLoading}>
                  <TableInner className="table-inner">
                    <HeaderBand />
                    <StyledTable>
                      <StyledThead>
                        <tr>
                          <StyledTh>ID</StyledTh>
                          <StyledTh>Sender</StyledTh>
                          <StyledTh>Recipient</StyledTh>
                          <StyledTh>Sent</StyledTh>
                          <StyledTh>Net Sent</StyledTh>
                          <StyledTh>Reserve</StyledTh>
                          <StyledTh>Burned</StyledTh>
                          <StyledTh>Timestamp</StyledTh>
                        </tr>
                      </StyledThead>
                      <tbody>
                        {filteredTransactions.map((tx: Transaction) => (
                          <TableRow 
                            key={tx['Twitt ID']}
                            $isHighlighted={tx.isHighlighted}
                            onClick={(e) => {
                              e.preventDefault();
                              handleTwitterLink(tx['Twitt ID']);
                            }}
                            style={{ cursor: 'pointer' }}
                          >
                            <TableCell>{tx['Twitt ID']}</TableCell>
                            <TableCell>@{tx.Sender}</TableCell>
                            <TableCell>@{tx.Recipient}</TableCell>
                            <TableCell>{Number(tx.Amount).toFixed(2)}</TableCell>
                            <TableCell>{Number(tx.Net_sent).toFixed(2)}</TableCell>
                            <TableCell>{Number(tx.Fees).toFixed(2)}</TableCell>
                            <TableCell>{Number(tx.Burned).toFixed(2)}</TableCell>
                            <TableCell>{formatTimestamp(tx.Date)}</TableCell>
                          </TableRow>
                        ))}
                      </tbody>
                    </StyledTable>
                  </TableInner>
                </TableContainer>
              </InnerBorder>
            </BorderContainer>
          </BlueRectangle>
        </Container>
      </PageContainer>
    </>
  )
} 