#! /bin/bash
if [ -z $1 ]; then nPref=12; else nPref=$1; fi
ed=22
tl=`tail -1 nhk_pref_weekly/04宮城県.csv | cut -f1`
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
xmarks="${arr[*]}"
LANG=ja_JP.UTF-8
gnuplot > $1.svg <<EOF
set terminal svg size 640 300
set key left
set style data lines
set ylabel "test positive (%)"
set xrange [$2:]
set yrange [$4:$5]
N = 47
set xtics ($xmarks)
array fnames[N] = [ "01北海道", "02青森県", "03岩手県", "04宮城県", "05秋田県", "06山形県", "07福島県", "08茨城県", "09栃木県", "10群馬県", "11埼玉県", "12千葉県", "13東京都", "14神奈川県", "15新潟県", "16富山県", "17石川県", "18福井県", "19山梨県", "20長野県", "21岐阜県", "22静岡県", "23愛知県", "24三重県", "25滋賀県", "26京都府", "27大阪府", "28兵庫県", "29奈良県", "30和歌山県", "31鳥取県", "32島根県", "33岡山県", "34広島県", "35山口県", "36徳島県", "37香川県", "38愛媛県", "39高知県", "40福岡県", "41佐賀県", "42長崎県", "43熊本県", "44大分県", "45宮崎県", "46鹿児島県", "47沖縄県" ]
array rnames[N] = [ "Hokkaido", "Aomori", "Iwate", "Miyagi", "Akita", "Yamagata", "Fukushima", "Ibaraki", "Tochigi", "Gunma", "Saitama", "Chiba", "Tokyo", "Kanagawa", "Niigata", "Toyama", "Ishikawa", "Fukui", "Yamanashi", "Nagano", "Gifu", "Shizuoka", "Aichi", "Mie", "Shiga", "Kyoto", "Oosaka", "Hyogo", "Nara", "Wakayama", "Tottori", "Shimane", "Okayama", "Hiroshima", "Yamaguchi", "Tokushima", "Kagawa", "Ehime", "Kouchi", "Fukuoka", "Saga", "Nagasaki", "Kumamoto", "Ooita", "Miyazaki", "Kagoshima", "Okinawa" ]
array psize[N] = [ $xpopSz ]
M = $npl
array pl[M] = [ `echo ${pList[@]} | awk '{for(i=1;i<=NF;i++)printf "%d%s",$i,(i<NF)?", ":"\n"}'` ]
if ("$3" eq "logscale") { set logscale y }
cl(x) = (x < .5)? x * 2. / 3. : (x < 5. / 8.)? x * 8. / 3. - 1. : x * 2. / 3. + 1. / 4
plot for [i=1:M] sprintf("nhk_pref_weekly/%s.csv",fnames[pl[i]])\
 using (\$1 - $dd):(\$2 / psize[pl[i]] * 0.1) lw 2 lc rgb hsv2rgb(cl((i-1.)/(M-1)*7./8.),1.,0.67)\
 title rnames[pl[i]]
EOF
}
makeRegPlot () {
pList=()
for ((x=$1;x<=$2;x++)); do pList+=($x); done
# echo makePlot nhk_pref_$3 $fd logscale ${rng[0]} ${rng[1]}
makePlot nhk_pref_$3 $fd logscale ${rng[0]} ${rng[1]}
}
cd nhk_pref_weekly
pAsn=`echo ${popSz[@]} | awk '{for(i=1;i<=NF;i++)printf "p[\"%02d\"]=%s;",i,$i}'`
awk 'BEGIN{'$pAsn'}\
$1=='$tl'{idx=substr(FILENAME,1,2);split(FILENAME,fnm,".");\
printf "%.3f %d %s\n",$2/p[idx],idx,substr(fnm[1],3,99)}'\
 [0-4][0-9]*.csv | sort -nr | head -$nPref > /tmp/nhk_plot_$$
pList=(`awk '{print $2}' /tmp/nhk_plot_$$`)
awk '{printf "%s%s",$3,(NR<'$nPref')?" ":"\n"}' /tmp/nhk_plot_$$
rm -f /tmp/nhk_plot_$$
fd=$((tl-316-ed-30))
rng=(`echo ${popSz[@]} | awk 'NR==1{xl=1e10;xu=-1e10;for(i=1;i<=NF;i++)ps[i]=$i;k=1}
NR>1 && FNR==1{p=ps[k++]}
NR>1 && $1>'$((tl-30))'{x=$2/p*0.1;if(x>0 && x<xl)xl=x;if(x>xu)xu=x}
END{print xl,xu}' - [0-4][0-9]*.csv`)
cd ..
makePlot nhk_pref 1 linear
makePlot nhk_pref_log 1 logscale
makePlot nhk_pref_L $fd linear
makePlot nhk_pref_L_log $fd logscale 0.015 0.1
#
makeRegPlot 1 7 HkdThk
makeRegPlot 8 14 Kanto
makeRegPlot 15 23 Chubu
makeRegPlot 24 30 Kinki
makeRegPlot 31 39 CgkSkk
makeRegPlot 40 47 KysOknw
pList=(1 17 26 42 44 47)
makePlot nhk_pref_UP $fd logscale 0.01 0.1
