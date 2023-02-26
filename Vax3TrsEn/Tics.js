// Javascript library to draw axises and tics.
// by Tatsuo Unemi, Soka University, Nov. 2022.
function line(x1, y1, x2, y2) {
    ctx.beginPath();
    ctx.moveTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.stroke();
}
class Tics {
  constructor(pt0, pt1, from, to, maxNTics) {
    this.pt0 = pt0;
    this.pt1 = pt1;
    this.from = from;
    this.to = to;
    this.maxNTics = maxNTics;
  }
  draw() {
    ctx.save();
    ctx.strokeStyle = Tics.lineColor;
    line(this.pt0.x, this.pt0.y, this.pt1.x, this.pt1.y);
    ctx.restore();
    const itvl = Math.abs(this.to - this.from) / this.maxNTics;
    const ex = Math.ceil(-Math.log10(itvl));
    let ix = Math.pow(10, ex) * itvl;
    if (ix < 2) { ix = 2; }
    else if (ix < 5) { ix = 5; }
    else { ix = 10; }
    const frac = Math.max(0, (ix < 10)? ex : ex - 1);
    ix *= Math.pow(10, -ex);
    ctx.save();
    this.textEnv();
    for (let x = ix * Math.ceil(this.from / ix); x < this.to; x += ix) {
      this.drawTic(x, frac);
    }
    ctx.restore();
  }
  setRange(rng, adj) {
    const low = adj? rng.l : 0, mrgn = (rng.u - low) / 20;
    this.from = Math.max(0, low - mrgn);
    this.to = rng.u + mrgn;
  }
}
Tics.ticSize = 6;
Tics.lineColor = "#000";
Tics.gridColor = "#b3b3b3";
class HTics extends Tics {
  drawTic(x, frac) {
    const px = this.pt0.x + (x - this.from) *
      (this.pt1.x - this.pt0.x) / (this.to - this.from);
    ctx.save();
    ctx.strokeStyle = Tics.lineColor;
    line(px, this.pt0.y, px, this.pt0.y + Tics.ticSize);
    ctx.strokeStyle = Tics.gridColor;
    line(px, this.pt0.y, px, Margin.top);
    ctx.fillStyle = Tics.lineColor;
    ctx.fillText(x.toFixed(frac), px, this.pt0.y + 16);
    ctx.restore();
  }
  textEnv() { ctx.textAlign = "center"; }
}
class VTics extends Tics {
  drawTic(y, frac) {
    const py = this.pt0.y + (y - this.from) *
      (this.pt1.y - this.pt0.y) / (this.to - this.from);
    ctx.save();
    ctx.strokeStyle = Tics.lineColor;
    line(this.pt0.x, py, this.pt0.x - Tics.ticSize, py);
    ctx.strokeStyle = Tics.gridColor;
    line(this.pt0.x, py, CWidth - Margin.right, py);
    ctx.fillStyle = Tics.lineColor;
    ctx.fillText(y.toFixed(frac), this.pt0.x - 7, py + 4);
    ctx.restore();
  }
  textEnv() { ctx.textAlign = "right"; }
}
