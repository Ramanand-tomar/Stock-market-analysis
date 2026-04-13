import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, {
  Circle, Line, Path, Rect, Text as SvgText, G,
  Defs, LinearGradient, Stop, Polygon,
} from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

// ─── Types ──────────────────────────────────────────────────────────────
interface Props {
  modelName: string;
  type: 'regression' | 'classification';
}

// ─── Helpers ────────────────────────────────────────────────────────────
const W = 280;
const H = 180;
const PAD = 28;
const PLOT_W = W - PAD * 2;
const PLOT_H = H - PAD * 2;

const tx = (x: number) => PAD + x * PLOT_W;        // 0-1 → svg x
const ty = (y: number) => PAD + (1 - y) * PLOT_H;  // 0-1 → svg y (inverted)

// Scatter sample points (used across most illustrations)
const SAMPLE_PTS = [
  { x: 0.08, y: 0.15 }, { x: 0.14, y: 0.22 }, { x: 0.20, y: 0.18 },
  { x: 0.25, y: 0.30 }, { x: 0.30, y: 0.35 }, { x: 0.35, y: 0.32 },
  { x: 0.40, y: 0.42 }, { x: 0.45, y: 0.48 }, { x: 0.50, y: 0.50 },
  { x: 0.55, y: 0.55 }, { x: 0.60, y: 0.60 }, { x: 0.65, y: 0.58 },
  { x: 0.70, y: 0.68 }, { x: 0.75, y: 0.72 }, { x: 0.80, y: 0.70 },
  { x: 0.85, y: 0.78 }, { x: 0.90, y: 0.85 }, { x: 0.95, y: 0.88 },
];

// Classification sample points (two classes)
const CLASS_A = [
  { x: 0.10, y: 0.70 }, { x: 0.15, y: 0.80 }, { x: 0.20, y: 0.65 },
  { x: 0.25, y: 0.75 }, { x: 0.30, y: 0.85 }, { x: 0.18, y: 0.90 },
  { x: 0.35, y: 0.70 }, { x: 0.28, y: 0.60 }, { x: 0.12, y: 0.85 },
];
const CLASS_B = [
  { x: 0.65, y: 0.20 }, { x: 0.70, y: 0.30 }, { x: 0.75, y: 0.15 },
  { x: 0.80, y: 0.25 }, { x: 0.85, y: 0.35 }, { x: 0.78, y: 0.10 },
  { x: 0.90, y: 0.28 }, { x: 0.72, y: 0.40 }, { x: 0.88, y: 0.18 },
];

// ─── Algorithm info database ───────────────────────────────────────────
interface AlgoInfo {
  title: string;
  description: string;
  howItWorks: string;
  strengths: string[];
  icon: string;
}

const ALGO_INFO: Record<string, AlgoInfo> = {
  // Regression
  LinearRegression: {
    title: 'Linear Regression',
    description: 'Fits a straight line (y = mx + b) that minimizes the sum of squared distances from all data points.',
    howItWorks: 'Finds the best-fit line by minimizing the Mean Squared Error between predicted and actual values.',
    strengths: ['Simple & interpretable', 'Fast training', 'No hyperparameters', 'Works well with linear data'],
    icon: 'trending-up',
  },
  DecisionTreeRegressor: {
    title: 'Decision Tree Regressor',
    description: 'Splits data into regions using if-then rules, predicting the average value in each region.',
    howItWorks: 'Recursively partitions the feature space into rectangular regions, each with a constant prediction.',
    strengths: ['Handles non-linear data', 'Easy to visualize', 'No feature scaling needed', 'Captures interactions'],
    icon: 'git-branch',
  },
  RandomForestRegressor: {
    title: 'Random Forest Regressor',
    description: 'Combines many decision trees, each trained on a random subset of data, and averages their predictions.',
    howItWorks: 'Each tree sees a different random sample (bagging). The final prediction is the average of all trees.',
    strengths: ['Reduces overfitting', 'Handles non-linearity', 'Robust to outliers', 'Feature importance'],
    icon: 'leaf',
  },
  GradientBoostingRegressor: {
    title: 'Gradient Boosting Regressor',
    description: 'Builds trees sequentially, each new tree correcting the errors (residuals) of the previous ones.',
    howItWorks: 'Starts with a simple prediction, then adds trees that learn from mistakes of the ensemble so far.',
    strengths: ['Very accurate', 'Handles complex patterns', 'Built-in regularization', 'Feature importance'],
    icon: 'rocket',
  },
  LinearSVR: {
    title: 'Linear SVR (Support Vector)',
    description: 'Fits a line inside an epsilon-tube, ignoring errors smaller than epsilon and penalizing larger ones.',
    howItWorks: 'Creates a margin (tube) around the fit line. Only points outside the tube influence the model.',
    strengths: ['Robust to outliers', 'Epsilon-insensitive', 'Good generalization', 'Works in high dimensions'],
    icon: 'resize',
  },
  KNeighborsRegressor: {
    title: 'K-Nearest Neighbors Regressor',
    description: 'Predicts by averaging the values of the K closest data points in the feature space.',
    howItWorks: 'For each new point, finds the K nearest training examples and returns their average target value.',
    strengths: ['No training phase', 'Adapts to local patterns', 'Non-parametric', 'Simple concept'],
    icon: 'people',
  },
  // Classification
  LogisticRegression: {
    title: 'Logistic Regression',
    description: 'Uses the sigmoid function to convert a linear equation into a probability between 0 and 1.',
    howItWorks: 'Applies sigmoid(wx + b) to produce probabilities. The decision boundary is a straight line in feature space.',
    strengths: ['Probabilistic output', 'Fast & efficient', 'Interpretable coefficients', 'Good baseline'],
    icon: 'analytics',
  },
  DecisionTreeClassifier: {
    title: 'Decision Tree Classifier',
    description: 'Creates a flowchart of yes/no decisions to classify data into categories.',
    howItWorks: 'Splits feature space with axis-aligned boundaries at each node, choosing the best split by Gini impurity.',
    strengths: ['Highly interpretable', 'Handles mixed data', 'No feature scaling', 'Visual explanation'],
    icon: 'git-branch',
  },
  RandomForestClassifier: {
    title: 'Random Forest Classifier',
    description: 'An ensemble of many decision trees that vote on the final class — majority wins.',
    howItWorks: 'Each tree is trained on a bootstrap sample with random feature subsets. Class with most votes wins.',
    strengths: ['High accuracy', 'Reduces overfitting', 'Feature importance', 'Handles imbalanced data'],
    icon: 'leaf',
  },
  GradientBoostingClassifier: {
    title: 'Gradient Boosting Classifier',
    description: 'Sequentially builds weak classifiers, each focusing on the mistakes of the previous ones.',
    howItWorks: 'Each iteration adds a new tree that minimizes the log-loss of the current ensemble predictions.',
    strengths: ['State-of-the-art accuracy', 'Handles complex boundaries', 'Regularization control', 'Feature importance'],
    icon: 'rocket',
  },
  LinearSVC: {
    title: 'Linear SVC (Support Vector)',
    description: 'Finds the optimal hyperplane that separates classes with the maximum margin.',
    howItWorks: 'Maximizes the distance between the decision boundary and the nearest points (support vectors) of each class.',
    strengths: ['Maximum margin', 'Effective in high dims', 'Memory efficient', 'Strong generalization'],
    icon: 'resize',
  },
  KNeighborsClassifier: {
    title: 'K-Nearest Neighbors Classifier',
    description: 'Classifies a point by majority vote of its K closest neighbors in the training data.',
    howItWorks: 'For a new point, finds K nearest training examples and assigns the most common class among them.',
    strengths: ['No training needed', 'Non-parametric', 'Adapts to any shape', 'Simple & intuitive'],
    icon: 'people',
  },
  AdaBoostClassifier: {
    title: 'AdaBoost Classifier',
    description: 'Combines weak classifiers (stumps) by giving more weight to misclassified examples each round.',
    howItWorks: 'Trains simple classifiers sequentially. Misclassified points get higher weight so the next classifier focuses on them.',
    strengths: ['Boosts weak learners', 'Less prone to overfitting', 'Adaptive weighting', 'Few hyperparameters'],
    icon: 'fitness',
  },
  VotingClassifier: {
    title: 'Voting Classifier (Ensemble)',
    description: 'Combines predictions from multiple different models and selects the class with the most votes.',
    howItWorks: 'Each base model independently predicts a class. The final prediction is determined by majority vote.',
    strengths: ['Combines strengths', 'Reduces individual bias', 'More robust', 'Flexible composition'],
    icon: 'git-merge',
  },
};

// ─── SVG Illustration renderers ─────────────────────────────────────────

function Axes() {
  return (
    <>
      <Line x1={PAD} y1={PAD} x2={PAD} y2={H - PAD} stroke={Colors.border} strokeWidth={1} />
      <Line x1={PAD} y1={H - PAD} x2={W - PAD} y2={H - PAD} stroke={Colors.border} strokeWidth={1} />
      <SvgText x={W / 2} y={H - 4} fontSize={8} fill={Colors.textMuted} textAnchor="middle">Feature</SvgText>
      <SvgText x={8} y={H / 2} fontSize={8} fill={Colors.textMuted} textAnchor="middle" rotation="-90" originX={8} originY={H / 2}>Target</SvgText>
    </>
  );
}

function ScatterPoints({ pts, color, r = 3 }: { pts: typeof SAMPLE_PTS; color: string; r?: number }) {
  return (
    <>
      {pts.map((p, i) => (
        <Circle key={i} cx={tx(p.x)} cy={ty(p.y)} r={r} fill={color} opacity={0.6} />
      ))}
    </>
  );
}

// ── Linear Regression: straight best-fit line ───────────────────────────
function LinearRegressionViz() {
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Defs>
        <LinearGradient id="linGrad" x1="0" y1="0" x2="1" y2="0">
          <Stop offset="0" stopColor={Colors.primaryLight} stopOpacity={0.1} />
          <Stop offset="1" stopColor={Colors.primaryLight} stopOpacity={0.1} />
        </LinearGradient>
      </Defs>
      <Axes />
      <ScatterPoints pts={SAMPLE_PTS} color={Colors.primaryLight} />
      {/* Best-fit line */}
      <Line
        x1={tx(0.05)} y1={ty(0.12)}
        x2={tx(0.98)} y2={ty(0.90)}
        stroke={Colors.secondary}
        strokeWidth={2.5}
      />
      {/* Residual lines (error visualization) */}
      {SAMPLE_PTS.filter((_, i) => i % 3 === 0).map((p, i) => {
        const predictedY = 0.05 + p.x * 0.85;
        return (
          <Line
            key={`res-${i}`}
            x1={tx(p.x)} y1={ty(p.y)}
            x2={tx(p.x)} y2={ty(predictedY)}
            stroke={Colors.danger}
            strokeWidth={1}
            strokeDasharray="3,2"
            opacity={0.6}
          />
        );
      })}
      <SvgText x={tx(0.75)} y={ty(0.92)} fontSize={9} fill={Colors.secondary} fontWeight="600">y = mx + b</SvgText>
      {/* Legend */}
      <Line x1={tx(0.02)} y1={ty(0.02)} x2={tx(0.08)} y2={ty(0.02)} stroke={Colors.danger} strokeWidth={1} strokeDasharray="3,2" />
      <SvgText x={tx(0.10)} y={ty(0.01)} fontSize={7} fill={Colors.textMuted}>residuals</SvgText>
    </Svg>
  );
}

// ── Decision Tree: step function ────────────────────────────────────────
function DecisionTreeViz({ isClassification }: { isClassification: boolean }) {
  if (isClassification) {
    return (
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Axes />
        {/* Decision regions */}
        <Rect x={PAD} y={PAD} width={PLOT_W * 0.45} height={PLOT_H * 0.55} fill={Colors.secondary} opacity={0.1} />
        <Rect x={PAD + PLOT_W * 0.45} y={PAD} width={PLOT_W * 0.55} height={PLOT_H * 0.55} fill={Colors.danger} opacity={0.1} />
        <Rect x={PAD} y={PAD + PLOT_H * 0.55} width={PLOT_W * 0.45} height={PLOT_H * 0.45} fill={Colors.danger} opacity={0.1} />
        <Rect x={PAD + PLOT_W * 0.45} y={PAD + PLOT_H * 0.55} width={PLOT_W * 0.55} height={PLOT_H * 0.45} fill={Colors.secondary} opacity={0.1} />
        {/* Split lines */}
        <Line x1={tx(0.45)} y1={PAD} x2={tx(0.45)} y2={H - PAD} stroke={Colors.warning} strokeWidth={2} strokeDasharray="6,3" />
        <Line x1={PAD} y1={ty(0.55)} x2={W - PAD} y2={ty(0.55)} stroke={Colors.warning} strokeWidth={2} strokeDasharray="6,3" />
        {/* Class points */}
        <ScatterPoints pts={CLASS_A} color={Colors.secondary} r={4} />
        <ScatterPoints pts={CLASS_B} color={Colors.danger} r={4} />
        <SvgText x={tx(0.22)} y={ty(0.77)} fontSize={8} fill={Colors.secondary} textAnchor="middle" fontWeight="600">Class UP</SvgText>
        <SvgText x={tx(0.77)} y={ty(0.22)} fontSize={8} fill={Colors.danger} textAnchor="middle" fontWeight="600">Class DOWN</SvgText>
        <SvgText x={tx(0.45)} y={ty(0.98)} fontSize={7} fill={Colors.warning} textAnchor="middle">split</SvgText>
      </Svg>
    );
  }
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Axes />
      <ScatterPoints pts={SAMPLE_PTS} color={Colors.primaryLight} />
      {/* Step function */}
      <Path
        d={`M${tx(0.05)},${ty(0.18)} L${tx(0.22)},${ty(0.18)} L${tx(0.22)},${ty(0.32)}
            L${tx(0.38)},${ty(0.32)} L${tx(0.38)},${ty(0.47)}
            L${tx(0.55)},${ty(0.47)} L${tx(0.55)},${ty(0.60)}
            L${tx(0.72)},${ty(0.60)} L${tx(0.72)},${ty(0.75)}
            L${tx(0.95)},${ty(0.75)} L${tx(0.95)},${ty(0.86)}`}
        stroke={Colors.secondary}
        strokeWidth={2.5}
        fill="none"
      />
      {/* Split markers */}
      {[0.22, 0.38, 0.55, 0.72].map((x, i) => (
        <Line key={i} x1={tx(x)} y1={PAD} x2={tx(x)} y2={H - PAD} stroke={Colors.warning} strokeWidth={1} strokeDasharray="4,3" opacity={0.5} />
      ))}
      <SvgText x={tx(0.50)} y={ty(0.95)} fontSize={8} fill={Colors.secondary} textAnchor="middle" fontWeight="600">Step-wise splits</SvgText>
    </Svg>
  );
}

// ── Random Forest: multiple trees averaged ──────────────────────────────
function RandomForestViz({ isClassification }: { isClassification: boolean }) {
  if (isClassification) {
    return (
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Axes />
        <ScatterPoints pts={CLASS_A} color={Colors.secondary} r={4} />
        <ScatterPoints pts={CLASS_B} color={Colors.danger} r={4} />
        {/* Multiple faded boundaries (individual trees) */}
        {[
          { x1: 0.42, y1: 0.0, x2: 0.50, y2: 1.0 },
          { x1: 0.38, y1: 0.0, x2: 0.52, y2: 1.0 },
          { x1: 0.46, y1: 0.0, x2: 0.48, y2: 1.0 },
        ].map((l, i) => (
          <Line
            key={i}
            x1={tx(l.x1)} y1={ty(l.y1)}
            x2={tx(l.x2)} y2={ty(l.y2)}
            stroke={Colors.textMuted}
            strokeWidth={1}
            strokeDasharray="4,3"
            opacity={0.4}
          />
        ))}
        {/* Bold consensus boundary */}
        <Line x1={tx(0.43)} y1={ty(0.0)} x2={tx(0.50)} y2={ty(1.0)} stroke={Colors.secondary} strokeWidth={2.5} />
        {/* Tree icons */}
        {[0.15, 0.50, 0.85].map((x, i) => (
          <G key={i}>
            <Polygon points={`${tx(x)},${ty(0.06)} ${tx(x) - 6},${ty(-0.02)} ${tx(x) + 6},${ty(-0.02)}`} fill={Colors.secondary} opacity={0.5} />
          </G>
        ))}
        <SvgText x={tx(0.50)} y={H - 4} fontSize={7} fill={Colors.textMuted} textAnchor="middle">Multiple trees vote → majority wins</SvgText>
      </Svg>
    );
  }
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Axes />
      <ScatterPoints pts={SAMPLE_PTS} color={Colors.primaryLight} />
      {/* Multiple faded tree predictions */}
      <Path d={`M${tx(0.05)},${ty(0.20)} Q${tx(0.30)},${ty(0.28)} ${tx(0.50)},${ty(0.55)} Q${tx(0.70)},${ty(0.72)} ${tx(0.95)},${ty(0.80)}`} stroke={Colors.textMuted} strokeWidth={1} fill="none" opacity={0.3} />
      <Path d={`M${tx(0.05)},${ty(0.12)} Q${tx(0.30)},${ty(0.38)} ${tx(0.50)},${ty(0.45)} Q${tx(0.70)},${ty(0.65)} ${tx(0.95)},${ty(0.90)}`} stroke={Colors.textMuted} strokeWidth={1} fill="none" opacity={0.3} />
      <Path d={`M${tx(0.05)},${ty(0.17)} Q${tx(0.30)},${ty(0.33)} ${tx(0.50)},${ty(0.52)} Q${tx(0.70)},${ty(0.60)} ${tx(0.95)},${ty(0.85)}`} stroke={Colors.textMuted} strokeWidth={1} fill="none" opacity={0.3} />
      {/* Bold averaged prediction */}
      <Path d={`M${tx(0.05)},${ty(0.16)} Q${tx(0.30)},${ty(0.33)} ${tx(0.50)},${ty(0.50)} Q${tx(0.70)},${ty(0.66)} ${tx(0.95)},${ty(0.85)}`} stroke={Colors.secondary} strokeWidth={2.5} fill="none" />
      <SvgText x={tx(0.50)} y={ty(0.95)} fontSize={8} fill={Colors.secondary} textAnchor="middle" fontWeight="600">Average of many trees</SvgText>
    </Svg>
  );
}

// ── Gradient Boosting: sequential residual fitting ──────────────────────
function GradientBoostingViz({ isClassification }: { isClassification: boolean }) {
  if (isClassification) {
    return (
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Axes />
        <ScatterPoints pts={CLASS_A} color={Colors.secondary} r={4} />
        <ScatterPoints pts={CLASS_B} color={Colors.danger} r={4} />
        {/* Progressive boundaries - each iteration gets better */}
        <Line x1={tx(0.50)} y1={ty(0.0)} x2={tx(0.50)} y2={ty(1.0)} stroke="#EF444440" strokeWidth={1.5} strokeDasharray="4,3" />
        <Line x1={tx(0.47)} y1={ty(0.0)} x2={tx(0.47)} y2={ty(1.0)} stroke="#F59E0B60" strokeWidth={1.5} strokeDasharray="4,3" />
        <Path d={`M${tx(0.44)},${ty(0.0)} Q${tx(0.43)},${ty(0.5)} ${tx(0.44)},${ty(1.0)}`} stroke={Colors.secondary} strokeWidth={2.5} fill="none" />
        {/* Iteration labels */}
        <SvgText x={tx(0.52)} y={ty(0.92)} fontSize={7} fill={Colors.danger} opacity={0.6}>iter 1</SvgText>
        <SvgText x={tx(0.49)} y={ty(0.85)} fontSize={7} fill={Colors.warning} opacity={0.7}>iter 2</SvgText>
        <SvgText x={tx(0.37)} y={ty(0.92)} fontSize={7} fill={Colors.secondary} fontWeight="600">iter N</SvgText>
        {/* Arrow showing progression */}
        <Path d={`M${tx(0.52)},${ty(0.50)} L${tx(0.45)},${ty(0.50)}`} stroke={Colors.text} strokeWidth={1} />
        <Polygon points={`${tx(0.45)},${ty(0.50)} ${tx(0.47)},${ty(0.52)} ${tx(0.47)},${ty(0.48)}`} fill={Colors.text} />
        <SvgText x={tx(0.50)} y={H - 4} fontSize={7} fill={Colors.textMuted} textAnchor="middle">Each tree corrects previous errors</SvgText>
      </Svg>
    );
  }
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Axes />
      <ScatterPoints pts={SAMPLE_PTS} color={Colors.primaryLight} />
      {/* Iteration 1: rough approximation */}
      <Path d={`M${tx(0.05)},${ty(0.30)} L${tx(0.95)},${ty(0.65)}`} stroke={Colors.danger} strokeWidth={1.5} fill="none" opacity={0.4} strokeDasharray="4,3" />
      {/* Iteration 2: closer */}
      <Path d={`M${tx(0.05)},${ty(0.18)} Q${tx(0.50)},${ty(0.50)} ${tx(0.95)},${ty(0.78)}`} stroke={Colors.warning} strokeWidth={1.5} fill="none" opacity={0.5} strokeDasharray="4,3" />
      {/* Final: close to data */}
      <Path d={`M${tx(0.05)},${ty(0.15)} Q${tx(0.25)},${ty(0.30)} ${tx(0.50)},${ty(0.50)} Q${tx(0.75)},${ty(0.70)} ${tx(0.95)},${ty(0.87)}`} stroke={Colors.secondary} strokeWidth={2.5} fill="none" />
      {/* Labels */}
      <SvgText x={tx(0.78)} y={ty(0.62)} fontSize={7} fill={Colors.danger} opacity={0.6}>iter 1</SvgText>
      <SvgText x={tx(0.82)} y={ty(0.73)} fontSize={7} fill={Colors.warning} opacity={0.7}>iter 2</SvgText>
      <SvgText x={tx(0.82)} y={ty(0.90)} fontSize={7} fill={Colors.secondary} fontWeight="600">iter N</SvgText>
    </Svg>
  );
}

// ── SVR / SVC: margin / epsilon tube ────────────────────────────────────
function SVMViz({ isClassification }: { isClassification: boolean }) {
  if (isClassification) {
    // Support vectors with max-margin hyperplane
    return (
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Axes />
        <ScatterPoints pts={CLASS_A} color={Colors.secondary} r={4} />
        <ScatterPoints pts={CLASS_B} color={Colors.danger} r={4} />
        {/* Decision boundary */}
        <Line x1={tx(0.10)} y1={ty(0.10)} x2={tx(0.90)} y2={ty(0.90)} stroke={Colors.primaryLight} strokeWidth={2.5} />
        {/* Margin lines */}
        <Line x1={tx(0.05)} y1={ty(0.20)} x2={tx(0.80)} y2={ty(0.95)} stroke={Colors.primaryLight} strokeWidth={1} strokeDasharray="5,3" opacity={0.5} />
        <Line x1={tx(0.20)} y1={ty(0.05)} x2={tx(0.95)} y2={ty(0.80)} stroke={Colors.primaryLight} strokeWidth={1} strokeDasharray="5,3" opacity={0.5} />
        {/* Margin area fill */}
        <Polygon
          points={`${tx(0.05)},${ty(0.20)} ${tx(0.80)},${ty(0.95)} ${tx(0.95)},${ty(0.80)} ${tx(0.20)},${ty(0.05)}`}
          fill={Colors.primaryLight}
          opacity={0.08}
        />
        {/* Support vectors - highlighted circles */}
        {[{ x: 0.28, y: 0.60 }, { x: 0.35, y: 0.70 }].map((p, i) => (
          <Circle key={`sv-a-${i}`} cx={tx(p.x)} cy={ty(p.y)} r={7} fill="none" stroke={Colors.warning} strokeWidth={2} />
        ))}
        {[{ x: 0.65, y: 0.20 }, { x: 0.72, y: 0.40 }].map((p, i) => (
          <Circle key={`sv-b-${i}`} cx={tx(p.x)} cy={ty(p.y)} r={7} fill="none" stroke={Colors.warning} strokeWidth={2} />
        ))}
        <SvgText x={tx(0.50)} y={H - 4} fontSize={7} fill={Colors.textMuted} textAnchor="middle">Maximum margin between classes</SvgText>
        {/* Legend for support vectors */}
        <Circle cx={tx(0.02)} cy={ty(0.02)} r={4} fill="none" stroke={Colors.warning} strokeWidth={1.5} />
        <SvgText x={tx(0.06)} y={ty(0.01)} fontSize={7} fill={Colors.textMuted}>support vectors</SvgText>
      </Svg>
    );
  }
  // SVR with epsilon tube
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Axes />
      <ScatterPoints pts={SAMPLE_PTS} color={Colors.primaryLight} />
      {/* Best-fit line */}
      <Line x1={tx(0.05)} y1={ty(0.12)} x2={tx(0.98)} y2={ty(0.90)} stroke={Colors.secondary} strokeWidth={2.5} />
      {/* Epsilon tube (upper & lower bounds) */}
      <Line x1={tx(0.05)} y1={ty(0.22)} x2={tx(0.98)} y2={ty(1.0)} stroke={Colors.warning} strokeWidth={1} strokeDasharray="5,3" />
      <Line x1={tx(0.05)} y1={ty(0.02)} x2={tx(0.98)} y2={ty(0.80)} stroke={Colors.warning} strokeWidth={1} strokeDasharray="5,3" />
      {/* Tube fill */}
      <Polygon
        points={`${tx(0.05)},${ty(0.22)} ${tx(0.98)},${ty(1.0)} ${tx(0.98)},${ty(0.80)} ${tx(0.05)},${ty(0.02)}`}
        fill={Colors.warning}
        opacity={0.08}
      />
      {/* Label */}
      <SvgText x={tx(0.85)} y={ty(0.98)} fontSize={8} fill={Colors.warning}>epsilon</SvgText>
      <SvgText x={tx(0.50)} y={H - 4} fontSize={7} fill={Colors.textMuted} textAnchor="middle">Points inside tube are ignored (epsilon-insensitive)</SvgText>
    </Svg>
  );
}

// ── KNN: neighbors visualization ────────────────────────────────────────
function KNNViz({ isClassification }: { isClassification: boolean }) {
  if (isClassification) {
    return (
      <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
        <Axes />
        <ScatterPoints pts={CLASS_A} color={Colors.secondary} r={4} />
        <ScatterPoints pts={CLASS_B} color={Colors.danger} r={4} />
        {/* New point to classify */}
        <Circle cx={tx(0.50)} cy={ty(0.50)} r={6} fill={Colors.warning} stroke={Colors.text} strokeWidth={1.5} />
        <SvgText x={tx(0.50)} y={ty(0.55)} fontSize={7} fill={Colors.warning} textAnchor="middle" fontWeight="600">new?</SvgText>
        {/* K=5 radius circle */}
        <Circle cx={tx(0.50)} cy={ty(0.50)} r={55} fill="none" stroke={Colors.primaryLight} strokeWidth={1.5} strokeDasharray="5,3" opacity={0.6} />
        <SvgText x={tx(0.50) + 58} y={ty(0.50)} fontSize={7} fill={Colors.primaryLight}>K=5</SvgText>
        {/* Lines to nearest neighbors */}
        {[
          { x: 0.35, y: 0.70, cls: 'a' }, { x: 0.30, y: 0.85, cls: 'a' },
          { x: 0.65, y: 0.20, cls: 'b' }, { x: 0.25, y: 0.75, cls: 'a' },
          { x: 0.70, y: 0.30, cls: 'b' },
        ].map((n, i) => (
          <Line key={i} x1={tx(0.50)} y1={ty(0.50)} x2={tx(n.x)} y2={ty(n.y)} stroke={Colors.textMuted} strokeWidth={0.8} strokeDasharray="3,2" opacity={0.5} />
        ))}
        <SvgText x={tx(0.50)} y={H - 4} fontSize={7} fill={Colors.textMuted} textAnchor="middle">3 UP vs 2 DOWN → predict UP (majority vote)</SvgText>
      </Svg>
    );
  }
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Axes />
      <ScatterPoints pts={SAMPLE_PTS} color={Colors.primaryLight} />
      {/* Query point */}
      <Circle cx={tx(0.53)} cy={ty(0.53)} r={6} fill={Colors.warning} stroke={Colors.text} strokeWidth={1.5} />
      {/* K=5 radius */}
      <Circle cx={tx(0.53)} cy={ty(0.53)} r={45} fill={Colors.primaryLight} fillOpacity={0.06} stroke={Colors.primaryLight} strokeWidth={1.5} strokeDasharray="5,3" opacity={0.6} />
      {/* Lines to neighbors */}
      {[
        { x: 0.45, y: 0.48 }, { x: 0.50, y: 0.50 },
        { x: 0.55, y: 0.55 }, { x: 0.60, y: 0.60 }, { x: 0.40, y: 0.42 },
      ].map((n, i) => (
        <Line key={i} x1={tx(0.53)} y1={ty(0.53)} x2={tx(n.x)} y2={ty(n.y)} stroke={Colors.warning} strokeWidth={1} strokeDasharray="3,2" opacity={0.7} />
      ))}
      {/* Predicted value = average of neighbors */}
      <Line x1={tx(0.53) - 10} y1={ty(0.51)} x2={tx(0.53) + 10} y2={ty(0.51)} stroke={Colors.secondary} strokeWidth={2} />
      <SvgText x={tx(0.62)} y={ty(0.53)} fontSize={7} fill={Colors.warning}>K=5</SvgText>
      <SvgText x={tx(0.50)} y={H - 4} fontSize={7} fill={Colors.textMuted} textAnchor="middle">Prediction = average of K nearest neighbors</SvgText>
    </Svg>
  );
}

// ── Logistic Regression: sigmoid curve ──────────────────────────────────
function LogisticRegressionViz() {
  // Generate sigmoid curve points
  const sigmoid = (x: number) => 1 / (1 + Math.exp(-(x - 0.5) * 12));
  const pts = Array.from({ length: 50 }, (_, i) => {
    const x = i / 49;
    return { x, y: sigmoid(x) };
  });
  const pathD = pts.map((p, i) =>
    `${i === 0 ? 'M' : 'L'}${tx(p.x)},${ty(p.y)}`
  ).join(' ');

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Axes />
      {/* Class points along top and bottom */}
      {[0.05, 0.12, 0.18, 0.22, 0.28, 0.33, 0.38].map((x, i) => (
        <Circle key={`b-${i}`} cx={tx(x)} cy={ty(0.08)} r={3.5} fill={Colors.danger} opacity={0.6} />
      ))}
      {[0.62, 0.68, 0.72, 0.78, 0.82, 0.88, 0.93].map((x, i) => (
        <Circle key={`a-${i}`} cx={tx(x)} cy={ty(0.92)} r={3.5} fill={Colors.secondary} opacity={0.6} />
      ))}
      {/* Sigmoid curve */}
      <Path d={pathD} stroke={Colors.primaryLight} strokeWidth={2.5} fill="none" />
      {/* Threshold line at 0.5 */}
      <Line x1={PAD} y1={ty(0.5)} x2={W - PAD} y2={ty(0.5)} stroke={Colors.warning} strokeWidth={1} strokeDasharray="5,3" opacity={0.6} />
      <SvgText x={W - PAD + 2} y={ty(0.5) + 3} fontSize={7} fill={Colors.warning}>0.5</SvgText>
      {/* Decision boundary */}
      <Line x1={tx(0.5)} y1={PAD} x2={tx(0.5)} y2={H - PAD} stroke={Colors.warning} strokeWidth={1.5} strokeDasharray="4,3" opacity={0.5} />
      {/* Labels */}
      <SvgText x={tx(0.75)} y={ty(0.70)} fontSize={9} fill={Colors.primaryLight} fontWeight="600">sigmoid</SvgText>
      <SvgText x={tx(0.20)} y={ty(0.17)} fontSize={8} fill={Colors.danger}>DOWN</SvgText>
      <SvgText x={tx(0.80)} y={ty(0.82)} fontSize={8} fill={Colors.secondary}>UP</SvgText>
      {/* Y-axis labels */}
      <SvgText x={PAD - 4} y={ty(1.0) + 3} fontSize={7} fill={Colors.textMuted} textAnchor="end">1</SvgText>
      <SvgText x={PAD - 4} y={ty(0.0) + 3} fontSize={7} fill={Colors.textMuted} textAnchor="end">0</SvgText>
    </Svg>
  );
}

// ── AdaBoost: weighted weak learners ────────────────────────────────────
function AdaBoostViz() {
  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      <Axes />
      {/* Weighted class A points (larger = higher weight from misclassification) */}
      {CLASS_A.map((p, i) => (
        <Circle key={`a-${i}`} cx={tx(p.x)} cy={ty(p.y)} r={i < 3 ? 6 : 3.5} fill={Colors.secondary} opacity={i < 3 ? 0.8 : 0.5} />
      ))}
      {CLASS_B.map((p, i) => (
        <Circle key={`b-${i}`} cx={tx(p.x)} cy={ty(p.y)} r={i < 2 ? 6 : 3.5} fill={Colors.danger} opacity={i < 2 ? 0.8 : 0.5} />
      ))}
      {/* Weak classifier stumps */}
      <Line x1={tx(0.40)} y1={PAD} x2={tx(0.40)} y2={H - PAD} stroke="#8B5CF680" strokeWidth={1.5} strokeDasharray="4,3" />
      <Line x1={PAD} y1={ty(0.55)} x2={W - PAD} y2={ty(0.55)} stroke="#EC489980" strokeWidth={1.5} strokeDasharray="4,3" />
      <Line x1={tx(0.55)} y1={PAD} x2={tx(0.55)} y2={H - PAD} stroke="#06B6D480" strokeWidth={1.5} strokeDasharray="4,3" />
      {/* Combined strong boundary */}
      <Path d={`M${tx(0.35)},${ty(1.0)} Q${tx(0.45)},${ty(0.55)} ${tx(0.55)},${ty(0.0)}`} stroke={Colors.secondary} strokeWidth={2.5} fill="none" />
      {/* Labels */}
      <SvgText x={tx(0.40)} y={ty(0.97)} fontSize={7} fill="#8B5CF6" opacity={0.7}>stump 1</SvgText>
      <SvgText x={tx(0.78)} y={ty(0.57)} fontSize={7} fill="#EC4899" opacity={0.7}>stump 2</SvgText>
      <SvgText x={tx(0.57)} y={ty(0.97)} fontSize={7} fill="#06B6D4" opacity={0.7}>stump 3</SvgText>
      <SvgText x={tx(0.50)} y={H - 4} fontSize={7} fill={Colors.textMuted} textAnchor="middle">Larger circles = higher weight (misclassified → focus)</SvgText>
    </Svg>
  );
}

// ── Voting Classifier: ensemble voting ──────────────────────────────────
function VotingViz() {
  const models = ['AdaBoost', 'Decision Tree', 'Grad. Boost'];
  const votes = ['UP', 'DOWN', 'UP'];
  const colors = ['#10B981', '#EF4444', '#10B981'];
  const boxW = 70;
  const boxH = 30;
  const startY = 25;
  const gap = 40;

  return (
    <Svg width={W} height={H} viewBox={`0 0 ${W} ${H}`}>
      {/* Model boxes */}
      {models.map((m, i) => {
        const y = startY + i * gap;
        return (
          <G key={i}>
            <Rect x={20} y={y} width={boxW} height={boxH} rx={6} fill={Colors.surfaceLight} stroke={Colors.border} strokeWidth={1} />
            <SvgText x={20 + boxW / 2} y={y + boxH / 2 + 4} fontSize={8} fill={Colors.text} textAnchor="middle" fontWeight="600">{m}</SvgText>
            {/* Arrow */}
            <Line x1={20 + boxW} y1={y + boxH / 2} x2={20 + boxW + 25} y2={y + boxH / 2} stroke={Colors.textMuted} strokeWidth={1} />
            {/* Vote badge */}
            <Rect x={20 + boxW + 28} y={y + 5} width={40} height={20} rx={4} fill={colors[i] + '30'} />
            <SvgText x={20 + boxW + 48} y={y + 19} fontSize={9} fill={colors[i]} textAnchor="middle" fontWeight="700">{votes[i]}</SvgText>
            {/* Arrow to final */}
            <Line x1={20 + boxW + 70} y1={y + boxH / 2} x2={W - 75} y2={H / 2} stroke={Colors.textMuted} strokeWidth={0.8} strokeDasharray="3,2" />
          </G>
        );
      })}
      {/* Final vote box */}
      <Rect x={W - 75} y={H / 2 - 22} width={60} height={44} rx={8} fill={Colors.secondary + '25'} stroke={Colors.secondary} strokeWidth={2} />
      <SvgText x={W - 45} y={H / 2 - 5} fontSize={8} fill={Colors.textSecondary} textAnchor="middle">Majority</SvgText>
      <SvgText x={W - 45} y={H / 2 + 12} fontSize={12} fill={Colors.secondary} textAnchor="middle" fontWeight="800">UP</SvgText>
      {/* Tally */}
      <SvgText x={W - 45} y={H / 2 + 30} fontSize={7} fill={Colors.textMuted} textAnchor="middle">2 vs 1</SvgText>
    </Svg>
  );
}


// ─── Map API snake_case names → internal keys ──────────────────────────
// API returns: linear_regression, decision_tree, random_forest,
//   gradient_boosting, svr, knn, logistic_regression, svc, adaboost,
//   voting_classifier
const API_NAME_MAP: Record<string, Record<string, string>> = {
  regression: {
    linear_regression:   'LinearRegression',
    decision_tree:       'DecisionTreeRegressor',
    random_forest:       'RandomForestRegressor',
    gradient_boosting:   'GradientBoostingRegressor',
    svr:                 'LinearSVR',
    knn:                 'KNeighborsRegressor',
  },
  classification: {
    logistic_regression: 'LogisticRegression',
    decision_tree:       'DecisionTreeClassifier',
    random_forest:       'RandomForestClassifier',
    gradient_boosting:   'GradientBoostingClassifier',
    svc:                 'LinearSVC',
    knn:                 'KNeighborsClassifier',
    adaboost:            'AdaBoostClassifier',
    voting_classifier:   'VotingClassifier',
  },
};

function resolveModelKey(name: string, type: 'regression' | 'classification'): string {
  const lower = name.toLowerCase().trim();
  // 1. Direct lookup from API name map
  const mapped = API_NAME_MAP[type]?.[lower];
  if (mapped) return mapped;
  // 2. Try without underscores/spaces (PascalCase input)
  const stripped = lower.replace(/[_\s]/g, '');
  for (const [apiName, internalKey] of Object.entries(API_NAME_MAP[type] || {})) {
    if (apiName.replace(/_/g, '') === stripped) return internalKey;
    if (internalKey.toLowerCase() === stripped) return internalKey;
  }
  // 3. Partial match fallback
  for (const [apiName, internalKey] of Object.entries(API_NAME_MAP[type] || {})) {
    if (stripped.includes(apiName.replace(/_/g, '')) || apiName.replace(/_/g, '').includes(stripped)) {
      return internalKey;
    }
  }
  return name;
}

// ─── Pick correct illustration ──────────────────────────────────────────
function getIllustration(key: string, type: 'regression' | 'classification') {
  const isCls = type === 'classification';
  switch (key) {
    case 'LinearRegression':
      return <LinearRegressionViz />;
    case 'LogisticRegression':
      return <LogisticRegressionViz />;
    case 'DecisionTreeRegressor':
    case 'DecisionTreeClassifier':
      return <DecisionTreeViz isClassification={isCls} />;
    case 'RandomForestRegressor':
    case 'RandomForestClassifier':
      return <RandomForestViz isClassification={isCls} />;
    case 'GradientBoostingRegressor':
    case 'GradientBoostingClassifier':
      return <GradientBoostingViz isClassification={isCls} />;
    case 'LinearSVR':
    case 'LinearSVC':
      return <SVMViz isClassification={isCls} />;
    case 'KNeighborsRegressor':
    case 'KNeighborsClassifier':
      return <KNNViz isClassification={isCls} />;
    case 'AdaBoostClassifier':
      return <AdaBoostViz />;
    case 'VotingClassifier':
      return <VotingViz />;
    default:
      return null;
  }
}


// ─── Main Component ─────────────────────────────────────────────────────
export default function AlgorithmVisualizer({ modelName, type }: Props) {
  const key = resolveModelKey(modelName, type);
  const info = ALGO_INFO[key];
  const illustration = getIllustration(key, type);

  if (!info && !illustration) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Ionicons
          name={(info?.icon || 'bulb') as any}
          size={16}
          color={Colors.primaryLight}
        />
        <Text style={styles.title}>How It Works</Text>
      </View>

      {/* Algorithm illustration */}
      {illustration && (
        <View style={styles.illustrationWrap}>
          {illustration}
        </View>
      )}

      {info && (
        <>
          {/* Description */}
          <Text style={styles.description}>{info.description}</Text>

          {/* Mechanism */}
          <View style={styles.mechanismBox}>
            <Ionicons name="cog" size={12} color={Colors.warning} />
            <Text style={styles.mechanismText}>{info.howItWorks}</Text>
          </View>

          {/* Strengths */}
          <View style={styles.strengthsWrap}>
            <Text style={styles.strengthsTitle}>Strengths</Text>
            <View style={styles.strengthsRow}>
              {info.strengths.map((s, i) => (
                <View key={i} style={styles.strengthChip}>
                  <Ionicons name="checkmark-circle" size={10} color={Colors.secondary} />
                  <Text style={styles.strengthText}>{s}</Text>
                </View>
              ))}
            </View>
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.surfaceLight,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginTop: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.primary + '30',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.md,
  },
  title: {
    color: Colors.primaryLight,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  illustrationWrap: {
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    padding: Spacing.sm,
    marginBottom: Spacing.md,
  },
  description: {
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  mechanismBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    backgroundColor: Colors.warning + '10',
    padding: Spacing.md,
    borderRadius: BorderRadius.sm,
    marginBottom: Spacing.md,
  },
  mechanismText: {
    color: Colors.text,
    fontSize: FontSize.xs,
    flex: 1,
    lineHeight: 18,
  },
  strengthsWrap: {
    marginTop: Spacing.xs,
  },
  strengthsTitle: {
    color: Colors.textMuted,
    fontSize: FontSize.xs,
    fontWeight: '700',
    marginBottom: Spacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  strengthsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  strengthChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.secondary + '12',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  strengthText: {
    color: Colors.textSecondary,
    fontSize: 10,
  },
});
