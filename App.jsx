import { useState, useRef, useEffect } from "react";
// ── FIREBASE ─────────────────────────────────────────────────────────────────
import { initializeApp }                                    from "firebase/app";
import { getDatabase, ref, set, get, onValue, remove }     from "firebase/database";
import { getFirestore, collection, doc, setDoc, getDocs,
         onSnapshot, deleteDoc }                            from "firebase/firestore";

const firebaseConfig = {
  apiKey:            import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:        import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:         import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:     import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:             import.meta.env.VITE_FIREBASE_APP_ID,
  databaseURL:       "https://goldbox-mineria-default-rtdb.firebaseio.com",
};
const firebaseApp = initializeApp(firebaseConfig);
const rtdb        = getDatabase(firebaseApp);
const db          = getFirestore(firebaseApp);
const saveDoc     = async (col, id, data) => await setDoc(doc(db, col, String(id)), data);

// ── HELPERS REALTIME DB ───────────────────────────────────────────────────────
const rtSet  = async (path, data) => await set(ref(rtdb, path), data);
const rtGet  = async (path)       => { const s = await get(ref(rtdb, path)); return s.exists() ? s.val() : null; };

// Simple hash para contraseñas (no es criptográfico pero es suficiente para este uso)
const simpleHash = (str) => {
  let hash = 0;
  for(let i=0; i<str.length; i++){
    const c = str.charCodeAt(i);
    hash = ((hash<<5)-hash)+c;
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
};

// Google Fonts – Orbitron (display) + Exo 2 (body)
const FONTS = document.createElement("link");
FONTS.rel="stylesheet";
FONTS.href="https://fonts.googleapis.com/css2?family=Orbitron:wght@400;600;700;900&family=Exo+2:wght@300;400;600;700&display=swap";
document.head.appendChild(FONTS);

// ── DATOS INICIALES ───────────────────────────────────────────────────────────
const SPECIALTIES = [
  { id:"lubricacion",     label:"Lubricación",     icon:"🛢️", color:"#f5a623" },
  { id:"mecanico",        label:"Mecánico",         icon:"⚙️", color:"#4fc3f7" },
  { id:"electrico",       label:"Eléctrico",        icon:"⚡", color:"#aed581" },
  { id:"instrumentacion", label:"Instrumentación",  icon:"🔬", color:"#ce93d8" },
];

const ROLES = [
  { id:"superuser", label:"Superusuario", desc:"Control total", badge:"★★★", color:"#f5a623" },
  { id:"editor",    label:"Editor",       desc:"Carga y edita datos", badge:"★★", color:"#4fc3f7" },
  { id:"viewer",    label:"Visualizador", desc:"Solo lectura", badge:"★", color:"#aed581" },
];

const INIT_USUARIOS = [
  { id:1, name:"Yamil García",   user:"yamil",   role:"superuser", specialty:"lubricacion", active:true  },
  { id:2, name:"Martín López",   user:"martin",  role:"editor",    specialty:"mecanico",    active:true  },
  { id:3, name:"Carla Ruiz",     user:"carla",   role:"viewer",    specialty:"electrico",   active:false },
];

const INIT_EQUIPOS = [
  { id:1, tag:"206 RL 101", subtag:"R01", nombre:"Reductor Principal",    specialty:"lubricacion", lastIntervention:"15/04/2025", photo:null },
  { id:2, tag:"221 AG 101", subtag:"",    nombre:"Agitador Tanque",       specialty:"lubricacion", lastIntervention:"02/05/2025", photo:null },
  { id:3, tag:"310 CB 201", subtag:"M02", nombre:"Correa Transportadora", specialty:"mecanico",    lastIntervention:"28/03/2025", photo:null },
];

const INIT_MATERIALES = [
  { id:1, equipoIds:[], codigo:"MAT-001", nombre:"Aceite ISO VG 220",    tipo:"lubricante",  specialty:"lubricacion", stock:"12 unid", icon:"🛢️", photo:null },
  { id:2, equipoIds:[], codigo:"MAT-002", nombre:"Grasa NLGI 2",         tipo:"lubricante",  specialty:"lubricacion", stock:"8 kg",    icon:"🛢️", photo:null },
  { id:3, equipoIds:[], codigo:"FIL-003", nombre:"Filtro Respiro 3μm",   tipo:"filtro",      specialty:"lubricacion", stock:"5 unid",  icon:"🔩", photo:null },
  { id:4, equipoIds:[], codigo:"FIL-004", nombre:"Filtro Aceite HF-201", tipo:"filtro",      specialty:"lubricacion", stock:"3 unid",  icon:"🔩", photo:null },
  { id:5, equipoIds:[], codigo:"HER-001", nombre:'Llave de torque 3/4"', tipo:"herramienta", specialty:"lubricacion", stock:"2 unid",  icon:"🔧", photo:null },
  { id:6, equipoIds:[], codigo:"ELE-001", nombre:"Disyuntor 20A",        tipo:"componente",  specialty:"electrico",   stock:"4 unid",  icon:"⚡", photo:null },
];

// ── HELPERS ───────────────────────────────────────────────────────────────────
const g   = (a=1) => `rgba(245,166,35,${a})`;
const M   = "'Orbitron','Courier New',monospace";   // display / labels
const MX  = "'Exo 2','Segoe UI',sans-serif";          // body text
const TIPO_LABELS = { lubricante:"LUBRICANTE", filtro:"FILTRO", herramienta:"HERRAMIENTA", componente:"COMPONENTE", repuesto:"REPUESTO" };
// ── BASE DE DATOS DE EQUIPOS DEL YACIMIENTO ───────────────────────────────────
const EQUIPOS_DB = [{"tag": "202 AF 101", "nombre": "Apron Feeder No1"}, {"tag": "202 BD 101", "nombre": "Bomba Piso No1"}, {"tag": "202 CH 102", "nombre": "Chute No2"}, {"tag": "202 CH 103", "nombre": "Chute No3"}, {"tag": "202 CH 104", "nombre": "Chute No4"}, {"tag": "202 EI 101", "nombre": "Electroiman Autolimpiante No1"}, {"tag": "202 GV 101", "nombre": "Grilla Vibratoria No1"}, {"tag": "202 JC 101", "nombre": "Triturador De Mandibulas No1"}, {"tag": "202 MV 101", "nombre": "Puente Grua"}, {"tag": "202 PU 101", "nombre": "Tolva De Recepcion De Mineral No1"}, {"tag": "203 BD 101", "nombre": "Bomba De Piso No1"}, {"tag": "203 BP 101", "nombre": "Bomba De Pulpa No1"}, {"tag": "203 BP 102", "nombre": "Bomba De Pulpa No2"}, {"tag": "203 BW 101", "nombre": "Bomba Reforzadora De Agua Fresca No1"}, {"tag": "203 CH 101", "nombre": "Chute Pantalon No1"}, {"tag": "203 CT 101", "nombre": "Cinta Transportadora No1"}, {"tag": "204 BD 101", "nombre": "Bomba De Piso No1"}, {"tag": "204 BF 102", "nombre": "Alimentador De Transferencia No2"}, {"tag": "204 CH 101", "nombre": "Chute Descarga No1"}, {"tag": "204 CH 103", "nombre": "Chute Descarga No3"}, {"tag": "204 CH 104", "nombre": "Chute Sobretamaño No4"}, {"tag": "204 CH 105", "nombre": "Chute"}, {"tag": "204 CH 106", "nombre": "Chute Descarga No6"}, {"tag": "204 CH 107", "nombre": "Chute Descarga No7"}, {"tag": "204 CH 110", "nombre": "Chute Descarga No10"}, {"tag": "204 CH 112", "nombre": "Chute Sobre Tamaño No12"}, {"tag": "204 CH 113", "nombre": "Chute Bajo Tamaño No13"}, {"tag": "204 CH 114", "nombre": "Chute Descarga No14"}, {"tag": "204 CH 116", "nombre": "Chute Descarga No16"}, {"tag": "204 CH 118", "nombre": "Chute Descarga No18"}, {"tag": "204 CH 119", "nombre": "Chute Descarga No19"}, {"tag": "204 CH 121", "nombre": "Chute By Pass No21"}, {"tag": "204 CM 101", "nombre": "Compresor A Tornillo No1"}, {"tag": "204 CT 101", "nombre": "Cinta Transportadora No1"}, {"tag": "204 CT 101A", "nombre": "Cinta Transportadora No1A"}, {"tag": "204 CT 102", "nombre": "Cinta Transportadora No2"}, {"tag": "204 CT 104", "nombre": "Cinta Transp Aliment Zaranda Secund No4"}, {"tag": "204 CT 105", "nombre": "Cinta Transp Producto Triturado No5"}, {"tag": "204 DS 101", "nombre": "Sistema De Supresion De Polvo No1"}, {"tag": "204 MV 101", "nombre": "Puente Grua"}, {"tag": "204 PG 101", "nombre": "Puente Grua No1"}, {"tag": "204 TC 101", "nombre": "Triturador De Cono Secundario No1"}, {"tag": "204 TC 102", "nombre": "Triturador De Cono Terciario No2"}, {"tag": "204 TL 102", "nombre": "Tolva De Transferencia No2"}, {"tag": "204 ZV 101", "nombre": "Vibrador / Zaranda"}, {"tag": "204 ZV 102", "nombre": "Vibrador / Zaranda"}, {"tag": "206 CH 101", "nombre": "Chute No1"}, {"tag": "206 CH 102", "nombre": "Chute No2"}, {"tag": "206 CH 103", "nombre": "Chute No3"}, {"tag": "206 CH 104", "nombre": "Chute No4"}, {"tag": "206 CT 101", "nombre": "Cinta Transportadora Apilador No1"}, {"tag": "206 CT 102", "nombre": "Cinta Transportadora De Mineral Fino No2"}, {"tag": "206 RL 101", "nombre": "Recuperador De Mineral No1"}, {"tag": "211 BF 101", "nombre": "Cinta Alimentadora No1"}, {"tag": "211 BP 101", "nombre": "Bomba Pulpa No1"}, {"tag": "211 BP 102", "nombre": "Bomba Pulpa No2"}, {"tag": "211 CJ 102", "nombre": "Cajon Bomba Alimentacion Ciclones No2"}, {"tag": "211 MG 104", "nombre": "Manguerote Ingreso Prechute (Sp004)"}, {"tag": "211 MO 101", "nombre": "Molino De Bolas No1"}, {"tag": "211 PG 101", "nombre": "Puente Grua"}, {"tag": "211 ZL 101", "nombre": "Zaranda Desechos No1"}, {"tag": "215 AG 101", "nombre": "Agitador Tanque Lixiviacion No1"}, {"tag": "215 AG 103", "nombre": "Agitador Tanque Lixiviacion No3"}, {"tag": "215 AG 104", "nombre": "Agitador"}, {"tag": "215 AG 105", "nombre": "Agitador"}, {"tag": "215 AG 106", "nombre": "Agitador"}, {"tag": "215 TK 105", "nombre": "Tanque Lixiviacion No5"}, {"tag": "219 EA 116", "nombre": "Extractores"}, {"tag": "219 EA 117", "nombre": "Extractores"}, {"tag": "219 EA 118", "nombre": "Extractores"}, {"tag": "219 EA 119", "nombre": "Extractores"}, {"tag": "221 AG 101", "nombre": "Agitador Tanque Cil No1"}, {"tag": "221 BP 108", "nombre": "Bomba No8 De Relaves Cil"}, {"tag": "221 EA 102", "nombre": "Extractores"}, {"tag": "221 ZL 101", "nombre": "Zaranda De Colas De Cil No1"}, {"tag": "222 DO 101", "nombre": "Bomba Solucion Caustica Area Elucion No1"}, {"tag": "222 PR 101", "nombre": "Ducha Lavaojos No1"}, {"tag": "222 PR 102", "nombre": "Ducha Lavaojos No2"}, {"tag": "222 PR 103", "nombre": "Ducha Lavaojos No3"}, {"tag": "224 FH 101", "nombre": "Filtro Clarificador No1"}, {"tag": "224 FH 301", "nombre": "Filtro Clarificador No3"}, {"tag": "225 BS 103", "nombre": "Bomba De Solucion Desaireada No3"}, {"tag": "225 BV 101", "nombre": "Tobera"}, {"tag": "225 BV 102", "nombre": "Tobera"}, {"tag": "225 DO 104", "nombre": "Bomba Dosificadora Pulpa De Zinc No4"}, {"tag": "225 MV 102", "nombre": "Puente Grua"}, {"tag": "225 TK 102", "nombre": "Tanque Solucion Pobre No2"}, {"tag": "225 TP 101", "nombre": "Torre Desaireadora No1"}, {"tag": "226 EA 101", "nombre": "Extractor Aire No1"}, {"tag": "226 EA 102", "nombre": "Extractor Aire No2"}, {"tag": "226 EA 103", "nombre": "Extractor Aire No3"}, {"tag": "226 EA 104", "nombre": "Extractor Aire No4"}, {"tag": "237 CE 101", "nombre": "Cañeria De Pulpa Cianurada Hdp250Mm Pn16"}, {"tag": "237 CE 102", "nombre": "Cañeria Agua Recuperada Hdp225Mm Pn16"}, {"tag": "240 BS 104", "nombre": "Bomba Solucion No4"}, {"tag": "240 CE 102", "nombre": "Cañeria Cianuro"}, {"tag": "240 EA 101", "nombre": "Extractor Aire No1"}, {"tag": "240 EA 104", "nombre": "Extractor Aire No4"}, {"tag": "240 EA 105", "nombre": "Extractor Aire No5"}, {"tag": "240 EA 106", "nombre": "Extractor Aire No6"}, {"tag": "240 EA 107", "nombre": "Extractor Aire No7"}, {"tag": "240 PG 104", "nombre": "Puente Grua"}, {"tag": "240 PG 106", "nombre": "Puente Grua"}, {"tag": "240 TK 101", "nombre": "Tanque"}, {"tag": "240 TK 110", "nombre": "Tanque No10"}, {"tag": "250 AG 101", "nombre": "Agitador"}, {"tag": "250 AG 102", "nombre": "Agitador No2"}, {"tag": "250 AG 103", "nombre": "Agitador No3"}, {"tag": "250 BP 111", "nombre": "Bomba Pulpa No11"}, {"tag": "250 CO 101", "nombre": "Torre De Desgacificacion No1"}, {"tag": "250 CO 102", "nombre": "Torre De Desgacificacion No2"}, {"tag": "250 EA 104", "nombre": "Extractor Aire No4"}, {"tag": "250 EA 105", "nombre": "Extractor Aire No5"}, {"tag": "250 EA 107", "nombre": "Extractores"}, {"tag": "250 MV 101", "nombre": "Puente Grua"}, {"tag": "250 PR 101", "nombre": "Ducha Lavaojos No1"}, {"tag": "250 PR 102", "nombre": "Ducha Lavaojos No2"}, {"tag": "300 CM 101", "nombre": "Compresor Aire No1"}, {"tag": "300 CM 102", "nombre": "Compresor Aire No2"}, {"tag": "300 CM 103", "nombre": "Compresor Aire No3"}, {"tag": "300 CM 104", "nombre": "Compresor Aire No4"}, {"tag": "300 CM 105", "nombre": "Compresor Aire No5"}, {"tag": "300 CM 106", "nombre": "Compresor Aire No6"}, {"tag": "314 BW 100A", "nombre": "Bomba Agua A Tk01"}, {"tag": "314 BW 100B", "nombre": "Bomba Agua B"}, {"tag": "314 BW 101", "nombre": "Bomba Agua No1"}, {"tag": "314 BW 102", "nombre": "Bomba Agua No2"}, {"tag": "314 BW 105", "nombre": "Bomba Agua No5"}, {"tag": "314 BW 106", "nombre": "Bomba Agua No6"}, {"tag": "314 BW 107", "nombre": "Bomba Agua No7"}, {"tag": "314 BW 108", "nombre": "Bomba Agua No8"}, {"tag": "314 BW 113", "nombre": "Bomba Agua No13"}, {"tag": "314 BW 114", "nombre": "Bomba Agua No14"}, {"tag": "321 MT 101", "nombre": "Motor A Combustion N°1"}, {"tag": "321 MT 103", "nombre": "Motor A Combustion N°3"}, {"tag": "321 TK 101", "nombre": "Tanque Combustible Diesel Emergencia No1"}, {"tag": "325 LM 101", "nombre": "Linea De Media Tension Mina"}, {"tag": "325 ST 104", "nombre": "Sala Electrica Planta De Proceso"}, {"tag": "325 ST 106", "nombre": "Transformador 1600Kva -Dique-Relaves"}, {"tag": "325 ST 110", "nombre": "Transformador 630Kva-Talle Planta/Almac."}, {"tag": "325 ST 111", "nombre": "Sala Electrica Externa Siemens"}, {"tag": "325 ST 112", "nombre": "Sala Elect Taller Vehiculos De Mineria"}, {"tag": "325 ST 117", "nombre": "Sala Electrica Fundicion"}, {"tag": "410 PG 101", "nombre": "Puente Grua"}, {"tag": "410 PR 101", "nombre": "Ducha Lavaojos No1"}, {"tag": "440 AG 101", "nombre": "Agitador"}, {"tag": "440 CM 101", "nombre": "Compresor Aire No1"}, {"tag": "440 CM 102", "nombre": "Compresor Aire No2"}, {"tag": "440 EA 101", "nombre": "Ventilador Filtro De Mangas No1"}, {"tag": "440 EA 102", "nombre": "Ventilador Filtro De Mangas No2"}, {"tag": "440 EA 103", "nombre": "Ventilador Lavador Acido No3"}, {"tag": "440 EA 104", "nombre": "Ventilador Lavador Gases No4"}, {"tag": "440 FM 101", "nombre": "Filtro Manga No1"}, {"tag": "440 FP 101", "nombre": "Filtro Prensa"}, {"tag": "440 FP 102", "nombre": "Filtro Prensa"}, {"tag": "440 FP 103", "nombre": "Filtro Prensa"}, {"tag": "440 HB 101", "nombre": "Secador Precipitado No1"}, {"tag": "440 HB 102", "nombre": "Secador Precipitado No2"}, {"tag": "440 HB 103", "nombre": "Secador Precipitado No3"}, {"tag": "440 HB 104", "nombre": "Secador Precipitado No4"}, {"tag": "440 HB 105", "nombre": "Secador Precipitado No5"}, {"tag": "440 HB 106", "nombre": "Secador Precipitado No6"}, {"tag": "440 HP 101", "nombre": "Horno Copelacion No1"}, {"tag": "440 HP 102", "nombre": "Horno Copelacion No2"}, {"tag": "440 HP 103", "nombre": "Horno Copelacion No3"}, {"tag": "440 HR 101", "nombre": "Horno Fusion No1"}, {"tag": "440 HR 102", "nombre": "Horno Fusion No2"}, {"tag": "440 HR 103", "nombre": "Horno Fusion No3"}, {"tag": "440 JC 101", "nombre": "Triturador De Mandibulas No1"}, {"tag": "440 LM 101", "nombre": "Laminador Laboratorio No1"}, {"tag": "440 PC 101", "nombre": "Control De Temperatura"}, {"tag": "440 PC 102", "nombre": "Control De Temperatura"}, {"tag": "440 PC 103", "nombre": "Control De Temperatura"}, {"tag": "440 PL 103", "nombre": "Pulverizador No3"}, {"tag": "440 PL 104", "nombre": "Pulverizador No4"}, {"tag": "440 PL 105", "nombre": "Pulverizador No5"}, {"tag": "440 SV 102", "nombre": "Separador De Muestras Hebro"}, {"tag": "440 TV 103", "nombre": "Tamiz"}, {"tag": "910 CT 101", "nombre": "Cinta Transportadora No1"}, {"tag": "910 GV 301", "nombre": "Zaranda Parrilla No1"}, {"tag": "910 HF 401", "nombre": "Alimentador De Placas No1"}, {"tag": "910 JC 201", "nombre": "Triturador De Mandibulas No1"}, {"tag": "910 MV 101", "nombre": "Monoriel No1"}, {"tag": "910 MV 102", "nombre": "Monoriel No2"}, {"tag": "910 RB 501", "nombre": "Martillo Hidraulico No1"}, {"tag": "910 RB 502", "nombre": "Martillo Hidraulico No2"}, {"tag": "910 TZ 601", "nombre": "Tolva No1"}, {"tag": "920 BF 402", "nombre": "Belt Feeder No2"}, {"tag": "920 BF 403", "nombre": "Belt Feeder No3"}, {"tag": "920 CH 109", "nombre": "Chute No9"}, {"tag": "920 CT 102", "nombre": "Cinta Transportadora No2"}, {"tag": "920 CT 103", "nombre": "Cinta Transportadora No3"}, {"tag": "920 CT 104", "nombre": "Cinta Transportadora No4"}, {"tag": "920 CT 105", "nombre": "Cinta Transportadora No5"}, {"tag": "920 CT 106", "nombre": "Cinta Transportadora No6"}, {"tag": "920 CT 107", "nombre": "Cinta Transportadora No7"}, {"tag": "920 MU 554", "nombre": "Cortador De Muestras No4"}, {"tag": "920 MV 101", "nombre": "Monoriel No1"}, {"tag": "920 TC 201", "nombre": "Triturador Conico No1"}, {"tag": "920 TC 202", "nombre": "Triturador Conico No2"}, {"tag": "920 TZ 605", "nombre": "Tolva No5"}, {"tag": "920 TZ 616", "nombre": "Tolva No6"}, {"tag": "920 ZV 301", "nombre": "Vibrador / Zaranda"}, {"tag": "920 ZV 302", "nombre": "Zaranda Vibratoria No2"}, {"tag": "930 BF 404", "nombre": "Belt Feeder No4"}, {"tag": "930 CT 108", "nombre": "Cinta Transportadora No8"}, {"tag": "930 CT 109", "nombre": "Cinta Transportadora No9"}, {"tag": "930 CT 109A", "nombre": "Cinta Transportadora A"}, {"tag": "930 TB 401", "nombre": "Tambor Aglomerador No1"}, {"tag": "930 TF 405", "nombre": "Alimentador"}, {"tag": "930 TF 406", "nombre": "Aliimentador"}, {"tag": "930 TZ 620", "nombre": "Tolva No0"}, {"tag": "930 TZ 621", "nombre": "Tolva No1"}, {"tag": "930 TZ 622", "nombre": "Tolva No2"}, {"tag": "935 AV 401", "nombre": "Motor 1 - Alimentador Vibratorio"}, {"tag": "935 JC 301", "nombre": "Motor Principal"}, {"tag": "935 RB 501", "nombre": "Motor  -Central Martillo Hidraulico"}, {"tag": "935 TC 301", "nombre": "Motor Principal"}, {"tag": "935 ZV 402", "nombre": "Motor 1 -Zaranda Vibratoria"}];


function readFile(file, cb) {
  const r = new FileReader();
  r.onload = e => cb(e.target.result);
  r.readAsDataURL(file);
}


// ── GOLD BOX LOGO — IMAGEN REAL ─────────────────────────────────────────────
const GOLDBOX_IMG = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAASwAAAD2CAYAAABsr7qIAAEAAElEQVR42uz9eZBk2XXeCf7Ove8932PfIzNy35dasvYqFAo7KIALQFKiKFGiRIlqmaRWz7RZj/XYzNC6p7cx65626Zm2GU2rpdHeEiWyxQZJgACxF1AAal+ycouMiIx9D9/fdu+dP567Z0RWFghSCwEin1lURGW4e7i/d993z/nOd74jPDgeHH8yDgGciADgnBPAv+cxDkju99TO0+57dF6r+/wHxx/zRX5wPDh+mNeW+4P+hog4EcFaK8AwcOjIkUNHp6ampgcHB7UxliiKpNFotNvt1nwcR3vtdkKrVaPdTiBJaKdpG9gAon1/t90BOCciOOd6wPjg8j4ArAfHn5z11It09kUpf7gX2vf87KlO7vMY13ntPDBy9uTR85cffvhjR48ff3xsdGw6CPxh56wkSUqr1ZI4juM0NZsCTWMNcRyTJFnAZYypOefmHK7ZboZSb1aTdjuc292tLl27dnW5VmuvAtsiEoLDuQP3zgMAewBYD44f4XRMAQWgBIziUa4UCvQVC+AV8H3w/SIeHnhZ3tbN02q1muzu7satVmsTqAEtIL0XBDsA2A+cf/LJK48/89STjx6eOXK5XC6f1FpV4iShUW9QrVaJoug9gKmU6oFiJ3pynb9jJfuFtdbU0sTUGq3G6ub65u1bN2+/+NbVq98E5kBCpXqfd3/a+ADEHgDWg+OHHag6gFABpk+fO332zOkTlw5NTU4Xi8WjWntD+XyOwPfx/RzWOUxqiKOYKEkwJgXrsM4SRjHtdhgmSbLQaDRWdnZ2Zvf2drdWVtY3t7a2VgEDqHK5PPXBD37ghUceeeQjU1Mj53O5YMAY67VaLWk2m7ZWqxGFiYgonHMopbrAwr3Ap5Ry9wEcnHOitUZEECQJw2RtbWPje9euvfOFa9eufjdJ2AaqQEuUSqWLUw5c7/vByPPBknkAWA+OP4Z1I4ID6UYWlULBO//hD3/kQ2fOnHl6YnLsTLFYmBBUXnC+1lpSYzDGYNKUMIwIw4g4TjDGYK3d98qqG/GkQJykac05246iaKvdaq+3220TJ7EcP3Z8fObIzCnP8wajsCVxFLp2OySKQpIkwTonWnk4dze9fL+0VCl1b+Tm9j8+QzMtgic6UGk7bKxubizcmhwvrZXzudlXv/XWjd/55psLwFbnK8oiQ5eKaNfFx3sisQfg9QCwHhz/rtfKPt4oB0xPHDp0+gNPX3n8wsULHx4aHrrkaW/QmEQ5rDMJCArARVFEs9kijqMMuEwqGVDdswQVTkSkCzTOORElCIJSyokIXYI9AzvjFOJApEO6033MvXzY+wGWvE+JcN/jnYgCp5wTESdWAm0JVGyOTg20Tx4t7rZr21sbi2trC/NrdxYWd/duL9VnZ+/M725VqbdgCdgFdpRSYTfS4wGB/wCwHhz/zoEqD4ydOXPmuWefffrTx4+fuDQ83D9tbNpvTKqstU4pcc5ZsUaIIyNhGNJqNZ1zDmudWGucyN1o4wBgiJAag4g4rTTW2QNpnLW293M3MhJ3F+AyMDNkUgWXpWbdTM25fUve9j6eyA9yG1hQgPOdw0M5nDaJuKQllXKby8eHefLClBsbUGkSRclOrV7brDejrb12Y6dqlpc3mqu//cXvvPSl7y2+DNx2zu1qrZy1D/DqAWA9OP5t81MCFIETzz33zLOPPvrIU0eOHH6iWCwex7kgSSPAWZzCOsQaK1GUEIZtWq0mrVaLYrHkjElTY2zseTpnjNFKKelES/f81fd/U+59F67sAx+Hs5bURSgFIh6+lwNROKs6j8xAzeIOvJpg2RcBYZ1FEBB6j3Su8//WOqUUxigXt+v05xM5d7jEk+eGOTVdFFVoQRJD7DmLl27W0s2X31m4+a9++zvf+Pu/e+vLwPXzP//zW1d//dfjB8vtAWA9OP7I/FQvmhJgpL9UuvzUc08/+fDDl5+Zmpx81Pf9EetS35jUiYhzFnFAmqQSRQmtVptms02axhQKeS5evOgeeeQR+af/9J9Uv/B7v7f0C3/mz05vb28NRFHktNZyb6q2j8T/QxNrIoo4jvA8j/6+fgb6+/F9nySJsc7gugBkA+iAm8oIOQAMBucMURTRarVIkoxn2xer9UDRdrQN2gHKw1qDjesuLw1mJio8eW6U0zOKot5zJkzE14MiQd7thmH1pbfWbv3j33z59d/64vXfbpj+r0J178HSewBYD44/NFAJztkAGJucnDz/geee+uiFixc/NDQ0eEJr15emqXbOOqVwxlhxzkmaCGEY0W63aTabGGMYGhrm9OlTHDt2jN3dXd599123sbEZB4FXKxZL5Z2dnXyaprKf8O7yRlprsvTR/oDpWqZUNyYFYHh4hNHRUeLIUNur0Wo3MSYBcThnswhMLEoEoVM57CZ+zsNxN+rTWndSUUdqDNY5PM/rpacKh+cMVjSpeIjSGBtjTESfqXN22ufhcwV3esZRcKFL2jk8XVJSUGzW/Oi3v377zf/+//eF/64lY//rrVu3ogfL8AFgPTh+gLSvAxYBMHPp/NlnH3v6iRdOHT3+8MDQwAkRVUlNhLWxU0o5a61Yi6RpQtiOaDRi2u0QgNHRYU6cOMHY2Bhra2vMzs7SaDQYGBhwhUKBer0me3tV1+GlDqSE3w+cujzWfbRYiCjSNKFULnD8+DFAc2dhkVqjjsGiRKHFA6fRaKxLsSokI9I7KV6XA8OR8Uqulxp6XgZEIKRJinUWpRRaexmoZoQatvN+FA4t4KSBDRPK1uPEpMejF3IEsuU2V+YJ65vOGl9M8VjyT3/v1t/7x5+/8X8Rkc1OVPuA2Hqfw3twCn6sgcp1bso+4NCzzz7++COPPPrJ48eOPVkoFKattUGSRM7hrNYK55TEiVFxFBOFCY1mgzSx4Dymp2c4cfwoQS5geXmJN998E6UUY2NjlEpldnd3ZH19PSPTtT6ATF2NlLWWeyOuH+QwxlCplLh0+RzGWK6+c416vY3KCR6C2BQxMWIs4hzKCohGlODEx1MBqIDUGJxqIcqAk977MsaAdYCH5wcYY0iShDSN8Dwfq3wEhxAjWDwcLjFOgmFcYKXlEvfmsuHaUkOmJ40cmpxEfE19Y5PdOxs0alYmJsqsrzcfrMwHgPXguE/u55xznnOuv1LJn/nAB1/40KVLF58Znxg/n/eCqTSNgziJHDiLOHHWSBjGksQpYRTRbLSJooRyqczho1NMTR0mSRJu3rzFzu42hUKOiYkJoihiaWmJKIpQSuF5Hs6593BWdyOlP2rAr5iZmUF7mpWVZcKwjac1pEIatdCSUPBS0mgbz7VxzhA7hXGKduyIUkWcaqYPzyB+hdQorLM9ANU6I+stjlarRRAEiCjq9Tq+7xH4eTwP0BaHo20cpVI/cTO0Od93qVYqLVlxlLm167NQNZwYGeb08WOUGzXbfvOOWVtrBDgn7u55eBBpPUgJf+yBCuecB0xMTww98ezzzz938cLFx4dHBs8hDBqTKmucU0o7QExqJElTwjAkbEckSUqSJJRKJQ4fnmFocJi9vV0Wl5Zot1r09ffR11eh0aizs7NDkiR0leLdlO5epfn3A6z3ku/7NZfZ6xibMjBQ4ezZ0yRJwuLiChvrOyjxsb5PtLfKJx8b40NPDNPY2WBjZQ1fJ4gomjamVJom8GbYadR5e36X1WiQ7WoDBRmp3nkPzjlEe4TtEGMyIGu3Q9I0xdMefuDh+xqtPaLEkC8UMFEtnJudi55+9sOlKG3renNPlCiwHjZqM+DX3PRkn20m7p13rs795te+/LWXb63HrwMrSontSB4eANeDCOvHFqz6J0Ymnv3YJz7y02fPn/pAf1/fEaCQJqk4Z5wosYCkaarSxNBqtYmiiCQxOJdFF4ODg5w9e46dnR2+892XAJiYHGNkZIBqtcb8/BxpmhIEQQ+s7gWmP4inev/3Lz1uCRyiACzDw/14vqZabVDdayBoRDTKOnIm4eSIR19+j73dReav3UI8g/E8akmDkUqTT3/4A9AvfOeVf47L9+F5Hkkc3/sGAAtie2DZfa+pSbGRJY6FIAjwPA8TRS5OldeKjPrGN7+iLl48z+jwKO1WkyiOUbkCVeNTvROqQsCF0yfOzJw+fmJxbunal37v86/8/u31+mvw8+tK/SvT4fgeANcDwPqxAqvRK1ce+uxnP/vTf2l0ZOSytaYQR4nrVga1ymGdVWkaEoYh7VZEHMdY6+h2kyilKBaLXL9+jWazxfT0NJ7nsbOzze7uDiKC1pogCP5QsoQ/XCp4FyxMmpAv5BgYGMSkju3tXaIoRikf56wzKPB9UhBnHMYaKpUiKTGpVySsRe6N2wvykSdjAj/FaUeSJh3yPQOp9wPR7nu4t08xDEOKxQIoTRSGenr6kNds1N2Nm7eYqNcZHx+jUukjjQztZhPnBaQWtb6XDvi+6jt9/MLRs3/97Eev3bj9jc9/6XNfmN+wLwProsS4BxHXA8D6cTicc+rEiaPP/PJf/MW/VikXL0dRS2mFzedEHE46dyZpagnTlHY746gysHJA1t8XBAHVahWAUqnEzs4OtVoNpTgQTd2vyfiPwlHtB727rTp3f2edo79/gOHhMe7cWWJzc8sppaBTgbS+R6IVoTNOlKPUX5HSYOIcKeL65I03VsSFBbTznMZS9EqyETunPY80awMSoJOb9QSmIpIR8vf2ICql6LYbaa3F83zSNKJc6ROthSROWV1do1gs0N9XYmCkT1qtNmEYY0WcsSKLm7ZS9JNLZ84ePnHq5M89f2tu5Wuf/9Jr/3pudedVYE8p9WMdcT0ArB+P6EqdOHZk6vnnnjvcatV1rV611sUCIs6CMZZWq5VpqeKQTlPzgfuhC0Jd/6g4jnCOjibJ3hec7uWufhBy/X6R2d22HEdm6eKIooT+/gonT55idXWT2VtzOOPwc57L5Qq2Wq2291ZXGpNFCiP5wYpNjHp9bpOvvxazG0ZO+bnaRnW4MeoFpUbq+oa0lcFcLry6VZckCHI2ScTirFY6DoJAKaU942ynyimilCKXC4iirDeyqx07CNqZkLVbGPA8jVJCFEWsbVTJ54tUKn0MDJaJ4kQazRaJp2zD5Ik24kLZ9y6ePHbi2N/4q8evLKysv/h7X3np69dnN14G1pUS8+PIcT0ArB8T3Fq8s0rfwIi7/NBjNOu7WGekCyRxEhO22+zsbvP21evU6y1EYvYZF/SiHKVkH59EB0iyf/9BOao/iKu63/O6r58kKUHgcfjQIYZHh7h9+zYrS2sUikWXq+SlXm80Xn/9rZXVlZX59cX5l3/+g0+cnh750KecWyturK27q+9cJ/Q0sVlZ3dytv9t3YvSkV9g9j2dckrQXvvyVlzcq46NFZ6xBWEzTZG5kaHT81JlTH87lgilBiKPUOeckny/geT71ep0oig7wWnf7GTVZ44Dsj77wdIkoTInCHQr5FoMDA4wMDtAK2yoMYxfrAtVU2/p2uxjo5pPTU6OXfvWXP/OJhdn5b3z+C1/5wo3V+HsZcP14RVwPAOvH49ADeSm++8pL3szUBKXKkCDqLpEMgGHq0FEGBsdpNtrM3rpN6lKs6zh+yl1Qcm5/RCUoJX+gKv1e0ee+zjwOFKs7GWrGVd2NuJI0JZ8vMNI/TKVSpt1qcf36DZQIlb5+VlfXuHHjhtvY2FSjo6P6/IWL+bXdnTnT53mJv+nyZoU//fEzfPqjj+DEisRmqmXSQiHw+wtqUWEK1gRKavX6ms0Fu0kSRe0ovra1sf61ZjNJHtvc3r108dIvj48PVwJPk5iUOGni+z6DQ0MkcUyz2SQMw07KXCaO9zBpgufrDngpRMBaQZxCqyziShPD+vom+VzAYF8flcFhaYQhzXYT5zSGETZ2qsXA37t46Ojh43/9b/zK87O3Vr7++7//zS+8u7j9vR+niEs/uJf/ZEdWHUJ46Ff/zKc/e/H42JOb2xtq/NhZUkSgQy6jsqUgHv0DQwwN9LO0OE+zUc0iKdsRUWKzZ8l7SfAfhKO6G1l1OS563+8+RoNTPdcFay35fJ7RsVGGhodI0oT1jQ3aYYhSms2tHb773Ve5s7gkk5NTfOD55/1Hr1wZEqH/xjvXZ2cG0tzHni4/VjBhoF1APh9R8BLyuTRfKdmBguflrWmhSxV589pW3+IOh/pHxo5XBvvOVvr7LhSKpUHfU0tb67UlY8PjSrVntDZSKpYkF+RJkwRjLJ7nUSwWO32LSQZkg4MoLYRhG7dPHX/XbSIDLKUUytOk1tJqNoiiNn2lIn2lkghOkjQiVT6pVFyjbf1WKxqbHBu58NRjlx69dHLiSKuxrle3wgbQUkrZfdY1DwDrwfGjRmEJzrmR/+BX/8rPPP2Bpy9+57svifZ9mRifwRnTaTlR4DJC21nD4MgwhbzP/Pw8URR30j8ha3F+L9f0gwLWvY+53/NEHNamgKVQKDA+McrQ0CBhGLKxudmpXFpWVlZ49dVXWV9fZ2bmKB/4wAeYnJxke3uba+++K5tbm55ClI53+z/w6PDR4YL2ndNiJRHnEIxx1qZgNWBR+TJvXd1Mv3d1M1fqGxoQUX3aC8ZLhdL5/krfea2NC9NGsVjKn9Be3q/utJ0veSmXyogPSRpjrSHwfHK5PFEU02o1KZfLDA0NISIddXzaK1BkXx13UjLSXotgraPRaJAkKcVCiXK5LIgWk1rBCVjlWu3Eb7bt2ODQ0IUnHjr16KPnjx9p7rT8lZ29OAMuSfdfogcp4YPjR+koTJ84Vew7fFrOX17h1Ze+RqlY5MiJ8xgToVTmXJAR2gpwPPTIQ6yuLfPNb7xEFKa9PrkfgCR3P8gNcr/eQGsznVOlr8zw8DBaa6rVKpubGyjlgRNuz84xv7CAIJw7d54TJ46TJJb5+Xn29vZEKUUQBC6Xz3tu3D3BXs3UG2Ge4bzDhKI8B06Bs5IJ+VNwKThrnHV3ckHOK+SLxxJjnXEW8ejryxefG6oMn6k22lF9t64KfsSJ45NikyabG/MU+ieolCuYFNqtCNDkfB/RAc1mA60VxWKBvr4K9XqNZrOFiOo0VmfnIbPBySJLJYKxlnYUEW1vUygUKJVKlEr91GsNiSJwziNG7GbNFgqOCyPDo8f+yl/+2IcWlldf/a3f+85vvTu79U1g27lfi5X6z6xzDwDrwfGjc5SLuXwFPM5deoy9vSqvv/o1Kn0BQ6NHgWznT+OYsB1Sq++xtbVGo9Ggv7/Cdlp1LrWy3x+0Czhd54KuJU0nknAdlwO5X3R1r21xl//q7+tnYKgPgGq1RqPexPcD0sSycGeWubk75PN5Ll28zPHjx2m1Wty4cYtarY7v+xSLxQPvLVco5vNuhDjEpUmCxmRjJvAQ5bIUF4O1CTjjTOJqiAqCQDntPCXiOU/hFEZyROMnDuVdPSywU22727fn5dyZE0xNj7O6ucPmxhqVSj+VSokkNkRRQpo6cjkfRGi1Ghm3VS5RLJZot0MajQael1UbHabjGpF1JSKC0h4i0A4j2mGTQjGgUu6j3FeURrNNOwzFgLOqbKNau5Cvtc9OTkwc/+u//HMPzy9vf+Pr3/rOiyL/2XeAO865SHV8Dn+UOa4HgPUn/HA4ijDkonAEciLekHvi2Y/ytd//l1x9+03OXc6ztrFJu97EJTFhbPCCgL5K0VX6yjisxHEszokTT4Nz0gWYKIpYXV3dD0jOmDS8ePGSTtM06PYQ3ntkeiVDmqb4vkd//yCDg4MAbG1t0W6HBEFAEhuuvfsOq2sblEolnnjySaYmp2g2m1y9+i6NRuMAUO17fRGBIBfQF4wQ+IVsmETSwhkBl+J8AWcgk5di0xQllunJUQaG+gkTh/J8wSTYNHGf/ehFV5QlNuoe33ljXfZaBd69tkap7HPm7CGmp6ZZXlphfW2Zgf5ByqU8YWKIkxRw5PIB1loajTpKaQr5MqVSiXq9SjsM0TrTuSGZ64Mo3WMYs8ZzodWMCNtbFIpFisUSxVKeRqspYRgROx/rhu2d9cTPe/G54ZHCsT/z8x/70Aefq730ja++9LqIfAt4UynVds52x5T9yAHXAw7rTziHBcKo5twv/9Kf/dTIkVNDkfUoFMoyPJgnTh3WaaJ2TH+pQrlQpBVFLK2ssL6xhohyxWKpncvl0maz5YVRZoxnrRWtNYVCgUqlwtDQEP39/QwODiIi0djYqEqSxDPGyL2cVdf9QCnF0NAQY2NjeJ7H9vY2e3t7gKLdirh1c463334XrXM88diTXLx4CXDcunmLtfU1rM04Ls/LKnDdsV3d7yIKlKYghsfOFJkoxdikgWiHUMhabCRzmkBA58r2zavbazWp6KBYHDPOCeJQGEScHOo30ueqEqZKFler6EIf+f4SsWmyuDBPvdZgcmqCyakpms06e9UdfD9HudwPkA3GMJZcECBK026FGGOyVK9cwtqsZ9NZ0EojB4b4CM4pFD6gSZKsCd2khnKhSH++JKKUhM5JIoLTvmu3tR830+Hh/uL5R6+ceOLyufHTcRi55fXqNtASEdulEB9EWA+OP0aAunv8Gsh/Ds4fDKzfajplIvA0O2trbG7vUW82qdUamNByfXWPueU1NjbWqTcbRKkhThNZW1neKueDdz/5yU8caoXx6cXFRb8rkuxWw8B1gAMZHR0pbW1t9dp09tsfdx8/OjpOqVzJIrS1jYyIVppavcXc3AJbW1vk83keufIIp06dYn19nTfeep0kifD9gEKhsE9Nr5AD/X0ZF6SUICqHsiHjU0Og1nDOA5eAauHwwXqIJNjURxNTb22DDGfaKZsiSiFeDsTylTe3qeQ8YhthvFGsU2hxDPYPM1gZoVrd45VXrzI41M+xY0cYGh5lbX2NrY0FKuUBBislwiglCmOcKPL5PM5l5LpSmlKpn3JpgFotk0Z4nsb3OxouMZnZYE/yoXE4wnZMEiUU8gHFUpl8IaAdtqTZaGGsQ/wSa7W27zfjkcHhmY/84i+cOv6x51effunbr3zhy6/e/h6wJkpSnPuRibgeRFh/UpDqQHSRVfW+mimo8rmWeeTnf+FXPjY/XBr4wuw77M3Py/L1q9i2UG8J33j7KtfvzFPf2iRNDIkFi2J0fEKeefZp++rLL8+ura1Hhw4fPlSv1/39UVNncg3GZCmeMUaUUtLRbIm1FmMMnucxNjbO2Ng4cZKwtbVNo9EAgXq9wTvvvMOtW7fI5fIcP36ciYkJRITbt2+zsbGe2bgEud7n7KaW0tNsSY9T8zyN52lE+QwW4PHTQkUaiDWgUlA+6Byii4hoUHls3rNffvH6WhzMaC8IxuLYiGRMOA6H8gvELsBKgNJ+JkWQTIIBGQBVKmXa7TZzc3O02y1mDk0zPj5GtbpHda9KEHiUS0UcjigJs6piLkDpLOKK44RKJUsV4zgiikIcNhvEYQ2pSaHrz9U7944wDmk2G5jUkM8XmJgYl3K5KDu7DdFeESFwrVaiG43WcKXSf+HS5VOPPnF5+phyZmBuadsCDaVU8qOQIT6wl/mTcyigTDZxuQJMXJquVMbOnj45/fALHx985hMvfNn3yzI85c5UY7nzr/8njqeWi4fHmN1eIHGOYisjxIfGRzl+/IQbHBqkVt1jbm620W63XBRG5Y753j3Wxu5AxTBL/SzGOPL5PCMjIwRBjmazwe7ubqci6bOxscH8/DzVapWRkRGOHz9OPp+nWq3RbDYz6xbP69kU35UCyIEqo4jr9fbt/7JOMRY0+ds/288oa7g4ypxG/TKSH0R5lY6UI4CKn/73f+ebr2+py4FfLFys1VoKpTvDJ7p2yl39VEfmkY2sJxvWanuiWoehWt2j1WgwPDzYcUGF1dU12q0Wlb5+/HyBKAyJY4OIh6cDjLEkaWbJUyjkei0/+UIOAVTHnXX/+XAd366ugNc5x8zMDGma8tZb76KVj4hxOIfCusSk4hHJUFm1y0V/c3X1zpvf/M6rn/vGK2u/DyyJqLCjk/uhjLgeANafBKAaYuqJs+euPPfYk4+ODI5OD4wdGRKVm1EDk+WvRe3BV3PB4Ibt89L8EKLz4ieO4UFN7t3vMXnrTSYaWxQEhicPcerUSfrLZTa31llYmHd71V20zm5XT2vX2d3vqf4dGDqKMYZyuczg4BCFQoG9vT329vbwfR8RYXl5ldnb84RhyPj4OMeOHesY4tWo1WoAvcfu/9pP2u+PKrU+GHV1v1KTcqgY8h/+3ACl1gLaOayKcKqEKo0g3iAiGud8XNGlf+8fvfL6bOtEUOgrXdzdayiUzj6bZFM2hPdqyO5yTLbX/OycyX5vXQZcrQajY8McPTqDMSmra2uEcUx/3wCelyMKE6Iw4/VEa5yzvZ7NzPgwwPMET0vPi6v72bstQPsBPYqyaE1rLwNVOVAadE6Uc0kiORoyPuCbnO8trm00Xnrxpbe++dWX3/o6cEMpFe3v/3wAWA+OfwtZoLiBY8f6nz1z+Vd+/rMf/ZUrT54/XBOv8K7tV19ZS9TLdcuS5ImCkgsAlzRBECsaJcLA6ACjScT4tat8sCxM5kKaW1sszs1Tr+2glUN7GkS5Tlzzvgs47diyZELJYYLAZ2+vxt5eFd/3cc6xtLTEnTsLxHHKocNHmZqaRCnF7u4ejUYD5xy+7/X6Fe+tMHYjK611T3yZgdP9QEyTpm2OliP+xmf68Wu38UVhVYLTZXR5FLwhROXBaaSYpv/kX7z2+mvrE0H/6PDF7a2aEq0708Oy/qT3B6x7KrOdG10hKMn8svb2dmm3G4yMDmfasTRmZXmFMIoZGhzF9wLa7ZAwSXsg5ZwjimLiOEWwKOUOiE67tjbvbXvqVGLpgqeiOwbNAVYJTjznW5yKY8k5I/1lL8kVzNZ2bffb3/zu25/7yjfffhu46ZyrKqXcD0vE9YB0/1Ek1kU647Ws7N6+PeSfOXx5+Nip06ujl71/9M6C+/2tKmt+xVEsOC9VotsGWxSh7GEijUt9JKdpND22miHNJ54jbm/S/PIXOD73NhM5KOYDMCkGwWSC+Wyc1X0qfiLQ19fXE3vu7u6yt7eHtQ5jHIuLiywvL2GM5fChQxw6PINDs7W1RavVRinB9/0O6LgOcf5eQOjerN2U6G401QUsIZsSnYGMsyl9lRIiFmdTlPZxgNJZ5JQ5AGqcyX4sF3LKWqsCP6BLjGWA0Gkpcj/o5cl6BqXDZAuaocERGBxid3eXb734Haanxzhy9ChhGLK2toYxloGBQXKlvsw4MQ4J/CKVSj8OIWzXiaN25zyoXmU0E65kLT/O3p2pmGWJGcfWTVsFQTmHchYkEksgJig4q1LbajW9oOUm+/sGPv1Tn3jusWcfPjb76qtXf19Evgy8Lkq1+SGIuB5EWD9iERUiOGt94PCp46ceOvvCB59wTz75qWrf5PnrcUV29IAUKoOi04TIT7HaIxcLsTYYMehcBfELpGkTMT5eXlEeK4A44r2Y6WsvMfrqd9yRuEl/MUVsgrYaC+KU7UUZxmSRQF9fH4ODQyglbG9vU6vV9nmhB6yvbzJ7e5aZw4eZmJzEWsv21jatdtjzeT8YTd3tLdwfSXSV4dJR5GdAJXdBSgxaDOI8hFymMm8s8/GHB/nM45Du3EB0JtD0ghKUxlB+P6KLGKOdLvv2S194Y+V33kqYOnl2enFxU0QH4rAgBo1GrEZlIRROKWxnnqHCsn/Ea5YiA/vGhyEOY7Lzl7iU7eoGcbvF1MQUR48cJ2o22F5fJcRnYGgYpTTVvRoiGk/nQMDY5O50n33CW9WZDGTJRLjGWkQJWgVA1kHgOtq5zJ0nBQxGCU4Ei0I77RTOubQlnmvLyIBny6XC3vpm9eWXXnrln33xW9e/Byw55+qdfsX3i7jkALH5IML6MYum6KnInXMuj3PHH3rooUePfuyTH41OXHx6rTw6OVcYKjZVoKSviEZJYmK09tFWSJyhmffwgiJKFFE7RDtDoVzAK5ZJdEAzEVxqSfG5efQKlanjLH31d2xt8S0OVXyldYcT6twMnucxPDzM4OAgYRixvb1NvV7vRUFKZXIG6xx+LselS5fRnsfa+gZRGHZcSb1eK0pXjpDdgJbuBGetVef1spYhpTpks+qAmjg8rRGXB9dGxKK0JjUJkJAP2hwaGUTHLVJrMIFCbCYPsHiZHEIMaAUur4tFKUB7Z2hoMF64s5r3JNebUJ9xWRkIZX7vFicCSjoTdfYXIDqEPJZOj3kGNCqL7gpOODU6iUkjltY3+NbyBjOHpzkyM0VsHOsbm5QqZR66dJLr794iTdoZD6Vsz8TwrvVPFvmlXTJRNEoUxjicTXpW1UmS4hxYsvcsykM5sMbgKQek4kCcyruUnF3bjcSrtocGSuUXPvXJj51+6snLb7/+xlu/LyJfBW6IqBb7ZzpKD64dHcB2dz2I/q2B1wNZww83UGVTiZ0rF+ChR1/42E8+/mf//F8p/8RP/7lbRy48eW3gxPhKZSaHryWb8iKivRxWFJEJ0aIISiWigia1KTpNqQxV0EP9EFRwrkkhDmnd3kJv1xnVbR46PEbfdIXF+WvR8u/+XnhuYiIIAyR2qeR9n5HRUSY7koOtrW22t7d6wya6nEr3vaepJY5TarUqe3t7iNxN/Q4IPMlK9Bk/lYFUtzrYSwNV9m9KCVopPE+hPY2zFs8alPaJXECKT66gSON1jg62+eSjU3jhCsq1QXsoUSgvD7m+Tg+l30mbjOQL+eS1a2v23LlL5fpezTOxQaHQRmMFjGeyNuWeNsp1WKH3c1Y96GShlCJJHEeGHT/3fD8Vv0Fff45aHLPTDLm9vEIghnNnTjA2Msy5M2cwzrG6uprp3DoRmnRAswukafcHBIXgKQ9lFYgjMUmv2qiUwhiLseZuxKXUvvcvKKdEIaKURuvAtSOjay07WPIqxy+eOXnp2WdOnA2CcOTW7W0F1MDF2VsZU3BVOcg7R4VsjFyaVS7/7WVzD1LCHz6gch1+SIBB4MiVT37wuRNPvvDT1clTF64OjA2vlw/7yva5wOEiU8cGSgV+DhOl2NQggY8u5knDBGMFL8hTKpfRuRzOh8gk5OIWk+kmVwZ9rn37Rb733dcojI4zfepR5m+94wZ35tKnw5Y9kwv8pKikMjYsI4UKzWaTnZ0dWq3WfRb8AeqZVjuh0WgSRVEv+tr/fT8XBuB5PlofJM6lE6EoOpbEnaAm8/FSIBZRCYlVFAvD+KmivXWbw6OWP/3xw4z5q9BcJ/AsqVfE6Rw63we5EbQugPiYLBBwojy3sBm7zd1UvXVjmc2aSESZWtORKgeeRaxCnGRg4RyiHBZ1wJTwrsPqwTmLIhDFlkMDCR9/OM9eI+X6coN3FkO88gRRGLG7tUHYbvKnfuKT/Lk/98v8zhd+l9//ytcoFsvY1N4zScjhyGYrChbnUrC2241IJyvF2mw4bJZWe4g4jEkPAFkvDe/4o3XZNyXKOSdOJU58MVKqmLRYMbvV2ta16+/e/q2XXnzrHafMUCXvF45OT9nJyfHhXDE3Xm3W5v6X33zj5RSui8he5gP2b+7X9QCwfkiqtN3mYeecAgZL/f2Xnv/4T3/01Cd/5ukbgwNn3gjdRD03odMg56z4jiQVrayIGFKdx6aGnB/g+T6xSYgdUMiRL5fJeXkSsWBjSq02h9OID/Y5PjRR4NmhOnHjBv/l3/0X/J3ffJv8zFmeOTLjDuUUOR3JlOe7crHEXtKW2tYOYRj2IqS7N87dG7UrFFVKsbaxiet4aXVvjvvJFLqVv4zP6tisKI3S+wSinb+iekaCNuPRtEeQ78NXKUl1nX5p8vTFYZ66NIxE84ip4otClMb6RSRXQQUVxCsiKpfZy4gC55ylAzBOsbIb8/bcttxcabPd1sTGI46MS62HI3OOUM6hxGIw4uDgOem0Gd/7OUUE0oSKchTyOXYbIcYvZVyYiUhVjp3tbd589dv8t//tfw3a8vf/4d+jUBxEnJ9BVJfUV1l66yuN1grxNKmziM7mKorTZNAKaZJVHJXWeL00O+s+6E63ziyc006WKR2HDMho+gTEOp2KkKTSX3B2eFBvHJsu7ZwYiit5olxeO1co6EByuVzkXP3qYvXab3/x6pf/53/68rd3It794Ad/be0b3/jPU2vdgwjrj7kI4f6wEdR9SuE+cOj4kelHLj/60JOnLl/64E9+9s+f3R2aKv1PtzbV1WBIlvesM+1t8fJWXOBjYhCTI8jlcVpISYmtwc8VKZX7kFyAcQmYNira4YRt8KnKEJ8eGeCR/BZeY4G9he9xY/YaX7+2x6vLPvmpGSZzeQaDACl5NOp16ju7JGnS45Du97G61aluO87y8jJ7e3VGRscwJqVrDXy/Enw36sp2+w5AqSwN7BHvAroTO2SkMplhnlaEu9tU9DZPnevjytkhBv0qjeosOc8hXhmrinh+CS9fhnwZo3J4KHB+1kvYsdTBpTiX3ew68ElVwPpeyFvX57m9HLEXllwztMQEFuVnJqzO4jKLBYw13CuotftSrx6YKYtTMWIMJlEkxkPSlIIz5P0io0MlTGuDZ5++gO/HfO3F3wccSjRRFPYWnLWZXqvVTGgnjkSVGZ46RSsNiI3O0L3jLW9SRxSl4DI9LNyN/jLQgiDoSEqUyjYGLT0LNCOGFEsggfOccu1GVUwcycRAnqdOFXj87ABDpT2I1sE4Z/2SmLxvQ+NV373VvPO//t617/zdf/nKFzbbvOTcr62J/Gf2AWD9mxPbf+TDOSd/EIiJUjhrZR936AN9wMCVhx++cunhy588cXjmyZmTh6dyfV5p/uZc/RsvX93cKw+MPP+f/lrfN3Mj3FjZkp3tCNd0FCsV0rwijR0JhqBcwKuUgWwnLkQhhbDK0bzh4/0ePzPoccmvws4sW3Ov887t17mxss5We4A9M4IuDjJQ7sd5inCvTmuvRt0lKCUUyHbvXvCw79MaY8nl8/iex87ODgt3Fmg1W0xOHsLzc8Rx9B61eqZS6gy6kH2AhepxVNkoeVBaoRyYsEU+sEwM9xP4ivmlJXKB45lTAY+e7mc4V8fUN1Ai6FyASIou9OGCYbQuITqH03ms0mibgtPZJbB0zAkdKSWcNShpIy5BeRpEc2fT8eI72+7L3/getxa2G3hlVSxWivl8ATzE9330vmqmpz1QdyUIWdtQZ6istWBSSCImxifp7x9garifmdEBDvX3M1DIUQwisKsQVMGPIGlnabBxuDRFOk3fzjlSHRClZTb2Akz+EJ/7ylvc2WjjPANkIGxSR5KYTvFCAebuXMXOpCTtefheAa0yftDTjg5Nj+B32pgc1hkSk7g4jXBOSNOQ6b4GHzhf4LEzFfr9zOGCdiKBViLFHE1y7dfnovl/9ttvf/5//Ccv/wsOHXqDpaX2A8D6I/BF+wAnD/QDQ9+nguqAFlAFIsAAYYdUOUC47q9qd8Bp+tzpo5enJydGh8ZHUCoYKhYLJ/r7BybHRsbPeZ43c+TY4cBi3GuvvsbqylrVWFcdKJdHw6GJYvXSk251/IQsDh5h2+aINjfwkhg9OILqzyN4JMYRtEIGWeOsH/LpoRE+NdzHUbMFO2+wOPt1bt2+xuyGZbvt05ARTG6E0sAQ1iVE1Tq13b3e2KqeOJFumeygqt33sxuz0WiwuLjI9vY2/f39TE1NkiaOdjvqzSm8C1adKl0WL3UEkQrRCl8CtNIdAANsTBq1qeSFS6dGePLiGCfGC0TtPd66eY3B4TKT7OK5GKUsKAVeERWUEb+A8gLwijjJZSlSd19XBzabnpzC4dMLmTqtNwCSEyJr3CuvXuPrL76WrG82qTZSv9GOiVwszmXFwjQxGW+UghWfpEOU605ai4OxoTJnDo/zyMVHePbJ5xgoDOBZyUDM1HGpwkiErmyytPIqt6/PEWNcKjHa+owPDRFFTRrttuDlUb7H5QsfZWjoNE3bx29/522+efUO2vPBJjgnWJOlhHf1W3c5RGMM7Xa71/azv+hxV1Uv+5rLs+eEYYh4gvE0xBY/aXNixPH0uQKXjgdUvD1cklicxmojXnmAVtpX+1dfvPWN/91/9fn/+//77//U1//0n/518wCwfhA9U7ZQNTAAHH7ooYtHjxw5fmpibPh0Lp87Yq0NutUrJdJb4YlJTZIku0liVtM4qbdajcbq+uZsrVarrqys1BuNxjKw0wG1tMPryEc/+sHHPvPTn/7Vcjn/fJqagb6BfqrVepCmpuR52jOpkzhJXbPZdJvbW6SJEZw4Yyz1ZlNyqabQPy3/W7XB+iNPUvrAR4lzRaJ2TDFXomEVQkhUrXExXOI/OebxwvQUh1wTu/Imi7e/w1u3ZllcFRpRhbqnyBUHKA2MYJ1ib2eXxt4uKRbP93v6nf3DJsRJRyiaVfu01llEtThPtbpHf/8A09PTlEpFtra3SWJL4Ofu6fuTTptLZ/WJIKgsivIE7Sfgaaz1cGHoJgvw3PmjXLkwzuCwRQeKJE5FHASBwzY3sEkL5VIgQbRGvABUDiiAdDymOk3SypmsYVm8/dKpDLis6zWO33ubWJOATZ3KafCtYEPXjuvEcYINfUnilDRJiKKQJE46jeCWKE7oyrTarRhf+4xNHWPy0GUKQYkktLgYtM3Oi9MpTlmcV8crbzE3+w6/+S++xnrVuCRXwsSePXP2nBoYyPH6Ky+JM456u8bf+JX/PZdOPUyYeLw0u8TvvPQ2qZfPBLQOnIUwjHsb0f4CQRew9qf1WUX2bptTJm2hB3jdobHOWQIvc0AV8TBxlYBdDk8U+PDlQc4e8skTO9u24AVOF9oqtOXmf/X/eu3v/xf/5Nv/tdZqxZgfPDv0foyiqf16Jg2MzsyMX3n8ytMfOnXm5CMjwyOHPd8b8bSUlBYfh3SHdVpriKO00yaRkMSxMdamzlnrnEuOnTi5Y62N2u1WrdFoztVq1ZtLC4s3l1ZXb+zu7s6LSPvTn/7olb3qzqere2aiUCrQDJvgQCntWq3ENZstV683aLdTsVYkTVMXhqEEQV6OHT3pzp48xtDQIO7br/O9W29z48484898kCPPPsW3tmvEjRLluMahoscVtcPPlkJyC29z9ebr3J6/zZ29iM2kn5YeJD8yxlBpjMRErG2t027U0UbwnQ86K3tn703tkyhkJf7MSSBmd3eXpaUlarUaQyPDPHT5EXK5PPVGndWV9SwF0n7vBtgfmYFD4UA8HBqls93c1xpnHC5qMlzWPPnUEZ68dIidO1dtVNvFHzum4kYD8fIIPiaMUNpHe8NYG+NsAmTvU4mfKb27BYHe3/b2iarIwMu6XhXv/nSkQ1SAkUBsnOBiUFKQvC5QKCjIdwtftvPVCRpcO9N5ocEqMDpzikgKmMiStOsoArTyOympxYrCOY2YPKYVMDY2wQufuOB+6/PvyiuvbO0trcfLK83yoamJUv/aWsO1ay0ZnRpm5sgZXJyigUBrlPI6cxEPasTew6dxb6R58Pv+n7vj3LqWQUprbOrQRjAiJDhcrp8W/byzkbD8ey0eOh7ywpWSHBlSuCjBpcr6abv4F3/m8se++MrVt75zrfovtFJ7xtoHEdZ90r48cOT8+ZOXnn36meePnTj+wUqlckIpVbTGSpqmgHUZNeBIkkTCMCSKIqIodtZkxKqQDdLsKLrFoTotIYK11oBrx3FUjWO70Gg0ri4vz2+fOXP60gsffPaDA33lYqlcdMaJpKkhimKuXbvG0tKKpElKarSLIkM+n5OZIzOcOX2aYrHE3PJtrs5fQ4fgqxKrrZQt7fOhv/AL/MMwT82b4aHDeZLGDrmX/i7/kXeD3ZU9FnZCmukwiT9ErlIm318gjQ211QbNVh28zN3SGQ9xPkrFOExPrW5MNimnkC/gDGxsbnDnzh3CMGRoaIiZmRly+Ty7u7vU63WcA9/zOhU+6YlD95f2M+LXx3WIeN9zaJfgojajg8JTl2Z45NgQSWvLfeeN1/nNL36rKVKWX/1zP1/80NNnQYViWi2sr3Ae+EYyEaiNMTbBxCFiHfgK5XtoyWUZufOyiAvpyIe6kbPcHS8m9mBFr8vTqRSn0qzqZnUnasoA3XZCRkdKZkZjsmonfqfKBsp5YAJMqiH28dMCzoIoP0shXZKBlnJoJeBbyCdY3SKW0IUmL1/8yjs7c6vhnUPHJo94NAdda9ORGhkaPsyHn/4ohIZQBfzuy9f4+tXV7NO5CIfCdDRx3QLHveDUTQm7G1S3A+GuFi47Pfs3MWNS0sTiiY8Th1UZwe+sQomXdQJEe0yWdvn4U4NcOduPTnEuSfBKnnnjevPtv/J/+vW/99ps7X9zzi10ehZ/LAHrXj3TAHDsAx985okrjz78sampicvFQn5SRBU7XfGuYxEiHXJS4jgmjiNarZaz1uJ5vsRx3PUtl0653VlrO2s9QznnnHQsWDJ/biexwxgtSk9PTXjFQl4ACZOYne0dt1etUS6X2+JUc3tnq5TL9RVmjhzh5MmTopRw+/YsdxYXiJoNPOtwOU0C+LkcWEvq4ItVwZ59hrHjU7z+va9zIbnNp/UOtAexhRFyQxXKhT5MLaS6u0kjrGO1Q3kexglWFAYNaDQJdKxSstaZzKBvfW2dxTtLxHHMxMQEU1NTPafQRrPdW9j7ifV7m5cPuoH6eFoQF0K0w6HhgCcun+LRS0M0tpf4zte+zY3bG67GBFVvKioPjKU01wqnJ3396JkJ9/QjFwQfwrRBzsRkFfhMg4RNcWlKYhtYEyIofJ1H6QKoAJTXKwxmkZbuAJZ6rwSh9w8eLhOYZhGUpIiY7EVsriOA7eS6NhOTOrGIymTpzgI2h0s9TOSjTLkX4Hk5Ac+BMti0RbO5zm5jk3dnV9luD6Irp6k2aq6vv+hElY2Ip30vFp9UfF9hdAvTzkSptShlfrPBduijXIozbdLUkiaGfP7uGLKuULfrqR9FEWmaHvAVO2jXc5e/6l5bYwxxnGQCXECJA2d6KX/kx0A/qu2TMwv8qQ9U+MiVUZdGW2gvIJCiub7UXP47v/7q//rf/+Pv/hPgqlaq+f2irT9pgLWfnxJgsFQqXX7hhRc+eunSuWcmJsdPay3jDuOZJO3OYhcRMMZmIBVZwjCh2WwSRSGjo6Ou1WzZeqOWjo2N6larqTNuR0lvl9rn0dRZ6N3Us9M8KyJOuTRJ6AwBFpe1njgRxfbWTnV1dfXdQr7k/9Jf/OUL+UKucPPGdbe8siRh2MIPPLQIykLqBM/LZX1lOkWLoR0LC7aIyY1SosW4jSkXhMG+AUrlHJvtOrWNGl4rBmUwQVYit6lk1R8sSIIjIbWC1h5BkI1h39zcZHl5iTQxTE1O94z19vb2aDYaiFJo7UPH5VOJ6oyt6uXhdAy0er2DSimsScFFjPZrnrwwyfOPzDAQtPnCb/8G331zlj1GiHKHXGnomGzvNJpvvX31zuOPPzxQLsj40vV35ML0sPzMhx5xF89NggpJbJqV8cWhnMn8CVyESxvYqJlNB9KA74FXQElf5+bzsyjLSq8Z+n6A5VzWZKy0Bk91FZlZCtiZhG2NRTrTfUChPIu1EYLNxqmlGmcCxJUhLXT6AyO299bY21tnaXWelfVltK/Yq0csbEKUP4arHCKyicMk6NQXbOocCQ4lxgnWb6FcCZxGYfG0QrsAqy2iHblcgf6+AUqlMtZCq5W5mkZRRJIkRFGUmSnuI+LvjbC62rf9RpHWWuI4ysAM3alOg8XgxOJjsOKTUiAwMSPc4Vd/9ijTgwmp8V3iEgraShTKztfeqn/vv/lH3/2tr37n1ufhg3eU+vp99VryJxCoAmD88OGxsx949rkXTp899eHh4bFzSklfkibibNblJGIE6KVlSWKIwohavYVzwsjICFcefZTzFy7wD/7BP4h/4zf+1ebf/Bt/vbyystq/u7vrPK8TRUmHD+jQGF1hX7fHSqTbvCHdknYWzSE4Z8Q563zft2EUb+5t1+pHjh851GjWC3EcEwR+j1OxLmtGEwvKZeOhnHadG9SSiocxHn2FPGNDQ6SBR6O+Q6O6SztJ8ZVGkXFyojWYrPKnVNbekqYRucDDy+WJ4pilpWWWl5dQSjE5OcH42CTWCnt7u7RarY7QMCOuMxuWrOaXCRZs50tlNzAgXmaZEqeCcjEzQyFPXDjC0xePMdSvaFeXWVi5yW/+/grrzTI2P0RxcNqV+/tYuH09vnnj2lq7FalPfPzj44cnx/yrr35Hquvz7qFTU/zZjz9lx2YmicKqQkI8SdHZBNhOipdiTYiJ67i0md2IfgWlA9AeqACnNVZ5WJtDWUE7l7kfdNpdTKFMUxep7iZs7iZs7cVs7bZohxFOYoxNsaY7V0h6yn1rTK/n0Voysz4VdCqHmnqjyuraCs1WnXa7hZGYkZFxKpURwkTTiByNKMJYi681WryOdTJo7WM7xSDPy4ETfE8ReJpCLs/Q6DAnTp5gYnyS9fU11tbWe+R6HMfUajXW1tbY3t4mjuMet9XtMuh+76aEXcJd6yy6SpK0F3llEgvpKO9dJ9C0eC4FPIzkkWiVn3u6wkce6cfYdrYLJLvOoyEEw3Z5u7D0v3zl3S//d//fF39rtWq+6ZzbVnfjgh95wJJ7FOIV4MSlS+cffvLJK8+fOHHykXK5cEzE9SVJioh2IgqTOlEK4rglUZwQxwlhO6LRaCKiOHLkGA8/8ggzMzNsbGzw4osvurW1Ndvf39cMfM/f2dnJZyZtna6RA60S7203kW7rfpdHw7k0MXjKj0W7qFIpFzLbYYUSzyYmEScWT2sxxh5Uk7v3+jFZazHOMTDQz9DQIKpTuatXa1hj0LKvE6JjkdJ1SnGdgoLn+eRyOdrtNksry6ysrKC1ZmbmMGNj46Rpyvb2Tlbl8j1UR9DZfUlNdmNbySyFNYInDqUCnPKRQLAmJEibHBku8tRDx3j0wiiDlSLNvRXmFue4cafK1dkWW0k/fWMzeH7JrW/sumptV3IBkqax29vdS3Oepx5/7IqaOTwpcwu33NzNG2y9++7Gz/3UlfrPfOqRyQK5okkVzg/RYkWcZLbIkoINcVGbNGmSuhBf+2idR7wCzvOxOkClQSYgVXFmneyP02wXub68xzvzKywubrJTjzESYER3NpGOG6lklcb9fgWi7kpB7rbLZMJX1yGxu2lysVjE84UwCmm3I5IoIZ8rMDU5xeTkNMVSAWssYRT2IiRjDCZNe0tERGWThEol+ioVJicnOXr0KKVSia2tLVZWVtjc3GRlZYW5uTl2d3cPpIL75Sz708L9Vd5uJ0MulyOXy6rAaZoSJzEmNT2lfyqgbYqyQuKXMGaHS0MNfuWnTlEOdpEEbFpzztYhdWg9SNMbjq7dCa/9w994+XP/w6+/+tvAWyLSdP82GxL/mIn0CnD2+eef+/BDFy9+5PCRw2fLlcKYMWkuc8cUm6VmWb9BkiQkSUK7HRG22zRbbfL5PMeOHeehhx5idGyUGzeu88qrr7Kzs8Pk5KTrq1SoVvdkd2en57jZ3Y3ew3XcB7C6j+mMZXdpYljf2Hn5+vW33/4Lf/GXPra2unYoTYwDRfY2DUop6Xp3H2h/6YgFrXMoEQYHBxkeGcWYlJ3dXap7VUya4vl+R+fk3sPLGGvBuU7vnqLdbrOysszKyiq5fIHDM4cZHBwkSRL29vZot1sEfh4RfbAtRwRFhzAXjVNZZU6LxtcKUWBsipKIw2MBz18a56lToxRKivreOrdX1rl2p8HbszF7YYXywDjFvoLb3Nl1Wxs1GRgckuGhvtrO9vre4FDfUKvZLu/s7rk0NRw5MsPO7iZT09PSDOObf+e//e9e/KufOXH+b/7Szz02Mz2tYhs5D4XCifUSnMRZs7LNwDNOtnFxG18ErX1EF0DlcMSIV4L8JHtxhbcXGnz3rXmW15sksXTkF5mA0pBmIlWnuS9X7ByiVEZzdUS3qsteQyciA8/zyOVyWGdptJrEcUKxUOLIkeM8/NDDnD17Ac9XrK2tsrS0lPGGjQbNZjObxuMsJjWddC3zsy8UCpTL2UDamZkZDh06RK1W45VXXuF73/seq6urxHF8gGvcD1b7eznvnXzk+z6VSoV8Pt8TECdJSsb7xqRpSpKkWKtQJDgxJDpAS0Ql3uEvf+o4F460cW2DJE2ca2Fd6sT5zsaIVy64uumv/tbXl1/+v/4/v/QPrm80PyciVXePsPFHTT81WCgUTnz0ox/+4OVLFz4+PjF22fe94TRNVZKETkSciBJnM+I9TU3m6BiGtFptkthRKpU4d+4c586dIwgCrl59h9feeBWHYXJyEs/z2N3dZXd3F4FOH3un+P0DGJndC2QdUp40Tc3bb1/7R/O3b730t/723/yPV1ZWTlvrnHNKRGXk8b3l5i7JaZ3F93wqfRVGR0ddEifsbO9SrdZw1uH53l15qzgRDpaoRbL5d57nUa/XmZ+fZ2tri1KpxMzMDH19g8RJzPb2NkmS4Hn+Xd8pudvbtx+osxqDRpSH1gpfgU1jfImZGQ149qEpHjs7SbGo2dtaZ355njsbu9xe87ix4lEaPUmxr+LWVldddW+LwYFBNTYyGbca1dV3333789996ZvffvrZp564cOHiT4B3uB0lOkpSnDhu3rrJJz76sfrG8uKL/9P/439c/MkXhi79H//Gz5w7MzXQj+rLRKOeFaczuxtlFcoZlBdCeweSBsZEOMmhcxWS8jC1dh+35oRX39nh9voWkY7x/ALicpnLgcpUorKPBujaEN9PJrC//eiu6WHGD+VyOQCazWw0fZArMj09zbFjx5maOkR/fz+Vch/5QkAYttnc3GRpaanXgN5ut0nT9MB0ov3ck+d5JEnGyW5sbLC1tdXrHexev3uHenTBav+17j6nVCpRKBR6a0hr3RmGYTucVpxV1eOYNHZYE+NUTNrpbHBhyMcfLvLzL1Sw7RbSriIuxJHgxLnsfHpO6aKy5cn0G2/VX/lbv/bP/29vM/C7cmchlB+xtC8HjBw9evjK088+/cKZU6evDI8MndNKhuM4Vs7ZHpGeTWxxxFFGKsZxTLPZJo4TRkZGOH/uMsePHyOOY95483VmZ2+RywUMjQyideaGWavVMjsSnbk1yvdZjH8QYHUe75yzkiQm/PrXvvkbY2Oju3/qUx//hcXFpWER5UB3DOMORmfdhuJcLsfg4CB9fX2u1WpRrVal3W6jOh5ImZGdyniTTrpmrXGdhSdBEKCUysSeC9k4rYGBTOw5ODhEq9Vkc2sHa7vRl36PC8H+RX7XHiZrvvWUQWyLnETMTA7x+KUjPH5umpKX0Nq6w82lda6uRSzteuzVPZrGQaHklFd0S3eWGe4blLHxQWp7e9vXrl17+a033/7N5dXVL5+HO1dh8uSRiZ944UMf++Uz5y8+Wq01vPHJSd564430xqvvrD723KPVt2++ufDqN799+/nT+sh/+R89+/zRmeODkptw4uXEkjVTa2VI44idlSWW5t9lbLyfwydOEkuZm0u7vHmnyJ21JutbezjJo7wiIjmcGKyEGY/jBEVm4eJEZZIH3l/X1D13XVDxPL/nWR+G2XScIAgYHx9n+tARBgcHOxO1hUKhwNDQILlcjp2dHW7evMni4iI7Ozu9iGY/YOz/ef/a6UZG3TXQs3HeJyK9V1C6P00EyOVyFItF8vl8D7D2R2fW2myCeJpmhH6UkCQxic2EtGBJjeZopcbf/MwMlUKIa6yhTaafczol9X0k7Xc+not1KN7gTPKFr2z83s/9zf/519pKXpUf8pCqezIKwPFLl84/8+TTjz917OjRx/v6KifAFYxNxBlllWistdIdLdVut4k6o9czRS5MTExy+fJlxscn2NzY4q233mJ1bZm+vjKTkxO02y1W19d7jgSisr42h8v4W+SPDFj7oxyldFKvNVdHx4a1Ukw0Gg0looWMFs8Aq7PA0yShWCwyNDxEsVCg1Wqxs7PjtFLOGFvfq1brgrKCZM2qSGfMHD7O9lubFkSUKKWkWq2yublJvV5ncHCQw4cP09dXodFosrO9nTX9evm7ti77XBh637tVv84u7mmNp3KYpE0gDU4fLvPMQ0e4dGqSvG5R3Vnj5uIGt1cjlnd9thqKxOQwFJ2VlNhF5HMlKRcrrlVvNd5559Vr169f/dzqytrvtlPeFZHGvpS6MljKf+oX/8Jf/NtHjhy/0mw0/NHRkfQrX/rSm9/+3tcXn/7A8+f78gV7553vbh+baJz6L/7jT48WBRdUjksuP0YaNdncvMm1q6+xtraJpy0XHnqEysR5Pv/SEi+/u0u73Yd4iqAieIFC4eFLPpO6qsydAVK0KLAKEY3d5zj6foLM3vnqRDZxnHbmD3qMjY0xMzPTGUSrM+EumYFhGLZYWV1lfm6BtbV14jjudSDs30Du+turA7yT1hqlMw//3jUVetdwH8vSubZdpk16jg5djsvzsupxPp+nUCjg+/6BSK0bPXabsk3cpB2nRLFg4xhsRISPF67wlz8+zUPnCtjaTbzEIE7htMFoHyV5FIGznnI21682a3rtb/+f/+F/+uvfWP/H8sMKVPv8oI5/5CPPP3Hx8qWPT0+NXykWi2POOT/rMLcOQToCPclKtDHtdruXSzvnmJ6e5sKFC/T3D7C4uMQbb7xJs9lgdGyUgYE+6vU6W1tbRHGEkoxs7IGL7nAQNrOh/TcFLBFxWXXOF+sMzqWuMxBUQDInS7IKVT6fZ2R0lHw+R3WvRrVaQ5RQKBTc9vZ2eu3dd1+aW5j7nE9wxylnVHbknaNfa++YEnlaKR5SSufAie/7TE5OMj09nU2zqdao7u1lQKU1WulMo9RtTJZudZOOJ9VdXyqtNXheNs3Y7nFyepAPPHKah06OkPObbG/cZHFlk9urMXO7ivWwSJTm0TZwOINRCYWgJKVCye7u7GzP3rp248bNGy+ubqx90TbNa3XYPng39dZF5dD4yKc+9slP/a1CqfyoF3i5ve3tRq3arpXK5f5KUcq+tNPdjXV5/nyqPvPxS/T1T8jmyhq3b1xjY2WB0CYUx6YoD0yzWQt49douS3s5XH6cgAhxNjP78z2CnMLTBvDRuohWFufiff5R328YRfYfz/fxO2sqSRNarTa+l2NkdISjR48yOJBF9dncwYwna7WaLC+vMDd3m53dbZLYoLXfU5ofAKpOFqB6GindyQpc7wzeS5zfLQh1oj9ne4C236I6qygmvQqhUqoHWPl8nlwu16sodiNIYwzWGKxJiOKUJHa4OCKJ24QWbKvOU2csP/sTI3j1VVS7jVJRp/GmAJ4lzQU4M+a08mR2ZXHv//A/fPnXfvOr6/8f74cNqKy1IiJDpVLp8kc+8sGPnTt39pmpiclTQd4bS5LQS+LQKeW57LRqwYrESdzjp7ogZYyh2Wxy+fJlzpw5w+zsLDdufAmAiclJJqbG2N3d5eatW5ntr9KZSLJnINDRVZlOHxzff0rKveZt9/5u32PE4jBJ6jL8U2QiINvbyUqlcmeWX8Du7i5rK8v4fp5crsjOzg6vv/YWm5tbks/nhgYrowPGmVnnXGKMyQETIvq07+uTvq/Hfd9XAwMDjI6OMjQ0hO/7bG5usr6xje3YHQdd5XMnxeuOSe/R/F3vJYHAD1DO4ZKIgDbHZgZ59uHLPHL6EDkdsbn0DgsrGyysN5jbCdhqVUidTyoBzmmXkFIo5m0+KCf12ra5euPVm3PXr/3mxurGF3WZm9UmO53+lvfY6zrnRIR637B87gu/+69bFy5e+g+PTB96ftijMjpZqKSkYFtuqKT0T/zk01w4OkA7Wuedb/0+K0s3SBNFX99hhiqT3GnCiy+3WNtJcf4EXlHA1skKH4KnHBqLpIKzPqIs0ASnDgykcLgDjdQHeUeN5wf4ntfbRB2OsfFxZg4fZ2xs9O5oMDLyv91us7Kwwp07d9jc3CSOYpRWHacHDvRlZsNcM6DaL9rt/jtieuCT8Yyuk/p1QK8bbYngdWYaOrm7Xuk0O2uPTseD7kzyiQ78rf3RXU8FL4ISD6VSAi8iCXx0rPFSSzvRbNWWSW2LnAx0mgb2wJQ7wl5LEhSdTguO2rbMLWw13rpd3YafNz9UgOWcK4rIQz/1U5/8yccfe+IjQ0MDZ51zFYeVMAydZCoqsdYqYy1JnBK2IsIo7HhW3yWWu6XXRqPBl7/8ZcIw5PDhwwRBwNraGrt39jILhY5lbyYMdD2gul+E9INyVV1u4P0ek8nk706L677X/v4BBgcH8X2fjY1Nms0mQRBQKlVYW1/n1q27Q0efeupJncvlTs/Ozv4VY8yfcc45lRlW9YtI2fM8X2uF73vO932MMaysrPTm3Wnt4/tex4myw2GIQtkO/9WdQqMlm3SswSlLbFPyKuHiySIfeXia8zOjSGBZ3brJ7TtLzK60WN3NsdcYIBUftCJKs1anQt6jXCxKvboZvfHaW9eWV9Ze365VP9fXV/naRl12qLueDMTtKx30lPIizmQbmuRh71Cys/OZRx5PT56c8BIXEyV1KRaR6ZEyaXOLG+98nTt3FmgboTh8glz5EIt7ltvvVNne05lNdCHA4FCkKAVaeXjau2dsWOYR5Zwl7Vyre6/vQU8wRRBkkUccx+w1GogIgwODHD12lLHRcTwv1+OZvA6gbWxsMDc3x+rqKkmSZH9HK+49Fft1UiKCFnUAsLqglE3TOdiwfC9Hdf9q9kEaIFsnaW+DyzRYGTf8fkS9UgqnI6wDHWRyES+XGQM29m5R9FoEagTRDnyNcQFKAsQDUR65pAjUZKVaS7/+6sZrt+6Eb4j8yx8qwKocP37kJ//Mz3/2Lx49cvgJEenPoiXjBJyWri+GIgzDLKJqZ2S6c3JgmGcXAPL5PNvb2yilGB0dZWtri729vbuix3sVze5guveHBaxu/939Usb3ppCCMQlaK4aGhhgYGMA5x+7uLo1Gg2KxSLlcZmFhgfn5eRodf6mLFy+Sy+XY29tjfX3dc86NisjoPbPqnLXWOWdJ06wf8l6P9GxScTaEVDpCP1EO6NyszqH9u4+3aYu8tDl3bIRnHz7F5RNjeKbO+so7LKxuMLcOd7YLbIUjhM7HagGDc7FQKBfI532pbm+k7775FqtLiwuNduOfiPN+O0mqS1evVvtGynyw0kdfdddt7LS5iXO7mQEdrusLbp2riMjZX/1TT3/kL3zm4x997Oyxh3LaBqgICiJQZndzgRsvf4X52Vs0k4jBiRnK5cMs7mquv91grWFxDKBzFSwpjgQlCYHy8VUBlEV7qtdqo1TmY2Vt2oua7gWrTIqcXfsuqW1MSqsVYlLD4OAgR48eY3R0lHw+37Estj1AW11d5fbt26ytrfX403sbxu+NZO5GNx0XVk0vYupGxarTfXDva+xvat7fDK1UR1bjbK8i3P18nueTJqYnw+h6aO1/jW4A0AO7zmxF4zzyxRwmjphfmOf62y/yzNFpAu1hXYQEPjYpIBLgtODQTiWBS2RT3ryzdufXv3TzXwOzOPdD4dYgIuIGxwbP/bW/9iu/cmh67Pmw1dTOORcESkQ8MSaR1Dji1NFutWk22z3RXHfqrnP3j2biOO6UjTOFc7eM7ORuZWP/bsp9vbndH8hb3U+P9X7VoiRJ8H2PkZFhhoeHSZKYjY1NwjCiVCqSzxdYXFxidnaWMAw5dGiaK1ceR+mAnZ1tlpeXpbvb5XI5161AdYdW9HpicB3b24M7sMpGonY80rszqeio1TM/qpzvEBthkyq+J5w/O8UHHjrMuUP9TptdNu68y/XlHeY3I7b2yrLbdDQokUgBa1Lnu5hSsQ/t5dipbsXvvHVjbXXh9lKa1NdsknxtvR19rroeyclhfubRRysfuHBy/LFyXvrn1tqr1+e3vzZfkhdt0V8WgvX1ZtPPw/G//Kcef/YzP/Wxjz166fTlii9DxE2FGGekxuadJWZvXWV5ZYl26ij3j9I3cJSNVsDNN7fZrILxKnheIeuocWE2Fkw5At/HJ4cneYwXQ286TUZ8x3FIdi693s3ddVZ1Lmse932v92+tZhtjUyrlfg4fnulE9n5v2k33eq2trTE7O8vKykovzbp3w7sfSO3/mY7WrivvuuvtlXVDHLQI+v6bcU9bd5/sQCuF09naLRQKncJB3NsEuxGfUplwNfssOTw/j+/n2Vpf5dpb32H2xpucnhAev3wCG2Z6Qu35iC3hjGQcquQgMbK904q/+urCSzdWW18RkbZzTv7YAavTQOz95Kc+ef5jn/zwmfruhhe1WyaOU5UkRkxqSVNLOwwJaw3CMOpxVVnqZ79vJNT9ne/7dxeY/GATfP+NU9xOirl/6Gi3fD04OECr1WJhYYEkSenrG0CrgFu3bjA7O4sgHJ45zJEjR/A8j43NTarVesc0z99/48h+C5eDzceSOXfKvvl/WveiqSxycL3QMlPb+2ASbLTHUMFw7tQwVy6f4eThIVRSZX1ljttLq25hM+b2plF7ceBSO+TEE4ldy0GdYinvBgtjZm9j3b51422WN5bfrDdrv+OLzEXN5p3V9Wj32CjPvfB0/0fPnhh69vBofrrPI59TcHR09MQjJwcvLW5s/dTs/Prt1dXm4i9+/Im+z37yI+ceOXf4eD4fDBlTVUqstbnErW0uc3vhNVmYv0UYJvSPHmF44BjLuyk33mmxVW2CKqDyJZzNegY9AfGkI3MQlM5GjrmunKRjLex5utMkbCkUCgcilTRNewNgtRdgjKFRb2KtpVKpcOTIEaampikWyxiTYi29lpatrS3m5uZYXl6m2Wy+txK7T3u3P/Xbzxl1JSVKgZL9kX33vuqmqe+dY/h+NtX321zv1QKKCK1Wi76+Pqy1hGF4QPuVTduxlEpFglyBVivm9Vdf5tY736W9dZ0Lxyr81T//CY4fGsaEDSDFKY2oIpgIcQHOL2BNTd68trn+uS/PffnIkSMrdxYWOi3oPyR8e7nU5509c0Zhj9JuNlQcG4mjmFa7TavRZmtrm3a0yFa629k1VC/C+gH5sX8fAvyDlU7rMjuajlhzdHSU/v7+nmDTOUehUMQ54dq1a8zemkNrOHHiBIcOHwbn2NjYoFarZaAT5DpmgrxnN34PGdtZXJ7u6Mg6kZXndbVV3dK115sBaEyKbVepBI6HLx/hqYuHOHaoDO0tdhZf4/biBq8tNuWtFRstbESrF849mg+0HWuFu0rQtr80IL7WsrO9Ll9/7ZVwc3Fh3sbNVxJrvt1uNF7eqJEOVrj8kccn/9Ijx/uemhgvHKmUo0Bc0/kO64nPeCFhuGAHjk0MDvzEB86fHxo4Ys6ceFgXvIJn0hBtWw4duZ2dZbl16025c+cWrdTR3z/B8OQka3seN9+MWNwFp8ooX0gFUgwoh689tPLRKteJpOjYVVmsivCsyroH1V3Xgu5m11OqA/l8vhdRdcWbxWIm+pyZmaFcLncmX5ue6Hd7e5u5uTnu3LlDvV7vAdJ+0Wd389FdYLqnNaZ7zbvPux8Y3a/484Nsr3/QvdTl2+I4pl6vU6lUshahMNw3R1KolEuYFK7efpe3336drZU5im6XjzxzjF/86aeYmR7EpQ6l8xiT4mzWxiXa4JyHsbBXXeH2ne3a8qa/WI/vhPvczP7YiXYA89arr7Rq2zUzPnWEQiGrnjkc4gxpErKztUaj3WBzY404UqQHsMr+oNHc3b/pum2q0nOaFJED8r/uBe8tVqXu+7rWdlwKOgIo17HWdc5RLBYYHByiWCzSaDSZm1sAoFwZpNVq8tbb77K4uEQ+n+fs+bNMTEx0CPI1Wq1Wxovk8jhHr2y9f4HGcUzg+Xja27fLdUHKzxqctevswtmUYqdsZkrgciiK2DQhbu1SKsGTj0zy2NkphsuWcj5i+c48i6trvD5f4+q6Dwy74emT8sq7X1n5wpe+WP/Zn/vJp2xTBgpapLa+nl69/u7G8sryWitpLuOlX9lpN79QW6MwM8xTT1wefPTc6f6npkZzJwcL+NDGd8oqlRffM+JMJM4vuOHBGXfs2ENMjB3VKE+brMHYqaJlc2OD2RtXZWlljnbSoDTQx2D/YWphmZdvGFa2wEoO7SsshtRlN6KvdSdVETwtKGXujuHqypBsl/s5WKC0tjsQVVCeR+AHGGtohW2iKKaQL3PkyDGOHDlCpVLpUA13q217e1Xu3LnD/Pw8e3t7PR7o3hRNJGu07lpE92QlqM40IYeI6fRyms5A2e+fLdxr1ndXuqB7903XhcHajqvE/bIUJWDuTgJKkoRWq0W5WCJqtminIcSWXGRYW6hx9foiK8vXMe0lzs0U+MmPPM0nP/QMgZfDuhSCBCVtvMRikmZ273g5rFbQrLrt1S05cnomKhdvN2pZuiw/DBFWNyzJ9ZdKkzvrq8XxicMYqxHd7f4XPL/A2OQhTp44zq0bs9QbYU8/8oPuIvcqe3+Q571fxe/+yZ/pNRRDFjmNjEySzwfs7OyyubmJ1h7lcoXd3T1eeeUVFheXKBTynDp1isOHD/cI2Gaz2esvuxs5HQztu35GQRBkVa37CQcVd6MIUZm5pmT7lDiNtgm05xkvGa48dJgrD50kae/x3e98ia+++G0+9smfYGG9zfxKC5MbZOzQSeK24fbtW8HhQ6On+vuP1MJWK9fe3DBv35pdXV1Zea3Vqn8+53F1L0yqzZWWHBr2rzzzZP9HzxwfeGF6zJscquBrlzqx4nzfiu87wSBi80xMnOXw4dMyPHII0QVik01mlj6fnY157tx8k9mFG0TGUqhM0Td6np2aYvZqndWdHWLdh8uXO5NiInCC5wW9dHi/yDGbGiN0p1qrTs+fI0u5sxaqu7KAjGvJeKpW2CIKI3K5HCdOnODIzPFe0aR7vay1tFptFhYWuH37Njs7O+9xX92/vnobDftlCZ1NSmXzF7vLsGukt18yc99q9PukfXeLRNksaNWpgCql2Ne6fdB51GaAnVk/m8406YR2GFGo9FFvb5A2LOF6yMbSTVZ33+JIH3zi40/wiY88w/jkCKQWQx4nBk07s/rRXlYpj6poa9CeZm11Raz1XDOW6spuvbFf4/XHHmF1Tnjh0tlTR7SJys3qjisNjndOVjeSyEZwz8zMMDIywvZuE5G0Y2b1gwVY90Ymf0il/fflupRy+zRUJUZHR/E8n52dbVZXa3ieT6XSx87OHq+8/DqbW1tMTE7wxBOP9xZc18WzC1TvEfjdswD3DwnQIoiSe1orQLRDNJ3ZdLo3usmkKa69R38p4ulnJnns/ASmscOrX/pfeP3WAhtNxWY8wu++3MQvTjBy5BBpYpi/dceF7QYTk6NUKuNjOzs7fS9/+6WtzTsL74ZJ8lsq5391da+8ZKsLY9NjPP/0433PXzgx8szURPFQqRDnAhU7ZZT1/Zx4AYKLxFea4eFpDh+6xNjQSRwB1iYo3+J5KVu7S1y7/SYrC3PEjSbl4UEGRg6z0Sjy+s2YtS3BMYwLNGiDJUUrh6c8tPgdTkUfKONnim2/txF1uU1HFhlFUbzv/N8992lqaTRa5IKAY0ePc+TIEQYGB1Hi9dpfulKa5eVlbt++zdbW1oHUbf/aux+ZrpX0xKAZn0aPr9pfCb+30nfvmv1+YJX1Hjr6+/sxJnXtdgvP05JFkuous9HNFjqDWK119xDtKusZRCiWSkTVGq3tdfxwjk8/P8Wf/sRzHD96GoyHi8DpPEY8lFOItRgF4nmovMHFNVzSJE0T1jdWqYwetle/t7YHtPafsx8aDmtiYsIbHhqStZUlTgyO7AvBOr7U4ihXSoyOjTB/Z4XUmI6B2h86/XzfVPH7VfwOTH3Zt4tmu41iYGCg01ohbG9vu3q9Tj5fkEqlz62srPLSS9+T3Z09ZmaO8JnPfJbJqQlu3brF4uIiURT1GmHvdeq8Vzdzb+tFNmTU9qpEmUyhE/ZrjROFchnR7NI2th0yVNFcuTDM4w/PkLSW+ebXf5urVxcJozyucgGGyhw6MkzfyGHC0HDz1ixJO2Z0dITjxw7JyvKcfe3Vb9a31jffiMLk1wPtvbi50VjaaTZHj4zymctP9X34wszICzNTerxUMp64EC3K+jqQIK8VzuApzejQKQ7NXGR4cBohu5Gk7FDKsrW5yOzN11henKMdtin0jTNw/AK1MM933qqzvNekJQFSyOOnfmZP7GICJfgqwJc8eILdN86qe46zht20N0R0P5m+v+8vizyylCmKE5RopqemOXHiBCMjIwhCkqaIziKnMAxZXl5mdnaWzc3Nnk6pGyHst2/Z7+p5YECHZFKKTPvVpSvuv1bv1Vbdb73uzxAy/VRMLpdncnKa8+fPyxtvvBZ/4Qu/u/dTP/XTZRGKO7tVp7Und3k16bTbuE6Pqdf7ygpAgokjRBUZKjhyExt84rNP8+Tjj6MKAWliUeQQlUec4IlF0DiKODF0IzylIAkjtmo1J76iGfnxm+8s75BNpvrhAayu+vv46bMyfOgI6++8RRrtiRcUOpGBw6YpaRrSbFcJgoAg59Nstu8VQr9HE/WDVgHvVab/QY/rvrbWmsHBQfr7+7HWsrW1neX15TKVSp9bW1tP3n33mmo2m/rIzDE+9tFPMDQ0zMKdBb74xS8SRdkIrCAIvm8Yf+/o9oM6nM4IKblf6urQIgQuRcI6Q0XLlSvHuHT+EJPDKWKbvLW0xNvv3oTScfpnzjO/AfgVSqVRbt9aZndnlccePkO7Fbl6LeTLX/pCe3Vl8WVPmW+kaXir3qi+WN/CHZrgZ597dOQnzhzpe+T4WGGkP2fzSOoQz3leIFqJEknxAsPQ4DAzUxcZHT4Bro/UOrycRRcStmur3Lr5Bgu3r9NuJVT6Jxkfm2I7CnhpNmJ5dZvYDSH5IqLaOBfilEIr8HRWDdUS4BFgxXZG2QvFQmYPbIwhiiJspxjy3snMuudD7xw9C5ax0XGOnzjJ+Ph4T4eUSR38Xip/69atnuiz2ze4Dwzd/uh436Yj+wHL0901bTv+Z+49vvj3Ni//QVKbbhrneR7j4xMcPjxDf/8Ad+7ccbOzs2poaFiMMa5QyNM14rOW3obc1WV1ewfv9pqCSWM0irhtSL2Yz3zyKZ64NI1tCVFcwHkeGg/tPMQ6VJqAeBinUK6NkhjSNlGrSb3WZHVtl4HBPrm6sLe7sWtfAtY797j7YSLdB5UfTBBU9NjYEDauYUnYq9YJ2yHtVoOw3aYWNmg269lwStlXw70PqPxBQCX8YOOa7wdguVyeIPDp6+sDYHV1gziOKRVLlEv9LC8v8/bb79gwbLfPnTubu/Lo416xWGJ29javvfoGqTX4gaJYKvV0X/crNd8vqrpfiVthelWtA4taHOJCTFTnqQszfPjxE4wNxGB2SdqCciGXLlxm8tB5fvPLV3lzfo2gfASTWmbffQscRO0WpcFhDh0tMT97QyanRprbG6tff/3ayj+s5BkZGch99KmnS0+fPzn6wpGxYKIvH3lC0zkR65GXvFYK3UJrxcjQYY5MP8rg4GHQAamN8fIRnk7Z2l1n9tYNluZu0G42Kfb3M35siu2wj1dvJizthiTaRxWLWKdxJiawGk9K0NFAZX56WWtNQoJWinKhgu9lQNVqtXqCzYwn6ujs7lWsd2xSrLUMDQ1x6uRJpqYP4flBr7m3y+F0RZ9LS0u02+3exnLvOuzSBVrrqNlsitY66IozeymrEoSU7uDVexXo91b/7v3de6kW2wFcxeDgIFNTU/T19VGvN3j1lS+zvbPDsWNHvStXroxsbq6zubGBiC9JkuxzeVD4ftCrlu6nHTJOLiBJIrTSNBser7+xy7mjxykWLb6zkAjSnSKEAnIYfIx2BNKEsEZ7d5WN1SW2NndJdYF2mrC6EcXWlHeA+IcqwuocI4GXnwat+gdHbLO+Kws3ZqnValkTs0lIUkOUWHZ3a8Rx0qHjD7YRHASYDrklrts629s1nROMU1mlBUu3rRdJs8qhUz2iW+vMusWJQ7QQ+AHWGtI0cUtLS3jap9jfj1PC7flbcvvmTZIk4vyF8/rxJ54uGSsye2vWraysSHdCsofOCHHnMo/w94moDg4AUB2dlGRGdEI2OBQBrRA8ND4iFuMiEtfC84vYZsrHH7vEJ584jmfXsWENJx6eK4LWmDhkeLDIL33mWb79yjW+/K0FakmemcND7DQSIlvmm1/+Ho8+eppjp066MM73nT175ePqn/2PxZnB+PDFk2NPzYwGo6W8yynXctp61vcqgnIqrxICZRgYOczU1CmGR06gXD/GWnQuxleWrY0l7sxfZ27hJo1mjWL/CKPHz1MNK7xyK2V+o0VMHskNoLIuTHAJvqfxJMBTHk7T4/CyhnXI53IEuRyC0Gw1e1IYpb2OmV7HEaO7MWRTuYmTzIV2eHiY48ePc/jwYXJBDmPNAbK5q6Wan5/viZLvrfzt23ScUkq01rtvvfXWF0ulUuXUyeMvJGlSyJT8VmSfgdG9/OX9tFP7U76eh77ozv2giJMEQTEwMMbwcNZJkaQRr776Giury0xPT/Hsc8/QbDa4ceOGxEmayS863lq9PtN9vlf7I6tudRGncb7GqghdHuDt+W0+97VZfuqnT5FLE7SVrP/S5nGugFWgpIE2O9hog72NW6yvL7K5tUetmTAzM8HaxiZ7sUTrtc2koy2TH5oIyxgjIqKjZssDwS+WufHqa8zdmUd7XmcuoMU6CMOE7d09ms1WRhyjwAkHh8QfcK1CKTDGYU02kdf3A7TOBgVkLSkCrjPDTmmMGKzLlOBd2t90ZzVFkMRRL0Tuqwwb51R869rt3I13r6mcp7ny6NOcOnuG2Bqu35jzlpbuOBDy+Rx+t1m28z5Vr03m7gLfrxgWUQcsdEUUqvOZuqNJsnEHXkfX3iI2CblcgdHhY8zduEpgEz7207+A2bhJ2N4lH/SjJEVU2PFeyGNCQ041+dCTJ3no9Al+56uv8fqtecr5CXJT41R327z++jWZu3PHraxvBx946pkrv/SLv3wh2XjJm+7fDfI2ceLEKq0knxeFi1AoRkemOXz4LMPDJ7HkSE0MQYLnGfZqS9y+dY252zdptkLy5WEmjxxlz5T43myTpc0qbdOH9gfwxOBsgkUyMt3X+8C8Z+CJEke+WCAXBJiOqLGr1ROdlUhdZ/NCwO6zjo46vumV0gAXL5xg5ugRCvk8xphe/6C1hvX1dWZnZ1laWmJvb+9AF8F+GuLeqFgpRRRFm6+99to/f/jhy+NB4D2WpnEhi6pcbybi/eYGfj+hp8jd9e86Bao0NZRKfYyMjNLX10eaxly/cYOlpTsMDg3w5NNP4axldm5W2u02WrKe0iTJ2ty6NEU3Bdz/GQ/+bY2zghaNpyJSrVClCV58fZF8n8dPf+hhXJpgbCaulcSi7C7OLFPdm2d3Y42NjXX29tpsV1OCfIVmO2G7ikvIryxs7i0d6MT4YwasrMDu+87zvBjSGJvw9luvyfziHFp7GONQysPYlFYrc1vc3t7BGNcjQ0UUcp/krhtNJUlGlvb19XX6uIQoCrFJC2McxgIuzRaMUWgMmrSnqZKOT7chm4OZQb3FWZFbt1fdjRu30wLaf/bxJ/TFSw/RihPefvearGysoySlkAukd7Ed71st6tqCdEvWal/VTzrl7kydoHEdq8vuZCoxHY6i4DPcX8JFIY2VOZpzL/GLv/KX8Ep9uJkrmN0R4s0bBGaHtBDiWR+VajQadEISNugrePz5zz7Fswtb/MbvfZeF7SrHTj3Eznab6fFBMfJ2+rnf/e3qn/30z/qq/1Shyduu5FXxHEq0xZoWgwNjnDj2OEOj53EqT2ITtCcEOZ+96jq3b19lYfY69dYOfn+JgWNnaKUjfPd2i7mNmIgSKpfD+EJq4mwAmafxJPPfOmjdm208XasTa7OuCGNMz+Ncuufr7uLogUIcR6TGUC6XOX7sGEePnqBS6eu5eHYJ+J2dHWZnZ5mbm6Ner/e6J/ZLGfaLOg/4UfUcW4Ug0C5Nk8T3fXM/y5c/6mGNw5jMO21kZIxKpYIxKYtLt7lz5w65IODyQxcpFPKsrKxQr9d7LiR37WMORlTd6d73pqT7IyzpFAic9bNuAfIoO8NXX1xjLHedZ585j0tTxG4jtk5an2dj6zaLO1tUtxrUa4Z2S2gnHn25vNvYqpFKwe7VzFqSsL3PGOOPDbC6nuyuYyVTAoaazbp866ufd7MLcxRLhUw46izVWpOt7V12d/eI47Aj+pTeIuxM1DoQXTlnMcbieZrJyUlGhseIoojt7R0ajRZpmoAk4HwcHk4SlI3x0BinssECvd46slQQMCrBWEOtXufmrduu1Yq9xx9/onzm3CkJw9C99MZ3ZHNrHc9TlMsacR64fWH0vqEV95azD0YM+9Ib6RqudfzZlc7SFxzYrOoT5AOG+0eJ2wmttXlmBlocP2H57KWLPHa+QuOd38MbOEZpZAKKTxJurRC3b5OTkJy0EFo4l01MxiWk9Q2OTZf5D3/pE7z87ibz25YFZ0lMyz1+5TnZ2Xa1v//Pf/3245enDo1WBk6WxkqqUqgyNFTg8MRDTIw+iqZMktTQvsXzhFp9iTvz73Br7jp71TrF4gCjRx6i6cq8Pd9mbn2H0BbBHwalSGgjGLTS+JLLeiK1e096VCjkyeWC3uh003Nb7VTZuCvm3d8mFUdJxjuWSpw5epSjx45RqVQyA72ORME5R61WY25ujlu3blGtVnv81ful8Ad/pjd5ORuBJuNPPvH0L/T1l0Vrr7Q/eroff/mDHmmSVe8mJkYplysdXnWVxaV5RBxnzpyir6+Pzc0N5ufneq+dJgZjuqPpAzzPJwj897QD3V8q0f13BU7jSQ6nDMYZpBBgZZDf+Nq75PoqPHZ6GLNzk/ruMiuba6zu7rJTj2k1HVHkY60C7Yhp4WIntdBrvnFt4TpQvW+U8+8ZqLrRxQAeFz74gWc/8PSVh58/ffToU0a5gWK5DChpNFts7+6xu10lSpJMROfYJ87cn98fFHoGQcDQ0DBjYyMoLezuVllbXeuMJdKZaT8WIU8aR4jZIHA1wt06iTiMdKbVdAhZEUGsRiUBDkuxrx/nlJs5egLrPF69fpNqM6RUqIivA7QCXIIo6Yxheq+wb3/FL9MKqV4PmKiDTafWORTgKUXSGaTlTES56DNYLhE2DO3aKpPDCU+c7+NQuUkQr1MIigyOnUa8caK0D5OfRI+cIahM42pbtHevQzpP4DeyUXtWYzvEr7LZZGTJD9IOhZurVT7/nVsuTIeEfH/zX/9v/+pbYasuj1565JnpPlss+nV3+fS4/KmPv0DYTCjoATzboN6cY/7WWyzM32K7Vidf7qc0OEYsg8yvJNxetDTTCjafwyrTKeM7lM7GWvmSQ1NCKYvRce86dyOqrME96glpDwgqhQNaKiWaOM7senO5PDMzM5w4foKh4aF9tsLZua/Vah3R5yzb2zv31VJ1r2WvT3OfN3onSnauI6vQSiNKCIIgUoKL4ySXvT2RewWg78db3e9IkoRSeYCpqSmsNezt7rKyukIUtTl+4hjj4+Nsbm6ytbmNMZli33YKB9IZwOF53fTPP7Bhfj9N1363Umd1Ni1cUpIk6kyETmjEESO6xl964TCV+AYra7MsN4TdZqeqaBVWPJSyKJ1QLnpOU5Sb6/rG3/2Xr/4ni9vt37q3Nib/noHKAyb6+0tnnn366ecefvzKR6emJ84HQr+kRiViiWNDY68pe/WMXM8MyaVjSdvdMc3BC6vA2hQRxfDwEGNj4/i+Txi2abfb7O5WaTXbPeK1q0zXrkBYW+Wxy2U+/MRh3F4Nn21EmlgrHf4iBWdJjCKVPMallPsHGRufphVZrl1f4NrtNgsrTZa3YxpxAavy+PkCvi84G99NGTpEhfZ0h5/qDR+Vbr9fNlXYHQC2XlerteAFFIolSgUfFzVobK1ybACefGick5MJtjkPSQNPPIL+UfJ908AwIn1EpkDqKog3RjB8HK+kae8tEu3dITC7FFWC1RYUKElxzvTcSAkKrO5F7kvfvsq33lhlfUca+fJwks/n+xyJ1mFLCvEaP/nhQzxz5Rgu9Ji7fYu5O1ep7W3jF4tURo/RZpgbd2rMbbaI0hziD2Jd0JnnmMFx5g/fSf2UhxI/c8RUhiDIUSwWeja8XXnBXRcK7mqeelGtIk0TksSQC/IcOnSIEydOMTo6esDzXESo1xssLt7h5s2bbG5tkSYpquN44ZxDnLtrfNepNN4FqO5I96zSY11KqVQQEdV1DXFKK2xqRCvdmyK+n7PqRnD39gm+XwU7imIGBsfwPM3m5gaNRo3JqXGOHj1KvV5nZWUFk1pEPNK0syEoyWQgvt/hdP2ebc4+9cX3ia4OJKM4ZRAbgNNYF2NsViQLjcXUN5n2tzh3KKZdXyRsK+Ikh8VhFdkEciw5T1HJBzZKlHrtjn35n331+t/aWK6/dG9B/985YHVARQHTo0P9T73wkY98/PLFi1dGRwePOiUDqU2E1DhnHc0ool5tStgMSW02BlzpLMKgQxF3e/TA7tuJMgJ6eHiIkZGRTjk3QQSiKGZne7czdijzgHLWoBWY2FGwG/wHf+Y8R0ZabC0ts7WWeZunJhtkGvg+adwRuPmOIF9kdHKaXKFAGsfkCnmwAbUWzG1EXF9uM7ue8vaNVZohFIsVtBdgsxWO7/lOa+08jROU6pDqojqGeYjtSTakVw3MyGaFIk0NSViHaIcTh8o8d+UkF4fXifcWIW7ja4fzNKpQRP//afvvaLuu87wXft4552q7n316A3AAHHQShQCLWCSSEiWqmbIsucXydZHtKImdkfjmfv4S25FvboYT5974WuOzY8WJ7Ti2YsuKJFvFVCEpdgIgARAdOBWn1933Xm3O+f0x1944AEFJThyPgUGJJoWDc/Z611ue5/dk+8C9AUidgZQ2hObgsUIcCTTsfjjZEbjd26DCAOHmFFRrAa6sgvEYEAqSxSBSIMWgpAZ3NKRl6bNXq/ibZ2/Q1ZkNSKG1m9K4e083vfvEOAZdhpWZK5idPI21SgUiXUShZwgRy2NySeHabAtN5UK6KRDTkNqkYVskIEjcNPtyY0+RMNdZx7bhWnYHzhgEwc3R+SbILElhTuKgiEEq888KYWNocBh79+5Bd3cPwLkpPtLsBputJm7MzWFy+gqWltYQhQqMpOG6RwQWA9LWCLnx+9kkwIkDnBkHgaGyahBBSsC2XSoUMlqqcOXGjRszo9tG++NYbmu1mowzpgk8WSG1cyu3UG5v8xd+N0tYGMYoFHoQRiGazQbG9+yGUjHm5+fh+wEYcUipIBNyLmcCwhKwLLOzMvsqkeyCGUxH+L0tPje/NgnwAFqa58B8/YawolQDYehD+mX0eOvIYQV2EAJaQAkFJVTykSekLBeebetys0UXl8Tzv/+XJ/9xHNOZBJWu/5fvsLbgjvPd3fkjjz/+2EcPHz70nu7uwnbOmRuGIWSoVduCE8egoGlCI1Si3EbbmLxFV9K2ndwsXOY/e66HbMZcRMzbSXeEf22l7s3Nt2lF61EZ46MpDKUbUOtXsbQ0j2++MI16i0MKgUy+Gwf3H8DM1asoba4hJgW/FuPEPSfw0R98H6LmJOLWBhAp5BhweNTC3duyiMUOnDyXxotv3MC1uSUsLayj0orAhAdLuGT0E6zJGaUAsjjjN+GBZDoqTsboykkjjkNk0gIpR6Evk8VDh3fi8K5dGOxpQrdOQ61twgKBuR5gp8DsHLiTAVndgHIgdAQOaQyvFgPnIXJqAXG5hlZ9HVb3drjD+1BvjqC1eAFWVIJgIRgqAItB2gMxBqUCsFaT7tmTw6GxY/q5kxNYrQR078F+DBQdLE5fwUuX38T6xjrcXAY92/choiKurShcnmuiEXkg3g2yFCAjQBEsZnyQvCNIRNvTBkAh5TjwPBcggt8KEqwLu5VUsZW/2P5MAAj9EEQc20Z3Yvfu3ejr64fgzGD7tIINjtAPsLKwhKtTE5hbWoAfbQKRBc8pwEtzzKwvY5XnUOzuh9fYREoAgkWwEkWJZhwOMWiSOtIRGOPo7e4l0lZ06eKF8rnzZ16t1EoXxnaMHbrv3hOpfD7T3Wr5IggibTouDm6y3jvOjq3C0LdzX7T/f7ZtodGqQAiBVNrB3NxsRw/GSHRIvG0UjhAGBX6ryr69a5O30EC+10hICepCKxuMAAhp7Dy6bXkSUCwHKYGguQlmMSgi6LYlCgpcMYiYgwmmW9JHGFMMLWajCOt3qtX/KwpWeybPEdFdH/3Ih959z4kT7y52Fe5mXGfC0IeURv7COSciIik1lAqNVSLZJfxtF4+e5xkZhIo6Zs44js1Y2bHS6JsfChWDRVUMdOVgixZiv4y9A0VU7yb89TPXMLEM8EwagZ1GvZnF4to8ZAREjRYeLwwAESAUQcQageVAQoMHEtA1SB3gwUNFvOOu41gvtzA5ewNXrk5g+sYC4lBrpSRpQXYQxMxodAS1210GDc40HMeGY1tIew76+nrR05vCQJ+F/mI3PB4hqF5DsFaDLTTIKYDbHrhjg5y0CQJlDsBt6CQ+/SaHXCfkBw0ufMRyHa21Fli1C5meQWDnMQSldbTWZuCAIKwytG3wNlACIInYL8G2bXrvo2Pw6yFmLl3H86+8js3KImwvg/7td0HxAVxdaGByqYRaaEFaWWjHgmYRSElwWIZH1b76sXaIAjqRZqlUqgOKM+nd9LbK7q2pxFFkxJL9/QPYu3c/+vv7O4gYqRQ4CCqQuLEyjyvXr2J+aRH1VgOake7Lbse+HTswsHsHvbhR1qcmVyDufw9t9PYgNX0Vg2+excjmHMj2EXMJprWOYoC4g3xXDwnBgpnpqZVzb7xei6Vix4/fs2N028h4uVJJzc7dgLfmVLq7e7kQVhqABWgdBIFOngUILoBEyvPd/K23j4ZtLlW70MWx2SNxfvPy1/7VXqq/nf3r7Ty4d/77BAK/+RlLFvGMERTLwuI2auVVNJpVsB6AkuZB4ybVBERglo1KownLzatyueQDiO705/87L1iMMU1EXXsP7Pz4xz76g39v++iOgwDlozgkFSvNuSDGiABNbfm/SopLOyj0b/t/nHO4rtvZZbQlDe0Pr/nhb3k7gQBmgSCRybhGg8VT0BHHvccPwynuwT/9jc+jmCFM35jD2sI5dOcIUmn0F1M4emgMMlgHgw9oCYbQmIvBwLQCpwaiRgmkgF7G0bvfwf27x1Cr9EDHDBqKw5KcGEusIBwaN4MfWOLS5+2ukjS0YlAKkMEaQIS050LwLhB3ANsyacTcBsgGhAOpCaRY8sbcMjonHxCtYwAxHBFAqBZUs4lgtgzq2QknPwDbyyFYn0cQLMKO14wWKrbBLA0hFGqba1iYPovpietYr9QhXAe9I/sRiSKuLQHXb6yjHtsgewDSMV0NI2MVshwbDNZbVPvt/U02mwVj1EkTvmlHubPPk8ChpExw2Rp9fQPYu3cvBgYG4bpe57NFRIjiCGtLa5idnMHk/BSqfh2hjtCd78Le3Xsx1D1CK+uL6k+/80w8ufcdnH38U1ShHEqhD/tAFrWRbdh48w0MXT6PAb8GIQJ051xwx5PzKyv1N86cmalUNlYPHNzXd2D//m2Ok8r7fovnczlk0pm4UinXLl64OBPHuvXggw+M9/b2FS9fuUL1ekln0mlyElP27UXl9pTxrd2X0u1rnYaSqoO2sW0Ltu105Am3Jznf7o39forjnbsv0bmEtgN3s5kMlGXj2tXLmLz8Og7vtCFJgnQMENcyUb0rAkgwhHEEwCJhe62V9YmNxJuE/6VXQhNdTLmhoZ4n/vf/45f+WT5fOBYHKuk3FWkNMEZkdkkq2SMrRJFEvdZEpVJJNCG3jJV39Extda17nov+vn7YrpUs3wEpYzQaDVQqdYRhDEK7wzJXNgUbQW0B77qnF4+f6EWO+0jZWSgQ6pLwxrVFCK8bLtdIyzrStkbdbyIlNHYMdZtRULegEYIzZSQMsIyxkyQkC8CUAkkFrUKosIkoCMGIg5gNZXuwLBsgDg0G4pb50CV/NW8r1lkeMy0MDUgogGszOpIFpQU4a180BTR4MiIlaYV6ixFJb5F+KEpU/gpQNqA86NhFHHvQmRzQNwI7PYCwUkG8ch0elkFWBU2/heuTlzE3O4XKxiqE4HAGBuGkRzE1E+LqXAubIYd2UkafE2sgyXcUnMEicxGVzMS4U1KM2jTWfD5nkoOD4Da8L72tTaXlh9Aa6Onpwe7du7F9+3a4rtuhErTTj9dW1zAxOYGZ6VnUag1IRMjl09i1cxd2DO/Q68vr+M7p54JXXj61spQa5nt+608G5gbHeUs2KCN9ZB0bFaVgBSH6126g7/wpHFJ1hMvX/EvnzsxurKxv7t6529178EBPKpft9YOWI+MISmmtpCLX9dDT06MBWvqjP/qjbwvB9Sc/+XMfiOO456WXXtS+7yPlueR5bqcbahevrYjrrX5ZrY2W8CZXnidY7Juj39ZCtRWvdHvy8x12z3ekQby16N08ILmui0wmjfWNDVy4cBqTF17HXTuLOHKgB9WNaaSYIbPHVpY2NhvKExo9eYuEEAA51JBi7r9++Y1/efJq5b8R0NT/6zqsdwoiOvBT73/kqY9/4sc/0BLiwHq5CmEJrTVISlA7mJE6eqSbS0azZ5LYSj78br7ArXom13XBBYdpzsy/bwphfHN3dQvzHQDTSGe7cX6ijvmNFop5Fxk3hqNyELYLO70L1CIESiJm3aj5gSargnJphaq1WewY7kYuX9QgBYR16CikOFbmosk4CNyksVCcLJFjMKHBmQAXNjQzdVwnoakmpYYZXQMTib6BQ5NR5ctE2KdJmx0AQycwgMUsQZsltExtNgTJnfGWi04HSseoc/EiUgDzQSKGhRaiYBON5TLCtI9MdhD2wHZsTF7A4twzWFxcxtLqOpiTRXHbOCTPYGI9xvSbS6jWPZBdBLkCMfnQcQybmNFiJVc1ThyUxD9t/eA7joNCoYB6vZYsycXbvtnbBS6KIkRRjGKxD7vHTaFKpw2SWEoFzs2KYHl5GVPT05iemkKlXEasNdKZHHZvH9UjI4Oo1Fv0tW8/h7Pnr9BypeqHu+5rbvuRn+tZL3YzX1ZQTHNklYuwGoPVY/BCAdUdHsJiDo3yKq7+yRXYVtF5/5MPDO8qZPriKHTr9QaIAVLG2hI25Ys9SKXSEMIm13WHfvZnP3nXb/7mb37ti1/80muf+MQnHj127ETq5Zdf1NVqVQeBT47jdAItOhihW1wQdMseqc31ahe6tu/v9oL03ZBF372Leuvo2BYyM8aTn18OrVYTp06dxKXLlyErEzi+swuP3bcDpcoCDAzagkYKlYaz/txLZ+buGu8bHSj296RdUgqC1jYCublZqQC6pe/QT/2dFKzu7u5sVH/xgd/+Z7/0iac+8O73NokXX7h8nTjn0FIyDeos99pucCSFqvOWkNLoRN4G6XI7TH/rW8L1Elxt0rVFYYgoDhPhJQMjvWXUNL831y1wzRFGWdxYBybWYpAqQ+gNMA1IZX4YSktoZmw9cauFhasnG1ms+3tGC5ld24atfXvHaedYD3qLeVgZApQP+HXoMARnDFJpQMUgGYNrmZQPDqXthNdkQYKbPDbipsBoBlICYBZAAlozMG5+WqQESHIg0ibhUEuAme7ZUI/bQlp5W7G6Q0dMHBo8AfxpEAsQWR5IK+TiCuTaFGR5HVGmhstTr2Lp+lVoRRga2InYGcTUGsPlG1WUfAfC7gVSGlL7gCI4jIGLtHnT8xiMa6At5KSbIk7OOfyWQey2Wi34vt/ZN73dw9RqtSClRKFQwK5du7Fz1zgymYy5oEZhgo9R2CytY3JyEpMTkybZWim4nofxsZ0Y2zmOoFHFyZdfjU9duqInK03hbtuB1E/8/Uzm0MO7Sl5BIAXqF4CuK6w2GSLXg9sDNOvrKC+XIbiNas8BPfzT/9zJr01uK8+cYTfWZtDvCG0LrkrVSjg6MmR5Xoa7TiqRDghoDXR1dR341Kc+1fq3//bfvtrf36+feuqpR2q1avbsmVNoNpva933yPG+L8px1VPvtom2KkwXH9TpWmq1F7U4v/TvB/r7XOHjrHou2RJ+ZnVsh3wNiwNWr13Hu7OtYWVmEl7LxrhN7cHTERrg+AZGkZZO2oMnDlcnlku9bK/2D24aUboEpBcYlMpk0hO3ptxv+/qcL1q//+q+z3/n3v/mOP/53/+pXPvjA/fdGOnJvVDYRd8B67BbSYnu+Vsn5k5LWNu7w2d86q9/+37eOipZlwbYFpAqTohcjjo1RlRGHY7sAQoRhnIxF1FE9S9LQwuxVPLJAEABiaK3AwRNwIIOCBmmCijiUM1ybXVflmTebZF+4JjLPzaW3DThs32ABB8aGsGvPNuS7M8g6adg8hmYxpHKh4UHzCCQIxC1okQWEIS7yToQ4M4ULAh2GswbANZRiULEwl0MYUSqUACkH0PEtLaS57vOOE/IOm0YwxY0SFxHAk6QVDZA24lpGMZhdgtIbCDaWsWNoCMPFYbDcIM5PV/HsqQms1QGIPlgpwLS3Ri7CiCWYX8NGZ2R1QHQ3vWE3yanLKwsY37MbUoVgnENpbVheWxAqWgFhZLqqbDaLXbt2YdeuXcjkspBaIYobIGJQ3EGp3MDcxASuTl3ExvoGeMDhOS76xgawZ+8+yJjj5Gvn9OkLr2B+Yy1q9e+S9vt+RtAjT6KWsgTTBE8wHYQxNkshiHlwsx50UEN9pQSXEXLZPKJYYXN2HqEg+OOH2NLAkC5MXcfRjTkabM7LhRs3VocHR1O5bKEnjuUtY10cx/b27duP/9zP/VzlM5/5zDeGh4ft48dPPLq5uSGuX79uzP5hHY7twHZsuK5jMEJtX18cI44VuFDQ4J3Rr92VtV/oHTjhHQrX2xWvrbutW8S42uRZEhiIE9wsRyafxcr8Jk6dPI2F2QnYchMnxlwc2u3CpQALK6vIpFww7oDpFsBicBbj4aM7Rj72gUP987OTKU625lwgnQowsmOQ8p5HQOuORJX/mYJFjDH96U9/OveLP/uj7/zgk+8/rlbWPfIcFWkjLrIsG1EowcggZqHRiToCyPjilEIcKchYJjy+7w1+uT1nTcYyuQrKzg9IKbNc54LBZXayx4jNtSlZvCumjY8QW5J8ldHvdL5OrcES/rXnWRgYGep2Uk6ek2aOYEoDtGYLVDckLmwEEJdnYWUEBrvTyFouHMssPR3hwrEZbMFhWUa2YFvWLYwhyxKweADbBhzXgxAcnJuTf87TcFCGChigHHNOZhqaKzDJ2/dZo0nS32s9qQAmk+LBQaqtBidYCKBjC5oIyt2AryLku/cjJ/pxcXoGr705gWs3NhC7vSimLOhYQm1h2Hf8l3pr1P1tVyi6mcKyubkBqRXS6TQqlXJygEAHu6O1RhiFCIMY6VQWe/bsxfj4HhSLXQYqJxUYOAgOKtU6Jm9M4dq16yitLkK3Aggnha6dg9i1Zwcci+HMxUs4e/YcFhfnqZnfoZ2P/j1HPfI46l39JKSAJxSgA1RrVdLkwE1lEIURapvLYDJC1nGBWKJRroEsjlxfkajlY3lyDsL1yLnrPlxbL2o9A/HAo8XUt77ytY0f+tgPcdu2u9quDMYSUXIc20ePHr3vx3/8xxc/85nPvPiv//W/7n/44UfurtXqWFxc1EoparZaCEITWuo4NxXpQphDg9KA1q1bcgfaRev2l/vbsd7e7kq4FWjIE9Y7EwqOayOf70at1sLz3zyNySvnEAar2D6QwqHdoxjIMUS1TTTjANyyIIkjcUxBQ8GyIhw8MOQtr057Oq5rK1UESR9D/XnUVOxfm674INK3a7D+pzus5A+Xf+KJD4wLL+u2qKSJC4qVJmizZOFkhH1KmoeJJctkKaURykllyAtKJ1hY1RGKfh+/t0nWLVfgpdxOTpvWBjfC2w8G52C8TT4wrG6lkQjl9K0x9KQ6XUi7K9BKQ2kJZgl09fZYCrD8VlMzxmFZHClOgCSABAINtGoK9U0f4ArKiiEYmdUU07B54nHbwmhn7VafERyZLKYtDs44GAMs28NQj8R9Bzj2bh8Ggjp03AK0BQWRBKCaPwmSsZC+awiKAlgE0hagLBg+i0G3kGbQ8CGtEKHD0NKDmJiXeO3c67g0M4dYAtzKAkyB6RjEYihyOtnyd9QOaWxBoNw6hmxubmJ0dBTd3b1YX9uEsC1oZQpd+0roui4OHdyH3eN70VUoJCNfO6Ga0Ky1MD07h6vXrmFleQEy9iEsYHCoF9v27wfPOFi8dAWXXn0D15Y3sdI9CPXBn0LhkSdQ7h9jPmzkScFBC5uNGBEELDcDJSM0yqtQUsJzXGjNUa/VIIjByWYBrdFqNqEohtPTCwo1lpdXke4qYn3kKG1fulK8+8C+2l9/5SszP/LDPyyiKMqZb0sn11BHUdT1zne+8wMLCwuf+8xnPvPNX/u1X+t+9NFHh7/61a+iUqnoKIrI7OoCxHEE27bhOA7imHcyANvHq/bnqW1c3tpl3bQevT347+2w3JybCzi3LJ3tziCMAzpz9g19+fWrqK6tUl9PA0ePjWKoqBE01tGsELROQXACdARotSVhnCiOmrh44RQCP9CusInFIVxPo6+nW7/y4uJ8Scr52wNh/k4KVlLVe3eMbu/XETi3HC0FJz8MjYNOm8VK+6/tJ4hzDsHMR1jFEq5joSU44jCEfJtidbu3auuVsNFsIo5jeJ5nlrXJ5QIkOwWs7dWLIsD3WwhCecelvumwqGNa7WhXBKNYGvJDT1+fbjVbVClXEUgFHmtw4UApBhk3wTiHZXWDcwHOZbIwNbaH5PKLSBjontYaasvvr4jgA9BBBCA011RqYHZF4tJ14MRBH4+dGERXmgFhA1xb5mKoO9eMm3WKCFAKmgi3CwGguUmk0DE0RQCXkIigZQ6Wl4FPwPRyhNfeXMaVmfMIYoKAC9vikImORiY5hu0UIn2H5Xi702J0Kya4/XMJghDFYjegGaTUsMChVYxWGMB1XezduxN7xsfR09uXEDziTrHyfR+zszO4OnEV8wtrUEGENJOwUzZG9+xHvjiEy3MLOHnhEjZmlxGwFOSD9yP1nh9Abce92GA+ZSwFL2yg1gqwrAHPzsBShKBWQxy0YDsWiDSCWhVQBsJHBLSatSSG3YIWHLGjMTTWj13ZXZh99jSuVavav3je/6kTJ/JnLl6af+21184/9NBDxxqNhtemj7a7HyFE38c//vEnfud3fudLv/u7v/vXv/Irv/KRd77znQNf//rXtdZax3FMhjUfJGsP2dlZmefJPAfNZrPTGW0dD7cWo3bRehtu11uugO3/rUI+D8t2cX3yhj5z5lS4Pn+d5exAHDtUwPhYL1wKEJdr4DoGZwJS+KAEVKDUbWsdJSEjwGZp4gqwGMdgXzf8FvTpCwuVO5me/6cLFiUt2737d430dBUHCQAJjlYcwo+DBPkS37SXkCka7QAAYXFwJuD7AcqVKpSMIeMQzSD6rpzqt9kew/dDxLEJvHQcJykGJu5KK40wilGr1rFZKqHVbEGq9j7trUqP9oGAMYLj2CYU0vVgM8dwg8KI0qkUHMdBtVJDw9cIJJCyQgwVOeIoxEq5DCtVhEIMguGqM23MzJwIViw6vsZb0nDIKLcZZ1sojQo67aGmLDxzpozrM1U8eLgHh3YweM4GbOaBkTBLdhLJLwLU23VZ7auiBEhCMyAEB3ez8OHg2hxw+twGrs8voBrVwewcBAi2Co2+i4xiWYGZNaVWb3kzdzx6iXTh1hed7OyvCoUCGo0GFhaWYFkO/FYAy7awc+du7N27F319fUmgqdHqcc7RaDSwuLiIq1evYvbGDJpRA5x58ASDIxh23H0Uy1Y3Pj/bQm34KKoHHkXkpMDsNKg4hLIjkHZ85KVCsxJgPYxB2SxcLhCVKwj9FoQQcB0HcasFFUdwvTSEsOC3mojjAFwwWNqcNUYKRQwPdqEZ+5h88yLWrr5JjdWJcPHUK3PvHe7OPf7448Xf/vf//rmxsTFvYGDgaJv1TglyJIoi4pzv+5mf+ZkP/tZv/dbXPve5z73w0z/90+/f3NxMPf/884k3ER3/ZPK9JSUllG2DMQPbu3moMC+LbDYL27Y7iJj2dXVroPDt3dbWz6Jt20ilUkilUtjYXMUbp09j6soEeNwMDu/Ki507iiKX8rVsLFMsbQjtAuRBUQBQE9BmL8wYQxRFt+5QyYbWAprFYBb04NAQrk3Mhxt1WgBQ/zsvWMkiyL770MHhQi6XU80mNNOIlDE/MkEgZSZDy7LgOA4cx4HrOhCWhUThgCBIwUt5cGwLQjBslmpotAJj1Pw+hWJbVc6NRgNRFMFNdkBhEKNer6NcrqJWq5lEFBB0Ii59KyzNRHxznqDxLAE35SLtpmAxglQKEeMIoggMCj3FHPK+wsbqDRwbS+Pxoz144/TraPSN4uT1eVC213Qx2iTXaGNIAGluRKeJIJK1zdHaEE/NaNq++HFQbJaVOp3HdK2JlRdmcHXWxv37e7C7a92kwLiFRA7xvXaBidCQJDRpMJ4BUTembjTx4uVJXJ0uoeWnwCwH3CLjt9OEiPEEu6zAdIePCZ2M/e3xwxiSEyLFbZqetrXGccxFy/NSiCOFSrkK23KwY2zblkIlklFGd7Lw5ubmcPnyZczOzqLZbIIzBpd5kJKD2Qy+BXzl+izKB/dj9YP3oJzKAYFrRI2qiQwk+niIuh9ivh4CTgZOKgtZrSMurcF2Gci2ELQMqsa1HVjpNFqtJvxWC1owkC1gcUJXNoWdo/1wwDBzfQrTFy8iXr4Ba21W7wjr/IMf/EBvrOFubGymhoaG6n/yJ3/y55/6B58qpLzUziiK9NYuRkrJCoXCoU996lON//PTn/72+Ph4z/ve976HNzc3xYULF6A1QxTHgDIXbymljuNYO0qR4BaUUtTekWmtwZMHLJ/Pw3XdWy7tSsmOmLptjesQkJLLn23bKBQK8P0Ar7z6Ks5fvIBmfR07ezgd39ub7ssz+H4VYSUgBx4kY4gsmNAPDXDldIaqtii4HewBYpAggCQU6sj39iCMWzQ7v9qqhWwGQG0rx/3vomARgXQun0tleopjwmZZVYk0dAyyOWBlkOYxXKHAbAeel0Y6lYZl2Z19i5QacWxQx5ZIwbU5XFfAS6Wwvl5GpVpFGMVoy6jMB39rcdF3HBeNgz3oJO76rRCVSgWNRtOQB5h1k84IUyi27sxYsrgmYnBsDtex4VgWLCsByCXgNh4GCAIfURjDshwUuwoIdYgbmz68/l1otJLrXcgh2peVJMEGBEgeJyvIpNgmvZSmm6jcTrVO8DJMEWI0YXkMUubx5mwLC6slPHZQ4dCOGGm/CjvTA9g5aKRM8VU36QJt7YO5zppDhbQyKIU5vHx2DmfPz2Mj0IBtg9zYuO+lMIoyphEbU4vpmpOrUdsTtnVXspWnpNvs1qR+Oo4Dy7ahpILvh2j5PizLwfYdOzA+vgeDQ4OwLOuW/LswDLG8vIxr165hamrqVjY7EUgaySwphkojwhtTZ5HyBpDavw/MyyJgLdhSodciyMDH+poPcopIpTwEzQqCjSUIEnDSNmIZIKjVYTs2vJQHGSlUq2Uoi4PbAq7W6MmmMTrSC8tmWFpcxcT5y4gXJpFuVXDAs3Bo7w4clDGXtfXuiclpbG6UNovFQvmVV157/vlnn3/kvU++Z4dmkkgzMOKUTO2QUrLRbaOHf/5T/2Dj3/7W/31hbPeugYcfeXDs8vlztSgMV5VWEgo9IJmRJNNKKfMvC0+R0WKT1oDSRNRodUCF7eg4UxhjE5YqAa3aE5BOkN1AinvIFHLQAnjz8jm8+cYbKK2uIe9GeOBIL8aGM6Bwg9UrNXDugjHPLP5JQnfgRwwssXGZApo4WMxS2Pxhkz0rg0Qxl8H80jJakjYXlqs3AERv9679nxgJgUql0nXo8JFRLoQtQwktQ8oOdGOf14+wWYbLGxBO2nQMyb8TxaGJc9IwXZg2FZ+ThiWK8NwUUp6DtXWBjY0Kmn5oMMnayI2URmfM/G7jYhRFHaxwJptFKp3uRMdLKaGV+X2lVG0xhTmnwzjIbVsgnTbtsONYRpiaCF1BJo2ZcQHGQ0QtCcvNYrVZx/qVCNV6iHKlCm5lDPWBWwZt3NaFgcA0S6wMiTyuc8WhTqG6mUjNjEgUbSWCNhIMN4sVP8JfnVxBf38eaXcT4WYTotAPZvUALNXRaCWTs/lUMgWtAMlTWGm4+KuXLuPSZAmceRDWzYsuku9FR8GWYH30za/6JsFzi8+vg0rRymCINTrLYiljtHwffss4EoaHt2HPnj3Ytm3blo5KdcaXxcVFXLlyBbOzs53U5K1BD0YCoSDIhEdk7DSe2L8fQW0GM1/+YwTFYV147N0QXTuwuVxFS2s4xW5igUKtvAmtArgpF4g1GrU6bEsgly8gDn00qlVAcDieBQ2FtCcwPtiLrnwKKyvrOH/+CiqT03CbGxjPCBwfKmIHhRqba5iZnqG1tZWo2qgvl8uVUwuLi/XRodHHQbSz0QxIpARUrGERwAmkiGutFSzGUu959/semZ1bWfrVX//V//rg/feOLC4sXQ7j+DojS9quGGZMjFiOuDuO5QEojEjp55RWxGWspZJaKqWVVmTcJJo4551Oi3MbSgKSmcRyreIOg62Qz8MVDqZvLOC1069jYe46slYD9+wpYt9wATk7olp5ESAGxtMJcVRCIgQlKw/SMBQOJmEMZwwqob+CWFKsFEgbcopnpaFCppfXGtSU6VJ5w19E8pj/nXVYjDEtpcq9+77Djz/1viePIZSMFKDCEBQ2sWtsH2IZI26VoWOJIGogDGuIZQwBkTz4ckuKMUtkDgxZErBs2+yiXBfrGyVUqjWzPyeA3SHt9u2viCaQwOZGkGlm95v6nvbMaZaCKmmZeYf86TjmIbNtu0Mg3fp7t4V6kYjRaigomYFUCqlUGkq30PCNNiwMVWKvMPIFzahDTb1ZeOltjw23F4I2VRWKYFsWWj7DRjXGzmwWYb2BuLoMy2rB8nqhHQ/EbEAnSvrkkkgAGjKF59+YxfWZCjjPgqvEY0j6b70duJNlCoRkvHA6gk/fN6nd/X1DOHBgP0a3bYNt27cY3pVS2NjYwJUrVzA5OYlyuXwLhvj2YwmzrGR/x8ERowgLAg66W6uQL5/DlVMn0fP+H0bh6AmKudDN8rpmDZDIe1DaQqNeBVcKma4MtC/RKNWhSENYNixo2JxhbGQAg91ZrFbKeOnU66hcvgRaXsVe18bxPhejKVvz8jpW56ZpeWUBpUa1XC/7b5bXSxeELbx7TjzwI0eOHNrd39/XC2LQ0gFjMRTMiCyII5ctwhICE1euZHSzll9fWj3zlb/6yhtSdr8J/MNl4NMaAPX393vKtgdSzNrrePIdjh0d5TLs96S9S2mZ0zpmpGOQVlprpZLpg4gIXipFFik4WkJpDgUOx02hq1jE6uoann3+25i4cgE8aOLQQAp3792BfDpA6DdRrUtwYfIDoJWJb9HJZb19DSaWvNDMWuP2Z7X90lVKgcAghI219Qr8yNHr5aC0WKrVvtvzLf4Hlu3Y+cQTTnjyxff+6i//0092d/fuUBtlMKnAEaG+Po3VRoRt++6DyBQRN5uQCI3PLZSm4mrqzNJbhrOOh44zghBFOK6NVMrDyuoayuUq/CAGtR3eb4PduL1gtZE0W93vW0S7W4oGh9Zsi+DSWHuCIADjSZbclrNxJ9yAaViuBnEXYeDA9yNoLZHJW2CWj3q9hTiOtuwNhEHCJroWYkhUzG/d2N0u4Lvlz0k3EbWB9rBRCUGjNqCq4DKGjgPEpEG8aGQI5N5MD9IKsZaY22zg+koLAaUgNACKsTVG+3slXm+9Ft8uSLQSOByIIQiCDk2gp6cX+/btx7bRHUilU7d0VFEUoVQqYXp6GlevXsXa2totouOt3wsABkmT8O7BzWWHGBlHQdSEI6Af3TWMI9VQffXP/u/lYOE94thHfqK33NNNk6wCUWpB1kPku7qgHYlqaROaAJ5yoKWCzRlGRnox1JdH2KzjzOtnsXjxGlBaRb8d4ehICsdSDorVdT13fQ6zKwuoVKp+fbMyX1uvvhFJXtq2a+e+E8eOHjqwf7wHOtRRUCc3lUYrMgcL27O15zhIO1ksL6zq5156rnHt4gVqllZGH7178Ae2jXQPXr506fWy/6+nA57daKzVrq+srCwDmAEwmd++/WWrGvWlhBhxXffRdCp9yLHt3SkvPRzHOiulElsLvOu6Op3LwLUtpNJ5uOksVlfX6MWXXsYbp0/DL69joBDjnsN5jPQwSH8dzbI2TH2LTKGSqpNSDW18tCpJ6+nsR0HQOuxgqt9y2ErWMSCmq82IteJU9eL1GycBzH+3z9rfumD92q/9mvj0pz995Au/8y9+4tjhvUdULDk0EOuQOGtANaYwN3kd0zOzOHLvw8gXe2EzF4xJQHMEKgYnCSR2F9M8tJEUlul2lAT3LHCRg21bcB0bnutio1RBvd5I/plEK5Vot95q2qRbLiGci9uqtu4sHtseR/PAtcdXg6gxaSoRPM+DJfAWEyppgiIFixkhLLOAwNeI4wCplAPbdlCv19FqtRJWVwwhLIBpKGWEoVppME6d9ObbC9VNWoG+pQuhtiAXhEataYIAFGCchxEgm4B0ocgC2Ub+YE7NEoox3FitoNoyp2eGEIpicxAAu+Pp+7t03J1Fu7GSGA1QGMXw/QBaa3R1FTE+Po6xsTFkMpmO37P95ymVSpiYmMD169exsrLS2UHefhS5BUHMOTgx2BqQIMSMoDjpUAMRAV4xRcVMXnFV3kytzJ9b+fM/TL/7oRP5Xe844X6ukMf1pRo2Wi7qzQhRtQHHsqAtCcZiDA32YmSgC04cYebNs5i+ehVqaQW9kcKRrgz2F7LIxhso37iEyYUVbKxvoFarl8qbtQt+M1weGBpJHz167J6jh+/a7lpSvPL818KJS2ea//z/84up5bVlO5QFgGnNkEUUK3z9mb/B66dflxuNjXrG80Q+73Xt2JY+8H/96s8fmbt27p1//BffbMxsyHI0lL1SD+TlSjW6Xqo3p0orszcqPm4AmOzq6nq9KZq93OG7s5n8US/tHHY8ZzCbzfYHQdAVRVEGgJNOZ9DdN0zNIKRvP/NtvH7yJWyszqPgMbxjv4N9OwbBVQNBrWpGONfYibg0XRWHObzoDmPOHFd4+9mTxidqJYeVNnFja0vOmKGREAeIW1jdaFUW14MLRtJw54X736pgEYBf+/VfF5/+9KeP/OW/+9Q//ODD+x/R8IUUttlosBgcNbQ2LqCx1MC6XMbUzDU8+NiT2LPnCCzmgVQdjBkKYRiqDp9965WPIGHb3CzlJZDNerBsDsd14KZSWF9fR6lUQxxJaE0dE/XWP18SqQQhrCTBVieWm5tdjKE34NbOhgBoCWKk25mEcWwSX5rNFgkeJyxxe4v8gYEpGwoKwjKEVMFdyECg0fRBjJAv5OA4NhqNBoIwaH+RnUtk++tinCUdod6SPvw9VP9KwkKIfNYFB8zakxmPIAfAdGz8kEqBuDZCM86wWY6wuNZAEAC20uAUIzCCfnCN7+v3vp2j36YCSBkjCHzEEsjlCtizZw927tyJfD7f6UzbxaparWJqagrXrl3D8vJyR7pwO1N8K2ng9tAHDQIn0kyZmCvH86hroFetrs6H33jx6cUbs+tTQzt2ZN9//Nj26OSz4uzJZzF28KiOioNoeX3guTwFJQWr2USxK4OhbQMQICxemcbcpYtozs8iE9VwJOvi8EAXerSPyvwUZhbnUNpYx3q9CoQKVsRll51OHbrvgWMHjh8b7u3u9S6deV1fPPOSPrxvkD/24+9zL778Rf7e9/+g/ptXJinTPYr5mXn91a9/I9pcX/M5i9no4GD3Qw8/xob7+4Lf+39+ffovv/S1K//oH//UoUy+mP+zv/za0NzC6t5GyJ7ozqXLzSi13GrF15rN4Fyt4V9fq5cuzJdKC0n39XxXV1ePEKKYybij6XR+yHGcXdevX++7fPlyvl5rHt7YXNvmNzZZzglxbKwbB3b2ouCWEbZW4UcOGMtCUwxoP9nyss6RSikDBQTBXJq1AnQMriM4DoPrCChmIYjMZXirELTjImHGDxtqjVqAqBHG/vd6R37fBeuZZ58Vjz766NHf/Zc/+4sffu+xD1FzPaeyw9CMgXFGimIo1UJXRsBRm6ivbKLG+/HVL1Vx4+4JPPyuJ+EV+mE1N0DJ6MEkEJnUP0hJIM4hIwWhOYhpODAMKgDoLhYgbOOpsqx1VMo1+H6AOG7TSW+q3OM4Qm9vL4SwcGN24Wbk9i3qRtZ5aJLlZEfprpREpVrGwQMHMDwyiKmpCbiut4VequDYdidejMEBdARFEoKbK4lNNhh30AxaiKOoI+uo12toNs2YaNJ9ACF48t7SHb8dQYH0TSuLiVa/3XWf7HBUjN58CjJsmq9JiZvhGclCXHVoq4bZ3oosNGocTHEwba61GqIjN2mLO28dU+mWC207bLOdDByGIRqNBqSUyOVy2LV7HOPje1EoFDqFrc0rbzQamJmZwdWrV7GwsGDi2LYs02/ParxTMk3bHRBraCY18qkM5TN53QqD8qvPvHDjytVJq3+gT/3gBx8f7OvJjwaRzJbKmxpEquvca+jhOcZ8oTMHjupH3/cYVks1pNJZLM4t0uSFq2jMzMAL69if9vDAUB7jqKK2Nom5pVmsrm2ivNlC3JIoeB66enNId+W6d+7bU9wxOsIXpqfwhW8+rTfXl/HTH38ffuKH3s0Y1Zwv/6dJvP781/Dud30U//3rJ9G77Si6i8NhFEr58Dvuto4cPmwxu0iapwZ/+Kf/9+a//je/8tLu3QejJ9//jnt/ymLsS3/1TTYxN5+pNsOMzcRIxuaHZdp+Mupy1ofD3LlmJN+s+vJ6tVybWtksLQKYXlvDZWAOADIA0p7Njw51F/9RTzE1enC0C3u35zFS5ND+Blp1CbI4JG9CEwPTHCKyzHWZjJaK8fb+t826lwB8OHaMfNrCzm1DUHGEqzcaUNpKRkJ289q/9TEkQqXeAHhubWGzsrrlQ3fHssW/n2L1F1rzD46NHfv3//h/+8Wf+vGHP2QFV3OxVKC+I7C8PuKtAFFzFVqW4DoOsmkbKryB2sYSWtUISyuTmFmYRd/AMPLFUUObZJTkCiY4Y9NUdnZZAHXO1jyx1NgWh+fZcGwBJkzBkYih4raWhBsZBDOhqIVCFwqFPGr1OlzPgxA2OLfBuEhyU5mRWRDAhE6WhByMc7RaTTU1ea3xoz/8UQz094gbc7OIlOENRWEMrSQEAYKpxIXUtvgkC3JKui1m/gxKGhmD57oQnCOOA0Rx0InwMot/gCDMn4mZpSRXzIzPpDrX1tuE7JC+jwf3AsWUjzgO4EoLXDOQTSCeAvE0QC4IAqQ0lA6wUtOYnLWx0aoiFgqaJEjzhO2t3nKFbYdmtj9L7SxA13UQS416o4Vm00cmk8XefQdw330PYHx8DzzP64x3ANBoNDA5OYmTJ0/i3Llz2NjYuCX2bGvH3d4XboXPbU3C5pxDQ2vXdtHX1wcSvHbm/JvXvv2dZyaC0K888s539B8+fHC7Zdl9jVbg+kGkCUTNSm15dmLm3Fh/QT9111juhT/8D7K7uzcK+kb4qVdP043X3yC5OIvddox393t4d1qhq7KI2emrmJ2ZwvLyKkobJViCoW+wBwP9fdi1dxeOnDjKYgI7e+6cXl6cQ7bQTe9/z4N0754u6s0wiqpNOnjsXnrlmefIRgO7xsdwdXKB9h+4T+zZu8+9+8i4TeDQYHppeXnJc53WgX276N/8u9+efde9h3L7Dx0t9hUGUK8uaugIOtKaU8gB5VmMul3O9mRsfqI7JR7sy9kPDven7+/Ou8eKeWv7QE96b7HLGx/s795z1/jIPbv7xF2PHh/tPb43z1KoUKtZhWQC4OZFlICKOmWDI3kOeQzwCEQKnAhcathxgHxGY8e2bhzYO46dO3eBKY2Z+RIks+BHEiDz8+NQIE5Q2oJlc1jMQtOP0YwyZ77xyvQXiKj03eSX37Ng/eRP/qT7Lz7ykeP/5lM/+Q9//u89+SHOV3PkL0BSCrznCBHLQ5c2ENWXwakGzmKkchkUurognCbqjXmEdQa/JnHp4jlwzjA6dhC2496EAiuAEq2RTq7wWxEZRkeUgOw4g+t6pgBZIkHTtJOdVbKMNhepIPDRarSwtr6Ger2OMDT8JCljE0ukbjLi22kh7cVhJpPWIC031tf5Y4+9i+/buxfra6uoVMqweJKUK2NTaNtWINzc5rdTVBixjrm5jdGxLQue5yb43yT5hQhaAULF0CShiIGTlQx2SWiqvt1IbAgGKTvCw0dceLyOKMF4KG52D0ykAe4CzO3sGsAZzk9u4tqsQkNFHT093dZB3VoYEzMzGS2VEBYAQr3eRKsVwHYc7N27FydO3Iv9+/cjlUrdsqNqtVqYmprCyZMncfbs2c5Cfevo1/EtmEJFWyPS27+S76tOPhvEOYfrWWpmdmr+ueeee31ldXH53ntPjJw4cfxgNpPu933f9oOAlNKQSiOfzVI2na186ctf/eupyauv/L0f+eGhg3v35f/Df/qTcDOEVZ+8wMZUkx7tzuOd3VldqG1gZfYKJqcmaGlxGRvrm1BKo7u7GwMDg9izeyeOHz1EVrGHTr55BrK2ho994H10+NiD1JtJQTRWsH/HCHLZnJHScODQPXfjC3/xeewcH0Mml0OpVCM3k6e6H8JvBjh16jSef+G5U3/4n//TX//Qx35wWy7X1fX7v/8Hax9494eL23fu9mxUqbq5AWiHaW7EnkSkOWNMcHItoQuey0dzLu0vZvix/i7vwf4u7/Gh7sx7BrtT7xnqyRwfGkj3u9wXQbNERDFxYSWRdDFo6+qczOjHuQKYhpYWSJnrqYUG0ukAA6Me9uzZj92734GegSNgbhEgjanZBTSaoQkrJuogwAGDb0qlHDQbdQgrpedXgzdfu7j4N0RU+R8uWL//+79v/at/9a8e+r9+8mP/9Jc+8dT7bGs9B70E7S9B8h6y+0+AYht6YwHw1yC4n1yaCF6mgN5iATlPQvkbaJU3ETU1biwsYL2yjOGR3Uhnewz72SyawFScbOR4x63fIY6SoVa2k5Bt24LrOmCcwebc+JOU7GhzLMss+2IZIZfLdXDJtmPDcZ3OFctgZC3YTjue20mwsoKKXQVLyZjPzs5iZGiI3nHfCQgusLS0hDCW0IzDj2JopZJLH3U6gY5somMgZQkJ0ux4tAZc1zWue2USiI3yT0ETh2S2+cgoI7hjxDsj6FY2URxFGCxEeGi/DRaWAB6b4ZIB5Fhg3AO4A5AhMIABmjE8//oCZpcUmCuSU3NbsHqzG99qsxGCw3HsJD1bw/cDNBs+XCeFsV07ce+99+LgwYPI5XKdqyFjLPH7zeL06dM4c+YMlpeXOx3X7cig9vcvn89DKSW11pIxFjPGgkRTqzlninMiZqTrJARHubKhXn/91ERvb8/SJ37yJw7kspn9jWYtHYQhRZE5BqTTaert6UE+n0d/f3/6xJFj0V/+5eefW55b8H/h5//+3Wubm5mpS5fYfcNFet9QD8aDOurTlzAzdYmWlpawtrqBIIhQKBRpYGAAY2NjOHrkKHqHhnB+agYrs1fwocfuwxPvfQxnzl/C17/8NApuCwf2D2NoeBRaGumCVAGclIfx3fvw55/7Y3rsXfdTrVamUFlUazF688x5jI+Ps/sfPIGFpdmLX3/6m1Of/OQ/PDI9vx6++NKraz/wvkf7ejJ1e3P5BjYqDfJlTFIrgtYkODNdi8XhOFznU8S60lx4jk67LM6kRJyxqZUm1XQZi4QlJDyXwDlI6URqk3TXRIDgSVeVxOLppKQJHcOzJXoLNvbsHsHuQ4cxNHoETmocWvWDWBZOJouNjRUsLRrdFrGbIyEYJc8o03Hok+PlWxenSk+fn1z/NhH5/0MFS2tNx48fv/v/+MQP/OIv/9QPvd9VlQxEBbYoQfobJO1tsLqPgLcioDQHkhUw7ptFGjOjmaAMegr96M4DpEuo1TYQRk2sri7gypVJ5AsZ9A+OwrYdM0i1Jb9bNTbJXqNNOGSMTEYdAMEZ0ikPjm13Cp/SBlWjoTspLLGMkUlnYDsOmo2GEap2KI6UxMK39z0cnDNqJ/dyxijwA7oxewOB38Q999yDHbt2YHVtDRubJRN8EUnEsUzU7GY0JTCAdEeU1/kQCGGWldpgnI09xQXnAmEQIAZBkkE9q6AETi0oTWDcAUHeciVkjCEKfWzLN3D/GAM1a2BMQ2gNBgHtpEB2BsRcEBPmC9ESkWY4eamO9ZoN2GYUNAXrZjjA1qV725+pNdBsNtFoNMGZhV27duPee+/FgYP70dXVdQsJIAxDzM3N4fTp03j99dcxPz/fseXcCRzX7qCEEPA8T8/NzVU2Njaq1Wq1VKlUpqvVslpeXla2bdWHhga9ZrPBGOMEKHgpj42Ojnq1Wo2uX59Y7+oqhJ6XyvitwHIcBz09Pejp6UE6nSbLsqChWS5XGNo/vi/9x3/2XyeOHz3cdc+RwyM9tk0HHAf+4iwmJi/QzPy03NjcXFpbq5Tz+UJqaHBADA8P4/DhQxgf34XZGzO4dOksjhzdhh/5wQ9hdbmBP/4vX8Pi3Cze88gIjt8/Bt6Vw+zqBqJQoieVhkVAHCvk+4bQ15XFF//iz/De974bKxs1OF4P+vsG0dPbBU2ysHPXzpHnX3h1Ym15c+WX/tk/2ftfP/enjQKvsf3jXtfcjes0u7ROpWYLzRaSyUG1F6AkBCNLMOI86WmSTokxDcfh8Bwiz+Fkic5Po30LMs9W8jxoZfIpGTFwUuC8glxWYueOIezfexdGdtyHdO4eEOuGRgqaXCjYIOaimBOYmrps7HDEbwqXk2fTYkDasymS1Dh3afHr1xbrLxHdEeD23QvWs88+K8bGxu76xx999yd/5VM/8QM54WeVboFZCozKFPs1UGYv7K67oUsV6Mo8hGgBIkxEZInhVQFQDtK5XvT0pOGma2jVVhHVQgR+ExPXLiAKAoxu3w0nk0++HBOUqjXeAhxjnXh6Ak8wLcQAz7HguDas5JwutVFyKyWNkTi5XDFiSKfTiOKoQ7nkCZKmndiylXUAaBN5SIQ4klhYWsH84gKGhgZx4sQxCE5YX1lBGJmFeDtOrIOzJep4u9oPMuNtuB3f0kGaMcu2LIRaI/Kb6HZCPHpsCDmrDmIa9ZbsMN63PuS+38L4AHB0RwqqpRBzG5w8MNEN8nrBeQFEaWjtGDytVAikhZNXWyjXObQdgZQA0xxEsjMMEplYKNsxWYC+H6Beb0Frwo4dY7jv3ntx9913oavY1RndOeeIogiLi4t4/fXXcerUKczNzSGKoo4c5HYm++17qraMoaenB0NDQ9bQ0JA9PDzsDg0N5rp7Cm6xq8sCaSeMQhNmYvJMwLnl9fT05Ou1RvXpbzx9lohP9Pb0udu3b8+n02mWUDeondKslLIGB0eGXM8r/+Ef/eeJu/bvGVHVam760ps0O3ldrW5srs+XSudn19ZO5qy0OLB3fOjg4QP80MH9VK2VcObsKYyMDuLv/fgPIc1j/Jc/+yu8efZNvPPwID765D3oHh6BHzRAgoGn8rC1Rq9nQ4cKYDYCP8LQjj2olUo4eeplPPjQQ1hbWYfwMtgsV+A5LnUVeooH9u33fv+zv/f8nv3j9l379m//4p/9p8rOUa97YWnVuXqjoterAfkBIQw1wkgjjCWiOEYkJcJYI4xAQaxJSjLyTmaRIwR5ScfMualQ7fGv7aM1qKAo4cVpWFwi5WgMDxSwb99e7NxzFIWBu8DEDkANQcOCSnDfIEDHMbycQtSsYG5+EUyIjgxJQ4GDIWMLeAIkNfOnluvfuTRbPfW3LlhaaxobG7v7Fz702D/5jV/8qY8URNilqEWwBYgxIqpCBg3w4kGwzB74i4uw4g2Q8AEWAjwhV5IJOJBMQzOC7ebQVxxCl2uBy3XUajXEcYy5hRXMLKyhd2AUXd2jsCydmIVvjR1nbY+dbqdzKICb3RMRwXGcRCtldcSfCSTt1jENQDqVghACzWYTUWyuU+0VFBHf4iu8aUhWYFDEUW3UMDM9gTjycf+992D76DDWN6qo1mqd//12bLo56ulOogh1AlLR6SYYMyNhHMfggiOVcsGiOg70AO8Yd7A6exb7D+zFhWvzgEjfggcBgCiOceLwCPZu64LWHli+B3a6F+QNA6IbUDlo6UFLG0paYMzFaqmFl97cQAgPivsgZYGDQZPZyRmKq90xHFdrVShFGBkaw3333YejR4+it9dgcbWWIGaEtMvLyzhz5gxOnjyJyclJtKkEd8KYbO2obmeWAyAppS2ldOJYenEc56Mo8BhjdhRHThAEdJN2QMTIyFeiSNmFQrF39649ePrpb704NTVx5uDBA9sKha6e9ojKOac2plkr4ezet7c4uTCz8cpLL7So5ffOLs2WquXqqbUbqxcgeXBo/4Htjz360P577z2SUaTw3HeeoUzWw4/86Mcwsm0Qf/n5L+KlZ89j/45efPRDh3HgQA9qzQZU7GEsncVAsQdL6xX0F7LIMA0oghLmABI2NfbffVS/+sp34Ps17B7bCXgFuOkcWo0APV09VMjnMtDxm3/wH//g1cGegd0rs/NBNqNzpWqcuzbVQKUBagYxwhgIIoUw1gjiGLFUiCKNONJo67O11hCcw7VspIVj9sgsiWVh2rDrNJLVgzZaXKYhBEdvt8DeXYPYv/ceDAwdgZ3eBUl9kCwNYjE0GVE0aQ6uYw3WAulNxK0Gpm/Mmc4CZtTgABzOkXEFBGLatWefXw7t7zx3avoUYyS/m6yB316siGjw555810//6i/9zI/2ptGtZM2gxUkRYxpKV9BidVi5+4BmHnrjBoSomby5rQ4zrRIxKE9i1jkYPBSKvSh2pcBpFX55DUG1ifJGBdevX0fMA+zYcQCOmwGUBMk4CS8wHU6bQqCTyyeBEuAcEhGq4bu7jgPOlQECamZGxCSiG2SKgyU40uk0wsA3wZOJYNKwqnXiYDEeRt0+zDJzQYulxMrKGm7cmMPwyChOnDgCrSOsriwjDg1ORsWJMDVJ2yW6eV1rL/eJjPZKCAHOeLKDi5F2HIQRsOlrsPwIzl5dRy20IRUHV3YS4BlDRg76u1x88NhxZK0cYBXArS5A50DKgVYZkEobBT8sQGkwJ8b0wjxeuFwDd10kXnRjDLcsuF4axASCMEKz6UMqE5t14sR9OH7iOAYHB4z7PkHKEBjWNzZw5swZvPrqq5icnDQUhS0vidsJsaZYtRlhlIzlLBlZjIvE/H0jDEv8smQ8pwyc8eTmQAlfjIgxQKkYYRiIXC7ff+LEPZkXXnjxxdnZmekjR45uT6XShfbrnzFGjNrIFWQP7NvXNzlxvXJjZn6iWmmcadRKk+P7d+5+1yPveeDd73rvrnROpJ9/+Vt47pvfRtRS9NOf+AW8+sppfPlLX0J3VwbvfeIeHD+yA1xKRE2Goe4BbMvb8LRAuRWgFlexPZNL7CsWSDNI5YJHNrgIcPDAGP7T734Wh/aNYWJ+hb71zPMQjgfLdfHSqy9iZmb6zYmJ6Wc5rMGw1bR6e0VvvdnqXlgJ0IoYhVIaf6ACpNJQmqA0g5QEqdr7CA3BYC7tjgXPYrBdDs5jMJLm2dWmcFkEWDqGjQhdOY49Yz3Yc/chDO88jnT2EIi2Qas8FBOJWxBQ2jcXfxlpkpuAP01T89fojTfPwm81oWCTgg0wBaIQFqXgWYRiV4v6+nc2/8t/e/25K4ul0wnE7nsXLM4Zfv3X/+Xg//bEQ5/4jX/y85/ozYsBFVdgWQrEFAESjClIVBEJB3bqHqAWg7VWwYQPYmoLFcDomah9HG3bX3QMrQleugt9fQVkPRuxX0G9toogamFmZgara5sY3bYD2UKXOfdDQ8nY7IGSgrNV4N/WLTEiY0YG4LoOPMeGZdngjJvRUOmEGw9wJqCk4W5ls1kQCI1Gy2BMWFt9v6UjSPZZ0DL58ZjldLXWwOyNObRaNRw7ehTbt29HqVRCtVIF6aTDU0YoyW6Bo2GLPAA3CZGMgbQyHzZysVKTmFvzsV6ViLVt9C4xh1QRYh2CqRQGugiP790BQRpahIA2aTGkQjAoKIqgeQxGSRiGHWJ6aQUvXK4hlhEYOFzPhe3aBqgXxggCE0Cbzxdw9OgxHD9+AiMjI7AsAaniTiHa3Czh7NlzePXVV3H16lXUarW3jPF3kiiYTge37BDfKg413WlSyJLj5pb91y3DuwaRJhCDVgrNZovl8/meu+++2/vKV776YhzLjQMHDu5jjKW3RFMZGKqS8BwnvWtslzc1M7OeS+Uz73jgvgfuv/+euwaHejJvnn2FTj73dUiEePIDT9J7HnwHXn7hm9jcmMSHnrgX7zqxDzwTwY9a6MoXMdxdhKtCUByAbA/zfg2MEwbtImTMobUNpgDhELiI9cbaBTzz0nfk0986VV1cndVXppbw5oUpdPcN4eTZ19n5S29WVpbXvlgulc4Xe7u3hfWNaOf27O5ms9G7uu4jUu1X603PmU6gebFsG/oBxhRsi+A6NlyHYAkFYTFw0mCKgRSBw+ypmG4h5SoMDXZh/96D2LX7buR6j4Jbe6BkHiAbxLVZV2uC1qQpdsDjCKQXsVQ6j5fOvrr5R597dml9rW4XCwUnVqQ1Y0QUgxDCIg8pm2F8PEurm2zxd//w1BfLUl6k78FHFzd5PGrwx5448Ynf+OWf+WR3Vu+QUYlsHgIkSXdUqhJk2bBoGxhSaPoLcKwQYEnncItp1iyd21wnI1cwHzgVaThiO3bt6UK6kEJucgoTs0to1FqYfMPHxsoM3vXEhzC+9xi41wArb4BaNUQqhAoACALjBCmNpAFaICaVZCloRFEML51Gr7CRSrvwUhbW1suoVpvw/QixVGDcjI2+34KX8uClPJRLVdTrTaTSDizL3rIgpluFk+bZAGMczWYLb567hNXlDdx3//146qkP4/Sp0zh77hykIuhYoCkbkNKG49rJA0tvFX9yQsbyQKkUatU6/GYA17LhuTYyKQY/AjST4NKCZgpkKQRVCYtF4N4mtKqCiwgylggDZUyqOjKqd5GCDCxwIRBLC+UWh+u40GCwHfM1BX6QiGs5tAZ27NiBPXv2oL+/H45jJ6gXAx2sVCqYmJjAhQsXOle/dkG63UKztQjdGlGlb/n7t3PE34rsBd7O1rhFv0WGCOHrpaUlZ/v27e/65Cc/2fiP//E/fmnnzp1PP/TQQx+J49hLuj69BaCHXC7X/bGP/dDDmxub1NszYFkUYGn2DV2wV/B//vLP0MjQMMAj1Fs17Bw9CJZyoRlH3W9gW6aIrkwWXCnoIDQIIQnUHYnNMMRYYRBKueBxBG0zMFuiVZ/FuXPP4o1LL9GZK+XKSkPOOpulEck8J5MrOItLy87K2jLiKKqS1osAIq6UIouHnAvdaMbm80VGNt4+mbzFKK9vkk06ditKyNhagyQH0wqCAZwULB6j2F3A6PZBDG/bjXxhL4gPAbELaBvMchDrCAwEHlkgSVpZZTBWQbN2Q12cuBh9+flz4TdemfrGxnSz9CMfPv4xRVZGUd28WJJLI+chspm0zmQH6OmXp0vrYbgIInUnjvstBStZQA782GP3feK3/tHPf3IozcdiVSXBQzAWJbwIA5xTWkOzHDjfCR0TmKqCiTBJZmkHELS/O1shdOiMDwaZwk2MFgkMDexENpVDd2YO16/PYqHSwuZcgC/+RQl33zuPxx59Lwo9w6htLKMZGEytRjvlN1nOawZNhgXPiODYFmSswFwFYaUghAlycN0GSqU66vX6ltQdY78hYujpLaJcqaJer8GxJVKplLG0tB82urlT08lyXSUj1dLSGp7++jewd/84jh8/jpGRQXznhZewsVEDFwytltmnOY5JQemgZcjw3oVgcBwHmVQaMlao1wMwLqCjGEQcjmNBUQimzS5NcA6pG+jKAAyriMM1cM5w5dJVrC6XIWwHAhEkd6HcQdx39F1gAYNiDnLd4yh230hcATFardYtequBgUEUi0VIKdFqtZKMO6DZbODatWu4dOkSFhcXEYbhLQVnq/DzlgCDLVabTkQU3RnL2wmeCMMOntpcRM3ecutn7OZDiU7XahKPbcRxjKWlJW9sbOxdH/nIRxY++9nPfqenp2f7gQMHHgjDkG3ZqxERaSklZTIZO5VJAdLSQaOJB+8/Qo8cGwU1NBD4QFRH3mHo7u7Hq7PzCFgBfflt8EWAxVodDudwGIfNHFhOChsRgVQGBZaFkiGEHSJSZVy/dAbnXn0GzWgJ23YNq3NXGxPNADPCSo34IdKxBNZWV7SMI+KalqMouuF5ntIAc23LjmIp6rUIsWSImVmbgG41rLfBkB1PbVsbSAlwkRJRNkUQ8CG4QjbnYtvIILaP7UNXzzi4MwBNXYh1CpwFgPShpAXiNpRqamIBmKoC0TW6tjQZf+f09Tf/+9cnLi5vuOORHpop9s1nRIqlYtaClgGIHJBK1hPaR19PPzarESbmy6plUhHwvcxgHAD/gSeeeOL/+bV/8U8GhDUOWQe3QmJMETGV3MqEKQoaCHQWVnYPVL0E8suwRJRor5IxkHBbLPytskRKVOsgE4KgYweunUNPsYBCjkHFAcqlTciwhcX5BcxOz6CvZwA9Q6OwkoQopRLDbvshMJF3hskDc/kjAMTNt8ASVrKQF+DCdH6ybdfZgm+JohheKgXPTaHV8hPCQHskNFfJmxhl3PQmGhAbgjDE6uoqVleXMTQ8hMff/R60/BZWV1cTg/DNdCBiN0MxbFvAdW10FbvQ39uD9fVNlKp1IDkGkDaEC4UQSkvzelAE3WziwC7CgVEN0lU06xuYmZ5GuVxDM/DhN+qoNiVOvjmH8V1HUfB6EKo0JtdDXJ5Z6Ag720UhimJksjmj5o8iuK6bMMwJ09PTePHFF3Hu3Dmsr6/fUZ2+VYZyZ8Gn2WneRFCztzDH49gcXHbu3AnXdVGv15JQVf0WjM3WFJ5O2IXWIGLUBgo2Go3Unj17RhuNxvQ3vvGN0ydOnBhKp9P9UsqtbTNprRNipwbjgixLYHNzBTpooTeXplhakKKAmCzEYEhZLnLcBvNbiMMQfuBjo1xFxY9RDhTWmhE2qwFGMwUUHQLxMhanTuL5Z7+A8+dfwrahfrznifcj3dWnn33h0smp6/UL27YX76pHbjGSDqAJsYpJKXmlVtv8MmOWk/a8u1JWMNhXdA5vrDcztYCghSS+Bfp4qwjXvBwsAVgWIeVYcB0BW3DYnMPlMSxVRzbDMLp9CHv27sGuvUeQK+4FY9uhZT8UPBBJkCIQ0oDm0LoBbq1D0gxKlcv61ZNv1P/wC6+f/f/9xcXPTFbE2cGhgWNxrc5yXn3Xgb09uwU1k22ORVxZYBooZAX27hrU568v6TOTwbk3rq39NRGtfy/IsADA3/2+R4dG771vwJ+eJr1S0Z4px1BgCQGTJfIJDrIHTKpxsAqHPBB8aBYC2nqrXVqLm+wmSDM6tt3asZWEeBo2FhN5DI8eRjo3h3z+Kq7OrGGj1cDSZA1//rklPPSu9+PE/e+E4+awubECoI44ZtDKXLfAAMliCOImmp4IAgLECTEpMCbAuxlSKRuuy7HhuKhUqmg1/Y4/kHNCGIbg3EJfXx+q1WpCh1Ag1zWFMVGsU5KvR4zAYIIYhBGTYXF+Fetr38ZP/+x23P/AA7h8+TLiSCZ5jAkBQsbwPBdeyoawBFLpFPoHeuFZFsLIT66W+qY7vp2UytoPJQfTQC4tAArAmEQcNJHxUgjTNiS3wREjaHHcWFqCipihtjEXQcCScB3TmsRxjCiKIARHHMeo12sAdIf0OT09jdnZWTQaja2XvLeVKNzJqHxzvKO3jHdt2gMRYfv27RgbG0M+n0cqlcIXv/QlxFGU/Dv6jrFUOvn7essxg3NBWkc6QdYMffjDH/7AZz7zmf/8J3/yJ3/9C7/wC72c86FklNWMMbpZ/JRmQmo3VyC/YtPF64s65WzoXdsHofyILA2wUKI35YFrBaEJWlsgLsziWwooaSOKLMgehTz5KC+ew0sXnsbC9GUMp/N46qknkE7n8OorU3hzckaXq0G3l8U+BpHThutFaAt5DUGXnHRXdxRJnkoLiqVMhSGgIQAeQsf6jgGonTAQStYQiVGcgWDpGAIBertT2LN7D0bH7kKmsA3E+6G0ydEEs8CgQFJDk41IaW2xDTC9jGZ1iS5NXMPffPtc4+mXNmYW1uOvBnHvS8P97gMa0m3JKD2Szm53mcNZHGnOGMlEOqNkjK58r27Va1Qq+X4l0NcBrH4/NkEBAOsL09QsLyC1bQSBqFNj7RospWGJFkj5JnxUWoB24KAAWS6DqxYYd5J7qdFYaIqhyJh/SVuAjqC1DyYcQLjGQBn4CbbXUB4kJSA/xQA4KHT340iKoys7hyuTS5hcnkVro4VvfbWKuelZvOfJD6I4MIZGZR3V8ioYmpDMXES0MgQILtrhCEnOAmNGdKk5KGWjn3fDdVNwHYFSqYJ6vYkwjKEBCDAoLREEMTLpNFzXQam0iXotQjqVgc1udlcm7NPEY5kKYzL1lJaIYolvfeub6BvoA+fMFFHwTiZdEMikm0jBcx10FfIY7OvB2toGmq1mJ7m5Y0vS7Y+aQkzGQMFYgELKA6QNFQt46RyGhhxoXQG0DcVIn5mcRKMVw7UtgmyBOWnUo6a53hHAiUOpOBkfDOWCiCGKTLFaWFhAqVTqdE53bNNv6aC27q3a6Tm88+JqOwI0VKKBM//Mtu3bML57N7TWuHjxIsrlMj72Qx/D2PbtuHL1CmxLdMbBm6PjljY+0du1g3g5JyhFFMdSNxoN2LZ910/91E99/Dd/8zf/9Bvf+MZXP/jBD/6oUiqb7LI6hlvHdtBVzDM/0v5SdbPRnRnMnJtZtfO5EoZc0pps4nAQB0ZlGUOBVAxSIUA2oDm44HBSQLl+Ha+f/DYuXXwDcQp4+JFHMN6/DS9fmcSphU09e3aCOGtGLW7XOKc0U+QpxaEZaaUVoIzUMgyBXM7hQAwmtPIDiVApCMGg1JZBKtk1U+dbosFIg1iC2CZliLo6AmcS2ZRAf18f9u67Fzx3AFHcAxF75tglAoDVzLMfpUC6ri2+jChaofmVSf3cy5dqX3/6RjSxzC0UB/P50YhtXF/hXPUMkLRqvpyay6cKd1nchpY2NJQh3SbBNMKysLBaokg51VajfnVL8MT3XLrr+atng/rsmUgX+uH0bdNIF9BamKfYX0TKkkAsobWDWHXBCRTgV8BtQItNMwtrYXLtkgAHdASRkSaXYbnUwOxiCZlUFvvGthNXIaKwljwAN3c5BIkoyMCxU9g7nkcxnUM+NYvL84uoN6u4fr6OpYXreOz9P4r9B4/AtjkqGzfQCsn4nbUZ67SV0KWVhiBASsNMIWWBNEE4AlaRwbEJKdfC2mYVlUoDfhBCQYNpIyYNI99oUPq6Ua3UUa3XkVIeHMew6Xky4motAa2hjLELWivYrgsv7aFaraDZ9JNUm5vJ12Z3CPhNH1HaQ1cuh0zaxeRkE0Eo23MKtIYxRZAChwCLI3BLwY8lMiJEwWXQKkbIXFS0pxciHyshUcZ20AgYXVuYQirbD4tzrZSPmMXUCH0oo+KHBiGKNYhZUJolujWg1Qqwvr6BSqVyix7u9jf51kK1tZNq76rQZsBTm3mWWJOgEq5/jO7ubmzbNoIrVy9jbvZGJ6p+dnYaBw/ux8TEtbeJWzceTlIysTC1x1N0Uo8AkFJKl0olMTQ0dM/f//t/f+73fu/3vjM8PDxyzz33PBZFkZPgcXTBZB5G165eKz/99NOvnj179tQvfOoX3jk8suOhl99cc95zdAAp19ZcWyS0A6UIikVQTAIyB4EULJtBBjdw+fLLOPP61+E3azh08AgOHzuK60s1fObr5xGO3IvjP/8PUPp/fxnVK3/l+5FaE0iNCEZCQStiIK2k1sxAAcIwJCEEZFCNOGfpZiRFzDV0HBCLGcB1h86x9VqY8PE68XKCERzBYFsCEkClITE1V0aqexV3P/JukOqGLJcTnLeAViko1dDEN4D4Bm2uTuPM1fnml555o/nq+c2Kj0HKDQyMMgq6qrVNqaprFbmjP9JcRSKMRS5NNokIoYrASYIYIBWDbXHUfF9XG0QbLWft+vWlKYDC77VwBwChtY5TFp398IfPnnzve468u7pSsTOFfciP7UdrNY/SxiyYbIGYC6fQj6AVgHENzsxWQTJAwzeMculBK4IkH8xt6FBkcH6yiTMXpmmt3IQMY+09f1n/0IefoLG+LgSNEhwGkFQAcWi4sIhBRyHAMujdvhtHCnkU+qdw8do8lss30Fpr4Suf+13M3/84Hnn8vegZ3ofNjSXUa1UwiyDAwZQCxRHAgVhTJ5WYbALFpsNRpJHP5WHbHmw3BdetoFSqotlsIghjIw8QDLGMQYpQKBTgeYaIGYQtuK4LyzJ6IrblxUDJzsuyBFIpDwvzS1BKgwt2C7er/UDHMoYfBvA8D3EUY31jvTMe3dLa68RMZ1ReECqGIyxYdhoSi4hZF06freM7p9cxv9aILS+WFiFs6GLUV8gJIbIZ6IhCHwiaUcLHYoijCFJKWBa/ReDZajU7I+B3A/fd/muLbKCD/dk6wkVRBMexMTQ8iFwu10nC+da3vtXZmSmlEUUhrl+/jn379mFoaAhzc/MJalndFkSiOw/qzeDQdrQcS4S5EkSkVlZWvJGRkSc++tGPLvz2b//253/rt37L3rZt2ztt2xa5XE5PTk7qZ555Zu3kyZNfq9VqX1hbWzv9B7/7H87+o3/6T1PMY/edvrzM7j+yC65JcACRByktMK5h2WkgrmNu4js4e+ZvsLK8gJ07R3H8+JNoRA7+5NsXsWiN4ODHfxWjB4+CQ2GzvI4c0oTKuuulWKohw0oQx1wIysfty5/WOtTaBdc9CoDl2H1RGDhKGfMb8TsRPbHlQkgdvV87vSYOCS3fxkZQw7naNJ45s4D3rfj46I/9LFQ2jahZgy1jsDjSQA1hdB5nZ64EX39hovHc8/OVUq0bqeKhHicVOQqblorcso6jTZVKCcH5kJSxbdkY91JuT9vWQ51wX/PSqtV9akpXTs6Vrk6sVadv6Zi/29L9N37j04h27l5/+Wvf8I/s7zu4a9juC6qLpBXg9o2RVdgGyfNwe8fgjO5F0PIR+VXYTIF0CMYUVLLnIqVAiDQcjhbTeO3qGp5+eb40tVSbyPbuINiF9EY9xkuvnkE2naZdO3YhbrVA2gQSJBjoJHSBQ2lCKp1GTz6LgmdBhXXUK2vQMsLcjXlMTM6ib2Ab+oe2QXBCFCXgd62TTGfckohj0mLankG9JdrbgW2ZhTxLdmoq2Wu1FfZRGEBYNrLZDMIwgN9qmQcisSF1rqBagXEgn0+jWChicXEFfss34x3RrQ+Z1iY4Ie3h0KH9UDrCtWvTKJWqnV1M+4HXbduQBjRFYBJgoY9jd42g26rBETn8zd+cwje+cUqtrW7UF+durM8uLE6efXPmys7+rPzw4+/oFdxiy76mV65MoRkEyXK9nWyCW0zLzWYzCfKgO6KS2wVq6wXwrQgY6ujM2oDG4eFhHD16rDNW9/f34/DhwxgcHMTa2hpazVZHl1ar1TA6ug3d3d2YmJgA5wJBECQ0B0ZSKt2+bNKWL/AmqNHEst1cqBN8308dOHCgZ2Vl5dy3v/3tc48++ui4ZVk9X/7yl/HFL36xdO3atRnO+aJt2wtSypm1jY2pSq3MDh85sb9UbXVxhBjuK0KHIIINYafBOcfG2im89uIf4I3XvoGU5+DRxx/E6J678I1zy/jadY3i/T+Oh374kyj2j0JHNVQufxuXnv3vlEYQXbmxOe0IbqWy+Z5K4HAmLFcr2ZZcnF9bXv5OT3f3TqhW10CXuzuOwh31RgiAESN9x8j59jXBEqajsTnBEgTONbgGZAhUI8JcKcDcShVvnDkDCwpH7n0YLKxrhnnI+CLNL13AV58+p//zX57b/PaZ1WXyegtevqsbgmW0BmewiLS+0ag3P6dgyVwu+6MybKXhl/N3jfeO5jIi+bib54MBcCxbW5ageouapy4ufHO5op+Joqj5/eywOABQuSQrDbm6MHGj8AOPbrs77yylwqCMoNkkK12E2z0AkclDcg4n5yH2W4gaPixokA4ApE2MD29COwqbEcMzJ2f186/NlU+dm/qrL331m7+bzhX9kdHt+1KpjCtsD6dOnsfqWpX2HTgIx7UQRE1AGNWtWV1bAGxQLMDJQ6HQg54uFxYkatUNNBsVhC0fly9eAOcaY3vGkU5lEcWG2sA6ItMtPj5GHUSKwb7wzv7DdR24jg3LFuAJq0trZYofYyAYj2Icx8hmsxBCoNFoQkqdFCwOxgyEz7IYisU8Uuk0FhZWINu6L423jOlKSnR15bBv3x74QQszM/Oo1Zu3Xlp1siBXDAbkFcImC3EgoXmMdKoIpAvYdmAMDz12Au9/8hH64Psfsj74xGPuD3748ez733N/by6bypYCSScn5+jK0oqxIGmNOIrBuLgFKd0OjNg69m0tWG83Br6129K3aKuEEPjABz6AyckJvPzKy9jc3MTU1BRWV1exa9cuHD58GMvLy/Bbfic1p1KpYGVlBeVyFZxZGB0ZRRRFqlQqRcViAbGMWJIvSbeHU5hLsGp/DdTOTGSMdR0/ftx9+umnn1tcXNw8ffr0XefPn09HURT19/fr97///fsffPDBw2fOnFnv7u6+eOnCpRskUvn9hw4dKG2uu4VMFrlsBozF1GzM4dypP8Urz34BrVoND7zjUdz1wLtwaWEDnzu1Bjn2JB75sX+E0b0H4FCEaOEiFr/xR1j5zp9DxKtUj8LymZnSq11pr7cr1X+wFDIHxCl5eRARTdfL5VfzXV29MmpmBoruWBgEO5q+TJwp6o4CtfYO0bY5LMHgWhyuzc2LmUkoilANgeVqjFg50DHH2dNn0ZcmjO/OYGX1HE5dPB3/1y+9XPvCt260NoIeN1scznLbLmgWOYRYC02aa06RknP1SuXLzLJ7UynvQypuTluy1jg03jOedhlXKtlrG1ADHMcmpRTCyJfVJqZPXlx6Q2u98elPf/r7K1hag36D0HSdbv4TH7n/HWmr2i/DdThUJdVYR6u2gKAxB780A0YNeH390JSF3wxBpMAQg7hGbJOe2Wzg6Zcn8OLrq2uvnZl+/vrk9OcrXd1PX331tdW0523v7e/elkp5IpvvxdT8Ek69eZH6BkcwONiP2G/ctK0kZ2xizIgZiZDKZNFTzCLjAaQaqFXWEPk1TEzOYmlpFSPbx9DdP2g4UXEIpVXHgNxmVN30JiLRUhGYMPYFxxaGaCoM5YGBoGRCf0jaamiNMIxgWQ6y2Tx83zfdFkuWwkzDcQR6egsAGBbml5NRsC2IVLeIUJWMMTo6gr17dmFxaR5z80swePStseKJ0BLccNlZDEgGYWexXK7h/LTG2ZkmJtZ8rNY4bVS4tVlhbqUh842g1Tu3vJ45c2kWr168gYmlDQqUAoMJfVAaEJx32vE2acEs3996Kt/iyfsuotCb3VVbvtAOUS0Wixgf343N0iaSZTharRYuXLiA0dFRjI3txJXLl0HJ71GplFEqlzE0OIJDhw7jrrvuohs3ZoKvfu0rc8eP36OKxa50abMMbnjTnXxEKc3hQ4MgEs9iEjaqoyjijUYjVa1WX7t+/focgAez2Wzx4Ycetp966qni6MhIIZvN9m3btq3wzDPPzP/YO95x5S+e/try8Mhw784942MTEzN2Jm2jWZvCt776H2h54TwOHjiMhx97N9a1xBdeuYZFOoL7Pv4PceC+d4I7NuLNVay88ueY++bvgk+/gRRFEC6n1fWoemG69MZgMTPieF07SwEjMIBzrh3HYY7j2LFS64whioOGGOxJH/GbzSE/VGCMEafbBR/ouCoYkZEwCAbHZqZgcTPGKEYo1SOsbbaglQUtCVoqTF55HdXWJp5//ar+0y9erp2bZA27e9C2M3aWMfIUWaS1AwInTrFmXFOs1OLaRumbruXu8tLeO4Jm5UIxpXMHxrv3ChZz0txIjpLnzkuloKWvu3MkPvyBdxcatWD+Iz/+CxeIEjbV9xNCoTWwWS9Xm/H2JqWKoI2T0MEl2M4yhMhBRy6IPDTX0ghb+5HpPgqezqO5cglZOYFIRzh7bRMvvjmHs9c26mffXHy5Um19MdflnV26Ohvu3r377DMvPP+ZZtiwjx25+9FCIWt1jY6iXinj9/70q/iBR+7Be+49iDjahNQ+eDtIAYAUMOEIsQMvXcD+fbvRXUgjd3UGU/MbWA0tXHnzFObm5vHEB38Qdx0+AuEKlNZXESVpLYBEFMUGQ5NYFsxMLyGIoJgxxNo2R75gwi9MHH0VlUodrcBHGMWGUppIAeJYoquriDDwUdosQQiBTNYz4bCWhXq1jjiWsITdxlp1wkwT1gagTTpvZISOCMMIruciCuPk3J9kJ7aD2pg5U2tikGQj5hnESqNSakJtSAJ8QFZBKtKKM8SQEKTAYIPIIs4tcCYRSbO7cp02aO8m9jgIgtsCPd6a5PN2ReqWs91tY4oQHM8//zweeOABPPnkk7h69WrHe5hOpxHHMeZX5wyyRynEsUR3dzd2796NgYEREATePH9Oz8zMWOO7d+VrtYoQgmnGGMnEdtUuVlIqMOIQlp0o9JEAE0MopbC8tGwtLS2lenp6whMnjouHHnoYg0ODaDaaxDjX1VKpEcdx/iMf+chTf/bnf7767K8/e/7RTz/62e7u/2//sbsOvevyzAwfcGdBoq4/9NTHEGmBv3r+LC2oPux73y9h8PBDiAAEQRWNiy9g8ZXPQy5fRIYpSMaxGir4gYSuc+Y0Kc+Y9Bo6lAo2MU3ELU6MMyip+ru7uz/k+82TkKzGiHrReQkQlI5N133nJVaHnrBVs6bBEcSEaqUKxMpA+5j5SJZ8hm++tIK5tQAh60vlBzIpkGWZAAWpQYrAtLH/aIdApJVqrfq+X8mlCxYjhjhsDaW7nIO2xQSgjTJKJSsQGAN2JEPs2daLnf1s+KFj2/f90VfOuETwv9ceS2yVeVZbEcn8fhZZi7Byk5pVfFLNEpgdQ7E0wNfgIITypxFXF2H13ofcyA4sXj2JyxMLeP0q4bULFX15anE+jKIL2bw3Xa9fXQagJyYmQgDPX7s+XWQQQ2M7hg9u276N8sU+nXJT9OXvnMX5yWX8zEceRiHlIGqUjPFZa3BYBvPDNJRMg3Qa/QNFpLwCevKXcGl2FbNrm2jIFj7/3z6Lhfl34vHHPojh/m3YWF9Gq9VAiBAMgJQaIQwvixFBJyZlS7QRwMaCYvEULMsk5nqOhc1yGfV6C0GUSDcERywNeM+2bPT396FSLaFSKSOOPTC4qJQ3k2Qbia3UGjNpJsnFgqHQ3YX1UhnLa2UofSulNAhDUBhCaoPlIB2ar5NrAK0E+JfkHgrLkE81ANikwWAlewOdBLNqbRKXiRh6ewZBRKhWqwDCDh6mbbW5PTlna6d1C4EBqqMZaqfZUDv+67ZXpiUYXnrxeVy7fgUHDx7Efffdh1qtBiklrl+/jrm5OcSRRD5fwI4dOzE8PALXSWF+4QZee+0lVCpl7Ny1k7/joQf61tfX9OLSKnQialZKJn8lcGHSewwRg23NNGRxrJDr6k7t3r3r8LUrF858+APv3SDL3VFttqDiWF88c4ZNTU3Vv/rVr37rqaeeCp566qn3PfrpRxsHDhx447O/9/t/9M8//a+KK9ev3Z2Rl/hGiXTLm0CDuqn/3k/gwYc/BFgOQh1CX34Vc6/8FWpzp5Fnm+AWQ6XJ0IwUqi2fuJQo5inb4+lHNFKZVkTLTNtd0EhJUxy07bpW3u66S0bBBpG8qgEnio18R6mblpwOL+6WI02C/dams6HOy8RGs6FRr0sozaC5+RkqJQHPQ+x6EIUUCS0caGnuHCZLk8TW2DmzlYqVVHNBubwmBraDAF/HwUrWtX1OFknpa0ERiCwT/suBMG6hK03YNVBEq+brN85PEQCC/j53WGbyYoiiqOfjP/KRx8b27d9R3agRd4g404j9ChjVQYiBoAouq4AsQcsNzN+4pqcWW2jJIXz+K69hemGDiCOQQa3eqFbWqFacqQSVVvK9jKvl6ornpbiU/sFGo5HLZnPa81LIFHK0tLqO06+fQl9vHwaHtyEMApPgAkriqRSYZUNLCaUBN5NFV3cfssKChRrqzSVEocTsjU1MTE1jcHQY/SPbASjEKkFgkARP3hC3eNfaDyVjRo2fmKRt25BIhWV1+FVK6fblCYxzxFEIkEY6nQagMT6+GwSG+YWFW8aj2xXhWpug1927d2F5ZRkrK6vgJG7pTgTnHbGqSSuRyQdGmUKozZ9Fo30NNbs3qUwMk1bmgCBljDgKEUvTFe7ffwBjY2NoNptotVqdr63ZbN5SsO40Dr5Vc0W37ru2uAG22m3a/9myLNQbdUxPT2FmZhqrq6uYnp7GysoKMuk8du/eg/37D6C3txel0iZeeOF5vPHGKfT0dePYsWNkWRamp6dRrpSBJClHSklSqo41x3XdhCBrJdaireJVo3jpLXYNlDbX59988+zsnn17dywvr+ZeffkV3VUo4LHHHnOGh4dXP/vZz778+OOP7+7u7d3/yssvT/JW6/zJc1fSfnnp+FCP5bx8+mptXRToo7/8O1bv3Q9Bcwa2fhbz3/4zzH3nv0BtXIInJIJAo9RUqAcMpXoDiKo4sGtAv+uBQ1bGld0Ly2VPaqHCiLmMQRhVugMZBtSqV4NWvfR6ytJUyDpHa/W6G5l0PWIw0Mt2wWrn/REITBAcm0NwjZQt4DqWiZWDwMp6HeVaC2Cio9nSMkaukANzMtQINEExcBjqgCZNHV0dmZ0u5wQwKN/3T80tL39ncGjoEBfY3izNLe7b3rt7qC/TDxUCzNDczRGAwNDEwV19GBzqo6tT5caffv3cN6dXWi8lIxV9fwXLfKjYex8ZPHZo94m77MwxVg03SVs+PC8NFTZBKgBXMZiKoNkGmKjiuW+/gMK2D+D5Uwv6+dfOEHc4OML0nh3bh3aP7RqYXr2xUqvVpgHEiW+rubq6ulIopHts29m9trbmCttCrlCAl8lSzGy8+NpZNP0Ie/fsNV1RFII7KTQijuXVNeR78pBQ0JJgiQy6Cl0o5gCHVxG1GohCjUq9jEtXryKOCXv270cqk0EQ+FDKXDYZc94SVcXaLXM7douZUAbLtmBbArZtGeAZdGLrUQYbyzm0UojjEJlMBkppLCzMvyW1eet41C46XHDYto2NjQ2T35aAuW4vFFJKhJFEHMWIDV3S7NekglTa/FUqM+5KDSWN705KdMJKXc/D6Og2HDxwECOjo7AsgUaj0cHBBEGARqNxSzG6k0i0LXW4+c/hLV7ANr3yTuNkOwTVth0oaXDLlm1j185d2LfvIPr6BtBsNvDGG6/j5MlXICyGo0ePoNjVjbm5eSwtLpFWmoiIpNQUx5La4a0mhs3pML22XjG3WomUVABUZtv2bZmXXnr5AmdUG+jvG9u5c5dz111362q1avX09Azbtr32hb/4i3M/9tM/fg8DG7w8OTXVMzyUHy6m3rm9z3OuTs41Dz/2pPPQB35SLJfLWD/1RSx87TPQky8jw2sAYlTrEZqBQL0Zo1wtozsr8Pj94zg41gWX+xgaHqKKL/j0Ut2LyeLQTEMLCvyYWvV6Tcatv15bnP/Lof7sYceie6r1Bos1T27Iby1Y1C5YHHBsDkcQXMforxhn8EOF5Y0a/ChOrMgEBg2lJYrFbkCk0PAJjKybGjp6q6E92WXqKIjeqNaq57u7e9/JtBwLGmu9+8Z6D/YVHUfpCIwYMcYBJWE7wLY+D/t3dGsNQS+9Mb/23Onlv1osBWc74U7fT8FKfpDihx879MCuAXE8ZjbPdO+nRsuHYhxc9EKFFYCUoVNyCWLQN2Y1vXotqH3p2y/UhGu5I9sH6Ojdd7GebE+6VK4NK4GibdmB7/u1OI6bZuv8sUqlcmohl0nlvVRqrFwuuX4YI1vogpUqkJvuwpWrk5iYmMLYrj3Id3VjZqmGv/zOJUwur2FpfQOjI8NwLYGo6YMsIJXrRk+hiIwTQforCColRD5w9fo0lheXMLZzL3oHRk2nEcbYEgR9U8ip2y5a2hJO0ZYqkHlrW5bxKjJAKtnpeNr/rJQSzWYTRAKcvxVetzXYoX0MqNcbCQ0hQSvfVuAMiFAiCGOEQbRlVENHY/bWX+iYXxljcBwPvb292L59B3p7e+G6LogMcz2OYzSbzU4wxJ3sHbfvrczSPWFY3RRp3qbHusP3WKmE783g+2axPzw8jD179mJgYABRFOPSpUt45ZWX0Wo2ceyeIxgeHsLy8goWF5cQBGEnKiyOTVEWQiQJPm4SkCFu6apu667aH3dIKUlr9OzeOeZ95a+/fPqug/tVvlAcrjeawvM8bVmWt2/fvr6Jyckrk9PTKz/54z/xPgvxzsWV1ZHBgnd4oEt4E9fn8I4j4+5oj01n//oPKD7zZRRbS2DCQa3FUa0RglCgUq7CZQGOHxzEoyd2YahgI2iWaWmtTFfmW5jcsHB9WSImDyDBlEKoVXwpCvzPb2xu/L5fqS3u3JZ/kjF1sNbwKZaCAAVChCTJ8pZiRYxgcQbHIjg2wbU4hODgXKBUC7CyUYcmo5Q3bDOD7O4u9ugYHloRgbEk9s0YgG/xf245upDS6katXF4sFAoPaRkL7a/ru/YM7s6nGdc6BjFGDBycJDxbYc/2bj3cl8XkUgPPn1178+uvLHyuFcs54NP42xYs731Hjr7rxOHciWZwjuvIQ7brEMnYh5YhLFhQugKtBLTm0NzC6pqgV65u+AHx+O67D3s93T18aXEZy0vriKUSwhajnufdUygUCkKIiWq1uglcQhRFq61aZT6XzQ6kUt72Rr1ul8sVZLN5uE6K8oUiltfLeOPCBODk8fUXzuHp09cxftc96B/ahldefQ2FTBbdPd0IdQwlXTh2HsViCoW0hBMHaNUqUCrE6uICLl26hkyugLHd47CEhShJo709URlbNCy6Yyeh5E2DBPBvw7KM/IGYWcB3lugg8EQmQKQTHyW9TeS7+XtRGCVeQ/6Wh0trowYPoxhRKDtp1TdTer7bL5YUFQ7XdVEsFjEwYASbplMEfN/H8vIybty40aGz3mkU3EpduLX70gmIj71VCU+4I7s9jmJEsUJvXx/27duPoaHhxGA9g1dffQXr66vYv38f9u7bi431dczeuIFGvQnGrIQw0UZRc9i2yXs0Ql6rQ3i43VS99fvKDSmDYLyd3LJYcWigr/qlv/jcmQcefFeXsJ2BTCaNfD6PfD7fNTgwyP7j73/2uWwm02dz/pFKq3mwy2P5/gKz5qbnrcMjNvPnTsIrXaEeFiCIOFYCgZov0Ky1IKMG9mwv4tEHDmDv9jxI+ljZCDCxFOLMdIhzswrXlzQqgUUAkxapdRlUX5+bvv65a3PLT6tas5ZO4b5d23MfklE42GjFiBQnBg1Klu63p0wREYTFYItE3W4zQ/wAw2aliUozTlwZaH8/AABdXd2ItIN6S4Ezq8N2J2ZyDm75RQyMMcYENUulytVsNjMaRvVVKyo1D+8d2Z92lKW0JBA3fkYVIZsm7NvRB8fy6OXL661n31j+1umrm18m+o369xoHbytYgNaw9o3mT7zr4aP3crZphbVrEFFITDaggwYEiiCagQ4jkBZgdkCbNV9PrqbskW2HUxbP8CvXpnWsIhMJREAmkxW9vb2ktb5w5cqVl+M4rrbv+60g3lCtcCmdcXvTKW9HFMdic2UFnm1ROpeHl+lBS9n4zsmLuLFWRVdfDzRsjGwfx8i2nTh95gxK1TJ2Dw2Bk4SMJTjPIpfvR2/RhmvVETU34QctNAKFNy9cRqPZwt79+1Hs6kLg+0kq9C1v35shpMkPUpNJ7TH0UwYuBBzbgeXYsBMks5IGEKhUQj8lnuBa1G1v9zvxnFjSRSnIJOa7XTiUUgjDEH4QJB2FvqPJ9e3zuqkd7ICenh709vbC81JQSuLGjRs4c+YMpqambskOvP26t5XAcOtIsNWCc3tXmhA0/v/M/WeUZdl1nYnOtfc+5vrwPjIz0vvMyjKoQjnYKgAFS4IiKJJSS02RT0N6/aPfaHWrW+OxKb3+0Wy98TS6ZUmRFD0FAiAo2DIolPcmK72JyIgM7+P6e8zee70f59wbkVlZAEhRYscYgSxURGWYe846a6815zdvOSpaaB2jWCrh8OGj2DW+C0IIzM/P46233sbMzE3s3bcbJ04cRRi2MDM9g2q1BilUEuWWzg6FEHAct9NVtY9/bV777fqxW4spbdt2SIEEIQ5Dp7eQHekqZBqvvXlu+qOf+MRwGEbFfD7PV69eEe+8++7W3NrSN+dvLK4LyY+ywHB3VlJPLqaFxRU6dmgI3fkIsQloNchgQ2dRb5YRNtcw3Ofh0QcO4PSRQWR9i82NDdxcbuLNGxFeuxbwucUsZtZdVKoGnkCTbHxlbenGyy5tVI/v75o4OOR9eLRbfXp8tOvx7p7cgVqt5tYDC00uSVhIaDDJNNydO8WKiBI5gyPgOgzPTbrOKDbYqLTQiFLhEHPHPeA4Dvd291MjRLhVi+dd5ZLryEwy1xWUEGHf524gKYWNwqCsHDkUNOuy4Ea7juzr3+MpQ0yWQKkn1oToKTk4fnCcl1eq9ML5tQvfeHbyN/Y3zPlF/Pjj4E5ZQ/s+aE1tbUw2tSiXZCHH2GIZvoGpayuYnNP41Kc+B1vNgSgAcwQYQsEJ4LseLW2utwrFweZ9957OL8xPeRAexzGjUt7C5OTkxQsXLnwjCILZ27xC4fz6+ivqpltSnrsrX8yfIQtcvXqFa/UGuZkcbs7OIZPNYWLvATiSELdiPPuDl3H86D6cePgLuHL+LXz96dfwiQ8fR1dXFlG1CSEy8HuO4nC+G4XSJVyZXMPU/DSqcQ9ee/G7mJ67gc997mcwsWcvymuLqJTLCCKGZoKAgWxvQRgQUMm8SgCWkQRBwkK4ElJkkXEllCPheAKVMtBqRQlYMKUzgMT7ot1vlwy0Z0DWJqZoY0waAaY6a/r2HOr9acw/Mkg+IcFSwv3yfReAwfz8LC5dvJRy14MkP1Gk1gjiW2ZSt6rWP0hjte0XTApDCm1kSjHeBGMsHOVi1+5R9PcPQAiFxaUFTF6fxOrqCsbGR3HXmRNoNpq4emUSYRSmlAGFKIo7CGyltotTu6O6U6z9rb/fnQXMwoLBLOE6RMwOs5dBELVKuw+c+PCVme9//9lnvvf2ww8/2vWdb38nc+XaNbu2tjK3sdacn+hz89aYQAiCIoMwjAlOMv/ZqktUgyJqoUDYWEdvIcLdxydwaPcQXGlQrWxhucqYXIxweVFjat3n9QqwVdVkGSbr2ZXK+tJ7zc2l9TPHukdPH959rMuN+hxRkP09YyhHCq+dvw4dJ3MLSbpDp2XYRO7SfvC2U7vbVi6SkCAYA8QxIcn0TY6CjGQxQ2yhSEA4WURxc6HRqv5Ztli430rxILFJO3W14yElOqcIrXW3Uv4jxNCw0YvFol/wXAnLcQIetwyWCoYc5HyfSTh0Zb4WXZgqvzG7Er01RxTjJ/AR3imqXs+ublUrtUZcKgGwDgh1FIsOzl08iwcfeRB52QPGBiA0oDPIOg6ECKjWqiz8wZ987dt/6+f/xpFSPvuxm3MbvFGuB9mMyg0MDPSWSqXd9Xr9SurKDnbcefHM3OJLfsH/0yEMDT1w7z0jjlR44403MTY2hs995hNYW11DK4hACUsBloGLF69ifWMTH/rQvTDNMXztuVdw75FRnDo4Bhs0oUMFxxnB3oM55LJT6C1O4+LMGpabLaxeD/CHv1XGwx/5CB559BFkcgUsLS+BZQjWAnE6VCcLWErWw5aTWC0wp6r1ZE4kfAc9sgDPc5DP+NjaqqFWbSG0cfrISD7XttX3+GBqZudF0AaNRjPBJqc3e7sTvDUy/scXLJFiWdhqrK4u4+bNaczNzqFeS4brruN2Zh5CtCmx70e47OxYbp/FYYfhOAmzTf/79NTKAGIdIZvNIZfLY3NzC7Ozc5ibm8XAYD8eevgBAIzp6Sk0GxEACUEqhTQmiwuVLifahWpncMX76aT0gV1oG3ktE0g8mJnAPhsLbsRm4O677zrx51//k2dg7cDM3PK9W5tbbIytI6q1lCjkIKRPYHiKyMYMkgKBIYR1oFarQ6GFuw8O4tTRCfRkBRrVCtarEWZWQlxaMphaBy9UXKxVgSgIbc6hTR1WbqzOzi8P9jv+E/ftfWBXv7fLFxW3p+Bxsbsfy+tlLCyWYcIQ1oq0a4/SFCXZySAA36YNoHQkAAGZZlsaoxN4ZppUYDqyZgtBQGwFt+L4+vrWyg/7h0fGWAg4Au2Ellt+3+3u32jjGMaIIjFZr24u9OzqP+I4QhhDkJxMZTUzNICe7m5slJt0/mZ18eyF1VcAbKbDVv6LdFjJCwfi6RtLcRTHERQAkazEBwa6YEyIqel5nD6chWkwpJMEBGSzPiQiZH2PgyB66Rt//p3zd508etSyNzrQP6SMblK5XNm3f//+Xx4dHb2vWq5Oz60u/6BRLl8BEKV339bSwsafSqn2bG5t/sJnHn8sPzQ8wM888wxduXIBDz70EJaWVjA3twDXcRMIjABWltbw5Pd/gFNnTuHogz+F119/GjeXzuOxDx2G7zahAwHr9mFonJDr9pDrmsP1a+tY2VjCVkXjh99awczkDTzxxS9j1+4JLC9PI2zGEEzpQD0RUSasrOSFMrdZVGKtkZEKQiTHRNfx4agKGvUW6o0motTI/KOK1QcVrzbRE+CErKDa8gt6v0DwA94SMF+MrXIZK2uriNKhdU9PTyqN4G1WOm0z87c9eu007B3gEtp+kidDXnnLcfJ9ZIX0oR+GIebn5zE3N4dcroAHH3wQjutgZXkRW+WtZFEAAWs02kJQKWVHntDWprUH6rejmD/IU3cnbHP7qL49gocNWi1RKvXuHt+zD88+9/zbIyPjJ4jgGTYRACt8IQgQsQGU68NEFXiuj62IIcI1HBzL48zhwxjuLSEOW1hYizC7HmByIcDVBc3LFR+bVYlGZEmqWOeUntuYn36zpBr47IfGDk6MlfbnVDWf88G9vbu42opxdnKN1htxwoOHSFKUkcxdJeF9wl6+5ViYFrDUvsNtu5JNQZvcmXcxW8BxHLKMKA7M9dpWc45j03Lz0hAgCYJB2/anOE4Sy40xsMbGDLsoSVQkm12e7+yXgkRsLMdSABYQwsBhzcqRuHZzI754o/zGudnaq0Q/GaXhTqk5JIjQCGzuSx858cDErtweY2pA1CDpOXj3vSkorwcHD49A15cgSCcR8yRxYc7SZitTXlmufWdjc3Py3jOn7z9y7PjEjakpp9GoUCbjq4yfGXEd50w+V7inmM2NNVvNpSAIFtpelTAMK9J1tKforksXzw8fPHiQP/zhB3D2vXfo3XffweHDBzE2NorNzYR2qZQDkISODW7OLiI2hNN3P4CtWgNnz57FQH8vSqUCECdPaT+TR293N7ryCsQV1OtrAAxW1ys4d/4aurt6sO/gIThCIQzCji2mfePcLppMmEtpIhAlcy0hRCdVOknfSdJltInTGS99IGTtg9b/24N8CalUajP5yd6lFBAqUZiTAJSS8DMJolkpCeUoOE4ypJYq3fjJRDiddCJIXP7toAiBHbRQai+Pbpmb3FKssN2tCSE6EWy5XA67do2jXq9jZmYGzWYApVxobRBHcfr6JqJd13XheV5HqtAuWnfa/tEdQnhvV+HfaQi//XFGHGs3n82Fyyur2vP9A2ytiMLolbW1tedGhor7vGzxschyYaLPhWytUaO+hVMH8njkzB7cf2IEBVejVg+wsNrA+ekIZ2c0vzcP3ChnsFIh0lZoT/Jya3Pxcmt9ZvXMgVLPpz68665dPXZvlx94g0MDnMl0YW5xi+YWyhQZBaEchBGjWtfYKAcIDEBSJKcNkxwHkfpjtwOHBTxXwpVAxqWEJwaBRmhQrYfQlpPTAzMJQt3EUaWrVMqQ11tdXit/fX1r69Xunu793aXSfUTkp+MNandVOwTGpI1phnGwISUv1svLzZMHBk8O9fj52ESAkEQCEBwj6znsSKJrC63V776y8geL643niaDxF3hT77txmDemZxdXHj6dtybWQkEBZFAs+ljbqCaR56myGGSgHIGsT8j5jswWsl5ztrlWrVVuXLt+6f6u7qy669SHcPnyVdKxURnfRRzrQc93ngh1OFsuly8B2Egf3XZ5fvndfeNjz/muf+CrX/1a7vRdp/jnfu5v0iuvvIxvfOPrePDBh3Hy5AlMXr+BarWeJEYTwTUaU1euYn11FQ/cfwYDQ6P4+ovP456D3bj/6DhMlIcOGFJmMbInA78ri0zXdVyZ3ICpNhFtNvGN31/B/ORH8InPfgaj42NYWVpCo9ns3CTtFyjplERHG+U4DsgkCmuhEgpoqZBNBp6+C+VK1GoySeUxbe59e+5DH5S6fed51B3Y3XeSIewA5EKSuKWb2KbB8q3Hug5PSXQKzfs6pR3N3S14ZL6D+n1n0WqHrOoYWicPgKmpqbToJ3O6VisAINIC6txSnHYWqQ8u6h/87+/Ufd2hMyNmZtZWeX5+n5/NKmZLYETEtA4glHABSxBk4SuNk4d78dgju3HfsX7kXEKj2cRqxWBq2eDaYojZVYcXNiXWmpYaRuuca2tBdXm6vLY4s7fPz97/2OGjo9004qGu+rpzXCgWeHbLYml5nXTMUE4Rgg0QNCEMoBkJf04QGIkWT0oJQ0kcXRLyILbDhgkQbUW6FLAkYG1yFGxrDdtdNgmw63mIDaq1RrAIoNyo1a4bbTaVlEXDlo2JqX0f7NyqW0aLmASzXheEhVzWM2QT1jynPghrY5bk00ZdmMmF1pvvTW2+SETBX6S7el/BSv+rSq0eT1mgtbm+me/LOyzzLpWKHm4sbqXdhANwElygBMF3AeKwy3fFfgDPk+Kpru7i1tTUDfT0PNj9wAN3u+++c9ZGkYXRLltr8qVS6W44GCdNG9wWDAFrczdnv5PxD92Xy5YeeO/d81hbWePPff6zND6+G9/5zncxN7eARx55FI16E9PT04nvTDpQJFCp1PDMMy/g1KkjOPPIl3Dp7A8xv3wWjz14P4quhQlbIOTR3XUQp050o5SbxPUbc7i5PIOGqeONl7+H6YUZPPGln8auPRNYX1nB5tZmwsQShCiM01kUd6LimS1UqgsSSiVgfwEomYV0HSjPRSaTScimtSa0th2W+l/8je/wz/wjP/+DxwN8m/ev/U92p43lg/9mbks2ko3o7dqxhGi68+/drnY2lYokQ2Cdfh0J13HhuMm8ynHcTpH6oGL1QYXpgwrbLV0WtvMmSVC6YRQQpFBtNCU4zZUWCJh5FYAhdopEypEIkZEBPvXwIRQKQNAsY2HVYGZF4+qixfU18ELZxVY1plbLsnDdTZ9bFzbnJtf63Gbp4w+NHNk/kh9zZDNfygn09AxwMwLOT61TvUWAUCDFiDlOg2qTB0xskkCYRLCcmNbJcuLOSB0YRDY9tbfRPomMg5hgGYhTH21byMcAC6KcECorpZJ1bRZrTT0PwKyurl7bNb5rMuP7u6I4otho2MRNwJ2RAIitsQUpQVpH2vewnM16LbCGYw00KUBIKCEBKCq33PK7l1dfjON4iugvfgeIW+8ABoDW3NzKBqlC3NMzgMXlFYS1Brp7elCp1oCYQFImuGNOGOM5j9nqIFPIFfrSUV/rl/72z5p7jo/jnTee4831NZw4eZJyeZ8gYuQKWeruLh2aGJv4ODMP7xy5zC6uvrmwuPSnrWY4n80WaXVtE7/zO7/LQSvE3/ulX4E1wNe+9nUwLE6dPg4hgZAthOfBcRTYWrz91rt4/Y2z2H/6E5BDd+GrT7+E60vzkLkMrBZAmEXGGcSRQydx36n9OH24C93ZTShewuLMJfyH3/jXeOHZp9HT34fR0VFkM1k40oHnOYnaXUjIzlpXdaLnpSMglUiPWhIZ30GhkENfbzeGhwbQ39eDfC4DJW+f9+C2OLH/cm8dmGEnum2nbitlkWFb69QG4r3fBL3dpSRbTHNLcKoQbfpR+ok2IcCalH4Rx6YTOOE4LnLZDDKZDDzPv0Wt3i5Wtx/lPpABdYdlwe3WIhIESAEpHbjSQ0b58FyF3t4iXC+DjZUVMIdkkYZGaTYAsqzUASOQV8Rc9Bm+bGFzdRlXFhp4+UoFP7wU8mvTxBcWGHOboJZVkZORk9X1uRdqC2dn7z+QHfzyJ4+eObord7joNwp7RrvR09OD2cU1uji1SDXtQEkFwRqAhkUMwxZMCjGL5Hdm4qQ7lwnuyKRMNfCtHCwi7hwNRfqaWk7CV2wauJqUm0QTymxJCMVxZCpB0CwTAc1mc75WKV+NolhHsWkHI3Mb0cREISAa1nAIIayJo3ox5+U9R2XYtnNJ00GbZRbC49nl4PqbFxZfBbiZRibyX+T6lXcQMopS3jnzxCcffLRU4CxJjbWNCj3/8kWsrAs8/vEHoeNFsKkAWkI6hKWVGqZWM6Yal16/du3KK6W8d+qnP/Whj3/y/oneC+ffa7z+5tSkgU979o5khQNqBiF818kODPTv9dxs99LyUhnAZoqXiOqN5pLre04m6+9TjsqTAF24cAFhENLnPvcEGBZPPvl9SClw8uQJmDBCo1qB5znp7EWivFXD3MI8RvfsxcjEYbz05jk0mgEmdo9CcAirE2RyobsX3d1ZZJwIMtpAq1mDiSNcv3IFCwur2H/wCAYHBxEEDVgbdzyNNn1B0l3FLUei7XkPQ5CBqySUEPBcBzINqjC2bQ/ZYYrm7c7ndvFoWxCYTqZBbTP+jlDRW0pPW5pB7SHzjg7H8nYqd6rwN9ZCG5sYsy3SyDTZmb0JEh9YT+l96v20wJFIUlbsdrhnUty2j8aZTCbxa3ouXLcdW/9+4ecHz53wvnzD2zVkYkfqUdv/CUlwhQuXBUr5Anr7u7C6sUKvvfIm3GjVOl6s6sbvFhqRabaeWSlvTA2PjnwKOe9uN2iJ4+MK3d2SLs008eYNwsUF4utrDhbLoNgYZJyoHNXLV9bmr1w/MhSXHv/Q0IeOT/iHSm6QG+gvore/H2ubIa7f3KJG6EA4mZThlXRYbC3IAhIKZAWaAWOjEqLeCGHIgEXip7UQSdGxycNBCQFBDKUInlLwlITvKSglETOhUg/RiGKYdkiMZSIyJJVAT98INqrxldn5lSeJzCYA1d3VdZ/v5+8jqASUIBnGBhQbvdpqRk9GQbxqjTUkaK0VbL0+XuSxg7v6HyHJLifhncRsoAhETil48d3Fb78ztf5Non/a+Ms8oeWdnpo5aYd/9nMPP1TMRb1KGRSKRVpd2cLgwF6cPHkQujkPsk0QO5BKULkBTK07ZqPhvHf58uWX3Zw/6kI/dPXie7lvfe+HC1dvbP5uuVp/F9DDw8PDPV09/dSo14RynN6+3v5jg4Mj+5qtRlyr1RaIqKW1roWV6g3H92Q2m90npMj7foYWFxZw+fJlevjhh3Ds2FG8+OKLmJ+fx11n7kKpWMTGxsYOy4hAs9XCzOwchJC45+57sbS0gvPnLmJ4eBT5ooM4NBDWg+/m0ddbQtbXYDQQNCuwmrC+Vseli1dQ7Cli/6F9YJswzxOJAyXxR7DbW7N0K9eZ7yAJWyXRxiY7cJ30KaoUDJvOcP92fdadjmMfOKu6A0UhkRXQ+2LiOxtLThT6URR24s7aX1trnVhf4hgmVdZzSkrdjunaxhGLHf7HHaeNtFAhxb2Yjv8ysQp5nWLVliq0ZRw7tT536qpuL2S3v98pwLVTvKSAQw6ylIHvSwyO9UJkHLz97iW8+MLbCNYv8E99/JhnLBdnV0JXkWjUotoPNjbL14eHRz4ihLzLJxZ7xwZoaauBs9MRTy4rzK9pNAIJV3JD6drC5uzk9RLWw8c/NHbk/uPDR/vz3NWdd2lkeBhBpDG1sEob5RZBuBDSTY9pNm05bHpsTnIvjWE0AoO1SgvNwECnx+oEiqdSki46VikCQzkSnqPgKoLvJguYSDOqjRCtKJU9cTJLtRyz6zjo6h4IV7fCZ5dXl54ioiYAb3Rk5OFMJnM/kQE40M1mRQ7099hcxn/hxRdf+T8H+voKJOR9nqda9Y2lK3sG8qd2jXUfJ0QkYZNzA4M9Lys2anT960+9+9vVkN/DTygU/ZEFiwH6NYCblbDrF3/mkY/29zmjcVgGMdPxYydwcP8hUGxAqMKaaiIvkBKtgHFjTYilMtYvXrr6QrF/2ORy2YevXrxS2r3vWKC8wg9efv2tPxZxrCOjT2Rz+eKe3WNcr9UJJDKFQnFiqH/goDZxtLGxufKrv/qr1Sd/8Ey5XP6HN3LZvMhks/sBKniugzAM8c6772JgYIA+85lP4/r163j1tdcwMbEHExMT2NragjUWyknWwCQcrCyvYWOzgoOHj8PP9+Gl196CclsYHRtOiAaxgJR59PSOoLfkwkMLYVBFFNXRCpu4cOEK6rUIR46dQrGrO5llcSqaZNshP7SHyzvmAwlqhbbpm46T3KCu50DJJFrd2qStJ94OEriTov0nKVi33tCi8721ezAGQccGUZSwxjKZLIrFIgqFInw/k4pVAW0MwjBEHOuU/RUjPUTcMoPbpjPsHNCn07A0Q3I7Ri2ZTbW3fh0SRjpUb//+flxXdacu64OK2M5i1bbtuMrD0OAIeoYGcXXqOr73ve/g0tm3IKMKvvDoMI6OezS3uEkzq5aUcuNQt95cX9+8Njo6+pAS4i5PCkHSw9SqweSaxEbdISbXKBku1Ndn37FbM1v3H+8fe+xDQwdHu/RQKUtqsL+HvUwOM4srNLu8STF8gJx0iZUiYmBTsmyCDEqDzBEbi2ozxmYtQjPQSRkgBrFIA45tJyiVwEkwryMTS44S8LxErxZqRrURIQxtqi0lTiQPFo7rUaHY11reqH5vbX3rhfS0k9k1PvoRx3XuC1rl2OqG/vAD94QPPvDAS9M35n93embu0q6R0Y9Y8COSeKa6Njt9aE/PI+NDhWG2ESRZImIWJEk4peDctfVv/fDc8h8TUeUvO/9Q7zNyCIGatVypBwCVwEwswKSDOqSbB4cSBA8WIsnhs4xiljjjxiLjqF4AWS1Ea22ztdSVH5Kn73lkYPHpZx8E8OL09M3Lo7t2lWdvTo8oaXD6rpN4+eU3bMbPSaW6jj/wwIf+X8OD/ft+7dd+7feBX7scBDxDRL918vhRHhzq/znhqt1SOlJJB089+TTPzc3R5z7/eVy6eBHf/va3cfz4cZy56wzm5xextrYG181AGwZ5WSyvVvDUD9/EmdPHcebRL+PquVexsnoRD5wZdmFVOwAAw75JREFUR86VICMB9tHbtRenj+dRKF3BlZvzuLnUQBgy3n7uOSzcvInP/dTPYNfuvVheWUFlczOZR1GMKI47NxxzMggV6VEsSXZWKfjPIpvz4HgSriPhKIVyuYZ6rYk41kiQXKYz9N7JpLq96/pxg/Gdn9O2tWitAQhks3kUCnnkcjn4vt9hYTWbCZ452eYR4jhCYru0kAFBKtkRciYqc5k4AkS7QHJHkc+cdAhtNXq7i2pv/trCz53omdsL0J2yD3/UBvD2NJ92oWz//56eHvT29WF2cQkvP/U9XL14ESJcw95+4NH79mGgWKGt5WvI+1kIQex7mXypq/tj+YHSlBIq4whJkQ1wfbGG0CiKIWzGNdWgujZdWZ1cPr4nU3zwo/snejIY9J1A9PV1c7HYh/nldVpaqyBiCfK7YG06+Gd0AhpsisJOl8hJd8oEw0nAu2HApEdtAiW1pr095u17eDvpOU2TSjvWhOjB6ejatnMOjLEmktLzQYqjyJj2PDuTQQ7g3kajKnftGnY+/fhH442Nref/l//3/+efb2w0XunOOXu1NnstWwVGFcaGhbznSEokExAEspaFUKJc55U3Ls68AGDlLyIU/XFK9/YUrFUuN2ugAZBQJGwIggazBpELWC/hl8cRwEAx68ChEEooZB0HgIOlxfX3zs5e/zNV6P/Y6K6x+37ll3/hf3nr1beCk8ePdDd1gLX1Vdx7z4dQLOYF22Tw5zjZvSdOnPzbvX0De956460/IaLnf/VXf/Xmr//6r//bVqs5Oz429HdyufzdJODkcnlcvXKNV1ZW6TOf+RS+8pWv4Fvf+haWlhbx6KMfRXd3N6ZuTCWiSBYQjosojvm5l17DRx95FAcPP4qv/cH/iuMHeqjY0wXmGEa0QDqDTHYURw4pdHUXUcwsYnp6FVvNKtZmq/i935jFo49/Hvd9+FFk/QzWV5YRmQRaF0VRh7rAnFyBQqRbHeZkQC8TISdAoKwHJVVyTBQK1WodYRyD0xvtg/x9t9+wH0SESIpUArZrHz1dN4NSqYR8vtAZbruu25FpSOnAWiCOTdpd2VTSoaE1Q8RJp6JjAylTcacQ28eRtGgkXZOCkwo9293N7VaanUyyOxWsn6SzvFPH1f7TdV1IIZHNZTE8PIxmo4lnfvA0XnvzFQSVLQzmFU4c6sfBcR8e1rCyuIHeYg4xG3J8l4WrlEeZDw319YfGYI81UrCyZJit56iyCFZvbs7NbPWXrPfxj40enBjyxnIydLtyGS707eZqM8LUlZvUDBjCyYFEgt0WO7IDwUhzCNqVCiBSsEm/BG1ihNokjDPQjsUudegenevklog17tAbGG10dDoDtZzGh3MQG73h+ZlBbbjSajaWUmE6XLc0QILGP/WpT6iJiV307W9/m996450VZnuViFqZTMmFkAGsXSeCdjxkcxkvA9YAGFoIKGtBJLG21Zy5eKN6mYj0X1TK8COG7h1qg/zYvfvO3HV8+ATrqpBWE1sNqCIkd4FtHYLXQTYEtIaULm6sC5pZtuXV1c0Xao1meaCvN7eycPOHb713+d1idy63d/f4R48fOX5qYWG+MDQ2oAqFHLmOZ69dm1wMwni9UMhniSCNsdnu7p69I6MjxzzfKf7hH/7x5qlTp2YuXLx82epwRTmqkM1m+wFklFKIoxjvnH0Hvb099PGPfwKLi0t4443X0dPdi8OHD6BW24KOYyiZ1GbX8zB38yqv3XwGP/fTD9J4fx9R04WwWRDFMEIB7EKwi1KxD33dBfhOGdZuoRGEsBTh/JXLWFpexYFDhzA8MoBGowGT6otufdrLFKWCW6wrtI1/hHKcxDKhk9lRGMWI2wriTqfCHS/hnd5vR8y0j2HG2M4mznVddHV1obe3G/l8AdlsrgO5axeStsF55zyuHdyQYHRsZ77Vmb11kMSm8z13OqbUpNxWqu88/u0ciN8ebPHjjoDvE4KmBXPn36mUgpIJo39oeAhdXV04d+4cvvnNb+Li+XNQcRPH9+bw0KlujPUZRI0ttAILSA9SSKw0CDfWGII8OK7jeRlvnCMMSeUq5esmCXGlvDT/nqje2PzIqZHRh+8ZOzrSZQZKfizHBvvguxlML63RzdUKWXiQKpvYushCWJPOn2w7YSQ1wFsImyT9aAvE2qIVGjSbMWrNGJVmjDDi1LRsIVILE1IpQ5tNJgTDdR04CvBdBc9NUtkbLYNKLYS2SEKHmdnACiI4pa6+DMifnZld+I+tML4BgBRw9PjJo5/K573er3/jm2qjXJe5QvfN9WrwbNhobPZ0j+zJ5PP3AiZndHDFNRX/rqO77vek9rWNAalIMCCEH08u1p978+rqt4iojv+Mdbj6oO234/UB7LLQGVgAVlWhhIAhArkM2yBI4wE26QiG+hVgawPZbN/u5cW5S3Ec33Ty4y2Ec1PP/+C1jdX5jbUHP/zAV8b2TByYmbmJsbFhLC8vhy+//Mr341hPnjx56pcPHTq4N5sVtlavu8Vi7sSZu06P9HT1HnztjTf/Qw96XoXKfvfa1PTNVmC+PDzU/1PSVfuFJMrlCvz88y/g5s1Z+vSnP4Xr16/j2WefxeraAdx774ewvraOxaUl+J4H5fr2rVdfb/z8rzzq7j+w3w+Wl+EKJ2W6F0EcgWBgyYe1Dkpdozh+3Ed3cRLdN+ZwfWEZML2YOvcafnt+Gp/+/Bdx9NgDWF9bwfrWEkhb6JBAxgFII0bc3jOnrTwgLOBKCYcMwjiEcgmuJyCUAEkBG9qOrOCW1/Z93Ud7e2juqNRqdzrZbBb5/Pbxr30sS7AwSN8TYKFKzvnQOobWEeI4QhyHsFYjikxi7DZ6m8ggU4lH6mIzOtk2xtrC0RZCJB3Wj5ozfdCx9n3K+TuGuRKE8NO/I9F3JT8XYbhnAD09fbh44xqee/FZ3LxxFVLHONDv4cz+Inp6cgibWyg3W1DSBZQCGSAWDDaMrJXk+TmOTUsoQwXlwbhutLC1vnqpWV7aOL23uOueI4f2DxbiXkE12dPbz/lCF5bXtrC6ukFaCLgqm8yoOIVpps69ji6N044qLbSGgJgJrUgjiIBGYJK5ExxYViAkOZkMBUsWTGEy0zLJcVIQJ9tpYRL/YDJJhYFAbGNoBixZWLIwSLDgwgr2XZcDG0WN0ETtxrdvaKh/ba3ctbCwTJlMgZUFNZtNhYT5T54vdlvofRAqGzdbKHpynyTOA8SO8EBGMkREAXFQDXEDQOU/V5bzvg4rJY9mP/O5n/rI6bs/dFdQvykc3oQyRKS6AM4D3EDQXEuewkoCQQS30EPvzATm3GTjvbXVxeu7dvWN1eub9Xq9tc7MlX/4//zvriyvLs+5vp89cGD/YLPZyGQyuWhpaeWZ+Znl10C4V8fx+MBgP3d1FajZbEEIlevp7dnb3z9wsBpVzI3p6bknnvj9qVdf+1fnLUQ962dGXNfrEbCO6zjYKm/h0qWLdPToUdx99xm88847uHLlMo4cOYKhoWE0mwEajRaKuQJfeOe86isOivFd4xTHdQhKCpUEkEztJIgUwARH+eju6Uch78JVBmG4haBVQ9jSuHjuOmqNJo6cOIxSVwmNZjNVEtsUsbNTbLKtk5FISZ0i0dOEYYxWECIIQsRRBGNSlAyLHVWI7iAmaCcdvr9YSZlwsPL5PAqFArLZbEfftLOj2Wkkbs+n2kjnBHujbyFGtDHR2/Oq7Q6vLaFoF6G2yn7nkfCD7DI/6futiBsJwZzA6tyEu9Td1YXx8V0Ioga+//STePJ7T2NraRHDBcYDJ3px6lABGWqh2agmxyqh0ocJJyZgl7C8JXi9lkNoJbUa68goqoZR7cLyzcvn+/wWPfHgxF337C8d7cnoQqGYobFdu9EMDa5NL1C5FhCUn5akdCmRIrg6G1c2ib9PJA8yY5IlRRBbtAKDZmDQihiNUKPaCEDKQ70eINY65YMSmDjFfotOWo4AICWnWYSA7zpwXBeGCbVGhHorWRhZtrAkSYArwpjpweHRTK0VXpicX/wmDDYBqN7e3ge6u7ufcByvlLzMTHEcXy+Xy98Pw7A6MDRwn1TyLiGVF1W3Wv0FHDw4MdAvRQxJioQlQEUUwWtenKz/YHJu4w0iMn+lBatNHt1zYOD+xz/zlXsIULq5AoIlEi7IZgBjsbg4yddnlyGLw+hWCoZauLFWFc24VOoeGOrb2Fre63hqaWujNvNrv/ZrIKLGYG1o8ura5KVW1PD27tkznsnk/OvXpy4sLi+eHejvP+k47qFqtUzZbJaGhkYQRzHHcex0d3eN9g30HfF9t/Tcc/9mPgjMTT8y17fq9ZtCioLnuUNSKE9JBW0MLl68CN/P0Kc+9TjKlQ28/PIrAAS0tshksuRniw7cbvHCK2+h1Qzp8KEDUDCwURMS24GPCV5GgC3BkkKh1IPe3gxyTgDoJoJmADaE6YUZXJu8htHRPZiYOIhYx4h0ExBtqwTdopkSbaV1etFqbdFqhqg1mmgFEaIo7hz1dkYH7Dz2AR9EGuVbCpbrusjlcrcM13eyrW4/gm1/PIEQfnDBag/wcctRcKe0ol3Q2sSFO33dnfOrO82yPqhYtY+RUhA8J2GFZ7I57Nq9F9Jx8fLLr+DP/9O3MXXtInr8Ju7el8dDJ/rRmw0R1rcQxjb1o+7AChMBJobKZPnmOjC1bIhcW89wY2ptfvqqsuuNj909svvR0/2nR0t6sORrMTw8AKtKuLmwSourG2RIgBwHJs3gwzZSLxllc7KEYRgwAZaTbinSQBAa1OsxmoGFZoXYENbWt9Jjr4NKtQGj0wJFOxKY0uARSQnuRUlKFjpSIJPCJrVh1BohGqFOOz5ObFjWaEnQ/QOjua1a+Mbc7Np3U0mDGhwcvC+TyXzUWpsFwEREURRdr1Qq3wvDMB4eHvwYQUw4StYaWys3dg9m9+7d090LG0KwIEBCOJaasbvy2tmFby5vNi/QX3J29UEFq9MNHJ0o7vvYPSfuz5X25iNVwlZUpawKIYQL0j7W1mbxh994Gd9/aSkeHum1I2NKTozlpM/e0IH9J04dPXl/8ekfvvZK1GpdTf9WtYlN1Ww27czNeb/ZqEz09w8ONRqt6+fPX31jaKj/tO9nTnieR5VKlYw1ND4+SkJINBp1ymUzPf19/YcGBnq7mtVyZX5ja350bNeVxZvzkxDQvp/pIxJFQUK4rosbN6axsrJMjzzyMHp6evH22+9gc6NMUinK5nJgL0OF7h66fOUaLl+6jn2796PUPQwTB2DSqZ/OJKkjRAlOFgK+9NHX1YuujAdCDUG4iNAwapUWLr53CUL6OHbsGFxXImy1sMOW10ldam9xbIpiibRG0IrQbAUIgqjjhE+OhLfMWO84cP8g6UM78KFN5Gzjgz/IFLyz42p/3s6cv/b86vbO6nYt2Z1tPHxLQvROGOCPR9hsF9OdxdhxHAgp4fk+BkfG0NU7gEtXLuObf/YNnH3nTaiwguO7CvjwyR5MDGmEjWW0WjGk9CEEduRW7uh82bBwPKxUhCk37HytsvhWbfH6/D0T2YFP3jd4at+g2tPlBv7YSC/yPb2YXSnTzMIWBVEakNJWH4kkOIV2PnAsdWAbJAWMJcSWEEaEILaJxkoLaKugWaFaD7C2voFcNgsGodYIYU1SoFJHYNpcpQz3lE/lOATXVfCUgO86UMqBtoxaPUAz1LBp4bQAg43yHKerq2cAy+u1V5dXN58johaA0uDg4OcymcwDAFQaRKujKHptY2Pj+3Ec+6OjY1+y1h52JVVrGwuLB3d37R0bzvezDiDIIUHEJA1VmvLGc28sfbUeRDf/c+0c6gPcalFzprkUrV9ohnYO3uhp5P1HEG28BGUjOCKHbKEAOHm89sZ6uLr5A/pHv3zEufdgD778wJh47tJc8eycs+v0/tGPvFbdmC75+eD0mVP39PT37ZmY2DUxsXfPibHxkX3ZbNGdn/3NQkYpNpaaSDS7cByHy1tbdKnZwp49ezA+PorFpSW4ruqb2LPnK9lMZv/Fy5e+Ojl56Xt/62/d/c7Xfv/SQtBsXRgeHv67hUL+HgI5hXwJ8/NL/Hu/+0f0hS98Eb/wC7+A733vSdycuYFKdQuje8bheQ4GJw5ja20V/8dv/Cd84fGP4dEP70XcWAJzBIcSWB86oH4JmDwEMhjdVUSmlEG+dB5T8wYLK0uITAtP//kf4ubUZTz+2c9i/94DmJ2bRbPZSru1REFOAKwBpJCwbRM0Uefi3hHis10E6CfnYN0uBbj93/+441i7MGSz2U6hiuO4YwDfOYxvD9t3Cl53dlHtrimKopR1T+/7OL/PiE23PD5vPwa2h/adRUJfP27OzeHZr/8pbly7CMQ17Oot4t5DPRjrUYiaIVplDaYsyLMwIobQ4o4BITaxtVCwubq6cGX+3QP7Hff+xw48sLfbG/JpyykVi9zVv4s3GxFu3FykVkjwVCY5njHSWK0dZvGdPVbn6wHaAGFkEGmgFRlEFjA2+Rkjo9EMDbaqTTBLSEhEO10RvPPXw7dAHRNh707HBaWooG28dvvPxE1pyXVdQSTqOtKTANqR8RnXdYcB+JxETAtmDoQQN5rNZtn3/T4IkSVj+9jE08LqYj7r9xKZtOujdMTkcjPQlfWtev1HzSv/8kP3VCPx7sXrthI2ucvZQP3GEkpDj0F33QtbvQbbEnA9g3zJRbZYyG41YswvSuwpNOFnpsWj943b4Z6wW7Z2//zw7v27z7/75vLJU8fu+0f/6B/t6+/vy7FgVyrFUWjoN/7tvx9taT2QVnXDINm+qGMd4+q1K7Rr9zh27xnnpcU1BK0gPzg09EgmW9hTKvae+OPfP//7Z+67761Lly79x2ZzenNkZPi/6e3tfdAB9fheDtZq/vrXvoG77zlDX/zC5/i111/HlSuXMXu5hqGxCRS7B8gf9KHyRfzR0z/Ezbkr+JknHoHnGcTNTbhKJsWKkwxJCIKVEswKPX0HcZffh/7cBVxxFzC9uoKqCXH14mtYWJzD4098ASdOnMDa6io2NzahtYTWGsQEzdy5sKRUkEL86HrE2+SDDypOtx/H2jOotrt+p4zg9uPXrcbl7XScQqHQKU5ax9vdX1q4jDHJxokoKWhaJxictENrF5o43g7P2NkptdXt25qx7WC9DqE8Fd4KKeBIB0IK5HN5DA4Nol6v4bvf+k945+030WpuYbBL4vSBXdjTnwWZdVTLVZDIAtJJrCucfO93+l0zACsErNZsq1veZz48fvTwEW+owK1Cj+fz4PABbhjG+ellqjZiSJGF5yjAxtui3x11ijoKhFRawEgj14Agkgg1EBmLyBA0JAwLmKjB2Vwe+e4CZhaXIZQDKV1wFBKzaWunblnAJDMx7ghN28UKRJCUXL9Ga1ijOxhlay04kUnBdVywpTBoxhsAImaG7/vCcRJ0347EdGbmEIAplUolWJsVBKOI1gWZlp/1fKRmbcvJgkHA6nq9MRMDK38VTll55+UMoRJFvb/0i489NFSKxqg+DS6vEgmNqNWASwJRPIcrN1ZxaXqTBJjOHBnH8YMDiOMtajW2cGC4i8bH+vJBGO7LOoU9Zy9d4Wtzc+HJUye8rq6ciiKGVFlyXd+dmZ6uLS4u9Luuc6RYzDqOI0EAKZHgRrY2NtFqNmnX2CikFGg0GpTJZrp7e3sPFbuKQxfPnStrY+Y9P3t1eWHpEkk0fc8bFEp1kxDkOC7Pzs1hfmEB991/P1rNQG+sbqBWb5E2TLliAdJTyHd34/r0PM6eu4LR0XEMDPQhDlsJEpnTCDBKVMgEArSCIwvo6c8in3fhcASOmohaEaJQ48Kly6g06jh2/ARyuTyiMEqFe4l/r213ibVBoxGg0WiiGQRJKIVOkSE7/aE/ITZlZyfVPjq1j4Q7B+x3SnCWUkCp9FgoFVzHg3L8JDgiilhriyiKODYaJr0BQAS2YGMtW05Y/h34JQOcOvt3Dubb0oPbj4ZCJJRUAZW8U2JtcpQHKRxkch5GxoaRLWTx5hvv4Btf+yamL59DTjRxfE8eD50exnDRIK6vIAoNWHqA0GAKQWQhbKIOTwpWcuQHGJIIgmXScUiD8aF8ZqRP9hS80Bvr7+V89zCmV6t0Y2GVAq0gZSYVb9o0f4Q69FVJbciLTA9qyWsdW4tAM+qxRRADkQZ0nMxIjY0gFWNg5CAOnrifB8YOmKvXphC1WtRVLKIVaaq3ouQ41+aKUjtqROzoRhmOIviugq8Ini8BIdCMLMq1CKHmRDLaHlXYGMWuEim/WLu5tPZMtd64AIBzudy+/v7+n1JKTbQBn8wcxnH84urq6us9PT0ncrncZ0HIGdNaULacO3Fo5FjWZwUYEBhSRDDCa124sfXMpenKc0QU/uceCe9csATBMrz/9mceeWikmw5SvAVBaxSUJ/Hk95/HxJ4xOE5Ml6+t0KXpFYpjTUcmCnR8f4G6Mgo2lFSu1NDVVedDu4pSWjdHGRfffOa51558+qXnD0yMFfbuPdwHCDpy5Jj/N3/uK/sefuShA4AtLM7PELOhfC4HTpNtlXIQNJuoVrZoeGiISl0lbJXLrBzpdfd07+kf6D/crJXNwtTM/OOf//zUa68/fz42ctNznS7higEi4SrX41qtIa5cuR7dnJ2bjZnhZTO5amWLG/UqdXf1QEgP2Z5B1GPgxZdfgSCBA/v3gXWy1u90JbxtdGFYGJlFsasXvYUcsqTBuolmYwOaGTOzS5i8dg1juyawe88EoihAFAWJjUskmps41mg2ArSaIVpBgDCK0jzBdsEyO1hH71/5/yhZgFKqA8HbaYXZWaxumRORhCMlJBEclWQxZjIeZ7M5wBI1WwGFQUhRpG2so8haNmxZECU7ciImYy0Zo5k6B+FOQAW1Z147j3cdmYWSUAJQJFOqrIBUBOkSPM/FQP8QBoaGMHVjCl//06/i7ddfgg02sXtA4sG7x3BgVALBEhq1MiC8VJvV3p6JNFBkm7bJwqT+SILglIwJjawn4DkBersdjAyNod60uDK9ROWmgXL8HVnayeKPiZKijDT5WqR6OxZgFtCWEWogiCWaoUKgJaKUXoFU0FksdeHo8bvQN3IXphab/NTzr22sLa9s+QqZQs5X9SBCM0yzMMWOhxIIkhMTOxOgZJKS4whC1iU4fpJC0AgY1ZpFbBk2FacKywBrFHu6yCpvbXpu9XutVngZAHp6ek51dXX9jJSyPz0SEjOHYRi+uLa29sbAwMAB3/cfZ0avjluzWWoUjh0c2u9KCFiGEoZJWtGwxbW3r1T/dHap/A4R2f8iHZZILBb5xx488rGjB/uPmGCTjDHk53J4+dXzyGb7MTLehanpeZy9sopWYLF3pIDTh3rhSQ0/mwUkUbW2jozDOLSvD6WSmyXTtfLVb7zwe0899eT1wYGBg8eOHe01RgulVGHPnn25j33sk3To4H7cvHmTlhaXkMlkOjdkO+NveWUFvT09tHvXbqytrQFgJ58rjPT29R91sm7ppWefX9699/D85ubW5c2ttWlPeb7juINCyJwgQQQKZ2/OTipHur6f6RZJHDxtbG5AKYVSJgNXOcgWevDOuUuYnpnHwUPHkMtkoKMmpJCg1GzKJJPkFSsBS/ALeXT1dSFXdCBpC1G9BooY1WoZ7128BOEoHD95FI4jELTiBPthGWGo0WyGaDRCNINWUrA07xi6p5x0iB9JKb2TOXhnh9UuWDtlDbfPk1w4cIQD1/OQyWbQP9SLgYFu1JsVvnL1Uu3atUtTC0uzV6rVzTcajcYzjXrtzTBsLWijy9bGgdXGwsQGxijLLJLDom2jdbktNm0/4NudVlsNT9aFEA6URyBHgxyLvoFujO0aQ7law7f//Lt4/qln0dyYxXivxj0nSjhxqARPNhDUyyAr4SgfJJyE7ZXOCNsTKuqYuBOSBJEDQQkdQRBDCYOs79LI2AiR8unGzSVaWq0QpA+h1B15KJJtKjTYhjS1xdyB1mhqiVbsIopccCRBcXpM4xDkAmN7D2H/0YdRbZb4xZffxJtvv0uNZj2AaW7kXVvIZaRXawZohXoHfG8nToY6ieVSAI4S8JRExhVwvYQ02gotavUI2qabRZuCF9miu6+fIiMu3ZhZ+KrWdhEABgYGDhUKhU8TUe+OIVm7wzo7NDR0txDiASEkh9X6+b4sjx/dO7xHpQBRwQIaXVhYsxeefO7yn4SGb/JO0+1fsXAUAGoz82szsPsCEjLDhplcot7+Ii5cvIYTZz6CXN5BxhXYsgLVeoQ4ZsBLNhi5rILr9VLYbAJikj988oRY3CgdPjC+d+D63PX/9Gv/9H/d39VdGvvsZ7+UM1pzFDYAgO6+90EcOXoMf/yHf4gnn/wefD/pDNoDUaUULl++jP3799GH7rsbb7/zLhsDUSgU9h07evzv5HPFXecvnP29tbWt5+6+++7nrlw4tzg6se/G6Mjw33Bddx8JYtfLlONYe1rrCWdHBP38/DyCahWjo+OgbB8GD5VwfW4S/9v/9Uf4xS99HKePjMA0K0hSRFL+OElINgBJ2IggVQl7d/so+RL9/k1MzlVws1xBS1s89d1vYP7mDJ544gvYP7EHcwuLADNcN4aQCpxyi36SrvlHkUbvNM/aKTu4PXJ+579TIuF5Fbp70dXbhbWNNf7zb30Hzz//jF1aml0JWo0nYxN+39b14obYWuh3Yer1rm4i1ZvNZsYdIQcdP9fvCHVIiHhCueGodb1eKVXeMa5wHTf5hoLAijTrLt1KkpQSvusnmGbHIlcqYXhoFHHT4pnv/xCvvvICWpVV9GaBQxNFHNvfA4kaGrUVEAu45EFYAWssrIh2/PxJqk/7CJ7kRRpITnR2SRGzcBxAiQTkN7+0gbX1TZDKAG4RNr1GxPvErikzHUg0cyTBRDCGEccGzQgIQYgMYHQEH6mIVDro7R7HxKGT0KKE19+b57fPXkXQ2IJwHUtsc5LtuBTsA4aN0XRHgkdasHjHpkZ0yBSyc21vOyduw98RwXU9brWo2mqJavqzOa7r9kkps7cXR5s8RT0pZbe1tu44iuOoXivmlHKlJWK2kRVE0sVazb357CuX/2wr0FeIfixt8i9dsNqYysblqzPzW7XTrS6VyVoKGCZAV08Gl+ZrACtkMgK+AixL1JohImNBQsJoDRIW0smgUOoDcwMmDlAqFT0/Ywv79+/faDTWXn7qqac+v7GxceCTn3yMR0b2kNYRdBQgm8niv/3lf4CDhw7hD//g91CtVpDJZqCthSMVcrkMZuduon+gD/ecOYWXXnkLSrnsOk7P3r0TXygWC0Pvnn2n6+233/7Br/7qr17+l//y1/9NELRujI6O/J1iseuwEHJVax1ba+8yRkshZAdLs7m1hSA0GNqzD56fQf/4AUTVdfybP/ouPv3wSTzxiQ9DhBuJLanT8MSpetkBrAMTC/T2HkExU0ShdBWZ2S1cW1gC6y5cO/sGVm8u4JOfeRxHTpzE8so66s0WGOnxhERHxb4zSw/40ciZD/pYezvURsi0U6E7HZaSna/pOA6yORfFrhJq9QBf+7Ov44dPP421pTkKwyAMw9DaqDmha42DsKKk6+ibBVYjlNcBTAG4mDxXBt3eXl0qFjOjrhR73EzmeMbP3eUo75D1s0Ou9XIMSGxvFdlxHHYcB/luB1093egfHUIUW7z2wuv08rOvYHl+Gr5Tx/GJDE4e6kZBhYhqq9CaoaSfHBZsohQHGTBHqfZJgpGgWnbco2ATQ7AGGwvfd5HJJrdCEMYIokSsKZ08GEmHkjKUE37YbcjpNHgrkTSwQBglg/UwlIi0hBECDA2IGK04RraQw75DJ9HTdxCT0zW8+vZbWFhdBkkL4TphEEXvModbrjXHARSog7luf63tgrmtz9uuB0LKNJF7+3vsCJG3zdHpNEwATGg2A71deeFJKfcB6NoR0tERAgOQjuMoY0xTEDetqYlS13AJwiIyQCxzvFLVsy+9ff233pla/GMibDLjr+RNfQBYFwDMlas31xsNXWfUerOSAY5Q6vawurEJq4GuUhYZTwEUo95qIWiF4G4vsRlIAcMxGBaeN0JGFeBnyS0WVP/5t686uZwzGcd69qWXXjhw8eJ5/PzP/yJOnToDawATWzBaePjRT2D/vgn85m/+W1y4dBH5YhcsGJGJkfF9XL92FY8/9hgm9kzQ/MISuZ4HY4w3Ojb2QE93T99g//lj/+Jf/B9f37+/dX5+/uZXb1xrLozv2fNTbM2atYYAaICkMYaJiKQEhOch0BGmpy5jdGQMfT3dcHJdGD16H777+jnMLa/il//GY3ARgayBFASW6fyCdTK3EC6sYcjcMPYfySNXmkUpN4PJuSqWyk3UywH+5D/+Ie6dvo5HPvpxDA32YXFlDSRTbc37ihB3IIF/0bfE/Gxv6bCkFLew0qUUyGZz6OnuRiuo4+WXXsLTTz6FuZvXIcIySggwuivPeyaG5KGJ0Xv7S9lTYaveWlhcjienF5amV+KFjUprq9aIJ0PNm7XWxtJaTc9tbOAigLcBfH+4t3c0m88fzufzd7l+7lAm409kcpnhOI674jhWzKwcx3GaQdO4QZaffPI5+corL2Ntbpp9G9HEgIe7jo6jr9tF1FhBq1GDgAJJlcoFGBCms6ynZNCTvD5oz4ts5wglrIYjDQb6sxgfG0IQWczOL0PHBl42CyEtjE2ZZumSxewgaNwSvEsSOqV4hrFGpBMxsLYurDVQ0CAdgaTHo/uOYnTPYWw1Cd997h1cvrZAkWFIRWATU2ztXLlS/lo+SxLWdPvKH2FDku1tC5jbH1rpDGu7Y95eZFhrkiaCCGwtW2s7+nvHcZhIhlGop4Gw3D6pu8mxRt7+BdMOq1cIccgYM8LA5TCOK34+qwwpNGKKFqp84aU3pv743LXV/0hEC/xXVa0+qGClDxAzt7CxHFuqKNfF2vIiRv0CSt09qNYm0Wg0USi46C7k4Mg6ms0YrSgCwUtuWktg1QBrgOUAsc1yb1Fmekv5vQAKuhE3glbcKhQzvLyyhH/37/41nnji8/jUY09Auh501ELYqmB4bAz/8z/5J/ijP/pjfO/JJ+EoCcfzYI2G9B1eWVlCd3epfunylUo2m/M818nFWvvZXOboqdN3DeeLpX3nz5/7Nysr6288+ujRZ2/evH4zbpmufFfmdBzrR6SUe4mIO0JIgJQS8KXAyvw04rCBPfsOYatcwfDuIzh3+SVslmsY7nLBJgAlz+/kmMgmqYFCwAiAkYVgB6OjCqWMg1JuDlfntzC9sgyGjzdefREzczN46NHHMD42ivX1KkhYAAbMZsd9wcnRhekWOjph24l/68W8vRJg3KpQpzTLTkkHnusil8+hWCpBSYGz772Dp7/3DK5cOgc2FRRQxomjffSph8/wAw+cyRa7irvBLYmoJnR1C5vrPbi5r+vk9XltpubX4rnVcm29blvVkNd2x2a62sTrtWZwrl5rrS5tbMxiY2MSwA+6u7u7M5nMWD6b3ZvN5/e6rptdWloaujE9vTeOosLq2kafNnqIuCGHShanD/Xj0FgeIiqjtRFCkQMlcmARw3CY+uU43UYKCDhQwk8uZFgYGDBs2idJKDB6unMYGe7Gnj2j6O3rwdL8Mman55OtnlRgm3o/2ULAAGnwSlsusM0YA7RNNn5BbBFrgrEiKWCsISUQBSF6eoaw+/C9YL8fb1+cx7sXrmGzvALHk1CSYSIGtLDa6Iv1en2yO9/9SRLodhyV5HxY/tG01yQapbOhFGLba2ktI9Y60QC2OWnGNtka67i5gnLcqBVEywAa6V/nO45TvBWhvm3+ymQyeWYeAjBkjJmXklzHL5mtBpUnZ2sv/PCtmf8wv1r/ITNXiP5qsd/qztul5IedrZjGRqURTpwYQrS5wdMz6xT4/QiMQTMI0VNS6Ms5UFqg2RCoNmMQt6BMF0JKxq0uC5BkwProciPhZ5UHQIQAWs2myOVdECXCwj/92p9ifnYGP/uVn0VXdz8QxdBRDCEc/K2//SvYs2cP/uD3fh9REMEr5GCMRjOo01tvX7rxjT/7zh+MDo0HR4/t++zJ08ceXV9fcxxXdB86uPeJ7q5iz/lzF/7k+eeffwrAJDPseG/P/Hpua6i3p+eXMll3jJM+GQ5bJi2o3tLI5IoINSM0GhTXsXzhNfz8Fz+F/p4e2KgMIRN0jGRKH0bJUw7MkAwIkZAS2BSQ7zqMY8dGUCheQk92BpPzc1iPPKwvWHzta9/Art2H4AqHPaVQT9ZaRGTSh1NClxScpBZTgjJNypFNdC8EEHPb9pPaiTiCVRaWdWIMJgFFLnwni+5iCb0DPVC+wpUrl/C973wH586eRdSowuEy9o8I/I3PfRIf/fAD8AuDQOSTjVzHcoNJREz5MrqsYBFUqCBasr9QlL09NjO7prG6EewOQn1XM28/0orc1SD0VnYF4rVaIzpXaQTT1dbW4tbW1nsA3sX2GrGYy3mHCsW+T5cKzv3DRXbuOtzbt380J3JOC2FtBbAOpCtgre5ojwRUqi1KbthkJmUhKIJgBWsYSlkwBZBskfWyGBnox569A+gbOwovcwjkEgrNd+HgGpgDGKuTrkzYBGfNKo0yS5hnbAFBLmAlojg5BgWG0NAJMJLYQlkNY+qgbB4Thx5C/8hhXlxt4JUXXwlmbs5bpdxMxs2Q0QacGHTIkg2lxRUhxAYETxi2uw1BwoINaIcOa0eHJxLHhOSkWDkEuIIhKIaQInVUuNBMsGQSgw1LZqDB1DDCzecNU6PVjNYAGGZGPp/vA7CXiNy2K4PJgEnDwsL3CwRr1wRhgXS80eW5ubp2G+fPrf/BD1+5/LsAzhNR+FddrH7k0D09J5tyrRUj9tHXPwgVEL7/0pvYWt+EpDy6Cv04fXIIZ6criEKLrQqgyYUUDQgosFUpQthAORKuImSyrkrvbhuGYdQWN0qRXICvvvYqlpcX8LM/+3M4fPQUrI7BlhGHVTzy6Mexa3wcv/Wb/x7z8zfR63UlCStKbVUqlacrlcrVyNTFnr2jZ8bHd/WtLK+aMGrlhoaGPuJn/D39g/0nbk5NP020PANsbs5vbn7z0KEJGh0Z/OlcvnCAAC8IAh4cGuHdew/S9ckp7B4fQbi1jIUr7+BnP/0gPvLh0whrq1CqHXWWnizTTA/a9t8kmxiSyXxLWzhOEfv2nUZ3qRul3BVcvVnD7NYayrUY772zAiMVPNEHHapQh0Zry54gIUhKaElCy1TJnCrmk+06sbKm7YdjY8Hp90DCSlCsErAlAySZCiUXu/cOolgsYHp6Bt/9zrfwzpuvoFHegguFvaUAn/rofXj8Ew9hYGwIiASiQJFAFso6IBJEHAOOhOzWVBIa2pnh0A1gVYazGUbeUby6waIeR/3Nlu0PlTxazKh7eoruZqSzi60wmm5F9kYc6nnNPK1jGzoOeHBwYLC/WwwN95ZyB3f1ib6cQquyhrAZQionGXyzRaIkSo/PAIgckEgmTcw2Rd4ARjKgABlLZJ0cBvvz2L27F6Pje+EXTwLuIAzlQDZAvucA/NIbMM0alEX6NbAzW2c7f1EIaEMIQoPYAA2ohM/PBqQZnIp1B8cPY/fB0wiNjxdfu4TzF66jFRlylE8MQ8bYhHibNjBSCGMtGlLKCGx9KUVGCGG3yR136rCo4w6gzv8ms6m2Ed1Y7nD0LTMnciF0gagplYwt03oYmRkkwcbIZDIuEeVSNUMK4WpDAI3MZjPDIJGR4I0wDCZLpe5wamr5meffuv7bzHxdJALT/yIhKurHfHx9Y7U2B+43sWVRyhfxsYdOYbjrNErZQRC3cNfJflxZWsObbyxibjFCueWiy1+HsBlAu4nB01rAhvAcEvm8P4JMZgSt1rVW2Jph5kBKmbHWMCBIConZ2Xn8q3/5b/DFL34RH//kJwFJ4FgjaFaxZ2Iv/qf/+R/jd//Db+Ps2bcQxzGyuWySy0LUMobeee+9868dOqgfHR8fz1drZVSrNdXb07u/VCz9naOHjz5WrVZmqtXacrla3lxYWFy6Pjn5J0NDww/09vU+qASXSDqY2H8AhUIBS1MXsD5zAX/vy5/GA2cOIGysQgqTCu9EGgJgd8yZ2gNzgFmmx7hkewQrwETo6duPU14RpcJ1dM/NYXJxCjbKYb1axI3VFVuvB+8ZqFeVyhSU67vKdRwhxDigelzHSXRSQgghZUkIKsQywWyQIEcIUu3w0nY4gVA+3Ewe3b0DKPX28rXJKbz4wgt0/t130djchGcbGO1q4qEPj+HLj/8MRscPAAYwDQlQFiwyqcFWJ2EHnIMmH0YqqJ4ceh2HNFmQjeFDI0N5ch3mckNzox5xoxUj0qYYGVvUzHs4L+4zWoZCZGpg2mSwFpLQ25P3BntMf85p5FBrOeWmIM9xIZUPY01HN9U+mkiRbMNs2+5idSIvoERbZcnAkRa9JYXdw4PYvfswSv37AH8QjD0A9QIqhDENOCqD/cfvw8L6t9J1f1qs2knYDIAljE02flozIkOImBBZQMKCTARtgGyhH3sPH0e+ZwIXry7gzXdewtpGjZTrccbzPa2jdPifEBfaJ3kGEMZGEJFHgBFgLSXJMLJpod42au88qHXCR1J8Udu32WbtG5NkGCa/uiTui2CsNYg9J2uttqbZbLaxMnBd15dSumknR9uHTsUmNjKTcQYJtgcCImy1ulFQTivAu0ePYkYI8V+oVP1kBauyvFZZMXCMUFKYKEJ/MYuBRw7BBg4IOfSUBB6+ZxRrS3VcuraImTMjOHEgA4oZYAUWyRORTQDX8dHbXeyVZHoM0DTGLEspY0GUSRzkCSZWkEC9Xsef/MmfYG5uDl/66S+h1NUFIkCHEbKZLP7+P/iH+MbX/xgzM1PI53Odb7her7974cKV/73VMDebrebnJybGxzKZfiwtrUAIUcrmMiXHVYd7entto9GIu0qllc2t9dc2Njame3q6DuXypa56vc6Xz7+DRnkVm9Pn8Q9+4Yu45/gexLVVuLLNMBc7+EY7LqD2BimFsiUK0fbFJQCrwHDhFvbi0NEiSt1Z9HUtoHCtihutDTSUQ6uNml5aWXu+mcXljCQNH5w3mRGPRUZKjySYmCV5uey4gBoTTk4I6QhSYtxx1aiUSkjlsqPYUY4a8uOgUAsDmplf8tZWVrILNyelDTfgskZPVuOBM+P4wmcewIljBwDqQRwqCHaTzoUUFEuAIzAZABkYZMBOASx6oXkdXjZCqdBEsFVHE2VkHUZ3QZJhQJIkVymEkWbNlk0i3JSKZM4Y5Iy2QwyGFABHa2htASKr4BXzrFwFDQNLiVdR2FSPls712rmQbbkC2xhCEggGggjdecLYUA/GRnZjYOQIVHY/rJoAVAlCKBiTgyUBIg82amL3vnuwe+Y8pqcXIFLip+GEJ8UsYLRBpBnaCoQxp8hiCwcaOorhOBnsPnQCPWNHML8Z4emnX8f0jRlYEFTWA6xBZKJkP3cHr6e11hhrrKdohK12lLBNAhfsLamOd55hdZTvQoDIJouIdpR9aj3AjhxKYq4IKVqemyk2G3GNQ9v2EEql1B4hxGDH/M62s9gwhlUm5wrDNlZS5ECmF5JUs9Gcv3Qd8V+BcuEvW7CSL7wwvwXLCkImLbeJDMhUQG4PwA4UuRjv9nHi8BCefWkRTz1/DbvGDqDHjcCWoeMIUkUQvoErgP7+EkkYMgA3ao2OEZO3LR6wvM1Gf+65Z7GwMIuf/1u/iD17DsIihNYaUgA//VM/jbPvvYVvfecHpVIp11cu1yklGr68tLQ212o1KrXa1i/t27dv4NixIzwzc5OrlTqkkGSsld3d3Wrv3ok9WkeDjWajbExcMNry6NAgVmavoLo8hX/8D34RB8d7EdY24DntxOR0i5caXTsD753Fi9ujmbT7EimJUwKWDIyIIGwOQyN3o7frIMaH5jA7P409izUxMmlOzN6kvzszF53bWFGXyrGcraLlhAjnUw1FCGCzMzgD7KDn9YiC7BHkGi1IO45LwjOu7+bHmTFgLB1UbD7qIT7qk5FDJYszd43gs5/6EO49eQaEQXCzC7EysCIJ1pDpoF8yA6QQswRUBiLbB5XphoMAqDUBQxDSRWwlIisRxjG0MYi1hrYp80kQOUKRJyVAhgWBdWSgKS36ZCGVhPQyUK4Lki4ZEJgj2DRJrYPmSaTkySKBbco1t3AlQyCG6wj09/ZiYlcPxncdhF88CRZ7we4AWGUSuZTVEKoJwQRiFwZbEFLg6OEDmJudA2udMDdZwGiCNoQoJsSpA8FwQj40UQhYxsDIPuw7fAYBCnjl7BTeOjeJqFFDxlWp+ThOnTT2lhzIWwSgQmyFOrypPC8PjnYrSRkiwBjzE+2I278fKVOjOCQsSWgddqLd0hmftYBgS6Hj+uVAY7oSN5fTy1j4vl8SQuRuMaUnFzwzU15A5MDwibjKIpokqfqq5WZ5R8PHf10dFrY2qzAxQIJhjGGHfGKysLIJyRKOLMI1Wxjp95Er5fHOuWW8dTSPxx8chQ5iOGnoKpGBlIR8NuN15Yul1eaWrNRqkTHWbIv7Ug2STXQtib9K4tq1a/g//8W/wBe/+NN45JGPQEiBKGxBsMXpM/fjrbcvDtiYxxOpDAsiygNYvXj54ve7erMf50keiGONQ4cO08L8Amq1BrpK3UwClogQRmEmDMNMoVDA0OAwn3vjFbjRCv+z/+H/QUMlB636JlzldIoq2qjjdD6X+mxSHjftkCCk8xZKP08wOLWLKGtAQiZr75yD0T0DGBr1capW5/r9YX69HD6+tBE9ulZpzVWbzY1KQ1Olhmq1Gq43Qt5otMLyVqVpaoFZWm/a5WarNR4FoayGzWthiLm0oAFYXwCQHxsoDg/28dCuPs+9/8xBPPaxD+PIoaMgUQACF9a6YBFDWQEYBqROr1IHzApsMhBOEaJYAhVKsByDq2ugcAnN8hUsLF/BemMLq/UAaxWDcj1GvRmjHhgYnURV2Y4p15IQnKrBUw+jSHDSLEyypCELwclG07LoFKV2k2DSAEUhCJIMYAwcCXSXCtg1NoTdu0ZQ6jkJ8vaC3SEY2QcSLoQJwZrA0oVQm0DLZxtHkM4qouZNVMurEKKN0BGkDSGOGJEBIiuR+KZFgjGOAuTyWew+eA+6Bvbg8vQK3njrbaysbMKVEnnXg7ZJ6Om2AKytFLC3dOWJ6NzWg0ivdeeyowKBrxQ5QsDGRhPjzrIG3ikuS9+llBCdoFzAaJNitMGJ2pwiZiwrpTwplB8GrSaAMN04k+M47q0bwuQoyRARkbCe540zR3sBeTWO4zmhVLPVCBv4r/CmflS9Bth4vUPNODusdXPDcWwjaY9VFZoHIHQJwjCkGyPrKmQVYa1h8N1XFvHhMwfQ5VQTPxzHyXHCSpREo6tYzO1fXd2ScdCcYRNvEsluIoZEDAgFbQFY3SFnSNdDpVrHH/3B72Nxfg6f/8IXkC3kEDZrkMw4fux4vq+/cJyIDgKwn3j8Y5/OZvN89s037Z5d+/LGxpibncHW+ho++bFPYGuzzJVWE3Ec09raGmKt7e5de+jkyZP2d3/7N2023JT/7H/6+9TjxTC1GpTnJukrlsCStweyLBKCA5nOtUQpTA2UdFIQGgIW4BBk44QrwxrQLTBraBvC6BAmjhFHEXEcs7IWA3lSAyWVN5Q/YpCF0Q7CwOFWGMWxFXEUM1qhhra2FkaotIJI1pqBaAVRI4r1gjZ6udUCSxZcyimn1J09MXFg98DBQ6fFwPBuQGRhmx5smEvqkowgVASKPcAmZANLEpp8sMxB5rsgsnmQaYE3rgHhHKLqFZTXrmB5ZRYr65tYWW9gs8ZYL1tUGxEakUG9FcHo5Ea1SBC+QlHq8QMkAY4geK6CI5KuTqSWEYZNcgzbwk3BYCS0BcESBBciFvAQo1CQGBrpxujufRgcPgYnOwYWe2FlP0hKCGLAtlIbiwSTBkJmxEsszBxtrZ/HuXNv6cs3FgU5eRGyRhQKRDHBsEDEApoBhw100IB0spjYdxLDE4exWpP43nPv4vKVKYAJGU+B2CbImVRZ2gm3peQx1r64ud1zidRZD85KxigZC8FsGCy0sWmKDncExds5kkjDbgFBJhUYJ6ZxgGGYU41YKnMRBtYaY2GbjvJ8gsy2Iruz5SsopSaIKNuenItUCiHIVJmisnLkEROrERjzhiLSDnlBvZkiiP+aClZbOtuq1HkS2QMVqbeyKlxiaAVhilDIwnAAuAJWEBQBWVfBCMKl6QrmFxvo2yMRag3paTBiwDL3FR3Hz3p5AKjXyqsGuqocCR0xWIpEK5KuarfV2gxBBG00nnrqKSwszONnv/IVjO3eQzpq8N1nTueeeurbP3P+3Pl9F69c27h06fKDpa6e7t5PPLIetWrjEwf3YXVtDZVKHU89+0PkMnn0DfbaKI51V3e3c+PGNA30D/Lzz79448qlKyvf+J1/fyqv4kLUugEnE0OyBbPTUaNvO3lTvRM5SRcldHJiI51srYQGOACsgY1bsHELOmohDluIoxZMrKGN2REiYcHElGxOkWYltedkIaSIKCOt6wvyWBE4Q2BQXjAPE/mw7KegQToOktaC4SqJ7lwG/QMlQmFQwO+HiTIE4yYkBGnSGYcAxW5ykRPDcA5CFSC8HISbB6QBgnnY2ixs4wbK61extnIDq+trWN0KsVUNsVmLUG5abNZj1IIkQCGKDKwVsNakOGKbzJlIwBGAq5Kb1RUEoSSIZdp5pR2DMalhmWA1QFAQTFDEENSEnyEM97vYM7EPg6NH4ecPAO4EQMMgN+HHsnXTbjcCCwVjwBxustTXSDcuihszU/a5N27c/Mb3Lkwe3Nd35NCB/rFGq8mGZRKxxUlghIhjRLHBwNA49h+/D1p14Y0LN/Du2UuoN2odjyZzoglLQHn2Fv5+ZyHTbgqY0V6SgIDYWl8wjwtwj5KyHTTewQsR3wYZ4vY8NVk2JF1oGm5LBKM5NdKn0z7WYGHrbNg6UhQZFIVxVE5HDQDgK6UGmdndcdJkSrZIDSnJZWAETIJjLjtSefVGSC2g9dfaYaW/FP3uuxfKlbIOxwbvQ6uxBeXMwwFB2AR/YlQRJH0opeH6AkoBOrYoVxuA6oaIDIxuAhwShOZSKU9dGZUB4NTiQFRrVeoqFGCtYaYsMRtIaTv2kY6dhLZJje+dP4/V9XV86UtfxP333w9rmmL/vl279x/cO/YlIF5eXFS/8zv/QU1e3xgodmVw7dplPnrsJLFdQFchzzeuT1G5vrl2+fLV106ePDU6NjJ+anJqsv7vf+vff/tX/vaXsffYyWOt+WWEpsKuiCmjk9hwVkgTS5JjnxUxiAxYKDBxyoUPAASADWGjEDoKEEUhwrCFKIqgozBJxdFOJ+GmHQOGRCGYdBiUWnY7ykALWJ2GLki26UnAsoXlJDqK04s0iUUUEgjB1qLJPjZEiKxx4Hb3QcgiyDoJBQICDAXAgWWCVhbs5CDcHki/lPx8cRVUuQmuXUWjNoOVlctYW1vBxlaISs2iXLeoNCxqLUa1ZVFrGTRDg1gzwpihY5MKMVNNmaTEcOymoRySYG37+0hoAswS1iBJhkl+UJBtCyMtPMegu0tifPcABncdRm/PUQi5D6zGQLII60iQlSDEsLIKkAuhBWxYZWUWoYPLYmZ1Ur/2zuWNZ15cCM5dq7xy6Wbr9dMne/pMrMZ0LFJWeioNCJooZPMYP3YaPeOHcW1uA6+89RwWl1Yh2Xb8rrf4OPlHx7Ht9Omlwt6NKA4qjtslEbCjlCIGbctnrL3j8L1zGkTbI0qdUJG2v5BEO87eagLWrQmXHdcfA1G91qhPAmgwM4rFou84Tua29JPk+4O1vuf7bKwhoBqbpuu4Tn/ImAfQxLau+a+hYKXmpBsLC/HSzFk90ncfnNHPobr+5/CxjqwNgHAE7C6lXG2JXDbJqAtDYHWrhdj2QhsDshrgCCALZSvOrkHndO/4+EO+lF2eKhaiMIKFThJBaJt9vfPFTEaFyQWvlMLKygp+57d/G4uLi/S5z36ShQCH9bpQSnpDQz34x//jf8d//B+/Rk/98CWUursxM3WFTb2Mn/mpX+To0ZP0G199prq4uPyn7757UfzK3/ulf2KsxsZG9eyRcX4gWPh+3s2MssweQnO9F9YuIasqCXCvTZWkGCR00k0hSo6FOoYOW2jVq2i16giDAEEYIIx0R2mcqqSS//YWqmbq7eOEoCRIdsSRaR1KbiALsE3ILcycYHFlekEi2ei0GVUSgEMKwjLisIk43ASaN+HnHUDsSpJX4MLAA8OHdDyIXAEiW0xzJ6uwtSlQ4waiylWsLl3GxsYWVje3sFmPUAk0ak2DMPDQiCQaYRKcEOkEqRIZRhgnxacdspqs2ZMymRwHBRKyS/pDpnwqSi0XUgCCLWANBGJIGSFfcDAyPIqJXQfRP3gAInsaEF1gpwA4WWhhYWUMqU2i+oYL22KmaA3SnKd6+T1+79Js5Vsvz77y1efnLvqlkbsLxf7KaHF1HNaOaKOhjYZ0JVpBCBYSu/Ydx+6J46gaB995/j1cvDIFG8fIOIlsZGfoRrIMSLVbt9msbvEBMnceysYYa62dE9Yut7VfUsokW9LsnF/dFi6bPswSpLdIr4Nt76mxJoUnJkwra+0as30L4KZyVMNaUBybRvr0guu6I4mEZgdDB+25LHtSOqNgZARxNY7CcjbjCutkNwFE/0Wn7T/B0J2IiFuRWdTRylJr/Y39tmscXbs+g8bCeRizCDIhhI0hiOAqgVwuwVlUaiG2ahGsdCEkwRESsSVYG6M3H9An7x04ky+O/A/zC+HC6MCYEp7m6dnrBBtBCKdjIbiFE74zwj2tG5Gx+LM//09YmJ+hL3/5yxgeG4EJ6tBBEyQZP/fzv4ixPYf4j/7ojzA6NEjRpmWurlDcbGytra+t7d6911la2nhlbm75rVzePS0cz2utXfVMxRFodMMtfoyKAyfR2BJoxg1kOE66KBECCGHjEMwG9cYKKuUymo0IjVoLQSsB8MXGwFiT0BdJpORJASZAyiDBgchbM/VUqi8C4g5QD2mLT5BJsAFRMgvq/D5EexeQIFTS+RCzB22TroUjDWpsAYrhOC6kXwKjC4ZzIKcbws9B5XOAmwXrAKY+A1udhK5eRGv9MlZXprBcrqJcEag1XNRjiVpYR2iSgE/LIqVNJInPzATDGjYlhlpOCzAhme+AOqv95KGcHP2Soi6TPRahM/8TiJHPSvQP92Bk9y6MjZ1ELncU4BGwOwZyBCAZhjVgXUiTAUQdrBkII4a+hmZ4Hgs3puMfvnJ59asvT/3ZD97c+IOJkWMD3RnvoThY9dgRXUJxj0XMGhaNIESpdxiHDh+HkxvCG1eW8Na751CuNOA5EnlfQbJB1P55dhIxPuDmpR3YAiklCvk8tDEol8vMzHFMsbZWb0pwRZDoNqlolG+Tz3SKYMqO53YCNCxIMKRMbTkpNYJt0ghYi5CZZwUw4jreUBjr9cggaH+7uVwuD6D4PkCkEGBYVwixh0jsldZsmqhVpULGKdeaUVvL/Nc4dO88DTaCSnUjJzzenD+PoOdTyOdOg3gDcOowNg9H5iFlA74v4KokHmur2kDEFgoGZNIoeMQoulV8/tHhbMZbu/8tgerU1Hk1tHcch48dxs3L89wKYwg3kbztfCoRJdjV9nyr7WAXQuDNt89hcXEVX/nK38CpM6cAE0KHDbQq6/zwg/eThGj977/+/60O95S6/vzZN9XsjetT584vXhsYGi8C2FpZXnt+//7dJ3JZf9fCXLOpwyjUwbtZYetMmU3KdR2CLo+B4jmQaiFuLKBe20CzEWJlpYz5pQ1U600YC4SawaRgmNKLKEm+bethlFCQgqCUSYWPEkImIr8kBSZJP0n0RGl3JQiCBKRQO4bViTgSbCGk2s4WTDsXQQSWSa/ikoAyBhYajBrILiHbm4P09kNxH8gvAYUctIwg6tfAlWlElWtobl7DxsoMNtY3UWlqlJuEWjNCbAy0lRDsQFqRaKWEAQtOn/aJ2tyyhaFk7tKG3bVnOG34IRMl21Nh09mfTD+edFpGN+E5FoO9WUyMj2No7AgK/Ych/T2wzgigCulWz4KhkoBSFmDNYI5BdgE2uIrl9XfxyrsXzXd/sLbx1nV9Y0v7z//y3b/8zgubLz9ORnrWSIa0rBzBjXoVUuVw7PA9GBw7grnlTbz60quYurkIQUDWcyAEYEjCsILW8ftM0R1I4E5yBiejDkkCUgkuFApgBlpBkAhgrYUjnR5mMoJojYToYthEl/xjepc2qBBoM/OT+ZgxJlHhd/ylaAkpXNYYdBzXj61dqtfrs+0a6rpul5TSuxMQgS0L6TjGWtMQQpSNCY0DX2xullfwX+lN/SSftLxUJughlMIGgpVnEWf3olaZQzEzCqXykErBdSUyvgPXS5TH5WoLxiSHDmsNoDXgMBFrlvE8f+qBfjnQHfY8fy7my7NzCOoGBw8exdSNy1Rt1liQC+V41JY8aGM6kVnbiJRUOCI9LCxv4N/9xm/h059+DI9/6uNwvRyzrSEor5vXX3nt0rtnL8wOP/HYR1+9eim4emnm4rGTZ7o3NsoFAM1KfeuGtqNhIee5AYrTzG6dGlvZyL4LFTUhgyW4ThFwGqhuLGFj9QasrWNrs4nF+TrWqkCoBQwsImuhESPSOkH9cnJMMBYgyKTLIoLTDn1I5wtJsZKdmCYhBYRIbm6lZOfoIFJImxQEQYDqzCxEykFiqHZUeWrl8aUDR1g4gYUXCLSaGyjEFl29DpTvAK0AHAmEcRVUvYpwawoba9PY3FhGpW6w1ZRoBApBxCkCT8PYGGRdSOsA0OnmND2OtuHidpvOyrApnmU7uIw6SnLq+FfbZD82BkQBurs9jAwOYc/ucQyPHIT0j4G9vWBZAik/OTyaEFYYWGIIKyDjGlN0E2QXUKtO0YXLF/Htpy8HL5xtxJsql/UHe/f2l83B33j7N5xdR0ZaeS8TR03HzyKTlcIRA4P7aWD3CcQiix+8eB7nL0+hFQZwPZluzCwAidiKROjMdAeIIsFSQoqQKXMrjSCEn89BuTkEjRpajaq1zERCBJHWKznPKwhhDklli0ISIg2YzmBou29rY2Y6XRclvsLt5G6ChYW2Jn14JvNOYvJhuIeIssr3uNEy9WazWUubE9911T4APe9LY0q2kXkl3G6r4zo5cp6YpJRuoRra+m2hW3+tBSucW97agmIt3Yzy4w0mvUTPPPMa7rvnpzBxYAAUBFBSIOd7yHiJr61cjREFFlnFiHUMqRsQ1AtNeVLcBAebfP9BjwcKCt9/nfHm5FL4XrW8/MnHHiy+/fbZ7pXVCgR5YCJIJQE2HfTs9rk/pUmmWI1GK8Cffv3PML+4iJ/+8pcw0D9IZ197Zflf/evfOPvgh+4a+/m/+US2Xv9E+M/+6T/v7+4tTUQaFwGwodBajth3s7oeRw3SZZM1PlqBgYnnYJpzCFwXW1UHk1dX4LmE3n6FfCGPwcEi8l0hwjhEbCyCWCPSFtpaGG1hYotWGKMVGoSxQaxtYkQ13JkNdIB6KSKk/bKLVHsqkHRcAu0ZBbaLlCA4KS4GnHCfpEqesA4ATygoJ4ajEkyK52v4Xoh8JUBPJUJ36QYcN8HhNOtNlMtL2CpXUK6FqLYsmrFEKwIMJ9tPQKVHvsSIzaQTRrplsE2OZMwEm9JUhU2OsTY17hJTx3+ZuBtE+qcEWCXkBQ1IwSjlFcbHBnHixIeQ670H8I/Aigwgc8nqysQAJ1KYpNmMYMI15mgWun6NFheu2h++eoW/88os3Vh3hcruUj35bNbamDd5zQCQGZsdYkbOUNwtlRnK9/TLvccf47eurtFrbz+LzbUqHMeFn3EhhOrMqdgyYONEcLGjcNzioSOAbGrSFgTH85DJZRCBeL28RqpZr+igNU1edhdLaWKyNzOy4EuYvUJE/dIB4tBCIzlai/RUsTNMhLDjmqFkvNAmTbBIHqCGKDX2GAjGiLXigJDKSjdrg0qlnGyJEpW76/o5IlKcvLU3nERWsiO8HihTDHREhuNrUjhZsOdFtZr5v0mHxQBQnl8rT7Y0tTxlizaK2ck4KOSKePud85g4+llYmxhyXYfgewkMr1aPEWuCcBL/HKfDYKkUTMCQJAitGvYNKf6ZJ7qo++2w/k//f0893dPVs/ujH/vEx8+ee09M3riRnCO0gpAK1m7HSbWDC6w1YDawaZCIlAovvvwyVtdW8YXPfy7+wz/400kA2c9//om79o2Pu4NDg72H9u575Ld+9w/0/OyyBYCgHsDaBORWrdfBSFbSifKe0YojbG5VMTXTxMJsBeNjwyjmhtDTV4SJFIJGMmCPdIxWGEGbZO6gTXJMiGKLejNErdFCoxmi3gzQCC3CWCOIIsTawKQ8JcsEaxOtkLFp2CUSu5Job4xYdJJYKD0+tq0qbXOukAKSAUcmH3ckoATD8xR8T8Jzt5Bb3kI+m4HrJnOusBWg2YqgDSeSBI1E2c2p8TUdhrdZ5LRzrpief6xJMws/KKMQtwaX0g7TbkJiUhDKAUkLAwe1lkA9YOTze8D5gxB6FdAhjFbQjga8AKQ1VM1l1ViDid/F4uZ1vP7eXOu7L0yW37u+THBLffnBIZfgsLIRrNWbxuA6AE1SjUuSiKNwLuM4A4CiJ5/6Ab91dRksQ/h+BhACJLYBiDtzGH8UkcC1CSqIfAWvkIUULqr1EEF5A32ZTTgFXj07XX25d9eBrFBRCUEgJHn92rQanuIWMxWMNrxzCdX+sxNRltodRKpyFwRImeD5ktci9bu1dWDMRjBiVzlSEAVxbKYAbLVLrJRS7OgWO+0bg6GUkiY2QpA1FjpgxQ3NegNAue33/+ssWG3dWHzhwszaZjVsjRZUUbc0oDUGh3rw1FM3wTFBuTkQVeArgayXzGNqTYtqI8aA3yYjWjAMhEiOTowyXJWBaYXo8yv40mMfcn7w8nLjhedfXfY8zxw5tl92dWf5vXMXKI5MEicOvuUJk3QmEsZwpw1my3CVx1NT0/R//cvfqL/03Kv1n/vZr5y498zd/cVcnuNGTezd1Z//e3/3v2lNXptzAcggDS11PB+VWhPaAkIqSKUBkxy7PM9BseCiUfLgOmnRJAMnS/CFBPsOYkMwOp09pVAYZpFauZLCo7VBEBnUQ4NmK0AjCNEIIjTDCM1mAB0RWq0YQazRCjViA4SxgTEWxjCMRRqhJKENw9ok5NVwkp/YTlVJ5Q0dzrdMt0mOVHAVwXc0PLeJbNaF7wo4Kpl/hUaBhIs4Nolgk0RyFCe7bQhOZXrtI1xbB8kpMDDZSLX1Y7a987utZKHTHSdFNj0vpT9DPYxRX4lxY6GC6zdDPBz34+RDRTB1I2lOQzjWha0qUDTDiKdRrlzBletXzfdeudb84dvzta1w0GS6jmUdT5KxMQTHbUhyTGSbAKwkKQVRM2w1p7qGcrvWN6p8/uI8pNsD5VmwMUlYCBuQ7cgPOgXjR74Jhp8pwMl3o9lqotVYh4i2cLAEfP7jhyEKrjd57bV+JTO+QTO2WhuhPM9q0xCuiJkZsTZEJAGyuDOwgbe3zOmIIZF+MGIm2NRKxIk8Yw3gt40N33C84qPasGo2o0YbN+L7fpcQYoyInNtpCx3YtDVrUqKqjbnuus5SpNHYwdHi/zvMsMzkzZWVlbVKZSQrB4Ekh62rqwtRNIOwpeEIF0JIZDxCISMhBVBtxqjWYsgBBzoOwUbDJB4fCHKS8zUpQBroZg1OJnD7cn25ra3z1fX1lfCtNzfcBx+6H48+8ijeeOMsqtV6inRhOI7TCe9si/J4h+MdlqEcB7VqYEg4mdiGfUpJyua7OWxuUate5YH+Lmd0ZHgPgB5h9ZYQcl1K2GYQUmwFNCy0iSFZgsDwHIGRoRw8xSgWC8jmPISRgZIMqeNUtMdQIkkiYWOTbV/aESaxXklYgesCRQdAQcJSHoYJhgnaWDAr6JgR60TJ3gwNgjBGM4zQimPUGwFagUYQWQShRqwtwggINSGKDbRJVM1RbBCbJFoqweNSYr4mDUcqOMLCcwmFrIHvMXyX4DoEKwhCAcQCkkQyxE+H6O3cwHaxaiNPEpeaBFt7y+r+zpKc2zddnToIaw3CmGBMC9aEaDYirG028dq5VVy6sYi/bzSOf+wXAJEFtQDUV1lVl2HCCzS1epGffedi8N3nF1ZnllSQ6xof7M935xlKso2T46sgsnCg2UBr3Q5DTLGscdZTmVLMTNL1GI4DEjHIUqdT5lTMvJODv931bI9vrLXwPQ+5YgEWDmqbDej6FvrdTTx0OoeHTu2hoT7CYlDr29XvPLwZ6x6QPB9H4VzeK5wWUuyVUuakSBR5qQspOfYCt4TPChIJPBJIpB8k0i0zw2gLrZMNY7JX5jliPGMsO67je5KkiSJt282JlLIkpRxJ64JNk3KSSI0kqYeZ9TIJbJrIVpic+Y1ydQNA/F+ju/qxBSsVINq5cqtW2awFZlcXmk0D12PkMlk0WhGqjRYGin6SziIMcr4DKRQizag14hSED8Q6grIMqSRiDQgUYByGRZ1cYzmurqjT+zMnKvp4VbpMURzhh8++RMdPnMCjjzyEt95+G4uLy51tSluflYQYJDePtZzwooRIPV8S0pXy6vUr9O9+87fw3//3/wj9w2PU2rxpiY3q7SkNAMg3GvEKES8q1yluletbxoKJFLRtQlI6+AZQ8gmZkSxIShT7hgDjJ9lzfhVGB5BaAzZKYsF0BGvjVBSKBIBmLSylmiKTKL9FO3zTWLhEEFLCugB5DrqyBIYLQVkYBjRbaMuIDSGINMLIIog0WoFGsxWh0QrRCkxii2mFaEUWzcii1dJoBImYM9QWUWwhhUKoNYwl5KyC5QRTRsqCZBrDpdLLPL1jku422WbqdPPUPta1bTRt7tK2wffHX8lJyKiF1gZSqXTDSIg5i2ZM2GpV+M13Zyn657+N/7E0wPtP3Q1b24JpzGB94z1+5+KF+Nsv3JCvX4107A6LbH++V0lTtKyTSE8LSAiyRGwF0rRtw93d3b6A6BaCFBkbKYUgZs2kFEiKNHjUSbrkNlT4TjjxdJHAFhBSoFAowPM8tFo1NCrLyNgGTuzy8Il79uH4hIcsQgStOg/ks5nTR3v9Z89WhXDzW0EcrQsHIYz1lVKuNgYmTnISYGwSXrsjc3JnhyU62+TtCDprLYxmEGS6RRRVEjzDFqd8z+1h0FbYiufbHVahUPCklN4tcqJ2xCRbklK2Yh2tOI4UQrqYWy5fXVtbW21ruP7aC1aKDu564oFT9+4a2zMgPQmSi6g3N1EoDkIpoFyuYqAvgzCMYRnIZVx4SqIaxEnUts3DJN5wsNWAICgl4QqDho1BNpcC09bVJx727j5w/4f49XNNdfXqTdZG0flzl1CpVHHfPXfj4uWrmJycQhTHkGnaSvJE4w7Hum1zkVJCSMFsbctYE2xWKnj1lbd4eLjHHDo0JPKeRFepAABoNpsxMwvPcyemliurUaxb5IodMDSCJICthqcAlgYmiCEz44DJwAgXwgtAJgJ0CJgY0hrAhmAbgdmArQHYJPRPthAm7bysgbRpbJg1MEh0TQSdYnkNmEMoS8iQBBwJeBL///b+M0yS7LoORdfe50REmsry7c34wRgAMwMPwhIQQSeKkkjgkrKPMhQlUZT07nuS3qVEihLlvquP90rv6Rp+V7wyFA2GohNFggQI74EBxvaY9t1V3eWz0kfEOWfv9+NEZmX1NAYDQ3BI1plvvpnuMpmVlbFi77XXXktnamCboDLwhQ9SxZ8D/WGJUV5iq5Njt19gc6uP7b5HZxiwtVtglMcADTWoVOWhuijjXRwIcZcvmOhsQJhowVQxGXboPm4FE/cE0a+wO6A9TgtKIBOJeCcGw5LhNAU1uHjkwvnw0//mp2p/94f+B6olOZ6+dF4/8PEny/d9rjPqj9Jma/5Us54mTSJhEauOoSAlE0zlyiBgOBBK8h5IRRYgdAcC1UUE9TQtFKQBQqo+AnSIk1EQ32BBjYlRnoQo5ag362g2G/DOY6fdhhl2cXquwFteexivf/kMFjMHGY3gwLAm3mBf9+Ct+Nyzl7DjLJWsiZJ0iXQlMeYQABMqgn9iHvglSMGxlIGmLJwVHG8gAEIIEkLYoVLPeEE9q9XqqmgPer3VCrA4TdPTRHSoqiL3pfQws5ZlcXY4GD67tLhwT7vfub65uXllbPr3+w5YsbqCnjjcuucf/qMf+c477n/g8Gj9ojSPF9TrPYP11Q6ure9iczvg7lccwae/eA3boYGFuSYauoYdAbbaOYjmQMbAEiDFFlJzDKtDwmBY4OhRIA0jKKdgk6OlLjlFZ1C/+4gea92FTz55Fb28xNVLVzDYGeBVr3sAh5eX8blHHkFRFtGemAhgM+6wJx5JogIWlQTmSpH7+WOHj97y4Q/8tv/wJz6x+ce/91uz/+cP/ZnlxbnFvb5XS85qnO125TokuU4o7+AQhXheEgwxAAhIYWHcLmT4dATI2ssBfxoSdkDJLoC0IpVzwNZBrHFSJAEivtpLFJB4kAYYCVD1gPiYdyg27o4hVKZtUVCpqHyboGCTRh8nm8CaBIFaaFgDQw6kHloUGPUG2J4dYaubY65hMLOTY60do6/aHOPRmRTGclzhIK7232pINMCgAAcGSx1iPZTKiZVO1BTp3g5kteS7N61S3ETn+HyaYyJl2Et9IcqrBJoMI5dj6PrKJqVA3E8alH/skeeOFP/uF83hk0fwuScvu4vXypGdOV6fO1y3UUMpEIESKVg1SsAoTAYGhi2gvuvUdZO0ZcGmEUCZNXQfAXcGbVBeboItV15ZHix7ScuAiTcS0kqqATRMHdnsDHxG2B3uwvd20FTBG+7x+JY3nsTJwzMg10YSFJIaiHiQgPJckGSKRpN0Y2ensJrNGbUnKISQGCtEwQo8KDBYIidKU1WVqgDVpJhUYKBgxFARYcbICYqgAByMMnkyc5KhRlIGYuVenpeDEIrxhLBery8T8dyNK0QAKEi4sr699WsAZwrD16+vjx1KvxEC9y8PWBFgFfe9/PZjR44snQxgNs0lkbBIc/N3oddbxf333YEjy0cBDbDJDB57bA3f/R2vgU2eg2dGp1fEqRcU6kuoAPVZi2eeu45f+tVz+Kc/9h2oZ9vwI0NGY5jF0aSHGQJlpz3qjSP4zONb2Nj12Orv4oMf/SBe++rX4B1vfRM+8+nPotPpI5CFyWhSAYzjkKAaJ/BWumrN4OLVVTXB7L7iwQc7v/Erv93avrwjt991CydNGDcA8l5AzVj1gp4ohgSC5QSWE2iwKAYO/aEiqzexODeLvByA/TnURGFqp6EyCxk2YZIR1LYhIQc0qaxqY6ILk68YUA/lsZcWA8KARK4swFdVeGxFUCncAQZMAsMJ2NRhuQ6yDcAkSKQEpESZ9zEaDNHb7aG328XuoMBOv8Bur8Buv0R3kMP5ABBHDtDcxE9JHQjRCoeipgJgqexeDLRS1U9iyGjMQ+m+TY4vF604HpLQ2HSOqXLMrJTdwhjmBZx3pGwVyjNBk4YxzKvbJc6vr6LnZ83soYU6UUgBpTgp5klwB41nqTQlQAYrE18JxeAaZy3LTKKKvgTfSZOUJTDFu4zuLS0TYrqyVsMj9lAJYMuoN2vI6gmKkWC0VsLkXbzs8BBvf/0yXnP/YdTJgV0PacX5iQIBjN6IsLHbx8X1NpwXRwgXWM2ISY9ZQ7OJsRSCxEmxjm2LvjT408RVYR8VPzHgk3hn6cMrLMMmSS3vjYoro9Foc8w5JkntpoG8IuIGg+FHNja2PnXbqRM/qCq2LMsufh/Ol9slpMceeRrB5yg7l2HTJqk/DF+WOHUqxf/r/30PfH4SkItYXl5APljFkcO3wNYAYcH27giFj6UaVcpvKXM89OC9+I3fuYz3/84VfP/3vByj0XmIjzyIy3cxm3qk2QipLmLhdafx6TNtPHN1E3lgfOJTn8H9d9+Fb/nmd+CRxx7H+csrUB/TSVDtqxlj48iZTcIpLzqXZ7XmTP7IZ77w6TtPNevf/Lq73/zoU1foucvnZu6649jclQu9NZ+TzrXq0aKi9NAmQ4LGNs0D1iTo9kp89ENnUG8u4h3fdAonFkvku4/DNraR1u6HMSeil5RNILYGBKnskwMY4/+PLWGVbRJbKUogHC95YQLIVG6fGdjUwSYDmxQwttrwCvF3Ug6R7/bR73Sxu9tBpzvAbrePTr/AcFSiN3Toj0oMhg6jUpE7IK+8nSoHl/3hmqowVAJk1GsNgVJY5qheUECksq7UyppYqGoTw4Sr+0oOVWtGkwX3aq0HajDIS/SGOSaoKsjYMoI4zRoz8HmCWjpjRiExKh7GcvX8bkbwT00jI48snbKQ5aQFZlYydGlYhDNZPXlr3Fs1lcg3jjyjS0K1+ESCoB61eh2NRgtBgd1eG9Jt42ji8JbXLuNtrzmF5bkBRPsgZZB6BCiCMAqv2OkVWF1z2OoMdLesUQjsVO0WEhpA/TKpngDYBFGN2tuqYn0B9RFVYmHal0XoEWRiLEkQpMJyb8rJG61Ns9K5LQBj4OEksem0Ra6IKMf1icI797RR7TObJV+6Fefc+ksKsMa7hBudcnvz2urOHYdvua3TvoJG/SiUFuFlFRY1ECygCZqtOlQFljI0GhmC9NEZFBg5QpZYGBYoCUJRoNYg/IUfeDOOLL0corsAlyAYBJ9AKAf5EVIlnGhsopEWmHvgOJYaJ/Gp87sIkuOJp86jOyzwitc+iGShgWeeeArexQBJYyyImCR4ENlmqtkdVIQZo07EdzdeeVur9eC9xgol1C+PHH7u2e2X9fvXLwR2mz6pnfBAI3I8kej04gFRsFGglmFjlOJDH3ga51eu4/u+7S7cebSGUFxHrTFEvbWCpH4chDoIKRQ7UOljHM8eAauSB0i9ajNMla1nQGxgTQbmCpxMFGSGIBgVPeRFG4PeCJ3OAN3OEP3eCJ3dHnrDAfqjHMNcMCgCcidRIR0AHwDno7Sg9IDzGh8TlU+48J6ApiKrfKjBoUWj0gUNg3Bo1lprQQqPsUFoHO/TlH0K7bvZ6Vjtvv8GeINLwQ1EdrVHSGQxHOUonIDYIj6EAupVqCAYQiAL5wGBAzFNOLRpuQFN2RCPNWrMzNbaE3Np45iq7oBVNPg8YRyyhpfygAiaGFfrcbUowCFwAFuLmeYCUluDG3kMu11kuon7ThHe+bolvPK2BlLpAT4Ds4OSgygh9wbDEljb6uD6zgibuylEE5SawkkBEUcJsMSsi6yoMZi8czFMQ2807NtPvO8F78b2fjxF9D5MJpgSlBQ4okHvTerJm41Jjrhy5KfKtDlDdJcxphFCmIhG4wK2+LIsc2stWTZUlnkPwPBGB4qXAukOVb3uRv3rVG7rTJYjH11HbXYB4pdResDYGSAsYLZVRwhd5P0eFmbmYbiP3iBH7hiNWgrx/ah49jmUPA7NEo4v7yDfXYWGDEIp2JQgm0FCBpUUKfUwZ3aR1Qqkd92OZOYIHn3yPHbJ4PK1dWz1PooHH7oXi9/0Bjzy+UcxHA7je144qpKJLRvbkMIZX3pbS+3J0L1Ob7n3BJpNwW998NrhV9179M/ddsfy4qjcPZE0lo9am97S7gwNTkYS2nC0+A3BwZgUsAmSmQZ2RjU89uw2KMxjaTFDiSvo5ZfRqN+GmdbLkDTn4kJvmUPZRudJSkDGQohh0zrYxD+DLWASIAhUChTlAIN2D/1BH4NBH53uLtq7PfS7DoNRjt4wTgNHhYsWLiGNXuOBEMREmxgJVSYGQWDjMnIVXxVVtvq8QIOomjIIaCFtne488/TTZ1bOP1n71jfdf/98K0lLdVMSEtpfKd2Mo3rRlRbttYhgOCcYDEsEYSgzUK0asiqUgzKPxbUECSOwMpQNjUFp//fEnqC2Aq40TU40m63b+v3RCKKJcCAysDY1LEFBVEXYU+WPDkBZkDZTzDTnoU4waq9D810crnu841UzeMtr7sRcNgSHHkAGYuLENARC4ROs7Yyw1s6x3XXaLSy2OgFlOdS5Qwsk6uBCiKQ35FbLlBo2KkKsY3ePF2CKxlmDY4BhZnjxUFFIUFWZeOUyFGw4TQAe+SJcATBSVczW66cTm7xSRGoA1BjDGmNzEELYLctyrZGmRwzbGVXdmfLPeukAVnVG62vXdqEzIeRbpt64Rct8l0z9MMQrQhlgMINDh2fw1rffilrCWJxZhtUVFMMcg5FHqw6Q80gyA9WA1AKm3MX6xS00krmo0G204UMd7BpgeKgO4b2CjUWj3seR5Dxelx3F4dlT+NgTu7i6USDvFPjiRz+LV7z6QbztbW/G5z//BWxt7iAEh8QAlAY1GSMvcnhkxmSLs4POquN+T1+7TDj+ncfS9z++86brw+P3Lx17Zfboo4/3Zxppq3SOFNmU82zcB6sJo2USJBJDUynN0CsD0Oug6TMYWAy6K2i3N1FrLmB5bgE2CMoQUJs9BLUtkK0D1gIYQYJHkRfIB22Men10Ox30RgPs7HbR7w3R6+XoDxyK3GFUAsPcoPCCQhWjIMiDwago4UoPCbESIBXUawZJGpXtZuJKssc9TRuH3NhBFfCw9bp85PNPrXz2sccvfvNrj9+T1thIKJSIaK+10r3E4Yn6W75q9nVaROpyj2FeRssZjdbTpAYcVMQwmC2rGLBJEHwXgIW1yVjoTNPgNFHUj/+OCGST+cbs3F3DYVEaY4+KlDsiuFKrpe3tXX+MySAIVKP1KSWJRaPRBCcWw90CRW8X82kbr7w3xVtfexp3HjNg6UKCByOLsgzJ4QLQHThc22pjddujnVv0RgYjgT5z+Uq5ND9jEufZB4F4QWJqiWheJ1ZiJpWglX5OQDfRsO05KeztEE7awsnvpGqJFaqg4EU4yzJAMBiO8hVE473Z06dve2NaS++sor20KlZUREhVd4uiWKultTvAsEWenwMwHFtQvYQASwGg8+SZZ8999x+7bcSh3Sq6O1qbuQv5aB6mfhvCTA3BX4MfZPjOb74L8DkCcmScoZcD3aHHrUuMnAwKAuCGaDRnomWtxrIYXKAoS0hIYNWAbIiTHSVALACPhm3jBOeozR/F7KtP4ZOPd/Ds6g4KquNTn/0s7rzjTrzm1a/DuXPP4sLFi3DewLCALMMXcXKXpGnadUaGIyEj6zg6v4h3v2nefubRneUnLn+aFHY4Mz9jS5cyyMJSgKe4apS6GqwCzSwg2IBCShgZgEmRIgVGdZQCON6Bljvorl0HhwZq2QwCZbjlFOP4sTpC0UOv38fuYA3tdhc77QE6nRzd3gj9wRD9PMTdvcAYFYrCMQqXoHQOw3KAPAdGOaEUwqh0KH0BsIcFIyHCQitBmlmklFS7Zjp5s9MEtKjy9NovKQhBMDe3hJEvaN7uHvsHf+XblzPuzVPeYQ0AGRNz9MYVlsbQkInZ4ljZP259v+x7Waulkr1w0ECMkQ9wvmo3qu8lBHhPQ8MJgbgZiMmjDMVIdrNMM2ZujsXEU+3f8yosilGi2UyjcbJtki4T5rQsTGaxSGSb4lJAhiqaM7FBvdnUZq2BomQatPtIimu4e7nAu153Eg/ds4iaKQDnqkrMQzS23mUBXO+WuLI1RGeg6I8s+qOghQi1BzK4ura9ddvpxeUiR+IVw0LdsG6TOQ4uZRaAiEQjS8/VXmZFZNF402Bc2rKaqG5nnXC5QU0MAImWP6SQa1C6CpFWVq85JROcyxWAPXLkxFuWDh/6fst8JCAi1vQvL4RQOufyejYzJGi/KPLhN1J79ZWu5gx/9f1fePYH/tw7Nm+ZNS2Um+q7n6d0xkHNErJDd8F3SliziKL3RVzbXIFNctRSwsAJugOPRC1GnMBDkIiDikd9Zg5rK2vAXKxebJiFsQJBDhcMsrQGy1qJEQHxgpSGWE43kHBA9qrDaMwt4AvndiBax/mzlzHsjfDKB16BVquJp585B1/mRJo0QFlqNZgspdr2YFh2c5XHn+ljZlnDA3db+pZXtWi2MaT2E92a76zfVuZ+3nCGMpQIJq1U2AwYgTElnCGUaoDAINMAGQGbIVKbQPIMW21CbxiFs6vrl9EvHE4cXsPLTh+FEYfNnTY6wxEGQ4/eiDAsDXLHyH2AC4zhqKxU7h6Fj0MA53ysamChEiePxgpmaoBJG6DAsEpoNBhpuhfzNNbpqE4n+4wFV7qviSNE54EkdOmvvudti7OtOj72sQ/DGo5Gq2NfpqmWcKx6ryZw2Le9/WIEWFUc6lhn5EJAESRyWRom/vkxedhkljOAoB6evOrucDh6X5LYW1XljSaaQO2rqG7gsqLcTUJKituMyTYNUa7q2vUEi1DbLH1AgA+jorcxWz9kGrXW4m5ni33Zx1wywhte1cS3vOoUTi8YqO9CxcJU8g6ReCNpDwJW17u4slOg4zIMc0ZZFEDwaM42sLrR6/lCthsZL3eHgIduj1y5NptmrzcIM8aSqiX1Eio/eBaJvvA8nuZGuIpmj3EI6qsVJ4USNCjDS4wTC1AElQ0iXICGopY1dgoX5iKcp3fecutt32+T9CGGNzH0I9rSVCZ+ZQjhbJ7nm0eWzctBNJCi2MLv03kRSncKj1/ufuHjn37yc7d+2+JJuJAweprvfJy46IKkgDEZ1HvUqYYMHq1GCmtK5Llgt1dAuQFCgZQZrASfjzDTaMAaoN/rodlogBKOu2uVbUxQgbgwcU5kSsCUwdoBZmsDaNbFW+45gSP1eXz66Ry7gxLXV9fQ6w7w0KtegfvuvU2vraxyu2NPZ2mTRAOlWWPU3xleKXx274e+6JNPn3ls+7v+2K3J97z9zoVX3beox07MNBf5ZW9Ynu3V1ZOS2BgqQR4eDrAWjXqCBinIEdY2Al77lm/C8dNHcO3ih+GLVWRJDYdahxCKDnbyAts7rM9dbuPcpSFdujbSLAWcF+oXhKJQjHKJwOQEozyfhHRGD6O4DGzYIksslOIqUGpj6W85g2ELYUVZKMQFBB2vYnwFxfp47YQs+t01WlqaR7uzro8/dQVqBGLH8wIzARqddtSstg72LqYX3yVMMpUrbZcPrlquvokVMFPChsAcAVRC2Bh0+787NzfzRiJ+ffTEM1XrSs/b94tEtIdzTlVlREReoUMfZMsa8krIh9KHI9nuDcJ/KIpekwr3Fyx15u47nuu7Xnec7rvtOGqhD/UOYkzUrjmH0itGjrCxk2N1c4R2X5D7DKM8unTUE4tmqwaTWQ0uN0nC89amSek88qLEMB+2zExrvgwhiLE2EHPhAgI0F/XnAFoA6MTY6GVsr82GAPaVnSMhKNRL0BACAogCsQpCEFbPoI3gsZ7Wa2/wQjQsyvl77rnzu1ut1jtIfU0VGqbWqwB0yrL89Pb29i91u92dxJikLPInNrqDc98oO5mvlMOqqqw7L/+7f/+bH/rmV33HW4/P0jE/cJIK4NyTlOcrsNkp1OwuAgUQWa016kitJedK3e4MQHyEFCVcWSATGxOvIJidnUGvO8BwOEStnoE4i3dxilu0KrrnecUMUQ+SABNyzBvCbDPB3Kk66nPH8OnHd7G6phi6Us+cO4PN9R7ddfpW3PeymdaVlXVlZiRpOuqXtOKAUdKghYE32S/+98vEuei7v+UYHVpm+4Pf97IjJgh8vqWG0uruL4BVKIkaDjAIIDEYDA1aR16Jpfu/mWbqR7Gz8n70N89DpIujRwxKZLi6U8KxwcZmkQ/CkOv1WjIsHfrDgKKMqxeiUR5AlYCTDCFJCAkzDAlSG725U2NhjEOSBGTMSAyjLAM6wcETV5kVMZ2G9EYy/MtiFqCKzBqM+j2c73TIJFkMHJUqNYW1agErtwKYySrIV3toir/ClM2w7g9boL11kfhoQQSlc1d3Ortnlw4vvmx2lhwzm+mWcNwOigi89/DeI8ZcoQhBL6rKFsfMwFaSZU2AGuoFJLbrivBxM+wsHDkavvfNr12e+6YHZrFcK2HcDlKNHJEXhYNg5Ak73QLXNodYb3sMfQ2DwsIXHgKDmWYNrQywJPAikg/6G9ZYGGtNUZY4fuLk0bkjS3+23Gn7vOOf8Jrckzu1/SJsBqUNVf0igFujab8ugClTVdKgumfawPAw6oVJg+FRKcEFulgGPec1XCND50LAuaxuT4vwqYIoac7Ov3pxcf4VzHIkONGYTiSkqh7Axd3d3d84f/78w71e7zEA5eVr1z4oIh/N8/z6N2rZ+Ssm3WPJf7749Fn9zH/6rxc/+cN/6eXfkZrrtQwpDJw6v0J5cR3OC7bbA2wWMygAFVghddTp9MkHV1m/MMgDITiEYoBaZhEaNYyGBYbDAkGAWi2BV0Hwld93ZZMR1CFQgIGFxQK8C7BmF4dnurit5lB77Ul84alMn1ldRXd36Op2UZ57+mx6+rZDuPP2W7C9uQUia0aeDEA6lwXUU54TTrDrCgxKQDdKajTWda5lEaIRcbSfVYUhAwOJJmyGNS8KfNcf/z46dWgR1x/9j1isHcWx438Co8ajWF35JIa9Lhp14I47GrjeX9bNx9fd2ubAGOsTr1A2TADDWoPEMhJWEAsMCYwBLAGZJSQsaGSEZoOwOG8wPzeDubk65lstLM0v4dHHn8YnnlqHcwkCRd4CkxatsoARmbKDEdwIMZMWiuOUkdnA2rFZogErV1ySm/BgVFnvjOdPE+cG6JS0YWopXXWPPwNNiU95SupAU4C1XwU/trKx1lT3dQ3e+fU8768Mh4MzwPI2EZ1kZuF4lxt7pcM5D+/d9M8rIWheVVjkvavVbHKCwC14AovRRMmy78x904N3J3/8TbMgvwWVFNYYqA8QDwQBBrnD1W7Ata0BOgNBv7QY5g5CBgkT5pp1ZBnD6BCkQs4bdaXkWWqssYZm52YV9sis21x9tQN+My/D+4YObx5utPvdvvtYatItDeVAmWeNkZMAvZqUXgbiw0p6iw+a5Q5gQ4bThKhIXMjR2doZXdntj35+NNTfCUV/Ew3kaTljk6z5pm4uPU1wbHH50NtrWXY4+ECqgFdVYgxDCI9eu3btP5w/f/63AFyvCElsb28/g9/nY1/c3Vfxbd9259M/8X9+7n+/9dbF7E++9cg7Sr9RZ2JoYFg/Qr+vePLCUH/9s+fp4nrot9ujbjnS5bLMM4KHiANYQMbAiQOHGFiRWAM0mhjlJQbDEs47NGeyKKsc3yUrc31rDSS+sCDDIKMgOJxKdtGYL5C98hAWF2/D73zo8Wvrax/feejB++69dOlyfX7pcHH65GkUV6/XRkU5U/hAM40ajKBUIlVfZPUsQcM2IKMu9bVArTkTJ40+QpcGIBVFmmZQm+Tel2Kk3zCDFRpc/l2UaQ0LSw9h9tBtuG12GfbSI8gvnwG5Ao00oUat1nTOIM0s2DAZjjRSwkDGAZkJSIygWWc0mxmWZptYmG9icX4GS3OzaLVSmCxyPWXh0Ot1kZgSL7//NFa7wOcevQokczGodVLS32jt8uX7szBOD6aKsJcAVonaK65cQjUumUuQr7uR98Rb62Y3772pFKnq0AV/AcDWtWubZ06dOnUpy7KTU6LHCqzcVIbf3vf0PsrcCCreu0E2mxERWy8OATQYhb6kqRyB+pr1DvBR1OpQQjSgAGO757ByvYdrXcaotCg9I/dRxDpTs8hYYWwAUw5GARGCaCqFw2KWpi1rU97tdnF+ZySlDJ9ww+EvDhTv993Bhzqd3qjdxjUgD5Ni9NUwt7cX3kdFeTsYhw3jnYLwMqV0O4xkoQzSsqPyYn84+sT2Tv/pkoePrq9jY+8F7GMuyx6tLYbzs5l9Za1ublFInJyQVQCX2p32b144d+HXu93upwH08BI79sV+4m//9rni3nff97G/9y8+kCzWvmvh9S9feGOim2S4rkZrsCYjx4Rzl8/iesfbV9x2qPa6h+7kN7+8Vm3HR+1PUAEbHq+cIbFJdCiokrQLN0J/qJipN+DKAGVCYijaZICh6sBJ9CQTTWA4Q1YUWEp2wfMl5uqvovWzi/jQxY/yd77zO+gjn76CsxfX/NncKTdbLZVkYTQccdIABMarq4sb2hTiqZYOkNZq2O3lKMIIC3MNJEyAmMgQkAexRZKkJricRmWXoCO0NINzbayvfxTtwXmcOHk/br33IbTqdfRHZ5DIJmwIlCaMuRkDNh71RFFLLeYaKRZma1heaODQ8hwW52bQnGkiSywkOOSjIfr9Li5d6mNzV9DtDDEYlMjzIdgE3HPvnWjWm3vhdRCoxNgvMsA+H7YvBxYEKCuEAaiHJYLhuPgdPUhoqmLa03J9PRuDuE5C4205TKcKjUWqKoTgfRmcbgIYjUbdtV6vd7HRaLw+BG9FREMIFIKPLwsxKi9mBQLH0A5JjKFFYzjzTmZtYmfJWCoQ4Ml189yNlpearUefPJ+86b5X4NRiU4thDseBdvMCq9sFVrccBqMMoyLDqHAQUWS1BLVUUUs9TCwEQSFUShIDL1Q6FzqtuVpNINTtDUe+nHmsN2r/H9tnL/1WB9gFsHXTl+YRyAW0V06exGYtg+S97HNJzd4qntaUTDoq80Z/ONhc2eyuYi8nkKZldp2iKJlruSgpRAwbhqp2QyifWFvbeO/Zs8/+CoBrVVVFvx9t39cFsFSBp3/pTKm69Im//1Mf/M//6kffsPjauxt31wvPRAlgczRmhOYaDe11B7Vbj9v6e965pEvJSItQEttqqyMheKdIouF+NfwWZCmQJAzNLYpSsbs7Qj3N0Kwnlato5Ruu0cCODVemZgUoAYxmmCdPzexpfceD7eO3Lj1w9MHjeXrXt6b6K7+V1Z/ojijYxkIdJ5ZcGKGWWiRW6iJ95G6ecg+ADYgFS0tz6A49drsjzNQTZEywzAiWYRKLmnC6Kx67vgQ0gbcMEYssEEZrl3B+cw2Lh05g+fAi3vCau2m7J7h6dRX1eg13nprB0aUMh+YzLCzMoVHPUKsnABSjUR873R7WLm5ja6eDdjdHb+gxzD1coCqZJrZ8ia2DqUTPAZbS6C1O1etajbOl0o8xU1zRGNs/qUyCOQHasywBYJRgwFF2gsqssvILV9lr52TcZrJAvU6M7Yi5cnuo6qRxnA/TZEGaJ5ornuwjxlSWOJgiShDZIZmEqMZ4NA+gDpUEihzeT57dTrfbfWxxceHbVcNy6cro70Qx6h6wGh1cHZHxwnABvmjAYEGVWuT4GJv8eB4UQVIgaMqOa0k6E86uXOu8/zPPtP7Mtz9QG+Q9bA6CXt7Mabtv0C+aKEpEq2QSNJsG9ZqBgQOJQAxAYmC1FtN/jIX3BYV81G8ebTZGUg66PXnfxpXtn1ltX/r41JoMvQBHpCsrYzAqLr4bxZWHMQhfTps0PrPZbN0a02RVZmNEFdd6vcGvnD9/7pd2d3cfB9D5mlTALxXA2uOzdnqPXdVf/sl/+4n0n/ztN/31B+5I7677IbMU2qwTao2UnI7Q7+WaD/okswLRgCSN7odjNa5qgCCAOF4kxASvQKueIWVBWToAgtKVCAZIjAHFVKPKxiQgSWw1GaksjaUE0w7uuSNJXn7vCXL9VT1eZ3z/dxylxudX6JNPnM8G/Z2Znq9pLUuiQxJzDDYNCmILMjF6vl5LYINiMOqAay0wLBiBamkM8iRY3Wl3SSFg1siRqAUbRu4KnD//HM6dVdhkFksLc3jTGx/AwsIc7rhlFvN1oD8I6PWGuLC6g512D+3dPgaDHEOvGJY+pg1zCkUCQRZtjkkRJoaFYc8YUKdWXr5Csv1F/+4lLtEyzNe0jjEJ9pqkXb/I6q9qRa2xY25LXeHHgDXa2tr6zPLy8rNZli2pjPk3BhEpsaIsB8LGXO/u5k/V0/SQAoaJ6wJte+evNer1e8qyhHgSBTYExVbpw5P9Xvlrn/jcyn2vvf+WB8t82Ly+7bSbWwxKQuHLaCuTWtSyBIkhkHoQJAp2JboogEoIB/UkVDrJixy9Rn3maJHj2cefefb/6hbhA5XFy4sBin0fe3hPD0Uv5uubreZxZj7FxvRcWX52fX39v509e/Y3AFx6KQLU1wRYY46BmTY/fmbw8z/6U5+if/n/eecPv/a0ucP6EdWsIqsxhA0GA09FHoBWJGS99zBsqqVkhkoELK1cAWyV1ZixQcYGhSEUZfQ8BzNqWYZEFTaJ9h4GcQXHhQBoRRKrg9FAhBwYdZBqShgJ5pMR3v2WZdy6lNcW+2u3ZuyaaMzAGgYFprz0KH2AahIrB3GxFUqBxNQRfJyOJWyQWR/90W1Kjz7+FN788jux1LAoiqiDibYjBEosdjYLXF1dx/nrBTa6iqWlIa5eWEVCQ3TzAsOhQ+EVQSwUCUB1SOVTRTAIquBoGBLtZsTFHUdiqHpUrjWTnTz9Pb4t0s2CFr4GruoGo7gvq4TnytUhmgTqrvdhHUAggrbb7XOu8M9kSeP1zGwkWg8p1Olg2OOjx470r69vvPfRLz76669/zVu+B0o5MzWIdLssy6fTrPVAWfrbREgJ2iu16HhxT9t6/fqFlfbljz+6evz4kfptO/0Eo9LChwCbEWo1Ro0EqakkOBLTgRhxshv1YyHagnOGQe5D4aFk6tTt89PdIjxBRF4nQrmvoZt+EcfYtGmMKXvd7i88++yz/3ev13sSexbHL/nDX80XRWdP2vrUs733/rP/7fP/5Wpn9hqSFupWMduwqgAGo4A8l8o2pNrqn3rjKScI4ziqGGcMWwEXq0eWEup1G91EFTGsQbRKpIk7b2XpoSEuJsct+wRG6zCuBusbYDZwxsKXHrX8mr757mHyT/7265dfdcfJOotoauNzciFaEo/DHwwTSAMgAdZazC0eRmNuKbaiLEgtQ0MsZXa6W7C1OgRxh48QPe2D9xDLcIlFuwg4t9rGI09exxef6eC5Kx7bnRryMIdAc0A6C0kylCa2e3FvTmChYPFgKUHiIvFduSIw2egooDRl86L7WAcdTwanVNEisncrpv1TvWl5w17+wHhSV4VcYC+x52bLrzGAYk+5fqN4cz/g6fSTnSjeQ/AVX7Uf4EIIE5mCqm6FEK5iL8DTkUkKqcpMa1QHw20IBvSud71p8K3f9tZPBed+eXY2W0msDoIPF5m5gAqBtGGMnRmHlYo4Tnw5kEPZGc3wtGfbC9TkQmroDwO8J9RqNczUUzQSoJYoiBy0qq6IUM1iIzFbqtECCQaS6lanuFoIVsTObJ2/tPsEImf1jWi/FABasw1yZXn5i1/84nt7vd5niOgPDFh9VRXWNGip6joR/ex//G/PHfr7f/EVf66ZPju71DCaGKJBLihcXK0wiY3KWY2GcTapIRTRakVDGR0WFNHkH9UuMCmIA2ZbdYyGHoULKLyHEUZqLQgKS1EHJOKq9OMUwccJFgAIPFzwSGwK0gIYbcNiiPlaC/XUwMZbMEoXULowCW5gjpFZShHMghrU5w+hPhjC2AJpYhDKAmmaoN1eR3d5FoFqVcp6FeskBGgOtTmQltDEQ5IMUmP4zMByLRrzja1ZJMRw1IqepXHgA+k+ieXEgIqo4mei2HZPbPm19YPTQDRxYqhWfGILuufwOgaxaur9Fe4O8vNcHjAVsT4dQrqvQuAoaxDR4H0I+79nLEC9H6E/7OChV9wT3vnOtw/On7/0mR/9n/75v2m3h48cOrTwqiDumPdYy+q8JKqWSZvGmkYEQh9zNFHTZz7xTP/WW8k1ajxIakla5gVSq2g0LKwFmDxY99KDKvPlmO6tMXYkqFGndeRqsNkurj11dvVXGwvLa9d28vajT1x839RO3jfkeidrjwSVTWvt5RACVPWr+wX+QQOs6q6pqj9+MaGf+MU//c57XnHX8vKbZ2vXQOp06EDt/hCiMxDvK5K1epObBM3ZFvJRF058vEQFYCSAiQQsUyRz4RX1NAERI9cILKwEk8TA1vH1HEMefCRwjSCwAwsjA+CoA8IMkRyC2hECD1Gv2xhqAQ/vQ1WtRSKBjIA0xAAGTkCUAEgwM78Em7ZjfLwoEByG/TYuXR2hGPaxvDCPmXodKPO44iI1NFBHnRIYOGhguOBjW8P9KNsQBgKqFQsLsEbf96q8GMcXcrWzPK5WQwhgBRr1GWwN2kizFIVOA9vX1qpx9TjjfUStjMsridNeEMVXdbHt86faz1SNK72bwFWMNKuy+FTh9hsGWGs5Gww6WFiq409977uxNN8sH/7FX9r61Kcee6Is6YsAchFOjUlqBD1MxCcUwYtKzRhrQhAoC1SCmIyX77//DhoOsbMwC5eYIDUGuA4kaR4zkCS+F1ElOgHRkz/GtcW6tPBK/ZJ1bTdf+8KZC79w8Wr312+5+/bWF5688NndoTvzDeaN0szaWjEcXSr21mv0j0SFNX4PGfNPRIDH//MvPv7+f/h3XvPymfl8sUGQMo9x9eLnYUwGkwxIeAQnBgktAtlDqFkPto8g5NsgCIIMoVqLY2uUk9jzNE3BZGGEkYvCu3gnTGy8mAwQ1eDjhdtqClaVPEBA/H4m2tpaSlG3ghorjEa74MIzVGIcFiWIqb0hVnTkHUAZ2M6hYeMCtJKigIEnAsPA2iaeO7eO4yeOYaZVR0hGCDbAg6AcYiiAEoIk8MEi5XG8eYyR0iodmESQVInBASYKFaMHKHLv4BzDO8ZgUCLNaqArI+ysr0eTvyBw8HBkwQqYaeyaaut0HH0z1YqNq7Oxwlw1IuREMV4VQDp+lTUGt2nV9kR31Onq21ZL0LovU2/SIlYAbFhjZcmR91FEm5z41oyvGymrwkDIExkgaLQygtsDrIWFhcN50b7ldW94tX37296in/3sZ+k//8ePpYz08LETty7uPnvWAkC9XleNUnfTIGPZJ2mahtsNm1bhCQTKSe11ZlMLhT/ZQGMxYzltiJK0ZqFl1OQJx2VwAaCe4m+LAiR4iBoNmmrX13i763Vto3PhucsbP/v0c1v/5aGTJ1efvHyh2e+jdwPR/o04Zaff+d2trS0B0P+jCFgqoqSq3cUk+d3v+e4HvmXh8Kk322QHeW61Nyig5Ik5g3pbRYsrvA6gtWXU0tuQJgE+eQo6WIOOFNF9W2BNJMCTykfbWEVNCYQEeeFRlg4hUCThbfR/MpWqWyBIkxReQnU5JZUUR2DZwqqN6y02cjJegcGohApFzgwBwgQjqCxbQrXjmCFLLFIbL9ro3MlQGWFxYRa12jGsrK6Bti2Wl5dAXAI8quDGQT1AwcTpUTBRWzQOoKwCUIMwnFDlaaXIS4fhaITSKVz1r0oEiiQtUboCKceYaA0egoAwdun8Kt+KUxg3ZdCH8SLupKIdVz1jUwWdDs67yfSPpiqlib7qRkJfxn9bySPGIe3KIJWCLKsPVFMwHIb7JvZpaputmebgP/yH/5xdW123s61lE0Rn+r1effzwdvKOFxCTV0GfyQ+tTdEvFBAehaCXmZIOIam70qGe1k4TcUvIKzhWw9HGWarQ0lCJc6BOjOYhpUFusLqb71653n5q5frWe69c2v2lXPV6dCKcaKS+0cdfuHDhLP4AH/v1+CYxnUbP/OwvPfbbr37j6XtMvbk86hXrOz1GIckRyyMyokquRjYNIN2FYgDnLISOIZ11IE4R/AYodAEOEG9gkUCNhfcCmygEZbUvF0fbPiDaFzNQlh6W46qLYVspnE30QKfYWzHFQAiFRy1lpKkFUfSaL0sfbbNNtcoytiSpnNYVAqqsZmySROB1Dt6FyKvICM2GwV13HMXqeg/nz6+BTAbVOowRGM40BCEDICEDII1aKRC8AIX3cD5g6GJ6dFmWcQfOuWqPsIbMNtBsWmQZw1qFMR4SSjhPcBOHgkj6jz2rviq0muwH6g0dJk1xXRSThccrN6QT6UFcGH/hCSBVreVNW8rp6WFlTKDQoKA1Ywx5704TU5jmXqy1MKbmPvTBj/cMZ8nCwlF45wFVZWbU63WMRiNYayFQT6QBCN4HPSPA5axWe2vYLWeVIBrUjcLO9UONE8hL10yypjEJ22j1XcbwDo4pR0YNhKFeGYWk6JcJbfekWNnoP31pdeM31q5vvj/f9Y8PVbv0Vf1CDs7XG7C0urN2f+63nvjVizvtZi72Zb1ydPbRpwbZ+dfXv/dlt5enyG9qEppqXEo1rcH0t6H8HEytD9Ej4No8aPkyzPAsUO7G8TAEqgU4GecoSwwuZQMmg9IpirzEcFQiy5J4AbiANGGIMiwD0AJeFZarSVolqTcmQZZWTpweKJ1AiCEaKm5mvMsmUAqVkjwBEcFaW4knAaiFuASUGRA5GBKcOrGAZrOJp569jrOrO7rVy+CRkYNooRZDbzH0hsrSofSCwWiEvCirizeASZGlCZq1FLXZJuq1NAKxpUlgpgQPrSampcjEOnfsQa5TWie6CUc1WTimL1FhTU8b98WkV23jRIhK1euw9/lElf7oy82sqtd3EmhRcVcTENTpqSWIiWoMYifiAFyRwu1MA5YK1+q1uQUoG+8ITBZK7gaezEJVr0uQDWM4hCJoYmiRwDXv4sCm9KWt+WaSpmlBCY5ZQ7MRoAOIq3BRBZQtCh9UkKAIFu0B5NpOfvXSWu9Dz5xf+bWN7f7HAewgenAdoM1LpcIavwW//d3vfvbhhx/+qbkMrdp8c/jLn9lslf5z/b/9gw/++QfvPHLS5X3DYA0uoTTtwBdtsM3B9j4EWYI2PYwV+M4qJOxCXTea8CG2R3FKxFFNXTkGUD1BUSqKwiNJDKy1CAoYk0CkANQBRHAwYEpA1sKJQ2IJtZrF2CQgzx28FwQWmKRagZdx1RLzBBl12CSBtVFPFnyADxK9xdUiIwBwcH6AuZbBffefhst6uPr5q+gOik7h7Kgs84VOr5eKEkgJbA3SJEGzWUdWq6GRRkfWxFgYivwcQRAoGiNiEgMffcdjKLm8IIl+c1T6ErKfCenOzxOg7pHs017tuGE6qV9FN0r7tV6TCkunfgwlYjpETFAXShdkLc/RoWokEG8mxgKmpho1+WMg5JigHHcQWY8oaSkqW2xYSx3VjTVzADV8UBCMipfEZtntzvXW4aC1ekp2DFhVVeyUAE3UK6HnCO1eGFy+1n3k3NX2e586d+23AKwQ4A5KqpcuYOHhhx8ORLTdKXS7sz6Aqm4S0c9s/4tPlP/TX3/dX37zQwu3et/WhFNR0+VyMAL5a6g1GCZ9GURqgL0LtrkAtufhBwUgI0AIhpOo/6omjWQUNlGwYSgyeB/gXBEV6wrAmsh7wIJMCi8JBsMSRVlgYaEJY0pkafTuVqWJQJVYJy6c0Z9JgLJAvWoJ0yRDkiST9RQJAWqL2DQGRsI2jredh5UStx+roXzgDvQGF/PVjWFvpt6cbc6kZCyjUUuQJQlSE/clqcq6i9eag4rs7dQJwFpDXGgOcXFlSvn+9aJO97sn3EQ2r3tTPtxg+RJBXiH6lWEVcYS7scZsUh3SnjKemRG8Vj5XBuMM9XElWK9bYq4M/BgEBKq8kYiIa0mSpACsJXuKlOYFpERAcAFJYih6Esf3goiAUk6JCt0eYSXL0q6h+NhBozleUKulI+oOBau7bu3C1e3/dvbcxs+vdwafHxPa+hLcxTsArOff0Wla9vDud9937SO/8twHfvJ//fADf+n775n/0996a0sRWDhXICD0C/LyHLgxhKFboXQMSE6BbQJjCWXvIqwLYElRcoCihIoHKWA4AcggTSLhbjiF9x554aAwFc/AMMrImgafe3QNv/q+i/hbf+dP4VBjAGsiDSJkkBcEF2KgqZEUIAvoCMQeZDKwphUpP4CxUZ3uvCJ4ReARvIl2yowUEpogzpGaEUw5QoOApaZd7reShVMnFu1c0yqRECBQH2KIqkQLNscUFe5K1aCgAixvQZJByUPh43+JIKRxsXxMTIOrSCrBiwoIvAGLuHrQCXDSvjrnZkXRxDd00r2pvghpzxhv4j+gWHFqNeAgHk8tIzyqxvgta62GIuyPJwOMqh4jwtxeValTT09PMvNxANeMMZY0GEveCgwHxOGLiiIoA/ADgewE0o00PdxLcXnJEC1DiNVDnQKlGip8xuvbo96Vtc4T59e2/tuZ5zb/K4DzN/zgB2D1dT78e/A99/mDPPzwGXfk3uaz7aT2a//bLzzz5E///LneVn9xFNCEgUAKqHMDLcoL8P1zILkMohzKR0Azr0Q6dw+S2jxgAsA5VDyMGiScxdbQAAk71BNFI4tEuqhikDsMvYMahkqOUOzi3nvuAJI6fvvDT6NWX8RMMwFTQFCPQU7wIUCoiNMwJbCx8LYO1E/D4xaEUAObEWopg02GoBJBopwBygYM1aDMCOSgRuFhIvGvCstqRFzKXFKKIdgPQH4EUleR0AZCHO2iwZUuiyaCWiYB8QhEBQih+jiDtEr+jSqgCrQIpON04P0RWxOuSHWidaLpAE7VilaKkVFKjCDjCCneZ4639wuXKYJ+DEC6J5IbgwjtJ+157ApKmKTUqMavHbt7jB1MqVL3I7J88FERQFM33lOALozbQKJ9ARTzzDwbZTiJAmKZzGkgawX1ebNGMLAoRaFU7oYQrhFlm0eOHBnNAYebiT3BnLDXTAtfo62OynNX+5e+8Gz7Zz/5yMY/PPPc5v8B4Bz+AAkwDyqsFwCwJ57otO+8pfEU12Yu/KdfP3fpwiY6P/4/vuedx1ruLtcZsh9aJEgxpA3UMUDS6IPtSWi5AEoeBGZmIOYZoBiCvAGQgQSwXMBwXDqOlioKawyaTYNRXsIVAEmBlEpoXsNMnfDX/vIbQPUjqDcaqDfq1RvboihKqFo4ayHWgaHQYAFzGvXlb4NpPgBsfQq6M4e66aFmAoI4eAhSqcNKHybUYDiB2l14qQFShzEjMmP1OAARIYWZpPJOm9zF63YPbDBOjdGoxCKU0eGKACPxfjPWRI2dWW9uLvy13HtoaoVnyhZZpzivKeB7sWXF2Fr5+Zva0zuG1YBg4hCxNz30+yssstYaVeWbJRePByWRnGc4762x9iiBtMyLndps7TSgNoigcNIwJrkjSaSztXXholpwUktMAcbWyFC767YvrXQ+f/7K5q89fXX7fQCufNX62YPzkgSsipKRmqOs3zh2/GP//r+f+7jz7zv7v/z46/+2rZvbqLCqhSLwNgrsgMTB1HOQvRfQJUhyK2wCcC9DqR2w5oCUMKIInuO7hRmpMWCPaL6fGiSconQ9BFPCmDkEP8CRBcLJW45g1N5EPUvATPCBUJQhyiQki+sW6mA0QdAGkoV7oekiZDeH5cg5WRKE0mJUMqSlSBYS5EUXiVpYskiDgYOPqeck4MqwD4gKciHZ31BNiSr3SPE9lZLCxhZQ9+SaUFPtqxWVSHNvsqbKXxNQTfNY8f+n20xMRKHj6KxJFaUvAi7HEVSCyrLG4GZdp05VZ+MAsejf9PxCZjoZZ3qyOXYHmfSOxpQhFFtsjCGi3LlRmZjarIhwmmV63x333brT3vmhy+efeW9nbecXSNGwaZ23+xKeXe0+s3Kl8ytPPXvtVzvOPYNqaVj1gKv6g9wS3vTU2adM7qT37r43vvFI+Z9++wsfOH+lf5aTGRiygEbZAkpB0duFG5yHumcArEEpAfhW2OYrkc6cgGeC8DgUtFatjUTehCjAsqKWMLIEyNIEAoNBnsP7ElL2sHr2EfS7m8iyagUIAV4EQRVGUtQ0RRoENQB1KhE2n0Tvygeg/jwsl0hslTCsM1hd2cHR+9+Me97241g4+l0ISQovDokSWHyM02KdWmmJNi3TFUC026mqB5EqxB7VlFDAqNaXqAZFCpG49CwhACGuEDFjKi4+Ci/HF7DeRNKAKanCnkVNVddNwhsiaKooRPweWIlU8oY925d9FZbqlCQCz28hpxOhsbf0LJU8Y+zpvi8UFbF9NFXUGPZXWJPnvJeRqJP/n3p8MsYMWek8YHuiQqq+rKV2pAKdm19U51xt1OvenlrD7a21oamjCTtrnr28/ejHH7n4rz/55OV/23HuC7Tf4eAArP6wVVilqmmmqQHR3KA9nK/X6+2zF9vX7zvScqQbJvIXGSkcJM9B6qDuHJKZHKZxGwRLEHsEtmGgsCj7q1D0ASrBhiaKa2PixWjIAFrEnDyaRYDDoHDIkgRJkoOJkWUENvHeLcFHpwRGTEjmSF5z6MPkZ2Alh+s9i7LbBlmCsMBLjvvvvwenT7wRmp/EqRNvw8IMY+3KZzEqO1AT9VuGORoOYuyWYKfaHoEqTVZmaBLbFD8WpLKXBsACpEZhUyBNGY1aDXnucX7DQ4Sm66P9aPDVD1CiqZ8xYzb9a/teN7g3PO/fCXjd7OsFxrASKqD+EhXWGKBoKslHVWGtVQANESx61W0yxisAV4bdZi3dBEQ2t3ZYuefV+ydHg+Gn1/rYuf/OpXK7hyc++dmzv3Vtc/jLROipHiDUH3bAIrXpvFdz3hf+526xvcuPj2B+90NPP/KWl73qXcs1e0zDUJybQZKUZC2BQ4YwGkBwETaMYJt3ItgjAC0hqbdgeRl+dAberYC0Bu+0srJhBOerysWDqAbSDGI8JLdwpYGGXnTtNAxrGAqCUAw4IOPgbQBzAl8aWPXI0IMpN1B0dpD3HQSKtEkohl3cfdcRZMMBLl74N2i1EiwvvxZ33HsEl69+ADs7q+CBgC3BJnHyJSIAR0IdCjAZSFAwGXjvY7ukIRLrVQDF7Ows5poJlloZDh1aRKOZIk0MDi0voN3u4r9+6AKeOrs2ntPFNlFvwkXdTFPwAog2DqaomKWvmRnbU6/fuJBD+wIqXijhWBQkRKUodXGTXbzpSmv8M1TclgWwwIzbVMUbw7OkaiChzta2JPKA7SD+0Y1rKz9z/srq5wFQs7E0ePzJSw9f3Rz+LhDB6uD84Qcsm7E2ght2u11Zfd8OiioS+wNzzZn7/sr/cPx7j8yOlqwwUDY0cAEYIREGFx7BXwW7HmzjTqBxC0qeAycpTCYIux5J3gOPiVgej+cJ1qQIRsFSgilBmglGeQnvCaVTGNsAaQ3OBxibIjOEhKOrAgcCkQdMieBbMFiHkkXBCWC3cKjp0R4o3BBA2Qf8RWxd30bZ3cTyqVfg1pd/C2auPoFi8EXIbgdkSxhGJfSsWjNViC/AGkBO0MpSzM0wFudmsLTQwuJcE4vzdTRrKYxh5C6g0w/odBw2tzfxxccu4sjRw7j31hN4+rkVeBikzHG3zUSrHgMTNUxTQ7o4IaSKb6Kp8NOx00iIXBvvCRaokh2ISiV0GmcfysT9dDJ5JNqLR6X91dVeek5k5lgJXOFrgCAQQ4ijEaIolKiyVRaQEXhKEKC7CHQOQD55g1n7vDZyireaY+ZbAFxl5jQELDHTHalKmpLMeiSHh86vb+2s/mxna/dXVjd6TyJqqXh3s/f4c9evB+y3Dj44f5gB6xbABIcrnsLl1Z18u3pD6Xvf/e7n3vPww/+/lc7W1v/4Fx/43ruWRndpGDBTAiA6IgQvCGTh8z6MnkdCDknjFFRrYHsctdkGgnkOfrCGEEYwGpAaC0UNLpQwxkFYwUGRWgOqxwBTVUEjARJyMOLQSGtIK79zRrRjJhYEDSBOJvNq5liVNWoZyrqiDNUFXUktep119HpDLJ+6C8uHTmLmgVkU8iSeeOZZYNgG1QdImh4NtshSwtLSDOYXEiwfamB+ro7ZxgyytIbSCzr9Ea7vdrB9pYOd7S76PY9uP2DkIgkeQoETPcGRoyeiL9gkwvxrLohvmOZVmigRiGi1afD1eIjnP1ER7JucTj5rSlYlgtLERJdJbxjFvM+fEFaV1gyAY9bahIjUe59mmW1Cw7Z6WTc27Wzu7P72mTNXfxpRSzV5Os9dv751ABN/xADrMlAecfkjJ9dRAnsmRu95+OGgqmeI6P/b3iqv/YO/fO/feODu+XtDOWSIV1IPMJPzMWlGyw1Qv4DVISg7AaWjUHMHeC6FtQ1I9yKM9qHeV37xDMMWJAClJgaCssCQwoni0EKCk8spup0Cd9+2gHTsUMOYVBZR4xT3F8eEc2IZ9VoNbTgMhjnIcDS5EYOMCaXbxaWnPoX1ZguHjpzAPXcfx3Y/wJUep48u4GW3zGFhYRYLCwuwiUXpPEb5CO12G1cuXcNmu4fd7gi9kWBYEnJPMByV++AMqFxRmTMUzlSmg9W60j6+6KvBEZp0bROejcb+CZFrk69xKEaTaPqbE/J77dzeapGoTH4m1QCvnm54H9eJiG8g2YFqj6/KKmRV9SGEgolCIL1OCXqA9oad/vsBXNrnx3dw/si2hLK+jsH6zXkSZaaNDzy++d6Vf7kb/tFfe9VffNsDhx/MqF9P1IG0VDIg0jR6EaGPkbuItBVgminUJBA6jKQZ5QRhcAlOdxHCAMZYqEQyljX6QcYJNwFBsDxr8c5vOo352Ut44J7jSMyU6BAycRygaONQ5fVF7y0igNjiqWeexSvvfhr1eh39QQ+kHgYF6gmh29nB5ZVrGBQePb+Ae+65EycPtXBoXpH7HE9fOIed7QKb2zk6uyWKQpETwQNgSsGUwHCCGnN0J2VXeVBJdMWUEP3DJ+6IN9JWdEPNNAYx3sdtRcL6xlj3vS+fBJpi/1Tw5kUZTfzI4jSU97Vok4qtGpKIyL5Ca5wqjSnyfTx1jCLTmDkWinL8qApgXlVvB1DTqV0hmkIuYwzNzMwcBhBU9ZKx5hUarUXVJKk3tt4BEJgPQOEAsL4cmkVPrR0i+oUf/qefufzP/vab/9q3v/nUuxaSzaa4XQ1SqAUTYOFKB8EAASuoqcA0dkH2VoBb4OZtgKnB9y7Buk2wCoILIMNxDxEUA1hBMCAYFHj57bOop8cxk5ZIOIExFqKA8x5sPAS+Cs4w0fsIIToRqIKMQbvTxer1s3j5PSn643gtxB0/pQZU6ri+sYbHnruIa1vA0lwdy7MArEGQmGoNtjHA1FoEw9FeVBWQEqIjGAggFkoJiAKIopMFsVQqc9oPLPplVpCpWsERv19iMQEMjq6q04JQIoylY6TPT3aeJua/bHmi+6UNe+EWlXPsRHqx/8uSxFbTVH8j214zxiwBsM93McV4+ZnTND1GRI0QQoeZRSDEhEbwkm5udglfYkJ5cA4A63lv4arc77YffPUH/8ZPfXz0j9ZeGf7MHz/5xw61GnPOjyBQtVSOl/nh3BDoXUW93IG2FKZ+Eqpz4HoLNdTgewq4XQg7qEQveQ0xHswYgniF4RLLLYY/2kA9i86XqDgaExny6gLeI4yrtTfUahlES2SNBlSG1fTPAEzwILiQwBPgqQQSC5/WsVOMMNr1KGEx18qiTU0S6Waq3FWtCDA2TK0gwBPHESMAqcJOSQUkQKhSsZlobx9Kp4j1m6GVAkHC86aJiv3JONMk/d48D5Wf/N5Kj2jMJNQxn/ciQGviQD+RNcTF6YkkQadtkgmqUnntK5z3E/ZKFciy7HnC0RuqeGJmJEnCRGRCWYKZNbgytSmfTNN0IYSg07h9AA0HgPXlUUsBeuQR97333ffpf/pzjw+vrG1f+Vs/8NrvObU0OA3dhkOixtWRMoi0D2iJURmQyCWwlqD6cXhugutHkHATYXgWhAtgD7DG5ZaAgECATaKjaWoVszWFNQ5s07gL6EtYoljRAAihHS9YCyQGSBmwlWJdSbG1u4Gz5xsQR1icnwM4wJCLWjIABAvDDHAAJSkojes/wVStjjJIk2rR14+DaioHsL1lGyOucqtgEEfuimwTBTUhsLAIIBGA0mrPUCeWU1HnpPsScQg0FThReTwRVZL8sTUyTVYCacqKdBycKjLeVGaoiRUmIHF5WzUC7A3upHF9MFQ7g1yVbNP2WBLNBwVQrdpvimk0PhiAWEJ0sNfp1J+bClinOL0JMW9MDWozeD9ME+l4LXe7I1ccwMEBYH3loAXg4TNnyve+991ffM97Hk7XNobL/+CH3vim+08vnDRuOzUmU68EVaYYrkooh2vwMkCqI5j6CYDnoekxGJsitYxysAZxbRB5WCQxB3B8UWpAPTMVoBgAPlYrOo5ND/C+izSrlq3hYBmwFZcyFijmpcFo2MfmzhZOHjuCWpKBqA+Y+P1ifFn0zZTAkMCwxoKZoBIQ/ZMjmISpdI0YqxUjxMRGi50ggrJwKAqH2cUazl9eQ14E2HGlVcWNUTXb3FcyjNcDb1C7T3ZqaP8Eb0yQTxisqg2MFY3sKfij+/pe5fRlnSKqz6a9x97rTsduD7THiqnE7EmyEMKGc6PNF0XwV4DMzFQR70TGnALRooo+2ciwWXp3cW2jc/0ADg4A66s+73nPw/TQ3cunNvtl8+//qw//5j/4wTc/+I5XLL9e7CD1rBpCquwtMQoo5yDvULZLZGUJ2zgNGIZiCabxEFL7LPLeU9CyCxsYFCwc+zgBpLhMPY7aisS8qcSnmCxHx1UXriaH0W0gBIkmfj6Grx49Oo/ddsDFK1cxO3ME9dkGYHYg5AFWcGW/TEIwIQF5jvJ1EghHPZPRenTKxNjXXSAeGDnBwDkURQ5XlgjOgZgw8peRmQDDVMWU6ddv9/lLTvn2K9W/8lvS9NdSRfhPLU7Tzapv1egyIwTBmkg5meFkWTbZF5x+PhVYqYkfXCaijRiUKyDSgfNyvWbtIVZOyr2Y+INzAFhf8fWgAOo+s3ctLi0sXjx3/Rd/4B/9zkf+8Y+89m9+5zuXXzdPW426FyViqAGpppBSYKkLHy6DQglujUDJaSi1YOwtqFkD31uBDtpgU04Rx9ExnJmhiPbIYbz6QbFOqfK1QMSwxoBN3PqPynWKS8gEBJ9jeXkOtdosrlzt4fpWF/WZGSSmCWgbwEBjBrCrihAbI3rIxn09ALkzKIuAoiyQlx55UcIFQZAANkCaJailCdJGDYmtrGVEUWplXMgvgoGhsWAU+y/ysZeVTjkYT4eejqd7U5NCmewV6j7yfa/H/1KVz16o7r4JociNXzam5XIm8oA2VVSI9vtOTS84T4Hc+GdLiOh2ItpRVQ9GDmgZxEuazTTY1LID9uoAsL6WrhAnT+IeaP7QTtd/hhrysc6RI72/+28/t7veu//P/T++9dR3Hc/yRe8LwBiVkIEQCKZA8H344Sos+kiaI3B6EkoNmOQumJl5lPoMQn4dHBTxZhumAkHxPA1QkAASBXwAlCubEqn4dYYIVS6nMbFZnUerUcfdd53E1ZVdXLi4js7QKiEDmwxeHAIRvNHoFl8GFIVgMCzhnGLkPaqASxhjkaYJas0UjYxRTwMSa2MF6EuIF4RQopzWIOiYV78xQEInIKFTkz8AlYf62ON92k4mJvnQFKCMAY6m3EbHr5VMxc/r9Db1FIBMJ0prFQCrU61mXFyW6QqJNMbkWkQdFRSyL3bGGFNT1YxiUKberC0kogVjzC2qeg0GINIF8ZJwM6vlw6KaZ9BN8xAPzgFgfbmT1W3jQS01HQ6GH728OlwnGur3vvfdH/6X73l4fWstb//173/wu08vdk8b3zGqDLEc80xUEYoR6qowIcA0HFC/BcpLQHYIqQnw/QR+cBUIAcS2Wpgdm9cJmEy15wcIm3jxGgMowTkHY2IcGDEjhIp4FgMDAysBQAGWIU6fmkGaHsMjT17D9fUd6g2oL2zz69tufqfnrCpiLLsIEmNhkwTNZoJaWkeaWGQJx7xFFRgKgMRQDgkABQ9AK7sZnlQ+L/aWIKqTYFZ6XgFGU7FbMgGxsSfVeH4J1WrXUJ7Xju0rpfQm9jkYJzXz8x5fJ1POfU8qSZIEqqpyw0eyLDtFRMdvqKqmH0+ZOUuSZBnAM5Z0AFIDkUXyfLi907mG/e4LB+cAsL6yKsuY7Mk899cHu/TI+H348HseDqo/foboJ/6XCxvtC3/vB175gw+dbt1npMu5AKBEMyLKpISWgsL1EMJlWFWYpodSA0gOwczUwCooh1sIElN8x8EOsaOSSdw9wUM0QLQG4RTECgMLNg7EXJnKuTj1CgRDUiXvBEjoYmbG4P77TqBPHd363EZ/p+v6DZvMGqSwCaPemkGtZpBlFsyAJQWrVJFkZeRbQogB0RUZrgpo9dixt6UqL5CmdERjmeeUvcy+jkemC9pJIzehy2kqWGISWEEVd1dNN42JWwWylyQ4/hqZKtbG0fYTL8Dp53PDLpEonmdCqJCo3WXSIBTJ+VE+7uGImWeJaPZLke7j/1prKRooWmKGeBllxGltWNI1YBJyeFBiHQDWV3zKZ863P3OzK4voJ4SZrn7wkZ2fW137vPtHf/21f+0dr5i5D5qnUEHCqgklVCjgyaMY7SDTEnXpwtRPAelxeF6CnXkFkmQVYXAJPt8BB8BQBlaPQDmcMhK1IO2DUOK/ve8R3H9vC62EkaAGmwyjGWhgBA+EEJOj1fjKj7wRrY29gwlDHJrLcWSeZjnYmTtubdpWjZSIo7koBCLFnrRA98AGIKixlb497KuBWCJY+UqntGeEF4Fs4q7P01XLNL+052Y9MeSrvly1CviovocZR9arRh2bhH1SAgCQIPFziBCo0q8JJtNIUtrrOCsQ4RvI+0AxnJYqW+S4TC3QaoIqYqrVoD3KyRgDItIb7Wv2R5oRjLUSQsiI05Mgk4vvXLPp8aXhyMgBUP3BOC/lRQTBl/DIFlFiop1nV/vv/bv/7EM/+Ssf6/926RcGMwQKhrGtmQoTjDoQDEJZYtTdwaizCi1WYXkbWstgWrehsXA/suYRiAmAuspELpYHMT5VYQ3jiacu4gtPbKA1fxRlGEUHVPIIovBgFBoQjIWgDkICixEgQxDzZPRPSnVruZmmCbGJdjIiMuGsnj97mP6TxkpRFUYxCa2IHxwnJMsUCL14wnCcVrPHa+nexFE1AgIzRMKU9upLTQn3uLQxQO59zlcbRT0WjvIEa/Oph0rTdHrReR8XOXmjM6fWmHpwrmGZT5Nqrh6rbNK8X+Q5ojHZASIcANbvTctYhW22N0f3/cbf/Nef+59/+lcv/ebKaKFdaENJR0AYqfgYqKDeIxR9+P46yt3zkNEliAwBNEDmCLL6Mhr1OiyHKuqeJ4S0ikLFo17P0M0bMNkCyAYQK2wiCAJ4JmijgzK9Akc9iKQwwoi1QIwmsxVwaSW43It1v7mt7/MvWq7MCA2UDIQZAQypAIYmQchfeSLgWCWu0Sph0tiNq5OYQO33nuOUCv75v5npn4H2//lrwAMigk0sVGO02p6xDHCzCeFNvv6ItfaWoJoQwYTg4RFYCVuseqnqRg/OAWD9HqKWAkRnyvvuu++z//xnz/yrf/7zZ/+vKzvJ1SYaQKlQrkZxQlDvEMo+ytEW8s4V+O5VoNwC2ME7g50djyAWYAsXKtGiAuIjuU02QX8oELEwDFhOAQ4AMa6vMhYX34G77383ksYcAvWh2oTBbAQRFTKGyVpDhokoGqQTVZXDja3Vfr567KvOELaAMRAet30BIA+wVFFfzwcSZrp54UBTD/IlAGLsghrCeHK333J5XG0xT/1dpYIff+vp9Jqx6+qe1fK0CDUCr4ju02LttXWMxCbRZYsmJeU+wNKbV0gUOVHTJKK5EJwkJhFmYiZzQoVaAdK9aVl7cA44rN8L0Dpz5kypql8kos3tlW7vR3/ggT9/16nl2wR9w+KhbJUpJYXAe48wHCAtr8C1erBzx/Dkc6v43KfO4NUP3o7bjrZgrUFQilNEKBJDaGQW67tdkCoSIiSowTDBuwKtmTkcO/Y2LJ5+E1q4F+trv4Ve+zxUDRgMQzG2y1C09/XBQdWOWxWMB3Hji1ymqi+OLpvRwlk9xDtABQkEKQICKUqxEETluSrfwPB8La+tTiQfRAZUBWCMfd5fAO/2tZw3omRE61hxRkCddmfQFyzdJPhcVFdww1Tvxpbwxp+j8s3vORfW601uMYiJzKKAm93uMBxAwQFgfUNPJcFZIaJ/v7r5qWv/+G899BffeE/tdaT9FGTgg6hSTPc1RJCij5HpwIUhPvP4Rfzup9vI023UMmBpVmAzi8RETwdXlHjda1+Jp85tggFYGFhNYJjQyQf4pm96LU4e28bKk/87luaO4+Qd34zdtRbW154Fs4exBGMqv3nSycUapCK7aUrtXZHwUUjqoSG6f6aJYKahaDVnsDDbxOLcDGabGZI0w4efWMNTz61iknDzJXiwr6YNw1RrWI3WpqBw/Lzlpo83lonIDZKG8XRQRPf5rk90q1q5jerzXBdIguQArk4BFhNRA0Dywj8KgZm7IlIY4iNMsNbY81s7nUd3N3bXvzaS7eAcANZXCVrMdO3xK/1f+As/+sntf/Ejb/jh7/6m5deXutmspV5DYWFgia2i0AA7tBj1e1i5voWrO8AXnynwqrsZc3WPjCtnTWvQL3I8dP8r8coHXoZR+xwkqcMmI6QcR15ltw0Meig2P4PVDYvDp05j/sQrUZs/jXNPfwK+uxKXktlBraJEDUEcDEf731hxKYJ4GBhkxqBRZyzUUxyeq+Hw/CwWFutotAzSrInCEcoiYJQXSLIMr3/FKaxvbOK5Tol6ZgGpiHSK60N7V+JUJUMcRwqCaveQANobENwIWqKKQAJhEyd1sV4FkYI0j1Y+oggwUZoQQhSC8rgaU0gIMGRAZr/XlogAmkCFIcJxbxKxzSUlqBgYcmBKEJTUxxSKMbg0ANzJzK1xWs5Nijyt9gidqgozpQFWR948dvbsyhMADhafDwDr9+eIKIgw6C+F3/lb//oTnfZffejPfs+7Fv7EXBaWvXNAatRLCYUQB0YoHJzzEJPiykobG1sLuP1QM6rgIVADOJ8jyBAoCuR5G2QIBFfl8THycgANQGINiryD9ZVH0WkPcfyWV+LlD34TatkTWG9fQiJDsBuBSwEbhoQChgJmEkarkWJhbgmLywbLSw3Mzc2jXq+DoMjzHLvdPlZXOtjavoSd3REGwxLdwQitVhMvv/8OpNZW9sIvsAsDmsTa65cgtSInJRDB81Kex6BHCDAEgDS+RlLVWJXxIe0n4V6Q8Y/mCbG6lKCTdnh/Q0uV26mJ7hWyr4NLrLULREhvVLlPSRyIiNxgMHi61+udXV5e7njvi5X1nU0AowPu6gCwfv/J+DUMf0x//CM/Rj+xvrF5//AH/8Qt33NqsXeEVTn4BMxBCUJJYmFTBpkEQxdw7fou/L1zsBAYcCSOpYSGDgAHlSEgBYyJ9jLOB/SdgOoJAvvoaEoe7c1nsdvexuGTi7jl1iU4TXDp+gDbmxtYrndw4vgslhYOY3l+FkuzTSzM1GEJcMFht9fH2soW1tsDbLR72B0WyEtBUSrihooBuAZkdQzIIC/jGs8epzReKtwTfGJqJ1D1hcl2ws0kCwQWBrSaRsYwWAUR1GRQEgC+UnXuhb3eCDx7j8PRQmZSaun+SvCGdGniai1qitTf+17mhXBRAXBZlleuXbv2q2ma7jDznIh8HsDOC3FfB+cAsL6hoPUT9BOi+uPPEP3Ev72w0r76d//qLX/+VafsvWYQjLcJVKHWENUyCy9R3d4ZBHhlBHgQ25hMTB5Fvo163cAgB6mHZQNrLNI0w3Nnr+Da9U2kWQOjwRDMjMwE9PJNnHnibLRWrp/G3ffegoXlRdx9+2EcWWAYYzHKPba22jh35RK2dzrY7Sbo9xWl9wiI0gUyswADbAVKHKsoinFgIQASGIbTqQqIpvb8Imk/Ha013m6m6faP9gJNUU32pmUWe3YxASDVAEIeGIUk5ESgVGqlGSWiaphQGQW+EBBO3EwxFnpOT01pz9VUp/y3bphtW8v7yKrp7+99lGPkeX5tNBo9WavVWgBS773DVIjFwTkArJcIr/UTwkznfvPz1/79aqe7+4//ykN/8w33Ne9XNzTkFZqqZqklRlyxdYFRekEjqzRNymAKKEdt1GwDrALLhNRaWDYwbLC728H5C+dw/11NjLZ3QZKAMIClGlI6hOubO7i0fhXPXQmASbHTHmHWjFA6RWdQol8ISrEISCDGgK0B2RSGFCQBpB5U2c2QjvXvAkgAC4FQ2d9Mt24VcY3ppWbsgQExVbilzyPKb9ZWoTLyIyJ4GBQhQdo6rJcubW6vr152rdn6MhlOgDI+zg1DyhvDfCJvNfnOe499EwoqUm6mAl9FeJ6cmPelRcfJq4xdN8gY44noqvd+h4hmiGgCZAfnD9b5I2G5L6Jgop3HzvZ/6Yd/8nP/+tceGXzIU9IHE4hUs5pVY2JQRZGX8OIh5Csb4dgWBlcilFVyNCdgsjBsEZxDo2mgvg3xfRiOxLGy7mXyJXUU1MTGUPGFZ67gk4+dw6Pn27i06dDNEyg1kaYNpDZFwgKmEkAJEQdBiGQ3TbVZ0Y40dmZS+bPvNxPFfkHq8+msqBrXCSH+JdvDsYaKGFGcwQhqwNk8eqHV/sKz2584e3HjC4N+UUIZBKnUurI/7fkGz5hxSCtNbKinBKw3EF0x0dtUEogACW7fZ5gq+ZuZYwZjCJMEaBvdLTwRrbbb7U6WZaZydTi4+g8A6yUMWpUyfrWX/9cf+sef/Mn/8Bsb77vu64OQMM/xDOrBitOgA6caJNMQgjI7ECVAsDAqUO+Q1WaRpA1YM0KSaIzdUsLG1jrOX72Ozf4AngwUFiI5gBJMAZYDsszApjWomYFPE7gEkDRAuYD4IVhysA9grzBCMdYLBgILBYPVgRDNAJUB2ARiMiBdgFAKw4CqjyGk1dRvOsB0D8RoItqc/Fmxb3H6RtcDUQ8xAZ4ZMDW0WvN49HOfSo626I53vOne+5YXG5moV4mRpxN5AlUhrXsMWhShTqyXJfJZ4JjnOq6yxkAWSXypnoNBXEjap2y3zJwwM40njmPdVZIkYGZSVQ2x3GJVPUlELREpcSBjOGgJX/JkPGH01re+7ZM/9u8/Eq52esUP/qkH39WsheUEz7LnREbeQUolLhkmgQYQCaewKhDnwbNzmJ2fQX1zEwnK6sLP4CRB4TK44QCD3jYOLc8iyQg6GgHeI1GFCWVs4SSN3JgwyBholQEz8V3HnvMmT1VJxGkMpQDDC1C4gIatYWV7gI2dDrKMIXAIMNGbXfd2/m5MJhUR8D6r5L2AjbFP8jRoRZBhkDIaWQYdtvGdb7mndfL0qZd/5tOfxMZOoaoeoWLRoAFMBqoxLzGq5mWyqzh2dhgvP2sl8ZB9+4BjoaqATIZQbQ5pUBq3kEmSHGLm0yJiReLj3Liqo6rjisoaY05U3NYF7C34HADXAWC9dEHrIx/5iP/BH3z1Z3/6px9pD7YbF+5/xeKfLZsyU7ZxYTSwC075TmPIBAcVTuC4T2oCLLeglGJmto6jhw/j5GHBc5cvIASCoRkYV2JxtoVud4SVlR3MLs8DSQIkHmodyAqEc4imYNeCyRKo+Fg9jDMHNQWRraZoBkEV4gWlAMMAOOdQ5EOULgZc1HsFdje3UAYPrdKfI9kUqqQdg5vpzbVyJp32nZrOLpwOUjXGgGHB3oBJYNyITMo4dGgRV859ToejIYIoiM3UHlCVfFO1hxMHCB5bTd/AUt1kPYkqHVkIAmssiAkK9QCPqyN75MiRu7Isu6VKxtHp9BypNBKqOuGsjDGGiEYisoGYUXiAAgeA9dI/P/3TjzgiOvNzH3r2p+94Llup1dNGp0dPfPqp4ekHHh9+/598x8w32dTNoPCaESmFkoLxCBqQWMLiYg1vfvWtmJlNcXV7G60mkMAhM4wjh1qozbSwsrkN5wPATdjEgI2tBJsKQQGFqVJmGEoJAIZni8ILfOngvUNReJSlgxeFg8AaRmYtZmoZ0tRGqj0oDDFIY84O1ADC8b+Tikn3QRZNoEKn2kLFVArF/mmeiWCoQSHeQZxHe3sLeVGStRbMEoM0KqYhCkojTxUxKwLqHjBOp/dMF4CxlYUKplMx4nI2oCLbgcIqAGk2my8/ceLEu4noFKI4dAxWGkIYbz8wgEJEegCkcnwQEQnT+H0ABQeA9Qeg2lIQ0er51eJnqzdtAaD29//dIxc2d+79oe/77qPvOjbbWWgOLaW6pIUdIkDIMoPh0KoL3vq601hpzwNOsFBPMOxvATzEbKuJW5IjuHp9Cysr6xgULRASAClELTQBAitCYHincCXgvaLvehiVeeVkR7AVFzNjCY06IzUW1gAcN7MRQsw5FAESihM0C4aBAVVp15Uz/f5VG+aqC9yLpt8z6sM+wFJVaEX8k2GIMiRkCGwBE0AYxUVxAZgsYs6iTjzaQdjPpdF+Un/MMY5pJiKecGpU2eUYY7XqmG1CWQKgdfupU9/earX+mDGmORaNVnzVdMRXu9/vf3B7e/vDAIbMfLEsy99tt9tXD9rBA8D6AwpaGOmeKeboVa9+9af+9c8/0l3ZGV3+4T9/x/fdO4tbwmgYXXVDquA6MdcAtwuVAneePIThKAGrwezSAtqbVxHyIerG4vaTC8hMgq0z22h3+nA+YFB4rLeBdJBDQqxWIARDFjYjtOoJ6rUMqWVk1oANV4osj+CLuGsSfLVzFwAdgjSA4CIwBcCkGZhtzC+cXJY3+EVNDP30pq/LNGiRAgQz8f2LizkejnzUW4VQrfnEyePY4UFBVTgtprRWN6buxI+MnZirIYBGpwgNokpxsicgokPG4K752nz70OFj32INL1UzU4r7iVF1ZozJvfdPbW9v/8aZM2f+u/f+cQDu0qVL7/fef3Q4HG4fXP4HgPUHltfC1O32kUcecar6GBFtXb002P6xv3nfn3n17eY+E5AiMKS0GoSJrYEvHXbX1jB/5G4ULkHu+jh6y10YbmxhZ3sLkB7mZw3uedlJbBbb2Oleh/MBZZnAGEKWpEgbNdSzBGkS9wgZ0SJZxIG0jIGk4wtdA0gFxkgMqKjVUa8BWVaHcA2dbo5BLwcECMoQmNj4SaxgxvBE077JN3N1v9GjS01UulN0jSB4MDsAXkOIanNRB+cCfMU7jZe8x5M7gUTnUgJUI8AFEQQoVFm9ELxi4IO64HwiEq4o9JqEcJSMvcuDMk5Mc2Zm5g325LFbarXaK70EjnEi04Uh7QyHw985d+7cf1lfX/8UgPb4J+12uzsH7/gDwPpDdyr+Y5WIfuYv/dNHLv7k33rz33jXQ+FNGY1SIwKhoAUNSbUGUcHW+gXML55As97ATnuIuWO34VBjFpsrFyGSo2YEx1rALAtopoaTxxJkWTLZ2YOOl4A9WDWGlGoJhYMhRS0BWrUEczM1LM7XcWixiUOLs2jN1JAkDQxGAVev7+KZC+u4PiKMXNXyaXRL0NivQaAIUFjYuLFDcdlYlSBMEOJKrs6VeanCEsODURqGqdToEljFN9Q7pUJz6pc5hqOAPBf4ALgQUXESrxqLJlIoEByyYCBItAgMOEsBlnaHyIeFfiB38ll4mlelZ4nJkNdvKZAsbQ5lySSJnZkJb67V5oIwFsVr7J3j78yr6vmNjY1fe+KJJ34OwJnq75736z1oBQ8A6w8laDHRzupm/zd/5Mfel/+zv/Oazvf96TveWk+SRerXAJ8pTEmscWWkvXENzdklLMzNo7u9hXqrgaN3vAzDC5exM+iCOcCkDEpT1OsNiDgwAiiUgARYKGA8rAEaGWO2bnF4YQHHDi1gabmJ5cN1tFpzSNM6VBjdTh/r61u4crmPy6ubWFtvY1gyPDIUQrAksKqIBjURtExlCRO8wFi6Ue0Qp3miUBYIAUwaRbAqsEoQDeqV1SlTQRnvjIbh2rbrbGznV0cDt+4Dh3FqNiCpQo8x4zAYTVItKYi1zICY4ALVap7BI98fFKPt3e7gC91R+Z8xHH48CKiZwjvKDlNW62ztDJ5r0eDb51oLDySJOZwkHBOHNIwrwt3hcPiJy5cv/8LKysoHAaxHauymuHQAVgeA9YfzVILT0ZE77vzAj/yvn7825KW/8iPff+L7EqML4gMcOXClNlcEtLevYzjoYOnQYeR5DiQGt956Et6t4tJKF5lxKEMPWjokFGBMQM0oWo0EiwuzmFts4tDyIo4sL+Ho8iJmaikSY1EWObY7XVy9sIur1y/h+kYPWzsD7PZGGATAK8CUQIghIBjDEB/gNUTfeU8IPsRF4RAXiO20bngi24qq9mhEEVtRUKzUWEmDGnWaUN9DVrYGW5dWNh69ttH/UOndI2WerDKPQpZWuaSsGVRPJkR3kdApCdQlpnpgVucpH4zKo2YALb27NBgOz/ZHo6ebPVy5vM8AuRgAxZVGozz/ioUTbxAlttZozEH0zExOBOfW19d//emnn/6v3vsnsO/rD84BYP0R5LjOnztXGMNf/Ac/9ds/c+/pQ7d9++vcu5QK9qgB3iE1jFB5OA36u+j1Olg6dgw1qiOUJe44dRT9nuDCxS30RiPcspzh0NIijh1ZwqHlORw9vIjFhXmkNgGU0euPsNUe4OmN67i6uobNzT7a2wUGRYmhC3DKEBPXepiksnphSBAAAYoA7wVeFMErggIhECRIFTyhFbe0p0LfsymOXFP8PECJlMmoD4b6JdPabtk5f237c2cvr72vM8o/vLWF5wD092ylyumX74k7gQ+6ubn6ME19y3vjAPTsVkiSVtbb3kGvh2EFMrp187bNz8wcSgE7B2US8dU6N7WHo/wTVy+v/MKVlSsfBLAG3MQk4uAcANYfOdCqapCFhYVzX3zm6hNvfbD19qK0tZGSWEpIghIbRNeHxCKUgpWLl5HVmlhYXMah44fxpnfcjVtuuxurK9dx++0nsHjoEEySwDuPne02nrt4HWtXt7C21sbGThftfoluHlAKg6r9RYWFJAZqosmdqCAEAwRW1ehjRcooywKBLEoxkFB9nhciokh8j10Q9k0Jx86iiHoxNtWQT1BKyp0izS+vbD/7xNnV33n20tYvjzyewH6r4pt51ug5oECnUwDA5r4P9fovwC3tBxznwWwJAJjZiciFzY3tXz/z9Jlf8t4/eUNVdQBWB4B1gFkiQLvdzp+6cPVSb/im3Y31jWNluq31pE5ZkqmghLUE9UJKDGvr2N4Z4PxqD3h6HQsLizg818Spo7MIQfHUU2dx4cp1XN/qYnNngG5vhGFOUFgQM4ytQUwUbQZVBGZ458brNKo+AlQBRhBRFaKylOjCIgaFFxTes2pglQBANE0tZUmCdKp6HLs2jDMSozLBAAEqylQ68Vvd/Ppj59Y/9sXHLzy8PQqfArCFSk4wBRIvBBT05e8JL/T1FkQQALt5PvrYpUuXfnFl5frvVlzVQVV1AFgH5/mtoUJVy5mUPvqO19/3kbl09k8+98g5s7C4PLzzdCs7tpgkxo80hEICDIlmxLaO4Pu4uLKJJ97/FHa2HY4dWsT8bAOFc3BeEFCZ8pkmyFbOC0wogmi0UwnR0VNUfYg2M0GJxINKLyiF1QUh533bO/2ME39ZPFAGL1BdEtI3WdYTqYmAxBRgEoITQQqGjKOzREDCSkwaVKhUw92BaV+5NvzY5x+7+OvPXe98DMBFIrjplb8XX6R+DSfxMIZDv9/7yOc//8i/8t5/gYgK3R91fXAOAOvg7CsTovT6uR/9qd/6mW9928uG1y55dAeXV+6/Z3TnO157+PUvO52erEFTCgY+QH1wICglWQOaLmFj2MVo0+JWQ6hlM0BKIBH1EuJ0LnioAh6kLigFVXgFQRnimVwQlC6gKMPIeemUPqz5kK9JkLII/uki4FeKjp4HgKRpWmkib2fWO5hxXAAKRHDs49KxJTgX4lIxjKqyOrUkmvEoh1/v5lcff3brNz7x6OX/BOCJMUBUllzfUICw1hKRhsFgeNZ7/yQzFyJyUFUdANbBeRHH7QzCR3/+N8+cARoCFP0vXr566BNfXH3jn/jmO//421514u1HZ/LD4vukEuKqiBAAJrKpgg3KEEBBNKiSD1ErFbyQByMIwQtR6VScUO5c6HrvN8tSnXMC591ucPpUkPC4L/VCwOBaarKyb4rum9+M9sMPI7ztbbAbl2feBPBfYMGdTAqq1laCBzwBhqwGy1R41lITFJJSHlLpD2jryurOF558buVXz1/vvw/ASvTOm9jyfcNBwloLIu4651YRwyQOqqoDwDo4X8EpiGhVdVjtF1Pv4oZc/Te/+NwXvvB057Hv+mMnvueeY/X7zahf994ohGPCQgiUj0oa+gY8M5Wlh1fy3qn4gDIP0s2L4L34Hefpsvd6Ni/dc0XuL0CLEWCJU+7bwNfOrfV3AVRudnFC9/DDcTvnzJlDtaW6e6VlfTUxtQCBDwoWqfb0CKJCxAYomDA0MnLob/R6j1+4vPUrj59d+10AZ4loMLEp/v0BCAWALMuGw+HwI9evX/8IgPzAZeGPaIdz8BJ8/V4/ArSy8V1otcybvudtt37fa+5YeJshPbrVLe3j57dw8WqnJJPmswutDjPvOBe6ZSmXitx3nYR2GfRc4cKghN8pS3+l3Cy2O0B/D5i+7O9QAeBtgF07OftOJv2LAI4Ra1OVWsyyTEBiDXfY2h1jkkGj3izZJP1et/f42asbH+oMwucAdF9KL/TCwsLcaDSazfN8HTfoJg7OAWAdnK+N54KqJgDuuPfU7Ntfde/Jt5Ghl61stov1zd6ThpMLnKQrZemvDAvX7xfl+s5OMgS6DsAQcfqmL+J39YJlxsmTqGeYPeHFtxIyGQFLMHQbiDJVXSORq5zODPM8+O3uKO/3+2sAupV1+gE/dHAOAOuPDGZFURNUtQbg2FzT3JKmSamGL9Zqw92VFZR44dQWerHA9BWeaLyFd3vg4fC8J30AUQfnALD+aCPXnjnei3r99ffwd6y/D49/cA7O1+2Yg5fg637qpw/Pna6hSAYOwylguPHfg3NwDs5XePjgJfj6nmPLuHf5SO3v3XLnyXcDaN5QuUz/e3AOzsE5AKzf15PW6/Z1hvXtolg6eDkOzsH5+p4DHdbX5xAAPd5CK8tq9xeFW+/0io9ibzH4oKI6OAfnALBeWqfeQkNF88GoeN/l3vBxHCzlHpyDcwBYL8GjAJCgNUTufnkwzK+hi92D6urgHJyD81JvDQ94wYNzcH6Pzv8fz9MwKk93x5oAAAAASUVORK5CYII=";

function GoldBoxLogo({size=90, animate=true}) {
  return (
    <div style={{
      width:size, height:size,
      display:"flex", alignItems:"center", justifyContent:"center",
      position:"relative",
    }}>
      <img
        src={GOLDBOX_IMG}
        alt="Gold Box"
        style={{
          width: size * 1.15,
          height: "auto",
          objectFit: "contain",
          animation: animate
            ? "floatBoxImg 3.4s ease-in-out infinite"
            : "none",
          filter: animate
            ? `drop-shadow(0 0 16px rgba(245,166,35,0.85)) drop-shadow(0 0 40px rgba(245,166,35,0.45)) drop-shadow(0 8px 20px rgba(0,0,0,0.7))`
            : `drop-shadow(0 2px 6px rgba(245,166,35,0.5))`,
        }}
      />
      {animate && (
        <div style={{
          position:"absolute",
          bottom:"-12%", left:"10%", right:"10%",
          height: size*0.06,
          background:"radial-gradient(ellipse, rgba(245,166,35,0.45), transparent 70%)",
          filter:"blur(4px)",
          animation:"shadowImg 3.4s ease-in-out infinite",
        }}/>
      )}
      <style>{`
        @keyframes floatBoxImg {
          0%,100% { transform: translateY(0px) rotate(-1deg); }
          50%      { transform: translateY(-9px) rotate(1deg); }
        }
        @keyframes shadowImg {
          0%,100% { opacity:0.7; transform:scaleX(1); }
          50%      { opacity:0.3; transform:scaleX(0.65); }
        }
      `}</style>
    </div>
  );
}

// ── GRID BG ───────────────────────────────────────────────────────────────────
const GridBg = () => (
  <div style={{position:"fixed",inset:0,backgroundImage:`linear-gradient(${g(.022)} 1px,transparent 1px),linear-gradient(90deg,${g(.022)} 1px,transparent 1px)`,backgroundSize:"48px 48px",zIndex:0,pointerEvents:"none"}}/>
);

// ── FLOATING ICONS ────────────────────────────────────────────────────────────
function FloatIcons() {
  const icons = ["⚙","🔧","🔩","⚡","📐","🔬","🛢","🔑","📏","🪛"];
  return (
    <div style={{position:"fixed",inset:0,overflow:"hidden",zIndex:0,pointerEvents:"none"}}>
      {icons.map((ic,i)=>(
        <div key={i} style={{position:"absolute",fontSize:14+i%3*8,opacity:0.045,color:"#f5a623",
          left:`${(i*19+7)%95}%`, top:`${(i*17+5)%90}%`,
          animation:`floatUp ${8+i*1.3}s ${i*0.7}s linear infinite`}}>
          {ic}
        </div>
      ))}
      <style>{`
        @keyframes floatUp{0%{transform:translateY(0) rotate(0deg);opacity:.045}
          50%{opacity:.08}100%{transform:translateY(-120px) rotate(20deg);opacity:0}}
        @keyframes pulse{0%,100%{opacity:.3;transform:scale(1)}50%{opacity:.8;transform:scale(1.06)}}
        input::placeholder{color:rgba(255,255,255,.2)}
        select,select option{background:#0d1117;color:#fff}
        ::-webkit-scrollbar{width:5px}::-webkit-scrollbar-thumb{background:${g(.25)};border-radius:3px}
        ::-webkit-scrollbar-track{background:transparent}
      `}</style>
    </div>
  );
}

// ── COMPONENTES BASE ──────────────────────────────────────────────────────────
function GInput({label,value,onChange,placeholder,type="text",required}) {
  const [f,setF]=useState(false);
  return (
    <div style={{marginBottom:15}}>
      {label && <label style={{display:"block",color:g(.6),fontFamily:M,fontSize:10,letterSpacing:3,marginBottom:6}}>
        {label}{required&&<span style={{color:"#f55",marginLeft:4}}>*</span>}
      </label>}
      <input type={type} value={value} onChange={onChange} placeholder={placeholder}
        onFocus={()=>setF(true)} onBlur={()=>setF(false)}
        style={{width:"100%",background:g(.04),border:`1px solid ${f?g(.65):g(.2)}`,borderRadius:8,
          padding:"11px 14px",color:"#fff",fontFamily:M,fontSize:13,outline:"none",boxSizing:"border-box",transition:"border .2s"}}/>
    </div>
  );
}

function GSelect({label,value,onChange,options}) {
  return (
    <div style={{marginBottom:15}}>
      {label && <label style={{display:"block",color:g(.6),fontFamily:M,fontSize:10,letterSpacing:3,marginBottom:6}}>{label}</label>}
      <select value={value} onChange={onChange}
        style={{width:"100%",background:"#0d1117",border:`1px solid ${g(.25)}`,borderRadius:8,
          padding:"11px 14px",color:"#fff",fontFamily:M,fontSize:13,outline:"none",boxSizing:"border-box"}}>
        {options.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </div>
  );
}

// Botón de carga de foto con ref — sin label anidado
function PhotoUpload({photo, onPhoto, label="FOTO (opcional)"}) {
  const ref = useRef();
  return (
    <div style={{marginBottom:15}}>
      <div style={{color:g(.6),fontFamily:M,fontSize:10,letterSpacing:3,marginBottom:6}}>{label}</div>
      <div style={{display:"flex",alignItems:"center",gap:14,padding:"12px 16px",
        background:g(.04),border:`1px dashed ${g(.28)}`,borderRadius:8}}>
        <div style={{width:56,height:56,borderRadius:8,overflow:"hidden",flexShrink:0,
          border:`1px solid ${g(.2)}`,background:g(.08),display:"flex",alignItems:"center",justifyContent:"center",fontSize:26}}>
          {photo ? <img src={photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : "📷"}
        </div>
        <div style={{flex:1}}>
          <div style={{color:"rgba(255,255,255,.55)",fontFamily:M,fontSize:11,marginBottom:4}}>{photo?"Foto cargada ✓":"Sin foto aún"}</div>
          <div style={{color:"rgba(255,255,255,.25)",fontFamily:M,fontSize:9}}>JPG · PNG · WEBP</div>
        </div>
        <button type="button" onClick={()=>ref.current.click()}
          style={{background:g(.12),border:`1px solid ${g(.35)}`,borderRadius:7,padding:"8px 14px",
            color:"#f5a623",fontFamily:M,fontSize:10,cursor:"pointer",letterSpacing:1,whiteSpace:"nowrap"}}>
          {photo?"CAMBIAR":"SUBIR"}
        </button>
        <input ref={ref} type="file" accept="image/*" style={{display:"none"}}
          onChange={e=>{const f=e.target.files[0];if(f)readFile(f,onPhoto);e.target.value="";}}/>
      </div>
    </div>
  );
}

function Modal({title,onClose,children,width=520}) {
  return (
    <div style={{position:"fixed",inset:0,background:"rgba(0,0,0,.78)",zIndex:200,
      display:"flex",alignItems:"center",justifyContent:"center",backdropFilter:"blur(8px"}}
      onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
      <div style={{background:"#0d1117",border:`1px solid ${g(.3)}`,borderRadius:18,
        padding:30,width:`min(${width}px,93vw)`,maxHeight:"85vh",overflowY:"auto",
        boxShadow:`0 0 60px ${g(.12)},0 30px 80px rgba(0,0,0,.7)`}}>
        <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:22}}>
          <h3 style={{fontFamily:M,fontSize:15,color:"#fff",letterSpacing:3,margin:0}}>{title}</h3>
          <button onClick={onClose} style={{background:g(.1),border:`1px solid ${g(.2)}`,borderRadius:7,
            padding:"5px 11px",color:g(.8),fontFamily:M,fontSize:11,cursor:"pointer"}}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function BtnPrimary({onClick,children,style={}}) {
  return <button onClick={onClick} style={{background:"linear-gradient(135deg,#f5a623,#e8870a)",border:"none",borderRadius:8,
    padding:"11px 20px",color:"#000",fontFamily:M,fontSize:11,fontWeight:700,letterSpacing:2,
    cursor:"pointer",boxShadow:`0 0 18px ${g(.3)}`,...style}}>{children}</button>;
}
function BtnSecondary({onClick,children,style={}}) {
  return <button onClick={onClick} style={{background:"transparent",border:`1px solid ${g(.25)}`,borderRadius:8,
    padding:"11px 18px",color:g(.7),fontFamily:M,fontSize:11,cursor:"pointer",letterSpacing:2,...style}}>{children}</button>;
}

// ── LOGIN ─────────────────────────────────────────────────────────────────────
function LoginScreen({onLogin}) {
  const [user,setUser]=useState("");
  const [pass,setPass]=useState("");
  const [loading,setLoading]=useState(false);
  const [error,setError]=useState("");
  const handle=async()=>{
    if(!user.trim()||!pass.trim()){setError("Completá usuario y contraseña.");return;}
    setLoading(true); setError("");
    try {
      // Buscar usuario en Realtime Database por username
      const userData = await rtGet("usuarios/" + user.trim().toLowerCase().replace(/\s+/g,"_"));
      if(!userData){
        // Si no existe, verificar si es el superusuario por defecto
        if(user.trim().toLowerCase()==="admin" && pass.trim()==="master1599"){
          onLogin({name:"Yamil García", role:"superuser", specialty:"lubricacion", username:"admin"});
          return;
        }
        setError("Usuario no encontrado.");
        setLoading(false);
        return;
      }
      // Verificar contraseña
      const passHash = simpleHash(pass.trim());
      if(userData.passHash !== passHash){
        setError("Contraseña incorrecta.");
        setLoading(false);
        return;
      }
      if(!userData.active){
        setError("Usuario desactivado. Contactá al administrador.");
        setLoading(false);
        return;
      }
      onLogin({...userData});
    } catch(e){
      setError("Error al conectar. Intentá de nuevo.");
      setLoading(false);
    }
  };
  return (
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",
      position:"relative",background:"linear-gradient(135deg,#08090f,#0d1117,#080f14)"}}>
      <FloatIcons/><GridBg/>
      <div style={{position:"relative",zIndex:2,width:370,display:"flex",flexDirection:"column",alignItems:"center"}}>
        <div style={{marginBottom:8,position:"relative"}}>
          <GoldBoxLogo size={90} animate={true}/>
        </div>
        <h1 style={{fontFamily:M,fontSize:36,fontWeight:900,letterSpacing:9,color:"#f5a623",margin:"12px 0 4px",
          textShadow:`0 0 20px ${g(.9)},0 0 50px ${g(.5)},0 0 80px ${g(.2)}`,background:"linear-gradient(180deg,#ffe066 0%,#f5a623 45%,#c97a00 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent"}}>GOLD BOX</h1>
        <p style={{color:g(.4),fontFamily:M,fontSize:10,letterSpacing:5,marginBottom:36}}>INDUSTRIAL KNOWLEDGE SYSTEM</p>
        {/* === GLOW BEHIND FORM === */}
        <div style={{position:"absolute",inset:0,zIndex:1,pointerEvents:"none",
          background:"radial-gradient(ellipse 90% 60% at 50% 72%, rgba(245,166,35,0.22) 0%, rgba(200,120,0,0.08) 50%, transparent 75%)",
          filter:"blur(6px)"}}/>
        {/* card */}
        <div style={{width:"100%",position:"relative",zIndex:2,
          background:"rgba(255,255,255,.04)",
          border:`1px solid ${g(.3)}`,
          borderRadius:18,padding:28,
          backdropFilter:"blur(24px)",
          boxShadow:`0 20px 60px rgba(0,0,0,.6), 0 0 0 1px rgba(245,166,35,0.08) inset, 0 1px 0 rgba(255,235,100,0.2) inset, 0 0 100px rgba(245,166,35,0.12)`}}>
          <GInput label="USUARIO" value={user} onChange={e=>setUser(e.target.value)} placeholder="tu.usuario"/>
          <GInput label="CONTRASEÑA" value={pass} onChange={e=>setPass(e.target.value)} placeholder="••••••••" type="password"/>
          {error && (
            <div style={{color:"#f55",fontFamily:M,fontSize:11,marginBottom:12,padding:"8px 12px",
              background:"rgba(255,60,60,.08)",borderRadius:7,border:"1px solid rgba(255,60,60,.2)"}}>
              {error}
            </div>
          )}
          <BtnPrimary onClick={handle} style={{width:"100%",marginTop:4,padding:14}}>
            {loading?"VERIFICANDO...":"INGRESAR →"}
          </BtnPrimary>
        </div>
        <p style={{color:"rgba(255,255,255,.1)",fontFamily:M,fontSize:10,marginTop:20,letterSpacing:2}}>MINERÍA PATAGÓNICA © 2025</p>
      </div>
    </div>
  );
}


// ── WELCOME SCREEN ────────────────────────────────────────────────────────────
function WelcomeScreen({user, onContinue}) {
  const [show, setShow] = useState(false);
  useEffect(()=>{
    setTimeout(()=>setShow(true), 100);
    setTimeout(()=>onContinue(), 2800);
  },[]);
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#08090f,#0d1117)",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative"}}>
      <FloatIcons/><GridBg/>
      <div style={{position:"relative",zIndex:2,textAlign:"center",transition:"all 1s ease",
        opacity:show?1:0,transform:show?"translateY(0)":"translateY(30px)"}}>
        {/* Gold box icon */}
        <div style={{margin:"0 auto 24px",display:"flex",justifyContent:"center"}}><GoldBoxLogo size={100} animate={true}/></div>
        {/* Greeting */}
        <p style={{color:"rgba(255,255,255,.4)",fontFamily:M,fontSize:11,letterSpacing:6,marginBottom:12}}>
          ACCESO AUTORIZADO
        </p>
        <h1 style={{fontFamily:M,fontSize:28,fontWeight:900,letterSpacing:4,
          background:"linear-gradient(180deg,#ffe066 0%,#f5a623 50%,#c97a00 100%)",
          WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",
          filter:"drop-shadow(0 0 12px rgba(245,166,35,0.5))",margin:"0 0 10px"}}>
          BIENVENIDO{user.name&&user.name.slice(-1).toLowerCase()==="a"?"A":""}, {(user.name||"USUARIO").toUpperCase()}
        </h1>
        <p style={{color:"rgba(255,255,255,.25)",fontFamily:MX,fontSize:14,letterSpacing:2,marginBottom:32}}>
          Gold Box · Sistema Industrial de Conocimiento
        </p>
        {/* Loading bar */}
        <div style={{width:220,height:2,background:"rgba(255,255,255,.06)",borderRadius:2,margin:"0 auto",overflow:"hidden"}}>
          <div style={{height:"100%",background:"linear-gradient(90deg,#f5a623,#ffe066)",borderRadius:2,
            animation:"loadBar 2.5s ease-out forwards"}}/>
        </div>
        <p style={{color:"rgba(255,255,255,.18)",fontFamily:M,fontSize:9,letterSpacing:3,marginTop:14}}>CARGANDO SISTEMA...</p>
      </div>
      <style>{`
        @keyframes loadBar{from{width:0%}to{width:100%}}
      `}</style>
    </div>
  );
}

// ── SPECIALTY SELECTOR ────────────────────────────────────────────────────────
function SpecialtySelector({user,onSelect}) {
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(135deg,#08090f,#0d1117)",
      display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative"}}>
      <FloatIcons/><GridBg/>
      <div style={{position:"relative",zIndex:2,textAlign:"center",maxWidth:540,padding:"0 20px"}}>
        <p style={{color:g(.5),fontFamily:M,fontSize:11,letterSpacing:4,marginBottom:8}}>BIENVENIDO/A, {(user.name||"USUARIO").toUpperCase()}</p>
        <h2 style={{fontFamily:M,fontSize:20,color:"#fff",letterSpacing:4,marginBottom:6}}>SELECCIONÁ TU ESPECIALIDAD</h2>
        <p style={{color:"rgba(255,255,255,.22)",fontFamily:M,fontSize:11,marginBottom:36}}>La app filtrará los datos según tu área</p>
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14}}>
          {SPECIALTIES.map(sp=>(
            <button key={sp.id} onClick={()=>onSelect(sp)}
              style={{background:"rgba(255,255,255,.03)",border:`1px solid ${sp.color}30`,borderRadius:18,
                padding:"26px 18px",cursor:"pointer",display:"flex",flexDirection:"column",alignItems:"center",
                gap:10,transition:"all .3s",backdropFilter:"blur(10px)"}}
              onMouseEnter={e=>{e.currentTarget.style.background=`${sp.color}16`;e.currentTarget.style.borderColor=`${sp.color}77`;e.currentTarget.style.transform="translateY(-5px)";e.currentTarget.style.boxShadow=`0 12px 35px ${sp.color}28`;}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,255,255,.03)";e.currentTarget.style.borderColor=`${sp.color}30`;e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
              <span style={{fontSize:36}}>{sp.icon}</span>
              <span style={{color:sp.color,fontFamily:M,fontSize:11,fontWeight:700,letterSpacing:2}}>{sp.label.toUpperCase()}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── EQUIPO DETAIL ─────────────────────────────────────────────────────────────
function EquipoDetail({equipo,materiales,setMateriales,specialty,onBack,user,logAction}) {
  const [tab,setTab]       = useState("lubricantes");
  const [showAdd,setShowAdd] = useState(false);
  const [search,setSearch]   = useState("");

  const isSuperuser = user?.role === "superuser";

  const innerTabs = [
    {id:"lubricantes", label:"LUBRICANTES",  icon:"🛢️", types:["lubricante"]},
    {id:"herramientas",label:"HERRAMIENTAS", icon:"🔧", types:["herramienta"]},
    {id:"filtros",     label:"FILTROS",      icon:"🔩", types:["filtro"]},
    {id:"repuestos",   label:"REPUESTOS",    icon:"⚙️", types:["repuesto"]},
    {id:"componentes", label:"COMPONENTES",  icon:"⚡", types:["componente"]},
    {id:"novedades",   label:"NOVEDADES",    icon:"📝", types:[]},
  ];
  const current = innerTabs.find(t=>t.id===tab);

  // Materiales ya vinculados a este equipo en la pestaña actual
  const items = current.types.length
    ? materiales.filter(m=>
        current.types.includes(m.tipo) &&
        (m.equipoIds||[]).includes(equipo.id)
      )
    : [];

  // Materiales disponibles en el catálogo para agregar (misma especialidad, mismo tipo, aún no vinculados)
  const disponibles = materiales.filter(m=>
    m.specialty === specialty.id &&
    current.types.includes(m.tipo) &&
    !(m.equipoIds||[]).includes(equipo.id) &&
    (search === "" ||
      m.nombre.toLowerCase().includes(search.toLowerCase()) ||
      m.codigo.toLowerCase().includes(search.toLowerCase()))
  );

  const vincular = async (mat) => {
    const updated = {...mat, equipoIds:[...(mat.equipoIds||[]), equipo.id]};
    setMateriales(prev=>prev.map(m=>m.id===mat.id?updated:m)); // optimistic
    await saveDoc("materiales", mat.id, updated);
    logAction("asignacion","Asignó material",`${mat.nombre} → ${equipo.tag}`, user?.name);
  };

  const desvincular = async (mat) => {
    if(!isSuperuser) return;
    const updated = {...mat, equipoIds:(mat.equipoIds||[]).filter(id=>id!==equipo.id)};
    setMateriales(prev=>prev.map(m=>m.id===mat.id?updated:m)); // optimistic
    await saveDoc("materiales", mat.id, updated);
  };

  return (
    <div>
      {/* Modal agregar */}
      {showAdd && (
        <Modal title={`+ AGREGAR ${current.label} AL EQUIPO`} onClose={()=>{setShowAdd(false);setSearch("");}}>
          <GInput
            label="BUSCAR EN EL CATÁLOGO"
            value={search}
            onChange={e=>setSearch(e.target.value)}
            placeholder={`Nombre o código...`}
          />
          {disponibles.length === 0 ? (
            <div style={{textAlign:"center",padding:"28px 0",color:"rgba(255,255,255,.25)",fontFamily:M,fontSize:11,letterSpacing:2}}>
              {search ? "SIN RESULTADOS" : `NO HAY ${current.label} EN EL CATÁLOGO`}
              <div style={{marginTop:8,color:g(.35),fontSize:10,letterSpacing:1}}>
                Primero agregalos desde la sección Catálogo
              </div>
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:8,maxHeight:340,overflowY:"auto"}}>
              {disponibles.map(mat=>(
                <div key={mat.id} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 14px",
                  background:"rgba(255,255,255,.03)",borderRadius:10,border:`1px solid ${g(.1)}`}}>
                  <div style={{width:42,height:42,background:g(.08),borderRadius:8,overflow:"hidden",
                    display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>
                    {mat.photo ? <img src={mat.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : mat.icon}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{color:"#fff",fontFamily:MX,fontSize:13}}>{mat.nombre}</div>
                    <div style={{color:g(.5),fontFamily:M,fontSize:10}}>{mat.codigo} · {mat.stock}</div>
                  </div>
                  <button onClick={()=>{vincular(mat);}}
                    style={{background:"linear-gradient(135deg,#f5a623,#e8870a)",border:"none",borderRadius:7,
                      padding:"8px 16px",color:"#000",fontFamily:M,fontSize:10,fontWeight:700,
                      cursor:"pointer",letterSpacing:1,flexShrink:0}}>
                    + AGREGAR
                  </button>
                </div>
              ))}
            </div>
          )}
          <div style={{display:"flex",justifyContent:"flex-end",marginTop:16}}>
            <BtnSecondary onClick={()=>{setShowAdd(false);setSearch("");}}>CERRAR</BtnSecondary>
          </div>
        </Modal>
      )}

      <BtnSecondary onClick={onBack} style={{marginBottom:22,fontSize:10,padding:"7px 16px"}}>
        ← VOLVER A EQUIPOS
      </BtnSecondary>

      <div style={{background:"rgba(255,255,255,.03)",border:`1px solid ${g(.2)}`,borderRadius:18,overflow:"hidden"}}>
        {/* Header equipo */}
        <div style={{background:`linear-gradient(135deg,${g(.12)},${g(.05)})`,padding:"22px 26px",
          borderBottom:`1px solid ${g(.15)}`,display:"flex",alignItems:"center",gap:18}}>
          <div style={{width:80,height:80,background:g(.08),borderRadius:14,overflow:"hidden",
            border:`1px dashed ${g(.2)}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:36,flexShrink:0}}>
            {equipo.photo ? <img src={equipo.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : "⚙️"}
          </div>
          <div style={{flex:1}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:4}}>
              <span style={{color:"#f5a623",fontFamily:M,fontSize:20,fontWeight:900}}>{equipo.tag}</span>
              {equipo.subtag && <span style={{color:g(.6),fontFamily:M,fontSize:12,border:`1px solid ${g(.3)}`,borderRadius:6,padding:"2px 8px"}}>{equipo.subtag}</span>}
            </div>
            <div style={{color:"#fff",fontFamily:MX,fontSize:15,marginBottom:4}}>{equipo.nombre}</div>
            <div style={{color:"rgba(255,255,255,.25)",fontFamily:M,fontSize:10,letterSpacing:2}}>
              ÚLT. INTERVENCIÓN: {equipo.lastIntervention}
            </div>
          </div>
        </div>

        {/* Pestañas internas */}
        <div style={{display:"flex",borderBottom:`1px solid ${g(.1)}`,overflowX:"auto"}}>
          {innerTabs.map(t=>(
            <button key={t.id} onClick={()=>{setTab(t.id);setShowAdd(false);setSearch("");}}
              style={{padding:"13px 20px",background:tab===t.id?g(.1):"transparent",border:"none",
                borderBottom:tab===t.id?`2px solid #f5a623`:"2px solid transparent",
                color:tab===t.id?"#f5a623":"rgba(255,255,255,.3)",
                fontFamily:M,fontSize:10,letterSpacing:2,cursor:"pointer",whiteSpace:"nowrap",transition:"all .2s"}}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Contenido de la pestaña */}
        <div style={{padding:22}}>

          {/* Botón agregar — solo si no es novedades */}
          {tab !== "novedades" && (
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
              <span style={{color:"rgba(255,255,255,.25)",fontFamily:M,fontSize:10,letterSpacing:2}}>
                {items.length} {current.label.toLowerCase()} asignado(s)
              </span>
              <BtnPrimary onClick={()=>{setShowAdd(true);setSearch("");}} style={{fontSize:10,padding:"8px 18px"}}>
                + AGREGAR {current.label.slice(0,-1)}
              </BtnPrimary>
            </div>
          )}

          {/* Lista de materiales vinculados */}
          {tab !== "novedades" && items.length === 0 && (
            <div style={{textAlign:"center",padding:"32px 0",color:"rgba(255,255,255,.18)",fontFamily:M,fontSize:11,letterSpacing:2}}>
              SIN {current.label} ASIGNADOS
              <div style={{marginTop:6,color:g(.3),fontSize:10}}>
                Usá el botón + para agregar desde el catálogo
              </div>
            </div>
          )}

          {items.map(mat=>(
            <div key={mat.id} style={{display:"flex",alignItems:"center",gap:14,padding:"13px 15px",
              background:"rgba(255,255,255,.02)",borderRadius:10,marginBottom:8,border:`1px solid ${g(.08)}`}}>
              <div style={{width:46,height:46,background:g(.07),borderRadius:9,overflow:"hidden",
                border:`1px dashed ${g(.15)}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
                {mat.photo ? <img src={mat.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/> : mat.icon}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{color:"#fff",fontFamily:MX,fontSize:13,marginBottom:2}}>{mat.nombre}</div>
                <div style={{color:g(.55),fontFamily:M,fontSize:10,letterSpacing:1}}>{mat.codigo}</div>
              </div>
              <div style={{textAlign:"center",background:g(.07),borderRadius:8,border:`1px solid ${g(.15)}`,padding:"5px 13px",flexShrink:0}}>
                <div style={{color:g(.4),fontFamily:M,fontSize:8,letterSpacing:2}}>ALMACÉN</div>
                <div style={{color:"#f5a623",fontFamily:M,fontSize:12}}>{mat.stock}</div>
              </div>
              {isSuperuser && (
                <button onClick={()=>desvincular(mat)} title="Quitar de este equipo"
                  style={{background:"rgba(255,50,50,.08)",border:"1px solid rgba(255,50,50,.2)",borderRadius:7,
                    padding:"6px 10px",color:"rgba(255,100,100,.7)",fontFamily:M,fontSize:11,cursor:"pointer",flexShrink:0}}>
                  ✕
                </button>
              )}
            </div>
          ))}

          {/* Pestaña Novedades */}
          {tab === "novedades" && (
            <div>
              <div style={{color:"rgba(255,255,255,.2)",fontFamily:M,fontSize:11,letterSpacing:2,
                textAlign:"center",padding:"28px 0 14px"}}>
                REGISTRO DE NOVEDADES / ÚLTIMAS INTERVENCIONES
              </div>
              {[
                {fecha:"15/04/2025",nota:"Cambio de aceite. Se detectó leve contaminación por agua.",user:"Y. García"},
                {fecha:"20/03/2025",nota:"Cambio de filtro respiro. Sin novedades.",user:"Y. García"},
              ].map((n,i)=>(
                <div key={i} style={{padding:"13px 17px",background:"rgba(255,255,255,.02)",borderRadius:10,
                  marginBottom:8,border:`1px solid ${g(.08)}`}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
                    <span style={{color:g(.6),fontFamily:M,fontSize:10}}>{n.fecha}</span>
                    <span style={{color:"rgba(255,255,255,.25)",fontFamily:M,fontSize:10}}>{n.user}</span>
                  </div>
                  <div style={{color:"rgba(255,255,255,.7)",fontFamily:MX,fontSize:12}}>{n.nota}</div>
                </div>
              ))}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

// ── EQUIPO CARD (componente separado para poder usar useRef correctamente) ────
function EquipoCard({eq, onSelect, onPhotoChange}) {
  const fileRef = useRef();
  return (
    <div style={{background:"rgba(255,255,255,.03)",border:`1px solid ${g(.15)}`,borderRadius:16,overflow:"hidden",transition:"all .3s"}}
      onMouseEnter={e=>{e.currentTarget.style.borderColor=g(.45);e.currentTarget.style.transform="translateY(-4px)";e.currentTarget.style.boxShadow=`0 12px 40px ${g(.14)}`;}}
      onMouseLeave={e=>{e.currentTarget.style.borderColor=g(.15);e.currentTarget.style.transform="translateY(0)";e.currentTarget.style.boxShadow="none";}}>
      {/* Área de foto */}
      <div style={{height:108,background:`linear-gradient(135deg,${g(.06)},${g(.1)})`,display:"flex",alignItems:"center",justifyContent:"center",borderBottom:`1px solid ${g(.1)}`,position:"relative",overflow:"hidden",cursor:"pointer"}}
        onClick={()=>onSelect(eq)}>
        {eq.photo
          ? <img src={eq.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>
          : <span style={{fontSize:36,opacity:.28}}>⚙️</span>}
        <button onClick={e=>{e.stopPropagation();fileRef.current.click();}}
          style={{position:"absolute",bottom:8,right:8,background:"rgba(0,0,0,.75)",borderRadius:6,padding:"4px 10px",
            border:`1px solid ${g(.4)}`,cursor:"pointer",color:g(.9),fontFamily:M,fontSize:8,letterSpacing:1}}>
          📷 {eq.photo?"CAMBIAR":"FOTO"}
        </button>
        <input ref={fileRef} type="file" accept="image/*" style={{display:"none"}}
          onChange={e=>{const f=e.target.files[0];if(f)readFile(f,onPhotoChange);e.target.value="";}}/>
      </div>
      {/* Info */}
      <div style={{padding:14,cursor:"pointer"}} onClick={()=>onSelect(eq)}>
        <div style={{display:"flex",alignItems:"baseline",gap:7,marginBottom:4}}>
          <span style={{color:"#f5a623",fontFamily:M,fontSize:13,fontWeight:700}}>{eq.tag}</span>
          {eq.subtag&&<span style={{color:g(.5),fontFamily:M,fontSize:10,border:`1px solid ${g(.2)}`,borderRadius:4,padding:"1px 5px"}}>{eq.subtag}</span>}
        </div>
        <div style={{color:"rgba(255,255,255,.62)",fontFamily:MX,fontSize:12,marginBottom:9}}>{eq.nombre}</div>
        <div style={{display:"flex",justifyContent:"space-between"}}>
          <span style={{color:"rgba(255,255,255,.2)",fontFamily:M,fontSize:9,letterSpacing:1}}>ÚLT. INT.</span>
          <span style={{color:g(.55),fontFamily:M,fontSize:10}}>{eq.lastIntervention}</span>
        </div>
      </div>
    </div>
  );
}

// ── EQUIPOS TAB ───────────────────────────────────────────────────────────────
function EquiposTab({equipos,setEquipos,materiales,setMateriales,specialty,user,logAction}) {
  const [selected,setSelected]=useState(null);
  const [showModal,setShowModal]=useState(false);
  const [form,setForm]=useState({tag:"",subtag:"",nombre:"",photo:null});
  const [err,setErr]=useState("");
  const [busqueda,setBusqueda]=useState("");
  const [filtroTexto,setFiltroTexto]=useState("");

  const norm = s => s.toLowerCase().replace(/\s+/g,"");
  const filtered = equipos
    .filter(e=>e.specialty===specialty.id)
    .filter(e=>{
      if(!filtroTexto) return true;
      const q = filtroTexto.toLowerCase();
      const qn = norm(filtroTexto);
      return (
        norm(e.tag).includes(qn) ||
        e.tag.toLowerCase().includes(q) ||
        e.nombre.toLowerCase().includes(q) ||
        (e.subtag&&e.subtag.toLowerCase().includes(q))
      );
    });

  const save=async()=>{
    if(!form.tag.trim()||!form.nombre.trim()){setErr("El TAG y el Nombre son obligatorios.");return;}
    const newEq = {id:String(Date.now()),tag:form.tag.trim(),subtag:form.subtag.trim(),nombre:form.nombre.trim(),specialty:specialty.id,lastIntervention:"—",photo:form.photo||null};
    setEquipos(prev=>[...prev, newEq]); // optimistic update
    await saveDoc("equipos", newEq.id, newEq);
    logAction("equipo","Cargó equipo",`${form.tag.trim()} — ${form.nombre.trim()}`, user?.name);
    setForm({tag:"",subtag:"",nombre:"",photo:null});setErr("");setShowModal(false);
  };

  if(selected) return <EquipoDetail equipo={selected} materiales={materiales} setMateriales={setMateriales} specialty={specialty} onBack={()=>setSelected(null)} user={user} logAction={logAction}/>;

  return (
    <div>
      {showModal&&(
        <Modal title="+ NUEVO EQUIPO" onClose={()=>{setShowModal(false);setErr("");setBusqueda("");}}>
          {/* Buscador del catálogo de equipos */}
          <div style={{marginBottom:16}}>
            <label style={{display:"block",color:g(.6),fontFamily:M,fontSize:10,letterSpacing:3,marginBottom:6}}>
              BUSCAR EQUIPO DEL YACIMIENTO
            </label>
            <input
              value={busqueda}
              onChange={e=>setBusqueda(e.target.value)}
              placeholder="Escribí TAG o nombre... ej: 206 RL, MOLINO, CINTA"
              style={{width:"100%",background:g(.06),border:`1px solid ${g(.3)}`,borderRadius:8,
                padding:"11px 14px",color:"#fff",fontFamily:M,fontSize:12,outline:"none",boxSizing:"border-box"}}
            />
            {/* Resultados */}
            {busqueda.length >= 1 && (()=>{
              // Normalizar: quitar espacios para comparar sin importar formato
              const norm = s => s.toLowerCase().replace(/\s+/g,'');
              const q    = busqueda.toLowerCase().trim();
              const qn   = norm(busqueda);
              const results = EQUIPOS_DB.filter(e=>
                norm(e.tag).includes(qn) ||
                e.tag.toLowerCase().includes(q) ||
                e.nombre.toLowerCase().includes(q)
              ).slice(0,10);
              return results.length > 0 ? (
                <div style={{marginTop:6,background:"#0d1117",border:`1px solid ${g(.25)}`,borderRadius:8,overflow:"hidden",maxHeight:200,overflowY:"auto"}}>
                  {results.map((eq,i)=>(
                    <div key={i} onClick={()=>{setForm(p=>({...p,tag:eq.tag,nombre:eq.nombre}));setBusqueda("");}}
                      style={{padding:"10px 14px",cursor:"pointer",borderBottom:`1px solid ${g(.08)}`,transition:"background .15s"}}
                      onMouseEnter={e=>e.currentTarget.style.background=g(.08)}
                      onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                      <span style={{color:"#f5a623",fontFamily:M,fontSize:12,fontWeight:700}}>{eq.tag}</span>
                      <span style={{color:"rgba(255,255,255,.45)",fontFamily:M,fontSize:11,marginLeft:10}}>{eq.nombre}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{marginTop:6,padding:"8px 14px",color:"rgba(255,255,255,.25)",fontFamily:M,fontSize:11}}>
                  Sin resultados — podés cargarlo manualmente abajo
                </div>
              );
            })()}
          </div>

          <div style={{height:1,background:g(.1),marginBottom:16}}/>
          <div style={{color:g(.4),fontFamily:M,fontSize:9,letterSpacing:3,marginBottom:12}}>O CARGÁ MANUALMENTE</div>

          <GInput label="NOMBRE DEL EQUIPO" value={form.nombre} onChange={e=>setForm(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Reductor Principal" required/>
          <GInput label="TAG / ÁREA" value={form.tag} onChange={e=>setForm(p=>({...p,tag:e.target.value}))} placeholder="Ej: 206 RL 101" required/>
          <GInput label="SUBTAG (opcional)" value={form.subtag} onChange={e=>setForm(p=>({...p,subtag:e.target.value}))} placeholder="Ej: R01, R02"/>
          <PhotoUpload photo={form.photo} onPhoto={ph=>setForm(p=>({...p,photo:ph}))} label="FOTO DE PORTADA DEL EQUIPO"/>
          {err&&<div style={{color:"#f55",fontFamily:M,fontSize:11,marginBottom:12,padding:"8px 12px",background:"rgba(255,60,60,.08)",borderRadius:7,border:"1px solid rgba(255,60,60,.2)"}}>{err}</div>}
          <div style={{display:"flex",gap:10,marginTop:6}}>
            <BtnSecondary onClick={()=>{setShowModal(false);setErr("");}}>CANCELAR</BtnSecondary>
            <BtnPrimary onClick={save} style={{flex:1}}>GUARDAR EQUIPO</BtnPrimary>
          </div>
        </Modal>
      )}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
        <div>
          <h2 style={{fontFamily:M,fontSize:19,color:"#fff",letterSpacing:4,margin:0}}>EQUIPOS</h2>
          <p style={{color:"rgba(255,255,255,.3)",fontFamily:M,fontSize:11,marginTop:3}}>
            {specialty.label} · {filtered.length} equipo(s){filtroTexto ? ` encontrado(s)` : ""}
          </p>
        </div>
        <BtnPrimary onClick={()=>setShowModal(true)}>+ NUEVO EQUIPO</BtnPrimary>
      </div>

      {/* Buscador de equipos */}
      <div style={{position:"relative",marginBottom:22}}>
        <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",
          color:g(.4),fontSize:16,pointerEvents:"none"}}>🔍</div>
        <input
          value={filtroTexto}
          onChange={e=>setFiltroTexto(e.target.value)}
          placeholder="Buscar equipo por TAG, nombre o subtag... ej: 206 RL, MOLINO, CINTA"
          style={{width:"100%",background:"rgba(255,255,255,.04)",
            border:`1px solid ${filtroTexto?g(.5):g(.18)}`,borderRadius:10,
            padding:"12px 14px 12px 42px",color:"#fff",fontFamily:M,fontSize:12,
            outline:"none",boxSizing:"border-box",transition:"border .2s"}}
          onFocus={e=>e.target.style.borderColor=g(.55)}
          onBlur={e=>e.target.style.borderColor=filtroTexto?g(.5):g(.18)}
        />
        {filtroTexto && (
          <button onClick={()=>setFiltroTexto("")}
            style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
              background:"transparent",border:"none",color:g(.5),fontSize:16,cursor:"pointer"}}>
            ✕
          </button>
        )}
      </div>

      {/* Sin resultados */}
      {filtered.length===0 && filtroTexto && (
        <div style={{textAlign:"center",padding:"48px 0",color:"rgba(255,255,255,.2)",fontFamily:M,fontSize:12,letterSpacing:2}}>
          SIN EQUIPOS QUE COINCIDAN CON "{filtroTexto.toUpperCase()}"
          <div style={{marginTop:8,color:g(.3),fontSize:10}}>
            Probá con otra búsqueda o cargá el equipo con + NUEVO EQUIPO
          </div>
        </div>
      )}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(230px,1fr))",gap:16}}>
        {filtered.map(eq=>(
          <EquipoCard key={eq.id} eq={eq} onSelect={setSelected} onPhotoChange={ph=>setEquipos(prev=>prev.map(x=>x.id===eq.id?{...x,photo:ph}:x))}/>
        ))}
        <div onClick={()=>setShowModal(true)} style={{background:"rgba(255,255,255,.01)",border:`1px dashed ${g(.12)}`,borderRadius:16,minHeight:190,
          display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:7,cursor:"pointer",transition:"all .2s"}}
          onMouseEnter={e=>{e.currentTarget.style.borderColor=g(.3);e.currentTarget.style.background=g(.03);}}
          onMouseLeave={e=>{e.currentTarget.style.borderColor=g(.12);e.currentTarget.style.background="rgba(255,255,255,.01)";}}>
          <span style={{fontSize:24,opacity:.28}}>+</span>
          <span style={{color:g(.28),fontFamily:M,fontSize:9,letterSpacing:3}}>NUEVO EQUIPO</span>
        </div>
      </div>
    </div>
  );
}

// ── CATALOGO TAB ──────────────────────────────────────────────────────────────
function CatalogoTab({materiales,setMateriales,specialty,user,logAction}) {
  const [filter,setFilter]=useState("todos");
  const [showModal,setShowModal]=useState(false);
  const [form,setForm]=useState({nombre:"",codigo:"",tipo:"lubricante",stock:"",photo:null});
  const [err,setErr]=useState("");

  const filtered=materiales.filter(m=>m.specialty===specialty.id).filter(m=>filter==="todos"||m.tipo===filter);

  const save=async()=>{
    if(!form.nombre.trim()||!form.codigo.trim()){setErr("El Nombre y el Código son obligatorios.");return;}
    const icons={lubricante:"🛢️",filtro:"🔩",herramienta:"🔧",componente:"⚡",repuesto:"⚙️"};
    const newMat = {id:String(Date.now()),nombre:form.nombre.trim(),codigo:form.codigo.trim(),tipo:form.tipo,specialty:specialty.id,stock:form.stock||"—",icon:icons[form.tipo]||"📦",photo:form.photo||null,equipoIds:[]};
    setMateriales(prev=>[...prev, newMat]); // optimistic update
    await saveDoc("materiales", newMat.id, newMat);
    logAction("material","Cargó material",`${form.nombre.trim()} (${form.codigo.trim()})`, user?.name);
    setForm({nombre:"",codigo:"",tipo:"lubricante",stock:"",photo:null});setErr("");setShowModal(false);
  };

  const filterBtns=[{v:"todos",l:"TODOS"},{v:"lubricante",l:"LUBRICANTES"},{v:"filtro",l:"FILTROS"},{v:"herramienta",l:"HERRAMIENTAS"},{v:"repuesto",l:"REPUESTOS"},{v:"componente",l:"COMPONENTES"}];

  return (
    <div>
      {showModal&&(
        <Modal title="+ NUEVO MATERIAL" onClose={()=>{setShowModal(false);setErr("");}}>
          <GInput label="NOMBRE DEL MATERIAL" value={form.nombre} onChange={e=>setForm(p=>({...p,nombre:e.target.value}))} placeholder="Ej: Aceite ISO VG 220" required/>
          <GInput label="CÓDIGO / N° DE MATERIAL (ALMACÉN)" value={form.codigo} onChange={e=>setForm(p=>({...p,codigo:e.target.value}))} placeholder="Ej: MAT-001" required/>
          <GSelect label="TIPO" value={form.tipo} onChange={e=>setForm(p=>({...p,tipo:e.target.value}))} options={[
            {value:"lubricante",label:"Lubricante"},{value:"filtro",label:"Filtro"},{value:"herramienta",label:"Herramienta"},{value:"repuesto",label:"Repuesto"},{value:"componente",label:"Componente"}]}/>
          <GInput label="STOCK EN ALMACÉN (opcional)" value={form.stock} onChange={e=>setForm(p=>({...p,stock:e.target.value}))} placeholder="Ej: 5 unid"/>
          <PhotoUpload photo={form.photo} onPhoto={ph=>setForm(p=>({...p,photo:ph}))} label="FOTO DEL MATERIAL"/>
          {err&&<div style={{color:"#f55",fontFamily:M,fontSize:11,marginBottom:12,padding:"8px 12px",background:"rgba(255,60,60,.08)",borderRadius:7,border:"1px solid rgba(255,60,60,.2)"}}>{err}</div>}
          <div style={{display:"flex",gap:10,marginTop:6}}>
            <BtnSecondary onClick={()=>{setShowModal(false);setErr("");}}>CANCELAR</BtnSecondary>
            <BtnPrimary onClick={save} style={{flex:1}}>GUARDAR MATERIAL</BtnPrimary>
          </div>
        </Modal>
      )}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22}}>
        <div>
          <h2 style={{fontFamily:M,fontSize:19,color:"#fff",letterSpacing:4,margin:0}}>CATÁLOGO</h2>
          <p style={{color:"rgba(255,255,255,.3)",fontFamily:M,fontSize:11,marginTop:3}}>Materiales · {specialty.label}</p>
        </div>
        <BtnPrimary onClick={()=>setShowModal(true)}>+ NUEVO MATERIAL</BtnPrimary>
      </div>
      <div style={{display:"flex",flexWrap:"wrap",gap:7,marginBottom:20}}>
        {filterBtns.map(f=>(
          <button key={f.v} onClick={()=>setFilter(f.v)}
            style={{background:filter===f.v?g(.15):"transparent",border:`1px solid ${filter===f.v?g(.55):g(.14)}`,borderRadius:20,
              padding:"5px 14px",color:filter===f.v?"#f5a623":"rgba(255,255,255,.32)",fontFamily:M,fontSize:10,letterSpacing:2,cursor:"pointer",transition:"all .2s"}}>
            {f.l}
          </button>
        ))}
      </div>
      {filtered.length===0&&<div style={{textAlign:"center",padding:"46px 0",color:"rgba(255,255,255,.18)",fontFamily:M,fontSize:11,letterSpacing:2}}>SIN RESULTADOS</div>}
      <div style={{display:"flex",flexDirection:"column",gap:9}}>
        {filtered.map(mat=>(
          <div key={mat.id} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",background:"rgba(255,255,255,.02)",borderRadius:12,border:`1px solid ${g(.1)}`,transition:"all .2s"}}
            onMouseEnter={e=>{e.currentTarget.style.borderColor=g(.3);e.currentTarget.style.background=g(.04);}}
            onMouseLeave={e=>{e.currentTarget.style.borderColor=g(.1);e.currentTarget.style.background="rgba(255,255,255,.02)";}}>
            <div style={{width:50,height:50,background:g(.07),borderRadius:9,overflow:"hidden",border:`1px dashed ${g(.2)}`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:22,flexShrink:0}}>
              {mat.photo?<img src={mat.photo} alt="" style={{width:"100%",height:"100%",objectFit:"cover"}}/>:mat.icon}
            </div>
            <div style={{flex:1,minWidth:0}}>
              <div style={{color:"#fff",fontFamily:MX,fontSize:13,marginBottom:2}}>{mat.nombre}</div>
              <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                <span style={{color:g(.6),fontFamily:M,fontSize:10,letterSpacing:1}}>{mat.codigo}</span>
                <span style={{color:"rgba(255,255,255,.18)",fontFamily:M,fontSize:10}}>·</span>
                <span style={{color:"rgba(255,255,255,.28)",fontFamily:M,fontSize:10,letterSpacing:1}}>{TIPO_LABELS[mat.tipo]||mat.tipo}</span>
              </div>
            </div>
            <div style={{textAlign:"center",padding:"6px 14px",background:g(.07),borderRadius:8,border:`1px solid ${g(.15)}`,flexShrink:0}}>
              <div style={{color:g(.4),fontFamily:M,fontSize:8,letterSpacing:2}}>ALMACÉN</div>
              <div style={{color:"#f5a623",fontFamily:M,fontSize:12}}>{mat.stock}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ── HISTORIAL TAB ─────────────────────────────────────────────────────────────
function HistorialTab({specialty}) {
  const entries=[
    {equipo:"206 RL 101",accion:"Cambio de aceite ISO VG 220",fecha:"15/04/2025",user:"Y. García",icon:"🛢️"},
    {equipo:"221 AG 101",accion:"Engrase rodamiento con Grasa NLGI 2",fecha:"02/05/2025",user:"M. López",icon:"🔧"},
    {equipo:"206 RL 101",accion:"Cambio filtro respiro FIL-003",fecha:"20/03/2025",user:"Y. García",icon:"🔩"},
    {equipo:"221 AG 101",accion:"Completar nivel aceite caja reductora",fecha:"10/03/2025",user:"Y. García",icon:"🛢️"},
  ].filter(()=>specialty.id==="lubricacion");
  return (
    <div>
      <h2 style={{fontFamily:M,fontSize:19,color:"#fff",letterSpacing:4,marginBottom:22}}>HISTORIAL DE INTERVENCIONES</h2>
      {entries.length===0&&<div style={{textAlign:"center",padding:"46px 0",color:"rgba(255,255,255,.18)",fontFamily:M,fontSize:11,letterSpacing:2}}>SIN REGISTROS PARA ESTA ESPECIALIDAD</div>}
      {entries.map((h,i)=>(
        <div key={i} style={{display:"flex",gap:14,padding:"14px 18px",background:"rgba(255,255,255,.02)",borderRadius:12,border:`1px solid ${g(.08)}`,marginBottom:9}}>
          <div style={{width:40,height:40,background:g(.1),borderRadius:9,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,flexShrink:0}}>{h.icon}</div>
          <div style={{flex:1}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",gap:8}}>
              <div>
                <div style={{color:"#f5a623",fontFamily:M,fontSize:11,letterSpacing:1,marginBottom:2}}>{h.equipo}</div>
                <div style={{color:"rgba(255,255,255,.68)",fontFamily:M,fontSize:12,marginBottom:3}}>{h.accion}</div>
                <div style={{color:"rgba(255,255,255,.22)",fontFamily:M,fontSize:10}}>por {h.user}</div>
              </div>
              <span style={{color:g(.5),fontFamily:M,fontSize:11,flexShrink:0}}>{h.fecha}</span>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── USUARIOS TAB ──────────────────────────────────────────────────────────────
function UsuariosTab({usuarios,setUsuarios}) {
  const [showModal,setShowModal]=useState(false);
  const [editUser,setEditUser]=useState(null);
  const [form,setForm]=useState({name:"",user:"",role:"viewer",specialty:"lubricacion",pass:""});
  const [err,setErr]=useState("");

  const openNew=()=>{setForm({name:"",user:"",role:"viewer",specialty:"lubricacion",pass:""});setEditUser(null);setErr("");setShowModal(true);};
  const openEdit=(u)=>{setForm({name:u.name,user:u.user,role:u.role,specialty:u.specialty,pass:""});setEditUser(u);setErr("");setShowModal(true);};

  const save=()=>{
    if(!form.name.trim()||!form.user.trim()){setErr("Nombre y usuario son obligatorios.");return;}
    if(editUser){
      const updated = {...editUser, ...form, name:form.name.trim(), user:form.user.trim()};
      if(form.pass.trim()) updated.passHash = simpleHash(form.pass.trim());
      delete updated.pass;
      setUsuarios(prev=>prev.map(u=>u.id===editUser.id?updated:u));
      // Guardar en Realtime DB
      const ukey = form.user.trim().toLowerCase().replace(/\s+/g,"_");
      rtSet("usuarios/"+ukey, {...updated});
    } else {
      if(!form.pass.trim()){setErr("La contraseña es obligatoria.");return;}
      const newU = {
        id:Date.now(), name:form.name.trim(), user:form.user.trim(),
        role:form.role, specialty:form.specialty, active:true,
        passHash: simpleHash(form.pass.trim()),
        username: form.user.trim().toLowerCase().replace(/\s+/g,"_"),
      };
      setUsuarios(prev=>[...prev, newU]);
      // Guardar en Realtime DB
      const ukey = form.user.trim().toLowerCase().replace(/\s+/g,"_");
      rtSet("usuarios/"+ukey, newU);
    }
    setShowModal(false);setErr("");
  };

  const toggleActive=(id)=>setUsuarios(prev=>prev.map(u=>u.id===id?{...u,active:!u.active}:u));
  const deleteUser=(id)=>setUsuarios(prev=>prev.filter(u=>u.id!==id));

  const roleInfo=(id)=>ROLES.find(r=>r.id===id)||ROLES[2];
  const spInfo=(id)=>SPECIALTIES.find(s=>s.id===id)||SPECIALTIES[0];

  return (
    <div>
      {showModal&&(
        <Modal title={editUser?"✏️ EDITAR USUARIO":"+ NUEVO USUARIO"} onClose={()=>{setShowModal(false);setErr("");}}>
          <GInput label="NOMBRE COMPLETO" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} placeholder="Ej: Juan Pérez" required/>
          <GInput label="NOMBRE DE USUARIO" value={form.user} onChange={e=>setForm(p=>({...p,user:e.target.value}))} placeholder="Ej: juan.perez" required/>
          <GInput label={editUser?"NUEVA CONTRASEÑA (vacío para no cambiar)":"CONTRASEÑA DE ACCESO"} value={form.pass} onChange={e=>setForm(p=>({...p,pass:e.target.value}))} placeholder={editUser?"•••••••• (opcional)":"Contraseña inicial"} type="password"/>
          <GSelect label="NIVEL DE ACCESO" value={form.role} onChange={e=>setForm(p=>({...p,role:e.target.value}))} options={ROLES.map(r=>({value:r.id,label:`${r.badge} ${r.label} — ${r.desc}`}))}/>
          <GSelect label="ESPECIALIDAD" value={form.specialty} onChange={e=>setForm(p=>({...p,specialty:e.target.value}))} options={SPECIALTIES.map(s=>({value:s.id,label:`${s.icon} ${s.label}`}))}/>
          {/* Role preview */}
          <div style={{padding:"12px 14px",background:g(.05),borderRadius:9,border:`1px solid ${g(.15)}`,marginBottom:14}}>
            <div style={{color:g(.5),fontFamily:M,fontSize:9,letterSpacing:3,marginBottom:6}}>PERMISOS DEL NIVEL</div>
            {form.role==="superuser"&&<div style={{color:"rgba(255,255,255,.6)",fontFamily:M,fontSize:10,lineHeight:1.7}}>✅ Cargar y editar equipos y materiales<br/>✅ Gestionar usuarios<br/>✅ Aprobar modificaciones<br/>✅ Ver todo</div>}
            {form.role==="editor"&&<div style={{color:"rgba(255,255,255,.6)",fontFamily:M,fontSize:10,lineHeight:1.7}}>✅ Cargar equipos y materiales<br/>✅ Subir fotos<br/>⚠️ Editar requiere aprobación<br/>❌ No gestiona usuarios</div>}
            {form.role==="viewer"&&<div style={{color:"rgba(255,255,255,.6)",fontFamily:M,fontSize:10,lineHeight:1.7}}>✅ Ver equipos y catálogo<br/>❌ No puede cargar datos<br/>❌ No puede editar<br/>❌ No gestiona usuarios</div>}
          </div>
          {err&&<div style={{color:"#f55",fontFamily:M,fontSize:11,marginBottom:12,padding:"8px 12px",background:"rgba(255,60,60,.08)",borderRadius:7,border:"1px solid rgba(255,60,60,.2)"}}>{err}</div>}
          <div style={{display:"flex",gap:10,marginTop:4}}>
            <BtnSecondary onClick={()=>{setShowModal(false);setErr("");}}>CANCELAR</BtnSecondary>
            <BtnPrimary onClick={save} style={{flex:1}}>{editUser?"GUARDAR CAMBIOS":"CREAR USUARIO"}</BtnPrimary>
          </div>
        </Modal>
      )}

      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:26}}>
        <div>
          <h2 style={{fontFamily:M,fontSize:19,color:"#fff",letterSpacing:4,margin:0}}>GESTIÓN DE USUARIOS</h2>
          <p style={{color:"rgba(255,255,255,.3)",fontFamily:M,fontSize:11,marginTop:3}}>{usuarios.length} usuario(s) registrado(s)</p>
        </div>
        <BtnPrimary onClick={openNew}>+ NUEVO USUARIO</BtnPrimary>
      </div>

      {/* Role legend */}
      <div style={{display:"flex",gap:10,flexWrap:"wrap",marginBottom:22}}>
        {ROLES.map(r=>(
          <div key={r.id} style={{display:"flex",alignItems:"center",gap:8,padding:"7px 14px",background:"rgba(255,255,255,.02)",border:`1px solid ${r.color}22`,borderRadius:20}}>
            <span style={{color:r.color,fontFamily:M,fontSize:11}}>{r.badge}</span>
            <span style={{color:"rgba(255,255,255,.4)",fontFamily:M,fontSize:9,letterSpacing:2}}>{r.label.toUpperCase()}</span>
          </div>
        ))}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:10}}>
        {usuarios.map(u=>{
          const ri=roleInfo(u.role);
          const si=spInfo(u.specialty);
          return (
            <div key={u.id} style={{display:"flex",alignItems:"center",gap:14,padding:"16px 20px",
              background:u.active?"rgba(255,255,255,.02)":"rgba(255,255,255,.01)",
              borderRadius:12,border:`1px solid ${u.active?g(.1):"rgba(255,255,255,.05)"}`,
              opacity:u.active?1:.55,transition:"all .2s"}}>
              {/* Avatar */}
              <div style={{width:44,height:44,background:`linear-gradient(135deg,${ri.color}33,${ri.color}18)`,borderRadius:10,
                display:"flex",alignItems:"center",justifyContent:"center",fontFamily:M,fontSize:17,fontWeight:700,
                color:ri.color,border:`1px solid ${ri.color}33`,flexShrink:0}}>
                {u.name[0].toUpperCase()}
              </div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                  <span style={{color:"#fff",fontFamily:M,fontSize:13}}>{u.name}</span>
                  {!u.active&&<span style={{color:"rgba(255,255,255,.3)",fontFamily:M,fontSize:9,letterSpacing:2,border:"1px solid rgba(255,255,255,.1)",borderRadius:4,padding:"1px 6px"}}>INACTIVO</span>}
                </div>
                <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
                  <span style={{color:"rgba(255,255,255,.3)",fontFamily:M,fontSize:10}}>@{u.user}</span>
                  <span style={{color:ri.color,fontFamily:M,fontSize:10,letterSpacing:1}}>{ri.badge} {ri.label}</span>
                  <span style={{color:"rgba(255,255,255,.2)",fontFamily:M,fontSize:10}}>·</span>
                  <span style={{color:si.color,fontFamily:M,fontSize:10}}>{si.icon} {si.label}</span>
                </div>
              </div>
              {/* Actions */}
              <div style={{display:"flex",gap:7,flexShrink:0}}>
                <button onClick={()=>openEdit(u)} style={{background:g(.08),border:`1px solid ${g(.2)}`,borderRadius:7,padding:"6px 12px",color:g(.8),fontFamily:M,fontSize:9,cursor:"pointer",letterSpacing:1}}>✏️ EDITAR</button>
                <button onClick={()=>toggleActive(u.id)} style={{background:u.active?"rgba(255,60,60,.08)":"rgba(100,255,100,.06)",border:u.active?"1px solid rgba(255,60,60,.25)":"1px solid rgba(100,255,100,.2)",borderRadius:7,padding:"6px 12px",color:u.active?"rgba(255,100,100,.8)":"rgba(100,255,100,.7)",fontFamily:M,fontSize:9,cursor:"pointer",letterSpacing:1}}>
                  {u.active?"⏸ DESACTIVAR":"▶ ACTIVAR"}
                </button>
                {u.role!=="superuser"&&<button onClick={()=>deleteUser(u.id)} style={{background:"rgba(255,30,30,.08)",border:"1px solid rgba(255,30,30,.2)",borderRadius:7,padding:"6px 10px",color:"rgba(255,80,80,.7)",fontFamily:M,fontSize:9,cursor:"pointer"}}>🗑</button>}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}


// ── ACTIVIDAD TAB ─────────────────────────────────────────────────────────────
function ActividadTab({activityLog, setActivityLog, usuarios, equipos, setEquipos}) {
  const [busquedaUser, setBusquedaUser] = useState("");
  const [filtroTipo,   setFiltroTipo]   = useState("todos");
  const [vista,        setVista]        = useState("log");
  const [editando,     setEditando]     = useState(null);
  const [editDetalle,  setEditDetalle]  = useState("");
  const [editEquipo,   setEditEquipo]   = useState(null);  // {tag,subtag,nombre,photo}
  const [editEqErr,    setEditEqErr]    = useState("");

  const tipoIcon  = {equipo:"⚙️", material:"📦", asignacion:"🔗", usuario:"👤"};
  const tipoColor = {equipo:"#f5a623", material:"#4fc3f7", asignacion:"#aed581", usuario:"#ce93d8"};

  const formatFecha = (ts) => {
    const d   = new Date(ts);
    const now = Date.now();
    const diff = now - ts;
    if(diff < 60000)   return "Hace un momento";
    if(diff < 3600000) return `Hace ${Math.floor(diff/60000)} min`;
    if(diff < 86400000)return `Hace ${Math.floor(diff/3600000)}h`;
    return d.toLocaleDateString("es-AR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"});
  };

  const filtered = activityLog
    .filter(e=> busquedaUser==="" || e.usuario.toLowerCase().includes(busquedaUser.toLowerCase()))
    .filter(e=> filtroTipo==="todos" || e.tipo===filtroTipo)
    .filter(e=> !e.deshecho);

  const deshacer = (entry) => {
    setActivityLog(prev=>prev.map(e=> e.id===entry.id ? {...e, deshecho:true} : e));
  };

  const iniciarEdicion = (entry) => {
    setEditando(entry.id);
    setEditDetalle(entry.detalle);
  };

  const guardarEdicion = (entry) => {
    if(!editDetalle.trim()) return;
    setActivityLog(prev=>prev.map(e=>
      e.id===entry.id
        ? {...e, detalle:editDetalle.trim(), editado:true, editadoEn:Date.now()}
        : e
    ));
    setEditando(null);
    setEditDetalle("");
  };

  const cancelarEdicion = () => {
    setEditando(null);
    setEditDetalle("");
  };

  const abrirEditEquipo = (entry) => {
    // Buscar el equipo por tag en el detalle del log
    const tagMatch = entry.detalle.split("—")[0].trim();
    const eq = equipos.find(e=>e.tag===tagMatch);
    if(!eq) return;
    setEditEquipo({...eq});
    setEditEqErr("");
  };

  const guardarEditEquipo = async () => {
    if(!editEquipo.tag.trim()||!editEquipo.nombre.trim()){
      setEditEqErr("El TAG y el Nombre son obligatorios."); return;
    }
    setEquipos(prev=>prev.map(e=>e.id===editEquipo.id ? {...editEquipo} : e));
    // Actualizar también el detalle en el log
    setActivityLog(prev=>prev.map(e=>
      e.detalle.startsWith(editEquipo.tag)||e.detalle.startsWith(editEquipo.tag.split(" ")[0])
        ? {...e, editado:true}
        : e
    ));
    setEditEquipo(null);
    setEditEqErr("");
  };

  // Stats — agrupar por usuario
  const stats = usuarios.map(u=>{
    const acciones = activityLog.filter(e=>e.usuario===u.name && !e.deshecho);
    return {
      ...u,
      total:      acciones.length,
      equipos:    acciones.filter(e=>e.tipo==="equipo").length,
      materiales: acciones.filter(e=>e.tipo==="material").length,
      asignaciones:acciones.filter(e=>e.tipo==="asignacion").length,
    };
  }).sort((a,b)=>b.total-a.total);

  const usuariosUnicos = [...new Set(activityLog.map(e=>e.usuario))];
  const usuariosFiltrados = busquedaUser
    ? usuariosUnicos.filter(u=>u.toLowerCase().includes(busquedaUser.toLowerCase()))
    : [];

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:22}}>
        <div>
          <h2 style={{fontFamily:M,fontSize:19,color:"#fff",letterSpacing:4,margin:0}}>PANEL DE ACTIVIDAD</h2>
          <p style={{color:"rgba(255,255,255,.3)",fontFamily:M,fontSize:11,marginTop:3}}>
            {activityLog.filter(e=>!e.deshecho).length} acciones registradas
          </p>
        </div>
        {/* Vista toggle */}
        <div style={{display:"flex",gap:8}}>
          {[{id:"log",label:"📋 LOG"},{id:"stats",label:"📊 STATS"}].map(v=>(
            <button key={v.id} onClick={()=>setVista(v.id)}
              style={{background:vista===v.id?g(.15):"transparent",border:`1px solid ${vista===v.id?g(.5):g(.15)}`,
                borderRadius:8,padding:"8px 16px",color:vista===v.id?"#f5a623":"rgba(255,255,255,.4)",
                fontFamily:M,fontSize:10,cursor:"pointer",letterSpacing:2,transition:"all .2s"}}>
              {v.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── VISTA LOG ── */}
      {vista==="log" && (
        <>
          {/* Modal editar equipo */}
          {editEquipo && (
            <Modal title="✏️ EDITAR EQUIPO" onClose={()=>{setEditEquipo(null);setEditEqErr("");}}>
              {/* Foto */}
              <PhotoUpload
                photo={editEquipo.photo}
                onPhoto={ph=>setEditEquipo(p=>({...p,photo:ph}))}
                label="FOTO DE PORTADA"/>
              <GInput
                label="NOMBRE DEL EQUIPO"
                value={editEquipo.nombre}
                onChange={e=>setEditEquipo(p=>({...p,nombre:e.target.value}))}
                placeholder="Ej: Reductor Principal"
                required/>
              <GInput
                label="TAG / ÁREA"
                value={editEquipo.tag}
                onChange={e=>setEditEquipo(p=>({...p,tag:e.target.value}))}
                placeholder="Ej: 206 RL 101"
                required/>
              <GInput
                label="SUBTAG (opcional)"
                value={editEquipo.subtag||""}
                onChange={e=>setEditEquipo(p=>({...p,subtag:e.target.value}))}
                placeholder="Ej: R01, R02"/>
              {editEqErr && (
                <div style={{color:"#f55",fontFamily:M,fontSize:11,marginBottom:12,
                  padding:"8px 12px",background:"rgba(255,60,60,.08)",borderRadius:7,
                  border:"1px solid rgba(255,60,60,.2)"}}>
                  {editEqErr}
                </div>
              )}
              <div style={{display:"flex",gap:10,marginTop:6}}>
                <BtnSecondary onClick={()=>{setEditEquipo(null);setEditEqErr("");}}>CANCELAR</BtnSecondary>
                <BtnPrimary onClick={guardarEditEquipo} style={{flex:1}}>GUARDAR CAMBIOS</BtnPrimary>
              </div>
            </Modal>
          )}

          {/* ── BUSCADOR USUARIO ── */}
          <div style={{position:"relative",marginBottom:12}}>
            <div style={{position:"absolute",left:14,top:"50%",transform:"translateY(-50%)",
              color:g(.4),fontSize:15,pointerEvents:"none"}}>👤</div>
            <input
              value={busquedaUser}
              onChange={e=>setBusquedaUser(e.target.value)}
              placeholder="Buscar por nombre de usuario..."
              style={{width:"100%",background:"rgba(255,255,255,.04)",border:`1px solid ${busquedaUser?g(.5):g(.18)}`,
                borderRadius:10,padding:"12px 40px",color:"#fff",fontFamily:M,fontSize:12,
                outline:"none",boxSizing:"border-box",transition:"border .2s"}}
              onFocus={e=>e.target.style.borderColor=g(.55)}
              onBlur={e=>e.target.style.borderColor=busquedaUser?g(.5):g(.18)}
            />
            {busquedaUser && (
              <button onClick={()=>setBusquedaUser("")}
                style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",
                  background:"transparent",border:"none",color:g(.5),fontSize:16,cursor:"pointer"}}>✕</button>
            )}
          </div>

          {/* Sugerencias de usuarios mientras escribe */}
          {busquedaUser && usuariosFiltrados.length>0 && (
            <div style={{background:"#0d1117",border:`1px solid ${g(.25)}`,borderRadius:8,
              marginBottom:12,overflow:"hidden"}}>
              {usuariosFiltrados.map(u=>(
                <div key={u} onClick={()=>setBusquedaUser(u)}
                  style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",cursor:"pointer",
                    borderBottom:`1px solid ${g(.06)}`,transition:"background .15s"}}
                  onMouseEnter={e=>e.currentTarget.style.background=g(.08)}
                  onMouseLeave={e=>e.currentTarget.style.background="transparent"}>
                  <div style={{width:26,height:26,borderRadius:"50%",background:"linear-gradient(135deg,#f5a623,#e8870a)",
                    display:"flex",alignItems:"center",justifyContent:"center",color:"#000",fontFamily:M,fontSize:11,fontWeight:700}}>
                    {u[0].toUpperCase()}
                  </div>
                  <span style={{color:"#fff",fontFamily:MX,fontSize:13}}>{u}</span>
                  <span style={{color:g(.4),fontFamily:M,fontSize:10,marginLeft:"auto"}}>
                    {activityLog.filter(e=>e.usuario===u&&!e.deshecho).length} acciones
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Badge usuario activo */}
          {busquedaUser && (
            <div style={{display:"flex",alignItems:"center",gap:10,padding:"10px 16px",
              background:g(.06),border:`1px solid ${g(.2)}`,borderRadius:8,marginBottom:14}}>
              <div style={{width:30,height:30,borderRadius:"50%",background:"linear-gradient(135deg,#f5a623,#e8870a)",
                display:"flex",alignItems:"center",justifyContent:"center",color:"#000",fontFamily:M,fontSize:13,fontWeight:700}}>
                {busquedaUser[0].toUpperCase()}
              </div>
              <div>
                <div style={{color:"#f5a623",fontFamily:M,fontSize:11,fontWeight:700}}>{busquedaUser}</div>
                <div style={{color:"rgba(255,255,255,.3)",fontFamily:M,fontSize:9,letterSpacing:1}}>
                  {filtered.length} acción(es) encontrada(s)
                </div>
              </div>
            </div>
          )}

          {/* Filtros por tipo */}
          <div style={{display:"flex",gap:8,flexWrap:"wrap",marginBottom:18}}>
            {[{v:"todos",l:"TODOS"},{v:"equipo",l:"⚙️ EQUIPOS"},{v:"material",l:"📦 MATERIALES"},{v:"asignacion",l:"🔗 ASIGNACIONES"}].map(f=>(
              <button key={f.v} onClick={()=>setFiltroTipo(f.v)}
                style={{background:filtroTipo===f.v?g(.15):"transparent",
                  border:`1px solid ${filtroTipo===f.v?g(.5):g(.12)}`,borderRadius:20,
                  padding:"6px 14px",color:filtroTipo===f.v?"#f5a623":"rgba(255,255,255,.35)",
                  fontFamily:M,fontSize:10,cursor:"pointer",letterSpacing:1,transition:"all .2s"}}>
                {f.l}
              </button>
            ))}
            {(busquedaUser||filtroTipo!=="todos") && (
              <button onClick={()=>{setBusquedaUser("");setFiltroTipo("todos");}}
                style={{background:"rgba(255,50,50,.08)",border:"1px solid rgba(255,50,50,.2)",borderRadius:20,
                  padding:"6px 14px",color:"rgba(255,100,100,.7)",fontFamily:M,fontSize:10,cursor:"pointer",letterSpacing:1}}>
                ✕ LIMPIAR
              </button>
            )}
          </div>

          {/* Lista de acciones */}
          {filtered.length===0 ? (
            <div style={{textAlign:"center",padding:"48px 0",color:"rgba(255,255,255,.18)",fontFamily:M,fontSize:12,letterSpacing:2}}>
              SIN REGISTROS
            </div>
          ) : (
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              {filtered.map(entry=>(
                <div key={entry.id} style={{display:"flex",alignItems:"center",gap:14,padding:"14px 18px",
                  background:"rgba(255,255,255,.02)",borderRadius:12,border:`1px solid ${g(.08)}`,transition:"all .2s"}}
                  onMouseEnter={e=>{e.currentTarget.style.borderColor=g(.2);e.currentTarget.style.background=g(.03);}}
                  onMouseLeave={e=>{e.currentTarget.style.borderColor=g(.08);e.currentTarget.style.background="rgba(255,255,255,.02)";}}>

                  {/* Icono tipo */}
                  <div style={{width:42,height:42,borderRadius:10,flexShrink:0,display:"flex",
                    alignItems:"center",justifyContent:"center",fontSize:20,
                    background:`${tipoColor[entry.tipo]}18`,border:`1px solid ${tipoColor[entry.tipo]}33`}}>
                    {tipoIcon[entry.tipo]||"📌"}
                  </div>

                  {/* Info */}
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:3}}>
                      <span style={{color:tipoColor[entry.tipo]||"#f5a623",fontFamily:M,fontSize:11,fontWeight:700,letterSpacing:1}}>
                        {entry.accion.toUpperCase()}
                      </span>
                      <span style={{color:"rgba(255,255,255,.2)",fontFamily:M,fontSize:10}}>·</span>
                      <span style={{color:"rgba(255,255,255,.55)",fontFamily:MX,fontSize:12}}>{entry.detalle}</span>
                    </div>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:22,height:22,borderRadius:"50%",background:`linear-gradient(135deg,#f5a623,#e8870a)`,
                        display:"flex",alignItems:"center",justifyContent:"center",
                        color:"#000",fontFamily:M,fontSize:9,fontWeight:700,flexShrink:0}}>
                        {entry.usuario[0].toUpperCase()}
                      </div>
                      <span style={{color:"rgba(255,255,255,.4)",fontFamily:M,fontSize:10}}>{entry.usuario}</span>
                      <span style={{color:"rgba(255,255,255,.2)",fontFamily:M,fontSize:9}}>{formatFecha(entry.fecha)}</span>
                      {entry.editado && (
                        <span style={{color:"rgba(100,200,255,.6)",fontFamily:M,fontSize:8,letterSpacing:1,
                          border:"1px solid rgba(100,200,255,.2)",borderRadius:4,padding:"1px 5px"}}>
                          EDITADO
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Acciones */}
                  <div style={{display:"flex",gap:6,flexShrink:0}}>
                    {/* Editar — abre modal completo si es equipo, inline si es otro */}
                    {entry.tipo==="equipo" ? (
                      <button onClick={()=>abrirEditEquipo(entry)}
                        title="Editar equipo completo"
                        style={{background:"rgba(100,180,255,.08)",border:"1px solid rgba(100,180,255,.22)",
                          borderRadius:8,padding:"7px 12px",color:"rgba(130,200,255,.8)",
                          fontFamily:M,fontSize:9,cursor:"pointer",letterSpacing:1,transition:"all .2s"}}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(100,180,255,.18)"}
                        onMouseLeave={e=>e.currentTarget.style.background="rgba(100,180,255,.08)"}>
                        ✏️ EDITAR
                      </button>
                    ) : editando===entry.id ? (
                      <div style={{display:"flex",gap:6,alignItems:"center"}}>
                        <input
                          value={editDetalle}
                          onChange={e=>setEditDetalle(e.target.value)}
                          autoFocus
                          style={{background:"rgba(255,255,255,.06)",border:`1px solid ${g(.4)}`,
                            borderRadius:7,padding:"6px 10px",color:"#fff",fontFamily:MX,fontSize:12,
                            outline:"none",width:200}}
                          onKeyDown={e=>{if(e.key==="Enter")guardarEdicion(entry);if(e.key==="Escape")cancelarEdicion();}}
                        />
                        <button onClick={()=>guardarEdicion(entry)}
                          style={{background:"linear-gradient(135deg,#f5a623,#e8870a)",border:"none",
                            borderRadius:7,padding:"7px 12px",color:"#000",fontFamily:M,fontSize:9,fontWeight:700,cursor:"pointer"}}>
                          ✓
                        </button>
                        <button onClick={cancelarEdicion}
                          style={{background:"transparent",border:`1px solid ${g(.2)}`,borderRadius:7,
                            padding:"7px 10px",color:g(.5),fontFamily:M,fontSize:9,cursor:"pointer"}}>
                          ✕
                        </button>
                      </div>
                    ) : (
                      <button onClick={()=>iniciarEdicion(entry)}
                        title="Editar detalle"
                        style={{background:"rgba(100,180,255,.08)",border:"1px solid rgba(100,180,255,.22)",
                          borderRadius:8,padding:"7px 12px",color:"rgba(130,200,255,.8)",
                          fontFamily:M,fontSize:9,cursor:"pointer",letterSpacing:1,transition:"all .2s"}}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(100,180,255,.18)"}
                        onMouseLeave={e=>e.currentTarget.style.background="rgba(100,180,255,.08)"}>
                        ✏️ EDITAR
                      </button>
                    )}
                    {/* Deshacer */}
                    {editando!==entry.id && (
                      <button onClick={()=>deshacer(entry)}
                        title="Deshacer esta acción"
                        style={{background:"rgba(255,150,50,.08)",border:"1px solid rgba(255,150,50,.25)",
                          borderRadius:8,padding:"7px 12px",color:"rgba(255,180,80,.8)",
                          fontFamily:M,fontSize:9,cursor:"pointer",letterSpacing:1,transition:"all .2s"}}
                        onMouseEnter={e=>e.currentTarget.style.background="rgba(255,150,50,.18)"}
                        onMouseLeave={e=>e.currentTarget.style.background="rgba(255,150,50,.08)"}>
                        ↩ DESHACER
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* ── VISTA STATS ── */}
      {vista==="stats" && (
        <div>
          <p style={{color:"rgba(255,255,255,.25)",fontFamily:M,fontSize:11,letterSpacing:2,marginBottom:20}}>
            RANKING DE COLABORACIÓN — QUIÉN MÁS APORTA A LA BASE DE DATOS
          </p>

          {/* Resumen global */}
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(140px,1fr))",gap:12,marginBottom:24}}>
            {[
              {label:"ACCIONES TOTALES",val:activityLog.filter(e=>!e.deshecho).length,icon:"⚡",color:"#f5a623"},
              {label:"EQUIPOS CARGADOS",val:activityLog.filter(e=>e.tipo==="equipo"&&!e.deshecho).length,icon:"⚙️",color:"#4fc3f7"},
              {label:"MATERIALES",val:activityLog.filter(e=>e.tipo==="material"&&!e.deshecho).length,icon:"📦",color:"#aed581"},
              {label:"ASIGNACIONES",val:activityLog.filter(e=>e.tipo==="asignacion"&&!e.deshecho).length,icon:"🔗",color:"#ce93d8"},
            ].map((s,i)=>(
              <div key={i} style={{background:`${s.color}0f`,border:`1px solid ${s.color}28`,borderRadius:12,padding:"16px 14px",textAlign:"center"}}>
                <div style={{fontSize:22,marginBottom:6}}>{s.icon}</div>
                <div style={{color:s.color,fontFamily:M,fontSize:22,fontWeight:700,marginBottom:4}}>{s.val}</div>
                <div style={{color:"rgba(255,255,255,.3)",fontFamily:M,fontSize:9,letterSpacing:2}}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Ranking por usuario */}
          {stats.filter(u=>u.total>0).map((u,i)=>{
            const maxTotal = Math.max(...stats.map(s=>s.total), 1);
            const pct = Math.round((u.total/maxTotal)*100);
            const medals = ["🥇","🥈","🥉"];
            return (
              <div key={u.id} style={{padding:"18px 20px",background:"rgba(255,255,255,.02)",
                borderRadius:14,border:`1px solid ${g(.08)}`,marginBottom:10}}>
                <div style={{display:"flex",alignItems:"center",gap:14,marginBottom:12}}>
                  {/* Avatar */}
                  <div style={{width:44,height:44,borderRadius:10,background:"linear-gradient(135deg,#f5a623,#e8870a)",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    color:"#000",fontFamily:M,fontSize:18,fontWeight:700,flexShrink:0}}>
                    {u.name[0].toUpperCase()}
                  </div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:2}}>
                      <span style={{fontSize:16}}>{medals[i]||"  "}</span>
                      <span style={{color:"#fff",fontFamily:MX,fontSize:14}}>{u.name}</span>
                      <span style={{color:"rgba(255,255,255,.25)",fontFamily:M,fontSize:9,letterSpacing:1}}>@{u.user}</span>
                    </div>
                    <div style={{color:"rgba(255,255,255,.3)",fontFamily:M,fontSize:10}}>
                      ⚙️ {u.equipos} eq. &nbsp;·&nbsp; 📦 {u.materiales} mat. &nbsp;·&nbsp; 🔗 {u.asignaciones} asig.
                    </div>
                  </div>
                  <div style={{textAlign:"right"}}>
                    <div style={{color:"#f5a623",fontFamily:M,fontSize:22,fontWeight:700}}>{u.total}</div>
                    <div style={{color:"rgba(255,255,255,.2)",fontFamily:M,fontSize:9,letterSpacing:1}}>ACCIONES</div>
                  </div>
                </div>
                {/* Barra de progreso */}
                <div style={{height:6,background:"rgba(255,255,255,.06)",borderRadius:3,overflow:"hidden"}}>
                  <div style={{height:"100%",width:`${pct}%`,
                    background:`linear-gradient(90deg,#f5a623,#ffe066)`,
                    borderRadius:3,transition:"width .5s ease"}}/>
                </div>
              </div>
            );
          })}

          {stats.filter(u=>u.total>0).length===0 && (
            <div style={{textAlign:"center",padding:"40px 0",color:"rgba(255,255,255,.18)",fontFamily:M,fontSize:12,letterSpacing:2}}>
              AÚN NO HAY ACTIVIDAD REGISTRADA
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── MAIN APP ──────────────────────────────────────────────────────────────────
function MainApp({user,specialty,onLogout}) {
  const [tab,setTab]               = useState("equipos");
  const [equipos,setEquipos]       = useState(INIT_EQUIPOS);
  const [materiales,setMateriales] = useState(INIT_MATERIALES);
  const [usuarios,setUsuarios]     = useState(INIT_USUARIOS);
  const [sideOpen,setSideOpen]     = useState(true);
  // ── SYNC FIRESTORE EN TIEMPO REAL ──
  useEffect(()=>{
    let loaded = {eq:false, mat:false};
    const checkLoaded = () => { if(loaded.eq && loaded.mat) setCargando(false); };

    const unsubEq = onSnapshot(collection(db,"equipos"), snap=>{
      setEquipos(snap.empty ? [] : snap.docs.map(d=>({...d.data(), id:d.id})));
      loaded.eq = true; checkLoaded();
    }, ()=>{ loaded.eq=true; checkLoaded(); });

    const unsubMat = onSnapshot(collection(db,"materiales"), snap=>{
      setMateriales(snap.empty ? [] : snap.docs.map(d=>({...d.data(), id:d.id})));
      loaded.mat = true; checkLoaded();
    }, ()=>{ loaded.mat=true; checkLoaded(); });

    const unsubUs = onSnapshot(collection(db,"usuarios"), snap=>{
      if(!snap.empty) setUsuarios(snap.docs.map(d=>({...d.data(), id:d.id})));
    });

    return ()=>{ unsubEq(); unsubMat(); unsubUs(); };
  },[]);
  const [activityLog,setActivityLog] = useState([
    {id:1, tipo:"equipo",    accion:"Cargó equipo",      detalle:"206 RL 101 — Reductor Principal",  usuario:"Yamil García", fecha: Date.now()-3600000*2,  deshecho:false},
    {id:2, tipo:"material",  accion:"Cargó material",    detalle:"Aceite ISO VG 220 (MAT-001)",       usuario:"Martín López", fecha: Date.now()-3600000*5,  deshecho:false},
    {id:3, tipo:"asignacion",accion:"Asignó material",   detalle:"Grasa NLGI 2 → 206 RL 101",        usuario:"Martín López", fecha: Date.now()-3600000*6,  deshecho:false},
    {id:4, tipo:"equipo",    accion:"Cargó equipo",      detalle:"221 AG 101 — Agitador Tanque",      usuario:"Yamil García", fecha: Date.now()-3600000*24, deshecho:false},
    {id:5, tipo:"material",  accion:"Cargó material",    detalle:"Filtro Respiro 3μm (FIL-003)",      usuario:"Yamil García", fecha: Date.now()-3600000*25, deshecho:false},
    {id:6, tipo:"asignacion",accion:"Asignó material",   detalle:"Filtro Aceite HF-201 → 221 AG 101",usuario:"Carla Ruiz",   fecha: Date.now()-3600000*48, deshecho:false},
  ]);

  const logAction = (tipo, accion, detalle, userName) => {
    setActivityLog(prev=>[{
      id: Date.now(),
      tipo, accion, detalle,
      usuario: userName || "Usuario",
      fecha: Date.now(),
      deshecho: false,
    }, ...prev]);
  };

  const isSuperuser = user.role==="superuser";

  const tabs=[
    {id:"equipos",  label:"EQUIPOS",  icon:"⚙️"},
    {id:"catalogo", label:"CATÁLOGO", icon:"📋"},
    ...(isSuperuser?[
      {id:"usuarios", label:"USUARIOS",  icon:"👥"},
      {id:"actividad",label:"ACTIVIDAD", icon:"📊"},
    ]:[]),
  ];

  return (
    <div style={{minHeight:"100vh",background:"#080b10",display:"flex",flexDirection:"column",fontFamily:M}}>
      {cargando && (
        <div style={{position:"fixed",inset:0,background:"#080b10",zIndex:999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:20}}>
          <GoldBoxLogo size={80} animate={true}/>
          <div style={{color:g(.6),fontFamily:M,fontSize:11,letterSpacing:4}}>CARGANDO DATOS...</div>
          <div style={{width:200,height:3,background:"rgba(255,255,255,.06)",borderRadius:3,overflow:"hidden"}}>
            <div style={{height:"100%",background:"linear-gradient(90deg,#f5a623,#ffe066)",borderRadius:3,animation:"loadBar 1.5s ease-in-out infinite"}}/>
          </div>
        </div>
      )}
      <GridBg/>
      {/* HEADER */}
      <header style={{position:"sticky",top:0,zIndex:10,background:"rgba(8,11,16,.97)",borderBottom:`1px solid ${g(.15)}`,backdropFilter:"blur(20px)",padding:"0 18px",display:"flex",alignItems:"center",justifyContent:"space-between",height:60}}>
        <div style={{display:"flex",alignItems:"center",gap:9}}>
          <button onClick={()=>setSideOpen(p=>!p)} style={{background:"transparent",border:`1px solid ${g(.15)}`,borderRadius:7,padding:"6px 10px",color:g(.5),cursor:"pointer",fontSize:14}}>☰</button>
          <GoldBoxLogo size={34} animate={false}/>
          <span style={{fontSize:16,fontWeight:900,letterSpacing:5,background:"linear-gradient(180deg,#ffe066 0%,#f5a623 50%,#c97a00 100%)",WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",textShadow:"none",filter:"drop-shadow(0 0 8px rgba(245,166,35,0.6))"}}>GOLD BOX</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <div style={{display:"flex",alignItems:"center",gap:6,background:`${specialty.color}12`,border:`1px solid ${specialty.color}40`,borderRadius:20,padding:"4px 12px"}}>
            <span style={{fontSize:13}}>{specialty.icon}</span>
            <span style={{color:specialty.color,fontSize:9,letterSpacing:2}}>{specialty.label.toUpperCase()}</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:7}}>
            <div style={{width:30,height:30,background:"linear-gradient(135deg,#f5a623,#e8870a)",borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700,color:"#000"}}>
              {(user.name||"U")[0].toUpperCase()}
            </div>
            <div>
              <div style={{color:"#fff",fontSize:11,fontFamily:MX}}>{user.name}</div>
              <div style={{color:"#f5a623",fontSize:8,letterSpacing:2}}>{user.role==="superuser"?"★★★ SUPERUSUARIO":user.role==="editor"?"★★ EDITOR":"★ VISUALIZADOR"}</div>
            </div>
          </div>

        </div>
      </header>

      <div style={{display:"flex",flex:1,position:"relative",zIndex:1}}>
        {/* SIDEBAR */}
        <aside style={{width:sideOpen?188:0,overflow:"hidden",transition:"width .26s ease",borderRight:`1px solid ${g(.1)}`,background:g(.015),display:"flex",flexDirection:"column",flexShrink:0}}>
          <div style={{width:188,padding:"18px 0",display:"flex",flexDirection:"column",gap:2,flex:1}}>
            {tabs.map(t=>(
              <button key={t.id} onClick={()=>{setTab(t.id);setSideOpen(false);}}
                style={{display:"flex",alignItems:"center",gap:9,padding:"12px 20px",background:tab===t.id?g(.1):"transparent",
                  border:"none",borderLeft:tab===t.id?`3px solid #f5a623`:"3px solid transparent",
                  cursor:"pointer",textAlign:"left",transition:"all .2s",whiteSpace:"nowrap"}}>
                <span style={{fontSize:14}}>{t.icon}</span>
                <span style={{color:tab===t.id?"#f5a623":"rgba(255,255,255,.33)",fontSize:10,letterSpacing:3,fontWeight:tab===t.id?700:400,fontFamily:M}}>{t.label}</span>
              </button>
            ))}
            <div style={{flex:1}}/>
            <div style={{margin:"0 12px 6px",padding:"9px 12px",background:g(.05),borderRadius:8,border:`1px solid ${g(.12)}`}}>
              <div style={{color:g(.4),fontSize:8,letterSpacing:2,marginBottom:3}}>NIVEL</div>
              <div style={{color:"#f5a623",fontSize:9,letterSpacing:1}}>
                {user.role==="superuser"?"★★★ SUPERUSUARIO":user.role==="editor"?"★★ EDITOR":"★ VISUALIZADOR"}
              </div>
            </div>
            <button onClick={onLogout}
              style={{margin:"0 12px 16px",padding:"10px 12px",background:"rgba(255,50,50,.08)",
                border:"1px solid rgba(255,50,50,.22)",borderRadius:8,color:"rgba(255,90,90,.85)",
                fontFamily:M,fontSize:9,cursor:"pointer",letterSpacing:2,width:"calc(100% - 24px)",
                display:"flex",alignItems:"center",justifyContent:"center",gap:6,transition:"all .2s"}}
              onMouseEnter={e=>{e.currentTarget.style.background="rgba(255,50,50,.16)";e.currentTarget.style.borderColor="rgba(255,90,90,.4)";}}
              onMouseLeave={e=>{e.currentTarget.style.background="rgba(255,50,50,.08)";e.currentTarget.style.borderColor="rgba(255,50,50,.22)";}}>
              ⏻ CERRAR SESIÓN
            </button>
          </div>
        </aside>

        {/* CONTENT */}
        <main style={{flex:1,padding:26,overflowY:"auto",minWidth:0}}>
          {tab==="equipos"  &&<EquiposTab  equipos={equipos}  setEquipos={setEquipos}  materiales={materiales} setMateriales={setMateriales} specialty={specialty} user={user} logAction={logAction}/>}
          {tab==="catalogo"  && <CatalogoTab  materiales={materiales} setMateriales={setMateriales} specialty={specialty} user={user} logAction={logAction}/>}
          {tab==="usuarios"  && <UsuariosTab  usuarios={usuarios} setUsuarios={setUsuarios}/>}
          {tab==="actividad" && <ActividadTab activityLog={activityLog} setActivityLog={setActivityLog} usuarios={usuarios} equipos={equipos} setEquipos={setEquipos}/>}
        </main>
      </div>
    </div>
  );
}

// ── ROOT ──────────────────────────────────────────────────────────────────────
export default function GoldBox() {
  const [screen,setScreen]       = useState("login");
  const [user,setUser]           = useState(null);
  const [specialty,setSpecialty] = useState(null);
  if(screen==="login")     return <LoginScreen     onLogin={u=>{setUser(u);setScreen("welcome");}}/>;
  if(screen==="welcome")   return <WelcomeScreen    user={user} onContinue={()=>setScreen("specialty")}/>;
  if(screen==="specialty") return <SpecialtySelector user={user} onSelect={sp=>{setSpecialty(sp);setScreen("app");}}/>;
  return <MainApp user={user} specialty={specialty} onLogout={()=>{setUser(null);setSpecialty(null);setScreen("login");}}/>;;
}
