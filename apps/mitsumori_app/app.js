(function () {
  const storageKey = "construction-estimate-v3";
  const bookStorageKey = "construction-estimate-book-v1";
  const saveBackupKey = "construction-estimate-last-save-backup-v1";
  const legacyKeys = ["construction-estimate-v2", "construction-estimate-v1"];
  const today = new Date();
  const pad = (value) => String(value).padStart(2, "0");
  const todayText = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

  const tradePresets = [
    { name: "仮設工事", keys: ["仮設", "足場", "養生", "清掃", "墨出", "水盛", "シート", "安全", "現場管理"] },
    { name: "土工事", keys: ["土工", "掘削", "埋戻", "残土", "砕石", "転圧", "床付", "床掘", "根切", "整地"] },
    { name: "鉄筋工事", keys: ["鉄筋", "D10", "D13", "D16", "D19", "配筋", "メッシュ", "ワイヤーメッシュ"] },
    { name: "コンクリートブロック工事", keys: ["コンクリートブロック", "ブロック", "CB", "4in", "6in"] },
    { name: "コンクリート工事", keys: ["コンクリート", "生コン", "打設", "均し", "土間", "基礎", "スラブ", "Fc", "m3"] },
    { name: "型枠工事", keys: ["型枠", "型わく", "せき板", "フォーム", "支保", "脱型"] },
    { name: "左官工事", keys: ["左官", "モルタル", "塗り", "金鏝", "刷毛", "補修", "下地調整"] },
    { name: "金属工事", keys: ["金属", "アルミ", "ステン", "スチール", "手摺", "笠木", "金物", "アンカー", "鉄骨"] }
  ];

  const noteKeywords = [
    "備考", "注意", "特記", "条件", "別途", "除く", "含む", "含まない", "支給", "貸与", "有効期限",
    "工期", "納期", "支払", "支払い", "振込", "見積条件", "施工条件", "追加", "変更", "協議",
    "現場確認", "図面", "仕様", "単価", "概算", "運搬", "処分", "諸経費"
  ];

  const ignoreKeywords = [
    "御見積書", "見積書", "請求書", "納品書", "ページ", "page", "tel", "fax", "email", "e-mail",
    "〒", "住所", "会社名", "株式会社", "有限会社", "担当", "発行日", "見積番号", "登録番号",
    "宛先", "様", "御中", "小計", "合計", "消費税", "税込", "税抜", "net", "total"
  ];

  const columnAliases = {
    name: ["品名", "名目", "名称", "項目", "工事項目", "工種", "作業名", "商品名", "明細", "内容"],
    summary: ["摘要", "概要", "仕様", "規格", "寸法", "内訳", "説明"],
    qty: ["数量", "数", "員数", "数量計", "qty"],
    unit: ["単位", "単位名", "unit"],
    price: ["単価", "見積単価", "原価", "金額単価"],
    amount: ["金額", "見積金額", "合計", "計", "amount"],
    remarks: ["備考", "メモ", "摘要備考", "注意事項", "条件"]
  };

  const defaultItems = [
    { type: "section", category: "材料費", name: "", summary: "", qty: "", unit: "", price: "", remarks: "" },
    { type: "item", category: "材料費", name: "角パイプ", summary: "60x60x2.3x6", qty: 3, unit: "本", price: 7086, remarks: "" },
    { type: "section", category: "施工費", name: "", summary: "", qty: "", unit: "", price: "", remarks: "" },
    { type: "item", category: "施工費", name: "組み立て", summary: "", qty: 1, unit: "式", price: 57359, remarks: "" }
  ];

  const defaults = {
    quoteNo: `Q-${today.getFullYear()}${pad(today.getMonth() + 1)}${pad(today.getDate())}-001`,
    issueDate: todayText,
    clientName: "",
    projectName: "新築工事",
    siteAddress: "",
    siteArea: "",
    buildingArea: "",
    totalFloorArea: "",
    period: "打合せによる",
    validUntil: "発行日より30日",
    companyName: "株式会社知花工務店",
    companyAddress: "沖縄県うるま市宮里790-2（1F）",
    companyPhone: "098-960-4712",
    companyPerson: "",
    paymentTerms: "完了後請求",
    taxRate: 10,
    commonTemporaryCost: 0,
    siteManagementRate: 0,
    generalManagementRate: 0,
    discount: 0,
    floorAreaTsubo: "",
    netAmount: "",
    notes: "見積り有効期限は提出日より1ヶ月間と致します。",
    useStamp: true,
    estimateMode: "simple",
    activeSheetIndex: 0,
    sheets: [{ name: "簡易見積", items: defaultItems }]
  };

  const ueharaEstimateItems = [
    { type: "section", category: "取り込み", name: "", summary: "", qty: "", unit: "", price: "", remarks: "" },
    { type: "item", category: "取り込み", name: "D10", summary: "", qty: 4.75, unit: "t", price: 119000, remarks: "棚原工務店 上原邸PDF" },
    { type: "item", category: "取り込み", name: "D13", summary: "", qty: 6.5, unit: "t", price: 117000, remarks: "棚原工務店 上原邸PDF" },
    { type: "item", category: "取り込み", name: "D16", summary: "", qty: 2.7, unit: "t", price: 115000, remarks: "棚原工務店 上原邸PDF" },
    { type: "item", category: "取り込み", name: "D19", summary: "", qty: 1.68, unit: "t", price: 119000, remarks: "棚原工務店 上原邸PDF" },
    { type: "item", category: "取り込み", name: "加工組立", summary: "", qty: 15.67, unit: "t", price: 60000, remarks: "棚原工務店 上原邸PDF" },
    { type: "item", category: "取り込み", name: "結線及びスペンサー", summary: "", qty: 15.6, unit: "t", price: 4000, remarks: "棚原工務店 上原邸PDF" },
    { type: "item", category: "取り込み", name: "運送費", summary: "", qty: 15.6, unit: "t", price: 6000, remarks: "棚原工務店 上原邸PDF" },
    { type: "item", category: "取り込み", name: "法定福利費", summary: "", qty: 1, unit: "式", price: 14100, remarks: "棚原工務店 上原邸PDF" },
    { type: "item", category: "取り込み", name: "ワイヤメッシュ", summary: "φ4×150×150", qty: 31, unit: "枚", price: 4950, remarks: "ワイヤメッシュ敷き手間数量÷7.2" },
    { type: "item", category: "取り込み", name: "ワイヤメッシュ敷き手間", summary: "", qty: 229.03, unit: "㎡", price: 400, remarks: "棚原工務店 上原邸PDF" }
  ];

  const ueharaTemporaryItems = [
    { type: "section", category: "取り込み", name: "", summary: "", qty: "", unit: "", price: "", remarks: "" },
    { type: "item", category: "取り込み", name: "外部足場", summary: "組立解体", qty: 240, unit: "㎡", price: 1000, remarks: "普久原工業 上原邸PDF" },
    { type: "item", category: "取り込み", name: "水盛り　遣り方", summary: "", qty: 113.51, unit: "㎡", price: 500, remarks: "見積書20260619 PDF" },
    { type: "item", category: "取り込み", name: "墨出し", summary: "", qty: 158.8, unit: "㎡", price: 350, remarks: "見積書20260619 PDF" },
    { type: "item", category: "取り込み", name: "足場インサート取付", summary: "TB型", qty: 440, unit: "㎡", price: 100, remarks: "見積書20260619 PDF" },
    { type: "item", category: "取り込み", name: "内部足場", summary: "", qty: 158.8, unit: "㎡", price: 100, remarks: "見積書20260619 PDF" },
    { type: "item", category: "取り込み", name: "階段仕上げ足場", summary: "", qty: 1, unit: "式", price: 70000, remarks: "見積書20260619 PDF" },
    { type: "item", category: "取り込み", name: "構内片付け・清掃", summary: "", qty: 148.96, unit: "㎡", price: 500, remarks: "見積書20260619 PDF" },
    { type: "item", category: "取り込み", name: "養生", summary: "", qty: 158.8, unit: "㎡", price: 500, remarks: "見積書20260619 PDF" },
    { type: "item", category: "取り込み", name: "竣工クリーニング", summary: "", qty: 158.8, unit: "㎡", price: 1000, remarks: "見積書20260619 PDF" },
    { type: "item", category: "取り込み", name: "調整", summary: "", qty: 1, unit: "式", price: -895, remarks: "見積書20260619 PDF" }
  ];

  const concreteTemplateItems = [
    { type: "section", category: "基本明細", name: "", summary: "", qty: "", unit: "", price: "", remarks: "" },
    { type: "item", category: "基本明細", name: "均しコンクリート", summary: "FC18/Nmm3 S=18cm", qty: 0, unit: "㎥", price: 19700, remarks: "" },
    { type: "item", category: "基本明細", name: "土間コンクリート", summary: "FC30/Nmm3 S=15cm", qty: 0, unit: "㎥", price: 21500, remarks: "直接入力" },
    { type: "item", category: "基本明細", name: "土間コンクリート", summary: "FC18/Nmm3 S=15cm", qty: 0, unit: "㎥", price: 19600, remarks: "直接入力" },
    { type: "item", category: "基本明細", name: "有筋コンクリート基礎", summary: "FC30/Nmm3 S=15cm", qty: 0, unit: "㎥", price: 21400, remarks: "Excel最下層項目" },
    { type: "item", category: "基本明細", name: "有筋コンクリート躯体", summary: "FC30/Nmm3 S=18cm", qty: 0, unit: "㎥", price: 21500, remarks: "Excelその他項目" },
    { type: "item", category: "基本明細", name: "ポンプ車セット", summary: "10m未満", qty: 0, unit: "回", price: 43000, remarks: "直接入力" },
    { type: "item", category: "基本明細", name: "ポンプ車セット", summary: "10m以上", qty: 0, unit: "回", price: 35000, remarks: "直接入力" },
    { type: "item", category: "基本明細", name: "コンクリート圧送費", summary: "", qty: 0, unit: "㎥", price: 1000, remarks: "コンクリート数量合計" },
    { type: "item", category: "基本明細", name: "コンクリート打設費", summary: "", qty: 0, unit: "㎥", price: 1500, remarks: "コンクリート数量合計" },
    { type: "item", category: "基本明細", name: "ミキサー小型車使用", summary: "", qty: 0, unit: "㎥", price: 3500, remarks: "コンクリート数量合計 / 単価表R8_4_1" },
    { type: "item", category: "基本明細", name: "バイブレーター損料", summary: "", qty: 0, unit: "式", price: 10000, remarks: "直接入力" },
    { type: "item", category: "基本明細", name: "圧送用セメント", summary: "", qty: 0, unit: "袋", price: 500, remarks: "直接入力" },
    { type: "item", category: "基本明細", name: "コンクリート圧縮試験費", summary: "1週、4週", qty: 2, unit: "回", price: 8500, remarks: "単価表R8_4_1: 昼間 普通コンクリート 8,500円" },
    { type: "item", category: "基本明細", name: "打設前清掃", summary: "", qty: 0, unit: "回", price: 5000, remarks: "直接入力" },
    { type: "section", category: "※構造体を品質基準強度+6Nにて積算しております。", name: "", summary: "", qty: "", unit: "", price: "", remarks: "" }
  ];

  const concreteUnitPriceTableR8_4_1 = {
    source: "単価表R8_4_1",
    surcharges: {
      smallMixerTruck: 3500,
      daytimeNormalConcreteTest: 8500,
      compressionTestCount: 2
    },
    normal: {
      20: {
        18: { 8: 22400, 12: 22500, 15: 22600, 18: 22700 },
        21: { 8: 22700, 12: 22800, 15: 22900, 18: 23000, 21: 23150 },
        24: { 8: 23200, 12: 23300, 15: 23400, 18: 23500, 21: 23650 },
        27: { 8: 23700, 12: 23800, 15: 23900, 18: 24000, 21: 24150 },
        30: { 8: 24100, 12: 24300, 15: 24400, 18: 24500, 21: 24700 },
        33: { 8: 24750, 12: 25800, 15: 25950, 18: 26100, 21: 26350 },
        36: { 8: 25250, 12: 26350, 15: 26500, 18: 26750, 21: 27000 },
        40: { 8: 25950, 12: 27400, 15: 27550, 18: 27800, 21: 28150 },
        42: { 12: 28250, 15: 28400, 18: 28600, 21: 28900 },
        45: { 12: 28950, 15: 29100, 18: 29300, 21: 29600 }
      },
      40: {
        18: { 8: 22700, 12: 22800, 15: 22850 },
        21: { 8: 23000, 12: 23100, 15: 23150 },
        24: { 8: 23450, 12: 23550, 15: 23650 },
        27: { 8: 24000, 12: 24150, 15: 24250 },
        30: { 8: 24500, 12: 24700, 15: 24800 }
      }
    },
    discounts: [
      {
        label: "沖縄市・うるま市・北谷・読谷・嘉手納・北中城",
        amount: 6500,
        keywords: ["沖縄市", "うるま", "北谷", "読谷", "嘉手納", "北中城"]
      },
      {
        label: "宜野湾・中城・平安座・伊計・恩納村・金武・宜野座",
        amount: 4000,
        keywords: ["宜野湾", "中城", "平安座", "伊計", "恩納", "金武", "宜野座"]
      },
      {
        label: "浦添・西原・那覇・南部",
        amount: 3000,
        keywords: ["豊見城", "南風原", "与那原", "八重瀬", "浦添", "西原", "那覇市", "糸満", "南城", "島尻", "南部"]
      }
    ]
  };

  const concreteBlockTemplateItems = [
    { type: "section", category: "基本明細", name: "", summary: "", qty: "", unit: "", price: "", remarks: "" },
    { type: "item", category: "基本明細", name: "ブロック丁張り", summary: "", qty: 0, unit: "式", price: 120000, remarks: "直接入力" },
    { type: "item", category: "基本明細", name: "花ブロック", summary: "4inx400x400 化粧目地仕上げ", qty: 0, unit: "㎡", price: 12000, remarks: "" },
    { type: "item", category: "基本明細", name: "花ブロック差し筋", summary: "ステンレス丸棒 6φ", qty: 0, unit: "m", price: 600, remarks: "" },
    { type: "item", category: "基本明細", name: "耐水コンクリートブロック", summary: "4in 6in 化粧目地仕上げ", qty: 0, unit: "㎡", price: 7000, remarks: "納期1ヶ月" },
    { type: "item", category: "基本明細", name: "運搬費", summary: "", qty: 0, unit: "式", price: 60000, remarks: "直接入力" }
  ];

  const earthworkTemplateItems = [
    { type: "section", category: "基本明細", name: "", summary: "", qty: "", unit: "", price: "", remarks: "" },
    { type: "item", category: "基本明細", name: "床掘り", summary: "大型使用不可", qty: 0, unit: "㎥", price: 2500, remarks: "" },
    { type: "item", category: "基本明細", name: "残土運搬処分", summary: "", qty: 0, unit: "㎥", price: 3000, remarks: "" },
    { type: "item", category: "基本明細", name: "砕石地業", summary: "RC-40", qty: 0, unit: "㎥", price: 7000, remarks: "" },
    { type: "item", category: "基本明細", name: "埋戻し", summary: "大型使用不可", qty: 0, unit: "㎥", price: 2500, remarks: "" },
    { type: "item", category: "基本明細", name: "重機回送費", summary: "", qty: 0, unit: "回", price: 15000, remarks: "" },
    { type: "item", category: "基本明細", name: "防湿シート", summary: "厚 0.15mm", qty: 0, unit: "㎡", price: 300, remarks: "" }
  ];

  const formworkTemplateItems = [
    { type: "section", category: "基本明細", name: "", summary: "", qty: "", unit: "", price: "", remarks: "" },
    { type: "item", category: "基本明細", name: "普通型枠合板", summary: "基礎部", qty: 0, unit: "㎡", price: 3500, remarks: "C種型枠合板" },
    { type: "item", category: "基本明細", name: "普通型枠合板", summary: "地上軸部", qty: 0, unit: "㎡", price: 3800, remarks: "B種型枠合板" },
    { type: "item", category: "基本明細", name: "天井断熱材", summary: "B種 厚25mmスタイロフォーム", qty: 0, unit: "枚", price: 2060, remarks: "直接入力" },
    { type: "item", category: "基本明細", name: "インサート金物", summary: "", qty: 0, unit: "㎡", price: 100, remarks: "直接入力" },
    { type: "item", category: "基本明細", name: "運搬費", summary: "", qty: 0, unit: "㎡", price: 300, remarks: "型枠数量合計" },
    { type: "item", category: "基本明細", name: "荷上費", summary: "", qty: 0, unit: "㎡", price: 100, remarks: "型枠数量合計" },
    { type: "item", category: "基本明細", name: "土間型枠", summary: "", qty: 1, unit: "式", price: 100000, remarks: "直接入力" }
  ];

  const plasterTemplateItems = [
    { type: "section", category: "基本明細", name: "", summary: "", qty: "", unit: "", price: "", remarks: "" },
    { type: "item", category: "基本明細", name: "左官コンクリート仕上げ", summary: "", qty: 0, unit: "㎡", price: 870, remarks: "" },
    { type: "item", category: "基本明細", name: "立ち上がり押さえ", summary: "", qty: 0, unit: "m", price: 800, remarks: "" },
    { type: "item", category: "基本明細", name: "壁塗装下地補修", summary: "", qty: 0, unit: "㎡", price: 1550, remarks: "" },
    { type: "item", category: "基本明細", name: "階段モルタル仕上げ", summary: "", qty: 0, unit: "㎡", price: 7730, remarks: "" },
    { type: "item", category: "基本明細", name: "サッシモルタル詰め", summary: "", qty: 0, unit: "m", price: 1650, remarks: "" },
    { type: "item", category: "基本明細", name: "内部Pコン処理", summary: "", qty: 0, unit: "式", price: 28970, remarks: "" },
    { type: "item", category: "基本明細", name: "諸経費", summary: "", qty: 0, unit: "式", price: 67590, remarks: "" },
    { type: "item", category: "基本明細", name: "ノンスリップタイル", summary: "", qty: 0, unit: "個", price: 100, remarks: "" }
  ];

  const metalTemplateItems = [
    { type: "section", category: "基本明細", name: "", summary: "", qty: "", unit: "", price: "", remarks: "" },
    { type: "item", category: "基本明細", name: "タラップ", summary: "SUS製", qty: 8, unit: "ヶ所", price: 2400, remarks: "" },
    { type: "item", category: "基本明細", name: "屋上点検口", summary: "SUS製", qty: 0, unit: "ヶ所", price: 90000, remarks: "" },
    { type: "item", category: "基本明細", name: "換気口", summary: "セラミック製フード無 φ75", qty: 0, unit: "ヶ所", price: 1200, remarks: "" },
    { type: "item", category: "基本明細", name: "換気口", summary: "セラミック製フード付 φ75", qty: 0, unit: "ヶ所", price: 1800, remarks: "" },
    { type: "item", category: "基本明細", name: "換気口", summary: "セラミック製フード無 φ100", qty: 0, unit: "ヶ所", price: 0, remarks: "取消" },
    { type: "item", category: "基本明細", name: "換気口", summary: "セラミック製フード付 φ100", qty: 0, unit: "ヶ所", price: 0, remarks: "取消" },
    { type: "item", category: "基本明細", name: "換気口", summary: "AT-75TUGSD5 Φ75", qty: 0, unit: "ヶ所", price: 5040, remarks: "" },
    { type: "item", category: "基本明細", name: "換気口スリーブ", summary: "Φ75", qty: 0, unit: "ヶ所", price: 260, remarks: "" },
    { type: "item", category: "基本明細", name: "換気口スリーブ", summary: "Φ100", qty: 0, unit: "ヶ所", price: 0, remarks: "取消" },
    { type: "item", category: "基本明細", name: "スリーブ補強筋", summary: "Φ100", qty: 0, unit: "ヶ所", price: 0, remarks: "取消" },
    { type: "item", category: "基本明細", name: "壁面緑化用金物", summary: "アングルタイプ", qty: 0, unit: "㎡", price: 55200, remarks: "" },
    { type: "item", category: "基本明細", name: "エラスタイト　1mx1m", summary: "10mm、15mm併用", qty: 0, unit: "枚", price: 6360, remarks: "" },
    { type: "item", category: "基本明細", name: "エラスタイト　1mx1m", summary: "10mm", qty: 0, unit: "枚", price: 2850, remarks: "" },
    { type: "item", category: "基本明細", name: "エラスタイト　1mx1m", summary: "15mm", qty: 0, unit: "枚", price: 3510, remarks: "" },
    { type: "item", category: "基本明細", name: "車止めブロック", summary: "200x500", qty: 6, unit: "個", price: 1980, remarks: "" },
    { type: "item", category: "基本明細", name: "集水マス", summary: "コンクリート製 300x300グレーチング付き", qty: 0, unit: "ヶ所", price: 20000, remarks: "" },
    { type: "item", category: "基本明細", name: "集水マス", summary: "コンクリート製 600x600グレーチング付き", qty: 0, unit: "ヶ所", price: 40000, remarks: "" },
    { type: "item", category: "基本明細", name: "グレーチング", summary: "600x600 ステンレス", qty: 0, unit: "個", price: 6000, remarks: "" },
    { type: "item", category: "基本明細", name: "グレーチング", summary: "300x300 ステンレス", qty: 0, unit: "個", price: 2710, remarks: "" },
    { type: "item", category: "基本明細", name: "場所打ちU形側溝用蓋", summary: "コンクリート製 C-1-B500", qty: 0, unit: "個", price: 3150, remarks: "6/17確認" },
    { type: "item", category: "基本明細", name: "マンホール", summary: "Φ600 鋳鉄製 施錠式", qty: 0, unit: "組", price: 35380, remarks: "6/17確認" },
    { type: "item", category: "基本明細", name: "マンホール", summary: "Φ600 鋳鉄製 施錠式", qty: 0, unit: "組", price: 59560, remarks: "6/18確認 南京錠" },
    { type: "item", category: "基本明細", name: "ポスト", summary: "CTBR7612", qty: 0, unit: "ヶ所", price: 34200, remarks: "" },
    { type: "item", category: "基本明細", name: "物干し金物", summary: "SK-550ESLP-SLC", qty: 0, unit: "本", price: 12600, remarks: "" },
    { type: "item", category: "基本明細", name: "物干し金物", summary: "KS-640AF-M", qty: 0, unit: "本", price: 4800, remarks: "" },
    { type: "item", category: "基本明細", name: "物干し金物", summary: "B64物干金物 1300", qty: 0, unit: "組", price: 24600, remarks: "" },
    { type: "item", category: "基本明細", name: "物干し金物", summary: "アルミ自在物干し 900", qty: 0, unit: "組", price: 19200, remarks: "" },
    { type: "item", category: "基本明細", name: "郵便受け", summary: "NSTA KS-MB33S", qty: 0, unit: "ヶ所", price: 25000, remarks: "" },
    { type: "item", category: "基本明細", name: "郵便受け", summary: "フェイサス埋込型", qty: 0, unit: "ヶ所", price: 49700, remarks: "" },
    { type: "item", category: "基本明細", name: "物干し金物", summary: "昇降式 W1800URB-L-W", qty: 0, unit: "set", price: 37200, remarks: "" },
    { type: "item", category: "基本明細", name: "水抜き穴", summary: "YS-5", qty: 0, unit: "ヶ所", price: 16200, remarks: "" },
    { type: "item", category: "基本明細", name: "水抜きパイプ", summary: "VP φ50 4m", qty: 0, unit: "本", price: 480, remarks: "" },
    { type: "item", category: "基本明細", name: "水抜きパイプ", summary: "VP φ75 4m", qty: 0, unit: "本", price: 600, remarks: "" },
    { type: "item", category: "基本明細", name: "止水板", summary: "20㎡/巻", qty: 0, unit: "巻", price: 10200, remarks: "" },
    { type: "item", category: "基本明細", name: "ステラシート", summary: "10m巻", qty: 0, unit: "巻", price: 4040, remarks: "" },
    { type: "item", category: "基本明細", name: "ボイド枠", summary: "Φ150 4m", qty: 0, unit: "本", price: 1490, remarks: "" },
    { type: "item", category: "基本明細", name: "丸環", summary: "ステンレス", qty: 0, unit: "個", price: 1200, remarks: "" },
    { type: "item", category: "基本明細", name: "壁掛けテレビ金具", summary: "東芝REGZA 65型対応 角度調整タイプ", qty: 0, unit: "箇所", price: 12000, remarks: "" },
    { type: "item", category: "基本明細", name: "物干し金物", summary: "SK-550ESLP-SLC", qty: 0, unit: "ヶ所", price: 14000, remarks: "" },
    { type: "item", category: "基本明細", name: "階段壁付け手摺", summary: "", qty: 0, unit: "ヶ所", price: 106000, remarks: "" },
    { type: "item", category: "基本明細", name: "郵便ポスト", summary: "panasonic kc型 ctr181s 縦型", qty: 1, unit: "ヶ所", price: 16610, remarks: "" },
    { type: "item", category: "基本明細", name: "土間Vカット目地切", summary: "W20", qty: 0, unit: "式", price: 45000, remarks: "" },
    { type: "item", category: "基本明細", name: "ポーチスチール手摺", summary: "FB-9X38/RB-O13溶融亜鉛メッキ処理", qty: 1, unit: "式", price: 112950, remarks: "" },
    { type: "item", category: "基本明細", name: "手摺取付施工費", summary: "", qty: 1, unit: "式", price: 67060, remarks: "" },
    { type: "item", category: "基本明細", name: "床下点検口", summary: "450角", qty: 1, unit: "ヶ所", price: 8000, remarks: "" },
    { type: "item", category: "基本明細", name: "副資材費", summary: "セメント、取付金物等", qty: 1, unit: "式", price: 20000, remarks: "" },
    { type: "item", category: "基本明細", name: "上記施工費", summary: "", qty: 1, unit: "式", price: 45000, remarks: "" }
  ];

  const ueharaAreas = {
    siteArea: 229.03,
    buildingArea: 113.51,
    totalFloorArea: 158.8
  };

  function createAdjustmentItem() {
    return {
      type: "item",
      category: "調整",
      name: "調整",
      summary: "",
      qty: 1,
      unit: "式",
      price: 0,
      remarks: "下三桁切り捨て",
      hidden: false
    };
  }

  function isAdjustmentItem(item) {
    return item.type === "item" && String(item.name || "").trim() === "調整";
  }

  function ensureAdjustmentRows(sheets) {
    sheets.forEach((sheet) => {
      const adjustments = sheet.items.filter(isAdjustmentItem);
      sheet.items = sheet.items.filter((item) => !isAdjustmentItem(item));
      const adjustment = adjustments[0] || createAdjustmentItem();
      if (adjustments.length > 1) {
        adjustment.qty = 1;
        adjustment.price = adjustments.reduce((sum, item) => sum + amount(item), 0);
      }
      adjustment.category = adjustment.category || "調整";
      adjustment.qty = adjustment.qty === "" || adjustment.qty === undefined ? 1 : adjustment.qty;
      adjustment.unit = adjustment.unit || "式";
      adjustment.price = adjustment.price === "" || adjustment.price === undefined ? 0 : adjustment.price;
      adjustment.remarks = adjustment.remarks || "下三桁切り捨て";
      adjustment.hidden = false;
      sheet.items.push(adjustment);
    });
  }

  function isConcreteBlockSheet(sheetOrName) {
    const name = typeof sheetOrName === "string" ? sheetOrName : sheetOrName?.name;
    return /コンクリートブロック|ブロック工事/.test(String(name || ""));
  }

  function isConcreteSheet(sheetOrName) {
    const name = typeof sheetOrName === "string" ? sheetOrName : sheetOrName?.name;
    return String(name || "").includes("コンクリート") && !isConcreteBlockSheet(sheetOrName);
  }

  function isFormworkSheet(sheetOrName) {
    const name = typeof sheetOrName === "string" ? sheetOrName : sheetOrName?.name;
    return String(name || "").includes("型枠");
  }

  function isPlasterSheet(sheetOrName) {
    const name = typeof sheetOrName === "string" ? sheetOrName : sheetOrName?.name;
    return String(name || "").includes("左官");
  }

  function isMetalSheet(sheetOrName) {
    const name = typeof sheetOrName === "string" ? sheetOrName : sheetOrName?.name;
    return String(name || "").includes("金属");
  }

  function concreteTemplateKey(item) {
    return [item.type, item.category, item.name, item.summary].map((value) => String(value || "").replace(/\s+/g, "")).join("|");
  }

  function concreteBlockTemplateKey(item) {
    return [item.type, item.category, item.name, item.summary].map((value) => String(value || "").replace(/\s+/g, "")).join("|");
  }

  function earthworkTemplateKey(item) {
    return [item.type, item.category, item.name, item.summary].map((value) => String(value || "").replace(/\s+/g, "")).join("|");
  }

  function formworkTemplateKey(item) {
    return [item.type, item.category, item.name, item.summary].map((value) => String(value || "").replace(/\s+/g, "")).join("|");
  }

  function plasterTemplateKey(item) {
    return [item.type, item.category, item.name, item.summary].map((value) => String(value || "").replace(/\s+/g, "")).join("|");
  }

  function metalTemplateKey(item) {
    if (item.metalTemplateKey) return item.metalTemplateKey;
    return [item.type, item.category, item.name, item.summary, item.unit, item.price].map((value) => String(value || "").replace(/\s+/g, "")).join("|");
  }

  function cloneMetalTemplate(template) {
    const row = clone(template);
    row.metalTemplateKey = metalTemplateKey(template);
    return row;
  }

  function ensureConcreteTemplateRows(sheets) {
    sheets.filter(isConcreteSheet).forEach((sheet) => {
      consolidateSmallMixerTruckRows(sheet);
      if (sheet.suppressConcreteTemplate) {
        ensureConcreteUsableTemplateRows(sheet);
        return;
      }
      concreteTemplateItems.forEach((template) => {
        const key = concreteTemplateKey(template);
        const exists = sheet.items.some((item) => concreteTemplateKey(item) === key);
        if (!exists) sheet.items.push(clone(template));
      });
      orderConcreteTemplateRows(sheet);
    });
  }

  function consolidateSmallMixerTruckRows(sheet) {
    const rows = sheet.items.filter(isSmallMixerTruckItem);
    if (!rows.length) return;
    const primary = rows.find((item) => item.category === "基本明細") || rows[0];
    primary.type = "item";
    primary.category = "基本明細";
    primary.name = "ミキサー小型車使用";
    primary.summary = "";
    primary.unit = "㎥";
    primary.price = concreteUnitPriceTableR8_4_1.surcharges.smallMixerTruck;
    primary.remarks = replaceConcretePriceRemark(primary.remarks, `${concreteUnitPriceTableR8_4_1.source}: 小型車使用料 ${concreteUnitPriceTableR8_4_1.surcharges.smallMixerTruck.toLocaleString("ja-JP")}円`);
    delete primary.manualQty;
    sheet.items = sheet.items.filter((item) => item === primary || !isSmallMixerTruckItem(item));
  }

  function ensureConcreteBlockTemplateRows(sheets) {
    sheets.filter(isConcreteBlockSheet).forEach((sheet) => {
      removeObsoleteConcreteBlockTemplateRows(sheet);
      concreteBlockTemplateItems.forEach((template) => {
        const key = concreteBlockTemplateKey(template);
        const exists = sheet.items.some((item) => concreteBlockTemplateKey(item) === key);
        if (!exists) sheet.items.push(clone(template));
      });
      orderConcreteBlockTemplateRows(sheet);
    });
  }

  function removeObsoleteConcreteBlockTemplateRows(sheet) {
    sheet.items = sheet.items.filter((item) => {
      const isOldBlankTemplate = item.type === "item"
        && String(item.name || "").trim() === "普通コンクリートブロック"
        && normalizedText(item.summary) === normalizedText("4in 6in")
        && toNumber(item.qty) === 0
        && toNumber(item.price) === 4500
        && !String(item.remarks || "").trim();
      return !isOldBlankTemplate;
    });
  }

  function orderConcreteTemplateRows(sheet) {
    if (sheet.manualRowOrder) return;
    const templateKeys = new Set(concreteTemplateItems.map(concreteTemplateKey));
    const templateRows = [];
    const otherRows = [];
    sheet.items.forEach((item) => {
      if (templateKeys.has(concreteTemplateKey(item))) {
        return;
      }
      otherRows.push(item);
    });
    concreteTemplateItems.forEach((template) => {
      const existing = sheet.items.find((item) => concreteTemplateKey(item) === concreteTemplateKey(template));
      templateRows.push(existing || clone(template));
    });
    sheet.items = [...templateRows, ...otherRows];
  }

  function orderConcreteBlockTemplateRows(sheet) {
    if (sheet.manualRowOrder) return;
    const templateKeys = new Set(concreteBlockTemplateItems.map(concreteBlockTemplateKey));
    const templateRows = [];
    const otherRows = [];
    sheet.items.forEach((item) => {
      if (templateKeys.has(concreteBlockTemplateKey(item))) return;
      otherRows.push(item);
    });
    concreteBlockTemplateItems.forEach((template) => {
      const existing = sheet.items.find((item) => concreteBlockTemplateKey(item) === concreteBlockTemplateKey(template));
      templateRows.push(existing || clone(template));
    });
    sheet.items = [...templateRows, ...otherRows];
  }

  function ensureConcreteUsableTemplateRows(sheet) {
    concreteTemplateItems
      .filter(isConcreteUsableTemplateRow)
      .forEach((template) => {
        const key = concreteTemplateKey(template);
        const exists = sheet.items.some((item) => concreteTemplateKey(item) === key);
        if (!exists) insertBeforeAdjustment(sheet, clone(template));
      });
    orderExistingConcreteTemplateRows(sheet);
  }

  function isConcreteUsableTemplateRow(item) {
    if (item.type === "section" && item.category === "基本明細") return true;
    if (item.type !== "item") return false;
    const remarks = String(item.remarks || "");
    return remarks.includes("直接入力") || remarks.includes("コンクリート数量合計");
  }

  function orderExistingConcreteTemplateRows(sheet) {
    if (sheet.manualRowOrder) return;
    const templateKeys = new Set(concreteTemplateItems.map(concreteTemplateKey));
    const existingTemplateRows = [];
    const otherRows = [];
    sheet.items.forEach((item) => {
      if (templateKeys.has(concreteTemplateKey(item))) return;
      otherRows.push(item);
    });
    concreteTemplateItems.forEach((template) => {
      const existing = sheet.items.find((item) => concreteTemplateKey(item) === concreteTemplateKey(template));
      if (existing) existingTemplateRows.push(existing);
    });
    sheet.items = [...existingTemplateRows, ...otherRows];
  }

  function insertBeforeAdjustment(sheet, item) {
    const adjustmentIndex = sheet.items.findIndex(isAdjustmentItem);
    const insertIndex = adjustmentIndex >= 0 ? adjustmentIndex : sheet.items.length;
    sheet.items.splice(insertIndex, 0, item);
  }

  function ensureEarthworkTemplateRows(sheets) {
    sheets.filter(isEarthworkSheet).forEach((sheet) => {
      earthworkTemplateItems.forEach((template) => {
        const key = earthworkTemplateKey(template);
        const exists = sheet.items.some((item) => earthworkTemplateKey(item) === key);
        if (!exists) sheet.items.push(clone(template));
      });
      consolidateEarthworkSubbaseRows(sheet);
      orderEarthworkTemplateRows(sheet);
    });
  }

  function ensureFormworkTemplateRows(sheets) {
    sheets.filter(isFormworkSheet).forEach((sheet) => {
      formworkTemplateItems.forEach((template) => {
        const key = formworkTemplateKey(template);
        const exists = sheet.items.some((item) => formworkTemplateKey(item) === key);
        if (!exists) sheet.items.push(clone(template));
      });
      orderFormworkTemplateRows(sheet);
      cleanupZeroInsertRows(sheet);
    });
  }

  function ensurePlasterTemplateRows(sheets) {
    sheets.filter(isPlasterSheet).forEach((sheet) => {
      plasterTemplateItems.forEach((template) => {
        const key = plasterTemplateKey(template);
        const exists = sheet.items.some((item) => plasterTemplateKey(item) === key);
        if (!exists) sheet.items.push(clone(template));
      });
      orderPlasterTemplateRows(sheet);
    });
  }

  function ensureMetalTemplateRows(sheets) {
    sheets.filter(isMetalSheet).forEach((sheet) => {
      removeObsoleteMetalTemplateRows(sheet);
      metalTemplateItems.forEach((template) => {
        const key = metalTemplateKey(template);
        const existing = sheet.items.find((item) => metalTemplateKey(item) === key);
        if (existing) {
          existing.metalTemplateKey = key;
        } else {
          sheet.items.push(cloneMetalTemplate(template));
        }
      });
      orderMetalTemplateRows(sheet);
      placeMetalFooterRows(sheet);
      syncZeroQuantityVisibility(sheet);
    });
  }

  function removeObsoleteMetalTemplateRows(sheet) {
    sheet.items = sheet.items.filter((item) => !isObsoleteMetalTemplateRow(item));
  }

  function isObsoleteMetalTemplateRow(item) {
    if (item.type !== "item" || item.metalTemplateKey || toNumber(item.qty) > 0) return false;
    const name = normalizedText(item.name);
    const summary = normalizedText(item.summary);
    const unit = normalizedText(item.unit);
    const price = toNumber(item.price);
    if (name === "物干し金物" && !summary && unit === "set" && price === 14000) return true;
    if (name === "副資材費" && summary === normalizedText("セメント、取付金物等") && unit === "式" && price === 5000) return true;
    if (name === "施工費" && !summary && unit === "式" && price === 30000) return true;
    return false;
  }

  function syncZeroQuantityVisibility(sheet) {
    sheet.items.forEach((item) => {
      if (item.type !== "item" || isAdjustmentItem(item)) return;
      if (item.manualVisibility) return;
      item.hidden = toNumber(item.qty) <= 0;
    });
  }

  function syncAllZeroQuantityVisibility(sheets) {
    sheets.forEach(syncZeroQuantityVisibility);
  }

  function placeMetalFooterRows(sheet) {
    const footers = [];
    sheet.items = sheet.items.filter((item) => {
      if (!isMetalFooterRow(item)) return true;
      footers.push(item);
      return false;
    });
    if (!footers.length) return;
    const orderedFooters = ["副資材費", "上記施工費"]
      .map((name) => footers.find((item) => normalizedText(item.name) === normalizedText(name)))
      .filter(Boolean);
    const remainingFooters = footers.filter((item) => !orderedFooters.includes(item));
    const insertIndex = sheet.items.findIndex(isAdjustmentItem);
    const footerRows = [...orderedFooters, ...remainingFooters];
    if (insertIndex >= 0) {
      sheet.items.splice(insertIndex, 0, ...footerRows);
    } else {
      sheet.items.push(...footerRows);
    }
  }

  function isMetalFooterRow(item) {
    if (item.type !== "item") return false;
    const name = normalizedText(item.name);
    return name === "副資材費" || name === "上記施工費";
  }

  function orderFormworkTemplateRows(sheet) {
    if (sheet.manualRowOrder) return;
    const templateKeys = new Set(formworkTemplateItems.map(formworkTemplateKey));
    const templateRows = [];
    const otherRows = [];
    sheet.items.forEach((item) => {
      if (templateKeys.has(formworkTemplateKey(item))) return;
      otherRows.push(item);
    });
    formworkTemplateItems.forEach((template) => {
      const existing = sheet.items.find((item) => formworkTemplateKey(item) === formworkTemplateKey(template));
      templateRows.push(existing || clone(template));
    });
    sheet.items = [...templateRows, ...otherRows];
  }

  function orderPlasterTemplateRows(sheet) {
    if (sheet.manualRowOrder) return;
    const templateKeys = new Set(plasterTemplateItems.map(plasterTemplateKey));
    const templateRows = [];
    const otherRows = [];
    sheet.items.forEach((item) => {
      if (templateKeys.has(plasterTemplateKey(item))) return;
      otherRows.push(item);
    });
    plasterTemplateItems.forEach((template) => {
      const existing = sheet.items.find((item) => plasterTemplateKey(item) === plasterTemplateKey(template));
      templateRows.push(existing || clone(template));
    });
    sheet.items = [...templateRows, ...otherRows];
  }

  function orderMetalTemplateRows(sheet) {
    if (sheet.manualRowOrder) return;
    const templateKeys = new Set(metalTemplateItems.map(metalTemplateKey));
    const templateRows = [];
    const otherRows = [];
    sheet.items.forEach((item) => {
      if (templateKeys.has(metalTemplateKey(item))) return;
      otherRows.push(item);
    });
    metalTemplateItems.forEach((template) => {
      const existing = sheet.items.find((item) => metalTemplateKey(item) === metalTemplateKey(template));
      if (existing) {
        existing.metalTemplateKey = metalTemplateKey(template);
        templateRows.push(existing);
      } else {
        templateRows.push(cloneMetalTemplate(template));
      }
    });
    sheet.items = [...templateRows, ...otherRows];
  }

  function consolidateEarthworkSubbaseRows(sheet) {
    let target = sheet.items.find((item) => item.type === "item" && normalizedText(item.name) === "砕石地業");
    if (!target) {
      target = clone(earthworkTemplateItems.find((item) => normalizedText(item.name) === "砕石地業"));
      sheet.items.push(target);
    }
    const obsoleteRows = [];
    sheet.items.forEach((item) => {
      if (item === target || item.type !== "item" || isAdjustmentItem(item)) return;
      if (!isEarthworkSubbaseName(item.name)) return;
      const qty = toNumber(item.qty);
      if (qty > 0) target.qty = Number((toNumber(target.qty) + qty).toFixed(2));
      if (!target.remarks && item.remarks) target.remarks = item.remarks;
      obsoleteRows.push(item);
    });
    target.name = "砕石地業";
    target.summary = "RC-40";
    target.unit = target.unit || "㎥";
    sheet.items = sheet.items.filter((item) => !obsoleteRows.includes(item));
  }

  function isEarthworkSubbaseName(name) {
    const text = normalizedText(name);
    return text.includes("下地業") || text.includes("砕石");
  }

  function orderEarthworkTemplateRows(sheet) {
    if (sheet.manualRowOrder) return;
    const templateKeys = new Set(earthworkTemplateItems.map(earthworkTemplateKey));
    const templateRows = [];
    const otherRows = [];
    sheet.items.forEach((item) => {
      if (templateKeys.has(earthworkTemplateKey(item))) return;
      otherRows.push(item);
    });
    earthworkTemplateItems.forEach((template) => {
      const existing = sheet.items.find((item) => earthworkTemplateKey(item) === earthworkTemplateKey(template));
      templateRows.push(existing || clone(template));
    });
    sheet.items = [...templateRows, ...otherRows];
  }

  function isSettingOutItem(item) {
    const name = String(item.name || "").replace(/\s+/g, "");
    return item.type === "item" && (/水盛り?(遣り方|やり方)/.test(name) || name.includes("防湿シート"));
  }

  function normalizedItemName(item) {
    return String(item.name || "").replace(/\s+/g, "");
  }

  function isFloorAreaLinkedItem(item) {
    const name = normalizedItemName(item);
    return item.type === "item" && (
      name.includes("墨出し") ||
      name.includes("構内片付け") ||
      name.includes("内部足場") ||
      name.includes("養生") ||
      name.includes("竣工クリーニング")
    );
  }

  function isExternalScaffoldItem(item) {
    return item.type === "item" && normalizedItemName(item).includes("外部足場");
  }

  function isScaffoldInsertItem(item) {
    return item.type === "item" && normalizedItemName(item).includes("足場インサート");
  }

  function isPlasterConcreteFinishItem(item) {
    return item.type === "item" && normalizedText(item.name) === "左官コンクリート仕上げ";
  }

  function isRebarSheet(sheet) {
    return normalizedText(sheet?.name).includes("鉄筋");
  }

  function wireMeshText(item) {
    return `${item.name || ""} ${item.summary || ""}`
      .normalize("NFKC")
      .replace(/\s+/g, "")
      .replace(/[ｰー－―]/g, "ー")
      .replace(/ワイヤー/g, "ワイヤ")
      .toUpperCase();
  }

  function isWireMeshText(value) {
    const text = String(value || "").normalize("NFKC").replace(/\s+/g, "").replace(/[ｰー－―]/g, "ー").replace(/ワイヤー/g, "ワイヤ").toUpperCase();
    if (text.includes("メッシュシート")) return false;
    return text.includes("ワイヤメッシュ") ||
      text.includes("Wメッシュ") ||
      text.includes("溶接金網") ||
      text.includes("メッシュ筋") ||
      /^WM/.test(text) ||
      text.includes("WM-") ||
      text.includes("WMΦ") ||
      (text.includes("メッシュ") && !text.includes("シート"));
  }

  function isWireMeshLaborItem(item) {
    if (item.type !== "item") return false;
    const text = wireMeshText(item);
    return isWireMeshText(text) && (
      text.includes("敷き手間") ||
      text.includes("敷き") ||
      text.includes("敷手間") ||
      text.includes("敷") ||
      text.includes("敷込") ||
      text.includes("敷込手間") ||
      text.includes("敷込み") ||
      text.includes("敷込み手間") ||
      text.includes("敷設") ||
      (text.includes("敷") && (text.includes("手間") || text.includes("施工")))
    );
  }

  function isWireMeshMaterialItem(item) {
    if (item.type !== "item") return false;
    const text = wireMeshText(item);
    if (!isWireMeshText(text) || isWireMeshLaborItem(item)) return false;
    return !["手間", "施工費", "運搬", "加工費", "取付費"].some((keyword) => text.includes(keyword));
  }

  function isConcreteQuantityItem(item) {
    const name = normalizedItemName(item);
    const summary = String(item.summary || "");
    if (item.type !== "item") return false;
    if (name.includes("圧送") || name.includes("打設") || name.includes("試験") || name.includes("ポンプ") || name.includes("セメント") || name.includes("ミキサー") || name.includes("小型車")) return false;
    return name.includes("コンクリート") || /FC\d+/i.test(summary);
  }

  function isConcretePumpOrPlacementItem(item) {
    const name = normalizedItemName(item);
    return item.type === "item" && (name.includes("コンクリート圧送費") || name.includes("コンクリート打設費"));
  }

  function isSmallMixerTruckItem(item) {
    const name = normalizedItemName(item);
    return item.type === "item" && name.includes("ミキサー") && name.includes("小型車");
  }

  function isConcreteCompressionTestItem(item) {
    const name = normalizedItemName(item);
    return item.type === "item" && name.includes("コンクリート") && name.includes("圧縮試験");
  }

  function compressionTestCount(item) {
    const text = normalizeConcreteSpecText(item?.summary || "");
    const weeks = Array.from(text.matchAll(/(\d+)\s*[週周]/g), (match) => match[1]);
    const days = Array.from(text.matchAll(/(\d+)\s*日/g), (match) => match[1]);
    const uniqueWeeks = new Set(weeks);
    const uniqueDays = new Set(days);
    const testCount = uniqueWeeks.size + uniqueDays.size;
    if (testCount) return testCount;
    return concreteUnitPriceTableR8_4_1.surcharges.compressionTestCount;
  }

  function applyConcreteCompressionTestPrice(item) {
    const perTest = concreteUnitPriceTableR8_4_1.surcharges.daytimeNormalConcreteTest;
    const testCount = compressionTestCount(item);
    item.qty = testCount;
    item.price = perTest;
    item.summary = item.summary || "1週、4週";
    item.unit = item.unit || "回";
    item.remarks = replaceConcretePriceRemark(item.remarks, `${concreteUnitPriceTableR8_4_1.source}: 昼間 普通コンクリート ${perTest.toLocaleString("ja-JP")}円`);
  }

  function isConcreteTotalLinkedItem(item) {
    return isConcretePumpOrPlacementItem(item) || isSmallMixerTruckItem(item);
  }

  function normalizeConcreteSpecText(value) {
    return String(value || "")
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
      .replace(/[．。]/g, ".")
      .replace(/[－−ー]/g, "-")
      .replace(/㎜/g, "mm")
      .replace(/ｍｍ/gi, "mm")
      .replace(/㎥/g, "m3")
      .replace(/\s+/g, " ")
      .trim();
  }

  function formatConcreteNumber(value) {
    const number = Number(value);
    if (!Number.isFinite(number)) return "";
    return Number.isInteger(number) ? String(number) : String(number).replace(/\.0$/, "");
  }

  function parseConcreteMix(item) {
    const text = normalizeConcreteSpecText([item?.summary, item?.name, item?.remarks].filter(Boolean).join(" "));
    const compact = text.replace(/\s+/g, "");
    const mix = { strength: 0, slump: 0, aggregate: 20, aggregateSpecified: false };
    const jisMatch = compact.match(/(?:^|[^\d])(\d{2})[-/](\d{1,2}(?:\.\d+)?)[-/](\d{2})(?:mm)?(?:[^\d]|$)/i);
    if (jisMatch) {
      mix.strength = Number(jisMatch[1]);
      mix.slump = Number(jisMatch[2]);
      mix.aggregate = Number(jisMatch[3]);
      mix.aggregateSpecified = true;
    }
    const strengthMatch = compact.match(/F\s*C\s*[:=]?\s*(\d{2})/i) ||
      compact.match(/呼び強度[:=]?(\d{2})/);
    if (strengthMatch) mix.strength = Number(strengthMatch[1]);
    const slumpMatch = compact.match(/S(?:LUMP)?\s*[:=]?\s*(\d{1,2}(?:\.\d+)?)\s*(?:cm)?/i) ||
      compact.match(/スランプ[:=]?(\d{1,2}(?:\.\d+)?)/);
    if (slumpMatch) mix.slump = Number(slumpMatch[1]);
    const aggregateMatch = compact.match(/粗骨材(?:最大寸法)?[:=]?(\d{2})mm/i) ||
      compact.match(/(?:G|骨材)[:=]?(\d{2})mm/i);
    if (aggregateMatch) {
      mix.aggregate = Number(aggregateMatch[1]);
      mix.aggregateSpecified = true;
    }
    if (!mix.strength || !mix.slump) return null;
    return mix;
  }

  function concreteSummaryFromMix(mix) {
    if (!mix) return "";
    return `FC${mix.strength}/Nmm3 S=${formatConcreteNumber(mix.slump)}cm`;
  }

  function normalizeConcreteItemSummary(item) {
    if (!item || item.type !== "item" || isConcreteTotalLinkedItem(item) || isAdjustmentItem(item)) return false;
    const mix = parseConcreteMix(item);
    if (!mix) return false;
    const nextSummary = concreteSummaryFromMix(mix);
    if (!nextSummary || item.summary === nextSummary) return false;
    item.summary = nextSummary;
    return true;
  }

  function findConcreteDiscountRegion(address) {
    const text = normalizedText(address);
    if (!text) return null;
    return concreteUnitPriceTableR8_4_1.discounts.find((rule) => (
      rule.keywords.some((keyword) => text.includes(keyword))
    )) || null;
  }

  function concreteBaseUnitPrice(mix) {
    const aggregateTable = concreteUnitPriceTableR8_4_1.normal[mix.aggregate] || (mix.aggregateSpecified ? null : concreteUnitPriceTableR8_4_1.normal[20]);
    const strengthTable = aggregateTable?.[mix.strength];
    if (!strengthTable) return null;
    const slumpKey = formatConcreteNumber(mix.slump);
    const price = strengthTable[slumpKey];
    return Number.isFinite(price) ? price : null;
  }

  function isConcreteUnitPriceTarget(item) {
    if (item.type !== "item" || isAdjustmentItem(item) || isConcreteTotalLinkedItem(item)) return false;
    const name = normalizedItemName(item);
    if (name.includes("圧送") || name.includes("打設") || name.includes("試験") || name.includes("ポンプ") || name.includes("セメント") || name.includes("清掃") || name.includes("バイブレーター")) return false;
    return Boolean(parseConcreteMix(item));
  }

  function replaceConcretePriceRemark(remarks, nextRemark) {
    const parts = String(remarks || "")
      .split(/\s*\/\s*/)
      .map((part) => part.trim())
      .filter((part) => part && part !== concreteUnitPriceTableR8_4_1.source && !part.startsWith(`${concreteUnitPriceTableR8_4_1.source}:`));
    parts.push(nextRemark);
    return parts.join(" / ");
  }

  function syncConcreteUnitPrices(estimateState, options = {}) {
    const region = findConcreteDiscountRegion(estimateState.siteAddress);
    const stats = { applied: 0, unmatched: 0, skipped: 0, smallTruckApplied: 0, compressionTestApplied: 0, region };
    const sheets = options.sheet ? [options.sheet] : (estimateState.sheets || []);
    sheets.forEach((sheet) => {
      if (!sheet?.items?.length) return;
      const hasConcreteRows = isConcreteSheet(sheet) || sheet.items.some(isConcreteUnitPriceTarget) || sheet.items.some(isSmallMixerTruckItem) || sheet.items.some(isConcreteCompressionTestItem);
      if (!hasConcreteRows) return;
      sheet.items.forEach((item) => {
        if (isConcreteUnitPriceTarget(item)) normalizeConcreteItemSummary(item);
      });
      sheet.items.forEach((item) => {
        if (!isSmallMixerTruckItem(item)) return;
        item.price = concreteUnitPriceTableR8_4_1.surcharges.smallMixerTruck;
        item.unit = item.unit || "㎥";
        item.remarks = replaceConcretePriceRemark(item.remarks, `${concreteUnitPriceTableR8_4_1.source}: 小型車使用料 ${concreteUnitPriceTableR8_4_1.surcharges.smallMixerTruck.toLocaleString("ja-JP")}円`);
        stats.smallTruckApplied += 1;
      });
      sheet.items.forEach((item) => {
        if (!isConcreteCompressionTestItem(item)) return;
        applyConcreteCompressionTestPrice(item);
        stats.compressionTestApplied += 1;
      });
      if (!region) return;
      sheet.items.forEach((item) => {
        if (!isConcreteUnitPriceTarget(item)) return;
        const mix = parseConcreteMix(item);
        const basePrice = mix ? concreteBaseUnitPrice(mix) : null;
        if (!basePrice) {
          if (mix) {
            const unmatchedRemark = `${concreteUnitPriceTableR8_4_1.source}: ${mix.aggregate}mm FC${mix.strength} S${formatConcreteNumber(mix.slump)} 表に該当なし`;
            item.remarks = replaceConcretePriceRemark(item.remarks, unmatchedRemark);
          }
          stats.unmatched += 1;
          return;
        }
        const netPrice = Math.max(basePrice - region.amount, 0);
        item.price = netPrice;
        const matchedKeyword = region.keywords.find((keyword) => normalizedText(estimateState.siteAddress).includes(keyword)) || region.label;
        const remark = `${concreteUnitPriceTableR8_4_1.source}: ${matchedKeyword} ${region.amount.toLocaleString("ja-JP")}円引き ${mix.aggregate}mm FC${mix.strength} S${formatConcreteNumber(mix.slump)} 元${basePrice.toLocaleString("ja-JP")}円`;
        item.remarks = replaceConcretePriceRemark(item.remarks, remark);
        stats.applied += 1;
      });
    });
    return stats;
  }

  function concretePriceStatusMessage(stats) {
    const smallTruck = stats.smallTruckApplied ? ` 小型車使用料を${stats.smallTruckApplied}行へ反映しました。` : "";
    const compressionTest = stats.compressionTestApplied ? ` 圧縮試験費を${stats.compressionTestApplied}行へ反映しました。` : "";
    if (!stats.region) return `工事場所から生コン単価の値引き地域を判定できませんでした。住所を確認してください。${smallTruck}${compressionTest}`;
    if (!stats.applied) return `生コン単価表に一致する配合が見つかりませんでした。地域は「${stats.region.label}」、${stats.region.amount.toLocaleString("ja-JP")}円引きです。${smallTruck}${compressionTest}`;
    const extra = stats.unmatched ? ` ${stats.unmatched}行は配合が単価表に一致しませんでした。` : "";
    return `生コン単価を${stats.applied}行へ反映しました。地域は「${stats.region.label}」、${stats.region.amount.toLocaleString("ja-JP")}円引きです。${smallTruck}${compressionTest}${extra}`;
  }

  function syncConcreteTotals(estimateState) {
    if (!Array.isArray(estimateState.sheets)) return;
    estimateState.sheets.filter(isConcreteSheet).forEach((sheet) => {
      const concreteTotal = sheet.items
        .filter(isRowVisible)
        .filter(isConcreteQuantityItem)
        .reduce((sum, item) => sum + toNumber(item.qty), 0);
      sheet.items.forEach((item) => {
        if (!isConcreteTotalLinkedItem(item)) return;
        if (item.manualQty) return;
        item.qty = Number(concreteTotal.toFixed(2));
        item.unit = item.unit || "㎥";
      });
    });
  }

  function isFormworkBaseQuantityItem(item) {
    if (item.type !== "item" || isAdjustmentItem(item) || isFormworkTotalLinkedItem(item)) return false;
    const name = normalizedText(item.name);
    const unit = normalizedText(item.unit);
    if (name === "土間型枠") return false;
    return name.includes("型枠") && (unit === "㎡" || /^m2$/i.test(unit));
  }

  function isFormworkTotalLinkedItem(item) {
    const name = normalizedText(item.name);
    return item.type === "item" && (name === "運搬費" || name === "荷上費" || name === "荷揚げ費");
  }

  function isSlabFormworkItem(item) {
    return item.type === "item" && normalizedText(item.name) === "土間型枠";
  }

  function isCeilingInsertItem(item) {
    const name = normalizedText(item.name);
    const summary = normalizedText(item.summary);
    return item.type === "item" && name.includes("インサート") && summary.includes("天井");
  }

  function cleanupZeroInsertRows(sheet) {
    const hasCeilingInsert = sheet.items.some((item) => isCeilingInsertItem(item) && toNumber(item.qty) > 0);
    if (!hasCeilingInsert) return;
    sheet.items = sheet.items.filter((item) => {
      const name = normalizedText(item.name);
      const summary = normalizedText(item.summary);
      if (!name.includes("インサート")) return true;
      if (summary.includes("天井")) return true;
      return toNumber(item.qty) !== 0;
    });
  }

  function insulationAreaFromFormworkSheet(sheet) {
    const insulationRows = sheet.items.filter((item) => item.type === "item" && normalizedText(item.name).includes("断熱材"));
    for (const item of insulationRows) {
      const text = `${item.summary || ""} ${item.remarks || ""}`;
      const normalized = text.replace(/[０-９．]/g, (char) => {
        if (char === "．") return ".";
        return String.fromCharCode(char.charCodeAt(0) - 0xfee0);
      });
      const match = normalized.match(/断熱材面積\s*([0-9]+(?:\.[0-9]+)?)/) ||
        normalized.match(/面積\s*([0-9]+(?:\.[0-9]+)?)\s*㎡/);
      if (match) return Number(match[1]) || 0;
    }
    return 0;
  }

  function isCeilingInsulationItem(item) {
    const name = normalizedText(item.name);
    return item.type === "item" && name.includes("天井") && name.includes("断熱材");
  }

  function ceilingInsertQuantityForSheet(sheet) {
    return sheet.items
      .filter(isRowVisible)
      .filter(isCeilingInsertItem)
      .reduce((sum, item) => sum + toNumber(item.qty), 0);
  }

  function ceilingInsulationQuantity(insertQty) {
    const quantity = toNumber(insertQty);
    return quantity > 0 ? Math.ceil(quantity / 1.62) + 1 : 0;
  }

  function primaryCeilingInsulationItem(sheet) {
    const rows = sheet.items.filter(isCeilingInsulationItem);
    return rows.find((item) => isRowVisible(item) && toNumber(item.qty) > 0) ||
      rows.find((item) => normalizedText(item.category).includes("取り込み")) ||
      rows[0] ||
      null;
  }

  function syncFormworkTotals(estimateState) {
    if (!Array.isArray(estimateState.sheets)) return;
    estimateState.sheets.filter(isFormworkSheet).forEach((sheet) => {
      const insulationArea = insulationAreaFromFormworkSheet(sheet);
      const formworkTotal = sheet.items
        .filter(isRowVisible)
        .filter(isFormworkBaseQuantityItem)
        .reduce((sum, item) => sum + toNumber(item.qty), 0);
      sheet.items.forEach((item) => {
        if (isSlabFormworkItem(item)) {
          item.qty = 1;
          item.unit = "式";
          return;
        }
        if (!item.manualQty && insulationArea > 0 && isCeilingInsertItem(item)) {
          item.qty = Number(insulationArea.toFixed(2));
          item.unit = "㎡";
          if (String(item.remarks || "").includes("断熱材数量連動")) {
            item.remarks = "Excel取込:断熱材面積換算";
          }
          return;
        }
        if (isFormworkTotalLinkedItem(item)) {
          item.qty = Number(formworkTotal.toFixed(2));
          item.unit = "㎡";
        }
      });
      const ceilingInsertQty = ceilingInsertQuantityForSheet(sheet);
      const ceilingInsulationItem = primaryCeilingInsulationItem(sheet);
      if (ceilingInsulationItem && ceilingInsertQty > 0) {
        ceilingInsulationItem.qty = ceilingInsulationQuantity(ceilingInsertQty);
        ceilingInsulationItem.unit = "枚";
        ceilingInsulationItem.hidden = false;
        ceilingInsulationItem.remarks = "インサート金物数量÷1.62 小数点繰り上げ +1";
      }
      cleanupZeroInsertRows(sheet);
    });
  }

  function wireMeshLaborQuantityForSheet(sheet) {
    if (!sheet || !Array.isArray(sheet.items)) return 0;
    return sheet.items
      .filter(isWireMeshLaborItem)
      .reduce((sum, item) => sum + toNumber(item.qty), 0);
  }

  function wireMeshMaterialQuantity(laborQty) {
    return Math.floor(Math.max(toNumber(laborQty) / 7.2, 0));
  }

  function syncWireMeshQuantities(estimateState) {
    if (!Array.isArray(estimateState.sheets)) return;
    estimateState.sheets.forEach((sheet) => {
      const laborRows = sheet.items.filter(isWireMeshLaborItem);
      if (!laborRows.length) return;
      const laborQty = wireMeshLaborQuantityForSheet(sheet);
      let materialRows = sheet.items.filter(isWireMeshMaterialItem);
      if (!materialRows.length && isRebarSheet(sheet)) {
        const lastLaborIndex = Math.max(...laborRows.map((item) => sheet.items.indexOf(item)));
        const laborRow = laborRows[laborRows.length - 1];
        const materialRow = {
          type: "item",
          category: laborRow.category || "材料費",
          name: "ワイヤメッシュ",
          summary: "",
          qty: 0,
          unit: "枚",
          price: 0,
          remarks: "ワイヤメッシュ敷き手間数量÷7.2",
          printRemarks: "",
          hidden: false
        };
        sheet.items.splice(lastLaborIndex + 1, 0, materialRow);
        materialRows = [materialRow];
      }
      materialRows.forEach((item) => {
        item.qty = wireMeshMaterialQuantity(laborQty);
        item.unit = "枚";
        item.hidden = toNumber(item.qty) <= 0;
      });
    });
  }

  function syncQuantityLinks(estimateState) {
    const siteArea = toNumber(estimateState.siteArea);
    const buildingArea = toNumber(estimateState.buildingArea);
    const totalFloorArea = toNumber(estimateState.totalFloorArea);
    const plasterConcreteFinishQty = siteArea + buildingArea;
    if (!Array.isArray(estimateState.sheets)) return;
    estimateState.sheets.forEach((sheet) => {
      const externalScaffold = sheet.items.find(isExternalScaffoldItem);
      const externalScaffoldQty = externalScaffold ? toNumber(externalScaffold.qty) : 0;
      sheet.items.forEach((item) => {
        if (buildingArea > 0 && isSettingOutItem(item)) {
          item.qty = Number(buildingArea.toFixed(2));
          item.unit = item.unit || "㎡";
        }
        if (!item.manualQty && totalFloorArea > 0 && isFloorAreaLinkedItem(item)) {
          item.qty = Number(totalFloorArea.toFixed(2));
          item.unit = item.unit || "㎡";
        }
        if (!item.manualQty && externalScaffoldQty > 0 && isScaffoldInsertItem(item)) {
          item.qty = Number(externalScaffoldQty.toFixed(2));
          item.unit = item.unit || "㎡";
        }
        if (plasterConcreteFinishQty > 0 && isPlasterConcreteFinishItem(item)) {
          item.qty = Number(plasterConcreteFinishQty.toFixed(2));
          item.unit = "㎡";
        }
      });
    });
    syncConcreteTotals(estimateState);
    syncConcreteUnitPrices(estimateState);
    syncFormworkTotals(estimateState);
    syncWireMeshQuantities(estimateState);
    syncAllZeroQuantityVisibility(estimateState.sheets);
    syncAdjustmentRows(estimateState);
  }

  function createUeharaEstimateState() {
    const next = clone(defaults);
    next.clientName = "上原 様";
    next.projectName = "上原邸新築工事";
    next.siteAddress = "豊見城市字我那覇蔵無地原436-21";
    next.siteArea = ueharaAreas.siteArea;
    next.buildingArea = ueharaAreas.buildingArea;
    next.totalFloorArea = ueharaAreas.totalFloorArea;
    next.estimateMode = "byTrade";
    next.notes = [
      "棚原工務店 上原邸PDFより鉄筋工事を取り込み。",
      "普久原工業PDFより仮設工事を取り込み。",
      "台風時、台風対策は別途常用となります。",
      "見積り外の足場等は、相談のうえ別途となります。"
    ].join("\n");
    next.sheets = tradePresets.map((trade) => ({
      name: trade.name,
      items: trade.name === "仮設工事"
        ? clone(ueharaTemporaryItems)
        : trade.name === "鉄筋工事"
          ? clone(ueharaEstimateItems)
          : []
    }));
    next.activeSheetIndex = Math.max(0, next.sheets.findIndex((sheet) => sheet.name === "仮設工事"));
    return next;
  }

  function mergeUeharaTemporaryItems(sheet) {
    if (!sheet.items.some((item) => item.type === "section" && item.category === "取り込み")) {
      sheet.items.unshift(clone(ueharaTemporaryItems[0]));
    }
    ueharaTemporaryItems
      .filter((item) => item.type === "item")
      .forEach((item) => {
        const existing = sheet.items.find((current) => (
          current.type === "item" &&
          current.name === item.name &&
          current.summary === item.summary
        ));
        if (existing && isAdjustmentItem(item)) {
          if (amount(existing) === 0 && existing.remarks === "工種ごとの金額調整") {
            Object.assign(existing, clone(item), { hidden: false });
          }
          return;
        }
        if (!existing) sheet.items.push(clone(item));
      });
  }

  function restoreUeharaTemporaryContent(estimateState) {
    if (!(estimateState.projectName || "").includes("上原")) return normalizeState(estimateState);
    const next = normalizeState(estimateState);
    if (!next.clientName || next.clientName.includes("知花") || next.clientName.includes("御中")) {
      next.clientName = "上原 様";
    }
    next.siteAddress = next.siteAddress || "豊見城市字我那覇蔵無地原436-21";
    next.siteArea = next.siteArea || ueharaAreas.siteArea;
    next.buildingArea = next.buildingArea || ueharaAreas.buildingArea;
    next.totalFloorArea = next.totalFloorArea || ueharaAreas.totalFloorArea;
    next.estimateMode = "byTrade";
    tradePresets.forEach((trade) => {
      if (!next.sheets.some((sheet) => sheet.name === trade.name)) {
        next.sheets.push({ name: trade.name, items: [] });
      }
    });
    const temporarySheet = next.sheets.find((sheet) => sheet.name === "仮設工事");
    mergeUeharaTemporaryItems(temporarySheet);
    if (String(next.notes ?? "").trim()) {
    const noteAdditions = [
      "普久原工業PDFより仮設工事を取り込み。",
      "見積書20260619 PDFより外部足場以外の仮設工事明細を取り込み。",
      "台風時、台風対策は別途常用となります。",
      "見積り外の足場等は、相談のうえ別途となります。"
    ];
    const currentNotes = next.notes || "";
    next.notes = [currentNotes, ...noteAdditions.filter((line) => !currentNotes.includes(line))].filter(Boolean).join("\n");
    }
    next.activeSheetIndex = Math.max(0, next.sheets.findIndex((sheet) => sheet.name === "仮設工事"));
    return next;
  }

  const fields = [
    "quoteNo", "issueDate", "clientName", "projectName", "siteAddress", "siteArea", "buildingArea", "totalFloorArea", "period", "validUntil",
    "companyName", "companyAddress", "companyPhone", "companyPerson", "paymentTerms",
    "taxRate", "commonTemporaryCost", "siteManagementRate", "generalManagementRate", "discount", "netAmount", "notes"
  ];

  const $ = (id) => document.getElementById(id);
  let estimateBook = loadEstimateBook();
  let state = activeEstimateRecord().state;
  let dataFileHandle = null;
  let dataFileName = "";
  let dataSaveTimer = null;
  let isWritingDataFile = false;
  let pendingImportTradeName = "";
  let lastConcreteReadSummary = [];
  let vendorPdfSession = null;
  let vendorPdfResolve = null;
  let vendorSelectionDraft = null;
  let pendingItemFocus = null;

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function loadState() {
    try {
      const saved = JSON.parse(localStorage.getItem(storageKey));
      if (saved) return normalizeState(saved);
      for (const key of legacyKeys) {
        const legacy = JSON.parse(localStorage.getItem(key));
        if (legacy) return normalizeState(legacy);
      }
    } catch (error) {
      return clone(defaults);
    }
    return clone(defaults);
  }

  function makeEstimateId() {
    return `site-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  }

  function estimateLabel(estimateState) {
    const name = (estimateState.projectName || estimateState.clientName || estimateState.quoteNo || "").trim();
    return name || "新規現場";
  }

  function createEstimateRecord(estimateState) {
    const normalized = normalizeState(estimateState || clone(defaults));
    return {
      id: makeEstimateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      state: normalized
    };
  }

  function loadEstimateBook() {
    try {
      const saved = JSON.parse(localStorage.getItem(bookStorageKey));
      if (saved && Array.isArray(saved.estimates) && saved.estimates.length) {
        const estimates = saved.estimates.map((record) => ({
          id: record.id || makeEstimateId(),
          createdAt: record.createdAt || new Date().toISOString(),
          updatedAt: record.updatedAt || new Date().toISOString(),
          state: restoreUeharaTemporaryContent(record.state || defaults)
        }));
        const hasUehara = estimates.some((record) => (record.state.projectName || "").includes("上原"));
        let restoredUeharaId = "";
        if (!hasUehara) {
          const ueharaRecord = createEstimateRecord(createUeharaEstimateState());
          estimates.push(ueharaRecord);
          restoredUeharaId = ueharaRecord.id;
        }
        const activeId = restoredUeharaId || (estimates.some((record) => record.id === saved.activeId) ? saved.activeId : estimates[0].id);
        return { activeId, estimates };
      }
    } catch (error) {
      // Fall back to the single-estimate storage below.
    }
    const first = createEstimateRecord(loadState());
    const ueharaRecord = createEstimateRecord(createUeharaEstimateState());
    return { activeId: ueharaRecord.id, estimates: [first, ueharaRecord] };
  }

  function normalizeState(value) {
    const next = { ...clone(defaults), ...value };
    if (!Array.isArray(next.sheets) || next.sheets.length === 0) {
      next.sheets = [{ name: "簡易見積", items: Array.isArray(value.items) ? value.items : clone(defaultItems) }];
    }
    next.sheets = next.sheets.map((sheet, index) => ({
      name: sheet.name || (index === 0 ? "簡易見積" : `工種${index + 1}`),
      suppressConcreteTemplate: Boolean(sheet.suppressConcreteTemplate),
      manualRowOrder: Boolean(sheet.manualRowOrder),
      items: Array.isArray(sheet.items) ? sheet.items.map((item) => ({
        ...item,
        printRemarks: item.printRemarks || "",
        priceFormula: item.priceFormula || "",
        hidden: Boolean(item.hidden),
        manualVisibility: Boolean(item.manualVisibility)
      })) : []
    }));
    ensureConcreteTemplateRows(next.sheets);
    ensureConcreteBlockTemplateRows(next.sheets);
    ensureEarthworkTemplateRows(next.sheets);
    ensureFormworkTemplateRows(next.sheets);
    ensurePlasterTemplateRows(next.sheets);
    ensureMetalTemplateRows(next.sheets);
    ensureAdjustmentRows(next.sheets);
    syncAllZeroQuantityVisibility(next.sheets);
    syncQuantityLinks(next);
    next.activeSheetIndex = Math.min(Math.max(Number(next.activeSheetIndex) || 0, 0), next.sheets.length - 1);
    next.estimateMode = next.estimateMode === "byTrade" ? "byTrade" : "simple";
    delete next.items;
    return next;
  }

  function saveState() {
    const record = activeEstimateRecord();
    record.state = state;
    record.updatedAt = new Date().toISOString();
    localStorage.setItem(bookStorageKey, JSON.stringify(estimateBook));
    localStorage.setItem(storageKey, JSON.stringify(state));
    try {
      rememberSaveBackup(JSON.stringify(dataFilePayload(), null, 2));
    } catch (error) {
      // The normal browser save still remains available if backup storage is full.
    }
    scheduleDataFileAutosave();
  }

  function dataFilePayload() {
    const record = activeEstimateRecord();
    record.state = state;
    record.updatedAt = new Date().toISOString();
    return {
      app: "mitsumori_app",
      version: 1,
      savedAt: new Date().toISOString(),
      book: {
        activeId: estimateBook.activeId,
        estimates: estimateBook.estimates.map((item) => ({
          id: item.id || makeEstimateId(),
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString(),
          state: normalizeState(item.state || defaults)
        }))
      }
    };
  }

  function setDataFileStatus(message) {
    const status = $("dataFileStatus");
    if (status) status.textContent = message;
  }

  function scheduleDataFileAutosave() {
    if (isWritingDataFile) return;
    clearTimeout(dataSaveTimer);
    dataSaveTimer = setTimeout(() => {
      saveDataFile({ silent: true }).catch(() => {
        setDataFileStatus("Dropbox共有データ: 自動保存できませんでした。手動保存してください。");
      });
    }, 900);
  }

  async function ensureFilePermission(handle, mode = "readwrite") {
    if (!handle || !handle.queryPermission || !handle.requestPermission) return true;
    const options = { mode };
    if (await handle.queryPermission(options) === "granted") return true;
    return await handle.requestPermission(options) === "granted";
  }

  function assertValidDataFileContent(text) {
    if (!text || !text.trim()) throw new Error("Saved data is empty");
    const payload = JSON.parse(text);
    const book = payload.book || payload;
    if (!Array.isArray(book.estimates) || !book.estimates.length) {
      throw new Error("Saved data has no estimates");
    }
  }

  function rememberSaveBackup(content) {
    try {
      localStorage.setItem(saveBackupKey, content);
    } catch (error) {
      // File saving still proceeds even when browser storage is unavailable.
    }
  }

  async function verifySavedDataFile(handle, expectedContent) {
    const file = await handle.getFile();
    const savedContent = await file.text();
    assertValidDataFileContent(savedContent);
    if (savedContent !== expectedContent) {
      throw new Error("Saved data verification failed");
    }
  }

  async function loadDataFile() {
    if (window.showOpenFilePicker) {
      try {
        const [handle] = await window.showOpenFilePicker({
          multiple: false,
          types: [{
            description: "見積データ",
            accept: { "application/json": [".json"] }
          }]
        });
        await loadDataFileHandle(handle);
        return;
      } catch (error) {
        if (error?.name === "AbortError") throw error;
        openDataFileInput("Dropbox共有データ: ファイル選択で見積データを選んでください。");
        return;
      }
    }
    openDataFileInput("Dropbox共有データ: ファイル選択で見積データを選んでください。");
  }

  function openDataFileInput(message = "") {
    const input = $("dataFileInput");
    if (!input) throw new Error("ファイル選択欄が見つかりません。");
    if (message) setDataFileStatus(message);
    input.click();
  }

  async function loadDataFileHandle(handle) {
    const file = await handle.getFile();
    await loadDataFileText(await file.text(), file.name);
    dataFileHandle = handle;
    dataFileName = file.name;
    setDataFileStatus(`Dropbox共有データ: ${dataFileName} を使用中（変更時に自動保存）`);
    await ensureFilePermission(handle, "readwrite");
  }

  async function loadDataFileText(text, fileName = "見積データ.json") {
    const payload = JSON.parse(text);
    const book = payload.book || payload;
    if (!Array.isArray(book.estimates) || !book.estimates.length) {
      throw new Error("見積データが見つかりません。");
    }
    estimateBook = {
      activeId: book.activeId || book.estimates[0].id,
      estimates: book.estimates.map((item) => ({
        id: item.id || makeEstimateId(),
        createdAt: item.createdAt || new Date().toISOString(),
        updatedAt: item.updatedAt || new Date().toISOString(),
        state: normalizeState(item.state || defaults)
      }))
    };
    if (!estimateBook.estimates.some((item) => item.id === estimateBook.activeId)) {
      estimateBook.activeId = estimateBook.estimates[0].id;
    }
    state = activeEstimateRecord().state;
    saveState();
    render();
    setDataFileStatus(`Dropbox共有データ: ${fileName} を読み込みました`);
  }

  async function loadBundledDataFile() {
    if (window.location.protocol === "file:") {
      openDataFileInput("Dropbox共有データ: mitsumori_data.json を選択してください。");
      return;
    }
    const response = await fetch("api/latest-data", { cache: "no-store" }).catch(() => null)
      || await fetch("mitsumori_data.json", { cache: "no-store" });
    if (!response.ok) {
      throw new Error("保存済みデータが見つかりません");
    }
    await loadDataFileText(await response.text(), "mitsumori_data.json");
    dataFileHandle = null;
    dataFileName = "mitsumori_data.json";
    setDataFileStatus("Dropbox共有データ: 保存済みデータを読み込みました");
  }

  function canUseLocalSaveServer() {
    return window.location.protocol === "http:" || window.location.protocol === "https:";
  }

  async function saveDataFileToLocalServer(content) {
    const response = await fetch("api/save-data", {
      method: "POST",
      headers: { "Content-Type": "application/json;charset=utf-8" },
      body: content,
      cache: "no-store"
    });
    if (!response.ok) {
      const message = await response.text().catch(() => "");
      throw new Error(message || "保存サーバーに接続できません");
    }
    return response.json().catch(() => ({}));
  }

  function timestampedDataFileName() {
    const now = new Date();
    const pad = (value) => String(value).padStart(2, "0");
    return `mitsumori_data_${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}.json`;
  }

  async function saveDataFile(options = {}) {
    const { saveAs = false, silent = false } = options;
    const content = JSON.stringify(dataFilePayload(), null, 2);
    assertValidDataFileContent(content);
    rememberSaveBackup(content);
    if (saveAs) {
      downloadFile(content, timestampedDataFileName(), "application/json;charset=utf-8");
      if (!silent) setDataFileStatus("Dropbox共有データ: 別名JSONを作成しました。");
      return;
    }
    if (canUseLocalSaveServer()) {
      try {
        isWritingDataFile = true;
        const result = await saveDataFileToLocalServer(content);
        dataFileName = result.fileName || "mitsumori_data.json";
        if (!silent) setDataFileStatus("Dropbox共有データ: 安全保存しました。");
        return;
      } catch (error) {
        if (!silent) {
          downloadFile(content, timestampedDataFileName(), "application/json;charset=utf-8");
          setDataFileStatus("Dropbox共有データ: アプリ内バックアップへ保存しました。安全保存版URLから開いてください。");
        }
        return;
      } finally {
        isWritingDataFile = false;
      }
    }
    if (!silent) setDataFileStatus("Dropbox共有データ: アプリ内バックアップへ保存しました。安全保存版URLから開いてください。");
  }

  function activeEstimateRecord() {
    let record = estimateBook.estimates.find((item) => item.id === estimateBook.activeId);
    if (!record) {
      record = estimateBook.estimates[0] || createEstimateRecord(defaults);
      if (!estimateBook.estimates.length) estimateBook.estimates.push(record);
      estimateBook.activeId = record.id;
    }
    return record;
  }

  function yen(value) {
    return `${Math.round(Number(value) || 0).toLocaleString("ja-JP")}円`;
  }

  function formatNumber(value) {
    return Number(value || 0).toLocaleString("ja-JP", { maximumFractionDigits: 2 });
  }

  function toNumber(value) {
    return Number(normalizeNumericInput(value)) || 0;
  }

  function amount(item) {
    return toNumber(item.qty) * toNumber(item.price);
  }

  function lineAmount(item) {
    return Math.round(amount(item));
  }

  function tsuboFromSquareMeters(value) {
    const squareMeters = toNumber(value);
    return squareMeters > 0 ? squareMeters / 3.305785 : 0;
  }

  function isRowVisible(item) {
    return item.hidden !== true;
  }

  function visibleItems(sheet) {
    return sheet.items.filter(isRowVisible);
  }

  function billableItems(sheet) {
    return visibleItems(sheet).filter((item) => item.type === "item");
  }

  function activeSheet() {
    return state.sheets[state.activeSheetIndex] || state.sheets[0];
  }

  function visibleSheets() {
    return state.estimateMode === "simple" ? [state.sheets[0]] : state.sheets;
  }

  function subtotalForSheet(sheet) {
    return billableItems(sheet).reduce((sum, item) => sum + lineAmount(item), 0);
  }

  function subtotalBeforeAdjustment(sheet) {
    return billableItems(sheet)
      .filter((item) => !isAdjustmentItem(item))
      .reduce((sum, item) => sum + lineAmount(item), 0);
  }

  function syncAdjustmentRows(estimateState) {
    if (!Array.isArray(estimateState.sheets)) return;
    estimateState.sheets.forEach((sheet) => {
      const adjustment = sheet.items.find(isAdjustmentItem);
      if (!adjustment) return;
      const base = subtotalBeforeAdjustment(sheet);
      const roundedDown = Math.floor(base / 1000) * 1000;
      adjustment.category = "調整";
      adjustment.name = "調整";
      adjustment.summary = "";
      adjustment.qty = 1;
      adjustment.unit = "式";
      adjustment.price = roundedDown - base;
      adjustment.remarks = "下三桁切り捨て";
      adjustment.hidden = false;
    });
  }

  function totalPartsForManagement(pure, siteManagement, generalManagementRate, discountValue, taxRate) {
    const cost = pure + siteManagement;
    const generalManagement = Math.round(cost * (generalManagementRate / 100));
    const beforeDiscount = pure + siteManagement + generalManagement;
    const discount = Math.min(discountValue, beforeDiscount);
    const taxable = Math.max(beforeDiscount - discount, 0);
    const tax = Math.round(taxable * (taxRate / 100));
    const total = taxable + tax;
    return { cost, generalManagement, beforeDiscount, discount, taxable, tax, total };
  }

  function hasManualNetAmount() {
    return String(state.netAmount ?? "").trim() !== "";
  }

  function totals() {
    const subtotal = visibleSheets().reduce((sum, sheet) => sum + subtotalForSheet(sheet), 0);
    const commonTemporaryCost = toNumber(state.commonTemporaryCost);
    const siteManagementRate = toNumber(state.siteManagementRate);
    const generalManagementRate = toNumber(state.generalManagementRate);
    const taxRate = toNumber(state.taxRate);
    const discountValue = toNumber(state.discount);
    const pure = subtotal + commonTemporaryCost;
    const baseSiteManagement = Math.round(pure * (siteManagementRate / 100));
    let siteManagement = baseSiteManagement;
    let parts = totalPartsForManagement(pure, siteManagement, generalManagementRate, discountValue, taxRate);
    const rawTotal = parts.total;
    const net = hasManualNetAmount() ? toNumber(state.netAmount) : parts.total;
    const netRule = hasManualNetAmount() ? "manual" : "total";
    const floorAreaTsubo = tsuboFromSquareMeters(state.totalFloorArea);
    const tsuboUnitPrice = floorAreaTsubo > 0 ? Math.round(parts.total / floorAreaTsubo) : 0;
    return {
      subtotal,
      commonTemporaryCost,
      pure,
      siteManagementRate,
      baseSiteManagement,
      siteManagement,
      cost: parts.cost,
      generalManagementRate,
      generalManagement: parts.generalManagement,
      beforeDiscount: parts.beforeDiscount,
      discount: parts.discount,
      taxable: parts.taxable,
      tax: parts.tax,
      total: parts.total,
      coverTotal: rawTotal,
      rawTotal,
      netRule,
      net,
      floorAreaTsubo,
      tsuboUnitPrice
    };
  }

  function bindFields() {
    fields.forEach((id) => {
      const input = $(id);
      input.value = state[id] ?? "";
      input.addEventListener("input", () => {
        state[id] = input.value;
        render();
      });
    });

    $("useStamp").checked = Boolean(state.useStamp);
    $("useStamp").addEventListener("change", () => {
      state.useStamp = $("useStamp").checked;
      render();
    });

    $("modeSimple").addEventListener("change", () => setMode("simple"));
    $("modeByTrade").addEventListener("change", () => setMode("byTrade"));
    $("sheetName").addEventListener("input", () => {
      activeSheet().name = $("sheetName").value;
      render();
    });
    $("projectSelect").addEventListener("change", () => switchEstimate($("projectSelect").value));
    $("newProjectButton").addEventListener("click", addEstimate);
    $("duplicateProjectButton").addEventListener("click", duplicateEstimate);
    $("deleteProjectButton").addEventListener("click", deleteEstimate);
  }

  function switchEstimate(id) {
    if (!id || id === estimateBook.activeId) return;
    saveState();
    estimateBook.activeId = id;
    state = activeEstimateRecord().state;
    render();
    $("projectStatus").textContent = "現場を切り替えました。";
  }

  function addEstimate() {
    saveState();
    const next = clone(defaults);
    next.projectName = "新規現場";
    next.clientName = "";
    next.quoteNo = `Q-${today.getFullYear()}${pad(today.getMonth() + 1)}${pad(today.getDate())}-${String(estimateBook.estimates.length + 1).padStart(3, "0")}`;
    const record = createEstimateRecord(next);
    estimateBook.estimates.push(record);
    estimateBook.activeId = record.id;
    state = record.state;
    render();
    $("projectStatus").textContent = "新しい現場見積を作成しました。";
  }

  function duplicateEstimate() {
    saveState();
    const next = clone(state);
    next.projectName = `${estimateLabel(state)} コピー`;
    const record = createEstimateRecord(next);
    estimateBook.estimates.push(record);
    estimateBook.activeId = record.id;
    state = record.state;
    render();
    $("projectStatus").textContent = "現在の現場見積を複製しました。";
  }

  function deleteEstimate() {
    if (estimateBook.estimates.length <= 1) {
      $("projectStatus").textContent = "最後の現場見積は削除できません。";
      return;
    }
    if (!confirm("現在の現場見積を削除しますか？")) return;
    const index = estimateBook.estimates.findIndex((record) => record.id === estimateBook.activeId);
    estimateBook.estimates.splice(index, 1);
    const next = estimateBook.estimates[Math.max(0, index - 1)] || estimateBook.estimates[0];
    estimateBook.activeId = next.id;
    state = next.state;
    render();
    $("projectStatus").textContent = "現場見積を削除しました。";
  }

  function renderEstimateSwitcher() {
    const select = $("projectSelect");
    const current = select.value || estimateBook.activeId;
    select.innerHTML = estimateBook.estimates.map((record, index) => {
      const label = `${index + 1}. ${estimateLabel(record.state)}`;
      return `<option value="${escapeAttr(record.id)}">${escapeHtml(label)}</option>`;
    }).join("");
    select.value = estimateBook.estimates.some((record) => record.id === current) ? current : estimateBook.activeId;
    $("deleteProjectButton").disabled = estimateBook.estimates.length <= 1;
    $("projectStatus").textContent = `現場見積 ${estimateBook.estimates.length}件を保存中です。`;
  }

  function setMode(mode) {
    state.estimateMode = mode;
    if (mode === "simple") state.activeSheetIndex = 0;
    render();
  }

  function renderMode() {
    $("modeSimple").checked = state.estimateMode === "simple";
    $("modeByTrade").checked = state.estimateMode === "byTrade";
    $("sheetTools").style.display = state.estimateMode === "byTrade" ? "grid" : "none";
    $("addSheetButton").style.display = state.estimateMode === "byTrade" ? "inline-block" : "none";
    $("resetConcreteTemplateButton").style.display = isConcreteSheet(activeSheet()) ? "inline-block" : "none";
    $("applyConcretePriceButton").style.display = isConcreteSheet(activeSheet()) ? "inline-block" : "none";
    $("resetConcreteBlockTemplateButton").style.display = isConcreteBlockSheet(activeSheet()) ? "inline-block" : "none";
    $("resetEarthworkTemplateButton").style.display = isEarthworkSheet(activeSheet()) ? "inline-block" : "none";
    $("resetFormworkTemplateButton").style.display = isFormworkSheet(activeSheet()) ? "inline-block" : "none";
    $("resetPlasterTemplateButton").style.display = isPlasterSheet(activeSheet()) ? "inline-block" : "none";
    $("resetMetalTemplateButton").style.display = isMetalSheet(activeSheet()) ? "inline-block" : "none";
  }

  function renderSheetTabs() {
    const tabs = $("sheetTabs");
    tabs.innerHTML = "";
    state.sheets.forEach((sheet, index) => {
      const tab = document.createElement("div");
      tab.className = `sheet-tab ${index === state.activeSheetIndex ? "active" : ""}`;

      const button = document.createElement("button");
      button.type = "button";
      button.textContent = sheet.name || `工種${index + 1}`;
      button.className = "sheet-tab-select";
      button.addEventListener("click", () => {
        state.activeSheetIndex = index;
        render();
      });

      const deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.className = "sheet-tab-delete";
      deleteButton.textContent = "×";
      deleteButton.title = `${sheet.name || `工種${index + 1}`}を削除`;
      deleteButton.setAttribute("aria-label", `${sheet.name || `工種${index + 1}`}シートを削除`);
      deleteButton.disabled = state.sheets.length <= 1;
      deleteButton.addEventListener("click", () => deleteSheetAt(index));

      tab.append(button, deleteButton);
      tabs.appendChild(tab);
    });
    $("sheetName").value = activeSheet().name;
    $("deleteSheetButton").disabled = state.sheets.length <= 1;
    renderImportTargetOptions();
  }

  function renderImportTargetOptions() {
    const select = $("importTargetTrade");
    const current = select.value;
    const names = Array.from(new Set([...tradePresets.map((trade) => trade.name), ...state.sheets.map((sheet) => sheet.name), "未分類"]));
    select.innerHTML = '<option value="">自動判定</option>' + names.map((name) => `<option value="${escapeAttr(name)}">${escapeHtml(name)}</option>`).join("");
    select.value = names.includes(current) ? current : "";
  }

  function renderItems() {
    syncWireMeshQuantities({ sheets: [activeSheet()] });
    const body = $("itemsBody");
    body.innerHTML = "";
    activeSheet().items.forEach((item, index) => {
      const tr = document.createElement("tr");
      tr.dataset.index = String(index);
      const rowVisible = isRowVisible(item);
      const quantityFormula = quantityFormulaForItem(item);
      const priceFormula = priceFormulaForItem(item);
      const qtyCellClass = ["qty-cell", quantityFormula ? "has-formula" : ""].filter(Boolean).join(" ");
      const priceCellClass = ["price-cell", priceFormula ? "has-formula" : ""].filter(Boolean).join(" ");
      tr.className = [item.type === "section" ? "section-row" : "", rowVisible ? "" : "is-hidden"].filter(Boolean).join(" ");
      tr.innerHTML = `
        <td><input data-key="category" value="${escapeAttr(item.category)}" aria-label="区分"></td>
        <td><input data-key="name" value="${escapeAttr(item.name)}" aria-label="名称"></td>
        <td><input data-key="summary" value="${escapeAttr(item.summary)}" aria-label="概要"></td>
        <td class="${qtyCellClass}">
          <input class="small" data-key="qty" type="text" inputmode="decimal" value="${escapeAttr(item.qty)}" aria-label="数量">
          <div class="qty-formula" role="note">${escapeHtml(quantityFormula)}</div>
        </td>
        <td><input class="small" data-key="unit" value="${escapeAttr(item.unit)}" aria-label="単位"></td>
        <td class="${priceCellClass}">
          <input class="money" data-key="price" type="text" inputmode="numeric" value="${escapeAttr(item.price)}" aria-label="単価">
          <div class="price-formula" role="note">${escapeHtml(priceFormula)}</div>
        </td>
        <td class="line-amount">${item.type === "item" ? (rowVisible ? yen(lineAmount(item)) : "対象外") : ""}</td>
        <td><input data-key="printRemarks" value="${escapeAttr(item.printRemarks)}" aria-label="印刷備考"></td>
        <td><input data-key="remarks" value="${escapeAttr(item.remarks)}" aria-label="備考"></td>
        <td class="row-actions">
          <button type="button" class="move-button move-up" title="上へ" ${index === 0 ? "disabled" : ""}>↑</button>
          <button type="button" class="move-button move-down" title="下へ" ${index === activeSheet().items.length - 1 ? "disabled" : ""}>↓</button>
          <button type="button" class="visibility-button" title="${rowVisible ? "計算から外して隠す" : "表示して計算に入れる"}">${rowVisible ? "隠す" : "表示"}</button>
          <button type="button" class="remove-button" title="削除">x</button>
        </td>
      `;
      if (isAdjustmentItem(item)) {
        ["qty", "unit", "price", "remarks", "printRemarks"].forEach((key) => {
          const adjustmentInput = tr.querySelector(`[data-key="${key}"]`);
          if (!adjustmentInput) return;
          adjustmentInput.readOnly = true;
          adjustmentInput.title = "自動計算";
        });
      }
      tr.querySelectorAll("input").forEach((input) => {
        input.addEventListener("focus", () => {
          input.dataset.focusValue = input.value;
          delete input.dataset.directInputDirty;
        });
        input.addEventListener("input", () => {
          delete input.dataset.skipNextChangeAdjust;
          input.dataset.directInputDirty = "1";
          commitDetailInput(input, { adjustDirectConcreteQty: false });
          refreshDetailRowTotals(tr);
        });
        input.addEventListener("change", () => {
          const skipNextChangeAdjust = input.dataset.skipNextChangeAdjust === "1";
          delete input.dataset.skipNextChangeAdjust;
          commitDetailInput(input, { adjustDirectConcreteQty: !skipNextChangeAdjust });
          input.dataset.focusValue = input.value;
          delete input.dataset.directInputDirty;
          refreshDetailRowTotals(tr);
          saveState();
        });
        input.addEventListener("keydown", (event) => {
          if (event.key !== "Enter") return;
          event.preventDefault();
          const valueChanged = input.dataset.directInputDirty === "1" || input.value !== input.dataset.focusValue;
          commitDetailInput(input, { adjustDirectConcreteQty: valueChanged });
          if (input.dataset.key === "qty" && valueChanged) input.dataset.skipNextChangeAdjust = "1";
          input.dataset.focusValue = input.value;
          delete input.dataset.directInputDirty;
          refreshDetailRowTotals(tr);
          saveState();
          focusNextDetailInput(input);
        });
      });
      tr.querySelector(".remove-button").addEventListener("click", () => {
        activeSheet().items.splice(index, 1);
        render();
      });
      tr.querySelector(".visibility-button").addEventListener("click", () => {
        item.hidden = rowVisible;
        item.manualVisibility = true;
        render();
      });
      tr.querySelector(".move-up").addEventListener("click", () => moveItem(index, -1));
      tr.querySelector(".move-down").addEventListener("click", () => moveItem(index, 1));
      body.appendChild(tr);
    });
    const subtotalRow = document.createElement("tr");
    subtotalRow.className = "sheet-subtotal-row";
    subtotalRow.innerHTML = `
      <td colspan="6"></td>
      <td class="subtotal-label">小計</td>
      <td class="subtotal-value">${yen(subtotalForSheet(activeSheet()))}</td>
      <td></td>
      <td></td>
    `;
    body.appendChild(subtotalRow);
  }

  function commitDetailInput(input, options = {}) {
    const row = input.closest("tr[data-index]");
    const item = activeSheet().items[Number(row?.dataset.index)];
    if (!item) return;
    const key = input.dataset.key;
    let value = input.value;
    if (["qty", "price"].includes(key)) {
      value = normalizeNumericInput(value);
    }
    if (key === "qty") item.manualQty = true;
    if (key === "price") item.priceFormula = "";
    item[key] = value;
    if (key === "qty" && options.adjustDirectConcreteQty !== false && applyDirectConcreteQuantityAdjustment(item, value)) {
      input.value = item.qty;
    }
    if (isConcreteCompressionTestItem(item) && (key === "summary" || key === "name")) {
      applyConcreteCompressionTestPrice(item);
    }
    if (key === "qty" && item.type === "item" && !isAdjustmentItem(item) && !item.manualVisibility) {
      item.hidden = toNumber(item.qty) <= 0;
    }
  }

  function normalizeNumericInput(value) {
    return String(value || "")
      .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
      .replace(/[，、]/g, ",")
      .replace(/[．。]/g, ".")
      .replace(/[－−ー]/g, "-")
      .replace(/,/g, "")
      .replace(/[^\d.-]/g, "");
  }

  function refreshDetailRowTotals(row) {
    syncQuantityLinks(state);
    const rows = Array.from($("itemsBody")?.querySelectorAll("tr[data-index]") || []);
    rows.forEach((detailRowElement) => {
      const item = activeSheet().items[Number(detailRowElement.dataset.index)];
      if (!item) return;
      if (isAdjustmentItem(item)) {
        detailRowElement.querySelector('[data-key="qty"]').value = item.qty;
        detailRowElement.querySelector('[data-key="unit"]').value = item.unit;
        detailRowElement.querySelector('[data-key="price"]').value = item.price;
        detailRowElement.querySelector('[data-key="remarks"]').value = item.remarks;
      }
      if (isConcreteCompressionTestItem(item)) {
        ["qty", "unit", "price", "remarks"].forEach((key) => {
          const input = detailRowElement.querySelector(`[data-key="${key}"]`);
          if (input && document.activeElement !== input) input.value = item[key] ?? "";
        });
      }
      if (isWireMeshMaterialItem(item)) {
        ["qty", "unit"].forEach((key) => {
          const input = detailRowElement.querySelector(`[data-key="${key}"]`);
          if (input && document.activeElement !== input) input.value = item[key] ?? "";
        });
      }
      const rowVisible = isRowVisible(item);
      detailRowElement.className = [item.type === "section" ? "section-row" : "", rowVisible ? "" : "is-hidden"].filter(Boolean).join(" ");
      const visibilityButton = detailRowElement.querySelector(".visibility-button");
      if (visibilityButton) {
        visibilityButton.title = rowVisible ? "計算から外して隠す" : "表示して計算に入れる";
        visibilityButton.textContent = rowVisible ? "隠す" : "表示";
      }
      const lineAmountCell = detailRowElement.querySelector(".line-amount");
      if (lineAmountCell) {
        lineAmountCell.textContent = item.type === "item" ? (rowVisible ? yen(lineAmount(item)) : "対象外") : "";
      }
      const qtyCell = detailRowElement.querySelector(".qty-cell");
      const formulaElement = detailRowElement.querySelector(".qty-formula");
      if (qtyCell && formulaElement) {
        const quantityFormula = quantityFormulaForItem(item);
        formulaElement.textContent = quantityFormula;
        qtyCell.classList.toggle("has-formula", Boolean(quantityFormula));
      }
      const priceCell = detailRowElement.querySelector(".price-cell");
      const priceFormulaElement = detailRowElement.querySelector(".price-formula");
      if (priceCell && priceFormulaElement) {
        const priceFormula = priceFormulaForItem(item);
        priceFormulaElement.textContent = priceFormula;
        priceCell.classList.toggle("has-formula", Boolean(priceFormula));
      }
    });
    const subtotalValue = $("itemsBody")?.querySelector(".subtotal-value");
    if (subtotalValue) subtotalValue.textContent = yen(subtotalForSheet(activeSheet()));
    renderSummary();
  }

  function quantityFormulaForItem(item) {
    if (!item || item.type !== "item") return "";
    const remarkFormulas = String(item.remarks || "")
      .split(/\s*\/\s*/)
      .map((part) => part.trim())
      .filter((part) => part.startsWith("数量補正:") || part.startsWith("直接入力数量補正:"));
    if (remarkFormulas.length) return remarkFormulas.join("\n");
    const inferredConcreteFormula = inferredExistingConcreteQuantityFormula(item);
    if (inferredConcreteFormula) return inferredConcreteFormula;
    const wireMeshFormula = wireMeshQuantityFormulaForItem(item);
    if (wireMeshFormula) return wireMeshFormula;
    const ceilingInsulationFormula = ceilingInsulationFormulaForItem(item);
    if (ceilingInsulationFormula) return ceilingInsulationFormula;
    if (isConcreteTotalLinkedItem(item)) {
      return "コンクリート数量合計: 表示中のコンクリート明細の数量を合計";
    }
    if (isConcreteCompressionTestItem(item)) {
      return `試験回数: 概要の週・日を各1回で集計 = ${formatNumber(compressionTestCount(item))}回`;
    }
    if (isFormworkTotalLinkedItem(item)) {
      return "型枠数量合計: 表示中の型枠明細の数量を合計";
    }
    if (isFloorAreaLinkedItem(item) && toNumber(state.totalFloorArea) > 0) {
      return `延べ床面積連動: ${formatNumber(state.totalFloorArea)}㎡`;
    }
    if (isSettingOutItem(item) && toNumber(state.buildingArea) > 0) {
      return `建築面積連動: ${formatNumber(state.buildingArea)}㎡`;
    }
    if (isPlasterConcreteFinishItem(item)) {
      const siteArea = toNumber(state.siteArea);
      const buildingArea = toNumber(state.buildingArea);
      if (siteArea > 0 || buildingArea > 0) {
        return `敷地面積+建築面積: ${formatNumber(siteArea)}+${formatNumber(buildingArea)}=${formatNumber(siteArea + buildingArea)}㎡`;
      }
    }
    if (isAdjustmentItem(item)) {
      return "調整: 明細小計の下三桁を切り捨て";
    }
    return "";
  }

  function priceFormulaForItem(item) {
    if (!item || item.type !== "item") return "";
    return String(item.priceFormula || "").trim();
  }

  function ceilingInsulationFormulaForItem(item) {
    if (!isCeilingInsulationItem(item)) return "";
    const sheet = activeSheet();
    if (primaryCeilingInsulationItem(sheet) !== item) return "";
    const insertQty = ceilingInsertQuantityForSheet(sheet);
    if (insertQty <= 0) return "";
    const divided = insertQty / 1.62;
    const rounded = Math.ceil(divided);
    return `天井断熱材: インサート金物 ${formatNumber(insertQty)}÷1.62=${formatNumber(divided)} → 小数点繰り上げ ${formatNumber(rounded)} +1 = ${formatNumber(ceilingInsulationQuantity(insertQty))}枚`;
  }

  function wireMeshQuantityFormulaForItem(item) {
    if (!isWireMeshMaterialItem(item)) return "";
    const sheet = activeSheet();
    const hasLaborRow = sheet.items.some(isWireMeshLaborItem);
    if (!hasLaborRow) return "";
    const laborQty = wireMeshLaborQuantityForSheet(sheet);
    return `ワイヤメッシュ敷き手間: ${formatNumber(laborQty)}÷7.2=${formatNumber(laborQty / 7.2)} → ${formatNumber(wireMeshMaterialQuantity(laborQty))}枚（小数点以下切り捨て）`;
  }

  function inferredExistingConcreteQuantityFormula(item) {
    const adjustedQty = toNumber(item.qty);
    if (adjustedQty <= 0) return "";
    const targetName = directConcreteQuantityAdjustmentTarget(item);
    if (!targetName) return "";
    if (isSlabOrLevelingConcreteTarget(targetName)) {
      const rawQty = (adjustedQty - 0.5) / 1.4;
      if (rawQty <= 0) return "";
      return `既存数量補正: ${formatNumber(rawQty)}×1.4+0.5=${formatNumber(adjustedQty)}㎥（現在数量から逆算）`;
    }
    if (isReinforcedConcreteTarget(targetName)) {
      const count = concreteStructuralAllowanceCount(targetName, [item]);
      const rawQty = (adjustedQty - count * 0.5) / 1.05;
      if (rawQty <= 0) return "";
      return `既存数量補正: ${formatNumber(rawQty)}×1.05+${count}×0.5=${formatNumber(adjustedQty)}㎥（現在数量から逆算）`;
    }
    return "";
  }

  function focusNextDetailInput(currentInput) {
    const inputs = Array.from($("itemsBody")?.querySelectorAll("input[data-key]") || []);
    const currentIndex = inputs.indexOf(currentInput);
    const nextInput = inputs[currentIndex + 1];
    if (nextInput) {
      nextInput.focus();
      nextInput.select?.();
    } else {
      currentInput.blur();
    }
  }

  function moveItem(index, direction) {
    const sheet = activeSheet();
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= sheet.items.length) return;
    const [item] = sheet.items.splice(index, 1);
    sheet.items.splice(nextIndex, 0, item);
    sheet.manualRowOrder = true;
    render();
  }

  function resetSheetQuantitiesOnly(sheet) {
    sheet.items.forEach((item) => {
      if (item.type !== "item") return;
      item.qty = 0;
      item.manualQty = true;
    });
  }

  function resetActiveConcreteTemplate() {
    const sheet = activeSheet();
    if (!isConcreteSheet(sheet)) return;
    if (!confirm("コンクリート工事の数量を0に戻しますか？項目・単価・備考は残します。")) return;
    sheet.suppressConcreteTemplate = false;
    sheet.manualRowOrder = true;
    ensureConcreteTemplateRows([sheet]);
    ensureAdjustmentRows([sheet]);
    resetSheetQuantitiesOnly(sheet);
    render();
    $("importResult").textContent = "コンクリート工事の項目は残し、数量だけ0に戻しました。";
  }

  function applyConcreteUnitPricesToActiveSheet() {
    const sheet = activeSheet();
    if (!isConcreteSheet(sheet)) return;
    const stats = syncConcreteUnitPrices(state, { sheet });
    syncAdjustmentRows(state);
    render();
    $("importResult").textContent = concretePriceStatusMessage(stats);
  }

  function resetActiveConcreteBlockTemplate() {
    const sheet = activeSheet();
    if (!isConcreteBlockSheet(sheet)) return;
    if (!confirm("コンクリートブロック工事の数量を0に戻しますか？項目・単価・備考は残します。")) return;
    sheet.manualRowOrder = true;
    ensureConcreteBlockTemplateRows([sheet]);
    ensureAdjustmentRows([sheet]);
    resetSheetQuantitiesOnly(sheet);
    render();
    $("importResult").textContent = "コンクリートブロック工事の項目は残し、数量だけ0に戻しました。";
  }

  function resetActiveEarthworkTemplate() {
    const sheet = activeSheet();
    if (!isEarthworkSheet(sheet)) return;
    if (!confirm("土工事の数量を0に戻しますか？項目・単価・備考は残します。")) return;
    sheet.manualRowOrder = true;
    ensureEarthworkTemplateRows([sheet]);
    ensureAdjustmentRows([sheet]);
    resetSheetQuantitiesOnly(sheet);
    render();
    $("importResult").textContent = "土工事の項目は残し、数量だけ0に戻しました。";
  }

  function resetActiveFormworkTemplate() {
    const sheet = activeSheet();
    if (!isFormworkSheet(sheet)) return;
    if (!confirm("型枠工事の数量を0に戻しますか？項目・単価・備考は残します。")) return;
    sheet.manualRowOrder = true;
    ensureFormworkTemplateRows([sheet]);
    ensureAdjustmentRows([sheet]);
    resetSheetQuantitiesOnly(sheet);
    render();
    $("importResult").textContent = "型枠工事の項目は残し、数量だけ0に戻しました。";
  }

  function resetActivePlasterTemplate() {
    const sheet = activeSheet();
    if (!isPlasterSheet(sheet)) return;
    if (!confirm("左官工事の数量を0に戻しますか？項目・単価・備考は残します。")) return;
    sheet.manualRowOrder = true;
    ensurePlasterTemplateRows([sheet]);
    ensureAdjustmentRows([sheet]);
    resetSheetQuantitiesOnly(sheet);
    render();
    $("importResult").textContent = "左官工事の項目は残し、数量だけ0に戻しました。";
  }

  function resetActiveMetalTemplate() {
    const sheet = activeSheet();
    if (!isMetalSheet(sheet)) return;
    if (!confirm("金属工事の数量を0に戻しますか？項目・単価・備考は残します。")) return;
    sheet.manualRowOrder = true;
    ensureMetalTemplateRows([sheet]);
    ensureAdjustmentRows([sheet]);
    resetSheetQuantitiesOnly(sheet);
    render();
    $("importResult").textContent = "金属工事の項目は残し、数量だけ0に戻しました。";
  }

  function ensurePresetTrades() {
    state.estimateMode = "byTrade";
    tradePresets.forEach((trade) => ensureSheet(trade.name));
    state.activeSheetIndex = Math.max(0, state.sheets.findIndex((sheet) => sheet.name === tradePresets[0].name));
    render();
    $("importResult").textContent = "指定工種を作成しました。貼り付け取り込みができます。";
  }

  function loadUeharaEstimate() {
    saveState();
    let record = estimateBook.estimates.find((item) => (item.state.projectName || "").includes("上原"));
    if (!record) {
      record = createEstimateRecord(createUeharaEstimateState());
      estimateBook.estimates.push(record);
    } else {
      record.state = createUeharaEstimateState();
      record.updatedAt = new Date().toISOString();
    }
    estimateBook.activeId = record.id;
    state = record.state;
    saveState();
    render();
    $("importResult").textContent = "上原邸の入力内容を復旧しました。鉄筋工事 10件が入っています。";
  }

  function ensureSheet(name) {
    let sheet = state.sheets.find((item) => item.name === name);
    if (!sheet) {
      sheet = { name, items: [] };
      state.sheets.push(sheet);
    }
    return sheet;
  }

  function importText() {
    const raw = $("importText").value.trim();
    if (!raw) {
      $("importResult").textContent = "取り込むテキストを貼り付けてください。";
      return;
    }

    state.estimateMode = "byTrade";
    tradePresets.forEach((trade) => ensureSheet(trade.name));

    const lines = raw.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const forcedTradeName = selectedImportTrade() || pendingImportTradeName;
    let imported = 0;
    let notesAdded = 0;
    let skipped = 0;
    const counts = {};
    const noteLines = [];
    const concreteImports = {};
    const preparedImportSheets = new Set();
    const importBatchKeys = new Set();

    lines.forEach((line) => {
      const routedItem = parseRoutedImportLine(line);
      const earthworkItem = routedItem || parseEarthworkImportLine(line);
      if (isNoteLine(line)) {
        noteLines.push(cleanNoteLine(line));
        notesAdded += 1;
        return;
      }
      if (!earthworkItem && isNonEstimateLine(line)) {
        skipped += 1;
        return;
      }
      const item = earthworkItem || parseImportLine(line, {
        forceEstimate: Boolean(forcedTradeName),
        quantityOnly: isConcreteSheet(forcedTradeName)
      });
      if (!item) {
        skipped += 1;
        return;
      }
      const tradeName = item._tradeName || forcedTradeName || classifyTrade(line);
      delete item._tradeName;
      if (isEarthworkSheet(tradeName)) normalizeEarthworkImportedItem(item);
      if (isConcreteSheet(tradeName)) {
        (concreteImports[tradeName] ||= []).push(item);
        counts[tradeName] = (counts[tradeName] || 0) + 1;
        imported += 1;
        return;
      }
      delete item._partialImport;
      const sheet = ensureSheet(tradeName);
      if (isEarthworkSheet(tradeName) && !preparedImportSheets.has(tradeName)) {
        ensureEarthworkTemplateRows([sheet]);
        ensureAdjustmentRows([sheet]);
        preparedImportSheets.add(tradeName);
      }
      item.category = "取り込み";
      item.remarks = item.remarks || "自動取り込み";
      upsertImportedItem(sheet, item, importBatchKeys);
      counts[tradeName] = (counts[tradeName] || 0) + 1;
      imported += 1;
    });

    Object.entries(concreteImports).forEach(([tradeName, items]) => {
      applyConcreteImports(ensureSheet(tradeName), items);
    });
    appendImportedNotes(noteLines);
    const firstTrade = Object.keys(counts)[0];
    if (firstTrade) state.activeSheetIndex = state.sheets.findIndex((sheet) => sheet.name === firstTrade);
    render();
    const countText = Object.entries(counts).map(([name, count]) => `${name}:${count}`).join(" / ");
    const modeText = forcedTradeName ? `指定工種「${forcedTradeName}」へ反映。` : "自動判定で反映。";
    const emptyHint = imported === 0 ? " 明細候補が見つかりませんでした。取り込み欄の内容を確認してください。" : "";
    $("importResult").textContent = `${modeText} 明細 ${imported}件、備考 ${notesAdded}件、除外 ${skipped}行。${countText}${emptyHint}`;
  }

  function clearImportedRows(sheet) {
    sheet.items = sheet.items.filter((item) => {
      if (item.type === "section" && item.category === "取り込み") return false;
      if (item.category === "取り込み") return false;
      if (String(item.remarks || "").includes("自動取り込み")) return false;
      if (String(item.remarks || "").includes("Excel取込")) return false;
      return true;
    });
  }

  function upsertImportedItem(sheet, item, importBatchKeys = null) {
    const target = findImportTargetRow(sheet, item);
    const sumIntoTarget = Boolean(item._sumImport);
    if (target) {
      const batchKey = importBatchKey(sheet, item);
      const firstInBatch = !importBatchKeys || !importBatchKeys.has(batchKey);
      target.type = "item";
      target.category = target.category || "取り込み";
      target.name = item.name || target.name;
      target.summary = item.summary || target.summary || "";
      target.qty = sumIntoTarget && !firstInBatch
        ? Number((toNumber(target.qty) + toNumber(item.qty)).toFixed(2))
        : item.qty;
      target.unit = item.unit || target.unit || "式";
      target.price = toNumber(item.price) > 0 ? item.price : (target.price || item.price || 0);
      target.priceFormula = item.priceFormula || "";
      target.remarks = item.remarks || target.remarks || "自動取り込み";
      target.hidden = false;
      target.manualQty = true;
      if (sumIntoTarget && importBatchKeys) importBatchKeys.add(batchKey);
      return target;
    }

    if (!sheet.items.some((row) => row.type === "section" && row.category === "取り込み")) {
      sheet.items.push({ type: "section", category: "取り込み", name: "", summary: "", qty: "", unit: "", price: "", remarks: "" });
    }
    item.hidden = false;
    item.manualQty = true;
    if (sumIntoTarget && importBatchKeys) importBatchKeys.add(importBatchKey(sheet, item));
    delete item._sumImport;
    delete item._partialImport;
    sheet.items.push(item);
    return item;
  }

  function importBatchKey(sheet, item) {
    return `${sheet.name}|${normalizedText(item.name)}|${normalizedText(item.summary)}`;
  }

  function findImportTargetRow(sheet, item) {
    const wanted = normalizedText(item.name);
    if (!wanted) return null;
    let sameNameRows = sheet.items.filter((row) => (
      row.type === "item" &&
      !isAdjustmentItem(row) &&
      normalizedText(row.name) === wanted
    ));
    if (!sameNameRows.length && wanted.includes("断熱材")) {
      sameNameRows = sheet.items.filter((row) => (
        row.type === "item" &&
        !isAdjustmentItem(row) &&
        normalizedText(row.name).includes("断熱材")
      ));
    }
    const wantedSummary = normalizedText(item.summary);
    if (wantedSummary) {
      const sameSummary = sameNameRows.find((row) => normalizedText(row.summary) === wantedSummary);
      if (sameSummary) return sameSummary;
      const wantedThickness = summaryThicknessMm(item.summary);
      if (wantedThickness) {
        const sameThickness = sameNameRows.find((row) => summaryThicknessMm(row.summary) === wantedThickness);
        if (sameThickness) return sameThickness;
      }
    }
    if (sameNameRows.length) return sameNameRows[0];
    return sheet.items.find((row) => (
      row.type === "item" &&
      !isAdjustmentItem(row) &&
      !String(row.name || "").trim() &&
      !String(row.qty || "").trim() &&
      !String(row.price || "").trim()
    )) || null;
  }

  function normalizedText(value) {
    return String(value || "").replace(/\s+/g, "");
  }

  function summaryThicknessMm(value) {
    const text = String(value || "")
      .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
      .replace(/ｍｍ|㎜/gi, "mm");
    const match = text.match(/(?:厚|t)?\s*(\d+(?:\.\d+)?)\s*mm/i);
    return match ? Number(match[1]) : 0;
  }

  function selectedImportTrade() {
    return $("importTargetTrade")?.value || "";
  }

  function parseRoutedImportLine(line) {
    const parts = String(line || "").split("\t").map((part) => part.trim());
    if (parts[0] !== "工種取込" || parts.length < 7) return null;
    return {
      type: "item",
      category: "",
      name: parts[2],
      summary: parts[3],
      qty: toNumber(parts[4]),
      unit: parts[5] || "式",
      price: toNumber(parts[6]),
      remarks: parts.slice(7).filter(Boolean).join(" ") || "Excel取込",
      _tradeName: parts[1],
      _partialImport: true,
      _sumImport: true
    };
  }

  function parseEarthworkImportLine(line) {
    const parts = String(line || "").split(/\s+/).filter(Boolean);
    if (parts[0] !== "土工事取込" || parts.length < 4) return null;
    return {
      type: "item",
      category: "",
      name: parts[1],
      summary: "",
      qty: toNumber(parts[2]),
      unit: parts[3],
      price: toNumber(parts[4]),
      remarks: parts.slice(5).join(" ") || "Excel取込",
      _tradeName: "土工事",
      _sumImport: true
    };
  }

  function normalizeEarthworkImportedItem(item) {
    if (!isEarthworkSubbaseName(item.name)) return item;
    item.name = "砕石地業";
    item.summary = item.summary || "RC-40";
    item.unit = item.unit || "㎥";
    item._sumImport = true;
    return item;
  }

  function parseImportLine(line, options = {}) {
    const cleaned = line.replace(/[¥￥]/g, "").replace(/,/g, "");
    const parts = cleaned.split(/\s+/).filter(Boolean);
    if (parts.length < 2) return null;
    if (!options.forceEstimate && !hasEstimateSignal(line)) return null;

    const unitIndex = parts.findIndex((part) => /^(式|m2|㎡|m3|m³|㎥|m|枚|本|kg|t|箇所|ヶ所|個|台|人工|日|回)$/i.test(part));
    let qty = 1;
    let unit = "式";
    let price = 0;
    let nameParts = parts;
    let summary = "";

    if (unitIndex > 0 && /^\d+(\.\d+)?$/.test(parts[unitIndex - 1])) {
      qty = Number(parts[unitIndex - 1]);
      unit = parts[unitIndex];
      const priceToken = parts.slice(unitIndex + 1).find((part) => /^-?\d+(\.\d+)?$/.test(part));
      price = priceToken ? Number(priceToken) : 0;
      nameParts = parts.slice(0, unitIndex - 1);
      summary = parts.slice(unitIndex + 1).filter((part) => part !== String(priceToken)).join(" ");
    } else {
      const nums = parts.map((part, index) => ({ part, index })).filter(({ part }) => /^-?\d+(\.\d+)?$/.test(part));
      if (options.quantityOnly && nums.length === 0) return null;
      if (nums.length >= 2) {
        qty = Number(nums[nums.length - 2].part);
        price = Number(nums[nums.length - 1].part);
        nameParts = parts.slice(0, nums[nums.length - 2].index);
      } else if (nums.length === 1) {
        if (options.quantityOnly) {
          qty = Number(nums[0].part);
          unit = inferUnitFromLine(line) || "㎥";
        } else {
          price = Number(nums[0].part);
        }
        nameParts = parts.slice(0, nums[0].index);
      }
    }

    const name = nameParts.join(" ").trim();
    if (!name || isNonEstimateLine(name)) return null;
    return { type: "item", category: "", name, summary, qty, unit, price, remarks: "" };
  }

  function inferUnitFromLine(line) {
    const match = String(line || "").match(/(m2|㎡|m3|m³|㎥|式|回|袋|本|枚|個|箇所|ヶ所)/i);
    return match ? match[1] : "";
  }

  function hasEstimateSignal(line) {
    const cleaned = line.replace(/[,，]/g, "");
    const hasUnit = /(式|m2|㎡|m3|m³|㎥|m|枚|本|kg|t|箇所|ヶ所|個|台|人工|日|回)/i.test(cleaned);
    const numbers = cleaned.match(/-?\d+(?:\.\d+)?/g) || [];
    const hasMoney = /[¥￥円]|\d{4,}/.test(cleaned);
    const hasNameText = /[一-龥ぁ-んァ-ヶA-Za-z]{2,}/.test(cleaned);
    return (hasUnit && numbers.length >= 1) || (hasNameText && numbers.length >= 2) || (hasMoney && numbers.length >= 1 && looksLikeWorkLine(cleaned));
  }

  function looksLikeWorkLine(line) {
    const text = line.toLowerCase();
    return tradePresets.some((trade) => trade.keys.some((key) => text.includes(key.toLowerCase())));
  }

  function isNoteLine(line) {
    const text = line.trim();
    if (!text || text.length < 3) return false;
    if (hasEstimateSignal(text)) return false;
    return noteKeywords.some((keyword) => text.includes(keyword));
  }

  function isNonEstimateLine(line) {
    const text = line.trim();
    if (!text) return true;
    if (/^\d+$/.test(text)) return true;
    if (/^[\-_=・※\s]+$/.test(text)) return true;
    if (ignoreKeywords.some((keyword) => text.toLowerCase().includes(keyword.toLowerCase()))) return true;
    const numbers = text.match(/\d/g) || [];
    if (numbers.length > 8 && !looksLikeWorkLine(text) && !/(式|m2|㎡|m3|m³|㎥|m|枚|本|kg|t|箇所|ヶ所|個|台|人工|日|回)/i.test(text)) {
      return true;
    }
    return false;
  }

  function cleanNoteLine(line) {
    return line.replace(/^\s*[※*・\-]\s*/, "").trim();
  }

  function appendImportedNotes(lines) {
    const unique = Array.from(new Set(lines.map(cleanNoteLine).filter(Boolean)));
    if (!unique.length) return;
    const heading = "【取り込み備考】";
    const current = state.notes || "";
    const additions = unique.filter((line) => !current.includes(line));
    if (!additions.length) return;
    state.notes = [current, current.includes(heading) ? "" : heading, ...additions.map((line) => `・${line}`)]
      .filter(Boolean)
      .join("\n");
  }

  function applyConcreteImports(sheet, importedItems) {
    const concreteItems = importedItems.filter(isConcreteImportQuantityItem);
    if (!concreteItems.length) return;
    sheet.suppressConcreteTemplate = true;
    ensureConcreteUsableTemplateRows(sheet);
    ensureAdjustmentRows([sheet]);
    const predicted = new Map();
    concreteItems.forEach((item, index) => {
      const targetName = predictConcreteDetailName(item, index, concreteItems);
      if (!targetName) return;
      if (!predicted.has(targetName)) predicted.set(targetName, []);
      predicted.get(targetName).push(item);
    });
    const foundationHint = concreteItems.find(isFoundationQuantityHint);
    if (foundationHint) {
      const foundationItems = [foundationHint];
      const bodyItems = concreteItems.filter((item) => item !== foundationHint && !isLevelingConcreteImport(item) && !isSlabConcreteImport(item) && isAboveGroundFloorConcreteImport(item));
      predicted.set("有筋コンクリート基礎", foundationItems);
      predicted.set("有筋コンクリート躯体", bodyItems);
      lastConcreteReadSummary.push("ヒント位置から基礎列を抽出");
    }
    predicted.forEach((items, targetName) => {
      if (!items.length) return;
      const rawQty = items.reduce((sum, item) => sum + toNumber(item.qty), 0);
      const qty = adjustedConcreteImportQty(targetName, rawQty, items);
      const sourceNames = items.map(concreteImportSourceLabel);
      const adjustmentRemark = concreteImportAdjustmentRemark(targetName, rawQty, qty, items);
      if (adjustmentRemark) sourceNames.push(adjustmentRemark);
      setConcreteTemplateQty(sheet, targetName, qty, sourceNames);
    });
    syncConcreteTotals({ sheets: [sheet] });
    const keepNames = new Set(predicted.keys());
    sheet.items.forEach((item) => {
      if (isConcretePumpOrPlacementItem(item) && toNumber(item.qty) > 0) keepNames.add(item.name);
    });
    compactConcreteTemplateRowsAfterImport(sheet, keepNames);
    ensureAdjustmentRows([sheet]);
  }

  function prepareConcreteSheetForImport(sheet) {
    sheet.items = clone(concreteTemplateItems);
    ensureAdjustmentRows([sheet]);
  }

  function prepareEarthworkSheetForImport(sheet) {
    sheet.items = clone(earthworkTemplateItems);
    ensureAdjustmentRows([sheet]);
  }

  function predictConcreteDetailName(item, index, concreteItems) {
    const name = normalizedItemName(item);
    if (name.includes("均し") || name.includes("捨てコン") || name.includes("捨コン")) {
      return "均しコンクリート";
    }
    if (isSlabConcreteImport(item)) {
      return "土間コンクリート";
    }
    if (isFoundationQuantityHint(item)) {
      return "有筋コンクリート基礎";
    }
    if (isAboveGroundFloorConcreteImport(item)) {
      return "有筋コンクリート躯体";
    }
    const foundationCandidates = concreteItems.filter((row) => !isLevelingConcreteImport(row) && !isSlabConcreteImport(row));
    const fallbackFoundation = foundationCandidates[foundationCandidates.length - 1];
    if (isFoundationConcreteImport(item) || item === fallbackFoundation) {
      return "有筋コンクリート基礎";
    }
    return "有筋コンクリート躯体";
  }

  function isConcreteImportQuantityItem(item) {
    const name = normalizedItemName(item);
    const summary = String(item.summary || "");
    if (name.includes("圧送") || name.includes("打設") || name.includes("試験") || name.includes("ポンプ") || name.includes("セメント")) return false;
    return toNumber(item.qty) > 0 && (name.includes("コンクリート") || /FC\d+/i.test(summary) || ["㎥", "m3", "m³"].includes(item.unit));
  }

  function isFoundationConcreteImport(item) {
    const text = `${item.name || ""} ${item.summary || ""}`.replace(/\s+/g, "");
    return /基礎|フーチング|地中梁|立上|ベース/i.test(text);
  }

  function isFoundationQuantityHint(item) {
    return Math.abs(toNumber(item.qty) - 76.66) < 0.01;
  }

  function isLevelingConcreteImport(item) {
    const name = normalizedItemName(item);
    return name.includes("均し") || name.includes("捨てコン") || name.includes("捨コン");
  }

  function isSlabConcreteImport(item) {
    const text = `${item.name || ""} ${item.summary || ""}`.replace(/\s+/g, "");
    return /土間|スラブ/i.test(text) && !isLevelingConcreteImport(item);
  }

  function adjustedConcreteImportQty(targetName, rawQty, items) {
    if (isSlabOrLevelingConcreteTarget(targetName)) {
      return rawQty * 1.4 + 0.5;
    }
    if (isReinforcedConcreteTarget(targetName)) {
      return rawQty * 1.05 + concreteStructuralAllowanceCount(targetName, items) * 0.5;
    }
    return rawQty;
  }

  function concreteImportAdjustmentRemark(targetName, rawQty, adjustedQty, items) {
    if (Math.abs(rawQty - adjustedQty) < 0.005) return "";
    if (isSlabOrLevelingConcreteTarget(targetName)) {
      return `数量補正: ${formatNumber(rawQty)}×1.4+0.5=${formatNumber(adjustedQty)}㎥`;
    }
    if (isReinforcedConcreteTarget(targetName)) {
      const count = concreteStructuralAllowanceCount(targetName, items);
      return `数量補正: ${formatNumber(rawQty)}×1.05+${count}×0.5=${formatNumber(adjustedQty)}㎥`;
    }
    return "";
  }

  function applyDirectConcreteQuantityAdjustment(item, rawValue) {
    const rawQty = toNumber(rawValue);
    if (item.type !== "item" || isAdjustmentItem(item) || rawQty <= 0) return false;
    const targetName = directConcreteQuantityAdjustmentTarget(item);
    if (!targetName) return false;
    const adjustedQty = adjustedConcreteImportQty(targetName, rawQty, [item]);
    item.qty = Number(adjustedQty.toFixed(2));
    item.unit = item.unit || "㎥";
    item.hidden = false;
    item.manualQty = true;
    const remark = concreteDirectQuantityAdjustmentRemark(targetName, rawQty, adjustedQty, [item]);
    if (remark) item.remarks = replaceConcreteQuantityAdjustmentRemark(item.remarks, remark);
    return true;
  }

  function directConcreteQuantityAdjustmentTarget(item) {
    const name = normalizedItemName(item);
    if (name.includes("均し") || name.includes("捨てコン") || name.includes("捨コン")) return "均しコンクリート";
    if (name.includes("土間")) return "土間コンクリート";
    if (name.includes("有筋") && name.includes("基礎")) return "有筋コンクリート基礎";
    if (name.includes("有筋") && name.includes("躯体")) return "有筋コンクリート躯体";
    return "";
  }

  function concreteDirectQuantityAdjustmentRemark(targetName, rawQty, adjustedQty, items) {
    const remark = concreteImportAdjustmentRemark(targetName, rawQty, adjustedQty, items);
    return remark ? remark.replace(/^数量補正:/, "直接入力数量補正:") : "";
  }

  function replaceConcreteQuantityAdjustmentRemark(remarks, nextRemark) {
    const parts = String(remarks || "")
      .split(/\s*\/\s*/)
      .map((part) => part.trim())
      .filter((part) => part && !part.startsWith("数量補正:") && !part.startsWith("直接入力数量補正:"));
    parts.push(nextRemark);
    return parts.join(" / ");
  }

  function isSlabOrLevelingConcreteTarget(targetName) {
    const name = normalizedText(targetName);
    return name.includes("土間コンクリート") || name.includes("均しコンクリート");
  }

  function isReinforcedConcreteTarget(targetName) {
    return normalizedText(targetName).includes("有筋コンクリート");
  }

  function concreteStructuralAllowanceCount(targetName, items) {
    const name = normalizedText(targetName);
    if (name.includes("基礎")) return 1;
    if (name.includes("躯体")) {
      const floorCount = countConcreteAboveGroundFloors(items);
      return floorCount || (items.length ? 1 : 0);
    }
    return 0;
  }

  function countConcreteAboveGroundFloors(items) {
    const floors = new Set();
    items.forEach((item) => {
      concreteAboveGroundFloorKeys(`${item.name || ""} ${item.summary || ""} ${item.remarks || ""}`).forEach((floor) => floors.add(floor));
    });
    return floors.size;
  }

  function concreteAboveGroundFloorKeys(value) {
    const text = String(value || "")
      .replace(/[０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
      .replace(/[Ａ-Ｚａ-ｚ]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xfee0))
      .replace(/\s+/g, "");
    if (/地下|B\d*F?|GL下/i.test(text)) return [];
    const floors = new Set();
    Array.from(text.matchAll(/(\d+)(?:階|F)/gi)).forEach((match) => {
      const floor = Number(match[1]);
      if (floor > 0) floors.add(`${floor}F`);
    });
    if (/R階|RF|屋上/i.test(text) || /(^|[^A-Za-z0-9])R($|[^A-Za-z0-9])/i.test(String(value || ""))) {
      floors.add("RF");
    }
    return Array.from(floors);
  }

  function isAboveGroundFloorConcreteImport(item) {
    const text = `${item.name || ""} ${item.summary || ""}`.replace(/\s+/g, "");
    return isAboveGroundFloorText(text);
  }

  function concreteImportSourceLabel(item) {
    return [item.name, item.summary].filter(Boolean).join(" ");
  }

  function setConcreteTemplateQty(sheet, name, qty, sourceNames = []) {
    let item = sheet.items.find((row) => row.type === "item" && row.name === name);
    if (!item) {
      const template = concreteTemplateItems.find((row) => row.type === "item" && row.name === name);
      item = template ? clone(template) : { type: "item", category: "取り込み", name, summary: "", qty: 0, unit: "㎥", price: 0, remarks: "" };
      insertBeforeAdjustment(sheet, item);
    }
    if (!item || qty <= 0) return;
    item.qty = Number(qty.toFixed(2));
    item.unit = item.unit || "㎥";
    item.hidden = false;
    item.manualQty = true;
    const uniqueSources = Array.from(new Set(sourceNames.map((value) => String(value || "").trim()).filter(Boolean)));
    const mixSummary = extractConcreteMixFromSources(uniqueSources) || inferConcreteMixSummary(uniqueSources);
    if (mixSummary) item.summary = mixSummary;
    item.remarks = uniqueSources.length ? `Excel取込: ${uniqueSources.join(" / ")}` : "Excel取込";
    normalizeConcreteItemSummary(item);
  }

  function compactConcreteTemplateRowsAfterImport(sheet, keepNames) {
    const templateKeys = new Set(concreteTemplateItems.map(concreteTemplateKey));
    sheet.items = sheet.items.filter((item) => {
      if (isAdjustmentItem(item)) return true;
      if (!templateKeys.has(concreteTemplateKey(item))) return true;
      if (isConcreteUsableTemplateRow(item)) return true;
      if (item.type === "section") return false;
      if (keepNames.has(item.name)) return true;
      if (toNumber(item.qty) > 0 || amount(item) !== 0) return true;
      return false;
    });
    orderExistingConcreteTemplateRows(sheet);
  }

  function extractConcreteMixFromSources(sourceNames) {
    for (const source of sourceNames) {
      const match = String(source || "").match(/配合:([^\s]+)/);
      if (match?.[1]) {
        try {
          return decodeURIComponent(match[1]).trim();
        } catch (error) {
          return match[1].trim();
        }
      }
    }
    return "";
  }

  function concreteMixToken(mixSummary) {
    return mixSummary ? `配合:${encodeURIComponent(mixSummary)}` : "";
  }

  function classifyTrade(text) {
    const normalized = text.toLowerCase();
    const match = tradePresets.find((trade) => trade.keys.some((key) => normalized.includes(key.toLowerCase())));
    return match ? match.name : "未分類";
  }

  async function ensurePdfJs() {
    if (window.pdfjsLib) return window.pdfjsLib;
    const pdfjs = await import("./pdf.min.mjs");
    window.pdfjsLib = pdfjs;
    pdfjs.GlobalWorkerOptions.workerSrc = "./pdf.worker.min.mjs";
    return pdfjs;
  }

  async function openVendorPdfImporter(file) {
    const pdfjs = await ensurePdfJs();
    const pdf = await pdfjs.getDocument({
      data: await file.arrayBuffer(),
      disableWorker: location.protocol === "file:"
    }).promise;
    vendorPdfSession = {
      file,
      pdf,
      pageNo: 1,
      ranges: [],
      rows: [],
      notes: "",
      netEntries: [],
      netTaxDetection: null,
      netTaxMode: "auto",
      netTaxRate: toNumber(state.taxRate) || 10,
      renderToken: 0,
      pageRendering: false,
      processing: false
    };
    const completion = new Promise((resolve) => {
      vendorPdfResolve = resolve;
    });
    $("vendorPdfFileName").textContent = file.name;
    $("vendorPdfStatus").textContent = "PDF上で取り込む範囲をドラッグしてください。複数選択できます。";
    $("vendorOcrReview").hidden = true;
    $("vendorOcrRows").replaceChildren();
    $("vendorOcrNotes").value = "";
    $("vendorPdfImportModal").classList.add("is-open");
    $("vendorPdfImportModal").setAttribute("aria-hidden", "false");
    document.body.classList.add("vendor-import-open");
    renderVendorRangeList();
    try {
      await renderVendorPdfPage();
    } catch (error) {
      closeVendorPdfImporter();
      throw error;
    }
    return completion;
  }

  function closeVendorPdfImporter(result = { applied: false }) {
    if (!vendorPdfSession || vendorPdfSession.processing) return;
    $("vendorPdfImportModal").classList.remove("is-open");
    $("vendorPdfImportModal").setAttribute("aria-hidden", "true");
    document.body.classList.remove("vendor-import-open");
    const resolve = vendorPdfResolve;
    vendorPdfResolve = null;
    vendorPdfSession = null;
    vendorSelectionDraft = null;
    if (resolve) resolve(result);
  }

  async function renderVendorPdfPage() {
    const session = vendorPdfSession;
    if (!session || session.pageRendering) return;
    session.pageRendering = true;
    $("vendorPdfPrevButton").disabled = true;
    $("vendorPdfNextButton").disabled = true;
    const token = ++session.renderToken;
    try {
      const page = await session.pdf.getPage(session.pageNo);
      const viewport = page.getViewport({ scale: 1.45 });
      const canvas = $("vendorPdfCanvas");
      const context = canvas.getContext("2d", { alpha: false });
      canvas.width = Math.floor(viewport.width);
      canvas.height = Math.floor(viewport.height);
      $("vendorPdfStage").style.width = `${canvas.width}px`;
      $("vendorPdfStage").style.aspectRatio = `${canvas.width} / ${canvas.height}`;
      await page.render({ canvasContext: context, viewport }).promise;
      if (!vendorPdfSession || token !== session.renderToken) return;
      $("vendorPdfPageLabel").textContent = `${session.pageNo} / ${session.pdf.numPages}`;
      renderVendorSelectionBoxes();
    } finally {
      session.pageRendering = false;
      if (vendorPdfSession === session) {
        $("vendorPdfPrevButton").disabled = session.pageNo <= 1;
        $("vendorPdfNextButton").disabled = session.pageNo >= session.pdf.numPages;
      }
    }
  }

  function normalizedPointerPosition(event) {
    const bounds = $("vendorPdfSelectionLayer").getBoundingClientRect();
    return {
      x: Math.min(1, Math.max(0, (event.clientX - bounds.left) / Math.max(bounds.width, 1))),
      y: Math.min(1, Math.max(0, (event.clientY - bounds.top) / Math.max(bounds.height, 1)))
    };
  }

  function vendorSelectionPointerDown(event) {
    if (!vendorPdfSession || vendorPdfSession.processing || event.button !== 0) return;
    const point = normalizedPointerPosition(event);
    vendorSelectionDraft = { pageNo: vendorPdfSession.pageNo, startX: point.x, startY: point.y, x: point.x, y: point.y, width: 0, height: 0 };
    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function vendorSelectionPointerMove(event) {
    if (!vendorSelectionDraft || !vendorPdfSession) return;
    const point = normalizedPointerPosition(event);
    vendorSelectionDraft.x = Math.min(vendorSelectionDraft.startX, point.x);
    vendorSelectionDraft.y = Math.min(vendorSelectionDraft.startY, point.y);
    vendorSelectionDraft.width = Math.abs(point.x - vendorSelectionDraft.startX);
    vendorSelectionDraft.height = Math.abs(point.y - vendorSelectionDraft.startY);
    renderVendorSelectionBoxes();
  }

  function vendorSelectionPointerUp(event) {
    if (!vendorSelectionDraft || !vendorPdfSession) return;
    vendorSelectionPointerMove(event);
    const draft = vendorSelectionDraft;
    vendorSelectionDraft = null;
    if (draft.width >= 0.015 && draft.height >= 0.015) {
      vendorPdfSession.ranges.push({
        id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
        pageNo: draft.pageNo,
        x: draft.x,
        y: draft.y,
        width: draft.width,
        height: draft.height,
        role: "details"
      });
      invalidateVendorOcrReview();
      renderVendorRangeList();
    }
    renderVendorSelectionBoxes();
  }

  function vendorSelectionStyle(range) {
    return `left:${range.x * 100}%;top:${range.y * 100}%;width:${range.width * 100}%;height:${range.height * 100}%`;
  }

  function renderVendorSelectionBoxes() {
    const layer = $("vendorPdfSelectionLayer");
    if (!vendorPdfSession) {
      layer.replaceChildren();
      return;
    }
    const visible = vendorPdfSession.ranges
      .map((range, index) => ({ ...range, number: index + 1 }))
      .filter((range) => range.pageNo === vendorPdfSession.pageNo);
    if (vendorSelectionDraft?.pageNo === vendorPdfSession.pageNo) {
      visible.push({ ...vendorSelectionDraft, number: "+", role: "details" });
    }
    layer.innerHTML = visible.map((range) => (
      `<div class="vendor-selection-box ${range.role === "details" ? "" : range.role}" style="${vendorSelectionStyle(range)}"><span>${range.number}</span></div>`
    )).join("");
  }

  function invalidateVendorOcrReview() {
    if (!vendorPdfSession) return;
    vendorPdfSession.rows = [];
    vendorPdfSession.notes = "";
    vendorPdfSession.netEntries = [];
    vendorPdfSession.netTaxDetection = null;
    vendorPdfSession.netTaxMode = "auto";
    vendorPdfSession.netTaxRate = toNumber(state.taxRate) || 10;
    $("vendorOcrReview").hidden = true;
  }

  function renderVendorRangeList() {
    const list = $("vendorPdfRangeList");
    list.replaceChildren();
    if (!vendorPdfSession?.ranges.length) {
      const empty = document.createElement("p");
      empty.className = "vendor-range-empty";
      empty.textContent = "PDF上で範囲を選択してください";
      list.appendChild(empty);
      return;
    }
    vendorPdfSession.ranges.forEach((range, index) => {
      const row = document.createElement("div");
      row.className = "vendor-range-row";

      const pageButton = document.createElement("button");
      pageButton.type = "button";
      pageButton.className = "vendor-range-page";
      pageButton.textContent = `範囲 ${index + 1}・${range.pageNo}ページ`;
      pageButton.addEventListener("click", async () => {
        if (!vendorPdfSession || vendorPdfSession.pageRendering) return;
        vendorPdfSession.pageNo = range.pageNo;
        await renderVendorPdfPage();
      });

      const role = document.createElement("select");
      [["details", "明細"], ["pricing", "NET・小計"], ["notes", "備考"]].forEach(([value, label]) => {
        const option = document.createElement("option");
        option.value = value;
        option.textContent = label;
        option.selected = range.role === value;
        role.appendChild(option);
      });
      role.setAttribute("aria-label", `範囲 ${index + 1} の取込先`);
      role.addEventListener("change", () => {
        range.role = role.value;
        invalidateVendorOcrReview();
        renderVendorSelectionBoxes();
      });

      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "vendor-range-remove";
      remove.title = "この範囲を削除";
      remove.textContent = "×";
      remove.addEventListener("click", () => {
        if (!vendorPdfSession) return;
        vendorPdfSession.ranges = vendorPdfSession.ranges.filter((item) => item.id !== range.id);
        invalidateVendorOcrReview();
        renderVendorRangeList();
        renderVendorSelectionBoxes();
      });
      row.append(pageButton, role, remove);
      list.appendChild(row);
    });
  }

  function setVendorPdfProcessing(active, message = "") {
    if (!vendorPdfSession) return;
    vendorPdfSession.processing = active;
    ["vendorPdfCloseButton", "vendorPdfPrevButton", "vendorPdfNextButton", "vendorPdfClearButton", "vendorPdfOcrButton", "vendorApplyButton"]
      .forEach((id) => {
        const button = $(id);
        if (button) button.disabled = active;
      });
    if (message) $("vendorPdfStatus").textContent = message;
  }

  async function createVendorOcrWorker(mode) {
    const Tesseract = await loadTesseract();
    const options = {
      workerPath: "./tesseract-worker.min.js",
      logger: (message) => {
        if (!vendorPdfSession || !message.status || typeof message.progress !== "number") return;
        const percent = Math.round(message.progress * 100);
        $("vendorPdfStatus").textContent = `OCR中: ${message.status} ${percent}%`;
        setProgress(message.progress * 90, `OCR中 ${percent}%`);
      }
    };
    if (mode === "fast") return Tesseract.createWorker("eng", 1, options);
    try {
      return await Tesseract.createWorker(["jpn", "eng"], 1, options);
    } catch (error) {
      $("vendorPdfStatus").textContent = "日本語OCRを準備できないため、英数字OCRで続行します。";
      return Tesseract.createWorker("eng", 1, options);
    }
  }

  async function renderVendorOcrSourcePage(page, mode) {
    const viewport = page.getViewport({ scale: mode === "fast" ? 1.8 : 2.25 });
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(1, Math.floor(viewport.width));
    canvas.height = Math.max(1, Math.floor(viewport.height));
    await page.render({ canvasContext: canvas.getContext("2d", { willReadFrequently: true }), viewport }).promise;
    return canvas;
  }

  function cropVendorPdfRange(sourceCanvas, range) {
    const sx = Math.max(0, Math.floor(range.x * sourceCanvas.width));
    const sy = Math.max(0, Math.floor(range.y * sourceCanvas.height));
    const sw = Math.max(1, Math.min(sourceCanvas.width - sx, Math.ceil(range.width * sourceCanvas.width)));
    const sh = Math.max(1, Math.min(sourceCanvas.height - sy, Math.ceil(range.height * sourceCanvas.height)));
    const canvas = document.createElement("canvas");
    canvas.width = sw;
    canvas.height = sh;
    canvas.getContext("2d", { willReadFrequently: true }).drawImage(sourceCanvas, sx, sy, sw, sh, 0, 0, sw, sh);
    return canvas;
  }

  async function extractEmbeddedPdfText(page, range) {
    const content = await page.getTextContent();
    const [viewX, viewY, viewRight, viewTop] = page.view;
    const pageWidth = Math.max(1, viewRight - viewX);
    const pageHeight = Math.max(1, viewTop - viewY);
    const entries = content.items.map((item) => {
      const x = (item.transform[4] - viewX + toNumber(item.width) / 2) / pageWidth;
      const y = 1 - ((item.transform[5] - viewY + toNumber(item.height) / 2) / pageHeight);
      return { text: String(item.str || "").trim(), x, y };
    }).filter((item) => (
      item.text &&
      item.x >= range.x && item.x <= range.x + range.width &&
      item.y >= range.y && item.y <= range.y + range.height
    ));
    entries.sort((a, b) => Math.abs(a.y - b.y) < 0.006 ? a.x - b.x : a.y - b.y);
    const rows = [];
    entries.forEach((entry) => {
      const lastRow = rows[rows.length - 1];
      const row = lastRow && Math.abs(lastRow.y - entry.y) < 0.008 ? lastRow : null;
      if (row) {
        row.items.push(entry);
      } else {
        rows.push({ y: entry.y, items: [entry] });
      }
    });
    return rows
      .sort((a, b) => a.y - b.y)
      .map((row) => row.items.sort((a, b) => a.x - b.x).map((item) => item.text).join("\t"))
      .join("\n");
  }

  function normalizedVendorText(value) {
    return String(value || "")
      .normalize("NFKC")
      .replace(/[|｜]/g, " ")
      .replace(/[¥￥]/g, "¥")
      .replace(/m\s*[2²]/gi, "㎡")
      .replace(/m\s*[3³]/gi, "㎥")
      .replace(/[‐‑‒–—―]/g, "-")
      .replace(/\u3000/g, " ");
  }

  function vendorNumber(value) {
    const raw = normalizedVendorText(value).trim();
    if (!raw) return null;
    const negative = /^\(.*\)$/.test(raw);
    const cleaned = raw.replace(/[(),，¥￥円]/g, "").replace(/△/g, "-");
    if (!/^-?\d+(?:\.\d+)?$/.test(cleaned)) return null;
    const number = Number(cleaned);
    return Number.isFinite(number) ? (negative ? -Math.abs(number) : number) : null;
  }

  function normalizeVendorUnit(value) {
    const unit = normalizedVendorText(value).replace(/\s/g, "");
    if (/^m2$/i.test(unit)) return "㎡";
    if (/^m3$/i.test(unit)) return "㎥";
    return unit;
  }

  function isVendorUnit(value) {
    return /^(式|set|lot|ea|m2|㎡|m3|㎥|m|枚|本|kg|t|箇所|ヶ所|個|台|人工|日|回|袋|組|セット)$/i.test(normalizeVendorUnit(value));
  }

  function hasVendorNetLabel(value) {
    return /(?:^|[^A-Za-z])net(?=$|[^A-Za-z])|ネット/i.test(normalizedVendorText(value));
  }

  function vendorAmountsInText(value) {
    const text = normalizedVendorText(value).replace(/\d+(?:\.\d+)?\s*%/g, "");
    const matches = text.match(/\(?\s*-?\s*¥?\s*\d[\d,]*(?:\.\d+)?\s*\)?/g) || [];
    return matches.map(vendorNumber).filter((amount) => amount !== null);
  }

  function vendorLabeledAmount(lines, pattern, options = {}) {
    for (let index = lines.length - 1; index >= 0; index -= 1) {
      const line = lines[index];
      const compactLine = line.replace(/\s/g, "");
      if ((!pattern.test(line) && !pattern.test(compactLine)) || (options.excludeNet && hasVendorNetLabel(line))) continue;
      const amounts = vendorAmountsInText(line);
      if (amounts.length) return amounts[amounts.length - 1];
    }
    return null;
  }

  function vendorAmountsClose(left, right) {
    if (left === null || right === null) return false;
    return Math.abs(left - right) <= Math.max(2, Math.abs(right) * 0.005);
  }

  function detectVendorNetTax(text) {
    const normalized = normalizedVendorText(text);
    const compactNormalized = normalized.replace(/[ \t]/g, "");
    const lines = normalized.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
    const netLines = lines.filter(hasVendorNetLabel);
    const netContext = netLines.join(" ");
    const inclusivePattern = /(?:税込(?:み)?|消費税込(?:み)?|内税|tax\s*(?:included|incl\.?))/i;
    const exclusivePattern = /(?:税抜(?:き)?|税別|外税|消費税別|tax\s*(?:excluded|excl\.?))/i;
    const rateMatch = compactNormalized.match(/(?:消費税(?:率)?|税率|tax(?:rate)?)\s*[(:：]?\s*(\d+(?:\.\d+)?)\s*%/i)
      || compactNormalized.match(/(\d+(?:\.\d+)?)\s*%\s*(?:消費税|税)/i);
    const taxRate = rateMatch ? Number(rateMatch[1]) : (toNumber(state.taxRate) || 10);
    const netAmount = vendorLabeledAmount(lines, /(?:^|[^A-Za-z])net(?=$|[^A-Za-z])|ネット/i);
    const beforeTaxAmount = vendorLabeledAmount(lines, /(?:税抜(?:工事価格|金額)?|小計|subtotal)/i, { excludeNet: true });
    const taxAmount = vendorLabeledAmount(lines, /(?:消費税|tax\s*amount)/i, { excludeNet: true });
    const totalAmount = vendorLabeledAmount(lines, /(?:税込(?:合計|金額)?|総合計|合計|grand\s*total|total)/i, { excludeNet: true });
    const netSaysInclusive = inclusivePattern.test(netContext);
    const netSaysExclusive = exclusivePattern.test(netContext);
    const documentSaysInclusive = inclusivePattern.test(normalized);
    const documentSaysExclusive = exclusivePattern.test(normalized);
    let mode = "unknown";
    let reason = "NET金額の税込・税抜を自動判定できませんでした。";

    if (netSaysInclusive !== netSaysExclusive) {
      mode = netSaysInclusive ? "inclusive" : "exclusive";
      reason = netSaysInclusive ? "NET表記の近くに税込の記載があります。" : "NET表記の近くに税抜・税別の記載があります。";
    } else if (netAmount !== null && documentSaysInclusive !== documentSaysExclusive) {
      mode = documentSaysInclusive ? "inclusive" : "exclusive";
      reason = documentSaysInclusive ? "選択範囲に税込の記載があります。" : "選択範囲に税抜・税別の記載があります。";
    } else if (netAmount !== null && vendorAmountsClose(netAmount, totalAmount)) {
      mode = "inclusive";
      reason = "NET金額が税込合計と一致しています。";
    } else if (netAmount !== null && vendorAmountsClose(netAmount, beforeTaxAmount)) {
      mode = "exclusive";
      reason = "NET金額が税抜金額または小計と一致しています。";
    } else if (netAmount !== null && taxAmount !== null && totalAmount !== null && vendorAmountsClose(netAmount + taxAmount, totalAmount)) {
      mode = "exclusive";
      reason = "NET金額と消費税の合計が税込合計と一致しています。";
    }

    return { mode, taxRate, netAmount, beforeTaxAmount, taxAmount, totalAmount, reason };
  }

  function vendorNetEntryFromLine(line) {
    if (!hasVendorNetLabel(line)) return null;
    const amounts = vendorAmountsInText(line);
    if (!amounts.length) return null;
    return { amount: amounts[amounts.length - 1], line: normalizedVendorText(line).trim() };
  }

  function isVendorHeaderOrTotal(line) {
    const compact = line.replace(/\s/g, "").toLowerCase();
    if (!compact) return true;
    if (/(名称|品名|項目|内容).*(数量|qty).*(単価|価格)/i.test(compact)) return true;
    return /^(小計|合計|総合計|消費税|税抜|税込|値引|net|total|ページ|page)/i.test(compact);
  }

  function parseVendorEstimateLine(rawLine) {
    const line = normalizedVendorText(rawLine).trim();
    if (!line || isVendorHeaderOrTotal(line)) return null;
    const tokens = line.replace(/,/g, "").split(/\s+/).filter(Boolean);
    const unitIndex = tokens.findIndex(isVendorUnit);
    let qty = null;
    let price = null;
    let prefixTokens = [];

    if (unitIndex > 0 && vendorNumber(tokens[unitIndex - 1]) !== null) {
      qty = vendorNumber(tokens[unitIndex - 1]);
      prefixTokens = tokens.slice(0, unitIndex - 1);
      const valuesAfterUnit = tokens.slice(unitIndex + 1).map(vendorNumber).filter((value) => value !== null);
      price = valuesAfterUnit[0] ?? 0;
    } else {
      const numbers = tokens.map((token, index) => ({ index, value: vendorNumber(token) })).filter((item) => item.value !== null);
      if (numbers.length < 2) return null;
      const qtyNumber = numbers.length >= 3 ? numbers[numbers.length - 3] : numbers[numbers.length - 2];
      const priceNumber = numbers.length >= 3 ? numbers[numbers.length - 2] : numbers[numbers.length - 1];
      qty = qtyNumber.value;
      price = priceNumber.value;
      prefixTokens = tokens.slice(0, qtyNumber.index);
    }

    while (prefixTokens.length && vendorNumber(prefixTokens[0]) !== null) prefixTokens.shift();
    const prefixText = prefixTokens.join(" ").trim();
    if (!prefixText || qty === null) return null;

    const coarseColumns = line.split(/\t+|\s{2,}/).map((part) => part.trim()).filter(Boolean);
    const textColumns = [];
    for (const column of coarseColumns) {
      const columnTokens = column.replace(/,/g, "").split(/\s+/).filter(Boolean);
      if (columnTokens.some(isVendorUnit) || (columnTokens.length === 1 && vendorNumber(columnTokens[0]) !== null)) break;
      textColumns.push(column);
    }
    const name = (textColumns[0] || prefixText).trim();
    const summary = textColumns.length > 1 ? textColumns.slice(1).join(" ").trim() : "";
    if (!name || isVendorHeaderOrTotal(name)) return null;
    return {
      name,
      summary,
      qty,
      unit: unitIndex >= 0 ? normalizeVendorUnit(tokens[unitIndex]) : "式",
      price: price ?? 0,
      sourcePrice: price ?? 0,
      isNetPrice: hasVendorNetLabel(line),
      netBasis: "unit"
    };
  }

  function parseVendorDetailText(text) {
    const rows = [];
    const notes = [];
    const netEntries = [];
    normalizedVendorText(text).split(/\r?\n/).map((line) => line.trim()).filter(Boolean).forEach((line) => {
      const netEntry = vendorNetEntryFromLine(line);
      if (netEntry) netEntries.push(netEntry);
      if (isVendorHeaderOrTotal(line)) return;
      const item = parseVendorEstimateLine(line);
      if (item) {
        rows.push(item);
      } else if (/^[※*・]/.test(line) || isNoteLine(line)) {
        notes.push(cleanNoteLine(line));
      }
    });
    return { rows, notes, netEntries };
  }

  function attachVendorNetEntries(rows, netEntries) {
    rows.forEach((row) => {
      if (row.sourcePrice === undefined) row.sourcePrice = row.price;
    });
    if (rows.some((row) => row.isNetPrice) || netEntries.length !== 1) return;
    const entry = netEntries[0];
    const entryText = normalizedText(entry.line);
    const matchingRows = rows.filter((row) => {
      const name = normalizedText(row.name);
      return name && entryText.includes(name);
    });
    const target = matchingRows.length === 1 ? matchingRows[0] : (rows.length === 1 ? rows[0] : null);
    if (!target) return;
    target.sourcePrice = entry.amount;
    target.price = entry.amount;
    target.isNetPrice = true;
    target.netBasis = "total";
  }

  function effectiveVendorNetTaxMode(session = vendorPdfSession) {
    if (!session) return "unknown";
    if (session.netTaxMode === "inclusive" || session.netTaxMode === "exclusive") return session.netTaxMode;
    return session.netTaxDetection?.mode || "unknown";
  }

  function vendorMoney(value) {
    return Math.round(toNumber(value)).toLocaleString("ja-JP");
  }

  function vendorPriceMoney(value) {
    return Number(toNumber(value).toFixed(2)).toLocaleString("ja-JP", { maximumFractionDigits: 2 });
  }

  function vendorNetFactorPlan(session = vendorPdfSession) {
    const rows = session?.rows || [];
    const detection = session?.netTaxDetection;
    if (!detection || detection.netAmount === null || !rows.length || rows.some((row) => row.isNetPrice)) return null;
    const sourceSubtotal = rows.reduce((sum, row) => (
      sum + toNumber(row.qty) * toNumber(row.sourcePrice ?? row.price)
    ), 0);
    const statedSubtotal = toNumber(detection.beforeTaxAmount);
    const baseSubtotal = statedSubtotal > 0 ? statedSubtotal : sourceSubtotal;
    const mode = effectiveVendorNetTaxMode(session);
    const taxRate = Math.max(0, toNumber(session?.netTaxRate ?? state.taxRate));
    const multiplier = 1 + taxRate / 100;
    const netAmount = toNumber(detection.netAmount);
    const active = sourceSubtotal > 0 && baseSubtotal > 0 && netAmount > 0;
    if (!active) return null;
    if (statedSubtotal > 0 && !vendorAmountsClose(sourceSubtotal, statedSubtotal)) {
      return {
        active: true,
        valid: false,
        sourceSubtotal,
        statedSubtotal,
        netAmount,
        error: `選択明細の合計${vendorMoney(sourceSubtotal)}円とPDF小計${vendorMoney(statedSubtotal)}円が一致しません。取込範囲を確認してください。`
      };
    }
    if (mode === "unknown") {
      return {
        active: true,
        valid: false,
        sourceSubtotal,
        statedSubtotal: baseSubtotal,
        netAmount,
        error: "NET金額の税込・税抜を確認してください。"
      };
    }
    const targetBeforeTax = mode === "inclusive" ? netAmount / multiplier : netAmount;
    const factor = targetBeforeTax / baseSubtotal;
    return {
      active: true,
      valid: Number.isFinite(factor) && factor > 0,
      mode,
      taxRate,
      multiplier,
      sourceSubtotal,
      statedSubtotal: baseSubtotal,
      netAmount,
      targetBeforeTax,
      factor,
      error: "NET掛け率を計算できませんでした。"
    };
  }

  function calculateVendorNetUnitPrice(item, session = vendorPdfSession) {
    const sourcePrice = toNumber(item.sourcePrice ?? item.price);
    const factorPlan = vendorNetFactorPlan(session);
    if (factorPlan?.active) {
      if (!factorPlan.valid) {
        return { valid: false, price: sourcePrice, formula: factorPlan.error, error: factorPlan.error };
      }
      const unitPrice = Number((sourcePrice * factorPlan.factor).toFixed(2));
      const netExpression = factorPlan.mode === "inclusive"
        ? `税込NET ${vendorMoney(factorPlan.netAmount)}円 ÷ ${formatNumber(factorPlan.multiplier)}`
        : `税抜NET ${vendorMoney(factorPlan.netAmount)}円`;
      return {
        valid: true,
        price: unitPrice,
        formula: `元単価 ${vendorPriceMoney(sourcePrice)}円 × ${netExpression} ÷ 元小計 ${vendorMoney(factorPlan.statedSubtotal)}円（NET掛け率${formatNumber(factorPlan.factor * 100)}%） = 税抜単価 ${vendorPriceMoney(unitPrice)}円`
      };
    }
    if (!item.isNetPrice) return { valid: true, price: toNumber(item.price), formula: "" };
    const mode = effectiveVendorNetTaxMode(session);
    const taxRate = Math.max(0, toNumber(session?.netTaxRate ?? state.taxRate));
    const quantity = toNumber(item.qty);
    const totalBasis = item.netBasis === "total";
    if (mode === "unknown") {
      return { valid: false, price: sourcePrice, formula: `NET ${vendorMoney(sourcePrice)}円（税込・税抜を確認）`, error: "NET金額の税込・税抜を確認してください。" };
    }
    if (totalBasis && quantity <= 0) {
      return { valid: false, price: sourcePrice, formula: `NET総額 ${vendorMoney(sourcePrice)}円（数量を確認）`, error: "NET総額を単価にするため数量を確認してください。" };
    }

    const multiplier = 1 + taxRate / 100;
    let unitPrice = mode === "inclusive" ? sourcePrice / multiplier : sourcePrice;
    let expression = mode === "inclusive"
      ? `税込NET ${vendorMoney(sourcePrice)}円 ÷ ${formatNumber(multiplier)}`
      : `税抜NET ${vendorMoney(sourcePrice)}円`;
    if (totalBasis) {
      unitPrice /= quantity;
      expression += ` ÷ 数量${formatNumber(quantity)}`;
    }
    const roundedPrice = Math.round(unitPrice);
    return {
      valid: true,
      price: roundedPrice,
      formula: `${expression} = 税抜単価 ${vendorMoney(roundedPrice)}円`
    };
  }

  function renderVendorNetTaxReview() {
    const session = vendorPdfSession;
    if (!session) return;
    const modeSelect = $("vendorNetTaxMode");
    const rateInput = $("vendorNetTaxRate");
    const status = $("vendorNetTaxStatus");
    if (!modeSelect || !rateInput || !status) return;
    modeSelect.value = session.netTaxMode || "auto";
    rateInput.value = session.netTaxRate ?? (toNumber(state.taxRate) || 10);
    const hasNet = session.rows.some((row) => row.isNetPrice) || session.netEntries.length > 0;
    if (!hasNet) {
      status.className = "vendor-net-status is-neutral";
      status.textContent = "NET金額は検出されませんでした。通常の単価として取り込みます。";
      return;
    }
    const factorPlan = vendorNetFactorPlan(session);
    if (factorPlan?.active) {
      status.className = `vendor-net-status ${factorPlan.valid ? "is-ready" : "needs-review"}`;
      status.textContent = factorPlan.valid
        ? `税抜NET ${vendorMoney(factorPlan.targetBeforeTax)}円 / 元小計 ${vendorMoney(factorPlan.statedSubtotal)}円 / NET掛け率 ${formatNumber(factorPlan.factor * 100)}%。全${session.rows.length}明細の単価へ反映します。`
        : factorPlan.error;
      return;
    }
    const mode = effectiveVendorNetTaxMode(session);
    const modeLabel = mode === "inclusive" ? "税込NET" : (mode === "exclusive" ? "税抜NET" : "判定要確認");
    const detectedAmount = session.netTaxDetection?.netAmount;
    const amountText = detectedAmount === null || detectedAmount === undefined ? "" : ` / NET ${vendorMoney(detectedAmount)}円`;
    status.className = `vendor-net-status ${mode === "unknown" ? "needs-review" : "is-ready"}`;
    status.textContent = `${modeLabel} / 税率${formatNumber(session.netTaxRate)}%${amountText}。${session.netTaxDetection?.reason || ""}`;
  }

  function renderVendorReviewPriceFormula(row, item) {
    const formula = row.querySelector(".vendor-price-formula");
    if (!formula) return;
    const calculation = calculateVendorNetUnitPrice(item);
    formula.textContent = calculation.formula;
    formula.hidden = !calculation.formula;
  }

  function refreshVendorReviewCalculations() {
    if (!vendorPdfSession) return;
    renderVendorNetTaxReview();
    $("vendorOcrRows").querySelectorAll("tr").forEach((row, index) => {
      const item = vendorPdfSession.rows[index];
      if (item) renderVendorReviewPriceFormula(row, item);
    });
  }

  function renderVendorOcrReview() {
    if (!vendorPdfSession) return;
    const body = $("vendorOcrRows");
    body.replaceChildren();
    renderVendorNetTaxReview();
    vendorPdfSession.rows.forEach((item, index) => {
      const row = document.createElement("tr");
      [["name", "text"], ["summary", "text"], ["qty", "number"], ["unit", "text"], ["price", "number"]].forEach(([key, type]) => {
        const cell = document.createElement("td");
        const input = document.createElement("input");
        input.type = type;
        if (type === "number") input.step = "any";
        input.value = key === "price" && (item.isNetPrice || vendorNetFactorPlan(vendorPdfSession)?.active)
          ? (item.sourcePrice ?? item.price ?? "")
          : (item[key] ?? "");
        input.setAttribute("aria-label", `${index + 1}行目 ${key}`);
        input.addEventListener("input", () => {
          const value = type === "number" ? toNumber(input.value) : input.value;
          item[key] = value;
          if (key === "price") item.sourcePrice = value;
          if (key === "qty" || key === "price") refreshVendorReviewCalculations();
        });
        cell.appendChild(input);
        if (key === "price") {
          const formula = document.createElement("div");
          formula.className = "vendor-price-formula";
          formula.hidden = !item.isNetPrice;
          cell.appendChild(formula);
        }
        row.appendChild(cell);
      });

      const netCell = document.createElement("td");
      netCell.className = "vendor-net-cell";
      const netCheckbox = document.createElement("input");
      const factorPlan = vendorNetFactorPlan(vendorPdfSession);
      netCheckbox.type = "checkbox";
      netCheckbox.checked = Boolean(item.isNetPrice || factorPlan?.active);
      netCheckbox.disabled = Boolean(factorPlan?.active);
      netCheckbox.title = factorPlan?.active ? "PDF全体のNET掛け率を反映" : "この金額をNETとして税抜単価へ換算";
      netCheckbox.setAttribute("aria-label", `${index + 1}行目をNET金額として換算`);
      netCheckbox.addEventListener("change", () => {
        item.isNetPrice = netCheckbox.checked;
        if (item.isNetPrice) {
          const otherNetRow = vendorPdfSession.rows.some((other, otherIndex) => otherIndex !== index && other.isNetPrice);
          const detectedNet = !otherNetRow && vendorPdfSession.netEntries.length === 1 ? vendorPdfSession.netEntries[0] : null;
          item.sourcePrice = detectedNet ? detectedNet.amount : toNumber(item.sourcePrice ?? item.price);
          item.price = item.sourcePrice;
          item.netBasis = detectedNet ? "total" : (item.netBasis || "unit");
        }
        renderVendorOcrReview();
      });
      netCell.appendChild(netCheckbox);
      row.appendChild(netCell);

      const actionCell = document.createElement("td");
      const remove = document.createElement("button");
      remove.type = "button";
      remove.className = "vendor-review-remove";
      remove.title = "この明細を削除";
      remove.textContent = "×";
      remove.addEventListener("click", () => {
        if (!vendorPdfSession) return;
        vendorPdfSession.rows.splice(index, 1);
        renderVendorOcrReview();
      });
      actionCell.appendChild(remove);
      row.appendChild(actionCell);
      body.appendChild(row);
      renderVendorReviewPriceFormula(row, item);
    });
    $("vendorOcrNotes").value = vendorPdfSession.notes;
    $("vendorOcrReview").hidden = false;
  }

  async function runVendorSelectionOcr() {
    const session = vendorPdfSession;
    if (!session || !session.ranges.length) {
      $("vendorPdfStatus").textContent = "先にPDF上で取込範囲を選択してください。";
      return;
    }
    const mode = selectedOcrMode() === "fast" ? "fast" : "jpn";
    const sourcePages = new Map();
    const rows = [];
    const notes = [];
    const netEntries = [];
    const selectedTexts = [];
    const pageContextTexts = [];
    const embeddedTexts = new Map();
    let worker = null;
    let workerError = null;
    setVendorPdfProcessing(true, "OCRを準備しています。");
    setProgress(0, "OCR準備中");
    try {
      for (const range of session.ranges) {
        const page = await session.pdf.getPage(range.pageNo);
        embeddedTexts.set(range.id, await extractEmbeddedPdfText(page, range));
      }
      for (const pageNo of new Set(session.ranges.map((range) => range.pageNo))) {
        const page = await session.pdf.getPage(pageNo);
        const pageText = await extractEmbeddedPdfText(page, { x: 0, y: 0, width: 1, height: 1 });
        if (pageText.trim()) {
          pageContextTexts.push(pageText);
          normalizedVendorText(pageText).split(/\r?\n/).forEach((line) => {
            const entry = vendorNetEntryFromLine(line);
            if (entry) netEntries.push(entry);
          });
        }
      }
      const needsImageOcr = session.ranges.some((range) => (embeddedTexts.get(range.id) || "").replace(/\s/g, "").length < 8);
      if (needsImageOcr) {
        try {
          worker = await withTimeout(createVendorOcrWorker(mode), 60000, "OCRの準備が60秒を超えました。");
          await worker.setParameters({ preserve_interword_spaces: "1" });
        } catch (error) {
          workerError = error;
        }
      }

      for (let index = 0; index < session.ranges.length; index += 1) {
        const range = session.ranges[index];
        const page = await session.pdf.getPage(range.pageNo);
        $("vendorPdfStatus").textContent = `範囲 ${index + 1}/${session.ranges.length} をOCR中です。`;
        const embeddedText = embeddedTexts.get(range.id) || "";
        let ocrText = "";
        if (worker && embeddedText.replace(/\s/g, "").length < 8) {
          try {
            let sourceCanvas = sourcePages.get(range.pageNo);
            if (!sourceCanvas) {
              sourceCanvas = await renderVendorOcrSourcePage(page, mode);
              sourcePages.set(range.pageNo, sourceCanvas);
            }
            const result = await withTimeout(worker.recognize(cropVendorPdfRange(sourceCanvas, range)), 60000, `範囲 ${index + 1} のOCRが60秒を超えました。`);
            ocrText = result.data.text || "";
          } catch (error) {
            workerError = error;
          }
        }
        const embeddedLength = embeddedText.replace(/\s/g, "").length;
        const selectedText = embeddedLength >= 8 ? embeddedText : ocrText;
        if (selectedText.trim()) {
          selectedTexts.push(selectedText);
          normalizedVendorText(selectedText).split(/\r?\n/).forEach((line) => {
            const entry = vendorNetEntryFromLine(line);
            if (entry) netEntries.push(entry);
          });
        }
        if (range.role === "notes") {
          if (selectedText.trim()) notes.push(selectedText.trim());
        } else if (range.role === "details") {
          const parsed = parseVendorDetailText(selectedText);
          rows.push(...parsed.rows);
          notes.push(...parsed.notes);
          netEntries.push(...parsed.netEntries);
        }
        setProgress(((index + 1) / session.ranges.length) * 100, `範囲 ${index + 1}/${session.ranges.length}`);
        await nextPaint();
      }

      if (!rows.length && !notes.join("").trim() && workerError) {
        throw new Error(workerError.message || workerError);
      }

      const uniqueRows = [];
      const rowKeys = new Set();
      rows.forEach((item) => {
        const key = `${normalizedText(item.name)}|${normalizedText(item.summary)}|${item.qty}|${item.unit}|${item.price}|${item.isNetPrice ? "net" : "price"}`;
        if (rowKeys.has(key)) return;
        rowKeys.add(key);
        uniqueRows.push(item);
      });
      const uniqueNetEntries = [];
      const netEntryKeys = new Set();
      netEntries.forEach((entry) => {
        const key = `${entry.amount}|${normalizedText(entry.line)}`;
        if (netEntryKeys.has(key)) return;
        netEntryKeys.add(key);
        uniqueNetEntries.push(entry);
      });
      session.netEntries = uniqueNetEntries;
      session.netTaxDetection = detectVendorNetTax([...pageContextTexts, ...selectedTexts].join("\n"));
      session.netTaxMode = "auto";
      session.netTaxRate = session.netTaxDetection.taxRate;
      session.rows = uniqueRows;
      if (!vendorNetFactorPlan(session)?.active) attachVendorNetEntries(uniqueRows, uniqueNetEntries);
      session.notes = Array.from(new Set(notes.flatMap((text) => String(text).split(/\r?\n/)).map(cleanNoteLine).filter(Boolean))).join("\n");
      renderVendorOcrReview();
      const fallbackMessage = workerError && !worker ? " PDF内の文字情報から読み取りました。" : "";
      $("vendorPdfStatus").textContent = `明細 ${session.rows.length}件、備考 ${session.notes ? session.notes.split("\n").length : 0}件を読み取りました。内容を確認して反映してください。${fallbackMessage}`;
    } finally {
      if (worker) await worker.terminate().catch(() => {});
      setVendorPdfProcessing(false);
      $("vendorPdfPrevButton").disabled = session.pageNo <= 1;
      $("vendorPdfNextButton").disabled = session.pageNo >= session.pdf.numPages;
    }
  }

  function addVendorReviewRow() {
    if (!vendorPdfSession) return;
    vendorPdfSession.rows.push({ name: "", summary: "", qty: 1, unit: "式", price: 0, sourcePrice: 0, isNetPrice: false, netBasis: "unit" });
    renderVendorOcrReview();
  }

  function removeExistingVendorPdfRows(fileName) {
    const marker = `業者見積OCR: ${fileName}`;
    state.sheets.forEach((sheet) => {
      sheet.items = sheet.items.filter((item) => String(item.remarks || "") !== marker);
      const hasImportedItems = sheet.items.some((item) => item.type === "item" && item.category === "取り込み");
      let importSectionKept = false;
      sheet.items = sheet.items.filter((item) => {
        if (item.type !== "section" || item.category !== "取り込み") return true;
        if (!hasImportedItems || importSectionKept) return false;
        importSectionKept = true;
        return true;
      });
    });
  }

  function applyVendorOcrResult() {
    const session = vendorPdfSession;
    if (!session) return;
    session.notes = $("vendorOcrNotes").value.trim();
    const importRows = session.rows.filter((item) => String(item.name || "").trim());
    if (!importRows.length && !session.notes) {
      $("vendorPdfStatus").textContent = "反映する明細または備考がありません。";
      return;
    }
    const priceCalculations = importRows.map((row) => calculateVendorNetUnitPrice(row, session));
    const invalidCalculationIndex = priceCalculations.findIndex((calculation) => !calculation.valid);
    if (invalidCalculationIndex >= 0) {
      $("vendorPdfStatus").textContent = priceCalculations[invalidCalculationIndex].error || `明細${invalidCalculationIndex + 1}のNET計算を確認してください。`;
      return;
    }

    state.estimateMode = "byTrade";
    tradePresets.forEach((trade) => ensureSheet(trade.name));
    const forcedTradeName = selectedImportTrade();
    const batchTradeName = forcedTradeName || classifyTrade(`${session.file.name} ${importRows.map((row) => `${row.name} ${row.summary}`).join(" ")}`);
    removeExistingVendorPdfRows(session.file.name);
    const counts = {};
    const firstTradeNames = [];
    const importBatchKeys = new Set();
    importRows.forEach((row, rowIndex) => {
      const priceCalculation = priceCalculations[rowIndex];
      const tradeName = batchTradeName;
      const sheet = ensureSheet(tradeName);
      upsertImportedItem(sheet, {
        type: "item",
        category: "取り込み",
        name: String(row.name || "").trim(),
        summary: String(row.summary || "").trim(),
        qty: toNumber(row.qty),
        unit: String(row.unit || "式").trim() || "式",
        price: priceCalculation.price,
        priceFormula: priceCalculation.formula,
        printRemarks: "",
        remarks: `業者見積OCR: ${session.file.name}`
      }, importBatchKeys);
      counts[tradeName] = (counts[tradeName] || 0) + 1;
      if (!firstTradeNames.includes(tradeName)) firstTradeNames.push(tradeName);
    });
    if (session.notes) appendImportedNotes(session.notes.split(/\r?\n/));
    if (firstTradeNames.length) {
      state.activeSheetIndex = Math.max(0, state.sheets.findIndex((sheet) => sheet.name === firstTradeNames[0]));
    }
    render();
    const countText = Object.entries(counts).map(([name, count]) => `${name}:${count}件`).join(" / ");
    const result = { applied: true, rowCount: importRows.length, noteCount: session.notes ? session.notes.split(/\r?\n/).filter(Boolean).length : 0 };
    closeVendorPdfImporter(result);
    const netCount = priceCalculations.filter((calculation) => calculation.formula).length;
    $("importResult").textContent = `業者見積PDFを反映しました。${countText}${result.noteCount ? ` / 備考:${result.noteCount}件` : ""}${netCount ? ` / NET換算:${netCount}件` : ""} 金額は税抜単価×数量で自動計算されます。`;
  }

  async function handleFiles(files) {
    const list = Array.from(files || []);
    if (!list.length) return;

    setProgress(0, "読み込み開始");
    $("importResult").textContent = `${list.length}件のファイルを読み取り中です。`;
    const texts = [];
    const failures = [];
    const fileTradeHints = new Set();
    let pdfRowsApplied = 0;
    let pdfNotesApplied = 0;
    lastConcreteReadSummary = [];

    for (let fileIndex = 0; fileIndex < list.length; fileIndex += 1) {
      const file = list[fileIndex];
      try {
        const ext = file.name.split(".").pop().toLowerCase();
        const fileTrade = classifyTrade(file.name);
        if (fileTrade !== "未分類") fileTradeHints.add(fileTrade);
        const fileBase = (fileIndex / list.length) * 100;
        const fileSpan = 100 / list.length;
        if (ext === "pdf") {
          setProgress(fileBase, `${file.name} 範囲指定待ち`);
          const result = await openVendorPdfImporter(file);
          if (result.applied) {
            pdfRowsApplied += result.rowCount || 0;
            pdfNotesApplied += result.noteCount || 0;
          }
        } else if (ext === "csv" || ext === "tsv") {
          setProgress(fileBase + fileSpan * 0.5, `${file.name} を読み取り中`);
          texts.push(await withTimeout(readDelimitedFile(file, ext === "tsv" ? "\t" : ","), 15000, `${file.name}: CSV読み取りが15秒を超えました。`));
        } else if (ext === "xlsx" || ext === "xlsm") {
          texts.push(await withTimeout(readXlsxFile(file, fileBase, fileSpan), 30000, `${file.name}: Excel読み取りが30秒を超えました。`));
        } else {
          failures.push(`${file.name}: 未対応形式`);
        }
      } catch (error) {
        failures.push(error?.message || `${file.name}: 読み取り失敗`);
      }
    }

    const merged = texts.filter(Boolean).join("\n");
    if (merged) {
      $("importText").value = merged.trim();
      setProgress(95, "仕分け中");
      pendingImportTradeName = selectedImportTrade() || (fileTradeHints.size === 1 ? Array.from(fileTradeHints)[0] : "");
      try {
        importText();
      } finally {
        pendingImportTradeName = "";
      }
    }
    if (failures.length) {
      $("importResult").textContent += ` / ${failures.join(" / ")}`;
    }
    if (lastConcreteReadSummary.length) {
      $("importResult").textContent += ` / Excel読取: ${lastConcreteReadSummary.slice(0, 8).join("、")}`;
    }
    if (pdfRowsApplied || pdfNotesApplied) {
      $("importResult").textContent += ` / PDF反映: 明細${pdfRowsApplied}件・備考${pdfNotesApplied}件`;
    }
    setProgress(100, failures.length ? "一部失敗あり" : "完了");
  }

  async function readPdfFile(file, baseProgress = 0, progressSpan = 100) {
    if (!window.pdfjsLib) {
      const pdfjs = await import("./pdf.min.mjs");
      window.pdfjsLib = pdfjs;
      pdfjs.GlobalWorkerOptions.workerSrc = "./pdf.worker.min.mjs";
    }

    const buffer = await file.arrayBuffer();
    const pdf = await window.pdfjsLib.getDocument({
      data: buffer,
      disableWorker: location.protocol === "file:"
    }).promise;
    const lines = [];
    let ocrPages = 0;
    const mode = selectedOcrMode();
    for (let pageNo = 1; pageNo <= pdf.numPages; pageNo += 1) {
      const pageProgress = baseProgress + progressSpan * ((pageNo - 1) / Math.max(pdf.numPages, 1));
      setProgress(pageProgress, `${file.name} ${pageNo}/${pdf.numPages}ページ`);
      $("importResult").textContent = `${file.name} ${pageNo}/${pdf.numPages}ページを読み取り中です。`;
      const page = await pdf.getPage(pageNo);
      const content = await page.getTextContent();
      let lastY = null;
      let line = [];
      content.items.forEach((item) => {
        const y = Math.round(item.transform[5]);
        if (lastY !== null && Math.abs(y - lastY) > 3) {
          if (line.length) lines.push(line.join(" "));
          line = [];
        }
        line.push(item.str);
        lastY = y;
      });
      if (line.length) lines.push(line.join(" "));
      const pageText = line.join(" ");
      const hasEnoughText = content.items.map((item) => item.str).join("").replace(/\s/g, "").length > 30;
      if (!hasEnoughText && mode !== "off") {
        $("importResult").textContent = `${file.name} ${pageNo}/${pdf.numPages}ページをOCR中です。`;
        const ocrText = await ocrPdfPage(page, mode, pageProgress, progressSpan / Math.max(pdf.numPages, 1));
        if (ocrText.trim()) lines.push(ocrText);
        ocrPages += 1;
      }
      await nextPaint();
    }
    setProgress(baseProgress + progressSpan, `${file.name} 読み取り完了`);
    if (ocrPages) {
      lines.push(`OCRページ数 ${ocrPages}`);
    }
    return rowsToImportLines(lines.map((line) => line.split(/\s+/).filter(Boolean)));
  }

  function withTimeout(promise, ms, message) {
    return Promise.race([
      promise,
      new Promise((_, reject) => setTimeout(() => reject(new Error(message)), ms))
    ]);
  }

  function nextPaint() {
    return new Promise((resolve) => requestAnimationFrame(() => resolve()));
  }

  function selectedOcrMode() {
    return $("ocrMode")?.value || "off";
  }

  async function ocrPdfPage(page, mode, baseProgress = 0, progressSpan = 10) {
    const Tesseract = await loadTesseract();
    const viewport = page.getViewport({ scale: mode === "fast" ? 1.25 : 1.7 });
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);
    await page.render({ canvasContext: context, viewport }).promise;

    const options = {
      workerPath: "./tesseract-worker.min.js",
      logger: (message) => {
        if (message.status && typeof message.progress === "number") {
          setProgress(baseProgress + progressSpan * message.progress, `OCR中 ${Math.round(message.progress * 100)}%`);
          $("importResult").textContent = `OCR中: ${message.status} ${Math.round(message.progress * 100)}%`;
        }
      }
    };
    let worker;
    try {
      worker = await Tesseract.createWorker(mode === "fast" ? "eng" : ["jpn", "eng"], 1, options);
    } catch (error) {
      $("importResult").textContent = "日本語OCRデータを取得できなかったため、英数字OCRで読み取ります。";
      worker = await Tesseract.createWorker("eng", 1, options);
    }
    try {
      await worker.setParameters({ preserve_interword_spaces: "1" });
      const result = await worker.recognize(canvas);
      return result.data.text || "";
    } finally {
      await worker.terminate();
    }
  }

  function loadTesseract() {
    if (window.Tesseract) return Promise.resolve(window.Tesseract);
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "./tesseract.min.js";
      script.onload = () => window.Tesseract ? resolve(window.Tesseract) : reject(new Error("Tesseract load failed"));
      script.onerror = () => reject(new Error("Tesseract script not found"));
      document.head.appendChild(script);
    });
  }

  async function readXlsxFile(file, baseProgress = 0, progressSpan = 100) {
    $("importResult").textContent = `${file.name} のExcel内容を読み取り中です。`;
    setProgress(baseProgress, `${file.name} を開いています`);
    const entries = await unzipXlsx(await file.arrayBuffer());
    const sharedStrings = parseSharedStrings(entries.get("xl/sharedStrings.xml") || "");
    const workbook = parseWorkbook(entries);
    const rows = [];
    const tradeName = classifyTrade(file.name);
    const targetSheets = isConcreteSheet(tradeName) && workbook.some((sheet) => sheet.name.includes("全部材"))
      ? workbook.filter((sheet) => sheet.name.includes("全部材"))
      : workbook;
    targetSheets.forEach((sheet, index) => {
      setProgress(baseProgress + progressSpan * (index / Math.max(targetSheets.length, 1)), `${file.name} ${sheet.name || index + 1}/${targetSheets.length}シート`);
      $("importResult").textContent = `${file.name} ${sheet.name || index + 1}/${targetSheets.length}シートを読み取り中です。`;
      const xml = entries.get(sheet.path);
      if (!xml) return;
      rows.push(...parseWorksheetRows(xml, sharedStrings, sheet.name));
    });
    setProgress(baseProgress + progressSpan, `${file.name} 読み取り完了`);
    return rowsToImportLines(rows, { tradeName, sourceName: file.name });
  }

  function setProgress(percent, label) {
    const value = Math.max(0, Math.min(100, Math.round(percent)));
    $("importProgressWrap").classList.add("active");
    $("importProgressWrap").setAttribute("aria-hidden", "false");
    $("importProgressBar").style.width = `${value}%`;
    $("importProgressPercent").textContent = `${value}%`;
    $("importProgressLabel").textContent = label || "";
  }

  async function readDelimitedFile(file, delimiter) {
    const text = await file.text();
    const rows = text.split(/\r?\n/).map((line) => parseDelimitedLine(line, delimiter));
    return rowsToImportLines(rows, { tradeName: classifyTrade(file.name), sourceName: file.name });
  }

  function rowsToImportLines(rows, options = {}) {
    const cleanedRows = rows.map((row) => {
      const cleaned = row.map((cell) => String(cell || "").trim());
      cleaned.__sheetName = row.__sheetName || "";
      return cleaned;
    }).filter((row) => row.some(Boolean));
    const insulationLines = insulationQuantityRowsToImportLines(cleanedRows);
    if (insulationLines.length) return insulationLines.join("\n");
    if (isFormworkWorkbook(options, cleanedRows)) {
      const formworkLines = formworkRowsToImportLines(cleanedRows);
      if (formworkLines.length) return formworkLines.join("\n");
    }
    if (isLeanConcreteGravelWorkbook(options, cleanedRows)) {
      const routedLines = leanConcreteGravelRowsToImportLines(cleanedRows);
      if (routedLines.length) return routedLines.join("\n");
    }
    if (isConcreteSheet(options.tradeName)) {
      const concreteLines = concreteRowsToImportLines(cleanedRows);
      if (concreteLines.length) return concreteLines.join("\n");
    }
    if (isEarthworkWorkbook(options, cleanedRows)) {
      const earthworkLines = earthworkRowsToImportLines(cleanedRows);
      return earthworkLines.join("\n");
    }
    const headerIndex = cleanedRows.findIndex((row) => hasHeaderAliases(row));
    if (headerIndex < 0) {
      return cleanedRows.map((row) => row.filter(Boolean).join(" ")).join("\n");
    }

    const headers = cleanedRows[headerIndex];
    const map = mapHeaderColumns(headers);
    const lines = [];
    cleanedRows.slice(headerIndex + 1).forEach((row) => {
      const name = cellAt(row, map.name);
      if (!name || isNonEstimateLine(name)) return;
      const summary = cellAt(row, map.summary);
      const qty = cellAt(row, map.qty) || "1";
      const unit = cellAt(row, map.unit) || "式";
      const price = cellAt(row, map.price) || inferPriceFromAmount(cellAt(row, map.amount), qty) || "0";
      const remarks = cellAt(row, map.remarks);
      lines.push([name, summary, qty, unit, price, remarks].filter(Boolean).join(" "));
    });
    if (lines.length) return lines.join("\n");
    return cleanedRows.map((row) => row.filter(Boolean).join(" ")).join("\n");
  }

  function isFormworkWorkbook(options, rows) {
    const source = `${options.tradeName || ""} ${options.sourceName || ""}`;
    if (isFormworkSheet(source)) return true;
    return rows.some((row) => /型枠/.test(row.__sheetName || "")) ||
      rows.some((row) => row.some((cell) => /型枠種類|型枠位置|躯体面積/.test(String(cell || ""))));
  }

  function formworkRowsToImportLines(rows) {
    const sheetNames = Array.from(new Set(rows.map((row) => row.__sheetName || "")));
    const preferredNames = sheetNames.filter((name) => /全部材|合計|集計/.test(name));
    const targetRows = preferredNames.length
      ? rows.filter((row) => preferredNames.includes(row.__sheetName || ""))
      : rows;
    const headerIndex = targetRows.findIndex((row) => row.some((cell) => /型枠種類/.test(String(cell || ""))) && row.some((cell) => /躯体面積|面積/.test(String(cell || ""))));
    if (headerIndex < 0) return [];
    const header = targetRows[headerIndex];
    const typeIndex = header.findIndex((cell) => /型枠種類/.test(String(cell || "")));
    const positionIndex = header.findIndex((cell) => /型枠位置/.test(String(cell || "")));
    const qtyIndex = header.findIndex((cell) => /躯体面積|面積/.test(String(cell || "")));
    if (typeIndex < 0 || qtyIndex < 0) return [];

    const totals = new Map();
    targetRows.slice(headerIndex + 1).forEach((row) => {
      const formType = String(row[typeIndex] || "").trim();
      const position = String(row[positionIndex] || "").trim();
      const qty = numericCellValue(row[qtyIndex]);
      if (!formType || qty <= 0) return;
      const name = formworkTargetName(formType);
      const summary = formworkTargetSummary(formType);
      const key = `${name}|${summary}`;
      const current = totals.get(key) || { name, summary, positions: new Set(), qty: 0 };
      if (position) current.positions.add(position);
      current.qty += qty;
      totals.set(key, current);
    });

    return Array.from(totals.values()).map((item) => (
      ["工種取込", "型枠工事", item.name, item.summary, formatNumber(item.qty), "㎡", 0, `Excel取込:型枠 ${Array.from(item.positions).join("/")}`].join("\t")
    ));
  }

  function formworkTargetName(formType) {
    const text = normalizedText(formType);
    if (/C種|Ｃ種|B種|Ｂ種/i.test(text)) return "普通型枠合板";
    return "型枠";
  }

  function formworkTargetSummary(formType) {
    const text = String(formType || "").trim();
    if (/C種|Ｃ種/i.test(text)) return "基礎部";
    if (/B種|Ｂ種/i.test(text)) return "地上軸部";
    return text;
  }

  function insulationQuantityRowsToImportLines(rows) {
    const sheetNames = Array.from(new Set(rows.map((row) => row.__sheetName || "")));
    let areaTotal = 0;
    let volumeTotal = 0;

    sheetNames.forEach((sheetName) => {
      const sheetRows = rows.filter((row) => (row.__sheetName || "") === sheetName);
      const headerIndex = sheetRows.findIndex((row) => row.some((cell) => /断熱材面積/.test(String(cell || ""))));
      if (headerIndex < 0) return;
      const header = sheetRows[headerIndex];
      const areaIndexes = header
        .map((cell, index) => (/断熱材面積/.test(String(cell || "")) ? index : -1))
        .filter((index) => index >= 0);
      const volumeIndexes = header
        .map((cell, index) => (/断熱材体積/.test(String(cell || "")) ? index : -1))
        .filter((index) => index >= 0);

      sheetRows.slice(headerIndex + 1).forEach((row) => {
        areaIndexes.forEach((index) => {
          areaTotal += numericCellValue(row[index]);
        });
        volumeIndexes.forEach((index) => {
          volumeTotal += numericCellValue(row[index]);
        });
      });
    });

    if (areaTotal <= 0) return [];
    const rawThickness = volumeTotal > 0 ? (volumeTotal / areaTotal) * 1000 : 0;
    const thickness = rawThickness > 0 ? Math.round(rawThickness / 5) * 5 : 0;
    const qty = ceilingInsulationQuantity(areaTotal);
    const summary = thickness > 0 ? `B種 厚${thickness}mmスタイロフォーム` : "スタイロフォーム";
    lastConcreteReadSummary.push(`断熱材=${formatNumber(qty)}枚 インサート${formatNumber(areaTotal)}÷1.62 繰り上げ+1`);
    lastConcreteReadSummary.push(`天井インサート=${formatNumber(areaTotal)}㎡`);
    return [
      [
        "工種取込",
        "型枠工事",
        "天井断熱材",
        summary,
        formatNumber(qty),
        "枚",
        0,
        `Excel取込:インサート金物 ${formatNumber(areaTotal)}÷1.62 小数点繰り上げ +1`
      ].join("\t"),
      [
        "工種取込",
        "型枠工事",
        "インサート金物",
        "天井インサート",
        formatNumber(areaTotal),
        "㎡",
        0,
        "Excel取込:断熱材面積換算"
      ].join("\t")
    ];
  }

  function isEarthworkSheet(sheetOrName) {
    const name = typeof sheetOrName === "string" ? sheetOrName : sheetOrName?.name;
    return String(name || "").includes("土工事");
  }

  function isLeanConcreteGravelWorkbook(options, rows) {
    const source = `${options.sourceName || ""} ${options.tradeName || ""}`;
    if (/捨てコン|捨コン/.test(source) && /砕石/.test(source)) return true;
    const text = rows.map((row) => [row.__sheetName, ...row].join(" ")).join(" ");
    return /捨てコン|捨コン/.test(text) && /砕石/.test(text);
  }

  function leanConcreteGravelRowsToImportLines(rows) {
    const groups = new Map();
    rows.forEach((row) => {
      const sheetName = row.__sheetName || "";
      if (!groups.has(sheetName)) groups.set(sheetName, []);
      groups.get(sheetName).push(row);
    });

    const allEntries = Array.from(groups.entries());
    const preferred = allEntries.filter(([sheetName]) => /全部材|合計|集計/.test(sheetName));
    const groupEntries = preferred.length ? preferred : allEntries;
    const gravelEntries = allEntries.filter(([sheetName]) => /全部材/.test(sheetName));
    let leanConcreteQty = 0;
    let gravelQty = 0;
    for (const [, sheetRows] of groupEntries) {
      const totals = leanConcreteGravelTotalsFromRows(sheetRows);
      leanConcreteQty += totals.leanConcreteQty;
      if (preferred.length && totals.leanConcreteQty > 0) break;
    }
    gravelEntries.forEach(([, sheetRows]) => {
      gravelQty += leanConcreteGravelTotalsFromRows(sheetRows).gravelQty;
    });

    const lines = [];
    if (leanConcreteQty > 0) {
      lines.push(["工種取込", "コンクリート工事", "均しコンクリート", "", formatNumber(leanConcreteQty), "㎥", 0, "Excel取込:捨てコン"].join("\t"));
      lastConcreteReadSummary.push(`均しコンクリート=${formatNumber(leanConcreteQty)}㎥`);
    }
    if (gravelQty > 0) {
      lines.push(["工種取込", "土工事", "砕石地業", "RC-40", formatNumber(gravelQty), "㎥", 0, "Excel取込:砕石 全部材"].join("\t"));
      lastConcreteReadSummary.push(`砕石地業=${formatNumber(gravelQty)}㎥`);
    }
    return lines;
  }

  function leanConcreteGravelTotalsFromRows(rows) {
    let leanConcreteQty = 0;
    let gravelQty = 0;
    rows.forEach((row, rowIndex) => {
      const leanIndex = row.findIndex((cell) => /捨てコン|捨コン/.test(String(cell || "")) && /体積|数量|m3|㎥/.test(String(cell || "")));
      const gravelIndex = row.findIndex((cell) => /砕石/.test(String(cell || "")) && /体積|数量|m3|㎥/.test(String(cell || "")));
      if (leanIndex < 0 && gravelIndex < 0) return;
      for (let nextIndex = rowIndex + 1; nextIndex < rows.length; nextIndex += 1) {
        const nextRow = rows[nextIndex];
        if (nextRow.some((cell) => /捨てコン|捨コン|砕石/.test(String(cell || "")) && /体積|数量|m3|㎥/.test(String(cell || "")))) break;
        if (leanIndex >= 0) leanConcreteQty += numericCellValue(nextRow[leanIndex]);
        if (gravelIndex >= 0) gravelQty += numericCellValue(nextRow[gravelIndex]);
      }
    });
    return { leanConcreteQty, gravelQty };
  }

  function isEarthworkWorkbook(options, rows) {
    const source = `${options.tradeName || ""} ${options.sourceName || ""}`;
    if (isEarthworkSheet(source)) return true;
    return rows.some((row) => /土量|掘削|埋め戻し|埋戻|整地/.test(row.__sheetName || "")) ||
      rows.some((row) => row.some((cell) => /切土体積|盛土体積|体積\(m3\)|面積\(m2\)/.test(String(cell || ""))));
  }

  function earthworkRowsToImportLines(rows) {
    const groups = new Map();
    rows.forEach((row) => {
      const sheetName = row.__sheetName || "";
      if (!groups.has(sheetName)) groups.set(sheetName, []);
      groups.get(sheetName).push(row);
    });

    const lines = [];
    groups.forEach((sheetRows, sheetName) => {
      const header = sheetRows[0] || [];
      sheetRows.slice(1).forEach((row) => {
        header.forEach((head, index) => {
          const qty = numericCellValue(row[index]);
          if (qty <= 0) return;
          const name = earthworkItemName(sheetName, head, row[0]);
          if (!name) return;
          const unit = earthworkUnit(head);
          earthworkImportTargets(name).forEach((targetName) => {
            lines.push(["土工事取込", targetName, qty, unit, 0, "Excel取込"].join(" "));
          });
        });
      });
    });
    return lines;
  }

  function earthworkImportTargets(name) {
    const text = normalizedText(name);
    if (!text) return [];
    if (text.includes("床掘") || text.includes("掘削") || text.includes("根切") || text.includes("切土")) {
      return ["床掘り", "残土運搬処分"];
    }
    if (text.includes("埋戻") || text.includes("埋め戻し")) return ["埋戻し"];
    if (text.includes("砕石") || text.includes("下地業") || text.includes("整地")) return ["砕石地業"];
    return [name];
  }

  function earthworkItemName(sheetName, header, rowName = "") {
    const text = `${sheetName} ${header} ${rowName}`.replace(/\s+/g, "");
    if (/切土/.test(text)) return "切土";
    if (/盛土/.test(text)) return "盛土";
    if (/掘削|根切/.test(text)) return "掘削";
    if (/埋め戻し|埋戻/.test(text)) return "埋め戻し";
    if (/sheet2\.xml/i.test(text)) return "掘削";
    if (/sheet3\.xml/i.test(text)) return "埋め戻し";
    if (/整地|面積/.test(text)) return "整地";
    return "";
  }

  function earthworkUnit(header) {
    const text = String(header || "");
    if (/m2|㎡|面積/i.test(text)) return "㎡";
    return "㎥";
  }

  function concreteRowsToImportLines(rows) {
    const hint = findConcreteFoundationHint(rows);
    if (!hint) return rows.map(concreteRowToImportLine).filter(Boolean);
    const mixColumnIndex = findConcreteMixColumn(rows);

    const lines = [];
    const foundationLine = concreteLineFromRow(hint.row, "有筋コンクリート基礎", hint.columnIndex, "ヒント位置", mixColumnIndex);
    if (foundationLine) lines.push(foundationLine);

    rows.forEach((row) => {
      if (row === hint.row) return;
      if (!isAboveGroundFloorCells(row)) return;
      const bodyLine = concreteLineFromRow(row, "有筋コンクリート躯体", hint.columnIndex, "1階+R階同列", mixColumnIndex);
      if (bodyLine) lines.push(bodyLine);
    });

    rows.forEach((row) => {
      const text = row.join(" ").replace(/\s+/g, "");
      if (!/均し|捨てコン|捨コン/i.test(text)) return;
      const line = concreteRowToImportLine(row);
      if (line) lines.push(line);
    });

    return lines;
  }

  function findConcreteMixColumn(rows) {
    for (const row of rows) {
      for (let index = 0; index < row.length; index += 1) {
        const cell = String(row[index] || "").replace(/\s+/g, "");
        if (/^(配合|コンクリート配合|生コン配合|呼び強度|強度)$/i.test(cell)) return index;
      }
    }
    return null;
  }

  function findConcreteFoundationHint(rows) {
    for (const row of rows) {
      for (let index = 0; index < row.length; index += 1) {
        if (Math.abs(numericCellValue(row[index]) - 76.66) < 0.01) {
          return { row, columnIndex: index };
        }
      }
    }
    return null;
  }

  function concreteLineFromRow(row, targetName, quantityColumnIndex, reason, mixColumnIndex = null) {
    const qty = numericCellValue(row[quantityColumnIndex]);
    if (qty <= 0) return "";
    const unit = inferUnitNearColumn(row, quantityColumnIndex) || "㎥";
    const mixSummary = inferConcreteMixSummaryFromColumn(row, mixColumnIndex) || inferConcreteMixSummary(row);
    const summaryCells = row.filter((cell) => (
      String(cell || "").trim() &&
      !findColumnKind(cell) &&
      !numericCellValue(cell) &&
      !/^(m3|m³|㎥|m2|㎡|式|回)$/i.test(String(cell || "").trim())
    ));
    const summary = [mixSummary, `シート:${row.__sheetName || ""}`, reason, ...summaryCells].filter(Boolean).join(" ");
    lastConcreteReadSummary.push(`${targetName}=${formatNumber(qty)}${unit}`);
    return [targetName, qty, unit, 0, concreteMixToken(mixSummary), summary].filter(Boolean).join(" ");
  }

  function inferConcreteMixSummaryFromColumn(row, mixColumnIndex) {
    if (mixColumnIndex == null) return "";
    const value = String(row[mixColumnIndex] || "").trim();
    if (!value || /^(配合|コンクリート配合|生コン配合|呼び強度|強度)$/i.test(value.replace(/\s+/g, ""))) return "";
    return inferConcreteMixSummary([value]) || value;
  }

  function inferUnitNearColumn(row, quantityColumnIndex) {
    for (let index = quantityColumnIndex + 1; index <= quantityColumnIndex + 2 && index < row.length; index += 1) {
      if (/^(m3|m³|㎥)$/i.test(row[index])) return row[index];
    }
    return "";
  }

  function concreteRowToImportLine(row) {
    if (hasHeaderAliases(row)) return "";
    const cells = row.map((cell) => String(cell || "").trim());
    const compact = cells.join(" ");
    if (!compact || isConcreteNoiseRow(compact)) return "";
    const qtyInfo = inferConcreteQuantityCell(cells);
    if (!qtyInfo || qtyInfo.qty <= 0) return "";
    const name = predictConcreteNameFromCells(cells) || inferConcreteNameCell(cells);
    if (!name) return "";
    const mixSummary = inferConcreteMixSummary(cells);
    const summaryCells = cells.filter((cell) => cell && cell !== name && !findColumnKind(cell));
    const summary = [mixSummary, `シート:${row.__sheetName || ""}`, ...summaryCells].filter(Boolean).join(" ");
    const price = inferConcretePriceCell(cells, qtyInfo.index);
    const line = [name, qtyInfo.qty, qtyInfo.unit || "㎥", price || 0, concreteMixToken(mixSummary), summary].filter((value) => value !== "").join(" ");
    lastConcreteReadSummary.push(`${name}=${formatNumber(qtyInfo.qty)}${qtyInfo.unit || "㎥"}`);
    return line;
  }

  function isConcreteNoiseRow(text) {
    const compact = String(text || "").replace(/\s+/g, "");
    if (!compact) return true;
    if (/^(名称|部材|符号|階|階数|数量|単位|合計|総計)$/.test(compact)) return true;
    if (/^\d+$/.test(compact)) return true;
    return false;
  }

  function predictConcreteNameFromCells(cells) {
    const text = cells.join(" ").replace(/\s+/g, "");
    if (/均し|捨てコン|捨コン/i.test(text)) return "均しコンクリート";
    if (/土間|スラブ/i.test(text)) return "土間コンクリート";
    if (cells.some((cell) => Math.abs(numericCellValue(cell) - 76.66) < 0.01)) return "有筋コンクリート基礎";
    if (isAboveGroundFloorCells(cells)) return "有筋コンクリート躯体";
    if (/地下|B\d*F?|GL下|基礎|フーチング|地中梁|立上|ベース/i.test(text)) return "有筋コンクリート基礎";
    return "";
  }

  function isAboveGroundFloorText(text) {
    const raw = String(text || "");
    const compact = raw.replace(/\s+/g, "");
    if (/地下|B\d*F?|GL下/i.test(compact)) return false;
    return /(1階|１階|1F|１F|R階|Ｒ階|RF)/i.test(compact) || /(^|[^A-Za-z0-9])R($|[^A-Za-z0-9])/i.test(raw);
  }

  function isAboveGroundFloorCells(cells) {
    const values = cells.map((cell) => String(cell || "").trim()).filter(Boolean);
    if (values.some((cell) => /地下|B\d*F?|GL下/i.test(cell.replace(/\s+/g, "")))) return false;
    return values.some((cell) => {
      const compact = cell.replace(/\s+/g, "");
      return /^(1階|１階|1F|１F|R|Ｒ|R階|Ｒ階|RF|屋上)$/i.test(compact);
    }) || isAboveGroundFloorText(values.join(" "));
  }

  function inferConcreteNameCell(cells) {
    const candidates = cells.filter((cell) => /[一-龥ぁ-んァ-ヶA-Za-z]/.test(cell) && !findColumnKind(cell));
    return candidates.find((cell) => /コンクリ|生コン|均し|捨て|有筋|基礎|躯体|土間/i.test(cell)) || candidates[0] || "";
  }

  function inferConcreteMixSummary(cells) {
    const text = cells.map((cell) => String(cell || "").trim()).filter(Boolean);
    const joined = text.join(" ").replace(/\s+/g, " ").trim();
    const parts = [];
    const add = (value) => {
      const normalized = String(value || "").replace(/\s+/g, "").trim();
      if (normalized && !parts.includes(normalized)) parts.push(normalized);
    };

    const fcCell = text.find((cell) => /F\s*c\s*=?\s*\d+/i.test(cell) && /N\s*\/?\s*mm\s*3?|S\s*=?\s*\d+|スランプ/i.test(cell));
    const fc = fcCell || joined.match(/F\s*c\s*=?\s*\d+/i)?.[0] || joined.match(/FC\s*\d+/i)?.[0] || "";
    add(fc);
    const strength = joined.match(/\d+\s*N\s*\/?\s*mm\s*3?/i)?.[0] || joined.match(/N\s*\/?\s*mm\s*3?/i)?.[0] || "";
    add(strength);
    const slump = joined.match(/S\s*=?\s*\d+(?:\.\d+)?\s*cm?/i)?.[0] || joined.match(/スランプ\s*\d+(?:\.\d+)?\s*cm?/i)?.[0] || "";
    add(slump);

    if (!slump) {
      const slumpValue = findMixValueAfterLabel(text, /^(S|Ｓ|スランプ|SL)$/i);
      if (slumpValue) add(`S=${slumpValue}cm`);
    }

    if (parts.length) return parts.join(" ");

    const mixCells = text.filter((cell) => /FC\s*\d+|Fc\s*\d+|F\s*c\s*=?\s*\d+|N\/?mm|S\s*=?\s*\d+|スランプ|呼び強度|強度|配合/i.test(cell));
    return mixCells.join(" ").replace(/\s+/g, " ").trim();
  }

  function findMixValueAfterLabel(cells, labelPattern) {
    for (let index = 0; index < cells.length; index += 1) {
      const cell = String(cells[index] || "").trim();
      if (!labelPattern.test(cell.replace(/\s+/g, ""))) continue;
      for (let next = index + 1; next <= index + 3 && next < cells.length; next += 1) {
        const value = String(cells[next] || "").trim();
        const match = value.match(/\d+(?:\.\d+)?/);
        if (match) return match[0];
      }
    }
    return "";
  }

  function inferConcreteQuantityCell(cells) {
    const unitIndex = cells.findIndex((cell) => /^(m3|m³|㎥)$/i.test(cell));
    if (unitIndex > 0) {
      const before = numericCellValue(cells[unitIndex - 1]);
      if (before > 0) return { qty: before, unit: cells[unitIndex], index: unitIndex - 1 };
    }
    const numericCells = cells
      .map((cell, index) => ({ value: numericCellValue(cell), index }))
      .filter((item) => item.value > 0 && item.value < 1000);
    const decimal = numericCells.find((item) => !Number.isInteger(item.value));
    const picked = decimal || numericCells[0];
    return picked ? { qty: picked.value, unit: "㎥", index: picked.index } : null;
  }

  function inferConcretePriceCell(cells, qtyIndex) {
    const afterQty = cells.slice(qtyIndex + 1).map(numericCellValue).filter((value) => value >= 1000);
    return afterQty[0] || 0;
  }

  function numericCellValue(value) {
    const text = String(value || "").trim().replace(/[,，¥￥円]/g, "");
    if (!/^-?\d+(?:\.\d+)?$/.test(text)) return 0;
    return Number(text) || 0;
  }

  function hasHeaderAliases(row) {
    return row.some((cell) => findColumnKind(cell));
  }

  function mapHeaderColumns(headers) {
    const map = {};
    headers.forEach((header, index) => {
      const kind = findColumnKind(header);
      if (kind && map[kind] == null) map[kind] = index;
    });
    return map;
  }

  function findColumnKind(header) {
    const normalized = String(header || "").replace(/\s/g, "").toLowerCase();
    return Object.keys(columnAliases).find((kind) => columnAliases[kind].some((alias) => normalized.includes(alias.toLowerCase())));
  }

  function cellAt(row, index) {
    return index == null ? "" : String(row[index] || "").trim();
  }

  function inferPriceFromAmount(amountValue, qtyValue) {
    const amountNumber = Number(String(amountValue || "").replace(/[,¥￥円]/g, ""));
    const qtyNumber = Number(String(qtyValue || "").replace(/,/g, ""));
    if (!Number.isFinite(amountNumber) || !amountNumber) return "";
    if (!Number.isFinite(qtyNumber) || !qtyNumber) return String(Math.round(amountNumber));
    return String(Math.round(amountNumber / qtyNumber));
  }

  function parseDelimitedLine(line, delimiter) {
    const cells = [];
    let current = "";
    let quoted = false;
    for (const char of line) {
      if (char === '"') {
        quoted = !quoted;
      } else if (char === delimiter && !quoted) {
        cells.push(current);
        current = "";
      } else {
        current += char;
      }
    }
    cells.push(current);
    return cells;
  }

  async function unzipXlsx(buffer) {
    const bytes = new Uint8Array(buffer);
    const entries = new Map();
    let offset = 0;
    while (offset < bytes.length - 30) {
      if (readUInt32(bytes, offset) !== 0x04034b50) {
        offset += 1;
        continue;
      }
      const method = readUInt16(bytes, offset + 8);
      const compressedSize = readUInt32(bytes, offset + 18);
      const nameLength = readUInt16(bytes, offset + 26);
      const extraLength = readUInt16(bytes, offset + 28);
      const name = decodeUtf8(bytes.slice(offset + 30, offset + 30 + nameLength));
      const dataStart = offset + 30 + nameLength + extraLength;
      const data = bytes.slice(dataStart, dataStart + compressedSize);
      if (name.endsWith(".xml") || name.endsWith(".rels")) {
        entries.set(name, await inflateZipEntry(data, method));
      }
      offset = dataStart + compressedSize;
    }
    return entries;
  }

  async function inflateZipEntry(data, method) {
    if (method === 0) return decodeUtf8(data);
    if (method !== 8 || !window.DecompressionStream) {
      throw new Error("xlsx inflate is not supported");
    }
    const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("deflate-raw"));
    const buffer = await new Response(stream).arrayBuffer();
    return decodeUtf8(new Uint8Array(buffer));
  }

  function parseSharedStrings(xml) {
    if (!xml) return [];
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    return Array.from(doc.querySelectorAll("si")).map((si) => Array.from(si.querySelectorAll("t")).map((t) => t.textContent || "").join(""));
  }

  function parseWorkbook(entries) {
    const workbookXml = entries.get("xl/workbook.xml");
    const relsXml = entries.get("xl/_rels/workbook.xml.rels");
    if (!workbookXml || !relsXml) {
      return Array.from(entries.keys()).filter((name) => /^xl\/worksheets\/sheet\d+\.xml$/.test(name)).sort().map((path) => ({ name: path, path }));
    }
    const relsDoc = new DOMParser().parseFromString(relsXml, "application/xml");
    const relationshipNodes = xmlElements(relsDoc, "Relationship");
    const rels = new Map(relationshipNodes.map((rel) => [rel.getAttribute("Id"), rel.getAttribute("Target")]));
    const bookDoc = new DOMParser().parseFromString(workbookXml, "application/xml");
    return xmlElements(bookDoc, "sheet").map((sheet) => {
      const id = sheet.getAttribute("r:id");
      const target = rels.get(id) || "";
      const normalizedTarget = target.replace(/^\/+/, "").replace(/^(\.\.\/)+/, "");
      const path = normalizedTarget.startsWith("xl/") ? normalizedTarget : `xl/${normalizedTarget}`;
      return { name: sheet.getAttribute("name") || path, path };
    });
  }

  function xmlElements(doc, tagName) {
    const direct = Array.from(doc.getElementsByTagName(tagName));
    if (direct.length) return direct;
    return Array.from(doc.getElementsByTagName("*")).filter((node) => node.localName === tagName);
  }

  function parseWorksheetRows(xml, sharedStrings, sheetName = "") {
    const doc = new DOMParser().parseFromString(xml, "application/xml");
    return Array.from(doc.querySelectorAll("sheetData row")).map((row) => {
      const values = [];
      Array.from(row.querySelectorAll("c")).forEach((cell) => {
        const value = cell.querySelector("v")?.textContent || "";
        const index = excelColumnIndex(cell.getAttribute("r")) ?? values.length;
        if (cell.getAttribute("t") === "s") {
          values[index] = sharedStrings[Number(value)] || "";
        } else if (cell.getAttribute("t") === "inlineStr") {
          values[index] = cell.querySelector("t")?.textContent || "";
        } else {
          values[index] = value;
        }
      });
      const normalized = values.map((value) => value || "");
      normalized.__sheetName = sheetName;
      return normalized;
    });
  }

  function excelColumnIndex(reference) {
    const letters = String(reference || "").match(/^[A-Z]+/i)?.[0];
    if (!letters) return null;
    return letters.toUpperCase().split("").reduce((sum, letter) => sum * 26 + letter.charCodeAt(0) - 64, 0) - 1;
  }

  function readUInt16(bytes, offset) {
    return bytes[offset] | (bytes[offset + 1] << 8);
  }

  function readUInt32(bytes, offset) {
    return (bytes[offset] | (bytes[offset + 1] << 8) | (bytes[offset + 2] << 16) | (bytes[offset + 3] << 24)) >>> 0;
  }

  function decodeUtf8(bytes) {
    return new TextDecoder("utf-8").decode(bytes);
  }

  function escapeAttr(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll('"', "&quot;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function renderSummary() {
    const total = totals();
    renderAreaConversions();
    $("subtotalView").textContent = yen(total.subtotal);
    $("commonTemporaryView").textContent = yen(total.commonTemporaryCost);
    $("siteManagementLabel").textContent = `現場管理費 (${formatNumber(total.siteManagementRate)}%)`;
    $("siteManagementView").textContent = yen(total.siteManagement);
    $("generalManagementLabel").textContent = `一般管理費 (${formatNumber(total.generalManagementRate)}%)`;
    $("generalManagementView").textContent = yen(total.generalManagement);
    $("discountView").textContent = `-${yen(total.discount)}`;
    $("taxableView").textContent = yen(total.taxable);
    $("taxView").textContent = yen(total.tax);
    $("tsuboUnitPriceView").textContent = total.floorAreaTsubo > 0 ? `${yen(total.tsuboUnitPrice)} / 坪` : "-";
    $("totalView").textContent = yen(total.total);
  }

  function renderAreaConversions() {
    const conversions = [
      ["siteArea", "siteAreaTsuboView"],
      ["buildingArea", "buildingAreaTsuboView"],
      ["totalFloorArea", "totalFloorAreaTsuboView"]
    ];
    conversions.forEach(([fieldId, viewId]) => {
      const view = $(viewId);
      if (!view) return;
      const tsubo = tsuboFromSquareMeters(state[fieldId]);
      view.textContent = tsubo > 0 ? `${formatNumber(tsubo)} 坪` : "0.00 坪";
    });
  }

  function renderPrint() {
    const total = totals();
    const pages = $("printPages");
    pages.innerHTML = [
      coverPage(total),
      state.estimateMode === "byTrade" ? costSummaryPage(total) : simpleDetailPage(total),
      state.estimateMode === "byTrade" ? subjectSummaryPage() : "",
      state.estimateMode === "byTrade" ? tradeDetailPages() : ""
    ].join("");
  }

  function coverPage(total) {
    const coverNotes = printNotesLines();
    return `
      <article class="quote-page cover-page">
        <div class="recipient">${escapeHtml(state.clientName || "御中")}</div>
        <h2 class="quote-title">御　見　積　書</h2>
        <table class="quote-info">
          <tr><td>工　事　名：</td><td>${escapeHtml(state.projectName)}</td></tr>
          <tr><td>工事場所：</td><td>${escapeHtml(state.siteAddress)}</td></tr>
          <tr><td>工　　　期：</td><td>${escapeHtml(state.period)}</td></tr>
        </table>
        <div class="net-line">NET¥${Math.round(total.net).toLocaleString("ja-JP")}（消費税込）</div>
        <div class="amount-box">¥${Math.round(total.coverTotal ?? total.total).toLocaleString("ja-JP")}（消費税込）</div>
        <div class="tax-note">（消費税込み）</div>
        ${coverNotes ? `<div class="print-notes cover-notes">${coverNotes}</div>` : ""}
        <div class="issue-date">${formatJapaneseDate(state.issueDate)}</div>
        <div class="company-block">
          <div class="company-grid">
            <span>住　所</span><span>${escapeHtml(state.companyAddress)}</span>
            <span>会社名</span><span>${escapeHtml(state.companyName)}</span>
            <span>電　話</span><span>${escapeHtml(state.companyPhone)}</span>
            <span>担　当</span><span>${escapeHtml(state.companyPerson)}</span>
          </div>
          ${state.useStamp ? '<img class="stamp" src="company_stamp.png" alt="会社印">' : ""}
        </div>
      </article>`;
  }

  function printNotesLines() {
    const rawNotes = String(state.notes ?? "").trim();
    if (!rawNotes) return "";
    const notes = (state.notes || "見積り有効期限は提出日より1ヶ月間と致します。")
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => line.startsWith("※") ? line : `※ ${line}`);
    const blankCount = Math.max(5 - notes.length, 0);
    const lines = ["備考", ...notes, ...Array.from({ length: blankCount }, () => "※")];
    return lines.map((line) => `<div>${escapeHtml(line)}</div>`).join("");
  }

  function costSummaryPage(total) {
    const direct = total.subtotal;
    const common = total.commonTemporaryCost;
    const pure = direct + common;
    const siteManagement = total.siteManagement;
    const cost = pure + siteManagement;
    const general = total.generalManagement;
    const beforeTax = total.taxable;
    const rows = [
      ["直接工事費", 1, "式", direct, ""],
      ["共通仮設費", 1, "式", common, ""],
      ["純工事費", 1, "式", pure, ""],
      ["現場管理費", 1, "式", siteManagement, ""],
      ["工事原価", 1, "式", cost, ""],
      ["一般管理費", 1, "式", general, ""],
      ["税抜工事価格", 1, "式", beforeTax, ""],
      [`消費税 ${toNumber(state.taxRate)}%`, 1, "式", total.tax, ""],
      ["税込工事価格", 1, "式", total.total, ""]
    ];
    return tablePage("工　事　費　内　訳　書", "summary-table", ["名　称", "数　量", "単　位", "金　額", "備　考"], rows.map(summaryRow), 25);
  }

  function subjectSummaryPage() {
    const rows = visibleSheets().map((sheet) => [sheet.name, 1, "式", subtotalForSheet(sheet), ""]);
    rows.push(["計", 1, "式", rows.reduce((sum, row) => sum + row[3], 0), ""]);
    return tablePage("科　目　別　内　訳　書", "summary-table", ["名　称", "数　量", "単　位", "金　額", "備　考"], rows.map(summaryRow), 25);
  }

  function simpleDetailPage(total) {
    const items = visibleItems(visibleSheets()[0]);
    const rows = items.filter((item) => item.type === "item" && !isAdjustmentItem(item)).map(detailRow);
    const bottomRows = [
      ...items.filter(isAdjustmentItem).map(detailRow),
      totalDetailRow("小計", total.subtotal),
      total.commonTemporaryCost ? totalDetailRow("共通仮設費", total.commonTemporaryCost) : "",
      total.siteManagement ? totalDetailRow(`現場管理費 ${formatNumber(total.siteManagementRate)}%`, total.siteManagement) : "",
      total.generalManagement ? totalDetailRow(`一般管理費 ${formatNumber(total.generalManagementRate)}%`, total.generalManagement) : "",
      total.discount ? totalDetailRow("値引き", -total.discount) : "",
      totalDetailRow(`消費税 ${toNumber(state.taxRate)}%`, total.tax),
      totalDetailRow("合計", total.total)
    ];
    return tablePage("工　事　費　内　訳　書", "", ["名　称", "概　要", "数　量", "単位", "単　価", "金　額", "備　考"], rows, 25, false, bottomRows);
  }

  function tradeDetailPages() {
    return visibleSheets().map((sheet) => {
      const items = visibleItems(sheet);
      const rows = items.filter((item) => item.type === "item" && !isAdjustmentItem(item)).map(detailRow);
      const bottomRows = [
        ...items.filter(isAdjustmentItem).map(detailRow),
        totalDetailRow("計", subtotalForSheet(sheet))
      ];
      return tablePage(
        `<span>${escapeHtml(sheet.name)}</span><span class="center-title">内訳明細書</span><span></span>`,
        "",
        ["名　称", "摘　要", "数　量", "単位", "単　価", "金　額", "備　考"],
        rows,
        25,
        true,
        bottomRows
      );
    }).join("");
  }

  function tablePage(title, tableClass, heads, rows, minRows, titleIsHtml = false, bottomRows = []) {
    const filler = Math.max(minRows - rows.length - bottomRows.length, 0);
    return `
      <article class="quote-page detail-page">
        ${titleIsHtml ? `<div class="detail-heading">${title}</div>` : `<h2 class="detail-title">${title}</h2>`}
        <table class="detail-table ${tableClass}">
          <thead><tr>${heads.map((head) => `<th>${escapeHtml(head)}</th>`).join("")}</tr></thead>
          <tbody>
            ${rows.join("")}
            ${Array.from({ length: filler }, () => blankRow(heads.length)).join("")}
            ${bottomRows.join("")}
          </tbody>
        </table>
      </article>`;
  }

  function summaryRow(row) {
    const [name, qty, unit, price, remarks] = row;
    return `<tr class="section-line"><td>${escapeHtml(name)}</td><td>${qty.toLocaleString("ja-JP", { maximumFractionDigits: 2 })}</td><td class="center">${escapeHtml(unit)}</td><td>¥ ${Math.round(price).toLocaleString("ja-JP")}</td><td>${escapeHtml(remarks)}</td></tr>`;
  }

  function detailRow(item) {
    if (item.type === "section") {
      return `<tr class="section-line"><td>${escapeHtml(item.category || item.name)}</td><td></td><td></td><td></td><td></td><td></td><td></td></tr>`;
    }
    return `
      <tr${isAdjustmentItem(item) ? ' class="adjustment-line"' : ""}>
        <td class="section-line">${escapeHtml(item.name)}</td>
        <td>${escapeHtml(item.summary)}</td>
        <td class="num">${toNumber(item.qty).toLocaleString("ja-JP", { maximumFractionDigits: 2 })}</td>
        <td class="center">${escapeHtml(item.unit)}</td>
        <td class="num">${toNumber(item.price).toLocaleString("ja-JP")}</td>
        <td class="num">${lineAmount(item).toLocaleString("ja-JP")}</td>
        <td>${escapeHtml(item.printRemarks)}</td>
      </tr>`;
  }

  function totalDetailRow(label, value) {
    return `<tr class="total-line"><td class="center">${escapeHtml(label)}</td><td></td><td></td><td></td><td></td><td class="num">¥ ${Math.round(value).toLocaleString("ja-JP")}</td><td></td></tr>`;
  }

  function blankRow(cols) {
    return `<tr>${Array.from({ length: cols }, () => "<td></td>").join("")}</tr>`;
  }

  function formatJapaneseDate(value) {
    if (!value) return "";
    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) return value;
    return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
  }

  function render(options = {}) {
    const keepItemFocus = options.keepItemFocus !== false;
    const itemFocus = keepItemFocus ? (pendingItemFocus || captureItemFocus()) : null;
    pendingItemFocus = null;
    state = normalizeState(state);
    renderEstimateSwitcher();
    fields.forEach((id) => {
      if (document.activeElement !== $(id)) $(id).value = state[id] ?? "";
    });
    if (document.activeElement !== $("useStamp")) $("useStamp").checked = Boolean(state.useStamp);
    renderMode();
    renderSheetTabs();
    renderItems();
    renderSummary();
    renderPrint();
    saveState();
    if (keepItemFocus) restoreItemFocus(itemFocus);
  }

  function captureItemFocus() {
    const active = document.activeElement;
    if (!active?.matches?.("#itemsBody input[data-key]")) return null;
    const row = active.closest("tr[data-index]");
    if (!row) return null;
    let start = null;
    let end = null;
    try {
      start = active.selectionStart;
      end = active.selectionEnd;
    } catch (error) {
      start = null;
      end = null;
    }
    return { index: Number(row.dataset.index), key: active.dataset.key, start, end };
  }

  function restoreItemFocus(focus) {
    if (!focus || !Number.isFinite(focus.index) || !focus.key) return;
    const input = $("itemsBody")?.querySelector(`tr[data-index="${focus.index}"] input[data-key="${focus.key}"]`);
    if (!input) return;
    input.focus();
    if (focus.start != null && focus.end != null) {
      try {
        input.setSelectionRange(focus.start, focus.end);
      } catch (error) {
        // Number inputs do not support text selection.
      }
    }
  }

  function addItem(type) {
    const sheet = activeSheet();
    const newItem = type === "section"
      ? { type: "section", category: "新しい区分", name: "", summary: "", qty: "", unit: "", price: "", remarks: "", printRemarks: "", hidden: false }
      : { type: "item", category: "", name: "", summary: "", qty: "", unit: "", price: "", remarks: "", printRemarks: "", hidden: false };
    const adjustmentIndex = sheet.items.findIndex(isAdjustmentItem);
    const insertIndex = adjustmentIndex >= 0 ? adjustmentIndex : sheet.items.length;
    sheet.items.splice(insertIndex, 0, newItem);
    pendingItemFocus = { index: insertIndex, key: type === "section" ? "category" : "name" };
    render();
  }

  function addSheet() {
    state.estimateMode = "byTrade";
    state.sheets.push({ name: `工種${state.sheets.length + 1}`, items: [] });
    state.activeSheetIndex = state.sheets.length - 1;
    render();
  }

  function deleteSheetAt(index) {
    if (state.sheets.length <= 1) {
      $("projectStatus").textContent = "最後の工種シートは削除できません。";
      return;
    }
    const sheet = state.sheets[index];
    if (!sheet) return;
    const sheetName = sheet.name || `工種${index + 1}`;
    if (!confirm(`工種シート「${sheetName}」を削除しますか？\nシート内の明細も削除されます。`)) return;
    state.sheets.splice(index, 1);
    if (state.activeSheetIndex > index) {
      state.activeSheetIndex -= 1;
    } else if (state.activeSheetIndex === index) {
      state.activeSheetIndex = Math.min(index, state.sheets.length - 1);
    }
    render();
    $("projectStatus").textContent = `工種シート「${sheetName}」を削除しました。`;
  }

  function deleteSheet() {
    deleteSheetAt(state.activeSheetIndex);
  }

  function openPrintPdf() {
    renderPrint();
    $("pdfPreviewPages").innerHTML = $("printPages").innerHTML;
    $("pdfPreview").classList.add("is-open");
    $("pdfPreview").setAttribute("aria-hidden", "false");
    document.body.classList.add("preview-open");
  }

  function closePrintPreview() {
    $("pdfPreview").classList.remove("is-open");
    $("pdfPreview").setAttribute("aria-hidden", "true");
    document.body.classList.remove("preview-open");
  }

  function printPreview() {
    renderPrint();
    window.print();
  }

  async function savePdfFile() {
    const button = $("previewPrintButton");
    const originalText = button.textContent;
    const pdfWindow = window.open("about:blank", "_blank");
    if (pdfWindow) {
      pdfWindow.document.title = "PDF作成中";
      pdfWindow.document.body.innerHTML = '<p style="font-family: sans-serif; padding: 24px;">PDFを作成しています...</p>';
    }
    button.disabled = true;
    button.textContent = "PDF作成中...";
    try {
      renderPrint();
      const pageImages = await renderPdfPageImages();
      const pdfBlob = buildImagePdf(pageImages);
      openPdfBlob(pdfBlob, `${safeFileName(state.projectName || "見積書")}.pdf`, pdfWindow);
      button.textContent = "PDFを開きました";
      setTimeout(() => {
        button.textContent = originalText;
      }, 1200);
    } catch (error) {
      console.error(error);
      if (pdfWindow && !pdfWindow.closed) {
        pdfWindow.document.body.innerHTML = `<p style="font-family: sans-serif; padding: 24px;">PDF保存に失敗しました。<br>${escapeHtml(error.message || error)}</p>`;
      }
      alert(`PDF保存に失敗しました。印刷ボタンからPDF保存をお試しください。\n${error.message || error}`);
      button.textContent = originalText;
    } finally {
      button.disabled = false;
    }
  }

  function openPdfBlob(blob, filename, pdfWindow) {
    const url = URL.createObjectURL(blob);
    if (pdfWindow && !pdfWindow.closed) {
      pdfWindow.location.href = url;
    } else {
      window.open(url, "_blank");
    }
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 5 * 60 * 1000);
  }

  async function renderPdfPageImages() {
    const total = totals();
    const stamp = state.useStamp ? await loadCanvasImage("company_stamp.png").catch(() => null) : null;
    const pages = [];
    pages.push(await createPdfCanvasPage((ctx, metrics) => drawPdfCoverPage(ctx, metrics, total, stamp)));
    if (state.estimateMode === "byTrade") {
      pages.push(await createPdfCanvasPage((ctx, metrics) => drawPdfCostSummaryPage(ctx, metrics, total)));
      pages.push(await createPdfCanvasPage((ctx, metrics) => drawPdfSubjectSummaryPage(ctx, metrics)));
      for (const sheet of visibleSheets()) {
        pages.push(await createPdfCanvasPage((ctx, metrics) => drawPdfTradeDetailPage(ctx, metrics, sheet)));
      }
    } else {
      pages.push(await createPdfCanvasPage((ctx, metrics) => drawPdfSimpleDetailPage(ctx, metrics, total)));
    }
    return pages;
  }

  async function createPdfCanvasPage(drawPage) {
    const metrics = pdfCanvasMetrics();
    const canvas = document.createElement("canvas");
    canvas.width = metrics.width;
    canvas.height = metrics.height;
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    await drawPage(ctx, metrics);
    return {
      bytes: dataUrlToBytes(canvas.toDataURL("image/jpeg", 0.92)),
      width: canvas.width,
      height: canvas.height
    };
  }

  function pdfCanvasMetrics() {
    const scale = 2;
    const mm = (value) => value * 96 / 25.4 * scale;
    return {
      scale,
      mm,
      width: Math.round(mm(210)),
      height: Math.round(mm(297))
    };
  }

  function pdfSetFont(ctx, metrics, size, options = {}) {
    const weight = options.weight || "400";
    const family = options.family || '"Yu Mincho", "Hiragino Mincho ProN", "MS Mincho", serif';
    ctx.font = `${weight} ${size * metrics.scale}px ${family}`;
  }

  function pdfText(ctx, metrics, text, x, y, options = {}) {
    ctx.save();
    pdfSetFont(ctx, metrics, options.size || 11, options);
    ctx.fillStyle = options.color || "#111";
    ctx.textAlign = options.align || "left";
    ctx.textBaseline = "top";
    const maxWidth = options.maxWidth || null;
    let value = String(text ?? "");
    if (maxWidth) {
      let fontSize = options.size || 11;
      while (fontSize > 7 && ctx.measureText(value).width > maxWidth) {
        fontSize -= 0.5;
        pdfSetFont(ctx, metrics, fontSize, options);
      }
    }
    ctx.fillText(value, x, y, maxWidth || undefined);
    ctx.restore();
  }

  function pdfLine(ctx, x1, y1, x2, y2, color = "#2d7fac", width = 1.5) {
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = width;
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
    ctx.restore();
  }

  function pdfMoney(value) {
    return `¥ ${Math.round(toNumber(value)).toLocaleString("ja-JP")}`;
  }

  function pdfQty(value) {
    return toNumber(value).toLocaleString("ja-JP", { maximumFractionDigits: 2 });
  }

  function drawPdfCoverPage(ctx, metrics, total, stamp) {
    const { mm } = metrics;
    const left = mm(22);
    const right = metrics.width - mm(22);
    pdfText(ctx, metrics, state.clientName || "御中", left, mm(25), { size: 18 });
    pdfText(ctx, metrics, "御　見　積　書", metrics.width / 2, mm(58), { size: 28, align: "center" });
    const tableY = mm(100);
    const labelW = mm(38);
    const rowH = mm(11);
    [
      ["工事名称", state.projectName],
      ["工事場所", state.siteAddress],
      ["工期", state.period]
    ].forEach((row, index) => {
      const y = tableY + rowH * index;
      pdfText(ctx, metrics, row[0], left + mm(2), y + mm(2), { size: 16, maxWidth: labelW - mm(4) });
      pdfText(ctx, metrics, row[1], left + labelW + mm(2), y + mm(2), { size: 16, maxWidth: right - left - labelW - mm(4) });
      pdfLine(ctx, left, y + rowH, right, y + rowH);
    });
    pdfText(ctx, metrics, `NET${pdfMoney(total.net)}（消費税込）`, metrics.width / 2, mm(152), { size: 28, align: "center", color: "#f02b16", weight: "700", family: '"Times New Roman", "Yu Mincho", serif' });
    const amountX = (metrics.width - mm(96)) / 2;
    const amountY = mm(166);
    ctx.strokeStyle = "#2d7fac";
    ctx.lineWidth = metrics.scale * 1.5;
    ctx.strokeRect(amountX, amountY, mm(96), mm(16));
    pdfText(ctx, metrics, `${pdfMoney(total.coverTotal ?? total.total)}（消費税込）`, metrics.width / 2, amountY + mm(2), { size: 27, align: "center", weight: "700" });
    pdfText(ctx, metrics, "（消費税込み）", amountX + mm(96), amountY + mm(20), { size: 15, align: "right" });
    const notes = String(state.notes ?? "").trim();
    if (notes) {
      const noteLines = notes.split("\n").map((line) => line.trim()).filter(Boolean).slice(0, 5);
      pdfText(ctx, metrics, "備考", left, mm(198), { size: 13, family: '"Yu Gothic", "Meiryo", sans-serif' });
      for (let index = 0; index < 5; index += 1) {
        const y = mm(205 + index * 7);
        pdfText(ctx, metrics, noteLines[index] ? `※ ${noteLines[index]}` : "※", left, y, { size: 12, maxWidth: mm(130), family: '"Yu Gothic", "Meiryo", sans-serif' });
        pdfLine(ctx, left, y + mm(6), metrics.width - mm(58), y + mm(6));
      }
    }
    pdfText(ctx, metrics, formatJapaneseDate(state.issueDate), left, mm(248), { size: 16 });
    const companyX = metrics.width - mm(128);
    const companyY = mm(248);
    [
      ["住所", state.companyAddress],
      ["会社名", state.companyName],
      ["電話", state.companyPhone],
      ["担当", state.companyPerson]
    ].forEach((row, index) => {
      const y = companyY + mm(8) * index;
      pdfText(ctx, metrics, row[0], companyX, y, { size: 14, maxWidth: mm(20) });
      pdfText(ctx, metrics, row[1], companyX + mm(26), y, { size: 14, maxWidth: mm(52) });
    });
    if (stamp) {
      ctx.drawImage(stamp, metrics.width - mm(50), mm(254), mm(22), mm(22));
    }
  }

  function drawPdfCostSummaryPage(ctx, metrics, total) {
    const rows = [
      ["直接工事費", 1, "式", total.subtotal, ""],
      ["共通仮設費", 1, "式", total.commonTemporaryCost, ""],
      ["純工事費", 1, "式", total.subtotal + total.commonTemporaryCost, ""],
      ["現場管理費", 1, "式", total.siteManagement, ""],
      ["工事原価", 1, "式", total.subtotal + total.commonTemporaryCost + total.siteManagement, ""],
      ["一般管理費", 1, "式", total.generalManagement, ""],
      ["税抜工事価格", 1, "式", total.taxable, ""],
      [`消費税 ${toNumber(state.taxRate)}%`, 1, "式", total.tax, ""],
      ["税込工事価格", 1, "式", total.total, ""]
    ];
    drawPdfSummaryTable(ctx, metrics, "工　事　費　内　訳　書", rows);
  }

  function drawPdfSubjectSummaryPage(ctx, metrics) {
    const rows = visibleSheets().map((sheet) => [sheet.name, 1, "式", subtotalForSheet(sheet), ""]);
    rows.push(["計", 1, "式", rows.reduce((sum, row) => sum + row[3], 0), ""]);
    drawPdfSummaryTable(ctx, metrics, "科　目　別　内　訳　書", rows);
  }

  function drawPdfSimpleDetailPage(ctx, metrics, total) {
    const items = visibleItems(visibleSheets()[0]);
    const rows = items.filter((item) => item.type === "item" && !isAdjustmentItem(item)).map(pdfDetailRow);
    const bottomRows = [
      ...items.filter(isAdjustmentItem).map(pdfDetailRow),
      pdfTotalRow("小計", total.subtotal),
      total.commonTemporaryCost ? pdfTotalRow("共通仮設費", total.commonTemporaryCost) : null,
      total.siteManagement ? pdfTotalRow(`現場管理費 ${formatNumber(total.siteManagementRate)}%`, total.siteManagement) : null,
      total.generalManagement ? pdfTotalRow(`一般管理費 ${formatNumber(total.generalManagementRate)}%`, total.generalManagement) : null,
      total.discount ? pdfTotalRow("値引き", -total.discount) : null,
      pdfTotalRow(`消費税 ${toNumber(state.taxRate)}%`, total.tax),
      pdfTotalRow("合計", total.total)
    ].filter(Boolean);
    drawPdfDetailTable(ctx, metrics, "工　事　費　内　訳　書", rows, bottomRows);
  }

  function drawPdfTradeDetailPage(ctx, metrics, sheet) {
    const items = visibleItems(sheet);
    const rows = items.filter((item) => item.type === "item" && !isAdjustmentItem(item)).map(pdfDetailRow);
    const bottomRows = [
      ...items.filter(isAdjustmentItem).map(pdfDetailRow),
      pdfTotalRow("計", subtotalForSheet(sheet))
    ];
    drawPdfDetailTable(ctx, metrics, sheet.name, rows, bottomRows, "内訳明細書");
  }

  function pdfDetailRow(item) {
    return {
      cells: [
        item.name,
        item.summary,
        pdfQty(item.qty),
        item.unit,
        toNumber(item.price).toLocaleString("ja-JP"),
        lineAmount(item).toLocaleString("ja-JP"),
        item.printRemarks || ""
      ],
      adjustment: isAdjustmentItem(item)
    };
  }

  function pdfTotalRow(label, value) {
    return {
      cells: [label, "", "", "", "", pdfMoney(value), ""],
      total: true
    };
  }

  function drawPdfSummaryTable(ctx, metrics, title, rows) {
    const { mm } = metrics;
    pdfText(ctx, metrics, title, metrics.width / 2, mm(20), { size: 20, align: "center" });
    const mapped = rows.map((row) => ({
      cells: [row[0], pdfQty(row[1]), row[2], pdfMoney(row[3]), row[4] || ""]
    }));
    drawPdfTable(ctx, metrics, {
      x: mm(15),
      y: mm(43),
      heads: ["名称", "数量", "単位", "金額", "備考"],
      widths: [52, 34, 14, 36, 40].map(mm),
      rows: mapped,
      minRows: 25,
      align: ["left", "right", "center", "right", "left"]
    });
  }

  function drawPdfDetailTable(ctx, metrics, title, rows, bottomRows, centerTitle = "") {
    const { mm } = metrics;
    if (centerTitle) {
      pdfText(ctx, metrics, title, mm(15), mm(18), { size: 17, maxWidth: mm(50) });
      pdfText(ctx, metrics, centerTitle, metrics.width / 2, mm(18), { size: 17, align: "center" });
    } else {
      pdfText(ctx, metrics, title, metrics.width / 2, mm(18), { size: 20, align: "center" });
    }
    drawPdfTable(ctx, metrics, {
      x: mm(15),
      y: mm(37),
      heads: ["名称", "概要", "数量", "単位", "単価", "金額", "備考"],
      widths: [34, 56, 16, 11, 20, 25, 18].map(mm),
      rows,
      bottomRows,
      minRows: 25,
      align: ["left", "left", "right", "center", "right", "right", "left"]
    });
  }

  function drawPdfTable(ctx, metrics, options) {
    const rowHeight = metrics.mm(9.1);
    const headerHeight = rowHeight;
    const rows = options.rows || [];
    const bottomRows = options.bottomRows || [];
    const filler = Math.max((options.minRows || 0) - rows.length - bottomRows.length, 0);
    const allRows = [
      ...rows,
      ...Array.from({ length: filler }, () => ({ cells: options.heads.map(() => "") })),
      ...bottomRows
    ];
    const tableWidth = options.widths.reduce((sum, width) => sum + width, 0);
    ctx.save();
    ctx.strokeStyle = "#b7b7b7";
    ctx.lineWidth = metrics.scale;
    ctx.strokeRect(options.x, options.y, tableWidth, headerHeight + allRows.length * rowHeight);
    let x = options.x;
    options.heads.forEach((head, index) => {
      const width = options.widths[index];
      ctx.fillStyle = "#075a89";
      ctx.fillRect(x, options.y, width, headerHeight);
      ctx.strokeStyle = "#fff";
      ctx.strokeRect(x, options.y, width, headerHeight);
      pdfText(ctx, metrics, head, x + width / 2, options.y + metrics.mm(2.4), { size: 10, align: "center", color: "#fff", weight: "700", maxWidth: width - metrics.mm(2) });
      x += width;
    });
    allRows.forEach((row, rowIndex) => {
      const y = options.y + headerHeight + rowHeight * rowIndex;
      x = options.x;
      options.widths.forEach((width, cellIndex) => {
        ctx.fillStyle = rowIndex % 2 === 1 ? "#ececec" : "#fff";
        ctx.fillRect(x, y, width, rowHeight);
        ctx.strokeStyle = "#b7b7b7";
        ctx.strokeRect(x, y, width, rowHeight);
        drawPdfCellText(ctx, metrics, row.cells[cellIndex] || "", x, y, width, rowHeight, {
          align: options.align?.[cellIndex] || "left",
          color: row.adjustment ? "#d21f12" : (row.total || cellIndex === 0 ? "#075a89" : "#111"),
          weight: row.adjustment || row.total || cellIndex === 0 ? "700" : "400"
        });
        x += width;
      });
    });
    ctx.restore();
  }

  function drawPdfCellText(ctx, metrics, text, x, y, width, height, options = {}) {
    const padding = metrics.mm(1.2);
    const textX = options.align === "right" ? x + width - padding : options.align === "center" ? x + width / 2 : x + padding;
    const textY = y + metrics.mm(2.4);
    ctx.save();
    ctx.beginPath();
    ctx.rect(x + 1, y + 1, width - 2, height - 2);
    ctx.clip();
    pdfText(ctx, metrics, text, textX, textY, {
      size: 10.2,
      align: options.align,
      color: options.color,
      weight: options.weight,
      maxWidth: width - padding * 2
    });
    ctx.restore();
  }

  function loadCanvasImage(src) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error(`${src} を読み込めません`));
      image.src = src;
    });
  }

  async function renderPdfPageImage(pageElement) {
    const pageWidth = Math.round(210 * 96 / 25.4);
    const pageHeight = Math.round(297 * 96 / 25.4);
    const scale = 2;
    const host = document.createElement("div");
    host.style.position = "fixed";
    host.style.left = "-10000px";
    host.style.top = "0";
    host.style.width = `${pageWidth}px`;
    host.style.height = `${pageHeight}px`;
    host.style.overflow = "hidden";
    host.style.background = "#fff";
    host.style.pointerEvents = "none";
    const clone = pageElement.cloneNode(true);
    clone.style.margin = "0";
    clone.style.boxShadow = "none";
    host.appendChild(clone);
    document.body.appendChild(host);
    try {
      await inlineImagesForPdf(clone);
      if (document.fonts?.ready) await document.fonts.ready;
      const styleText = collectPdfStyles();
      clone.setAttribute("xmlns", "http://www.w3.org/1999/xhtml");
      const pageMarkup = new XMLSerializer().serializeToString(clone);
      const xhtml = `
        <div xmlns="http://www.w3.org/1999/xhtml">
          <style>${escapeXmlText(styleText)}</style>
          ${pageMarkup}
        </div>`;
      const svg = `
        <svg xmlns="http://www.w3.org/2000/svg" width="${pageWidth}" height="${pageHeight}" viewBox="0 0 ${pageWidth} ${pageHeight}">
          <foreignObject width="100%" height="100%">${xhtml}</foreignObject>
        </svg>`;
      const svgUrl = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));
      const image = await loadPdfImage(svgUrl);
      URL.revokeObjectURL(svgUrl);
      const canvas = document.createElement("canvas");
      canvas.width = pageWidth * scale;
      canvas.height = pageHeight * scale;
      const context = canvas.getContext("2d");
      context.fillStyle = "#fff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
      return {
        bytes: dataUrlToBytes(dataUrl),
        width: canvas.width,
        height: canvas.height
      };
    } finally {
      host.remove();
    }
  }

  function collectPdfStyles() {
    const rules = Array.from(document.styleSheets).map((sheet) => {
      try {
        return Array.from(sheet.cssRules).map((rule) => rule.cssText).join("\n");
      } catch (error) {
        return "";
      }
    }).join("\n");
    return `${rules}
      * { box-sizing: border-box; }
      html, body { margin: 0; padding: 0; background: #fff; }
      .quote-page { margin: 0 !important; box-shadow: none !important; }
      .preview-pages .quote-page { box-shadow: none !important; }
    `;
  }

  function escapeXmlText(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  async function inlineImagesForPdf(root) {
    const images = Array.from(root.querySelectorAll("img"));
    await Promise.all(images.map(async (image) => {
      const source = image.getAttribute("src");
      if (!source || source.startsWith("data:")) return;
      const response = await fetch(new URL(source, window.location.href).href, { cache: "no-store" });
      if (!response.ok) throw new Error(`${source} を読み込めません`);
      image.src = await blobToDataUrl(await response.blob());
    }));
    await Promise.all(images.map((image) => image.complete
      ? Promise.resolve()
      : new Promise((resolve) => {
        image.onload = resolve;
        image.onerror = resolve;
      })));
  }

  function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
  }

  function loadPdfImage(url) {
    return new Promise((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("PDF画像化に失敗しました"));
      image.src = url;
    });
  }

  function dataUrlToBytes(dataUrl) {
    const base64 = dataUrl.split(",")[1] || "";
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let index = 0; index < binary.length; index += 1) {
      bytes[index] = binary.charCodeAt(index);
    }
    return bytes;
  }

  function buildImagePdf(images) {
    const pdfWidth = 595.28;
    const pdfHeight = 841.89;
    const encoder = new TextEncoder();
    const chunks = [];
    const offsets = [0];
    let offset = 0;
    const add = (value) => {
      const bytes = typeof value === "string" ? encoder.encode(value) : value;
      chunks.push(bytes);
      offset += bytes.length;
    };
    const writeObject = (objectNumber, writer) => {
      offsets[objectNumber] = offset;
      add(`${objectNumber} 0 obj\n`);
      writer();
      add("\nendobj\n");
    };
    add("%PDF-1.4\n% Mitsumori PDF\n");
    const pageObjectNumbers = images.map((_, index) => 3 + index * 3);
    const objectCount = 2 + images.length * 3;
    writeObject(1, () => add("<< /Type /Catalog /Pages 2 0 R >>"));
    writeObject(2, () => add(`<< /Type /Pages /Kids [${pageObjectNumbers.map((number) => `${number} 0 R`).join(" ")}] /Count ${images.length} >>`));
    images.forEach((image, index) => {
      const pageObject = pageObjectNumbers[index];
      const imageObject = pageObject + 1;
      const contentObject = pageObject + 2;
      const imageName = `Im${index + 1}`;
      writeObject(pageObject, () => add(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pdfWidth} ${pdfHeight}] /Resources << /XObject << /${imageName} ${imageObject} 0 R >> >> /Contents ${contentObject} 0 R >>`));
      writeObject(imageObject, () => {
        add(`<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>\nstream\n`);
        add(image.bytes);
        add("\nendstream");
      });
      const content = `q\n${pdfWidth} 0 0 ${pdfHeight} 0 0 cm\n/${imageName} Do\nQ`;
      writeObject(contentObject, () => add(`<< /Length ${encoder.encode(content).length} >>\nstream\n${content}\nendstream`));
    });
    const xrefOffset = offset;
    add(`xref\n0 ${objectCount + 1}\n`);
    add("0000000000 65535 f \n");
    for (let index = 1; index <= objectCount; index += 1) {
      add(`${String(offsets[index]).padStart(10, "0")} 00000 n \n`);
    }
    add(`trailer\n<< /Size ${objectCount + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`);
    return new Blob(chunks, { type: "application/pdf" });
  }

  function exportExcel() {
    const total = totals();
    const worksheets = [
      worksheetXml("表紙・集計", [
        ["見積番号", state.quoteNo],
        ["発行日", state.issueDate],
        ["宛先", state.clientName],
        ["工事名", state.projectName],
        ["工事場所", state.siteAddress],
        ["敷地面積(㎡)", toNumber(state.siteArea) || ""],
        ["建築面積(㎡)", toNumber(state.buildingArea) || ""],
        ["延べ床面積(㎡)", toNumber(state.totalFloorArea) || ""],
        ["坪数", total.floorAreaTsubo || ""],
        ["坪単価", total.floorAreaTsubo > 0 ? total.tsuboUnitPrice : ""],
        [],
        ["工種", "小計"],
        ...visibleSheets().map((sheet) => [sheet.name, subtotalForSheet(sheet)]),
        [],
        ["小計", total.subtotal],
        ["共通仮設費", total.commonTemporaryCost],
        [`現場管理費 ${formatNumber(total.siteManagementRate)}%`, total.siteManagement],
        [`一般管理費 ${formatNumber(total.generalManagementRate)}%`, total.generalManagement],
        ["値引き", -total.discount],
        [`消費税 ${toNumber(state.taxRate)}%`, total.tax],
        ["税込合計", total.total],
        [],
        ["備考", state.notes]
      ]),
      ...visibleSheets().map((sheet) => worksheetXml(sheet.name, [
        ["区分", "名称", "概要", "数量", "単位", "単価", "金額", "印刷備考", "備考"],
        ...visibleItems(sheet).map((item) => item.type === "section"
          ? [item.category, "", "", "", "", "", "", "", ""]
          : [item.category, item.name, item.summary, item.qty, item.unit, toNumber(item.price), lineAmount(item), item.printRemarks, item.remarks]),
        [],
        ["工種小計", "", "", "", "", "", subtotalForSheet(sheet), "", ""]
      ]))
    ].join("");

    const xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
${worksheets}
</Workbook>`;
    downloadFile(xml, `${safeFileName(state.projectName || "見積書")}.xls`, "application/vnd.ms-excel;charset=utf-8");
  }

  function worksheetXml(name, rows) {
    return `<Worksheet ss:Name="${escapeXml(sheetSafeName(name))}"><Table>${rows.map((row) => `<Row>${row.map(cellXml).join("")}</Row>`).join("")}</Table></Worksheet>`;
  }

  function cellXml(value) {
    const isNumber = typeof value === "number" && Number.isFinite(value);
    return `<Cell><Data ss:Type="${isNumber ? "Number" : "String"}">${escapeXml(value)}</Data></Cell>`;
  }

  function escapeXml(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function downloadFile(content, filename, type) {
    downloadBlob(new Blob([content], { type }), filename);
  }

  function downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function safeFileName(value) {
    return String(value).replace(/[\\/:*?"<>|]/g, "_");
  }

  function sheetSafeName(value) {
    return String(value || "Sheet").replace(/[\\/?*[\]:]/g, "_").slice(0, 31);
  }

  $("addItemButton").addEventListener("click", () => addItem("item"));
  $("addSectionButton").addEventListener("click", () => addItem("section"));
  $("addSheetButton").addEventListener("click", addSheet);
  $("deleteSheetButton").addEventListener("click", deleteSheet);
  $("resetConcreteTemplateButton").addEventListener("click", resetActiveConcreteTemplate);
  $("applyConcretePriceButton").addEventListener("click", applyConcreteUnitPricesToActiveSheet);
  $("resetConcreteBlockTemplateButton").addEventListener("click", resetActiveConcreteBlockTemplate);
  $("resetEarthworkTemplateButton").addEventListener("click", resetActiveEarthworkTemplate);
  $("resetFormworkTemplateButton").addEventListener("click", resetActiveFormworkTemplate);
  $("resetPlasterTemplateButton").addEventListener("click", resetActivePlasterTemplate);
  $("resetMetalTemplateButton").addEventListener("click", resetActiveMetalTemplate);
  $("dataLoadButton").addEventListener("click", () => {
    loadDataFile().catch((error) => {
      setDataFileStatus(`Dropbox共有データ: 読み込みできませんでした（${error.message}）`);
    });
  });
  $("bundledDataLoadButton").addEventListener("click", () => {
    loadBundledDataFile().catch((error) => {
      setDataFileStatus(`Dropbox共有データ: 保存済みデータを読み込みできませんでした（${error.message}）`);
    });
  });
  $("dataSaveButton").addEventListener("click", () => {
    saveDataFile().catch((error) => {
      setDataFileStatus(`Dropbox共有データ: 保存できませんでした（${error.message}）`);
    });
  });
  $("dataSaveAsButton").addEventListener("click", () => {
    saveDataFile({ saveAs: true }).catch((error) => {
      setDataFileStatus(`Dropbox共有データ: 別名保存できませんでした（${error.message}）`);
    });
  });
  $("dataFileInput").addEventListener("change", (event) => {
    const [file] = event.target.files;
    if (!file) return;
    file.text()
      .then((text) => loadDataFileText(text, file.name))
      .catch((error) => {
        setDataFileStatus(`Dropbox共有データ: 読み込みできませんでした（${error.message}）`);
      })
      .finally(() => {
        event.target.value = "";
      });
  });
  $("createPresetTradesButton").addEventListener("click", ensurePresetTrades);
  $("loadUeharaButton").addEventListener("click", loadUeharaEstimate);
  $("importTextButton").addEventListener("click", importText);
  $("fileInput").addEventListener("change", (event) => {
    handleFiles(event.target.files).finally(() => {
      event.target.value = "";
    });
  });
  $("fileDropZone").addEventListener("dragover", (event) => {
    event.preventDefault();
    $("fileDropZone").classList.add("dragging");
  });
  $("fileDropZone").addEventListener("dragleave", () => $("fileDropZone").classList.remove("dragging"));
  $("fileDropZone").addEventListener("drop", (event) => {
    event.preventDefault();
    $("fileDropZone").classList.remove("dragging");
    handleFiles(event.dataTransfer.files);
  });
  $("vendorPdfCloseButton").addEventListener("click", () => closeVendorPdfImporter());
  $("vendorPdfPrevButton").addEventListener("click", async () => {
    if (!vendorPdfSession || vendorPdfSession.pageRendering || vendorPdfSession.pageNo <= 1) return;
    vendorPdfSession.pageNo -= 1;
    await renderVendorPdfPage();
  });
  $("vendorPdfNextButton").addEventListener("click", async () => {
    if (!vendorPdfSession || vendorPdfSession.pageRendering || vendorPdfSession.pageNo >= vendorPdfSession.pdf.numPages) return;
    vendorPdfSession.pageNo += 1;
    await renderVendorPdfPage();
  });
  $("vendorPdfClearButton").addEventListener("click", () => {
    if (!vendorPdfSession) return;
    vendorPdfSession.ranges = [];
    invalidateVendorOcrReview();
    renderVendorRangeList();
    renderVendorSelectionBoxes();
    $("vendorPdfStatus").textContent = "PDF上で取り込む範囲をドラッグしてください。複数選択できます。";
  });
  $("vendorPdfOcrButton").addEventListener("click", () => {
    runVendorSelectionOcr().catch((error) => {
      setVendorPdfProcessing(false);
      $("vendorPdfStatus").textContent = `OCR読込に失敗しました: ${error.message || error}`;
    });
  });
  $("vendorAddRowButton").addEventListener("click", addVendorReviewRow);
  $("vendorNetTaxMode").addEventListener("change", (event) => {
    if (!vendorPdfSession) return;
    vendorPdfSession.netTaxMode = event.target.value;
    renderVendorOcrReview();
  });
  $("vendorNetTaxRate").addEventListener("input", (event) => {
    if (!vendorPdfSession) return;
    vendorPdfSession.netTaxRate = Math.min(100, Math.max(0, toNumber(event.target.value)));
    refreshVendorReviewCalculations();
  });
  $("vendorApplyButton").addEventListener("click", applyVendorOcrResult);
  $("vendorPdfSelectionLayer").addEventListener("pointerdown", vendorSelectionPointerDown);
  $("vendorPdfSelectionLayer").addEventListener("pointermove", vendorSelectionPointerMove);
  $("vendorPdfSelectionLayer").addEventListener("pointerup", vendorSelectionPointerUp);
  $("vendorPdfSelectionLayer").addEventListener("pointercancel", () => {
    vendorSelectionDraft = null;
    renderVendorSelectionBoxes();
  });
  $("printButton").addEventListener("click", openPrintPdf);
  $("previewCloseButton").addEventListener("click", closePrintPreview);
  $("previewBrowserPrintButton").addEventListener("click", printPreview);
  $("previewPrintButton").addEventListener("click", () => {
    savePdfFile().catch((error) => {
      console.error(error);
      alert(`PDF保存に失敗しました。\n${error.message || error}`);
    });
  });
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && $("vendorPdfImportModal").classList.contains("is-open")) {
      closeVendorPdfImporter();
      return;
    }
    if (event.key === "Escape" && $("pdfPreview").classList.contains("is-open")) {
      closePrintPreview();
    }
  });
  $("excelButton").addEventListener("click", exportExcel);
  $("saveButton").addEventListener("click", () => {
    saveState();
    $("saveButton").textContent = "保存済み";
    setTimeout(() => { $("saveButton").textContent = "保存"; }, 1200);
  });
  $("clearButton").addEventListener("click", () => {
    if (!confirm("入力内容を初期化しますか？")) return;
    state = clone(defaults);
    render();
  });

  bindFields();
  render();
})();
