// コロナ禍を振り返る
// 創価大学 理工学部 情報システム工学科 畝見研究室
// 2023.2.
const dataInfoList = [
  {"name":"severe_cases", "title":"重症", "comment":"", "color":"rgb(255,200,150)"},
  {"name":"deaths_weekly", "title":"死亡", "comment":" (1日当たり数の週平均)", "color":"rgb(255,160,160)"},
  {"name":"new_cases", "title":"新規陽性", "comment":" (1日当たり数の週平均)", "color":"rgb(200,255,180)"}];
let dataInfo, marks, fixedFont;
let ww = 1280, hh = 720, scl = 1.0, xoffset = 100, yoffset = 40;
let bgColor, fgColor, textColor, axisColor, barColor,
  newsColor, pointerColor, vaxColor;
let tbl, newsTbl, maxYs, x = 0, numbWidth;
let vaxTbl, vaxRowCnt, vaxLastDate, vaxStartX;
const vaxMaxY = 125.4e6;  // Population size of Japan
let running = null, isPC = true;
let startStopBtn, dateSlider, vaxCheckBox;
const numFmt = new Intl.NumberFormat();
function preload() {
  fixedFont = loadFont("data/Courier-Bold.otf");
  newsTbl = loadTable("data/COVID19History.tsv");
  vaxTbl = loadTable("data/vax.csv");
}
function setup() {
  startStopBtn = document.getElementById("startStop");
  vaxCheckBox = document.getElementById("vaccination");
  dateSlider = document.getElementById("DateSlider");
  dateSlider.min = 1;
  const caption = document.getElementById("caption");
  document.body.removeChild(dateSlider);
  document.body.removeChild(caption);
  document.body.appendChild(dateSlider);
  document.body.appendChild(caption);
  const ua = window.navigator.userAgent;
  if (ua.indexOf("iPhone") != -1 || ua.indexOf("Android") != -1) {
    setupDimensionForSP();
    isPC = false;
  } else {
    adjustWidth();
    document.getElementsByClassName("leftRight").forEach((x) => {
      x.style.setProperty("display", "flex");
      x.style.setProperty("justify-content", "space-between");
    });
  }
  createCanvas(ww,hh);
  dateSlider.style.width = ww + "px";
  bgColor = color(0);
  textColor = color(255); axisColor = color(255); barColor = color(120);
  newsColor = color(120,220,255); pointerColor = color(255,90,90);
  vaxColor = color(100,200,100,64);
  frameRate(20);
  const sel = document.getElementById("choice");
  for (let i = 0; i < dataInfoList.length; i ++) {
    const elm = document.createElement("option");
    elm.value = i;
    elm.textContent = dataInfoList[i].title + "患者数";
    sel.appendChild(elm);
  }
  // Vaccination data
  vaxRowCnt = vaxTbl.getRowCount();
  vaxLastDate = dateToInt(vaxTbl.getString(vaxRowCnt - 1, 0));
  //
  setupForData(0);
}
let dataReady;
function setupForData(idx) {
  dataReady = false;
  dataInfo = dataInfoList[idx];
  tbl = loadTable("data/" + dataInfo.name + ".csv", "csv", "", setupAfterDataLoaded);
}
function setupAfterDataLoaded() {
  fgColor = color(dataInfo.color);
  const rowCnt = tbl.getRowCount(), newsCnt = newsTbl.getRowCount();
  const periodSpan = document.getElementById("period");
  periodSpan.textContent = tbl.getString(0, 0) + "〜" + tbl.getString(rowCnt - 1, 0);
  if (dateSlider.max != rowCnt - 1) {
    const newX = (x == 0)? rowCnt - 1 : max(1, int(x) + int(rowCnt - 1 - dateSlider.max));
    dateSlider.max = rowCnt - 1;
    dateSlider.value = x = newX;
  }
  const lastDate = dateToInt(tbl.getString(rowCnt - 1, 0));
  let vaxOffset = 0;
  if (lastDate > vaxLastDate) {
    let dt = lastDate;
    while (dt > vaxLastDate) { dt = dateToInt(tbl.getString(rowCnt - 1 + (-- vaxOffset), 0)); }
  } else if (lastDate < vaxLastDate) {
    let dt = vaxLastDate;
    while (dt > lastDate) { dt = dateToInt(vaxTbl.getString(vaxRowCnt - 1 - (++ vaxOffset), 0)); }
  }
  vaxStartX = rowCnt - vaxRowCnt + vaxOffset;
  //console.log("vaxOffset = " + vaxOffset);
  const dateTics = document.getElementById("DateTics");
  dateTics.replaceChildren();
  maxYs = [];
  for (let i = 0, v = 0; i < rowCnt; i ++) {
    const y = tbl.getNum(i, 1);
    if (v < y) { v = y; }
    maxYs.push(v);
    if (tbl.getString(i, 0).split("/")[2] == "1") {
      const opt = document.createElement("option");
      opt.value = i;
      dateTics.appendChild(opt);
    }
  }
  push();
  textFont(fixedFont, 32.0 * scl);
  numbWidth = textWidth(numFmt.format(int(maxYs[rowCnt - 1])));
  pop();
  marks = [];
  for (let i = 0, idx = 0; i < newsCnt; i ++) {
    const dt = dateToInt(newsTbl.getString(i, 1));
    while (idx < rowCnt && dt > dateToInt(tbl.getString(idx, 0))) { idx ++; }
    if (idx < rowCnt) { marks.push({"y":tbl.getNum(idx, 1), "clm":idx}); }
  }
  dataReady = true;
  if (running == null) { setRunning(false); }
  if (!running) { drawIt(); }
}
function draw() {
  background(bgColor);
  if (!dataReady) { return; }
  if (x < tbl.getRowCount() - 1) { dateSlider.value = (++ x); }
  else { setRunning(false); }
  drawIt();
}
function drawIt() {
  background(bgColor);
  const gw = ww - xoffset, gh = hh - yoffset, maxY = maxYs[x - 1];
  textSize(24.0 * scl);
  strokeJoin(ROUND);
  push();
  // axis lines
  translate(0, height - 1);
  scale(width / ww, -height / hh);
  stroke(axisColor);
  line(0, yoffset, ww - 1, yoffset);
  line(xoffset, 0, xoffset, hh - 1);
  // graph
  translate(xoffset, yoffset);
  noStroke();
  fill(fgColor);
  beginShape();
  vertex(0, 0);
  for (let i = 0; i <= x; i ++) {
    const y = tbl.getNum(i, 1);
    vertex(i * gw / x, y * gh / maxY);
  }
  vertex(gw, 0);
  endShape(CLOSE);
  // vaccination
  if (x > vaxStartX && vaxCheckBox.checked) {
    fill(vaxColor);
    const clmnCnt = vaxTbl.getColumnCount();
    for (let j = 1; j < clmnCnt; j ++) {
      beginShape();
      for (let i = 0; i + vaxStartX <= x && i < vaxRowCnt; i ++) {
        vertex((i + vaxStartX) * gw / x, vaxTbl.getNum(i, j) * gh / vaxMaxY);
      }
      vertex(gw, 0);
      endShape(CLOSE);
    }
  }
  // horizontal tics
  fill(textColor);
  noStroke();
  let sp = ticsSpan(x, 8);
  push();
  translate(0, yoffset / -2.0);
  scale(1, -1);
  for (let i = sp / 2; i < x; i += sp) {
    text(tbl.getString(int(i), 0), i * gw / (x - 1), 0);
  }
  pop();
  // vertical tics
  sp = ticsSpan(maxY, 8);
  translate(-5, 0);
  textAlign(RIGHT);
  for (let i = sp; i < maxY; i += sp) {
    push();
    translate(0, i * gh / maxY);
    scale(1, -1);
    noStroke();
    text(numFmt.format(i), 0, 5 * scl);
    stroke(barColor);
    line(0, 0, gw, 0);
    pop();
  }
  pop();
  // events
  push();
  let bottom = marks.length - 1;
  for (; bottom > 0; bottom --)
    { if (marks[bottom].clm < x) { break; } }
  const sclx = width / ww, scly = height / hh;
  const offset = min(x - marks[bottom].clm, 5);
  for (let cnt = 0; cnt <= bottom; cnt ++) {
    const y = height - (cnt - 0.7 + offset / 5.0) * 46 * scl, j = bottom - cnt;
    if (y <= 0) { break; }
    fill(newsColor);
    stroke(0, 220);
    strokeWeight(5 * scl);
    textAlign(RIGHT);
    text(newsTbl.getString(j, 1), width/2 - 300 * scl, y);
    textAlign(LEFT);
    text(newsTbl.getString(j, 0), width/2 - 280 * scl, y);
    const xr = (xoffset + marks[j].clm * gw / x) * sclx;
    const ym = (maxY - marks[j].y) / maxY * gh * scly;
    noFill();
    stroke(pointerColor);
    strokeWeight(1.5 * scl);
    beginShape();
    vertex(width/2 - 280 * scl, y + 8 * scl);
    vertex(xr, y + 8 * scl);
    vertex(xr, ym);
    endShape();
    circle(xr, ym, 11 * scl);
  }
  // title
  textSize(32.0 * scl);
  const title = "全国" + dataInfo.title + "患者数推移" + dataInfo.comment;
  const w = textWidth(title) + 20 * scl;
  fill(0, 127);
  noStroke();
  rect((width - w) / 2, 10 * scl, w, 100 * scl);
  fill(textColor);
  stroke(bgColor);
  strokeWeight(4 * scl);
  textAlign(CENTER);
  text(title, width/2, 58 * scl);
  push();
  textFont(fixedFont);
  textAlign(RIGHT);
  const dt = tbl.getString(x, 0).split("/");
  text(dt[0] + "/" + twoClmn(dt[1]) + "/" + twoClmn(dt[2]), width/2 - 5 * scl, 100 * scl);
  const txtOx = width/2 + numbWidth + 5 * scl;
  text(numFmt.format(int(tbl.getNum(x, 1))), txtOx, 100 * scl);
  pop();
  textAlign(LEFT);
  text("人", txtOx + 3 * scl, 100 * scl);
  pop();
}
function ticsSpan(maxX, nTics) {
  let sp = 1, idx = 0;
  let dvs = [2, 2.5, 2];
  while (maxX / sp > nTics) { sp *= dvs[idx]; idx = (idx + 1) % 3; }
  return sp;
}
function dateToInt(dateStr) {  // "2020/1/16" => 20200116
  const a = dateStr.split("/");
  return int(a[0]) * 10000 + int(a[1]) * 100 + int(a[2]);
}
function twoClmn(s) { return (s.length <= 1)? "0" + s : s; }
function setRunning(value) {
  if (running == value) { return; }
  if ((running = value)) {
    if (x >= tbl.getRowCount() - 1) { dateSlider.value = x = 1; }
    loop();
  } else { noLoop(); }
  startStopBtn.textContent = String.fromCharCode(running? 0x23F8 : 0x25B6);
}
function startStop() {
  setRunning(!running);
}
function jumpToStart() {
  setDate(dateSlider.value = dateSlider.min);
}
function jumpToEnd() {
  setDate(dateSlider.value = dateSlider.max);
}
function stepBackward() {
  if (!running && x > dateSlider.min) { dateSlider.value = -- x; drawIt(); }
}
function stepForward() {
  if (!running && x < dateSlider.max) { dateSlider.value = ++ x; drawIt(); }
}
function setDate(value) {
  x = value;
  if (!running) { drawIt(); }
}
function setupDimensionForSP() {
    ww = document.body.offsetWidth;
    hh = ww * 9.0 / 16.0;
    scl = ww / 1280.0;
    xoffset = 100 * scl; yoffset = 100 * scl;
}
function adjustWidth() {
  if (isPC) {
    const spc = (document.body.offsetWidth - ww) / 2;
    document.getElementsByClassName("leftRight").forEach((x) => {
      x.style.setProperty("margin-left", spc + "px");
      x.style.width = ww + "px";
    });
  } else {
    setupDimensionForSP();
    resizeCanvas(ww, hh);
    dateSlider.style.width = ww + "px";
    drawIt();
  }
}
