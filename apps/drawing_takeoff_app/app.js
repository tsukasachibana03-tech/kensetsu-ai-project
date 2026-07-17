import * as pdfjsLib from "./pdf.min.mjs";

pdfjsLib.GlobalWorkerOptions.workerSrc = "./pdf.worker.min.mjs";

const els = {
  projectSelect: document.getElementById("projectSelect"),
  projectNameInput: document.getElementById("projectNameInput"),
  projectStatus: document.getElementById("projectStatus"),
  newProjectButton: document.getElementById("newProjectButton"),
  duplicateProjectButton: document.getElementById("duplicateProjectButton"),
  deleteProjectButton: document.getElementById("deleteProjectButton"),
  drawingInput: document.getElementById("drawingInput"),
  importJsonInput: document.getElementById("importJsonInput"),
  drawingDrop: document.getElementById("drawingDrop"),
  drawingList: document.getElementById("drawingList"),
  removeDrawingButton: document.getElementById("removeDrawingButton"),
  canvasArea: document.getElementById("canvasArea"),
  drawingCanvas: document.getElementById("drawingCanvas"),
  overlayCanvas: document.getElementById("overlayCanvas"),
  stage: document.getElementById("stage"),
  stageWrap: document.getElementById("stageWrap"),
  drawingName: document.getElementById("drawingName"),
  hintText: document.getElementById("hintText"),
  pdfControls: document.getElementById("pdfControls"),
  pageView: document.getElementById("pageView"),
  prevPageButton: document.getElementById("prevPageButton"),
  nextPageButton: document.getElementById("nextPageButton"),
  zoomOutButton: document.getElementById("zoomOutButton"),
  zoomInButton: document.getElementById("zoomInButton"),
  fitButton: document.getElementById("fitButton"),
  zoomView: document.getElementById("zoomView"),
  calibrateButton: document.getElementById("calibrateButton"),
  scaleCheckButton: document.getElementById("scaleCheckButton"),
  scaleLengthInput: document.getElementById("scaleLengthInput"),
  scaleUnitInput: document.getElementById("scaleUnitInput"),
  scaleStatus: document.getElementById("scaleStatus"),
  scaleCheckStatus: document.getElementById("scaleCheckStatus"),
  formulaInput: document.getElementById("formulaInput"),
  openingTradeInput: document.getElementById("openingTradeInput"),
  floorInput: document.getElementById("floorInput"),
  roomInput: document.getElementById("roomInput"),
  roomMenuButton: document.getElementById("roomMenuButton"),
  roomMenu: document.getElementById("roomMenu"),
  saveRoomContentButton: document.getElementById("saveRoomContentButton"),
  registeredRoomSelect: document.getElementById("registeredRoomSelect"),
  roomStatus: document.getElementById("roomStatus"),
  internalFinishTab: document.getElementById("internalFinishTab"),
  externalFinishTab: document.getElementById("externalFinishTab"),
  internalFinishPanel: document.getElementById("internalFinishPanel"),
  externalFinishPanel: document.getElementById("externalFinishPanel"),
  externalFinishCategories: document.getElementById("externalFinishCategories"),
  floorFinishSummaryInput: document.getElementById("floorFinishSummaryInput"),
  floorFinishInput: document.getElementById("floorFinishInput"),
  floorFinishMenuButton: document.getElementById("floorFinishMenuButton"),
  floorFinishMenu: document.getElementById("floorFinishMenu"),
  baseboardSummaryInput: document.getElementById("baseboardSummaryInput"),
  wallFinishSummaryInput: document.getElementById("wallFinishSummaryInput"),
  wallFinishInput: document.getElementById("wallFinishInput"),
  wallFinishMenuButton: document.getElementById("wallFinishMenuButton"),
  wallFinishMenu: document.getElementById("wallFinishMenu"),
  ceilingFinishSummaryInput: document.getElementById("ceilingFinishSummaryInput"),
  ceilingFinishInput: document.getElementById("ceilingFinishInput"),
  ceilingFinishMenuButton: document.getElementById("ceilingFinishMenuButton"),
  ceilingFinishMenu: document.getElementById("ceilingFinishMenu"),
  ceilingTrimSummaryInput: document.getElementById("ceilingTrimSummaryInput"),
  wallTypeInput: document.getElementById("wallTypeInput"),
  wallSubstrateInput: document.getElementById("wallSubstrateInput"),
  ceilingSubstrateInput: document.getElementById("ceilingSubstrateInput"),
  heightInput: document.getElementById("heightInput"),
  baseboardInput: document.getElementById("baseboardInput"),
  baseboardMenuButton: document.getElementById("baseboardMenuButton"),
  baseboardMenu: document.getElementById("baseboardMenu"),
  ceilingTrimInput: document.getElementById("ceilingTrimInput"),
  ceilingTrimMenuButton: document.getElementById("ceilingTrimMenuButton"),
  ceilingTrimMenu: document.getElementById("ceilingTrimMenu"),
  hardwareFinishRows: document.getElementById("hardwareFinishRows"),
  addHardwareFinishButton: document.getElementById("addHardwareFinishButton"),
  wainscotInput: document.getElementById("wainscotInput"),
  deductLengthInput: document.getElementById("deductLengthInput"),
  deductAreaInput: document.getElementById("deductAreaInput"),
  traceDeductLengthButton: document.getElementById("traceDeductLengthButton"),
  traceDeductAreaButton: document.getElementById("traceDeductAreaButton"),
  memoInput: document.getElementById("memoInput"),
  finishPolyButton: document.getElementById("finishPolyButton"),
  clearTempButton: document.getElementById("clearTempButton"),
  deleteSelectedButton: document.getElementById("deleteSelectedButton"),
  saveProjectButton: document.getElementById("saveProjectButton"),
  exportTransferButton: document.getElementById("exportTransferButton"),
  exportJsonButton: document.getElementById("exportJsonButton"),
  exportCsvButton: document.getElementById("exportCsvButton"),
  findOpeningDrawingsButton: document.getElementById("findOpeningDrawingsButton"),
  exportOpeningListButton: document.getElementById("exportOpeningListButton"),
  exportOpeningCheckCsvButton: document.getElementById("exportOpeningCheckCsvButton"),
  clearAllButton: document.getElementById("clearAllButton"),
  recordsBody: document.getElementById("recordsBody"),
  tradeSheetTabs: document.getElementById("tradeSheetTabs"),
  tradeSheets: document.getElementById("tradeSheets"),
  openingSummary: document.getElementById("openingSummary"),
  openingDrawingStatus: document.getElementById("openingDrawingStatus"),
  recordCountView: document.getElementById("recordCountView"),
  quantityTotalView: document.getElementById("quantityTotalView"),
  amountTotalView: document.getElementById("amountTotalView")
};

const drawingCtx = els.drawingCanvas.getContext("2d");
const overlayCtx = els.overlayCanvas.getContext("2d");
const storageKey = "drawing-takeoff-app-v1";
const projectBookStorageKey = "drawing-takeoff-project-book-v1";
const pdfDisplayScale = 1.5;
const pdfQualityMultiplier = 2;
const openingTrades = [
  {
    name: "金属製建具",
    keys: ["金属製建具", "鋼製", "鋼製建具", "金属建具", "アルミ", "サッシ", "スチール", "ステン", "SUS", "SD", "SSD", "AD", "AW"]
  },
  {
    name: "木建具",
    keys: ["木製建具", "木製", "木建", "木建具", "木扉", "木枠", "WD", "木ドア"]
  },
  {
    name: "ガラス工事",
    keys: ["ガラス", "硝子", "GLASS", "透明", "型板", "網入", "強化", "複層", "FL", "PW", "FIX"]
  }
];

const openingTradeAliases = {
  "金属製建具工事": "金属製建具",
  "木製建具工事": "木建具"
};

const defaultMaterialSuggestions = [
  "ビニールクロス仕上",
  "不燃クロス仕上",
  "塗装仕上",
  "モルタル仕上",
  "タイル仕上",
  "フローリング",
  "長尺塩ビシート",
  "CFシート",
  "石膏ボード下地",
  "耐水石膏ボード下地",
  "ケイカル板下地",
  "合板下地",
  "LGS下地",
  "木下地",
  "ソフト巾木",
  "木製巾木",
  "廻り縁",
  "透明ガラス",
  "型板ガラス",
  "アルミ製建具",
  "鋼製建具"
];

const materialKeywordPattern = /(仕上げ?|下地|クロス|石膏ボード|プラスターボード|PB|LGS|ケイカル|珪酸カルシウム|合板|モルタル|塗装|タイル|シート|フローリング|巾木|廻り縁|ガラス|硝子|アルミ|鋼製|ステンレス|SUS)/i;

const externalFinishCategories = [
  { key: "roof", label: "屋根", placeholder: "例: ガルバリウム鋼板 / 瓦" },
  { key: "wall", label: "外壁", placeholder: "例: 吹付タイル / サイディング" },
  { key: "eaves", label: "軒裏", placeholder: "例: ケイカル板 / 塗装" },
  { key: "parking", label: "駐車スペース", placeholder: "例: コンクリート金ゴテ / インターロッキング" },
  { key: "dogrun", label: "犬走り", placeholder: "例: コンクリート金ゴテ / 砂利敷き" },
  { key: "hardware", label: "外部金物", placeholder: "例: 雨樋 / 手すり / 物干金物" }
];

const internalFinishItems = [
  { key: "floor", label: "床仕上" },
  { key: "floorSubstrate", label: "床下地" },
  { key: "baseboard", label: "巾木" },
  { key: "wall", label: "外壁側壁 仕上" },
  { key: "wallSubstrate", label: "外壁側壁 下地" },
  { key: "partitionWall", label: "間仕切壁 仕上" },
  { key: "partitionWallSubstrate", label: "間仕切壁 下地" },
  { key: "plywoodReinforcement", label: "ベニヤ補強" },
  { key: "exteriorWainscotUpperFinish", label: "外壁側壁 腰上仕上" },
  { key: "exteriorWainscotUpperSubstrate", label: "外壁側壁 腰上下地" },
  { key: "exteriorWainscotLowerFinish", label: "外壁側壁 腰下仕上" },
  { key: "exteriorWainscotLowerSubstrate", label: "外壁側壁 腰下下地" },
  { key: "partitionWainscotUpperFinish", label: "間仕切壁 腰上仕上" },
  { key: "partitionWainscotUpperSubstrate", label: "間仕切壁 腰上下地" },
  { key: "partitionWainscotLowerFinish", label: "間仕切壁 腰下仕上" },
  { key: "partitionWainscotLowerSubstrate", label: "間仕切壁 腰下下地" },
  { key: "ceiling", label: "天井仕上" },
  { key: "ceilingSubstrate", label: "天井下地" },
  { key: "ceilingTrim", label: "廻り縁" }
];

const finishFormulaValues = ["floor", "perimeter", "wall", "count"];
const internalFinishFormulaDefaults = {
  floor: "floor",
  floorSubstrate: "floor",
  baseboard: "perimeter",
  wall: "wall",
  wallSubstrate: "wall",
  partitionWall: "wall",
  partitionWallSubstrate: "wall",
  plywoodReinforcement: "floor",
  exteriorWainscotUpperFinish: "wall",
  exteriorWainscotUpperSubstrate: "wall",
  exteriorWainscotLowerFinish: "wall",
  exteriorWainscotLowerSubstrate: "wall",
  partitionWainscotUpperFinish: "wall",
  partitionWainscotUpperSubstrate: "wall",
  partitionWainscotLowerFinish: "wall",
  partitionWainscotLowerSubstrate: "wall",
  ceiling: "floor",
  ceilingSubstrate: "floor",
  ceilingTrim: "perimeter"
};
const sharedFinishFormulaGroups = [
  ["floor", "floorSubstrate"],
  ["ceiling", "ceilingSubstrate"]
];
const finishFormulaOptionLabels = {
  floor: "面積",
  perimeter: "長さ",
  wall: "周長×高さ−建具",
  count: "個数"
};

let pdfDoc = null;
let imageBitmapSource = null;
let drawingKind = "";
let drawingFileName = "";
let currentPage = 1;
let pageCount = 1;
let zoom = 1;
let baseWidth = 900;
let baseHeight = 640;
let tool = "rect";
let mode = "draw";
let tempPoints = [];
let scaleCheckResult = null;
let records = [];
let selectedId = "";
let overwriteSelectedRecord = false;
let scale = null;
let drawingEntries = [];
let activeDrawingId = "";
let roomSettings = [];
let roomSuggestions = [];
let materialSuggestions = [];
let finishTables = [];
let activeFinishTableLocation = null;
let activeFinishTab = "internal";
let activeInternalFinishKey = "";
let activeExternalFinishKey = "";
let activeExternalFinishRow = null;
let activeHardwareLengthItemId = "";
let activeTradeSheet = "";
let projectBook = { activeId: "", projects: [] };
let isApplyingProject = false;
let roomMenuSearchEnabled = false;

function money(value) {
  return `${Math.round(value || 0).toLocaleString("ja-JP")}円`;
}

function numberText(value, digits = 2) {
  const num = Number(value || 0);
  return num.toLocaleString("ja-JP", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits
  });
}

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function polygonArea(points) {
  let sum = 0;
  points.forEach((point, index) => {
    const next = points[(index + 1) % points.length];
    sum += point.x * next.y - next.x * point.y;
  });
  return Math.abs(sum) / 2;
}

function polygonLength(points, closed = true) {
  let sum = 0;
  const last = closed ? points.length : points.length - 1;
  for (let index = 0; index < last; index += 1) {
    sum += distance(points[index], points[(index + 1) % points.length]);
  }
  return sum;
}

function pointFromEvent(event) {
  const rect = els.overlayCanvas.getBoundingClientRect();
  return {
    x: ((event.clientX - rect.left) / rect.width) * baseWidth,
    y: ((event.clientY - rect.top) / rect.height) * baseHeight
  };
}

function applyCanvasDisplaySize() {
  const visibleWidth = Math.round(baseWidth * zoom);
  const visibleHeight = Math.round(baseHeight * zoom);
  els.stage.style.width = `${visibleWidth}px`;
  els.stage.style.height = `${visibleHeight}px`;
  els.drawingCanvas.style.width = `${visibleWidth}px`;
  els.drawingCanvas.style.height = `${visibleHeight}px`;
  els.overlayCanvas.style.width = `${visibleWidth}px`;
  els.overlayCanvas.style.height = `${visibleHeight}px`;
  els.zoomView.textContent = `${Math.round(zoom * 100)}%`;
}

function setCanvasSize(width, height, options = {}) {
  baseWidth = width;
  baseHeight = height;
  const drawingWidth = Math.round(options.drawingWidth || width);
  const drawingHeight = Math.round(options.drawingHeight || height);
  els.drawingCanvas.width = drawingWidth;
  els.drawingCanvas.height = drawingHeight;
  els.overlayCanvas.width = Math.round(width);
  els.overlayCanvas.height = Math.round(height);
  applyCanvasDisplaySize();
}

async function renderDrawing() {
  if (pdfDoc) {
    const page = await pdfDoc.getPage(currentPage);
    const displayViewport = page.getViewport({ scale: pdfDisplayScale });
    const renderViewport = page.getViewport({ scale: pdfDisplayScale * pdfQualityMultiplier });
    setCanvasSize(displayViewport.width, displayViewport.height, {
      drawingWidth: renderViewport.width,
      drawingHeight: renderViewport.height
    });
    drawingCtx.clearRect(0, 0, renderViewport.width, renderViewport.height);
    await page.render({ canvasContext: drawingCtx, viewport: renderViewport }).promise;
    els.pageView.textContent = `${currentPage} / ${pageCount}`;
  } else if (imageBitmapSource) {
    setCanvasSize(imageBitmapSource.width, imageBitmapSource.height);
    drawingCtx.clearRect(0, 0, baseWidth, baseHeight);
    drawingCtx.drawImage(imageBitmapSource, 0, 0);
  } else {
    setCanvasSize(900, 640);
    drawingCtx.fillStyle = "#ffffff";
    drawingCtx.fillRect(0, 0, baseWidth, baseHeight);
    drawingCtx.fillStyle = "#61717c";
    drawingCtx.font = "24px sans-serif";
    drawingCtx.fillText("PDFまたは画像図面を読み込んでください", 245, 310);
  }
  drawOverlay();
}

function drawOverlay() {
  overlayCtx.clearRect(0, 0, baseWidth, baseHeight);
  records
    .filter((record) => (
      record.page === currentPage &&
      Array.isArray(record.points) &&
      record.points.length > 0 &&
      !(record.hardwareManual && record.hardwareTakeoffKind === "count")
    ))
    .forEach(drawRecord);
  drawScaleCheckResult();
  drawTemp();
}

function drawRecord(record) {
  if (!Array.isArray(record?.points) || record.points.length === 0) return;
  const color = record.id === selectedId ? "#c55735" : record.recordType === "deduction" ? "#8b4fc4" : "#17696f";
  overlayCtx.save();
  overlayCtx.lineWidth = record.id === selectedId ? 4 : 2.5;
  overlayCtx.strokeStyle = color;
  overlayCtx.fillStyle = color;
  overlayCtx.globalAlpha = 0.9;
  if (record.shape === "count") {
    const p = record.points[0];
    overlayCtx.beginPath();
    overlayCtx.arc(p.x, p.y, 8, 0, Math.PI * 2);
    overlayCtx.fill();
  } else {
    overlayCtx.beginPath();
    record.points.forEach((point, index) => {
      if (index === 0) overlayCtx.moveTo(point.x, point.y);
      else overlayCtx.lineTo(point.x, point.y);
    });
    if (record.shape !== "line") overlayCtx.closePath();
    if (record.shape !== "line") {
      overlayCtx.globalAlpha = 0.14;
      overlayCtx.fill();
      overlayCtx.globalAlpha = 0.95;
    }
    overlayCtx.stroke();
  }
  const locationLabel = [record.floor, record.room].filter(Boolean).join(" ");
  const label = `${locationLabel} ${record.part} ${numberText(record.quantity)}${record.unit}`;
  const anchor = record.points[0];
  overlayCtx.font = "13px sans-serif";
  const width = overlayCtx.measureText(label).width + 12;
  overlayCtx.fillStyle = "rgba(255,255,255,0.92)";
  overlayCtx.fillRect(anchor.x + 8, anchor.y - 23, width, 21);
  overlayCtx.fillStyle = color;
  overlayCtx.fillText(label, anchor.x + 14, anchor.y - 8);
  overlayCtx.restore();
}

function drawScaleCheckResult() {
  if (!scaleCheckResult || scaleCheckResult.page !== currentPage || scaleCheckResult.points.length < 2) return;
  const [a, b] = scaleCheckResult.points;
  overlayCtx.save();
  overlayCtx.strokeStyle = "#2f6fb5";
  overlayCtx.fillStyle = "#2f6fb5";
  overlayCtx.lineWidth = 3;
  overlayCtx.setLineDash([8, 5]);
  overlayCtx.beginPath();
  overlayCtx.moveTo(a.x, a.y);
  overlayCtx.lineTo(b.x, b.y);
  overlayCtx.stroke();
  overlayCtx.setLineDash([]);
  scaleCheckResult.points.forEach((point) => {
    overlayCtx.beginPath();
    overlayCtx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    overlayCtx.fill();
  });
  const label = "縮尺チェック";
  overlayCtx.font = "13px sans-serif";
  const width = overlayCtx.measureText(label).width + 12;
  const x = Math.min(a.x, b.x) + Math.abs(a.x - b.x) / 2;
  const y = Math.min(a.y, b.y) + Math.abs(a.y - b.y) / 2;
  overlayCtx.fillStyle = "rgba(255,255,255,0.94)";
  overlayCtx.fillRect(x + 8, y - 23, width, 21);
  overlayCtx.fillStyle = "#2f6fb5";
  overlayCtx.fillText(label, x + 14, y - 8);
  overlayCtx.restore();
}

function drawTemp() {
  if (tempPoints.length === 0) return;
  const previewPoints = tool === "rect" && tempPoints.length === 2 && mode === "draw"
    ? [
        { x: tempPoints[0].x, y: tempPoints[0].y },
        { x: tempPoints[1].x, y: tempPoints[0].y },
        { x: tempPoints[1].x, y: tempPoints[1].y },
        { x: tempPoints[0].x, y: tempPoints[1].y }
      ]
    : tempPoints;
  overlayCtx.save();
  overlayCtx.strokeStyle = mode === "calibrate"
    ? "#f0b429"
    : mode === "scaleCheck"
      ? "#2f6fb5"
      : isHardwareLengthTraceMode()
        ? "#17696f"
      : isDeductionTraceMode()
        ? "#8b4fc4"
        : "#c55735";
  overlayCtx.fillStyle = overlayCtx.strokeStyle;
  overlayCtx.lineWidth = 2;
  overlayCtx.setLineDash([7, 5]);
  overlayCtx.beginPath();
  previewPoints.forEach((point, index) => {
    if (index === 0) overlayCtx.moveTo(point.x, point.y);
    else overlayCtx.lineTo(point.x, point.y);
  });
  if (tool === "rect" && previewPoints.length === 4) overlayCtx.closePath();
  overlayCtx.stroke();
  overlayCtx.setLineDash([]);
  previewPoints.forEach((point) => {
    overlayCtx.beginPath();
    overlayCtx.arc(point.x, point.y, 5, 0, Math.PI * 2);
    overlayCtx.fill();
  });
  overlayCtx.restore();
}

function setHint(text) {
  els.hintText.textContent = text;
}

function isDeductionTraceMode() {
  return mode === "deductLength" || mode === "deductArea";
}

function isHardwareLengthTraceMode() {
  return mode === "hardwareLength";
}

function updateModeButtons() {
  if (els.traceDeductLengthButton) els.traceDeductLengthButton.classList.toggle("active", mode === "deductLength");
  if (els.traceDeductAreaButton) els.traceDeductAreaButton.classList.toggle("active", mode === "deductArea");
  if (els.scaleCheckButton) els.scaleCheckButton.classList.toggle("active", mode === "scaleCheck");
  els.hardwareFinishRows?.querySelectorAll("[data-hardware-trace]").forEach((button) => {
    button.classList.toggle("active", isHardwareLengthTraceMode() && button.dataset.hardwareTrace === activeHardwareLengthItemId);
  });
  els.hardwareFinishRows?.querySelectorAll("[data-hardware-finish-row]").forEach((row) => {
    row.classList.toggle("is-tracing", isHardwareLengthTraceMode() && row.dataset.hardwareFinishRow === activeHardwareLengthItemId);
  });
}

function formatInputNumber(value) {
  const number = Math.max(0, Number(value || 0));
  return number.toFixed(3).replace(/\.?0+$/, "");
}

function numberInputValue(input) {
  return Number(input.value || 0) || 0;
}

function addToNumberInput(input, value) {
  input.value = formatInputNumber(numberInputValue(input) + value);
}

function deductionRoomMatchesCurrent(record) {
  return roomSettingKey(record.floor, record.room) === roomSettingKey(els.floorInput.value, els.roomInput.value);
}

function applyDeductionRecordDelta(record, direction = 1) {
  if (record?.recordType !== "deduction") return;
  const value = Number(record.deductionValue || record.quantity || 0);
  if (!Number.isFinite(value) || value <= 0) return;
  const field = record.deductionKind === "area" ? "deductArea" : "deductLength";
  const input = field === "deductArea" ? els.deductAreaInput : els.deductLengthInput;
  const delta = direction * value;

  if (deductionRoomMatchesCurrent(record)) {
    addToNumberInput(input, delta);
  }

  const setting = findRoomSetting(record.floor, record.room);
  if (setting) {
    upsertRoomSetting({
      ...setting,
      [field]: Math.max(0, finiteNumber(setting[field]) + delta)
    }, { persist: false });
  }
}

function updateDeductionTraceButtons() {
  updateModeButtons();
}

function startDeductionTrace(kind) {
  if (!scale) {
    setHint("先に縮尺を設定してください。建具控除も縮尺を使って計算します。");
    return;
  }
  setTool(kind === "area" ? "rect" : "line");
  mode = kind === "area" ? "deductArea" : "deductLength";
  tempPoints = [];
  updateDeductionTraceButtons();
  drawOverlay();
  setHint(kind === "area"
    ? "建具面積控除をなぞります。建具表や展開図の建具外形を2点で囲んでください。"
    : "建具幅控除をなぞります。平面図の開口幅を2点でクリックしてください。");
}

function scaleUnit() {
  return els.scaleUnitInput?.value === "m" ? "m" : "mm";
}

function scaleLengthMeters(value, unit) {
  return unit === "mm" ? value / 1000 : value;
}

function scaleLengthLabel(meters, unit = scaleUnit(), options = {}) {
  const value = unit === "mm" ? meters * 1000 : meters;
  const digits = options.digits ?? (unit === "mm" ? 1 : 3);
  return `${numberText(value, digits)}${unit}`;
}

function signedScaleLengthLabel(meters, unit = scaleUnit()) {
  const sign = meters > 0 ? "+" : "";
  return `${sign}${scaleLengthLabel(meters, unit)}`;
}

function setScaleCheckStatus(text = "縮尺チェック未実施") {
  if (els.scaleCheckStatus) els.scaleCheckStatus.textContent = text;
}

function scaleStatusText(nextScale) {
  if (!nextScale) return activeDrawingId ? "この図面の縮尺未設定" : "縮尺未設定";
  const unit = nextScale.unit || "m";
  const realLengthMeters = Number(nextScale.realLength || 0);
  const inputLength = Number(nextScale.realLengthInput || (unit === "mm" ? realLengthMeters * 1000 : realLengthMeters) || 0);
  const measuredPx = Number(nextScale.measuredPx || (nextScale.pxPerMeter || 0) * realLengthMeters || 0);
  const measuredLabel = unit === "mm"
    ? `${numberText(inputLength, 0)}mm`
    : `${numberText(inputLength, 3)}m`;
  return `この図面: ${measuredLabel} = ${numberText(measuredPx, 1)}px / 1m = ${numberText(nextScale.pxPerMeter, 1)}px`;
}

function updateScaleStatus() {
  els.scaleStatus.textContent = scaleStatusText(scale);
  setScaleCheckStatus();
}

function syncScaleInputsFromScale(nextScale = scale) {
  if (!nextScale) return;
  const unit = nextScale.unit || "m";
  const realLengthMeters = Number(nextScale.realLength || 0);
  const inputLength = Number(nextScale.realLengthInput || (unit === "mm" ? realLengthMeters * 1000 : realLengthMeters) || 0);
  if (inputLength > 0) els.scaleLengthInput.value = formatInputNumber(inputLength);
  els.scaleUnitInput.value = unit;
  els.scaleUnitInput.dataset.previousUnit = unit;
}

function syncScaleUnitInput() {
  const nextUnit = scaleUnit();
  const previousUnit = els.scaleUnitInput.dataset.previousUnit || nextUnit;
  const currentValue = Number(els.scaleLengthInput.value || 0);
  if (currentValue > 0 && previousUnit !== nextUnit) {
    const meters = scaleLengthMeters(currentValue, previousUnit);
    const converted = nextUnit === "mm" ? meters * 1000 : meters;
    els.scaleLengthInput.value = nextUnit === "mm"
      ? String(Math.round(converted))
      : String(Math.round(converted * 1000) / 1000);
  }
  els.scaleLengthInput.step = nextUnit === "mm" ? "1" : "0.001";
  els.scaleUnitInput.dataset.previousUnit = nextUnit;
}

function normalizeRoomText(value) {
  return String(value || "").normalize("NFKC").trim();
}

function finiteNumber(value, fallback = 0) {
  const number = Number(value);
  return Number.isFinite(number) ? number : fallback;
}

function optionalNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : undefined;
}

function hasPositiveNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) && Math.abs(number) > 0.0001;
}

function trimSettingValue(value) {
  const text = normalizeMaterialText(value);
  const key = normalizeSearchText(text).replace(/\s+/g, "");
  if (!key || ["NO", "NONE", "ナシ", "なし", "無し"].includes(key)) return "no";
  if (["YES", "ARI", "アリ", "あり", "有り"].includes(key)) return "yes";
  return text;
}

function trimAvailability(value) {
  return trimSettingValue(value) === "no" ? "no" : "yes";
}

function trimAvailabilityLabel(value) {
  const normalized = trimSettingValue(value);
  if (normalized === "no") return "なし";
  if (normalized === "yes") return "あり";
  return normalized;
}

function displayTrimInputValue(value) {
  const normalized = trimSettingValue(value);
  if (normalized === "no") return "";
  if (normalized === "yes") return "あり";
  return normalized;
}

function wainscotAvailability(value) {
  if (value === "yes") return "yes";
  if (value === "no") return "no";
  return "";
}

function wainscotAvailabilityLabel(value) {
  const availability = wainscotAvailability(value);
  if (availability === "yes") return "あり";
  if (availability === "no") return "なし";
  return "部材なし";
}

function roomSettingKey(floor, room) {
  const normalizedFloor = normalizeRoomText(floor) || "未設定";
  const normalizedRoom = normalizeRoomText(room) || "未設定";
  return `${normalizedFloor}__${normalizedRoom}`;
}

function roomSuggestionKey(suggestion) {
  return `${normalizeRoomText(suggestion?.floor || "")}__${normalizeRoomText(suggestion?.room || "")}`;
}

const roomNamePattern = new RegExp([
  "ENTホール",
  "玄関ホール",
  "事務所スペース",
  "ウォークインクローゼット",
  "シューズクローク",
  "クローゼット",
  "洗面脱衣室",
  "ユーティリティ",
  "ランドリー",
  "パントリー",
  "洗面室",
  "洗面所",
  "脱衣室",
  "ユニットバス",
  "浴室",
  "トイレ",
  "便所",
  "玄関",
  "廊下",
  "ホール",
  "階段",
  "LDK",
  "DK",
  "リビング",
  "ダイニング",
  "キッチン",
  "台所",
  "主寝室",
  "寝室",
  "子供室[0-9０-９]*",
  "子ども室[0-9０-９]*",
  "洋室[0-9０-９]*",
  "和室[0-9０-９]*",
  "WCL[0-9０-９]*",
  "WIC[0-9０-９]*",
  "CL[0-9０-９]*",
  "収納",
  "物入",
  "納戸",
  "押入",
  "書斎",
  "客室",
  "勝手口",
  "ポーチ",
  "バルコニー",
  "ベランダ",
  "テラス",
  "屋上",
  "ロフト"
].join("|"), "giu");

function cleanRoomCandidate(value) {
  let text = normalizeRoomText(value)
    .replace(/[【】「」『』（）()[\]{}]/g, "")
    .replace(/[・･,，.。:：;；/／\\|｜▼▲=＝+\-＿_]/g, "")
    .replace(/\s+/g, "");
  if (!text || /^(室名|部屋名|床|壁|天井|巾木|廻り縁|展開方向)$/u.test(text)) return "";
  if (/^[0-9０-９A-Za-z]+$/u.test(text) && !/^(LDK|DK|WCL|WIC|CL)/iu.test(text)) return "";
  if (text.length < 2 || text.length > 20) return "";
  return text;
}

function inferFloorLabelFromText(value) {
  const text = normalizeSearchText(value).replace(/\s+/g, "");
  if (!text) return "";
  if (/(R階|RF|ROOF|屋上)/iu.test(text)) return "R階";
  const floorMatch = text.match(/([0-9０-９]+)(?:階|F)/iu);
  if (!floorMatch) return "";
  const floorNumber = floorMatch[1].normalize("NFKC");
  return `${floorNumber}階`;
}

function normalizeRoomSuggestion(value, fallback = {}) {
  const source = typeof value === "string" ? { room: value } : (value || {});
  const room = cleanRoomCandidate(source.room || source.name);
  if (!room) return null;
  return {
    floor: normalizeRoomText(source.floor || fallback.floor || ""),
    room,
    source: normalizeRoomText(source.source || fallback.source || "図面候補"),
    updatedAt: finiteNumber(source.updatedAt, Date.now())
  };
}

function normalizeRoomSuggestions(values = [], fallback = {}) {
  const merged = new Map();
  (Array.isArray(values) ? values : []).forEach((value) => {
    const suggestion = normalizeRoomSuggestion(value, fallback);
    if (!suggestion) return;
    const key = roomSuggestionKey(suggestion);
    merged.set(key, { ...(merged.get(key) || {}), ...suggestion });
  });
  return Array.from(merged.values()).sort(compareRoomSettings);
}

function extractRoomSuggestionsFromText(text, context = {}) {
  const source = normalizeRoomText(text);
  if (!source) return [];
  const floor = normalizeRoomText(context.floor || inferFloorLabelFromText(`${context.source || ""} ${source}`));
  const compact = source.normalize("NFKC").replace(/\s+/g, "");
  const suggestions = [];
  for (const match of compact.matchAll(roomNamePattern)) {
    const room = cleanRoomCandidate(match[0]);
    if (room) suggestions.push({ floor, room, source: context.source || "図面候補" });
  }
  return normalizeRoomSuggestions(suggestions);
}

function collectRoomSuggestionValues() {
  const values = [...roomSuggestions];
  const addRecordRooms = (items = []) => {
    items.forEach((record) => {
      if (record.room) values.push({ floor: record.floor, room: record.room, source: "拾い履歴" });
    });
  };
  addRecordRooms(records);
  drawingEntries.forEach((entry) => {
    const source = [entry.drawingNumber, entry.title || entry.name].filter(Boolean).join(" ");
    const floor = inferFloorLabelFromText(source || entry.name || entry.sourcePath);
    addRecordRooms(entry.records || []);
    [
      entry.name,
      entry.title,
      entry.category,
      entry.takeoffRole,
      entry.sourcePath,
      entry.textSample
    ].forEach((value) => {
      values.push(...extractRoomSuggestionsFromText(value, { floor, source }));
    });
  });
  return values;
}

function addRoomSuggestions(values = [], options = {}) {
  const before = roomSuggestions.map(roomSuggestionKey).join("|");
  roomSuggestions = normalizeRoomSuggestions([...values, ...roomSuggestions]);
  const changed = before !== roomSuggestions.map(roomSuggestionKey).join("|");
  if (els.roomMenu && !els.roomMenu.hidden) renderRoomMenu();
  if (changed && options.persist) saveQuietly();
  return changed;
}

function refreshRoomSuggestions() {
  roomSuggestions = normalizeRoomSuggestions(collectRoomSuggestionValues());
  if (els.roomMenu && !els.roomMenu.hidden) renderRoomMenu();
}

function roomSearchNeedle() {
  return normalizeSearchText(els.roomInput?.value || "").replace(/\s+/g, "");
}

function roomMatchesSearch(item, needle) {
  if (!needle) return true;
  return normalizeSearchText(`${item.floor || ""} ${item.room || ""} ${item.source || ""}`)
    .replace(/\s+/g, "")
    .includes(needle);
}

function currentRoomSetting(extra = {}) {
  const floor = normalizeRoomText(els.floorInput.value) || "未設定";
  const room = normalizeRoomText(els.roomInput.value);
  if (!room) return null;
  return {
    key: roomSettingKey(floor, room),
    floor,
    room,
    height: finiteNumber(els.heightInput.value),
    baseboard: trimSettingValue(els.baseboardInput.value),
    ceilingTrim: trimSettingValue(els.ceilingTrimInput.value),
    wainscot: wainscotAvailability(els.wainscotInput.value),
    deductLength: finiteNumber(els.deductLengthInput.value),
    deductArea: finiteNumber(els.deductAreaInput.value),
    ...extra
  };
}

function normalizeRoomSetting(setting) {
  const floor = normalizeRoomText(setting?.floor) || "未設定";
  const room = normalizeRoomText(setting?.room || setting?.name);
  if (!room) return null;
  return {
    key: roomSettingKey(floor, room),
    floor,
    room,
    height: finiteNumber(setting.height),
    baseboard: trimSettingValue(setting.baseboard),
    ceilingTrim: trimSettingValue(setting.ceilingTrim),
    wainscot: wainscotAvailability(setting.wainscot),
    deductLength: finiteNumber(setting.deductLength),
    deductArea: finiteNumber(setting.deductArea),
    lastFormula: setting.lastFormula || "",
    lastExpression: setting.lastExpression || "",
    lastQuantity: optionalNumber(setting.lastQuantity),
    lastUnit: setting.lastUnit || "",
    lastAreaM2: optionalNumber(setting.lastAreaM2),
    lastPerimeterM: optionalNumber(setting.lastPerimeterM),
    lastLineM: optionalNumber(setting.lastLineM),
    ...(setting.contentRegistered === true ? { contentRegistered: true } : {}),
    updatedAt: finiteNumber(setting.updatedAt, Date.now())
  };
}

function normalizeRoomSettings(settings) {
  const merged = new Map();
  (Array.isArray(settings) ? settings : []).forEach((setting) => {
    const normalized = normalizeRoomSetting(setting);
    if (!normalized) return;
    merged.set(normalized.key, { ...(merged.get(normalized.key) || {}), ...normalized });
  });
  return Array.from(merged.values()).sort(compareRoomSettings);
}

function compareRoomSettings(a, b) {
  return String(a.floor || "").localeCompare(String(b.floor || ""), "ja", { numeric: true }) ||
    String(a.room || "").localeCompare(String(b.room || ""), "ja", { numeric: true });
}

function roomSettingSummary(setting) {
  const parts = [];
  if (Number.isFinite(Number(setting.height))) parts.push(`高さ ${numberText(setting.height)}m`);
  const baseboard = trimSettingValue(setting.baseboard);
  const ceilingTrim = trimSettingValue(setting.ceilingTrim);
  parts.push(baseboard === "no" ? "巾木なし" : baseboard === "yes" ? "巾木あり" : `巾木 ${baseboard}`);
  parts.push(ceilingTrim === "no" ? "廻り縁なし" : ceilingTrim === "yes" ? "廻り縁あり" : `廻り縁 ${ceilingTrim}`);
  const wainscot = wainscotAvailability(setting.wainscot);
  if (wainscot === "yes") parts.push("腰壁あり");
  if (!wainscot) parts.push("腰壁部材なし");
  if (hasPositiveNumber(setting.lastPerimeterM)) parts.push(`周長 ${numberText(setting.lastPerimeterM)}m`);
  if (hasPositiveNumber(setting.lastAreaM2)) parts.push(`面積 ${numberText(setting.lastAreaM2)}m2`);
  if (hasPositiveNumber(setting.deductLength)) parts.push(`幅控除 ${numberText(setting.deductLength)}m`);
  if (hasPositiveNumber(setting.deductArea)) parts.push(`面積控除 ${numberText(setting.deductArea)}m2`);
  return parts.join(" / ") || "設定なし";
}

function registeredRoomContentEntries() {
  return roomSettings
    .filter((setting) => setting.contentRegistered)
    .sort(compareRoomSettings);
}

function syncRegisteredRoomSelection() {
  if (!els.registeredRoomSelect) return;
  const currentKey = finishTableLocation()?.key || "";
  const hasCurrentRoom = Array.from(els.registeredRoomSelect.options)
    .some((option) => option.value === currentKey);
  els.registeredRoomSelect.value = hasCurrentRoom ? currentKey : "";
}

function renderRegisteredRoomSelect(options = {}) {
  if (!els.registeredRoomSelect) return;
  const selectedKey = options.selectedKey ?? finishTableLocation()?.key ?? "";
  const entries = registeredRoomContentEntries();
  els.registeredRoomSelect.innerHTML = "";
  const placeholder = document.createElement("option");
  placeholder.value = "";
  placeholder.textContent = "階数・部屋を選択";
  els.registeredRoomSelect.appendChild(placeholder);
  entries.forEach((setting) => {
    const option = document.createElement("option");
    option.value = setting.key;
    option.textContent = `${setting.floor} / ${setting.room}`;
    els.registeredRoomSelect.appendChild(option);
  });
  els.registeredRoomSelect.disabled = entries.length === 0;
  els.registeredRoomSelect.value = entries.some((setting) => setting.key === selectedKey)
    ? selectedKey
    : "";
}

function findRoomSetting(floor = els.floorInput.value, room = els.roomInput.value) {
  const key = roomSettingKey(floor, room);
  return roomSettings.find((setting) => setting.key === key) || null;
}

function updateRoomStatus() {
  const room = normalizeRoomText(els.roomInput.value);
  if (!room) {
    els.roomStatus.textContent = "部屋設定未登録";
    syncRegisteredRoomSelection();
    return;
  }
  const setting = findRoomSetting();
  els.roomStatus.textContent = setting
    ? `${setting.contentRegistered ? "内容登録済み" : "部屋設定登録済み"}: ${roomSettingSummary(setting)}`
    : "部屋設定未登録";
  syncRegisteredRoomSelection();
}

function upsertRoomSetting(setting, options = {}) {
  const normalized = normalizeRoomSetting(setting);
  if (!normalized) return null;
  const existingIndex = roomSettings.findIndex((candidate) => candidate.key === normalized.key);
  const existing = existingIndex >= 0 ? roomSettings[existingIndex] : {};
  const merged = { ...existing, ...normalized, updatedAt: Date.now() };
  ["lastQuantity", "lastAreaM2", "lastPerimeterM", "lastLineM"].forEach((key) => {
    if (normalized[key] === undefined && existing[key] !== undefined) merged[key] = existing[key];
  });
  if (existingIndex >= 0) roomSettings[existingIndex] = merged;
  else roomSettings.push(merged);
  roomSettings.sort(compareRoomSettings);
  updateRoomStatus();
  if (els.roomMenu && !els.roomMenu.hidden) renderRoomMenu();
  if (options.persist) saveQuietly();
  return merged;
}

function saveRoomSettingFromInputs(options = {}) {
  const setting = currentRoomSetting();
  if (!setting) {
    setHint("部屋名を入力してください。");
    updateRoomStatus();
    return null;
  }
  const saved = upsertRoomSetting(setting, { persist: options.persist !== false });
  if (!options.silent) setHint(`「${saved.floor} ${saved.room}」の部屋設定を保存しました。`);
  if (!options.keepOpen) closeRoomMenu();
  return saved;
}

function autoSaveCurrentRoomSetting() {
  if (!currentRoomSetting()) return;
  saveRoomSettingFromInputs({ silent: true, keepOpen: true });
}

function saveCurrentRoomContent() {
  if (!finishTableLocation()) {
    setHint("階数と部屋・範囲を入力してください。");
    updateRoomStatus();
    return;
  }
  applyMatchingRoomSetting();
  saveActiveFinishTable();
  const setting = upsertRoomSetting({ ...currentRoomSetting(), contentRegistered: true }, { persist: false });
  if (!setting) return;
  renderRegisteredRoomSelect({ selectedKey: setting.key });
  saveQuietly();
  setHint(`「${setting.floor} ${setting.room}」の内容を登録しました。登録済みの内容からいつでも呼び出せます。`);
}

function loadRegisteredRoomContent(key) {
  const setting = registeredRoomContentEntries().find((candidate) => candidate.key === key);
  if (!setting) return;
  applyRoomSetting(setting);
  renderRegisteredRoomSelect({ selectedKey: setting.key });
}

function applyRoomSetting(setting, options = {}) {
  if (options.saveFinish !== false) saveActiveFinishTable();
  els.floorInput.value = setting.floor || "";
  els.roomInput.value = setting.room || "";
  els.heightInput.value = String(finiteNumber(setting.height));
  els.baseboardInput.value = displayTrimInputValue(setting.baseboard);
  els.ceilingTrimInput.value = displayTrimInputValue(setting.ceilingTrim);
  els.wainscotInput.value = wainscotAvailability(setting.wainscot);
  els.deductLengthInput.value = String(finiteNumber(setting.deductLength));
  els.deductAreaInput.value = String(finiteNumber(setting.deductArea));
  loadFinishTableForCurrentRoom({ fallbackInternal: internalFinishFallbackFromRoomSetting() });
  updateRoomStatus();
  if (!options.keepOpen) closeRoomMenu();
  if (!options.silent) setHint(`「${setting.floor} ${setting.room}」の部屋設定を呼び出しました。`);
}

function applyRoomSuggestion(suggestion) {
  const floor = normalizeRoomText(suggestion.floor || els.floorInput.value) || "未設定";
  const existing = findRoomSetting(floor, suggestion.room);
  if (existing) {
    applyRoomSetting(existing);
    return;
  }
  saveActiveFinishTable();
  els.floorInput.value = floor;
  els.roomInput.value = suggestion.room || "";
  loadFinishTableForCurrentRoom();
  updateRoomStatus();
  closeRoomMenu();
  setHint(`図面候補から「${floor} ${suggestion.room}」を入力しました。高さや控除を確認して作業できます。`);
}

function applyMatchingRoomSetting() {
  const nextLocation = finishTableLocation();
  if (!nextLocation || nextLocation.key === activeFinishTableLocation?.key) {
    updateRoomStatus();
    return;
  }
  saveActiveFinishTable();
  const setting = findRoomSetting();
  if (setting) applyRoomSetting(setting, { silent: true, saveFinish: false });
  else {
    loadFinishTableForCurrentRoom();
    updateRoomStatus();
  }
}

function renderRoomMenu() {
  if (!els.roomMenu) return;
  els.roomMenu.innerHTML = "";
  const needle = roomMenuSearchEnabled ? roomSearchNeedle() : "";
  const current = currentRoomSetting();
  const action = document.createElement("button");
  action.type = "button";
  action.className = "room-menu-action";
  action.disabled = !current;
  const existing = current ? findRoomSetting(current.floor, current.room) : null;
  action.innerHTML = `
    <span class="room-menu-title">${existing ? "現在の設定で更新" : "現在の部屋を追加"}</span>
    <span class="room-menu-meta">${current ? escapeHtml(`${current.floor} ${current.room} / ${roomSettingSummary(current)}`) : "部屋名を入力してください"}</span>
  `;
  action.addEventListener("click", (event) => {
    event.preventDefault();
    saveRoomSettingFromInputs({ keepOpen: false });
  });
  els.roomMenu.appendChild(action);

  const filteredSettings = roomSettings.filter((setting) => roomMatchesSearch(setting, needle));
  const registeredKeys = new Set(roomSettings.map(roomSuggestionKey));
  const filteredSuggestions = roomSuggestions
    .filter((suggestion) => !registeredKeys.has(roomSuggestionKey(suggestion)))
    .filter((suggestion) => roomMatchesSearch(suggestion, needle))
    .slice(0, 120);

  if (filteredSettings.length === 0 && filteredSuggestions.length === 0) {
    const empty = document.createElement("div");
    empty.className = "room-menu-empty";
    empty.textContent = needle
      ? "該当する部屋候補がありません。"
      : "登録済み・図面候補の部屋はありません。";
    els.roomMenu.appendChild(empty);
    return;
  }

  filteredSettings.forEach((setting) => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `
      <span class="room-menu-title">${escapeHtml(setting.floor)} ${escapeHtml(setting.room)}</span>
      <span class="room-menu-meta">${escapeHtml(roomSettingSummary(setting))}</span>
    `;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      applyRoomSetting(setting);
    });
    els.roomMenu.appendChild(button);
  });

  filteredSuggestions.forEach((suggestion) => {
    const button = document.createElement("button");
    button.type = "button";
    button.innerHTML = `
      <span class="room-menu-title">${escapeHtml(suggestion.floor || "階未指定")} ${escapeHtml(suggestion.room)}</span>
      <span class="room-menu-meta">${escapeHtml(suggestion.source || "図面から読み取り")}</span>
    `;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      applyRoomSuggestion(suggestion);
    });
    els.roomMenu.appendChild(button);
  });
}

function openRoomMenu(options = {}) {
  roomMenuSearchEnabled = options.search === true;
  refreshRoomSuggestions();
  renderRoomMenu();
  els.roomMenu.hidden = false;
}

function closeRoomMenu() {
  if (els.roomMenu) els.roomMenu.hidden = true;
}

function toggleRoomMenu(options = {}) {
  if (els.roomMenu.hidden) openRoomMenu(options);
  else closeRoomMenu();
}

function updateRoomSettingFromRecord(record, calc) {
  upsertRoomSetting({
    ...currentRoomSetting(),
    lastFormula: record.formula,
    lastExpression: record.expression,
    lastQuantity: record.quantity,
    lastUnit: record.unit,
    lastAreaM2: calc.metrics?.areaM2,
    lastPerimeterM: calc.metrics?.perimeterM,
    lastLineM: calc.metrics?.lineM
  }, { persist: false });
}

function prepareOpeningInputs() {
  updateOpeningTradeButtons();
  const trade = openingTradeName(els.openingTradeInput.value);
  if (!trade) return;
  setHint(`${trade}を選んだ状態で、図面をなぞって拾い明細に反映できます。`);
}

function normalizeSearchText(value) {
  return String(value || "").normalize("NFKC").toUpperCase();
}

function normalizeMaterialText(value) {
  return String(value || "")
    .normalize("NFKC")
    .replace(/[｜|]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function materialSuggestionKey(value) {
  return normalizeSearchText(normalizeMaterialText(value)).replace(/\s+/g, "");
}

const genericMaterialInputKeys = [
  "仕上材",
  "仕上げ材",
  "下地材",
  "部材",
  "材料",
  "仕様",
  "部材仕様",
  "部材・仕様"
].map((value) => materialSuggestionKey(value));

function isGenericMaterialInput(value) {
  const key = materialSuggestionKey(value);
  return Boolean(key && genericMaterialInputKeys.includes(key));
}

function materialSearchNeedle() {
  const value = normalizeMaterialText(els.materialInput?.value || "");
  if (!value || isGenericMaterialInput(value)) return "";
  let key = materialSuggestionKey(value);
  genericMaterialInputKeys.forEach((genericKey) => {
    if (key.startsWith(genericKey)) key = key.slice(genericKey.length);
    if (key.endsWith(genericKey)) key = key.slice(0, -genericKey.length);
  });
  return key;
}

function cleanMaterialCandidate(value) {
  let text = normalizeMaterialText(value)
    .replace(/^[\s:：・,，.。／/\\|]+|[\s:：・,，.。／/\\|]+$/g, "")
    .replace(/^(床|壁|天井|内壁|外壁|下地|仕上|巾木|廻り縁)\s*[:：・=-]\s*/u, "");
  if (!text || !materialKeywordPattern.test(text)) return "";
  if (/^(仕上表|特記仕様書|面積表|平面図|立面図|断面図|配置図|案内図)$/u.test(text)) return "";

  const keyword = text.match(materialKeywordPattern);
  if (keyword && text.length > 52) {
    const start = Math.max(0, keyword.index - 18);
    const end = Math.min(text.length, keyword.index + keyword[0].length + 28);
    text = text.slice(start, end).replace(/^[\s:：・,，.。／/\\|]+|[\s:：・,，.。／/\\|]+$/g, "");
  }

  text = text
    .replace(/(.{6,36})\1+/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  if (text.length < 2 || text.length > 60) return "";
  if (/^[0-9０-９\s.,，.／/\-ー]+$/u.test(text)) return "";
  return text;
}

function normalizeMaterialSuggestions(values = []) {
  const seen = new Set();
  const normalized = [];
  values.forEach((value) => {
    const text = cleanMaterialCandidate(value) || normalizeMaterialText(value);
    if (!text || text.length > 60) return;
    const key = materialSuggestionKey(text);
    if (!key || seen.has(key)) return;
    seen.add(key);
    normalized.push(text);
  });
  return normalized.sort((a, b) => a.localeCompare(b, "ja", { numeric: true }));
}

function extractMaterialCandidatesFromText(text) {
  const source = normalizeMaterialText(text);
  if (!source) return [];
  const candidates = [];
  const materialChars = "[一-龥々〆ヵヶぁ-んァ-ヶーA-Za-z0-9０-９（）()・･\\-＿_／/\\.．,，=＝＋+ ]";
  const patterns = [
    new RegExp(`${materialChars}{0,24}(?:ビニールクロス|ビニ-ルクロス|クロス|石膏ボード|プラスターボード|PB|LGS|ケイカル板|珪酸カルシウム板|合板|モルタル|塗装|タイル|長尺塩ビシート|塩ビシート|CFシート|フローリング|ソフト巾木|木製巾木|廻り縁|巾木|ガラス|硝子|ステンレス|アルミ|鋼製)${materialChars}{0,28}`, "giu"),
    new RegExp(`${materialChars}{1,32}(?:仕上げ?|下地)${materialChars}{0,24}`, "giu")
  ];
  patterns.forEach((pattern) => {
    for (const match of source.matchAll(pattern)) {
      const candidate = cleanMaterialCandidate(match[0]);
      if (candidate) candidates.push(candidate);
    }
  });
  source.split(/[\r\n\t、;；]+/u).forEach((part) => {
    const candidate = cleanMaterialCandidate(part);
    if (candidate) candidates.push(candidate);
  });
  return normalizeMaterialSuggestions(candidates);
}

function directFinishCandidateValues() {
  const finishSchedule = currentFinishSchedule();
  const externalFinishSchedule = currentExternalFinishSchedule();
  const externalValues = Object.values(externalFinishSchedule).flatMap((rows) => rows.flatMap((row) => [row.finish, row.summary]));
  const internalValues = Object.entries(finishSchedule.materials || {})
    .filter(([key]) => !["baseboard", "ceilingTrim"].includes(key))
    .map(([, value]) => value);
  const values = [
    ...internalValues,
    ...(finishSchedule.hardware || []).map((item) => item.name),
    ...Object.values(finishSchedule.itemSummaries || {}),
    ...externalValues
  ];
  [finishSchedule.materials?.baseboard, finishSchedule.materials?.ceilingTrim].forEach((trim) => {
    const normalized = trimSettingValue(trim);
    if (!["no", "yes"].includes(normalized)) values.push(normalized);
  });
  return values.map(normalizeMaterialText).filter(Boolean);
}

function addDirectFinishCandidates(options = {}) {
  const values = directFinishCandidateValues();
  const extracted = values.flatMap(extractMaterialCandidatesFromText);
  return addMaterialSuggestions([...values, ...extracted], options);
}

function collectMaterialSuggestionValues() {
  const values = [...defaultMaterialSuggestions, ...materialSuggestions];
  const addRecordMaterials = (items = []) => {
    items.forEach((record) => {
      if (record.material) values.push(record.material);
      [record.baseboard, record.ceilingTrim].forEach((trim) => {
        const normalized = trimSettingValue(trim);
        if (!["no", "yes"].includes(normalized)) values.push(normalized);
      });
      if (record.wallSubstrate) values.push(record.wallSubstrate);
      if (record.ceilingSubstrate) values.push(record.ceilingSubstrate);
      if (record.substrateSummary) values.push(...extractMaterialCandidatesFromText(record.substrateSummary));
      if (record.memo) values.push(...extractMaterialCandidatesFromText(record.memo));
    });
  };
  const currentSubstrates = currentSubstrateSettings();
  values.push(currentSubstrates.wallSubstrate, currentSubstrates.ceilingSubstrate);
  const finishSchedule = currentFinishSchedule();
  values.push(...directFinishCandidateValues());
  Object.values(finishSchedule.itemSummaries || {}).forEach((summary) => {
    values.push(...extractMaterialCandidatesFromText(summary));
  });
  addRecordMaterials(records);
  drawingEntries.forEach((entry) => {
    addRecordMaterials(entry.records || []);
    [
      entry.name,
      entry.title,
      entry.category,
      entry.takeoffRole,
      entry.sourcePath,
      entry.textSample
    ].forEach((text) => {
      values.push(...extractMaterialCandidatesFromText(text));
    });
  });
  return values;
}

function renderMaterialDatalist() {
  if (!els.materialDatalist) return;
  els.materialDatalist.innerHTML = "";
  materialSuggestions.slice(0, 240).forEach((material) => {
    const option = document.createElement("option");
    option.value = material;
    els.materialDatalist.appendChild(option);
  });
}

function filteredMaterialSuggestions() {
  const needle = materialSearchNeedle();
  const suggestions = needle
    ? materialSuggestions.filter((material) => materialSuggestionKey(material).includes(needle))
    : materialSuggestions;
  return suggestions
    .slice()
    .sort((a, b) => {
      const aKey = materialSuggestionKey(a);
      const bKey = materialSuggestionKey(b);
      const aStarts = needle && aKey.startsWith(needle) ? 0 : 1;
      const bStarts = needle && bKey.startsWith(needle) ? 0 : 1;
      return aStarts - bStarts || a.localeCompare(b, "ja", { numeric: true });
    })
    .slice(0, 80);
}

function addMaterialSuggestions(values = [], options = {}) {
  const before = materialSuggestions.map(materialSuggestionKey).join("|");
  materialSuggestions = normalizeMaterialSuggestions([...values, ...materialSuggestions]);
  renderMaterialDatalist();
  if (els.materialMenu && !els.materialMenu.hidden) renderMaterialMenu();
  renderOpenFinishMenus();
  const changed = before !== materialSuggestions.map(materialSuggestionKey).join("|");
  if (changed && options.persist) saveQuietly();
  return changed;
}

function addMaterialSuggestion(value, options = {}) {
  const text = cleanMaterialCandidate(value) || normalizeMaterialText(value);
  if (!text) return false;
  return addMaterialSuggestions([text], options);
}

function refreshMaterialSuggestions() {
  materialSuggestions = normalizeMaterialSuggestions(collectMaterialSuggestionValues());
  renderMaterialDatalist();
  if (els.materialMenu && !els.materialMenu.hidden) renderMaterialMenu();
  renderOpenFinishMenus();
}

function renderMaterialMenu() {
  if (!els.materialMenu) return;
  els.materialMenu.innerHTML = "";
  const current = normalizeMaterialText(els.materialInput.value);
  const currentIsGeneric = isGenericMaterialInput(current);
  const currentExists = materialSuggestions.some((material) => materialSuggestionKey(material) === materialSuggestionKey(current));
  if (current && !currentIsGeneric && !currentExists) {
    const action = document.createElement("button");
    action.type = "button";
    action.className = "material-menu-action";
    action.setAttribute("role", "option");
    action.innerHTML = `
      <span class="material-menu-title">現在の入力を候補に追加</span>
      <span class="material-menu-meta">${escapeHtml(current)}</span>
    `;
    action.addEventListener("click", (event) => {
      event.preventDefault();
      addMaterialSuggestion(current, { persist: true });
      closeMaterialMenu();
    });
    els.materialMenu.appendChild(action);
  }

  const items = filteredMaterialSuggestions();
  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "material-menu-empty";
    empty.textContent = "候補がありません。入力して候補に追加できます。";
    els.materialMenu.appendChild(empty);
    return;
  }

  items.forEach((material) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("role", "option");
    button.innerHTML = `
      <span class="material-menu-title">${escapeHtml(material)}</span>
      <span class="material-menu-meta">図面・入力履歴の候補</span>
    `;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      els.materialInput.value = material;
      resizeMaterialInput();
      addMaterialSuggestion(material, { persist: false });
      closeMaterialMenu();
    });
    els.materialMenu.appendChild(button);
  });
}

function openMaterialMenu() {
  closeFinishMenus();
  refreshMaterialSuggestions();
  renderMaterialMenu();
  els.materialMenu.hidden = false;
  els.materialInput?.setAttribute("aria-expanded", "true");
}

function closeMaterialMenu() {
  if (els.materialMenu) els.materialMenu.hidden = true;
  els.materialInput?.setAttribute("aria-expanded", "false");
}

function finishPickerConfigs() {
  return [
    {
      key: "floor",
      label: "床仕上",
      input: internalFinishInput("floor"),
      button: document.getElementById("floorFinishMenuButton"),
      menu: document.getElementById("floorFinishMenu"),
      match: /床|フローリング|タイル|シート|CF|長尺|塩ビ|カーペット|畳|モルタル|コンクリート|仕上/,
      sourceMeta: "PDFから読み取った床仕上候補"
    },
    {
      key: "baseboard",
      label: "巾木",
      input: internalFinishInput("baseboard"),
      button: document.getElementById("baseboardMenuButton"),
      menu: document.getElementById("baseboardMenu"),
      allowNone: true,
      match: /巾木|幅木|HABAKI|BASEBOARD/,
      restrictToMatch: true,
      sourceMeta: "PDF読取候補・入力履歴"
    },
    {
      key: "wall",
      label: "外壁側壁 仕上",
      input: internalFinishInput("wall"),
      button: document.getElementById("wallFinishMenuButton"),
      menu: document.getElementById("wallFinishMenu"),
      match: /壁|内壁|外壁|クロス|ビニール|塗装|タイル|モルタル|シート|パネル|ボード|PB|石膏|珪酸|ケイカル|合板|化粧|仕上/,
      sourceMeta: "PDFから読み取った壁仕上候補"
    },
    {
      key: "partitionWall",
      label: "間仕切壁 仕上",
      input: internalFinishInput("partitionWall"),
      button: document.getElementById("partitionWallFinishMenuButton"),
      menu: document.getElementById("partitionWallFinishMenu"),
      match: /壁|内壁|クロス|ビニール|塗装|タイル|モルタル|シート|パネル|ボード|PB|石膏|珪酸|ケイカル|合板|化粧|仕上/,
      sourceMeta: "PDF読取候補・入力履歴"
    },
    {
      key: "plywoodReinforcement",
      label: "ベニヤ補強",
      input: internalFinishInput("plywoodReinforcement"),
      button: document.getElementById("plywoodReinforcementMenuButton"),
      menu: document.getElementById("plywoodReinforcementMenu"),
      match: /ベニヤ|合板|構造用|補強|板/,
      sourceMeta: "PDF読取候補・入力履歴"
    },
    {
      key: "exteriorWainscotUpperFinish",
      label: "外壁側壁 腰上仕上",
      input: internalFinishInput("exteriorWainscotUpperFinish"),
      button: document.getElementById("exteriorWainscotUpperFinishMenuButton"),
      menu: document.getElementById("exteriorWainscotUpperFinishMenu"),
      match: /壁|腰|クロス|ビニール|塗装|タイル|モルタル|シート|パネル|ボード|仕上/,
      sourceMeta: "PDF読取候補・入力履歴"
    },
    {
      key: "exteriorWainscotLowerFinish",
      label: "外壁側壁 腰下仕上",
      input: internalFinishInput("exteriorWainscotLowerFinish"),
      button: document.getElementById("exteriorWainscotLowerFinishMenuButton"),
      menu: document.getElementById("exteriorWainscotLowerFinishMenu"),
      match: /壁|腰|クロス|ビニール|塗装|タイル|モルタル|シート|パネル|ボード|仕上/,
      sourceMeta: "PDF読取候補・入力履歴"
    },
    {
      key: "partitionWainscotUpperFinish",
      label: "間仕切壁 腰上仕上",
      input: internalFinishInput("partitionWainscotUpperFinish"),
      button: document.getElementById("partitionWainscotUpperFinishMenuButton"),
      menu: document.getElementById("partitionWainscotUpperFinishMenu"),
      match: /壁|腰|クロス|ビニール|塗装|タイル|モルタル|シート|パネル|ボード|仕上/,
      sourceMeta: "PDF読取候補・入力履歴"
    },
    {
      key: "partitionWainscotLowerFinish",
      label: "間仕切壁 腰下仕上",
      input: internalFinishInput("partitionWainscotLowerFinish"),
      button: document.getElementById("partitionWainscotLowerFinishMenuButton"),
      menu: document.getElementById("partitionWainscotLowerFinishMenu"),
      match: /壁|腰|クロス|ビニール|塗装|タイル|モルタル|シート|パネル|ボード|仕上/,
      sourceMeta: "PDF読取候補・入力履歴"
    },
    {
      key: "ceiling",
      label: "天井仕上",
      input: internalFinishInput("ceiling"),
      button: document.getElementById("ceilingFinishMenuButton"),
      menu: document.getElementById("ceilingFinishMenu"),
      match: /天井|クロス|ビニール|塗装|岩綿|吸音|ロックウール|ジプトーン|ボード|PB|石膏|珪酸|ケイカル|化粧|仕上/,
      sourceMeta: "PDFから読み取った天井仕上候補"
    },
    {
      key: "ceilingTrim",
      label: "廻り縁",
      input: internalFinishInput("ceilingTrim"),
      button: document.getElementById("ceilingTrimMenuButton"),
      menu: document.getElementById("ceilingTrimMenu"),
      allowNone: true,
      match: /廻り縁|廻縁|回り縁|回縁|廻りブチ|回りブチ|MOLDING|CEILINGTRIM/,
      restrictToMatch: true,
      sourceMeta: "PDF読取候補・入力履歴"
    }
  ].filter((picker) => picker.input && picker.button && picker.menu);
}

function finishSearchNeedle(input) {
  return materialSuggestionKey(normalizeMaterialText(input?.value || ""));
}

function filteredFinishSuggestions(picker) {
  const needle = finishSearchNeedle(picker.input);
  const source = needle
    ? materialSuggestions.filter((material) => materialSuggestionKey(material).includes(needle))
    : materialSuggestions;
  const preferredKeys = picker.match
    ? new Set(source
      .filter((material) => picker.match.test(normalizeSearchText(material)))
      .map((material) => materialSuggestionKey(material)))
    : new Set();
  const suggestions = source;
  return suggestions
    .slice()
    .sort((a, b) => {
      const aKey = materialSuggestionKey(a);
      const bKey = materialSuggestionKey(b);
      const aPreferred = preferredKeys.has(aKey) ? 0 : 1;
      const bPreferred = preferredKeys.has(bKey) ? 0 : 1;
      const aStarts = needle && aKey.startsWith(needle) ? 0 : 1;
      const bStarts = needle && bKey.startsWith(needle) ? 0 : 1;
      return aPreferred - bPreferred || aStarts - bStarts || a.localeCompare(b, "ja", { numeric: true });
    })
    .slice(0, 80);
}

function renderFinishMenu(picker) {
  if (!picker?.menu) return;
  picker.menu.innerHTML = "";
  const current = normalizeMaterialText(picker.input.value);
  if (picker.allowNone) {
    const noneAction = document.createElement("button");
    noneAction.type = "button";
    noneAction.className = "material-menu-action";
    noneAction.setAttribute("role", "option");
    noneAction.innerHTML = `
      <span class="material-menu-title">未選択（なし）</span>
      <span class="material-menu-meta">空欄にして「なし」として扱います</span>
    `;
    noneAction.addEventListener("click", (event) => {
      event.preventDefault();
      picker.input.value = "";
      saveQuietly();
      closeFinishMenu(picker);
    });
    picker.menu.appendChild(noneAction);
  }
  const currentExists = materialSuggestions.some((material) => materialSuggestionKey(material) === materialSuggestionKey(current));
  const currentTrimValue = picker.allowNone ? trimSettingValue(current) : current;
  if (current && !["no", "yes"].includes(currentTrimValue) && !currentExists) {
    const action = document.createElement("button");
    action.type = "button";
    action.className = "material-menu-action";
    action.setAttribute("role", "option");
    action.innerHTML = `
      <span class="material-menu-title">現在の入力を候補に追加</span>
      <span class="material-menu-meta">${escapeHtml(current)}</span>
    `;
    action.addEventListener("click", (event) => {
      event.preventDefault();
      addMaterialSuggestion(current, { persist: true });
      closeFinishMenu(picker);
    });
    picker.menu.appendChild(action);
  }

  const items = filteredFinishSuggestions(picker);
  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "material-menu-empty";
    empty.textContent = "PDF読取候補がありません。入力して候補に追加できます。";
    picker.menu.appendChild(empty);
    return;
  }

  items.forEach((material) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("role", "option");
    button.innerHTML = `
      <span class="material-menu-title">${escapeHtml(material)}</span>
      <span class="material-menu-meta">${escapeHtml(picker.sourceMeta || "PDF読取候補・入力履歴")}</span>
    `;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      picker.input.value = material;
      if (!["no", "yes"].includes(trimSettingValue(material))) addMaterialSuggestion(material, { persist: false });
      saveQuietly();
      closeFinishMenu(picker);
    });
    picker.menu.appendChild(button);
  });
}

function renderOpenFinishMenus() {
  finishPickerConfigs().forEach((picker) => {
    if (!picker.menu.hidden) renderFinishMenu(picker);
  });
  els.externalFinishCategories?.querySelectorAll("[data-external-finish-row]").forEach((row) => {
    if (!externalFinishMenu(row)?.hidden) renderExternalFinishMenu(row);
  });
}

function closeFinishMenu(picker) {
  if (!picker?.menu) return;
  picker.menu.hidden = true;
  picker.input?.setAttribute("aria-expanded", "false");
}

function closeFinishMenus(options = {}) {
  finishPickerConfigs().forEach((picker) => {
    if (picker.input !== options.except?.input) closeFinishMenu(picker);
  });
}

function openFinishMenu(picker) {
  if (!picker) return;
  closeMaterialMenu();
  closeFinishMenus({ except: picker });
  closeExternalFinishMenus();
  addDirectFinishCandidates({ persist: false });
  refreshMaterialSuggestions();
  renderFinishMenu(picker);
  picker.menu.hidden = false;
  picker.input?.setAttribute("aria-expanded", "true");
}

function resizeMaterialInput() {
  if (!els.materialInput) return;
  els.materialInput.style.height = "auto";
  const nextHeight = Math.min(Math.max(els.materialInput.scrollHeight, 72), 180);
  els.materialInput.style.height = `${nextHeight}px`;
}

let materialVoiceRecognition = null;
let materialVoiceListening = false;

function setMaterialVoiceListening(active) {
  materialVoiceListening = active;
  if (!els.materialVoiceButton) return;
  els.materialVoiceButton.classList.toggle("listening", active);
  els.materialVoiceButton.textContent = active ? "聞取" : "音声";
}

function materialSpeechRecognitionCtor() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

function searchMaterialByVoiceText(text) {
  const transcript = normalizeMaterialText(text);
  if (!transcript) {
    setHint("音声を聞き取れませんでした。もう一度「音声」を押してください。");
    return;
  }
  els.materialInput.value = transcript;
  resizeMaterialInput();
  refreshMaterialSuggestions();
  openMaterialMenu();
  setHint(`音声検索: 「${transcript}」で部材・仕様候補を絞り込みました。`);
}

function startMaterialVoiceSearch() {
  const Recognition = materialSpeechRecognitionCtor();
  if (!Recognition) {
    setHint("このブラウザでは音声入力に対応していません。ChromeまたはEdgeで開くと使える場合があります。");
    return;
  }
  if (materialVoiceListening && materialVoiceRecognition) {
    materialVoiceRecognition.stop();
    return;
  }
  try {
    const recognition = new Recognition();
    materialVoiceRecognition = recognition;
    recognition.lang = "ja-JP";
    recognition.interimResults = false;
    recognition.continuous = false;
    recognition.maxAlternatives = 1;
    recognition.addEventListener("start", () => {
      setMaterialVoiceListening(true);
      setHint("部材・仕様を話してください。聞き取った文字で候補を検索します。");
    });
    recognition.addEventListener("result", (event) => {
      const transcript = Array.from(event.results || [])
        .map((result) => result[0]?.transcript || "")
        .join(" ");
      searchMaterialByVoiceText(transcript);
    });
    recognition.addEventListener("error", () => {
      setHint("音声入力を開始できませんでした。マイクの許可を確認してください。");
    });
    recognition.addEventListener("end", () => {
      setMaterialVoiceListening(false);
    });
    recognition.start();
  } catch {
    setMaterialVoiceListening(false);
    setHint("音声入力を開始できませんでした。マイクの許可を確認してください。");
  }
}

function toggleMaterialMenu() {
  if (els.materialMenu.hidden) openMaterialMenu();
  else closeMaterialMenu();
}

async function collectMaterialSuggestionsFromPdf(pdf, sourceName = "") {
  if (!pdf) return;
  const materialCandidates = [];
  const roomCandidates = [];
  const source = normalizeRoomText(sourceName || "読込PDF");
  const floor = inferFloorLabelFromText(source);
  const maxPages = Math.min(pdf.numPages || 0, 6);
  for (let pageNumber = 1; pageNumber <= maxPages; pageNumber += 1) {
    try {
      const page = await pdf.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const text = textContent.items.map((item) => item.str || "").join(" ");
      materialCandidates.push(...extractMaterialCandidatesFromText(text));
      roomCandidates.push(...extractRoomSuggestionsFromText(text, { floor, source }));
    } catch {
      // Some PDFs do not expose text. Visual takeoff can still continue.
    }
  }
  if (sourceName) {
    materialCandidates.push(...extractMaterialCandidatesFromText(sourceName));
    roomCandidates.push(...extractRoomSuggestionsFromText(sourceName, { floor, source }));
  }
  addMaterialSuggestions(materialCandidates, { persist: true });
  addRoomSuggestions(roomCandidates, { persist: true });
}

function openingTradeName(value) {
  const text = String(value || "").trim();
  return openingTrades.find((trade) => trade.name === text)?.name || openingTradeAliases[text] || "";
}

function updateOpeningTradeButtons() {
  const selected = openingTradeName(els.openingTradeInput.value);
  document.querySelectorAll(".opening-trade-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.openingTrade === selected);
  });
}

function selectOpeningTrade(value) {
  const trade = openingTradeName(value);
  if (!trade) return;
  els.openingTradeInput.value = trade;
  els.formulaInput.value = "count";
  setTool("count");
  prepareOpeningInputs();
}

function classifyOpeningTrade(record, drawingName = "") {
  const selected = openingTradeName(record.estimateTrade);
  if (selected) return selected;
  const text = normalizeSearchText([
    record.part,
    record.material,
    record.memo,
    record.room,
    drawingName
  ].filter(Boolean).join(" "));
  const match = openingTrades.find((trade) => (
    trade.keys.some((key) => text.includes(normalizeSearchText(key)))
  ));
  return match?.name || "";
}

function collectProjectRecordEntries() {
  if (drawingEntries.length === 0) {
    return records.map((record) => ({ record, drawingName: drawingFileName, drawingNumber: "" }));
  }
  return drawingEntries.flatMap((entry) => {
    const sourceRecords = entry.id === activeDrawingId ? records : (entry.records || []);
    return sourceRecords.map((record) => ({
      record,
      drawingName: entry.name || drawingFileName,
      drawingNumber: detectDrawingNumber(entry)
    }));
  });
}

function cleanEstimateText(value, fallback = "") {
  const text = String(value ?? "").replace(/[\t\r\n]+/g, " ").trim();
  return text || fallback;
}

function estimateUnit(unit) {
  const text = String(unit || "").trim();
  if (text === "箇所") return "ヶ所";
  if (text === "m2") return "㎡";
  if (text === "m3") return "㎥";
  return text || "式";
}

function openingEstimateName(record) {
  const part = cleanEstimateText(record.part);
  if (part && part !== "床" && part !== "面積" && part !== "長さ" && part !== "個数") return part;
  return cleanEstimateText(record.material, "建具");
}

function openingEstimateSummary(record) {
  return [
    record.material,
    [record.floor, record.room].filter(Boolean).join(" "),
    record.expression
  ].map((value) => cleanEstimateText(value)).filter(Boolean).join(" / ");
}

function openingEstimateRemarks(record, drawingName, drawingNumber) {
  return [
    drawingNumber || drawingName,
    record.memo,
    record.shape === "count" ? "" : record.formula
  ].map((value) => cleanEstimateText(value)).filter(Boolean).join(" / ");
}

function buildOpeningEstimateItems() {
  return collectProjectRecordEntries()
    .map(({ record, drawingName, drawingNumber }) => {
      if (record.recordType === "deduction") return null;
      const trade = classifyOpeningTrade(record, drawingName);
      if (!trade) return null;
      const qty = Number(record.quantity || 0) || 1;
      const price = Number(record.price || 0) || 0;
      return {
        trade,
        name: openingEstimateName(record),
        summary: openingEstimateSummary(record),
        qty,
        unit: estimateUnit(record.unit),
        price,
        amount: qty * price,
        remarks: openingEstimateRemarks(record, drawingName, drawingNumber),
        drawingName,
        drawingNumber
      };
    })
    .filter(Boolean)
    .sort((a, b) => (
      openingTrades.findIndex((trade) => trade.name === a.trade) - openingTrades.findIndex((trade) => trade.name === b.trade) ||
      String(a.drawingNumber || a.drawingName).localeCompare(String(b.drawingNumber || b.drawingName), "ja", { numeric: true }) ||
      String(a.name).localeCompare(String(b.name), "ja", { numeric: true })
    ));
}

function openingDrawingSearchText(entry) {
  return normalizeSearchText([
    entry.name,
    entry.title,
    entry.category,
    entry.takeoffRole,
    entry.sourcePath,
    detectDrawingNumber(entry)
  ].filter(Boolean).join(" "));
}

function openingDrawingScore(entry) {
  const text = openingDrawingSearchText(entry);
  const drawingNumber = normalizeDrawingText(detectDrawingNumber(entry));
  let score = 0;
  if (/建具\s*表|建具表|DOOR\s*SCHEDULE|WINDOW\s*SCHEDULE/.test(text)) score += 120;
  if (/KEY[-_ ]?PLAN|KEYPLAN|キープラン/.test(text)) score += 85;
  if (/建具|DOOR|WINDOW|サッシ|鋼製|金属製|木製|ガラス|硝子|GLASS|SD|SSD|AD|AW|WD/.test(text)) score += 55;
  if (/^A-3\d{2}/.test(drawingNumber)) score += 35;
  if (/特記仕様|仕上表|面積表|表紙|配置|案内|平面詳細|展開図|立面図|断面図/.test(text)) score -= 80;
  return score;
}

function openingDrawingTrade(entry) {
  const text = openingDrawingSearchText(entry);
  if (/木製|木建具|WD/.test(text)) return "木建具";
  if (/ガラス|硝子|GLASS/.test(text)) return "ガラス工事";
  if (/鋼製|金属製|アルミ|サッシ|SUS|SD|SSD|AD|AW/.test(text)) return "金属製建具";
  return "";
}

function openingDrawingCandidates() {
  return drawingEntries
    .map((entry) => ({ entry, score: openingDrawingScore(entry) }))
    .filter((candidate) => candidate.score > 30)
    .sort((a, b) => (
      b.score - a.score ||
      compareDrawingEntries(a.entry, b.entry)
    ));
}

function openingDrawingLabel(entry) {
  const drawingNumber = detectDrawingNumber(entry);
  return [drawingNumber, entry.title || entry.name].filter(Boolean).join(" ");
}

function renderOpeningDrawingStatus(candidates = openingDrawingCandidates()) {
  if (!els.openingDrawingStatus) return;
  if (candidates.length === 0) {
    els.openingDrawingStatus.textContent = drawingEntries.length ? "建具図面候補は未検出です。" : "";
    return;
  }
  const names = candidates.slice(0, 4).map(({ entry }) => openingDrawingLabel(entry)).join(" / ");
  els.openingDrawingStatus.textContent = `建具図面候補 ${candidates.length}件: ${names}`;
}

function prepareOpeningDrawingInputs(entry) {
  const trade = openingDrawingTrade(entry);
  if (trade) els.openingTradeInput.value = trade;
  els.formulaInput.value = "count";
  setTool("count");
  prepareOpeningInputs();
}

async function findAndLoadOpeningDrawing() {
  const candidates = openingDrawingCandidates();
  renderOpeningDrawingStatus(candidates);
  if (candidates.length === 0) {
    setHint("図面一覧から建具表・建具KEY-PLANを見つけられませんでした。図面名に建具表などが入っているか確認してください。");
    return;
  }
  const target = candidates[0].entry;
  prepareOpeningDrawingInputs(target);
  await loadDrawingEntry(target);
  setHint(`建具図面候補 ${candidates.length}件を見つけました。まず「${target.name}」を開き、個数拾いに切り替えました。`);
}

function renderOpeningSummary() {
  if (!els.openingSummary) return;
  const items = buildOpeningEstimateItems();
  els.openingSummary.innerHTML = "";
  renderOpeningDrawingStatus();
  if (items.length === 0) {
    els.openingSummary.textContent = "木建具または金属製建具を選ぶと、建具拾いに表示されます。";
    if (els.exportOpeningListButton) els.exportOpeningListButton.disabled = true;
    if (els.exportOpeningCheckCsvButton) els.exportOpeningCheckCsvButton.disabled = true;
    return;
  }

  openingTrades.forEach((trade) => {
    const group = items.filter((item) => item.trade === trade.name);
    if (group.length === 0) return;
    const amount = group.reduce((sum, item) => sum + item.amount, 0);
    const div = document.createElement("div");
    div.innerHTML = `<strong>${escapeHtml(trade.name)}</strong><span>${group.length}件 / ${money(amount)}</span>`;
    els.openingSummary.appendChild(div);
  });
  if (els.exportOpeningListButton) els.exportOpeningListButton.disabled = false;
  if (els.exportOpeningCheckCsvButton) els.exportOpeningCheckCsvButton.disabled = false;
}

function newProjectId() {
  return `p-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function cleanProjectName(value, fallback = "現場1") {
  return String(value || "").trim() || fallback;
}

function currentProject() {
  return projectBook.projects.find((project) => project.id === projectBook.activeId) || null;
}

function projectNameFromSourcePath(value) {
  const parts = String(value || "").split(/[\\/]+/).filter(Boolean);
  return parts.length >= 2 ? parts[parts.length - 2] : "";
}

function deriveProjectNameFromState(state, fallback = "現場1") {
  if (state?.projectName) return cleanProjectName(state.projectName, fallback);
  const firstDrawing = Array.isArray(state?.drawings) ? state.drawings[0] : null;
  return cleanProjectName(
    projectNameFromSourcePath(firstDrawing?.sourcePath) ||
    firstDrawing?.projectName ||
    state?.drawingFileName,
    fallback
  );
}

function serializeDrawingEntry(entry, options = {}) {
  return {
    id: entry.id,
    key: entry.key,
    name: entry.name,
    title: entry.title || "",
    category: entry.category || "",
    takeoffRole: entry.takeoffRole || "",
    takeoffPriority: entry.takeoffPriority || 0,
    textSample: entry.textSample || "",
    url: entry.url || "",
    sourcePath: entry.sourcePath || "",
    order: entry.order,
    drawingNumber: entry.drawingNumber || detectDrawingNumber(entry),
    currentPage: entry.currentPage,
    scale: entry.scale ? { ...entry.scale } : null,
    records: cloneRecords(entry.records || []),
    file: options.includeFiles ? (entry.file || null) : null
  };
}

function captureAppState(options = {}) {
  saveActiveEntryState();
  saveActiveFinishTable();
  const project = currentProject();
  const projectName = cleanProjectName(els.projectNameInput?.value || project?.name || "現場1");
  return {
    projectName,
    drawingFileName,
    drawingKind,
    currentPage,
    pageCount,
    scale: scale ? { ...scale } : null,
    currentRoom: finishTableLocation(),
    finishSchedule: currentFinishSchedule(),
    finishTables: normalizeFinishTables(finishTables),
    activeFinishTab,
    substrateSettings: currentSubstrateSettings(),
    records: cloneRecords(records),
    roomSettings: normalizeRoomSettings(roomSettings),
    roomSuggestions: normalizeRoomSuggestions(roomSuggestions),
    materialSuggestions: normalizeMaterialSuggestions(materialSuggestions),
    activeDrawingId,
    drawings: drawingEntries.map((entry) => serializeDrawingEntry(entry, options))
  };
}

function serializableAppState(state = {}) {
  const currentRoom = state.currentRoom
    ? finishTableLocation(state.currentRoom.floor, state.currentRoom.room)
    : null;
  return {
    projectName: state.projectName || "",
    drawingFileName: state.drawingFileName || "",
    drawingKind: state.drawingKind || "",
    currentPage: state.currentPage || 1,
    pageCount: state.pageCount || 1,
    scale: state.scale ? { ...state.scale } : null,
    currentRoom,
    finishSchedule: normalizeFinishSchedule(state.finishSchedule || {}),
    finishTables: normalizeFinishTables(state.finishTables, state.finishSchedule, currentRoom),
    activeFinishTab: state.activeFinishTab === "external" ? "external" : "internal",
    substrateSettings: {
      wallType: String(state.substrateSettings?.wallType || "").trim(),
      wallSubstrate: String(state.substrateSettings?.wallSubstrate || "").trim(),
      ceilingSubstrate: String(state.substrateSettings?.ceilingSubstrate || "").trim()
    },
    records: cloneRecords(state.records || []),
    roomSettings: normalizeRoomSettings(state.roomSettings || state.rooms || []),
    roomSuggestions: normalizeRoomSuggestions(state.roomSuggestions || []),
    materialSuggestions: normalizeMaterialSuggestions(state.materialSuggestions || []),
    activeDrawingId: state.activeDrawingId || "",
    drawings: (Array.isArray(state.drawings) ? state.drawings : []).map((entry) => serializeDrawingEntry(entry))
  };
}

function createProject(name, state = {}) {
  const now = new Date().toISOString();
  const projectName = cleanProjectName(name, `現場${projectBook.projects.length + 1}`);
  return {
    id: newProjectId(),
    name: projectName,
    createdAt: now,
    updatedAt: now,
    state: { ...serializableAppState(state), projectName }
  };
}

function serializeProjectBook() {
  return {
    activeId: projectBook.activeId,
    projects: projectBook.projects.map((project) => ({
      id: project.id,
      name: cleanProjectName(project.name),
      createdAt: project.createdAt || project.updatedAt || new Date().toISOString(),
      updatedAt: project.updatedAt || new Date().toISOString(),
      state: serializableAppState({ ...(project.state || {}), projectName: project.name })
    }))
  };
}

function saveProjectBookQuietly() {
  localStorage.setItem(projectBookStorageKey, JSON.stringify(serializeProjectBook()));
}

function loadProjectBookFromStorage() {
  const raw = localStorage.getItem(projectBookStorageKey);
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    const projects = (Array.isArray(data.projects) ? data.projects : [])
      .map((project, index) => ({
        id: project.id || newProjectId(),
        name: cleanProjectName(project.name || project.state?.projectName, `現場${index + 1}`),
        createdAt: project.createdAt || new Date().toISOString(),
        updatedAt: project.updatedAt || project.createdAt || new Date().toISOString(),
        state: serializableAppState(project.state || {})
      }));
    if (projects.length === 0) return null;
    const activeId = projects.some((project) => project.id === data.activeId)
      ? data.activeId
      : projects[0].id;
    return { activeId, projects };
  } catch {
    localStorage.removeItem(projectBookStorageKey);
    return null;
  }
}

function stateHasWork(state = {}) {
  return Boolean(
    (Array.isArray(state.drawings) && state.drawings.length) ||
    (Array.isArray(state.records) && state.records.length) ||
    (Array.isArray(state.roomSettings) && state.roomSettings.length) ||
    (Array.isArray(state.finishTables) && state.finishTables.length)
  );
}

function projectRecordCount(state = {}) {
  const drawingRecords = (Array.isArray(state.drawings) ? state.drawings : [])
    .reduce((sum, entry) => sum + (Array.isArray(entry.records) ? entry.records.length : 0), 0);
  return drawingRecords || (Array.isArray(state.records) ? state.records.length : 0);
}

function renderProjectControls() {
  if (!els.projectSelect) return;
  const project = currentProject();
  els.projectSelect.innerHTML = projectBook.projects
    .map((item) => `<option value="${escapeHtml(item.id)}">${escapeHtml(item.name)}</option>`)
    .join("");
  els.projectSelect.value = project?.id || "";
  if (document.activeElement !== els.projectNameInput) {
    els.projectNameInput.value = project?.name || "現場1";
  }
  const state = project?.state || {};
  const drawingCount = Array.isArray(state.drawings) ? state.drawings.length : drawingEntries.length;
  const recordCount = projectRecordCount(state);
  els.projectStatus.textContent = `${project?.name || "現場1"} / 図面 ${drawingCount}件 / 拾い ${recordCount}件`;
  els.deleteProjectButton.disabled = projectBook.projects.length <= 1;
}

function renameCurrentProject(name, options = {}) {
  const project = currentProject();
  if (!project) return;
  project.name = cleanProjectName(name, project.name || "現場1");
  project.updatedAt = new Date().toISOString();
  project.state = { ...(project.state || {}), projectName: project.name };
  renderProjectControls();
  if (options.persist !== false) saveProjectBookQuietly();
}

function saveCurrentProjectState(state = null) {
  if (isApplyingProject) return;
  if (!currentProject()) {
    const project = createProject("現場1");
    projectBook.projects.push(project);
    projectBook.activeId = project.id;
  }
  const project = currentProject();
  project.name = cleanProjectName(els.projectNameInput?.value || project.name);
  const nextState = state || captureAppState({ includeFiles: true });
  if (state) {
    nextState.drawings = (Array.isArray(nextState.drawings) ? nextState.drawings : []).map((entry) => {
      const liveEntry = drawingEntries.find((candidate) => candidate.id === entry.id);
      const savedEntry = project.state?.drawings?.find((candidate) => candidate.id === entry.id);
      const file = liveEntry?.file || savedEntry?.file;
      return file ? { ...entry, file } : entry;
    });
  }
  project.state = nextState;
  project.state.projectName = project.name;
  project.updatedAt = new Date().toISOString();
  saveProjectBookQuietly();
  renderProjectControls();
}

function applyAppState(data = {}) {
  pdfDoc = null;
  imageBitmapSource = null;
  drawingKind = data.drawingKind || "";
  drawingFileName = data.drawingFileName || "";
  currentPage = data.currentPage || 1;
  pageCount = data.pageCount || 1;
  scale = data.scale || null;
  const savedRoom = data.currentRoom
    ? finishTableLocation(data.currentRoom.floor, data.currentRoom.room)
    : finishTableLocation();
  if (savedRoom) {
    els.floorInput.value = savedRoom.floor;
    els.roomInput.value = savedRoom.room;
  }
  applySubstrateSettings(data.substrateSettings || {});
  roomSettings = normalizeRoomSettings(data.roomSettings || data.rooms || []);
  roomSuggestions = normalizeRoomSuggestions(data.roomSuggestions || []);
  materialSuggestions = normalizeMaterialSuggestions(data.materialSuggestions || []);
  finishTables = normalizeFinishTables(data.finishTables, data.finishSchedule, savedRoom);
  activeFinishTableLocation = null;
  activeFinishTab = data.activeFinishTab === "external" ? "external" : "internal";
  const roomSetting = findRoomSetting();
  if (roomSetting) {
    applyRoomSetting(roomSetting, { saveFinish: false, silent: true, keepOpen: true });
  } else {
    loadFinishTableForCurrentRoom();
  }
  selectedId = "";
  overwriteSelectedRecord = false;
  tempPoints = [];
  scaleCheckResult = null;
  mode = "draw";
  const restoredEntries = Array.isArray(data.drawings) ? data.drawings.map((entry, index) => ({
    ...entry,
    id: entry.id || `d-${Date.now()}-${index}`,
    key: entry.key || `saved:${entry.url || entry.sourcePath || entry.name || index}`,
    file: entry.file || null,
    records: cloneRecords(entry.records || []),
    drawingNumber: entry.drawingNumber || "",
    title: entry.title || "",
    category: entry.category || "",
    takeoffRole: entry.takeoffRole || "",
    takeoffPriority: entry.takeoffPriority || 0,
    textSample: entry.textSample || "",
    url: entry.url || "",
    sourcePath: entry.sourcePath || "",
    order: entry.order
  })).filter(isSupportedSavedEntry) : [];
  drawingEntries = restoredEntries.filter(isUsefulSavedEntry);
  activeDrawingId = data.activeDrawingId || "";
  if (!drawingEntries.some((entry) => entry.id === activeDrawingId)) {
    activeDrawingId = drawingEntries[0]?.id || "";
  }
  const activeEntry = drawingEntries.find((entry) => entry.id === activeDrawingId);
  if (activeEntry) {
    records = cloneRecords(activeEntry.records || []);
    scale = activeEntry.scale ? { ...activeEntry.scale } : null;
    syncScaleInputsFromScale(scale);
    currentPage = activeEntry.currentPage || currentPage;
    drawingFileName = activeEntry.name || drawingFileName;
  } else {
    records = cloneRecords(data.records || []);
  }
  els.drawingName.textContent = drawingFileName
    ? activeEntry?.file ? drawingFileName : `${drawingFileName}（図面は再選択してください）`
    : "図面未読込";
  els.pdfControls.hidden = true;
  updateScaleStatus();
  updateRoomStatus();
  renderRegisteredRoomSelect();
  refreshRoomSuggestions();
  refreshMaterialSuggestions();
  renderRecords();
  renderDrawingList();
}

async function loadActiveProjectDrawing() {
  const entry = drawingEntries.find((candidate) => candidate.id === activeDrawingId);
  if (entry?.file || entry?.url) {
    await loadDrawingEntry(entry);
    return;
  }
  await renderDrawing();
}

async function switchProject(projectId) {
  if (!projectId || projectId === projectBook.activeId) return;
  saveCurrentProjectState();
  projectBook.activeId = projectId;
  const project = currentProject();
  if (!project) return;
  isApplyingProject = true;
  applyAppState(project.state || {});
  isApplyingProject = false;
  renderProjectControls();
  await loadActiveProjectDrawing();
  saveProjectBookQuietly();
  setHint(`「${project.name}」を開きました。`);
}

async function createNewProject() {
  saveCurrentProjectState();
  const project = createProject(`現場${projectBook.projects.length + 1}`);
  projectBook.projects.push(project);
  projectBook.activeId = project.id;
  isApplyingProject = true;
  applyAppState(project.state);
  isApplyingProject = false;
  renderProjectControls();
  await renderDrawing();
  saveProjectBookQuietly();
  setHint("新しい現場を作成しました。現場名を入力して図面を読み込めます。");
}

async function duplicateCurrentProject() {
  saveCurrentProjectState();
  const source = currentProject();
  if (!source) return;
  const project = createProject(`${source.name} コピー`, source.state);
  project.state = captureAppState({ includeFiles: true });
  project.state.projectName = project.name;
  projectBook.projects.push(project);
  projectBook.activeId = project.id;
  isApplyingProject = true;
  applyAppState(project.state);
  isApplyingProject = false;
  renderProjectControls();
  await loadActiveProjectDrawing();
  saveProjectBookQuietly();
  setHint(`「${source.name}」を複製しました。`);
}

async function deleteCurrentProject() {
  const project = currentProject();
  if (!project) return;
  if (!confirm(`「${project.name}」を削除しますか？この現場の図面一覧と拾い明細が一覧から外れます。`)) return;
  const index = projectBook.projects.findIndex((item) => item.id === project.id);
  projectBook.projects.splice(index, 1);
  if (projectBook.projects.length === 0) {
    projectBook.projects.push(createProject("現場1"));
  }
  projectBook.activeId = projectBook.projects[Math.max(0, Math.min(index, projectBook.projects.length - 1))].id;
  const nextProject = currentProject();
  isApplyingProject = true;
  applyAppState(nextProject.state || {});
  isApplyingProject = false;
  renderProjectControls();
  await loadActiveProjectDrawing();
  saveProjectBookQuietly();
  setHint(`「${project.name}」を削除しました。`);
}

function updateDrawingActionState() {
  els.removeDrawingButton.disabled = !activeDrawingId || !drawingEntries.some((entry) => entry.id === activeDrawingId);
}

function resetDrawingSurface(message = "図面を読み込んでから、縮尺を設定してください。") {
  pdfDoc = null;
  imageBitmapSource = null;
  drawingKind = "";
  drawingFileName = "";
  currentPage = 1;
  pageCount = 1;
  records = [];
  selectedId = "";
  tempPoints = [];
  scaleCheckResult = null;
  scale = null;
  activeDrawingId = "";
  els.drawingName.textContent = "図面未読込";
  updateScaleStatus();
  els.pdfControls.hidden = true;
  setHint(message);
  renderRecords();
  renderDrawingList();
  renderDrawing();
}

async function removeActiveDrawing() {
  if (!activeDrawingId) return;
  sortDrawingEntries();
  const index = drawingEntries.findIndex((entry) => entry.id === activeDrawingId);
  if (index < 0) return;
  const entry = drawingEntries[index];
  const count = records.length;
  const message = count > 0
    ? `「${entry.name}」と、この図面の拾い明細 ${count} 件を取り消しますか？`
    : `「${entry.name}」を取り消しますか？`;
  if (!confirm(message)) return;

  drawingEntries.splice(index, 1);
  const nextEntry = drawingEntries[index] || drawingEntries[index - 1] || null;
  if (nextEntry) {
    activeDrawingId = "";
    await loadDrawingEntry(nextEntry);
    setHint(`「${entry.name}」を取り消しました。`);
  } else {
    resetDrawingSurface(`「${entry.name}」を取り消しました。`);
  }
  saveQuietly();
}

function setTool(nextTool) {
  tool = nextTool;
  activeHardwareLengthItemId = "";
  document.querySelectorAll(".tool-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tool === tool);
  });
  tempPoints = [];
  mode = "draw";
  updateDeductionTraceButtons();
  drawOverlay();
  setHint(tool === "poly" ? "角を順にクリックしてから、拾い明細に反映します。" : "図面上をなぞってから、拾い明細に反映します。");
}

function formulaLabel(value) {
  return {
    floor: "面積",
    perimeter: "長さ",
    wall: "壁面積",
    count: "個数"
  }[value] || "数量";
}

function unitForFormula(value) {
  return {
    floor: "m2",
    perimeter: "m",
    wall: "m2",
    count: "箇所"
  }[value] || "";
}

function wallTypeLabel(value) {
  const labels = {
    partition: "間仕切り壁",
    "concrete-gl": "コンクリートGL",
    "concrete-direct": "コンクリート直"
  };
  const type = String(value || "").trim();
  if (!type) return "部材なし";
  return labels[type] || type;
}

function defaultWallSubstrate(value) {
  return value === "concrete-gl"
    ? "GL工法"
    : value === "concrete-direct"
      ? "躯体コンクリート"
      : "LGS下地＋石膏ボード";
}

function ensureSelectOption(select, value) {
  const text = String(value || "").trim();
  if (!select || !text) return;
  if (Array.from(select.options).some((option) => option.value === text)) return;
  const option = document.createElement("option");
  option.value = text;
  option.textContent = text;
  select.appendChild(option);
}

function setSelectValue(select, value) {
  const text = String(value || "").trim();
  if (!select) return;
  ensureSelectOption(select, text);
  select.value = text;
}

function normalizeWallSubstrateValue(value, options = {}) {
  const text = String(value || "").trim();
  const aliases = {
    "LGS下地＋石膏ボード": "軽鉄下地",
    "木下地＋石膏ボード": "木下地"
  };
  const normalized = aliases[text] || text;
  if (options.partition && normalized === "GL工法") return "";
  return normalized;
}

function currentSubstrateSettings() {
  return {
    wallType: (els.wallTypeInput?.value || "").trim(),
    wallSubstrate: (els.wallSubstrateInput?.value || "").trim(),
    ceilingSubstrate: (els.ceilingSubstrateInput?.value || "").trim()
  };
}

function applySubstrateSettings(settings = {}) {
  const wallType = String(settings.wallType || "").trim();
  setSelectValue(els.wallTypeInput, wallType);
  if (els.wallTypeInput) els.wallTypeInput.dataset.previousValue = wallType;
  setSelectValue(els.wallSubstrateInput, normalizeWallSubstrateValue(settings.wallSubstrate));
  setSelectValue(els.ceilingSubstrateInput, String(settings.ceilingSubstrate || "").trim());
}

function syncWallSubstrateDefault() {
  if (!els.wallTypeInput || !els.wallSubstrateInput) return;
  const previousType = els.wallTypeInput.dataset.previousValue || "";
  const previousDefault = previousType ? defaultWallSubstrate(previousType) : "";
  const currentValue = els.wallSubstrateInput.value.trim();
  const nextType = els.wallTypeInput.value;
  const nextDefault = nextType ? defaultWallSubstrate(nextType) : "";
  if (!currentValue || (previousDefault && currentValue === previousDefault)) {
    setSelectValue(els.wallSubstrateInput, nextDefault);
  }
  els.wallTypeInput.dataset.previousValue = nextType;
}

function finishSummaryInputs() {
  return {
    floor: els.floorFinishSummaryInput,
    baseboard: els.baseboardSummaryInput,
    wall: els.wallFinishSummaryInput,
    ceiling: els.ceilingFinishSummaryInput,
    ceilingTrim: els.ceilingTrimSummaryInput
  };
}

function currentFinishItemSummaries() {
  return Object.fromEntries(Object.entries(finishSummaryInputs()).map(([key, input]) => [
    key,
    (input?.value || "").trim()
  ]));
}

function normalizeFinishItemSummaries(values = {}) {
  return Object.fromEntries(Object.keys(finishSummaryInputs()).map((key) => [
    key,
    String(values?.[key] || "").trim()
  ]));
}

function applyFinishItemSummaries(values = {}) {
  const normalized = normalizeFinishItemSummaries(values);
  Object.entries(finishSummaryInputs()).forEach(([key, input]) => {
    if (input) input.value = normalized[key] || "";
  });
}

function normalizeFinishFormula(value, fallback = "floor") {
  return finishFormulaValues.includes(value) ? value : fallback;
}

function internalFinishFormulaInput(key) {
  return document.querySelector(`[data-internal-finish-formula="${key}"]`);
}

function internalFinishInput(key) {
  return document.querySelector(`[data-internal-finish-key="${key}"]`);
}

function internalFinishValue(key) {
  const value = String(internalFinishInput(key)?.value || "").trim();
  return ["baseboard", "ceilingTrim"].includes(key) ? trimSettingValue(value) : value;
}

function currentInternalFinishMaterials() {
  return Object.fromEntries(internalFinishItems.map(({ key }) => [key, internalFinishValue(key)]));
}

function normalizeInternalFinishMaterials(values = {}, schedule = {}) {
  const legacy = {
    floor: schedule.floor,
    baseboard: schedule.baseboard,
    wall: schedule.wall,
    wallSubstrate: schedule.wallSubstrate ?? els.wallSubstrateInput?.value,
    ceiling: schedule.ceiling,
    ceilingTrim: schedule.ceilingTrim,
    ceilingSubstrate: schedule.ceilingSubstrate ?? els.ceilingSubstrateInput?.value
  };
  return Object.fromEntries(internalFinishItems.map(({ key }) => {
    const raw = values?.[key] ?? legacy[key] ?? "";
    if (["baseboard", "ceilingTrim"].includes(key)) return [key, trimSettingValue(raw)];
    if (["wallSubstrate", "exteriorWainscotUpperSubstrate", "exteriorWainscotLowerSubstrate"].includes(key)) {
      return [key, normalizeWallSubstrateValue(raw)];
    }
    if (["partitionWallSubstrate", "partitionWainscotUpperSubstrate", "partitionWainscotLowerSubstrate"].includes(key)) {
      return [key, normalizeWallSubstrateValue(raw, { partition: true })];
    }
    return [key, String(raw || "").trim()];
  }));
}

function applyInternalFinishMaterials(materials = {}) {
  internalFinishItems.forEach(({ key }) => {
    const input = internalFinishInput(key);
    if (!input) return;
    const value = materials[key] || "";
    if (input.tagName === "SELECT") setSelectValue(input, value);
    else input.value = ["baseboard", "ceilingTrim"].includes(key) ? displayTrimInputValue(value) : value;
  });
}

function currentInternalFinishFormulas() {
  return Object.fromEntries(internalFinishItems.map(({ key }) => [
    key,
    normalizeFinishFormula(internalFinishFormulaInput(key)?.value, internalFinishFormulaDefaults[key])
  ]));
}

function normalizeInternalFinishFormulas(values = {}) {
  return Object.fromEntries(internalFinishItems.map(({ key }) => [
    key,
    normalizeFinishFormula(values?.[key], internalFinishFormulaDefaults[key])
  ]));
}

function applyInternalFinishFormulas(values = {}) {
  const normalized = normalizeInternalFinishFormulas(values);
  Object.entries(normalized).forEach(([key, formula]) => {
    const input = internalFinishFormulaInput(key);
    if (input) input.value = formula;
  });
  sharedFinishFormulaGroups.forEach(([key]) => syncSharedFinishFormula(key));
}

function formulaForInternalFinish(key) {
  return normalizeFinishFormula(
    internalFinishFormulaInput(key)?.value,
    internalFinishFormulaDefaults[key] || "floor"
  );
}

function syncSharedFinishFormula(key) {
  const group = sharedFinishFormulaGroups.find((keys) => keys.includes(key));
  if (!group) return;
  const formula = formulaForInternalFinish(key);
  group.forEach((itemKey) => {
    const input = internalFinishFormulaInput(itemKey);
    if (input) input.value = formula;
  });
}

function newHardwareFinishItemId() {
  return `hardware-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function signedNumber(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : 0;
}

function hardwareCountText(value) {
  const count = signedNumber(value);
  const text = Number.isInteger(count) ? String(count) : numberText(count, 2);
  return `${count > 0 ? "+" : ""}${text}個`;
}

function hardwareLengthText(value) {
  return `${numberText(Math.max(0, signedNumber(value)))}m`;
}

function normalizeHardwareFinishItem(item = {}) {
  const source = typeof item === "string" ? { name: item } : item || {};
  return {
    id: String(source.id || source.key || newHardwareFinishItemId()),
    name: String(source.name || source.material || source.finish || "").trim(),
    count: signedNumber(source.count),
    lengthM: Math.max(0, signedNumber(source.lengthM ?? source.length))
  };
}

function normalizeHardwareFinishItems(items) {
  const values = Array.isArray(items) ? items : [items];
  return values
    .map(normalizeHardwareFinishItem)
    .filter((item) => item.name || item.count !== 0 || item.lengthM > 0);
}

function hardwareFinishRowElement(id) {
  return Array.from(els.hardwareFinishRows?.querySelectorAll("[data-hardware-finish-row]") || [])
    .find((row) => row.dataset.hardwareFinishRow === id) || null;
}

function hardwareFinishItemFromRow(row) {
  if (!row) return null;
  return normalizeHardwareFinishItem({
    id: row.dataset.hardwareFinishRow,
    name: row.querySelector('[data-hardware-finish-input="name"]')?.value,
    count: row.dataset.hardwareCount,
    lengthM: row.dataset.hardwareLength
  });
}

function updateHardwareFinishRow(row, item) {
  if (!row) return;
  const normalized = normalizeHardwareFinishItem(item);
  row.dataset.hardwareFinishRow = normalized.id;
  row.dataset.hardwareCount = String(normalized.count);
  row.dataset.hardwareLength = String(normalized.lengthM);
  const nameInput = row.querySelector('[data-hardware-finish-input="name"]');
  if (nameInput && nameInput.value !== normalized.name) nameInput.value = normalized.name;
  const countView = row.querySelector("[data-hardware-count]");
  if (countView) countView.textContent = hardwareCountText(normalized.count);
  const lengthView = row.querySelector("[data-hardware-length]");
  if (lengthView) lengthView.textContent = hardwareLengthText(normalized.lengthM);
}

function createHardwareFinishRow(item = {}) {
  const normalized = normalizeHardwareFinishItem(item);
  const row = document.createElement("div");
  row.className = "hardware-finish-row";

  const nameInput = document.createElement("input");
  nameInput.type = "text";
  nameInput.className = "hardware-finish-name";
  nameInput.placeholder = "例: カーテンレール / 手すり";
  nameInput.dataset.hardwareFinishInput = "name";
  nameInput.setAttribute("aria-label", "金物名");

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "hardware-finish-remove";
  removeButton.dataset.removeHardwareFinish = normalized.id;
  removeButton.setAttribute("aria-label", "この金物を削除");
  removeButton.title = "この金物を削除";
  removeButton.textContent = "×";

  const actions = document.createElement("div");
  actions.className = "hardware-finish-actions";

  const countControl = document.createElement("div");
  countControl.className = "hardware-count-control";
  const countLabel = document.createElement("span");
  countLabel.textContent = "個数";
  const minusButton = document.createElement("button");
  minusButton.type = "button";
  minusButton.className = "hardware-count-button";
  minusButton.dataset.hardwareCountDelta = "-1";
  minusButton.setAttribute("aria-label", "個数を1減らす");
  minusButton.title = "-1個";
  minusButton.textContent = "-";
  const countView = document.createElement("output");
  countView.className = "hardware-count-value";
  countView.dataset.hardwareCount = "";
  const plusButton = document.createElement("button");
  plusButton.type = "button";
  plusButton.className = "hardware-count-button";
  plusButton.dataset.hardwareCountDelta = "1";
  plusButton.setAttribute("aria-label", "個数を1増やす");
  plusButton.title = "+1個";
  plusButton.textContent = "+";
  countControl.append(countLabel, minusButton, countView, plusButton);

  const lengthControl = document.createElement("div");
  lengthControl.className = "hardware-length-control";
  const lengthLabel = document.createElement("span");
  lengthLabel.textContent = "長さ";
  const lengthView = document.createElement("output");
  lengthView.className = "hardware-length-value";
  lengthView.dataset.hardwareLength = "";
  const traceButton = document.createElement("button");
  traceButton.type = "button";
  traceButton.className = "hardware-trace-button";
  traceButton.dataset.hardwareTrace = normalized.id;
  traceButton.textContent = "線をなぞる";
  lengthControl.append(lengthLabel, lengthView, traceButton);

  actions.append(countControl, lengthControl);
  row.append(nameInput, removeButton, actions);
  updateHardwareFinishRow(row, normalized);
  return row;
}

function addHardwareFinishRow(item = {}) {
  if (!els.hardwareFinishRows) return null;
  const row = createHardwareFinishRow(item);
  els.hardwareFinishRows.append(row);
  return row;
}

function renderHardwareFinishSchedule(items = []) {
  if (!els.hardwareFinishRows) return;
  const normalized = normalizeHardwareFinishItems(items);
  els.hardwareFinishRows.replaceChildren();
  (normalized.length ? normalized : [{}]).forEach((item) => addHardwareFinishRow(item));
  updateModeButtons();
}

function currentHardwareFinishSchedule() {
  return Array.from(els.hardwareFinishRows?.querySelectorAll("[data-hardware-finish-row]") || [])
    .map(hardwareFinishItemFromRow)
    .filter((item) => item && (item.name || item.count !== 0 || item.lengthM > 0));
}

function hardwareFinishItemById(id) {
  return hardwareFinishItemFromRow(hardwareFinishRowElement(id));
}

function updateHardwareFinishItem(id, values = {}) {
  const row = hardwareFinishRowElement(id);
  const current = hardwareFinishItemFromRow(row);
  if (!row || !current) return null;
  const next = normalizeHardwareFinishItem({ ...current, ...values, id: current.id });
  updateHardwareFinishRow(row, next);
  updateModeButtons();
  return next;
}

function currentFinishSchedule() {
  const materials = currentInternalFinishMaterials();
  return {
    itemSummaries: currentFinishItemSummaries(),
    materials,
    floor: materials.floor,
    baseboard: materials.baseboard,
    wall: materials.wall,
    ceiling: materials.ceiling,
    ceilingTrim: materials.ceilingTrim,
    formulas: currentInternalFinishFormulas(),
    hardware: currentHardwareFinishSchedule()
  };
}

function normalizeFinishSchedule(schedule = {}) {
  const materials = normalizeInternalFinishMaterials(schedule.materials || schedule.items || {}, schedule);
  return {
    itemSummaries: normalizeFinishItemSummaries(schedule.itemSummaries || schedule.summaries || {}),
    materials,
    floor: materials.floor,
    baseboard: materials.baseboard,
    wall: materials.wall,
    ceiling: materials.ceiling,
    ceilingTrim: materials.ceilingTrim,
    formulas: normalizeInternalFinishFormulas(schedule.formulas || schedule.itemFormulas || {}),
    hardware: normalizeHardwareFinishItems(schedule.hardware || schedule.hardwareItems || [])
  };
}

function applyFinishSchedule(schedule = {}) {
  const normalized = normalizeFinishSchedule(schedule);
  applyFinishItemSummaries(normalized.itemSummaries);
  applyInternalFinishMaterials(normalized.materials);
  applyInternalFinishFormulas(normalized.formulas);
  renderHardwareFinishSchedule(normalized.hardware);
}

function externalFinishCategory(key) {
  return externalFinishCategories.find((category) => category.key === key) || externalFinishCategories[0];
}

function externalFinishRowsContainer(key) {
  return els.externalFinishCategories?.querySelector(`[data-external-finish-rows="${key}"]`) || null;
}

function defaultExternalFinishFormula(key) {
  if (key === "wall") return "wall";
  if (key === "hardware") return "count";
  return "floor";
}

function normalizeExternalFinishRow(row = {}, key = "") {
  const source = typeof row === "string" ? { finish: row } : row || {};
  return {
    finish: String(source.finish || source.material || "").trim(),
    summary: String(source.summary || "").trim(),
    formula: normalizeFinishFormula(source.formula, defaultExternalFinishFormula(key))
  };
}

function normalizeExternalFinishRows(rows, key = "") {
  const values = Array.isArray(rows) ? rows : [rows];
  return values
    .map((row) => normalizeExternalFinishRow(row, key))
    .filter((row) => row.finish || row.summary);
}

function legacyExternalFinishRows(schedule = {}, key) {
  const legacy = {
    roof: { finish: schedule.roof, summary: schedule.roofSummary },
    wall: { finish: schedule.wall, summary: schedule.wallSummary },
    eaves: { finish: schedule.eaves, summary: schedule.eavesSummary },
    parking: { finish: schedule.parking, summary: schedule.parkingSummary },
    dogrun: { finish: schedule.dogrun || schedule.base, summary: schedule.dogrunSummary || schedule.baseSummary, legacyLabel: !schedule.dogrun && schedule.base ? "旧項目: 基礎・土台" : "" },
    hardware: { finish: schedule.hardware || schedule.other, summary: schedule.hardwareSummary || schedule.otherSummary, legacyLabel: !schedule.hardware && schedule.other ? "旧項目: その他外部仕上" : "" }
  }[key] || {};
  const summary = [legacy.summary, legacy.legacyLabel].filter(Boolean).join(" / ");
  return normalizeExternalFinishRows({ finish: legacy.finish, summary }, key);
}

function externalFinishRowsFromSchedule(schedule = {}, key) {
  const value = schedule?.[key];
  if (Array.isArray(value)) return normalizeExternalFinishRows(value, key);
  if (value && typeof value === "object") return normalizeExternalFinishRows(value, key);
  return legacyExternalFinishRows(schedule, key);
}

function normalizeExternalFinishSchedule(schedule = {}) {
  return Object.fromEntries(externalFinishCategories.map(({ key }) => [
    key,
    externalFinishRowsFromSchedule(schedule, key)
  ]));
}

function externalFinishMenu(row) {
  return row?.querySelector("[data-external-finish-menu]") || null;
}

function externalFinishInput(row) {
  return row?.querySelector('[data-external-finish-input="finish"]') || null;
}

function externalFinishSuggestions(row) {
  const input = externalFinishInput(row);
  const needle = materialSuggestionKey(normalizeMaterialText(input?.value || ""));
  const source = needle
    ? materialSuggestions.filter((material) => materialSuggestionKey(material).includes(needle))
    : materialSuggestions;
  return source
    .slice()
    .sort((a, b) => {
      const aKey = materialSuggestionKey(a);
      const bKey = materialSuggestionKey(b);
      const aStarts = needle && aKey.startsWith(needle) ? 0 : 1;
      const bStarts = needle && bKey.startsWith(needle) ? 0 : 1;
      return aStarts - bStarts || a.localeCompare(b, "ja", { numeric: true });
    })
    .slice(0, 80);
}

function closeExternalFinishMenu(row) {
  const menu = externalFinishMenu(row);
  const input = externalFinishInput(row);
  if (menu) menu.hidden = true;
  input?.setAttribute("aria-expanded", "false");
}

function closeExternalFinishMenus(options = {}) {
  els.externalFinishCategories?.querySelectorAll("[data-external-finish-row]").forEach((row) => {
    if (row !== options.except) closeExternalFinishMenu(row);
  });
}

function renderExternalFinishMenu(row) {
  const menu = externalFinishMenu(row);
  const input = externalFinishInput(row);
  if (!menu || !input) return;
  menu.innerHTML = "";
  const current = normalizeMaterialText(input.value);
  const currentExists = materialSuggestions.some((material) => materialSuggestionKey(material) === materialSuggestionKey(current));
  if (current && !currentExists) {
    const action = document.createElement("button");
    action.type = "button";
    action.className = "material-menu-action";
    action.setAttribute("role", "option");
    action.innerHTML = `
      <span class="material-menu-title">現在の入力を候補に追加</span>
      <span class="material-menu-meta">${escapeHtml(current)}</span>
    `;
    action.addEventListener("click", (event) => {
      event.preventDefault();
      addMaterialSuggestion(current, { persist: true });
      closeExternalFinishMenu(row);
    });
    menu.appendChild(action);
  }
  const values = externalFinishSuggestions(row);
  if (values.length === 0) {
    const empty = document.createElement("div");
    empty.className = "material-menu-empty";
    empty.textContent = "入力した仕上げは次回からここで選べます。";
    menu.appendChild(empty);
    return;
  }
  values.forEach((material) => {
    const button = document.createElement("button");
    button.type = "button";
    button.setAttribute("role", "option");
    button.innerHTML = `
      <span class="material-menu-title">${escapeHtml(material)}</span>
      <span class="material-menu-meta">入力履歴・PDF読取候補</span>
    `;
    button.addEventListener("click", (event) => {
      event.preventDefault();
      input.value = material;
      addMaterialSuggestion(material, { persist: false });
      saveQuietly();
      closeExternalFinishMenu(row);
    });
    menu.appendChild(button);
  });
}

function openExternalFinishMenu(row) {
  if (!row) return;
  setActiveExternalFinish(row.dataset.externalFinishRow, { row });
  closeMaterialMenu();
  closeFinishMenus();
  closeExternalFinishMenus({ except: row });
  addDirectFinishCandidates({ persist: false });
  refreshMaterialSuggestions();
  renderExternalFinishMenu(row);
  const menu = externalFinishMenu(row);
  const input = externalFinishInput(row);
  if (menu) menu.hidden = false;
  input?.setAttribute("aria-expanded", "true");
}

function createExternalFinishRow(category, row = {}) {
  const normalized = normalizeExternalFinishRow(row, category.key);
  const rowElement = document.createElement("div");
  rowElement.className = "external-finish-row";
  rowElement.dataset.externalFinishRow = category.key;

  const finishPicker = document.createElement("div");
  finishPicker.className = "external-finish-picker";
  const finishInput = document.createElement("input");
  finishInput.type = "text";
  finishInput.value = normalized.finish;
  finishInput.placeholder = category.placeholder;
  finishInput.dataset.externalFinishInput = "finish";
  finishInput.setAttribute("role", "combobox");
  finishInput.setAttribute("aria-expanded", "false");
  finishInput.setAttribute("aria-label", `${category.label}の仕上げ`);

  const menuButton = document.createElement("button");
  menuButton.type = "button";
  menuButton.className = "external-finish-menu-button";
  menuButton.textContent = "▼";
  menuButton.setAttribute("aria-label", `${category.label}の仕上げ候補を選択`);

  const menu = document.createElement("div");
  menu.className = "finish-menu";
  menu.dataset.externalFinishMenu = "";
  menu.setAttribute("role", "listbox");
  menu.hidden = true;
  finishPicker.append(finishInput, menuButton, menu);

  const formulaInput = document.createElement("select");
  formulaInput.className = "external-finish-formula";
  formulaInput.dataset.externalFinishInput = "formula";
  formulaInput.setAttribute("aria-label", `${category.label}の計算`);
  finishFormulaValues.forEach((value) => {
    const option = document.createElement("option");
    option.value = value;
    option.textContent = finishFormulaOptionLabels[value];
    formulaInput.appendChild(option);
  });
  formulaInput.value = normalized.formula;

  const summaryInput = document.createElement("input");
  summaryInput.type = "text";
  summaryInput.value = normalized.summary;
  summaryInput.placeholder = "概要";
  summaryInput.className = "external-finish-summary";
  summaryInput.dataset.externalFinishInput = "summary";
  summaryInput.setAttribute("aria-label", `${category.label}の概要`);

  const removeButton = document.createElement("button");
  removeButton.type = "button";
  removeButton.className = "external-finish-remove";
  removeButton.dataset.removeExternalFinish = category.key;
  removeButton.setAttribute("aria-label", `${category.label}のこの仕上げを削除`);
  removeButton.title = "この仕上げを削除";
  removeButton.textContent = "×";

  menuButton.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (menu.hidden) openExternalFinishMenu(rowElement);
    else closeExternalFinishMenu(rowElement);
  });
  finishInput.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openExternalFinishMenu(rowElement);
    } else if (event.key === "Enter" && !menu.hidden) {
      const first = externalFinishSuggestions(rowElement)[0];
      if (first) {
        event.preventDefault();
        finishInput.value = first;
        addMaterialSuggestion(first, { persist: false });
        saveQuietly();
        closeExternalFinishMenu(rowElement);
      }
    }
  });
  rowElement.append(finishPicker, formulaInput, removeButton, summaryInput);
  return rowElement;
}

function addExternalFinishRow(key, row = {}) {
  const category = externalFinishCategory(key);
  const container = externalFinishRowsContainer(category.key);
  if (!container) return null;
  const rowElement = createExternalFinishRow(category, row);
  container.append(rowElement);
  return rowElement;
}

function renderExternalFinishSchedule(schedule = {}) {
  const normalized = normalizeExternalFinishSchedule(schedule);
  externalFinishCategories.forEach((category) => {
    const container = externalFinishRowsContainer(category.key);
    if (!container) return;
    container.replaceChildren();
    const rows = normalized[category.key];
    (rows.length ? rows : [{}]).forEach((row) => addExternalFinishRow(category.key, row));
  });
}

function currentExternalFinishSchedule() {
  return Object.fromEntries(externalFinishCategories.map(({ key }) => {
    const container = externalFinishRowsContainer(key);
    const rows = Array.from(container?.querySelectorAll("[data-external-finish-row]") || []).map((row) => normalizeExternalFinishRow({
      finish: row.querySelector('[data-external-finish-input="finish"]')?.value,
      summary: row.querySelector('[data-external-finish-input="summary"]')?.value,
      formula: row.querySelector('[data-external-finish-input="formula"]')?.value
    }, key)).filter((row) => row.finish || row.summary);
    return [key, rows];
  }));
}

function applyExternalFinishSchedule(schedule = {}) {
  renderExternalFinishSchedule(schedule);
}

function formulaForExternalFinishRow(row, key) {
  return normalizeFinishFormula(
    row?.querySelector('[data-external-finish-input="formula"]')?.value,
    defaultExternalFinishFormula(key)
  );
}

function formulaForExternalFinish(key) {
  const row = externalFinishRowsContainer(key)?.querySelector("[data-external-finish-row]");
  return formulaForExternalFinishRow(row, key);
}

function internalFinishItem(key) {
  return internalFinishItems.find((item) => item.key === key) || null;
}

function defaultInternalFinishKey() {
  return {
    floor: "floor",
    perimeter: "baseboard",
    wall: "wall",
    count: "wall"
  }[els.formulaInput.value] || "floor";
}

function defaultExternalFinishKey() {
  return {
    floor: "parking",
    perimeter: "dogrun",
    wall: "wall",
    count: "hardware"
  }[els.formulaInput.value] || "wall";
}

function updateFinishSelectionStyles() {
  internalFinishItems.forEach(({ key }) => {
    const input = internalFinishInput(key);
    input?.closest(".finish-choice-field")?.classList.toggle(
      "is-selected",
      activeFinishTab === "internal" && activeInternalFinishKey === key
    );
  });
  externalFinishCategories.forEach(({ key }) => {
    els.externalFinishCategories
      ?.querySelector(`[data-external-finish-category="${key}"]`)
      ?.classList.toggle("is-selected", activeFinishTab === "external" && activeExternalFinishKey === key);
  });
}

function setActiveInternalFinish(key, options = {}) {
  if (!internalFinishItem(key)) return;
  activeInternalFinishKey = key;
  if (options.syncFormula !== false) els.formulaInput.value = formulaForInternalFinish(key);
  updateFinishSelectionStyles();
}

function setActiveExternalFinish(key, options = {}) {
  if (!externalFinishCategories.some((category) => category.key === key)) return;
  const categoryChanged = activeExternalFinishKey !== key;
  activeExternalFinishKey = key;
  if (options.row?.dataset?.externalFinishRow === key) activeExternalFinishRow = options.row;
  else if (categoryChanged) activeExternalFinishRow = null;
  if (options.syncFormula !== false) {
    els.formulaInput.value = activeExternalFinishRow
      ? formulaForExternalFinishRow(activeExternalFinishRow, key)
      : formulaForExternalFinish(key);
  }
  updateFinishSelectionStyles();
}

function currentFinishSelection() {
  if (activeFinishTab === "external") {
    const key = activeExternalFinishKey || defaultExternalFinishKey();
    const category = externalFinishCategory(key);
    const row = activeExternalFinishRow?.isConnected
      && activeExternalFinishRow.dataset.externalFinishRow === key
      ? activeExternalFinishRow
      : externalFinishRowsContainer(key)?.querySelector("[data-external-finish-row]");
    const material = (externalFinishInput(row)?.value || "").trim();
    return { key, label: category.label, material, tab: "external" };
  }

  const key = activeInternalFinishKey || defaultInternalFinishKey();
  const item = internalFinishItem(key) || internalFinishItems[0];
  const material = ["baseboard", "ceilingTrim"].includes(item.key)
    ? trimMaterialForTarget(item.key)
    : currentFinishSchedule().materials?.[item.key] || "";
  return { key: item.key, label: item.label, material, tab: "internal" };
}

function finishTableLocation(floor = els.floorInput.value, room = els.roomInput.value) {
  const normalizedFloor = normalizeRoomText(floor) || "未設定";
  const normalizedRoom = normalizeRoomText(room);
  if (!normalizedRoom) return null;
  return {
    key: roomSettingKey(normalizedFloor, normalizedRoom),
    floor: normalizedFloor,
    room: normalizedRoom
  };
}

function normalizeFinishTable(table) {
  const location = finishTableLocation(table?.floor, table?.room);
  if (!location) return null;
  return {
    ...location,
    internal: normalizeFinishSchedule(table.internal || table.finishSchedule || {}),
    external: normalizeExternalFinishSchedule(table.external || table.externalFinishSchedule || {}),
    activeTab: table.activeTab === "external" ? "external" : "internal"
  };
}

function normalizeFinishTables(tables, legacySchedule, legacyLocation) {
  const merged = new Map();
  (Array.isArray(tables) ? tables : []).forEach((table) => {
    const normalized = normalizeFinishTable(table);
    if (normalized) merged.set(normalized.key, normalized);
  });
  if (merged.size === 0 && legacyLocation) {
    const normalizedLocation = finishTableLocation(legacyLocation.floor, legacyLocation.room);
    if (normalizedLocation) {
      merged.set(normalizedLocation.key, {
        ...normalizedLocation,
        internal: normalizeFinishSchedule(legacySchedule || {}),
        external: normalizeExternalFinishSchedule({}),
        activeTab: "internal"
      });
    }
  }
  return Array.from(merged.values()).sort(compareRoomSettings);
}

function findFinishTable(floor = els.floorInput.value, room = els.roomInput.value) {
  const location = finishTableLocation(floor, room);
  return location ? finishTables.find((table) => table.key === location.key) || null : null;
}

function upsertFinishTable(table) {
  const normalized = normalizeFinishTable(table);
  if (!normalized) return null;
  const index = finishTables.findIndex((candidate) => candidate.key === normalized.key);
  if (index >= 0) finishTables[index] = normalized;
  else finishTables.push(normalized);
  finishTables.sort(compareRoomSettings);
  return normalized;
}

function saveActiveFinishTable() {
  const location = activeFinishTableLocation || finishTableLocation();
  if (!location) return null;
  activeFinishTableLocation = location;
  return upsertFinishTable({
    ...location,
    internal: currentFinishSchedule(),
    external: currentExternalFinishSchedule(),
    activeTab: activeFinishTab
  });
}

function internalFinishFallbackFromRoomSetting() {
  return {
    itemSummaries: {},
    floor: "",
    baseboard: trimSettingValue(els.baseboardInput?.value || ""),
    wall: "",
    ceiling: "",
    ceilingTrim: trimSettingValue(els.ceilingTrimInput?.value || ""),
    hardware: []
  };
}

function setActiveFinishTab(tab, options = {}) {
  activeFinishTab = tab === "external" ? "external" : "internal";
  if (activeFinishTab === "internal" && !activeInternalFinishKey) activeInternalFinishKey = defaultInternalFinishKey();
  if (activeFinishTab === "external" && !activeExternalFinishKey) activeExternalFinishKey = defaultExternalFinishKey();
  const isInternal = activeFinishTab === "internal";
  els.internalFinishTab?.setAttribute("aria-selected", String(isInternal));
  els.externalFinishTab?.setAttribute("aria-selected", String(!isInternal));
  if (els.internalFinishPanel) els.internalFinishPanel.hidden = !isInternal;
  if (els.externalFinishPanel) els.externalFinishPanel.hidden = isInternal;
  if (isInternal) {
    els.formulaInput.value = formulaForInternalFinish(activeInternalFinishKey);
  } else {
    const row = activeExternalFinishRow?.isConnected
      && activeExternalFinishRow.dataset.externalFinishRow === activeExternalFinishKey
      ? activeExternalFinishRow
      : null;
    els.formulaInput.value = row
      ? formulaForExternalFinishRow(row, activeExternalFinishKey)
      : formulaForExternalFinish(activeExternalFinishKey);
  }
  updateFinishSelectionStyles();
  if (options.persist) saveQuietly();
}

function loadFinishTableForCurrentRoom(options = {}) {
  const location = finishTableLocation();
  if (!location) {
    activeFinishTableLocation = null;
    return;
  }
  const table = findFinishTable(location.floor, location.room);
  applyFinishSchedule(table?.internal || options.fallbackInternal || {});
  applyExternalFinishSchedule(table?.external || {});
  activeFinishTableLocation = location;
  setActiveFinishTab(options.tab || table?.activeTab || activeFinishTab, { persist: false });
}

function recordSurfaceKind(formula, part, material) {
  const text = normalizeSearchText([formulaLabel(formula), part, material].filter(Boolean).join(" "));
  if (text.includes("天井")) return "ceiling";
  if (formula === "wall" || text.includes("壁")) return "wall";
  if (formula === "floor" || text.includes("床")) return "floor";
  return "";
}

function finishScheduleMaterial(kind) {
  const schedule = currentFinishSchedule();
  return schedule.materials?.[kind] || schedule[kind] || "";
}

function trimMaterialForTarget(target) {
  const value = target === "baseboard"
    ? trimSettingValue(els.baseboardInput?.value || "")
    : target === "ceilingTrim"
      ? trimSettingValue(els.ceilingTrimInput?.value || "")
      : "";
  return value && !["no", "yes"].includes(value) ? value : "";
}

function finishSelectionForRecord() {
  const selection = currentFinishSelection();
  if (selection.material) return selection;
  if (selection.tab === "internal" && [
    "wall", "partitionWall", "exteriorWainscotUpperFinish", "exteriorWainscotLowerFinish",
    "partitionWainscotUpperFinish", "partitionWainscotLowerFinish", "ceiling"
  ].includes(selection.key)) {
    return { ...selection, material: "部材なし" };
  }
  setHint(`${selection.tab === "external" ? "外部" : "内部"}仕上げ表の「${selection.label}」を入力してください。`);
  return null;
}

function substrateInfoForRecord(formula, part, material) {
  const kind = recordSurfaceKind(formula, part, material);
  return {
    surfaceKind: kind,
    wallType: "",
    wallTypeLabel: "",
    wallSubstrate: "",
    ceilingSubstrate: "",
    substrateSummary: ""
  };
}

function recordMaterialLabel(record) {
  return [record.material, record.substrateSummary].filter(Boolean).join(" / ");
}

function trimTargetFromText(value) {
  const text = normalizeSearchText(value);
  if (/巾木|幅木/.test(text)) return "baseboard";
  if (/廻り縁|廻縁|回り縁|回縁|廻りぶち|回りぶち/.test(text)) return "ceilingTrim";
  return "";
}

function disabledPerimeterReason() {
  if (els.formulaInput.value !== "perimeter") return "";
  const target = activeFinishTab === "internal" ? currentFinishSelection().key : "";
  if (target === "baseboard" && trimAvailability(els.baseboardInput.value) === "no") return "巾木なし";
  if (target === "ceilingTrim" && trimAvailability(els.ceilingTrimInput.value) === "no") return "廻り縁なし";
  return "";
}

function calculateQuantity(points, shape) {
  if (!scale && shape !== "count") return null;
  const pxPerMeter = scale?.pxPerMeter || 1;
  const formula = els.formulaInput.value;
  const height = Number(els.heightInput.value || 0);
  const deductLength = Number(els.deductLengthInput.value || 0);
  const deductArea = Number(els.deductAreaInput.value || 0);
  const baseboard = trimSettingValue(els.baseboardInput.value);
  const ceilingTrim = trimSettingValue(els.ceilingTrimInput.value);
  const wainscot = wainscotAvailability(els.wainscotInput.value);
  const roomMetrics = { height, deductLength, deductArea, baseboard, ceilingTrim, wainscot };

  if (shape === "count" || formula === "count") {
    return { quantity: 1, unit: "箇所", expression: "1", metrics: roomMetrics };
  }

  const areaM2 = polygonArea(points) / (pxPerMeter * pxPerMeter);
  const perimeterM = polygonLength(points, shape !== "line") / pxPerMeter;
  const lineM = polygonLength(points, false) / pxPerMeter;
  const metrics = { ...roomMetrics, areaM2, perimeterM, lineM };

  if (formula === "perimeter") {
    const disabledReason = disabledPerimeterReason();
    if (disabledReason) {
      return { quantity: 0, unit: "m", expression: disabledReason, metrics };
    }
    const quantity = Math.max(0, (shape === "line" ? lineM : perimeterM) - deductLength);
    return { quantity, unit: "m", expression: `周長 ${numberText(perimeterM)} - 控除 ${numberText(deductLength)}`, metrics };
  }
  if (formula === "wall") {
    const quantity = Math.max(0, perimeterM * height - deductArea);
    return { quantity, unit: "m2", expression: `周長 ${numberText(perimeterM)} x 高さ ${numberText(height)} - 控除 ${numberText(deductArea)}`, metrics };
  }
  if (shape === "line") {
    return { quantity: lineM, unit: "m", expression: `長さ ${numberText(lineM)}`, metrics };
  }
  return { quantity: areaM2, unit: "m2", expression: `面積 ${numberText(areaM2)}`, metrics };
}

function createRecord(points, shape) {
  const calc = calculateQuantity(points, shape);
  if (!calc) {
    setHint("先に縮尺を設定してください。");
    return;
  }
  const finish = finishSelectionForRecord();
  if (!finish) return;
  const existingIndex = overwriteSelectedRecord ? records.findIndex((record) => record.id === selectedId) : -1;
  const existing = existingIndex >= 0 ? records[existingIndex] : null;
  const price = existing?.price || 0;
  const part = finish.label;
  const material = finish.material;
  const substrate = substrateInfoForRecord(els.formulaInput.value, part, material);
  const record = {
    id: existing?.id || `r-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    page: currentPage,
    shape,
    points: points.map((point) => ({ x: point.x, y: point.y })),
    floor: els.floorInput.value.trim() || "未設定",
    room: els.roomInput.value.trim() || "未設定",
    part,
    material,
    estimateTrade: openingTradeName(els.openingTradeInput.value),
    formula: formulaLabel(els.formulaInput.value),
    expression: calc.expression,
    quantity: calc.quantity,
    unit: calc.unit,
    height: calc.metrics?.height ?? 0,
    baseboard: calc.metrics?.baseboard || "no",
    ceilingTrim: calc.metrics?.ceilingTrim || "no",
    wainscot: calc.metrics?.wainscot || "no",
    deductLength: calc.metrics?.deductLength ?? 0,
    deductArea: calc.metrics?.deductArea ?? 0,
    areaM2: calc.metrics?.areaM2,
    perimeterM: calc.metrics?.perimeterM,
    lineM: calc.metrics?.lineM,
    surfaceKind: substrate.surfaceKind,
    wallType: substrate.wallType,
    wallTypeLabel: substrate.wallTypeLabel,
    wallSubstrate: substrate.wallSubstrate,
    ceilingSubstrate: substrate.ceilingSubstrate,
    substrateSummary: substrate.substrateSummary,
    estimateSummary: existing?.estimateSummary || "",
    estimateRemarks: existing?.estimateRemarks || "",
    price,
    amount: calc.quantity * price,
    memo: els.memoInput.value.trim()
  };
  if (existingIndex >= 0) records[existingIndex] = record;
  else records.push(record);
  addMaterialSuggestion(record.material, { persist: false });
  updateRoomSettingFromRecord(record, calc);
  selectedId = record.id;
  overwriteSelectedRecord = false;
  tempPoints = [];
  saveQuietly();
  renderRecords();
  drawOverlay();
  setHint(existing ? "選択した拾い明細を上書きしました。" : "拾い明細に登録しました。");
}

function finishCalibration() {
  const realLengthInput = Number(els.scaleLengthInput.value || 0);
  const unit = scaleUnit();
  const realLength = scaleLengthMeters(realLengthInput, unit);
  const px = distance(tempPoints[0], tempPoints[1]);
  if (realLengthInput <= 0 || realLength <= 0 || px <= 0) return;
  scale = { pxPerMeter: px / realLength, realLength, realLengthInput, unit, measuredPx: px };
  tempPoints = [];
  scaleCheckResult = null;
  mode = "draw";
  updateModeButtons();
  syncScaleInputsFromScale(scale);
  updateScaleStatus();
  setHint("この図面の縮尺を設定しました。図面を切り替えても、それぞれ別の縮尺を保存できます。");
  saveQuietly();
  drawOverlay();
}

function startScaleCheck() {
  if (!scale) {
    setScaleCheckStatus("先にこの図面の縮尺を設定してください。");
    setHint("先にこの図面の縮尺を2点で設定してください。");
    return;
  }
  const expectedInput = Number(els.scaleLengthInput.value || 0);
  const unit = scaleUnit();
  const expectedMeters = scaleLengthMeters(expectedInput, unit);
  if (expectedInput <= 0 || expectedMeters <= 0) {
    setScaleCheckStatus("チェックしたい実寸を入力してください。");
    setHint("縮尺チェックに使う実寸を入力してください。");
    return;
  }
  mode = "scaleCheck";
  tempPoints = [];
  scaleCheckResult = null;
  updateModeButtons();
  drawOverlay();
  setScaleCheckStatus(`チェック待ち: ${scaleLengthLabel(expectedMeters, unit)} の寸法線を2点でなぞってください。`);
  setHint("縮尺チェック: 図面上の寸法線の両端を2点クリックしてください。現在の縮尺は変更しません。");
}

function finishScaleCheck() {
  if (!scale || tempPoints.length < 2) return;
  const unit = scaleUnit();
  const expectedInput = Number(els.scaleLengthInput.value || 0);
  const expectedMeters = scaleLengthMeters(expectedInput, unit);
  const measuredPx = distance(tempPoints[0], tempPoints[1]);
  const measuredMeters = measuredPx / (scale.pxPerMeter || 1);
  if (!Number.isFinite(measuredMeters) || measuredMeters <= 0) return;

  const diffMeters = measuredMeters - expectedMeters;
  const percent = expectedMeters > 0 ? (diffMeters / expectedMeters) * 100 : 0;
  const result = `入力 ${scaleLengthLabel(expectedMeters, unit)} / なぞり ${scaleLengthLabel(measuredMeters, unit)} / 差 ${signedScaleLengthLabel(diffMeters, unit)} (${percent >= 0 ? "+" : ""}${numberText(percent, 2)}%)`;
  scaleCheckResult = {
    page: currentPage,
    points: tempPoints.map((point) => ({ x: point.x, y: point.y })),
    label: result
  };
  setScaleCheckStatus(result);
  setHint(`縮尺チェック: ${result}`);
  tempPoints = [];
  mode = "draw";
  updateModeButtons();
  drawOverlay();
}

function nearestRecord(point) {
  let best = null;
  let bestDistance = Infinity;
  records.filter((record) => record.page === currentPage).forEach((record) => {
    record.points.forEach((recordPoint) => {
      const d = distance(point, recordPoint);
      if (d < bestDistance) {
        best = record;
        bestDistance = d;
      }
    });
  });
  return bestDistance < 16 ? best : null;
}

function deductionRecordLabel(kind) {
  return kind === "area" ? "建具面積控除" : "建具幅控除";
}

function finishDeductionTrace(points, shape) {
  if (!scale) {
    setHint("先に縮尺を設定してください。");
    return;
  }
  const kind = mode === "deductArea" ? "area" : "length";
  const pxPerMeter = scale.pxPerMeter || 1;
  const value = kind === "area"
    ? polygonArea(points) / (pxPerMeter * pxPerMeter)
    : polygonLength(points, false) / pxPerMeter;
  if (!Number.isFinite(value) || value <= 0) return;

  const input = kind === "area" ? els.deductAreaInput : els.deductLengthInput;
  addToNumberInput(input, value);

  const floor = els.floorInput.value.trim() || "未設定";
  const room = els.roomInput.value.trim() || "未設定";
  const unit = kind === "area" ? "m2" : "m";
  const label = deductionRecordLabel(kind);
  const record = {
    id: `r-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    recordType: "deduction",
    deductionKind: kind,
    deductionValue: value,
    page: currentPage,
    shape,
    points: points.map((point) => ({ x: point.x, y: point.y })),
    floor,
    room,
    part: "建具控除",
    material: label,
    estimateTrade: "",
    formula: label,
    expression: `${label} +${numberText(value)}${unit}`,
    quantity: value,
    unit,
    height: Number(els.heightInput.value || 0),
    baseboard: trimSettingValue(els.baseboardInput.value),
    ceilingTrim: trimSettingValue(els.ceilingTrimInput.value),
    wainscot: wainscotAvailability(els.wainscotInput.value),
    deductLength: kind === "length" ? value : numberInputValue(els.deductLengthInput),
    deductArea: kind === "area" ? value : numberInputValue(els.deductAreaInput),
    areaM2: kind === "area" ? value : undefined,
    perimeterM: undefined,
    lineM: kind === "length" ? value : undefined,
    price: 0,
    amount: 0,
    memo: els.memoInput.value.trim()
  };

  records.push(record);
  selectedId = record.id;
  overwriteSelectedRecord = false;
  tempPoints = [];
  mode = "draw";
  updateDeductionTraceButtons();
  autoSaveCurrentRoomSetting();
  saveQuietly();
  renderRecords();
  drawOverlay();
  setHint(`${label} ${numberText(value)}${unit} を追加しました。控除欄に自動加算しています。`);
}

function hardwareRecordIndex(itemId, kind) {
  const floor = els.floorInput.value.trim() || "未設定";
  const room = els.roomInput.value.trim() || "未設定";
  return records.findIndex((record) => (
    record.hardwareItemId === itemId &&
    record.hardwareTakeoffKind === kind &&
    record.floor === floor &&
    record.room === room
  ));
}

function hardwareRecordExpression(kind, value) {
  return kind === "count"
    ? `個数 ${hardwareCountText(value)}`
    : `線なぞり 合計 ${hardwareLengthText(value)}`;
}

function upsertHardwareTakeoffRecord(item, kind, options = {}) {
  const value = kind === "count" ? item.count : item.lengthM;
  const index = hardwareRecordIndex(item.id, kind);
  const existing = index >= 0 ? records[index] : null;
  if (value === 0) {
    if (existing) records.splice(index, 1);
    return null;
  }

  const price = Number(existing?.price || 0);
  const points = options.points || existing?.points || [];
  const record = {
    id: existing?.id || `hardware-${Date.now()}-${Math.random().toString(16).slice(2)}`,
    page: currentPage,
    shape: kind === "count" ? "count" : "line",
    points: points.map((point) => ({ ...point })),
    floor: els.floorInput.value.trim() || "未設定",
    room: els.roomInput.value.trim() || "未設定",
    part: "金物",
    material: item.name || "金物",
    estimateTrade: "",
    formula: kind === "count" ? "個数" : "長さ",
    expression: hardwareRecordExpression(kind, value),
    quantity: value,
    unit: kind === "count" ? "個" : "m",
    height: Number(els.heightInput.value || 0),
    baseboard: trimSettingValue(els.baseboardInput.value),
    ceilingTrim: trimSettingValue(els.ceilingTrimInput.value),
    wainscot: wainscotAvailability(els.wainscotInput.value),
    deductLength: numberInputValue(els.deductLengthInput),
    deductArea: numberInputValue(els.deductAreaInput),
    price,
    amount: price * value,
    memo: existing?.memo || "",
    hardwareManual: true,
    hardwareItemId: item.id,
    hardwareTakeoffKind: kind
  };
  if (existing) records[index] = record;
  else records.push(record);
  return record;
}

function syncHardwareTakeoffRecords(item, options = {}) {
  if (!item) return;
  upsertHardwareTakeoffRecord(item, "count", options);
  upsertHardwareTakeoffRecord(item, "length", options);
}

function updateHardwareTakeoff(item, options = {}) {
  syncHardwareTakeoffRecords(item, options);
  selectedId = "";
  overwriteSelectedRecord = false;
  saveQuietly();
  renderRecords();
  drawOverlay();
}

function changeHardwareCount(itemId, delta) {
  const current = hardwareFinishItemById(itemId);
  if (!current) return;
  const item = updateHardwareFinishItem(itemId, { count: current.count + signedNumber(delta) });
  updateHardwareTakeoff(item);
  setHint(`「${item.name || "金物"}」の個数を ${hardwareCountText(item.count)} にしました。`);
}

function startHardwareLengthTrace(itemId) {
  const item = hardwareFinishItemById(itemId);
  if (!item) return;
  if (!scale) {
    setHint("先に縮尺を設定してください。");
    return;
  }
  activeHardwareLengthItemId = itemId;
  tool = "line";
  document.querySelectorAll(".tool-button").forEach((button) => {
    button.classList.toggle("active", button.dataset.tool === tool);
  });
  tempPoints = [];
  mode = "hardwareLength";
  updateModeButtons();
  drawOverlay();
  setHint(`「${item.name || "金物"}」の長さを測ります。図面上の始点と終点をクリックしてください。`);
}

function finishHardwareLengthTrace(points) {
  const item = hardwareFinishItemById(activeHardwareLengthItemId);
  if (!item || !scale) {
    activeHardwareLengthItemId = "";
    mode = "draw";
    tempPoints = [];
    updateModeButtons();
    drawOverlay();
    return;
  }
  const lengthM = polygonLength(points, false) / (scale.pxPerMeter || 1);
  if (!Number.isFinite(lengthM) || lengthM <= 0) return;
  const next = updateHardwareFinishItem(item.id, { lengthM: item.lengthM + lengthM });
  activeHardwareLengthItemId = "";
  mode = "draw";
  tempPoints = [];
  updateModeButtons();
  updateHardwareTakeoff(next, { points });
  setHint(`「${next.name || "金物"}」に ${numberText(lengthM)}m を追加しました。合計 ${hardwareLengthText(next.lengthM)} です。`);
}

function removeHardwareFinishItem(itemId) {
  const row = hardwareFinishRowElement(itemId);
  if (!row) return;
  records = records.filter((record) => record.hardwareItemId !== itemId);
  if (activeHardwareLengthItemId === itemId) {
    activeHardwareLengthItemId = "";
    mode = "draw";
    tempPoints = [];
  }
  row.remove();
  if (!els.hardwareFinishRows?.children.length) addHardwareFinishRow();
  selectedId = "";
  overwriteSelectedRecord = false;
  updateModeButtons();
  saveQuietly();
  renderRecords();
  drawOverlay();
}

function resetHardwareTakeoffForRecord(record) {
  if (!record?.hardwareItemId) return;
  const item = hardwareFinishItemById(record.hardwareItemId);
  if (!item) return;
  updateHardwareFinishItem(item.id, record.hardwareTakeoffKind === "count" ? { count: 0 } : { lengthM: 0 });
}

function resetAllHardwareTakeoffs() {
  currentHardwareFinishSchedule().forEach((item) => {
    updateHardwareFinishItem(item.id, { count: 0, lengthM: 0 });
  });
}

function handleCanvasClick(event) {
  const point = pointFromEvent(event);
  const existing = nearestRecord(point);
  if (existing && tempPoints.length === 0 && mode === "draw") {
    selectedId = existing.id;
    overwriteSelectedRecord = true;
    renderRecords();
    drawOverlay();
    setHint("選択した拾い明細をなぞり直して、拾い明細に反映すると上書きできます。");
    return;
  }

  if (mode === "calibrate") {
    tempPoints.push(point);
    if (tempPoints.length === 2) finishCalibration();
    else drawOverlay();
    return;
  }

  if (mode === "scaleCheck") {
    tempPoints.push(point);
    if (tempPoints.length === 2) finishScaleCheck();
    else drawOverlay();
    return;
  }

  if (isHardwareLengthTraceMode()) {
    tempPoints.push(point);
    if (tempPoints.length === 2) finishHardwareLengthTrace(tempPoints);
    else drawOverlay();
    return;
  }

  if (isDeductionTraceMode()) {
    tempPoints.push(point);
    if (mode === "deductLength" && tempPoints.length === 2) {
      finishDeductionTrace(tempPoints, "line");
      return;
    }
    if (mode === "deductArea" && tool === "rect" && tempPoints.length === 2) {
      const [a, b] = tempPoints;
      finishDeductionTrace([
        { x: a.x, y: a.y },
        { x: b.x, y: a.y },
        { x: b.x, y: b.y },
        { x: a.x, y: b.y }
      ], "rect");
      return;
    }
    drawOverlay();
    return;
  }

  if (tool === "count") {
    tempPoints = [point];
    drawOverlay();
    return;
  }

  if (["line", "rect"].includes(tool) && tempPoints.length >= 2) {
    setHint("拾い明細に反映するか、「戻す」で形を描き直してください。");
    return;
  }
  tempPoints.push(point);
  drawOverlay();
}

function pendingTakeoff() {
  if (tool === "count" && tempPoints.length === 1) return { points: tempPoints, shape: "count" };
  if (tool === "line" && tempPoints.length === 2) return { points: tempPoints, shape: "line" };
  if (tool === "rect" && tempPoints.length === 2) {
    const [a, b] = tempPoints;
    return {
      points: [
        { x: a.x, y: a.y },
        { x: b.x, y: a.y },
        { x: b.x, y: b.y },
        { x: a.x, y: b.y }
      ],
      shape: "rect"
    };
  }
  if (tool === "poly" && tempPoints.length >= 3) return { points: tempPoints, shape: "poly" };
  return null;
}

function applyTakeoffToDetails() {
  if (isHardwareLengthTraceMode()) {
    setHint("金物の長さは、図面上の始点と終点をクリックして測ります。");
    return;
  }
  if (mode === "deductArea") {
    if (tempPoints.length < 3) {
      setHint("建具面積控除は3点以上、または矩形の2点でなぞってください。");
      return;
    }
    finishDeductionTrace(tempPoints, "poly");
    return;
  }
  const pending = pendingTakeoff();
  if (!pending) {
    setHint("図面上をなぞってから、拾い明細に反映してください。");
    return;
  }
  createRecord(pending.points, pending.shape);
}

function renderRecords() {
  els.recordsBody.innerHTML = "";
  records.forEach((record) => {
    const tr = document.createElement("tr");
    tr.className = record.id === selectedId ? "selected" : "";
    const tradeName = openingTradeName(record.estimateTrade) || classifyOpeningTrade(record, drawingFileName);
    tr.innerHTML = `
      <td>${escapeHtml(record.floor)}</td>
      <td>${escapeHtml(record.room)}</td>
      <td>${escapeHtml(record.part)}</td>
      <td>${escapeHtml(record.material)}</td>
      <td>${escapeHtml(record.substrateSummary || "")}</td>
      <td>${escapeHtml(tradeName)}</td>
      <td>${escapeHtml(trimAvailabilityLabel(record.baseboard))}</td>
      <td>${escapeHtml(trimAvailabilityLabel(record.ceilingTrim))}</td>
      <td>${escapeHtml(wainscotAvailabilityLabel(record.wainscot))}</td>
      <td>${escapeHtml(record.expression)}</td>
      <td class="num">${numberText(record.quantity)}</td>
      <td>${escapeHtml(record.unit)}</td>
      <td class="num">${money(record.price)}</td>
      <td class="num">${money(record.amount)}</td>
      <td>${escapeHtml(record.memo)}</td>
    `;
    tr.addEventListener("click", () => {
      selectedId = record.id;
      overwriteSelectedRecord = true;
      currentPage = record.page;
      renderDrawing();
      renderRecords();
      setHint("選択した拾い明細をなぞり直して、拾い明細に反映すると上書きできます。");
    });
    els.recordsBody.appendChild(tr);
  });
  renderSummary();
}

function renderSummary() {
  const amount = records.reduce((sum, record) => sum + record.amount, 0);
  const quantity = records.reduce((sum, record) => sum + record.quantity, 0);
  if (els.recordCountView) els.recordCountView.textContent = String(records.length);
  if (els.quantityTotalView) els.quantityTotalView.textContent = numberText(quantity);
  if (els.amountTotalView) els.amountTotalView.textContent = money(amount);

  renderTradeSheets();
  renderOpeningSummary();
}

function materialTradeName(record) {
  return openingTradeName(record.estimateTrade) || classifyOpeningTrade(record, drawingFileName) || String(record.estimateTrade || "").trim() || "未分類";
}

function materialTradeSortValue(trade) {
  const index = openingTrades.findIndex((item) => item.name === trade);
  return index >= 0 ? index : openingTrades.length;
}

function materialSheetGroups() {
  const groups = new Map();
  records.filter((record) => record.recordType !== "deduction").forEach((record) => {
    const trade = materialTradeName(record);
    const material = recordMaterialLabel(record) || "未設定";
    const unit = record.unit || "";
    const key = `${trade}__${material}__${unit}`;
    const group = groups.get(key) || { key, trade, material, unit, quantity: 0, amount: 0, records: [] };
    group.quantity += finiteNumber(record.quantity);
    group.amount += finiteNumber(record.amount);
    group.records.push(record);
    groups.set(key, group);
  });
  return Array.from(groups.values()).sort((a, b) => (
    materialTradeSortValue(a.trade) - materialTradeSortValue(b.trade) ||
    a.trade.localeCompare(b.trade, "ja") ||
    a.material.localeCompare(b.material, "ja")
  ));
}

function materialGroupInitialSummary(group) {
  const saved = group.records.map((record) => String(record.estimateSummary || "").trim()).find(Boolean);
  if (saved) return saved;
  return Array.from(new Set(group.records
    .map((record) => [record.floor, record.room].filter(Boolean).join(" "))
    .filter(Boolean)))
    .join(" / ");
}

function materialGroupInitialRemarks(group) {
  return group.records.map((record) => String(record.estimateRemarks || record.memo || "").trim()).find(Boolean) || "";
}

function materialGroupUnitPrice(group) {
  const saved = group.records.map((record) => finiteNumber(record.price)).find((value) => value > 0);
  return saved || (group.quantity > 0 ? group.amount / group.quantity : 0);
}

function updateMaterialSheetGroup(group, values = {}) {
  const enteredAmount = values.amount === undefined ? null : Math.max(0, finiteNumber(values.amount));
  const unitPrice = values.unitPrice === undefined
    ? null
    : Math.max(0, finiteNumber(values.unitPrice));
  const nextPrice = enteredAmount !== null
    ? (group.quantity > 0 ? enteredAmount / group.quantity : 0)
    : unitPrice;

  group.records.forEach((record) => {
    if (values.summary !== undefined) record.estimateSummary = String(values.summary || "").trim();
    if (values.remarks !== undefined) record.estimateRemarks = String(values.remarks || "").trim();
    if (nextPrice !== null) {
      record.price = nextPrice;
      record.amount = finiteNumber(record.quantity) * nextPrice;
    }
  });
  saveQuietly();
  renderRecords();
}

function renderTradeSheets() {
  if (!els.tradeSheetTabs || !els.tradeSheets) return;
  const groups = materialSheetGroups();
  els.tradeSheetTabs.replaceChildren();
  els.tradeSheets.replaceChildren();
  if (groups.length === 0) {
    const empty = document.createElement("p");
    empty.className = "status";
    empty.textContent = "まだ拾いがありません。";
    els.tradeSheets.appendChild(empty);
    return;
  }

  const trades = Array.from(new Set(groups.map((group) => group.trade)));
  if (!trades.includes(activeTradeSheet)) activeTradeSheet = trades[0];

  trades.forEach((trade, index) => {
    const tabId = `trade-sheet-tab-${index}`;
    const panelId = `trade-sheet-panel-${index}`;
    const tab = document.createElement("button");
    tab.type = "button";
    tab.className = "trade-sheet-tab";
    tab.id = tabId;
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panelId);
    tab.setAttribute("aria-selected", String(trade === activeTradeSheet));
    tab.textContent = trade;
    tab.addEventListener("click", () => {
      activeTradeSheet = trade;
      renderTradeSheets();
    });
    els.tradeSheetTabs.appendChild(tab);

    const panel = document.createElement("section");
    panel.className = "trade-sheet";
    panel.id = panelId;
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tabId);
    panel.hidden = trade !== activeTradeSheet;

    const wrap = document.createElement("div");
    wrap.className = "table-wrap";
    const table = document.createElement("table");
    table.className = "trade-sheet-table";
    table.innerHTML = `
      <thead>
        <tr>
          <th>部材</th>
          <th>概要</th>
          <th>数量</th>
          <th>単位</th>
          <th>単価</th>
          <th>金額</th>
          <th>備考</th>
        </tr>
      </thead>
    `;
    const body = document.createElement("tbody");

    groups.filter((group) => group.trade === trade).forEach((group) => {
      const row = document.createElement("tr");
      const material = document.createElement("td");
      material.textContent = group.material;
      const summary = document.createElement("td");
      const summaryInput = document.createElement("input");
      summaryInput.type = "text";
      summaryInput.value = materialGroupInitialSummary(group);
      summaryInput.setAttribute("aria-label", `${group.material}の概要`);
      summaryInput.addEventListener("change", () => updateMaterialSheetGroup(group, { summary: summaryInput.value }));
      summary.appendChild(summaryInput);
      const quantity = document.createElement("td");
      quantity.className = "num";
      quantity.textContent = numberText(group.quantity);
      const unit = document.createElement("td");
      unit.textContent = group.unit;
      const price = document.createElement("td");
      const priceInput = document.createElement("input");
      priceInput.type = "number";
      priceInput.min = "0";
      priceInput.step = "0.01";
      priceInput.value = String(materialGroupUnitPrice(group));
      priceInput.setAttribute("aria-label", `${group.material}の単価`);
      priceInput.addEventListener("change", () => updateMaterialSheetGroup(group, { unitPrice: priceInput.value }));
      price.appendChild(priceInput);
      const amount = document.createElement("td");
      const amountInput = document.createElement("input");
      amountInput.type = "number";
      amountInput.min = "0";
      amountInput.step = "1";
      amountInput.value = String(Math.round(group.amount));
      amountInput.setAttribute("aria-label", `${group.material}の金額`);
      amountInput.addEventListener("change", () => updateMaterialSheetGroup(group, { amount: amountInput.value }));
      amount.appendChild(amountInput);
      const remarks = document.createElement("td");
      const remarksInput = document.createElement("input");
      remarksInput.type = "text";
      remarksInput.value = materialGroupInitialRemarks(group);
      remarksInput.setAttribute("aria-label", `${group.material}の備考`);
      remarksInput.addEventListener("change", () => updateMaterialSheetGroup(group, { remarks: remarksInput.value }));
      remarks.appendChild(remarksInput);
      row.append(material, summary, quantity, unit, price, amount, remarks);
      body.appendChild(row);
    });
    table.appendChild(body);
    wrap.appendChild(table);
    panel.appendChild(wrap);
    els.tradeSheets.appendChild(panel);
  });
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

async function loadDrawing(file, options = {}) {
  const { keepRecords = false, initialPage = 1 } = options;
  const previousFileName = drawingFileName;
  const isSameDrawing = previousFileName === file.name;
  if (!keepRecords && previousFileName && !isSameDrawing) {
    records = [];
    selectedId = "";
    scale = null;
    updateScaleStatus();
    renderRecords();
  }
  drawingFileName = file.name;
  els.drawingName.textContent = file.name;
  currentPage = initialPage;
  selectedId = "";
  tempPoints = [];
  scaleCheckResult = null;
  const ext = fileExtension(file);
  if (file.type === "application/pdf" || ext === "pdf") {
    const data = await file.arrayBuffer();
    pdfDoc = await pdfjsLib.getDocument({ data }).promise;
    pageCount = pdfDoc.numPages;
    currentPage = Math.max(1, Math.min(currentPage, pageCount));
    imageBitmapSource = null;
    drawingKind = "pdf";
    els.pdfControls.hidden = false;
    collectMaterialSuggestionsFromPdf(pdfDoc, file.name).catch(console.warn);
  } else if (file.type.startsWith("image/") || ["png", "jpg", "jpeg", "webp", "gif", "bmp"].includes(ext)) {
    const image = new Image();
    image.src = URL.createObjectURL(file);
    await image.decode();
    imageBitmapSource = image;
    pdfDoc = null;
    pageCount = 1;
    currentPage = 1;
    drawingKind = "image";
    els.pdfControls.hidden = true;
  } else {
    throw new Error("PDF、画像、保存JSONを読み込めます。対応していないファイル形式です。");
  }
  setHint("図面を読み込みました。最初に縮尺を2点で設定してください。");
  await renderDrawing();
  saveQuietly();
}

async function fetchDrawingFile(entry) {
  if (!entry.url) throw new Error("図面PDFの場所が見つかりません。");
  const response = await fetch(entry.url);
  if (!response.ok) throw new Error(`図面PDFを読み込めませんでした: ${entry.name}`);
  const blob = await response.blob();
  return new File([blob], entry.name || "drawing.pdf", {
    type: blob.type || "application/pdf",
    lastModified: Date.now()
  });
}

function readFileAsDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => resolve(reader.result));
    reader.addEventListener("error", () => reject(reader.error || new Error("ファイルを引継ぎ用に変換できませんでした。")));
    reader.readAsDataURL(file);
  });
}

async function drawingFileForTransfer(entry) {
  if (entry.file instanceof Blob) return entry.file;
  if (!entry.url) return null;
  try {
    return await fetchDrawingFile(entry);
  } catch (error) {
    console.warn(error);
    return null;
  }
}

async function serializeDrawingEntryForTransfer(entry, index, total) {
  const serialized = serializeDrawingEntry(entry);
  const file = await drawingFileForTransfer(entry);
  if (!file) return serialized;
  setHint(`家PC用の引継ぎファイルを作成中です。図面 ${index + 1} / ${total}`);
  return {
    ...serialized,
    fileData: {
      name: file.name || entry.name || "drawing.pdf",
      type: file.type || "application/octet-stream",
      lastModified: file.lastModified || Date.now(),
      dataUrl: await readFileAsDataUrl(file)
    }
  };
}

async function captureTransferState() {
  saveActiveEntryState();
  const state = {
    transferVersion: 1,
    exportedAt: new Date().toISOString(),
    ...serializableAppState(captureAppState())
  };
  const total = drawingEntries.length;
  state.drawings = [];
  for (const [index, entry] of drawingEntries.entries()) {
    state.drawings.push(await serializeDrawingEntryForTransfer(entry, index, total));
  }
  return state;
}

function transferFileName(state) {
  const base = cleanProjectName(state.projectName || els.projectNameInput?.value || "drawing-takeoff")
    .replace(/[\\/:*?"<>|]+/g, "_")
    .slice(0, 80) || "drawing-takeoff";
  return `${base}_引継ぎ.json`;
}

async function fileFromTransferData(fileData, fallbackName) {
  if (!fileData?.dataUrl) return null;
  const response = await fetch(fileData.dataUrl);
  const blob = await response.blob();
  return new File([blob], fileData.name || fallbackName || "drawing.pdf", {
    type: fileData.type || blob.type || "application/octet-stream",
    lastModified: Number(fileData.lastModified) || Date.now()
  });
}

async function hydrateTransferFiles(data = {}) {
  if (!Array.isArray(data.drawings)) return data;
  const drawings = await Promise.all(data.drawings.map(async (entry) => {
    if (!entry?.fileData?.dataUrl) return entry;
    const file = await fileFromTransferData(entry.fileData, entry.name);
    if (!file) return entry;
    return {
      ...entry,
      file,
      name: entry.name || file.name,
      key: entry.key || fileKey(file)
    };
  }));
  return { ...data, drawings };
}

function saveQuietly() {
  const payload = captureAppState();
  localStorage.setItem(storageKey, JSON.stringify(payload));
  if (!isApplyingProject) saveCurrentProjectState(payload);
  renderDrawingList();
}

function loadSaved() {
  const savedBook = loadProjectBookFromStorage();
  if (savedBook) {
    projectBook = savedBook;
    isApplyingProject = true;
    applyAppState(currentProject()?.state || {});
    isApplyingProject = false;
    renderProjectControls();
    return;
  }

  let legacyState = null;
  const raw = localStorage.getItem(storageKey);
  if (raw) {
    try {
      legacyState = JSON.parse(raw);
    } catch {
      localStorage.removeItem(storageKey);
    }
  }

  const firstProject = createProject(deriveProjectNameFromState(legacyState, "現場1"), legacyState || {});
  projectBook = { activeId: firstProject.id, projects: [firstProject] };
  isApplyingProject = true;
  applyAppState(firstProject.state);
  isApplyingProject = false;
  renderProjectControls();
  saveProjectBookQuietly();
}

function download(name, content, type) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

function exportJson() {
  const data = {
    exportedAt: new Date().toISOString(),
    ...serializableAppState(captureAppState())
  };
  download("drawing-takeoff.json", JSON.stringify(data, null, 2), "application/json");
}

async function exportTransferJson() {
  const button = els.exportTransferButton;
  const originalLabel = button?.textContent || "引継ぎ";
  if (button) {
    button.disabled = true;
    button.textContent = "作成中";
  }
  try {
    saveCurrentProjectState();
    setHint("家PC用の引継ぎファイルを作成中です。");
    const data = await captureTransferState();
    const embeddedCount = data.drawings.filter((entry) => entry.fileData?.dataUrl).length;
    download(transferFileName(data), JSON.stringify(data), "application/json");
    setHint(`引継ぎファイルを作成しました。家PCではこのJSONを「読込」してください。図面 ${embeddedCount} 件を同梱しました。`);
  } finally {
    if (button) {
      button.disabled = false;
      button.textContent = originalLabel;
    }
  }
}

function exportCsv() {
  const headers = ["階数", "部屋・範囲", "部位", "部材", "下地", "壁種", "壁下地", "天井下地", "工種", "巾木", "廻り縁", "腰壁", "式", "数量", "単位", "単価", "金額", "概要", "備考", "高さm", "周長m", "面積m2", "控除長さm", "控除面積m2"];
  const rows = records.map((record) => [
    record.floor,
    record.room,
    record.part,
    record.material,
    record.substrateSummary || "",
    record.wallTypeLabel || "",
    record.wallSubstrate || "",
    record.ceilingSubstrate || "",
    openingTradeName(record.estimateTrade) || classifyOpeningTrade(record, drawingFileName),
    trimAvailabilityLabel(record.baseboard),
    trimAvailabilityLabel(record.ceilingTrim),
    wainscotAvailabilityLabel(record.wainscot),
    record.expression,
    record.quantity,
    record.unit,
    record.price,
    record.amount,
    record.estimateSummary || "",
    record.estimateRemarks || record.memo,
    record.height,
    record.perimeterM,
    record.areaM2,
    record.deductLength,
    record.deductArea
  ]);
  const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
  download("drawing-takeoff.csv", `\uFEFF${csv}`, "text/csv;charset=utf-8");
}

function exportOpeningEstimateList() {
  const items = buildOpeningEstimateItems();
  if (items.length === 0) {
    setHint("建具拾いに出力できる明細がありません。木建具または金属製建具を選んで拾ってください。");
    return;
  }
  const lines = items.map((item) => [
    "工種取込",
    item.trade,
    item.name,
    item.summary,
    numberText(item.qty),
    item.unit,
    Math.round(item.price),
    item.remarks
  ].map(tsvCell).join("\t"));
  download("建具拾いリスト.tsv", `\uFEFF${lines.join("\n")}`, "text/tab-separated-values;charset=utf-8");
  setHint("建具拾いリストを出力しました。見積りアプリへ取り込めます。");
}

function exportOpeningCheckCsv() {
  const items = buildOpeningEstimateItems();
  if (items.length === 0) {
    setHint("確認CSVに出力できる建具リストがありません。");
    return;
  }
  const headers = ["工種", "名称", "概要", "数量", "単位", "単価", "金額", "備考", "元図面"];
  openingTrades.forEach((trade) => {
    const group = items.filter((item) => item.trade === trade.name);
    if (group.length === 0) return;
    const rows = group.map((item) => [
      item.trade,
      item.name,
      item.summary,
      item.qty,
      item.unit,
      item.price,
      item.amount,
      item.remarks,
      item.drawingName
    ]);
    const csv = [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\n");
    download(`${trade.name}_建具拾い.csv`, `\uFEFF${csv}`, "text/csv;charset=utf-8");
  });
  setHint("建具拾いを工種別CSVで出力しました。");
}

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function tsvCell(value) {
  return String(value ?? "").replace(/[\t\r\n]+/g, " ").trim();
}

function cloneRecords(sourceRecords) {
  return sourceRecords.map((record) => ({
    ...record,
    points: record.points.map((point) => ({ ...point }))
  }));
}

function fileKey(file) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

function normalizedFileName(file) {
  return String(file?.name || "").normalize("NFKC").trim();
}

function fileExtension(file) {
  const name = normalizedFileName(file).toLowerCase();
  const match = name.match(/\.([a-z0-9]+)$/);
  return match ? match[1] : "";
}

function isSupportedDrawingExtension(ext) {
  return ["pdf", "png", "jpg", "jpeg", "webp", "gif", "bmp"].includes(ext);
}

function isSupportedSavedEntry(entry) {
  if (entry.file) return isSupportedDrawingExtension(fileExtension(entry.file));
  if (entry.url) return isSupportedDrawingExtension(fileExtension({ name: entry.url }));
  return isSupportedDrawingExtension(fileExtension({ name: entry.name }));
}

function isUsefulSavedEntry(entry) {
  if (entry.file) return true;
  if (entry.url) return true;
  return Array.isArray(entry.records) && entry.records.length > 0;
}

function normalizeDrawingText(value) {
  return String(value || "").normalize("NFKC").toUpperCase();
}

function detectDrawingNumberFromText(value) {
  const text = normalizeDrawingText(value);
  const strong = text.match(/(?:^|[^A-Z0-9])([A-Z]{1,4}[-_ ]?\d{1,4}(?:[-_]\d{1,3})?)(?:[^A-Z0-9]|$)/);
  if (strong) return strong[1].replace(/[_ ]/g, "-");
  const labeled = text.match(/(?:図面番号|図番|NO\.?|SHEET)\s*[:：#-]?\s*([A-Z]?\d{1,4}(?:[-_]\d{1,3})?)/);
  if (labeled) return labeled[1].replace(/[_ ]/g, "-");
  const plain = text.match(/(?:^|[^\d])(\d{1,4})(?:[^\d]|$)/);
  return plain ? plain[1] : "";
}

function detectDrawingNumber(entry) {
  if (entry.drawingNumber) return entry.drawingNumber;
  const candidates = [entry.name, entry.title, entry.sourcePath, entry.url];
  for (const candidate of candidates) {
    const drawingNumber = detectDrawingNumberFromText(candidate);
    if (drawingNumber) return drawingNumber;
  }
  return "";
}

function drawingNumberParts(value) {
  const normalized = normalizeDrawingText(value).replace(/[_ ]/g, "-");
  const prefix = normalized.match(/^[A-Z]+/)?.[0] || "";
  const nums = Array.from(normalized.matchAll(/\d+/g)).map((match) => Number(match[0]));
  return { prefix, nums, text: normalized };
}

function compareDrawingEntries(a, b) {
  const aNumber = detectDrawingNumber(a);
  const bNumber = detectDrawingNumber(b);
  if (aNumber && bNumber) {
    const aParts = drawingNumberParts(aNumber);
    const bParts = drawingNumberParts(bNumber);
    const prefixCompare = aParts.prefix.localeCompare(bParts.prefix, "ja", { numeric: true });
    if (prefixCompare !== 0) return prefixCompare;
    const length = Math.max(aParts.nums.length, bParts.nums.length);
    for (let index = 0; index < length; index += 1) {
      const diff = (aParts.nums[index] || 0) - (bParts.nums[index] || 0);
      if (diff !== 0) return diff;
    }
    return aParts.text.localeCompare(bParts.text, "ja", { numeric: true });
  }
  if (aNumber) return -1;
  if (bNumber) return 1;
  return String(a.name || "").localeCompare(String(b.name || ""), "ja", { numeric: true }) ||
    (a.order || 0) - (b.order || 0);
}

function sortDrawingEntries() {
  drawingEntries.forEach((entry, index) => {
    if (entry.order === undefined) entry.order = index;
    entry.drawingNumber = detectDrawingNumber(entry);
  });
  drawingEntries.sort(compareDrawingEntries);
}

function saveActiveEntryState() {
  const entry = drawingEntries.find((candidate) => candidate.id === activeDrawingId);
  if (!entry) return;
  entry.records = cloneRecords(records);
  entry.scale = scale ? { ...scale } : null;
  entry.currentPage = currentPage;
}

function hasConfiguredScale(entry) {
  return Number(entry?.scale?.pxPerMeter || 0) > 0;
}

function drawingListBadges(entry, isOpeningDrawing) {
  const badges = [];
  if (isOpeningDrawing) badges.push({ className: "opening-badge", label: "建具" });
  if (hasConfiguredScale(entry)) badges.push({ className: "scale-badge", label: "縮尺設定済" });
  return badges;
}

function renderDrawingList() {
  sortDrawingEntries();
  els.drawingList.innerHTML = "";
  els.drawingList.hidden = drawingEntries.length === 0;
  drawingEntries.forEach((entry) => {
    const drawingNumber = detectDrawingNumber(entry);
    const isOpeningDrawing = openingDrawingScore(entry) > 30;
    const button = document.createElement("button");
    button.type = "button";
    button.className = [
      entry.id === activeDrawingId ? "active" : "",
      entry.error ? "has-error" : "",
      isOpeningDrawing ? "opening-candidate" : "",
      hasConfiguredScale(entry) ? "scale-configured" : ""
    ].filter(Boolean).join(" ");
    button.title = entry.name;
    const badges = drawingListBadges(entry, isOpeningDrawing);
    const status = entry.error
      ? '<span class="drawing-badge error-badge">失敗</span>'
      : badges.length
        ? badges.map((badge) => `<span class="drawing-badge ${badge.className}">${badge.label}</span>`).join("")
        : `<span class="drawing-count">${escapeHtml(drawingNumber || String((entry.records || []).length))}</span>`;
    button.innerHTML = `
      <span class="drawing-name">${escapeHtml(entry.name)}</span>
      <span class="drawing-badges">${status}</span>
    `;
    button.addEventListener("click", () => {
      loadDrawingEntry(entry).catch(handleFileLoadError);
    });
    els.drawingList.appendChild(button);
  });
  updateDrawingActionState();
}

function addDrawingFiles(files) {
  const drawingFiles = files.filter(isDrawingFile);
  if (drawingFiles.length === 0) return false;
  saveActiveEntryState();

  const entriesByKey = new Map(drawingEntries.map((entry) => [entry.key, entry]));
  const addedEntries = drawingFiles.map((file) => {
    const key = fileKey(file);
    const existing = entriesByKey.get(key);
    if (existing) {
      existing.file = file;
      return existing;
    }
    const entry = {
      id: `d-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      key,
      name: file.name,
      file,
      records: [],
      scale: null,
      currentPage: 1,
      order: drawingEntries.length
    };
    drawingEntries.push(entry);
    entriesByKey.set(key, entry);
    return entry;
  });

  renderDrawingList();
  loadFirstReadableEntry(addedEntries);
  if (drawingFiles.length > 1) {
    setHint(`${drawingFiles.length}件の図面を追加しました。一覧から切り替えできます。`);
  }
  return true;
}

async function importProjectManifest(data) {
  const drawings = Array.isArray(data?.drawings) ? data.drawings : [];
  if (drawings.length === 0) return false;
  if (data.projectName) renameCurrentProject(data.projectName, { persist: false });
  mergeProjectManifestSuggestions(data, { persist: false });
  saveActiveEntryState();

  const entriesByKey = new Map(drawingEntries.map((entry) => [entry.key, entry]));
  const importedEntries = drawings.map((drawing, index) => {
    const name = drawing.name || [drawing.drawingNumber, drawing.title].filter(Boolean).join(" ") || `drawing-${index + 1}.pdf`;
    const key = `manifest:${drawing.url || drawing.sourcePath || name}`;
    const order = Number.isFinite(Number(drawing.order)) ? Number(drawing.order) : index;
    const existing = entriesByKey.get(key);
    const values = {
      key,
      name,
      title: drawing.title || "",
      category: drawing.category || "",
      takeoffRole: drawing.takeoffRole || "",
      takeoffPriority: Number(drawing.takeoffPriority || 0),
      textSample: drawing.textSample || "",
      url: drawing.url || "",
      sourcePath: drawing.sourcePath || "",
      drawingNumber: drawing.drawingNumber || "",
      currentPage: 1,
      order
    };
    if (existing) {
      Object.assign(existing, values);
      return existing;
    }
    const entry = {
      id: `manifest-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      ...values,
      file: null,
      records: [],
      scale: null
    };
    drawingEntries.push(entry);
    entriesByKey.set(key, entry);
    return entry;
  });

  refreshRoomSuggestions();
  refreshMaterialSuggestions();
  renderDrawingList();
  await loadFirstReadableEntry(importedEntries);
  setHint(`${drawings.length}件の整理済み図面を取り込みました。一覧から図面番号順に切り替えできます。`);
  saveQuietly();
  return true;
}

async function importProjectManifestUrl(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("整理済み図面リストを読み込めませんでした。");
  return importProjectManifest(await response.json());
}

function mergeProjectManifestMaterialSuggestions(data, options = {}) {
  const values = Array.isArray(data?.materialSuggestions) ? [...data.materialSuggestions] : [];
  const drawings = Array.isArray(data?.drawings) ? data.drawings : [];
  drawings.forEach((drawing) => {
    [
      drawing.name,
      drawing.title,
      drawing.category,
      drawing.takeoffRole,
      drawing.sourcePath,
      drawing.textSample
    ].forEach((text) => {
      values.push(...extractMaterialCandidatesFromText(text));
    });
  });
  return addMaterialSuggestions(values, options);
}

function mergeProjectManifestRoomSuggestions(data, options = {}) {
  const values = Array.isArray(data?.roomSuggestions) ? [...data.roomSuggestions] : [];
  const drawings = Array.isArray(data?.drawings) ? data.drawings : [];
  drawings.forEach((drawing) => {
    const source = [drawing.drawingNumber, drawing.title || drawing.name].filter(Boolean).join(" ");
    const floor = inferFloorLabelFromText(`${source} ${drawing.sourcePath || ""}`);
    [
      drawing.name,
      drawing.title,
      drawing.category,
      drawing.takeoffRole,
      drawing.sourcePath,
      drawing.textSample
    ].forEach((text) => {
      values.push(...extractRoomSuggestionsFromText(text, { floor, source }));
    });
  });
  return addRoomSuggestions(values, options);
}

function mergeProjectManifestSuggestions(data, options = {}) {
  const roomChanged = mergeProjectManifestRoomSuggestions(data, options);
  const materialChanged = mergeProjectManifestMaterialSuggestions(data, options);
  return roomChanged || materialChanged;
}

async function mergeProjectManifestSuggestionsUrl(url) {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) throw new Error("整理済み図面リストを読み込めませんでした。");
  const changed = mergeProjectManifestSuggestions(await response.json(), { persist: false });
  if (changed) saveQuietly();
  return changed;
}

function replaceProjectStateBeforeImport() {
  const previous = currentProject()?.state;
  if (previous && stateHasWork(previous)) {
    try {
      localStorage.setItem(`${storageKey}-backup-${Date.now()}`, JSON.stringify(serializableAppState(previous)));
    } catch {
      // Large imported data can exceed the browser storage quota.
    }
  }
  pdfDoc = null;
  imageBitmapSource = null;
  drawingKind = "";
  drawingFileName = "";
  currentPage = 1;
  pageCount = 1;
  records = [];
  selectedId = "";
  scale = null;
  drawingEntries = [];
  activeDrawingId = "";
  roomSettings = [];
  roomSuggestions = [];
  materialSuggestions = [];
  finishTables = [];
  activeFinishTableLocation = null;
  activeFinishTab = "internal";
  applyFinishSchedule({});
  applyExternalFinishSchedule({});
  setActiveFinishTab("internal", { persist: false });
  renderRegisteredRoomSelect();
  tempPoints = [];
  scaleCheckResult = null;
  updateRoomStatus();
  renderMaterialDatalist();
}

async function loadProjectFromQuery() {
  const params = new URLSearchParams(window.location.search);
  const projectUrl = params.get("project");
  if (!projectUrl) return;
  try {
    const shouldReplace = params.get("replace") === "1";
    const currentState = captureAppState();
    if (shouldReplace && stateHasWork(currentState)) {
      const suggestionsUpdated = await mergeProjectManifestSuggestionsUrl(projectUrl);
      setHint(suggestionsUpdated
        ? "図面から読み取った部屋名・部材候補を更新しました。▼から選択や検索ができます。"
        : "整理済み図面は既に現場へ保存されています。新しい現場で取り込む場合は「新規現場」を作ってから読み込んでください。");
      return;
    }
    if (shouldReplace) replaceProjectStateBeforeImport();
    await importProjectManifestUrl(projectUrl);
  } catch (error) {
    handleFileLoadError(error);
  }
}

async function loadFirstReadableEntry(entries) {
  let lastError = null;
  for (const entry of entries) {
    try {
      await loadDrawingEntry(entry);
      return;
    } catch (error) {
      entry.error = error.message || "読込失敗";
      lastError = error;
      renderDrawingList();
    }
  }
  if (lastError) handleFileLoadError(lastError);
}

async function loadDrawingEntry(entry) {
  saveActiveEntryState();
  activeDrawingId = entry.id;
  records = cloneRecords(entry.records || []);
  scale = entry.scale ? { ...entry.scale } : null;
  syncScaleInputsFromScale(scale);
  selectedId = "";
  scaleCheckResult = null;
  currentPage = entry.currentPage || 1;
  updateScaleStatus();
  renderRecords();
  renderDrawingList();
  if (entry.file) {
    await loadDrawing(entry.file, { keepRecords: true, initialPage: currentPage });
  } else if (entry.url) {
    entry.file = await fetchDrawingFile(entry);
    await loadDrawing(entry.file, { keepRecords: true, initialPage: currentPage });
  } else {
    throw new Error("この図面は再読み込みが必要です。元のPDF/画像をもう一度ドロップしてください。");
  }
  entry.error = "";
  renderRecords();
  renderDrawingList();
}

function isJsonFile(file) {
  return file.type === "application/json" || fileExtension(file) === "json";
}

function isDrawingFile(file) {
  const ext = fileExtension(file);
  return file.type === "application/pdf" ||
    file.type.startsWith("image/") ||
    isSupportedDrawingExtension(ext);
}

function handleFileLoadError(error) {
  console.error(error);
  const message = error.message || "図面を読み込めませんでした。";
  setHint(message);
  alert(message);
}

function loadDrawingSafely(file) {
  if (isDrawingFile(file)) {
    addDrawingFiles([file]);
    return Promise.resolve();
  }
  return loadDrawing(file).catch(handleFileLoadError);
}

function handleDroppedFiles(fileList) {
  const files = Array.from(fileList || []);
  const jsonFile = files.find(isJsonFile);
  if (addDrawingFiles(files)) return;
  if (jsonFile) {
    importJson(jsonFile).catch(handleFileLoadError);
    return;
  }
  setHint("PDF、画像、または保存JSONをドロップしてください。");
}

function setupDropTarget(target) {
  if (!target) return;
  let dragDepth = 0;
  target.addEventListener("dragenter", (event) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepth += 1;
    target.classList.add("is-dragging");
  });
  target.addEventListener("dragover", (event) => {
    event.preventDefault();
    event.stopPropagation();
    event.dataTransfer.dropEffect = "copy";
  });
  target.addEventListener("dragleave", (event) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepth = Math.max(0, dragDepth - 1);
    if (dragDepth === 0) target.classList.remove("is-dragging");
  });
  target.addEventListener("drop", (event) => {
    event.preventDefault();
    event.stopPropagation();
    dragDepth = 0;
    target.classList.remove("is-dragging");
    handleDroppedFiles(event.dataTransfer.files);
  });
}

async function importJson(file) {
  const data = JSON.parse(await file.text());
  const isSavedTakeoffProject = Boolean(
    data.exportedAt ||
    data.projectName ||
    data.records ||
    data.roomSettings ||
    (Array.isArray(data.drawings) && data.drawings.some((entry) => Array.isArray(entry.records) || entry.key || entry.scale))
  );
  if (Array.isArray(data.drawings) && !isSavedTakeoffProject) {
    await importProjectManifest(data);
    return;
  }
  const restoredData = await hydrateTransferFiles(data);
  if (restoredData.projectName) renameCurrentProject(restoredData.projectName, { persist: false });
  applyAppState(restoredData);
  await loadActiveProjectDrawing();
  saveQuietly();
}

function deleteSelected() {
  if (!selectedId) return;
  const removed = records.find((record) => record.id === selectedId);
  records = records.filter((record) => record.id !== selectedId);
  applyDeductionRecordDelta(removed, -1);
  resetHardwareTakeoffForRecord(removed);
  selectedId = "";
  overwriteSelectedRecord = false;
  saveQuietly();
  renderRecords();
  drawOverlay();
}

function clampZoom(value) {
  return Math.min(4, Math.max(0.35, value));
}

function captureZoomAnchor(event) {
  if (!event) return null;
  const stageRect = els.stage.getBoundingClientRect();
  return {
    x: (event.clientX - stageRect.left) / Math.max(zoom, 0.001),
    y: (event.clientY - stageRect.top) / Math.max(zoom, 0.001),
    clientX: event.clientX,
    clientY: event.clientY
  };
}

function restoreZoomAnchor(anchor) {
  if (!anchor) return;
  const stageRect = els.stage.getBoundingClientRect();
  const nextClientX = stageRect.left + anchor.x * zoom;
  const nextClientY = stageRect.top + anchor.y * zoom;
  els.stageWrap.scrollLeft += nextClientX - anchor.clientX;
  els.stageWrap.scrollTop += nextClientY - anchor.clientY;
}

function changeZoom(nextZoom, anchorEvent = null) {
  const clampedZoom = clampZoom(nextZoom);
  if (!Number.isFinite(clampedZoom) || Math.abs(clampedZoom - zoom) < 0.001) return;
  const anchor = captureZoomAnchor(anchorEvent);
  zoom = clampedZoom;
  applyCanvasDisplaySize();
  restoreZoomAnchor(anchor);
}

function handleStageWheel(event) {
  if (!event.deltaY) return;
  event.preventDefault();
  const normalizedDelta = event.deltaMode === 1 ? event.deltaY * 16 : event.deltaY;
  const factor = Math.exp(-normalizedDelta * 0.0016);
  changeZoom(zoom * factor, event);
}

document.querySelectorAll(".tool-button").forEach((button) => {
  button.addEventListener("click", () => setTool(button.dataset.tool));
});

els.projectSelect.addEventListener("change", (event) => {
  switchProject(event.target.value).catch(handleFileLoadError);
});
els.projectNameInput.addEventListener("change", () => {
  renameCurrentProject(els.projectNameInput.value);
  saveCurrentProjectState();
  setHint("現場名を保存しました。");
});
els.newProjectButton.addEventListener("click", () => {
  createNewProject().catch(handleFileLoadError);
});
els.duplicateProjectButton.addEventListener("click", () => {
  duplicateCurrentProject().catch(handleFileLoadError);
});
els.deleteProjectButton.addEventListener("click", () => {
  deleteCurrentProject().catch(handleFileLoadError);
});

els.drawingInput.addEventListener("change", (event) => {
  const files = Array.from(event.target.files || []);
  if (files.length) addDrawingFiles(files);
  event.target.value = "";
});

els.importJsonInput.addEventListener("change", (event) => {
  const [file] = event.target.files;
  if (file) importJson(file);
});

document.addEventListener("dragover", (event) => {
  if (event.dataTransfer?.types?.includes("Files")) event.preventDefault();
});
document.addEventListener("drop", (event) => {
  if (event.dataTransfer?.types?.includes("Files")) event.preventDefault();
});
setupDropTarget(els.drawingDrop);
setupDropTarget(els.stageWrap);
setupDropTarget(els.canvasArea);

els.stageWrap.addEventListener("wheel", handleStageWheel, { passive: false });
els.overlayCanvas.addEventListener("click", handleCanvasClick);
els.overlayCanvas.addEventListener("contextmenu", (event) => {
  event.preventDefault();
  applyTakeoffToDetails();
});
els.finishPolyButton.addEventListener("click", applyTakeoffToDetails);
els.calibrateButton.addEventListener("click", () => {
  mode = "calibrate";
  tempPoints = [];
  updateModeButtons();
  setScaleCheckStatus();
  setHint("実寸がわかる寸法線の両端を2点クリックしてください。");
  drawOverlay();
});
els.scaleCheckButton.addEventListener("click", startScaleCheck);
els.scaleUnitInput.addEventListener("change", syncScaleUnitInput);
els.formulaInput.addEventListener("change", () => {
  if (activeFinishTab === "external") setActiveExternalFinish(defaultExternalFinishKey(), { syncFormula: false });
  else setActiveInternalFinish(defaultInternalFinishKey(), { syncFormula: false });
});
document.querySelectorAll("[data-internal-finish-formula]").forEach((input) => {
  const key = input.dataset.internalFinishFormula;
  input.addEventListener("focus", () => setActiveInternalFinish(key));
  input.addEventListener("change", () => {
    syncSharedFinishFormula(key);
    setActiveInternalFinish(key);
    saveQuietly();
  });
});
els.openingTradeInput.addEventListener("change", prepareOpeningInputs);
document.querySelectorAll(".opening-trade-button").forEach((button) => {
  button.addEventListener("click", () => selectOpeningTrade(button.dataset.openingTrade));
});
els.internalFinishTab?.addEventListener("click", () => setActiveFinishTab("internal", { persist: true }));
els.externalFinishTab?.addEventListener("click", () => setActiveFinishTab("external", { persist: true }));
Object.values(finishSummaryInputs()).forEach((input) => {
  input?.addEventListener("input", () => {
    addDirectFinishCandidates({ persist: false });
  });
  input?.addEventListener("change", () => {
    addMaterialSuggestions([input.value, ...extractMaterialCandidatesFromText(input.value)], { persist: false });
    saveQuietly();
  });
});
document.querySelectorAll("[data-internal-finish-key]").forEach((input) => {
  const key = input.dataset.internalFinishKey;
  input.addEventListener("input", () => {
    addDirectFinishCandidates({ persist: false });
  });
  input.addEventListener("change", () => {
    if (["baseboard", "ceilingTrim"].includes(key)) {
      const normalized = trimSettingValue(input.value);
      input.value = displayTrimInputValue(normalized);
      if (!["no", "yes"].includes(normalized)) addMaterialSuggestion(normalized, { persist: false });
    } else {
      addMaterialSuggestion(input.value, { persist: false });
    }
    setActiveInternalFinish(key);
    saveQuietly();
  });
  input.addEventListener("focus", () => setActiveInternalFinish(key));
  input.addEventListener("click", () => setActiveInternalFinish(key));
});
els.externalFinishCategories?.addEventListener("click", (event) => {
  const row = event.target.closest?.("[data-external-finish-row]");
  const category = event.target.closest?.("[data-external-finish-category]");
  if (category) setActiveExternalFinish(category.dataset.externalFinishCategory, { row });
  const addButton = event.target.closest?.("[data-add-external-finish]");
  if (addButton) {
    const row = addExternalFinishRow(addButton.dataset.addExternalFinish);
    row?.querySelector('[data-external-finish-input="finish"]')?.focus();
    addDirectFinishCandidates({ persist: false });
    saveQuietly();
    return;
  }
  const removeButton = event.target.closest?.("[data-remove-external-finish]");
  if (!removeButton) return;
  const row = removeButton.closest("[data-external-finish-row]");
  const container = row?.parentElement;
  row?.remove();
  if (container && !container.children.length) addExternalFinishRow(removeButton.dataset.removeExternalFinish);
  addDirectFinishCandidates({ persist: false });
  saveQuietly();
});
els.externalFinishCategories?.addEventListener("focusin", (event) => {
  const row = event.target.closest?.("[data-external-finish-row]");
  const category = event.target.closest?.("[data-external-finish-category]");
  if (category) setActiveExternalFinish(category.dataset.externalFinishCategory, { row });
});
els.externalFinishCategories?.addEventListener("input", (event) => {
  if (!event.target.matches?.('[data-external-finish-input="finish"], [data-external-finish-input="summary"]')) return;
  addDirectFinishCandidates({ persist: false });
  const row = event.target.closest("[data-external-finish-row]");
  if (event.target.dataset.externalFinishInput === "finish" && !externalFinishMenu(row)?.hidden) {
    renderExternalFinishMenu(row);
  }
});
els.externalFinishCategories?.addEventListener("change", (event) => {
  if (!event.target.matches?.("[data-external-finish-input]")) return;
  const row = event.target.closest("[data-external-finish-row]");
  const category = event.target.closest("[data-external-finish-category]");
  if (event.target.dataset.externalFinishInput === "formula") {
    if (category) setActiveExternalFinish(category.dataset.externalFinishCategory, { row });
    saveQuietly();
    return;
  }
  addMaterialSuggestions([event.target.value, ...extractMaterialCandidatesFromText(event.target.value)], { persist: false });
  saveQuietly();
});
els.addHardwareFinishButton?.addEventListener("click", () => {
  const row = addHardwareFinishRow();
  row?.querySelector('[data-hardware-finish-input="name"]')?.focus();
  saveQuietly();
});
els.hardwareFinishRows?.addEventListener("click", (event) => {
  const row = event.target.closest?.("[data-hardware-finish-row]");
  if (!row) return;
  const itemId = row.dataset.hardwareFinishRow;
  const countButton = event.target.closest?.("[data-hardware-count-delta]");
  if (countButton) {
    changeHardwareCount(itemId, countButton.dataset.hardwareCountDelta);
    return;
  }
  const traceButton = event.target.closest?.("[data-hardware-trace]");
  if (traceButton) {
    startHardwareLengthTrace(traceButton.dataset.hardwareTrace);
    return;
  }
  if (event.target.closest?.("[data-remove-hardware-finish]")) removeHardwareFinishItem(itemId);
});
els.hardwareFinishRows?.addEventListener("change", (event) => {
  if (!event.target.matches?.('[data-hardware-finish-input="name"]')) return;
  const row = event.target.closest("[data-hardware-finish-row]");
  const item = updateHardwareFinishItem(row?.dataset.hardwareFinishRow, { name: event.target.value });
  if (!item) return;
  addMaterialSuggestions([item.name, ...extractMaterialCandidatesFromText(item.name)], { persist: false });
  updateHardwareTakeoff(item);
});
finishPickerConfigs().forEach((picker) => {
  picker.button.addEventListener("click", (event) => {
    event.preventDefault();
    event.stopPropagation();
    if (picker.menu.hidden) {
      openFinishMenu(picker);
      picker.input.focus({ preventScroll: true });
    } else {
      closeFinishMenu(picker);
    }
  });
  picker.input.addEventListener("input", () => {
    if (!picker.menu.hidden) renderFinishMenu(picker);
  });
  picker.input.addEventListener("keydown", (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      openFinishMenu(picker);
    } else if (event.key === "Enter") {
      const first = filteredFinishSuggestions(picker)[0];
      if (first && !picker.menu.hidden) {
        event.preventDefault();
        picker.input.value = first;
        addMaterialSuggestion(first, { persist: false });
        saveQuietly();
        closeFinishMenu(picker);
      }
    }
  });
});
els.wallTypeInput.addEventListener("change", () => {
  syncWallSubstrateDefault();
  saveQuietly();
});
[els.wallSubstrateInput, els.ceilingSubstrateInput].forEach((input) => {
  input.addEventListener("change", () => {
    addMaterialSuggestion(input.value, { persist: false });
    saveQuietly();
  });
});
els.traceDeductLengthButton.addEventListener("click", () => startDeductionTrace("length"));
els.traceDeductAreaButton.addEventListener("click", () => startDeductionTrace("area"));
els.roomMenuButton.addEventListener("click", (event) => {
  event.preventDefault();
  event.stopPropagation();
  toggleRoomMenu({ search: false });
});
els.saveRoomContentButton.addEventListener("click", saveCurrentRoomContent);
els.registeredRoomSelect.addEventListener("change", () => {
  if (els.registeredRoomSelect.value) loadRegisteredRoomContent(els.registeredRoomSelect.value);
});
els.floorInput.addEventListener("input", () => {
  updateRoomStatus();
  roomMenuSearchEnabled = true;
  if (!els.roomMenu.hidden) renderRoomMenu();
});
els.roomInput.addEventListener("input", () => {
  updateRoomStatus();
  roomMenuSearchEnabled = true;
  if (!els.roomMenu.hidden) renderRoomMenu();
});
els.floorInput.addEventListener("change", applyMatchingRoomSetting);
els.roomInput.addEventListener("change", applyMatchingRoomSetting);
els.floorInput.addEventListener("blur", applyMatchingRoomSetting);
els.roomInput.addEventListener("blur", applyMatchingRoomSetting);
[els.heightInput, els.baseboardInput, els.ceilingTrimInput, els.wainscotInput, els.deductLengthInput, els.deductAreaInput].forEach((input) => {
  input.addEventListener("input", () => {
    updateRoomStatus();
    if (!els.roomMenu.hidden) renderRoomMenu();
  });
  input.addEventListener("change", () => {
    if (input === els.baseboardInput || input === els.ceilingTrimInput || input === els.wainscotInput) autoSaveCurrentRoomSetting();
    updateRoomStatus();
    if (!els.roomMenu.hidden) renderRoomMenu();
  });
});
document.addEventListener("click", (event) => {
  if (!event.target.closest?.(".room-field")) closeRoomMenu();
  if (!event.target.closest?.(".material-field")) closeMaterialMenu();
  if (!event.target.closest?.(".finish-choice-field")) closeFinishMenus();
  if (!event.target.closest?.(".external-finish-picker")) closeExternalFinishMenus();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    if (isHardwareLengthTraceMode()) {
      activeHardwareLengthItemId = "";
      tempPoints = [];
      mode = "draw";
      updateModeButtons();
      drawOverlay();
    }
    closeRoomMenu();
    closeMaterialMenu();
    closeFinishMenus();
    closeExternalFinishMenus();
  }
});
els.clearTempButton.addEventListener("click", () => {
  tempPoints = [];
  activeHardwareLengthItemId = "";
  selectedId = "";
  overwriteSelectedRecord = false;
  scaleCheckResult = null;
  mode = "draw";
  updateDeductionTraceButtons();
  renderRecords();
  drawOverlay();
});
els.deleteSelectedButton.addEventListener("click", deleteSelected);
els.removeDrawingButton.addEventListener("click", () => {
  removeActiveDrawing().catch(handleFileLoadError);
});
els.clearAllButton.addEventListener("click", () => {
  if (!confirm("拾い明細をすべて消去しますか？")) return;
  records.forEach((record) => applyDeductionRecordDelta(record, -1));
  records = [];
  resetAllHardwareTakeoffs();
  selectedId = "";
  saveQuietly();
  renderRecords();
  drawOverlay();
});
els.saveProjectButton.addEventListener("click", () => {
  saveQuietly();
  setHint("このブラウザに保存しました。JSON出力で別ファイルにも保存できます。");
});
els.exportJsonButton.addEventListener("click", exportJson);
els.exportTransferButton.addEventListener("click", () => {
  exportTransferJson().catch(handleFileLoadError);
});
els.exportCsvButton.addEventListener("click", exportCsv);
els.findOpeningDrawingsButton.addEventListener("click", () => {
  findAndLoadOpeningDrawing().catch(handleFileLoadError);
});
els.exportOpeningListButton.addEventListener("click", exportOpeningEstimateList);
els.exportOpeningCheckCsvButton.addEventListener("click", exportOpeningCheckCsv);
els.prevPageButton.addEventListener("click", () => {
  currentPage = Math.max(1, currentPage - 1);
  renderDrawing();
});
els.nextPageButton.addEventListener("click", () => {
  currentPage = Math.min(pageCount, currentPage + 1);
  renderDrawing();
});
els.zoomOutButton.addEventListener("click", () => changeZoom(zoom - 0.1));
els.zoomInButton.addEventListener("click", () => changeZoom(zoom + 0.1));
els.fitButton.addEventListener("click", () => {
  const wrapWidth = els.stageWrap.clientWidth - 56;
  changeZoom(wrapWidth / baseWidth);
});

syncScaleUnitInput();
resizeMaterialInput();
loadSaved();
loadFinishTableForCurrentRoom();
updateRoomStatus();
renderRegisteredRoomSelect();
renderDrawing();
loadProjectFromQuery();
updateOpeningTradeButtons();
