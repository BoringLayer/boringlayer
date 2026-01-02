import styled, { createGlobalStyle } from 'styled-components'
import { useEffect } from 'react'

const GlobalStyle = createGlobalStyle`
  @keyframes noise {
    0% { transform: translate(0,0) scale(1.5); background-position: 0% 0%; }
    10% { transform: translate(-2%,-5%) scale(1.6); background-position: 5% 10%; }
    20% { transform: translate(-7%,2%) scale(1.4); background-position: -5% 20%; }
    30% { transform: translate(3%,-12%) scale(1.7); background-position: 15% -10%; }
    40% { transform: translate(10%,12%) scale(1.5); background-position: -12% 15%; }
    50% { transform: translate(-12%,5%) scale(1.6); background-position: 7% -20%; }
    60% { transform: translate(7%,2%) scale(1.7); background-position: 20% 25%; }
    70% { transform: translate(0,7%) scale(1.4); background-position: -17% -7%; }
    80% { transform: translate(12%,17%) scale(1.6); background-position: 10% 12%; }
    90% { transform: translate(-5%,5%) scale(1.5); background-position: -10% 20%; }
    100% { transform: translate(0,0) scale(1.5); background-position: 0% 0%; }
  }

  @keyframes opacity {
    0% { opacity: 0.7; }
    15% { opacity: 0.4; }
    30% { opacity: 0.8; }
    45% { opacity: 0.3; }
    60% { opacity: 0.6; }
    75% { opacity: 0.5; }
    90% { opacity: 0.7; }
    100% { opacity: 0.6; }
  }

  @keyframes scanlines {
    0% {
      background: linear-gradient(to bottom, 
        transparent 50%, 
        rgba(0, 0, 0, 0.6) 51%
      );
      background-size: 100% 7px;
      transform: translateY(0);
    }
    50% {
      background: linear-gradient(to bottom, 
        rgba(0, 0, 0, 0.6) 50%, 
        transparent 51%
      );
      background-size: 100% 9px;
      transform: translateY(6px);
    }
    100% {
      background: linear-gradient(to bottom, 
        transparent 50%, 
        rgba(0, 0, 0, 0.6) 51%
      );
      background-size: 100% 7px;
      transform: translateY(0);
    }
  }

  @keyframes rgbText {
    0% {
      text-shadow: -1px 1px 4px rgba(255, 255, 255, 0.4), 
                   1px -1px 4px rgba(255, 255, 235, 0.5), 
                   0px 0 1px rgba(251, 0, 231, 0.6), 
                   0 0px 2px rgba(0, 233, 235, 0.6), 
                   0px 0 2px rgba(0, 242, 14, 0.6), 
                   0 0px 2px rgba(244, 45, 0, 0.6), 
                   0px 0 2px rgba(59, 0, 226, 0.6);
    }
    50% {
      text-shadow: -1px 1px 4px rgba(255, 255, 255, 0.4), 
                   1px -1px 4px rgba(255, 255, 235, 0.5), 
                   -3px 0 1px rgba(251, 0, 231, 0.6), 
                   0 -3px 1px rgba(0, 233, 235, 0.6), 
                   3px 0 1px rgba(0, 242, 14, 0.6), 
                   0 3px 1px rgba(244, 45, 0, 0.6), 
                   -3px 0 1px rgba(59, 0, 226, 0.6);
    }
    100% {
      text-shadow: -1px 1px 4px rgba(255, 255, 255, 0.4), 
                   1px -1px 4px rgba(255, 255, 235, 0.5), 
                   3px 0 1px rgba(251, 0, 231, 0.6), 
                   0 -3px 1px rgba(0, 233, 235, 0.6), 
                   -3px 0 1px rgba(0, 242, 14, 0.6), 
                   0 3px 1px rgba(244, 45, 0, 0.6), 
                   3px 0 1px rgba(59, 0, 226, 0.6);
    }
  }
`

const BackgroundContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  z-index: 0;
  pointer-events: none;
`

const NoiseBackground = styled.div`
  position: fixed;
  top: -25%;
  left: -25%;
  width: 150vw;
  height: 150vh;
  overflow: hidden;
  z-index: 0;
  background: #0000B9;
  
  &::before {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url("https://ice-creme.de/images/background-noise.png");
    animation: noise 1.2s steps(2) infinite;
    background-size: 120% 120%;
    mix-blend-mode: soft-light;
    opacity: 0.7;
  }

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(circle at center, 
      rgba(100,100,255,0.2) 0%,
      rgba(50,50,255,0.3) 50%,
      rgba(0,0,255,0.4) 100%
    );
    animation: opacity 5s ease-in-out infinite;
    mix-blend-mode: screen;
  }
`

const Scanlines = styled.div`
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 1;
  opacity: 0.4;
  animation: opacity 3s linear infinite;

  &::before {
    content: "";
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    animation: scanlines 0.15s linear infinite;
  }
`

export default function RetroBackground() {
  useEffect(() => {
    const interval = setInterval(() => {
      // Non facciamo nulla, solo per forzare il rendering
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  return (
    <>
      <GlobalStyle />
      <BackgroundContainer>
        <NoiseBackground />
        <Scanlines />
      </BackgroundContainer>
    </>
  )
} 