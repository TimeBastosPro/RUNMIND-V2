import React from 'react';
import { View } from 'react-native';
import Svg, { Polygon, Line, Circle, Text as SvgText } from 'react-native-svg';

interface RadarChartDatum {
  label: string;
  value: number; // 0-100
  color?: string;
}

interface RadarChartProps {
  data: RadarChartDatum[];
  size?: number;
  levels?: number;
  strokeColor?: string;
  fillColor?: string;
}

const RadarChart: React.FC<RadarChartProps> = ({
  data,
  size = 220,
  levels = 5,
  strokeColor = '#1976d2',
  fillColor = 'rgba(25, 118, 210, 0.2)',
}) => {
  if (!data || data.length < 3) return null;
  const radius = size / 2 - 24;
  const center = size / 2;
  const angleStep = (2 * Math.PI) / data.length;

  // Gera os pontos para cada valor
  const getPoint = (value: number, i: number, max = 100) => {
    const angle = i * angleStep - Math.PI / 2;
    const r = (value / max) * radius;
    return [center + r * Math.cos(angle), center + r * Math.sin(angle)];
  };

  // Polígono dos dados
  const points = data.map((d, i) => getPoint(d.value, i).join(",")).join(" ");

  // Polígonos dos níveis
  const levelPolygons = Array.from({ length: levels }, (_, l) => {
    const r = radius * ((l + 1) / levels);
    const pts = data.map((_, i) => {
      const angle = i * angleStep - Math.PI / 2;
      return [center + r * Math.cos(angle), center + r * Math.sin(angle)].join(",");
    });
    return <Polygon key={l} points={pts.join(" ")} fill="none" stroke="#bbb" strokeWidth={1} />;
  });

  // Eixos
  const axes = data.map((_, i) => {
    const [x, y] = getPoint(100, i);
    return <Line key={i} x1={center} y1={center} x2={x} y2={y} stroke="#bbb" strokeWidth={1} />;
  });

  // Labels
  const labels = data.map((d, i) => {
    const [x, y] = getPoint(110, i);
    return (
      <SvgText
        key={i}
        x={x}
        y={y}
        fontSize={13}
        fill="#222"
        textAnchor={x < center ? 'end' : x > center ? 'start' : 'middle'}
        alignmentBaseline={y < center ? 'baseline' : y > center ? 'hanging' : 'middle'}
      >
        {d.label}
      </SvgText>
    );
  });

  // Pontos
  const pointsCircles = data.map((d, i) => {
    const [x, y] = getPoint(d.value, i);
    return <Circle key={i} cx={x} cy={y} r={4} fill={d.color || strokeColor} />;
  });

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size}>
        {/* Níveis */}
        {levelPolygons}
        {/* Eixos */}
        {axes}
        {/* Área preenchida */}
        <Polygon points={points} fill={fillColor} stroke={strokeColor} strokeWidth={2} />
        {/* Pontos */}
        {pointsCircles}
        {/* Labels */}
        {labels}
      </Svg>
    </View>
  );
};

export default RadarChart; 