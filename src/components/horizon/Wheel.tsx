import {
  useEffect,
  useId,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { animate, useReducedMotion } from 'framer-motion';
import referenceMap from '../../data/horizon/map.json';
import {
  arc,
  point,
  sector,
  sourceAreaUrl,
  sectorRotation,
  axisColor,
  angleDelta,
} from './geometry';
import { SYMBOL_PATHS, type SymbolType } from './symbolPaths';
import Intro from './Intro';

export type Category = (typeof referenceMap.categories)[number] & {
  description?: string;
  lightText?: boolean;
};
export type Axis = Omit<(typeof referenceMap.axes)[number], 'axisValue'> & {
  axisValue: number | null;
  description?: string;
};
export interface WheelData {
  categories: Category[];
  axes: Axis[];
}
function isAxis(value: Category | Axis): value is Axis {
  return 'axisName' in value;
}

interface Props {
  exploring: boolean;
  selected: string | null;
  onExplore: () => void;
  onSelect: (id: string) => void;
  mobile: boolean;
  map?: WheelData;
  intro?: ReactNode;
  renderCenter?: (item: Category | Axis | null | undefined) => ReactNode;
  onAxisSelect?: (id: string) => void;
  label?: string;
  introRadius?: number;
  exploreRadius?: number;
}

export default function Wheel({
  exploring,
  selected,
  onExplore,
  onSelect,
  mobile,
  map = referenceMap,
  intro,
  renderCenter,
  onAxisSelect,
  label = 'Interactive climate technology map',
  introRadius = 300,
  exploreRadius = 150,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 1440, height: 932 });
  const [hovered, setHovered] = useState<Category | Axis | null>(null);
  const [labelWidths, setLabelWidths] = useState<Record<string, number>>({});
  const [inner, setInner] = useState(mobile ? 115 : exploring ? exploreRadius : introRadius);
  const radius = useRef(inner);
  const [rotation, setRotation] = useState(() => {
    const category = map.categories.find((item) => item.categoryId === selected);
    return category
      ? sectorRotation(0, category.categoryStartAngleDegree, category.categoryEndAngleDegree)
      : 0;
  });
  const [rotating, setRotating] = useState(false);
  const [dragging, setDragging] = useState(false);
  const [transitionDuration, setTransitionDuration] = useState(3000);
  const rotationRef = useRef<SVGGElement>(null);
  const rotationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suppressClick = useRef(false);
  const gesture = useRef<{
    pointerId: number;
    x: number;
    y: number;
    angle: number;
    rotation: number;
    selection: string | null;
    moved: boolean;
  } | null>(null);
  const reducedMotion = useReducedMotion();
  const previousSelection = useRef(selected);
  const prefix = useId().replaceAll(':', '');
  const activeCategory = map.categories.find((category) => category.categoryId === selected);
  const outer = inner + 26;
  const extent = Math.hypot(size.width, size.height) + inner;
  const scale = mobile
    ? 1
    : Math.min(1, size.height / (2 * (exploring ? exploreRadius : introRadius) + 52));
  // The original mobile viewport is tangent to the widest sector's inner arc.
  const widestSector = Math.max(
    ...map.categories.map((category) => category.categorySpanAngleDegree),
  );
  const cx = mobile ? -115 * Math.cos((widestSector * Math.PI) / 360) : size.width / 2;
  const cy = size.height / 2;

  useEffect(() => {
    if (!ref.current) return;
    const observer = new ResizeObserver(([entry]) =>
      setSize({ width: entry.contentRect.width, height: entry.contentRect.height }),
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const target = mobile ? 115 : exploring ? exploreRadius : introRadius;
    const animation = animate(radius.current, target, {
      duration: reducedMotion ? 0 : 0.5,
      ease: [0.645, 0.045, 0.355, 1],
      onUpdate: (value) => {
        radius.current = value;
        setInner(value);
      },
    });
    return () => animation.stop();
  }, [exploring, mobile, reducedMotion, introRadius, exploreRadius]);

  useEffect(() => {
    if (rotationTimer.current) clearTimeout(rotationTimer.current);
    const category = map.categories.find((item) => item.categoryId === selected);
    const changed = previousSelection.current !== selected;
    previousSelection.current = selected;
    setHovered(null);
    if (gesture.current?.moved) return;
    setTransitionDuration(3000);
    if (!category) {
      setRotation(0);
      setRotating(false);
      return;
    }
    setRotation((current) =>
      sectorRotation(current, category.categoryStartAngleDegree, category.categoryEndAngleDegree),
    );
    if (!changed || reducedMotion) {
      setRotating(false);
      return;
    }
    setRotating(true);
    rotationTimer.current = setTimeout(() => setRotating(false), 3000);
    return () => {
      if (rotationTimer.current) clearTimeout(rotationTimer.current);
    };
  }, [selected, reducedMotion, map]);

  const nearestCategory = (angle: number) =>
    map.categories.reduce((closest, category) => {
      const distance = (item: Category) =>
        Math.abs(
          sectorRotation(angle, item.categoryStartAngleDegree, item.categoryEndAngleDegree) - angle,
        );
      return distance(category) < distance(closest) ? category : closest;
    });

  useEffect(
    () => () => {
      if (rotationTimer.current) clearTimeout(rotationTimer.current);
    },
    [],
  );

  const pointerAngle = (event: PointerEvent<SVGSVGElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    return (
      (Math.atan2(event.clientY - bounds.top - cy, event.clientX - bounds.left - cx) * 180) /
      Math.PI
    );
  };
  const startDrag = (event: PointerEvent<SVGSVGElement>) => {
    if (!event.isPrimary || event.button !== 0 || gesture.current) return;
    suppressClick.current = false;
    gesture.current = {
      pointerId: event.pointerId,
      x: event.clientX,
      y: event.clientY,
      angle: pointerAngle(event),
      rotation,
      selection: selected,
      moved: false,
    };
  };
  const moveDrag = (event: PointerEvent<SVGSVGElement>) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    if (!current.moved && Math.hypot(event.clientX - current.x, event.clientY - current.y) < 6)
      return;
    if (!current.moved) {
      // Freeze the visible angle when movement starts, even after holding down
      // on a wheel that was already animating toward a clicked sector.
      if (rotationRef.current) {
        const matrix = new DOMMatrixReadOnly(getComputedStyle(rotationRef.current).transform);
        const visibleAngle = (Math.atan2(matrix.b, matrix.a) * 180) / Math.PI;
        current.rotation = rotation + angleDelta(rotation, visibleAngle);
      }
      current.moved = true;
      event.currentTarget.setPointerCapture(event.pointerId);
      if (rotationTimer.current) clearTimeout(rotationTimer.current);
      setDragging(true);
      setRotating(false);
      setHovered(null);
      suppressClick.current = true;
    }
    const angle = pointerAngle(event);
    current.rotation += angleDelta(current.angle, angle);
    current.angle = angle;
    setRotation(current.rotation);
    const nearest = nearestCategory(current.rotation);
    if (current.selection !== nearest.categoryId) {
      current.selection = nearest.categoryId;
      onSelect(nearest.categoryId);
    }
  };
  const endDrag = (event: PointerEvent<SVGSVGElement>) => {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;
    gesture.current = null;
    if (event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
    if (!current.moved) return;
    setDragging(false);
    setTransitionDuration(450);
    setRotating(!reducedMotion);
    if (rotationTimer.current) clearTimeout(rotationTimer.current);
    rotationTimer.current = setTimeout(() => setRotating(false), reducedMotion ? 0 : 450);
    const nearest = nearestCategory(current.rotation);
    setRotation(
      sectorRotation(
        current.rotation,
        nearest.categoryStartAngleDegree,
        nearest.categoryEndAngleDegree,
      ),
    );
  };

  useEffect(() => {
    let active = true;
    document.fonts.load('15px "Horizon Otto"').then(() => {
      if (!active) return;
      const context = document.createElement('canvas').getContext('2d');
      if (!context) return;
      context.font = '15px "Horizon Otto"';
      setLabelWidths(
        Object.fromEntries(
          map.axes.map((axis) => [axis.axisId, context.measureText(axis.axisName).width]),
        ),
      );
    });
    return () => {
      active = false;
    };
  }, [map]);

  const select = (id: string) => {
    // In the reference the first click only opens the wheel; it does not choose a sector.
    if (!exploring) {
      onExplore();
      return;
    }
    if (rotating) return;
    setHovered(null);
    onSelect(id);
  };
  const keyboardSelect = (event: KeyboardEvent<SVGGElement>, id: string) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      select(id);
    }
  };
  const center = hovered ?? activeCategory;
  const centerName = center && (isAxis(center) ? center.axisName : center.categoryName);
  const centerValue = center && (isAxis(center) ? center.axisValue : center.categoryValue);
  const hoveredAxis = hovered && isAxis(hovered) ? hovered : null;
  const hoveredCategory = hovered && !isAxis(hovered) ? hovered : null;

  return (
    <div
      ref={ref}
      className={`horizon-wheel relative z-2 min-h-0 flex-1 overflow-hidden ${rotating ? '[&_.horizon-map-interaction]:pointer-events-none' : ''}`}
    >
      <svg
        className={`block touch-none select-none [&_*]:cursor-inherit ${dragging ? 'cursor-grabbing' : 'cursor-grab'}`}
        width={size.width}
        height={size.height}
        viewBox={`0 0 ${size.width} ${size.height}`}
        aria-label={label}
        aria-description="Drag to rotate the map, or select an area."
        onPointerDown={startDrag}
        onPointerMove={moveDrag}
        onPointerUp={(event) => endDrag(event)}
        onPointerCancel={(event) => endDrag(event)}
        onLostPointerCapture={(event) => {
          // Touch starts with implicit capture on a path. Its loss bubbles when
          // capture transfers to the SVG; that transfer must not end the drag.
          if (
            event.target === event.currentTarget &&
            !event.currentTarget.hasPointerCapture(event.pointerId)
          )
            endDrag(event);
        }}
        onPointerLeave={(event) => {
          if (!gesture.current?.moved) endDrag(event);
        }}
        onDragStart={(event) => event.preventDefault()}
        onClickCapture={(event) => {
          if (suppressClick.current && event.detail !== 0) {
            event.preventDefault();
            event.stopPropagation();
          }
        }}
      >
        <g transform={`translate(${cx} ${cy}) scale(${scale})`}>
          <g
            ref={rotationRef}
            className="horizon-wheel-rotation transition-transform duration-[3000ms] ease-in-out motion-reduce:transition-none"
            style={{
              transform: `rotate(${rotation}deg)`,
              transitionDuration: dragging || reducedMotion ? '0ms' : `${transitionDuration}ms`,
            }}
          >
            {/* Color occupies only the area between the sector's five-degree gutters. */}
            {map.categories.map((category) => (
              <path
                key={category.categoryId}
                className="horizon-sector-color pointer-events-none transition-[fill,fill-opacity] duration-500 motion-reduce:transition-none"
                d={sector(
                  outer,
                  extent,
                  category.categoryArcStartAngleDegree,
                  category.categoryArcEndAngleDegree,
                )}
                fill={category.categoryColor}
                fillOpacity={
                  exploring &&
                  hoveredCategory?.categoryId === category.categoryId &&
                  selected !== category.categoryId
                    ? 0.5
                    : 0
                }
              />
            ))}
            {exploring &&
              map.axes
                .filter((axis) => axis.categoryId === selected)
                .map((axis) => {
                  const index = axis.axisIdsOfSameCategory.indexOf(axis.axisId);
                  const hoveredIndex = hoveredAxis
                    ? axis.axisIdsOfSameCategory.indexOf(hoveredAxis.axisId)
                    : -1;
                  return (
                    <path
                      key={axis.axisId}
                      className="horizon-axis-color pointer-events-none transition-[fill,fill-opacity] duration-500 motion-reduce:transition-none"
                      d={sector(outer, extent, axis.axisStartAngleDegree, axis.axisEndAngleDegree)}
                      fill={axisColor(axis.categoryColorPalette, index, hoveredIndex)}
                    />
                  );
                })}
            {/* Reference grid stays at 335/435/535/635/735px when the hub shrinks. */}
            {(mobile ? [300] : [335, 435, 535, 635, 735]).map((r) => (
              <g
                key={r}
                className="horizon-grid fill-none stroke-(--color-sns-black) [stroke-opacity:0.1] [stroke-width:1]"
              >
                {map.categories.map((category) => (
                  <path
                    key={category.categoryId}
                    d={arc(
                      r,
                      category.categoryArcStartAngleDegree,
                      category.categoryArcEndAngleDegree,
                    )}
                  />
                ))}
              </g>
            ))}
            {map.categories.map((category) => (
              <g
                key={category.categoryId}
                className="horizon-sector horizon-map-interaction focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-(--color-sns-blue-3) [&:focus:not(:focus-visible)]:outline-none"
                role="button"
                tabIndex={mobile ? -1 : 0}
                aria-label={`Explore ${category.categoryName}`}
                aria-pressed={selected === category.categoryId}
                onKeyDown={(event) => keyboardSelect(event, category.categoryId)}
                onClick={() => select(category.categoryId)}
                onMouseEnter={() =>
                  exploring &&
                  !rotating &&
                  !dragging &&
                  selected !== category.categoryId &&
                  setHovered(category)
                }
                onMouseLeave={() => setHovered(null)}
              >
                <path
                  className="horizon-sector-hit cursor-pointer transition-[fill-opacity] duration-250 motion-reduce:transition-none"
                  d={sector(
                    outer,
                    extent,
                    category.categoryStartAngleDegree,
                    category.categoryEndAngleDegree,
                  )}
                  fill="transparent"
                  pointerEvents={exploring && selected === category.categoryId ? 'none' : undefined}
                />
                {!exploring && (
                  <path
                    className="horizon-divider pointer-events-none fill-none stroke-(--color-sns-black) [stroke-width:0.7]"
                    d={`M ${point(inner, category.categoryStartAngleDegree)} L ${point(extent, category.categoryStartAngleDegree)}`}
                  />
                )}
                {exploring && (
                  <path
                    className="horizon-sector-outline pointer-events-none fill-none stroke-(--color-sns-black) [stroke-width:0.7]"
                    d={arc(
                      outer + 10,
                      category.categoryArcStartAngleDegree,
                      category.categoryArcEndAngleDegree,
                    )}
                  />
                )}
              </g>
            ))}
            {exploring &&
              map.axes
                .filter((axis) => axis.categoryId === selected)
                .map((axis) =>
                  onAxisSelect ? (
                    <g
                      key={axis.axisId}
                      className="horizon-axis-hit horizon-map-interaction cursor-pointer focus-visible:outline-2 focus-visible:outline-(--color-sns-blue-3)"
                      role="button"
                      tabIndex={0}
                      aria-label={`Explore ${axis.axisName}`}
                      onClick={() => !rotating && onAxisSelect(axis.axisId)}
                      onKeyDown={(event) => {
                        if (event.key === 'Enter' || event.key === ' ') {
                          event.preventDefault();
                          if (!rotating) onAxisSelect(axis.axisId);
                        }
                      }}
                      onMouseEnter={() => !rotating && !dragging && setHovered(axis)}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={() => setHovered(axis)}
                      onBlur={() => setHovered(null)}
                    >
                      <path
                        d={sector(
                          outer,
                          extent,
                          axis.axisStartAngleDegree,
                          axis.axisEndAngleDegree,
                        )}
                        fill="transparent"
                      />
                    </g>
                  ) : (
                    <a
                      key={axis.axisId}
                      className="horizon-axis-hit horizon-map-interaction"
                      href={sourceAreaUrl(axis.axisId)}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`${axis.axisName} — read on Climate Tech Map`}
                      onMouseEnter={() => !rotating && !dragging && setHovered(axis)}
                      onMouseLeave={() => setHovered(null)}
                      onFocus={() => setHovered(axis)}
                      onBlur={() => setHovered(null)}
                    >
                      <path
                        d={sector(
                          outer,
                          extent,
                          axis.axisStartAngleDegree,
                          axis.axisEndAngleDegree,
                        )}
                        fill="transparent"
                      />
                    </a>
                  ),
                )}
            {map.axes.map((axis) => {
              const angle = axis.axisAngleDegree;
              const labelRadius = inner + 56;
              const width = labelWidths[axis.axisId] ?? axis.axisName.length * 7.8;
              const showLabel = exploring && (!mobile || selected === axis.categoryId);
              return (
                <g
                  key={axis.axisId}
                  className="horizon-axis-graphics pointer-events-none"
                  aria-hidden="true"
                >
                  <path
                    className="horizon-axis-line fill-none stroke-(--color-sns-black) [stroke-opacity:0.1] [stroke-width:1]"
                    d={`M ${point(outer, angle)} L ${point(labelRadius, angle)} M ${point(labelRadius + (showLabel ? width + 10 : 0), angle)} L ${point(extent, angle)}`}
                  />
                  {showLabel && (
                    <g
                      transform={`rotate(${angle})`}
                      className="horizon-axis fill-(--color-sns-black) text-[15px] [font-family:'Horizon_Otto',Georgia,serif]"
                    >
                      <text x={labelRadius + 5} dominantBaseline="middle">
                        {axis.axisName}
                      </text>
                      {!mobile &&
                        axis.symbols.map((symbol, index) => (
                          <g
                            key={`${symbol.type}-${symbol.id}-${index}`}
                            transform={`translate(${labelRadius + width + 33 + index * 19} 0)`}
                          >
                            <path
                              d={SYMBOL_PATHS[symbol.type as SymbolType]}
                              transform={`rotate(${(symbol.type === 'imperative' ? 90 : symbol.type === 'moonshot' ? 180 : 0) - angle}) scale(1.1666667)`}
                            />
                          </g>
                        ))}
                      {mobile && (
                        <path
                          className="horizon-axis-underline fill-none stroke-(--color-sns-black) [stroke-width:0.7]"
                          d={`M ${labelRadius + 5} 10 H ${labelRadius + width + 5}`}
                        />
                      )}
                    </g>
                  )}
                </g>
              );
            })}
            {map.categories.map((category, index) => {
              const active = selected === category.categoryId;
              const colored =
                !exploring ||
                (!hoveredCategory && !selected) ||
                active ||
                hoveredCategory?.categoryId === category.categoryId;
              const lightText =
                category.lightText ??
                ['Buildings', 'Manufacturing', 'Food, Ag & Nature'].includes(category.categoryId);
              return (
                <g
                  key={category.categoryId}
                  className="horizon-ring horizon-map-interaction cursor-pointer [&>path:first-child]:stroke-(--color-sns-black) [&>path:first-child]:[stroke-width:0.7] [&_text]:pointer-events-none [&_text]:font-mono [&_text]:text-xs"
                  onClick={() => select(category.categoryId)}
                  onMouseEnter={() => exploring && !rotating && !dragging && setHovered(category)}
                  onMouseLeave={() => setHovered(null)}
                >
                  <path
                    d={sector(
                      inner,
                      outer,
                      category.categoryStartAngleDegree,
                      category.categoryEndAngleDegree,
                    )}
                    fill={colored ? category.categoryColor : 'var(--color-sns-off-white)'}
                  />
                  <path
                    id={`${prefix}-arc-${index}`}
                    d={arc(
                      inner + 13,
                      category.categoryStartAngleDegree,
                      category.categoryEndAngleDegree,
                    )}
                    fill="none"
                    stroke="none"
                  />
                  {(!mobile || active) && (
                    <text
                      fill={
                        colored && lightText ? 'var(--color-sns-white)' : 'var(--color-sns-black)'
                      }
                      letterSpacing={exploring ? 0 : 4}
                    >
                      <textPath
                        dominantBaseline="central"
                        href={`#${prefix}-arc-${index}`}
                        startOffset="50%"
                        textAnchor="middle"
                      >
                        {category.categoryName.toUpperCase()}
                      </textPath>
                    </text>
                  )}
                </g>
              );
            })}
          </g>
        </g>
      </svg>
      {!mobile && (
        <div
          className="horizon-wheel-center absolute top-1/2 left-1/2 z-3 overflow-hidden rounded-full bg-(--color-sns-off-white)"
          style={{
            width: 2 * inner - 2,
            height: 2 * inner - 2,
            transform: `translate(-50%, -50%) scale(${scale})`,
          }}
        >
          {exploring ? (
            renderCenter ? (
              renderCenter(center)
            ) : (
              <div className="horizon-center-detail" aria-live="polite">
                <h2>{centerName ?? 'Hover to learn more'}</h2>
                {center && (
                  <>
                    <hr />
                    <p className={centerValue == null ? 'horizon-no-estimate' : undefined}>
                      {centerValue == null
                        ? 'Emissions not estimated by IPCC'
                        : `${centerValue.toFixed(1)} GT`}
                    </p>
                    {centerValue != null && <span>EMISSIONS IN 2050</span>}
                  </>
                )}
              </div>
            )
          ) : (
            (intro ?? <Intro onExplore={onExplore} />)
          )}
        </div>
      )}
    </div>
  );
}
