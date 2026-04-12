// ── Ground & Road ────────────────────────────────────────────────────────────
// Scale: 0-800 individual. Road upgrade at ~day 7-10 (100 PLW).
export function getRoadTier(cumPlw) { return cumPlw >= 25 ? 2 : 1; }

export const GROUND = {
  1: 'tile_ground_dirt_normal',
  2: 'tile_ground_grass',
};

export const ROADS = {
  1: {
    straight_h:   'tile_dirtroad_straight_SW',
    straight_v:   'tile_dirtroad_straight_SE',
    xing:         'tile_dirtroad_xing',
    corner_e:     'tile_dirtroad_corner_E',
    corner_n:     'tile_dirtroad_corner_N',
    corner_s:     'tile_dirtroad_corner_S',
    corner_w:     'tile_dirtroad_corner_W',
    intersect_ne: 'tile_dirtroad_intersect_NE',
    intersect_nw: 'tile_dirtroad_intersect_NW',
    intersect_se: 'tile_dirtroad_intersect_SE',
    intersect_sw: 'tile_dirtroad_intersect_SW',
  },
  2: {
    straight_h:   'tile_road_straight_SW_normal',
    straight_v:   'tile_road_straight_SE_normal',
    xing:         'tile_road_xing_normal',
    corner_e:     'tile_road_corner_E_normal',
    corner_n:     'tile_road_corner_N_normal',
    corner_s:     'tile_road_corner_S_normal',
    corner_w:     'tile_road_corner_W_normal',
    intersect_ne: 'tile_road_intersect_NE_normal',
    intersect_nw: 'tile_road_intersect_NW_normal',
    intersect_se: 'tile_road_intersect_SE_normal',
    intersect_sw: 'tile_road_intersect_SW_normal',
  },
};

// ── Building milestones ───────────────────────────────────────────────────────
// Scale: 0-800 cumulative PLW per player.
// 10-20 PLW/day → ~300-600 PLW/month. Full progression ≈ 2 months of play.
// Early: ~5pt steps (unlock every 1-2 days)
// Mid:   ~15-20pt steps
// Late:  ~20-40pt steps, prestige at 750+
export const BUILDING_MILESTONES = [
  // ── Early game: small steps, first 2 weeks ──
  { threshold: 5,   stem: 'bld_fruitstand_neutral_SE_normal' },
  { threshold: 10,  stem: 'bld_barn_red_SE_normal' },
  { threshold: 15,  stem: 'bld_house_blue_SE_normal' },
  { threshold: 20,  stem: 'bld_house_red_SE_normal' },
  { threshold: 25,  stem: 'bld_house_yellow_SE_normal' },
  { threshold: 30,  stem: 'bld_house2_brown_SE_normal' },
  { threshold: 35,  stem: 'bld_house2_blue_SE_normal' },
  { threshold: 40,  stem: 'bld_house2_sand_SE_normal' },
  { threshold: 45,  stem: 'bld_house3_blue_SE_normal' },
  { threshold: 50,  stem: 'bld_mobile_blue_SE_normal' },
  { threshold: 55,  stem: 'bld_house3_green_SE_normal' },
  { threshold: 60,  stem: 'bld_church_neutral_SE_normal' },
  { threshold: 65,  stem: 'bld_cafe_pink_SE_normal' },
  // ── Mid game: month 1 end → month 2 ──
  { threshold: 80,  stem: 'bld_barbershop_purple_SE_normal' },
  { threshold: 95,  stem: 'bld_house_purple_SE_normal' },
  { threshold: 110, stem: 'bld_clinic_mint_SE_normal' },
  { threshold: 125, stem: 'bld_house3_purple_SE_normal' },
  { threshold: 135, stem: 'bld_watertower_blue_SE_normal' },
  { threshold: 150, stem: 'bld_autoshop_yellow_SE_normal' },
  { threshold: 175, stem: 'bld_gasstation_green_SE_normal' },
  { threshold: 200, stem: 'bld_office_gray_SE_normal' },
  { threshold: 225, stem: 'bld_office_brown_SE_normal' },
  { threshold: 250, stem: 'bld_mobile_green_SE_normal' },
  // ── Late mid: month 2-3 ──
  { threshold: 265, stem: 'bld_office_red_SE_normal' },
  { threshold: 300, stem: 'bld_office2_blue_SE_normal' },
  { threshold: 335, stem: 'bld_warehouse_brown_SE_normal' },
  { threshold: 365, stem: 'bld_office2_green_SE_normal' },
  { threshold: 400, stem: 'bld_warehouse_orange_SE_normal' },
  { threshold: 435, stem: 'bld_office2_white_SE_normal' },
  { threshold: 465, stem: 'bld_house2_white_SE_normal' },
  { threshold: 500, stem: 'bld_office3_blue_SE_normal' },
  { threshold: 535, stem: 'bld_office3_yellow_SE_normal' },
  { threshold: 600, stem: 'bld_mobile_purple_SE_normal' },
  // ── Prestige: user-specified landmarks ──
  { threshold: 665, stem: 'bld_hospital_white_SE_normal' },
  { threshold: 735, stem: 'bld_policestation_blue_SE_normal' },
  { threshold: 800, stem: 'bld_firestation_SE_normal' },
];

// ── Prop milestones ───────────────────────────────────────────────────────────
export const PROP_MILESTONES = [
  { threshold: 0,   stem: 'prop_weeds_styleA' },
  { threshold: 0,   stem: 'prop_weeds_styleB' },
  { threshold: 0,   stem: 'prop_rock_brown' },
  { threshold: 5,   stem: 'prop_rock_gray' },
  { threshold: 10,  stem: 'prop_flowers_pink' },
  { threshold: 15,  stem: 'prop_weeds_styleC' },
  { threshold: 20,  stem: 'prop_flowers_yellow' },
  { threshold: 25,  stem: 'prop_tree_styleA_normal' },
  { threshold: 30,  stem: 'prop_flowers_red' },
  { threshold: 35,  stem: 'prop_weeds_styleD' },
  { threshold: 45,  stem: 'prop_tree_styleB_normal' },
  { threshold: 50,  stem: 'prop_fence_wood_SE_normal' },
  { threshold: 55,  stem: 'prop_tree_styleC_normal' },
  { threshold: 60,  stem: 'prop_rocks_brown_styleA' },
  { threshold: 65,  stem: 'prop_rocks_gray_styleA' },
  { threshold: 95,  stem: 'prop_lightpole_standard_SE_normal' },
  { threshold: 135, stem: 'prop_mailbox_standard_SE_normal' },
  { threshold: 200, stem: 'prop_trashcan_blue_SE_normal' },
  { threshold: 335, stem: 'prop_stopsign_standard_SE_nromal' },
  { threshold: 465, stem: 'prop_trashcan_green_SE_normal' },
  { threshold: 665, stem: 'prop_trafficlight_standard_SE_normal' },
  { threshold: 735, stem: 'prop_cautionsign_standard_SE_normal' },
];

// ── Vehicle milestones ────────────────────────────────────────────────────────
export const VEHICLE_MILESTONES = [
  { threshold: 65,  stem: 'veh_sedan_blue_SE_normal' },
  { threshold: 95,  stem: 'veh_sedan_red_SE_normal' },
  { threshold: 120, stem: 'veh_sedan_white_SE_normal' },
  { threshold: 145, stem: 'veh_pickup_blue_SE_normal' },
  { threshold: 200, stem: 'veh_pickup_green_SE_normal' },
  { threshold: 265, stem: 'veh_van_black_SE_normal' },
  { threshold: 335, stem: 'veh_boxTruck_green_SE_normal' },
  { threshold: 400, stem: 'veh_truck_red_SE_normal' },
  { threshold: 665, stem: 'veh_ambulance_SE_normal' },
  { threshold: 735, stem: 'veh_patrol_SE_normal' },
  { threshold: 800, stem: 'veh_firetruck_SE_normal' },
];

// ── Helpers ───────────────────────────────────────────────────────────────────

// All unlocked stems for a given pool at cumPlw
export function unlockedPool(milestones, cumPlw) {
  return milestones.filter(m => cumPlw >= m.threshold).map(m => m.stem);
}

// Density scales smoothly with PLW (no hard tier jumps)
// Calibrated so full density is reached around 800 PLW.
export function getDensity(cumPlw) {
  return {
    building: Math.min(0.58, 0.03 + cumPlw / 1375),
    prop:     Math.min(0.42, 0.05 + cumPlw / 1800),
    vehicle:  cumPlw >= 65 ? Math.min(0.14, (cumPlw - 65) / 5250) : 0,
  };
}

// Skyscraper proxy (1K Club)
export const SKYSCRAPER_STEM = 'bld_office3_yellow_SE_normal';

// ── Team milestones (total_team_plw) ─────────────────────────────────────────
// 20 players × ~450 PLW/month ≈ 9000 team PLW/month.
// Full progression (Grand Tower) reachable around month 12.
export const TEAM_MILESTONES = [
  { threshold: 500,   stem: 'prop_tree_styleC_normal',          label: 'Community Park' },
  { threshold: 1250,  stem: 'bld_church_neutral_SE_normal',     label: 'Town Hall' },
  { threshold: 2500,  stem: 'bld_hospital_white_SE_normal',     label: 'City Hospital' },
  { threshold: 5000,  stem: 'bld_office3_yellow_SE_normal',     label: 'Team Tower' },
  { threshold: 10000, stem: 'bld_office3_blue_SE_normal',       label: 'Grand Tower' },
];

export function getTeamLandmark(totalTeamPlw) {
  let best = null;
  for (const m of TEAM_MILESTONES) {
    if (totalTeamPlw >= m.threshold) best = m;
  }
  return best; // null = no landmark yet
}

// getTier kept for HUD label display only
export function getTier(cumPlw) {
  if (cumPlw >= 665) return 4;
  if (cumPlw >= 265) return 3;
  if (cumPlw >= 65)  return 2;
  return 1;
}
