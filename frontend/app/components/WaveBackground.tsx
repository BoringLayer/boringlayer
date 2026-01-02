'use client'

import styled, { keyframes } from 'styled-components'

const noise = keyframes`
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
`

const opacity = keyframes`
  0% { opacity: .6; }
  20% { opacity: .3; }
  35% { opacity: .5; }
  50% { opacity: .8; }
  60% { opacity: .4; }
  80% { opacity: .7; }
  100% { opacity: .6; }
`

const scanlines = keyframes`
  from {
    background: linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, .5) 51%);
    background-size: 100% 4px;
  }
  to {
    background: linear-gradient(to bottom, rgba(0, 0, 0, .5) 50%, transparent 51%);
    background-size: 100% 4px;
  }
`

const BackgroundContainer = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  background: #000084;
  overflow: hidden;
  z-index: -1;

  &:before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    background: radial-gradient(ellipse at center, rgba(0,0,0,0) 0%, rgba(0,0,0,.4) 100%);
    z-index: 500;
    mix-blend-mode: overlay;
    pointer-events: none;
  }
`

const Noise = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  z-index: 400;
  opacity: .8;
  pointer-events: none;

  &:before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: url('https://ice-creme.de/images/background-noise.png');
    pointer-events: none;
  }
`

const NoiseMoving = styled(Noise)`
  opacity: 1;
  z-index: 450;

  &:before {
    will-change: background-position;
    animation: ${noise} 1s infinite alternate;
  }
`

const Scanlines = styled.div`
  position: fixed;
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  pointer-events: none;
  z-index: 300;
  opacity: .6;
  will-change: opacity;
  animation: ${opacity} 3s linear infinite;

  &:before {
    content: '';
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    background: linear-gradient(to bottom, transparent 50%, rgba(0, 0, 0, .5) 51%);
    background-size: 100% 4px;
    will-change: background, background-size;
    animation: ${scanlines} .2s linear infinite;
  }
`

export default function WaveBackground() {
  return (
    <BackgroundContainer>
      <Noise />
      <NoiseMoving />
      <Scanlines />
    </BackgroundContainer>
  )
} 