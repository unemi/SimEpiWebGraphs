#! /bin/bash
collectData() {
./getFileIfNew.sh https://stopcovid19.metro.tokyo.lg.jp/data/$fn
if [ $? -ne 0 ]; then return 1; fi
awk -F, 'function outv() {\
	for(j=1; j<=m; j++) printf "%d,",c[a[j]];\
	s=0;for(j=1;j<=m;j++){s+=c[a[j]];printf "%d%s",s,(j<m)?",":"\n"}\
}\
BEGIN{a[1]="10歳未満";m='$M';a[m]="100歳以上";for(i=2;i<m;i++)a[i]=(i-1)*10 "代";dt="";\
for(j=1;j<=m;j++)printf "%s,",a[j];for(j=1;j<m;j++)printf "%s,",a[j];print a[m]}\
NR>1 && $9 != "-"{\
	if(dt != $5) {\
		if(dt != "") outv();\
		dt=$5;for(j=1;j<=m;j++)c[a[j]]=0\
	} c[$9]++\
}\
END{outv()}' $fn > $1
}
#
if [ ! -f tky_ages.sh ]
then cd /Users/unemi/Research/SimEpidemicPJ/内閣府PJ/統計データ
fi
M=11
prevCsv=tky_ages_2022_0.csv
fn=130001_tokyo_covid19_patients_2022.csv
if [ ! -f $prevCsv ]; then collectData $prevCsv; fi
fn=130001_tokyo_covid19_patients_2022-1.csv
collectData tky_ages_tmp2.csv
if [ $? -ne 0 ]; then exit; fi
#
prevNR=`awk 'END{print NR}' $prevCsv`
awk '{if(NR<'$prevNR')print;else print > "tky_ages_tmp1.csv"}' $prevCsv > tky_ages.csv
awk -F, 'NR==1{for(i=1;i<=NF;i++)v[i]=$i}\
NR>1 && FNR==2{for(i=1;i<=NF;i++)printf "%d%s",$i+v[i],(i<NF)?",":"\n"}\
FNR>2{print}' tky_ages_tmp1.csv tky_ages_tmp2.csv >> tky_ages.csv
rm -f tky_ages_tmp[12].csv
awk -F, 'NR==1{print}\
NR>1{for(i=1;i<=NF;i++)printf "%.4f%s",$i*100/$NF,(i<NF)?",":"\n"}'\
 tky_ages.csv > tky_ages_rate.csv
#
tl=`awk 'END{print NR-2}' tky_ages.csv`
fr=$((tl-30))
makeXMarks () {
# LANG=C
local tspan=$((($2-$1)/5))
declare -a arr
for ((x=0;x<6;x++)); do local d=$((x*tspan+tspan/2+$1))
arr[$x]=\"`date -j -v+${d}d 123101002021 "+%x"`\"" $d,"
done
xmarks="${arr[*]}"
# LANG=ja_JP.UTF-8
}
makeXMarks $fr $tl
#
makePlot () {
if [ "$2" = "cum" ]; then CM=fc; else CM="lw 2 lc"; fi
gnuplot > $1.svg <<EOF
set terminal svg size 720 300
if ("$2" eq "cum") {
	set style data filledcurves x1
	C1=$((M*2)); C2=$((M+1)); CS=.5; CV=1.
} else {
	set style data lines
	C1=$M; C2=1; CS=1.; CV=.5
}
set key outside autotitle columnheader
set datafile separator comma
set xrange [$fr:$tl];
set xtics ($xmarks)
set ylabel "$4"
set xlabel "東京都 新規陽性患者数年代別 報告日毎推移"
cl(x) = (x < .5)? x * 2. / 3. : (x < 5. / 8.)? x * 8. / 3. - 1. : x * 2. / 3. + 1. / 4
plot for [i = C1:C2:-1] '$3.csv' using 0:i $CM rgb hsv2rgb(cl((i-C2)/$M.),CS,CV)
EOF
}
makePlot tky_ages cum tky_ages 人
makePlot tky_ages_raw no tky_ages 人
makePlot tky_ages_rate cum tky_ages_rate %
makePlot tky_ages_rr no tky_ages_rate "全数に対する割合 (%)"
