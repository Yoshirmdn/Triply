export type RouteLegDTO = {
  distance: number;
  time: number;
};

export type RouteDTO = {
  distance: number;
  time: number;
  legs: RouteLegDTO[];
  line: [number, number][][];
};