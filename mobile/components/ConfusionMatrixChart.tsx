import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Rect, Text as SvgText } from 'react-native-svg';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

interface Props {
  matrix: number[][];   // [[TN, FP], [FN, TP]]
  modelName: string;
}

const CELL = 60;
const LABEL_W = 50;
const PADDING = 10;

export default function ConfusionMatrixChart({ matrix, modelName }: Props) {
  if (!matrix || matrix.length !== 2) return null;

  const labels = ['Down', 'Up'];
  const total = matrix.flat().reduce((a, b) => a + b, 0) || 1;

  // Color intensity based on value
  const maxVal = Math.max(...matrix.flat());
  const getColor = (val: number, isCorrect: boolean) => {
    const intensity = maxVal > 0 ? val / maxVal : 0;
    if (isCorrect) {
      // Correct predictions: green shades
      const g = Math.round(100 + intensity * 155);
      return `rgba(16, ${g}, 129, ${0.2 + intensity * 0.6})`;
    }
    // Wrong predictions: red shades
    const r = Math.round(100 + intensity * 155);
    return `rgba(${r}, 68, 68, ${0.15 + intensity * 0.5})`;
  };

  const svgW = LABEL_W + CELL * 2 + PADDING * 2;
  const svgH = LABEL_W + CELL * 2 + PADDING * 2 + 20;

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{modelName.replace(/_/g, ' ')}</Text>
      <View style={styles.chartWrap}>
        <Svg width={svgW} height={svgH} viewBox={`0 0 ${svgW} ${svgH}`}>
          {/* "Predicted" label at top */}
          <SvgText
            x={LABEL_W + CELL}
            y={12}
            fontSize={10}
            fill={Colors.textSecondary}
            textAnchor="middle"
            fontWeight="600"
          >
            Predicted
          </SvgText>

          {/* Column headers */}
          {labels.map((label, j) => (
            <SvgText
              key={`col-${j}`}
              x={LABEL_W + j * CELL + CELL / 2}
              y={28}
              fontSize={10}
              fill={Colors.textSecondary}
              textAnchor="middle"
            >
              {label}
            </SvgText>
          ))}

          {/* "Actual" label on left (rotated) */}
          <SvgText
            x={12}
            y={LABEL_W + CELL - 5}
            fontSize={10}
            fill={Colors.textSecondary}
            textAnchor="middle"
            fontWeight="600"
            rotation="-90"
            originX={12}
            originY={LABEL_W + CELL - 5}
          >
            Actual
          </SvgText>

          {/* Row headers + cells */}
          {matrix.map((row, i) => (
            <React.Fragment key={`row-${i}`}>
              {/* Row label */}
              <SvgText
                x={LABEL_W - 8}
                y={LABEL_W + 5 + i * CELL + CELL / 2}
                fontSize={10}
                fill={Colors.textSecondary}
                textAnchor="end"
              >
                {labels[i]}
              </SvgText>

              {row.map((val, j) => {
                const isCorrect = i === j;
                const x = LABEL_W + j * CELL;
                const y = LABEL_W + i * CELL;
                const pct = ((val / total) * 100).toFixed(1);

                return (
                  <React.Fragment key={`cell-${i}-${j}`}>
                    <Rect
                      x={x + 2}
                      y={y + 2}
                      width={CELL - 4}
                      height={CELL - 4}
                      rx={6}
                      fill={getColor(val, isCorrect)}
                    />
                    <SvgText
                      x={x + CELL / 2}
                      y={y + CELL / 2 - 4}
                      fontSize={14}
                      fill={Colors.text}
                      textAnchor="middle"
                      fontWeight="700"
                    >
                      {val}
                    </SvgText>
                    <SvgText
                      x={x + CELL / 2}
                      y={y + CELL / 2 + 12}
                      fontSize={9}
                      fill={Colors.textMuted}
                      textAnchor="middle"
                    >
                      {pct}%
                    </SvgText>
                  </React.Fragment>
                );
              })}
            </React.Fragment>
          ))}
        </Svg>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: Spacing.xs,
  },
  title: {
    color: Colors.textSecondary,
    fontSize: FontSize.xs,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  chartWrap: {
    alignItems: 'center',
  },
});
