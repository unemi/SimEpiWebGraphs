let prfTbl, prefPopSz, prefNames, vaxTbl, ptnTbl;
const lines = [], vRange = [], pRange1 = [], pRange2 = [];
const Margin = {top:20, right:20, bottom:40, left:56},
  CWidth = 800, CHeight = 600;
const areaPath = new Path2D();
const hTics = new HTics(
    {x:Margin.left, y:CHeight - Margin.bottom},
    {x:CWidth - Margin.right, y:CHeight - Margin.bottom}, 0, 1, 8),
  vTics = new VTics(
    {x:Margin.left, y:CHeight - Margin.bottom},
    {x:Margin.left, y:Margin.top}, 0, 1, 8);
let step = 0, maxStep;
let GoButton, AdjustCBox, FromDec1CBox, DateSlider;
let FromDec1 = true, DaysDiff = 7;
class PlotPoint {
  constructor(x, p) { this.x = x; this.p = p; }
  y(i) { return FromDec1? this.p - lines[i][DaysDiff].p : this.p; }
}
function preload() {
  prfTbl = loadTable("data/pref_info.csv");
  vaxTbl = loadTable("data/vax_pref.csv");
  ptnTbl = loadTable("data/ptn_pref.csv");
}
function adjustGoBtn() {
  GoButton.value = isLooping()? "Stop" : "Start";
}
function adjustStepMax() {
  const orgMaxStep = maxStep;
  DateSlider.max = maxStep = vaxTbl.getRowCount() - 1 - DaysDiff;
  if (step > maxStep) { step = maxStep; }
  else if (maxStep > orgMaxStep) { step += maxStep - orgMaxStep; }
}
function dateStr(strJpn) {
  const months =
  ["Jan","Feb","Mar","Apr","May","Jun",
   "Jul","Aug","Sep","Oct","Nov","Dec"];
  const cs = strJpn.split("/");
  return months[parseInt(cs[1]) - 1] + " " + cs[2] + ", " + cs[0];
}
function setup() {
  createCanvas(CWidth, CHeight);
  areaPath.moveTo(Margin.left, Margin.top);
  areaPath.lineTo(CWidth, Margin.top);
  areaPath.lineTo(CWidth, CHeight - Margin.bottom);
  areaPath.lineTo(Margin.left, CHeight - Margin.bottom);
  areaPath.closePath();
  GoButton = document.getElementById("GoButton");
  AdjustCBox = document.getElementById("AdjustCBox");
  FromDec1CBox = document.getElementById("FromDec1CBox");
  DateSlider = document.getElementById("DateSlider");
  adjustStepMax();
  DateSlider.value = step = maxStep;
  prefPopSz = prfTbl.getRow(1);
  prefNames = prfTbl.getRow(0);
  const endDate = document.getElementById("endDate");
  endDate.textContent = dateStr(vaxTbl.getString(vaxTbl.getRowCount() - 1, 0));
  for (let i = 0; i < 47; i ++) { lines.push([]); }
  for (let stp = 0; stp < vaxTbl.getRowCount(); stp ++) {
    const vr = vaxTbl.getRow(stp), pr = ptnTbl.getRow(stp);
    let minv = 1e10, maxv = 0,
      minp = 1e10, maxp = 0, minp2 = 1e10, maxp2 = 0;
    for (let i = 0; i < 47; i ++) {
      const popSz = prefPopSz.getNum(i),
        v = vr.get(i+1)/popSz, p = pr.get(i+2)/popSz;
      if (minv > v) { minv = v; }
      if (minp > p) { minp = p; }
      if (maxv < v) { maxv = v; }
      if (maxp < p) { maxp = p; }
      lines[i].push(new PlotPoint(v, p));
      const p2 = p - lines[i][0].p;
      if (minp2 > p2) { minp2 = p2; }
      if (maxp2 < p2) { maxp2 = p2; }
    }
    vRange.push({l:minv, u:maxv});
    pRange1.push({l:minp, u:maxp});
    if (stp == 0) {
      pRange2.push({l:0, u:1});
    } else {
      pRange2.push({l:minp2, u:maxp2});
    }
  }
  frameRate(15);
  colorMode(HSB);
}
function coordx(pt,mx) { return (pt.x-hTics.from)*mx+Margin.left; }
function coordy(pt,my,i) { return height - Margin.bottom - (pt.y(i)-vTics.from)*my; }
function drawFrame() {
  background(90);
  const ajstMin = AdjustCBox.checked;
  FromDec1 = FromDec1CBox.checked;
  hTics.setRange(vRange[step], ajstMin);
  vTics.setRange((FromDec1? pRange2 : pRange1)[step+DaysDiff], ajstMin);
  hTics.draw();
  vTics.draw();
  const mx = (width - Margin.left - Margin.right) / (hTics.to - hTics.from),
    my = (height - Margin.top - Margin.bottom) / (vTics.to - vTics.from);
  textAlign(CENTER);
  push();
  drawingContext.clip(areaPath);
  for (let i = 0; i < 47; i ++) {
    const col = color((46-i)*300/47.0, 100, 60);
    noFill();
    stroke(col);
    beginShape();
    for (let stp = 0; stp < step; stp ++) {
      if (lines[i][stp+1].x > hTics.from && lines[i][stp+1+DaysDiff].y(i) > vTics.from) {
        vertex(coordx(lines[i][stp],mx), coordy(lines[i][stp+DaysDiff],my,i));
      }
    }
    const lx = coordx(lines[i][step],mx), ly = coordy(lines[i][step+DaysDiff],my,i);
    vertex(lx, ly);
    endShape();
    noStroke(); fill(col);
    circle(lx, ly, 7);
    text(prefNames.getString(i), lx, ly - 6);
  }
  pop();
  fill(0);
  text("Third doses " + dateStr(vaxTbl.getString(step,0)), width/2, height - 4);
  push();
  translate(16, height/2);
  rotate(-PI/2);
  text("Cumulative infected " + dateStr(vaxTbl.getString(step+DaysDiff,0)), 0, 0);
  pop();
}
function draw() {
  drawFrame();
  if (step >= maxStep) {
    noLoop(); adjustGoBtn();
  } else { DateSlider.value = ++ step; }
}
function clickGoButton() {
  if (isLooping()) { noLoop(); }
  else {
    if (step >= maxStep) { DateSlider.value = step = 0; }
    loop();
  }
  adjustGoBtn();
}
function switchAdjustCBox() {
  if (!isLooping()) { drawFrame(); }
}
function changeDaysDiff(value) {
  DaysDiff = int(value);
  adjustStepMax();
  switchAdjustCBox();
}
function changeFPS(value) {
  frameRate(int(value));
}
function setDate(value) {
  step = int(value);
  switchAdjustCBox();
}
