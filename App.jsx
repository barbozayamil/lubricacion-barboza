import { useState, useMemo, useEffect } from "react";

// ─── TEMAS ────────────────────────────────────────────
const TEMAS = {
  A: { nombre:"Oscuro Industrial", appBg:"#0f172a", headerBg:"#0f172a", headerBorder:"#1e293b", cardBg:"#1e293b", cardBorder:"#334155", rowAlt:"#192030", text:"#f8fafc", textMuted:"#64748b", textSub:"#94a3b8", accent:"#3b82f6", accentText:"#60a5fa", btnPrimary:"#2563eb", btnSuccess:"#059669", btnOrange:"#d97706", inputBg:"#0f172a", inputBorder:"#334155", tabActiveTxt:"#f8fafc", statAnomBg:"#450a0a", statAnomBorder:"#991b1b", progressBar:"linear-gradient(90deg,#3b82f6,#10b981)", dayCardBg:"linear-gradient(135deg,#172554,#1e293b)", dayCardBorder:"#1d4ed8", dayBar:"#2563eb", theadBg:"#0f172a" },
  B: { nombre:"Claro Profesional", appBg:"#f1f5f9", headerBg:"#ffffff", headerBorder:"#e2e8f0", cardBg:"#ffffff", cardBorder:"#e2e8f0", rowAlt:"#f8fafc", text:"#0f172a", textMuted:"#94a3b8", textSub:"#475569", accent:"#1d4ed8", accentText:"#1d4ed8", btnPrimary:"#1d4ed8", btnSuccess:"#059669", btnOrange:"#d97706", inputBg:"#ffffff", inputBorder:"#e2e8f0", tabActiveTxt:"#1d4ed8", statAnomBg:"#fef2f2", statAnomBorder:"#fecaca", progressBar:"linear-gradient(90deg,#1d4ed8,#0891b2)", dayCardBg:"linear-gradient(135deg,#eff6ff,#f0f9ff)", dayCardBorder:"#bfdbfe", dayBar:"#1d4ed8", theadBg:"#f8fafc" },
  C: { nombre:"Dark Minero", appBg:"#0c0a09", headerBg:"#0c0a09", headerBorder:"#292524", cardBg:"#1c1917", cardBorder:"#292524", rowAlt:"#18120e", text:"#e7e5e4", textMuted:"#57534e", textSub:"#78716c", accent:"#ea580c", accentText:"#fb923c", btnPrimary:"#c2410c", btnSuccess:"#15803d", btnOrange:"#b45309", inputBg:"#1c1917", inputBorder:"#44403c", tabActiveTxt:"#fb923c", statAnomBg:"#450a0a", statAnomBorder:"#7f1d1d", progressBar:"linear-gradient(90deg,#ea580c,#fbbf24)", dayCardBg:"linear-gradient(135deg,#1c1200,#1c1917)", dayCardBorder:"#92400e", dayBar:"#c2410c", theadBg:"#0c0a09" },
};

// ─── USUARIOS / STORAGE ───────────────────────────────
const USUARIOS_INIT = [
  { id:"1", nombre:"Barboza", usuario:"barboza", password:"lubri2026", rol:"admin", activo:true,
    permisos:{cargarPlan:true,cerrarPlan:true,alertaViento:true,paradas:true,usuarios:true,asignarTareas:true,verTodos:true,catalogo:true} },
];

// ─── PERMISOS POR ROL ─────────────────────────────────
const PERMISOS_ROL = {
  admin:      {cargarPlan:true,cerrarPlan:true,alertaViento:true,paradas:true,usuarios:true,asignarTareas:true,verTodos:true,catalogo:true,registrar:true},
  supervisor: {cargarPlan:true,cerrarPlan:false,alertaViento:true,paradas:true,usuarios:false,asignarTareas:true,verTodos:true,catalogo:false,registrar:true},
  tecnico:    {cargarPlan:false,cerrarPlan:false,alertaViento:false,paradas:false,usuarios:false,asignarTareas:false,verTodos:false,catalogo:false,registrar:true},
};

const tienePermiso=(sesion,perm)=>{
  if(!sesion)return false;
  if(sesion.rol==="admin")return true;
  const perms=sesion.permisos||PERMISOS_ROL[sesion.rol]||{};
  return !!perms[perm];
};
const LS = {
  get:(k,d)=>{ try{ const v=window.localStorage.getItem(k); return v?JSON.parse(v):d; }catch{ return d; } },
  set:(k,v)=>{ try{ window.localStorage.setItem(k,JSON.stringify(v)); }catch{} },
};


// ─── CATÁLOGOS GLOBALES INICIALES ─────────────────────
const HERRAMIENTAS_INIT = [
  {id:"H001",nombre:"Llave Allen 4mm",      tipo:"llave",    detalle:"Hexagonal métrica"},
  {id:"H002",nombre:"Llave Allen 5mm",      tipo:"llave",    detalle:"Hexagonal métrica"},
  {id:"H003",nombre:"Llave Allen 6mm",      tipo:"llave",    detalle:"Hexagonal métrica"},
  {id:"H004",nombre:"Llave Allen 8mm",      tipo:"llave",    detalle:"Hexagonal métrica"},
  {id:"H005",nombre:"Llave Allen 10mm",     tipo:"llave",    detalle:"Hexagonal métrica"},
  {id:"H006",nombre:"Llave Combinada 13mm", tipo:"llave",    detalle:"Combinada métrica"},
  {id:"H007",nombre:"Llave Combinada 17mm", tipo:"llave",    detalle:"Combinada métrica"},
  {id:"H008",nombre:"Llave Combinada 19mm", tipo:"llave",    detalle:"Combinada métrica"},
  {id:"H009",nombre:"Llave Francesa 12 pulgadas",tipo:"llave",detalle:"Ajustable"},
  {id:"H010",nombre:"Pistola engrasadora neumática", tipo:"engrase", detalle:"Alta presión"},
  {id:"H011",nombre:"Pistola engrasadora manual",    tipo:"engrase", detalle:"Palanca manual"},
  {id:"H012",nombre:"Bomba de trasiego manual",      tipo:"bomba",   detalle:"Para trasvasar aceite"},
  {id:"H013",nombre:"Llave para filtros 95mm",       tipo:"llave",   detalle:"Ajustable para filtros"},
  {id:"H014",nombre:"Recipiente recolector 20L",     tipo:"recipiente",detalle:"Para aceite usado"},
  {id:"H015",nombre:"Trapos y elementos de limpieza",tipo:"limpieza", detalle:""},
  {id:"H016",nombre:"Embudo con filtro",             tipo:"recipiente",detalle:"Para carga de aceite"},
  {id:"H017",nombre:"Termómetro infrarrojo",         tipo:"medicion", detalle:"Para control de temperatura"},
  {id:"H018",nombre:"Nivel de burbuja",              tipo:"medicion", detalle:""},
];

const MATERIALES_INIT = [
  {id:"M001",nombre:"Grasa Mobil Mobilux EP2",       tipo:"grasa",    codigo:"MAT-001",unidad:"kg", detalle:"NLGI 2, multiuso EP"},
  {id:"M002",nombre:"Grasa Shell Gadus S2 V220",     tipo:"grasa",    codigo:"MAT-002",unidad:"kg", detalle:"NLGI 2"},
  {id:"M003",nombre:"Aceite Mobil DTE 25",           tipo:"aceite",   codigo:"MAT-010",unidad:"L",  detalle:"Hidráulico ISO VG 46"},
  {id:"M004",nombre:"Aceite Shell Omala S2 G220",    tipo:"aceite",   codigo:"MAT-011",unidad:"L",  detalle:"Reductores ISO VG 220"},
  {id:"M005",nombre:"Aceite Shell Omala S2 G150",    tipo:"aceite",   codigo:"MAT-012",unidad:"L",  detalle:"Reductores ISO VG 150"},
  {id:"M006",nombre:"Aceite Mobil SHC 630",          tipo:"aceite",   codigo:"MAT-013",unidad:"L",  detalle:"Sintético reductores"},
  {id:"M007",nombre:"Filtro de aceite Donaldson P553000", tipo:"filtro", codigo:"MAT-020",unidad:"un",detalle:"Filtro motor/compresor"},
  {id:"M008",nombre:"Filtro de respiro Donaldson P527484",tipo:"filtro", codigo:"MAT-021",unidad:"un",detalle:"Respiro tanque hidráulico"},
  {id:"M009",nombre:"Junta tórica NBR 50x4",         tipo:"repuesto", codigo:"REP-001",unidad:"un", detalle:"Tapón de drenaje"},
  {id:"M010",nombre:"Tapón drenaje magnético M22x1.5",tipo:"repuesto",codigo:"REP-002",unidad:"un", detalle:"Con imán colector de virutas"},
];


// ─── DATOS INICIALES ──────────────────────────────────
const PERIODO_DEFAULT = "MARTES 24/03/2026  AL  LUNES 06/04/2026";
const TAREAS_INIT = [
  {id:"C1",cat:"Correctiva",codigo:"",tarea:"PIERDE POR RETEN",equipo:"204CT102",area:"Correctivas",orden:"",est:"pendiente",reg:null,enDia:false},
  {id:"C2",cat:"Correctiva",codigo:"",tarea:"CAMBIO DE ACEITE",equipo:"204BF102",area:"Correctivas",orden:"",est:"pendiente",reg:null,enDia:false},
  {id:"C3",cat:"Correctiva",codigo:"",tarea:"PIERDE ACEITE",equipo:"930BF404",area:"Correctivas",orden:"",est:"pendiente",reg:null,enDia:false},
  {id:"C4",cat:"Correctiva",codigo:"",tarea:"COMPLETAR ACEITE",equipo:"215MU101/102",area:"Correctivas",orden:"",est:"pendiente",reg:null,enDia:false},
  {id:"T11",cat:"Prev. Semanal",codigo:"AR00-PPP-INF-410TA",tarea:"ORDEN Y LIMPIEZA DE TALLER",equipo:"TALLER DE MANTENIMIENTO DE PLANTA",area:"Planta",orden:"103091692",est:"pendiente",reg:null,enDia:false},
  {id:"T12",cat:"Prev. Semanal",codigo:"AR00-PPP-LAB-440BC-00101-STR01",tarea:"LUBR. SEMANAL BODY BUSHER",equipo:"ESTRUCTURA",area:"Planta",orden:"103087502",est:"pendiente",reg:null,enDia:false},
  {id:"T13",cat:"Prev. Semanal",codigo:"AR00-PPP-LAB-440BC-00102-STR01",tarea:"LUBR. SEMANAL BODY BUSHER",equipo:"ESTRUCTURA",area:"Planta",orden:"103087503",est:"pendiente",reg:null,enDia:false},
  {id:"T14",cat:"Prev. Semanal",codigo:"AR00-PPP-MIL-211AR",tarea:"RECORRIDA SEMANAL LUBR PLTA MOLIENDA",equipo:"MOLIENDA Y ESPESAMIENTO PRIMARIO",area:"Planta",orden:"205288714",est:"pendiente",reg:null,enDia:false},
  {id:"T15",cat:"Prev. Semanal",codigo:"AR00-PPP-MIL-211MO-00101",tarea:"LUBRICACION SEMANAL MOLINO",equipo:"MOLINO DE BOLAS No1",area:"Planta",orden:"103087501",est:"pendiente",reg:null,enDia:false},
  {id:"T16",cat:"Prev. Semanal",codigo:"AR00-PPP-MIL-211MO-00101",tarea:"VERIFICACION SISTEMA DE ENGRASE MOLINO",equipo:"MOLINO DE BOLAS No1",area:"Planta",orden:"103087501",est:"pendiente",reg:null,enDia:false},
  {id:"T17",cat:"Prev. Semanal",codigo:"AR00-PPP-MIL-211MO-00101",tarea:"LUBRICACION  MOTOR MOLINO",equipo:"MOLINO DE BOLAS No1",area:"Planta",orden:"103087670",est:"pendiente",reg:null,enDia:false},
  {id:"T18",cat:"Prev. Semanal",codigo:"AR00-PPP-MIL-211RD-00101",tarea:"LUBRICACION SEMANAL RODAMIENTOS PIÑON",equipo:"CONJUNTO PIÑON Y CORONA - MOLINO No1",area:"Planta",orden:"103087662",est:"pendiente",reg:null,enDia:false},
  {id:"T19",cat:"Prev. Semanal",codigo:"AR00-PPP-MIL-211ZL-00101",tarea:"LUBRICACION SEMANAL ZARANDA",equipo:"ZARANDA DESECHOS No1",area:"Planta",orden:"103087465",est:"pendiente",reg:null,enDia:false},
  {id:"T20",cat:"Prev. Semanal",codigo:"AR00-PPP-CIL-221ZL-00101-IDP01",tarea:"LUBRICACION SEMANAL ZARANDA",equipo:"POLEA",area:"Planta",orden:"103087657",est:"pendiente",reg:null,enDia:false},
  {id:"T21",cat:"Móvil",codigo:"AR00-MOE-LIV-F915E-VP385",tarea:"CHEQUEO Y LIMPIEZA VEHICULOS",equipo:"CAMIONETA TOYOTA",area:"Móvil",orden:"205293792",est:"pendiente",reg:null,enDia:false},
  {id:"T22",cat:"Prev. Roster",codigo:"AR00-PPP-CYN-250EA-00102",tarea:"CAMBIO DE GRASA 2 MESES",equipo:"EXTRACTOR AIRE No2",area:"Planta",orden:"103079977",est:"pendiente",reg:null,enDia:false},
  {id:"T23",cat:"Prev. Roster",codigo:"AR00-PPP-MIL-211ES-00101",tarea:"LUBR. PIÑON-CORONA ESPESADOR",equipo:"TRANSMISION ESPESADOR DE MOLIENDA No1",area:"Planta",orden:"103080014",est:"pendiente",reg:null,enDia:false},
  {id:"T24",cat:"Prev. Roster",codigo:"AR00-PPP-THI-231ES-00101",tarea:"LUBR. PIÑON-CORONA ESPESADOR",equipo:"ESPESADOR No1",area:"Planta",orden:"103080039",est:"pendiente",reg:null,enDia:false},
  {id:"T25",cat:"Prev. Roster",codigo:"AR00-PPP-THI-231ES-00201",tarea:"LUBR. PIÑON-CORONA ESPESADOR",equipo:"ESPESADOR No2",area:"Planta",orden:"103080040",est:"pendiente",reg:null,enDia:false},
  {id:"T26",cat:"Área 300",codigo:"AR00-PPP-AIG-300EA-00101-EXF01",tarea:"CAMBIO DE GRASA VENTILADOR",equipo:"EXTRACTORES",area:"Área 300",orden:"103043302",est:"pendiente",reg:null,enDia:false},
  {id:"T27",cat:"Área 221",codigo:"AR00-PPP-CIL-221AG-00105-AGI01",tarea:"Cambio aceite de Reductores",equipo:"AGITADOR",area:"Área 221",orden:"103030413",est:"pendiente",reg:null,enDia:false},
  {id:"T28",cat:"Área 221",codigo:"AR00-PPP-CIL-221AG-00105-AGI01",tarea:"Cambio de filtros de venteo",equipo:"AGITADOR",area:"Área 221",orden:"103030413",est:"pendiente",reg:null,enDia:false},
  {id:"T29",cat:"Área 221",codigo:"AR00-PPP-CIL-221AG-00106-AGI01",tarea:"Cambio aceite de Reductores",equipo:"AGITADOR",area:"Área 221",orden:"103030416",est:"pendiente",reg:null,enDia:false},
  {id:"T30",cat:"Área 221",codigo:"AR00-PPP-CIL-221AG-00106-AGI01",tarea:"Cambio de filtros de venteo",equipo:"AGITADOR",area:"Área 221",orden:"103030416",est:"pendiente",reg:null,enDia:false},
  {id:"T31",cat:"Área 221",codigo:"AR00-PPP-CIL-221AG-00107-AGI01",tarea:"Cambio aceite de Reductores",equipo:"AGITADOR",area:"Área 221",orden:"103031834",est:"pendiente",reg:null,enDia:false},
  {id:"T32",cat:"Área 221",codigo:"AR00-PPP-CIL-221AG-00107-AGI01",tarea:"Cambio de filtros de venteo",equipo:"AGITADOR",area:"Área 221",orden:"103031834",est:"pendiente",reg:null,enDia:false},
  {id:"T33",cat:"Área 224",codigo:"AR00-PPP-CLA-224AG-00104-AGI01",tarea:"CAMBIO DE ACEITE -REDUCTOR AGITADOR",equipo:"AGITADOR",area:"Área 224",orden:"103030233",est:"pendiente",reg:null,enDia:false},
  {id:"T34",cat:"Área 224",codigo:"AR00-PPP-CLA-224AR",tarea:"LUBRICACION 6 MOTORES",equipo:"CLARIFICACION",area:"Área 224",orden:"103030232",est:"pendiente",reg:null,enDia:false},
  {id:"T35",cat:"Área 250",codigo:"AR00-PPP-CYN-250AG-00101-AGI01",tarea:"LUBRICACION 3 MESES",equipo:"AGITADOR",area:"Área 250",orden:"103034558",est:"pendiente",reg:null,enDia:false},
  {id:"T36",cat:"Área 250",codigo:"AR00-PPP-CYN-250AG-00102-AGI01",tarea:"LUBRICACION 3 MESES",equipo:"AGITADOR",area:"Área 250",orden:"103034560",est:"pendiente",reg:null,enDia:false},
  {id:"T37",cat:"Área 250",codigo:"AR00-PPP-CYN-250AG-00103-AGI01",tarea:"LUBRICACION 3 MESES",equipo:"AGITADOR",area:"Área 250",orden:"103034562",est:"pendiente",reg:null,enDia:false},
  {id:"T38",cat:"Área 250",codigo:"AR00-PPP-CYN-250MV-00101-OVC01",tarea:"Lubricacion equipos de izaje 17 sem",equipo:"PUENTE GRUA",area:"Área 250",orden:"103034661",est:"pendiente",reg:null,enDia:false},
  {id:"T39",cat:"Área 222",codigo:"AR00-PPP-ELU-222BD-00101-PUM01",tarea:"LUBRICACION MENSUAL",equipo:"BOMBA",area:"Área 222",orden:"103074914",est:"pendiente",reg:null,enDia:false},
  {id:"T40",cat:"Área 222",codigo:"AR00-PPP-ELU-222BD-00102-PUM01",tarea:"LUBRICACION MENSUAL",equipo:"BOMBA",area:"Área 222",orden:"103074915",est:"pendiente",reg:null,enDia:false},
  {id:"T41",cat:"Área 222",codigo:"AR00-PPP-ELU-222BD-00103-PUM01",tarea:"LUBRICACION MENSUAL",equipo:"BOMBA",area:"Área 222",orden:"103074916",est:"pendiente",reg:null,enDia:false},
  {id:"T42",cat:"Área 215",codigo:"AR00-PPP-LEA-215AG",tarea:"LUBRICACION 6 MOTORES",equipo:"AGITADOR TANQUE LIXIVIACION",area:"Área 215",orden:"103047437",est:"pendiente",reg:null,enDia:false},
  {id:"T43",cat:"Área 215",codigo:"AR00-PPP-LEA-215AG-00101-AGI01",tarea:"LUBRICACION MENSUAL DE AGITADOR",equipo:"AGITADOR",area:"Área 215",orden:"103078809",est:"pendiente",reg:null,enDia:false},
  {id:"T44",cat:"Área 215",codigo:"AR00-PPP-LEA-215AG-00102-AGI01",tarea:"LUBRICACION MENSUAL DE AGITADOR",equipo:"AGITADOR",area:"Área 215",orden:"103078810",est:"pendiente",reg:null,enDia:false},
  {id:"T45",cat:"Área 215",codigo:"AR00-PPP-LEA-215AG-00103-AGI01",tarea:"LUBRICACION MENSUAL DE AGITADOR",equipo:"AGITADOR",area:"Área 215",orden:"103078811",est:"pendiente",reg:null,enDia:false},
  {id:"T46",cat:"Área 215",codigo:"AR00-PPP-LEA-215AG-00104-AGI01",tarea:"LUBRICACION MENSUAL DE AGITADOR",equipo:"AGITADOR",area:"Área 215",orden:"103078812",est:"pendiente",reg:null,enDia:false},
  {id:"T47",cat:"Área 215",codigo:"AR00-PPP-LEA-215AG-00105-AGI01",tarea:"Cambio aceite de Reductores",equipo:"AGITADOR",area:"Área 215",orden:"103030407",est:"pendiente",reg:null,enDia:false},
  {id:"T48",cat:"Área 215",codigo:"AR00-PPP-LEA-215AG-00105-AGI01",tarea:"Cambio de filtros de venteo",equipo:"AGITADOR",area:"Área 215",orden:"103030407",est:"pendiente",reg:null,enDia:false},
  {id:"T49",cat:"Área 215",codigo:"AR00-PPP-LEA-215AG-00105-AGI01",tarea:"LUBRICACION MENSUAL DE AGITADOR",equipo:"AGITADOR",area:"Área 215",orden:"103078813",est:"pendiente",reg:null,enDia:false},
  {id:"T50",cat:"Área 215",codigo:"AR00-PPP-LEA-215AG-00106-AGI01",tarea:"Cambio aceite de Reductores",equipo:"AGITADOR",area:"Área 215",orden:"103030408",est:"pendiente",reg:null,enDia:false},
  {id:"T51",cat:"Área 215",codigo:"AR00-PPP-LEA-215AG-00106-AGI01",tarea:"Cambio de filtros de venteo",equipo:"AGITADOR",area:"Área 215",orden:"103030408",est:"pendiente",reg:null,enDia:false},
  {id:"T52",cat:"Área 215",codigo:"AR00-PPP-LEA-215AG-00106-AGI01",tarea:"LUBRICACION MENSUAL DE AGITADOR",equipo:"AGITADOR",area:"Área 215",orden:"103078814",est:"pendiente",reg:null,enDia:false},
  {id:"T53",cat:"Área 215",codigo:"AR00-PPP-LEA-215BD",tarea:"LUBRICACION 5 MOTORES",equipo:"BOMBA DE PISO",area:"Área 215",orden:"103047438",est:"pendiente",reg:null,enDia:false},
  {id:"T54",cat:"Área 215",codigo:"AR00-PPP-LEA-215BD-00101-PUM01",tarea:"LUBRICACION MENSUAL",equipo:"BOMBA",area:"Área 215",orden:"103074983",est:"pendiente",reg:null,enDia:false},
  {id:"T55",cat:"Área 215",codigo:"AR00-PPP-LEA-215BD-00102-PUM01",tarea:"LUBRICACION MENSUAL",equipo:"BOMBA",area:"Área 215",orden:"103074984",est:"pendiente",reg:null,enDia:false},
  {id:"T56",cat:"Área 215",codigo:"AR00-PPP-LEA-215BD-00103-PUM01",tarea:"LUBRICACION MENSUAL",equipo:"BOMBA",area:"Área 215",orden:"103074985",est:"pendiente",reg:null,enDia:false},
  {id:"T57",cat:"Área 215",codigo:"AR00-PPP-LEA-215BD-00104-PUM01",tarea:"LUBRICACION MENSUAL",equipo:"BOMBA",area:"Área 215",orden:"103074986",est:"pendiente",reg:null,enDia:false},
  {id:"T58",cat:"Área 215",codigo:"AR00-PPP-LEA-215BD-00105-PUM01",tarea:"LUBRICACION MENSUAL",equipo:"BOMBA",area:"Área 215",orden:"103074987",est:"pendiente",reg:null,enDia:false},
  {id:"T59",cat:"Área 215",codigo:"AR00-PPP-LEA-215BD-00106",tarea:"LUBRICACION MENSUAL",equipo:"BOMBA DE PISO No6 CCD3",area:"Área 215",orden:"103074988",est:"pendiente",reg:null,enDia:false},
  {id:"T60",cat:"Área 215",codigo:"AR00-PPP-LEA-215BP",tarea:"LUBRICACION 5 MOTORES",equipo:"BOMBA DE PULPA",area:"Área 215",orden:"103051224",est:"pendiente",reg:null,enDia:false},
  {id:"T61",cat:"Área 215",codigo:"AR00-PPP-LEA-215BS",tarea:"VERIFIC. NIVEL ACEITE",equipo:"BOMBA DE DESBORDE ESPESADOR",area:"Área 215",orden:"205275687",est:"pendiente",reg:null,enDia:false},
  {id:"T62",cat:"Área 215",codigo:"AR00-PPP-LEA-215BW",tarea:"VERIFIC. NIVEL ACEITE",equipo:"BOMBA DE AGUA",area:"Área 215",orden:"205275686",est:"pendiente",reg:null,enDia:false},
  {id:"T63",cat:"Área 211",codigo:"AR00-PPP-MIL-211BP",tarea:"LUBRICACION 4 MOTORES",equipo:"BOMBA ALIMENTACION CICLONES",area:"Área 211",orden:"103047477",est:"pendiente",reg:null,enDia:false},
  {id:"T64",cat:"Área 211",codigo:"AR00-PPP-MIL-211ZL-00101",tarea:"ANALISIS DE ACEITE",equipo:"ZARANDA DESECHOS No1",area:"Área 211",orden:"103076338",est:"pendiente",reg:null,enDia:false},
  {id:"T65",cat:"Área 211",codigo:"AR00-PPP-PRE-225AR",tarea:"LUBRICACION VALVULAS AREA 225",equipo:"PRECIPITACION CON ZINC",area:"Área 211",orden:"103034525",est:"pendiente",reg:null,enDia:false},
  {id:"T66",cat:"Área 211",codigo:"AR00-PPP-PRE-225BS",tarea:"VERIFIC. NIVEL ACEITE",equipo:"BOMBA SOLUCION",area:"Área 211",orden:"205278259",est:"pendiente",reg:null,enDia:false},
  {id:"T67",cat:"Área 211",codigo:"AR00-PPP-PRE-225BS-00001",tarea:"CAMBIO DE ACEITE BOMBA BS",equipo:"BOMBA DISOLUCION No1",area:"Área 211",orden:"103034526",est:"pendiente",reg:null,enDia:false},
  {id:"T68",cat:"Área 211",codigo:"AR00-PPP-PRE-225BS-00102",tarea:"CAMBIO DE ACEITE BOMBA BS",equipo:"BOMBA SOLUCION No2",area:"Área 211",orden:"103034527",est:"pendiente",reg:null,enDia:false},
  {id:"T69",cat:"Área 211",codigo:"AR00-PPP-PRE-225BS-00103",tarea:"CAMBIO DE ACEITE BOMBA BS",equipo:"BOMBA DE SOLUCION DESAIREADA No3",area:"Área 211",orden:"103034528",est:"pendiente",reg:null,enDia:false},
  {id:"T70",cat:"Área 211",codigo:"AR00-PPP-PRE-225BS-00104",tarea:"CAMBIO DE ACEITE BOMBA BS",equipo:"BOMBA DE SOLUCION DESAIREADA No4",area:"Área 211",orden:"103034529",est:"pendiente",reg:null,enDia:false},
  {id:"T71",cat:"Área 211",codigo:"AR00-PPP-PRE-225BS-00105",tarea:"CAMBIO DE ACEITE BOMBA BS",equipo:"BOMBA DE SOLUCION DESAIREADA No5",area:"Área 211",orden:"103034530",est:"pendiente",reg:null,enDia:false},
  {id:"T72",cat:"Área 240",codigo:"AR00-PPP-REH-240AR",tarea:"LUBRICACION VALVULAS",equipo:"REACTIVOS/PTA CAL/PREP CIANURO",area:"Área 240",orden:"103034477",est:"pendiente",reg:null,enDia:false},
  {id:"T73",cat:"Área 240",codigo:"AR00-PPP-REH-240BS",tarea:"VERIFIC. NIVEL ACEITE",equipo:"BOMBA SOLUCION",area:"Área 240",orden:"205278320",est:"pendiente",reg:null,enDia:false},
  {id:"T74",cat:"Área 240",codigo:"AR00-PPP-REH-240DO",tarea:"VERIFIC. NIVEL ACEITE",equipo:"BOMBA DOSIFICACION",area:"Área 240",orden:"205275696",est:"pendiente",reg:null,enDia:false},
  {id:"T75",cat:"Área 240",codigo:"AR00-PPP-REH-240EA-00101-FPN01",tarea:"RENOVAR CARTUCHO LUBR AUTOMATICO",equipo:"FILTRO",area:"Área 240",orden:"103034634",est:"pendiente",reg:null,enDia:false},
  {id:"T76",cat:"Área 240",codigo:"AR00-PPP-REH-240PG-00104-OVC01",tarea:"Lubricacion equipos de izaje 17 sem",equipo:"PUENTE GRUA",area:"Área 240",orden:"103034655",est:"pendiente",reg:null,enDia:false},
  {id:"T77",cat:"Área 240",codigo:"AR00-PPP-REH-240PG-00106-OVC01",tarea:"Lubricacion equipos de izaje 17 sem",equipo:"PUENTE GRUA",area:"Área 240",orden:"103034633",est:"pendiente",reg:null,enDia:false},
  {id:"T78",cat:"Área 312",codigo:"AR00-PPP-PRW-312BW",tarea:"VERIFIC. NIVEL ACEITE",equipo:"BOMBA DE AGUA",area:"Área 312",orden:"205278316",est:"pendiente",reg:null,enDia:false},
  {id:"T79",cat:"Área 312",codigo:"AR00-PPP-PRW-314BW",tarea:"VERIFIC. NIVEL ACEITE",equipo:"BOMBA DE AGUA",area:"Área 312",orden:"205278317",est:"pendiente",reg:null,enDia:false},
  {id:"T80",cat:"Área 312",codigo:"AR00-PPP-POW-316BW",tarea:"VERIFIC. NIVEL ACEITE",equipo:"BOMBA DE AGUA",area:"Área 312",orden:"205278318",est:"pendiente",reg:null,enDia:false},
  {id:"T81",cat:"Área 312",codigo:"AR00-PPP-TAI-231AR",tarea:"VERIFIC. NIVEL ACEITE",equipo:"AREA DE COLAS",area:"Área 312",orden:"205275684",est:"pendiente",reg:null,enDia:false},
  {id:"T82",cat:"Área 231",codigo:"AR00-PPP-TAI-231BD-00101-PUM01",tarea:"LUBRICACION MENSUAL",equipo:"BOMBA",area:"Área 231",orden:"103076339",est:"pendiente",reg:null,enDia:false},
  {id:"T83",cat:"Área 231",codigo:"AR00-PPP-TAI-231BD-00201-PUM01",tarea:"LUBRICACION MENSUAL",equipo:"BOMBA",area:"Área 231",orden:"103076340",est:"pendiente",reg:null,enDia:false},
  {id:"T84",cat:"Prev. Semanal",codigo:"AR00-PPP-CRU-202AF-00101-FEE01",tarea:"LUBRICACION SEMANAL",equipo:"ALIMENTADOR",area:"Planta",orden:"103087633",est:"pendiente",reg:null,enDia:false},
  {id:"T85",cat:"Prev. Semanal",codigo:"AR00-PPP-CRU-202GV-00101",tarea:"LUBRICACION CARDAN Y RODAM. 50HRS",equipo:"GRILLA VIBRATORIA No1",area:"Planta",orden:"103087505",est:"pendiente",reg:null,enDia:false},
  {id:"T86",cat:"Prev. Semanal",codigo:"AR00-PPP-CRU-202JC-00101-STR01",tarea:"LUBRICACION 12 HRAS JC101",equipo:"ESTRUCTURA",area:"Planta",orden:"103087602",est:"pendiente",reg:null,enDia:false},
  {id:"T87",cat:"Prev. Semanal",codigo:"AR00-PPP-CRU-202RB-00101-STR01",tarea:"LUBR DE ALEMITES SEC. PICA ROCA  72HRS",equipo:"ESTRUCTURA",area:"Planta",orden:"103087612",est:"pendiente",reg:null,enDia:false},
  {id:"T88",cat:"Prev. Semanal",codigo:"AR00-PPP-CRU-202RB-00101-STR01",tarea:"LUBR DE ALEMITES PRINC PICA ROCA  12HRS",equipo:"ESTRUCTURA",area:"Planta",orden:"103087612",est:"pendiente",reg:null,enDia:false},
  {id:"T89",cat:"Prev. Semanal",codigo:"AR00-PPP-CRU-204AR",tarea:"RECORRIDA SEMANAL DE LUBRICACION TRITU",equipo:"SECUNDARIA / TERCIARIA",area:"Planta",orden:"103087632",est:"pendiente",reg:null,enDia:false},
  {id:"T90",cat:"Prev. Semanal",codigo:"AR00-PPP-CRU-204SL-00101-LUS01",tarea:"VERIFICAR Y COMPLETAR NIVEL ACEITE SEM",equipo:"SISTEMA DE LUBRICACION",area:"Planta",orden:"205288723",est:"pendiente",reg:null,enDia:false},
  {id:"T91",cat:"Prev. Semanal",codigo:"AR00-PPP-CRU-204SL-00102-LUS01",tarea:"VERIFICAR Y COMPLETAR NIVEL ACEITE SEM",equipo:"SISTEMA DE LUBRICACION",area:"Planta",orden:"205288724",est:"pendiente",reg:null,enDia:false},
  {id:"T92",cat:"Prev. Semanal",codigo:"AR00-PPP-CRU-204TC-00101-STR01",tarea:"LUBRICACION SEMANAL TRITURADOR CONICO",equipo:"ESTRUCTURA",area:"Planta",orden:"103087616",est:"pendiente",reg:null,enDia:false},
  {id:"T93",cat:"Prev. Semanal",codigo:"AR00-PPP-CRU-204TC-00102-STR01",tarea:"LUBRICACION SEMANAL TRITURADOR CONICO",equipo:"ESTRUCTURA",area:"Planta",orden:"103087617",est:"pendiente",reg:null,enDia:false},
  {id:"T94",cat:"Prev. Semanal",codigo:"AR00-PPP-CRU-204ZV-00101-VIB01",tarea:"LUBRICACION DIARIA ZARANDA",equipo:"VIBRADOR / ZARANDA",area:"Planta",orden:"103087603",est:"pendiente",reg:null,enDia:false},
  {id:"T95",cat:"Prev. Semanal",codigo:"AR00-PPP-CRU-204ZV-00102-VIB01",tarea:"LUBR.DIARIA RODAM & CARDAN",equipo:"VIBRADOR / ZARANDA",area:"Planta",orden:"103087604",est:"pendiente",reg:null,enDia:false},
  {id:"T96",cat:"Prev. Semanal",codigo:"AR00-PPP-CRU-206CT-00101",tarea:"LUBR. SEMANAL SIST GIRO STAKER",equipo:"CINTA TRANSPORTADORA APILADOR No1",area:"Planta",orden:"103087618",est:"pendiente",reg:null,enDia:false},
  {id:"T97",cat:"Prev. Semanal",codigo:"AR00-PPP-CRU-206RL-00101-STR01",tarea:"LUBR. SEMANAL RECUPERADOR MINERAL",equipo:"ESTRUCTURA",area:"Planta",orden:"103087646",est:"pendiente",reg:null,enDia:false},
  {id:"T98",cat:"Tritu. Motores",codigo:"AR00-PPP-CRU-202JC-00101-MOT01",tarea:"LUBRICACION MOTOR  PRINCIPAL-14 DIAS",equipo:"MOTOR SIST HIDR TRITURADOR MANDI",area:"Trituracion",orden:"103080150",est:"pendiente",reg:null,enDia:false},
  {id:"T99",cat:"Tritu. Motores",codigo:"AR00-PPP-CRU-204TC-00101-MOT01",tarea:"LUBRICACION MOTOR  PRINCIPAL-14 DIAS",equipo:"MOTOR PRINCIP TRITURADOR CONO SEC",area:"Trituracion",orden:"103080147",est:"pendiente",reg:null,enDia:false},
  {id:"T100",cat:"Tritu. Motores",codigo:"AR00-PPP-CRU-204TC-00102-MOT01",tarea:"LUBRICACION MOTOR  PRINCIPAL-14 DIAS",equipo:"MOTOR PPAL TRIT CONO TERC",area:"Trituracion",orden:"103080148",est:"pendiente",reg:null,enDia:false},
  {id:"T101",cat:"Tritu. Rodam.",codigo:"AR00-PPP-CRU-204BF-00103-FEE01",tarea:"LUBRICACION RODAMIENTOS MENSUAL",equipo:"ALIMENTADOR",area:"Trituracion",orden:"103080018",est:"pendiente",reg:null,enDia:false},
  {id:"T102",cat:"Tritu. Rodam.",codigo:"AR00-PPP-CRU-204CT-00104",tarea:"LUBRICACION RODAMIENTOS MENSUAL",equipo:"CINTA TRANSP ALIMENT ZARANDA SECUND No4",area:"Trituracion",orden:"103080207",est:"pendiente",reg:null,enDia:false},
  {id:"T103",cat:"Tritu. Rodam.",codigo:"AR00-PPP-CRU-204CT-00105",tarea:"LUBRICACION RODAMIENTOS MENSUAL",equipo:"CINTA TRANSP PRODUCTO TRITURADO No5",area:"Trituracion",orden:"103080019",est:"pendiente",reg:null,enDia:false},
  {id:"T104",cat:"Tritu. Rodam.",codigo:"AR00-PPP-CRU-206CT-00101",tarea:"LUBRICACION RODAMIENTOS MENSUAL",equipo:"CINTA TRANSPORTADORA APILADOR No1",area:"Trituracion",orden:"103080072",est:"pendiente",reg:null,enDia:false},
  {id:"T105",cat:"Tritu. Rodam.",codigo:"AR00-PPP-CRU-206CT-00102",tarea:"LUBRICACION RODAMIENTOS MENSUAL",equipo:"CINTA TRANSPORTADORA DE MINERAL FINO No2",area:"Trituracion",orden:"103080073",est:"pendiente",reg:null,enDia:false},
  {id:"T106",cat:"Tritu. Central",codigo:"AR00-PPP-CRU-204SH-00101-HYS01",tarea:"ANALISIS DE ACEITE MENSUAL SIST HIDRA",equipo:"SISTEMA HIDRAULICO",area:"Trituracion",orden:"205271214",est:"pendiente",reg:null,enDia:false},
  {id:"T107",cat:"Tritu. Central",codigo:"AR00-PPP-CRU-204SL-00102-LUS01",tarea:"ANALISIS DE ACEITE MENSUAL SIST LUBR",equipo:"SISTEMA DE LUBRICACION",area:"Trituracion",orden:"103080069",est:"pendiente",reg:null,enDia:false},
  {id:"T108",cat:"Tritu. Motores",codigo:"AR00-PPP-CRU-204ZV-00101-MOT01",tarea:"LUBRICACION MOTOR - 18 SEM",equipo:"MOTOR ZARANDA VIBRATORIA PRIMARIA",area:"Trituracion",orden:"103023620",est:"pendiente",reg:null,enDia:false},
  {id:"T109",cat:"Tritu. Motores",codigo:"AR00-PPP-CRU-204ZV-00102-MOT01",tarea:"LUBRICACION MOTOR - 18 SEM",equipo:"MOTOR ZARANDA VIBRATORIA SECUNDARIA",area:"Trituracion",orden:"103023641",est:"pendiente",reg:null,enDia:false},
  {id:"T110",cat:"Tritu. Análisis",codigo:"AR00-PPP-CRU-204BF-00102-FEE01",tarea:"CAMBIO DE ACEITE 3 MESES",equipo:"ALIMENTADOR",area:"Trituracion",orden:"103056264",est:"pendiente",reg:null,enDia:false},
  {id:"T111",cat:"Tritu. Análisis",codigo:"AR00-PPP-CRU-202RB-00101-STR01",tarea:"ANALISIS ACEITE CENTRAL HIDR",equipo:"ESTRUCTURA",area:"Trituracion",orden:"205271277",est:"pendiente",reg:null,enDia:false},
  {id:"T112",cat:"Tritu. Análisis",codigo:"AR00-PPP-CRU-202RB-00101-STR01",tarea:"CAMBIO DE FILTROS",equipo:"ESTRUCTURA",area:"Trituracion",orden:"205271277",est:"pendiente",reg:null,enDia:false},
  {id:"T113",cat:"Tritu. Análisis",codigo:"AR00-PPP-CRU-203CT-00101",tarea:"ANALISIS MENSUAL DE ACEITE REDUCTOR",equipo:"CINTA TRANSPORTADORA No1",area:"Trituracion",orden:"205271213",est:"pendiente",reg:null,enDia:false},
  {id:"T114",cat:"Tritu. Análisis",codigo:"AR00-PPP-CRU-206CT-00101-GEA02",tarea:"ANALISIS MENSUAL DE ACEITE REDUCTOR",equipo:"REDUCTOR",area:"Trituracion",orden:"205271252",est:"pendiente",reg:null,enDia:false},
  {id:"T115",cat:"Tritu. Análisis",codigo:"AR00-PPP-CRU-202AF-00101-GEA01",tarea:"CAMBIO DE ACEITE",equipo:"REDUCTOR",area:"Trituracion",orden:"103056361",est:"pendiente",reg:null,enDia:false},
  {id:"T116",cat:"Tritu. Análisis",codigo:"AR00-PPP-CRU-204CT-00105",tarea:"CAMBIO DE ACEITE 3 MESES",equipo:"CINTA TRANSP PRODUCTO TRITURADO No5",area:"Trituracion",orden:"205271270",est:"pendiente",reg:null,enDia:false},
  {id:"T117",cat:"Prev. Semanal",codigo:"AR00-PPP-HPL-920TC-00201-STR01",tarea:"LIMPIEZA/CAMBIO FILTRO DE AIRE",equipo:"TRITURADOR CONICO SECUNDARIO",area:"Planta",orden:"103087627",est:"pendiente",reg:null,enDia:false},
  {id:"T118",cat:"Prev. Semanal",codigo:"AR00-PPP-HPL-920TC-00202-STR01",tarea:"LIMPIEZA/CAMBIO FILTRO DE AIRE",equipo:"TRITURADOR CONICO TERCIARIO",area:"Planta",orden:"103087628",est:"pendiente",reg:null,enDia:false},
  {id:"T119",cat:"Prev. Semanal",codigo:"AR00-PPP-HPL-910RB-00501-STR01",tarea:"LUBR DE ALEMITES PRINC PICA ROCA  12HRS",equipo:"PICARROCA SANDVIK BB 7600",area:"Planta",orden:"103087623",est:"pendiente",reg:null,enDia:false},
  {id:"T120",cat:"Prev. Semanal",codigo:"AR00-PPP-HPL-910RB-00502-STR01",tarea:"LUBR DE ALEMITES PRINC PICA ROCA  12HRS",equipo:"PICARROCA SANDVIK BB 285",area:"Planta",orden:"103087462",est:"pendiente",reg:null,enDia:false},
  {id:"T121",cat:"Prev. Semanal",codigo:"AR00-PPP-HPL-910RB-00501-STR01",tarea:"LUBR DE ALEMITES SEC. PICA ROCA  72HRS",equipo:"PICARROCA SANDVIK BB 7600",area:"Planta",orden:"103087623",est:"pendiente",reg:null,enDia:false},
  {id:"T122",cat:"Prev. Semanal",codigo:"AR00-PPP-HPL-910RB-00502-STR01",tarea:"LUBR DE ALEMITES SEC. PICA ROCA  72HRS",equipo:"PICARROCA SANDVIK BB 285",area:"Planta",orden:"103087462",est:"pendiente",reg:null,enDia:false},
  {id:"T123",cat:"Prev. Semanal",codigo:"AR00-PPP-HPL-930CT-00109",tarea:"LUBR. SEMANAL SIST GIRO STAKER",equipo:"CINTA TRANSPORTADORA",area:"Planta",orden:"103087658",est:"pendiente",reg:null,enDia:false},
  {id:"T124",cat:"Prev. Semanal",codigo:"AR00-PPP-HPL-910JC-00201",tarea:"LUBRICACION DIARIA TRIT. PRIMARIO",equipo:"TRITURADOR DE MANDIBULAS",area:"Planta",orden:"103087626",est:"pendiente",reg:null,enDia:false},
  {id:"T125",cat:"Prev. Semanal",codigo:"AR00-PPP-HPL-920ZV-00301-VIB01",tarea:"LUBRICACION DIARIA ZARANDA VIBRATORIA",equipo:"ZARANDA SECUNDARIA",area:"Planta",orden:"103087629",est:"pendiente",reg:null,enDia:false},
  {id:"T126",cat:"Prev. Semanal",codigo:"AR00-PPP-HPL-920ZV-00302-VIB01",tarea:"LUBRICACION DIARIA ZARANDA VIBRATORIA",equipo:"ZARANDA TERCIARIA",area:"Planta",orden:"103087631",est:"pendiente",reg:null,enDia:false},
  {id:"T127",cat:"Prev. Semanal",codigo:"AR00-PPP-HPL-910HF-00401",tarea:"LUBRICACION SEMANAL",equipo:"ALIMENTADOR DE PLACAS",area:"Planta",orden:"103087624",est:"pendiente",reg:null,enDia:false},
  {id:"T128",cat:"Prev. Semanal",codigo:"AR00-PPP-HPL-920TC-00201-STR01",tarea:"LUBRICACION SEMANAL",equipo:"TRITURADOR CONICO SECUNDARIO",area:"Planta",orden:"103087627",est:"pendiente",reg:null,enDia:false},
  {id:"T129",cat:"Prev. Semanal",codigo:"AR00-PPP-HPL-920TC-00202-STR01",tarea:"LUBRICACION SEMANAL",equipo:"TRITURADOR CONICO TERCIARIO",area:"Planta",orden:"103087628",est:"pendiente",reg:null,enDia:false},
  {id:"T130",cat:"Prev. Semanal",codigo:"AR00-PPP-HPL-910AR",tarea:"RECORRIDA SEMANAL LUBRICACION H.L",equipo:"",area:"Planta",orden:"205288720",est:"pendiente",reg:null,enDia:false},
  {id:"T131",cat:"Prev. Semanal",codigo:"AR00-PPP-HPL-910GV-00301",tarea:"VERIFICACION DE NIVEL DE ACEITE SEMANAL",equipo:"ZARANDA PARRILLA - GRIZZLY",area:"Planta",orden:"103087625",est:"pendiente",reg:null,enDia:false},
  {id:"T132",cat:"Prev. Semanal",codigo:"AR00-PPP-HPL-920ZV-00301-VIB01",tarea:"VERIFICACION DE NIVEL DE ACEITE SEMANAL",equipo:"ZARANDA SECUNDARIA",area:"Planta",orden:"205288688",est:"pendiente",reg:null,enDia:false},
  {id:"T133",cat:"Prev. Semanal",codigo:"AR00-PPP-HPL-920ZV-00302-VIB01",tarea:"VERIFICACION DE NIVEL DE ACEITE SEMANAL",equipo:"ZARANDA TERCIARIA",area:"Planta",orden:"205288689",est:"pendiente",reg:null,enDia:false},
  {id:"T134",cat:"Prev. Semanal",codigo:"AR00-PPP-HPL-940BS",tarea:"VERIFICACION SEMANA NIVEL ACEITE BOMBAS",equipo:"",area:"Planta",orden:"103087500",est:"pendiente",reg:null,enDia:false},
  {id:"T135",cat:"Heap – Cintas",codigo:"AR00-PPP-HPL-930TF-00405-FEE01",tarea:"LUBRICACION DE TORNILLO",equipo:"ALIMENTADOR A TORNILLO DE CEMENTO",area:"Heap Leaching",orden:"103083644",est:"pendiente",reg:null,enDia:false},
  {id:"T136",cat:"Heap – Cintas",codigo:"AR00-PPP-HPL-930TF-00406-FEE01",tarea:"LUBRICACION DE TORNILLO",equipo:"ALIMENTADOR A TORNILLO DE CEMENTO",area:"Heap Leaching",orden:"103083643",est:"pendiente",reg:null,enDia:false},
  {id:"T137",cat:"Heap – Cintas",codigo:"AR00-PPP-HPL-910CT-00101",tarea:"LUBRICACION RODAMIENTOS MENSUAL",equipo:"CINTA TRANSPORTADORA",area:"Heap Leaching",orden:"103080047",est:"pendiente",reg:null,enDia:false},
  {id:"T138",cat:"Heap – Cintas",codigo:"AR00-PPP-HPL-920BF-00402-FEE01",tarea:"LUBRICACION RODAMIENTOS MENSUAL",equipo:"BELT FEEDER",area:"Heap Leaching",orden:"103080055",est:"pendiente",reg:null,enDia:false},
  {id:"T139",cat:"Heap – Cintas",codigo:"AR00-PPP-HPL-920BF-00403-FEE01",tarea:"LUBRICACION RODAMIENTOS MENSUAL",equipo:"BELT FEEDER",area:"Heap Leaching",orden:"103080103",est:"pendiente",reg:null,enDia:false},
  {id:"T140",cat:"Heap – Cintas",codigo:"AR00-PPP-HPL-920CT-00102",tarea:"LUBRICACION RODAMIENTOS MENSUAL",equipo:"CINTA TRANSPORTADORA",area:"Heap Leaching",orden:"103080126",est:"pendiente",reg:null,enDia:false},
  {id:"T141",cat:"Heap – Cintas",codigo:"AR00-PPP-HPL-920CT-00103",tarea:"LUBRICACION RODAMIENTOS MENSUAL",equipo:"CINTA TRANSPORTADORA",area:"Heap Leaching",orden:"103080054",est:"pendiente",reg:null,enDia:false},
  {id:"T142",cat:"Heap – Cintas",codigo:"AR00-PPP-HPL-920CT-00104",tarea:"LUBRICACION RODAMIENTOS MENSUAL",equipo:"CINTA TRANSPORTADORA",area:"Heap Leaching",orden:"103080127",est:"pendiente",reg:null,enDia:false},
  {id:"T143",cat:"Heap – Cintas",codigo:"AR00-PPP-HPL-920MU-00554-SAM01",tarea:"LUBRICACION RODAMIENTOS MENSUAL",equipo:"CORTADOR DE MUESTRAS PRIMARIO",area:"Heap Leaching",orden:"103080105",est:"pendiente",reg:null,enDia:false},
  {id:"T144",cat:"Heap – Cintas",codigo:"AR00-PPP-HPL-930CT-00109",tarea:"LUBRICACION RODAMIENTOS MENSUAL",equipo:"CINTA TRANSPORTADORA",area:"Heap Leaching",orden:"103080123",est:"pendiente",reg:null,enDia:false},
  {id:"T145",cat:"Tritu. Central",codigo:"AR00-PPP-HPL-920SL-00202-LUS01",tarea:"CAMBIO DE ACEITE LUBR+FILTROS",equipo:"SISTEMA DE LUBRICACION",area:"Trituracion",orden:"103082539",est:"pendiente",reg:null,enDia:false},
  {id:"T146",cat:"Tritu. Central",codigo:"AR00-PPP-HPL-920SH-00201-HYS01",tarea:"CAMBIO DE ACEITE HIDR.-FILTROS",equipo:"SISTEMA HIDRAULICO",area:"Trituracion",orden:"",est:"pendiente",reg:null,enDia:false},
  {id:"T147",cat:"Heap – Análisis",codigo:"AR00-PPP-HPL-910RB-00501-HYS01",tarea:"ANALISIS MENSUAL",equipo:"SISTEMA HIDRAULICO",area:"Heap Leaching",orden:"103072508",est:"pendiente",reg:null,enDia:false},
  {id:"T148",cat:"Heap – Análisis",codigo:"AR00-PPP-HPL-920BF-00402-FEE01",tarea:"ANALISIS MENSUAL DE ACEITE REDUCTOR",equipo:"ALIMENTADOR",area:"Heap Leaching",orden:"103073100",est:"pendiente",reg:null,enDia:false},
  {id:"T149",cat:"Heap – Análisis",codigo:"AR00-PPP-HPL-920CT-00102",tarea:"ANALISIS MENSUAL DE ACEITE REDUCTOR",equipo:"CINTA TRANSPORTADORA No2",area:"Heap Leaching",orden:"103076387",est:"pendiente",reg:null,enDia:false},
  {id:"T150",cat:"Heap – Análisis",codigo:"AR00-PPP-HPL-920CT-00105",tarea:"ANALISIS MENSUAL DE ACEITE REDUCTOR",equipo:"CINTA TRANSPORTADORA No5",area:"Heap Leaching",orden:"205273798",est:"pendiente",reg:null,enDia:false},
  {id:"T151",cat:"Heap – Análisis",codigo:"AR00-PPP-HPL-920CT-00107",tarea:"ANALISIS MENSUAL DE ACEITE REDUCTOR",equipo:"CINTA TRANSPORTADORA No7",area:"Heap Leaching",orden:"205273797",est:"pendiente",reg:null,enDia:false},
  {id:"T152",cat:"Heap – Análisis",codigo:"AR00-PPP-HPL-930CT-00108",tarea:"ANALISIS MENSUAL DE ACEITE REDUCTOR",equipo:"CINTA TRANSPORTADORA No8",area:"Heap Leaching",orden:"205278251",est:"pendiente",reg:null,enDia:false},
  {id:"T153",cat:"Heap – Análisis",codigo:"AR00-PPP-HPL-930CT-0109A",tarea:"ANALISIS MENSUAL DE ACEITE REDUCTOR",equipo:"CINTA TRANSPORTADORA A",area:"Heap Leaching",orden:"205278252",est:"pendiente",reg:null,enDia:false},
  {id:"T154",cat:"Heap Móvil",codigo:"AR00-PPP-HPL-935JC-00301",tarea:"LUBRICACION DIARIA PLANTA TRIT. PRIMARIA",equipo:"",area:"Heap Leaching",orden:"103087569",est:"pendiente",reg:null,enDia:false},
  {id:"T155",cat:"Heap Móvil",codigo:"AR00-PPP-HPL-935ZV-00402",tarea:"lubricacion semanal",equipo:"",area:"Heap Leaching",orden:"103087592",est:"pendiente",reg:null,enDia:false},
];

// ─── COLORES CATEGORÍA ────────────────────────────────
const CAT_C = {"Correctiva":"#ef4444","Prev. Semanal":"#3b82f6","Prev. Roster":"#8b5cf6","Móvil":"#22c55e","Área 300":"#f97316","Área 221":"#eab308","Área 224":"#d946ef","Área 250":"#10b981","Área 222":"#0ea5e9","Área 215":"#f43f5e","Área 211":"#6366f1","Área 225":"#a855f7","Área 240":"#f59e0b","Área 312":"#16a34a","Área 231":"#0284c7","Trituración":"#dc2626","Tritu. Motores":"#c026d3","Tritu. Rodam.":"#ea580c","Tritu. Análisis":"#84cc16","Heap Leaching":"#0d9488","Heap – Cintas":"#06b6d4","Heap – Central":"#78716c","Heap – Análisis":"#65a30d","Heap Móvil":"#fb923c"};
const EST_CFG = {
  pendiente:   {label:"Pendiente",   bg:"#1e293b",border:"#334155",text:"#94a3b8",icon:"○"},
  en_proceso:  {label:"En proceso",  bg:"#422006",border:"#92400e",text:"#fbbf24",icon:"◑"},
  completada:  {label:"Completada",  bg:"#052e16",border:"#065f46",text:"#34d399",icon:"●"},
  con_anomalia:{label:"Con anomalía",bg:"#450a0a",border:"#991b1b",text:"#f87171",icon:"⚠"},
};

// ─── HELPERS ──────────────────────────────────────────
function diasRestantes(f){const h=new Date();h.setHours(0,0,0,0);return Math.round((new Date(f+"T00:00:00")-h)/86400000);}
function comprimirFoto(file,maxW=800,q=0.7){return new Promise(res=>{const img=new Image();const url=URL.createObjectURL(file);img.onload=()=>{const r=Math.min(1,maxW/img.width);const c=document.createElement("canvas");c.width=img.width*r;c.height=img.height*r;c.getContext("2d").drawImage(img,0,0,c.width,c.height);res(c.toDataURL("image/jpeg",q));URL.revokeObjectURL(url);};img.src=url;});}
const inp=(T)=>({background:T.inputBg,border:`1px solid ${T.inputBorder}`,borderRadius:8,color:T.text,padding:"8px 11px",fontSize:13,width:"100%",boxSizing:"border-box",outline:"none"});

function Overlay({onClose,children,maxW=540}){return(<div onClick={onClose} style={{position:"fixed",inset:0,background:"rgba(0,0,0,.75)",display:"flex",alignItems:"center",justifyContent:"center",zIndex:500}}><div onClick={e=>e.stopPropagation()} style={{background:"#1e293b",border:"1px solid #334155",borderRadius:16,padding:24,width:"95%",maxWidth:maxW,maxHeight:"90vh",overflowY:"auto",boxShadow:"0 30px 80px rgba(0,0,0,.7)"}}>{children}</div></div>);}

// ─── LOGIN ────────────────────────────────────────────
function LoginScreen({usuarios,onLogin,tema,setTema}){
  const [user,setUser]=useState("");
  const [pass,setPass]=useState("");
  const [err,setErr]=useState("");
  const [show,setShow]=useState(false);
  const T=TEMAS[tema];

  const login=()=>{
    const u=usuarios.find(u=>u.usuario===user.trim().toLowerCase()&&u.password===pass);
    u?(setErr(""),onLogin(u)):setErr("Usuario o contraseña incorrectos");
  };

  return(
    <div style={{fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",minHeight:"100vh",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20,position:"relative",overflow:"hidden",background:"#020817"}}>

      {/* ── FONDO ANIMADO CON HEXÁGONOS Y NEÓN ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&family=IBM+Plex+Sans:wght@400;600;700;800&display=swap');
        *{box-sizing:border-box;}
        input:focus{outline:none!important;}
        .gd-input:focus{border-color:#d4af37!important;box-shadow:0 0 0 3px rgba(212,175,55,.2)!important;}
        @keyframes hexFloat{0%{transform:translateY(0) rotate(0deg);opacity:.15}50%{opacity:.3}100%{transform:translateY(-120vh) rotate(360deg);opacity:0}}
        @keyframes neonPulse{0%,100%{opacity:.4;text-shadow:0 0 10px #d4af37,0 0 30px #d4af37}50%{opacity:1;text-shadow:0 0 20px #d4af37,0 0 60px #d4af37,0 0 100px #ffd700}}
        @keyframes borderGlow{0%,100%{box-shadow:0 0 10px rgba(212,175,55,.3),0 20px 60px rgba(0,0,0,.8)}50%{box-shadow:0 0 25px rgba(212,175,55,.5),0 0 60px rgba(212,175,55,.2),0 20px 60px rgba(0,0,0,.8)}}
        @keyframes fadeUp{from{opacity:0;transform:translateY(30px)}to{opacity:1;transform:translateY(0)}}
        @keyframes rotateSlow{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes lineMove{0%{transform:translateX(-100%)}100%{transform:translateX(100vw)}}
        .gd-card{animation:fadeUp .6s ease forwards,borderGlow 3s ease-in-out infinite;}
        .gd-title{animation:neonPulse 2.5s ease-in-out infinite;}
        .gd-btn:hover{transform:translateY(-2px);box-shadow:0 8px 25px rgba(212,175,55,.5)!important;}
        .gd-btn:active{transform:translateY(0);}
        .hex{position:absolute;width:60px;height:60px;background:none;border:1px solid rgba(212,175,55,.2);clip-path:polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%);animation:hexFloat linear infinite;}
      `}</style>

      {/* Hexágonos flotantes */}
      {[...Array(12)].map((_,i)=>(
        <div key={i} className="hex" style={{
          left:`${(i*17+5)%100}%`,
          bottom:`-${60+i*10}px`,
          width:`${40+i*15}px`,
          height:`${40+i*15}px`,
          animationDuration:`${8+i*2}s`,
          animationDelay:`${i*0.8}s`,
          borderColor:`rgba(212,175,55,${0.1+i*0.02})`,
        }}/>
      ))}

      {/* Líneas de neón horizontales */}
      <div style={{position:"fixed",top:"30%",left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,rgba(212,175,55,.3),transparent)",animation:"lineMove 4s linear infinite"}}/>
      <div style={{position:"fixed",top:"70%",left:0,right:0,height:1,background:"linear-gradient(90deg,transparent,rgba(99,179,237,.2),transparent)",animation:"lineMove 6s linear infinite reverse"}}/>

      {/* Grid geométrico de fondo */}
      <div style={{position:"fixed",inset:0,backgroundImage:"linear-gradient(rgba(212,175,55,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(212,175,55,.04) 1px,transparent 1px)",backgroundSize:"50px 50px",pointerEvents:"none"}}/>

      {/* Selector de tema */}
      <div style={{position:"fixed",top:16,right:16,display:"flex",gap:6,background:"rgba(0,0,0,.5)",border:"1px solid rgba(212,175,55,.3)",borderRadius:8,padding:"3px 4px",backdropFilter:"blur(10px)"}}>
        {Object.keys(TEMAS).map(k=>(
          <button key={k} onClick={()=>setTema(k)} style={{width:24,height:24,borderRadius:6,border:"none",cursor:"pointer",fontSize:11,background:tema===k?"rgba(212,175,55,.3)":"transparent",color:tema===k?"#d4af37":"#64748b"}}>
            {k==="A"?"🌑":k==="B"?"☀️":"🔥"}
          </button>
        ))}
      </div>

      {/* Card principal */}
      <div className="gd-card" style={{width:"100%",maxWidth:400,background:"rgba(2,8,23,.85)",border:"1px solid rgba(212,175,55,.4)",borderRadius:24,padding:"40px 36px",backdropFilter:"blur(20px)",position:"relative",overflow:"hidden"}}>

        {/* Brillo superior */}
        <div style={{position:"absolute",top:0,left:"20%",right:"20%",height:1,background:"linear-gradient(90deg,transparent,rgba(212,175,55,.8),transparent)"}}/>

        {/* Logo y nombre */}
        <div style={{textAlign:"center",marginBottom:36}}>
          {/* Ícono con anillo giratorio */}
          <div style={{position:"relative",width:80,height:80,margin:"0 auto 20px"}}>
            <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"2px solid transparent",borderTopColor:"#d4af37",borderRightColor:"rgba(212,175,55,.3)",animation:"rotateSlow 3s linear infinite"}}/>
            <div style={{position:"absolute",inset:6,borderRadius:"50%",border:"1px solid rgba(212,175,55,.2)"}}>
              <div style={{width:"100%",height:"100%",borderRadius:"50%",background:"linear-gradient(135deg,rgba(212,175,55,.15),rgba(2,8,23,.9))",display:"flex",alignItems:"center",justifyContent:"center",fontSize:28}}>⚙️</div>
            </div>
          </div>

          {/* Gold Dijital */}
          <div className="gd-title" style={{fontFamily:"'Cinzel',serif",fontSize:26,fontWeight:900,color:"#d4af37",letterSpacing:3,lineHeight:1}}>
            GOLD
          </div>
          <div style={{fontFamily:"'Cinzel',serif",fontSize:16,fontWeight:700,color:"rgba(212,175,55,.7)",letterSpacing:6,marginTop:2}}>
            DIJITAL
          </div>
          <div style={{width:60,height:1,background:"linear-gradient(90deg,transparent,#d4af37,transparent)",margin:"12px auto"}}/>
          <div style={{fontSize:11,color:"rgba(148,163,184,.7)",letterSpacing:2,textTransform:"uppercase"}}>
            Sistema de Gestión de Mantenimiento
          </div>
        </div>

        {/* Bienvenido */}
        <div style={{fontSize:13,color:"rgba(212,175,55,.6)",fontWeight:600,letterSpacing:1,marginBottom:20,textAlign:"center"}}>
          BIENVENIDO — INGRESÁ TUS CREDENCIALES
        </div>

        {/* Inputs */}
        <div style={{marginBottom:14}}>
          <div style={{fontSize:10,color:"rgba(212,175,55,.7)",fontWeight:700,letterSpacing:2,marginBottom:6}}>USUARIO</div>
          <input className="gd-input" value={user} onChange={e=>setUser(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="Tu nombre de usuario" autoCapitalize="none"
            style={{width:"100%",background:"rgba(255,255,255,.04)",border:"1px solid rgba(212,175,55,.25)",borderRadius:10,color:"#f8fafc",padding:"11px 14px",fontSize:14,boxSizing:"border-box",outline:"none",transition:"all .2s"}}/>
        </div>
        <div style={{marginBottom:24}}>
          <div style={{fontSize:10,color:"rgba(212,175,55,.7)",fontWeight:700,letterSpacing:2,marginBottom:6}}>CONTRASEÑA</div>
          <div style={{position:"relative"}}>
            <input className="gd-input" type={show?"text":"password"} value={pass} onChange={e=>setPass(e.target.value)} onKeyDown={e=>e.key==="Enter"&&login()} placeholder="········"
              style={{width:"100%",background:"rgba(255,255,255,.04)",border:"1px solid rgba(212,175,55,.25)",borderRadius:10,color:"#f8fafc",padding:"11px 44px 11px 14px",fontSize:14,boxSizing:"border-box",outline:"none",transition:"all .2s"}}/>
            <button onClick={()=>setShow(p=>!p)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer",color:"rgba(212,175,55,.5)",fontSize:16}}>{show?"🙈":"👁"}</button>
          </div>
        </div>

        {err&&(
          <div style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:8,padding:"8px 12px",fontSize:12,color:"#f87171",marginBottom:16}}>⚠ {err}</div>
        )}

        {/* Botón ingresar */}
        <button className="gd-btn" onClick={login} style={{width:"100%",padding:"13px",borderRadius:10,border:"1px solid rgba(212,175,55,.5)",cursor:"pointer",fontWeight:800,fontSize:14,background:"linear-gradient(135deg,rgba(212,175,55,.2),rgba(212,175,55,.05))",color:"#d4af37",letterSpacing:2,transition:"all .2s",boxShadow:"0 4px 15px rgba(212,175,55,.15)"}}>
          INGRESAR →
        </button>

        <div style={{textAlign:"center",marginTop:20,fontSize:10,color:"rgba(148,163,184,.4)",letterSpacing:1}}>
          ACCESO RESTRINGIDO · SOLO PERSONAL AUTORIZADO
        </div>

        {/* Brillo inferior */}
        <div style={{position:"absolute",bottom:0,left:"30%",right:"30%",height:1,background:"linear-gradient(90deg,transparent,rgba(212,175,55,.4),transparent)"}}/>
      </div>
    </div>
  );
}

// ─── SELECCIÓN DE ÁREA ────────────────────────────────
function PantallaArea({onSelect,T}){
  const areas=[{id:"Lubricación",icon:"🛢️",color:"#0ea5e9"},{id:"Mecánica",icon:"🔧",color:"#f97316"},{id:"Eléctrica",icon:"⚡",color:"#eab308"},{id:"Planta",icon:"🏭",color:"#10b981"},{id:"Trituracion",icon:"⛏️",color:"#ef4444"},{id:"Heap Leaching",icon:"🏔️",color:"#8b5cf6"},{id:"Todas",icon:"📋",color:"#64748b"}];
  return(<div style={{fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",minHeight:"100vh",background:T.appBg,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",padding:20}}>
    <style>{`*{box-sizing:border-box;}`}</style>
    <div style={{textAlign:"center",marginBottom:32}}><div style={{fontSize:40,marginBottom:8}}>⚙️</div><div style={{fontSize:22,fontWeight:800,color:T.text}}>LUBRICACIÓN · BARBOZA</div><div style={{fontSize:14,color:T.textMuted,marginTop:4}}>Seleccioná tu área de trabajo</div></div>
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(150px,1fr))",gap:12,width:"100%",maxWidth:680}}>
      {areas.map(a=><button key={a.id} onClick={()=>onSelect(a.id)} style={{background:T.cardBg,border:`2px solid ${T.cardBorder}`,borderRadius:14,padding:"20px 12px",cursor:"pointer",textAlign:"center",display:"flex",flexDirection:"column",alignItems:"center",gap:8}}>
        <span style={{fontSize:30}}>{a.icon}</span>
        <div style={{fontWeight:700,fontSize:14,color:T.text}}>{a.id}</div>
        <div style={{width:36,height:3,borderRadius:99,background:a.color}}/>
      </button>)}
    </div>
  </div>);
}

// ─── MODALES AUXILIARES ───────────────────────────────
function ModalTecnicos({tecnicos,onClose,onSave,T}){
  const [lista,setLista]=useState([...tecnicos]); const [nuevo,setNuevo]=useState("");
  const add=()=>{if(nuevo.trim()&&!lista.includes(nuevo.trim())){setLista(p=>[...p,nuevo.trim()]);setNuevo("");}};
  return(<Overlay onClose={onClose} maxW={400}><div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:16}}>👷 Equipo de Técnicos</div>
    {lista.map(n=><div key={n} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",background:T.inputBg,borderRadius:8,marginBottom:6}}>
      <span style={{color:T.text}}>👷 {n}</span>
      <button onClick={()=>setLista(p=>p.filter(x=>x!==n))} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:18}}>×</button>
    </div>)}
    {lista.length===0&&<div style={{color:T.textMuted,fontSize:13,textAlign:"center",padding:12}}>Sin técnicos</div>}
    <div style={{display:"flex",gap:8,marginTop:8,marginBottom:20}}>
      <input style={{...inp(T),flex:1}} value={nuevo} onChange={e=>setNuevo(e.target.value)} onKeyDown={e=>e.key==="Enter"&&add()} placeholder="Nombre del técnico"/>
      <button onClick={add} style={{padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:T.btnPrimary,color:"#fff"}}>+ Agregar</button>
    </div>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
      <button onClick={onClose} style={{padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:"#334155",color:"#fff"}}>Cancelar</button>
      <button onClick={()=>{onSave(lista);onClose();}} style={{padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:T.btnSuccess,color:"#fff"}}>💾 Guardar</button>
    </div>
  </Overlay>);
}

function ModalNuevaPlan({onClose,onSave,T}){
  const [periodo,setPeriodo]=useState("");
  const [texto,setTexto]=useState("");
  const [modo,setModo]=useState("archivo");
  const [nombreArchivo,setNombreArchivo]=useState("");
  const [cargando,setCargando]=useState(false);

  const parsear=function(txt){
    return txt.split("\n").filter(function(l){return l.trim();}).map(function(l,i){
      const sep=l.indexOf("\t")>=0?"\t":",";
      const p=l.split(sep).map(function(v){
        let s=v.trim();
        while(s.length>0 && (s.charAt(0)===String.fromCharCode(34) || s.charAt(0)===String.fromCharCode(39))) s=s.substring(1);
        while(s.length>0 && (s.charAt(s.length-1)===String.fromCharCode(34) || s.charAt(s.length-1)===String.fromCharCode(39))) s=s.substring(0,s.length-1);
        return s.trim();
      });
      return {
        id:"N"+Date.now()+"_"+i,
        cat:p[0]||"General",
        codigo:p[1]||"",
        tarea:p[2]||l.trim(),
        equipo:p[3]||"",
        area:p[4]||"Sin area",
        orden:p[5]||"",
        est:"pendiente",
        reg:null,
        enDia:false
      };
    }).filter(function(t){return t.tarea && t.tarea.length>2;});
  };

  const leerArchivo=function(e){
    const file=e.target.files[0];
    if(!file)return;
    setNombreArchivo(file.name);
    setCargando(true);
    const ext=file.name.split(".").pop().toLowerCase();
    if(ext==="xlsx"||ext==="xls"){
      const reader=new FileReader();
      reader.onload=function(ev){
        try{
          if(typeof window!=="undefined" && window.XLSX){
            const wb=window.XLSX.read(ev.target.result,{type:"binary"});
            const sheetName=wb.SheetNames.find(function(n){return n.toUpperCase().indexOf("LUBRICACION")>=0;})||wb.SheetNames[0];
            const ws=wb.Sheets[sheetName];
            const rows=window.XLSX.utils.sheet_to_json(ws,{header:1,defval:""});
            const tsv=rows.map(function(r){return r.join("\t");}).join("\n");
            setTexto(tsv);
          }else{
            alert("Para leer xlsx exporta el archivo como CSV desde Excel");
          }
          setCargando(false);
        }catch(err){
          setCargando(false);
          alert("Error leyendo Excel. Exporta como CSV e intenta de nuevo.");
        }
      };
      reader.readAsBinaryString(file);
    }else{
      const reader=new FileReader();
      reader.onload=function(ev){
        setTexto(ev.target.result);
        setCargando(false);
      };
      reader.onerror=function(){setCargando(false);};
      reader.readAsText(file,"UTF-8");
    }
  };

  const tareasFinales=parsear(texto);

  return (
    <Overlay onClose={onClose} maxW={580}>
      <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:4}}>Nueva planificacion</div>
      <div style={{fontSize:12,color:T.textMuted,marginBottom:20}}>La planificacion actual pasara al historial</div>
      <div style={{marginBottom:14}}>
        <div style={{fontSize:11,color:T.textMuted,marginBottom:4}}>Periodo</div>
        <input style={inp(T)} value={periodo} onChange={function(e){setPeriodo(e.target.value);}} placeholder="Ej: 07/04/2026 al 20/04/2026"/>
      </div>
      <div style={{display:"flex",gap:4,marginBottom:14,background:T.inputBg,borderRadius:10,padding:4}}>
        <button onClick={function(){setModo("archivo");}} style={{flex:1,padding:8,borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:12,background:modo==="archivo"?T.accent:"transparent",color:modo==="archivo"?"#fff":T.textMuted}}>Subir archivo</button>
        <button onClick={function(){setModo("texto");}} style={{flex:1,padding:8,borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:12,background:modo==="texto"?T.accent:"transparent",color:modo==="texto"?"#fff":T.textMuted}}>Pegar de Excel</button>
      </div>
      {modo==="archivo" && (
        <div style={{marginBottom:14}}>
          <label style={{display:"block",cursor:"pointer"}}>
            <div style={{border:"3px dashed "+(nombreArchivo?"#34d399":"#d4af37"),borderRadius:16,padding:"32px 20px",textAlign:"center",background:"rgba(212,175,55,.04)",animation:!nombreArchivo&&!cargando?"filePulse 2s infinite":"none"}}>
              {cargando ? (
                <div style={{fontWeight:700,color:"#d4af37",fontSize:15}}>Leyendo archivo...</div>
              ) : nombreArchivo ? (
                <div>
                  <div style={{fontSize:40,marginBottom:10}}>OK</div>
                  <div style={{fontWeight:800,color:"#34d399",fontSize:15}}>{nombreArchivo}</div>
                </div>
              ) : (
                <div>
                  <div style={{fontSize:48,marginBottom:10}}>📊</div>
                  <div style={{fontWeight:900,color:"#d4af37",fontSize:18,letterSpacing:1}}>SUBIR PLANIFICACION</div>
                  <div style={{fontSize:12,color:T.textMuted,marginTop:8}}>Excel xlsx, CSV o TXT</div>
                  <div style={{display:"inline-block",marginTop:12,background:"rgba(212,175,55,.2)",border:"1px solid rgba(212,175,55,.5)",borderRadius:10,padding:"8px 18px",fontSize:13,color:"#d4af37",fontWeight:700}}>TOCAR PARA SELECCIONAR</div>
                </div>
              )}
            </div>
            <input type="file" accept=".xlsx,.xls,.csv,.txt,.tsv" style={{display:"none"}} onChange={leerArchivo}/>
          </label>
        </div>
      )}
      {modo==="texto" && (
        <div style={{marginBottom:14}}>
          <textarea style={Object.assign({},inp(T),{height:160,resize:"vertical",fontFamily:"monospace",fontSize:12})} value={texto} onChange={function(e){setTexto(e.target.value);}} placeholder="Pega filas copiadas de Excel"/>
        </div>
      )}
      {tareasFinales.length>0 && (
        <div style={{background:"rgba(52,211,153,.1)",borderRadius:8,padding:10,marginBottom:14,fontSize:13,color:"#34d399",fontWeight:700}}>OK {tareasFinales.length} tareas detectadas</div>
      )}
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button onClick={onClose} style={{padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:"#334155",color:"#fff"}}>Cancelar</button>
        <button onClick={function(){if(periodo&&tareasFinales.length>0){onSave(periodo,tareasFinales);onClose();}}} disabled={!periodo||tareasFinales.length===0} style={{padding:"8px 14px",borderRadius:8,border:"none",cursor:periodo&&tareasFinales.length>0?"pointer":"default",fontWeight:700,fontSize:13,background:periodo&&tareasFinales.length>0?T.btnPrimary:"#334155",color:"#fff",opacity:periodo&&tareasFinales.length>0?1:.5}}>Cargar {tareasFinales.length}</button>
      </div>
    </Overlay>
  );
}
function ModalCerrar({periodo,tareas,onClose,onConfirm,T}){
  const comp=tareas.filter(t=>t.est==="completada").length; const anom=tareas.filter(t=>t.est==="con_anomalia").length; const pend=tareas.filter(t=>t.est==="pendiente").length;
  return(<Overlay onClose={onClose} maxW={420}><div style={{fontSize:17,fontWeight:700,color:T.text,marginBottom:4}}>🔒 Cerrar planificación</div><div style={{fontSize:13,color:T.textMuted,marginBottom:20}}>{periodo}</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,background:T.inputBg,borderRadius:10,padding:16,marginBottom:16}}>
      {[{l:"Total",v:tareas.length,c:"#60a5fa"},{l:"Completadas",v:comp,c:"#34d399"},{l:"Anomalías",v:anom,c:"#f87171"},{l:"Pendientes",v:pend,c:"#94a3b8"}].map(s=><div key={s.l} style={{textAlign:"center"}}><div style={{fontSize:24,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:11,color:T.textMuted}}>{s.l}</div></div>)}
    </div>
    {pend>0&&<div style={{background:"#422006",border:"1px solid #92400e",borderRadius:8,padding:10,marginBottom:12,fontSize:12,color:"#fbbf24"}}>⚠️ {pend} tarea(s) pendiente(s) quedarán como no ejecutadas.</div>}
    <div style={{fontSize:13,color:T.textMuted,marginBottom:20}}>Esta planificación pasará al historial y no podrá modificarse.</div>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
      <button onClick={onClose} style={{padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:"#334155",color:"#fff"}}>Cancelar</button>
      <button onClick={()=>{onConfirm();onClose();}} style={{padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,background:T.btnOrange,color:"#fff"}}>🔒 Confirmar cierre</button>
    </div>
  </Overlay>);
}

function ModalParada({paradas,onClose,onSave,T}){
  const [lista,setLista]=useState(paradas.length>0?paradas:[{fecha:"",planta:"Planta"}]);
  const upd=(i,k,v)=>setLista(p=>{const n=[...p];n[i]={...n[i],[k]:v};return n;});
  return(<Overlay onClose={onClose} maxW={460}><div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:4}}>🏭 Paradas de planta</div><div style={{fontSize:12,color:T.textMuted,marginBottom:20}}>Se mostrará como alerta con días restantes</div>
    {lista.map((p,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:8,alignItems:"center"}}>
      <input style={{...inp(T),flex:1}} type="date" value={p.fecha} onChange={e=>upd(i,"fecha",e.target.value)}/>
      <select style={{...inp(T),flex:1}} value={p.planta} onChange={e=>upd(i,"planta",e.target.value)}><option>Planta</option><option>Trituración</option><option>Heap Leaching</option><option>Todas</option></select>
      <button onClick={()=>setLista(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"1px solid #7f1d1d",borderRadius:6,color:"#f87171",cursor:"pointer",padding:"6px 10px",fontSize:14,flexShrink:0}}>×</button>
    </div>)}
    <button onClick={()=>setLista(p=>[...p,{fecha:"",planta:"Planta"}])} style={{padding:"8px",borderRadius:8,border:`1px dashed ${T.cardBorder}`,background:"transparent",color:T.textMuted,cursor:"pointer",width:"100%",marginBottom:20}}>+ Agregar parada</button>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
      <button onClick={onClose} style={{padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:"#334155",color:"#fff"}}>Cancelar</button>
      <button onClick={()=>{onSave(lista.filter(p=>p.fecha));onClose();}} style={{padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,background:T.btnOrange,color:"#fff"}}>💾 Guardar</button>
    </div>
  </Overlay>);
}

function ModalUsuarios({usuarios,onClose,onSave,T}){
  const [lista,setLista]=useState(usuarios.map(u=>({...u}))); const [nuevo,setNuevo]=useState({nombre:"",usuario:"",password:"",rol:"tecnico",activo:true});
  const upd=(id,k,v)=>setLista(p=>p.map(u=>u.id===id?{...u,[k]:v}:u));
  const add=()=>{if(!nuevo.nombre||!nuevo.usuario||!nuevo.password)return;setLista(p=>[...p,{...nuevo,id:Date.now().toString()}]);setNuevo({nombre:"",usuario:"",password:"",rol:"tecnico"});};
  return(<Overlay onClose={onClose} maxW={560}><div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:4}}>👤 Gestión de Usuarios</div><div style={{fontSize:12,color:T.textMuted,marginBottom:20}}>Solo el administrador puede gestionar usuarios</div>
    {lista.map(u=>{
      const rolIcon=u.rol==="admin"?"👑":u.rol==="supervisor"?"👔":"👷";
      const rolBg=u.rol==="admin"?"linear-gradient(135deg,#7c3aed,#4f46e5)":u.rol==="supervisor"?"linear-gradient(135deg,#0891b2,#0e7490)":"linear-gradient(135deg,#059669,#065f46)";
      const rolLabel=u.rol==="admin"?"Admin":u.rol==="supervisor"?"Supervisor":"Técnico";
      return(<div key={u.id} style={{background:T.inputBg,border:`1px solid ${u.activo===false?"#7f1d1d":T.cardBorder}`,borderRadius:10,padding:"12px 14px",marginBottom:8,opacity:u.activo===false?0.6:1}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",gap:8,flexWrap:"wrap"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <div style={{width:36,height:36,borderRadius:"50%",background:rolBg,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16}}>{rolIcon}</div>
            <div>
              <div style={{fontWeight:700,color:T.text,fontSize:13}}>{u.nombre} {u.activo===false&&<span style={{fontSize:10,color:"#f87171",background:"rgba(239,68,68,.1)",borderRadius:99,padding:"1px 6px"}}>BLOQUEADO</span>}</div>
              <div style={{fontSize:11,color:T.textMuted}}>@{u.usuario} · {rolLabel}</div>
            </div>
          </div>
          <div style={{display:"flex",gap:6,alignItems:"center",flexWrap:"wrap"}}>
            <input style={{...inp(T),width:100,fontSize:11,padding:"5px 8px"}} type="password" value={u.password} onChange={e=>upd(u.id,"password",e.target.value)} placeholder="Contraseña"/>
            <select style={{...inp(T),width:100,fontSize:11,padding:"5px 8px"}} value={u.rol} onChange={e=>upd(u.id,"rol",e.target.value)} disabled={u.rol==="admin"}>
              <option value="tecnico">👷 Técnico</option>
              <option value="supervisor">👔 Supervisor</option>
              <option value="admin">👑 Admin</option>
            </select>
            {u.rol!=="admin"&&<button onClick={()=>upd(u.id,"activo",u.activo===false?true:false)} style={{background:"none",border:`1px solid ${u.activo===false?"#065f46":"#92400e"}`,borderRadius:6,color:u.activo===false?"#34d399":"#fbbf24",cursor:"pointer",padding:"5px 9px",fontSize:11,fontWeight:700}}>
              {u.activo===false?"✅ Habilitar":"🚫 Bloquear"}
            </button>}
            {u.rol!=="admin"&&<button onClick={()=>setLista(p=>p.filter(x=>x.id!==u.id))} style={{background:"none",border:"1px solid #7f1d1d",borderRadius:6,color:"#f87171",cursor:"pointer",padding:"5px 9px",fontSize:13}}>🗑</button>}
          </div>
        </div>
      </div>);
    })}
    <div style={{background:T.inputBg,border:`1px dashed ${T.cardBorder}`,borderRadius:10,padding:14,marginTop:12,marginBottom:20}}>
      <div style={{fontSize:11,color:T.textMuted,fontWeight:700,marginBottom:10}}>+ NUEVO USUARIO</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
        <div style={{gridColumn:"1/-1"}}><div style={{fontSize:10,color:T.textMuted,marginBottom:3}}>Nombre completo</div><input style={inp(T)} value={nuevo.nombre} onChange={e=>setNuevo(p=>({...p,nombre:e.target.value}))} placeholder="Ej: González"/></div>
        <div><div style={{fontSize:10,color:T.textMuted,marginBottom:3}}>Usuario</div><input style={inp(T)} value={nuevo.usuario} onChange={e=>setNuevo(p=>({...p,usuario:e.target.value.toLowerCase()}))} placeholder="gonzalez"/></div>
        <div><div style={{fontSize:10,color:T.textMuted,marginBottom:3}}>Contraseña</div><input style={inp(T)} type="password" value={nuevo.password} onChange={e=>setNuevo(p=>({...p,password:e.target.value}))} placeholder="········"/></div>
        <div><div style={{fontSize:10,color:T.textMuted,marginBottom:3}}>Rol</div>
          <select style={inp(T)} value={nuevo.rol} onChange={e=>setNuevo(p=>({...p,rol:e.target.value}))}>
            <option value="tecnico">👷 Técnico</option>
            <option value="supervisor">👔 Supervisor</option>
            <option value="admin">👑 Administrador</option>
          </select>
        </div>
        <div><div style={{fontSize:10,color:T.textMuted,marginBottom:3}}>Estado</div>
          <select style={inp(T)} value={nuevo.activo?"activo":"inactivo"} onChange={e=>setNuevo(p=>({...p,activo:e.target.value==="activo"}))}>
            <option value="activo">✅ Activo</option>
            <option value="inactivo">🚫 Inactivo</option>
          </select>
        </div>
      </div>
      {/* Preview de permisos según rol */}
      <div style={{background:T.inputBg,borderRadius:8,padding:10,marginTop:8,marginBottom:4}}>
        <div style={{fontSize:10,color:T.textMuted,fontWeight:700,marginBottom:6}}>PERMISOS DEL ROL SELECCIONADO</div>
        <div style={{display:"flex",flexWrap:"wrap",gap:4}}>
          {Object.entries(PERMISOS_ROL[nuevo.rol]||{}).map(([k,v])=>(
            <span key={k} style={{fontSize:10,padding:"2px 8px",borderRadius:99,background:v?"rgba(52,211,153,.15)":"rgba(239,68,68,.1)",color:v?"#34d399":"#f87171",border:`1px solid ${v?"rgba(52,211,153,.3)":"rgba(239,68,68,.2)"}`}}>
              {v?"✓":"✗"} {k}
            </span>
          ))}
        </div>
      </div>
      <button onClick={add} style={{padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:T.btnPrimary,color:"#fff",marginTop:10,width:"100%"}}>+ Agregar usuario</button>
    </div>
    <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
      <button onClick={onClose} style={{padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:"#334155",color:"#fff"}}>Cancelar</button>
      <button onClick={()=>{onSave(lista);onClose();}} style={{padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:T.btnSuccess,color:"#fff"}}>💾 Guardar</button>
    </div>
  </Overlay>);
}

// ─── MODAL REGISTRO ───────────────────────────────────
function ModalRegistro({t,tecnicos,onClose,onSave,T}){
  const initTecs=t.reg?.tecnicos||(t.reg?.tecnico?[t.reg.tecnico]:[""]); 
  const [tecs,setTecs]=useState(initTecs);
  const [f,setF]=useState(t.reg||{fecha:new Date().toISOString().split("T")[0],inicio:"",fin:"",materiales:"",anomalias:"",obs:"",est:t.est==="pendiente"?"completada":t.est,fotoAntes:null,fotoDespues:null,permisoF1:null,permisoF2:null});
  const u=(k,v)=>setF(p=>({...p,[k]:v}));
  const updTec=(i,v)=>setTecs(p=>{const n=[...p];n[i]=v;return n;});
  return(<Overlay onClose={onClose}><div style={{marginBottom:16}}>
    <div style={{fontSize:10,color:T.textMuted,fontWeight:700,letterSpacing:1,marginBottom:4}}>REGISTRAR EJECUCIÓN</div>
    <div style={{fontSize:15,fontWeight:700,color:T.text}}>{t.tarea}</div>
    <div style={{fontSize:12,color:T.textMuted,marginTop:3}}>{t.equipo||"—"} · <span style={{color:T.accentText,fontFamily:"monospace"}}>{t.orden||"Sin orden"}</span></div>
  </div>

  {/* TÉCNICOS */}
  <div style={{marginBottom:14}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
      <div style={{fontSize:11,color:T.textMuted,fontWeight:700}}>👷 EJECUTADO POR</div>
      <button onClick={()=>setTecs(p=>[...p,""])} style={{fontSize:11,padding:"3px 10px",borderRadius:6,border:`1px solid ${T.accent}`,background:"transparent",color:T.accentText,cursor:"pointer",fontWeight:600}}>+ Agregar</button>
    </div>
    {tecs.map((tc,i)=><div key={i} style={{display:"flex",gap:8,marginBottom:6}}>
      <select style={{...inp(T),flex:1}} value={tc} onChange={e=>updTec(i,e.target.value)}>
        <option value="">— Seleccionar técnico —</option>
        {tecnicos.map(n=><option key={n} value={n}>{n}</option>)}
      </select>
      {tecs.length>1&&<button onClick={()=>setTecs(p=>p.filter((_,j)=>j!==i))} style={{background:"none",border:"1px solid #7f1d1d",borderRadius:6,color:"#f87171",cursor:"pointer",padding:"6px 10px",fontSize:14,flexShrink:0}}>×</button>}
    </div>)}
  </div>

  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:12}}>
    <div style={{gridColumn:"1/-1"}}><div style={{fontSize:11,color:T.textMuted,marginBottom:4}}>📊 Resultado</div>
      <select style={inp(T)} value={f.est} onChange={e=>u("est",e.target.value)}><option value="completada">✅ Completada</option><option value="con_anomalia">⚠️ Con anomalía</option><option value="en_proceso">🔄 En proceso</option></select>
    </div>
    <div><div style={{fontSize:11,color:T.textMuted,marginBottom:4}}>📅 Fecha</div><input style={inp(T)} type="date" value={f.fecha} onChange={e=>u("fecha",e.target.value)}/></div>
    <div/>
    <div><div style={{fontSize:11,color:T.textMuted,marginBottom:4}}>🕐 Hora inicio</div><input style={inp(T)} type="time" value={f.inicio} onChange={e=>u("inicio",e.target.value)}/></div>
    <div><div style={{fontSize:11,color:T.textMuted,marginBottom:4}}>🕐 Hora fin</div><input style={inp(T)} type="time" value={f.fin} onChange={e=>u("fin",e.target.value)}/></div>
  </div>

  <div style={{marginBottom:12}}><div style={{fontSize:11,color:T.textMuted,marginBottom:4}}>🛢️ Materiales usados</div><textarea style={{...inp(T),height:64,resize:"vertical"}} value={f.materiales} onChange={e=>u("materiales",e.target.value)} placeholder="Ej: Grasa EP2 – 200g · Filtro MAT-011 x1"/></div>
  <div style={{marginBottom:12}}><div style={{fontSize:11,color:T.textMuted,marginBottom:4}}>⚠️ Anomalías</div><textarea style={{...inp(T),height:60,resize:"vertical"}} value={f.anomalias} onChange={e=>u("anomalias",e.target.value)} placeholder="Dejar vacío si no hubo anomalías"/></div>
  <div style={{marginBottom:16}}><div style={{fontSize:11,color:T.textMuted,marginBottom:4}}>📝 Observaciones</div><textarea style={{...inp(T),height:48,resize:"vertical"}} value={f.obs} onChange={e=>u("obs",e.target.value)} placeholder="Cualquier nota adicional"/></div>

  {/* FOTOS */}
  <div style={{marginBottom:20}}>
    <div style={{fontSize:11,color:T.textMuted,fontWeight:700,marginBottom:10}}>📸 REGISTRO FOTOGRÁFICO</div>
    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
      {[{k:"fotoAntes",l:"Antes del trabajo",icon:"📷"},{k:"fotoDespues",l:"Después del trabajo",icon:"✅"},{k:"permisoF1",l:"Permiso — Cara 1",icon:"📄"},{k:"permisoF2",l:"Permiso — Cara 2",icon:"📄"}].map(foto=>(
        <div key={foto.k} style={{background:T.inputBg,border:`1px solid ${T.cardBorder}`,borderRadius:10,padding:10,textAlign:"center"}}>
          <div style={{fontSize:10,color:T.textMuted,fontWeight:700,marginBottom:6}}>{foto.icon} {foto.l}</div>
          {f[foto.k]?(
            <div style={{position:"relative"}}><img src={f[foto.k]} alt={foto.l} style={{width:"100%",height:90,objectFit:"cover",borderRadius:6,display:"block"}}/><button onClick={()=>u(foto.k,null)} style={{position:"absolute",top:4,right:4,background:"rgba(0,0,0,.6)",border:"none",color:"#fff",borderRadius:"50%",width:22,height:22,cursor:"pointer",fontSize:13}}>×</button></div>
          ):(
            <label style={{display:"block",cursor:"pointer"}}>
              <div style={{height:70,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",borderRadius:6,border:`1px dashed ${T.cardBorder}`,color:T.textMuted,fontSize:11,gap:4}}><span style={{fontSize:22}}>+</span><span>Subir foto</span></div>
              <input type="file" accept="image/*" capture="environment" style={{display:"none"}} onChange={async e=>{const file=e.target.files[0];if(file){const b64=await comprimirFoto(file);u(foto.k,b64);}}}/>
            </label>
          )}
        </div>
      ))}
    </div>
  </div>

  <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
    <button onClick={onClose} style={{padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:"#334155",color:"#fff"}}>Cancelar</button>
    <button onClick={()=>{onSave({...f,tecnicos:tecs.filter(x=>x),tecnico:tecs[0]||""});onClose();}} style={{padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:T.btnSuccess,color:"#fff"}}>💾 Guardar</button>
  </div>
  </Overlay>);
}

// ─── FICHA EQUIPO ─────────────────────────────────────
function ModalFichaEquipo({equipo,onClose,onSave,T,catHerr,catMat}){
  const [eq,setEq]=useState({...equipo}); const [tab,setTab]=useState("herramientas");
  const [busqH,setBusqH]=useState(""); const [busqM,setBusqM]=useState("");
  const [cantM,setCantM]=useState(""); const [unidM,setUnidM]=useState("L");
  const [cantH,setCantH]=useState("");

  const filtHerr=(catHerr||[]).filter(h=>{const q=busqH.toLowerCase();return !q||h.nombre.toLowerCase().includes(q)||h.tipo.toLowerCase().includes(q);});
  const filtMat=(catMat||[]).filter(m=>{const q=busqM.toLowerCase();return !q||m.nombre.toLowerCase().includes(q)||m.tipo.toLowerCase().includes(q)||m.codigo.toLowerCase().includes(q);});
  const yaHerr=(h)=>(eq.herramientas||[]).some(x=>x.refId===h.id);
  const yaMat=(m)=>(eq.materiales||[]).some(x=>x.refId===m.id);

  const addH=(h)=>{
    if(yaHerr(h))return;
    setEq(p=>({...p,herramientas:[...(p.herramientas||[]),{id:Date.now(),refId:h.id,nombre:h.nombre,detalle:h.detalle,tipo:h.tipo}]}));
    setBusqH("");
  };
  const addM=(m)=>{
    if(yaMat(m))return;
    setEq(p=>({...p,materiales:[...(p.materiales||[]),{id:Date.now(),refId:m.id,nombre:m.nombre,tipo:m.tipo,codigo:m.codigo,cantidad:cantM,unidad:unidM,detalle:m.detalle}]}));
    setBusqM(""); setCantM(""); setUnidM("L");
  };
  const TIPO_ICON={aceite:"🛢️",grasa:"🟡",filtro:"🔧",repuesto:"📦",otro:"📌"};
  return(<Overlay onClose={onClose} maxW={600}>
    <div style={{marginBottom:16}}><div style={{fontSize:10,color:T.textMuted,fontWeight:700,letterSpacing:1,marginBottom:2}}>FICHA DE EQUIPO</div><div style={{fontSize:17,fontWeight:800,color:T.text}}>{eq.nombre}</div><div style={{fontSize:12,color:T.accentText,fontFamily:"monospace"}}>{eq.tag} · {eq.area}</div></div>
    <div style={{display:"flex",gap:4,marginBottom:16,background:T.inputBg,borderRadius:10,padding:4}}>
      {[{k:"herramientas",l:`🔩 Herramientas (${(eq.herramientas||[]).length})`},{k:"materiales",l:`🛢️ Materiales (${(eq.materiales||[]).length})`}].map(t=><button key={t.k} onClick={()=>setTab(t.k)} style={{flex:1,padding:"8px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:12,background:tab===t.k?T.accent:"transparent",color:tab===t.k?"#fff":T.textMuted}}>{t.l}</button>)}
    </div>

    {tab==="herramientas"&&<div>
      {/* Herramientas ya asignadas */}
      {(eq.herramientas||[]).length===0&&<div style={{textAlign:"center",padding:"12px 0",color:T.textMuted,fontSize:13}}>Sin herramientas asignadas</div>}
      {(eq.herramientas||[]).map(h=><div key={h.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:T.inputBg,borderRadius:8,padding:"10px 12px",marginBottom:6,border:`1px solid ${T.cardBorder}`}}>
        <div><div style={{fontWeight:600,color:T.text,fontSize:13}}>🔩 {h.nombre}</div>{h.detalle&&<div style={{fontSize:11,color:T.textMuted,marginTop:2}}>{h.detalle}</div>}</div>
        <button onClick={()=>setEq(p=>({...p,herramientas:p.herramientas.filter(x=>x.id!==h.id)}))} style={{background:"none",border:"1px solid #7f1d1d",borderRadius:6,color:"#f87171",cursor:"pointer",padding:"4px 8px",fontSize:13}}>×</button>
      </div>)}
      {/* Buscador del catálogo */}
      <div style={{background:T.inputBg,border:`1px dashed ${T.cardBorder}`,borderRadius:10,padding:14,marginTop:10}}>
        <div style={{fontSize:11,color:T.textMuted,fontWeight:700,marginBottom:8}}>🔍 BUSCAR EN CATÁLOGO DE HERRAMIENTAS</div>
        <input style={{...inp(T),marginBottom:8}} value={busqH} onChange={e=>setBusqH(e.target.value)} placeholder="Buscar: llave, pistola, bomba..."/>
        {busqH&&<div style={{maxHeight:180,overflowY:"auto",background:T.appBg,borderRadius:8,border:`1px solid ${T.cardBorder}`}}>
          {filtHerr.length===0&&<div style={{padding:"10px 12px",fontSize:12,color:T.textMuted}}>Sin resultados</div>}
          {filtHerr.map(h=><div key={h.id} onClick={()=>!yaHerr(h)&&addH(h)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",borderBottom:`1px solid ${T.cardBorder}`,cursor:yaHerr(h)?"default":"pointer",opacity:yaHerr(h)?0.4:1}}>
            <div><div style={{fontWeight:600,color:T.text,fontSize:13}}>🔩 {h.nombre}</div><div style={{fontSize:10,color:T.textMuted}}>{h.tipo} {h.detalle?`· ${h.detalle}`:""}</div></div>
            <span style={{fontSize:11,padding:"2px 8px",borderRadius:99,background:yaHerr(h)?"#334155":T.accent,color:"#fff",fontWeight:600,flexShrink:0}}>{yaHerr(h)?"✓ Ya agregada":"+ Agregar"}</span>
          </div>)}
        </div>}
        {!busqH&&<div style={{fontSize:11,color:T.textMuted,textAlign:"center",padding:"8px 0"}}>Escribí para buscar en el catálogo global</div>}
      </div>
    </div>}

    {tab==="materiales"&&<div>
      {/* Materiales ya asignados */}
      {(eq.materiales||[]).length===0&&<div style={{textAlign:"center",padding:"12px 0",color:T.textMuted,fontSize:13}}>Sin materiales asignados</div>}
      {(eq.materiales||[]).map(m=><div key={m.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",background:T.inputBg,borderRadius:8,padding:"10px 12px",marginBottom:6,border:`1px solid ${T.cardBorder}`}}>
        <div style={{flex:1}}>
          <div style={{fontWeight:600,color:T.text,fontSize:13}}>{TIPO_ICON[m.tipo]||"📌"} {m.nombre}</div>
          <div style={{fontSize:11,color:T.textMuted,marginTop:1}}>{m.codigo&&<span style={{color:T.accentText,fontFamily:"monospace"}}>#{m.codigo} · </span>}{m.cantidad&&`${m.cantidad} ${m.unidad} · `}{m.tipo}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:4}}>
          <button onClick={()=>setEq(p=>({...p,materiales:p.materiales.filter(x=>x.id!==m.id)}))} style={{background:"none",border:"1px solid #7f1d1d",borderRadius:6,color:"#f87171",cursor:"pointer",padding:"3px 8px",fontSize:13}}>×</button>
        </div>
      </div>)}
      {/* Buscador */}
      <div style={{background:T.inputBg,border:`1px dashed ${T.cardBorder}`,borderRadius:10,padding:14,marginTop:10}}>
        <div style={{fontSize:11,color:T.textMuted,fontWeight:700,marginBottom:8}}>🔍 BUSCAR EN CATÁLOGO DE MATERIALES</div>
        <input style={{...inp(T),marginBottom:8}} value={busqM} onChange={e=>setBusqM(e.target.value)} placeholder="Buscar: aceite, grasa, filtro, código..."/>
        {busqM&&<div style={{marginBottom:10}}>
          <div style={{display:"flex",gap:8,marginBottom:6}}>
            <div style={{flex:1}}><div style={{fontSize:10,color:T.textMuted,marginBottom:3}}>Cantidad</div><input style={inp(T)} type="number" value={cantM} onChange={e=>setCantM(e.target.value)} placeholder="0"/></div>
            <div><div style={{fontSize:10,color:T.textMuted,marginBottom:3}}>Unidad</div><select style={{...inp(T),width:"auto"}} value={unidM} onChange={e=>setUnidM(e.target.value)}><option value="L">L</option><option value="kg">kg</option><option value="g">g</option><option value="un">un</option></select></div>
          </div>
          <div style={{maxHeight:180,overflowY:"auto",background:T.appBg,borderRadius:8,border:`1px solid ${T.cardBorder}`}}>
            {filtMat.length===0&&<div style={{padding:"10px 12px",fontSize:12,color:T.textMuted}}>Sin resultados</div>}
            {filtMat.map(m=><div key={m.id} onClick={()=>!yaMat(m)&&addM(m)} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 12px",borderBottom:`1px solid ${T.cardBorder}`,cursor:yaMat(m)?"default":"pointer",opacity:yaMat(m)?0.4:1}}>
              <div>
                <div style={{fontWeight:600,color:T.text,fontSize:13}}>{TIPO_ICON[m.tipo]||"📌"} {m.nombre}</div>
                <div style={{fontSize:10,color:T.textMuted}}>{m.tipo} {m.codigo?`· #${m.codigo}`:""}</div>
              </div>
              <span style={{fontSize:11,padding:"2px 8px",borderRadius:99,background:yaMat(m)?"#334155":T.btnSuccess,color:"#fff",fontWeight:600,flexShrink:0}}>{yaMat(m)?"✓ Ya agregado":"+ Agregar"}</span>
            </div>)}
          </div>
        </div>}
        {!busqM&&<div style={{fontSize:11,color:T.textMuted,textAlign:"center",padding:"8px 0"}}>Escribí para buscar en el catálogo global</div>}
      </div>
    </div>}

    <div style={{display:"flex",gap:10,justifyContent:"flex-end",marginTop:20}}>
      <button onClick={onClose} style={{padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:"#334155",color:"#fff"}}>Cancelar</button>
      <button onClick={()=>{onSave(eq);onClose();}} style={{padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:T.btnSuccess,color:"#fff"}}>💾 Guardar ficha</button>
    </div>
  </Overlay>);
}

// ─── VISTA CATÁLOGO GLOBAL ────────────────────────────
function VistaCatalogos({catHerr,setCatHerr,catMat,setCatMat,T}){
  const [tab,setTab]=useState("herramientas");
  const [busq,setBusq]=useState("");
  const [nH,setNH]=useState({nombre:"",tipo:"llave",detalle:""});
  const [nM,setNM]=useState({nombre:"",tipo:"aceite",codigo:"",unidad:"L",detalle:""});

  const TIPOS_HERR=["llave","engrase","bomba","recipiente","medicion","otro"];
  const TIPOS_MAT=["aceite","grasa","filtro","repuesto","otro"];
  const TIPO_ICON={aceite:"🛢️",grasa:"🟡",filtro:"🔧",repuesto:"📦",otro:"📌",llave:"🔑",engrase:"💉",bomba:"⛽",recipiente:"🪣",medicion:"📏"};

  const addH=()=>{
    if(!nH.nombre.trim())return;
    setCatHerr(p=>[...p,{id:"H"+Date.now(),nombre:nH.nombre.trim(),tipo:nH.tipo,detalle:nH.detalle.trim()}]);
    setNH({nombre:"",tipo:"llave",detalle:""});
  };
  const addM=()=>{
    if(!nM.nombre.trim())return;
    setCatMat(p=>[...p,{id:"M"+Date.now(),nombre:nM.nombre.trim(),tipo:nM.tipo,codigo:nM.codigo.trim(),unidad:nM.unidad,detalle:nM.detalle.trim()}]);
    setNM({nombre:"",tipo:"aceite",codigo:"",unidad:"L",detalle:""});
  };

  const listaH=catHerr.filter(h=>{const q=busq.toLowerCase();return !q||h.nombre.toLowerCase().includes(q)||h.tipo.toLowerCase().includes(q);});
  const listaM=catMat.filter(m=>{const q=busq.toLowerCase();return !q||m.nombre.toLowerCase().includes(q)||m.tipo.toLowerCase().includes(q)||m.codigo.toLowerCase().includes(q);});

  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,flexWrap:"wrap",gap:10}}>
      <div>
        <div style={{fontSize:18,fontWeight:800,color:T.text}}>📦 Catálogo Global</div>
        <div style={{fontSize:12,color:T.textMuted,marginTop:2}}>Herramientas y materiales disponibles para asignar a equipos</div>
      </div>
      <div style={{display:"flex",gap:8}}>
        <div style={{background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderRadius:8,padding:"6px 12px",fontSize:12,color:T.textSub}}>🔩 {catHerr.length} herramientas</div>
        <div style={{background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderRadius:8,padding:"6px 12px",fontSize:12,color:T.textSub}}>🛢️ {catMat.length} materiales</div>
      </div>
    </div>

    {/* Tabs */}
    <div style={{display:"flex",gap:4,marginBottom:16,background:T.inputBg,borderRadius:10,padding:4}}>
      {[{k:"herramientas",l:"🔩 Herramientas"},{k:"materiales",l:"🛢️ Materiales"}].map(t=>(
        <button key={t.k} onClick={()=>{setTab(t.k);setBusq("");}} style={{flex:1,padding:"9px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,background:tab===t.k?T.accent:"transparent",color:tab===t.k?"#fff":T.textMuted,transition:"all .15s"}}>{t.l}</button>
      ))}
    </div>

    {/* Buscador */}
    <input style={{...inp(T),marginBottom:16}} placeholder={`🔍 Buscar en ${tab==="herramientas"?"herramientas":"materiales"}...`} value={busq} onChange={e=>setBusq(e.target.value)}/>

    {/* TAB HERRAMIENTAS */}
    {tab==="herramientas"&&<div>
      {listaH.length===0&&<div style={{textAlign:"center",padding:"30px 0",color:T.textMuted}}><div style={{fontSize:32,marginBottom:8}}>🔩</div><div>Sin resultados</div></div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:10,marginBottom:20}}>
        {listaH.map(h=><div key={h.id} style={{background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderRadius:10,padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div>
            <div style={{fontWeight:600,color:T.text,fontSize:13}}>{TIPO_ICON[h.tipo]||"🔩"} {h.nombre}</div>
            <div style={{fontSize:11,color:T.textMuted,marginTop:2}}>{h.tipo}{h.detalle?` · ${h.detalle}`:""}</div>
          </div>
          <button onClick={()=>setCatHerr(p=>p.filter(x=>x.id!==h.id))} style={{background:"none",border:"1px solid #7f1d1d",borderRadius:6,color:"#f87171",cursor:"pointer",padding:"3px 8px",fontSize:13,flexShrink:0}}>×</button>
        </div>)}
      </div>
      {/* Formulario nueva herramienta */}
      <div style={{background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:14}}>+ Nueva herramienta al catálogo</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div style={{gridColumn:"1/-1"}}><div style={{fontSize:11,color:T.textMuted,marginBottom:4}}>Nombre *</div><input style={inp(T)} value={nH.nombre} onChange={e=>setNH(p=>({...p,nombre:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addH()} placeholder="Ej: Llave Allen 6mm"/></div>
          <div><div style={{fontSize:11,color:T.textMuted,marginBottom:4}}>Tipo</div>
            <select style={inp(T)} value={nH.tipo} onChange={e=>setNH(p=>({...p,tipo:e.target.value}))}>
              {TIPOS_HERR.map(t=><option key={t} value={t}>{TIPO_ICON[t]||"🔩"} {t}</option>)}
            </select>
          </div>
          <div><div style={{fontSize:11,color:T.textMuted,marginBottom:4}}>Detalle / medida</div><input style={inp(T)} value={nH.detalle} onChange={e=>setNH(p=>({...p,detalle:e.target.value}))} placeholder="Ej: Hexagonal métrica"/></div>
        </div>
        <button onClick={addH} style={{width:"100%",padding:"10px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,background:T.btnPrimary,color:"#fff"}}>+ Agregar herramienta al catálogo</button>
      </div>
    </div>}

    {/* TAB MATERIALES */}
    {tab==="materiales"&&<div>
      {listaM.length===0&&<div style={{textAlign:"center",padding:"30px 0",color:T.textMuted}}><div style={{fontSize:32,marginBottom:8}}>🛢️</div><div>Sin resultados</div></div>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:10,marginBottom:20}}>
        {listaM.map(m=><div key={m.id} style={{background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderRadius:10,padding:"12px 14px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <div style={{flex:1}}>
            <div style={{fontWeight:600,color:T.text,fontSize:13}}>{TIPO_ICON[m.tipo]||"📌"} {m.nombre}</div>
            <div style={{fontSize:11,color:T.textMuted,marginTop:2}}>{m.tipo}{m.codigo?<span style={{color:T.accentText,fontFamily:"monospace"}}> · #{m.codigo}</span>:""}{m.unidad?` · ${m.unidad}`:""}</div>
          </div>
          <button onClick={()=>setCatMat(p=>p.filter(x=>x.id!==m.id))} style={{background:"none",border:"1px solid #7f1d1d",borderRadius:6,color:"#f87171",cursor:"pointer",padding:"3px 8px",fontSize:13,flexShrink:0}}>×</button>
        </div>)}
      </div>
      {/* Formulario nuevo material */}
      <div style={{background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderRadius:12,padding:20}}>
        <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:14}}>+ Nuevo material al catálogo</div>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:12}}>
          <div style={{gridColumn:"1/-1"}}><div style={{fontSize:11,color:T.textMuted,marginBottom:4}}>Nombre *</div><input style={inp(T)} value={nM.nombre} onChange={e=>setNM(p=>({...p,nombre:e.target.value}))} onKeyDown={e=>e.key==="Enter"&&addM()} placeholder="Ej: Aceite Shell Omala 220"/></div>
          <div><div style={{fontSize:11,color:T.textMuted,marginBottom:4}}>Tipo</div>
            <select style={inp(T)} value={nM.tipo} onChange={e=>setNM(p=>({...p,tipo:e.target.value}))}>
              {TIPOS_MAT.map(t=><option key={t} value={t}>{TIPO_ICON[t]||"📌"} {t}</option>)}
            </select>
          </div>
          <div><div style={{fontSize:11,color:T.textMuted,marginBottom:4}}>Código almacén</div><input style={inp(T)} value={nM.codigo} onChange={e=>setNM(p=>({...p,codigo:e.target.value}))} placeholder="MAT-001"/></div>
          <div><div style={{fontSize:11,color:T.textMuted,marginBottom:4}}>Unidad</div>
            <select style={inp(T)} value={nM.unidad} onChange={e=>setNM(p=>({...p,unidad:e.target.value}))}>
              <option value="L">Litros (L)</option><option value="kg">kg</option><option value="g">g</option><option value="un">Unidades</option>
            </select>
          </div>
          <div style={{gridColumn:"1/-1"}}><div style={{fontSize:11,color:T.textMuted,marginBottom:4}}>Descripción (opcional)</div><input style={inp(T)} value={nM.detalle} onChange={e=>setNM(p=>({...p,detalle:e.target.value}))} placeholder="Ej: ISO VG 220, reductores"/></div>
        </div>
        <button onClick={addM} style={{width:"100%",padding:"10px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,background:T.btnSuccess,color:"#fff"}}>+ Agregar material al catálogo</button>
      </div>
    </div>}
  </div>);
}

// ─── VISTA EQUIPOS ────────────────────────────────────
function VistaEquipos({equipos,setEquipos,T,catHerr,catMat}){
  const [busq,setBusq]=useState(""); const [ficha,setFicha]=useState(null); const [showNuevo,setShowNuevo]=useState(false);
  const [nEq,setNEq]=useState({nombre:"",tag:"",area:"",desc:""});
  const lista=equipos.filter(e=>{const q=busq.toLowerCase();return !q||[e.nombre,e.tag,e.area].some(s=>(s||"").toLowerCase().includes(q));});
  const guardar=(eq)=>setEquipos(p=>{const i=p.findIndex(e=>e.id===eq.id);if(i>=0){const n=[...p];n[i]=eq;return n;}return [...p,eq];});
  return(<div>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
      <div><div style={{fontSize:18,fontWeight:800,color:T.text}}>🏭 Base de Datos de Equipos</div><div style={{fontSize:12,color:T.textMuted,marginTop:2}}>{equipos.length} equipos registrados</div></div>
      <button onClick={()=>setShowNuevo(true)} style={{padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,background:T.btnPrimary,color:"#fff"}}>+ Nuevo equipo</button>
    </div>
    <input style={{...inp(T),marginBottom:16}} placeholder="🔍 Buscar por nombre, tag, área..." value={busq} onChange={e=>setBusq(e.target.value)}/>
    {lista.length===0?<div style={{textAlign:"center",padding:"60px 0",color:T.textMuted}}><div style={{fontSize:48,marginBottom:12}}>🏭</div><div style={{fontSize:15,fontWeight:600,color:T.textSub}}>Sin equipos registrados</div><div style={{fontSize:13,marginTop:6}}>Hacé clic en "+ Nuevo equipo" para empezar</div></div>:
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:12}}>
      {lista.map(eq=><div key={eq.id} style={{background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderRadius:12,padding:16,cursor:"pointer"}} onClick={()=>setFicha(eq)}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
          <div style={{flex:1}}><div style={{fontWeight:700,color:T.text,fontSize:14,marginBottom:3}}>{eq.nombre}</div><div style={{fontFamily:"monospace",fontSize:11,color:T.accentText}}>{eq.tag}</div><div style={{fontSize:11,color:T.textMuted,marginTop:2}}>{eq.area}</div></div>
          <button onClick={e=>{e.stopPropagation();if(window.confirm("¿Eliminar?"))setEquipos(p=>p.filter(x=>x.id!==eq.id));}} style={{background:"none",border:"none",color:"#ef4444",cursor:"pointer",fontSize:16}}>🗑</button>
        </div>
        <div style={{display:"flex",gap:8}}>
          {[{v:(eq.herramientas||[]).length,l:"🔩 Herramientas",c:"#f97316"},{v:(eq.materiales||[]).length,l:"🛢️ Materiales",c:"#0ea5e9"}].map(s=><div key={s.l} style={{flex:1,background:T.inputBg,borderRadius:8,padding:"8px 6px",textAlign:"center",border:`1px solid ${T.cardBorder}`}}><div style={{fontSize:18,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:T.textMuted}}>{s.l}</div></div>)}
        </div>
        <div style={{marginTop:10,fontSize:11,color:T.accentText,textAlign:"center",fontWeight:600}}>Tocar para ver / editar →</div>
      </div>)}
    </div>}
    {ficha&&<ModalFichaEquipo equipo={ficha} onClose={()=>setFicha(null)} onSave={guardar} T={T} catHerr={catHerr} catMat={catMat}/>}
    {showNuevo&&<Overlay onClose={()=>setShowNuevo(false)} maxW={440}>
      <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:20}}>🏭 Nuevo Equipo</div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12,marginBottom:20}}>
        <div style={{gridColumn:"1/-1"}}><div style={{fontSize:11,color:T.textMuted,marginBottom:4}}>Nombre *</div><input style={inp(T)} value={nEq.nombre} onChange={e=>setNEq(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Agitador 00105"/></div>
        <div><div style={{fontSize:11,color:T.textMuted,marginBottom:4}}>Tag / Código *</div><input style={inp(T)} value={nEq.tag} onChange={e=>setNEq(p=>({...p,tag:e.target.value}))} placeholder="Ej: 221AG-00105"/></div>
        <div><div style={{fontSize:11,color:T.textMuted,marginBottom:4}}>Área</div><input style={inp(T)} value={nEq.area} onChange={e=>setNEq(p=>({...p,area:e.target.value}))} placeholder="Ej: Área 221"/></div>
        <div style={{gridColumn:"1/-1"}}><div style={{fontSize:11,color:T.textMuted,marginBottom:4}}>Descripción</div><input style={inp(T)} value={nEq.desc} onChange={e=>setNEq(p=>({...p,desc:e.target.value}))} placeholder="Opcional"/></div>
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button onClick={()=>setShowNuevo(false)} style={{padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:"#334155",color:"#fff"}}>Cancelar</button>
        <button onClick={()=>{if(nEq.nombre&&nEq.tag){guardar({...nEq,id:Date.now().toString(),herramientas:[],materiales:[]});setNEq({nombre:"",tag:"",area:"",desc:""});setShowNuevo(false);}}} style={{padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,background:T.btnPrimary,color:"#fff"}}>Crear equipo →</button>
      </div>
    </Overlay>}
  </div>);
}

// ─── VISTA PLANIFICACIÓN ──────────────────────────────


// ─── PANEL TAREAS DEL DIA ─────────────────────────────
function PanelDia({tareas,sesion,grupos,T,onClose}){
  const tareasDia=tareas.filter(function(t){return t.enDia;});
  const miGrupo=sesion&&sesion.rol==="tecnico"
    ?grupos.find(function(g){return g.tecnicos.includes(sesion.nombre);})
    :null;
  const tareasVer=miGrupo
    ?tareasDia.filter(function(t){return miGrupo.tareas.includes(t.id);})
    :tareasDia;
  const compVer=tareasVer.filter(function(t){return t.est==="completada"||t.est==="con_anomalia";});
  return(
    <Overlay onClose={onClose} maxW={560}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:16}}>
        <div>
          <div style={{fontSize:16,fontWeight:800,color:T.text}}>Tareas del dia</div>
          <div style={{fontSize:12,color:T.textMuted,marginTop:2}}>
            {miGrupo?"Grupo: "+miGrupo.nombre:new Date().toLocaleDateString("es-AR",{weekday:"long",day:"2-digit",month:"long",year:"numeric"})}
          </div>
        </div>
        <button onClick={onClose} style={{background:"none",border:"none",color:T.textMuted,fontSize:22,cursor:"pointer"}}>x</button>
      </div>
      {tareasVer.length===0?(
        <div style={{textAlign:"center",padding:"40px 0"}}>
          <div style={{fontSize:40,marginBottom:12}}>☀️</div>
          <div style={{fontSize:14,fontWeight:600,color:T.textSub}}>
            {miGrupo?"El supervisor aun no asigno tareas a tu grupo":"Sin tareas asignadas al dia"}
          </div>
        </div>
      ):(
        <div>
          <div style={{display:"flex",gap:8,marginBottom:16}}>
            {[{l:"Total",v:tareasVer.length,c:T.accentText},{l:"Listas",v:compVer.length,c:"#34d399"},{l:"Pendientes",v:tareasVer.filter(function(t){return t.est==="pendiente";}).length,c:"#fbbf24"}].map(function(s){
              return(<div key={s.l} style={{flex:1,background:T.inputBg,borderRadius:8,padding:"10px 6px",textAlign:"center"}}>
                <div style={{fontSize:22,fontWeight:800,color:s.c}}>{s.v}</div>
                <div style={{fontSize:10,color:T.textMuted,marginTop:2}}>{s.l}</div>
              </div>);
            })}
          </div>
          {tareasVer.map(function(t){
            const ec=EST_CFG[t.est];
            return(
              <div key={t.id} style={{padding:"12px 0",borderBottom:"1px solid "+T.cardBorder}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,color:T.text,fontSize:13}}>{t.tarea}</div>
                    <div style={{fontSize:11,color:T.textMuted,marginTop:2}}>{t.equipo||"—"}</div>
                    {t.reg&&t.reg.tecnicos&&t.reg.tecnicos.length>0&&(
                      <div style={{fontSize:11,color:"#34d399",marginTop:2}}>👷 {t.reg.tecnicos.join(", ")}</div>
                    )}
                    {t.reg&&t.reg.anomalias&&(
                      <div style={{fontSize:11,color:"#f87171",marginTop:2}}>⚠ {t.reg.anomalias}</div>
                    )}
                  </div>
                  <span style={{display:"inline-flex",alignItems:"center",gap:3,background:ec.bg,border:"1px solid "+ec.border,color:ec.text,borderRadius:99,padding:"2px 8px",fontSize:10,fontWeight:600,flexShrink:0}}>{ec.icon} {ec.label}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Overlay>
  );
}

// ─── MODAL TAREA CORRECTIVA ───────────────────────────
function ModalCorrectiva({onClose,onSave,T}){
  const [equipo,setEquipo]=useState("");
  const [tarea,setTarea]=useState("");
  const [obs,setObs]=useState("");
  const fecha=new Date().toISOString().split("T")[0];
  return(
    <Overlay onClose={onClose} maxW={480}>
      <div style={{fontSize:16,fontWeight:700,color:T.text,marginBottom:4}}>🔧 Tarea Correctiva</div>
      <div style={{fontSize:12,color:T.textMuted,marginBottom:20}}>Sin OT planificada. Quedara registrada en el historial.</div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,color:T.textMuted,marginBottom:4}}>Equipo / Tag *</div>
        <input style={inp(T)} value={equipo} onChange={function(e){setEquipo(e.target.value);}} placeholder="Ej: 204BF102 / Bomba de piso"/>
      </div>
      <div style={{marginBottom:12}}>
        <div style={{fontSize:11,color:T.textMuted,marginBottom:4}}>Tarea realizada *</div>
        <textarea style={Object.assign({},inp(T),{height:80,resize:"vertical"})} value={tarea} onChange={function(e){setTarea(e.target.value);}} placeholder="Descripcion de la tarea correctiva realizada"/>
      </div>
      <div style={{marginBottom:20}}>
        <div style={{fontSize:11,color:T.textMuted,marginBottom:4}}>Observaciones</div>
        <textarea style={Object.assign({},inp(T),{height:60,resize:"vertical"})} value={obs} onChange={function(e){setObs(e.target.value);}} placeholder="Detalles adicionales, repuestos usados, etc."/>
      </div>
      <div style={{background:"rgba(239,68,68,.08)",border:"1px solid rgba(239,68,68,.2)",borderRadius:8,padding:10,marginBottom:16,fontSize:11,color:"#f87171"}}>
        Sin numero de OT. Se registra como correctiva no planificada con fecha de hoy: {fecha}
      </div>
      <div style={{display:"flex",gap:10,justifyContent:"flex-end"}}>
        <button onClick={onClose} style={{padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:"#334155",color:"#fff"}}>Cancelar</button>
        <button onClick={function(){
          if(!equipo||!tarea)return;
          onSave({
            id:"CORR_"+Date.now(),
            cat:"Correctiva",
            codigo:"",
            tarea:tarea,
            equipo:equipo,
            area:"Correctivas",
            orden:"",
            est:"completada",
            reg:{fecha:fecha,obs:obs,tecnicos:[],materiales:"",anomalias:"",inicio:"",fin:""},
            enDia:false
          });
          onClose();
        }} style={{padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,background:"#dc2626",color:"#fff"}}>🔧 Registrar correctiva</button>
      </div>
    </Overlay>
  );
}

// ─── MODAL GESTIÓN DE GRUPOS ──────────────────────────
function ModalGrupos({grupos,setGrupos,tecnicos,tareas,T,onClose}){
  const [grupoSel,setGrupoSel]=useState(null);
  const [mNuevoGrupo,setMNuevoGrupo]=useState(false);
  const [nomGrupo,setNomGrupo]=useState("");
  const [busqTarea,setBusqTarea]=useState("");

  const crearGrupo=function(){
    if(!nomGrupo.trim())return;
    const ng={id:"G"+Date.now(),nombre:nomGrupo.trim(),tecnicos:[],tareas:[]};
    setGrupos(function(p){return[...p,ng];});
    setGrupoSel(ng);
    setNomGrupo("");
    setMNuevoGrupo(false);
  };

  const toggleTecnico=function(gId,nombre){
    setGrupos(function(prev){
      return prev.map(function(g){
        if(g.id!==gId)return g;
        const tiene=g.tecnicos.includes(nombre);
        return Object.assign({},g,{tecnicos:tiene?g.tecnicos.filter(function(n){return n!==nombre;}):g.tecnicos.concat([nombre])});
      });
    });
    setGrupoSel(function(g){
      if(!g||g.id!==gId)return g;
      const tiene=g.tecnicos.includes(nombre);
      return Object.assign({},g,{tecnicos:tiene?g.tecnicos.filter(function(n){return n!==nombre;}):g.tecnicos.concat([nombre])});
    });
  };

  const toggleTarea=function(gId,tId){
    setGrupos(function(prev){
      return prev.map(function(g){
        if(g.id!==gId)return g;
        const tiene=g.tareas.includes(tId);
        return Object.assign({},g,{tareas:tiene?g.tareas.filter(function(x){return x!==tId;}):g.tareas.concat([tId])});
      });
    });
    setGrupoSel(function(g){
      if(!g||g.id!==gId)return g;
      const tiene=g.tareas.includes(tId);
      return Object.assign({},g,{tareas:tiene?g.tareas.filter(function(x){return x!==tId;}):g.tareas.concat([tId])});
    });
  };

  const eliminarGrupo=function(gId){
    setGrupos(function(p){return p.filter(function(g){return g.id!==gId;});});
    if(grupoSel&&grupoSel.id===gId)setGrupoSel(null);
  };

  const tareasDelDia=tareas.filter(function(t){return t.enDia;});
  const tareasFiltr=tareasDelDia.filter(function(t){
    if(!busqTarea)return true;
    const q=busqTarea.toLowerCase();
    return (t.tarea||"").toLowerCase().indexOf(q)>=0||(t.equipo||"").toLowerCase().indexOf(q)>=0;
  });

  const grupo=grupoSel?grupos.find(function(g){return g.id===grupoSel.id;})||grupoSel:null;

  return(
    <Overlay onClose={function(){}} maxW={700}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <div style={{fontSize:17,fontWeight:800,color:T.text}}>👥 Grupos de Trabajo</div>
          <div style={{fontSize:12,color:T.textMuted,marginTop:2}}>Asigna tecnicos y tareas del dia a cada grupo</div>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={function(){setMNuevoGrupo(true);}} style={{padding:"7px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:12,background:T.btnPrimary,color:"#fff"}}>+ Nuevo grupo</button>
          <button onClick={function(){onClose();}} style={{padding:"7px 14px",borderRadius:8,border:"1px solid #334155",cursor:"pointer",fontWeight:700,fontSize:12,background:"transparent",color:"#94a3b8"}}>✕ Cerrar</button>
        </div>
      </div>

      {mNuevoGrupo&&(
        <div style={{background:T.inputBg,border:"1px dashed "+T.cardBorder,borderRadius:10,padding:14,marginBottom:16,display:"flex",gap:8}}>
          <input style={Object.assign({},inp(T),{flex:1})} value={nomGrupo} onChange={function(e){setNomGrupo(e.target.value);}} placeholder="Nombre del grupo: Ej: Grupo A - Mecanica"/>
          <button onClick={crearGrupo} style={{padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:13,background:T.btnSuccess,color:"#fff"}}>Crear</button>
          <button onClick={function(){setMNuevoGrupo(false);setNomGrupo("");}} style={{padding:"8px 10px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:"#334155",color:"#fff"}}>X</button>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"1fr 1.6fr",gap:12}}>

        {/* LISTA DE GRUPOS */}
        <div>
          <div style={{fontSize:10,color:T.textMuted,fontWeight:700,letterSpacing:1,marginBottom:8}}>GRUPOS ({grupos.length})</div>
          {grupos.length===0&&<div style={{color:T.textMuted,fontSize:13,textAlign:"center",padding:20}}>Sin grupos creados</div>}
          {grupos.map(function(g){
            const sel=grupo&&grupo.id===g.id;
            return(
              <div key={g.id} onClick={function(){setGrupoSel(g);}} style={{background:sel?T.accent:T.inputBg,border:"1px solid "+(sel?T.accent:T.cardBorder),borderRadius:10,padding:"12px 14px",marginBottom:8,cursor:"pointer",transition:"all .15s"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
                  <div>
                    <div style={{fontWeight:700,color:sel?"#fff":T.text,fontSize:13}}>{g.nombre}</div>
                    <div style={{fontSize:11,color:sel?"rgba(255,255,255,.7)":T.textMuted,marginTop:3}}>
                      👷 {g.tecnicos.length} tecnicos · 📋 {g.tareas.length} tareas
                    </div>
                    {g.tecnicos.length>0&&<div style={{fontSize:10,color:sel?"rgba(255,255,255,.6)":T.textMuted,marginTop:2}}>{g.tecnicos.join(", ")}</div>}
                  </div>
                  <button onClick={function(e){e.stopPropagation();eliminarGrupo(g.id);}} style={{background:"none",border:"none",color:sel?"rgba(255,255,255,.6)":"#ef4444",cursor:"pointer",fontSize:14,padding:2}}>🗑</button>
                </div>
              </div>
            );
          })}
        </div>

        {/* EDITOR DEL GRUPO SELECCIONADO */}
        {grupo?(
          <div>
            <div style={{fontSize:13,fontWeight:700,color:T.text,marginBottom:10}}>✏️ Editando: {grupo.nombre}</div>

            {/* Tecnicos */}
            <div style={{fontSize:10,color:T.textMuted,fontWeight:700,letterSpacing:1,marginBottom:6}}>TECNICOS</div>
            <div style={{display:"flex",flexWrap:"wrap",gap:6,marginBottom:14}}>
              {tecnicos.map(function(n){
                const tiene=grupo.tecnicos.includes(n);
                return(
                  <button key={n} onClick={function(){toggleTecnico(grupo.id,n);}} style={{padding:"5px 12px",borderRadius:99,border:"1px solid "+(tiene?T.accent:T.cardBorder),background:tiene?T.accent:"transparent",color:tiene?"#fff":T.textMuted,cursor:"pointer",fontSize:12,fontWeight:600,transition:"all .15s"}}>
                    {tiene?"✓ ":""}{n}
                  </button>
                );
              })}
              {tecnicos.length===0&&<div style={{fontSize:12,color:T.textMuted}}>Primero agrega tecnicos desde el boton "Tecnicos"</div>}
            </div>

            {/* Tareas del dia */}
            <div style={{fontSize:10,color:T.textMuted,fontWeight:700,letterSpacing:1,marginBottom:6}}>
              TAREAS DEL DIA ({tareasDelDia.length})
            </div>
            {tareasDelDia.length===0&&(
              <div style={{fontSize:12,color:T.textMuted,padding:"10px 0"}}>No hay tareas asignadas al dia aun. Usa el boton en la tabla de planificacion.</div>
            )}
            {tareasDelDia.length>0&&(
              <input style={Object.assign({},inp(T),{marginBottom:8,fontSize:12})} value={busqTarea} onChange={function(e){setBusqTarea(e.target.value);}} placeholder="Buscar tarea..."/>
            )}
            <div style={{maxHeight:220,overflowY:"auto"}}>
              {tareasFiltr.map(function(t){
                const tiene=grupo.tareas.includes(t.id);
                const ec=EST_CFG[t.est];
                return(
                  <div key={t.id} onClick={function(){toggleTarea(grupo.id,t.id);}} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 10px",borderRadius:8,marginBottom:4,background:tiene?"rgba(52,211,153,.08)":T.inputBg,border:"1px solid "+(tiene?"rgba(52,211,153,.3)":T.cardBorder),cursor:"pointer",transition:"all .15s"}}>
                    <div style={{flex:1}}>
                      <div style={{fontSize:12,fontWeight:600,color:T.text}}>{t.tarea}</div>
                      <div style={{fontSize:10,color:T.textMuted}}>{t.equipo}</div>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:6,flexShrink:0}}>
                      <span style={{fontSize:10,color:ec.text}}>{ec.icon}</span>
                      <span style={{fontSize:11,fontWeight:700,color:tiene?"#34d399":T.textMuted}}>{tiene?"✓ Asignada":"+ Asignar"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ):(
          <div style={{display:"flex",alignItems:"center",justifyContent:"center",color:T.textMuted,fontSize:13,textAlign:"center",padding:20}}>
            <div>
              <div style={{fontSize:36,marginBottom:8}}>👈</div>
              <div>Selecciona un grupo para editarlo</div>
            </div>
          </div>
        )}
      </div>
    </Overlay>
  );
}

function Tablero({tareas,setTareas,tecnicos,paradas,T,equipos,puede,sesion,grupos,setGrupos}){
  const [busq,setBusq]=useState(""); const [filtArea,setFiltArea]=useState("Todas"); const [filtEst,setFiltEst]=useState("Todos");
  const [modalReg,setModalReg]=useState(null); const [showDia,setShowDia]=useState(false);
  const [showCorrectiva,setShowCorrectiva]=useState(false);
  const [showGrupos,setShowGrupos]=useState(false);
  const areas=useMemo(()=>["Todas",...new Set(tareas.map(t=>t.area))].sort((a,b)=>a==="Todas"?-1:a.localeCompare(b)),[tareas]);
  const miGrupoTab=sesion&&sesion.rol==="tecnico"?grupos.find(function(g){return g.tecnicos.includes(sesion.nombre);}):null;
  const lista=useMemo(()=>tareas.filter(function(t){
    const q=busq.toLowerCase();
    const matchQ=!q||[t.tarea,t.equipo,t.codigo,t.orden].some(function(s){return(s||"").toLowerCase().includes(q);});
    const matchA=filtArea==="Todas"||t.area===filtArea;
    const matchE=filtEst==="Todos"||t.est===filtEst;
    // Si es tecnico, mostrar solo tareas de su grupo
    const matchG=!miGrupoTab||miGrupoTab.tareas.includes(t.id);
    return matchQ&&matchA&&matchE&&matchG;
  }),[tareas,busq,filtArea,filtEst,miGrupoTab]);
  const stats=useMemo(()=>{const s={total:tareas.length,pendiente:0,en_proceso:0,completada:0,con_anomalia:0};tareas.forEach(t=>s[t.est]=(s[t.est]||0)+1);return s;},[tareas]);
  const pct=Math.round(((stats.completada+stats.con_anomalia)/Math.max(stats.total,1))*100);
  const tareasDia=tareas.filter(t=>t.enDia); const diaComp=tareasDia.filter(t=>t.est==="completada"||t.est==="con_anomalia");
  const diaPct=tareasDia.length>0?Math.round(diaComp.length/tareasDia.length*100):0;
  const paradasProx=(paradas||[]).filter(p=>p.fecha&&diasRestantes(p.fecha)>=0).sort((a,b)=>new Date(a.fecha)-new Date(b.fecha));
  const saveReg=(id,f)=>setTareas(p=>p.map(t=>t.id===id?{...t,est:f.est,reg:f}:t));
  const toggleDia=(id)=>setTareas(p=>p.map(t=>t.id===id?{...t,enDia:!t.enDia}:t));

  // Buscar ficha de equipo
  const getFicha=(tarea)=>equipos.find(e=>e.nombre===tarea.equipo||e.tag===tarea.codigo)||null;
  const addCorrectiva=(t)=>setTareas(p=>[...p,t]);

  return(<div>
    {/* PARADAS */}
    {paradasProx.length>0&&<div style={{display:"flex",gap:10,marginBottom:16,flexWrap:"wrap"}}>
      {paradasProx.map((p,i)=>{const d=diasRestantes(p.fecha);const urg=d<=3;const fd=new Date(p.fecha+"T00:00:00").toLocaleDateString("es-AR",{weekday:"short",day:"2-digit",month:"short"});return(<div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",borderRadius:10,background:urg?"linear-gradient(135deg,#7f1d1d,#92400e)":"linear-gradient(135deg,#78350f,#1e293b)",border:urg?"1px solid #dc2626":"1px solid #b45309",animation:urg?"pulse 2s infinite":"none"}}><span style={{fontSize:20}}>🏭</span><div><div style={{fontSize:10,fontWeight:800,color:urg?"#fca5a5":"#fdba74",textTransform:"uppercase"}}>PARADA · {p.planta}</div><div style={{fontSize:13,fontWeight:700,color:"#f8fafc"}}>{fd}</div></div><div style={{background:urg?"#dc2626":"#b45309",borderRadius:8,padding:"4px 10px",textAlign:"center",marginLeft:4}}><div style={{fontSize:20,fontWeight:900,color:"#fff",lineHeight:1}}>{d}</div><div style={{fontSize:9,color:"rgba(255,255,255,.8)",fontWeight:700}}>{d===0?"HOY":d===1?"MAÑANA":"DÍAS"}</div></div></div>);})}
    </div>}

    {/* STATS */}
    <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(72px,1fr))",gap:8,marginBottom:16}}>
      {[{l:"Total",v:stats.total,c:"#60a5fa",bg:T.cardBg,br:T.cardBorder},{l:"Pendientes",v:stats.pendiente,c:T.textSub,bg:T.cardBg,br:T.cardBorder},{l:"En proceso",v:stats.en_proceso,c:"#fbbf24",bg:T.cardBg,br:T.cardBorder},{l:"Completadas",v:stats.completada,c:"#34d399",bg:T.cardBg,br:T.cardBorder},{l:"⚠ Anom.",v:stats.con_anomalia,c:"#f87171",bg:T.statAnomBg,br:T.statAnomBorder}].map(s=><div key={s.l} style={{background:s.bg,border:`1px solid ${s.br}`,borderRadius:10,padding:"12px 6px",textAlign:"center"}}><div style={{fontSize:22,fontWeight:800,color:s.c,lineHeight:1}}>{s.v}</div><div style={{fontSize:10,color:s.l==="⚠ Anom."?s.c:T.textMuted,marginTop:4,fontWeight:s.l==="⚠ Anom."?700:400}}>{s.l}</div></div>)}
      <div style={{background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderRadius:10,padding:"14px 14px",gridColumn:"span 2",display:"flex",flexDirection:"column",justifyContent:"center"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:11,color:T.textMuted,fontWeight:700}}>PROGRESO</span><span style={{fontSize:22,fontWeight:900,color:T.text}}>{pct}%</span></div>
        <div style={{background:T.inputBg,borderRadius:99,height:14,overflow:"hidden"}}><div style={{width:`${pct}%`,height:"100%",background:T.progressBar,borderRadius:99,transition:"width .6s"}}/></div>
        <div style={{fontSize:10,color:T.textMuted,marginTop:6}}>{stats.completada+stats.con_anomalia} de {stats.total} ejecutadas</div>
      </div>
      {(!sesion||sesion.rol==="tecnico"||sesion.rol==="admin")&&(
      <div onClick={()=>setShowDia(true)} style={{background:T.dayCardBg,border:"1px solid "+T.dayCardBorder,borderRadius:10,padding:"14px 14px",gridColumn:"span 2",cursor:"pointer",display:"flex",flexDirection:"column",justifyContent:"center"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}><span style={{fontSize:11,color:T.accentText,fontWeight:700}}>📅 TAREAS DEL DIA</span><span style={{fontSize:22,fontWeight:900,color:T.text}}>{tareasDia.length}</span></div>
        <div style={{background:T.inputBg,borderRadius:99,height:14,overflow:"hidden"}}><div style={{width:diaPct+"%",height:"100%",background:T.dayBar,borderRadius:99,transition:"width .6s"}}/></div>
        <div style={{display:"flex",justifyContent:"space-between",marginTop:6}}><span style={{fontSize:10,color:T.accentText}}>{diaComp.length} listas</span><span style={{fontSize:10,color:T.textMuted}}>Ver →</span></div>
      </div>
      )}
    </div>

    {/* BOTONES SUPERVISOR */}
    {(puede&&(puede("cargarPlan")||puede("asignarTareas")))&&(
      <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
        {puede&&puede("asignarTareas")&&<button onClick={function(){setShowGrupos(true);}} style={{padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:12,background:"linear-gradient(135deg,#7c3aed,#4f46e5)",color:"#fff"}}>👥 Gestionar grupos de trabajo</button>}
        {puede&&puede("cargarPlan")&&<button onClick={function(){setShowCorrectiva(true);}} style={{padding:"8px 16px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:12,background:"linear-gradient(135deg,#dc2626,#b91c1c)",color:"#fff"}}>🔧 + Tarea correctiva</button>}
      </div>
    )}

    {/* GRUPOS DEL DIA - solo admin y supervisor */}
    {grupos&&grupos.length>0&&sesion&&sesion.rol!=='tecnico'&&(
      <div style={{marginBottom:16}}>
        <div style={{fontSize:10,color:T.textMuted,fontWeight:700,letterSpacing:1,marginBottom:8}}>GRUPOS DEL DIA</div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          {grupos.map(function(g){
            const tarGrupo=tareas.filter(function(t){return g.tareas.includes(t.id);});
            const comp=tarGrupo.filter(function(t){return t.est==="completada"||t.est==="con_anomalia";}).length;
            const pctG=tarGrupo.length>0?Math.round(comp/tarGrupo.length*100):0;
            return(
              <div key={g.id} style={{background:T.cardBg,border:"1px solid "+T.cardBorder,borderRadius:12,padding:"12px 16px",minWidth:180}}>
                <div style={{fontWeight:700,color:T.text,fontSize:13,marginBottom:4}}>{g.nombre}</div>
                <div style={{fontSize:11,color:T.textMuted,marginBottom:6}}>{g.tecnicos.join(", ")||"Sin tecnicos"}</div>
                <div style={{display:"flex",justifyContent:"space-between",marginBottom:6}}>
                  <span style={{fontSize:11,color:T.textMuted}}>{tarGrupo.length} tareas · {comp} listas</span>
                  <span style={{fontSize:12,fontWeight:800,color:pctG>=80?"#34d399":pctG>=50?"#fbbf24":"#f87171"}}>{pctG}%</span>
                </div>
                <div style={{background:T.inputBg,borderRadius:99,height:6,overflow:"hidden"}}>
                  <div style={{width:pctG+"%",height:"100%",background:T.progressBar,borderRadius:99,transition:"width .5s"}}/>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    )}

    {/* FILTROS */}
    <div style={{display:"flex",gap:8,marginBottom:12,flexWrap:"wrap"}}>
      <input style={{...inp(T),flex:"1 1 180px"}} placeholder="🔍  Buscar equipo, tarea, código, N° orden..." value={busq} onChange={e=>setBusq(e.target.value)}/>
      <select style={{...inp(T),flex:"0 0 auto",minWidth:110}} value={filtArea} onChange={e=>setFiltArea(e.target.value)}>{areas.map(a=><option key={a}>{a}</option>)}</select>
      <select style={{...inp(T),flex:"0 0 auto",minWidth:130}} value={filtEst} onChange={e=>setFiltEst(e.target.value)}><option value="Todos">Todos los estados</option>{Object.entries(EST_CFG).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}</select>
    </div>
    <div style={{fontSize:11,color:T.textMuted,marginBottom:10}}>Mostrando {lista.length} de {tareas.length} tareas</div>

    {/* TABLA */}
    <div style={{background:T.cardBg,borderRadius:12,border:`1px solid ${T.cardBorder}`,overflow:"hidden"}}>
      <div style={{overflowX:"auto",WebkitOverflowScrolling:"touch"}}>
        <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,minWidth:660}}>
          <thead><tr style={{background:T.theadBg}}>
            {(sesion&&sesion.rol==="tecnico"?["Equipo","Tarea / Código","Estado","Registrar","Categoría","N° Orden"]:["Equipo","Tarea / Código","Estado","Registrar","☀️ Día","Grupo","Categoría","N° Orden"]).map(h=><th key={h} style={{padding:"10px 12px",textAlign:"left",color:T.textMuted,fontWeight:700,fontSize:10,textTransform:"uppercase",letterSpacing:.7,borderBottom:`1px solid ${T.cardBorder}`,whiteSpace:"nowrap"}}>{h}</th>)}
          </tr></thead>
          <tbody>
            {lista.map((t,i)=>{
              const ec=EST_CFG[t.est]; const cc=CAT_C[t.cat]||T.textMuted;
              const ficha=getFicha(t);
              return(<tr key={t.id} style={{background:i%2===0?T.cardBg:T.rowAlt,borderBottom:`1px solid ${T.cardBorder}`}}>
                <td style={{padding:"10px 12px",minWidth:100}}>
                  <div style={{fontWeight:600,color:T.text,fontSize:12}}>{t.equipo||"—"}</div>
                  {ficha&&<div style={{fontSize:10,marginTop:2,display:"flex",gap:6}}>
                    {(ficha.herramientas||[]).length>0&&<span style={{color:"#f97316"}}>🔩{ficha.herramientas.length}</span>}
                    {(ficha.materiales||[]).length>0&&<span style={{color:"#0ea5e9"}}>🛢️{ficha.materiales.length}</span>}
                  </div>}
                </td>
                <td style={{padding:"10px 12px",maxWidth:220}}>
                  <div style={{fontWeight:600,color:T.text}}>{t.tarea}</div>
                  {t.codigo&&<div style={{fontSize:10,color:T.textMuted,fontFamily:"monospace",marginTop:2}}>{t.codigo}</div>}
                  {t.reg?.anomalias&&<div style={{fontSize:10,color:"#f87171",marginTop:2}}>⚠ {t.reg.anomalias}</div>}
                  {t.reg?.tecnicos?.length>0&&<div style={{fontSize:10,color:"#34d399",marginTop:2}}>👷 {t.reg.tecnicos.join(", ")}{t.reg.fecha?` · ${t.reg.fecha}`:""}</div>}
                </td>
                <td style={{padding:"10px 12px",whiteSpace:"nowrap"}}><span style={{display:"inline-flex",alignItems:"center",gap:4,background:ec.bg,border:`1px solid ${ec.border}`,color:ec.text,borderRadius:99,padding:"3px 8px",fontSize:10,fontWeight:600}}>{ec.icon} {ec.label}</span></td>
                <td style={{padding:"10px 12px",whiteSpace:"nowrap"}}>{puede&&puede("registrar")&&(
                  // Tecnico solo puede registrar si la tarea esta en su grupo
                  sesion.rol!=="tecnico"||(miGrupoTab&&miGrupoTab.tareas.includes(t.id))
                )&&<button style={{padding:"5px 10px",borderRadius:8,border:"none",background:T.btnSuccess,color:"#fff",fontSize:11,fontWeight:600,cursor:"pointer"}} onClick={()=>setModalReg(t)}>{t.reg?"✏ Editar":"✏ Registrar"}</button>}</td>
                {sesion&&sesion.rol!=="tecnico"&&(
                <td style={{padding:"10px 12px",textAlign:"center",whiteSpace:"nowrap"}}>
                  {puede&&puede("asignarTareas")&&<button onClick={()=>toggleDia(t.id)} title={t.enDia?"Quitar del dia":"Agregar al dia"} style={{width:32,height:32,borderRadius:8,border:t.enDia?"1px solid "+T.accent:"1px solid "+T.cardBorder,cursor:"pointer",fontSize:15,background:t.enDia?T.accent:"transparent",color:t.enDia?"#fff":T.textMuted,transition:"all .15s"}}>{t.enDia?"☀️":"+"}</button>}
                </td>
                )}
                {sesion&&sesion.rol!=="tecnico"&&(
                <td style={{padding:"8px 10px",whiteSpace:"nowrap"}}>
                  {grupos&&grupos.length>0?(
                    <select value={(grupos.find(function(g){return g.tareas.includes(t.id);})||{id:""}).id}
                      onChange={function(e){const gId=e.target.value;setGrupos(function(prev){return prev.map(function(g){if(g.id===gId){if(!g.tareas.includes(t.id))return Object.assign({},g,{tareas:g.tareas.concat([t.id])});return g;}return Object.assign({},g,{tareas:g.tareas.filter(function(x){return x!==t.id;})});});});}}
                      style={{background:T.inputBg,border:"1px solid "+T.cardBorder,borderRadius:6,color:T.text,padding:"4px 6px",fontSize:11,maxWidth:130,cursor:"pointer"}}>
                      <option value="">Sin grupo</option>
                      {grupos.map(function(g){return(<option key={g.id} value={g.id}>{g.nombre}</option>);})}
                    </select>
                  ):<span style={{fontSize:10,color:T.textMuted}}>—</span>}
                </td>
                )}
                <td style={{padding:"10px 12px",whiteSpace:"nowrap"}}><span style={{display:"inline-flex",alignItems:"center",gap:5,fontSize:11,fontWeight:700,color:cc}}><span style={{width:6,height:6,borderRadius:"50%",background:cc,flexShrink:0}}/>{t.cat}</span></td>
                <td style={{padding:"10px 12px",whiteSpace:"nowrap"}}><span style={{fontFamily:"monospace",fontSize:12,color:T.accentText}}>{t.orden||"—"}</span></td>
              </tr>);
            })}
          </tbody>
        </table>
      </div>
    </div>

    {/* PANEL TAREAS DEL DÍA */}
    {showDia&&<PanelDia tareas={tareas} sesion={sesion} grupos={grupos} T={T} onClose={function(){setShowDia(false);}}/>}

    {modalReg&&<ModalRegistro t={modalReg} tecnicos={tecnicos} onClose={()=>setModalReg(null)} onSave={f=>saveReg(modalReg.id,f)} T={T}/>}
    {showCorrectiva&&<ModalCorrectiva onClose={function(){setShowCorrectiva(false);}} onSave={addCorrectiva} T={T}/>}
    {showGrupos&&<ModalGrupos grupos={grupos} setGrupos={setGrupos} tecnicos={tecnicos} tareas={tareas} T={T} onClose={function(){setShowGrupos(false);}}/>}
  </div>);
}

// ─── VISTA RESUMEN ────────────────────────────────────
function Resumen({planActual,T}){
  const {periodo,tareas}=planActual;
  const ejecutadas=tareas.filter(t=>t.est==="completada"||t.est==="con_anomalia");
  const anomalias=tareas.filter(t=>t.est==="con_anomalia");
  const pendientes=tareas.filter(t=>t.est==="pendiente");
  const porArea=useMemo(()=>{const m={};ejecutadas.forEach(t=>{if(!m[t.area])m[t.area]=[];m[t.area].push(t);});return m;},[ejecutadas]);
  const exportCSV=()=>{const cols=["Equipo","Tarea","Estado","Técnicos","Fecha","Inicio","Fin","Materiales","Anomalías","Obs","Categoría","Orden"];const rows=tareas.map(t=>[t.equipo,t.tarea,EST_CFG[t.est].label,(t.reg?.tecnicos||[]).join(";"),t.reg?.fecha||"",t.reg?.inicio||"",t.reg?.fin||"",t.reg?.materiales||"",t.reg?.anomalias||"",t.reg?.obs||"",t.cat,t.orden].map(v=>`"${String(v).replace(/"/g,'""')}"`).join(","));const blob=new Blob(["\uFEFF"+[cols.join(","),...rows].join("\n")],{type:"text/csv;charset=utf-8;"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`Lubricacion.csv`;a.click();};
  const compartir=async(m)=>{const txt=`📋 *REPORTE LUBRICACIÓN*\nPeríodo: ${periodo}\n✅ ${ejecutadas.length} ejecutadas | ⚠️ ${anomalias.length} anomalías | ⏳ ${pendientes.length} pendientes${anomalias.length>0?"\n\n⚠️ Anomalías:\n"+anomalias.map(t=>`• ${t.tarea}: ${t.reg?.anomalias}`).join("\n"):""}`;if(m==="wa")window.open(`https://wa.me/?text=${encodeURIComponent(txt)}`,"_blank");else if(m==="mail")window.open(`mailto:?subject=Reporte Lubricación&body=${encodeURIComponent(txt)}`,"_blank");else{await navigator.clipboard.writeText(txt);alert("Copiado al portapapeles");}};
  return(<div>
    <div style={{background:"linear-gradient(135deg,#052e16,#1e293b)",border:"1px solid #065f46",borderRadius:12,padding:"20px 24px",marginBottom:16}}>
      <div style={{fontSize:18,fontWeight:800,color:"#f8fafc",marginBottom:4}}>📋 Resumen del período</div>
      <div style={{fontSize:12,color:"#64748b",marginBottom:16}}>{periodo}</div>
      <div style={{display:"flex",gap:24,flexWrap:"wrap"}}>{[{l:"Ejecutadas",v:ejecutadas.length,c:"#34d399"},{l:"Anomalías",v:anomalias.length,c:"#f87171"},{l:"Pendientes",v:pendientes.length,c:"#94a3b8"},{l:"Total",v:tareas.length,c:"#60a5fa"}].map(s=><div key={s.l} style={{textAlign:"center"}}><div style={{fontSize:28,fontWeight:800,color:s.c,lineHeight:1}}>{s.v}</div><div style={{fontSize:11,color:"#64748b",marginTop:3}}>{s.l}</div></div>)}</div>
    </div>
    <div style={{background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderRadius:12,padding:20,marginBottom:16}}>
      <div style={{fontSize:12,fontWeight:700,color:T.textSub,marginBottom:14}}>📤 EXPORTAR Y COMPARTIR</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:14}}>
        <button onClick={exportCSV} style={{padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:T.btnSuccess,color:"#fff"}}>📊 Excel (CSV)</button>
      </div>
      <div style={{fontSize:11,color:T.textMuted,marginBottom:8}}>COMPARTIR</div>
      <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
        <button onClick={()=>compartir("wa")} style={{padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:"#25D366",color:"#fff"}}>💬 WhatsApp</button>
        <button onClick={()=>compartir("mail")} style={{padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:T.btnPrimary,color:"#fff"}}>✉️ Email</button>
        <button onClick={()=>compartir("copy")} style={{padding:"8px 14px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:"#334155",color:"#fff"}}>📋 Copiar</button>
      </div>
    </div>
    {anomalias.length>0&&<div style={{background:"#450a0a",border:"1px solid #991b1b",borderRadius:12,padding:20,marginBottom:16}}>
      <div style={{fontSize:12,fontWeight:700,color:"#f87171",marginBottom:12}}>⚠️ ANOMALÍAS ({anomalias.length})</div>
      {anomalias.map(t=><div key={t.id} style={{padding:"10px 0",borderBottom:"1px solid #7f1d1d"}}><div style={{fontWeight:600,color:"#fca5a5"}}>{t.tarea}</div><div style={{fontSize:12,color:"#f87171",marginTop:3}}>{t.reg?.anomalias}</div><div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{t.equipo} · {t.reg?.tecnicos?.length>0?`👷 ${t.reg.tecnicos.join(", ")}`:""}</div></div>)}
    </div>}
    {Object.keys(porArea).length>0&&<div style={{background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderRadius:12,padding:20,marginBottom:16}}>
      <div style={{fontSize:12,fontWeight:700,color:"#34d399",marginBottom:16}}>✅ EJECUTADAS POR ÁREA</div>
      {Object.entries(porArea).map(([area,ts])=><div key={area} style={{marginBottom:16}}>
        <div style={{fontSize:10,fontWeight:700,color:T.textMuted,textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>{area} ({ts.length})</div>
        {ts.map(t=><div key={t.id} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${T.cardBorder}`,gap:12}}>
          <div style={{flex:1}}><div style={{fontSize:13,fontWeight:500,color:T.text}}>{t.tarea}</div><div style={{fontSize:11,color:T.textMuted}}>{t.equipo}</div>{t.reg&&<div style={{fontSize:11,color:T.textSub,marginTop:2}}>{t.reg.tecnicos?.length>0?`👷 ${t.reg.tecnicos.join(", ")}`:""}{t.reg.fecha?` · 📅 ${t.reg.fecha}`:""}{t.reg.inicio?` · ⏱ ${t.reg.inicio}–${t.reg.fin}`:""}</div>}</div>
          <span style={{fontFamily:"monospace",fontSize:11,color:T.accentText,flexShrink:0}}>{t.orden||"—"}</span>
        </div>)}
      </div>)}
    </div>}
    {pendientes.length>0&&<div style={{background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderRadius:12,padding:20}}>
      <div style={{fontSize:12,fontWeight:700,color:T.textSub,marginBottom:12}}>⏳ NO EJECUTADAS ({pendientes.length})</div>
      {pendientes.map(t=><div key={t.id} style={{display:"flex",justifyContent:"space-between",padding:"7px 0",borderBottom:`1px solid ${T.cardBorder}`,fontSize:12,color:T.textMuted}}><span><span style={{color:T.textSub,fontWeight:500}}>{t.tarea}</span> · {t.equipo||t.cat}</span><span style={{fontFamily:"monospace",color:T.textMuted}}>{t.orden||"—"}</span></div>)}
    </div>}
  </div>);
}

// ─── VISTA HISTORIAL ──────────────────────────────────
function Historial({historial,T}){
  const [abierto,setAbierto]=useState(null);
  if(historial.length===0)return(<div style={{textAlign:"center",padding:60,color:T.textMuted}}><div style={{fontSize:40,marginBottom:12}}>🗂️</div><div style={{fontSize:16,fontWeight:600,color:T.textSub}}>Sin historial aún</div><div style={{fontSize:13,marginTop:6}}>Las planificaciones cerradas aparecerán aquí</div></div>);
  return(<div>
    <div style={{fontSize:12,color:T.textMuted,marginBottom:16}}>📂 {historial.length} planificación(es) cerrada(s)</div>
    {historial.map((h,i)=>{const comp=h.tareas.filter(t=>t.est==="completada"||t.est==="con_anomalia").length;const anom=h.tareas.filter(t=>t.est==="con_anomalia").length;const pend=h.tareas.filter(t=>t.est==="pendiente").length;const pct=Math.round((comp/Math.max(h.tareas.length,1))*100);const open=abierto===i;return(<div key={i} style={{background:T.cardBg,border:`1px solid ${T.cardBorder}`,borderRadius:12,marginBottom:12,overflow:"hidden"}}>
      <div style={{padding:"16px 20px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center"}} onClick={()=>setAbierto(open?null:i)}>
        <div><div style={{fontWeight:700,color:T.text,marginBottom:4}}>📅 {h.periodo}</div><div style={{fontSize:12,color:T.textMuted}}>Cerrada: {h.fechaCierre} · {h.tareas.length} tareas</div></div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          {[{v:comp,c:"#34d399",l:"Ej."},{v:anom,c:"#f87171",l:"Anom."},{v:pend,c:T.textSub,l:"Pend."}].map(s=><div key={s.l} style={{textAlign:"center"}}><div style={{fontSize:18,fontWeight:800,color:s.c}}>{s.v}</div><div style={{fontSize:10,color:T.textMuted}}>{s.l}</div></div>)}
          <div style={{background:T.inputBg,borderRadius:99,width:42,height:42,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:14,color:pct>=80?"#34d399":pct>=50?"#fbbf24":"#f87171"}}>{pct}%</div>
          <span style={{color:T.textMuted,fontSize:16}}>{open?"▲":"▼"}</span>
        </div>
      </div>
      {open&&<div style={{padding:"0 20px 20px",borderTop:`1px solid ${T.cardBorder}`}}>
        {anom>0&&<div style={{marginTop:16,marginBottom:12}}><div style={{fontSize:11,color:"#f87171",fontWeight:700,marginBottom:8}}>⚠️ ANOMALÍAS</div>{h.tareas.filter(t=>t.est==="con_anomalia").map(t=><div key={t.id} style={{fontSize:12,color:"#fca5a5",padding:"4px 0"}}>• {t.tarea} — {t.reg?.anomalias}</div>)}</div>}
        <div style={{marginTop:12}}><div style={{fontSize:11,color:T.textMuted,fontWeight:700,marginBottom:8}}>TODAS LAS TAREAS</div>
          {h.tareas.map(t=>{const ec=EST_CFG[t.est];return(<div key={t.id} style={{display:"flex",justifyContent:"space-between",padding:"6px 0",borderBottom:`1px solid ${T.cardBorder}`,fontSize:12}}><div><span style={{color:ec.text}}>{ec.icon}</span><span style={{color:T.textSub,marginLeft:6}}>{t.equipo||"—"}</span><span style={{color:T.textMuted}}> — </span><span style={{color:T.text}}>{t.tarea}</span>{t.reg?.tecnicos?.length>0&&<span style={{color:"#34d399",marginLeft:8}}>👷 {t.reg.tecnicos.join(", ")}</span>}</div><span style={{fontFamily:"monospace",color:T.textMuted,flexShrink:0}}>{t.orden||"—"}</span></div>);})}
        </div>
      </div>}
    </div>);})}
  </div>);
}

// ─── APP ROOT ─────────────────────────────────────────

// ─── MODAL ALERTA DE VIENTO ───────────────────────────
function ModalViento({viento,onClose,onSave}){
  const [sel,setSel]=useState(viento);
  const opciones=[
    {id:"normal",  icon:"💨", label:"Viento Normal",      sub:"Sin restricciones de actividad. Operaciones con normalidad.",          bg:"linear-gradient(135deg,#15803d,#166534)", border:"#16a34a", glow:"rgba(22,163,74,.4)"},
    {id:"alerta1", icon:"⚠️", label:"Alerta de Viento 1", sub:"Precaucion. Actividades al aire libre con restricciones de seguridad.", bg:"linear-gradient(135deg,#ca8a04,#92400e)", border:"#d97706", glow:"rgba(217,119,6,.4)"},
    {id:"alerta2", icon:"🚨", label:"ALERTA DE VIENTO 2", sub:"SUSPENDIDAS todas las actividades al aire libre. Retirarse a zonas seguras.", bg:"linear-gradient(135deg,#dc2626,#7f1d1d)", border:"#ef4444", glow:"rgba(220,38,38,.6)"},
  ];
  return(
    <Overlay onClose={onClose} maxW={440}>
      <div style={{fontSize:18,fontWeight:800,color:"#f8fafc",marginBottom:4}}>💨 Nivel de Alerta de Viento</div>
      <div style={{fontSize:12,color:"#64748b",marginBottom:20}}>Selecciona el nivel. Se mostrara en el header de todos los usuarios.</div>
      {opciones.map(function(v){
        const activo=sel===v.id;
        return(
          <button key={v.id} onClick={function(){setSel(v.id);}} style={{
            width:"100%",padding:"20px 22px",borderRadius:14,marginBottom:12,
            border:"2px solid "+(activo?v.border:"rgba(255,255,255,.08)"),
            cursor:"pointer",background:activo?v.bg:"rgba(255,255,255,.03)",
            color:"#fff",textAlign:"left",display:"block",
            boxShadow:activo?"0 0 24px "+v.glow+",0 8px 30px rgba(0,0,0,.4)":"none",
            transition:"all .2s"
          }}>
            <div style={{fontSize:32,marginBottom:8}}>{v.icon}</div>
            <div style={{fontSize:20,fontWeight:900,letterSpacing:.5,marginBottom:8}}>{v.label}</div>
            <div style={{fontSize:13,opacity:.85,fontWeight:400,lineHeight:1.5}}>{v.sub}</div>
            {activo&&<div style={{marginTop:12,fontSize:12,background:"rgba(255,255,255,.15)",borderRadius:6,padding:"5px 12px",display:"inline-block",fontWeight:700,letterSpacing:.5}}>✓ SELECCIONADO</div>}
          </button>
        );
      })}
      <div style={{display:"flex",gap:10,marginTop:8,justifyContent:"flex-end"}}>
        <button onClick={onClose} style={{padding:"10px 20px",borderRadius:8,border:"1px solid #334155",cursor:"pointer",fontWeight:600,fontSize:13,background:"transparent",color:"#94a3b8"}}>Cancelar</button>
        <button onClick={function(){onSave(sel);}} style={{padding:"10px 28px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:800,fontSize:14,background:"linear-gradient(135deg,#d4af37,#b8860b)",color:"#000",letterSpacing:.5}}>💾 Guardar</button>
      </div>
    </Overlay>
  );
}

export default function App(){
  const [tema,setTema]=useState(()=>LS.get("lubri_tema","A"));
  const [sesion,setSesion]=useState(()=>LS.get("lubri_sesion",null));
  const [usuarios,setUsuarios]=useState(()=>LS.get("lubri_usuarios",USUARIOS_INIT));
  const [areaActiva,setAreaActiva]=useState(()=>LS.get("lubri_area",null));
  const [vista,setVista]=useState("planificacion");
  const [tareas,setTareas]=useState(()=>LS.get("lubri_tareas",TAREAS_INIT));
  const [periodo,setPeriodo]=useState(()=>LS.get("lubri_periodo",PERIODO_DEFAULT));
  const [historial,setHistorial]=useState(()=>LS.get("lubri_historial",[]));
  const [tecnicos,setTecnicos]=useState(()=>LS.get("lubri_tecnicos",["Barboza"]));
  const [paradas,setParadas]=useState(()=>LS.get("lubri_paradas",[]));
  const [equipos,setEquipos]=useState(()=>LS.get("lubri_equipos",[]));
  const [grupos,setGrupos]=useState(()=>LS.get("lubri_grupos",[]));
  const [catHerr,setCatHerr]=useState(()=>{const v=LS.get("lubri_catHerr",[]);return v.length>0?v:HERRAMIENTAS_INIT;});
  const [catMat,setCatMat]=useState(()=>{const v=LS.get("lubri_catMat",[]);return v.length>0?v:MATERIALES_INIT;});
  const [mTec,setMTec]=useState(false); const [mNueva,setMNueva]=useState(false);
  const [mCerrar,setMCerrar]=useState(false); const [mParada,setMParada]=useState(false);
  const [mUsuarios,setMUsuarios]=useState(false);
  const [viento,setViento]=useState("normal"); // normal | alerta1 | alerta2
  const [mViento,setMViento]=useState(false);

  useEffect(()=>LS.set("lubri_tema",tema),[tema]);
  useEffect(()=>LS.set("lubri_sesion",sesion),[sesion]);
  useEffect(()=>LS.set("lubri_usuarios",usuarios),[usuarios]);
  useEffect(()=>LS.set("lubri_area",areaActiva),[areaActiva]);
  useEffect(()=>LS.set("lubri_tareas",tareas),[tareas]);
  useEffect(()=>LS.set("lubri_periodo",periodo),[periodo]);
  useEffect(()=>LS.set("lubri_historial",historial),[historial]);
  useEffect(()=>LS.set("lubri_tecnicos",tecnicos),[tecnicos]);
  useEffect(()=>LS.set("lubri_paradas",paradas),[paradas]);
  useEffect(()=>LS.set("lubri_equipos",equipos),[equipos]);
  useEffect(()=>LS.set("lubri_grupos",grupos),[grupos]);
  useEffect(()=>LS.set("lubri_catHerr",catHerr),[catHerr]);
  useEffect(()=>LS.set("lubri_catMat",catMat),[catMat]);

  const T=TEMAS[tema];
  const esAdmin=sesion?.rol==="admin";
  const esSup=sesion?.rol==="supervisor"||sesion?.rol==="admin";
  const puede=(perm)=>tienePermiso(sesion,perm);

  // Block inactive users
  if(sesion&&sesion.activo===false){
    return(<div style={{minHeight:"100vh",background:"#0f172a",display:"flex",alignItems:"center",justifyContent:"center",padding:20}}>
      <div style={{background:"#1e293b",border:"1px solid #991b1b",borderRadius:16,padding:32,maxWidth:380,textAlign:"center"}}>
        <div style={{fontSize:48,marginBottom:16}}>🚫</div>
        <div style={{fontSize:18,fontWeight:700,color:"#f87171",marginBottom:8}}>Cuenta bloqueada</div>
        <div style={{fontSize:13,color:"#64748b",marginBottom:20}}>Tu cuenta fue deshabilitada. Contactá al administrador.</div>
        <button onClick={logout} style={{padding:"10px 20px",borderRadius:8,border:"none",background:"#334155",color:"#fff",cursor:"pointer",fontWeight:600}}>Cerrar sesión</button>
      </div>
    </div>);
  }

  const cargarNueva=(p,ts)=>{
    setHistorial(h=>[{periodo,fechaCierre:new Date().toLocaleDateString("es-AR"),tareas},...h]);
    setTareas(ts); setPeriodo(p); setVista("planificacion");
    ts.forEach(t=>{if(t.equipo&&t.codigo){setEquipos(prev=>{if(prev.some(e=>e.nombre===t.equipo||e.tag===t.codigo))return prev;return [...prev,{id:String(Date.now()+Math.random()),tag:t.codigo,nombre:t.equipo,area:t.area,desc:"",herramientas:[],materiales:[]}];});}});
  };
  const cerrarPlan=()=>{setHistorial(h=>[{periodo,fechaCierre:new Date().toLocaleDateString("es-AR"),tareas},...h]);setTareas([]);setPeriodo("Sin planificación activa");setVista("historial");};
  const logout=()=>{LS.set("lubri_sesion",null);LS.set("lubri_area",null);setSesion(null);setAreaActiva(null);};


  if(!sesion) return <LoginScreen usuarios={usuarios} onLogin={setSesion} tema={tema} setTema={setTema}/>;
  if(!areaActiva) return <PantallaArea onSelect={setAreaActiva} T={T}/>;

  const tareasArea=areaActiva==="Todas"?tareas:tareas.filter(function(t){return (t.area||"").toLowerCase().indexOf(areaActiva.toLowerCase())>=0||t.cat===areaActiva;});

  const NAV=[
    {id:"planificacion",l:"Planificacion"},
    {id:"resumen",l:"Resumen"},
    {id:"equipos",l:"Equipos"},
    {id:"catalogo",l:"Catalogo"},
    {id:"historial",l:"Historial"},
  ];

  return(<div style={{fontFamily:"'IBM Plex Sans','Segoe UI',sans-serif",minHeight:"100vh",background:T.appBg,color:T.text,transition:"background .3s",position:"relative",overflow:"hidden"}}>
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cinzel:wght@700;900&display=swap');
      *{box-sizing:border-box;}
      select option{background:${T.cardBg};color:${T.text};}
      ::-webkit-scrollbar{width:5px;height:5px;}
      ::-webkit-scrollbar-track{background:${T.appBg};}
      ::-webkit-scrollbar-thumb{background:${T.cardBorder};border-radius:3px;}
      input:focus,select:focus,textarea:focus{border-color:${T.accent}!important;outline:none;}
      @keyframes pulse{0%,100%{opacity:1}50%{opacity:.75}}
      @keyframes filePulse{0%,100%{box-shadow:0 0 15px rgba(212,175,55,.2)}50%{box-shadow:0 0 30px rgba(212,175,55,.5)}}
      @keyframes neonFlow{0%{transform:translateX(-100%)}100%{transform:translateX(100vw)}}
      @keyframes hexRise{0%{transform:translateY(0) rotate(0deg);opacity:0}10%{opacity:.15}90%{opacity:.08}100%{transform:translateY(-105vh) rotate(720deg);opacity:0}}
    `}</style>

    <div style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}>
      <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(212,175,55,.03) 1px,transparent 1px),linear-gradient(90deg,rgba(212,175,55,.03) 1px,transparent 1px)",backgroundSize:"55px 55px"}}/>
      {[...Array(8)].map(function(_,i){return(<div key={i} style={{position:"absolute",bottom:(0-60-i*15)+"px",left:((i*17+3)%95)+"%",width:(35+i*20)+"px",height:(35+i*20)+"px",clipPath:"polygon(50% 0%,100% 25%,100% 75%,50% 100%,0% 75%,0% 25%)",border:"1px solid rgba(212,175,55,.12)",animation:"hexRise "+(10+i*2.5)+"s linear "+(i*1.5)+"s infinite"}}/>) ;})}
      <div style={{position:"absolute",top:"20%",left:0,right:0,height:"1px",background:"linear-gradient(90deg,transparent,rgba(212,175,55,.2),transparent)",animation:"neonFlow 10s linear infinite"}}/>
      <div style={{position:"absolute",top:"70%",left:0,right:0,height:"1px",background:"linear-gradient(90deg,transparent,rgba(99,179,237,.1),transparent)",animation:"neonFlow 15s linear 2s infinite reverse"}}/>
    </div>

    <div style={{position:"relative",zIndex:1}}>
    <div style={{background:T.headerBg,borderBottom:"1px solid "+T.headerBorder,position:"sticky",top:0,zIndex:100}}>
      <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px 8px",justifyContent:"space-between",flexWrap:"wrap"}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:20}}>⚙️</span>
          <div>
            <div style={{fontWeight:900,fontSize:13,letterSpacing:2,background:"linear-gradient(135deg,#d4af37,#ffd700)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>GOLD DIJITAL</div>
            <div style={{fontSize:10,color:T.textMuted,display:"flex",gap:6,alignItems:"center"}}>
              <span>Periodo: {periodo}</span>
              <span style={{background:T.accent,color:"#fff",borderRadius:99,padding:"1px 7px",fontSize:9,fontWeight:700}}>{areaActiva}</span>
            </div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:6,flexWrap:"wrap"}}>
          <div style={{display:"flex",gap:3,background:T.inputBg,border:"1px solid "+T.cardBorder,borderRadius:8,padding:"2px 3px"}}>
            {Object.keys(TEMAS).map(function(k){return(<button key={k} onClick={function(){setTema(k);}} title={TEMAS[k].nombre} style={{width:22,height:22,borderRadius:6,border:"none",cursor:"pointer",fontSize:11,background:tema===k?T.accent:"transparent",color:"#fff",transition:"all .15s"}}>{k==="A"?"🌑":k==="B"?"☀️":"🔥"}</button>);})}
          </div>
          <button onClick={function(){setAreaActiva(null);}} style={{padding:"4px 8px",borderRadius:8,border:"1px solid "+T.cardBorder,background:"transparent",color:T.textMuted,cursor:"pointer",fontSize:11,fontWeight:600}}>🏢 {areaActiva}</button>
          <div style={{display:"flex",alignItems:"center",gap:5,background:T.inputBg,border:"1px solid "+T.cardBorder,borderRadius:8,padding:"4px 10px"}}>
            <span style={{fontSize:12}}>{sesion.rol==="admin"?"👑":sesion.rol==="supervisor"?"👔":"👷"}</span>
            <span style={{fontSize:12,fontWeight:600,color:T.text}}>{sesion.nombre}</span>
            <span style={{fontSize:9,color:T.textMuted,borderRadius:99,padding:"1px 5px"}}>{sesion.rol==="admin"?"Admin":sesion.rol==="supervisor"?"Super":"Tecnico"}</span>
            <button onClick={logout} style={{background:"rgba(239,68,68,.1)",border:"1px solid rgba(239,68,68,.3)",borderRadius:6,cursor:"pointer",color:"#f87171",fontSize:11,padding:"3px 8px",fontWeight:700,marginLeft:2}}>⏻ Salir</button>
          </div>
        </div>
      </div>

      <div style={{display:"flex",borderTop:"1px solid "+T.headerBorder,borderBottom:"1px solid "+T.headerBorder,padding:"0 8px",overflowX:"auto"}}>
        {NAV.map(function(n){return(<button key={n.id} onClick={function(){setVista(n.id);}} style={{padding:"8px 14px",border:"none",cursor:"pointer",fontWeight:600,fontSize:12,background:"transparent",whiteSpace:"nowrap",color:vista===n.id?T.tabActiveTxt:T.textMuted,borderBottom:vista===n.id?"2px solid "+T.accent:"2px solid transparent",transition:"all .15s"}}>{n.l}</button>);})}
      </div>

      <div style={{display:"flex",gap:6,padding:"8px 16px",flexWrap:"wrap",background:tema==="B"?"#f8fafc":T.headerBg}}>
        {puede("cargarPlan")&&<button onClick={function(){setMTec(true);}} style={{padding:"5px 10px",borderRadius:8,border:"1px solid "+T.cardBorder,cursor:"pointer",fontWeight:600,fontSize:11,background:"transparent",color:T.textSub}}>👷 Tecnicos ({tecnicos.length})</button>}
        {puede("cargarPlan")&&<button onClick={function(){setMNueva(true);}} style={{padding:"5px 10px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:11,background:T.btnPrimary,color:"#fff"}}>Nueva planificacion</button>}
        {puede("cerrarPlan")&&<button onClick={function(){setMCerrar(true);}} style={{padding:"5px 10px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:11,background:T.btnOrange,color:"#fff"}}>Cerrar planificacion</button>}
        {puede("paradas")&&<button onClick={function(){setMParada(true);}} style={{padding:"5px 12px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:11,background:"linear-gradient(135deg,#b45309,#dc2626)",color:"#fff"}}>🏭 Parada</button>}
        {esAdmin&&<button onClick={function(){setMUsuarios(true);}} style={{padding:"5px 10px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:700,fontSize:11,background:"linear-gradient(135deg,#7c3aed,#4f46e5)",color:"#fff"}}>👤 Usuarios</button>}
        <button
          onClick={function(){if(puede("alertaViento"))setMViento(true);}}
          style={{
            padding:"8px 18px",borderRadius:8,border:"none",
            cursor:puede("alertaViento")?"pointer":"default",
            color:"#fff",textAlign:"left",
            background:viento==="normal"?"linear-gradient(135deg,#15803d,#166534)":viento==="alerta1"?"linear-gradient(135deg,#ca8a04,#92400e)":"linear-gradient(135deg,#dc2626,#7f1d1d)",
            animation:viento!=="normal"?"pulse 1.5s infinite":"none",
            boxShadow:viento==="alerta2"?"0 0 14px rgba(220,38,38,.7)":viento==="alerta1"?"0 0 12px rgba(202,138,4,.5)":"none",
            opacity:puede("alertaViento")?1:.92
          }}
        >
          <div style={{fontWeight:800,fontSize:12,letterSpacing:.3}}>
            {viento==="normal"?"💨 Viento Normal":viento==="alerta1"?"⚠️ Alerta de Viento 1":"🚨 ALERTA DE VIENTO 2"}
          </div>
          <div style={{fontSize:10,opacity:.85,marginTop:2,fontWeight:400,display:"flex",alignItems:"center",gap:4}}>
            {viento==="normal"?"Actividades con normalidad":viento==="alerta1"?"Precaucion al aire libre":"Suspendidas act. al aire libre"}
            {!puede("alertaViento")&&<span style={{fontSize:9,opacity:.6}}> · Solo lectura</span>}
          </div>
        </button>
      </div>
    </div>

    <div style={{padding:16,maxWidth:1280,margin:"0 auto"}}>
      {vista==="planificacion"&&<Tablero tareas={tareasArea} setTareas={setTareas} tecnicos={tecnicos} paradas={paradas} T={T} equipos={equipos} puede={puede} sesion={sesion} grupos={grupos} setGrupos={setGrupos}/>}
      {vista==="resumen"&&<Resumen planActual={{periodo,tareas:tareasArea}} T={T}/>}
      {vista==="equipos"&&<VistaEquipos equipos={equipos} setEquipos={setEquipos} T={T} catHerr={catHerr} catMat={catMat}/>}
      {vista==="catalogo"&&<VistaCatalogos catHerr={catHerr} setCatHerr={setCatHerr} catMat={catMat} setCatMat={setCatMat} T={T}/>}
      {vista==="historial"&&<Historial historial={historial} T={T}/>}
    </div>
    </div>

    {mTec&&<ModalTecnicos tecnicos={tecnicos} onClose={function(){setMTec(false);}} onSave={setTecnicos} T={T}/>}
    {mNueva&&<ModalNuevaPlan onClose={function(){setMNueva(false);}} onSave={cargarNueva} T={T}/>}
    {mCerrar&&<ModalCerrar periodo={periodo} tareas={tareas} onClose={function(){setMCerrar(false);}} onConfirm={cerrarPlan} T={T}/>}
    {mParada&&<ModalParada paradas={paradas} onClose={function(){setMParada(false);}} onSave={setParadas} T={T}/>}
    {mUsuarios&&esAdmin&&<ModalUsuarios usuarios={usuarios} onClose={function(){setMUsuarios(false);}} onSave={setUsuarios} T={T}/>}
    {mViento&&<ModalViento viento={viento} onClose={function(){setMViento(false);}} onSave={function(v){setViento(v);}}/>}
  </div>);
}
