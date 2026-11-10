// Score scale: lifetime City Points (cumulative PLW). Club top ≈ 6k after one season.

// Buildings a player owns: 1 per 250 points, capped so leaders don't swallow the map.
export function buildingCount(cum) {
  return cum > 0 ? Math.min(12, Math.ceil(cum / 250)) : 0;
}

// Sprite pools by owner's score — every building upgrades as its owner grows.
const POOLS = [
  { min: 0, stems: [
    'bld_house_blue', 'bld_house_red', 'bld_house_yellow', 'bld_house_purple',
    'bld_fruitstand_neutral', 'bld_mobile_blue', 'bld_mobile_green', 'bld_barn_red',
  ] },
  { min: 300, stems: [
    'bld_house2_blue', 'bld_house2_brown', 'bld_house2_sand', 'bld_house2_white',
    'bld_house3_blue', 'bld_house3_green', 'bld_house3_purple', 'bld_cafe_pink',
    'bld_barbershop_purple', 'bld_clinic_mint',
  ] },
  { min: 1000, stems: [
    'bld_office_gray', 'bld_office_brown', 'bld_office_red', 'bld_autoshop_yellow',
    'bld_gasstation_green', 'bld_church_neutral', 'bld_watertower_blue', 'bld_warehouse_orange',
  ] },
  { min: 2500, stems: [
    'bld_office2_blue', 'bld_office2_green', 'bld_office2_white', 'bld_office3_blue',
    'bld_office3_yellow', 'bld_hospital_white', 'bld_policestation_blue', 'bld_warehouse_brown',
  ] },
];

// Current tier pool plus the one below, for a mixed-looking street
export function buildingPool(cum) {
  let t = 0;
  POOLS.forEach((p, i) => { if (cum >= p.min) t = i; });
  return t > 0 ? [...POOLS[t].stems, ...POOLS[t - 1].stems] : POOLS[0].stems;
}

export const PARK_PROPS = [
  'prop_tree_styleA_normal', 'prop_tree_styleB_normal', 'prop_tree_styleC_normal',
  'prop_tree_styleA_normal', 'prop_flowers_pink', 'prop_flowers_yellow', 'prop_flowers_red',
];
export const PLAZA_PROPS = ['prop_lightpole_standard_SE_normal', 'prop_tree_styleC_normal'];

export const VEHICLES = [
  'veh_sedan_blue', 'veh_sedan_red', 'veh_sedan_white', 'veh_pickup_blue', 'veh_pickup_green',
  'veh_van_white', 'veh_van_purple', 'veh_truck_red', 'veh_schoolbus', 'veh_box_yellow',
];
export function vehicleCount(teamTotal) {
  return Math.min(36, Math.floor(teamTotal / 1500));
}

export const GROUND = {
  grass:    'tile_ground_grass',
  plaza:    'tile_ground_concrete_normal',
  road_x:   'tile_road_straight_SW_normal',   // runs along x (constant y)
  road_y:   'tile_road_straight_SE_normal',   // runs along y (constant x)
  xing:     'tile_road_xing_normal',
};

// Top-3 tower height in px: grows with score, not rank, so it rises over the season
export function towerHeight(cum) {
  return Math.min(400, 70 + cum / 18);
}

export const MEDALS = [
  { body: '#2b3a55', accent: '#FFD700', label: '#1' },
  { body: '#2f3b4a', accent: '#D8DEE9', label: '#2' },
  { body: '#3a3330', accent: '#E0915A', label: '#3' },
];
