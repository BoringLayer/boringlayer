import styled from 'styled-components'

const TooltipContainer = styled.div`
  position: absolute;
  background: #eaff00;
  color: #000084;
  padding: 10px 20px;
  font-family: "Courier New", Courier, monospace;
  font-weight: bold;
  font-size: 16px;
  box-shadow: 4px 4px 0px 0px rgba(0, 0, 0, 0.75);
  z-index: 1000;
  top: -40px;
  left: 50%;
  transform: translateX(-50%);
  white-space: nowrap;
`

interface ComingSoonTooltipProps {
  isVisible: boolean;
  text?: string;
}

export default function ComingSoonTooltip({ isVisible, text = "COMING SOON" }: ComingSoonTooltipProps) {
  if (!isVisible) return null;
  return (
    <TooltipContainer>
      {text}
    </TooltipContainer>
  );
} 