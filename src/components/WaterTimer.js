import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Path, Circle, Defs, ClipPath, G, Ellipse } from 'react-native-svg';
import { colors } from '../theme';

const SIZE = 200;
const CX = SIZE / 2;

function computeWavePath(fillLevel, phase, size) {
  const h = size;
  const w = size;
  const fillY = h * (1 - Math.min(fillLevel, 0.98));
  const amp = fillLevel > 0.02 ? 8 : 0;
  const freq = 1.5;

  let d = `M 0 ${fillY} `;
  for (let x = 0; x <= w; x += 3) {
    const y = fillY + amp * Math.sin((x / w) * freq * Math.PI * 2 + phase);
    d += `L ${x} ${y} `;
  }
  d += `L ${w} ${h} L 0 ${h} Z`;
  return d;
}

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

  useEffect(() => {
    setFrontPath(computeWavePath(progress, 0, size));
    setBackPath(computeBackWave(progress, 0, size));
  }, []);

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

  const r = size / 2 - 3;
  const clipId = `waterClip_${size}`;

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
s
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
