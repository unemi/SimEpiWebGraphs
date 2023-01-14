#! /bin/bash
if [ ! -f tky_tests.sh ]
then cd /Users/unemi/Research/SimEpidemicPJ/内閣府PJ/統計データ
fi
fnm=130001_tokyo_covid19_positivity_rate_in_testing.csv
./getFileIfNew.sh https://stopcovid19.metro.tokyo.lg.jp/data/$fnm
if [ $? -ne 0 ]; then exit; fi
awk -F, 'NR==1{printf "\"%s\" \"%s\" \"%s\" \"%s\" \"%s\"\n",$4,$5,$6,$7,$8,$10}\
NR>306{split($4,a,"-");t=$5+$6+$7+$8;printf "%d/%02d/%02d %d %d %d %d %.3f\n",\
 a[1],a[2],a[3],$5,$6,$7,$8,(t<=0)?0:($5+$6)/t*100}' $fnm > tky_tests.csv
tl=`awk 'END{print NR-1}' tky_tests.csv`
#
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
#
makeXMarks 1 $tl
gnuplot > tky_tests.svg <<EOF
set terminal svg size 720 300
set key left
set style data filledcurves x1
set xrange [1:$tl]
set xtics ($xmarks)
set ytics nomirror
set y2tics
set y2label "positive rate (%)"
plot 'tky_tests.csv' using 0:(\$2+\$3+\$4+\$5) title "AgT-" fc rgb "#8888ff",\
 '' using 0:(\$2+\$3+\$4) title "PCR-" fc rgb "#88ffaa",\
 '' using 0:(\$2+\$3) title "AgT\\+" fc rgb "#eeee88",\
 '' using 0:(\$2) title "PCR\\+" fc rgb "#ffaa88",\
 '' using 0:(\$6) axis x1y2 title "positive rate (%)" with lines lc rgb "#880000"
EOF
#
makeXMarks $((tl-60)) $tl
gnuplot > tky_tests_recent.svg <<EOF
set terminal svg size 720 300
set key left
set style data filledcurves x1
set xrange [$((tl-60)):$tl]
set y2range [0:]
set xtics ($xmarks)
set ytics nomirror
set y2tics
set y2label "positive rate (%)"
plot 'tky_tests.csv' using 0:(\$2+\$3+\$4+\$5) title "AgT-" fc rgb "#8888ff",\
 '' using 0:(\$2+\$3+\$4) title "PCR-" fc rgb "#88ffaa",\
 '' using 0:(\$2+\$3) title "AgT\\+" fc rgb "#eeee88",\
 '' using 0:(\$2) title "PCR\\+" fc rgb "#ffaa88",\
 '' using 0:(\$6) axis x1y2 title "positive rate (%)" with lines lw 2 lc rgb "#880000"
EOF
