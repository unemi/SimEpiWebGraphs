#! /bin/bash
if [ ! -f tky_patients.sh ]
then cd /Users/unemi/Research/SimEpidemicPJ/内閣府PJ/統計データ
fi
fnm=130001_tokyo_covid19_details_testing_positive_cases.csv
./getFileIfNew.sh https://stopcovid19.metro.tokyo.lg.jp/data/$fnm
if [ $? -ne 0 ]; then exit; fi
awk -F, 'NR==1{printf "\"%s\" \"%s\" \"%s\" \"%s\" \"%s\" \"%s\" \"%s\" \"%s\"\n",\
 $4,"陽性者数",$7,$8,$9,$10,$11,$12}\
NR==293{tp=$5;dd=$12}\
NR>293{split($4,a,"-");printf "%d/%02d/%02d %d %d %d %d %d %d %d\n",\
 a[1],a[2],a[3],$5-tp,$7,$8,$9,$10,$11,$12-dd;tp=$5;dd=$12}' $fnm > tky_patients.csv
tl=`awk 'END{print NR-2}' tky_patients.csv`
makeXMarks () {
# LANG=C
local tspan=$((($2-$1)/5))
declare -a arr
for ((x=0;x<6;x++)); do local d=$((x*tspan+tspan/2+$1))
arr[$x]=\"`date -j -v+${d}d 121601002020 "+%x"`\"" $d,"
done
xmarks="${arr[*]}"
# LANG=ja_JP.UTF-8
}
makePlot () {
local dd=$((316+ed))
local fr=$2
local to=$tl
if [ -z "$fr" ]; then fr=0; fi
if [ ! -z "$3" ]; then to=$3; fi
makeXMarks $fr $to
gnuplot > tky_patients_$1$2.svg <<EOF
set terminal svg size 720 300
set key outside
set style data filledcurves x1
set xrange [$2:$to]
set xtics ($xmarks)
set xlabel "東京都 新型コロナウイルス感染症重症患者数 のデータより作成\nhttps://catalog.data.metro.tokyo.lg.jp/dataset/t000010d0000000090"
if ("$1" eq "log") { set logscale y }
else { set yrange [0:] }
set key autotitle columnheader
plot 'tky_patients.csv' using 0:(\$3+\$4+\$5+\$6+\$7) fc rgb "#8888ff",\
 '' using 0:(\$3+\$4+\$5+\$6) fc rgb "#88ffaa",\
 '' using 0:(\$3+\$4+\$5) fc rgb "#eeee88",\
 '' using 0:(\$3+\$4) title columnhead(3) fc rgb "#ffaa88",\
 '' using 0:(\$4) fc rgb "#ff4444",\
 '' using 0:(\$8)  with lines lw 2 lc rgb "#666666",\
 '' using 0:(\$2*3) title "新規陽性 x3" with lines
EOF
}
rm -f tky_patients*.svg
makePlot lnr
makePlot log
makePlot lnr 360
# makePlot lnr 191 290
makePlot log 360
# makePlot log 191 290

fr=170
makeXMarks $fr $tl
gnuplot > tky_patients_h.svg <<EOF
set terminal svg size 640 300
set key right
set style data lines
set xrange [$fr:$tl]
set xtics ($xmarks)
set xlabel "東京都 新型コロナウイルス感染症重症患者数 のデータより作成\nhttps://catalog.data.metro.tokyo.lg.jp/dataset/t000010d0000000090"
plot 'tky_patients.csv' using 0:(\$3+\$4) title "入院患者数" lw 2,\
 '' using 0:(\$4*10) title "重症者数 x 10" lw 2,\
 '' using 0:((\$3+\$4+\$5+\$6+\$7)/10) title "全患者数 x 0.1" lw 2
EOF
exit
hd=("?" `head -1 tky_patients.csv`)
makePlot2 () {
gnuplot > tky_patientsR_$1.svg <<EOF
set terminal svg size 720 300
set key left
set style data filledcurves x1
set xrange [1:$tl]
plot 'tky_patients.csv' using 0:(\$$1/(\$3+\$4+\$5+\$6+\$7))\
 title ${hd[$1]} with lines
EOF
}
# makePlot2 4
# makePlot2 3