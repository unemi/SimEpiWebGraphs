// コロナ禍を振り返る
// 創価大学 理工学部 情報システム工学科 畝見研究室
// 2023.2.
const dataInfoList = [
  {"name":"severe_cases", "title":"重症", "comment":"", "color":"rgb(255,200,150)"},
  {"name":"deaths_weekly", "title":"死亡", "comment":" (1日当たり数の週平均)", "color":"rgb(255,160,160)"},
  {"name":"new_cases", "title":"新規陽性", "comment":" (1日当たり数の週平均)", "color":"rgb(200,255,180)"}];
let dataInfo, dataReady, marks, maxLenForNum, offScrGr;
let ww = 1280, hh = 720, scl = 1.0, txtScl = 1.0,
  xoffset = 100, yoffset = 40, margin = 0, normalLineHeight = 24;
let bgColor, fgColor, textColor, axisColor, barColor, pointerColor, vaxColor;
let tbl, newsTbl, maxYs, x = 0, eventOffset = 0.0, fading = 0;
let vaxTbl, vaxRowCnt, vaxLastDate, vaxStartX;
const vaxMaxY = 125.4e6;  // Population size of Japan
let running = null, clientType, indexCirculation = false, indexShown = 0,
  stepCnt = 0, runFrameRate = 20, xDrawn = -1, xRevised = false, needsRedraw = true;
const ClientIPhone = 0, ClientAndroid = 1,
  ClientEdg = 2, ClientChrome = 3, ClientSafari = 4, ClientFF = 5, ClientUnknown = 6;
const clientKeys = ["iPhone", "Android", "Edg", "Chrome", "Safari", "Firefox"];
let controller, periodSpan, fullscreenBtn;
let theCanvas, fader, graphTitle, dailyInfo, configPanel,
  startStopBtn, dateSlider, loopCheckBox, vaxCheckBox;
let imgPlay, imgPause;
let cntrlOrigin, sliderOrigin, fulScrBtnOrigin, cnfgPnlOrigin;
const newsCategories = [], newsCatColors = {};
let newsIdxs = [];
const numFmt = new Intl.NumberFormat();

function cl(x) {
    return (x < 0.5)? x * 2.0 / 3.0 :
      (x < 5.0 / 8.0)? x * 8.0 / 3.0 - 1.0 : x * 2.0 / 3.0 + 1.0 / 4;
}
function hsl2rgb(h, s, l) {  // h = [0,1), s, l = [0,100]
  h *= 360; s /= 100.0; l /=100.0;
  const c = (1 - abs(2 * l - 1)) * s, h1 = h / 60, x = c * (1 - abs(fract(h1 / 2) * 2 - 1));
  let r1, g1, b1;
  if (h1 < 1) { r1 = c; g1 = x; b1 = 0; }
  else if (h1 < 2) { r1 = x; g1 = x; b1 = 0; }
  else if (h1 < 3) { r1 = 0; g1 = c; b1 = x; }
  else if (h1 < 4) { r1 = 0; g1 = x; b1 = c; }
  else if (h1 < 5) { r1 = x; g1 = 0; b1 = c; }
  else { r1 = c; g1 = 0; b1 = x; }
  const m = l - c / 2;
  return {"red":(r1 + m) * 255, "green":(g1 + m) * 255, "blue":(b1 + m) * 255};
}
function nodePlace(node) {
  return {"node":node, "parent":node.parentNode, "next":node.nextSibling};
}
function placeNode(place) {
    place.parent.insertBefore(place.node, place.next);
}
function buttonImage(name) {
    const img = document.createElement("img");
    img.src = "data/" + name + ".svg";
    img.style.width = img.style.height = "24px";
    img.style.marginBottom = "-6px";
    return img;
}
function defaultBoolValue(name, dflt) {
  const value = localStorage.getItem(name);
  return (value == "false")? false : (value == "true")? true : dflt;
}
function preload() { // automatically called by p5js
  newsTbl = loadTable("data/COVID19History.tsv");
  vaxTbl = loadTable("data/vax.csv");
}
function setup() { // automatically called by p5js
  theCanvas = document.getElementById("CanvasContainer");
  fader = document.getElementById("Fader");
  graphTitle = document.getElementById("GraphTitle");
  dailyInfo = document.getElementById("DailyInfo");
  periodSpan = document.getElementById("period");
  fullscreenBtn = document.getElementById("fullscreenBtn");
  configPanel = document.getElementById("configPanel");
  startStopBtn = document.getElementById("startStop");
  loopCheckBox = document.getElementById("looping");
  vaxCheckBox = document.getElementById("vaccination");
  controller = document.getElementById("Controller");
  dateSlider = document.getElementById("DateSlider");
  dateSlider.min = 1;
  loopCheckBox.checked = defaultBoolValue("繰り返し", true);
  vaxCheckBox.checked = defaultBoolValue("ワクチン接種", true);
  cntrlOrigin = nodePlace(controller);
  sliderOrigin = nodePlace(dateSlider);
  fulScrBtnOrigin = nodePlace(fullscreenBtn);
  cnfgPnlOrigin = nodePlace(configPanel);
  imgPlay = buttonImage("play");
  imgPause = buttonImage("pause");
  normalLineHeight = periodSpan.offsetHeight;
//
  const ua = window.navigator.userAgent;
  for (clientType = 0; clientType < clientKeys.length; clientType ++)
    { if (ua.indexOf(clientKeys[clientType]) != -1) { break; } }
  switch (clientType) {
    case ClientIPhone: case ClientAndroid:
    fullscreenBtn.remove();
    setupDimensionForSP();
    break;
    default:
    if (document.fullscreenEnabled === false ||
      document.webkitFullscreenEnabled === false) fullscreenBtn.remove();
    adjustWidth();
  }
  theCanvas.appendChild(createCanvas(ww,hh).canvas);
  adjustFaderSize();
  switch (clientType) {
    case ClientEdg: case ClientChrome: case ClientSafari:
      theCanvas.onwebkitfullscreenchange = fullscreenChanged; break;
    case ClientFF: theCanvas.onfullscreenchange = fullscreenChanged; break;
  }
  dateSlider.style.width = ww + "px";
  // Colors
  bgColor = color(32);
  textColor = color(255); axisColor = color(255); barColor = color(120);
  pointerColor = color(255,90,90); vaxColor = color(100,200,100,64);
  fader.style.background = bgColor.toString('#rrggbb');
  //
  // Default text scale
  textSize(24);
  const tw = textWidth("222,222");
  if (tw > 90) { txtScl = 90.0 / tw; }
  // Frame rate
  const frmRtStr = localStorage.getItem("速さ");
  runFrameRate = frmRtStr? parseInt(frmRtStr) : 20;
  document.getElementById("speed").children.forEach((elm) => {
    elm.selected = (elm.value == runFrameRate);
  });
  frameRate(60);
  // Index choice
  const idxStr = localStorage.getItem("指標");
  indexShown = idxStr? parseInt(idxStr) : -1;
  const sel = document.getElementById("choice");
  for (let i = -1; i < dataInfoList.length; i ++) {
    const elm = document.createElement("option");
    elm.value = i;
    if (i < 0) {
      elm.textContent = dataInfoList.length + "つの指標を巡回";
    } else {
      elm.textContent = dataInfoList[i].title + "患者数";
      dataInfoList[i]["element"] = elm;
    }
    if (i == indexShown) { elm.selected = true; }
    sel.appendChild(elm);
  }
  if (indexShown < 0) { indexShown = 0; indexCirculation = true; }
  // News categories
  const catNames = [], catList = {};
  for (let i = 0; i < newsTbl.getRowCount(); i ++) {
    const row = newsTbl.getRow(i);
    let cat = row.get(2); if (cat === undefined) { row.set(2, (cat = "その他")); } 
    if (catList[cat] == undefined) { catList[cat] = [i]; catNames.push(cat); }
    else { catList[cat].push(i); }
  }
  catNames.sort();
  const nCategories = catNames.length;
  for (let i = 0; i < nCategories; i ++) {
    const cat = catNames[nCategories - 1 - i];
    const cbox = document.createElement("input");
    cbox.type = "checkbox";
    cbox.id = "EventCat" + i;
    cbox.setAttribute("onchange", "configNewsList(); switchSetups('" + cat + "', this)");
    cbox.checked = defaultBoolValue(cat, true);
    configPanel.appendChild(cbox);
    const label = document.createElement("label");
    label.textContent = " " + cat + "(" + catList[cat].length + ") ";
    label.htmlFor = "EventCat" + i;
    configPanel.appendChild(label);
    if ((i + 1) % 2 == 0) { configPanel.appendChild(document.createElement("br")); }
    newsCategories.push({"name":cat, "indexes":catList[cat], "cbox":cbox});
    const hue = cl(float(i) / nCategories), sat = 50, lum = 80;
    newsCatColors[cat] = hsl2rgb(hue, sat, lum);
    label.style.setProperty("color", "hsl(" + hue + "turn " + sat + "% " + lum + "%)");
  }
  configNewsList();
  // Vaccination data
  vaxRowCnt = vaxTbl.getRowCount();
  vaxLastDate = dateToInt(vaxTbl.getString(vaxRowCnt - 1, 0));
  //
  setupForData(indexShown);
}
function setupForData(idx) {
  dataReady = false;
  dataInfo = dataInfoList[idx];
  graphTitle.textContent = "全国" + dataInfo.title + "患者数推移" + dataInfo.comment;
  tbl = loadTable("data/" + dataInfo.name + ".csv", "csv", "", setupAfterDataLoaded);
}
function setupAfterDataLoaded() {
  fgColor = color(dataInfo.color);
  const rowCnt = tbl.getRowCount(), newsCnt = newsTbl.getRowCount();
  periodSpan.textContent = tbl.getString(0, 0) + "〜" + tbl.getString(rowCnt - 1, 0);
  if (dateSlider.max != rowCnt - 1) {
    const newX = (indexCirculation && loopCheckBox.checked)? 1 :
      (x == 0)? rowCnt - 1 : max(1, int(x) + int(rowCnt - 1 - dateSlider.max));
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
  const dateTics = document.getElementById("DateTics");
  if (dateTics.replaceChildren) { dateTics.replaceChildren(); }
  else { while (dateTics.lastChild) { dateTics.removeChild(dateTics.lastChild); } }
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
  marks = [];
  for (let i = 0, idx = 0; i < newsCnt; i ++) {
    const dt = dateToInt(newsTbl.getString(i, 1));
    while (idx < rowCnt && dt > dateToInt(tbl.getString(idx, 0))) { idx ++; }
    if (idx < rowCnt) { marks.push({"y":tbl.getNum(idx, 1), "clm":idx}); }
  }
  maxLenForNum = numFmt.format(int(maxYs[maxYs.length - 1])).length;
  dataReady = true;
  if (running === null) { setRunning(indexCirculation && loopCheckBox.checked); }
  if (!running || fading > 0) { drawIt(); }
}
function draw() { // automatically called by p5js
  if (!dataReady) return;
  switch (fading) {
    case 1: fading = 2; fader.style.opacity = 1; return; // fading out
    case 2: fading = 3; fader.style.opacity = 0; // fading in
      jumpToStart(); drawIt(); return;
    case 3: fading = 4; frameRate(2); return; // stay still in half a second
    case 4: fading = 0; frameRate(60); stepCnt = 0; return;
  }
  xRevised = false;
  if (running) {
    if ((stepCnt ++) % (60 / runFrameRate) == 0) {
      if (x < tbl.getRowCount() - 1) {
        dateSlider.value = (++ x);
        xRevised = needsRedraw = true;
      } else if (loopCheckBox.checked) {
        fading = 1; frameRate(1); // stay still in one second
      } else { setRunning(false); }
    }
  } else { eventOffset = 0; }
  if (needsRedraw) drawIt();
}
function drawIt() {
  push();
  if (xDrawn != x) { drawGr(offScrGr); }
  image(offScrGr, 0, 0);
  const gw = ww - xoffset, gh = hh - yoffset, maxY = maxYs[x - 1];
  // events
  textSize(24.0 * scl * txtScl);
  strokeJoin(ROUND);
  let bottom = newsIdxs.length - 1;
  for (; bottom > 0; bottom --)
    { if (newsIdxs[bottom] < marks.length && marks[newsIdxs[bottom]].clm <= x) { break; } }
  const sclx = width / ww, scly = height / hh;
  const ptR = red(pointerColor), ptG = green(pointerColor), ptB = blue(pointerColor);
  if (x == marks[newsIdxs[bottom]].clm && xRevised) { eventOffset += 1.0; }
  else if (eventOffset > 1.0) { eventOffset *= 30.0/31.0; }
  else if (eventOffset > 0) { eventOffset -= 1.0/30.0; }
  else if (eventOffset < 0) { eventOffset = 0; }
  else { needsRedraw = false; }
  for (let cnt = 0; cnt <= bottom; cnt ++) {
    const y = height - (cnt + 0.3 - eventOffset) * 40 * scl;
    if (y <= 0) { break; }
    const alpha = (y > height - yoffset)? 0.4 : (y > height * 0.2)? 1.0 :
      (y > height * 0.15)? (y - height * 0.15) / (height * 0.05) * 0.6 + 0.4 : 0.4;
    const j = newsIdxs[bottom - cnt], col = newsCatColors[newsTbl.getString(j, 2)];
    fill(col.red, col.green, col.blue, 255 * alpha);
    stroke(0, 220 * alpha);
    strokeWeight(4 * scl);
    textAlign(RIGHT);
    text(newsTbl.getString(j, 1), width/2 - 360 * scl, y);
    textAlign(LEFT);
    text(newsTbl.getString(j, 0), width/2 - 340 * scl, y);
    const xr = (xoffset + marks[j].clm * gw / x) * sclx;
    const ym = (maxY - marks[j].y) / maxY * gh * scly;
    strokeWeight(1.5 * scl);
    noFill();
    if (alpha < 1.0) {
      stroke(ptR, ptG, ptB, 255 * alpha);
    } else { stroke(pointerColor); }
    const lineY = y + 8 * scl;
    line(width/2 - 340 * scl, lineY, xr, lineY);
    if (alpha < 1.0) { stroke(pointerColor); }
    line(xr, lineY, xr, ym);
    circle(xr, ym, 11 * scl);
  }
}
function drawGr(gr) {
  if (x < tbl.getRowCount()) {
    const dt = tbl.getString(x, 0).split("/"),
      numStr = numFmt.format(int(tbl.getNum(x, 1))),
      nSpcs = maxLenForNum - numStr.length + 1;
    let spcs = "";
    for (let i = 0; i < nSpcs; i ++) { spcs += "\xa0"; }
    dailyInfo.textContent =
      dt[0] + "/" + twoClmn(dt[1]) + "/" + twoClmn(dt[2]) +
      spcs + numStr + "人";
  }
  //
  gr.background(bgColor);
  if (!dataReady) { return; }
  const gw = ww - xoffset, gh = hh - yoffset, maxY = maxYs[x - 1];
  gr.push();
  gr.textSize(24.0 * scl * txtScl);
  gr.strokeJoin(ROUND);
  // axis lines
  gr.translate(0, height - 1);
  gr.scale(width / ww, -height / hh);
  gr.stroke(axisColor);
  gr.line(0, yoffset, ww - 1, yoffset);
  gr.line(xoffset, 0, xoffset, hh - 1);
  // graph
  gr.translate(xoffset, yoffset);
  gr.noStroke();
  gr.fill(fgColor);
  gr.beginShape();
  gr.vertex(0, 0);
  for (let i = 0; i <= x; i ++) {
    const y = tbl.getNum(i, 1);
    gr.vertex(i * gw / x, y * gh / maxY);
  }
  gr.vertex(gw, 0);
  gr.endShape(CLOSE);
  // vaccination
  if (x > vaxStartX && vaxCheckBox.checked) {
    gr.fill(vaxColor);
    const clmnCnt = vaxTbl.getColumnCount();
    for (let j = 1; j < clmnCnt; j ++) {
      gr.beginShape();
      for (let i = 0; i + vaxStartX <= x && i < vaxRowCnt; i ++) {
        gr.vertex((i + vaxStartX) * gw / x, vaxTbl.getNum(i, j) * gh / vaxMaxY);
      }
      gr.vertex(gw, 0);
      gr.endShape(CLOSE);
    }
  }
  // horizontal tics
  gr.fill(textColor);
  gr.noStroke();
  let sp = ticsSpan(x, 8);
  gr.push();
  gr.translate(0, yoffset / -2.0);
  gr.scale(1, -1);
  for (let i = sp / 2; i < x; i += sp) {
    gr.text(tbl.getString(int(i), 0), i * gw / (x - 1), 0);
  }
  gr.pop();
  // vertical tics
  sp = ticsSpan(maxY, 8);
  gr.translate(-5, 0);
  gr.textAlign(RIGHT);
  for (let i = sp; i < maxY; i += sp) {
    gr.push();
    gr.translate(0, i * gh / maxY);
    gr.scale(1, -1);
    gr.noStroke();
    gr.text(numFmt.format(i), 0, 5 * scl);
    gr.stroke(barColor);
    gr.line(0, 0, gw, 0);
    gr.pop();
  }
  gr.pop();
  xDrawn = x;
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
function chooseIndex(idx) {
  if (!(indexCirculation = (idx < 0))) { setupForData(indexShown = idx); }
  localStorage.setItem("指標", idx);
}
function setRunning(value) {
  if (running == value) { return; }
  if ((running = value)) {
    if (x >= tbl.getRowCount() - 1) { dateSlider.value = x = 1; }
    loop();
  } else { noLoop(); }
  startStopBtn.replaceChild(running? imgPause : imgPlay, startStopBtn.firstChild);
  document.getElementById("startStopToolTip").textContent
    = running? "停止" : "開始";
}
function startStop() {
  setRunning(!running);
}
function jumpToStart() {
  if (indexCirculation) {
    indexShown = (indexShown + 1) % dataInfoList.length;
    setupForData(indexShown);
  }
  stepCnt = 0;
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
function openPanel(pnl) {
  pnl.style.right = (isFullScreen()? 0 : margin) + "px";
  pnl.hidden = 0;
}
function closePanel(pnl) {
  pnl.hidden = 1;
}
function configNewsList() {
  newsIdxs = [];
  for (let item of newsCategories) {
    if (item.cbox.checked) { newsIdxs = newsIdxs.concat(item.indexes); }
  }
  newsIdxs.sort((a, b) => { return (a < b)? -1 : (a > b)? 1 : 0; });
}
function changeFrameRate(frmRt) {
  if (frmRt == runFrameRate) return;
  localStorage.setItem("速さ", runFrameRate = frmRt);
}
function switchSetups(name, cbox) {
  localStorage.setItem(name, cbox.checked);
  if (name == "ワクチン接種" && x > vaxStartX) drawGr(offScrGr);
  needsRedraw = true;
  drawIt();
}
function setDate(value) {
  x = value;
  if (!running && dataReady) { drawIt(); }
}
function adjustScaleAndOffset() {
    scl = ww / 1280.0;
    xoffset = 100 * scl; yoffset = 40 * scl;
    adjustFaderSize();
    graphTitle.style.top = int(20 * scl) + "px";
    dailyInfo.style.top = int(60 * scl) + "px";
    graphTitle.style.fontSize = dailyInfo.style.fontSize = int(32 * scl) + "px";
    graphTitle.style.WebkitTextStroke = dailyInfo.style.WebkitTextStroke =
      "black " + scl + "px";
    graphTitle.style.width = ww + "px";
}
function adjustFaderSize() {
    fader.style.width = ww + "px";
    fader.style.height = hh + "px";
    offScrGr = createGraphics(ww, hh);
}
function setupDimensionForSP() {
    ww = document.body.offsetWidth;
    hh = ww * 9.0 / 16.0;
    adjustScaleAndOffset();
}
function isFullScreen() {
  return (clientType == ClientFF)?
    (document.fullscreenElement !== null) : document.webkitIsFullScreen;
}
function adjustWidth() {
  switch (clientType) {
    case ClientIPhone: case ClientAndroid:
      setupDimensionForSP();
      resizeCanvas(ww, hh);
      dateSlider.style.width = ww + "px";
      drawIt();
      break;
    default:
      if (isFullScreen()) return;
      const orgWW = ww, orgMargin = margin;
      ww = document.body.offsetWidth - 20;
      if (ww > 1280) { ww = 1280; }
      else if (ww < 620) { ww = 620; }
      if (orgWW != ww) {
        hh = ww * 9 / 16;
        adjustScaleAndOffset();
        resizeCanvas(ww, hh);
        adjustFaderSize();
      }
      margin = (document.body.offsetWidth - ww) / 2;
      if (orgMargin != margin || orgWW != ww) {
        const lrs = document.getElementsByClassName("leftRight");
        lrs.forEach((x) => {
          x.style.display = "flex";
          x.style.justifyContent = "space-between";
          x.style.marginLeft = margin + "px";
          x.style.width = ww + "px";
        });
        if (document.getElementById("caption").offsetHeight > normalLineHeight)
          lrs.forEach((x) => { x.style.display = x.style.justifyContent = null; });
        fader.style.left = margin + "px";
        dateSlider.style.width = ww + "px";
      }
      if (orgWW != ww && dataReady) { drawGr(offScrGr); drawIt(); }
  }
}
function enterFullscreen() {
  if (theCanvas.requestFullScreen) theCanvas.requestFullScreen();
  else if (theCanvas.webkitRequestFullScreen) theCanvas.webkitRequestFullScreen();
  else if (theCanvas.mozRequestFullScreen) theCanvas.mozRequestFullScreen();
  else { alert("お使いのブラウザが全画面モードに対応していないようです。"); return; }
  displayWidth = screen.width;
  displayHeight = screen.height;
}
let fullScrMsg = null, fullScrMsgTimer = null;
function clearFullSctMsgTimer() {
    const intvl = fullScrMsgTimer;
    fullScrMsgTimer = null;
    clearInterval(intvl);
    fullScrMsg.style.opacity = "0";
}
function fullscreenChanged(event) {
  if (isFullScreen()) {
    resizeCanvas(ww = displayWidth, hh = displayHeight);
    adjustFaderSize();
    fader.style.left = 0;
    controller.style.position = dateSlider.style.position = "absolute";
    controller.style.top = controller.style.right = dateSlider.style.bottom = "0px";
    dateSlider.style.left = "20px";
    dateSlider.style.width = (ww - 40) + "px";
    controller.style.opacity = dateSlider.style.opacity = "0.2";
    controller.onmouseenter = dateSlider.onmouseenter
      = (event) => { event.target.style.opacity = 1; };
    controller.onmouseleave = dateSlider.onmouseleave
      = (event) => { event.target.style.opacity = 0.2; };
    fullscreenBtn.remove();
    periodSpan.style.color = textColor.toString("#rrggbb");
    theCanvas.insertBefore(configPanel, theCanvas.firstChild);
    theCanvas.appendChild(controller);
    theCanvas.appendChild(dateSlider);
    if (clientType == ClientEdg || clientType == ClientSafari) {
      fullScrMsg = document.getElementById("FullScrMsg");
      fullScrMsg.style.transition = null;
      fullScrMsg.style.opacity = "1";
      fullScrMsg.style.visibility = "visible";
      fullScrMsgTimer = setInterval(() => {
        fullScrMsg.style.transition = "opacity 1s ease-in"
        clearFullSctMsgTimer(); }, 4000);
    }
  } else {
    fader.style.left = margin + "px";
    controller.onmouseenter = controller.onmouseleave = null;
    dateSlider.onmouseenter = dateSlider.onmouseleave = null;
    controller.style.position = dateSlider.style.position = null;
    controller.style.opacity = dateSlider.style.opacity = "1";
    placeNode(cntrlOrigin);
    placeNode(sliderOrigin);
    placeNode(fulScrBtnOrigin);
    placeNode(cnfgPnlOrigin);
    closePanel(configPanel);
    periodSpan.style.color = null;
    if (fullScrMsgTimer != null) {
      fullScrMsg.style.transition = null;
      clearFullSctMsgTimer();
    }
  }
  adjustScaleAndOffset();
  drawGr(offScrGr);
  drawIt();
}
