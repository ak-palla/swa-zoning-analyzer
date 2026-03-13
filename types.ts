
export enum LotType {
  INTERIOR = 'Interior',
  CORNER = 'Corner'
}

export enum StreetWidth {
  WIDE = 'Wide',
  NARROW = 'Narrow'
}

export enum TransitZone {
  INNER = 'Inner Transit Zone',
  OUTER = 'Outer Transit Zone',
  BEYOND = 'Beyond Transit Zone'
}

export enum UnitType {
  STUDIO = 'Studio',
  ONE_BR = '1BR',
  TWO_BR = '2BR',
  THREE_BR = '3BR'
}

export enum DormerMode {
  NONE = 'None',
  DORMER_40 = '40% Frontage',
  DORMER_60 = '60ft Step-down'
}

export interface FloorConfig {
  floorNumber: number;
  unitMix: UnitType[];
}

export interface ZoningParams {
  far: number;
  far_wide?: number;
  h: number;
  h_wide?: number;
  b_min: number;
  b_max: number;
  b_max_wide?: number;
  cov: number;
  cov_c: number;
  p_in: number;
  p_out: number;
  p_std: number;
  p_waived_limit: number;
  fy: number;
  sy?: number;
  min_width?: number;
  min_area?: number;
  wall: string;
  rec: string;
  bike: string;
  note?: string;
}

export interface ZoneData {
  desc: string;
  uses: string;
  base: ZoningParams;
  bonus?: Partial<ZoningParams>;
}

export interface LotConfig {
  zoneKey: string;
  width: number;
  depth: number;
  lotType: LotType;
  streetWidth: StreetWidth;
  transitZone: TransitZone;
  floorHeight: number;
  isBonus: boolean;
  isOverlay: boolean;
  dormerMode: DormerMode;
  streetName: string;
  selectedFloor: number;
  floorConfigs: FloorConfig[];
}
