class Tics {
  constructor(pt0, pt1, from, to, maxNTics) {
    this.pt0 = pt0;
    this.pt1 = pt1;
    this.from = from;
    this.to = to;
    this.maxNTics = maxNTics;
  }
  draw() {
    push();
    noFill(); stroke(Tics.lineColor);
    line(this.pt0.x, this.pt0.y, this.pt1.x, this.pt1.y);
    pop();
    const itvl = abs(this.to - this.from) / this.maxNTics;
    const ex = ceil(-Math.log10(itvl));
    let ix = pow(10, ex) * itvl;
    if (ix < 2) { ix = 2; }
    else if (ix < 5) { ix = 5; }
    else { ix = 10; }
    const frac = max(0, (ix < 10)? ex : ex - 1);
    ix *= pow(10, -ex);
    push();
    this.textEnv();
    for (let x = ix * ceil(this.from / ix); x < this.to; x += ix) {
      this.drawTic(x, frac);
    }
    pop();
  }
  setRange(rng, adj) {
    const low = adj? rng.l : 0, mrgn = (rng.u - low) / 20;
    this.from = max(0, low - mrgn);
    this.to = rng.u + mrgn;
  }
}
Tics.ticSize = 6;
Tics.lineColor = 0;
Tics.gridColor = 70;
class HTics extends Tics {
  drawTic(x, frac) {
    const px = this.pt0.x + (x - this.from) *
      (this.pt1.x - this.pt0.x) / (this.to - this.from);
    push();
    noFill(); stroke(Tics.lineColor);
    line(px, this.pt0.y, px, this.pt0.y + Tics.ticSize);
    stroke(Tics.gridColor);
    line(px, this.pt0.y, px, Margin.top);
    noStroke(); fill(Tics.lineColor);
    text(x.toFixed(frac), px, this.pt0.y + 16);
    pop();
  }
  textEnv() { textAlign(CENTER); }
}
class VTics extends Tics {
  drawTic(y, frac) {
    const py = this.pt0.y + (y - this.from) *
      (this.pt1.y - this.pt0.y) / (this.to - this.from);
    push();
    noFill(); stroke(Tics.lineColor);
    line(this.pt0.x, py, this.pt0.x - Tics.ticSize, py);
    stroke(Tics.gridColor);
    line(this.pt0.x, py, CWidth - Margin.right, py);
    noStroke(); fill(Tics.lineColor);
    text(y.toFixed(frac), this.pt0.x - 7, py + 4);
    pop();
  }
  textEnv() { textAlign(RIGHT); }
}
