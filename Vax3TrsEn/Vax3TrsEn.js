// The main part of Javascript to draw an animated plots on
// prefectures' cumulative infection vs. third doses in Japan.
// by Tatsuo Unemi, Soka University, Nov. 2022.
let prfTbl, prefPopSz, prefNames, vaxTbl, ptnTbl;
let ctx, intervalID, frameInterval;
let CWidth, CHeight, hTics, vTics;
const lines = [], vRange = [], pRange1 = [], pRange2 = [];
const Margin = {top:20, right:20, bottom:40, left:56};
const areaPath = new Path2D();
let step = 0, maxStep;
let GoButton, AdjustCBox, FromDec1CBox, DateSlider;
let FromDec1 = true, DaysDiff = 7;
class PlotPoint {
  constructor(x, p) { this.x = x; this.p = p; }
  y(i) { return FromDec1? this.p - lines[i][DaysDiff].p : this.p; }
}
function adjustGoBtn() {
  GoButton.value = (intervalID != undefined)? "Stop" : "Start";
}
function adjustStepMax() {
  const orgMaxStep = maxStep;
  DateSlider.max = maxStep = vaxTbl.length - 1 - DaysDiff;
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
function start() {
  const cnvs = document.getElementsByTagName("canvas")[0];
  CWidth = cnvs.width;
  CHeight = cnvs.height;
  ctx = cnvs.getContext("2d");
  const dpr = window.devicePixelRatio || 1;
  if (dpr > 1) {
    cnvs.width *= dpr;
    cnvs.height *= dpr;
    ctx.scale(dpr, dpr);
  }
  ctx.font = "14px Helvetica";
  hTics = new HTics(
    {x:Margin.left, y:CHeight - Margin.bottom},
    {x:CWidth - Margin.right, y:CHeight - Margin.bottom}, 0, 1, 8);
  vTics = new VTics(
    {x:Margin.left, y:CHeight - Margin.bottom},
    {x:Margin.left, y:Margin.top}, 0, 1, 8);
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
  prefPopSz = prfTbl[1];
  prefNames = prfTbl[0];
  const endDate = document.getElementById("endDate");
  endDate.textContent = dateStr(vaxTbl[vaxTbl.length - 1][0]);
  for (let i = 0; i < 47; i ++) { lines.push([]); }
  for (let stp = 0; stp < vaxTbl.length; stp ++) {
    const vr = vaxTbl[stp], pr = ptnTbl[stp];
    let minv = 1e10, maxv = 0,
      minp = 1e10, maxp = 0, minp2 = 1e10, maxp2 = 0;
    for (let i = 0; i < 47; i ++) {
      const popSz = prefPopSz[i],
        v = vr[i+1]/popSz, p = pr[i+2]/popSz;
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
  frameInterval = 1000. / 15.;
  draw();
}
function coordx(pt,mx) { return (pt.x-hTics.from)*mx+Margin.left; }
function coordy(pt,my,i) { return CHeight - Margin.bottom - (pt.y(i)-vTics.from)*my; }
function color(h,s,l) { return "hsl(" + h + "," + s + "%," + l + "%)"; }
function drawFrame() {
  ctx.fillStyle = "#d6d6d6";
  ctx.fillRect(0, 0, CWidth, CHeight);
  const ajstMin = AdjustCBox.checked;
  FromDec1 = FromDec1CBox.checked;
  hTics.setRange(vRange[step], ajstMin);
  vTics.setRange((FromDec1? pRange2 : pRange1)[step+DaysDiff], ajstMin);
  hTics.draw();
  vTics.draw();
  const mx = (CWidth - Margin.left - Margin.right) / (hTics.to - hTics.from),
    my = (CHeight - Margin.top - Margin.bottom) / (vTics.to - vTics.from);
  ctx.textAlign = "center";
  ctx.save();
  ctx.clip(areaPath);
  for (let i = 0; i < 47; i ++) {
    const col = color((46-i)*300/47.0, 90, 35);
    ctx.strokeStyle = col;
    ctx.beginPath();
    let cont = false, lx, ly;
    for (let stp = 0; stp < step; stp ++) {
      if (lines[i][stp+1].x > hTics.from && lines[i][stp+1+DaysDiff].y(i) > vTics.from) {
        lx = coordx(lines[i][stp],mx);
        ly = coordy(lines[i][stp+DaysDiff],my,i);
        if (cont) ctx.lineTo(lx, ly);
        else { ctx.moveTo(lx, ly); cont = true; }
      }
    }
    ctx.stroke();
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.ellipse(lx, ly, 3.5, 3.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillText(prefNames[i], lx, ly - 6);
  }
  ctx.restore();
  ctx.fillStyle = "#000";
  ctx.fillText("Third doses " + dateStr(vaxTbl[step][0]), CWidth/2, CHeight - 4);
  ctx.save();
  ctx.translate(16, CHeight/2);
  ctx.rotate(-Math.PI/2.);
  ctx.fillText("Cumulative infected " + dateStr(vaxTbl[step+DaysDiff][0]), 0, 0);
  ctx.restore();
}
function loop() {
    if (intervalID != undefined) return;
    intervalID = setInterval(draw, frameInterval);
}
function noLoop() {
    if (intervalID == undefined) return;
    clearInterval(intervalID);
    intervalID = undefined;
}
function draw() {
  drawFrame();
  if (step >= maxStep) {
    noLoop(); adjustGoBtn();
  } else { DateSlider.value = ++ step; }
}
function clickGoButton() {
  if (intervalID != undefined) { noLoop(); }
  else {
    if (step >= maxStep) { DateSlider.value = step = 0; }
    loop();
  }
  adjustGoBtn();
}
function switchAdjustCBox() {
  if (intervalID == undefined) { drawFrame(); }
}
function changeDaysDiff(value) {
  DaysDiff = parseInt(value);
  adjustStepMax();
  switchAdjustCBox();
}
function changeFPS(value) {
  frameInterval = 1000. / parseInt(value);
}
function setDate(value) {
  step = parseInt(value);
  switchAdjustCBox();
}
