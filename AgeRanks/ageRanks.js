const refNames = ["全国","北海道",
["東北","青森県","岩手県","宮城県","秋田県","山形県","福島県"],
["関東","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県"],
["中部","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県"],
["近畿","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県"],
["中国","鳥取県","島根県","岡山県","広島県","山口県"],
["四国","徳島県","香川県","愛媛県","高知県"],
["九州","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県"],
"沖縄県"];

function makeOption(value, txt) {
	const elm = document.createElement("option");
	elm.value = value;
	elm.textContent = txt;
	if (value == 0) elm.selected = true;
	return elm;
}
function setup() {
	const prefSel = document.getElementById("pref");
	let prefNum = 0;
	for (const e of refNames) {
		let elm;
		if (e.charAt == undefined) {
			elm = document.createElement("optgroup");
			elm.label = e[0];
			for (let i = 1; i < e.length; i ++)
				elm.appendChild(makeOption(prefNum ++, e[i])); 
		} else elm = makeOption(prefNum ++, e);
		prefSel.appendChild(elm);
	}
}
function selectPref(prefNum) {
	const fname = ((prefNum < 10)? "0" : "") + prefNum + ".svg";
	for (const e of document.getElementById("ageGraphs").children)
		e.src = e.src.replace(/[0-4][0-9].svg/, fname);
}