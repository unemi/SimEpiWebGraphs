const refNames = ["男性","女性","合計"];

function makeOption(value, txt) {
	const elm = document.createElement("option");
	elm.value = value;
	elm.textContent = txt;
	if (value == 0) elm.selected = true;
	return elm;
}
function setup() {
	const sxSel = document.getElementById("sex");
	let sxNum = 0;
	for (const e of refNames) {
		let elm;
		if (e.charAt == undefined) {
			elm = document.createElement("optgroup");
			elm.label = e[0];
			for (let i = 1; i < e.length; i ++)
				elm.appendChild(makeOption(sxNum ++, e[i])); 
		} else elm = makeOption(sxNum ++, e);
		sxSel.appendChild(elm);
	}
}
function selectSex(sxNum) {
	const fname = sxNum + ".svg";
	for (const e of document.getElementById("ageGraphs").children)
		e.src = e.src.replace(/[0-9].svg/, fname);
}