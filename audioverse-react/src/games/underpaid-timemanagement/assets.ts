/**
 * Complete asset catalog for Underpaid Time Management.
 *
 * Uses gltf models from Tiny Treats Collection and FBX characters from Mixamo.
 * All paths relative to public/ (Vite static root).
 */

const TT = 'assets/models/Low-Poly/Tiny_Treats_Collection_1_1.0'
const MX = 'assets/models/Mixamo'

// ─── Category path builders ─────────────────────────────
const bk  = (name: string) => `${TT}/Bakery Interior/Assets/gltf/${name}.gltf`
const bkb = (name: string) => `${TT}/Bakery Building/Assets/gltf/${name}.gltf`
const ck  = (name: string) => `${TT}/Charming Kitchen/Assets/gltf/${name}.gltf`
const lr  = (name: string) => `${TT}/Lovely Living Room/Assets/gltf/${name}.gltf`
const pp  = (name: string) => `${TT}/Pleasant Picnic/Assets/gltf/${name}.gltf`
const bg  = (name: string) => `${TT}/Baked Goods/Assets/gltf/${name}.gltf`
const hp  = (name: string) => `${TT}/House Plants/Assets/gltf/${name}.gltf`
const pk  = (name: string) => `${TT}/Pretty Park/Assets/gltf/${name}.gltf`
const hh  = (name: string) => `${TT}/Homely House/Assets/gltf/${name}.gltf`
const pg  = (name: string) => `${TT}/Fun Playground/Assets/gltf/${name}.gltf`
const br  = (name: string) => `${TT}/Playful Bedroom/Assets/gltf/${name}.gltf`
const bt  = (name: string) => `${TT}/Bubbly Bathroom/Assets/gltf/${name}.gltf`

// ─── Mixamo character & animation FBX paths ─────────────
export const CHARACTER_MODEL = `${MX}/Idle.fbx`

export const ANIM_PATHS: Record<string, string> = {
  idle:        `${MX}/Idle.fbx`,
  idle_alt:    `${MX}/Idle (1).fbx`,
  walk:        `${MX}/Walking.fbx`,
  jog:         `${MX}/Jogging.fbx`,
  run:         `${MX}/Running.fbx`,
  start_walk:  `${MX}/Start Walking.fbx`,
  take_item:   `${MX}/Taking Item.fbx`,
  put_down:    `${MX}/Putting Down.fbx`,
  opening:     `${MX}/Opening.fbx`,
  pick:        `${MX}/Pick Fruit.fbx`,
  work:        `${MX}/Working On Device.fbx`,
  crouch_idle: `${MX}/Crouching Idle.fbx`,
  crouch_walk: `${MX}/Crouched Walking.fbx`,
  stand_up:    `${MX}/Standing Up.fbx`,
  crouch:      `${MX}/Standing To Crouched.fbx`,
  crouch_stand:`${MX}/Crouch To Stand.fbx`,
  crouch_stand2:`${MX}/Crouch To Stand (1).fbx`,
  crouch_sprint:`${MX}/Crouched To Sprinting.fbx`,
  dig:         `${MX}/Dig And Plant Seeds.fbx`,
  milking:     `${MX}/Cow Milking.fbx`,
}

// ═══════════════════════════════════════════════════════════
//  KITCHEN EQUIPMENT (stations mapped to 3D models)
// ═══════════════════════════════════════════════════════════

export interface ModelDef {
  id: string
  model: string
  scale: number
  offsetY?: number     // vertical offset
}

// ─── Countertops & work surfaces ────────────────────────
export const COUNTER_MODELS: ModelDef[] = [
  { id: 'counter_table',      model: bk('counter_table'),           scale: 1.0 },
  { id: 'countertop_a_large', model: bk('countertop_closet_A_large'), scale: 1.0 },
  { id: 'countertop_a_small', model: bk('countertop_closet_A_small'), scale: 1.0 },
  { id: 'countertop_b_large', model: bk('countertop_closet_B_large'), scale: 1.0 },
  { id: 'countertop_b_small', model: bk('countertop_closet_B_small'), scale: 1.0 },
  { id: 'countertop_corner',  model: bk('countertop_corner_inner'),   scale: 1.0 },
  { id: 'countertop_outer',   model: bk('countertop_counter_outer'),  scale: 1.0 },
  { id: 'countertop_a_long',  model: bk('countertop_straight_A_large'), scale: 1.0 },
  { id: 'countertop_a_short', model: bk('countertop_straight_A_short'), scale: 1.0 },
  { id: 'countertop_b_long',  model: bk('countertop_straight_B_long'),  scale: 1.0 },
  { id: 'countertop_b_short', model: bk('countertop_straight_B_short'), scale: 1.0 },
  // Charming Kitchen counters
  { id: 'ck_counter_corner',  model: ck('countertop_corner_inner'),  scale: 1.0 },
  { id: 'ck_counter_outer',   model: ck('countertop_counter_outer'), scale: 1.0 },
  { id: 'ck_counter_single',  model: ck('countertop_single'),        scale: 1.0 },
  { id: 'ck_counter_sink',    model: ck('countertop_sink'),          scale: 1.0 },
  { id: 'ck_counter_a',       model: ck('countertop_straight_A'),    scale: 1.0 },
  { id: 'ck_counter_b',       model: ck('countertop_straight_B'),    scale: 1.0 },
  { id: 'ck_counter_c',       model: ck('countertop_straight_C'),    scale: 1.0 },
]

// ─── Cooking appliances ─────────────────────────────────
export const APPLIANCE_MODELS: ModelDef[] = [
  { id: 'stove',            model: ck('stove'),               scale: 1.0 },
  { id: 'oven_bread',       model: bk('bread_oven'),          scale: 1.0 },
  { id: 'fridge',           model: ck('fridge'),              scale: 1.0 },
  { id: 'toaster',          model: ck('toaster'),             scale: 1.0 },
  { id: 'coffee_machine',   model: bk('coffee_machine'),      scale: 1.0 },
  { id: 'stand_mixer',      model: bk('stand_mixer'),         scale: 1.0 },
  { id: 'extractor_hood',   model: ck('extractor_hood'),      scale: 1.0 },
  { id: 'kettle',           model: ck('kettle'),              scale: 1.0 },
]

// ─── Kitchen utensils & tools ───────────────────────────
export const UTENSIL_MODELS: ModelDef[] = [
  { id: 'knife_ck',         model: ck('knife'),               scale: 1.0 },
  { id: 'knife_pp',         model: pp('knife'),               scale: 1.0 },
  { id: 'fork',             model: pp('fork'),                scale: 1.0 },
  { id: 'spoon_ck',         model: ck('spoon'),               scale: 1.0 },
  { id: 'spoon_pp',         model: pp('spoon'),               scale: 1.0 },
  { id: 'spatula',          model: ck('spatula'),             scale: 1.0 },
  { id: 'whisk',            model: bk('whisk'),              scale: 1.0 },
  { id: 'cuttingboard',     model: ck('cuttingboard'),        scale: 1.0 },
  { id: 'dough_roller',     model: bk('dough_roller'),        scale: 1.0 },
  { id: 'pan',              model: ck('pan'),                 scale: 1.0 },
  { id: 'pot',              model: ck('pot'),                 scale: 1.0 },
  { id: 'lid',              model: ck('lid'),                 scale: 1.0 },
  { id: 'oven_glove',       model: ck('oven_glove'),          scale: 1.0 },
  { id: 'scale',            model: bk('scale'),              scale: 1.0 },
  { id: 'mixing_bowl',      model: bk('mixing_bowl'),         scale: 1.0 },
  { id: 'papertowel',       model: ck('papertowel_holder'),   scale: 1.0 },
  { id: 'utensils_cup',     model: ck('utensils_cup'),        scale: 1.0 },
  { id: 'dishrack',         model: ck('dishrack'),            scale: 1.0 },
  { id: 'dishrack_plates',  model: ck('dishrack_plates'),     scale: 1.0 },
]

// ─── Tableware & serving ────────────────────────────────
export const TABLEWARE_MODELS: ModelDef[] = [
  { id: 'plate_bk',         model: bk('plate'),              scale: 1.0 },
  { id: 'plate_stacked_bk', model: bk('plate_stacked'),      scale: 1.0 },
  { id: 'plate_ck',         model: ck('plate'),              scale: 1.0 },
  { id: 'plate_a_pp',       model: pp('plate_A'),            scale: 1.0 },
  { id: 'plate_b_pp',       model: pp('plate_B'),            scale: 1.0 },
  { id: 'serving_tray_bk',  model: bk('serving_tray'),       scale: 1.0 },
  { id: 'serving_round',    model: pp('serving_tray_round'), scale: 1.0 },
  { id: 'serving_sq_a',     model: pp('serving_tray_square_A'), scale: 1.0 },
  { id: 'serving_sq_b',     model: pp('serving_tray_square_B'), scale: 1.0 },
  { id: 'bowl_pp',          model: pp('bowl'),               scale: 1.0 },
  { id: 'mug_a_blue',       model: bk('mug_A_blue'),         scale: 1.0 },
  { id: 'mug_a_pink',       model: bk('mug_A_pink'),         scale: 1.0 },
  { id: 'mug_a_yellow',     model: bk('mug_A_yellow'),       scale: 1.0 },
  { id: 'mug_b',            model: bk('mug_B'),              scale: 1.0 },
  { id: 'mug_b_stacked',    model: bk('mug_B_stacked'),      scale: 1.0 },
  { id: 'mug_blue_ck',      model: ck('mug_blue'),           scale: 1.0 },
  { id: 'mug_red_ck',       model: ck('mug_red'),            scale: 1.0 },
  { id: 'mug_yellow_ck',    model: ck('mug_yellow'),         scale: 1.0 },
  { id: 'mug_pp',           model: pp('mug'),                scale: 1.0 },
  { id: 'mug_blue_lr',      model: lr('mug_blue'),           scale: 1.0 },
  { id: 'mug_duck',         model: lr('mug_duck'),           scale: 1.0 },
  { id: 'mug_orange',       model: lr('mug_orange'),         scale: 1.0 },
  { id: 'coffee_takeaway',  model: bk('coffee_cup_takeaway'), scale: 1.0 },
  { id: 'coffee_stacked',   model: bk('coffee_cup_takeaway_stacked'), scale: 1.0 },
  { id: 'teapot',           model: pp('teapot'),             scale: 1.0 },
  { id: 'wine_glass',       model: pp('wine_glass'),         scale: 1.0 },
  { id: 'wine_bottle',      model: pp('wine_bottle'),        scale: 1.0 },
  { id: 'thermos',          model: pp('thermos'),            scale: 1.0 },
  { id: 'drink_can',        model: pp('drink_can'),          scale: 1.0 },
  { id: 'coaster',          model: lr('coaster'),            scale: 1.0 },
  { id: 'tray_lr',          model: lr('tray'),               scale: 1.0 },
  { id: 'tray_decorated',   model: lr('tray_decorated'),     scale: 1.0 },
]

// ─── Ingredient models ──────────────────────────────────
export const INGREDIENT_MODELS: ModelDef[] = [
  // Bakery ingredients
  { id: 'egg_a',            model: bk('egg_A'),              scale: 1.0 },
  { id: 'egg_b',            model: bk('egg_B'),              scale: 1.0 },
  { id: 'flour_closed',     model: bk('flour_sack_closed'),  scale: 1.0 },
  { id: 'flour_open',       model: bk('flour_sack_open'),    scale: 1.0 },
  { id: 'milk',             model: bk('milk'),               scale: 1.0 },
  { id: 'dough_ball',       model: bk('dough_ball'),         scale: 1.0 },
  { id: 'dough_rolled_a',   model: bk('dough_rolled_A'),     scale: 1.0 },
  { id: 'dough_rolled_b',   model: bk('dough_rolled_B'),     scale: 1.0 },
  // Picnic ingredients
  { id: 'apple',            model: pp('apple'),              scale: 1.0 },
  { id: 'apple_cut',        model: pp('apple_cut'),          scale: 1.0 },
  { id: 'apple_piece',      model: pp('apple_piece'),        scale: 1.0 },
  { id: 'cheese_a',         model: pp('cheese_A'),           scale: 1.0 },
  { id: 'cheese_b',         model: pp('cheese_B'),           scale: 1.0 },
  { id: 'grapes',           model: pp('grapes'),             scale: 1.0 },
  { id: 'grapes_bowl',      model: pp('grapes_bowl'),        scale: 1.0 },
  { id: 'jam',              model: pp('jam'),                scale: 1.0 },
  { id: 'sandwich',         model: pp('sandwich'),           scale: 1.0 },
]

// ─── Baked goods (finished food models) ─────────────────
export const BAKED_GOODS_MODELS: ModelDef[] = [
  { id: 'baguette',         model: bg('baguette'),           scale: 1.0 },
  { id: 'baguette_half',    model: bg('baguette_half'),      scale: 1.0 },
  { id: 'baguette_slice',   model: bg('baguette_slice'),     scale: 1.0 },
  { id: 'bread',            model: bg('bread'),              scale: 1.0 },
  { id: 'bread_half',       model: bg('bread_half'),         scale: 1.0 },
  { id: 'bread_roll',       model: bg('bread_roll'),         scale: 1.0 },
  { id: 'bread_slice',      model: bg('bread_slice'),        scale: 1.0 },
  { id: 'cake_birthday',    model: bg('cake_birthday'),      scale: 1.0 },
  { id: 'cake_birthday_cut',model: bg('cake_birthday_cut'),  scale: 1.0 },
  { id: 'cake_birthday_slice',model: bg('cake_birthday_slice'), scale: 1.0 },
  { id: 'cake_chocolate',   model: bg('cake_chocolate'),     scale: 1.0 },
  { id: 'cake_chocolate_cut',model: bg('cake_chocolate_cut'), scale: 1.0 },
  { id: 'cake_chocolate_slice',model: bg('cake_chocolate_slice'), scale: 1.0 },
  { id: 'cake_strawberry',  model: bg('cake_strawberry'),    scale: 1.0 },
  { id: 'cake_strawberry_cut',model: bg('cake_strawberry_cut'), scale: 1.0 },
  { id: 'cake_strawberry_slice',model: bg('cake_strawberry_slice'), scale: 1.0 },
  { id: 'cinnamon_roll',    model: bg('cinnamon_roll'),      scale: 1.0 },
  { id: 'cookie',           model: bg('cookie'),             scale: 1.0 },
  { id: 'croissant',        model: bg('croissant'),          scale: 1.0 },
  { id: 'cupcake',          model: bg('cupcake'),            scale: 1.0 },
  { id: 'donut',            model: bg('donut'),              scale: 1.0 },
  { id: 'donut_chocolate',  model: bg('donut_chocolate'),    scale: 1.0 },
  { id: 'donut_pink',       model: bg('donut_pink'),         scale: 1.0 },
  { id: 'muffin',           model: bg('muffin'),             scale: 1.0 },
  { id: 'pie_apple',        model: bg('pie_apple'),          scale: 1.0 },
  { id: 'pie_apple_cut',    model: bg('pie_apple_cut'),      scale: 1.0 },
  { id: 'pie_apple_slice',  model: bg('pie_apple_slice'),    scale: 1.0 },
  { id: 'pie_cherry',       model: bg('pie_cherry'),         scale: 1.0 },
  { id: 'pie_cherry_cut',   model: bg('pie_cherry_cut'),     scale: 1.0 },
  { id: 'pie_cherry_slice', model: bg('pie_cherry_slice'),   scale: 1.0 },
  { id: 'waffle',           model: bg('waffle'),             scale: 1.0 },
  { id: 'waffle_stacked',   model: bg('waffle_stacked'),     scale: 1.0 },
  // Bakery interior finished goods
  { id: 'cookie_bk',        model: bk('cookie'),             scale: 1.0 },
  { id: 'cookie_jar',       model: bk('cookie_jar'),         scale: 1.0 },
  { id: 'cream_puff',       model: bk('cream_puff'),         scale: 1.0 },
  { id: 'pretzel',          model: bk('pretzel'),            scale: 1.0 },
  { id: 'macaron_blue',     model: bk('macaron_blue'),       scale: 1.0 },
  { id: 'macaron_pink',     model: bk('macaron_pink'),       scale: 1.0 },
  { id: 'macaron_yellow',   model: bk('macaron_yellow'),     scale: 1.0 },
  { id: 'bread_bk',         model: bk('bread'),              scale: 1.0 },
]

// ─── Containers & tins ──────────────────────────────────
export const CONTAINER_MODELS: ModelDef[] = [
  { id: 'tin_a_beige',      model: bk('tin_A_beige'),        scale: 1.0 },
  { id: 'tin_a_brown',      model: bk('tin_A_brown'),        scale: 1.0 },
  { id: 'tin_a_grey',       model: bk('tin_A_grey'),         scale: 1.0 },
  { id: 'tin_b_beige',      model: bk('tin_B_beige'),        scale: 1.0 },
  { id: 'tin_b_brown',      model: bk('tin_B_brown'),        scale: 1.0 },
  { id: 'tin_b_grey',       model: bk('tin_B_grey'),         scale: 1.0 },
  { id: 'container_a_blue', model: ck('container_kitchen_A_blue'), scale: 1.0 },
  { id: 'container_a_red',  model: ck('container_kitchen_A_red'),  scale: 1.0 },
  { id: 'container_a_white',model: ck('container_kitchen_A_white'), scale: 1.0 },
  { id: 'container_b_blue', model: ck('container_kitchen_B_blue'),  scale: 1.0 },
  { id: 'container_b_red',  model: ck('container_kitchen_B_red'),   scale: 1.0 },
  { id: 'container_b_white',model: ck('container_kitchen_B_white'), scale: 1.0 },
  { id: 'picnic_basket_round', model: pp('picnic_basket_round'), scale: 1.0 },
  { id: 'picnic_basket_sq',    model: pp('picnic_basket_square'), scale: 1.0 },
]

// ─── Display / pastry stands ────────────────────────────
export const DISPLAY_MODELS: ModelDef[] = [
  { id: 'display_long',     model: bk('display_case_long'),   scale: 1.0 },
  { id: 'display_short',    model: bk('display_case_short'),  scale: 1.0 },
  { id: 'pastry_a',         model: bk('pastry_stand_A'),      scale: 1.0 },
  { id: 'pastry_a_covered', model: bk('pastry_stand_A_covered'), scale: 1.0 },
  { id: 'pastry_a_deco',    model: bk('pastry_stand_A_decorated'), scale: 1.0 },
  { id: 'pastry_b',         model: bk('pastry_stand_B'),      scale: 1.0 },
  { id: 'pastry_b_deco',    model: bk('pastry_stand_B_decorated'), scale: 1.0 },
  { id: 'pastry_bkb',       model: bkb('pastry_stand'),       scale: 1.0 },
  { id: 'pastry_bkb_donut', model: bkb('pastry_stand_donut'), scale: 1.0 },
  { id: 'cash_register',    model: bk('cash_register'),       scale: 1.0 },
  { id: 'pricing_card',     model: bk('pricing_card'),        scale: 1.0 },
]

// ─── Wall models ────────────────────────────────────────
export const WALL_MODELS: ModelDef[] = [
  // Kitchen walls (tiles)
  { id: 'kw_straight_a',    model: ck('wall_tiles_kitchen_straight'), scale: 1.0 },
  { id: 'kw_corner_in',     model: ck('wall_tiles_kitchen_corner_inner'), scale: 1.0 },
  { id: 'kw_corner_out',    model: ck('wall_tiles_kitchen_corner_outer'), scale: 1.0 },
  { id: 'kw_doorway',       model: ck('wall_tiles_kitchen_doorway'),     scale: 1.0 },
  { id: 'kw_window_large',  model: ck('wall_tiles_kitchen_window_large'), scale: 1.0 },
  { id: 'kw_window_small',  model: ck('wall_tiles_kitchen_window_small'), scale: 1.0 },
  // Kitchen walls (plain)
  { id: 'kw_plain_straight',model: ck('wall_plain_kitchen_straight'), scale: 1.0 },
  { id: 'kw_plain_corner_in', model: ck('wall_plain_kitchen_corner_inner'), scale: 1.0 },
  { id: 'kw_plain_corner_out',model: ck('wall_plain_kitchen_corner_outer'), scale: 1.0 },
  // Bakery walls
  { id: 'bw_straight',      model: bk('wall_panelled_bakery_straight'), scale: 1.0 },
  { id: 'bw_corner_in',     model: bk('wall_panelled_bakery_corner_inner'), scale: 1.0 },
  { id: 'bw_corner_out',    model: bk('wall_panelled_bakery_corner_outer'), scale: 1.0 },
  { id: 'bw_doorway',       model: bk('wall_panelled_bakery_doorway'),     scale: 1.0 },
  { id: 'bw_window_large',  model: bk('wall_panelled_bakery_window_large'), scale: 1.0 },
  { id: 'bw_window_small',  model: bk('wall_panelled_bakery_window_small'), scale: 1.0 },
  // Living room walls (for dining areas)
  { id: 'lr_brick_straight',model: lr('wall_brick_living_room_straight'), scale: 1.0 },
  { id: 'lr_brick_corner_in',model: lr('wall_brick_living_room_corner_inner'), scale: 1.0 },
  { id: 'lr_brick_corner_out',model: lr('wall_brick_living_room_corner_outer'), scale: 1.0 },
  { id: 'lr_brick_doorway', model: lr('wall_brick_living_room_doorway'),    scale: 1.0 },
]

// ─── Wall cabinets & shelves (wall-mounted) ─────────────
export const WALL_FIXTURE_MODELS: ModelDef[] = [
  { id: 'wall_cab_corner',   model: ck('wall_cabinet_corner'),   scale: 1.0 },
  { id: 'wall_cab_single_l', model: ck('wall_cabinet_single_left'), scale: 1.0 },
  { id: 'wall_cab_single_r', model: ck('wall_cabinet_single_right'), scale: 1.0 },
  { id: 'wall_cab_straight', model: ck('wall_cabinet_straight'),  scale: 1.0 },
  { id: 'wall_knife_rack',   model: ck('wall_knife_rack'),        scale: 1.0 },
  { id: 'wall_shelf_kitchen',model: ck('wall_shelf_kitchen'),      scale: 1.0 },
  { id: 'wall_shelf_corner', model: ck('wall_shelf_kitchen_corner'), scale: 1.0 },
  { id: 'wall_shelf_hooks',  model: ck('wall_shelf_kitchen_hooks'), scale: 1.0 },
  { id: 'wall_shelf_hooks_dec', model: ck('wall_shelf_kitchen_hooks_decorated'), scale: 1.0 },
  { id: 'wall_papertowel',   model: ck('wall_papertowel_holder'), scale: 1.0 },
  { id: 'wall_shelf_bk_a',   model: bk('wall_shelf_bakery_A'),    scale: 1.0 },
  { id: 'wall_shelf_bk_b',   model: bk('wall_shelf_bakery_B'),    scale: 1.0 },
  { id: 'wall_shelf_bk_c',   model: bk('wall_shelf_bakery_C'),    scale: 1.0 },
  { id: 'wall_shelf_bk_end', model: bk('wall_shelf_bakery_end'),  scale: 1.0 },
  { id: 'wall_sign_large',   model: bk('wall_sign_large'),        scale: 1.0 },
  { id: 'wall_sign_small',   model: bk('wall_sign_small'),        scale: 1.0 },
  { id: 'wall_shelf_lr_brown',model: lr('wall_shelf_brown'),      scale: 1.0 },
  { id: 'wall_shelf_lr_white',model: lr('wall_shelf_white'),      scale: 1.0 },
  { id: 'blinds',            model: ck('blinds_kitchen'),          scale: 1.0 },
]

// ─── Floor models ───────────────────────────────────────
export const FLOOR_MODELS: ModelDef[] = [
  { id: 'floor_tiled_bk',   model: bk('floor_tiled'),         scale: 1.0 },
  { id: 'floor_wood_bk',    model: bk('floor_wood'),          scale: 1.0 },
  { id: 'floor_connect_bk', model: bk('floor_connection'),    scale: 1.0 },
  { id: 'floor_tiles_ck',   model: ck('floor_tiles_kitchen'), scale: 1.0 },
  { id: 'floor_carpet_lr',  model: lr('floor_carpet'),        scale: 1.0 },
  { id: 'floor_wood_lr',    model: lr('floor_wood'),          scale: 1.0 },
  { id: 'floor_wood_br',    model: br('floor_wood'),          scale: 1.0 },
  { id: 'floor_tiled_bt',   model: bt('floor_tiled'),         scale: 1.0 },
]

// ─── Furniture (tables, chairs) ─────────────────────────
export const FURNITURE_MODELS: ModelDef[] = [
  // Baker tables
  { id: 'table_round_a_bk', model: bk('table_round_A'),       scale: 1.0 },
  { id: 'table_round_b_bk', model: bk('table_round_B'),       scale: 1.0 },
  { id: 'table_round_c_bk', model: bk('table_round_C'),       scale: 1.0 },
  { id: 'chair_bk',         model: bk('chair'),               scale: 1.0 },
  // Kitchen tables
  { id: 'table_a_ck',       model: ck('table_A'),             scale: 1.0 },
  { id: 'table_b_ck',       model: ck('table_B'),             scale: 1.0 },
  { id: 'table_c_ck',       model: ck('table_C'),             scale: 1.0 },
  { id: 'chair_ck',         model: ck('chair'),               scale: 1.0 },
  // Outdoor tables
  { id: 'table_round_a_bkb',model: bkb('table_round_A'),      scale: 1.0 },
  { id: 'table_round_b_bkb',model: bkb('table_round_B'),      scale: 1.0 },
  { id: 'table_sq_a_bkb',   model: bkb('table_square_A'),     scale: 1.0 },
  { id: 'table_sq_b_bkb',   model: bkb('table_square_B'),     scale: 1.0 },
  { id: 'chair_a_bkb',      model: bkb('chair_A'),            scale: 1.0 },
  { id: 'chair_b_bkb',      model: bkb('chair_B'),            scale: 1.0 },
  // Living room furniture
  { id: 'chair_a_blue',     model: lr('chair_A_blue'),        scale: 1.0 },
  { id: 'chair_a_orange',   model: lr('chair_A_orange'),      scale: 1.0 },
  { id: 'chair_a_white',    model: lr('chair_A_white'),       scale: 1.0 },
  { id: 'stool_a_blue',     model: lr('stool_A_blue'),        scale: 1.0 },
  { id: 'stool_a_orange',   model: lr('stool_A_orange'),      scale: 1.0 },
  { id: 'stool_b_blue',     model: lr('stool_B_blue'),        scale: 1.0 },
  { id: 'table_a_lr',       model: lr('table_A'),             scale: 1.0 },
  { id: 'picnic_table',     model: pg('picnic_table'),         scale: 1.0 },
]

// ─── Decoration ─────────────────────────────────────────
export const DECORATION_MODELS: ModelDef[] = [
  { id: 'curtains_bk',      model: bk('curtains'),            scale: 1.0 },
  { id: 'rug_bk',           model: bk('rug'),                 scale: 1.0 },
  { id: 'basket_a',         model: bk('basket_A'),            scale: 1.0 },
  { id: 'basket_b',         model: bk('basket_B'),            scale: 1.0 },
  { id: 'open_close_sign',  model: bkb('open_close_sign'),    scale: 1.0 },
  // House plants
  { id: 'monstera_potted_m',model: hp('monstera_plant_medium_potted'), scale: 1.0 },
  { id: 'monstera_potted_s',model: hp('monstera_plant_small_potted'),  scale: 1.0 },
  { id: 'pothos_potted_m',  model: hp('pothos_plant_medium_potted'),   scale: 1.0 },
  { id: 'succulent_pot_s',  model: hp('succulent_plant_pot_small'),    scale: 1.0 },
  { id: 'cacti_pot_s',      model: hp('cacti_plant_pot_small'),        scale: 1.0 },
  { id: 'yucca_potted_m',   model: hp('yucca_plant_medium_potted'),    scale: 1.0 },
  { id: 'zzplant_potted_s', model: hp('zzplant_plant_small_potted'),   scale: 1.0 },
  { id: 'watering_can_a',   model: hp('watering_can_A'),              scale: 1.0 },
  // Bakery building exterior
  { id: 'bakery_a',         model: bkb('bakery_A'),            scale: 1.0 },
  { id: 'bakery_b',         model: bkb('bakery_B'),            scale: 1.0 },
  { id: 'bakery_sign_a',    model: bkb('bakery_sign_A'),       scale: 1.0 },
  { id: 'bakery_sign_b',    model: bkb('bakery_sign_B'),       scale: 1.0 },
  { id: 'awning_blue',      model: bkb('awning_blue'),         scale: 1.0 },
  { id: 'awning_red',       model: bkb('awning_red'),          scale: 1.0 },
  { id: 'parasol_blue',     model: bkb('parasol_blue'),        scale: 1.0 },
  { id: 'parasol_red',      model: bkb('parasol_red'),         scale: 1.0 },
  { id: 'street_lantern_bkb',model: bkb('street_lantern'),     scale: 1.0 },
  { id: 'flower_box_str',   model: bkb('flower_box_straight'), scale: 1.0 },
  { id: 'flower_box_cor',   model: bkb('flower_box_corner'),   scale: 1.0 },
  { id: 'shop_cart',        model: bkb('shop_cart'),            scale: 1.0 },
  { id: 'crate_bkb',        model: bkb('crate'),               scale: 1.0 },
  { id: 'crate_breadroll',  model: bkb('crate_breadroll'),     scale: 1.0 },
  { id: 'crate_cabinet',    model: bkb('crate_cabinet'),       scale: 1.0 },
  { id: 'crate_croissant',  model: bkb('crate_croissant'),     scale: 1.0 },
  { id: 'carton_box',       model: bkb('carton_box'),          scale: 1.0 },
  { id: 'newspaper_bkb',    model: bkb('newspaper'),           scale: 1.0 },
  { id: 'newspaper_stack',  model: bkb('newspaper_stacked'),   scale: 1.0 },
  { id: 'plant_a_bkb',      model: bkb('plant_A'),             scale: 1.0 },
  { id: 'plant_b_bkb',      model: bkb('plant_B'),             scale: 1.0 },
  { id: 'tree_small_bkb',   model: bkb('tree_small'),          scale: 1.0 },
  { id: 'tree_large_bkb',   model: bkb('tree_large'),          scale: 1.0 },
  { id: 'wall_lantern',     model: bkb('wall_lantern'),        scale: 1.0 },
  { id: 'sign_ground',      model: bkb('sign_ground'),         scale: 1.0 },
  { id: 'sign_wall',        model: bkb('sign_wall'),           scale: 1.0 },
  { id: 'sign_wall_croissant', model: bkb('sign_wall_croissant'), scale: 1.0 },
  { id: 'sign_wall_donut',  model: bkb('sign_wall_donut'),     scale: 1.0 },
  // Pretty park decorations
  { id: 'bench',            model: pk('bench'),                scale: 1.0 },
  { id: 'fountain',         model: pk('fountain'),             scale: 1.0 },
  { id: 'street_lantern',   model: pk('street_lantern'),       scale: 1.0 },
  { id: 'trashcan',         model: pk('trashcan'),             scale: 1.0 },
  { id: 'bush_pk',          model: pk('bush'),                 scale: 1.0 },
  { id: 'bush_large_pk',    model: pk('bush_large'),           scale: 1.0 },
  { id: 'tree_pk',          model: pk('tree'),                 scale: 1.0 },
  { id: 'tree_large_pk',    model: pk('tree_large'),           scale: 1.0 },
  { id: 'flower_a_pk',      model: pk('flower_A'),             scale: 1.0 },
  { id: 'flower_b_pk',      model: pk('flower_B'),             scale: 1.0 },
  // Outdoor floor tiles
  { id: 'floor_tile_large', model: bkb('floor_tile_large'),    scale: 1.0 },
  { id: 'floor_tile_medium',model: bkb('floor_tile_medium'),   scale: 1.0 },
  { id: 'floor_tile_small', model: bkb('floor_tile_small'),    scale: 1.0 },
  { id: 'floor_tile_tree',  model: bkb('floor_tile_tree'),     scale: 1.0 },
  { id: 'floor_base_hh',    model: hh('floor_base'),           scale: 1.0 },
  { id: 'cobblestones',     model: pk('cobble_stones'),        scale: 1.0 },
]

// ─── Collect all unique model paths for preloading ──────
export function getAllModelPaths(): string[] {
  const paths = new Set<string>()
  const allDefs = [
    ...COUNTER_MODELS, ...APPLIANCE_MODELS, ...UTENSIL_MODELS,
    ...TABLEWARE_MODELS, ...INGREDIENT_MODELS, ...BAKED_GOODS_MODELS,
    ...CONTAINER_MODELS, ...DISPLAY_MODELS, ...WALL_MODELS,
    ...WALL_FIXTURE_MODELS, ...FLOOR_MODELS, ...FURNITURE_MODELS,
    ...DECORATION_MODELS,
  ]
  for (const def of allDefs) paths.add(def.model)
  paths.add(CHARACTER_MODEL)
  Object.values(ANIM_PATHS).forEach(p => paths.add(p))
  return Array.from(paths)
}
