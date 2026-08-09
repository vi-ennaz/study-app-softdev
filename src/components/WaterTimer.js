// WaterTimer.js
// This component renders a circular water timer with animated waves to indicate progress.
// It uses react-native-svg to create the circular shape and wave animations and allows customization of size, colour
// and progress level.
import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, ClipPath, G, Ellipse } from 'react-native-svg';
import { colors } from '../theme';

// Define constants for the default size of the water timer and the center point
// The computeWavePath function calculates the SVG path for the front wave based on the fill level, phase and size
const SIZE = 200;
const CX = SIZE / 2;

// The computeBackWave function calculates the SVG path for the back wave based on the fill level, phase and size
// The WaterTimer component takes props for size, progress, running state, children and colours
function computeWavePath(fillLevel, phase, size) {
  const h = size;
  const w = size;
  const fillY = h * (1 - Math.min(fillLevel, 0.98));
  const amp = fillLevel > 0.02 ? 8 : 0;
  const freq = 1.5;

  // The computeWavePath function calculates the SVG path for the front wave based on the fill level, phase and size
  let d = `M 0 ${fillY} `;
  for (let x = 0; x <= w; x += 3) {
    const y = fillY + amp * Math.sin((x / w) * freq * Math.PI * 2 + phase);
    d += `L ${x} ${y} `;
  }
  d += `L ${w} ${h} L 0 ${h} Z`;
  return d;
}
// The computeBackWave function calculates the SVG path for the back wave based on the fill level, phase and size
function computeBackWave(fillLevel, phase, size) {
  const h = size;
  const w = size;
  const fillY = h * (1 - Math.min(fillLevel, 0.99)) + 6;
  const amp = fillLevel > 0.02 ? 6 : 0;
  const freq = 1.2;

  let d = `M 0 ${fillY} `;
  for (let x = 0; x <= w; x += 3) {
    const y = fillY + amp * Math.sin((x / w) * freq * Math.PI * 2 + phase + 1.2);
    d += `L ${x} ${y} `;
  }
  d += `L ${w} ${h} L 0 ${h} Z`;
  return d;
}
// The WaterTimer component takes props for size, progress, running state, children and colours
export default function WaterTimer({
  size = SIZE,
  progress = 0,
  running = false,
  children,
  color = colors.water,
  colorLight = colors.waterLight,
}) {
  const [frontPath, setFrontPath] = useState('');
  const [backPath,  setBackPath]  = useState('');
  const phaseRef  = useRef(0);
  const timerRef  = useRef(null);

  // Use useEffect to initialize the wave paths when the component mounts
  // and to update the wave paths when the running state, progress or size changes
  useEffect(() => {
    setFrontPath(computeWavePath(progress, 0, size));
    setBackPath(computeBackWave(progress, 0, size));
  }, []);

  // Use useEffect to set up an interval that updates the wave paths based on the running state and progress
  // The interval updates the phase of the waves and recalculates the SVG paths for the front and back waves
  useEffect(() => {
    clearInterval(timerRef.current);
    if (running || progress > 0) {
      timerRef.current = setInterval(() => {
        phaseRef.current += running ? 0.06 : 0.02;
        setFrontPath(computeWavePath(progress, phaseRef.current, size));
        setBackPath(computeBackWave(progress, phaseRef.current, size));
      }, 50);
    }
    return () => clearInterval(timerRef.current);
  }, [running, progress, size]);
// Calculate the radius of the circular timer and define a unique clip path ID for the SVG elements
  const r = size / 2 - 3;
  const clipId = `waterClip_${size}`;
// Render the WaterTimer component, which includes an SVG element with circular clipping and wave paths
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ position: 'absolute' }}>
        <Defs>
          <ClipPath id={clipId}>
            <Circle cx={size / 2} cy={size / 2} r={r} />
          </ClipPath>
        </Defs>

        <Circle
          cx={size / 2} cy={size / 2} r={r}
          fill={colors.waterPale}
        />

        {backPath ? (
          <G clipPath={`url(#${clipId})`}>
            <Path d={backPath} fill={colorLight + '55'} />
          </G>
        ) : null}

        {frontPath ? (
          <G clipPath={`url(#${clipId})`}>
            <Path d={frontPath} fill={color + 'cc'} />
          </G>
        ) : null}
{/* Render small ellipses to simulate foam on the water surface when the progress is between 5% and 97% */}
        {progress > 0.05 && progress < 0.97 && (
          <G clipPath={`url(#${clipId})`}>
            <Ellipse
              cx={size * 0.3}
              cy={size * (1 - progress) - 4}
              rx={3} ry={2}
              fill={colors.waterFoam + '66'}
            />
            <Ellipse
              cx={size * 0.65}
              cy={size * (1 - progress) - 3}
              rx={2} ry={1.5}
              fill={colors.waterFoam + '55'}
            />
            <Ellipse
              cx={size * 0.5}
              cy={size * (1 - progress) - 6}
              rx={1.5} ry={1}
              fill={colors.waterFoam + '44'}
            />
          </G>
        )}

        <Circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={color}
          strokeWidth={2.5}
          opacity={0.6}
        />
        <Circle
          cx={size / 2} cy={size / 2} r={r + 4}
          fill="none"
          stroke={color}
          strokeWidth={1}
          opacity={0.15}
        />
      </Svg>
      {children}
    </View>
  );
}
