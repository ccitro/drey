/**
 * Parts of this file are based on react-nest-thermostat
 * https://github.com/kevinmellott91/react-nest-thermostat
 * Author: KevinMellott91 https://github.com/KevinMellott91
 *
 * Which itself was inspirted by the "Nest Thermostat Control" codepen
 * https://codepen.io/dalhundal/pen/KpabZB/
 * Author: Dal Hundal https://codepen.io/dalhundal/
 *
 * LICENSE: https://github.com/KevinMellott91/react-nest-thermostat/blob/ea3b68963483929140ccb7be1198ff01b3e391f1/LICENSE
 *
 * The MIT License
 *
 * Copyright (c) 2016 Kevin Mellott
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import React, { ReactNode } from "react";
import { useAppSelector } from "store/store";
import { selectThermostat } from "store/systemStatesSlice";

interface ThermostatDialProps {
    ambient: number;
    target: number;
    mode: HvacState;
}

type InnerProps = Omit<ThermostatDialProps, "mode">;

type Point = [number, number];

const RENDER_SIZE = 400;
const diameter = RENDER_SIZE;
const radius = diameter / 2;
const minTemp = 50;
const maxTemp = 85;
const numTicks = 100;
const ticksOuterRadius = diameter / 30;
const ticksInnerRadius = diameter / 8;
const tickDegrees = 300;
const rangeValue = maxTemp - minTemp;
const offsetDegrees = 180 - (360 - tickDegrees) / 2;

function rotatePoint(point: Point, angle: number, origin: Point): Point {
    const radians = (angle * Math.PI) / 180;
    const x = point[0] - origin[0];
    const y = point[1] - origin[1];
    const x1 = x * Math.cos(radians) - y * Math.sin(radians) + origin[0];
    const y1 = x * Math.sin(radians) + y * Math.cos(radians) + origin[1];
    return [x1, y1];
}

function rotatePoints(points: Point[], angle: number, origin: Point) {
    return points.map((p) => rotatePoint(p, angle, origin));
}

function pointsToPath(points: Point[]): string {
    return [points.map((p, i) => [i > 0 ? "L" : "M", p[0], " ", p[1]].join("")).join(" "), "Z"].join("");
}

function restrictToRange(val: number, min: number, max: number) {
    if (val < min) return min;
    if (val > max) return max;
    return val;
}

const Ticks: React.FC<InnerProps> = React.memo(({ ambient, target }) => {
    // Determine the maximum and minimum values to display.
    const actualMinValue = Math.min(ambient, target);
    const actualMaxValue = Math.max(ambient, target);
    const min = restrictToRange(Math.round(((actualMinValue - minTemp) / rangeValue) * numTicks), 0, numTicks - 1);
    const max = restrictToRange(Math.round(((actualMaxValue - minTemp) / rangeValue) * numTicks), 0, numTicks - 1);

    // Renders the degree ticks around the outside of the thermostat.
    const tickPoints: Point[] = [
        [radius - 1, ticksOuterRadius],
        [radius + 1, ticksOuterRadius],
        [radius + 1, ticksInnerRadius],
        [radius - 1, ticksInnerRadius],
    ];
    const tickPointsLarge: Point[] = [
        [radius - 1.5, ticksOuterRadius],
        [radius + 1.5, ticksOuterRadius],
        [radius + 1.5, ticksInnerRadius + 20],
        [radius - 1.5, ticksInnerRadius + 20],
    ];
    const theta = tickDegrees / numTicks;
    const offsetDegrees = 180 - (360 - tickDegrees) / 2;
    const tickArray: ReactNode[] = [];
    for (let iTick = 0; iTick < numTicks; iTick++) {
        const isLarge = iTick === min || iTick === max;
        const isActive = iTick >= min && iTick <= max;
        const tickElement = React.createElement("path", {
            key: ["tick-", iTick].join(""),
            d: pointsToPath(
                rotatePoints(isLarge ? tickPointsLarge : tickPoints, iTick * theta - offsetDegrees, [radius, radius])
            ),
            style: {
                fill: isActive ? "rgba(255, 255, 255, 0.8)" : "rgba(255, 255, 255, 0.3)",
            },
        });
        tickArray.push(tickElement);
    }

    return <g>{tickArray}</g>;
});
Ticks.displayName = "Ticks";

function Ambient({ ambient, target }: InnerProps) {
    const lblAmbientPosition: Point = [radius, ticksOuterRadius - (ticksOuterRadius - ticksInnerRadius) / 2];
    const peggedValue = restrictToRange(ambient, minTemp, maxTemp);
    let degs = (tickDegrees * (peggedValue - minTemp)) / rangeValue - offsetDegrees;
    if (peggedValue > target) {
        degs += 8;
    } else {
        degs -= 8;
    }
    const ambientPosition = rotatePoint(lblAmbientPosition, degs, [radius, radius]);
    return (
        <text
            x={ambientPosition[0]}
            y={ambientPosition[1]}
            style={{
                fill: "white",
                textAnchor: "middle",
                fontFamily: "Helvetica, sans-serif",
                alignmentBaseline: "central",
                fontSize: "22px",
                fontWeight: "bold",
            }}
        >
            {ambient}
        </text>
    );
}

export default function ThermostatDial({ thermostat }: { thermostat: string }) {
    const thermostatStatus = useAppSelector((state) => selectThermostat(state, thermostat));
    const ambient = Math.round(thermostatStatus.functionalCurrentTemp);
    const target = Math.round(thermostatStatus.targetTemp);
    const mode = thermostatStatus.hvacState;

    const colors: Partial<Record<HvacState, string>> = { heating: "#E36304", cooling: "#3700b3" };
    const styles: Record<string, React.CSSProperties> = {
        circle: {
            fill: colors[mode] ?? "#222",
            transition: "fill 0.5s",
        },
        target: {
            fill: "white",
            textAnchor: "middle",
            fontFamily: "sans-serif",
            alignmentBaseline: "central",
            fontSize: "120px",
            fontWeight: "bold",
        },
    };

    return (
        <div style={{ width: "300px", margin: "16px auto", userSelect: "none" }}>
            <svg width="100%" height="100%" viewBox={`0 0 ${RENDER_SIZE} ${RENDER_SIZE}`}>
                <circle cx={radius} cy={radius} r={radius} style={styles.circle} />
                <text x={radius} y={radius} style={styles.target}>
                    {target}
                </text>
                <Ticks ambient={ambient} target={target} />
                <Ambient ambient={ambient} target={target} />
            </svg>
        </div>
    );
}
