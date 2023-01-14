#! /bin/bash
fnm=newly_confirmed_cases_daily.csv
fnmw=newly_confirmed_cases_weekly.csv
./getFileIfNew.sh https://covid19.mhlw.go.jp/public/opendata/$fnm
if [ $? -ne 0 ]; then exit; fi
awk -F, 'NR==1{for(i=1;i<NF;i++)printf "%s,",$i;
print substr($NF,1,length($NF)-1);
n=idx=0;for(i=2;i<=NF;i++)s[i]=0}
NR>1{ printf "%s", $1;
for(i=2;i<=NF;i++) { j = i * 7 + idx;
 if (n < 7) { nn = n + 1; s[i] += $i }
 else { nn = n; s[i] += $i - v[j] }
 v[j] = $i; printf ",%.4f", s[i] / nn} print "";
 idx = (idx + 1) % 7; if (n < 7) n ++ }' $fnm > $fnmw
# echo "Prefectural data were renewed."
nPref=20
ed=22
tl=`awk 'END{print NR-1}' $fnm`
popSz=(5382.0 1308.0 1280.0 2334.0 1023.0 1124.0 1914.0 2917.0 1974.0 1973.0 7267.0 6223.0\
 13515.0 9126.0 2304.0 1066.0 1154.0 787.0 835.0 2099.0 2032.0 3700.0 7483.0 1816.0 1413.0\
 2610.0 8839.0 5535.0 1364.0 964.0 573.0 694.0 1922.0 2844.0 1405.0 756.0 976.0 1385.0\
 728.0 5102.0 833.0 1377.0 1786.0 1166.0 1104.0 1648.0 1434.0)
xpopSz=`echo ${popSz[@]} | awk '{for(i=1;i<=NF;i++)printf " %s%s",$i,(i<NF)?",":" "}'`
makePlot () {
local npl=${#pList[@]}
local dd=$((316+ed))
LANG=C
local tspan=$(((tl-dd-$2)/5))
declare -a arr
for ((x=0;x<6;x++)); do local d=$((x*tspan+tspan/2+$2))
arr[$x]=\"`date -j -v+${d}d 121901002020 "+%b %e" | sed 's/  / /'`\"" $d,"
done
local xmarks="${arr[@]}"
local xpl=`echo ${pList[@]} | awk '{for(i=1;i<=NF;i++)printf "%d%s",$i,(i<NF)?", ":"\n"}'`
LANG=ja_JP.UTF-8
gnuplot > $1.svg <<EOF
set terminal svg size 640 300
set datafile separator ","
set datafile columnheader
set key left
set style data lines
set ylabel "test positive (%)"
set xrange [$2:]
set yrange [$4:$5]
set xtics ($xmarks)
N = 47
array psize[N] = [ $xpopSz ]
M = $npl
array pl[M] = [ $xpl ]
if ("$3" eq "logscale") { set logscale y }
cl(x) = (x < .5)? x * 2. / 3. : (x < 5. / 8.)? x * 8. / 3. - 1. : x * 2. / 3. + 1. / 4
plot for [i=1:M] '$fnmw'\
 using (\$0 - $dd):(column(pl[i] + 2) / psize[pl[i]] * 0.1)\
 lw 2 lc rgb hsv2rgb(cl((i-1.)/(M-1)*7./8.),1.,0.67) t columnhead(pl[i] + 2)
EOF
}
makeRegPlot () {
pList=()
for ((x=$1;x<=$2;x++)); do pList+=($x); done
# echo makePlot mhlw_pref_$3 $fd logscale ${rng[0]} ${rng[1]}
makePlot mhlw_pref_$3 $fd logscale ${rng[0]} ${rng[1]}
}
echo ${popSz[@]} | \
awk -F, 'NR==1{n=split($0,a," ");for(i=1;i<=n;i++)ps[i+2]=a[i]}
END{for(i=3;i<=NF;i++)printf "%.4f %d\n",$i/ps[i],i-2}' - $fnmw | \
sort -nr | awk 'NR<='$nPref'{print $2}' > /tmp/mhlw_$$.txt
pList=(`cat /tmp/mhlw_$$.txt`); rm /tmp/mhlw_$$.txt
fd=$((tl-316-ed-30))
rng=(`echo ${popSz[@]} | \
awk -F, 'NR==1{xl=1e10;xu=-1e10;n=split($0,a," ");for(i=1;i<=n;i++)ps[i+2]=a[i]}
FNR>'$((tl+1-30))'{for(i=3;i<=NF;i++){x=$i/ps[i]*0.1;if(x>0 && x<xl)xl=x;if(x>xu)xu=x}}
END{print xl,xu}' - $fnmw`)
#
makePlot mhlw_pref 1 linear
makePlot mhlw_pref_log 1 logscale
makePlot mhlw_pref_L $fd linear
makePlot mhlw_pref_L_log $fd logscale 0.015 0.1
#
makeRegPlot 1 7 HkdThk
makeRegPlot 8 14 Kanto
makeRegPlot 15 23 Chubu
makeRegPlot 24 30 Kinki
makeRegPlot 31 39 CgkSkk
makeRegPlot 40 47 KysOknw
