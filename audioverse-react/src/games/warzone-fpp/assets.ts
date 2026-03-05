/**
 * Complete catalog of all Polygon Heist Pack assets available for the game.
 */

export const ASSET_BASE = '/assets/models/POLYGON_Heist_SourceFiles_v4/SourceFiles'

// ─── Building type presets ───────────────────────────────
export const BUILDING_TYPES = {
  bank: {
    label: 'Bank',
    color: '#4a4a5e',
    borderColor: '#2a2a3e',
    models: ['SM_Env_VaultDoor_Frame_01.fbx', 'SM_Env_VaultGate_Frame_01.fbx', 'SM_Env_VaultGate_Wall_01.fbx'],
  },
  police: {
    label: 'Police Station',
    color: '#2a3a5e',
    borderColor: '#1a2a4e',
    models: ['SM_Env_Wall_Exterior_Door_01.fbx', 'SM_Env_Flag_Pole_01.fbx', 'SM_Env_Flag_Straight_01.fbx'],
  },
  jewelry: {
    label: 'Jewelry Store',
    color: '#5e3a4e',
    borderColor: '#4e2a3e',
    models: ['SM_Env_Wall_Glass_01.fbx', 'SM_Env_Door_Glass_01.fbx', 'SM_Env_Railing_Glass_01.fbx'],
  },
  office: {
    label: 'Office',
    color: '#3a5a6a',
    borderColor: '#2a4a5a',
    models: ['SM_Env_Wall_Glass_Ground_01.fbx', 'SM_Env_Skylight_01.fbx', 'SM_Env_Ceiling_Light_01.fbx'],
  },
  warehouse: {
    label: 'Warehouse',
    color: '#5a5a4a',
    borderColor: '#4a4a3a',
    models: ['SM_Env_Wall_Exterior_01.fbx', 'SM_Env_Door_02.fbx', 'SM_Env_Door_03.fbx'],
  },
  house: {
    label: 'House',
    color: '#5a4a3a',
    borderColor: '#4a3a2a',
    models: ['SM_Env_Roof_01.fbx', 'SM_Env_Door_01.fbx', 'SM_Env_Wall_Exterior_Window_01.fbx'],
  },
  shop: {
    label: 'Shop',
    color: '#4a5a3a',
    borderColor: '#3a4a2a',
    models: ['SM_Env_Wall_Glass_DoorFrame_01.fbx', 'SM_Env_Door_Glass_02.fbx', 'SM_Env_Railing_01.fbx'],
  },
  parking: {
    label: 'Parking',
    color: '#4a4a4a',
    borderColor: '#3a3a3a',
    models: ['SM_Env_Pillar_01.fbx', 'SM_Env_Pillar_02.fbx', 'SM_Env_Railing_01.fbx'],
  },
} as const

export type BuildingType = keyof typeof BUILDING_TYPES

// ─── Prop definitions ────────────────────────────────────
export const PROP_TYPES = {
  atm:           { label: 'ATM',       color: '#6688aa', w: 15, h: 15, blocking: true,  model: 'SM_Prop_ATM_01.fbx' },
  bin:           { label: 'Bin',       color: '#556655', w: 10, h: 10, blocking: false, model: 'SM_Prop_Bin_01.fbx' },
  crate:         { label: 'Crate',     color: '#887755', w: 20, h: 20, blocking: true,  model: 'SM_Prop_Box_01.fbx' },
  desk:          { label: 'Desk',      color: '#7a6a5a', w: 30, h: 15, blocking: true,  model: 'SM_Prop_Desk_01.fbx' },
  desk2:         { label: 'Desk',      color: '#7a6a5a', w: 28, h: 16, blocking: true,  model: 'SM_Prop_Desk_02.fbx' },
  desk3:         { label: 'Desk',      color: '#7a6a5a', w: 32, h: 14, blocking: true,  model: 'SM_Prop_Desk_03.fbx' },
  deskGlass:     { label: 'Desk',      color: '#8a9aaa', w: 30, h: 15, blocking: true,  model: 'SM_Prop_Desk_Glass_01.fbx' },
  couch:         { label: 'Couch',     color: '#6a5a7a', w: 35, h: 15, blocking: true,  model: 'SM_Prop_Couch_01.fbx' },
  couch2:        { label: 'Couch',     color: '#7a5a6a', w: 32, h: 16, blocking: true,  model: 'SM_Prop_Couch_02.fbx' },
  plant:         { label: 'Plant',     color: '#3a7a3a', w: 12, h: 12, blocking: false, model: 'SM_Prop_Plant_01.fbx' },
  plant2:        { label: 'Plant',     color: '#3a8a3a', w: 14, h: 14, blocking: false, model: 'SM_Prop_Plant_02.fbx' },
  plant3:        { label: 'Plant',     color: '#2a7a2a', w: 10, h: 10, blocking: false, model: 'SM_Prop_Plant_03.fbx' },
  camera:        { label: 'Camera',    color: '#333',    w: 8,  h: 8,  blocking: false, model: 'SM_Prop_Camera_01.fbx' },
  statue:        { label: 'Statue',    color: '#aaa',    w: 18, h: 18, blocking: true,  model: 'SM_Prop_Statue_01.fbx' },
  barrier:       { label: 'Barrier',   color: '#ddaa33', w: 25, h: 5,  blocking: true,  model: 'SM_Prop_RopeBarrier_01.fbx' },
  barrier2:      { label: 'Barrier',   color: '#ddaa33', w: 22, h: 5,  blocking: true,  model: 'SM_Prop_RopeBarrier_02.fbx' },
  barrier3:      { label: 'Barrier',   color: '#ddaa33', w: 30, h: 5,  blocking: true,  model: 'SM_Prop_RopeBarrier_03.fbx' },
  table:         { label: 'Table',     color: '#7a6a5a', w: 25, h: 20, blocking: true,  model: 'SM_Prop_Table_01.fbx' },
  table2:        { label: 'Table',     color: '#7a6a5a', w: 22, h: 22, blocking: true,  model: 'SM_Prop_Table_02.fbx' },
  coffeeTable:   { label: 'CofTable',  color: '#8a7a6a', w: 20, h: 15, blocking: true,  model: 'SM_Prop_CoffeTable_01.fbx' },
  coffeeTable2:  { label: 'CofTable',  color: '#8a7a6a', w: 18, h: 14, blocking: true,  model: 'SM_Prop_CoffeeTable_02.fbx' },
  displayCase:   { label: 'Display',   color: '#88aabb', w: 25, h: 12, blocking: true,  model: 'SM_Prop_DisplayCase_01.fbx' },
  displayCase2:  { label: 'Display',   color: '#88aabb', w: 28, h: 14, blocking: true,  model: 'SM_Prop_DisplayCase_02.fbx' },
  safe:          { label: 'Safe',      color: '#555',    w: 20, h: 25, blocking: true,  model: 'SM_Prop_SafeDepositBoxes_01.fbx' },
  safeHalf:      { label: 'Safe',      color: '#555',    w: 20, h: 14, blocking: true,  model: 'SM_Prop_SafeDepositBoxes_Half_01.fbx' },
  waterCooler:   { label: 'Water',     color: '#aabbcc', w: 10, h: 10, blocking: false, model: 'SM_Prop_WaterCooler_01.fbx' },
  metalDetector: { label: 'Detector',  color: '#888',    w: 30, h: 8,  blocking: true,  model: 'SM_Prop_MetalDetector_01.fbx' },
  computer:      { label: 'Computer',  color: '#3a3a4a', w: 12, h: 12, blocking: false, model: 'SM_Prop_Computer_01.fbx' },
  chair:         { label: 'Chair',     color: '#555544', w: 12, h: 12, blocking: false, model: 'SM_Prop_Seat_01.fbx' },
  chair2:        { label: 'Chair',     color: '#555544', w: 14, h: 14, blocking: false, model: 'SM_Prop_Seat_02.fbx' },
  shelf:         { label: 'Shelf',     color: '#6a5a4a', w: 30, h: 10, blocking: true,  model: 'SM_Prop_Shelf_01.fbx' },
  signBank:      { label: 'Sign',      color: '#dddd88', w: 20, h: 5,  blocking: false, model: 'SM_Prop_Sign_Bank_01.fbx' },
  signJewelry:   { label: 'Sign',      color: '#ddaa88', w: 20, h: 5,  blocking: false, model: 'SM_Prop_Sign_Jewellery_01.fbx' },
  signMoney:     { label: 'Sign',      color: '#88dd88', w: 20, h: 5,  blocking: false, model: 'SM_Prop_Sign_Money_Bank_01.fbx' },
  goldBar:       { label: 'Gold',      color: '#ffd700', w: 10, h: 8,  blocking: false, model: 'SM_Prop_GoldBar_01.fbx' },
  goldBar2:      { label: 'Gold',      color: '#ffd700', w: 12, h: 10, blocking: false, model: 'SM_Prop_GoldBar_02.fbx' },
  vaultTrolley:  { label: 'Trolley',   color: '#888',    w: 20, h: 15, blocking: true,  model: 'SM_Prop_VaultTrolley_01.fbx' },
  tellerDesk:    { label: 'Teller',    color: '#7a6a5a', w: 35, h: 12, blocking: true,  model: 'SM_Prop_TellerDesk_01.fbx' },
  tellerDesk2:   { label: 'Teller',    color: '#7a6a5a', w: 32, h: 14, blocking: true,  model: 'SM_Prop_TellerDesk_02.fbx' },
  drawers:       { label: 'Drawers',   color: '#6a5a4a', w: 18, h: 16, blocking: true,  model: 'SM_Prop_Drawers_01.fbx' },
  pillar:        { label: 'Pillar',    color: '#999',    w: 10, h: 10, blocking: true,  model: 'SM_Prop_Pillar_01.fbx' },
  pillar2:       { label: 'Pillar',    color: '#999',    w: 12, h: 12, blocking: true,  model: 'SM_Prop_Pillar_02.fbx' },
  rug:           { label: 'Rug',       color: '#8a4a4a', w: 40, h: 30, blocking: false, model: 'SM_Prop_Rug_01.fbx' },
  rug2:          { label: 'Rug',       color: '#4a6a8a', w: 35, h: 25, blocking: false, model: 'SM_Prop_Rug_02.fbx' },
  aircon:        { label: 'Aircon',    color: '#bbb',    w: 16, h: 10, blocking: false, model: 'SM_Prop_Aircon_01.fbx' },
  airVent:       { label: 'Vent',      color: '#999',    w: 14, h: 8,  blocking: false, model: 'SM_Prop_AirVent_01.fbx' },
  deskLight:     { label: 'Light',     color: '#aaaa55', w: 8,  h: 8,  blocking: false, model: 'SM_Prop_DeskLight_01.fbx' },
  alarm:         { label: 'Alarm',     color: '#cc3333', w: 8,  h: 8,  blocking: false, model: 'SM_Prop_AlarmButton_01.fbx' },
  drill:         { label: 'Drill',     color: '#666',    w: 10, h: 10, blocking: false, model: 'SM_Prop_Drill_01.fbx' },
  sprinkler:     { label: 'Sprinkler', color: '#aaa',    w: 6,  h: 6,  blocking: false, model: 'SM_Prop_Sprinkler_01.fbx' },
  moneyStack:    { label: 'Money',     color: '#55aa55', w: 8,  h: 6,  blocking: false, model: 'SM_Prop_Money_Stack_01.fbx' },
  moneyRoll:     { label: 'Money',     color: '#55aa55', w: 6,  h: 6,  blocking: false, model: 'SM_Prop_Money_Roll_01.fbx' },
  jewellery:     { label: 'Jewels',    color: '#bb66cc', w: 8,  h: 8,  blocking: false, model: 'SM_Prop_Jewellery_01.fbx' },
  jewellery2:    { label: 'Jewels',    color: '#cc66bb', w: 10, h: 8,  blocking: false, model: 'SM_Prop_Jewellery_02.fbx' },
  necklace:      { label: 'Necklace',  color: '#ddaa88', w: 6,  h: 6,  blocking: false, model: 'SM_Prop_Jewellery_Necklace_01.fbx' },
  ring:          { label: 'Ring',      color: '#ffcc55', w: 4,  h: 4,  blocking: false, model: 'SM_Prop_Jewellery_Ring_01.fbx' },
  folder:        { label: 'Folder',    color: '#887766', w: 8,  h: 10, blocking: false, model: 'SM_Prop_Folder_01.fbx' },
} as const

// ─── Vehicle definitions ─────────────────────────────────
export const VEHICLE_DEFS = {
  police_car: {
    label: 'Police Car', type: 'jeep' as const,
    hp: 200, maxHp: 200,
    model: 'SK_Veh_Car_Police_Heist_01.fbx',
  },
  helicopter: {
    label: 'Helicopter', type: 'helicopter' as const,
    hp: 300, maxHp: 300,
    model: 'SK_Veh_Helicopter_01.fbx',
  },
  swat_van: {
    label: 'SWAT Van', type: 'tank' as const,
    hp: 500, maxHp: 500,
    model: 'SK_Veh_SwatVan_01.fbx',
  },
}

// ─── Pickup item models ──────────────────────────────────
export const PICKUP_MODELS = {
  health: 'SM_Item_HealthKit_01.fbx',
  ammo: 'SM_Item_AmmoPack_01.fbx',
  armor: 'SM_Item_Briefcase_01.fbx',
}

// ─── Character models ────────────────────────────────────
export const CHARACTER_MODELS = [
  'SK_Character_Female_FBI.fbx',
  'SK_Character_Male_FBI.fbx',
  'SK_Character_Male_SWAT_01.fbx',
  'SK_Character_Male_Overall_01.fbx',
  'SK_Character_Male_Overall_01_Duffle.fbx',
  'SK_Character_Female_Overall_01.fbx',
  'SK_Character_Female_Overall_01_Duffle.fbx',
  'SK_Character_Male_Shirt_01.fbx',
  'SK_Character_Male_Shirt_01_Duffle.fbx',
  'SK_Character_Female_Shirt_01.fbx',
  'SK_Character_Female_Shirt_01_Duffle.fbx',
  'SK_Character_Male_SuitVest_01.fbx',
  'SK_Character_Male_SuitVest_01_Duffle.fbx',
  'SK_Character_Female_SuitVest_01.fbx',
  'SK_Character_Female_SuitVest_01_Duffle.fbx',
]

// ─── Weapon models (skeletal) ────────────────────────────
export const WEAPON_MODELS = [
  'SK_Wep_RifleSwat_01.fbx',
  'SK_Wep_RifleBandit_01.fbx',
  'SK_Wep_SMG_01.fbx',
  'SK_Wep_Shotgun_01.fbx',
  'SK_Wep_SniperSwat_01.fbx',
  'SK_Wep_PistolSwat_01.fbx',
  'SK_Wep_PistolBandit_01.fbx',
  'SK_Wep_Grenade_Base_01.fbx',
  'SK_Wep_Flashbang_Base_01.fbx',
  'SK_Wep_Holster_01.fbx',
  // Weapon parts / mags
  'SK_Wep_RifleSwat_Mag_01.fbx',
  'SK_Wep_RifleBandit_Mag_01.fbx',
  'SK_Wep_SMG_Mag_01.fbx',
  'SK_Wep_PistolSwat_Mag_01.fbx',
  'SK_Wep_PistolBandit_Mag_01.fbx',
  'SK_Wep_SniperSwat_Mag_01.fbx',
  // Attachments
  'SK_Wep_Attachment_Grip_01.fbx',
  'SK_Wep_Attachment_M4Rail_01.fbx',
  'SK_Wep_Attachment_Redot_01.fbx',
  'SK_Wep_Attachment_Silencer_01.fbx',
  'SK_Wep_Attachment_SniperScope_01.fbx',
  'SK_Wep_Attachment_Torch_01.fbx',
  // Crosshairs
  'SK_Wep_Crosshair_Sniper_01.fbx',
]

// ─── Static weapon models (non-skeletal) ─────────────────
export const STATIC_WEAPON_MODELS = [
  'SM_Wep_RifleSwat_01.fbx',
  'SM_Wep_RifleBandit_01.fbx',
  'SM_Wep_SMG_01.fbx',
  'SM_Wep_Shotgun_01.fbx',
  'SM_Wep_SniperSwat_01.fbx',
  'SM_Wep_PistolSwat_01.fbx',
  'SM_Wep_PistolBandit_01.fbx',
  'SM_Wep_Grenade_01.fbx',
  'SM_Wep_Flashbang_01.fbx',
  'SM_Wep_Holster_01.fbx',
  // Ammo
  'SM_Wep_Ammo_BulletLarge_01.fbx',
  'SM_Wep_Ammo_BulletLarge_02.fbx',
  'SM_Wep_Ammo_BulletSmall_01.fbx',
  'SM_Wep_Ammo_BulletSmall_02.fbx',
  'SM_Wep_Ammo_Shotgun.fbx',
  // Crosshairs
  'SM_Wep_Crosshair_01.fbx',
  'SM_Wep_Crosshair_02.fbx',
  'SM_Wep_Crosshair_03.fbx',
  'SM_Wep_Crosshair_04.fbx',
  'SM_Wep_Crosshair_05.fbx',
  'SM_Wep_Crosshair_Sniper_01.fbx',
  // Attachments
  'SM_Wep_Attachment_Grip_01.fbx',
  'SM_Wep_Attachment_M4Rail_01.fbx',
  'SM_Wep_Attachment_Redot_01.fbx',
  'SM_Wep_Attachment_Silencer_01.fbx',
  'SM_Wep_Attachment_SniperScope_01.fbx',
  'SM_Wep_Attachment_Torch_01.fbx',
]

// ─── Textures ────────────────────────────────────────────
export const TEXTURES = [
  'PolygonHeist_Texture_01_A.png',
  'PolygonHeist_Texture_01_B.png',
  'PolygonHeist_Texture_01_C.png',
  'PolygonHeist_Texture_02_A.png',
  'PolygonHeist_Texture_02_B.png',
  'PolygonHeist_Texture_02_C.png',
  'PolygonHeist_Texture_03_A.png',
  'PolygonHeist_Texture_03_B.png',
  'PolygonHeist_Texture_03_C.png',
  'PolygonHeist_Texture_04_A.png',
  'PolygonHeist_Texture_04_B.png',
  'PolygonHeist_Texture_04_C.png',
  'Emissive_01.png',
  'Emissive_02.png',
  'Emissive_03.png',
  'Emissive_04.png',
  'Emissive_05.png',
  'SimplePeopleMasks_Black.png',
  'SimplePeopleMasks_Brown.png',
  'SimplePeopleMasks_White.png',
  'SimplePeopleMasks_White_Blonde.png',
]

// ─── Decorative item models ──────────────────────────────
export const ITEM_MODELS = {
  bomb: 'SM_Item_Bomb_01.fbx',
  crowbar: 'SM_Item_Crowbar_01.fbx',
  hammer: 'SM_Item_Hammer_01.fbx',
  mallet: 'SM_Item_Mallet_01.fbx',
  hacksaw: 'SM_Item_Hacksaw_01.fbx',
  handDrill: 'SM_Item_HandDrill_01.fbx',
  handcuffs: 'SM_Item_Handcuffs_01.fbx',
  rope: 'SM_Item_Rope_01.fbx',
  walkieTalkie: 'SM_Item_WalkieTalkie_01.fbx',
  wireCutter: 'SM_Item_Wirecutter_01.fbx',
  wrench: 'SM_Item_Wrench_01.fbx',
  zipTies: 'SM_Item_ZipTies_01.fbx',
  pouch: 'SM_Item_Pouch_01.fbx',
  healthKit1: 'SM_Item_HealthKit_01.fbx',
  healthKit2: 'SM_Item_HealthKit_02.fbx',
  healthKitLid: 'SM_Item_HealthKit_Lid_01.fbx',
  healthKitSupplies: 'SM_Item_HealthKit_Supplies_01.fbx',
  ammoPack1: 'SM_Item_AmmoPack_01.fbx',
  ammoPack2: 'SM_Item_AmmoPack_02.fbx',
  ammoPackLid: 'SM_Item_AmmoPack_Lid_01.fbx',
  ammoPackSupplies: 'SM_Item_AmmoPack_Supplies_01.fbx',
  briefcase1: 'SM_Item_Briefcase_01.fbx',
  briefcase2: 'SM_Item_Briefcase_02.fbx',
  briefcaseLid: 'SM_Item_Briefcase_Lid_01.fbx',
  briefcaseMoney: 'SM_Item_Briefcase_Money_01.fbx',
  duffleBag: 'SM_Item_DuffleBag_01.fbx',
  duffleBagEmpty: 'SM_Item_DuffleBag_Empty_01.fbx',
  duffleBagFull: 'SM_Item_DuffleBag_Full_01.fbx',
  duffleBagOpenEmpty: 'SM_Item_DuffleBag_Open_Empty_01.fbx',
  duffleBagOpenFull: 'SM_Item_DuffleBag_Open_Full_01.fbx',
  masks: [
    'SM_Item_Mask_Alien_01.fbx',
    'SM_Item_Mask_Balaclava_01.fbx',
    'SM_Item_Mask_Beanie_01.fbx',
    'SM_Item_Mask_Chicken_01.fbx',
    'SM_Item_Mask_Clown_01.fbx',
    'SM_Item_Mask_Construction_01.fbx',
    'SM_Item_Mask_Fox_01.fbx',
    'SM_Item_Mask_Gas_01.fbx',
    'SM_Item_Mask_Glasses_01.fbx',
    'SM_Item_Mask_Hat_01.fbx',
    'SM_Item_Mask_Hockey_01.fbx',
    'SM_Item_Mask_Horse_01.fbx',
    'SM_Item_Mask_Luchador_01.fbx',
    'SM_Item_Mask_Panda_01.fbx',
    'SM_Item_Mask_PaperBag_01.fbx',
    'SM_Item_Mask_Simple_Man_01.fbx',
    'SM_Item_Mask_Simple_Robber_01.fbx',
    'SM_Item_Mask_Simple_Woman_01.fbx',
    'SM_Item_Mask_Tiger_01.fbx',
    'SM_Item_Mask_Trump_01.fbx',
    'SM_Item_Mask_WeldersMask_01.fbx',
  ],
  hair: [
    'SM_Item_Hair_Man_01.fbx',
    'SM_Item_Hair_Woman_01.fbx',
    'SM_Item_Hair_Eyebrow_Man_01.fbx',
    'SM_Item_Hair_Eyebrow_Woman_01.fbx',
  ],
}

// ─── All environment structure models ────────────────────
export const ENV_STRUCTURE_MODELS = [
  // Ceilings
  'SM_Env_Ceiling_01.fbx', 'SM_Env_Ceiling_02.fbx', 'SM_Env_Ceiling_03.fbx',
  'SM_Env_Ceiling_04.fbx', 'SM_Env_Ceiling_05.fbx', 'SM_Env_Ceiling_06.fbx',
  'SM_Env_Ceiling_07.fbx', 'SM_Env_Ceiling_08.fbx',
  'SM_Env_Ceiling_Light_01.fbx', 'SM_Env_Ceiling_Light_02.fbx', 'SM_Env_Ceiling_Light_03.fbx',
  // Doors
  'SM_Env_Door_01.fbx', 'SM_Env_Door_02.fbx', 'SM_Env_Door_03.fbx',
  'SM_Env_Door_Glass_01.fbx', 'SM_Env_Door_Glass_02.fbx',
  // Flags
  'SM_Env_Flag_Pole_01.fbx', 'SM_Env_Flag_Straight_01.fbx',
  'SM_Env_Flag_Wall_01.fbx', 'SM_Env_Flag_Wall_02.fbx',
  // Floors
  'SM_Env_Floor_01.fbx', 'SM_Env_Floor_02.fbx',
  // Pillars
  'SM_Env_Pillar_01.fbx', 'SM_Env_Pillar_02.fbx',
  'SM_Env_Pillar_Exterior_01.fbx', 'SM_Env_Pillar_Exterior_02.fbx',
  'SM_Env_Pillar_Exterior_03.fbx', 'SM_Env_Pillar_Exterior_04.fbx',
  'SM_Env_Pillar_Exterior_Floor_01.fbx', 'SM_Env_Pillar_Exterior_Floor_02.fbx',
  'SM_Env_Pillar_Exterior_Floor_03.fbx', 'SM_Env_Pillar_Exterior_Floor_04.fbx',
  'SM_Env_Pillar_Interior_01.fbx', 'SM_Env_Pillar_Interior_02.fbx',
  'SM_Env_Pillar_Interior_03.fbx', 'SM_Env_Pillar_Interior_04.fbx',
  // Railings
  'SM_Env_Railing_01.fbx', 'SM_Env_Railing_Glass_01.fbx',
  // Road
  'SM_Env_Road_01.fbx',
  // Roofs
  'SM_Env_Roof_01.fbx', 'SM_Env_Roof_02.fbx', 'SM_Env_Roof_03.fbx',
  'SM_Env_Roof_04.fbx', 'SM_Env_Roof_05.fbx',
  // Sidewalks
  'SM_Env_Sidewalk_01.fbx', 'SM_Env_Sidewalk_Straight_01.fbx',
  // Skylights
  'SM_Env_Skylight_01.fbx', 'SM_Env_Skylight_Glass_01.fbx',
  // Stairs / Steps
  'SM_Env_Stairway_01.fbx',
  'SM_Env_Steps_01.fbx', 'SM_Env_Steps_02.fbx', 'SM_Env_Steps_03.fbx', 'SM_Env_Steps_04.fbx',
  'SM_Env_Steps_Edge_01.fbx',
  // Vault
  'SM_Env_VaultDoor_Frame_01.fbx', 'SM_Env_VaultDoor_Handle_01.fbx', 'SM_Env_VaultDoor_Handle_02.fbx',
  'SM_Env_VaultDoor_Lid_01.fbx', 'SM_Env_VaultGate_Door_01.fbx',
  'SM_Env_VaultGate_Frame_01.fbx', 'SM_Env_VaultGate_Wall_01.fbx',
  // Walls Exterior
  'SM_Env_Wall_Exterior_01.fbx', 'SM_Env_Wall_Exterior_Door_01.fbx',
  'SM_Env_Wall_Exterior_DoubleDoor_01.fbx', 'SM_Env_Wall_Exterior_Ground_01.fbx',
  'SM_Env_Wall_Exterior_Window_01.fbx', 'SM_Env_Wall_Exterior_Window_02.fbx',
  'SM_Env_Wall_Exterior_Window_Glass_01.fbx', 'SM_Env_Wall_Exterior_Window_Glass_02.fbx',
  'SM_Env_Wall_Exterior_Window_Ground_01.fbx', 'SM_Env_Wall_Exterior_Window_Ground_02.fbx',
  'SM_Env_Wall_Exterior_Window_Ground_Glass_01.fbx', 'SM_Env_Wall_Exterior_Window_Ground_Glass_02.fbx',
  // Walls Glass
  'SM_Env_Wall_Glass_01.fbx', 'SM_Env_Wall_Glass_DoorFrame_01.fbx',
  'SM_Env_Wall_Glass_DoorFrame_01_Collision.fbx', 'SM_Env_Wall_Glass_DoorFrame_Glass_01.fbx',
  'SM_Env_Wall_Glass_DoorFrame_Panels_01.fbx', 'SM_Env_Wall_Glass_Glass_01.fbx',
  'SM_Env_Wall_Glass_Ground_01.fbx', 'SM_Env_Wall_Glass_Ground_Glass_01.fbx', 'SM_Env_Wall_Glass_Ground_Panels_01.fbx',
  // Walls Interior
  'SM_Env_Wall_Interior_01.fbx', 'SM_Env_Wall_Interior_Door_01.fbx', 'SM_Env_Wall_Interior_Door_Alt_01.fbx',
  'SM_Env_Wall_Interior_DoubleDoor_01.fbx', 'SM_Env_Wall_Interior_DoubleDoor_Alt_01.fbx',
  'SM_Env_Wall_Interior_Ground_01.fbx',
  'SM_Env_Wall_Interior_Window_01.fbx', 'SM_Env_Wall_Interior_Window_02.fbx',
  'SM_Env_Wall_Interior_Window_Glass_01.fbx', 'SM_Env_Wall_Interior_Window_Glass_02.fbx',
  'SM_Env_Wall_Interior_Window_Ground_01.fbx', 'SM_Env_Wall_Interior_Window_Ground_02.fbx',
  'SM_Env_Wall_Interior_Window_Ground_Glass_01.fbx', 'SM_Env_Wall_Interior_Window_Ground_Glass_02.fbx',
  // Misc Window extras
  'SM_Env_Wall_Window_Blinds_01.fbx', 'SM_Env_Wall_Window_Panels_01.fbx',
]
