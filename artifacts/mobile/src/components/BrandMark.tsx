import React from "react";
import { View } from "react-native";
import Svg, { Rect, Text as SvgText } from "react-native-svg";

import { C } from "@/constants/colors";

type Props = {
  height?: number;
  monochrome?: boolean;
};

const VB_X = 15;
const VB_Y = 58;
const VB_W = 360;
const VB_H = 105;

export function BrandMark({ height = 26, monochrome = false }: Props) {
  const width = (VB_W / VB_H) * height;
  const accent = monochrome ? C.ink : "#CC0000";
  const wordmark = monochrome ? C.ink : "#CC0000";
  const grey1 = monochrome ? "#9CA3AF" : "#BBBBBB";
  const grey2 = monochrome ? "#6B7280" : "#444444";
  const grey3 = monochrome ? "#3C4858" : "#111111";

  return (
    <View
      accessible
      accessibilityRole="image"
      accessibilityLabel="AUM"
      style={{ width, height }}
    >
      <Svg
        width={width}
        height={height}
        viewBox={`${VB_X} ${VB_Y} ${VB_W} ${VB_H}`}
      >
        <Rect x={20} y={121} width={11} height={34} fill={grey1} />
        <Rect x={36} y={99} width={11} height={56} fill={grey2} />
        <Rect x={52} y={85} width={11} height={70} fill={grey3} />
        <Rect x={68} y={69} width={11} height={86} fill={accent} />
        <SvgText
          x={90}
          y={155}
          fontFamily="Times New Roman"
          fontWeight="700"
          fontSize={120}
          fill={wordmark}
        >
          AUM
        </SvgText>
      </Svg>
    </View>
  );
}
