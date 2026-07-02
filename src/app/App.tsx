import React, { useState, useRef, useEffect } from "react";
import { Trash2 } from "lucide-react";
import pickerSvg from "@/imports/01Picker/svg-tw5ju0y2zu";
import panelSvg from "@/imports/01/svg-a9oovbkrq5";
import { Button } from "@andes/button";
import { Pill } from "@andes/badge";
import { Checkbox as AndesCheckbox } from "@andes/checkbox";
import { TextField } from "@andes/textfield";
import { DropdownNative, DropdownNativeItem } from "@andes/dropdown";
import { Snackbar } from "@andes/snackbar";
import { Tag } from "@andes/tag";
import "@andes/button/index.scss";
import "@andes/badge/index.scss";
import "@andes/checkbox/index.scss";
import "@andes/textfield/index.scss";
import "@andes/dropdown/index.scss";
import "@andes/snackbar/index.scss";
import "@andes/tag/index.scss";

// ─── Data ─────────────────────────────────────────────────────────────────────

const ALL_WEEKS = [
  { num: 1, dates: "18 al 25 de mayo",          calDays: [1,2,3,4,5,6,7] },
  { num: 2, dates: "25 de mayo al 02 de junio",  calDays: [8,9,10,11,12,13,14] },
  { num: 3, dates: "02 al 09 de junio",          calDays: [15,16,17,18,19,20,21] },
  { num: 4, dates: "09 al 16 de junio",          calDays: [22,23,24,25,26,27,28] },
];

type StatusKey = "revisado" | "agendado" | null;

interface ScRow {
  sc: string;
  vals: number[];
  statuses: StatusKey[];
  ind: { wi: number; delta: number } | null;
}

const SC_ROWS: ScRow[] = [
  { sc: "SFC6",  vals: [266,266,266,266], statuses: [null,null,null,null],                       ind: null },
  { sc: "SMS1",  vals: [267,267,267,267], statuses: ["revisado","revisado","revisado","revisado"], ind: null },
  { sc: "SGO1",  vals: [268,268,268,268], statuses: ["agendado","agendado","agendado","agendado"], ind: null },
  { sc: "SBA6",  vals: [269,269,500,269], statuses: [null,null,null,null],                       ind: { wi:2, delta:10 } },
  { sc: "SMG2",  vals: [271,271,271,271], statuses: [null,null,null,null],                       ind: null },
  { sc: "SSP39", vals: [271,271,271,271], statuses: [null,null,null,null],                       ind: null },
  { sc: "SBA3",  vals: [180,180,180,180], statuses: ["agendado","agendado","agendado","agendado"], ind: null },
  { sc: "SMG14", vals: [220,220,220,220], statuses: [null,null,null,null],                       ind: null },
  { sc: "SPR5",  vals: [310,310,310,310], statuses: ["revisado",null,null,null],                 ind: null },
  { sc: "SCE3",  vals: [295,295,295,295], statuses: [null,null,null,null],                       ind: null },
];

const STATUS_CFG: Record<string, { bg:string; color:string; label:string }> = {
  revisado: { bg:"rgba(65,137,230,0.1)",  color:"#3483FA", label:"REVISADO" },
  agendado: { bg:"rgba(0,166,80,0.1)",    color:"#00a650", label:"AGENDADO" },
};

const DAYS_HDR   = ["Lun","Mar","Mié","Jue","Vie","Sáb","Dom"];
const CICLO_OPTS = ["AM1","AM2","PM1","PM2"];

const ESTADO_OPTS = ["Sin revisar","Revisado","Agendado"] as const;
type EstadoOpt = typeof ESTADO_OPTS[number];

const ALL_SVC_CODES = [
  "SFC6","SSP7","SMS1","SGO1","SBA6","SMG2","SSP39","SBA3","SMG14","SPR5",
  "SCVDFTES2","SMG18","SRS5","SCE3","SSP17","SSP24","SMG4","SSP12","SSC9","TAT_TEST",
  "SPI1","RVMG2","SRD1","SSP48","SRJ2","SSP5","SRJ4","SRS2","SBA7","SGO2",
  "SMR2","SSP34","SSP28","SFC1","SSP20","SMG5","SSP23","SPR6","SSP29","SMG8",
  "SSP6","SCE1","SSP7_TEST","SMS2","SMG11","SBA2","SSP40","SPR4","RVSP6","SSP4",
  "SRJ13","SRJ12","SJP1","SAM1","SPR9","SRJ7","SFC4","SSP16","SRN1","SSC7",
  "SC_ZS","SSP51","SRS3","SSP50","SMG15","SRJ17","SRS8","STO2","SMG13","SSP55",
  "RJ5","SSC2","SFN1","SSP10","SMG1_TEST","SSP22","SSP49","SSP25","SMG7","SMG12",
  "SPR3","SSP31","SMG9","SSP5_TEST","SMG6","SSC4","SMN1","SSP8","SRJ10","SSP9",
  "SMR1","STO1","SBA4","SES3","SPA1","SMG10","SSP11","SSP36","SPR1_TEST","SSP18",
  "SRD2","RVMG1","SPR1","SSP45","SBA1","SPR2_TEST","SPR7","SSC8","MOR_TEST","SSP46",
  "SRJ1_TEST","SFC2","SSP14","SMG3","SSC3","SCE2","SAL1","SSP26","SPR11","SFC5",
  "SFC7","SRJ6","SFC3","SDF2","SPR10","SRS1","SCVDFTES1","SSP3","SSP52","SRS10",
  "SSP57","SES2","SSP13","SRS4","SBA9","SPR2","SGO3","SRS7","SPA2","SMG1",
  "SRJ3","SSC1","SSP56","SRJ1","SSP79","SSP38","SSP47","SSP15","SES1","SSP37",
  "SC_TEST","SRJ9","SRJ8","SPR8","SSP27","SPE1","SSP21","SSP30","SDF1","SRS9",
  "SSC5","SSE1",
];

// ─── Layout constants ──────────────────────────────────────────────────────────
const SC_COL  = 240;
const PANEL_X = 352;
const PANEL_W = 1014;
const ROW_H   = 80;

// ─── Utils ────────────────────────────────────────────────────────────────────

function weekLabel(sel: number[]): string {
  const s = [...sel].sort((a,b)=>a-b);
  if (!s.length) return "Semana 1 a 4";
  if (s.length === 1) return `Semana ${s[0]}`;
  return `Semana ${s[0]} a ${s[s.length-1]}`;
}

function toggleWeek(w: number, cur: Set<number>): Set<number> {
  const sorted = [...cur].sort((a,b)=>a-b);
  const min = sorted[0], max = sorted[sorted.length-1];
  if (cur.has(w)) {
    if (cur.size === 1) return cur;
    if (w === min) return new Set(sorted.slice(1));
    if (w === max) return new Set(sorted.slice(0,-1));
    const dMin = w-min, dMax = max-w;
    return dMin <= dMax
      ? new Set(sorted.filter(x => x > w))
      : new Set(sorted.filter(x => x < w));
  } else {
    if (w === min-1) return new Set([...sorted, w]);
    if (w === max+1) return new Set([...sorted, w]);
    return new Set([w]);
  }
}

function formatEta(raw: string): string {
  const d = raw.replace(/\D/g, "").slice(0, 4);
  return d.length <= 2 ? d : d.slice(0,2) + ":" + d.slice(2,4);
}

// ─── Inline styles ────────────────────────────────────────────────────────────

const inputBase: React.CSSProperties = {
  border: "1px solid rgba(0,0,0,0.25)",
  borderRadius: 6,
  backgroundColor: "white",
  fontFamily: "inherit",
  fontSize: 16,
  color: "rgba(0,0,0,0.9)",
  outline: "none",
  boxSizing: "border-box",
};

// ─── Filter components ────────────────────────────────────────────────────────

function OverflowPill({ items }: { items: string[] }) {
  const [hover, setHover] = useState(false);
  return (
    <div style={{ position:"relative", flexShrink:0 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <div style={{ height:24, borderRadius:56, border:"1.2px solid rgba(0,0,0,0.25)", padding:"0 8px", display:"flex", alignItems:"center", cursor:"default", backgroundColor:"white" }}>
        <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontSize:12, color:"rgba(0,0,0,0.9)", lineHeight:"15px", whiteSpace:"nowrap" }}>+{items.length}</p>
      </div>
      {hover && (
        <div style={{
          position:"absolute", top:28, left:0, zIndex:500,
          backgroundColor:"rgba(0,0,0,0.75)", borderRadius:6,
          padding:"6px 10px", whiteSpace:"nowrap",
          boxShadow:"0 2px 8px rgba(0,0,0,0.2)",
        }}>
          <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontSize:12, color:"white", lineHeight:"18px" }}>
            {items.join(", ")}
          </p>
          <div style={{ position:"absolute", top:-5, left:10, width:10, height:10, backgroundColor:"rgba(0,0,0,0.75)", transform:"rotate(45deg)", borderRadius:2 }}/>
        </div>
      )}
    </div>
  );
}


function MultiSelectFilter({ label, open, options, selected, onOpen, onClose, onToggle, onClear, search, onSearch }: {
  label: string;
  open: boolean;
  options: readonly string[];
  selected: string[];
  onOpen: () => void;
  onClose: () => void;
  onToggle: (opt: string) => void;
  onClear: () => void;
  search?: string;
  onSearch?: (v: string) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const MAX_VISIBLE = 2;
  const visiblePills = selected.slice(0, MAX_VISIBLE);
  const overflowPills = selected.slice(MAX_VISIBLE);
  const filteredOpts = search ? options.filter(o => o.toLowerCase().includes(search.toLowerCase())) : options;

  useEffect(() => {
    if (!open) return;
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [open, onClose]);

  return (
    <div ref={ref} style={{ display:"flex", alignItems:"center", gap:6, position:"relative" }}>
      <button onClick={open ? onClose : onOpen} style={{ background:"none", border:"none", cursor:"pointer", padding:0, flexShrink:0 }}>
        <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontSize:16, color:"rgba(0,0,0,0.9)", lineHeight:"16px" }}>{label}:</p>
      </button>

      {selected.length === 0 ? (
        <button onClick={open ? onClose : onOpen} style={{ height:24, borderRadius:56, border:"1.2px solid rgba(0,0,0,0.25)", padding:"0 8px", display:"flex", alignItems:"center", background:"white", cursor:"pointer" }}>
          <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontSize:12, color:"rgba(0,0,0,0.9)", lineHeight:"15px" }}>Todos</p>
        </button>
      ) : (
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          {visiblePills.map(item => (
            <Tag
              key={item}
              label={item}
              size="small"
              onClose={() => onToggle(item)}
            />
          ))}
          {overflowPills.length > 0 && <OverflowPill items={overflowPills} />}
        </div>
      )}

      <button onClick={open ? onClose : onOpen} style={{ background:"none", border:"none", cursor:"pointer", padding:0, display:"flex", alignItems:"center" }}>
        <svg viewBox="0 0 8.2955 4.94324" fill="none" style={{ width:8, height:5, transition:"transform 0.15s", transform: open ? "rotate(180deg)" : "rotate(0deg)" }}>
          <path d={pickerSvg.p3a87fd80} fill="black" fillOpacity="0.45"/>
        </svg>
      </button>

      {open && (
        <div style={{
          position:"absolute", top:32, left:0, zIndex:400,
          backgroundColor:"white", borderRadius:6,
          boxShadow:"0 6px 16px rgba(0,0,0,0.1)",
          minWidth:200, maxHeight:320, display:"flex", flexDirection:"column",
          overflow:"hidden",
        }}>
          {onSearch !== undefined && (
            <div style={{ padding:"8px 8px 4px", flexShrink:0 }}>
              <input
                value={search}
                onChange={e => onSearch(e.target.value)}
                placeholder="Buscar..."
                style={{ ...inputBase, width:"100%", height:36, padding:"0 12px", fontSize:14 }}
                autoFocus
              />
            </div>
          )}
          <div style={{ overflowY:"auto", flex:1 }}>
            {filteredOpts.map(opt => (
              <div key={opt} onClick={() => onToggle(opt)} style={{
                display:"flex", alignItems:"center", gap:10, padding:"10px 16px",
                cursor:"pointer", borderBottom:"1px solid #EDEDED", transition:"background 0.1s",
              }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F7FBFF")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "white")}
              >
                <AndesCheckbox
                  checked={selected.includes(opt)}
                  onChange={() => onToggle(opt)}
                  label={opt}
                />
              </div>
            ))}
            {filteredOpts.length === 0 && (
              <div style={{ padding:"12px 16px" }}>
                <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontSize:14, color:"rgba(0,0,0,0.45)", lineHeight:"18px" }}>Sin resultados</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── SVG primitives ───────────────────────────────────────────────────────────

function MlLogo() {
  return (
    <div style={{ height:40, width:155, position:"relative", flexShrink:0 }}>
      <div style={{ position:"absolute", inset:"1.13% 0.6% 1.13% 0.27%" }}>
        <svg viewBox="0 0 153.644 39.0966" fill="none" preserveAspectRatio="none"
          style={{ position:"absolute", display:"block", inset:0, width:"100%", height:"100%" }}>
          <path d={pickerSvg.p27e994c0} fill="#2D3277"/>
          <path d={pickerSvg.p2e4fdd70} fill="white"/>
          <path d={pickerSvg.p306f1980} fill="white"/>
          <path d={pickerSvg.p30b92900} fill="#FFD100"/>
          <path d={pickerSvg.p36644c00} fill="white"/>
          <path d={pickerSvg.p10a52080} fill="#FFD100"/>
          <path d={pickerSvg.p18a7ddc0} fill="#2D3277"/>
          <path d={pickerSvg.p22d85d00} fill="#2D3277"/>
          <path d={pickerSvg.p9729c0}   fill="#2D3277"/>
          <path d={pickerSvg.p3dc33192} fill="#2D3277"/>
          <path d={pickerSvg.p31c10800} fill="#2D3277"/>
          <path d={pickerSvg.p1f559d80} fill="#2D3277"/>
          <path d={pickerSvg.p13becf00} fill="#2D3277"/>
          <path d={pickerSvg.p30f9d070} fill="#2D3277"/>
          <path d={pickerSvg.p16062e80} fill="#2D3277"/>
          <path d={pickerSvg.p36fde40}  fill="#2D3277"/>
          <path d={pickerSvg.p77b6900}  fill="#2D3277"/>
          <path d={pickerSvg.p300e5900} fill="#2D3277"/>
          <path d={pickerSvg.p16015000} fill="#2D3277"/>
        </svg>
      </div>
    </div>
  );
}

// ─── Global Header ─────────────────────────────────────────────────────────────

function GlobalHeader() {
  return (
    <div style={{
      height: 56, flexShrink: 0,
      backgroundColor: "#fdf264",
      boxShadow: "0 1px 0 rgba(0,0,0,0.1)",
      display: "flex", alignItems: "center",
      padding: "0 16px",
      zIndex: 200,
      position: "relative",
    }}>
      <div style={{ display:"flex", flex:"1 0 0", gap:16, alignItems:"center", minWidth:0 }}>
        <div style={{ width:24, height:24, position:"relative", flexShrink:0 }}>
          <svg viewBox="0 0 21 13.5" fill="none" style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}>
            <path d="M0 1.5H21V0H0V1.5Z" fill="black" fillOpacity="0.9"/>
            <path d="M0 7.5H21V6H0V7.5Z" fill="black" fillOpacity="0.9"/>
            <path d="M21 13.5H0V12H21V13.5Z" fill="black" fillOpacity="0.9"/>
          </svg>
        </div>
        <MlLogo />
      </div>

      <div style={{ display:"flex", flex:"1 0 0", gap:24, alignItems:"center", justifyContent:"flex-end", minWidth:0 }}>
        <div style={{ display:"flex", gap:4, alignItems:"center" }}>
          <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontSize:14, color:"rgba(0,0,0,0.9)", lineHeight:"18px", whiteSpace:"nowrap" }}>Está vendo:</p>
          <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontWeight:600, fontSize:14, color:"rgba(0,0,0,0.9)", lineHeight:"18px", whiteSpace:"nowrap" }}>MLB</p>
          <svg viewBox="0 0 5.29719 8.89358" fill="none" style={{ width:5, height:9 }}>
            <path d={pickerSvg.p9158d80} fill="#3483FA"/>
          </svg>
        </div>
        <div style={{ width:1, height:24, backgroundColor:"rgba(0,0,0,0.15)" }}/>
        <div style={{ display:"flex", gap:8, alignItems:"center" }}>
          <svg viewBox="0 0 22.5 22.5" fill="none" style={{ width:22, height:22 }}>
            <path clipRule="evenodd" d={pickerSvg.p37b72680} fill="black" fillOpacity="0.9" fillRule="evenodd"/>
            <path clipRule="evenodd" d={pickerSvg.p3d60b380} fill="black" fillOpacity="0.9" fillRule="evenodd"/>
          </svg>
          <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontSize:14, color:"rgba(0,0,0,0.9)", lineHeight:"18px" }}>User</p>
          <svg viewBox="0 0 8.89358 5.29719" fill="none" style={{ width:9, height:5 }}>
            <path d={pickerSvg.p3b187c00} fill="black" fillOpacity="0.9"/>
          </svg>
        </div>
      </div>
    </div>
  );
}

// ─── Sidebar ──────────────────────────────────────────────────────────────────

const SIDEBAR_ICONS = [
  pickerSvg.p790a640, pickerSvg.p790a640, pickerSvg.p36ea7c00,
  pickerSvg.p2fe65a00, pickerSvg.p2a8c7400, pickerSvg.p25b78500,
  pickerSvg.p13ee1600, pickerSvg.p413a880, pickerSvg.p22f9200,
  pickerSvg.p1331870, pickerSvg.p11bd3d00, pickerSvg.p790a640,
  pickerSvg.p1278cc80,
];

function Sidebar() {
  return (
    <div style={{ width:58, flexShrink:0, backgroundColor:"#f5f5f5", overflowY:"hidden" }}>
      {SIDEBAR_ICONS.map((d,i) => (
        <div key={i} style={{ padding:"10px 17px" }}>
          <div style={{ width:24, height:24, position:"relative", overflow:"hidden" }}>
            <svg viewBox="0 0 20 20" fill="none" style={{ position:"absolute", inset:0, width:"100%", height:"100%" }}>
              <path d={d} fill="#9B9B9B"/>
            </svg>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Week Picker ──────────────────────────────────────────────────────────────

function WeekPicker({ draft, onToggle, onApply, onClose }: {
  draft: Set<number>;
  onToggle: (w:number) => void;
  onApply: () => void;
  onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function h(e: MouseEvent) { if (ref.current && !ref.current.contains(e.target as Node)) onClose(); }
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  return (
    <div ref={ref} style={{
      position:"absolute", top:174, right:54,
      width:400, backgroundColor:"white",
      borderRadius:8, boxShadow:"0 4px 24px rgba(0,0,0,0.15)",
      border:"1px solid #EDEDED", padding:"16px 20px 8px", zIndex:300,
    }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:8 }}>
        <button style={{ background:"none", border:"none", cursor:"pointer", width:24, height:24, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg viewBox="0 0 8.13132 14.1351" fill="none" style={{ width:8, height:14 }}>
            <path d={pickerSvg.p2b172680} fill="black" fillOpacity="0.9"/>
          </svg>
        </button>
        <div style={{ display:"flex", alignItems:"center", gap:4 }}>
          <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontSize:16, color:"rgba(0,0,0,0.9)", lineHeight:"20px" }}>Junio 2026</p>
          <svg viewBox="0 0 8.89358 5.29719" fill="none" style={{ width:9, height:5 }}>
            <path d={pickerSvg.p3b187c00} fill="black" fillOpacity="0.55"/>
          </svg>
        </div>
        <button style={{ background:"none", border:"none", cursor:"pointer", width:24, height:24, display:"flex", alignItems:"center", justifyContent:"center" }}>
          <svg viewBox="0 0 8.13132 14.1351" fill="none" style={{ width:8, height:14 }}>
            <path d={pickerSvg.p12742300} fill="black" fillOpacity="0.9"/>
          </svg>
        </button>
      </div>

      <div style={{ display:"flex", gap:8, alignItems:"center", paddingLeft:80, paddingBottom:6 }}>
        {DAYS_HDR.map(d => (
          <div key={d} style={{ width:32, textAlign:"center" }}>
            <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontSize:12, color:"rgba(0,0,0,0.55)", lineHeight:"15px", textTransform:"uppercase" }}>{d}</p>
          </div>
        ))}
      </div>

      <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
        {ALL_WEEKS.map(wk => {
          const sel = draft.has(wk.num);
          return (
            <div key={wk.num} style={{ display:"flex", alignItems:"center", gap:8 }}>
              <button onClick={() => onToggle(wk.num)} style={{
                width:72, height:32, borderRadius:16, border:"none", cursor:"pointer",
                backgroundColor: sel ? "#3483FA" : "rgba(65,137,230,0.08)", flexShrink:0,
                transition:"background 0.15s",
                fontFamily:"'Proxima Nova',sans-serif", fontWeight:600,
                fontSize:14, color: sel ? "white" : "#3483FA",
              }}>Sem {wk.num}</button>
              <div style={{ position:"relative", width:272, height:32, flexShrink:0 }}>
                {sel && <div style={{ position:"absolute", inset:0, backgroundColor:"rgba(65,137,230,0.1)", borderRadius:16 }}/>}
                {wk.calDays.map((day,i) => (
                  <div key={day} style={{ position:"absolute", left:i*40, top:0, width:32, height:32, display:"flex", alignItems:"center", justifyContent:"center" }}>
                    <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontSize:14, color:"rgba(0,0,0,0.9)", lineHeight:"18px" }}>{day}</p>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      <div style={{ paddingTop:16, paddingBottom:8 }}>
        <Button hierarchy="loud" size="large" fullWidth onClick={onApply}>Aplicar</Button>
      </div>
    </div>
  );
}

// ─── Sub-row breakdown ────────────────────────────────────────────────────────

function SubRowWeekCell({ isLast }: { isLast:boolean }) {
  return (
    <div style={{ flex:1, height:58, padding:"0 24px", borderRight: isLast ? "none" : "1px solid #EDEDED", display:"flex", alignItems:"center", backgroundColor:"#f5f5f5" }}>
      <div style={{ display:"flex", flexDirection:"column", gap:6 }}>
        <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontSize:12, color:"rgba(0,0,0,0.9)", lineHeight:"15px" }}>
          <span style={{ fontWeight:600 }}>228</span>{" Small van"}
        </p>
        <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontSize:12, color:"rgba(0,0,0,0.9)", lineHeight:"15px" }}>
          <span style={{ fontWeight:600 }}>48</span>{" Large van"}
        </p>
      </div>
    </div>
  );
}

// ─── Tabla detallada ──────────────────────────────────────────────────────────

function Table({ rows, activeWeeks, expandedRows, onToggleExpand, onCellClick, revisadoSet, agendadoSet, activeSc, scColRef }: {
  rows: ScRow[];
  activeWeeks: number[];
  expandedRows: Set<string>;
  onToggleExpand: (sc:string) => void;
  onCellClick: (sc:string, weekNum:number) => void;
  revisadoSet: Set<string>;
  agendadoSet: Set<string>;
  activeSc?: string;
  scColRef?: React.RefObject<HTMLDivElement | null>;
}) {
  const numCols = activeWeeks.length;

  return (
    <div style={{ width:"100%", border:"1px solid #EDEDED", borderRadius:"6px 6px 0 0", overflow:"hidden" }}>
      <div style={{ display:"flex", backgroundColor:"#e5e5e5", borderBottom:"1px solid rgba(0,0,0,0.25)" }}>
        <div ref={scColRef} style={{ width:SC_COL, flexShrink:0, padding:"10px 24px", borderRight:"1px solid #EDEDED", display:"flex", alignItems:"flex-start", flexDirection:"column", justifyContent:"center", borderTopLeftRadius:6 }}>
          <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontWeight:600, fontSize:12, color:"rgba(0,0,0,0.9)", lineHeight:"15px", whiteSpace:"nowrap" }}>Service center</p>
        </div>
        {activeWeeks.map((wn,i) => {
          const wk = ALL_WEEKS.find(w => w.num === wn)!;
          return (
            <div key={wn} style={{ flex:1, padding:"10px 24px", borderRight: i < numCols-1 ? "1px solid #EDEDED" : "none", borderTopRightRadius: i === numCols-1 ? 6 : 0, display:"flex", flexDirection:"column", gap:4, justifyContent:"flex-start" }}>
              <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontWeight:600, fontSize:12, color:"rgba(0,0,0,0.9)", lineHeight:"15px" }}>Semana {wn}</p>
              <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontSize:12, color:"rgba(0,0,0,0.55)", lineHeight:"15px" }}>{wk.dates}</p>
            </div>
          );
        })}
      </div>

      {rows.map((row, ri) => {
        const expanded = expandedRows.has(row.sc);
        const isLast = ri === rows.length - 1;
        return (
          <div key={row.sc}>
            <div style={{ display:"flex", borderBottom: (!expanded && !isLast) ? "1px solid #EDEDED" : "none" }}>
              <div style={{ width:SC_COL, flexShrink:0, height:ROW_H, padding:"0 24px", borderRight:"1px solid #EDEDED", display:"flex", alignItems:"center", gap:8, backgroundColor: activeSc === row.sc ? "#EBF2FF" : "white" }}>
                <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontWeight:600, fontSize:14, color:"rgba(0,0,0,0.9)", lineHeight:"18px", flex:1 }}>{row.sc}</p>
                <button onClick={() => onToggleExpand(row.sc)} style={{
                  background:"none", border:"none", cursor:"pointer", width:20, height:20, padding:0, flexShrink:0,
                  display:"flex", alignItems:"center", justifyContent:"center",
                  transition:"transform 0.2s ease",
                  transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
                }}>
                  <svg viewBox="0 0 11.2933 6.49768" fill="none" style={{ width:11, height:6.5 }}>
                    <path d={pickerSvg.p265cc600} fill="#3483FA"/>
                  </svg>
                </button>
              </div>

              {activeWeeks.map((wn, ci) => {
                const wi = wn - 1;
                const val = row.vals[wi];
                const key = `${row.sc}-${wn}`;
                const status: StatusKey = agendadoSet.has(key) ? "agendado" : revisadoSet.has(key) ? "revisado" : row.statuses[wi];
                const hasInd = row.ind && row.ind.wi === wi;
                return (
                  <div key={wn} onClick={() => onCellClick(row.sc, wn)} style={{
                    flex:1, height:ROW_H, padding:"0 24px",
                    borderRight: ci < numCols-1 ? "1px solid #EDEDED" : "none",
                    display:"flex", alignItems:"center", gap:8,
                    backgroundColor:"white", cursor:"pointer", transition:"background 0.1s",
                  }}
                    onMouseEnter={e => (e.currentTarget.style.backgroundColor = "#F7FBFF")}
                    onMouseLeave={e => (e.currentTarget.style.backgroundColor = "white")}
                  >
                    <div style={{ display:"flex", alignItems:"center", flex:1 }}>
                      <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontSize:18, color:"rgba(0,0,0,0.9)", lineHeight:"22px", whiteSpace:"nowrap" }}>{val}</p>
                      {hasInd && (
                        <div style={{ display:"flex", alignItems:"center", gap:2, marginLeft:4 }}>
                          <svg viewBox="0 0 10 10" fill="none" style={{ width:10, height:10, transform:"rotate(180deg)" }}>
                            <path clipRule="evenodd" d={panelSvg.p33d7a800} fill="black" fillOpacity="0.55" fillRule="evenodd"/>
                          </svg>
                          <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontSize:12, color:"rgba(0,0,0,0.55)", lineHeight:"15px" }}>{row.ind!.delta}</p>
                        </div>
                      )}
                    </div>
                    {status && STATUS_CFG[status] && (
                      <Pill color={status === "agendado" ? "positive" : "informative"} hierarchy="quiet" style={{ flexShrink:0 }}>
                        {STATUS_CFG[status].label}
                      </Pill>
                    )}
                  </div>
                );
              })}
            </div>

            {expanded && (
              <div style={{ display:"flex", borderBottom: isLast ? "none" : "1px solid #EDEDED", borderTop:"1px solid #EDEDED" }}>
                <div style={{ width:SC_COL, flexShrink:0, height:58, borderRight:"1px solid #EDEDED", backgroundColor:"#f5f5f5" }}/>
                {activeWeeks.map((wn,ci) => (
                  <SubRowWeekCell key={wn} isLast={ci === numCols-1}/>
                ))}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Confirm Masivo Modal ────────────────────────────────────────────────────

function ConfirmMasivoModal({ weeksLabel, scCount, onConfirm, onCancel }: {
  weeksLabel: string; scCount: number;
  onConfirm: () => void; onCancel: () => void;
}) {
  const calendarIcon = (
    <svg viewBox="0 0 15.6 15.6" fill="none" style={{ width:16, height:16, flexShrink:0 }}>
      <path clipRule="evenodd" d={pickerSvg.p345c9400} fill="black" fillOpacity="0.9" fillRule="evenodd"/>
    </svg>
  );
  const truckIcon = (
    <svg viewBox="0 0 24 24" fill="none" style={{ width:22, height:22, flexShrink:0 }}>
      <path d="M1 3h15v11H1V3zm15 2h5l3 3v6h-8V5zm-1 12a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z" stroke="rgba(0,0,0,0.55)" strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
    </svg>
  );
  const buildingIcon = (
    <svg viewBox="0 0 24 24" fill="none" style={{ width:22, height:22, flexShrink:0 }}>
      <rect x="3" y="3" width="18" height="18" rx="1" stroke="rgba(0,0,0,0.55)" strokeWidth="1.2"/>
      <path d="M8 9h8M8 13h5" stroke="rgba(0,0,0,0.55)" strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );

  return (
    <>
      <div style={{ position:"absolute", inset:0, backgroundColor:"rgba(0,0,0,0.6)", zIndex:400 }} onClick={onCancel}/>
      <div style={{
        position:"absolute", left:"50%", top:"50%", transform:"translate(-50%,-50%)",
        width:500, backgroundColor:"white", borderRadius:8,
        boxShadow:"0px 8px 24px rgba(0,0,0,0.15)",
        padding:"40px 40px 40px", zIndex:401,
        display:"flex", flexDirection:"column", gap:24,
      }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
          <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontWeight:600, fontSize:24, color:"rgba(0,0,0,0.9)", lineHeight:"30px", flex:1 }}>
            Confirmar agendamiento masivo
          </p>
          <button onClick={onCancel} style={{ background:"none", border:"none", cursor:"pointer", padding:4, flexShrink:0, marginLeft:16 }}>
            <svg viewBox="0 0 14.1213 14.1282" fill="none" style={{ width:14, height:14 }}>
              <path d={panelSvg.p2c2477f0} fill="rgba(0,0,0,0.55)"/>
            </svg>
          </button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontSize:16, color:"rgba(0,0,0,0.9)", lineHeight:"20px" }}>
            Vas a agendar vehículos para el siguiente periodo:
          </p>
          <div style={{ display:"flex", alignItems:"center", gap:10, height:46, backgroundColor:"rgba(0,0,0,0.04)", borderRadius:6, padding:"0 16px" }}>
            {calendarIcon}
            <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontWeight:600, fontSize:14, color:"rgba(0,0,0,0.9)", lineHeight:"18px" }}>
              {weeksLabel} - 18 de mayo al 16 de junio
            </p>
          </div>
          <div style={{ display:"flex", gap:12 }}>
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:10, height:46, backgroundColor:"rgba(0,0,0,0.04)", borderRadius:6, padding:"0 16px" }}>
              {truckIcon}
              <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontSize:14, color:"rgba(0,0,0,0.9)", lineHeight:"18px" }}>
                <span style={{ fontWeight:600 }}>2.132</span>{" "}
                <span style={{ color:"rgba(0,0,0,0.55)", fontSize:12 }}>viajes</span>
              </p>
            </div>
            <div style={{ flex:1, display:"flex", alignItems:"center", gap:10, height:46, backgroundColor:"rgba(0,0,0,0.04)", borderRadius:6, padding:"0 16px" }}>
              {buildingIcon}
              <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontSize:14, color:"rgba(0,0,0,0.9)", lineHeight:"18px" }}>
                <span style={{ fontWeight:600 }}>{scCount}</span>{" "}
                <span style={{ color:"rgba(0,0,0,0.55)", fontSize:12 }}>services centers</span>
              </p>
            </div>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Button hierarchy="loud" size="large" onClick={onConfirm}>Agendar</Button>
          <Button hierarchy="quiet" size="large" onClick={onCancel}>Volver a revisar</Button>
        </div>
      </div>
    </>
  );
}


// ─── Confirm Modal ────────────────────────────────────────────────────────────

function ConfirmModal({ sc, weeksLabel, onConfirm, onCancel }: {
  sc: string; weeksLabel: string;
  onConfirm: () => void; onCancel: () => void;
}) {
  const calendarIcon = (
    <svg viewBox="0 0 15.6 15.6" fill="none" style={{ width:16, height:16, flexShrink:0 }}>
      <path clipRule="evenodd" d={pickerSvg.p345c9400} fill="black" fillOpacity="0.9" fillRule="evenodd"/>
    </svg>
  );
  const truckIcon = (
    <svg viewBox="0 0 24 24" fill="none" style={{ width:24, height:24, flexShrink:0 }}>
      <path d="M1 3h15v11H1V3zm15 2h5l3 3v6h-8V5zm-1 12a2 2 0 100-4 2 2 0 000 4zm10 0a2 2 0 100-4 2 2 0 000 4z" stroke="rgba(0,0,0,0.55)" strokeWidth="1.2" strokeLinejoin="round" fill="none"/>
    </svg>
  );

  return (
    <>
      <div style={{ position:"absolute", inset:0, backgroundColor:"rgba(0,0,0,0.8)", zIndex:400 }} onClick={onCancel}/>
      <div style={{
        position:"absolute", left:"50%", top:"50%", transform:"translate(-50%,-50%)",
        width:580, backgroundColor:"white", borderRadius:6,
        boxShadow:"0px 6px 8px rgba(0,0,0,0.1)",
        padding:"45px 48px 48px", zIndex:401,
        display:"flex", flexDirection:"column", gap:24,
      }}>
        <div style={{ display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
          <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontWeight:600, fontSize:28, color:"rgba(0,0,0,0.9)", lineHeight:"35px", flex:1 }}>
            Confirmar agendamiento para {sc}
          </p>
          <button onClick={onCancel} style={{ background:"none", border:"none", cursor:"pointer", padding:4, flexShrink:0, marginLeft:16 }}>
            <svg viewBox="0 0 14.1213 14.1282" fill="none" style={{ width:14, height:14 }}>
              <path d={panelSvg.p2c2477f0} fill="rgba(0,0,0,0.55)"/>
            </svg>
          </button>
        </div>
        <div style={{ display:"flex", flexDirection:"column", gap:12 }}>
          <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontSize:16, color:"rgba(0,0,0,0.9)", lineHeight:"20px" }}>
            Vas a agendar vehículos para el siguiente periodo:
          </p>
          <div style={{ display:"flex", alignItems:"center", gap:10, height:46, backgroundColor:"rgba(0,0,0,0.04)", borderRadius:6, padding:"0 16px" }}>
            {calendarIcon}
            <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontWeight:600, fontSize:16, color:"rgba(0,0,0,0.9)", lineHeight:"20px" }}>
              {weeksLabel} - 18 de mayo al 16 de junio
            </p>
          </div>
          <div style={{ display:"flex", alignItems:"center", gap:10, height:46, backgroundColor:"rgba(0,0,0,0.04)", borderRadius:6, padding:"0 16px" }}>
            {truckIcon}
            <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontSize:16, color:"rgba(0,0,0,0.9)", lineHeight:"20px" }}>
              <span style={{ fontWeight:600 }}>1.100</span>{" "}
              <span style={{ color:"rgba(0,0,0,0.55)", fontSize:12 }}>viajes</span>
            </p>
          </div>
        </div>
        <div style={{ display:"flex", alignItems:"center", gap:10 }}>
          <Button hierarchy="loud" size="large" onClick={onConfirm}>Confirmar</Button>
          <Button hierarchy="quiet" size="large" onClick={onCancel}>Volver a revisar</Button>
        </div>
      </div>
    </>
  );
}


// ─── Panel types ──────────────────────────────────────────────────────────────

interface CicloRow {
  id: number;
  ciclo: string;
  eta: string;
  days: number[];
}

// ─── VehicleCard ──────────────────────────────────────────────────────────────

function VehicleCard({ name, total, filled, rows, onRowChange, onAddRow, onRemoveRow, readOnly = false }: {
  name: string; total: number; filled: number;
  rows: CicloRow[];
  onRowChange: (id:number, field:Partial<CicloRow>) => void;
  onAddRow: () => void;
  onRemoveRow: (id:number) => void;
  readOnly?: boolean;
}) {
  return (
    <div style={{ border:"1px solid #EDEDED", borderRadius:8, backgroundColor:"white", overflow:"hidden" }}>
      {/* Card header */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"16px 16px 0" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <svg viewBox="0 0 8.2955 4.94324" fill="none" style={{ width:12, height:8, flexShrink:0 }}>
            <path d={panelSvg.p2b74ba80} fill="#3483FA"/>
          </svg>
          <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontWeight:600, fontSize:16, color:"rgba(0,0,0,0.9)", lineHeight:"20px" }}>{name}</p>
        </div>
        <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontSize:14, color:"rgba(0,0,0,0.9)", lineHeight:"18px" }}>
          <span style={{ fontWeight:600, color:"#00a650" }}>{filled}</span>/{total} vehículos
        </p>
      </div>

      {/* Input rows box */}
      <div style={{ margin:16, border:"1px solid #EDEDED", borderRadius:6, overflow:"hidden" }}>
        {rows.map((row, ri) => (
          <div key={row.id} style={{
            display:"flex", alignItems:"flex-start", gap:16, padding:"8px",
            borderBottom: ri < rows.length-1 ? "1px solid #EDEDED" : "none",
            backgroundColor: readOnly ? "#fafafa" : "white",
          }}>
            <div style={{ width:174, flexShrink:0 }}>
              <DropdownNative
                label="Ciclo"
                value={row.ciclo}
                disabled={readOnly}
                onChange={e => onRowChange(row.id, { ciclo: (e.target as HTMLSelectElement).value })}
              >
                {CICLO_OPTS.map(opt => <DropdownNativeItem key={opt} value={opt} title={opt} />)}
              </DropdownNative>
            </div>
            <div style={{ width:174, flexShrink:0 }}>
              <TextField
                label="ETA"
                value={row.eta}
                placeholder="hh:mm"
                disabled={readOnly}
                onChange={e => onRowChange(row.id, { eta: formatEta((e.target as HTMLInputElement).value) })}
              />
            </div>
            <div style={{ display:"flex", gap:16 }}>
              {DAYS_HDR.map((d, di) => (
                <div key={di} style={{ width:54, flexShrink:0 }}>
                  <TextField
                    label={d}
                    value={String(row.days[di] ?? 0)}
                    disabled={readOnly}
                    onChange={e => {
                      const next = [...row.days];
                      next[di] = Math.max(0, parseInt((e.target as HTMLInputElement).value) || 0);
                      onRowChange(row.id, { days: next });
                    }}
                  />
                </div>
              ))}
            </div>
            {!readOnly && ri > 0 && (
              <button onClick={() => onRemoveRow(row.id)}
                style={{ background:"none", border:"none", cursor:"pointer", padding:4, flexShrink:0, display:"flex", alignItems:"center", justifyContent:"center", borderRadius:4, marginTop:28 }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = "rgba(0,0,0,0.05)")}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = "transparent")}
              >
                <Trash2 size={16} color="rgba(0,0,0,0.35)" />
              </button>
            )}
          </div>
        ))}
      </div>

      {!readOnly && (
        <div style={{ padding:"0 16px 16px" }}>
          <button onClick={onAddRow} style={{ background:"none", border:"none", cursor:"pointer", padding:0 }}>
            <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontSize:14, color:"#3483FA", lineHeight:"18px" }}>+ Agregar ciclo</p>
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Panel ────────────────────────────────────────────────────────────────────

function Panel({ sc, weekNum, onClose, isRevisado, isAgendado, onMarkRevisado, onUnmarkRevisado, onAgendar }: {
  sc: string; weekNum: number; onClose: () => void;
  isRevisado: boolean; isAgendado: boolean;
  onMarkRevisado: (replicar: boolean) => void;
  onUnmarkRevisado: (replicar: boolean) => void;
  onAgendar: (replicar: boolean) => void;
}) {
  const wk = ALL_WEEKS.find(w => w.num === weekNum)!;
  const rowIdRef = useRef(2);
  const isLocked = isRevisado || isAgendado;

  const [largeRows, setLargeRows] = useState<CicloRow[]>([{ id:1, ciclo:"AM1", eta:"", days:[38,38,38,38,38,19,19] }]);
  const [smallRows, setSmallRows] = useState<CicloRow[]>([{ id:1, ciclo:"AM1", eta:"", days:[38,8,8,8,8,4,4] }]);
  const [replicar,  setReplicar]  = useState(true);
  const [isDirty,   setIsDirty]   = useState(false);
  const [showSnackbar, setShowSnackbar] = useState(false);

  useEffect(() => {
    if (!showSnackbar) return;
    const t = setTimeout(() => setShowSnackbar(false), 3000);
    return () => clearTimeout(t);
  }, [showSnackbar]);

  function updateRow(setRows: React.Dispatch<React.SetStateAction<CicloRow[]>>, id: number, field: Partial<CicloRow>) {
    setRows(prev => prev.map(r => r.id === id ? { ...r, ...field } : r));
    setIsDirty(true);
  }
  function addRow(setRows: React.Dispatch<React.SetStateAction<CicloRow[]>>, defaultDays: number[]) {
    setRows(prev => [...prev, { id: rowIdRef.current++, ciclo:"AM1", eta:"", days:defaultDays }]);
    setIsDirty(true);
  }
  function removeRow(setRows: React.Dispatch<React.SetStateAction<CicloRow[]>>, id: number) {
    setRows(prev => prev.filter(r => r.id !== id));
    setIsDirty(true);
  }


  const badge = isAgendado
    ? { label:"AGENDADO", bg:"rgba(0,166,80,0.1)", color:"#00a650" }
    : isRevisado
    ? { label:"REVISADO", bg:"rgba(65,137,230,0.1)", color:"#3483FA" }
    : null;

  return (
    <div style={{ width:"100%", height:"100%", backgroundColor:"white", boxShadow:"-4px 0 20px rgba(0,0,0,0.15)", display:"flex", flexDirection:"column", overflow:"hidden", position:"relative" }}>
      <div style={{ flexShrink:0, borderBottom:"1px solid #EDEDED" }}>
        <div style={{ padding:"16px 24px", display:"flex", alignItems:"flex-start", justifyContent:"space-between" }}>
          <div style={{ display:"flex", flexDirection:"column", gap:4 }}>
            <div style={{ display:"flex", alignItems:"center", gap:10 }}>
              <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontWeight:600, fontSize:20, color:"rgba(0,0,0,0.9)", lineHeight:"25px", whiteSpace:"nowrap" }}>
                Vehículos semana {weekNum} para {sc}
              </p>
              {badge && (
                <Pill color={isAgendado ? "positive" : "informative"} hierarchy="quiet" style={{ flexShrink:0 }}>
                  {badge.label}
                </Pill>
              )}
            </div>
            <div style={{ display:"flex", alignItems:"center" }}>
              <span style={{ fontFamily:"'Proxima Nova',sans-serif", fontSize:14, color:"rgba(0,0,0,0.9)", lineHeight:"18px" }}>{wk.dates}</span>
              <span style={{ fontFamily:"'Proxima Nova',sans-serif", fontWeight:600, fontSize:14, color:"rgba(0,0,0,0.9)", lineHeight:"18px" }}>&nbsp;|&nbsp;276&nbsp;</span>
              <span style={{ fontFamily:"'Proxima Nova',sans-serif", fontSize:14, color:"rgba(0,0,0,0.9)", lineHeight:"18px" }}>vehículos</span>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"none", border:"none", cursor:"pointer", width:28, height:24, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
            <svg viewBox="0 0 14.1213 14.1282" fill="none" style={{ width:14, height:14 }}>
              <path d={panelSvg.p2c2477f0} fill="#3483FA"/>
            </svg>
          </button>
        </div>
      </div>

      <div style={{ flex:1, overflowY:"auto", overflowX:"hidden", padding:"24px" }}>
        <div style={{ display:"flex", flexDirection:"column", gap:32 }}>
          <VehicleCard name="Large van" total={228} filled={228} rows={largeRows} readOnly={isLocked}
            onRowChange={(id, f) => updateRow(setLargeRows, id, f)}
            onAddRow={() => addRow(setLargeRows, [38,38,38,38,38,19,19])}
            onRemoveRow={id => removeRow(setLargeRows, id)} />
          <VehicleCard name="Small van" total={48} filled={48} rows={smallRows} readOnly={isLocked}
            onRowChange={(id, f) => updateRow(setSmallRows, id, f)}
            onAddRow={() => addRow(setSmallRows, [8,8,8,8,8,4,4])}
            onRemoveRow={id => removeRow(setSmallRows, id)} />
        </div>
      </div>

      {!isAgendado && (
        <div style={{ flexShrink:0, height:80, backgroundColor:"white", borderTop:"1px solid #EDEDED", display:"flex", alignItems:"center", justifyContent:"space-between", padding:"0 48px" }}>
          {isRevisado ? (
            <>
              <AndesCheckbox checked={replicar} onChange={() => setReplicar(p => !p)} label="Agendar vehículos para todas las semanas revisadas."/>
              <div style={{ display:"flex", alignItems:"center", gap:16 }}>
                <Button hierarchy="quiet" size="medium" onClick={() => { onUnmarkRevisado(replicar); setIsDirty(false); }}>Volver a revisar</Button>
                <Button hierarchy="loud" size="medium" onClick={() => onAgendar(replicar)}>Agendar vehículos</Button>
              </div>
            </>
          ) : (
            <>
              <AndesCheckbox checked={replicar} onChange={() => { setReplicar(p => !p); setIsDirty(true); }} label="Replicar cambios en las próximas semanas."/>
              <Button hierarchy="loud" size="medium" disabled={!isDirty} onClick={() => { onMarkRevisado(replicar); setShowSnackbar(true); }}>Marcar como revisado</Button>
            </>
          )}
        </div>
      )}

      <Snackbar
        message={`Flota de ${sc} revisada y lista para agendar.`}
        show={showSnackbar}
        onClose={() => setShowSnackbar(false)}
        delay={3000}
      />
    </div>
  );
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeWeeks,   setActiveWeeks]   = useState<number[]>([1,2,3,4]);
  const [draftWeeks,    setDraftWeeks]    = useState<Set<number>>(new Set([1,2,3,4]));
  const [pickerOpen,    setPickerOpen]    = useState(false);
  const [expandedRows,  setExpandedRows]  = useState<Set<string>>(new Set());
  const [panelOpen,     setPanelOpen]     = useState(false);
  const [panelCtx,      setPanelCtx]      = useState({ sc:"STA1", weekNum:1 });
  const scColRef = useRef<HTMLDivElement>(null);
  const [panelLeft, setPanelLeft] = useState(0);

  useEffect(() => {
    const update = () => {
      if (scColRef.current) setPanelLeft(scColRef.current.getBoundingClientRect().right);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  const [revisadoSet, setRevisadoSet] = useState<Set<string>>(() => {
    const s = new Set<string>();
    SC_ROWS.forEach(row => row.statuses.forEach((st, i) => { if (st === "revisado") s.add(`${row.sc}-${i+1}`); }));
    return s;
  });
  const [agendadoSet, setAgendadoSet] = useState<Set<string>>(() => {
    const s = new Set<string>();
    SC_ROWS.forEach(row => row.statuses.forEach((st, i) => { if (st === "agendado") s.add(`${row.sc}-${i+1}`); }));
    return s;
  });

  const [estadoFilter, setEstadoFilter] = useState<EstadoOpt[]>([]);
  const [svcFilter,    setSvcFilter]    = useState<string[]>([]);
  const [estadoOpen,   setEstadoOpen]   = useState(false);
  const [svcOpen,      setSvcOpen]      = useState(false);
  const [svcSearch,    setSvcSearch]    = useState("");

  const displayRows = React.useMemo(() => {
    let result = SC_ROWS as ScRow[];
    if (svcFilter.length > 0) {
      result = result.filter(r => svcFilter.includes(r.sc));
    }
    if (estadoFilter.length > 0) {
      result = result.filter(r =>
        activeWeeks.some(wn => {
          const wi = wn - 1;
          const key = `${r.sc}-${wn}`;
          const status: StatusKey = agendadoSet.has(key) ? "agendado" : revisadoSet.has(key) ? "revisado" : r.statuses[wi];
          if (estadoFilter.includes("Sin revisar") && status === null) return true;
          if (estadoFilter.includes("Revisado") && status === "revisado") return true;
          if (estadoFilter.includes("Agendado") && status === "agendado") return true;
          return false;
        })
      );
    }
    return result;
  }, [svcFilter, estadoFilter, activeWeeks, agendadoSet, revisadoSet]);

  const [modalSc,         setModalSc]         = useState<string | null>(null);
  const [modalReplicar,   setModalReplicar]   = useState(true);
  const [masivoModal,     setMasivoModal]     = useState(false);
  const [progressLabel,   setProgressLabel]   = useState<string | null>(null);
  const [progressScCount, setProgressScCount] = useState(1);
  const [progressDone,    setProgressDone]    = useState(false);
  const [bannerText,      setBannerText]      = useState<string | null>(null);

  function toggleExpand(sc: string) {
    setExpandedRows(prev => { const n = new Set(prev); n.has(sc) ? n.delete(sc) : n.add(sc); return n; });
  }

  function markRevisado(sc: string, weekNum: number, replicar: boolean) {
    setRevisadoSet(prev => {
      const n = new Set(prev);
      if (replicar) activeWeeks.forEach(w => n.add(`${sc}-${w}`));
      else n.add(`${sc}-${weekNum}`);
      return n;
    });
  }
  function unmarkRevisado(sc: string, weekNum: number, replicar: boolean) {
    setRevisadoSet(prev => {
      const n = new Set(prev);
      if (replicar) activeWeeks.forEach(w => n.delete(`${sc}-${w}`));
      else n.delete(`${sc}-${weekNum}`);
      return n;
    });
  }

  function executeAgendar(keysToAgendar: string[], scCount: number, label: string) {
    setAgendadoSet(prev => { const n = new Set(prev); keysToAgendar.forEach(k => n.add(k)); return n; });
    setRevisadoSet(prev => { const n = new Set(prev); keysToAgendar.forEach(k => n.delete(k)); return n; });
    setProgressLabel(label);
    setProgressScCount(scCount);
    setProgressDone(false);
    if (scCount > 1) setBannerText(`Se están agendando ${scCount} services centers con flota.`);
    setTimeout(() => setProgressDone(true), 3000);
    setTimeout(() => setBannerText(null), 5000);
  }

  function handleConfirmPerSc() {
    if (!modalSc) return;
    const keysToAgendar = modalReplicar
      ? activeWeeks.filter(w => revisadoSet.has(`${modalSc}-${w}`)).map(w => `${modalSc}-${w}`)
      : [`${modalSc}-${panelCtx.weekNum}`].filter(k => revisadoSet.has(k));
    setModalSc(null);
    setPanelOpen(false);
    executeAgendar(keysToAgendar, 1, modalSc);
  }

  function handleConfirmMasivo() {
    const keysToAgendar = [...revisadoSet];
    const scCount = new Set(keysToAgendar.map(k => k.split("-")[0])).size;
    setMasivoModal(false);
    executeAgendar(keysToAgendar, scCount, `${scCount} Service centers`);
  }

  const label = weekLabel(activeWeeks);
  const hasRevisado = revisadoSet.size > 0;
  const revisadoScCount = new Set([...revisadoSet].map(k => k.split("-")[0])).size;

  return (
    <div style={{ width:"100vw", height:"100vh", overflow:"hidden", position:"relative", display:"flex", flexDirection:"column", backgroundColor:"#EDEDED" }}>

      <GlobalHeader />

      <div style={{ flex:1, display:"flex", overflow:"hidden" }}>
        <Sidebar />

        <div style={{ flex:1, overflow:"auto", backgroundColor:"#EDEDED" }}>
          <div style={{ maxWidth:1200, margin:"0 auto", padding:"48px 32px 32px" }}>

            {/* Title + week picker */}
            <div style={{ height:70, display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:24 }}>
              <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontWeight:600, fontSize:24, color:"black", lineHeight:"30px" }}>
                Agendamiento flota fija last mile
              </p>
              <div style={{ display:"flex", alignItems:"center", gap:11, height:48 }}>
                <div style={{ width:20, height:20, position:"relative", flexShrink:0 }}>
                  <svg viewBox="0 0 15.6 15.6" fill="none" style={{ position:"absolute", inset:"11%", width:"78%", height:"78%" }}>
                    <path clipRule="evenodd" d={pickerSvg.p345c9400} fill="black" fillOpacity="0.9" fillRule="evenodd"/>
                  </svg>
                </div>
                <div style={{ position:"relative", height:24, display:"flex", alignItems:"center", borderRadius:56, border:"1.2px solid rgba(0,0,0,0.25)", padding:"0 4px 0 8px", gap:2, flexShrink:0 }}>
                  <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontSize:12, color:"rgba(0,0,0,0.9)", lineHeight:"15px", whiteSpace:"nowrap" }}>{label}</p>
                  <button onClick={() => { setActiveWeeks([1,2,3,4]); setPickerOpen(false); setPanelOpen(false); }}
                    style={{ width:16, height:16, background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0, flexShrink:0 }}>
                    <svg viewBox="0 0 8.89625 8.89625" fill="none" style={{ width:9, height:9 }}>
                      <path d={pickerSvg.p1aa92f80} fill="black" fillOpacity="0.55"/>
                    </svg>
                  </button>
                </div>
                <button onClick={() => pickerOpen ? setPickerOpen(false) : (setDraftWeeks(new Set(activeWeeks)), setPickerOpen(true))}
                  style={{ width:20, height:20, background:"none", border:"none", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", padding:0, flexShrink:0 }}>
                  <svg viewBox="0 0 11.2933 6.49768" fill="none" style={{ width:11, height:7 }}>
                    <path d={pickerOpen ? pickerSvg.p29286c40 : pickerSvg.p265cc600} fill="#3483FA"/>
                  </svg>
                </button>
              </div>
            </div>

            {/* Filter bar */}
            <div style={{ minHeight:32, display:"flex", alignItems:"center", gap:16, marginBottom:24, flexWrap:"wrap" }}>
              <MultiSelectFilter
                label="Estado"
                open={estadoOpen}
                options={ESTADO_OPTS}
                selected={estadoFilter}
                onOpen={() => { setEstadoOpen(true); setSvcOpen(false); }}
                onClose={() => setEstadoOpen(false)}
                onToggle={opt => setEstadoFilter(prev => prev.includes(opt as EstadoOpt) ? prev.filter(x => x !== opt) : [...prev, opt as EstadoOpt])}
                onClear={() => setEstadoFilter([])}
              />
              <MultiSelectFilter
                label="Service centers"
                open={svcOpen}
                options={ALL_SVC_CODES}
                selected={svcFilter}
                onOpen={() => { setSvcOpen(true); setEstadoOpen(false); }}
                onClose={() => setSvcOpen(false)}
                onToggle={opt => setSvcFilter(prev => prev.includes(opt) ? prev.filter(x => x !== opt) : [...prev, opt])}
                onClear={() => setSvcFilter([])}
                search={svcSearch}
                onSearch={setSvcSearch}
              />
              <div style={{ flex:1, textAlign:"right" }}>
                <p style={{ fontFamily:"'Proxima Nova',sans-serif", fontSize:14, color:"rgba(0,0,0,0.55)", lineHeight:"18px" }}>{displayRows.length} de {SC_ROWS.length} services centers</p>
              </div>
              <Button hierarchy="loud" size="medium" disabled={!hasRevisado} onClick={() => hasRevisado && setMasivoModal(true)}>
                Agendar vehículos
              </Button>
            </div>

            {/* Tabla */}
            <Table
              rows={displayRows}
              activeWeeks={activeWeeks} expandedRows={expandedRows}
              onToggleExpand={toggleExpand} onCellClick={(sc, wn) => { if (scColRef.current) setPanelLeft(scColRef.current.getBoundingClientRect().right); setPanelCtx({ sc, weekNum:wn }); setPanelOpen(true); }}
              revisadoSet={revisadoSet} agendadoSet={agendadoSet}
              activeSc={panelOpen ? panelCtx.sc : undefined}
              scColRef={scColRef}
            />
          </div>
        </div>
      </div>

      {/* Week picker */}
      {pickerOpen && (
        <WeekPicker
          draft={draftWeeks}
          onToggle={w => setDraftWeeks(prev => toggleWeek(w, prev))}
          onApply={() => { setActiveWeeks([...draftWeeks].sort((a,b)=>a-b)); setPickerOpen(false); setPanelOpen(false); }}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {/* Overlay: cierra el panel al hacer click fuera */}
      {panelOpen && (
        <div onClick={() => setPanelOpen(false)} style={{
          position:"absolute", inset:0, zIndex:249, cursor:"default",
        }}/>
      )}

      {/* Side panel */}
      <div onClick={e => e.stopPropagation()} style={{
        position:"absolute", top:56, left:panelLeft, right:0, bottom:0,
        transform: panelOpen ? "translateX(0)" : "translateX(100%)",
        transition:"transform 250ms ease-out", zIndex:250, willChange:"transform",
      }}>
        <Panel
          key={`${panelCtx.sc}-${panelCtx.weekNum}`}
          sc={panelCtx.sc} weekNum={panelCtx.weekNum}
          onClose={() => setPanelOpen(false)}
          isRevisado={revisadoSet.has(`${panelCtx.sc}-${panelCtx.weekNum}`) && !agendadoSet.has(`${panelCtx.sc}-${panelCtx.weekNum}`)}
          isAgendado={agendadoSet.has(`${panelCtx.sc}-${panelCtx.weekNum}`)}
          onMarkRevisado={rep => markRevisado(panelCtx.sc, panelCtx.weekNum, rep)}
          onUnmarkRevisado={rep => unmarkRevisado(panelCtx.sc, panelCtx.weekNum, rep)}
          onAgendar={rep => { setModalSc(panelCtx.sc); setModalReplicar(rep); }}
        />
      </div>

      {modalSc && !masivoModal && (
        <ConfirmModal sc={modalSc} weeksLabel={label} onConfirm={handleConfirmPerSc} onCancel={() => setModalSc(null)}/>
      )}
      {masivoModal && (
        <ConfirmMasivoModal weeksLabel={label} scCount={revisadoScCount} onConfirm={handleConfirmMasivo} onCancel={() => setMasivoModal(false)}/>
      )}
      <Snackbar
        message={bannerText ?? ""}
        show={!!bannerText}
        color="positive"
        onClose={() => setBannerText(null)}
      />
      <Snackbar
        message={
          progressLabel
            ? progressDone
              ? progressScCount > 1 ? `2.132 vehículos agendados para ${progressScCount} Service centers` : `168 vehículos agendados para ${progressLabel}`
              : progressScCount > 1 ? "Agendando 100 de 2.132 vehículos" : "Agendando 2 de 276 vehículos"
            : ""
        }
        show={!!progressLabel}
        color={progressDone ? "positive" : undefined}
        action={{ text: "Cerrar", onClick: () => { setProgressLabel(null); setProgressDone(false); } }}
        onClose={() => { setProgressLabel(null); setProgressDone(false); }}
      />
    </div>
  );
}
