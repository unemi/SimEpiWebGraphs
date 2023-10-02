// June 13, 2023, by T. Unemi
// modified on September 26, 2023, by T. Unemi
const areaList = {'':2, '東北':6, '関東':7, '中部':9, '近畿':7, '中国・四国':9, '九州・沖縄':8}
const checkBoxes = {}, prfToDraw = {}, prfList = [], ranking = [], cboxList = []
const numFmt = new Intl.NumberFormat('en-US', { maximumFractionDigits:3, useGrouping:false })
let nationWideCBox, svg, svgRect, readyFlag = 0
let xStart = 18, xEnd = xStart + 2
function setup() {
	const info = document.getElementById('info')
	info.appendChild(new Text(dataInfo + 'まで'))
	if (typeof byMHLW == 'boolean') {
		info.appendChild(document.createElement('br'))
		const moreInfo = document.createElement('span')
		moreInfo.innerHTML = '(最新データは<a href='
+ '"https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000121431_00438.html"'
+ '>新型コロナウイルス感染症に関する報道発表資料</a>より)'
		info.appendChild(moreInfo)
	}
	for (const prfName in data) prfList.push(prfName)
	const swtbl = document.getElementById('swTable')
	let idx = 0
	for (const a in areaList) {
		const rec = document.createElement('tr')
		let btns;
		if (a == '') {
			rec.innerHTML = '<td></td><td style="display:flex;justify-content:space-between">'
				+ '<span></span><button onclick="resetSelection()">リセット</button></td>'
			btns = rec.lastElementChild.firstElementChild
		} else {
			rec.innerHTML = `<td class="btnClm"><button onclick="areaSelect(this)">${a}`
				+ '</button></td><td></td>'
			btns = rec.lastElementChild
		}
		for (let i = 0; i < areaList[a]; i ++) btns.innerHTML +=
			'<input type="checkbox" onchange="changeSelection([this])"/><span>' + prfList[idx ++] + '</span> '
		swtbl.appendChild(rec)
		if (a != '') checkBoxes[a] = btns.getElementsByTagName('input')
		else {
			nationWideCBox = btns.getElementsByTagName('input')[0]
			nationWideCBox.checked = true
			prfToDraw[prfList[0]] = nationWideCBox.nextSibling
		}
		for (const cbox of btns.getElementsByTagName('input')) cboxList.push(cbox)
	}
//
	cboxList.reverse()
	svg = document.getElementsByTagName('svg')[0]
	svgRect = svg.viewBox.baseVal
	xEnd = data[prfList[0]].length
	idx = 47
	if (xEnd > 1) for (const prfName in data) {
		const vList = data[prfName]
		ranking.push([prfName, vList[xEnd-1], vList[xEnd-1] / vList[xEnd-2], idx--])
	}
	makeRanking()
	drawGraph()
}
function makeRanking() {
	const rnkTbl = document.getElementById('rank')
	const elms = rnkTbl.getElementsByTagName('tbody')
	for (let i = elms.length - 1; i > 0; i --) elms[i].remove()
	const idx = {'最新値':1,'前週比':2,'地域':3}[document.getElementById('orderIdx').value]
	const dir = (document.getElementById('orderDir').value == '降順')? 1 : -1
	ranking.sort((a,b)=>{return ((a[idx]<b[idx])?1:(a[idx]>b[idx])?-1:0)*dir})
	const fmt = new Intl.NumberFormat('en-US', { maximumFractionDigits:2, minimumFractionDigits:2 })
	let rank = 1
	for (const row of ranking) rnkTbl.innerHTML +=
		`<tr><td>${rank++}</td><td>${row[0]}</td><td>${fmt.format(row[1])}</td><td>${fmt.format(row[2])}</td></tr>`
}
function ticsSpan(low, up) {
	const span = (up - low) / 8, expt = Math.pow(10.0,Math.floor(Math.log10(span))), s = span / expt
	return ((s < 2)? 1 : (s < 5)? 2 : 5) * expt
}
function drawGraph() {
	const elms = svg.getElementsByClassName('temp')
	for (let i = elms.length - 1; i >= 0; i --) elms[i].remove()
	let nPrfs = 0, idx = 0, maxV = 0
	const prfs = []
	for (const prfName of prfList) if (prfToDraw[prfName] != undefined) {
		nPrfs ++; prfs.push(prfName)
		const vList = data[prfName]
		for (let i = xStart; i < xEnd; i ++) if (maxV < vList[i]) maxV = vList[i]
	}
	const xOffset = 40, yOffset = 30, yBase = svgRect.height - yOffset
	let yTicLabels = '', xTicLabels = '', grid = '<path class="temp" stroke="#ccc" d="',
		d = `<path class="temp" d="M0,${yBase}l${svgRect.width},0M${xOffset},0l0,${svgRect.height}`
	if (maxV > 0) {
		const yTicSpan = ticsSpan(0, maxV), xTicSpan = Math.max(1, ticsSpan(xStart, xEnd - 1))
		for (let y = yTicSpan; y <= maxV; y += yTicSpan) {
			const yy = (maxV - y) * yBase / maxV, yyDgts = numFmt.format(yy)
			d += `M${xOffset-10},${yyDgts}l10,0`
			yTicLabels += `<text x="${xOffset-12}" y="${numFmt.format(yy+5)}">${y}</text>`
			grid += `M${xOffset},${yyDgts}l${svgRect.width-xOffset},0`
		}
		for (let x = Math.ceil((xStart+1) / xTicSpan) * xTicSpan; x < xEnd - 1; x += xTicSpan) {
			const xx = (x - xStart) * (svgRect.width - xOffset) / (xEnd - xStart - 1) + xOffset
			d += `M${xx},${yBase}l0,10`
			xTicLabels += `<text x="${xx}" y="${yBase+22}">${x+1}</text>`
			grid += `M${xx},0l0,${yBase}`
		}
	}
	svg.innerHTML += d + '"/>' + grid + '"/><g class="temp" stroke="none" fill="black"><g text-anchor="end">'
		+ yTicLabels + '</g><g text-anchor="middle">' + xTicLabels + '</g></g>'
	const dx = (svgRect.width - xOffset) / (xEnd - xStart - 1)
	let svgG = '<g class="temp">'
	for (const prfName of prfs) {
		const vList = data[prfName]
		let d = ''
		for (let i = xStart; i < xEnd; i ++)
			d += ((d=='')?'M':'L') + numFmt.format((i-xStart)*dx+xOffset)
				+ ',' + numFmt.format((maxV-vList[i])*yBase/maxV)
		const col = `hsl(${numFmt.format((idx++)*330/nPrfs)},80%,33%)`
		svgG += `\n<path stroke="${col}" d="${d}"/>`
		prfToDraw[prfName].style = `color:${col}`
	}
	svg.innerHTML += svgG + '\n</g>'
}
function areaSelect(btn) {
	const cboxes = checkBoxes[btn.textContent]
	let turnOn = false
	for (const cbox of cboxes)
		if (cbox.checked == false) { turnOn = true; break }
	for (const cbox of cboxes) cbox.checked = turnOn
	changeSelection(cboxes)
}
function changeSelection(cboxes) {
	for (const cbox of cboxes) {
		const prfName = cbox.nextSibling.textContent
		prfToDraw[prfName] = cbox.checked? cbox.nextSibling : undefined
		cbox.nextSibling.style = undefined
	}
	drawGraph()
}
function resetSelection() {
	const cboxes = [];
	for (const cbox of cboxList) {
		if (cbox === nationWideCBox) {
			if (!cbox.checked) { cbox.checked = true;  cboxes.push(cbox) }
		} else if (cbox.checked) { cbox.checked = false;  cboxes.push(cbox) }
	}
	changeSelection(cboxes)
}
function drawTopN() {
	const n = document.getElementById('topN').value
	const idxes = [], chngCboxs = []
	for (let i = 0; i < n; i ++) idxes.push(ranking[i][3])
	for (let i = 0; i < cboxList.length; i ++)
	if (cboxList[i].checked == (idxes.indexOf(i) == -1)) {
		cboxList[i].checked = !cboxList[i].checked;
		chngCboxs.push(cboxList[i])
	}
	changeSelection(chngCboxs)
}
function copySVG() {
	const svgs = document.getElementsByTagName('svg')
	navigator.clipboard.writeText(svgs[0].outerHTML)
}