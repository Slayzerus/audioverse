/**
 * Complete asset catalog for AtomicPostApo — ALL 271 GLB models.
 * All GLB paths are relative to /assets/models/low-poly/Post-Apocalyptic World/
 * Character FBX paths are relative to /assets/models/POLYGON_Heist_SourceFiles_v4/SourceFiles/
 */

const PA = 'assets/models/low-poly/Post-Apocalyptic World'
const HEIST = 'assets/models/POLYGON_Heist_SourceFiles_v4/SourceFiles'

// ─── Texture atlas ──────────────────────────────────────
export const PALETTE_TEXTURE   = `${PA}/3. Models/post-apocalyptic_texture.png`
export const PALETTE_FREE      = `${PA}/FREE/post-apocalyptic_texture.png`
export const PALETTE_PLUS      = `${PA}/PLUS/post-apocalyptic_texture.png`

// ─── Helper: GLB path builder ───────────────────────────
const m  = (name: string) => `${PA}/3. Models/gltf/${name}.glb`
const f  = (name: string) => `${PA}/FREE/gltf/${name}.glb`
const p  = (name: string) => `${PA}/PLUS/gltf/${name}.glb`
const pp = (name: string) => `${PA}/PLUS/Plain Models/gltf/${name}.glb`
const pt = (name: string) => `${PA}/PLUS/Textured Models/gltf/${name}.glb`
const gi = (name: string) => `${PA}/Generic Interiors/PLUS/gltf/${name}.glb`
const of_ = (name: string) => `${PA}/Office Interiors (Textured)/FREE/gltf/${name}.glb`
const op = (name: string) => `${PA}/Office Interiors (Textured)/PLUS/gltf/${name}.glb`

// ─── Buildings & Structures ─────────────────────────────
export interface BuildingDef {
  id: string
  model: string
  w: number; h: number   // footprint in world units
  scale: number
  blocking: boolean
}

export const BUILDING_DEFS: BuildingDef[] = [
  { id: 'gas_station',       model: p('gas_Station_building_1'), w: 6, h: 4, scale: 0.01, blocking: true },
  { id: 'gas_annex',         model: p('gas_station_annex_1'),    w: 3, h: 3, scale: 0.01, blocking: true },
  { id: 'gas_annex_roof',    model: p('gas_station_annex_roof_standing'), w: 3, h: 3, scale: 0.01, blocking: true },
  { id: 'pharmacy',          model: p('pharmacy_building'),      w: 5, h: 4, scale: 0.01, blocking: true },
  { id: 'bunker1',           model: pt('Bunker1'),               w: 4, h: 4, scale: 0.01, blocking: true },
  { id: 'bunker2',           model: pt('Bunker2'),               w: 4, h: 3, scale: 0.01, blocking: true },
  { id: 'bunker3',           model: pt('Bunker3'),               w: 5, h: 5, scale: 0.01, blocking: true },
  { id: 'tent',              model: pp('tent'),                  w: 3, h: 3, scale: 0.01, blocking: false },
]

// ─── Building Accessories (placed near their parent buildings) ─
export interface BuildingAccessoryDef {
  id: string
  model: string
  scale: number
  parentBuildings: string[]   // which building ids this accessory belongs near
}

export const BUILDING_ACCESSORIES: BuildingAccessoryDef[] = [
  { id: 'gas_column_a',    model: p('gas_station_column_A'),  scale: 0.01, parentBuildings: ['gas_station', 'gas_annex', 'gas_annex_roof'] },
  { id: 'gas_column_b',    model: p('gas_station_column_B'),  scale: 0.01, parentBuildings: ['gas_station', 'gas_annex', 'gas_annex_roof'] },
  { id: 'gas_banner',      model: p('gas_banner_1'),          scale: 0.01, parentBuildings: ['gas_station'] },
  { id: 'pharmacy_logo',   model: p('pharmacy_logo_1'),       scale: 0.01, parentBuildings: ['pharmacy'] },
]

// ─── Walls & Barriers ───────────────────────────────────
export interface WallDef {
  id: string
  model: string
  length: number    // wall length in world units
  scale: number
}

export const WALL_DEFS: WallDef[] = [
  { id: 'wall_brick',       model: m('wall_1_brick'),            length: 3, scale: 0.01 },
  { id: 'wall_plain',       model: m('wall_1'),                  length: 3, scale: 0.01 },
  { id: 'wall_hole',        model: m('wall_1_hole'),             length: 3, scale: 0.01 },
  { id: 'wall_window1',     model: m('wall_1_window_1'),         length: 3, scale: 0.01 },
  { id: 'wall_window2',     model: m('wall_1_window_2'),         length: 3, scale: 0.01 },
  { id: 'wall_door',        model: m('wall_1_door_boarded'),     length: 3, scale: 0.01 },
  { id: 'wall_column',      model: m('wall_column'),             length: 1, scale: 0.01 },
  { id: 'wall_concrete',    model: m('wall_concrete_metal'),     length: 3, scale: 0.01 },
  { id: 'wall_metal1',      model: m('wall_metal_1'),            length: 3, scale: 0.01 },
  { id: 'wall_metal2',      model: m('wall_metal_2'),            length: 3, scale: 0.01 },
  { id: 'wall_spiked',      model: m('wall_spiked'),             length: 3, scale: 0.01 },
  { id: 'wall_wooden',      model: m('wooden_wall'),             length: 3, scale: 0.01 },
  { id: 'spike_barricade',  model: m('wooden_spike_barricade'),  length: 2, scale: 0.01 },
  { id: 'wire_fence',       model: pp('metal_wire_fence'),       length: 3, scale: 0.01 },
  { id: 'road_barrier',     model: f('road_barrier'),            length: 2, scale: 0.01 },
  // Office walls (ruined / overgrown)
  { id: 'office_wall',           model: op('Wall_1'),                 length: 3, scale: 0.01 },
  { id: 'office_wall_dest1',     model: op('Wall_1_Destroyed_1'),     length: 3, scale: 0.01 },
  { id: 'office_wall_dest2',     model: op('Wall_1_Destroyed_2'),     length: 3, scale: 0.01 },
  { id: 'office_wall_door',      model: op('Wall_Door_1'),            length: 3, scale: 0.01 },
  { id: 'office_wall_window1',   model: op('Wall_Window_1'),          length: 3, scale: 0.01 },
  { id: 'office_wall_window2',   model: op('Wall_Window_2'),          length: 3, scale: 0.01 },
]

// ─── Ground / Road tiles ────────────────────────────────
export const GROUND_MODELS = [
  { id: 'ground1',    model: m('ground_1'),         scale: 0.01 },
  { id: 'ground2',    model: m('ground_2'),         scale: 0.01 },
  { id: 'planks',     model: m('ground_planks'),    scale: 0.01 },
  { id: 'road_1L',    model: m('ground_road_1_L'),  scale: 0.01 },
  { id: 'road_1R',    model: m('ground_road_1_R'),  scale: 0.01 },
  { id: 'road_2L',    model: m('ground_road_2_L'),  scale: 0.01 },
  { id: 'road_2R',    model: m('ground_road_2_R'),  scale: 0.01 },
  { id: 'road_chunk1',model: p('road_chunk_1'),     scale: 0.01 },
  { id: 'road_chunk2',model: p('road_chunk_2'),     scale: 0.01 },
  { id: 'rubble1',    model: p('rubble_1'),         scale: 0.01 },
  { id: 'rubble2',    model: p('rubble_2'),         scale: 0.01 },
  { id: 'dirt_brown1',model: p('dirt_cluster_brown'),   scale: 0.01 },
  { id: 'dirt_brown2',model: p('dirt_cluster_brown_2'), scale: 0.01 },
  { id: 'dirt_gray',  model: p('dirt_gray'),        scale: 0.01 },
  // Interior floor variants
  { id: 'floor_wood1',     model: gi('floor_wood_1'),          scale: 0.01 },
  { id: 'floor_wood2',     model: gi('floor_wood_2'),          scale: 0.01 },
  { id: 'tile_floor',      model: gi('tile_floor_1'),          scale: 0.01 },
  { id: 'tile_floor_dmg1', model: gi('tile_floor_damaged_1'),  scale: 0.01 },
  { id: 'tile_floor_dmg2', model: gi('tile_floor_damaged_2'),  scale: 0.01 },
  // Office floor & ceiling
  { id: 'office_floor',    model: op('Floor_1'),               scale: 0.01 },
  { id: 'office_ceiling',  model: op('Ceiling_1'),             scale: 0.01 },
  { id: 'office_example',  model: op('Example_1'),             scale: 0.01 },
]

// ─── Vegetation ─────────────────────────────────────────
export const VEGETATION_MODELS = [
  { id: 'bush1',        model: f('bush_1'),               scale: 0.01 },
  { id: 'tree_tex',     model: pt('Tree1'),               scale: 0.01 },
  { id: 'tree_1a',      model: pp('tree_1_a'),            scale: 0.01 },
  { id: 'tree_1b',      model: pp('tree_1_b'),            scale: 0.01 },
  { id: 'tree_1c',      model: pp('tree_1_c'),            scale: 0.01 },
  { id: 'tree_2a',      model: pp('tree_2_a'),            scale: 0.01 },
  { id: 'tree_2b',      model: pp('tree_2_b'),            scale: 0.01 },
  { id: 'tree_2c',      model: pp('tree_2_c'),            scale: 0.01 },
  { id: 'tree_3a',      model: pp('tree_3_a'),            scale: 0.01 },
  { id: 'tree_3b',      model: pp('tree_3_b'),            scale: 0.01 },
  { id: 'tree_3c',      model: pp('tree_3_c'),            scale: 0.01 },
  { id: 'carnivorous_a',model: pp('carnivorous_plant_1_a'), scale: 0.01 },
  { id: 'carnivorous_b',model: pp('carnivorous_plant_1_b'), scale: 0.01 },
  { id: 'carnivorous_c',model: pp('carnivorous_plant_1_c'), scale: 0.01 },
  { id: 'mushroom',     model: pp('mushroom'),             scale: 0.01 },
  { id: 'flower_a',     model: pp('flower_petal_1_a'),     scale: 0.01 },
  { id: 'flower_b',     model: pp('flower_petal_1_b'),     scale: 0.01 },
  { id: 'leaf_1',       model: pp('leaf_1'),               scale: 0.01 },
  ...Array.from({ length: 7 }, (_, i) => ({
    id: `grass_green_${i + 1}`, model: p(`grass_green_${i + 1}`), scale: 0.01,
  })),
  { id: 'grass_brown_1', model: p('grass_brown_1'),        scale: 0.01 },
  { id: 'grass_brown_2', model: p('grass_brown_2'),        scale: 0.01 },
  { id: 'grass_cluster1',model: p('grass_cluster_1'),      scale: 0.01 },
  { id: 'grass_cluster2',model: p('grass_cluster_2'),      scale: 0.01 },
  // Office Interiors textured grass/ivy (overgrown ruins)
  { id: 'office_grass',      model: op('Grass_1'),         scale: 0.01 },
  { id: 'office_grass_line', model: op('Grass_Line_1'),    scale: 0.01 },
  { id: 'office_ivy',        model: op('Ivy_1'),           scale: 0.01 },
  { id: 'office_ivy_pillar', model: op('Ivy_Pillar_1'),    scale: 0.01 },
  // Generic Interiors plant
  { id: 'indoor_plant',      model: gi('plant_1'),         scale: 0.01 },
]

// ─── Props / Furniture / Misc ───────────────────────────
export interface PropDef {
  id: string
  model: string
  scale: number
  blocking: boolean
  w?: number; h?: number  // collision box if blocking
}

export const PROP_DEFS: PropDef[] = [
  // ═══ Containers / barrels ════════════════════════════════
  { id: 'barrel',             model: m('barrel'),                   scale: 0.01, blocking: true, w: 0.6, h: 0.6 },
  { id: 'barrel_wood',        model: p('barell_With_wood'),         scale: 0.01, blocking: true, w: 0.6, h: 0.6 },
  { id: 'barrel_damaged',     model: p('barrel_damaged_blue'),      scale: 0.01, blocking: true, w: 0.6, h: 0.6 },
  { id: 'burning_barrel',     model: pp('burning_barell'),          scale: 0.01, blocking: true, w: 0.6, h: 0.6 },
  { id: 'box1',               model: m('box_1'),                    scale: 0.01, blocking: true, w: 0.8, h: 0.8 },
  { id: 'bucket',             model: p('bucket_1'),                 scale: 0.01, blocking: false },
  { id: 'jerry_can',          model: f('jerry_can_with_nozzle'),    scale: 0.01, blocking: false },
  // ═══ Tires / car parts ══════════════════════════════════
  { id: 'tire',               model: m('tire'),                     scale: 0.01, blocking: false },
  { id: 'wheel',              model: m('wheel'),                    scale: 0.01, blocking: false },
  { id: 'tire_cluster',       model: p('tire_cluster'),             scale: 0.01, blocking: true, w: 1.2, h: 1.2 },
  { id: 'tire_cluster2',      model: p('tire_cluster_2'),           scale: 0.01, blocking: true, w: 1.2, h: 1.2 },
  { id: 'tire_cluster3',      model: p('tire_clsuter_3'),           scale: 0.01, blocking: true, w: 1.2, h: 1.2 },
  { id: 'car_tire',           model: pp('car_tire'),                scale: 0.01, blocking: false },
  { id: 'car_wheel',          model: pp('car_wheel'),               scale: 0.01, blocking: false },
  // ═══ Electric / utility ═════════════════════════════════
  { id: 'electric_pole',      model: m('electric_pole_1'),          scale: 0.01, blocking: true, w: 0.4, h: 0.4 },
  { id: 'metal_board1',       model: m('metal_board_1'),            scale: 0.01, blocking: false },
  { id: 'metal_board2',       model: m('metal_board_2'),            scale: 0.01, blocking: false },
  { id: 'metal_board3',       model: m('metal_board_3'),            scale: 0.01, blocking: false },
  // ═══ Gas station ════════════════════════════════════════
  { id: 'gas_pump_a',         model: p('gas_pump_A'),               scale: 0.01, blocking: true, w: 0.6, h: 0.6 },
  { id: 'gas_pump_b',         model: p('gas_pump_B'),               scale: 0.01, blocking: true, w: 0.6, h: 0.6 },
  { id: 'gas_pump_destroyed', model: p('gas_pump_C_destroyed'),     scale: 0.01, blocking: true, w: 0.6, h: 0.6 },
  { id: 'gas_pump_dest2',     model: p('gas_pump_D_destroyed'),     scale: 0.01, blocking: true, w: 0.6, h: 0.6 },
  { id: 'gas_sign',           model: p('big_gas_sign_1'),           scale: 0.01, blocking: true, w: 0.8, h: 0.8 },
  { id: 'propane_tank',       model: p('propane_tank'),             scale: 0.01, blocking: true, w: 0.8, h: 0.5 },
  // ═══ Furniture — desks / tables / counters ══════════════
  { id: 'desk1',              model: p('desk_1'),                   scale: 0.01, blocking: true, w: 1.2, h: 0.6 },
  { id: 'desk2',              model: p('desk_2'),                   scale: 0.01, blocking: true, w: 1.2, h: 0.6 },
  { id: 'table1',             model: p('table_1'),                  scale: 0.01, blocking: true, w: 1.0, h: 1.0 },
  { id: 'counter',            model: p('counter'),                  scale: 0.01, blocking: true, w: 1.5, h: 0.6 },
  { id: 'office_table',       model: op('Table_1'),                 scale: 0.01, blocking: true, w: 1.5, h: 0.8 },
  // ═══ Shelves (all variants) ═════════════════════════════
  { id: 'shelf_free',         model: f('shelf_3'),                  scale: 0.01, blocking: true, w: 1.0, h: 0.4 },
  { id: 'shelf1',             model: p('shelf_1'),                  scale: 0.01, blocking: true, w: 1.0, h: 0.4 },
  { id: 'shelf1_b',           model: p('shelf_1_B'),                scale: 0.01, blocking: true, w: 1.0, h: 0.4 },
  { id: 'shelf1_c',           model: p('shelf_1_C'),                scale: 0.01, blocking: true, w: 1.0, h: 0.4 },
  { id: 'shelf2',             model: p('shelf_2'),                  scale: 0.01, blocking: true, w: 1.0, h: 0.4 },
  { id: 'shelf3_a',           model: p('shelf_3_A'),                scale: 0.01, blocking: true, w: 1.0, h: 0.4 },
  { id: 'shelf3_b',           model: p('shelf_3_B'),                scale: 0.01, blocking: true, w: 1.0, h: 0.4 },
  { id: 'shelf3_c',           model: p('shelf_3_C'),                scale: 0.01, blocking: true, w: 1.0, h: 0.4 },
  { id: 'shelf3_d',           model: p('shelf_3_D'),                scale: 0.01, blocking: true, w: 1.0, h: 0.4 },
  { id: 'shelf4_a',           model: p('shelf_4_A'),                scale: 0.01, blocking: true, w: 1.0, h: 0.4 },
  { id: 'shelf4_b',           model: p('shelf_4_B'),                scale: 0.01, blocking: true, w: 1.0, h: 0.4 },
  // ═══ Pallets / crates ═══════════════════════════════════
  { id: 'pallet1',            model: f('pallet_cluster_1'),         scale: 0.01, blocking: true, w: 1.0, h: 1.0 },
  { id: 'pallet2',            model: p('pallet_cluster_2'),         scale: 0.01, blocking: true, w: 1.0, h: 1.0 },
  { id: 'carton_box',         model: op('Carton_Box_1'),            scale: 0.01, blocking: false },
  { id: 'carton_box_lid',     model: op('Carton_Box_1_Lid'),        scale: 0.01, blocking: false },
  // ═══ Seating ════════════════════════════════════════════
  { id: 'bar_stool',          model: p('bar_stool'),                scale: 0.01, blocking: false },
  { id: 'car_seat1',          model: p('car_seat_1'),               scale: 0.01, blocking: false },
  { id: 'car_seat2',          model: p('car_seat_2'),               scale: 0.01, blocking: false },
  // ═══ Vending / machines / appliances ════════════════════
  { id: 'soda_machine',       model: p('soda_vending_machine'),     scale: 0.01, blocking: true, w: 0.8, h: 0.6 },
  { id: 'freezer1',           model: p('freezer_1'),                scale: 0.01, blocking: true, w: 0.8, h: 0.6 },
  { id: 'freezer2',           model: p('freezer_2'),                scale: 0.01, blocking: true, w: 0.8, h: 0.6 },
  { id: 'ac_unit',            model: p('ac_unit'),                  scale: 0.01, blocking: true, w: 0.8, h: 0.5 },
  // ═══ Camp / survival ═══════════════════════════════════
  { id: 'campfire',           model: pp('campfire'),                scale: 0.01, blocking: false },
  { id: 'campfire_sausage',   model: pp('campfire_stick_for_sausage'), scale: 0.01, blocking: false },
  { id: 'cooking_pot',        model: pp('cooking_pot'),             scale: 0.01, blocking: false },
  { id: 'cooking_pot_shot',   model: pp('cooking_pot_shot'),        scale: 0.01, blocking: false },
  { id: 'cooking_pot_damaged',model: pp('cooking_pot_shotdamaged'), scale: 0.01, blocking: false },
  { id: 'sleeping_bag',       model: f('sleeping_bag'),             scale: 0.01, blocking: false },
  { id: 'backpack',           model: pp('backpack_big'),            scale: 0.01, blocking: false },
  { id: 'lantern',            model: pp('lantern'),                 scale: 0.01, blocking: false },
  { id: 'flag_on_stick',      model: pp('flag_on_stick'),           scale: 0.01, blocking: false },
  { id: 'sharpened_stick',    model: f('sharpened_stick'),          scale: 0.01, blocking: false },
  { id: 'cans_on_twine',      model: pp('cans_on_twine'),           scale: 0.01, blocking: false },
  { id: 'chain',              model: pp('chain'),                   scale: 0.01, blocking: false },
  // ═══ Cooking / food / cans ══════════════════════════════
  { id: 'can_closed',         model: p('can_1_closed'),             scale: 0.01, blocking: false },
  { id: 'can_opened',         model: p('can_1_opened'),             scale: 0.01, blocking: false },
  { id: 'can_opened_b',       model: p('can_1_opeend_B'),           scale: 0.01, blocking: false },
  { id: 'can2_closed',        model: p('can_2_closed'),             scale: 0.01, blocking: false },
  { id: 'food_can_closed',    model: pp('closed_can_with_food'),    scale: 0.01, blocking: false },
  { id: 'food_can_open',      model: pp('open can with food'),      scale: 0.01, blocking: false },
  { id: 'food_can_shot_a',    model: pp('shot_can_with_food_a'),    scale: 0.01, blocking: false },
  { id: 'food_can_shot_b',    model: pp('shot_can_with_food_b'),    scale: 0.01, blocking: false },
  { id: 'pan',                model: pp('pan'),                     scale: 0.01, blocking: false },
  { id: 'pan_bent',           model: pp('pan_bent'),                scale: 0.01, blocking: false },
  { id: 'pan_broken',         model: pp('pan_broken'),              scale: 0.01, blocking: false },
  { id: 'mushrooms_sliced',   model: pp('mushrooms_sliced'),        scale: 0.01, blocking: false },
  // ═══ Bottles / lab ══════════════════════════════════════
  { id: 'small_bottle',       model: f('small_bottle_1'),           scale: 0.01, blocking: false },
  { id: 'small_bottle2',      model: f('small_bottle_2'),           scale: 0.01, blocking: false },
  { id: 'bottle_tall1',       model: f('small_bottle_tall_1'),      scale: 0.01, blocking: false },
  { id: 'bottle_tall2',       model: f('small_bottle_tall_2'),      scale: 0.01, blocking: false },
  { id: 'test_tube1',         model: f('test_tube_1'),              scale: 0.01, blocking: false },
  { id: 'test_tube2',         model: f('test_tube_2'),              scale: 0.01, blocking: false },
  { id: 'test_tube3',         model: f('test_tube_3'),              scale: 0.01, blocking: false },
  { id: 'test_tube4',         model: f('test_tube_4'),              scale: 0.01, blocking: false },
  // ═══ Medical / pharmacy ═════════════════════════════════
  { id: 'medpack',            model: f('medpack_1'),                scale: 0.01, blocking: false },
  { id: 'syringe',            model: p('syringe'),                  scale: 0.01, blocking: false },
  { id: 'medication_bottle',  model: p('medication_bottle'),        scale: 0.01, blocking: false },
  { id: 'medication_cluster', model: p('medication_cluster_1'),     scale: 0.01, blocking: false },
  { id: 'microscope',         model: p('microscope'),               scale: 0.01, blocking: false },
  { id: 'stetoscope',         model: p('stetoscope'),               scale: 0.01, blocking: false },
  { id: 'thermometer',        model: p('thermometer'),              scale: 0.01, blocking: false },
  { id: 'pressure_gauge',     model: p('pressure_gauge'),           scale: 0.01, blocking: false },
  { id: 'fire_extinguisher',  model: p('fire_extinguisher'),        scale: 0.01, blocking: false },
  { id: 'fire_extinguisher_int', model: gi('fire_extinguisher_1'),  scale: 0.01, blocking: false },
  // ═══ Wearable / survival gear ═══════════════════════════
  { id: 'breathing_apparatus',model: p('breathing_aparatus'),       scale: 0.01, blocking: false },
  { id: 'face_mask1',         model: p('face_mask_1'),              scale: 0.01, blocking: false },
  { id: 'face_mask2',         model: p('face_mask_2'),              scale: 0.01, blocking: false },
  { id: 'face_mask3',         model: p('face_mask_3'),              scale: 0.01, blocking: false },
  { id: 'plastic_glasses',    model: p('plastic_glasses'),          scale: 0.01, blocking: false },
  // ═══ Logs (10 variants) ═════════════════════════════════
  ...Array.from({ length: 10 }, (_, i) => ({
    id: `log_${i + 1}`, model: pp(`log_${i + 1}`), scale: 0.01, blocking: false
  } as PropDef)),
  // ═══ Interior — Generic Interiors (all) ═════════════════
  { id: 'bed',                model: gi('bed'),                     scale: 0.01, blocking: true, w: 1.0, h: 2.0 },
  { id: 'bookshelf',          model: gi('bookshelf_1a'),            scale: 0.01, blocking: true, w: 1.0, h: 0.4 },
  { id: 'bookshelf_b',        model: gi('bookshelf_1b'),            scale: 0.01, blocking: true, w: 1.0, h: 0.4 },
  { id: 'book_gi1',           model: gi('book_1'),                  scale: 0.01, blocking: false },
  { id: 'book_gi2',           model: gi('book_2'),                  scale: 0.01, blocking: false },
  { id: 'chair',              model: gi('chair'),                   scale: 0.01, blocking: false },
  { id: 'chair_destroyed',    model: gi('chair_1_destroyed_1'),     scale: 0.01, blocking: false },
  { id: 'chair_destroyed2',   model: gi('chair_1_destroyed_2'),     scale: 0.01, blocking: false },
  { id: 'chair_repaired1',    model: gi('chair_repaired_1'),        scale: 0.01, blocking: false },
  { id: 'chair_repaired2',    model: gi('chair_repaired_2'),        scale: 0.01, blocking: false },
  { id: 'chair_repaired3',    model: gi('chair_repaired_3'),        scale: 0.01, blocking: false },
  { id: 'cupboard',           model: gi('cupboard_1a'),             scale: 0.01, blocking: true, w: 0.8, h: 0.4 },
  { id: 'cupboard_b',         model: gi('cupboard_1b'),             scale: 0.01, blocking: true, w: 0.8, h: 0.4 },
  { id: 'cupboard_c',         model: gi('cupboard_1c'),             scale: 0.01, blocking: true, w: 0.8, h: 0.4 },
  { id: 'fridge',             model: gi('fridge_1'),                scale: 0.01, blocking: true, w: 0.6, h: 0.6 },
  { id: 'fridge_opened',      model: gi('fridge_1_opened'),         scale: 0.01, blocking: true, w: 0.6, h: 0.8 },
  { id: 'generator',          model: gi('generator_1'),             scale: 0.01, blocking: true, w: 0.8, h: 0.5 },
  { id: 'oven',               model: gi('oven_1'),                  scale: 0.01, blocking: true, w: 0.6, h: 0.6 },
  { id: 'oven_destroyed',     model: gi('oven_1_destroyed'),        scale: 0.01, blocking: false },
  { id: 'radio',              model: gi('radio'),                   scale: 0.01, blocking: false },
  { id: 'tv',                 model: gi('TV'),                      scale: 0.01, blocking: false },
  { id: 'porch_sofa',         model: gi('porch_sofa'),              scale: 0.01, blocking: true, w: 1.5, h: 0.6 },
  { id: 'toolbox',            model: gi('toolbox_1'),               scale: 0.01, blocking: false },
  { id: 'wall_machine',       model: gi('wall_machine'),            scale: 0.01, blocking: true, w: 0.6, h: 0.6 },
  // ═══ Office Interior — ALL models ═══════════════════════
  { id: 'computer',           model: op('Computer_1'),              scale: 0.01, blocking: false },
  { id: 'office_desk',        model: op('Desk_1'),                  scale: 0.01, blocking: true, w: 1.2, h: 0.6 },
  { id: 'office_chair',       model: op('Office_Chair_1'),          scale: 0.01, blocking: false },
  { id: 'office_chair_b',     model: op('Office_Chair_1_B'),        scale: 0.01, blocking: false },
  { id: 'monitor_free',       model: of_('Monitor_1'),              scale: 0.01, blocking: false },
  { id: 'monitor_plus',       model: op('Monitor_1'),               scale: 0.01, blocking: false },
  { id: 'keyboard',           model: op('Keyboard_1'),              scale: 0.01, blocking: false },
  { id: 'water_cooler',       model: op('Water_Cooler_1'),          scale: 0.01, blocking: true, w: 0.4, h: 0.4 },
  { id: 'waste_bin',          model: op('Waste_Bin_1'),             scale: 0.01, blocking: false },
  { id: 'binder',             model: op('Binder_1'),                scale: 0.01, blocking: false },
  { id: 'book_office',        model: op('Book_1'),                  scale: 0.01, blocking: false },
  { id: 'bookshelf_off_free', model: of_('Bookshelf_1'),            scale: 0.01, blocking: true, w: 1.0, h: 0.4 },
  { id: 'bookshelf_off_plus', model: op('Bookshelf_1'),             scale: 0.01, blocking: true, w: 1.0, h: 0.4 },
  { id: 'billboard',          model: op('Billboard_1'),             scale: 0.01, blocking: true, w: 2.0, h: 0.3 },
  { id: 'paper',              model: op('Paper_1'),                 scale: 0.01, blocking: false },
  { id: 'pillar',             model: op('Pillar_1'),                scale: 0.01, blocking: true, w: 0.5, h: 0.5 },
  { id: 'pillar_cube',        model: op('Pillar_Cube_1'),           scale: 0.01, blocking: true, w: 0.6, h: 0.6 },
  { id: 'plank',              model: op('Plank_1'),                 scale: 0.01, blocking: false },
  // ═══ Doors / windows (decorative) ══════════════════════
  { id: 'door1',              model: p('door_1'),                   scale: 0.01, blocking: false },
  { id: 'door2',              model: p('door_2'),                   scale: 0.01, blocking: false },
  { id: 'garage_door_a',      model: p('garage_door_A'),            scale: 0.01, blocking: false },
  { id: 'garage_door_b',      model: p('garage_door_B'),            scale: 0.01, blocking: false },
  { id: 'window1',            model: p('window_1'),                 scale: 0.01, blocking: false },
  { id: 'window2',            model: p('window_2'),                 scale: 0.01, blocking: false },
  // ═══ Lighting ═══════════════════════════════════════════
  { id: 'lamp1',              model: p('lamp_1'),                   scale: 0.01, blocking: false },
  { id: 'lamp2',              model: p('lamp_2'),                   scale: 0.01, blocking: false },
  // ═══ Store / display ════════════════════════════════════
  { id: 'leaflet_holder1',    model: p('leaflet_holder_1'),         scale: 0.01, blocking: false },
  { id: 'leaflet_holder2',    model: p('leaflet_holder_2'),         scale: 0.01, blocking: false },
  // ═══ Debris / scatter ═══════════════════════════════════
  { id: 'paper_trash',        model: p('paper_trash_cluster_1'),    scale: 0.01, blocking: false },
  { id: 'tray',               model: p('tray_1'),                   scale: 0.01, blocking: false },
  // ═══ Spike / defense ════════════════════════════════════
  { id: 'spike',              model: p('spike'),                    scale: 0.01, blocking: true, w: 0.3, h: 0.3 },
  // ═══ Vehicles (as props) ════════════════════════════════
  { id: 'car',                model: m('car'),                      scale: 0.01, blocking: true, w: 2.0, h: 4.0 },
  { id: 'car_wreck',          model: p('car_wreck_1'),              scale: 0.01, blocking: true, w: 2.0, h: 4.0 },
  { id: 'pickup1',            model: pp('pickup_1'),                scale: 0.01, blocking: true, w: 2.0, h: 4.5 },
  { id: 'pickup2',            model: pp('pickup_2'),                scale: 0.01, blocking: true, w: 2.0, h: 4.5 },
  { id: 'tanker_trailer',     model: p('tanker_trailer_1'),         scale: 0.01, blocking: true, w: 2.5, h: 6.0 },
  // ═══ Weapons / tools (decorative) ══════════════════════
  { id: 'axe_a',              model: pp('axe_a'),                   scale: 0.01, blocking: false },
  { id: 'axe_b',              model: pp('axe_b'),                   scale: 0.01, blocking: false },
  { id: 'spear',              model: pp('spear'),                   scale: 0.01, blocking: false },
  { id: 'scissors',           model: f('scissors'),                 scale: 0.01, blocking: false },
  { id: 'crutch',             model: p('crutch'),                   scale: 0.01, blocking: false },
  { id: 'crutch_plain',       model: pp('crutch'),                  scale: 0.01, blocking: false },
  { id: 'cash_register',      model: p('cash_register'),            scale: 0.01, blocking: false },
  { id: 'clipboard',          model: p('clipboard'),                scale: 0.01, blocking: false },
]

// ─── Loot model mapping ─────────────────────────────────
export const LOOT_MODELS: Record<string, string> = {
  health:         f('medpack_1'),
  ammo:           m('box_1'),
  armor:          pp('backpack_big'),
  coin:           p('cash_register'),
  stimpak:        p('syringe'),
  radaway:        p('medication_bottle'),
  weapon_upgrade: pp('axe_a'),
}

// ─── Character models (POLYGON Heist FBX) ───────────────
export const CHARACTER_MODELS_FBX = [
  `${HEIST}/FBX/Characters/SK_Character_Female_FBI.fbx`,
  `${HEIST}/FBX/Characters/SK_Character_Male_FBI.fbx`,
  `${HEIST}/FBX/Characters/SK_Character_Male_SWAT_01.fbx`,
  `${HEIST}/FBX/Characters/SK_Character_Male_Overall_01.fbx`,
  `${HEIST}/FBX/Characters/SK_Character_Female_Overall_01.fbx`,
  `${HEIST}/FBX/Characters/SK_Character_Male_Shirt_01.fbx`,
  `${HEIST}/FBX/Characters/SK_Character_Female_Shirt_01.fbx`,
  `${HEIST}/FBX/Characters/SK_Character_Male_SuitVest_01.fbx`,
  `${HEIST}/FBX/Characters/SK_Character_Female_SuitVest_01.fbx`,
]

// ─── Enemy color tints (used for fallback cube models) ──
export const ENEMY_COLORS: Record<string, number> = {
  mutant:      0x2e5b2e,
  raider:      0xb22222,
  deathclaw:   0x1a1a1a,
  feral_dog:   0x8b6914,
  radscorpion: 0x4a2a0a,
}

// ─── Floor tile models for interiors ────────────────────
export const FLOOR_TILES = [
  p('floor_tile_1'), p('floor_tile_2'), p('floor_tile_3'), p('floor_tile_4'),
  gi('floor_wood_1'), gi('floor_wood_2'),
  gi('tile_floor_1'), gi('tile_floor_damaged_1'), gi('tile_floor_damaged_2'),
  op('Floor_1'),
]

// ─── All unique model paths for preloading ──────────────
export function getAllModelPaths(): string[] {
  const paths = new Set<string>()
  BUILDING_DEFS.forEach(b => paths.add(b.model))
  BUILDING_ACCESSORIES.forEach(a => paths.add(a.model))
  WALL_DEFS.forEach(w => paths.add(w.model))
  GROUND_MODELS.forEach(g => paths.add(g.model))
  VEGETATION_MODELS.forEach(v => paths.add(v.model))
  PROP_DEFS.forEach(p => paths.add(p.model))
  Object.values(LOOT_MODELS).forEach(m => paths.add(m))
  FLOOR_TILES.forEach(f => paths.add(f))
  return Array.from(paths)
}
