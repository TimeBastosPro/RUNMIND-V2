import React, { useState } from 'react';
import { View, StyleSheet, LayoutChangeEvent } from 'react-native';
import { Surface, Text } from 'react-native-paper';
import { LineChart } from 'react-native-chart-kit';
import { AbstractChartConfig } from 'react-native-chart-kit/dist/AbstractChart';
import { LineChartData } from 'react-native-chart-kit/dist/LineChart';

interface ChartCardProps {
  title: string;
  data: LineChartData;
  chartConfig: AbstractChartConfig;
  height?: number;
  yAxisSuffix?: string;
  yAxisLabel?: string;
  noDataText?: string;
  bezier?: boolean;
}

const ChartCard: React.FC<ChartCardProps> = ({
  title,
  data,
  chartConfig,
  height = 220,
  yAxisSuffix = '',
  yAxisLabel = '',
  noDataText = 'Sem dados suficientes para exibir',
  bezier = true,
}) => {
  const [chartWidth, setChartWidth] = useState(0);

  const onLayout = (event: LayoutChangeEvent) => {
    // Subtrai o padding do container para o gráfico não cortar
    const width = event.nativeEvent.layout.width - 20; 
    setChartWidth(width);
  };

  // Verifica se há dados para exibir no gráfico
  const hasData = data.datasets.some(dataset => dataset.data.length > 0);

  return (
    <Surface style={styles.chartContainer} onLayout={onLayout}>
      <Text variant="titleMedium" style={styles.chartTitle}>
        {title}
      </Text>
      {chartWidth > 0 ? (
        hasData ? (
          <LineChart
            data={data}
            width={chartWidth}
            height={height}
            yAxisLabel={yAxisLabel}
            yAxisSuffix={yAxisSuffix}
            yAxisInterval={1}
            chartConfig={chartConfig}
            bezier={bezier}
            style={styles.chart}
          />
        ) : (
          <View style={[styles.noDataContainer, { height }]}> 
            <Text style={styles.noDataText}>{noDataText}</Text>
          </View>
        )
      ) : (
        // Placeholder para manter a altura antes da medição do layout
        <View style={{ height }} />
      )}
    </Surface>
  );
};

const styles = StyleSheet.create({
  chartContainer: {
    marginVertical: 10,
    borderRadius: 12,
    elevation: 4,
    backgroundColor: 'white',
    padding: 10,
  },
  chartTitle: {
    textAlign: 'center',
    marginBottom: 15,
    fontWeight: 'bold',
  },
  chart: {
    borderRadius: 16,
  },
  noDataContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  noDataText: {
    textAlign: 'center',
    paddingVertical: 20,
    fontStyle: 'italic',
    color: '#666',
  },
});

export default ChartCard; 